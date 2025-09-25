/**
 * Workspace Context Provider
 * 
 * Provides workspace context and utilities for MCP tool execution.
 * Handles workspace resolution, authentication context, and request tracking.
 */

import {
  WorkspaceConfig,
  WorkspaceStatus,
  WorkspaceContext,
  CrossWorkspaceContext,
  WorkspaceError,
  WorkspaceErrorType,
} from './types.js';
import { WorkspaceManager } from './manager.js';

/**
 * Context Provider Configuration
 */
export interface ContextProviderConfig {
  defaultWorkspaceId?: string;
  allowCrossWorkspace?: boolean;
  maxCrossWorkspaceTargets?: number;
  contextCacheTtl?: number;
  trackingEnabled?: boolean;
}

/**
 * Request Context Information
 */
export interface RequestContext {
  requestId: string;
  timestamp: string;
  userId?: string;
  toolName?: string;
  parameters?: Record<string, unknown>;
  workspaceIds: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Context Resolution Result
 */
export interface ContextResolutionResult {
  success: boolean;
  context?: WorkspaceContext | CrossWorkspaceContext;
  error?: WorkspaceError;
  resolvedWorkspaces: WorkspaceConfig[];
  requestId: string;
  timestamp: string;
}

/**
 * Workspace Context Provider
 * 
 * Provides workspace context resolution and management for MCP tool execution.
 * Handles single workspace and cross-workspace operation contexts.
 */
export class WorkspaceContextProvider {
  private workspaceManager: WorkspaceManager;
  private config: Required<ContextProviderConfig>;
  private contextCache = new Map<string, { context: WorkspaceContext; expires: number }>();
  private requestHistory: RequestContext[] = [];

  constructor(workspaceManager: WorkspaceManager, config: ContextProviderConfig = {}) {
    this.workspaceManager = workspaceManager;
    this.config = {
      defaultWorkspaceId: config.defaultWorkspaceId || '',
      allowCrossWorkspace: config.allowCrossWorkspace ?? true,
      maxCrossWorkspaceTargets: config.maxCrossWorkspaceTargets ?? 10,
      contextCacheTtl: config.contextCacheTtl ?? 300000, // 5 minutes
      trackingEnabled: config.trackingEnabled ?? true,
    };

    // Clean up context cache periodically
    setInterval(() => {
      this.cleanupContextCache();
    }, 60000); // Every minute
  }

  // ============================================================================
  // Context Resolution
  // ============================================================================

  /**
   * Resolve workspace context for tool execution
   */
  async resolveContext(
    workspaceIdOrSlug?: string,
    requestId?: string,
    toolName?: string,
    parameters?: Record<string, unknown>
  ): Promise<ContextResolutionResult> {
    const timestamp = new Date().toISOString();
    const resolvedRequestId = requestId || this.generateRequestId();

    try {
      // Determine workspace to use
      const targetWorkspaceId = workspaceIdOrSlug || this.config.defaultWorkspaceId;
      if (!targetWorkspaceId) {
        throw this.createContextError(
          WorkspaceErrorType.WORKSPACE_NOT_FOUND,
          'No workspace specified and no default workspace configured'
        );
      }

      // Resolve workspace
      const workspace = await this.resolveWorkspace(targetWorkspaceId);

      // Validate workspace status
      if (workspace.status === WorkspaceStatus.INACTIVE || workspace.status === WorkspaceStatus.DISCONNECTED) {
        throw this.createContextError(
          WorkspaceErrorType.WORKSPACE_UNAVAILABLE,
          `Workspace '${workspace.name}' is not available (status: ${workspace.status})`,
          workspace.id
        );
      }

      if (workspace.status === WorkspaceStatus.ERROR) {
        throw this.createContextError(
          WorkspaceErrorType.WORKSPACE_UNAVAILABLE,
          `Workspace '${workspace.name}' is in error state`,
          workspace.id
        );
      }

      // Create workspace context
      const context = await this.createWorkspaceContext(workspace, resolvedRequestId);

      // Track request if enabled
      if (this.config.trackingEnabled) {
        this.trackRequest({
          requestId: resolvedRequestId,
          timestamp,
          toolName,
          parameters,
          workspaceIds: [workspace.id],
        });
      }

      return {
        success: true,
        context,
        resolvedWorkspaces: [workspace],
        requestId: resolvedRequestId,
        timestamp,
      };
    } catch (error) {
      const workspaceError = this.handleError(error, 'Failed to resolve workspace context');
      
      return {
        success: false,
        error: workspaceError,
        resolvedWorkspaces: [],
        requestId: resolvedRequestId,
        timestamp,
      };
    }
  }

