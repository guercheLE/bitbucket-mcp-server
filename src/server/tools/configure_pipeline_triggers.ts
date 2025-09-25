/**
 * Configure Pipeline Triggers Tool
 * 
 * MCP tool for configuring automated pipeline triggers in Bitbucket repositories
 * with comprehensive trigger types, conditions, and scheduling capabilities.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Input validation schema
const ConfigurePipelineTriggersSchema = z.object({
  pipeline_id: z.string().min(1, 'Pipeline ID is required'),
  repository: z.string().min(1, 'Repository is required'),
  triggers: z.array(z.object({
    type: z.enum(['push', 'pull_request', 'manual', 'scheduled', 'webhook', 'tag']),
    enabled: z.boolean(),
    conditions: z.object({
      branches: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      paths: z.array(z.string()).optional(),
      users: z.array(z.string()).optional(),
      pull_request_types: z.array(z.enum(['opened', 'updated', 'merged', 'closed'])).optional(),
      schedule: z.object({
        cron: z.string().optional(),
        timezone: z.string().optional(),
        days: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])).optional(),
        times: z.array(z.string()).optional()
      }).optional(),
      webhook: z.object({
        url: z.string().url().optional(),
        secret: z.string().optional(),
        events: z.array(z.string()).optional()
      }).optional()
    }).optional(),
    options: z.object({
      skip_duplicates: z.boolean().optional(),
      cancel_in_progress: z.boolean().optional(),
      parallel_execution: z.boolean().optional(),
      max_concurrent: z.number().min(1).max(10).optional()
    }).optional()
  })),
  options: z.object({
    validate_configuration: z.boolean().optional(),
    test_triggers: z.boolean().optional(),
    notify_on_changes: z.boolean().optional()
  }).optional()
});

type ConfigurePipelineTriggersInput = z.infer<typeof ConfigurePipelineTriggersSchema>;

// Output validation schema
const ConfigurePipelineTriggersOutputSchema = z.object({
  success: z.boolean(),
  configuration: z.object({
    pipeline_id: z.string(),
    repository: z.string(),
    triggers: z.array(z.object({
      id: z.string(),
      type: z.enum(['push', 'pull_request', 'manual', 'scheduled', 'webhook', 'tag']),
      enabled: z.boolean(),
      conditions: z.object({
        branches: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional(),
        paths: z.array(z.string()).optional(),
        users: z.array(z.string()).optional(),
        pull_request_types: z.array(z.string()).optional(),
        schedule: z.object({
          cron: z.string().optional(),
          timezone: z.string().optional(),
          days: z.array(z.string()).optional(),
          times: z.array(z.string()).optional()
        }).optional(),
        webhook: z.object({
          url: z.string().optional(),
          secret: z.string().optional(),
          events: z.array(z.string()).optional()
        }).optional()
      }).optional(),
      options: z.object({
        skip_duplicates: z.boolean().optional(),
        cancel_in_progress: z.boolean().optional(),
        parallel_execution: z.boolean().optional(),
        max_concurrent: z.number().optional()
      }).optional(),
      created_at: z.string(),
      updated_at: z.string()
    })),
    validation_results: z.object({
      valid: z.boolean(),
      warnings: z.array(z.string()),
      errors: z.array(z.string())
    }).optional(),
    test_results: z.array(z.object({
      trigger_id: z.string(),
      test_status: z.enum(['success', 'failed', 'skipped']),
      message: z.string(),
      timestamp: z.string()
    })).optional()
  }).optional(),
  error: z.string().optional()
});

type ConfigurePipelineTriggersOutput = z.infer<typeof ConfigurePipelineTriggersOutputSchema>;

/**
 * Configure Pipeline Triggers MCP Tool
 * 
 * Configures automated pipeline triggers with comprehensive trigger types,
 * conditions, and scheduling capabilities for Bitbucket repositories.
 * 
 * Features:
 * - Multiple trigger types (push, pull request, manual, scheduled, webhook, tag)
 * - Advanced condition configuration
 * - Scheduling and cron expressions
 * - Webhook integration
 * - Branch and path filtering
 * - User and permission-based triggers
 * - Configuration validation
 * - Trigger testing capabilities
 * - Input validation and sanitization
 * - Error handling and logging
 * 
 * @param input - Pipeline triggers configuration parameters
 * @returns Pipeline triggers configuration result
 */
