/**
 * Workspace Context Provider
 *
 * Provides workspace context and utilities for MCP tool execution.
 * Handles workspace resolution, authentication context, and request tracking.
 */
import { WorkspaceManager } from './manager.js';
import { CrossWorkspaceContext, WorkspaceConfig, WorkspaceContext, WorkspaceError } from './types.js';
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
export declare class WorkspaceContextProvider {
    private workspaceManager;
    private config;
    private contextCache;
    private requestHistory;
    constructor(workspaceManager: WorkspaceManager, config?: ContextProviderConfig);
    /**
     * Resolve workspace context for tool execution
     */
    resolveContext(workspaceIdOrSlug?: string, requestId?: string, toolName?: string, parameters?: Record<string, unknown>): Promise<ContextResolutionResult>;
    /**
     * Resolve cross-workspace context for multi-workspace operations
     */
    resolveCrossWorkspaceContext(workspaceIdsOrSlugs: string[], aggregateResults?: boolean, requestId?: string, toolName?: string, parameters?: Record<string, unknown>): Promise<ContextResolutionResult>;
    /**
     * Create workspace context with caching
     */
    private createWorkspaceContext;
    /**
     * Invalidate cached context for a workspace
     */
    invalidateContext(workspaceId: string): void;
    /**
     * Clear all cached contexts
     */
    clearContextCache(): void;
    /**
     * Clean up expired contexts from cache
     */
    private cleanupContextCache;
    /**
     * Resolve workspace by ID or slug
     */
    private resolveWorkspace;
    /**
     * Get default workspace
     */
    getDefaultWorkspace(): WorkspaceConfig | null;
    /**
     * Set default workspace
     */
    setDefaultWorkspace(workspaceId: string): boolean;
    /**
     * Track a request
     */
    private trackRequest;
    /**
     * Get request history
     */
    getRequestHistory(limit?: number): RequestContext[];
    /**
     * Get requests for a specific workspace
     */
    getWorkspaceRequests(workspaceId: string, limit?: number): RequestContext[];
    /**
     * Clear request history
     */
    clearRequestHistory(): void;
    /**
     * Validate workspace context
     */
    validateWorkspaceContext(context: WorkspaceContext): {
        isValid: boolean;
        errors: string[];
    };
    /**
     * Validate cross-workspace context
     */
    validateCrossWorkspaceContext(context: CrossWorkspaceContext): {
        isValid: boolean;
        errors: string[];
    };
    /**
     * Generate a request ID
     */
    private generateRequestId;
    /**
     * Create a context error
     */
    private createContextError;
    /**
     * Handle errors and convert to WorkspaceError
     */
    private handleError;
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
    };
    /**
     * Get workspace usage statistics
     */
    getWorkspaceUsageStats(): Record<string, {
        workspaceId: string;
        workspaceName: string;
        requestCount: number;
        lastUsed?: string;
        isDefault: boolean;
    }>;
    /**
     * Get configuration
     */
    getConfig(): Readonly<Required<ContextProviderConfig>>;
}
//# sourceMappingURL=context.d.ts.map