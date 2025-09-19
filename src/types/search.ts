/**
 * Search Data Models
 * Types and interfaces for search functionality
 * 
 * Based on data-model.md and search contracts
 */

// ============================================================================
// Base Search Types
// ============================================================================

/**
 * Types of search results supported
 */
export type SearchResultType = 
  | 'repository'
  | 'commit' 
  | 'pullrequest'
  | 'code'
  | 'user';

/**
 * Sort order options
 */
export type SortOrder = 'asc' | 'desc';

// ============================================================================
// Search Query Interface
// ============================================================================

/**
 * Base search query interface
 */
export interface SearchQuery {
  /** Search term - required, 1-500 characters */
  query: string;
  /** Filters to apply to search */
  filters?: SearchFilters;
  /** Field to sort by */
  sortBy?: string;
  /** Sort order */
  sortOrder?: SortOrder;
  /** Page number (0-based) */
  page?: number;
  /** Results per page (1-1000) */
  limit?: number;
  /** Search types */
  searchTypes?: SearchResultType[];
  /** Search ID */
  id?: string;
}

/**
 * Search filters interface
 */
export interface SearchFilters {
  // Common filters
  /** Project key (Data Center) */
  projectKey?: string;
  /** Workspace (Cloud) */
  workspace?: string;
  /** Repository slug */
  repositorySlug?: string;
  
  // Date filters
  /** Start date (ISO 8601) */
  fromDate?: string;
  /** End date (ISO 8601) */
  toDate?: string;
  
  // Commit-specific filters
  /** Commit author */
  author?: string;
  /** Commit committer */
  committer?: string;
  
  // Pull request-specific filters
  /** Pull request state */
  state?: 'OPEN' | 'MERGED' | 'DECLINED' | 'SUPERSEDED';
  /** Pull request reviewer */
  reviewer?: string;
  /** Source branch */
  sourceBranch?: string;
  /** Target branch */
  targetBranch?: string;
  
  // Code-specific filters
  /** File extension (e.g., .ts, .js) */
  fileExtension?: string;
  /** Programming language */
  language?: string;
  /** File path pattern */
  filePath?: string;
  /** Branch name */
  branch?: string;
  
  // Repository-specific filters
  /** Whether repository is public */
  isPublic?: boolean;
  
  // User-specific filters
  /** User role */
  role?: string;
  /** User permission */
  permission?: string;
  /** Whether user is active */
  active?: boolean;
}

// ============================================================================
// Search Result Interfaces
// ============================================================================

/**
 * Base search result interface
 */
export interface SearchResult {
  /** Type of search result */
  type: SearchResultType;
  /** Unique identifier */
  id: string;
  /** Title or name */
  title: string;
  /** Description or summary */
  description?: string;
  /** URL to access the item */
  url: string;
  /** Type-specific metadata */
  metadata: SearchResultMetadata;
  /** Relevance score (0-1) */
  relevanceScore: number;
}

/**
 * Search result metadata - union of all possible metadata types
 */
export interface SearchResultMetadata {
  // Common metadata
  projectKey?: string;
  workspace?: string;
  repositorySlug?: string;
  lastModified?: string;
  
  // Repository metadata
  isPublic?: boolean;
  language?: string;
  size?: number;
  
  // Commit metadata
  author?: string;
  committer?: string;
  commitDate?: string;
  message?: string;
  
  // Pull request metadata
  state?: string;
  createdDate?: string;
  updatedDate?: string;
  reviewers?: string[];
  
  // Code metadata
  filePath?: string;
  lineNumber?: number;
  context?: string;
  
  // User metadata
  displayName?: string;
  emailAddress?: string;
  active?: boolean;
}

// ============================================================================
// Specific Result Type Interfaces
// ============================================================================

/**
 * Repository search result
 */
export interface RepositorySearchResult extends SearchResult {
  type: 'repository';
  metadata: RepositoryMetadata;
}

/**
 * Repository-specific metadata
 */
export interface RepositoryMetadata {
  projectKey?: string;
  workspace?: string;
  repositorySlug?: string;
  isPublic?: boolean;
  language?: string;
  size?: number;
  lastModified?: string;
}

/**
 * Commit search result
 */
export interface CommitSearchResult extends SearchResult {
  type: 'commit';
  metadata: CommitMetadata;
}

/**
 * Commit-specific metadata
 */
export interface CommitMetadata {
  projectKey?: string;
  workspace?: string;
  repositorySlug?: string;
  author?: string;
  committer?: string;
  commitDate?: string;
  message?: string;
}

