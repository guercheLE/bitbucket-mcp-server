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
import { AccessToken, RefreshToken, AuthenticationConfig } from '../../types/auth';
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
    getUserTokens(userId: string): Promise<{
        accessTokens: AccessToken[];
        refreshTokens: RefreshToken[];
    }>;
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
export declare class MemoryTokenStorage extends EventEmitter implements TokenStorage {
    private accessTokens;
    private refreshTokens;
    private config;
    private stats;
    constructor(config: AuthenticationConfig);
    storeAccessToken(token: AccessToken, userId: string): Promise<void>;
    getAccessToken(tokenId: string): Promise<AccessToken | null>;
    storeRefreshToken(token: RefreshToken): Promise<void>;
    getRefreshToken(tokenId: string): Promise<RefreshToken | null>;
    removeAccessToken(tokenId: string): Promise<void>;
    removeRefreshToken(tokenId: string): Promise<void>;
    getUserTokens(userId: string): Promise<{
        accessTokens: AccessToken[];
        refreshTokens: RefreshToken[];
    }>;
    cleanupExpiredTokens(): Promise<number>;
    getStats(): TokenStorageStats;
    private encryptAccessToken;
    private encryptRefreshToken;
    private decryptAccessToken;
    private decryptRefreshToken;
    private updateStats;
    private estimateStorageSize;
    private setupCleanupInterval;
}
/**
 * Token Storage Factory
 * Creates appropriate token storage implementation based on configuration
 */
export declare class TokenStorageFactory {
    static create(config: AuthenticationConfig): TokenStorage;
}
//# sourceMappingURL=token-storage-fixed.d.ts.map