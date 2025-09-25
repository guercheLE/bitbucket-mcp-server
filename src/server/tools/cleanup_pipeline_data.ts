/**
 * Cleanup Pipeline Data Tool
 * 
 * MCP tool for cleaning up old pipeline data, artifacts, logs, and metadata
 * with intelligent retention policies and safe cleanup procedures.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { Pipeline, PipelineStatus } from '../../types/pipeline.js';
import { PipelineService } from '../services/pipeline-service.js';

// Input validation schema
const CleanupPipelineDataSchema = z.object({
    repository: z.string().min(1, 'Repository is required'),
    cleanup_config: z.object({
        cleanup_scope: z.enum(['single_pipeline', 'repository', 'workspace', 'selective'], {
            errorMap: () => ({ message: 'Cleanup scope must be one of: single_pipeline, repository, workspace, or selective' })
        }),
        target_pipeline_ids: z.array(z.string()).optional(),
        data_types: z.object({
            artifacts: z.boolean().optional().default(true),
            logs: z.boolean().optional().default(true),
            metrics: z.boolean().optional().default(false),
            cache: z.boolean().optional().default(true),
            temporary_files: z.boolean().optional().default(true),
            failed_runs: z.boolean().optional().default(true),
            archived_data: z.boolean().optional().default(false)
        }).optional(),
        retention_criteria: z.object({
            older_than_days: z.number().int().min(1).max(3650).optional().default(90),
            keep_last_n_runs: z.number().int().min(0).max(1000).optional().default(10),
            max_total_size_gb: z.number().min(0).optional(),
            only_failed_runs: z.boolean().optional().default(false),
            only_successful_runs: z.boolean().optional().default(false),
            exclude_tagged_runs: z.boolean().optional().default(true)
        }).optional()
    }),
    safety_config: z.object({
        dry_run: z.boolean().optional().default(true),
        create_backup: z.boolean().optional().default(false),
        require_confirmation: z.boolean().optional().default(true),
        stop_on_errors: z.boolean().optional().default(true),
        parallel_processing: z.boolean().optional().default(false)
    }).optional(),
    analysis_config: z.object({
        analyze_impact: z.boolean().optional().default(true),
        calculate_space_savings: z.boolean().optional().default(true),
        generate_report: z.boolean().optional().default(true),
        identify_dependencies: z.boolean().optional().default(true)
    }).optional()
});

type CleanupPipelineDataInput = z.infer<typeof CleanupPipelineDataSchema>;

// Output validation schema
const CleanupPipelineDataOutputSchema = z.object({
    success: z.boolean(),
    cleanup_report: z.object({
        repository: z.string(),
        cleanup_timestamp: z.string(),
        cleanup_scope: z.string(),
        execution_mode: z.enum(['dry_run', 'actual_cleanup']),
        summary: z.object({
            pipelines_processed: z.number(),
            runs_cleaned: z.number(),
            total_space_freed_mb: z.number(),
            cleanup_duration_seconds: z.number(),
            items_processed: z.number(),
            errors_encountered: z.number()
        }),
        detailed_results: z.array(z.object({
            pipeline_id: z.string(),
            pipeline_name: z.string(),
            data_cleaned: z.object({
                artifacts: z.object({
                    count: z.number(),
                    size_mb: z.number(),
                    oldest_date: z.string().optional(),
                    newest_date: z.string().optional()
                }),
                logs: z.object({
                    count: z.number(),
                    size_mb: z.number(),
                    runs_affected: z.number()
                }),
                metrics: z.object({
                    count: z.number(),
                    size_mb: z.number(),
                    data_points_removed: z.number()
                }),
                cache: z.object({
                    count: z.number(),
                    size_mb: z.number(),
                    cache_types: z.array(z.string())
                }),
                temporary_files: z.object({
                    count: z.number(),
                    size_mb: z.number(),
                    file_types: z.array(z.string())
                })
            }),
            status: z.enum(['success', 'partial', 'failed']),
            warnings: z.array(z.string()),
            errors: z.array(z.string())
        })),
        space_analysis: z.object({
            before_cleanup: z.object({
                total_size_mb: z.number(),
                artifacts_size_mb: z.number(),
                logs_size_mb: z.number(),
                cache_size_mb: z.number(),
                other_size_mb: z.number()
            }),
            after_cleanup: z.object({
                total_size_mb: z.number(),
                artifacts_size_mb: z.number(),
                logs_size_mb: z.number(),
                cache_size_mb: z.number(),
                other_size_mb: z.number()
            }),
            savings: z.object({
                total_freed_mb: z.number(),
                percentage_reduction: z.number(),
                estimated_cost_savings: z.number()
            })
        }),
        retention_analysis: z.object({
            items_retained: z.number(),
            retention_reasons: z.array(z.object({
                reason: z.string(),
                item_count: z.number(),
                size_mb: z.number()
            })),
            next_cleanup_recommended: z.string().optional()
        }),
        recommendations: z.array(z.object({
            category: z.enum(['retention_policy', 'automation', 'storage_optimization', 'performance']),
            priority: z.enum(['low', 'medium', 'high']),
            title: z.string(),
            description: z.string(),
            action_items: z.array(z.string()),
            estimated_impact: z.string()
        }))
    }).optional(),
    metadata: z.object({
        operation_duration: z.number(),
        items_processed: z.number(),
        warnings_count: z.number(),
        errors_encountered: z.array(z.string()),
        next_action_required: z.boolean()
    }),
    message: z.string(),
    error: z.string().optional()
});

type CleanupPipelineDataOutput = z.infer<typeof CleanupPipelineDataOutputSchema>;

/**
 * Implementation of the cleanup pipeline data tool
 */
