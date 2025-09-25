/**
 * Workspace Manager Service
 * 
 * Central service for managing multiple Bitbucket workspaces in the MCP server.
 * Handles workspace registration, configuration, health monitoring, and cross-workspace operations.
 */

import { EventEmitter } from 'events';
import {
  WorkspaceConfig,
  WorkspaceConfigSchema,
  WorkspaceRegistrationParams,
  WorkspaceRegistrationSchema,
  WorkspaceUpdateParams,
  WorkspaceUpdateSchema,
  WorkspaceQueryParams,
  WorkspaceQuerySchema,
  WorkspaceStatus,
  WorkspacePriority,
  WorkspaceError,
  WorkspaceErrorType,
  WorkspaceOperationResult,
  WorkspaceSummary,
  WorkspaceStatistics,
  WorkspaceContext,
  WorkspaceHealthStatus,
  isWorkspaceConfig,
  MAX_WORKSPACES,
  DEFAULT_HEALTH_CHECK_INTERVAL,
  WORKSPACE_ID_PATTERN,
} from './types.js';

/**
 * Workspace Manager Events
 */
export enum WorkspaceManagerEvents {
  WORKSPACE_ADDED = 'workspace_added',
  WORKSPACE_UPDATED = 'workspace_updated',
  WORKSPACE_REMOVED = 'workspace_removed',
  WORKSPACE_STATUS_CHANGED = 'workspace_status_changed',
  HEALTH_CHECK_COMPLETED = 'health_check_completed',
  ERROR_OCCURRED = 'error_occurred',
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
export class WorkspaceManager extends EventEmitter {
  private workspaces = new Map<string, WorkspaceConfig>();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private storage: WorkspaceStorage | null = null;
  private config: Required<WorkspaceManagerConfig>;
  private initialized = false;

  constructor(config: WorkspaceManagerConfig = {}, storage?: WorkspaceStorage) {
    super();
    
    this.config = {
      maxWorkspaces: config.maxWorkspaces ?? MAX_WORKSPACES,
      healthCheckInterval: config.healthCheckInterval ?? DEFAULT_HEALTH_CHECK_INTERVAL,
      autoHealthCheck: config.autoHealthCheck ?? true,
      persistentStorage: config.persistentStorage ?? false,
      storageLocation: config.storageLocation ?? './workspaces.json',
      defaultTimeout: config.defaultTimeout ?? 30000,
      rateLimitWindow: config.rateLimitWindow ?? 60000,
    };

    this.storage = storage || null;
    
    // Set up error handling
    this.on('error', (error) => {
      console.error('WorkspaceManager error:', error);
    });
  }

  // ============================================================================
  // Lifecycle Management
  // ============================================================================

  /**
   * Initialize the workspace manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Load existing workspaces if storage is configured
      if (this.storage) {
        const workspaces = await this.storage.load();
        for (const workspace of workspaces) {
          if (isWorkspaceConfig(workspace)) {
            this.workspaces.set(workspace.id, workspace);
          }
        }
        console.log(`Loaded ${workspaces.length} workspaces from storage`);
      }

      // Start health monitoring if enabled
      if (this.config.autoHealthCheck) {
        this.startHealthMonitoring();
      }

      this.initialized = true;
      console.log('WorkspaceManager initialized successfully');
    } catch (error) {
      const workspaceError: WorkspaceError = {
        name: 'WorkspaceManagerInitError',
        message: `Failed to initialize workspace manager: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: WorkspaceErrorType.INVALID_CONFIGURATION,
        details: { originalError: error },
      };
      this.emit(WorkspaceManagerEvents.ERROR_OCCURRED, workspaceError);
      throw workspaceError;
    }
  }

  /**
   * Shutdown the workspace manager
   */
  async shutdown(): Promise<void> {
    try {
      // Stop health monitoring
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
      }

      // Save workspaces if storage is configured
      if (this.storage && this.workspaces.size > 0) {
        const workspaceArray = Array.from(this.workspaces.values());
        await this.storage.save(workspaceArray);
        console.log(`Saved ${workspaceArray.length} workspaces to storage`);
      }

      // Mark all workspaces as disconnected
      for (const [id, workspace] of this.workspaces) {
        if (workspace.status !== WorkspaceStatus.DISCONNECTED) {
          workspace.status = WorkspaceStatus.DISCONNECTED;
          workspace.metadata.updatedAt = new Date().toISOString();
          this.workspaces.set(id, workspace);
        }
      }

      this.initialized = false;
      console.log('WorkspaceManager shutdown completed');
    } catch (error) {
      console.error('Error during workspace manager shutdown:', error);
      throw error;
    }
  }

  // ============================================================================
  // Workspace Registration and Management
  // ============================================================================

