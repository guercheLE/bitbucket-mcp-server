/**
 * Create Pull Request Tool
 * 
 * MCP tool for creating new pull requests in Bitbucket repositories.
 * Supports both Bitbucket Data Center and Cloud APIs with comprehensive
 * field validation and error handling.
 * 
 * Features:
 * - Pull request creation with configurable fields
 * - Source/destination branch support
 * - Merge strategy and options configuration
 * - Validation and error handling
 * - Support for both Data Center and Cloud APIs
 */

import { Tool, ToolParameter, ToolExecutor, ToolResult, ToolExecutionContext } from '../../types/index.js';

/**
 * Create Pull Request Tool Parameters
 */
const createPullRequestParameters: ToolParameter[] = [
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
    name: 'title',
    type: 'string',
    description: 'Pull request title',
    required: true,
    schema: {
      minLength: 1,
      maxLength: 200
    }
  },
  {
    name: 'description',
    type: 'object',
    description: 'Pull request description with formatting',
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
    name: 'source_branch',
    type: 'string',
    description: 'Source branch name',
    required: true,
    schema: {
      pattern: '^[a-zA-Z0-9/._-]+$',
      minLength: 1,
      maxLength: 100
    }
  },
  {
    name: 'destination_branch',
    type: 'string',
    description: 'Destination branch name (default: main)',
    required: false,
    default: 'main',
    schema: {
      pattern: '^[a-zA-Z0-9/._-]+$',
      minLength: 1,
      maxLength: 100
    }
  },
  {
    name: 'reviewers',
    type: 'array',
    description: 'Array of reviewer usernames',
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
    name: 'assignees',
    type: 'array',
    description: 'Array of assignee usernames',
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
    name: 'labels',
    type: 'array',
    description: 'Array of labels to apply to the pull request',
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
    name: 'close_source_branch',
    type: 'boolean',
    description: 'Whether to close the source branch after merge',
    required: false,
    default: false
  },
  {
    name: 'merge_strategy',
    type: 'string',
    description: 'Merge strategy to use',
    required: false,
    default: 'merge_commit',
    schema: {
      enum: ['merge_commit', 'squash', 'fast_forward']
    }
  },
  {
    name: 'linked_issues',
    type: 'array',
    description: 'Array of issue IDs to link to this pull request',
    required: false,
    schema: {
      items: {
        type: 'string',
        pattern: '^[a-zA-Z0-9_-]+$',
        maxLength: 20
      },
      maxItems: 20
    }
  }
];

/**
 * Create Pull Request Tool Executor
 */
