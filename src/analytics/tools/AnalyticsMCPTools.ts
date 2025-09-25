/**
 * Analytics MCP Tools
 * 
 * Implements MCP tools for analytics operations including repository analytics,
 * developer metrics, and data export functionality.
 */

import { z } from 'zod';
import {
    AggregatedAnalytics,
    AnalyticsAggregationService
} from '../aggregators/AnalyticsAggregationService';
import {
    AnalyticsFilterSchema,
    AnalyticsResponse,
    TimeRangeSchema
} from '../types';

// MCP Tool parameter schemas
const GetRepositoryAnalyticsSchema = z.object({
    repositoryId: z.string().min(1, 'Repository ID is required'),
    timeRange: TimeRangeSchema,
    includeMetrics: z.array(z.string()).optional().default(['all']),
});

const GetDeveloperMetricsSchema = z.object({
    developerId: z.string().min(1, 'Developer ID is required'),
    repositoryId: z.string().optional(),
    timeRange: TimeRangeSchema,
    includeMetrics: z.array(z.string()).optional().default(['all']),
});

const CompareRepositoriesSchema = z.object({
    repositoryIds: z.array(z.string()).min(2, 'At least two repositories required for comparison'),
    timeRange: TimeRangeSchema,
    comparisonMetrics: z.array(z.string()).optional().default(['all']),
});

const ExportAnalyticsDataSchema = z.object({
    filter: AnalyticsFilterSchema,
    format: z.enum(['json', 'csv', 'xlsx']).default('json'),
    includeRawData: z.boolean().default(false),
});

const GetTimeSeriesDataSchema = z.object({
    repositoryId: z.string().min(1, 'Repository ID is required'),
    metricNames: z.array(z.string()).min(1, 'At least one metric name is required'),
    timeRange: TimeRangeSchema,
    aggregationLevel: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
});

export class AnalyticsMCPTools {
    private aggregationService: AnalyticsAggregationService;

    constructor() {
        // Initialize with default configuration
        // In a real implementation, this would come from the MCP server configuration
        this.aggregationService = new AnalyticsAggregationService({
            cache: { enabled: true, ttlMinutes: 30 },
            rateLimit: { requestsPerMinute: 60, burstLimit: 10 },
        });
    }

    /**
     * Get comprehensive repository analytics
     * 
     * MCP Tool: get-repository-analytics
     */
    async getRepositoryAnalytics(params: unknown): Promise<AnalyticsResponse<AggregatedAnalytics>> {
        try {
            // Validate parameters
            const validatedParams = GetRepositoryAnalyticsSchema.parse(params);

            // Create analytics filter
            const filter = {
                repositoryIds: [validatedParams.repositoryId],
                timeRange: validatedParams.timeRange,
                aggregationLevel: 'daily' as const,
            };

            // Get aggregated analytics
            const result = await this.aggregationService.aggregateRepositoryAnalytics(
                validatedParams.repositoryId,
                filter
            );

            return result;

        } catch (error) {
            if (error instanceof z.ZodError) {
                return this.createErrorResponse('Invalid parameters: ' + error.issues.map((e: any) => e.message).join(', '));
            }

            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return this.createErrorResponse(`Repository analytics failed: ${errorMessage}`);
        }
    }

    /**
     * Get developer productivity metrics
     * 
     * MCP Tool: get-developer-metrics
     */
    async getDeveloperMetrics(params: unknown): Promise<AnalyticsResponse<any>> {
        try {
            // Validate parameters
            const validatedParams = GetDeveloperMetricsSchema.parse(params);

            // For now, return a mock response as we haven't implemented developer-specific collectors
            // In a real implementation, this would use a DeveloperMetricsCollector
            const mockDeveloperMetrics = {
                developerId: validatedParams.developerId,
                developerName: `Developer ${validatedParams.developerId}`,
                repositoryId: validatedParams.repositoryId,
                timeRange: validatedParams.timeRange,
                commitStats: {
                    totalCommits: 45,
                    averageCommitsPerDay: 1.5,
                    linesOfCodeChanged: 2500,
                },
                pullRequestStats: {
                    pullRequestsCreated: 12,
                    pullRequestsMerged: 10,
                    averagePRSize: 125,
                    averageTimeToMerge: 48.5,
                },
                reviewActivity: {
                    reviewsCompleted: 8,
                    averageReviewTime: 2.5,
                    averageCommentsPerReview: 3.2,
                },
                lastUpdated: new Date().toISOString(),
            };

            return this.createSuccessResponse(mockDeveloperMetrics, 50);

        } catch (error) {
            if (error instanceof z.ZodError) {
                return this.createErrorResponse('Invalid parameters: ' + error.issues.map((e: any) => e.message).join(', '));
            }

            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return this.createErrorResponse(`Developer metrics failed: ${errorMessage}`);
        }
    }

    /**
     * Compare analytics across multiple repositories
     * 
     * MCP Tool: compare-repositories
     */
    async compareRepositories(params: unknown): Promise<AnalyticsResponse<{ [repositoryId: string]: AggregatedAnalytics }>> {
        try {
            // Validate parameters
            const validatedParams = CompareRepositoriesSchema.parse(params);

            // Create analytics filter
            const filter = {
                repositoryIds: validatedParams.repositoryIds,
                timeRange: validatedParams.timeRange,
                aggregationLevel: 'daily' as const,
            };

            // Compare repositories
            const result = await this.aggregationService.compareRepositories(
                validatedParams.repositoryIds,
                filter
            );

            return result;

        } catch (error) {
            if (error instanceof z.ZodError) {
                return this.createErrorResponse('Invalid parameters: ' + error.issues.map((e: any) => e.message).join(', '));
            }

            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return this.createErrorResponse(`Repository comparison failed: ${errorMessage}`);
        }
    }