  /**
   * Register a new workspace
   */
  async registerWorkspace(params: WorkspaceRegistrationParams): Promise<WorkspaceOperationResult<WorkspaceConfig>> {
    const timestamp = new Date().toISOString();

    try {
      // Validate input parameters
      const validatedParams = WorkspaceRegistrationSchema.parse(params);

      // Check workspace limits
      if (this.workspaces.size >= this.config.maxWorkspaces) {
        throw this.createWorkspaceError(
          WorkspaceErrorType.INVALID_CONFIGURATION,
          `Maximum number of workspaces (${this.config.maxWorkspaces}) exceeded`,
          undefined,
          { currentCount: this.workspaces.size }
        );
      }

      // Generate workspace ID from slug
      const workspaceId = this.generateWorkspaceId(validatedParams.slug);

      // Check for existing workspace
      if (this.workspaces.has(workspaceId)) {
        throw this.createWorkspaceError(
          WorkspaceErrorType.WORKSPACE_ALREADY_EXISTS,
          `Workspace with ID '${workspaceId}' already exists`,
          workspaceId
        );
      }

      // Check for duplicate slug
      if (this.findWorkspaceBySlug(validatedParams.slug)) {
        throw this.createWorkspaceError(
          WorkspaceErrorType.WORKSPACE_ALREADY_EXISTS,
          `Workspace with slug '${validatedParams.slug}' already exists`,
          workspaceId
        );
      }

      // Create workspace configuration
      const workspaceConfig: WorkspaceConfig = {
        id: workspaceId,
        name: validatedParams.name,
        slug: validatedParams.slug,
        baseUrl: validatedParams.baseUrl,
        priority: WorkspacePriority.SECONDARY,
        authConfig: validatedParams.authConfig,
        features: {
          repositories: true,
          issues: true,
          pullRequests: true,
          pipelines: true,
          webhooks: false,
          analytics: true,
          search: true,
          crossWorkspaceOperations: false,
          ...validatedParams.features,
        },
        limits: {
          maxRepositories: 1000,
          maxConcurrentRequests: 10,
          requestsPerMinute: 100,
          maxResponseSize: 50 * 1024 * 1024,
          timeoutSeconds: 30,
          ...validatedParams.limits,
        },
        status: WorkspaceStatus.CONFIGURING,
        metadata: {
          createdAt: timestamp,
          updatedAt: timestamp,
          version: '1.0.0',
          tags: [],
          environment: 'production',
          ...validatedParams.metadata,
        },
      };

      // Validate the complete configuration
      const validatedConfig = WorkspaceConfigSchema.parse(workspaceConfig);

      // Store the workspace
      this.workspaces.set(workspaceId, validatedConfig);

      // Save to persistent storage if configured
      if (this.storage) {
        await this.storage.saveWorkspace(validatedConfig);
      }

      // Emit workspace added event
      this.emit(WorkspaceManagerEvents.WORKSPACE_ADDED, validatedConfig);

      return {
        success: true,
        data: validatedConfig,
        workspaceId,
        timestamp,
      };
    } catch (error) {
      const workspaceError = this.handleError(error, undefined, 'Failed to register workspace');
      return {
        success: false,
        error: workspaceError,
        timestamp,
      };
    }
  }

  /**
   * Update an existing workspace
   */
  async updateWorkspace(workspaceId: string, updates: WorkspaceUpdateParams): Promise<WorkspaceOperationResult<WorkspaceConfig>> {
    const timestamp = new Date().toISOString();

    try {
      // Validate input parameters
      const validatedUpdates = WorkspaceUpdateSchema.parse(updates);

      // Get existing workspace
      const existingWorkspace = this.workspaces.get(workspaceId);
      if (!existingWorkspace) {
        throw this.createWorkspaceError(
          WorkspaceErrorType.WORKSPACE_NOT_FOUND,
          `Workspace with ID '${workspaceId}' not found`,
          workspaceId
        );
      }

      // Create updated configuration
      const updatedConfig: WorkspaceConfig = {
        ...existingWorkspace,
        ...validatedUpdates,
        id: workspaceId, // Ensure ID cannot be changed
        metadata: {
          ...existingWorkspace.metadata,
          ...validatedUpdates.metadata,
          updatedAt: timestamp,
        },
      };

      // Validate the updated configuration
      const validatedConfig = WorkspaceConfigSchema.parse(updatedConfig);

      // Store the updated workspace
      this.workspaces.set(workspaceId, validatedConfig);

      // Save to persistent storage if configured
      if (this.storage) {
        await this.storage.saveWorkspace(validatedConfig);
      }

      // Emit workspace updated event
      this.emit(WorkspaceManagerEvents.WORKSPACE_UPDATED, validatedConfig, existingWorkspace);

      return {
        success: true,
        data: validatedConfig,
        workspaceId,
        timestamp,
      };
    } catch (error) {
      const workspaceError = this.handleError(error, workspaceId, 'Failed to update workspace');
      return {
        success: false,
        error: workspaceError,
        workspaceId,
        timestamp,
      };
    }
  }

