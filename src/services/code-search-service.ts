/**
 * Code Search Service
 * Implements code search functionality for Bitbucket
 * 
 * Supports both Data Center and Cloud APIs
 */

import { AxiosInstance } from 'axios';
import { SearchService } from './search-service.js';
import { Cache } from '../utils/cache.js';
import {
  SearchQuery,
  SearchResult,
  CodeSearchResult,
  CodeMetadata,
  SearchConfiguration,
} from '../types/search.js';
import { ServerInfo } from '../types/index.js';
import { logger } from '../utils/logger.js';

// ============================================================================
// Code Search Service
// ============================================================================

/**
 * Service for searching code in Bitbucket
 */
export class CodeSearchService extends SearchService {
  constructor(
    httpClient: AxiosInstance,
    cache: Cache,
    config: Partial<SearchConfiguration> = {}
  ) {
    super(httpClient, cache, 'code', config);
  }

  // ============================================================================
  // Abstract Method Implementations
  // ============================================================================

  /**
   * Builds the search URL for code search
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
      
      if (query.filters.language) {
        params.language = query.filters.language;
      }
      
      if (query.filters.fileExtension) {
        params.extension = query.filters.fileExtension;
      }
      
      if (query.filters.filePath) {
        params.path = query.filters.filePath;
      }
      
      if (query.filters.branch) {
        params.branch = query.filters.branch;
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
    const codeResults = this.extractCodeResults(apiResponse);
    
    codeResults.forEach((code: any) => {
      try {
        const result = this.transformCodeResult(code, query);
        results.push(result);
      } catch (error) {
        logger.warn('Failed to transform code result', {
          error: error instanceof Error ? error.message : 'Unknown error',
          codeResult: code,
        });
      }
    });

    return results;
  }

  /**
   * Gets the default sort field for code search
   */
  protected getDefaultSortField(): string {
    return 'relevance';
  }

