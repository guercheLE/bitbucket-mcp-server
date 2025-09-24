/**
 * Export Pipeline Data Tool
 * 
 * MCP tool for comprehensive data export and report generation from pipeline operations
 * with multiple formats, scheduling, and distribution capabilities.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Input validation schema
const ExportPipelineDataSchema = z.object({
  pipeline_id: z.string().min(1, 'Pipeline ID is required'),
  repository: z.string().min(1, 'Repository is required'),
  export_type: z.enum(['analytics', 'metrics', 'logs', 'artifacts', 'reports', 'audit', 'comprehensive'], {
    errorMap: () => ({ message: 'Export type must be analytics, metrics, logs, artifacts, reports, audit, or comprehensive' })
  }),
  data_sources: z.array(z.enum(['execution_logs', 'performance_metrics', 'error_logs', 'resource_usage', 'user_activity', 'build_artifacts', 'access_logs', 'audit_trails']), {
    errorMap: () => ({ message: 'Data sources must be valid pipeline data types' })
  }),
  export_format: z.enum(['json', 'csv', 'excel', 'pdf', 'html', 'xml', 'yaml', 'prometheus', 'influxdb'], {
    errorMap: () => ({ message: 'Export format must be a supported format' })
  }),
  time_range: z.object({
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    period: z.enum(['last_hour', 'last_24h', 'last_7d', 'last_30d', 'last_90d', 'last_year', 'custom']).optional()
  }).optional(),
  filters: z.object({
    branches: z.array(z.string()).optional(),
    environments: z.array(z.string()).optional(),
    users: z.array(z.string()).optional(),
    status: z.array(z.enum(['success', 'failed', 'cancelled', 'running'])).optional(),
    severity: z.array(z.enum(['low', 'medium', 'high', 'critical'])).optional()
  }).optional(),
  export_config: z.object({
    compression: z.enum(['none', 'gzip', 'zip', 'tar']).optional(),
    encryption: z.object({
      enabled: z.boolean().optional(),
      algorithm: z.enum(['AES-256', 'RSA-2048', 'RSA-4096']).optional(),
      key_id: z.string().optional()
    }).optional(),
    chunking: z.object({
      enabled: z.boolean().optional(),
      chunk_size: z.number().min(1).max(1000000).optional(), // records per chunk
      max_file_size: z.number().min(1024).max(1073741824).optional() // bytes
    }).optional(),
    formatting: z.object({
      include_headers: z.boolean().optional(),
      include_metadata: z.boolean().optional(),
      include_timestamps: z.boolean().optional(),
      date_format: z.string().optional(),
      number_format: z.string().optional(),
      locale: z.string().optional()
    }).optional()
  }).optional(),
  distribution: z.object({
    delivery_method: z.enum(['download', 'email', 'webhook', 's3', 'ftp', 'sftp']).optional(),
    recipients: z.array(z.string().email()).optional(),
    webhook_url: z.string().url().optional(),
    storage_config: z.object({
      bucket: z.string().optional(),
      path: z.string().optional(),
      region: z.string().optional(),
      credentials: z.object({
        access_key: z.string().optional(),
        secret_key: z.string().optional()
      }).optional()
    }).optional(),
    schedule: z.object({
      enabled: z.boolean().optional(),
      frequency: z.enum(['hourly', 'daily', 'weekly', 'monthly']).optional(),
      time: z.string().optional(),
      timezone: z.string().optional()
    }).optional()
  }).optional(),
  options: z.object({
    include_visualizations: z.boolean().optional(),
    include_raw_data: z.boolean().optional(),
    include_summary: z.boolean().optional(),
    include_recommendations: z.boolean().optional(),
    language: z.string().optional(),
    timezone: z.string().optional()
  }).optional()
});

type ExportPipelineDataInput = z.infer<typeof ExportPipelineDataSchema>;

// Output validation schema
const ExportPipelineDataOutputSchema = z.object({
  success: z.boolean(),
  export: z.object({
    export_id: z.string(),
    pipeline_id: z.string(),
    repository: z.string(),
    export_type: z.enum(['analytics', 'metrics', 'logs', 'artifacts', 'reports', 'audit', 'comprehensive']),
    data_sources: z.array(z.string()),
    export_format: z.enum(['json', 'csv', 'excel', 'pdf', 'html', 'xml', 'yaml', 'prometheus', 'influxdb']),
    time_range: z.object({
      start_date: z.string(),
      end_date: z.string(),
      period: z.string()
    }),
    export_config: z.object({
      compression: z.string(),
      encryption: z.object({
        enabled: z.boolean(),
        algorithm: z.string().optional(),
        key_id: z.string().optional()
      }).optional(),
      chunking: z.object({
        enabled: z.boolean(),
        chunk_size: z.number().optional(),
        max_file_size: z.number().optional()
      }).optional(),
      formatting: z.object({
        include_headers: z.boolean(),
        include_metadata: z.boolean(),
        include_timestamps: z.boolean(),
        date_format: z.string().optional(),
        number_format: z.string().optional(),
        locale: z.string().optional()
      }).optional()
    }),
    file_info: z.object({
      total_size: z.number(),
      record_count: z.number(),
      file_count: z.number(),
      compression_ratio: z.number().optional(),
      estimated_download_time: z.number().optional()
    }),
    download_urls: z.array(z.object({
      file_name: z.string(),
      file_size: z.number(),
      download_url: z.string(),
      expires_at: z.string().optional(),
      checksum: z.string().optional()
    })),
    distribution: z.object({
      delivery_method: z.enum(['download', 'email', 'webhook', 's3', 'ftp', 'sftp']),
      status: z.enum(['pending', 'processing', 'completed', 'failed']),
      recipients: z.array(z.string()).optional(),
      webhook_url: z.string().optional(),
      storage_config: z.object({
        bucket: z.string().optional(),
        path: z.string().optional(),
        region: z.string().optional()
      }).optional(),
      delivery_status: z.object({
        delivered: z.boolean(),
        delivery_time: z.string().optional(),
        error_message: z.string().optional()
      }).optional()
    }).optional(),
    metadata: z.object({
      generated_at: z.string(),
      generated_by: z.string(),
      export_duration: z.number(),
      data_quality: z.object({
        completeness: z.number(),
        accuracy: z.number(),
        consistency: z.number()
      }).optional()
    })
  }).optional(),
  error: z.string().optional()
});

type ExportPipelineDataOutput = z.infer<typeof ExportPipelineDataOutputSchema>;

/**
 * Export Pipeline Data MCP Tool
 * 
 * Provides comprehensive data export and report generation capabilities
 * for pipeline operations with multiple formats, scheduling, and distribution.
 * 
 * Features:
 * - Multiple export types (analytics, metrics, logs, artifacts, reports, audit)
 * - Multiple export formats (JSON, CSV, Excel, PDF, HTML, XML, YAML, Prometheus, InfluxDB)
 * - Data compression and encryption
 * - Chunking for large datasets
 * - Customizable formatting and localization
 * - Multiple delivery methods (download, email, webhook, cloud storage)
 * - Automated scheduling and distribution
 * - Data quality metrics and validation
 * - Input validation and sanitization
 * - Error handling and logging
 * 
 * @param input - Pipeline data export parameters
 * @returns Pipeline data export result with download links and delivery status
 */
