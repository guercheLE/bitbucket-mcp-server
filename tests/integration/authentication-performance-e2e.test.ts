/**
 * Authentication Performance End-to-End Tests
 * 
 * Comprehensive performance tests for authentication operations including
 * OAuth flow, session management, permission validation, and MCP tool execution.
 * 
 * Tests cover:
 * - OAuth flow performance under load
 * - Session management performance
 * - Permission validation performance
 * - MCP tool execution performance
 * - Memory usage and resource management
 * - Scalability and concurrent operations
 * - Performance regression detection
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
import { SearchIdsTool } from '../../src/server/tools/search-ids';
import { GetIdTool } from '../../src/server/tools/get-id';
import { CallIdTool } from '../../src/server/tools/call-id';
import { ServerDetector } from '../../src/server/services/server-detector';
import { VectorDatabase } from '../../src/server/services/vector-database';
import { BitbucketToolsIntegration } from '../../src/server/auth/bitbucket-tools-integration';
import { UserSession } from '../../src/types/auth';

// Mock dependencies
jest.mock('../../src/server/auth/bitbucket-api-client');
jest.mock('../../src/server/auth/advanced-crypto');
jest.mock('../../src/server/auth/auth-audit-logger');
jest.mock('../../src/server/auth/rate-limiter');
jest.mock('../../src/server/services/server-detector');
jest.mock('../../src/server/services/vector-database');
jest.mock('../../src/server/auth/bitbucket-tools-integration');

describe('Authentication Performance End-to-End Tests', () => {
  let oauthManager: OAuthManager;
  let sessionManager: SessionManager;
  let authenticationManager: AuthenticationManager;
  let searchIdsTool: SearchIdsTool;
  let getIdTool: GetIdTool;
  let callIdTool: CallIdTool;
  let mockBitbucketApiClient: jest.Mocked<BitbucketApiClient>;
  let mockCryptoService: jest.Mocked<AdvancedCryptoService>;
  let mockAuditLogger: jest.Mocked<AuthAuditLogger>;
  let mockRateLimiter: jest.Mocked<RateLimiter>;
  let mockServerDetector: jest.Mocked<ServerDetector>;
  let mockVectorDatabase: jest.Mocked<VectorDatabase>;
  let mockBitbucketToolsIntegration: jest.Mocked<BitbucketToolsIntegration>;
  let tokenStorage: MemoryTokenStorage;

  beforeEach(() => {
    // Create mock instances
    mockBitbucketApiClient = new BitbucketApiClient() as jest.Mocked<BitbucketApiClient>;
    mockCryptoService = new AdvancedCryptoService() as jest.Mocked<AdvancedCryptoService>;
    mockAuditLogger = new AuthAuditLogger() as jest.Mocked<AuthAuditLogger>;
    mockRateLimiter = new RateLimiter() as jest.Mocked<RateLimiter>;
    mockServerDetector = new ServerDetector() as jest.Mocked<ServerDetector>;
    mockVectorDatabase = new VectorDatabase() as jest.Mocked<VectorDatabase>;
    mockBitbucketToolsIntegration = new BitbucketToolsIntegration() as jest.Mocked<BitbucketToolsIntegration>;

    // Setup mock implementations
    mockCryptoService.encrypt.mockImplementation((data: string) => `encrypted_${data}`);
    mockCryptoService.decrypt.mockImplementation((data: string) => data.replace('encrypted_', ''));
    mockCryptoService.generateSecureRandom.mockReturnValue('secure-random-string');

    mockAuditLogger.logAuthenticationAttempt.mockResolvedValue();
    mockAuditLogger.logAuthenticationSuccess.mockResolvedValue();
    mockAuditLogger.logAuthenticationFailure.mockResolvedValue();
    mockAuditLogger.logAuthorizationCheck.mockResolvedValue();
    mockAuditLogger.logPermissionDenied.mockResolvedValue();

    mockRateLimiter.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 100 });
    mockRateLimiter.recordRequest.mockResolvedValue();

    mockServerDetector.detectServer.mockResolvedValue({
      type: 'datacenter',
      version: '8.0.0',
      url: 'https://bitbucket.example.com'
    });

    mockVectorDatabase.search.mockResolvedValue({
      results: [
        {
          id: 'bitbucket.list-repositories',
          name: 'List Repositories',
          description: 'List all repositories in a project',
          category: 'repository',
          version: '8.0.0',
          serverType: 'datacenter',
          parameters: ['projectKey', 'limit'],
          authentication: {
            required: true,
            permissions: ['REPO_READ']
          },
          score: 0.95
        }
      ],
      total: 1
    });

    mockVectorDatabase.getOperationDetails.mockResolvedValue({
      id: 'bitbucket.list-repositories',
      name: 'List Repositories',
      description: 'List all repositories in a project',
      category: 'repository',
      version: '8.0.0',
      serverType: 'datacenter',
      parameters: ['projectKey', 'limit'],
      authentication: {
        required: true,
        permissions: ['REPO_READ']
      }
    });

    mockBitbucketToolsIntegration.executeTool.mockResolvedValue({
      success: true,
      data: {
        values: [
          {
            id: 1,
            name: 'test-repo',
            slug: 'test-repo',
            project: { key: 'TEST' }
          }
        ],
        size: 1,
        isLastPage: true
      },
      metadata: {
        executionTime: 150,
        serverType: 'datacenter',
        serverVersion: '8.0.0'
      }
    });

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

    // Create tool instances
    searchIdsTool = new SearchIdsTool(mockServerDetector, mockVectorDatabase);
    getIdTool = new GetIdTool(mockServerDetector, mockVectorDatabase);
    callIdTool = new CallIdTool(mockServerDetector, mockBitbucketToolsIntegration);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('OAuth Flow Performance', () => {
    it('should complete OAuth authorization URL generation within acceptable time', async () => {
      const startTime = Date.now();

      const authUrl = await oauthManager.getAuthorizationUrl({
        clientId: 'test-client-id',
        redirectUri: 'http://localhost:3000/auth/callback',
        scope: ['repository:read', 'repository:write'],
        state: 'test-state'
      });

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(authUrl).toBeDefined();
      expect(executionTime).toBeLessThan(100); // Should complete within 100ms
    });

    it('should complete token exchange within acceptable time', async () => {
      mockBitbucketApiClient.exchangeCodeForTokens.mockResolvedValue({
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-456',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'repository:read repository:write'
      });

      const startTime = Date.now();

      const tokens = await oauthManager.exchangeCodeForTokens({
        code: 'authorization-code-123',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/auth/callback'
      });

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(tokens).toBeDefined();
      expect(executionTime).toBeLessThan(500); // Should complete within 500ms
    });

    it('should handle multiple concurrent OAuth flows efficiently', async () => {
      mockBitbucketApiClient.exchangeCodeForTokens.mockResolvedValue({
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-456',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'repository:read'
      });

      const startTime = Date.now();

      const promises = Array.from({ length: 50 }, (_, i) =>
        oauthManager.exchangeCodeForTokens({
          code: `authorization-code-${i}`,
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          redirectUri: 'http://localhost:3000/auth/callback'
        })
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(results).toHaveLength(50);
      expect(executionTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should handle OAuth flow under high load', async () => {
      mockBitbucketApiClient.exchangeCodeForTokens.mockResolvedValue({
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-456',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'repository:read'
      });

      const startTime = Date.now();

      // Simulate high load with 1000 concurrent requests
      const promises = Array.from({ length: 1000 }, (_, i) =>
        oauthManager.exchangeCodeForTokens({
          code: `authorization-code-${i}`,
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          redirectUri: 'http://localhost:3000/auth/callback'
        })
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(results).toHaveLength(1000);
      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Session Management Performance', () => {
    it('should create sessions efficiently', async () => {
      const startTime = Date.now();

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

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(userSession).toBeDefined();
      expect(executionTime).toBeLessThan(50); // Should complete within 50ms
    });

    it('should validate sessions efficiently', async () => {
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

      const startTime = Date.now();

      const isValid = await sessionManager.validateSession(userSession.id);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(isValid).toBe(true);
      expect(executionTime).toBeLessThan(25); // Should complete within 25ms
    });

    it('should handle multiple concurrent session operations efficiently', async () => {
      const startTime = Date.now();

      // Create 100 concurrent sessions
      const createPromises = Array.from({ length: 100 }, (_, i) =>
        sessionManager.createSession({
          userId: `user-${i}`,
          userName: `Test User ${i}`,
          userEmail: `test${i}@example.com`,
          accessToken: {
            token: `access-token-${i}`,
            expiresAt: new Date(Date.now() + 3600000),
            scopes: ['repository:read']
          },
          refreshToken: {
            token: `refresh-token-${i}`,
            expiresAt: new Date(Date.now() + 86400000)
          },
          permissions: ['REPO_READ'],
          expiresAt: new Date(Date.now() + 3600000)
        })
      );

      const sessions = await Promise.all(createPromises);

      // Validate all sessions concurrently
      const validatePromises = sessions.map(session =>
        sessionManager.validateSession(session.id)
      );

      const validationResults = await Promise.all(validatePromises);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(sessions).toHaveLength(100);
      expect(validationResults).toHaveLength(100);
      expect(validationResults.every(result => result === true)).toBe(true);
      expect(executionTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle session refresh efficiently', async () => {
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

      const newTokens = {
        access_token: 'new-access-token-789',
        refresh_token: 'new-refresh-token-012',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'repository:read'
      };

      const startTime = Date.now();

      const refreshedSession = await sessionManager.refreshSession(userSession.id, newTokens);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(refreshedSession).toBeDefined();
      expect(executionTime).toBeLessThan(100); // Should complete within 100ms
    });
  });

  describe('Permission Validation Performance', () => {
    it('should validate permissions efficiently', async () => {
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
        permissions: ['REPO_READ', 'REPO_WRITE', 'PROJECT_READ'],
        expiresAt: new Date(Date.now() + 3600000)
      });

      const startTime = Date.now();

      const hasPermission = await authenticationManager.validatePermission(
        userSession,
        'REPO_READ'
      );

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(hasPermission).toBe(true);
      expect(executionTime).toBeLessThan(25); // Should complete within 25ms
    });

    it('should validate multiple permissions efficiently', async () => {
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
        permissions: ['REPO_READ', 'REPO_WRITE', 'PROJECT_READ', 'PROJECT_WRITE'],
        expiresAt: new Date(Date.now() + 3600000)
      });

      const startTime = Date.now();

      const hasAllPermissions = await authenticationManager.validatePermissions(
        userSession,
        ['REPO_READ', 'REPO_WRITE', 'PROJECT_READ']
      );

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(hasAllPermissions).toBe(true);
      expect(executionTime).toBeLessThan(50); // Should complete within 50ms
    });

    it('should handle rapid permission validations efficiently', async () => {
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
        permissions: ['REPO_READ', 'REPO_WRITE', 'PROJECT_READ'],
        expiresAt: new Date(Date.now() + 3600000)
      });

      const startTime = Date.now();

      // Perform 1000 rapid permission validations
      const promises = Array.from({ length: 1000 }, (_, i) => {
        const permissions = ['REPO_READ', 'REPO_WRITE', 'PROJECT_READ', 'ADMIN_WRITE'];
        const permission = permissions[i % permissions.length];
        return authenticationManager.validatePermission(userSession, permission);
      });

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(results).toHaveLength(1000);
      expect(executionTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle large permission sets efficiently', async () => {
      const largePermissionSet = Array.from({ length: 1000 }, (_, i) => `PERMISSION_${i}`);
      const userPermissions = largePermissionSet.slice(0, 500);

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
        permissions: userPermissions,
        expiresAt: new Date(Date.now() + 3600000)
      });

      const startTime = Date.now();

      // Validate all permissions
      const promises = largePermissionSet.map(permission =>
        authenticationManager.validatePermission(userSession, permission)
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(results).toHaveLength(1000);
      expect(executionTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe('MCP Tool Execution Performance', () => {
    it('should execute search-ids tool efficiently', async () => {
      const userSession = await createUserSession();

      const startTime = Date.now();

      const result = await searchIdsTool.execute({
        query: 'list repositories',
        pagination: { page: 1, limit: 10 }
      }, userSession);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(result.items).toBeDefined();
      expect(executionTime).toBeLessThan(200); // Should complete within 200ms
    });

    it('should execute get-id tool efficiently', async () => {
      const userSession = await createUserSession();

      const startTime = Date.now();

      const result = await getIdTool.execute({
        endpoint_id: 'bitbucket.list-repositories'
      }, userSession);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(result.name).toBeDefined();
      expect(executionTime).toBeLessThan(150); // Should complete within 150ms
    });

    it('should execute call-id tool efficiently', async () => {
      const userSession = await createUserSession();

      const startTime = Date.now();

      const result = await callIdTool.execute({
        endpoint_id: 'bitbucket.list-repositories',
        params: { projectKey: 'TEST' }
      }, userSession);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(result.success).toBe(true);
      expect(executionTime).toBeLessThan(300); // Should complete within 300ms
    });

    it('should handle multiple concurrent MCP tool executions efficiently', async () => {
      const userSession = await createUserSession();

      const startTime = Date.now();

      // Execute multiple tools concurrently
      const promises = [
        searchIdsTool.execute({
          query: 'list repositories',
          pagination: { page: 1, limit: 10 }
        }, userSession),
        getIdTool.execute({
          endpoint_id: 'bitbucket.list-repositories'
        }, userSession),
        callIdTool.execute({
          endpoint_id: 'bitbucket.list-repositories',
          params: { projectKey: 'TEST' }
        }, userSession)
      ];

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(results).toHaveLength(3);
      expect(executionTime).toBeLessThan(500); // Should complete within 500ms
    });

    it('should handle high load MCP tool executions efficiently', async () => {
      const userSession = await createUserSession();

      const startTime = Date.now();

      // Execute 100 concurrent tool operations
      const promises = Array.from({ length: 100 }, (_, i) => {
        if (i % 3 === 0) {
          return searchIdsTool.execute({
            query: `search ${i}`,
            pagination: { page: 1, limit: 10 }
          }, userSession);
        } else if (i % 3 === 1) {
          return getIdTool.execute({
            endpoint_id: 'bitbucket.list-repositories'
          }, userSession);
        } else {
          return callIdTool.execute({
            endpoint_id: 'bitbucket.list-repositories',
            params: { projectKey: 'TEST' }
          }, userSession);
        }
      });

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(results).toHaveLength(100);
      expect(executionTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe('Memory Usage and Resource Management', () => {
    it('should maintain stable memory usage during session operations', async () => {
      const initialMemory = process.memoryUsage();

      // Create 1000 sessions
      const sessions = [];
      for (let i = 0; i < 1000; i++) {
        const session = await sessionManager.createSession({
          userId: `user-${i}`,
          userName: `Test User ${i}`,
          userEmail: `test${i}@example.com`,
          accessToken: {
            token: `access-token-${i}`,
            expiresAt: new Date(Date.now() + 3600000),
            scopes: ['repository:read']
          },
          refreshToken: {
            token: `refresh-token-${i}`,
            expiresAt: new Date(Date.now() + 86400000)
          },
          permissions: ['REPO_READ'],
          expiresAt: new Date(Date.now() + 3600000)
        });
        sessions.push(session);
      }

      const afterCreationMemory = process.memoryUsage();

      // Validate all sessions
      for (const session of sessions) {
        await sessionManager.validateSession(session.id);
      }

      const afterValidationMemory = process.memoryUsage();

      // Clean up sessions
      for (const session of sessions) {
        await sessionManager.terminateSession(session.id);
      }

      const afterCleanupMemory = process.memoryUsage();

      // Memory usage should be reasonable
      expect(afterCreationMemory.heapUsed - initialMemory.heapUsed).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
      expect(afterValidationMemory.heapUsed - initialMemory.heapUsed).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
      expect(afterCleanupMemory.heapUsed - initialMemory.heapUsed).toBeLessThan(50 * 1024 * 1024); // Less than 50MB after cleanup
    });

    it('should handle memory pressure gracefully', async () => {
      const initialMemory = process.memoryUsage();

      // Create many sessions to simulate memory pressure
      const sessions = [];
      for (let i = 0; i < 5000; i++) {
        const session = await sessionManager.createSession({
          userId: `user-${i}`,
          userName: `Test User ${i}`,
          userEmail: `test${i}@example.com`,
          accessToken: {
            token: `access-token-${i}`,
            expiresAt: new Date(Date.now() + 3600000),
            scopes: ['repository:read']
          },
          refreshToken: {
            token: `refresh-token-${i}`,
            expiresAt: new Date(Date.now() + 86400000)
          },
          permissions: ['REPO_READ'],
          expiresAt: new Date(Date.now() + 3600000)
        });
        sessions.push(session);
      }

      const afterCreationMemory = process.memoryUsage();

      // System should still be responsive
      const startTime = Date.now();
      await sessionManager.validateSession(sessions[0].id);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Should still be responsive
      expect(afterCreationMemory.heapUsed - initialMemory.heapUsed).toBeLessThan(500 * 1024 * 1024); // Less than 500MB
    });

    it('should clean up resources efficiently', async () => {
      const initialMemory = process.memoryUsage();

      // Create sessions
      const sessions = [];
      for (let i = 0; i < 1000; i++) {
        const session = await sessionManager.createSession({
          userId: `user-${i}`,
          userName: `Test User ${i}`,
          userEmail: `test${i}@example.com`,
          accessToken: {
            token: `access-token-${i}`,
            expiresAt: new Date(Date.now() + 3600000),
            scopes: ['repository:read']
          },
          refreshToken: {
            token: `refresh-token-${i}`,
            expiresAt: new Date(Date.now() + 86400000)
          },
          permissions: ['REPO_READ'],
          expiresAt: new Date(Date.now() + 3600000)
        });
        sessions.push(session);
      }

      const afterCreationMemory = process.memoryUsage();

      // Clean up sessions
      const startTime = Date.now();
      for (const session of sessions) {
        await sessionManager.terminateSession(session.id);
      }
      const endTime = Date.now();

      const afterCleanupMemory = process.memoryUsage();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(afterCleanupMemory.heapUsed - initialMemory.heapUsed).toBeLessThan(50 * 1024 * 1024); // Should free most memory
    });
  });

  describe('Scalability and Concurrent Operations', () => {
    it('should handle concurrent OAuth flows efficiently', async () => {
      mockBitbucketApiClient.exchangeCodeForTokens.mockResolvedValue({
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-456',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'repository:read'
      });

      const startTime = Date.now();

      // Simulate 500 concurrent OAuth flows
      const promises = Array.from({ length: 500 }, (_, i) =>
        oauthManager.exchangeCodeForTokens({
          code: `authorization-code-${i}`,
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          redirectUri: 'http://localhost:3000/auth/callback'
        })
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(results).toHaveLength(500);
      expect(executionTime).toBeLessThan(3000); // Should complete within 3 seconds
    });

    it('should handle concurrent session operations efficiently', async () => {
      const startTime = Date.now();

      // Simulate 1000 concurrent session operations
      const promises = Array.from({ length: 1000 }, (_, i) => {
        if (i % 4 === 0) {
          return sessionManager.createSession({
            userId: `user-${i}`,
            userName: `Test User ${i}`,
            userEmail: `test${i}@example.com`,
            accessToken: {
              token: `access-token-${i}`,
              expiresAt: new Date(Date.now() + 3600000),
              scopes: ['repository:read']
            },
            refreshToken: {
              token: `refresh-token-${i}`,
              expiresAt: new Date(Date.now() + 86400000)
            },
            permissions: ['REPO_READ'],
            expiresAt: new Date(Date.now() + 3600000)
          });
        } else if (i % 4 === 1) {
          return sessionManager.validateSession(`session-${i}`);
        } else if (i % 4 === 2) {
          return sessionManager.terminateSession(`session-${i}`);
        } else {
          return sessionManager.cleanupExpiredSessions();
        }
      });

      const results = await Promise.allSettled(promises);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(results).toHaveLength(1000);
      expect(executionTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should handle concurrent permission validations efficiently', async () => {
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
        permissions: ['REPO_READ', 'REPO_WRITE', 'PROJECT_READ'],
        expiresAt: new Date(Date.now() + 3600000)
      });

      const startTime = Date.now();

      // Simulate 2000 concurrent permission validations
      const promises = Array.from({ length: 2000 }, (_, i) => {
        const permissions = ['REPO_READ', 'REPO_WRITE', 'PROJECT_READ', 'ADMIN_WRITE'];
        const permission = permissions[i % permissions.length];
        return authenticationManager.validatePermission(userSession, permission);
      });

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(results).toHaveLength(2000);
      expect(executionTime).toBeLessThan(1500); // Should complete within 1.5 seconds
    });

    it('should handle concurrent MCP tool executions efficiently', async () => {
      const userSession = await createUserSession();

      const startTime = Date.now();

      // Simulate 300 concurrent MCP tool executions
      const promises = Array.from({ length: 300 }, (_, i) => {
        if (i % 3 === 0) {
          return searchIdsTool.execute({
            query: `search ${i}`,
            pagination: { page: 1, limit: 10 }
          }, userSession);
        } else if (i % 3 === 1) {
          return getIdTool.execute({
            endpoint_id: 'bitbucket.list-repositories'
          }, userSession);
        } else {
          return callIdTool.execute({
            endpoint_id: 'bitbucket.list-repositories',
            params: { projectKey: 'TEST' }
          }, userSession);
        }
      });

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(results).toHaveLength(300);
      expect(executionTime).toBeLessThan(3000); // Should complete within 3 seconds
    });
  });

  describe('Performance Regression Detection', () => {
    it('should detect performance regressions in OAuth flow', async () => {
      const startTime = Date.now();

      const authUrl = await oauthManager.getAuthorizationUrl({
        clientId: 'test-client-id',
        redirectUri: 'http://localhost:3000/auth/callback',
        scope: ['repository:read'],
        state: 'test-state'
      });

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Performance regression threshold: should not exceed 200ms
      expect(executionTime).toBeLessThan(200);
      expect(authUrl).toBeDefined();
    });

    it('should detect performance regressions in session management', async () => {
      const startTime = Date.now();

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

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Performance regression threshold: should not exceed 100ms
      expect(executionTime).toBeLessThan(100);
      expect(userSession).toBeDefined();
    });

    it('should detect performance regressions in permission validation', async () => {
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
        permissions: ['REPO_READ', 'REPO_WRITE'],
        expiresAt: new Date(Date.now() + 3600000)
      });

      const startTime = Date.now();

      const hasPermission = await authenticationManager.validatePermission(
        userSession,
        'REPO_READ'
      );

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Performance regression threshold: should not exceed 50ms
      expect(executionTime).toBeLessThan(50);
      expect(hasPermission).toBe(true);
    });

    it('should detect performance regressions in MCP tool execution', async () => {
      const userSession = await createUserSession();

      const startTime = Date.now();

      const result = await callIdTool.execute({
        endpoint_id: 'bitbucket.list-repositories',
        params: { projectKey: 'TEST' }
      }, userSession);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Performance regression threshold: should not exceed 500ms
      expect(executionTime).toBeLessThan(500);
      expect(result.success).toBe(true);
    });
  });

  // Helper function to create user sessions
  async function createUserSession(): Promise<UserSession> {
    return await sessionManager.createSession({
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
    });
  }
});