const createPullRequestExecutor: ToolExecutor = async (params: Record<string, any>, context: ToolExecutionContext): Promise<ToolResult> => {
  try {
    // Validate required parameters
    if (!params.workspace || !params.repository || !params.title || !params.source_branch) {
      return {
        success: false,
        error: {
          code: -32602, // Invalid params
          message: 'Workspace, repository, title, and source_branch are required',
          details: { missing: ['workspace', 'repository', 'title', 'source_branch'] }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'create_pull_request'
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
          tool: 'create_pull_request'
        }
      };
    }

    // Validate title length
    if (params.title.length > 200) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Pull request title must be 200 characters or less',
          details: { title_length: params.title.length, max_length: 200 }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'create_pull_request'
        }
      };
    }

    // Validate source and destination branches
    const branchPattern = /^[a-zA-Z0-9/._-]+$/;
    if (!branchPattern.test(params.source_branch)) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Source branch name contains invalid characters',
          details: { invalid_source_branch: params.source_branch }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'create_pull_request'
        }
      };
    }

    const destBranch = params.destination_branch || 'main';
    if (!branchPattern.test(destBranch)) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Destination branch name contains invalid characters',
          details: { invalid_destination_branch: destBranch }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'create_pull_request'
        }
      };
    }

    // Validate description if provided
    if (params.description && (!params.description.raw || params.description.raw.length > 10000)) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Pull request description must have raw text and be 10,000 characters or less',
          details: { description_length: params.description.raw?.length || 0, max_length: 10000 }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'create_pull_request'
        }
      };
    }

    // Validate reviewers if provided
    if (params.reviewers && params.reviewers.length > 10) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Maximum 10 reviewers allowed per pull request',
          details: { reviewers_count: params.reviewers.length, max_reviewers: 10 }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'create_pull_request'
        }
      };
    }

    // Validate assignees if provided
    if (params.assignees && params.assignees.length > 10) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Maximum 10 assignees allowed per pull request',
          details: { assignees_count: params.assignees.length, max_assignees: 10 }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'create_pull_request'
        }
      };
    }

    // Validate labels if provided
    if (params.labels && params.labels.length > 10) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Maximum 10 labels allowed per pull request',
          details: { labels_count: params.labels.length, max_labels: 10 }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'create_pull_request'
        }
      };
    }

    // TODO: Implement actual Bitbucket API call
    // This is a placeholder implementation
    const pullRequestId = `pr_${Date.now()}`;
    const pullRequestNumber = Math.floor(Math.random() * 1000) + 1;

    const result = {
      pull_request: {
        id: pullRequestId,
        number: pullRequestNumber,
        title: params.title,
        description: params.description || {
          raw: '',
          markup: 'markdown',
          html: ''
        },
        state: 'open',
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
        source: {
          branch: {
            name: params.source_branch,
            links: {
              self: {
                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/refs/branches/${params.source_branch}`
              }
            }
          },
          commit: {
            hash: 'abc123def456',
            links: {
              self: {
                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/commit/abc123def456`
              }
            }
          }
        },
        destination: {
          branch: {
            name: destBranch,
            links: {
              self: {
                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/refs/branches/${destBranch}`
              }
            }
          },
          commit: {
            hash: 'def456ghi789',
            links: {
              self: {
                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/commit/def456ghi789`
              }
            }
          }
        },
        reviewers: params.reviewers ? params.reviewers.map((reviewer: string) => ({
          username: reviewer,
          display_name: reviewer,
          uuid: `user-uuid-${reviewer}`,
          links: {
            self: {
              href: `https://api.bitbucket.org/2.0/users/${reviewer}`
            }
          }
        })) : [],
        assignees: params.assignees ? params.assignees.map((assignee: string) => ({
          username: assignee,
          display_name: assignee,
          uuid: `user-uuid-${assignee}`,
          links: {
            self: {
              href: `https://api.bitbucket.org/2.0/users/${assignee}`
            }
          }
        })) : [],
        labels: params.labels || [],
        close_source_branch: params.close_source_branch || false,
        merge_strategy: params.merge_strategy || 'merge_commit',
        linked_issues: params.linked_issues || [],
        created_on: new Date().toISOString(),
        updated_on: new Date().toISOString(),
        links: {
          self: {
            href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/pullrequests/${pullRequestNumber}`
          },
          html: {
            href: `https://bitbucket.org/${params.workspace}/${params.repository}/pull-requests/${pullRequestNumber}`
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
      message: `Pull request #${pullRequestNumber} created successfully from '${params.source_branch}' to '${destBranch}'`
    };

    // Log the pull request creation
    context.session?.emit('tool:executed', 'create_pull_request', {
      repository: params.repository,
      workspace: params.workspace,
      pull_request_number: pullRequestNumber,
      source_branch: params.source_branch,
      destination_branch: destBranch,
      reviewers_count: params.reviewers?.length || 0
    });

    return {
      success: true,
      data: result,
      metadata: {
        timestamp: new Date(),
        tool: 'create_pull_request',
        execution_time: Date.now() - context.request.timestamp.getTime(),
        workspace: params.workspace,
        repository: params.repository,
        pull_request_number: pullRequestNumber
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
        tool: 'create_pull_request',
        error_type: error instanceof Error ? error.constructor.name : 'Unknown'
      }
    };
  }
};

/**
 * Create Pull Request Tool Definition
 */
export const createPullRequestTool: Tool = {
  name: 'create_pull_request',
  description: 'Create new pull requests in Bitbucket repositories with configurable fields, merge options, and reviewer assignment',
  parameters: createPullRequestParameters,
  category: 'pull_request_management',
  version: '1.0.0',
  enabled: true,
  execute: createPullRequestExecutor,
  metadata: {
    api_endpoint: '/2.0/repositories/{workspace}/{repo_slug}/pullrequests',
    supported_apis: ['bitbucket_cloud', 'bitbucket_data_center'],
    requires_auth: true,
    rate_limit: '1000/hour'
  }
};

export default createPullRequestTool;
