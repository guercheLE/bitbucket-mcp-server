/**
 * Pull Request Service for Bitbucket Data Center REST API
 * Based on official documentation: https://developer.atlassian.com/server/bitbucket/rest/v906/intro/
 */

import {
  PullRequestActivity,
  PullRequestActivityListResponse,
  PullRequestComment,
  PullRequestCommentListResponse,
  PullRequestCommentRequest,
  PullRequestCommentUpdateRequest,
  PullRequestCreateRequest,
  PullRequestDeclineRequest,
  PullRequestDeclineResponse,
  PullRequestListResponse,
  PullRequestMergeRequest,
  PullRequestMergeResponse,
  PullRequestQueryParams,
  PullRequestReopenRequest,
  PullRequestReopenResponse,
  PullRequestResponse,
  PullRequestUpdateRequest,
} from './types/pull-request.types.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';

export class PullRequestService {
  private readonly apiClient: ApiClient;
  private readonly logger: Logger;

  constructor(apiClient: ApiClient, logger: Logger) {
    this.apiClient = apiClient;
    this.logger = logger;
  }

  /**
   * Create a new pull request
   * POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests
   */
  async createPullRequest(
    projectKey: string,
    repositorySlug: string,
    request: PullRequestCreateRequest
  ): Promise<PullRequestResponse> {
    this.logger.info('Creating pull request', { projectKey, repositorySlug, title: request.title });

    try {
      const response = await this.apiClient.post<PullRequestResponse>(
        `/projects/${projectKey}/repos/${repositorySlug}/pull-requests`,
        request
      );
      this.logger.info('Successfully created pull request', {
        projectKey,
        repositorySlug,
        prId: response.data.id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create pull request', {
        projectKey,
        repositorySlug,
        request,
        error,
      });
      throw error;
    }
  }

  /**
   * Get pull request
   * GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}
   */
  async getPullRequest(
    projectKey: string,
    repositorySlug: string,
    pullRequestId: number
  ): Promise<PullRequestResponse> {
    this.logger.info('Getting pull request', { projectKey, repositorySlug, pullRequestId });

    try {
      const response = await this.apiClient.get<PullRequestResponse>(
        `/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${pullRequestId}`
      );
      this.logger.info('Successfully retrieved pull request', {
        projectKey,
        repositorySlug,
        pullRequestId,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get pull request', {
        projectKey,
        repositorySlug,
        pullRequestId,
        error,
      });
      throw error;
    }
  }

  /**
   * Update pull request
   * PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}
   */
  async updatePullRequest(
    projectKey: string,
    repositorySlug: string,
    pullRequestId: number,
    request: PullRequestUpdateRequest
  ): Promise<PullRequestResponse> {
    this.logger.info('Updating pull request', {
      projectKey,
      repositorySlug,
      pullRequestId,
      request,
    });

    try {
      const response = await this.apiClient.put<PullRequestResponse>(
        `/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${pullRequestId}`,
        request
      );
      this.logger.info('Successfully updated pull request', {
        projectKey,
        repositorySlug,
        pullRequestId,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update pull request', {
        projectKey,
        repositorySlug,
        pullRequestId,
        request,
        error,
      });
      throw error;
    }
  }

  /**
   * Delete pull request
   * DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}
   */
  async deletePullRequest(
    projectKey: string,
    repositorySlug: string,
    pullRequestId: number
  ): Promise<void> {
    this.logger.info('Deleting pull request', { projectKey, repositorySlug, pullRequestId });

    try {
      await this.apiClient.delete(
        `/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${pullRequestId}`
      );
      this.logger.info('Successfully deleted pull request', {
        projectKey,
        repositorySlug,
        pullRequestId,
      });
    } catch (error) {
      this.logger.error('Failed to delete pull request', {
        projectKey,
        repositorySlug,
        pullRequestId,
        error,
      });
      throw error;
    }
  }

  /**
   * List pull requests
   * GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests
   */
  async listPullRequests(
    projectKey: string,
    repositorySlug: string,
    params?: PullRequestQueryParams
  ): Promise<PullRequestListResponse> {
    this.logger.info('Listing pull requests', { projectKey, repositorySlug, params });

    try {
      const response = await this.apiClient.get<PullRequestListResponse>(
        `/projects/${projectKey}/repos/${repositorySlug}/pull-requests`,
        { params }
      );
      this.logger.info('Successfully listed pull requests', {
        projectKey,
        repositorySlug,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list pull requests', {
        projectKey,
        repositorySlug,
        params,
        error,
      });
      throw error;
    }
  }