  /**
   * Validates code search specific parameters
   */
  protected validateSearchTypeParams(query: SearchQuery): void {
    // Validate code-specific filters
    if (query.filters) {
      // Validate language
      if (query.filters.language) {
        this.validateLanguage(query.filters.language);
      }
      
      // Validate file extension
      if (query.filters.fileExtension) {
        this.validateFileExtension(query.filters.fileExtension);
      }
      
      // Validate file path
      if (query.filters.filePath) {
        this.validateFilePath(query.filters.filePath);
      }
      
      // Validate branch name
      if (query.filters.branch) {
        this.validateBranchName(query.filters.branch);
      }
      
      // Warn about performance for broad searches
      if (!query.filters.projectKey && !query.filters.workspace && !query.filters.repositorySlug) {
        logger.warn('Code search without repository filter may impact performance', {
          query: query.query,
        });
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
    const searchUrl = `${baseUrl}/rest/api/1.0/search/code`;
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
    
    if (params.language) {
      cloudParams.language = params.language;
    }
    
    if (params.extension) {
      cloudParams.extension = params.extension;
    }
    
    if (params.path) {
      cloudParams.path = params.path;
    }
    
    if (params.branch) {
      cloudParams.branch = params.branch;
    }

    const searchUrl = `${baseUrl}/2.0/search/code`;
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
      relevance: 'score',
      filename: 'name',
      path: 'path',
      size: 'size',
      lastModified: 'last_modified',
    };
    
    const apiSortField = sortMapping[sortBy] || sortBy;
    const sortDirection = sortOrder === 'asc' ? '' : '-';
    
    return `${sortDirection}${apiSortField}`;
  }

  /**
   * Extracts code results from API response
   */
  private extractCodeResults(apiResponse: any): any[] {
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
    
    if (apiResponse.results && Array.isArray(apiResponse.results)) {
      return apiResponse.results;
    }
    
    if (apiResponse.searchResults && Array.isArray(apiResponse.searchResults)) {
      return apiResponse.searchResults;
    }
    
    return [];
  }

  /**
   * Transforms a single code result from API response
   */
  private transformCodeResult(code: any, query: SearchQuery): CodeSearchResult {
    // Extract basic information
    const id = this.extractCodeId(code);
    const title = this.extractCodeTitle(code);
    const description = this.extractCodeDescription(code);
    const url = this.extractCodeUrl(code);
    const metadata = this.extractCodeMetadata(code);
    const relevanceScore = this.calculateRelevanceScore(query, code);

    return {
      type: 'code',
      id,
      title,
      description,
      url,
      metadata,
      relevanceScore,
    };
  }

  /**
   * Extracts code ID from API response
   */
  private extractCodeId(code: any): string {
    // Create unique ID from file path and repository
    const filePath = this.extractFilePath(code);
    const repoInfo = code.repository || {};
    const repoId = repoInfo.id || repoInfo.name || repoInfo.slug || 'unknown';
    
    return `${repoId}:${filePath}`;
  }

  /**
   * Extracts code title (filename) from API response
   */
  private extractCodeTitle(code: any): string {
    const filePath = this.extractFilePath(code);
    
    if (!filePath) {
      return 'Unknown file';
    }
    
    // Extract filename from path
    const filename = filePath.split('/').pop() || filePath;
    return filename;
  }

  /**
   * Extracts code description from API response
   */
  private extractCodeDescription(code: any): string | undefined {
    // Use file path as description
    const filePath = this.extractFilePath(code);
    
    if (!filePath) {
      return undefined;
    }
    
    // Add context about matches if available
    const matchCount = code.matchCount || code.matches?.length || 0;
    const contextInfo = matchCount > 0 ? ` (${matchCount} matches)` : '';
    
    return `${filePath}${contextInfo}`;
  }

  /**
   * Extracts code URL from API response
   */
  private extractCodeUrl(code: any): string {
    // Try different URL formats
    if (code.links?.self?.href) {
      return code.links.self.href;
    }
    
    if (code.links?.html?.href) {
      return code.links.html.href;
    }
    
    if (code.url) {
      return code.url;
    }
    
    // Fallback: construct URL
    const filePath = this.extractFilePath(code);
    const repoInfo = code.repository || {};
    const projectKey = repoInfo.project?.key || 'unknown';
    const repoSlug = repoInfo.name || repoInfo.slug || 'unknown';
    const branch = code.branch || 'main';
    
    return `${code.baseUrl || 'https://bitbucket.org'}/projects/${projectKey}/repos/${repoSlug}/browse/${filePath}?at=${branch}`;
  }

  /**
   * Extracts code metadata from API response
   */
  private extractCodeMetadata(code: any): CodeMetadata {
    return {
      projectKey: code.repository?.project?.key,
      workspace: code.repository?.workspace?.slug,
      repositorySlug: code.repository?.name || code.repository?.slug,
      filePath: this.extractFilePath(code),
      fileName: this.extractFileName(code),
      language: this.extractLanguage(code),
      fileExtension: this.extractFileExtension(code),
      fileSize: this.extractFileSize(code),
      branch: this.extractBranch(code),
      lastModified: this.extractLastModified(code),
      matches: this.extractMatches(code),
    };
  }

  /**
   * Extracts file path from code result
   */
  private extractFilePath(code: any): string | undefined {
    return code.path || code.file?.path || code.filePath;
  }

  /**
   * Extracts file name from code result
   */
  private extractFileName(code: any): string | undefined {
    const filePath = this.extractFilePath(code);
    
    if (!filePath) {
      return undefined;
    }
    
    return filePath.split('/').pop();
  }

  /**
   * Extracts language from code result
   */
  private extractLanguage(code: any): string | undefined {
    return code.language || code.file?.language || this.detectLanguageFromExtension(code);
  }

  /**
   * Extracts file extension from code result
   */
  private extractFileExtension(code: any): string | undefined {
    const fileName = this.extractFileName(code);
    
    if (!fileName) {
      return undefined;
    }
    
    const extensionMatch = fileName.match(/\.([^.]+)$/);
    return extensionMatch ? extensionMatch[1] : undefined;
  }

  /**
   * Extracts file size from code result
   */
  private extractFileSize(code: any): number | undefined {
    return code.size || code.file?.size || undefined;
  }

  /**
   * Extracts branch from code result
   */
  private extractBranch(code: any): string | undefined {
    return code.branch || code.ref || 'main';
  }

  /**
   * Extracts last modified date from code result
   */
  private extractLastModified(code: any): string | undefined {
    const dateFields = ['lastModified', 'last_modified', 'updatedAt', 'updated_on'];
    
    for (const field of dateFields) {
      if (code[field]) {
        return new Date(code[field]).toISOString();
      }
    }
    
    return undefined;
  }

  /**
   * Extracts code matches from result
   */
  private extractMatches(code: any): Array<{ lineNumber: number; content: string; type: string }> | undefined {
    if (!code.matches || !Array.isArray(code.matches)) {
      return undefined;
    }
    
    return code.matches.map((match: any) => ({
      lineNumber: match.lineNumber || match.line || 0,
      content: match.content || match.text || '',
      type: match.type || 'match',
    }));
  }

  /**
   * Detects language from file extension
   */
  private detectLanguageFromExtension(code: any): string | undefined {
    const extension = this.extractFileExtension(code);
    
    if (!extension) {
      return undefined;
    }
    
    const languageMap: Record<string, string> = {
      js: 'JavaScript',
      ts: 'TypeScript',
      jsx: 'JavaScript',
      tsx: 'TypeScript',
      py: 'Python',
      java: 'Java',
      kt: 'Kotlin',
      scala: 'Scala',
      go: 'Go',
      rs: 'Rust',
      cpp: 'C++',
      c: 'C',
      h: 'C',
      cs: 'C#',
      php: 'PHP',
      rb: 'Ruby',
      swift: 'Swift',
      m: 'Objective-C',
      sh: 'Shell',
      bash: 'Shell',
      zsh: 'Shell',
      sql: 'SQL',
      html: 'HTML',
      css: 'CSS',
      scss: 'SCSS',
      sass: 'Sass',
      less: 'Less',
      xml: 'XML',
      json: 'JSON',
      yaml: 'YAML',
      yml: 'YAML',
      md: 'Markdown',
      dockerfile: 'Dockerfile',
      makefile: 'Makefile',
    };
    
    return languageMap[extension.toLowerCase()];
  }

  // ============================================================================
  // Validation Methods
  // ============================================================================

  /**
   * Validates programming language
   */
  private validateLanguage(language: string): void {
    // List of common programming languages
    const validLanguages = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'Kotlin', 'Scala', 'Go', 'Rust',
      'C++', 'C', 'C#', 'PHP', 'Ruby', 'Swift', 'Objective-C', 'Shell', 'SQL',
      'HTML', 'CSS', 'SCSS', 'Sass', 'Less', 'XML', 'JSON', 'YAML', 'Markdown',
      'Dockerfile', 'Makefile',
    ];
    
    if (!validLanguages.some(lang => lang.toLowerCase() === language.toLowerCase())) {
      logger.warn('Unknown programming language specified', { language });
    }
  }