/**
 * Pull request search result
 */
export interface PullRequestSearchResult extends SearchResult {
  type: 'pullrequest';
  metadata: PullRequestMetadata;
}

/**
 * Pull request-specific metadata
 */
export interface PullRequestMetadata {
  projectKey?: string;
  workspace?: string;
  repositorySlug?: string;
  state?: 'OPEN' | 'MERGED' | 'DECLINED' | 'SUPERSEDED';
  author?: string;
  createdDate?: string;
  updatedDate?: string;
  reviewers?: string[];
  sourceBranch?: string;
  targetBranch?: string;
  commentCount?: number;
  taskCount?: number;
}

/**
 * Code search result
 */
export interface CodeSearchResult extends SearchResult {
  type: 'code';
  metadata: CodeMetadata;
}

/**
 * Code-specific metadata
 */
export interface CodeMetadata {
  projectKey?: string;
  workspace?: string;
  repositorySlug?: string;
  filePath?: string;
  lineNumber?: number;
  language?: string;
  context?: string;
  fileExtension?: string;
  fileSize?: number;
  branch?: string;
  lastModified?: string;
  matches?: number;
}

/**
 * User search result
 */
export interface UserSearchResult extends SearchResult {
  type: 'user';
  metadata: UserMetadata;
}

/**
 * User-specific metadata
 */
export interface UserMetadata {
  displayName?: string;
  emailAddress?: string;
  active?: boolean;
  username?: string;
  role?: string;
  workspace?: string;
  lastActive?: string;
  created?: string;
  avatarUrl?: string;
}

// ============================================================================
// Pagination Interface
// ============================================================================

/**
 * Search pagination information
 */
export interface SearchPagination {
  /** Current page number (0-based) */
  page: number;
  /** Results per page */
  limit: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of results */
  totalResults: number;
  /** Whether there is a next page */
  hasNext: boolean;
  /** Whether there is a previous page */
  hasPrevious: boolean;
  /** Next page number (if available) */
  nextPage?: number;
  /** Previous page number (if available) */
  previousPage?: number;
}

// ============================================================================
// Search Response Interface
// ============================================================================

/**
 * Search response interface
 */
export interface SearchResponse {
  /** Array of search results */
  results: SearchResult[];
  /** Pagination information */
  pagination: SearchPagination;
  /** Total number of results */
  totalCount: number;
  /** Search execution time in milliseconds */
  searchTime: number;
  /** Search suggestions based on query */
  suggestions?: string[];
  /** Search metadata */
  metadata: SearchResponseMetadata;
}

/**
 * Search response metadata
 */
export interface SearchResponseMetadata {
  /** Execution time in milliseconds */
  executionTime: number;
  /** Search types used */
  searchTypes: SearchResultType[];
  /** Whether result was from cache */
  cacheHit: boolean;
}

// ============================================================================
// Search History Interface
// ============================================================================

/**
 * Search history entry
 */
export interface SearchHistory {
  /** User ID who performed the search */
  userId?: string;
  /** Search query executed */
  query?: string;
  /** When the search was executed (ISO 8601) */
  timestamp?: string;
  /** Number of results returned */
  resultCount?: number;
  /** Filters that were applied */
  filters?: SearchFilters;
  /** Type of search that was executed */
  searchType?: SearchResultType;
  /** History entries */
  entries: SearchHistoryEntry[];
  /** Total entries count */
  totalEntries: number;
  /** Whether there are more entries */
  hasMore?: boolean;
}

/**
 * Individual search history entry
 */
export interface SearchHistoryEntry {
  /** Entry ID */
  id: string;
  /** User ID who performed the search */
  userId: string;
  /** Search query executed */
  query: string;
  /** When the search was executed (ISO 8601) */
  timestamp: string;
  /** Number of results returned */
  resultCount: number;
  /** Total results count */
  totalResults?: number;
  /** Filters that were applied */
  filters: SearchFilters;
  /** Type of search that was executed */
  searchType: SearchResultType;
  /** Whether search was successful */
  success: boolean;
  /** Execution time in milliseconds */
  executionTime: number;
  /** Server type (datacenter/cloud) */
  serverType: 'datacenter' | 'cloud';
}

// ============================================================================
// Search Analytics Interface
// ============================================================================

/**
 * Search analytics data
 */
