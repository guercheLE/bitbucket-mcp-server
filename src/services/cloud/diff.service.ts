/**
 * Diff Service for Bitbucket Cloud REST API
 * Handles all diff-related operations
 * Based on: https://developer.atlassian.com/cloud/bitbucket/rest/api-group-commits/
 */

import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';
import { PagedResponse, PaginationParams, ErrorResponse } from './types/base.types.js';
import {
  DiffStat,
  GetDiffParams,
  GetDiffStatParams,
  GetPatchParams,
  GetMergeBaseParams,
} from './types/diff.types.js';
import { Commit } from './types/commit.types.js';

export class DiffService {
  private apiClient: ApiClient;
  private logger: Logger;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.logger = Logger.forContext('DiffService');
  }

  /**
   * Compare two commits
   * Produces a raw git-style diff.
   */
  async getDiff(params: GetDiffParams): Promise<string> {
    this.logger.info('Getting diff', { params });

    try {
      const queryParams: Record<string, any> = {};
      if (params.context !== undefined) queryParams.context = params.context;
      if (params.path) queryParams.path = params.path;
      if (params.ignore_whitespace !== undefined)
        queryParams.ignore_whitespace = params.ignore_whitespace;
      if (params.binary !== undefined) queryParams.binary = params.binary;
      if (params.renames !== undefined) queryParams.renames = params.renames;
      if (params.merge !== undefined) queryParams.merge = params.merge;
      if (params.topic !== undefined) queryParams.topic = params.topic;

      const response = await this.apiClient.get<string>(
        `/repositories/${params.workspace}/${params.repo_slug}/diff/${params.spec}`,
        { params: queryParams }
      );

      this.logger.info('Successfully retrieved diff', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        spec: params.spec,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get diff', { params, error });
      throw error;
    }
  }

  /**
   * Compare two commit diff stats
   * Produces a response in JSON format with a record for every path modified.
   */
  async getDiffStat(params: GetDiffStatParams): Promise<PagedResponse<DiffStat>> {
    this.logger.info('Getting diff stat', { params });

    try {
      const queryParams: Record<string, any> = {};
      if (params.ignore_whitespace !== undefined)
        queryParams.ignore_whitespace = params.ignore_whitespace;
      if (params.merge !== undefined) queryParams.merge = params.merge;
      if (params.path) queryParams.path = params.path;
      if (params.renames !== undefined) queryParams.renames = params.renames;
      if (params.topic !== undefined) queryParams.topic = params.topic;

      const response = await this.apiClient.get<PagedResponse<DiffStat>>(
        `/repositories/${params.workspace}/${params.repo_slug}/diffstat/${params.spec}`,
        { params: queryParams }
      );

      this.logger.info('Successfully retrieved diff stat', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        spec: params.spec,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get diff stat', { params, error });
      throw error;
    }
  }

  /**
   * Get a patch for two commits
   * Produces a raw patch for a single commit or a patch-series for a revspec.
   */
  async getPatch(params: GetPatchParams): Promise<string> {
    this.logger.info('Getting patch', { params });

    try {
      const response = await this.apiClient.get<string>(
        `/repositories/${params.workspace}/${params.repo_slug}/patch/${params.spec}`
      );

      this.logger.info('Successfully retrieved patch', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        spec: params.spec,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get patch', { params, error });
      throw error;
    }
  }

  /**
   * Get the common ancestor between two commits
   * Returns the best common ancestor between two commits.
   */
  async getMergeBase(params: GetMergeBaseParams): Promise<Commit> {
    this.logger.info('Getting merge base', { params });

    try {
      const response = await this.apiClient.get<Commit>(
        `/repositories/${params.workspace}/${params.repo_slug}/merge-base/${params.revspec}`
      );

      this.logger.info('Successfully retrieved merge base', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        revspec: params.revspec,
        hash: response.data.hash,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get merge base', { params, error });
      throw error;
    }
  }
}
