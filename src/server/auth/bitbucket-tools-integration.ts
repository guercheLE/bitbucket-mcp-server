/**
 * Bitbucket Tools Integration for Bitbucket MCP Server
 * 
 * This module provides integration between the MCP tools and Bitbucket APIs,
 * handling tool execution with authentication, API routing, and response
 * processing for Bitbucket operations.
 * 
 * Key Features:
 * - MCP tool to Bitbucket API mapping
 * - Authenticated tool execution
 * - API response processing and formatting
 * - Error handling and validation
 * - Tool result caching and optimization
 * 
 * Constitutional Requirements:
 * - MCP protocol compliance
 * - Secure API communication
 * - Comprehensive error handling
 * - Performance optimization
 */

import { EventEmitter } from 'events';
import {
  AuthenticationError,
  AuthenticationErrorCode,
  UserSession
} from '../../types/auth';
import { ToolExecutionContext, ToolRequest, ToolResponse } from '../../types';
import { BitbucketAPIManager, APIRequestContext } from './bitbucket-api-manager';

/**
 * Tool Execution Result
 */
export interface ToolExecutionResult {
  /** Whether execution was successful */
  success: boolean;
  
  /** Result data */
  data?: any;
  
  /** Error information */
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  
  /** Execution metadata */
  metadata: {
    toolName: string;
    instanceId: string;
    executionTime: number;
    timestamp: Date;
    requestId: string;
  };
}

/**
 * Bitbucket Tools Integration Class
 * Integrates MCP tools with Bitbucket APIs
 */
export class BitbucketToolsIntegration extends EventEmitter {
  private apiManager: BitbucketAPIManager;
  private toolMappings: Map<string, ToolMapping> = new Map();

  constructor(apiManager: BitbucketAPIManager) {
    super();
    this.apiManager = apiManager;
    this.initializeToolMappings();
    this.setupEventHandlers();
  }

  // ============================================================================
  // Tool Execution
  // ============================================================================

