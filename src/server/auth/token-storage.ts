/**
 * Token Storage System for Bitbucket MCP Server
 * 
 * This module provides secure storage and management of OAuth tokens,
 * including access tokens, refresh tokens, and their associated metadata.
 * It supports multiple storage backends and encryption for security.
 * 
 * Key Features:
 * - Secure token storage with encryption
 * - Multiple storage backends (memory, file, database)
 * - Token lifecycle management
 * - Automatic cleanup of expired tokens
 * - Access control and audit logging
 * 
 * Constitutional Requirements:
 * - Secure token storage
 * - Memory efficiency
 * - Comprehensive error handling
 * - Security auditing
 */

import { EventEmitter } from 'events';
import { randomBytes, createHash, createCipher, createDecipher } from 'crypto';
import {
  AccessToken,
  RefreshToken,
  AuthenticationError,
  AuthenticationErrorCode,
  AuthenticationConfig
} from '../../types/auth';

/**
 * Token Storage Interface
 * Defines the contract for token storage implementations
 */
export interface TokenStorage extends EventEmitter {
  /** Store an access token */
  storeAccessToken(token: AccessToken, userId: string): Promise<void>;
  
  /** Retrieve an access token by ID */
  getAccessToken(tokenId: string): Promise<AccessToken | null>;
  
  /** Store a refresh token */
  storeRefreshToken(token: RefreshToken): Promise<void>;
  
  /** Retrieve a refresh token by ID */
  getRefreshToken(tokenId: string): Promise<RefreshToken | null>;
  
  /** Remove an access token */
  removeAccessToken(tokenId: string): Promise<void>;
  
  /** Remove a refresh token */
  removeRefreshToken(tokenId: string): Promise<void>;
  
  /** Get all tokens for a user */
  getUserTokens(userId: string): Promise<{ accessTokens: AccessToken[]; refreshTokens: RefreshToken[] }>;
  
  /** Clean up expired tokens */
  cleanupExpiredTokens(): Promise<number>;
  
  /** Get storage statistics */
  getStats(): TokenStorageStats;
}

/**
 * Token Storage Statistics
 * Performance and usage metrics for token storage
 */
export interface TokenStorageStats {
  /** Number of stored access tokens */
  accessTokenCount: number;
  
  /** Number of stored refresh tokens */
  refreshTokenCount: number;
  
  /** Number of expired tokens */
  expiredTokenCount: number;
  
  /** Storage size in bytes */
  storageSize: number;
  
  /** Last cleanup timestamp */
  lastCleanup: Date;
  
  /** Number of cleanup operations */
  cleanupCount: number;
}

/**
 * Memory Token Storage Implementation
 * In-memory storage for development and testing
 */
export class MemoryTokenStorage extends EventEmitter implements TokenStorage {
  private accessTokens: Map<string, { token: AccessToken; userId: string; encrypted: boolean }> = new Map();
  private refreshTokens: Map<string, { token: RefreshToken; encrypted: boolean }> = new Map();
  private config: AuthenticationConfig;
  private stats: TokenStorageStats;

  constructor(config: AuthenticationConfig) {
    super();
    this.config = config;
    this.stats = {
      accessTokenCount: 0,
      refreshTokenCount: 0,
      expiredTokenCount: 0,
      storageSize: 0,
      lastCleanup: new Date(),
      cleanupCount: 0
    };
    
    this.setupCleanupInterval();
  }

  async storeAccessToken(token: AccessToken, userId: string): Promise<void> {
    try {
      const tokenData = {
        token: this.config.security.encryptTokens ? this.encryptAccessToken(token) : token,
        userId,
        encrypted: this.config.security.encryptTokens
      };
      
      this.accessTokens.set(token.token, tokenData);
      this.updateStats();
      
      this.emit('token:stored', { type: 'access', tokenId: token.token, userId });
    } catch (error) {
      throw new Error(`Failed to store access token: ${error.message}`);
    }
  }

  async getAccessToken(tokenId: string): Promise<AccessToken | null> {
    try {
      const tokenData = this.accessTokens.get(tokenId);
      if (!tokenData) {
        return null;
      }
      
      const token = tokenData.encrypted ? this.decryptAccessToken(tokenData.token) : tokenData.token;
      
      // Check if token is expired
      if (token.expiresAt < new Date()) {
        await this.removeAccessToken(tokenId);
        return null;
      }
      
      // Update last used timestamp
      token.lastUsedAt = new Date();
      
      return token;
    } catch (error) {
      throw new Error(`Failed to retrieve access token: ${error.message}`);
    }
  }

