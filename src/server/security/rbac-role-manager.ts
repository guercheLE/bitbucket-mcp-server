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
import SecurityAuditLogger, { EventCategory, EventSeverity, SecurityEventType } from './audit-logger.js';

/**
 * Permission Schema
 */
export const PermissionSchema = z.object({
    /** Unique permission identifier */
    id: z.string().min(1),

    /** Human-readable permission name */
    name: z.string().min(1),

    /** Permission description */
    description: z.string(),

    /** Resource type this permission applies to */
    resource: z.string(),

    /** Action this permission allows */
    action: z.string(),

    /** Additional constraints or conditions */
    constraints: z.record(z.any()).optional(),

    /** Permission category for organization */
    category: z.enum(['system', 'repository', 'workspace', 'user', 'security']),

    /** Permission level (higher numbers indicate more privileged access) */
    level: z.number().int().min(0).max(100),

    /** Whether this is a core system permission */
    isCore: z.boolean().default(false),

    /** Permission metadata */
    metadata: z.record(z.any()).optional()
});

export type Permission = z.infer<typeof PermissionSchema>;

/**
 * Role Schema
 */
export const RoleSchema = z.object({
    /** Unique role identifier */
    id: z.string().min(1),

    /** Human-readable role name */
    name: z.string().min(1),

    /** Role description */
    description: z.string(),

    /** Parent role IDs for inheritance */
    parentRoles: z.array(z.string()).default([]),

    /** Direct permissions assigned to this role */
    permissions: z.array(z.string()).default([]),

    /** Role priority (higher numbers take precedence) */
    priority: z.number().int().min(0).default(0),

    /** Whether this role is active */
    isActive: z.boolean().default(true),

    /** Whether this is a system-defined role */
    isSystem: z.boolean().default(false),

    /** Maximum number of users that can have this role */
    maxAssignments: z.number().int().positive().optional(),

    /** Role expiration date */
    expiresAt: z.date().optional(),

    /** Role metadata */
    metadata: z.record(z.any()).optional(),

    /** Creation timestamp */
    createdAt: z.date().default(() => new Date()),

    /** Last modification timestamp */
    updatedAt: z.date().default(() => new Date())
});

export type Role = z.infer<typeof RoleSchema>;

/**
 * User Role Assignment Schema
 */
export const UserRoleAssignmentSchema = z.object({
    /** Assignment identifier */
    id: z.string(),

    /** User ID */
    userId: z.string(),

    /** Role ID */
    roleId: z.string(),

    /** Who assigned this role */
    assignedBy: z.string(),

    /** Assignment timestamp */
    assignedAt: z.date().default(() => new Date()),

    /** Assignment expiration */
    expiresAt: z.date().optional(),

    /** Whether assignment is active */
    isActive: z.boolean().default(true),

    /** Assignment scope/context */
    scope: z.record(z.any()).optional(),

    /** Assignment metadata */
    metadata: z.record(z.any()).optional()
});

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
 * Default RBAC Configuration
 */
const DEFAULT_RBAC_CONFIG: RBACConfig = {
    maxInheritanceDepth: 10,
    enablePermissionCaching: true,
    cacheTimeToLive: 5 * 60 * 1000, // 5 minutes
    enableAuditLogging: true,
    defaultUserRole: 'user',
    systemAdminRole: 'system_admin'
};

/**
 * RBAC Role Manager Class
 */
export class RBACRoleManager extends EventEmitter {
    private readonly config: RBACConfig;
    private readonly auditLogger: SecurityAuditLogger;

    // Storage maps (in production, these would be backed by a database)
    private roles: Map<string, Role> = new Map();
    private permissions: Map<string, Permission> = new Map();
    private userRoleAssignments: Map<string, UserRoleAssignment[]> = new Map();

    // Permission cache for performance
    private permissionCache: Map<string, { permissions: string[]; expiresAt: number }> = new Map();

    constructor(config: Partial<RBACConfig> = {}) {
        super();

        this.config = { ...DEFAULT_RBAC_CONFIG, ...config };

        this.auditLogger = new SecurityAuditLogger({
            maxMemoryEvents: 10000,
            batchSize: 100,
            flushInterval: 30000,
            enableCorrelation: true,
            defaultRetention: {
                standard: 30,
                security: 365 * 2,
                compliance: 365 * 7,
                legal: 365 * 7
            },
            enableDeduplication: true,
            deduplicationWindow: 60000
        });

        // Initialize with default roles and permissions
        this.initializeDefaultRolesAndPermissions();
    }

