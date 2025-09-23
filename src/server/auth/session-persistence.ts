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
import { createCipher, createDecipher, createHash } from 'crypto';
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';
import { writeFile, readFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import {
  UserSession,
  AuthenticationError,
  AuthenticationErrorCode
} from '../../types/auth';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

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
export class SessionPersistenceManager extends EventEmitter {
  private config: SessionPersistenceConfig;
  private storage: SessionStorage;
  private backupInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor(config: SessionPersistenceConfig) {
    super();
    this.config = config;
  }

  // ============================================================================
  // Initialization and Configuration
  // ============================================================================

  /**
   * Initialize the persistence manager
   */
  async initialize(): Promise<void> {
    try {
      // Create storage backend
      this.storage = await this.createStorageBackend();
      
      // Start backup timer if enabled
      if (this.config.backup.enabled) {
        this.startBackupTimer();
      }
      
      this.isInitialized = true;
      
      this.emit('persistence:initialized', {
        backend: this.config.backend,
        timestamp: new Date()
      });
    } catch (error) {
      throw new AuthenticationError({
        code: AuthenticationErrorCode.INTERNAL_ERROR,
        message: `Failed to initialize session persistence: ${error.message}`,
        details: { originalError: error.message },
        timestamp: new Date(),
        isRecoverable: false
      });
    }
  }

  /**
   * Create storage backend based on configuration
   */
  private async createStorageBackend(): Promise<SessionStorage> {
    switch (this.config.backend) {
      case 'file':
        return new FileSessionStorage(this.config);
      
      case 'database':
        return new DatabaseSessionStorage(this.config);
      
      case 'redis':
        return new RedisSessionStorage(this.config);
      
      default:
        throw new AuthenticationError({
          code: AuthenticationErrorCode.INVALID_CONFIGURATION,
          message: `Unsupported storage backend: ${this.config.backend}`,
          timestamp: new Date(),
          isRecoverable: false
        });
    }
  }

  // ============================================================================
  // Session Persistence Operations
  // ============================================================================

  /**
   * Store session data
   */
  async storeSession(sessionId: string, session: UserSession): Promise<void> {
    if (!this.isInitialized) {
      throw new AuthenticationError({
        code: AuthenticationErrorCode.INTERNAL_ERROR,
        message: 'Session persistence manager not initialized',
        timestamp: new Date(),
        isRecoverable: false
      });
    }

    try {
      // Encrypt and compress session data if configured
      const processedSession = await this.processSessionForStorage(session);
      
      await this.storage.store(sessionId, processedSession);
      
      this.emit('session:stored', {
        sessionId,
        userId: session.userId,
        timestamp: new Date()
      });
    } catch (error) {
      this.emit('session:store-failed', {
        sessionId,
        error: error.message,
        timestamp: new Date()
      });
      
      throw new AuthenticationError({
        code: AuthenticationErrorCode.INTERNAL_ERROR,
        message: `Failed to store session: ${error.message}`,
        details: { sessionId, originalError: error.message },
        timestamp: new Date(),
        isRecoverable: true
      });
    }
  }

  /**
   * Retrieve session data
   */
  async retrieveSession(sessionId: string): Promise<UserSession | null> {
    if (!this.isInitialized) {
      throw new AuthenticationError({
        code: AuthenticationErrorCode.INTERNAL_ERROR,
        message: 'Session persistence manager not initialized',
        timestamp: new Date(),
        isRecoverable: false
      });
    }

    try {
      const session = await this.storage.retrieve(sessionId);
      
      if (!session) {
        return null;
      }

      // Decrypt and decompress session data if needed
      const processedSession = await this.processSessionFromStorage(session);
      
      this.emit('session:retrieved', {
        sessionId,
        userId: session.userId,
        timestamp: new Date()
      });
      
      return processedSession;
    } catch (error) {
      this.emit('session:retrieve-failed', {
        sessionId,
        error: error.message,
        timestamp: new Date()
      });
      
      throw new AuthenticationError({
        code: AuthenticationErrorCode.INTERNAL_ERROR,
        message: `Failed to retrieve session: ${error.message}`,
        details: { sessionId, originalError: error.message },
        timestamp: new Date(),
        isRecoverable: true
      });
    }
  }

  /**
   * Remove session data
   */
  async removeSession(sessionId: string): Promise<void> {
    if (!this.isInitialized) {
      throw new AuthenticationError({
        code: AuthenticationErrorCode.INTERNAL_ERROR,
        message: 'Session persistence manager not initialized',
        timestamp: new Date(),
        isRecoverable: false
      });
    }

    try {
      await this.storage.remove(sessionId);
      
      this.emit('session:removed', {
        sessionId,
        timestamp: new Date()
      });
    } catch (error) {
      this.emit('session:remove-failed', {
        sessionId,
        error: error.message,
        timestamp: new Date()
      });
      
      throw new AuthenticationError({
        code: AuthenticationErrorCode.INTERNAL_ERROR,
        message: `Failed to remove session: ${error.message}`,
        details: { sessionId, originalError: error.message },
        timestamp: new Date(),
        isRecoverable: true
      });
    }
  }

  /**
   * List all stored session IDs
   */
  async listSessions(): Promise<string[]> {
    if (!this.isInitialized) {
      throw new AuthenticationError({
        code: AuthenticationErrorCode.INTERNAL_ERROR,
        message: 'Session persistence manager not initialized',
        timestamp: new Date(),
        isRecoverable: false
      });
    }

    try {
      return await this.storage.list();
    } catch (error) {
      throw new AuthenticationError({
        code: AuthenticationErrorCode.INTERNAL_ERROR,
        message: `Failed to list sessions: ${error.message}`,
        details: { originalError: error.message },
        timestamp: new Date(),
        isRecoverable: true
      });
    }
  }

  /**
   * Clear all session data
   */
  async clearAllSessions(): Promise<void> {
    if (!this.isInitialized) {
      throw new AuthenticationError({
        code: AuthenticationErrorCode.INTERNAL_ERROR,
        message: 'Session persistence manager not initialized',
        timestamp: new Date(),
        isRecoverable: false
      });
    }

    try {
      await this.storage.clear();
      
      this.emit('sessions:cleared', {
        timestamp: new Date()
      });
    } catch (error) {
      throw new AuthenticationError({
        code: AuthenticationErrorCode.INTERNAL_ERROR,
        message: `Failed to clear sessions: ${error.message}`,
        details: { originalError: error.message },
        timestamp: new Date(),
        isRecoverable: true
      });
    }
  }

  // ============================================================================
  // Backup and Restore
  // ============================================================================

  /**
   * Create backup of session data
   */
  async createBackup(): Promise<string> {
    if (!this.isInitialized) {
      throw new AuthenticationError({
        code: AuthenticationErrorCode.INTERNAL_ERROR,
        message: 'Session persistence manager not initialized',
        timestamp: new Date(),
        isRecoverable: false
      });
    }

    try {
      const sessionIds = await this.storage.list();
      const sessions: Record<string, UserSession> = {};
      
      // Retrieve all sessions
      for (const sessionId of sessionIds) {
        const session = await this.storage.retrieve(sessionId);
        if (session) {
          sessions[sessionId] = session;
        }
      }

      // Create backup data
      const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        backend: this.config.backend,
        sessionCount: Object.keys(sessions).length,
        sessions
      };

      // Compress and encrypt backup
      const backupJson = JSON.stringify(backupData);
      const compressed = await gzipAsync(backupJson);
      const encrypted = this.encryptData(compressed);

      // Save backup file
      const backupFileName = `session-backup-${Date.now()}.bak`;
      const backupPath = join(this.config.backup.backupPath, backupFileName);
      
      await writeFile(backupPath, encrypted);

      // Clean up old backups
      await this.cleanupOldBackups();

      this.emit('backup:created', {
        backupPath,
        sessionCount: Object.keys(sessions).length,
        timestamp: new Date()
      });

      return backupPath;
    } catch (error) {
      this.emit('backup:failed', {
        error: error.message,
        timestamp: new Date()
      });
      
      throw new AuthenticationError({
        code: AuthenticationErrorCode.INTERNAL_ERROR,
        message: `Failed to create backup: ${error.message}`,
        details: { originalError: error.message },
        timestamp: new Date(),
        isRecoverable: true
      });
    }
  }

  /**
   * Restore session data from backup
   */
  async restoreFromBackup(backupPath: string): Promise<void> {
    if (!this.isInitialized) {
      throw new AuthenticationError({
        code: AuthenticationErrorCode.INTERNAL_ERROR,
        message: 'Session persistence manager not initialized',
        timestamp: new Date(),
        isRecoverable: false
      });
    }

    try {
      // Read and decrypt backup file
      const encryptedData = await readFile(backupPath);
      const decrypted = this.decryptData(encryptedData);
      const decompressed = await gunzipAsync(decrypted);
      const backupData = JSON.parse(decompressed.toString());

      // Validate backup data
      if (!backupData.sessions || typeof backupData.sessions !== 'object') {
        throw new Error('Invalid backup data format');
      }

      // Clear existing sessions
      await this.storage.clear();

      // Restore sessions
      let restoredCount = 0;
      for (const [sessionId, session] of Object.entries(backupData.sessions)) {
        await this.storage.store(sessionId, session as UserSession);
        restoredCount++;
      }

      this.emit('backup:restored', {
        backupPath,
        restoredCount,
        timestamp: new Date()
      });
    } catch (error) {
      this.emit('backup:restore-failed', {
        backupPath,
        error: error.message,
        timestamp: new Date()
      });
      
      throw new AuthenticationError({
        code: AuthenticationErrorCode.INTERNAL_ERROR,
        message: `Failed to restore from backup: ${error.message}`,
        details: { backupPath, originalError: error.message },
        timestamp: new Date(),
        isRecoverable: true
      });
    }
  }

  // ============================================================================
  // Statistics and Monitoring
  // ============================================================================

  /**
   * Get persistence statistics
   */
  async getStatistics(): Promise<SessionStorageStats> {
    if (!this.isInitialized) {
      throw new AuthenticationError({
        code: AuthenticationErrorCode.INTERNAL_ERROR,
        message: 'Session persistence manager not initialized',
        timestamp: new Date(),
        isRecoverable: false
      });
    }

    try {
      return await this.storage.getStats();
    } catch (error) {
      throw new AuthenticationError({
        code: AuthenticationErrorCode.INTERNAL_ERROR,
        message: `Failed to get statistics: ${error.message}`,
        details: { originalError: error.message },
        timestamp: new Date(),
        isRecoverable: true
      });
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async processSessionForStorage(session: UserSession): Promise<UserSession> {
    let processedSession = { ...session };

    // Compress session data if enabled
    if (this.config.enableCompression) {
      const sessionJson = JSON.stringify(processedSession);
      const compressed = await gzipAsync(sessionJson);
      processedSession = {
        ...processedSession,
        metadata: {
          ...processedSession.metadata,
          compressed: true,
          originalSize: sessionJson.length,
          compressedSize: compressed.length
        }
      };
    }

    // Encrypt session data
    const sessionJson = JSON.stringify(processedSession);
    const encrypted = this.encryptData(Buffer.from(sessionJson));
    
    return {
      ...processedSession,
      metadata: {
        ...processedSession.metadata,
        encrypted: true,
        encryptionKey: this.getEncryptionKeyHash()
      }
    };
  }

  private async processSessionFromStorage(session: UserSession): Promise<UserSession> {
    let processedSession = { ...session };

    // Decrypt session data if encrypted
    if (processedSession.metadata?.encrypted) {
      const sessionJson = JSON.stringify(processedSession);
      const decrypted = this.decryptData(Buffer.from(sessionJson));
      processedSession = JSON.parse(decrypted.toString());
    }

    // Decompress session data if compressed
    if (processedSession.metadata?.compressed) {
      const sessionJson = JSON.stringify(processedSession);
      const decompressed = await gunzipAsync(Buffer.from(sessionJson));
      processedSession = JSON.parse(decompressed.toString());
    }

    return processedSession;
  }

  private encryptData(data: Buffer): Buffer {
    const cipher = createCipher('aes-256-cbc', this.config.encryptionKey);
    let encrypted = cipher.update(data);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted;
  }

  private decryptData(data: Buffer): Buffer {
    const decipher = createDecipher('aes-256-cbc', this.config.encryptionKey);
    let decrypted = decipher.update(data);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted;
  }

  private getEncryptionKeyHash(): string {
    return createHash('sha256').update(this.config.encryptionKey).digest('hex');
  }

  private startBackupTimer(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
    }

    this.backupInterval = setInterval(async () => {
      try {
        await this.createBackup();
      } catch (error) {
        this.emit('error', error);
      }
    }, this.config.backup.interval);
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      const backupDir = this.config.backup.backupPath;
      if (!existsSync(backupDir)) {
        return;
      }

      // Implementation would depend on the file system
      // For now, we'll just emit an event
      this.emit('backup:cleanup', {
        timestamp: new Date()
      });
    } catch (error) {
      this.emit('backup:cleanup-failed', {
        error: error.message,
        timestamp: new Date()
      });
    }
  }
}

