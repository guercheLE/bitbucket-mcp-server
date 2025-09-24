/**
 * Manage Pull Request Branches Tool
 * 
 * MCP tool for managing pull request branch operations including updates, rebasing, and protection rules.
 * Supports branch comparison, diff tools, and cleanup operations.
 * 
 * Features:
 * - Branch updates and rebasing
 * - Branch protection rule validation
 * - Branch comparison and diff tools
 * - Branch cleanup and deletion
 * - Support for both Data Center and Cloud APIs
 */

import { Tool, ToolParameter, ToolExecutor, ToolResult, ToolExecutionContext } from '../../types/index.js';

/**
 * Manage Pull Request Branches Tool Parameters
 */
const managePullRequestBranchesParameters: ToolParameter[] = [
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
    description: 'Action to perform on the pull request branches',
    required: true,
    schema: {
      enum: ['update_source_branch', 'rebase_source_branch', 'compare_branches', 'validate_branch_protection', 'cleanup_branches', 'list_branches']
    }
  },
  {
    name: 'source_branch',
    type: 'string',
    description: 'Source branch name (for update_source_branch, rebase_source_branch actions)',
    required: false,
    schema: {
      pattern: '^[a-zA-Z0-9/._-]+$',
      minLength: 1,
      maxLength: 100
    }
  },
  {
    name: 'destination_branch',
    type: 'string',
    description: 'Destination branch name (for compare_branches action)',
    required: false,
    default: 'main',
    schema: {
      pattern: '^[a-zA-Z0-9/._-]+$',
      minLength: 1,
      maxLength: 100
    }
  },
  {
    name: 'rebase_strategy',
    type: 'string',
    description: 'Rebase strategy to use (for rebase_source_branch action)',
    required: false,
    default: 'interactive',
    schema: {
      enum: ['interactive', 'automatic', 'force']
    }
  },
  {
    name: 'include_diff',
    type: 'boolean',
    description: 'Include diff information in response (for compare_branches action)',
    required: false,
    default: false
  },
  {
    name: 'include_commits',
    type: 'boolean',
    description: 'Include commit information in response (for compare_branches action)',
    required: false,
    default: true
  },
  {
    name: 'cleanup_merged_branches',
    type: 'boolean',
    description: 'Clean up merged branches (for cleanup_branches action)',
    required: false,
    default: true
  },
  {
    name: 'cleanup_stale_branches',
    type: 'boolean',
    description: 'Clean up stale branches (for cleanup_branches action)',
    required: false,
    default: false
  },
  {
    name: 'stale_days',
    type: 'number',
    description: 'Number of days to consider a branch stale (for cleanup_branches action)',
    required: false,
    default: 30,
    schema: {
      minimum: 1,
      maximum: 365
    }
  },
  {
    name: 'force_cleanup',
    type: 'boolean',
    description: 'Force cleanup even if branches have unmerged changes',
    required: false,
    default: false
  },
  {
    name: 'include_protection_rules',
    type: 'boolean',
    description: 'Include branch protection rules in response (for list_branches action)',
    required: false,
    default: true
  }
];

/**
 * Manage Pull Request Branches Tool Executor
 */
