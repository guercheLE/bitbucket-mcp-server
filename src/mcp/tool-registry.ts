/**
 * MCP Tool Registry
 * T027: Multi-transport support for pull request operations (stdio, HTTP, SSE)
 * 
 * Central registry for all MCP tools with multi-transport support
 * Integrates pull request tools with the MCP server infrastructure
 */

import { Tool } from '@modelcontextprotocol/sdk/types';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { errorHandlerService } from '../services/error-handling';
import { rateLimitAndCircuitBreaker } from '../services/rate-limiter';
import { cache } from '../services/cache';
import { pullRequestAuthService, AuthenticationRequest, AuthenticationMethod } from '../services/pullrequest-auth-service';
import { pullRequestLoggingService } from '../services/pullrequest-logging-service';

// Import pull request tools
import { 
  createPullRequestTool,
  getPullRequestTool,
  updatePullRequestTool,
  deletePullRequestTool,
  listPullRequestsTool,
  createPullRequest,
  getPullRequest,
  updatePullRequest,
  deletePullRequest,
  listPullRequests
} from '../tools/datacenter/pullrequest/crud';

import {
  createCommentTool,
  getCommentTool,
  updateCommentTool,
  deleteCommentTool,
  listCommentsTool,
  createComment,
  getComment,
  updateComment,
  deleteComment,
  listComments
} from '../tools/datacenter/pullrequest/comments';

import {
  getActivitiesTool,
  getDiffTool,
  getChangesTool,
  getActivities,
  getDiff,
  getChanges
} from '../tools/datacenter/pullrequest/analysis';

import {
  mergePullRequestTool,
  declinePullRequestTool,
  reopenPullRequestTool,
  mergePullRequest,
  declinePullRequest,
  reopenPullRequest
} from '../tools/datacenter/pullrequest/operations';

// Import Issues tools
import { 
  issuesMcpTools, 
  IssuesMcpHandlers, 
  createIssuesMcpHandlers 
} from '../tools/cloud/issues/index';

export interface ToolHandler {
  name: string;
  description: string;
  inputSchema: any;
  handler: (args: any) => Promise<any>;
  rateLimitType?: 'api:light' | 'api:heavy' | 'api:bulk';
  cacheKey?: (args: any) => string;
  cacheTTL?: number;
}

export interface ToolRegistryConfig {
  enableRateLimiting: boolean;
  enableCaching: boolean;
  enableErrorHandling: boolean;
  defaultCacheTTL: number;
}

export class ToolRegistry {
  private tools: Map<string, ToolHandler> = new Map();
  private config: ToolRegistryConfig;
  private issuesHandlers: IssuesMcpHandlers | null = null;

  constructor(config: Partial<ToolRegistryConfig> = {}) {
    this.config = {
      enableRateLimiting: true,
      enableCaching: true,
      enableErrorHandling: true,
      defaultCacheTTL: 300, // 5 minutes
      ...config
    };

    this.registerPullRequestTools();
    this.registerIssuesTools();
  }

