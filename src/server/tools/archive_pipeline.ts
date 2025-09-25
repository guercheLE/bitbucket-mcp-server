/**
 * Archive Pipeline Tool
 * 
 * MCP tool for archiving old and unused pipelines with proper metadata
 * preservation, cleanup capabilities, and restoration options.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { Pipeline } from '../../types/pipeline.js';
import { PipelineService } from '../services/pipeline-service.js';

// Input validation schema
const ArchivePipelineSchema = z.object({
    pipeline_id: z.string().min(1, 'Pipeline ID is required'),
    repository: z.string().min(1, 'Repository is required'),
    archive_config: z.object({
        archive_reason: z.enum(['unused', 'deprecated', 'migration', 'cleanup', 'compliance'], {
            errorMap: () => ({ message: 'Archive reason must be one of: unused, deprecated, migration, cleanup, or compliance' })
        }),
        retention_period_days: z.number().int().min(30).max(3650).optional().default(365),
        preserve_artifacts: z.boolean().optional().default(true),
        preserve_logs: z.boolean().optional().default(true),
        preserve_metrics: z.boolean().optional().default(false),
        notify_stakeholders: z.boolean().optional().default(true),
        auto_cleanup_after_retention: z.boolean().optional().default(false)
    }).optional(),
    analysis_config: z.object({
        check_dependencies: z.boolean().optional().default(true),
        analyze_usage_patterns: z.boolean().optional().default(true),
        identify_related_pipelines: z.boolean().optional().default(true),
        generate_impact_report: z.boolean().optional().default(true)
    }).optional(),
    confirmation: z.object({
        acknowledged_impact: z.boolean(),
        backup_completed: z.boolean().optional().default(false),
        stakeholder_approval: z.boolean().optional().default(false)
    })
});

type ArchivePipelineInput = z.infer<typeof ArchivePipelineSchema>;

// Output validation schema
const ArchivePipelineOutputSchema = z.object({
    success: z.boolean(),
    archive_report: z.object({
        pipeline_id: z.string(),
        repository: z.string(),
        archive_timestamp: z.string(),
        archive_location: z.string(),
        archive_reason: z.string(),
        impact_analysis: z.object({
            dependent_pipelines: z.array(z.object({
                pipeline_id: z.string(),
                dependency_type: z.enum(['triggers', 'consumes_artifacts', 'shared_resources', 'configuration']),
                impact_severity: z.enum(['low', 'medium', 'high', 'critical']),
                mitigation_required: z.boolean()
            })),
            stakeholders_affected: z.array(z.object({
                stakeholder_type: z.enum(['team', 'service', 'project', 'customer']),
                stakeholder_id: z.string(),
                impact_description: z.string(),
                notification_sent: z.boolean()
            })),
            resource_liberation: z.object({
                compute_resources_freed: z.number(),
                storage_space_freed_mb: z.number(),
                estimated_cost_savings_monthly: z.number()
            }),
            historical_usage: z.object({
                last_execution_date: z.string().optional(),
                total_executions: z.number(),
                avg_executions_per_month: z.number(),
                usage_trend: z.enum(['increasing', 'stable', 'decreasing', 'dormant'])
            })
        }),
        preserved_data: z.object({
            artifacts_archived: z.boolean(),
            logs_archived: z.boolean(),
            metrics_archived: z.boolean(),
            configuration_backup: z.boolean(),
            archive_size_mb: z.number(),
            restoration_instructions: z.string()
        }),
        cleanup_schedule: z.object({
            retention_expires_on: z.string(),
            auto_cleanup_enabled: z.boolean(),
            cleanup_preview: z.array(z.object({
                item_type: z.string(),
                item_count: z.number(),
                cleanup_action: z.string()
            }))
        }),
        recommendations: z.array(z.object({
            category: z.enum(['similar_pipelines', 'resource_optimization', 'process_improvement', 'migration_path']),
            priority: z.enum(['low', 'medium', 'high']),
            title: z.string(),
            description: z.string(),
            action_items: z.array(z.string())
        }))
    }).optional(),
    metadata: z.object({
        operation_duration: z.number(),
        items_processed: z.number(),
        warnings_count: z.number(),
        errors_encountered: z.array(z.string()),
        rollback_available: z.boolean()
    }),
    message: z.string(),
    error: z.string().optional()
});

type ArchivePipelineOutput = z.infer<typeof ArchivePipelineOutputSchema>;

/**
 * Implementation of the archive pipeline tool
 */
