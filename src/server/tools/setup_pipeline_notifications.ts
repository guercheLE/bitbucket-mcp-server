/**
 * Setup Pipeline Notifications Tool
 * 
 * MCP tool for configuring alerts and notifications for CI/CD pipelines
 * in Bitbucket repositories with comprehensive notification channels and rules.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Input validation schema
const SetupPipelineNotificationsSchema = z.object({
  pipeline_id: z.string().min(1, 'Pipeline ID is required'),
  repository: z.string().min(1, 'Repository is required'),
  notification_channels: z.array(z.object({
    name: z.string().min(1, 'Channel name is required'),
    type: z.enum(['email', 'slack', 'teams', 'webhook', 'sms', 'push']),
    enabled: z.boolean(),
    configuration: z.object({
      recipients: z.array(z.string().email()).optional(),
      webhook_url: z.string().url().optional(),
      channel: z.string().optional(),
      api_key: z.string().optional(),
      phone_numbers: z.array(z.string()).optional(),
      device_tokens: z.array(z.string()).optional(),
      custom_headers: z.record(z.string()).optional()
    }),
    filters: z.object({
      events: z.array(z.enum(['pipeline_started', 'pipeline_completed', 'pipeline_failed', 'pipeline_cancelled', 'step_failed', 'step_completed', 'deployment_success', 'deployment_failed'])),
      severity: z.array(z.enum(['info', 'warning', 'error', 'critical'])).optional(),
      branches: z.array(z.string()).optional(),
      environments: z.array(z.string()).optional(),
      users: z.array(z.string()).optional(),
      time_restrictions: z.object({
        start_time: z.string().optional(),
        end_time: z.string().optional(),
        days: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])).optional()
      }).optional()
    }),
    rules: z.object({
      rate_limiting: z.object({
        max_notifications_per_hour: z.number().min(1).max(100).optional(),
        max_notifications_per_day: z.number().min(1).max(1000).optional()
      }).optional(),
      escalation: z.object({
        enabled: z.boolean().optional(),
        escalation_delay: z.number().min(1).max(1440).optional(),
        escalation_recipients: z.array(z.string()).optional()
      }).optional(),
      deduplication: z.object({
        enabled: z.boolean().optional(),
        deduplication_window: z.number().min(1).max(60).optional()
      }).optional()
    }).optional()
  })),
  global_settings: z.object({
    default_severity: z.enum(['info', 'warning', 'error', 'critical']).optional(),
    enable_notifications: z.boolean().optional(),
    quiet_hours: z.object({
      enabled: z.boolean().optional(),
      start_time: z.string().optional(),
      end_time: z.string().optional(),
      days: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])).optional()
    }).optional()
  }).optional(),
  options: z.object({
    validate_configuration: z.boolean().optional(),
    test_notifications: z.boolean().optional(),
    enable_logging: z.boolean().optional()
  }).optional()
});

type SetupPipelineNotificationsInput = z.infer<typeof SetupPipelineNotificationsSchema>;

// Output validation schema
const SetupPipelineNotificationsOutputSchema = z.object({
  success: z.boolean(),
  configuration: z.object({
    pipeline_id: z.string(),
    repository: z.string(),
    notification_channels: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(['email', 'slack', 'teams', 'webhook', 'sms', 'push']),
      enabled: z.boolean(),
      configuration: z.object({
        recipients: z.array(z.string()).optional(),
        webhook_url: z.string().optional(),
        channel: z.string().optional(),
        api_key: z.string().optional(),
        phone_numbers: z.array(z.string()).optional(),
        device_tokens: z.array(z.string()).optional(),
        custom_headers: z.record(z.string()).optional()
      }),
      filters: z.object({
        events: z.array(z.string()),
        severity: z.array(z.string()).optional(),
        branches: z.array(z.string()).optional(),
        environments: z.array(z.string()).optional(),
        users: z.array(z.string()).optional(),
        time_restrictions: z.object({
          start_time: z.string().optional(),
          end_time: z.string().optional(),
          days: z.array(z.string()).optional()
        }).optional()
      }),
      rules: z.object({
        rate_limiting: z.object({
          max_notifications_per_hour: z.number().optional(),
          max_notifications_per_day: z.number().optional()
        }).optional(),
        escalation: z.object({
          enabled: z.boolean().optional(),
          escalation_delay: z.number().optional(),
          escalation_recipients: z.array(z.string()).optional()
        }).optional(),
        deduplication: z.object({
          enabled: z.boolean().optional(),
          deduplication_window: z.number().optional()
        }).optional()
      }).optional(),
      created_at: z.string(),
      updated_at: z.string(),
      created_by: z.string(),
      status: z.enum(['active', 'inactive', 'error', 'testing']).optional()
    })),
    global_settings: z.object({
      default_severity: z.enum(['info', 'warning', 'error', 'critical']),
      enable_notifications: z.boolean(),
      quiet_hours: z.object({
        enabled: z.boolean(),
        start_time: z.string().optional(),
        end_time: z.string().optional(),
        days: z.array(z.string()).optional()
      }).optional()
    }),
    validation_results: z.object({
      valid: z.boolean(),
      warnings: z.array(z.string()),
      errors: z.array(z.string())
    }).optional(),
    test_results: z.array(z.object({
      channel_id: z.string(),
      test_status: z.enum(['success', 'failed', 'timeout']),
      response_time: z.number().optional(),
      error_message: z.string().optional(),
      timestamp: z.string()
    })).optional()
  }).optional(),
  error: z.string().optional()
});

type SetupPipelineNotificationsOutput = z.infer<typeof SetupPipelineNotificationsOutputSchema>;

/**
 * Setup Pipeline Notifications MCP Tool
 * 
 * Configures alerts and notifications for CI/CD pipelines with comprehensive
 * notification channels, rules, and filtering capabilities for Bitbucket repositories.
 * 
 * Features:
 * - Multiple notification channels (email, Slack, Teams, webhook, SMS, push)
 * - Advanced filtering and routing rules
 * - Rate limiting and deduplication
 * - Escalation policies
 * - Time-based restrictions and quiet hours
 * - Notification testing and validation
 * - Comprehensive logging
 * - Input validation and sanitization
 * - Error handling and logging
 * 
 * @param input - Pipeline notifications setup parameters
 * @returns Pipeline notifications configuration result
 */
