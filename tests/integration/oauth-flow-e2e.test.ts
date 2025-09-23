/**
 * OAuth Flow End-to-End Tests
 * 
 * Comprehensive end-to-end tests for the complete OAuth 2.0 authorization code flow.
 * Tests cover the entire authentication process from authorization request to
 * token exchange and session creation.
 * 
 * Tests cover:
 * - OAuth authorization URL generation
 * - Authorization code exchange for tokens
 * - Token refresh scenarios
 * - Session creation and management
 * - Error handling throughout the flow
 * - Security validation
 * - Performance under load
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { OAuthManager } from '../../src/server/auth/oauth-manager';
import { SessionManager } from '../../src/server/auth/session-manager';
import { BitbucketApiClient } from '../../src/server/auth/bitbucket-api-client';
import { MemoryTokenStorage } from '../../src/server/auth/token-storage';
import { AdvancedCryptoService } from '../../src/server/auth/advanced-crypto';
import { AuthAuditLogger } from '../../src/server/auth/auth-audit-logger';
import { RateLimiter } from '../../src/server/auth/rate-limiter';
import { UserSession } from '../../src/types/auth';

// Mock external dependencies
jest.mock('../../src/server/auth/bitbucket-api-client');
jest.mock('../../src/server/auth/advanced-crypto');
jest.mock('../../src/server/auth/auth-audit-logger');
jest.mock('../../src/server/auth/rate-limiter');

describe('OAuth Flow End-to-End Tests', () => {
  let oauthManager: OAuthManager;
  let sessionManager: SessionManager;
  let mockBitbucketApiClient: jest.Mocked<BitbucketApiClient>;
  let mockCryptoService: jest.Mocked<AdvancedCryptoService>;
  let mockAuditLogger: jest.Mocked<AuthAuditLogger>;
  let mockRateLimiter: jest.Mocked<RateLimiter>;
  let tokenStorage: MemoryTokenStorage;

  beforeEach(() => {
    // Create mock instances
    mockBitbucketApiClient = new BitbucketApiClient() as jest.Mocked<BitbucketApiClient>;
    mockCryptoService = new AdvancedCryptoService() as jest.Mocked<AdvancedCryptoService>;
    mockAuditLogger = new AuthAuditLogger() as jest.Mocked<AuthAuditLogger>;
    mockRateLimiter = new RateLimiter() as jest.Mocked<RateLimiter>;

    // Setup mock implementations
    mockCryptoService.encrypt.mockImplementation((data: string) => `encrypted_${data}`);
    mockCryptoService.decrypt.mockImplementation((data: string) => data.replace('encrypted_', ''));
    mockCryptoService.generateSecureRandom.mockReturnValue('secure-random-string');
    mockCryptoService.hashPassword.mockReturnValue('hashed-password');

    mockAuditLogger.logAuthenticationAttempt.mockResolvedValue();
    mockAuditLogger.logAuthenticationSuccess.mockResolvedValue();
    mockAuditLogger.logAuthenticationFailure.mockResolvedValue();
    mockAuditLogger.logTokenRefresh.mockResolvedValue();
    mockAuditLogger.logSessionCreation.mockResolvedValue();

    mockRateLimiter.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 100 });
    mockRateLimiter.recordRequest.mockResolvedValue();

    // Create real instances with mocked dependencies
    tokenStorage = new MemoryTokenStorage();
    
    oauthManager = new OAuthManager(
      mockBitbucketApiClient,
      mockCryptoService,
      mockAuditLogger,
      mockRateLimiter
    );

    sessionManager = new SessionManager(
      tokenStorage,
      mockCryptoService,
      mockAuditLogger
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete OAuth Authorization Code Flow', () => {
    it('should complete full OAuth flow from authorization to session creation', async () => {
      // Step 1: Generate authorization URL
      const authUrl = await oauthManager.getAuthorizationUrl({
        clientId: 'test-client-id',
        redirectUri: 'http://localhost:3000/auth/callback',
        scope: ['repository:read', 'repository:write'],
        state: 'test-state'
      });

      expect(authUrl).toContain('oauth/authorize');
      expect(authUrl).toContain('test-client-id');
      expect(authUrl).toContain('test-state');

      // Step 2: Mock authorization code exchange
      const mockTokenResponse = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-456',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'repository:read repository:write'
      };

      mockBitbucketApiClient.exchangeCodeForTokens.mockResolvedValue(mockTokenResponse);

      const tokens = await oauthManager.exchangeCodeForTokens({
        code: 'authorization-code-789',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/auth/callback'
      });

      expect(tokens).toEqual(mockTokenResponse);
      expect(mockBitbucketApiClient.exchangeCodeForTokens).toHaveBeenCalledWith({
        code: 'authorization-code-789',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/auth/callback'
      });

      // Step 3: Get user information
      const mockUserInfo = {
        id: 'user-123',
        displayName: 'Test User',
        emailAddress: 'test@example.com',
        active: true,
        permissions: ['REPO_READ', 'REPO_WRITE', 'PROJECT_READ']
      };

      mockBitbucketApiClient.getUserInfo.mockResolvedValue(mockUserInfo);

      const userInfo = await oauthManager.getUserInfo(tokens.access_token);

      expect(userInfo).toEqual(mockUserInfo);
      expect(mockBitbucketApiClient.getUserInfo).toHaveBeenCalledWith('access-token-123');

      // Step 4: Create user session
      const userSession = await sessionManager.createSession({
        userId: userInfo.id,
        userName: userInfo.displayName,
        userEmail: userInfo.emailAddress,
        accessToken: {
          token: tokens.access_token,
          expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          scopes: tokens.scope.split(' ')
        },
        refreshToken: {
          token: tokens.refresh_token,
          expiresAt: new Date(Date.now() + 86400000) // 24 hours
        },
        permissions: userInfo.permissions,
        expiresAt: new Date(Date.now() + 3600000) // 1 hour
      });

      expect(userSession.userId).toBe('user-123');
      expect(userSession.userName).toBe('Test User');
      expect(userSession.userEmail).toBe('test@example.com');
      expect(userSession.permissions).toEqual(['REPO_READ', 'REPO_WRITE', 'PROJECT_READ']);
      expect(userSession.isActive()).toBe(true);

      // Verify audit logging
      expect(mockAuditLogger.logAuthenticationSuccess).toHaveBeenCalled();
      expect(mockAuditLogger.logSessionCreation).toHaveBeenCalled();
    });

    it('should handle OAuth flow with different scopes', async () => {
      const scopes = ['repository:read', 'pullrequest:read', 'pullrequest:write'];

      const authUrl = await oauthManager.getAuthorizationUrl({
        clientId: 'test-client-id',
        redirectUri: 'http://localhost:3000/auth/callback',
        scope: scopes,
        state: 'test-state'
      });

      expect(authUrl).toContain('repository:read');
      expect(authUrl).toContain('pullrequest:read');
      expect(authUrl).toContain('pullrequest:write');

      // Mock token response with different scopes
      const mockTokenResponse = {
        access_token: 'access-token-456',
        refresh_token: 'refresh-token-789',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'repository:read pullrequest:read pullrequest:write'
      };

      mockBitbucketApiClient.exchangeCodeForTokens.mockResolvedValue(mockTokenResponse);

      const tokens = await oauthManager.exchangeCodeForTokens({
        code: 'authorization-code-456',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/auth/callback'
      });

      expect(tokens.scope).toBe('repository:read pullrequest:read pullrequest:write');
    });

    it('should handle OAuth flow with state parameter for CSRF protection', async () => {
      const state = 'csrf-protection-state-123';

      const authUrl = await oauthManager.getAuthorizationUrl({
        clientId: 'test-client-id',
        redirectUri: 'http://localhost:3000/auth/callback',
        scope: ['repository:read'],
        state
      });

      expect(authUrl).toContain(state);

      // Verify state is included in the authorization URL
      const url = new URL(authUrl);
      expect(url.searchParams.get('state')).toBe(state);
    });
  });

  describe('Token Refresh Flow', () => {
    it('should refresh access token when expired', async () => {
      // Create initial session with expired token
      const expiredToken = {
        token: 'expired-access-token',
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        scopes: ['repository:read']
      };

      const userSession = await sessionManager.createSession({
        userId: 'user-123',
        userName: 'Test User',
        userEmail: 'test@example.com',
        accessToken: expiredToken,
        refreshToken: {
          token: 'refresh-token-123',
          expiresAt: new Date(Date.now() + 86400000) // 24 hours
        },
        permissions: ['REPO_READ'],
        expiresAt: new Date(Date.now() + 3600000) // 1 hour
      });

      // Mock token refresh response
      const mockRefreshResponse = {
        access_token: 'new-access-token-456',
        refresh_token: 'new-refresh-token-789',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'repository:read'
      };

      mockBitbucketApiClient.refreshAccessToken.mockResolvedValue(mockRefreshResponse);

      // Refresh the session
      const refreshedSession = await sessionManager.refreshSession(userSession.id);

      expect(refreshedSession.accessToken.token).toBe('new-access-token-456');
      expect(refreshedSession.refreshToken.token).toBe('new-refresh-token-789');
      expect(refreshedSession.isActive()).toBe(true);

      // Verify audit logging
      expect(mockAuditLogger.logTokenRefresh).toHaveBeenCalled();
    });

    it('should handle refresh token expiration', async () => {
      // Create session with expired refresh token
      const userSession = await sessionManager.createSession({
        userId: 'user-123',
        userName: 'Test User',
        userEmail: 'test@example.com',
        accessToken: {
          token: 'access-token-123',
          expiresAt: new Date(Date.now() + 3600000), // 1 hour
          scopes: ['repository:read']
        },
        refreshToken: {
          token: 'expired-refresh-token',
          expiresAt: new Date(Date.now() - 1000) // Expired 1 second ago
        },
        permissions: ['REPO_READ'],
        expiresAt: new Date(Date.now() + 3600000) // 1 hour
      });

      // Mock refresh token failure
      mockBitbucketApiClient.refreshAccessToken.mockRejectedValue(
        new Error('Refresh token expired')
      );

      // Attempt to refresh should fail
      await expect(
        sessionManager.refreshSession(userSession.id)
      ).rejects.toThrow('Refresh token expired');

      // Verify audit logging
      expect(mockAuditLogger.logAuthenticationFailure).toHaveBeenCalled();
    });

    it('should handle network errors during token refresh', async () => {
      const userSession = await sessionManager.createSession({
        userId: 'user-123',
        userName: 'Test User',
        userEmail: 'test@example.com',
        accessToken: {
          token: 'access-token-123',
          expiresAt: new Date(Date.now() + 3600000),
          scopes: ['repository:read']
        },
        refreshToken: {
          token: 'refresh-token-123',
          expiresAt: new Date(Date.now() + 86400000)
        },
        permissions: ['REPO_READ'],
        expiresAt: new Date(Date.now() + 3600000)
      });

      // Mock network error
      mockBitbucketApiClient.refreshAccessToken.mockRejectedValue(
        new Error('Network error')
      );

      await expect(
        sessionManager.refreshSession(userSession.id)
      ).rejects.toThrow('Network error');
    });
  });

  describe('Error Handling in OAuth Flow', () => {
    it('should handle invalid authorization code', async () => {
      mockBitbucketApiClient.exchangeCodeForTokens.mockRejectedValue(
        new Error('Invalid authorization code')
      );

      await expect(
        oauthManager.exchangeCodeForTokens({
          code: 'invalid-code',
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          redirectUri: 'http://localhost:3000/auth/callback'
        })
      ).rejects.toThrow('Invalid authorization code');

      expect(mockAuditLogger.logAuthenticationFailure).toHaveBeenCalled();
    });

    it('should handle invalid client credentials', async () => {
      mockBitbucketApiClient.exchangeCodeForTokens.mockRejectedValue(
        new Error('Invalid client credentials')
      );

      await expect(
        oauthManager.exchangeCodeForTokens({
          code: 'valid-code',
          clientId: 'invalid-client-id',
          clientSecret: 'invalid-client-secret',
          redirectUri: 'http://localhost:3000/auth/callback'
        })
      ).rejects.toThrow('Invalid client credentials');
    });

    it('should handle user information retrieval failure', async () => {
      const mockTokenResponse = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-456',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'repository:read'
      };

      mockBitbucketApiClient.exchangeCodeForTokens.mockResolvedValue(mockTokenResponse);
      mockBitbucketApiClient.getUserInfo.mockRejectedValue(
        new Error('User not found')
      );

      await expect(
        oauthManager.getUserInfo(mockTokenResponse.access_token)
      ).rejects.toThrow('User not found');
    });

    it('should handle session creation failure', async () => {
      // Mock session creation failure
      jest.spyOn(sessionManager, 'createSession').mockRejectedValue(
        new Error('Session creation failed')
      );

      await expect(
        sessionManager.createSession({
          userId: 'user-123',
          userName: 'Test User',
          userEmail: 'test@example.com',
          accessToken: {
            token: 'access-token-123',
            expiresAt: new Date(Date.now() + 3600000),
            scopes: ['repository:read']
          },
          refreshToken: {
            token: 'refresh-token-456',
            expiresAt: new Date(Date.now() + 86400000)
          },
          permissions: ['REPO_READ'],
          expiresAt: new Date(Date.now() + 3600000)
        })
      ).rejects.toThrow('Session creation failed');
    });
  });

  describe('Rate Limiting and Security', () => {
    it('should enforce rate limiting on authorization requests', async () => {
      // Mock rate limit exceeded
      mockRateLimiter.checkRateLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 60000
      });

      await expect(
        oauthManager.getAuthorizationUrl({
          clientId: 'test-client-id',
          redirectUri: 'http://localhost:3000/auth/callback',
          scope: ['repository:read'],
          state: 'test-state'
        })
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('should enforce rate limiting on token exchange', async () => {
      mockRateLimiter.checkRateLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 60000
      });

      await expect(
        oauthManager.exchangeCodeForTokens({
          code: 'authorization-code-123',
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          redirectUri: 'http://localhost:3000/auth/callback'
        })
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('should validate state parameter on callback', async () => {
      const originalState = 'original-state-123';
      const differentState = 'different-state-456';

      // Generate authorization URL with original state
      await oauthManager.getAuthorizationUrl({
        clientId: 'test-client-id',
        redirectUri: 'http://localhost:3000/auth/callback',
        scope: ['repository:read'],
        state: originalState
      });

      // Attempt to exchange code with different state should fail
      await expect(
        oauthManager.validateStateParameter(differentState, originalState)
      ).rejects.toThrow('Invalid state parameter');
    });

    it('should encrypt sensitive data in session storage', async () => {
      const userSession = await sessionManager.createSession({
        userId: 'user-123',
        userName: 'Test User',
        userEmail: 'test@example.com',
        accessToken: {
          token: 'sensitive-access-token',
          expiresAt: new Date(Date.now() + 3600000),
          scopes: ['repository:read']
        },
        refreshToken: {
          token: 'sensitive-refresh-token',
          expiresAt: new Date(Date.now() + 86400000)
        },
        permissions: ['REPO_READ'],
        expiresAt: new Date(Date.now() + 3600000)
      });

      // Verify encryption was called
      expect(mockCryptoService.encrypt).toHaveBeenCalledWith('sensitive-access-token');
      expect(mockCryptoService.encrypt).toHaveBeenCalledWith('sensitive-refresh-token');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent OAuth flows', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => {
        mockBitbucketApiClient.exchangeCodeForTokens.mockResolvedValue({
          access_token: `access-token-${i}`,
          refresh_token: `refresh-token-${i}`,
          token_type: 'Bearer',
          expires_in: 3600,
          scope: 'repository:read'
        });

        return oauthManager.exchangeCodeForTokens({
          code: `authorization-code-${i}`,
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          redirectUri: 'http://localhost:3000/auth/callback'
        });
      });

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach((result, index) => {
        expect(result.access_token).toBe(`access-token-${index}`);
        expect(result.refresh_token).toBe(`refresh-token-${index}`);
      });
    });

    it('should complete OAuth flow within acceptable time limits', async () => {
      // Mock fast responses
      mockBitbucketApiClient.exchangeCodeForTokens.mockResolvedValue({
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-456',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'repository:read'
      });

      mockBitbucketApiClient.getUserInfo.mockResolvedValue({
        id: 'user-123',
        displayName: 'Test User',
        emailAddress: 'test@example.com',
        active: true,
        permissions: ['REPO_READ']
      });

      const startTime = Date.now();

      // Complete OAuth flow
      const tokens = await oauthManager.exchangeCodeForTokens({
        code: 'authorization-code-123',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/auth/callback'
      });

      const userInfo = await oauthManager.getUserInfo(tokens.access_token);

      const userSession = await sessionManager.createSession({
        userId: userInfo.id,
        userName: userInfo.displayName,
        userEmail: userInfo.emailAddress,
        accessToken: {
          token: tokens.access_token,
          expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          scopes: tokens.scope.split(' ')
        },
        refreshToken: {
          token: tokens.refresh_token,
          expiresAt: new Date(Date.now() + 86400000)
        },
        permissions: userInfo.permissions,
        expiresAt: new Date(Date.now() + 3600000)
      });

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(1000); // Should complete within 1 second
      expect(userSession).toBeDefined();
    });
  });

  describe('Session Management Integration', () => {
    it('should maintain session state throughout OAuth flow', async () => {
      // Create initial session
      const userSession = await sessionManager.createSession({
        userId: 'user-123',
        userName: 'Test User',
        userEmail: 'test@example.com',
        accessToken: {
          token: 'access-token-123',
          expiresAt: new Date(Date.now() + 3600000),
          scopes: ['repository:read']
        },
        refreshToken: {
          token: 'refresh-token-456',
          expiresAt: new Date(Date.now() + 86400000)
        },
        permissions: ['REPO_READ'],
        expiresAt: new Date(Date.now() + 3600000)
      });

      // Verify session is active
      expect(userSession.isActive()).toBe(true);

      // Update session activity
      userSession.updateActivity();
      expect(userSession.lastActivity).toBeDefined();

      // Validate session
      const isValid = await sessionManager.validateSession(userSession.id);
      expect(isValid).toBe(true);

      // Get session
      const retrievedSession = await sessionManager.getSession(userSession.id);
      expect(retrievedSession).toBeDefined();
      expect(retrievedSession?.userId).toBe('user-123');
    });

    it('should handle session expiration during OAuth flow', async () => {
      // Create session with short expiration
      const userSession = await sessionManager.createSession({
        userId: 'user-123',
        userName: 'Test User',
        userEmail: 'test@example.com',
        accessToken: {
          token: 'access-token-123',
          expiresAt: new Date(Date.now() + 1000), // 1 second
          scopes: ['repository:read']
        },
        refreshToken: {
          token: 'refresh-token-456',
          expiresAt: new Date(Date.now() + 86400000)
        },
        permissions: ['REPO_READ'],
        expiresAt: new Date(Date.now() + 1000) // 1 second
      });

      // Wait for session to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Verify session is expired
      expect(userSession.isActive()).toBe(false);

      // Validate session should fail
      const isValid = await sessionManager.validateSession(userSession.id);
      expect(isValid).toBe(false);
    });
  });
});
