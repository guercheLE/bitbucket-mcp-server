/**
 * Generate Pipeline Reports Tool
 * 
 * MCP tool for generating comprehensive pipeline reports from Bitbucket repositories
 * with customizable templates, scheduling, and distribution capabilities.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Input validation schema
const GeneratePipelineReportsSchema = z.object({
  pipeline_id: z.string().min(1, 'Pipeline ID is required'),
  repository: z.string().min(1, 'Repository is required'),
  report_type: z.enum(['executive', 'technical', 'compliance', 'performance', 'custom'], {
    errorMap: () => ({ message: 'Report type must be executive, technical, compliance, performance, or custom' })
  }),
  template: z.object({
    name: z.string().min(1, 'Template name is required'),
    sections: z.array(z.enum(['summary', 'performance', 'reliability', 'usage', 'cost', 'trends', 'recommendations', 'appendix'])),
    format: z.enum(['pdf', 'html', 'excel', 'powerpoint']),
    branding: z.object({
      company_logo: z.string().optional(),
      company_name: z.string().optional(),
      color_scheme: z.string().optional(),
      custom_css: z.string().optional()
    }).optional()
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
  distribution: z.object({
    recipients: z.array(z.string().email()).optional(),
    delivery_method: z.enum(['email', 'webhook', 'download']).optional(),
    schedule: z.object({
      enabled: z.boolean().optional(),
      frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly']).optional(),
      day_of_week: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).optional(),
      day_of_month: z.number().min(1).max(31).optional(),
      time: z.string().optional()
    }).optional()
  }).optional(),
  options: z.object({
    include_charts: z.boolean().optional(),
    include_raw_data: z.boolean().optional(),
    include_recommendations: z.boolean().optional(),
    language: z.string().optional(),
    timezone: z.string().optional()
  }).optional()
});

type GeneratePipelineReportsInput = z.infer<typeof GeneratePipelineReportsSchema>;

// Output validation schema
const GeneratePipelineReportsOutputSchema = z.object({
  success: z.boolean(),
  report: z.object({
    id: z.string(),
    pipeline_id: z.string(),
    repository: z.string(),
    report_type: z.enum(['executive', 'technical', 'compliance', 'performance', 'custom']),
    template: z.object({
      name: z.string(),
      sections: z.array(z.string()),
      format: z.enum(['pdf', 'html', 'excel', 'powerpoint']),
      branding: z.object({
        company_logo: z.string().optional(),
        company_name: z.string().optional(),
        color_scheme: z.string().optional(),
        custom_css: z.string().optional()
      }).optional()
    }),
    time_range: z.object({
      start_date: z.string(),
      end_date: z.string(),
      period: z.string()
    }),
    generated_at: z.string(),
    generated_by: z.string(),
    file_size: z.number(),
    download_url: z.string(),
    distribution: z.object({
      recipients: z.array(z.string()).optional(),
      delivery_method: z.enum(['email', 'webhook', 'download']).optional(),
      schedule: z.object({
        enabled: z.boolean(),
        frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly']).optional(),
        day_of_week: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).optional(),
        day_of_month: z.number().optional(),
        time: z.string().optional()
      }).optional()
    }).optional(),
    metadata: z.object({
      total_pages: z.number().optional(),
      chart_count: z.number().optional(),
      data_points: z.number().optional(),
      generation_time: z.number()
    })
  }).optional(),
  error: z.string().optional()
});

type GeneratePipelineReportsOutput = z.infer<typeof GeneratePipelineReportsOutputSchema>;

/**
 * Generate Pipeline Reports MCP Tool
 * 
 * Generates comprehensive pipeline reports with customizable templates,
 * scheduling, and distribution capabilities for Bitbucket repositories.
 * 
 * Features:
 * - Multiple report types (executive, technical, compliance, performance, custom)
 * - Customizable templates and branding
 * - Multiple output formats (PDF, HTML, Excel, PowerPoint)
 * - Automated scheduling and distribution
 * - Advanced filtering and data aggregation
 * - Chart and visualization generation
 * - Multi-language support
 * - Input validation and sanitization
 * - Error handling and logging
 * 
 * @param input - Pipeline report generation parameters
 * @returns Pipeline report generation result
 */
