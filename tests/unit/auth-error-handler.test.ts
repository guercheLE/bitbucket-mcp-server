/**
 * Authentication Error Handler Tests
 * 
 * Tests for the comprehensive authentication error handling system,
 * including error classification, recovery strategies, and user-friendly messages.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { EventEmitter } from 'events';
import {
  AuthenticationErrorHandler,
  ErrorRecoveryStrategy,
  ErrorRecoveryConfig,
  UserFriendlyError,
  FallbackAuthMethod
} from '../../src/server/auth/auth-error-handler';
import {
  AuthenticationError,
  AuthenticationErrorCode,
  AccessToken,
  RefreshToken,
  UserSession,
  UserSessionState
} from '../../src/types/auth';
import { TokenStorage } from '../../src/server/auth/token-storage';
import { BitbucketAPIManager } from '../../src/server/auth/bitbucket-api-manager';
import { AdvancedCryptoService } from '../../src/server/auth/advanced-crypto';

// Mock implementations
class MockTokenStorage extends EventEmitter implements TokenStorage {
  private tokens: Map<string, any> = new Map();
  
  async storeAccessToken(token: AccessToken, userId: string): Promise<void> {
    this.tokens.set(token.token, { token, userId });
  }
  
  async getAccessToken(tokenId: string): Promise<AccessToken | null> {
    const data = this.tokens.get(tokenId);
    return data ? data.token : null;
  }
  
  async storeRefreshToken(token: RefreshToken): Promise<void> {
    this.tokens.set(token.id, { token });
  }
  
  async getRefreshToken(tokenId: string): Promise<RefreshToken | null> {
    const data = this.tokens.get(tokenId);
    return data ? data.token : null;
  }
  
  async removeAccessToken(tokenId: string): Promise<void> {
    this.tokens.delete(tokenId);
  }
  
  async removeRefreshToken(tokenId: string): Promise<void> {
    this.tokens.delete(tokenId);
  }
  
  async getUserTokens(userId: string): Promise<{ accessTokens: AccessToken[]; refreshTokens: RefreshToken[] }> {
    const accessTokens: AccessToken[] = [];
    const refreshTokens: RefreshToken[] = [];
    
    for (const data of this.tokens.values()) {
      if (data.token && data.userId === userId) {
        if (data.token.token) {
          accessTokens.push(data.token);
        } else if (data.token.id) {
          refreshTokens.push(data.token);
        }
      }
    }
    
    return { accessTokens, refreshTokens };
  }
  
  async cleanupExpiredTokens(): Promise<number> {
    return 0;
  }
  
  getStats() {
    return {
      accessTokenCount: 0,
      refreshTokenCount: 0,
      expiredTokenCount: 0,
      storageSize: 0,
      lastCleanup: new Date(),
      cleanupCount: 0
    };
  }
}

class MockBitbucketAPIManager extends EventEmitter {
  async makeRequest() {
    return { instanceId: 'test', response: {} };
  }
}

class MockAdvancedCryptoService extends EventEmitter {
  async encryptToken() {
    return { encrypted: true };
  }
  
  async decryptToken() {
    return { decrypted: true };
  }
  
  destroy() {}
}

describe('AuthenticationErrorHandler', () => {
  let errorHandler: AuthenticationErrorHandler;
  let mockTokenStorage: MockTokenStorage;
  let mockApiManager: MockBitbucketAPIManager;
  let mockCryptoService: MockAdvancedCryptoService;
  let config: ErrorRecoveryConfig;

  beforeEach(() => {
    mockTokenStorage = new MockTokenStorage();
    mockApiManager = new MockBitbucketAPIManager();
    mockCryptoService = new MockAdvancedCryptoService();
    
    config = {
      maxRetries: 3,
      baseDelay: 100,
      maxDelay: 1000,
      enableTokenRefresh: true,
      enableFallbackAuth: true,
      networkTimeout: 5000,
      logRecoveryAttempts: true
    };
    
    errorHandler = new AuthenticationErrorHandler(
      config,
      mockTokenStorage,
      mockApiManager,
      mockCryptoService
    );
  });

  afterEach(() => {
    errorHandler.destroy();
  });

  describe('Error Classification', () => {
    it('should classify token expired error as refresh token strategy', async () => {
      const error: AuthenticationError = {
        code: AuthenticationErrorCode.TOKEN_EXPIRED,
        message: 'Token expired',
        timestamp: new Date(),
        isRecoverable: true
      };

      const result = await errorHandler.handleError(error, { sessionId: 'test-session' });
      
      expect(result.strategy).toBe(ErrorRecoveryStrategy.REFRESH_TOKEN);
    });

    it('should classify network error as retry strategy', async () => {
      const error: AuthenticationError = {
        code: AuthenticationErrorCode.NETWORK_ERROR,
        message: 'Network error',
        timestamp: new Date(),
        isRecoverable: true
      };

      const result = await errorHandler.handleError(error);
      
      expect(result.strategy).toBe(ErrorRecoveryStrategy.RETRY);
    });

    it('should classify session expired error as reauthenticate strategy', async () => {
      const error: AuthenticationError = {
        code: AuthenticationErrorCode.SESSION_EXPIRED,
        message: 'Session expired',
        timestamp: new Date(),
        isRecoverable: true
      };

      const result = await errorHandler.handleError(error);
      
      expect(result.strategy).toBe(ErrorRecoveryStrategy.REAUTHENTICATE);
    });

    it('should classify CSRF error as fail strategy', async () => {
      const error: AuthenticationError = {
        code: AuthenticationErrorCode.CSRF_TOKEN_MISMATCH,
        message: 'CSRF token mismatch',
        timestamp: new Date(),
        isRecoverable: false
      };

      const result = await errorHandler.handleError(error);
      
      expect(result.strategy).toBe(ErrorRecoveryStrategy.FAIL);
    });
  });

  describe('User-Friendly Error Messages', () => {
    it('should return user-friendly message for token expired error', () => {
      const error: AuthenticationError = {
        code: AuthenticationErrorCode.TOKEN_EXPIRED,
        message: 'Token expired',
        timestamp: new Date(),
        isRecoverable: true
      };

      const friendlyError = errorHandler.getUserFriendlyError(error);
      
      expect(friendlyError.title).toBe('Sessão expirada');
      expect(friendlyError.description).toContain('Sua sessão expirou');
      expect(friendlyError.recoverable).toBe(true);
    });

    it('should return user-friendly message for network error', () => {
      const error: AuthenticationError = {
        code: AuthenticationErrorCode.NETWORK_ERROR,
        message: 'Network error',
        timestamp: new Date(),
        isRecoverable: true
      };

      const friendlyError = errorHandler.getUserFriendlyError(error);
      
      expect(friendlyError.title).toBe('Erro de conexão');
      expect(friendlyError.description).toContain('Não foi possível conectar');
      expect(friendlyError.recoverable).toBe(true);
    });

    it('should return user-friendly message for unknown error', () => {
      const error: AuthenticationError = {
        code: 'unknown_error' as AuthenticationErrorCode,
        message: 'Unknown error',
        timestamp: new Date(),
        isRecoverable: false
      };

      const friendlyError = errorHandler.getUserFriendlyError(error);
      
      expect(friendlyError.title).toBe('Erro desconhecido');
      expect(friendlyError.description).toContain('Ocorreu um erro inesperado');
      expect(friendlyError.recoverable).toBe(false);
    });
  });

  describe('Fallback Authentication Methods', () => {
    it('should return available fallback methods', () => {
      const methods = errorHandler.getAvailableFallbackMethods();
      
      expect(methods).toHaveLength(3);
      expect(methods[0].id).toBe('basic_token');
      expect(methods[1].id).toBe('session_auth');
      expect(methods[2].id).toBe('anonymous');
    });

    it('should prioritize fallback methods by priority', () => {
      const methods = errorHandler.getAvailableFallbackMethods();
      
      expect(methods[0].priority).toBeLessThan(methods[1].priority);
      expect(methods[1].priority).toBeLessThan(methods[2].priority);
    });
  });

  describe('Recovery Statistics', () => {
    it('should track recovery statistics', async () => {
      const error: AuthenticationError = {
        code: AuthenticationErrorCode.TOKEN_EXPIRED,
        message: 'Token expired',
        timestamp: new Date(),
        isRecoverable: true
      };

      await errorHandler.handleError(error, { sessionId: 'test-session' });
      
      const stats = errorHandler.getRecoveryStats();
      expect(Object.keys(stats).length).toBeGreaterThan(0);
    });

    it('should reset statistics', async () => {
      const error: AuthenticationError = {
        code: AuthenticationErrorCode.TOKEN_EXPIRED,
        message: 'Token expired',
        timestamp: new Date(),
        isRecoverable: true
      };

      await errorHandler.handleError(error, { sessionId: 'test-session' });
      errorHandler.resetStats();
      
      const stats = errorHandler.getRecoveryStats();
      expect(Object.keys(stats)).toHaveLength(0);
    });
  });

  describe('Event Handling', () => {
    it('should emit recovery attempted event', (done) => {
      const error: AuthenticationError = {
        code: AuthenticationErrorCode.TOKEN_EXPIRED,
        message: 'Token expired',
        timestamp: new Date(),
        isRecoverable: true
      };

      errorHandler.on('recovery:attempted', (data) => {
        expect(data.error).toBe(error);
        expect(data.strategy).toBe(ErrorRecoveryStrategy.REFRESH_TOKEN);
        done();
      });

      errorHandler.handleError(error, { sessionId: 'test-session' });
    });

    it('should emit recovery completed event', (done) => {
      const error: AuthenticationError = {
        code: AuthenticationErrorCode.TOKEN_EXPIRED,
        message: 'Token expired',
        timestamp: new Date(),
        isRecoverable: true
      };

      errorHandler.on('recovery:completed', (data) => {
        expect(data.originalError).toBe(error);
        expect(data.strategy).toBe(ErrorRecoveryStrategy.REFRESH_TOKEN);
        done();
      });

      errorHandler.handleError(error, { sessionId: 'test-session' });
    });
  });

  describe('Configuration', () => {
    it('should respect max retries configuration', async () => {
      const limitedConfig: ErrorRecoveryConfig = {
        ...config,
        maxRetries: 1
      };
      
      const limitedErrorHandler = new AuthenticationErrorHandler(
        limitedConfig,
        mockTokenStorage,
        mockApiManager,
        mockCryptoService
      );

      const error: AuthenticationError = {
        code: AuthenticationErrorCode.NETWORK_ERROR,
        message: 'Network error',
        timestamp: new Date(),
        isRecoverable: true
      };

      const result = await limitedErrorHandler.handleError(error, { retryCount: 1 });
      
      expect(result.strategy).toBe(ErrorRecoveryStrategy.RETRY);
      expect(result.attempts).toBe(2);
      
      limitedErrorHandler.destroy();
    });

    it('should disable token refresh when configured', async () => {
      const noRefreshConfig: ErrorRecoveryConfig = {
        ...config,
        enableTokenRefresh: false
      };
      
      const noRefreshErrorHandler = new AuthenticationErrorHandler(
        noRefreshConfig,
        mockTokenStorage,
        mockApiManager,
        mockCryptoService
      );

      const error: AuthenticationError = {
        code: AuthenticationErrorCode.TOKEN_EXPIRED,
        message: 'Token expired',
        timestamp: new Date(),
        isRecoverable: true
      };

      const result = await noRefreshErrorHandler.handleError(error);
      
      expect(result.strategy).toBe(ErrorRecoveryStrategy.REAUTHENTICATE);
      
      noRefreshErrorHandler.destroy();
    });

    it('should disable fallback auth when configured', async () => {
      const noFallbackConfig: ErrorRecoveryConfig = {
        ...config,
        enableFallbackAuth: false
      };
      
      const noFallbackErrorHandler = new AuthenticationErrorHandler(
        noFallbackConfig,
        mockTokenStorage,
        mockApiManager,
        mockCryptoService
      );

      const error: AuthenticationError = {
        code: AuthenticationErrorCode.APPLICATION_NOT_FOUND,
        message: 'Application not found',
        timestamp: new Date(),
        isRecoverable: false
      };

      const result = await noFallbackErrorHandler.handleError(error);
      
      expect(result.strategy).toBe(ErrorRecoveryStrategy.FAIL);
      
      noFallbackErrorHandler.destroy();
    });
  });

  describe('Error Recovery Strategies', () => {
    it('should handle retry strategy with exponential backoff', async () => {
      const error: AuthenticationError = {
        code: AuthenticationErrorCode.NETWORK_ERROR,
        message: 'Network error',
        timestamp: new Date(),
        isRecoverable: true
      };

      const result = await errorHandler.handleError(error, { retryCount: 0 });
      
      expect(result.strategy).toBe(ErrorRecoveryStrategy.RETRY);
      expect(result.success).toBe(true);
    });

    it('should handle refresh token strategy', async () => {
      const error: AuthenticationError = {
        code: AuthenticationErrorCode.TOKEN_EXPIRED,
        message: 'Token expired',
        timestamp: new Date(),
        isRecoverable: true
      };

      const result = await errorHandler.handleError(error, { sessionId: 'test-session' });
      
      expect(result.strategy).toBe(ErrorRecoveryStrategy.REFRESH_TOKEN);
    });

    it('should handle reauthentication strategy', async () => {
      const error: AuthenticationError = {
        code: AuthenticationErrorCode.SESSION_EXPIRED,
        message: 'Session expired',
        timestamp: new Date(),
        isRecoverable: true
      };

      const result = await errorHandler.handleError(error, { sessionId: 'test-session' });
      
      expect(result.strategy).toBe(ErrorRecoveryStrategy.REAUTHENTICATE);
    });

    it('should handle fallback strategy', async () => {
      const error: AuthenticationError = {
        code: AuthenticationErrorCode.APPLICATION_NOT_FOUND,
        message: 'Application not found',
        timestamp: new Date(),
        isRecoverable: false
      };

      const result = await errorHandler.handleError(error);
      
      expect(result.strategy).toBe(ErrorRecoveryStrategy.FALLBACK);
    });
  });

  describe('Resource Cleanup', () => {
    it('should clean up resources on destroy', () => {
      const stats = errorHandler.getRecoveryStats();
      errorHandler.destroy();
      
      // Should not throw errors after destroy
      expect(() => errorHandler.getRecoveryStats()).not.toThrow();
    });
  });
});
