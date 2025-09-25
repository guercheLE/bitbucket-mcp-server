/**
 * File-based Workspace Storage Implementation
 *
 * Provides persistent storage for workspace configurations using JSON files.
 * Implements the WorkspaceStorage interface with file system operations.
 */
import { WorkspaceStorage } from './manager.js';
import { WorkspaceConfig } from './types.js';
/**
 * File Storage Configuration
 */
export interface FileStorageConfig {
    storageDir: string;
    filename: string;
    backupCount?: number;
    prettyFormat?: boolean;
    autoBackup?: boolean;
}
/**
 * File-based Workspace Storage
 *
 * Stores workspace configurations in JSON format with backup support.
 * Provides atomic write operations and data validation.
 */
export declare class FileWorkspaceStorage implements WorkspaceStorage {
    private config;
    private filePath;
    constructor(config: FileStorageConfig);
    /**
     * Load all workspaces from storage
     */
    load(): Promise<WorkspaceConfig[]>;
    /**
     * Save all workspaces to storage
     */
    save(workspaces: WorkspaceConfig[]): Promise<void>;
    /**
     * Load a specific workspace from storage
     */
    loadWorkspace(id: string): Promise<WorkspaceConfig | null>;
    /**
     * Save a specific workspace to storage
     */
    saveWorkspace(workspace: WorkspaceConfig): Promise<void>;
    /**
     * Delete a workspace from storage
     */
    deleteWorkspace(id: string): Promise<void>;
    /**
     * Check if a workspace exists in storage
     */
    exists(idOrPath?: string): Promise<boolean>;
    /**
     * Get storage statistics
     */
    getStorageStats(): Promise<{
        filePath: string;
        exists: boolean;
        size?: number;
        lastModified?: Date;
        workspaceCount?: number;
        backupCount: number;
    }>;
    /**
     * Create a backup of the current storage file
     */
    createBackup(): Promise<string>;
    /**
     * Restore from a backup file
     */
    restoreFromBackup(backupPath?: string): Promise<void>;
    /**
     * List available backup files
     */
    listBackups(): Promise<Array<{
        filename: string;
        path: string;
        created: Date;
        size: number;
    }>>;
    /**
     * Clean up old backup files
     */
    private cleanupBackups;
    /**
     * Get list of backup files sorted by creation date (newest first)
     */
    private getBackupFiles;
    /**
     * Ensure storage directory exists
     */
    private ensureStorageDirectory;
    /**
     * Validate storage file integrity
     */
    validateStorage(): Promise<{
        isValid: boolean;
        errors: string[];
        workspaceCount: number;
    }>;
    /**
     * Compact storage by removing any corrupted entries
     */
    compactStorage(): Promise<{
        originalCount: number;
        compactedCount: number;
        removedCount: number;
        errors: string[];
    }>;
    /**
     * Get storage configuration
     */
    getConfig(): Readonly<Required<FileStorageConfig>>;
}
//# sourceMappingURL=storage.d.ts.map