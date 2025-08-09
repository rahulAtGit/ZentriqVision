import { Platform } from 'react-native';

// Environment configuration for ZentriqVision mobile app
export const env = {
  // API Configuration
  apiUrl: 'https://8cnwe1mgf6.execute-api.us-east-1.amazonaws.com/prod',
  
  // AWS Cognito Configuration
  userPoolId: 'us-east-1_PpVtV1Cq6',
  userPoolClientId: 'nu93cus3nmpmvb0oi473pa7pq',
  
  // AWS Region
  region: 'us-east-1',
  
  // S3 Bucket
  videoBucket: 'zentriqvisionstack-zentriqvisionvideobucket68f2b96-b9xomlqxcw93',
};

// Environment-specific configurations
export const config = {
  development: {
    ...env,
    // Development-specific overrides
    useMockApi: true, // Use mock API for development
  },
  staging: {
    ...env,
    useMockApi: false,
  },
  production: {
    ...env,
    useMockApi: false,
  },
};

// Get current environment (default to development)
export const getCurrentConfig = () => {
  if (__DEV__) {
    return config.development;
  }
  // In a real app, you'd check environment variables or build configs
  return config.development;
};

export default env;
