/**
 * Authentication Mock Utilities
 * 
 * Utilities for mocking authentication in tests
 */

/**
 * Mock Authentication States
 */
export enum MockAuthState {
  UNAUTHENTICATED = 'unauthenticated',
  AUTHENTICATED = 'authenticated',
  EXPIRED = 'expired',
  INVALID = 'invalid'
}

/**
 * Mock OAuth Token
 */
export interface MockOAuthToken {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number;
  created_at: number;
  scope: string[];
}

/**
 * Mock User Profile
 */
export interface MockUserProfile {
  uuid: string;
  username: string;
  display_name: string;
  account_id: string;
  nickname: string;
  created_on: string;
  is_staff: boolean;
  account_status: 'active' | 'inactive';
}

/**
 * Authentication Mock Utilities
 */
export class AuthMockUtils {
  private static tokenCounter = 1;

  /**
   * Create a mock OAuth token
   */
  static createMockToken(
    overrides: Partial<MockOAuthToken> = {},
    isExpired: boolean = false
  ): MockOAuthToken {
    const now = Date.now();
    const expiresIn = isExpired ? -3600 : 3600; // 1 hour, negative if expired
    
    return {
      access_token: `mock_access_token_${this.tokenCounter++}`,
      refresh_token: `mock_refresh_token_${this.tokenCounter}`,
      token_type: 'Bearer',
      expires_in: expiresIn,
      created_at: now,
      scope: ['repository', 'account', 'pullrequest:write'],
      ...overrides
    };
  }

  /**
   * Create a mock user profile
   */
  static createMockUserProfile(overrides: Partial<MockUserProfile> = {}): MockUserProfile {
    const userId = Math.random().toString(36).substr(2, 9);
    
    return {
      uuid: `{${crypto.randomUUID()}}`,
      username: `testuser${userId}`,
      display_name: `Test User ${userId}`,
      account_id: `test-account-${userId}`,
      nickname: `testuser${userId}`,
      created_on: '2023-01-01T00:00:00.000000+00:00',
      is_staff: false,
      account_status: 'active',
      ...overrides
    };
  }

  /**
   * Mock OAuth flow responses
   */
  static getMockOAuthFlowResponses() {
    return {
      // Authorization URL
      authUrl: 'https://bitbucket.org/site/oauth2/authorize?client_id=mock_client&response_type=code&redirect_uri=http://localhost:3000/callback&state=mock_state',
      
      // Authorization code (returned from callback)
      authCode: 'mock_authorization_code_12345',
      
      // Token exchange response
      tokenResponse: {
        access_token: 'mock_access_token_123456',
        refresh_token: 'mock_refresh_token_123456',
        token_type: 'bearer',
        expires_in: 3600,
        scope: 'account repository pullrequest:write'
      },

      // Token refresh response
      refreshResponse: {
        access_token: 'mock_refreshed_access_token_789012',
        refresh_token: 'mock_new_refresh_token_789012',
        token_type: 'bearer',
        expires_in: 3600,
        scope: 'account repository pullrequest:write'
      }
    };
  }

  /**
   * Create mock authentication context
   */
  static createMockAuthContext(state: MockAuthState = MockAuthState.AUTHENTICATED) {
    switch (state) {
      case MockAuthState.AUTHENTICATED:
        return {
          isAuthenticated: true,
          token: this.createMockToken(),
          user: this.createMockUserProfile(),
          scopes: ['repository', 'account', 'pullrequest:write']
        };
      
      case MockAuthState.EXPIRED:
        return {
          isAuthenticated: false,
          token: this.createMockToken({}, true),
          user: null,
          scopes: [],
          error: 'Token expired'
        };
      
      case MockAuthState.INVALID:
        return {
          isAuthenticated: false,
          token: null,
          user: null,
          scopes: [],
          error: 'Invalid token'
        };
      
      case MockAuthState.UNAUTHENTICATED:
      default:
        return {
          isAuthenticated: false,
          token: null,
          user: null,
          scopes: []
        };
    }
  }

  /**
   * Mock authentication service for dependency injection
   */
  static createMockAuthService(initialState: MockAuthState = MockAuthState.UNAUTHENTICATED) {
    let currentState = initialState;
    let authContext = this.createMockAuthContext(currentState);

    return {
      // State management
      getCurrentState: jest.fn(() => currentState),
      getAuthContext: jest.fn(() => authContext),
      
      // Authentication flow
      initiateOAuthFlow: jest.fn().mockResolvedValue({
        authUrl: this.getMockOAuthFlowResponses().authUrl,
        state: 'mock_state'
      }),
      
      handleAuthCallback: jest.fn().mockImplementation(async (code: string, state: string) => {
        if (code === 'valid_code') {
          currentState = MockAuthState.AUTHENTICATED;
          authContext = this.createMockAuthContext(MockAuthState.AUTHENTICATED);
          return authContext;
        } else {
          throw new Error('Invalid authorization code');
        }
      }),
      
      // Token management
      refreshToken: jest.fn().mockImplementation(async () => {
        if (currentState === MockAuthState.EXPIRED) {
          currentState = MockAuthState.AUTHENTICATED;
          authContext = this.createMockAuthContext(MockAuthState.AUTHENTICATED);
          return authContext.token;
        } else {
          throw new Error('Unable to refresh token');
        }
      }),
      
      validateToken: jest.fn().mockImplementation(async (token: string) => {
        return token.startsWith('mock_access_token_') && currentState === MockAuthState.AUTHENTICATED;
      }),
      
      revokeToken: jest.fn().mockImplementation(async () => {
        currentState = MockAuthState.UNAUTHENTICATED;
        authContext = this.createMockAuthContext(MockAuthState.UNAUTHENTICATED);
      }),
      
      // User info
      getUserProfile: jest.fn().mockResolvedValue(authContext.user),
      
      // Testing utilities
      setState: (newState: MockAuthState) => {
        currentState = newState;
        authContext = this.createMockAuthContext(newState);
      }
    };
  }

  /**
   * Create mock HTTP authorization headers
   */
  static createMockAuthHeaders(token?: string): Record<string, string> {
    if (!token) {
      token = this.createMockToken().access_token;
    }
    
    return {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
  }

  /**
   * Mock authentication middleware for express-like frameworks
   */
  static createMockAuthMiddleware(defaultState: MockAuthState = MockAuthState.AUTHENTICATED) {
    const authService = this.createMockAuthService(defaultState);
    
    return {
      middleware: jest.fn().mockImplementation((req: any, res: any, next: any) => {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          req.auth = this.createMockAuthContext(MockAuthState.UNAUTHENTICATED);
        } else {
          const token = authHeader.split(' ')[1];
          if (token.startsWith('mock_access_token_')) {
            req.auth = this.createMockAuthContext(MockAuthState.AUTHENTICATED);
          } else {
            req.auth = this.createMockAuthContext(MockAuthState.INVALID);
          }
        }
        
        next();
      }),
      
      authService
    };
  }

  /**
   * Generate mock JWT tokens for testing (not cryptographically secure)
   */
  static createMockJWT(payload: Record<string, any> = {}) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const defaultPayload = {
      sub: 'test-user-id',
      name: 'Test User',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    };
    
    const fullPayload = { ...defaultPayload, ...payload };
    
    // Mock JWT (not actually signed)
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
    const mockSignature = 'mock_signature_' + Math.random().toString(36).substr(2, 10);
    
    return `${encodedHeader}.${encodedPayload}.${mockSignature}`;
  }
}

export default AuthMockUtils;