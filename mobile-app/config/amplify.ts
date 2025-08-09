import { Amplify } from 'aws-amplify';
import { env } from './environment';

// AWS Amplify configuration for ZentriqVision
const amplifyConfig = {
  Auth: {
    // Cognito User Pool configuration
    Cognito: {
      userPoolId: env.userPoolId || 'us-east-1_your-user-pool-id',
      userPoolClientId: env.userPoolClientId || 'your-user-pool-client-id',
      signUpVerificationMethod: 'code', // 'code' | 'link'
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
      region: env.region || 'us-east-1',
      defaultAuthMode: 'userPool',
    },
    REST: {
      endpoints: [
        {
          name: 'ZentriqVisionAPI',
          endpoint: env.apiUrl,
          region: env.region || 'us-east-1',
          custom_header: async () => {
            // Add authentication headers
            return {
              'Content-Type': 'application/json',
            };
          },
        },
      ],
    },
  },
  // Storage configuration (for S3)
  Storage: {
    AWSS3: {
      bucket: env.videoBucket || 'zentriqvision-videos',
      region: env.region || 'us-east-1',
    },
  },
};

// Initialize Amplify
export const initializeAmplify = () => {
  try {
    Amplify.configure(amplifyConfig);
    console.log('Amplify configured successfully');
  } catch (error) {
    console.error('Failed to configure Amplify:', error);
  }
};

export default amplifyConfig;
