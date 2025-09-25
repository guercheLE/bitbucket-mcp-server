/**
 * List Issues Tool
 * 
 * MCP tool for listing and discovering issues in Bitbucket repositories.
 * Supports filtering, search, pagination, and comprehensive metadata extraction.
 * 
 * Features:
 * - Issue listing with filtering and search capabilities
 * - Pagination support for large issue lists
 * - Metadata extraction and sorting
 * - Workspace and repository-based filtering
 */

import { Tool, ToolParameter, ToolExecutor, ToolResult, ToolExecutionContext } from '../../types/index.js';

/**
 * List Issues Tool Parameters
 */
const listIssuesParameters: ToolParameter[] = [
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
    name: 'q',
    type: 'string',
    description: 'Search query for filtering issues',
    required: false,
    schema: {
      maxLength: 200
    }
  },
  {
    name: 'state',
    type: 'string',
    description: 'Filter by issue state',
    required: false,
    schema: {
      enum: ['new', 'open', 'resolved', 'on hold', 'invalid', 'duplicate', 'wontfix', 'closed']
    }
  },
  {
    name: 'kind',
    type: 'string',
    description: 'Filter by issue type',
    required: false,
    schema: {
      enum: ['bug', 'enhancement', 'proposal', 'task']
    }
  },
  {
    name: 'priority',
    type: 'string',
    description: 'Filter by issue priority',
    required: false,
    schema: {
      enum: ['trivial', 'minor', 'major', 'critical', 'blocker']
    }
  },
  {
    name: 'assignee',
    type: 'string',
    description: 'Filter by assigned user',
    required: false,
    schema: {
      pattern: '^[a-zA-Z0-9@._-]+$',
      maxLength: 100
    }
  },
  {
    name: 'reporter',
    type: 'string',
    description: 'Filter by issue reporter',
    required: false,
    schema: {
      pattern: '^[a-zA-Z0-9@._-]+$',
      maxLength: 100
    }
  },
  {
    name: 'labels',
    type: 'array',
    description: 'Filter by labels (any of the specified labels)',
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
    description: 'Filter by milestone',
    required: false,
    schema: {
      pattern: '^[a-zA-Z0-9_-]+$',
      maxLength: 100
    }
  },
  {
    name: 'component',
    type: 'string',
    description: 'Filter by component',
    required: false,
    schema: {
      pattern: '^[a-zA-Z0-9_-]+$',
      maxLength: 100
    }
  },
  {
    name: 'version',
    type: 'string',
    description: 'Filter by version',
    required: false,
    schema: {
      pattern: '^[a-zA-Z0-9._-]+$',
      maxLength: 50
    }
  },
  {
    name: 'sort',
    type: 'string',
    description: 'Sort issues by field',
    required: false,
    default: 'created_on',
    schema: {
      enum: ['created_on', 'updated_on', 'priority', 'kind', 'state', 'title']
    }
  },
  {
    name: 'sort_direction',
    type: 'string',
    description: 'Sort direction',
    required: false,
    default: 'desc',
    schema: {
      enum: ['asc', 'desc']
    }
  },
  {
    name: 'page',
    type: 'number',
    description: 'Page number for pagination',
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
    description: 'Number of issues per page',
    required: false,
    default: 20,
    schema: {
      minimum: 1,
      maximum: 100
    }
  }
];

/**
 * List Issues Tool Executor
 */
