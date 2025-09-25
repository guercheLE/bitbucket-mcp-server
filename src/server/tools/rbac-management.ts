/**
 * RBAC Management Tool
 * 
 * Provides comprehensive Role-Based Access Control management functionality
 * for the Bitbucket MCP server, including role management, permission assignment,
 * policy configuration, and security oversight tools.
 * 
 * Features:
 * - Role creation, modification, and deletion
 * - User role assignments with scope and time constraints
 * - Permission rule management and evaluation
 * - Policy document lifecycle management
 * - Security audit and monitoring
 * - Real-time access control testing
 */

import { z } from 'zod';
import {
    MCPErrorCode,
    Tool,
    ToolExecutionContext,
    ToolResult
} from '../../types/index.js';
import { SecurityAuditLogger } from '../security/audit-logger.js';
import { PermissionManager } from '../security/permission-manager.js';
import { PolicyEngine } from '../security/policy-engine.js';
import { RBACRoleManager } from '../security/rbac-role-manager.js';

/**
 * RBAC Management Tool Configuration
 */
interface RBACManagementConfig {
    /** Enable advanced policy features */
    enableAdvancedPolicies: boolean;
    /** Maximum roles per user */
    maxRolesPerUser: number;
    /** Enable real-time validation */
    enableRealtimeValidation: boolean;
    /** Security audit verbosity level */
    auditVerbosity: 'minimal' | 'standard' | 'detailed' | 'comprehensive';
    /** Cache TTL for management operations */
    cacheTimeToLive: number;
}

/**
 * Role management operation types
 */
const RoleOperationType = z.enum([
    'create',
    'update',
    'delete',
    'assign',
    'unassign',
    'list',
    'get',
    'activate',
    'deactivate'
]);

/**
 * Permission management operation types  
 */
const PermissionOperationType = z.enum([
    'create_rule',
    'update_rule',
    'delete_rule',
    'list_rules',
    'get_rule',
    'evaluate',
    'test_access',
    'get_user_permissions'
]);

/**
 * Policy management operation types
 */
const PolicyOperationType = z.enum([
    'create_policy',
    'update_policy',
    'delete_policy',
    'list_policies',
    'get_policy',
    'evaluate_policy',
    'test_policy',
    'activate_policy',
    'deactivate_policy'
]);

/**
 * Security audit operation types
 */
const AuditOperationType = z.enum([
    'get_audit_logs',
    'get_security_metrics',
    'get_access_summary',
    'export_audit_report',
    'get_policy_compliance',
    'analyze_security_trends'
]);

/**
 * Role Management Schemas
 */
const RoleCreateSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    priority: z.number().int().min(0).max(1000).default(100),
    parentRoles: z.array(z.string()).default([]),
    permissions: z.array(z.string()).default([]),
    isSystem: z.boolean().default(false),
    maxAssignments: z.number().int().positive().optional(),
    expiresAt: z.string().datetime().optional(),
    metadata: z.record(z.any()).default({})
});

const RoleUpdateSchema = z.object({
    roleId: z.string().min(1),
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    priority: z.number().int().min(0).max(1000).optional(),
    parentRoles: z.array(z.string()).optional(),
    permissions: z.array(z.string()).optional(),
    maxAssignments: z.number().int().positive().optional(),
    expiresAt: z.string().datetime().optional(),
    metadata: z.record(z.any()).optional()
});

const UserRoleAssignmentSchema = z.object({
    userId: z.string().min(1),
    roleId: z.string().min(1),
    scope: z.record(z.any()).default({}),
    expiresAt: z.string().datetime().optional(),
    assignedBy: z.string().min(1),
    metadata: z.record(z.any()).default({})
});

/**
 * Permission Management Schemas
 */
const PermissionRuleCreateSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    priority: z.number().int().min(0).max(1000).default(100),
    effect: z.enum(['allow', 'deny']),
    resourceTypes: z.array(z.string()).min(1),
    actions: z.array(z.string()).min(1),
    roles: z.array(z.string()).default([]),
    conditions: z.array(z.object({
        type: z.enum(['attribute', 'scope', 'time', 'resource', 'custom']),
        field: z.string(),
        operator: z.enum(['equals', 'not_equals', 'contains', 'matches', 'greater_than', 'less_than', 'in', 'not_in']),
        value: z.any(),
        metadata: z.record(z.any()).default({})
    })).default([]),
    timeConstraints: z.object({
        validFrom: z.string().datetime().optional(),
        validUntil: z.string().datetime().optional(),
        timezone: z.string().default('UTC'),
        allowedHours: z.array(z.number().int().min(0).max(23)).optional(),
        allowedDays: z.array(z.number().int().min(0).max(6)).optional(),
        metadata: z.record(z.any()).default({})
    }).default({}),
    metadata: z.record(z.any()).default({})
});

const AccessEvaluationSchema = z.object({
    userId: z.string().min(1),
    resource: z.string().min(1),
    action: z.string().min(1),
    context: z.record(z.any()).default({}),
    includeAuditTrail: z.boolean().default(false)
});

/**
 * Policy Management Schemas  
 */
const PolicyCreateSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    version: z.string().default('1.0'),
    statements: z.array(z.object({
        id: z.string().min(1),
        description: z.string().optional(),
        effect: z.enum(['allow', 'deny']),
        priority: z.number().int().min(0).max(1000).default(100),
        resources: z.array(z.string()).min(1),
        actions: z.array(z.string()).min(1),
        principals: z.array(z.string()).min(1),
        conditions: z.object({
            type: z.enum(['literal', 'variable', 'function', 'operator', 'condition']),
            value: z.any().optional(),
            variable: z.string().optional(),
            function: z.string().optional(),
            operator: z.enum(['and', 'or', 'not', 'eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'contains', 'matches', 'exists']).optional(),
            arguments: z.array(z.any()).optional(),
            metadata: z.record(z.any()).default({})
        }).optional(),
        metadata: z.record(z.any()).default({})
    })).min(1),
    variables: z.record(z.any()).default({}),
    functions: z.record(z.any()).default({}),
    tags: z.array(z.string()).default([]),
    metadata: z.record(z.any()).default({})
});

