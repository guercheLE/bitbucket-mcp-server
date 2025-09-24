/**
 * Advanced Issue Search Tool
 * 
 * MCP tool for advanced issue search and filtering in Bitbucket repositories.
 * Supports complex filter combinations, saved searches, and search result export.
 * 
 * Features:
 * - Advanced issue search with complex filter combinations
 * - Saved search and filter management
 * - Search result export capabilities
 * - Search performance optimization
 */

import { Tool, ToolParameter, ToolExecutor, ToolResult, ToolExecutionContext } from '../../types/index.js';

/**
 * Advanced Issue Search Tool Parameters
 */
const advancedIssueSearchParameters: ToolParameter[] = [
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
    description: 'Search action to perform',
    required: true,
    schema: {
      enum: ['search', 'save_search', 'load_search', 'list_saved_searches', 'delete_saved_search', 'export_results']
    }
  },
  {
    name: 'search_query',
    type: 'string',
    description: 'Search query string',
    required: false,
    schema: {
      maxLength: 500
    }
  },
  {
    name: 'filters',
    type: 'object',
    description: 'Complex filter combinations',
    required: false,
    schema: {
      type: 'object',
      properties: {
        state: {
          type: 'array',
          items: { type: 'string', enum: ['new', 'open', 'resolved', 'on hold', 'invalid', 'duplicate', 'wontfix', 'closed'] }
        },
        kind: {
          type: 'array',
          items: { type: 'string', enum: ['bug', 'enhancement', 'proposal', 'task'] }
        },
        priority: {
          type: 'array',
          items: { type: 'string', enum: ['trivial', 'minor', 'major', 'critical', 'blocker'] }
        },
        assignee: {
          type: 'array',
          items: { type: 'string', pattern: '^[a-zA-Z0-9@._-]+$' }
        },
        reporter: {
          type: 'array',
          items: { type: 'string', pattern: '^[a-zA-Z0-9@._-]+$' }
        },
        labels: {
          type: 'array',
          items: { type: 'string', pattern: '^[a-zA-Z0-9_-]+$' }
        },
        milestone: {
          type: 'array',
          items: { type: 'string', pattern: '^[a-zA-Z0-9_-]+$' }
        },
        component: {
          type: 'array',
          items: { type: 'string', pattern: '^[a-zA-Z0-9_-]+$' }
        },
        version: {
          type: 'array',
          items: { type: 'string', pattern: '^[a-zA-Z0-9._-]+$' }
        },
        created_date: {
          type: 'object',
          properties: {
            from: { type: 'string', format: 'date' },
            to: { type: 'string', format: 'date' }
          }
        },
        updated_date: {
          type: 'object',
          properties: {
            from: { type: 'string', format: 'date' },
            to: { type: 'string', format: 'date' }
          }
        },
        has_comments: { type: 'boolean' },
        has_attachments: { type: 'boolean' },
        has_relationships: { type: 'boolean' }
      }
    }
  },
  {
    name: 'sort',
    type: 'string',
    description: 'Sort issues by field',
    required: false,
    default: 'created_on',
    schema: {
      enum: ['created_on', 'updated_on', 'priority', 'kind', 'state', 'title', 'assignee', 'reporter']
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
  },
  {
    name: 'saved_search_name',
    type: 'string',
    description: 'Name for saving or loading a search',
    required: false,
    schema: {
      pattern: '^[a-zA-Z0-9_-]+$',
      minLength: 1,
      maxLength: 100
    }
  },
  {
    name: 'saved_search_description',
    type: 'string',
    description: 'Description for saved search',
    required: false,
    schema: {
      maxLength: 500
    }
  },
  {
    name: 'export_format',
    type: 'string',
    description: 'Export format for search results',
    required: false,
    default: 'json',
    schema: {
      enum: ['json', 'csv', 'xml', 'html']
    }
  },
  {
    name: 'include_metadata',
    type: 'boolean',
    description: 'Include metadata in search results',
    required: false,
    default: true
  }
];

/**
 * Advanced Issue Search Tool Executor
 */
