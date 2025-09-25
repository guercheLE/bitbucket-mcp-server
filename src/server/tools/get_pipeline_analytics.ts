/**
 * Get Pipeline Analytics Tool
 * 
 * MCP tool for retrieving comprehensive pipeline performance metrics and analytics
 * from Bitbucket repositories with advanced data aggregation and insights.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Input validation schema
const GetPipelineAnalyticsSchema = z.object({
  pipeline_id: z.string().min(1, 'Pipeline ID is required'),
  repository: z.string().min(1, 'Repository is required'),
  analytics_type: z.enum(['performance', 'reliability', 'usage', 'cost', 'trends', 'all'], {
    errorMap: () => ({ message: 'Analytics type must be performance, reliability, usage, cost, trends, or all' })
  }),
  time_range: z.object({
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    period: z.enum(['last_24h', 'last_7d', 'last_30d', 'last_90d', 'last_year', 'custom']).optional()
  }).optional(),
  filters: z.object({
    branches: z.array(z.string()).optional(),
    environments: z.array(z.string()).optional(),
    users: z.array(z.string()).optional(),
    status: z.array(z.enum(['success', 'failed', 'cancelled', 'running'])).optional()
  }).optional(),
  metrics: z.array(z.enum(['execution_time', 'success_rate', 'failure_rate', 'throughput', 'resource_usage', 'cost', 'frequency', 'trends'])).optional(),
  aggregation: z.enum(['hourly', 'daily', 'weekly', 'monthly']).optional(),
  options: z.object({
    include_breakdown: z.boolean().optional(),
    include_comparisons: z.boolean().optional(),
    include_predictions: z.boolean().optional(),
    export_format: z.enum(['json', 'csv', 'pdf']).optional()
  }).optional()
});

type GetPipelineAnalyticsInput = z.infer<typeof GetPipelineAnalyticsSchema>;

// Output validation schema
const GetPipelineAnalyticsOutputSchema = z.object({
  success: z.boolean(),
  analytics: z.object({
    pipeline_id: z.string(),
    repository: z.string(),
    analytics_type: z.enum(['performance', 'reliability', 'usage', 'cost', 'trends', 'all']),
    time_range: z.object({
      start_date: z.string(),
      end_date: z.string(),
      period: z.string()
    }),
    summary: z.object({
      total_executions: z.number(),
      successful_executions: z.number(),
      failed_executions: z.number(),
      cancelled_executions: z.number(),
      success_rate: z.number(),
      average_execution_time: z.number(),
      total_execution_time: z.number(),
      throughput_per_day: z.number(),
      resource_utilization: z.number(),
      estimated_cost: z.number().optional()
    }),
    performance_metrics: z.object({
      execution_times: z.object({
        average: z.number(),
        median: z.number(),
        p95: z.number(),
        p99: z.number(),
        min: z.number(),
        max: z.number()
      }),
      throughput: z.object({
        executions_per_hour: z.number(),
        executions_per_day: z.number(),
        peak_hour: z.string(),
        peak_day: z.string()
      }),
      resource_usage: z.object({
        cpu_utilization: z.number(),
        memory_utilization: z.number(),
        disk_utilization: z.number(),
        network_io: z.number()
      })
    }).optional(),
    reliability_metrics: z.object({
      success_rate: z.object({
        overall: z.number(),
        by_branch: z.record(z.number()),
        by_environment: z.record(z.number()),
        by_user: z.record(z.number())
      }),
      failure_analysis: z.object({
        common_failures: z.array(z.object({
          error_type: z.string(),
          count: z.number(),
          percentage: z.number(),
          trend: z.enum(['increasing', 'decreasing', 'stable'])
        })),
        failure_patterns: z.array(z.object({
          pattern: z.string(),
          frequency: z.number(),
          impact: z.enum(['low', 'medium', 'high', 'critical'])
        }))
      }),
      mttr: z.number(), // Mean Time To Recovery
      mtbf: z.number()  // Mean Time Between Failures
    }).optional(),
    usage_metrics: z.object({
      user_activity: z.array(z.object({
        user: z.string(),
        executions: z.number(),
        success_rate: z.number(),
        average_time: z.number()
      })),
      branch_activity: z.array(z.object({
        branch: z.string(),
        executions: z.number(),
        success_rate: z.number(),
        last_execution: z.string()
      })),
      environment_usage: z.array(z.object({
        environment: z.string(),
        executions: z.number(),
        success_rate: z.number(),
        resource_usage: z.number()
      }))
    }).optional(),
    cost_metrics: z.object({
      total_cost: z.number(),
      cost_breakdown: z.object({
        compute: z.number(),
        storage: z.number(),
        network: z.number(),
        other: z.number()
      }),
      cost_per_execution: z.number(),
      cost_trends: z.array(z.object({
        date: z.string(),
        cost: z.number()
      }))
    }).optional(),
    trends: z.object({
      execution_trends: z.array(z.object({
        date: z.string(),
        executions: z.number(),
        success_rate: z.number(),
        average_time: z.number()
      })),
      performance_trends: z.array(z.object({
        date: z.string(),
        execution_time: z.number(),
        resource_usage: z.number()
      })),
      predictions: z.object({
        next_week_executions: z.number(),
        next_week_success_rate: z.number(),
        next_week_avg_time: z.number(),
        confidence: z.number()
      }).optional()
    }).optional(),
    insights: z.array(z.object({
      type: z.enum(['performance', 'reliability', 'cost', 'usage']),
      title: z.string(),
      description: z.string(),
      severity: z.enum(['info', 'warning', 'critical']),
      recommendation: z.string().optional(),
      impact: z.enum(['low', 'medium', 'high'])
    })).optional(),
    export_url: z.string().optional()
  }).optional(),
  error: z.string().optional()
});

type GetPipelineAnalyticsOutput = z.infer<typeof GetPipelineAnalyticsOutputSchema>;

/**
 * Get Pipeline Analytics MCP Tool
 * 
 * Retrieves comprehensive pipeline performance metrics and analytics with
 * advanced data aggregation, insights, and predictive capabilities for Bitbucket repositories.
 * 
 * Features:
 * - Comprehensive performance analytics
 * - Reliability and failure analysis
 * - Usage and activity metrics
 * - Cost analysis and optimization
 * - Trend analysis and predictions
 * - Advanced data aggregation
 * - Actionable insights and recommendations
 * - Export capabilities (JSON, CSV, PDF)
 * - Input validation and sanitization
 * - Error handling and logging
 * 
 * @param input - Pipeline analytics retrieval parameters
 * @returns Pipeline analytics result with comprehensive metrics and insights
 */