const PolicyEvaluationSchema = z.object({
    policyId: z.string().min(1),
    principal: z.string().min(1),
    resource: z.string().min(1),
    action: z.string().min(1),
    context: z.record(z.any()).default({}),
    includeDebugInfo: z.boolean().default(false)
});

/**
 * RBAC Management Tool Implementation
 */
export class RBACManagementTool implements Tool {
    public readonly name = 'rbac_management';
    public readonly description = 'Comprehensive RBAC management for roles, permissions, policies, and security oversight';

    private roleManager: RBACRoleManager;
    private permissionManager: PermissionManager;
    private policyEngine: PolicyEngine;
    private auditLogger: SecurityAuditLogger;
    private config: RBACManagementConfig;

    constructor(
        roleManager: RBACRoleManager,
        permissionManager: PermissionManager,
        policyEngine: PolicyEngine,
        auditLogger: SecurityAuditLogger,
        config: Partial<RBACManagementConfig> = {}
    ) {
        this.roleManager = roleManager;
        this.permissionManager = permissionManager;
        this.policyEngine = policyEngine;
        this.auditLogger = auditLogger;

        this.config = {
            enableAdvancedPolicies: true,
            maxRolesPerUser: 10,
            enableRealtimeValidation: true,
            auditVerbosity: 'standard',
            cacheTimeToLive: 300000, // 5 minutes
            ...config
        };
    }

    public get inputSchema() {
        return z.object({
            operation: z.enum([
                // Role operations
                'create_role',
                'update_role',
                'delete_role',
                'assign_role',
                'unassign_role',
                'list_roles',
                'get_role',
                'activate_role',
                'deactivate_role',
                'get_user_roles',
                'get_role_hierarchy',

                // Permission operations
                'create_permission_rule',
                'update_permission_rule',
                'delete_permission_rule',
                'list_permission_rules',
                'get_permission_rule',
                'evaluate_access',
                'test_user_access',
                'get_user_permissions',
                'get_resource_permissions',

                // Policy operations
                'create_policy',
                'update_policy',
                'delete_policy',
                'list_policies',
                'get_policy',
                'evaluate_policy',
                'test_policy_decision',
                'activate_policy',
                'deactivate_policy',

                // Security audit operations
                'get_audit_logs',
                'get_security_metrics',
                'get_access_summary',
                'export_audit_report',
                'get_policy_compliance',
                'analyze_security_trends',

                // System operations
                'validate_security_config',
                'get_system_status',
                'perform_security_check'
            ]),

            // Role management parameters
            roleData: RoleCreateSchema.optional(),
            roleUpdate: RoleUpdateSchema.optional(),
            roleAssignment: UserRoleAssignmentSchema.optional(),
            roleId: z.string().optional(),
            userId: z.string().optional(),

            // Permission management parameters
            permissionRule: PermissionRuleCreateSchema.optional(),
            permissionRuleId: z.string().optional(),
            accessEvaluation: AccessEvaluationSchema.optional(),
            resourceType: z.string().optional(),
            action: z.string().optional(),

            // Policy management parameters  
            policyData: PolicyCreateSchema.optional(),
            policyId: z.string().optional(),
            policyEvaluation: PolicyEvaluationSchema.optional(),

            // Audit and reporting parameters
            auditQuery: z.object({
                startDate: z.string().datetime().optional(),
                endDate: z.string().datetime().optional(),
                eventType: z.string().optional(),
                userId: z.string().optional(),
                resourceType: z.string().optional(),
                severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
                limit: z.number().int().positive().max(1000).default(100),
                offset: z.number().int().min(0).default(0)
            }).optional(),

            // Generic parameters
            includeMetadata: z.boolean().default(false),
            includeInactive: z.boolean().default(false),
            includeSystemItems: z.boolean().default(false),
            format: z.enum(['json', 'table', 'csv', 'summary']).default('json')
        });
    }

