/**
 * RBAC Role Manager
 *
 * Role-Based Access Control system for managing roles, permissions, and hierarchies.
 * Provides comprehensive role definition, inheritance, and permission management.
 *
 * Features:
 * - Hierarchical role definitions with inheritance
 * - Granular permission system with resource-based access
 * - Dynamic role assignment and revocation
 * - Role-based permission evaluation
 * - Comprehensive audit logging for role changes
 */
import { EventEmitter } from 'events';
import { z } from 'zod';
/**
 * Permission Schema
 */
export declare const PermissionSchema: z.ZodObject<{
    /** Unique permission identifier */
    id: z.ZodString;
    /** Human-readable permission name */
    name: z.ZodString;
    /** Permission description */
    description: z.ZodString;
    /** Resource type this permission applies to */
    resource: z.ZodString;
    /** Action this permission allows */
    action: z.ZodString;
    /** Additional constraints or conditions */
    constraints: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    /** Permission category for organization */
    category: z.ZodEnum<["system", "repository", "workspace", "user", "security"]>;
    /** Permission level (higher numbers indicate more privileged access) */
    level: z.ZodNumber;
    /** Whether this is a core system permission */
    isCore: z.ZodDefault<z.ZodBoolean>;
    /** Permission metadata */
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    description: string;
    level: number;
    action: string;
    resource: string;
    category: "user" | "repository" | "security" | "system" | "workspace";
    isCore: boolean;
    metadata?: Record<string, any> | undefined;
    constraints?: Record<string, any> | undefined;
}, {
    id: string;
    name: string;
    description: string;
    level: number;
    action: string;
    resource: string;
    category: "user" | "repository" | "security" | "system" | "workspace";
    metadata?: Record<string, any> | undefined;
    constraints?: Record<string, any> | undefined;
    isCore?: boolean | undefined;
}>;
export type Permission = z.infer<typeof PermissionSchema>;
/**
 * Role Schema
 */
export declare const RoleSchema: z.ZodObject<{
    /** Unique role identifier */
    id: z.ZodString;
    /** Human-readable role name */
    name: z.ZodString;
    /** Role description */
    description: z.ZodString;
    /** Parent role IDs for inheritance */
    parentRoles: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    /** Direct permissions assigned to this role */
    permissions: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    /** Role priority (higher numbers take precedence) */
    priority: z.ZodDefault<z.ZodNumber>;
    /** Whether this role is active */
    isActive: z.ZodDefault<z.ZodBoolean>;
    /** Whether this is a system-defined role */
    isSystem: z.ZodDefault<z.ZodBoolean>;
    /** Maximum number of users that can have this role */
    maxAssignments: z.ZodOptional<z.ZodNumber>;
    /** Role expiration date */
    expiresAt: z.ZodOptional<z.ZodDate>;
    /** Role metadata */
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    /** Creation timestamp */
    createdAt: z.ZodDefault<z.ZodDate>;
    /** Last modification timestamp */
    updatedAt: z.ZodDefault<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    description: string;
    createdAt: Date;
    isActive: boolean;
    permissions: string[];
    updatedAt: Date;
    priority: number;
    parentRoles: string[];
    isSystem: boolean;
    metadata?: Record<string, any> | undefined;
    expiresAt?: Date | undefined;
    maxAssignments?: number | undefined;
}, {
    id: string;
    name: string;
    description: string;
    metadata?: Record<string, any> | undefined;
    createdAt?: Date | undefined;
    isActive?: boolean | undefined;
    permissions?: string[] | undefined;
    expiresAt?: Date | undefined;
    updatedAt?: Date | undefined;
    priority?: number | undefined;
    parentRoles?: string[] | undefined;
    isSystem?: boolean | undefined;
    maxAssignments?: number | undefined;
}>;
export type Role = z.infer<typeof RoleSchema>;
/**
 * User Role Assignment Schema
 */
