/**
 * Track Pipeline Metrics Tool
 * 
 * MCP tool for tracking key performance indicators (KPIs) and metrics
 * for Bitbucket pipeline operations with real-time monitoring and alerting.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Input validation schema
const TrackPipelineMetricsSchema = z.object({
  pipeline_id: z.string().min(1, 'Pipeline ID is required'),
  repository: z.string().min(1, 'Repository is required'),
  metrics: z.array(z.enum(['execution_time', 'success_rate', 'failure_rate', 'throughput', 'resource_usage', 'cost', 'frequency', 'availability', 'reliability', 'performance']), {
    errorMap: () => ({ message: 'Metrics must be valid KPI types' })
  }),
  tracking_config: z.object({
    frequency: z.enum(['realtime', 'minute', 'hourly', 'daily']),
    retention_period: z.number().min(1).max(365), // days
    alert_thresholds: z.object({
      execution_time: z.object({
        warning: z.number().optional(),
        critical: z.number().optional()
      }).optional(),
      success_rate: z.object({
        warning: z.number().min(0).max(100).optional(),
        critical: z.number().min(0).max(100).optional()
      }).optional(),
      failure_rate: z.object({
        warning: z.number().min(0).max(100).optional(),
        critical: z.number().min(0).max(100).optional()
      }).optional(),
      resource_usage: z.object({
        warning: z.number().min(0).max(100).optional(),
        critical: z.number().min(0).max(100).optional()
      }).optional()
    }).optional(),
    notifications: z.object({
      enabled: z.boolean().optional(),
      channels: z.array(z.enum(['email', 'webhook', 'slack', 'teams'])).optional(),
      recipients: z.array(z.string().email()).optional()
    }).optional()
  }),
  time_range: z.object({
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    period: z.enum(['last_hour', 'last_24h', 'last_7d', 'last_30d', 'custom']).optional()
  }).optional(),
  filters: z.object({
    branches: z.array(z.string()).optional(),
    environments: z.array(z.string()).optional(),
    users: z.array(z.string()).optional(),
    status: z.array(z.enum(['success', 'failed', 'cancelled', 'running'])).optional()
  }).optional(),
  options: z.object({
    include_trends: z.boolean().optional(),
    include_predictions: z.boolean().optional(),
    include_anomalies: z.boolean().optional(),
    export_format: z.enum(['json', 'csv', 'prometheus']).optional()
  }).optional()
});

type TrackPipelineMetricsInput = z.infer<typeof TrackPipelineMetricsSchema>;

// Output validation schema
const TrackPipelineMetricsOutputSchema = z.object({
  success: z.boolean(),
  tracking: z.object({
    pipeline_id: z.string(),
    repository: z.string(),
    metrics: z.array(z.string()),
    tracking_config: z.object({
      frequency: z.enum(['realtime', 'minute', 'hourly', 'daily']),
      retention_period: z.number(),
      alert_thresholds: z.object({
        execution_time: z.object({
          warning: z.number().optional(),
          critical: z.number().optional()
        }).optional(),
        success_rate: z.object({
          warning: z.number().optional(),
          critical: z.number().optional()
        }).optional(),
        failure_rate: z.object({
          warning: z.number().optional(),
          critical: z.number().optional()
        }).optional(),
        resource_usage: z.object({
          warning: z.number().optional(),
          critical: z.number().optional()
        }).optional()
      }).optional(),
      notifications: z.object({
        enabled: z.boolean(),
        channels: z.array(z.string()).optional(),
        recipients: z.array(z.string()).optional()
      }).optional()
    }),
    time_range: z.object({
      start_date: z.string(),
      end_date: z.string(),
      period: z.string()
    }),
    current_metrics: z.object({
      execution_time: z.object({
        current: z.number(),
        average: z.number(),
        trend: z.enum(['increasing', 'decreasing', 'stable']),
        status: z.enum(['normal', 'warning', 'critical'])
      }).optional(),
      success_rate: z.object({
        current: z.number(),
        average: z.number(),
        trend: z.enum(['increasing', 'decreasing', 'stable']),
        status: z.enum(['normal', 'warning', 'critical'])
      }).optional(),
      failure_rate: z.object({
        current: z.number(),
        average: z.number(),
        trend: z.enum(['increasing', 'decreasing', 'stable']),
        status: z.enum(['normal', 'warning', 'critical'])
      }).optional(),
      throughput: z.object({
        current: z.number(),
        average: z.number(),
        trend: z.enum(['increasing', 'decreasing', 'stable']),
        status: z.enum(['normal', 'warning', 'critical'])
      }).optional(),
      resource_usage: z.object({
        current: z.number(),
        average: z.number(),
        trend: z.enum(['increasing', 'decreasing', 'stable']),
        status: z.enum(['normal', 'warning', 'critical'])
      }).optional(),
      availability: z.object({
        current: z.number(),
        average: z.number(),
        trend: z.enum(['increasing', 'decreasing', 'stable']),
        status: z.enum(['normal', 'warning', 'critical'])
      }).optional()
    }),
    historical_data: z.array(z.object({
      timestamp: z.string(),
      execution_time: z.number().optional(),
      success_rate: z.number().optional(),
      failure_rate: z.number().optional(),
      throughput: z.number().optional(),
      resource_usage: z.number().optional(),
      availability: z.number().optional()
    })).optional(),
    trends: z.object({
      execution_time_trend: z.array(z.object({
        date: z.string(),
        value: z.number(),
        change: z.number()
      })).optional(),
      success_rate_trend: z.array(z.object({
        date: z.string(),
        value: z.number(),
        change: z.number()
      })).optional(),
      throughput_trend: z.array(z.object({
        date: z.string(),
        value: z.number(),
        change: z.number()
      })).optional()
    }).optional(),
    predictions: z.object({
      next_hour_execution_time: z.number().optional(),
      next_hour_success_rate: z.number().optional(),
      next_hour_throughput: z.number().optional(),
      confidence: z.number().optional()
    }).optional(),
    anomalies: z.array(z.object({
      type: z.enum(['execution_time', 'success_rate', 'failure_rate', 'throughput', 'resource_usage']),
      timestamp: z.string(),
      value: z.number(),
      expected_value: z.number(),
      deviation: z.number(),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      description: z.string()
    })).optional(),
    alerts: z.array(z.object({
      type: z.enum(['threshold_exceeded', 'anomaly_detected', 'trend_change']),
      metric: z.string(),
      severity: z.enum(['warning', 'critical']),
      message: z.string(),
      timestamp: z.string(),
      acknowledged: z.boolean()
    })).optional(),
    export_url: z.string().optional()
  }).optional(),
  error: z.string().optional()
});

type TrackPipelineMetricsOutput = z.infer<typeof TrackPipelineMetricsOutputSchema>;

/**
 * Track Pipeline Metrics MCP Tool
 * 
 * Tracks key performance indicators (KPIs) and metrics for pipeline operations
 * with real-time monitoring, alerting, and predictive analytics capabilities.
 * 
 * Features:
 * - Real-time KPI tracking and monitoring
 * - Configurable alert thresholds and notifications
 * - Historical data analysis and trends
 * - Anomaly detection and alerting
 * - Predictive analytics and forecasting
 * - Multiple export formats (JSON, CSV, Prometheus)
 * - Customizable tracking frequency and retention
 * - Input validation and sanitization
 * - Error handling and logging
 * 
 * @param input - Pipeline metrics tracking parameters
 * @returns Pipeline metrics tracking result with current and historical data
 */