  /**
   * Resolve cross-workspace context for multi-workspace operations
   */
  async resolveCrossWorkspaceContext(
    workspaceIdsOrSlugs: string[],
    aggregateResults = true,
    requestId?: string,
    toolName?: string,
    parameters?: Record<string, unknown>
  ): Promise<ContextResolutionResult> {
    const timestamp = new Date().toISOString();
    const resolvedRequestId = requestId || this.generateRequestId();

    try {
      // Check if cross-workspace operations are allowed
      if (!this.config.allowCrossWorkspace) {
        throw this.createContextError(
          WorkspaceErrorType.PERMISSION_DENIED,
          'Cross-workspace operations are not allowed'
        );
      }

      // Validate target count
      if (workspaceIdsOrSlugs.length > this.config.maxCrossWorkspaceTargets) {
        throw this.createContextError(
          WorkspaceErrorType.INVALID_CONFIGURATION,
          `Too many workspace targets. Maximum allowed: ${this.config.maxCrossWorkspaceTargets}`
        );
      }

      if (workspaceIdsOrSlugs.length === 0) {
        throw this.createContextError(
          WorkspaceErrorType.INVALID_CONFIGURATION,
          'No workspace targets specified for cross-workspace operation'
        );
      }

      // Resolve all workspaces
      const resolvedWorkspaces: WorkspaceConfig[] = [];
      const errors: WorkspaceError[] = [];

      for (const workspaceIdOrSlug of workspaceIdsOrSlugs) {
        try {
          const workspace = await this.resolveWorkspace(workspaceIdOrSlug);
          
          // Check workspace status
          if (workspace.status === WorkspaceStatus.ACTIVE || workspace.status === WorkspaceStatus.CONFIGURING) {
            // Only include workspaces that support cross-workspace operations
            if (workspace.features.crossWorkspaceOperations) {
              resolvedWorkspaces.push(workspace);
            } else {
              errors.push(this.createContextError(
                WorkspaceErrorType.PERMISSION_DENIED,
                `Workspace '${workspace.name}' does not support cross-workspace operations`,
                workspace.id
              ));
            }
          } else {
            errors.push(this.createContextError(
              WorkspaceErrorType.WORKSPACE_UNAVAILABLE,
              `Workspace '${workspace.name}' is not available (status: ${workspace.status})`,
              workspace.id
            ));
          }
        } catch (error) {
          errors.push(this.handleError(error, `Failed to resolve workspace: ${workspaceIdOrSlug}`));
        }
      }

      // Check if we have any valid workspaces
      if (resolvedWorkspaces.length === 0) {
        throw this.createContextError(
          WorkspaceErrorType.WORKSPACE_UNAVAILABLE,
          'No valid workspaces available for cross-workspace operation',
          undefined,
          { errors }
        );
      }

      // Create cross-workspace context
      const context: CrossWorkspaceContext = {
        workspaceIds: resolvedWorkspaces.map(w => w.id),
        workspaces: resolvedWorkspaces,
        aggregateResults,
        requestId: resolvedRequestId,
        timestamp,
      };

      // Track request if enabled
      if (this.config.trackingEnabled) {
        this.trackRequest({
          requestId: resolvedRequestId,
          timestamp,
          toolName,
          parameters,
          workspaceIds: context.workspaceIds,
        });
      }

      return {
        success: true,
        context,
        resolvedWorkspaces,
        requestId: resolvedRequestId,
        timestamp,
      };
    } catch (error) {
      const workspaceError = this.handleError(error, 'Failed to resolve cross-workspace context');
      
      return {
        success: false,
        error: workspaceError,
        resolvedWorkspaces: [],
        requestId: resolvedRequestId,
        timestamp,
      };
    }
  }

  // ============================================================================
  // Context Management
  // ============================================================================

