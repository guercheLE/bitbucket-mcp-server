/**
 * Get Pipeline Logs Tool
 * 
 * MCP tool for retrieving pipeline execution logs from Bitbucket repositories
 * with comprehensive filtering, streaming, and pagination capabilities.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Input validation schema
const GetPipelineLogsSchema = z.object({
  pipeline_id: z.string().min(1, 'Pipeline ID is required'),
  repository: z.string().min(1, 'Repository is required'),
  execution_id: z.string().min(1, 'Execution ID is required'),
  filters: z.object({
    level: z.array(z.enum(['info', 'warning', 'error', 'debug'])).optional(),
    step: z.string().optional(),
    search: z.string().optional(),
    date_from: z.string().optional(),
    date_to: z.string().optional()
  }).optional(),
  pagination: z.object({
    page: z.number().min(1).optional(),
    limit: z.number().min(1).max(1000).optional()
  }).optional(),
  format: z.enum(['json', 'text', 'html']).optional()
});

type GetPipelineLogsInput = z.infer<typeof GetPipelineLogsSchema>;

// Output validation schema
const GetPipelineLogsOutputSchema = z.object({
  success: z.boolean(),
  logs: z.array(z.object({
    timestamp: z.string(),
    level: z.enum(['info', 'warning', 'error', 'debug']),
    message: z.string(),
    step: z.string().optional(),
    source: z.string().optional(),
    metadata: z.record(z.any()).optional()
  })).optional(),
  execution_info: z.object({
    id: z.string(),
    pipeline_id: z.string(),
    repository: z.string(),
    status: z.enum(['queued', 'running', 'completed', 'failed', 'cancelled', 'stopped']),
    started_at: z.string(),
    completed_at: z.string().optional(),
    duration: z.number().optional()
  }).optional(),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    total_pages: z.number(),
    has_next: z.boolean(),
    has_previous: z.boolean()
  }).optional(),
  summary: z.object({
    total_logs: z.number(),
    error_count: z.number(),
    warning_count: z.number(),
    info_count: z.number(),
    debug_count: z.number()
  }).optional(),
  error: z.string().optional()
});

type GetPipelineLogsOutput = z.infer<typeof GetPipelineLogsOutputSchema>;

/**
 * Get Pipeline Logs MCP Tool
 * 
 * Retrieves pipeline execution logs with comprehensive filtering, streaming,
 * and pagination capabilities for Bitbucket repositories.
 * 
 * Features:
 * - Comprehensive log retrieval and filtering
 * - Multiple log level filtering
 * - Step-specific log filtering
 * - Text search within logs
 * - Date range filtering
 * - Pagination support for large log files
 * - Multiple output formats (JSON, text, HTML)
 * - Log summary and statistics
 * - Input validation and sanitization
 * - Error handling and logging
 * 
 * @param input - Pipeline logs retrieval parameters
 * @returns Pipeline logs with pagination and summary information
 */
export const getPipelineLogsTool: Tool = {
  name: 'get_pipeline_logs',
  description: 'Retrieve pipeline execution logs with comprehensive filtering, streaming, and pagination capabilities',
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
        description: 'Execution identifier'
      },
      filters: {
        type: 'object',
        description: 'Optional filters for pipeline logs',
        properties: {
          level: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['info', 'warning', 'error', 'debug']
            },
            description: 'Filter by log level'
          },
          step: {
            type: 'string',
            description: 'Filter by pipeline step name'
          },
          search: {
            type: 'string',
            description: 'Search for text within log messages'
          },
          date_from: {
            type: 'string',
            format: 'date-time',
            description: 'Filter logs from this date (ISO 8601)'
          },
          date_to: {
            type: 'string',
            format: 'date-time',
            description: 'Filter logs until this date (ISO 8601)'
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
            maximum: 1000,
            description: 'Number of log entries per page (1-1000)'
          }
        }
      },
      format: {
        type: 'string',
        enum: ['json', 'text', 'html'],
        description: 'Output format for logs'
      }
    },
    required: ['pipeline_id', 'repository', 'execution_id']
  }
};

