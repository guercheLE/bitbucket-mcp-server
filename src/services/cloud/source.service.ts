/**
 * Source Service for Bitbucket Cloud REST API
 * Handles all source-related operations (file browsing and commits)
 * Based on: https://developer.atlassian.com/cloud/bitbucket/rest/api-group-source/
 */

import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';
import { PagedResponse, PaginationParams, ErrorResponse } from './types/base.types.js';
import {
  CommitFile,
  CommitDirectory,
  FileHistoryEntry,
  CreateCommitRequest,
  ListFileHistoryParams,
  GetRootDirectoryParams,
  CreateCommitParams,
  GetFileOrDirectoryParams,
} from './types/source.types.js';

export class SourceService {
  private apiClient: ApiClient;
  private logger: Logger;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.logger = Logger.forContext('SourceService');
  }

  /**
   * List commits that modified a file
   * Returns a paginated list of commits that modified the specified file.
   */
  async listFileHistory(params: ListFileHistoryParams): Promise<PagedResponse<FileHistoryEntry>> {
    this.logger.info('Listing file history', { params });

    try {
      const queryParams: Record<string, any> = {
        page: params.page,
        pagelen: params.pagelen,
      };

      if (params.renames !== undefined) queryParams.renames = params.renames;
      if (params.q) queryParams.q = params.q;
      if (params.sort) queryParams.sort = params.sort;

      const response = await this.apiClient.get<PagedResponse<FileHistoryEntry>>(
        `/repositories/${params.workspace}/${params.repo_slug}/filehistory/${params.commit}/${params.path}`,
        { params: queryParams }
      );

      this.logger.info('Successfully listed file history', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        commit: params.commit,
        path: params.path,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list file history', { params, error });
      throw error;
    }
  }

  /**
   * Get the root directory of the main branch
   * This endpoint redirects the client to the directory listing of the root directory on the main branch.
   */
  async getRootDirectory(
    params: GetRootDirectoryParams
  ): Promise<PagedResponse<CommitFile | CommitDirectory>> {
    this.logger.info('Getting root directory', { params });

    try {
      const queryParams: Record<string, any> = {};
      if (params.format) queryParams.format = params.format;

      const response = await this.apiClient.get<PagedResponse<CommitFile | CommitDirectory>>(
        `/repositories/${params.workspace}/${params.repo_slug}/src`,
        { params: queryParams }
      );

      this.logger.info('Successfully retrieved root directory', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get root directory', { params, error });
      throw error;
    }
  }

  /**
   * Create a commit by uploading a file
   * This endpoint is used to create new commits in the repository by uploading files.
   */
  async createCommit(params: CreateCommitParams): Promise<any> {
    this.logger.info('Creating commit', { params });

    try {
      const formData = new FormData();

      // Add commit metadata
      formData.append('message', params.commit.message);
      if (params.commit.author) formData.append('author', params.commit.author);
      if (params.commit.parents) formData.append('parents', params.commit.parents);
      if (params.commit.branch) formData.append('branch', params.commit.branch);

      // Add files
      if (params.files) {
        for (const [path, content] of Object.entries(params.files)) {
          if (content instanceof Buffer) {
            formData.append(path, new Blob([content]));
          } else {
            formData.append(path, content);
          }
        }
      }

      const response = await this.apiClient.post(
        `/repositories/${params.workspace}/${params.repo_slug}/src`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      this.logger.info('Successfully created commit', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        message: params.commit.message,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create commit', { params, error });
      throw error;
    }
  }

  /**
   * Get file or directory contents
   * This endpoint is used to retrieve the contents of a single file, or the contents of a directory at a specified revision.
   */
  async getFileOrDirectory(
    params: GetFileOrDirectoryParams
  ): Promise<PagedResponse<CommitFile | CommitDirectory> | string> {
    this.logger.info('Getting file or directory', { params });

    try {
      const queryParams: Record<string, any> = {
        page: params.page,
        pagelen: params.pagelen,
      };

      if (params.format) queryParams.format = params.format;
      if (params.q) queryParams.q = params.q;
      if (params.sort) queryParams.sort = params.sort;
      if (params.max_depth) queryParams.max_depth = params.max_depth;

      const response = await this.apiClient.get<
        PagedResponse<CommitFile | CommitDirectory> | string
      >(
        `/repositories/${params.workspace}/${params.repo_slug}/src/${params.commit}/${params.path}`,
        { params: queryParams }
      );

      this.logger.info('Successfully retrieved file or directory', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        commit: params.commit,
        path: params.path,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get file or directory', { params, error });
      throw error;
    }
  }
}