  /**
   * Register all pull request tools
   */
  private registerPullRequestTools(): void {
    logger.info('Registering pull request tools');

    // CRUD Tools
    this.registerTool({
      name: 'mcp_bitbucket_pull_request_create',
      description: 'Cria um novo pull request no Bitbucket Data Center',
      inputSchema: createPullRequestTool.inputSchema,
      handler: createPullRequest,
      rateLimitType: 'api:heavy',
      cacheKey: () => '', // No caching for create operations
    });

    this.registerTool({
      name: 'mcp_bitbucket_pull_request_get',
      description: 'Obtém um pull request específico no Bitbucket Data Center',
      inputSchema: getPullRequestTool.inputSchema,
      handler: getPullRequest,
      rateLimitType: 'api:light',
      cacheKey: (args) => `pr:${args.projectKey}:${args.repositorySlug}:${args.pullRequestId}`,
      cacheTTL: 60, // 1 minute for individual PRs
    });

    this.registerTool({
      name: 'mcp_bitbucket_pull_request_update',
      description: 'Atualiza um pull request existente no Bitbucket Data Center',
      inputSchema: updatePullRequestTool.inputSchema,
      handler: updatePullRequest,
      rateLimitType: 'api:heavy',
      cacheKey: () => '', // No caching for update operations
    });

    this.registerTool({
      name: 'mcp_bitbucket_pull_request_delete',
      description: 'Exclui um pull request no Bitbucket Data Center',
      inputSchema: deletePullRequestTool.inputSchema,
      handler: deletePullRequest,
      rateLimitType: 'api:heavy',
      cacheKey: () => '', // No caching for delete operations
    });

    this.registerTool({
      name: 'mcp_bitbucket_pull_request_list',
      description: 'Lista pull requests no Bitbucket Data Center',
      inputSchema: listPullRequestsTool.inputSchema,
      handler: listPullRequests,
      rateLimitType: 'api:light',
      cacheKey: (args) => `prs:${args.projectKey}:${args.repositorySlug}:${args.state || 'all'}`,
      cacheTTL: 120, // 2 minutes for PR lists
    });

    this.registerTool({
      name: 'mcp_bitbucket_pull_request_merge',
      description: 'Faz merge de um pull request no Bitbucket Data Center',
      inputSchema: mergePullRequestTool.inputSchema,
      handler: mergePullRequest,
      rateLimitType: 'api:heavy',
      cacheKey: () => '', // No caching for merge operations
    });

    this.registerTool({
      name: 'mcp_bitbucket_pull_request_decline',
      description: 'Recusa um pull request no Bitbucket Data Center',
      inputSchema: declinePullRequestTool.inputSchema,
      handler: declinePullRequest,
      rateLimitType: 'api:heavy',
      cacheKey: () => '', // No caching for decline operations
    });

    this.registerTool({
      name: 'mcp_bitbucket_pull_request_reopen',
      description: 'Reabre um pull request no Bitbucket Data Center',
      inputSchema: reopenPullRequestTool.inputSchema,
      handler: reopenPullRequest,
      rateLimitType: 'api:heavy',
      cacheKey: () => '', // No caching for reopen operations
    });

    // Comments Tools
    this.registerTool({
      name: 'mcp_bitbucket_pull_request_create_comment',
      description: 'Cria um comentário em um pull request no Bitbucket Data Center',
      inputSchema: createCommentTool.inputSchema,
      handler: createComment,
      rateLimitType: 'api:light',
      cacheKey: () => '', // No caching for create operations
    });

    this.registerTool({
      name: 'mcp_bitbucket_pull_request_get_comment',
      description: 'Obtém um comentário específico de um pull request no Bitbucket Data Center',
      inputSchema: getCommentTool.inputSchema,
      handler: getComment,
      rateLimitType: 'api:light',
      cacheKey: (args) => `comment:${args.projectKey}:${args.repositorySlug}:${args.pullRequestId}:${args.commentId}`,
      cacheTTL: 300, // 5 minutes for comments
    });

    this.registerTool({
      name: 'mcp_bitbucket_pull_request_update_comment',
      description: 'Atualiza um comentário de um pull request no Bitbucket Data Center',
      inputSchema: updateCommentTool.inputSchema,
      handler: updateComment,
      rateLimitType: 'api:light',
      cacheKey: () => '', // No caching for update operations
    });

    this.registerTool({
      name: 'mcp_bitbucket_pull_request_delete_comment',
      description: 'Remove um comentário de um pull request no Bitbucket Data Center',
      inputSchema: deleteCommentTool.inputSchema,
      handler: deleteComment,
      rateLimitType: 'api:light',
      cacheKey: () => '', // No caching for delete operations
    });

    this.registerTool({
      name: 'mcp_bitbucket_pull_request_get_activity',
      description: 'Obtém a atividade de um pull request no Bitbucket Data Center',
      inputSchema: getActivitiesTool.inputSchema,
      handler: getActivities,
      rateLimitType: 'api:light',
      cacheKey: (args) => `activity:${args.projectKey}:${args.repositorySlug}:${args.pullRequestId}`,
      cacheTTL: 60, // 1 minute for activities
    });

    this.registerTool({
      name: 'mcp_bitbucket_pull_request_get_diff',
      description: 'Obtém o diff de um pull request no Bitbucket Data Center',
      inputSchema: getDiffTool.inputSchema,
      handler: getDiff,
      rateLimitType: 'api:heavy',
      cacheKey: (args) => `diff:${args.projectKey}:${args.repositorySlug}:${args.pullRequestId}`,
      cacheTTL: 300, // 5 minutes for diffs
    });

    this.registerTool({
      name: 'mcp_bitbucket_pull_request_get_changes',
      description: 'Obtém as mudanças de um pull request no Bitbucket Data Center',
      inputSchema: getChangesTool.inputSchema,
      handler: getChanges,
      rateLimitType: 'api:light',
      cacheKey: (args) => `changes:${args.projectKey}:${args.repositorySlug}:${args.pullRequestId}`,
      cacheTTL: 120, // 2 minutes for changes
    });

    logger.info('Pull request tools registered successfully', {
      totalTools: this.tools.size,
      pullRequestTools: Array.from(this.tools.keys()).filter(name => name.includes('pull_request'))
    });
  }

