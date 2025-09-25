/**
 * Manage Pull Request Reviews Tool
 * 
 * MCP tool for managing pull request reviews, comments, and approvals.
 * Supports review assignment, status management, and approval workflows.
 * 
 * Features:
 * - Pull request review assignment and status management
 * - Review approval and rejection workflows
 * - Review history tracking
 * - Bulk review operations
 * - Support for both Data Center and Cloud APIs
 */

import { Tool, ToolParameter, ToolExecutor, ToolResult, ToolExecutionContext } from '../../types/index.js';

/**
 * Manage Pull Request Reviews Tool Parameters
 */
const managePullRequestReviewsParameters: ToolParameter[] = [
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
    description: 'Action to perform on the pull request review',
    required: true,
    schema: {
      enum: ['assign_reviewers', 'submit_review', 'approve', 'request_changes', 'dismiss_review', 'list_reviews']
    }
  },
  {
    name: 'reviewers',
    type: 'array',
    description: 'Array of reviewer usernames (required for assign_reviewers action)',
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
    name: 'reviewer',
    type: 'string',
    description: 'Reviewer username (required for submit_review, approve, request_changes, dismiss_review actions)',
    required: false,
    schema: {
      pattern: '^[a-zA-Z0-9@._-]+$',
      maxLength: 100
    }
  },
  {
    name: 'review_id',
    type: 'string',
    description: 'Review ID (required for dismiss_review action)',
    required: false,
    schema: {
      pattern: '^[a-zA-Z0-9_-]+$',
      maxLength: 50
    }
  },
  {
    name: 'review_comment',
    type: 'string',
    description: 'Review comment or feedback',
    required: false,
    schema: {
      maxLength: 5000
    }
  },
  {
    name: 'approve_changes',
    type: 'boolean',
    description: 'Whether to approve the changes (for approve action)',
    required: false,
    default: true
  },
  {
    name: 'request_changes_reason',
    type: 'string',
    description: 'Reason for requesting changes (for request_changes action)',
    required: false,
    schema: {
      maxLength: 2000
    }
  },
  {
    name: 'dismiss_reason',
    type: 'string',
    description: 'Reason for dismissing the review (for dismiss_review action)',
    required: false,
    schema: {
      maxLength: 1000
    }
  },
  {
    name: 'include_review_history',
    type: 'boolean',
    description: 'Include review history in response (for list_reviews action)',
    required: false,
    default: true
  }
];

/**
 * Manage Pull Request Reviews Tool Executor
 */
