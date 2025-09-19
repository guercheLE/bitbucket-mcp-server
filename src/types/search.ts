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
  
  // Code-specific filters
  /** File extension (e.g., .ts, .js) */
  fileExtension?: string;
  /** Programming language */
  language?: string;
  /** File path pattern */
  filePath?: string;
  
  // Repository-specific filters
  /** Whether repository is public */
  isPublic?: boolean;
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
}

// ============================================================================
// Search History Interface
// ============================================================================

/**
 * Search history entry
 */
export interface SearchHistory {
  /** User ID who performed the search */
  userId: string;
  /** Search query executed */
  query: string;
  /** When the search was executed (ISO 8601) */
  timestamp: string;
  /** Number of results returned */
  resultCount: number;
  /** Filters that were applied */
  filters: SearchFilters;
  /** Type of search that was executed */
  searchType: SearchResultType;
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
  /** Average search time in milliseconds */
  averageSearchTime: number;
  /** Most popular search terms */
  popularTerms: SearchTermFrequency[];
  /** Search performance metrics */
  performanceMetrics: SearchPerformanceMetrics;
  /** Search usage by type */
  searchTypeUsage: SearchTypeUsage[];
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
  /** History retention period in days */
  historyRetentionDays: number;
  /** Enabled search types */
  enabledSearchTypes: SearchResultType[];
  /** Rate limiting configuration */
  rateLimiting: SearchRateLimitConfig;
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
  filters?: Pick<SearchFilters, 'projectKey' | 'workspace' | 'repositorySlug' | 'state' | 'author' | 'reviewer' | 'fromDate' | 'toDate'>;
  sortBy?: 'createdDate' | 'updatedDate' | 'title' | 'author';
};

export type CodeSearchOptions = SearchQuery & {
  filters?: Pick<SearchFilters, 'projectKey' | 'workspace' | 'repositorySlug' | 'fileExtension' | 'language' | 'filePath' | 'fromDate' | 'toDate'>;
  sortBy?: 'filePath' | 'lastModified' | 'relevance';
};

export type UserSearchOptions = SearchQuery & {
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
  historyRetentionDays: 90,
  enabledSearchTypes: ['repository', 'commit', 'pullrequest', 'code', 'user'],
  rateLimiting: {
    maxRequestsPerMinute: 60,
    maxRequestsPerHour: 1000,
    maxRequestsPerDay: 10000,
  },
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
