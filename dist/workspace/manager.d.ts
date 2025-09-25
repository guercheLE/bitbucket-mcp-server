/**
 * Workspace Manager Service
 *
 * Central service for managing multiple Bitbucket workspaces in the MCP server.
 * Handles workspace registration, configuration, health monitoring, and cross-workspace operations.
 */
import { EventEmitter } from 'events';
import { WorkspaceConfig, WorkspaceContext, WorkspaceOperationResult, WorkspaceQueryParams, WorkspaceRegistrationParams, WorkspaceStatistics, WorkspaceSummary, WorkspaceUpdateParams } from './types.js';
/**
 * Workspace Manager Events
 */
export declare enum WorkspaceManagerEvents {
    WORKSPACE_ADDED = "workspace_added",
    WORKSPACE_UPDATED = "workspace_updated",
    WORKSPACE_REMOVED = "workspace_removed",
    WORKSPACE_STATUS_CHANGED = "workspace_status_changed",
    HEALTH_CHECK_COMPLETED = "health_check_completed",
    ERROR_OCCURRED = "error_occurred"
}
/**
 * Workspace Manager Configuration
 */
export interface WorkspaceManagerConfig {
    maxWorkspaces?: number;
    healthCheckInterval?: number;
    autoHealthCheck?: boolean;
    persistentStorage?: boolean;
    storageLocation?: string;
    defaultTimeout?: number;
    rateLimitWindow?: number;
}
/**
 * Workspace Storage Interface
 */
export interface WorkspaceStorage {
    load(): Promise<WorkspaceConfig[]>;
    save(workspaces: WorkspaceConfig[]): Promise<void>;
    loadWorkspace(id: string): Promise<WorkspaceConfig | null>;
    saveWorkspace(workspace: WorkspaceConfig): Promise<void>;
    deleteWorkspace(id: string): Promise<void>;
    exists(id: string): Promise<boolean>;
}
/**
 * Workspace Manager Service
 *
 * Provides comprehensive workspace management capabilities including:
 * - Workspace registration and configuration
 * - Health monitoring and status tracking
 * - Cross-workspace operations coordination
 * - Event-driven workspace lifecycle management
 */
export declare class WorkspaceManager extends EventEmitter {
    private workspaces;
    private healthCheckInterval;
    private storage;
    private config;
    private initialized;
    constructor(config?: WorkspaceManagerConfig, storage?: WorkspaceStorage);
    /**
     * Initialize the workspace manager
     */
    initialize(): Promise<void>;
    /**
     * Shutdown the workspace manager
     */
    shutdown(): Promise<void>;
    /**
     * Register a new workspace
     */
    registerWorkspace(params: WorkspaceRegistrationParams): Promise<WorkspaceOperationResult<WorkspaceConfig>>;
    /**
     * Update an existing workspace
     */
    updateWorkspace(workspaceId: string, updates: WorkspaceUpdateParams): Promise<WorkspaceOperationResult<WorkspaceConfig>>;
    /**
     * Remove a workspace
     */
    removeWorkspace(workspaceId: string): Promise<WorkspaceOperationResult<void>>;
    /**
     * Get a workspace by ID
     */
    getWorkspace(workspaceId: string): WorkspaceConfig | null;
    /**
     * Get all workspaces
     */
    getAllWorkspaces(): WorkspaceConfig[];
    /**
     * Query workspaces with filtering and pagination
     */
    queryWorkspaces(params?: WorkspaceQueryParams): WorkspaceConfig[];
    /**
     * Find workspace by slug
     */
    findWorkspaceBySlug(slug: string): WorkspaceConfig | null;
    /**
     * Get workspace summaries
     */
    getWorkspaceSummaries(): WorkspaceSummary[];
    /**
     * Start health monitoring
     */
    private startHealthMonitoring;
    /**
     * Perform health checks on all workspaces
     */
    performHealthChecks(): Promise<void>;
    /**
     * Perform health check on a specific workspace
     */
    private performWorkspaceHealthCheck;
    /**
     * Check workspace health (placeholder implementation)
     */
    private checkWorkspaceHealth;
    /**
     * Create workspace context for tool execution
     */
    createWorkspaceContext(workspaceId: string, requestId?: string): WorkspaceContext | null;
    /**
     * Get workspace statistics (placeholder implementation)
     */
    getWorkspaceStatistics(workspaceId: string): Promise<WorkspaceStatistics | null>;
    /**
     * Generate a workspace ID from slug
     */
    private generateWorkspaceId;
    /**
     * Generate a request ID
     */
    private generateRequestId;
    /**
     * Create a workspace error
     */
    private createWorkspaceError;
    /**
     * Handle errors and convert to WorkspaceError
     */
    private handleError;
    /**
     * Get the number of registered workspaces
     */
    get workspaceCount(): number;
    /**
     * Check if workspace manager is initialized
     */
    get isInitialized(): boolean;
    /**
     * Get configuration
     */
    get configuration(): Readonly<Required<WorkspaceManagerConfig>>;
}
//# sourceMappingURL=manager.d.ts.map