import { JwtPayload, verify } from "jsonwebtoken";
import jwksClient from "jwks-rsa";

export interface AuthenticatedUser {
  userId: string;
  email: string;
  givenName: string;
  orgId?: string;
}

export interface AuthResult {
  isValid: boolean;
  user?: AuthenticatedUser;
  error?: string;
}

class AuthHelper {
  private jwks: any;
  private userPoolId: string;
  private region: string;

  constructor() {
    this.userPoolId = process.env["USER_POOL_ID"]!;
    this.region = process.env["AWS_REGION"]!;

    // Initialize JWKS client
    this.jwks = jwksClient({
      jwksUri: `https://cognito-idp.${this.region}.amazonaws.com/${this.userPoolId}/.well-known/jwks.json`,
      cache: true,
      rateLimit: true,
    });
  }

  /**
   * Validate JWT token from Authorization header
   */
  async validateToken(authHeader: string | undefined): Promise<AuthResult> {
    try {
      if (!authHeader) {
        return { isValid: false, error: "Authorization header is missing" };
      }

      if (!authHeader.startsWith("Bearer ")) {
        return {
          isValid: false,
          error: "Authorization header must start with Bearer",
        };
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      return await this.verifyJWT(token);
    } catch (error) {
      console.error("Token validation error:", error);
      return { isValid: false, error: "Token validation failed" };
    }
  }

  /**
   * Verify JWT token and extract user information
   */
  async verifyJWT(token: string): Promise<AuthResult> {
    try {
      // Get the key ID from the token header
      const decodedHeader = JSON.parse(
        Buffer.from(token.split(".")[0] || "", "base64").toString()
      );
      const kid = decodedHeader.kid;

      if (!kid) {
        return { isValid: false, error: "Invalid token format" };
      }

      // Get the public key
      const key = await this.jwks.getSigningKey(kid);
      const publicKey = key.getPublicKey();

      // Verify the token
      const decoded = verify(token, publicKey, {
        algorithms: ["RS256"],
        issuer: `https://cognito-idp.${this.region}.amazonaws.com/${this.userPoolId}`,
      }) as JwtPayload;

      // Extract user information
      const user: AuthenticatedUser = {
        userId: decoded["sub"]!,
        email: decoded["email"]!,
        givenName: decoded["given_name"] || decoded["name"] || "",
        orgId: decoded["cognito:groups"]?.[0] || "default-org",
      };

      return { isValid: true, user };
    } catch (error) {
      console.error("JWT verification error:", error);
      return { isValid: false, error: "Invalid token" };
    }
  }

  /**
   * Extract user ID from token without full validation (for logging/debugging)
   */
  extractUserIdFromToken(token: string): string | null {
    try {
      const decodedHeader = JSON.parse(
        Buffer.from(token.split(".")[0] || "", "base64").toString()
      );
      const decodedPayload = JSON.parse(
        Buffer.from(token.split(".")[1] || "", "base64").toString()
      );
      return decodedPayload["sub"] || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token is expired (without full validation)
   */
  isTokenExpired(token: string): boolean {
    try {
      const decodedPayload = JSON.parse(
        Buffer.from(token.split(".")[1] || "", "base64").toString()
      );
      const exp = decodedPayload["exp"];
      if (!exp) return true;

      const currentTime = Math.floor(Date.now() / 1000);
      return currentTime >= exp;
    } catch (error) {
      return true;
    }
  }
}

// Create singleton instance
export const authHelper = new AuthHelper();
