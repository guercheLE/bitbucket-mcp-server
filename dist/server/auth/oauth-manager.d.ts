/**
 * OAuth Manager for Bitbucket MCP Server
 *
 * This module implements OAuth 2.0 authorization code flow for Bitbucket
 * Data Center and Cloud integration. It manages OAuth applications, token
 * exchange, and refresh operations.
 *
 * Key Features:
 * - OAuth 2.0 authorization code flow
 * - Token management and refresh
 * - Application registration and validation
 * - Security and CSRF protection
 * - Error handling and recovery
 *
 * Constitutional Requirements:
 * - OAuth 2.0 compliance
 * - Secure token storage
 * - MCP protocol integration
 * - Comprehensive error handling
 * - Security auditing
 */
import { EventEmitter } from 'events';
import { OAuthApplication, OAuthApplicationRequest, OAuthAuthorizationRequest, OAuthAuthorizationResponse, TokenExchangeRequest, TokenRefreshRequest, AccessToken, RefreshToken, AuthenticationResponse, AuthenticationConfig } from '../../types/auth';
/**
 * OAuth Manager Class
 * Manages OAuth 2.0 flows and token operations
 */
export declare class OAuthManager extends EventEmitter {
    private applications;
    private authorizationStates;
    private config;
    constructor(config: AuthenticationConfig);
    /**
     * Register a new OAuth application
     */
    registerApplication(request: OAuthApplicationRequest): Promise<AuthenticationResponse<OAuthApplication>>;
    /**
     * Get OAuth application by ID
     */
    getApplication(applicationId: string): Promise<AuthenticationResponse<OAuthApplication>>;
    /**
     * Update OAuth application
     */
    updateApplication(applicationId: string, updates: Partial<OAuthApplicationRequest>): Promise<AuthenticationResponse<OAuthApplication>>;
    /**
     * Generate OAuth authorization URL
     */
    generateAuthorizationUrl(request: OAuthAuthorizationRequest): Promise<AuthenticationResponse<OAuthAuthorizationResponse>>;
    /**
     * Exchange authorization code for tokens
     */
    exchangeCodeForTokens(request: TokenExchangeRequest): Promise<AuthenticationResponse<{
        accessToken: AccessToken;
        refreshToken: RefreshToken;
    }>>;
    /**
     * Refresh access token using refresh token
     */
    refreshAccessToken(request: TokenRefreshRequest): Promise<AuthenticationResponse<AccessToken>>;
    private validateApplicationRequest;
    private buildAuthorizationUrl;
    private exchangeCodeWithBitbucket;
    private refreshTokenWithBitbucket;
    private getRefreshToken;
    private generateApplicationId;
    private generateClientId;
    private generateClientSecret;
    private generateState;
    private generateTokenId;
    private generateAccessToken;
    private generateRefreshToken;
    private generateRequestId;
    private isValidUrl;
    private setupCleanupInterval;
    private handleError;
}
//# sourceMappingURL=oauth-manager.d.ts.map