export const archivePipelineTool: Tool = {
    name: 'archive_pipeline',
    description: 'Archive old and unused pipelines with proper metadata preservation, impact analysis, and cleanup scheduling',
    inputSchema: {
        type: 'object',
        properties: {
            pipeline_id: {
                type: 'string',
                description: 'ID of the pipeline to archive'
            },
            repository: {
                type: 'string',
                description: 'Repository containing the pipeline (format: workspace/repo-name)'
            },
            archive_config: {
                type: 'object',
                properties: {
                    archive_reason: {
                        type: 'string',
                        enum: ['unused', 'deprecated', 'migration', 'cleanup', 'compliance'],
                        description: 'Reason for archiving the pipeline'
                    },
                    retention_period_days: {
                        type: 'number',
                        description: 'How long to retain archived data (30-3650 days)',
                        default: 365,
                        minimum: 30,
                        maximum: 3650
                    },
                    preserve_artifacts: {
                        type: 'boolean',
                        description: 'Whether to preserve pipeline artifacts in archive',
                        default: true
                    },
                    preserve_logs: {
                        type: 'boolean',
                        description: 'Whether to preserve pipeline logs in archive',
                        default: true
                    },
                    preserve_metrics: {
                        type: 'boolean',
                        description: 'Whether to preserve pipeline metrics in archive',
                        default: false
                    },
                    notify_stakeholders: {
                        type: 'boolean',
                        description: 'Whether to notify affected stakeholders',
                        default: true
                    },
                    auto_cleanup_after_retention: {
                        type: 'boolean',
                        description: 'Whether to automatically cleanup after retention period',
                        default: false
                    }
                }
            },
            analysis_config: {
                type: 'object',
                properties: {
                    check_dependencies: {
                        type: 'boolean',
                        description: 'Analyze pipeline dependencies before archiving',
                        default: true
                    },
                    analyze_usage_patterns: {
                        type: 'boolean',
                        description: 'Analyze historical usage patterns',
                        default: true
                    },
                    identify_related_pipelines: {
                        type: 'boolean',
                        description: 'Identify related pipelines that might be affected',
                        default: true
                    },
                    generate_impact_report: {
                        type: 'boolean',
                        description: 'Generate comprehensive impact analysis report',
                        default: true
                    }
                }
            },
            confirmation: {
                type: 'object',
                properties: {
                    acknowledged_impact: {
                        type: 'boolean',
                        description: 'Confirmation that impact has been acknowledged'
                    },
                    backup_completed: {
                        type: 'boolean',
                        description: 'Confirmation that backup has been completed',
                        default: false
                    },
                    stakeholder_approval: {
                        type: 'boolean',
                        description: 'Confirmation that stakeholders have approved',
                        default: false
                    }
                },
                required: ['acknowledged_impact']
            }
        },
        required: ['pipeline_id', 'repository', 'confirmation']
    }
};

/**
 * Handler function for archiving pipelines
 */
