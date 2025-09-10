/**
 * Issue Service for Bitbucket Cloud REST API
 * Handles all issue-related operations
 * Based on: https://developer.atlassian.com/cloud/bitbucket/rest/api-group-issue-tracker/
 */

import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';
import { PagedResponse, PaginationParams, ErrorResponse } from './types/base.types.js';
import {
  Issue,
  IssueComment,
  IssueChange,
  IssueAttachment,
  IssueComponent,
  IssueMilestone,
  IssueVersion,
  CreateIssueRequest,
  UpdateIssueRequest,
  CreateIssueCommentRequest,
  UpdateIssueCommentRequest,
  CreateIssueChangeRequest,
  ListIssuesParams,
  GetIssueParams,
  CreateIssueParams,
  UpdateIssueParams,
  DeleteIssueParams,
  ListIssueCommentsParams,
  CreateIssueCommentParams,
  GetIssueCommentParams,
  UpdateIssueCommentParams,
  DeleteIssueCommentParams,
  ListIssueChangesParams,
  CreateIssueChangeParams,
  GetIssueChangeParams,
  ListIssueAttachmentsParams,
  GetIssueAttachmentParams,
  DeleteIssueAttachmentParams,
  VoteIssueParams,
  WatchIssueParams,
  ListComponentsParams,
  GetComponentParams,
  ListMilestonesParams,
  GetMilestoneParams,
  ListVersionsParams,
  GetVersionParams,
} from './types/issue.types.js';

