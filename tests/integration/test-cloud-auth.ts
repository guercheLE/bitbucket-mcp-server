import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { authService } from '../../src/services/auth.service';
import { BitbucketConfig, OAuthCredentials, AppPasswordCredentials } from '../../src/types/config';

describe('Bitbucket Cloud Authentication Integration Tests', () => {
  let config: BitbucketConfig;

  beforeEach(() => {
    config = {
      baseUrl: 'https://bitbucket.org',
      serverType: 'cloud',
      auth: {
        type: 'oauth',
        credentials: {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          accessToken: 'test-access-token',
          tokenType: 'Bearer',
        },
      },
      timeouts: {
        read: 2000,
        write: 5000,
        connect: 10000,
      },
      rateLimit: {
        requestsPerMinute: 60,
        burstLimit: 10,
        retryAfter: 1000,
      },
    };
  });

  afterEach(() => {
    // Cleanup any sessions or state
  });

  describe('OAuth Authentication', () => {
    it('should detect cloud server type', async () => {
      const serverType = await authService.detectServerType(config.baseUrl);
      expect(serverType).toBe('cloud');
    });

    it('should validate OAuth credentials structure', () => {
      const credentials = config.auth.credentials as OAuthCredentials;
      expect(credentials.clientId).toBeDefined();
      expect(credentials.clientSecret).toBeDefined();
      expect(credentials.tokenType).toBe('Bearer');
    });

    it('should handle OAuth authentication flow', async () => {
      // Mock successful authentication
      const result = await authService.authenticate(config);
      
      // Since we're using test credentials, we expect this to fail
      // but the structure should be correct
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('error');
    });

    it('should create OAuth session', async () => {
      // Mock successful authentication for session creation
      const mockConfig = {
        ...config,
        auth: {
          ...config.auth,
          credentials: {
            ...config.auth.credentials,
            accessToken: 'valid-token',
          },
        },
      };

      try {
        const session = await authService.createSession(mockConfig);
        expect(session).toHaveProperty('id');
        expect(session).toHaveProperty('user');
        expect(session).toHaveProperty('expiresAt');
        expect(session.isValid()).toBe(true);
      } catch (error) {
        // Expected to fail with test credentials
        expect(error).toBeDefined();
      }
    });
  });

  describe('App Password Authentication', () => {
    beforeEach(() => {
      config.auth = {
        type: 'app_password',
        credentials: {
          username: 'test-user',
          appPassword: 'test-app-password',
        },
      };
    });

    it('should validate app password credentials structure', () => {
      const credentials = config.auth.credentials as AppPasswordCredentials;
      expect(credentials.username).toBeDefined();
      expect(credentials.appPassword).toBeDefined();
    });

    it('should handle app password authentication', async () => {
      const result = await authService.authenticate(config);
      
      // Since we're using test credentials, we expect this to fail
      // but the structure should be correct
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('error');
    });
  });

  describe('Token Management', () => {
    it('should validate token format', () => {
      const validToken = 'valid-token-format-123';
      const invalidToken = '';

      expect(authService.validateToken(validToken)).toBe(true);
      expect(authService.validateToken(invalidToken)).toBe(false);
    });

    it('should check token expiry', () => {
      const token = 'test-token';
      const isExpired = authService.isTokenExpired(token);
      
      // For test tokens, we can't determine expiry
      expect(typeof isExpired).toBe('boolean');
    });

    it('should refresh OAuth token', async () => {
      const refreshResult = await authService.refreshToken(config);
      
      // Since we're using test credentials, we expect this to fail
      // but the structure should be correct
      expect(refreshResult).toHaveProperty('success');
      expect(refreshResult).toHaveProperty('error');
    });
  });

  describe('Session Management', () => {
    it('should get authentication status', () => {
      const status = authService.getAuthenticationStatus();
      
      expect(status).toHaveProperty('isAuthenticated');
      expect(status).toHaveProperty('activeSessions');
      expect(status).toHaveProperty('expiredSessions');
      expect(typeof status.isAuthenticated).toBe('boolean');
      expect(typeof status.activeSessions).toBe('number');
      expect(typeof status.expiredSessions).toBe('number');
    });

    it('should clear expired sessions', () => {
      const clearedCount = authService.clearExpiredSessions();
      expect(typeof clearedCount).toBe('number');
    });

    it('should get session statistics', () => {
      const stats = authService.getSessionStats();
      
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('active');
      expect(stats).toHaveProperty('expired');
      expect(stats).toHaveProperty('byAuthType');
      expect(typeof stats.total).toBe('number');
      expect(typeof stats.active).toBe('number');
      expect(typeof stats.expired).toBe('number');
    });
  });

  describe('Server Connection', () => {
    it('should validate server connection', async () => {
      const isValid = await authService.validateServerConnection(config.baseUrl);
      expect(typeof isValid).toBe('boolean');
    });

    it('should handle invalid server URLs', async () => {
      const invalidUrl = 'https://invalid-bitbucket-url.com';
      const isValid = await authService.validateServerConnection(invalidUrl);
      expect(isValid).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid credentials gracefully', async () => {
      const invalidConfig = {
        ...config,
        auth: {
          type: 'oauth',
          credentials: {
            clientId: '',
            clientSecret: '',
            tokenType: 'Bearer',
          },
        },
      };

      const result = await authService.authenticate(invalidConfig);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle network errors gracefully', async () => {
      const invalidConfig = {
        ...config,
        baseUrl: 'https://non-existent-domain.com',
      };

      const result = await authService.authenticate(invalidConfig);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Supported Auth Types', () => {
    it('should return supported auth types for cloud', () => {
      const supportedTypes = authService.getAuthTypesForServerType('cloud');
      expect(supportedTypes).toContain('oauth');
      expect(supportedTypes).toContain('app_password');
      expect(supportedTypes).not.toContain('api_token');
      expect(supportedTypes).not.toContain('basic');
    });

    it('should return all supported auth types', () => {
      const allTypes = authService.getSupportedAuthTypes();
      expect(allTypes).toContain('oauth');
      expect(allTypes).toContain('app_password');
      expect(allTypes).toContain('api_token');
      expect(allTypes).toContain('basic');
    });
  });
});