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
import { randomBytes } from 'crypto';
import {
  UserSession,
  UserSessionState,
  UserSessionStats,
  AccessToken,
  RefreshToken,
  OAuthApplication,
  AuthenticationError,
  AuthenticationErrorCode,
  AuthenticationResponse,
  AuthenticationConfig
} from '../../types/auth';
import { OAuthManager } from './oauth-manager';

/**
 * Session Manager Class
 * Manages user authentication sessions
 */
export class SessionManager extends EventEmitter {
  private sessions: Map<string, UserSession> = new Map();
  private clientSessionMap: Map<string, string> = new Map(); // clientSessionId -> userSessionId
  private oauthManager: OAuthManager;
  private config: AuthenticationConfig;

  constructor(oauthManager: OAuthManager, config: AuthenticationConfig) {
    super();
    this.oauthManager = oauthManager;
    this.config = config;
    this.setupCleanupInterval();
  }

  // ============================================================================
  // Session Creation and Management
  // ============================================================================

  /**
   * Create a new user session
   */
  async createSession(
    clientSessionId: string,
    application: OAuthApplication,
    accessToken: AccessToken,
    refreshToken: RefreshToken,
    userInfo: UserInfo
  ): Promise<AuthenticationResponse<UserSession>> {
    try {
      // Check for existing session
      const existingSessionId = this.clientSessionMap.get(clientSessionId);
      if (existingSessionId) {
        const existingSession = this.sessions.get(existingSessionId);
        if (existingSession && existingSession.isActive()) {
          return {
            success: true,
            data: existingSession,
            metadata: {
              timestamp: new Date(),
              requestId: this.generateRequestId(),
              processingTime: 0,
              sessionId: existingSessionId
            }
          };
        }
      }

      // Generate session ID
      const sessionId = this.generateSessionId();

      // Create user session
      const session: UserSession = {
        id: sessionId,
        clientSessionId,
        state: UserSessionState.AUTHENTICATED,
        applicationId: application.id,
        userId: userInfo.id,
        userName: userInfo.name,
        userEmail: userInfo.email,
        accessToken,
        refreshToken,
        createdAt: new Date(),
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() + this.config.sessions.sessionTimeout),
        metadata: {
          userAgent: userInfo.userAgent,
          sourceIp: userInfo.sourceIp,
          loginMethod: 'oauth'
        },
        permissions: accessToken.scope,
        updateActivity: () => {
          session.lastActivity = new Date();
        },
        isActive: () => {
          return session.state === UserSessionState.AUTHENTICATED && 
                 !session.isExpired() && 
                 session.accessToken.isValid;
        },
        isExpired: () => {
          return session.expiresAt < new Date() || 
                 session.accessToken.expiresAt < new Date();
        },
        needsTokenRefresh: () => {
          const refreshThreshold = this.config.tokens.refreshThreshold;
          return session.accessToken.expiresAt.getTime() - Date.now() < refreshThreshold;
        },
        getStats: () => this.getSessionStats(session)
      };

      // Store session
      this.sessions.set(sessionId, session);
      this.clientSessionMap.set(clientSessionId, sessionId);

      // Emit event
      this.emit('auth:session:created', session);

      return {
        success: true,
        data: session,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0,
          sessionId
        }
      };
    } catch (error) {
      return this.handleError(error, 'Failed to create user session');
    }
  }

  /**
   * Get user session by ID
   */
  async getSession(sessionId: string): Promise<AuthenticationResponse<UserSession>> {
    try {
      const session = this.sessions.get(sessionId);
      
      if (!session) {
        throw new AuthenticationError({
          code: AuthenticationErrorCode.SESSION_NOT_FOUND,
          message: `User session not found: ${sessionId}`,
          timestamp: new Date(),
          isRecoverable: false
        });
      }

      // Check if session is expired
      if (session.isExpired()) {
        await this.expireSession(sessionId);
        throw new AuthenticationError({
          code: AuthenticationErrorCode.SESSION_EXPIRED,
          message: `User session has expired: ${sessionId}`,
          timestamp: new Date(),
          isRecoverable: false
        });
      }

      return {
        success: true,
        data: session,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0,
          sessionId
        }
      };
    } catch (error) {
      return this.handleError(error, 'Failed to get user session');
    }
  }

  /**
   * Get user session by client session ID
   */
  async getSessionByClientId(clientSessionId: string): Promise<AuthenticationResponse<UserSession>> {
    try {
      const sessionId = this.clientSessionMap.get(clientSessionId);
      
      if (!sessionId) {
        throw new AuthenticationError({
          code: AuthenticationErrorCode.SESSION_NOT_FOUND,
          message: `No user session found for client: ${clientSessionId}`,
          timestamp: new Date(),
          isRecoverable: false
        });
      }

      return await this.getSession(sessionId);
    } catch (error) {
      return this.handleError(error, 'Failed to get user session by client ID');
    }
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(sessionId: string): Promise<AuthenticationResponse<void>> {
    try {
      const session = this.sessions.get(sessionId);
      
      if (!session) {
        throw new AuthenticationError({
          code: AuthenticationErrorCode.SESSION_NOT_FOUND,
          message: `User session not found: ${sessionId}`,
          timestamp: new Date(),
          isRecoverable: false
        });
      }

      // Update activity
      session.updateActivity();

      // Extend session expiration if needed
      const newExpiration = new Date(Date.now() + this.config.sessions.sessionTimeout);
      if (newExpiration > session.expiresAt) {
        session.expiresAt = newExpiration;
      }

      return {
        success: true,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0,
          sessionId
        }
      };
    } catch (error) {
      return this.handleError(error, 'Failed to update session activity');
    }
  }

  // ============================================================================
  // Token Management
  // ============================================================================

  /**
   * Refresh access token for a session
   */
  async refreshSessionToken(sessionId: string): Promise<AuthenticationResponse<AccessToken>> {
    try {
      const session = this.sessions.get(sessionId);
      
      if (!session) {
        throw new AuthenticationError({
          code: AuthenticationErrorCode.SESSION_NOT_FOUND,
          message: `User session not found: ${sessionId}`,
          timestamp: new Date(),
          isRecoverable: false
        });
      }

      // Check if refresh is needed
      if (!session.needsTokenRefresh()) {
        return {
          success: true,
          data: session.accessToken,
          metadata: {
            timestamp: new Date(),
            requestId: this.generateRequestId(),
            processingTime: 0,
            sessionId
          }
        };
      }

      // Update session state
      session.state = UserSessionState.TOKEN_REFRESHING;

      // Refresh token via OAuth manager
      const refreshResponse = await this.oauthManager.refreshAccessToken({
        refreshTokenId: session.refreshToken.id,
        applicationId: session.applicationId
      });

      if (!refreshResponse.success || !refreshResponse.data) {
        // Token refresh failed, expire session
        await this.expireSession(sessionId);
        return refreshResponse;
      }

      // Update session with new token
      session.accessToken = refreshResponse.data;
      session.state = UserSessionState.AUTHENTICATED;
      session.updateActivity();

      // Emit event
      this.emit('auth:token:refreshed', sessionId, refreshResponse.data);

      return {
        success: true,
        data: refreshResponse.data,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0,
          sessionId
        }
      };
    } catch (error) {
      return this.handleError(error, 'Failed to refresh session token');
    }
  }

  /**
   * Validate access token
   */
  async validateAccessToken(token: string): Promise<AuthenticationResponse<UserSession>> {
    try {
      // Find session with matching access token
      for (const session of this.sessions.values()) {
        if (session.accessToken.token === token) {
          // Check if token is valid
          if (!session.accessToken.isValid || session.accessToken.expiresAt < new Date()) {
            throw new AuthenticationError({
              code: AuthenticationErrorCode.TOKEN_EXPIRED,
              message: 'Access token is expired or invalid',
              timestamp: new Date(),
              isRecoverable: false
            });
          }

          // Update activity
          session.updateActivity();

          return {
            success: true,
            data: session,
            metadata: {
              timestamp: new Date(),
              requestId: this.generateRequestId(),
              processingTime: 0,
              sessionId: session.id
            }
          };
        }
      }

      throw new AuthenticationError({
        code: AuthenticationErrorCode.TOKEN_INVALID,
        message: 'Access token not found or invalid',
        timestamp: new Date(),
        isRecoverable: false
      });
    } catch (error) {
      return this.handleError(error, 'Failed to validate access token');
    }
  }

  // ============================================================================
  // Session Lifecycle Management
  // ============================================================================

  /**
   * Expire a user session
   */
  async expireSession(sessionId: string): Promise<AuthenticationResponse<void>> {
    try {
      const session = this.sessions.get(sessionId);
      
      if (!session) {
        return {
          success: true,
          metadata: {
            timestamp: new Date(),
            requestId: this.generateRequestId(),
            processingTime: 0,
            sessionId
          }
        };
      }

      // Update session state
      session.state = UserSessionState.EXPIRED;

      // Remove from mappings
      this.sessions.delete(sessionId);
      this.clientSessionMap.delete(session.clientSessionId);

      // Emit event
      this.emit('auth:session:expired', sessionId);

      return {
        success: true,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0,
          sessionId
        }
      };
    } catch (error) {
      return this.handleError(error, 'Failed to expire session');
    }
  }

  /**
   * Revoke a user session
   */
  async revokeSession(sessionId: string): Promise<AuthenticationResponse<void>> {
    try {
      const session = this.sessions.get(sessionId);
      
      if (!session) {
        return {
          success: true,
          metadata: {
            timestamp: new Date(),
            requestId: this.generateRequestId(),
            processingTime: 0,
            sessionId
          }
        };
      }

      // Update session state
      session.state = UserSessionState.REVOKED;

      // Remove from mappings
      this.sessions.delete(sessionId);
      this.clientSessionMap.delete(session.clientSessionId);

      // Emit event
      this.emit('auth:session:revoked', sessionId);

      return {
        success: true,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0,
          sessionId
        }
      };
    } catch (error) {
      return this.handleError(error, 'Failed to revoke session');
    }
  }

  /**
   * Get all active sessions
   */
  async getActiveSessions(): Promise<AuthenticationResponse<UserSession[]>> {
    try {
      const activeSessions = Array.from(this.sessions.values())
        .filter(session => session.isActive());

      return {
        success: true,
        data: activeSessions,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0
        }
      };
    } catch (error) {
      return this.handleError(error, 'Failed to get active sessions');
    }
  }

  /**
   * Get sessions for a specific user
   */
  async getUserSessions(userId: string): Promise<AuthenticationResponse<UserSession[]>> {
    try {
      const userSessions = Array.from(this.sessions.values())
        .filter(session => session.userId === userId);

      return {
        success: true,
        data: userSessions,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0
        }
      };
    } catch (error) {
      return this.handleError(error, 'Failed to get user sessions');
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private getSessionStats(session: UserSession): UserSessionStats {
    const now = new Date();
    const duration = now.getTime() - session.createdAt.getTime();
    
    return {
      duration,
      apiRequests: session.metadata.apiRequests || 0,
      tokenRefreshes: session.metadata.tokenRefreshes || 0,
      lastApiRequest: session.metadata.lastApiRequest || session.createdAt,
      averageRequestInterval: this.calculateAverageRequestInterval(session),
      memoryUsage: this.estimateSessionMemoryUsage(session)
    };
  }

  private calculateAverageRequestInterval(session: UserSession): number {
    const apiRequests = session.metadata.apiRequests || 0;
    if (apiRequests <= 1) return 0;
    
    const duration = Date.now() - session.createdAt.getTime();
    return duration / apiRequests;
  }

  private estimateSessionMemoryUsage(session: UserSession): number {
    // Rough estimate of memory usage for session data
    const baseSize = 1024; // Base session overhead
    const tokenSize = session.accessToken.token.length + (session.refreshToken?.token.length || 0);
    const metadataSize = JSON.stringify(session.metadata).length;
    
    return baseSize + tokenSize + metadataSize;
  }

  private generateSessionId(): string {
    return `session_${randomBytes(16).toString('hex')}`;
  }

  private generateRequestId(): string {
    return `req_${randomBytes(8).toString('hex')}`;
  }

  private setupCleanupInterval(): void {
    // Clean up expired sessions every minute
    setInterval(async () => {
      const now = new Date();
      const expiredSessions: string[] = [];

      for (const [sessionId, session] of this.sessions.entries()) {
        if (session.isExpired()) {
          expiredSessions.push(sessionId);
        }
      }

      // Clean up expired sessions
      for (const sessionId of expiredSessions) {
        await this.expireSession(sessionId);
      }
    }, 60 * 1000);
  }

  private handleError(error: any, context: string): AuthenticationResponse {
    const authError: AuthenticationError = {
      code: error.code || AuthenticationErrorCode.INTERNAL_ERROR,
      message: error.message || context,
      details: error.details,
      timestamp: new Date(),
      isRecoverable: error.isRecoverable !== undefined ? error.isRecoverable : true
    };

    this.emit('auth:error', authError);

    return {
      success: false,
      error: authError,
      metadata: {
        timestamp: new Date(),
        requestId: this.generateRequestId(),
        processingTime: 0
      }
    };
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface UserInfo {
  id: string;
  name: string;
  email: string;
  userAgent?: string;
  sourceIp?: string;
}