export declare const UserRoleAssignmentSchema: z.ZodObject<{
    /** Assignment identifier */
    id: z.ZodString;
    /** User ID */
    userId: z.ZodString;
    /** Role ID */
    roleId: z.ZodString;
    /** Who assigned this role */
    assignedBy: z.ZodString;
    /** Assignment timestamp */
    assignedAt: z.ZodDefault<z.ZodDate>;
    /** Assignment expiration */
    expiresAt: z.ZodOptional<z.ZodDate>;
    /** Whether assignment is active */
    isActive: z.ZodDefault<z.ZodBoolean>;
    /** Assignment scope/context */
    scope: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    /** Assignment metadata */
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    userId: string;
    isActive: boolean;
    roleId: string;
    assignedBy: string;
    assignedAt: Date;
    metadata?: Record<string, any> | undefined;
    expiresAt?: Date | undefined;
    scope?: Record<string, any> | undefined;
}, {
    id: string;
    userId: string;
    roleId: string;
    assignedBy: string;
    metadata?: Record<string, any> | undefined;
    isActive?: boolean | undefined;
    expiresAt?: Date | undefined;
    scope?: Record<string, any> | undefined;
    assignedAt?: Date | undefined;
}>;
export type UserRoleAssignment = z.infer<typeof UserRoleAssignmentSchema>;
/**
 * RBAC Configuration
 */
export interface RBACConfig {
    /** Maximum role inheritance depth */
    maxInheritanceDepth: number;
    /** Enable permission caching */
    enablePermissionCaching: boolean;
    /** Cache TTL in milliseconds */
    cacheTimeToLive: number;
    /** Enable audit logging */
    enableAuditLogging: boolean;
    /** Default role for new users */
    defaultUserRole?: string;
    /** System administrator role */
    systemAdminRole: string;
}
/**
 * RBAC Role Manager Class
 */
export declare class RBACRoleManager extends EventEmitter {
    private readonly config;
    private readonly auditLogger;
    private roles;
    private permissions;
    private userRoleAssignments;
    private permissionCache;
    constructor(config?: Partial<RBACConfig>);
    /**
     * Permission Management
     */
    createPermission(permission: Omit<Permission, 'id'>): Promise<Permission>;
    updatePermission(permissionId: string, updates: Partial<Permission>): Promise<Permission>;
    deletePermission(permissionId: string): Promise<void>;
    getPermission(permissionId: string): Permission | undefined;
    listPermissions(filters?: {
        category?: Permission['category'];
        resource?: string;
        action?: string;
        level?: {
            min?: number;
            max?: number;
        };
    }): Permission[];
    /**
     * Role Management
     */
    createRole(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<Role>;
    updateRole(roleId: string, updates: Partial<Role>): Promise<Role>;
    deleteRole(roleId: string): Promise<void>;
    getRole(roleId: string): Role | undefined;
    listRoles(filters?: {
        isActive?: boolean;
        isSystem?: boolean;
        priority?: {
            min?: number;
            max?: number;
        };
    }): Role[];
    /**
     * User Role Assignment Management
     */
    assignRoleToUser(userId: string, roleId: string, assignedBy: string, options?: {
        expiresAt?: Date;
        scope?: Record<string, any>;
        metadata?: Record<string, any>;
    }): Promise<UserRoleAssignment>;
    revokeRoleFromUser(userId: string, roleId: string, revokedBy: string): Promise<void>;
    getUserRoles(userId: string, includeInactive?: boolean): UserRoleAssignment[];
    getUsersWithRole(roleId: string): string[];
    /**
     * Permission Resolution
     */
    getUserPermissions(userId: string): Promise<string[]>;
    getRolePermissions(roleId: string): Promise<string[]>;
    hasPermission(userId: string, permissionId: string): Promise<boolean>;
    hasAnyPermission(userId: string, permissionIds: string[]): Promise<boolean>;
    hasAllPermissions(userId: string, permissionIds: string[]): Promise<boolean>;
    /**
     * Utility Methods
     */
    private addInheritedPermissions;
    private validateRoleHierarchy;
    private clearPermissionCache;
    private clearUserPermissionCache;
    private generatePermissionId;
    private generateRoleId;
    private generateAssignmentId;
    /**
     * Initialize default roles and permissions
     */
    private initializeDefaultRolesAndPermissions;
    /**
     * Get RBAC statistics
     */
    getRBACStats(): {
        roles: {
            total: number;
            active: number;
            system: number;
        };
        permissions: {
            total: number;
            core: number;
            byCategory: Record<string, number>;
        };
        assignments: {
            total: number;
            active: number;
            byRole: Record<string, number>;
        };
    };
}
export default RBACRoleManager;
//# sourceMappingURL=rbac-role-manager.d.ts.map