export const generatePipelineReportsTool: Tool = {
  name: 'generate_pipeline_reports',
  description: 'Generate comprehensive pipeline reports with customizable templates, scheduling, and distribution capabilities',
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
      report_type: {
        type: 'string',
        enum: ['executive', 'technical', 'compliance', 'performance', 'custom'],
        description: 'Type of report to generate'
      },
      template: {
        type: 'object',
        description: 'Report template configuration',
        properties: {
          name: {
            type: 'string',
            description: 'Template name'
          },
          sections: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['summary', 'performance', 'reliability', 'usage', 'cost', 'trends', 'recommendations', 'appendix']
            },
            description: 'Report sections to include'
          },
          format: {
            type: 'string',
            enum: ['pdf', 'html', 'excel', 'powerpoint'],
            description: 'Report output format'
          },
          branding: {
            type: 'object',
            description: 'Report branding configuration',
            properties: {
              company_logo: {
                type: 'string',
                description: 'Company logo URL or path'
              },
              company_name: {
                type: 'string',
                description: 'Company name'
              },
              color_scheme: {
                type: 'string',
                description: 'Color scheme for the report'
              },
              custom_css: {
                type: 'string',
                description: 'Custom CSS for styling'
              }
            }
          }
        },
        required: ['name', 'sections', 'format']
      },
      time_range: {
        type: 'object',
        description: 'Time range for the report',
        properties: {
          start_date: {
            type: 'string',
            format: 'date-time',
            description: 'Start date for the report (ISO 8601)'
          },
          end_date: {
            type: 'string',
            format: 'date-time',
            description: 'End date for the report (ISO 8601)'
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
        description: 'Optional filters for report data',
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
      distribution: {
        type: 'object',
        description: 'Report distribution configuration',
        properties: {
          recipients: {
            type: 'array',
            items: {
              type: 'string',
              format: 'email'
            },
            description: 'Email recipients for the report'
          },
          delivery_method: {
            type: 'string',
            enum: ['email', 'webhook', 'download'],
            description: 'Report delivery method'
          },
          schedule: {
            type: 'object',
            description: 'Automated report scheduling',
            properties: {
              enabled: {
                type: 'boolean',
                description: 'Whether scheduling is enabled'
              },
              frequency: {
                type: 'string',
                enum: ['daily', 'weekly', 'monthly', 'quarterly'],
                description: 'Report generation frequency'
              },
              day_of_week: {
                type: 'string',
                enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
                description: 'Day of week for weekly reports'
              },
              day_of_month: {
                type: 'number',
                minimum: 1,
                maximum: 31,
                description: 'Day of month for monthly reports'
              },
              time: {
                type: 'string',
                description: 'Time to generate report (HH:MM format)'
              }
            }
          }
        }
      },
      options: {
        type: 'object',
        description: 'Optional report generation options',
        properties: {
          include_charts: {
            type: 'boolean',
            description: 'Include charts and visualizations'
          },
          include_raw_data: {
            type: 'boolean',
            description: 'Include raw data in the report'
          },
          include_recommendations: {
            type: 'boolean',
            description: 'Include actionable recommendations'
          },
          language: {
            type: 'string',
            description: 'Report language (ISO 639-1 code)'
          },
          timezone: {
            type: 'string',
            description: 'Timezone for the report'
          }
        }
      }
    },
    required: ['pipeline_id', 'repository', 'report_type', 'template']
  }
};

/**
 * Execute pipeline report generation
 * 
 * @param input - Pipeline report generation parameters
 * @returns Pipeline report generation result
 */