    public async execute(args: any, context: ToolExecutionContext): Promise<ToolResult> {
        const startTime = Date.now();
        const executionId = `rbac_mgmt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        try {
            // Validate input arguments
            const validatedArgs = this.inputSchema.parse(args);

            // Log management operation start
            await this.auditLogger.logEvent({
                type: 'management_operation',
                severity: 'medium',
                message: `RBAC management operation started: ${validatedArgs.operation}`,
                userId: context.authentication?.userId || 'system',
                sessionId: context.session?.id || 'unknown',
                resourceType: 'rbac_management',
                resourceId: executionId,
                action: validatedArgs.operation,
                outcome: 'started',
                metadata: {
                    operation: validatedArgs.operation,
                    executionId,
                    hasRoleData: !!validatedArgs.roleData,
                    hasPermissionRule: !!validatedArgs.permissionRule,
                    hasPolicyData: !!validatedArgs.policyData
                }
            });

            // Route to appropriate operation handler
            let result: any;

            switch (validatedArgs.operation) {
                // Role Management Operations
                case 'create_role':
                    result = await this.handleCreateRole(validatedArgs, context);
                    break;
                case 'update_role':
                    result = await this.handleUpdateRole(validatedArgs, context);
                    break;
                case 'delete_role':
                    result = await this.handleDeleteRole(validatedArgs, context);
                    break;
                case 'assign_role':
                    result = await this.handleAssignRole(validatedArgs, context);
                    break;
                case 'unassign_role':
                    result = await this.handleUnassignRole(validatedArgs, context);
                    break;
                case 'list_roles':
                    result = await this.handleListRoles(validatedArgs, context);
                    break;
                case 'get_role':
                    result = await this.handleGetRole(validatedArgs, context);
                    break;
                case 'activate_role':
                    result = await this.handleActivateRole(validatedArgs, context);
                    break;
                case 'deactivate_role':
                    result = await this.handleDeactivateRole(validatedArgs, context);
                    break;
                case 'get_user_roles':
                    result = await this.handleGetUserRoles(validatedArgs, context);
                    break;
                case 'get_role_hierarchy':
                    result = await this.handleGetRoleHierarchy(validatedArgs, context);
                    break;

                // Permission Management Operations
                case 'create_permission_rule':
                    result = await this.handleCreatePermissionRule(validatedArgs, context);
                    break;
                case 'update_permission_rule':
                    result = await this.handleUpdatePermissionRule(validatedArgs, context);
                    break;
                case 'delete_permission_rule':
                    result = await this.handleDeletePermissionRule(validatedArgs, context);
                    break;
                case 'list_permission_rules':
                    result = await this.handleListPermissionRules(validatedArgs, context);
                    break;
                case 'get_permission_rule':
                    result = await this.handleGetPermissionRule(validatedArgs, context);
                    break;
                case 'evaluate_access':
                    result = await this.handleEvaluateAccess(validatedArgs, context);
                    break;
                case 'test_user_access':
                    result = await this.handleTestUserAccess(validatedArgs, context);
                    break;
                case 'get_user_permissions':
                    result = await this.handleGetUserPermissions(validatedArgs, context);
                    break;
                case 'get_resource_permissions':
                    result = await this.handleGetResourcePermissions(validatedArgs, context);
                    break;

                // Policy Management Operations
                case 'create_policy':
                    result = await this.handleCreatePolicy(validatedArgs, context);
                    break;
                case 'update_policy':
                    result = await this.handleUpdatePolicy(validatedArgs, context);
                    break;
                case 'delete_policy':
                    result = await this.handleDeletePolicy(validatedArgs, context);
                    break;
                case 'list_policies':
                    result = await this.handleListPolicies(validatedArgs, context);
                    break;
                case 'get_policy':
                    result = await this.handleGetPolicy(validatedArgs, context);
                    break;
                case 'evaluate_policy':
                    result = await this.handleEvaluatePolicy(validatedArgs, context);
                    break;
                case 'test_policy_decision':
                    result = await this.handleTestPolicyDecision(validatedArgs, context);
                    break;
                case 'activate_policy':
                    result = await this.handleActivatePolicy(validatedArgs, context);
                    break;
                case 'deactivate_policy':
                    result = await this.handleDeactivatePolicy(validatedArgs, context);
                    break;

                // Security Audit Operations
                case 'get_audit_logs':
                    result = await this.handleGetAuditLogs(validatedArgs, context);
                    break;
                case 'get_security_metrics':
                    result = await this.handleGetSecurityMetrics(validatedArgs, context);
                    break;
                case 'get_access_summary':
                    result = await this.handleGetAccessSummary(validatedArgs, context);
                    break;
                case 'export_audit_report':
                    result = await this.handleExportAuditReport(validatedArgs, context);
                    break;
                case 'get_policy_compliance':
                    result = await this.handleGetPolicyCompliance(validatedArgs, context);
                    break;
                case 'analyze_security_trends':
                    result = await this.handleAnalyzeSecurityTrends(validatedArgs, context);
                    break;

                // System Operations
                case 'validate_security_config':
                    result = await this.handleValidateSecurityConfig(validatedArgs, context);
                    break;
                case 'get_system_status':
                    result = await this.handleGetSystemStatus(validatedArgs, context);
                    break;
                case 'perform_security_check':
                    result = await this.handlePerformSecurityCheck(validatedArgs, context);
                    break;

                default:
                    throw new Error(`Unknown operation: ${validatedArgs.operation}`);
            }

            const executionTime = Date.now() - startTime;

            // Log successful completion
            await this.auditLogger.logEvent({
                type: 'management_operation',
                severity: 'low',
                message: `RBAC management operation completed successfully: ${validatedArgs.operation}`,
                userId: context.authentication?.userId || 'system',
                sessionId: context.session?.id || 'unknown',
                resourceType: 'rbac_management',
                resourceId: executionId,
                action: validatedArgs.operation,
                outcome: 'success',
                metadata: {
                    operation: validatedArgs.operation,
                    executionId,
                    executionTimeMs: executionTime,
                    resultType: typeof result,
                    resultSize: result ? JSON.stringify(result).length : 0
                }
            });

            return {
                success: true,
                data: result,
                metadata: {
                    operation: validatedArgs.operation,
                    executionId,
                    executionTime,
                    timestamp: new Date(),
                    version: '1.0'
                }
            };

        } catch (error) {
            const executionTime = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

            // Log operation failure  
            await this.auditLogger.logEvent({
                type: 'management_operation',
                severity: 'high',
                message: `RBAC management operation failed: ${args.operation} - ${errorMessage}`,
                userId: context.authentication?.userId || 'system',
                sessionId: context.session?.id || 'unknown',
                resourceType: 'rbac_management',
                resourceId: executionId,
                action: args.operation || 'unknown',
                outcome: 'failure',
                metadata: {
                    operation: args.operation,
                    executionId,
                    executionTimeMs: executionTime,
                    errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
                    errorMessage,
                    stack: error instanceof Error ? error.stack : undefined
                }
            });

            // Determine appropriate error code
            let errorCode: MCPErrorCode = MCPErrorCode.INTERNAL_ERROR;
            if (error instanceof z.ZodError) {
                errorCode = MCPErrorCode.INVALID_PARAMS;
            } else if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
                errorCode = MCPErrorCode.INVALID_PARAMS;
            } else if (errorMessage.includes('unauthorized') || errorMessage.includes('access denied')) {
                errorCode = MCPErrorCode.AUTHORIZATION_FAILED;
            }

            return {
                success: false,
                error: {
                    code: errorCode,
                    message: `RBAC management operation failed: ${errorMessage}`,
                    details: {
                        operation: args.operation,
                        executionId,
                        executionTime,
                        error: errorMessage
                    }
                },
                metadata: {
                    executionTime,
                    timestamp: new Date()
                }
            };
        }
    }

    // Role Management Handlers
    private async handleCreateRole(args: any, context: ToolContext): Promise<any> {
        if (!args.roleData) {
            throw new Error('Role data is required for create_role operation');
        }

        const roleData = {
            ...args.roleData,
            expiresAt: args.roleData.expiresAt ? new Date(args.roleData.expiresAt) : undefined
        };

        const role = await this.roleManager.createRole(roleData);

        return {
            success: true,
            role,
            message: `Role '${role.name}' created successfully`
        };
    }

    private async handleUpdateRole(args: any, context: ToolContext): Promise<any> {
        if (!args.roleUpdate?.roleId) {
            throw new Error('Role ID is required for update_role operation');
        }

        const updateData = {
            ...args.roleUpdate,
            expiresAt: args.roleUpdate.expiresAt ? new Date(args.roleUpdate.expiresAt) : undefined
        };

        const updatedRole = await this.roleManager.updateRole(updateData.roleId, updateData);

        return {
            success: true,
            role: updatedRole,
            message: `Role '${updatedRole.name}' updated successfully`
        };
    }

    private async handleDeleteRole(args: any, context: ToolContext): Promise<any> {
        if (!args.roleId) {
            throw new Error('Role ID is required for delete_role operation');
        }

        await this.roleManager.deleteRole(args.roleId);

        return {
            success: true,
            message: `Role '${args.roleId}' deleted successfully`
        };
    }

    private async handleAssignRole(args: any, context: ToolContext): Promise<any> {
        if (!args.roleAssignment) {
            throw new Error('Role assignment data is required for assign_role operation');
        }

        const assignmentData = {
            ...args.roleAssignment,
            expiresAt: args.roleAssignment.expiresAt ? new Date(args.roleAssignment.expiresAt) : undefined
        };

        const assignment = await this.roleManager.assignRole(
            assignmentData.userId,
            assignmentData.roleId,
            assignmentData.scope,
            assignmentData.expiresAt,
            assignmentData.assignedBy,
            assignmentData.metadata
        );

        return {
            success: true,
            assignment,
            message: `Role '${assignmentData.roleId}' assigned to user '${assignmentData.userId}' successfully`
        };
    }

    private async handleUnassignRole(args: any, context: ToolContext): Promise<any> {
        if (!args.userId || !args.roleId) {
            throw new Error('User ID and Role ID are required for unassign_role operation');
        }

        await this.roleManager.revokeRole(args.userId, args.roleId);

        return {
            success: true,
            message: `Role '${args.roleId}' unassigned from user '${args.userId}' successfully`
        };
    }

    private async handleListRoles(args: any, context: ToolContext): Promise<any> {
        const roles = await this.roleManager.getAllRoles(args.includeInactive);

        const filteredRoles = args.includeSystemItems
            ? roles
            : roles.filter(role => !role.isSystem);

        return {
            success: true,
            roles: filteredRoles,
            count: filteredRoles.length,
            includeInactive: args.includeInactive,
            includeSystemItems: args.includeSystemItems
        };
    }

    private async handleGetRole(args: any, context: ToolContext): Promise<any> {
        if (!args.roleId) {
            throw new Error('Role ID is required for get_role operation');
        }

        const role = await this.roleManager.getRole(args.roleId);
        if (!role) {
            throw new Error(`Role '${args.roleId}' not found`);
        }

        return {
            success: true,
            role,
            includeMetadata: args.includeMetadata
        };
    }

    private async handleActivateRole(args: any, context: ToolContext): Promise<any> {
        if (!args.roleId) {
            throw new Error('Role ID is required for activate_role operation');
        }

        const updatedRole = await this.roleManager.updateRole(args.roleId, { isActive: true });

        return {
            success: true,
            role: updatedRole,
            message: `Role '${args.roleId}' activated successfully`
        };
    }

    private async handleDeactivateRole(args: any, context: ToolContext): Promise<any> {
        if (!args.roleId) {
            throw new Error('Role ID is required for deactivate_role operation');
        }

        const updatedRole = await this.roleManager.updateRole(args.roleId, { isActive: false });

        return {
            success: true,
            role: updatedRole,
            message: `Role '${args.roleId}' deactivated successfully`
        };
    }

    private async handleGetUserRoles(args: any, context: ToolContext): Promise<any> {
        if (!args.userId) {
            throw new Error('User ID is required for get_user_roles operation');
        }

        const userRoles = await this.roleManager.getUserRoles(args.userId, args.includeInactive);
        const effectiveRoles = await this.roleManager.getEffectiveRoles(args.userId);

        return {
            success: true,
            userId: args.userId,
            assignedRoles: userRoles,
            effectiveRoles,
            includeInactive: args.includeInactive
        };
    }

    private async handleGetRoleHierarchy(args: any, context: ToolContext): Promise<any> {
        if (!args.roleId) {
            throw new Error('Role ID is required for get_role_hierarchy operation');
        }

        const hierarchy = await this.roleManager.getRoleHierarchy(args.roleId);

        return {
            success: true,
            roleId: args.roleId,
            hierarchy
        };
    }

    // Permission Management Handlers
    private async handleCreatePermissionRule(args: any, context: ToolContext): Promise<any> {
        if (!args.permissionRule) {
            throw new Error('Permission rule data is required for create_permission_rule operation');
        }

        const rule = await this.permissionManager.createPermissionRule(args.permissionRule);

        return {
            success: true,
            rule,
            message: `Permission rule '${rule.name}' created successfully`
        };
    }

    private async handleUpdatePermissionRule(args: any, context: ToolContext): Promise<any> {
        if (!args.permissionRuleId) {
            throw new Error('Permission rule ID is required for update_permission_rule operation');
        }

        if (!args.permissionRule) {
            throw new Error('Permission rule data is required for update_permission_rule operation');
        }

        const updatedRule = await this.permissionManager.updatePermissionRule(
            args.permissionRuleId,
            args.permissionRule
        );

        return {
            success: true,
            rule: updatedRule,
            message: `Permission rule '${args.permissionRuleId}' updated successfully`
        };
    }

    private async handleDeletePermissionRule(args: any, context: ToolContext): Promise<any> {
        if (!args.permissionRuleId) {
            throw new Error('Permission rule ID is required for delete_permission_rule operation');
        }

        await this.permissionManager.deletePermissionRule(args.permissionRuleId);

        return {
            success: true,
            message: `Permission rule '${args.permissionRuleId}' deleted successfully`
        };
    }

    private async handleListPermissionRules(args: any, context: ToolContext): Promise<any> {
        const rules = await this.permissionManager.getAllPermissionRules(args.includeInactive);

        return {
            success: true,
            rules,
            count: rules.length,
            includeInactive: args.includeInactive
        };
    }

    private async handleGetPermissionRule(args: any, context: ToolContext): Promise<any> {
        if (!args.permissionRuleId) {
            throw new Error('Permission rule ID is required for get_permission_rule operation');
        }

        const rule = await this.permissionManager.getPermissionRule(args.permissionRuleId);
        if (!rule) {
            throw new Error(`Permission rule '${args.permissionRuleId}' not found`);
        }

        return {
            success: true,
            rule,
            includeMetadata: args.includeMetadata
        };
    }

    private async handleEvaluateAccess(args: any, context: ToolContext): Promise<any> {
        if (!args.accessEvaluation) {
            throw new Error('Access evaluation data is required for evaluate_access operation');
        }

        const evaluation = args.accessEvaluation;
        const result = await this.permissionManager.evaluatePermission(
            evaluation.userId,
            evaluation.resource,
            evaluation.action,
            evaluation.context
        );

        let auditTrail;
        if (evaluation.includeAuditTrail) {
            // Get recent audit logs for this evaluation
            auditTrail = await this.auditLogger.queryEvents({
                userId: evaluation.userId,
                resourceType: 'permission',
                action: 'evaluate',
                limit: 10,
                sortBy: 'timestamp',
                sortOrder: 'desc'
            });
        }

        return {
            success: true,
            evaluation: {
                userId: evaluation.userId,
                resource: evaluation.resource,
                action: evaluation.action,
                context: evaluation.context
            },
            result,
            auditTrail: evaluation.includeAuditTrail ? auditTrail : undefined
        };
    }

    private async handleTestUserAccess(args: any, context: ToolContext): Promise<any> {
        if (!args.userId || !args.resourceType || !args.action) {
            throw new Error('User ID, resource type, and action are required for test_user_access operation');
        }

        // Get user roles and permissions
        const userRoles = await this.roleManager.getUserRoles(args.userId);
        const userPermissions = await this.permissionManager.getUserPermissions(args.userId);

        // Test access for the specific resource type and action
        const testResult = await this.permissionManager.evaluatePermission(
            args.userId,
            args.resourceType,
            args.action,
            args.context || {}
        );

        return {
            success: true,
            userId: args.userId,
            resourceType: args.resourceType,
            action: args.action,
            accessGranted: testResult.allowed,
            reason: testResult.reason,
            userRoles,
            userPermissions,
            appliedRules: testResult.appliedRules || []
        };
    }

    private async handleGetUserPermissions(args: any, context: ToolContext): Promise<any> {
        if (!args.userId) {
            throw new Error('User ID is required for get_user_permissions operation');
        }

        const permissions = await this.permissionManager.getUserPermissions(args.userId);

        return {
            success: true,
            userId: args.userId,
            permissions,
            count: permissions.length
        };
    }

    private async handleGetResourcePermissions(args: any, context: ToolContext): Promise<any> {
        if (!args.resourceType) {
            throw new Error('Resource type is required for get_resource_permissions operation');
        }

        const permissions = await this.permissionManager.getResourcePermissions(args.resourceType);

        return {
            success: true,
            resourceType: args.resourceType,
            permissions,
            count: permissions.length
        };
    }

    // Policy Management Handlers
    private async handleCreatePolicy(args: any, context: ToolContext): Promise<any> {
        if (!args.policyData) {
            throw new Error('Policy data is required for create_policy operation');
        }

        const policy = await this.policyEngine.createPolicy(args.policyData);

        return {
            success: true,
            policy,
            message: `Policy '${policy.name}' created successfully`
        };
    }

    private async handleUpdatePolicy(args: any, context: ToolContext): Promise<any> {
        if (!args.policyId || !args.policyData) {
            throw new Error('Policy ID and policy data are required for update_policy operation');
        }

        const updatedPolicy = await this.policyEngine.updatePolicy(args.policyId, args.policyData);

        return {
            success: true,
            policy: updatedPolicy,
            message: `Policy '${args.policyId}' updated successfully`
        };
    }

    private async handleDeletePolicy(args: any, context: ToolContext): Promise<any> {
        if (!args.policyId) {
            throw new Error('Policy ID is required for delete_policy operation');
        }

        await this.policyEngine.deletePolicy(args.policyId);

        return {
            success: true,
            message: `Policy '${args.policyId}' deleted successfully`
        };
    }

    private async handleListPolicies(args: any, context: ToolContext): Promise<any> {
        const policies = await this.policyEngine.listPolicies(args.includeInactive);

        return {
            success: true,
            policies,
            count: policies.length,
            includeInactive: args.includeInactive
        };
    }

    private async handleGetPolicy(args: any, context: ToolContext): Promise<any> {
        if (!args.policyId) {
            throw new Error('Policy ID is required for get_policy operation');
        }

        const policy = await this.policyEngine.getPolicy(args.policyId);
        if (!policy) {
            throw new Error(`Policy '${args.policyId}' not found`);
        }

        return {
            success: true,
            policy,
            includeMetadata: args.includeMetadata
        };
    }

    private async handleEvaluatePolicy(args: any, context: ToolContext): Promise<any> {
        if (!args.policyEvaluation) {
            throw new Error('Policy evaluation data is required for evaluate_policy operation');
        }

        const evaluation = args.policyEvaluation;
        const result = await this.policyEngine.evaluatePolicy(
            evaluation.policyId,
            {
                principal: evaluation.principal,
                resource: evaluation.resource,
                action: evaluation.action,
                ...evaluation.context
            }
        );

        return {
            success: true,
            policyId: evaluation.policyId,
            evaluation: {
                principal: evaluation.principal,
                resource: evaluation.resource,
                action: evaluation.action,
                context: evaluation.context
            },
            result,
            includeDebugInfo: evaluation.includeDebugInfo
        };
    }

    private async handleTestPolicyDecision(args: any, context: ToolContext): Promise<any> {
        if (!args.policyEvaluation) {
            throw new Error('Policy evaluation data is required for test_policy_decision operation');
        }

        const evaluation = args.policyEvaluation;

        // Test the policy decision
        const decision = await this.policyEngine.evaluatePolicy(
            evaluation.policyId,
            {
                principal: evaluation.principal,
                resource: evaluation.resource,
                action: evaluation.action,
                ...evaluation.context
            }
        );

        // Get policy details if debug info is requested
        let policyDetails;
        if (evaluation.includeDebugInfo) {
            policyDetails = await this.policyEngine.getPolicy(evaluation.policyId);
        }

        return {
            success: true,
            policyId: evaluation.policyId,
            testScenario: {
                principal: evaluation.principal,
                resource: evaluation.resource,
                action: evaluation.action,
                context: evaluation.context
            },
            decision,
            policyDetails: evaluation.includeDebugInfo ? policyDetails : undefined
        };
    }

    private async handleActivatePolicy(args: any, context: ToolContext): Promise<any> {
        if (!args.policyId) {
            throw new Error('Policy ID is required for activate_policy operation');
        }

        const updatedPolicy = await this.policyEngine.updatePolicy(args.policyId, { isActive: true });

        return {
            success: true,
            policy: updatedPolicy,
            message: `Policy '${args.policyId}' activated successfully`
        };
    }

    private async handleDeactivatePolicy(args: any, context: ToolContext): Promise<any> {
        if (!args.policyId) {
            throw new Error('Policy ID is required for deactivate_policy operation');
        }

        const updatedPolicy = await this.policyEngine.updatePolicy(args.policyId, { isActive: false });

        return {
            success: true,
            policy: updatedPolicy,
            message: `Policy '${args.policyId}' deactivated successfully`
        };
    }

    // Security Audit Handlers
    private async handleGetAuditLogs(args: any, context: ToolContext): Promise<any> {
        const query = args.auditQuery || {};

        const logs = await this.auditLogger.queryEvents({
            startDate: query.startDate ? new Date(query.startDate) : undefined,
            endDate: query.endDate ? new Date(query.endDate) : undefined,
            eventType: query.eventType,
            userId: query.userId,
            resourceType: query.resourceType,
            severity: query.severity,
            limit: query.limit,
            offset: query.offset,
            sortBy: 'timestamp',
            sortOrder: 'desc'
        });

        return {
            success: true,
            logs,
            query,
            count: logs.length
        };
    }

    private async handleGetSecurityMetrics(args: any, context: ToolContext): Promise<any> {
        const query = args.auditQuery || {};

        const metrics = await this.auditLogger.getSecurityMetrics({
            startDate: query.startDate ? new Date(query.startDate) : undefined,
            endDate: query.endDate ? new Date(query.endDate) : undefined,
            groupBy: 'hour'
        });

        return {
            success: true,
            metrics,
            query,
            generatedAt: new Date()
        };
    }

    private async handleGetAccessSummary(args: any, context: ToolContext): Promise<any> {
        const userId = args.userId;

        if (!userId) {
            throw new Error('User ID is required for get_access_summary operation');
        }

        // Get user roles, permissions, and recent access activity
        const userRoles = await this.roleManager.getUserRoles(userId);
        const userPermissions = await this.permissionManager.getUserPermissions(userId);

        const recentActivity = await this.auditLogger.queryEvents({
            userId,
            eventType: 'access_attempt',
            limit: 50,
            sortBy: 'timestamp',
            sortOrder: 'desc'
        });

        return {
            success: true,
            userId,
            summary: {
                rolesCount: userRoles.length,
                permissionsCount: userPermissions.length,
                recentActivityCount: recentActivity.length
            },
            roles: userRoles,
            permissions: userPermissions,
            recentActivity
        };
    }

    private async handleExportAuditReport(args: any, context: ToolContext): Promise<any> {
        const query = args.auditQuery || {};

        const logs = await this.auditLogger.queryEvents({
            startDate: query.startDate ? new Date(query.startDate) : undefined,
            endDate: query.endDate ? new Date(query.endDate) : undefined,
            eventType: query.eventType,
            userId: query.userId,
            resourceType: query.resourceType,
            severity: query.severity,
            limit: query.limit || 10000,
            offset: query.offset,
            sortBy: 'timestamp',
            sortOrder: 'desc'
        });

        // Format based on requested format
        let formattedData;
        switch (args.format) {
            case 'csv':
                formattedData = this.formatLogsAsCsv(logs);
                break;
            case 'table':
                formattedData = this.formatLogsAsTable(logs);
                break;
            case 'summary':
                formattedData = this.formatLogsAsSummary(logs);
                break;
            default:
                formattedData = logs;
        }

        return {
            success: true,
            format: args.format,
            data: formattedData,
            exportedAt: new Date(),
            recordCount: logs.length,
            query
        };
    }

    private async handleGetPolicyCompliance(args: any, context: ToolContext): Promise<any> {
        // Get all active policies
        const policies = await this.policyEngine.listPolicies(false);

        // Analyze policy compliance
        const compliance = {
            totalPolicies: policies.length,
            activePolicies: policies.filter(p => p.isActive).length,
            inactivePolicies: policies.filter(p => !p.isActive).length,
            policiesWithConditions: policies.filter(p =>
                p.statements.some(s => s.conditions)
            ).length,
            systemPolicies: policies.filter(p =>
                p.metadata?.system === true
            ).length,
            customPolicies: policies.filter(p =>
                p.metadata?.system !== true
            ).length
        };

        return {
            success: true,
            compliance,
            policies: args.includeMetadata ? policies : undefined,
            analyzedAt: new Date()
        };
    }

    private async handleAnalyzeSecurityTrends(args: any, context: ToolContext): Promise<any> {
        const query = args.auditQuery || {};

        // Get security events for trend analysis
        const events = await this.auditLogger.queryEvents({
            startDate: query.startDate ? new Date(query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            endDate: query.endDate ? new Date(query.endDate) : new Date(),
            limit: 10000,
            sortBy: 'timestamp',
            sortOrder: 'asc'
        });

        // Analyze trends
        const trends = this.analyzeSecurityTrends(events);

        return {
            success: true,
            trends,
            analysisQuery: query,
            eventCount: events.length,
            analyzedAt: new Date()
        };
    }

    // System Operation Handlers
    private async handleValidateSecurityConfig(args: any, context: ToolContext): Promise<any> {
        const validation = {
            roleManagerStatus: 'healthy',
            permissionManagerStatus: 'healthy',
            policyEngineStatus: 'healthy',
            auditLoggerStatus: 'healthy',
            configurationValid: true,
            issues: [] as string[],
            warnings: [] as string[]
        };

        try {
            // Validate role manager
            const roles = await this.roleManager.getAllRoles();
            if (roles.length === 0) {
                validation.warnings.push('No roles defined in the system');
            }

            // Validate permission manager
            const rules = await this.permissionManager.getAllPermissionRules();
            if (rules.length === 0) {
                validation.warnings.push('No permission rules defined in the system');
            }

            // Validate policy engine
            const policies = await this.policyEngine.listPolicies();
            if (policies.length === 0) {
                validation.warnings.push('No policies defined in the system');
            }

            // Check for system conflicts
            const systemRoles = roles.filter(r => r.isSystem);
            if (systemRoles.length === 0) {
                validation.warnings.push('No system roles defined');
            }

        } catch (error) {
            validation.configurationValid = false;
            validation.issues.push(`Configuration validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        return {
            success: true,
            validation,
            validatedAt: new Date()
        };
    }

