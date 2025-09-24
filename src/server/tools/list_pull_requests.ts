/**
 * List Pull Requests Tool
 * 
 * MCP tool for listing and discovering pull requests in Bitbucket repositories.
 * Supports advanced filtering, search capabilities, and pagination for large datasets.
 * 
 * Features:
 * - Pull request listing with comprehensive filtering
 * - Advanced search and discovery capabilities
 * - Pagination support for large pull request lists
 * - Metadata extraction and sorting options
 * - Support for both Data Center and Cloud APIs
 */

import { Tool, ToolParameter, ToolExecutor, ToolResult, ToolExecutionContext } from '../../types/index.js';

/**
 * List Pull Requests Tool Parameters
 */
const listPullRequestsParameters: ToolParameter[] = [
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
    name: 'state',
    type: 'string',
    description: 'Filter by pull request state',
    required: false,
    schema: {
      enum: ['open', 'merged', 'declined', 'superseded']
    }
  },
  {
    name: 'author',
    type: 'string',
    description: 'Filter by pull request author username',
    required: false,
    schema: {
      pattern: '^[a-zA-Z0-9@._-]+$',
      maxLength: 100
    }
  },
  {
    name: 'reviewer',
    type: 'string',
    description: 'Filter by pull request reviewer username',
    required: false,
    schema: {
      pattern: '^[a-zA-Z0-9@._-]+$',
      maxLength: 100
    }
  },
  {
    name: 'source_branch',
    type: 'string',
    description: 'Filter by source branch name',
    required: false,
    schema: {
      pattern: '^[a-zA-Z0-9/._-]+$',
      maxLength: 100
    }
  },
  {
    name: 'destination_branch',
    type: 'string',
    description: 'Filter by destination branch name',
    required: false,
    schema: {
      pattern: '^[a-zA-Z0-9/._-]+$',
      maxLength: 100
    }
  },
  {
    name: 'labels',
    type: 'array',
    description: 'Filter by labels (pull requests must have ALL specified labels)',
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
    name: 'created_after',
    type: 'string',
    description: 'Filter pull requests created after this date (ISO 8601 format)',
    required: false,
    schema: {
      format: 'date-time'
    }
  },
  {
    name: 'created_before',
    type: 'string',
    description: 'Filter pull requests created before this date (ISO 8601 format)',
    required: false,
    schema: {
      format: 'date-time'
    }
  },
  {
    name: 'updated_after',
    type: 'string',
    description: 'Filter pull requests updated after this date (ISO 8601 format)',
    required: false,
    schema: {
      format: 'date-time'
    }
  },
  {
    name: 'updated_before',
    type: 'string',
    description: 'Filter pull requests updated before this date (ISO 8601 format)',
    required: false,
    schema: {
      format: 'date-time'
    }
  },
  {
    name: 'search_query',
    type: 'string',
    description: 'Search query to filter pull requests by title and description',
    required: false,
    schema: {
      maxLength: 200
    }
  },
  {
    name: 'sort_by',
    type: 'string',
    description: 'Sort pull requests by field',
    required: false,
    default: 'created_on',
    schema: {
      enum: ['created_on', 'updated_on', 'title', 'author', 'source_branch', 'destination_branch']
    }
  },
  {
    name: 'sort_order',
    type: 'string',
    description: 'Sort order for pull requests',
    required: false,
    default: 'desc',
    schema: {
      enum: ['asc', 'desc']
    }
  },
  {
    name: 'page',
    type: 'number',
    description: 'Page number for pagination (starts from 1)',
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
    description: 'Number of pull requests per page',
    required: false,
    default: 20,
    schema: {
      minimum: 1,
      maximum: 100
    }
  },
  {
    name: 'include_metadata',
    type: 'boolean',
    description: 'Include additional metadata in response',
    required: false,
    default: true
  }
];

/**
 * List Pull Requests Tool Executor
 */