export async function executeGeneratePipelineReports(input: GeneratePipelineReportsInput): Promise<GeneratePipelineReportsOutput> {
  try {
    // Validate input
    const validatedInput = GeneratePipelineReportsSchema.parse(input);
    
    // Sanitize inputs
    const sanitizedInput = {
      pipeline_id: validatedInput.pipeline_id.trim(),
      repository: validatedInput.repository.trim(),
      report_type: validatedInput.report_type,
      template: {
        name: validatedInput.template.name.trim(),
        sections: validatedInput.template.sections,
        format: validatedInput.template.format,
        branding: validatedInput.template.branding ? {
          company_logo: validatedInput.template.branding.company_logo?.trim(),
          company_name: validatedInput.template.branding.company_name?.trim(),
          color_scheme: validatedInput.template.branding.color_scheme?.trim(),
          custom_css: validatedInput.template.branding.custom_css
        } : undefined
      },
      time_range: validatedInput.time_range || { period: 'last_30d' },
      filters: validatedInput.filters ? {
        branches: validatedInput.filters.branches?.map(b => b.trim()),
        environments: validatedInput.filters.environments?.map(e => e.trim()),
        users: validatedInput.filters.users?.map(u => u.trim()),
        status: validatedInput.filters.status
      } : undefined,
      distribution: validatedInput.distribution,
      options: validatedInput.options || {
        include_charts: true,
        include_raw_data: false,
        include_recommendations: true,
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

    // Validate template
    if (!sanitizedInput.template.name) {
      return {
        success: false,
        error: 'Template name is required'
      };
    }

    if (!sanitizedInput.template.sections || sanitizedInput.template.sections.length === 0) {
      return {
        success: false,
        error: 'At least one template section is required'
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

    // Validate distribution
    if (sanitizedInput.distribution?.recipients) {
      for (const email of sanitizedInput.distribution.recipients) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return {
            success: false,
            error: `Invalid email address: ${email}`
          };
        }
      }
    }

    // Simulate report generation (replace with actual Bitbucket API call)
    const currentTime = new Date();
    const endDate = sanitizedInput.time_range.end_date ? 
      new Date(sanitizedInput.time_range.end_date) : currentTime;
    const startDate = sanitizedInput.time_range.start_date ? 
      new Date(sanitizedInput.time_range.start_date) : 
      new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fileName = `pipeline_report_${sanitizedInput.pipeline_id}_${Date.now()}.${sanitizedInput.template.format}`;
    const downloadUrl = `https://bitbucket.example.com/reports/${reportId}/${fileName}`;

    // Simulate report generation time
    const generationTime = Math.floor(Math.random() * 5000) + 2000; // 2-7 seconds

    // Calculate report metadata
    const metadata = {
      total_pages: sanitizedInput.template.format === 'pdf' ? 15 : undefined,
      chart_count: sanitizedInput.options.include_charts ? 8 : 0,
      data_points: 156,
      generation_time: generationTime
    };

    // Calculate file size based on format
    let fileSize: number;
    switch (sanitizedInput.template.format) {
      case 'pdf':
        fileSize = 2048576; // 2MB
        break;
      case 'html':
        fileSize = 512000; // 500KB
        break;
      case 'excel':
        fileSize = 1024000; // 1MB
        break;
      case 'powerpoint':
        fileSize = 3072000; // 3MB
        break;
      default:
        fileSize = 1024000; // 1MB
    }

    const report = {
      id: reportId,
      pipeline_id: sanitizedInput.pipeline_id,
      repository: sanitizedInput.repository,
      report_type: sanitizedInput.report_type,
      template: sanitizedInput.template,
      time_range: {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        period: sanitizedInput.time_range.period || 'custom'
      },
      generated_at: currentTime.toISOString(),
      generated_by: 'current_user',
      file_size: fileSize,
      download_url: downloadUrl,
      distribution: sanitizedInput.distribution ? {
        recipients: sanitizedInput.distribution.recipients,
        delivery_method: sanitizedInput.distribution.delivery_method || 'download',
        schedule: sanitizedInput.distribution.schedule ? {
          enabled: sanitizedInput.distribution.schedule.enabled || false,
          frequency: sanitizedInput.distribution.schedule.frequency,
          day_of_week: sanitizedInput.distribution.schedule.day_of_week,
          day_of_month: sanitizedInput.distribution.schedule.day_of_month,
          time: sanitizedInput.distribution.schedule.time
        } : undefined
      } : undefined,
      metadata: metadata
    };

    // Log report generation
    console.log(`Pipeline report generated: ${reportId} for pipeline: ${sanitizedInput.pipeline_id}`);

    return {
      success: true,
      report: report
    };

  } catch (error) {
    console.error('Error generating pipeline report:', error);
    
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

export default generatePipelineReportsTool;