  /**
   * Create workspace context with caching
   */
  private async createWorkspaceContext(
    workspace: WorkspaceConfig,
    requestId: string
  ): Promise<WorkspaceContext> {
    const cacheKey = workspace.id;
    const now = Date.now();

    // Check cache first
    const cached = this.contextCache.get(cacheKey);
    if (cached && cached.expires > now) {
      return {
        ...cached.context,
        requestId,
        timestamp: new Date().toISOString(),
      };
    }

    // Create new context
    const context: WorkspaceContext = {
      workspaceId: workspace.id,
      workspace,
      requestId,
      timestamp: new Date().toISOString(),
    };

    // Add to cache
    this.contextCache.set(cacheKey, {
      context,
      expires: now + this.config.contextCacheTtl,
    });

    return context;
  }

  /**
   * Invalidate cached context for a workspace
   */
  invalidateContext(workspaceId: string): void {
    this.contextCache.delete(workspaceId);
  }

  /**
   * Clear all cached contexts
   */
  clearContextCache(): void {
    this.contextCache.clear();
  }

  /**
   * Clean up expired contexts from cache
   */
  private cleanupContextCache(): void {
    const now = Date.now();
    for (const [key, value] of this.contextCache.entries()) {
      if (value.expires <= now) {
        this.contextCache.delete(key);
      }
    }
  }

  // ============================================================================
  // Workspace Resolution
  // ============================================================================

  /**
   * Resolve workspace by ID or slug
   */
  private async resolveWorkspace(workspaceIdOrSlug: string): Promise<WorkspaceConfig> {
    // Try to get by ID first
    let workspace = this.workspaceManager.getWorkspace(workspaceIdOrSlug);
    
    // If not found, try to find by slug
    if (!workspace) {
      workspace = this.workspaceManager.findWorkspaceBySlug(workspaceIdOrSlug);
    }

    if (!workspace) {
      throw this.createContextError(
        WorkspaceErrorType.WORKSPACE_NOT_FOUND,
        `Workspace not found: ${workspaceIdOrSlug}`
      );
    }

    return workspace;
  }

  /**
   * Get default workspace
   */
  getDefaultWorkspace(): WorkspaceConfig | null {
    if (!this.config.defaultWorkspaceId) {
      return null;
    }
    return this.workspaceManager.getWorkspace(this.config.defaultWorkspaceId);
  }

  /**
   * Set default workspace
   */
  setDefaultWorkspace(workspaceId: string): boolean {
    const workspace = this.workspaceManager.getWorkspace(workspaceId);
    if (workspace) {
      this.config.defaultWorkspaceId = workspaceId;
      return true;
    }
    return false;
  }

  // ============================================================================
  // Request Tracking
  // ============================================================================

  /**
   * Track a request
   */
  private trackRequest(request: RequestContext): void {
    if (!this.config.trackingEnabled) {
      return;
    }

    this.requestHistory.push(request);

    // Keep only the last 1000 requests
    if (this.requestHistory.length > 1000) {
      this.requestHistory.shift();
    }
  }

  /**
   * Get request history
   */
  getRequestHistory(limit = 100): RequestContext[] {
    return this.requestHistory.slice(-limit).reverse(); // Most recent first
  }

  /**
   * Get requests for a specific workspace
   */
  getWorkspaceRequests(workspaceId: string, limit = 100): RequestContext[] {
    return this.requestHistory
      .filter(req => req.workspaceIds.includes(workspaceId))
      .slice(-limit)
      .reverse();
  }

  /**
   * Clear request history
   */
  clearRequestHistory(): void {
    this.requestHistory.length = 0;
  }

  // ============================================================================
  // Context Validation
  // ============================================================================

  /**
   * Validate workspace context
   */
  validateWorkspaceContext(context: WorkspaceContext): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!context.workspaceId) {
      errors.push('Missing workspace ID');
    }

    if (!context.workspace) {
      errors.push('Missing workspace configuration');
    } else {
      // Validate workspace status
      if (context.workspace.status === WorkspaceStatus.INACTIVE) {
        errors.push('Workspace is inactive');
      }
      if (context.workspace.status === WorkspaceStatus.ERROR) {
        errors.push('Workspace is in error state');
      }
      if (context.workspace.status === WorkspaceStatus.DISCONNECTED) {
        errors.push('Workspace is disconnected');
      }
    }

    if (!context.requestId) {
      errors.push('Missing request ID');
    }

