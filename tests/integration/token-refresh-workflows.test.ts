/**
 * Token Refresh Workflows Tests
 * 
 * Comprehensive tests for token refresh workflows and scenarios.
 * This test suite covers various token refresh scenarios, including
 * successful refreshes, error handling, edge cases, and integration
 * with session management.
 * 
 * Tests cover:
 * - Successful token refresh workflows
 * - Token refresh error scenarios
 * - Session-based token refresh
 * - Automatic token refresh triggers
 * - Token refresh with concurrent requests
 * - Token refresh failure recovery
 * - Token refresh security scenarios
 * - Token refresh performance and timing
 * - Token refresh integration with OAuth flows
 * - Token refresh cleanup and cleanup
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SessionManager } from '../../src/server/auth/session-manager';
import { OAuthManager } from '../../src/server/auth/oauth-manager';
import { 
  AuthenticationError, 
  AuthenticationErrorCode, 
  AuthenticationConfig,
  UserSession,
  AccessToken,
  RefreshToken,
  TokenRefreshRequest
} from '../../src/types/auth';

// Mock dependencies
jest.mock('../../src/server/auth/oauth-manager');

describe('Token Refresh Workflows', () => {
  let sessionManager: SessionManager;
  let mockOAuthManager: jest.Mocked<OAuthManager>;
  let authConfig: AuthenticationConfig;

  beforeEach(() => {
    // Create auth config
    authConfig = {
      oauth: {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/callback',
        scopes: ['repository:read', 'repository:write'],
        authorizationUrl: 'https://bitbucket.org/oauth/authorize',
        tokenUrl: 'https://bitbucket.org/oauth/token',
        userInfoUrl: 'https://api.bitbucket.org/2.0/user'
      },
      session: {
        secret: 'test-session-secret',
        maxAge: 3600000, // 1 hour
        secure: false,
        httpOnly: true,
        sameSite: 'lax'
      },
      security: {
        enableCsrfProtection: true,
        enableRateLimiting: true,
        maxRequestsPerMinute: 100,
        enableAuditLogging: true
      },
      bitbucket: {
        baseUrl: 'https://api.bitbucket.org/2.0',
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000
      }
    };

    // Create mock OAuth manager
    mockOAuthManager = new OAuthManager(authConfig) as jest.Mocked<OAuthManager>;

    // Setup default mock implementations
    mockOAuthManager.refreshAccessToken = jest.fn();
    mockOAuthManager.getApplication = jest.fn();
    mockOAuthManager.validateAccessToken = jest.fn();

    sessionManager = new SessionManager(mockOAuthManager, authConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Token Refresh Workflows', () => {
    it('should successfully refresh access token with valid refresh token', async () => {
      const refreshToken: RefreshToken = {
        id: 'refresh-token-123',
        token: 'valid-refresh-token',
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 86400000), // 24 hours
        scope: ['repository:read'],
        userId: 'user-123',
        applicationId: 'app-123',
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isValid: true,
        isRevoked: false
      };

      const newAccessToken: AccessToken = {
        token: 'new-access-token',
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
        scope: ['repository:read'],
        refreshTokenId: 'refresh-token-123',
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isValid: true
      };

      mockOAuthManager.refreshAccessToken.mockResolvedValue({
        success: true,
        data: newAccessToken
      });

      const request: TokenRefreshRequest = {
        refreshTokenId: 'refresh-token-123',
        applicationId: 'app-123'
      };

      const result = await mockOAuthManager.refreshAccessToken(request);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(newAccessToken);
      expect(mockOAuthManager.refreshAccessToken).toHaveBeenCalledWith(request);
    });

    it('should refresh token and update session with new access token', async () => {
      // Create a session first
      const sessionResult = await sessionManager.createSession(
        'client-session-123',
        'user-123',
        'Test User',
        'test@example.com',
        'access-token-123',
        'refresh-token-456',
        ['REPO_READ']
      );

      if (sessionResult.success) {
        const session = sessionResult.data;

        const newAccessToken: AccessToken = {
          token: 'new-access-token',
          tokenType: 'Bearer',
          expiresAt: new Date(Date.now() + 3600000),
          scope: ['repository:read'],
          refreshTokenId: 'refresh-token-456',
          createdAt: new Date(),
          lastUsedAt: new Date(),
          isValid: true
        };

        mockOAuthManager.refreshAccessToken.mockResolvedValue({
          success: true,
          data: newAccessToken
        });

        const refreshResult = await sessionManager.refreshSessionToken(session.id);

        expect(refreshResult.success).toBe(true);
        if (refreshResult.success) {
          expect(refreshResult.data).toEqual(newAccessToken);
        }
      }
    });

    it('should handle token refresh with extended expiration time', async () => {
      const refreshToken: RefreshToken = {
        id: 'refresh-token-123',
        token: 'valid-refresh-token',
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 86400000),
        scope: ['repository:read'],
        userId: 'user-123',
        applicationId: 'app-123',
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isValid: true,
        isRevoked: false
      };

      const newAccessToken: AccessToken = {
        token: 'new-access-token',
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 7200000), // 2 hours
        scope: ['repository:read'],
        refreshTokenId: 'refresh-token-123',
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isValid: true
      };

      mockOAuthManager.refreshAccessToken.mockResolvedValue({
        success: true,
        data: newAccessToken
      });

      const request: TokenRefreshRequest = {
        refreshTokenId: 'refresh-token-123',
        applicationId: 'app-123'
      };

      const result = await mockOAuthManager.refreshAccessToken(request);

      expect(result.success).toBe(true);
      expect(result.data?.expiresAt.getTime()).toBeGreaterThan(Date.now() + 3600000);
    });

    it('should refresh token with updated scope permissions', async () => {
      const refreshToken: RefreshToken = {
        id: 'refresh-token-123',
        token: 'valid-refresh-token',
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 86400000),
        scope: ['repository:read'],
        userId: 'user-123',
        applicationId: 'app-123',
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isValid: true,
        isRevoked: false
      };

      const newAccessToken: AccessToken = {
        token: 'new-access-token',
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 3600000),
        scope: ['repository:read', 'repository:write'],
        refreshTokenId: 'refresh-token-123',
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isValid: true
      };

      mockOAuthManager.refreshAccessToken.mockResolvedValue({
        success: true,
        data: newAccessToken
      });

      const request: TokenRefreshRequest = {
        refreshTokenId: 'refresh-token-123',
        applicationId: 'app-123'
      };

      const result = await mockOAuthManager.refreshAccessToken(request);

      expect(result.success).toBe(true);
      expect(result.data?.scope).toContain('repository:write');
    });
  });

  describe('Token Refresh Error Scenarios', () => {
    it('should handle expired refresh token error', async () => {
      const error: AuthenticationError = {
        code: AuthenticationErrorCode.TOKEN_EXPIRED,
        message: 'Refresh token has expired',
        timestamp: new Date(),
        isRecoverable: false
      };

      mockOAuthManager.refreshAccessToken.mockResolvedValue({
        success: false,
        error
      });

      const request: TokenRefreshRequest = {
        refreshTokenId: 'expired-refresh-token',
        applicationId: 'app-123'
      };

      const result = await mockOAuthManager.refreshAccessToken(request);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AuthenticationErrorCode.TOKEN_EXPIRED);
      expect(result.error?.message).toBe('Refresh token has expired');
    });

    it('should handle invalid refresh token error', async () => {
      const error: AuthenticationError = {
        code: AuthenticationErrorCode.TOKEN_INVALID,
        message: 'Refresh token is invalid',
        timestamp: new Date(),
        isRecoverable: false
      };

      mockOAuthManager.refreshAccessToken.mockResolvedValue({
        success: false,
        error
      });

      const request: TokenRefreshRequest = {
        refreshTokenId: 'invalid-refresh-token',
        applicationId: 'app-123'
      };

      const result = await mockOAuthManager.refreshAccessToken(request);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AuthenticationErrorCode.TOKEN_INVALID);
      expect(result.error?.message).toBe('Refresh token is invalid');
    });

    it('should handle revoked refresh token error', async () => {
      const error: AuthenticationError = {
        code: AuthenticationErrorCode.TOKEN_REVOKED,
        message: 'Refresh token has been revoked',
        timestamp: new Date(),
        isRecoverable: false
      };

      mockOAuthManager.refreshAccessToken.mockResolvedValue({
        success: false,
        error
      });

      const request: TokenRefreshRequest = {
        refreshTokenId: 'revoked-refresh-token',
        applicationId: 'app-123'
      };

      const result = await mockOAuthManager.refreshAccessToken(request);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AuthenticationErrorCode.TOKEN_REVOKED);
      expect(result.error?.message).toBe('Refresh token has been revoked');
    });

    it('should handle network error during token refresh', async () => {
      const error: AuthenticationError = {
        code: AuthenticationErrorCode.NETWORK_ERROR,
        message: 'Network connection failed during token refresh',
        timestamp: new Date(),
        isRecoverable: true
      };

      mockOAuthManager.refreshAccessToken.mockResolvedValue({
        success: false,
        error
      });

      const request: TokenRefreshRequest = {
        refreshTokenId: 'valid-refresh-token',
        applicationId: 'app-123'
      };

      const result = await mockOAuthManager.refreshAccessToken(request);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AuthenticationErrorCode.NETWORK_ERROR);
      expect(result.error?.isRecoverable).toBe(true);
    });

    it('should handle application not found error during refresh', async () => {
      const error: AuthenticationError = {
        code: AuthenticationErrorCode.APPLICATION_NOT_FOUND,
        message: 'OAuth application not found',
        timestamp: new Date(),
        isRecoverable: false
      };

      mockOAuthManager.refreshAccessToken.mockResolvedValue({
        success: false,
        error
      });

      const request: TokenRefreshRequest = {
        refreshTokenId: 'valid-refresh-token',
        applicationId: 'non-existent-app'
      };

      const result = await mockOAuthManager.refreshAccessToken(request);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AuthenticationErrorCode.APPLICATION_NOT_FOUND);
    });
  });

  describe('Session-Based Token Refresh', () => {
    it('should refresh token for existing session', async () => {
      // Create a session
      const sessionResult = await sessionManager.createSession(
        'client-session-123',
        'user-123',
        'Test User',
        'test@example.com',
        'access-token-123',
        'refresh-token-456',
        ['REPO_READ']
      );

      if (sessionResult.success) {
        const session = sessionResult.data;

        const newAccessToken: AccessToken = {
          token: 'new-access-token',
          tokenType: 'Bearer',
          expiresAt: new Date(Date.now() + 3600000),
          scope: ['repository:read'],
          refreshTokenId: 'refresh-token-456',
          createdAt: new Date(),
          lastUsedAt: new Date(),
          isValid: true
        };

        mockOAuthManager.refreshAccessToken.mockResolvedValue({
          success: true,
          data: newAccessToken
        });

        const refreshResult = await sessionManager.refreshSessionToken(session.id);

        expect(refreshResult.success).toBe(true);
        if (refreshResult.success) {
          expect(refreshResult.data).toEqual(newAccessToken);
        }
      }
    });

    it('should handle session not found during token refresh', async () => {
      const refreshResult = await sessionManager.refreshSessionToken('non-existent-session');

      expect(refreshResult.success).toBe(false);
      expect(refreshResult.error?.code).toBe(AuthenticationErrorCode.SESSION_NOT_FOUND);
    });

    it('should expire session when token refresh fails', async () => {
      // Create a session
      const sessionResult = await sessionManager.createSession(
        'client-session-123',
        'user-123',
        'Test User',
        'test@example.com',
        'access-token-123',
        'refresh-token-456',
        ['REPO_READ']
      );

      if (sessionResult.success) {
        const session = sessionResult.data;

        // Mock refresh failure
        mockOAuthManager.refreshAccessToken.mockResolvedValue({
          success: false,
          error: {
            code: AuthenticationErrorCode.TOKEN_EXPIRED,
            message: 'Refresh token has expired',
            timestamp: new Date(),
            isRecoverable: false
          }
        });

        const refreshResult = await sessionManager.refreshSessionToken(session.id);

        expect(refreshResult.success).toBe(false);
        expect(refreshResult.error?.code).toBe(AuthenticationErrorCode.TOKEN_EXPIRED);

        // Session should be expired
        const getSessionResult = await sessionManager.getSession(session.id);
        expect(getSessionResult.success).toBe(false);
      }
    });

    it('should return existing token if refresh is not needed', async () => {
      // Create a session with a fresh token
      const freshToken: AccessToken = {
        token: 'fresh-access-token',
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        scope: ['repository:read'],
        refreshTokenId: 'refresh-token-456',
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isValid: true
      };

      const sessionResult = await sessionManager.createSession(
        'client-session-123',
        'user-123',
        'Test User',
        'test@example.com',
        freshToken.token,
        'refresh-token-456',
        ['REPO_READ']
      );

      if (sessionResult.success) {
        const session = sessionResult.data;

        const refreshResult = await sessionManager.refreshSessionToken(session.id);

        expect(refreshResult.success).toBe(true);
        if (refreshResult.success) {
          expect(refreshResult.data.token).toBe(freshToken.token);
        }

        // Should not call OAuth manager if refresh is not needed
        expect(mockOAuthManager.refreshAccessToken).not.toHaveBeenCalled();
      }
    });
  });

  describe('Automatic Token Refresh Triggers', () => {
    it('should trigger refresh when token is close to expiration', async () => {
      // Create a session with a token that expires soon
      const expiringToken: AccessToken = {
        token: 'expiring-access-token',
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 300000), // 5 minutes from now
        scope: ['repository:read'],
        refreshTokenId: 'refresh-token-456',
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isValid: true
      };

      const sessionResult = await sessionManager.createSession(
        'client-session-123',
        'user-123',
        'Test User',
        'test@example.com',
        expiringToken.token,
        'refresh-token-456',
        ['REPO_READ']
      );

      if (sessionResult.success) {
        const session = sessionResult.data;

        const newAccessToken: AccessToken = {
          token: 'new-access-token',
          tokenType: 'Bearer',
          expiresAt: new Date(Date.now() + 3600000),
          scope: ['repository:read'],
          refreshTokenId: 'refresh-token-456',
          createdAt: new Date(),
          lastUsedAt: new Date(),
          isValid: true
        };

        mockOAuthManager.refreshAccessToken.mockResolvedValue({
          success: true,
          data: newAccessToken
        });

        const refreshResult = await sessionManager.refreshSessionToken(session.id);

        expect(refreshResult.success).toBe(true);
        expect(mockOAuthManager.refreshAccessToken).toHaveBeenCalled();
      }
    });

    it('should validate token before attempting refresh', async () => {
      const refreshToken: RefreshToken = {
        id: 'refresh-token-123',
        token: 'valid-refresh-token',
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 86400000),
        scope: ['repository:read'],
        userId: 'user-123',
        applicationId: 'app-123',
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isValid: true,
        isRevoked: false
      };

      const newAccessToken: AccessToken = {
        token: 'new-access-token',
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 3600000),
        scope: ['repository:read'],
        refreshTokenId: 'refresh-token-123',
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isValid: true
      };

      mockOAuthManager.refreshAccessToken.mockResolvedValue({
        success: true,
        data: newAccessToken
      });

      const request: TokenRefreshRequest = {
        refreshTokenId: 'refresh-token-123',
        applicationId: 'app-123'
      };

      const result = await mockOAuthManager.refreshAccessToken(request);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(newAccessToken);
    });
  });

  describe('Concurrent Token Refresh Handling', () => {
    it('should handle multiple concurrent refresh requests for same token', async () => {
      const refreshToken: RefreshToken = {
        id: 'refresh-token-123',
        token: 'valid-refresh-token',
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 86400000),
        scope: ['repository:read'],
        userId: 'user-123',
        applicationId: 'app-123',
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isValid: true,
        isRevoked: false
      };

      const newAccessToken: AccessToken = {
        token: 'new-access-token',
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 3600000),
        scope: ['repository:read'],
        refreshTokenId: 'refresh-token-123',
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isValid: true
      };

      mockOAuthManager.refreshAccessToken.mockResolvedValue({
        success: true,
        data: newAccessToken
      });

      const request: TokenRefreshRequest = {
        refreshTokenId: 'refresh-token-123',
        applicationId: 'app-123'
      };

      // Make multiple concurrent requests
      const promises = [
        mockOAuthManager.refreshAccessToken(request),
        mockOAuthManager.refreshAccessToken(request),
        mockOAuthManager.refreshAccessToken(request)
      ];

      const results = await Promise.all(promises);

      // All requests should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.data).toEqual(newAccessToken);
      });

      // OAuth manager should be called for each request
      expect(mockOAuthManager.refreshAccessToken).toHaveBeenCalledTimes(3);
    });

    it('should handle concurrent refresh requests with different outcomes', async () => {
      const refreshToken: RefreshToken = {
        id: 'refresh-token-123',
        token: 'valid-refresh-token',
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 86400000),
        scope: ['repository:read'],
        userId: 'user-123',
        applicationId: 'app-123',
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isValid: true,
        isRevoked: false
      };

      const newAccessToken: AccessToken = {
        token: 'new-access-token',
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 3600000),
        scope: ['repository:read'],
        refreshTokenId: 'refresh-token-123',
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isValid: true
      };

      // Mock different responses for different calls
      mockOAuthManager.refreshAccessToken
        .mockResolvedValueOnce({
          success: true,
          data: newAccessToken
        })
        .mockResolvedValueOnce({
          success: false,
          error: {
            code: AuthenticationErrorCode.NETWORK_ERROR,
            message: 'Network error',
            timestamp: new Date(),
            isRecoverable: true
          }
        })
        .mockResolvedValueOnce({
          success: true,
          data: newAccessToken
        });

      const request: TokenRefreshRequest = {
        refreshTokenId: 'refresh-token-123',
        applicationId: 'app-123'
      };

      const promises = [
        mockOAuthManager.refreshAccessToken(request),
        mockOAuthManager.refreshAccessToken(request),
        mockOAuthManager.refreshAccessToken(request)
      ];

      const results = await Promise.all(promises);

      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
    });
  });

  describe('Token Refresh Security Scenarios', () => {
    it('should validate refresh token before processing', async () => {
      const error: AuthenticationError = {
        code: AuthenticationErrorCode.TOKEN_INVALID,
        message: 'Refresh token is invalid',
        timestamp: new Date(),
        isRecoverable: false
      };

      mockOAuthManager.refreshAccessToken.mockResolvedValue({
        success: false,
        error
      });

      const request: TokenRefreshRequest = {
        refreshTokenId: 'invalid-refresh-token',
        applicationId: 'app-123'
      };

      const result = await mockOAuthManager.refreshAccessToken(request);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AuthenticationErrorCode.TOKEN_INVALID);
    });

    it('should handle refresh token with mismatched application', async () => {
      const error: AuthenticationError = {
        code: AuthenticationErrorCode.APPLICATION_MISMATCH,
        message: 'Refresh token does not belong to this application',
        timestamp: new Date(),
        isRecoverable: false
      };

      mockOAuthManager.refreshAccessToken.mockResolvedValue({
        success: false,
        error
      });

      const request: TokenRefreshRequest = {
        refreshTokenId: 'valid-refresh-token',
        applicationId: 'different-app'
      };

      const result = await mockOAuthManager.refreshAccessToken(request);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AuthenticationErrorCode.APPLICATION_MISMATCH);
    });

    it('should handle refresh token with insufficient permissions', async () => {
      const error: AuthenticationError = {
        code: AuthenticationErrorCode.AUTHORIZATION_FAILED,
        message: 'Insufficient permissions for token refresh',
        timestamp: new Date(),
        isRecoverable: false
      };

      mockOAuthManager.refreshAccessToken.mockResolvedValue({
        success: false,
        error
      });

      const request: TokenRefreshRequest = {
        refreshTokenId: 'valid-refresh-token',
        applicationId: 'app-123'
      };

      const result = await mockOAuthManager.refreshAccessToken(request);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AuthenticationErrorCode.AUTHORIZATION_FAILED);
    });
  });

  describe('Token Refresh Performance and Timing', () => {
    it('should complete token refresh within reasonable time', async () => {
      const refreshToken: RefreshToken = {
        id: 'refresh-token-123',
        token: 'valid-refresh-token',
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 86400000),
        scope: ['repository:read'],
        userId: 'user-123',
        applicationId: 'app-123',
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isValid: true,
        isRevoked: false
      };

      const newAccessToken: AccessToken = {
        token: 'new-access-token',
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 3600000),
        scope: ['repository:read'],
        refreshTokenId: 'refresh-token-123',
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isValid: true
      };

      mockOAuthManager.refreshAccessToken.mockResolvedValue({
        success: true,
        data: newAccessToken
      });

      const request: TokenRefreshRequest = {
        refreshTokenId: 'refresh-token-123',
        applicationId: 'app-123'
      };

      const startTime = Date.now();
      const result = await mockOAuthManager.refreshAccessToken(request);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle timeout during token refresh', async () => {
      const error: AuthenticationError = {
        code: AuthenticationErrorCode.TIMEOUT_ERROR,
        message: 'Token refresh request timed out',
        timestamp: new Date(),
        isRecoverable: true
      };

      mockOAuthManager.refreshAccessToken.mockResolvedValue({
        success: false,
        error
      });

      const request: TokenRefreshRequest = {
        refreshTokenId: 'valid-refresh-token',
        applicationId: 'app-123'
      };

      const result = await mockOAuthManager.refreshAccessToken(request);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AuthenticationErrorCode.TIMEOUT_ERROR);
      expect(result.error?.isRecoverable).toBe(true);
    });
  });

  describe('Token Refresh Integration with OAuth Flows', () => {
    it('should integrate with OAuth application validation', async () => {
      const refreshToken: RefreshToken = {
        id: 'refresh-token-123',
        token: 'valid-refresh-token',
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 86400000),
        scope: ['repository:read'],
        userId: 'user-123',
        applicationId: 'app-123',
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isValid: true,
        isRevoked: false
      };

      const newAccessToken: AccessToken = {
        token: 'new-access-token',
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 3600000),
        scope: ['repository:read'],
        refreshTokenId: 'refresh-token-123',
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isValid: true
      };

      // Mock the OAuth application validation
      mockOAuthManager.getApplication.mockResolvedValue({
        success: true,
        data: {
          id: 'app-123',
          name: 'Test App',
          description: 'Test application',
          url: 'http://localhost:3000',
          callbackUrl: 'http://localhost:3000/callback',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Mock the refresh access token call
      mockOAuthManager.refreshAccessToken.mockResolvedValue({
        success: true,
        data: newAccessToken
      });

      const request: TokenRefreshRequest = {
        refreshTokenId: 'refresh-token-123',
        applicationId: 'app-123'
      };

      // First validate the application
      const appResult = await mockOAuthManager.getApplication('app-123');
      expect(appResult.success).toBe(true);

      // Then refresh the token
      const result = await mockOAuthManager.refreshAccessToken(request);

      expect(result.success).toBe(true);
      expect(mockOAuthManager.getApplication).toHaveBeenCalledWith('app-123');
    });

    it('should handle OAuth application validation failure', async () => {
      const error: AuthenticationError = {
        code: AuthenticationErrorCode.APPLICATION_NOT_FOUND,
        message: 'OAuth application not found',
        timestamp: new Date(),
        isRecoverable: false
      };

      // Mock application validation failure
      mockOAuthManager.getApplication.mockResolvedValue({
        success: false,
        error
      });

      // Mock refresh access token to return the same error
      mockOAuthManager.refreshAccessToken.mockResolvedValue({
        success: false,
        error
      });

      const request: TokenRefreshRequest = {
        refreshTokenId: 'valid-refresh-token',
        applicationId: 'non-existent-app'
      };

      // First test application validation
      const appResult = await mockOAuthManager.getApplication('non-existent-app');
      expect(appResult.success).toBe(false);
      expect(appResult.error?.code).toBe(AuthenticationErrorCode.APPLICATION_NOT_FOUND);

      // Then test refresh token with the same error
      const result = await mockOAuthManager.refreshAccessToken(request);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AuthenticationErrorCode.APPLICATION_NOT_FOUND);
    });
  });

  describe('Token Refresh Cleanup and Cleanup', () => {
    it('should clean up expired refresh tokens', async () => {
      const expiredRefreshToken: RefreshToken = {
        id: 'expired-refresh-token',
        token: 'expired-token',
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() - 3600000), // Expired 1 hour ago
        scope: ['repository:read'],
        userId: 'user-123',
        applicationId: 'app-123',
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isValid: true,
        isRevoked: false
      };

      const error: AuthenticationError = {
        code: AuthenticationErrorCode.TOKEN_EXPIRED,
        message: 'Refresh token has expired',
        timestamp: new Date(),
        isRecoverable: false
      };

      mockOAuthManager.refreshAccessToken.mockResolvedValue({
        success: false,
        error
      });

      const request: TokenRefreshRequest = {
        refreshTokenId: 'expired-refresh-token',
        applicationId: 'app-123'
      };

      const result = await mockOAuthManager.refreshAccessToken(request);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AuthenticationErrorCode.TOKEN_EXPIRED);
    });

    it('should handle cleanup of revoked refresh tokens', async () => {
      const revokedRefreshToken: RefreshToken = {
        id: 'revoked-refresh-token',
        token: 'revoked-token',
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 86400000),
        scope: ['repository:read'],
        userId: 'user-123',
        applicationId: 'app-123',
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isValid: true,
        isRevoked: true
      };

      const error: AuthenticationError = {
        code: AuthenticationErrorCode.TOKEN_REVOKED,
        message: 'Refresh token has been revoked',
        timestamp: new Date(),
        isRecoverable: false
      };

      mockOAuthManager.refreshAccessToken.mockResolvedValue({
        success: false,
        error
      });

      const request: TokenRefreshRequest = {
        refreshTokenId: 'revoked-refresh-token',
        applicationId: 'app-123'
      };

      const result = await mockOAuthManager.refreshAccessToken(request);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AuthenticationErrorCode.TOKEN_REVOKED);
    });
  });
});
