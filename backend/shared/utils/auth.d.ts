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
    validateToken(authHeader: string | undefined): Promise<AuthResult>;
    verifyJWT(token: string): Promise<AuthResult>;
    extractUserIdFromToken(token: string): string | null;
    isTokenExpired(token: string): boolean;
}
export declare const authHelper: AuthHelper;
export {};
//# sourceMappingURL=auth.d.ts.map