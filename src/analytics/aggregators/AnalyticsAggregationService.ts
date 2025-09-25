/**
 * Analytics Aggregation Service
 * 
 * Aggregates data from multiple collectors and provides unified analytics
 * with filtering, comparison, and health scoring capabilities.
 */

import { CollectorConfig } from '../collectors/BaseCollector';
import { PullRequestMetricsCollector } from '../collectors/PullRequestMetricsCollector';
import { RepositoryActivityCollector } from '../collectors/RepositoryActivityCollector';
import {
    AnalyticsFilter,
    AnalyticsResponse,
    DeveloperMetrics,
    ProjectHealthScore,
    PullRequestMetrics,
    RepositoryMetrics,
    TimeRange,
    TimeSeriesData,
} from '../types';

export interface AggregatedAnalytics {
    repositoryMetrics: RepositoryMetrics;
    pullRequestMetrics: PullRequestMetrics;
    developerMetrics?: DeveloperMetrics[];
    projectHealthScore: ProjectHealthScore;
    timeSeriesData: TimeSeriesData[];
}

export class AnalyticsAggregationService {
    private repositoryCollector: RepositoryActivityCollector;
    private pullRequestCollector: PullRequestMetricsCollector;

    constructor(config: CollectorConfig = {}) {
        this.repositoryCollector = new RepositoryActivityCollector(config);
        this.pullRequestCollector = new PullRequestMetricsCollector(config);
    }

    /**
     * Aggregate analytics data for a repository
     */
    async aggregateRepositoryAnalytics(
        repositoryId: string,
        filter: AnalyticsFilter
    ): Promise<AnalyticsResponse<AggregatedAnalytics>> {
        const startTime = Date.now();

        try {
            // Validate input
            if (!repositoryId) {
                return this.createErrorResponse('Repository ID is required');
            }

            // Collect data from all collectors in parallel
            const [repositoryResult, pullRequestResult] = await Promise.all([
                this.repositoryCollector.collect(repositoryId, filter.timeRange),
                this.pullRequestCollector.collect(repositoryId, filter.timeRange),
            ]);

            // Check for collection errors
            if (!repositoryResult.success) {
                return this.createErrorResponse(`Repository metrics collection failed: ${repositoryResult.error}`);
            }

            if (!pullRequestResult.success) {
                return this.createErrorResponse(`Pull request metrics collection failed: ${pullRequestResult.error}`);
            }

            // Create aggregated data
            const repositoryMetrics = repositoryResult.data!;
            const pullRequestMetrics = pullRequestResult.data!;

            // Calculate project health score
            const projectHealthScore = this.calculateProjectHealthScore(
                repositoryMetrics,
                pullRequestMetrics,
                filter.timeRange
            );

            // Generate time series data
            const timeSeriesData = this.generateTimeSeriesData(
                repositoryMetrics,
                pullRequestMetrics,
                filter
            );

            const aggregatedData: AggregatedAnalytics = {
                repositoryMetrics,
                pullRequestMetrics,
                projectHealthScore,
                timeSeriesData,
            };

            const processingTime = Date.now() - startTime;
            return this.createSuccessResponse(aggregatedData, processingTime);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return this.createErrorResponse(`Aggregation failed: ${errorMessage}`);
        }
    }

    /**
     * Compare metrics across multiple repositories
     */
    async compareRepositories(
        repositoryIds: string[],
        filter: AnalyticsFilter
    ): Promise<AnalyticsResponse<{ [repositoryId: string]: AggregatedAnalytics }>> {
        const startTime = Date.now();

        try {
            if (!repositoryIds || repositoryIds.length === 0) {
                return this.createErrorResponse('At least one repository ID is required');
            }

            // Collect data for all repositories
            const results = await Promise.all(
                repositoryIds.map(repositoryId =>
                    this.aggregateRepositoryAnalytics(repositoryId, filter)
                )
            );

            // Check for any failures
            const failedResults = results.filter(result => !result.success);
            if (failedResults.length > 0) {
                const errors = failedResults.map(result => result.error).join('; ');
                return this.createErrorResponse(`Some repositories failed to aggregate: ${errors}`);
            }

            // Create comparison data
            const comparisonData: { [repositoryId: string]: AggregatedAnalytics } = {};
            repositoryIds.forEach((repositoryId, index) => {
                comparisonData[repositoryId] = results[index].data!;
            });

            const processingTime = Date.now() - startTime;
            return this.createSuccessResponse(comparisonData, processingTime);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return this.createErrorResponse(`Repository comparison failed: ${errorMessage}`);
        }
    }

