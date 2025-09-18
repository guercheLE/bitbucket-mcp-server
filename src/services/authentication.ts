/**
 * Authentication Service
 * Hierarchical authentication system with priority-based fallback
 */

import axios, { AxiosResponse } from 'axios';
import { z } from 'zod';

// Types
export interface AuthResult {
  authenticated: boolean;
  user?: {
    name: string;
    email: string;
  };
  token: string;
  type: string;
}

export interface AuthConfig {
  [key: string]: any;
}

// Base authentication class
export abstract class Authentication {
  public readonly priority: number;
  public readonly type: string;
  protected config: AuthConfig;

  constructor(config: AuthConfig, priority: number, type: string) {
    this.config = config;
    this.priority = priority;
    this.type = type;
  }

  abstract authenticate(serverUrl: string): Promise<AuthResult>;
}

// OAuth2 Authentication (Highest Priority)
export class OAuth2Auth extends Authentication {
  constructor(config: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    accessToken?: string;
    refreshToken?: string;
  }) {
    super(config, 1, 'oauth2');
    this.validateConfig(config);
  }

  private validateConfig(config: any): void {
    const schema = z.object({
      clientId: z.string().min(1, 'Client ID is required'),
      clientSecret: z.string().min(1, 'Client secret is required'),
      redirectUri: z.string().url('Invalid redirect URI'),
      accessToken: z.string().optional(),
      refreshToken: z.string().optional(),
    });
    
    schema.parse(config);
  }

  async authenticate(serverUrl: string): Promise<AuthResult> {
    if (!this.config['accessToken']) {
      throw new Error('Access token is required for OAuth2 authentication');
    }

    try {
      // Test the access token
      const response = await this.makeRequest(serverUrl, '/rest/api/1.0/users/current');
      
      return {
        authenticated: true,
        user: {
          name: response.data.name || response.data.displayName,
          email: response.data.emailAddress || response.data.email,
        },
        token: this.config['accessToken'],
        type: this.type,
      };
    } catch (error) {
      // Try to refresh token if available
      if (this.config['refreshToken'] && axios.isAxiosError(error) && error.response?.status === 401) {
        try {
          await this.refreshToken(serverUrl);
          // Retry authentication with new token
          return this.authenticate(serverUrl);
        } catch (refreshError) {
          throw new Error('Authentication failed: Token refresh unsuccessful');
        }
      }
      throw new Error('Authentication failed: Invalid OAuth2 token');
    }
  }

  private async refreshToken(serverUrl: string): Promise<void> {
    const response = await axios.post(`${serverUrl}/rest/oauth/1.0/token`, {
      grant_type: 'refresh_token',
      refresh_token: this.config['refreshToken'],
      client_id: this.config['clientId'],
      client_secret: this.config['clientSecret'],
    });

    this.config['accessToken'] = response.data.access_token;
    if (response.data.refresh_token) {
      this.config['refreshToken'] = response.data.refresh_token;
    }
  }

  private async makeRequest(serverUrl: string, endpoint: string): Promise<AxiosResponse> {
    return axios.get(`${serverUrl}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${this.config['accessToken']}`,
        'Accept': 'application/json',
      },
      timeout: 10000,
    });
  }
}

// Personal Access Token Authentication (Second Priority)
export class PersonalTokenAuth extends Authentication {
  constructor(config: { token: string }) {
    super(config, 2, 'personal-token');
    this.validateConfig(config);
  }

  private validateConfig(config: any): void {
    const schema = z.object({
      token: z.string().min(1, 'Personal token is required'),
    });
    
    schema.parse(config);
  }

  async authenticate(serverUrl: string): Promise<AuthResult> {
    try {
      const response = await axios.get(`${serverUrl}/rest/api/1.0/users/current`, {
        headers: {
          Authorization: `Bearer ${this.config['token']}`,
          'Accept': 'application/json',
        },
        timeout: 10000,
      });

      return {
        authenticated: true,
        user: {
          name: response.data.name || response.data.displayName,
          email: response.data.emailAddress || response.data.email,
        },
        token: this.config['token'],
        type: this.type,
      };
    } catch (error) {
      throw new Error('Authentication failed: Invalid personal token');
    }
  }
}

// App Password Authentication (Third Priority)
export class AppPasswordAuth extends Authentication {
  constructor(config: { username: string; appPassword: string }) {
    super(config, 3, 'app-password');
    this.validateConfig(config);
  }

