/**
 * Workspace Module Index
 *
 * Entry point for all workspace-related functionality in the Bitbucket MCP Server.
 * Exports all workspace management components including types, manager, storage, and context provider.
 */
export * from './types.js';
export { WorkspaceManager, WorkspaceManagerEvents, type WorkspaceManagerConfig } from './manager.js';
export type { WorkspaceStorage } from './manager.js';
export { FileWorkspaceStorage, type FileStorageConfig } from './storage.js';
export { WorkspaceContextProvider, type ContextProviderConfig, type ContextResolutionResult, type RequestContext } from './context.js';
export * from './context/index.js';
export * from './tools/index.js';
import { WorkspaceContextProvider } from './context.js';
import { WorkspaceManager } from './manager.js';
import { FileWorkspaceStorage } from './storage.js';
import { AuthenticationType, WorkspaceConfig, WorkspaceErrorType, WorkspacePriority, WorkspaceStatus } from './types.js';
/**
 * Create a workspace manager with file storage
 */
export declare function createWorkspaceManager(config: {
    storageDir?: string;
    maxWorkspaces?: number;
    autoHealthCheck?: boolean;
    defaultWorkspace?: string;
}): {
    manager: WorkspaceManager;
    contextProvider: WorkspaceContextProvider;
    storage: FileWorkspaceStorage;
};
/**
 * Validate workspace configuration data
 */
export declare function validateWorkspaceConfig(config: unknown): {
    isValid: boolean;
    errors: string[];
    config?: WorkspaceConfig;
};
/**
 * Create default workspace configuration template
 */
export declare function createDefaultWorkspaceTemplate(overrides: {
    name: string;
    slug: string;
    baseUrl: string;
    authType: AuthenticationType;
}): Partial<WorkspaceConfig>;
/**
 * Workspace validation utilities
 */
export declare const WorkspaceUtils: {
    /**
     * Check if workspace ID is valid
     */
    isValidWorkspaceId(id: string): boolean;
    /**
     * Check if workspace slug is valid
     */
    isValidWorkspaceSlug(slug: string): boolean;
    /**
     * Generate workspace ID from slug
     */
    generateWorkspaceId(slug: string): string;
    /**
     * Sanitize workspace slug
     */
    sanitizeSlug(slug: string): string;
    /**
     * Check if workspace is operational
     */
    isWorkspaceOperational(workspace: WorkspaceConfig): boolean;
    /**
     * Check if workspace supports feature
     */
    supportsFeature(workspace: WorkspaceConfig, feature: keyof WorkspaceConfig["features"]): boolean;
    /**
     * Get workspace health score
     */
    getHealthScore(workspace: WorkspaceConfig): number;
    /**
     * Format workspace for display
     */
    formatWorkspaceInfo(workspace: WorkspaceConfig): string;
    /**
     * Calculate workspace priorities
     */
    sortWorkspacesByPriority(workspaces: WorkspaceConfig[]): WorkspaceConfig[];
};
/**
 * Workspace constants for external use
 */
export declare const WorkspaceConstants: {
    readonly MAX_WORKSPACES: 50;
    readonly DEFAULT_WORKSPACE_CONFIG: Partial<WorkspaceConfig>;
    readonly WORKSPACE_ID_PATTERN: RegExp;
    readonly WORKSPACE_SLUG_PATTERN: RegExp;
    readonly WorkspaceStatus: typeof WorkspaceStatus;
    readonly WorkspacePriority: typeof WorkspacePriority;
    readonly WorkspaceErrorType: typeof WorkspaceErrorType;
    readonly AuthenticationType: typeof AuthenticationType;
};
//# sourceMappingURL=index.d.ts.map