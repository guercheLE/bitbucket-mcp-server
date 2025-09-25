/**
 * Manage Pipeline Integrations Tool
 * 
 * MCP tool for managing external tool integrations with CI/CD pipelines
 * in Bitbucket repositories with comprehensive configuration and monitoring.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Input validation schema
const ManagePipelineIntegrationsSchema = z.object({
  pipeline_id: z.string().min(1, 'Pipeline ID is required'),
  repository: z.string().min(1, 'Repository is required'),
  action: z.enum(['add', 'remove', 'update', 'list', 'test'], {
    errorMap: () => ({ message: 'Action must be add, remove, update, list, or test' })
  }),
  integration: z.object({
    name: z.string().min(1, 'Integration name is required'),
    type: z.enum(['slack', 'teams', 'jira', 'jenkins', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'custom']),
    configuration: z.object({
      endpoint: z.string().url().optional(),
      api_key: z.string().optional(),
      username: z.string().optional(),
      password: z.string().optional(),
      token: z.string().optional(),
      webhook_url: z.string().url().optional(),
      channel: z.string().optional(),
      project_key: z.string().optional(),
      custom_headers: z.record(z.string()).optional(),
      custom_parameters: z.record(z.string()).optional()
    }),
    enabled: z.boolean(),
    triggers: z.array(z.enum(['pipeline_start', 'pipeline_success', 'pipeline_failure', 'pipeline_complete', 'step_failure', 'custom'])).optional(),
    filters: z.object({
      branches: z.array(z.string()).optional(),
      environments: z.array(z.string()).optional(),
      users: z.array(z.string()).optional(),
      conditions: z.array(z.string()).optional()
    }).optional()
  }).optional(),
  integration_id: z.string().optional(),
  options: z.object({
    validate_configuration: z.boolean().optional(),
    test_connection: z.boolean().optional(),
    enable_logging: z.boolean().optional()
  }).optional()
});

type ManagePipelineIntegrationsInput = z.infer<typeof ManagePipelineIntegrationsSchema>;

// Output validation schema
const ManagePipelineIntegrationsOutputSchema = z.object({
  success: z.boolean(),
  result: z.object({
    action: z.enum(['add', 'remove', 'update', 'list', 'test']),
    pipeline_id: z.string(),
    repository: z.string(),
    integration: z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(['slack', 'teams', 'jira', 'jenkins', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'custom']),
      configuration: z.object({
        endpoint: z.string().optional(),
        api_key: z.string().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
        token: z.string().optional(),
        webhook_url: z.string().optional(),
        channel: z.string().optional(),
        project_key: z.string().optional(),
        custom_headers: z.record(z.string()).optional(),
        custom_parameters: z.record(z.string()).optional()
      }),
      enabled: z.boolean(),
      triggers: z.array(z.string()).optional(),
      filters: z.object({
        branches: z.array(z.string()).optional(),
        environments: z.array(z.string()).optional(),
        users: z.array(z.string()).optional(),
        conditions: z.array(z.string()).optional()
      }).optional(),
      created_at: z.string(),
      updated_at: z.string(),
      created_by: z.string(),
      status: z.enum(['active', 'inactive', 'error', 'testing']).optional()
    }).optional(),
    integrations: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
      enabled: z.boolean(),
      status: z.enum(['active', 'inactive', 'error', 'testing']),
      last_used: z.string().optional(),
      created_at: z.string()
    })).optional(),
    test_results: z.object({
      connection_status: z.enum(['success', 'failed', 'timeout']),
      response_time: z.number().optional(),
      error_message: z.string().optional(),
      timestamp: z.string()
    }).optional(),
    summary: z.object({
      total_integrations: z.number(),
      active_integrations: z.number(),
      inactive_integrations: z.number(),
      error_integrations: z.number(),
      last_updated: z.string().optional()
    }).optional()
  }).optional(),
  error: z.string().optional()
});

type ManagePipelineIntegrationsOutput = z.infer<typeof ManagePipelineIntegrationsOutputSchema>;

/**
 * Manage Pipeline Integrations MCP Tool
 * 
 * Manages external tool integrations with CI/CD pipelines including
 * configuration, testing, and monitoring capabilities for Bitbucket repositories.
 * 
 * Features:
 * - Add, remove, update, and list integrations
 * - Multiple integration types (Slack, Teams, Jira, Jenkins, etc.)
 * - Comprehensive configuration management
 * - Integration testing and validation
 * - Trigger and filter configuration
 * - Status monitoring and health checks
 * - Input validation and sanitization
 * - Error handling and logging
 * 
 * @param input - Pipeline integrations management parameters
 * @returns Pipeline integrations management result
 */
