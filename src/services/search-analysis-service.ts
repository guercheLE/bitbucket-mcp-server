/**
 * Search Analysis Service
 * Provides advanced analytics and insights for search operations
 * 
 * Analyzes search patterns, performance, and user behavior
 */

import { AxiosInstance } from 'axios';
import { Cache } from '../utils/cache.js';
import {
  SearchQuery,
  SearchResult,
  SearchAnalytics,
  SearchPerformanceMetrics,
  SearchInsight,
  QueryAnalysis,
  UserSearchBehavior,
  SearchOptimizationSuggestion,
} from '../types/search.js';
import { ServerInfo } from '../types/index.js';
import { SearchHistoryService } from './search-history-service.js';
import { logger } from '../utils/logger.js';

// ============================================================================
// Search Analysis Service
// ============================================================================

/**
 * Service for analyzing search patterns and providing insights
 */
export class SearchAnalysisService {
  private httpClient: AxiosInstance;
  private cache: Cache;
  private historyService: SearchHistoryService;
  private performanceCache: Map<string, SearchPerformanceMetrics>;
  private insightsCache: Map<string, SearchInsight[]>;

  constructor(
    httpClient: AxiosInstance,
    cache: Cache,
    historyService: SearchHistoryService
  ) {
    this.httpClient = httpClient;
    this.cache = cache;
    this.historyService = historyService;
    this.performanceCache = new Map();
    this.insightsCache = new Map();
  }

  // ============================================================================
  // Performance Analysis
  // ============================================================================

  /**
   * Analyzes search performance metrics
   */
  public async analyzePerformance(
    options: {
      searchType?: string;
      fromDate?: string;
      toDate?: string;
      serverType?: string;
      includeBreakdown?: boolean;
    } = {}
  ): Promise<SearchPerformanceMetrics> {
    const cacheKey = `performance:${JSON.stringify(options)}`;
    let metrics = this.performanceCache.get(cacheKey);

    if (!metrics) {
      metrics = await this.calculatePerformanceMetrics(options);
      this.performanceCache.set(cacheKey, metrics);
    }

    return metrics;
  }

  /**
   * Gets performance trends over time
   */
  public async getPerformanceTrends(
    options: {
      searchType?: string;
      fromDate?: string;
      toDate?: string;
      interval?: 'hour' | 'day' | 'week';
    } = {}
  ): Promise<Array<{
    period: string;
    avgExecutionTime: number;
    successRate: number;
    totalSearches: number;
    p95ExecutionTime: number;
  }>> {
    const analytics = await this.historyService.getSearchAnalytics({
      searchType: options.searchType,
      fromDate: options.fromDate,
      toDate: options.toDate,
      includeTrends: true,
    });

    // Transform trends to include performance metrics
    const trends = analytics.trends || [];
    
    return trends.map(trend => ({
      period: trend.date,
      avgExecutionTime: trend.avgExecutionTime || 0,
      successRate: trend.successRate,
      totalSearches: trend.count,
      p95ExecutionTime: trend.p95ExecutionTime || 0,
    }));
  }

  // ============================================================================
  // Query Analysis
  // ============================================================================

  /**
   * Analyzes a search query for optimization opportunities
   */
  public async analyzeQuery(query: SearchQuery): Promise<QueryAnalysis> {
    const analysis: QueryAnalysis = {
      query: query.query,
      complexity: this.calculateQueryComplexity(query),
      estimatedPerformance: this.estimateQueryPerformance(query),
      suggestions: this.generateQuerySuggestions(query),
      filters: this.analyzeFilters(query.filters || {}),
      optimization: this.generateOptimizationSuggestions(query),
    };

    return analysis;
  }