  /**
   * Register all Issues tools
   */
  private registerIssuesTools(): void {
    logger.info('Registering Issues tools');

    // Initialize Issues handlers
    this.issuesHandlers = createIssuesMcpHandlers({
      baseUrl: process.env.BITBUCKET_CLOUD_API_URL || 'https://api.bitbucket.org/2.0',
      workspace: process.env.BITBUCKET_WORKSPACE || '',
      repository: process.env.BITBUCKET_REPOSITORY || '',
      accessToken: process.env.BITBUCKET_OAUTH_TOKEN || ''
    });

    // Register all Issues tools
    issuesMcpTools.forEach(tool => {
      this.registerTool({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        handler: this.createIssuesHandler(tool.name),
        rateLimitType: this.getIssuesRateLimitType(tool.name),
        cacheKey: this.getIssuesCacheKey(tool.name),
        cacheTTL: this.getIssuesCacheTTL(tool.name)
      });
    });

    logger.info('Issues tools registered successfully', {
      totalTools: this.tools.size,
      issuesTools: Array.from(this.tools.keys()).filter(name => name.includes('issues'))
    });
  }

  /**
   * Register a tool with the registry
   */
  public registerTool(tool: ToolHandler): void {
    this.tools.set(tool.name, tool);
    logger.debug('Tool registered', { name: tool.name });
  }

