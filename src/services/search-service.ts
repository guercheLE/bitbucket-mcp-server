/**
 * Search Service Base Class
 * Base implementation for all search services
 * 
 * Provides common functionality for search operations
 */

import { AxiosInstance } from 'axios';
import { z } from 'zod';
import { 
  SearchQuery, 
  SearchResponse, 
  SearchResult, 
  SearchResultType,
  SearchPagination,
  SearchConfiguration,
  SearchHistory,
  SearchHistoryEntry,
  DEFAULT_SEARCH_CONFIG,
} from '../types/search';
import {
  SearchQuerySchema,
  SearchResponseSchema,
  transformSearchQuery,
} from '../types/search-schemas';
import { Cache } from '../utils/cache';
import { logger, logPerformance } from '../utils/logger';
import { ServerInfo } from '../types/index';

// ============================================================================
// Search Service Base Class
// ============================================================================

/**
 * Abstract base class for search services
 */
export abstract class SearchService {
  protected httpClient: AxiosInstance;
  protected cache: Cache;
  protected config: SearchConfiguration;
  protected searchType: SearchResultType;

  constructor(
    httpClient: AxiosInstance,
    cache: Cache,
    searchType: SearchResultType,
    config: Partial<SearchConfiguration> = {}
  ) {
    this.httpClient = httpClient;
    this.cache = cache;
    this.searchType = searchType;
    this.config = { ...DEFAULT_SEARCH_CONFIG, ...config };
  }

  // ============================================================================
  // Abstract Methods - Must be implemented by subclasses
  // ============================================================================

  /**
   * Builds the search URL for the specific search type
   */
  protected abstract buildSearchUrl(serverInfo: ServerInfo, query: SearchQuery): string;

  /**
   * Transforms API response to SearchResult format
   */
  protected abstract transformApiResponse(apiResponse: any, query: SearchQuery): SearchResult[];

  /**
   * Gets the default sort field for this search type
   */
  protected abstract getDefaultSortField(): string;

  /**
   * Validates search type specific parameters
   */
  protected abstract validateSearchTypeParams(query: SearchQuery): void;

  // ============================================================================
  // Public Search Methods
  // ============================================================================

  /**
   * Performs a search operation
   */
  public async search(
    serverInfo: ServerInfo,
    rawQuery: unknown
  ): Promise<SearchResponse> {
    const startTime = Date.now();
    const correlationId = this.generateCorrelationId();

    try {
      // Validate and transform query
      const query = this.validateQuery(rawQuery);
      
      // Check cache first
      const cacheKey = this.generateCacheKey(serverInfo, query);
      const cachedResult = this.cache.get(cacheKey);
      
      if (cachedResult) {
        logger.debug('Search cache hit', { 
          searchType: this.searchType,
          cacheKey,
          correlationId 
        });
        
        const searchTime = Date.now() - startTime;
        logPerformance('search_cached', searchTime, {
          searchType: this.searchType,
          cached: true,
          correlationId,
        });
        
        return cachedResult;
      }

      // Perform actual search
      const response = await this.performSearch(serverInfo, query, correlationId);
      
      // Cache the result
      this.cache.set(cacheKey, response, this.config.cacheTtl);
      
      // Log performance
      const searchTime = Date.now() - startTime;
      logPerformance('search_completed', searchTime, {
        searchType: this.searchType,
        resultCount: response.totalCount,
        cached: false,
        correlationId,
      });

      // Record search in history (async, don't wait)
      this.recordSearchHistory(serverInfo, query, response, correlationId).catch(error => {
        logger.warn('Failed to record search history', { error, correlationId });
      });

      return response;

    } catch (error) {
      const searchTime = Date.now() - startTime;
      
      logger.error('Search failed', {
        searchType: this.searchType,
        error: error instanceof Error ? error.message : 'Unknown error',
        searchTime,
        correlationId,
      });

      throw error;
    }
  }

  // ============================================================================
  // Protected Helper Methods
  // ============================================================================

  /**
   * Validates the search query
   */
  protected validateQuery(rawQuery: unknown): SearchQuery {
    try {
      // Transform and validate query
      const query = transformSearchQuery(rawQuery, this.searchType) as SearchQuery;
      
      // Apply default sort field if not provided
      if (!query.sortBy) {
        query.sortBy = this.getDefaultSortField();
      }
      
      // Validate search type specific parameters
      this.validateSearchTypeParams(query);
      
      return query;
      
    } catch (error) {
      throw new Error(`Invalid search query: ${error instanceof Error ? error.message : 'Unknown validation error'}`);
    }
  }