const managePullRequestBranchesExecutor: ToolExecutor = async (params: Record<string, any>, context: ToolExecutionContext): Promise<ToolResult> => {
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
          tool: 'manage_pull_request_branches'
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
          tool: 'manage_pull_request_branches'
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
          tool: 'manage_pull_request_branches'
        }
      };
    }

    // Validate action-specific parameters
    switch (params.action) {
      case 'update_source_branch':
      case 'rebase_source_branch':
        if (!params.source_branch) {
          return {
            success: false,
            error: {
              code: -32602,
              message: 'Source branch is required for update_source_branch and rebase_source_branch actions',
              details: { action: params.action, required: 'source_branch' }
            },
            metadata: {
              timestamp: new Date(),
              tool: 'manage_pull_request_branches'
            }
          };
        }
        break;

      case 'compare_branches':
        if (!params.source_branch) {
          return {
            success: false,
            error: {
              code: -32602,
              message: 'Source branch is required for compare_branches action',
              details: { action: params.action, required: 'source_branch' }
            },
            metadata: {
              timestamp: new Date(),
              tool: 'manage_pull_request_branches'
            }
          };
        }
        break;

      case 'validate_branch_protection':
      case 'cleanup_branches':
      case 'list_branches':
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
              valid_actions: ['update_source_branch', 'rebase_source_branch', 'compare_branches', 'validate_branch_protection', 'cleanup_branches', 'list_branches'] 
            }
          },
          metadata: {
            timestamp: new Date(),
            tool: 'manage_pull_request_branches'
          }
        };
    }

    // Validate branch names if provided
    const branchPattern = /^[a-zA-Z0-9/._-]+$/;
    if (params.source_branch && !branchPattern.test(params.source_branch)) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Source branch name contains invalid characters',
          details: { invalid_source_branch: params.source_branch }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'manage_pull_request_branches'
        }
      };
    }

    if (params.destination_branch && !branchPattern.test(params.destination_branch)) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Destination branch name contains invalid characters',
          details: { invalid_destination_branch: params.destination_branch }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'manage_pull_request_branches'
        }
      };
    }

    // Validate stale days if provided
    if (params.stale_days && (params.stale_days < 1 || params.stale_days > 365)) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Stale days must be between 1 and 365',
          details: { stale_days: params.stale_days, valid_range: '1-365' }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'manage_pull_request_branches'
        }
      };
    }

    // TODO: Implement actual Bitbucket API call
    // This is a placeholder implementation
    const pullRequestNumber = parseInt(params.pull_request_id) || 1;
    const pullRequestId = `pr_${pullRequestNumber}_${Date.now()}`;

    let result: any = {};

    switch (params.action) {
      case 'update_source_branch':
        result = {
          action: 'update_source_branch',
          pull_request: {
            id: pullRequestId,
            number: pullRequestNumber,
            source_branch: {
              name: params.source_branch,
              updated: true,
              last_commit: {
                hash: 'abc123def456',
                message: 'Updated source branch',
                author: {
                  username: 'current_user',
                  display_name: 'Current User'
                },
                date: new Date().toISOString()
              },
              links: {
                self: {
                  href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/refs/branches/${params.source_branch}`
                }
              }
            }
          },
          message: `Source branch '${params.source_branch}' updated for pull request #${pullRequestNumber}`
        };
        break;

      case 'rebase_source_branch':
        result = {
          action: 'rebase_source_branch',
          pull_request: {
            id: pullRequestId,
            number: pullRequestNumber,
            source_branch: {
              name: params.source_branch,
              rebased: true,
              rebase_strategy: params.rebase_strategy || 'interactive',
              rebase_commit: {
                hash: 'rebase123def456',
                message: `Rebased ${params.source_branch} onto destination`,
                author: {
                  username: 'current_user',
                  display_name: 'Current User'
                },
                date: new Date().toISOString()
              },
              links: {
                self: {
                  href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/refs/branches/${params.source_branch}`
                }
              }
            }
          },
          message: `Source branch '${params.source_branch}' rebased for pull request #${pullRequestNumber} using ${params.rebase_strategy || 'interactive'} strategy`
        };
        break;

      case 'compare_branches':
        const destBranch = params.destination_branch || 'main';
        result = {
          action: 'compare_branches',
          pull_request: {
            id: pullRequestId,
            number: pullRequestNumber
          },
          comparison: {
            source_branch: params.source_branch,
            destination_branch: destBranch,
            ahead_by: 3,
            behind_by: 1,
            total_commits: 4,
            commits: params.include_commits ? [
              {
                hash: 'abc123def456',
                message: 'Feature implementation',
                author: {
                  username: 'feature_author',
                  display_name: 'Feature Author'
                },
                date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
              },
              {
                hash: 'def456ghi789',
                message: 'Bug fix',
                author: {
                  username: 'bug_fixer',
                  display_name: 'Bug Fixer'
                },
                date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
              }
            ] : null,
            diff: params.include_diff ? {
              summary: {
                total_files: 2,
                total_additions: 25,
                total_deletions: 8,
                total_changes: 33
              },
              files: [
                {
                  filename: 'src/feature.ts',
                  status: 'modified',
                  additions: 15,
                  deletions: 5,
                  changes: 20
                },
                {
                  filename: 'src/bugfix.ts',
                  status: 'modified',
                  additions: 10,
                  deletions: 3,
                  changes: 13
                }
              ]
            } : null,
            links: {
              self: {
                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/compare/${destBranch}..${params.source_branch}`
              }
            }
          },
          message: `Compared branches '${params.source_branch}' and '${destBranch}' for pull request #${pullRequestNumber}`
        };
        break;

      case 'validate_branch_protection':
        result = {
          action: 'validate_branch_protection',
          pull_request: {
            id: pullRequestId,
            number: pullRequestNumber
          },
          protection_validation: {
            source_branch: {
              name: params.source_branch || `feature/branch-${pullRequestNumber}`,
              protected: false,
              protection_rules: []
            },
            destination_branch: {
              name: params.destination_branch || 'main',
              protected: true,
              protection_rules: [
                {
                  type: 'require_approvals',
                  value: 2,
                  description: 'Requires 2 approvals before merge'
                },
                {
                  type: 'require_status_checks',
                  value: ['ci-build', 'code-coverage'],
                  description: 'Requires CI build and code coverage checks'
                },
                {
                  type: 'restrict_merges',
                  value: ['merge_commit', 'squash'],
                  description: 'Allows merge commit and squash strategies only'
                }
              ]
            },
            validation_passed: true,
            validation_errors: []
          },
          message: `Branch protection validation completed for pull request #${pullRequestNumber}`
        };
        break;

      case 'cleanup_branches':
        const cleanedBranches = [];
        if (params.cleanup_merged_branches) {
          cleanedBranches.push('feature/old-feature-1', 'feature/old-feature-2');
        }
        if (params.cleanup_stale_branches) {
          cleanedBranches.push('feature/stale-branch-1', 'feature/stale-branch-2');
        }

        result = {
          action: 'cleanup_branches',
          pull_request: {
            id: pullRequestId,
            number: pullRequestNumber
          },
          cleanup_results: {
            merged_branches_cleaned: params.cleanup_merged_branches || false,
            stale_branches_cleaned: params.cleanup_stale_branches || false,
            stale_days_threshold: params.stale_days || 30,
            force_cleanup: params.force_cleanup || false,
            cleaned_branches: cleanedBranches,
            total_cleaned: cleanedBranches.length,
            errors: []
          },
          message: `Branch cleanup completed for pull request #${pullRequestNumber}. Cleaned ${cleanedBranches.length} branches.`
        };
        break;

      case 'list_branches':
        result = {
          action: 'list_branches',
          pull_request: {
            id: pullRequestId,
            number: pullRequestNumber
          },
          branches: [
            {
              name: 'main',
              type: 'branch',
              target: {
                hash: 'main123def456',
                links: {
                  self: {
                    href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/commit/main123def456`
                  }
                }
              },
              protection_rules: params.include_protection_rules ? [
                {
                  type: 'require_approvals',
                  value: 2,
                  description: 'Requires 2 approvals'
                }
              ] : null,
              links: {
                self: {
                  href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/refs/branches/main`
                }
              }
            },
            {
              name: `feature/branch-${pullRequestNumber}`,
              type: 'branch',
              target: {
                hash: 'feature123def456',
                links: {
                  self: {
                    href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/commit/feature123def456`
                  }
                }
              },
              protection_rules: params.include_protection_rules ? [] : null,
              links: {
                self: {
                  href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/refs/branches/feature/branch-${pullRequestNumber}`
                }
              }
            }
          ],
          message: `Retrieved branch information for pull request #${pullRequestNumber}`
        };
        break;
    }

    // Log the branch management action
    context.session?.emit('tool:executed', 'manage_pull_request_branches', {
      repository: params.repository,
      workspace: params.workspace,
      pull_request_number: pullRequestNumber,
      action: params.action,
      source_branch: params.source_branch || null,
      destination_branch: params.destination_branch || null
    });

    return {
      success: true,
      data: result,
      metadata: {
        timestamp: new Date(),
        tool: 'manage_pull_request_branches',
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
        tool: 'manage_pull_request_branches',
        error_type: error instanceof Error ? error.constructor.name : 'Unknown'
      }
    };
  }
};

/**
 * Manage Pull Request Branches Tool Definition
 */
export const managePullRequestBranchesTool: Tool = {
  name: 'manage_pull_request_branches',
  description: 'Manage pull request branch operations including updates, rebasing, protection rules, comparison, and cleanup with comprehensive validation',
  parameters: managePullRequestBranchesParameters,
  category: 'pull_request_management',
  version: '1.0.0',
  enabled: true,
  execute: managePullRequestBranchesExecutor,
  metadata: {
    api_endpoint: '/2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/branches',
    supported_apis: ['bitbucket_cloud', 'bitbucket_data_center'],
    requires_auth: true,
    rate_limit: '1000/hour'
  }
};

export default managePullRequestBranchesTool;
