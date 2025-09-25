/**
 * RBAC Management Tool
 * 
 * Provides comprehensive Role-Based Access Control management functionality
 * for the Bitbucket MCP server. This tool integrates with the security framework
 * to offer administrative interfaces for managing roles, permissions, and policies.
 */

import {
    MCPErrorCode,
    Tool,
    ToolExecutionContext,
    ToolParameter,
    ToolResult
} from '../../types/index.js';
import { PermissionManager } from '../security/permission-manager.js';
import { PolicyEngine } from '../security/policy-engine.js';
import { RBACRoleManager } from '../security/rbac-role-manager.js';

/**
 * RBAC Management Tool Implementation
 */
export class RBACManagementTool implements Tool {
    public readonly name = 'rbac_management';
    public readonly description = 'Comprehensive RBAC management for roles, permissions, policies, and security oversight';

    public readonly parameters: ToolParameter[] = [
        {
            name: 'operation',
            description: 'The RBAC management operation to perform',
            required: true,
            type: 'string'
        },
        {
            name: 'roleData',
            description: 'Role data for creation or updates',
            required: false,
            type: 'object'
        },
        {
            name: 'roleId',
            description: 'Role ID for operations on specific roles',
            required: false,
            type: 'string'
        },
        {
            name: 'userId',
            description: 'User ID for user-specific operations',
            required: false,
            type: 'string'
        },
        {
            name: 'permissionRule',
            description: 'Permission rule data for creation or updates',
            required: false,
            type: 'object'
        },
        {
            name: 'policyData',
            description: 'Policy data for creation or updates',
            required: false,
            type: 'object'
        },
        {
            name: 'policyId',
            description: 'Policy ID for policy operations',
            required: false,
            type: 'string'
        },
        {
            name: 'evaluationContext',
            description: 'Context for policy evaluation',
            required: false,
            type: 'object'
        }
    ];

    private roleManager: RBACRoleManager;
    private permissionManager: PermissionManager;
    private policyEngine: PolicyEngine;

    constructor(
        roleManager: RBACRoleManager,
        permissionManager: PermissionManager,
        policyEngine: PolicyEngine
    ) {
        this.roleManager = roleManager;
        this.permissionManager = permissionManager;
        this.policyEngine = policyEngine;
    }

