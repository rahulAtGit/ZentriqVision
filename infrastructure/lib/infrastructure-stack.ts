import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import * as sns from "aws-cdk-lib/aws-sns";
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
      handler: "index.handler",
      code: lambda.Code.fromAsset("../backend/lambda/upload"),
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
      handler: "index.handler",
      code: lambda.Code.fromAsset("../backend/lambda/search"),
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
      handler: "index.handler",
      code: lambda.Code.fromAsset("../backend/lambda/auth"),
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
      handler: "index.handler",
      code: lambda.Code.fromAsset("../backend/lambda/playback"),
      environment: {
        VIDEO_BUCKET: videoBucket.bucketName,
        DATA_TABLE: dataTable.tableName,
        USER_POOL_ID: userPool.userPoolId,
        USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      },
      timeout: cdk.Duration.minutes(1),
      memorySize: 512,
    });

    // Video Processing Lambda function (Python)
    const processingLambda = new lambda.Function(this, "ProcessingLambda", {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../backend/lambda/processing"),
      environment: {
        VIDEO_BUCKET: videoBucket.bucketName,
        DATA_TABLE: dataTable.tableName,
        SNS_TOPIC_ARN: videoProcessingTopic.topicArn,
      },
      timeout: cdk.Duration.minutes(15),
      memorySize: 1024,
    });

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

    // Video playback endpoint
    videosResource
      .addResource("{videoId}")
      .addMethod("GET", new apigateway.LambdaIntegration(playbackLambda));

    // 7. Grant permissions
    videoBucket.grantReadWrite(uploadLambda);
    videoBucket.grantReadWrite(processingLambda);
    videoBucket.grantRead(playbackLambda);
    dataTable.grantReadWriteData(uploadLambda);
    dataTable.grantReadWriteData(processingLambda);
    dataTable.grantReadData(searchLambda);
    dataTable.grantReadData(playbackLambda);
    videoProcessingTopic.grantPublish(processingLambda);

    // Grant Cognito permissions to auth Lambda
    // Note: The auth Lambda will use the default execution role permissions

    // 8. S3 Event trigger for video processing
    videoBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(processingLambda),
      { suffix: ".mp4" }
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
