/**
 * Get Pipeline Status Tool
 * 
 * MCP tool for retrieving detailed status information about CI/CD pipelines
 * and their executions in Bitbucket repositories.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Input validation schema
const GetPipelineStatusSchema = z.object({
  pipeline_id: z.string().min(1, 'Pipeline ID is required'),
  repository: z.string().min(1, 'Repository is required'),
  execution_id: z.string().optional(),
  include_history: z.boolean().optional(),
  include_configuration: z.boolean().optional(),
  limit: z.number().min(1).max(100).optional()
});

type GetPipelineStatusInput = z.infer<typeof GetPipelineStatusSchema>;

// Output validation schema
const GetPipelineStatusOutputSchema = z.object({
  success: z.boolean(),
  pipeline: z.object({
    id: z.string(),
    name: z.string(),
    repository: z.string(),
    status: z.enum(['active', 'inactive', 'draft']),
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
    }).optional(),
    current_execution: z.object({
      id: z.string(),
      status: z.enum(['queued', 'running', 'completed', 'failed', 'cancelled', 'stopped']),
      progress: z.object({
        current_step: z.string().optional(),
        completed_steps: z.number(),
        total_steps: z.number(),
        percentage: z.number()
      }),
      timing: z.object({
        started_at: z.string(),
        updated_at: z.string(),
        duration: z.number().optional()
      })
    }).optional(),
    execution_history: z.array(z.object({
      id: z.string(),
      status: z.enum(['queued', 'running', 'completed', 'failed', 'cancelled', 'stopped']),
      started_at: z.string(),
      completed_at: z.string().optional(),
      duration: z.number().optional(),
      triggered_by: z.string(),
      branch: z.string().optional(),
      commit: z.string().optional()
    })).optional(),
    statistics: z.object({
      total_executions: z.number(),
      successful_executions: z.number(),
      failed_executions: z.number(),
      average_duration: z.number(),
      success_rate: z.number(),
      last_execution: z.string().optional()
    }).optional()
  }).optional(),
  error: z.string().optional()
});

type GetPipelineStatusOutput = z.infer<typeof GetPipelineStatusOutputSchema>;

/**
 * Get Pipeline Status MCP Tool
 * 
 * Retrieves comprehensive status information about CI/CD pipelines including
 * current execution status, configuration, history, and statistics.
 * 
 * Features:
 * - Detailed pipeline status information
 * - Current execution monitoring
 * - Execution history tracking
 * - Configuration details
 * - Performance statistics
 * - Success rate analysis
 * - Optional data inclusion
 * - Input validation and sanitization
 * - Error handling and logging
 * 
 * @param input - Pipeline status query parameters
 * @returns Pipeline status result with comprehensive details
 */
export const getPipelineStatusTool: Tool = {
  name: 'get_pipeline_status',
  description: 'Retrieve comprehensive status information about CI/CD pipelines including current execution status, configuration, history, and statistics',
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
      execution_id: {
        type: 'string',
        description: 'Optional specific execution ID to get status for'
      },
      include_history: {
        type: 'boolean',
        description: 'Whether to include execution history in the response'
      },
      include_configuration: {
        type: 'boolean',
        description: 'Whether to include pipeline configuration in the response'
      },
      limit: {
        type: 'number',
        minimum: 1,
        maximum: 100,
        description: 'Maximum number of history entries to return (1-100)'
      }
    },
    required: ['pipeline_id', 'repository']
  }
};

/**
 * Execute pipeline status retrieval
 * 
 * @param input - Pipeline status query parameters
 * @returns Pipeline status result
 */
