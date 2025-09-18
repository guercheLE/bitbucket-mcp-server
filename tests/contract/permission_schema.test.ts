import { z } from 'zod';

/**
 * Contract test for Permission entity schema
 * T010: Contract test Permission entity schema in tests/contract/test_permission_schema.ts
 * 
 * This test MUST fail before implementation (Constitution Article V - TDD)
 * Validates the Permission entity schema according to data-model.md specifications
 */

describe('Permission Entity Schema Contract Tests', () => {
  // Schema definition from data-model.md
  const PermissionSchema = z.object({
    user: z.string().optional(),
    group: z.string().optional(),
    permission: z.enum([
      "PROJECT_READ", "PROJECT_WRITE", "PROJECT_ADMIN",
      "REPO_READ", "REPO_WRITE", "REPO_ADMIN"
    ]),
    grantedBy: z.string(),
    grantedDate: z.string().datetime()
  }).refine(data => data.user || data.group, {
    message: "Either user or group must be provided"
  });

  describe('Valid Permission Data - User Permissions', () => {
    it('should validate a complete user permission with all fields', () => {
      const validPermission = {
        user: 'john.doe',
        permission: 'REPO_WRITE',
        grantedBy: 'admin.user',
        grantedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => PermissionSchema.parse(validPermission)).not.toThrow();
    });

    it('should validate all valid permission levels for user', () => {
      const validPermissions = [
        'PROJECT_READ', 'PROJECT_WRITE', 'PROJECT_ADMIN',
        'REPO_READ', 'REPO_WRITE', 'REPO_ADMIN'
      ];

      validPermissions.forEach(permission => {
        const validPermission = {
          user: 'test.user',
          permission: permission as any,
          grantedBy: 'admin.user',
          grantedDate: '2025-01-27T10:00:00Z'
        };

        expect(() => PermissionSchema.parse(validPermission)).not.toThrow();
      });
    });
  });

  describe('Valid Permission Data - Group Permissions', () => {
    it('should validate a complete group permission with all fields', () => {
      const validPermission = {
        group: 'developers',
        permission: 'PROJECT_READ',
        grantedBy: 'admin.user',
        grantedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => PermissionSchema.parse(validPermission)).not.toThrow();
    });

    it('should validate all valid permission levels for group', () => {
      const validPermissions = [
        'PROJECT_READ', 'PROJECT_WRITE', 'PROJECT_ADMIN',
        'REPO_READ', 'REPO_WRITE', 'REPO_ADMIN'
      ];

      validPermissions.forEach(permission => {
        const validPermission = {
          group: 'test.group',
          permission: permission as any,
          grantedBy: 'admin.user',
          grantedDate: '2025-01-27T10:00:00Z'
        };

        expect(() => PermissionSchema.parse(validPermission)).not.toThrow();
      });
    });
  });

  describe('Invalid Permission Data - User/Group Validation', () => {
    it('should reject permission without user or group', () => {
      const invalidPermission = {
        permission: 'REPO_READ',
        grantedBy: 'admin.user',
        grantedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => PermissionSchema.parse(invalidPermission)).toThrow();
    });

    it('should reject permission with both user and group', () => {
      const invalidPermission = {
        user: 'john.doe',
        group: 'developers',
        permission: 'REPO_READ',
        grantedBy: 'admin.user',
        grantedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => PermissionSchema.parse(invalidPermission)).toThrow();
    });

    it('should reject empty user string', () => {
      const invalidPermission = {
        user: '',
        permission: 'REPO_READ',
        grantedBy: 'admin.user',
        grantedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => PermissionSchema.parse(invalidPermission)).toThrow();
    });

    it('should reject empty group string', () => {
      const invalidPermission = {
        group: '',
        permission: 'REPO_READ',
        grantedBy: 'admin.user',
        grantedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => PermissionSchema.parse(invalidPermission)).toThrow();
    });
  });

  describe('Invalid Permission Data - Permission Level Validation', () => {
    it('should reject invalid permission level', () => {
      const invalidPermission = {
        user: 'john.doe',
        permission: 'INVALID_PERMISSION',
        grantedBy: 'admin.user',
        grantedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => PermissionSchema.parse(invalidPermission)).toThrow();
    });

    it('should reject empty permission string', () => {
      const invalidPermission = {
        user: 'john.doe',
        permission: '',
        grantedBy: 'admin.user',
        grantedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => PermissionSchema.parse(invalidPermission)).toThrow();
    });

    it('should reject case-sensitive permission variations', () => {
      const invalidPermissions = [
        'project_read', 'repo_read', 'PROJECT_read', 'REPO_read'
      ];

      invalidPermissions.forEach(permission => {
        const invalidPermission = {
          user: 'john.doe',
          permission: permission as any,
          grantedBy: 'admin.user',
          grantedDate: '2025-01-27T10:00:00Z'
        };

        expect(() => PermissionSchema.parse(invalidPermission)).toThrow();
      });
    });
  });

  describe('Invalid Permission Data - GrantedBy Validation', () => {
    it('should reject empty grantedBy string', () => {
      const invalidPermission = {
        user: 'john.doe',
        permission: 'REPO_READ',
        grantedBy: '',
        grantedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => PermissionSchema.parse(invalidPermission)).toThrow();
    });

    it('should reject missing grantedBy field', () => {
      const invalidPermission = {
        user: 'john.doe',
        permission: 'REPO_READ',
        grantedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => PermissionSchema.parse(invalidPermission)).toThrow();
    });
  });

  describe('Invalid Permission Data - Date Validation', () => {
    it('should reject invalid grantedDate format', () => {
      const invalidPermission = {
        user: 'john.doe',
        permission: 'REPO_READ',
        grantedBy: 'admin.user',
        grantedDate: 'invalid-date'
      };

      expect(() => PermissionSchema.parse(invalidPermission)).toThrow();
    });

    it('should reject missing grantedDate field', () => {
      const invalidPermission = {
        user: 'john.doe',
        permission: 'REPO_READ',
        grantedBy: 'admin.user'
      };

      expect(() => PermissionSchema.parse(invalidPermission)).toThrow();
    });
  });

  describe('Business Rules Validation', () => {
    it('should validate permission hierarchy (READ < WRITE < ADMIN)', () => {
      // This test documents the permission hierarchy
      // The schema validates individual permission levels
      const permissionLevels = {
        READ: ['PROJECT_READ', 'REPO_READ'],
        WRITE: ['PROJECT_WRITE', 'REPO_WRITE'],
        ADMIN: ['PROJECT_ADMIN', 'REPO_ADMIN']
      };

      Object.values(permissionLevels).flat().forEach(permission => {
        const validPermission = {
          user: 'test.user',
          permission: permission as any,
          grantedBy: 'admin.user',
          grantedDate: '2025-01-27T10:00:00Z'
        };

        expect(() => PermissionSchema.parse(validPermission)).not.toThrow();
      });
    });

    it('should enforce user or group constraint (tested at schema level)', () => {
      // This test documents that the schema enforces the user OR group constraint
      const permissionWithUser = {
        user: 'john.doe',
        permission: 'REPO_READ',
        grantedBy: 'admin.user',
        grantedDate: '2025-01-27T10:00:00Z'
      };

      const permissionWithGroup = {
        group: 'developers',
        permission: 'REPO_READ',
        grantedBy: 'admin.user',
        grantedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => PermissionSchema.parse(permissionWithUser)).not.toThrow();
      expect(() => PermissionSchema.parse(permissionWithGroup)).not.toThrow();
    });
  });

  describe('State Transitions', () => {
    it('should support permission granted state', () => {
      const grantedPermission = {
        user: 'john.doe',
        permission: 'REPO_READ',
        grantedBy: 'admin.user',
        grantedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => PermissionSchema.parse(grantedPermission)).not.toThrow();
    });

    it('should support permission revoked state (handled at service level)', () => {
      // Permission revocation is handled at service level by removing the permission
      // The schema only validates the permission structure
      const activePermission = {
        user: 'john.doe',
        permission: 'REPO_READ',
        grantedBy: 'admin.user',
        grantedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => PermissionSchema.parse(activePermission)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in user names', () => {
      const validPermission = {
        user: 'user.name+tag@domain.com',
        permission: 'REPO_READ',
        grantedBy: 'admin.user',
        grantedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => PermissionSchema.parse(validPermission)).not.toThrow();
    });

    it('should handle special characters in group names', () => {
      const validPermission = {
        group: 'group-name_with.special',
        permission: 'REPO_READ',
        grantedBy: 'admin.user',
        grantedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => PermissionSchema.parse(validPermission)).not.toThrow();
    });

    it('should handle long user names', () => {
      const longUserName = 'a'.repeat(100);
      const validPermission = {
        user: longUserName,
        permission: 'REPO_READ',
        grantedBy: 'admin.user',
        grantedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => PermissionSchema.parse(validPermission)).not.toThrow();
    });

    it('should handle long group names', () => {
      const longGroupName = 'a'.repeat(100);
      const validPermission = {
        group: longGroupName,
        permission: 'REPO_READ',
        grantedBy: 'admin.user',
        grantedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => PermissionSchema.parse(validPermission)).not.toThrow();
    });
  });
});
