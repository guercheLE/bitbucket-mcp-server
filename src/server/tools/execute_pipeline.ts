/**
 * Execute Pipeline Tool
 * 
 * MCP tool for executing CI/CD pipelines in Bitbucket repositories.
 * Supports starting, stopping, and restarting pipeline runs with
 * comprehensive status tracking and error handling.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { PipelineService } from '../services/pipeline-service.js';
import { RunPipelineRequest, PipelineTriggerType } from '../../types/pipeline.js';

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

    let result: any;

    // Execute action based on input
    switch (sanitizedInput.action) {
      case 'start':
        const runRequest: RunPipelineRequest = {
          pipelineId: sanitizedInput.pipeline_id,
          environment: sanitizedInput.parameters?.environment,
          variables: sanitizedInput.parameters?.variables,
          triggerType: PipelineTriggerType.MANUAL,
          branch: sanitizedInput.parameters?.branch,
          commit: sanitizedInput.parameters?.commit
        };
        
        const runResponse = await pipelineService.runPipeline(runRequest);
        
        if (!runResponse.success || !runResponse.data) {
          return {
            success: false,
            error: runResponse.error?.message || 'Failed to start pipeline'
          };
        }

        result = {
          id: runResponse.data.id,
          pipeline_id: sanitizedInput.pipeline_id,
          repository: sanitizedInput.repository,
          action: sanitizedInput.action,
          status: runResponse.data.status,
          started_at: runResponse.data.startTime.toISOString(),
          started_by: 'current_user', // Replace with actual user context
          parameters: sanitizedInput.parameters,
          estimated_duration: sanitizedInput.parameters?.timeout || 1800,
          progress: {
            current_step: runResponse.data.steps[0]?.name || 'Initializing',
            completed_steps: 0,
            total_steps: runResponse.data.steps.length,
            percentage: 0
          }
        };
        break;

      case 'stop':
        const stopResponse = await pipelineService.stopPipelineRun(sanitizedInput.pipeline_id);
        
        if (!stopResponse.success || !stopResponse.data) {
          return {
            success: false,
            error: stopResponse.error?.message || 'Failed to stop pipeline'
          };
        }

        result = {
          id: stopResponse.data.id,
          pipeline_id: sanitizedInput.pipeline_id,
          repository: sanitizedInput.repository,
          action: sanitizedInput.action,
          status: stopResponse.data.status,
          started_at: stopResponse.data.startTime.toISOString(),
          started_by: 'current_user',
          parameters: sanitizedInput.parameters
        };
        break;

      case 'restart':
        // First stop the current run, then start a new one
        await pipelineService.stopPipelineRun(sanitizedInput.pipeline_id);
        
        const restartRequest: RunPipelineRequest = {
          pipelineId: sanitizedInput.pipeline_id,
          environment: sanitizedInput.parameters?.environment,
          variables: sanitizedInput.parameters?.variables,
          triggerType: PipelineTriggerType.MANUAL,
          branch: sanitizedInput.parameters?.branch,
          commit: sanitizedInput.parameters?.commit
        };
        
        const restartResponse = await pipelineService.runPipeline(restartRequest);
        
        if (!restartResponse.success || !restartResponse.data) {
          return {
            success: false,
            error: restartResponse.error?.message || 'Failed to restart pipeline'
          };
        }

        result = {
          id: restartResponse.data.id,
          pipeline_id: sanitizedInput.pipeline_id,
          repository: sanitizedInput.repository,
          action: sanitizedInput.action,
          status: restartResponse.data.status,
          started_at: restartResponse.data.startTime.toISOString(),
          started_by: 'current_user',
          parameters: sanitizedInput.parameters,
          estimated_duration: sanitizedInput.parameters?.timeout || 1800,
          progress: {
            current_step: 'Restarting',
            completed_steps: 0,
            total_steps: restartResponse.data.steps.length,
            percentage: 0
          }
        };
        break;
    }

    // Log pipeline execution
    console.log(`Pipeline ${sanitizedInput.action}: ${result.id} for pipeline: ${sanitizedInput.pipeline_id}`);

    return {
      success: true,
      execution: result
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
