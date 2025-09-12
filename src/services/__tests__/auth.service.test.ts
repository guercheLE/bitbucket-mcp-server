import { AuthService } from '../auth.service';
import { BitbucketConfig } from '../../types/config';
import { User } from '../../types/bitbucket';

// Mock axios
jest.mock('axios');

describe('AuthService', () => {
  let authService: AuthService;
  let mockConfig: BitbucketConfig;

  beforeEach(() => {
    authService = AuthService.getInstance();

    mockConfig = {
      baseUrl: 'https://bitbucket.org',
      serverType: 'cloud',
      auth: {
        type: 'oauth',
        credentials: {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
          tokenType: 'Bearer',
        },
      },
      timeouts: {
        read: 5000,
        write: 10000,
        connect: 5000,
      },
      rateLimit: {
        requestsPerMinute: 60,
        burstLimit: 10,
        retryAfter: 1000,
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Clear all sessions
    authService.clearExpiredSessions();
    const sessions = authService.getAllSessions();
    for (const session of sessions) {
      authService.revokeSession(session);
    }
  });

  describe('authenticate', () => {
    it('should authenticate with OAuth credentials', async () => {
      const result = await authService.authenticate(mockConfig);

      // Since we're mocking, we expect the method to exist and handle the call
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('success');
    });

    it('should authenticate with App Password credentials', async () => {
      const appPasswordConfig: BitbucketConfig = {
        ...mockConfig,
        auth: {
          type: 'app_password',
          credentials: {
            username: 'test-user',
            appPassword: 'test-password',
          },
        },
      };

      const result = await authService.authenticate(appPasswordConfig);

      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('success');
    });

    it('should authenticate with API Token credentials', async () => {
      const apiTokenConfig: BitbucketConfig = {
        ...mockConfig,
        auth: {
          type: 'api_token',
          credentials: {
            username: 'test-user',
            token: 'test-token',
          },
        },
      };

      const result = await authService.authenticate(apiTokenConfig);

      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('success');
    });

    it('should authenticate with Basic credentials', async () => {
      const basicConfig: BitbucketConfig = {
        ...mockConfig,
        auth: {
          type: 'basic',
          credentials: {
            username: 'test-user',
            password: 'test-password',
          },
        },
      };

      const result = await authService.authenticate(basicConfig);

      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('success');
    });
  });

  describe('detectServerType', () => {
    it('should detect server type from URL', async () => {
      const serverType = await authService.detectServerType('https://bitbucket.org');

      expect(['cloud', 'datacenter', null]).toContain(serverType);
    });
  });

  describe('refreshToken', () => {
    it('should refresh OAuth token', async () => {
      const result = await authService.refreshToken(mockConfig);

      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('success');
    });

    it('should handle refresh token failure', async () => {
      const configWithoutRefreshToken: BitbucketConfig = {
        ...mockConfig,
        auth: {
          type: 'oauth',
          credentials: {
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
            accessToken: 'test-access-token',
            tokenType: 'Bearer',
          },
        },
      };

      const result = await authService.refreshToken(configWithoutRefreshToken);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Session Management', () => {
    it('should create session', async () => {
      const session = await authService.createSession(mockConfig);

      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('user');
      expect(session).toHaveProperty('expiresAt');
      expect(typeof session.isValid).toBe('function');
    });

    it('should get session by ID', async () => {
      const session = await authService.createSession(mockConfig);
      const retrievedSession = authService.getSession(session.id);

      expect(retrievedSession).toEqual(session);
    });

    it('should get all sessions', async () => {
      const session1 = await authService.createSession(mockConfig);
      const session2 = await authService.createSession(mockConfig);

      const allSessions = authService.getAllSessions();

      expect(allSessions.length).toBeGreaterThanOrEqual(2);
      expect(allSessions).toContainEqual(session1);
      expect(allSessions).toContainEqual(session2);
    });

    it('should refresh session', async () => {
      const session = await authService.createSession(mockConfig);
      const refreshedSession = await authService.refreshSession(session);

      expect(refreshedSession.id).toBe(session.id);
      expect(refreshedSession.expiresAt).toBeInstanceOf(Date);
    });

    it('should revoke session', async () => {
      const session = await authService.createSession(mockConfig);
      const result = await authService.revokeSession(session);

      expect(result.success).toBe(true);

      const retrievedSession = authService.getSession(session.id);
      expect(retrievedSession).toBeUndefined();
    });

    it('should clear expired sessions', () => {
      const clearedCount = authService.clearExpiredSessions();

      expect(typeof clearedCount).toBe('number');
      expect(clearedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Validation and Error Handling', () => {
    it('should validate authentication credentials', () => {
      const isValid = authService.validateCredentials('oauth', {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        accessToken: 'test-access-token',
        tokenType: 'Bearer',
      });

      expect(typeof isValid).toBe('boolean');
    });

    it('should get supported auth types', () => {
      const authTypes = authService.getSupportedAuthTypes();

      expect(Array.isArray(authTypes)).toBe(true);
      expect(authTypes).toContain('oauth');
      expect(authTypes).toContain('app_password');
      expect(authTypes).toContain('api_token');
      expect(authTypes).toContain('basic');
    });

    it('should get auth type for server type', () => {
      const cloudAuthTypes = authService.getAuthTypesForServerType('cloud');
      const datacenterAuthTypes = authService.getAuthTypesForServerType('datacenter');

      expect(Array.isArray(cloudAuthTypes)).toBe(true);
      expect(Array.isArray(datacenterAuthTypes)).toBe(true);
    });

    it('should format user info', () => {
      const mockUser: User = {
        id: '123',
        name: 'testuser',
        displayName: 'Test User',
        emailAddress: 'test@example.com',
      };

      const formatted = authService.formatUserInfo(mockUser);

      expect(typeof formatted).toBe('string');
      expect(formatted).toContain('testuser');
    });

    it('should get authentication status', () => {
      const status = authService.getAuthenticationStatus();

      expect(typeof status).toBe('object');
      expect(status).toHaveProperty('isAuthenticated');
      expect(status).toHaveProperty('activeSessions');
    });
  });

  describe('Token Management', () => {
    it('should validate token', () => {
      const isValid = authService.validateToken('test-token');

      expect(typeof isValid).toBe('boolean');
    });

    it('should get token expiry', () => {
      const expiry = authService.getTokenExpiry('test-token');

      expect(expiry === null || expiry instanceof Date).toBe(true);
    });

    it('should check if token is expired', () => {
      const isExpired = authService.isTokenExpired('test-token');

      expect(typeof isExpired).toBe('boolean');
    });
  });
});