export interface SearchAnalytics {
  /** Total number of searches */
  totalSearches: number;
  /** Successful searches count */
  successfulSearches: number;
  /** Failed searches count */
  failedSearches: number;
  /** Average search time in milliseconds */
  averageSearchTime: number;
  /** Average execution time in milliseconds */
  averageExecutionTime: number;
  /** Most popular search terms */
  popularTerms: SearchTermFrequency[];
  /** Popular queries */
  popularQueries: PopularQuery[];
  /** Search trends */
  trends: SearchTrend[];
  /** Search performance metrics */
  performanceMetrics: SearchPerformanceMetrics;
  /** Search usage by type */
  searchTypeUsage: SearchTypeUsage[];
  /** Search type breakdown */
  searchTypeBreakdown: Record<string, number>;
  /** Server type breakdown */
  serverTypeBreakdown: Record<string, number>;
  /** Analytics period */
  period: {
    fromDate: string;
    toDate: string;
  };
}

/**
 * Search term frequency
 */
export interface SearchTermFrequency {
  /** Search term */
  term: string;
  /** Number of times searched */
  frequency: number;
  /** Percentage of total searches */
  percentage: number;
}

/**
 * Search performance metrics
 */
export interface SearchPerformanceMetrics {
  /** Average response time in milliseconds */
  averageResponseTime: number;
  /** 95th percentile response time */
  p95ResponseTime: number;
  /** 99th percentile response time */
  p99ResponseTime: number;
  /** Success rate percentage */
  successRate: number;
  /** Error rate percentage */
  errorRate: number;
  /** Total searches count */
  totalSearches: number;
  /** Search type breakdown */
  searchTypeBreakdown: Record<string, number>;
  /** Server type breakdown */
  serverTypeBreakdown: Record<string, number>;
  /** Average execution time */
  averageExecutionTime: number;
  /** Median execution time */
  medianExecutionTime?: number;
  /** 95th percentile execution time */
  p95ExecutionTime?: number;
  /** 99th percentile execution time */
  p99ExecutionTime?: number;
  /** Search throughput */
  throughput?: number;
}

/**
 * Search type usage statistics
 */
export interface SearchTypeUsage {
  /** Type of search */
  type: SearchResultType;
  /** Number of searches */
  count: number;
  /** Percentage of total searches */
  percentage: number;
}

// ============================================================================
// Search Configuration Interface
// ============================================================================

/**
 * Search configuration
 */
export interface SearchConfiguration {
  /** Maximum results per page */
  maxResultsPerPage: number;
  /** Default results per page */
  defaultResultsPerPage: number;
  /** Search timeout in milliseconds */
  searchTimeout: number;
  /** Cache TTL in milliseconds */
  cacheTtl: number;
  /** Cache timeout in seconds */
  cacheTimeout: number;
  /** History retention period in days */
  historyRetentionDays: number;
  /** Maximum history entries */
  maxHistoryEntries: number;
  /** Enabled search types */
  enabledSearchTypes: SearchResultType[];
  /** Rate limiting configuration */
  rateLimiting: SearchRateLimitConfig;
  /** Enable analytics */
  enableAnalytics: boolean;
  /** Enable history */
  enableHistory: boolean;
  /** Enable suggestions */
  enableSuggestions: boolean;
  /** Performance threshold in milliseconds */
  performanceThreshold: number;
}

/**
 * Search rate limiting configuration
 */
export interface SearchRateLimitConfig {
  /** Maximum requests per minute */
  maxRequestsPerMinute: number;
  /** Maximum requests per hour */
  maxRequestsPerHour: number;
  /** Maximum requests per day */
  maxRequestsPerDay: number;
}

// ============================================================================
// Search Index Interface
// ============================================================================

/**
 * Search index information
 */
export interface SearchIndex {
  /** Index ID */
  id: string;
  /** Index name */
  name: string;
  /** Index type */
  type: SearchResultType;
  /** Index status */
  status: 'active' | 'building' | 'error' | 'disabled';
  /** Last update timestamp */
  lastUpdated: string;
  /** Number of documents in index */
  documentCount: number;
  /** Index size in bytes */
  sizeBytes: number;
}

// ============================================================================
// Error Interfaces
// ============================================================================

/**
 * Search error interface
 */
export interface SearchError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Error details */
  details?: Record<string, any>;
  /** Timestamp when error occurred */
  timestamp: string;
  /** Correlation ID for tracking */
  correlationId?: string;
}

// ============================================================================
// Search Analysis Interfaces
// ============================================================================

/**
 * Search insight interface
 */
