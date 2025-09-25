/**
 * Workspace Module Index
 * 
 * Entry point for all workspace-related functionality in the Bitbucket MCP Server.
 * Exports all workspace management components including types, manager, storage, and context provider.
 */

// Core types and interfaces
export * from './types.js';

// Workspace manager service
export { WorkspaceManager, type WorkspaceManagerConfig, WorkspaceManagerEvents } from './manager.js';

// Storage implementations
export { FileWorkspaceStorage, type FileStorageConfig } from './storage.js';
export type { WorkspaceStorage } from './manager.js';

// Context provider
export {
  WorkspaceContextProvider,
  type ContextProviderConfig,
  type RequestContext,
  type ContextResolutionResult,
} from './context.js';

// Utility functions for workspace operations
import {
  WorkspaceConfig,
  WorkspaceStatus,
  WorkspacePriority,
  WorkspaceErrorType,
  AuthenticationType,
  isWorkspaceConfig,
  isWorkspaceError,
  DEFAULT_WORKSPACE_CONFIG,
  MAX_WORKSPACES,
  WORKSPACE_ID_PATTERN,
  WORKSPACE_SLUG_PATTERN,
} from './types.js';
import { WorkspaceManager } from './manager.js';
import { FileWorkspaceStorage } from './storage.js';
import { WorkspaceContextProvider } from './context.js';

/**
 * Create a workspace manager with file storage
 */
export function createWorkspaceManager(config: {
  storageDir?: string;
  maxWorkspaces?: number;
  autoHealthCheck?: boolean;
  defaultWorkspace?: string;
}): {
  manager: WorkspaceManager;
  contextProvider: WorkspaceContextProvider;
  storage: FileWorkspaceStorage;
} {
  const storage = new FileWorkspaceStorage({
    storageDir: config.storageDir || './data/workspaces',
    filename: 'workspaces.json',
    backupCount: 5,
    prettyFormat: true,
    autoBackup: true,
  });

  const manager = new WorkspaceManager(
    {
      maxWorkspaces: config.maxWorkspaces || MAX_WORKSPACES,
      autoHealthCheck: config.autoHealthCheck ?? true,
      persistentStorage: true,
    },
    storage
  );

  const contextProvider = new WorkspaceContextProvider(manager, {
    defaultWorkspaceId: config.defaultWorkspace,
    allowCrossWorkspace: true,
    maxCrossWorkspaceTargets: 10,
    trackingEnabled: true,
  });

  return { manager, contextProvider, storage };
}

/**
 * Validate workspace configuration data
 */
export function validateWorkspaceConfig(config: unknown): {
  isValid: boolean;
  errors: string[];
  config?: WorkspaceConfig;
} {
  const result = {
    isValid: false,
    errors: [] as string[],
    config: undefined as WorkspaceConfig | undefined,
  };

  try {
    if (!isWorkspaceConfig(config)) {
      result.errors.push('Invalid workspace configuration format');
      return result;
    }

    result.config = config;
    result.isValid = true;
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown validation error');
  }

  return result;
}

/**
 * Create default workspace configuration template
 */
export function createDefaultWorkspaceTemplate(overrides: {
  name: string;
  slug: string;
  baseUrl: string;
  authType: AuthenticationType;
}): Partial<WorkspaceConfig> {
  const timestamp = new Date().toISOString();

  return {
    id: overrides.slug.toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
    name: overrides.name,
    slug: overrides.slug,
    baseUrl: overrides.baseUrl,
    priority: WorkspacePriority.SECONDARY,
    authConfig: {
      type: overrides.authType,
      credentials: {},
      scopes: ['read', 'write'],
    },
    features: {
      repositories: true,
      issues: true,
      pullRequests: true,
      pipelines: true,
      webhooks: false,
      analytics: true,
      search: true,
      crossWorkspaceOperations: false,
    },
    limits: {
      maxRepositories: 1000,
      maxConcurrentRequests: 10,
      requestsPerMinute: 100,
      maxResponseSize: 50 * 1024 * 1024,
      timeoutSeconds: 30,
    },
    status: WorkspaceStatus.INACTIVE,
    metadata: {
      createdAt: timestamp,
      updatedAt: timestamp,
      version: '1.0.0',
      tags: [],
      environment: 'production',
    },
  };
}

/**
 * Workspace validation utilities
 */
export const WorkspaceUtils = {
  /**
   * Check if workspace ID is valid
   */
  isValidWorkspaceId(id: string): boolean {
    return WORKSPACE_ID_PATTERN.test(id);
  },

  /**
   * Check if workspace slug is valid
   */
  isValidWorkspaceSlug(slug: string): boolean {
    return WORKSPACE_SLUG_PATTERN.test(slug);
  },

  /**
   * Generate workspace ID from slug
   */
  generateWorkspaceId(slug: string): string {
    const baseId = slug.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    if (WORKSPACE_ID_PATTERN.test(baseId)) {
      return baseId;
    }
    return `workspace-${baseId}`;
  },

  /**
   * Sanitize workspace slug
   */
  sanitizeSlug(slug: string): string {
    return slug
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  },

  /**
   * Check if workspace is operational
   */
  isWorkspaceOperational(workspace: WorkspaceConfig): boolean {
    return (
      workspace.status === WorkspaceStatus.ACTIVE ||
      workspace.status === WorkspaceStatus.CONFIGURING
    );
  },

  /**
   * Check if workspace supports feature
   */
  supportsFeature(workspace: WorkspaceConfig, feature: keyof WorkspaceConfig['features']): boolean {
    return workspace.features[feature] === true;
  },

  /**
   * Get workspace health score
   */
  getHealthScore(workspace: WorkspaceConfig): number {
    if (!workspace.healthStatus) {
      return workspace.status === WorkspaceStatus.ACTIVE ? 100 : 0;
    }
    return workspace.healthStatus.connectivityScore;
  },

  /**
   * Format workspace for display
   */
  formatWorkspaceInfo(workspace: WorkspaceConfig): string {
    const status = workspace.status.toUpperCase();
    const health = this.getHealthScore(workspace);
    return `${workspace.name} (${workspace.slug}) - ${status} - Health: ${health}%`;
  },

  /**
   * Calculate workspace priorities
   */
  sortWorkspacesByPriority(workspaces: WorkspaceConfig[]): WorkspaceConfig[] {
    const priorityOrder = {
      [WorkspacePriority.PRIMARY]: 0,
      [WorkspacePriority.SECONDARY]: 1,
      [WorkspacePriority.ARCHIVE]: 2,
    };

    return [...workspaces].sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Secondary sort by health score
      const healthA = this.getHealthScore(a);
      const healthB = this.getHealthScore(b);
      return healthB - healthA;
    });
  },
};

/**
 * Workspace constants for external use
 */
export const WorkspaceConstants = {
  MAX_WORKSPACES,
  DEFAULT_WORKSPACE_CONFIG,
  WORKSPACE_ID_PATTERN,
  WORKSPACE_SLUG_PATTERN,
  WorkspaceStatus,
  WorkspacePriority,
  WorkspaceErrorType,
  AuthenticationType,
} as const;