export class IssueService {
  private apiClient: ApiClient;
  private logger: Logger;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.logger = Logger.forContext('IssueService');
  }

  /**
   * List components
   * Returns the components that have been defined in the issue tracker.
   */
  async listComponents(params: ListComponentsParams): Promise<PagedResponse<IssueComponent>> {
    this.logger.info('Listing components', { params });

    try {
      const queryParams: Record<string, any> = {};

      if (params.page) queryParams.page = params.page;
      if (params.pagelen) queryParams.pagelen = params.pagelen;

      const response = await this.apiClient.get<PagedResponse<IssueComponent>>(
        `/repositories/${params.workspace}/${params.repo_slug}/components`,
        { params: queryParams }
      );

      this.logger.info('Successfully listed components', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list components', { params, error });
      throw error;
    }
  }

  /**
   * Get a component for issues
   */
  async getComponent(params: GetComponentParams): Promise<IssueComponent> {
    this.logger.info('Getting component', { params });

    try {
      const response = await this.apiClient.get<IssueComponent>(
        `/repositories/${params.workspace}/${params.repo_slug}/components/${params.component_id}`
      );

      this.logger.info('Successfully retrieved component', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        component_id: params.component_id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get component', { params, error });
      throw error;
    }
  }

  /**
   * List issues
   */
  async listIssues(params: ListIssuesParams): Promise<PagedResponse<Issue>> {
    this.logger.info('Listing issues', { params });

    try {
      const queryParams: Record<string, any> = {};

      if (params.page) queryParams.page = params.page;
      if (params.pagelen) queryParams.pagelen = params.pagelen;
      if (params.q) queryParams.q = params.q;
      if (params.sort) queryParams.sort = params.sort;

      const response = await this.apiClient.get<PagedResponse<Issue>>(
        `/repositories/${params.workspace}/${params.repo_slug}/issues`,
        { params: queryParams }
      );

      this.logger.info('Successfully listed issues', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list issues', { params, error });
      throw error;
    }
  }

  /**
   * Create an issue
   */
  async createIssue(params: CreateIssueParams): Promise<Issue> {
    this.logger.info('Creating issue', { params });

    try {
      const response = await this.apiClient.post<Issue>(
        `/repositories/${params.workspace}/${params.repo_slug}/issues`,
        {
          title: params.issue.title,
          content: params.issue.content ? { raw: params.issue.content } : undefined,
          kind: params.issue.kind,
          priority: params.issue.priority,
          assignee: params.issue.assignee,
          component: params.issue.component,
          milestone: params.issue.milestone,
          version: params.issue.version,
        }
      );

      this.logger.info('Successfully created issue', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        issue_id: response.data.id,
        title: response.data.title,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create issue', { params, error });
      throw error;
    }
  }

  /**
   * Get an issue
   */
  async getIssue(params: GetIssueParams): Promise<Issue> {
    this.logger.info('Getting issue', { params });

    try {
      const response = await this.apiClient.get<Issue>(
        `/repositories/${params.workspace}/${params.repo_slug}/issues/${params.issue_id}`
      );

      this.logger.info('Successfully retrieved issue', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        issue_id: params.issue_id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get issue', { params, error });
      throw error;
    }
  }

  /**
   * Update an issue
   */
  async updateIssue(params: UpdateIssueParams): Promise<Issue> {
    this.logger.info('Updating issue', { params });

    try {
      const response = await this.apiClient.put<Issue>(
        `/repositories/${params.workspace}/${params.repo_slug}/issues/${params.issue_id}`,
        {
          title: params.issue.title,
          content: params.issue.content ? { raw: params.issue.content } : undefined,
          kind: params.issue.kind,
          priority: params.issue.priority,
          assignee: params.issue.assignee,
          component: params.issue.component,
          milestone: params.issue.milestone,
          version: params.issue.version,
          state: params.issue.state,
        }
      );

      this.logger.info('Successfully updated issue', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        issue_id: params.issue_id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update issue', { params, error });
      throw error;
    }
  }

  /**
   * Delete an issue
   */
  async deleteIssue(params: DeleteIssueParams): Promise<void> {
    this.logger.info('Deleting issue', { params });

    try {
      await this.apiClient.delete(
        `/repositories/${params.workspace}/${params.repo_slug}/issues/${params.issue_id}`
      );

      this.logger.info('Successfully deleted issue', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        issue_id: params.issue_id,
      });
    } catch (error) {
      this.logger.error('Failed to delete issue', { params, error });
      throw error;
    }
  }

  /**
   * List comments on an issue
   */
  async listIssueComments(params: ListIssueCommentsParams): Promise<PagedResponse<IssueComment>> {
    this.logger.info('Listing issue comments', { params });

    try {
      const queryParams: Record<string, any> = {};

      if (params.page) queryParams.page = params.page;
      if (params.pagelen) queryParams.pagelen = params.pagelen;

      const response = await this.apiClient.get<PagedResponse<IssueComment>>(
        `/repositories/${params.workspace}/${params.repo_slug}/issues/${params.issue_id}/comments`,
        { params: queryParams }
      );

      this.logger.info('Successfully listed issue comments', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        issue_id: params.issue_id,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list issue comments', { params, error });
      throw error;
    }
  }

  /**
   * Create a comment on an issue
   */
  async createIssueComment(params: CreateIssueCommentParams): Promise<IssueComment> {
    this.logger.info('Creating issue comment', { params });

    try {
      const response = await this.apiClient.post<IssueComment>(
        `/repositories/${params.workspace}/${params.repo_slug}/issues/${params.issue_id}/comments`,
        {
          content: {
            raw: params.comment.content,
          },
          parent: params.comment.parent,
        }
      );

      this.logger.info('Successfully created issue comment', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        issue_id: params.issue_id,
        comment_id: response.data.id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create issue comment', { params, error });
      throw error;
    }
  }

  /**
   * Get a comment on an issue
   */
  async getIssueComment(params: GetIssueCommentParams): Promise<IssueComment> {
    this.logger.info('Getting issue comment', { params });

    try {
      const response = await this.apiClient.get<IssueComment>(
        `/repositories/${params.workspace}/${params.repo_slug}/issues/${params.issue_id}/comments/${params.comment_id}`
      );

      this.logger.info('Successfully retrieved issue comment', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        issue_id: params.issue_id,
        comment_id: params.comment_id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get issue comment', { params, error });
      throw error;
    }
  }

  /**
   * Update a comment on an issue
   */
  async updateIssueComment(params: UpdateIssueCommentParams): Promise<IssueComment> {
    this.logger.info('Updating issue comment', { params });

    try {
      const response = await this.apiClient.put<IssueComment>(
        `/repositories/${params.workspace}/${params.repo_slug}/issues/${params.issue_id}/comments/${params.comment_id}`,
        {
          content: {
            raw: params.comment.content,
          },
        }
      );

      this.logger.info('Successfully updated issue comment', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        issue_id: params.issue_id,
        comment_id: params.comment_id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update issue comment', { params, error });
      throw error;
    }
  }

  /**
   * Delete a comment on an issue
   */
  async deleteIssueComment(params: DeleteIssueCommentParams): Promise<void> {
    this.logger.info('Deleting issue comment', { params });

    try {
      await this.apiClient.delete(
        `/repositories/${params.workspace}/${params.repo_slug}/issues/${params.issue_id}/comments/${params.comment_id}`
      );

      this.logger.info('Successfully deleted issue comment', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        issue_id: params.issue_id,
        comment_id: params.comment_id,
      });
    } catch (error) {
      this.logger.error('Failed to delete issue comment', { params, error });
      throw error;
    }
  }

  /**
   * Vote for an issue
   */
  async voteIssue(params: VoteIssueParams): Promise<void> {
    this.logger.info('Voting for issue', { params });

    try {
      await this.apiClient.put(
        `/repositories/${params.workspace}/${params.repo_slug}/issues/${params.issue_id}/vote`
      );

      this.logger.info('Successfully voted for issue', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        issue_id: params.issue_id,
      });
    } catch (error) {
      this.logger.error('Failed to vote for issue', { params, error });
      throw error;
    }
  }

  /**
   * Remove vote for an issue
   */
  async removeVoteIssue(params: VoteIssueParams): Promise<void> {
    this.logger.info('Removing vote for issue', { params });

    try {
      await this.apiClient.delete(
        `/repositories/${params.workspace}/${params.repo_slug}/issues/${params.issue_id}/vote`
      );

      this.logger.info('Successfully removed vote for issue', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        issue_id: params.issue_id,
      });
    } catch (error) {
      this.logger.error('Failed to remove vote for issue', { params, error });
      throw error;
    }
  }

  /**
   * Watch an issue
   */
  async watchIssue(params: WatchIssueParams): Promise<void> {
    this.logger.info('Watching issue', { params });

    try {
      await this.apiClient.put(
        `/repositories/${params.workspace}/${params.repo_slug}/issues/${params.issue_id}/watch`
      );

      this.logger.info('Successfully started watching issue', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        issue_id: params.issue_id,
      });
    } catch (error) {
      this.logger.error('Failed to watch issue', { params, error });
      throw error;
    }
  }

  /**
   * Stop watching an issue
   */
  async stopWatchingIssue(params: WatchIssueParams): Promise<void> {
    this.logger.info('Stopping watching issue', { params });

    try {
      await this.apiClient.delete(
        `/repositories/${params.workspace}/${params.repo_slug}/issues/${params.issue_id}/watch`
      );

      this.logger.info('Successfully stopped watching issue', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        issue_id: params.issue_id,
      });
    } catch (error) {
      this.logger.error('Failed to stop watching issue', { params, error });
      throw error;
    }
  }

  /**
   * List milestones
   */
  async listMilestones(params: ListMilestonesParams): Promise<PagedResponse<IssueMilestone>> {
    this.logger.info('Listing milestones', { params });

    try {
      const queryParams: Record<string, any> = {};

      if (params.page) queryParams.page = params.page;
      if (params.pagelen) queryParams.pagelen = params.pagelen;

      const response = await this.apiClient.get<PagedResponse<IssueMilestone>>(
        `/repositories/${params.workspace}/${params.repo_slug}/milestones`,
        { params: queryParams }
      );

      this.logger.info('Successfully listed milestones', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list milestones', { params, error });
      throw error;
    }
  }

  /**
   * Get a milestone
   */
  async getMilestone(params: GetMilestoneParams): Promise<IssueMilestone> {
    this.logger.info('Getting milestone', { params });

    try {
      const response = await this.apiClient.get<IssueMilestone>(
        `/repositories/${params.workspace}/${params.repo_slug}/milestones/${params.milestone_id}`
      );

      this.logger.info('Successfully retrieved milestone', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        milestone_id: params.milestone_id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get milestone', { params, error });
      throw error;
    }
  }

  /**
   * List defined versions for issues
   */
  async listVersions(params: ListVersionsParams): Promise<PagedResponse<IssueVersion>> {
    this.logger.info('Listing versions', { params });

    try {
      const queryParams: Record<string, any> = {};

      if (params.page) queryParams.page = params.page;
      if (params.pagelen) queryParams.pagelen = params.pagelen;

      const response = await this.apiClient.get<PagedResponse<IssueVersion>>(
        `/repositories/${params.workspace}/${params.repo_slug}/versions`,
        { params: queryParams }
      );

      this.logger.info('Successfully listed versions', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list versions', { params, error });
      throw error;
    }
  }

  /**
   * Get a defined version for issues
   */
  async getVersion(params: GetVersionParams): Promise<IssueVersion> {
    this.logger.info('Getting version', { params });

    try {
      const response = await this.apiClient.get<IssueVersion>(
        `/repositories/${params.workspace}/${params.repo_slug}/versions/${params.version_id}`
      );

      this.logger.info('Successfully retrieved version', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        version_id: params.version_id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get version', { params, error });
      throw error;
    }
  }
}