    /**
     * Get time series data for trending analysis
     */
    async getTimeSeriesData(
        repositoryId: string,
        metricNames: string[],
        timeRange: TimeRange,
        aggregationLevel: 'daily' | 'weekly' | 'monthly' = 'daily'
    ): Promise<AnalyticsResponse<TimeSeriesData[]>> {
        const startTime = Date.now();

        try {
            // First get the current aggregated data
            const filter: AnalyticsFilter = { timeRange, aggregationLevel };
            const analyticsResult = await this.aggregateRepositoryAnalytics(repositoryId, filter);

            if (!analyticsResult.success) {
                return this.createErrorResponse(`Failed to get analytics data: ${analyticsResult.error}`);
            }

            // Extract time series data for requested metrics
            const timeSeriesData = analyticsResult.data!.timeSeriesData.filter(
                series => metricNames.includes(series.metricName)
            );

            const processingTime = Date.now() - startTime;
            return this.createSuccessResponse(timeSeriesData, processingTime);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return this.createErrorResponse(`Time series data collection failed: ${errorMessage}`);
        }
    }

    /**
     * Calculate project health score based on various metrics
     */
    private calculateProjectHealthScore(
        repositoryMetrics: RepositoryMetrics,
        pullRequestMetrics: PullRequestMetrics,
        timeRange: TimeRange
    ): ProjectHealthScore {
        // Activity Score (based on commit frequency and PR activity)
        const maxCommitsPerDay = 10; // Define reasonable maximums
        const maxPRsPerWeek = 20;

        const activityScore = Math.min(100,
            (repositoryMetrics.commitFrequency.averageCommitsPerDay / maxCommitsPerDay * 50) +
            (pullRequestMetrics.creationStats.averagePRsPerWeek / maxPRsPerWeek * 50)
        );

        // Quality Score (based on PR merge rate and review cycles)
        const mergeRate = pullRequestMetrics.creationStats.totalPRs > 0
            ? (pullRequestMetrics.creationStats.prsByStatus.merged / pullRequestMetrics.creationStats.totalPRs) * 100
            : 50;

        const reviewQuality = pullRequestMetrics.mergeStats.averageReviewCycles > 0
            ? Math.min(100, pullRequestMetrics.mergeStats.averageReviewCycles * 25)
            : 50;

        const qualityScore = (mergeRate + reviewQuality) / 2;

        // Collaboration Score (based on branch activity and PR review time)
        const branchCollaboration = repositoryMetrics.branchActivity.activeBranches > 1 ? 100 : 50;
        const reviewTimeliness = pullRequestMetrics.mergeStats.averageTimeToFirstReview > 0
            ? Math.max(0, 100 - (pullRequestMetrics.mergeStats.averageTimeToFirstReview / 24) * 10) // Penalty for slow reviews
            : 50;

        const collaborationScore = (branchCollaboration + reviewTimeliness) / 2;

        // Performance Score (based on PR merge time and commit size)
        const mergeSpeed = pullRequestMetrics.mergeStats.averageTimeToMerge > 0
            ? Math.max(0, 100 - (pullRequestMetrics.mergeStats.averageTimeToMerge / 168) * 100) // Penalty for PRs taking more than a week
            : 50;

        const commitSize = repositoryMetrics.codeChanges.averageChangesPerCommit > 0
            ? Math.max(0, 100 - Math.max(0, repositoryMetrics.codeChanges.averageChangesPerCommit - 100) / 10)
            : 50;

        const performanceScore = (mergeSpeed + commitSize) / 2;

        // Overall score
        const overallScore = (activityScore + qualityScore + collaborationScore + performanceScore) / 4;

        // Generate indicators and recommendations
        const indicators = this.generateHealthIndicators(repositoryMetrics, pullRequestMetrics);
        const recommendations = this.generateRecommendations(indicators);

        return {
            repositoryId: repositoryMetrics.repositoryId,
            repositoryName: repositoryMetrics.repositoryName,
            timeRange,
            overallScore: Number(overallScore.toFixed(1)),
            components: {
                activityScore: Number(activityScore.toFixed(1)),
                qualityScore: Number(qualityScore.toFixed(1)),
                collaborationScore: Number(collaborationScore.toFixed(1)),
                performanceScore: Number(performanceScore.toFixed(1)),
            },
            indicators,
            recommendations,
            calculatedAt: new Date().toISOString(),
        };
    }

