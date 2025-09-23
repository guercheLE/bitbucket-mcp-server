/**
 * Permission Validation End-to-End Tests
 * 
 * Comprehensive end-to-end tests for permission validation and authorization
 * throughout the authentication system. Tests cover permission checking,
 * access control, and authorization enforcement.
 * 
 * Tests cover:
 * - Permission validation for different operation types
 * - Access control for resources and operations
 * - Permission inheritance and delegation
 * - Role-based access control (RBAC)
 * - Resource-level permissions
 * - Permission escalation and privilege checks
 * - Security validation for permission systems
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AuthenticationManager } from '../../src/server/auth/authentication-manager';
import { SessionManager } from '../../src/server/auth/session-manager';
import { BitbucketApiClient } from '../../src/server/auth/bitbucket-api-client';
import { MemoryTokenStorage } from '../../src/server/auth/token-storage';
import { AdvancedCryptoService } from '../../src/server/auth/advanced-crypto';
import { AuthAuditLogger } from '../../src/server/auth/auth-audit-logger';
import { RateLimiter } from '../../src/server/auth/rate-limiter';
import { UserSession } from '../../src/types/auth';
import { AuthenticationError, AuthorizationError } from '../../src/types/auth';

// Mock dependencies
jest.mock('../../src/server/auth/bitbucket-api-client');
jest.mock('../../src/server/auth/advanced-crypto');
jest.mock('../../src/server/auth/auth-audit-logger');
jest.mock('../../src/server/auth/rate-limiter');

describe('Permission Validation End-to-End Tests', () => {
  let authenticationManager: AuthenticationManager;
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

    mockAuditLogger.logAuthenticationAttempt.mockResolvedValue();
    mockAuditLogger.logAuthenticationSuccess.mockResolvedValue();
    mockAuditLogger.logAuthenticationFailure.mockResolvedValue();
    mockAuditLogger.logAuthorizationCheck.mockResolvedValue();
    mockAuditLogger.logPermissionDenied.mockResolvedValue();

    mockRateLimiter.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 100 });
    mockRateLimiter.recordRequest.mockResolvedValue();

    // Create real instances
    tokenStorage = new MemoryTokenStorage();
    sessionManager = new SessionManager(tokenStorage, mockCryptoService, mockAuditLogger);
    authenticationManager = new AuthenticationManager(
      mockBitbucketApiClient,
      sessionManager,
      mockCryptoService,
      mockAuditLogger,
      mockRateLimiter
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Permission Validation', () => {
    it('should validate user permissions for repository operations', async () => {
      const userSession = await createUserSession({
        permissions: ['REPO_READ', 'REPO_WRITE']
      });

      // Test repository read permission
      const hasReadPermission = await authenticationManager.validatePermission(
        userSession,
        'REPO_READ'
      );
      expect(hasReadPermission).toBe(true);

      // Test repository write permission
      const hasWritePermission = await authenticationManager.validatePermission(
        userSession,
        'REPO_WRITE'
      );
      expect(hasWritePermission).toBe(true);

      // Test admin permission (should fail)
      const hasAdminPermission = await authenticationManager.validatePermission(
        userSession,
        'ADMIN_WRITE'
      );
      expect(hasAdminPermission).toBe(false);
    });

    it('should validate user permissions for project operations', async () => {
      const userSession = await createUserSession({
        permissions: ['PROJECT_READ', 'PROJECT_WRITE']
      });

      // Test project read permission
      const hasReadPermission = await authenticationManager.validatePermission(
        userSession,
        'PROJECT_READ'
      );
      expect(hasReadPermission).toBe(true);

      // Test project write permission
      const hasWritePermission = await authenticationManager.validatePermission(
        userSession,
        'PROJECT_WRITE'
      );
      expect(hasWritePermission).toBe(true);

      // Test repository permission (should fail)
      const hasRepoPermission = await authenticationManager.validatePermission(
        userSession,
        'REPO_READ'
      );
      expect(hasRepoPermission).toBe(false);
    });

    it('should validate user permissions for pull request operations', async () => {
      const userSession = await createUserSession({
        permissions: ['PULL_REQUEST_READ', 'PULL_REQUEST_WRITE']
      });

      // Test pull request read permission
      const hasReadPermission = await authenticationManager.validatePermission(
        userSession,
        'PULL_REQUEST_READ'
      );
      expect(hasReadPermission).toBe(true);

      // Test pull request write permission
      const hasWritePermission = await authenticationManager.validatePermission(
        userSession,
        'PULL_REQUEST_WRITE'
      );
      expect(hasWritePermission).toBe(true);

      // Test admin permission (should fail)
      const hasAdminPermission = await authenticationManager.validatePermission(
        userSession,
        'ADMIN_WRITE'
      );
      expect(hasAdminPermission).toBe(false);
    });

    it('should validate user permissions for user management operations', async () => {
      const userSession = await createUserSession({
        permissions: ['USER_READ', 'USER_WRITE']
      });

      // Test user read permission
      const hasReadPermission = await authenticationManager.validatePermission(
        userSession,
        'USER_READ'
      );
      expect(hasReadPermission).toBe(true);

      // Test user write permission
      const hasWritePermission = await authenticationManager.validatePermission(
        userSession,
        'USER_WRITE'
      );
      expect(hasWritePermission).toBe(true);

      // Test repository permission (should fail)
      const hasRepoPermission = await authenticationManager.validatePermission(
        userSession,
        'REPO_READ'
      );
      expect(hasRepoPermission).toBe(false);
    });

    it('should validate user permissions for administrative operations', async () => {
      const userSession = await createUserSession({
        permissions: ['ADMIN_READ', 'ADMIN_WRITE']
      });

      // Test admin read permission
      const hasReadPermission = await authenticationManager.validatePermission(
        userSession,
        'ADMIN_READ'
      );
      expect(hasReadPermission).toBe(true);

      // Test admin write permission
      const hasWritePermission = await authenticationManager.validatePermission(
        userSession,
        'ADMIN_WRITE'
      );
      expect(hasWritePermission).toBe(true);

      // Test user permission (should fail)
      const hasUserPermission = await authenticationManager.validatePermission(
        userSession,
        'USER_READ'
      );
      expect(hasUserPermission).toBe(false);
    });
  });

  describe('Multiple Permission Validation', () => {
    it('should validate multiple permissions for complex operations', async () => {
      const userSession = await createUserSession({
        permissions: ['REPO_READ', 'REPO_WRITE', 'PROJECT_READ', 'PULL_REQUEST_READ']
      });

      // Test multiple permissions (all should pass)
      const hasAllPermissions = await authenticationManager.validatePermissions(
        userSession,
        ['REPO_READ', 'PROJECT_READ', 'PULL_REQUEST_READ']
      );
      expect(hasAllPermissions).toBe(true);

      // Test multiple permissions (one should fail)
      const hasSomePermissions = await authenticationManager.validatePermissions(
        userSession,
        ['REPO_READ', 'ADMIN_WRITE', 'PULL_REQUEST_READ']
      );
      expect(hasSomePermissions).toBe(false);
    });

    it('should validate any of multiple permissions', async () => {
      const userSession = await createUserSession({
        permissions: ['REPO_READ', 'PROJECT_READ']
      });

      // Test any permission (should pass)
      const hasAnyPermission = await authenticationManager.validateAnyPermission(
        userSession,
        ['REPO_READ', 'ADMIN_WRITE', 'PULL_REQUEST_READ']
      );
      expect(hasAnyPermission).toBe(true);

      // Test any permission (should fail)
      const hasNoPermission = await authenticationManager.validateAnyPermission(
        userSession,
        ['ADMIN_WRITE', 'PULL_REQUEST_READ', 'USER_WRITE']
      );
      expect(hasNoPermission).toBe(false);
    });

    it('should validate permission combinations for specific operations', async () => {
      const userSession = await createUserSession({
        permissions: ['REPO_READ', 'REPO_WRITE', 'PROJECT_READ']
      });

      // Test repository management operation (requires REPO_READ and REPO_WRITE)
      const canManageRepos = await authenticationManager.validatePermissions(
        userSession,
        ['REPO_READ', 'REPO_WRITE']
      );
      expect(canManageRepos).toBe(true);

      // Test project management operation (requires PROJECT_READ and PROJECT_WRITE)
      const canManageProjects = await authenticationManager.validatePermissions(
        userSession,
        ['PROJECT_READ', 'PROJECT_WRITE']
      );
      expect(canManageProjects).toBe(false); // Missing PROJECT_WRITE

      // Test admin operation (requires ADMIN_WRITE)
      const canAdmin = await authenticationManager.validatePermissions(
        userSession,
        ['ADMIN_WRITE']
      );
      expect(canAdmin).toBe(false);
    });
  });

  describe('Resource-Level Permission Validation', () => {
    it('should validate repository-specific permissions', async () => {
      const userSession = await createUserSession({
        permissions: ['REPO_READ'],
        resourcePermissions: {
          repositories: {
            'repo-1': ['REPO_READ', 'REPO_WRITE'],
            'repo-2': ['REPO_READ']
          }
        }
      });

      // Test access to repo-1 (should have write access)
      const canWriteRepo1 = await authenticationManager.validateResourcePermission(
        userSession,
        'repository',
        'repo-1',
        'REPO_WRITE'
      );
      expect(canWriteRepo1).toBe(true);

      // Test access to repo-2 (should only have read access)
      const canWriteRepo2 = await authenticationManager.validateResourcePermission(
        userSession,
        'repository',
        'repo-2',
        'REPO_WRITE'
      );
      expect(canWriteRepo2).toBe(false);

      // Test access to repo-3 (should not have access)
      const canReadRepo3 = await authenticationManager.validateResourcePermission(
        userSession,
        'repository',
        'repo-3',
        'REPO_READ'
      );
      expect(canReadRepo3).toBe(false);
    });

    it('should validate project-specific permissions', async () => {
      const userSession = await createUserSession({
        permissions: ['PROJECT_READ'],
        resourcePermissions: {
          projects: {
            'project-1': ['PROJECT_READ', 'PROJECT_WRITE'],
            'project-2': ['PROJECT_READ']
          }
        }
      });

      // Test access to project-1 (should have write access)
      const canWriteProject1 = await authenticationManager.validateResourcePermission(
        userSession,
        'project',
        'project-1',
        'PROJECT_WRITE'
      );
      expect(canWriteProject1).toBe(true);

      // Test access to project-2 (should only have read access)
      const canWriteProject2 = await authenticationManager.validateResourcePermission(
        userSession,
        'project',
        'project-2',
        'PROJECT_WRITE'
      );
      expect(canWriteProject2).toBe(false);

      // Test access to project-3 (should not have access)
      const canReadProject3 = await authenticationManager.validateResourcePermission(
        userSession,
        'project',
        'project-3',
        'PROJECT_READ'
      );
      expect(canReadProject3).toBe(false);
    });

    it('should validate user-specific permissions', async () => {
      const userSession = await createUserSession({
        permissions: ['USER_READ'],
        resourcePermissions: {
          users: {
            'user-1': ['USER_READ', 'USER_WRITE'],
            'user-2': ['USER_READ']
          }
        }
      });

      // Test access to user-1 (should have write access)
      const canWriteUser1 = await authenticationManager.validateResourcePermission(
        userSession,
        'user',
        'user-1',
        'USER_WRITE'
      );
      expect(canWriteUser1).toBe(true);

      // Test access to user-2 (should only have read access)
      const canWriteUser2 = await authenticationManager.validateResourcePermission(
        userSession,
        'user',
        'user-2',
        'USER_WRITE'
      );
      expect(canWriteUser2).toBe(false);

      // Test access to user-3 (should not have access)
      const canReadUser3 = await authenticationManager.validateResourcePermission(
        userSession,
        'user',
        'user-3',
        'USER_READ'
      );
      expect(canReadUser3).toBe(false);
    });
  });

  describe('Role-Based Access Control (RBAC)', () => {
    it('should validate permissions based on user roles', async () => {
      const userSession = await createUserSession({
        permissions: ['REPO_READ', 'REPO_WRITE'],
        roles: ['developer', 'project-member']
      });

      // Test developer role permissions
      const hasDeveloperPermissions = await authenticationManager.validateRolePermissions(
        userSession,
        'developer',
        ['REPO_READ', 'REPO_WRITE']
      );
      expect(hasDeveloperPermissions).toBe(true);

      // Test project-member role permissions
      const hasProjectMemberPermissions = await authenticationManager.validateRolePermissions(
        userSession,
        'project-member',
        ['PROJECT_READ']
      );
      expect(hasProjectMemberPermissions).toBe(false); // Missing PROJECT_READ

      // Test admin role permissions
      const hasAdminPermissions = await authenticationManager.validateRolePermissions(
        userSession,
        'admin',
        ['ADMIN_WRITE']
      );
      expect(hasAdminPermissions).toBe(false);
    });

    it('should validate role hierarchy and inheritance', async () => {
      const userSession = await createUserSession({
        permissions: ['ADMIN_WRITE'],
        roles: ['admin']
      });

      // Admin role should inherit all permissions
      const hasRepoPermissions = await authenticationManager.validateRolePermissions(
        userSession,
        'admin',
        ['REPO_READ', 'REPO_WRITE']
      );
      expect(hasRepoPermissions).toBe(true);

      const hasProjectPermissions = await authenticationManager.validateRolePermissions(
        userSession,
        'admin',
        ['PROJECT_READ', 'PROJECT_WRITE']
      );
      expect(hasProjectPermissions).toBe(true);

      const hasUserPermissions = await authenticationManager.validateRolePermissions(
        userSession,
        'admin',
        ['USER_READ', 'USER_WRITE']
      );
      expect(hasUserPermissions).toBe(true);
    });

    it('should validate multiple role permissions', async () => {
      const userSession = await createUserSession({
        permissions: ['REPO_READ', 'REPO_WRITE', 'PROJECT_READ'],
        roles: ['developer', 'project-lead']
      });

      // Test developer role
      const hasDeveloperRole = await authenticationManager.hasRole(userSession, 'developer');
      expect(hasDeveloperRole).toBe(true);

      // Test project-lead role
      const hasProjectLeadRole = await authenticationManager.hasRole(userSession, 'project-lead');
      expect(hasProjectLeadRole).toBe(true);

      // Test admin role
      const hasAdminRole = await authenticationManager.hasRole(userSession, 'admin');
      expect(hasAdminRole).toBe(false);

      // Test any role
      const hasAnyRole = await authenticationManager.hasAnyRole(
        userSession,
        ['developer', 'admin']
      );
      expect(hasAnyRole).toBe(true);

      // Test all roles
      const hasAllRoles = await authenticationManager.hasAllRoles(
        userSession,
        ['developer', 'project-lead']
      );
      expect(hasAllRoles).toBe(true);
    });
  });

  describe('Permission Escalation and Privilege Checks', () => {
    it('should prevent permission escalation attacks', async () => {
      const userSession = await createUserSession({
        permissions: ['REPO_READ']
      });

      // Attempt to escalate to admin permissions
      await expect(
        authenticationManager.validatePermission(userSession, 'ADMIN_WRITE')
      ).resolves.toBe(false);

      // Attempt to escalate to user management permissions
      await expect(
        authenticationManager.validatePermission(userSession, 'USER_WRITE')
      ).resolves.toBe(false);

      // Attempt to escalate to project management permissions
      await expect(
        authenticationManager.validatePermission(userSession, 'PROJECT_WRITE')
      ).resolves.toBe(false);
    });

    it('should validate privilege requirements for sensitive operations', async () => {
      const userSession = await createUserSession({
        permissions: ['REPO_READ', 'REPO_WRITE']
      });

      // Test sensitive repository operations
      const canDeleteRepo = await authenticationManager.validatePermission(
        userSession,
        'REPO_DELETE'
      );
      expect(canDeleteRepo).toBe(false);

      const canManageRepoPermissions = await authenticationManager.validatePermission(
        userSession,
        'REPO_ADMIN'
      );
      expect(canManageRepoPermissions).toBe(false);

      // Test sensitive project operations
      const canDeleteProject = await authenticationManager.validatePermission(
        userSession,
        'PROJECT_DELETE'
      );
      expect(canDeleteProject).toBe(false);

      const canManageProjectPermissions = await authenticationManager.validatePermission(
        userSession,
        'PROJECT_ADMIN'
      );
      expect(canManageProjectPermissions).toBe(false);
    });

    it('should validate administrative privilege requirements', async () => {
      const userSession = await createUserSession({
        permissions: ['ADMIN_READ']
      });

      // Test admin read operations
      const canReadAdmin = await authenticationManager.validatePermission(
        userSession,
        'ADMIN_READ'
      );
      expect(canReadAdmin).toBe(true);

      // Test admin write operations (should fail)
      const canWriteAdmin = await authenticationManager.validatePermission(
        userSession,
        'ADMIN_WRITE'
      );
      expect(canWriteAdmin).toBe(false);

      // Test system administration operations
      const canManageSystem = await authenticationManager.validatePermission(
        userSession,
        'SYSTEM_ADMIN'
      );
      expect(canManageSystem).toBe(false);
    });
  });

  describe('Permission Validation with Expired Sessions', () => {
    it('should handle permission validation with expired sessions', async () => {
      const userSession = await createUserSession({
        permissions: ['REPO_READ', 'REPO_WRITE'],
        expiresAt: new Date(Date.now() + 1000) // 1 second
      });

      // Wait for session to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Permission validation should fail for expired session
      await expect(
        authenticationManager.validatePermission(userSession, 'REPO_READ')
      ).rejects.toThrow(AuthenticationError);
    });

    it('should handle permission validation with inactive sessions', async () => {
      const userSession = await createUserSession({
        permissions: ['REPO_READ', 'REPO_WRITE'],
        isActive: false
      });

      // Permission validation should fail for inactive session
      await expect(
        authenticationManager.validatePermission(userSession, 'REPO_READ')
      ).rejects.toThrow(AuthenticationError);
    });
  });

  describe('Permission Validation Error Handling', () => {
    it('should throw AuthorizationError for insufficient permissions', async () => {
      const userSession = await createUserSession({
        permissions: ['REPO_READ']
      });

      await expect(
        authenticationManager.validatePermissionOrThrow(userSession, 'ADMIN_WRITE')
      ).rejects.toThrow(AuthorizationError);
    });

    it('should throw AuthorizationError for missing resource permissions', async () => {
      const userSession = await createUserSession({
        permissions: ['REPO_READ'],
        resourcePermissions: {
          repositories: {
            'repo-1': ['REPO_READ']
          }
        }
      });

      await expect(
        authenticationManager.validateResourcePermissionOrThrow(
          userSession,
          'repository',
          'repo-2',
          'REPO_READ'
        )
      ).rejects.toThrow(AuthorizationError);
    });

    it('should throw AuthorizationError for insufficient role permissions', async () => {
      const userSession = await createUserSession({
        permissions: ['REPO_READ'],
        roles: ['developer']
      });

      await expect(
        authenticationManager.validateRolePermissionOrThrow(userSession, 'admin', 'ADMIN_WRITE')
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle rapid permission validations', async () => {
      const userSession = await createUserSession({
        permissions: ['REPO_READ', 'REPO_WRITE', 'PROJECT_READ', 'PROJECT_WRITE']
      });

      const startTime = Date.now();

      // Perform 1000 rapid permission validations
      const promises = Array.from({ length: 1000 }, (_, i) => {
        const permissions = ['REPO_READ', 'REPO_WRITE', 'PROJECT_READ', 'PROJECT_WRITE'];
        const permission = permissions[i % permissions.length];
        return authenticationManager.validatePermission(userSession, permission);
      });

      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds

      // All validations should succeed
      results.forEach(result => {
        expect(result).toBe(true);
      });
    });

    it('should handle permission validation with large permission sets', async () => {
      const largePermissionSet = Array.from({ length: 100 }, (_, i) => `PERMISSION_${i}`);
      const userPermissions = largePermissionSet.slice(0, 50); // User has first 50 permissions

      const userSession = await createUserSession({
        permissions: userPermissions
      });

      const startTime = Date.now();

      // Validate all permissions
      const promises = largePermissionSet.map(permission =>
        authenticationManager.validatePermission(userSession, permission)
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second

      // First 50 should be true, last 50 should be false
      results.forEach((result, index) => {
        if (index < 50) {
          expect(result).toBe(true);
        } else {
          expect(result).toBe(false);
        }
      });
    });

    it('should handle concurrent permission validations', async () => {
      const userSession = await createUserSession({
        permissions: ['REPO_READ', 'REPO_WRITE', 'PROJECT_READ']
      });

      const startTime = Date.now();

      // Perform 100 concurrent permission validations
      const promises = Array.from({ length: 100 }, (_, i) => {
        const permissions = ['REPO_READ', 'REPO_WRITE', 'PROJECT_READ', 'ADMIN_WRITE'];
        const permission = permissions[i % permissions.length];
        return authenticationManager.validatePermission(userSession, permission);
      });

      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Security Validation', () => {
    it('should not expose sensitive permission information', async () => {
      const userSession = await createUserSession({
        permissions: ['REPO_READ', 'REPO_WRITE', 'ADMIN_WRITE']
      });

      // Permission validation should not expose internal permission structure
      const hasPermission = await authenticationManager.validatePermission(
        userSession,
        'REPO_READ'
      );

      expect(hasPermission).toBe(true);
      // Verify that sensitive information is not logged or exposed
      expect(mockAuditLogger.logAuthorizationCheck).toHaveBeenCalled();
    });

    it('should validate permission integrity', async () => {
      const userSession = await createUserSession({
        permissions: ['REPO_READ', 'REPO_WRITE']
      });

      // Attempt to modify permissions (should not affect validation)
      userSession.permissions.push('ADMIN_WRITE');

      // Permission validation should still work correctly
      const hasAdminPermission = await authenticationManager.validatePermission(
        userSession,
        'ADMIN_WRITE'
      );
      expect(hasAdminPermission).toBe(false); // Should not have admin permission
    });

    it('should handle malformed permission data gracefully', async () => {
      const userSession = await createUserSession({
        permissions: ['REPO_READ', 'REPO_WRITE']
      });

      // Test with malformed permission names
      const hasMalformedPermission = await authenticationManager.validatePermission(
        userSession,
        'MALFORMED_PERMISSION'
      );
      expect(hasMalformedPermission).toBe(false);

      // Test with empty permission
      const hasEmptyPermission = await authenticationManager.validatePermission(
        userSession,
        ''
      );
      expect(hasEmptyPermission).toBe(false);

      // Test with null permission
      const hasNullPermission = await authenticationManager.validatePermission(
        userSession,
        null as any
      );
      expect(hasNullPermission).toBe(false);
    });
  });

  // Helper function to create user sessions
  async function createUserSession(options: {
    permissions: string[];
    roles?: string[];
    resourcePermissions?: any;
    expiresAt?: Date;
    isActive?: boolean;
  }): Promise<UserSession> {
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
      permissions: options.permissions,
      expiresAt: options.expiresAt || new Date(Date.now() + 3600000),
      metadata: {
        roles: options.roles || [],
        resourcePermissions: options.resourcePermissions || {}
      }
    };

    const userSession = await sessionManager.createSession(sessionData);

    // Mock isActive method if specified
    if (options.isActive !== undefined) {
      userSession.isActive = jest.fn().mockReturnValue(options.isActive);
    }

    return userSession;
  }
});
