/**
 * Search Types for Bitbucket Data Center REST API
 * Based on official documentation: https://developer.atlassian.com/server/bitbucket/rest/v906/intro/
 */

import { Link, PagedResponse } from './base.types.js';

// Search Types
export interface SearchRequest {
  query: string;
  type?: SearchType;
  projectKey?: string;
  repositorySlug?: string;
  start?: number;
  limit?: number;
  sort?: SearchSort;
  order?: SearchOrder;
  filters?: SearchFilters;
}

export type SearchType =
  | 'ALL'
  | 'REPOSITORY'
  | 'PULL_REQUEST'
  | 'COMMIT'
  | 'CODE'
  | 'USER'
  | 'PROJECT';

export type SearchSort = 'RELEVANCE' | 'DATE' | 'NAME' | 'SIZE';

export type SearchOrder = 'ASC' | 'DESC';

export interface SearchFilters {
  projectKeys?: string[];
  repositorySlugs?: string[];
  authors?: string[];
  dateRange?: SearchDateRange;
  fileTypes?: string[];
  languages?: string[];
  branches?: string[];
  tags?: string[];
}

export interface SearchDateRange {
  from: number;
  to: number;
}

// Search Response Types
export interface SearchResponse<T = any> extends PagedResponse<T> {
  query: string;
  type: SearchType;
  filters?: SearchFilters;
  suggestions?: string[];
  facets?: SearchFacet[];
}

export interface SearchFacet {
  name: string;
  values: SearchFacetValue[];
}

export interface SearchFacetValue {
  value: string;
  count: number;
  selected: boolean;
}

// Repository Search Types
export interface RepositorySearchResult {
  id: number;
  name: string;
  slug: string;
  description?: string;
  project: ProjectSearchResult;
  public: boolean;
  links: Link[];
  lastModified: number;
  size: number;
  cloneUrl: string;
  sshCloneUrl: string;
  httpCloneUrl: string;
}

export interface ProjectSearchResult {
  id: number;
  key: string;
  name: string;
  description?: string;
  public: boolean;
  type: SearchProjectType;
  links: Link[];
}

export type SearchProjectType = 'NORMAL' | 'PERSONAL';

// Pull Request Search Types
export interface PullRequestSearchResult {
  id: number;
  version: number;
  title: string;
  description?: string;
  state: SearchPullRequestState;
  open: boolean;
  closed: boolean;
  createdDate: number;
  updatedDate: number;
  fromRef: RefSearchResult;
  toRef: RefSearchResult;
  author: UserSearchResult;
  reviewers: UserSearchResult[];
  participants: UserSearchResult[];
  properties: PullRequestProperties;
  links: Link[];
}

export type SearchPullRequestState = 'OPEN' | 'MERGED' | 'DECLINED' | 'SUPERSEDED';

export interface RefSearchResult {
  id: string;
  displayId: string;
  latestCommit: string;
  repository: RepositorySearchResult;
}

export interface UserSearchResult {
  id: number;
  name: string;
  emailAddress: string;
  displayName: string;
  slug: string;
  type: UserType;
  active: boolean;
  links: Link[];
}

export type UserType = 'NORMAL' | 'SERVICE';

export interface PullRequestProperties {
  mergeCommit?: string;
  closedDate?: number;
  closedBy?: UserSearchResult;
  mergedDate?: number;
  mergedBy?: UserSearchResult;
}

// Commit Search Types
export interface CommitSearchResult {
  id: string;
  displayId: string;
  author: CommitAuthor;
  authorTimestamp: number;
  committer: CommitAuthor;
  committerTimestamp: number;
  message: string;
  parents: CommitParent[];
  properties: CommitProperties;
  links: Link[];
}

export interface CommitAuthor {
  name: string;
  emailAddress: string;
  id: number;
  displayName: string;
  slug: string;
  type: UserType;
  active: boolean;
  links: Link[];
}

export interface CommitParent {
  id: string;
  displayId: string;
}