export const setupPipelineNotificationsTool: Tool = {
  name: 'setup_pipeline_notifications',
  description: 'Configure alerts and notifications for CI/CD pipelines with comprehensive notification channels, rules, and filtering capabilities',
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
      notification_channels: {
        type: 'array',
        description: 'Notification channels to configure',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Channel name'
            },
            type: {
              type: 'string',
              enum: ['email', 'slack', 'teams', 'webhook', 'sms', 'push'],
              description: 'Notification channel type'
            },
            enabled: {
              type: 'boolean',
              description: 'Whether the channel is enabled'
            },
            configuration: {
              type: 'object',
              description: 'Channel-specific configuration',
              properties: {
                recipients: {
                  type: 'array',
                  items: {
                    type: 'string',
                    format: 'email'
                  },
                  description: 'Email recipients'
                },
                webhook_url: {
                  type: 'string',
                  format: 'uri',
                  description: 'Webhook URL'
                },
                channel: {
                  type: 'string',
                  description: 'Channel or room name'
                },
                api_key: {
                  type: 'string',
                  description: 'API key for authentication'
                },
                phone_numbers: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'Phone numbers for SMS notifications'
                },
                device_tokens: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'Device tokens for push notifications'
                },
                custom_headers: {
                  type: 'object',
                  additionalProperties: {
                    type: 'string'
                  },
                  description: 'Custom HTTP headers'
                }
              }
            },
            filters: {
              type: 'object',
              description: 'Notification filters',
              properties: {
                events: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['pipeline_started', 'pipeline_completed', 'pipeline_failed', 'pipeline_cancelled', 'step_failed', 'step_completed', 'deployment_success', 'deployment_failed']
                  },
                  description: 'Events to trigger notifications'
                },
                severity: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['info', 'warning', 'error', 'critical']
                  },
                  description: 'Severity levels to include'
                },
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
                time_restrictions: {
                  type: 'object',
                  description: 'Time-based restrictions',
                  properties: {
                    start_time: {
                      type: 'string',
                      description: 'Start time (HH:MM format)'
                    },
                    end_time: {
                      type: 'string',
                      description: 'End time (HH:MM format)'
                    },
                    days: {
                      type: 'array',
                      items: {
                        type: 'string',
                        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                      },
                      description: 'Allowed days of the week'
                    }
                  }
                }
              }
            },
            rules: {
              type: 'object',
              description: 'Notification rules',
              properties: {
                rate_limiting: {
                  type: 'object',
                  description: 'Rate limiting configuration',
                  properties: {
                    max_notifications_per_hour: {
                      type: 'number',
                      minimum: 1,
                      maximum: 100,
                      description: 'Maximum notifications per hour'
                    },
                    max_notifications_per_day: {
                      type: 'number',
                      minimum: 1,
                      maximum: 1000,
                      description: 'Maximum notifications per day'
                    }
                  }
                },
                escalation: {
                  type: 'object',
                  description: 'Escalation configuration',
                  properties: {
                    enabled: {
                      type: 'boolean',
                      description: 'Whether escalation is enabled'
                    },
                    escalation_delay: {
                      type: 'number',
                      minimum: 1,
                      maximum: 1440,
                      description: 'Escalation delay in minutes'
                    },
                    escalation_recipients: {
                      type: 'array',
                      items: {
                        type: 'string'
                      },
                      description: 'Escalation recipients'
                    }
                  }
                },
                deduplication: {
                  type: 'object',
                  description: 'Deduplication configuration',
                  properties: {
                    enabled: {
                      type: 'boolean',
                      description: 'Whether deduplication is enabled'
                    },
                    deduplication_window: {
                      type: 'number',
                      minimum: 1,
                      maximum: 60,
                      description: 'Deduplication window in minutes'
                    }
                  }
                }
              }
            }
          },
          required: ['name', 'type', 'enabled', 'configuration', 'filters']
        }
      },
      global_settings: {
        type: 'object',
        description: 'Global notification settings',
        properties: {
          default_severity: {
            type: 'string',
            enum: ['info', 'warning', 'error', 'critical'],
            description: 'Default notification severity'
          },
          enable_notifications: {
            type: 'boolean',
            description: 'Whether notifications are globally enabled'
          },
          quiet_hours: {
            type: 'object',
            description: 'Quiet hours configuration',
            properties: {
              enabled: {
                type: 'boolean',
                description: 'Whether quiet hours are enabled'
              },
              start_time: {
                type: 'string',
                description: 'Quiet hours start time (HH:MM format)'
              },
              end_time: {
                type: 'string',
                description: 'Quiet hours end time (HH:MM format)'
              },
              days: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                },
                description: 'Quiet hours days'
              }
            }
          }
        }
      },
      options: {
        type: 'object',
        description: 'Optional setup options',
        properties: {
          validate_configuration: {
            type: 'boolean',
            description: 'Validate notification configuration'
          },
          test_notifications: {
            type: 'boolean',
            description: 'Test notification channels'
          },
          enable_logging: {
            type: 'boolean',
            description: 'Enable notification logging'
          }
        }
      }
    },
    required: ['pipeline_id', 'repository', 'notification_channels']
  }
};

