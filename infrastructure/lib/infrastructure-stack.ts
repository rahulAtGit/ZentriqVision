import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import * as sns from "aws-cdk-lib/aws-sns";
import * as sns_subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import { Construct } from "constructs";

export class ZentriqVisionStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. S3 Bucket for video storage
    const videoBucket = new s3.Bucket(this, "ZentriqVisionVideoBucket", {
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: "VideoRetention",
          expiration: cdk.Duration.days(60),
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
          ],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
        },
      ],
    });

    // 2. Cognito User Pool for authentication
    const userPool = new cognito.UserPool(this, "ZentriqVisionUserPool", {
      userPoolName: "zentriqvision-users",
      selfSignUpEnabled: true,
      signInAliases: {
        phone: true,
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        givenName: {
          required: true,
          mutable: true,
        },
      },
      customAttributes: {
        orgId: new cognito.StringAttribute({
          mutable: true,
          minLen: 1,
          maxLen: 256,
        }),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      userVerification: {
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },
    });

    // User Pool Client for mobile app
    const userPoolClient = new cognito.UserPoolClient(
      this,
      "ZentriqVisionUserPoolClient",
      {
        userPool,
        generateSecret: false,
        authFlows: {
          adminUserPassword: true,
          userPassword: true,
          userSrp: true,
        },
        oAuth: {
          flows: {
            implicitCodeGrant: true,
          },
          scopes: [
            cognito.OAuthScope.EMAIL,
            cognito.OAuthScope.OPENID,
            cognito.OAuthScope.PROFILE,
          ],
          callbackUrls: ["exp://localhost:8081", "exp://192.168.1.100:8081"],
        },
      }
    );

    // 3. DynamoDB table for data storage (Single-Table Design)
    const dataTable = new dynamodb.Table(this, "ZentriqVisionDataTable", {
      tableName: "zentriqvision-data",
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
    });

    // GSI1 for attribute-based queries (color, emotion, age, etc.)
    dataTable.addGlobalSecondaryIndex({
      indexName: "AttributeIndex",
      partitionKey: { name: "GSI1PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "GSI1SK", type: dynamodb.AttributeType.STRING },
    });

    // GSI2 for video-based queries
    dataTable.addGlobalSecondaryIndex({
      indexName: "VideoIndex",
      partitionKey: { name: "GSI2PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "GSI2SK", type: dynamodb.AttributeType.STRING },
    });

    // GSI3 for time-based queries
    dataTable.addGlobalSecondaryIndex({
      indexName: "TimeIndex",
      partitionKey: { name: "GSI3PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "GSI3SK", type: dynamodb.AttributeType.STRING },
    });

    // 4. SNS Topic for video processing events
    const videoProcessingTopic = new sns.Topic(this, "VideoProcessingTopic", {
      topicName: "zentriqvision-video-processing",
    });

    // 5. Lambda functions
    // Upload Lambda function
    const uploadLambda = new lambda.Function(this, "UploadLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "bundle.handler",
      code: lambda.Code.fromAsset("../backend/lambda/upload/dist"),
      environment: {
        VIDEO_BUCKET: videoBucket.bucketName,
        DATA_TABLE: dataTable.tableName,
        USER_POOL_ID: userPool.userPoolId,
        USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      },
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
    });

    // Search Lambda function
    const searchLambda = new lambda.Function(this, "SearchLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "bundle.handler",
      code: lambda.Code.fromAsset("../backend/lambda/search/dist"),
      environment: {
        DATA_TABLE: dataTable.tableName,
        USER_POOL_ID: userPool.userPoolId,
        USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      },
      timeout: cdk.Duration.minutes(1),
      memorySize: 512,
    });

    // Auth Lambda function
    const authLambda = new lambda.Function(this, "AuthLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "bundle.handler",
      code: lambda.Code.fromAsset("../backend/lambda/auth/dist"),
      environment: {
        USER_POOL_ID: userPool.userPoolId,
        USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      },
      timeout: cdk.Duration.minutes(1),
      memorySize: 512,
    });

    // Playback Lambda function
    const playbackLambda = new lambda.Function(this, "PlaybackLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "bundle.handler",
      code: lambda.Code.fromAsset("../backend/lambda/playback/dist"),
      environment: {
        VIDEO_BUCKET: videoBucket.bucketName,
        DATA_TABLE: dataTable.tableName,
        USER_POOL_ID: userPool.userPoolId,
        USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      },
      timeout: cdk.Duration.minutes(1),
      memorySize: 512,
    });

    // User Profile Lambda function
    const userLambda = new lambda.Function(this, "UserLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "bundle.handler",
      code: lambda.Code.fromAsset("../backend/lambda/user/dist"),
      environment: {
        DATA_TABLE: dataTable.tableName,
        USER_POOL_ID: userPool.userPoolId,
        USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      },
      timeout: cdk.Duration.minutes(1),
      memorySize: 512,
    });

    // Add post-confirmation trigger to automatically create user profile
    const postConfirmationLambda = new lambda.Function(
      this,
      "PostConfirmationLambda",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "index.handler",
        code: lambda.Code.fromInline(`
        const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
        const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
        
        const client = new DynamoDBClient();
        const docClient = DynamoDBDocumentClient.from(client);
        
        exports.handler = async (event) => {
          try {
            const { userName, request } = event;
            const { userAttributes } = request;
            
            // Create user profile in DynamoDB
            const userProfile = {
              PK: \`USER#\${userName}\`,
              SK: \`PROFILE#\${userName}\`,
              userId: userName,
              email: userAttributes.email,
              givenName: userAttributes.given_name || 'User',
              phoneNumber: userAttributes.phone_number,
              orgId: userAttributes['custom:orgId'] || 'default-org',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            
            await docClient.send(new PutCommand({
              TableName: process.env.DATA_TABLE,
              Item: userProfile
            }));
            
            console.log('User profile created successfully:', userName);
            return event;
          } catch (error) {
            console.error('Error creating user profile:', error);
            return event;
          }
        };
      `),
        environment: {
          DATA_TABLE: dataTable.tableName,
        },
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
      }
    );

    userPool.addTrigger(
      cognito.UserPoolOperation.POST_CONFIRMATION,
      postConfirmationLambda
    );

    // Create Rekognition service role
    const rekognitionRole = new iam.Role(this, "RekognitionServiceRole", {
      assumedBy: new iam.ServicePrincipal("rekognition.amazonaws.com"),
      description: "Role for Rekognition to access S3 and other resources",
    });

    // Grant Rekognition role MAXIMUM S3 permissions for comprehensive access
    videoBucket.grantRead(rekognitionRole);

    // Additional comprehensive S3 permissions that Rekognition might need
    rekognitionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          // Object operations
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:GetObjectAcl",
          "s3:GetObjectTagging",
          "s3:GetObjectTorrent",
          "s3:GetObjectRetention",
          "s3:GetObjectLegalHold",

          // Bucket operations
          "s3:ListBucket",
          "s3:GetBucketLocation",
          "s3:GetBucketVersioning",
          "s3:GetBucketPolicy",
          "s3:GetBucketAcl",
          "s3:GetBucketTagging",
          "s3:GetBucketNotification",
          "s3:GetBucketRequestPayment",
          "s3:GetBucketLogging",
          "s3:GetBucketLifecycle",
          "s3:GetBucketReplication",
          "s3:GetBucketAccelerateConfiguration",
          "s3:GetBucketEncryption",
          "s3:GetBucketIntelligentTieringConfiguration",
          "s3:GetBucketAnalyticsConfiguration",
          "s3:GetBucketMetricsConfiguration",
          "s3:GetBucketOwnershipControls",

          // List and describe operations
          "s3:ListBucketVersions",
          "s3:ListBucketMultipartUploads",
          "s3:ListMultipartUploadParts",

          // Head operations (for metadata)
          "s3:HeadObject",
          "s3:HeadBucket",
        ],
        resources: [videoBucket.bucketArn, `${videoBucket.bucketArn}/*`],
      })
    );

    // Grant SNS permissions to Rekognition role for notifications
    videoProcessingTopic.grantPublish(rekognitionRole);

    // Additional permissions that Rekognition might need
    rekognitionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          // CloudWatch permissions for logging
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",

          // Additional Rekognition permissions
          "rekognition:DescribeVideoAnalysis",
          "rekognition:ListFaces",
          "rekognition:GetFaceDetection",
          "rekognition:StartFaceDetection",
        ],
        resources: ["*"],
      })
    );

    // Video Processing Lambda function (Python)
    const processingLambda = new lambda.Function(this, "ProcessingLambda", {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../backend/lambda/processing"),
      environment: {
        VIDEO_BUCKET: videoBucket.bucketName,
        DATA_TABLE: dataTable.tableName,
        SNS_TOPIC_ARN: videoProcessingTopic.topicArn,
        MEDIACONVERT_ENDPOINT: "https://mediaconvert.us-east-1.amazonaws.com",
        REKOGNITION_ROLE_ARN: rekognitionRole.roleArn,
      },
      timeout: cdk.Duration.minutes(15),
      memorySize: 1024,
    });

    // Add SNS subscription for Processing Lambda to receive Rekognition notifications
    videoProcessingTopic.addSubscription(
      new sns_subscriptions.LambdaSubscription(processingLambda)
    );

    // 6. API Gateway
    const api = new apigateway.RestApi(this, "ZentriqVisionApi", {
      restApiName: "ZentriqVision API",
      description: "API for ZentriqVision video surveillance app",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["Content-Type", "Authorization"],
      },
    });

    // API Resources and Methods
    const authResource = api.root.addResource("auth");
    const uploadResource = api.root.addResource("upload");
    const searchResource = api.root.addResource("search");
    const videosResource = api.root.addResource("videos");
    const userResource = api.root.addResource("user");

    // Auth endpoints
    authResource
      .addResource("signup")
      .addMethod("POST", new apigateway.LambdaIntegration(authLambda));

    authResource
      .addResource("signin")
      .addMethod("POST", new apigateway.LambdaIntegration(authLambda));

    authResource
      .addResource("confirm")
      .addMethod("POST", new apigateway.LambdaIntegration(authLambda));

    authResource
      .addResource("forgot-password")
      .addMethod("POST", new apigateway.LambdaIntegration(authLambda));

    authResource
      .addResource("reset-password")
      .addMethod("POST", new apigateway.LambdaIntegration(authLambda));

    authResource
      .addResource("validate")
      .addMethod("POST", new apigateway.LambdaIntegration(authLambda));

    // Upload endpoint
    uploadResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(uploadLambda)
    );

    // Search endpoint
    searchResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(searchLambda)
    );

    // Videos list endpoint
    videosResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(searchLambda)
    );

    // Video playback endpoint
    videosResource
      .addResource("{videoId}")
      .addMethod("GET", new apigateway.LambdaIntegration(playbackLambda));

    // User profile endpoints
    userResource.addMethod("GET", new apigateway.LambdaIntegration(userLambda));
    userResource.addMethod("PUT", new apigateway.LambdaIntegration(userLambda));

    // Health check endpoint
    api.root.addMethod(
      "GET",
      new apigateway.LambdaIntegration(
        new lambda.Function(this, "HealthCheckLambda", {
          runtime: lambda.Runtime.NODEJS_18_X,
          handler: "index.handler",
          code: lambda.Code.fromInline(`
            exports.handler = async (event) => {
              return {
                statusCode: 200,
                headers: {
                  "Content-Type": "application/json",
                  "Access-Control-Allow-Origin": "*",
                  "Access-Control-Allow-Headers": "Content-Type,Authorization",
                  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
                },
                body: JSON.stringify({
                  status: "healthy",
                  timestamp: new Date().toISOString(),
                  service: "ZentriqVision API"
                })
              };
            };
          `),
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
        })
      )
    );

    // 7. Grant permissions
    videoBucket.grantReadWrite(uploadLambda);
    videoBucket.grantReadWrite(processingLambda);
    videoBucket.grantRead(playbackLambda);
    dataTable.grantReadWriteData(uploadLambda);
    dataTable.grantReadWriteData(processingLambda);
    dataTable.grantReadData(searchLambda);
    dataTable.grantReadData(playbackLambda);
    dataTable.grantReadWriteData(userLambda);

    // Grant DynamoDB permissions to post-confirmation Lambda
    dataTable.grantWriteData(postConfirmationLambda);
    videoProcessingTopic.grantPublish(processingLambda);

    // Create MediaConvert service role
    const mediaConvertRole = new iam.Role(this, "MediaConvertServiceRole", {
      assumedBy: new iam.ServicePrincipal("mediaconvert.amazonaws.com"),
      description: "Role for MediaConvert to access S3 and other resources",
    });

    // Grant MediaConvert role comprehensive permissions
    videoBucket.grantReadWrite(mediaConvertRole);
    dataTable.grantReadWriteData(mediaConvertRole);

    // Grant SNS permissions to MediaConvert role for notifications
    videoProcessingTopic.grantPublish(mediaConvertRole);

    // Grant ALL necessary permissions to Processing Lambda in one comprehensive policy
    processingLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          // MediaConvert permissions
          "mediaconvert:CreateJob",
          "mediaconvert:GetJob",
          "mediaconvert:DescribeEndpoints",
          "mediaconvert:ListJobs",

          // Rekognition permissions
          "rekognition:StartFaceDetection",
          "rekognition:GetFaceDetection",
          "rekognition:ListFaces",
          "rekognition:DescribeVideoAnalysis",

          // SNS permissions (for notifications)
          "sns:Publish",
          "sns:GetTopicAttributes",

          // IAM permissions (for passing roles)
          "iam:PassRole",

          // CloudWatch Logs (for Lambda logging)
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
        resources: ["*"],
      })
    );

    // Grant specific IAM PassRole permissions for our service roles
    processingLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["iam:PassRole"],
        resources: [mediaConvertRole.roleArn, rekognitionRole.roleArn],
      })
    );

    // Grant Cognito permissions to auth Lambda
    // Note: The auth Lambda will use the default execution role permissions

    // 8. S3 Event trigger for video processing
    videoBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(processingLambda),
      { prefix: "videos/" }  // Trigger for all files in videos/ folder
    );

    // 9. Stack Outputs for mobile app configuration
    new cdk.CfnOutput(this, "ApiGatewayUrl", {
      value: api.url,
      description: "API Gateway URL for mobile app",
      exportName: "ZentriqVisionApiGatewayUrl",
    });

    new cdk.CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
      description: "Cognito User Pool ID for mobile app",
      exportName: "ZentriqVisionUserPoolId",
    });

    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: userPoolClient.userPoolClientId,
      description: "Cognito User Pool Client ID for mobile app",
      exportName: "ZentriqVisionUserPoolClientId",
    });

    new cdk.CfnOutput(this, "VideoBucketName", {
      value: videoBucket.bucketName,
      description: "S3 Bucket name for video storage",
      exportName: "ZentriqVisionVideoBucketName",
    });

    new cdk.CfnOutput(this, "DataTableName", {
      value: dataTable.tableName,
      description: "DynamoDB table name for data storage",
      exportName: "ZentriqVisionDataTableName",
    });

    new cdk.CfnOutput(this, "Region", {
      value: this.region,
      description: "AWS region where resources are deployed",
      exportName: "ZentriqVisionRegion",
    });
  }
}
