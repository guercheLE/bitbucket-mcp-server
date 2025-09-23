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
import {
  OAuthApplication,
  OAuthApplicationRequest,
  OAuthAuthorizationRequest,
  OAuthAuthorizationResponse,
  OAuthCallbackRequest,
  UserSession,
  AuthenticationState,
  AuthenticationError,
  AuthenticationErrorCode,
  AuthenticationResponse,
  AuthenticationConfig,
  AuthenticationEvents
} from '../../types/auth';
import { OAuthManager } from './oauth-manager';
import { SessionManager } from './session-manager';
import { BitbucketApiClient } from './bitbucket-api-client';

/**
 * Authentication Manager Class
 * Main authentication service for the MCP server
 */
export class AuthenticationManager extends EventEmitter {
  private oauthManager: OAuthManager;
  private sessionManager: SessionManager;
  private config: AuthenticationConfig;
  private state: AuthenticationState;

  constructor(config: AuthenticationConfig) {
    super();
    this.config = config;
    this.oauthManager = new OAuthManager(config);
    this.sessionManager = new SessionManager(this.oauthManager, config);
    this.state = this.createInitialState();
    
    this.setupEventHandlers();
  }

  // ============================================================================
  // OAuth Application Management
  // ============================================================================

  /**
   * Register a new OAuth application
   */
  async registerApplication(request: OAuthApplicationRequest): Promise<AuthenticationResponse<OAuthApplication>> {
    const response = await this.oauthManager.registerApplication(request);
    
    if (response.success && response.data) {
      // Update authentication state
      this.state.applications.push(response.data);
    }
    
    return response;
  }

  /**
   * Get OAuth application by ID
   */
  async getApplication(applicationId: string): Promise<AuthenticationResponse<OAuthApplication>> {
    return await this.oauthManager.getApplication(applicationId);
  }

  /**
   * Update OAuth application
   */
  async updateApplication(applicationId: string, updates: Partial<OAuthApplicationRequest>): Promise<AuthenticationResponse<OAuthApplication>> {
    const response = await this.oauthManager.updateApplication(applicationId, updates);
    
    if (response.success && response.data) {
      // Update authentication state
      const index = this.state.applications.findIndex(app => app.id === applicationId);
      if (index >= 0) {
        this.state.applications[index] = response.data;
      }
    }
    
    return response;
  }

  // ============================================================================
  // OAuth Authorization Flow
  // ============================================================================

  /**
   * Start OAuth authorization flow
   */
  async startAuthorization(request: OAuthAuthorizationRequest): Promise<AuthenticationResponse<OAuthAuthorizationResponse>> {
    return await this.oauthManager.generateAuthorizationUrl(request);
  }

  /**
   * Handle OAuth callback
   */
  async handleCallback(request: OAuthCallbackRequest): Promise<AuthenticationResponse<UserSession>> {
    try {
      // Check for authorization errors
      if (request.error) {
        throw new AuthenticationError({
          code: this.mapOAuthError(request.error),
          message: request.errorDescription || `OAuth authorization failed: ${request.error}`,
          timestamp: new Date(),
          isRecoverable: false
        });
      }

      // Exchange code for tokens
      const tokenResponse = await this.oauthManager.exchangeCodeForTokens({
        code: request.code,
        applicationId: this.getApplicationIdFromState(request.state),
        state: request.state,
        redirectUri: this.getRedirectUriFromState(request.state)
      });

      if (!tokenResponse.success || !tokenResponse.data) {
        return tokenResponse as AuthenticationResponse<UserSession>;
      }

      // Get OAuth application
      const appResponse = await this.oauthManager.getApplication(tokenResponse.data.accessToken.refreshTokenId!);
      if (!appResponse.success || !appResponse.data) {
        return appResponse as AuthenticationResponse<UserSession>;
      }

      // Get user information (this would typically come from Bitbucket API)
      const userInfo = await this.getUserInfo(tokenResponse.data.accessToken.token);

      // Create user session
      const sessionResponse = await this.sessionManager.createSession(
        this.generateClientSessionId(),
        appResponse.data,
        tokenResponse.data.accessToken,
        tokenResponse.data.refreshToken,
        userInfo
      );

      if (sessionResponse.success && sessionResponse.data) {
        // Update authentication state
        this.state.isAuthenticated = true;
        this.state.session = sessionResponse.data;
        this.state.authenticatedAt = new Date();
        this.state.authMethod = 'oauth';
      }

      return sessionResponse;
    } catch (error) {
      return this.handleError(error, 'Failed to handle OAuth callback');
    }
  }

