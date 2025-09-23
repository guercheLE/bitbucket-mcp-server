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
import { randomBytes } from 'crypto';
import {
  AccessToken,
  RefreshToken,
  AuthenticationError,
  AuthenticationErrorCode,
  AuthenticationResponse,
  AuthenticationConfig
} from '../../types/auth';
import { TokenStorage, TokenStorageFactory } from './token-storage';
import { BitbucketApiClient } from './bitbucket-api-client';

/**
 * Token Manager Class
 * Manages token lifecycle and operations
 */
export class TokenManager extends EventEmitter {
  private storage: TokenStorage;
  private config: AuthenticationConfig;
  private validationCache: Map<string, { token: AccessToken; validatedAt: Date }> = new Map();

  constructor(config: AuthenticationConfig) {
    super();
    this.config = config;
    this.storage = TokenStorageFactory.create(config);
    this.setupEventHandlers();
    this.setupCleanupInterval();
  }

  // ============================================================================
  // Token Storage Operations
  // ============================================================================

  /**
   * Store access token
   */
  async storeAccessToken(token: AccessToken, userId: string): Promise<AuthenticationResponse<void>> {
    try {
      await this.storage.storeAccessToken(token, userId);
      
      return {
        success: true,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0
        }
      };
    } catch (error) {
      return this.handleError(error, 'Failed to store access token');
    }
  }

  /**
   * Store refresh token
   */
  async storeRefreshToken(token: RefreshToken): Promise<AuthenticationResponse<void>> {
    try {
      await this.storage.storeRefreshToken(token);
      
      return {
        success: true,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0
        }
      };
    } catch (error) {
      return this.handleError(error, 'Failed to store refresh token');
    }
  }

  /**
   * Get access token by ID
   */
  async getAccessToken(tokenId: string): Promise<AuthenticationResponse<AccessToken>> {
    try {
      const token = await this.storage.getAccessToken(tokenId);
      
      if (!token) {
        throw new AuthenticationError({
          code: AuthenticationErrorCode.TOKEN_INVALID,
          message: 'Access token not found or expired',
          timestamp: new Date(),
          isRecoverable: false
        });
      }

      return {
        success: true,
        data: token,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0
        }
      };
    } catch (error) {
      return this.handleError(error, 'Failed to get access token');
    }
  }

  /**
   * Get refresh token by ID
   */
  async getRefreshToken(tokenId: string): Promise<AuthenticationResponse<RefreshToken>> {
    try {
      const token = await this.storage.getRefreshToken(tokenId);
      
      if (!token) {
        throw new AuthenticationError({
          code: AuthenticationErrorCode.TOKEN_INVALID,
          message: 'Refresh token not found or expired',
          timestamp: new Date(),
          isRecoverable: false
        });
      }

      return {
        success: true,
        data: token,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0
        }
      };
    } catch (error) {
      return this.handleError(error, 'Failed to get refresh token');
    }
  }

  // ============================================================================
  // Token Validation
  // ============================================================================

  /**
   * Validate access token
   */
  async validateAccessToken(token: string): Promise<AuthenticationResponse<AccessToken>> {
    try {
      // Check cache first
      const cached = this.validationCache.get(token);
      if (cached && this.isCacheValid(cached.validatedAt)) {
        return {
          success: true,
          data: cached.token,
          metadata: {
            timestamp: new Date(),
            requestId: this.generateRequestId(),
            processingTime: 0
          }
        };
      }

      // Get token from storage
      const tokenResponse = await this.getAccessToken(token);
      if (!tokenResponse.success || !tokenResponse.data) {
        return tokenResponse;
      }

      const accessToken = tokenResponse.data;

      // Validate token properties
      if (!accessToken.isValid) {
        throw new AuthenticationError({
          code: AuthenticationErrorCode.TOKEN_INVALID,
          message: 'Access token is marked as invalid',
          timestamp: new Date(),
          isRecoverable: false
        });
      }

      if (accessToken.expiresAt < new Date()) {
        throw new AuthenticationError({
          code: AuthenticationErrorCode.TOKEN_EXPIRED,
          message: 'Access token has expired',
          timestamp: new Date(),
          isRecoverable: false
        });
      }

      // Cache validated token
      this.validationCache.set(token, {
        token: accessToken,
        validatedAt: new Date()
      });

      return {
        success: true,
        data: accessToken,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0
        }
      };
    } catch (error) {
      return this.handleError(error, 'Failed to validate access token');
    }
  }

  /**
   * Validate refresh token
   */
  async validateRefreshToken(tokenId: string): Promise<AuthenticationResponse<RefreshToken>> {
    try {
      const tokenResponse = await this.getRefreshToken(tokenId);
      if (!tokenResponse.success || !tokenResponse.data) {
        return tokenResponse;
      }

      const refreshToken = tokenResponse.data;

      // Validate token properties
      if (!refreshToken.isValid) {
        throw new AuthenticationError({
          code: AuthenticationErrorCode.TOKEN_INVALID,
          message: 'Refresh token is marked as invalid',
          timestamp: new Date(),
          isRecoverable: false
        });
      }

      if (refreshToken.isRevoked) {
        throw new AuthenticationError({
          code: AuthenticationErrorCode.TOKEN_REVOKED,
          message: 'Refresh token has been revoked',
          timestamp: new Date(),
          isRecoverable: false
        });
      }

      if (refreshToken.expiresAt < new Date()) {
        throw new AuthenticationError({
          code: AuthenticationErrorCode.TOKEN_EXPIRED,
          message: 'Refresh token has expired',
          timestamp: new Date(),
          isRecoverable: false
        });
      }

      return {
        success: true,
        data: refreshToken,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0
        }
      };
    } catch (error) {
      return this.handleError(error, 'Failed to validate refresh token');
    }
  }

  // ============================================================================
  // Token Refresh Operations
  // ============================================================================

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(
    refreshTokenId: string,
    applicationId: string,
    baseUrl: string,
    instanceType: 'datacenter' | 'cloud'
  ): Promise<AuthenticationResponse<AccessToken>> {
    try {
      // Validate refresh token
      const refreshResponse = await this.validateRefreshToken(refreshTokenId);
      if (!refreshResponse.success || !refreshResponse.data) {
        return refreshResponse as AuthenticationResponse<AccessToken>;
      }

      const refreshToken = refreshResponse.data;

      // Create API client and refresh token
      const apiClient = new BitbucketApiClient(baseUrl, instanceType);
      const tokenResponse = await apiClient.refreshAccessToken(
        applicationId,
        refreshToken.token
      );

      // Create new access token
      const newAccessToken: AccessToken = {
        token: tokenResponse.access_token,
        tokenType: tokenResponse.token_type || 'Bearer',
        expiresAt: new Date(Date.now() + (tokenResponse.expires_in * 1000)),
        scope: tokenResponse.scope ? tokenResponse.scope.split(' ') : [],
        refreshTokenId: refreshToken.id,
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isValid: true
      };

      // Store new access token
      await this.storage.storeAccessToken(newAccessToken, refreshToken.userId);

      // Update refresh token usage
      refreshToken.lastUsedAt = new Date();
      await this.storage.storeRefreshToken(refreshToken);

      // Emit event
      this.emit('token:refreshed', {
        refreshTokenId,
        newAccessToken,
        userId: refreshToken.userId
      });

      return {
        success: true,
        data: newAccessToken,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0
        }
      };
    } catch (error) {
      return this.handleError(error, 'Failed to refresh access token');
    }
  }

  // ============================================================================
  // Token Revocation
  // ============================================================================

  /**
   * Revoke access token
   */
  async revokeAccessToken(
    tokenId: string,
    applicationId: string,
    baseUrl: string,
    instanceType: 'datacenter' | 'cloud'
  ): Promise<AuthenticationResponse<void>> {
    try {
      // Get token before revoking
      const tokenResponse = await this.getAccessToken(tokenId);
      if (!tokenResponse.success || !tokenResponse.data) {
        return tokenResponse as AuthenticationResponse<void>;
      }

      const token = tokenResponse.data;

      // Revoke token with Bitbucket API
      const apiClient = new BitbucketApiClient(baseUrl, instanceType);
      await apiClient.revokeToken(applicationId, token.token, 'access_token');

      // Remove from storage
      await this.storage.removeAccessToken(tokenId);

      // Remove from cache
      this.validationCache.delete(tokenId);

      // Emit event
      this.emit('token:revoked', { type: 'access', tokenId });

      return {
        success: true,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0
        }
      };
    } catch (error) {
      return this.handleError(error, 'Failed to revoke access token');
    }
  }

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(
    tokenId: string,
    applicationId: string,
    baseUrl: string,
    instanceType: 'datacenter' | 'cloud'
  ): Promise<AuthenticationResponse<void>> {
    try {
      // Get token before revoking
      const tokenResponse = await this.getRefreshToken(tokenId);
      if (!tokenResponse.success || !tokenResponse.data) {
        return tokenResponse as AuthenticationResponse<void>;
      }

      const token = tokenResponse.data;

      // Revoke token with Bitbucket API
      const apiClient = new BitbucketApiClient(baseUrl, instanceType);
      await apiClient.revokeToken(applicationId, token.token, 'refresh_token');

      // Remove from storage
      await this.storage.removeRefreshToken(tokenId);

      // Emit event
      this.emit('token:revoked', { type: 'refresh', tokenId });

      return {
        success: true,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0
        }
      };
    } catch (error) {
      return this.handleError(error, 'Failed to revoke refresh token');
    }
  }

  /**
   * Revoke all tokens for a user
   */
  async revokeUserTokens(
    userId: string,
    applicationId: string,
    baseUrl: string,
    instanceType: 'datacenter' | 'cloud'
  ): Promise<AuthenticationResponse<void>> {
    try {
      const userTokens = await this.storage.getUserTokens(userId);
      const apiClient = new BitbucketApiClient(baseUrl, instanceType);

      // Revoke all access tokens
      for (const token of userTokens.accessTokens) {
        try {
          await apiClient.revokeToken(applicationId, token.token, 'access_token');
          await this.storage.removeAccessToken(token.token);
          this.validationCache.delete(token.token);
        } catch (error) {
          // Continue with other tokens even if one fails
          console.warn(`Failed to revoke access token ${token.token}:`, error.message);
        }
      }

      // Revoke all refresh tokens
      for (const token of userTokens.refreshTokens) {
        try {
          await apiClient.revokeToken(applicationId, token.token, 'refresh_token');
          await this.storage.removeRefreshToken(token.id);
        } catch (error) {
          // Continue with other tokens even if one fails
          console.warn(`Failed to revoke refresh token ${token.id}:`, error.message);
        }
      }

      // Emit event
      this.emit('tokens:revoked', { userId, count: userTokens.accessTokens.length + userTokens.refreshTokens.length });

      return {
        success: true,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0
        }
      };
    } catch (error) {
      return this.handleError(error, 'Failed to revoke user tokens');
    }
  }

  // ============================================================================
  // Token Lifecycle Management
  // ============================================================================

  /**
   * Check if token needs refresh
   */
  needsRefresh(token: AccessToken): boolean {
    const refreshThreshold = this.config.tokens.refreshThreshold;
    return token.expiresAt.getTime() - Date.now() < refreshThreshold;
  }

  /**
   * Get token expiration time
   */
  getTokenExpiration(token: AccessToken): Date {
    return token.expiresAt;
  }

  /**
   * Get time until token expires
   */
  getTimeUntilExpiration(token: AccessToken): number {
    return token.expiresAt.getTime() - Date.now();
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<AuthenticationResponse<number>> {
    try {
      const cleanedCount = await this.storage.cleanupExpiredTokens();
      
      // Clear validation cache
      this.clearValidationCache();

      return {
        success: true,
        data: cleanedCount,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0
        }
      };
    } catch (error) {
      return this.handleError(error, 'Failed to cleanup expired tokens');
    }
  }

  /**
   * Get storage statistics
   */
  getStorageStats() {
    return this.storage.getStats();
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private setupEventHandlers(): void {
    this.storage.on('token:stored', (data) => {
      this.emit('token:stored', data);
    });

    this.storage.on('token:removed', (data) => {
      this.emit('token:removed', data);
    });

    this.storage.on('tokens:cleaned', (data) => {
      this.emit('tokens:cleaned', data);
    });

    this.storage.on('error', (error) => {
      this.emit('error', error);
    });
  }

  private setupCleanupInterval(): void {
    // Clean up expired tokens every 30 minutes
    setInterval(async () => {
      try {
        await this.cleanupExpiredTokens();
      } catch (error) {
        this.emit('error', error);
      }
    }, 30 * 60 * 1000);
  }

  private isCacheValid(validatedAt: Date): boolean {
    const cacheValidity = 5 * 60 * 1000; // 5 minutes
    return Date.now() - validatedAt.getTime() < cacheValidity;
  }

  private clearValidationCache(): void {
    this.validationCache.clear();
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleError(error: any, context: string): AuthenticationResponse {
    const authError: AuthenticationError = {
      code: error.code || AuthenticationErrorCode.INTERNAL_ERROR,
      message: error.message || context,
      details: error.details,
      timestamp: new Date(),
      isRecoverable: error.isRecoverable !== undefined ? error.isRecoverable : true
    };

    this.emit('error', authError);

    return {
      success: false,
      error: authError,
      metadata: {
        timestamp: new Date(),
        requestId: this.generateRequestId(),
        processingTime: 0
      }
    };
  }
}