    /**
     * Export analytics data in various formats
     * 
     * MCP Tool: export-analytics-data
     */
    async exportAnalyticsData(params: unknown): Promise<AnalyticsResponse<any>> {
        try {
            // Validate parameters
            const validatedParams = ExportAnalyticsDataSchema.parse(params);

            // For simplicity, we'll create a mock export response
            // In a real implementation, this would generate actual files and upload them
            const exportResult = {
                exportId: `export-${Date.now()}`,
                downloadUrl: `https://api.example.com/exports/analytics-${Date.now()}.${validatedParams.format}`,
                format: validatedParams.format,
                fileSize: Math.floor(Math.random() * 1024 * 1024) + 1024, // Mock file size
                recordCount: Math.floor(Math.random() * 1000) + 100,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
                filter: validatedParams.filter,
                includeRawData: validatedParams.includeRawData,
            };

            return this.createSuccessResponse(exportResult, 200);

        } catch (error) {
            if (error instanceof z.ZodError) {
                return this.createErrorResponse('Invalid parameters: ' + error.issues.map((e: any) => e.message).join(', '));
            }

            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return this.createErrorResponse(`Analytics export failed: ${errorMessage}`);
        }
    }

    /**
     * Get time series data for trending analysis
     * 
     * MCP Tool: get-time-series-data
     */
    async getTimeSeriesData(params: unknown): Promise<AnalyticsResponse<any>> {
        try {
            // Validate parameters
            const validatedParams = GetTimeSeriesDataSchema.parse(params);

            // Get time series data
            const result = await this.aggregationService.getTimeSeriesData(
                validatedParams.repositoryId,
                validatedParams.metricNames,
                validatedParams.timeRange,
                validatedParams.aggregationLevel
            );

            return result;

        } catch (error) {
            if (error instanceof z.ZodError) {
                return this.createErrorResponse('Invalid parameters: ' + error.issues.map((e: any) => e.message).join(', '));
            }

            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return this.createErrorResponse(`Time series data retrieval failed: ${errorMessage}`);
        }
    }

    /**
     * Get available analytics metrics and their descriptions
     * 
     * MCP Tool: get-available-metrics
     */
    async getAvailableMetrics(): Promise<AnalyticsResponse<any>> {
        const availableMetrics = {
            repository: {
                commit_frequency: {
                    name: 'Commit Frequency',
                    description: 'Number of commits over time',
                    aggregations: ['daily', 'weekly', 'monthly'],
                },
                branch_activity: {
                    name: 'Branch Activity',
                    description: 'Branch creation and activity metrics',
                    aggregations: ['daily', 'weekly', 'monthly'],
                },
                code_changes: {
                    name: 'Code Changes',
                    description: 'Lines added/removed and commit size metrics',
                    aggregations: ['daily', 'weekly', 'monthly'],
                },
            },
            pullRequests: {
                pr_creation_rate: {
                    name: 'PR Creation Rate',
                    description: 'Pull request creation frequency',
                    aggregations: ['daily', 'weekly', 'monthly'],
                },
                merge_statistics: {
                    name: 'Merge Statistics',
                    description: 'PR merge time and review cycle metrics',
                    aggregations: ['daily', 'weekly', 'monthly'],
                },
                size_statistics: {
                    name: 'Size Statistics',
                    description: 'PR size and complexity metrics',
                    aggregations: ['daily', 'weekly', 'monthly'],
                },
            },
            health: {
                project_health_score: {
                    name: 'Project Health Score',
                    description: 'Composite score indicating overall project health',
                    aggregations: ['daily', 'weekly', 'monthly'],
                },
            },
        };

        return this.createSuccessResponse(availableMetrics, 5);
    }

    /**
     * Create standardized error response
     */
    private createErrorResponse(error: string): AnalyticsResponse<any> {
        return {
            success: false,
            error,
            metadata: {
                generatedAt: new Date().toISOString(),
                processingTime: 0,
                dataFreshness: new Date().toISOString(),
            },
        };
    }

    /**
     * Create standardized success response
     */
    private createSuccessResponse<T>(data: T, processingTime: number): AnalyticsResponse<T> {
        return {
            success: true,
            data,
            metadata: {
                generatedAt: new Date().toISOString(),
                processingTime,
                dataFreshness: new Date().toISOString(),
            },
        };
    }
}

// Export tool definitions for MCP server registration
export const ANALYTICS_TOOLS = {
    'get-repository-analytics': {
        description: 'Get comprehensive analytics for a repository including commit frequency, branch activity, and code changes',
        inputSchema: GetRepositoryAnalyticsSchema,
    },
    'get-developer-metrics': {
        description: 'Get developer productivity metrics including commits, pull requests, and review activity',
        inputSchema: GetDeveloperMetricsSchema,
    },
    'compare-repositories': {
        description: 'Compare analytics metrics across multiple repositories',
        inputSchema: CompareRepositoriesSchema,
    },
    'export-analytics-data': {
        description: 'Export analytics data in various formats (JSON, CSV, XLSX)',
        inputSchema: ExportAnalyticsDataSchema,
    },
    'get-time-series-data': {
        description: 'Get time series data for trending analysis of specific metrics',
        inputSchema: GetTimeSeriesDataSchema,
    },
    'get-available-metrics': {
        description: 'Get list of available analytics metrics and their descriptions',
        inputSchema: z.object({}),
    },
};