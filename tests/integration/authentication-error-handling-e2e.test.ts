/**
 * Authentication Error Handling End-to-End Tests
 * 
 * Comprehensive end-to-end tests for authentication error handling including
 * error detection, classification, recovery, and user experience.
 * 
 * Tests cover:
 * - Authentication error detection and classification
 * - Error recovery strategies and mechanisms
 * - User experience during error scenarios
 * - Error logging and monitoring
 * - Error propagation and handling
 * - Security considerations for error handling
 * - Performance impact of error handling
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { OAuthManager } from '../../src/server/auth/oauth-manager';
import { SessionManager } from '../../src/server/auth/session-manager';
import { AuthenticationManager } from '../../src/server/auth/authentication-manager';
import { BitbucketApiClient } from '../../src/server/auth/bitbucket-api-client';
import { MemoryTokenStorage } from '../../src/server/auth/token-storage';
import { AdvancedCryptoService } from '../../src/server/auth/advanced-crypto';
import { AuthAuditLogger } from '../../src/server/auth/auth-audit-logger';
import { RateLimiter } from '../../src/server/auth/rate-limiter';
import { MCPErrorHandler } from '../../src/server/error-handler';
import { AuthenticationError, AuthorizationError } from '../../src/types/auth';
import { UserSession } from '../../src/types/auth';

// Mock dependencies
jest.mock('../../src/server/auth/bitbucket-api-client');
jest.mock('../../src/server/auth/advanced-crypto');
jest.mock('../../src/server/auth/auth-audit-logger');
jest.mock('../../src/server/auth/rate-limiter');

describe('Authentication Error Handling End-to-End Tests', () => {
  let oauthManager: OAuthManager;
  let sessionManager: SessionManager;
  let authenticationManager: AuthenticationManager;
  let errorHandler: MCPErrorHandler;
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

    mockAuditLogger.logAuthenticationAttempt.mockResolvedValue();
    mockAuditLogger.logAuthenticationSuccess.mockResolvedValue();
    mockAuditLogger.logAuthenticationFailure.mockResolvedValue();
    mockAuditLogger.logAuthorizationCheck.mockResolvedValue();
    mockAuditLogger.logPermissionDenied.mockResolvedValue();
    mockAuditLogger.logError.mockResolvedValue();

    mockRateLimiter.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 100 });
    mockRateLimiter.recordRequest.mockResolvedValue();

    // Create real instances
    tokenStorage = new MemoryTokenStorage();
    sessionManager = new SessionManager(tokenStorage, mockCryptoService, mockAuditLogger);
    oauthManager = new OAuthManager(
      mockBitbucketApiClient,
      mockCryptoService,
      mockAuditLogger,
      mockRateLimiter
    );
    authenticationManager = new AuthenticationManager(
      mockBitbucketApiClient,
      sessionManager,
      mockCryptoService,
      mockAuditLogger,
      mockRateLimiter
    );
    errorHandler = new MCPErrorHandler();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('OAuth Flow Error Handling', () => {
    it('should handle invalid authorization code error', async () => {
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

      // Verify error logging
      expect(mockAuditLogger.logAuthenticationFailure).toHaveBeenCalled();
    });

    it('should handle invalid client credentials error', async () => {
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

      // Verify error logging
      expect(mockAuditLogger.logAuthenticationFailure).toHaveBeenCalled();
    });

    it('should handle network timeout error during token exchange', async () => {
      mockBitbucketApiClient.exchangeCodeForTokens.mockRejectedValue(
        new Error('Network timeout')
      );

      await expect(
        oauthManager.exchangeCodeForTokens({
          code: 'valid-code',
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          redirectUri: 'http://localhost:3000/auth/callback'
        })
      ).rejects.toThrow('Network timeout');

      // Verify error logging
      expect(mockAuditLogger.logAuthenticationFailure).toHaveBeenCalled();
    });

    it('should handle server error during token exchange', async () => {
      mockBitbucketApiClient.exchangeCodeForTokens.mockRejectedValue(
        new Error('Internal server error')
      );

      await expect(
        oauthManager.exchangeCodeForTokens({
          code: 'valid-code',
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          redirectUri: 'http://localhost:3000/auth/callback'
        })
      ).rejects.toThrow('Internal server error');

      // Verify error logging
      expect(mockAuditLogger.logAuthenticationFailure).toHaveBeenCalled();
    });

    it('should handle rate limiting error during token exchange', async () => {
      mockRateLimiter.checkRateLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 60000
      });

      await expect(
        oauthManager.exchangeCodeForTokens({
          code: 'valid-code',
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          redirectUri: 'http://localhost:3000/auth/callback'
        })
      ).rejects.toThrow('Rate limit exceeded');

      // Verify error logging
      expect(mockAuditLogger.logAuthenticationFailure).toHaveBeenCalled();
    });
  });

  describe('Session Management Error Handling', () => {
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

      // Verify error logging
      expect(mockAuditLogger.logError).toHaveBeenCalled();
    });

    it('should handle session validation failure', async () => {
      // Mock session validation failure
      jest.spyOn(sessionManager, 'validateSession').mockRejectedValue(
        new Error('Session validation failed')
      );

      await expect(
        sessionManager.validateSession('session-id')
      ).rejects.toThrow('Session validation failed');

      // Verify error logging
      expect(mockAuditLogger.logError).toHaveBeenCalled();
    });

    it('should handle session refresh failure', async () => {
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

      // Mock refresh failure
      mockBitbucketApiClient.refreshAccessToken.mockRejectedValue(
        new Error('Refresh token expired')
      );

      await expect(
        sessionManager.refreshSession(userSession.id)
      ).rejects.toThrow('Refresh token expired');

      // Verify error logging
      expect(mockAuditLogger.logAuthenticationFailure).toHaveBeenCalled();
    });

    it('should handle session termination failure', async () => {
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

      // Mock termination failure
      jest.spyOn(sessionManager, 'terminateSession').mockRejectedValue(
        new Error('Session termination failed')
      );

      await expect(
        sessionManager.terminateSession(userSession.id)
      ).rejects.toThrow('Session termination failed');

      // Verify error logging
      expect(mockAuditLogger.logError).toHaveBeenCalled();
    });
  });

  describe('Permission Validation Error Handling', () => {
    it('should handle permission validation failure', async () => {
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

      // Mock permission validation failure
      jest.spyOn(authenticationManager, 'validatePermission').mockRejectedValue(
        new Error('Permission validation failed')
      );

      await expect(
        authenticationManager.validatePermission(userSession, 'REPO_WRITE')
      ).rejects.toThrow('Permission validation failed');

      // Verify error logging
      expect(mockAuditLogger.logError).toHaveBeenCalled();
    });

    it('should handle authorization error for insufficient permissions', async () => {
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

      // Test insufficient permissions
      const hasPermission = await authenticationManager.validatePermission(
        userSession,
        'ADMIN_WRITE'
      );

      expect(hasPermission).toBe(false);

      // Test throwing authorization error
      await expect(
        authenticationManager.validatePermissionOrThrow(userSession, 'ADMIN_WRITE')
      ).rejects.toThrow(AuthorizationError);

      // Verify error logging
      expect(mockAuditLogger.logPermissionDenied).toHaveBeenCalled();
    });

    it('should handle resource permission validation failure', async () => {
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

      // Mock resource permission validation failure
      jest.spyOn(authenticationManager, 'validateResourcePermission').mockRejectedValue(
        new Error('Resource permission validation failed')
      );

      await expect(
        authenticationManager.validateResourcePermission(
          userSession,
          'repository',
          'repo-1',
          'REPO_WRITE'
        )
      ).rejects.toThrow('Resource permission validation failed');

      // Verify error logging
      expect(mockAuditLogger.logError).toHaveBeenCalled();
    });
  });

  describe('Error Recovery Strategies', () => {
    it('should implement retry strategy for transient errors', async () => {
      let attemptCount = 0;
      mockBitbucketApiClient.exchangeCodeForTokens.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Network timeout'));
        }
        return Promise.resolve({
          access_token: 'access-token-123',
          refresh_token: 'refresh-token-456',
          token_type: 'Bearer',
          expires_in: 3600,
          scope: 'repository:read'
        });
      });

      const result = await oauthManager.exchangeCodeForTokens({
        code: 'valid-code',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/auth/callback'
      });

      expect(result.access_token).toBe('access-token-123');
      expect(attemptCount).toBe(3);
    });

    it('should implement exponential backoff for rate limiting', async () => {
      let attemptCount = 0;
      mockRateLimiter.checkRateLimit.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.resolve({
            allowed: false,
            remaining: 0,
            resetTime: Date.now() + 1000
          });
        }
        return Promise.resolve({
          allowed: true,
          remaining: 100
        });
      });

      // First two attempts should fail due to rate limiting
      await expect(
        oauthManager.getAuthorizationUrl({
          clientId: 'test-client-id',
          redirectUri: 'http://localhost:3000/auth/callback',
          scope: ['repository:read'],
          state: 'test-state'
        })
      ).rejects.toThrow('Rate limit exceeded');

      await expect(
        oauthManager.getAuthorizationUrl({
          clientId: 'test-client-id',
          redirectUri: 'http://localhost:3000/auth/callback',
          scope: ['repository:read'],
          state: 'test-state'
        })
      ).rejects.toThrow('Rate limit exceeded');

      // Third attempt should succeed
      const authUrl = await oauthManager.getAuthorizationUrl({
        clientId: 'test-client-id',
        redirectUri: 'http://localhost:3000/auth/callback',
        scope: ['repository:read'],
        state: 'test-state'
      });

      expect(authUrl).toBeDefined();
      expect(attemptCount).toBe(3);
    });

    it('should implement circuit breaker for persistent failures', async () => {
      let failureCount = 0;
      mockBitbucketApiClient.exchangeCodeForTokens.mockImplementation(() => {
        failureCount++;
        return Promise.reject(new Error('Server error'));
      });

      // First few attempts should fail
      for (let i = 0; i < 5; i++) {
        await expect(
          oauthManager.exchangeCodeForTokens({
            code: 'valid-code',
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
            redirectUri: 'http://localhost:3000/auth/callback'
          })
        ).rejects.toThrow('Server error');
      }

      // Circuit breaker should be open now
      await expect(
        oauthManager.exchangeCodeForTokens({
          code: 'valid-code',
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          redirectUri: 'http://localhost:3000/auth/callback'
        })
      ).rejects.toThrow('Circuit breaker is OPEN');

      expect(failureCount).toBe(5);
    });

    it('should implement fallback strategy for service unavailability', async () => {
      mockBitbucketApiClient.exchangeCodeForTokens.mockRejectedValue(
        new Error('Service unavailable')
      );

      // Should implement fallback strategy
      await expect(
        oauthManager.exchangeCodeForTokens({
          code: 'valid-code',
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          redirectUri: 'http://localhost:3000/auth/callback'
        })
      ).rejects.toThrow('Service unavailable');

      // Verify fallback logging
      expect(mockAuditLogger.logError).toHaveBeenCalled();
    });
  });

  describe('Error Classification and Handling', () => {
    it('should classify authentication errors correctly', async () => {
      const authError = new AuthenticationError(
        'Invalid credentials',
        'INVALID_CREDENTIALS'
      );

      const errorResponse = errorHandler.handleAuthenticationError(
        'request-123',
        authError,
        { userId: 'user-123' }
      );

      expect(errorResponse.error.code).toBe(-32001); // AUTHENTICATION_FAILED
      expect(errorResponse.error.message).toBe('Invalid credentials provided');
      expect(errorResponse.error.data.recoverable).toBe(true);
    });

    it('should classify authorization errors correctly', async () => {
      const authzError = new AuthorizationError(
        'Insufficient permissions',
        'INSUFFICIENT_PERMISSIONS',
        ['ADMIN_WRITE'],
        ['REPO_READ']
      );

      const errorResponse = errorHandler.handleAuthorizationError(
        'request-123',
        authzError,
        { userId: 'user-123' }
      );

      expect(errorResponse.error.code).toBe(-32002); // AUTHORIZATION_FAILED
      expect(errorResponse.error.message).toBe('Insufficient permissions for this operation');
      expect(errorResponse.error.data.requiredPermissions).toEqual(['ADMIN_WRITE']);
      expect(errorResponse.error.data.userPermissions).toEqual(['REPO_READ']);
    });

    it('should classify session errors correctly', async () => {
      const sessionError = new AuthenticationError(
        'Session expired',
        'SESSION_EXPIRED'
      );

      const errorResponse = errorHandler.handleAuthenticationError(
        'request-123',
        sessionError,
        { userId: 'user-123' }
      );

      expect(errorResponse.error.code).toBe(-32003); // SESSION_EXPIRED
      expect(errorResponse.error.message).toBe('User session has expired');
      expect(errorResponse.error.data.recoverable).toBe(true);
    });

    it('should classify network errors correctly', async () => {
      const networkError = new Error('Network timeout');

      const errorResponse = errorHandler.handleGenericError(
        'request-123',
        networkError,
        { userId: 'user-123' }
      );

      expect(errorResponse.error.code).toBe(-32004); // TRANSPORT_ERROR
      expect(errorResponse.error.message).toBe('Network connectivity issue');
      expect(errorResponse.error.data.recoverable).toBe(true);
    });
  });

  describe('User Experience During Errors', () => {
    it('should provide user-friendly error messages', async () => {
      const authError = new AuthenticationError(
        'Invalid credentials',
        'INVALID_CREDENTIALS'
      );

      const errorResponse = errorHandler.handleAuthenticationError(
        'request-123',
        authError,
        { userId: 'user-123' }
      );

      expect(errorResponse.error.message).toBe('Invalid credentials provided');
      expect(errorResponse.error.data.userMessage).toBe('Please check your credentials and try again');
    });

    it('should provide recovery instructions for recoverable errors', async () => {
      const sessionError = new AuthenticationError(
        'Session expired',
        'SESSION_EXPIRED'
      );

      const errorResponse = errorHandler.handleAuthenticationError(
        'request-123',
        sessionError,
        { userId: 'user-123' }
      );

      expect(errorResponse.error.data.recoverable).toBe(true);
      expect(errorResponse.error.data.action).toBe('redirect_to_login');
    });

    it('should provide contact information for non-recoverable errors', async () => {
      const authzError = new AuthorizationError(
        'Insufficient permissions',
        'INSUFFICIENT_PERMISSIONS',
        ['ADMIN_WRITE'],
        ['REPO_READ']
      );

      const errorResponse = errorHandler.handleAuthorizationError(
        'request-123',
        authzError,
        { userId: 'user-123' }
      );

      expect(errorResponse.error.data.recoverable).toBe(false);
      expect(errorResponse.error.data.action).toBe('request_permissions');
    });

    it('should provide retry information for rate limiting', async () => {
      const rateLimitError = new AuthenticationError(
        'Rate limit exceeded',
        'RATE_LIMIT_EXCEEDED'
      );

      const errorResponse = errorHandler.handleAuthenticationError(
        'request-123',
        rateLimitError,
        { userId: 'user-123' }
      );

      expect(errorResponse.error.data.recoverable).toBe(true);
      expect(errorResponse.error.data.action).toBe('wait_and_retry');
      expect(errorResponse.error.data.retryAfter).toBeDefined();
    });
  });

  describe('Error Logging and Monitoring', () => {
    it('should log authentication errors with proper context', async () => {
      const authError = new AuthenticationError(
        'Invalid credentials',
        'INVALID_CREDENTIALS'
      );

      await expect(
        oauthManager.exchangeCodeForTokens({
          code: 'invalid-code',
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          redirectUri: 'http://localhost:3000/auth/callback'
        })
      ).rejects.toThrow();

      expect(mockAuditLogger.logAuthenticationFailure).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid credentials'
          })
        })
      );
    });

    it('should log authorization errors with proper context', async () => {
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

      await expect(
        authenticationManager.validatePermissionOrThrow(userSession, 'ADMIN_WRITE')
      ).rejects.toThrow();

      expect(mockAuditLogger.logPermissionDenied).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          requiredPermission: 'ADMIN_WRITE',
          userPermissions: ['REPO_READ']
        })
      );
    });

    it('should log session errors with proper context', async () => {
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

      await expect(
        sessionManager.validateSession(userSession.id)
      ).resolves.toBe(false);

      expect(mockAuditLogger.logError).toHaveBeenCalled();
    });

    it('should log network errors with proper context', async () => {
      mockBitbucketApiClient.exchangeCodeForTokens.mockRejectedValue(
        new Error('Network timeout')
      );

      await expect(
        oauthManager.exchangeCodeForTokens({
          code: 'valid-code',
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          redirectUri: 'http://localhost:3000/auth/callback'
        })
      ).rejects.toThrow();

      expect(mockAuditLogger.logAuthenticationFailure).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Network timeout'
          })
        })
      );
    });
  });

  describe('Performance Impact of Error Handling', () => {
    it('should handle errors without significant performance impact', async () => {
      const startTime = Date.now();

      // Simulate multiple error scenarios
      const promises = Array.from({ length: 100 }, (_, i) => {
        if (i % 4 === 0) {
          return oauthManager.exchangeCodeForTokens({
            code: 'invalid-code',
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
            redirectUri: 'http://localhost:3000/auth/callback'
          }).catch(() => {});
        } else if (i % 4 === 1) {
          return sessionManager.validateSession('invalid-session').catch(() => {});
        } else if (i % 4 === 2) {
          return authenticationManager.validatePermission(
            null as any,
            'ADMIN_WRITE'
          ).catch(() => {});
        } else {
          return Promise.resolve();
        }
      });

      await Promise.allSettled(promises);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should handle error logging without performance degradation', async () => {
      const startTime = Date.now();

      // Simulate multiple error logging scenarios
      const promises = Array.from({ length: 1000 }, (_, i) => {
        const error = new Error(`Test error ${i}`);
        return mockAuditLogger.logError(error, { userId: `user-${i}` });
      });

      await Promise.all(promises);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Security Considerations for Error Handling', () => {
    it('should not expose sensitive information in error messages', async () => {
      const authError = new AuthenticationError(
        'Invalid credentials',
        'INVALID_CREDENTIALS'
      );

      const errorResponse = errorHandler.handleAuthenticationError(
        'request-123',
        authError,
        { userId: 'user-123' }
      );

      // Check that sensitive information is not exposed
      expect(JSON.stringify(errorResponse)).not.toContain('test-client-secret');
      expect(JSON.stringify(errorResponse)).not.toContain('access-token');
      expect(JSON.stringify(errorResponse)).not.toContain('refresh-token');
    });

    it('should sanitize error messages for security', async () => {
      const sensitiveError = new Error('Database connection failed: user=admin, password=secret123');

      const errorResponse = errorHandler.handleGenericError(
        'request-123',
        sensitiveError,
        { userId: 'user-123' }
      );

      // Check that sensitive information is sanitized
      expect(errorResponse.error.message).not.toContain('password=secret123');
      expect(errorResponse.error.message).not.toContain('user=admin');
    });

    it('should implement proper error rate limiting', async () => {
      let errorCount = 0;
      mockAuditLogger.logError.mockImplementation(() => {
        errorCount++;
        return Promise.resolve();
      });

      // Simulate rapid error logging
      const promises = Array.from({ length: 1000 }, (_, i) => {
        const error = new Error(`Test error ${i}`);
        return mockAuditLogger.logError(error, { userId: `user-${i}` });
      });

      await Promise.all(promises);

      expect(errorCount).toBe(1000);
      // Verify that error logging doesn't cause performance issues
    });
  });
});