  private validateConfig(config: any): void {
    const schema = z.object({
      username: z.string().min(1, 'Username is required'),
      appPassword: z.string().min(1, 'App password is required'),
    });
    
    schema.parse(config);
  }

  async authenticate(serverUrl: string): Promise<AuthResult> {
    const credentials = Buffer.from(`${this.config['username']}:${this.config['appPassword']}`).toString('base64');
    
    try {
      const response = await axios.get(`${serverUrl}/rest/api/1.0/users/current`, {
        headers: {
          Authorization: `Basic ${credentials}`,
          'Accept': 'application/json',
        },
        timeout: 10000,
      });

      return {
        authenticated: true,
        user: {
          name: response.data.name || response.data.displayName,
          email: response.data.emailAddress || response.data.email,
        },
        token: credentials,
        type: this.type,
      };
    } catch (error) {
      throw new Error('Authentication failed: Invalid app password');
    }
  }
}

// Basic Authentication (Lowest Priority - Fallback)
export class BasicAuth extends Authentication {
  constructor(config: { username: string; password: string }) {
    super(config, 4, 'basic');
    this.validateConfig(config);
  }

  private validateConfig(config: any): void {
    const schema = z.object({
      username: z.string().min(1, 'Username is required'),
      password: z.string().min(1, 'Password is required'),
    });
    
    schema.parse(config);
  }

  async authenticate(serverUrl: string): Promise<AuthResult> {
    const credentials = Buffer.from(`${this.config['username']}:${this.config['password']}`).toString('base64');
    
    try {
      const response = await axios.get(`${serverUrl}/rest/api/1.0/users/current`, {
        headers: {
          Authorization: `Basic ${credentials}`,
          'Accept': 'application/json',
        },
        timeout: 10000,
      });

      return {
        authenticated: true,
        user: {
          name: response.data.name || response.data.displayName,
          email: response.data.emailAddress || response.data.email,
        },
        token: credentials,
        type: this.type,
      };
    } catch (error) {
      throw new Error('Authentication failed: Invalid basic credentials');
    }
  }
}

// Authentication Manager
export class AuthenticationManager {
  private authMethods: Authentication[];

  constructor(authMethods: Authentication[]) {
    // Sort by priority (ascending - lower number = higher priority)
    this.authMethods = authMethods.sort((a, b) => a.priority - b.priority);
  }

  async authenticate(serverUrl: string): Promise<AuthResult> {
    const errors: Error[] = [];

    for (const authMethod of this.authMethods) {
      try {
        const result = await authMethod.authenticate(serverUrl);
        return result;
      } catch (error) {
        errors.push(error as Error);
        // Continue to next authentication method
      }
    }

    // All authentication methods failed
    const errorMessages = errors.map(e => e.message).join('; ');
    throw new Error(`All authentication methods failed: ${errorMessages}`);
  }

  getAvailableMethods(): string[] {
    return this.authMethods.map(method => method.type);
  }

  getMethodByType(type: string): Authentication | undefined {
    return this.authMethods.find(method => method.type === type);
  }
}

// Factory functions
export function createOAuth2Auth(config: {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  accessToken?: string;
  refreshToken?: string;
}): OAuth2Auth {
  return new OAuth2Auth(config);
}

export function createPersonalTokenAuth(config: { token: string }): PersonalTokenAuth {
  return new PersonalTokenAuth(config);
}

export function createAppPasswordAuth(config: { username: string; appPassword: string }): AppPasswordAuth {
  return new AppPasswordAuth(config);
}

export function createBasicAuth(config: { username: string; password: string }): BasicAuth {
  return new BasicAuth(config);
}

export function createAuthenticationManager(authMethods: Authentication[]): AuthenticationManager {
  return new AuthenticationManager(authMethods);
}

// Simple AuthenticationService for CLI usage
export class AuthenticationService {
  constructor(private serverInfo: any) {}

  generateAuthorizationUrl(config: {
    clientId: string;
    redirectUri: string;
    scope: string;
  }): string {
    const baseUrl = this.serverInfo.baseUrl;
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scope,
    });
    
    return `${baseUrl}/oauth/authorize?${params.toString()}`;
  }

  async getCurrentUser(token: string): Promise<any> {
    const response = await axios.get(`${this.serverInfo.baseUrl}/rest/api/1.0/users/current`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    
    return response.data;
  }
}