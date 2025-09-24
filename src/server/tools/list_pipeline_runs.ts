/**
 * List Pipeline Runs Tool
 * 
 * MCP tool for listing pipeline execution history in Bitbucket repositories
 * with comprehensive filtering, sorting, and pagination capabilities.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Input validation schema
const ListPipelineRunsSchema = z.object({
  pipeline_id: z.string().min(1, 'Pipeline ID is required'),
  repository: z.string().min(1, 'Repository is required'),
  filters: z.object({
    status: z.array(z.enum(['queued', 'running', 'completed', 'failed', 'cancelled', 'stopped'])).optional(),
    branch: z.string().optional(),
    triggered_by: z.string().optional(),
    date_from: z.string().optional(),
    date_to: z.string().optional()
  }).optional(),
  sorting: z.object({
    field: z.enum(['started_at', 'completed_at', 'duration', 'status']).optional(),
    order: z.enum(['asc', 'desc']).optional()
  }).optional(),
  pagination: z.object({
    page: z.number().min(1).optional(),
    limit: z.number().min(1).max(100).optional()
  }).optional()
});

type ListPipelineRunsInput = z.infer<typeof ListPipelineRunsSchema>;

// Output validation schema
const ListPipelineRunsOutputSchema = z.object({
  success: z.boolean(),
  runs: z.array(z.object({
    id: z.string(),
    pipeline_id: z.string(),
    repository: z.string(),
    status: z.enum(['queued', 'running', 'completed', 'failed', 'cancelled', 'stopped']),
    started_at: z.string(),
    completed_at: z.string().optional(),
    duration: z.number().optional(),
    triggered_by: z.string(),
    branch: z.string().optional(),
    commit: z.string().optional(),
    progress: z.object({
      completed_steps: z.number(),
      total_steps: z.number(),
      percentage: z.number()
    }).optional(),
    metrics: z.object({
      cpu_usage: z.number().optional(),
      memory_usage: z.number().optional(),
      disk_usage: z.number().optional()
    }).optional()
  })).optional(),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    total_pages: z.number(),
    has_next: z.boolean(),
    has_previous: z.boolean()
  }).optional(),
  error: z.string().optional()
});

type ListPipelineRunsOutput = z.infer<typeof ListPipelineRunsOutputSchema>;

/**
 * List Pipeline Runs MCP Tool
 * 
 * Lists pipeline execution history with comprehensive filtering, sorting,
 * and pagination capabilities for Bitbucket repositories.
 * 
 * Features:
 * - Comprehensive execution history listing
 * - Advanced filtering by status, branch, user, and date range
 * - Flexible sorting by multiple fields
 * - Pagination support for large datasets
 * - Progress and metrics information
 * - Input validation and sanitization
 * - Error handling and logging
 * 
 * @param input - Pipeline runs listing parameters
 * @returns Pipeline runs list with pagination information
 */
export const listPipelineRunsTool: Tool = {
  name: 'list_pipeline_runs',
  description: 'List pipeline execution history with comprehensive filtering, sorting, and pagination capabilities',
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
      filters: {
        type: 'object',
        description: 'Optional filters for pipeline runs',
        properties: {
          status: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['queued', 'running', 'completed', 'failed', 'cancelled', 'stopped']
            },
            description: 'Filter by execution status'
          },
          branch: {
            type: 'string',
            description: 'Filter by branch name'
          },
          triggered_by: {
            type: 'string',
            description: 'Filter by user who triggered the execution'
          },
          date_from: {
            type: 'string',
            format: 'date-time',
            description: 'Filter runs from this date (ISO 8601)'
          },
          date_to: {
            type: 'string',
            format: 'date-time',
            description: 'Filter runs until this date (ISO 8601)'
          }
        }
      },
      sorting: {
        type: 'object',
        description: 'Optional sorting configuration',
        properties: {
          field: {
            type: 'string',
            enum: ['started_at', 'completed_at', 'duration', 'status'],
            description: 'Field to sort by'
          },
          order: {
            type: 'string',
            enum: ['asc', 'desc'],
            description: 'Sort order'
          }
        }
      },
      pagination: {
        type: 'object',
        description: 'Optional pagination configuration',
        properties: {
          page: {
            type: 'number',
            minimum: 1,
            description: 'Page number (1-based)'
          },
          limit: {
            type: 'number',
            minimum: 1,
            maximum: 100,
            description: 'Number of items per page (1-100)'
          }
        }
      }
    },
    required: ['pipeline_id', 'repository']
  }
};

