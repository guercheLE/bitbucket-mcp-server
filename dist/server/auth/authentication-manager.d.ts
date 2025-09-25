/**
 * Authentication Manager for Bitbucket MCP Server
 *
 * This module provides the main authentication interface, integrating OAuth
 * management, session management, and MCP protocol authentication. It serves
 * as the central authentication service for the MCP server.
 *
 * Key Features:
 * - Complete OAuth 2.0 flow management
 * - User session lifecycle management
 * - MCP protocol authentication integration
 * - Security monitoring and auditing
 * - Error handling and recovery
 *
 * Constitutional Requirements:
 * - OAuth 2.0 compliance
 * - MCP protocol integration
 * - Secure token and session management
 * - Comprehensive error handling
 * - Security auditing
 */
import { EventEmitter } from 'events';
import { OAuthApplication, OAuthApplicationRequest, OAuthAuthorizationRequest, OAuthAuthorizationResponse, OAuthCallbackRequest, UserSession, AuthenticationState, AuthenticationResponse, AuthenticationConfig } from '../../types/auth';
/**
 * Authentication Manager Class
 * Main authentication service for the MCP server
 */
export declare class AuthenticationManager extends EventEmitter {
    private oauthManager;
    private sessionManager;
    private config;
    private state;
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
     * Start OAuth authorization flow
     */
    startAuthorization(request: OAuthAuthorizationRequest): Promise<AuthenticationResponse<OAuthAuthorizationResponse>>;
    /**
     * Handle OAuth callback
     */
    handleCallback(request: OAuthCallbackRequest): Promise<AuthenticationResponse<UserSession>>;
    /**
     * Get current user session
     */
    getCurrentSession(): Promise<AuthenticationResponse<UserSession>>;
    /**
     * Validate and refresh session if needed
     */
    validateSession(sessionId?: string): Promise<AuthenticationResponse<UserSession>>;
    /**
     * Logout user and revoke session
     */
    logout(sessionId?: string): Promise<AuthenticationResponse<void>>;
    /**
     * Authenticate MCP request
     */
    authenticateRequest(authHeader?: string, sessionId?: string): Promise<AuthenticationResponse<UserSession>>;
    /**
     * Get current authentication state
     */
    getAuthenticationState(): AuthenticationState;
    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean;
    /**
     * Get current access token
     */
    getCurrentAccessToken(): string | null;
    /**
     * Get user permissions
     */
    getUserPermissions(): string[];
    private createInitialState;
    private setupEventHandlers;
    private clearAuthenticationState;
    private getUserInfo;
    private getApplicationIdFromState;
    private getRedirectUriFromState;
    private generateClientSessionId;
    private generateRequestId;
    private extractTokenFromHeader;
    private mapOAuthError;
    private handleError;
}
//# sourceMappingURL=authentication-manager.d.ts.map