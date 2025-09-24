/**
 * Get Issue Tool
 * 
 * MCP tool for retrieving comprehensive issue information from Bitbucket repositories.
 * Supports detailed metadata collection, history tracking, and relationship discovery.
 * 
 * Features:
 * - Issue detail retrieval with complete metadata
 * - Issue history and activity tracking
 * - Issue relationship discovery
 * - Issue attachment and comment retrieval
 */

import { Tool, ToolParameter, ToolExecutor, ToolResult, ToolExecutionContext } from '../../types/index.js';

/**
 * Get Issue Tool Parameters
 */
const getIssueParameters: ToolParameter[] = [
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
    name: 'include_comments',
    type: 'boolean',
    description: 'Include issue comments in the response',
    required: false,
    default: true
  },
  {
    name: 'include_attachments',
    type: 'boolean',
    description: 'Include issue attachments in the response',
    required: false,
    default: true
  },
  {
    name: 'include_history',
    type: 'boolean',
    description: 'Include issue history and activity log',
    required: false,
    default: true
  },
  {
    name: 'include_relationships',
    type: 'boolean',
    description: 'Include related issues, commits, and pull requests',
    required: false,
    default: true
  },
  {
    name: 'include_watchers',
    type: 'boolean',
    description: 'Include issue watchers and subscribers',
    required: false,
    default: false
  }
];

/**
 * Get Issue Tool Executor
 */