  /**
   * Validates file extension
   */
  private validateFileExtension(extension: string): void {
    // Remove leading dot if present
    const cleanExtension = extension.startsWith('.') ? extension.substring(1) : extension;
    
    // Basic validation
    const extensionPattern = /^[a-zA-Z0-9]+$/;
    
    if (!extensionPattern.test(cleanExtension)) {
      logger.warn('Invalid file extension format', { extension });
    }
  }

  /**
   * Validates file path
   */
  private validateFilePath(filePath: string): void {
    // Basic validation for file paths
    const pathPattern = /^[a-zA-Z0-9._/-]+$/;
    
    if (!pathPattern.test(filePath)) {
      logger.warn('Potentially invalid file path format', { filePath });
    }
    
    // Check for directory traversal attempts
    if (filePath.includes('..')) {
      throw new Error('Directory traversal not allowed in file path');
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
   * Searches code with specific options
   */
  public async searchCode(
    serverInfo: ServerInfo,
    options: {
      query: string;
      projectKey?: string;
      workspace?: string;
      repositorySlug?: string;
      language?: string;
      fileExtension?: string;
      filePath?: string;
      branch?: string;
      sortBy?: 'relevance' | 'filename' | 'path' | 'size' | 'lastModified';
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    }
  ): Promise<CodeSearchResult[]> {
    const searchQuery: SearchQuery = {
      query: options.query,
      filters: {
        projectKey: options.projectKey,
        workspace: options.workspace,
        repositorySlug: options.repositorySlug,
        language: options.language,
        fileExtension: options.fileExtension,
        filePath: options.filePath,
        branch: options.branch,
      },
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      page: options.page,
      limit: options.limit,
    };

    const response = await this.search(serverInfo, searchQuery);
    return response.results as CodeSearchResult[];
  }

  /**
   * Searches code by language
   */
  public async searchCodeByLanguage(
    serverInfo: ServerInfo,
    query: string,
    language: string,
    options: {
      projectKey?: string;
      workspace?: string;
      repositorySlug?: string;
      limit?: number;
    } = {}
  ): Promise<CodeSearchResult[]> {
    return this.searchCode(serverInfo, {
      query,
      language,
      projectKey: options.projectKey,
      workspace: options.workspace,
      repositorySlug: options.repositorySlug,
      sortBy: 'relevance',
      sortOrder: 'desc',
      limit: options.limit || 25,
    });
  }

  /**
   * Searches code by file extension
   */
  public async searchCodeByExtension(
    serverInfo: ServerInfo,
    query: string,
    extension: string,
    options: {
      projectKey?: string;
      workspace?: string;
      repositorySlug?: string;
      limit?: number;
    } = {}
  ): Promise<CodeSearchResult[]> {
    return this.searchCode(serverInfo, {
      query,
      fileExtension: extension,
      projectKey: options.projectKey,
      workspace: options.workspace,
      repositorySlug: options.repositorySlug,
      sortBy: 'relevance',
      sortOrder: 'desc',
      limit: options.limit || 25,
    });
  }

  /**
   * Searches code in specific path
   */
  public async searchCodeInPath(
    serverInfo: ServerInfo,
    query: string,
    filePath: string,
    options: {
      projectKey?: string;
      workspace?: string;
      repositorySlug?: string;
      limit?: number;
    } = {}
  ): Promise<CodeSearchResult[]> {
    return this.searchCode(serverInfo, {
      query,
      filePath,
      projectKey: options.projectKey,
      workspace: options.workspace,
      repositorySlug: options.repositorySlug,
      sortBy: 'relevance',
      sortOrder: 'desc',
      limit: options.limit || 25,
    });
  }

  /**
   * Finds files by name pattern
   */
  public async findFilesByName(
    serverInfo: ServerInfo,
    namePattern: string,
    options: {
      projectKey?: string;
      workspace?: string;
      repositorySlug?: string;
      branch?: string;
      limit?: number;
    } = {}
  ): Promise<CodeSearchResult[]> {
    return this.searchCode(serverInfo, {
      query: `filename:${namePattern}`,
      projectKey: options.projectKey,
      workspace: options.workspace,
      repositorySlug: options.repositorySlug,
      branch: options.branch,
      sortBy: 'filename',
      sortOrder: 'asc',
      limit: options.limit || 25,
    });
  }
}

// ============================================================================
// Export
// ============================================================================

export default CodeSearchService;
