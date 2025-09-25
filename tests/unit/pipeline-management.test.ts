/**
 * Pipeline Management Unit Tests
 * 
 * Comprehensive unit tests for all pipeline management MCP tools
 * covering functionality, error handling, validation, and edge cases.
 */

import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { PipelineService } from '../../src/server/services/pipeline-service.js';
import { Pipeline, PipelineStatus } from '../../src/types/pipeline.js';

// Import all pipeline management tools
import { handleArchivePipeline } from '../../src/server/tools/archive_pipeline.js';
import { handleCleanupPipelineData } from '../../src/server/tools/cleanup_pipeline_data.js';
import { handleCreatePipeline } from '../../src/server/tools/create_pipeline.js';
import { handleExecutePipeline } from '../../src/server/tools/execute_pipeline.js';
import { handleGetPipelineStatus } from '../../src/server/tools/get_pipeline_status.js';
import { handleMigratePipelineConfig } from '../../src/server/tools/migrate_pipeline_config.js';
import { handleMonitorPipeline } from '../../src/server/tools/monitor_pipeline.js';
import { handleOptimizePipelinePerformance } from '../../src/server/tools/optimize_pipeline_performance.js';
import { handleTroubleshootPipelineFailures } from '../../src/server/tools/troubleshoot_pipeline_failures.js';

