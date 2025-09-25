/**
 * Configure Pipeline Tool
 * 
 * MCP tool for configuring existing CI/CD pipelines in Bitbucket repositories.
 * Supports updating pipeline settings, triggers, environment, variables,
 * steps, and notifications with comprehensive validation.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Input validation schema
const ConfigurePipelineSchema = z.object({
  pipeline_id: z.string().min(1, 'Pipeline ID is required'),
  repository: z.string().min(1, 'Repository is required'),
  updates: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    status: z.enum(['active', 'inactive', 'draft']).optional(),
    configuration: z.object({
      triggers: z.array(z.enum(['push', 'pull_request', 'manual', 'scheduled'])).optional(),
      environment: z.string().optional(),
      variables: z.record(z.string()).optional(),
      steps: z.array(z.object({
        name: z.string(),
        type: z.enum(['build', 'test', 'deploy', 'custom']),
        command: z.string().optional(),
        script: z.string().optional(),
        timeout: z.number().optional()
      })).optional(),
      notifications: z.object({
        email: z.array(z.string().email()).optional(),
        webhook: z.string().url().optional(),
        slack: z.string().optional()
      }).optional()
    }).optional(),
    permissions: z.object({
      users: z.array(z.string()).optional(),
      groups: z.array(z.string()).optional(),
      public: z.boolean().optional()
    }).optional()
  })
});

type ConfigurePipelineInput = z.infer<typeof ConfigurePipelineSchema>;

// Output validation schema
const ConfigurePipelineOutputSchema = z.object({
  success: z.boolean(),
  pipeline: z.object({
    id: z.string(),
    name: z.string(),
    repository: z.string(),
    status: z.enum(['active', 'inactive', 'draft']),
    updated_at: z.string(),
    updated_by: z.string(),
    configuration: z.object({
      triggers: z.array(z.string()),
      environment: z.string().optional(),
      variables: z.record(z.string()).optional(),
      steps: z.array(z.object({
        name: z.string(),
        type: z.string(),
        command: z.string().optional(),
        script: z.string().optional(),
        timeout: z.number().optional()
      })).optional(),
      notifications: z.object({
        email: z.array(z.string()).optional(),
        webhook: z.string().optional(),
        slack: z.string().optional()
      }).optional()
    }),
    permissions: z.object({
      users: z.array(z.string()).optional(),
      groups: z.array(z.string()).optional(),
      public: z.boolean().optional()
    }).optional()
  }).optional(),
  error: z.string().optional()
});

type ConfigurePipelineOutput = z.infer<typeof ConfigurePipelineOutputSchema>;

/**
 * Configure Pipeline MCP Tool
 * 
 * Updates configuration settings for an existing CI/CD pipeline in a Bitbucket
 * repository. Supports partial updates and comprehensive validation.
 * 
 * Features:
 * - Partial configuration updates
 * - Trigger configuration management
 * - Environment and variable updates
 * - Step workflow modifications
 * - Notification settings updates
 * - Permission management
 * - Input validation and sanitization
 * - Error handling and logging
 * 
 * @param input - Pipeline configuration parameters
 * @returns Pipeline configuration result with updated details
 */
export const configurePipelineTool: Tool = {
  name: 'configure_pipeline',
  description: 'Update configuration settings for an existing CI/CD pipeline in a Bitbucket repository with comprehensive validation',
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
      updates: {
        type: 'object',
        description: 'Configuration updates to apply',
        properties: {
          name: {
            type: 'string',
            description: 'Updated pipeline name (1-100 characters)'
          },
          description: {
            type: 'string',
            description: 'Updated pipeline description'
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'draft'],
            description: 'Updated pipeline status'
          },
          configuration: {
            type: 'object',
            description: 'Updated pipeline configuration settings',
            properties: {
              triggers: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['push', 'pull_request', 'manual', 'scheduled']
                },
                description: 'Updated pipeline trigger types'
              },
              environment: {
                type: 'string',
                description: 'Updated build environment specification'
              },
              variables: {
                type: 'object',
                additionalProperties: {
                  type: 'string'
                },
                description: 'Updated environment variables for the pipeline'
              },
              steps: {
                type: 'array',
                description: 'Updated pipeline execution steps',
                items: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                      description: 'Step name'
                    },
                    type: {
                      type: 'string',
                      enum: ['build', 'test', 'deploy', 'custom'],
                      description: 'Step type'
                    },
                    command: {
                      type: 'string',
                      description: 'Command to execute'
                    },
                    script: {
                      type: 'string',
                      description: 'Script content'
                    },
                    timeout: {
                      type: 'number',
                      description: 'Step timeout in seconds'
                    }
                  },
                  required: ['name', 'type']
                }
              },
              notifications: {
                type: 'object',
                description: 'Updated notification configuration',
                properties: {
                  email: {
                    type: 'array',
                    items: {
                      type: 'string',
                      format: 'email'
                    },
                    description: 'Updated email addresses for notifications'
                  },
                  webhook: {
                    type: 'string',
                    format: 'uri',
                    description: 'Updated webhook URL for notifications'
                  },
                  slack: {
                    type: 'string',
                    description: 'Updated Slack channel or webhook for notifications'
                  }
                }
              }
            }
          },
          permissions: {
            type: 'object',
            description: 'Updated pipeline access permissions',
            properties: {
              users: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: 'Updated list of users with access'
              },
              groups: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: 'Updated list of groups with access'
              },
              public: {
                type: 'boolean',
                description: 'Updated public accessibility setting'
              }
            }
          }
        }
      }
    },
    required: ['pipeline_id', 'repository', 'updates']
  }
};

