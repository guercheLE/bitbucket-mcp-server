/**
 * Repository Activity Collector
 * 
 * Collects metrics related to repository activity including commit frequency,
 * branch activity, and code changes.
 */

import { AnalyticsResponse, RepositoryMetrics, TimeRange } from '../types';
import { AbstractCollector, CollectorConfig } from './BaseCollector';

interface CommitData {
    id: string;
    date: string;
    linesAdded: number;
    linesRemoved: number;
    author: string;
    branch: string;
}

interface BranchData {
    name: string;
    createdAt: string;
    lastCommitAt: string;
    isActive: boolean;
    commitCount: number;
}

export class RepositoryActivityCollector extends AbstractCollector<RepositoryMetrics> {
    constructor(config: CollectorConfig = {}) {
        super(
            'repository-activity-collector',
            'Collects repository activity metrics including commits, branches, and code changes',
            config
        );
    }

    async collect(repositoryId: string, timeRange: TimeRange): Promise<AnalyticsResponse<RepositoryMetrics>> {
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

            // Collect commit data
            const commits = await this.collectCommitData(repositoryId, timeRange);
            const branches = await this.collectBranchData(repositoryId, timeRange);
            const repositoryName = await this.getRepositoryName(repositoryId);

            // Process commit frequency metrics
            const commitFrequency = this.calculateCommitFrequency(commits, timeRange);

            // Process branch activity metrics
            const branchActivity = this.calculateBranchActivity(branches, timeRange);

            // Process code change metrics
            const codeChanges = this.calculateCodeChanges(commits);

            const metrics: RepositoryMetrics = {
                repositoryId,
                repositoryName,
                timeRange,
                commitFrequency,
                branchActivity,
                codeChanges,
                lastUpdated: new Date().toISOString(),
            };

            // Update collection time
            this.updateLastCollectionTime(repositoryId);

            const processingTime = Date.now() - startTime;
            return this.createSuccessResponse(metrics, processingTime);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return this.createErrorResponse(`Failed to collect repository activity: ${errorMessage}`);
        }
    }

    async validate(): Promise<boolean> {
        // Check if we have necessary configuration
        if (!this.config.endpoints?.apiUrl) {
            console.warn('Repository collector: No API URL configured, using mock data');
            return true; // Allow mock data for development
        }

        // Check authentication if provided
        if (this.config.credentials?.token) {
            try {
                // In a real implementation, we would test the API connection here
                // For now, we'll assume it's valid
                return true;
            } catch (error) {
                console.error('Repository collector: Authentication validation failed', error);
                return false;
            }
        }

        return true;
    }

    /**
     * Collect commit data from the repository
     * In a real implementation, this would call the Bitbucket API
     */
    private async collectCommitData(repositoryId: string, timeRange: TimeRange): Promise<CommitData[]> {
        // Mock implementation - in real implementation, this would call Bitbucket API
        if (this.config.endpoints?.apiUrl) {
            return this.fetchCommitsFromAPI(repositoryId, timeRange);
        }

        // Return mock data for development
        return this.generateMockCommitData(repositoryId, timeRange);
    }

    /**
     * Collect branch data from the repository
     */
    private async collectBranchData(repositoryId: string, timeRange: TimeRange): Promise<BranchData[]> {
        // Mock implementation - in real implementation, this would call Bitbucket API
        if (this.config.endpoints?.apiUrl) {
            return this.fetchBranchesFromAPI(repositoryId, timeRange);
        }

        // Return mock data for development
        return this.generateMockBranchData(repositoryId, timeRange);
    }

    /**
     * Get repository name - in real implementation would fetch from API
     */
    private async getRepositoryName(repositoryId: string): Promise<string> {
        return `Repository ${repositoryId}`;
    }

    /**
     * Calculate commit frequency metrics
     */
    private calculateCommitFrequency(commits: CommitData[], timeRange: TimeRange) {
        const totalCommits = commits.length;

        // Calculate average commits per day
        const startDate = new Date(timeRange.startDate);
        const endDate = new Date(timeRange.endDate);
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const averageCommitsPerDay = totalCommits / daysDiff;

        // Group commits by day
        const commitsByDay = commits.reduce((acc, commit) => {
            const date = new Date(commit.date).toISOString().split('T')[0] + 'T00:00:00Z';
            const existing = acc.find(item => item.date === date);
            if (existing) {
                existing.count++;
            } else {
                acc.push({ date, count: 1 });
            }
            return acc;
        }, [] as Array<{ date: string; count: number }>);

        return {
            totalCommits,
            averageCommitsPerDay: Number(averageCommitsPerDay.toFixed(2)),
            commitsByDay: commitsByDay.sort((a, b) => a.date.localeCompare(b.date)),
        };
    }

    /**
     * Calculate branch activity metrics
     */
    private calculateBranchActivity(branches: BranchData[], timeRange: TimeRange) {
        const totalBranches = branches.length;
        const activeBranches = branches.filter(b => b.isActive).length;

        // Calculate branch creation rate (branches per day)
        const startDate = new Date(timeRange.startDate);
        const endDate = new Date(timeRange.endDate);
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const branchCreationRate = totalBranches / daysDiff;

        // Calculate average branch lifetime
        const branchLifetimes = branches
            .filter(b => !b.isActive)
            .map(b => {
                const created = new Date(b.createdAt).getTime();
                const lastCommit = new Date(b.lastCommitAt).getTime();
                return (lastCommit - created) / (1000 * 60 * 60 * 24); // days
            });

        const averageBranchLifetime = branchLifetimes.length > 0
            ? branchLifetimes.reduce((a, b) => a + b, 0) / branchLifetimes.length
            : 0;

        return {
            totalBranches,
            activeBranches,
            branchCreationRate: Number(branchCreationRate.toFixed(2)),
            averageBranchLifetime: Number(averageBranchLifetime.toFixed(2)),
        };
    }

    /**
     * Calculate code change metrics
     */
    private calculateCodeChanges(commits: CommitData[]) {
        const totalLinesAdded = commits.reduce((sum, commit) => sum + commit.linesAdded, 0);
        const totalLinesRemoved = commits.reduce((sum, commit) => sum + commit.linesRemoved, 0);

        const averageChangesPerCommit = commits.length > 0
            ? (totalLinesAdded + totalLinesRemoved) / commits.length
            : 0;

        const largestCommitSize = Math.max(...commits.map(c => c.linesAdded + c.linesRemoved), 0);

        return {
            totalLinesAdded,
            totalLinesRemoved,
            averageChangesPerCommit: Number(averageChangesPerCommit.toFixed(2)),
            largestCommitSize,
        };
    }

    /**
     * Fetch commits from Bitbucket API (real implementation)
     */
    private async fetchCommitsFromAPI(repositoryId: string, timeRange: TimeRange): Promise<CommitData[]> {
        // This would implement actual Bitbucket API calls
        // For now, return empty array
        return [];
    }

    /**
     * Fetch branches from Bitbucket API (real implementation)
     */
    private async fetchBranchesFromAPI(repositoryId: string, timeRange: TimeRange): Promise<BranchData[]> {
        // This would implement actual Bitbucket API calls
        // For now, return empty array
        return [];
    }

    /**
     * Generate mock commit data for development
     */
    private generateMockCommitData(repositoryId: string, timeRange: TimeRange): CommitData[] {
        const mockCommits: CommitData[] = [];
        const startDate = new Date(timeRange.startDate);
        const endDate = new Date(timeRange.endDate);

        // Generate some mock commits across the time range
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const numberOfCommits = Math.floor(totalDays * 0.8); // Average less than 1 commit per day

        for (let i = 0; i < numberOfCommits; i++) {
            const randomDay = Math.floor(Math.random() * totalDays);
            const commitDate = new Date(startDate.getTime() + randomDay * 24 * 60 * 60 * 1000);

            mockCommits.push({
                id: `commit-${i + 1}`,
                date: commitDate.toISOString(),
                linesAdded: Math.floor(Math.random() * 100) + 1,
                linesRemoved: Math.floor(Math.random() * 50),
                author: `developer-${Math.floor(Math.random() * 5) + 1}`,
                branch: Math.random() > 0.7 ? 'feature-branch' : 'main',
            });
        }

        return mockCommits.sort((a, b) => a.date.localeCompare(b.date));
    }

    /**
     * Generate mock branch data for development
     */
    private generateMockBranchData(repositoryId: string, timeRange: TimeRange): BranchData[] {
        const startDate = new Date(timeRange.startDate);
        const endDate = new Date(timeRange.endDate);

        return [
            {
                name: 'main',
                createdAt: new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                lastCommitAt: endDate.toISOString(),
                isActive: true,
                commitCount: 45,
            },
            {
                name: 'feature/analytics-dashboard',
                createdAt: startDate.toISOString(),
                lastCommitAt: new Date(endDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                isActive: true,
                commitCount: 12,
            },
            {
                name: 'bugfix/memory-leak',
                createdAt: new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                lastCommitAt: new Date(startDate.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString(),
                isActive: false,
                commitCount: 3,
            },
        ];
    }
}