    private async handleGetSystemStatus(args: any, context: ToolContext): Promise<any> {
        const status = {
            roleManager: {
                initialized: true,
                totalRoles: 0,
                activeRoles: 0,
                userAssignments: 0
            },
            permissionManager: {
                initialized: true,
                totalRules: 0,
                activeRules: 0
            },
            policyEngine: {
                initialized: true,
                totalPolicies: 0,
                activePolicies: 0
            },
            auditLogger: {
                initialized: true,
                recentEvents: 0
            },
            system: {
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                nodeVersion: process.version
            }
        };

        try {
            // Get role statistics
            const roles = await this.roleManager.getAllRoles();
            status.roleManager.totalRoles = roles.length;
            status.roleManager.activeRoles = roles.filter(r => r.isActive).length;

            // Get permission statistics
            const rules = await this.permissionManager.getAllPermissionRules();
            status.permissionManager.totalRules = rules.length;
            status.permissionManager.activeRules = rules.filter(r => r.isActive).length;

            // Get policy statistics
            const policies = await this.policyEngine.listPolicies();
            status.policyEngine.totalPolicies = policies.length;
            status.policyEngine.activePolicies = policies.filter(p => p.isActive).length;

            // Get recent audit events count
            const recentEvents = await this.auditLogger.queryEvents({
                startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
                limit: 1000
            });
            status.auditLogger.recentEvents = recentEvents.length;

        } catch (error) {
            // Status retrieval error - log but continue
            console.warn('Error retrieving system status:', error);
        }

        return {
            success: true,
            status,
            timestamp: new Date()
        };
    }

