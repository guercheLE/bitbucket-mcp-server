/**
 * Token Manager for Bitbucket MCP Server
 *
 * This module provides high-level token management functionality,
 * including token validation, refresh, revocation, and lifecycle management.
 * It integrates with the token storage system and provides a unified interface.
 *
 * Key Features:
 * - Token validation and verification
 * - Automatic token refresh
 * - Token revocation and cleanup
 * - Token lifecycle management
 * - Security monitoring and auditing
 *
 * Constitutional Requirements:
 * - Secure token management
 * - Comprehensive error handling
 * - Performance optimization
 * - Security auditing
 */
import { EventEmitter } from 'events';
import { AccessToken, RefreshToken, AuthenticationResponse, AuthenticationConfig } from '../../types/auth';
/**
 * Token Manager Class
 * Manages token lifecycle and operations
 */
export declare class TokenManager extends EventEmitter {
    private storage;
    private config;
    private validationCache;
    constructor(config: AuthenticationConfig);
    /**
     * Store access token
     */
    storeAccessToken(token: AccessToken, userId: string): Promise<AuthenticationResponse<void>>;
    /**
     * Store refresh token
     */
    storeRefreshToken(token: RefreshToken): Promise<AuthenticationResponse<void>>;
    /**
     * Get access token by ID
     */
    getAccessToken(tokenId: string): Promise<AuthenticationResponse<AccessToken>>;
    /**
     * Get refresh token by ID
     */
    getRefreshToken(tokenId: string): Promise<AuthenticationResponse<RefreshToken>>;
    /**
     * Validate access token
     */
    validateAccessToken(token: string): Promise<AuthenticationResponse<AccessToken>>;
    /**
     * Validate refresh token
     */
    validateRefreshToken(tokenId: string): Promise<AuthenticationResponse<RefreshToken>>;
    /**
     * Refresh access token using refresh token
     */
    refreshAccessToken(refreshTokenId: string, applicationId: string, baseUrl: string, instanceType: 'datacenter' | 'cloud'): Promise<AuthenticationResponse<AccessToken>>;
    /**
     * Revoke access token
     */
    revokeAccessToken(tokenId: string, applicationId: string, baseUrl: string, instanceType: 'datacenter' | 'cloud'): Promise<AuthenticationResponse<void>>;
    /**
     * Revoke refresh token
     */
    revokeRefreshToken(tokenId: string, applicationId: string, baseUrl: string, instanceType: 'datacenter' | 'cloud'): Promise<AuthenticationResponse<void>>;
    /**
     * Revoke all tokens for a user
     */
    revokeUserTokens(userId: string, applicationId: string, baseUrl: string, instanceType: 'datacenter' | 'cloud'): Promise<AuthenticationResponse<void>>;
    /**
     * Check if token needs refresh
     */
    needsRefresh(token: AccessToken): boolean;
    /**
     * Get token expiration time
     */
    getTokenExpiration(token: AccessToken): Date;
    /**
     * Get time until token expires
     */
    getTimeUntilExpiration(token: AccessToken): number;
    /**
     * Clean up expired tokens
     */
    cleanupExpiredTokens(): Promise<AuthenticationResponse<number>>;
    /**
     * Get storage statistics
     */
    getStorageStats(): import("./token-storage").TokenStorageStats;
    private setupEventHandlers;
    private setupCleanupInterval;
    private isCacheValid;
    private clearValidationCache;
    private generateRequestId;
    private handleError;
}
//# sourceMappingURL=token-manager.d.ts.map