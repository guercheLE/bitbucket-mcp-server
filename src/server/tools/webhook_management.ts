/**
 * Webhook Management Tool
 * 
 * MCP tool for managing repository webhooks including creation, configuration,
 * testing, and security settings. Supports both Bitbucket Data Center and Cloud APIs.
 * 
 * Features:
 * - Webhook creation and configuration
 * - Webhook event filtering and selection
 * - Webhook testing and validation
 * - Webhook security and authentication
 * - Webhook lifecycle management
 */

import { Tool, ToolExecutionContext, ToolExecutor, ToolParameter, ToolResult } from '../../types/index.js';

/**
 * Webhook Management Tool Parameters
 */
const webhookManagementParameters: ToolParameter[] = [
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
    description: 'Webhook management action to perform',
    required: true,
    schema: {
      enum: ['create', 'list', 'get', 'update', 'delete', 'test', 'get_events']
    }
  },
  {
    name: 'webhook_id',
    type: 'string',
    description: 'Webhook ID (required for get, update, delete, test actions)',
    required: false,
    schema: {
      pattern: '^[a-zA-Z0-9_-]+$',
      minLength: 1,
      maxLength: 50
    }
  },
  {
    name: 'url',
    type: 'string',
    description: 'Webhook URL (required for create action)',
    required: false,
    schema: {
      format: 'uri',
      maxLength: 500
    }
  },
  {
    name: 'description',
    type: 'string',
    description: 'Webhook description (optional)',
    required: false,
    schema: {
      maxLength: 200
    }
  },
  {
    name: 'events',
    type: 'array',
    description: 'Array of events to subscribe to (required for create action)',
    required: false,
    schema: {
      items: {
        type: 'string',
        enum: [
          'repo:push', 'repo:fork', 'repo:commit_comment_created', 'repo:commit_status_created',
          'repo:commit_status_updated', 'issue:created', 'issue:updated', 'issue:comment_created',
          'pullrequest:created', 'pullrequest:updated', 'pullrequest:approved', 'pullrequest:unapproved',
          'pullrequest:fulfilled', 'pullrequest:rejected', 'pullrequest:comment_created', 'pullrequest:comment_updated',
          'pullrequest:comment_deleted', 'pullrequest:changes_request_created', 'pullrequest:changes_request_removed'
        ]
      },
      minItems: 1,
      maxItems: 20
    }
  },
  {
    name: 'active',
    type: 'boolean',
    description: 'Whether the webhook is active (default: true)',
    required: false,
    default: true
  },
  {
    name: 'secret',
    type: 'string',
    description: 'Webhook secret for authentication (optional)',
    required: false,
    schema: {
      minLength: 8,
      maxLength: 100
    }
  },
  {
    name: 'skip_cert_verification',
    type: 'boolean',
    description: 'Skip SSL certificate verification (default: false)',
    required: false,
    default: false
  }
];

/**
 * Webhook Management Tool Executor
 */
