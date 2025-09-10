/**
 * Snippet Service for Bitbucket Cloud REST API
 * Handles all snippet-related operations
 * Based on: https://developer.atlassian.com/cloud/bitbucket/rest/api-group-snippets/
 */

import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';
import { PagedResponse, PaginationParams, ErrorResponse } from './types/base.types.js';
import {
  Snippet,
  SnippetComment,
  SnippetCommit,
  SnippetFile,
  SnippetWatcher,
  CreateSnippetRequest,
  UpdateSnippetRequest,
  CreateSnippetCommentRequest,
  UpdateSnippetCommentRequest,
  ListSnippetsParams,
  ListWorkspaceSnippetsParams,
  GetSnippetParams,
  UpdateSnippetParams,
  DeleteSnippetParams,
  ListSnippetCommentsParams,
  CreateSnippetCommentParams,
  GetSnippetCommentParams,
  UpdateSnippetCommentParams,
  DeleteSnippetCommentParams,
  ListSnippetCommitsParams,
  GetSnippetCommitParams,
  GetSnippetFileParams,
  WatchSnippetParams,
  ListSnippetWatchersParams,
  GetSnippetRevisionParams,
  UpdateSnippetRevisionParams,
  DeleteSnippetRevisionParams,
  GetSnippetDiffParams,
  GetSnippetPatchParams,
} from './types/snippet.types.js';