  /**
   * Get all registered tools as MCP Tool definitions
   */
  public getTools(): Tool[] {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }));
  }

  /**
   * Execute a tool with full integration (rate limiting, caching, error handling, authentication, logging)
   */
  public async executeTool(name: string, args: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    const startTime = Date.now();
    const isPullRequestTool = this.isPullRequestTool(name);
    const isIssuesTool = this.isIssuesTool(name);
    let cacheHit = false;
    let rateLimitRemaining: number | undefined;
    
    // Create log context for pull request tools
    const logContext = isPullRequestTool ? pullRequestLoggingService.createLogContext(
      name,
      args.projectKey,
      args.repositorySlug,
      args.pullRequestId
    ) : undefined;

    const requestId = isPullRequestTool && logContext ? 
      pullRequestLoggingService.logOperationStart(name, logContext, args) : 
      undefined;

    const context = this.config.enableErrorHandling 
      ? errorHandlerService.createContext(`tool:${name}`, {
          tool: name,
          args: Object.keys(args || {}),
          requestId
        })
      : null;

    try {
      // Authenticate for pull request tools
      if (isPullRequestTool && args.serverUrl && args.accessToken) {
        await this.authenticateForPullRequestTool(name, args);
      }

      // Check cache first
      if (this.config.enableCaching && tool.cacheKey) {
        const cacheKey = tool.cacheKey(args);
        if (cacheKey) {
          const cached = await cache.get(cacheKey);
          if (cached) {
            cacheHit = true;
            logger.debug('Tool result served from cache', { 
              tool: name, 
              cacheKey 
            });
            
            if (isPullRequestTool && requestId) {
              pullRequestLoggingService.logCache(name, { requestId }, { cacheKey, hit: true });
            }
            
            return cached;
          }
        }
      }

      // Apply rate limiting
      if (this.config.enableRateLimiting && tool.rateLimitType) {
        const rateLimitResult = await rateLimitAndCircuitBreaker.getRateLimiter().consume(
          `tool:${name}`,
          tool.rateLimitType,
          1
        );

        if (!rateLimitResult.success) {
          const error = new Error(`Rate limit exceeded. Try again in ${Math.ceil(rateLimitResult.msBeforeNext / 1000)} seconds`);
          
          if (isPullRequestTool && requestId) {
            pullRequestLoggingService.logError(name, { requestId }, error);
          }
          
          throw error;
        }
        
        rateLimitRemaining = rateLimitResult.remainingPoints;
      }

      // Execute tool with error handling
      const executeTool = async () => {
        const result = await tool.handler(args);
        
        // Cache result if applicable
        if (this.config.enableCaching && tool.cacheKey) {
          const cacheKey = tool.cacheKey(args);
          if (cacheKey) {
            const ttl = tool.cacheTTL || this.config.defaultCacheTTL;
            await cache.set(cacheKey, result, ttl);
            logger.debug('Tool result cached', { 
              tool: name, 
              cacheKey, 
              ttl 
            });
            
            if (isPullRequestTool && requestId) {
              pullRequestLoggingService.logCache(name, { requestId }, { cacheKey, ttl, action: 'set' });
            }
          }
        }
        
        return result;
      };

      let result: any;
      if (this.config.enableErrorHandling && context) {
        result = await errorHandlerService.executeWithErrorHandling(executeTool, context);
      } else {
        result = await executeTool();
      }

      // Log successful operation
      if (isPullRequestTool && requestId) {
        const duration = Date.now() - startTime;
        pullRequestLoggingService.logOperationEnd(
          name,
          requestId,
          logContext!,
          result,
          { duration, statusCode: 200 }
        );
        
        pullRequestLoggingService.logPerformance(name, { requestId }, {
          duration,
          statusCode: 200,
          cacheHit,
          rateLimitRemaining
        });
      }

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log error for pull request tools
      if (isPullRequestTool && requestId) {
        pullRequestLoggingService.logError(name, { requestId }, error as Error);
        pullRequestLoggingService.logPerformance(name, { requestId }, {
          duration,
          statusCode: 500,
          cacheHit: cacheHit || false,
          rateLimitRemaining: rateLimitRemaining || 0
        });
      }
      
      logger.error('Tool execution failed', {
        tool: name,
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: context?.requestId || requestId
      });
      throw error;
    }
  }

  /**
   * Get tool handler by name
   */
  public getTool(name: string): ToolHandler | undefined {
    return this.tools.get(name);
  }

  /**
   * Check if tool exists
   */
  public hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Get all tool names
   */
  public getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Get tools by category
   */
  public getToolsByCategory(category: string): Tool[] {
    return this.getTools().filter(tool => 
      tool.name.includes(category)
    );
  }

  /**
   * Get pull request tools specifically
   */
  public getPullRequestTools(): Tool[] {
    return this.getToolsByCategory('pull_request');
  }

  /**
   * Get registry statistics
   */
  public getStats(): any {
    const pullRequestTools = this.getPullRequestTools();
    
    return {
      totalTools: this.tools.size,
      pullRequestTools: pullRequestTools.length,
      categories: {
        crud: pullRequestTools.filter(t => t.name.includes('create') || t.name.includes('get') || t.name.includes('update') || t.name.includes('delete') || t.name.includes('list')).length,
        comments: pullRequestTools.filter(t => t.name.includes('comment')).length,
        analysis: pullRequestTools.filter(t => t.name.includes('activity') || t.name.includes('diff') || t.name.includes('changes')).length,
        operations: pullRequestTools.filter(t => t.name.includes('merge') || t.name.includes('decline') || t.name.includes('reopen')).length
      },
      config: this.config
    };
  }

  /**
   * Clear cache for a specific tool
   */
  public async clearToolCache(toolName: string, args?: any): Promise<void> {
    const tool = this.tools.get(toolName);
    if (tool && tool.cacheKey && args) {
      const cacheKey = tool.cacheKey(args);
      if (cacheKey) {
        await cache.delete(cacheKey);
        logger.debug('Tool cache cleared', { tool: toolName, cacheKey });
      }
    }
  }

  /**
   * Clear all tool caches
   */
  public async clearAllCaches(): Promise<void> {
    await cache.clear();
    logger.info('All tool caches cleared');
  }

  /**
   * Check if tool is a pull request tool
   */
  private isPullRequestTool(toolName: string): boolean {
    return toolName.includes('pull_request');
  }

  /**
   * Check if tool is an Issues tool
   */
  private isIssuesTool(toolName: string): boolean {
    return toolName.includes('issues');
  }

  /**
   * Create Issues handler wrapper
   */
  private createIssuesHandler(toolName: string): (args: any) => Promise<any> {
    return async (args: any) => {
      if (!this.issuesHandlers) {
        throw new Error('Issues handlers not initialized');
      }

      // Map tool names to handler methods
      const handlerMap: { [key: string]: string } = {
        'mcp_bitbucket_issues_create': 'handleCreateIssue',
        'mcp_bitbucket_issues_get': 'handleGetIssue',
        'mcp_bitbucket_issues_update': 'handleUpdateIssue',
        'mcp_bitbucket_issues_delete': 'handleDeleteIssue',
        'mcp_bitbucket_issues_search': 'handleSearchIssues',
        'mcp_bitbucket_issues_list': 'handleListIssues',
        'mcp_bitbucket_issues_get_transitions': 'handleGetTransitions',
        'mcp_bitbucket_issues_transition': 'handleTransitionIssue',
        'mcp_bitbucket_issues_get_comments': 'handleGetComments',
        'mcp_bitbucket_issues_create_comment': 'handleCreateComment',
        'mcp_bitbucket_issues_update_comment': 'handleUpdateComment',
        'mcp_bitbucket_issues_delete_comment': 'handleDeleteComment',
        'mcp_bitbucket_issues_get_relationships': 'handleGetRelationships',
        'mcp_bitbucket_issues_create_relationship': 'handleCreateRelationship',
        'mcp_bitbucket_issues_delete_relationship': 'handleDeleteRelationship',
        'mcp_bitbucket_issues_get_attachments': 'handleGetAttachments',
        'mcp_bitbucket_issues_upload_attachment': 'handleUploadAttachment',
        'mcp_bitbucket_issues_delete_attachment': 'handleDeleteAttachment'
      };

      const handlerMethod = handlerMap[toolName];
      if (!handlerMethod) {
        throw new Error(`Unknown Issues tool: ${toolName}`);
      }

      const handler = (this.issuesHandlers as any)[handlerMethod];
      if (typeof handler !== 'function') {
        throw new Error(`Handler method ${handlerMethod} not found`);
      }

      return await handler.call(this.issuesHandlers, args);
    };
  }

  /**
   * Get rate limit type for Issues tools
   */
  private getIssuesRateLimitType(toolName: string): 'api:light' | 'api:heavy' | 'api:bulk' {
    if (toolName.includes('create') || toolName.includes('update') || toolName.includes('delete') || toolName.includes('transition') || toolName.includes('upload')) {
      return 'api:heavy';
    }
    if (toolName.includes('search') || toolName.includes('list')) {
      return 'api:bulk';
    }
    return 'api:light';
  }

  /**
   * Get cache key for Issues tools
   */
  private getIssuesCacheKey(toolName: string): ((args: any) => string) | undefined {
    if (toolName.includes('create') || toolName.includes('update') || toolName.includes('delete') || toolName.includes('transition') || toolName.includes('upload')) {
      return undefined; // No caching for write operations
    }

    return (args: any) => {
      if (toolName.includes('get') && args.issueId) {
        return `issue:${args.issueId}`;
      }
      if (toolName.includes('search') || toolName.includes('list')) {
        const params = Object.keys(args).sort().map(key => `${key}:${args[key]}`).join('|');
        return `issues:search:${params}`;
      }
      if (toolName.includes('transitions') && args.issueId) {
        return `issue:${args.issueId}:transitions`;
      }
      if (toolName.includes('comments') && args.issueId) {
        return `issue:${args.issueId}:comments`;
      }
      if (toolName.includes('relationships') && args.issueId) {
        return `issue:${args.issueId}:relationships`;
      }
      if (toolName.includes('attachments') && args.issueId) {
        return `issue:${args.issueId}:attachments`;
      }
      return '';
    };
  }

  /**
   * Get cache TTL for Issues tools
   */
  private getIssuesCacheTTL(toolName: string): number {
    if (toolName.includes('get') && toolName.includes('issue')) {
      return 60; // 1 minute for individual issues
    }
    if (toolName.includes('search') || toolName.includes('list')) {
      return 120; // 2 minutes for searches and lists
    }
    if (toolName.includes('transitions')) {
      return 300; // 5 minutes for transitions
    }
    if (toolName.includes('comments') || toolName.includes('relationships') || toolName.includes('attachments')) {
      return 180; // 3 minutes for related data
    }
    return 60; // Default 1 minute
  }

  /**
   * Authenticate for pull request tool execution
   */
  private async authenticateForPullRequestTool(toolName: string, args: any): Promise<void> {
    try {
      // Determine authentication method from token type
      const authMethod = this.determineAuthMethod(args.tokenType);
      
      const authRequest: AuthenticationRequest = {
        serverUrl: args.serverUrl,
        method: authMethod,
        credentials: this.buildCredentials(args, authMethod)
      };

      const authResult = await pullRequestAuthService.authenticate(authRequest);
      
      if (!authResult.success) {
        throw new Error(`Authentication failed for ${toolName}: ${authResult.error}`);
      }

      // Update args with authenticated token
      args.accessToken = authResult.token;
      args.tokenType = authResult.tokenType;

      logger.debug('Pull request tool authenticated', {
        tool: toolName,
        method: authResult.method,
        serverUrl: args.serverUrl
      });

    } catch (error) {
      logger.error('Pull request tool authentication failed', {
        tool: toolName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Determine authentication method from token type
   */
  private determineAuthMethod(tokenType: string): AuthenticationMethod {
    switch (tokenType?.toLowerCase()) {
      case 'bearer':
        return 'personal_token';
      case 'basic':
        return 'basic_auth';
      case 'oauth':
      case 'oauth2':
        return 'oauth2';
      default:
        return 'personal_token'; // Default fallback
    }
  }

  /**
   * Build credentials object for authentication
   */
  private buildCredentials(args: any, method: AuthenticationMethod): any {
    switch (method) {
      case 'oauth2':
        return {
          clientId: args.clientId,
          clientSecret: args.clientSecret,
          authorizationCode: args.authorizationCode,
          redirectUri: args.redirectUri
        };
      case 'personal_token':
        return {
          token: args.accessToken
        };
      case 'app_password':
      case 'basic_auth':
        return {
          username: args.username,
          password: args.password
        };
      default:
        return {};
    }
  }
}

// Export singleton instance
export const toolRegistry = new ToolRegistry();
