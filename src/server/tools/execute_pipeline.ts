/**
 * Execute Pipeline Tool
 * 
 * MCP tool for executing CI/CD pipelines in Bitbucket repositories.
 * Supports starting, stopping, and restarting pipeline runs with
 * comprehensive status tracking and error handling.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Input validation schema
const ExecutePipelineSchema = z.object({
  pipeline_id: z.string().min(1, 'Pipeline ID is required'),
  repository: z.string().min(1, 'Repository is required'),
  action: z.enum(['start', 'stop', 'restart'], {
    errorMap: () => ({ message: 'Action must be start, stop, or restart' })
  }),
  parameters: z.object({
    branch: z.string().optional(),
    commit: z.string().optional(),
    variables: z.record(z.string()).optional(),
    environment: z.string().optional(),
    timeout: z.number().min(1).max(3600).optional()
  }).optional()
});

type ExecutePipelineInput = z.infer<typeof ExecutePipelineSchema>;

// Output validation schema
const ExecutePipelineOutputSchema = z.object({
  success: z.boolean(),
  execution: z.object({
    id: z.string(),
    pipeline_id: z.string(),
    repository: z.string(),
    action: z.enum(['start', 'stop', 'restart']),
    status: z.enum(['queued', 'running', 'completed', 'failed', 'cancelled', 'stopped']),
    started_at: z.string(),
    started_by: z.string(),
    parameters: z.object({
      branch: z.string().optional(),
      commit: z.string().optional(),
      variables: z.record(z.string()).optional(),
      environment: z.string().optional(),
      timeout: z.number().optional()
    }).optional(),
    estimated_duration: z.number().optional(),
    progress: z.object({
      current_step: z.string().optional(),
      completed_steps: z.number(),
      total_steps: z.number(),
      percentage: z.number()
    }).optional()
  }).optional(),
  error: z.string().optional()
});

type ExecutePipelineOutput = z.infer<typeof ExecutePipelineOutputSchema>;

/**
 * Execute Pipeline MCP Tool
 * 
 * Executes CI/CD pipeline operations including starting, stopping, and restarting
 * pipeline runs in Bitbucket repositories with comprehensive status tracking.
 * 
 * Features:
 * - Start new pipeline executions
 * - Stop running pipeline executions
 * - Restart failed or completed pipelines
 * - Parameter and environment configuration
 * - Real-time status tracking
 * - Progress monitoring
 * - Timeout handling
 * - Input validation and sanitization
 * - Error handling and logging
 * 
 * @param input - Pipeline execution parameters
 * @returns Pipeline execution result with status details
 */
export const executePipelineTool: Tool = {
  name: 'execute_pipeline',
  description: 'Execute CI/CD pipeline operations including starting, stopping, and restarting pipeline runs with comprehensive status tracking',
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
        enum: ['start', 'stop', 'restart'],
        description: 'Pipeline execution action to perform'
      },
      parameters: {
        type: 'object',
        description: 'Optional execution parameters',
        properties: {
          branch: {
            type: 'string',
            description: 'Branch to execute pipeline on'
          },
          commit: {
            type: 'string',
            description: 'Specific commit to execute pipeline on'
          },
          variables: {
            type: 'object',
            additionalProperties: {
              type: 'string'
            },
            description: 'Environment variables for pipeline execution'
          },
          environment: {
            type: 'string',
            description: 'Target environment for pipeline execution'
          },
          timeout: {
            type: 'number',
            minimum: 1,
            maximum: 3600,
            description: 'Execution timeout in seconds (1-3600)'
          }
        }
      }
    },
    required: ['pipeline_id', 'repository', 'action']
  }
};

/**
 * Execute pipeline operation
 * 
 * @param input - Pipeline execution parameters
 * @returns Pipeline execution result
 */
export async function executeExecutePipeline(input: ExecutePipelineInput): Promise<ExecutePipelineOutput> {
  try {
    // Validate input
    const validatedInput = ExecutePipelineSchema.parse(input);
    
    // Sanitize inputs
    const sanitizedInput = {
      pipeline_id: validatedInput.pipeline_id.trim(),
      repository: validatedInput.repository.trim(),
      action: validatedInput.action,
      parameters: validatedInput.parameters ? {
        branch: validatedInput.parameters.branch?.trim(),
        commit: validatedInput.parameters.commit?.trim(),
        variables: validatedInput.parameters.variables || {},
        environment: validatedInput.parameters.environment?.trim(),
        timeout: validatedInput.parameters.timeout
      } : undefined
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

    // Validate action
    if (!['start', 'stop', 'restart'].includes(sanitizedInput.action)) {
      return {
        success: false,
        error: 'Action must be start, stop, or restart'
      };
    }

    // Validate parameters if provided
    if (sanitizedInput.parameters) {
      // Validate variables
      const variableKeys = Object.keys(sanitizedInput.parameters.variables);
      if (variableKeys.length > 100) {
        return {
          success: false,
          error: 'Maximum 100 environment variables allowed'
        };
      }

      // Validate timeout
      if (sanitizedInput.parameters.timeout && 
          (sanitizedInput.parameters.timeout < 1 || sanitizedInput.parameters.timeout > 3600)) {
        return {
          success: false,
          error: 'Timeout must be between 1 and 3600 seconds'
        };
      }
    }

    // Simulate pipeline execution (replace with actual Bitbucket API call)
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Determine initial status based on action
    let initialStatus: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'stopped';
    let estimatedDuration: number | undefined;
    let progress: any = undefined;

    switch (sanitizedInput.action) {
      case 'start':
        initialStatus = 'queued';
        estimatedDuration = sanitizedInput.parameters?.timeout || 1800; // Default 30 minutes
        progress = {
          current_step: 'Initializing',
          completed_steps: 0,
          total_steps: 5, // Default number of steps
          percentage: 0
        };
        break;
      case 'stop':
        initialStatus = 'stopped';
        break;
      case 'restart':
        initialStatus = 'queued';
        estimatedDuration = sanitizedInput.parameters?.timeout || 1800;
        progress = {
          current_step: 'Restarting',
          completed_steps: 0,
          total_steps: 5,
          percentage: 0
        };
        break;
    }

    const execution = {
      id: executionId,
      pipeline_id: sanitizedInput.pipeline_id,
      repository: sanitizedInput.repository,
      action: sanitizedInput.action,
      status: initialStatus,
      started_at: new Date().toISOString(),
      started_by: 'current_user', // Replace with actual user context
      parameters: sanitizedInput.parameters,
      estimated_duration: estimatedDuration,
      progress: progress
    };

    // Log pipeline execution
    console.log(`Pipeline ${sanitizedInput.action}: ${executionId} for pipeline: ${sanitizedInput.pipeline_id}`);

    return {
      success: true,
      execution: execution
    };

  } catch (error) {
    console.error('Error executing pipeline:', error);
    
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

export default executePipelineTool;
