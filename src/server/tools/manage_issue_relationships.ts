/**
 * Manage Issue Relationships Tool
 * 
 * MCP tool for managing issue linking and relationships in Bitbucket repositories.
 * Supports commit and branch linking, pull request relationships, and cross-repository linking.
 * 
 * Features:
 * - Issue linking with commits and branches
 * - Pull request relationship management
 * - Issue dependency tracking
 * - Cross-repository issue linking
 */

import { Tool, ToolParameter, ToolExecutor, ToolResult, ToolExecutionContext } from '../../types/index.js';

/**
 * Manage Issue Relationships Tool Parameters
 */
const manageIssueRelationshipsParameters: ToolParameter[] = [
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
    description: 'Relationship action to perform',
    required: true,
    schema: {
      enum: ['link_commit', 'link_branch', 'link_pull_request', 'link_issue', 'create_dependency', 'remove_relationship', 'list_relationships', 'get_relationship_history']
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
    name: 'commit_hash',
    type: 'string',
    description: 'Commit hash to link (for link_commit action)',
    required: false,
    schema: {
      pattern: '^[a-f0-9]{7,40}$',
      minLength: 7,
      maxLength: 40
    }
  },
  {
    name: 'branch_name',
    type: 'string',
    description: 'Branch name to link (for link_branch action)',
    required: false,
    schema: {
      pattern: '^[a-zA-Z0-9/._-]+$',
      minLength: 1,
      maxLength: 100
    }
  },
  {
    name: 'pull_request_id',
    type: 'string',
    description: 'Pull request ID or number (for link_pull_request action)',
    required: false,
    schema: {
      pattern: '^[a-zA-Z0-9_-]+$',
      minLength: 1,
      maxLength: 20
    }
  },
  {
    name: 'related_issue_id',
    type: 'string',
    description: 'Related issue ID or number (for link_issue action)',
    required: false,
    schema: {
      pattern: '^[a-zA-Z0-9_-]+$',
      minLength: 1,
      maxLength: 20
    }
  },
  {
    name: 'related_workspace',
    type: 'string',
    description: 'Workspace of related issue (for cross-repository linking)',
    required: false,
    schema: {
      pattern: '^[a-zA-Z0-9_-]+$',
      minLength: 1,
      maxLength: 50
    }
  },
  {
    name: 'related_repository',
    type: 'string',
    description: 'Repository of related issue (for cross-repository linking)',
    required: false,
    schema: {
      pattern: '^[a-zA-Z0-9_-]+$',
      minLength: 1,
      maxLength: 100
    }
  },
  {
    name: 'relationship_type',
    type: 'string',
    description: 'Type of relationship between issues',
    required: false,
    default: 'relates_to',
    schema: {
      enum: ['relates_to', 'duplicates', 'blocks', 'is_blocked_by', 'clones', 'is_cloned_by', 'depends_on', 'is_depended_by']
    }
  },
  {
    name: 'relationship_id',
    type: 'string',
    description: 'Relationship ID to remove (for remove_relationship action)',
    required: false,
    schema: {
      pattern: '^[a-zA-Z0-9_-]+$',
      minLength: 1,
      maxLength: 50
    }
  },
  {
    name: 'relationship_reason',
    type: 'string',
    description: 'Reason for creating the relationship',
    required: false,
    schema: {
      maxLength: 500
    }
  }
];

/**
 * Manage Issue Relationships Tool Executor
 */
