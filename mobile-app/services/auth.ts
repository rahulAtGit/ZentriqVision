import { Auth } from 'aws-amplify';
import { CognitoUser, CognitoUserSession, ISignUpResult } from 'amazon-cognito-identity-js';

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
  /**
   * Sign up a new user
   */
  async signUp(data: SignUpData): Promise<ISignUpResult> {
    try {
      const { email, password, givenName, phoneNumber } = data;
      
      const signUpResult = await Auth.signUp({
        username: email,
        password,
        attributes: {
          email,
          given_name: givenName,
          ...(phoneNumber && { phone_number: phoneNumber }),
        },
      });

      return signUpResult;
    } catch (error) {
      console.error('Sign up error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Confirm sign up with verification code
   */
  async confirmSignUp(email: string, code: string): Promise<void> {
    try {
      await Auth.confirmSignUp(email, code);
    } catch (error) {
      console.error('Confirm sign up error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign in user
   */
  async signIn(data: SignInData): Promise<CognitoUserSession> {
    try {
      const { email, password } = data;
      
      const user = await Auth.signIn(email, password);
      return user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    try {
      await Auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const user = await Auth.currentAuthenticatedUser();
      if (!user) return null;

      const attributes = user.attributes;
      const groups = user.signInUserSession?.accessToken?.payload['cognito:groups'] || [];

      return {
        userId: user.username,
        email: attributes.email,
        givenName: attributes.given_name || attributes.name || '',
        phoneNumber: attributes.phone_number,
        orgId: groups[0] || 'default-org', // Use first group as orgId
        isEmailVerified: attributes.email_verified === 'true',
        isPhoneVerified: attributes.phone_number_verified === 'true',
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const user = await Auth.currentAuthenticatedUser();
      return !!user;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current session
   */
  async getCurrentSession(): Promise<CognitoUserSession | null> {
    try {
      const session = await Auth.currentSession();
      return session;
    } catch (error) {
      console.error('Get current session error:', error);
      return null;
    }
  }

  /**
   * Refresh session
   */
  async refreshSession(): Promise<CognitoUserSession> {
    try {
      const session = await Auth.currentSession();
      return await Auth.currentAuthenticatedUser().then(user => {
        return user.refreshSession(session.getRefreshToken(), (err, session) => {
          if (err) throw err;
          return session;
        });
      });
    } catch (error) {
      console.error('Refresh session error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      await Auth.forgotPassword(email);
    } catch (error) {
      console.error('Forgot password error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Confirm forgot password
   */
  async confirmForgotPassword(email: string, code: string, newPassword: string): Promise<void> {
    try {
      await Auth.forgotPasswordSubmit(email, code, newPassword);
    } catch (error) {
      console.error('Confirm forgot password error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Change password
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    try {
      await Auth.changePassword(await Auth.currentAuthenticatedUser(), oldPassword, newPassword);
    } catch (error) {
      console.error('Change password error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Resend confirmation code
   */
  async resendConfirmationCode(email: string): Promise<void> {
    try {
      await Auth.resendSignUp(email);
    } catch (error) {
      console.error('Resend confirmation code error:', error);
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
        message: error.message || 'Authentication error',
        name: error.name || 'AuthError',
      };
    }

    // Handle common error cases
    if (error.message?.includes('User does not exist')) {
      return {
        code: 'UserNotFoundException',
        message: 'User does not exist',
        name: 'AuthError',
      };
    }

    if (error.message?.includes('Incorrect username or password')) {
      return {
        code: 'NotAuthorizedException',
        message: 'Incorrect email or password',
        name: 'AuthError',
      };
    }

    if (error.message?.includes('User is not confirmed')) {
      return {
        code: 'UserNotConfirmedException',
        message: 'Please confirm your email address',
        name: 'AuthError',
      };
    }

    if (error.message?.includes('Password did not conform with policy')) {
      return {
        code: 'InvalidPasswordException',
        message: 'Password does not meet requirements',
        name: 'AuthError',
      };
    }

    return {
      code: 'UnknownError',
      message: error.message || 'An unknown error occurred',
      name: 'AuthError',
    };
  }
}

// Create singleton instance
export const authService = new AuthService();

// Export types
export type { AuthUser, SignUpData, SignInData, AuthError };