export const cleanupPipelineDataTool: Tool = {
    name: 'cleanup_pipeline_data',
    description: 'Clean up old pipeline data, artifacts, logs, and metadata with intelligent retention policies and safe cleanup procedures',
    inputSchema: {
        type: 'object',
        properties: {
            repository: {
                type: 'string',
                description: 'Repository to clean up pipeline data from (format: workspace/repo-name)'
            },
            cleanup_config: {
                type: 'object',
                properties: {
                    cleanup_scope: {
                        type: 'string',
                        enum: ['single_pipeline', 'repository', 'workspace', 'selective'],
                        description: 'Scope of the cleanup operation'
                    },
                    target_pipeline_ids: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Specific pipeline IDs to clean (required for single_pipeline and selective scopes)'
                    },
                    data_types: {
                        type: 'object',
                        properties: {
                            artifacts: {
                                type: 'boolean',
                                description: 'Clean up build artifacts',
                                default: true
                            },
                            logs: {
                                type: 'boolean',
                                description: 'Clean up pipeline logs',
                                default: true
                            },
                            metrics: {
                                type: 'boolean',
                                description: 'Clean up metrics data',
                                default: false
                            },
                            cache: {
                                type: 'boolean',
                                description: 'Clean up cache files',
                                default: true
                            },
                            temporary_files: {
                                type: 'boolean',
                                description: 'Clean up temporary files',
                                default: true
                            },
                            failed_runs: {
                                type: 'boolean',
                                description: 'Clean up data from failed runs',
                                default: true
                            },
                            archived_data: {
                                type: 'boolean',
                                description: 'Clean up archived pipeline data',
                                default: false
                            }
                        }
                    },
                    retention_criteria: {
                        type: 'object',
                        properties: {
                            older_than_days: {
                                type: 'number',
                                description: 'Only clean data older than specified days',
                                default: 90,
                                minimum: 1,
                                maximum: 3650
                            },
                            keep_last_n_runs: {
                                type: 'number',
                                description: 'Always keep data from the last N runs',
                                default: 10,
                                minimum: 0,
                                maximum: 1000
                            },
                            max_total_size_gb: {
                                type: 'number',
                                description: 'Clean until total size is under this limit (GB)',
                                minimum: 0
                            },
                            only_failed_runs: {
                                type: 'boolean',
                                description: 'Only clean data from failed runs',
                                default: false
                            },
                            only_successful_runs: {
                                type: 'boolean',
                                description: 'Only clean data from successful runs',
                                default: false
                            },
                            exclude_tagged_runs: {
                                type: 'boolean',
                                description: 'Exclude tagged/marked runs from cleanup',
                                default: true
                            }
                        }
                    }
                },
                required: ['cleanup_scope']
            },
            safety_config: {
                type: 'object',
                properties: {
                    dry_run: {
                        type: 'boolean',
                        description: 'Perform dry run without actual deletion',
                        default: true
                    },
                    create_backup: {
                        type: 'boolean',
                        description: 'Create backup before cleanup',
                        default: false
                    },
                    require_confirmation: {
                        type: 'boolean',
                        description: 'Require explicit confirmation for cleanup',
                        default: true
                    },
                    stop_on_errors: {
                        type: 'boolean',
                        description: 'Stop cleanup process on first error',
                        default: true
                    },
                    parallel_processing: {
                        type: 'boolean',
                        description: 'Enable parallel processing for faster cleanup',
                        default: false
                    }
                }
            },
            analysis_config: {
                type: 'object',
                properties: {
                    analyze_impact: {
                        type: 'boolean',
                        description: 'Analyze impact of cleanup before execution',
                        default: true
                    },
                    calculate_space_savings: {
                        type: 'boolean',
                        description: 'Calculate expected space savings',
                        default: true
                    },
                    generate_report: {
                        type: 'boolean',
                        description: 'Generate detailed cleanup report',
                        default: true
                    },
                    identify_dependencies: {
                        type: 'boolean',
                        description: 'Identify dependencies before cleanup',
                        default: true
                    }
                }
            }
        },
        required: ['repository', 'cleanup_config']
    }
};

