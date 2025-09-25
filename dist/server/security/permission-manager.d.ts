/**
 * Permission Manager
 *
 * Advanced permission management system for granular resource-based access control.
 * Provides dynamic permission evaluation, resource-based permissions, and policy enforcement.
 *
 * Features:
 * - Resource-based permission definitions
 * - Dynamic permission evaluation with context
 * - Permission inheritance and composition
 * - Conditional permissions with attribute-based access control
 * - Real-time permission validation
 * - Comprehensive audit logging for permission decisions
 */
import { EventEmitter } from 'events';
import { z } from 'zod';
/**
 * Resource Definition Schema
 */
export declare const ResourceSchema: z.ZodObject<{
    /** Unique resource identifier */
    id: z.ZodString;
    /** Resource type */
    type: z.ZodString;
    /** Human-readable resource name */
    name: z.ZodString;
    /** Resource description */
    description: z.ZodOptional<z.ZodString>;
    /** Parent resource ID for hierarchy */
    parentId: z.ZodOptional<z.ZodString>;
    /** Resource attributes for policy evaluation */
    attributes: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    /** Resource metadata */
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    /** Whether this resource is active */
    isActive: z.ZodDefault<z.ZodBoolean>;
    /** Resource owner ID */
    ownerId: z.ZodOptional<z.ZodString>;
    /** Creation timestamp */
    createdAt: z.ZodDefault<z.ZodDate>;
    /** Last modification timestamp */
    updatedAt: z.ZodDefault<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    id: string;
    metadata: Record<string, any>;
    name: string;
    createdAt: Date;
    isActive: boolean;
    type: string;
    attributes: Record<string, any>;
    updatedAt: Date;
    description?: string | undefined;
    parentId?: string | undefined;
    ownerId?: string | undefined;
}, {
    id: string;
    name: string;
    type: string;
    metadata?: Record<string, any> | undefined;
    description?: string | undefined;
    createdAt?: Date | undefined;
    isActive?: boolean | undefined;
    parentId?: string | undefined;
    attributes?: Record<string, any> | undefined;
    ownerId?: string | undefined;
    updatedAt?: Date | undefined;
}>;
export type Resource = z.infer<typeof ResourceSchema>;
/**
 * Action Schema
 */
export declare const ActionSchema: z.ZodObject<{
    /** Unique action identifier */
    id: z.ZodString;
    /** Action name */
    name: z.ZodString;
    /** Action description */
    description: z.ZodOptional<z.ZodString>;
    /** Resource types this action applies to */
    resourceTypes: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    /** Action category */
    category: z.ZodEnum<["read", "write", "admin", "delete", "execute", "manage"]>;
    /** Action risk level (0-100, higher = more sensitive) */
    riskLevel: z.ZodDefault<z.ZodNumber>;
    /** Whether this action requires additional confirmation */
    requiresConfirmation: z.ZodDefault<z.ZodBoolean>;
    /** Minimum role level required for this action */
    minimumRoleLevel: z.ZodDefault<z.ZodNumber>;
    /** Action metadata */
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    metadata: Record<string, any>;
    name: string;
    category: "read" | "write" | "admin" | "execute" | "delete" | "manage";
    resourceTypes: string[];
    riskLevel: number;
    requiresConfirmation: boolean;
    minimumRoleLevel: number;
    description?: string | undefined;
}, {
    id: string;
    name: string;
    category: "read" | "write" | "admin" | "execute" | "delete" | "manage";
    metadata?: Record<string, any> | undefined;
    description?: string | undefined;
    resourceTypes?: string[] | undefined;
    riskLevel?: number | undefined;
    requiresConfirmation?: boolean | undefined;
    minimumRoleLevel?: number | undefined;
}>;
export type Action = z.infer<typeof ActionSchema>;
/**
 * Permission Context Schema
 */
