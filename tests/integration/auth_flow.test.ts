import { AuthenticationService } from '../../src/services/AuthenticationService';
import { ServerDetectionService } from '../../src/services/server-detection';

/**
 * Integration test for authentication flow
 * T015: Integration test authentication flow in tests/integration/test_auth_flow.ts
 * 
 * This test MUST fail before implementation (Constitution Article V - TDD)
 * Tests OAuth 2.0, Personal Access Tokens, App Passwords, and Basic Auth
 */

describe('Authentication Flow Integration Tests', () => {
  let authService: AuthenticationService;
  let serverDetectionService: ServerDetectionService;

  beforeEach(() => {
    authService = new AuthenticationService();
    serverDetectionService = new ServerDetectionService();
  });

  describe('OAuth 2.0 Flow', () => {
    it('should complete OAuth 2.0 authorization code flow', async () => {
      const serverInfo = {
        serverType: 'datacenter' as const,
        version: '7.16.0',
        baseUrl: 'https://bitbucket.example.com',
        isSupported: true
      };

      // Step 1: Get authorization URL
      const authUrl = await authService.getAuthorizationUrl({
        serverInfo,
        clientId: 'test-client-id',
        redirectUri: 'https://example.com/callback',
        scope: 'read write'
      });

      expect(authUrl).toContain('https://bitbucket.example.com/oauth/authorize');
      expect(authUrl).toContain('client_id=test-client-id');
      expect(authUrl).toContain('redirect_uri=');
      expect(authUrl).toContain('scope=read+write');

      // Step 2: Exchange authorization code for token
      const tokenResponse = await authService.exchangeCodeForToken({
        serverInfo,
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        code: 'test-auth-code',
        redirectUri: 'https://example.com/callback'
      });

      expect(tokenResponse).toHaveProperty('access_token');
      expect(tokenResponse).toHaveProperty('token_type', 'Bearer');
      expect(tokenResponse).toHaveProperty('expires_in');
      expect(tokenResponse).toHaveProperty('refresh_token');
    });

    it('should handle OAuth 2.0 refresh token flow', async () => {
      const serverInfo = {
        serverType: 'datacenter' as const,
        version: '7.16.0',
        baseUrl: 'https://bitbucket.example.com',
        isSupported: true
      };

      const refreshResponse = await authService.refreshToken({
        serverInfo,
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        refreshToken: 'test-refresh-token'
      });

      expect(refreshResponse).toHaveProperty('access_token');
      expect(refreshResponse).toHaveProperty('token_type', 'Bearer');
      expect(refreshResponse).toHaveProperty('expires_in');
    });

    it('should handle OAuth 2.0 PKCE flow', async () => {
      const serverInfo = {
        serverType: 'cloud',
        version: '2.0',
        baseUrl: 'https://bitbucket.org',
        isSupported: true
      };

      // Generate PKCE parameters
      const pkceParams = await authService.generatePKCEParams();
      
      expect(pkceParams).toHaveProperty('code_challenge');
      expect(pkceParams).toHaveProperty('code_verifier');
      expect(pkceParams).toHaveProperty('code_challenge_method', 'S256');

      // Get authorization URL with PKCE
      const authUrl = await authService.getAuthorizationUrl({
        serverInfo,
        clientId: 'test-client-id',
        redirectUri: 'https://example.com/callback',
        scope: 'read write',
        codeChallenge: pkceParams.code_challenge,
        codeChallengeMethod: 'S256'
      });

      expect(authUrl).toContain('code_challenge=');
      expect(authUrl).toContain('code_challenge_method=S256');
    });
  });

  describe('Personal Access Token Flow', () => {
    it('should authenticate with Personal Access Token', async () => {
      const serverInfo = {
        serverType: 'datacenter' as const,
        version: '7.16.0',
        baseUrl: 'https://bitbucket.example.com',
        isSupported: true
      };

      const authResult = await authService.authenticateWithToken({
        serverInfo,
        token: 'test-personal-access-token',
        tokenType: 'personal'
      });

      expect(authResult).toHaveProperty('access_token', 'test-personal-access-token');
      expect(authResult).toHaveProperty('token_type', 'Bearer');
      expect(authResult).toHaveProperty('authenticated', true);
    });

    it('should validate Personal Access Token permissions', async () => {
      const serverInfo = {
        serverType: 'datacenter' as const,
        version: '7.16.0',
        baseUrl: 'https://bitbucket.example.com',
        isSupported: true
      };

      const authResult = await authService.authenticateWithToken({
        serverInfo,
        token: 'test-personal-access-token',
        tokenType: 'personal'
      });

      expect(authResult).toHaveProperty('permissions');
      expect(authResult.permissions).toContain('read');
      expect(authResult.permissions).toContain('write');
    });
  });

  describe('App Password Flow', () => {
    it('should authenticate with App Password', async () => {
      const serverInfo = {
        serverType: 'cloud',
        version: '2.0',
        baseUrl: 'https://bitbucket.org',
        isSupported: true
      };

      const authResult = await authService.authenticateWithAppPassword({
        serverInfo,
        username: 'test-user',
        appPassword: 'test-app-password'
      });

      expect(authResult).toHaveProperty('authenticated', true);
      expect(authResult).toHaveProperty('username', 'test-user');
    });

    it('should handle App Password with specific permissions', async () => {
      const serverInfo = {
        serverType: 'cloud',
        version: '2.0',
        baseUrl: 'https://bitbucket.org',
        isSupported: true
      };

      const authResult = await authService.authenticateWithAppPassword({
        serverInfo,
        username: 'test-user',
        appPassword: 'test-app-password',
        permissions: ['repositories:read', 'repositories:write']
      });

      expect(authResult).toHaveProperty('permissions');
      expect(authResult.permissions).toContain('repositories:read');
      expect(authResult.permissions).toContain('repositories:write');
    });
  });

  describe('Basic Auth Flow', () => {
    it('should authenticate with Basic Auth as fallback', async () => {
      const serverInfo = {
        serverType: 'datacenter' as const,
        version: '7.16.0',
        baseUrl: 'https://bitbucket.example.com',
        isSupported: true
      };

      const authResult = await authService.authenticateWithBasicAuth({
        serverInfo,
        username: 'test-user',
        password: 'test-password'
      });

      expect(authResult).toHaveProperty('authenticated', true);
      expect(authResult).toHaveProperty('username', 'test-user');
    });

    it('should handle Basic Auth with domain', async () => {
      const serverInfo = {
        serverType: 'datacenter' as const,
        version: '7.16.0',
        baseUrl: 'https://bitbucket.example.com',
        isSupported: true
      };

      const authResult = await authService.authenticateWithBasicAuth({
        serverInfo,
        username: 'domain\\test-user',
        password: 'test-password'
      });

      expect(authResult).toHaveProperty('authenticated', true);
      expect(authResult).toHaveProperty('username', 'domain\\test-user');
    });
  });

  describe('Authentication Priority and Fallback', () => {
    it('should try authentication methods in priority order', async () => {
      const serverInfo = {
        serverType: 'datacenter' as const,
        version: '7.16.0',
        baseUrl: 'https://bitbucket.example.com',
        isSupported: true
      };

      const authMethods = [
        { type: 'oauth', clientId: 'test-client', clientSecret: 'test-secret' },
        { type: 'token', token: 'test-token' },
        { type: 'appPassword', username: 'test-user', appPassword: 'test-password' },
        { type: 'basic', username: 'test-user', password: 'test-password' }
      ];

      const authResult = await authService.authenticateWithFallback({
        serverInfo,
        methods: authMethods
      });

      expect(authResult).toHaveProperty('authenticated', true);
      expect(authResult).toHaveProperty('method_used');
    });

    it('should fallback to next method when one fails', async () => {
      const serverInfo = {
        serverType: 'datacenter' as const,
        version: '7.16.0',
        baseUrl: 'https://bitbucket.example.com',
        isSupported: true
      };

      const authMethods = [
        { type: 'oauth', clientId: 'invalid-client', clientSecret: 'invalid-secret' },
        { type: 'token', token: 'test-token' }
      ];

      const authResult = await authService.authenticateWithFallback({
        serverInfo,
        methods: authMethods
      });

      expect(authResult).toHaveProperty('authenticated', true);
      expect(authResult.method_used).toBe('token');
    });

    it('should fail when all authentication methods fail', async () => {
      const serverInfo = {
        serverType: 'datacenter' as const,
        version: '7.16.0',
        baseUrl: 'https://bitbucket.example.com',
        isSupported: true
      };

      const authMethods = [
        { type: 'oauth', clientId: 'invalid-client', clientSecret: 'invalid-secret' },
        { type: 'token', token: 'invalid-token' },
        { type: 'appPassword', username: 'invalid-user', appPassword: 'invalid-password' },
        { type: 'basic', username: 'invalid-user', password: 'invalid-password' }
      ];

      await expect(authService.authenticateWithFallback({
        serverInfo,
        methods: authMethods
      })).rejects.toThrow('All authentication methods failed');
    });
  });

  describe('Session Management', () => {
    it('should create and manage authentication sessions', async () => {
      const serverInfo = {
        serverType: 'datacenter' as const,
        version: '7.16.0',
        baseUrl: 'https://bitbucket.example.com',
        isSupported: true
      };

      const session = await authService.createSession({
        serverInfo,
        token: 'test-token',
        tokenType: 'personal'
      });

      expect(session).toHaveProperty('sessionId');
      expect(session).toHaveProperty('expiresAt');
      expect(session).toHaveProperty('serverInfo');
      expect(session.serverInfo).toEqual(serverInfo);
    });

    it('should refresh expired sessions', async () => {
      const serverInfo = {
        serverType: 'datacenter' as const,
        version: '7.16.0',
        baseUrl: 'https://bitbucket.example.com',
        isSupported: true
      };

      const session = await authService.createSession({
        serverInfo,
        token: 'test-token',
        tokenType: 'personal'
      });

      // Mock session expiration
      jest.advanceTimersByTime(24 * 60 * 60 * 1000); // 24 hours

      const refreshedSession = await authService.refreshSession(session.sessionId);

      expect(refreshedSession).toHaveProperty('sessionId', session.sessionId);
      expect(refreshedSession.expiresAt).toBeGreaterThan(session.expiresAt);
    });

    it('should revoke sessions', async () => {
      const serverInfo = {
        serverType: 'datacenter' as const,
        version: '7.16.0',
        baseUrl: 'https://bitbucket.example.com',
        isSupported: true
      };

      const session = await authService.createSession({
        serverInfo,
        token: 'test-token',
        tokenType: 'personal'
      });

      await authService.revokeSession(session.sessionId);

      await expect(authService.getSession(session.sessionId))
        .rejects.toThrow('Session not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid credentials gracefully', async () => {
      const serverInfo = {
        serverType: 'datacenter' as const,
        version: '7.16.0',
        baseUrl: 'https://bitbucket.example.com',
        isSupported: true
      };

      await expect(authService.authenticateWithToken({
        serverInfo,
        token: 'invalid-token',
        tokenType: 'personal'
      })).rejects.toThrow('Invalid credentials');
    });

    it('should handle network errors during authentication', async () => {
      const serverInfo = {
        serverType: 'datacenter' as const,
        version: '7.16.0',
        baseUrl: 'https://unreachable-server.com',
        isSupported: true
      };

      await expect(authService.authenticateWithToken({
        serverInfo,
        token: 'test-token',
        tokenType: 'personal'
      })).rejects.toThrow('Network error');
    });

    it('should handle rate limiting during authentication', async () => {
      const serverInfo = {
        serverType: 'datacenter' as const,
        version: '7.16.0',
        baseUrl: 'https://bitbucket.example.com',
        isSupported: true
      };

      // Mock rate limiting response
      await expect(authService.authenticateWithToken({
        serverInfo,
        token: 'rate-limited-token',
        tokenType: 'personal'
      })).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('Security Requirements', () => {
    it('should sanitize sensitive data in logs', async () => {
      const serverInfo = {
        serverType: 'datacenter' as const,
        version: '7.16.0',
        baseUrl: 'https://bitbucket.example.com',
        isSupported: true
      };

      const logSpy = jest.spyOn(console, 'log');

      await authService.authenticateWithToken({
        serverInfo,
        token: 'sensitive-token-12345',
        tokenType: 'personal'
      });

      // Check that sensitive data is sanitized in logs
      const logCalls = logSpy.mock.calls;
      const logContent = logCalls.map(call => call.join(' ')).join(' ');
      
      expect(logContent).not.toContain('sensitive-token-12345');
      expect(logContent).toContain('***');
    });

    it('should validate token expiration', async () => {
      const serverInfo = {
        serverType: 'datacenter' as const,
        version: '7.16.0',
        baseUrl: 'https://bitbucket.example.com',
        isSupported: true
      };

      const authResult = await authService.authenticateWithToken({
        serverInfo,
        token: 'expired-token',
        tokenType: 'personal'
      });

      expect(authResult).toHaveProperty('expiresAt');
      expect(authResult.expiresAt).toBeGreaterThan(Date.now());
    });
  });
});