  /**
   * Remove a workspace
   */
  async removeWorkspace(workspaceId: string): Promise<WorkspaceOperationResult<void>> {
    const timestamp = new Date().toISOString();

    try {
      // Get existing workspace
      const existingWorkspace = this.workspaces.get(workspaceId);
      if (!existingWorkspace) {
        throw this.createWorkspaceError(
          WorkspaceErrorType.WORKSPACE_NOT_FOUND,
          `Workspace with ID '${workspaceId}' not found`,
          workspaceId
        );
      }

      // Remove from memory
      this.workspaces.delete(workspaceId);

      // Remove from persistent storage if configured
      if (this.storage) {
        await this.storage.deleteWorkspace(workspaceId);
      }

      // Emit workspace removed event
      this.emit(WorkspaceManagerEvents.WORKSPACE_REMOVED, existingWorkspace);

      return {
        success: true,
        workspaceId,
        timestamp,
      };
    } catch (error) {
      const workspaceError = this.handleError(error, workspaceId, 'Failed to remove workspace');
      return {
        success: false,
        error: workspaceError,
        workspaceId,
        timestamp,
      };
    }
  }

  // ============================================================================
  // Workspace Retrieval and Querying
  // ============================================================================

  /**
   * Get a workspace by ID
   */
  getWorkspace(workspaceId: string): WorkspaceConfig | null {
    return this.workspaces.get(workspaceId) || null;
  }

  /**
   * Get all workspaces
   */
  getAllWorkspaces(): WorkspaceConfig[] {
    return Array.from(this.workspaces.values());
  }

  /**
   * Query workspaces with filtering and pagination
   */
  queryWorkspaces(params: WorkspaceQueryParams = {}): WorkspaceConfig[] {
    try {
      const validatedParams = WorkspaceQuerySchema.parse(params);
      let workspaces = Array.from(this.workspaces.values());

      // Apply filters
      if (validatedParams.status) {
        workspaces = workspaces.filter(w => w.status === validatedParams.status);
      }

      if (validatedParams.priority) {
        workspaces = workspaces.filter(w => w.priority === validatedParams.priority);
      }

      if (validatedParams.environment) {
        workspaces = workspaces.filter(w => w.metadata.environment === validatedParams.environment);
      }

      if (validatedParams.tags && validatedParams.tags.length > 0) {
        workspaces = workspaces.filter(w =>
          validatedParams.tags!.some(tag => w.metadata.tags.includes(tag))
        );
      }

      if (validatedParams.features && validatedParams.features.length > 0) {
        workspaces = workspaces.filter(w => {
          const features = w.features as unknown as Record<string, boolean>;
          return validatedParams.features!.some(feature => features[feature] === true);
        });
      }

      // Apply pagination
      const offset = validatedParams.offset || 0;
      const limit = validatedParams.limit || 20;
      return workspaces.slice(offset, offset + limit);
    } catch (error) {
      console.error('Error querying workspaces:', error);
      return [];
    }
  }

  /**
   * Find workspace by slug
   */
  findWorkspaceBySlug(slug: string): WorkspaceConfig | null {
    return Array.from(this.workspaces.values()).find(w => w.slug === slug) || null;
  }

  /**
   * Get workspace summaries
   */
  getWorkspaceSummaries(): WorkspaceSummary[] {
    return Array.from(this.workspaces.values()).map(workspace => ({
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      status: workspace.status,
      priority: workspace.priority,
      lastAccessedAt: workspace.metadata.lastAccessedAt,
      healthScore: workspace.healthStatus?.connectivityScore || 0,
    }));
  }