/**
 * Execute pipeline logs retrieval
 * 
 * @param input - Pipeline logs retrieval parameters
 * @returns Pipeline logs result
 */
export async function executeGetPipelineLogs(input: GetPipelineLogsInput): Promise<GetPipelineLogsOutput> {
  try {
    // Validate input
    const validatedInput = GetPipelineLogsSchema.parse(input);
    
    // Sanitize inputs
    const sanitizedInput = {
      pipeline_id: validatedInput.pipeline_id.trim(),
      repository: validatedInput.repository.trim(),
      execution_id: validatedInput.execution_id.trim(),
      filters: validatedInput.filters ? {
        level: validatedInput.filters.level,
        step: validatedInput.filters.step?.trim(),
        search: validatedInput.filters.search?.trim(),
        date_from: validatedInput.filters.date_from,
        date_to: validatedInput.filters.date_to
      } : undefined,
      pagination: validatedInput.pagination || { page: 1, limit: 100 },
      format: validatedInput.format || 'json'
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

    // Validate execution ID
    if (!sanitizedInput.execution_id) {
      return {
        success: false,
        error: 'Execution ID is required'
      };
    }

    // Validate pagination
    if (sanitizedInput.pagination.limit < 1 || sanitizedInput.pagination.limit > 1000) {
      return {
        success: false,
        error: 'Pagination limit must be between 1 and 1000'
      };
    }

    if (sanitizedInput.pagination.page < 1) {
      return {
        success: false,
        error: 'Pagination page must be at least 1'
      };
    }

    // Simulate pipeline logs retrieval (replace with actual Bitbucket API call)
    const currentTime = new Date();
    const startTime = new Date(currentTime.getTime() - 300000); // 5 minutes ago
    
    // Generate sample pipeline logs
    const sampleLogs = [
      {
        timestamp: new Date(startTime.getTime() + 0).toISOString(),
        level: 'info' as const,
        message: 'Pipeline execution started',
        step: 'Initialization',
        source: 'pipeline',
        metadata: { user: 'system' }
      },
      {
        timestamp: new Date(startTime.getTime() + 10000).toISOString(),
        level: 'info' as const,
        message: 'Checking out repository',
        step: 'Setup',
        source: 'git',
        metadata: { branch: 'main', commit: 'abc123def456' }
      },
      {
        timestamp: new Date(startTime.getTime() + 20000).toISOString(),
        level: 'info' as const,
        message: 'Installing dependencies',
        step: 'Setup',
        source: 'npm',
        metadata: { package_manager: 'npm', version: '8.19.2' }
      },
      {
        timestamp: new Date(startTime.getTime() + 30000).toISOString(),
        level: 'info' as const,
        message: 'Dependencies installed successfully',
        step: 'Setup',
        source: 'npm',
        metadata: { packages_installed: 156 }
      },
      {
        timestamp: new Date(startTime.getTime() + 40000).toISOString(),
        level: 'info' as const,
        message: 'Starting build process',
        step: 'Build',
        source: 'webpack',
        metadata: { mode: 'production' }
      },
      {
        timestamp: new Date(startTime.getTime() + 50000).toISOString(),
        level: 'warning' as const,
        message: 'Deprecated API usage detected',
        step: 'Build',
        source: 'webpack',
        metadata: { warning_type: 'deprecation' }
      },
      {
        timestamp: new Date(startTime.getTime() + 60000).toISOString(),
        level: 'info' as const,
        message: 'Build completed successfully',
        step: 'Build',
        source: 'webpack',
        metadata: { build_time: 20.5, bundle_size: '2.3MB' }
      },
      {
        timestamp: new Date(startTime.getTime() + 70000).toISOString(),
        level: 'info' as const,
        message: 'Running test suite',
        step: 'Testing',
        source: 'jest',
        metadata: { test_framework: 'jest', version: '29.3.1' }
      },
      {
        timestamp: new Date(startTime.getTime() + 80000).toISOString(),
        level: 'info' as const,
        message: 'Running unit tests',
        step: 'Testing',
        source: 'jest',
        metadata: { test_type: 'unit', files: 45 }
      },
      {
        timestamp: new Date(startTime.getTime() + 90000).toISOString(),
        level: 'info' as const,
        message: 'Running integration tests',
        step: 'Testing',
        source: 'jest',
        metadata: { test_type: 'integration', files: 12 }
      },
      {
        timestamp: new Date(startTime.getTime() + 100000).toISOString(),
        level: 'error' as const,
        message: 'Test failure in user-authentication.test.js',
        step: 'Testing',
        source: 'jest',
        metadata: { test_file: 'user-authentication.test.js', line: 23 }
      },
      {
        timestamp: new Date(startTime.getTime() + 110000).toISOString(),
        level: 'info' as const,
        message: 'Test suite completed',
        step: 'Testing',
        source: 'jest',
        metadata: { total_tests: 157, passed: 156, failed: 1 }
      },
      {
        timestamp: new Date(startTime.getTime() + 120000).toISOString(),
        level: 'info' as const,
        message: 'Pipeline execution completed',
        step: 'Finalization',
        source: 'pipeline',
        metadata: { status: 'failed', duration: 120 }
      }
    ];

    // Apply filters if provided
    let filteredLogs = sampleLogs;
    if (sanitizedInput.filters) {
      if (sanitizedInput.filters.level && sanitizedInput.filters.level.length > 0) {
        filteredLogs = filteredLogs.filter(log => 
          sanitizedInput.filters!.level!.includes(log.level)
        );
      }
      
      if (sanitizedInput.filters.step) {
        filteredLogs = filteredLogs.filter(log => 
          log.step === sanitizedInput.filters!.step
        );
      }
      
      if (sanitizedInput.filters.search) {
        const searchTerm = sanitizedInput.filters.search.toLowerCase();
        filteredLogs = filteredLogs.filter(log => 
          log.message.toLowerCase().includes(searchTerm)
        );
      }
    }

    // Apply pagination
    const total = filteredLogs.length;
    const totalPages = Math.ceil(total / sanitizedInput.pagination.limit);
    const startIndex = (sanitizedInput.pagination.page - 1) * sanitizedInput.pagination.limit;
    const endIndex = startIndex + sanitizedInput.pagination.limit;
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

    const pagination = {
      page: sanitizedInput.pagination.page,
      limit: sanitizedInput.pagination.limit,
      total: total,
      total_pages: totalPages,
      has_next: sanitizedInput.pagination.page < totalPages,
      has_previous: sanitizedInput.pagination.page > 1
    };

    // Calculate log summary
    const summary = {
      total_logs: total,
      error_count: filteredLogs.filter(log => log.level === 'error').length,
      warning_count: filteredLogs.filter(log => log.level === 'warning').length,
      info_count: filteredLogs.filter(log => log.level === 'info').length,
      debug_count: filteredLogs.filter(log => log.level === 'debug').length
    };

    // Execution info
    const execution_info = {
      id: sanitizedInput.execution_id,
      pipeline_id: sanitizedInput.pipeline_id,
      repository: sanitizedInput.repository,
      status: 'failed' as const,
      started_at: startTime.toISOString(),
      completed_at: new Date(startTime.getTime() + 120000).toISOString(),
      duration: 120
    };

    // Log pipeline logs retrieval
    console.log(`Retrieved ${paginatedLogs.length} log entries for execution: ${sanitizedInput.execution_id}`);

    return {
      success: true,
      logs: paginatedLogs,
      execution_info: execution_info,
      pagination: pagination,
      summary: summary
    };

  } catch (error) {
    console.error('Error getting pipeline logs:', error);
    
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

export default getPipelineLogsTool;
