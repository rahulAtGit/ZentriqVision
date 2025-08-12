import React from "react";

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

class AuthService {
  private mockUser: AuthUser | null = null;

  /**
   * Sign up a new user (mock)
   */
  async signUp(data: SignUpData): Promise<any> {
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Create mock user
      this.mockUser = {
        userId: `user_${Date.now()}`,
        email: data.email,
        givenName: data.givenName,
        phoneNumber: data.phoneNumber,
        orgId: "default-org",
        isEmailVerified: false,
        isPhoneVerified: false,
      };

      return { user: this.mockUser, userConfirmed: false };
    } catch (error) {
      console.error("Sign up error:", error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Confirm sign up with verification code (mock)
   */
  async confirmSignUp(email: string, code: string): Promise<void> {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (this.mockUser) {
        this.mockUser.isEmailVerified = true;
      }
    } catch (error) {
      console.error("Confirm sign up error:", error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign in user (mock)
   */
  async signIn(data: SignInData): Promise<any> {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // For demo purposes, accept any email/password
      this.mockUser = {
        userId: `user_${Date.now()}`,
        email: data.email,
        givenName: "Demo User",
        phoneNumber: "+1234567890",
        orgId: "demo-org",
        isEmailVerified: true,
        isPhoneVerified: true,
      };

      return { user: this.mockUser };
    } catch (error) {
      console.error("Sign in error:", error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign out user (mock)
   */
  async signOut(): Promise<void> {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      this.mockUser = null;
    } catch (error) {
      console.error("Sign out error:", error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Get current authenticated user (mock)
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.mockUser;
    } catch (error) {
      console.error("Get current user error:", error);
      return null;
    }
  }

  /**
   * Check if user is authenticated (mock)
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      return !!this.mockUser;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current session (mock)
   */
  async getCurrentSession(): Promise<any> {
    try {
      if (!this.mockUser) return null;
      return { user: this.mockUser };
    } catch (error) {
      console.error("Get current session error:", error);
      return null;
    }
  }

  /**
   * Forgot password (mock)
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log(`Password reset email sent to ${email}`);
    } catch (error) {
      console.error("Forgot password error:", error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Confirm forgot password (mock)
   */
  async confirmForgotPassword(
    email: string,
    code: string,
    newPassword: string
  ): Promise<void> {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Password reset successful");
    } catch (error) {
      console.error("Confirm forgot password error:", error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Change password (mock)
   */
  async changePassword(
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Password changed successfully");
    } catch (error) {
      console.error("Change password error:", error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Resend confirmation code (mock)
   */
  async resendConfirmationCode(email: string): Promise<void> {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log(`Confirmation code resent to ${email}`);
    } catch (error) {
      console.error("Resend confirmation code error:", error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(error: any): AuthError {
    if (error.code) {
      return {
        code: error.code,
        message: error.message || "Authentication error",
        name: error.name || "AuthError",
      };
    }

    // Handle common error cases
    if (error.message?.includes("User does not exist")) {
      return {
        code: "UserNotFoundException",
        message: "User does not exist",
        name: "AuthError",
      };
    }

    if (error.message?.includes("Incorrect username or password")) {
      return {
        code: "NotAuthorizedException",
        message: "Incorrect email or password",
        name: "AuthError",
      };
    }

    if (error.message?.includes("User is not confirmed")) {
      return {
        code: "UserNotConfirmedException",
        message: "Please confirm your email address",
        name: "AuthError",
      };
    }

    if (error.message?.includes("Password did not conform with policy")) {
      return {
        code: "InvalidPasswordException",
        message: "Password does not meet requirements",
        name: "AuthError",
      };
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