  // ============================================================================
  // Health Monitoring
  // ============================================================================

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      return;
    }

    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks().catch(error => {
        console.error('Health check error:', error);
      });
    }, this.config.healthCheckInterval);

    console.log(`Health monitoring started with ${this.config.healthCheckInterval}ms interval`);
  }

  /**
   * Perform health checks on all workspaces
   */
  async performHealthChecks(): Promise<void> {
    const timestamp = new Date().toISOString();
    const healthCheckPromises: Promise<void>[] = [];

    for (const [workspaceId, workspace] of this.workspaces) {
      if (workspace.status === WorkspaceStatus.ACTIVE || workspace.status === WorkspaceStatus.ERROR) {
        healthCheckPromises.push(this.performWorkspaceHealthCheck(workspaceId, timestamp));
      }
    }

    await Promise.allSettled(healthCheckPromises);
    this.emit(WorkspaceManagerEvents.HEALTH_CHECK_COMPLETED, timestamp);
  }

  /**
   * Perform health check on a specific workspace
   */
  private async performWorkspaceHealthCheck(workspaceId: string, timestamp: string): Promise<void> {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) {
      return;
    }

    try {
      const startTime = Date.now();
      
      // Perform actual health check (placeholder - implement actual check)
      const isHealthy = await this.checkWorkspaceHealth(workspace);
      
      const responseTime = Date.now() - startTime;
      const previousStatus = workspace.status;

      // Update health status
      const healthStatus: WorkspaceHealthStatus = {
        status: isHealthy ? WorkspaceStatus.ACTIVE : WorkspaceStatus.ERROR,
        lastHealthCheck: timestamp,
        responseTimeMs: responseTime,
        errorCount: workspace.healthStatus?.errorCount || 0,
        lastError: workspace.healthStatus?.lastError,
        uptime: workspace.healthStatus?.uptime || 0,
        connectivityScore: isHealthy ? Math.min(100, (workspace.healthStatus?.connectivityScore || 100)) : Math.max(0, (workspace.healthStatus?.connectivityScore || 100) - 10),
      };

      if (!isHealthy) {
        healthStatus.errorCount = (workspace.healthStatus?.errorCount || 0) + 1;
        healthStatus.lastError = `Health check failed at ${timestamp}`;
      }

      // Update workspace
      const updatedWorkspace: WorkspaceConfig = {
        ...workspace,
        status: healthStatus.status,
        healthStatus,
        metadata: {
          ...workspace.metadata,
          updatedAt: timestamp,
        },
      };

      this.workspaces.set(workspaceId, updatedWorkspace);

      // Emit status change event if status changed
      if (previousStatus !== healthStatus.status) {
        this.emit(WorkspaceManagerEvents.WORKSPACE_STATUS_CHANGED, updatedWorkspace, previousStatus);
      }
    } catch (error) {
      console.error(`Health check failed for workspace ${workspaceId}:`, error);
    }
  }

  /**
   * Check workspace health (placeholder implementation)
   */
  private async checkWorkspaceHealth(workspace: WorkspaceConfig): Promise<boolean> {
    // Placeholder implementation - replace with actual health check logic
    try {
      // Simulate health check with timeout
      return new Promise((resolve) => {
        setTimeout(() => resolve(Math.random() > 0.1), 1000); // 90% success rate
      });
    } catch {
      return false;
    }
  }

  // ============================================================================
  // Workspace Context and Operations
  // ============================================================================

  /**
   * Create workspace context for tool execution
   */
  createWorkspaceContext(workspaceId: string, requestId?: string): WorkspaceContext | null {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) {
      return null;
    }

    return {
      workspaceId,
      workspace,
      requestId: requestId || this.generateRequestId(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get workspace statistics (placeholder implementation)
   */
  async getWorkspaceStatistics(workspaceId: string): Promise<WorkspaceStatistics | null> {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) {
      return null;
    }

    // Placeholder implementation - replace with actual statistics gathering
    return {
      workspaceId,
      repositoryCount: 0,
      issueCount: 0,
      pullRequestCount: 0,
      pipelineCount: 0,
      lastActivityAt: workspace.metadata.lastAccessedAt,
      totalRequests: 0,
      averageResponseTime: workspace.healthStatus?.responseTimeMs || 0,
      errorRate: 0,
    };
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Generate a workspace ID from slug
   */
  private generateWorkspaceId(slug: string): string {
    const baseId = slug.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    if (WORKSPACE_ID_PATTERN.test(baseId)) {
      return baseId;
    }
    return `workspace-${baseId}`;
  }

  /**
   * Generate a request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Create a workspace error
   */
  private createWorkspaceError(
    type: WorkspaceErrorType,
    message: string,
    workspaceId?: string,
    details?: Record<string, unknown>
  ): WorkspaceError {
    const error: WorkspaceError = {
      name: 'WorkspaceError',
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
  private handleError(error: unknown, workspaceId?: string, context?: string): WorkspaceError {
    if (error instanceof Error && 'type' in error) {
      return error as WorkspaceError;
    }

    if (error instanceof Error) {
      return this.createWorkspaceError(
        WorkspaceErrorType.INVALID_CONFIGURATION,
        context ? `${context}: ${error.message}` : error.message,
        workspaceId,
        { originalError: error }
      );
    }

    return this.createWorkspaceError(
      WorkspaceErrorType.INVALID_CONFIGURATION,
      context ? `${context}: Unknown error` : 'Unknown error',
      workspaceId,
      { originalError: error }
    );
  }

  // ============================================================================
  // Public Properties
  // ============================================================================

  /**
   * Get the number of registered workspaces
   */
  get workspaceCount(): number {
    return this.workspaces.size;
  }

  /**
   * Check if workspace manager is initialized
   */
  get isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get configuration
   */
  get configuration(): Readonly<Required<WorkspaceManagerConfig>> {
    return this.config;
  }
}