import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

export class ZentriqVisionStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. S3 Bucket for video storage
    const videoBucket = new s3.Bucket(this, "ZentriqVisionVideoBucket", {
      bucketName: `zentriqvision-videos-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: "VideoRetention",
          expiration: cdk.Duration.days(30),
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(7),
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

    // TODO: We'll add more resources here step by step
    // 3. DynamoDB table for data storage
    // 4. Lambda functions for APIs
    // 5. API Gateway for REST APIs
    // 6. SNS topics for notifications
  }
}