export const exportPipelineDataTool: Tool = {
  name: 'export_pipeline_data',
  description: 'Export comprehensive pipeline data and reports with multiple formats, scheduling, and distribution capabilities',
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
      export_type: {
        type: 'string',
        enum: ['analytics', 'metrics', 'logs', 'artifacts', 'reports', 'audit', 'comprehensive'],
        description: 'Type of data to export'
      },
      data_sources: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['execution_logs', 'performance_metrics', 'error_logs', 'resource_usage', 'user_activity', 'build_artifacts', 'access_logs', 'audit_trails']
        },
        description: 'Data sources to include in export'
      },
      export_format: {
        type: 'string',
        enum: ['json', 'csv', 'excel', 'pdf', 'html', 'xml', 'yaml', 'prometheus', 'influxdb'],
        description: 'Export format'
      },
      time_range: {
        type: 'object',
        description: 'Time range for export',
        properties: {
          start_date: {
            type: 'string',
            format: 'date-time',
            description: 'Start date for export (ISO 8601)'
          },
          end_date: {
            type: 'string',
            format: 'date-time',
            description: 'End date for export (ISO 8601)'
          },
          period: {
            type: 'string',
            enum: ['last_hour', 'last_24h', 'last_7d', 'last_30d', 'last_90d', 'last_year', 'custom'],
            description: 'Predefined time period'
          }
        }
      },
      filters: {
        type: 'object',
        description: 'Optional filters for export data',
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
          },
          severity: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical']
            },
            description: 'Filter by severity level'
          }
        }
      },
      export_config: {
        type: 'object',
        description: 'Export configuration parameters',
        properties: {
          compression: {
            type: 'string',
            enum: ['none', 'gzip', 'zip', 'tar'],
            description: 'Compression method'
          },
          encryption: {
            type: 'object',
            description: 'Encryption configuration',
            properties: {
              enabled: {
                type: 'boolean',
                description: 'Whether encryption is enabled'
              },
              algorithm: {
                type: 'string',
                enum: ['AES-256', 'RSA-2048', 'RSA-4096'],
                description: 'Encryption algorithm'
              },
              key_id: {
                type: 'string',
                description: 'Encryption key identifier'
              }
            }
          },
          chunking: {
            type: 'object',
            description: 'Data chunking configuration',
            properties: {
              enabled: {
                type: 'boolean',
                description: 'Whether chunking is enabled'
              },
              chunk_size: {
                type: 'number',
                minimum: 1,
                maximum: 1000000,
                description: 'Records per chunk'
              },
              max_file_size: {
                type: 'number',
                minimum: 1024,
                maximum: 1073741824,
                description: 'Maximum file size in bytes'
              }
            }
          },
          formatting: {
            type: 'object',
            description: 'Data formatting configuration',
            properties: {
              include_headers: {
                type: 'boolean',
                description: 'Include column headers'
              },
              include_metadata: {
                type: 'boolean',
                description: 'Include metadata'
              },
              include_timestamps: {
                type: 'boolean',
                description: 'Include timestamps'
              },
              date_format: {
                type: 'string',
                description: 'Date format string'
              },
              number_format: {
                type: 'string',
                description: 'Number format string'
              },
              locale: {
                type: 'string',
                description: 'Locale for formatting'
              }
            }
          }
        }
      },
      distribution: {
        type: 'object',
        description: 'Distribution configuration',
        properties: {
          delivery_method: {
            type: 'string',
            enum: ['download', 'email', 'webhook', 's3', 'ftp', 'sftp'],
            description: 'Delivery method'
          },
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
            description: 'Webhook URL for delivery'
          },
          storage_config: {
            type: 'object',
            description: 'Cloud storage configuration',
            properties: {
              bucket: {
                type: 'string',
                description: 'Storage bucket name'
              },
              path: {
                type: 'string',
                description: 'Storage path'
              },
              region: {
                type: 'string',
                description: 'Storage region'
              },
              credentials: {
                type: 'object',
                description: 'Storage credentials',
                properties: {
                  access_key: {
                    type: 'string',
                    description: 'Access key'
                  },
                  secret_key: {
                    type: 'string',
                    description: 'Secret key'
                  }
                }
              }
            }
          },
          schedule: {
            type: 'object',
            description: 'Automated export scheduling',
            properties: {
              enabled: {
                type: 'boolean',
                description: 'Whether scheduling is enabled'
              },
              frequency: {
                type: 'string',
                enum: ['hourly', 'daily', 'weekly', 'monthly'],
                description: 'Export frequency'
              },
              time: {
                type: 'string',
                description: 'Export time (HH:MM format)'
              },
              timezone: {
                type: 'string',
                description: 'Timezone for scheduling'
              }
            }
          }
        }
      },
      options: {
        type: 'object',
        description: 'Optional export options',
        properties: {
          include_visualizations: {
            type: 'boolean',
            description: 'Include data visualizations'
          },
          include_raw_data: {
            type: 'boolean',
            description: 'Include raw data'
          },
          include_summary: {
            type: 'boolean',
            description: 'Include summary statistics'
          },
          include_recommendations: {
            type: 'boolean',
            description: 'Include recommendations'
          },
          language: {
            type: 'string',
            description: 'Export language (ISO 639-1 code)'
          },
          timezone: {
            type: 'string',
            description: 'Timezone for export'
          }
        }
      }
    },
    required: ['pipeline_id', 'repository', 'export_type', 'data_sources', 'export_format']
  }
};

