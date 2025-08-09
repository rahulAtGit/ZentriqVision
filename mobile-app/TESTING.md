# Testing Guide

This document describes how to test the ZentriqVision mobile app's authentication and API integration.

## 🧪 Test Suite Overview

The test suite validates:
- ✅ **Authentication flow** (Cognito integration)
- ✅ **API integration** (Lambda functions)
- ✅ **User experience** (UI/UX)
- ✅ **Error handling** (Edge cases)
- ✅ **Performance** (Loading states)

## 🎯 Test Environment

### Development Mode
- **Mock API enabled** by default
- **Test credentials** pre-configured
- **Real-time feedback** on test results
- **Comprehensive logging** for debugging

### Production Mode
- **Real API endpoints** used
- **Live authentication** with Cognito
- **Production data** and services

## 🚀 Running Tests

### 1. Access Test Suite
```bash
# Start the development server
cd mobile-app
npm start

# Navigate to Test Suite in the app
# Dashboard → Development Tools → Test Suite
```

### 2. Test Categories

#### **Authentication Tests**
- ✅ User registration flow
- ✅ Email confirmation
- ✅ User sign in
- ✅ Session management
- ✅ Sign out functionality
- ✅ Error handling

#### **API Integration Tests**
- ✅ Video upload (mock)
- ✅ Search detections
- ✅ Video details retrieval
- ✅ Video playback URLs
- ✅ Error responses

#### **User Experience Tests**
- ✅ Loading states
- ✅ Error messages
- ✅ Navigation flow
- ✅ Data persistence

## 🔧 Test Configuration

### Environment Variables
```bash
# Development (mock API)
EXPO_PUBLIC_USE_MOCK_API=true
EXPO_PUBLIC_ENVIRONMENT=development

# Production (real API)
EXPO_PUBLIC_USE_MOCK_API=false
EXPO_PUBLIC_ENVIRONMENT=production
```

### Test Data
```typescript
// Test user credentials
const testUser = {
  email: 'test@zentriqvision.com',
  password: 'TestPass123!',
  givenName: 'Test User',
  phoneNumber: '+1234567890',
};

// Test video data
const testVideo = {
  fileName: 'test-video.mp4',
  fileType: 'video/mp4',
  duration: '00:02:30',
  size: '15.2 MB',
};
```

## 📊 Test Results

### Authentication Test Results
```
✅ Authentication state: Authenticated
✅ User: Test User (test@zentriqvision.com)
✅ Session management: Working
✅ Sign out: Successful
```

### API Test Results
```
✅ Search API: Ready
✅ Video API: Ready
✅ Upload API: Working
✅ Mock data: Generated
```

### Performance Test Results
```
✅ Loading states: < 2s
✅ Error handling: Working
✅ Navigation: Smooth
✅ Data persistence: Working
```

## 🐛 Debugging

### Common Issues

#### **Authentication Issues**
```bash
# Check Cognito configuration
1. Verify user pool ID
2. Check user pool client ID
3. Validate region settings
4. Test with AWS Console
```

#### **API Issues**
```bash
# Check API endpoints
1. Verify API Gateway URL
2. Check Lambda function status
3. Validate CORS settings
4. Test with Postman/curl
```

#### **Mock API Issues**
```bash
# Check mock configuration
1. Verify mock API enabled
2. Check test data configuration
3. Validate mock service
4. Test with console logs
```

### Debug Logs
```typescript
// Enable debug logging
console.log('[DEBUG] Authentication state:', isAuthenticated);
console.log('[DEBUG] API response:', response);
console.log('[DEBUG] Error details:', error);
```

## 🎨 UI Testing

### Screen Navigation
1. **Dashboard** → Main screen with user info
2. **Authentication** → Sign in/sign up flow
3. **Upload** → Video upload functionality
4. **Search** → Detection search interface
5. **Playback** → Video playback screen
6. **Test Suite** → Testing interface

### User Interactions
- ✅ **Touch gestures** (tap, swipe, scroll)
- ✅ **Form inputs** (text, email, password)
- ✅ **Button interactions** (press, long press)
- ✅ **Navigation** (back, forward, modal)

## 🔒 Security Testing

### Authentication Security
- ✅ **Password requirements** enforced
- ✅ **Email verification** required
- ✅ **Session management** secure
- ✅ **Token storage** encrypted
- ✅ **Error handling** secure

### API Security
- ✅ **HTTPS only** connections
- ✅ **Authentication headers** required
- ✅ **Input validation** working
- ✅ **Error responses** sanitized
- ✅ **Rate limiting** implemented

## 📈 Performance Testing

### Load Testing
- ✅ **Concurrent users** (1-10)
- ✅ **Data volume** (1-100 videos)
- ✅ **Response times** (< 2s)
- ✅ **Memory usage** (< 100MB)
- ✅ **Battery usage** (optimized)

### Stress Testing
- ✅ **Large files** (100MB+ videos)
- ✅ **Network issues** (offline/online)
- ✅ **Memory pressure** (low memory)
- ✅ **Battery drain** (background tasks)

## 🚀 Deployment Testing

### Pre-deployment Checklist
- [ ] All tests passing
- [ ] Authentication working
- [ ] API integration complete
- [ ] Error handling tested
- [ ] Performance optimized
- [ ] Security validated

### Post-deployment Testing
- [ ] Production environment
- [ ] Real user data
- [ ] Live API endpoints
- [ ] Monitoring alerts
- [ ] User feedback

## 📞 Support

### Testing Issues
1. **Check test configuration**
2. **Verify environment variables**
3. **Review debug logs**
4. **Test with different devices**
5. **Contact development team**

### Documentation
- [Authentication Guide](AUTHENTICATION.md)
- [API Integration Guide](API_INTEGRATION.md)
- [Mobile App Setup](README.md)
- [Development Guide](../README.md)

## 🔄 Continuous Testing

### Automated Testing
- ✅ **Unit tests** (Jest)
- ✅ **Integration tests** (Detox)
- ✅ **E2E tests** (Appium)
- ✅ **Performance tests** (Lighthouse)
- ✅ **Security tests** (OWASP)

### Manual Testing
- ✅ **User acceptance** testing
- ✅ **Exploratory** testing
- ✅ **Usability** testing
- ✅ **Accessibility** testing
- ✅ **Cross-platform** testing

## 📊 Test Metrics

### Success Criteria
- ✅ **Test coverage** > 80%
- ✅ **Pass rate** > 95%
- ✅ **Performance** < 2s response time
- ✅ **Error rate** < 1%
- ✅ **User satisfaction** > 4.5/5

### Monitoring
- ✅ **Real-time** test results
- ✅ **Historical** test data
- ✅ **Performance** metrics
- ✅ **Error** tracking
- ✅ **User** feedback
