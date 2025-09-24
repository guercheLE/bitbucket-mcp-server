/**
 * Configure Pipeline Webhooks Tool
 * 
 * MCP tool for configuring webhook integrations for CI/CD pipelines
 * in Bitbucket repositories with comprehensive security and validation.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { PipelineService } from '../services/pipeline-service.js';
import { UpdatePipelineRequest, PipelineTriggerType } from '../../types/pipeline.js';

// Input validation schema
const ConfigurePipelineWebhooksSchema = z.object({
  pipeline_id: z.string().min(1, 'Pipeline ID is required'),
  repository: z.string().min(1, 'Repository is required'),
  webhooks: z.array(z.object({
    name: z.string().min(1, 'Webhook name is required'),
    url: z.string().url('Valid URL is required'),
    events: z.array(z.enum(['pipeline_started', 'pipeline_completed', 'pipeline_failed', 'pipeline_cancelled', 'step_started', 'step_completed', 'step_failed'])),
    enabled: z.boolean(),
    security: z.object({
      secret: z.string().optional(),
      signature_header: z.string().optional(),
      ssl_verification: z.boolean().optional(),
      authentication: z.object({
        type: z.enum(['none', 'basic', 'bearer', 'api_key']).optional(),
        username: z.string().optional(),
        password: z.string().optional(),
        token: z.string().optional(),
        api_key: z.string().optional(),
        api_key_header: z.string().optional()
      }).optional()
    }).optional(),
    retry_policy: z.object({
      max_attempts: z.number().min(1).max(10).optional(),
      backoff_strategy: z.enum(['linear', 'exponential', 'fixed']).optional(),
      timeout: z.number().min(1).max(300).optional()
    }).optional(),
    filters: z.object({
      branches: z.array(z.string()).optional(),
      environments: z.array(z.string()).optional(),
      users: z.array(z.string()).optional(),
      conditions: z.array(z.string()).optional()
    }).optional()
  })),
  options: z.object({
    validate_webhooks: z.boolean().optional(),
    test_webhooks: z.boolean().optional(),
    enable_logging: z.boolean().optional()
  }).optional()
});

type ConfigurePipelineWebhooksInput = z.infer<typeof ConfigurePipelineWebhooksSchema>;

// Output validation schema
const ConfigurePipelineWebhooksOutputSchema = z.object({
  success: z.boolean(),
  configuration: z.object({
    pipeline_id: z.string(),
    repository: z.string(),
    webhooks: z.array(z.object({
      id: z.string(),
      name: z.string(),
      url: z.string(),
      events: z.array(z.string()),
      enabled: z.boolean(),
      security: z.object({
        secret: z.string().optional(),
        signature_header: z.string().optional(),
        ssl_verification: z.boolean().optional(),
        authentication: z.object({
          type: z.string().optional(),
          username: z.string().optional(),
          password: z.string().optional(),
          token: z.string().optional(),
          api_key: z.string().optional(),
          api_key_header: z.string().optional()
        }).optional()
      }).optional(),
      retry_policy: z.object({
        max_attempts: z.number().optional(),
        backoff_strategy: z.string().optional(),
        timeout: z.number().optional()
      }).optional(),
      filters: z.object({
        branches: z.array(z.string()).optional(),
        environments: z.array(z.string()).optional(),
        users: z.array(z.string()).optional(),
        conditions: z.array(z.string()).optional()
      }).optional(),
      created_at: z.string(),
      updated_at: z.string(),
      created_by: z.string()
    })),
    validation_results: z.object({
      valid: z.boolean(),
      warnings: z.array(z.string()),
      errors: z.array(z.string())
    }).optional(),
    test_results: z.array(z.object({
      webhook_id: z.string(),
      test_status: z.enum(['success', 'failed', 'timeout']),
      response_code: z.number().optional(),
      response_time: z.number().optional(),
      message: z.string(),
      timestamp: z.string()
    })).optional()
  }).optional(),
  error: z.string().optional()
});

type ConfigurePipelineWebhooksOutput = z.infer<typeof ConfigurePipelineWebhooksOutputSchema>;

/**
 * Configure Pipeline Webhooks MCP Tool
 * 
 * Configures webhook integrations for CI/CD pipelines with comprehensive
 * security, validation, and testing capabilities for Bitbucket repositories.
 * 
 * Features:
 * - Comprehensive webhook configuration
 * - Multiple event type support
 * - Advanced security options (secrets, authentication, SSL)
 * - Retry policies and error handling
 * - Event filtering and conditions
 * - Webhook validation and testing
 * - Comprehensive logging
 * - Input validation and sanitization
 * - Error handling and logging
 * 
 * @param input - Pipeline webhooks configuration parameters
 * @returns Pipeline webhooks configuration result
 */
