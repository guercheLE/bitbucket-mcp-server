/**
 * Session Manager for Bitbucket MCP Server
 *
 * This module manages user authentication sessions, including session
 * creation, validation, token refresh, and cleanup. It integrates with
 * the OAuth manager to provide complete session lifecycle management.
 *
 * Key Features:
 * - User session lifecycle management
 * - Token validation and refresh
 * - Session persistence and cleanup
 * - Concurrent session handling
 * - Security monitoring and auditing
 *
 * Constitutional Requirements:
 * - Secure session management
 * - MCP protocol integration
 * - Memory efficiency
 * - Comprehensive error handling
 * - Security auditing
 */
import { EventEmitter } from 'events';
import { UserSession, AccessToken, RefreshToken, OAuthApplication, AuthenticationResponse, AuthenticationConfig } from '../../types/auth';
import { OAuthManager } from './oauth-manager';
/**
 * Session Manager Class
 * Manages user authentication sessions
 */
export declare class SessionManager extends EventEmitter {
    private sessions;
    private clientSessionMap;
    private oauthManager;
    private config;
    constructor(oauthManager: OAuthManager, config: AuthenticationConfig);
    /**
     * Create a new user session
     */
    createSession(clientSessionId: string, application: OAuthApplication, accessToken: AccessToken, refreshToken: RefreshToken, userInfo: UserInfo): Promise<AuthenticationResponse<UserSession>>;
    /**
     * Get user session by ID
     */
    getSession(sessionId: string): Promise<AuthenticationResponse<UserSession>>;
    /**
     * Get user session by client session ID
     */
    getSessionByClientId(clientSessionId: string): Promise<AuthenticationResponse<UserSession>>;
    /**
     * Update session activity
     */
    updateSessionActivity(sessionId: string): Promise<AuthenticationResponse<void>>;
    /**
     * Refresh access token for a session
     */
    refreshSessionToken(sessionId: string): Promise<AuthenticationResponse<AccessToken>>;
    /**
     * Validate access token
     */
    validateAccessToken(token: string): Promise<AuthenticationResponse<UserSession>>;
    /**
     * Expire a user session
     */
    expireSession(sessionId: string): Promise<AuthenticationResponse<void>>;
    /**
     * Revoke a user session
     */
    revokeSession(sessionId: string): Promise<AuthenticationResponse<void>>;
    /**
     * Get all active sessions
     */
    getActiveSessions(): Promise<AuthenticationResponse<UserSession[]>>;
    /**
     * Get sessions for a specific user
     */
    getUserSessions(userId: string): Promise<AuthenticationResponse<UserSession[]>>;
    private getSessionStats;
    private calculateAverageRequestInterval;
    private estimateSessionMemoryUsage;
    private generateSessionId;
    private generateRequestId;
    private setupCleanupInterval;
    private handleError;
}
interface UserInfo {
    id: string;
    name: string;
    email: string;
    userAgent?: string;
    sourceIp?: string;
}
export {};
//# sourceMappingURL=session-manager.d.ts.map