  async storeRefreshToken(token: RefreshToken): Promise<void> {
    try {
      const tokenData = {
        token: this.config.security.encryptTokens ? this.encryptRefreshToken(token) : token,
        encrypted: this.config.security.encryptTokens
      };
      
      this.refreshTokens.set(token.id, tokenData);
      this.updateStats();
      
      this.emit('token:stored', { type: 'refresh', tokenId: token.id, userId: token.userId });
    } catch (error) {
      throw new Error(`Failed to store refresh token: ${error.message}`);
    }
  }

  async getRefreshToken(tokenId: string): Promise<RefreshToken | null> {
    try {
      const tokenData = this.refreshTokens.get(tokenId);
      if (!tokenData) {
        return null;
      }
      
      const token = tokenData.encrypted ? this.decryptRefreshToken(tokenData.token) : tokenData.token;
      
      // Check if token is expired or revoked
      if (token.expiresAt < new Date() || token.isRevoked) {
        await this.removeRefreshToken(tokenId);
        return null;
      }
      
      // Update last used timestamp
      token.lastUsedAt = new Date();
      
      return token;
    } catch (error) {
      throw new Error(`Failed to retrieve refresh token: ${error.message}`);
    }
  }

  async removeAccessToken(tokenId: string): Promise<void> {
    try {
      const existed = this.accessTokens.has(tokenId);
      this.accessTokens.delete(tokenId);
      this.updateStats();
      
      if (existed) {
        this.emit('token:removed', { type: 'access', tokenId });
      }
    } catch (error) {
      throw new Error(`Failed to remove access token: ${error.message}`);
    }
  }

  async removeRefreshToken(tokenId: string): Promise<void> {
    try {
      const existed = this.refreshTokens.has(tokenId);
      this.refreshTokens.delete(tokenId);
      this.updateStats();
      
      if (existed) {
        this.emit('token:removed', { type: 'refresh', tokenId });
      }
    } catch (error) {
      throw new Error(`Failed to remove refresh token: ${error.message}`);
    }
  }

  async getUserTokens(userId: string): Promise<{ accessTokens: AccessToken[]; refreshTokens: RefreshToken[] }> {
    try {
      const accessTokens: AccessToken[] = [];
      const refreshTokens: RefreshToken[] = [];
      
      // Get access tokens for user
      for (const [tokenId, tokenData] of this.accessTokens.entries()) {
        if (tokenData.userId === userId) {
          const token = tokenData.encrypted ? this.decryptAccessToken(tokenData.token) : tokenData.token;
          if (token.expiresAt >= new Date()) {
            accessTokens.push(token);
          }
        }
      }
      
      // Get refresh tokens for user
      for (const [tokenId, tokenData] of this.refreshTokens.entries()) {
        const token = tokenData.encrypted ? this.decryptRefreshToken(tokenData.token) : tokenData.token;
        if (token.userId === userId && token.expiresAt >= new Date() && !token.isRevoked) {
          refreshTokens.push(token);
        }
      }
      
      return { accessTokens, refreshTokens };
    } catch (error) {
      throw new Error(`Failed to get user tokens: ${error.message}`);
    }
  }

  async cleanupExpiredTokens(): Promise<number> {
    try {
      let cleanedCount = 0;
      const now = new Date();
      
      // Clean up expired access tokens
      for (const [tokenId, tokenData] of this.accessTokens.entries()) {
        const token = tokenData.encrypted ? this.decryptAccessToken(tokenData.token) : tokenData.token;
        if (token.expiresAt < now) {
          this.accessTokens.delete(tokenId);
          cleanedCount++;
        }
      }
      
      // Clean up expired or revoked refresh tokens
      for (const [tokenId, tokenData] of this.refreshTokens.entries()) {
        const token = tokenData.encrypted ? this.decryptRefreshToken(tokenData.token) : tokenData.token;
        if (token.expiresAt < now || token.isRevoked) {
          this.refreshTokens.delete(tokenId);
          cleanedCount++;
        }
      }
      
      this.stats.lastCleanup = new Date();
      this.stats.cleanupCount++;
      this.updateStats();
      
      if (cleanedCount > 0) {
        this.emit('tokens:cleaned', { count: cleanedCount });
      }
      
      return cleanedCount;
    } catch (error) {
      throw new Error(`Failed to cleanup expired tokens: ${error.message}`);
    }
  }

