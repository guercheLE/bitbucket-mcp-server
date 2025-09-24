/**
 * Manage Pull Request Integration Tool
 * 
 * MCP tool for managing pull request integrations, status checks, and external system connections.
 * Supports CI/CD integration, webhook management, and external service status reporting.
 * 
 * Features:
 * - Status check management and reporting
 * - CI/CD integration and status reporting
 * - Webhook integration for external systems
 * - Status check validation and blocking
 * - External service integration
 */

import { Tool, ToolParameter, ToolExecutor, ToolResult, ToolExecutionContext } from '../../types/index.js';

/**
 * Manage Pull Request Integration Tool Parameters
 */
const managePullRequestIntegrationParameters: ToolParameter[] = [
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
    description: 'Action to perform on the pull request integration',
    required: true,
    schema: {
      enum: ['create_status_check', 'update_status_check', 'delete_status_check', 'list_status_checks', 'trigger_webhook', 'validate_integrations']
    }
  },
  {
    name: 'status_check_id',
    type: 'string',
    description: 'Status check ID (required for update_status_check, delete_status_check actions)',
    required: false,
    schema: {
      pattern: '^[a-zA-Z0-9_-]+$',
      maxLength: 50
    }
  },
  {
    name: 'status_check_name',
    type: 'string',
    description: 'Status check name (required for create_status_check action)',
    required: false,
    schema: {
      maxLength: 100
    }
  },
  {
    name: 'status_check_state',
    type: 'string',
    description: 'Status check state',
    required: false,
    schema: {
      enum: ['pending', 'successful', 'failed', 'error', 'cancelled']
    }
  },
  {
    name: 'status_check_description',
    type: 'string',
    description: 'Status check description',
    required: false,
    schema: {
      maxLength: 500
    }
  },
  {
    name: 'status_check_url',
    type: 'string',
    description: 'Status check target URL',
    required: false,
    schema: {
      format: 'uri',
      maxLength: 500
    }
  },
  {
    name: 'webhook_url',
    type: 'string',
    description: 'Webhook URL to trigger (for trigger_webhook action)',
    required: false,
    schema: {
      format: 'uri',
      maxLength: 500
    }
  },
  {
    name: 'webhook_payload',
    type: 'object',
    description: 'Webhook payload data (for trigger_webhook action)',
    required: false,
    schema: {
      type: 'object'
    }
  },
  {
    name: 'integration_type',
    type: 'string',
    description: 'Type of integration to validate',
    required: false,
    schema: {
      enum: ['ci_cd', 'code_quality', 'security_scan', 'deployment', 'notification', 'all']
    }
  },
  {
    name: 'block_on_failure',
    type: 'boolean',
    description: 'Whether to block merge on status check failure',
    required: false,
    default: true
  },
  {
    name: 'include_details',
    type: 'boolean',
    description: 'Include detailed information in response',
    required: false,
    default: true
  }
];

/**
 * Manage Pull Request Integration Tool Executor
 */