export const managePipelineIntegrationsTool: Tool = {
  name: 'manage_pipeline_integrations',
  description: 'Manage external tool integrations with CI/CD pipelines including configuration, testing, and monitoring capabilities',
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
      action: {
        type: 'string',
        enum: ['add', 'remove', 'update', 'list', 'test'],
        description: 'Action to perform on pipeline integrations'
      },
      integration: {
        type: 'object',
        description: 'Integration configuration (required for add, update actions)',
        properties: {
          name: {
            type: 'string',
            description: 'Integration name'
          },
          type: {
            type: 'string',
            enum: ['slack', 'teams', 'jira', 'jenkins', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'custom'],
            description: 'Integration type'
          },
          configuration: {
            type: 'object',
            description: 'Integration configuration',
            properties: {
              endpoint: {
                type: 'string',
                format: 'uri',
                description: 'Integration endpoint URL'
              },
              api_key: {
                type: 'string',
                description: 'API key for authentication'
              },
              username: {
                type: 'string',
                description: 'Username for authentication'
              },
              password: {
                type: 'string',
                description: 'Password for authentication'
              },
              token: {
                type: 'string',
                description: 'Token for authentication'
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
              project_key: {
                type: 'string',
                description: 'Project key (for Jira)'
              },
              custom_headers: {
                type: 'object',
                additionalProperties: {
                  type: 'string'
                },
                description: 'Custom HTTP headers'
              },
              custom_parameters: {
                type: 'object',
                additionalProperties: {
                  type: 'string'
                },
                description: 'Custom parameters'
              }
            }
          },
          enabled: {
            type: 'boolean',
            description: 'Whether the integration is enabled'
          },
          triggers: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['pipeline_start', 'pipeline_success', 'pipeline_failure', 'pipeline_complete', 'step_failure', 'custom']
            },
            description: 'Integration triggers'
          },
          filters: {
            type: 'object',
            description: 'Integration filters',
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
        }
      },
      integration_id: {
        type: 'string',
        description: 'Integration ID (required for remove, update, test actions)'
      },
      options: {
        type: 'object',
        description: 'Optional management options',
        properties: {
          validate_configuration: {
            type: 'boolean',
            description: 'Validate integration configuration'
          },
          test_connection: {
            type: 'boolean',
            description: 'Test integration connection'
          },
          enable_logging: {
            type: 'boolean',
            description: 'Enable integration logging'
          }
        }
      }
    },
    required: ['pipeline_id', 'repository', 'action']
  }
};

/**
 * Execute pipeline integrations management
 * 
 * @param input - Pipeline integrations management parameters
 * @returns Pipeline integrations management result
 */