/**
 * Execute pipeline configuration
 * 
 * @param input - Pipeline configuration parameters
 * @returns Pipeline configuration result
 */
export async function executeConfigurePipeline(input: ConfigurePipelineInput): Promise<ConfigurePipelineOutput> {
  try {
    // Validate input
    const validatedInput = ConfigurePipelineSchema.parse(input);
    
    // Sanitize inputs
    const sanitizedInput = {
      pipeline_id: validatedInput.pipeline_id.trim(),
      repository: validatedInput.repository.trim(),
      updates: {
        name: validatedInput.updates.name?.trim(),
        description: validatedInput.updates.description?.trim(),
        status: validatedInput.updates.status,
        configuration: validatedInput.updates.configuration ? {
          triggers: validatedInput.updates.configuration.triggers,
          environment: validatedInput.updates.configuration.environment?.trim(),
          variables: validatedInput.updates.configuration.variables || {},
          steps: validatedInput.updates.configuration.steps || [],
          notifications: validatedInput.updates.configuration.notifications || {}
        } : undefined,
        permissions: validatedInput.updates.permissions
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

    // Validate updates object
    if (!sanitizedInput.updates || Object.keys(sanitizedInput.updates).length === 0) {
      return {
        success: false,
        error: 'At least one update field is required'
      };
    }

    // Validate name if provided
    if (sanitizedInput.updates.name && sanitizedInput.updates.name.length > 100) {
      return {
        success: false,
        error: 'Pipeline name must be 1-100 characters'
      };
    }

    // Validate configuration if provided
    if (sanitizedInput.updates.configuration) {
      if (sanitizedInput.updates.configuration.steps.length > 50) {
        return {
          success: false,
          error: 'Maximum 50 steps allowed per pipeline'
        };
      }

      // Validate variables
      const variableKeys = Object.keys(sanitizedInput.updates.configuration.variables);
      if (variableKeys.length > 100) {
        return {
          success: false,
          error: 'Maximum 100 environment variables allowed'
        };
      }

      // Validate step configurations
      for (const step of sanitizedInput.updates.configuration.steps) {
        if (!step.name || step.name.length > 50) {
          return {
            success: false,
            error: 'Step names must be 1-50 characters'
          };
        }
        
        if (step.timeout && (step.timeout < 1 || step.timeout > 3600)) {
          return {
            success: false,
            error: 'Step timeout must be between 1 and 3600 seconds'
          };
        }
      }
    }

    // Simulate pipeline configuration update (replace with actual Bitbucket API call)
    const updatedPipeline = {
      id: sanitizedInput.pipeline_id,
      name: sanitizedInput.updates.name || 'Updated Pipeline',
      repository: sanitizedInput.repository,
      status: sanitizedInput.updates.status || 'active',
      updated_at: new Date().toISOString(),
      updated_by: 'current_user', // Replace with actual user context
      configuration: sanitizedInput.updates.configuration || {
        triggers: ['manual'],
        variables: {},
        steps: [],
        notifications: {}
      },
      permissions: sanitizedInput.updates.permissions || {}
    };

    // Log pipeline configuration update
    console.log(`Pipeline configured: ${sanitizedInput.pipeline_id} in repository: ${sanitizedInput.repository}`);

    return {
      success: true,
      pipeline: updatedPipeline
    };

  } catch (error) {
    console.error('Error configuring pipeline:', error);
    
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

export default configurePipelineTool;