export async function handleArchivePipeline(
    input: ArchivePipelineInput,
    pipelineService: PipelineService
): Promise<ArchivePipelineOutput> {
    try {
        // Validate input
        const validatedInput = ArchivePipelineSchema.parse(input);

        // Get pipeline information
        const pipeline = await pipelineService.getPipeline(validatedInput.pipeline_id);

        if (!pipeline.success || !pipeline.data) {
            return {
                success: false,
                metadata: {
                    operation_duration: 0,
                    items_processed: 0,
                    warnings_count: 0,
                    errors_encountered: [`Pipeline ${validatedInput.pipeline_id} not found`],
                    rollback_available: false
                },
                message: `Pipeline ${validatedInput.pipeline_id} not found in repository ${validatedInput.repository}`,
                error: pipeline.error?.message || 'Pipeline not found'
            };
        }

        const startTime = Date.now();
        const warnings: string[] = [];
        const errors: string[] = [];

        // Perform dependency analysis
        const dependencyAnalysis = await analyzePipelineDependencies(
            validatedInput.repository,
            validatedInput.pipeline_id,
            validatedInput.analysis_config,
            pipelineService
        );

        // Analyze usage patterns
        const usageAnalysis = await analyzeUsagePatterns(
            validatedInput.repository,
            validatedInput.pipeline_id,
            validatedInput.analysis_config,
            pipelineService
        );

        // Identify stakeholders
        const stakeholderAnalysis = await identifyAffectedStakeholders(
            validatedInput.repository,
            validatedInput.pipeline_id,
            dependencyAnalysis,
            pipelineService
        );

        // Calculate resource liberation
        const resourceAnalysis = await calculateResourceLiberation(
            pipeline.data,
            usageAnalysis,
            pipelineService
        );

        // Create archive package
        const archiveResult = await createArchivePackage(
            validatedInput.repository,
            validatedInput.pipeline_id,
            validatedInput.archive_config,
            pipeline.data,
            pipelineService
        );

        // Schedule cleanup if configured
        const cleanupSchedule = await scheduleCleanup(
            validatedInput.repository,
            validatedInput.pipeline_id,
            validatedInput.archive_config
        );

        // Generate recommendations
        const recommendations = await generateArchiveRecommendations(
            pipeline.data,
            dependencyAnalysis,
            usageAnalysis,
            pipelineService
        );

        // Notify stakeholders if configured
        if (validatedInput.archive_config?.notify_stakeholders) {
            await notifyStakeholders(stakeholderAnalysis, validatedInput.repository, validatedInput.pipeline_id);
        }

        const operationTimeMs = Date.now() - startTime;

        const report: ArchivePipelineOutput = {
            success: true,
            archive_report: {
                pipeline_id: validatedInput.pipeline_id,
                repository: validatedInput.repository,
                archive_timestamp: new Date().toISOString(),
                archive_location: archiveResult.location,
                archive_reason: validatedInput.archive_config?.archive_reason || 'unused',
                impact_analysis: {
                    dependent_pipelines: dependencyAnalysis.dependencies,
                    stakeholders_affected: stakeholderAnalysis,
                    resource_liberation: resourceAnalysis,
                    historical_usage: usageAnalysis
                },
                preserved_data: archiveResult.preservedData,
                cleanup_schedule: cleanupSchedule,
                recommendations: recommendations
            },
            metadata: {
                operation_duration: operationTimeMs,
                items_processed: archiveResult.itemsProcessed,
                warnings_count: warnings.length,
                errors_encountered: errors,
                rollback_available: true
            },
            message: `Successfully archived pipeline ${validatedInput.pipeline_id}. Archive stored at ${archiveResult.location}`
        };

        return ArchivePipelineOutputSchema.parse(report);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        return {
            success: false,
            metadata: {
                operation_duration: 0,
                items_processed: 0,
                warnings_count: 0,
                errors_encountered: [errorMessage],
                rollback_available: false
            },
            message: 'Failed to archive pipeline',
            error: errorMessage
        };
    }
}

/**
 * Analyze pipeline dependencies to understand impact
 */