  /**
   * Execute Bitbucket tool with authentication
   */
  async executeTool(
    toolName: string,
    params: Record<string, any>,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      // Validate authentication context
      if (!context.authentication?.isAuthenticated || !context.authentication.userSession) {
        throw new AuthenticationError({
          code: AuthenticationErrorCode.AUTHENTICATION_FAILED,
          message: 'Tool execution requires authentication',
          timestamp: new Date(),
          isRecoverable: false
        });
      }

      // Get tool mapping
      const mapping = this.toolMappings.get(toolName);
      if (!mapping) {
        throw new AuthenticationError({
          code: AuthenticationErrorCode.INTERNAL_ERROR,
          message: `Unknown tool: ${toolName}`,
          timestamp: new Date(),
          isRecoverable: false
        });
      }

      // Validate parameters
      this.validateToolParameters(toolName, params, mapping);

      // Create API request context
      const apiContext: APIRequestContext = {
        userSession: context.authentication.userSession,
        accessToken: context.authentication.userSession.accessToken,
        preferredInstanceId: context.bitbucket?.baseUrl ? this.findInstanceByBaseUrl(context.bitbucket.baseUrl) : undefined,
        metadata: {
          toolName,
          requestId,
          timestamp: new Date()
        }
      };

      // Execute tool-specific logic
      const result = await this.executeToolLogic(toolName, params, apiContext, mapping);

      const executionTime = Date.now() - startTime;

      // Emit successful execution event
      this.emit('tool:executed', {
        toolName,
        success: true,
        executionTime,
        requestId,
        instanceId: result.instanceId
      });

      return {
        success: true,
        data: result.data,
        metadata: {
          toolName,
          instanceId: result.instanceId,
          executionTime,
          timestamp: new Date(),
          requestId
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      // Emit failed execution event
      this.emit('tool:executed', {
        toolName,
        success: false,
        executionTime,
        requestId,
        error: error.message
      });

      return {
        success: false,
        error: {
          code: error.code || 'EXECUTION_ERROR',
          message: error.message,
          details: error.details
        },
        metadata: {
          toolName,
          instanceId: 'unknown',
          executionTime,
          timestamp: new Date(),
          requestId
        }
      };
    }
  }

  // ============================================================================
  // Tool Logic Implementation
  // ============================================================================

  /**
   * Execute tool-specific logic
   */
  private async executeToolLogic(
    toolName: string,
    params: Record<string, any>,
    context: APIRequestContext,
    mapping: ToolMapping
  ): Promise<{ instanceId: string; data: any }> {
    switch (toolName) {
      case 'bitbucket/repository/list':
        return await this.executeRepositoryList(params, context, mapping);
      
      case 'bitbucket/repository/get':
        return await this.executeRepositoryGet(params, context, mapping);
      
      case 'bitbucket/repository/create':
        return await this.executeRepositoryCreate(params, context, mapping);
      
      case 'bitbucket/project/list':
        return await this.executeProjectList(params, context, mapping);
      
      case 'bitbucket/project/get':
        return await this.executeProjectGet(params, context, mapping);
      
      case 'bitbucket/pull-request/list':
        return await this.executePullRequestList(params, context, mapping);
      
      case 'bitbucket/pull-request/get':
        return await this.executePullRequestGet(params, context, mapping);
      
      case 'bitbucket/pull-request/create':
        return await this.executePullRequestCreate(params, context, mapping);
      
      case 'bitbucket/user/info':
        return await this.executeUserInfo(params, context, mapping);
      
      default:
        throw new AuthenticationError({
          code: AuthenticationErrorCode.INTERNAL_ERROR,
          message: `Tool logic not implemented: ${toolName}`,
          timestamp: new Date(),
          isRecoverable: false
        });
    }
  }

  /**
   * Execute repository list tool
   */
  private async executeRepositoryList(
    params: Record<string, any>,
    context: APIRequestContext,
    mapping: ToolMapping
  ): Promise<{ instanceId: string; data: any }> {
    const endpoint = mapping.endpoint;
    const requestParams = {
      limit: params.limit || 25,
      start: params.start || 0,
      ...params.filters
    };

    const result = await this.apiManager.makeRequest(context, {
      method: 'GET',
      endpoint,
      params: requestParams
    });

    return {
      instanceId: result.instanceId,
      data: this.formatRepositoryListResponse(result.response.data)
    };
  }

  /**
   * Execute repository get tool
   */
  private async executeRepositoryGet(
    params: Record<string, any>,
    context: APIRequestContext,
    mapping: ToolMapping
  ): Promise<{ instanceId: string; data: any }> {
    const endpoint = this.buildEndpoint(mapping.endpoint, params);
    
    const result = await this.apiManager.makeRequest(context, {
      method: 'GET',
      endpoint
    });

    return {
      instanceId: result.instanceId,
      data: this.formatRepositoryResponse(result.response.data)
    };
  }

  /**
   * Execute repository create tool
   */
  private async executeRepositoryCreate(
    params: Record<string, any>,
    context: APIRequestContext,
    mapping: ToolMapping
  ): Promise<{ instanceId: string; data: any }> {
    const endpoint = mapping.endpoint;
    const requestData = {
      name: params.name,
      description: params.description,
      is_private: params.isPrivate || false,
      ...params.options
    };

    const result = await this.apiManager.makeRequest(context, {
      method: 'POST',
      endpoint,
      data: requestData
    });

    return {
      instanceId: result.instanceId,
      data: this.formatRepositoryResponse(result.response.data)
    };
  }

  /**
   * Execute project list tool
   */
  private async executeProjectList(
    params: Record<string, any>,
    context: APIRequestContext,
    mapping: ToolMapping
  ): Promise<{ instanceId: string; data: any }> {
    const endpoint = mapping.endpoint;
    const requestParams = {
      limit: params.limit || 25,
      start: params.start || 0,
      ...params.filters
    };

    const result = await this.apiManager.makeRequest(context, {
      method: 'GET',
      endpoint,
      params: requestParams
    });

    return {
      instanceId: result.instanceId,
      data: this.formatProjectListResponse(result.response.data)
    };
  }

  /**
   * Execute project get tool
   */
  private async executeProjectGet(
    params: Record<string, any>,
    context: APIRequestContext,
    mapping: ToolMapping
  ): Promise<{ instanceId: string; data: any }> {
    const endpoint = this.buildEndpoint(mapping.endpoint, params);
    
    const result = await this.apiManager.makeRequest(context, {
      method: 'GET',
      endpoint
    });

    return {
      instanceId: result.instanceId,
      data: this.formatProjectResponse(result.response.data)
    };
  }

  /**
   * Execute pull request list tool
   */
  private async executePullRequestList(
    params: Record<string, any>,
    context: APIRequestContext,
    mapping: ToolMapping
  ): Promise<{ instanceId: string; data: any }> {
    const endpoint = this.buildEndpoint(mapping.endpoint, params);
    const requestParams = {
      limit: params.limit || 25,
      start: params.start || 0,
      state: params.state || 'OPEN',
      ...params.filters
    };

    const result = await this.apiManager.makeRequest(context, {
      method: 'GET',
      endpoint,
      params: requestParams
    });

    return {
      instanceId: result.instanceId,
      data: this.formatPullRequestListResponse(result.response.data)
    };
  }

  /**
   * Execute pull request get tool
   */
  private async executePullRequestGet(
    params: Record<string, any>,
    context: APIRequestContext,
    mapping: ToolMapping
  ): Promise<{ instanceId: string; data: any }> {
    const endpoint = this.buildEndpoint(mapping.endpoint, params);
    
    const result = await this.apiManager.makeRequest(context, {
      method: 'GET',
      endpoint
    });

    return {
      instanceId: result.instanceId,
      data: this.formatPullRequestResponse(result.response.data)
    };
  }

  /**
   * Execute pull request create tool
   */
  private async executePullRequestCreate(
    params: Record<string, any>,
    context: APIRequestContext,
    mapping: ToolMapping
  ): Promise<{ instanceId: string; data: any }> {
    const endpoint = this.buildEndpoint(mapping.endpoint, params);
    const requestData = {
      title: params.title,
      description: params.description,
      fromRef: params.fromRef,
      toRef: params.toRef,
      reviewers: params.reviewers || [],
      ...params.options
    };

    const result = await this.apiManager.makeRequest(context, {
      method: 'POST',
      endpoint,
      data: requestData
    });

    return {
      instanceId: result.instanceId,
      data: this.formatPullRequestResponse(result.response.data)
    };
  }

  /**
   * Execute user info tool
   */
  private async executeUserInfo(
    params: Record<string, any>,
    context: APIRequestContext,
    mapping: ToolMapping
  ): Promise<{ instanceId: string; data: any }> {
    const endpoint = mapping.endpoint;
    
    const result = await this.apiManager.makeRequest(context, {
      method: 'GET',
      endpoint
    });

    return {
      instanceId: result.instanceId,
      data: this.formatUserInfoResponse(result.response.data)
    };
  }

  // ============================================================================
  // Response Formatting
  // ============================================================================

  private formatRepositoryListResponse(data: any): any {
    // Format repository list response for MCP
    return {
      repositories: data.values || data.repositories || [],
      total: data.size || data.total || 0,
      hasMore: data.isLastPage === false || data.next !== undefined
    };
  }

  private formatRepositoryResponse(data: any): any {
    // Format single repository response for MCP
    return {
      id: data.id || data.uuid,
      name: data.name || data.slug,
      description: data.description,
      isPrivate: data.is_private || data.public === false,
      createdDate: data.created_on || data.createdDate,
      updatedDate: data.updated_on || data.updatedDate,
      links: data.links,
      project: data.project
    };
  }

  private formatProjectListResponse(data: any): any {
    // Format project list response for MCP
    return {
      projects: data.values || data.projects || [],
      total: data.size || data.total || 0,
      hasMore: data.isLastPage === false || data.next !== undefined
    };
  }

  private formatProjectResponse(data: any): any {
    // Format single project response for MCP
    return {
      id: data.id || data.key,
      name: data.name,
      description: data.description,
      type: data.type,
      createdDate: data.created_on || data.createdDate,
      updatedDate: data.updated_on || data.updatedDate,
      links: data.links
    };
  }

  private formatPullRequestListResponse(data: any): any {
    // Format pull request list response for MCP
    return {
      pullRequests: data.values || data.pullRequests || [],
      total: data.size || data.total || 0,
      hasMore: data.isLastPage === false || data.next !== undefined
    };
  }

  private formatPullRequestResponse(data: any): any {
    // Format single pull request response for MCP
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      state: data.state,
      author: data.author,
      reviewers: data.reviewers || [],
      fromRef: data.fromRef,
      toRef: data.toRef,
      createdDate: data.createdDate,
      updatedDate: data.updatedDate,
      links: data.links
    };
  }

