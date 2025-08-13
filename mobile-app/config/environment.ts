import { Platform } from "react-native";

// Environment configuration for ZentriqVision mobile app
export const env = {
  // API Configuration
  apiUrl: "https://8cnwe1mgf6.execute-api.us-east-1.amazonaws.com/prod",

  // AWS Cognito Configuration
  userPoolId: "us-east-1_PpVtV1Cq6",
  userPoolClientId: "nu93cus3nmpmvb0oi473pa7pq",

  // AWS Region
  region: "us-east-1",

  // S3 Bucket
  videoBucket:
    "zentriqvisionstack-zentriqvisionvideobucket68f2b96-b9xomlqxcw93",

  // Feature Flags
  useMockApi: false, // Disable mock API by default to use real backend
  enableDebugLogging: __DEV__, // Enable debug logging in development
  enableRealTimeUpdates: true, // Enable real-time updates for video processing
};

// Environment-specific configurations
export const config = {
  development: {
    ...env,
    // Development-specific overrides
    useMockApi: false, // Use real API for development
    enableDebugLogging: true,
    enableRealTimeUpdates: true,
  },
  staging: {
    ...env,
    useMockApi: false,
    enableDebugLogging: false,
    enableRealTimeUpdates: true,
  },
  production: {
    ...env,
    useMockApi: false,
    enableDebugLogging: false,
    enableRealTimeUpdates: true,
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

// API Endpoints configuration
export const apiEndpoints = {
  auth: {
    signup: "/auth/signup",
    signin: "/auth/signin",
    confirm: "/auth/confirm",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
    validate: "/auth/validate",
  },
  upload: "/upload",
  search: "/search",
  videos: "/videos",
  user: {
    profile: "/user/profile",
  },
};

// Upload configuration
export const uploadConfig = {
  maxVideoDuration: 300, // 5 minutes in seconds
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedVideoTypes: ["video/mp4", "video/quicktime", "video/x-msvideo"],
  presignedUrlExpiry: 3600, // 1 hour
};

// Search configuration
export const searchConfig = {
  defaultLimit: 50,
  maxLimit: 100,
  defaultFilters: {
    timeRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      end: new Date().toISOString(),
    },
  },
};

export default env;
