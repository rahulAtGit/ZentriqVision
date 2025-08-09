// Environment configuration for ZentriqVision mobile app

interface Environment {
  apiUrl: string;
  environment: 'development' | 'staging' | 'production';
  userPoolId: string;
  userPoolClientId: string;
  region: string;
  videoBucket: string;
}

const getEnvironment = (): Environment => {
  // In development, you can override this with environment variables
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod';
  const environment = (process.env.EXPO_PUBLIC_ENVIRONMENT as 'development' | 'staging' | 'production') || 'development';
  const userPoolId = process.env.EXPO_PUBLIC_USER_POOL_ID || 'us-east-1_your-user-pool-id';
  const userPoolClientId = process.env.EXPO_PUBLIC_USER_POOL_CLIENT_ID || 'your-user-pool-client-id';
  const region = process.env.EXPO_PUBLIC_AWS_REGION || 'us-east-1';
  const videoBucket = process.env.EXPO_PUBLIC_VIDEO_BUCKET || 'zentriqvision-videos';

  return {
    apiUrl,
    environment,
    userPoolId,
    userPoolClientId,
    region,
    videoBucket,
  };
};

export const env = getEnvironment();

// Helper function to get API endpoint
export const getApiEndpoint = (path: string): string => {
  return `${env.apiUrl}${path}`;
};

// Environment-specific configurations
export const config = {
  development: {
    apiUrl: 'https://your-dev-api-gateway-url.execute-api.us-east-1.amazonaws.com/dev',
    timeout: 10000,
    userPoolId: 'us-east-1_dev-user-pool-id',
    userPoolClientId: 'dev-user-pool-client-id',
  },
  staging: {
    apiUrl: 'https://your-staging-api-gateway-url.execute-api.us-east-1.amazonaws.com/staging',
    timeout: 15000,
    userPoolId: 'us-east-1_staging-user-pool-id',
    userPoolClientId: 'staging-user-pool-client-id',
  },
  production: {
    apiUrl: 'https://your-production-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod',
    timeout: 20000,
    userPoolId: 'us-east-1_prod-user-pool-id',
    userPoolClientId: 'prod-user-pool-client-id',
  },
};

export default env;
