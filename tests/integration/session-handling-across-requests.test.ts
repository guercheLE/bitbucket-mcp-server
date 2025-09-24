/**
 * Session Handling Across Requests Tests
 * 
 * Tests for session management and persistence across multiple requests.
 * This test suite focuses on ensuring that user sessions are properly
 * maintained, validated, and updated when handling multiple sequential
 * or concurrent requests from the same client.
 * 
 * Tests cover:
 * - Session persistence across multiple requests
 * - Session state consistency between requests
 * - Session activity tracking and updates
 * - Concurrent request handling with same session
 * - Error handling for invalid sessions across requests
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SessionManager } from '../../src/server/auth/session-manager';
import { OAuthManager } from '../../src/server/auth/oauth-manager';
import { UserSession, AuthenticationConfig } from '../../src/types/auth';

// Mock dependencies
jest.mock('../../src/server/auth/oauth-manager');

describe('Session Handling Across Requests', () => {
  let sessionManager: SessionManager;
  let mockOAuthManager: jest.Mocked<OAuthManager>;
  let authConfig: AuthenticationConfig;

  beforeEach(() => {
    // Create mock OAuth manager
    mockOAuthManager = new OAuthManager({
      defaultApplication: {
        name: 'Test App',
        description: 'Test Application',
        scopes: ['read:repository']
      },
      tokens: {
        accessTokenLifetime: 3600000,
        refreshTokenLifetime: 2592000000,
        refreshThreshold: 300000
      },
      sessions: {
        maxConcurrentSessions: 10,
        sessionTimeout: 86400000,
        activityTimeout: 1800000
      },
      security: {
        encryptTokens: true,
        requireHttps: true,
        csrfProtection: true,
        rateLimitRequests: true
      },
      storage: {
        type: 'memory',
        encryptionKey: 'test-encryption-key'
      },
      logging: {
        logAuthEvents: true,
        logTokenUsage: true,
        logSecurityEvents: true
      }
    }) as jest.Mocked<OAuthManager>;
    
    // Setup mock implementations
    mockOAuthManager.refreshAccessToken.mockResolvedValue({
      success: true,
      data: {
        token: 'new-access-token',
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 3600000),
        scope: ['repository:read'],
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isValid: true
      }
    });

    // Create auth config
    authConfig = {
      defaultApplication: {
        name: 'Test App',
        description: 'Test Application',
        scopes: ['read:repository']
      },
      tokens: {
        accessTokenLifetime: 3600000,
        refreshTokenLifetime: 2592000000,
        refreshThreshold: 300000
      },
      sessions: {
        maxConcurrentSessions: 10,
        sessionTimeout: 86400000,
        activityTimeout: 1800000
      },
      security: {
        encryptTokens: true,
        requireHttps: true,
        csrfProtection: true,
        rateLimitRequests: true
      },
      storage: {
        type: 'memory',
        encryptionKey: 'test-encryption-key'
      },
      logging: {
        logAuthEvents: true,
        logTokenUsage: true,
        logSecurityEvents: true
      }
    };

    // Create session manager
    sessionManager = new SessionManager(mockOAuthManager, authConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Session Persistence Across Multiple Requests', () => {
    let userSession: UserSession;

    beforeEach(async () => {
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
        userSession = sessionResult.data;
      } else {
        throw new Error('Failed to create session');
      }
    });

    it('should maintain session state across multiple sequential requests', async () => {
      // Simulate first request
      const firstRequestResult = await sessionManager.getSession(userSession.id);
      expect(firstRequestResult.success).toBe(true);

      // Simulate second request after some time
      await new Promise(resolve => setTimeout(resolve, 100));
      const secondRequestResult = await sessionManager.getSession(userSession.id);
      expect(secondRequestResult.success).toBe(true);

      // Simulate third request
      await new Promise(resolve => setTimeout(resolve, 100));
      const thirdRequestResult = await sessionManager.getSession(userSession.id);
      expect(thirdRequestResult.success).toBe(true);

      // Verify session is still active and consistent
      if (thirdRequestResult.success) {
        const session = thirdRequestResult.data;
        expect(session.isActive()).toBe(true);
        expect(session.userId).toBe('user-123');
        expect(session.permissions).toEqual(['REPO_READ']);
      }
    });

    it('should update last activity timestamp on each request', async () => {
      const initialLastActivity = userSession.lastActivity;

      // Simulate multiple requests with delays
      await new Promise(resolve => setTimeout(resolve, 50));
      const firstUpdateResult = await sessionManager.updateSessionActivity(userSession.id);
      expect(firstUpdateResult.success).toBe(true);
      
      const firstUpdate = await sessionManager.getSession(userSession.id);
      if (firstUpdate.success) {
        expect(firstUpdate.data.lastActivity.getTime()).toBeGreaterThan(initialLastActivity.getTime());
      }

      await new Promise(resolve => setTimeout(resolve, 50));
      const secondUpdateResult = await sessionManager.updateSessionActivity(userSession.id);
      expect(secondUpdateResult.success).toBe(true);
      
      const secondUpdate = await sessionManager.getSession(userSession.id);
      if (secondUpdate.success && firstUpdate.success) {
        expect(secondUpdate.data.lastActivity.getTime()).toBeGreaterThan(firstUpdate.data.lastActivity.getTime());
      }
    });

    it('should handle session refresh across multiple requests', async () => {
      // Simulate first request with original tokens
      const originalSessionResult = await sessionManager.getSession(userSession.id);
      expect(originalSessionResult.success).toBe(true);

      // Simulate token refresh between requests
      const refreshResult = await sessionManager.refreshSessionToken(userSession.id);
      expect(refreshResult.success).toBe(true);

      // Simulate subsequent requests with new tokens
      const secondRequestResult = await sessionManager.getSession(userSession.id);
      expect(secondRequestResult.success).toBe(true);

      const thirdRequestResult = await sessionManager.getSession(userSession.id);
      expect(thirdRequestResult.success).toBe(true);

      // Verify session maintains new tokens across requests
      if (thirdRequestResult.success) {
        const session = thirdRequestResult.data;
        expect(session.isActive()).toBe(true);
        expect(session.accessToken.token).toBeDefined();
      }
    });
  });

  describe('Concurrent Request Handling with Same Session', () => {
    let userSession: UserSession;

    beforeEach(async () => {
      const sessionResult = await sessionManager.createSession(
        'client-session-456',
        'user-456',
        'Concurrent User',
        'concurrent@example.com',
        'access-token-456',
        'refresh-token-789',
        ['REPO_READ']
      );
      
      if (sessionResult.success) {
        userSession = sessionResult.data;
      } else {
        throw new Error('Failed to create session');
      }
    });

    it('should handle multiple concurrent requests with same session', async () => {
      // Simulate 10 concurrent requests with the same session
      const promises = Array.from({ length: 10 }, (_, i) => {
        return new Promise<boolean>(async (resolve) => {
          // Add small random delay to simulate real-world timing
          await new Promise(r => setTimeout(r, Math.random() * 10));
          const result = await sessionManager.getSession(userSession.id);
          resolve(result.success);
        });
      });

      const results = await Promise.all(promises);

      // All requests should succeed
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toBe(true);
      });

      // Session should still be active
      const sessionResult = await sessionManager.getSession(userSession.id);
      if (sessionResult.success) {
        expect(sessionResult.data.isActive()).toBe(true);
      }
    });

    it('should handle concurrent session activity updates safely', async () => {
      // Simulate concurrent activity updates
      const updatePromises = Array.from({ length: 5 }, () =>
        sessionManager.updateSessionActivity(userSession.id)
      );

      const results = await Promise.all(updatePromises);

      // All updates should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Session should still be valid
      const sessionResult = await sessionManager.getSession(userSession.id);
      if (sessionResult.success) {
        expect(sessionResult.data.isActive()).toBe(true);
      }
    });

    it('should handle race conditions in session refresh', async () => {
      // Simulate concurrent refresh attempts
      const refreshPromises = Array.from({ length: 3 }, () =>
        sessionManager.refreshSessionToken(userSession.id)
      );

      // Only one refresh should succeed, others should handle gracefully
      const results = await Promise.allSettled(refreshPromises);
      
      const successful = results.filter(result => result.status === 'fulfilled');
      const failed = results.filter(result => result.status === 'rejected');

      expect(successful.length).toBeGreaterThan(0);
      expect(successful.length + failed.length).toBe(3);

      // Session should still be valid
      const sessionResult = await sessionManager.getSession(userSession.id);
      if (sessionResult.success) {
        expect(sessionResult.data.isActive()).toBe(true);
      }
    });
  });

  describe('Error Handling for Invalid Sessions Across Requests', () => {
    it('should handle non-existent session across multiple requests', async () => {
      const nonExistentSessionId = 'non-existent-session-id';

      // Multiple requests for non-existent session should all fail
      const requests = Array.from({ length: 5 }, () =>
        sessionManager.getSession(nonExistentSessionId)
      );

      const results = await Promise.all(requests);
      
      results.forEach(result => {
        expect(result.success).toBe(false);
      });
    });

    it('should handle malformed session ID across requests', async () => {
      const malformedSessionIds = ['', 'invalid-id', '123'];

      for (const sessionId of malformedSessionIds) {
        const result = await sessionManager.getSession(sessionId);
        expect(result.success).toBe(false);
      }
    });
  });

  describe('Performance and Scalability Across Requests', () => {
    it('should maintain performance with high request frequency', async () => {
      const sessionResult = await sessionManager.createSession(
        'client-session-perf',
        'user-perf',
        'Performance User',
        'perf@example.com',
        'access-token-perf',
        'refresh-token-perf',
        ['REPO_READ']
      );
      
      if (!sessionResult.success) {
        throw new Error('Failed to create session');
      }

      const session = sessionResult.data;
      const startTime = Date.now();

      // Simulate high frequency requests
      const requests = Array.from({ length: 100 }, () =>
        sessionManager.getSession(session.id)
      );

      const results = await Promise.all(requests);
      const endTime = Date.now();

      // All requests should succeed
      expect(results).toHaveLength(100);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(2000); // 2 seconds
    });

    it('should handle mixed request types efficiently', async () => {
      const sessionResult = await sessionManager.createSession(
        'client-session-mixed',
        'user-mixed',
        'Mixed User',
        'mixed@example.com',
        'access-token-mixed',
        'refresh-token-mixed',
        ['REPO_READ']
      );
      
      if (!sessionResult.success) {
        throw new Error('Failed to create session');
      }

      const session = sessionResult.data;
      const startTime = Date.now();

      // Mix of different request types
      const mixedRequests = [
        // Session retrievals
        ...Array.from({ length: 50 }, () => sessionManager.getSession(session.id)),
        // Activity updates
        ...Array.from({ length: 25 }, () => sessionManager.updateSessionActivity(session.id)),
        // Token validations
        ...Array.from({ length: 25 }, () => sessionManager.validateAccessToken('access-token-mixed'))
      ];

      const results = await Promise.all(mixedRequests);
      const endTime = Date.now();

      // All operations should succeed
      expect(results).toHaveLength(100);
      
      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(3000); // 3 seconds
    });
  });

  describe('Session State Consistency Across Requests', () => {
    it('should maintain consistent session state across multiple operations', async () => {
      const sessionResult = await sessionManager.createSession(
        'client-session-consistency',
        'user-consistency',
        'Consistency User',
        'consistency@example.com',
        'access-token-consistency',
        'refresh-token-consistency',
        ['REPO_READ']
      );
      
      if (!sessionResult.success) {
        throw new Error('Failed to create session');
      }

      const session = sessionResult.data;

      // Perform multiple operations and verify consistency
      const operations = [
        () => sessionManager.getSession(session.id),
        () => sessionManager.updateSessionActivity(session.id),
        () => sessionManager.getSession(session.id),
        () => sessionManager.updateSessionActivity(session.id),
        () => sessionManager.getSession(session.id)
      ];

      for (const operation of operations) {
        const result = await operation();
        expect(result.success).toBe(true);
      }

      // Final state should be consistent
      const finalSessionResult = await sessionManager.getSession(session.id);
      if (finalSessionResult.success) {
        const finalSession = finalSessionResult.data;
        expect(finalSession.isActive()).toBe(true);
        expect(finalSession.userId).toBe('user-consistency');
        expect(finalSession.permissions).toEqual(['REPO_READ']);
      }
    });

    it('should handle session state transitions consistently', async () => {
      const sessionResult = await sessionManager.createSession(
        'client-session-transition',
        'user-transition',
        'Transition User',
        'transition@example.com',
        'access-token-transition',
        'refresh-token-transition',
        ['REPO_READ']
      );
      
      if (!sessionResult.success) {
        throw new Error('Failed to create session');
      }

      const session = sessionResult.data;

      // Verify initial state
      expect(session.state).toBe('active');
      expect(session.isActive()).toBe(true);

      // Simulate multiple requests during active state
      for (let i = 0; i < 5; i++) {
        const result = await sessionManager.getSession(session.id);
        expect(result.success).toBe(true);
      }

      // Terminate session
      const terminateResult = await sessionManager.revokeSession(session.id);
      expect(terminateResult.success).toBe(true);

      // Verify state transition is consistent across requests
      for (let i = 0; i < 3; i++) {
        const result = await sessionManager.getSession(session.id);
        expect(result.success).toBe(false);
      }
    });
  });
});