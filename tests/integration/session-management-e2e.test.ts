/**
 * Session Management End-to-End Tests
 * 
 * Comprehensive end-to-end tests for user session management including
 * session creation, validation, refresh, and cleanup operations.
 * 
 * Tests cover:
 * - Session creation and initialization
 * - Session validation and state management
 * - Session refresh and token renewal
 * - Concurrent session handling
 * - Session cleanup and expiration
 * - Security validation for sessions
 * - Performance under load
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SessionManager } from '../../src/server/auth/session-manager';
import { MemoryTokenStorage } from '../../src/server/auth/token-storage';
import { AdvancedCryptoService } from '../../src/server/auth/advanced-crypto';
import { AuthAuditLogger } from '../../src/server/auth/auth-audit-logger';
import { UserSession } from '../../src/types/auth';

// Mock dependencies
jest.mock('../../src/server/auth/advanced-crypto');
jest.mock('../../src/server/auth/auth-audit-logger');

describe('Session Management End-to-End Tests', () => {
  let sessionManager: SessionManager;
  let tokenStorage: MemoryTokenStorage;
  let mockCryptoService: jest.Mocked<AdvancedCryptoService>;
  let mockAuditLogger: jest.Mocked<AuthAuditLogger>;

  beforeEach(() => {
    // Create mock instances
    mockCryptoService = new AdvancedCryptoService() as jest.Mocked<AdvancedCryptoService>;
    mockAuditLogger = new AuthAuditLogger() as jest.Mocked<AuthAuditLogger>;

    // Setup mock implementations
    mockCryptoService.encrypt.mockImplementation((data: string) => `encrypted_${data}`);
    mockCryptoService.decrypt.mockImplementation((data: string) => data.replace('encrypted_', ''));
    mockCryptoService.generateSecureRandom.mockReturnValue('secure-random-string');

    mockAuditLogger.logSessionCreation.mockResolvedValue();
    mockAuditLogger.logSessionValidation.mockResolvedValue();
    mockAuditLogger.logSessionRefresh.mockResolvedValue();
    mockAuditLogger.logSessionTermination.mockResolvedValue();

    // Create real instances
    tokenStorage = new MemoryTokenStorage();
    sessionManager = new SessionManager(tokenStorage, mockCryptoService, mockAuditLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Session Creation and Initialization', () => {
    it('should create a new user session with all required fields', async () => {
      const sessionData = {
        userId: 'user-123',
        userName: 'Test User',
        userEmail: 'test@example.com',
        accessToken: {
          token: 'access-token-123',
          expiresAt: new Date(Date.now() + 3600000), // 1 hour
          scopes: ['repository:read', 'repository:write']
        },
        refreshToken: {
          token: 'refresh-token-456',
          expiresAt: new Date(Date.now() + 86400000) // 24 hours
        },
        permissions: ['REPO_READ', 'REPO_WRITE', 'PROJECT_READ'],
        expiresAt: new Date(Date.now() + 3600000) // 1 hour
      };

      const userSession = await sessionManager.createSession(sessionData);

      expect(userSession).toBeDefined();
      expect(userSession.userId).toBe('user-123');
      expect(userSession.userName).toBe('Test User');
      expect(userSession.userEmail).toBe('test@example.com');
      expect(userSession.permissions).toEqual(['REPO_READ', 'REPO_WRITE', 'PROJECT_READ']);
      expect(userSession.state).toBe('active');
      expect(userSession.isActive()).toBe(true);

      // Verify encryption was called for sensitive data
      expect(mockCryptoService.encrypt).toHaveBeenCalledWith('access-token-123');
      expect(mockCryptoService.encrypt).toHaveBeenCalledWith('refresh-token-456');

      // Verify audit logging
      expect(mockAuditLogger.logSessionCreation).toHaveBeenCalled();
    });

    it('should create multiple sessions for the same user', async () => {
      const sessionData = {
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
      };

      const session1 = await sessionManager.createSession(sessionData);
      const session2 = await sessionManager.createSession(sessionData);

      expect(session1.id).not.toBe(session2.id);
      expect(session1.userId).toBe(session2.userId);
      expect(session1.userName).toBe(session2.userName);

      // Both sessions should be active
      expect(session1.isActive()).toBe(true);
      expect(session2.isActive()).toBe(true);
    });

    it('should handle session creation with minimal required data', async () => {
      const minimalSessionData = {
        userId: 'user-456',
        userName: 'Minimal User',
        userEmail: 'minimal@example.com',
        accessToken: {
          token: 'access-token-789',
          expiresAt: new Date(Date.now() + 3600000),
          scopes: ['repository:read']
        },
        refreshToken: {
          token: 'refresh-token-012',
          expiresAt: new Date(Date.now() + 86400000)
        },
        permissions: [],
        expiresAt: new Date(Date.now() + 3600000)
      };

      const userSession = await sessionManager.createSession(minimalSessionData);

      expect(userSession).toBeDefined();
      expect(userSession.userId).toBe('user-456');
      expect(userSession.permissions).toEqual([]);
      expect(userSession.metadata).toEqual({});
    });

    it('should handle session creation with custom metadata', async () => {
      const sessionData = {
        userId: 'user-789',
        userName: 'Custom User',
        userEmail: 'custom@example.com',
        accessToken: {
          token: 'access-token-345',
          expiresAt: new Date(Date.now() + 3600000),
          scopes: ['repository:read']
        },
        refreshToken: {
          token: 'refresh-token-678',
          expiresAt: new Date(Date.now() + 86400000)
        },
        permissions: ['REPO_READ'],
        expiresAt: new Date(Date.now() + 3600000),
        metadata: {
          clientType: 'web',
          userAgent: 'Mozilla/5.0',
          ipAddress: '192.168.1.1'
        }
      };

      const userSession = await sessionManager.createSession(sessionData);

      expect(userSession.metadata).toEqual({
        clientType: 'web',
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1'
      });
    });
  });

  describe('Session Validation and State Management', () => {
    let userSession: UserSession;

    beforeEach(async () => {
      const sessionData = {
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
      };

      userSession = await sessionManager.createSession(sessionData);
    });

    it('should validate active session', async () => {
      const isValid = await sessionManager.validateSession(userSession.id);

      expect(isValid).toBe(true);
      expect(mockAuditLogger.logSessionValidation).toHaveBeenCalled();
    });

    it('should return false for non-existent session', async () => {
      const isValid = await sessionManager.validateSession('non-existent-session-id');

      expect(isValid).toBe(false);
    });

    it('should return false for expired session', async () => {
      // Create session with short expiration
      const shortSessionData = {
        userId: 'user-456',
        userName: 'Short User',
        userEmail: 'short@example.com',
        accessToken: {
          token: 'access-token-789',
          expiresAt: new Date(Date.now() + 1000), // 1 second
          scopes: ['repository:read']
        },
        refreshToken: {
          token: 'refresh-token-012',
          expiresAt: new Date(Date.now() + 86400000)
        },
        permissions: ['REPO_READ'],
        expiresAt: new Date(Date.now() + 1000) // 1 second
      };

      const shortSession = await sessionManager.createSession(shortSessionData);

      // Wait for session to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      const isValid = await sessionManager.validateSession(shortSession.id);

      expect(isValid).toBe(false);
    });

    it('should update last activity on validation', async () => {
      const originalLastActivity = userSession.lastActivity;

      // Wait a bit to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 10));

      await sessionManager.validateSession(userSession.id);

      // Get updated session
      const updatedSession = await sessionManager.getSession(userSession.id);
      expect(updatedSession?.lastActivity.getTime()).toBeGreaterThan(originalLastActivity.getTime());
    });

    it('should handle session state transitions', async () => {
      // Initially active
      expect(userSession.state).toBe('active');
      expect(userSession.isActive()).toBe(true);

      // Simulate session termination
      await sessionManager.terminateSession(userSession.id);

      const terminatedSession = await sessionManager.getSession(userSession.id);
      expect(terminatedSession?.state).toBe('terminated');
      expect(terminatedSession?.isActive()).toBe(false);

      // Verify audit logging
      expect(mockAuditLogger.logSessionTermination).toHaveBeenCalled();
    });
  });

  describe('Session Refresh and Token Renewal', () => {
    let userSession: UserSession;

    beforeEach(async () => {
      const sessionData = {
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
      };

      userSession = await sessionManager.createSession(sessionData);
    });

    it('should refresh session with new tokens', async () => {
      const newTokens = {
        access_token: 'new-access-token-789',
        refresh_token: 'new-refresh-token-012',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'repository:read repository:write'
      };

      const refreshedSession = await sessionManager.refreshSession(userSession.id, newTokens);

      expect(refreshedSession.accessToken.token).toBe('new-access-token-789');
      expect(refreshedSession.refreshToken.token).toBe('new-refresh-token-012');
      expect(refreshedSession.isActive()).toBe(true);

      // Verify encryption was called for new tokens
      expect(mockCryptoService.encrypt).toHaveBeenCalledWith('new-access-token-789');
      expect(mockCryptoService.encrypt).toHaveBeenCalledWith('new-refresh-token-012');

      // Verify audit logging
      expect(mockAuditLogger.logSessionRefresh).toHaveBeenCalled();
    });

    it('should handle refresh with expired refresh token', async () => {
      // Create session with expired refresh token
      const expiredSessionData = {
        userId: 'user-456',
        userName: 'Expired User',
        userEmail: 'expired@example.com',
        accessToken: {
          token: 'access-token-345',
          expiresAt: new Date(Date.now() + 3600000),
          scopes: ['repository:read']
        },
        refreshToken: {
          token: 'expired-refresh-token',
          expiresAt: new Date(Date.now() - 1000) // Expired
        },
        permissions: ['REPO_READ'],
        expiresAt: new Date(Date.now() + 3600000)
      };

      const expiredSession = await sessionManager.createSession(expiredSessionData);

      const newTokens = {
        access_token: 'new-access-token-678',
        refresh_token: 'new-refresh-token-901',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'repository:read'
      };

      await expect(
        sessionManager.refreshSession(expiredSession.id, newTokens)
      ).rejects.toThrow('Refresh token expired');
    });

    it('should update session expiration on refresh', async () => {
      const newTokens = {
        access_token: 'new-access-token-234',
        refresh_token: 'new-refresh-token-567',
        token_type: 'Bearer',
        expires_in: 7200, // 2 hours
        scope: 'repository:read'
      };

      const originalExpiresAt = userSession.expiresAt;

      const refreshedSession = await sessionManager.refreshSession(userSession.id, newTokens);

      expect(refreshedSession.expiresAt.getTime()).toBeGreaterThan(originalExpiresAt.getTime());
    });

    it('should handle refresh for non-existent session', async () => {
      const newTokens = {
        access_token: 'new-access-token-890',
        refresh_token: 'new-refresh-token-123',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'repository:read'
      };

      await expect(
        sessionManager.refreshSession('non-existent-session-id', newTokens)
      ).rejects.toThrow('Session not found');
    });
  });

  describe('Concurrent Session Handling', () => {
    it('should handle multiple concurrent session creations', async () => {
      const sessionData = {
        userId: 'user-123',
        userName: 'Concurrent User',
        userEmail: 'concurrent@example.com',
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
      };

      const promises = Array.from({ length: 10 }, (_, i) => {
        const data = {
          ...sessionData,
          userId: `user-${i}`,
          accessToken: {
            ...sessionData.accessToken,
            token: `access-token-${i}`
          },
          refreshToken: {
            ...sessionData.refreshToken,
            token: `refresh-token-${i}`
          }
        };
        return sessionManager.createSession(data);
      });

      const sessions = await Promise.all(promises);

      expect(sessions).toHaveLength(10);
      sessions.forEach((session, index) => {
        expect(session.userId).toBe(`user-${index}`);
        expect(session.isActive()).toBe(true);
      });
    });

    it('should handle concurrent session validations', async () => {
      const sessionData = {
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
      };

      const userSession = await sessionManager.createSession(sessionData);

      const promises = Array.from({ length: 20 }, () =>
        sessionManager.validateSession(userSession.id)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(20);
      results.forEach(result => {
        expect(result).toBe(true);
      });
    });

    it('should handle concurrent session refreshes', async () => {
      const sessionData = {
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
      };

      const userSession = await sessionManager.createSession(sessionData);

      const promises = Array.from({ length: 5 }, (_, i) => {
        const newTokens = {
          access_token: `new-access-token-${i}`,
          refresh_token: `new-refresh-token-${i}`,
          token_type: 'Bearer',
          expires_in: 3600,
          scope: 'repository:read'
        };
        return sessionManager.refreshSession(userSession.id, newTokens);
      });

      // Only one refresh should succeed, others should fail
      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(result => result.status === 'fulfilled');
      const failed = results.filter(result => result.status === 'rejected');

      expect(successful).toHaveLength(1);
      expect(failed).toHaveLength(4);
    });
  });

  describe('Session Cleanup and Expiration', () => {
    it('should clean up expired sessions', async () => {
      // Create multiple sessions with different expiration times
      const longSessionData = {
        userId: 'user-long',
        userName: 'Long User',
        userEmail: 'long@example.com',
        accessToken: {
          token: 'access-token-long',
          expiresAt: new Date(Date.now() + 3600000), // 1 hour
          scopes: ['repository:read']
        },
        refreshToken: {
          token: 'refresh-token-long',
          expiresAt: new Date(Date.now() + 86400000) // 24 hours
        },
        permissions: ['REPO_READ'],
        expiresAt: new Date(Date.now() + 3600000) // 1 hour
      };

      const shortSessionData = {
        userId: 'user-short',
        userName: 'Short User',
        userEmail: 'short@example.com',
        accessToken: {
          token: 'access-token-short',
          expiresAt: new Date(Date.now() + 1000), // 1 second
          scopes: ['repository:read']
        },
        refreshToken: {
          token: 'refresh-token-short',
          expiresAt: new Date(Date.now() + 86400000) // 24 hours
        },
        permissions: ['REPO_READ'],
        expiresAt: new Date(Date.now() + 1000) // 1 second
      };

      const longSession = await sessionManager.createSession(longSessionData);
      const shortSession = await sessionManager.createSession(shortSessionData);

      // Wait for short session to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Clean up expired sessions
      const cleanedCount = await sessionManager.cleanupExpiredSessions();

      expect(cleanedCount).toBe(1);

      // Verify long session still exists
      const longSessionExists = await sessionManager.validateSession(longSession.id);
      expect(longSessionExists).toBe(true);

      // Verify short session is cleaned up
      const shortSessionExists = await sessionManager.validateSession(shortSession.id);
      expect(shortSessionExists).toBe(false);
    });

    it('should terminate specific session', async () => {
      const sessionData = {
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
      };

      const userSession = await sessionManager.createSession(sessionData);

      // Verify session is active
      expect(userSession.isActive()).toBe(true);

      // Terminate session
      await sessionManager.terminateSession(userSession.id);

      // Verify session is terminated
      const terminatedSession = await sessionManager.getSession(userSession.id);
      expect(terminatedSession?.isActive()).toBe(false);
      expect(terminatedSession?.state).toBe('terminated');

      // Verify audit logging
      expect(mockAuditLogger.logSessionTermination).toHaveBeenCalled();
    });

    it('should terminate all sessions for a user', async () => {
      const sessionData1 = {
        userId: 'user-123',
        userName: 'Test User',
        userEmail: 'test@example.com',
        accessToken: {
          token: 'access-token-1',
          expiresAt: new Date(Date.now() + 3600000),
          scopes: ['repository:read']
        },
        refreshToken: {
          token: 'refresh-token-1',
          expiresAt: new Date(Date.now() + 86400000)
        },
        permissions: ['REPO_READ'],
        expiresAt: new Date(Date.now() + 3600000)
      };

      const sessionData2 = {
        ...sessionData1,
        accessToken: {
          ...sessionData1.accessToken,
          token: 'access-token-2'
        },
        refreshToken: {
          ...sessionData1.refreshToken,
          token: 'refresh-token-2'
        }
      };

      const session1 = await sessionManager.createSession(sessionData1);
      const session2 = await sessionManager.createSession(sessionData2);

      // Verify both sessions are active
      expect(session1.isActive()).toBe(true);
      expect(session2.isActive()).toBe(true);

      // Terminate all sessions for user
      const terminatedCount = await sessionManager.terminateAllUserSessions('user-123');

      expect(terminatedCount).toBe(2);

      // Verify both sessions are terminated
      const terminatedSession1 = await sessionManager.getSession(session1.id);
      const terminatedSession2 = await sessionManager.getSession(session2.id);

      expect(terminatedSession1?.isActive()).toBe(false);
      expect(terminatedSession2?.isActive()).toBe(false);
    });
  });

  describe('Security Validation', () => {
    it('should encrypt sensitive data in session storage', async () => {
      const sessionData = {
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
      };

      await sessionManager.createSession(sessionData);

      // Verify encryption was called
      expect(mockCryptoService.encrypt).toHaveBeenCalledWith('sensitive-access-token');
      expect(mockCryptoService.encrypt).toHaveBeenCalledWith('sensitive-refresh-token');
    });

    it('should decrypt sensitive data when retrieving session', async () => {
      const sessionData = {
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
      };

      const userSession = await sessionManager.createSession(sessionData);

      // Retrieve session
      const retrievedSession = await sessionManager.getSession(userSession.id);

      // Verify decryption was called
      expect(mockCryptoService.decrypt).toHaveBeenCalled();
      expect(retrievedSession).toBeDefined();
    });

    it('should not expose sensitive data in session object', async () => {
      const sessionData = {
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
      };

      const userSession = await sessionManager.createSession(sessionData);

      // Check that sensitive data is not directly exposed
      expect(userSession.accessToken.token).not.toBe('sensitive-access-token');
      expect(userSession.refreshToken.token).not.toBe('sensitive-refresh-token');
    });

    it('should validate session permissions', async () => {
      const sessionData = {
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
        permissions: ['REPO_READ', 'REPO_WRITE'],
        expiresAt: new Date(Date.now() + 3600000)
      };

      const userSession = await sessionManager.createSession(sessionData);

      // Check permissions
      expect(userSession.permissions).toContain('REPO_READ');
      expect(userSession.permissions).toContain('REPO_WRITE');
      expect(userSession.permissions).not.toContain('ADMIN_WRITE');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large number of concurrent sessions', async () => {
      const sessionData = {
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
      };

      const startTime = Date.now();

      // Create 100 concurrent sessions
      const promises = Array.from({ length: 100 }, (_, i) => {
        const data = {
          ...sessionData,
          userId: `user-${i}`,
          accessToken: {
            ...sessionData.accessToken,
            token: `access-token-${i}`
          },
          refreshToken: {
            ...sessionData.refreshToken,
            token: `refresh-token-${i}`
          }
        };
        return sessionManager.createSession(data);
      });

      const sessions = await Promise.all(promises);
      const endTime = Date.now();

      expect(sessions).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Verify all sessions are active
      sessions.forEach(session => {
        expect(session.isActive()).toBe(true);
      });
    });

    it('should handle rapid session validations', async () => {
      const sessionData = {
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
      };

      const userSession = await sessionManager.createSession(sessionData);

      const startTime = Date.now();

      // Perform 1000 rapid validations
      const promises = Array.from({ length: 1000 }, () =>
        sessionManager.validateSession(userSession.id)
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds

      // All validations should succeed
      results.forEach(result => {
        expect(result).toBe(true);
      });
    });

    it('should maintain performance with session cleanup', async () => {
      // Create 50 sessions with short expiration
      const shortSessionData = {
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
      };

      const promises = Array.from({ length: 50 }, (_, i) => {
        const data = {
          ...shortSessionData,
          userId: `user-${i}`,
          accessToken: {
            ...shortSessionData.accessToken,
            token: `access-token-${i}`
          },
          refreshToken: {
            ...shortSessionData.refreshToken,
            token: `refresh-token-${i}`
          }
        };
        return sessionManager.createSession(data);
      });

      await Promise.all(promises);

      // Wait for sessions to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      const startTime = Date.now();
      const cleanedCount = await sessionManager.cleanupExpiredSessions();
      const endTime = Date.now();

      expect(cleanedCount).toBe(50);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
