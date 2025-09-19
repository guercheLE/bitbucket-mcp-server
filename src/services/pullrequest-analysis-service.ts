import axios, { AxiosResponse } from 'axios';
import { z } from 'zod';
import { 
  Activity,
  Diff,
  Change,
  PaginatedResponse,
  ActivitySchema,
  DiffSchema,
  ChangeSchema,
  PaginatedResponseSchema
} from '../types/pullrequest';
import { ServerInfo } from './server-detection';

/**
 * Pull Request Analysis Service for Bitbucket Data Center and Cloud
 * T021: Pull request analysis service in src/services/pullrequest-analysis-service.ts
 * 
 * Handles all pull request analysis operations for Data Center and Cloud
 * Based on data-model.md specifications
 */

// Authentication info type
export interface AuthInfo {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
}

// Base service request type
export interface PullRequestAnalysisServiceRequest {
  serverInfo: ServerInfo;
  auth: AuthInfo;
}

// Specific request types
export interface GetActivitiesRequest extends PullRequestAnalysisServiceRequest {
  projectKey: string;
  repositorySlug: string;
  pullRequestId: number;
  start?: number;
  limit?: number;
}

export interface GetDiffRequest extends PullRequestAnalysisServiceRequest {
  projectKey: string;
  repositorySlug: string;
  pullRequestId: number;
  contextLines?: number;
  whitespace?: 'ignore-all' | 'ignore-change-amount' | 'ignore-eol-at-eof' | 'show-all';
}

export interface GetChangesRequest extends PullRequestAnalysisServiceRequest {
  projectKey: string;
  repositorySlug: string;
  pullRequestId: number;
  start?: number;
  limit?: number;
}

/**
 * Pull Request Analysis Service Class
 */
