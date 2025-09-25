/**
 * Contract tests for analytics MCP tools
 * 
 * These tests verify that the MCP tools conform to the expected interface
 * and handle various input scenarios correctly.
 */

import { z } from 'zod';

// Import the schemas from analytics types
import {
    AnalyticsFilterSchema,
    AnalyticsResponseSchema,
    DeveloperMetricsSchema,
    RepositoryMetricsSchema,
    TimeRangeSchema
} from '../../src/analytics/types';

describe('Analytics MCP Tools Contract Tests', () => {
    const validTimeRange = {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z'
    };

    const validFilter = {
        repositoryIds: ['repo-1'],
        timeRange: validTimeRange,
        aggregationLevel: 'daily' as const
    };

    describe('get-repository-analytics tool', () => {
        test('should accept valid repository analytics parameters', () => {
            const params = {
                repositoryId: 'test-repo-123',
                timeRange: validTimeRange,
                includeMetrics: ['commits', 'branches', 'codeChanges']
            };

            // This would be the actual MCP tool parameter schema
            const RepositoryAnalyticsParamsSchema = z.object({
                repositoryId: z.string().min(1),
                timeRange: TimeRangeSchema,
                includeMetrics: z.array(z.string()).optional()
            });

            expect(() => RepositoryAnalyticsParamsSchema.parse(params)).not.toThrow();
        });

        test('should reject invalid repository analytics parameters', () => {
            const invalidParams = [
                { repositoryId: '', timeRange: validTimeRange }, // empty repositoryId
                { repositoryId: 'test-repo', timeRange: { startDate: 'invalid', endDate: validTimeRange.endDate } }, // invalid date
                { repositoryId: 'test-repo', timeRange: { startDate: validTimeRange.startDate, endDate: 'invalid' } }, // invalid date
            ];

            const RepositoryAnalyticsParamsSchema = z.object({
                repositoryId: z.string().min(1),
                timeRange: TimeRangeSchema,
                includeMetrics: z.array(z.string()).optional()
            });

            invalidParams.forEach(params => {
                expect(() => RepositoryAnalyticsParamsSchema.parse(params)).toThrow();
            });
        });

        test('should return valid repository metrics response format', () => {
            const mockResponse = {
                success: true,
                data: {
                    repositoryId: 'test-repo-123',
                    repositoryName: 'Test Repository',
                    timeRange: validTimeRange,
                    commitFrequency: {
                        totalCommits: 50,
                        averageCommitsPerDay: 1.6,
                        commitsByDay: [
                            { date: '2024-01-01T00:00:00Z', count: 3 },
                            { date: '2024-01-02T00:00:00Z', count: 1 }
                        ]
                    },
                    branchActivity: {
                        totalBranches: 10,
                        activeBranches: 3,
                        branchCreationRate: 0.5,
                        averageBranchLifetime: 7.5
                    },
                    codeChanges: {
                        totalLinesAdded: 1500,
                        totalLinesRemoved: 300,
                        averageChangesPerCommit: 36.0,
                        largestCommitSize: 200
                    },
                    lastUpdated: '2024-01-31T23:59:59Z'
                },
                metadata: {
                    generatedAt: '2024-01-31T23:59:59Z',
                    processingTime: 150,
                    dataFreshness: '2024-01-31T22:00:00Z'
                }
            };

            expect(() => RepositoryMetricsSchema.parse(mockResponse.data)).not.toThrow();
            expect(() => AnalyticsResponseSchema.parse(mockResponse)).not.toThrow();
        });
    });

    describe('get-developer-metrics tool', () => {
        test('should accept valid developer metrics parameters', () => {
            const params = {
                developerId: 'dev-123',
                repositoryId: 'repo-456',
                timeRange: validTimeRange,
                includeMetrics: ['commits', 'pullRequests', 'reviews']
            };

            const DeveloperMetricsParamsSchema = z.object({
                developerId: z.string().min(1),
                repositoryId: z.string().optional(),
                timeRange: TimeRangeSchema,
                includeMetrics: z.array(z.string()).optional()
            });

            expect(() => DeveloperMetricsParamsSchema.parse(params)).not.toThrow();
        });

        test('should return valid developer metrics response format', () => {
            const mockResponse = {
                success: true,
                data: {
                    developerId: 'dev-123',
                    developerName: 'John Developer',
                    repositoryId: 'repo-456',
                    timeRange: validTimeRange,
                    commitStats: {
                        totalCommits: 25,
                        averageCommitsPerDay: 0.8,
                        linesOfCodeChanged: 2500
                    },
                    pullRequestStats: {
                        pullRequestsCreated: 8,
                        pullRequestsMerged: 6,
                        averagePRSize: 125,
                        averageTimeToMerge: 24.5
                    },
                    reviewActivity: {
                        reviewsCompleted: 15,
                        averageReviewTime: 2.5,
                        averageCommentsPerReview: 3.2
                    },
                    lastUpdated: '2024-01-31T23:59:59Z'
                },
                metadata: {
                    generatedAt: '2024-01-31T23:59:59Z',
                    processingTime: 95,
                    dataFreshness: '2024-01-31T22:00:00Z'
                }
            };

            expect(() => DeveloperMetricsSchema.parse(mockResponse.data)).not.toThrow();
            expect(() => AnalyticsResponseSchema.parse(mockResponse)).not.toThrow();
        });
    });

    describe('export-analytics-data tool', () => {
        test('should accept valid export parameters', () => {
            const params = {
                filter: validFilter,
                format: 'json',
                includeRawData: false
            };

            const ExportParamsSchema = z.object({
                filter: AnalyticsFilterSchema,
                format: z.enum(['json', 'csv', 'xlsx']).default('json'),
                includeRawData: z.boolean().default(false)
            });

            expect(() => ExportParamsSchema.parse(params)).not.toThrow();
        });

        test('should return valid export response format', () => {
            const mockResponse = {
                success: true,
                data: {
                    exportId: 'export-123',
                    downloadUrl: 'https://example.com/exports/export-123.json',
                    format: 'json',
                    fileSize: 1024,
                    recordCount: 150,
                    expiresAt: '2024-02-07T23:59:59Z'
                },
                metadata: {
                    generatedAt: '2024-01-31T23:59:59Z',
                    processingTime: 500,
                    dataFreshness: '2024-01-31T22:00:00Z'
                }
            };

            const ExportResponseSchema = z.object({
                exportId: z.string(),
                downloadUrl: z.string().url(),
                format: z.string(),
                fileSize: z.number(),
                recordCount: z.number(),
                expiresAt: z.string().datetime()
            });

            expect(() => ExportResponseSchema.parse(mockResponse.data)).not.toThrow();
            expect(() => AnalyticsResponseSchema.parse(mockResponse)).not.toThrow();
        });
    });

    describe('Error handling contracts', () => {
        test('should handle authentication errors consistently', () => {
            const authErrorResponse = {
                success: false,
                error: 'Authentication failed: Invalid or expired token',
                metadata: {
                    generatedAt: '2024-01-31T23:59:59Z',
                    processingTime: 10,
                    dataFreshness: '2024-01-31T23:59:59Z'
                }
            };

            expect(() => AnalyticsResponseSchema.parse(authErrorResponse)).not.toThrow();
            expect(authErrorResponse.success).toBe(false);
            expect(authErrorResponse.error).toContain('Authentication failed');
        });

        test('should handle repository not found errors consistently', () => {
            const notFoundResponse = {
                success: false,
                error: 'Repository not found or access denied: repo-does-not-exist',
                metadata: {
                    generatedAt: '2024-01-31T23:59:59Z',
                    processingTime: 5,
                    dataFreshness: '2024-01-31T23:59:59Z'
                }
            };

            expect(() => AnalyticsResponseSchema.parse(notFoundResponse)).not.toThrow();
            expect(notFoundResponse.success).toBe(false);
            expect(notFoundResponse.error).toContain('Repository not found');
        });

        test('should handle rate limiting errors consistently', () => {
            const rateLimitResponse = {
                success: false,
                error: 'Rate limit exceeded. Try again in 60 seconds.',
                metadata: {
                    generatedAt: '2024-01-31T23:59:59Z',
                    processingTime: 1,
                    dataFreshness: '2024-01-31T23:59:59Z'
                }
            };

            expect(() => AnalyticsResponseSchema.parse(rateLimitResponse)).not.toThrow();
            expect(rateLimitResponse.success).toBe(false);
            expect(rateLimitResponse.error).toContain('Rate limit exceeded');
        });
    });

    describe('Data validation contracts', () => {
        test('should validate time ranges correctly', () => {
            const validTimeRanges = [
                { startDate: '2024-01-01T00:00:00Z', endDate: '2024-01-31T23:59:59Z' },
                { startDate: '2023-12-01T00:00:00Z', endDate: '2023-12-31T23:59:59Z' }
            ];

            const invalidTimeRanges = [
                { startDate: 'invalid-date', endDate: '2024-01-31T23:59:59Z' },
                { startDate: '2024-01-31T23:59:59Z', endDate: '2024-01-01T00:00:00Z' }, // end before start
                { startDate: '2024-01-01', endDate: '2024-01-31' } // missing time zone
            ];

            validTimeRanges.forEach(timeRange => {
                expect(() => TimeRangeSchema.parse(timeRange)).not.toThrow();
            });

            invalidTimeRanges.forEach(timeRange => {
                expect(() => TimeRangeSchema.parse(timeRange)).toThrow();
            });
        });

        test('should validate analytics filters correctly', () => {
            const validFilters = [
                { timeRange: validTimeRange },
                { repositoryIds: ['repo-1', 'repo-2'], timeRange: validTimeRange },
                { timeRange: validTimeRange, aggregationLevel: 'weekly' as const }
            ];

            validFilters.forEach(filter => {
                expect(() => AnalyticsFilterSchema.parse(filter)).not.toThrow();
            });
        });
    });
});