    /**
     * Permission Management
     */

    async createPermission(permission: Omit<Permission, 'id'>): Promise<Permission> {
        const permissionId = this.generatePermissionId(permission.resource, permission.action);

        const newPermission: Permission = {
            ...permission,
            id: permissionId
        };

        // Validate permission
        const validatedPermission = PermissionSchema.parse(newPermission);

        // Check if permission already exists
        if (this.permissions.has(validatedPermission.id)) {
            throw new Error(`Permission '${validatedPermission.id}' already exists`);
        }

        // Store permission
        this.permissions.set(validatedPermission.id, validatedPermission);

        // Log permission creation
        if (this.config.enableAuditLogging) {
            await this.auditLogger.logEvent({
                eventType: SecurityEventType.SYSTEM_CONFIG_CHANGED,
                category: EventCategory.AUTHORIZATION,
                severity: EventSeverity.LOW,
                userId: 'system',
                resourceType: 'permission',
                action: 'create',
                result: 'success',
                details: {
                    context: {
                        permission: {
                            id: validatedPermission.id,
                            name: validatedPermission.name,
                            resource: validatedPermission.resource,
                            action: validatedPermission.action,
                            category: validatedPermission.category,
                            level: validatedPermission.level
                        }
                    }
                }
            });
        }

        this.emit('permission:created', { permission: validatedPermission });

        return validatedPermission;
    }

    async updatePermission(permissionId: string, updates: Partial<Permission>): Promise<Permission> {
        const existingPermission = this.permissions.get(permissionId);
        if (!existingPermission) {
            throw new Error(`Permission '${permissionId}' not found`);
        }

        if (existingPermission.isCore && (updates.resource || updates.action)) {
            throw new Error('Cannot modify core permission resource or action');
        }

        const updatedPermission: Permission = {
            ...existingPermission,
            ...updates,
            id: permissionId // Ensure ID cannot be changed
        };

        // Validate updated permission
        const validatedPermission = PermissionSchema.parse(updatedPermission);

        // Store updated permission
        this.permissions.set(permissionId, validatedPermission);

        // Clear permission cache
        this.clearPermissionCache();

        // Log permission update
        if (this.config.enableAuditLogging) {
            await this.auditLogger.logEvent({
                eventType: SecurityEventType.SYSTEM_CONFIG_CHANGED,
                category: EventCategory.AUTHORIZATION,
                severity: EventSeverity.LOW,
                userId: 'system',
                resourceType: 'permission',
                action: 'update',
                result: 'success',
                details: {
                    context: {
                        permission: {
                            id: permissionId,
                            changes: updates
                        }
                    }
                }
            });
        }

        this.emit('permission:updated', {
            permission: validatedPermission,
            changes: updates
        });

        return validatedPermission;
    }

    async deletePermission(permissionId: string): Promise<void> {
        const permission = this.permissions.get(permissionId);
        if (!permission) {
            throw new Error(`Permission '${permissionId}' not found`);
        }

        if (permission.isCore) {
            throw new Error('Cannot delete core system permission');
        }

        // Remove permission from all roles
        for (const role of Array.from(this.roles.values())) {
            if (role.permissions.includes(permissionId)) {
                const updatedPermissions = role.permissions.filter(p => p !== permissionId);
                await this.updateRole(role.id, { permissions: updatedPermissions });
            }
        }

        // Delete permission
        this.permissions.delete(permissionId);

        // Clear permission cache
        this.clearPermissionCache();

        // Log permission deletion
        if (this.config.enableAuditLogging) {
            await this.auditLogger.logEvent({
                eventType: SecurityEventType.SYSTEM_CONFIG_CHANGED,
                category: EventCategory.AUTHORIZATION,
                severity: EventSeverity.MEDIUM,
                userId: 'system',
                resourceType: 'permission',
                action: 'delete',
                result: 'success',
                details: {
                    context: {
                        permission: {
                            id: permissionId,
                            name: permission.name
                        }
                    }
                }
            });
        }

        this.emit('permission:deleted', { permissionId, permission });
    }

    getPermission(permissionId: string): Permission | undefined {
        return this.permissions.get(permissionId);
    }