export interface SearchInsight {
  /** Insight type */
  type: 'performance' | 'usage' | 'optimization' | 'trend' | 'accuracy';
  /** Insight title */
  title: string;
  /** Insight description */
  description: string;
  /** Insight priority */
  priority: 'high' | 'medium' | 'low';
  /** Insight suggestions */
  suggestions: SearchOptimizationSuggestion[];
  /** Insight data */
  data: Record<string, any>;
  /** Insight severity */
  severity?: 'high' | 'medium' | 'low';
  /** Insight recommendation */
  recommendation?: string;
  /** Insight category */
  category?: string;
  /** Insight impact */
  impact?: string;
}

/**
 * Query analysis interface
 */
export interface QueryAnalysis {
  /** Query text */
  query: string;
  /** Query complexity score */
  complexity: number;
  /** Query effectiveness score */
  effectiveness: number;
  /** Query suggestions */
  suggestions: string[];
  /** Query patterns */
  patterns: string[];
  /** Query filters analysis */
  filters: {
    count: number;
    effectiveness: number;
  };
  /** Estimated performance */
  estimatedPerformance: number | {
    estimatedExecutionTime: number;
    estimatedResultCount: number;
    performanceRisk: 'low' | 'medium' | 'high';
  };
}

/**
 * User search behavior interface
 */
export interface UserSearchBehavior {
  /** User ID */
  userId: string;
  /** Total searches performed */
  totalSearches: number;
  /** Search frequency */
  searchFrequency: number;
  /** Preferred search types */
  preferredSearchTypes: SearchResultType[];
  /** Common filters used */
  commonFilters: Record<string, any>;
  /** Search timing patterns */
  searchTiming: Record<string, any>;
  /** Success rate */
  successRate: number;
  /** Average query length */
  averageQueryLength: number;
  /** Search patterns */
  searchPatterns: string[];
  /** User preferences */
  preferences: Record<string, any>;
  /** Analysis period */
  period?: {
    fromDate: string;
    toDate: string;
  };
}

/**
 * Search optimization suggestion interface
 */
export interface SearchOptimizationSuggestion {
  /** Suggestion type */
  type: 'query' | 'filter' | 'sort' | 'pagination' | 'query_optimization' | 'filter_optimization';
  /** Suggestion title */
  title: string;
  /** Suggestion description */
  description: string;
  /** Suggestion priority */
  priority: 'high' | 'medium' | 'low';
  /** Suggestion impact */
  impact: 'high' | 'medium' | 'low' | 'Reduce execution time by 30-50%' | 'Reduce search scope and improve performance';
  /** Suggestion implementation */
  implementation: string;
  /** Suggestion category */
  category?: string;
}

/**
 * Search context interface
 */
export interface SearchContext {
  /** User ID */
  userId?: string;
  /** Session ID */
  sessionId?: string;
  /** Request timestamp */
  timestamp: string;
  /** User agent */
  userAgent?: string;
  /** IP address */
  ipAddress?: string;
  /** Search types requested */
  searchTypes: SearchResultType[];
  /** Request metadata */
  metadata: Record<string, any>;
}

/**
 * Multi-search request interface
 */
export interface MultiSearchRequest {
  /** Search requests */
  searches: SearchQuery[];
  /** Search context */
  context: SearchContext;
  /** Request options */
  options: {
    /** Merge results */
    mergeResults: boolean;
    /** Sort merged results */
    sortMerged: boolean;
    /** Deduplicate results */
    deduplicate: boolean;
  };
}

/**
 * Multi-search response interface
 */
export interface MultiSearchResponse {
  /** Individual search responses */
  responses: SearchResponse[];
  /** Merged results (if requested) */
  mergedResults?: SearchResult[];
  /** Search results */
  searches?: any[];
  /** Response metadata */
  metadata: {
    /** Total execution time */
    totalExecutionTime: number;
    /** Execution time */
    executionTime?: number;
    /** Successful searches */
    successfulSearches: number;
    /** Failed searches */
    failedSearches: number;
    /** Cache hits */
    cacheHits: number;
    /** Search ID */
    searchId?: string;
    /** Total searches */
    totalSearches?: number;
  };
}

/**
 * Search suggestion interface
 */
export interface SearchSuggestion {
  /** Suggestion text */
  text: string;
  /** Suggestion type */
  type: 'query' | 'filter' | 'sort' | 'history' | 'popular';
  /** Suggestion confidence */
  confidence: number;
  /** Suggestion context */
  context?: string;
  /** Suggestion query */
  query?: string;
  /** Suggestion source */
  source?: string;
}