  // ============================================================================
  // Session Management
  // ============================================================================

  /**
   * Get current user session
   */
  async getCurrentSession(): Promise<AuthenticationResponse<UserSession>> {
    if (!this.state.session) {
      return {
        success: false,
        error: {
          code: AuthenticationErrorCode.SESSION_NOT_FOUND,
          message: 'No active user session',
          timestamp: new Date(),
          isRecoverable: false
        },
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0
        }
      };
    }

    return await this.sessionManager.getSession(this.state.session.id);
  }

  /**
   * Validate and refresh session if needed
   */
  async validateSession(sessionId?: string): Promise<AuthenticationResponse<UserSession>> {
    try {
      const targetSessionId = sessionId || this.state.session?.id;
      
      if (!targetSessionId) {
        throw new AuthenticationError({
          code: AuthenticationErrorCode.SESSION_NOT_FOUND,
          message: 'No session ID provided',
          timestamp: new Date(),
          isRecoverable: false
        });
      }

      // Get session
      const sessionResponse = await this.sessionManager.getSession(targetSessionId);
      if (!sessionResponse.success || !sessionResponse.data) {
        return sessionResponse;
      }

      const session = sessionResponse.data;

      // Check if token refresh is needed
      if (session.needsTokenRefresh()) {
        const refreshResponse = await this.sessionManager.refreshSessionToken(session.id);
        if (!refreshResponse.success) {
          // Token refresh failed, clear authentication state
          this.clearAuthenticationState();
          return refreshResponse as AuthenticationResponse<UserSession>;
        }
      }

      // Update authentication state
      this.state.lastAuthCheck = new Date();
      this.state.session = session;

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
    } catch (error) {
      return this.handleError(error, 'Failed to validate session');
    }
  }

  /**
   * Logout user and revoke session
   */
  async logout(sessionId?: string): Promise<AuthenticationResponse<void>> {
    try {
      const targetSessionId = sessionId || this.state.session?.id;
      
      if (!targetSessionId) {
        return {
          success: true,
          metadata: {
            timestamp: new Date(),
            requestId: this.generateRequestId(),
            processingTime: 0
          }
        };
      }

      // Revoke session
      const response = await this.sessionManager.revokeSession(targetSessionId);
      
      // Clear authentication state
      this.clearAuthenticationState();
      
      return response;
    } catch (error) {
      return this.handleError(error, 'Failed to logout');
    }
  }

  // ============================================================================
  // MCP Protocol Integration
  // ============================================================================

  /**
   * Authenticate MCP request
   */
  async authenticateRequest(authHeader?: string, sessionId?: string): Promise<AuthenticationResponse<UserSession>> {
    try {
      // Try to get session from sessionId first
      if (sessionId) {
        return await this.validateSession(sessionId);
      }

      // Try to authenticate from Authorization header
      if (authHeader) {
        const token = this.extractTokenFromHeader(authHeader);
        if (token) {
          const validationResponse = await this.sessionManager.validateAccessToken(token);
          if (validationResponse.success && validationResponse.data) {
            // Update authentication state
            this.state.session = validationResponse.data;
            this.state.isAuthenticated = true;
            this.state.lastAuthCheck = new Date();
          }
          return validationResponse;
        }
      }

      // No valid authentication found
      throw new AuthenticationError({
        code: AuthenticationErrorCode.AUTHENTICATION_FAILED,
        message: 'No valid authentication provided',
        timestamp: new Date(),
        isRecoverable: false
      });
    } catch (error) {
      return this.handleError(error, 'Failed to authenticate request');
    }
  }

  /**
   * Get current authentication state
   */
  getAuthenticationState(): AuthenticationState {
    return { ...this.state };
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.state.isAuthenticated && 
           this.state.session !== undefined && 
           this.state.session.isActive();
  }

  /**
   * Get current access token
   */
  getCurrentAccessToken(): string | null {
    return this.state.session?.accessToken.token || null;
  }

  /**
   * Get user permissions
   */
  getUserPermissions(): string[] {
    return this.state.session?.permissions || [];
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private createInitialState(): AuthenticationState {
    return {
      isAuthenticated: false,
      applications: [],
      lastAuthCheck: new Date(),
      errors: [],
      getCurrentAccessToken: () => this.getCurrentAccessToken(),
      isValid: () => this.isAuthenticated(),
      needsRefresh: () => this.state.session?.needsTokenRefresh() || false,
      getUserPermissions: () => this.getUserPermissions()
    };
  }

  private setupEventHandlers(): void {
    // Forward OAuth manager events
    this.oauthManager.on('auth:application:registered', (application) => {
      this.emit('auth:application:registered', application);
    });

    this.oauthManager.on('auth:application:updated', (application) => {
      this.emit('auth:application:updated', application);
    });

    this.oauthManager.on('auth:error', (error) => {
      this.state.errors.push(error);
      this.emit('auth:error', error);
    });

    // Forward session manager events
    this.sessionManager.on('auth:session:created', (session) => {
      this.emit('auth:session:created', session);
    });

    this.sessionManager.on('auth:session:expired', (sessionId) => {
      if (this.state.session?.id === sessionId) {
        this.clearAuthenticationState();
      }
      this.emit('auth:session:expired', sessionId);
    });

    this.sessionManager.on('auth:session:revoked', (sessionId) => {
      if (this.state.session?.id === sessionId) {
        this.clearAuthenticationState();
      }
      this.emit('auth:session:revoked', sessionId);
    });

    this.sessionManager.on('auth:token:refreshed', (sessionId, newToken) => {
      this.emit('auth:token:refreshed', sessionId, newToken);
    });

    this.sessionManager.on('auth:error', (error) => {
      this.state.errors.push(error);
      this.emit('auth:error', error);
    });
  }

  private clearAuthenticationState(): void {
    this.state.isAuthenticated = false;
    this.state.session = undefined;
    this.state.authenticatedAt = undefined;
    this.state.authMethod = undefined;
  }

  private async getUserInfo(accessToken: string): Promise<any> {
    try {
      // Get the current application to determine instance type and base URL
      const currentApp = this.state.applications[0]; // For now, use first app
      if (!currentApp) {
        throw new AuthenticationError({
          code: AuthenticationErrorCode.APPLICATION_NOT_FOUND,
          message: 'No OAuth application configured',
          timestamp: new Date(),
          isRecoverable: false
        });
      }

      const apiClient = new BitbucketApiClient(currentApp.baseUrl, currentApp.instanceType);
      const userInfo = await apiClient.getUserInfo(accessToken);
      
      return {
        id: userInfo.id,
        name: userInfo.name,
        email: userInfo.email,
        username: userInfo.username,
        avatar: userInfo.avatar,
        accountId: userInfo.accountId,
        userAgent: 'MCP-Client/1.0',
        sourceIp: '127.0.0.1'
      };
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      
      throw new AuthenticationError({
        code: AuthenticationErrorCode.NETWORK_ERROR,
        message: `Failed to get user information: ${error.message}`,
        details: { originalError: error.message },
        timestamp: new Date(),
        isRecoverable: true
      });
    }
  }

  private getApplicationIdFromState(state: string): string {
    // This would typically be stored in the authorization state
    // For now, return a default application ID
    return 'default-app';
  }

  private getRedirectUriFromState(state: string): string {
    // This would typically be stored in the authorization state
    // For now, return a default redirect URI
    return 'http://localhost:3000/auth/callback';
  }

  private generateClientSessionId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractTokenFromHeader(authHeader: string): string | null {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      return parts[1];
    }
    return null;
  }

  private mapOAuthError(error: string): AuthenticationErrorCode {
    switch (error) {
      case 'access_denied':
        return AuthenticationErrorCode.AUTHORIZATION_FAILED;
      case 'invalid_request':
        return AuthenticationErrorCode.INVALID_REQUEST;
      case 'invalid_client':
        return AuthenticationErrorCode.INVALID_CLIENT;
      case 'invalid_grant':
        return AuthenticationErrorCode.INVALID_GRANT;
      case 'unsupported_grant_type':
        return AuthenticationErrorCode.UNSUPPORTED_GRANT_TYPE;
      case 'invalid_scope':
        return AuthenticationErrorCode.INVALID_SCOPE;
      default:
        return AuthenticationErrorCode.AUTHENTICATION_FAILED;
    }
  }

  private handleError(error: any, context: string): AuthenticationResponse {
    const authError: AuthenticationError = {
      code: error.code || AuthenticationErrorCode.INTERNAL_ERROR,
      message: error.message || context,
      details: error.details,
      timestamp: new Date(),
      isRecoverable: error.isRecoverable !== undefined ? error.isRecoverable : true
    };

    this.state.errors.push(authError);
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