const advancedIssueSearchExecutor: ToolExecutor = async (params: Record<string, any>, context: ToolExecutionContext): Promise<ToolResult> => {
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
          tool: 'advanced_issue_search'
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
          tool: 'advanced_issue_search'
        }
      };
    }

    // Validate action-specific parameters
    if (params.action === 'search' && !params.search_query && !params.filters) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Search query or filters are required for search action',
          details: { required_for_action: 'search' }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'advanced_issue_search'
        }
      };
    }

    if (['save_search', 'load_search', 'delete_saved_search'].includes(params.action) && !params.saved_search_name) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Saved search name is required for this action',
          details: { required_for_actions: ['save_search', 'load_search', 'delete_saved_search'] }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'advanced_issue_search'
        }
      };
    }

    // Validate pagination parameters
    const page = Math.max(1, Math.min(1000, params.page || 1));
    const pageSize = Math.max(1, Math.min(100, params.page_size || 20));

    // TODO: Implement actual Bitbucket API call
    // This is a placeholder implementation based on action
    let result: any = {};

    switch (params.action) {
      case 'search':
        // Mock search results
        const mockIssues = [
          {
            id: 'issue_1',
            number: 1,
            title: 'Fix authentication bug in login flow',
            content: {
              raw: 'Users are experiencing issues with the login flow when using OAuth.',
              markup: 'markdown'
            },
            kind: 'bug',
            priority: 'critical',
            state: 'open',
            assignee: {
              username: 'developer1',
              display_name: 'Developer One'
            },
            reporter: {
              username: 'user1',
              display_name: 'User One'
            },
            labels: ['bug', 'authentication', 'critical'],
            milestone: 'v2.1.0',
            component: 'auth',
            version: '2.0.0',
            created_on: '2024-09-20T10:30:00Z',
            updated_on: '2024-09-23T14:45:00Z',
            comment_count: 3,
            attachment_count: 1,
            relationship_count: 2,
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
              markup: 'markdown'
            },
            kind: 'enhancement',
            priority: 'minor',
            state: 'new',
            assignee: null,
            reporter: {
              username: 'user2',
              display_name: 'User Two'
            },
            labels: ['enhancement', 'ui', 'theme'],
            milestone: 'v2.2.0',
            component: 'ui',
            version: null,
            created_on: '2024-09-21T09:15:00Z',
            updated_on: '2024-09-21T09:15:00Z',
            comment_count: 0,
            attachment_count: 0,
            relationship_count: 0,
            links: {
              self: {
                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/issues/2`
              },
              html: {
                href: `https://bitbucket.org/${params.workspace}/${params.repository}/issues/2`
              }
            }
          }
        ];

        // Apply filters if provided
        let filteredIssues = mockIssues;

        if (params.filters) {
          if (params.filters.state && params.filters.state.length > 0) {
            filteredIssues = filteredIssues.filter(issue => params.filters.state.includes(issue.state));
          }
          if (params.filters.kind && params.filters.kind.length > 0) {
            filteredIssues = filteredIssues.filter(issue => params.filters.kind.includes(issue.kind));
          }
          if (params.filters.priority && params.filters.priority.length > 0) {
            filteredIssues = filteredIssues.filter(issue => params.filters.priority.includes(issue.priority));
          }
          if (params.filters.assignee && params.filters.assignee.length > 0) {
            filteredIssues = filteredIssues.filter(issue => 
              issue.assignee && params.filters.assignee.includes(issue.assignee.username)
            );
          }
          if (params.filters.labels && params.filters.labels.length > 0) {
            filteredIssues = filteredIssues.filter(issue =>
              params.filters.labels.some((label: string) => issue.labels.includes(label))
            );
          }
          if (params.filters.has_comments !== undefined) {
            filteredIssues = filteredIssues.filter(issue => 
              params.filters.has_comments ? issue.comment_count > 0 : issue.comment_count === 0
            );
          }
          if (params.filters.has_attachments !== undefined) {
            filteredIssues = filteredIssues.filter(issue => 
              params.filters.has_attachments ? issue.attachment_count > 0 : issue.attachment_count === 0
            );
          }
        }

        // Apply search query if provided
        if (params.search_query) {
          const query = params.search_query.toLowerCase();
          filteredIssues = filteredIssues.filter(issue =>
            issue.title.toLowerCase().includes(query) ||
            issue.content.raw.toLowerCase().includes(query) ||
            issue.labels.some(label => label.toLowerCase().includes(query))
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

        result = {
          action: 'search',
          repository: params.repository,
          workspace: params.workspace,
          search_query: params.search_query || null,
          filters: params.filters || null,
          issues: paginatedIssues,
          pagination: {
            page: page,
            page_size: pageSize,
            total_issues: filteredIssues.length,
            total_pages: Math.ceil(filteredIssues.length / pageSize),
            has_next: endIndex < filteredIssues.length,
            has_previous: page > 1
          },
          sort: {
            field: sortField,
            direction: sortDirection
          },
          search_metadata: {
            execution_time: Date.now() - context.request.timestamp.getTime(),
            filters_applied: params.filters ? Object.keys(params.filters).length : 0,
            query_length: params.search_query ? params.search_query.length : 0
          },
          message: `Search completed. Found ${filteredIssues.length} issues matching criteria.`
        };
        break;

      case 'save_search':
        result = {
          action: 'save_search',
          repository: params.repository,
          workspace: params.workspace,
          saved_search: {
            name: params.saved_search_name,
            description: params.saved_search_description || null,
            search_query: params.search_query || null,
            filters: params.filters || null,
            sort: {
              field: params.sort || 'created_on',
              direction: params.sort_direction || 'desc'
            },
            created_at: new Date().toISOString(),
            created_by: {
              username: 'current_user',
              display_name: 'Current User'
            }
          },
          message: `Search saved as '${params.saved_search_name}'`
        };
        break;

      case 'load_search':
        result = {
          action: 'load_search',
          repository: params.repository,
          workspace: params.workspace,
          saved_search: {
            name: params.saved_search_name,
            description: 'Critical bugs in authentication system',
            search_query: 'authentication bug critical',
            filters: {
              state: ['open', 'new'],
              priority: ['critical', 'blocker'],
              labels: ['bug', 'authentication']
            },
            sort: {
              field: 'priority',
              direction: 'desc'
            },
            created_at: '2024-09-20T10:00:00Z',
            created_by: {
              username: 'user1',
              display_name: 'User One'
            }
          },
          message: `Search '${params.saved_search_name}' loaded successfully`
        };
        break;

      case 'list_saved_searches':
        result = {
          action: 'list_saved_searches',
          repository: params.repository,
          workspace: params.workspace,
          saved_searches: [
            {
              name: 'critical_bugs',
              description: 'Critical bugs in authentication system',
              created_at: '2024-09-20T10:00:00Z',
              created_by: {
                username: 'user1',
                display_name: 'User One'
              },
              last_used: '2024-09-23T14:30:00Z'
            },
            {
              name: 'my_assigned_issues',
              description: 'Issues assigned to me',
              created_at: '2024-09-21T09:00:00Z',
              created_by: {
                username: 'developer1',
                display_name: 'Developer One'
              },
              last_used: '2024-09-23T12:15:00Z'
            },
            {
              name: 'enhancement_requests',
              description: 'All enhancement requests',
              created_at: '2024-09-22T15:30:00Z',
              created_by: {
                username: 'user2',
                display_name: 'User Two'
              },
              last_used: null
            }
          ],
          total_searches: 3,
          message: 'Saved searches retrieved successfully'
        };
        break;

      case 'delete_saved_search':
        result = {
          action: 'delete_saved_search',
          repository: params.repository,
          workspace: params.workspace,
          deleted_search: {
            name: params.saved_search_name
          },
          deleted_at: new Date().toISOString(),
          deleted_by: {
            username: 'current_user',
            display_name: 'Current User'
          },
          message: `Saved search '${params.saved_search_name}' deleted successfully`
        };
        break;

      case 'export_results':
        result = {
          action: 'export_results',
          repository: params.repository,
          workspace: params.workspace,
          export: {
            format: params.export_format || 'json',
            filename: `issue_search_results_${new Date().toISOString().split('T')[0]}.${params.export_format || 'json'}`,
            download_url: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/exports/issue_search_${Date.now()}`,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
            record_count: 2,
            export_metadata: {
              search_query: params.search_query || null,
              filters: params.filters || null,
              sort: {
                field: params.sort || 'created_on',
                direction: params.sort_direction || 'desc'
              },
              exported_at: new Date().toISOString(),
              exported_by: {
                username: 'current_user',
                display_name: 'Current User'
              }
            }
          },
          message: `Search results exported in ${params.export_format || 'json'} format`
        };
        break;

      default:
        return {
          success: false,
          error: {
            code: -32602,
            message: 'Invalid action specified',
            details: { valid_actions: ['search', 'save_search', 'load_search', 'list_saved_searches', 'delete_saved_search', 'export_results'] }
          },
          metadata: {
            timestamp: new Date(),
            tool: 'advanced_issue_search'
          }
        };
    }

    // Log the search action
    context.session?.emit('tool:executed', 'advanced_issue_search', {
      action: params.action,
      repository: params.repository,
      workspace: params.workspace,
      search_query: params.search_query,
      saved_search_name: params.saved_search_name
    });

    return {
      success: true,
      data: result,
      metadata: {
        timestamp: new Date(),
        tool: 'advanced_issue_search',
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
        tool: 'advanced_issue_search',
        error_type: error instanceof Error ? error.constructor.name : 'Unknown'
      }
    };
  }
};

/**
 * Advanced Issue Search Tool Definition
 */
export const advancedIssueSearchTool: Tool = {
  name: 'advanced_issue_search',
  description: 'Advanced issue search and filtering with complex filter combinations, saved searches, and export capabilities',
  parameters: advancedIssueSearchParameters,
  category: 'issue_management',
  version: '1.0.0',
  enabled: true,
  execute: advancedIssueSearchExecutor,
  metadata: {
    api_endpoint: '/2.0/repositories/{workspace}/{repo_slug}/issues',
    supported_apis: ['bitbucket_cloud', 'bitbucket_data_center'],
    requires_auth: true,
    rate_limit: '1000/hour'
  }
};

export default advancedIssueSearchTool;