    /**
     * Generate health indicators
     */
    private generateHealthIndicators(
        repositoryMetrics: RepositoryMetrics,
        pullRequestMetrics: PullRequestMetrics
    ): Array<{ name: string; value: number; status: 'good' | 'warning' | 'critical'; description: string }> {
        const indicators = [];

        // Commit frequency indicator
        const commitsPerDay = repositoryMetrics.commitFrequency.averageCommitsPerDay;
        indicators.push({
            name: 'Commit Frequency',
            value: commitsPerDay,
            status: (commitsPerDay > 1 ? 'good' : commitsPerDay > 0.5 ? 'warning' : 'critical') as 'good' | 'warning' | 'critical',
            description: `${commitsPerDay.toFixed(1)} commits per day on average`,
        });

        // PR merge rate indicator
        const mergeRate = pullRequestMetrics.creationStats.totalPRs > 0
            ? (pullRequestMetrics.creationStats.prsByStatus.merged / pullRequestMetrics.creationStats.totalPRs) * 100
            : 0;
        indicators.push({
            name: 'PR Merge Rate',
            value: mergeRate,
            status: (mergeRate > 80 ? 'good' : mergeRate > 60 ? 'warning' : 'critical') as 'good' | 'warning' | 'critical',
            description: `${mergeRate.toFixed(1)}% of pull requests are merged`,
        });

        // Review time indicator
        const reviewTime = pullRequestMetrics.mergeStats.averageTimeToFirstReview;
        indicators.push({
            name: 'Review Response Time',
            value: reviewTime,
            status: (reviewTime < 24 ? 'good' : reviewTime < 72 ? 'warning' : 'critical') as 'good' | 'warning' | 'critical',
            description: `${reviewTime.toFixed(1)} hours average time to first review`,
        });

        return indicators;
    }

    /**
     * Generate recommendations based on indicators
     */
    private generateRecommendations(indicators: any[]): string[] {
        const recommendations = [];

        const commitIndicator = indicators.find(i => i.name === 'Commit Frequency');
        if (commitIndicator?.status === 'critical') {
            recommendations.push('Consider increasing commit frequency - aim for smaller, more frequent commits');
        }

        const mergeRateIndicator = indicators.find(i => i.name === 'PR Merge Rate');
        if (mergeRateIndicator?.status === 'critical') {
            recommendations.push('Review PR quality and approval processes - low merge rate may indicate issues');
        }

        const reviewTimeIndicator = indicators.find(i => i.name === 'Review Response Time');
        if (reviewTimeIndicator?.status === 'critical') {
            recommendations.push('Improve code review processes - consider setting up automated reminders or dedicated review time');
        }

        if (recommendations.length === 0) {
            recommendations.push('Keep up the good work! All key metrics are performing well.');
        }

        return recommendations;
    }

    /**
     * Generate time series data for trending
     */
    private generateTimeSeriesData(
        repositoryMetrics: RepositoryMetrics,
        pullRequestMetrics: PullRequestMetrics,
        filter: AnalyticsFilter
    ): TimeSeriesData[] {
        const timeSeriesData: TimeSeriesData[] = [];

        // Commit frequency time series
        timeSeriesData.push({
            metricName: 'commit_frequency',
            repositoryId: repositoryMetrics.repositoryId,
            dataPoints: repositoryMetrics.commitFrequency.commitsByDay.map(day => ({
                timestamp: day.date,
                value: day.count,
            })),
            aggregationPeriod: 'daily',
            lastUpdated: new Date().toISOString(),
        });

        // If we had more detailed data, we could create additional time series
        // For now, we'll create mock trending data
        const startDate = new Date(filter.timeRange.startDate);
        const endDate = new Date(filter.timeRange.endDate);
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        // PR creation trend
        const prDataPoints = [];
        for (let i = 0; i < days; i += 7) { // Weekly data points
            const pointDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
            prDataPoints.push({
                timestamp: pointDate.toISOString(),
                value: Math.floor(Math.random() * 5) + 1, // Mock data
            });
        }

        timeSeriesData.push({
            metricName: 'pr_creation_rate',
            repositoryId: repositoryMetrics.repositoryId,
            dataPoints: prDataPoints,
            aggregationPeriod: 'weekly',
            lastUpdated: new Date().toISOString(),
        });

        return timeSeriesData;
    }

    /**
     * Create standardized error response
     */
    private createErrorResponse<T>(error: string): AnalyticsResponse<T> {
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