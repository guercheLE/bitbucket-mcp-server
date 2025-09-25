/**
 * Manage Issue Comments Tool
 * 
 * MCP tool for managing issue comments in Bitbucket repositories.
 * Supports comment creation, editing, deletion, threading, and formatting.
 * 
 * Features:
 * - Comment creation, editing, and deletion
 * - Comment threading and replies
 * - Comment formatting and validation
 * - Comment attachment support
 */

import { Tool, ToolParameter, ToolExecutor, ToolResult, ToolExecutionContext } from '../../types/index.js';

/**
 * Manage Issue Comments Tool Parameters
 */
const manageIssueCommentsParameters: ToolParameter[] = [
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
    description: 'Comment action to perform',
    required: true,
    schema: {
      enum: ['create', 'update', 'delete', 'list', 'get', 'reply']
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
    name: 'comment_id',
    type: 'string',
    description: 'Comment ID (required for update, delete, get, reply actions)',
    required: false,
    schema: {
      pattern: '^[a-zA-Z0-9_-]+$',
      minLength: 1,
      maxLength: 20
    }
  },
  {
    name: 'content',
    type: 'object',
    description: 'Comment content (required for create, update, reply actions)',
    required: false,
    schema: {
      type: 'object',
      properties: {
        raw: { type: 'string', maxLength: 10000 },
        markup: { type: 'string', enum: ['markdown', 'creole', 'plaintext'] },
        html: { type: 'string' }
      },
      required: ['raw']
    }
  },
  {
    name: 'parent_comment_id',
    type: 'string',
    description: 'Parent comment ID for threaded replies',
    required: false,
    schema: {
      pattern: '^[a-zA-Z0-9_-]+$',
      maxLength: 20
    }
  },
  {
    name: 'mentions',
    type: 'array',
    description: 'Array of usernames to mention in the comment',
    required: false,
    schema: {
      items: {
        type: 'string',
        pattern: '^[a-zA-Z0-9@._-]+$',
        maxLength: 100
      },
      maxItems: 10
    }
  },
  {
    name: 'attachments',
    type: 'array',
    description: 'Array of attachment IDs to include with the comment',
    required: false,
    schema: {
      items: {
        type: 'string',
        pattern: '^[a-zA-Z0-9_-]+$',
        maxLength: 50
      },
      maxItems: 5
    }
  },
  {
    name: 'is_internal',
    type: 'boolean',
    description: 'Mark comment as internal (visible only to repository members)',
    required: false,
    default: false
  },
  {
    name: 'page',
    type: 'number',
    description: 'Page number for comment listing',
    required: false,
    default: 1,
    schema: {
      minimum: 1,
      maximum: 1000
    }
  },
  {
    name: 'page_size',
    type: 'number',
    description: 'Number of comments per page',
    required: false,
    default: 20,
    schema: {
      minimum: 1,
      maximum: 100
    }
  }
];

/**
 * Manage Issue Comments Tool Executor
 */
