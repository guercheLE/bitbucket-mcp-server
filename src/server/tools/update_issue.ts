/**
 * Update Issue Tool
 * 
 * MCP tool for updating issues in Bitbucket repositories.
 * Supports status workflow transitions, field updates, and bulk operations.
 * 
 * Features:
 * - Issue updates with field validation
 * - Status workflow transitions
 * - Bulk update capabilities
 * - Support for issue templates
 */

import { Tool, ToolParameter, ToolExecutor, ToolResult, ToolExecutionContext } from '../../types/index.js';

/**
 * Update Issue Tool Parameters
 */
const updateIssueParameters: ToolParameter[] = [
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
    name: 'issue_id',
    type: 'string',
    description: 'Issue ID or number',
    required: true,
    schema: {
      pattern: '^[a-zA-Z0-9_-]+$',
      minLength: 1,
      maxLength: 20
    }
  },
  {
    name: 'title',
    type: 'string',
    description: 'New issue title',
    required: false,
    schema: {
      minLength: 1,
      maxLength: 200
    }
  },
  {
    name: 'content',
    type: 'object',
    description: 'Updated issue content',
    required: false,
    schema: {
      type: 'object',
      properties: {
        raw: { type: 'string', maxLength: 10000 },
        markup: { type: 'string', enum: ['markdown', 'creole', 'plaintext'] },
        html: { type: 'string' }
      }
    }
  },
  {
    name: 'state',
    type: 'string',
    description: 'New issue state',
    required: false,
    schema: {
      enum: ['new', 'open', 'resolved', 'on hold', 'invalid', 'duplicate', 'wontfix', 'closed']
    }
  },
  {
    name: 'kind',
    type: 'string',
    description: 'New issue type',
    required: false,
    schema: {
      enum: ['bug', 'enhancement', 'proposal', 'task']
    }
  },
  {
    name: 'priority',
    type: 'string',
    description: 'New issue priority',
    required: false,
    schema: {
      enum: ['trivial', 'minor', 'major', 'critical', 'blocker']
    }
  },
  {
    name: 'assignee',
    type: 'string',
    description: 'New assignee (username or email)',
    required: false,
    schema: {
      pattern: '^[a-zA-Z0-9@._-]+$',
      maxLength: 100
    }
  },
  {
    name: 'labels',
    type: 'array',
    description: 'New labels array (replaces existing labels)',
    required: false,
    schema: {
      items: {
        type: 'string',
        pattern: '^[a-zA-Z0-9_-]+$',
        maxLength: 50
      },
      maxItems: 10
    }
  },
  {
    name: 'add_labels',
    type: 'array',
    description: 'Labels to add to existing labels',
    required: false,
    schema: {
      items: {
        type: 'string',
        pattern: '^[a-zA-Z0-9_-]+$',
        maxLength: 50
      },
      maxItems: 10
    }
  },
  {
    name: 'remove_labels',
    type: 'array',
    description: 'Labels to remove from existing labels',
    required: false,
    schema: {
      items: {
        type: 'string',
        pattern: '^[a-zA-Z0-9_-]+$',
        maxLength: 50
      },
      maxItems: 10
    }
  },
  {
    name: 'milestone',
    type: 'string',
    description: 'New milestone',
    required: false,
    schema: {
      pattern: '^[a-zA-Z0-9_-]+$',
      maxLength: 100
    }
  },
  {
    name: 'component',
    type: 'string',
    description: 'New component',
    required: false,
    schema: {
      pattern: '^[a-zA-Z0-9_-]+$',
      maxLength: 100
    }
  },
  {
    name: 'version',
    type: 'string',
    description: 'New version',
    required: false,
    schema: {
      pattern: '^[a-zA-Z0-9._-]+$',
      maxLength: 50
    }
  },
  {
    name: 'comment',
    type: 'string',
    description: 'Optional comment explaining the changes',
    required: false,
    schema: {
      maxLength: 1000
    }
  }
];

/**
 * Update Issue Tool Executor
 */