    if (!context.timestamp) {
      errors.push('Missing timestamp');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate cross-workspace context
   */
  validateCrossWorkspaceContext(context: CrossWorkspaceContext): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!context.workspaceIds || context.workspaceIds.length === 0) {
      errors.push('Missing workspace IDs');
    }

    if (!context.workspaces || context.workspaces.length === 0) {
      errors.push('Missing workspace configurations');
    }

    if (context.workspaceIds.length !== context.workspaces.length) {
      errors.push('Mismatch between workspace IDs and configurations');
    }

    if (!this.config.allowCrossWorkspace) {
      errors.push('Cross-workspace operations not allowed');
    }

    if (context.workspaceIds.length > this.config.maxCrossWorkspaceTargets) {
      errors.push(`Too many workspace targets (max: ${this.config.maxCrossWorkspaceTargets})`);
    }

    // Validate each workspace supports cross-workspace operations
    for (const workspace of context.workspaces) {
      if (!workspace.features.crossWorkspaceOperations) {
        errors.push(`Workspace '${workspace.name}' does not support cross-workspace operations`);
      }
    }

    if (!context.requestId) {
      errors.push('Missing request ID');
    }

    if (!context.timestamp) {
      errors.push('Missing timestamp');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Generate a request ID
   */
  private generateRequestId(): string {
    return `ctx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Create a context error
   */
  private createContextError(
    type: WorkspaceErrorType,
    message: string,
    workspaceId?: string,
    details?: Record<string, unknown>
  ): WorkspaceError {
    const error: WorkspaceError = {
      name: 'WorkspaceContextError',
      message,
      type,
      workspaceId,
      details,
    };
    return error;
  }

  /**
   * Handle errors and convert to WorkspaceError
   */
  private handleError(error: unknown, context: string): WorkspaceError {
    if (error instanceof Error && 'type' in error) {
      return error as WorkspaceError;
    }

    if (error instanceof Error) {
      return this.createContextError(
        WorkspaceErrorType.INVALID_CONFIGURATION,
        `${context}: ${error.message}`,
        undefined,
        { originalError: error }
      );
    }

    return this.createContextError(
      WorkspaceErrorType.INVALID_CONFIGURATION,
      `${context}: Unknown error`,
      undefined,
      { originalError: error }
    );
  }

  // ============================================================================
  // Statistics and Monitoring
  // ============================================================================

  /**
   * Get context provider statistics
   */
  getStatistics(): {
    cacheSize: number;
    requestHistorySize: number;
    defaultWorkspaceId?: string;
    allowCrossWorkspace: boolean;
    maxCrossWorkspaceTargets: number;
    contextCacheTtl: number;
  } {
    return {
      cacheSize: this.contextCache.size,
      requestHistorySize: this.requestHistory.length,
      defaultWorkspaceId: this.config.defaultWorkspaceId || undefined,
      allowCrossWorkspace: this.config.allowCrossWorkspace,
      maxCrossWorkspaceTargets: this.config.maxCrossWorkspaceTargets,
      contextCacheTtl: this.config.contextCacheTtl,
    };
  }

  /**
   * Get workspace usage statistics
   */
  getWorkspaceUsageStats(): Record<string, {
    workspaceId: string;
    workspaceName: string;
    requestCount: number;
    lastUsed?: string;
    isDefault: boolean;
  }> {
    const stats: Record<string, {
      workspaceId: string;
      workspaceName: string;
      requestCount: number;
      lastUsed?: string;
      isDefault: boolean;
    }> = {};

    // Initialize stats for all workspaces
    for (const workspace of this.workspaceManager.getAllWorkspaces()) {
      stats[workspace.id] = {
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        requestCount: 0,
        isDefault: workspace.id === this.config.defaultWorkspaceId,
      };
    }

    // Count requests and find last used
    for (const request of this.requestHistory) {
      for (const workspaceId of request.workspaceIds) {
        if (stats[workspaceId]) {
          stats[workspaceId].requestCount++;
          if (!stats[workspaceId].lastUsed || request.timestamp > stats[workspaceId].lastUsed!) {
            stats[workspaceId].lastUsed = request.timestamp;
          }
        }
      }
    }

    return stats;
  }

  /**
   * Get configuration
   */
  getConfig(): Readonly<Required<ContextProviderConfig>> {
    return { ...this.config };
  }
}