const manageIssueCommentsExecutor: ToolExecutor = async (params: Record<string, any>, context: ToolExecutionContext): Promise<ToolResult> => {
  try {
    // Validate required parameters
    if (!params.workspace || !params.repository || !params.action || !params.issue_id) {
      return {
        success: false,
        error: {
          code: -32602, // Invalid params
          message: 'Workspace, repository, action, and issue_id are required',
          details: { missing: ['workspace', 'repository', 'action', 'issue_id'] }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'manage_issue_comments'
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
          tool: 'manage_issue_comments'
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
          tool: 'manage_issue_comments'
        }
      };
    }

    // Validate action-specific parameters
    const contentActions = ['create', 'update', 'reply'];
    if (contentActions.includes(params.action) && !params.content) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Content is required for create, update, and reply actions',
          details: { required_for_actions: contentActions }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'manage_issue_comments'
        }
      };
    }

    const commentIdActions = ['update', 'delete', 'get', 'reply'];
    if (commentIdActions.includes(params.action) && !params.comment_id) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Comment ID is required for this action',
          details: { required_for_actions: commentIdActions }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'manage_issue_comments'
        }
      };
    }

    // Validate content if provided
    if (params.content && (!params.content.raw || params.content.raw.length > 10000)) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Comment content must have raw text and be 10,000 characters or less',
          details: { content_length: params.content.raw?.length || 0, max_length: 10000 }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'manage_issue_comments'
        }
      };
    }

    // Validate mentions if provided
    if (params.mentions && params.mentions.length > 10) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Maximum 10 mentions allowed per comment',
          details: { mentions_count: params.mentions.length, max_mentions: 10 }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'manage_issue_comments'
        }
      };
    }

    // Validate attachments if provided
    if (params.attachments && params.attachments.length > 5) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Maximum 5 attachments allowed per comment',
          details: { attachments_count: params.attachments.length, max_attachments: 5 }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'manage_issue_comments'
        }
      };
    }

    // TODO: Implement actual Bitbucket API call
    // This is a placeholder implementation based on action
    let result: any = {};

    switch (params.action) {
      case 'create':
        const commentId = `comment_${Date.now()}`;
        const issueNumber = parseInt(params.issue_id) || 1;
        result = {
          action: 'create',
          repository: params.repository,
          workspace: params.workspace,
          issue_id: params.issue_id,
          comment: {
            id: commentId,
            content: {
              raw: params.content.raw,
              markup: params.content.markup || 'markdown',
              html: params.content.html || `<p>${params.content.raw}</p>`
            },
            author: {
              username: 'current_user',
              display_name: 'Current User',
              uuid: 'user-uuid-current',
              links: {
                self: {
                  href: 'https://api.bitbucket.org/2.0/users/current_user'
                },
                avatar: {
                  href: 'https://bitbucket.org/account/current_user/avatar/32/'
                }
              }
            },
            parent: params.parent_comment_id ? {
              id: params.parent_comment_id,
              links: {
                self: {
                  href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/issues/${issueNumber}/comments/${params.parent_comment_id}`
                }
              }
            } : null,
            mentions: params.mentions || [],
            attachments: params.attachments || [],
            is_internal: params.is_internal || false,
            created_on: new Date().toISOString(),
            updated_on: new Date().toISOString(),
            links: {
              self: {
                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/issues/${issueNumber}/comments/${commentId}`
              }
            }
          },
          message: `Comment created successfully for issue #${issueNumber}`
        };
        break;

      case 'update':
        const updateIssueNumber = parseInt(params.issue_id) || 1;
        result = {
          action: 'update',
          repository: params.repository,
          workspace: params.workspace,
          issue_id: params.issue_id,
          comment_id: params.comment_id,
          comment: {
            id: params.comment_id,
            content: {
              raw: params.content.raw,
              markup: params.content.markup || 'markdown',
              html: params.content.html || `<p>${params.content.raw}</p>`
            },
            author: {
              username: 'current_user',
              display_name: 'Current User',
              uuid: 'user-uuid-current'
            },
            mentions: params.mentions || [],
            attachments: params.attachments || [],
            is_internal: params.is_internal || false,
            created_on: '2024-09-20T10:30:00Z',
            updated_on: new Date().toISOString(),
            links: {
              self: {
                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/issues/${updateIssueNumber}/comments/${params.comment_id}`
              }
            }
          },
          message: `Comment ${params.comment_id} updated successfully`
        };
        break;

      case 'delete':
        const deleteIssueNumber = parseInt(params.issue_id) || 1;
        result = {
          action: 'delete',
          repository: params.repository,
          workspace: params.workspace,
          issue_id: params.issue_id,
          comment_id: params.comment_id,
          deleted_at: new Date().toISOString(),
          deleted_by: {
            username: 'current_user',
            display_name: 'Current User'
          },
          message: `Comment ${params.comment_id} deleted successfully`
        };
        break;

      case 'list':
        const listIssueNumber = parseInt(params.issue_id) || 1;
        const page = Math.max(1, Math.min(1000, params.page || 1));
        const pageSize = Math.max(1, Math.min(100, params.page_size || 20));
        
        result = {
          action: 'list',
          repository: params.repository,
          workspace: params.workspace,
          issue_id: params.issue_id,
          comments: [
            {
              id: 'comment_1',
              content: {
                raw: 'I can reproduce this issue. It happens when the OAuth callback URL is not properly configured.',
                markup: 'markdown',
                html: '<p>I can reproduce this issue. It happens when the OAuth callback URL is not properly configured.</p>'
              },
              author: {
                username: 'developer2',
                display_name: 'Developer Two',
                uuid: 'user-uuid-2',
                links: {
                  self: {
                    href: 'https://api.bitbucket.org/2.0/users/developer2'
                  },
                  avatar: {
                    href: 'https://bitbucket.org/account/developer2/avatar/32/'
                  }
                }
              },
              parent: null,
              mentions: [],
              attachments: [],
              is_internal: false,
              created_on: '2024-09-21T09:15:00Z',
              updated_on: '2024-09-21T09:15:00Z',
              links: {
                self: {
                  href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/issues/${listIssueNumber}/comments/1`
                }
              }
            },
            {
              id: 'comment_2',
              content: {
                raw: 'I found the issue in the OAuth validation logic. The token expiration check is not working correctly.',
                markup: 'markdown',
                html: '<p>I found the issue in the OAuth validation logic. The token expiration check is not working correctly.</p>'
              },
              author: {
                username: 'developer1',
                display_name: 'Developer One',
                uuid: 'user-uuid-1',
                links: {
                  self: {
                    href: 'https://api.bitbucket.org/2.0/users/developer1'
                  },
                  avatar: {
                    href: 'https://bitbucket.org/account/developer1/avatar/32/'
                  }
                }
              },
              parent: null,
              mentions: ['developer2'],
              attachments: [],
              is_internal: false,
              created_on: '2024-09-22T14:30:00Z',
              updated_on: '2024-09-22T14:30:00Z',
              links: {
                self: {
                  href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/issues/${listIssueNumber}/comments/2`
                }
              }
            }
          ],
          pagination: {
            page: page,
            page_size: pageSize,
            total_comments: 2,
            total_pages: 1,
            has_next: false,
            has_previous: false
          },
          message: `Comments retrieved for issue #${listIssueNumber}`
        };
        break;

      case 'get':
        const getIssueNumber = parseInt(params.issue_id) || 1;
        result = {
          action: 'get',
          repository: params.repository,
          workspace: params.workspace,
          issue_id: params.issue_id,
          comment_id: params.comment_id,
          comment: {
            id: params.comment_id,
            content: {
              raw: 'I can reproduce this issue. It happens when the OAuth callback URL is not properly configured.',
              markup: 'markdown',
              html: '<p>I can reproduce this issue. It happens when the OAuth callback URL is not properly configured.</p>'
            },
            author: {
              username: 'developer2',
              display_name: 'Developer Two',
              uuid: 'user-uuid-2',
              links: {
                self: {
                  href: 'https://api.bitbucket.org/2.0/users/developer2'
                },
                avatar: {
                  href: 'https://bitbucket.org/account/developer2/avatar/32/'
                }
              }
            },
            parent: null,
            mentions: [],
            attachments: [],
            is_internal: false,
            created_on: '2024-09-21T09:15:00Z',
            updated_on: '2024-09-21T09:15:00Z',
            links: {
              self: {
                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/issues/${getIssueNumber}/comments/${params.comment_id}`
              }
            }
          },
          message: `Comment ${params.comment_id} retrieved successfully`
        };
        break;

      case 'reply':
        const replyCommentId = `comment_${Date.now()}`;
        const replyIssueNumber = parseInt(params.issue_id) || 1;
        result = {
          action: 'reply',
          repository: params.repository,
          workspace: params.workspace,
          issue_id: params.issue_id,
          parent_comment_id: params.comment_id,
          comment: {
            id: replyCommentId,
            content: {
              raw: params.content.raw,
              markup: params.content.markup || 'markdown',
              html: params.content.html || `<p>${params.content.raw}</p>`
            },
            author: {
              username: 'current_user',
              display_name: 'Current User',
              uuid: 'user-uuid-current',
              links: {
                self: {
                  href: 'https://api.bitbucket.org/2.0/users/current_user'
                },
                avatar: {
                  href: 'https://bitbucket.org/account/current_user/avatar/32/'
                }
              }
            },
            parent: {
              id: params.comment_id,
              links: {
                self: {
                  href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/issues/${replyIssueNumber}/comments/${params.comment_id}`
                }
              }
            },
            mentions: params.mentions || [],
            attachments: params.attachments || [],
            is_internal: params.is_internal || false,
            created_on: new Date().toISOString(),
            updated_on: new Date().toISOString(),
            links: {
              self: {
                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/issues/${replyIssueNumber}/comments/${replyCommentId}`
              }
            }
          },
          message: `Reply created successfully for comment ${params.comment_id}`
        };
        break;

      default:
        return {
          success: false,
          error: {
            code: -32602,
            message: 'Invalid action specified',
            details: { valid_actions: ['create', 'update', 'delete', 'list', 'get', 'reply'] }
          },
          metadata: {
            timestamp: new Date(),
            tool: 'manage_issue_comments'
          }
        };
    }

    // Log the comment action
    context.session?.emit('tool:executed', 'manage_issue_comments', {
      action: params.action,
      repository: params.repository,
      workspace: params.workspace,
      issue_id: params.issue_id,
      comment_id: params.comment_id
    });

    return {
      success: true,
      data: result,
      metadata: {
        timestamp: new Date(),
        tool: 'manage_issue_comments',
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
        tool: 'manage_issue_comments',
        error_type: error instanceof Error ? error.constructor.name : 'Unknown'
      }
    };
  }
};

/**
 * Manage Issue Comments Tool Definition
 */
export const manageIssueCommentsTool: Tool = {
  name: 'manage_issue_comments',
  description: 'Manage issue comments with creation, editing, deletion, threading, and formatting capabilities',
  parameters: manageIssueCommentsParameters,
  category: 'issue_management',
  version: '1.0.0',
  enabled: true,
  execute: manageIssueCommentsExecutor,
  metadata: {
    api_endpoint: '/2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}/comments',
    supported_apis: ['bitbucket_cloud', 'bitbucket_data_center'],
    requires_auth: true,
    rate_limit: '1000/hour'
  }
};

export default manageIssueCommentsTool;