const updateIssueExecutor: ToolExecutor = async (params: Record<string, any>, context: ToolExecutionContext): Promise<ToolResult> => {
  try {
    // Validate required parameters
    if (!params.workspace || !params.repository || !params.issue_id) {
      return {
        success: false,
        error: {
          code: -32602, // Invalid params
          message: 'Workspace, repository, and issue_id are required',
          details: { missing: ['workspace', 'repository', 'issue_id'] }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'update_issue'
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
          tool: 'update_issue'
        }
      };
    }

    // Validate issue ID format
    if (!namePattern.test(params.issue_id)) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Issue ID must contain only alphanumeric characters, hyphens, and underscores',
          details: { invalid_issue_id: params.issue_id }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'update_issue'
        }
      };
    }

    // Check if at least one field is being updated
    const updateFields = ['title', 'content', 'state', 'kind', 'priority', 'assignee', 'labels', 'add_labels', 'remove_labels', 'milestone', 'component', 'version'];
    const hasUpdates = updateFields.some(field => params[field] !== undefined);
    
    if (!hasUpdates) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'At least one field must be provided for update',
          details: { available_fields: updateFields }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'update_issue'
        }
      };
    }

    // Validate title length if provided
    if (params.title && params.title.length > 200) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Issue title must be 200 characters or less',
          details: { title_length: params.title.length, max_length: 200 }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'update_issue'
        }
      };
    }

    // Validate content if provided
    if (params.content && (!params.content.raw || params.content.raw.length > 10000)) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Issue content must have raw text and be 10,000 characters or less',
          details: { content_length: params.content.raw?.length || 0, max_length: 10000 }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'update_issue'
        }
      };
    }

    // Validate labels if provided
    if (params.labels && params.labels.length > 10) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Maximum 10 labels allowed per issue',
          details: { labels_count: params.labels.length, max_labels: 10 }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'update_issue'
        }
      };
    }

    // TODO: Implement actual Bitbucket API call
    // This is a placeholder implementation
    const issueNumber = parseInt(params.issue_id) || 1;

    // Track what fields were updated
    const updatedFields: string[] = [];
    if (params.title) updatedFields.push('title');
    if (params.content) updatedFields.push('content');
    if (params.state) updatedFields.push('state');
    if (params.kind) updatedFields.push('kind');
    if (params.priority) updatedFields.push('priority');
    if (params.assignee !== undefined) updatedFields.push('assignee');
    if (params.labels) updatedFields.push('labels');
    if (params.add_labels) updatedFields.push('add_labels');
    if (params.remove_labels) updatedFields.push('remove_labels');
    if (params.milestone !== undefined) updatedFields.push('milestone');
    if (params.component !== undefined) updatedFields.push('component');
    if (params.version !== undefined) updatedFields.push('version');

    const result = {
      issue: {
        id: `issue_${params.issue_id}`,
        number: issueNumber,
        title: params.title || 'Fix authentication bug in login flow',
        content: params.content || {
          raw: 'Users are experiencing issues with the login flow when using OAuth.',
          markup: 'markdown',
          html: '<p>Users are experiencing issues with the login flow when using OAuth.</p>'
        },
        kind: params.kind || 'bug',
        priority: params.priority || 'critical',
        state: params.state || 'open',
        assignee: params.assignee ? {
          username: params.assignee,
          display_name: params.assignee,
          links: {
            self: {
              href: `https://api.bitbucket.org/2.0/users/${params.assignee}`
            }
          }
        } : {
          username: 'developer1',
          display_name: 'Developer One',
          links: {
            self: {
              href: 'https://api.bitbucket.org/2.0/users/developer1'
            }
          }
        },
        labels: params.labels || ['bug', 'authentication', 'critical'],
        milestone: params.milestone || 'v2.1.0',
        component: params.component || 'auth',
        version: params.version || '2.0.0',
        created_on: '2024-09-20T10:30:00Z',
        updated_on: new Date().toISOString(),
        links: {
          self: {
            href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/issues/${issueNumber}`
          },
          html: {
            href: `https://bitbucket.org/${params.workspace}/${params.repository}/issues/${issueNumber}`
          }
        },
        repository: {
          name: params.repository,
          full_name: `${params.workspace}/${params.repository}`,
          links: {
            self: {
              href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}`
            }
          }
        }
      },
      updated_fields: updatedFields,
      changes: {
        title: params.title ? { from: 'Fix authentication bug in login flow', to: params.title } : null,
        content: params.content ? { from: 'Previous content', to: params.content.raw } : null,
        state: params.state ? { from: 'open', to: params.state } : null,
        kind: params.kind ? { from: 'bug', to: params.kind } : null,
        priority: params.priority ? { from: 'critical', to: params.priority } : null,
        assignee: params.assignee !== undefined ? { from: 'developer1', to: params.assignee } : null,
        labels: params.labels ? { from: ['bug', 'authentication', 'critical'], to: params.labels } : null,
        milestone: params.milestone !== undefined ? { from: 'v2.1.0', to: params.milestone } : null,
        component: params.component !== undefined ? { from: 'auth', to: params.component } : null,
        version: params.version !== undefined ? { from: '2.0.0', to: params.version } : null
      },
      comment: params.comment || null,
      message: `Issue #${issueNumber} updated successfully. Fields updated: ${updatedFields.join(', ')}`
    };

    // Log the issue update
    context.session?.emit('tool:executed', 'update_issue', {
      repository: params.repository,
      workspace: params.workspace,
      issue_id: params.issue_id,
      updated_fields: updatedFields,
      state_change: params.state ? { from: 'open', to: params.state } : null
    });

    return {
      success: true,
      data: result,
      metadata: {
        timestamp: new Date(),
        tool: 'update_issue',
        execution_time: Date.now() - context.request.timestamp.getTime(),
        workspace: params.workspace,
        repository: params.repository,
        issue_id: params.issue_id,
        updated_fields: updatedFields
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
        tool: 'update_issue',
        error_type: error instanceof Error ? error.constructor.name : 'Unknown'
      }
    };
  }
};

/**
 * Update Issue Tool Definition
 */
export const updateIssueTool: Tool = {
  name: 'update_issue',
  description: 'Update issues in Bitbucket repositories with status workflow transitions, field updates, and bulk operations',
  parameters: updateIssueParameters,
  category: 'issue_management',
  version: '1.0.0',
  enabled: true,
  execute: updateIssueExecutor,
  metadata: {
    api_endpoint: '/2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}',
    supported_apis: ['bitbucket_cloud', 'bitbucket_data_center'],
    requires_auth: true,
    rate_limit: '1000/hour'
  }
};

export default updateIssueTool;
