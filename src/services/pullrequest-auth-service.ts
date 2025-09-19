/**
 * Pull Request Authentication Service
 * T028: OAuth 2.0, Personal Access Tokens, App Passwords, Basic Auth for pull requests
 * 
 * Centralized authentication service for pull request operations
 * Supports multiple authentication methods with automatic fallback
 */

import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { cache } from './cache.js';
import { authConfigurationManager } from '../config/auth.js';
import { ServerInfo } from './server-detection.js';

// Authentication method types
export type AuthenticationMethod = 'oauth2' | 'personal_token' | 'app_password' | 'basic_auth';

// Authentication result
export interface AuthenticationResult {
  success: boolean;
  method: AuthenticationMethod;
  token?: string;
  tokenType?: string;
  expiresAt?: Date;
  error?: string;
  fallbackUsed?: boolean;
}

// Authentication request
export interface AuthenticationRequest {
  serverUrl: string;
  method: AuthenticationMethod;
  credentials: {
    // OAuth 2.0
    clientId?: string;
    clientSecret?: string;
    authorizationCode?: string;
    redirectUri?: string;
    
    // Personal Access Token / App Password
    token?: string;
    
    // Basic Auth
    username?: string;
    password?: string;
  };
  forceRefresh?: boolean;
}

// Cached authentication info
interface CachedAuthInfo {
  token: string;
  tokenType: string;
  expiresAt: Date;
  method: AuthenticationMethod;
  serverUrl: string;
  cachedAt: Date;
}

/**
 * Pull Request Authentication Service
 */