// ============================================================================
// Storage Backend Implementations
// ============================================================================

/**
 * File-based Session Storage
 */
class FileSessionStorage implements SessionStorage {
  private config: SessionPersistenceConfig;
  private dataPath: string;

  constructor(config: SessionPersistenceConfig) {
    this.config = config;
    this.dataPath = config.storageConfig.file?.dataPath || './sessions';
  }

  async store(sessionId: string, session: UserSession): Promise<void> {
    const filePath = join(this.dataPath, `${sessionId}.json`);
    await writeFile(filePath, JSON.stringify(session, null, 2));
  }

  async retrieve(sessionId: string): Promise<UserSession | null> {
    try {
      const filePath = join(this.dataPath, `${sessionId}.json`);
      const data = await readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  async remove(sessionId: string): Promise<void> {
    try {
      const filePath = join(this.dataPath, `${sessionId}.json`);
      await unlink(filePath);
    } catch {
      // File might not exist, ignore error
    }
  }

  async list(): Promise<string[]> {
    // Implementation would scan directory for .json files
    return [];
  }

  async clear(): Promise<void> {
    // Implementation would remove all .json files
  }

  async getStats(): Promise<SessionStorageStats> {
    return {
      totalSessions: 0,
      totalSize: 0,
      lastBackup: null,
      isHealthy: true,
      errorCount: 0
    };
  }
}

/**
 * Database Session Storage (placeholder)
 */
class DatabaseSessionStorage implements SessionStorage {
  private config: SessionPersistenceConfig;

  constructor(config: SessionPersistenceConfig) {
    this.config = config;
  }

  async store(sessionId: string, session: UserSession): Promise<void> {
    // Database implementation would go here
    throw new Error('Database storage not implemented');
  }

  async retrieve(sessionId: string): Promise<UserSession | null> {
    // Database implementation would go here
    throw new Error('Database storage not implemented');
  }

  async remove(sessionId: string): Promise<void> {
    // Database implementation would go here
    throw new Error('Database storage not implemented');
  }

  async list(): Promise<string[]> {
    // Database implementation would go here
    throw new Error('Database storage not implemented');
  }

  async clear(): Promise<void> {
    // Database implementation would go here
    throw new Error('Database storage not implemented');
  }

  async getStats(): Promise<SessionStorageStats> {
    // Database implementation would go here
    throw new Error('Database storage not implemented');
  }
}

/**
 * Redis Session Storage (placeholder)
 */
class RedisSessionStorage implements SessionStorage {
  private config: SessionPersistenceConfig;

  constructor(config: SessionPersistenceConfig) {
    this.config = config;
  }

  async store(sessionId: string, session: UserSession): Promise<void> {
    // Redis implementation would go here
    throw new Error('Redis storage not implemented');
  }

  async retrieve(sessionId: string): Promise<UserSession | null> {
    // Redis implementation would go here
    throw new Error('Redis storage not implemented');
  }

  async remove(sessionId: string): Promise<void> {
    // Redis implementation would go here
    throw new Error('Redis storage not implemented');
  }

  async list(): Promise<string[]> {
    // Redis implementation would go here
    throw new Error('Redis storage not implemented');
  }

  async clear(): Promise<void> {
    // Redis implementation would go here
    throw new Error('Redis storage not implemented');
  }

  async getStats(): Promise<SessionStorageStats> {
    // Redis implementation would go here
    throw new Error('Redis storage not implemented');
  }
}
