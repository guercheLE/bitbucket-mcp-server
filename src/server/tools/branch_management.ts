/**
 * Branch Management Tool
 * 
 * MCP tool for managing repository branches including listing, creation,
 * deletion, and branch protection rules. Supports both Bitbucket Data Center
 * and Cloud APIs.
 * 
 * Features:
 * - Branch listing with filtering and sorting
 * - Default branch management
 * - Branch protection rule configuration
 * - Branch creation and deletion operations
 * - Branch comparison and merge capabilities
 */

import { MCPErrorCode, Tool, ToolExecutionContext, ToolExecutor, ToolParameter, ToolResult } from '../../types/index.js';

/**
 * Branch Management Tool Parameters
 */
const branchManagementParameters: ToolParameter[] = [
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
    description: 'Branch management action to perform',
    required: true,
    schema: {
      enum: ['list', 'create', 'delete', 'set_default', 'get_protection', 'set_protection', 'compare']
    }
  },
  {
    name: 'branch_name',
    type: 'string',
    description: 'Branch name (required for create, delete, set_default, get_protection, set_protection actions)',
    required: false,
    schema: {
      pattern: '^[a-zA-Z0-9/_-]+$',
      minLength: 1,
      maxLength: 100
    }
  },
  {
    name: 'source_branch',
    type: 'string',
    description: 'Source branch for new branch creation (default: main)',
    required: false,
    default: 'main',
    schema: {
      pattern: '^[a-zA-Z0-9/_-]+$',
      minLength: 1,
      maxLength: 100
    }
  },
  {
    name: 'target_branch',
    type: 'string',
    description: 'Target branch for comparison (required for compare action)',
    required: false,
    schema: {
      pattern: '^[a-zA-Z0-9/_-]+$',
      minLength: 1,
      maxLength: 100
    }
  },
  {
    name: 'protection_rules',
    type: 'object',
    description: 'Branch protection rules (for set_protection action)',
    required: false,
    schema: {
      type: 'object',
      properties: {
        require_approvals: { type: 'number', minimum: 0, maximum: 10 },
        require_status_checks: { type: 'boolean' },
        require_up_to_date: { type: 'boolean' },
        restrict_pushes: { type: 'boolean' },
        restrict_merges: { type: 'boolean' },
        allowed_users: { type: 'array', items: { type: 'string' } },
        allowed_groups: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  {
    name: 'include_merged',
    type: 'boolean',
    description: 'Include merged branches in listing (for list action)',
    required: false,
    default: true
  },
  {
    name: 'sort',
    type: 'string',
    description: 'Sort branches by field (for list action)',
    required: false,
    default: 'name',
    schema: {
      enum: ['name', 'date', 'commits']
    }
  }
];

/**
 * Branch Management Tool Executor
 */
const branchManagementExecutor: ToolExecutor = async (params: Record<string, any>, context: ToolExecutionContext): Promise<ToolResult> => {
  const startTime = Date.now();
  try {
    // Validate required parameters
    if (!params.workspace || !params.repository || !params.action) {
      return {
        success: false,
        error: {
          code: MCPErrorCode.INVALID_PARAMS,
          message: 'Workspace, repository, and action are required',
          details: { missing: ['workspace', 'repository', 'action'] }
        },
        metadata: {
          executionTime: Date.now() - startTime,
          memoryUsed: process.memoryUsage().heapUsed,
          timestamp: new Date()
        }
      };
    }

    // Validate repository name format
    const namePattern = /^[a-zA-Z0-9_-]+$/;
    if (!namePattern.test(params.repository)) {
      return {
        success: false,
        error: {
          code: MCPErrorCode.INVALID_PARAMS,
          message: 'Repository name must contain only alphanumeric characters, hyphens, and underscores',
          details: { invalid_repository: params.repository }
        },
        metadata: {
          executionTime: Date.now() - startTime,
          memoryUsed: process.memoryUsage().heapUsed,
          timestamp: new Date()
        }
      };
    }

    // Validate action-specific parameters
    const branchActions = ['create', 'delete', 'set_default', 'get_protection', 'set_protection'];
    if (branchActions.includes(params.action) && !params.branch_name) {
      return {
        success: false,
        error: {
          code: MCPErrorCode.INVALID_PARAMS,
          message: 'Branch name is required for this action',
          details: { required_for_actions: branchActions }
        },
        metadata: {
          executionTime: Date.now() - startTime,
          memoryUsed: process.memoryUsage().heapUsed,
          timestamp: new Date()
        }
      };
    }

    if (params.action === 'compare' && !params.target_branch) {
      return {
        success: false,
        error: {
          code: MCPErrorCode.INVALID_PARAMS,
          message: 'Target branch is required for compare action',
          details: { required_for_action: 'compare' }
        },
        metadata: {
          executionTime: Date.now() - startTime,
          memoryUsed: process.memoryUsage().heapUsed,
          timestamp: new Date()
        }
      };
    }

    // TODO: Implement actual Bitbucket API call
    // This is a placeholder implementation based on action
    let result: any = {};

    switch (params.action) {
      case 'list':
        result = {
          action: 'list',
          repository: params.repository,
          workspace: params.workspace,
          sort: params.sort || 'name',
          include_merged: params.include_merged !== false,
          branches: [
            {
              name: 'main',
              type: 'branch',
              target: {
                hash: 'abc123def456',
                author: {
                  raw: 'Developer <developer@example.com>'
                },
                date: '2024-09-20T14:45:00Z',
                message: 'Latest commit message'
              },
              links: {
                commits: {
                  href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/commits/main`
                },
                self: {
                  href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/refs/branches/main`
                },
                html: {
                  href: `https://bitbucket.org/${params.workspace}/${params.repository}/branch/main`
                }
              },
              is_default: true,
              is_protected: true
            },
            {
              name: 'develop',
              type: 'branch',
              target: {
                hash: 'def456ghi789',
                author: {
                  raw: 'Developer <developer@example.com>'
                },
                date: '2024-09-19T16:30:00Z',
                message: 'Development branch commit'
              },
              links: {
                commits: {
                  href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/commits/develop`
                },
                self: {
                  href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/refs/branches/develop`
                },
                html: {
                  href: `https://bitbucket.org/${params.workspace}/${params.repository}/branch/develop`
                }
              },
              is_default: false,
              is_protected: false
            },
            {
              name: 'feature/new-feature',
              type: 'branch',
              target: {
                hash: 'ghi789jkl012',
                author: {
                  raw: 'Developer <developer@example.com>'
                },
                date: '2024-09-18T12:15:00Z',
                message: 'New feature implementation'
              },
              links: {
                commits: {
                  href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/commits/feature/new-feature`
                },
                self: {
                  href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/refs/branches/feature/new-feature`
                },
                html: {
                  href: `https://bitbucket.org/${params.workspace}/${params.repository}/branch/feature/new-feature`
                }
              },
              is_default: false,
              is_protected: false
            }
          ],
          total_branches: 3,
          default_branch: 'main'
        };
        break;

      case 'create':
        result = {
          action: 'create',
          repository: params.repository,
          workspace: params.workspace,
          branch_name: params.branch_name,
          source_branch: params.source_branch || 'main',
          created_branch: {
            name: params.branch_name,
            type: 'branch',
            target: {
              hash: 'new123hash456',
              author: {
                raw: 'Current User <user@example.com>'
              },
              date: new Date().toISOString(),
              message: `Created branch '${params.branch_name}' from '${params.source_branch}'`
            },
            links: {
              commits: {
                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/commits/${params.branch_name}`
              },
              self: {
                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/refs/branches/${params.branch_name}`
              },
              html: {
                href: `https://bitbucket.org/${params.workspace}/${params.repository}/branch/${params.branch_name}`
              }
            },
            is_default: false,
            is_protected: false
          },
          message: `Branch '${params.branch_name}' created successfully from '${params.source_branch}'`
        };
        break;

      case 'delete':
        result = {
          action: 'delete',
          repository: params.repository,
          workspace: params.workspace,
          branch_name: params.branch_name,
          deleted_at: new Date().toISOString(),
          message: `Branch '${params.branch_name}' deleted successfully`
        };
        break;

      case 'set_default':
        result = {
          action: 'set_default',
          repository: params.repository,
          workspace: params.workspace,
          branch_name: params.branch_name,
          previous_default: 'main',
          new_default: params.branch_name,
          updated_at: new Date().toISOString(),
          message: `Default branch changed from 'main' to '${params.branch_name}'`
        };
        break;

      case 'get_protection':
        result = {
          action: 'get_protection',
          repository: params.repository,
          workspace: params.workspace,
          branch_name: params.branch_name,
          protection_rules: {
            require_approvals: 2,
            require_status_checks: true,
            require_up_to_date: true,
            restrict_pushes: false,
            restrict_merges: true,
            allowed_users: ['admin_user'],
            allowed_groups: ['senior_developers']
          },
          is_protected: true,
          message: `Protection rules retrieved for branch '${params.branch_name}'`
        };
        break;

      case 'set_protection':
        result = {
          action: 'set_protection',
          repository: params.repository,
          workspace: params.workspace,
          branch_name: params.branch_name,
          protection_rules: params.protection_rules || {},
          updated_at: new Date().toISOString(),
          message: `Protection rules updated for branch '${params.branch_name}'`
        };
        break;

      case 'compare':
        result = {
          action: 'compare',
          repository: params.repository,
          workspace: params.workspace,
          source_branch: params.branch_name || 'main',
          target_branch: params.target_branch,
          comparison: {
            commits_ahead: 5,
            commits_behind: 2,
            files_changed: 12,
            lines_added: 150,
            lines_removed: 45,
            commits: [
              {
                hash: 'abc123def456',
                message: 'Add new feature implementation',
                author: 'Developer <developer@example.com>',
                date: '2024-09-20T14:45:00Z'
              },
              {
                hash: 'def456ghi789',
                message: 'Fix bug in authentication',
                author: 'Developer <developer@example.com>',
                date: '2024-09-19T16:30:00Z'
              }
            ]
          },
          message: `Comparison between '${params.branch_name || 'main'}' and '${params.target_branch}' completed`
        };
        break;

      default:
        return {
          success: false,
          error: {
            code: MCPErrorCode.INVALID_PARAMS,
            message: 'Invalid action specified',
            details: { valid_actions: ['list', 'create', 'delete', 'set_default', 'get_protection', 'set_protection', 'compare'] }
          },
          metadata: {
            executionTime: Date.now() - startTime,
            memoryUsed: process.memoryUsage().heapUsed,
            timestamp: new Date()
          }
        };
    }

    // Log the branch management action
    if (context.session && context.session.emit) {
      context.session.emit('tool:executed', 'branch_management', {
        action: params.action,
        repository: params.repository,
        workspace: params.workspace,
        branch_name: params.branch_name
      });
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
    return {
      success: false,
      error: {
        code: MCPErrorCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error
      },
      metadata: {
        executionTime: Date.now() - startTime,
        memoryUsed: process.memoryUsage().heapUsed,
        timestamp: new Date()
      }
    };
  }
};

/**
 * Branch Management Tool Definition
 */
export const branchManagementTool: Tool = {
  name: 'branch_management',
  description: 'Manage repository branches including listing, creation, deletion, protection rules, and comparison',
  parameters: branchManagementParameters,
  category: 'repository_management',
  version: '1.0.0',
  enabled: true,
  execute: branchManagementExecutor,
  metadata: {
    api_endpoint: '/2.0/repositories/{workspace}/{repo_slug}/refs/branches',
    supported_apis: ['bitbucket_cloud', 'bitbucket_data_center'],
    requires_auth: true,
    rate_limit: '1000/hour'
  }
};

export default branchManagementTool;