export const getPipelineAnalyticsTool: Tool = {
  name: 'get_pipeline_analytics',
  description: 'Retrieve comprehensive pipeline performance metrics and analytics with advanced data aggregation, insights, and predictive capabilities',
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
      analytics_type: {
        type: 'string',
        enum: ['performance', 'reliability', 'usage', 'cost', 'trends', 'all'],
        description: 'Type of analytics to retrieve'
      },
      time_range: {
        type: 'object',
        description: 'Time range for analytics',
        properties: {
          start_date: {
            type: 'string',
            format: 'date-time',
            description: 'Start date for analytics (ISO 8601)'
          },
          end_date: {
            type: 'string',
            format: 'date-time',
            description: 'End date for analytics (ISO 8601)'
          },
          period: {
            type: 'string',
            enum: ['last_24h', 'last_7d', 'last_30d', 'last_90d', 'last_year', 'custom'],
            description: 'Predefined time period'
          }
        }
      },
      filters: {
        type: 'object',
        description: 'Optional filters for analytics data',
        properties: {
          branches: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Filter by branches'
          },
          environments: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Filter by environments'
          },
          users: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Filter by users'
          },
          status: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['success', 'failed', 'cancelled', 'running']
            },
            description: 'Filter by execution status'
          }
        }
      },
      metrics: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['execution_time', 'success_rate', 'failure_rate', 'throughput', 'resource_usage', 'cost', 'frequency', 'trends']
        },
        description: 'Specific metrics to include'
      },
      aggregation: {
        type: 'string',
        enum: ['hourly', 'daily', 'weekly', 'monthly'],
        description: 'Data aggregation level'
      },
      options: {
        type: 'object',
        description: 'Optional analytics options',
        properties: {
          include_breakdown: {
            type: 'boolean',
            description: 'Include detailed breakdowns'
          },
          include_comparisons: {
            type: 'boolean',
            description: 'Include period comparisons'
          },
          include_predictions: {
            type: 'boolean',
            description: 'Include predictive analytics'
          },
          export_format: {
            type: 'string',
            enum: ['json', 'csv', 'pdf'],
            description: 'Export format for analytics data'
          }
        }
      }
    },
    required: ['pipeline_id', 'repository', 'analytics_type']
  }
};

/**
 * Execute pipeline analytics retrieval
 * 
 * @param input - Pipeline analytics retrieval parameters
 * @returns Pipeline analytics result
 */