// Mock data
const mockPipeline: Pipeline = {
    id: 'test-pipeline-1',
    name: 'Test Build Pipeline',
    description: 'A test pipeline for unit testing',
    repository: {
        id: 'repo-1',
        name: 'test-repo',
        fullName: 'workspace/test-repo'
    },
    configuration: {
        name: 'Test Build Pipeline',
        steps: [
            {
                name: 'build',
                script: ['npm install', 'npm run build'],
                image: 'node:18'
            }
        ],
        triggers: [],
        environments: [],
        variables: { NODE_VERSION: '18' },
        secrets: {},
        timeout: 3600,
        enabled: true
    },
    status: PipelineStatus.ACTIVE,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: {
        id: 'user-1',
        name: 'Test User'
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
};

describe('Pipeline Management Tools', () => {
    let mockPipelineService: jest.Mocked<PipelineService>;

    beforeEach(() => {
        mockPipelineService = {
            createPipeline: jest.fn(),
            getPipeline: jest.fn(),
            updatePipeline: jest.fn(),
            deletePipeline: jest.fn(),
            listPipelines: jest.fn(),
            executePipeline: jest.fn(),
            getPipelineStatus: jest.fn(),
            getPipelineLogs: jest.fn(),
            cancelPipeline: jest.fn(),
            validateRepository: jest.fn()
        } as any;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Create Pipeline Tool', () => {
        test('should create a new pipeline successfully', async () => {
            mockPipelineService.createPipeline.mockResolvedValue(mockPipeline);

            const args = {
                repository: 'workspace/test-repo',
                pipeline_config: {
                    name: 'Test Pipeline',
                    steps: [
                        {
                            name: 'build',
                            script: ['npm install', 'npm run build']
                        }
                    ]
                }
            };

            const result = await handleCreatePipeline(args, mockPipelineService);

            expect(result.success).toBe(true);
            expect(result.pipeline?.name).toBe('Test Pipeline');
            expect(mockPipelineService.createPipeline).toHaveBeenCalledTimes(1);
        });

        test('should handle invalid repository format', async () => {
            const args = {
                repository: 'invalid-repo-format',
                pipeline_config: {
                    name: 'Test Pipeline',
                    steps: []
                }
            };

            const result = await handleCreatePipeline(args, mockPipelineService);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Repository must be in workspace/repo-name format');
        });

        test('should handle empty pipeline configuration', async () => {
            const args = {
                repository: 'workspace/test-repo',
                pipeline_config: {
                    name: '',
                    steps: []
                }
            };

            const result = await handleCreatePipeline(args, mockPipelineService);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('Execute Pipeline Tool', () => {
        test('should execute pipeline successfully', async () => {
            mockPipelineService.executePipeline.mockResolvedValue({
                id: 'run-1',
                pipeline_id: 'test-pipeline-1',
                status: 'running',
                started_at: new Date().toISOString()
            } as any);

            const args = {
                repository: 'workspace/test-repo',
                pipeline_id: 'test-pipeline-1'
            };

            const result = await handleExecutePipeline(args, mockPipelineService);

            expect(result.success).toBe(true);
            expect(result.execution?.status).toBe('running');
            expect(mockPipelineService.executePipeline).toHaveBeenCalledTimes(1);
        });

        test('should handle pipeline not found', async () => {
            mockPipelineService.executePipeline.mockRejectedValue(new Error('Pipeline not found'));

            const args = {
                repository: 'workspace/test-repo',
                pipeline_id: 'nonexistent-pipeline'
            };

            const result = await handleExecutePipeline(args, mockPipelineService);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Pipeline not found');
        });
    });

    describe('Monitor Pipeline Tool', () => {
        test('should monitor pipeline successfully', async () => {
            mockPipelineService.getPipelineStatus.mockResolvedValue({
                id: 'run-1',
                status: 'running',
                progress: 50
            } as any);

            const args = {
                repository: 'workspace/test-repo',
                pipeline_id: 'test-pipeline-1',
                monitoring_config: {
                    real_time: true,
                    include_logs: false
                }
            };

            const result = await handleMonitorPipeline(args, mockPipelineService);

            expect(result.success).toBe(true);
            expect(result.monitoring_report?.current_status?.status).toBe('running');
            expect(mockPipelineService.getPipelineStatus).toHaveBeenCalledTimes(1);
        });
    });

    describe('Get Pipeline Status Tool', () => {
        test('should get pipeline status successfully', async () => {
            mockPipelineService.getPipelineStatus.mockResolvedValue({
                id: 'run-1',
                pipeline_id: 'test-pipeline-1',
                status: 'completed',
                result: 'successful'
            } as any);

            const args = {
                repository: 'workspace/test-repo',
                pipeline_id: 'test-pipeline-1'
            };

            const result = await handleGetPipelineStatus(args, mockPipelineService);

            expect(result.success).toBe(true);
            expect(result.status_report?.current_status?.status).toBe('completed');
        });
    });

    describe('Troubleshoot Pipeline Failures Tool', () => {
        test('should troubleshoot pipeline failures successfully', async () => {
            const args = {
                repository: 'workspace/test-repo',
                failure_context: {
                    pipeline_id: 'test-pipeline-1',
                    run_id: 'run-1',
                    failure_type: 'build_failure' as const
                },
                analysis_config: {
                    analyze_logs: true,
                    check_dependencies: true,
                    suggest_fixes: true
                }
            };

            const result = await handleTroubleshootPipelineFailures(args, mockPipelineService);

            expect(result.success).toBe(true);
            expect(result.troubleshooting_report).toBeDefined();
            expect(result.troubleshooting_report?.failure_analysis).toBeDefined();
        });

        test('should handle missing pipeline ID', async () => {
            const args = {
                repository: 'workspace/test-repo',
                failure_context: {
                    pipeline_id: '',
                    failure_type: 'build_failure' as const
                }
            };

            const result = await handleTroubleshootPipelineFailures(args, mockPipelineService);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('Optimize Pipeline Performance Tool', () => {
        test('should optimize pipeline performance successfully', async () => {
            const args = {
                repository: 'workspace/test-repo',
                target_pipeline_id: 'test-pipeline-1',
                optimization_config: {
                    analyze_execution_time: true,
                    analyze_resource_usage: true,
                    suggest_improvements: true
                }
            };

            const result = await handleOptimizePipelinePerformance(args, mockPipelineService);

            expect(result.success).toBe(true);
            expect(result.optimization_report).toBeDefined();
            expect(result.optimization_report?.performance_analysis).toBeDefined();
        });
    });

    describe('Archive Pipeline Tool', () => {
        test('should archive pipeline successfully', async () => {
            const args = {
                pipeline_id: 'test-pipeline-1',
                repository: 'workspace/test-repo',
                archive_config: {
                    archive_reason: 'unused' as const,
                    retention_period_days: 365
                },
                confirmation: {
                    acknowledged_impact: true
                }
            };

            const result = await handleArchivePipeline(args, mockPipelineService);

            expect(result.success).toBe(true);
            expect(result.archive_report).toBeDefined();
            expect(result.archive_report?.archive_reason).toBe('unused');
        });

        test('should require confirmation for archiving', async () => {
            const args = {
                pipeline_id: 'test-pipeline-1',
                repository: 'workspace/test-repo',
                confirmation: {
                    acknowledged_impact: false
                }
            };

            const result = await handleArchivePipeline(args, mockPipelineService);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('Cleanup Pipeline Data Tool', () => {
        test('should cleanup pipeline data successfully', async () => {
            const args = {
                repository: 'workspace/test-repo',
                cleanup_config: {
                    cleanup_scope: 'repository' as const,
                    data_types: {
                        artifacts: true,
                        logs: true,
                        cache: true
                    }
                },
                safety_config: {
                    dry_run: true
                }
            };

            const result = await handleCleanupPipelineData(args, mockPipelineService);

            expect(result.success).toBe(true);
            expect(result.cleanup_report).toBeDefined();
            expect(result.cleanup_report?.execution_mode).toBe('dry_run');
        });
    });

    describe('Migrate Pipeline Config Tool', () => {
        test('should migrate pipeline configuration successfully', async () => {
            const args = {
                migration_type: 'version_upgrade' as const,
                source: {
                    repository: 'workspace/test-repo',
                    version: '1.0'
                },
                target: {
                    version: '2.0'
                },
                migration_config: {
                    dry_run: true,
                    create_backup: true
                }
            };

            const result = await handleMigratePipelineConfig(args, mockPipelineService);

            expect(result.success).toBe(true);
            expect(result.migration_report).toBeDefined();
            expect(result.migration_report?.execution_mode).toBe('dry_run');
        });

        test('should handle invalid migration type', async () => {
            const args = {
                migration_type: 'invalid_type' as any,
                source: {
                    repository: 'workspace/test-repo'
                },
                target: {}
            };

            const result = await handleMigratePipelineConfig(args, mockPipelineService);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('Input Validation', () => {
        test('should validate required fields', async () => {
            const args = {};

            const result = await handleCreatePipeline(args, mockPipelineService);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        test('should validate repository format across all tools', async () => {
            const invalidRepo = 'invalid-format';

            // Test multiple tools with invalid repository format
            const createResult = await handleCreatePipeline({
                repository: invalidRepo,
                pipeline_config: { name: 'Test', steps: [] }
            }, mockPipelineService);

            const executeResult = await handleExecutePipeline({
                repository: invalidRepo,
                pipeline_id: 'test'
            }, mockPipelineService);

            expect(createResult.success).toBe(false);
            expect(executeResult.success).toBe(false);
        });
    });

    describe('Error Handling', () => {
        test('should handle service errors gracefully', async () => {
            mockPipelineService.createPipeline.mockRejectedValue(new Error('Service unavailable'));

            const args = {
                repository: 'workspace/test-repo',
                pipeline_config: {
                    name: 'Test Pipeline',
                    steps: []
                }
            };

            const result = await handleCreatePipeline(args, mockPipelineService);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Service unavailable');
        });

        test('should handle network timeouts', async () => {
            mockPipelineService.executePipeline.mockRejectedValue(new Error('Request timeout'));

            const args = {
                repository: 'workspace/test-repo',
                pipeline_id: 'test-pipeline-1'
            };

            const result = await handleExecutePipeline(args, mockPipelineService);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Request timeout');
        });
    });

    describe('Performance and Scalability', () => {
        test('should handle large pipeline lists', async () => {
            const largePipelineList = Array.from({ length: 1000 }, (_, i) => ({
                ...mockPipeline,
                id: `pipeline-${i}`,
                name: `Pipeline ${i}`
            }));

            mockPipelineService.listPipelines.mockResolvedValue(largePipelineList);

            const args = {
                repository: 'workspace/test-repo',
                cleanup_config: {
                    cleanup_scope: 'repository' as const
                }
            };

            const result = await handleCleanupPipelineData(args, mockPipelineService);

            expect(result.success).toBe(true);
            // Should handle large datasets without issues
            expect(result.metadata.operation_duration).toBeLessThan(30); // Should complete in reasonable time
        });

        test('should handle concurrent operations', async () => {
            const args = {
                repository: 'workspace/test-repo',
                pipeline_id: 'test-pipeline-1'
            };

            // Simulate multiple concurrent status checks
            const promises = Array.from({ length: 10 }, () =>
                handleGetPipelineStatus(args, mockPipelineService)
            );

            const results = await Promise.all(promises);

            // All operations should succeed
            results.forEach(result => {
                expect(result.success).toBe(true);
            });
        });
    });
});

// Integration test helpers
export const testHelpers = {
    createMockPipeline: (overrides: Partial<Pipeline> = {}): Pipeline => ({
        ...mockPipeline,
        ...overrides
    }),

    createMockPipelineService: (): jest.Mocked<PipelineService> => ({
        createPipeline: jest.fn(),
        getPipeline: jest.fn(),
        updatePipeline: jest.fn(),
        deletePipeline: jest.fn(),
        listPipelines: jest.fn(),
        executePipeline: jest.fn(),
        getPipelineStatus: jest.fn(),
        getPipelineLogs: jest.fn(),
        cancelPipeline: jest.fn(),
        validateRepository: jest.fn()
    } as any),

    expectSuccessfulOperation: (result: any) => {
        expect(result.success).toBe(true);
        expect(result.error).toBeUndefined();
        expect(result.metadata).toBeDefined();
        expect(result.metadata.operation_duration).toBeGreaterThan(0);
    },

    expectFailedOperation: (result: any, expectedError?: string) => {
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        if (expectedError) {
            expect(result.error).toContain(expectedError);
        }
    }
};