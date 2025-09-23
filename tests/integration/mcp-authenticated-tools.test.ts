/**
 * MCP Authenticated Tools End-to-End Tests
 * 
 * Comprehensive end-to-end tests for MCP tools with authentication context.
 * Tests cover the complete workflow from authentication to tool execution
 * with proper user context and permission validation.
 * 
 * Tests cover:
 * - Authentication context passing to MCP tools
 * - Permission-based filtering and validation
 * - User session management in tool execution
 * - Error handling for authentication failures
 * - Performance of authenticated operations
 * - Security validation for authenticated tools
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SearchIdsTool } from '../../src/server/tools/search-ids';
import { GetIdTool } from '../../src/server/tools/get-id';
import { CallIdTool } from '../../src/server/tools/call-id';
import { UserSession } from '../../src/types/auth';
import { ServerDetector } from '../../src/server/services/server-detector';
import { VectorDatabase } from '../../src/server/services/vector-database';
import { BitbucketToolsIntegration } from '../../src/server/auth/bitbucket-tools-integration';

// Mock dependencies
jest.mock('../../src/server/services/server-detector');
jest.mock('../../src/server/services/vector-database');
jest.mock('../../src/server/auth/bitbucket-tools-integration');

describe('MCP Authenticated Tools End-to-End Tests', () => {
  let searchIdsTool: SearchIdsTool;
  let getIdTool: GetIdTool;
  let callIdTool: CallIdTool;
  let mockUserSession: UserSession;
  let mockServerDetector: jest.Mocked<ServerDetector>;
  let mockVectorDatabase: jest.Mocked<VectorDatabase>;
  let mockBitbucketToolsIntegration: jest.Mocked<BitbucketToolsIntegration>;

  beforeEach(() => {
    // Create mock instances
    mockServerDetector = new ServerDetector() as jest.Mocked<ServerDetector>;
    mockVectorDatabase = new VectorDatabase() as jest.Mocked<VectorDatabase>;
    mockBitbucketToolsIntegration = new BitbucketToolsIntegration() as jest.Mocked<BitbucketToolsIntegration>;

    // Setup mock implementations
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
        },
        {
          id: 'bitbucket.create-repository',
          name: 'Create Repository',
          description: 'Create a new repository',
          category: 'repository',
          version: '8.0.0',
          serverType: 'datacenter',
          parameters: ['projectKey', 'name', 'description'],
          authentication: {
            required: true,
            permissions: ['REPO_WRITE']
          },
          score: 0.90
        }
      ],
      total: 2
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

    // Create tool instances
    searchIdsTool = new SearchIdsTool(mockServerDetector, mockVectorDatabase);
    getIdTool = new GetIdTool(mockServerDetector, mockVectorDatabase);
    callIdTool = new CallIdTool(mockServerDetector, mockBitbucketToolsIntegration);

    // Create mock user session
    mockUserSession = {
      id: 'session-123',
      clientSessionId: 'client-session-456',
      state: 'active' as const,
      applicationId: 'mcp-server-app',
      userId: 'user-789',
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
      createdAt: new Date(),
      lastActivity: new Date(),
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
      metadata: {},
      permissions: ['REPO_READ', 'REPO_WRITE', 'PROJECT_READ'],
      updateActivity: jest.fn(),
      isActive: jest.fn().mockReturnValue(true)
    } as UserSession;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('SearchIdsTool Authentication Integration', () => {
    it('should execute search without authentication context', async () => {
      const result = await searchIdsTool.execute({
        query: 'list repositories',
        pagination: { page: 1, limit: 10 }
      });

      expect(result.items).toHaveLength(2);
      expect(result.items[0].authentication.userCanAccess).toBeUndefined();
      expect(result.items[0].authentication.userPermissions).toBeUndefined();
    });

    it('should execute search with authentication context', async () => {
      const result = await searchIdsTool.execute({
        query: 'list repositories',
        pagination: { page: 1, limit: 10 }
      }, mockUserSession);

      expect(result.items).toHaveLength(2);
      expect(result.items[0].authentication.userCanAccess).toBe(true);
      expect(result.items[0].authentication.userPermissions).toEqual(['REPO_READ', 'REPO_WRITE', 'PROJECT_READ']);
    });

    it('should filter results based on user permissions', async () => {
      // Mock user with limited permissions
      const limitedUserSession = {
        ...mockUserSession,
        permissions: ['PROJECT_READ'] // No REPO_READ permission
      };

      const result = await searchIdsTool.execute({
        query: 'list repositories',
        pagination: { page: 1, limit: 10 }
      }, limitedUserSession);

      expect(result.items).toHaveLength(2);
      expect(result.items[0].authentication.userCanAccess).toBe(false); // REPO_READ required
      expect(result.items[1].authentication.userCanAccess).toBe(false); // REPO_WRITE required
    });

    it('should handle search with expired session', async () => {
      const expiredUserSession = {
        ...mockUserSession,
        isActive: jest.fn().mockReturnValue(false)
      };

      const result = await searchIdsTool.execute({
        query: 'list repositories',
        pagination: { page: 1, limit: 10 }
      }, expiredUserSession);

      // Should still work but with limited context
      expect(result.items).toHaveLength(2);
      expect(result.items[0].authentication.userCanAccess).toBe(false);
    });

    it('should include user context in search filters', async () => {
      await searchIdsTool.execute({
        query: 'list repositories',
        pagination: { page: 1, limit: 10 }
      }, mockUserSession);

      expect(mockVectorDatabase.search).toHaveBeenCalledWith({
        query: 'list repositories',
        filters: {
          serverType: 'datacenter',
          version: '8.0.0',
          userPermissions: ['REPO_READ', 'REPO_WRITE', 'PROJECT_READ']
        },
        limit: 10,
        offset: 0
      });
    });
  });

  describe('GetIdTool Authentication Integration', () => {
    it('should get operation details without authentication context', async () => {
      const result = await getIdTool.execute({
        endpoint_id: 'bitbucket.list-repositories'
      });

      expect(result.name).toBe('List Repositories');
      expect(result.authentication.userAuthenticated).toBeUndefined();
      expect(result.authentication.userPermissions).toBeUndefined();
    });

    it('should get operation details with authentication context', async () => {
      const result = await getIdTool.execute({
        endpoint_id: 'bitbucket.list-repositories'
      }, mockUserSession);

      expect(result.name).toBe('List Repositories');
      expect(result.authentication.userAuthenticated).toBe(true);
      expect(result.authentication.userPermissions).toEqual(['REPO_READ', 'REPO_WRITE', 'PROJECT_READ']);
    });

    it('should validate user permissions for operation access', async () => {
      const result = await getIdTool.execute({
        endpoint_id: 'bitbucket.list-repositories'
      }, mockUserSession);

      expect(result.authentication.userAuthenticated).toBe(true);
      // User has REPO_READ permission which is required for list-repositories
      expect(result.authentication.userPermissions).toContain('REPO_READ');
    });

    it('should handle operation requiring higher permissions', async () => {
      // Mock operation requiring admin permissions
      mockVectorDatabase.getOperationDetails.mockResolvedValue({
        id: 'bitbucket.admin-operations',
        name: 'Admin Operations',
        description: 'Administrative operations',
        category: 'admin',
        version: '8.0.0',
        serverType: 'datacenter',
        parameters: [],
        authentication: {
          required: true,
          permissions: ['ADMIN_WRITE']
        }
      });

      const result = await getIdTool.execute({
        endpoint_id: 'bitbucket.admin-operations'
      }, mockUserSession);

      expect(result.authentication.userAuthenticated).toBe(true);
      expect(result.authentication.userPermissions).not.toContain('ADMIN_WRITE');
    });
  });

  describe('CallIdTool Authentication Integration', () => {
    it('should execute operation without authentication context', async () => {
      const result = await callIdTool.execute({
        endpoint_id: 'bitbucket.list-repositories',
        params: { projectKey: 'TEST' }
      });

      expect(result.success).toBe(true);
      expect(result.metadata.user_context.authenticated).toBe(false);
    });

    it('should execute operation with authentication context', async () => {
      const result = await callIdTool.execute({
        endpoint_id: 'bitbucket.list-repositories',
        params: { projectKey: 'TEST' }
      }, mockUserSession);

      expect(result.success).toBe(true);
      expect(result.metadata.user_context.authenticated).toBe(true);
      expect(result.metadata.user_context.user_id).toBe('user-789');
      expect(result.metadata.user_context.user_name).toBe('Test User');
      expect(result.metadata.user_context.permissions).toEqual(['REPO_READ', 'REPO_WRITE', 'PROJECT_READ']);
      expect(result.metadata.user_context.session_active).toBe(true);
    });

    it('should validate authentication for protected operations', async () => {
      // Test with operation that requires authentication
      const result = await callIdTool.execute({
        endpoint_id: 'bitbucket.create-repository',
        params: { projectKey: 'TEST', name: 'new-repo' }
      }, mockUserSession);

      expect(result.success).toBe(true);
      expect(result.metadata.user_context.authenticated).toBe(true);
    });

    it('should handle authentication failure for protected operations', async () => {
      // Test without user session for protected operation
      await expect(
        callIdTool.execute({
          endpoint_id: 'bitbucket.create-repository',
          params: { projectKey: 'TEST', name: 'new-repo' }
        })
      ).rejects.toThrow('Operation bitbucket.create-repository requires authentication');
    });

    it('should handle expired session', async () => {
      const expiredUserSession = {
        ...mockUserSession,
        isActive: jest.fn().mockReturnValue(false)
      };

      await expect(
        callIdTool.execute({
          endpoint_id: 'bitbucket.create-repository',
          params: { projectKey: 'TEST', name: 'new-repo' }
        }, expiredUserSession)
      ).rejects.toThrow('User session has expired for operation bitbucket.create-repository');
    });

    it('should include user context in execution context', async () => {
      await callIdTool.execute({
        endpoint_id: 'bitbucket.list-repositories',
        params: { projectKey: 'TEST' }
      }, mockUserSession);

      expect(mockBitbucketToolsIntegration.executeTool).toHaveBeenCalledWith(
        'bitbucket.list-repositories',
        { projectKey: 'TEST' },
        expect.objectContaining({
          authentication: expect.objectContaining({
            userSession: mockUserSession,
            userId: 'user-789',
            userName: 'Test User',
            isAuthenticated: true
          })
        })
      );
    });

    it('should handle operation execution errors with user context', async () => {
      mockBitbucketToolsIntegration.executeTool.mockRejectedValue(
        new Error('Repository not found')
      );

      const result = await callIdTool.execute({
        endpoint_id: 'bitbucket.list-repositories',
        params: { projectKey: 'NONEXISTENT' }
      }, mockUserSession);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Repository not found');
      expect(result.metadata.user_context.authenticated).toBe(true);
    });
  });

  describe('End-to-End Authentication Workflow', () => {
    it('should complete full workflow from search to execution', async () => {
      // Step 1: Search for operations
      const searchResults = await searchIdsTool.execute({
        query: 'list repositories',
        pagination: { page: 1, limit: 10 }
      }, mockUserSession);

      expect(searchResults.items).toHaveLength(2);
      expect(searchResults.items[0].authentication.userCanAccess).toBe(true);

      // Step 2: Get operation details
      const operationDetails = await getIdTool.execute({
        endpoint_id: 'bitbucket.list-repositories'
      }, mockUserSession);

      expect(operationDetails.authentication.userAuthenticated).toBe(true);

      // Step 3: Execute operation
      const executionResult = await callIdTool.execute({
        endpoint_id: 'bitbucket.list-repositories',
        params: { projectKey: 'TEST' }
      }, mockUserSession);

      expect(executionResult.success).toBe(true);
      expect(executionResult.metadata.user_context.authenticated).toBe(true);
    });

    it('should handle permission escalation in workflow', async () => {
      // User with limited permissions
      const limitedUserSession = {
        ...mockUserSession,
        permissions: ['PROJECT_READ'] // No repository permissions
      };

      // Step 1: Search should show limited access
      const searchResults = await searchIdsTool.execute({
        query: 'repository operations',
        pagination: { page: 1, limit: 10 }
      }, limitedUserSession);

      expect(searchResults.items[0].authentication.userCanAccess).toBe(false);

      // Step 2: Get details should show insufficient permissions
      const operationDetails = await getIdTool.execute({
        endpoint_id: 'bitbucket.list-repositories'
      }, limitedUserSession);

      expect(operationDetails.authentication.userAuthenticated).toBe(true);
      expect(operationDetails.authentication.userPermissions).not.toContain('REPO_READ');

      // Step 3: Execution should fail due to insufficient permissions
      await expect(
        callIdTool.execute({
          endpoint_id: 'bitbucket.list-repositories',
          params: { projectKey: 'TEST' }
        }, limitedUserSession)
      ).rejects.toThrow();
    });

    it('should handle session expiration during workflow', async () => {
      // Start with active session
      const searchResults = await searchIdsTool.execute({
        query: 'list repositories',
        pagination: { page: 1, limit: 10 }
      }, mockUserSession);

      expect(searchResults.items[0].authentication.userCanAccess).toBe(true);

      // Simulate session expiration
      const expiredUserSession = {
        ...mockUserSession,
        isActive: jest.fn().mockReturnValue(false)
      };

      // Subsequent operations should handle expired session
      await expect(
        callIdTool.execute({
          endpoint_id: 'bitbucket.list-repositories',
          params: { projectKey: 'TEST' }
        }, expiredUserSession)
      ).rejects.toThrow('User session has expired');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent authenticated requests', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        searchIdsTool.execute({
          query: `search ${i}`,
          pagination: { page: 1, limit: 5 }
        }, mockUserSession)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.items).toBeDefined();
        expect(result.pagination).toBeDefined();
      });
    });

    it('should maintain performance with large result sets', async () => {
      // Mock large result set
      mockVectorDatabase.search.mockResolvedValue({
        results: Array.from({ length: 100 }, (_, i) => ({
          id: `operation-${i}`,
          name: `Operation ${i}`,
          description: `Description for operation ${i}`,
          category: 'test',
          version: '8.0.0',
          serverType: 'datacenter',
          parameters: [],
          authentication: { required: true, permissions: ['REPO_READ'] },
          score: 0.9
        })),
        total: 100
      });

      const startTime = Date.now();
      const result = await searchIdsTool.execute({
        query: 'large result set',
        pagination: { page: 1, limit: 50 }
      }, mockUserSession);
      const endTime = Date.now();

      expect(result.items).toHaveLength(50);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Security Validation', () => {
    it('should not expose sensitive user information in responses', async () => {
      const result = await searchIdsTool.execute({
        query: 'list repositories',
        pagination: { page: 1, limit: 10 }
      }, mockUserSession);

      // Check that sensitive information is not exposed
      expect(JSON.stringify(result)).not.toContain('access-token-123');
      expect(JSON.stringify(result)).not.toContain('refresh-token-456');
      expect(JSON.stringify(result)).not.toContain('session-123');
    });

    it('should validate user permissions before operation execution', async () => {
      const unauthorizedUserSession = {
        ...mockUserSession,
        permissions: [] // No permissions
      };

      await expect(
        callIdTool.execute({
          endpoint_id: 'bitbucket.create-repository',
          params: { projectKey: 'TEST', name: 'new-repo' }
        }, unauthorizedUserSession)
      ).rejects.toThrow();
    });

    it('should handle malformed user sessions gracefully', async () => {
      const malformedUserSession = {
        ...mockUserSession,
        permissions: undefined as any
      };

      const result = await searchIdsTool.execute({
        query: 'list repositories',
        pagination: { page: 1, limit: 10 }
      }, malformedUserSession);

      expect(result.items).toBeDefined();
      // Should handle gracefully without crashing
    });
  });
});
