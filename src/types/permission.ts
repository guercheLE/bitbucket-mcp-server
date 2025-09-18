import { z } from 'zod';

/**
 * Permission entity model for Bitbucket Data Center and Cloud
 * T033: Permission entity model in src/types/permission.ts
 * 
 * Defines access levels for users or groups
 * Based on data-model.md specifications
 */

// Permission levels enum
export enum PermissionLevel {
  PROJECT_READ = 'PROJECT_READ',
  PROJECT_WRITE = 'PROJECT_WRITE',
  PROJECT_ADMIN = 'PROJECT_ADMIN',
  REPO_READ = 'REPO_READ',
  REPO_WRITE = 'REPO_WRITE',
  REPO_ADMIN = 'REPO_ADMIN'
}

// Permission schema definition
export const PermissionSchema = z.object({
  user: z.string().optional(),
  group: z.string().optional(),
  permission: z.enum([
    PermissionLevel.PROJECT_READ,
    PermissionLevel.PROJECT_WRITE,
    PermissionLevel.PROJECT_ADMIN,
    PermissionLevel.REPO_READ,
    PermissionLevel.REPO_WRITE,
    PermissionLevel.REPO_ADMIN
  ]),
  grantedBy: z.string(),
  grantedDate: z.string().datetime()
}).refine(data => data.user || data.group, {
  message: "Either user or group must be provided"
}).refine(data => !(data.user && data.group), {
  message: "Cannot specify both user and group"
});

// Permission type definition
export type Permission = z.infer<typeof PermissionSchema>;

// Permission creation input schema
export const CreatePermissionSchema = z.object({
  user: z.string().optional(),
  group: z.string().optional(),
  permission: z.enum([
    PermissionLevel.PROJECT_READ,
    PermissionLevel.PROJECT_WRITE,
    PermissionLevel.PROJECT_ADMIN,
    PermissionLevel.REPO_READ,
    PermissionLevel.REPO_WRITE,
    PermissionLevel.REPO_ADMIN
  ]),
  grantedBy: z.string()
}).refine(data => data.user || data.group, {
  message: "Either user or group must be provided"
}).refine(data => !(data.user && data.group), {
  message: "Cannot specify both user and group"
});

export type CreatePermissionInput = z.infer<typeof CreatePermissionSchema>;

// Permission update input schema
export const UpdatePermissionSchema = z.object({
  permission: z.enum([
    PermissionLevel.PROJECT_READ,
    PermissionLevel.PROJECT_WRITE,
    PermissionLevel.PROJECT_ADMIN,
    PermissionLevel.REPO_READ,
    PermissionLevel.REPO_WRITE,
    PermissionLevel.REPO_ADMIN
  ]).optional(),
  grantedBy: z.string().optional()
});

export type UpdatePermissionInput = z.infer<typeof UpdatePermissionSchema>;

// Permission list response schema
export const PermissionListSchema = z.object({
  size: z.number(),
  limit: z.number(),
  isLastPage: z.boolean(),
  values: z.array(PermissionSchema),
  start: z.number()
});

export type PermissionList = z.infer<typeof PermissionListSchema>;

// Permission state enum
export enum PermissionState {
  GRANTED = 'granted',
  ACTIVE = 'active',
  REVOKED = 'revoked'
}

// Permission hierarchy levels
export const PermissionHierarchy = {
  [PermissionLevel.PROJECT_READ]: 1,
  [PermissionLevel.REPO_READ]: 1,
  [PermissionLevel.PROJECT_WRITE]: 2,
  [PermissionLevel.REPO_WRITE]: 2,
  [PermissionLevel.PROJECT_ADMIN]: 3,
  [PermissionLevel.REPO_ADMIN]: 3
} as const;

// Permission business rules validation
export class PermissionValidator {
  /**
   * Validates user name according to business rules
   */
  static validateUser(user?: string): boolean {
    if (!user) return true;
    return user.trim().length > 0;
  }

