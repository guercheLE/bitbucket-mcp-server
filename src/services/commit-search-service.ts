/**
 * Commit Search Service
 * Implements commit search functionality for Bitbucket
 * 
 * Supports both Data Center and Cloud APIs
 */

import { AxiosInstance } from 'axios';
import { SearchService } from './search-service.js';
import { Cache } from '../utils/cache.js';
import {
  SearchQuery,
  SearchResult,
  CommitSearchResult,
  CommitMetadata,
  SearchConfiguration,
} from '../types/search.js';
import { ServerInfo } from '../types/index.js';
import { logger } from '../utils/logger.js';

// ============================================================================
// Commit Search Service
// ============================================================================

/**
 * Service for searching commits in Bitbucket
 */
export class CommitSearchService extends SearchService {
  constructor(
    httpClient: AxiosInstance,
    cache: Cache,
    config: Partial<SearchConfiguration> = {}
  ) {
    super(httpClient, cache, 'commit', config);
  }

  // ============================================================================
  // Abstract Method Implementations
  // ============================================================================

  /**
   * Builds the search URL for commit search
   */
  protected buildSearchUrl(serverInfo: ServerInfo, query: SearchQuery): string {
    const params: Record<string, any> = {
      q: query.query,
      sort: this.buildSortParam(query),
      start: (query.page || 0) * (query.limit || this.config.defaultResultsPerPage),
      limit: query.limit || this.config.defaultResultsPerPage,
    };

    // Add filters
    if (query.filters) {
      if (query.filters.projectKey) {
        params.projectKey = query.filters.projectKey;
      }
      
      if (query.filters.workspace) {
        params.workspace = query.filters.workspace;
      }
      
      if (query.filters.repositorySlug) {
        params.repository = query.filters.repositorySlug;
      }
      
      if (query.filters.author) {
        params.author = query.filters.author;
      }
      
      if (query.filters.committer) {
        params.committer = query.filters.committer;
      }
      
      if (query.filters.fromDate) {
        params.since = query.filters.fromDate;
      }
      
      if (query.filters.toDate) {
        params.until = query.filters.toDate;
      }
    }

    // Build URL based on server type
    if (serverInfo.serverType === 'datacenter') {
      return this.buildDataCenterSearchUrl(serverInfo.baseUrl, params);
    } else {
      return this.buildCloudSearchUrl(serverInfo.baseUrl, params);
    }
  }

  /**
   * Transforms API response to SearchResult format
   */
  protected transformApiResponse(apiResponse: any, query: SearchQuery): SearchResult[] {
    const results: SearchResult[] = [];
    
    // Handle different response formats
    const commits = this.extractCommits(apiResponse);
    
    commits.forEach((commit: any) => {
      try {
        const result = this.transformCommit(commit, query);
        results.push(result);
      } catch (error) {
        logger.warn('Failed to transform commit result', {
          error: error instanceof Error ? error.message : 'Unknown error',
          commit: commit,
        });
      }
    });

    return results;
  }

  /**
   * Gets the default sort field for commit search
   */
  protected getDefaultSortField(): string {
    return 'commitDate';
  }

