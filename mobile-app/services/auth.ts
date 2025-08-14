import React from "react";
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUserSession,
} from "amazon-cognito-identity-js";
import { env } from "../config/environment";
import * as SecureStore from "expo-secure-store";

export interface AuthUser {
  userId: string;
  email: string;
  givenName: string;
  phoneNumber?: string;
  orgId: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
}

export interface SignUpData {
  email: string;
  password: string;
  givenName: string;
  phoneNumber?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthError {
  code: string;
  message: string;
  name: string;
}

// Cognito User Pool configuration
const userPool = new CognitoUserPool({
  UserPoolId: env.userPoolId,
  ClientId: env.userPoolClientId,
});

// Storage keys for secure storage
const STORAGE_KEYS = {
  ACCESS_TOKEN: "zentriqvision_access_token",
  REFRESH_TOKEN: "zentriqvision_refresh_token",
  ID_TOKEN: "zentriqvision_id_token",
  USER_DATA: "zentriqvision_user_data",
};

class AuthService {
  private currentUser: AuthUser | null = null;

  /**
   * Sign up a new user with Cognito
   */
  async signUp(data: SignUpData): Promise<any> {
    try {
      const attributes: CognitoUserAttribute[] = [
        new CognitoUserAttribute({
          Name: "email",
          Value: data.email,
        }),
        new CognitoUserAttribute({
          Name: "given_name",
          Value: data.givenName,
        }),
        new CognitoUserAttribute({
          Name: "custom:orgId",
          Value: "default-org", // For now, assign all users to default-org
        }),
      ];

      if (data.phoneNumber) {
        attributes.push(
          new CognitoUserAttribute({
            Name: "phone_number",
            Value: data.phoneNumber,
          })
        );
      }

      return new Promise((resolve, reject) => {
        userPool.signUp(
          data.email,
          data.password,
          attributes,
          [],
          (error, result) => {
            if (error) {
              reject(this.handleCognitoError(error));
            } else {
              resolve({
                user: result?.user,
                userConfirmed: result?.userConfirmed,
              });
            }
          }
        );
      });
    } catch (error) {
      console.error("Sign up error:", error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Confirm sign up with verification code
   */
  async confirmSignUp(email: string, code: string): Promise<void> {
    try {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      return new Promise((resolve, reject) => {
        cognitoUser.confirmRegistration(code, true, (error) => {
          if (error) {
            reject(this.handleCognitoError(error));
          } else {
            resolve();
          }
        });
      });
    } catch (error) {
      console.error("Confirm sign up error:", error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign in user with Cognito
   */
  async signIn(data: SignInData): Promise<any> {
    try {
      const authenticationDetails = new AuthenticationDetails({
        Username: data.email,
        Password: data.password,
      });

      const cognitoUser = new CognitoUser({
        Username: data.email,
        Pool: userPool,
      });

      return new Promise((resolve, reject) => {
        cognitoUser.authenticateUser(authenticationDetails, {
          onSuccess: async (session: CognitoUserSession) => {
            try {
              // Store tokens securely
              await this.storeTokens(session);

              // Get user data from ID token
              const userData = await this.extractUserFromToken(
                session.getIdToken().getJwtToken()
              );
              this.currentUser = userData;

              // Store user data
              await SecureStore.setItemAsync(
                STORAGE_KEYS.USER_DATA,
                JSON.stringify(userData)
              );

              resolve({ user: userData });
            } catch (error) {
              reject(this.handleAuthError(error));
            }
          },
          onFailure: (error) => {
            reject(this.handleCognitoError(error));
          },
          newPasswordRequired: (userAttributes, requiredAttributes) => {
            reject({
              code: "NEW_PASSWORD_REQUIRED",
              message: "New password required",
              name: "NewPasswordRequiredException",
            });
          },
        });
      });
    } catch (error) {
      console.error("Sign in error:", error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    try {
      const currentCognitoUser = userPool.getCurrentUser();
      if (currentCognitoUser) {
        currentCognitoUser.signOut();
      }

      // Clear stored data
      this.currentUser = null;
      await this.clearStoredData();
    } catch (error) {
      console.error("Sign out error:", error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      if (this.currentUser) {
        return this.currentUser;
      }

      // Try to get from storage
      const storedUserData = await SecureStore.getItemAsync(
        STORAGE_KEYS.USER_DATA
      );
      if (storedUserData) {
        this.currentUser = JSON.parse(storedUserData);
        return this.currentUser;
      }

      // Try to get from Cognito session
      const currentCognitoUser = userPool.getCurrentUser();
      if (currentCognitoUser) {
        const session = await this.getCurrentSession();
        if (session) {
          const userData = await this.extractUserFromToken(
            session.getIdToken().getJwtToken()
          );
          this.currentUser = userData;
          await SecureStore.setItemAsync(
            STORAGE_KEYS.USER_DATA,
            JSON.stringify(userData)
          );
          return userData;
        }
      }

      return null;
    } catch (error) {
      console.error("Get current user error:", error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return false;

      // Check if tokens are still valid
      const session = await this.getCurrentSession();
      return !!session;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current session
   */
  async getCurrentSession(): Promise<CognitoUserSession | null> {
    try {
      const currentCognitoUser = userPool.getCurrentUser();
      if (!currentCognitoUser) return null;

      return new Promise((resolve, reject) => {
        currentCognitoUser.getSession((error: any, session: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(session);
          }
        });
      });
    } catch (error) {
      console.error("Get current session error:", error);
      return null;
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      return new Promise((resolve, reject) => {
        cognitoUser.forgotPassword({
          onSuccess: () => {
            resolve();
          },
          onFailure: (error) => {
            reject(this.handleCognitoError(error));
          },
        });
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Confirm forgot password
   */
  async confirmForgotPassword(
    email: string,
    code: string,
    newPassword: string
  ): Promise<void> {
    try {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      return new Promise((resolve, reject) => {
        cognitoUser.confirmPassword(code, newPassword, {
          onSuccess: () => {
            resolve();
          },
          onFailure: (error) => {
            reject(this.handleCognitoError(error));
          },
        });
      });
    } catch (error) {
      console.error("Confirm forgot password error:", error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Resend confirmation code
   */
  async resendConfirmationCode(email: string): Promise<void> {
    try {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      return new Promise((resolve, reject) => {
        cognitoUser.resendConfirmationCode((error) => {
          if (error) {
            reject(this.handleCognitoError(error));
          } else {
            resolve();
          }
        });
      });
    } catch (error) {
      console.error("Resend confirmation code error:", error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Get access token for API calls
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const session = await this.getCurrentSession();
      return session?.getAccessToken().getJwtToken() || null;
    } catch (error) {
      console.error("Get access token error:", error);
      return null;
    }
  }

  /**
   * Store tokens securely
   */
  private async storeTokens(session: CognitoUserSession): Promise<void> {
    try {
      await SecureStore.setItemAsync(
        STORAGE_KEYS.ACCESS_TOKEN,
        session.getAccessToken().getJwtToken()
      );
      await SecureStore.setItemAsync(
        STORAGE_KEYS.REFRESH_TOKEN,
        session.getRefreshToken().getToken()
      );
      await SecureStore.setItemAsync(
        STORAGE_KEYS.ID_TOKEN,
        session.getIdToken().getJwtToken()
      );
    } catch (error) {
      console.error("Error storing tokens:", error);
    }
  }

  /**
   * Clear stored data
   */
  private async clearStoredData(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.ID_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
    } catch (error) {
      console.error("Error clearing stored data:", error);
    }
  }

  /**
   * Extract user data from ID token
   */
  private async extractUserFromToken(idToken: string): Promise<AuthUser> {
    try {
      // Decode JWT token (without verification for now)
      const payload: any = JSON.parse(atob(idToken.split(".")[1]));

      return {
        userId: payload.sub || `user_${Date.now()}`,
        email: payload.email || "",
        givenName: payload.given_name || payload.name || "User",
        phoneNumber: payload.phone_number || undefined,
        orgId: payload["custom:orgId"] || "default-org",
        isEmailVerified: payload.email_verified === "true",
        isPhoneVerified: payload.phone_number_verified === "true",
      };
    } catch (error: any) {
      console.error("Error extracting user from token:", error);
      // Return default user if token parsing fails
      return {
        userId: `user_${Date.now()}`,
        email: "",
        givenName: "User",
        orgId: "default-org",
        isEmailVerified: false,
        isPhoneVerified: false,
      };
    }
  }

  /**
   * Handle Cognito-specific errors
   */
  private handleCognitoError(error: any): AuthError {
    const errorCode = error.code || error.name;
    const errorMessage = error.message || "An authentication error occurred";

    // Map Cognito error codes to user-friendly messages
    const errorMap: Record<string, string> = {
      UserNotFoundException: "User does not exist",
      NotAuthorizedException: "Incorrect email or password",
      UserNotConfirmedException: "Please confirm your email address",
      InvalidPasswordException: "Password does not meet requirements",
      CodeMismatchException: "Invalid confirmation code",
      ExpiredCodeException: "Confirmation code has expired",
      LimitExceededException: "Too many attempts. Please try again later",
      UsernameExistsException: "An account with this email already exists",
      InvalidParameterException: "Invalid input parameters",
    };

    return {
      code: errorCode,
      message: errorMap[errorCode] || errorMessage,
      name: error.name || "AuthError",
    };
  }

  /**
   * Handle general authentication errors
   */
  private handleAuthError(error: any): AuthError {
    if (error.code) {
      return error;
    }

    return {
      code: "UnknownError",
      message: error.message || "An unknown error occurred",
      name: "AuthError",
    };
  }
}

// Create singleton instance
export const authService = new AuthService();