export async function executeGetPipelineAnalytics(input: GetPipelineAnalyticsInput): Promise<GetPipelineAnalyticsOutput> {
  try {
    // Validate input
    const validatedInput = GetPipelineAnalyticsSchema.parse(input);
    
    // Sanitize inputs
    const sanitizedInput = {
      pipeline_id: validatedInput.pipeline_id.trim(),
      repository: validatedInput.repository.trim(),
      analytics_type: validatedInput.analytics_type,
      time_range: validatedInput.time_range || { period: 'last_30d' },
      filters: validatedInput.filters ? {
        branches: validatedInput.filters.branches?.map(b => b.trim()),
        environments: validatedInput.filters.environments?.map(e => e.trim()),
        users: validatedInput.filters.users?.map(u => u.trim()),
        status: validatedInput.filters.status
      } : undefined,
      metrics: validatedInput.metrics || ['execution_time', 'success_rate', 'throughput'],
      aggregation: validatedInput.aggregation || 'daily',
      options: validatedInput.options || {
        include_breakdown: true,
        include_comparisons: false,
        include_predictions: false,
        export_format: 'json'
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

    // Validate time range
    if (sanitizedInput.time_range.start_date && sanitizedInput.time_range.end_date) {
      const startDate = new Date(sanitizedInput.time_range.start_date);
      const endDate = new Date(sanitizedInput.time_range.end_date);
      
      if (startDate >= endDate) {
        return {
          success: false,
          error: 'Start date must be before end date'
        };
      }
    }

    // Simulate pipeline analytics retrieval (replace with actual Bitbucket API call)
    const currentTime = new Date();
    const endDate = sanitizedInput.time_range.end_date ? 
      new Date(sanitizedInput.time_range.end_date) : currentTime;
    const startDate = sanitizedInput.time_range.start_date ? 
      new Date(sanitizedInput.time_range.start_date) : 
      new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    // Generate sample analytics data
    const summary = {
      total_executions: 156,
      successful_executions: 142,
      failed_executions: 12,
      cancelled_executions: 2,
      success_rate: 91.0,
      average_execution_time: 285,
      total_execution_time: 44460,
      throughput_per_day: 5.2,
      resource_utilization: 67.5,
      estimated_cost: 125.50
    };

    let performanceMetrics: any = undefined;
    if (sanitizedInput.analytics_type === 'performance' || sanitizedInput.analytics_type === 'all') {
      performanceMetrics = {
        execution_times: {
          average: 285,
          median: 270,
          p95: 450,
          p99: 600,
          min: 120,
          max: 720
        },
        throughput: {
          executions_per_hour: 0.22,
          executions_per_day: 5.2,
          peak_hour: '14:00',
          peak_day: 'Tuesday'
        },
        resource_usage: {
          cpu_utilization: 45.2,
          memory_utilization: 67.8,
          disk_utilization: 23.1,
          network_io: 12.5
        }
      };
    }

    let reliabilityMetrics: any = undefined;
    if (sanitizedInput.analytics_type === 'reliability' || sanitizedInput.analytics_type === 'all') {
      reliabilityMetrics = {
        success_rate: {
          overall: 91.0,
          by_branch: {
            'main': 95.2,
            'develop': 88.7,
            'feature/new-feature': 85.0
          },
          by_environment: {
            'production': 98.5,
            'staging': 92.3,
            'development': 87.1
          },
          by_user: {
            'admin@example.com': 96.8,
            'developer@example.com': 89.2,
            'tester@example.com': 87.5
          }
        },
        failure_analysis: {
          common_failures: [
            {
              error_type: 'Test Failure',
              count: 8,
              percentage: 66.7,
              trend: 'decreasing'
            },
            {
              error_type: 'Build Error',
              count: 3,
              percentage: 25.0,
              trend: 'stable'
            },
            {
              error_type: 'Timeout',
              count: 1,
              percentage: 8.3,
              trend: 'increasing'
            }
          ],
          failure_patterns: [
            {
              pattern: 'Test failures on feature branches',
              frequency: 0.15,
              impact: 'medium'
            },
            {
              pattern: 'Build errors during peak hours',
              frequency: 0.08,
              impact: 'low'
            }
          ]
        },
        mttr: 15.5, // minutes
        mtbf: 480.0 // minutes
      };
    }

    let usageMetrics: any = undefined;
    if (sanitizedInput.analytics_type === 'usage' || sanitizedInput.analytics_type === 'all') {
      usageMetrics = {
        user_activity: [
          {
            user: 'admin@example.com',
            executions: 45,
            success_rate: 96.8,
            average_time: 275
          },
          {
            user: 'developer@example.com',
            executions: 67,
            success_rate: 89.2,
            average_time: 295
          },
          {
            user: 'tester@example.com',
            executions: 44,
            success_rate: 87.5,
            average_time: 285
          }
        ],
        branch_activity: [
          {
            branch: 'main',
            executions: 78,
            success_rate: 95.2,
            last_execution: new Date(currentTime.getTime() - 3600000).toISOString()
          },
          {
            branch: 'develop',
            executions: 45,
            success_rate: 88.7,
            last_execution: new Date(currentTime.getTime() - 7200000).toISOString()
          },
          {
            branch: 'feature/new-feature',
            executions: 33,
            success_rate: 85.0,
            last_execution: new Date(currentTime.getTime() - 10800000).toISOString()
          }
        ],
        environment_usage: [
          {
            environment: 'production',
            executions: 52,
            success_rate: 98.5,
            resource_usage: 45.2
          },
          {
            environment: 'staging',
            executions: 67,
            success_rate: 92.3,
            resource_usage: 38.7
          },
          {
            environment: 'development',
            executions: 37,
            success_rate: 87.1,
            resource_usage: 25.3
          }
        ]
      };
    }

    let costMetrics: any = undefined;
    if (sanitizedInput.analytics_type === 'cost' || sanitizedInput.analytics_type === 'all') {
      costMetrics = {
        total_cost: 125.50,
        cost_breakdown: {
          compute: 85.30,
          storage: 25.20,
          network: 10.50,
          other: 4.50
        },
        cost_per_execution: 0.80,
        cost_trends: [
          {
            date: new Date(currentTime.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            cost: 28.50
          },
          {
            date: new Date(currentTime.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
            cost: 32.10
          },
          {
            date: new Date(currentTime.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            cost: 29.80
          },
          {
            date: new Date(currentTime.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            cost: 35.10
          }
        ]
      };
    }

    let trends: any = undefined;
    if (sanitizedInput.analytics_type === 'trends' || sanitizedInput.analytics_type === 'all') {
      trends = {
        execution_trends: [
          {
            date: new Date(currentTime.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            executions: 8,
            success_rate: 87.5,
            average_time: 295
          },
          {
            date: new Date(currentTime.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
            executions: 12,
            success_rate: 91.7,
            average_time: 285
          },
          {
            date: new Date(currentTime.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            executions: 6,
            success_rate: 83.3,
            average_time: 310
          }
        ],
        performance_trends: [
          {
            date: new Date(currentTime.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            execution_time: 295,
            resource_usage: 65.2
          },
          {
            date: new Date(currentTime.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
            execution_time: 285,
            resource_usage: 67.8
          },
          {
            date: new Date(currentTime.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            execution_time: 310,
            resource_usage: 69.1
          }
        ],
        predictions: sanitizedInput.options.include_predictions ? {
          next_week_executions: 42,
          next_week_success_rate: 92.5,
          next_week_avg_time: 290,
          confidence: 0.85
        } : undefined
      };
    }

    const insights = [
      {
        type: 'performance' as const,
        title: 'Execution Time Optimization Opportunity',
        description: 'Pipeline execution time has increased by 15% over the last week',
        severity: 'warning' as const,
        recommendation: 'Consider optimizing build steps and reducing unnecessary dependencies',
        impact: 'medium' as const
      },
      {
        type: 'reliability' as const,
        title: 'Test Failure Rate Decreasing',
        description: 'Test failure rate has decreased by 25% compared to last month',
        severity: 'info' as const,
        recommendation: 'Continue current testing practices and consider expanding test coverage',
        impact: 'high' as const
      },
      {
        type: 'cost' as const,
        title: 'Cost Optimization Available',
        description: 'Resource utilization is at 67.5% - consider right-sizing compute resources',
        severity: 'info' as const,
        recommendation: 'Review resource allocation and consider auto-scaling policies',
        impact: 'medium' as const
      }
    ];

    const analytics = {
      pipeline_id: sanitizedInput.pipeline_id,
      repository: sanitizedInput.repository,
      analytics_type: sanitizedInput.analytics_type,
      time_range: {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        period: sanitizedInput.time_range.period || 'custom'
      },
      summary: summary,
      performance_metrics: performanceMetrics,
      reliability_metrics: reliabilityMetrics,
      usage_metrics: usageMetrics,
      cost_metrics: costMetrics,
      trends: trends,
      insights: insights,
      export_url: sanitizedInput.options.export_format !== 'json' ? 
        `https://bitbucket.example.com/analytics/${sanitizedInput.pipeline_id}_${Date.now()}.${sanitizedInput.options.export_format}` : 
        undefined
    };

    // Log analytics retrieval
    console.log(`Pipeline analytics retrieved: ${sanitizedInput.pipeline_id} in repository: ${sanitizedInput.repository}`);

    return {
      success: true,
      analytics: analytics
    };

  } catch (error) {
    console.error('Error getting pipeline analytics:', error);
    
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

export default getPipelineAnalyticsTool;
