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
declare class AuthHelper {
    private jwks;
    private userPoolId;
    private region;
    constructor();
    /**
     * Validate JWT token from Authorization header
     */
    validateToken(authHeader: string | undefined): Promise<AuthResult>;
    /**
     * Verify JWT token and extract user information
     */
    verifyJWT(token: string): Promise<AuthResult>;
    /**
     * Extract user ID from token without full validation (for logging/debugging)
     */
    extractUserIdFromToken(token: string): string | null;
    /**
     * Check if token is expired (without full validation)
     */
    isTokenExpired(token: string): boolean;
}
export declare const authHelper: AuthHelper;
export {};
//# sourceMappingURL=auth.d.ts.map