const listIssuesExecutor: ToolExecutor = async (params: Record<string, any>, context: ToolExecutionContext): Promise<ToolResult> => {
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
          tool: 'list_issues'
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
          tool: 'list_issues'
        }
      };
    }

    // Validate pagination parameters
    const page = Math.max(1, Math.min(1000, params.page || 1));
    const pageSize = Math.max(1, Math.min(100, params.page_size || 20));

    // TODO: Implement actual Bitbucket API call
    // This is a placeholder implementation
    const mockIssues = [
      {
        id: 'issue_1',
        number: 1,
        title: 'Fix authentication bug in login flow',
        content: {
          raw: 'Users are experiencing issues with the login flow when using OAuth.',
          markup: 'markdown',
          html: '<p>Users are experiencing issues with the login flow when using OAuth.</p>'
        },
        kind: 'bug',
        priority: 'critical',
        state: 'open',
        assignee: {
          username: 'developer1',
          display_name: 'Developer One',
          links: {
            self: {
              href: 'https://api.bitbucket.org/2.0/users/developer1'
            }
          }
        },
        reporter: {
          username: 'user1',
          display_name: 'User One',
          links: {
            self: {
              href: 'https://api.bitbucket.org/2.0/users/user1'
            }
          }
        },
        labels: ['bug', 'authentication', 'critical'],
        milestone: 'v2.1.0',
        component: 'auth',
        version: '2.0.0',
        created_on: '2024-09-20T10:30:00Z',
        updated_on: '2024-09-23T14:45:00Z',
        links: {
          self: {
            href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/issues/1`
          },
          html: {
            href: `https://bitbucket.org/${params.workspace}/${params.repository}/issues/1`
          }
        }
      },
      {
        id: 'issue_2',
        number: 2,
        title: 'Add dark mode support',
        content: {
          raw: 'Implement dark mode theme for better user experience.',
          markup: 'markdown',
          html: '<p>Implement dark mode theme for better user experience.</p>'
        },
        kind: 'enhancement',
        priority: 'minor',
        state: 'new',
        assignee: null,
        reporter: {
          username: 'user2',
          display_name: 'User Two',
          links: {
            self: {
              href: 'https://api.bitbucket.org/2.0/users/user2'
            }
          }
        },
        labels: ['enhancement', 'ui', 'theme'],
        milestone: 'v2.2.0',
        component: 'ui',
        version: null,
        created_on: '2024-09-21T09:15:00Z',
        updated_on: '2024-09-21T09:15:00Z',
        links: {
          self: {
            href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/issues/2`
          },
          html: {
            href: `https://bitbucket.org/${params.workspace}/${params.repository}/issues/2`
          }
        }
      },
      {
        id: 'issue_3',
        number: 3,
        title: 'Update documentation for API v2',
        content: {
          raw: 'Update API documentation to reflect changes in version 2.0.',
          markup: 'markdown',
          html: '<p>Update API documentation to reflect changes in version 2.0.</p>'
        },
        kind: 'task',
        priority: 'major',
        state: 'resolved',
        assignee: {
          username: 'developer2',
          display_name: 'Developer Two',
          links: {
            self: {
              href: 'https://api.bitbucket.org/2.0/users/developer2'
            }
          }
        },
        reporter: {
          username: 'user3',
          display_name: 'User Three',
          links: {
            self: {
              href: 'https://api.bitbucket.org/2.0/users/user3'
            }
          }
        },
        labels: ['documentation', 'api'],
        milestone: 'v2.1.0',
        component: 'docs',
        version: '2.0.0',
        created_on: '2024-09-18T16:20:00Z',
        updated_on: '2024-09-22T11:30:00Z',
        links: {
          self: {
            href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/issues/3`
          },
          html: {
            href: `https://bitbucket.org/${params.workspace}/${params.repository}/issues/3`
          }
        }
      }
    ];

    // Apply filters
    let filteredIssues = mockIssues;

    if (params.state) {
      filteredIssues = filteredIssues.filter(issue => issue.state === params.state);
    }

    if (params.kind) {
      filteredIssues = filteredIssues.filter(issue => issue.kind === params.kind);
    }

    if (params.priority) {
      filteredIssues = filteredIssues.filter(issue => issue.priority === params.priority);
    }

    if (params.assignee) {
      filteredIssues = filteredIssues.filter(issue => 
        issue.assignee && issue.assignee.username === params.assignee
      );
    }

    if (params.labels && params.labels.length > 0) {
      filteredIssues = filteredIssues.filter(issue =>
        params.labels.some((label: string) => issue.labels.includes(label))
      );
    }

    if (params.q) {
      const query = params.q.toLowerCase();
      filteredIssues = filteredIssues.filter(issue =>
        issue.title.toLowerCase().includes(query) ||
        issue.content.raw.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sortField = params.sort || 'created_on';
    const sortDirection = params.sort_direction || 'desc';
    
    filteredIssues.sort((a, b) => {
      let aValue = a[sortField as keyof typeof a];
      let bValue = b[sortField as keyof typeof b];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedIssues = filteredIssues.slice(startIndex, endIndex);

    const result = {
      issues: paginatedIssues,
      pagination: {
        page: page,
        page_size: pageSize,
        total_issues: filteredIssues.length,
        total_pages: Math.ceil(filteredIssues.length / pageSize),
        has_next: endIndex < filteredIssues.length,
        has_previous: page > 1
      },
      filters: {
        workspace: params.workspace,
        repository: params.repository,
        search_query: params.q || null,
        state: params.state || null,
        kind: params.kind || null,
        priority: params.priority || null,
        assignee: params.assignee || null,
        reporter: params.reporter || null,
        labels: params.labels || null,
        milestone: params.milestone || null,
        component: params.component || null,
        version: params.version || null
      },
      sort: {
        field: sortField,
        direction: sortDirection
      }
    };

    // Log the issue listing
    context.session?.emit('tool:executed', 'list_issues', {
      repository: params.repository,
      workspace: params.workspace,
      total_issues: filteredIssues.length,
      page: page,
      page_size: pageSize
    });

    return {
      success: true,
      data: result,
      metadata: {
        timestamp: new Date(),
        tool: 'list_issues',
        execution_time: Date.now() - context.request.timestamp.getTime(),
        workspace: params.workspace,
        repository: params.repository,
        total_issues: filteredIssues.length
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
        tool: 'list_issues',
        error_type: error instanceof Error ? error.constructor.name : 'Unknown'
      }
    };
  }
};

/**
 * List Issues Tool Definition
 */
export const listIssuesTool: Tool = {
  name: 'list_issues',
  description: 'List and discover issues in Bitbucket repositories with filtering, search, and pagination capabilities',
  parameters: listIssuesParameters,
  category: 'issue_management',
  version: '1.0.0',
  enabled: true,
  execute: listIssuesExecutor,
  metadata: {
    api_endpoint: '/2.0/repositories/{workspace}/{repo_slug}/issues',
    supported_apis: ['bitbucket_cloud', 'bitbucket_data_center'],
    requires_auth: true,
    rate_limit: '1000/hour'
  }
};

export default listIssuesTool;
