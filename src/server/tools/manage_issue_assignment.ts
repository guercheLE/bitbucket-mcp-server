/**
 * Manage Issue Assignment Tool
 * 
 * MCP tool for managing issue assignments and ownership in Bitbucket repositories.
 * Supports user and group assignment, validation, permissions, and bulk operations.
 * 
 * Features:
 * - Issue assignment to users and groups
 * - Assignment validation and permissions
 * - Assignment history tracking
 * - Bulk assignment operations
 */

import { Tool, ToolParameter, ToolExecutor, ToolResult, ToolExecutionContext } from '../../types/index.js';

/**
 * Manage Issue Assignment Tool Parameters
 */
const manageIssueAssignmentParameters: ToolParameter[] = [
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
    description: 'Assignment action to perform',
    required: true,
    schema: {
      enum: ['assign', 'unassign', 'reassign', 'list_assignments', 'get_assignment_history']
    }
  },
  {
    name: 'issue_id',
    type: 'string',
    description: 'Issue ID or number (required for assign, unassign, reassign actions)',
    required: false,
    schema: {
      pattern: '^[a-zA-Z0-9_-]+$',
      minLength: 1,
      maxLength: 20
    }
  },
  {
    name: 'issue_ids',
    type: 'array',
    description: 'Array of issue IDs for bulk operations',
    required: false,
    schema: {
      items: {
        type: 'string',
        pattern: '^[a-zA-Z0-9_-]+$',
        maxLength: 20
      },
      maxItems: 50
    }
  },
  {
    name: 'assignee',
    type: 'string',
    description: 'User to assign the issue to (username or email)',
    required: false,
    schema: {
      pattern: '^[a-zA-Z0-9@._-]+$',
      maxLength: 100
    }
  },
  {
    name: 'assignee_type',
    type: 'string',
    description: 'Type of assignee (user or group)',
    required: false,
    default: 'user',
    schema: {
      enum: ['user', 'group']
    }
  },
  {
    name: 'previous_assignee',
    type: 'string',
    description: 'Previous assignee for reassignment (username or email)',
    required: false,
    schema: {
      pattern: '^[a-zA-Z0-9@._-]+$',
      maxLength: 100
    }
  },
  {
    name: 'assignment_reason',
    type: 'string',
    description: 'Reason for assignment or reassignment',
    required: false,
    schema: {
      maxLength: 500
    }
  },
  {
    name: 'notify_assignee',
    type: 'boolean',
    description: 'Send notification to assignee about the assignment',
    required: false,
    default: true
  },
  {
    name: 'include_inactive_users',
    type: 'boolean',
    description: 'Include inactive users in assignment options (for list_assignments)',
    required: false,
    default: false
  }
];

/**
 * Manage Issue Assignment Tool Executor
 */
