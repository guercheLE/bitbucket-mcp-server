/**
 * Search Service for Bitbucket Cloud REST API
 * Handles all search-related operations
 * Based on: https://developer.atlassian.com/cloud/bitbucket/rest/api-group-other-operations/
 */

import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';
import { PagedResponse, PaginationParams, ErrorResponse } from './types/base.types.js';
import {
  CodeSearchResult,
  SearchResultPage,
  SearchTeamCodeParams,
  SearchUserCodeParams,
  SearchWorkspaceCodeParams,
} from './types/search.types.js';

export class SearchService {
  private apiClient: ApiClient;
  private logger: Logger;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.logger = Logger.forContext('SearchService');
  }

  /**
   * Search for code in a team's repositories
   * Search for code in the repositories of the specified team.
   */
  async searchTeamCode(params: SearchTeamCodeParams): Promise<SearchResultPage> {
    this.logger.info('Searching team code', { params });

    try {
      const queryParams: Record<string, any> = {
        search_query: params.search_query,
        page: params.page,
        pagelen: params.pagelen,
      };

      const response = await this.apiClient.get<SearchResultPage>(
        `/teams/${params.username}/search/code`,
        { params: queryParams }
      );

      this.logger.info('Successfully searched team code', {
        username: params.username,
        search_query: params.search_query,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to search team code', { params, error });
      throw error;
    }
  }

  /**
   * Search for code in a user's repositories
   * Search for code in the repositories of the specified user.
   */
  async searchUserCode(params: SearchUserCodeParams): Promise<SearchResultPage> {
    this.logger.info('Searching user code', { params });

    try {
      const queryParams: Record<string, any> = {
        search_query: params.search_query,
        page: params.page,
        pagelen: params.pagelen,
      };

      const response = await this.apiClient.get<SearchResultPage>(
        `/users/${params.selected_user}/search/code`,
        { params: queryParams }
      );

      this.logger.info('Successfully searched user code', {
        selected_user: params.selected_user,
        search_query: params.search_query,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to search user code', { params, error });
      throw error;
    }
  }

  /**
   * Search for code in a workspace
   * Search for code in the repositories of the specified workspace.
   */
  async searchWorkspaceCode(params: SearchWorkspaceCodeParams): Promise<SearchResultPage> {
    this.logger.info('Searching workspace code', { params });

    try {
      const queryParams: Record<string, any> = {
        search_query: params.search_query,
        page: params.page,
        pagelen: params.pagelen,
      };

      const response = await this.apiClient.get<SearchResultPage>(
        `/workspaces/${params.workspace}/search/code`,
        { params: queryParams }
      );

      this.logger.info('Successfully searched workspace code', {
        workspace: params.workspace,
        search_query: params.search_query,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to search workspace code', { params, error });
      throw error;
    }
  }
}
