# API Integration Guide

This document describes how the ZentriqVision mobile app integrates with the backend APIs.

## 🏗 Architecture Overview

The mobile app uses a layered architecture for API integration:

```
┌─────────────────┐
│   Components    │  ← React Native screens
├─────────────────┤
│   Custom Hooks  │  ← useApi, useAuthStore
├─────────────────┤
│   API Service   │  ← apiService class
├─────────────────┤
│   Environment   │  ← Environment configuration
├─────────────────┤
│   Lambda APIs   │  ← AWS Lambda functions
└─────────────────┘
```

## 🔗 API Endpoints

### Base URL
```
https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod
```

### Available Endpoints

#### 1. Video Upload
```typescript
POST /upload
{
  "fileName": "video.mp4",
  "fileType": "video/mp4",
  "orgId": "org123",
  "userId": "user456"
}

Response:
{
  "videoId": "uuid",
  "presignedUrl": "https://...",
  "s3Key": "org123/videos/uuid/video.mp4",
  "status": "UPLOADING"
}
```

#### 2. Search Detections
```typescript
GET /search?color=blue&emotion=happy&limit=50

Response:
{
  "results": [...],
  "count": 25,
  "orgId": "org123",
  "filters": {...}
}
```

#### 3. Video Details
```typescript
GET /videos/{videoId}?orgId=org123

Response:
{
  "videoId": "uuid",
  "fileName": "video.mp4",
  "status": "PROCESSED",
  "detections": [...]
}
```

#### 4. Video Playback
```typescript
GET /videos/{videoId}/playback?orgId=org123

Response:
{
  "playbackUrl": "https://...",
  "videoDetails": {...}
}
```

## 🎣 Custom Hooks

### useApi Hook

The `useApi` hook provides React Query-powered API operations:

```typescript
import { useApi } from '../hooks/useApi';

const { useUploadVideo, useSearchDetections, useVideoDetails } = useApi();

// Upload video
const uploadMutation = useUploadVideo();
const result = await uploadMutation.mutateAsync({
  fileName: 'video.mp4',
  fileType: 'video/mp4'
});

// Search detections
const { data, isLoading, error } = useSearchDetections(filters, 50);

// Get video details
const { data: videoData } = useVideoDetails(videoId);
```

### useAuthStore Hook

Manages authentication state:

```typescript
import { useAuthStore } from '../hooks/useAuthStore';

const { user, signIn, signOut } = useAuthStore();
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the mobile-app directory:

```bash
# API Configuration
EXPO_PUBLIC_API_URL=https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod
EXPO_PUBLIC_ENVIRONMENT=development

# Optional: Override for different environments
EXPO_PUBLIC_DEV_API_URL=https://dev-api-url.execute-api.us-east-1.amazonaws.com/dev
EXPO_PUBLIC_STAGING_API_URL=https://staging-api-url.execute-api.us-east-1.amazonaws.com/staging
```

### Environment Configuration

The app automatically detects the environment and uses appropriate configurations:

```typescript
import { env } from '../config/environment';

console.log(env.apiUrl); // Current API URL
console.log(env.environment); // Current environment
```

## 📤 File Upload Process

### 1. Video Selection
- User selects video using `expo-image-picker`
- File validation (format, size)
- Progress tracking

### 2. Upload to S3
- Get presigned URL from API
- Upload file directly to S3
- Real-time progress updates

### 3. Processing
- Video automatically processed by Lambda
- AI analysis with Rekognition
- Results stored in DynamoDB

## 🔍 Search Functionality

### Filters Available
- **Color**: red, blue, green, black, white
- **Emotion**: happy, sad, neutral, angry
- **Age**: 0-17, 18-24, 25-34, 35-49, 50+
- **Mask**: true/false
- **Time Range**: start/end timestamps

### Search Implementation
```typescript
const filters = {
  color: 'blue',
  emotion: 'happy',
  ageBucket: '25-34'
};

const { data, isLoading } = useSearchDetections(filters, 50);
```

## 🎬 Video Playback

### Features
- Native video player with controls
- Detection overlays
- Real-time playback
- Detection details display

### Implementation
```typescript
const { data: videoData } = useVideoDetails(videoId);
const { data: playbackData } = useVideoPlayback(videoId);

const playbackUrl = playbackData?.playbackUrl;
const detections = videoData?.detections || [];
```

## 🛠 Error Handling

### API Errors
- Network errors
- Authentication errors
- Validation errors
- Server errors

### Error Display
```typescript
if (error) {
  return (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle" size={48} color="#FF3B30" />
      <Text style={styles.errorText}>Failed to load data</Text>
      <TouchableOpacity onPress={retry}>
        <Text>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}
```

## 🔒 Security

### Authentication
- JWT-based authentication
- Secure token storage
- Automatic token refresh

### Data Protection
- HTTPS-only API calls
- Input validation
- Secure file uploads

## 📊 Performance

### Caching
- React Query for data caching
- Automatic background refetching
- Optimistic updates

### Optimization
- Lazy loading
- Image optimization
- Efficient state management

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

## 🚀 Deployment

### Development
```bash
npm start
```

### Production Build
```bash
# iOS
expo build:ios

# Android
expo build:android
```

### Environment-specific Builds
```bash
# Development
EXPO_PUBLIC_ENVIRONMENT=development expo build:ios

# Staging
EXPO_PUBLIC_ENVIRONMENT=staging expo build:ios

# Production
EXPO_PUBLIC_ENVIRONMENT=production expo build:ios
```

## 🔄 Updates

### API Versioning
- Versioned API endpoints
- Backward compatibility
- Graceful degradation

### App Updates
- Over-the-air updates
- App store updates
- Automatic updates

## 📞 Support

For API integration issues:
1. Check the API documentation
2. Verify environment configuration
3. Test with Postman/curl
4. Check network connectivity
5. Review error logs

## 🔗 Related Documentation

- [Backend API Documentation](../backend/README.md)
- [Lambda Functions](../backend/lambda/README.md)
- [DynamoDB Design](../docs/dynamodb-design.md)
- [Mobile App Setup](README.md)
