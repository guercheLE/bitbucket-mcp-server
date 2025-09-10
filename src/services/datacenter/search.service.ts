/**
 * Search Service for Bitbucket Data Center REST API
 * Based on official documentation: https://developer.atlassian.com/server/bitbucket/rest/v906/intro/
 */

import {
  CodeSearchResult,
  CommitSearchResult,
  PullRequestSearchResult,
  RepositorySearchResult,
  SearchAnalytics,
  SearchAnalyticsListResponse,
  SearchAnalyticsResponse,
  SearchConfiguration,
  SearchConfigurationResponse,
  SearchHistory,
  SearchHistoryListResponse,
  SearchHistoryResponse,
  SearchIndex,
  SearchIndexListResponse,
  SearchIndexResponse,
  SearchRequest,
  SearchResponse,
  SearchStatistics,
  SearchStatisticsResponse,
  SearchSuggestions,
  UserSearchResult,
} from './types/search.types.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';

export class SearchService {
  private readonly apiClient: ApiClient;
  private readonly logger: Logger;

  constructor(apiClient: ApiClient, logger: Logger) {
    this.apiClient = apiClient;
    this.logger = logger;
  }

  /**
   * Search repositories
   * GET /rest/api/1.0/repos
   */
  async searchRepositories(
    request: SearchRequest
  ): Promise<SearchResponse<RepositorySearchResult>> {
    this.logger.info('Searching repositories', { query: request.query, type: request.type });

    try {
      const response = await this.apiClient.get<SearchResponse<RepositorySearchResult>>('/repos', {
        params: {
          q: request.query,
          start: request.start,
          limit: request.limit,
          sort: request.sort,
          order: request.order,
          ...request.filters,
        },
      });
      this.logger.info('Successfully searched repositories', {
        query: request.query,
        count: response.data.values.length,
        total: response.data.size,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to search repositories', { request, error });
      throw error;
    }
  }

  /**
   * Search pull requests
   * GET /rest/api/1.0/pull-requests
   */
  async searchPullRequests(
    request: SearchRequest
  ): Promise<SearchResponse<PullRequestSearchResult>> {
    this.logger.info('Searching pull requests', { query: request.query, type: request.type });

    try {
      const response = await this.apiClient.get<SearchResponse<PullRequestSearchResult>>(
        '/pull-requests',
        {
          params: {
            q: request.query,
            start: request.start,
            limit: request.limit,
            sort: request.sort,
            order: request.order,
            ...request.filters,
          },
        }
      );
      this.logger.info('Successfully searched pull requests', {
        query: request.query,
        count: response.data.values.length,
        total: response.data.size,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to search pull requests', { request, error });
      throw error;
    }
  }

  /**
   * Search commits
   * GET /rest/api/1.0/commits
   */
  async searchCommits(request: SearchRequest): Promise<SearchResponse<CommitSearchResult>> {
    this.logger.info('Searching commits', { query: request.query, type: request.type });

    try {
      const response = await this.apiClient.get<SearchResponse<CommitSearchResult>>('/commits', {
        params: {
          q: request.query,
          start: request.start,
          limit: request.limit,
          sort: request.sort,
          order: request.order,
          ...request.filters,
        },
      });
      this.logger.info('Successfully searched commits', {
        query: request.query,
        count: response.data.values.length,
        total: response.data.size,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to search commits', { request, error });
      throw error;
    }
  }

  /**
   * Search code
   * GET /rest/api/1.0/code
   */
  async searchCode(request: SearchRequest): Promise<SearchResponse<CodeSearchResult>> {
    this.logger.info('Searching code', { query: request.query, type: request.type });

    try {
      const response = await this.apiClient.get<SearchResponse<CodeSearchResult>>('/code', {
        params: {
          q: request.query,
          start: request.start,
          limit: request.limit,
          sort: request.sort,
          order: request.order,
          ...request.filters,
        },
      });
      this.logger.info('Successfully searched code', {
        query: request.query,
        count: response.data.values.length,
        total: response.data.size,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to search code', { request, error });
      throw error;
    }
  }

  /**
   * Search users
   * GET /rest/api/1.0/users
   */
  async searchUsers(request: SearchRequest): Promise<SearchResponse<UserSearchResult>> {
    this.logger.info('Searching users', { query: request.query, type: request.type });

    try {
      const response = await this.apiClient.get<SearchResponse<UserSearchResult>>('/users', {
        params: {
          q: request.query,
          start: request.start,
          limit: request.limit,
          sort: request.sort,
          order: request.order,
          ...request.filters,
        },
      });
      this.logger.info('Successfully searched users', {
        query: request.query,
        count: response.data.values.length,
        total: response.data.size,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to search users', { request, error });
      throw error;
    }
  }

  /**
   * Get search suggestions
   * GET /rest/api/1.0/search/suggestions
   */
  async getSearchSuggestions(query: string): Promise<SearchSuggestions> {
    this.logger.info('Getting search suggestions', { query });

    try {
      const response = await this.apiClient.get<SearchSuggestions>('/search/suggestions', {
        params: { q: query },
      });
      this.logger.info('Successfully retrieved search suggestions', {
        query,
        suggestionsCount: response.data.suggestions.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get search suggestions', { query, error });
      throw error;
    }
  }

  /**
   * Get search configuration
   * GET /rest/api/1.0/search/configuration
   */
  async getSearchConfiguration(): Promise<SearchConfigurationResponse> {
    this.logger.info('Getting search configuration');

    try {
      const response =
        await this.apiClient.get<SearchConfigurationResponse>('/search/configuration');
      this.logger.info('Successfully retrieved search configuration', {
        enabled: response.data.enabled,
        indexEnabled: response.data.indexEnabled,
        searchEnabled: response.data.searchEnabled,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get search configuration', { error });
      throw error;
    }
  }

  /**
   * Update search configuration
   * PUT /rest/api/1.0/search/configuration
   */
  async updateSearchConfiguration(
    configuration: SearchConfiguration
  ): Promise<SearchConfigurationResponse> {
    this.logger.info('Updating search configuration', { configuration });

    try {
      const response = await this.apiClient.put<SearchConfigurationResponse>(
        '/search/configuration',
        configuration
      );
      this.logger.info('Successfully updated search configuration');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update search configuration', { configuration, error });
      throw error;
    }
  }

  /**
   * Get search indexes
   * GET /rest/api/1.0/search/indexes
   */
  async getSearchIndexes(): Promise<SearchIndexListResponse> {
    this.logger.info('Getting search indexes');

    try {
      const response = await this.apiClient.get<SearchIndexListResponse>('/search/indexes');
      this.logger.info('Successfully retrieved search indexes', {
        count: response.data.indexes.length,
        total: response.data.total,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get search indexes', { error });
      throw error;
    }
  }

  /**
   * Get search index by ID
   * GET /rest/api/1.0/search/indexes/{indexId}
   */
  async getSearchIndex(indexId: string): Promise<SearchIndexResponse> {
    this.logger.info('Getting search index', { indexId });

    try {
      const response = await this.apiClient.get<SearchIndexResponse>(`/search/indexes/${indexId}`);
      this.logger.info('Successfully retrieved search index', {
        indexId,
        type: response.data.type,
        status: response.data.status,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get search index', { indexId, error });
      throw error;
    }
  }

  /**
   * Start search index rebuild
   * POST /rest/api/1.0/search/indexes/{indexId}/rebuild
   */
  async rebuildSearchIndex(indexId: string): Promise<SearchIndexResponse> {
    this.logger.info('Starting search index rebuild', { indexId });

    try {
      const response = await this.apiClient.post<SearchIndexResponse>(
        `/search/indexes/${indexId}/rebuild`
      );
      this.logger.info('Successfully started search index rebuild', { indexId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to start search index rebuild', { indexId, error });
      throw error;
    }
  }

  /**
   * Stop search index rebuild
   * POST /rest/api/1.0/search/indexes/{indexId}/stop
   */
  async stopSearchIndex(indexId: string): Promise<SearchIndexResponse> {
    this.logger.info('Stopping search index', { indexId });

    try {
      const response = await this.apiClient.post<SearchIndexResponse>(
        `/search/indexes/${indexId}/stop`
      );
      this.logger.info('Successfully stopped search index', { indexId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to stop search index', { indexId, error });
      throw error;
    }
  }

  /**
   * Get search history
   * GET /rest/api/1.0/search/history
   */
  async getSearchHistory(): Promise<SearchHistoryListResponse> {
    this.logger.info('Getting search history');

    try {
      const response = await this.apiClient.get<SearchHistoryListResponse>('/search/history');
      this.logger.info('Successfully retrieved search history', {
        count: response.data.history.length,
        total: response.data.total,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get search history', { error });
      throw error;
    }
  }

  /**
   * Get search history for user
   * GET /rest/api/1.0/search/history/user/{userId}
   */
  async getUserSearchHistory(userId: number): Promise<SearchHistoryListResponse> {
    this.logger.info('Getting user search history', { userId });

    try {
      const response = await this.apiClient.get<SearchHistoryListResponse>(
        `/search/history/user/${userId}`
      );
      this.logger.info('Successfully retrieved user search history', {
        userId,
        count: response.data.history.length,
        total: response.data.total,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get user search history', { userId, error });
      throw error;
    }
  }

  /**
   * Clear search history
   * DELETE /rest/api/1.0/search/history
   */
  async clearSearchHistory(): Promise<void> {
    this.logger.info('Clearing search history');

    try {
      await this.apiClient.delete('/search/history');
      this.logger.info('Successfully cleared search history');
    } catch (error) {
      this.logger.error('Failed to clear search history', { error });
      throw error;
    }
  }

  /**
   * Clear user search history
   * DELETE /rest/api/1.0/search/history/user/{userId}
   */
  async clearUserSearchHistory(userId: number): Promise<void> {
    this.logger.info('Clearing user search history', { userId });

    try {
      await this.apiClient.delete(`/search/history/user/${userId}`);
      this.logger.info('Successfully cleared user search history', { userId });
    } catch (error) {
      this.logger.error('Failed to clear user search history', { userId, error });
      throw error;
    }
  }

  /**
   * Get search analytics
   * GET /rest/api/1.0/search/analytics
   */
  async getSearchAnalytics(): Promise<SearchAnalyticsListResponse> {
    this.logger.info('Getting search analytics');

    try {
      const response = await this.apiClient.get<SearchAnalyticsListResponse>('/search/analytics');
      this.logger.info('Successfully retrieved search analytics', {
        count: response.data.analytics.length,
        total: response.data.total,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get search analytics', { error });
      throw error;
    }
  }

  /**
   * Get search analytics for query
   * GET /rest/api/1.0/search/analytics/query/{query}
   */
  async getQueryAnalytics(query: string): Promise<SearchAnalyticsResponse> {
    this.logger.info('Getting query analytics', { query });

    try {
      const response = await this.apiClient.get<SearchAnalyticsResponse>(
        `/search/analytics/query/${encodeURIComponent(query)}`
      );
      this.logger.info('Successfully retrieved query analytics', {
        query,
        resultCount: response.data.resultCount,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get query analytics', { query, error });
      throw error;
    }
  }

  /**
   * Get search statistics
   * GET /rest/api/1.0/search/statistics
   */
  async getSearchStatistics(): Promise<SearchStatisticsResponse> {
    this.logger.info('Getting search statistics');

    try {
      const response = await this.apiClient.get<SearchStatisticsResponse>('/search/statistics');
      this.logger.info('Successfully retrieved search statistics', {
        totalSearches: response.data.totalSearches,
        uniqueUsers: response.data.uniqueUsers,
        averageResults: response.data.averageResults,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get search statistics', { error });
      throw error;
    }
  }

  /**
   * Get search statistics for time range
   * GET /rest/api/1.0/search/statistics/range
   */
  async getSearchStatisticsForRange(
    fromTimestamp: number,
    toTimestamp: number
  ): Promise<SearchStatisticsResponse> {
    this.logger.info('Getting search statistics for range', { fromTimestamp, toTimestamp });

    try {
      const response = await this.apiClient.get<SearchStatisticsResponse>(
        '/search/statistics/range',
        {
          params: { from: fromTimestamp, to: toTimestamp },
        }
      );
      this.logger.info('Successfully retrieved search statistics for range', {
        fromTimestamp,
        toTimestamp,
        totalSearches: response.data.totalSearches,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get search statistics for range', {
        fromTimestamp,
        toTimestamp,
        error,
      });
      throw error;
    }
  }

  /**
   * Record search analytics
   * POST /rest/api/1.0/search/analytics
   */
  async recordSearchAnalytics(analytics: SearchAnalytics): Promise<void> {
    this.logger.info('Recording search analytics', {
      query: analytics.query,
      type: analytics.type,
    });

    try {
      await this.apiClient.post('/search/analytics', analytics);
      this.logger.info('Successfully recorded search analytics', { query: analytics.query });
    } catch (error) {
      this.logger.error('Failed to record search analytics', { analytics, error });
      throw error;
    }
  }
}
