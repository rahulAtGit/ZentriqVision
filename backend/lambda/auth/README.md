# ZentriqVision Authentication Lambda

This Lambda function handles user authentication and authorization for the ZentriqVision application using AWS Cognito.

## Features

- **User Registration**: Sign up new users with email verification
- **User Authentication**: Sign in with email and password
- **Email Confirmation**: Confirm email addresses with verification codes
- **Password Reset**: Forgot password and reset functionality
- **Token Validation**: JWT token verification and user information extraction

## API Endpoints

### POST /auth/signup

Register a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "givenName": "John",
  "phoneNumber": "+1234567890" // Optional
}
```

**Response:**

```json
{
  "message": "User registered successfully. Please check your email for verification code.",
  "userId": "uuid-here"
}
```

### POST /auth/signin

Authenticate a user and get access tokens.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**

```json
{
  "message": "Sign in successful",
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token",
  "idToken": "jwt-id-token",
  "expiresIn": 3600
}
```

### POST /auth/confirm

Confirm email address with verification code.

**Request Body:**

```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

### POST /auth/forgot-password

Request password reset code.

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

### POST /auth/reset-password

Reset password with reset code.

**Request Body:**

```json
{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "NewSecurePassword123!"
}
```

### POST /auth/validate

Validate JWT token and get user information.

**Request Body:**

```json
{
  "token": "jwt-token-here"
}
```

## Environment Variables

- `USER_POOL_ID`: Cognito User Pool ID
- `USER_POOL_CLIENT_ID`: Cognito User Pool Client ID
- `AWS_REGION`: AWS region

## Dependencies

- `@aws-sdk/client-cognito-identity-provider`: AWS Cognito client
- `jsonwebtoken`: JWT verification
- `jwks-rsa`: JSON Web Key Set client for JWT verification

## Security Features

- JWT token validation using Cognito's public keys
- Password policy enforcement (handled by Cognito)
- Email verification required for account activation
- Secure token handling and validation

## Error Handling

The function provides detailed error messages for common scenarios:

- Invalid credentials
- User not confirmed
- Password policy violations
- Invalid verification codes
- Expired codes
- User not found

## Usage in Other Lambda Functions

This Lambda function provides the foundation for authentication. Other Lambda functions can use the shared `authHelper` utility to validate JWT tokens from the Authorization header.

Example:

```typescript
import { authHelper } from "../../shared/utils/auth";

// Validate JWT token
const authResult = await authHelper.validateToken(event.headers.Authorization);
if (!authResult.isValid) {
  return createErrorResponse(401, authResult.error || "Unauthorized");
}

// Access authenticated user information
const user = authResult.user;
```
