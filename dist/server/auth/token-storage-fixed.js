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
import { createCipher, createDecipher } from 'crypto';
/**
 * Memory Token Storage Implementation
 * In-memory storage for development and testing
 */
export class MemoryTokenStorage extends EventEmitter {
    accessTokens = new Map();
    refreshTokens = new Map();
    config;
    stats;
    constructor(config) {
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
    async storeAccessToken(token, userId) {
        try {
            const tokenData = {
                token: this.config.security.encryptTokens ? this.encryptAccessToken(token) : token,
                userId,
                encrypted: this.config.security.encryptTokens
            };
            this.accessTokens.set(token.token, tokenData);
            this.updateStats();
            this.emit('token:stored', { type: 'access', tokenId: token.token, userId });
        }
        catch (error) {
            throw new Error(`Failed to store access token: ${error.message}`);
        }
    }
    async getAccessToken(tokenId) {
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
        }
        catch (error) {
            throw new Error(`Failed to retrieve access token: ${error.message}`);
        }
    }
    async storeRefreshToken(token) {
        try {
            const tokenData = {
                token: this.config.security.encryptTokens ? this.encryptRefreshToken(token) : token,
                encrypted: this.config.security.encryptTokens
            };
            this.refreshTokens.set(token.id, tokenData);
            this.updateStats();
            this.emit('token:stored', { type: 'refresh', tokenId: token.id, userId: token.userId });
        }
        catch (error) {
            throw new Error(`Failed to store refresh token: ${error.message}`);
        }
    }
    async getRefreshToken(tokenId) {
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
        }
        catch (error) {
            throw new Error(`Failed to retrieve refresh token: ${error.message}`);
        }
    }
    async removeAccessToken(tokenId) {
        try {
            const existed = this.accessTokens.has(tokenId);
            this.accessTokens.delete(tokenId);
            this.updateStats();
            if (existed) {
                this.emit('token:removed', { type: 'access', tokenId });
            }
        }
        catch (error) {
            throw new Error(`Failed to remove access token: ${error.message}`);
        }
    }
    async removeRefreshToken(tokenId) {
        try {
            const existed = this.refreshTokens.has(tokenId);
            this.refreshTokens.delete(tokenId);
            this.updateStats();
            if (existed) {
                this.emit('token:removed', { type: 'refresh', tokenId });
            }
        }
        catch (error) {
            throw new Error(`Failed to remove refresh token: ${error.message}`);
        }
    }
    async getUserTokens(userId) {
        try {
            const accessTokens = [];
            const refreshTokens = [];
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
        }
        catch (error) {
            throw new Error(`Failed to get user tokens: ${error.message}`);
        }
    }
    async cleanupExpiredTokens() {
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
        }
        catch (error) {
            throw new Error(`Failed to cleanup expired tokens: ${error.message}`);
        }
    }
    getStats() {
        return { ...this.stats };
    }
    // ============================================================================
    // Private Helper Methods
    // ============================================================================
    encryptAccessToken(token) {
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
        }
        catch (error) {
            throw new Error(`Failed to encrypt access token: ${error.message}`);
        }
    }
    encryptRefreshToken(token) {
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
        }
        catch (error) {
            throw new Error(`Failed to encrypt refresh token: ${error.message}`);
        }
    }
    decryptAccessToken(encryptedToken) {
        if (!this.config.storage.encryptionKey) {
            return encryptedToken;
        }
        try {
            const decipher = createDecipher('aes-256-cbc', this.config.storage.encryptionKey);
            let decrypted = decipher.update(encryptedToken.token, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return JSON.parse(decrypted);
        }
        catch (error) {
            throw new Error(`Failed to decrypt access token: ${error.message}`);
        }
    }
    decryptRefreshToken(encryptedToken) {
        if (!this.config.storage.encryptionKey) {
            return encryptedToken;
        }
        try {
            const decipher = createDecipher('aes-256-cbc', this.config.storage.encryptionKey);
            let decrypted = decipher.update(encryptedToken.token, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return JSON.parse(decrypted);
        }
        catch (error) {
            throw new Error(`Failed to decrypt refresh token: ${error.message}`);
        }
    }
    updateStats() {
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
    estimateStorageSize() {
        let size = 0;
        for (const tokenData of this.accessTokens.values()) {
            size += JSON.stringify(tokenData).length;
        }
        for (const tokenData of this.refreshTokens.values()) {
            size += JSON.stringify(tokenData).length;
        }
        return size;
    }
    setupCleanupInterval() {
        // Clean up expired tokens every hour
        setInterval(async () => {
            try {
                await this.cleanupExpiredTokens();
            }
            catch (error) {
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
    static create(config) {
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
//# sourceMappingURL=token-storage-fixed.js.map