import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  AdminGetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { JwtPayload, verify } from "jsonwebtoken";
import jwksClient from "jwks-rsa";

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});
const userPoolId = process.env.USER_POOL_ID!;
const userPoolClientId = process.env.USER_POOL_CLIENT_ID!;

// JWT verification setup
const jwks = jwksClient({
  jwksUri: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${userPoolId}/.well-known/jwks.json`,
  cache: true,
  rateLimit: true,
});

interface SignUpRequest {
  email: string;
  password: string;
  givenName: string;
  phoneNumber?: string;
}

interface SignInRequest {
  email: string;
  password: string;
}

interface ConfirmSignUpRequest {
  email: string;
  code: string;
}

interface ForgotPasswordRequest {
  email: string;
}

interface ConfirmForgotPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

interface TokenValidationRequest {
  token: string;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { httpMethod, path, body } = event;

    // Route based on path and method
    if (httpMethod === "POST") {
      if (path.endsWith("/signup")) {
        return await handleSignUp(body);
      } else if (path.endsWith("/signin")) {
        return await handleSignIn(body);
      } else if (path.endsWith("/confirm")) {
        return await handleConfirmSignUp(body);
      } else if (path.endsWith("/forgot-password")) {
        return await handleForgotPassword(body);
      } else if (path.endsWith("/reset-password")) {
        return await handleConfirmForgotPassword(body);
      } else if (path.endsWith("/validate")) {
        return await handleTokenValidation(body);
      }
    }

    return createErrorResponse(404, "Endpoint not found");
  } catch (error) {
    console.error("Error in auth handler:", error);
    return createErrorResponse(500, "Internal server error");
  }
};

async function handleSignUp(
  body: string | null
): Promise<APIGatewayProxyResult> {
  try {
    if (!body) {
      return createErrorResponse(400, "Request body is required");
    }

    const { email, password, givenName, phoneNumber }: SignUpRequest =
      JSON.parse(body);

    if (!email || !password || !givenName) {
      return createErrorResponse(
        400,
        "Email, password, and givenName are required"
      );
    }

    const signUpCommand = new SignUpCommand({
      ClientId: userPoolClientId,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "given_name", Value: givenName },
        ...(phoneNumber ? [{ Name: "phone_number", Value: phoneNumber }] : []),
      ],
    });

    const result = await cognitoClient.send(signUpCommand);

    return createSuccessResponse({
      message:
        "User registered successfully. Please check your email for verification code.",
      userId: result.UserSub,
    });
  } catch (error: any) {
    console.error("Sign up error:", error);

    if (error.name === "UsernameExistsException") {
      return createErrorResponse(409, "User already exists");
    } else if (error.name === "InvalidPasswordException") {
      return createErrorResponse(400, "Password does not meet requirements");
    } else if (error.name === "InvalidParameterException") {
      return createErrorResponse(400, "Invalid parameters provided");
    }

    return createErrorResponse(500, "Failed to register user");
  }
}

async function handleSignIn(
  body: string | null
): Promise<APIGatewayProxyResult> {
  try {
    if (!body) {
      return createErrorResponse(400, "Request body is required");
    }

    const { email, password }: SignInRequest = JSON.parse(body);

    if (!email || !password) {
      return createErrorResponse(400, "Email and password are required");
    }

    const authCommand = new InitiateAuthCommand({
      ClientId: userPoolClientId,
      AuthFlow: "USER_PASSWORD_AUTH",
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    const result = await cognitoClient.send(authCommand);

    if (result.AuthenticationResult) {
      return createSuccessResponse({
        message: "Sign in successful",
        accessToken: result.AuthenticationResult.AccessToken,
        refreshToken: result.AuthenticationResult.RefreshToken,
        idToken: result.AuthenticationResult.IdToken,
        expiresIn: result.AuthenticationResult.ExpiresIn,
      });
    } else if (result.ChallengeName === "NEW_PASSWORD_REQUIRED") {
      return createErrorResponse(400, "New password required");
    } else if (result.ChallengeName === "SMS_MFA") {
      return createErrorResponse(400, "SMS MFA required");
    }

    return createErrorResponse(400, "Authentication failed");
  } catch (error: any) {
    console.error("Sign in error:", error);

    if (error.name === "UserNotConfirmedException") {
      return createErrorResponse(400, "Please confirm your email address");
    } else if (error.name === "NotAuthorizedException") {
      return createErrorResponse(401, "Incorrect email or password");
    } else if (error.name === "UserNotFoundException") {
      return createErrorResponse(404, "User not found");
    }

    return createErrorResponse(500, "Authentication failed");
  }
}

async function handleConfirmSignUp(
  body: string | null
): Promise<APIGatewayProxyResult> {
  try {
    if (!body) {
      return createErrorResponse(400, "Request body is required");
    }

    const { email, code }: ConfirmSignUpRequest = JSON.parse(body);

    if (!email || !code) {
      return createErrorResponse(
        400,
        "Email and verification code are required"
      );
    }

    const confirmCommand = new ConfirmSignUpCommand({
      ClientId: userPoolClientId,
      Username: email,
      ConfirmationCode: code,
    });

    await cognitoClient.send(confirmCommand);

    return createSuccessResponse({
      message: "Email confirmed successfully. You can now sign in.",
    });
  } catch (error: any) {
    console.error("Confirm sign up error:", error);

    if (error.name === "CodeMismatchException") {
      return createErrorResponse(400, "Invalid verification code");
    } else if (error.name === "ExpiredCodeException") {
      return createErrorResponse(400, "Verification code has expired");
    }

    return createErrorResponse(500, "Failed to confirm sign up");
  }
}

async function handleForgotPassword(
  body: string | null
): Promise<APIGatewayProxyResult> {
  try {
    if (!body) {
      return createErrorResponse(400, "Request body is required");
    }

    const { email }: ForgotPasswordRequest = JSON.parse(body);

    if (!email) {
      return createErrorResponse(400, "Email is required");
    }

    const forgotPasswordCommand = new ForgotPasswordCommand({
      ClientId: userPoolClientId,
      Username: email,
    });

    await cognitoClient.send(forgotPasswordCommand);

    return createSuccessResponse({
      message: "Password reset code sent to your email",
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);

    if (error.name === "UserNotFoundException") {
      return createErrorResponse(404, "User not found");
    }

    return createErrorResponse(500, "Failed to send reset code");
  }
}

async function handleConfirmForgotPassword(
  body: string | null
): Promise<APIGatewayProxyResult> {
  try {
    if (!body) {
      return createErrorResponse(400, "Request body is required");
    }

    const { email, code, newPassword }: ConfirmForgotPasswordRequest =
      JSON.parse(body);

    if (!email || !code || !newPassword) {
      return createErrorResponse(
        400,
        "Email, code, and newPassword are required"
      );
    }

    const confirmCommand = new ConfirmForgotPasswordCommand({
      ClientId: userPoolClientId,
      Username: email,
      ConfirmationCode: code,
      Password: newPassword,
    });

    await cognitoClient.send(confirmCommand);

    return createSuccessResponse({
      message:
        "Password reset successfully. You can now sign in with your new password.",
    });
  } catch (error: any) {
    console.error("Confirm forgot password error:", error);

    if (error.name === "CodeMismatchException") {
      return createErrorResponse(400, "Invalid reset code");
    } else if (error.name === "ExpiredCodeException") {
      return createErrorResponse(400, "Reset code has expired");
    } else if (error.name === "InvalidPasswordException") {
      return createErrorResponse(
        400,
        "New password does not meet requirements"
      );
    }

    return createErrorResponse(500, "Failed to reset password");
  }
}

async function handleTokenValidation(
  body: string | null
): Promise<APIGatewayProxyResult> {
  try {
    if (!body) {
      return createErrorResponse(400, "Request body is required");
    }

    const { token }: TokenValidationRequest = JSON.parse(body);

    if (!token) {
      return createErrorResponse(400, "Token is required");
    }

    // Verify JWT token
    const decoded = await verifyJWT(token);

    if (decoded) {
      return createSuccessResponse({
        message: "Token is valid",
        user: {
          userId: decoded.sub,
          email: decoded.email,
          givenName: decoded.given_name,
        },
      });
    }

    return createErrorResponse(401, "Invalid token");
  } catch (error: any) {
    console.error("Token validation error:", error);
    return createErrorResponse(401, "Token validation failed");
  }
}

async function verifyJWT(token: string): Promise<JwtPayload | null> {
  try {
    // Get the key ID from the token header
    const decodedHeader = JSON.parse(
      Buffer.from(token.split(".")[0], "base64").toString()
    );
    const kid = decodedHeader.kid;

    // Get the public key
    const key = await jwks.getSigningKey(kid);
    const publicKey = key.getPublicKey();

    // Verify the token
    const decoded = verify(token, publicKey, {
      algorithms: ["RS256"],
      issuer: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${userPoolId}`,
    });

    return decoded as JwtPayload;
  } catch (error) {
    console.error("JWT verification error:", error);
    return null;
  }
}

function createSuccessResponse(data: any): APIGatewayProxyResult {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    },
    body: JSON.stringify(data),
  };
}

function createErrorResponse(
  statusCode: number,
  message: string
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    },
    body: JSON.stringify({ error: message }),
  };
}
