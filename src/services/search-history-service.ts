/**
 * Search History Service
 * Manages search history and provides search analytics
 * 
 * Tracks user searches, popular queries, and search patterns
 */

import { AxiosInstance } from 'axios';
import { Cache } from '../utils/cache.js';
import {
  SearchQuery,
  SearchHistory,
  SearchHistoryEntry,
  SearchAnalytics,
  SearchTrend,
  PopularQuery,
} from '../types/search.js';
import { ServerInfo } from '../types/index.js';
import { logger } from '../utils/logger.js';

// ============================================================================
// Search History Service
// ============================================================================

/**
 * Service for managing search history and analytics
 */
export class SearchHistoryService {
  private httpClient: AxiosInstance;
  private cache: Cache;
  private historyCache: Map<string, SearchHistoryEntry[]>;
  private analyticsCache: Map<string, SearchAnalytics>;
  private readonly maxHistoryEntries: number;
  private readonly maxCacheAge: number;

  constructor(
    httpClient: AxiosInstance,
    cache: Cache,
    config: {
      maxHistoryEntries?: number;
      maxCacheAge?: number;
    } = {}
  ) {
    this.httpClient = httpClient;
    this.cache = cache;
    this.historyCache = new Map();
    this.analyticsCache = new Map();
    this.maxHistoryEntries = config.maxHistoryEntries || 1000;
    this.maxCacheAge = config.maxCacheAge || 24 * 60 * 60 * 1000; // 24 hours
  }

  // ============================================================================
  // History Management
  // ============================================================================