const manageIssueAssignmentExecutor: ToolExecutor = async (params: Record<string, any>, context: ToolExecutionContext): Promise<ToolResult> => {
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
          tool: 'manage_issue_assignment'
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
          tool: 'manage_issue_assignment'
        }
      };
    }

    // Validate action-specific parameters
    const assignmentActions = ['assign', 'unassign', 'reassign'];
    if (assignmentActions.includes(params.action)) {
      if (!params.issue_id && !params.issue_ids) {
        return {
          success: false,
          error: {
            code: -32602,
            message: 'Issue ID or issue IDs are required for assignment actions',
            details: { required_for_actions: assignmentActions }
          },
          metadata: {
            timestamp: new Date(),
            tool: 'manage_issue_assignment'
          }
        };
      }

      if (['assign', 'reassign'].includes(params.action) && !params.assignee) {
        return {
          success: false,
          error: {
            code: -32602,
            message: 'Assignee is required for assign and reassign actions',
            details: { required_for_actions: ['assign', 'reassign'] }
          },
          metadata: {
            timestamp: new Date(),
            tool: 'manage_issue_assignment'
          }
        };
      }
    }

    // Validate bulk operations
    if (params.issue_ids && params.issue_ids.length > 50) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Maximum 50 issues allowed for bulk operations',
          details: { issue_count: params.issue_ids.length, max_issues: 50 }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'manage_issue_assignment'
        }
      };
    }

    // TODO: Implement actual Bitbucket API call
    // This is a placeholder implementation based on action
    let result: any = {};

    switch (params.action) {
      case 'assign':
        const issueNumber = parseInt(params.issue_id) || 1;
        result = {
          action: 'assign',
          repository: params.repository,
          workspace: params.workspace,
          issue_id: params.issue_id,
          assignee: {
            username: params.assignee,
            display_name: params.assignee,
            type: params.assignee_type || 'user',
            links: {
              self: {
                href: `https://api.bitbucket.org/2.0/users/${params.assignee}`
              }
            }
          },
          assignment_reason: params.assignment_reason || null,
          notified: params.notify_assignee !== false,
          assigned_at: new Date().toISOString(),
          assigned_by: {
            username: 'current_user',
            display_name: 'Current User'
          },
          message: `Issue #${issueNumber} assigned to ${params.assignee}`
        };
        break;

      case 'unassign':
        const unassignIssueNumber = parseInt(params.issue_id) || 1;
        result = {
          action: 'unassign',
          repository: params.repository,
          workspace: params.workspace,
          issue_id: params.issue_id,
          previous_assignee: {
            username: 'previous_assignee',
            display_name: 'Previous Assignee'
          },
          unassigned_at: new Date().toISOString(),
          unassigned_by: {
            username: 'current_user',
            display_name: 'Current User'
          },
          message: `Issue #${unassignIssueNumber} unassigned`
        };
        break;

      case 'reassign':
        const reassignIssueNumber = parseInt(params.issue_id) || 1;
        result = {
          action: 'reassign',
          repository: params.repository,
          workspace: params.workspace,
          issue_id: params.issue_id,
          previous_assignee: {
            username: params.previous_assignee || 'previous_assignee',
            display_name: params.previous_assignee || 'Previous Assignee'
          },
          new_assignee: {
            username: params.assignee,
            display_name: params.assignee,
            type: params.assignee_type || 'user',
            links: {
              self: {
                href: `https://api.bitbucket.org/2.0/users/${params.assignee}`
              }
            }
          },
          assignment_reason: params.assignment_reason || null,
          notified: params.notify_assignee !== false,
          reassigned_at: new Date().toISOString(),
          reassigned_by: {
            username: 'current_user',
            display_name: 'Current User'
          },
          message: `Issue #${reassignIssueNumber} reassigned from ${params.previous_assignee || 'previous_assignee'} to ${params.assignee}`
        };
        break;

      case 'list_assignments':
        result = {
          action: 'list_assignments',
          repository: params.repository,
          workspace: params.workspace,
          assignments: [
            {
              issue_id: '1',
              issue_number: 1,
              title: 'Fix authentication bug',
              assignee: {
                username: 'developer1',
                display_name: 'Developer One',
                type: 'user',
                status: 'active',
                links: {
                  self: {
                    href: 'https://api.bitbucket.org/2.0/users/developer1'
                  }
                }
              },
              assigned_at: '2024-09-20T10:35:00Z',
              assigned_by: {
                username: 'user1',
                display_name: 'User One'
              }
            },
            {
              issue_id: '2',
              issue_number: 2,
              title: 'Add dark mode support',
              assignee: {
                username: 'developer2',
                display_name: 'Developer Two',
                type: 'user',
                status: 'active',
                links: {
                  self: {
                    href: 'https://api.bitbucket.org/2.0/users/developer2'
                  }
                }
              },
              assigned_at: '2024-09-21T09:20:00Z',
              assigned_by: {
                username: 'user2',
                display_name: 'User Two'
              }
            }
          ],
          total_assignments: 2,
          include_inactive: params.include_inactive_users || false,
          message: 'Issue assignments retrieved successfully'
        };
        break;

      case 'get_assignment_history':
        result = {
          action: 'get_assignment_history',
          repository: params.repository,
          workspace: params.workspace,
          issue_id: params.issue_id,
          assignment_history: [
            {
              id: 'assignment_1',
              action: 'assigned',
              assignee: {
                username: 'developer1',
                display_name: 'Developer One',
                type: 'user'
              },
              assigned_by: {
                username: 'user1',
                display_name: 'User One'
              },
              assigned_at: '2024-09-20T10:35:00Z',
              reason: 'Initial assignment'
            },
            {
              id: 'assignment_2',
              action: 'reassigned',
              previous_assignee: {
                username: 'developer1',
                display_name: 'Developer One',
                type: 'user'
              },
              new_assignee: {
                username: 'developer2',
                display_name: 'Developer Two',
                type: 'user'
              },
              reassigned_by: {
                username: 'user1',
                display_name: 'User One'
              },
              reassigned_at: '2024-09-22T14:30:00Z',
              reason: 'Workload redistribution'
            }
          ],
          total_assignments: 2,
          message: `Assignment history retrieved for issue ${params.issue_id}`
        };
        break;

      default:
        return {
          success: false,
          error: {
            code: -32602,
            message: 'Invalid action specified',
            details: { valid_actions: ['assign', 'unassign', 'reassign', 'list_assignments', 'get_assignment_history'] }
          },
          metadata: {
            timestamp: new Date(),
            tool: 'manage_issue_assignment'
          }
        };
    }

    // Log the assignment action
    context.session?.emit('tool:executed', 'manage_issue_assignment', {
      action: params.action,
      repository: params.repository,
      workspace: params.workspace,
      issue_id: params.issue_id,
      assignee: params.assignee
    });

    return {
      success: true,
      data: result,
      metadata: {
        timestamp: new Date(),
        tool: 'manage_issue_assignment',
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
        tool: 'manage_issue_assignment',
        error_type: error instanceof Error ? error.constructor.name : 'Unknown'
      }
    };
  }
};

/**
 * Manage Issue Assignment Tool Definition
 */
export const manageIssueAssignmentTool: Tool = {
  name: 'manage_issue_assignment',
  description: 'Manage issue assignments and ownership with user/group assignment, validation, permissions, and bulk operations',
  parameters: manageIssueAssignmentParameters,
  category: 'issue_management',
  version: '1.0.0',
  enabled: true,
  execute: manageIssueAssignmentExecutor,
  metadata: {
    api_endpoint: '/2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}',
    supported_apis: ['bitbucket_cloud', 'bitbucket_data_center'],
    requires_auth: true,
    rate_limit: '1000/hour'
  }
};

export default manageIssueAssignmentTool;