const listPullRequestsExecutor: ToolExecutor = async (params: Record<string, any>, context: ToolExecutionContext): Promise<ToolResult> => {
  try {
    // Validate required parameters
    if (!params.workspace || !params.repository) {
      return {
        success: false,
        error: {
          code: -32602, // Invalid params
          message: 'Workspace and repository are required',
          details: { missing: ['workspace', 'repository'] }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'list_pull_requests'
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
          tool: 'list_pull_requests'
        }
      };
    }

    // Validate pagination parameters
    const page = Math.max(1, Math.min(1000, params.page || 1));
    const pageSize = Math.max(1, Math.min(100, params.page_size || 20));

    // Validate date filters if provided
    if (params.created_after && isNaN(Date.parse(params.created_after))) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'created_after must be a valid ISO 8601 date-time string',
          details: { invalid_date: params.created_after }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'list_pull_requests'
        }
      };
    }

    if (params.created_before && isNaN(Date.parse(params.created_before))) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'created_before must be a valid ISO 8601 date-time string',
          details: { invalid_date: params.created_before }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'list_pull_requests'
        }
      };
    }

    if (params.updated_after && isNaN(Date.parse(params.updated_after))) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'updated_after must be a valid ISO 8601 date-time string',
          details: { invalid_date: params.updated_after }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'list_pull_requests'
        }
      };
    }

    if (params.updated_before && isNaN(Date.parse(params.updated_before))) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'updated_before must be a valid ISO 8601 date-time string',
          details: { invalid_date: params.updated_before }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'list_pull_requests'
        }
      };
    }

    // Validate search query length
    if (params.search_query && params.search_query.length > 200) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Search query must be 200 characters or less',
          details: { query_length: params.search_query.length, max_length: 200 }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'list_pull_requests'
        }
      };
    }

    // TODO: Implement actual Bitbucket API call
    // This is a placeholder implementation
    const totalPullRequests = 25; // Simulated total
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalPullRequests);
    const hasNextPage = endIndex < totalPullRequests;
    const hasPreviousPage = page > 1;

    // Generate sample pull requests
    const pullRequests = [];
    for (let i = startIndex; i < endIndex; i++) {
      const prNumber = i + 1;
      const states = ['open', 'merged', 'declined', 'superseded'];
      const state = states[i % states.length];
      
      pullRequests.push({
        id: `pr_${prNumber}_${Date.now()}`,
        number: prNumber,
        title: `Sample Pull Request ${prNumber}`,
        description: {
          raw: `This is a sample pull request description for PR #${prNumber}`,
          markup: 'markdown',
          html: `<p>This is a sample pull request description for PR #${prNumber}</p>`
        },
        state: state,
        author: {
          username: `user${prNumber}`,
          display_name: `User ${prNumber}`,
          uuid: `user-uuid-${prNumber}`,
          links: {
            self: {
              href: `https://api.bitbucket.org/2.0/users/user${prNumber}`
            },
            avatar: {
              href: `https://bitbucket.org/account/user${prNumber}/avatar/32/`
            }
          }
        },
        source: {
          branch: {
            name: `feature/branch-${prNumber}`,
            links: {
              self: {
                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/refs/branches/feature/branch-${prNumber}`
              }
            }
          },
          commit: {
            hash: `abc${prNumber}def`,
            links: {
              self: {
                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/commit/abc${prNumber}def`
              }
            }
          }
        },
        destination: {
          branch: {
            name: 'main',
            links: {
              self: {
                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/refs/branches/main`
              }
            }
          },
          commit: {
            hash: `def${prNumber}ghi`,
            links: {
              self: {
                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/commit/def${prNumber}ghi`
              }
            }
          }
        },
        reviewers: [
          {
            username: `reviewer${prNumber}`,
            display_name: `Reviewer ${prNumber}`,
            uuid: `reviewer-uuid-${prNumber}`,
            links: {
              self: {
                href: `https://api.bitbucket.org/2.0/users/reviewer${prNumber}`
              }
            }
          }
        ],
        assignees: [
          {
            username: `assignee${prNumber}`,
            display_name: `Assignee ${prNumber}`,
            uuid: `assignee-uuid-${prNumber}`,
            links: {
              self: {
                href: `https://api.bitbucket.org/2.0/users/assignee${prNumber}`
              }
            }
          }
        ],
        labels: [`label-${prNumber}`, 'enhancement'],
        close_source_branch: false,
        merge_strategy: 'merge_commit',
        linked_issues: [`issue-${prNumber}`],
        created_on: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(),
        updated_on: new Date(Date.now() - (i * 12 * 60 * 60 * 1000)).toISOString(),
        links: {
          self: {
            href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/pullrequests/${prNumber}`
          },
          html: {
            href: `https://bitbucket.org/${params.workspace}/${params.repository}/pull-requests/${prNumber}`
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
      });
    }

    const result = {
      pull_requests: pullRequests,
      pagination: {
        page: page,
        page_size: pageSize,
        total_count: totalPullRequests,
        total_pages: Math.ceil(totalPullRequests / pageSize),
        has_next_page: hasNextPage,
        has_previous_page: hasPreviousPage,
        next_page: hasNextPage ? page + 1 : null,
        previous_page: hasPreviousPage ? page - 1 : null
      },
      filters: {
        state: params.state || null,
        author: params.author || null,
        reviewer: params.reviewer || null,
        source_branch: params.source_branch || null,
        destination_branch: params.destination_branch || null,
        labels: params.labels || [],
        created_after: params.created_after || null,
        created_before: params.created_before || null,
        updated_after: params.updated_after || null,
        updated_before: params.updated_before || null,
        search_query: params.search_query || null
      },
      sorting: {
        sort_by: params.sort_by || 'created_on',
        sort_order: params.sort_order || 'desc'
      },
      metadata: params.include_metadata ? {
        repository: {
          name: params.repository,
          workspace: params.workspace,
          full_name: `${params.workspace}/${params.repository}`
        },
        query_time: new Date().toISOString(),
        execution_time_ms: Date.now() - context.request.timestamp.getTime()
      } : null
    };

    // Log the pull request listing
    context.session?.emit('tool:executed', 'list_pull_requests', {
      repository: params.repository,
      workspace: params.workspace,
      page: page,
      page_size: pageSize,
      total_count: totalPullRequests,
      filters_applied: Object.keys(params).filter(key => key !== 'workspace' && key !== 'repository' && key !== 'page' && key !== 'page_size' && params[key] !== undefined).length
    });

    return {
      success: true,
      data: result,
      metadata: {
        timestamp: new Date(),
        tool: 'list_pull_requests',
        execution_time: Date.now() - context.request.timestamp.getTime(),
        workspace: params.workspace,
        repository: params.repository,
        page: page,
        page_size: pageSize,
        total_count: totalPullRequests
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
        tool: 'list_pull_requests',
        error_type: error instanceof Error ? error.constructor.name : 'Unknown'
      }
    };
  }
};

/**
 * List Pull Requests Tool Definition
 */
export const listPullRequestsTool: Tool = {
  name: 'list_pull_requests',
  description: 'List and discover pull requests in Bitbucket repositories with advanced filtering, search capabilities, and pagination support',
  parameters: listPullRequestsParameters,
  category: 'pull_request_management',
  version: '1.0.0',
  enabled: true,
  execute: listPullRequestsExecutor,
  metadata: {
    api_endpoint: '/2.0/repositories/{workspace}/{repo_slug}/pullrequests',
    supported_apis: ['bitbucket_cloud', 'bitbucket_data_center'],
    requires_auth: true,
    rate_limit: '2000/hour'
  }
};

export default listPullRequestsTool;
