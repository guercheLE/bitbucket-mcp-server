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
import SecurityAuditLogger, { EventCategory, EventSeverity, SecurityEventType } from './audit-logger.js';
/**
 * Resource Definition Schema
 */
export const ResourceSchema = z.object({
    /** Unique resource identifier */
    id: z.string().min(1),
    /** Resource type */
    type: z.string().min(1),
    /** Human-readable resource name */
    name: z.string().min(1),
    /** Resource description */
    description: z.string().optional(),
    /** Parent resource ID for hierarchy */
    parentId: z.string().optional(),
    /** Resource attributes for policy evaluation */
    attributes: z.record(z.any()).default({}),
    /** Resource metadata */
    metadata: z.record(z.any()).default({}),
    /** Whether this resource is active */
    isActive: z.boolean().default(true),
    /** Resource owner ID */
    ownerId: z.string().optional(),
    /** Creation timestamp */
    createdAt: z.date().default(() => new Date()),
    /** Last modification timestamp */
    updatedAt: z.date().default(() => new Date())
});
/**
 * Action Schema
 */
export const ActionSchema = z.object({
    /** Unique action identifier */
    id: z.string().min(1),
    /** Action name */
    name: z.string().min(1),
    /** Action description */
    description: z.string().optional(),
    /** Resource types this action applies to */
    resourceTypes: z.array(z.string()).default([]),
    /** Action category */
    category: z.enum(['read', 'write', 'admin', 'delete', 'execute', 'manage']),
    /** Action risk level (0-100, higher = more sensitive) */
    riskLevel: z.number().int().min(0).max(100).default(50),
    /** Whether this action requires additional confirmation */
    requiresConfirmation: z.boolean().default(false),
    /** Minimum role level required for this action */
    minimumRoleLevel: z.number().int().min(0).default(0),
    /** Action metadata */
    metadata: z.record(z.any()).default({})
});
/**
 * Permission Context Schema
 */
export const PermissionContextSchema = z.object({
    /** User making the request */
    userId: z.string(),
    /** User's current roles */
    userRoles: z.array(z.string()).default([]),
    /** User attributes for evaluation */
    userAttributes: z.record(z.any()).default({}),
    /** Resource being accessed */
    resourceId: z.string().optional(),
    /** Resource attributes */
    resourceAttributes: z.record(z.any()).default({}),
    /** Action being performed */
    actionId: z.string(),
    /** Request context */
    requestContext: z.object({
        /** Request timestamp */
        timestamp: z.date().default(() => new Date()),
        /** Client IP address */
        ipAddress: z.string().optional(),
        /** User agent */
        userAgent: z.string().optional(),
        /** Session ID */
        sessionId: z.string().optional(),
        /** Workspace context */
        workspaceId: z.string().optional(),
        /** Additional request metadata */
        metadata: z.record(z.any()).default({})
    }).default({})
});
/**
 * Permission Rule Schema
 */
export const PermissionRuleSchema = z.object({
    /** Unique rule identifier */
    id: z.string().min(1),
    /** Rule name */
    name: z.string().min(1),
    /** Rule description */
    description: z.string().optional(),
    /** Resource types this rule applies to */
    resourceTypes: z.array(z.string()).default(['*']),
    /** Actions this rule applies to */
    actions: z.array(z.string()).default(['*']),
    /** Roles this rule applies to */
    roles: z.array(z.string()).default(['*']),
    /** Rule effect */
    effect: z.enum(['allow', 'deny']),
    /** Rule priority (higher numbers take precedence) */
    priority: z.number().int().default(0),
    /** Conditions for rule evaluation */
    conditions: z.array(z.object({
        /** Attribute path to evaluate */
        attribute: z.string(),
        /** Comparison operator */
        operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'contains', 'regex']),
        /** Value to compare against */
        value: z.any(),
        /** Whether this condition is required */
        required: z.boolean().default(true)
    })).default([]),
    /** Time-based constraints */
    timeConstraints: z.object({
        /** Valid from timestamp */
        validFrom: z.date().optional(),
        /** Valid until timestamp */
        validUntil: z.date().optional(),
        /** Allowed hours (0-23) */
        allowedHours: z.array(z.number().int().min(0).max(23)).optional(),
        /** Allowed days of week (0-6, 0=Sunday) */
        allowedDaysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
        /** Timezone for time evaluation */
        timezone: z.string().optional()
    }).optional(),
    /** Whether this rule is active */
    isActive: z.boolean().default(true),
    /** Rule metadata */
    metadata: z.record(z.any()).default({})
});
/**
 * Permission Decision Schema
 */
