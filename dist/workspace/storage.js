/**
 * File-based Workspace Storage Implementation
 *
 * Provides persistent storage for workspace configurations using JSON files.
 * Implements the WorkspaceStorage interface with file system operations.
 */
import { promises as fs } from 'fs';
import { join } from 'path';
import { WorkspaceConfigSchema, isWorkspaceConfig } from './types.js';
/**
 * File-based Workspace Storage
 *
 * Stores workspace configurations in JSON format with backup support.
 * Provides atomic write operations and data validation.
 */
export class FileWorkspaceStorage {
    config;
    filePath;
    constructor(config) {
        this.config = {
            storageDir: config.storageDir,
            filename: config.filename,
            backupCount: config.backupCount ?? 5,
            prettyFormat: config.prettyFormat ?? true,
            autoBackup: config.autoBackup ?? true,
        };
        this.filePath = join(this.config.storageDir, this.config.filename);
    }
    /**
     * Load all workspaces from storage
     */
    async load() {
        try {
            await this.ensureStorageDirectory();
            if (!(await this.exists(this.filePath))) {
                return [];
            }
            const data = await fs.readFile(this.filePath, 'utf-8');
            const parsed = JSON.parse(data);
            if (!Array.isArray(parsed)) {
                console.warn('Storage file does not contain an array, returning empty array');
                return [];
            }
            // Validate and filter workspace configurations
            const workspaces = [];
            for (const item of parsed) {
                try {
                    const workspace = WorkspaceConfigSchema.parse(item);
                    workspaces.push(workspace);
                }
                catch (error) {
                    console.warn('Invalid workspace configuration found in storage:', error);
                }
            }
            return workspaces;
        }
        catch (error) {
            console.error('Error loading workspaces from storage:', error);
            return [];
        }
    }
    /**
     * Save all workspaces to storage
     */
    async save(workspaces) {
        try {
            await this.ensureStorageDirectory();
            // Create backup if enabled and file exists
            if (this.config.autoBackup && (await this.exists(this.filePath))) {
                await this.createBackup();
            }
            // Validate all workspaces before saving
            const validatedWorkspaces = workspaces.map(workspace => {
                if (!isWorkspaceConfig(workspace)) {
                    throw new Error(`Invalid workspace configuration: ${workspace}`);
                }
                return WorkspaceConfigSchema.parse(workspace);
            });
            // Write to temporary file first, then move to final location (atomic write)
            const tempFilePath = `${this.filePath}.tmp`;
            const data = this.config.prettyFormat
                ? JSON.stringify(validatedWorkspaces, null, 2)
                : JSON.stringify(validatedWorkspaces);
            await fs.writeFile(tempFilePath, data, 'utf-8');
            await fs.rename(tempFilePath, this.filePath);
        }
        catch (error) {
            console.error('Error saving workspaces to storage:', error);
            throw error;
        }
    }
    /**
     * Load a specific workspace from storage
     */
    async loadWorkspace(id) {
        try {
            const workspaces = await this.load();
            return workspaces.find(workspace => workspace.id === id) || null;
        }
        catch (error) {
            console.error(`Error loading workspace ${id} from storage:`, error);
            return null;
        }
    }
    /**
     * Save a specific workspace to storage
     */
    async saveWorkspace(workspace) {
        try {
            // Validate the workspace
            const validatedWorkspace = WorkspaceConfigSchema.parse(workspace);
            // Load existing workspaces
            const workspaces = await this.load();
            // Find and update existing workspace, or add new one
            const existingIndex = workspaces.findIndex(w => w.id === workspace.id);
            if (existingIndex >= 0) {
                workspaces[existingIndex] = validatedWorkspace;
            }
            else {
                workspaces.push(validatedWorkspace);
            }
            // Save all workspaces
            await this.save(workspaces);
        }
        catch (error) {
            console.error(`Error saving workspace ${workspace.id} to storage:`, error);
            throw error;
        }
    }
    /**
     * Delete a workspace from storage
     */
    async deleteWorkspace(id) {
        try {
            const workspaces = await this.load();
            const filteredWorkspaces = workspaces.filter(workspace => workspace.id !== id);
            if (filteredWorkspaces.length === workspaces.length) {
                console.warn(`Workspace ${id} not found in storage`);
                return;
            }
            await this.save(filteredWorkspaces);
        }
        catch (error) {
            console.error(`Error deleting workspace ${id} from storage:`, error);
            throw error;
        }
    }
    /**
     * Check if a workspace exists in storage
     */
    async exists(idOrPath) {
        try {
            if (idOrPath && !idOrPath.includes('/')) {
                // It's a workspace ID, load and check
                const workspace = await this.loadWorkspace(idOrPath);
                return workspace !== null;
            }
            // It's a file path or checking storage file existence
            const pathToCheck = idOrPath || this.filePath;
            await fs.access(pathToCheck);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Get storage statistics
     */
    async getStorageStats() {
        try {
            const exists = await this.exists(this.filePath);
            const result = {
                filePath: this.filePath,
                exists,
                backupCount: 0,
            };
            if (exists) {
                const stats = await fs.stat(this.filePath);
                const workspaces = await this.load();
                const backups = await this.getBackupFiles();
                return {
                    ...result,
                    size: stats.size,
                    lastModified: stats.mtime,
                    workspaceCount: workspaces.length,
                    backupCount: backups.length,
                };
            }
            return result;
        }
        catch (error) {
            console.error('Error getting storage statistics:', error);
            return {
                filePath: this.filePath,
                exists: false,
                backupCount: 0,
            };
        }
    }
    /**
     * Create a backup of the current storage file
     */
    async createBackup() {
        try {
            if (!(await this.exists(this.filePath))) {
                throw new Error('Cannot create backup: storage file does not exist');
            }
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFilename = `${this.config.filename}.backup.${timestamp}`;
            const backupPath = join(this.config.storageDir, backupFilename);
            await fs.copyFile(this.filePath, backupPath);
            // Clean up old backups if needed
            await this.cleanupBackups();
            return backupPath;
        }
        catch (error) {
            console.error('Error creating backup:', error);
            throw error;
        }
    }
    /**
     * Restore from a backup file
     */
    async restoreFromBackup(backupPath) {
        try {
            let pathToRestore;
            if (backupPath) {
                pathToRestore = backupPath;
            }
            else {
                // Use the most recent backup
                const backups = await this.getBackupFiles();
                if (backups.length === 0) {
                    throw new Error('No backup files found');
                }
                pathToRestore = backups[0].path; // Most recent first
            }
            if (!(await this.exists(pathToRestore))) {
                throw new Error(`Backup file does not exist: ${pathToRestore}`);
            }
            // Create a backup of current file before restoring
            if (await this.exists(this.filePath)) {
                await this.createBackup();
            }
            // Copy backup file to main storage location
            await fs.copyFile(pathToRestore, this.filePath);
        }
        catch (error) {
            console.error('Error restoring from backup:', error);
            throw error;
        }
    }
    /**
     * List available backup files
     */
    async listBackups() {
        return this.getBackupFiles();
    }
    /**
     * Clean up old backup files
     */
    async cleanupBackups() {
        try {
            const backups = await this.getBackupFiles();
            if (backups.length > this.config.backupCount) {
                const backupsToDelete = backups.slice(this.config.backupCount);
                for (const backup of backupsToDelete) {
                    try {
                        await fs.unlink(backup.path);
                    }
                    catch (error) {
                        console.warn(`Failed to delete backup file ${backup.filename}:`, error);
                    }
                }
            }
        }
        catch (error) {
            console.error('Error cleaning up backups:', error);
        }
    }
    /**
     * Get list of backup files sorted by creation date (newest first)
     */
    async getBackupFiles() {
        try {
            await this.ensureStorageDirectory();
            const files = await fs.readdir(this.config.storageDir);
            const backupFiles = [];
            const backupPattern = new RegExp(`^${this.config.filename}\\.backup\\..+$`);
            for (const file of files) {
                if (backupPattern.test(file)) {
                    const filePath = join(this.config.storageDir, file);
                    try {
                        const stats = await fs.stat(filePath);
                        backupFiles.push({
                            filename: file,
                            path: filePath,
                            created: stats.mtime,
                            size: stats.size,
                        });
                    }
                    catch (error) {
                        console.warn(`Failed to get stats for backup file ${file}:`, error);
                    }
                }
            }
            // Sort by creation date (newest first)
            return backupFiles.sort((a, b) => b.created.getTime() - a.created.getTime());
        }
        catch (error) {
            console.error('Error getting backup files:', error);
            return [];
        }
    }
    /**
     * Ensure storage directory exists
     */
    async ensureStorageDirectory() {
        try {
            await fs.mkdir(this.config.storageDir, { recursive: true });
        }
        catch (error) {
            console.error('Error creating storage directory:', error);
            throw error;
        }
    }
    /**
     * Validate storage file integrity
     */
    async validateStorage() {
        const result = {
            isValid: true,
            errors: [],
            workspaceCount: 0,
        };
        try {
            if (!(await this.exists(this.filePath))) {
                result.errors.push('Storage file does not exist');
                result.isValid = false;
                return result;
            }
            const data = await fs.readFile(this.filePath, 'utf-8');
            let parsed;
            try {
                parsed = JSON.parse(data);
            }
            catch (error) {
                result.errors.push(`Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}`);
                result.isValid = false;
                return result;
            }
            if (!Array.isArray(parsed)) {
                result.errors.push('Storage file must contain an array');
                result.isValid = false;
                return result;
            }
            const workspaceIds = new Set();
            const workspaceSlugs = new Set();
            for (let i = 0; i < parsed.length; i++) {
                const item = parsed[i];
                try {
                    const workspace = WorkspaceConfigSchema.parse(item);
                    // Check for duplicate IDs
                    if (workspaceIds.has(workspace.id)) {
                        result.errors.push(`Duplicate workspace ID: ${workspace.id}`);
                        result.isValid = false;
                    }
                    else {
                        workspaceIds.add(workspace.id);
                    }
                    // Check for duplicate slugs
                    if (workspaceSlugs.has(workspace.slug)) {
                        result.errors.push(`Duplicate workspace slug: ${workspace.slug}`);
                        result.isValid = false;
                    }
                    else {
                        workspaceSlugs.add(workspace.slug);
                    }
                    result.workspaceCount++;
                }
                catch (error) {
                    result.errors.push(`Invalid workspace at index ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    result.isValid = false;
                }
            }
        }
        catch (error) {
            result.errors.push(`Storage validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            result.isValid = false;
        }
        return result;
    }
    /**
     * Compact storage by removing any corrupted entries
     */
    async compactStorage() {
        const result = {
            originalCount: 0,
            compactedCount: 0,
            removedCount: 0,
            errors: [],
        };
        try {
            const workspaces = await this.load();
            result.originalCount = workspaces.length;
            const validWorkspaces = [];
            const seenIds = new Set();
            const seenSlugs = new Set();
            for (const workspace of workspaces) {
                try {
                    // Validate workspace
                    const validatedWorkspace = WorkspaceConfigSchema.parse(workspace);
                    // Check for duplicates
                    if (seenIds.has(validatedWorkspace.id)) {
                        result.errors.push(`Removed duplicate workspace ID: ${validatedWorkspace.id}`);
                        result.removedCount++;
                        continue;
                    }
                    if (seenSlugs.has(validatedWorkspace.slug)) {
                        result.errors.push(`Removed duplicate workspace slug: ${validatedWorkspace.slug}`);
                        result.removedCount++;
                        continue;
                    }
                    seenIds.add(validatedWorkspace.id);
                    seenSlugs.add(validatedWorkspace.slug);
                    validWorkspaces.push(validatedWorkspace);
                }
                catch (error) {
                    result.errors.push(`Removed invalid workspace: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    result.removedCount++;
                }
            }
            result.compactedCount = validWorkspaces.length;
            // Save compacted data
            if (result.removedCount > 0) {
                await this.save(validWorkspaces);
            }
        }
        catch (error) {
            result.errors.push(`Storage compaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        return result;
    }
    /**
     * Get storage configuration
     */
    getConfig() {
        return { ...this.config };
    }
}
//# sourceMappingURL=storage.js.map