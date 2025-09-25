/**
 * Analytics data structures for Bitbucket repository metrics
 */

import { z } from 'zod';

// Base time range schema for filtering analytics data
export const TimeRangeSchema = z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
});

// Repository activity metrics
export const RepositoryMetricsSchema = z.object({
    repositoryId: z.string(),
    repositoryName: z.string(),
    timeRange: TimeRangeSchema,
    commitFrequency: z.object({
        totalCommits: z.number(),
        averageCommitsPerDay: z.number(),
        commitsByDay: z.array(z.object({
            date: z.string().datetime(),
            count: z.number(),
        })),
    }),
    branchActivity: z.object({
        totalBranches: z.number(),
        activeBranches: z.number(),
        branchCreationRate: z.number(),
        averageBranchLifetime: z.number(),
    }),
    codeChanges: z.object({
        totalLinesAdded: z.number(),
        totalLinesRemoved: z.number(),
        averageChangesPerCommit: z.number(),
        largestCommitSize: z.number(),
    }),
    lastUpdated: z.string().datetime(),
});

// Developer productivity metrics
export const DeveloperMetricsSchema = z.object({
    developerId: z.string(),
    developerName: z.string(),
    repositoryId: z.string().optional(),
    timeRange: TimeRangeSchema,
    commitStats: z.object({
        totalCommits: z.number(),
        averageCommitsPerDay: z.number(),
        linesOfCodeChanged: z.number(),
    }),
    pullRequestStats: z.object({
        pullRequestsCreated: z.number(),
        pullRequestsMerged: z.number(),
        averagePRSize: z.number(),
        averageTimeToMerge: z.number(), // in hours
    }),
    reviewActivity: z.object({
        reviewsCompleted: z.number(),
        averageReviewTime: z.number(), // in hours
        averageCommentsPerReview: z.number(),
    }),
    lastUpdated: z.string().datetime(),
});

// Pull request metrics
export const PullRequestMetricsSchema = z.object({
    repositoryId: z.string(),
    timeRange: TimeRangeSchema,
    creationStats: z.object({
        totalPRs: z.number(),
        averagePRsPerWeek: z.number(),
        prsByStatus: z.object({
            open: z.number(),
            merged: z.number(),
            declined: z.number(),
        }),
    }),
    mergeStats: z.object({
        averageTimeToMerge: z.number(), // in hours
        averageTimeToFirstReview: z.number(), // in hours
        averageReviewCycles: z.number(),
    }),
    sizeStats: z.object({
        averageLinesChanged: z.number(),
        averageFilesChanged: z.number(),
        largestPR: z.object({
            id: z.string(),
            linesChanged: z.number(),
        }),
    }),
    lastUpdated: z.string().datetime(),
});

// Time series data for trend analysis
export const TimeSeriesDataSchema = z.object({
    metricName: z.string(),
    repositoryId: z.string(),
    dataPoints: z.array(z.object({
        timestamp: z.string().datetime(),
        value: z.number(),
        metadata: z.record(z.string(), z.unknown()).optional(),
    })),
    aggregationPeriod: z.enum(['hourly', 'daily', 'weekly', 'monthly']),
    lastUpdated: z.string().datetime(),
});

// Project health score calculation
export const ProjectHealthScoreSchema = z.object({
    repositoryId: z.string(),
    repositoryName: z.string(),
    timeRange: TimeRangeSchema,
    overallScore: z.number().min(0).max(100),
    components: z.object({
        activityScore: z.number().min(0).max(100),
        qualityScore: z.number().min(0).max(100),
        collaborationScore: z.number().min(0).max(100),
        performanceScore: z.number().min(0).max(100),
    }),
    indicators: z.array(z.object({
        name: z.string(),
        value: z.number(),
        status: z.enum(['good', 'warning', 'critical']),
        description: z.string(),
    })),
    recommendations: z.array(z.string()),
    calculatedAt: z.string().datetime(),
});

// Analytics filter options
export const AnalyticsFilterSchema = z.object({
    repositoryIds: z.array(z.string()).optional(),
    timeRange: TimeRangeSchema,
    developerIds: z.array(z.string()).optional(),
    metricTypes: z.array(z.string()).optional(),
    aggregationLevel: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
});

// Export type definitions
export type TimeRange = z.infer<typeof TimeRangeSchema>;
export type RepositoryMetrics = z.infer<typeof RepositoryMetricsSchema>;
export type DeveloperMetrics = z.infer<typeof DeveloperMetricsSchema>;
export type PullRequestMetrics = z.infer<typeof PullRequestMetricsSchema>;
export type TimeSeriesData = z.infer<typeof TimeSeriesDataSchema>;
export type ProjectHealthScore = z.infer<typeof ProjectHealthScoreSchema>;
export type AnalyticsFilter = z.infer<typeof AnalyticsFilterSchema>;

// Analytics response wrapper
export const AnalyticsResponseSchema = z.object({
    success: z.boolean(),
    data: z.unknown(),
    error: z.string().optional(),
    metadata: z.object({
        generatedAt: z.string().datetime(),
        processingTime: z.number(),
        dataFreshness: z.string().datetime(),
    }),
});

export type AnalyticsResponse<T = unknown> = {
    success: boolean;
    data?: T;
    error?: string;
    metadata: {
        generatedAt: string;
        processingTime: number;
        dataFreshness: string;
    };
};