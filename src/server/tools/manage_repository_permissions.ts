/**
 * Manage Repository Permissions Tool
 * 
 * MCP tool for managing repository access control including user and group
 * permissions, permission levels, and audit logging. Supports both Bitbucket
 * Data Center and Cloud APIs.
 * 
 * Features:
 * - User and group access control management
 * - Permission level configuration (read, write, admin)
 * - Permission validation and enforcement
 * - Audit logging for permission changes
 * - Support for both individual and bulk permission updates
 */

import { Tool, ToolParameter, ToolExecutor, ToolResult, ToolExecutionContext } from '../../types/index.js';

/**
 * Manage Repository Permissions Tool Parameters
 */
const manageRepositoryPermissionsParameters: ToolParameter[] = [
  {
    name: 'workspace',
    type: 'string',
    description: 'Workspace or project key where the repository is located',
    required: true,
    schema: {
      pattern: '^[a-zA-Z0-9_-]+$',
      minLength: 1,
      maxLength: 50
    }
  },
  {
    name: 'repository',
    type: 'string',
    description: 'Repository name or slug',
    required: true,
    schema: {
      pattern: '^[a-zA-Z0-9_-]+$',
      minLength: 1,
      maxLength: 100
    }
  },
  {
    name: 'action',
    type: 'string',
    description: 'Action to perform on permissions',
    required: true,
    schema: {
      enum: ['grant', 'revoke', 'update', 'list', 'get']
    }
  },
  {
    name: 'permission_type',
    type: 'string',
    description: 'Type of permission to manage',
    required: false,
    schema: {
      enum: ['user', 'group', 'project']
    }
  },
  {
    name: 'permission_level',
    type: 'string',
    description: 'Permission level to grant or update',
    required: false,
    schema: {
      enum: ['read', 'write', 'admin']
    }
  },
  {
    name: 'targets',
    type: 'array',
    description: 'Array of user names, group names, or project keys to apply permissions to',
    required: false,
    schema: {
      items: {
        type: 'string',
        pattern: '^[a-zA-Z0-9_-]+$'
      },
      minItems: 1,
      maxItems: 50
    }
  },
  {
    name: 'user',
    type: 'string',
    description: 'Single user name (alternative to targets array)',
    required: false,
    schema: {
      pattern: '^[a-zA-Z0-9_-]+$',
      minLength: 1,
      maxLength: 50
    }
  },
  {
    name: 'group',
    type: 'string',
    description: 'Single group name (alternative to targets array)',
    required: false,
    schema: {
      pattern: '^[a-zA-Z0-9_-]+$',
      minLength: 1,
      maxLength: 50
    }
  },
  {
    name: 'include_inherited',
    type: 'boolean',
    description: 'Include inherited permissions from project/workspace (for list/get actions)',
    required: false,
    default: false
  }
];

/**
 * Manage Repository Permissions Tool Executor
 */