  /**
   * Performs the actual search operation
   */
  protected async performSearch(
    serverInfo: ServerInfo,
    query: SearchQuery,
    correlationId: string
  ): Promise<SearchResponse> {
    try {
      // Build search URL
      const searchUrl = this.buildSearchUrl(serverInfo, query);
      
      // Make HTTP request
      const response = await this.httpClient.get(searchUrl, {
        timeout: this.config.searchTimeout,
        headers: {
          'X-Correlation-ID': correlationId,
        },
      });

      // Transform API response
      const results = this.transformApiResponse(response.data, query);
      
      // Build pagination info
      const pagination = this.buildPagination(query, results.length, response.data);
      
      // Generate suggestions (basic implementation)
      const suggestions = this.generateSuggestions(query, results);
      
      // Build search response
      const searchResponse: SearchResponse = {
        results,
        pagination,
        totalCount: this.extractTotalCount(response.data, results.length),
        searchTime: Date.now() - Date.now(), // Will be overwritten by caller
        suggestions,
        metadata: {
          executionTime: Date.now() - Date.now(),
          searchTypes: [this.searchType],
          cacheHit: false
        }
      };

      // Validate response
      return SearchResponseSchema.parse(searchResponse);

    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Search response validation failed', {
          error: error.errors,
          correlationId,
        });
        throw new Error('Invalid search response format');
      }
      
      throw error;
    }
  }

  /**
   * Builds pagination information
   */
  protected buildPagination(
    query: SearchQuery, 
    resultCount: number, 
    apiResponse: any
  ): SearchPagination {
    const page = query.page || 0;
    const limit = query.limit || this.config.defaultResultsPerPage;
    const totalCount = this.extractTotalCount(apiResponse, resultCount);
    const totalPages = Math.ceil(totalCount / limit);

    return {
      page,
      limit,
      totalPages,
      totalResults: totalCount,
      hasNext: page < totalPages - 1,
      hasPrevious: page > 0,
      nextPage: page < totalPages - 1 ? page + 1 : undefined,
      previousPage: page > 0 ? page - 1 : undefined,
    };
  }

  /**
   * Extracts total count from API response
   */
  protected extractTotalCount(apiResponse: any, resultCount: number): number {
    // Try to extract from common API response fields
    if (apiResponse.size !== undefined) {
      return apiResponse.size;
    }
    
    if (apiResponse.total !== undefined) {
      return apiResponse.total;
    }
    
    if (apiResponse.totalCount !== undefined) {
      return apiResponse.totalCount;
    }
    
    // Fallback to result count
    return resultCount;
  }

  /**
   * Generates search suggestions based on query and results
   */
  protected generateSuggestions(query: SearchQuery, results: SearchResult[]): string[] {
    const suggestions: Set<string> = new Set();
    
    // Add query terms as suggestions
    const queryTerms = query.query.toLowerCase().split(/\s+/);
    queryTerms.forEach(term => {
      if (term.length > 2) {
        suggestions.add(term);
      }
    });
    
    // Extract suggestions from result titles and descriptions
    results.slice(0, 5).forEach(result => { // Only use first 5 results
      const text = `${result.title} ${result.description || ''}`.toLowerCase();
      const words = text.split(/\W+/);
      
      words.forEach(word => {
        if (word.length > 3 && !queryTerms.includes(word)) {
          suggestions.add(word);
        }
      });
    });
    
    // Return up to 10 suggestions
    return Array.from(suggestions).slice(0, 10);
  }

  /**
   * Generates a cache key for the search query
   */
  protected generateCacheKey(serverInfo: ServerInfo, query: SearchQuery): string {
    const keyData = {
      searchType: this.searchType,
      serverType: serverInfo.serverType,
      baseUrl: serverInfo.baseUrl,
      query: query.query,
      filters: query.filters,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      page: query.page,
      limit: query.limit,
    };
    
    const keyString = JSON.stringify(keyData);
    const hash = this.hashString(keyString);
    
    return `search:${this.searchType}:${hash}`;
  }

  /**
   * Generates a correlation ID for tracking
   */
  protected generateCorrelationId(): string {
    return `search-${this.searchType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Simple string hash function
   */
  protected hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Records search in history
   */
  protected async recordSearchHistory(
    serverInfo: ServerInfo,
    query: SearchQuery,
    response: SearchResponse,
    correlationId: string
  ): Promise<void> {
    try {
      // This would typically save to a database or external service
      // For now, we'll just log it
      const historyEntry: SearchHistoryEntry = {
        id: `search_${Date.now()}`,
        userId: 'current-user', // Would come from authentication context
        query: query.query,
        timestamp: new Date().toISOString(),
        resultCount: response.totalCount,
        filters: query.filters || {},
        searchType: this.searchType,
        success: true,
        executionTime: response.searchTime,
        serverType: serverInfo.serverType
      };

      logger.info('Search recorded in history', {
        historyEntry,
        correlationId,
      });

    } catch (error) {
      logger.warn('Failed to record search history', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId,
      });
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Calculates relevance score based on query and result
   */
  protected calculateRelevanceScore(query: SearchQuery, result: any): number {
    let score = 0.5; // Base score
    
    const queryTerms = query.query.toLowerCase().split(/\s+/);
    const resultText = `${result.title || ''} ${result.description || ''}`.toLowerCase();
    
    // Boost score for each query term found
    queryTerms.forEach(term => {
      if (resultText.includes(term)) {
        score += 0.1;
      }
    });
    
    // Boost for exact matches in title
    if (result.title?.toLowerCase().includes(query.query.toLowerCase())) {
      score += 0.2;
    }
    
    // Ensure score is between 0 and 1
    return Math.min(Math.max(score, 0), 1);
  }

  /**
   * Builds URL with query parameters
   */
  protected buildUrlWithParams(baseUrl: string, params: Record<string, any>): string {
    const url = new URL(baseUrl);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
    
    return url.toString();
  }

  /**
   * Gets search configuration
   */
  public getConfig(): SearchConfiguration {
    return { ...this.config };
  }

  /**
   * Updates search configuration
   */
  public updateConfig(newConfig: Partial<SearchConfiguration>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Clears search cache
   */
  public clearCache(): void {
    // Clear cache entries for this search type
    const keys = this.cache.keys();
    keys.forEach(key => {
      if (key.startsWith(`search:${this.searchType}:`)) {
        this.cache.delete(key);
      }
    });
    
    logger.info('Search cache cleared', { searchType: this.searchType });
  }

  /**
   * Gets cache statistics for this search type
   */
  public getCacheStats(): any {
    const allStats = this.cache.getStats();
    
    // Filter stats for this search type (basic implementation)
    return {
      searchType: this.searchType,
      ...allStats,
    };
  }
}

// ============================================================================
// Export
// ============================================================================

export default SearchService;
