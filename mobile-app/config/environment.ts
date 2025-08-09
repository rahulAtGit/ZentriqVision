// Environment configuration for ZentriqVision mobile app

interface Environment {
  apiUrl: string;
  environment: 'development' | 'staging' | 'production';
}

const getEnvironment = (): Environment => {
  // In development, you can override this with environment variables
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod';
  const environment = (process.env.EXPO_PUBLIC_ENVIRONMENT as 'development' | 'staging' | 'production') || 'development';

  return {
    apiUrl,
    environment,
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
  },
  staging: {
    apiUrl: 'https://your-staging-api-gateway-url.execute-api.us-east-1.amazonaws.com/staging',
    timeout: 15000,
  },
  production: {
    apiUrl: 'https://your-production-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod',
    timeout: 20000,
  },
};

export default env;
