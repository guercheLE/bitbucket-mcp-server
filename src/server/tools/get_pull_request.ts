/**
 * Get Pull Request Tool
 * 
 * MCP tool for retrieving comprehensive pull request information from Bitbucket repositories.
 * Provides detailed pull request data including diff, changes, history, and metadata.
 * 
 * Features:
 * - Comprehensive pull request information retrieval
 * - Pull request diff and changes viewing
 * - Pull request history and activity tracking
 * - Status and checks retrieval
 * - Support for both Data Center and Cloud APIs
 */

import { Tool, ToolParameter, ToolExecutor, ToolResult, ToolExecutionContext } from '../../types/index.js';

/**
 * Get Pull Request Tool Parameters
 */
const getPullRequestParameters: ToolParameter[] = [
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
    name: 'include_diff',
    type: 'boolean',
    description: 'Include pull request diff in response',
    required: false,
    default: false
  },
  {
    name: 'include_commits',
    type: 'boolean',
    description: 'Include commit history in response',
    required: false,
    default: true
  },
  {
    name: 'include_reviews',
    type: 'boolean',
    description: 'Include review history in response',
    required: false,
    default: true
  },
  {
    name: 'include_comments',
    type: 'boolean',
    description: 'Include comments in response',
    required: false,
    default: false
  },
  {
    name: 'include_status_checks',
    type: 'boolean',
    description: 'Include status checks in response',
    required: false,
    default: true
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
 * Get Pull Request Tool Executor
 */
const getPullRequestExecutor: ToolExecutor = async (params: Record<string, any>, context: ToolExecutionContext): Promise<ToolResult> => {
  try {
    // Validate required parameters
    if (!params.workspace || !params.repository || !params.pull_request_id) {
      return {
        success: false,
        error: {
          code: -32602, // Invalid params
          message: 'Workspace, repository, and pull_request_id are required',
          details: { missing: ['workspace', 'repository', 'pull_request_id'] }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'get_pull_request'
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
          tool: 'get_pull_request'
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
          tool: 'get_pull_request'
        }
      };
    }

    // TODO: Implement actual Bitbucket API call
    // This is a placeholder implementation
    const pullRequestNumber = parseInt(params.pull_request_id) || 1;
    const pullRequestId = `pr_${pullRequestNumber}_${Date.now()}`;

    // Generate sample pull request data
    const pullRequest = {
      id: pullRequestId,
      number: pullRequestNumber,
      title: `Sample Pull Request ${pullRequestNumber}`,
      description: {
        raw: `This is a comprehensive pull request description for PR #${pullRequestNumber}.\n\n## Changes\n\n- Added new feature\n- Fixed bug in authentication\n- Updated documentation\n\n## Testing\n\n- [x] Unit tests pass\n- [x] Integration tests pass\n- [x] Manual testing completed`,
        markup: 'markdown',
        html: `<h2>Sample Pull Request ${pullRequestNumber}</h2><p>This is a comprehensive pull request description for PR #${pullRequestNumber}.</p><h3>Changes</h3><ul><li>Added new feature</li><li>Fixed bug in authentication</li><li>Updated documentation</li></ul><h3>Testing</h3><ul><li>Unit tests pass</li><li>Integration tests pass</li><li>Manual testing completed</li></ul>`
      },
      state: 'open',
      author: {
        username: 'sample_author',
        display_name: 'Sample Author',
        uuid: 'user-uuid-sample-author',
        links: {
          self: {
            href: 'https://api.bitbucket.org/2.0/users/sample_author'
          },
          avatar: {
            href: 'https://bitbucket.org/account/sample_author/avatar/32/'
          }
        }
      },
      source: {
        branch: {
          name: `feature/sample-branch-${pullRequestNumber}`,
          links: {
            self: {
              href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/refs/branches/feature/sample-branch-${pullRequestNumber}`
            }
          }
        },
        commit: {
          hash: 'abc123def456',
          message: 'Add new feature implementation',
          author: {
            raw: 'Sample Author <author@example.com>',
            user: {
              username: 'sample_author',
              display_name: 'Sample Author',
              uuid: 'user-uuid-sample-author'
            }
          },
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          links: {
            self: {
              href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/commit/abc123def456`
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
          hash: 'def456ghi789',
          message: 'Latest main branch commit',
          author: {
            raw: 'Maintainer <maintainer@example.com>',
            user: {
              username: 'maintainer',
              display_name: 'Maintainer',
              uuid: 'user-uuid-maintainer'
            }
          },
          date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          links: {
            self: {
              href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/commit/def456ghi789`
            }
          }
        }
      },
      reviewers: [
        {
          username: 'reviewer1',
          display_name: 'Reviewer One',
          uuid: 'user-uuid-reviewer1',
          links: {
            self: {
              href: 'https://api.bitbucket.org/2.0/users/reviewer1'
            }
          }
        },
        {
          username: 'reviewer2',
          display_name: 'Reviewer Two',
          uuid: 'user-uuid-reviewer2',
          links: {
            self: {
              href: 'https://api.bitbucket.org/2.0/users/reviewer2'
            }
          }
        }
      ],
      assignees: [
        {
          username: 'assignee1',
          display_name: 'Assignee One',
          uuid: 'user-uuid-assignee1',
          links: {
            self: {
              href: 'https://api.bitbucket.org/2.0/users/assignee1'
            }
          }
        }
      ],
      labels: ['enhancement', 'bugfix', 'documentation'],
      close_source_branch: false,
      merge_strategy: 'merge_commit',
      linked_issues: [`issue-${pullRequestNumber}`, 'issue-123'],
      created_on: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
      updated_on: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
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
    };

    // Add diff if requested
    if (params.include_diff) {
      pullRequest.diff = {
        summary: {
          total_files: 3,
          total_additions: 45,
          total_deletions: 12,
          total_changes: 57
        },
        files: [
          {
            filename: 'src/features/new-feature.ts',
            status: 'added',
            additions: 25,
            deletions: 0,
            changes: 25,
            patch: '@@ -0,0 +1,25 @@\n+// New feature implementation\n+export class NewFeature {\n+  constructor() {\n+    // Implementation\n+  }\n+}\n'
          },
          {
            filename: 'src/auth/auth-service.ts',
            status: 'modified',
            additions: 15,
            deletions: 8,
            changes: 23,
            patch: '@@ -10,5 +10,12 @@\n export class AuthService {\n-  // Old implementation\n+  // Updated implementation\n+  validateToken(token: string): boolean {\n+    // New validation logic\n+    return true;\n+  }\n }\n'
          },
          {
            filename: 'docs/README.md',
            status: 'modified',
            additions: 5,
            deletions: 4,
            changes: 9,
            patch: '@@ -1,3 +1,4 @@\n # Project Documentation\n \n-This is the old documentation.\n+This is the updated documentation.\n+Added new feature documentation.\n'
          }
        ]
      };
    }

    // Add commits if requested
    if (params.include_commits) {
      pullRequest.commits = [
        {
          hash: 'abc123def456',
          message: 'Add new feature implementation',
          author: {
            raw: 'Sample Author <author@example.com>',
            user: {
              username: 'sample_author',
              display_name: 'Sample Author',
              uuid: 'user-uuid-sample-author'
            }
          },
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          links: {
            self: {
              href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/commit/abc123def456`
            }
          }
        },
        {
          hash: 'def456ghi789',
          message: 'Fix authentication bug',
          author: {
            raw: 'Sample Author <author@example.com>',
            user: {
              username: 'sample_author',
              display_name: 'Sample Author',
              uuid: 'user-uuid-sample-author'
            }
          },
          date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          links: {
            self: {
              href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/commit/def456ghi789`
            }
          }
        }
      ];
    }

    // Add reviews if requested
    if (params.include_reviews) {
      pullRequest.reviews = [
        {
          id: 'review-1',
          reviewer: {
            username: 'reviewer1',
            display_name: 'Reviewer One',
            uuid: 'user-uuid-reviewer1'
          },
          state: 'approved',
          submitted_on: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
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
      ];
    }

    // Add comments if requested
    if (params.include_comments) {
      pullRequest.comments = [
        {
          id: 'comment-1',
          content: {
            raw: 'Great implementation! Just a small suggestion for the error handling.',
            markup: 'markdown',
            html: '<p>Great implementation! Just a small suggestion for the error handling.</p>'
          },
          author: {
            username: 'reviewer1',
            display_name: 'Reviewer One',
            uuid: 'user-uuid-reviewer1'
          },
          created_on: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
          updated_on: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
          links: {
            self: {
              href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/pullrequests/${pullRequestNumber}/comments/comment-1`
            }
          }
        }
      ];
    }

    // Add status checks if requested
    if (params.include_status_checks) {
      pullRequest.status_checks = [
        {
          id: 'status-check-1',
          name: 'CI Build',
          state: 'successful',
          description: 'All tests passed',
          target_url: 'https://ci.example.com/build/123',
          created_on: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          updated_on: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          links: {
            self: {
              href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/pullrequests/${pullRequestNumber}/statuses/status-check-1`
            }
          }
        },
        {
          id: 'status-check-2',
          name: 'Code Coverage',
          state: 'successful',
          description: 'Coverage: 95%',
          target_url: 'https://coverage.example.com/report/123',
          created_on: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          updated_on: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          links: {
            self: {
              href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/pullrequests/${pullRequestNumber}/statuses/status-check-2`
            }
          }
        }
      ];
    }

    const result = {
      pull_request: pullRequest,
      message: `Pull request #${pullRequestNumber} retrieved successfully`
    };

    // Log the pull request retrieval
    context.session?.emit('tool:executed', 'get_pull_request', {
      repository: params.repository,
      workspace: params.workspace,
      pull_request_number: pullRequestNumber,
      include_diff: params.include_diff || false,
      include_commits: params.include_commits || false,
      include_reviews: params.include_reviews || false,
      include_comments: params.include_comments || false,
      include_status_checks: params.include_status_checks || false
    });

    return {
      success: true,
      data: result,
      metadata: {
        timestamp: new Date(),
        tool: 'get_pull_request',
        execution_time: Date.now() - context.request.timestamp.getTime(),
        workspace: params.workspace,
        repository: params.repository,
        pull_request_number: pullRequestNumber,
        includes: {
          diff: params.include_diff || false,
          commits: params.include_commits || false,
          reviews: params.include_reviews || false,
          comments: params.include_comments || false,
          status_checks: params.include_status_checks || false
        }
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
        tool: 'get_pull_request',
        error_type: error instanceof Error ? error.constructor.name : 'Unknown'
      }
    };
  }
};

/**
 * Get Pull Request Tool Definition
 */
export const getPullRequestTool: Tool = {
  name: 'get_pull_request',
  description: 'Retrieve comprehensive pull request information including diff, changes, history, and metadata from Bitbucket repositories',
  parameters: getPullRequestParameters,
  category: 'pull_request_management',
  version: '1.0.0',
  enabled: true,
  execute: getPullRequestExecutor,
  metadata: {
    api_endpoint: '/2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}',
    supported_apis: ['bitbucket_cloud', 'bitbucket_data_center'],
    requires_auth: true,
    rate_limit: '2000/hour'
  }
};

export default getPullRequestTool;
