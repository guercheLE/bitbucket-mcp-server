/**
 * Pull Request Metrics Collector
 * 
 * Collects metrics related to pull requests including creation rate,
 * merge time, review cycles, and size statistics.
 */

import { AnalyticsResponse, PullRequestMetrics, TimeRange } from '../types';
import { AbstractCollector, CollectorConfig } from './BaseCollector';

interface PullRequestData {
    id: string;
    title: string;
    status: 'open' | 'merged' | 'declined';
    createdAt: string;
    mergedAt?: string;
    closedAt?: string;
    author: string;
    linesChanged: number;
    filesChanged: number;
    reviewCycles: number;
    timeToFirstReview?: number; // in hours
    timeToMerge?: number; // in hours
}

export class PullRequestMetricsCollector extends AbstractCollector<PullRequestMetrics> {
    constructor(config: CollectorConfig = {}) {
        super(
            'pull-request-metrics-collector',
            'Collects pull request metrics including creation rate, merge time, and review cycles',
            config
        );
    }

    async collect(repositoryId: string, timeRange: TimeRange): Promise<AnalyticsResponse<PullRequestMetrics>> {
        const startTime = Date.now();

        try {
            // Validate inputs
            if (!repositoryId || !timeRange) {
                return this.createErrorResponse('Repository ID and time range are required');
            }

            // Check if we can proceed with collection
            const isValid = await this.validate();
            if (!isValid) {
                return this.createErrorResponse('Collector validation failed - check configuration');
            }

            // Collect pull request data
            const pullRequests = await this.collectPullRequestData(repositoryId, timeRange);

            // Process metrics
            const creationStats = this.calculateCreationStats(pullRequests, timeRange);
            const mergeStats = this.calculateMergeStats(pullRequests);
            const sizeStats = this.calculateSizeStats(pullRequests);

            const metrics: PullRequestMetrics = {
                repositoryId,
                timeRange,
                creationStats,
                mergeStats,
                sizeStats,
                lastUpdated: new Date().toISOString(),
            };

            // Update collection time
            this.updateLastCollectionTime(repositoryId);

            const processingTime = Date.now() - startTime;
            return this.createSuccessResponse(metrics, processingTime);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return this.createErrorResponse(`Failed to collect pull request metrics: ${errorMessage}`);
        }
    }

    async validate(): Promise<boolean> {
        // Check if we have necessary configuration
        if (!this.config.endpoints?.apiUrl) {
            console.warn('PR metrics collector: No API URL configured, using mock data');
            return true; // Allow mock data for development
        }

        // Check authentication if provided
        if (this.config.credentials?.token) {
            try {
                // In a real implementation, we would test the API connection here
                return true;
            } catch (error) {
                console.error('PR metrics collector: Authentication validation failed', error);
                return false;
            }
        }

        return true;
    }

    /**
     * Collect pull request data from the repository
     */
    private async collectPullRequestData(repositoryId: string, timeRange: TimeRange): Promise<PullRequestData[]> {
        // Mock implementation - in real implementation, this would call Bitbucket API
        if (this.config.endpoints?.apiUrl) {
            return this.fetchPullRequestsFromAPI(repositoryId, timeRange);
        }

        // Return mock data for development
        return this.generateMockPullRequestData(repositoryId, timeRange);
    }

    /**
     * Calculate pull request creation statistics
     */
    private calculateCreationStats(pullRequests: PullRequestData[], timeRange: TimeRange) {
        const totalPRs = pullRequests.length;

        // Calculate PRs per week
        const startDate = new Date(timeRange.startDate);
        const endDate = new Date(timeRange.endDate);
        const weeksDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
        const averagePRsPerWeek = totalPRs / weeksDiff;

        // Count by status
        const prsByStatus = {
            open: pullRequests.filter(pr => pr.status === 'open').length,
            merged: pullRequests.filter(pr => pr.status === 'merged').length,
            declined: pullRequests.filter(pr => pr.status === 'declined').length,
        };

        return {
            totalPRs,
            averagePRsPerWeek: Number(averagePRsPerWeek.toFixed(2)),
            prsByStatus,
        };
    }

