/**
 * Search Coordinator Service
 * Main orchestration service for all search operations
 * 
 * Coordinates between different search services and provides unified interface
 */

import { AxiosInstance } from 'axios';
import { Cache } from '../utils/cache';
import {
  SearchQuery,
  SearchResponse,
  SearchResult,
  SearchConfiguration,
  SearchContext,
  MultiSearchRequest,
  MultiSearchResponse,
  SearchSuggestion,
} from '../types/search';
import { ServerInfo } from '../types/index';
import { logger } from '../utils/logger';

// Import all search services
import { RepositorySearchService } from './repository-search-service';
import { CommitSearchService } from './commit-search-service';
import { PullRequestSearchService } from './pullrequest-search-service';
import { CodeSearchService } from './code-search-service';
import { UserSearchService } from './user-search-service';
import { SearchHistoryService } from './search-history-service';
import { SearchAnalysisService } from './search-analysis-service';

// ============================================================================
// Search Coordinator Service
// ============================================================================

/**
 * Main service that coordinates all search operations
 */
export class SearchCoordinatorService {
  private httpClient: AxiosInstance;
  private cache: Cache;
  private config: SearchConfiguration;

  // Search services
  private repositoryService!: RepositorySearchService;
  private commitService!: CommitSearchService;
  private pullRequestService!: PullRequestSearchService;
  private codeService!: CodeSearchService;
  private userService!: UserSearchService;
  private historyService!: SearchHistoryService;
  private analysisService!: SearchAnalysisService;

  // Service registry
  private services!: Map<string, any>;

  constructor(
    httpClient: AxiosInstance,
    cache: Cache,
    config: Partial<SearchConfiguration> = {}
  ) {
    this.httpClient = httpClient;
    this.cache = cache;
    
    // Set default configuration
    this.config = {
      defaultResultsPerPage: 25,
      maxResultsPerPage: 100,
      searchTimeout: 30000,
      cacheTtl: 300000,
      cacheTimeout: 300, // 5 minutes
      historyRetentionDays: 90,
      maxHistoryEntries: 1000,
      enabledSearchTypes: ['repository', 'commit', 'pullrequest', 'code', 'user'],
      rateLimiting: {
        maxRequestsPerMinute: 60,
        maxRequestsPerHour: 1000,
        maxRequestsPerDay: 10000,
      },
      enableAnalytics: true,
      enableHistory: true,
      enableSuggestions: true,
      performanceThreshold: 2000, // 2 seconds
      ...config,
    };

    // Initialize services
    this.initializeServices();
  }

  // ============================================================================
  // Service Initialization
  // ============================================================================