export class SnippetService {
  private apiClient: ApiClient;
  private logger: Logger;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.logger = Logger.forContext('SnippetService');
  }

  /**
   * List snippets
   * Returns all snippets. Like pull requests, repositories and workspaces, the full set of snippets is defined by what the current user has access to.
   */
  async listSnippets(params?: ListSnippetsParams): Promise<PagedResponse<Snippet>> {
    this.logger.info('Listing snippets', { params });

    try {
      const queryParams: Record<string, any> = {};

      if (params?.page) queryParams.page = params.page;
      if (params?.pagelen) queryParams.pagelen = params.pagelen;
      if (params?.role) queryParams.role = params.role;

      const response = await this.apiClient.get<PagedResponse<Snippet>>('/snippets', {
        params: queryParams,
      });

      this.logger.info('Successfully listed snippets', {
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list snippets', { params, error });
      throw error;
    }
  }

  /**
   * Create a snippet
   */
  async createSnippet(params: { snippet: CreateSnippetRequest }): Promise<Snippet> {
    this.logger.info('Creating snippet', { params });

    try {
      const response = await this.apiClient.post<Snippet>('/snippets', params.snippet);

      this.logger.info('Successfully created snippet', {
        snippet_id: response.data.id,
        title: response.data.title,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create snippet', { params, error });
      throw error;
    }
  }

  /**
   * List snippets in a workspace
   */
  async listWorkspaceSnippets(
    params: ListWorkspaceSnippetsParams
  ): Promise<PagedResponse<Snippet>> {
    this.logger.info('Listing workspace snippets', { params });

    try {
      const queryParams: Record<string, any> = {};

      if (params.page) queryParams.page = params.page;
      if (params.pagelen) queryParams.pagelen = params.pagelen;
      if (params.role) queryParams.role = params.role;

      const response = await this.apiClient.get<PagedResponse<Snippet>>(
        `/snippets/${params.workspace}`,
        { params: queryParams }
      );

      this.logger.info('Successfully listed workspace snippets', {
        workspace: params.workspace,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list workspace snippets', { params, error });
      throw error;
    }
  }

  /**
   * Create a snippet for a workspace
   */
  async createWorkspaceSnippet(params: {
    workspace: string;
    snippet: CreateSnippetRequest;
  }): Promise<Snippet> {
    this.logger.info('Creating workspace snippet', { params });

    try {
      const response = await this.apiClient.post<Snippet>(
        `/snippets/${params.workspace}`,
        params.snippet
      );

      this.logger.info('Successfully created workspace snippet', {
        workspace: params.workspace,
        snippet_id: response.data.id,
        title: response.data.title,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create workspace snippet', { params, error });
      throw error;
    }
  }

  /**
   * Get a snippet
   */
  async getSnippet(params: GetSnippetParams): Promise<Snippet> {
    this.logger.info('Getting snippet', { params });

    try {
      const response = await this.apiClient.get<Snippet>(
        `/snippets/${params.workspace}/${params.encoded_id}`
      );

      this.logger.info('Successfully retrieved snippet', {
        workspace: params.workspace,
        encoded_id: params.encoded_id,
        snippet_id: response.data.id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get snippet', { params, error });
      throw error;
    }
  }

  /**
   * Update a snippet
   */
  async updateSnippet(params: UpdateSnippetParams): Promise<Snippet> {
    this.logger.info('Updating snippet', { params });

    try {
      const response = await this.apiClient.put<Snippet>(
        `/snippets/${params.workspace}/${params.encoded_id}`,
        params.snippet
      );

      this.logger.info('Successfully updated snippet', {
        workspace: params.workspace,
        encoded_id: params.encoded_id,
        snippet_id: response.data.id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update snippet', { params, error });
      throw error;
    }
  }

  /**
   * Delete a snippet
   */
  async deleteSnippet(params: DeleteSnippetParams): Promise<void> {
    this.logger.info('Deleting snippet', { params });

    try {
      await this.apiClient.delete(`/snippets/${params.workspace}/${params.encoded_id}`);

      this.logger.info('Successfully deleted snippet', {
        workspace: params.workspace,
        encoded_id: params.encoded_id,
      });
    } catch (error) {
      this.logger.error('Failed to delete snippet', { params, error });
      throw error;
    }
  }

  /**
   * List comments on a snippet
   */
  async listSnippetComments(
    params: ListSnippetCommentsParams
  ): Promise<PagedResponse<SnippetComment>> {
    this.logger.info('Listing snippet comments', { params });

    try {
      const queryParams: Record<string, any> = {};

      if (params.page) queryParams.page = params.page;
      if (params.pagelen) queryParams.pagelen = params.pagelen;

      const response = await this.apiClient.get<PagedResponse<SnippetComment>>(
        `/snippets/${params.workspace}/${params.encoded_id}/comments`,
        { params: queryParams }
      );

      this.logger.info('Successfully listed snippet comments', {
        workspace: params.workspace,
        encoded_id: params.encoded_id,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list snippet comments', { params, error });
      throw error;
    }
  }

  /**
   * Create a comment on a snippet
   */
  async createSnippetComment(params: CreateSnippetCommentParams): Promise<SnippetComment> {
    this.logger.info('Creating snippet comment', { params });

    try {
      const response = await this.apiClient.post<SnippetComment>(
        `/snippets/${params.workspace}/${params.encoded_id}/comments`,
        {
          content: {
            raw: params.comment.content,
          },
          inline: params.comment.inline,
        }
      );

      this.logger.info('Successfully created snippet comment', {
        workspace: params.workspace,
        encoded_id: params.encoded_id,
        comment_id: response.data.id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create snippet comment', { params, error });
      throw error;
    }
  }

  /**
   * Get a comment on a snippet
   */
  async getSnippetComment(params: GetSnippetCommentParams): Promise<SnippetComment> {
    this.logger.info('Getting snippet comment', { params });

    try {
      const response = await this.apiClient.get<SnippetComment>(
        `/snippets/${params.workspace}/${params.encoded_id}/comments/${params.comment_id}`
      );

      this.logger.info('Successfully retrieved snippet comment', {
        workspace: params.workspace,
        encoded_id: params.encoded_id,
        comment_id: params.comment_id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get snippet comment', { params, error });
      throw error;
    }
  }

  /**
   * Update a comment on a snippet
   */
  async updateSnippetComment(params: UpdateSnippetCommentParams): Promise<SnippetComment> {
    this.logger.info('Updating snippet comment', { params });

    try {
      const response = await this.apiClient.put<SnippetComment>(
        `/snippets/${params.workspace}/${params.encoded_id}/comments/${params.comment_id}`,
        {
          content: {
            raw: params.comment.content,
          },
        }
      );

      this.logger.info('Successfully updated snippet comment', {
        workspace: params.workspace,
        encoded_id: params.encoded_id,
        comment_id: params.comment_id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update snippet comment', { params, error });
      throw error;
    }
  }

  /**
   * Delete a comment on a snippet
   */
  async deleteSnippetComment(params: DeleteSnippetCommentParams): Promise<void> {
    this.logger.info('Deleting snippet comment', { params });

    try {
      await this.apiClient.delete(
        `/snippets/${params.workspace}/${params.encoded_id}/comments/${params.comment_id}`
      );

      this.logger.info('Successfully deleted snippet comment', {
        workspace: params.workspace,
        encoded_id: params.encoded_id,
        comment_id: params.comment_id,
      });
    } catch (error) {
      this.logger.error('Failed to delete snippet comment', { params, error });
      throw error;
    }
  }

  /**
   * List snippet changes
   */
  async listSnippetChanges(
    params: ListSnippetCommitsParams
  ): Promise<PagedResponse<SnippetCommit>> {
    this.logger.info('Listing snippet changes', { params });

    try {
      const queryParams: Record<string, any> = {};

      if (params.page) queryParams.page = params.page;
      if (params.pagelen) queryParams.pagelen = params.pagelen;

      const response = await this.apiClient.get<PagedResponse<SnippetCommit>>(
        `/snippets/${params.workspace}/${params.encoded_id}/commits`,
        { params: queryParams }
      );

      this.logger.info('Successfully listed snippet changes', {
        workspace: params.workspace,
        encoded_id: params.encoded_id,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list snippet changes', { params, error });
      throw error;
    }
  }

  /**
   * Get a previous snippet change
   */
  async getSnippetCommit(params: GetSnippetCommitParams): Promise<SnippetCommit> {
    this.logger.info('Getting snippet commit', { params });

    try {
      const response = await this.apiClient.get<SnippetCommit>(
        `/snippets/${params.workspace}/${params.encoded_id}/commits/${params.revision}`
      );

      this.logger.info('Successfully retrieved snippet commit', {
        workspace: params.workspace,
        encoded_id: params.encoded_id,
        revision: params.revision,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get snippet commit', { params, error });
      throw error;
    }
  }

  /**
   * Get a snippet's raw file at HEAD
   */
  async getSnippetFile(params: GetSnippetFileParams): Promise<string> {
    this.logger.info('Getting snippet file', { params });

    try {
      const url = params.node_id
        ? `/snippets/${params.workspace}/${params.encoded_id}/${params.node_id}/files/${params.path}`
        : `/snippets/${params.workspace}/${params.encoded_id}/files/${params.path}`;

      const response = await this.apiClient.get<string>(url);

      this.logger.info('Successfully retrieved snippet file', {
        workspace: params.workspace,
        encoded_id: params.encoded_id,
        path: params.path,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get snippet file', { params, error });
      throw error;
    }
  }

  /**
   * Check if the current user is watching a snippet
   */
  async isWatchingSnippet(params: GetSnippetParams): Promise<boolean> {
    this.logger.info('Checking if watching snippet', { params });

    try {
      await this.apiClient.get(`/snippets/${params.workspace}/${params.encoded_id}/watch`);

      this.logger.info('User is watching snippet', {
        workspace: params.workspace,
        encoded_id: params.encoded_id,
      });
      return true;
    } catch (error) {
      this.logger.info('User is not watching snippet', {
        workspace: params.workspace,
        encoded_id: params.encoded_id,
      });
      return false;
    }
  }

  /**
   * Watch a snippet
   */
  async watchSnippet(params: WatchSnippetParams): Promise<void> {
    this.logger.info('Watching snippet', { params });

    try {
      await this.apiClient.put(`/snippets/${params.workspace}/${params.encoded_id}/watch`);

      this.logger.info('Successfully started watching snippet', {
        workspace: params.workspace,
        encoded_id: params.encoded_id,
      });
    } catch (error) {
      this.logger.error('Failed to watch snippet', { params, error });
      throw error;
    }
  }

  /**
   * Stop watching a snippet
   */
  async stopWatchingSnippet(params: WatchSnippetParams): Promise<void> {
    this.logger.info('Stopping watching snippet', { params });

    try {
      await this.apiClient.delete(`/snippets/${params.workspace}/${params.encoded_id}/watch`);

      this.logger.info('Successfully stopped watching snippet', {
        workspace: params.workspace,
        encoded_id: params.encoded_id,
      });
    } catch (error) {
      this.logger.error('Failed to stop watching snippet', { params, error });
      throw error;
    }
  }

  /**
   * List users watching a snippet
   */
  async listSnippetWatchers(
    params: ListSnippetWatchersParams
  ): Promise<PagedResponse<SnippetWatcher>> {
    this.logger.info('Listing snippet watchers', { params });

    try {
      const queryParams: Record<string, any> = {};

      if (params.page) queryParams.page = params.page;
      if (params.pagelen) queryParams.pagelen = params.pagelen;

      const response = await this.apiClient.get<PagedResponse<SnippetWatcher>>(
        `/snippets/${params.workspace}/${params.encoded_id}/watchers`,
        { params: queryParams }
      );

      this.logger.info('Successfully listed snippet watchers', {
        workspace: params.workspace,
        encoded_id: params.encoded_id,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list snippet watchers', { params, error });
      throw error;
    }
  }

  /**
   * Get a previous revision of a snippet
   */
  async getSnippetRevision(params: GetSnippetRevisionParams): Promise<Snippet> {
    this.logger.info('Getting snippet revision', { params });

    try {
      const response = await this.apiClient.get<Snippet>(
        `/snippets/${params.workspace}/${params.encoded_id}/${params.node_id}`
      );

      this.logger.info('Successfully retrieved snippet revision', {
        workspace: params.workspace,
        encoded_id: params.encoded_id,
        node_id: params.node_id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get snippet revision', { params, error });
      throw error;
    }
  }

  /**
   * Update a previous revision of a snippet
   */
  async updateSnippetRevision(params: UpdateSnippetRevisionParams): Promise<Snippet> {
    this.logger.info('Updating snippet revision', { params });

    try {
      const response = await this.apiClient.put<Snippet>(
        `/snippets/${params.workspace}/${params.encoded_id}/${params.node_id}`,
        params.snippet
      );

      this.logger.info('Successfully updated snippet revision', {
        workspace: params.workspace,
        encoded_id: params.encoded_id,
        node_id: params.node_id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update snippet revision', { params, error });
      throw error;
    }
  }

  /**
   * Delete a previous revision of a snippet
   */
  async deleteSnippetRevision(params: DeleteSnippetRevisionParams): Promise<void> {
    this.logger.info('Deleting snippet revision', { params });

    try {
      await this.apiClient.delete(
        `/snippets/${params.workspace}/${params.encoded_id}/${params.node_id}`
      );

      this.logger.info('Successfully deleted snippet revision', {
        workspace: params.workspace,
        encoded_id: params.encoded_id,
        node_id: params.node_id,
      });
    } catch (error) {
      this.logger.error('Failed to delete snippet revision', { params, error });
      throw error;
    }
  }

  /**
   * Get snippet changes between versions
   */
  async getSnippetDiff(params: GetSnippetDiffParams): Promise<any> {
    this.logger.info('Getting snippet diff', { params });

    try {
      const response = await this.apiClient.get(
        `/snippets/${params.workspace}/${params.encoded_id}/${params.revision}/diff`
      );

      this.logger.info('Successfully retrieved snippet diff', {
        workspace: params.workspace,
        encoded_id: params.encoded_id,
        revision: params.revision,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get snippet diff', { params, error });
      throw error;
    }
  }

  /**
   * Get snippet patch between versions
   */
  async getSnippetPatch(params: GetSnippetPatchParams): Promise<any> {
    this.logger.info('Getting snippet patch', { params });

    try {
      const response = await this.apiClient.get(
        `/snippets/${params.workspace}/${params.encoded_id}/${params.revision}/patch`
      );

      this.logger.info('Successfully retrieved snippet patch', {
        workspace: params.workspace,
        encoded_id: params.encoded_id,
        revision: params.revision,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get snippet patch', { params, error });
      throw error;
    }
  }
}