  /**
   * Merge pull request
   * POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/merge
   */
  async mergePullRequest(
    projectKey: string,
    repositorySlug: string,
    pullRequestId: number,
    request: PullRequestMergeRequest
  ): Promise<PullRequestMergeResponse> {
    this.logger.info('Merging pull request', {
      projectKey,
      repositorySlug,
      pullRequestId,
      request,
    });

    try {
      const response = await this.apiClient.post<PullRequestMergeResponse>(
        `/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${pullRequestId}/merge`,
        request
      );
      this.logger.info('Successfully merged pull request', {
        projectKey,
        repositorySlug,
        pullRequestId,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to merge pull request', {
        projectKey,
        repositorySlug,
        pullRequestId,
        request,
        error,
      });
      throw error;
    }
  }

  /**
   * Decline pull request
   * POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/decline
   */
  async declinePullRequest(
    projectKey: string,
    repositorySlug: string,
    pullRequestId: number,
    request: PullRequestDeclineRequest
  ): Promise<PullRequestDeclineResponse> {
    this.logger.info('Declining pull request', {
      projectKey,
      repositorySlug,
      pullRequestId,
      request,
    });

    try {
      const response = await this.apiClient.post<PullRequestDeclineResponse>(
        `/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${pullRequestId}/decline`,
        request
      );
      this.logger.info('Successfully declined pull request', {
        projectKey,
        repositorySlug,
        pullRequestId,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to decline pull request', {
        projectKey,
        repositorySlug,
        pullRequestId,
        request,
        error,
      });
      throw error;
    }
  }

  /**
   * Reopen pull request
   * POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/reopen
   */
  async reopenPullRequest(
    projectKey: string,
    repositorySlug: string,
    pullRequestId: number,
    request: PullRequestReopenRequest
  ): Promise<PullRequestReopenResponse> {
    this.logger.info('Reopening pull request', {
      projectKey,
      repositorySlug,
      pullRequestId,
      request,
    });

    try {
      const response = await this.apiClient.post<PullRequestReopenResponse>(
        `/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${pullRequestId}/reopen`,
        request
      );
      this.logger.info('Successfully reopened pull request', {
        projectKey,
        repositorySlug,
        pullRequestId,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to reopen pull request', {
        projectKey,
        repositorySlug,
        pullRequestId,
        request,
        error,
      });
      throw error;
    }
  }

  /**
   * Get pull request comments
   * GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/comments
   */
  async getPullRequestComments(
    projectKey: string,
    repositorySlug: string,
    pullRequestId: number,
    params?: { start?: number; limit?: number }
  ): Promise<PullRequestCommentListResponse> {
    this.logger.info('Getting pull request comments', {
      projectKey,
      repositorySlug,
      pullRequestId,
      params,
    });

    try {
      const response = await this.apiClient.get<PullRequestCommentListResponse>(
        `/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${pullRequestId}/comments`,
        { params }
      );
      this.logger.info('Successfully retrieved pull request comments', {
        projectKey,
        repositorySlug,
        pullRequestId,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get pull request comments', {
        projectKey,
        repositorySlug,
        pullRequestId,
        params,
        error,
      });
      throw error;
    }
  }

  /**
   * Create pull request comment
   * POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/comments
   */
  async createPullRequestComment(
    projectKey: string,
    repositorySlug: string,
    pullRequestId: number,
    request: PullRequestCommentRequest
  ): Promise<PullRequestComment> {
    this.logger.info('Creating pull request comment', {
      projectKey,
      repositorySlug,
      pullRequestId,
      request,
    });

    try {
      const response = await this.apiClient.post<PullRequestComment>(
        `/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${pullRequestId}/comments`,
        request
      );
      this.logger.info('Successfully created pull request comment', {
        projectKey,
        repositorySlug,
        pullRequestId,
        commentId: response.data.id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create pull request comment', {
        projectKey,
        repositorySlug,
        pullRequestId,
        request,
        error,
      });
      throw error;
    }
  }

  /**
   * Get pull request comment
   * GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/comments/{commentId}
   */
  async getPullRequestComment(
    projectKey: string,
    repositorySlug: string,
    pullRequestId: number,
    commentId: number
  ): Promise<PullRequestComment> {
    this.logger.info('Getting pull request comment', {
      projectKey,
      repositorySlug,
      pullRequestId,
      commentId,
    });

    try {
      const response = await this.apiClient.get<PullRequestComment>(
        `/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${pullRequestId}/comments/${commentId}`
      );
      this.logger.info('Successfully retrieved pull request comment', {
        projectKey,
        repositorySlug,
        pullRequestId,
        commentId,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get pull request comment', {
        projectKey,
        repositorySlug,
        pullRequestId,
        commentId,
        error,
      });
      throw error;
    }
  }