export const PermissionDecisionSchema = z.object({
    /** Whether permission is granted */
    allowed: z.boolean(),
    /** Decision reason */
    reason: z.string(),
    /** Applied rules */
    appliedRules: z.array(z.object({
        ruleId: z.string(),
        effect: z.enum(['allow', 'deny']),
        priority: z.number()
    })),
    /** Decision timestamp */
    timestamp: z.date().default(() => new Date()),
    /** Decision metadata */
    metadata: z.record(z.any()).default({})
});
/**
 * Default Configuration
 */
const DEFAULT_CONFIG = {
    enableCaching: true,
    cacheTimeToLive: 5 * 60 * 1000, // 5 minutes
    enableAuditLogging: true,
    logAllDecisions: false,
    logDeniedOnly: true,
    defaultDecision: 'deny',
    maxEvaluationDepth: 10,
    enableRealTimeNotifications: true
};
/**
 * Permission Manager Class
 */
export class PermissionManager extends EventEmitter {
    config;
    auditLogger;
    // Storage maps (in production, these would be backed by a database)
    resources = new Map();
    actions = new Map();
    permissionRules = new Map();
    // Decision cache for performance
    decisionCache = new Map();
    constructor(config = {}) {
        super();
        this.config = { ...DEFAULT_CONFIG, ...config };
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
        // Initialize default resources and actions
        this.initializeDefaultResourcesAndActions();
    }
    /**
     * Resource Management
     */
    async createResource(resource) {
        const resourceId = this.generateResourceId(resource.type, resource.name);
        const newResource = {
            ...resource,
            id: resourceId,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        // Validate resource
        const validatedResource = ResourceSchema.parse(newResource);
        // Check if resource already exists
        if (this.resources.has(validatedResource.id)) {
            throw new Error(`Resource '${validatedResource.id}' already exists`);
        }
        // Validate parent resource if specified
        if (validatedResource.parentId && !this.resources.has(validatedResource.parentId)) {
            throw new Error(`Parent resource '${validatedResource.parentId}' does not exist`);
        }
        // Store resource
        this.resources.set(validatedResource.id, validatedResource);
        // Clear permission cache
        this.clearDecisionCache();
        // Log resource creation
        if (this.config.enableAuditLogging) {
            await this.auditLogger.logEvent({
                eventType: SecurityEventType.SYSTEM_CONFIG_CHANGED,
                category: EventCategory.AUTHORIZATION,
                severity: EventSeverity.LOW,
                userId: 'system',
                resourceType: 'permission_resource',
                action: 'create',
                result: 'success',
                details: {
                    context: {
                        resource: {
                            id: validatedResource.id,
                            type: validatedResource.type,
                            name: validatedResource.name,
                            parentId: validatedResource.parentId
                        }
                    }
                }
            });
        }
        this.emit('resource:created', { resource: validatedResource });
        return validatedResource;
    }
    async updateResource(resourceId, updates) {
        const existingResource = this.resources.get(resourceId);
        if (!existingResource) {
            throw new Error(`Resource '${resourceId}' not found`);
        }
        const updatedResource = {
            ...existingResource,
            ...updates,
            id: resourceId, // Ensure ID cannot be changed
            updatedAt: new Date()
        };
        // Validate updated resource
        const validatedResource = ResourceSchema.parse(updatedResource);
        // Store updated resource
        this.resources.set(resourceId, validatedResource);
        // Clear permission cache
        this.clearDecisionCache();
        // Log resource update
        if (this.config.enableAuditLogging) {
            await this.auditLogger.logEvent({
                eventType: SecurityEventType.SYSTEM_CONFIG_CHANGED,
                category: EventCategory.AUTHORIZATION,
                severity: EventSeverity.LOW,
                userId: 'system',
                resourceType: 'permission_resource',
                action: 'update',
                result: 'success',
                details: {
                    context: {
                        resource: {
                            id: resourceId,
                            changes: updates
                        }
                    }
                }
            });
        }
        this.emit('resource:updated', {
            resource: validatedResource,
            changes: updates
        });
        return validatedResource;
    }
    async deleteResource(resourceId) {
        const resource = this.resources.get(resourceId);
        if (!resource) {
            throw new Error(`Resource '${resourceId}' not found`);
        }
        // Check if resource has children
        const children = Array.from(this.resources.values())
            .filter(r => r.parentId === resourceId);
        if (children.length > 0) {
            throw new Error(`Cannot delete resource '${resourceId}' - has ${children.length} child resources`);
        }
        // Delete resource
        this.resources.delete(resourceId);
        // Clear permission cache
        this.clearDecisionCache();
        // Log resource deletion
        if (this.config.enableAuditLogging) {
            await this.auditLogger.logEvent({
                eventType: SecurityEventType.SYSTEM_CONFIG_CHANGED,
                category: EventCategory.AUTHORIZATION,
                severity: EventSeverity.MEDIUM,
                userId: 'system',
                resourceType: 'permission_resource',
                action: 'delete',
                result: 'success',
                details: {
                    context: {
                        resource: {
                            id: resourceId,
                            type: resource.type,
                            name: resource.name
                        }
                    }
                }
            });
        }
        this.emit('resource:deleted', { resourceId, resource });
    }
    getResource(resourceId) {
        return this.resources.get(resourceId);
    }
    listResources(filters) {
        let resources = Array.from(this.resources.values());
        if (filters) {
            if (filters.type) {
                resources = resources.filter(r => r.type === filters.type);
            }
            if (filters.parentId !== undefined) {
                resources = resources.filter(r => r.parentId === filters.parentId);
            }
            if (filters.ownerId) {
                resources = resources.filter(r => r.ownerId === filters.ownerId);
            }
            if (filters.isActive !== undefined) {
                resources = resources.filter(r => r.isActive === filters.isActive);
            }
        }
        return resources.sort((a, b) => a.name.localeCompare(b.name));
    }
    /**
     * Action Management
     */
    async createAction(action) {
        const actionId = this.generateActionId(action.name, action.category);
        const newAction = {
            ...action,
            id: actionId
        };
        // Validate action
        const validatedAction = ActionSchema.parse(newAction);
        // Check if action already exists
        if (this.actions.has(validatedAction.id)) {
            throw new Error(`Action '${validatedAction.id}' already exists`);
        }
        // Store action
        this.actions.set(validatedAction.id, validatedAction);
        // Clear permission cache
        this.clearDecisionCache();
        // Log action creation
        if (this.config.enableAuditLogging) {
            await this.auditLogger.logEvent({
                eventType: SecurityEventType.SYSTEM_CONFIG_CHANGED,
                category: EventCategory.AUTHORIZATION,
                severity: EventSeverity.LOW,
                userId: 'system',
                resourceType: 'permission_action',
                action: 'create',
                result: 'success',
                details: {
                    context: {
                        action: {
                            id: validatedAction.id,
                            name: validatedAction.name,
                            category: validatedAction.category,
                            riskLevel: validatedAction.riskLevel
                        }
                    }
                }
            });
        }
        this.emit('action:created', { action: validatedAction });
        return validatedAction;
    }
    getAction(actionId) {
        return this.actions.get(actionId);
    }
    listActions(filters) {
        let actions = Array.from(this.actions.values());
        if (filters) {
            if (filters.category) {
                actions = actions.filter(a => a.category === filters.category);
            }
            if (filters.resourceType) {
                actions = actions.filter(a => a.resourceTypes.length === 0 ||
                    a.resourceTypes.includes(filters.resourceType));
            }
            if (filters.riskLevel) {
                if (filters.riskLevel.min !== undefined) {
                    actions = actions.filter(a => a.riskLevel >= filters.riskLevel.min);
                }
                if (filters.riskLevel.max !== undefined) {
                    actions = actions.filter(a => a.riskLevel <= filters.riskLevel.max);
                }
            }
        }
        return actions.sort((a, b) => a.name.localeCompare(b.name));
    }
    /**
     * Permission Rule Management
     */
    async createPermissionRule(rule) {
        const ruleId = this.generateRuleId(rule.name, rule.effect);
        const newRule = {
            ...rule,
            id: ruleId
        };
        // Validate rule
        const validatedRule = PermissionRuleSchema.parse(newRule);
        // Check if rule already exists
        if (this.permissionRules.has(validatedRule.id)) {
            throw new Error(`Permission rule '${validatedRule.id}' already exists`);
        }
        // Store rule
        this.permissionRules.set(validatedRule.id, validatedRule);
        // Clear permission cache
        this.clearDecisionCache();
        // Log rule creation
        if (this.config.enableAuditLogging) {
            await this.auditLogger.logEvent({
                eventType: SecurityEventType.SYSTEM_CONFIG_CHANGED,
                category: EventCategory.AUTHORIZATION,
                severity: EventSeverity.LOW,
                userId: 'system',
                resourceType: 'permission_rule',
                action: 'create',
                result: 'success',
                details: {
                    context: {
                        rule: {
                            id: validatedRule.id,
                            name: validatedRule.name,
                            effect: validatedRule.effect,
                            priority: validatedRule.priority,
                            resourceTypes: validatedRule.resourceTypes,
                            actions: validatedRule.actions,
                            roles: validatedRule.roles
                        }
                    }
                }
            });
        }
        this.emit('rule:created', { rule: validatedRule });
        return validatedRule;
    }
    async updatePermissionRule(ruleId, updates) {
        const existingRule = this.permissionRules.get(ruleId);
        if (!existingRule) {
            throw new Error(`Permission rule '${ruleId}' not found`);
        }
        const updatedRule = {
            ...existingRule,
            ...updates,
            id: ruleId // Ensure ID cannot be changed
        };
        // Validate updated rule
        const validatedRule = PermissionRuleSchema.parse(updatedRule);
        // Store updated rule
        this.permissionRules.set(ruleId, validatedRule);
        // Clear permission cache
        this.clearDecisionCache();
        // Log rule update
        if (this.config.enableAuditLogging) {
            await this.auditLogger.logEvent({
                eventType: SecurityEventType.SYSTEM_CONFIG_CHANGED,
                category: EventCategory.AUTHORIZATION,
                severity: EventSeverity.LOW,
                userId: 'system',
                resourceType: 'permission_rule',
                action: 'update',
                result: 'success',
                details: {
                    context: {
                        rule: {
                            id: ruleId,
                            changes: updates
                        }
                    }
                }
            });
        }
        this.emit('rule:updated', {
            rule: validatedRule,
            changes: updates
        });
        return validatedRule;
    }
    async deletePermissionRule(ruleId) {
        const rule = this.permissionRules.get(ruleId);
        if (!rule) {
            throw new Error(`Permission rule '${ruleId}' not found`);
        }
        // Delete rule
        this.permissionRules.delete(ruleId);
        // Clear permission cache
        this.clearDecisionCache();
        // Log rule deletion
        if (this.config.enableAuditLogging) {
            await this.auditLogger.logEvent({
                eventType: SecurityEventType.SYSTEM_CONFIG_CHANGED,
                category: EventCategory.AUTHORIZATION,
                severity: EventSeverity.MEDIUM,
                userId: 'system',
                resourceType: 'permission_rule',
                action: 'delete',
                result: 'success',
                details: {
                    context: {
                        rule: {
                            id: ruleId,
                            name: rule.name,
                            effect: rule.effect
                        }
                    }
                }
            });
        }
        this.emit('rule:deleted', { ruleId, rule });
    }
    getPermissionRule(ruleId) {
        return this.permissionRules.get(ruleId);
    }
    listPermissionRules(filters) {
        let rules = Array.from(this.permissionRules.values());
        if (filters) {
            if (filters.effect) {
                rules = rules.filter(r => r.effect === filters.effect);
            }
            if (filters.resourceType) {
                rules = rules.filter(r => r.resourceTypes.includes('*') ||
                    r.resourceTypes.includes(filters.resourceType));
            }
            if (filters.action) {
                rules = rules.filter(r => r.actions.includes('*') ||
                    r.actions.includes(filters.action));
            }
            if (filters.role) {
                rules = rules.filter(r => r.roles.includes('*') ||
                    r.roles.includes(filters.role));
            }
            if (filters.isActive !== undefined) {
                rules = rules.filter(r => r.isActive === filters.isActive);
            }
        }
        return rules.sort((a, b) => b.priority - a.priority);
    }
    /**
     * Permission Evaluation
     */
    async evaluatePermission(context) {
        // Validate context
        const validatedContext = PermissionContextSchema.parse(context);
        // Check cache first
        if (this.config.enableCaching) {
            const cacheKey = this.generateCacheKey(validatedContext);
            const cached = this.decisionCache.get(cacheKey);
            if (cached && cached.expiresAt > Date.now()) {
                return cached.decision;
            }
        }
        // Find applicable rules
        const applicableRules = this.findApplicableRules(validatedContext);
        // Evaluate rules in priority order
        let finalDecision;
        const appliedRules = [];
        if (applicableRules.length === 0) {
            // No rules match, use default decision
            finalDecision = {
                allowed: this.config.defaultDecision === 'allow',
                reason: `No applicable rules found, using default decision: ${this.config.defaultDecision}`,
                appliedRules: [],
                timestamp: new Date(),
                metadata: { defaultDecisionUsed: true }
            };
        }
        else {
            // Evaluate rules in priority order (highest first)
            const sortedRules = applicableRules.sort((a, b) => b.priority - a.priority);
            let decision = null;
            let decidingRule = null;
            for (const rule of sortedRules) {
                const ruleApplies = await this.evaluateRuleConditions(rule, validatedContext);
                if (ruleApplies) {
                    appliedRules.push({
                        ruleId: rule.id,
                        effect: rule.effect,
                        priority: rule.priority
                    });
                    // First matching rule determines the decision
                    if (decision === null) {
                        decision = rule.effect;
                        decidingRule = rule;
                    }
                }
            }
            finalDecision = {
                allowed: decision === 'allow',
                reason: decision
                    ? `Permission ${decision} by rule: ${decidingRule?.name} (${decidingRule?.id})`
                    : `No rules applied, using default decision: ${this.config.defaultDecision}`,
                appliedRules,
                timestamp: new Date(),
                metadata: {
                    evaluatedRules: applicableRules.length,
                    decidingRuleId: decidingRule?.id,
                    defaultDecisionUsed: decision === null
                }
            };
            // If no rule decided, use default
            if (decision === null) {
                finalDecision.allowed = this.config.defaultDecision === 'allow';
            }
        }
        // Cache decision
        if (this.config.enableCaching) {
            const cacheKey = this.generateCacheKey(validatedContext);
            this.decisionCache.set(cacheKey, {
                decision: finalDecision,
                expiresAt: Date.now() + this.config.cacheTimeToLive
            });
        }
        // Log decision if required
        if (this.config.enableAuditLogging) {
            const shouldLog = this.config.logAllDecisions ||
                (this.config.logDeniedOnly && !finalDecision.allowed);
            if (shouldLog) {
                await this.auditLogger.logEvent({
                    eventType: finalDecision.allowed ? SecurityEventType.ACCESS_GRANTED : SecurityEventType.ACCESS_DENIED,
                    category: EventCategory.AUTHORIZATION,
                    severity: finalDecision.allowed ? EventSeverity.LOW : EventSeverity.MEDIUM,
                    userId: validatedContext.userId,
                    sessionId: validatedContext.requestContext.sessionId,
                    resourceType: 'permission_evaluation',
                    resourceId: validatedContext.resourceId,
                    action: validatedContext.actionId,
                    result: finalDecision.allowed ? 'success' : 'denied',
                    ipAddress: validatedContext.requestContext.ipAddress,
                    userAgent: validatedContext.requestContext.userAgent,
                    details: {
                        context: {
                            decision: finalDecision,
                            evaluationContext: {
                                userId: validatedContext.userId,
                                resourceId: validatedContext.resourceId,
                                actionId: validatedContext.actionId,
                                userRoles: validatedContext.userRoles
                            }
                        }
                    }
                });
            }
        }
        // Emit real-time notification
        if (this.config.enableRealTimeNotifications) {
            this.emit('permission:evaluated', {
                context: validatedContext,
                decision: finalDecision
            });
            if (!finalDecision.allowed) {
                this.emit('permission:denied', {
                    context: validatedContext,
                    decision: finalDecision
                });
            }
        }
        return finalDecision;
    }
    /**
     * Convenience methods for permission checking
     */
    async hasPermission(userId, actionId, resourceId, additionalContext) {
        const context = {
            userId,
            actionId,
            resourceId,
            userRoles: [],
            userAttributes: {},
            resourceAttributes: {},
            requestContext: {
                timestamp: new Date(),
                metadata: {}
            },
            ...additionalContext
        };
        const decision = await this.evaluatePermission(context);
        return decision.allowed;
    }
    async checkPermission(userId, actionId, resourceId, additionalContext) {
        const context = {
            userId,
            actionId,
            resourceId,
            userRoles: [],
            userAttributes: {},
            resourceAttributes: {},
            requestContext: {
                timestamp: new Date(),
                metadata: {}
            },
            ...additionalContext
        };
        return this.evaluatePermission(context);
    }
    /**
     * Private helper methods
     */
    findApplicableRules(context) {
        const resource = context.resourceId ? this.resources.get(context.resourceId) : null;
        const action = this.actions.get(context.actionId);
        const applicableRules = [];
        for (const rule of this.permissionRules.values()) {
            if (!rule.isActive)
                continue;
            // Check resource type match
            const resourceTypeMatch = rule.resourceTypes.includes('*') ||
                (resource && rule.resourceTypes.includes(resource.type));
            if (!resourceTypeMatch && context.resourceId)
                continue;
            // Check action match
            const actionMatch = rule.actions.includes('*') ||
                rule.actions.includes(context.actionId) ||
                (action && rule.actions.includes(action.category));
            if (!actionMatch)
                continue;
            // Check role match
            const roleMatch = rule.roles.includes('*') ||
                context.userRoles.some(role => rule.roles.includes(role));
            if (!roleMatch && rule.roles.length > 0 && !rule.roles.includes('*'))
                continue;
            // Check time constraints
            if (rule.timeConstraints && !this.evaluateTimeConstraints(rule.timeConstraints, context)) {
                continue;
            }
            applicableRules.push(rule);
        }
        return applicableRules;
    }
    async evaluateRuleConditions(rule, context) {
        if (rule.conditions.length === 0) {
            return true; // No conditions, rule applies
        }
        for (const condition of rule.conditions) {
            const attributeValue = this.getAttributeValue(condition.attribute, context);
            const conditionMet = this.evaluateCondition(attributeValue, condition.operator, condition.value);
            if (condition.required && !conditionMet) {
                return false; // Required condition not met
            }
        }
        return true; // All required conditions met
    }
    evaluateTimeConstraints(constraints, context) {
        const now = context.requestContext.timestamp || new Date();
        // Check valid from/until
        if (constraints.validFrom && now < constraints.validFrom) {
            return false;
        }
        if (constraints.validUntil && now > constraints.validUntil) {
            return false;
        }
        // Check allowed hours
        if (constraints.allowedHours && constraints.allowedHours.length > 0) {
            const hour = now.getHours();
            if (!constraints.allowedHours.includes(hour)) {
                return false;
            }
        }
        // Check allowed days of week
        if (constraints.allowedDaysOfWeek && constraints.allowedDaysOfWeek.length > 0) {
            const dayOfWeek = now.getDay();
            if (!constraints.allowedDaysOfWeek.includes(dayOfWeek)) {
                return false;
            }
        }
        return true;
    }
    getAttributeValue(attributePath, context) {
        const parts = attributePath.split('.');
        let value = context;
        for (const part of parts) {
            if (value && typeof value === 'object' && part in value) {
                value = value[part];
            }
            else {
                return undefined;
            }
        }
        return value;
    }
    evaluateCondition(attributeValue, operator, expectedValue) {
        switch (operator) {
            case 'eq':
                return attributeValue === expectedValue;
            case 'ne':
                return attributeValue !== expectedValue;
            case 'gt':
                return attributeValue > expectedValue;
            case 'gte':
                return attributeValue >= expectedValue;
            case 'lt':
                return attributeValue < expectedValue;
            case 'lte':
                return attributeValue <= expectedValue;
            case 'in':
                return Array.isArray(expectedValue) && expectedValue.includes(attributeValue);
            case 'nin':
                return Array.isArray(expectedValue) && !expectedValue.includes(attributeValue);
            case 'contains':
                return typeof attributeValue === 'string' && attributeValue.includes(expectedValue);
            case 'regex':
                return typeof attributeValue === 'string' && new RegExp(expectedValue).test(attributeValue);
            default:
                return false;
        }
    }
    generateCacheKey(context) {
        return `${context.userId}:${context.actionId}:${context.resourceId || 'none'}:${context.userRoles.join(',')}`;
    }
    clearDecisionCache() {
        this.decisionCache.clear();
    }
    generateResourceId(type, name) {
        return `${type}:${name.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}`;
    }
    generateActionId(name, category) {
        return `${category}:${name.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}`;
    }
    generateRuleId(name, effect) {
        return `${effect}_${name.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}`;
    }
    /**
     * Initialize default resources and actions
     */
    async initializeDefaultResourcesAndActions() {
        // Default resource types
        const defaultResources = [
            {
                type: 'repository',
                name: 'Repository',
                description: 'Source code repository',
                attributes: { category: 'code', sensitive: false },
                metadata: { system: true },
                isActive: true
            },
            {
                type: 'workspace',
                name: 'Workspace',
                description: 'User workspace',
                attributes: { category: 'workspace', sensitive: false },
                metadata: { system: true },
                isActive: true
            },
            {
                type: 'user',
                name: 'User',
                description: 'User account',
                attributes: { category: 'identity', sensitive: true },
                metadata: { system: true },
                isActive: true
            },
            {
                type: 'security',
                name: 'Security',
                description: 'Security configuration',
                attributes: { category: 'security', sensitive: true },
                metadata: { system: true },
                isActive: true
            }
        ];
        // Default actions
        const defaultActions = [
            // Read actions
            { name: 'Read', description: 'Read access', category: 'read', riskLevel: 10, resourceTypes: ['*'], requiresConfirmation: false, minimumRoleLevel: 0, metadata: {} },
            { name: 'View', description: 'View access', category: 'read', riskLevel: 10, resourceTypes: ['*'], requiresConfirmation: false, minimumRoleLevel: 0, metadata: {} },
            { name: 'List', description: 'List items', category: 'read', riskLevel: 10, resourceTypes: ['*'], requiresConfirmation: false, minimumRoleLevel: 0, metadata: {} },
            // Write actions
            { name: 'Write', description: 'Write access', category: 'write', riskLevel: 50, resourceTypes: ['*'], requiresConfirmation: false, minimumRoleLevel: 1, metadata: {} },
            { name: 'Update', description: 'Update items', category: 'write', riskLevel: 50, resourceTypes: ['*'], requiresConfirmation: false, minimumRoleLevel: 1, metadata: {} },
            { name: 'Create', description: 'Create items', category: 'write', riskLevel: 40, resourceTypes: ['*'], requiresConfirmation: false, minimumRoleLevel: 1, metadata: {} },
            // Admin actions
            { name: 'Admin', description: 'Administrative access', category: 'admin', riskLevel: 90, resourceTypes: ['*'], requiresConfirmation: true, minimumRoleLevel: 3, metadata: {} },
            { name: 'Configure', description: 'Configuration access', category: 'admin', riskLevel: 80, resourceTypes: ['*'], requiresConfirmation: false, minimumRoleLevel: 2, metadata: {} },
            { name: 'Manage', description: 'Management access', category: 'manage', riskLevel: 70, resourceTypes: ['*'], requiresConfirmation: false, minimumRoleLevel: 2, metadata: {} },
            // Delete actions
            { name: 'Delete', description: 'Delete items', category: 'delete', riskLevel: 80, requiresConfirmation: true, resourceTypes: ['*'], minimumRoleLevel: 2, metadata: {} },
            // Execute actions
            { name: 'Execute', description: 'Execute operations', category: 'execute', riskLevel: 60, resourceTypes: ['*'], requiresConfirmation: false, minimumRoleLevel: 1, metadata: {} }
        ];
        // Create default resources
        for (const resource of defaultResources) {
            try {
                await this.createResource(resource);
            }
            catch (error) {
                // Resource might already exist, continue
                console.debug(`Resource creation skipped: ${error}`);
            }
        }
        // Create default actions
        for (const action of defaultActions) {
            try {
                await this.createAction(action);
            }
            catch (error) {
                // Action might already exist, continue
                console.debug(`Action creation skipped: ${error}`);
            }
        }
        // Create some default permission rules
        const defaultRules = [
            {
                name: 'System Admin All Access',
                description: 'System administrators have full access',
                effect: 'allow',
                priority: 1000,
                roles: ['system_admin', 'admin'],
                resourceTypes: ['*'],
                actions: ['*'],
                conditions: [],
                metadata: {},
                isActive: true
            },
            {
                name: 'Repository Admin Full Repository Access',
                description: 'Repository admins have full access to repositories',
                effect: 'allow',
                priority: 900,
                roles: ['repo_admin'],
                resourceTypes: ['repository'],
                actions: ['*'],
                conditions: [],
                metadata: {},
                isActive: true
            },
            {
                name: 'Developer Repository Write Access',
                description: 'Developers can read and write repositories',
                effect: 'allow',
                priority: 700,
                roles: ['developer'],
                resourceTypes: ['repository'],
                actions: ['read:read', 'read:view', 'read:list', 'write:write', 'write:update', 'write:create'],
                conditions: [],
                metadata: {},
                isActive: true
            },
            {
                name: 'Viewer Read Only Access',
                description: 'Viewers have read-only access',
                effect: 'allow',
                priority: 300,
                roles: ['viewer'],
                resourceTypes: ['repository', 'workspace'],
                actions: ['read:read', 'read:view', 'read:list'],
                conditions: [],
                metadata: {},
                isActive: true
            },
            {
                name: 'Default Deny High Risk Actions',
                description: 'Deny high-risk actions by default',
                effect: 'deny',
                priority: 100,
                roles: ['*'],
                resourceTypes: ['*'],
                actions: ['delete:delete'],
                conditions: [
                    {
                        attribute: 'userAttributes.confirmed',
                        operator: 'ne',
                        value: true,
                        required: true
                    }
                ],
                metadata: {},
                isActive: true
            }
        ];
        // Create default rules
        for (const rule of defaultRules) {
            try {
                await this.createPermissionRule(rule);
            }
            catch (error) {
                // Rule might already exist, continue
                console.debug(`Rule creation skipped: ${error}`);
            }
        }
    }
    /**
     * Get permission manager statistics
     */
    getPermissionStats() {
        const resources = Array.from(this.resources.values());
        const actions = Array.from(this.actions.values());
        const rules = Array.from(this.permissionRules.values());
        const resourceStats = {
            total: resources.length,
            byType: resources.reduce((acc, r) => {
                acc[r.type] = (acc[r.type] || 0) + 1;
                return acc;
            }, {}),
            active: resources.filter(r => r.isActive).length
        };
        const actionStats = {
            total: actions.length,
            byCategory: actions.reduce((acc, a) => {
                acc[a.category] = (acc[a.category] || 0) + 1;
                return acc;
            }, {}),
            byRiskLevel: actions.reduce((acc, a) => {
                const level = a.riskLevel < 30 ? 'low' : a.riskLevel < 70 ? 'medium' : 'high';
                acc[level] = (acc[level] || 0) + 1;
                return acc;
            }, {})
        };
        const ruleStats = {
            total: rules.length,
            active: rules.filter(r => r.isActive).length,
            byEffect: rules.reduce((acc, r) => {
                acc[r.effect] = (acc[r.effect] || 0) + 1;
                return acc;
            }, {})
        };
        const cacheStats = {
            size: this.decisionCache.size
        };
        return {
            resources: resourceStats,
            actions: actionStats,
            rules: ruleStats,
            cache: cacheStats
        };
    }
}
export default PermissionManager;
//# sourceMappingURL=permission-manager.js.map