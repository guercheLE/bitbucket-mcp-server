/**
 * Manage Pull Request Comments Tool
 * 
 * MCP tool for managing pull request comments with threading and replies.
 * Supports comment creation, editing, deletion, and inline comment management.
 * 
 * Features:
 * - Comment creation, editing, and deletion
 * - Inline comment threading and replies
 * - Comment formatting and validation
 * - Comment attachment support
 * - Support for both Data Center and Cloud APIs
 */

import { Tool, ToolParameter, ToolExecutor, ToolResult, ToolExecutionContext } from '../../types/index.js';

/**
 * Manage Pull Request Comments Tool Parameters
 */
const managePullRequestCommentsParameters: ToolParameter[] = [
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
    name: 'pull_request_id',
    type: 'string',
    description: 'Pull request ID or number',
    required: true,
    schema: {
      pattern: '^[a-zA-Z0-9_-]+$',
      minLength: 1,
      maxLength: 20
    }
  },
  {
    name: 'action',
    type: 'string',
    description: 'Action to perform on the pull request comment',
    required: true,
    schema: {
      enum: ['create_comment', 'edit_comment', 'delete_comment', 'reply_to_comment', 'list_comments']
    }
  },
  {
    name: 'comment_id',
    type: 'string',
    description: 'Comment ID (required for edit_comment, delete_comment, reply_to_comment actions)',
    required: false,
    schema: {
      pattern: '^[a-zA-Z0-9_-]+$',
      maxLength: 50
    }
  },
  {
    name: 'content',
    type: 'object',
    description: 'Comment content with formatting',
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
    name: 'inline_comment',
    type: 'object',
    description: 'Inline comment details (for create_comment action)',
    required: false,
    schema: {
      type: 'object',
      properties: {
        path: { type: 'string', maxLength: 500 },
        line: { type: 'number', minimum: 1 },
        line_type: { type: 'string', enum: ['context', 'additions', 'deletions'] },
        old_line: { type: 'number', minimum: 1 },
        new_line: { type: 'number', minimum: 1 }
      },
      required: ['path', 'line']
    }
  },
  {
    name: 'parent_comment_id',
    type: 'string',
    description: 'Parent comment ID for replies (for reply_to_comment action)',
    required: false,
    schema: {
      pattern: '^[a-zA-Z0-9_-]+$',
      maxLength: 50
    }
  },
  {
    name: 'include_inline_comments',
    type: 'boolean',
    description: 'Include inline comments in response (for list_comments action)',
    required: false,
    default: true
  },
  {
    name: 'include_replies',
    type: 'boolean',
    description: 'Include comment replies in response (for list_comments action)',
    required: false,
    default: true
  },
  {
    name: 'page',
    type: 'number',
    description: 'Page number for pagination (for list_comments action)',
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
    description: 'Number of comments per page (for list_comments action)',
    required: false,
    default: 20,
    schema: {
      minimum: 1,
      maximum: 100
    }
  }
];

/**
 * Manage Pull Request Comments Tool Executor
 */