  /**
   * Update pull request comment
   * PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/comments/{commentId}
   */
  async updatePullRequestComment(
    projectKey: string,
    repositorySlug: string,
    pullRequestId: number,
    commentId: number,
    request: PullRequestCommentUpdateRequest
  ): Promise<PullRequestComment> {
    this.logger.info('Updating pull request comment', {
      projectKey,
      repositorySlug,
      pullRequestId,
      commentId,
      request,
    });

    try {
      const response = await this.apiClient.put<PullRequestComment>(
        `/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${pullRequestId}/comments/${commentId}`,
        request
      );
      this.logger.info('Successfully updated pull request comment', {
        projectKey,
        repositorySlug,
        pullRequestId,
        commentId,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update pull request comment', {
        projectKey,
        repositorySlug,
        pullRequestId,
        commentId,
        request,
        error,
      });
      throw error;
    }
  }

  /**
   * Delete pull request comment
   * DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/comments/{commentId}
   */
  async deletePullRequestComment(
    projectKey: string,
    repositorySlug: string,
    pullRequestId: number,
    commentId: number
  ): Promise<void> {
    this.logger.info('Deleting pull request comment', {
      projectKey,
      repositorySlug,
      pullRequestId,
      commentId,
    });

    try {
      await this.apiClient.delete(
        `/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${pullRequestId}/comments/${commentId}`
      );
      this.logger.info('Successfully deleted pull request comment', {
        projectKey,
        repositorySlug,
        pullRequestId,
        commentId,
      });
    } catch (error) {
      this.logger.error('Failed to delete pull request comment', {
        projectKey,
        repositorySlug,
        pullRequestId,
        commentId,
        error,
      });
      throw error;
    }
  }

  /**
   * Get pull request activity
   * GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/activities
   */
  async getPullRequestActivity(
    projectKey: string,
    repositorySlug: string,
    pullRequestId: number,
    params?: { start?: number; limit?: number }
  ): Promise<PullRequestActivityListResponse> {
    this.logger.info('Getting pull request activity', {
      projectKey,
      repositorySlug,
      pullRequestId,
      params,
    });

    try {
      const response = await this.apiClient.get<PullRequestActivityListResponse>(
        `/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${pullRequestId}/activities`,
        { params }
      );
      this.logger.info('Successfully retrieved pull request activity', {
        projectKey,
        repositorySlug,
        pullRequestId,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get pull request activity', {
        projectKey,
        repositorySlug,
        pullRequestId,
        params,
        error,
      });
      throw error;
    }
  }

  /**
   * Get pull request diff
   * GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/diff
   */
  async getPullRequestDiff(
    projectKey: string,
    repositorySlug: string,
    pullRequestId: number,
    params?: { contextLines?: number; whitespace?: string; withComments?: boolean }
  ): Promise<string> {
    this.logger.info('Getting pull request diff', {
      projectKey,
      repositorySlug,
      pullRequestId,
      params,
    });

    try {
      const response = await this.apiClient.get<string>(
        `/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${pullRequestId}/diff`,
        { params }
      );
      this.logger.info('Successfully retrieved pull request diff', {
        projectKey,
        repositorySlug,
        pullRequestId,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get pull request diff', {
        projectKey,
        repositorySlug,
        pullRequestId,
        params,
        error,
      });
      throw error;
    }
  }

  /**
   * Get pull request changes
   * GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/changes
   */
  async getPullRequestChanges(
    projectKey: string,
    repositorySlug: string,
    pullRequestId: number,
    params?: { start?: number; limit?: number }
  ): Promise<any> {
    this.logger.info('Getting pull request changes', {
      projectKey,
      repositorySlug,
      pullRequestId,
      params,
    });

    try {
      const response = await this.apiClient.get<any>(
        `/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${pullRequestId}/changes`,
        { params }
      );
      this.logger.info('Successfully retrieved pull request changes', {
        projectKey,
        repositorySlug,
        pullRequestId,
      });
      return response;
    } catch (error) {
      this.logger.error('Failed to get pull request changes', {
        projectKey,
        repositorySlug,
        pullRequestId,
        params,
        error,
      });
      throw error;
    }
  }
}