const managePullRequestReviewsExecutor: ToolExecutor = async (params: Record<string, any>, context: ToolExecutionContext): Promise<ToolResult> => {
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
          tool: 'manage_pull_request_reviews'
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
          tool: 'manage_pull_request_reviews'
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
          tool: 'manage_pull_request_reviews'
        }
      };
    }

    // Validate action-specific parameters
    switch (params.action) {
      case 'assign_reviewers':
        if (!params.reviewers || params.reviewers.length === 0) {
          return {
            success: false,
            error: {
              code: -32602,
              message: 'Reviewers array is required for assign_reviewers action',
              details: { action: params.action, required: 'reviewers' }
            },
            metadata: {
              timestamp: new Date(),
              tool: 'manage_pull_request_reviews'
            }
          };
        }
        if (params.reviewers.length > 10) {
          return {
            success: false,
            error: {
              code: -32602,
              message: 'Maximum 10 reviewers allowed per pull request',
              details: { reviewers_count: params.reviewers.length, max_reviewers: 10 }
            },
            metadata: {
              timestamp: new Date(),
              tool: 'manage_pull_request_reviews'
            }
          };
        }
        break;

      case 'submit_review':
      case 'approve':
      case 'request_changes':
        if (!params.reviewer) {
          return {
            success: false,
            error: {
              code: -32602,
              message: 'Reviewer is required for submit_review, approve, and request_changes actions',
              details: { action: params.action, required: 'reviewer' }
            },
            metadata: {
              timestamp: new Date(),
              tool: 'manage_pull_request_reviews'
            }
          };
        }
        break;

      case 'dismiss_review':
        if (!params.reviewer || !params.review_id) {
          return {
            success: false,
            error: {
              code: -32602,
              message: 'Reviewer and review_id are required for dismiss_review action',
              details: { action: params.action, required: ['reviewer', 'review_id'] }
            },
            metadata: {
              timestamp: new Date(),
              tool: 'manage_pull_request_reviews'
            }
          };
        }
        break;

      case 'list_reviews':
        // No additional validation needed
        break;

      default:
        return {
          success: false,
          error: {
            code: -32602,
            message: 'Invalid action specified',
            details: { 
              action: params.action, 
              valid_actions: ['assign_reviewers', 'submit_review', 'approve', 'request_changes', 'dismiss_review', 'list_reviews'] 
            }
          },
          metadata: {
            timestamp: new Date(),
            tool: 'manage_pull_request_reviews'
          }
        };
    }

    // Validate review comment length if provided
    if (params.review_comment && params.review_comment.length > 5000) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Review comment must be 5,000 characters or less',
          details: { comment_length: params.review_comment.length, max_length: 5000 }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'manage_pull_request_reviews'
        }
      };
    }

    // TODO: Implement actual Bitbucket API call
    // This is a placeholder implementation
    const pullRequestNumber = parseInt(params.pull_request_id) || 1;
    const pullRequestId = `pr_${pullRequestNumber}_${Date.now()}`;

    let result: any = {};

    switch (params.action) {
      case 'assign_reviewers':
        result = {
          action: 'assign_reviewers',
          pull_request: {
            id: pullRequestId,
            number: pullRequestNumber,
            reviewers: params.reviewers.map((reviewer: string) => ({
              username: reviewer,
              display_name: reviewer,
              uuid: `user-uuid-${reviewer}`,
              links: {
                self: {
                  href: `https://api.bitbucket.org/2.0/users/${reviewer}`
                }
              }
            }))
          },
          message: `Assigned ${params.reviewers.length} reviewers to pull request #${pullRequestNumber}`
        };
        break;

      case 'submit_review':
        result = {
          action: 'submit_review',
          review: {
            id: `review_${Date.now()}`,
            reviewer: {
              username: params.reviewer,
              display_name: params.reviewer,
              uuid: `user-uuid-${params.reviewer}`
            },
            state: 'pending',
            comment: params.review_comment || 'Review submitted',
            submitted_on: new Date().toISOString(),
            links: {
              self: {
                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/pullrequests/${pullRequestNumber}/reviews/review_${Date.now()}`
              }
            }
          },
          message: `Review submitted by ${params.reviewer} for pull request #${pullRequestNumber}`
        };
        break;

      case 'approve':
        result = {
          action: 'approve',
          review: {
            id: `review_${Date.now()}`,
            reviewer: {
              username: params.reviewer,
              display_name: params.reviewer,
              uuid: `user-uuid-${params.reviewer}`
            },
            state: 'approved',
            comment: params.review_comment || 'Changes approved',
            submitted_on: new Date().toISOString(),
            approved: params.approve_changes !== false,
            links: {
              self: {
                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/pullrequests/${pullRequestNumber}/reviews/review_${Date.now()}`
              }
            }
          },
          message: `Pull request #${pullRequestNumber} approved by ${params.reviewer}`
        };
        break;

      case 'request_changes':
        result = {
          action: 'request_changes',
          review: {
            id: `review_${Date.now()}`,
            reviewer: {
              username: params.reviewer,
              display_name: params.reviewer,
              uuid: `user-uuid-${params.reviewer}`
            },
            state: 'changes_requested',
            comment: params.review_comment || 'Changes requested',
            reason: params.request_changes_reason || 'Please address the requested changes',
            submitted_on: new Date().toISOString(),
            links: {
              self: {
                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/pullrequests/${pullRequestNumber}/reviews/review_${Date.now()}`
              }
            }
          },
          message: `Changes requested by ${params.reviewer} for pull request #${pullRequestNumber}`
        };
        break;

      case 'dismiss_review':
        result = {
          action: 'dismiss_review',
          review: {
            id: params.review_id,
            reviewer: {
              username: params.reviewer,
              display_name: params.reviewer,
              uuid: `user-uuid-${params.reviewer}`
            },
            state: 'dismissed',
            dismissed_on: new Date().toISOString(),
            dismiss_reason: params.dismiss_reason || 'Review dismissed',
            links: {
              self: {
                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/pullrequests/${pullRequestNumber}/reviews/${params.review_id}`
              }
            }
          },
          message: `Review ${params.review_id} dismissed by ${params.reviewer}`
        };
        break;

      case 'list_reviews':
        result = {
          action: 'list_reviews',
          pull_request: {
            id: pullRequestId,
            number: pullRequestNumber
          },
          reviews: [
            {
              id: 'review-1',
              reviewer: {
                username: 'reviewer1',
                display_name: 'Reviewer One',
                uuid: 'user-uuid-reviewer1'
              },
              state: 'approved',
              comment: 'Looks good to me!',
              submitted_on: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              links: {
                self: {
                  href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/pullrequests/${pullRequestNumber}/reviews/review-1`
                }
              }
            },
            {
              id: 'review-2',
              reviewer: {
                username: 'reviewer2',
                display_name: 'Reviewer Two',
                uuid: 'user-uuid-reviewer2'
              },
              state: 'pending',
              submitted_on: null,
              links: {
                self: {
                  href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/pullrequests/${pullRequestNumber}/reviews/review-2`
                }
              }
            }
          ],
          message: `Retrieved ${params.include_review_history ? 'review history' : 'current reviews'} for pull request #${pullRequestNumber}`
        };
        break;
    }

    // Log the review management action
    context.session?.emit('tool:executed', 'manage_pull_request_reviews', {
      repository: params.repository,
      workspace: params.workspace,
      pull_request_number: pullRequestNumber,
      action: params.action,
      reviewer: params.reviewer || null,
      reviewers_count: params.reviewers?.length || 0
    });

    return {
      success: true,
      data: result,
      metadata: {
        timestamp: new Date(),
        tool: 'manage_pull_request_reviews',
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
        tool: 'manage_pull_request_reviews',
        error_type: error instanceof Error ? error.constructor.name : 'Unknown'
      }
    };
  }
};

/**
 * Manage Pull Request Reviews Tool Definition
 */
export const managePullRequestReviewsTool: Tool = {
  name: 'manage_pull_request_reviews',
  description: 'Manage pull request reviews, comments, and approvals with comprehensive workflow support and review history tracking',
  parameters: managePullRequestReviewsParameters,
  category: 'pull_request_management',
  version: '1.0.0',
  enabled: true,
  execute: managePullRequestReviewsExecutor,
  metadata: {
    api_endpoint: '/2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/reviews',
    supported_apis: ['bitbucket_cloud', 'bitbucket_data_center'],
    requires_auth: true,
    rate_limit: '1000/hour'
  }
};

export default managePullRequestReviewsTool;