const getIssueExecutor: ToolExecutor = async (params: Record<string, any>, context: ToolExecutionContext): Promise<ToolResult> => {
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
          tool: 'get_issue'
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
          tool: 'get_issue'
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
          tool: 'get_issue'
        }
      };
    }

    // TODO: Implement actual Bitbucket API call
    // This is a placeholder implementation
    const issueNumber = parseInt(params.issue_id) || 1;

    const result: any = {
      issue: {
        id: `issue_${params.issue_id}`,
        number: issueNumber,
        title: 'Fix authentication bug in login flow',
        content: {
          raw: 'Users are experiencing issues with the login flow when using OAuth. The authentication token is not being properly validated, causing users to be redirected to the login page even after successful authentication.',
          markup: 'markdown',
          html: '<p>Users are experiencing issues with the login flow when using OAuth. The authentication token is not being properly validated, causing users to be redirected to the login page even after successful authentication.</p>'
        },
        kind: 'bug',
        priority: 'critical',
        state: 'open',
        assignee: {
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
        reporter: {
          username: 'user1',
          display_name: 'User One',
          uuid: 'user-uuid-2',
          links: {
            self: {
              href: 'https://api.bitbucket.org/2.0/users/user1'
            },
            avatar: {
              href: 'https://bitbucket.org/account/user1/avatar/32/'
            }
          }
        },
        labels: ['bug', 'authentication', 'critical', 'oauth'],
        milestone: {
          name: 'v2.1.0',
          description: 'Version 2.1.0 release milestone'
        },
        component: {
          name: 'auth',
          description: 'Authentication component'
        },
        version: {
          name: '2.0.0',
          description: 'Version 2.0.0'
        },
        created_on: '2024-09-20T10:30:00Z',
        updated_on: '2024-09-23T14:45:00Z',
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
      }
    };

    // Include comments if requested
    if (params.include_comments !== false) {
      result.comments = [
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
            uuid: 'user-uuid-3',
            links: {
              self: {
                href: 'https://api.bitbucket.org/2.0/users/developer2'
              },
              avatar: {
                href: 'https://bitbucket.org/account/developer2/avatar/32/'
              }
            }
          },
          created_on: '2024-09-21T09:15:00Z',
          updated_on: '2024-09-21T09:15:00Z',
          links: {
            self: {
              href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/issues/${issueNumber}/comments/1`
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
          created_on: '2024-09-22T14:30:00Z',
          updated_on: '2024-09-22T14:30:00Z',
          links: {
            self: {
              href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/issues/${issueNumber}/comments/2`
            }
          }
        }
      ];
    }

    // Include attachments if requested
    if (params.include_attachments !== false) {
      result.attachments = [
        {
          id: 'attachment_1',
          name: 'oauth_error_log.txt',
          size: 1024,
          content_type: 'text/plain',
          links: {
            self: {
              href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/issues/${issueNumber}/attachments/1`
            },
            download: {
              href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/issues/${issueNumber}/attachments/1/download`
            }
          },
          uploaded_by: {
            username: 'user1',
            display_name: 'User One',
            uuid: 'user-uuid-2'
          },
          uploaded_on: '2024-09-20T11:00:00Z'
        }
      ];
    }

    // Include history if requested
    if (params.include_history !== false) {
      result.history = [
        {
          id: 'activity_1',
          type: 'created',
          description: 'Issue created',
          user: {
            username: 'user1',
            display_name: 'User One',
            uuid: 'user-uuid-2'
          },
          created_on: '2024-09-20T10:30:00Z'
        },
        {
          id: 'activity_2',
          type: 'assigned',
          description: 'Issue assigned to Developer One',
          user: {
            username: 'user1',
            display_name: 'User One',
            uuid: 'user-uuid-2'
          },
          created_on: '2024-09-20T10:35:00Z',
          changes: {
            assignee: {
              from: null,
              to: 'developer1'
            }
          }
        },
        {
          id: 'activity_3',
          type: 'labeled',
          description: 'Labels added: bug, authentication, critical',
          user: {
            username: 'user1',
            display_name: 'User One',
            uuid: 'user-uuid-2'
          },
          created_on: '2024-09-20T10:40:00Z',
          changes: {
            labels: {
              from: [],
              to: ['bug', 'authentication', 'critical']
            }
          }
        },
        {
          id: 'activity_4',
          type: 'commented',
          description: 'Comment added',
          user: {
            username: 'developer2',
            display_name: 'Developer Two',
            uuid: 'user-uuid-3'
          },
          created_on: '2024-09-21T09:15:00Z'
        }
      ];
    }

    // Include relationships if requested
    if (params.include_relationships !== false) {
      result.relationships = {
        related_issues: [
          {
            id: 'issue_5',
            number: 5,
            title: 'OAuth token refresh not working',
            state: 'open',
            links: {
              self: {
                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/issues/5`
              },
              html: {
                href: `https://bitbucket.org/${params.workspace}/${params.repository}/issues/5`
              }
            }
          }
        ],
        related_commits: [
          {
            hash: 'abc123def456',
            message: 'Fix OAuth token validation',
            author: {
              username: 'developer1',
              display_name: 'Developer One'
            },
            date: '2024-09-22T16:00:00Z',
            links: {
              self: {
                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/commit/abc123def456`
              },
              html: {
                href: `https://bitbucket.org/${params.workspace}/${params.repository}/commits/abc123def456`
              }
            }
          }
        ],
        related_pull_requests: [
          {
            id: 'pr_10',
            number: 10,
            title: 'Fix OAuth authentication flow',
            state: 'open',
            links: {
              self: {
                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/pullrequests/10`
              },
              html: {
                href: `https://bitbucket.org/${params.workspace}/${params.repository}/pull-requests/10`
              }
            }
          }
        ]
      };
    }

    // Include watchers if requested
    if (params.include_watchers) {
      result.watchers = [
        {
          username: 'user1',
          display_name: 'User One',
          uuid: 'user-uuid-2'
        },
        {
          username: 'developer1',
          display_name: 'Developer One',
          uuid: 'user-uuid-1'
        },
        {
          username: 'developer2',
          display_name: 'Developer Two',
          uuid: 'user-uuid-3'
        }
      ];
    }

    // Log the issue retrieval
    context.session?.emit('tool:executed', 'get_issue', {
      repository: params.repository,
      workspace: params.workspace,
      issue_id: params.issue_id,
      include_comments: params.include_comments !== false,
      include_attachments: params.include_attachments !== false,
      include_history: params.include_history !== false,
      include_relationships: params.include_relationships !== false
    });

    return {
      success: true,
      data: result,
      metadata: {
        timestamp: new Date(),
        tool: 'get_issue',
        execution_time: Date.now() - context.request.timestamp.getTime(),
        workspace: params.workspace,
        repository: params.repository,
        issue_id: params.issue_id
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
        tool: 'get_issue',
        error_type: error instanceof Error ? error.constructor.name : 'Unknown'
      }
    };
  }
};

/**
 * Get Issue Tool Definition
 */
export const getIssueTool: Tool = {
  name: 'get_issue',
  description: 'Retrieve comprehensive issue information including metadata, comments, attachments, history, and relationships',
  parameters: getIssueParameters,
  category: 'issue_management',
  version: '1.0.0',
  enabled: true,
  execute: getIssueExecutor,
  metadata: {
    api_endpoint: '/2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}',
    supported_apis: ['bitbucket_cloud', 'bitbucket_data_center'],
    requires_auth: true,
    rate_limit: '1000/hour'
  }
};

export default getIssueTool;
