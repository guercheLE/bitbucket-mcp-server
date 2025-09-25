/**
 * Session Persistence System for Bitbucket MCP Server
 *
 * This module provides session persistence functionality,
 * supporting multiple storage backends for session data
 * with encryption, compression, and backup capabilities.
 *
 * Key Features:
 * - Multiple storage backends (file, database, Redis)
 * - Session data encryption and compression
 * - Backup and restore functionality
 * - Session migration and versioning
 * - Performance optimization with caching
 *
 * Constitutional Requirements:
 * - Secure data persistence
 * - Performance optimization
 * - Comprehensive error handling
 * - Data integrity and consistency
 */
import { EventEmitter } from 'events';
import { UserSession } from '../../types/auth';
/**
 * Session Persistence Configuration
 */
export interface SessionPersistenceConfig {
    /** Storage backend type */
    backend: 'file' | 'database' | 'redis';
    /** Encryption key for session data */
    encryptionKey: string;
    /** Whether to compress session data */
    enableCompression: boolean;
    /** Session data retention period in milliseconds */
    retentionPeriod: number;
    /** Backup configuration */
    backup: {
        enabled: boolean;
        interval: number;
        maxBackups: number;
        backupPath: string;
    };
    /** Storage-specific configuration */
    storageConfig: {
        file?: {
            dataPath: string;
            maxFileSize: number;
        };
        database?: {
            connectionString: string;
            tableName: string;
        };
        redis?: {
            host: string;
            port: number;
            password?: string;
            db: number;
        };
    };
}
/**
 * Session Storage Interface
 */
export interface SessionStorage {
    /** Store session data */
    store(sessionId: string, session: UserSession): Promise<void>;
    /** Retrieve session data */
    retrieve(sessionId: string): Promise<UserSession | null>;
    /** Remove session data */
    remove(sessionId: string): Promise<void>;
    /** List all session IDs */
    list(): Promise<string[]>;
    /** Clear all session data */
    clear(): Promise<void>;
    /** Get storage statistics */
    getStats(): Promise<SessionStorageStats>;
}
/**
 * Session Storage Statistics
 */
export interface SessionStorageStats {
    /** Total number of stored sessions */
    totalSessions: number;
    /** Total storage size in bytes */
    totalSize: number;
    /** Last backup timestamp */
    lastBackup: Date | null;
    /** Storage health status */
    isHealthy: boolean;
    /** Error count */
    errorCount: number;
}
/**
 * Session Persistence Manager Class
 * Manages session persistence across multiple backends
 */
export declare class SessionPersistenceManager extends EventEmitter {
    private config;
    private storage;
    private backupInterval;
    private isInitialized;
    constructor(config: SessionPersistenceConfig);
    /**
     * Initialize the persistence manager
     */
    initialize(): Promise<void>;
    /**
     * Create storage backend based on configuration
     */
    private createStorageBackend;
    /**
     * Store session data
     */
    storeSession(sessionId: string, session: UserSession): Promise<void>;
    /**
     * Retrieve session data
     */
    retrieveSession(sessionId: string): Promise<UserSession | null>;
    /**
     * Remove session data
     */
    removeSession(sessionId: string): Promise<void>;
    /**
     * List all stored session IDs
     */
    listSessions(): Promise<string[]>;
    /**
     * Clear all session data
     */
    clearAllSessions(): Promise<void>;
    /**
     * Create backup of session data
     */
    createBackup(): Promise<string>;
    /**
     * Restore session data from backup
     */
    restoreFromBackup(backupPath: string): Promise<void>;
    /**
     * Get persistence statistics
     */
    getStatistics(): Promise<SessionStorageStats>;
    private processSessionForStorage;
    private processSessionFromStorage;
    private encryptData;
    private decryptData;
    private getEncryptionKeyHash;
    private startBackupTimer;
    private cleanupOldBackups;
}
//# sourceMappingURL=session-persistence.d.ts.map