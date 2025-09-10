/**
 * Commit Service for Bitbucket Cloud REST API
 * Handles all commit-related operations
 * Based on: https://developer.atlassian.com/cloud/bitbucket/rest/api-group-commits/
 */

import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';
import { PagedResponse, PaginationParams, ErrorResponse } from './types/base.types.js';
import {
  Commit,
  CommitComment,
  CommitPatch,
  GetCommitParams,
  ListCommitsParams,
  ListCommitsForRevisionParams,
  CompareCommitsParams,
  CreateCommitCommentParams,
  UpdateCommitCommentParams,
  DeleteCommitCommentParams,
} from './types/commit.types.js';

export class CommitService {
  private apiClient: ApiClient;
  private logger: Logger;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.logger = Logger.forContext('CommitService');
  }

  /**
   * Get a specific commit
   */
  async getCommit(params: GetCommitParams): Promise<Commit> {
    this.logger.info('Getting commit', { params });

    try {
      const response = await this.apiClient.get<Commit>(
        `/repositories/${params.workspace}/${params.repo_slug}/commit/${params.commit}`
      );

      this.logger.info('Successfully retrieved commit', { commit: params.commit });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get commit', { params, error });
      throw error;
    }
  }

  /**
   * Approve a commit
   */
  async approveCommit(params: GetCommitParams): Promise<void> {
    this.logger.info('Approving commit', { params });

    try {
      await this.apiClient.post(
        `/repositories/${params.workspace}/${params.repo_slug}/commit/${params.commit}/approve`
      );

      this.logger.info('Successfully approved commit', { commit: params.commit });
    } catch (error) {
      this.logger.error('Failed to approve commit', { params, error });
      throw error;
    }
  }

  /**
   * Unapprove a commit
   */
  async unapproveCommit(params: GetCommitParams): Promise<void> {
    this.logger.info('Unapproving commit', { params });

    try {
      await this.apiClient.delete(
        `/repositories/${params.workspace}/${params.repo_slug}/commit/${params.commit}/approve`
      );

      this.logger.info('Successfully unapproved commit', { commit: params.commit });
    } catch (error) {
      this.logger.error('Failed to unapprove commit', { params, error });
      throw error;
    }
  }

  /**
   * List comments on a commit
   */
  async listCommitComments(
    params: GetCommitParams & PaginationParams
  ): Promise<PagedResponse<CommitComment>> {
    this.logger.info('Listing commit comments', { params });

    try {
      const response = await this.apiClient.get<PagedResponse<CommitComment>>(
        `/repositories/${params.workspace}/${params.repo_slug}/commit/${params.commit}/comments`,
        { params: { page: params.page, pagelen: params.pagelen } }
      );

      this.logger.info('Successfully listed commit comments', {
        commit: params.commit,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list commit comments', { params, error });
      throw error;
    }
  }

  /**
   * Create a comment on a commit
   */
  async createCommitComment(params: CreateCommitCommentParams): Promise<CommitComment> {
    this.logger.info('Creating commit comment', { params });

    try {
      const response = await this.apiClient.post<CommitComment>(
        `/repositories/${params.workspace}/${params.repo_slug}/commit/${params.commit}/comments`,
        {
          content: {
            raw: params.content,
          },
          inline: params.inline,
        }
      );

      this.logger.info('Successfully created commit comment', {
        commit: params.commit,
        comment_id: response.data.id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create commit comment', { params, error });
      throw error;
    }
  }

  /**
   * Get a specific commit comment
   */
  async getCommitComment(params: GetCommitParams & { comment_id: number }): Promise<CommitComment> {
    this.logger.info('Getting commit comment', { params });

    try {
      const response = await this.apiClient.get<CommitComment>(
        `/repositories/${params.workspace}/${params.repo_slug}/commit/${params.commit}/comments/${params.comment_id}`
      );

      this.logger.info('Successfully retrieved commit comment', {
        commit: params.commit,
        comment_id: params.comment_id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get commit comment', { params, error });
      throw error;
    }
  }

  /**
   * Update a commit comment
   */
  async updateCommitComment(params: UpdateCommitCommentParams): Promise<CommitComment> {
    this.logger.info('Updating commit comment', { params });

    try {
      const response = await this.apiClient.put<CommitComment>(
        `/repositories/${params.workspace}/${params.repo_slug}/commit/${params.commit}/comments/${params.comment_id}`,
        {
          content: {
            raw: params.content,
          },
        }
      );

      this.logger.info('Successfully updated commit comment', {
        commit: params.commit,
        comment_id: params.comment_id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update commit comment', { params, error });
      throw error;
    }
  }

  /**
   * Delete a commit comment
   */
  async deleteCommitComment(params: DeleteCommitCommentParams): Promise<void> {
    this.logger.info('Deleting commit comment', { params });

    try {
      await this.apiClient.delete(
        `/repositories/${params.workspace}/${params.repo_slug}/commit/${params.commit}/comments/${params.comment_id}`
      );

      this.logger.info('Successfully deleted commit comment', {
        commit: params.commit,
        comment_id: params.comment_id,
      });
    } catch (error) {
      this.logger.error('Failed to delete commit comment', { params, error });
      throw error;
    }
  }

  /**
   * List commits in a repository
   */
  async listCommits(params: ListCommitsParams): Promise<PagedResponse<Commit>> {
    this.logger.info('Listing commits', { params });

    try {
      const queryParams: Record<string, any> = {
        page: params.page,
        pagelen: params.pagelen,
      };

      if (params.include) queryParams.include = params.include;
      if (params.exclude) queryParams.exclude = params.exclude;
      if (params.q) queryParams.q = params.q;
      if (params.sort) queryParams.sort = params.sort;

      const response = await this.apiClient.get<PagedResponse<Commit>>(
        `/repositories/${params.workspace}/${params.repo_slug}/commits`,
        { params: queryParams }
      );

      this.logger.info('Successfully listed commits', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list commits', { params, error });
      throw error;
    }
  }

  /**
   * List commits for a specific revision
   */
  async listCommitsForRevision(
    params: ListCommitsForRevisionParams
  ): Promise<PagedResponse<Commit>> {
    this.logger.info('Listing commits for revision', { params });

    try {
      const queryParams: Record<string, any> = {
        page: params.page,
        pagelen: params.pagelen,
      };

      if (params.include) queryParams.include = params.include;
      if (params.exclude) queryParams.exclude = params.exclude;
      if (params.q) queryParams.q = params.q;
      if (params.sort) queryParams.sort = params.sort;

      const response = await this.apiClient.get<PagedResponse<Commit>>(
        `/repositories/${params.workspace}/${params.repo_slug}/commits/${params.revision}`,
        { params: queryParams }
      );

      this.logger.info('Successfully listed commits for revision', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        revision: params.revision,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list commits for revision', { params, error });
      throw error;
    }
  }

  /**
   * Compare two commits
   */
  async compareCommits(params: CompareCommitsParams): Promise<PagedResponse<Commit>> {
    this.logger.info('Comparing commits', { params });

    try {
      const response = await this.apiClient.get<PagedResponse<Commit>>(
        `/repositories/${params.workspace}/${params.repo_slug}/diff/${params.spec}`
      );

      this.logger.info('Successfully compared commits', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        spec: params.spec,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to compare commits', { params, error });
      throw error;
    }
  }

  /**
   * Get diff stats between two commits
   */
  async getCommitDiffStats(params: CompareCommitsParams): Promise<any> {
    this.logger.info('Getting commit diff stats', { params });

    try {
      const response = await this.apiClient.get(
        `/repositories/${params.workspace}/${params.repo_slug}/diffstat/${params.spec}`
      );

      this.logger.info('Successfully retrieved commit diff stats', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        spec: params.spec,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get commit diff stats', { params, error });
      throw error;
    }
  }

  /**
   * Get common ancestor between two commits
   */
  async getCommonAncestor(params: CompareCommitsParams): Promise<Commit> {
    this.logger.info('Getting common ancestor', { params });

    try {
      const response = await this.apiClient.get<Commit>(
        `/repositories/${params.workspace}/${params.repo_slug}/merge-base/${params.spec}`
      );

      this.logger.info('Successfully retrieved common ancestor', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        spec: params.spec,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get common ancestor', { params, error });
      throw error;
    }
  }

  /**
   * Get patch between two commits
   */
  async getCommitPatch(params: CompareCommitsParams): Promise<CommitPatch> {
    this.logger.info('Getting commit patch', { params });

    try {
      const response = await this.apiClient.get<CommitPatch>(
        `/repositories/${params.workspace}/${params.repo_slug}/patch/${params.spec}`
      );

      this.logger.info('Successfully retrieved commit patch', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        spec: params.spec,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get commit patch', { params, error });
      throw error;
    }
  }
}
