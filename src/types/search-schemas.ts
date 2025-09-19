/**
 * Search Validation Schemas
 * Zod schemas for search data validation
 * 
 * Based on search.ts types and contract specifications
 */

import { z } from 'zod';
import { 
  SearchResultType, 
  SortOrder, 
  DEFAULT_SEARCH_CONFIG,
  VALID_SORT_FIELDS,
} from './search.js';

// ============================================================================
// Basic Validation Schemas
// ============================================================================

/**
 * Search result type schema
 */
export const SearchResultTypeSchema = z.enum(['repository', 'commit', 'pullrequest', 'code', 'user']);

/**
 * Sort order schema
 */
export const SortOrderSchema = z.enum(['asc', 'desc']);

/**
 * Pull request state schema
 */
export const PullRequestStateSchema = z.enum(['OPEN', 'MERGED', 'DECLINED', 'SUPERSEDED']);

/**
 * ISO 8601 datetime string schema
 */
export const DateTimeSchema = z.string().datetime();

/**
 * URL schema
 */
export const UrlSchema = z.string().url();

/**
 * Non-empty string schema
 */
export const NonEmptyStringSchema = z.string().min(1);

/**
 * Email schema
 */
export const EmailSchema = z.string().email();

// ============================================================================
// Search Query Schemas
// ============================================================================

/**
 * Search filters schema
 */
export const SearchFiltersSchema = z.object({
  // Common filters
  projectKey: z.string().optional(),
  workspace: z.string().optional(),
  repositorySlug: z.string().optional(),
  
  // Date filters
  fromDate: DateTimeSchema.optional(),
  toDate: DateTimeSchema.optional(),
  
  // Commit-specific filters
  author: z.string().optional(),
  committer: z.string().optional(),
  
  // Pull request-specific filters
  state: PullRequestStateSchema.optional(),
  reviewer: z.string().optional(),
  
  // Code-specific filters
  fileExtension: z.string().regex(/^\.[a-zA-Z0-9]+$/).optional(),
  language: z.string().optional(),
  filePath: z.string().optional(),
  
  // Repository-specific filters
  isPublic: z.boolean().optional(),
}).strict();

/**
 * Base search query schema
 */
export const SearchQuerySchema = z.object({
  query: z.string().min(1).max(500),
  filters: SearchFiltersSchema.optional(),
  sortBy: z.string().optional(),
  sortOrder: SortOrderSchema.default('desc'),
  page: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(DEFAULT_SEARCH_CONFIG.maxResultsPerPage).default(DEFAULT_SEARCH_CONFIG.defaultResultsPerPage),
}).strict();

// ============================================================================
// Specific Search Query Schemas
// ============================================================================

/**
 * Repository search options schema
 */
export const RepositorySearchOptionsSchema = SearchQuerySchema.extend({
  filters: z.object({
    projectKey: z.string().optional(),
    workspace: z.string().optional(),
    repositorySlug: z.string().optional(),
    language: z.string().optional(),
    isPublic: z.boolean().optional(),
  }).strict().optional(),
  sortBy: z.enum(['name', 'lastModified', 'size', 'language']).default('lastModified'),
}).strict();

/**
 * Commit search options schema
 */
export const CommitSearchOptionsSchema = SearchQuerySchema.extend({
  filters: z.object({
    projectKey: z.string().optional(),
    workspace: z.string().optional(),
    repositorySlug: z.string().optional(),
    author: z.string().optional(),
    committer: z.string().optional(),
    fromDate: DateTimeSchema.optional(),
    toDate: DateTimeSchema.optional(),
  }).strict().optional(),
  sortBy: z.enum(['commitDate', 'author', 'message']).default('commitDate'),
}).strict();

/**
 * Pull request search options schema
 */
export const PullRequestSearchOptionsSchema = SearchQuerySchema.extend({
  filters: z.object({
    projectKey: z.string().optional(),
    workspace: z.string().optional(),
    repositorySlug: z.string().optional(),
    state: PullRequestStateSchema.optional(),
    author: z.string().optional(),
    reviewer: z.string().optional(),
    fromDate: DateTimeSchema.optional(),
    toDate: DateTimeSchema.optional(),
  }).strict().optional(),
  sortBy: z.enum(['createdDate', 'updatedDate', 'title', 'author']).default('updatedDate'),
}).strict();

/**
 * Code search options schema
 */