  /**
   * Records a search query in the history
   */
  public async recordSearch(
    userId: string,
    query: SearchQuery,
    results: {
      totalResults: number;
      executionTime: number;
      serverInfo: ServerInfo;
    }
  ): Promise<void> {
    try {
      const historyEntry: SearchHistoryEntry = {
        id: this.generateHistoryId(),
        userId,
        query: query.query,
        filters: query.filters || {},
        searchType: this.determineSearchType(query),
        timestamp: new Date().toISOString(),
        totalResults: results.totalResults,
        executionTime: results.executionTime,
        serverType: results.serverInfo.serverType,
        success: true,
      };

      // Add to user's history
      await this.addToUserHistory(userId, historyEntry);

      // Update analytics
      await this.updateAnalytics(historyEntry);

      logger.debug('Search recorded in history', {
        userId,
        query: query.query,
        totalResults: results.totalResults,
      });
    } catch (error) {
      logger.error('Failed to record search in history', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        query: query.query,
      });
    }
  }

  /**
   * Records a failed search in the history
   */
  public async recordFailedSearch(
    userId: string,
    query: SearchQuery,
    error: Error,
    serverInfo: ServerInfo
  ): Promise<void> {
    try {
      const historyEntry: SearchHistoryEntry = {
        id: this.generateHistoryId(),
        userId,
        query: query.query,
        filters: query.filters || {},
        searchType: this.determineSearchType(query),
        timestamp: new Date().toISOString(),
        totalResults: 0,
        executionTime: 0,
        serverType: serverInfo.serverType,
        success: false,
        error: error.message,
      };

      // Add to user's history
      await this.addToUserHistory(userId, historyEntry);

      // Update analytics
      await this.updateAnalytics(historyEntry);

      logger.debug('Failed search recorded in history', {
        userId,
        query: query.query,
        error: error.message,
      });
    } catch (recordError) {
      logger.error('Failed to record failed search in history', {
        error: recordError instanceof Error ? recordError.message : 'Unknown error',
        userId,
        query: query.query,
      });
    }
  }

  /**
   * Gets search history for a user
   */
  public async getUserHistory(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      searchType?: string;
      fromDate?: string;
      toDate?: string;
    } = {}
  ): Promise<SearchHistory> {
    const cacheKey = `history:${userId}`;
    let history = this.historyCache.get(cacheKey);

    if (!history) {
      history = await this.loadUserHistory(userId);
      this.historyCache.set(cacheKey, history);
    }

    // Apply filters
    let filteredHistory = [...history];

    if (options.searchType) {
      filteredHistory = filteredHistory.filter(entry => entry.searchType === options.searchType);
    }

    if (options.fromDate) {
      const fromDate = new Date(options.fromDate);
      filteredHistory = filteredHistory.filter(entry => new Date(entry.timestamp) >= fromDate);
    }

    if (options.toDate) {
      const toDate = new Date(options.toDate);
      filteredHistory = filteredHistory.filter(entry => new Date(entry.timestamp) <= toDate);
    }

    // Sort by timestamp (newest first)
    filteredHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply pagination
    const offset = options.offset || 0;
    const limit = options.limit || 50;
    const paginatedHistory = filteredHistory.slice(offset, offset + limit);

    return {
      entries: paginatedHistory,
      totalEntries: filteredHistory.length,
      hasMore: offset + limit < filteredHistory.length,
    };
  }

  /**
   * Clears search history for a user
   */
  public async clearUserHistory(
    userId: string,
    options: {
      searchType?: string;
      olderThan?: string;
    } = {}
  ): Promise<number> {
    const cacheKey = `history:${userId}`;
    let history = this.historyCache.get(cacheKey) || [];

    let entriesToRemove = [...history];

    if (options.searchType) {
      entriesToRemove = entriesToRemove.filter(entry => entry.searchType === options.searchType);
    }

    if (options.olderThan) {
      const cutoffDate = new Date(options.olderThan);
      entriesToRemove = entriesToRemove.filter(entry => new Date(entry.timestamp) < cutoffDate);
    }

    // Remove entries
    const remainingHistory = history.filter(entry => !entriesToRemove.includes(entry));
    
    // Update cache
    this.historyCache.set(cacheKey, remainingHistory);

    // Persist changes
    await this.saveUserHistory(userId, remainingHistory);

    logger.info('Cleared user search history', {
      userId,
      entriesRemoved: entriesToRemove.length,
      searchType: options.searchType,
      olderThan: options.olderThan,
    });

    return entriesToRemove.length;
  }

  // ============================================================================
  // Analytics
  // ============================================================================

  /**
   * Gets search analytics
   */
  public async getSearchAnalytics(
    options: {
      userId?: string;
      searchType?: string;
      fromDate?: string;
      toDate?: string;
      includePopularQueries?: boolean;
      includeTrends?: boolean;
    } = {}
  ): Promise<SearchAnalytics> {
    const cacheKey = this.generateAnalyticsCacheKey(options);
    let analytics = this.analyticsCache.get(cacheKey);

    if (!analytics || this.isAnalyticsCacheExpired(cacheKey)) {
      analytics = await this.calculateAnalytics(options);
      this.analyticsCache.set(cacheKey, analytics);
    }

    return analytics;
  }

  /**
   * Gets popular search queries
   */
  public async getPopularQueries(
    options: {
      searchType?: string;
      fromDate?: string;
      toDate?: string;
      limit?: number;
    } = {}
  ): Promise<PopularQuery[]> {
    const analytics = await this.getSearchAnalytics({
      ...options,
      includePopularQueries: true,
    });

    return analytics.popularQueries || [];
  }

  /**
   * Gets search trends over time
   */
  public async getSearchTrends(
    options: {
      searchType?: string;
      fromDate?: string;
      toDate?: string;
      interval?: 'hour' | 'day' | 'week' | 'month';
    } = {}
  ): Promise<SearchTrend[]> {
    const analytics = await this.getSearchAnalytics({
      ...options,
      includeTrends: true,
    });

    return analytics.trends || [];
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Generates a unique history ID
   */
  private generateHistoryId(): string {
    return `hist_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Determines the search type from the query
   */
  private determineSearchType(query: SearchQuery): string {
    // Try to determine search type from filters or query content
    if (query.filters?.repositorySlug && !query.filters.filePath) {
      return 'repository';
    }
    
    if (query.filters?.filePath || query.filters?.language || query.filters?.fileExtension) {
      return 'code';
    }
    
    if (query.filters?.author || query.filters?.committer) {
      return 'commit';
    }
    
    if (query.filters?.reviewer || query.filters?.state || query.filters?.sourceBranch) {
      return 'pullrequest';
    }
    
    if (query.filters?.role || query.filters?.permission) {
      return 'user';
    }
    
    // Analyze query content for hints
    const queryLower = query.query.toLowerCase();
    
    if (queryLower.includes('repo:') || queryLower.includes('repository:')) {
      return 'repository';
    }
    
    if (queryLower.includes('file:') || queryLower.includes('extension:') || queryLower.includes('language:')) {
      return 'code';
    }
    
    if (queryLower.includes('author:') || queryLower.includes('committer:') || queryLower.includes('commit:')) {
      return 'commit';
    }
    
    if (queryLower.includes('pr:') || queryLower.includes('pullrequest:') || queryLower.includes('reviewer:')) {
      return 'pullrequest';
    }
    
    if (queryLower.includes('user:') || queryLower.includes('@')) {
      return 'user';
    }
    
    // Default to general search
    return 'general';
  }

  /**
   * Adds an entry to user's history
   */
  private async addToUserHistory(userId: string, entry: SearchHistoryEntry): Promise<void> {
    const cacheKey = `history:${userId}`;
    let history = this.historyCache.get(cacheKey) || [];

    // Add new entry at the beginning
    history.unshift(entry);

    // Limit history size
    if (history.length > this.maxHistoryEntries) {
      history = history.slice(0, this.maxHistoryEntries);
    }

    // Update cache
    this.historyCache.set(cacheKey, history);

    // Persist to storage (async, don't wait)
    this.saveUserHistory(userId, history).catch(error => {
      logger.error('Failed to save user history', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
    });
  }

  /**
   * Loads user history from storage
   */
  private async loadUserHistory(userId: string): Promise<SearchHistoryEntry[]> {
    try {
      const cacheKey = `user_history:${userId}`;
      const cachedHistory = await this.cache.get<SearchHistoryEntry[]>(cacheKey);
      
      return cachedHistory || [];
    } catch (error) {
      logger.error('Failed to load user history', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
      return [];
    }
  }

  /**
   * Saves user history to storage
   */
  private async saveUserHistory(userId: string, history: SearchHistoryEntry[]): Promise<void> {
    try {
      const cacheKey = `user_history:${userId}`;
      await this.cache.set(cacheKey, history, 30 * 24 * 60 * 60); // 30 days TTL
    } catch (error) {
      logger.error('Failed to save user history', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
    }
  }

  /**
   * Updates analytics with a new search entry
   */
  private async updateAnalytics(entry: SearchHistoryEntry): Promise<void> {
    // This would typically update aggregated analytics data
    // For now, we'll just clear the analytics cache to force recalculation
    this.analyticsCache.clear();
  }

  /**
   * Calculates search analytics
   */
  private async calculateAnalytics(options: {
    userId?: string;
    searchType?: string;
    fromDate?: string;
    toDate?: string;
    includePopularQueries?: boolean;
    includeTrends?: boolean;
  }): Promise<SearchAnalytics> {
    // This is a simplified implementation
    // In a real application, this would aggregate data from a database
    
    const analytics: SearchAnalytics = {
      totalSearches: 0,
      successfulSearches: 0,
      failedSearches: 0,
      averageExecutionTime: 0,
      searchTypeBreakdown: {},
      serverTypeBreakdown: {},
      period: {
        fromDate: options.fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        toDate: options.toDate || new Date().toISOString(),
      },
    };

    // Get all relevant history entries
    const allEntries = await this.getAllHistoryEntries(options);

    analytics.totalSearches = allEntries.length;
    analytics.successfulSearches = allEntries.filter(entry => entry.success).length;
    analytics.failedSearches = allEntries.filter(entry => !entry.success).length;

    if (allEntries.length > 0) {
      const totalExecutionTime = allEntries
        .filter(entry => entry.success)
        .reduce((sum, entry) => sum + (entry.executionTime || 0), 0);
      
      analytics.averageExecutionTime = totalExecutionTime / analytics.successfulSearches;
    }

    // Calculate breakdowns
    analytics.searchTypeBreakdown = this.calculateBreakdown(allEntries, 'searchType');
    analytics.serverTypeBreakdown = this.calculateBreakdown(allEntries, 'serverType');

    // Calculate popular queries if requested
    if (options.includePopularQueries) {
      analytics.popularQueries = this.calculatePopularQueries(allEntries);
    }

    // Calculate trends if requested
    if (options.includeTrends) {
      analytics.trends = this.calculateTrends(allEntries);
    }

    return analytics;
  }

  /**
   * Gets all history entries matching the criteria
   */
  private async getAllHistoryEntries(options: {
    userId?: string;
    searchType?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<SearchHistoryEntry[]> {
    // In a real implementation, this would query a database
    // For now, we'll aggregate from all cached user histories
    
    const allEntries: SearchHistoryEntry[] = [];
    
    for (const [cacheKey, history] of this.historyCache.entries()) {
      if (cacheKey.startsWith('history:')) {
        const userId = cacheKey.substring('history:'.length);
        
        if (options.userId && userId !== options.userId) {
          continue;
        }
        
        let filteredEntries = [...history];
        
        if (options.searchType) {
          filteredEntries = filteredEntries.filter(entry => entry.searchType === options.searchType);
        }
        
        if (options.fromDate) {
          const fromDate = new Date(options.fromDate);
          filteredEntries = filteredEntries.filter(entry => new Date(entry.timestamp) >= fromDate);
        }
        
        if (options.toDate) {
          const toDate = new Date(options.toDate);
          filteredEntries = filteredEntries.filter(entry => new Date(entry.timestamp) <= toDate);
        }
        
        allEntries.push(...filteredEntries);
      }
    }
    
    return allEntries;
  }

  /**
   * Calculates breakdown by field
   */
  private calculateBreakdown(entries: SearchHistoryEntry[], field: keyof SearchHistoryEntry): Record<string, number> {
    const breakdown: Record<string, number> = {};
    
    entries.forEach(entry => {
      const value = String(entry[field] || 'unknown');
      breakdown[value] = (breakdown[value] || 0) + 1;
    });
    
    return breakdown;
  }

  /**
   * Calculates popular queries
   */
  private calculatePopularQueries(entries: SearchHistoryEntry[]): PopularQuery[] {
    const queryCount: Record<string, { count: number; lastUsed: string; avgExecutionTime: number; successRate: number }> = {};
    
    entries.forEach(entry => {
      const query = entry.query;
      
      if (!queryCount[query]) {
        queryCount[query] = {
          count: 0,
          lastUsed: entry.timestamp,
          avgExecutionTime: 0,
          successRate: 0,
        };
      }
      
      queryCount[query].count += 1;
      
      if (entry.timestamp > queryCount[query].lastUsed) {
        queryCount[query].lastUsed = entry.timestamp;
      }
    });
    
    // Calculate averages and success rates
    Object.keys(queryCount).forEach(query => {
      const queryEntries = entries.filter(entry => entry.query === query);
      const successfulEntries = queryEntries.filter(entry => entry.success);
      
      queryCount[query].avgExecutionTime = successfulEntries.length > 0
        ? successfulEntries.reduce((sum, entry) => sum + (entry.executionTime || 0), 0) / successfulEntries.length
        : 0;
      
      queryCount[query].successRate = queryEntries.length > 0
        ? successfulEntries.length / queryEntries.length
        : 0;
    });
    
    return Object.entries(queryCount)
      .map(([query, stats]) => ({
        query,
        count: stats.count,
        lastUsed: stats.lastUsed,
        avgExecutionTime: stats.avgExecutionTime,
        successRate: stats.successRate,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Top 20 queries
  }

  /**
   * Calculates search trends
   */
  private calculateTrends(entries: SearchHistoryEntry[]): SearchTrend[] {
    // Group entries by day
    const dailyTrends: Record<string, { date: string; count: number; successCount: number }> = {};
    
    entries.forEach(entry => {
      const date = entry.timestamp.substring(0, 10); // YYYY-MM-DD
      
      if (!dailyTrends[date]) {
        dailyTrends[date] = {
          date,
          count: 0,
          successCount: 0,
        };
      }
      
      dailyTrends[date].count += 1;
      
      if (entry.success) {
        dailyTrends[date].successCount += 1;
      }
    });
    
    return Object.values(dailyTrends)
      .map(trend => ({
        ...trend,
        successRate: trend.count > 0 ? trend.successCount / trend.count : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Generates analytics cache key
   */
  private generateAnalyticsCacheKey(options: any): string {
    return `analytics:${JSON.stringify(options)}`;
  }

  /**
   * Checks if analytics cache is expired
   */
  private isAnalyticsCacheExpired(cacheKey: string): boolean {
    // Simple implementation - in practice, you'd track cache timestamps
    return false;
  }

  // ============================================================================
  // Public Utility Methods
  // ============================================================================

  /**
   * Gets search suggestions based on history
   */
  public async getSearchSuggestions(
    userId: string,
    partialQuery: string,
    options: {
      searchType?: string;
      limit?: number;
    } = {}
  ): Promise<string[]> {
    const history = await this.getUserHistory(userId, {
      searchType: options.searchType,
      limit: 500, // Look at more history for suggestions
    });

    const suggestions = new Set<string>();
    const queryLower = partialQuery.toLowerCase();

    history.entries.forEach(entry => {
      if (entry.query.toLowerCase().includes(queryLower) && entry.success) {
        suggestions.add(entry.query);
      }
    });

    return Array.from(suggestions)
      .slice(0, options.limit || 10);
  }

  /**
   * Gets recent search queries for a user
   */
  public async getRecentQueries(
    userId: string,
    options: {
      searchType?: string;
      limit?: number;
      successfulOnly?: boolean;
    } = {}
  ): Promise<string[]> {
    const history = await this.getUserHistory(userId, {
      searchType: options.searchType,
      limit: options.limit || 10,
    });

    let queries = history.entries;

    if (options.successfulOnly) {
      queries = queries.filter(entry => entry.success);
    }

    // Remove duplicates while preserving order
    const uniqueQueries = new Set<string>();
    const result: string[] = [];

    queries.forEach(entry => {
      if (!uniqueQueries.has(entry.query)) {
        uniqueQueries.add(entry.query);
        result.push(entry.query);
      }
    });

    return result;
  }
}

// ============================================================================
// Export
// ============================================================================

export default SearchHistoryService;