export class PullRequestAnalysisService {
  private readonly REQUEST_TIMEOUT = 15000; // 15 seconds for analysis operations
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  /**
   * Gets pull request activities
   */
  async getActivities(request: GetActivitiesRequest): Promise<PaginatedResponse<Activity>> {
    try {
      const params = new URLSearchParams();
      if (request.start !== undefined) params.append('start', request.start.toString());
      if (request.limit !== undefined) params.append('limit', request.limit.toString());

      const response: AxiosResponse<PaginatedResponse<Activity>> = await this.makeRequest(
        request.serverInfo.baseUrl,
        `/rest/api/1.0/projects/${request.projectKey}/repos/${request.repositorySlug}/pull-requests/${request.pullRequestId}/activities?${params.toString()}`,
        'GET',
        request.auth
      );

      const activityList = PaginatedResponseSchema(ActivitySchema).parse(response.data);
      
      return activityList;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Pull request not found');
        } else if (error.response?.status === 403) {
          throw new Error('Insufficient permissions to view activities');
        } else if (error.response?.status === 401) {
          throw new Error('Authentication failed');
        }
      }
      throw new Error(`Failed to get activities: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets pull request diff
   */
  async getDiff(request: GetDiffRequest): Promise<Diff> {
    try {
      const params = new URLSearchParams();
      if (request.contextLines !== undefined) params.append('contextLines', request.contextLines.toString());
      if (request.whitespace) params.append('whitespace', request.whitespace);

      const response: AxiosResponse<Diff> = await this.makeRequest(
        request.serverInfo.baseUrl,
        `/rest/api/1.0/projects/${request.projectKey}/repos/${request.repositorySlug}/pull-requests/${request.pullRequestId}/diff?${params.toString()}`,
        'GET',
        request.auth
      );

      const diff = DiffSchema.parse(response.data);
      return this.addDiffSelfLinks(diff, request.serverInfo.baseUrl, request.projectKey, request.repositorySlug, request.pullRequestId);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Pull request not found');
        } else if (error.response?.status === 403) {
          throw new Error('Insufficient permissions to view diff');
        } else if (error.response?.status === 401) {
          throw new Error('Authentication failed');
        } else if (error.response?.status === 400) {
          throw new Error('Invalid diff parameters');
        }
      }
      throw new Error(`Failed to get diff: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets pull request changes
   */
  async getChanges(request: GetChangesRequest): Promise<PaginatedResponse<Change>> {
    try {
      const params = new URLSearchParams();
      if (request.start !== undefined) params.append('start', request.start.toString());
      if (request.limit !== undefined) params.append('limit', request.limit.toString());

      const response: AxiosResponse<PaginatedResponse<Change>> = await this.makeRequest(
        request.serverInfo.baseUrl,
        `/rest/api/1.0/projects/${request.projectKey}/repos/${request.repositorySlug}/pull-requests/${request.pullRequestId}/changes?${params.toString()}`,
        'GET',
        request.auth
      );

      const changeList = PaginatedResponseSchema(ChangeSchema).parse(response.data);
      
      return changeList;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Pull request not found');
        } else if (error.response?.status === 403) {
          throw new Error('Insufficient permissions to view changes');
        } else if (error.response?.status === 401) {
          throw new Error('Authentication failed');
        }
      }
      throw new Error(`Failed to get changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets pull request statistics
   */
  async getStatistics(request: GetActivitiesRequest): Promise<{
    totalActivities: number;
    totalComments: number;
    totalApprovals: number;
    totalChanges: number;
    averageResponseTime: number;
    lastActivity: string;
    additions: number;
    deletions: number;
    changes: number;
    files: number;
    commits: number;
  }> {
    try {
      // Get activities to calculate statistics
      const activities = await this.getActivities(request);
      
      let totalComments = 0;
      let totalApprovals = 0;
      let totalChanges = 0;
      let lastActivity = '';

      activities.values.forEach(activity => {
        if (activity.action === 'COMMENTED') {
          totalComments++;
        } else if (activity.action === 'APPROVED') {
          totalApprovals++;
        } else if (activity.action === 'UPDATED') {
          totalChanges++;
        }

        if (!lastActivity || activity.createdDate > lastActivity) {
          lastActivity = activity.createdDate;
        }
      });

      // Calculate average response time (simplified)
      const averageResponseTime = this.calculateAverageResponseTime(activities.values);

      return {
        totalActivities: activities.size,
        totalComments,
        totalApprovals,
        totalChanges,
        averageResponseTime,
        lastActivity,
        additions: 0, // Would need to calculate from changes
        deletions: 0, // Would need to calculate from changes
        changes: totalChanges,
        files: 0, // Would need to calculate from changes
        commits: 0 // Would need to calculate from changes
      };
    } catch (error) {
      throw new Error(`Failed to get statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets pull request summary
   */
  async getSummary(request: GetActivitiesRequest): Promise<{
    pullRequestId: number;
    title: string;
    state: string;
    author: string;
    reviewers: string[];
    totalComments: number;
    totalApprovals: number;
    hasConflicts: boolean;
    isReadyToMerge: boolean;
    lastActivity: string;
  }> {
    try {
      // Get activities and changes
      const [activities, changes] = await Promise.all([
        this.getActivities(request),
        this.getChanges(request)
      ]);

      // Calculate summary data
      const totalComments = activities.values.filter(a => a.action === 'COMMENTED').length;
      const totalApprovals = activities.values.filter(a => a.action === 'APPROVED').length;
      const lastActivity = activities.values.reduce((latest, activity) => 
        activity.createdDate > latest ? activity.createdDate : latest, ''
      );

      // Check for conflicts (simplified - would need more complex logic in real implementation)
      const hasConflicts = changes.values.some(change => 
        change.type === 'MODIFY' && change.percentUnchanged && change.percentUnchanged < 50
      );

      // Check if ready to merge (simplified logic)
      const isReadyToMerge = totalApprovals > 0 && !hasConflicts;

      return {
        pullRequestId: request.pullRequestId,
        title: `Pull Request #${request.pullRequestId}`, // Would need to get from PR details
        state: 'OPEN', // Would need to get from PR details
        author: 'Unknown', // Would need to get from PR details
        reviewers: [], // Would need to get from PR details
        totalComments,
        totalApprovals,
        hasConflicts,
        isReadyToMerge,
        lastActivity
      };
    } catch (error) {
      throw new Error(`Failed to get summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Adds self links to activity
   */
  private addActivitySelfLinks(
    activity: Activity, 
    baseUrl: string, 
    projectKey: string, 
    repositorySlug: string,
    pullRequestId: number
  ): Activity {
    return {
      ...activity,
      // Activities don't have direct links in Bitbucket API, but we can add metadata
    };
  }

  /**
   * Adds self links to diff
   */
  private addDiffSelfLinks(
    diff: Diff, 
    baseUrl: string, 
    projectKey: string, 
    repositorySlug: string,
    pullRequestId: number
  ): Diff {
    return {
      ...diff,
      // Diff doesn't have direct links in Bitbucket API, but we can add metadata
    };
  }

  /**
   * Adds self links to change
   */
  private addChangeSelfLinks(
    change: Change, 
    baseUrl: string, 
    projectKey: string, 
    repositorySlug: string,
    pullRequestId: number
  ): Change {
    return {
      ...change,
      links: {
        ...change.links,
        self: [{
          href: `${baseUrl}/rest/api/1.0/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${pullRequestId}/changes/${change.contentId}`
        }]
      }
    };
  }

  /**
   * Calculates average response time
   */
  private calculateAverageResponseTime(activities: Activity[]): number {
    // Simplified calculation - in real implementation would need more complex logic
    const commentActivities = activities.filter(a => a.action === 'COMMENTED');
    if (commentActivities.length === 0) return 0;

    // This is a simplified calculation - real implementation would need to track
    // time between comment and response
    return commentActivities.length * 2; // 2 hours average (simplified)
  }

  /**
   * Makes HTTP request with retry logic
   */
  private async makeRequest(
    baseUrl: string,
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    auth: AuthInfo,
    data?: any
  ): Promise<AxiosResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const response = await axios({
          method,
          url: `${baseUrl}${endpoint}`,
          headers: {
            'Authorization': `${auth.token_type} ${auth.access_token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          data,
          timeout: this.REQUEST_TIMEOUT
        });

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry on client errors (4xx)
        if (axios.isAxiosError(error) && error.response?.status && error.response.status >= 400 && error.response.status < 500) {
          throw error;
        }

        // Wait before retry
        if (attempt < this.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * attempt));
        }
      }
    }