export declare const PermissionContextSchema: z.ZodObject<{
    /** User making the request */
    userId: z.ZodString;
    /** User's current roles */
    userRoles: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    /** User attributes for evaluation */
    userAttributes: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    /** Resource being accessed */
    resourceId: z.ZodOptional<z.ZodString>;
    /** Resource attributes */
    resourceAttributes: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    /** Action being performed */
    actionId: z.ZodString;
    /** Request context */
    requestContext: z.ZodDefault<z.ZodObject<{
        /** Request timestamp */
        timestamp: z.ZodDefault<z.ZodDate>;
        /** Client IP address */
        ipAddress: z.ZodOptional<z.ZodString>;
        /** User agent */
        userAgent: z.ZodOptional<z.ZodString>;
        /** Session ID */
        sessionId: z.ZodOptional<z.ZodString>;
        /** Workspace context */
        workspaceId: z.ZodOptional<z.ZodString>;
        /** Additional request metadata */
        metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        timestamp: Date;
        metadata: Record<string, any>;
        sessionId?: string | undefined;
        ipAddress?: string | undefined;
        userAgent?: string | undefined;
        workspaceId?: string | undefined;
    }, {
        timestamp?: Date | undefined;
        metadata?: Record<string, any> | undefined;
        sessionId?: string | undefined;
        ipAddress?: string | undefined;
        userAgent?: string | undefined;
        workspaceId?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    userRoles: string[];
    userAttributes: Record<string, any>;
    resourceAttributes: Record<string, any>;
    actionId: string;
    requestContext: {
        timestamp: Date;
        metadata: Record<string, any>;
        sessionId?: string | undefined;
        ipAddress?: string | undefined;
        userAgent?: string | undefined;
        workspaceId?: string | undefined;
    };
    resourceId?: string | undefined;
}, {
    userId: string;
    actionId: string;
    resourceId?: string | undefined;
    userRoles?: string[] | undefined;
    userAttributes?: Record<string, any> | undefined;
    resourceAttributes?: Record<string, any> | undefined;
    requestContext?: {
        timestamp?: Date | undefined;
        metadata?: Record<string, any> | undefined;
        sessionId?: string | undefined;
        ipAddress?: string | undefined;
        userAgent?: string | undefined;
        workspaceId?: string | undefined;
    } | undefined;
}>;
export type PermissionContext = z.infer<typeof PermissionContextSchema>;
/**
 * Permission Rule Schema
 */
export declare const PermissionRuleSchema: z.ZodObject<{
    /** Unique rule identifier */
    id: z.ZodString;
    /** Rule name */
    name: z.ZodString;
    /** Rule description */
    description: z.ZodOptional<z.ZodString>;
    /** Resource types this rule applies to */
    resourceTypes: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    /** Actions this rule applies to */
    actions: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    /** Roles this rule applies to */
    roles: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    /** Rule effect */
    effect: z.ZodEnum<["allow", "deny"]>;
    /** Rule priority (higher numbers take precedence) */
    priority: z.ZodDefault<z.ZodNumber>;
    /** Conditions for rule evaluation */
    conditions: z.ZodDefault<z.ZodArray<z.ZodObject<{
        /** Attribute path to evaluate */
        attribute: z.ZodString;
        /** Comparison operator */
        operator: z.ZodEnum<["eq", "ne", "gt", "gte", "lt", "lte", "in", "nin", "contains", "regex"]>;
        /** Value to compare against */
        value: z.ZodAny;
        /** Whether this condition is required */
        required: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        required: boolean;
        attribute: string;
        operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains" | "regex";
        value?: any;
    }, {
        attribute: string;
        operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains" | "regex";
        value?: any;
        required?: boolean | undefined;
    }>, "many">>;
    /** Time-based constraints */
    timeConstraints: z.ZodOptional<z.ZodObject<{
        /** Valid from timestamp */
        validFrom: z.ZodOptional<z.ZodDate>;
        /** Valid until timestamp */
        validUntil: z.ZodOptional<z.ZodDate>;
        /** Allowed hours (0-23) */
        allowedHours: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        /** Allowed days of week (0-6, 0=Sunday) */
        allowedDaysOfWeek: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        /** Timezone for time evaluation */
        timezone: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        validFrom?: Date | undefined;
        validUntil?: Date | undefined;
        allowedHours?: number[] | undefined;
        allowedDaysOfWeek?: number[] | undefined;
        timezone?: string | undefined;
    }, {
        validFrom?: Date | undefined;
        validUntil?: Date | undefined;
        allowedHours?: number[] | undefined;
        allowedDaysOfWeek?: number[] | undefined;
        timezone?: string | undefined;
    }>>;
    /** Whether this rule is active */
    isActive: z.ZodDefault<z.ZodBoolean>;
    /** Rule metadata */
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    metadata: Record<string, any>;
    name: string;
    isActive: boolean;
    resourceTypes: string[];
    actions: string[];
    roles: string[];
    effect: "allow" | "deny";
    priority: number;
    conditions: {
        required: boolean;
        attribute: string;
        operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains" | "regex";
        value?: any;
    }[];
    description?: string | undefined;
    timeConstraints?: {
        validFrom?: Date | undefined;
        validUntil?: Date | undefined;
        allowedHours?: number[] | undefined;
        allowedDaysOfWeek?: number[] | undefined;
        timezone?: string | undefined;
    } | undefined;
}, {
    id: string;
    name: string;
    effect: "allow" | "deny";
    metadata?: Record<string, any> | undefined;
    description?: string | undefined;
    isActive?: boolean | undefined;
    resourceTypes?: string[] | undefined;
    actions?: string[] | undefined;
    roles?: string[] | undefined;
    priority?: number | undefined;
    conditions?: {
        attribute: string;
        operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains" | "regex";
        value?: any;
        required?: boolean | undefined;
    }[] | undefined;
    timeConstraints?: {
        validFrom?: Date | undefined;
        validUntil?: Date | undefined;
        allowedHours?: number[] | undefined;
        allowedDaysOfWeek?: number[] | undefined;
        timezone?: string | undefined;
    } | undefined;
}>;
export type PermissionRule = z.infer<typeof PermissionRuleSchema>;
/**
 * Permission Decision Schema
 */
export declare const PermissionDecisionSchema: z.ZodObject<{
    /** Whether permission is granted */
    allowed: z.ZodBoolean;
    /** Decision reason */
    reason: z.ZodString;
    /** Applied rules */
    appliedRules: z.ZodArray<z.ZodObject<{
        ruleId: z.ZodString;
        effect: z.ZodEnum<["allow", "deny"]>;
        priority: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        ruleId: string;
        effect: "allow" | "deny";
        priority: number;
    }, {
        ruleId: string;
        effect: "allow" | "deny";
        priority: number;
    }>, "many">;
    /** Decision timestamp */
    timestamp: z.ZodDefault<z.ZodDate>;
    /** Decision metadata */
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    timestamp: Date;
    metadata: Record<string, any>;
    reason: string;
    allowed: boolean;
    appliedRules: {
        ruleId: string;
        effect: "allow" | "deny";
        priority: number;
    }[];
}, {
    reason: string;
    allowed: boolean;
    appliedRules: {
        ruleId: string;
        effect: "allow" | "deny";
        priority: number;
    }[];
    timestamp?: Date | undefined;
    metadata?: Record<string, any> | undefined;
}>;
export type PermissionDecision = z.infer<typeof PermissionDecisionSchema>;
/**
 * Permission Manager Configuration
 */
export interface PermissionManagerConfig {
    /** Enable permission caching */
    enableCaching: boolean;
    /** Cache TTL in milliseconds */
    cacheTimeToLive: number;
    /** Enable comprehensive audit logging */
    enableAuditLogging: boolean;
    /** Log all permission decisions */
    logAllDecisions: boolean;
    /** Log only denied permissions */
    logDeniedOnly: boolean;
    /** Default permission decision when no rules match */
    defaultDecision: 'allow' | 'deny';
    /** Maximum rule evaluation depth for inheritance */
    maxEvaluationDepth: number;
    /** Enable real-time permission notifications */
    enableRealTimeNotifications: boolean;
}
/**
 * Permission Manager Class
 */
export declare class PermissionManager extends EventEmitter {
    private readonly config;
    private readonly auditLogger;
    private resources;
    private actions;
    private permissionRules;
    private decisionCache;
    constructor(config?: Partial<PermissionManagerConfig>);
    /**
     * Resource Management
     */
    createResource(resource: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>): Promise<Resource>;
    updateResource(resourceId: string, updates: Partial<Resource>): Promise<Resource>;
    deleteResource(resourceId: string): Promise<void>;
    getResource(resourceId: string): Resource | undefined;
    listResources(filters?: {
        type?: string;
        parentId?: string;
        ownerId?: string;
        isActive?: boolean;
    }): Resource[];
    /**
     * Action Management
     */
    createAction(action: Omit<Action, 'id'>): Promise<Action>;
    getAction(actionId: string): Action | undefined;
    listActions(filters?: {
        category?: Action['category'];
        resourceType?: string;
        riskLevel?: {
            min?: number;
            max?: number;
        };
    }): Action[];
    /**
     * Permission Rule Management
     */
    createPermissionRule(rule: Omit<PermissionRule, 'id'>): Promise<PermissionRule>;
    updatePermissionRule(ruleId: string, updates: Partial<PermissionRule>): Promise<PermissionRule>;
    deletePermissionRule(ruleId: string): Promise<void>;
    getPermissionRule(ruleId: string): PermissionRule | undefined;
    listPermissionRules(filters?: {
        effect?: PermissionRule['effect'];
        resourceType?: string;
        action?: string;
        role?: string;
        isActive?: boolean;
    }): PermissionRule[];
    /**
     * Permission Evaluation
     */
    evaluatePermission(context: PermissionContext): Promise<PermissionDecision>;
    /**
     * Convenience methods for permission checking
     */
    hasPermission(userId: string, actionId: string, resourceId?: string, additionalContext?: Partial<PermissionContext>): Promise<boolean>;
    checkPermission(userId: string, actionId: string, resourceId?: string, additionalContext?: Partial<PermissionContext>): Promise<PermissionDecision>;
    /**
     * Private helper methods
     */
    private findApplicableRules;
    private evaluateRuleConditions;
    private evaluateTimeConstraints;
    private getAttributeValue;
    private evaluateCondition;
    private generateCacheKey;
    private clearDecisionCache;
    private generateResourceId;
    private generateActionId;
    private generateRuleId;
    /**
     * Initialize default resources and actions
     */
    private initializeDefaultResourcesAndActions;
    /**
     * Get permission manager statistics
     */
    getPermissionStats(): {
        resources: {
            total: number;
            byType: Record<string, number>;
            active: number;
        };
        actions: {
            total: number;
            byCategory: Record<string, number>;
            byRiskLevel: Record<string, number>;
        };
        rules: {
            total: number;
            active: number;
            byEffect: Record<string, number>;
        };
        cache: {
            size: number;
            hitRate?: number;
        };
    };
}
export default PermissionManager;
//# sourceMappingURL=permission-manager.d.ts.map