  private formatUserInfoResponse(data: any): any {
    // Format user info response for MCP
    return {
      id: data.id || data.uuid,
      username: data.username || data.slug,
      displayName: data.display_name || data.name,
      email: data.email_address || data.email,
      avatar: data.links?.avatar?.href || data.avatar_url,
      createdDate: data.created_on || data.createdDate
    };
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private initializeToolMappings(): void {
    // Initialize tool to API endpoint mappings
    this.toolMappings.set('bitbucket/repository/list', {
      endpoint: '/rest/api/1.0/repos',
      method: 'GET',
      requiredParams: [],
      optionalParams: ['limit', 'start', 'projectKey', 'name']
    });

    this.toolMappings.set('bitbucket/repository/get', {
      endpoint: '/rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}',
      method: 'GET',
      requiredParams: ['projectKey', 'repositorySlug'],
      optionalParams: []
    });

    this.toolMappings.set('bitbucket/repository/create', {
      endpoint: '/rest/api/1.0/projects/{projectKey}/repos',
      method: 'POST',
      requiredParams: ['projectKey', 'name'],
      optionalParams: ['description', 'isPrivate']
    });

    this.toolMappings.set('bitbucket/project/list', {
      endpoint: '/rest/api/1.0/projects',
      method: 'GET',
      requiredParams: [],
      optionalParams: ['limit', 'start', 'name']
    });

    this.toolMappings.set('bitbucket/project/get', {
      endpoint: '/rest/api/1.0/projects/{projectKey}',
      method: 'GET',
      requiredParams: ['projectKey'],
      optionalParams: []
    });

    this.toolMappings.set('bitbucket/pull-request/list', {
      endpoint: '/rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests',
      method: 'GET',
      requiredParams: ['projectKey', 'repositorySlug'],
      optionalParams: ['limit', 'start', 'state']
    });

    this.toolMappings.set('bitbucket/pull-request/get', {
      endpoint: '/rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}',
      method: 'GET',
      requiredParams: ['projectKey', 'repositorySlug', 'pullRequestId'],
      optionalParams: []
    });

    this.toolMappings.set('bitbucket/pull-request/create', {
      endpoint: '/rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests',
      method: 'POST',
      requiredParams: ['projectKey', 'repositorySlug', 'title', 'fromRef', 'toRef'],
      optionalParams: ['description', 'reviewers']
    });

    this.toolMappings.set('bitbucket/user/info', {
      endpoint: '/rest/api/1.0/users/current',
      method: 'GET',
      requiredParams: [],
      optionalParams: []
    });
  }

  private validateToolParameters(toolName: string, params: Record<string, any>, mapping: ToolMapping): void {
    // Check required parameters
    for (const requiredParam of mapping.requiredParams) {
      if (!(requiredParam in params)) {
        throw new AuthenticationError({
          code: AuthenticationErrorCode.INVALID_REQUEST,
          message: `Missing required parameter: ${requiredParam}`,
          details: { toolName, requiredParam },
          timestamp: new Date(),
          isRecoverable: false
        });
      }
    }
  }

  private buildEndpoint(template: string, params: Record<string, any>): string {
    let endpoint = template;
    
    // Replace path parameters
    for (const [key, value] of Object.entries(params)) {
      endpoint = endpoint.replace(`{${key}}`, encodeURIComponent(String(value)));
    }
    
    return endpoint;
  }

  private findInstanceByBaseUrl(baseUrl: string): string | undefined {
    // Find instance ID by base URL
    for (const [instanceId, client] of this.apiManager.getAllInstances().entries()) {
      // This would need to be implemented based on how baseUrl is stored
      // For now, return undefined to use default selection
      return undefined;
    }
    return undefined;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupEventHandlers(): void {
    // Handle API manager events
    this.apiManager.on('request:completed', (data) => {
      this.emit('api:request-completed', data);
    });

    this.apiManager.on('request:failed', (data) => {
      this.emit('api:request-failed', data);
    });
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface ToolMapping {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  requiredParams: string[];
  optionalParams: string[];
}