  getStats(): TokenStorageStats {
    return { ...this.stats };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private encryptAccessToken(token: AccessToken): AccessToken {
    if (!this.config.storage.encryptionKey) {
      return token;
    }
    
    try {
      const cipher = createCipher('aes-256-cbc', this.config.storage.encryptionKey);
      const tokenJson = JSON.stringify(token);
      let encrypted = cipher.update(tokenJson, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return {
        ...token,
        token: encrypted
      };
    } catch (error) {
      throw new Error(`Failed to encrypt access token: ${error.message}`);
    }
  }

  private encryptRefreshToken(token: RefreshToken): RefreshToken {
    if (!this.config.storage.encryptionKey) {
      return token;
    }
    
    try {
      const cipher = createCipher('aes-256-cbc', this.config.storage.encryptionKey);
      const tokenJson = JSON.stringify(token);
      let encrypted = cipher.update(tokenJson, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return {
        ...token,
        token: encrypted
      };
    } catch (error) {
      throw new Error(`Failed to encrypt refresh token: ${error.message}`);
    }
  }

  private decryptAccessToken(encryptedToken: AccessToken): AccessToken {
    if (!this.config.storage.encryptionKey) {
      return encryptedToken;
    }
    
    try {
      const decipher = createDecipher('aes-256-cbc', this.config.storage.encryptionKey);
      let decrypted = decipher.update(encryptedToken.token, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      throw new Error(`Failed to decrypt access token: ${error.message}`);
    }
  }

  private decryptRefreshToken(encryptedToken: RefreshToken): RefreshToken {
    if (!this.config.storage.encryptionKey) {
      return encryptedToken;
    }
    
    try {
      const decipher = createDecipher('aes-256-cbc', this.config.storage.encryptionKey);
      let decrypted = decipher.update(encryptedToken.token, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      throw new Error(`Failed to decrypt refresh token: ${error.message}`);
    }
  }

  private updateStats(): void {
    this.stats.accessTokenCount = this.accessTokens.size;
    this.stats.refreshTokenCount = this.refreshTokens.size;
    
    // Calculate expired token count
    const now = new Date();
    let expiredCount = 0;
    
    for (const tokenData of this.accessTokens.values()) {
      const token = tokenData.encrypted ? this.decryptAccessToken(tokenData.token) : tokenData.token;
      if (token.expiresAt < now) {
        expiredCount++;
      }
    }
    
    for (const tokenData of this.refreshTokens.values()) {
      const token = tokenData.encrypted ? this.decryptRefreshToken(tokenData.token) : tokenData.token;
      if (token.expiresAt < now || token.isRevoked) {
        expiredCount++;
      }
    }
    
    this.stats.expiredTokenCount = expiredCount;
    
    // Estimate storage size
    this.stats.storageSize = this.estimateStorageSize();
  }

  private estimateStorageSize(): number {
    let size = 0;
    
    for (const tokenData of this.accessTokens.values()) {
      size += JSON.stringify(tokenData).length;
    }
    
    for (const tokenData of this.refreshTokens.values()) {
      size += JSON.stringify(tokenData).length;
    }
    
    return size;
  }

  private setupCleanupInterval(): void {
    // Clean up expired tokens every hour
    setInterval(async () => {
      try {
        await this.cleanupExpiredTokens();
      } catch (error) {
        this.emit('error', error);
      }
    }, 60 * 60 * 1000);
  }
}

/**
 * Token Storage Factory
 * Creates appropriate token storage implementation based on configuration
 */
export class TokenStorageFactory {
  static create(config: AuthenticationConfig): TokenStorage {
    switch (config.storage.type) {
      case 'memory':
        return new MemoryTokenStorage(config);
      
      case 'file':
        // File-based storage would be implemented here
        throw new Error('File-based token storage not yet implemented');
      
      case 'database':
        // Database storage would be implemented here
        throw new Error('Database token storage not yet implemented');
      
      default:
        throw new Error(`Unsupported storage type: ${config.storage.type}`);
    }
  }
}