export async function executeGetPipelineStatus(input: GetPipelineStatusInput): Promise<GetPipelineStatusOutput> {
  try {
    // Validate input
    const validatedInput = GetPipelineStatusSchema.parse(input);
    
    // Sanitize inputs
    const sanitizedInput = {
      pipeline_id: validatedInput.pipeline_id.trim(),
      repository: validatedInput.repository.trim(),
      execution_id: validatedInput.execution_id?.trim(),
      include_history: validatedInput.include_history || false,
      include_configuration: validatedInput.include_configuration || false,
      limit: validatedInput.limit || 10
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

    // Validate limit
    if (sanitizedInput.limit < 1 || sanitizedInput.limit > 100) {
      return {
        success: false,
        error: 'Limit must be between 1 and 100'
      };
    }

    // Simulate pipeline status retrieval (replace with actual Bitbucket API call)
    const currentTime = new Date();
    const startTime = new Date(currentTime.getTime() - 300000); // 5 minutes ago
    const duration = Math.floor((currentTime.getTime() - startTime.getTime()) / 1000);
    
    const pipeline = {
      id: sanitizedInput.pipeline_id,
      name: 'Sample Pipeline',
      repository: sanitizedInput.repository,
      status: 'active' as const,
      configuration: sanitizedInput.include_configuration ? {
        triggers: ['push', 'pull_request', 'manual'],
        environment: 'production',
        variables: {
          'NODE_VERSION': '18',
          'BUILD_ENV': 'production'
        },
        steps: [
          {
            name: 'Install Dependencies',
            type: 'build',
            command: 'npm install',
            timeout: 300
          },
          {
            name: 'Run Tests',
            type: 'test',
            command: 'npm test',
            timeout: 600
          },
          {
            name: 'Build Application',
            type: 'build',
            command: 'npm run build',
            timeout: 900
          },
          {
            name: 'Deploy',
            type: 'deploy',
            command: 'npm run deploy',
            timeout: 1200
          }
        ],
        notifications: {
          email: ['admin@example.com'],
          webhook: 'https://hooks.slack.com/services/...',
          slack: '#deployments'
        }
      } : undefined,
      current_execution: {
        id: sanitizedInput.execution_id || `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'running' as const,
        progress: {
          current_step: 'Run Tests',
          completed_steps: 2,
          total_steps: 4,
          percentage: 50
        },
        timing: {
          started_at: startTime.toISOString(),
          updated_at: currentTime.toISOString(),
          duration: duration
        }
      },
      execution_history: sanitizedInput.include_history ? [
        {
          id: 'exec_001',
          status: 'completed' as const,
          started_at: new Date(currentTime.getTime() - 3600000).toISOString(),
          completed_at: new Date(currentTime.getTime() - 3300000).toISOString(),
          duration: 300,
          triggered_by: 'user@example.com',
          branch: 'main',
          commit: 'abc123def456'
        },
        {
          id: 'exec_002',
          status: 'failed' as const,
          started_at: new Date(currentTime.getTime() - 7200000).toISOString(),
          completed_at: new Date(currentTime.getTime() - 6900000).toISOString(),
          duration: 300,
          triggered_by: 'user@example.com',
          branch: 'feature/new-feature',
          commit: 'def456ghi789'
        },
        {
          id: 'exec_003',
          status: 'completed' as const,
          started_at: new Date(currentTime.getTime() - 10800000).toISOString(),
          completed_at: new Date(currentTime.getTime() - 10500000).toISOString(),
          duration: 300,
          triggered_by: 'webhook',
          branch: 'main',
          commit: 'ghi789jkl012'
        }
      ].slice(0, sanitizedInput.limit) : undefined,
      statistics: {
        total_executions: 156,
        successful_executions: 142,
        failed_executions: 14,
        average_duration: 285,
        success_rate: 91.0,
        last_execution: new Date(currentTime.getTime() - 3600000).toISOString()
      }
    };

    // Log pipeline status retrieval
    console.log(`Retrieved status for pipeline: ${sanitizedInput.pipeline_id}`);

    return {
      success: true,
      pipeline: pipeline
    };

  } catch (error) {
    console.error('Error getting pipeline status:', error);
    
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

export default getPipelineStatusTool;
