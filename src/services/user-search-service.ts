/**
 * User Search Service
 * Implements user search functionality for Bitbucket
 * 
 * Supports both Data Center and Cloud APIs
 */

import { AxiosInstance } from 'axios';
import { SearchService } from './search-service.js';
import { Cache } from '../utils/cache.js';
import {
  SearchQuery,
  SearchResult,
  UserSearchResult,
  UserMetadata,
  SearchConfiguration,
} from '../types/search.js';
import { ServerInfo } from '../types/index.js';
import { logger } from '../utils/logger.js';

// ============================================================================
// User Search Service
// ============================================================================

/**
 * Service for searching users in Bitbucket
 */
export class UserSearchService extends SearchService {
  constructor(
    httpClient: AxiosInstance,
    cache: Cache,
    config: Partial<SearchConfiguration> = {}
  ) {
    super(httpClient, cache, 'user', config);
  }

  // ============================================================================
  // Abstract Method Implementations
  // ============================================================================

  /**
   * Builds the search URL for user search
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
      if (query.filters.workspace) {
        params.workspace = query.filters.workspace;
      }
      
      if (query.filters.role) {
        params.role = query.filters.role;
      }
      
      if (query.filters.permission) {
        params.permission = query.filters.permission;
      }
      
      if (query.filters.active !== undefined) {
        params.active = query.filters.active;
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
    const users = this.extractUsers(apiResponse);
    
    users.forEach((user: any) => {
      try {
        const result = this.transformUser(user, query);
        results.push(result);
      } catch (error) {
        logger.warn('Failed to transform user result', {
          error: error instanceof Error ? error.message : 'Unknown error',
          user: user,
        });
      }
    });

    return results;
  }

  /**
   * Gets the default sort field for user search
   */
  protected getDefaultSortField(): string {
    return 'displayName';
  }