  /**
   * Initializes all search services
   */
  private initializeServices(): void {
    try {
      // Initialize individual search services
      this.repositoryService = new RepositorySearchService(this.httpClient, this.cache, this.config);
      this.commitService = new CommitSearchService(this.httpClient, this.cache, this.config);
      this.pullRequestService = new PullRequestSearchService(this.httpClient, this.cache, this.config);
      this.codeService = new CodeSearchService(this.httpClient, this.cache, this.config);
      this.userService = new UserSearchService(this.httpClient, this.cache, this.config);

      // Initialize support services
      this.historyService = new SearchHistoryService(this.httpClient, this.cache, {
        maxHistoryEntries: this.config.maxHistoryEntries || 1000,
      });

      this.analysisService = new SearchAnalysisService(
        this.httpClient,
        this.cache,
        this.historyService
      );

      // Create service registry
      this.services = new Map([
        ['repository', this.repositoryService as any],
        ['commit', this.commitService as any],
        ['pullrequest', this.pullRequestService as any],
        ['code', this.codeService as any],
        ['user', this.userService as any],
      ]);

      logger.info('Search services initialized successfully', {
        servicesCount: this.services.size,
        enableAnalytics: this.config.enableAnalytics,
        enableHistory: this.config.enableHistory,
      });
    } catch (error) {
      logger.error('Failed to initialize search services', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  // ============================================================================
  // Main Search Interface
  // ============================================================================

  /**
   * Performs a unified search across specified search types
   */
  public async search(
    serverInfo: ServerInfo,
    query: SearchQuery,
    context: SearchContext = {
      timestamp: new Date().toISOString(),
      searchTypes: [],
      metadata: {}
    }
  ): Promise<SearchResponse> {
    const startTime = Date.now();
    const searchId = this.generateSearchId();

    try {
      logger.debug('Starting unified search', {
        searchId,
        query: query.query,
        searchTypes: context.searchTypes,
        userId: context.userId,
      });

      // Validate input
      this.validateSearchInput(query, context);

      // Determine search types to execute
      const searchTypes = context.searchTypes || this.determineSearchTypes(query);

      // Execute searches
      const results = await this.executeSearches(serverInfo, query, searchTypes, context);

      // Merge and rank results
      const mergedResults = this.mergeResults(results, query);

      // Apply pagination
      const paginatedResults = this.applyPagination(mergedResults, query);

      // Calculate execution time
      const executionTime = Date.now() - startTime;

      // Create response
      const response: SearchResponse = {
        results: paginatedResults,
        pagination: {
          page: query.page || 0,
          limit: query.limit || this.config.defaultResultsPerPage,
          totalPages: Math.ceil(mergedResults.length / (query.limit || this.config.defaultResultsPerPage)),
          totalResults: mergedResults.length,
          hasNext: this.hasMoreResults(mergedResults, query),
          hasPrevious: (query.page || 0) > 0,
          nextPage: this.hasMoreResults(mergedResults, query) ? (query.page || 0) + 1 : undefined,
          previousPage: (query.page || 0) > 0 ? (query.page || 0) - 1 : undefined,
        },
        totalCount: mergedResults.length,
        searchTime: executionTime,
        metadata: {
          executionTime,
          searchTypes,
          cacheHit: false, // Would be determined by individual services
        },
      };

      // Record in history if enabled
      if (this.config.enableHistory && context.userId) {
        await this.recordSearchInHistory(context.userId, query, response, serverInfo);
      }

      // Log performance metrics
      this.logPerformanceMetrics(searchId, executionTime, response);

      return response;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      logger.error('Search failed', {
        searchId,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
        query: query.query,
      });

      // Record failed search in history
      if (this.config.enableHistory && context.userId) {
        await this.recordFailedSearchInHistory(
          context.userId,
          query,
          error as Error,
          serverInfo
        );
      }

      throw error;
    }
  }

  /**
   * Performs multiple searches in parallel
   */
  public async multiSearch(
    serverInfo: ServerInfo,
    request: MultiSearchRequest,
    context: SearchContext = {
      timestamp: new Date().toISOString(),
      searchTypes: [],
      metadata: {}
    }
  ): Promise<MultiSearchResponse> {
    const startTime = Date.now();
    const searchId = this.generateSearchId();

    try {
      logger.debug('Starting multi-search', {
        searchId,
        searchCount: request.searches.length,
        userId: context.userId,
      });

      // Execute all searches in parallel
      const searchPromises = request.searches.map(async (searchRequest, index) => {
        try {
          const response = await this.search(serverInfo, searchRequest, {
            ...context,
            searchTypes: searchRequest.searchTypes || ['repository'],
          });

          return {
            id: searchRequest.id || `search_${index}`,
            response,
            error: null,
          };
        } catch (error) {
          return {
            id: searchRequest.id || `search_${index}`,
            response: null,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      });

      const results = await Promise.all(searchPromises);
      const executionTime = Date.now() - startTime;

      const multiResponse: MultiSearchResponse = {
        responses: results.filter(r => r.response !== null).map(r => r.response!),
        searches: results,
        metadata: {
          searchId,
          executionTime,
          totalExecutionTime: executionTime,
          totalSearches: request.searches.length,
          successfulSearches: results.filter(r => r.response !== null).length,
          failedSearches: results.filter(r => r.error !== null).length,
          cacheHits: 0,
        },
      };

      logger.debug('Multi-search completed', {
        searchId,
        executionTime,
        successfulSearches: multiResponse.metadata.successfulSearches,
        failedSearches: multiResponse.metadata.failedSearches,
      });

      return multiResponse;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      logger.error('Multi-search failed', {
        searchId,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
      });

      throw error;
    }
  }

  // ============================================================================
  // Specialized Search Methods
  // ============================================================================

  /**
   * Searches repositories
   */
  public async searchRepositories(
    serverInfo: ServerInfo,
    options: Parameters<RepositorySearchService['searchRepositories']>[1],
    context: SearchContext = {
      timestamp: new Date().toISOString(),
      searchTypes: [],
      metadata: {}
    }
  ) {
    return this.repositoryService.searchRepositories(serverInfo, options);
  }

  /**
   * Searches commits
   */
  public async searchCommits(
    serverInfo: ServerInfo,
    options: Parameters<CommitSearchService['searchCommits']>[1],
    context: SearchContext = {
      timestamp: new Date().toISOString(),
      searchTypes: [],
      metadata: {}
    }
  ) {
    return this.commitService.searchCommits(serverInfo, options);
  }

  /**
   * Searches pull requests
   */
  public async searchPullRequests(
    serverInfo: ServerInfo,
    options: Parameters<PullRequestSearchService['searchPullRequests']>[1],
    context: SearchContext = {
      timestamp: new Date().toISOString(),
      searchTypes: [],
      metadata: {}
    }
  ) {
    return this.pullRequestService.searchPullRequests(serverInfo, options);
  }

  /**
   * Searches code
   */
  public async searchCode(
    serverInfo: ServerInfo,
    options: Parameters<CodeSearchService['searchCode']>[1],
    context: SearchContext = {
      timestamp: new Date().toISOString(),
      searchTypes: [],
      metadata: {}
    }
  ) {
    return this.codeService.searchCode(serverInfo, options);
  }

  /**
   * Searches users
   */
  public async searchUsers(
    serverInfo: ServerInfo,
    options: Parameters<UserSearchService['searchUsers']>[1],
    context: SearchContext = {
      timestamp: new Date().toISOString(),
      searchTypes: [],
      metadata: {}
    }
  ) {
    return this.userService.searchUsers(serverInfo, options);
  }

  // ============================================================================
  // Suggestions and History
  // ============================================================================

  /**
   * Gets search suggestions based on query
   */
  public async getSearchSuggestions(
    serverInfo: ServerInfo,
    partialQuery: string,
    context: SearchContext = {
      timestamp: new Date().toISOString(),
      searchTypes: [],
      metadata: {}
    }
  ): Promise<SearchSuggestion[]> {
    if (!this.config.enableSuggestions) {
      return [];
    }

    try {
      const suggestions: SearchSuggestion[] = [];

      // Get history-based suggestions if user is provided
      if (context.userId) {
        const historySuggestions = await this.historyService.getSearchSuggestions(
          context.userId,
          partialQuery,
          { limit: 5 }
        );

        historySuggestions.forEach(suggestion => {
          suggestions.push({
            text: suggestion,
            query: suggestion,
            type: 'history',
            confidence: 0.8,
            source: 'user_history',
          });
        });
      }

      // Get popular query suggestions
      const popularQueries = await this.historyService.getPopularQueries({
        limit: 10,
      });

      popularQueries
        .filter(pq => pq.query.toLowerCase().includes(partialQuery.toLowerCase()))
        .slice(0, 5)
        .forEach(pq => {
          suggestions.push({
            text: pq.query,
            query: pq.query,
            type: 'popular',
            confidence: Math.min(0.9, pq.successRate),
            source: 'popular_queries',
          });
        });

      // Remove duplicates and sort by confidence
      const uniqueSuggestions = suggestions
        .filter((suggestion, index, self) => 
          self.findIndex(s => s.query === suggestion.query) === index
        )
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 10);

      return uniqueSuggestions;
    } catch (error) {
      logger.error('Failed to get search suggestions', {
        error: error instanceof Error ? error.message : 'Unknown error',
        partialQuery,
      });
      return [];
    }
  }

  /**
   * Gets user search history
   */
  public async getUserSearchHistory(
    userId: string,
    options: Parameters<SearchHistoryService['getUserHistory']>[1] = {}
  ) {
    return this.historyService.getUserHistory(userId, options);
  }

  /**
   * Clears user search history
   */
  public async clearUserSearchHistory(
    userId: string,
    options: Parameters<SearchHistoryService['clearUserHistory']>[1] = {}
  ) {
    return this.historyService.clearUserHistory(userId, options);
  }

  // ============================================================================
  // Analytics and Insights
  // ============================================================================

  /**
   * Gets search analytics
   */
  public async getSearchAnalytics(
    options: Parameters<SearchHistoryService['getSearchAnalytics']>[0] = {}
  ) {
    if (!this.config.enableAnalytics) {
      throw new Error('Analytics are disabled');
    }

    return this.historyService.getSearchAnalytics(options);
  }

  /**
   * Gets search insights
   */
  public async getSearchInsights(
    options: Parameters<SearchAnalysisService['generateInsights']>[0] = {}
  ) {
    if (!this.config.enableAnalytics) {
      throw new Error('Analytics are disabled');
    }

    return this.analysisService.generateInsights(options);
  }

  /**
   * Analyzes user search behavior
   */
  public async analyzeUserBehavior(
    userId: string,
    options: Parameters<SearchAnalysisService['analyzeUserBehavior']>[1] = {}
  ) {
    if (!this.config.enableAnalytics) {
      throw new Error('Analytics are disabled');
    }

    return this.analysisService.analyzeUserBehavior(userId, options);
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Generates a unique search ID
   */
  private generateSearchId(): string {
    return `search_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Validates search input
   */
  private validateSearchInput(query: SearchQuery, context: SearchContext): void {
    if (!query.query || query.query.trim().length === 0) {
      throw new Error('Search query cannot be empty');
    }

    if (query.query.length > 1000) {
      throw new Error('Search query is too long (max 1000 characters)');
    }

    if (query.limit && query.limit > this.config.maxResultsPerPage) {
      throw new Error(`Result limit cannot exceed ${this.config.maxResultsPerPage}`);
    }

    if (context.searchTypes) {
      const validTypes = Array.from(this.services.keys());
      const invalidTypes = context.searchTypes.filter(type => !validTypes.includes(type));
      
      if (invalidTypes.length > 0) {
        throw new Error(`Invalid search types: ${invalidTypes.join(', ')}`);
      }
    }
  }

  /**
   * Determines which search types to execute based on query
   */
  private determineSearchTypes(query: SearchQuery): string[] {
    const types: string[] = [];
    
    // Analyze query and filters to determine appropriate search types
    if (query.filters?.repositorySlug && !query.filters.filePath) {
      types.push('repository');
    }
    
    if (query.filters?.filePath || query.filters?.language || query.filters?.fileExtension) {
      types.push('code');
    }
    
    if (query.filters?.author || query.filters?.committer) {
      types.push('commit');
    }
    
    if (query.filters?.reviewer || query.filters?.state) {
      types.push('pullrequest');
    }
    
    if (query.filters?.role || query.filters?.permission) {
      types.push('user');
    }
    
    // If no specific types determined, search all relevant types
    if (types.length === 0) {
      types.push('repository', 'code', 'commit', 'pullrequest');
    }
    
    return types;
  }

  /**
   * Executes searches across multiple types
   */
  private async executeSearches(
    serverInfo: ServerInfo,
    query: SearchQuery,
    searchTypes: string[],
    context: SearchContext
  ): Promise<Map<string, SearchResult[]>> {
    const results = new Map<string, SearchResult[]>();
    
    // Execute searches in parallel
    const searchPromises = searchTypes.map(async (searchType) => {
      const service = this.services.get(searchType);
      
      if (!service) {
        logger.warn('Unknown search type', { searchType });
        return [searchType, []];
      }
      
      try {
        const response = await service.search(serverInfo, query);
        return [searchType, response.results];
      } catch (error) {
        logger.error('Search failed for type', {
          searchType,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return [searchType, []];
      }
    });
    
    const searchResults = await Promise.all(searchPromises);
    
    searchResults.forEach(([searchType, typeResults]) => {
      results.set(searchType as string, typeResults as SearchResult[]);
    });
    
    return results;
  }

  /**
   * Merges results from different search types
   */
  private mergeResults(results: Map<string, SearchResult[]>, query: SearchQuery): SearchResult[] {
    const allResults: SearchResult[] = [];
    
    // Collect all results
    results.forEach((typeResults, searchType) => {
      allResults.push(...typeResults);
    });
    
    // Sort by relevance score (descending)
    allResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    
    return allResults;
  }

  /**
   * Applies pagination to results
   */
  private applyPagination(results: SearchResult[], query: SearchQuery): SearchResult[] {
    const page = query.page || 0;
    const limit = query.limit || this.config.defaultResultsPerPage;
    const start = page * limit;
    const end = start + limit;
    
    return results.slice(start, end);
  }

  /**
   * Checks if there are more results available
   */
  private hasMoreResults(results: SearchResult[], query: SearchQuery): boolean {
    const page = query.page || 0;
    const limit = query.limit || this.config.defaultResultsPerPage;
    const start = page * limit;
    
    return results.length > start + limit;
  }

  /**
   * Records successful search in history
   */
  private async recordSearchInHistory(
    userId: string,
    query: SearchQuery,
    response: SearchResponse,
    serverInfo: ServerInfo
  ): Promise<void> {
    try {
      await this.historyService.recordSearch(userId, query, {
        totalResults: response.pagination.totalResults,
        executionTime: response.metadata.executionTime,
        serverInfo,
      });
    } catch (error) {
      logger.error('Failed to record search in history', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
    }
  }

  /**
   * Records failed search in history
   */
  private async recordFailedSearchInHistory(
    userId: string,
    query: SearchQuery,
    error: Error,
    serverInfo: ServerInfo
  ): Promise<void> {
    try {
      await this.historyService.recordFailedSearch(userId, query, error, serverInfo);
    } catch (recordError) {
      logger.error('Failed to record failed search in history', {
        error: recordError instanceof Error ? recordError.message : 'Unknown error',
        userId,
      });
    }
  }

  /**
   * Logs performance metrics
   */
  private logPerformanceMetrics(
    searchId: string,
    executionTime: number,
    response: SearchResponse
  ): void {
    const isSlowSearch = executionTime > this.config.performanceThreshold;
    
    const logData = {
      searchId,
      executionTime,
      totalResults: response.pagination.totalResults,
      searchTypes: response.metadata.searchTypes,
      cacheHit: response.metadata.cacheHit,
    };
    
    if (isSlowSearch) {
      logger.warn('Slow search detected', logData);
    } else {
      logger.debug('Search completed', logData);
    }
  }

  // ============================================================================
  // Public Utility Methods
  // ============================================================================

  /**
   * Gets service configuration
   */
  public getConfiguration(): SearchConfiguration {
    return { ...this.config };
  }

  /**
   * Updates service configuration
   */
  public updateConfiguration(updates: Partial<SearchConfiguration>): void {
    this.config = { ...this.config, ...updates };
    
    logger.info('Search configuration updated', {
      updates: Object.keys(updates),
    });
  }

  /**
   * Gets service health status
   */
  public async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, { status: string; lastCheck: string }>;
    uptime: number;
  }> {
    const serviceStatuses: Record<string, { status: string; lastCheck: string }> = {};
    let healthyServices = 0;
    
    // Check each service (simplified health check)
    for (const [serviceName] of this.services) {
      try {
        // In a real implementation, each service would have a health check method
        serviceStatuses[serviceName] = {
          status: 'healthy',
          lastCheck: new Date().toISOString(),
        };
        healthyServices++;
      } catch (error) {
        serviceStatuses[serviceName] = {
          status: 'unhealthy',
          lastCheck: new Date().toISOString(),
        };
      }
    }
    
    const totalServices = this.services.size;
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    
    if (healthyServices === totalServices) {
      overallStatus = 'healthy';
    } else if (healthyServices > totalServices / 2) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'unhealthy';
    }
    
    return {
      status: overallStatus,
      services: serviceStatuses,
      uptime: process.uptime(),
    };
  }
}

// ============================================================================
// Export
// ============================================================================

export default SearchCoordinatorService;