    /**
     * Calculate merge statistics
     */
    private calculateMergeStats(pullRequests: PullRequestData[]) {
        const mergedPRs = pullRequests.filter(pr => pr.status === 'merged' && pr.timeToMerge);

        if (mergedPRs.length === 0) {
            return {
                averageTimeToMerge: 0,
                averageTimeToFirstReview: 0,
                averageReviewCycles: 0,
            };
        }

        // Calculate average time to merge
        const totalTimeToMerge = mergedPRs.reduce((sum, pr) => sum + (pr.timeToMerge || 0), 0);
        const averageTimeToMerge = totalTimeToMerge / mergedPRs.length;

        // Calculate average time to first review
        const prsWithFirstReview = mergedPRs.filter(pr => pr.timeToFirstReview);
        const averageTimeToFirstReview = prsWithFirstReview.length > 0
            ? prsWithFirstReview.reduce((sum, pr) => sum + (pr.timeToFirstReview || 0), 0) / prsWithFirstReview.length
            : 0;

        // Calculate average review cycles
        const totalReviewCycles = mergedPRs.reduce((sum, pr) => sum + pr.reviewCycles, 0);
        const averageReviewCycles = totalReviewCycles / mergedPRs.length;

        return {
            averageTimeToMerge: Number(averageTimeToMerge.toFixed(2)),
            averageTimeToFirstReview: Number(averageTimeToFirstReview.toFixed(2)),
            averageReviewCycles: Number(averageReviewCycles.toFixed(2)),
        };
    }

    /**
     * Calculate size statistics
     */
    private calculateSizeStats(pullRequests: PullRequestData[]) {
        if (pullRequests.length === 0) {
            return {
                averageLinesChanged: 0,
                averageFilesChanged: 0,
                largestPR: {
                    id: '',
                    linesChanged: 0,
                },
            };
        }

        // Calculate average lines changed
        const totalLinesChanged = pullRequests.reduce((sum, pr) => sum + pr.linesChanged, 0);
        const averageLinesChanged = totalLinesChanged / pullRequests.length;

        // Calculate average files changed
        const totalFilesChanged = pullRequests.reduce((sum, pr) => sum + pr.filesChanged, 0);
        const averageFilesChanged = totalFilesChanged / pullRequests.length;

        // Find largest PR
        const largestPR = pullRequests.reduce((largest, current) => {
            return current.linesChanged > largest.linesChanged ? current : largest;
        });

        return {
            averageLinesChanged: Number(averageLinesChanged.toFixed(2)),
            averageFilesChanged: Number(averageFilesChanged.toFixed(2)),
            largestPR: {
                id: largestPR.id,
                linesChanged: largestPR.linesChanged,
            },
        };
    }

    /**
     * Fetch pull requests from Bitbucket API (real implementation)
     */
    private async fetchPullRequestsFromAPI(repositoryId: string, timeRange: TimeRange): Promise<PullRequestData[]> {
        // This would implement actual Bitbucket API calls
        // For now, return empty array
        return [];
    }

    /**
     * Generate mock pull request data for development
     */
    private generateMockPullRequestData(repositoryId: string, timeRange: TimeRange): PullRequestData[] {
        const mockPRs: PullRequestData[] = [];
        const startDate = new Date(timeRange.startDate);
        const endDate = new Date(timeRange.endDate);

        // Generate some mock pull requests across the time range
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const numberOfPRs = Math.floor(totalDays / 3); // Average 1 PR every 3 days

        for (let i = 0; i < numberOfPRs; i++) {
            const randomDay = Math.floor(Math.random() * totalDays);
            const createdDate = new Date(startDate.getTime() + randomDay * 24 * 60 * 60 * 1000);

            // Random status
            const statusRandom = Math.random();
            let status: 'open' | 'merged' | 'declined';
            let mergedAt: string | undefined;
            let timeToMerge: number | undefined;

            if (statusRandom < 0.7) {
                status = 'merged';
                // Merged PRs have merge time between 1-120 hours
                timeToMerge = Math.floor(Math.random() * 120) + 1;
                mergedAt = new Date(createdDate.getTime() + timeToMerge * 60 * 60 * 1000).toISOString();
            } else if (statusRandom < 0.9) {
                status = 'open';
            } else {
                status = 'declined';
            }

            const linesChanged = Math.floor(Math.random() * 500) + 10;
            const filesChanged = Math.floor(Math.random() * 15) + 1;
            const reviewCycles = Math.floor(Math.random() * 4) + 1;
            const timeToFirstReview = status === 'merged' ? Math.floor(Math.random() * 48) + 1 : undefined;

            mockPRs.push({
                id: `pr-${i + 1}`,
                title: `Feature/Fix ${i + 1}`,
                status,
                createdAt: createdDate.toISOString(),
                mergedAt,
                author: `developer-${Math.floor(Math.random() * 5) + 1}`,
                linesChanged,
                filesChanged,
                reviewCycles,
                timeToFirstReview,
                timeToMerge,
            });
        }

        return mockPRs.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }
}