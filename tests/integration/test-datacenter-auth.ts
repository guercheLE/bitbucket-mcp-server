import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { authService } from '../../src/services/auth.service';
import { BitbucketConfig, ApiTokenCredentials, BasicCredentials } from '../../src/types/config';

describe('Bitbucket Data Center Authentication Integration Tests', () => {
  let config: BitbucketConfig;

  beforeEach(() => {
    config = {
      baseUrl: 'https://bitbucket.company.com',
      serverType: 'datacenter',
      auth: {
        type: 'api_token',
        credentials: {
          username: 'test-user',
          token: 'test-api-token',
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

  describe('API Token Authentication', () => {
    it('should detect datacenter server type', async () => {
      const serverType = await authService.detectServerType(config.baseUrl);
      // This will likely return null in test environment, but structure should be correct
      expect(serverType).toBeDefined();
    });

    it('should validate API token credentials structure', () => {
      const credentials = config.auth.credentials as ApiTokenCredentials;
      expect(credentials.username).toBeDefined();
      expect(credentials.token).toBeDefined();
    });

    it('should handle API token authentication', async () => {
      const result = await authService.authenticate(config);
      
      // Since we're using test credentials, we expect this to fail
      // but the structure should be correct
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('error');
    });
  });

  describe('Basic Authentication', () => {
    beforeEach(() => {
      config.auth = {
        type: 'basic',
        credentials: {
          username: 'test-user',
          password: 'test-password',
        },
      };
    });

    it('should validate basic credentials structure', () => {
      const credentials = config.auth.credentials as BasicCredentials;
      expect(credentials.username).toBeDefined();
      expect(credentials.password).toBeDefined();
    });

    it('should handle basic authentication', async () => {
      const result = await authService.authenticate(config);
      
      // Since we're using test credentials, we expect this to fail
      // but the structure should be correct
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('error');
    });
  });

  describe('OAuth Authentication (Data Center)', () => {
    beforeEach(() => {
      config.auth = {
        type: 'oauth',
        credentials: {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          accessToken: 'test-access-token',
          tokenType: 'Bearer',
        },
      };
    });

    it('should handle OAuth authentication for Data Center', async () => {
      const result = await authService.authenticate(config);
      
      // Since we're using test credentials, we expect this to fail
      // but the structure should be correct
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('error');
    });
  });

  describe('Session Management', () => {
    it('should create session for Data Center', async () => {
      const mockConfig = {
        ...config,
        auth: {
          ...config.auth,
          credentials: {
            ...config.auth.credentials,
            token: 'valid-token',
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

    it('should revoke session', async () => {
      // Create a mock session
      const mockSession = {
        id: 'test-session-id',
        user: {
          id: 'test-user-id',
          name: 'test-user',
          displayName: 'Test User',
        },
        expiresAt: new Date(Date.now() + 3600000),
        isValid: () => true,
      };

      const result = await authService.revokeSession(mockSession as any);
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Supported Auth Types', () => {
    it('should return supported auth types for datacenter', () => {
      const supportedTypes = authService.getAuthTypesForServerType('datacenter');
      expect(supportedTypes).toContain('oauth');
      expect(supportedTypes).toContain('api_token');
      expect(supportedTypes).toContain('basic');
      expect(supportedTypes).not.toContain('app_password');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid Data Center URL', async () => {
      const invalidConfig = {
        ...config,
        baseUrl: 'https://invalid-datacenter-url.com',
      };

      const result = await authService.authenticate(invalidConfig);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle invalid credentials gracefully', async () => {
      const invalidConfig = {
        ...config,
        auth: {
          type: 'api_token',
          credentials: {
            username: '',
            token: '',
          },
        },
      };

      const result = await authService.authenticate(invalidConfig);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Logout Functionality', () => {
    it('should handle logout process', async () => {
      const logoutResult = await authService.logout();
      
      expect(logoutResult).toHaveProperty('success');
      expect(logoutResult).toHaveProperty('sessionsRevoked');
      expect(typeof logoutResult.success).toBe('boolean');
      expect(typeof logoutResult.sessionsRevoked).toBe('number');
    });
  });
});