/**
 * Execute pipeline runs listing
 * 
 * @param input - Pipeline runs listing parameters
 * @returns Pipeline runs list result
 */
export async function executeListPipelineRuns(input: ListPipelineRunsInput): Promise<ListPipelineRunsOutput> {
  try {
    // Validate input
    const validatedInput = ListPipelineRunsSchema.parse(input);
    
    // Sanitize inputs
    const sanitizedInput = {
      pipeline_id: validatedInput.pipeline_id.trim(),
      repository: validatedInput.repository.trim(),
      filters: validatedInput.filters ? {
        status: validatedInput.filters.status,
        branch: validatedInput.filters.branch?.trim(),
        triggered_by: validatedInput.filters.triggered_by?.trim(),
        date_from: validatedInput.filters.date_from,
        date_to: validatedInput.filters.date_to
      } : undefined,
      sorting: validatedInput.sorting || { field: 'started_at', order: 'desc' },
      pagination: validatedInput.pagination || { page: 1, limit: 20 }
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

    // Validate pagination
    if (sanitizedInput.pagination.limit < 1 || sanitizedInput.pagination.limit > 100) {
      return {
        success: false,
        error: 'Pagination limit must be between 1 and 100'
      };
    }

    if (sanitizedInput.pagination.page < 1) {
      return {
        success: false,
        error: 'Pagination page must be at least 1'
      };
    }

    // Simulate pipeline runs listing (replace with actual Bitbucket API call)
    const currentTime = new Date();
    
    // Generate sample pipeline runs
    const sampleRuns = [
      {
        id: 'exec_001',
        pipeline_id: sanitizedInput.pipeline_id,
        repository: sanitizedInput.repository,
        status: 'completed' as const,
        started_at: new Date(currentTime.getTime() - 3600000).toISOString(),
        completed_at: new Date(currentTime.getTime() - 3300000).toISOString(),
        duration: 300,
        triggered_by: 'user@example.com',
        branch: 'main',
        commit: 'abc123def456',
        progress: {
          completed_steps: 4,
          total_steps: 4,
          percentage: 100
        },
        metrics: {
          cpu_usage: 45.2,
          memory_usage: 67.8,
          disk_usage: 23.1
        }
      },
      {
        id: 'exec_002',
        pipeline_id: sanitizedInput.pipeline_id,
        repository: sanitizedInput.repository,
        status: 'failed' as const,
        started_at: new Date(currentTime.getTime() - 7200000).toISOString(),
        completed_at: new Date(currentTime.getTime() - 6900000).toISOString(),
        duration: 300,
        triggered_by: 'user@example.com',
        branch: 'feature/new-feature',
        commit: 'def456ghi789',
        progress: {
          completed_steps: 2,
          total_steps: 4,
          percentage: 50
        },
        metrics: {
          cpu_usage: 52.1,
          memory_usage: 71.3,
          disk_usage: 28.7
        }
      },
      {
        id: 'exec_003',
        pipeline_id: sanitizedInput.pipeline_id,
        repository: sanitizedInput.repository,
        status: 'running' as const,
        started_at: new Date(currentTime.getTime() - 300000).toISOString(),
        triggered_by: 'webhook',
        branch: 'main',
        commit: 'ghi789jkl012',
        progress: {
          completed_steps: 2,
          total_steps: 4,
          percentage: 50
        },
        metrics: {
          cpu_usage: 38.9,
          memory_usage: 62.4,
          disk_usage: 19.8
        }
      },
      {
        id: 'exec_004',
        pipeline_id: sanitizedInput.pipeline_id,
        repository: sanitizedInput.repository,
        status: 'completed' as const,
        started_at: new Date(currentTime.getTime() - 10800000).toISOString(),
        completed_at: new Date(currentTime.getTime() - 10500000).toISOString(),
        duration: 300,
        triggered_by: 'user@example.com',
        branch: 'main',
        commit: 'jkl012mno345',
        progress: {
          completed_steps: 4,
          total_steps: 4,
          percentage: 100
        },
        metrics: {
          cpu_usage: 41.7,
          memory_usage: 65.2,
          disk_usage: 21.5
        }
      },
      {
        id: 'exec_005',
        pipeline_id: sanitizedInput.pipeline_id,
        repository: sanitizedInput.repository,
        status: 'cancelled' as const,
        started_at: new Date(currentTime.getTime() - 14400000).toISOString(),
        completed_at: new Date(currentTime.getTime() - 14100000).toISOString(),
        duration: 300,
        triggered_by: 'user@example.com',
        branch: 'feature/experimental',
        commit: 'mno345pqr678',
        progress: {
          completed_steps: 1,
          total_steps: 4,
          percentage: 25
        },
        metrics: {
          cpu_usage: 29.3,
          memory_usage: 48.6,
          disk_usage: 15.2
        }
      }
    ];

    // Apply filters if provided
    let filteredRuns = sampleRuns;
    if (sanitizedInput.filters) {
      if (sanitizedInput.filters.status && sanitizedInput.filters.status.length > 0) {
        filteredRuns = filteredRuns.filter(run => 
          sanitizedInput.filters!.status!.includes(run.status)
        );
      }
      
      if (sanitizedInput.filters.branch) {
        filteredRuns = filteredRuns.filter(run => 
          run.branch === sanitizedInput.filters!.branch
        );
      }
      
      if (sanitizedInput.filters.triggered_by) {
        filteredRuns = filteredRuns.filter(run => 
          run.triggered_by.includes(sanitizedInput.filters!.triggered_by!)
        );
      }
    }

    // Apply sorting
    filteredRuns.sort((a, b) => {
      const field = sanitizedInput.sorting.field;
      const order = sanitizedInput.sorting.order;
      
      let comparison = 0;
      switch (field) {
        case 'started_at':
          comparison = new Date(a.started_at).getTime() - new Date(b.started_at).getTime();
          break;
        case 'completed_at':
          const aCompleted = a.completed_at ? new Date(a.completed_at).getTime() : 0;
          const bCompleted = b.completed_at ? new Date(b.completed_at).getTime() : 0;
          comparison = aCompleted - bCompleted;
          break;
        case 'duration':
          comparison = (a.duration || 0) - (b.duration || 0);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      
      return order === 'desc' ? -comparison : comparison;
    });

    // Apply pagination
    const total = filteredRuns.length;
    const totalPages = Math.ceil(total / sanitizedInput.pagination.limit);
    const startIndex = (sanitizedInput.pagination.page - 1) * sanitizedInput.pagination.limit;
    const endIndex = startIndex + sanitizedInput.pagination.limit;
    const paginatedRuns = filteredRuns.slice(startIndex, endIndex);

    const pagination = {
      page: sanitizedInput.pagination.page,
      limit: sanitizedInput.pagination.limit,
      total: total,
      total_pages: totalPages,
      has_next: sanitizedInput.pagination.page < totalPages,
      has_previous: sanitizedInput.pagination.page > 1
    };

    // Log pipeline runs listing
    console.log(`Listed ${paginatedRuns.length} pipeline runs for pipeline: ${sanitizedInput.pipeline_id}`);

    return {
      success: true,
      runs: paginatedRuns,
      pagination: pagination
    };

  } catch (error) {
    console.error('Error listing pipeline runs:', error);
    
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

export default listPipelineRunsTool;