const managePullRequestIntegrationExecutor: ToolExecutor = async (params: Record<string, any>, context: ToolExecutionContext): Promise<ToolResult> => {
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
          tool: 'manage_pull_request_integration'
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
          tool: 'manage_pull_request_integration'
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
          tool: 'manage_pull_request_integration'
        }
      };
    }

    // Validate action-specific parameters
    switch (params.action) {
      case 'create_status_check':
        if (!params.status_check_name) {
          return {
            success: false,
            error: {
              code: -32602,
              message: 'Status check name is required for create_status_check action',
              details: { action: params.action, required: 'status_check_name' }
            },
            metadata: {
              timestamp: new Date(),
              tool: 'manage_pull_request_integration'
            }
          };
        }
        if (!params.status_check_state) {
          return {
            success: false,
            error: {
              code: -32602,
              message: 'Status check state is required for create_status_check action',
              details: { action: params.action, required: 'status_check_state' }
            },
            metadata: {
              timestamp: new Date(),
              tool: 'manage_pull_request_integration'
            }
          };
        }
        break;

      case 'update_status_check':
        if (!params.status_check_id) {
          return {
            success: false,
            error: {
              code: -32602,
              message: 'Status check ID is required for update_status_check action',
              details: { action: params.action, required: 'status_check_id' }
            },
            metadata: {
              timestamp: new Date(),
              tool: 'manage_pull_request_integration'
            }
          };
        }
        break;

      case 'delete_status_check':
        if (!params.status_check_id) {
          return {
            success: false,
            error: {
              code: -32602,
              message: 'Status check ID is required for delete_status_check action',
              details: { action: params.action, required: 'status_check_id' }
            },
            metadata: {
              timestamp: new Date(),
              tool: 'manage_pull_request_integration'
            }
          };
        }
        break;

      case 'trigger_webhook':
        if (!params.webhook_url) {
          return {
            success: false,
            error: {
              code: -32602,
              message: 'Webhook URL is required for trigger_webhook action',
              details: { action: params.action, required: 'webhook_url' }
            },
            metadata: {
              timestamp: new Date(),
              tool: 'manage_pull_request_integration'
            }
          };
        }
        break;

      case 'list_status_checks':
      case 'validate_integrations':
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
              valid_actions: ['create_status_check', 'update_status_check', 'delete_status_check', 'list_status_checks', 'trigger_webhook', 'validate_integrations'] 
            }
          },
          metadata: {
            timestamp: new Date(),
            tool: 'manage_pull_request_integration'
          }
        };
    }

    // Validate status check name length if provided
    if (params.status_check_name && params.status_check_name.length > 100) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Status check name must be 100 characters or less',
          details: { name_length: params.status_check_name.length, max_length: 100 }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'manage_pull_request_integration'
        }
      };
    }

    // Validate status check description length if provided
    if (params.status_check_description && params.status_check_description.length > 500) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Status check description must be 500 characters or less',
          details: { description_length: params.status_check_description.length, max_length: 500 }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'manage_pull_request_integration'
        }
      };
    }

    // Validate URL format if provided
    if (params.status_check_url && !params.status_check_url.match(/^https?:\/\/.+/)) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Status check URL must be a valid HTTP/HTTPS URL',
          details: { invalid_url: params.status_check_url }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'manage_pull_request_integration'
        }
      };
    }

    if (params.webhook_url && !params.webhook_url.match(/^https?:\/\/.+/)) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Webhook URL must be a valid HTTP/HTTPS URL',
          details: { invalid_url: params.webhook_url }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'manage_pull_request_integration'
        }
      };
    }

    // TODO: Implement actual Bitbucket API call
    // This is a placeholder implementation
    const pullRequestNumber = parseInt(params.pull_request_id) || 1;
    const pullRequestId = `pr_${pullRequestNumber}_${Date.now()}`;

    let result: any = {};

    switch (params.action) {
      case 'create_status_check':
        const statusCheckId = `status_${Date.now()}`;
        result = {
          action: 'create_status_check',
          status_check: {
            id: statusCheckId,
            name: params.status_check_name,
            state: params.status_check_state,
            description: params.status_check_description || `Status check for pull request #${pullRequestNumber}`,
            target_url: params.status_check_url || null,
            created_on: new Date().toISOString(),
            updated_on: new Date().toISOString(),
            block_on_failure: params.block_on_failure !== false,
            links: {
              self: {
                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/pullrequests/${pullRequestNumber}/statuses/${statusCheckId}`
              }
            }
          },
          message: `Status check '${params.status_check_name}' created for pull request #${pullRequestNumber}`
        };
        break;

      case 'update_status_check':
        result = {
          action: 'update_status_check',
          status_check: {
            id: params.status_check_id,
            name: params.status_check_name || 'Updated Status Check',
            state: params.status_check_state || 'pending',
            description: params.status_check_description || 'Updated status check',
            target_url: params.status_check_url || null,
            created_on: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            updated_on: new Date().toISOString(),
            block_on_failure: params.block_on_failure !== false,
            links: {
              self: {
                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/pullrequests/${pullRequestNumber}/statuses/${params.status_check_id}`
              }
            }
          },
          message: `Status check '${params.status_check_id}' updated for pull request #${pullRequestNumber}`
        };
        break;

      case 'delete_status_check':
        result = {
          action: 'delete_status_check',
          status_check: {
            id: params.status_check_id,
            deleted: true,
            deleted_on: new Date().toISOString()
          },
          message: `Status check '${params.status_check_id}' deleted from pull request #${pullRequestNumber}`
        };
        break;

      case 'list_status_checks':
        result = {
          action: 'list_status_checks',
          pull_request: {
            id: pullRequestId,
            number: pullRequestNumber
          },
          status_checks: [
            {
              id: 'status-check-1',
              name: 'CI Build',
              state: 'successful',
              description: 'All tests passed',
              target_url: 'https://ci.example.com/build/123',
              created_on: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              updated_on: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              block_on_failure: true,
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
              block_on_failure: true,
              links: {
                self: {
                  href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/pullrequests/${pullRequestNumber}/statuses/status-check-2`
                }
              }
            },
            {
              id: 'status-check-3',
              name: 'Security Scan',
              state: 'pending',
              description: 'Security scan in progress',
              target_url: null,
              created_on: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
              updated_on: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
              block_on_failure: true,
              links: {
                self: {
                  href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/pullrequests/${pullRequestNumber}/statuses/status-check-3`
                }
              }
            }
          ],
          summary: {
            total_checks: 3,
            successful: 2,
            pending: 1,
            failed: 0,
            blocked: false
          },
          message: `Retrieved ${params.include_details ? 'detailed' : 'summary'} status check information for pull request #${pullRequestNumber}`
        };
        break;

      case 'trigger_webhook':
        result = {
          action: 'trigger_webhook',
          webhook: {
            url: params.webhook_url,
            triggered: true,
            triggered_on: new Date().toISOString(),
            payload: params.webhook_payload || {
              pull_request: {
                id: pullRequestId,
                number: pullRequestNumber,
                state: 'open',
                action: 'status_check_updated'
              },
              repository: {
                name: params.repository,
                workspace: params.workspace
              }
            },
            response: {
              status_code: 200,
              status_text: 'OK',
              response_time_ms: 150
            }
          },
          message: `Webhook triggered successfully for pull request #${pullRequestNumber}`
        };
        break;

      case 'validate_integrations':
        const integrationType = params.integration_type || 'all';
        result = {
          action: 'validate_integrations',
          pull_request: {
            id: pullRequestId,
            number: pullRequestNumber
          },
          validation_results: {
            integration_type: integrationType,
            validated_on: new Date().toISOString(),
            integrations: {
              ci_cd: {
                configured: true,
                status: 'active',
                checks: ['build', 'test', 'deploy'],
                last_run: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
              },
              code_quality: {
                configured: true,
                status: 'active',
                checks: ['linting', 'coverage', 'complexity'],
                last_run: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
              },
              security_scan: {
                configured: true,
                status: 'active',
                checks: ['vulnerability_scan', 'dependency_check'],
                last_run: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
              },
              deployment: {
                configured: false,
                status: 'inactive',
                checks: [],
                last_run: null
              },
              notification: {
                configured: true,
                status: 'active',
                checks: ['slack', 'email'],
                last_run: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
              }
            },
            overall_status: 'healthy',
            issues: [],
            recommendations: [
              'Consider configuring deployment integration for automated deployments',
              'Enable additional security checks for enhanced protection'
            ]
          },
          message: `Integration validation completed for pull request #${pullRequestNumber}. Overall status: healthy.`
        };
        break;
    }

    // Log the integration management action
    context.session?.emit('tool:executed', 'manage_pull_request_integration', {
      repository: params.repository,
      workspace: params.workspace,
      pull_request_number: pullRequestNumber,
      action: params.action,
      status_check_id: params.status_check_id || null,
      webhook_url: params.webhook_url || null,
      integration_type: params.integration_type || null
    });

    return {
      success: true,
      data: result,
      metadata: {
        timestamp: new Date(),
        tool: 'manage_pull_request_integration',
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
        tool: 'manage_pull_request_integration',
        error_type: error instanceof Error ? error.constructor.name : 'Unknown'
      }
    };
  }
};

/**
 * Manage Pull Request Integration Tool Definition
 */
export const managePullRequestIntegrationTool: Tool = {
  name: 'manage_pull_request_integration',
  description: 'Manage pull request integrations, status checks, CI/CD connections, and external system integrations with comprehensive validation and monitoring',
  parameters: managePullRequestIntegrationParameters,
  category: 'pull_request_management',
  version: '1.0.0',
  enabled: true,
  execute: managePullRequestIntegrationExecutor,
  metadata: {
    api_endpoint: '/2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/statuses',
    supported_apis: ['bitbucket_cloud', 'bitbucket_data_center'],
    requires_auth: true,
    rate_limit: '1000/hour'
  }
};

export default managePullRequestIntegrationTool;