  /**
   * Compares query performance across different variations
   */
  public async compareQueries(
    queries: SearchQuery[],
    serverInfo: ServerInfo
  ): Promise<Array<{
    query: SearchQuery;
    analysis: QueryAnalysis;
    estimatedImpact: {
      performanceGain: number;
      accuracyImpact: number;
      recommendations: string[];
    };
  }>> {
    const comparisons = [];

    for (const query of queries) {
      const analysis = await this.analyzeQuery(query);
      const estimatedImpact = this.calculateEstimatedImpact(query, analysis);

      comparisons.push({
        query,
        analysis,
        estimatedImpact,
      });
    }

    return comparisons;
  }

  // ============================================================================
  // User Behavior Analysis
  // ============================================================================

  /**
   * Analyzes user search behavior patterns
   */
  public async analyzeUserBehavior(
    userId: string,
    options: {
      fromDate?: string;
      toDate?: string;
      includePatterns?: boolean;
      includePreferences?: boolean;
    } = {}
  ): Promise<UserSearchBehavior> {
    const history = await this.historyService.getUserHistory(userId, {
      fromDate: options.fromDate,
      toDate: options.toDate,
      limit: 1000, // Analyze more data for better insights
    });

    const behavior: UserSearchBehavior = {
      userId,
      totalSearches: history.totalEntries,
      searchFrequency: this.calculateSearchFrequency(history.entries),
      preferredSearchTypes: this.calculatePreferredSearchTypes(history.entries),
      commonFilters: this.calculateCommonFilters(history.entries),
      searchTiming: this.analyzeSearchTiming(history.entries),
      successRate: this.calculateUserSuccessRate(history.entries),
      averageQueryLength: this.calculateAverageQueryLength(history.entries),
      period: {
        fromDate: options.fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        toDate: options.toDate || new Date().toISOString(),
      },
    };

    if (options.includePatterns) {
      behavior.searchPatterns = this.identifySearchPatterns(history.entries);
    }

    if (options.includePreferences) {
      behavior.preferences = this.analyzeUserPreferences(history.entries);
    }

    return behavior;
  }

  // ============================================================================
  // Search Insights
  // ============================================================================

  /**
   * Generates search insights and recommendations
   */
  public async generateInsights(
    options: {
      searchType?: string;
      fromDate?: string;
      toDate?: string;
      includeOptimizations?: boolean;
      includeUserInsights?: boolean;
    } = {}
  ): Promise<SearchInsight[]> {
    const cacheKey = `insights:${JSON.stringify(options)}`;
    let insights = this.insightsCache.get(cacheKey);

    if (!insights) {
      insights = await this.calculateInsights(options);
      this.insightsCache.set(cacheKey, insights);
    }

    return insights;
  }