export const configurePipelineTriggersTool: Tool = {
  name: 'configure_pipeline_triggers',
  description: 'Configure automated pipeline triggers with comprehensive trigger types, conditions, and scheduling capabilities',
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
      triggers: {
        type: 'array',
        description: 'Trigger configurations to apply',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['push', 'pull_request', 'manual', 'scheduled', 'webhook', 'tag'],
              description: 'Trigger type'
            },
            enabled: {
              type: 'boolean',
              description: 'Whether the trigger is enabled'
            },
            conditions: {
              type: 'object',
              description: 'Trigger conditions',
              properties: {
                branches: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'Branch patterns to match'
                },
                tags: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'Tag patterns to match'
                },
                paths: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'File path patterns to match'
                },
                users: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'Users who can trigger the pipeline'
                },
                pull_request_types: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['opened', 'updated', 'merged', 'closed']
                  },
                  description: 'Pull request event types'
                },
                schedule: {
                  type: 'object',
                  description: 'Scheduling configuration',
                  properties: {
                    cron: {
                      type: 'string',
                      description: 'Cron expression for scheduling'
                    },
                    timezone: {
                      type: 'string',
                      description: 'Timezone for scheduling'
                    },
                    days: {
                      type: 'array',
                      items: {
                        type: 'string',
                        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                      },
                      description: 'Days of the week to run'
                    },
                    times: {
                      type: 'array',
                      items: {
                        type: 'string'
                      },
                      description: 'Times of day to run (HH:MM format)'
                    }
                  }
                },
                webhook: {
                  type: 'object',
                  description: 'Webhook configuration',
                  properties: {
                    url: {
                      type: 'string',
                      format: 'uri',
                      description: 'Webhook URL'
                    },
                    secret: {
                      type: 'string',
                      description: 'Webhook secret for security'
                    },
                    events: {
                      type: 'array',
                      items: {
                        type: 'string'
                      },
                      description: 'Webhook events to listen for'
                    }
                  }
                }
              }
            },
            options: {
              type: 'object',
              description: 'Trigger options',
              properties: {
                skip_duplicates: {
                  type: 'boolean',
                  description: 'Skip duplicate triggers'
                },
                cancel_in_progress: {
                  type: 'boolean',
                  description: 'Cancel in-progress runs when new trigger occurs'
                },
                parallel_execution: {
                  type: 'boolean',
                  description: 'Allow parallel execution'
                },
                max_concurrent: {
                  type: 'number',
                  minimum: 1,
                  maximum: 10,
                  description: 'Maximum concurrent executions'
                }
              }
            }
          },
          required: ['type', 'enabled']
        }
      },
      options: {
        type: 'object',
        description: 'Optional configuration options',
        properties: {
          validate_configuration: {
            type: 'boolean',
            description: 'Validate trigger configuration'
          },
          test_triggers: {
            type: 'boolean',
            description: 'Test trigger configurations'
          },
          notify_on_changes: {
            type: 'boolean',
            description: 'Send notifications when triggers are updated'
          }
        }
      }
    },
    required: ['pipeline_id', 'repository', 'triggers']
  }
};

/**
 * Execute pipeline triggers configuration
 * 
 * @param input - Pipeline triggers configuration parameters
 * @returns Pipeline triggers configuration result
 */
