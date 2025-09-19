/**
 * Repository Search Service
 * Implements repository search functionality for Bitbucket
 * 
 * Supports both Data Center and Cloud APIs
 */

import { AxiosInstance } from 'axios';
import { SearchService } from './search-service.js';
import { Cache } from '../utils/cache.js';
import {
  SearchQuery,
  SearchResult,
  RepositorySearchResult,
  RepositoryMetadata,
  SearchConfiguration,
} from '../types/search.js';
import { ServerInfo } from '../types/index.js';
import { logger } from '../utils/logger.js';

// ============================================================================
// Repository Search Service
// ============================================================================

/**
 * Service for searching repositories in Bitbucket
 */
export class RepositorySearchService extends SearchService {
  constructor(
    httpClient: AxiosInstance,
    cache: Cache,
    config: Partial<SearchConfiguration> = {}
  ) {
    super(httpClient, cache, 'repository', config);
  }

  // ============================================================================
  // Abstract Method Implementations
  // ============================================================================

  /**
   * Builds the search URL for repository search
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
        params.name = query.filters.repositorySlug;
      }
      
      if (query.filters.language) {
        params.language = query.filters.language;
      }
      
      if (query.filters.isPublic !== undefined) {
        params.visibility = query.filters.isPublic ? 'public' : 'private';
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
    const repositories = this.extractRepositories(apiResponse);
    
    repositories.forEach((repo: any) => {
      try {
        const result = this.transformRepository(repo, query);
        results.push(result);
      } catch (error) {
        logger.warn('Failed to transform repository result', {
          error: error instanceof Error ? error.message : 'Unknown error',
          repository: repo,
        });
      }
    });

    return results;
  }

  /**
   * Gets the default sort field for repository search
   */
  protected getDefaultSortField(): string {
    return 'lastModified';
  }