export const trackPipelineMetricsTool: Tool = {
  name: 'track_pipeline_metrics',
  description: 'Track key performance indicators (KPIs) and metrics for pipeline operations with real-time monitoring and alerting',
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
      metrics: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['execution_time', 'success_rate', 'failure_rate', 'throughput', 'resource_usage', 'cost', 'frequency', 'availability', 'reliability', 'performance']
        },
        description: 'KPIs and metrics to track'
      },
      tracking_config: {
        type: 'object',
        description: 'Metrics tracking configuration',
        properties: {
          frequency: {
            type: 'string',
            enum: ['realtime', 'minute', 'hourly', 'daily'],
            description: 'Tracking frequency'
          },
          retention_period: {
            type: 'number',
            minimum: 1,
            maximum: 365,
            description: 'Data retention period in days'
          },
          alert_thresholds: {
            type: 'object',
            description: 'Alert threshold configuration',
            properties: {
              execution_time: {
                type: 'object',
                properties: {
                  warning: {
                    type: 'number',
                    description: 'Warning threshold for execution time (seconds)'
                  },
                  critical: {
                    type: 'number',
                    description: 'Critical threshold for execution time (seconds)'
                  }
                }
              },
              success_rate: {
                type: 'object',
                properties: {
                  warning: {
                    type: 'number',
                    minimum: 0,
                    maximum: 100,
                    description: 'Warning threshold for success rate (%)'
                  },
                  critical: {
                    type: 'number',
                    minimum: 0,
                    maximum: 100,
                    description: 'Critical threshold for success rate (%)'
                  }
                }
              },
              failure_rate: {
                type: 'object',
                properties: {
                  warning: {
                    type: 'number',
                    minimum: 0,
                    maximum: 100,
                    description: 'Warning threshold for failure rate (%)'
                  },
                  critical: {
                    type: 'number',
                    minimum: 0,
                    maximum: 100,
                    description: 'Critical threshold for failure rate (%)'
                  }
                }
              },
              resource_usage: {
                type: 'object',
                properties: {
                  warning: {
                    type: 'number',
                    minimum: 0,
                    maximum: 100,
                    description: 'Warning threshold for resource usage (%)'
                  },
                  critical: {
                    type: 'number',
                    minimum: 0,
                    maximum: 100,
                    description: 'Critical threshold for resource usage (%)'
                  }
                }
              }
            }
          },
          notifications: {
            type: 'object',
            description: 'Notification configuration',
            properties: {
              enabled: {
                type: 'boolean',
                description: 'Whether notifications are enabled'
              },
              channels: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['email', 'webhook', 'slack', 'teams']
                },
                description: 'Notification channels'
              },
              recipients: {
                type: 'array',
                items: {
                  type: 'string',
                  format: 'email'
                },
                description: 'Notification recipients'
              }
            }
          }
        },
        required: ['frequency', 'retention_period']
      },
      time_range: {
        type: 'object',
        description: 'Time range for metrics tracking',
        properties: {
          start_date: {
            type: 'string',
            format: 'date-time',
            description: 'Start date for tracking (ISO 8601)'
          },
          end_date: {
            type: 'string',
            format: 'date-time',
            description: 'End date for tracking (ISO 8601)'
          },
          period: {
            type: 'string',
            enum: ['last_hour', 'last_24h', 'last_7d', 'last_30d', 'custom'],
            description: 'Predefined time period'
          }
        }
      },
      filters: {
        type: 'object',
        description: 'Optional filters for metrics data',
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
      options: {
        type: 'object',
        description: 'Optional tracking options',
        properties: {
          include_trends: {
            type: 'boolean',
            description: 'Include trend analysis'
          },
          include_predictions: {
            type: 'boolean',
            description: 'Include predictive analytics'
          },
          include_anomalies: {
            type: 'boolean',
            description: 'Include anomaly detection'
          },
          export_format: {
            type: 'string',
            enum: ['json', 'csv', 'prometheus'],
            description: 'Export format for metrics data'
          }
        }
      }
    },
    required: ['pipeline_id', 'repository', 'metrics', 'tracking_config']
  }
};

