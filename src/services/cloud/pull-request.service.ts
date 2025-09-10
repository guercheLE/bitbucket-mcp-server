/**
 * Pull Request Service for Bitbucket Cloud REST API
 * Based on official documentation: https://developer.atlassian.com/cloud/bitbucket/rest/api-group-pullrequests/
 */

import {
  CreatePullRequestCommentRequest,
  CreatePullRequestRequest,
  CreatePullRequestStatusRequest,
  GetPullRequestDiffResponse,
  GetPullRequestPatchResponse,
  ListPullRequestActivitiesParams,
  ListPullRequestActivitiesResponse,
  ListPullRequestCommentsParams,
  ListPullRequestCommentsResponse,
  ListPullRequestStatusesResponse,
  ListPullRequestsParams,
  ListPullRequestsResponse,
  PullRequest,
  PullRequestActivity,
  PullRequestComment,
  PullRequestStatus,
  UpdatePullRequestCommentRequest,
  UpdatePullRequestRequest,
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
   * Get Pull Request
   * GET /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}
   */
  async getPullRequest(
    workspace: string,
    repoSlug: string,
    pullRequestId: number
  ): Promise<PullRequest> {
    this.logger.info('Getting pull request', { workspace, repoSlug, pullRequestId });

    try {
      const response = await this.apiClient.get<PullRequest>(
        `/repositories/${workspace}/${repoSlug}/pullrequests/${pullRequestId}`
      );
      this.logger.info('Successfully retrieved pull request', {
        workspace,
        repoSlug,
        pullRequestId,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get pull request', {
        workspace,
        repoSlug,
        pullRequestId,
        error,
      });
      throw error;
    }
  }

  /**
   * List Pull Requests
   * GET /2.0/repositories/{workspace}/{repo_slug}/pullrequests
   */
  async listPullRequests(
    workspace: string,
    repoSlug: string,
    params?: ListPullRequestsParams
  ): Promise<ListPullRequestsResponse> {
    this.logger.info('Listing pull requests', { workspace, repoSlug });

    try {
      const response = await this.apiClient.get<ListPullRequestsResponse>(
        `/repositories/${workspace}/${repoSlug}/pullrequests`,
        { params }
      );
      this.logger.info('Successfully listed pull requests', {
        workspace,
        repoSlug,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list pull requests', { workspace, repoSlug, error });
      throw error;
    }
  }

  /**
   * Create Pull Request
   * POST /2.0/repositories/{workspace}/{repo_slug}/pullrequests
   */
  async createPullRequest(
    workspace: string,
    repoSlug: string,
    request: CreatePullRequestRequest
  ): Promise<PullRequest> {
    this.logger.info('Creating pull request', { workspace, repoSlug, title: request.title });

    try {
      const response = await this.apiClient.post<PullRequest>(
        `/repositories/${workspace}/${repoSlug}/pullrequests`,
        request
      );
      this.logger.info('Successfully created pull request', {
        workspace,
        repoSlug,
        title: request.title,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create pull request', { workspace, repoSlug, request, error });
      throw error;
    }
  }

  /**
   * Update Pull Request
   * PUT /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}
   */
  async updatePullRequest(
    workspace: string,
    repoSlug: string,
    pullRequestId: number,
    request: UpdatePullRequestRequest
  ): Promise<PullRequest> {
    this.logger.info('Updating pull request', { workspace, repoSlug, pullRequestId });

    try {
      const response = await this.apiClient.put<PullRequest>(
        `/repositories/${workspace}/${repoSlug}/pullrequests/${pullRequestId}`,
        request
      );
      this.logger.info('Successfully updated pull request', { workspace, repoSlug, pullRequestId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update pull request', {
        workspace,
        repoSlug,
        pullRequestId,
        request,
        error,
      });
      throw error;
    }
  }

  /**
   * Decline Pull Request
   * POST /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/decline
   */
  async declinePullRequest(
    workspace: string,
    repoSlug: string,
    pullRequestId: number
  ): Promise<PullRequest> {
    this.logger.info('Declining pull request', { workspace, repoSlug, pullRequestId });

    try {
      const response = await this.apiClient.post<PullRequest>(
        `/repositories/${workspace}/${repoSlug}/pullrequests/${pullRequestId}/decline`
      );
      this.logger.info('Successfully declined pull request', {
        workspace,
        repoSlug,
        pullRequestId,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to decline pull request', {
        workspace,
        repoSlug,
        pullRequestId,
        error,
      });
      throw error;
    }
  }

  /**
   * Merge Pull Request
   * POST /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/merge
   */
  async mergePullRequest(
    workspace: string,
    repoSlug: string,
    pullRequestId: number
  ): Promise<PullRequest> {
    this.logger.info('Merging pull request', { workspace, repoSlug, pullRequestId });

    try {
      const response = await this.apiClient.post<PullRequest>(
        `/repositories/${workspace}/${repoSlug}/pullrequests/${pullRequestId}/merge`
      );
      this.logger.info('Successfully merged pull request', { workspace, repoSlug, pullRequestId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to merge pull request', {
        workspace,
        repoSlug,
        pullRequestId,
        error,
      });
      throw error;
    }
  }

  /**
   * Approve Pull Request
   * POST /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/approve
   */
  async approvePullRequest(
    workspace: string,
    repoSlug: string,
    pullRequestId: number
  ): Promise<PullRequest> {
    this.logger.info('Approving pull request', { workspace, repoSlug, pullRequestId });

    try {
      const response = await this.apiClient.post<PullRequest>(
        `/repositories/${workspace}/${repoSlug}/pullrequests/${pullRequestId}/approve`
      );
      this.logger.info('Successfully approved pull request', {
        workspace,
        repoSlug,
        pullRequestId,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to approve pull request', {
        workspace,
        repoSlug,
        pullRequestId,
        error,
      });
      throw error;
    }
  }

  /**
   * Unapprove Pull Request
   * DELETE /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/approve
   */
  async unapprovePullRequest(
    workspace: string,
    repoSlug: string,
    pullRequestId: number
  ): Promise<PullRequest> {
    this.logger.info('Unapproving pull request', { workspace, repoSlug, pullRequestId });

    try {
      const response = await this.apiClient.delete<PullRequest>(
        `/repositories/${workspace}/${repoSlug}/pullrequests/${pullRequestId}/approve`
      );
      this.logger.info('Successfully unapproved pull request', {
        workspace,
        repoSlug,
        pullRequestId,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to unapprove pull request', {
        workspace,
        repoSlug,
        pullRequestId,
        error,
      });
      throw error;
    }
  }

  /**
   * Request Changes on Pull Request
   * POST /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/request-changes
   */
  async requestChangesPullRequest(
    workspace: string,
    repoSlug: string,
    pullRequestId: number
  ): Promise<PullRequest> {
    this.logger.info('Requesting changes on pull request', { workspace, repoSlug, pullRequestId });

    try {
      const response = await this.apiClient.post<PullRequest>(
        `/repositories/${workspace}/${repoSlug}/pullrequests/${pullRequestId}/request-changes`
      );
      this.logger.info('Successfully requested changes on pull request', {
        workspace,
        repoSlug,
        pullRequestId,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to request changes on pull request', {
        workspace,
        repoSlug,
        pullRequestId,
        error,
      });
      throw error;
    }
  }

  /**
   * List Pull Request Comments
   * GET /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/comments
   */
  async listPullRequestComments(
    workspace: string,
    repoSlug: string,
    pullRequestId: number,
    params?: ListPullRequestCommentsParams
  ): Promise<ListPullRequestCommentsResponse> {
    this.logger.info('Listing pull request comments', { workspace, repoSlug, pullRequestId });

    try {
      const response = await this.apiClient.get<ListPullRequestCommentsResponse>(
        `/repositories/${workspace}/${repoSlug}/pullrequests/${pullRequestId}/comments`,
        { params }
      );
      this.logger.info('Successfully listed pull request comments', {
        workspace,
        repoSlug,
        pullRequestId,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list pull request comments', {
        workspace,
        repoSlug,
        pullRequestId,
        error,
      });
      throw error;
    }
  }

  /**
   * Get Pull Request Comment
   * GET /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/comments/{comment_id}
   */
  async getPullRequestComment(
    workspace: string,
    repoSlug: string,
    pullRequestId: number,
    commentId: number
  ): Promise<PullRequestComment> {
    this.logger.info('Getting pull request comment', {
      workspace,
      repoSlug,
      pullRequestId,
      commentId,
    });

    try {
      const response = await this.apiClient.get<PullRequestComment>(
        `/repositories/${workspace}/${repoSlug}/pullrequests/${pullRequestId}/comments/${commentId}`
      );
      this.logger.info('Successfully retrieved pull request comment', {
        workspace,
        repoSlug,
        pullRequestId,
        commentId,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get pull request comment', {
        workspace,
        repoSlug,
        pullRequestId,
        commentId,
        error,
      });
      throw error;
    }
  }

  /**
   * Create Pull Request Comment
   * POST /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/comments
   */
  async createPullRequestComment(
    workspace: string,
    repoSlug: string,
    pullRequestId: number,
    request: CreatePullRequestCommentRequest
  ): Promise<PullRequestComment> {
    this.logger.info('Creating pull request comment', { workspace, repoSlug, pullRequestId });

    try {
      const response = await this.apiClient.post<PullRequestComment>(
        `/repositories/${workspace}/${repoSlug}/pullrequests/${pullRequestId}/comments`,
        request
      );
      this.logger.info('Successfully created pull request comment', {
        workspace,
        repoSlug,
        pullRequestId,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create pull request comment', {
        workspace,
        repoSlug,
        pullRequestId,
        request,
        error,
      });
      throw error;
    }
  }

  /**
   * Update Pull Request Comment
   * PUT /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/comments/{comment_id}
   */
  async updatePullRequestComment(
    workspace: string,
    repoSlug: string,
    pullRequestId: number,
    commentId: number,
    request: UpdatePullRequestCommentRequest
  ): Promise<PullRequestComment> {
    this.logger.info('Updating pull request comment', {
      workspace,
      repoSlug,
      pullRequestId,
      commentId,
    });

    try {
      const response = await this.apiClient.put<PullRequestComment>(
        `/repositories/${workspace}/${repoSlug}/pullrequests/${pullRequestId}/comments/${commentId}`,
        request
      );
      this.logger.info('Successfully updated pull request comment', {
        workspace,
        repoSlug,
        pullRequestId,
        commentId,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update pull request comment', {
        workspace,
        repoSlug,
        pullRequestId,
        commentId,
        request,
        error,
      });
      throw error;
    }
  }

  /**
   * Delete Pull Request Comment
   * DELETE /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/comments/{comment_id}
   */
  async deletePullRequestComment(
    workspace: string,
    repoSlug: string,
    pullRequestId: number,
    commentId: number
  ): Promise<void> {
    this.logger.info('Deleting pull request comment', {
      workspace,
      repoSlug,
      pullRequestId,
      commentId,
    });

    try {
      await this.apiClient.delete(
        `/repositories/${workspace}/${repoSlug}/pullrequests/${pullRequestId}/comments/${commentId}`
      );
      this.logger.info('Successfully deleted pull request comment', {
        workspace,
        repoSlug,
        pullRequestId,
        commentId,
      });
    } catch (error) {
      this.logger.error('Failed to delete pull request comment', {
        workspace,
        repoSlug,
        pullRequestId,
        commentId,
        error,
      });
      throw error;
    }
  }

  /**
   * List Pull Request Activities
   * GET /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/activity
   */
  async listPullRequestActivities(
    workspace: string,
    repoSlug: string,
    pullRequestId: number,
    params?: ListPullRequestActivitiesParams
  ): Promise<ListPullRequestActivitiesResponse> {
    this.logger.info('Listing pull request activities', { workspace, repoSlug, pullRequestId });

    try {
      const response = await this.apiClient.get<ListPullRequestActivitiesResponse>(
        `/repositories/${workspace}/${repoSlug}/pullrequests/${pullRequestId}/activity`,
        { params }
      );
      this.logger.info('Successfully listed pull request activities', {
        workspace,
        repoSlug,
        pullRequestId,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list pull request activities', {
        workspace,
        repoSlug,
        pullRequestId,
        error,
      });
      throw error;
    }
  }

  /**
   * List Pull Request Statuses
   * GET /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/statuses
   */
  async listPullRequestStatuses(
    workspace: string,
    repoSlug: string,
    pullRequestId: number
  ): Promise<ListPullRequestStatusesResponse> {
    this.logger.info('Listing pull request statuses', { workspace, repoSlug, pullRequestId });

    try {
      const response = await this.apiClient.get<ListPullRequestStatusesResponse>(
        `/repositories/${workspace}/${repoSlug}/pullrequests/${pullRequestId}/statuses`
      );
      this.logger.info('Successfully listed pull request statuses', {
        workspace,
        repoSlug,
        pullRequestId,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list pull request statuses', {
        workspace,
        repoSlug,
        pullRequestId,
        error,
      });
      throw error;
    }
  }

  /**
   * Create Pull Request Status
   * POST /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/statuses
   */
  async createPullRequestStatus(
    workspace: string,
    repoSlug: string,
    pullRequestId: number,
    request: CreatePullRequestStatusRequest
  ): Promise<PullRequestStatus> {
    this.logger.info('Creating pull request status', { workspace, repoSlug, pullRequestId });

    try {
      const response = await this.apiClient.post<PullRequestStatus>(
        `/repositories/${workspace}/${repoSlug}/pullrequests/${pullRequestId}/statuses`,
        request
      );
      this.logger.info('Successfully created pull request status', {
        workspace,
        repoSlug,
        pullRequestId,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create pull request status', {
        workspace,
        repoSlug,
        pullRequestId,
        request,
        error,
      });
      throw error;
    }
  }

  /**
   * Get Pull Request Diff
   * GET /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/diff
   */
  async getPullRequestDiff(
    workspace: string,
    repoSlug: string,
    pullRequestId: number
  ): Promise<GetPullRequestDiffResponse> {
    this.logger.info('Getting pull request diff', { workspace, repoSlug, pullRequestId });

    try {
      const response = await this.apiClient.get<GetPullRequestDiffResponse>(
        `/repositories/${workspace}/${repoSlug}/pullrequests/${pullRequestId}/diff`
      );
      this.logger.info('Successfully retrieved pull request diff', {
        workspace,
        repoSlug,
        pullRequestId,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get pull request diff', {
        workspace,
        repoSlug,
        pullRequestId,
        error,
      });
      throw error;
    }
  }

  /**
   * Get Pull Request Patch
   * GET /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/patch
   */
  async getPullRequestPatch(
    workspace: string,
    repoSlug: string,
    pullRequestId: number
  ): Promise<GetPullRequestPatchResponse> {
    this.logger.info('Getting pull request patch', { workspace, repoSlug, pullRequestId });

    try {
      const response = await this.apiClient.get<GetPullRequestPatchResponse>(
        `/repositories/${workspace}/${repoSlug}/pullrequests/${pullRequestId}/patch`
      );
      this.logger.info('Successfully retrieved pull request patch', {
        workspace,
        repoSlug,
        pullRequestId,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get pull request patch', {
        workspace,
        repoSlug,
        pullRequestId,
        error,
      });
      throw error;
    }
  }
}
