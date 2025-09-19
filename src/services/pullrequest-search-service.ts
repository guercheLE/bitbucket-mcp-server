/**
 * Pull Request Search Service
 * Implements pull request search functionality for Bitbucket
 * 
 * Supports both Data Center and Cloud APIs
 */

import { AxiosInstance } from 'axios';
import { SearchService } from './search-service';
import { Cache } from '../utils/cache';
import {
  SearchQuery,
  SearchResult,
  PullRequestSearchResult,
  PullRequestMetadata,
  SearchConfiguration,
} from '../types/search';
import { ServerInfo } from '../types/index';
import { logger } from '../utils/logger';

// ============================================================================
// Pull Request Search Service
// ============================================================================

/**
 * Service for searching pull requests in Bitbucket
 */
export class PullRequestSearchService extends SearchService {
  constructor(
    httpClient: AxiosInstance,
    cache: Cache,
    config: Partial<SearchConfiguration> = {}
  ) {
    super(httpClient, cache, 'pullrequest', config);
  }

  // ============================================================================
  // Abstract Method Implementations
  // ============================================================================

  /**
   * Builds the search URL for pull request search
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
      
      if (query.filters.reviewer) {
        params.reviewer = query.filters.reviewer;
      }
      
      if (query.filters.state) {
        params.state = query.filters.state;
      }
      
      if (query.filters.sourceBranch) {
        params.sourceBranch = query.filters.sourceBranch;
      }
      
      if (query.filters.targetBranch) {
        params.targetBranch = query.filters.targetBranch;
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
    const pullRequests = this.extractPullRequests(apiResponse);
    
    pullRequests.forEach((pr: any) => {
      try {
        const result = this.transformPullRequest(pr, query);
        results.push(result);
      } catch (error) {
        logger.warn('Failed to transform pull request result', {
          error: error instanceof Error ? error.message : 'Unknown error',
          pullRequest: pr,
        });
      }
    });

    return results;
  }

  /**
   * Gets the default sort field for pull request search
   */
  protected getDefaultSortField(): string {
    return 'updatedDate';
  }