export async function executeConfigurePipelineTriggers(input: ConfigurePipelineTriggersInput): Promise<ConfigurePipelineTriggersOutput> {
  try {
    // Validate input
    const validatedInput = ConfigurePipelineTriggersSchema.parse(input);
    
    // Sanitize inputs
    const sanitizedInput = {
      pipeline_id: validatedInput.pipeline_id.trim(),
      repository: validatedInput.repository.trim(),
      triggers: validatedInput.triggers.map(trigger => ({
        type: trigger.type,
        enabled: trigger.enabled,
        conditions: trigger.conditions ? {
          branches: trigger.conditions.branches?.map(b => b.trim()),
          tags: trigger.conditions.tags?.map(t => t.trim()),
          paths: trigger.conditions.paths?.map(p => p.trim()),
          users: trigger.conditions.users?.map(u => u.trim()),
          pull_request_types: trigger.conditions.pull_request_types,
          schedule: trigger.conditions.schedule,
          webhook: trigger.conditions.webhook
        } : undefined,
        options: trigger.options
      })),
      options: validatedInput.options || {
        validate_configuration: true,
        test_triggers: false,
        notify_on_changes: true
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

    // Validate triggers
    if (!sanitizedInput.triggers || sanitizedInput.triggers.length === 0) {
      return {
        success: false,
        error: 'At least one trigger configuration is required'
      };
    }

    // Validate trigger configurations
    for (const trigger of sanitizedInput.triggers) {
      if (trigger.type === 'scheduled' && (!trigger.conditions?.schedule?.cron && !trigger.conditions?.schedule?.days)) {
        return {
          success: false,
          error: 'Scheduled triggers require either cron expression or days configuration'
        };
      }

      if (trigger.type === 'webhook' && !trigger.conditions?.webhook?.url) {
        return {
          success: false,
          error: 'Webhook triggers require a webhook URL'
        };
      }

      if (trigger.options?.max_concurrent && (trigger.options.max_concurrent < 1 || trigger.options.max_concurrent > 10)) {
        return {
          success: false,
          error: 'Max concurrent executions must be between 1 and 10'
        };
      }
    }

    // Simulate configuration validation
    const validationResults = {
      valid: true,
      warnings: [] as string[],
      errors: [] as string[]
    };

    // Check for common issues
    const enabledTriggers = sanitizedInput.triggers.filter(t => t.enabled);
    if (enabledTriggers.length === 0) {
      validationResults.warnings.push('No triggers are enabled - pipeline will only run manually');
    }

    const scheduledTriggers = enabledTriggers.filter(t => t.type === 'scheduled');
    if (scheduledTriggers.length > 1) {
      validationResults.warnings.push('Multiple scheduled triggers configured - ensure they don\'t conflict');
    }

    const webhookTriggers = enabledTriggers.filter(t => t.type === 'webhook');
    if (webhookTriggers.length > 5) {
      validationResults.warnings.push('Many webhook triggers configured - consider consolidating');
    }

    // Simulate trigger configuration (replace with actual Bitbucket API call)
    const currentTime = new Date();
    
    const configuredTriggers = sanitizedInput.triggers.map((trigger, index) => ({
      id: `trigger_${index + 1}_${Date.now()}`,
      type: trigger.type,
      enabled: trigger.enabled,
      conditions: trigger.conditions,
      options: trigger.options,
      created_at: currentTime.toISOString(),
      updated_at: currentTime.toISOString()
    }));

    // Simulate trigger testing if requested
    let testResults: any[] = [];
    if (sanitizedInput.options.test_triggers) {
      testResults = configuredTriggers.map(trigger => ({
        trigger_id: trigger.id,
        test_status: trigger.enabled ? 'success' : 'skipped',
        message: trigger.enabled ? `Trigger ${trigger.type} configured successfully` : 'Trigger is disabled',
        timestamp: currentTime.toISOString()
      }));
    }

    const configuration = {
      pipeline_id: sanitizedInput.pipeline_id,
      repository: sanitizedInput.repository,
      triggers: configuredTriggers,
      validation_results: sanitizedInput.options.validate_configuration ? validationResults : undefined,
      test_results: testResults.length > 0 ? testResults : undefined
    };

    // Log trigger configuration
    console.log(`Pipeline triggers configured: ${sanitizedInput.pipeline_id} in repository: ${sanitizedInput.repository}`);

    return {
      success: true,
      configuration: configuration
    };

  } catch (error) {
    console.error('Error configuring pipeline triggers:', error);
    
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

export default configurePipelineTriggersTool;