  /**
   * Validates user search specific parameters
   */
  protected validateSearchTypeParams(query: SearchQuery): void {
    // Validate user-specific filters
    if (query.filters) {
      // Validate role values
      if (query.filters.role) {
        this.validateRole(query.filters.role);
      }
      
      // Validate permission values
      if (query.filters.permission) {
        this.validatePermission(query.filters.permission);
      }
      
      // Validate workspace
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
    const searchUrl = `${baseUrl}/rest/api/1.0/admin/users`;
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
    
    if (params.role) {
      cloudParams.role = params.role;
    }
    
    if (params.permission) {
      cloudParams.permission = params.permission;
    }
    
    if (params.active !== undefined) {
      cloudParams.active = params.active;
    }

    const searchUrl = `${baseUrl}/2.0/users`;
    return this.buildUrlWithParams(searchUrl, cloudParams);
  }

  /**
   * Builds sort parameter based on query
   */
  private buildSortParam(query: SearchQuery): string {
    const sortBy = query.sortBy || this.getDefaultSortField();
    const sortOrder = query.sortOrder || 'asc';
    
    // Map sort fields to API format
    const sortMapping: Record<string, string> = {
      displayName: 'displayName',
      username: 'name',
      email: 'emailAddress',
      lastActive: 'lastAuthenticationTime',
      created: 'createdDate',
    };
    
    const apiSortField = sortMapping[sortBy] || sortBy;
    const sortDirection = sortOrder === 'asc' ? '' : '-';
    
    return `${sortDirection}${apiSortField}`;
  }

  /**
   * Extracts users from API response
   */
  private extractUsers(apiResponse: any): any[] {
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
    
    if (apiResponse.users && Array.isArray(apiResponse.users)) {
      return apiResponse.users;
    }
    
    return [];
  }

  /**
   * Transforms a single user from API response
   */
  private transformUser(user: any, query: SearchQuery): UserSearchResult {
    // Extract basic information
    const id = this.extractUserId(user);
    const title = this.extractUserTitle(user);
    const description = this.extractUserDescription(user);
    const url = this.extractUserUrl(user);
    const metadata = this.extractUserMetadata(user);
    const relevanceScore = this.calculateRelevanceScore(query, user);

    return {
      type: 'user',
      id,
      title,
      description,
      url,
      metadata,
      relevanceScore,
    };
  }

  /**
   * Extracts user ID from API response
   */
  private extractUserId(user: any): string {
    return String(user.id || user.uuid || user.name || user.username || 'unknown');
  }

  /**
   * Extracts user title (display name) from API response
   */
  private extractUserTitle(user: any): string {
    return user.displayName || user.display_name || user.name || user.username || 'Unknown User';
  }

  /**
   * Extracts user description from API response
   */
  private extractUserDescription(user: any): string | undefined {
    const parts: string[] = [];
    
    // Add username if different from display name
    const username = user.name || user.username;
    const displayName = user.displayName || user.display_name;
    
    if (username && username !== displayName) {
      parts.push(`@${username}`);
    }
    
    // Add email if available
    const email = user.emailAddress || user.email;
    if (email) {
      parts.push(email);
    }
    
    // Add role if available
    const role = this.extractRole(user);
    if (role) {
      parts.push(`Role: ${role}`);
    }
    
    return parts.length > 0 ? parts.join(' • ') : undefined;
  }

  /**
   * Extracts user URL from API response
   */
  private extractUserUrl(user: any): string {
    // Try different URL formats
    if (user.links?.self?.href) {
      return user.links.self.href;
    }
    
    if (user.links?.html?.href) {
      return user.links.html.href;
    }
    
    if (user.url) {
      return user.url;
    }
    
    // Fallback: construct URL
    const username = user.name || user.username || this.extractUserId(user);
    return `${user.baseUrl || 'https://bitbucket.org'}/${username}`;
  }

  /**
   * Extracts user metadata from API response
   */
  private extractUserMetadata(user: any): UserMetadata {
    return {
      username: user.name || user.username,
      displayName: user.displayName || user.display_name,
      email: user.emailAddress || user.email,
      role: this.extractRole(user),
      workspace: this.extractWorkspace(user),
      active: this.extractActiveStatus(user),
      lastActive: this.extractLastActive(user),
      created: this.extractCreated(user),
      avatarUrl: this.extractAvatarUrl(user),
    };
  }

  /**
   * Extracts role from user
   */
  private extractRole(user: any): string | undefined {
    return user.role || user.type || undefined;
  }

  /**
   * Extracts workspace from user
   */
  private extractWorkspace(user: any): string | undefined {
    return user.workspace?.slug || user.workspace?.name || undefined;
  }

  /**
   * Extracts active status from user
   */
  private extractActiveStatus(user: any): boolean | undefined {
    if (user.active !== undefined) {
      return user.active;
    }
    
    if (user.is_active !== undefined) {
      return user.is_active;
    }
    
    // Infer from last authentication time
    const lastActive = this.extractLastActive(user);
    if (lastActive) {
      const lastActiveDate = new Date(lastActive);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      return lastActiveDate > thirtyDaysAgo;
    }
    
    return undefined;
  }

  /**
   * Extracts last active date from user
   */
  private extractLastActive(user: any): string | undefined {
    const dateFields = ['lastAuthenticationTime', 'last_active', 'lastLogin', 'updatedAt'];
    
    for (const field of dateFields) {
      if (user[field]) {
        return new Date(user[field]).toISOString();
      }
    }
    
    return undefined;
  }

  /**
   * Extracts created date from user
   */
  private extractCreated(user: any): string | undefined {
    const dateFields = ['createdDate', 'created_on', 'createdAt', 'created'];
    
    for (const field of dateFields) {
      if (user[field]) {
        return new Date(user[field]).toISOString();
      }
    }
    
    return undefined;
  }

  /**
   * Extracts avatar URL from user
   */
  private extractAvatarUrl(user: any): string | undefined {
    // Try different avatar URL formats
    if (user.links?.avatar?.href) {
      return user.links.avatar.href;
    }
    
    if (user.avatar) {
      return user.avatar;
    }
    
    if (user.avatarUrl) {
      return user.avatarUrl;
    }
    
    return undefined;
  }

  // ============================================================================
  // Validation Methods
  // ============================================================================

  /**
   * Validates role value
   */
  private validateRole(role: string): void {
    const validRoles = ['admin', 'user', 'contributor', 'collaborator', 'member'];
    
    if (!validRoles.includes(role.toLowerCase())) {
      logger.warn('Unknown user role specified', { role });
    }
  }

  /**
   * Validates permission value
   */
  private validatePermission(permission: string): void {
    const validPermissions = [
      'ADMIN', 'PROJECT_ADMIN', 'PROJECT_WRITE', 'PROJECT_READ',
      'REPO_ADMIN', 'REPO_WRITE', 'REPO_READ',
    ];
    
    if (!validPermissions.includes(permission.toUpperCase())) {
      logger.warn('Unknown permission specified', { permission });
    }
  }

  /**
   * Validates workspace identifier
   */
  private validateWorkspace(workspace: string): void {
    // Basic validation for workspace names
    const workspacePattern = /^[a-zA-Z0-9._-]+$/;
    
    if (!workspacePattern.test(workspace)) {
      logger.warn('Potentially invalid workspace format', { workspace });
    }
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Searches users with specific options
   */
  public async searchUsers(
    serverInfo: ServerInfo,
    options: {
      query: string;
      workspace?: string;
      role?: string;
      permission?: string;
      active?: boolean;
      sortBy?: 'displayName' | 'username' | 'email' | 'lastActive' | 'created';
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    }
  ): Promise<UserSearchResult[]> {
    const searchQuery: SearchQuery = {
      query: options.query,
      filters: {
        workspace: options.workspace,
        role: options.role,
        permission: options.permission,
        active: options.active,
      },
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      page: options.page,
      limit: options.limit,
    };

    const response = await this.search(serverInfo, searchQuery);
    return response.results as UserSearchResult[];
  }

  /**
   * Gets users by role
   */
  public async getUsersByRole(
    serverInfo: ServerInfo,
    role: string,
    options: {
      workspace?: string;
      active?: boolean;
      limit?: number;
    } = {}
  ): Promise<UserSearchResult[]> {
    return this.searchUsers(serverInfo, {
      query: `role:${role}`,
      workspace: options.workspace,
      role: role,
      active: options.active,
      sortBy: 'displayName',
      sortOrder: 'asc',
      limit: options.limit || 50,
    });
  }

  /**
   * Gets active users
   */
  public async getActiveUsers(
    serverInfo: ServerInfo,
    options: {
      workspace?: string;
      limit?: number;
      days?: number;
    } = {}
  ): Promise<UserSearchResult[]> {
    return this.searchUsers(serverInfo, {
      query: 'active:true',
      workspace: options.workspace,
      active: true,
      sortBy: 'lastActive',
      sortOrder: 'desc',
      limit: options.limit || 50,
    });
  }

  /**
   * Searches users by email domain
   */
  public async searchUsersByEmailDomain(
    serverInfo: ServerInfo,
    domain: string,
    options: {
      workspace?: string;
      active?: boolean;
      limit?: number;
    } = {}
  ): Promise<UserSearchResult[]> {
    return this.searchUsers(serverInfo, {
      query: `email:*@${domain}`,
      workspace: options.workspace,
      active: options.active,
      sortBy: 'displayName',
      sortOrder: 'asc',
      limit: options.limit || 50,
    });
  }

  /**
   * Gets users with specific permissions
   */
  public async getUsersWithPermission(
    serverInfo: ServerInfo,
    permission: string,
    options: {
      workspace?: string;
      projectKey?: string;
      repositorySlug?: string;
      limit?: number;
    } = {}
  ): Promise<UserSearchResult[]> {
    let query = `permission:${permission}`;
    
    if (options.projectKey) {
      query += ` project:${options.projectKey}`;
    }
    
    if (options.repositorySlug) {
      query += ` repository:${options.repositorySlug}`;
    }

    return this.searchUsers(serverInfo, {
      query,
      workspace: options.workspace,
      permission: permission,
      sortBy: 'displayName',
      sortOrder: 'asc',
      limit: options.limit || 50,
    });
  }

  /**
   * Finds users similar to a given user
   */
  public async findSimilarUsers(
    serverInfo: ServerInfo,
    username: string,
    options: {
      workspace?: string;
      limit?: number;
    } = {}
  ): Promise<UserSearchResult[]> {
    // Extract parts of the username for similarity search
    const parts = username.split(/[._-]/).filter(part => part.length > 2);
    const queryParts = parts.map(part => `name:*${part}* OR displayName:*${part}*`);
    const query = queryParts.join(' OR ');

    return this.searchUsers(serverInfo, {
      query: query || username,
      workspace: options.workspace,
      sortBy: 'displayName',
      sortOrder: 'asc',
      limit: options.limit || 20,
    });
  }
}

// ============================================================================
// Export
// ============================================================================

export default UserSearchService;