  /**
   * Validates pull request search specific parameters
   */
  protected validateSearchTypeParams(query: SearchQuery): void {
    // Validate pull request-specific filters
    if (query.filters) {
      // Validate state values
      if (query.filters.state) {
        const validStates = ['OPEN', 'MERGED', 'DECLINED', 'SUPERSEDED'];
        const state = query.filters.state.toUpperCase();
        
        if (!validStates.includes(state)) {
          throw new Error(`Invalid state: ${query.filters.state}. Valid states: ${validStates.join(', ')}`);
        }
      }
      
      // Validate date range
      if (query.filters.fromDate && query.filters.toDate) {
        const fromDate = new Date(query.filters.fromDate);
        const toDate = new Date(query.filters.toDate);
        
        if (fromDate > toDate) {
          throw new Error('fromDate must be before toDate');
        }
      }
      
      // Validate user identifiers
      if (query.filters.author) {
        this.validateUserIdentifier(query.filters.author);
      }
      
      if (query.filters.reviewer) {
        this.validateUserIdentifier(query.filters.reviewer);
      }
      
      // Validate branch names
      if (query.filters.sourceBranch) {
        this.validateBranchName(query.filters.sourceBranch);
      }
      
      if (query.filters.targetBranch) {
        this.validateBranchName(query.filters.targetBranch);
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
    const searchUrl = `${baseUrl}/rest/api/1.0/search/pullrequests`;
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
    
    if (params.reviewer) {
      cloudParams.reviewer = params.reviewer;
    }
    
    if (params.state) {
      cloudParams.state = params.state.toLowerCase();
    }
    
    if (params.sourceBranch) {
      cloudParams.source_branch = params.sourceBranch;
    }
    
    if (params.targetBranch) {
      cloudParams.target_branch = params.targetBranch;
    }
    
    if (params.since) {
      cloudParams.since = params.since;
    }
    
    if (params.until) {
      cloudParams.until = params.until;
    }

    const searchUrl = `${baseUrl}/2.0/pullrequests`;
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
      updatedDate: 'updated_on',
      createdDate: 'created_on',
      title: 'title',
      author: 'author',
      state: 'state',
    };
    
    const apiSortField = sortMapping[sortBy] || sortBy;
    const sortDirection = sortOrder === 'asc' ? '' : '-';
    
    return `${sortDirection}${apiSortField}`;
  }

  /**
   * Extracts pull requests from API response
   */
  private extractPullRequests(apiResponse: any): any[] {
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
    
    if (apiResponse.pullRequests && Array.isArray(apiResponse.pullRequests)) {
      return apiResponse.pullRequests;
    }
    
    return [];
  }

  /**
   * Transforms a single pull request from API response
   */
  private transformPullRequest(pr: any, query: SearchQuery): PullRequestSearchResult {
    // Extract basic information
    const id = this.extractPullRequestId(pr);
    const title = this.extractPullRequestTitle(pr);
    const description = this.extractPullRequestDescription(pr);
    const url = this.extractPullRequestUrl(pr);
    const metadata = this.extractPullRequestMetadata(pr);
    const relevanceScore = this.calculateRelevanceScore(query, pr);

    return {
      type: 'pullrequest',
      id,
      title,
      description,
      url,
      metadata,
      relevanceScore,
    };
  }

  /**
   * Extracts pull request ID from API response
   */
  private extractPullRequestId(pr: any): string {
    return String(pr.id || pr.number || 'unknown');
  }

  /**
   * Extracts pull request title from API response
   */
  private extractPullRequestTitle(pr: any): string {
    return pr.title || pr.summary?.raw || 'Untitled Pull Request';
  }

  /**
   * Extracts pull request description from API response
   */
  private extractPullRequestDescription(pr: any): string | undefined {
    const description = pr.description || pr.summary?.raw;
    
    if (!description) {
      return undefined;
    }
    
    // Limit description to 500 characters
    return description.substring(0, 500);
  }

  /**
   * Extracts pull request URL from API response
   */
  private extractPullRequestUrl(pr: any): string {
    // Try different URL formats
    if (pr.links?.self?.href) {
      return pr.links.self.href;
    }
    
    if (pr.links?.html?.href) {
      return pr.links.html.href;
    }
    
    if (pr.url) {
      return pr.url;
    }
    
    // Fallback: construct URL
    const prId = this.extractPullRequestId(pr);
    const repoInfo = pr.repository || pr.source?.repository || {};
    const projectKey = repoInfo.project?.key || 'unknown';
    const repoSlug = repoInfo.name || repoInfo.slug || 'unknown';
    
    return `${pr.baseUrl || 'https://bitbucket.org'}/projects/${projectKey}/repos/${repoSlug}/pull-requests/${prId}`;
  }

  /**
   * Extracts pull request metadata from API response
   */
  private extractPullRequestMetadata(pr: any): PullRequestMetadata {
    return {
      projectKey: pr.repository?.project?.key || pr.source?.repository?.project?.key,
      workspace: pr.repository?.workspace?.slug || pr.source?.repository?.workspace?.slug,
      repositorySlug: pr.repository?.name || pr.repository?.slug || pr.source?.repository?.name,
      author: this.extractAuthor(pr),
      reviewers: this.extractReviewers(pr),
      state: this.extractState(pr),
      sourceBranch: this.extractSourceBranch(pr),
      targetBranch: this.extractTargetBranch(pr),
      createdDate: this.extractCreatedDate(pr),
      updatedDate: this.extractUpdatedDate(pr),
      commentCount: this.extractCommentCount(pr),
      taskCount: this.extractTaskCount(pr),
    };
  }

  /**
   * Extracts author from pull request
   */
  private extractAuthor(pr: any): string | undefined {
    if (pr.author?.user?.name) {
      return pr.author.user.name;
    }
    
    if (pr.author?.name) {
      return pr.author.name;
    }
    
    if (pr.author?.displayName) {
      return pr.author.displayName;
    }
    
    if (pr.author?.username) {
      return pr.author.username;
    }
    
    return undefined;
  }

  /**
   * Extracts reviewers from pull request
   */
  private extractReviewers(pr: any): string[] {
    const reviewers: string[] = [];
    
    if (pr.reviewers && Array.isArray(pr.reviewers)) {
      pr.reviewers.forEach((reviewer: any) => {
        const name = reviewer.user?.name || reviewer.name || reviewer.displayName || reviewer.username;
        if (name) reviewers.push(name);
      });
    }
    
    return reviewers;
  }

  /**
   * Extracts state from pull request
   */
  private extractState(pr: any): 'OPEN' | 'MERGED' | 'DECLINED' | 'SUPERSEDED' | undefined {
    const state = pr.state || pr.status;
    if (state && ['OPEN', 'MERGED', 'DECLINED', 'SUPERSEDED'].includes(state)) {
      return state as 'OPEN' | 'MERGED' | 'DECLINED' | 'SUPERSEDED';
    }
    return undefined;
  }

  /**
   * Extracts source branch from pull request
   */
  private extractSourceBranch(pr: any): string | undefined {
    if (pr.source?.branch?.name) {
      return pr.source.branch.name;
    }
    
    if (pr.fromRef?.displayId) {
      return pr.fromRef.displayId;
    }
    
    return undefined;
  }

  /**
   * Extracts target branch from pull request
   */
  private extractTargetBranch(pr: any): string | undefined {
    if (pr.destination?.branch?.name) {
      return pr.destination.branch.name;
    }
    
    if (pr.toRef?.displayId) {
      return pr.toRef.displayId;
    }
    
    return undefined;
  }

  /**
   * Extracts created date from pull request
   */
  private extractCreatedDate(pr: any): string | undefined {
    const dateFields = ['createdDate', 'created_on', 'createdAt', 'timestamp'];
    
    for (const field of dateFields) {
      if (pr[field]) {
        return new Date(pr[field]).toISOString();
      }
    }
    
    return undefined;
  }

  /**
   * Extracts updated date from pull request
   */
  private extractUpdatedDate(pr: any): string | undefined {
    const dateFields = ['updatedDate', 'updated_on', 'updatedAt', 'lastModified'];
    
    for (const field of dateFields) {
      if (pr[field]) {
        return new Date(pr[field]).toISOString();
      }
    }
    
    return undefined;
  }

  /**
   * Extracts comment count from pull request
   */
  private extractCommentCount(pr: any): number | undefined {
    return pr.commentCount || pr.comment_count || undefined;
  }

  /**
   * Extracts task count from pull request
   */
  private extractTaskCount(pr: any): number | undefined {
    return pr.taskCount || pr.task_count || undefined;
  }

  // ============================================================================
  // Validation Methods
  // ============================================================================

  /**
   * Validates user identifier (author/reviewer)
   */
  private validateUserIdentifier(userIdentifier: string): void {
    // Basic validation - can be username or email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const usernamePattern = /^[a-zA-Z0-9._-]+$/;
    
    if (!emailPattern.test(userIdentifier) && !usernamePattern.test(userIdentifier)) {
      logger.warn('Potentially invalid user identifier format', { userIdentifier });
    }
  }

  /**
   * Validates branch name
   */
  private validateBranchName(branchName: string): void {
    // Basic validation for branch names
    const branchPattern = /^[a-zA-Z0-9._/-]+$/;
    
    if (!branchPattern.test(branchName)) {
      logger.warn('Potentially invalid branch name format', { branchName });
    }
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Searches pull requests with specific options
   */
  public async searchPullRequests(
    serverInfo: ServerInfo,
    options: {
      query: string;
      projectKey?: string;
      workspace?: string;
      repositorySlug?: string;
      author?: string;
      reviewer?: string;
      state?: string;
      sourceBranch?: string;
      targetBranch?: string;
      fromDate?: string;
      toDate?: string;
      sortBy?: 'updatedDate' | 'createdDate' | 'title' | 'author' | 'state';
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    }
  ): Promise<PullRequestSearchResult[]> {
    const searchQuery: SearchQuery = {
      query: options.query,
      filters: {
        projectKey: options.projectKey,
        workspace: options.workspace,
        repositorySlug: options.repositorySlug,
        author: options.author,
        reviewer: options.reviewer,
        state: options.state as 'OPEN' | 'MERGED' | 'DECLINED' | 'SUPERSEDED' | undefined,
        sourceBranch: options.sourceBranch,
        targetBranch: options.targetBranch,
        fromDate: options.fromDate,
        toDate: options.toDate,
      },
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      page: options.page,
      limit: options.limit,
    };

    const response = await this.search(serverInfo, searchQuery);
    return response.results as PullRequestSearchResult[];
  }

  /**
   * Gets open pull requests by author
   */
  public async getOpenPullRequestsByAuthor(
    serverInfo: ServerInfo,
    author: string,
    options: {
      projectKey?: string;
      workspace?: string;
      repositorySlug?: string;
      limit?: number;
    } = {}
  ): Promise<PullRequestSearchResult[]> {
    return this.searchPullRequests(serverInfo, {
      query: `author:${author}`,
      projectKey: options.projectKey,
      workspace: options.workspace,
      repositorySlug: options.repositorySlug,
      author: author,
      state: 'OPEN',
      sortBy: 'updatedDate',
      sortOrder: 'desc',
      limit: options.limit || 25,
    });
  }

  /**
   * Gets pull requests assigned for review
   */
  public async getPullRequestsForReview(
    serverInfo: ServerInfo,
    reviewer: string,
    options: {
      projectKey?: string;
      workspace?: string;
      repositorySlug?: string;
      limit?: number;
    } = {}
  ): Promise<PullRequestSearchResult[]> {
    return this.searchPullRequests(serverInfo, {
      query: `reviewer:${reviewer}`,
      projectKey: options.projectKey,
      workspace: options.workspace,
      repositorySlug: options.repositorySlug,
      reviewer: reviewer,
      state: 'OPEN',
      sortBy: 'createdDate',
      sortOrder: 'asc',
      limit: options.limit || 25,
    });
  }

  /**
   * Searches pull requests by branch
   */
  public async searchPullRequestsByBranch(
    serverInfo: ServerInfo,
    branchName: string,
    options: {
      projectKey?: string;
      workspace?: string;
      repositorySlug?: string;
      branchType?: 'source' | 'target';
      state?: string;
      limit?: number;
    } = {}
  ): Promise<PullRequestSearchResult[]> {
    const searchOptions: any = {
      query: branchName,
      projectKey: options.projectKey,
      workspace: options.workspace,
      repositorySlug: options.repositorySlug,
      state: options.state,
      sortBy: 'updatedDate',
      sortOrder: 'desc',
      limit: options.limit || 25,
    };

    if (options.branchType === 'source') {
      searchOptions.sourceBranch = branchName;
    } else if (options.branchType === 'target') {
      searchOptions.targetBranch = branchName;
    } else {
      // Search both source and target branches
      searchOptions.query = `branch:${branchName}`;
    }

    return this.searchPullRequests(serverInfo, searchOptions);
  }
}

// ============================================================================
// Export
// ============================================================================

export default PullRequestSearchService;