/**
 * Popular query interface
 */
export interface PopularQuery {
  /** Query text */
  query: string;
  /** Query frequency */
  frequency: number;
  /** Query success rate */
  successRate: number;
  /** Query average results */
  averageResults: number;
  /** Query last used */
  lastUsed: string;
  /** Query count */
  count: number;
}

/**
 * Search trend interface
 */
export interface SearchTrend {
  /** Trend period */
  period: string;
  /** Trend type */
  type: SearchResultType;
  /** Trend direction */
  direction: 'up' | 'down' | 'stable';
  /** Trend magnitude */
  magnitude: number;
  /** Trend data points */
  dataPoints: Array<{
    date: string;
    value: number;
  }>;
  /** Date of trend */
  date: string;
  /** Average execution time */
  avgExecutionTime: number;
  /** Success rate */
  successRate: number;
  /** Count of searches */
  count: number;
  /** P95 execution time */
  p95ExecutionTime: number;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Search options for different search types
 */
export type RepositorySearchOptions = SearchQuery & {
  filters?: Pick<SearchFilters, 'projectKey' | 'workspace' | 'repositorySlug' | 'language' | 'isPublic'>;
  sortBy?: 'name' | 'lastModified' | 'size' | 'language';
};

export type CommitSearchOptions = SearchQuery & {
  filters?: Pick<SearchFilters, 'projectKey' | 'workspace' | 'repositorySlug' | 'author' | 'committer' | 'fromDate' | 'toDate'>;
  sortBy?: 'commitDate' | 'author' | 'message';
};

export type PullRequestSearchOptions = SearchQuery & {
  filters?: Pick<SearchFilters, 'projectKey' | 'workspace' | 'repositorySlug' | 'state' | 'author' | 'reviewer' | 'sourceBranch' | 'targetBranch' | 'fromDate' | 'toDate'>;
  sortBy?: 'createdDate' | 'updatedDate' | 'title' | 'author';
};

export type CodeSearchOptions = SearchQuery & {
  filters?: Pick<SearchFilters, 'projectKey' | 'workspace' | 'repositorySlug' | 'fileExtension' | 'language' | 'filePath' | 'branch' | 'fromDate' | 'toDate'>;
  sortBy?: 'filePath' | 'lastModified' | 'relevance';
};

export type UserSearchOptions = SearchQuery & {
  filters?: Pick<SearchFilters, 'role' | 'permission' | 'active'>;
  sortBy?: 'displayName' | 'emailAddress';
};

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for repository search result
 */
export function isRepositorySearchResult(result: SearchResult): result is RepositorySearchResult {
  return result.type === 'repository';
}

/**
 * Type guard for commit search result
 */
export function isCommitSearchResult(result: SearchResult): result is CommitSearchResult {
  return result.type === 'commit';
}

/**
 * Type guard for pull request search result
 */
export function isPullRequestSearchResult(result: SearchResult): result is PullRequestSearchResult {
  return result.type === 'pullrequest';
}

/**
 * Type guard for code search result
 */
export function isCodeSearchResult(result: SearchResult): result is CodeSearchResult {
  return result.type === 'code';
}

/**
 * Type guard for user search result
 */
export function isUserSearchResult(result: SearchResult): result is UserSearchResult {
  return result.type === 'user';
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default search configuration values
 */
export const DEFAULT_SEARCH_CONFIG: SearchConfiguration = {
  maxResultsPerPage: 1000,
  defaultResultsPerPage: 25,
  searchTimeout: 30000, // 30 seconds
  cacheTtl: 300000, // 5 minutes
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
  performanceThreshold: 2000,
};

/**
 * Valid sort fields for each search type
 */
export const VALID_SORT_FIELDS: Record<SearchResultType, string[]> = {
  repository: ['name', 'lastModified', 'size', 'language'],
  commit: ['commitDate', 'author', 'message'],
  pullrequest: ['createdDate', 'updatedDate', 'title', 'author'],
  code: ['filePath', 'lastModified', 'relevance'],
  user: ['displayName', 'emailAddress'],
};

/**
 * Default sort fields for each search type
 */
export const DEFAULT_SORT_FIELDS: Record<SearchResultType, string> = {
  repository: 'lastModified',
  commit: 'commitDate',
  pullrequest: 'updatedDate',
  code: 'relevance',
  user: 'displayName',
};
