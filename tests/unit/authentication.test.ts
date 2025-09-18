/**
 * Unit tests for Authentication
 * TDD Red Phase - These tests should fail initially
 */

import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Authentication', () => {
  let authentication: any;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Import the authentication module
    // This will fail initially as the module doesn't exist yet
    const module = await import('@/services/authentication');
    authentication = module;
  });

  describe('OAuth2 Authentication', () => {
    it('should create OAuth2 authentication with highest priority', () => {
      const oauth2Auth = new authentication.OAuth2Auth({
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/callback',
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      });

      expect(oauth2Auth.priority).toBe(1); // Highest priority
      expect(oauth2Auth.type).toBe('oauth2');
    });

    it('should authenticate with OAuth2 access token', async () => {
      const mockResponse = {
        data: {
          user: {
            name: 'Test User',
            email: 'test@example.com',
          },
        },
        status: 200,
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const oauth2Auth = new authentication.OAuth2Auth({
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/callback',
        accessToken: 'valid-access-token',
      });

      const result = await oauth2Auth.authenticate('https://bitbucket.example.com');
      
      expect(result).toEqual({
        authenticated: true,
        type: 'oauth2',
        user: {
          name: 'Test User',
          email: 'test@example.com',
        },
        token: 'valid-access-token',
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://bitbucket.example.com/rest/api/1.0/users/current',
        {
          headers: {
            Authorization: 'Bearer valid-access-token',
          },
        }
      );
    });

    it('should refresh OAuth2 token when expired', async () => {
      // Mock token refresh response
      const refreshResponse = {
        data: {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600,
        },
        status: 200,
      };

      // Mock user info response
      const userResponse = {
        data: {
          user: {
            name: 'Test User',
            email: 'test@example.com',
          },
        },
        status: 200,
      };

      mockedAxios.post.mockResolvedValue(refreshResponse);
      mockedAxios.get.mockResolvedValue(userResponse);

      const oauth2Auth = new authentication.OAuth2Auth({
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/callback',
        accessToken: 'expired-access-token',
        refreshToken: 'valid-refresh-token',
      });

      const result = await oauth2Auth.authenticate('https://bitbucket.example.com');
      
      expect(result.authenticated).toBe(true);
      expect(result.token).toBe('new-access-token');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://bitbucket.example.com/rest/oauth/1.0/token',
        expect.objectContaining({
          grant_type: 'refresh_token',
          refresh_token: 'valid-refresh-token',
        })
      );
    });

    it('should handle OAuth2 authentication failure', async () => {
      mockedAxios.get.mockRejectedValue({
        response: {
          status: 401,
          data: { error: 'Invalid token' },
        },
      });

      const oauth2Auth = new authentication.OAuth2Auth({
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/callback',
        accessToken: 'invalid-access-token',
      });

      await expect(
        oauth2Auth.authenticate('https://bitbucket.example.com')
      ).rejects.toThrow('Authentication failed');
    });
  });

  describe('Personal Access Token Authentication', () => {
    it('should create Personal Token authentication with second priority', () => {
      const tokenAuth = new authentication.PersonalTokenAuth({
        token: 'test-personal-token',
      });

      expect(tokenAuth.priority).toBe(2);
      expect(tokenAuth.type).toBe('personal-token');
    });

    it('should authenticate with personal access token', async () => {
      const mockResponse = {
        data: {
          name: 'Test User',
          emailAddress: 'test@example.com',
        },
        status: 200,
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const tokenAuth = new authentication.PersonalTokenAuth({
        token: 'valid-personal-token',
      });

      const result = await tokenAuth.authenticate('https://bitbucket.example.com');
      
      expect(result).toEqual({
        authenticated: true,
        type: 'personal-token',
        user: {
          name: 'Test User',
          email: 'test@example.com',
        },
        token: 'valid-personal-token',
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://bitbucket.example.com/rest/api/1.0/users/current',
        {
          headers: {
            Authorization: 'Bearer valid-personal-token',
          },
        }
      );
    });

    it('should handle personal token authentication failure', async () => {
      mockedAxios.get.mockRejectedValue({
        response: {
          status: 401,
          data: { error: 'Invalid token' },
        },
      });

      const tokenAuth = new authentication.PersonalTokenAuth({
        token: 'invalid-personal-token',
      });

      await expect(
        tokenAuth.authenticate('https://bitbucket.example.com')
      ).rejects.toThrow('Authentication failed');
    });
  });

  describe('App Password Authentication', () => {
    it('should create App Password authentication with third priority', () => {
      const appPasswordAuth = new authentication.AppPasswordAuth({
        username: 'test-user',
        appPassword: 'test-app-password',
      });

      expect(appPasswordAuth.priority).toBe(3);
      expect(appPasswordAuth.type).toBe('app-password');
    });

    it('should authenticate with app password', async () => {
      const mockResponse = {
        data: {
          name: 'Test User',
          emailAddress: 'test@example.com',
        },
        status: 200,
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const appPasswordAuth = new authentication.AppPasswordAuth({
        username: 'test-user',
        appPassword: 'valid-app-password',
      });

      const result = await appPasswordAuth.authenticate('https://bitbucket.example.com');
      
      expect(result).toEqual({
        authenticated: true,
        type: 'app-password',
        user: {
          name: 'Test User',
          email: 'test@example.com',
        },
        token: 'dGVzdC11c2VyOnZhbGlkLWFwcC1wYXNzd29yZA==', // base64 encoded
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://bitbucket.example.com/rest/api/1.0/users/current',
        {
          headers: {
            Authorization: 'Basic dGVzdC11c2VyOnZhbGlkLWFwcC1wYXNzd29yZA==',
          },
        }
      );
    });

    it('should handle app password authentication failure', async () => {
      mockedAxios.get.mockRejectedValue({
        response: {
          status: 401,
          data: { error: 'Invalid credentials' },
        },
      });

      const appPasswordAuth = new authentication.AppPasswordAuth({
        username: 'test-user',
        appPassword: 'invalid-app-password',
      });

      await expect(
        appPasswordAuth.authenticate('https://bitbucket.example.com')
      ).rejects.toThrow('Authentication failed');
    });
  });

  describe('Basic Authentication', () => {
    it('should create Basic Auth with lowest priority (fallback)', () => {
      const basicAuth = new authentication.BasicAuth({
        username: 'test-user',
        password: 'test-password',
      });

      expect(basicAuth.priority).toBe(4); // Lowest priority
      expect(basicAuth.type).toBe('basic');
    });

    it('should authenticate with basic credentials', async () => {
      const mockResponse = {
        data: {
          name: 'Test User',
          emailAddress: 'test@example.com',
        },
        status: 200,
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const basicAuth = new authentication.BasicAuth({
        username: 'test-user',
        password: 'test-password',
      });

      const result = await basicAuth.authenticate('https://bitbucket.example.com');
      
      expect(result).toEqual({
        authenticated: true,
        type: 'basic',
        user: {
          name: 'Test User',
          email: 'test@example.com',
        },
        token: 'dGVzdC11c2VyOnRlc3QtcGFzc3dvcmQ=', // base64 encoded
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://bitbucket.example.com/rest/api/1.0/users/current',
        {
          headers: {
            Authorization: 'Basic dGVzdC11c2VyOnRlc3QtcGFzc3dvcmQ=',
          },
        }
      );
    });

    it('should handle basic authentication failure', async () => {
      mockedAxios.get.mockRejectedValue({
        response: {
          status: 401,
          data: { error: 'Invalid credentials' },
        },
      });

      const basicAuth = new authentication.BasicAuth({
        username: 'test-user',
        password: 'invalid-password',
      });

      await expect(
        basicAuth.authenticate('https://bitbucket.example.com')
      ).rejects.toThrow('Authentication failed');
    });
  });

  describe('Authentication Hierarchy', () => {
    it('should prioritize OAuth2 over other methods', async () => {
      const mockResponse = {
        data: {
          name: 'Test User',
          emailAddress: 'test@example.com',
        },
        status: 200,
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const authManager = new authentication.AuthenticationManager([
        new authentication.BasicAuth({
          username: 'test-user',
          password: 'test-password',
        }),
        new authentication.PersonalTokenAuth({
          token: 'test-personal-token',
        }),
        new authentication.OAuth2Auth({
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          redirectUri: 'http://localhost:3000/callback',
          accessToken: 'test-oauth-token',
        }),
      ]);

      const result = await authManager.authenticate('https://bitbucket.example.com');
      
      expect(result.type).toBe('oauth2');
      expect(result.token).toBe('test-oauth-token');
    });

    it('should fallback to next authentication method on failure', async () => {
      // Mock OAuth2 to fail
      mockedAxios.get
        .mockRejectedValueOnce({
          response: { status: 401, data: { error: 'Invalid OAuth token' } },
        })
        .mockResolvedValueOnce({
          data: {
            name: 'Test User',
            emailAddress: 'test@example.com',
          },
          status: 200,
        });

      const authManager = new authentication.AuthenticationManager([
        new authentication.OAuth2Auth({
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          redirectUri: 'http://localhost:3000/callback',
          accessToken: 'invalid-oauth-token',
        }),
        new authentication.PersonalTokenAuth({
          token: 'valid-personal-token',
        }),
      ]);

      const result = await authManager.authenticate('https://bitbucket.example.com');
      
      expect(result.type).toBe('personal-token');
      expect(result.token).toBe('valid-personal-token');
    });

    it('should fail when all authentication methods fail', async () => {
      mockedAxios.get.mockRejectedValue({
        response: { status: 401, data: { error: 'Authentication failed' } },
      });

      const authManager = new authentication.AuthenticationManager([
        new authentication.OAuth2Auth({
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          redirectUri: 'http://localhost:3000/callback',
          accessToken: 'invalid-oauth-token',
        }),
        new authentication.PersonalTokenAuth({
          token: 'invalid-personal-token',
        }),
      ]);

      await expect(
        authManager.authenticate('https://bitbucket.example.com')
      ).rejects.toThrow('All authentication methods failed');
    });
  });

  describe('Token Validation', () => {
    it('should validate OAuth2 token format', () => {
      expect(() => {
        new authentication.OAuth2Auth({
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          redirectUri: 'http://localhost:3000/callback',
          accessToken: 'invalid-token-format!',
        });
      }).toThrow('Invalid OAuth2 token format');
    });

    it('should validate personal token format', () => {
      expect(() => {
        new authentication.PersonalTokenAuth({
          token: 'invalid-token-format!',
        });
      }).toThrow('Invalid personal token format');
    });

    it('should validate app password format', () => {
      expect(() => {
        new authentication.AppPasswordAuth({
          username: 'test-user',
          appPassword: 'invalid-password-format!',
        });
      }).toThrow('Invalid app password format');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      const oauth2Auth = new authentication.OAuth2Auth({
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/callback',
        accessToken: 'test-access-token',
      });

      await expect(
        oauth2Auth.authenticate('https://bitbucket.example.com')
      ).rejects.toThrow('Network error');
    });

    it('should handle server errors gracefully', async () => {
      mockedAxios.get.mockRejectedValue({
        response: {
          status: 500,
          data: { error: 'Internal server error' },
        },
      });

      const oauth2Auth = new authentication.OAuth2Auth({
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/callback',
        accessToken: 'test-access-token',
      });

      await expect(
        oauth2Auth.authenticate('https://bitbucket.example.com')
      ).rejects.toThrow('Server error');
    });

    it('should handle timeout errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('timeout of 5000ms exceeded'));

      const oauth2Auth = new authentication.OAuth2Auth({
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/callback',
        accessToken: 'test-access-token',
      });

      await expect(
        oauth2Auth.authenticate('https://bitbucket.example.com')
      ).rejects.toThrow('Request timeout');
    });
  });
});