export interface CommitProperties {
  jiraKey?: string;
  commentCount: number;
  taskCount: number;
  properties: Record<string, any>;
}

// Code Search Types
export interface CodeSearchResult {
  path: string;
  name: string;
  type: CodeType;
  size: number;
  lines: number;
  content?: string;
  repository: RepositorySearchResult;
  commit: CommitSearchResult;
  links: Link[];
}

export type CodeType = 'FILE' | 'DIRECTORY';

// User Search Types
export interface UserSearchResult {
  id: number;
  name: string;
  emailAddress: string;
  displayName: string;
  slug: string;
  type: UserType;
  active: boolean;
  avatarUrl?: string;
  links: Link[];
}

// Search Suggestions Types
export interface SearchSuggestions {
  query: string;
  suggestions: SearchSuggestion[];
}

export interface SearchSuggestion {
  text: string;
  type: SuggestionType;
  count?: number;
}

export type SuggestionType = 'REPOSITORY' | 'USER' | 'PROJECT' | 'BRANCH' | 'TAG' | 'FILE';

// Search History Types
export interface SearchHistory {
  id: string;
  query: string;
  type: SearchType;
  timestamp: number;
  userId: number;
  resultCount: number;
  filters?: SearchFilters;
}

export interface SearchHistoryResponse extends SearchHistory {}

export interface SearchHistoryListResponse {
  history: SearchHistory[];
  total: number;
}

// Search Analytics Types
export interface SearchAnalytics {
  query: string;
  type: SearchType;
  resultCount: number;
  timestamp: number;
  userId?: number;
  sessionId?: string;
  filters?: SearchFilters;
  clickedResults?: SearchResultClick[];
}

export interface SearchResultClick {
  resultId: string;
  resultType: SearchType;
  position: number;
  timestamp: number;
}

export interface SearchAnalyticsResponse extends SearchAnalytics {}

export interface SearchAnalyticsListResponse {
  analytics: SearchAnalytics[];
  total: number;
}

// Search Configuration Types
export interface SearchConfiguration {
  enabled: boolean;
  indexEnabled: boolean;
  searchEnabled: boolean;
  indexingEnabled: boolean;
  maxResults: number;
  defaultLimit: number;
  timeout: number;
  features: SearchFeatures;
}

export interface SearchFeatures {
  repositorySearch: boolean;
  pullRequestSearch: boolean;
  commitSearch: boolean;
  codeSearch: boolean;
  userSearch: boolean;
  projectSearch: boolean;
  suggestions: boolean;
  facets: boolean;
  analytics: boolean;
}

export interface SearchConfigurationResponse extends SearchConfiguration {}

// Search Index Types
export interface SearchIndex {
  id: string;
  type: IndexType;
  status: IndexStatus;
  progress: number;
  totalItems: number;
  indexedItems: number;
  lastIndexed: number;
  nextIndex?: number;
  errors: IndexError[];
}

export type IndexType = 'REPOSITORY' | 'PULL_REQUEST' | 'COMMIT' | 'CODE' | 'USER' | 'PROJECT';

export type IndexStatus = 'IDLE' | 'INDEXING' | 'COMPLETED' | 'FAILED' | 'PAUSED';

export interface IndexError {
  id: string;
  message: string;
  timestamp: number;
  itemId: string;
  itemType: IndexType;
}

export interface SearchIndexResponse extends SearchIndex {}

export interface SearchIndexListResponse {
  indexes: SearchIndex[];
  total: number;
}

// Search Statistics Types
export interface SearchStatistics {
  totalSearches: number;
  uniqueUsers: number;
  averageResults: number;
  topQueries: SearchQueryStats[];
  searchTypes: SearchTypeStats[];
  timeRange: SearchDateRange;
}

export interface SearchQueryStats {
  query: string;
  count: number;
  averageResults: number;
  uniqueUsers: number;
}

export interface SearchTypeStats {
  type: SearchType;
  count: number;
  percentage: number;
}

export interface SearchStatisticsResponse extends SearchStatistics {}