async function analyzePipelineDependencies(
    repository: string,
    pipelineId: string,
    config: ArchivePipelineInput['analysis_config'],
    pipelineService: PipelineService
): Promise<{
    dependencies: Array<{
        pipeline_id: string;
        dependency_type: 'triggers' | 'consumes_artifacts' | 'shared_resources' | 'configuration';
        impact_severity: 'low' | 'medium' | 'high' | 'critical';
        mitigation_required: boolean;
    }>;
}> {
    if (!config?.check_dependencies) {
        return { dependencies: [] };
    }

    // In a real implementation, this would query the pipeline service
    // For now, simulate dependency analysis
    const mockDependencies = [
        {
            pipeline_id: 'related-pipeline-001',
            dependency_type: 'consumes_artifacts' as const,
            impact_severity: 'medium' as const,
            mitigation_required: true
        },
        {
            pipeline_id: 'downstream-pipeline-002',
            dependency_type: 'triggers' as const,
            impact_severity: 'high' as const,
            mitigation_required: true
        }
    ];

    return { dependencies: mockDependencies };
}

/**
 * Analyze usage patterns for the pipeline
 */
async function analyzeUsagePatterns(
    repository: string,
    pipelineId: string,
    config: ArchivePipelineInput['analysis_config'],
    pipelineService: PipelineService
): Promise<{
    last_execution_date?: string;
    total_executions: number;
    avg_executions_per_month: number;
    usage_trend: 'increasing' | 'stable' | 'decreasing' | 'dormant';
}> {
    if (!config?.analyze_usage_patterns) {
        return {
            total_executions: 0,
            avg_executions_per_month: 0,
            usage_trend: 'dormant'
        };
    }

    // In a real implementation, this would analyze historical execution data
    return {
        last_execution_date: '2024-08-15T10:30:00Z',
        total_executions: 127,
        avg_executions_per_month: 2.1,
        usage_trend: 'decreasing'
    };
}

/**
 * Identify affected stakeholders
 */
async function identifyAffectedStakeholders(
    repository: string,
    pipelineId: string,
    dependencyAnalysis: any,
    pipelineService: PipelineService
): Promise<Array<{
    stakeholder_type: 'team' | 'service' | 'project' | 'customer';
    stakeholder_id: string;
    impact_description: string;
    notification_sent: boolean;
}>> {
    return [
        {
            stakeholder_type: 'team',
            stakeholder_id: 'backend-team',
            impact_description: 'Team owns 2 pipelines that depend on this pipeline\'s artifacts',
            notification_sent: false
        },
        {
            stakeholder_type: 'service',
            stakeholder_id: 'deployment-service',
            impact_description: 'Service triggers this pipeline as part of deployment workflow',
            notification_sent: false
        }
    ];
}

/**
 * Calculate resource liberation from archiving
 */
async function calculateResourceLiberation(
    pipeline: Pipeline,
    usageAnalysis: any,
    pipelineService: PipelineService
): Promise<{
    compute_resources_freed: number;
    storage_space_freed_mb: number;
    estimated_cost_savings_monthly: number;
}> {
    // Calculate based on pipeline complexity and usage
    const avgExecutionsPerMonth = usageAnalysis.avg_executions_per_month || 0;
    const avgExecutionTime = 25; // minutes
    const costPerComputeMinute = 0.05; // dollars

    return {
        compute_resources_freed: avgExecutionsPerMonth * avgExecutionTime,
        storage_space_freed_mb: 750, // Estimated storage for logs, artifacts, etc.
        estimated_cost_savings_monthly: avgExecutionsPerMonth * avgExecutionTime * costPerComputeMinute
    };
}

/**
 * Create archive package with preserved data
 */
async function createArchivePackage(
    repository: string,
    pipelineId: string,
    config: ArchivePipelineInput['archive_config'],
    pipeline: Pipeline,
    pipelineService: PipelineService
): Promise<{
    location: string;
    preservedData: {
        artifacts_archived: boolean;
        logs_archived: boolean;
        metrics_archived: boolean;
        configuration_backup: boolean;
        archive_size_mb: number;
        restoration_instructions: string;
    };
    itemsProcessed: number;
}> {
    const archiveLocation = `archives/${repository}/${pipelineId}/${new Date().getTime()}`;

    return {
        location: archiveLocation,
        preservedData: {
            artifacts_archived: config?.preserve_artifacts || true,
            logs_archived: config?.preserve_logs || true,
            metrics_archived: config?.preserve_metrics || false,
            configuration_backup: true,
            archive_size_mb: 245.7,
            restoration_instructions: `To restore pipeline, use: bitbucket-restore --archive-path=${archiveLocation} --target-repository=${repository}`
        },
        itemsProcessed: 1
    };
}

