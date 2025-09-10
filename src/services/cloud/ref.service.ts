/**
 * Ref Service for Bitbucket Cloud REST API
 * Handles all ref-related operations (branches and tags)
 * Based on: https://developer.atlassian.com/cloud/bitbucket/rest/api-group-refs/
 */

import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';
import { PagedResponse, PaginationParams, ErrorResponse } from './types/base.types.js';
import {
  Ref,
  Branch,
  Tag,
  CreateRefBranchRequest,
  CreateRefTagRequest,
  ListRefsParams,
  ListBranchesParams,
  CreateBranchParams,
  GetBranchParams,
  DeleteBranchParams,
  ListTagsParams,
  CreateTagParams,
  GetTagParams,
  DeleteTagParams,
} from './types/ref.types.js';

export class RefService {
  private apiClient: ApiClient;
  private logger: Logger;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.logger = Logger.forContext('RefService');
  }

  /**
   * List branches and tags
   * Returns the branches and tags in the repository.
   */
  async listRefs(params: ListRefsParams): Promise<PagedResponse<Ref>> {
    this.logger.info('Listing refs', { params });

    try {
      const queryParams: Record<string, any> = {
        page: params.page,
        pagelen: params.pagelen,
      };

      if (params.q) queryParams.q = params.q;
      if (params.sort) queryParams.sort = params.sort;

      const response = await this.apiClient.get<PagedResponse<Ref>>(
        `/repositories/${params.workspace}/${params.repo_slug}/refs`,
        { params: queryParams }
      );

      this.logger.info('Successfully listed refs', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list refs', { params, error });
      throw error;
    }
  }

  /**
   * List open branches
   * Returns a list of all open branches within the specified repository.
   */
  async listBranches(params: ListBranchesParams): Promise<PagedResponse<Branch>> {
    this.logger.info('Listing branches', { params });

    try {
      const queryParams: Record<string, any> = {
        page: params.page,
        pagelen: params.pagelen,
      };

      if (params.q) queryParams.q = params.q;
      if (params.sort) queryParams.sort = params.sort;

      const response = await this.apiClient.get<PagedResponse<Branch>>(
        `/repositories/${params.workspace}/${params.repo_slug}/refs/branches`,
        { params: queryParams }
      );

      this.logger.info('Successfully listed branches', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list branches', { params, error });
      throw error;
    }
  }

  /**
   * Create a branch
   * Creates a new branch in the specified repository.
   */
  async createBranch(params: CreateBranchParams): Promise<Branch> {
    this.logger.info('Creating branch', { params });

    try {
      const response = await this.apiClient.post<Branch>(
        `/repositories/${params.workspace}/${params.repo_slug}/refs/branches`,
        params.branch
      );

      this.logger.info('Successfully created branch', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        branch_name: params.branch.name,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create branch', { params, error });
      throw error;
    }
  }

  /**
   * Get a branch
   * Returns a branch object within the specified repository.
   */
  async getBranch(params: GetBranchParams): Promise<Branch> {
    this.logger.info('Getting branch', { params });

    try {
      const response = await this.apiClient.get<Branch>(
        `/repositories/${params.workspace}/${params.repo_slug}/refs/branches/${params.name}`
      );

      this.logger.info('Successfully retrieved branch', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        branch_name: params.name,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get branch', { params, error });
      throw error;
    }
  }

  /**
   * Delete a branch
   * Delete a branch in the specified repository.
   */
  async deleteBranch(params: DeleteBranchParams): Promise<void> {
    this.logger.info('Deleting branch', { params });

    try {
      await this.apiClient.delete(
        `/repositories/${params.workspace}/${params.repo_slug}/refs/branches/${params.name}`
      );

      this.logger.info('Successfully deleted branch', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        branch_name: params.name,
      });
    } catch (error) {
      this.logger.error('Failed to delete branch', { params, error });
      throw error;
    }
  }

  /**
   * List tags
   * Returns the tags in the repository.
   */
  async listTags(params: ListTagsParams): Promise<PagedResponse<Tag>> {
    this.logger.info('Listing tags', { params });

    try {
      const queryParams: Record<string, any> = {
        page: params.page,
        pagelen: params.pagelen,
      };

      if (params.q) queryParams.q = params.q;
      if (params.sort) queryParams.sort = params.sort;

      const response = await this.apiClient.get<PagedResponse<Tag>>(
        `/repositories/${params.workspace}/${params.repo_slug}/refs/tags`,
        { params: queryParams }
      );

      this.logger.info('Successfully listed tags', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list tags', { params, error });
      throw error;
    }
  }

  /**
   * Create a tag
   * Creates a new tag in the specified repository.
   */
  async createTag(params: CreateTagParams): Promise<Tag> {
    this.logger.info('Creating tag', { params });

    try {
      const response = await this.apiClient.post<Tag>(
        `/repositories/${params.workspace}/${params.repo_slug}/refs/tags`,
        params.tag
      );

      this.logger.info('Successfully created tag', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        tag_name: params.tag.name,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create tag', { params, error });
      throw error;
    }
  }

  /**
   * Get a tag
   * Returns the specified tag.
   */
  async getTag(params: GetTagParams): Promise<Tag> {
    this.logger.info('Getting tag', { params });

    try {
      const response = await this.apiClient.get<Tag>(
        `/repositories/${params.workspace}/${params.repo_slug}/refs/tags/${params.name}`
      );

      this.logger.info('Successfully retrieved tag', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        tag_name: params.name,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get tag', { params, error });
      throw error;
    }
  }

  /**
   * Delete a tag
   * Delete a tag in the specified repository.
   */
  async deleteTag(params: DeleteTagParams): Promise<void> {
    this.logger.info('Deleting tag', { params });

    try {
      await this.apiClient.delete(
        `/repositories/${params.workspace}/${params.repo_slug}/refs/tags/${params.name}`
      );

      this.logger.info('Successfully deleted tag', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        tag_name: params.name,
      });
    } catch (error) {
      this.logger.error('Failed to delete tag', { params, error });
      throw error;
    }
  }
}