export const configurePipelineWebhooksTool: Tool = {
  name: 'configure_pipeline_webhooks',
  description: 'Configure webhook integrations for CI/CD pipelines with comprehensive security, validation, and testing capabilities',
  inputSchema: {
    type: 'object',
    properties: {
      pipeline_id: {
        type: 'string',
        description: 'Pipeline identifier'
      },
      repository: {
        type: 'string',
        description: 'Repository identifier (e.g., "project/repo" or repository UUID)'
      },
      webhooks: {
        type: 'array',
        description: 'Webhook configurations to set up',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Webhook name'
            },
            url: {
              type: 'string',
              format: 'uri',
              description: 'Webhook URL'
            },
            events: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['pipeline_started', 'pipeline_completed', 'pipeline_failed', 'pipeline_cancelled', 'step_started', 'step_completed', 'step_failed']
              },
              description: 'Events to trigger the webhook'
            },
            enabled: {
              type: 'boolean',
              description: 'Whether the webhook is enabled'
            },
            security: {
              type: 'object',
              description: 'Webhook security configuration',
              properties: {
                secret: {
                  type: 'string',
                  description: 'Webhook secret for signature validation'
                },
                signature_header: {
                  type: 'string',
                  description: 'Header name for signature validation'
                },
                ssl_verification: {
                  type: 'boolean',
                  description: 'Whether to verify SSL certificates'
                },
                authentication: {
                  type: 'object',
                  description: 'Authentication configuration',
                  properties: {
                    type: {
                      type: 'string',
                      enum: ['none', 'basic', 'bearer', 'api_key'],
                      description: 'Authentication type'
                    },
                    username: {
                      type: 'string',
                      description: 'Username for basic authentication'
                    },
                    password: {
                      type: 'string',
                      description: 'Password for basic authentication'
                    },
                    token: {
                      type: 'string',
                      description: 'Bearer token'
                    },
                    api_key: {
                      type: 'string',
                      description: 'API key'
                    },
                    api_key_header: {
                      type: 'string',
                      description: 'Header name for API key'
                    }
                  }
                }
              }
            },
            retry_policy: {
              type: 'object',
              description: 'Retry policy configuration',
              properties: {
                max_attempts: {
                  type: 'number',
                  minimum: 1,
                  maximum: 10,
                  description: 'Maximum retry attempts'
                },
                backoff_strategy: {
                  type: 'string',
                  enum: ['linear', 'exponential', 'fixed'],
                  description: 'Backoff strategy for retries'
                },
                timeout: {
                  type: 'number',
                  minimum: 1,
                  maximum: 300,
                  description: 'Request timeout in seconds'
                }
              }
            },
            filters: {
              type: 'object',
              description: 'Event filtering configuration',
              properties: {
                branches: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'Branch filters'
                },
                environments: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'Environment filters'
                },
                users: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'User filters'
                },
                conditions: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'Custom condition filters'
                }
              }
            }
          },
          required: ['name', 'url', 'events', 'enabled']
        }
      },
      options: {
        type: 'object',
        description: 'Optional configuration options',
        properties: {
          validate_webhooks: {
            type: 'boolean',
            description: 'Validate webhook configurations'
          },
          test_webhooks: {
            type: 'boolean',
            description: 'Test webhook configurations'
          },
          enable_logging: {
            type: 'boolean',
            description: 'Enable webhook logging'
          }
        }
      }
    },
    required: ['pipeline_id', 'repository', 'webhooks']
  }
};

/**
 * Execute pipeline webhooks configuration
 * 
 * @param input - Pipeline webhooks configuration parameters
 * @returns Pipeline webhooks configuration result
 */