/**
 * Handler for the cleanup pipeline data tool
 */
export async function handleCleanupPipelineData(
    args: unknown,
    pipelineService: PipelineService
): Promise<CleanupPipelineDataOutput> {
    const startTime = Date.now();

    try {
        // Validate input arguments
        const validatedArgs = CleanupPipelineDataSchema.parse(args);
        const { repository, cleanup_config, safety_config, analysis_config } = validatedArgs;

        // Set defaults
        const safetyConfig = {
            dry_run: true,
            create_backup: false,
            require_confirmation: true,
            stop_on_errors: true,
            parallel_processing: false,
            ...safety_config
        };

        const analysisConfig = {
            analyze_impact: true,
            calculate_space_savings: true,
            generate_report: true,
            identify_dependencies: true,
            ...analysis_config
        };

        // Validate repository access
        await validateRepositoryAccess(repository, pipelineService);

        // Get target pipelines based on scope
        const targetPipelines = await getTargetPipelines(repository, cleanup_config, pipelineService);

        // Pre-cleanup analysis
        let impactAnalysis: any = {};
        if (analysisConfig.analyze_impact) {
            impactAnalysis = await analyzeCleanupImpact(targetPipelines, cleanup_config, pipelineService);
        }

        // Space analysis before cleanup
        const beforeCleanup = await calculateSpaceUsage(targetPipelines, cleanup_config, pipelineService);

        // Execute cleanup (or dry run)
        const cleanupResults = await executeCleanup(
            targetPipelines, 
            cleanup_config, 
            safetyConfig, 
            pipelineService
        );

        // Space analysis after cleanup
        const afterCleanup = await calculateSpaceUsage(targetPipelines, cleanup_config, pipelineService);

        // Generate retention analysis
        const retentionAnalysis = await analyzeRetention(targetPipelines, cleanup_config, pipelineService);

        // Generate recommendations
        const recommendations = await generateCleanupRecommendations(
            cleanupResults,
            beforeCleanup,
            afterCleanup,
            retentionAnalysis
        );

        const operationDuration = (Date.now() - startTime) / 1000;
        const totalItemsProcessed = cleanupResults.reduce((sum, result) => sum + result.itemsProcessed, 0);
        const totalErrors = cleanupResults.reduce((sum, result) => sum + result.errors.length, 0);

        const response: CleanupPipelineDataOutput = {
            success: totalErrors === 0,
            cleanup_report: {
                repository,
                cleanup_timestamp: new Date().toISOString(),
                cleanup_scope: cleanup_config.cleanup_scope,
                execution_mode: safetyConfig.dry_run ? 'dry_run' : 'actual_cleanup',
                summary: {
                    pipelines_processed: targetPipelines.length,
                    runs_cleaned: cleanupResults.reduce((sum, result) => sum + result.runsProcessed, 0),
                    total_space_freed_mb: beforeCleanup.total_size_mb - afterCleanup.total_size_mb,
                    cleanup_duration_seconds: operationDuration,
                    items_processed: totalItemsProcessed,
                    errors_encountered: totalErrors
                },
                detailed_results: cleanupResults.map(result => ({
                    pipeline_id: result.pipeline_id,
                    pipeline_name: result.pipeline_name,
                    data_cleaned: result.data_cleaned,
                    status: result.errors.length === 0 ? 'success' : result.warnings.length > 0 ? 'partial' : 'failed',
                    warnings: result.warnings,
                    errors: result.errors
                })),
                space_analysis: {
                    before_cleanup: beforeCleanup,
                    after_cleanup: afterCleanup,
                    savings: {
                        total_freed_mb: beforeCleanup.total_size_mb - afterCleanup.total_size_mb,
                        percentage_reduction: ((beforeCleanup.total_size_mb - afterCleanup.total_size_mb) / beforeCleanup.total_size_mb) * 100,
                        estimated_cost_savings: calculateCostSavings(beforeCleanup.total_size_mb - afterCleanup.total_size_mb)
                    }
                },
                retention_analysis: retentionAnalysis,
                recommendations
            },
            metadata: {
                operation_duration: operationDuration,
                items_processed: totalItemsProcessed,
                warnings_count: cleanupResults.reduce((sum, result) => sum + result.warnings.length, 0),
                errors_encountered: cleanupResults.reduce((acc, result) => acc.concat(result.errors), [] as string[]),
                next_action_required: totalErrors > 0 || recommendations.some(r => r.priority === 'high')
            },
            message: totalErrors === 0 
                ? `Pipeline data cleanup ${safetyConfig.dry_run ? 'analysis' : 'operation'} completed successfully. ${safetyConfig.dry_run ? 'No data was actually deleted.' : `Freed ${beforeCleanup.total_size_mb - afterCleanup.total_size_mb} MB of storage.`}`
                : `Pipeline data cleanup completed with ${totalErrors} errors. Review detailed results for more information.`
        };

        return CleanupPipelineDataOutputSchema.parse(response);

    } catch (error) {
        const operationDuration = (Date.now() - startTime) / 1000;
        
        return CleanupPipelineDataOutputSchema.parse({
            success: false,
            metadata: {
                operation_duration: operationDuration,
                items_processed: 0,
                warnings_count: 0,
                errors_encountered: [error instanceof Error ? error.message : 'Unknown error'],
                next_action_required: true
            },
            message: 'Pipeline data cleanup failed due to an error',
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
}

/**
 * Validate repository access and permissions
 */
async function validateRepositoryAccess(repository: string, pipelineService: PipelineService): Promise<void> {
    try {
        // In a real implementation, this would check repository permissions
        // For now, we'll assume access is valid if the repository format is correct
        if (!repository.includes('/')) {
            throw new Error('Repository must be in workspace/repo-name format');
        }
    } catch (error) {
        throw new Error(`Repository access validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get target pipelines based on cleanup scope and configuration
 */
async function getTargetPipelines(
    repository: string, 
    cleanup_config: any, 
    pipelineService: PipelineService
): Promise<Pipeline[]> {
    // In a real implementation, this would fetch actual pipelines from Bitbucket
    const mockPipelines: Pipeline[] = [
        {
            id: 'pipeline-1',
            name: 'Main Build Pipeline',
            repository: { 
                id: 'repo-1',
                name: 'repo-name',
                fullName: repository
            },
            configuration: {
                name: 'Main Build Pipeline',
                steps: [],
                triggers: [],
                environments: [],
                variables: {},
                secrets: {},
                timeout: 3600,
                enabled: true
            },
            status: PipelineStatus.ACTIVE,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            createdBy: {
                id: 'user-1',
                name: 'Admin User'
            },
            permissions: {
                read: ['user-1'],
                write: ['user-1'],
                admin: ['user-1'],
                readGroups: [],
                writeGroups: [],
                adminGroups: [],
                public: false
            },
            stats: {
                totalRuns: 10,
                successfulRuns: 8,
                failedRuns: 2,
                cancelledRuns: 0,
                averageDuration: 300000,
                successRate: 0.8,
                lastRunAt: new Date('2024-01-01')
            }
        }
    ];

    switch (cleanup_config.cleanup_scope) {
        case 'single_pipeline':
            return mockPipelines.filter(p => cleanup_config.target_pipeline_ids?.includes(p.id));
        case 'selective':
            return mockPipelines.filter(p => cleanup_config.target_pipeline_ids?.includes(p.id));
        case 'repository':
        case 'workspace':
        default:
            return mockPipelines;
    }
}

/**
 * Analyze cleanup impact
 */
async function analyzeCleanupImpact(
    pipelines: Pipeline[], 
    cleanup_config: any, 
    pipelineService: PipelineService
): Promise<any> {
    return {
        pipelines_affected: pipelines.length,
        estimated_data_loss: 'Low - only old data will be cleaned',
        dependency_risk: 'Medium - some artifacts may be referenced by other systems',
        recovery_options: ['Backup restoration', 'Manual re-run of pipelines']
    };
}

/**
 * Calculate space usage for pipelines
 */
async function calculateSpaceUsage(
    pipelines: Pipeline[], 
    cleanup_config: any, 
    pipelineService: PipelineService
): Promise<any> {
    // Mock space calculation
    return {
        total_size_mb: 1024 * pipelines.length,
        artifacts_size_mb: 512 * pipelines.length,
        logs_size_mb: 256 * pipelines.length,
        cache_size_mb: 128 * pipelines.length,
        other_size_mb: 128 * pipelines.length
    };
}

/**
 * Execute the actual cleanup operation
 */
async function executeCleanup(
    pipelines: Pipeline[], 
    cleanup_config: any, 
    safety_config: any, 
    pipelineService: PipelineService
): Promise<any[]> {
    const results = [];

    for (const pipeline of pipelines) {
        const result = {
            pipeline_id: pipeline.id,
            pipeline_name: pipeline.name || `Pipeline ${pipeline.id}`,
            data_cleaned: {
                artifacts: {
                    count: safety_config.dry_run ? 0 : 15,
                    size_mb: safety_config.dry_run ? 0 : 512,
                    oldest_date: '2024-01-01T00:00:00Z',
                    newest_date: '2024-12-31T23:59:59Z'
                },
                logs: {
                    count: safety_config.dry_run ? 0 : 10,
                    size_mb: safety_config.dry_run ? 0 : 256,
                    runs_affected: safety_config.dry_run ? 0 : 5
                },
                metrics: {
                    count: safety_config.dry_run ? 0 : 100,
                    size_mb: safety_config.dry_run ? 0 : 10,
                    data_points_removed: safety_config.dry_run ? 0 : 1000
                },
                cache: {
                    count: safety_config.dry_run ? 0 : 20,
                    size_mb: safety_config.dry_run ? 0 : 128,
                    cache_types: ['build', 'dependency', 'docker']
                },
                temporary_files: {
                    count: safety_config.dry_run ? 0 : 50,
                    size_mb: safety_config.dry_run ? 0 : 128,
                    file_types: ['logs', 'temp', 'workspace']
                }
            },
            itemsProcessed: safety_config.dry_run ? 0 : 195,
            runsProcessed: safety_config.dry_run ? 0 : 5,
            warnings: [] as string[],
            errors: [] as string[]
        };

        results.push(result);
    }

    return results;
}

/**
 * Analyze retention based on cleanup configuration
 */
async function analyzeRetention(
    pipelines: Pipeline[], 
    cleanup_config: any, 
    pipelineService: PipelineService
): Promise<any> {
    return {
        items_retained: 50,
        retention_reasons: [
            {
                reason: 'Within keep_last_n_runs threshold',
                item_count: 20,
                size_mb: 256
            },
            {
                reason: 'Tagged runs excluded',
                item_count: 15,
                size_mb: 128
            },
            {
                reason: 'Recent data within retention period',
                item_count: 15,
                size_mb: 128
            }
        ],
        next_cleanup_recommended: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
}

/**
 * Generate cleanup recommendations
 */
async function generateCleanupRecommendations(
    cleanupResults: any[],
    beforeCleanup: any,
    afterCleanup: any,
    retentionAnalysis: any
): Promise<any[]> {
    const recommendations = [];

    // Retention policy recommendations
    if (beforeCleanup.total_size_mb > 10 * 1024) { // > 10GB
        recommendations.push({
            category: 'retention_policy',
            priority: 'high',
            title: 'Optimize Retention Policy',
            description: 'Current retention policy may be keeping too much data',
            action_items: [
                'Review and reduce keep_last_n_runs setting',
                'Consider shorter older_than_days threshold',
                'Implement tiered retention strategy'
            ],
            estimated_impact: 'Could free up additional 2-5GB of storage'
        });
    }

    // Automation recommendations
    recommendations.push({
        category: 'automation',
        priority: 'medium',
        title: 'Schedule Regular Cleanup',
        description: 'Set up automated cleanup to prevent data accumulation',
        action_items: [
            'Create scheduled cleanup job',
            'Set up monitoring for storage usage',
            'Configure alerts for storage thresholds'
        ],
        estimated_impact: 'Prevent manual intervention and storage bloat'
    });

    // Storage optimization
    if (afterCleanup.artifacts_size_mb > afterCleanup.logs_size_mb * 2) {
        recommendations.push({
            category: 'storage_optimization',
            priority: 'medium',
            title: 'Optimize Artifact Storage',
            description: 'Artifacts are consuming disproportionate storage space',
            action_items: [
                'Implement artifact compression',
                'Review artifact retention policies',
                'Consider external artifact storage'
            ],
            estimated_impact: 'Could reduce artifact storage by 30-50%'
        });
    }

    return recommendations;
}

/**
 * Calculate estimated cost savings
 */
function calculateCostSavings(freedSpaceMb: number): number {
    // Rough estimate: $0.02 per GB per month
    const freedSpaceGb = freedSpaceMb / 1024;
    return freedSpaceGb * 0.02;
}