  /**
   * Validates group name according to business rules
   */
  static validateGroup(group?: string): boolean {
    if (!group) return true;
    return group.trim().length > 0;
  }

  /**
   * Validates permission level according to business rules
   */
  static validatePermission(permission: PermissionLevel): boolean {
    return Object.values(PermissionLevel).includes(permission);
  }

  /**
   * Validates grantedBy field according to business rules
   */
  static validateGrantedBy(grantedBy: string): boolean {
    return grantedBy.trim().length > 0;
  }

  /**
   * Validates user/group constraint according to business rules
   */
  static validateUserGroupConstraint(user?: string, group?: string): boolean {
    return !!(user || group) && !(user && group);
  }

  /**
   * Validates complete permission data
   */
  static validate(permission: CreatePermissionInput): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.validateUser(permission.user)) {
      errors.push('User name must not be empty');
    }

    if (!this.validateGroup(permission.group)) {
      errors.push('Group name must not be empty');
    }

    if (!this.validatePermission(permission.permission)) {
      errors.push('Invalid permission level');
    }

    if (!this.validateGrantedBy(permission.grantedBy)) {
      errors.push('GrantedBy field must not be empty');
    }

    if (!this.validateUserGroupConstraint(permission.user, permission.group)) {
      errors.push('Either user or group must be provided, not both');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Permission factory for creating instances
export class PermissionFactory {
  /**
   * Creates a new permission instance with default values
   */
  static create(input: CreatePermissionInput): Permission {
    const now = new Date().toISOString();
    
    return {
      user: input.user,
      group: input.group,
      permission: input.permission,
      grantedBy: input.grantedBy,
      grantedDate: now
    };
  }

  /**
   * Updates an existing permission instance
   */
  static update(permission: Permission, input: UpdatePermissionInput): Permission {
    return {
      ...permission,
      permission: input.permission ?? permission.permission,
      grantedBy: input.grantedBy ?? permission.grantedBy,
      grantedDate: new Date().toISOString()
    };
  }
}

// Permission hierarchy utilities
export class PermissionHierarchyManager {
  /**
   * Checks if one permission level is higher than another
   */
  static isHigherLevel(permission1: PermissionLevel, permission2: PermissionLevel): boolean {
    return PermissionHierarchy[permission1] > PermissionHierarchy[permission2];
  }

  /**
   * Checks if one permission level is lower than another
   */
  static isLowerLevel(permission1: PermissionLevel, permission2: PermissionLevel): boolean {
    return PermissionHierarchy[permission1] < PermissionHierarchy[permission2];
  }

  /**
   * Checks if one permission level is equal to another
   */
  static isEqualLevel(permission1: PermissionLevel, permission2: PermissionLevel): boolean {
    return PermissionHierarchy[permission1] === PermissionHierarchy[permission2];
  }

  /**
   * Gets the highest permission level from a list
   */
  static getHighestLevel(permissions: PermissionLevel[]): PermissionLevel {
    return permissions.reduce((highest, current) => 
      this.isHigherLevel(current, highest) ? current : highest
    );
  }

  /**
   * Gets the lowest permission level from a list
   */
  static getLowestLevel(permissions: PermissionLevel[]): PermissionLevel {
    return permissions.reduce((lowest, current) => 
      this.isLowerLevel(current, lowest) ? current : lowest
    );
  }
}

// Permission state transitions
export class PermissionStateManager {
  /**
   * Transitions permission to active state
   */
  static activate(permission: Permission): Permission {
    return {
      ...permission,
      grantedDate: new Date().toISOString()
    };
  }

  /**
   * Transitions permission to revoked state
   */
  static revoke(permission: Permission): Permission {
    return {
      ...permission,
      grantedDate: new Date().toISOString()
    };
  }
}

// Export all schemas and types
// Default export
export default PermissionSchema;