export async function executeConfigurePipelineWebhooks(input: ConfigurePipelineWebhooksInput): Promise<ConfigurePipelineWebhooksOutput> {
  try {
    // Validate input
    const validatedInput = ConfigurePipelineWebhooksSchema.parse(input);
    
    // Sanitize inputs
    const sanitizedInput = {
      pipeline_id: validatedInput.pipeline_id.trim(),
      repository: validatedInput.repository.trim(),
      webhooks: validatedInput.webhooks.map(webhook => ({
        name: webhook.name.trim(),
        url: webhook.url.trim(),
        events: webhook.events,
        enabled: webhook.enabled,
        security: webhook.security ? {
          secret: webhook.security.secret,
          signature_header: webhook.security.signature_header?.trim(),
          ssl_verification: webhook.security.ssl_verification,
          authentication: webhook.security.authentication
        } : undefined,
        retry_policy: webhook.retry_policy,
        filters: webhook.filters
      })),
      options: validatedInput.options || {
        validate_webhooks: true,
        test_webhooks: false,
        enable_logging: true
      }
    };

    // Validate pipeline ID
    if (!sanitizedInput.pipeline_id) {
      return {
        success: false,
        error: 'Pipeline ID is required'
      };
    }

    // Validate repository access
    if (!sanitizedInput.repository) {
      return {
        success: false,
        error: 'Repository identifier is required'
      };
    }

    // Validate webhooks
    if (!sanitizedInput.webhooks || sanitizedInput.webhooks.length === 0) {
      return {
        success: false,
        error: 'At least one webhook configuration is required'
      };
    }

    // Validate webhook names
    const webhookNames = sanitizedInput.webhooks.map(w => w.name);
    const uniqueNames = new Set(webhookNames);
    if (webhookNames.length !== uniqueNames.size) {
      return {
        success: false,
        error: 'Webhook names must be unique'
      };
    }

    // Validate webhook URLs
    for (const webhook of sanitizedInput.webhooks) {
      try {
        new URL(webhook.url);
      } catch {
        return {
          success: false,
          error: `Invalid webhook URL: ${webhook.url}`
        };
      }

      if (!webhook.events || webhook.events.length === 0) {
        return {
          success: false,
          error: `Webhook "${webhook.name}" must have at least one event`
        };
      }
    }

    // Simulate webhook validation
    const validationResults = {
      valid: true,
      warnings: [] as string[],
      errors: [] as string[]
    };

    // Check for common issues
    const enabledWebhooks = sanitizedInput.webhooks.filter(w => w.enabled);
    if (enabledWebhooks.length === 0) {
      validationResults.warnings.push('No webhooks are enabled');
    }

    const insecureWebhooks = enabledWebhooks.filter(w => !w.security?.secret);
    if (insecureWebhooks.length > 0) {
      validationResults.warnings.push(`${insecureWebhooks.length} webhooks are configured without secrets - consider adding security`);
    }

    const httpWebhooks = enabledWebhooks.filter(w => w.url.startsWith('http://'));
    if (httpWebhooks.length > 0) {
      validationResults.warnings.push(`${httpWebhooks.length} webhooks use HTTP instead of HTTPS - consider using HTTPS for security`);
    }

    // Initialize pipeline service (in real implementation, this would be injected)
    const pipelineService = new PipelineService({
      apiBaseUrl: process.env.BITBUCKET_API_URL || 'https://api.bitbucket.org/2.0',
      authToken: process.env.BITBUCKET_AUTH_TOKEN || '',
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
      enableCaching: true,
      cacheTtl: 300000, // 5 minutes
      enableMonitoring: true,
      monitoringInterval: 5000 // 5 seconds
    });

    // Get current pipeline to access existing configuration
    const pipelineResponse = await pipelineService.getPipeline(sanitizedInput.pipeline_id);
    if (!pipelineResponse.success || !pipelineResponse.data) {
      return {
        success: false,
        error: pipelineResponse.error?.message || 'Pipeline not found'
      };
    }

    const pipeline = pipelineResponse.data;
    const currentTime = new Date();
    
    // Configure webhooks
    const configuredWebhooks = sanitizedInput.webhooks.map((webhook, index) => ({
      id: `webhook_${index + 1}_${Date.now()}`,
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
      enabled: webhook.enabled,
      security: webhook.security,
      retry_policy: webhook.retry_policy || {
        max_attempts: 3,
        backoff_strategy: 'exponential',
        timeout: 30
      },
      filters: webhook.filters,
      created_at: currentTime.toISOString(),
      updated_at: currentTime.toISOString(),
      created_by: 'current_user'
    }));

    // Update pipeline configuration with webhook triggers
    const updatedConfiguration = {
      ...pipeline.configuration,
      triggers: [
        ...pipeline.configuration.triggers,
        ...sanitizedInput.webhooks
          .filter(webhook => webhook.enabled)
          .map(webhook => ({
            type: PipelineTriggerType.WEBHOOK,
            branches: webhook.filters?.branches || [],
            paths: [],
            enabled: true,
            webhook: {
              url: webhook.url,
              secret: webhook.security?.secret,
              events: webhook.events.map(event => {
                // Map webhook events to pipeline trigger events
                switch (event) {
                  case 'pipeline_started':
                    return 'pipeline.start';
                  case 'pipeline_completed':
                    return 'pipeline.complete';
                  case 'pipeline_failed':
                    return 'pipeline.fail';
                  case 'pipeline_cancelled':
                    return 'pipeline.cancel';
                  case 'step_started':
                    return 'step.start';
                  case 'step_completed':
                    return 'step.complete';
                  case 'step_failed':
                    return 'step.fail';
                  default:
                    return event;
                }
              })
            }
          }))
      ]
    };

    // Update pipeline with new webhook configuration
    const updateRequest: UpdatePipelineRequest = {
      configuration: updatedConfiguration
    };

    const updateResponse = await pipelineService.updatePipeline(sanitizedInput.pipeline_id, updateRequest);
    if (!updateResponse.success) {
      return {
        success: false,
        error: updateResponse.error?.message || 'Failed to update pipeline with webhook configuration'
      };
    }

    // Test webhooks if requested
    let testResults: any[] = [];
    if (sanitizedInput.options.test_webhooks) {
      testResults = await Promise.all(
        configuredWebhooks.map(async (webhook) => {
          if (!webhook.enabled) {
            return {
              webhook_id: webhook.id,
              test_status: 'failed' as const,
              message: 'Webhook is disabled',
              timestamp: currentTime.toISOString()
            };
          }

          try {
            // Send test webhook payload
            const testPayload = {
              event: 'webhook.test',
              pipeline_id: sanitizedInput.pipeline_id,
              repository: sanitizedInput.repository,
              timestamp: currentTime.toISOString(),
              webhook_id: webhook.id
            };

            const headers: Record<string, string> = {
              'Content-Type': 'application/json',
              'User-Agent': 'Bitbucket-MCP-Server/1.0'
            };

            // Add authentication if configured
            if (webhook.security?.authentication) {
              const auth = webhook.security.authentication;
              switch (auth.type) {
                case 'basic':
                  if (auth.username && auth.password) {
                    const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
                    headers['Authorization'] = `Basic ${credentials}`;
                  }
                  break;
                case 'bearer':
                  if (auth.token) {
                    headers['Authorization'] = `Bearer ${auth.token}`;
                  }
                  break;
                case 'api_key':
                  if (auth.api_key && auth.api_key_header) {
                    headers[auth.api_key_header] = auth.api_key;
                  }
                  break;
              }
            }

            // Add signature if secret is configured
            if (webhook.security?.secret) {
              const crypto = await import('crypto');
              const signature = crypto
                .createHmac('sha256', webhook.security.secret)
                .update(JSON.stringify(testPayload))
                .digest('hex');
              headers[webhook.security.signature_header || 'X-Hub-Signature-256'] = `sha256=${signature}`;
            }

            const startTime = Date.now();
            const response = await fetch(webhook.url, {
              method: 'POST',
              headers,
              body: JSON.stringify(testPayload),
              signal: AbortSignal.timeout((webhook.retry_policy?.timeout || 30) * 1000)
            });

            const responseTime = Date.now() - startTime;

            return {
              webhook_id: webhook.id,
              test_status: response.ok ? 'success' as const : 'failed' as const,
              response_code: response.status,
              response_time: responseTime,
              message: response.ok 
                ? `Webhook "${webhook.name}" tested successfully` 
                : `Webhook test failed with status ${response.status}`,
              timestamp: currentTime.toISOString()
            };

          } catch (error) {
            return {
              webhook_id: webhook.id,
              test_status: 'timeout' as const,
              message: `Webhook test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              timestamp: currentTime.toISOString()
            };
          }
        })
      );
    }

    const configuration = {
      pipeline_id: sanitizedInput.pipeline_id,
      repository: sanitizedInput.repository,
      webhooks: configuredWebhooks,
      validation_results: sanitizedInput.options.validate_webhooks ? validationResults : undefined,
      test_results: testResults.length > 0 ? testResults : undefined
    };

    // Log webhook configuration
    console.log(`Pipeline webhooks configured: ${sanitizedInput.pipeline_id} in repository: ${sanitizedInput.repository}`);

    return {
      success: true,
      configuration: configuration
    };

  } catch (error) {
    console.error('Error configuring pipeline webhooks:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export default configurePipelineWebhooksTool;