  /**
   * Validates commit search specific parameters
   */
  protected validateSearchTypeParams(query: SearchQuery): void {
    // Validate commit-specific filters
    if (query.filters) {
      // Validate date range
      if (query.filters.fromDate && query.filters.toDate) {
        const fromDate = new Date(query.filters.fromDate);
        const toDate = new Date(query.filters.toDate);
        
        if (fromDate > toDate) {
          throw new Error('fromDate must be before toDate');
        }
        
        // Validate date is not too far in the past (performance consideration)
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        
        if (fromDate < oneYearAgo) {
          logger.warn('Searching commits older than 1 year may impact performance', {
            fromDate: query.filters.fromDate,
          });
        }
      }
      
      // Validate author/committer format
      if (query.filters.author) {
        this.validateUserIdentifier(query.filters.author);
      }
      
      if (query.filters.committer) {
        this.validateUserIdentifier(query.filters.committer);
      }
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Builds Data Center search URL
   */
  private buildDataCenterSearchUrl(baseUrl: string, params: Record<string, any>): string {
    const searchUrl = `${baseUrl}/rest/api/1.0/search/commits`;
    return this.buildUrlWithParams(searchUrl, params);
  }

  /**
   * Builds Cloud search URL
   */
  private buildCloudSearchUrl(baseUrl: string, params: Record<string, any>): string {
    // Cloud API uses different parameter names
    const cloudParams: Record<string, any> = {
      q: params.q,
      sort: params.sort,
      page: Math.floor((params.start || 0) / (params.limit || this.config.defaultResultsPerPage)) + 1,
      pagelen: params.limit,
    };
    
    // Map Data Center params to Cloud params
    if (params.workspace) {
      cloudParams.workspace = params.workspace;
    }
    
    if (params.repository) {
      cloudParams.repository = params.repository;
    }
    
    if (params.author) {
      cloudParams.author = params.author;
    }
    
    if (params.since) {
      cloudParams.since = params.since;
    }
    
    if (params.until) {
      cloudParams.until = params.until;
    }

    const searchUrl = `${baseUrl}/2.0/commits`;
    return this.buildUrlWithParams(searchUrl, cloudParams);
  }

  /**
   * Builds sort parameter based on query
   */
  private buildSortParam(query: SearchQuery): string {
    const sortBy = query.sortBy || this.getDefaultSortField();
    const sortOrder = query.sortOrder || 'desc';
    
    // Map sort fields to API format
    const sortMapping: Record<string, string> = {
      commitDate: 'date',
      author: 'author',
      message: 'message',
    };
    
    const apiSortField = sortMapping[sortBy] || sortBy;
    const sortDirection = sortOrder === 'asc' ? '' : '-';
    
    return `${sortDirection}${apiSortField}`;
  }

  /**
   * Extracts commits from API response
   */
  private extractCommits(apiResponse: any): any[] {
    // Handle different response formats
    if (Array.isArray(apiResponse)) {
      return apiResponse;
    }
    
    if (apiResponse.values && Array.isArray(apiResponse.values)) {
      return apiResponse.values; // Bitbucket API format
    }
    
    if (apiResponse.data && Array.isArray(apiResponse.data)) {
      return apiResponse.data;
    }
    
    if (apiResponse.commits && Array.isArray(apiResponse.commits)) {
      return apiResponse.commits;
    }
    
    return [];
  }

  /**
   * Transforms a single commit from API response
   */
  private transformCommit(commit: any, query: SearchQuery): CommitSearchResult {
    // Extract basic information
    const id = this.extractCommitId(commit);
    const title = this.extractCommitTitle(commit);
    const description = this.extractCommitDescription(commit);
    const url = this.extractCommitUrl(commit);
    const metadata = this.extractCommitMetadata(commit);
    const relevanceScore = this.calculateRelevanceScore(query, commit);

    return {
      type: 'commit',
      id,
      title,
      description,
      url,
      metadata,
      relevanceScore,
    };
  }

  /**
   * Extracts commit ID from API response
   */
  private extractCommitId(commit: any): string {
    return commit.id || commit.hash || commit.sha || 'unknown';
  }

  /**
   * Extracts commit title from API response
   */
  private extractCommitTitle(commit: any): string {
    const message = commit.message || commit.summary?.raw || 'No commit message';
    
    // Use first line of commit message as title
    const firstLine = message.split('\n')[0];
    return firstLine.substring(0, 200); // Limit to 200 characters
  }

  /**
   * Extracts commit description from API response
   */
  private extractCommitDescription(commit: any): string | undefined {
    const message = commit.message || commit.summary?.raw;
    
    if (!message) {
      return undefined;
    }
    
    // Use full commit message as description, limited to 500 characters
    return message.substring(0, 500);
  }

  /**
   * Extracts commit URL from API response
   */
  private extractCommitUrl(commit: any): string {
    // Try different URL formats
    if (commit.links?.self?.href) {
      return commit.links.self.href;
    }
    
    if (commit.links?.html?.href) {
      return commit.links.html.href;
    }
    
    if (commit.url) {
      return commit.url;
    }
    
    // Fallback: construct URL
    const commitId = this.extractCommitId(commit);
    const repoInfo = commit.repository || {};
    const projectKey = repoInfo.project?.key || 'unknown';
    const repoSlug = repoInfo.name || repoInfo.slug || 'unknown';
    
    return `${commit.baseUrl || 'https://bitbucket.org'}/projects/${projectKey}/repos/${repoSlug}/commits/${commitId}`;
  }

  /**
   * Extracts commit metadata from API response
   */
  private extractCommitMetadata(commit: any): CommitMetadata {
    return {
      projectKey: commit.repository?.project?.key,
      workspace: commit.repository?.workspace?.slug,
      repositorySlug: commit.repository?.name || commit.repository?.slug,
      author: this.extractAuthor(commit),
      committer: this.extractCommitter(commit),
      commitDate: this.extractCommitDate(commit),
      message: commit.message || commit.summary?.raw,
    };
  }

  /**
   * Extracts author from commit
   */
  private extractAuthor(commit: any): string | undefined {
    if (commit.author?.user?.name) {
      return commit.author.user.name;
    }
    
    if (commit.author?.name) {
      return commit.author.name;
    }
    
    if (commit.author?.raw) {
      return commit.author.raw;
    }
    
    return undefined;
  }

  /**
   * Extracts committer from commit
   */
  private extractCommitter(commit: any): string | undefined {
    if (commit.committer?.user?.name) {
      return commit.committer.user.name;
    }
    
    if (commit.committer?.name) {
      return commit.committer.name;
    }
    
    if (commit.committer?.raw) {
      return commit.committer.raw;
    }
    
    // If no committer, use author
    return this.extractAuthor(commit);
  }

  /**
   * Extracts commit date from commit
   */
  private extractCommitDate(commit: any): string | undefined {
    const dateFields = ['date', 'authorTimestamp', 'committerTimestamp', 'timestamp'];
    
    for (const field of dateFields) {
      if (commit[field]) {
        return new Date(commit[field]).toISOString();
      }
    }
    
    return undefined;
  }

  // ============================================================================
  // Validation Methods
  // ============================================================================

  /**
   * Validates user identifier (author/committer)
   */
  private validateUserIdentifier(userIdentifier: string): void {
    // Basic validation - can be username or email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const usernamePattern = /^[a-zA-Z0-9._-]+$/;
    
    if (!emailPattern.test(userIdentifier) && !usernamePattern.test(userIdentifier)) {
      logger.warn('Potentially invalid user identifier format', { userIdentifier });
    }
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Searches commits with specific options
   */
  public async searchCommits(
    serverInfo: ServerInfo,
    options: {
      query: string;
      projectKey?: string;
      workspace?: string;
      repositorySlug?: string;
      author?: string;
      committer?: string;
      fromDate?: string;
      toDate?: string;
      sortBy?: 'commitDate' | 'author' | 'message';
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    }
  ): Promise<CommitSearchResult[]> {
    const searchQuery: SearchQuery = {
      query: options.query,
      filters: {
        projectKey: options.projectKey,
        workspace: options.workspace,
        repositorySlug: options.repositorySlug,
        author: options.author,
        committer: options.committer,
        fromDate: options.fromDate,
        toDate: options.toDate,
      },
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      page: options.page,
      limit: options.limit,
    };

    const response = await this.search(serverInfo, searchQuery);
    return response.results as CommitSearchResult[];
  }

  /**
   * Gets recent commits by author
   */
  public async getRecentCommitsByAuthor(
    serverInfo: ServerInfo,
    author: string,
    options: {
      projectKey?: string;
      workspace?: string;
      repositorySlug?: string;
      limit?: number;
      days?: number;
    } = {}
  ): Promise<CommitSearchResult[]> {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - (options.days || 30));

    return this.searchCommits(serverInfo, {
      query: `author:${author}`,
      projectKey: options.projectKey,
      workspace: options.workspace,
      repositorySlug: options.repositorySlug,
      author: author,
      fromDate: fromDate.toISOString(),
      sortBy: 'commitDate',
      sortOrder: 'desc',
      limit: options.limit || 25,
    });
  }

  /**
   * Searches commits by message pattern
   */
  public async searchCommitsByMessage(
    serverInfo: ServerInfo,
    messagePattern: string,
    options: {
      projectKey?: string;
      workspace?: string;
      repositorySlug?: string;
      limit?: number;
    } = {}
  ): Promise<CommitSearchResult[]> {
    return this.searchCommits(serverInfo, {
      query: messagePattern,
      projectKey: options.projectKey,
      workspace: options.workspace,
      repositorySlug: options.repositorySlug,
      sortBy: 'commitDate',
      sortOrder: 'desc',
      limit: options.limit || 25,
    });
  }
}

// ============================================================================
// Export
// ============================================================================

export default CommitSearchService;