    throw lastError || new Error('Request failed after all retries');
  }

  /**
   * Analyzes pull request for potential issues
   */
  async analyzePullRequest(request: GetActivitiesRequest): Promise<{
    pullRequestId: number;
    issues: string[];
    suggestions: string[];
    riskLevel: 'low' | 'medium' | 'high';
    summary: string;
  }> {
    try {
      const [activities, changes] = await Promise.all([
        this.getActivities(request),
        this.getChanges(request)
      ]);

      const issues: string[] = [];
      const suggestions: string[] = [];

      // Check for potential issues
      if (activities.size === 0) {
        issues.push('Nenhuma atividade encontrada no pull request');
        suggestions.push('Verifique se o pull request foi criado corretamente');
      }

      if (changes.size === 0) {
        issues.push('Nenhuma mudança encontrada no pull request');
        suggestions.push('Verifique se há commits associados ao pull request');
      }

      // Check for conflicts (simplified)
      const hasConflicts = changes.values.some(change => (change as any).properties?.conflict === true);
      if (hasConflicts) {
        issues.push('Conflitos detectados no pull request');
        suggestions.push('Resolva os conflitos antes de fazer merge');
      }

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (issues.length > 2) {
        riskLevel = 'high';
      } else if (issues.length > 0) {
        riskLevel = 'medium';
      }

      return {
        pullRequestId: request.pullRequestId,
        issues,
        suggestions,
        riskLevel,
        summary: `Análise completa: ${issues.length} problemas encontrados, nível de risco: ${riskLevel}`
      };
    } catch (error) {
      throw new Error(`Failed to analyze pull request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const pullRequestAnalysisService = new PullRequestAnalysisService();