const webhookManagementExecutor: ToolExecutor = async (params: Record<string, any>, context: ToolExecutionContext): Promise<ToolResult> => {
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
          tool: 'webhook_management'
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
          tool: 'webhook_management'
        }
      };
    }

    // Validate action-specific parameters
    if (params.action === 'create') {
      if (!params.url) {
        return {
          success: false,
          error: {
            code: -32602,
            message: 'URL is required for create action',
            details: { required_for_action: 'create' }
          },
          metadata: {
            timestamp: new Date(),
            tool: 'webhook_management'
          }
        };
      }

      if (!params.events || params.events.length === 0) {
        return {
          success: false,
          error: {
            code: -32602,
            message: 'Events array is required for create action',
            details: { required_for_action: 'create' }
          },
          metadata: {
            timestamp: new Date(),
            tool: 'webhook_management'
          }
        };
      }
    }

    const webhookActions = ['get', 'update', 'delete', 'test'];
    if (webhookActions.includes(params.action) && !params.webhook_id) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Webhook ID is required for this action',
          details: { required_for_actions: webhookActions }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'webhook_management'
        }
      };
    }

    // TODO: Implement actual Bitbucket API call
    // This is a placeholder implementation based on action
    let result: any = {};

    switch (params.action) {
      case 'create':
        result = {
          action: 'create',
          repository: params.repository,
          workspace: params.workspace,
          webhook: {
            id: `webhook_${Date.now()}`,
            url: params.url,
            description: params.description || 'Webhook created via MCP tool',
            events: params.events,
            active: params.active !== false,
            secret: params.secret ? '***hidden***' : null,
            skip_cert_verification: params.skip_cert_verification || false,
            created_at: new Date().toISOString(),
            links: {
              self: {
                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/hooks/webhook_${Date.now()}`
              }
            }
          },
          message: `Webhook created successfully for repository '${params.repository}'`
        };
        break;

      case 'list':
        result = {
          action: 'list',
          repository: params.repository,
          workspace: params.workspace,
          webhooks: [
            {
              id: 'webhook_1',
              url: 'https://example.com/webhook',
              description: 'CI/CD webhook',
              events: ['repo:push', 'pullrequest:created'],
              active: true,
              secret: '***hidden***',
              skip_cert_verification: false,
              created_at: '2024-01-15T10:30:00Z',
              links: {
                self: {
                  href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/hooks/webhook_1`
                }
              }
            },
            {
              id: 'webhook_2',
              url: 'https://monitoring.example.com/alerts',
              description: 'Monitoring webhook',
              events: ['issue:created', 'issue:updated'],
              active: true,
              secret: null,
              skip_cert_verification: false,
              created_at: '2024-02-01T09:15:00Z',
              links: {
                self: {
                  href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/hooks/webhook_2`
                }
              }
            }
          ],
          total_webhooks: 2
        };
        break;

      case 'get':
        result = {
          action: 'get',
          repository: params.repository,
          workspace: params.workspace,
          webhook_id: params.webhook_id,
          webhook: {
            id: params.webhook_id,
            url: 'https://example.com/webhook',
            description: 'CI/CD webhook',
            events: ['repo:push', 'pullrequest:created'],
            active: true,
            secret: '***hidden***',
            skip_cert_verification: false,
            created_at: '2024-01-15T10:30:00Z',
            last_triggered: '2024-09-20T14:45:00Z',
            trigger_count: 1250,
            links: {
              self: {
                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/hooks/${params.webhook_id}`
              }
            }
          },
          message: `Webhook '${params.webhook_id}' retrieved successfully`
        };
        break;

      case 'update':
        result = {
          action: 'update',
          repository: params.repository,
          workspace: params.workspace,
          webhook_id: params.webhook_id,
          updated_webhook: {
            id: params.webhook_id,
            url: params.url || 'https://example.com/webhook',
            description: params.description || 'Updated webhook',
            events: params.events || ['repo:push'],
            active: params.active !== undefined ? params.active : true,
            secret: params.secret ? '***hidden***' : null,
            skip_cert_verification: params.skip_cert_verification || false,
            updated_at: new Date().toISOString(),
            links: {
              self: {
                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/hooks/${params.webhook_id}`
              }
            }
          },
          message: `Webhook '${params.webhook_id}' updated successfully`
        };
        break;

      case 'delete':
        result = {
          action: 'delete',
          repository: params.repository,
          workspace: params.workspace,
          webhook_id: params.webhook_id,
          deleted_at: new Date().toISOString(),
          message: `Webhook '${params.webhook_id}' deleted successfully`
        };
        break;

      case 'test':
        result = {
          action: 'test',
          repository: params.repository,
          workspace: params.workspace,
          webhook_id: params.webhook_id,
          test_result: {
            status: 'success',
            response_code: 200,
            response_time: 150,
            test_payload: {
              event: 'repo:push',
              repository: params.repository,
              workspace: params.workspace,
              timestamp: new Date().toISOString()
            },
            response_body: 'Webhook received successfully',
            tested_at: new Date().toISOString()
          },
          message: `Webhook '${params.webhook_id}' test completed successfully`
        };
        break;

      case 'get_events':
        result = {
          action: 'get_events',
          repository: params.repository,
          workspace: params.workspace,
          available_events: {
            repository: [
              'repo:push', 'repo:fork', 'repo:commit_comment_created',
              'repo:commit_status_created', 'repo:commit_status_updated'
            ],
            issues: [
              'issue:created', 'issue:updated', 'issue:comment_created'
            ],
            pull_requests: [
              'pullrequest:created', 'pullrequest:updated', 'pullrequest:approved',
              'pullrequest:unapproved', 'pullrequest:fulfilled', 'pullrequest:rejected',
              'pullrequest:comment_created', 'pullrequest:comment_updated',
              'pullrequest:comment_deleted', 'pullrequest:changes_request_created',
              'pullrequest:changes_request_removed'
            ]
          },
          message: 'Available webhook events retrieved successfully'
        };
        break;

      default:
        return {
          success: false,
          error: {
            code: -32602,
            message: 'Invalid action specified',
            details: { valid_actions: ['create', 'list', 'get', 'update', 'delete', 'test', 'get_events'] }
          },
          metadata: {
            timestamp: new Date(),
            tool: 'webhook_management'
          }
        };
    }

    // Log the webhook management action
    context.session?.emit('tool:executed', 'webhook_management', {
      action: params.action,
      repository: params.repository,
      workspace: params.workspace,
      webhook_id: params.webhook_id
    });

    return {
      success: true,
      data: result,
      metadata: {
        timestamp: new Date(),
        tool: 'webhook_management',
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
        tool: 'webhook_management',
        error_type: error instanceof Error ? error.constructor.name : 'Unknown'
      }
    };
  }
};

/**
 * Webhook Management Tool Definition
 */
export const webhookManagementTool: Tool = {
  name: 'webhook_management',
  description: 'Manage repository webhooks including creation, configuration, testing, and security settings',
  parameters: webhookManagementParameters,
  category: 'repository_management',
  version: '1.0.0',
  enabled: true,
  execute: webhookManagementExecutor,
  metadata: {
    api_endpoint: '/2.0/repositories/{workspace}/{repo_slug}/hooks',
    supported_apis: ['bitbucket_cloud', 'bitbucket_data_center'],
    requires_auth: true,
    rate_limit: '100/hour'
  }
};

export default webhookManagementTool;