export const CodeSearchOptionsSchema = SearchQuerySchema.extend({
  filters: z.object({
    projectKey: z.string().optional(),
    workspace: z.string().optional(),
    repositorySlug: z.string().optional(),
    fileExtension: z.string().regex(/^\.[a-zA-Z0-9]+$/).optional(),
    language: z.string().optional(),
    filePath: z.string().optional(),
    fromDate: DateTimeSchema.optional(),
    toDate: DateTimeSchema.optional(),
  }).strict().optional(),
  sortBy: z.enum(['filePath', 'lastModified', 'relevance']).default('relevance'),
}).strict();

/**
 * User search options schema
 */
export const UserSearchOptionsSchema = SearchQuerySchema.extend({
  sortBy: z.enum(['displayName', 'emailAddress']).default('displayName'),
}).strict();

// ============================================================================
// Search Result Metadata Schemas
// ============================================================================

/**
 * Repository metadata schema
 */
export const RepositoryMetadataSchema = z.object({
  projectKey: z.string().optional(),
  workspace: z.string().optional(),
  repositorySlug: z.string().optional(),
  isPublic: z.boolean().optional(),
  language: z.string().optional(),
  size: z.number().int().min(0).optional(),
  lastModified: DateTimeSchema.optional(),
}).strict();

/**
 * Commit metadata schema
 */
export const CommitMetadataSchema = z.object({
  projectKey: z.string().optional(),
  workspace: z.string().optional(),
  repositorySlug: z.string().optional(),
  author: z.string().optional(),
  committer: z.string().optional(),
  commitDate: DateTimeSchema.optional(),
  message: z.string().optional(),
}).strict();

/**
 * Pull request metadata schema
 */
export const PullRequestMetadataSchema = z.object({
  projectKey: z.string().optional(),
  workspace: z.string().optional(),
  repositorySlug: z.string().optional(),
  state: PullRequestStateSchema.optional(),
  author: z.string().optional(),
  createdDate: DateTimeSchema.optional(),
  updatedDate: DateTimeSchema.optional(),
  reviewers: z.array(z.string()).optional(),
}).strict();

/**
 * Code metadata schema
 */
export const CodeMetadataSchema = z.object({
  projectKey: z.string().optional(),
  workspace: z.string().optional(),
  repositorySlug: z.string().optional(),
  filePath: z.string().optional(),
  lineNumber: z.number().int().min(1).optional(),
  language: z.string().optional(),
  context: z.string().optional(),
}).strict();

/**
 * User metadata schema
 */
export const UserMetadataSchema = z.object({
  displayName: z.string().optional(),
  emailAddress: EmailSchema.optional(),
  active: z.boolean().optional(),
}).strict();

/**
 * Generic search result metadata schema (union of all metadata types)
 */
export const SearchResultMetadataSchema = z.object({
  // Common metadata
  projectKey: z.string().optional(),
  workspace: z.string().optional(),
  repositorySlug: z.string().optional(),
  lastModified: DateTimeSchema.optional(),
  
  // Repository metadata
  isPublic: z.boolean().optional(),
  language: z.string().optional(),
  size: z.number().int().min(0).optional(),
  
  // Commit metadata
  author: z.string().optional(),
  committer: z.string().optional(),
  commitDate: DateTimeSchema.optional(),
  message: z.string().optional(),
  
  // Pull request metadata
  state: z.string().optional(),
  createdDate: DateTimeSchema.optional(),
  updatedDate: DateTimeSchema.optional(),
  reviewers: z.array(z.string()).optional(),
  
  // Code metadata
  filePath: z.string().optional(),
  lineNumber: z.number().int().min(1).optional(),
  context: z.string().optional(),
  
  // User metadata
  displayName: z.string().optional(),
  emailAddress: EmailSchema.optional(),
  active: z.boolean().optional(),
}).strict();

// ============================================================================
// Search Result Schemas
// ============================================================================

/**
 * Base search result schema
 */
export const SearchResultSchema = z.object({
  type: SearchResultTypeSchema,
  id: NonEmptyStringSchema,
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  url: UrlSchema,
  metadata: SearchResultMetadataSchema,
  relevanceScore: z.number().min(0).max(1),
}).strict();

/**
 * Repository search result schema
 */
export const RepositorySearchResultSchema = SearchResultSchema.extend({
  type: z.literal('repository'),
  metadata: RepositoryMetadataSchema,
}).strict();

/**
 * Commit search result schema
 */
export const CommitSearchResultSchema = SearchResultSchema.extend({
  type: z.literal('commit'),
  metadata: CommitMetadataSchema,
}).strict();

/**
 * Pull request search result schema
 */
export const PullRequestSearchResultSchema = SearchResultSchema.extend({
  type: z.literal('pullrequest'),
  metadata: PullRequestMetadataSchema,
}).strict();

/**
 * Code search result schema
 */