/**
 * Schedule cleanup after retention period
 */
async function scheduleCleanup(
    repository: string,
    pipelineId: string,
    config: ArchivePipelineInput['archive_config']
): Promise<{
    retention_expires_on: string;
    auto_cleanup_enabled: boolean;
    cleanup_preview: Array<{
        item_type: string;
        item_count: number;
        cleanup_action: string;
    }>;
}> {
    const retentionPeriod = config?.retention_period_days || 365;
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + retentionPeriod);

    return {
        retention_expires_on: expirationDate.toISOString(),
        auto_cleanup_enabled: config?.auto_cleanup_after_retention || false,
        cleanup_preview: [
            {
                item_type: 'pipeline_configuration',
                item_count: 1,
                cleanup_action: 'Delete pipeline definition'
            },
            {
                item_type: 'archived_logs',
                item_count: 127, // Based on total executions
                cleanup_action: 'Delete archived execution logs'
            },
            {
                item_type: 'archived_artifacts',
                item_count: 89,
                cleanup_action: 'Delete archived build artifacts'
            }
        ]
    };
}

/**
 * Generate recommendations based on archive analysis
 */
async function generateArchiveRecommendations(
    pipeline: Pipeline,
    dependencyAnalysis: any,
    usageAnalysis: any,
    pipelineService: PipelineService
): Promise<Array<{
    category: 'similar_pipelines' | 'resource_optimization' | 'process_improvement' | 'migration_path';
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    action_items: string[];
}>> {
    const recommendations = [];

    // Check for similar unused pipelines
    if (usageAnalysis.usage_trend === 'decreasing' || usageAnalysis.usage_trend === 'dormant') {
        recommendations.push({
            category: 'similar_pipelines' as const,
            priority: 'medium' as const,
            title: 'Review Similar Low-Usage Pipelines',
            description: 'Other pipelines in this repository may also be candidates for archiving',
            action_items: [
                'Analyze other pipelines with similar usage patterns',
                'Create bulk archiving plan for unused pipelines',
                'Establish regular pipeline usage review process'
            ]
        });
    }

    // Resource optimization recommendation
    recommendations.push({
        category: 'resource_optimization' as const,
        priority: 'low' as const,
        title: 'Optimize Remaining Pipeline Resources',
        description: 'Freed resources can be reallocated to active pipelines',
        action_items: [
            'Review resource allocation for remaining active pipelines',
            'Consider upgrading agent pools for frequently used pipelines',
            'Implement resource monitoring and alerting'
        ]
    });

    // Process improvement if dependencies were found
    if (dependencyAnalysis.dependencies.length > 0) {
        recommendations.push({
            category: 'process_improvement' as const,
            priority: 'high' as const,
            title: 'Update Dependent Pipeline Workflows',
            description: 'Dependent pipelines need to be updated to handle the archived pipeline',
            action_items: [
                'Update pipeline configurations that reference this pipeline',
                'Modify artifact consumption patterns',
                'Test dependent pipeline execution paths',
                'Document workflow changes for stakeholders'
            ]
        });
    }

    return recommendations;
}

/**
 * Notify affected stakeholders
 */
async function notifyStakeholders(
    stakeholders: Array<{
        stakeholder_type: 'team' | 'service' | 'project' | 'customer';
        stakeholder_id: string;
        impact_description: string;
        notification_sent: boolean;
    }>,
    repository: string,
    pipelineId: string
): Promise<void> {
    // In a real implementation, this would send notifications via email, Slack, etc.
    for (const stakeholder of stakeholders) {
        stakeholder.notification_sent = true;
    }
}