  /**
   * Validates repository search specific parameters
   */
  protected validateSearchTypeParams(query: SearchQuery): void {
    // Validate repository-specific filters
    if (query.filters) {
      // Validate language filter
      if (query.filters.language) {
        this.validateLanguage(query.filters.language);
      }
      
      // Validate project key format (Data Center)
      if (query.filters.projectKey) {
        this.validateProjectKey(query.filters.projectKey);
      }
      
      // Validate workspace format (Cloud)
      if (query.filters.workspace) {
        this.validateWorkspace(query.filters.workspace);
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
    const searchUrl = `${baseUrl}/rest/api/1.0/search/repositories`;
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
    
    if (params.name) {
      cloudParams.name = params.name;
    }
    
    if (params.language) {
      cloudParams.language = params.language;
    }
    
    if (params.visibility) {
      cloudParams.is_private = params.visibility === 'private';
    }

    const searchUrl = `${baseUrl}/2.0/repositories`;
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
      name: 'name',
      lastModified: 'updated_on',
      size: 'size',
      language: 'language',
    };
    
    const apiSortField = sortMapping[sortBy] || sortBy;
    const sortDirection = sortOrder === 'asc' ? '' : '-';
    
    return `${sortDirection}${apiSortField}`;
  }

  /**
   * Extracts repositories from API response
   */
  private extractRepositories(apiResponse: any): any[] {
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
    
    if (apiResponse.repositories && Array.isArray(apiResponse.repositories)) {
      return apiResponse.repositories;
    }
    
    return [];
  }

  /**
   * Transforms a single repository from API response
   */
  private transformRepository(repo: any, query: SearchQuery): RepositorySearchResult {
    // Extract basic information
    const id = this.extractRepositoryId(repo);
    const title = this.extractRepositoryTitle(repo);
    const description = this.extractRepositoryDescription(repo);
    const url = this.extractRepositoryUrl(repo);
    const metadata = this.extractRepositoryMetadata(repo);
    const relevanceScore = this.calculateRelevanceScore(query, repo);

    return {
      type: 'repository',
      id,
      title,
      description,
      url,
      metadata,
      relevanceScore,
    };
  }

  /**
   * Extracts repository ID from API response
   */
  private extractRepositoryId(repo: any): string {
    return repo.id || repo.uuid || `${repo.project?.key || 'unknown'}_${repo.name || repo.slug}`;
  }

  /**
   * Extracts repository title from API response
   */
  private extractRepositoryTitle(repo: any): string {
    return repo.name || repo.slug || 'Unknown Repository';
  }

  /**
   * Extracts repository description from API response
   */
  private extractRepositoryDescription(repo: any): string | undefined {
    return repo.description || undefined;
  }

  /**
   * Extracts repository URL from API response
   */
  private extractRepositoryUrl(repo: any): string {
    // Try different URL formats
    if (repo.links?.self?.href) {
      return repo.links.self.href;
    }
    
    if (repo.links?.html?.href) {
      return repo.links.html.href;
    }
    
    if (repo.url) {
      return repo.url;
    }
    
    // Fallback: construct URL
    const projectKey = repo.project?.key || 'unknown';
    const repoSlug = repo.name || repo.slug || 'unknown';
    return `${repo.baseUrl || 'https://bitbucket.org'}/projects/${projectKey}/repos/${repoSlug}`;
  }

  /**
   * Extracts repository metadata from API response
   */
  private extractRepositoryMetadata(repo: any): RepositoryMetadata {
    return {
      projectKey: repo.project?.key,
      workspace: repo.workspace?.slug,
      repositorySlug: repo.name || repo.slug,
      isPublic: this.extractIsPublic(repo),
      language: repo.language,
      size: repo.size,
      lastModified: this.extractLastModified(repo),
    };
  }

  /**
   * Extracts public/private status from repository
   */
  private extractIsPublic(repo: any): boolean | undefined {
    if (repo.is_private !== undefined) {
      return !repo.is_private;
    }
    
    if (repo.public !== undefined) {
      return repo.public;
    }
    
    if (repo.visibility) {
      return repo.visibility === 'public';
    }
    
    return undefined;
  }

  /**
   * Extracts last modified date from repository
   */
  private extractLastModified(repo: any): string | undefined {
    const dateFields = ['updated_on', 'updatedDate', 'lastModified', 'modified'];
    
    for (const field of dateFields) {
      if (repo[field]) {
        return new Date(repo[field]).toISOString();
      }
    }
    
    return undefined;
  }

  // ============================================================================
  // Validation Methods
  // ============================================================================

  /**
   * Validates programming language
   */
  private validateLanguage(language: string): void {
    const validLanguages = [
      'javascript', 'typescript', 'python', 'java', 'go', 'rust',
      'c', 'cpp', 'csharp', 'php', 'ruby', 'swift', 'kotlin',
      'scala', 'clojure', 'haskell', 'erlang', 'elixir',
    ];
    
    if (!validLanguages.includes(language.toLowerCase())) {
      logger.warn('Potentially invalid language filter', { language });
    }
  }

  /**
   * Validates project key format (Data Center)
   */
  private validateProjectKey(projectKey: string): void {
    const projectKeyPattern = /^[A-Z][A-Z0-9_]*$/;
    
    if (!projectKeyPattern.test(projectKey)) {
      throw new Error(`Invalid project key format: ${projectKey}. Must be uppercase letters, numbers, and underscores only.`);
    }
  }

  /**
   * Validates workspace format (Cloud)
   */
  private validateWorkspace(workspace: string): void {
    const workspacePattern = /^[a-z0-9][a-z0-9_-]*[a-z0-9]$/;
    
    if (!workspacePattern.test(workspace)) {
      throw new Error(`Invalid workspace format: ${workspace}. Must be lowercase letters, numbers, hyphens, and underscores only.`);
    }
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Searches repositories with specific options
   */
  public async searchRepositories(
    serverInfo: ServerInfo,
    options: {
      query: string;
      projectKey?: string;
      workspace?: string;
      language?: string;
      isPublic?: boolean;
      sortBy?: 'name' | 'lastModified' | 'size' | 'language';
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    }
  ): Promise<RepositorySearchResult[]> {
    const searchQuery: SearchQuery = {
      query: options.query,
      filters: {
        projectKey: options.projectKey,
        workspace: options.workspace,
        language: options.language,
        isPublic: options.isPublic,
      },
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      page: options.page,
      limit: options.limit,
    };

    const response = await this.search(serverInfo, searchQuery);
    return response.results as RepositorySearchResult[];
  }

  /**
   * Gets popular repositories (most recently updated)
   */
  public async getPopularRepositories(
    serverInfo: ServerInfo,
    options: {
      projectKey?: string;
      workspace?: string;
      limit?: number;
    } = {}
  ): Promise<RepositorySearchResult[]> {
    return this.searchRepositories(serverInfo, {
      query: '*', // Search all repositories
      projectKey: options.projectKey,
      workspace: options.workspace,
      sortBy: 'lastModified',
      sortOrder: 'desc',
      limit: options.limit || 10,
    });
  }

  /**
   * Searches repositories by language
   */
  public async searchRepositoriesByLanguage(
    serverInfo: ServerInfo,
    language: string,
    options: {
      projectKey?: string;
      workspace?: string;
      limit?: number;
    } = {}
  ): Promise<RepositorySearchResult[]> {
    return this.searchRepositories(serverInfo, {
      query: language, // Use language as search term
      language, // Also filter by language
      projectKey: options.projectKey,
      workspace: options.workspace,
      sortBy: 'lastModified',
      sortOrder: 'desc',
      limit: options.limit || 25,
    });
  }
}

// ============================================================================
// Export
// ============================================================================

export default RepositorySearchService;