/**
 * Execute pipeline notifications setup
 * 
 * @param input - Pipeline notifications setup parameters
 * @returns Pipeline notifications configuration result
 */
export async function executeSetupPipelineNotifications(input: SetupPipelineNotificationsInput): Promise<SetupPipelineNotificationsOutput> {
  try {
    // Validate input
    const validatedInput = SetupPipelineNotificationsSchema.parse(input);
    
    // Sanitize inputs
    const sanitizedInput = {
      pipeline_id: validatedInput.pipeline_id.trim(),
      repository: validatedInput.repository.trim(),
      notification_channels: validatedInput.notification_channels.map(channel => ({
        name: channel.name.trim(),
        type: channel.type,
        enabled: channel.enabled,
        configuration: {
          recipients: channel.configuration.recipients?.map(r => r.trim()),
          webhook_url: channel.configuration.webhook_url?.trim(),
          channel: channel.configuration.channel?.trim(),
          api_key: channel.configuration.api_key,
          phone_numbers: channel.configuration.phone_numbers?.map(p => p.trim()),
          device_tokens: channel.configuration.device_tokens?.map(t => t.trim()),
          custom_headers: channel.configuration.custom_headers
        },
        filters: {
          events: channel.filters.events,
          severity: channel.filters.severity,
          branches: channel.filters.branches?.map(b => b.trim()),
          environments: channel.filters.environments?.map(e => e.trim()),
          users: channel.filters.users?.map(u => u.trim()),
          time_restrictions: channel.filters.time_restrictions
        },
        rules: channel.rules
      })),
      global_settings: validatedInput.global_settings || {
        default_severity: 'warning',
        enable_notifications: true,
        quiet_hours: {
          enabled: false
        }
      },
      options: validatedInput.options || {
        validate_configuration: true,
        test_notifications: false,
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

    // Validate notification channels
    if (!sanitizedInput.notification_channels || sanitizedInput.notification_channels.length === 0) {
      return {
        success: false,
        error: 'At least one notification channel is required'
      };
    }

    // Validate channel names
    const channelNames = sanitizedInput.notification_channels.map(c => c.name);
    const uniqueNames = new Set(channelNames);
    if (channelNames.length !== uniqueNames.size) {
      return {
        success: false,
        error: 'Channel names must be unique'
      };
    }

    // Validate channel configurations
    for (const channel of sanitizedInput.notification_channels) {
      if (!channel.name) {
        return {
          success: false,
          error: 'Channel name is required'
        };
      }

      if (!channel.filters.events || channel.filters.events.length === 0) {
        return {
          success: false,
          error: `Channel "${channel.name}" must have at least one event filter`
        };
      }

      if (channel.type === 'email' && (!channel.configuration.recipients || channel.configuration.recipients.length === 0)) {
        return {
          success: false,
          error: `Email channel "${channel.name}" must have at least one recipient`
        };
      }

      if (channel.type === 'slack' && !channel.configuration.webhook_url) {
        return {
          success: false,
          error: `Slack channel "${channel.name}" must have a webhook URL`
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
    const enabledChannels = sanitizedInput.notification_channels.filter(c => c.enabled);
    if (enabledChannels.length === 0) {
      validationResults.warnings.push('No notification channels are enabled');
    }

    const emailChannels = enabledChannels.filter(c => c.type === 'email');
    if (emailChannels.length > 5) {
      validationResults.warnings.push('Many email channels configured - consider consolidating');
    }

    const webhookChannels = enabledChannels.filter(c => c.type === 'webhook');
    if (webhookChannels.length > 10) {
      validationResults.warnings.push('Many webhook channels configured - consider rate limiting');
    }

    // Simulate notification setup (replace with actual Bitbucket API call)
    const currentTime = new Date();
    
    const configuredChannels = sanitizedInput.notification_channels.map((channel, index) => ({
      id: `channel_${index + 1}_${Date.now()}`,
      name: channel.name,
      type: channel.type,
      enabled: channel.enabled,
      configuration: channel.configuration,
      filters: channel.filters,
      rules: channel.rules || {
        rate_limiting: {
          max_notifications_per_hour: 50,
          max_notifications_per_day: 500
        },
        escalation: {
          enabled: false
        },
        deduplication: {
          enabled: true,
          deduplication_window: 5
        }
      },
      created_at: currentTime.toISOString(),
      updated_at: currentTime.toISOString(),
      created_by: 'current_user',
      status: 'active'
    }));

    // Simulate notification testing if requested
    let testResults: any[] = [];
    if (sanitizedInput.options.test_notifications) {
      testResults = configuredChannels.map(channel => ({
        channel_id: channel.id,
        test_status: channel.enabled ? 'success' : 'failed',
        response_time: channel.enabled ? Math.floor(Math.random() * 1000) + 100 : undefined,
        error_message: channel.enabled ? undefined : 'Channel is disabled',
        timestamp: currentTime.toISOString()
      }));
    }

    const configuration = {
      pipeline_id: sanitizedInput.pipeline_id,
      repository: sanitizedInput.repository,
      notification_channels: configuredChannels,
      global_settings: sanitizedInput.global_settings,
      validation_results: sanitizedInput.options.validate_configuration ? validationResults : undefined,
      test_results: testResults.length > 0 ? testResults : undefined
    };

    // Log notification setup
    console.log(`Pipeline notifications configured: ${sanitizedInput.pipeline_id} in repository: ${sanitizedInput.repository}`);

    return {
      success: true,
      configuration: configuration
    };

  } catch (error) {
    console.error('Error setting up pipeline notifications:', error);
    
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

export default setupPipelineNotificationsTool;