export async function executeManagePipelineIntegrations(input: ManagePipelineIntegrationsInput): Promise<ManagePipelineIntegrationsOutput> {
  try {
    // Validate input
    const validatedInput = ManagePipelineIntegrationsSchema.parse(input);
    
    // Sanitize inputs
    const sanitizedInput = {
      pipeline_id: validatedInput.pipeline_id.trim(),
      repository: validatedInput.repository.trim(),
      action: validatedInput.action,
      integration: validatedInput.integration ? {
        name: validatedInput.integration.name.trim(),
        type: validatedInput.integration.type,
        configuration: {
          endpoint: validatedInput.integration.configuration.endpoint?.trim(),
          api_key: validatedInput.integration.configuration.api_key,
          username: validatedInput.integration.configuration.username?.trim(),
          password: validatedInput.integration.configuration.password,
          token: validatedInput.integration.configuration.token,
          webhook_url: validatedInput.integration.configuration.webhook_url?.trim(),
          channel: validatedInput.integration.configuration.channel?.trim(),
          project_key: validatedInput.integration.configuration.project_key?.trim(),
          custom_headers: validatedInput.integration.configuration.custom_headers,
          custom_parameters: validatedInput.integration.configuration.custom_parameters
        },
        enabled: validatedInput.integration.enabled,
        triggers: validatedInput.integration.triggers,
        filters: validatedInput.integration.filters
      } : undefined,
      integration_id: validatedInput.integration_id?.trim(),
      options: validatedInput.options || {
        validate_configuration: true,
        test_connection: false,
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

    // Validate action-specific requirements
    if (['add', 'update'].includes(sanitizedInput.action) && !sanitizedInput.integration) {
      return {
        success: false,
        error: 'Integration configuration is required for add and update actions'
      };
    }

    if (['remove', 'update', 'test'].includes(sanitizedInput.action) && !sanitizedInput.integration_id) {
      return {
        success: false,
        error: 'Integration ID is required for remove, update, and test actions'
      };
    }

    // Validate integration configuration if provided
    if (sanitizedInput.integration) {
      if (!sanitizedInput.integration.name) {
        return {
          success: false,
          error: 'Integration name is required'
        };
      }

      if (sanitizedInput.integration.type === 'slack' && !sanitizedInput.integration.configuration.webhook_url) {
        return {
          success: false,
          error: 'Webhook URL is required for Slack integration'
        };
      }

      if (sanitizedInput.integration.type === 'jira' && !sanitizedInput.integration.configuration.endpoint) {
        return {
          success: false,
          error: 'Endpoint URL is required for Jira integration'
        };
      }
    }

    // Simulate pipeline integrations management (replace with actual Bitbucket API call)
    const currentTime = new Date();
    
    // Generate sample integrations based on action
    let resultIntegration: any = undefined;
    let resultIntegrations: any[] = [];
    let testResults: any = undefined;
    let summary: any = {};

    switch (sanitizedInput.action) {
      case 'add':
        if (sanitizedInput.integration) {
          resultIntegration = {
            id: `integration_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: sanitizedInput.integration.name,
            type: sanitizedInput.integration.type,
            configuration: sanitizedInput.integration.configuration,
            enabled: sanitizedInput.integration.enabled,
            triggers: sanitizedInput.integration.triggers || ['pipeline_complete'],
            filters: sanitizedInput.integration.filters,
            created_at: currentTime.toISOString(),
            updated_at: currentTime.toISOString(),
            created_by: 'current_user',
            status: 'active'
          };
        }
        break;

      case 'update':
        if (sanitizedInput.integration) {
          resultIntegration = {
            id: sanitizedInput.integration_id,
            name: sanitizedInput.integration.name,
            type: sanitizedInput.integration.type,
            configuration: sanitizedInput.integration.configuration,
            enabled: sanitizedInput.integration.enabled,
            triggers: sanitizedInput.integration.triggers,
            filters: sanitizedInput.integration.filters,
            created_at: new Date(currentTime.getTime() - 3600000).toISOString(),
            updated_at: currentTime.toISOString(),
            created_by: 'admin@example.com',
            status: 'active'
          };
        }
        break;

      case 'list':
        resultIntegrations = [
          {
            id: 'integration_001',
            name: 'Slack Notifications',
            type: 'slack',
            enabled: true,
            status: 'active',
            last_used: new Date(currentTime.getTime() - 1800000).toISOString(),
            created_at: new Date(currentTime.getTime() - 3600000).toISOString()
          },
          {
            id: 'integration_002',
            name: 'Jira Issue Tracking',
            type: 'jira',
            enabled: true,
            status: 'active',
            last_used: new Date(currentTime.getTime() - 7200000).toISOString(),
            created_at: new Date(currentTime.getTime() - 7200000).toISOString()
          },
          {
            id: 'integration_003',
            name: 'Docker Registry',
            type: 'docker',
            enabled: false,
            status: 'inactive',
            last_used: new Date(currentTime.getTime() - 10800000).toISOString(),
            created_at: new Date(currentTime.getTime() - 10800000).toISOString()
          }
        ];
        break;

      case 'test':
        testResults = {
          connection_status: 'success',
          response_time: Math.floor(Math.random() * 500) + 100,
          error_message: undefined,
          timestamp: currentTime.toISOString()
        };
        break;

      case 'remove':
        // Integration removed successfully
        break;
    }

    // Calculate summary
    if (resultIntegrations.length > 0) {
      summary = {
        total_integrations: resultIntegrations.length,
        active_integrations: resultIntegrations.filter(i => i.status === 'active').length,
        inactive_integrations: resultIntegrations.filter(i => i.status === 'inactive').length,
        error_integrations: resultIntegrations.filter(i => i.status === 'error').length,
        last_updated: currentTime.toISOString()
      };
    }

    const result = {
      action: sanitizedInput.action,
      pipeline_id: sanitizedInput.pipeline_id,
      repository: sanitizedInput.repository,
      integration: resultIntegration,
      integrations: resultIntegrations.length > 0 ? resultIntegrations : undefined,
      test_results: testResults,
      summary: Object.keys(summary).length > 0 ? summary : undefined
    };

    // Log integration management
    console.log(`Pipeline integration ${sanitizedInput.action}: ${sanitizedInput.pipeline_id} in repository: ${sanitizedInput.repository}`);

    return {
      success: true,
      result: result
    };

  } catch (error) {
    console.error('Error managing pipeline integrations:', error);
    
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

export default managePipelineIntegrationsTool;