const managePullRequestCommentsExecutor: ToolExecutor = async (params: Record<string, any>, context: ToolExecutionContext): Promise<ToolResult> => {
  try {
    // Validate required parameters
    if (!params.workspace || !params.repository || !params.pull_request_id || !params.action) {
      return {
        success: false,
        error: {
          code: -32602, // Invalid params
          message: 'Workspace, repository, pull_request_id, and action are required',
          details: { missing: ['workspace', 'repository', 'pull_request_id', 'action'] }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'manage_pull_request_comments'
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
          tool: 'manage_pull_request_comments'
        }
      };
    }

    // Validate pull request ID format
    if (!namePattern.test(params.pull_request_id)) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Pull request ID must contain only alphanumeric characters, hyphens, and underscores',
          details: { invalid_pull_request_id: params.pull_request_id }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'manage_pull_request_comments'
        }
      };
    }

    // Validate action-specific parameters
    switch (params.action) {
      case 'create_comment':
        if (!params.content || !params.content.raw) {
          return {
            success: false,
            error: {
              code: -32602,
              message: 'Content with raw text is required for create_comment action',
              details: { action: params.action, required: 'content.raw' }
            },
            metadata: {
              timestamp: new Date(),
              tool: 'manage_pull_request_comments'
            }
          };
        }
        if (params.content.raw.length > 10000) {
          return {
            success: false,
            error: {
              code: -32602,
              message: 'Comment content must be 10,000 characters or less',
              details: { content_length: params.content.raw.length, max_length: 10000 }
            },
            metadata: {
              timestamp: new Date(),
              tool: 'manage_pull_request_comments'
            }
          };
        }
        break;

      case 'edit_comment':
        if (!params.comment_id) {
          return {
            success: false,
            error: {
              code: -32602,
              message: 'Comment ID is required for edit_comment action',
              details: { action: params.action, required: 'comment_id' }
            },
            metadata: {
              timestamp: new Date(),
              tool: 'manage_pull_request_comments'
            }
          };
        }
        if (!params.content || !params.content.raw) {
          return {
            success: false,
            error: {
              code: -32602,
              message: 'Content with raw text is required for edit_comment action',
              details: { action: params.action, required: 'content.raw' }
            },
            metadata: {
              timestamp: new Date(),
              tool: 'manage_pull_request_comments'
            }
          };
        }
        if (params.content.raw.length > 10000) {
          return {
            success: false,
            error: {
              code: -32602,
              message: 'Comment content must be 10,000 characters or less',
              details: { content_length: params.content.raw.length, max_length: 10000 }
            },
            metadata: {
              timestamp: new Date(),
              tool: 'manage_pull_request_comments'
            }
          };
        }
        break;

      case 'delete_comment':
        if (!params.comment_id) {
          return {
            success: false,
            error: {
              code: -32602,
              message: 'Comment ID is required for delete_comment action',
              details: { action: params.action, required: 'comment_id' }
            },
            metadata: {
              timestamp: new Date(),
              tool: 'manage_pull_request_comments'
            }
          };
        }
        break;

      case 'reply_to_comment':
        if (!params.comment_id || !params.parent_comment_id) {
          return {
            success: false,
            error: {
              code: -32602,
              message: 'Comment ID and parent comment ID are required for reply_to_comment action',
              details: { action: params.action, required: ['comment_id', 'parent_comment_id'] }
            },
            metadata: {
              timestamp: new Date(),
              tool: 'manage_pull_request_comments'
            }
          };
        }
        if (!params.content || !params.content.raw) {
          return {
            success: false,
            error: {
              code: -32602,
              message: 'Content with raw text is required for reply_to_comment action',
              details: { action: params.action, required: 'content.raw' }
            },
            metadata: {
              timestamp: new Date(),
              tool: 'manage_pull_request_comments'
            }
          };
        }
        if (params.content.raw.length > 10000) {
          return {
            success: false,
            error: {
              code: -32602,
              message: 'Comment content must be 10,000 characters or less',
              details: { content_length: params.content.raw.length, max_length: 10000 }
            },
            metadata: {
              timestamp: new Date(),
              tool: 'manage_pull_request_comments'
            }
          };
        }
        break;

      case 'list_comments':
        // Validate pagination parameters
        const page = Math.max(1, Math.min(1000, params.page || 1));
        const pageSize = Math.max(1, Math.min(100, params.page_size || 20));
        break;

      default:
        return {
          success: false,
          error: {
            code: -32602,
            message: 'Invalid action specified',
            details: { 
              action: params.action, 
              valid_actions: ['create_comment', 'edit_comment', 'delete_comment', 'reply_to_comment', 'list_comments'] 
            }
          },
          metadata: {
            timestamp: new Date(),
            tool: 'manage_pull_request_comments'
          }
        };
    }

    // Validate inline comment parameters if provided
    if (params.inline_comment) {
      if (!params.inline_comment.path || !params.inline_comment.line) {
        return {
          success: false,
          error: {
            code: -32602,
            message: 'Inline comment must have path and line specified',
            details: { required: ['path', 'line'] }
          },
          metadata: {
            timestamp: new Date(),
            tool: 'manage_pull_request_comments'
          }
        };
      }
      if (params.inline_comment.line < 1) {
        return {
          success: false,
          error: {
            code: -32602,
            message: 'Inline comment line must be 1 or greater',
            details: { line: params.inline_comment.line }
          },
          metadata: {
            timestamp: new Date(),
            tool: 'manage_pull_request_comments'
          }
        };
      }
    }

    // TODO: Implement actual Bitbucket API call
    // This is a placeholder implementation
    const pullRequestNumber = parseInt(params.pull_request_id) || 1;
    const pullRequestId = `pr_${pullRequestNumber}_${Date.now()}`;

    let result: any = {};

    switch (params.action) {
      case 'create_comment':
        const commentId = `comment_${Date.now()}`;
        result = {
          action: 'create_comment',
          comment: {
            id: commentId,
            content: params.content,
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
            created_on: new Date().toISOString(),
            updated_on: new Date().toISOString(),
            inline: params.inline_comment ? {
              path: params.inline_comment.path,
              line: params.inline_comment.line,
              line_type: params.inline_comment.line_type || 'context',
              old_line: params.inline_comment.old_line || null,
              new_line: params.inline_comment.new_line || null
            } : null,
            links: {
              self: {
                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/pullrequests/${pullRequestNumber}/comments/${commentId}`
              }
            }
          },
          message: `Comment created successfully${params.inline_comment ? ' as inline comment' : ''}`
        };
        break;

      case 'edit_comment':
        result = {
          action: 'edit_comment',
          comment: {
            id: params.comment_id,
            content: params.content,
            author: {
              username: 'current_user',
              display_name: 'Current User',
              uuid: 'user-uuid-current'
            },
            created_on: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            updated_on: new Date().toISOString(),
            links: {
              self: {
                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/pullrequests/${pullRequestNumber}/comments/${params.comment_id}`
              }
            }
          },
          message: `Comment ${params.comment_id} updated successfully`
        };
        break;

      case 'delete_comment':
        result = {
          action: 'delete_comment',
          comment: {
            id: params.comment_id,
            deleted: true,
            deleted_on: new Date().toISOString()
          },
          message: `Comment ${params.comment_id} deleted successfully`
        };
        break;

      case 'reply_to_comment':
        const replyId = `reply_${Date.now()}`;
        result = {
          action: 'reply_to_comment',
          comment: {
            id: replyId,
            content: params.content,
            author: {
              username: 'current_user',
              display_name: 'Current User',
              uuid: 'user-uuid-current'
            },
            created_on: new Date().toISOString(),
            updated_on: new Date().toISOString(),
            parent: {
              id: params.parent_comment_id,
              links: {
                self: {
                  href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/pullrequests/${pullRequestNumber}/comments/${params.parent_comment_id}`
                }
              }
            },
            links: {
              self: {
                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/pullrequests/${pullRequestNumber}/comments/${replyId}`
              }
            }
          },
          message: `Reply created for comment ${params.parent_comment_id}`
        };
        break;

      case 'list_comments':
        const page = Math.max(1, Math.min(1000, params.page || 1));
        const pageSize = Math.max(1, Math.min(100, params.page_size || 20));
        const totalComments = 15; // Simulated total
        const startIndex = (page - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, totalComments);
        const hasNextPage = endIndex < totalComments;
        const hasPreviousPage = page > 1;

        const comments = [];
        for (let i = startIndex; i < endIndex; i++) {
          const commentNum = i + 1;
          comments.push({
            id: `comment-${commentNum}`,
            content: {
              raw: `This is comment ${commentNum} on pull request #${pullRequestNumber}`,
              markup: 'markdown',
              html: `<p>This is comment ${commentNum} on pull request #${pullRequestNumber}</p>`
            },
            author: {
              username: `user${commentNum}`,
              display_name: `User ${commentNum}`,
              uuid: `user-uuid-${commentNum}`,
              links: {
                self: {
                  href: `https://api.bitbucket.org/2.0/users/user${commentNum}`
                },
                avatar: {
                  href: `https://bitbucket.org/account/user${commentNum}/avatar/32/`
                }
              }
            },
            created_on: new Date(Date.now() - (commentNum * 60 * 60 * 1000)).toISOString(),
            updated_on: new Date(Date.now() - (commentNum * 60 * 60 * 1000)).toISOString(),
            inline: params.include_inline_comments && commentNum % 3 === 0 ? {
              path: `src/file${commentNum}.ts`,
              line: commentNum * 10,
              line_type: 'context'
            } : null,
            replies: params.include_replies && commentNum % 2 === 0 ? [
              {
                id: `reply-${commentNum}`,
                content: {
                  raw: `This is a reply to comment ${commentNum}`,
                  markup: 'markdown',
                  html: `<p>This is a reply to comment ${commentNum}</p>`
                },
                author: {
                  username: `replyer${commentNum}`,
                  display_name: `Replyer ${commentNum}`,
                  uuid: `user-uuid-replyer${commentNum}`
                },
                created_on: new Date(Date.now() - (commentNum * 30 * 60 * 1000)).toISOString(),
                updated_on: new Date(Date.now() - (commentNum * 30 * 60 * 1000)).toISOString()
              }
            ] : [],
            links: {
              self: {
                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/pullrequests/${pullRequestNumber}/comments/comment-${commentNum}`
              }
            }
          });
        }

        result = {
          action: 'list_comments',
          pull_request: {
            id: pullRequestId,
            number: pullRequestNumber
          },
          comments: comments,
          pagination: {
            page: page,
            page_size: pageSize,
            total_count: totalComments,
            total_pages: Math.ceil(totalComments / pageSize),
            has_next_page: hasNextPage,
            has_previous_page: hasPreviousPage,
            next_page: hasNextPage ? page + 1 : null,
            previous_page: hasPreviousPage ? page - 1 : null
          },
          message: `Retrieved ${comments.length} comments for pull request #${pullRequestNumber}`
        };
        break;
    }

    // Log the comment management action
    context.session?.emit('tool:executed', 'manage_pull_request_comments', {
      repository: params.repository,
      workspace: params.workspace,
      pull_request_number: pullRequestNumber,
      action: params.action,
      comment_id: params.comment_id || null,
      inline_comment: params.inline_comment ? true : false
    });

    return {
      success: true,
      data: result,
      metadata: {
        timestamp: new Date(),
        tool: 'manage_pull_request_comments',
        execution_time: Date.now() - context.request.timestamp.getTime(),
        workspace: params.workspace,
        repository: params.repository,
        pull_request_number: pullRequestNumber,
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
        tool: 'manage_pull_request_comments',
        error_type: error instanceof Error ? error.constructor.name : 'Unknown'
      }
    };
  }
};

/**
 * Manage Pull Request Comments Tool Definition
 */
export const managePullRequestCommentsTool: Tool = {
  name: 'manage_pull_request_comments',
  description: 'Manage pull request comments with threading, replies, and inline comment support for comprehensive code review workflows',
  parameters: managePullRequestCommentsParameters,
  category: 'pull_request_management',
  version: '1.0.0',
  enabled: true,
  execute: managePullRequestCommentsExecutor,
  metadata: {
    api_endpoint: '/2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/comments',
    supported_apis: ['bitbucket_cloud', 'bitbucket_data_center'],
    requires_auth: true,
    rate_limit: '2000/hour'
  }
};

export default managePullRequestCommentsTool;