    listPermissions(filters?: {
        category?: Permission['category'];
        resource?: string;
        action?: string;
        level?: { min?: number; max?: number };
    }): Permission[] {
        let permissions = Array.from(this.permissions.values());

        if (filters) {
            if (filters.category) {
                permissions = permissions.filter(p => p.category === filters.category);
            }
            if (filters.resource) {
                permissions = permissions.filter(p => p.resource === filters.resource);
            }
            if (filters.action) {
                permissions = permissions.filter(p => p.action === filters.action);
            }
            if (filters.level) {
                if (filters.level.min !== undefined) {
                    permissions = permissions.filter(p => p.level >= filters.level!.min!);
                }
                if (filters.level.max !== undefined) {
                    permissions = permissions.filter(p => p.level <= filters.level!.max!);
                }
            }
        }

        return permissions.sort((a, b) => a.level - b.level);
    }

    /**
     * Role Management
     */

    async createRole(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<Role> {
        const roleId = this.generateRoleId(role.name);

        const newRole: Role = {
            ...role,
            id: roleId,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Validate role
        const validatedRole = RoleSchema.parse(newRole);

        // Check if role already exists
        if (this.roles.has(validatedRole.id)) {
            throw new Error(`Role '${validatedRole.id}' already exists`);
        }

        // Validate parent roles exist and don't create circular dependencies
        await this.validateRoleHierarchy(validatedRole.id, validatedRole.parentRoles);

        // Validate permissions exist
        for (const permissionId of validatedRole.permissions) {
            if (!this.permissions.has(permissionId)) {
                throw new Error(`Permission '${permissionId}' does not exist`);
            }
        }

        // Store role
        this.roles.set(validatedRole.id, validatedRole);

        // Clear permission cache
        this.clearPermissionCache();

        // Log role creation
        if (this.config.enableAuditLogging) {
            await this.auditLogger.logEvent({
                eventType: SecurityEventType.SYSTEM_CONFIG_CHANGED,
                category: EventCategory.AUTHORIZATION,
                severity: EventSeverity.LOW,
                userId: 'system',
                resourceType: 'role',
                action: 'create',
                result: 'success',
                details: {
                    context: {
                        role: {
                            id: validatedRole.id,
                            name: validatedRole.name,
                            parentRoles: validatedRole.parentRoles,
                            permissions: validatedRole.permissions,
                            priority: validatedRole.priority
                        }
                    }
                }
            });
        }

        this.emit('role:created', { role: validatedRole });

        return validatedRole;
    }

    async updateRole(roleId: string, updates: Partial<Role>): Promise<Role> {
        const existingRole = this.roles.get(roleId);
        if (!existingRole) {
            throw new Error(`Role '${roleId}' not found`);
        }

        if (existingRole.isSystem && (updates.name || updates.isSystem === false)) {
            throw new Error('Cannot modify system role name or system status');
        }

        const updatedRole: Role = {
            ...existingRole,
            ...updates,
            id: roleId, // Ensure ID cannot be changed
            updatedAt: new Date()
        };

        // Validate role
        const validatedRole = RoleSchema.parse(updatedRole);

        // Validate parent roles if they were updated
        if (updates.parentRoles) {
            await this.validateRoleHierarchy(roleId, updates.parentRoles);
        }

        // Validate permissions if they were updated
        if (updates.permissions) {
            for (const permissionId of updates.permissions) {
                if (!this.permissions.has(permissionId)) {
                    throw new Error(`Permission '${permissionId}' does not exist`);
                }
            }
        }

        // Store updated role
        this.roles.set(roleId, validatedRole);

        // Clear permission cache
        this.clearPermissionCache();

        // Log role update
        if (this.config.enableAuditLogging) {
            await this.auditLogger.logEvent({
                eventType: SecurityEventType.SYSTEM_CONFIG_CHANGED,
                category: EventCategory.AUTHORIZATION,
                severity: EventSeverity.LOW,
                userId: 'system',
                resourceType: 'role',
                action: 'update',
                result: 'success',
                details: {
                    context: {
                        role: {
                            id: roleId,
                            changes: updates
                        }
                    }
                }
            });
        }

        this.emit('role:updated', {
            role: validatedRole,
            changes: updates
        });

        return validatedRole;
    }

    async deleteRole(roleId: string): Promise<void> {
        const role = this.roles.get(roleId);
        if (!role) {
            throw new Error(`Role '${roleId}' not found`);
        }

        if (role.isSystem) {
            throw new Error('Cannot delete system role');
        }

        // Check if role is assigned to any users
        const assignedUsers = this.getUsersWithRole(roleId);
        if (assignedUsers.length > 0) {
            throw new Error(`Cannot delete role '${roleId}' - still assigned to ${assignedUsers.length} users`);
        }

        // Remove role as parent from other roles
        for (const otherRole of Array.from(this.roles.values())) {
            if (otherRole.parentRoles.includes(roleId)) {
                const updatedParentRoles = otherRole.parentRoles.filter(p => p !== roleId);
                await this.updateRole(otherRole.id, { parentRoles: updatedParentRoles });
            }
        }

        // Delete role
        this.roles.delete(roleId);

        // Clear permission cache
        this.clearPermissionCache();

        // Log role deletion
        if (this.config.enableAuditLogging) {
            await this.auditLogger.logEvent({
                eventType: SecurityEventType.SYSTEM_CONFIG_CHANGED,
                category: EventCategory.AUTHORIZATION,
                severity: EventSeverity.MEDIUM,
                userId: 'system',
                resourceType: 'role',
                action: 'delete',
                result: 'success',
                details: {
                    context: {
                        role: {
                            id: roleId,
                            name: role.name
                        }
                    }
                }
            });
        }

        this.emit('role:deleted', { roleId, role });
    }

    getRole(roleId: string): Role | undefined {
        return this.roles.get(roleId);
    }

    listRoles(filters?: {
        isActive?: boolean;
        isSystem?: boolean;
        priority?: { min?: number; max?: number };
    }): Role[] {
        let roles = Array.from(this.roles.values());

        if (filters) {
            if (filters.isActive !== undefined) {
                roles = roles.filter(r => r.isActive === filters.isActive);
            }
            if (filters.isSystem !== undefined) {
                roles = roles.filter(r => r.isSystem === filters.isSystem);
            }
            if (filters.priority) {
                if (filters.priority.min !== undefined) {
                    roles = roles.filter(r => r.priority >= filters.priority!.min!);
                }
                if (filters.priority.max !== undefined) {
                    roles = roles.filter(r => r.priority <= filters.priority!.max!);
                }
            }
        }

        return roles.sort((a, b) => b.priority - a.priority);
    }

    /**
     * User Role Assignment Management
     */

    async assignRoleToUser(
        userId: string,
        roleId: string,
        assignedBy: string,
        options?: {
            expiresAt?: Date;
            scope?: Record<string, any>;
            metadata?: Record<string, any>;
        }
    ): Promise<UserRoleAssignment> {
        const role = this.roles.get(roleId);
        if (!role) {
            throw new Error(`Role '${roleId}' not found`);
        }

        if (!role.isActive) {
            throw new Error(`Role '${roleId}' is not active`);
        }

        // Check if role has maximum assignment limit
        if (role.maxAssignments) {
            const currentAssignments = this.getUsersWithRole(roleId);
            if (currentAssignments.length >= role.maxAssignments) {
                throw new Error(`Role '${roleId}' has reached maximum assignments (${role.maxAssignments})`);
            }
        }

        // Check if role has expired
        if (role.expiresAt && role.expiresAt < new Date()) {
            throw new Error(`Role '${roleId}' has expired`);
        }

        // Check if user already has this role
        const existingAssignments = this.userRoleAssignments.get(userId) || [];
        const existingAssignment = existingAssignments.find(a => a.roleId === roleId && a.isActive);
        if (existingAssignment) {
            throw new Error(`User '${userId}' already has role '${roleId}'`);
        }

        const assignment: UserRoleAssignment = {
            id: this.generateAssignmentId(),
            userId,
            roleId,
            assignedBy,
            assignedAt: new Date(),
            expiresAt: options?.expiresAt,
            isActive: true,
            scope: options?.scope,
            metadata: options?.metadata
        };

        // Store assignment
        if (!this.userRoleAssignments.has(userId)) {
            this.userRoleAssignments.set(userId, []);
        }
        this.userRoleAssignments.get(userId)!.push(assignment);

        // Clear permission cache for user
        this.clearUserPermissionCache(userId);

        // Log role assignment
        if (this.config.enableAuditLogging) {
            await this.auditLogger.logEvent({
                eventType: SecurityEventType.ACCESS_GRANTED,
                category: EventCategory.AUTHORIZATION,
                severity: EventSeverity.LOW,
                userId: assignedBy,
                resourceType: 'role_assignment',
                action: 'assign',
                result: 'success',
                details: {
                    context: {
                        assignment: {
                            userId,
                            roleId,
                            assignmentId: assignment.id,
                            expiresAt: assignment.expiresAt,
                            scope: assignment.scope
                        }
                    }
                }
            });
        }

        this.emit('role:assigned', {
            assignment,
            user: userId,
            role: roleId
        });

        return assignment;
    }

    async revokeRoleFromUser(userId: string, roleId: string, revokedBy: string): Promise<void> {
        const assignments = this.userRoleAssignments.get(userId) || [];
        const assignment = assignments.find(a => a.roleId === roleId && a.isActive);

        if (!assignment) {
            throw new Error(`User '${userId}' does not have active role '${roleId}'`);
        }

        // Deactivate assignment
        assignment.isActive = false;
        assignment.metadata = {
            ...assignment.metadata,
            revokedBy,
            revokedAt: new Date()
        };

        // Clear permission cache for user
        this.clearUserPermissionCache(userId);

        // Log role revocation
        if (this.config.enableAuditLogging) {
            await this.auditLogger.logEvent({
                eventType: SecurityEventType.ACCESS_DENIED,
                category: EventCategory.AUTHORIZATION,
                severity: EventSeverity.MEDIUM,
                userId: revokedBy,
                resourceType: 'role_assignment',
                action: 'revoke',
                result: 'success',
                details: {
                    context: {
                        assignment: {
                            userId,
                            roleId,
                            assignmentId: assignment.id,
                            revokedBy
                        }
                    }
                }
            });
        }

        this.emit('role:revoked', {
            assignment,
            user: userId,
            role: roleId,
            revokedBy
        });
    }

    getUserRoles(userId: string, includeInactive = false): UserRoleAssignment[] {
        const assignments = this.userRoleAssignments.get(userId) || [];

        return assignments.filter(assignment => {
            if (!includeInactive && !assignment.isActive) {
                return false;
            }

            // Check expiration
            if (assignment.expiresAt && assignment.expiresAt < new Date()) {
                return false;
            }

            // Check role expiration
            const role = this.roles.get(assignment.roleId);
            if (role?.expiresAt && role.expiresAt < new Date()) {
                return false;
            }

            return true;
        });
    }

    getUsersWithRole(roleId: string): string[] {
        const users: string[] = [];

        for (const [userId, assignments] of Array.from(this.userRoleAssignments.entries())) {
            const hasRole = assignments.some(assignment =>
                assignment.roleId === roleId &&
                assignment.isActive &&
                (!assignment.expiresAt || assignment.expiresAt > new Date())
            );

            if (hasRole) {
                users.push(userId);
            }
        }

        return users;
    }

    /**
     * Permission Resolution
     */

    async getUserPermissions(userId: string): Promise<string[]> {
        // Check cache first
        if (this.config.enablePermissionCaching) {
            const cached = this.permissionCache.get(`user:${userId}`);
            if (cached && cached.expiresAt > Date.now()) {
                return cached.permissions;
            }
        }

        const userRoles = this.getUserRoles(userId);
        const allPermissions = new Set<string>();

        // Collect permissions from all roles (including inherited)
        for (const assignment of userRoles) {
            const rolePermissions = await this.getRolePermissions(assignment.roleId);
            for (const permission of rolePermissions) {
                allPermissions.add(permission);
            }
        }

        const permissions = Array.from(allPermissions);

        // Cache result
        if (this.config.enablePermissionCaching) {
            this.permissionCache.set(`user:${userId}`, {
                permissions,
                expiresAt: Date.now() + this.config.cacheTimeToLive
            });
        }

        return permissions;
    }

    async getRolePermissions(roleId: string): Promise<string[]> {
        // Check cache first
        if (this.config.enablePermissionCaching) {
            const cached = this.permissionCache.get(`role:${roleId}`);
            if (cached && cached.expiresAt > Date.now()) {
                return cached.permissions;
            }
        }

        const role = this.roles.get(roleId);
        if (!role) {
            return [];
        }

        const allPermissions = new Set<string>(role.permissions);

        // Add inherited permissions from parent roles
        await this.addInheritedPermissions(roleId, allPermissions, new Set(), 0);

        const permissions = Array.from(allPermissions);

        // Cache result
        if (this.config.enablePermissionCaching) {
            this.permissionCache.set(`role:${roleId}`, {
                permissions,
                expiresAt: Date.now() + this.config.cacheTimeToLive
            });
        }

        return permissions;
    }

    async hasPermission(userId: string, permissionId: string): Promise<boolean> {
        const userPermissions = await this.getUserPermissions(userId);
        return userPermissions.includes(permissionId);
    }

    async hasAnyPermission(userId: string, permissionIds: string[]): Promise<boolean> {
        const userPermissions = await this.getUserPermissions(userId);
        return permissionIds.some(permissionId => userPermissions.includes(permissionId));
    }

    async hasAllPermissions(userId: string, permissionIds: string[]): Promise<boolean> {
        const userPermissions = await this.getUserPermissions(userId);
        return permissionIds.every(permissionId => userPermissions.includes(permissionId));
    }

    /**
     * Utility Methods
     */

    private async addInheritedPermissions(
        roleId: string,
        permissions: Set<string>,
        visited: Set<string>,
        depth: number
    ): Promise<void> {
        // Prevent circular dependencies and excessive depth
        if (visited.has(roleId) || depth >= this.config.maxInheritanceDepth) {
            return;
        }

        visited.add(roleId);

        const role = this.roles.get(roleId);
        if (!role) {
            return;
        }

        // Add permissions from parent roles
        for (const parentRoleId of role.parentRoles) {
            const parentRole = this.roles.get(parentRoleId);
            if (parentRole) {
                // Add parent's direct permissions
                for (const permission of parentRole.permissions) {
                    permissions.add(permission);
                }

                // Recursively add inherited permissions
                await this.addInheritedPermissions(parentRoleId, permissions, visited, depth + 1);
            }
        }
    }

    private async validateRoleHierarchy(roleId: string, parentRoles: string[]): Promise<void> {
        // Check that parent roles exist
        for (const parentRoleId of parentRoles) {
            if (!this.roles.has(parentRoleId)) {
                throw new Error(`Parent role '${parentRoleId}' does not exist`);
            }
        }

        // Check for circular dependencies
        const visited = new Set<string>();
        const stack = new Set<string>();

        const checkCycles = (currentRoleId: string): boolean => {
            if (stack.has(currentRoleId)) {
                return true; // Circular dependency found
            }

            if (visited.has(currentRoleId)) {
                return false; // Already checked this path
            }

            visited.add(currentRoleId);
            stack.add(currentRoleId);

            const role = this.roles.get(currentRoleId);
            if (role) {
                for (const parentId of role.parentRoles) {
                    if (checkCycles(parentId)) {
                        return true;
                    }
                }
            }

            // If updating existing role, check new parent roles
            if (currentRoleId === roleId) {
                for (const parentId of parentRoles) {
                    if (checkCycles(parentId)) {
                        return true;
                    }
                }
            }

            stack.delete(currentRoleId);
            return false;
        };

        if (checkCycles(roleId)) {
            throw new Error('Role hierarchy would create circular dependency');
        }
    }

    private clearPermissionCache(): void {
        this.permissionCache.clear();
    }

    private clearUserPermissionCache(userId: string): void {
        this.permissionCache.delete(`user:${userId}`);
    }

    private generatePermissionId(resource: string, action: string): string {
        return `${resource}:${action}`.toLowerCase().replace(/[^a-z0-9:_-]/g, '_');
    }

    private generateRoleId(name: string): string {
        return name.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    }

    private generateAssignmentId(): string {
        return `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Initialize default roles and permissions
     */
    private async initializeDefaultRolesAndPermissions(): Promise<void> {
        // Default permissions
        const defaultPermissions: Omit<Permission, 'id'>[] = [
            // System permissions
            { name: 'System Administration', description: 'Full system access', resource: 'system', action: 'admin', category: 'system', level: 100, isCore: true },
            { name: 'System Read', description: 'Read system information', resource: 'system', action: 'read', category: 'system', level: 10, isCore: true },

            // Repository permissions
            { name: 'Repository Admin', description: 'Full repository administration', resource: 'repository', action: 'admin', category: 'repository', level: 90, isCore: true },
            { name: 'Repository Write', description: 'Write to repositories', resource: 'repository', action: 'write', category: 'repository', level: 70, isCore: true },
            { name: 'Repository Read', description: 'Read repositories', resource: 'repository', action: 'read', category: 'repository', level: 30, isCore: true },

            // Workspace permissions
            { name: 'Workspace Admin', description: 'Full workspace administration', resource: 'workspace', action: 'admin', category: 'workspace', level: 90, isCore: true },
            { name: 'Workspace Manage', description: 'Manage workspace settings', resource: 'workspace', action: 'manage', category: 'workspace', level: 70, isCore: true },
            { name: 'Workspace Read', description: 'Read workspace information', resource: 'workspace', action: 'read', category: 'workspace', level: 20, isCore: true },

            // Security permissions
            { name: 'Security Admin', description: 'Full security administration', resource: 'security', action: 'admin', category: 'security', level: 95, isCore: true },
            { name: 'Security Audit', description: 'View security audit logs', resource: 'security', action: 'audit', category: 'security', level: 60, isCore: true },
            { name: 'MFA Manage', description: 'Manage MFA settings', resource: 'security', action: 'mfa', category: 'security', level: 80, isCore: true },

            // User permissions
            { name: 'User Admin', description: 'User administration', resource: 'user', action: 'admin', category: 'user', level: 80, isCore: true },
            { name: 'User Manage', description: 'Manage user profiles', resource: 'user', action: 'manage', category: 'user', level: 60, isCore: true },
            { name: 'User Read', description: 'Read user information', resource: 'user', action: 'read', category: 'user', level: 20, isCore: true }
        ];

        // Create default permissions
        for (const permission of defaultPermissions) {
            try {
                await this.createPermission(permission);
            } catch (error) {
                // Permission might already exist, continue
                console.debug(`Permission creation skipped: ${error}`);
            }
        }

        // Default roles
        const defaultRoles: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>[] = [
            {
                name: 'System Administrator',
                description: 'Full system access with all permissions',
                parentRoles: [],
                permissions: ['system:admin'],
                priority: 100,
                isActive: true,
                isSystem: true
            },
            {
                name: 'Repository Admin',
                description: 'Repository administration with full repo access',
                parentRoles: [],
                permissions: ['repository:admin', 'repository:write', 'repository:read'],
                priority: 90,
                isActive: true,
                isSystem: true
            },
            {
                name: 'Developer',
                description: 'Standard developer role with repo write access',
                parentRoles: [],
                permissions: ['repository:write', 'repository:read', 'workspace:read'],
                priority: 70,
                isActive: true,
                isSystem: true
            },
            {
                name: 'Viewer',
                description: 'Read-only access to repositories and workspaces',
                parentRoles: [],
                permissions: ['repository:read', 'workspace:read'],
                priority: 30,
                isActive: true,
                isSystem: true
            },
            {
                name: 'User',
                description: 'Basic user with minimal permissions',
                parentRoles: [],
                permissions: ['user:read'],
                priority: 10,
                isActive: true,
                isSystem: true
            }
        ];

        // Create default roles
        for (const role of defaultRoles) {
            try {
                await this.createRole(role);
            } catch (error) {
                // Role might already exist, continue
                console.debug(`Role creation skipped: ${error}`);
            }
        }
    }

    /**
     * Get RBAC statistics
     */
    getRBACStats(): {
        roles: { total: number; active: number; system: number };
        permissions: { total: number; core: number; byCategory: Record<string, number> };
        assignments: { total: number; active: number; byRole: Record<string, number> };
    } {
        const roles = Array.from(this.roles.values());
        const permissions = Array.from(this.permissions.values());

        const roleStats = {
            total: roles.length,
            active: roles.filter(r => r.isActive).length,
            system: roles.filter(r => r.isSystem).length
        };

        const permissionStats = {
            total: permissions.length,
            core: permissions.filter(p => p.isCore).length,
            byCategory: permissions.reduce((acc, p) => {
                acc[p.category] = (acc[p.category] || 0) + 1;
                return acc;
            }, {} as Record<string, number>)
        };

        const allAssignments = Array.from(this.userRoleAssignments.values()).flat();
        const byRole = allAssignments.reduce((acc, assignment) => {
            if (assignment.isActive) {
                acc[assignment.roleId] = (acc[assignment.roleId] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        const assignmentStats = {
            total: allAssignments.length,
            active: allAssignments.filter(a => a.isActive).length,
            byRole
        };

        return {
            roles: roleStats,
            permissions: permissionStats,
            assignments: assignmentStats
        };
    }
}

export default RBACRoleManager;