export const CodeSearchResultSchema = SearchResultSchema.extend({
  type: z.literal('code'),
  metadata: CodeMetadataSchema,
}).strict();

/**
 * User search result schema
 */
export const UserSearchResultSchema = SearchResultSchema.extend({
  type: z.literal('user'),
  metadata: UserMetadataSchema,
}).strict();

// ============================================================================
// Pagination Schema
// ============================================================================

/**
 * Search pagination schema
 */
export const SearchPaginationSchema = z.object({
  page: z.number().int().min(0),
  limit: z.number().int().min(1),
  totalPages: z.number().int().min(0),
  hasNext: z.boolean(),
  hasPrevious: z.boolean(),
  nextPage: z.number().int().optional(),
  previousPage: z.number().int().optional(),
}).strict();

// ============================================================================
// Search Response Schema
// ============================================================================

/**
 * Search response schema
 */
export const SearchResponseSchema = z.object({
  results: z.array(SearchResultSchema),
  pagination: SearchPaginationSchema,
  totalCount: z.number().int().min(0),
  searchTime: z.number().min(0),
  suggestions: z.array(z.string()).optional(),
}).strict();

// ============================================================================
// Search History Schema
// ============================================================================

/**
 * Search history schema
 */
export const SearchHistorySchema = z.object({
  userId: NonEmptyStringSchema,
  query: NonEmptyStringSchema,
  timestamp: DateTimeSchema,
  resultCount: z.number().int().min(0),
  filters: SearchFiltersSchema,
  searchType: SearchResultTypeSchema,
}).strict();

// ============================================================================
// Search Analytics Schemas
// ============================================================================

/**
 * Search term frequency schema
 */
export const SearchTermFrequencySchema = z.object({
  term: NonEmptyStringSchema,
  frequency: z.number().int().min(0),
  percentage: z.number().min(0).max(100),
}).strict();

/**
 * Search performance metrics schema
 */
export const SearchPerformanceMetricsSchema = z.object({
  averageResponseTime: z.number().min(0),
  p95ResponseTime: z.number().min(0),
  p99ResponseTime: z.number().min(0),
  successRate: z.number().min(0).max(100),
  errorRate: z.number().min(0).max(100),
}).strict();

/**
 * Search type usage schema
 */
export const SearchTypeUsageSchema = z.object({
  type: SearchResultTypeSchema,
  count: z.number().int().min(0),
  percentage: z.number().min(0).max(100),
}).strict();

/**
 * Search analytics schema
 */
export const SearchAnalyticsSchema = z.object({
  totalSearches: z.number().int().min(0),
  averageSearchTime: z.number().min(0),
  popularTerms: z.array(SearchTermFrequencySchema),
  performanceMetrics: SearchPerformanceMetricsSchema,
  searchTypeUsage: z.array(SearchTypeUsageSchema),
}).strict();

// ============================================================================
// Search Configuration Schemas
// ============================================================================

/**
 * Search rate limit configuration schema
 */
export const SearchRateLimitConfigSchema = z.object({
  maxRequestsPerMinute: z.number().int().min(1),
  maxRequestsPerHour: z.number().int().min(1),
  maxRequestsPerDay: z.number().int().min(1),
}).strict();

/**
 * Search configuration schema
 */
export const SearchConfigurationSchema = z.object({
  maxResultsPerPage: z.number().int().min(1).max(1000),
  defaultResultsPerPage: z.number().int().min(1).max(100),
  searchTimeout: z.number().int().min(1000), // minimum 1 second
  cacheTtl: z.number().int().min(0),
  historyRetentionDays: z.number().int().min(1),
  enabledSearchTypes: z.array(SearchResultTypeSchema),
  rateLimiting: SearchRateLimitConfigSchema,
}).strict();

// ============================================================================
// Search Index Schema
// ============================================================================

/**
 * Search index schema
 */
export const SearchIndexSchema = z.object({
  id: NonEmptyStringSchema,
  name: NonEmptyStringSchema,
  type: SearchResultTypeSchema,
  status: z.enum(['active', 'building', 'error', 'disabled']),
  lastUpdated: DateTimeSchema,
  documentCount: z.number().int().min(0),
  sizeBytes: z.number().int().min(0),
}).strict();

// ============================================================================
// Error Schema
// ============================================================================

/**
 * Search error schema
 */
export const SearchErrorSchema = z.object({
  code: NonEmptyStringSchema,
  message: NonEmptyStringSchema,
  details: z.record(z.any()).optional(),
  timestamp: DateTimeSchema,
  correlationId: z.string().optional(),
}).strict();

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validates search query for specific search type
 */
