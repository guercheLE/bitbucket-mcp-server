/**
 * Bitbucket API Client for Authentication
 *
 * This module provides HTTP client functionality for interacting with
 * Bitbucket Data Center and Cloud APIs for OAuth operations and user
 * information retrieval.
 *
 * Key Features:
 * - OAuth token exchange with Bitbucket
 * - User information retrieval
 * - API endpoint discovery
 * - Error handling and retry logic
 * - Support for both Data Center and Cloud
 *
 * Constitutional Requirements:
 * - OAuth 2.0 compliance
 * - Comprehensive error handling
 * - Security best practices
 * - API version compatibility
 */
/**
 * Bitbucket API Client Class
 * Handles HTTP communication with Bitbucket APIs
 */
export declare class BitbucketApiClient {
    private baseUrl;
    private instanceType;
    private timeout;
    private retryAttempts;
    constructor(baseUrl: string, instanceType: 'datacenter' | 'cloud', timeout?: number);
    /**
     * Exchange authorization code for access token
     */
    exchangeCodeForToken(clientId: string, clientSecret: string, code: string, redirectUri: string): Promise<TokenResponse>;
    /**
     * Refresh access token using refresh token
     */
    refreshAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<TokenResponse>;
    /**
     * Revoke access token
     */
    revokeToken(clientId: string, clientSecret: string, token: string, tokenType?: 'access_token' | 'refresh_token'): Promise<void>;
    /**
     * Get user information using access token
     */
    getUserInfo(accessToken: string): Promise<UserInfo>;
    /**
     * Test API connectivity
     */
    testConnectivity(): Promise<boolean>;
    private makeRequest;
    private parseErrorResponse;
    private validateTokenResponse;
    private validateUserInfoResponse;
    private getTokenEndpoint;
    private getRevokeEndpoint;
    private getUserEndpoint;
    private getTestEndpoint;
    private mapHttpErrorToAuthError;
    private isRecoverableError;
}
interface TokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string;
    scope?: string;
    user_id?: string;
}
interface UserInfo {
    id: string;
    name: string;
    email: string;
    username: string;
    avatar: string;
    accountId: string;
}
export {};
//# sourceMappingURL=bitbucket-api-client.d.ts.map