    public async execute(params: Record<string, any>, context: ToolExecutionContext): Promise<ToolResult> {
        const startTime = Date.now();

        try {
            if (!params.operation) {
                throw new Error('Operation parameter is required');
            }

            let result: any;

            switch (params.operation) {
                // Role Management Operations
                case 'create_role':
                    result = await this.handleCreateRole(params);
                    break;
                case 'update_role':
                    result = await this.handleUpdateRole(params);
                    break;
                case 'delete_role':
                    result = await this.handleDeleteRole(params);
                    break;
                case 'get_role':
                    result = await this.handleGetRole(params);
                    break;
                case 'list_roles':
                    result = await this.handleListRoles(params);
                    break;
                case 'assign_role':
                    result = await this.handleAssignRole(params, context);
                    break;
                case 'revoke_role':
                    result = await this.handleRevokeRole(params, context);
                    break;

                // Permission Management Operations
                case 'create_permission_rule':
                    result = await this.handleCreatePermissionRule(params);
                    break;
                case 'update_permission_rule':
                    result = await this.handleUpdatePermissionRule(params);
                    break;
                case 'delete_permission_rule':
                    result = await this.handleDeletePermissionRule(params);
                    break;
                case 'check_permission':
                    result = await this.handleCheckPermission(params);
                    break;

                // Policy Management Operations
                case 'create_policy':
                    result = await this.handleCreatePolicy(params);
                    break;
                case 'update_policy':
                    result = await this.handleUpdatePolicy(params);
                    break;
                case 'delete_policy':
                    result = await this.handleDeletePolicy(params);
                    break;
                case 'get_policy':
                    result = await this.handleGetPolicy(params);
                    break;
                case 'list_policies':
                    result = await this.handleListPolicies(params);
                    break;
                case 'evaluate_policy':
                    result = await this.handleEvaluatePolicy(params);
                    break;

                // System Operations
                case 'get_system_status':
                    result = await this.handleGetSystemStatus(params);
                    break;

                default:
                    throw new Error(`Unknown operation: ${params.operation}`);
            }

            return {
                success: true,
                data: result,
                metadata: {
                    executionTime: Date.now() - startTime,
                    memoryUsed: process.memoryUsage().heapUsed,
                    timestamp: new Date()
                }
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

            return {
                success: false,
                error: {
                    code: MCPErrorCode.TOOL_EXECUTION_FAILED,
                    message: `RBAC management operation failed: ${errorMessage}`
                },
                metadata: {
                    executionTime: Date.now() - startTime,
                    memoryUsed: process.memoryUsage().heapUsed,
                    timestamp: new Date()
                }
            };
        }
    }

    // Role Management Handlers
    private async handleCreateRole(params: any): Promise<any> {
        if (!params.roleData) {
            throw new Error('Role data is required for create_role operation');
        }

        const role = await this.roleManager.createRole(params.roleData);

        return {
            success: true,
            role,
            message: `Role '${role.name}' created successfully with ID: ${role.id}`
        };
    }

    private async handleUpdateRole(params: any): Promise<any> {
        if (!params.roleId || !params.roleData) {
            throw new Error('Role ID and role data are required for update_role operation');
        }

        const updatedRole = await this.roleManager.updateRole(params.roleId, params.roleData);

        return {
            success: true,
            role: updatedRole,
            message: `Role '${updatedRole.name}' updated successfully`
        };
    }

    private async handleDeleteRole(params: any): Promise<any> {
        if (!params.roleId) {
            throw new Error('Role ID is required for delete_role operation');
        }

        await this.roleManager.deleteRole(params.roleId);

        return {
            success: true,
            message: `Role '${params.roleId}' deleted successfully`
        };
    }

    private async handleGetRole(params: any): Promise<any> {
        if (!params.roleId) {
            throw new Error('Role ID is required for get_role operation');
        }

        const role = this.roleManager.getRole(params.roleId);
        if (!role) {
            throw new Error(`Role '${params.roleId}' not found`);
        }

        return {
            success: true,
            role
        };
    }

    private async handleListRoles(params: any): Promise<any> {
        // Get all roles from the internal storage
        const allRoles = Array.from(this.roleManager['roles'].values());

        return {
            success: true,
            roles: allRoles,
            count: allRoles.length
        };
    }

    private async handleAssignRole(params: any, context: ToolExecutionContext): Promise<any> {
        if (!params.userId || !params.roleId) {
            throw new Error('User ID and Role ID are required for assign_role operation');
        }

        const assignment = await this.roleManager.assignRoleToUser(
            params.userId,
            params.roleId,
            context.authentication?.userId || 'system',
            {
                expiresAt: params.expiresAt ? new Date(params.expiresAt) : undefined,
                scope: params.scope || {},
                metadata: params.metadata || {}
            }
        );

        return {
            success: true,
            assignment,
            message: `Role '${params.roleId}' assigned to user '${params.userId}' successfully`
        };
    }

    private async handleRevokeRole(params: any, context: ToolExecutionContext): Promise<any> {
        if (!params.userId || !params.roleId) {
            throw new Error('User ID and Role ID are required for revoke_role operation');
        }

        await this.roleManager.revokeRoleFromUser(
            params.userId,
            params.roleId,
            context.authentication?.userId || 'system'
        );

        return {
            success: true,
            message: `Role '${params.roleId}' revoked from user '${params.userId}' successfully`
        };
    }

    // Permission Management Handlers
    private async handleCreatePermissionRule(params: any): Promise<any> {
        if (!params.permissionRule) {
            throw new Error('Permission rule data is required for create_permission_rule operation');
        }

        const rule = await this.permissionManager.createPermissionRule(params.permissionRule);

        return {
            success: true,
            rule,
            message: `Permission rule '${rule.name}' created successfully with ID: ${rule.id}`
        };
    }

    private async handleUpdatePermissionRule(params: any): Promise<any> {
        if (!params.ruleId || !params.permissionRule) {
            throw new Error('Permission rule ID and data are required for update_permission_rule operation');
        }

        const updatedRule = await this.permissionManager.updatePermissionRule(
            params.ruleId,
            params.permissionRule
        );

        return {
            success: true,
            rule: updatedRule,
            message: `Permission rule '${params.ruleId}' updated successfully`
        };
    }

    private async handleDeletePermissionRule(params: any): Promise<any> {
        if (!params.ruleId) {
            throw new Error('Permission rule ID is required for delete_permission_rule operation');
        }

        await this.permissionManager.deletePermissionRule(params.ruleId);

        return {
            success: true,
            message: `Permission rule '${params.ruleId}' deleted successfully`
        };
    }

    private async handleCheckPermission(params: any): Promise<any> {
        if (!params.userId || !params.resourceId || !params.action) {
            throw new Error('User ID, resource ID, and action are required for check_permission operation');
        }

        const hasPermission = await this.permissionManager.checkPermission(
            params.userId,
            params.resourceId,
            params.action,
            params.context || {}
        );

        return {
            success: true,
            userId: params.userId,
            resourceId: params.resourceId,
            action: params.action,
            hasPermission,
            context: params.context || {}
        };
    }

    // Policy Management Handlers
    private async handleCreatePolicy(params: any): Promise<any> {
        if (!params.policyData) {
            throw new Error('Policy data is required for create_policy operation');
        }

        const policy = await this.policyEngine.createPolicy(params.policyData);

        return {
            success: true,
            policy,
            message: `Policy '${policy.name}' created successfully with ID: ${policy.id}`
        };
    }

    private async handleUpdatePolicy(params: any): Promise<any> {
        if (!params.policyId || !params.policyData) {
            throw new Error('Policy ID and policy data are required for update_policy operation');
        }

        const updatedPolicy = await this.policyEngine.updatePolicy(params.policyId, params.policyData);

        return {
            success: true,
            policy: updatedPolicy,
            message: `Policy '${params.policyId}' updated successfully`
        };
    }

    private async handleDeletePolicy(params: any): Promise<any> {
        if (!params.policyId) {
            throw new Error('Policy ID is required for delete_policy operation');
        }

        await this.policyEngine.deletePolicy(params.policyId);

        return {
            success: true,
            message: `Policy '${params.policyId}' deleted successfully`
        };
    }

    private async handleGetPolicy(params: any): Promise<any> {
        if (!params.policyId) {
            throw new Error('Policy ID is required for get_policy operation');
        }

        const policy = await this.policyEngine.getPolicy(params.policyId);
        if (!policy) {
            throw new Error(`Policy '${params.policyId}' not found`);
        }

        return {
            success: true,
            policy
        };
    }

    private async handleListPolicies(params: any): Promise<any> {
        const policies = await this.policyEngine.listPolicies(params.includeInactive || false);

        return {
            success: true,
            policies,
            count: policies.length,
            includeInactive: params.includeInactive || false
        };
    }

    private async handleEvaluatePolicy(params: any): Promise<any> {
        if (!params.evaluationContext) {
            throw new Error('Evaluation context is required for evaluate_policy operation');
        }

        const result = await this.policyEngine.evaluatePolicy(params.evaluationContext);

        return {
            success: true,
            evaluationContext: params.evaluationContext,
            result
        };
    }

    // System Operations
    private async handleGetSystemStatus(params: any): Promise<any> {
        const status = {
            roleManager: {
                initialized: true,
                totalRoles: this.roleManager['roles']?.size || 0,
                totalPermissions: this.roleManager['permissions']?.size || 0
            },
            permissionManager: {
                initialized: true,
                totalRules: this.permissionManager['permissionRules']?.size || 0
            },
            policyEngine: {
                initialized: true,
                totalPolicies: this.policyEngine['policies']?.size || 0
            },
            system: {
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                nodeVersion: process.version
            }
        };

        return {
            success: true,
            status,
            timestamp: new Date()
        };
    }
}

/**
 * Create and export the RBAC Management Tool instance
 */
export const createRBACManagementTool = (
    roleManager: RBACRoleManager,
    permissionManager: PermissionManager,
    policyEngine: PolicyEngine
): RBACManagementTool => {
    return new RBACManagementTool(
        roleManager,
        permissionManager,
        policyEngine
    );
};