/**
 * Execute pipeline data export
 * 
 * @param input - Pipeline data export parameters
 * @returns Pipeline data export result
 */
export async function executeExportPipelineData(input: ExportPipelineDataInput): Promise<ExportPipelineDataOutput> {
  try {
    // Validate input
    const validatedInput = ExportPipelineDataSchema.parse(input);
    
    // Sanitize inputs
    const sanitizedInput = {
      pipeline_id: validatedInput.pipeline_id.trim(),
      repository: validatedInput.repository.trim(),
      export_type: validatedInput.export_type,
      data_sources: validatedInput.data_sources,
      export_format: validatedInput.export_format,
      time_range: validatedInput.time_range || { period: 'last_30d' },
      filters: validatedInput.filters ? {
        branches: validatedInput.filters.branches?.map(b => b.trim()),
        environments: validatedInput.filters.environments?.map(e => e.trim()),
        users: validatedInput.filters.users?.map(u => u.trim()),
        status: validatedInput.filters.status,
        severity: validatedInput.filters.severity
      } : undefined,
      export_config: validatedInput.export_config || {
        compression: 'gzip',
        encryption: {
          enabled: false
        },
        chunking: {
          enabled: false
        },
        formatting: {
          include_headers: true,
          include_metadata: true,
          include_timestamps: true,
          date_format: 'ISO 8601',
          number_format: 'decimal',
          locale: 'en-US'
        }
      },
      distribution: validatedInput.distribution,
      options: validatedInput.options || {
        include_visualizations: false,
        include_raw_data: true,
        include_summary: true,
        include_recommendations: false,
        language: 'en',
        timezone: 'UTC'
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

    // Validate data sources
    if (!sanitizedInput.data_sources || sanitizedInput.data_sources.length === 0) {
      return {
        success: false,
        error: 'At least one data source must be specified'
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

    // Simulate data export (replace with actual export implementation)
    const startTime = Date.now();
    const currentTime = new Date();
    const endDate = sanitizedInput.time_range.end_date ? 
      new Date(sanitizedInput.time_range.end_date) : currentTime;
    const startDate = sanitizedInput.time_range.start_date ? 
      new Date(sanitizedInput.time_range.start_date) : 
      new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    const exportId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate file sizes based on export type and format
    let baseSize: number;
    switch (sanitizedInput.export_type) {
      case 'analytics':
        baseSize = 2048576; // 2MB
        break;
      case 'metrics':
        baseSize = 1024000; // 1MB
        break;
      case 'logs':
        baseSize = 5120000; // 5MB
        break;
      case 'artifacts':
        baseSize = 10485760; // 10MB
        break;
      case 'reports':
        baseSize = 3072000; // 3MB
        break;
      case 'audit':
        baseSize = 1536000; // 1.5MB
        break;
      case 'comprehensive':
        baseSize = 20971520; // 20MB
        break;
      default:
        baseSize = 1024000; // 1MB
    }

    // Adjust size based on format
    let formatMultiplier: number;
    switch (sanitizedInput.export_format) {
      case 'json':
        formatMultiplier = 1.0;
        break;
      case 'csv':
        formatMultiplier = 0.8;
        break;
      case 'excel':
        formatMultiplier = 1.2;
        break;
      case 'pdf':
        formatMultiplier = 1.5;
        break;
      case 'html':
        formatMultiplier = 1.3;
        break;
      case 'xml':
        formatMultiplier = 1.1;
        break;
      case 'yaml':
        formatMultiplier = 0.9;
        break;
      case 'prometheus':
        formatMultiplier = 0.7;
        break;
      case 'influxdb':
        formatMultiplier = 0.6;
        break;
      default:
        formatMultiplier = 1.0;
    }

    const totalSize = Math.floor(baseSize * formatMultiplier);
    const recordCount = Math.floor(totalSize / 1000); // Approximate record count
    const fileCount = sanitizedInput.export_config.chunking?.enabled ? 
      Math.ceil(recordCount / (sanitizedInput.export_config.chunking.chunk_size || 10000)) : 1;

    // Generate download URLs
    const downloadUrls = [];
    for (let i = 0; i < fileCount; i++) {
      const fileName = fileCount > 1 ? 
        `pipeline_${sanitizedInput.export_type}_${sanitizedInput.pipeline_id}_part_${i + 1}.${sanitizedInput.export_format}` :
        `pipeline_${sanitizedInput.export_type}_${sanitizedInput.pipeline_id}.${sanitizedInput.export_format}`;
      
      const fileSize = fileCount > 1 ? Math.floor(totalSize / fileCount) : totalSize;
      const downloadUrl = `https://bitbucket.example.com/exports/${exportId}/${fileName}`;
      const expiresAt = new Date(currentTime.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
      const checksum = `sha256:${Math.random().toString(36).substr(2, 64)}`;

      downloadUrls.push({
        file_name: fileName,
        file_size: fileSize,
        download_url: downloadUrl,
        expires_at: expiresAt,
        checksum: checksum
      });
    }

    // Calculate compression ratio
    const compressionRatio = sanitizedInput.export_config.compression !== 'none' ? 
      Math.random() * 0.5 + 0.3 : 1.0; // 30-80% compression

    // Estimate download time (assuming 10 Mbps)
    const estimatedDownloadTime = Math.ceil((totalSize * compressionRatio) / (10 * 1024 * 1024 / 8)); // seconds

    const exportResult = {
      export_id: exportId,
      pipeline_id: sanitizedInput.pipeline_id,
      repository: sanitizedInput.repository,
      export_type: sanitizedInput.export_type,
      data_sources: sanitizedInput.data_sources,
      export_format: sanitizedInput.export_format,
      time_range: {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        period: sanitizedInput.time_range.period || 'custom'
      },
      export_config: sanitizedInput.export_config,
      file_info: {
        total_size: totalSize,
        record_count: recordCount,
        file_count: fileCount,
        compression_ratio: compressionRatio,
        estimated_download_time: estimatedDownloadTime
      },
      download_urls: downloadUrls,
      distribution: sanitizedInput.distribution ? {
        delivery_method: sanitizedInput.distribution.delivery_method || 'download',
        status: 'completed' as const,
        recipients: sanitizedInput.distribution.recipients,
        webhook_url: sanitizedInput.distribution.webhook_url,
        storage_config: sanitizedInput.distribution.storage_config ? {
          bucket: sanitizedInput.distribution.storage_config.bucket,
          path: sanitizedInput.distribution.storage_config.path,
          region: sanitizedInput.distribution.storage_config.region
        } : undefined,
        delivery_status: {
          delivered: true,
          delivery_time: currentTime.toISOString(),
          error_message: undefined
        }
      } : undefined,
      metadata: {
        generated_at: currentTime.toISOString(),
        generated_by: 'current_user',
        export_duration: Date.now() - startTime,
        data_quality: {
          completeness: 0.95,
          accuracy: 0.98,
          consistency: 0.92
        }
      }
    };

    // Log export completion
    console.log(`Pipeline data export completed: ${exportId} for pipeline: ${sanitizedInput.pipeline_id}`);

    return {
      success: true,
      export: exportResult
    };

  } catch (error) {
    console.error('Error exporting pipeline data:', error);
    
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

export default exportPipelineDataTool;