    private async handlePerformSecurityCheck(args: any, context: ToolContext): Promise<any> {
        const securityCheck = {
            overallScore: 0,
            checks: [] as any[],
            recommendations: [] as string[],
            criticalIssues: [] as string[],
            warnings: [] as string[]
        };

        try {
            // Check 1: Role configuration
            const roles = await this.roleManager.getAllRoles();
            const roleCheck = {
                name: 'Role Configuration',
                passed: true,
                score: 0,
                details: {}
            };

            if (roles.length === 0) {
                roleCheck.passed = false;
                securityCheck.criticalIssues.push('No roles defined in the system');
            } else {
                roleCheck.score += 25;

                const systemRoles = roles.filter(r => r.isSystem);
                if (systemRoles.length === 0) {
                    securityCheck.warnings.push('No system roles defined');
                } else {
                    roleCheck.score += 25;
                }

                const activeRoles = roles.filter(r => r.isActive);
                if (activeRoles.length > 0) {
                    roleCheck.score += 25;
                }

                // Check for role hierarchy
                const rolesWithParents = roles.filter(r => r.parentRoles && r.parentRoles.length > 0);
                if (rolesWithParents.length > 0) {
                    roleCheck.score += 25;
                } else {
                    securityCheck.recommendations.push('Consider implementing role hierarchy for better permission management');
                }
            }

            roleCheck.details = {
                totalRoles: roles.length,
                activeRoles: roles.filter(r => r.isActive).length,
                systemRoles: roles.filter(r => r.isSystem).length,
                rolesWithHierarchy: roles.filter(r => r.parentRoles && r.parentRoles.length > 0).length
            };

            securityCheck.checks.push(roleCheck);

            // Check 2: Permission rules
            const rules = await this.permissionManager.getAllPermissionRules();
            const permissionCheck = {
                name: 'Permission Rules',
                passed: true,
                score: 0,
                details: {}
            };

            if (rules.length === 0) {
                permissionCheck.passed = false;
                securityCheck.criticalIssues.push('No permission rules defined in the system');
            } else {
                permissionCheck.score += 30;

                const denyRules = rules.filter(r => r.effect === 'deny');
                if (denyRules.length > 0) {
                    permissionCheck.score += 35;
                } else {
                    securityCheck.recommendations.push('Consider adding explicit deny rules for better security');
                }

                const rulesWithConditions = rules.filter(r => r.conditions && r.conditions.length > 0);
                if (rulesWithConditions.length > 0) {
                    permissionCheck.score += 35;
                } else {
                    securityCheck.recommendations.push('Consider adding conditional rules for context-aware access control');
                }
            }

            permissionCheck.details = {
                totalRules: rules.length,
                allowRules: rules.filter(r => r.effect === 'allow').length,
                denyRules: rules.filter(r => r.effect === 'deny').length,
                conditionalRules: rules.filter(r => r.conditions && r.conditions.length > 0).length
            };

            securityCheck.checks.push(permissionCheck);

            // Check 3: Policy configuration
            const policies = await this.policyEngine.listPolicies();
            const policyCheck = {
                name: 'Policy Configuration',
                passed: true,
                score: 0,
                details: {}
            };

            if (policies.length === 0) {
                policyCheck.passed = false;
                securityCheck.criticalIssues.push('No policies defined in the system');
            } else {
                policyCheck.score += 40;

                const activePolicies = policies.filter(p => p.isActive);
                if (activePolicies.length > 0) {
                    policyCheck.score += 30;
                }

                const policiesWithConditions = policies.filter(p =>
                    p.statements.some(s => s.conditions)
                );
                if (policiesWithConditions.length > 0) {
                    policyCheck.score += 30;
                } else {
                    securityCheck.recommendations.push('Consider adding conditional statements to policies for fine-grained control');
                }
            }

            policyCheck.details = {
                totalPolicies: policies.length,
                activePolicies: policies.filter(p => p.isActive).length,
                systemPolicies: policies.filter(p => p.metadata?.system === true).length,
                policiesWithConditions: policies.filter(p =>
                    p.statements.some(s => s.conditions)
                ).length
            };

            securityCheck.checks.push(policyCheck);

            // Calculate overall score
            const totalScore = securityCheck.checks.reduce((sum, check) => sum + check.score, 0);
            const maxScore = securityCheck.checks.length * 100;
            securityCheck.overallScore = Math.round((totalScore / maxScore) * 100);

            // Additional recommendations based on score
            if (securityCheck.overallScore < 50) {
                securityCheck.recommendations.push('Security configuration needs significant improvement');
            } else if (securityCheck.overallScore < 80) {
                securityCheck.recommendations.push('Security configuration is adequate but could be enhanced');
            } else {
                securityCheck.recommendations.push('Security configuration is well-implemented');
            }

        } catch (error) {
            securityCheck.criticalIssues.push(`Security check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        return {
            success: true,
            securityCheck,
            checkedAt: new Date()
        };
    }

    // Helper Methods
    private formatLogsAsCsv(logs: any[]): string {
        if (logs.length === 0) return '';

        const headers = Object.keys(logs[0]).join(',');
        const rows = logs.map(log =>
            Object.values(log).map(value =>
                typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
            ).join(',')
        );

        return [headers, ...rows].join('\n');
    }

    private formatLogsAsTable(logs: any[]): any {
        if (logs.length === 0) return { headers: [], rows: [] };

        const headers = Object.keys(logs[0]);
        const rows = logs.map(log => Object.values(log));

        return { headers, rows };
    }

    private formatLogsAsSummary(logs: any[]): any {
        const summary = {
            totalEvents: logs.length,
            eventTypes: {} as Record<string, number>,
            severities: {} as Record<string, number>,
            users: {} as Record<string, number>,
            timeRange: {
                earliest: null as Date | null,
                latest: null as Date | null
            }
        };

        logs.forEach(log => {
            // Count event types
            if (log.eventType) {
                summary.eventTypes[log.eventType] = (summary.eventTypes[log.eventType] || 0) + 1;
            }

            // Count severities
            if (log.severity) {
                summary.severities[log.severity] = (summary.severities[log.severity] || 0) + 1;
            }

            // Count users
            if (log.userId) {
                summary.users[log.userId] = (summary.users[log.userId] || 0) + 1;
            }

            // Track time range
            if (log.timestamp) {
                const timestamp = new Date(log.timestamp);
                if (!summary.timeRange.earliest || timestamp < summary.timeRange.earliest) {
                    summary.timeRange.earliest = timestamp;
                }
                if (!summary.timeRange.latest || timestamp > summary.timeRange.latest) {
                    summary.timeRange.latest = timestamp;
                }
            }
        });

        return summary;
    }

    private analyzeSecurityTrends(events: any[]): any {
        const trends = {
            dailyEventCounts: {} as Record<string, number>,
            eventTypeDistribution: {} as Record<string, number>,
            severityTrends: {} as Record<string, number>,
            topUsers: [] as { userId: string; eventCount: number }[],
            anomalies: [] as string[]
        };

        // Group events by day
        events.forEach(event => {
            const date = new Date(event.timestamp).toISOString().split('T')[0];
            trends.dailyEventCounts[date] = (trends.dailyEventCounts[date] || 0) + 1;

            if (event.eventType) {
                trends.eventTypeDistribution[event.eventType] = (trends.eventTypeDistribution[event.eventType] || 0) + 1;
            }

            if (event.severity) {
                trends.severityTrends[event.severity] = (trends.severityTrends[event.severity] || 0) + 1;
            }
        });

        // Find top users
        const userCounts = {} as Record<string, number>;
        events.forEach(event => {
            if (event.userId) {
                userCounts[event.userId] = (userCounts[event.userId] || 0) + 1;
            }
        });

        trends.topUsers = Object.entries(userCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([userId, eventCount]) => ({ userId, eventCount }));

        // Detect anomalies
        const dailyCounts = Object.values(trends.dailyEventCounts);
        if (dailyCounts.length > 0) {
            const avgDaily = dailyCounts.reduce((sum, count) => sum + count, 0) / dailyCounts.length;
            const threshold = avgDaily * 2; // Anomaly if 2x average

            Object.entries(trends.dailyEventCounts).forEach(([date, count]) => {
                if (count > threshold) {
                    trends.anomalies.push(`High activity detected on ${date}: ${count} events (${Math.round(count / avgDaily * 100)}% of average)`);
                }
            });
        }

        // Check for high severity events
        const criticalEvents = trends.severityTrends['critical'] || 0;
        if (criticalEvents > 0) {
            trends.anomalies.push(`${criticalEvents} critical security events detected`);
        }

        return trends;
    }
}

/**
 * Export the RBAC Management Tool
 */
export const rbacManagementTool = new RBACManagementTool(
    // These will be injected during server initialization
    {} as any, // roleManager
    {} as any, // permissionManager  
    {} as any, // policyEngine
    {} as any  // auditLogger
);