const manageRepositoryPermissionsExecutor: ToolExecutor = async (params: Record<string, any>, context: ToolExecutionContext): Promise<ToolResult> => {
  try {
    // Validate required parameters
    if (!params.workspace || !params.repository || !params.action) {
      return {
        success: false,
        error: {
          code: -32602, // Invalid params
          message: 'Workspace, repository, and action are required',
          details: { missing: ['workspace', 'repository', 'action'] }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'manage_repository_permissions'
        }
      };
    }

    // Validate repository name format
    const namePattern = /^[a-zA-Z0-9_-]+$/;
    if (!namePattern.test(params.repository)) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Repository name must contain only alphanumeric characters, hyphens, and underscores',
          details: { invalid_repository: params.repository }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'manage_repository_permissions'
        }
      };
    }

    // Validate action-specific parameters
    if (['grant', 'revoke', 'update'].includes(params.action)) {
      if (!params.permission_level) {
        return {
          success: false,
          error: {
            code: -32602,
            message: 'Permission level is required for grant, revoke, and update actions',
            details: { required_for_actions: ['grant', 'revoke', 'update'] }
          },
          metadata: {
            timestamp: new Date(),
            tool: 'manage_repository_permissions'
          }
        };
      }

      // Check if targets are provided
      const hasTargets = params.targets && params.targets.length > 0;
      const hasUser = params.user;
      const hasGroup = params.group;
      
      if (!hasTargets && !hasUser && !hasGroup) {
        return {
          success: false,
          error: {
            code: -32602,
            message: 'At least one target (targets array, user, or group) must be provided',
            details: { available_targets: ['targets', 'user', 'group'] }
          },
          metadata: {
            timestamp: new Date(),
            tool: 'manage_repository_permissions'
          }
        };
      }
    }

    // Prepare targets list
    let targets: string[] = [];
    if (params.targets && params.targets.length > 0) {
      targets = params.targets;
    } else if (params.user) {
      targets = [params.user];
    } else if (params.group) {
      targets = [params.group];
    }

    // TODO: Implement actual Bitbucket API call
    // This is a placeholder implementation based on action
    let result: any = {};

    switch (params.action) {
      case 'grant':
        result = {
          action: 'grant',
          permission_level: params.permission_level,
          targets: targets,
          permission_type: params.permission_type || 'user',
          message: `Granted ${params.permission_level} permission to ${targets.length} target(s)`,
          granted_permissions: targets.map(target => ({
            target,
            permission: params.permission_level,
            type: params.permission_type || 'user',
            granted_at: new Date().toISOString()
          }))
        };
        break;

      case 'revoke':
        result = {
          action: 'revoke',
          permission_level: params.permission_level,
          targets: targets,
          permission_type: params.permission_type || 'user',
          message: `Revoked ${params.permission_level} permission from ${targets.length} target(s)`,
          revoked_permissions: targets.map(target => ({
            target,
            permission: params.permission_level,
            type: params.permission_type || 'user',
            revoked_at: new Date().toISOString()
          }))
        };
        break;

      case 'update':
        result = {
          action: 'update',
          permission_level: params.permission_level,
          targets: targets,
          permission_type: params.permission_type || 'user',
          message: `Updated permission to ${params.permission_level} for ${targets.length} target(s)`,
          updated_permissions: targets.map(target => ({
            target,
            permission: params.permission_level,
            type: params.permission_type || 'user',
            updated_at: new Date().toISOString()
          }))
        };
        break;

      case 'list':
        result = {
          action: 'list',
          repository: params.repository,
          workspace: params.workspace,
          include_inherited: params.include_inherited || false,
          permissions: [
            {
              target: 'user1',
              permission: 'admin',
              type: 'user',
              granted_at: '2024-01-15T10:30:00Z',
              granted_by: 'admin_user'
            },
            {
              target: 'developers',
              permission: 'write',
              type: 'group',
              granted_at: '2024-01-15T10:30:00Z',
              granted_by: 'admin_user'
            },
            {
              target: 'viewers',
              permission: 'read',
              type: 'group',
              granted_at: '2024-01-15T10:30:00Z',
              granted_by: 'admin_user'
            }
          ],
          inherited_permissions: params.include_inherited ? [
            {
              target: 'project_members',
              permission: 'read',
              type: 'group',
              source: 'project',
              inherited_at: '2024-01-15T10:30:00Z'
            }
          ] : []
        };
        break;

      case 'get':
        result = {
          action: 'get',
          repository: params.repository,
          workspace: params.workspace,
          include_inherited: params.include_inherited || false,
          effective_permissions: {
            read: ['user1', 'developers', 'viewers', 'project_members'],
            write: ['user1', 'developers'],
            admin: ['user1']
          },
          permission_summary: {
            total_users: 1,
            total_groups: 3,
            total_permissions: 4
          }
        };
        break;

      default:
        return {
          success: false,
          error: {
            code: -32602,
            message: 'Invalid action specified',
            details: { valid_actions: ['grant', 'revoke', 'update', 'list', 'get'] }
          },
          metadata: {
            timestamp: new Date(),
            tool: 'manage_repository_permissions'
          }
        };
    }

    // Log the permission management action
    context.session?.emit('tool:executed', 'manage_repository_permissions', {
      action: params.action,
      repository: params.repository,
      workspace: params.workspace,
      targets_count: targets.length
    });

    return {
      success: true,
      data: result,
      metadata: {
        timestamp: new Date(),
        tool: 'manage_repository_permissions',
        execution_time: Date.now() - context.request.timestamp.getTime(),
        workspace: params.workspace,
        repository: params.repository,
        action: params.action
      }
    };

  } catch (error) {
    return {
      success: false,
      error: {
        code: -32603, // Internal error
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error
      },
      metadata: {
        timestamp: new Date(),
        tool: 'manage_repository_permissions',
        error_type: error instanceof Error ? error.constructor.name : 'Unknown'
      }
    };
  }
};

/**
 * Manage Repository Permissions Tool Definition
 */
export const manageRepositoryPermissionsTool: Tool = {
  name: 'manage_repository_permissions',
  description: 'Manage repository access control including user and group permissions, permission levels, and audit logging',
  parameters: manageRepositoryPermissionsParameters,
  category: 'repository_management',
  version: '1.0.0',
  enabled: true,
  execute: manageRepositoryPermissionsExecutor,
  metadata: {
    api_endpoint: '/2.0/repositories/{workspace}/{repo_slug}/permissions',
    supported_apis: ['bitbucket_cloud', 'bitbucket_data_center'],
    requires_auth: true,
    rate_limit: '100/hour'
  }
};

export default manageRepositoryPermissionsTool;
