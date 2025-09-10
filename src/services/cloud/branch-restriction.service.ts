/**
 * Branch Restriction Service for Bitbucket Cloud REST API
 * Handles all branch restriction-related operations
 * Based on: https://developer.atlassian.com/cloud/bitbucket/rest/api-group-branch-restrictions/
 */

import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';
import { PagedResponse, PaginationParams, ErrorResponse } from './types/base.types.js';
import {
  BranchRestriction,
  CreateBranchRestrictionRequest,
  UpdateBranchRestrictionRequest,
  ListBranchRestrictionsParams,
  CreateBranchRestrictionParams,
  GetBranchRestrictionParams,
  UpdateBranchRestrictionParams,
  DeleteBranchRestrictionParams,
} from './types/branch-restriction.types.js';

export class BranchRestrictionService {
  private apiClient: ApiClient;
  private logger: Logger;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.logger = Logger.forContext('BranchRestrictionService');
  }

  /**
   * List branch restrictions
   * Returns a paginated list of all branch restrictions on the repository.
   */
  async listBranchRestrictions(
    params: ListBranchRestrictionsParams
  ): Promise<PagedResponse<BranchRestriction>> {
    this.logger.info('Listing branch restrictions', { params });

    try {
      const queryParams: Record<string, any> = {
        page: params.page,
        pagelen: params.pagelen,
      };

      if (params.kind) queryParams.kind = params.kind;
      if (params.pattern) queryParams.pattern = params.pattern;

      const response = await this.apiClient.get<PagedResponse<BranchRestriction>>(
        `/repositories/${params.workspace}/${params.repo_slug}/branch-restrictions`,
        { params: queryParams }
      );

      this.logger.info('Successfully listed branch restrictions', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list branch restrictions', { params, error });
      throw error;
    }
  }

  /**
   * Create a branch restriction rule
   * Creates a new branch restriction rule for a repository.
   */
  async createBranchRestriction(params: CreateBranchRestrictionParams): Promise<BranchRestriction> {
    this.logger.info('Creating branch restriction', { params });

    try {
      const response = await this.apiClient.post<BranchRestriction>(
        `/repositories/${params.workspace}/${params.repo_slug}/branch-restrictions`,
        params.branch_restriction
      );

      this.logger.info('Successfully created branch restriction', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        restriction_id: response.data.id,
        kind: response.data.kind,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create branch restriction', { params, error });
      throw error;
    }
  }

  /**
   * Get a branch restriction rule
   * Returns a specific branch restriction rule.
   */
  async getBranchRestriction(params: GetBranchRestrictionParams): Promise<BranchRestriction> {
    this.logger.info('Getting branch restriction', { params });

    try {
      const response = await this.apiClient.get<BranchRestriction>(
        `/repositories/${params.workspace}/${params.repo_slug}/branch-restrictions/${params.id}`
      );

      this.logger.info('Successfully retrieved branch restriction', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        id: params.id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get branch restriction', { params, error });
      throw error;
    }
  }

  /**
   * Update a branch restriction rule
   * Updates an existing branch restriction rule.
   */
  async updateBranchRestriction(params: UpdateBranchRestrictionParams): Promise<BranchRestriction> {
    this.logger.info('Updating branch restriction', { params });

    try {
      const response = await this.apiClient.put<BranchRestriction>(
        `/repositories/${params.workspace}/${params.repo_slug}/branch-restrictions/${params.id}`,
        params.branch_restriction
      );

      this.logger.info('Successfully updated branch restriction', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        id: params.id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update branch restriction', { params, error });
      throw error;
    }
  }

  /**
   * Delete a branch restriction rule
   * Deletes an existing branch restriction rule.
   */
  async deleteBranchRestriction(params: DeleteBranchRestrictionParams): Promise<void> {
    this.logger.info('Deleting branch restriction', { params });

    try {
      await this.apiClient.delete(
        `/repositories/${params.workspace}/${params.repo_slug}/branch-restrictions/${params.id}`
      );

      this.logger.info('Successfully deleted branch restriction', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        id: params.id,
      });
    } catch (error) {
      this.logger.error('Failed to delete branch restriction', { params, error });
      throw error;
    }
  }
}