export class PullRequestAuthService {
  private static instance: PullRequestAuthService;
  private authCache: Map<string, CachedAuthInfo> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): PullRequestAuthService {
    if (!PullRequestAuthService.instance) {
      PullRequestAuthService.instance = new PullRequestAuthService();
    }
    return PullRequestAuthService.instance;
  }

  /**
   * Authenticate with the specified method
   */
  public async authenticate(request: AuthenticationRequest): Promise<AuthenticationResult> {
    const cacheKey = this.getCacheKey(request);
    
    // Check cache first (unless force refresh)
    if (!request.forceRefresh) {
      const cached = await this.getCachedAuth(cacheKey);
      if (cached && !this.isExpired(cached)) {
        logger.debug('Using cached authentication', {
          method: cached.method,
          serverUrl: request.serverUrl
        });
        return {
          success: true,
          method: cached.method,
          token: cached.token,
          tokenType: cached.tokenType,
          expiresAt: cached.expiresAt
        };
      }
    }

    // Try authentication methods in order of preference
    const methods = this.getAuthenticationMethods(request.serverUrl);
    let lastError: string | undefined;

    for (const method of methods) {
      try {
        const result = await this.authenticateWithMethod(request, method);
        if (result.success) {
          // Cache successful authentication
          await this.cacheAuth(cacheKey, {
            token: result.token!,
            tokenType: result.tokenType!,
            expiresAt: result.expiresAt || new Date(Date.now() + 3600000), // 1 hour default
            method: result.method,
            serverUrl: request.serverUrl,
            cachedAt: new Date()
          });

          logger.info('Authentication successful', {
            method: result.method,
            serverUrl: request.serverUrl,
            fallbackUsed: result.fallbackUsed
          });

          return result;
        }
        lastError = result.error;
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown authentication error';
        logger.warn('Authentication method failed', {
          method,
          serverUrl: request.serverUrl,
          error: lastError
        });
      }
    }

    logger.error('All authentication methods failed', {
      serverUrl: request.serverUrl,
      lastError
    });

    return {
      success: false,
      method: methods[0] || 'basic_auth',
      error: lastError || 'All authentication methods failed'
    };
  }

  /**
   * Authenticate with OAuth 2.0
   */
  private async authenticateWithOAuth2(request: AuthenticationRequest): Promise<AuthenticationResult> {
    const { credentials } = request;
    
    if (!credentials.clientId || !credentials.clientSecret) {
      throw new Error('OAuth 2.0 requires clientId and clientSecret');
    }

    if (credentials.authorizationCode) {
      // Exchange authorization code for token
      return await this.exchangeAuthorizationCode(request);
    } else {
      // Client credentials flow
      return await this.clientCredentialsFlow(request);
    }
  }

  /**
   * Exchange authorization code for access token
   */
  private async exchangeAuthorizationCode(request: AuthenticationRequest): Promise<AuthenticationResult> {
    const { credentials, serverUrl } = request;
    
    try {
      const tokenUrl = this.getTokenEndpoint(serverUrl);
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: credentials.clientId!,
          client_secret: credentials.clientSecret!,
          code: credentials.authorizationCode!,
          redirect_uri: credentials.redirectUri || 'http://localhost:3000/callback'
        })
      });

      if (!response.ok) {
        throw new Error(`OAuth token exchange failed: ${response.status} ${response.statusText}`);
      }

      const tokenData = await response.json() as any;
      
      return {
        success: true,
        method: 'oauth2',
        token: tokenData.access_token,
        tokenType: tokenData.token_type || 'Bearer',
        expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : undefined
      };
    } catch (error) {
      return {
        success: false,
        method: 'oauth2',
        error: error instanceof Error ? error.message : 'OAuth token exchange failed'
      };
    }
  }

  /**
   * Client credentials flow for OAuth 2.0
   */
  private async clientCredentialsFlow(request: AuthenticationRequest): Promise<AuthenticationResult> {
    const { credentials, serverUrl } = request;
    
    try {
      const tokenUrl = this.getTokenEndpoint(serverUrl);
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: credentials.clientId!,
          client_secret: credentials.clientSecret!
        })
      });

      if (!response.ok) {
        throw new Error(`OAuth client credentials failed: ${response.status} ${response.statusText}`);
      }

      const tokenData = await response.json() as any;
      
      return {
        success: true,
        method: 'oauth2',
        token: tokenData.access_token,
        tokenType: tokenData.token_type || 'Bearer',
        expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : undefined
      };
    } catch (error) {
      return {
        success: false,
        method: 'oauth2',
        error: error instanceof Error ? error.message : 'OAuth client credentials failed'
      };
    }
  }

  /**
   * Authenticate with Personal Access Token
   */
  private async authenticateWithPersonalToken(request: AuthenticationRequest): Promise<AuthenticationResult> {
    const { credentials, serverUrl } = request;
    
    if (!credentials.token) {
      throw new Error('Personal Access Token is required');
    }

    try {
      // Test the token by making a simple API call
      const testUrl = this.getTestEndpoint(serverUrl);
      const response = await fetch(testUrl, {
        headers: {
          'Authorization': `Bearer ${credentials.token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Personal Access Token validation failed: ${response.status} ${response.statusText}`);
      }

      return {
        success: true,
        method: 'personal_token',
        token: credentials.token,
        tokenType: 'Bearer'
      };
    } catch (error) {
      return {
        success: false,
        method: 'personal_token',
        error: error instanceof Error ? error.message : 'Personal Access Token validation failed'
      };
    }
  }

  /**
   * Authenticate with App Password
   */
  private async authenticateWithAppPassword(request: AuthenticationRequest): Promise<AuthenticationResult> {
    const { credentials, serverUrl } = request;
    
    if (!credentials.username || !credentials.password) {
      throw new Error('App Password requires username and password');
    }

    try {
      // Test the app password by making a simple API call
      const testUrl = this.getTestEndpoint(serverUrl);
      const response = await fetch(testUrl, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64')}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`App Password validation failed: ${response.status} ${response.statusText}`);
      }

      return {
        success: true,
        method: 'app_password',
        token: Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64'),
        tokenType: 'Basic'
      };
    } catch (error) {
      return {
        success: false,
        method: 'app_password',
        error: error instanceof Error ? error.message : 'App Password validation failed'
      };
    }
  }

  /**
   * Authenticate with Basic Auth
   */
  private async authenticateWithBasicAuth(request: AuthenticationRequest): Promise<AuthenticationResult> {
    const { credentials, serverUrl } = request;
    
    if (!credentials.username || !credentials.password) {
      throw new Error('Basic Auth requires username and password');
    }

    try {
      // Test basic auth by making a simple API call
      const testUrl = this.getTestEndpoint(serverUrl);
      const response = await fetch(testUrl, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64')}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Basic Auth validation failed: ${response.status} ${response.statusText}`);
      }

      return {
        success: true,
        method: 'basic_auth',
        token: Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64'),
        tokenType: 'Basic'
      };
    } catch (error) {
      return {
        success: false,
        method: 'basic_auth',
        error: error instanceof Error ? error.message : 'Basic Auth validation failed'
      };
    }
  }

  /**
   * Authenticate with specific method
   */
  private async authenticateWithMethod(
    request: AuthenticationRequest, 
    method: AuthenticationMethod
  ): Promise<AuthenticationResult> {
    switch (method) {
      case 'oauth2':
        return await this.authenticateWithOAuth2(request);
      case 'personal_token':
        return await this.authenticateWithPersonalToken(request);
      case 'app_password':
        return await this.authenticateWithAppPassword(request);
      case 'basic_auth':
        return await this.authenticateWithBasicAuth(request);
      default:
        throw new Error(`Unsupported authentication method: ${method}`);
    }
  }

  /**
   * Get authentication methods in order of preference
   */
  private getAuthenticationMethods(serverUrl: string): AuthenticationMethod[] {
    // This would typically be determined by server capabilities
    // For now, return a standard order
    return ['oauth2', 'personal_token', 'app_password', 'basic_auth'];
  }

  /**
   * Get token endpoint URL
   */
  private getTokenEndpoint(serverUrl: string): string {
    // Determine if it's Data Center or Cloud
    if (serverUrl.includes('bitbucket.org')) {
      return 'https://bitbucket.org/site/oauth2/access_token';
    } else {
      return `${serverUrl}/plugins/servlet/oauth/access-token`;
    }
  }

  /**
   * Get test endpoint for token validation
   */
  private getTestEndpoint(serverUrl: string): string {
    // Determine if it's Data Center or Cloud
    if (serverUrl.includes('bitbucket.org')) {
      return 'https://api.bitbucket.org/2.0/user';
    } else {
      return `${serverUrl}/rest/api/1.0/users/current`;
    }
  }

  /**
   * Get cache key for authentication
   */
  private getCacheKey(request: AuthenticationRequest): string {
    const method = request.method;
    const serverUrl = request.serverUrl;
    const credentials = request.credentials;
    
    // Create a hash of the relevant credentials
    const credentialHash = this.hashCredentials(credentials, method);
    return `auth:${method}:${serverUrl}:${credentialHash}`;
  }

  /**
   * Hash credentials for cache key (without exposing sensitive data)
   */
  private hashCredentials(credentials: any, method: AuthenticationMethod): string {
    const crypto = require('crypto');
    
    switch (method) {
      case 'oauth2':
        return crypto.createHash('sha256').update(`${credentials.clientId}:${credentials.clientSecret}`).digest('hex').substring(0, 16);
      case 'personal_token':
        return crypto.createHash('sha256').update(credentials.token || '').digest('hex').substring(0, 16);
      case 'app_password':
      case 'basic_auth':
        return crypto.createHash('sha256').update(`${credentials.username}:${credentials.password}`).digest('hex').substring(0, 16);
      default:
        return 'unknown';
    }
  }

  /**
   * Get cached authentication
   */
  private async getCachedAuth(cacheKey: string): Promise<CachedAuthInfo | null> {
    try {
      const cached = await cache.get(cacheKey);
      return cached as CachedAuthInfo | null;
    } catch (error) {
      logger.warn('Failed to get cached authentication', { cacheKey, error });
      return null;
    }
  }

  /**
   * Cache authentication info
   */
  private async cacheAuth(cacheKey: string, authInfo: CachedAuthInfo): Promise<void> {
    try {
      await cache.set(cacheKey, authInfo, this.CACHE_TTL / 1000); // Convert to seconds
    } catch (error) {
      logger.warn('Failed to cache authentication', { cacheKey, error });
    }
  }

  /**
   * Check if authentication is expired
   */
  private isExpired(authInfo: CachedAuthInfo): boolean {
    return authInfo.expiresAt && authInfo.expiresAt <= new Date();
  }

  /**
   * Clear authentication cache
   */
  public async clearCache(): Promise<void> {
    try {
      // Clear all authentication-related cache entries
      const keys = Array.from(this.authCache.keys());
      for (const key of keys) {
        await cache.delete(key);
      }
      this.authCache.clear();
      logger.info('Authentication cache cleared');
    } catch (error) {
      logger.error('Failed to clear authentication cache', { error });
    }
  }

  /**
   * Get authentication statistics
   */
  public getStats(): any {
    return {
      cachedAuthentications: this.authCache.size,
      cacheTTL: this.CACHE_TTL,
      supportedMethods: ['oauth2', 'personal_token', 'app_password', 'basic_auth']
    };
  }
}

// Export singleton instance
export const pullRequestAuthService = PullRequestAuthService.getInstance();