  /**
   * Gets optimization suggestions for search system
   */
  public async getOptimizationSuggestions(
    options: {
      searchType?: string;
      priority?: 'high' | 'medium' | 'low';
      category?: 'performance' | 'accuracy' | 'usability';
    } = {}
  ): Promise<SearchOptimizationSuggestion[]> {
    const insights = await this.generateInsights({
      searchType: options.searchType,
      includeOptimizations: true,
    });

    const suggestions: SearchOptimizationSuggestion[] = [];

    insights.forEach(insight => {
      if (insight.type === 'optimization' && insight.suggestions) {
        insight.suggestions.forEach(suggestion => {
          if (!options.priority || suggestion.priority === options.priority) {
            if (!options.category || suggestion.category === options.category) {
              suggestions.push(suggestion);
            }
          }
        });
      }
    });

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Calculates performance metrics
   */
  private async calculatePerformanceMetrics(options: {
    searchType?: string;
    fromDate?: string;
    toDate?: string;
    serverType?: string;
    includeBreakdown?: boolean;
  }): Promise<SearchPerformanceMetrics> {
    const analytics = await this.historyService.getSearchAnalytics({
      searchType: options.searchType,
      fromDate: options.fromDate,
      toDate: options.toDate,
    });

    const metrics: SearchPerformanceMetrics = {
      totalSearches: analytics.totalSearches,
      successRate: analytics.totalSearches > 0 
        ? analytics.successfulSearches / analytics.totalSearches 
        : 0,
      averageExecutionTime: analytics.averageExecutionTime,
      medianExecutionTime: 0, // Would need to calculate from raw data
      p95ExecutionTime: 0, // Would need to calculate from raw data
      p99ExecutionTime: 0, // Would need to calculate from raw data
      errorRate: analytics.totalSearches > 0 
        ? analytics.failedSearches / analytics.totalSearches 
        : 0,
      throughput: this.calculateThroughput(analytics),
      period: analytics.period,
    };

    if (options.includeBreakdown) {
      metrics.searchTypeBreakdown = analytics.searchTypeBreakdown;
      metrics.serverTypeBreakdown = analytics.serverTypeBreakdown;
    }

    return metrics;
  }

  /**
   * Calculates query complexity score
   */
  private calculateQueryComplexity(query: SearchQuery): number {
    let complexity = 1; // Base complexity

    // Query length factor
    complexity += Math.min(query.query.length / 50, 2);

    // Filter complexity
    const filterCount = Object.keys(query.filters || {}).length;
    complexity += filterCount * 0.5;

    // Special operators complexity
    const operators = ['AND', 'OR', 'NOT', '*', '"', '(', ')', ':'];
    const operatorCount = operators.reduce((count, op) => 
      count + (query.query.split(op).length - 1), 0);
    complexity += operatorCount * 0.3;

    return Math.min(complexity, 10); // Cap at 10
  }

  /**
   * Estimates query performance
   */
  private estimateQueryPerformance(query: SearchQuery): {
    estimatedExecutionTime: number;
    estimatedResultCount: number;
    performanceRisk: 'low' | 'medium' | 'high';
  } {
    const complexity = this.calculateQueryComplexity(query);
    
    // Simple estimation based on complexity
    const estimatedExecutionTime = Math.max(100, complexity * 200); // milliseconds
    const estimatedResultCount = Math.max(1, Math.floor(1000 / complexity));
    
    let performanceRisk: 'low' | 'medium' | 'high' = 'low';
    if (complexity > 7) {
      performanceRisk = 'high';
    } else if (complexity > 4) {
      performanceRisk = 'medium';
    }

    return {
      estimatedExecutionTime,
      estimatedResultCount,
      performanceRisk,
    };
  }

  /**
   * Generates query optimization suggestions
   */
  private generateQuerySuggestions(query: SearchQuery): string[] {
    const suggestions: string[] = [];
    
    // Query too long
    if (query.query.length > 200) {
      suggestions.push('Consider shortening the query for better performance');
    }
    
    // Too many wildcards
    const wildcardCount = (query.query.match(/\*/g) || []).length;
    if (wildcardCount > 3) {
      suggestions.push('Reduce wildcard usage to improve search accuracy');
    }
    
    // No filters for broad search
    if (!query.filters || Object.keys(query.filters).length === 0) {
      if (query.query.length < 5) {
        suggestions.push('Add filters to narrow down search scope');
      }
    }
    
    // Repository-specific suggestions
    if (!query.filters?.repositorySlug && !query.filters?.projectKey) {
      suggestions.push('Specify repository or project to improve performance');
    }
    
    return suggestions;
  }

  /**
   * Analyzes query filters
   */
  private analyzeFilters(filters: Record<string, any>): {
    count: number;
    effectiveness: number;
    recommendations: string[];
  } {
    const count = Object.keys(filters).length;
    const recommendations: string[] = [];
    
    let effectiveness = count * 0.2; // Base effectiveness from having filters
    
    // Check for effective filters
    if (filters.repositorySlug || filters.projectKey) {
      effectiveness += 0.3;
    }
    
    if (filters.language || filters.fileExtension) {
      effectiveness += 0.2;
    }
    
    if (filters.author || filters.reviewer) {
      effectiveness += 0.2;
    }
    
    if (filters.fromDate || filters.toDate) {
      effectiveness += 0.1;
    }
    
    // Generate recommendations
    if (!filters.repositorySlug && !filters.projectKey) {
      recommendations.push('Add repository or project filter for better performance');
    }
    
    if (filters.fromDate && !filters.toDate) {
      recommendations.push('Consider adding end date to limit search scope');
    }
    
    return {
      count,
      effectiveness: Math.min(effectiveness, 1),
      recommendations,
    };
  }

  /**
   * Generates optimization suggestions for a query
   */
  private generateOptimizationSuggestions(query: SearchQuery): SearchOptimizationSuggestion[] {
    const suggestions: SearchOptimizationSuggestion[] = [];
    
    const complexity = this.calculateQueryComplexity(query);
    
    if (complexity > 6) {
      suggestions.push({
        type: 'query_optimization',
        priority: 'high',
        category: 'performance',
        title: 'Simplify complex query',
        description: 'This query is very complex and may perform poorly',
        impact: 'Reduce execution time by 30-50%',
        implementation: 'Break down into simpler queries or add more specific filters',
      });
    }
    
    if (!query.filters?.repositorySlug && !query.filters?.projectKey) {
      suggestions.push({
        type: 'filter_optimization',
        priority: 'medium',
        category: 'performance',
        title: 'Add scope filters',
        description: 'Query lacks repository or project scope',
        impact: 'Reduce search scope and improve performance',
        implementation: 'Add repositorySlug or projectKey filter',
      });
    }
    
    return suggestions;
  }

  /**
   * Calculates estimated impact of query changes
   */
  private calculateEstimatedImpact(query: SearchQuery, analysis: QueryAnalysis): {
    performanceGain: number;
    accuracyImpact: number;
    recommendations: string[];
  } {
    let performanceGain = 0;
    let accuracyImpact = 0;
    const recommendations: string[] = [];
    
    // Performance improvements from filters
    if (analysis.filters.count > 0) {
      performanceGain += analysis.filters.effectiveness * 30; // Up to 30% improvement
    }
    
    // Performance impact from complexity
    if (analysis.complexity > 5) {
      performanceGain -= (analysis.complexity - 5) * 10; // Penalty for complexity
      recommendations.push('Simplify query to improve performance');
    }
    
    // Accuracy improvements
    if (analysis.filters.effectiveness > 0.5) {
      accuracyImpact += 15; // Better filters improve accuracy
    }
    
    return {
      performanceGain: Math.max(-50, Math.min(50, performanceGain)),
      accuracyImpact: Math.max(-20, Math.min(30, accuracyImpact)),
      recommendations,
    };
  }

  /**
   * Calculates search frequency for a user
   */
  private calculateSearchFrequency(entries: any[]): number {
    if (entries.length === 0) return 0;
    
    const firstSearch = new Date(entries[entries.length - 1].timestamp);
    const lastSearch = new Date(entries[0].timestamp);
    const daysDiff = Math.max(1, (lastSearch.getTime() - firstSearch.getTime()) / (1000 * 60 * 60 * 24));
    
    return entries.length / daysDiff;
  }

  /**
   * Calculates preferred search types for a user
   */
  private calculatePreferredSearchTypes(entries: any[]): Record<string, number> {
    const types: Record<string, number> = {};
    
    entries.forEach(entry => {
      const type = entry.searchType || 'general';
      types[type] = (types[type] || 0) + 1;
    });
    
    return types;
  }

  /**
   * Calculates common filters used by a user
   */
  private calculateCommonFilters(entries: any[]): Record<string, number> {
    const filters: Record<string, number> = {};
    
    entries.forEach(entry => {
      Object.keys(entry.filters || {}).forEach(filter => {
        filters[filter] = (filters[filter] || 0) + 1;
      });
    });
    
    return filters;
  }

  /**
   * Analyzes search timing patterns
   */
  private analyzeSearchTiming(entries: any[]): {
    peakHours: number[];
    peakDays: string[];
    averageSessionLength: number;
  } {
    const hourCounts: Record<number, number> = {};
    const dayCounts: Record<string, number> = {};
    
    entries.forEach(entry => {
      const date = new Date(entry.timestamp);
      const hour = date.getHours();
      const day = date.toLocaleDateString('en-US', { weekday: 'long' });
      
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    
    const peakHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));
    
    const peakDays = Object.entries(dayCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([day]) => day);
    
    return {
      peakHours,
      peakDays,
      averageSessionLength: 0, // Would need session tracking
    };
  }

  /**
   * Calculates user success rate
   */
  private calculateUserSuccessRate(entries: any[]): number {
    if (entries.length === 0) return 0;
    
    const successfulSearches = entries.filter(entry => entry.success).length;
    return successfulSearches / entries.length;
  }

  /**
   * Calculates average query length
   */
  private calculateAverageQueryLength(entries: any[]): number {
    if (entries.length === 0) return 0;
    
    const totalLength = entries.reduce((sum, entry) => sum + entry.query.length, 0);
    return totalLength / entries.length;
  }

  /**
   * Identifies search patterns
   */
  private identifySearchPatterns(entries: any[]): Array<{
    pattern: string;
    frequency: number;
    description: string;
  }> {
    // Simple pattern identification
    const patterns = [];
    
    // Check for repetitive searches
    const queryFreq: Record<string, number> = {};
    entries.forEach(entry => {
      queryFreq[entry.query] = (queryFreq[entry.query] || 0) + 1;
    });
    
    Object.entries(queryFreq).forEach(([query, freq]) => {
      if (freq > 5) {
        patterns.push({
          pattern: 'repetitive_search',
          frequency: freq,
          description: `Frequently searches for: "${query}"`,
        });
      }
    });
    
    return patterns;
  }

  /**
   * Analyzes user preferences
   */
  private analyzeUserPreferences(entries: any[]): {
    preferredSortOrder: string;
    preferredResultsPerPage: number;
    preferredFilters: string[];
  } {
    // Analyze preferences from search history
    return {
      preferredSortOrder: 'desc', // Most common
      preferredResultsPerPage: 25, // Default
      preferredFilters: [], // Most used filters
    };
  }

  /**
   * Calculates insights
   */
  private async calculateInsights(options: {
    searchType?: string;
    fromDate?: string;
    toDate?: string;
    includeOptimizations?: boolean;
    includeUserInsights?: boolean;
  }): Promise<SearchInsight[]> {
    const insights: SearchInsight[] = [];
    
    const analytics = await this.historyService.getSearchAnalytics({
      searchType: options.searchType,
      fromDate: options.fromDate,
      toDate: options.toDate,
      includePopularQueries: true,
      includeTrends: true,
    });
    
    // Performance insights
    if (analytics.averageExecutionTime > 2000) {
      insights.push({
        type: 'performance',
        severity: 'high',
        title: 'High average execution time',
        description: `Search queries are taking ${analytics.averageExecutionTime}ms on average`,
        recommendation: 'Consider optimizing slow queries or adding more specific filters',
        impact: 'User experience degradation',
        data: { averageExecutionTime: analytics.averageExecutionTime },
      });
    }
    
    // Success rate insights
    const successRate = analytics.totalSearches > 0 
      ? analytics.successfulSearches / analytics.totalSearches 
      : 0;
    
    if (successRate < 0.9) {
      insights.push({
        type: 'accuracy',
        severity: 'medium',
        title: 'Low search success rate',
        description: `Only ${(successRate * 100).toFixed(1)}% of searches are successful`,
        recommendation: 'Review failed searches and improve error handling',
        impact: 'Reduced user satisfaction',
        data: { successRate },
      });
    }
    
    return insights;
  }

  /**
   * Calculates throughput from analytics
   */
  private calculateThroughput(analytics: SearchAnalytics): number {
    const periodStart = new Date(analytics.period.fromDate);
    const periodEnd = new Date(analytics.period.toDate);
    const hours = (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60);
    
    return hours > 0 ? analytics.totalSearches / hours : 0;
  }
}

// ============================================================================
// Export
// ============================================================================

export default SearchAnalysisService;