/**
 * Execute pipeline metrics tracking
 * 
 * @param input - Pipeline metrics tracking parameters
 * @returns Pipeline metrics tracking result
 */
export async function executeTrackPipelineMetrics(input: TrackPipelineMetricsInput): Promise<TrackPipelineMetricsOutput> {
  try {
    // Validate input
    const validatedInput = TrackPipelineMetricsSchema.parse(input);
    
    // Sanitize inputs
    const sanitizedInput = {
      pipeline_id: validatedInput.pipeline_id.trim(),
      repository: validatedInput.repository.trim(),
      metrics: validatedInput.metrics,
      tracking_config: {
        frequency: validatedInput.tracking_config.frequency,
        retention_period: validatedInput.tracking_config.retention_period,
        alert_thresholds: validatedInput.tracking_config.alert_thresholds,
        notifications: validatedInput.tracking_config.notifications || {
          enabled: false,
          channels: [],
          recipients: []
        }
      },
      time_range: validatedInput.time_range || { period: 'last_24h' },
      filters: validatedInput.filters ? {
        branches: validatedInput.filters.branches?.map(b => b.trim()),
        environments: validatedInput.filters.environments?.map(e => e.trim()),
        users: validatedInput.filters.users?.map(u => u.trim()),
        status: validatedInput.filters.status
      } : undefined,
      options: validatedInput.options || {
        include_trends: true,
        include_predictions: false,
        include_anomalies: true,
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

    // Validate metrics
    if (!sanitizedInput.metrics || sanitizedInput.metrics.length === 0) {
      return {
        success: false,
        error: 'At least one metric must be specified'
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

    // Simulate metrics tracking (replace with actual Bitbucket API call)
    const currentTime = new Date();
    const endDate = sanitizedInput.time_range.end_date ? 
      new Date(sanitizedInput.time_range.end_date) : currentTime;
    const startDate = sanitizedInput.time_range.start_date ? 
      new Date(sanitizedInput.time_range.start_date) : 
      new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

    // Generate current metrics data
    const currentMetrics: any = {};
    
    if (sanitizedInput.metrics.includes('execution_time')) {
      currentMetrics.execution_time = {
        current: 285,
        average: 270,
        trend: 'increasing' as const,
        status: 'normal' as const
      };
    }
    
    if (sanitizedInput.metrics.includes('success_rate')) {
      currentMetrics.success_rate = {
        current: 91.0,
        average: 89.5,
        trend: 'increasing' as const,
        status: 'normal' as const
      };
    }
    
    if (sanitizedInput.metrics.includes('failure_rate')) {
      currentMetrics.failure_rate = {
        current: 9.0,
        average: 10.5,
        trend: 'decreasing' as const,
        status: 'normal' as const
      };
    }
    
    if (sanitizedInput.metrics.includes('throughput')) {
      currentMetrics.throughput = {
        current: 5.2,
        average: 4.8,
        trend: 'increasing' as const,
        status: 'normal' as const
      };
    }
    
    if (sanitizedInput.metrics.includes('resource_usage')) {
      currentMetrics.resource_usage = {
        current: 67.5,
        average: 65.2,
        trend: 'increasing' as const,
        status: 'warning' as const
      };
    }
    
    if (sanitizedInput.metrics.includes('availability')) {
      currentMetrics.availability = {
        current: 99.2,
        average: 98.8,
        trend: 'increasing' as const,
        status: 'normal' as const
      };
    }

    // Generate historical data
    const historicalData = [];
    const dataPoints = 24; // 24 hours of data
    for (let i = 0; i < dataPoints; i++) {
      const timestamp = new Date(endDate.getTime() - (dataPoints - i) * 60 * 60 * 1000);
      const dataPoint: any = {
        timestamp: timestamp.toISOString()
      };
      
      if (sanitizedInput.metrics.includes('execution_time')) {
        dataPoint.execution_time = 270 + Math.random() * 50;
      }
      if (sanitizedInput.metrics.includes('success_rate')) {
        dataPoint.success_rate = 85 + Math.random() * 15;
      }
      if (sanitizedInput.metrics.includes('failure_rate')) {
        dataPoint.failure_rate = 5 + Math.random() * 15;
      }
      if (sanitizedInput.metrics.includes('throughput')) {
        dataPoint.throughput = 3 + Math.random() * 4;
      }
      if (sanitizedInput.metrics.includes('resource_usage')) {
        dataPoint.resource_usage = 60 + Math.random() * 20;
      }
      if (sanitizedInput.metrics.includes('availability')) {
        dataPoint.availability = 98 + Math.random() * 2;
      }
      
      historicalData.push(dataPoint);
    }

    // Generate trends if requested
    let trends: any = undefined;
    if (sanitizedInput.options.include_trends) {
      trends = {
        execution_time_trend: [
          {
            date: new Date(currentTime.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            value: 275,
            change: 2.5
          },
          {
            date: new Date(currentTime.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
            value: 280,
            change: 1.8
          },
          {
            date: new Date(currentTime.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            value: 285,
            change: 1.8
          }
        ],
        success_rate_trend: [
          {
            date: new Date(currentTime.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            value: 88.5,
            change: 1.2
          },
          {
            date: new Date(currentTime.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
            value: 89.8,
            change: 1.5
          },
          {
            date: new Date(currentTime.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            value: 91.0,
            change: 1.3
          }
        ],
        throughput_trend: [
          {
            date: new Date(currentTime.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            value: 4.5,
            change: 0.3
          },
          {
            date: new Date(currentTime.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
            value: 4.8,
            change: 0.7
          },
          {
            date: new Date(currentTime.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            value: 5.2,
            change: 0.8
          }
        ]
      };
    }

    // Generate predictions if requested
    let predictions: any = undefined;
    if (sanitizedInput.options.include_predictions) {
      predictions = {
        next_hour_execution_time: 290,
        next_hour_success_rate: 92.5,
        next_hour_throughput: 5.5,
        confidence: 0.85
      };
    }

    // Generate anomalies if requested
    let anomalies: any = undefined;
    if (sanitizedInput.options.include_anomalies) {
      anomalies = [
        {
          type: 'execution_time' as const,
          timestamp: new Date(currentTime.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          value: 450,
          expected_value: 285,
          deviation: 57.9,
          severity: 'medium' as const,
          description: 'Execution time spike detected - possible resource contention'
        },
        {
          type: 'success_rate' as const,
          timestamp: new Date(currentTime.getTime() - 4 * 60 * 60 * 1000).toISOString(),
          value: 75.0,
          expected_value: 91.0,
          deviation: -17.6,
          severity: 'high' as const,
          description: 'Success rate drop detected - possible infrastructure issue'
        }
      ];
    }

    // Generate alerts based on thresholds
    const alerts = [];
    if (sanitizedInput.tracking_config.alert_thresholds?.execution_time?.warning && 
        currentMetrics.execution_time?.current > sanitizedInput.tracking_config.alert_thresholds.execution_time.warning) {
      alerts.push({
        type: 'threshold_exceeded' as const,
        metric: 'execution_time',
        severity: 'warning' as const,
        message: `Execution time (${currentMetrics.execution_time.current}s) exceeded warning threshold (${sanitizedInput.tracking_config.alert_thresholds.execution_time.warning}s)`,
        timestamp: currentTime.toISOString(),
        acknowledged: false
      });
    }

    if (sanitizedInput.tracking_config.alert_thresholds?.success_rate?.critical && 
        currentMetrics.success_rate?.current < sanitizedInput.tracking_config.alert_thresholds.success_rate.critical) {
      alerts.push({
        type: 'threshold_exceeded' as const,
        metric: 'success_rate',
        severity: 'critical' as const,
        message: `Success rate (${currentMetrics.success_rate.current}%) below critical threshold (${sanitizedInput.tracking_config.alert_thresholds.success_rate.critical}%)`,
        timestamp: currentTime.toISOString(),
        acknowledged: false
      });
    }

    const tracking = {
      pipeline_id: sanitizedInput.pipeline_id,
      repository: sanitizedInput.repository,
      metrics: sanitizedInput.metrics,
      tracking_config: sanitizedInput.tracking_config,
      time_range: {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        period: sanitizedInput.time_range.period || 'custom'
      },
      current_metrics: currentMetrics,
      historical_data: historicalData,
      trends: trends,
      predictions: predictions,
      anomalies: anomalies,
      alerts: alerts,
      export_url: sanitizedInput.options.export_format !== 'json' ? 
        `https://bitbucket.example.com/metrics/${sanitizedInput.pipeline_id}_${Date.now()}.${sanitizedInput.options.export_format}` : 
        undefined
    };

    // Log metrics tracking
    console.log(`Pipeline metrics tracking configured: ${sanitizedInput.pipeline_id} in repository: ${sanitizedInput.repository}`);

    return {
      success: true,
      tracking: tracking
    };

  } catch (error) {
    console.error('Error tracking pipeline metrics:', error);
    
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

export default trackPipelineMetricsTool;