const manageIssueRelationshipsExecutor: ToolExecutor = async (params: Record<string, any>, context: ToolExecutionContext): Promise<ToolResult> => {
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
          tool: 'manage_issue_relationships'
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
          tool: 'manage_issue_relationships'
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
          tool: 'manage_issue_relationships'
        }
      };
    }

    // Validate action-specific parameters
    if (params.action === 'link_commit' && !params.commit_hash) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Commit hash is required for link_commit action',
          details: { required_for_action: 'link_commit' }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'manage_issue_relationships'
        }
      };
    }

    if (params.action === 'link_branch' && !params.branch_name) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Branch name is required for link_branch action',
          details: { required_for_action: 'link_branch' }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'manage_issue_relationships'
        }
      };
    }

    if (params.action === 'link_pull_request' && !params.pull_request_id) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Pull request ID is required for link_pull_request action',
          details: { required_for_action: 'link_pull_request' }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'manage_issue_relationships'
        }
      };
    }

    if (params.action === 'link_issue' && !params.related_issue_id) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Related issue ID is required for link_issue action',
          details: { required_for_action: 'link_issue' }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'manage_issue_relationships'
        }
      };
    }

    if (params.action === 'remove_relationship' && !params.relationship_id) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Relationship ID is required for remove_relationship action',
          details: { required_for_action: 'remove_relationship' }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'manage_issue_relationships'
        }
      };
    }

    // Validate commit hash format if provided
    if (params.commit_hash && !/^[a-f0-9]{7,40}$/.test(params.commit_hash)) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Commit hash must be a valid SHA hash (7-40 characters)',
          details: { invalid_commit_hash: params.commit_hash }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'manage_issue_relationships'
        }
      };
    }

    // TODO: Implement actual Bitbucket API call
    // This is a placeholder implementation based on action
    let result: any = {};

    switch (params.action) {
      case 'link_commit':
        const relationshipId = `rel_${Date.now()}`;
        const issueNumber = parseInt(params.issue_id) || 1;
        result = {
          action: 'link_commit',
          repository: params.repository,
          workspace: params.workspace,
          issue_id: params.issue_id,
          relationship: {
            id: relationshipId,
            type: 'commit_link',
            source: {
              type: 'issue',
              id: params.issue_id,
              number: issueNumber,
              links: {
                self: {
                  href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/issues/${issueNumber}`
                }
              }
            },
            target: {
              type: 'commit',
              hash: params.commit_hash,
              links: {
                self: {
                  href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/commit/${params.commit_hash}`
                }
              }
            },
            created_at: new Date().toISOString(),
            created_by: {
              username: 'current_user',
              display_name: 'Current User'
            },
            reason: params.relationship_reason || null
          },
          message: `Issue #${issueNumber} linked to commit ${params.commit_hash}`
        };
        break;

      case 'link_branch':
        const branchRelationshipId = `rel_${Date.now()}`;
        const branchIssueNumber = parseInt(params.issue_id) || 1;
        result = {
          action: 'link_branch',
          repository: params.repository,
          workspace: params.workspace,
          issue_id: params.issue_id,
          relationship: {
            id: branchRelationshipId,
            type: 'branch_link',
            source: {
              type: 'issue',
              id: params.issue_id,
              number: branchIssueNumber,
              links: {
                self: {
                  href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/issues/${branchIssueNumber}`
                }
              }
            },
            target: {
              type: 'branch',
              name: params.branch_name,
              links: {
                self: {
                  href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/refs/branches/${params.branch_name}`
                }
              }
            },
            created_at: new Date().toISOString(),
            created_by: {
              username: 'current_user',
              display_name: 'Current User'
            },
            reason: params.relationship_reason || null
          },
          message: `Issue #${branchIssueNumber} linked to branch ${params.branch_name}`
        };
        break;

      case 'link_pull_request':
        const prRelationshipId = `rel_${Date.now()}`;
        const prIssueNumber = parseInt(params.issue_id) || 1;
        result = {
          action: 'link_pull_request',
          repository: params.repository,
          workspace: params.workspace,
          issue_id: params.issue_id,
          relationship: {
            id: prRelationshipId,
            type: 'pull_request_link',
            source: {
              type: 'issue',
              id: params.issue_id,
              number: prIssueNumber,
              links: {
                self: {
                  href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/issues/${prIssueNumber}`
                }
              }
            },
            target: {
              type: 'pull_request',
              id: params.pull_request_id,
              number: parseInt(params.pull_request_id) || 1,
              links: {
                self: {
                  href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/pullrequests/${params.pull_request_id}`
                }
              }
            },
            created_at: new Date().toISOString(),
            created_by: {
              username: 'current_user',
              display_name: 'Current User'
            },
            reason: params.relationship_reason || null
          },
          message: `Issue #${prIssueNumber} linked to pull request #${params.pull_request_id}`
        };
        break;

      case 'link_issue':
        const issueRelationshipId = `rel_${Date.now()}`;
        const linkIssueNumber = parseInt(params.issue_id) || 1;
        const relatedIssueNumber = parseInt(params.related_issue_id) || 1;
        const relatedWorkspace = params.related_workspace || params.workspace;
        const relatedRepository = params.related_repository || params.repository;
        
        result = {
          action: 'link_issue',
          repository: params.repository,
          workspace: params.workspace,
          issue_id: params.issue_id,
          relationship: {
            id: issueRelationshipId,
            type: 'issue_link',
            relationship_type: params.relationship_type || 'relates_to',
            source: {
              type: 'issue',
              id: params.issue_id,
              number: linkIssueNumber,
              repository: {
                name: params.repository,
                workspace: params.workspace
              },
              links: {
                self: {
                  href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/issues/${linkIssueNumber}`
                }
              }
            },
            target: {
              type: 'issue',
              id: params.related_issue_id,
              number: relatedIssueNumber,
              repository: {
                name: relatedRepository,
                workspace: relatedWorkspace
              },
              links: {
                self: {
                  href: `https://api.bitbucket.org/2.0/repositories/${relatedWorkspace}/${relatedRepository}/issues/${relatedIssueNumber}`
                }
              }
            },
            created_at: new Date().toISOString(),
            created_by: {
              username: 'current_user',
              display_name: 'Current User'
            },
            reason: params.relationship_reason || null
          },
          message: `Issue #${linkIssueNumber} linked to issue #${relatedIssueNumber} (${params.relationship_type || 'relates_to'})`
        };
        break;

      case 'list_relationships':
        const listIssueNumber = parseInt(params.issue_id) || 1;
        result = {
          action: 'list_relationships',
          repository: params.repository,
          workspace: params.workspace,
          issue_id: params.issue_id,
          relationships: {
            commits: [
              {
                id: 'rel_1',
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
                  }
                }
              }
            ],
            branches: [
              {
                id: 'rel_2',
                name: 'feature/oauth-fix',
                type: 'feature',
                links: {
                  self: {
                    href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/refs/branches/feature/oauth-fix`
                  }
                }
              }
            ],
            pull_requests: [
              {
                id: 'rel_3',
                number: 10,
                title: 'Fix OAuth authentication flow',
                state: 'open',
                links: {
                  self: {
                    href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/pullrequests/10`
                  }
                }
              }
            ],
            related_issues: [
              {
                id: 'rel_4',
                type: 'blocks',
                issue: {
                  id: '5',
                  number: 5,
                  title: 'OAuth token refresh not working',
                  state: 'open',
                  repository: {
                    name: params.repository,
                    workspace: params.workspace
                  },
                  links: {
                    self: {
                      href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/issues/5`
                    }
                  }
                }
              }
            ]
          },
          total_relationships: 4,
          message: `Relationships retrieved for issue #${listIssueNumber}`
        };
        break;

      case 'remove_relationship':
        const removeIssueNumber = parseInt(params.issue_id) || 1;
        result = {
          action: 'remove_relationship',
          repository: params.repository,
          workspace: params.workspace,
          issue_id: params.issue_id,
          relationship_id: params.relationship_id,
          removed_at: new Date().toISOString(),
          removed_by: {
            username: 'current_user',
            display_name: 'Current User'
          },
          message: `Relationship ${params.relationship_id} removed from issue #${removeIssueNumber}`
        };
        break;

      case 'get_relationship_history':
        const historyIssueNumber = parseInt(params.issue_id) || 1;
        result = {
          action: 'get_relationship_history',
          repository: params.repository,
          workspace: params.workspace,
          issue_id: params.issue_id,
          relationship_history: [
            {
              id: 'rel_1',
              action: 'created',
              type: 'commit_link',
              target: {
                type: 'commit',
                hash: 'abc123def456'
              },
              created_at: '2024-09-22T16:00:00Z',
              created_by: {
                username: 'developer1',
                display_name: 'Developer One'
              }
            },
            {
              id: 'rel_2',
              action: 'created',
              type: 'issue_link',
              relationship_type: 'blocks',
              target: {
                type: 'issue',
                id: '5',
                number: 5
              },
              created_at: '2024-09-23T10:30:00Z',
              created_by: {
                username: 'user1',
                display_name: 'User One'
              }
            }
          ],
          total_relationships: 2,
          message: `Relationship history retrieved for issue #${historyIssueNumber}`
        };
        break;

      default:
        return {
          success: false,
          error: {
            code: -32602,
            message: 'Invalid action specified',
            details: { valid_actions: ['link_commit', 'link_branch', 'link_pull_request', 'link_issue', 'create_dependency', 'remove_relationship', 'list_relationships', 'get_relationship_history'] }
          },
          metadata: {
            timestamp: new Date(),
            tool: 'manage_issue_relationships'
          }
        };
    }

    // Log the relationship action
    context.session?.emit('tool:executed', 'manage_issue_relationships', {
      action: params.action,
      repository: params.repository,
      workspace: params.workspace,
      issue_id: params.issue_id,
      relationship_type: params.relationship_type
    });

    return {
      success: true,
      data: result,
      metadata: {
        timestamp: new Date(),
        tool: 'manage_issue_relationships',
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
        tool: 'manage_issue_relationships',
        error_type: error instanceof Error ? error.constructor.name : 'Unknown'
      }
    };
  }
};

/**
 * Manage Issue Relationships Tool Definition
 */
export const manageIssueRelationshipsTool: Tool = {
  name: 'manage_issue_relationships',
  description: 'Manage issue linking and relationships with commits, branches, pull requests, and cross-repository linking',
  parameters: manageIssueRelationshipsParameters,
  category: 'issue_management',
  version: '1.0.0',
  enabled: true,
  execute: manageIssueRelationshipsExecutor,
  metadata: {
    api_endpoint: '/2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}',
    supported_apis: ['bitbucket_cloud', 'bitbucket_data_center'],
    requires_auth: true,
    rate_limit: '1000/hour'
  }
};

export default manageIssueRelationshipsTool;
