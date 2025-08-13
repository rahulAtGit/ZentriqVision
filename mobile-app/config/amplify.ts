import { Amplify } from "aws-amplify";
import { env, apiEndpoints } from "./environment";

// AWS Amplify configuration for ZentriqVision
const amplifyConfig = {
  Auth: {
    // Cognito User Pool configuration
    Cognito: {
      userPoolId: env.userPoolId,
      userPoolClientId: env.userPoolClientId,
      signUpVerificationMethod: "code", // 'code' | 'link'
      loginWith: {
        email: true,
        phone: true,
        username: false,
      },
      userAttributes: {
        email: {
          required: true,
        },
        givenName: {
          required: true,
        },
        phoneNumber: {
          required: false,
        },
      },
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    },
  },
  // API configuration
  API: {
    GraphQL: {
      endpoint: env.apiUrl,
      region: env.region,
      defaultAuthMode: "userPool",
    },
    REST: {
      endpoints: [
        {
          name: "ZentriqVisionAPI",
          endpoint: env.apiUrl,
          region: env.region,
          custom_header: async () => {
            // Add authentication headers
            return {
              "Content-Type": "application/json",
            };
          },
        },
      ],
    },
  },
  // Storage configuration (for S3)
  Storage: {
    AWSS3: {
      bucket: env.videoBucket,
      region: env.region,
    },
  },
};

// Initialize Amplify
export const initializeAmplify = () => {
  try {
    Amplify.configure(amplifyConfig);
    if (env.enableDebugLogging) {
      console.log("Amplify configured successfully");
      console.log("User Pool ID:", env.userPoolId);
      console.log("API URL:", env.apiUrl);
      console.log("S3 Bucket:", env.videoBucket);
    }
  } catch (error) {
    console.error("Failed to configure Amplify:", error);
  }
};

export default amplifyConfig;