export function validateSearchQuery(query: unknown, searchType: SearchResultType): unknown {
  switch (searchType) {
    case 'repository':
      return RepositorySearchOptionsSchema.parse(query);
    case 'commit':
      return CommitSearchOptionsSchema.parse(query);
    case 'pullrequest':
      return PullRequestSearchOptionsSchema.parse(query);
    case 'code':
      return CodeSearchOptionsSchema.parse(query);
    case 'user':
      return UserSearchOptionsSchema.parse(query);
    default:
      throw new Error(`Unsupported search type: ${searchType}`);
  }
}

/**
 * Validates search result for specific search type
 */
export function validateSearchResult(result: unknown, searchType: SearchResultType): unknown {
  switch (searchType) {
    case 'repository':
      return RepositorySearchResultSchema.parse(result);
    case 'commit':
      return CommitSearchResultSchema.parse(result);
    case 'pullrequest':
      return PullRequestSearchResultSchema.parse(result);
    case 'code':
      return CodeSearchResultSchema.parse(result);
    case 'user':
      return UserSearchResultSchema.parse(result);
    default:
      throw new Error(`Unsupported search type: ${searchType}`);
  }
}

/**
 * Validates sort field for specific search type
 */
export function validateSortField(sortBy: string, searchType: SearchResultType): boolean {
  const validFields = VALID_SORT_FIELDS[searchType];
  return validFields.includes(sortBy);
}

/**
 * Validates date range (fromDate must be before toDate)
 */
export function validateDateRange(fromDate?: string, toDate?: string): boolean {
  if (!fromDate || !toDate) {
    return true; // Optional dates are valid
  }
  
  const from = new Date(fromDate);
  const to = new Date(toDate);
  
  return from <= to;
}

/**
 * Validates file extension format
 */
export function validateFileExtension(extension: string): boolean {
  return /^\.[a-zA-Z0-9]+$/.test(extension);
}

/**
 * Validates pagination parameters
 */
export function validatePagination(page: number, limit: number): boolean {
  return page >= 0 && limit >= 1 && limit <= DEFAULT_SEARCH_CONFIG.maxResultsPerPage;
}

// ============================================================================
// Schema Transformation Functions
// ============================================================================

/**
 * Transforms raw search query to validated search query
 */
export function transformSearchQuery(rawQuery: unknown, searchType: SearchResultType): unknown {
  const validated = validateSearchQuery(rawQuery, searchType);
  
  // Apply transformations if needed
  if (typeof validated === 'object' && validated !== null) {
    const query = validated as any;
    
    // Ensure date range is valid
    if (query.filters?.fromDate && query.filters?.toDate) {
      if (!validateDateRange(query.filters.fromDate, query.filters.toDate)) {
        throw new Error('Invalid date range: fromDate must be before toDate');
      }
    }
    
    // Ensure sort field is valid for search type
    if (query.sortBy && !validateSortField(query.sortBy, searchType)) {
      throw new Error(`Invalid sort field '${query.sortBy}' for search type '${searchType}'`);
    }
    
    // Ensure file extension format is correct
    if (query.filters?.fileExtension && !validateFileExtension(query.filters.fileExtension)) {
      throw new Error(`Invalid file extension format: ${query.filters.fileExtension}`);
    }
  }
  
  return validated;
}

// ============================================================================
// Export All Schemas
// ============================================================================

export {
  // Basic schemas
  SearchResultTypeSchema,
  SortOrderSchema,
  PullRequestStateSchema,
  DateTimeSchema,
  UrlSchema,
  NonEmptyStringSchema,
  EmailSchema,
  
  // Query schemas
  SearchFiltersSchema,
  SearchQuerySchema,
  RepositorySearchOptionsSchema,
  CommitSearchOptionsSchema,
  PullRequestSearchOptionsSchema,
  CodeSearchOptionsSchema,
  UserSearchOptionsSchema,
  
  // Metadata schemas
  RepositoryMetadataSchema,
  CommitMetadataSchema,
  PullRequestMetadataSchema,
  CodeMetadataSchema,
  UserMetadataSchema,
  SearchResultMetadataSchema,
  
  // Result schemas
  SearchResultSchema,
  RepositorySearchResultSchema,
  CommitSearchResultSchema,
  PullRequestSearchResultSchema,
  CodeSearchResultSchema,
  UserSearchResultSchema,
  
  // Response schemas
  SearchPaginationSchema,
  SearchResponseSchema,
  
  // Other schemas
  SearchHistorySchema,
  SearchAnalyticsSchema,
  SearchConfigurationSchema,
  SearchIndexSchema,
  SearchErrorSchema,
};
