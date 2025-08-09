# Authentication Integration Guide

This document describes how the ZentriqVision mobile app integrates with AWS Cognito for authentication.

## 🏗 Architecture Overview

The authentication system uses AWS Cognito with the following components:

```
┌─────────────────┐
│   Components    │  ← React Native screens
├─────────────────┤
│   Auth Store    │  ← Zustand state management
├─────────────────┤
│   Auth Service  │  ← AWS Amplify integration
├─────────────────┤
│   Secure Store  │  ← Token storage
├─────────────────┤
│   AWS Cognito   │  ← Authentication service
└─────────────────┘
```

## 🔐 Authentication Flow

### 1. User Registration
```typescript
// User signs up with email, password, and name
const signUpData = {
  email: 'user@example.com',
  password: 'SecurePass123!',
  givenName: 'John Doe',
  phoneNumber: '+1234567890' // Optional
};

await authService.signUp(signUpData);
```

### 2. Email Confirmation
```typescript
// User receives confirmation code via email
const confirmationCode = '123456';
await authService.confirmSignUp(email, confirmationCode);
```

### 3. User Sign In
```typescript
// User signs in with email and password
const signInData = {
  email: 'user@example.com',
  password: 'SecurePass123!'
};

await authService.signIn(signInData);
```

### 4. Session Management
```typescript
// Check if user is authenticated
const isAuthenticated = await authService.isAuthenticated();

// Get current user
const user = await authService.getCurrentUser();

// Get current session
const session = await authService.getCurrentSession();
```

### 5. Sign Out
```typescript
// User signs out
await authService.signOut();
```

## 🎣 Custom Hooks

### useAuthStore Hook

The `useAuthStore` hook provides authentication state management:

```typescript
import { useAuthStore } from '../hooks/useAuthStore';

const { 
  user, 
  isAuthenticated, 
  isLoading, 
  error,
  signIn, 
  signUp, 
  signOut,
  clearError 
} = useAuthStore();

// Check authentication status
if (isLoading) {
  return <LoadingScreen />;
}

if (!isAuthenticated) {
  return <AuthScreen />;
}

// User is authenticated
return <Dashboard user={user} />;
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the mobile-app directory:

```bash
# AWS Cognito Configuration
EXPO_PUBLIC_USER_POOL_ID=us-east-1_your-user-pool-id
EXPO_PUBLIC_USER_POOL_CLIENT_ID=your-user-pool-client-id
EXPO_PUBLIC_AWS_REGION=us-east-1

# API Configuration
EXPO_PUBLIC_API_URL=https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod

# Environment
EXPO_PUBLIC_ENVIRONMENT=development
```

### Amplify Configuration

The app automatically configures AWS Amplify:

```typescript
import { initializeAmplify } from '../config/amplify';

// Initialize Amplify with Cognito configuration
initializeAmplify();
```

## 🔒 Security Features

### Password Requirements
- Minimum 8 characters
- Must contain uppercase letters
- Must contain lowercase letters
- Must contain numbers
- Must contain special characters

### Token Management
- Access tokens stored securely
- Refresh tokens managed automatically
- Token expiration handling
- Secure token storage using Expo SecureStore

### User Attributes
- Email (required, verified)
- Given name (required)
- Phone number (optional)
- Organization ID (auto-assigned)

## 🎨 UI Components

### Authentication Screen
- Sign in form
- Sign up form
- Email confirmation
- Password reset
- Error handling
- Loading states

### User Profile
- User information display
- Account settings
- Sign out functionality

## 🔄 State Management

### Authentication State
```typescript
interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}
```

### User Interface
```typescript
interface AuthUser {
  userId: string;
  email: string;
  givenName: string;
  phoneNumber?: string;
  orgId: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
}
```

## 🛠 Error Handling

### Common Errors
- **UserNotFoundException**: User does not exist
- **NotAuthorizedException**: Incorrect credentials
- **UserNotConfirmedException**: Email not confirmed
- **InvalidPasswordException**: Password doesn't meet requirements
- **UsernameExistsException**: User already exists

### Error Display
```typescript
if (error) {
  return (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle" size={20} color="#FF3B30" />
      <Text style={styles.errorText}>{error}</Text>
    </View>
  );
}
```

## 🔐 Secure Storage

### Token Storage
- Access tokens stored securely
- Refresh tokens managed automatically
- User data cached locally
- Secure storage using Expo SecureStore

### Storage Keys
```typescript
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'zentriqvision_access_token',
  REFRESH_TOKEN: 'zentriqvision_refresh_token',
  USER_DATA: 'zentriqvision_user_data',
  AUTH_STATE: 'zentriqvision_auth_state',
};
```

## 🚀 Deployment

### Development
```bash
# Set environment variables
EXPO_PUBLIC_ENVIRONMENT=development
EXPO_PUBLIC_USER_POOL_ID=dev-user-pool-id
EXPO_PUBLIC_USER_POOL_CLIENT_ID=dev-client-id

# Start development server
npm start
```

### Production
```bash
# Set environment variables
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_USER_POOL_ID=prod-user-pool-id
EXPO_PUBLIC_USER_POOL_CLIENT_ID=prod-client-id

# Build for production
expo build:ios
expo build:android
```

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### Manual Testing
1. Test user registration
2. Test email confirmation
3. Test user sign in
4. Test session persistence
5. Test sign out
6. Test error handling

## 🔄 Updates

### Token Refresh
- Automatic token refresh
- Background refresh handling
- Session persistence
- Offline support

### User Management
- User profile updates
- Password changes
- Account deletion
- Multi-factor authentication

## 📞 Support

For authentication issues:
1. Check Cognito configuration
2. Verify environment variables
3. Test with AWS Console
4. Review error logs
5. Check network connectivity

## 🔗 Related Documentation

- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [Expo SecureStore Documentation](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [React Native Authentication](https://reactnative.dev/docs/security)
- [Mobile App Setup](README.md)
- [API Integration](API_INTEGRATION.md)
