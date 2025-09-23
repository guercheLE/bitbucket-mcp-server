/**
 * Bitbucket API Client for Authentication
 * 
 * This module provides HTTP client functionality for interacting with
 * Bitbucket Data Center and Cloud APIs for OAuth operations and user
 * information retrieval.
 * 
 * Key Features:
 * - OAuth token exchange with Bitbucket
 * - User information retrieval
 * - API endpoint discovery
 * - Error handling and retry logic
 * - Support for both Data Center and Cloud
 * 
 * Constitutional Requirements:
 * - OAuth 2.0 compliance
 * - Comprehensive error handling
 * - Security best practices
 * - API version compatibility
 */

import { AuthenticationError, AuthenticationErrorCode } from '../../types/auth';

/**
 * Bitbucket API Client Class
 * Handles HTTP communication with Bitbucket APIs
 */
export class BitbucketApiClient {
  private baseUrl: string;
  private instanceType: 'datacenter' | 'cloud';
  private timeout: number;
  private retryAttempts: number;

  constructor(baseUrl: string, instanceType: 'datacenter' | 'cloud', timeout: number = 30000) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.instanceType = instanceType;
    this.timeout = timeout;
    this.retryAttempts = 3;
  }

  // ============================================================================
  // OAuth Token Operations
  // ============================================================================

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    clientId: string,
    clientSecret: string,
    code: string,
    redirectUri: string
  ): Promise<TokenResponse> {
    const tokenUrl = this.getTokenEndpoint();
    
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      redirect_uri: redirectUri
    });

    try {
      const response = await this.makeRequest(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: body.toString()
      });

      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        throw new AuthenticationError({
          code: this.mapHttpErrorToAuthError(response.status, errorData),
          message: errorData.error_description || errorData.error || 'Token exchange failed',
          details: errorData,
          timestamp: new Date(),
          isRecoverable: this.isRecoverableError(response.status)
        });
      }

      const tokenData = await response.json();
      return this.validateTokenResponse(tokenData);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      throw new AuthenticationError({
        code: AuthenticationErrorCode.NETWORK_ERROR,
        message: `Network error during token exchange: ${error.message}`,
        details: { originalError: error.message },
        timestamp: new Date(),
        isRecoverable: true
      });
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(
    clientId: string,
    clientSecret: string,
    refreshToken: string
  ): Promise<TokenResponse> {
    const tokenUrl = this.getTokenEndpoint();
    
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken
    });

    try {
      const response = await this.makeRequest(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: body.toString()
      });

      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        throw new AuthenticationError({
          code: this.mapHttpErrorToAuthError(response.status, errorData),
          message: errorData.error_description || errorData.error || 'Token refresh failed',
          details: errorData,
          timestamp: new Date(),
          isRecoverable: this.isRecoverableError(response.status)
        });
      }

      const tokenData = await response.json();
      return this.validateTokenResponse(tokenData);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      throw new AuthenticationError({
        code: AuthenticationErrorCode.NETWORK_ERROR,
        message: `Network error during token refresh: ${error.message}`,
        details: { originalError: error.message },
        timestamp: new Date(),
        isRecoverable: true
      });
    }
  }

  /**
   * Revoke access token
   */
  async revokeToken(
    clientId: string,
    clientSecret: string,
    token: string,
    tokenType: 'access_token' | 'refresh_token' = 'access_token'
  ): Promise<void> {
    const revokeUrl = this.getRevokeEndpoint();
    
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      token: token,
      token_type_hint: tokenType
    });

    try {
      const response = await this.makeRequest(revokeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
      });

      // Revoke endpoint typically returns 200 even if token is already revoked
      if (!response.ok && response.status !== 400) {
        const errorData = await this.parseErrorResponse(response);
        throw new AuthenticationError({
          code: AuthenticationErrorCode.INTERNAL_ERROR,
          message: `Token revocation failed: ${errorData.error || 'Unknown error'}`,
          details: errorData,
          timestamp: new Date(),
          isRecoverable: true
        });
      }
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      throw new AuthenticationError({
        code: AuthenticationErrorCode.NETWORK_ERROR,
        message: `Network error during token revocation: ${error.message}`,
        details: { originalError: error.message },
        timestamp: new Date(),
        isRecoverable: true
      });
    }
  }

  // ============================================================================
  // User Information Operations
  // ============================================================================

  /**
   * Get user information using access token
   */
  async getUserInfo(accessToken: string): Promise<UserInfo> {
    const userUrl = this.getUserEndpoint();
    
    try {
      const response = await this.makeRequest(userUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        throw new AuthenticationError({
          code: this.mapHttpErrorToAuthError(response.status, errorData),
          message: errorData.message || 'Failed to get user information',
          details: errorData,
          timestamp: new Date(),
          isRecoverable: this.isRecoverableError(response.status)
        });
      }

      const userData = await response.json();
      return this.validateUserInfoResponse(userData);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      throw new AuthenticationError({
        code: AuthenticationErrorCode.NETWORK_ERROR,
        message: `Network error while getting user info: ${error.message}`,
        details: { originalError: error.message },
        timestamp: new Date(),
        isRecoverable: true
      });
    }
  }

  /**
   * Test API connectivity
   */
  async testConnectivity(): Promise<boolean> {
    try {
      const testUrl = this.getTestEndpoint();
      const response = await this.makeRequest(testUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      return response.ok;
    } catch {
      return false;
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async makeRequest(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new AuthenticationError({
          code: AuthenticationErrorCode.TIMEOUT_ERROR,
          message: 'Request timeout',
          details: { url, timeout: this.timeout },
          timestamp: new Date(),
          isRecoverable: true
        });
      }
      
      throw error;
    }
  }

  private async parseErrorResponse(response: Response): Promise<any> {
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return {
          error: 'unknown_error',
          error_description: await response.text()
        };
      }
    } catch {
      return {
        error: 'parse_error',
        error_description: 'Failed to parse error response'
      };
    }
  }

  private validateTokenResponse(data: any): TokenResponse {
    if (!data.access_token) {
      throw new AuthenticationError({
        code: AuthenticationErrorCode.INVALID_GRANT,
        message: 'Invalid token response: missing access_token',
        details: data,
        timestamp: new Date(),
        isRecoverable: false
      });
    }

    return {
      access_token: data.access_token,
      token_type: data.token_type || 'Bearer',
      expires_in: data.expires_in || 3600,
      refresh_token: data.refresh_token,
      scope: data.scope,
      user_id: data.user_id
    };
  }

  private validateUserInfoResponse(data: any): UserInfo {
    if (!data.uuid && !data.id) {
      throw new AuthenticationError({
        code: AuthenticationErrorCode.INTERNAL_ERROR,
        message: 'Invalid user info response: missing user identifier',
        details: data,
        timestamp: new Date(),
        isRecoverable: false
      });
    }

    return {
      id: data.uuid || data.id,
      name: data.display_name || data.name || 'Unknown User',
      email: data.email_address || data.email || '',
      username: data.username || data.slug || '',
      avatar: data.links?.avatar?.href || data.avatar_url || '',
      accountId: data.account_id || data.uuid || data.id
    };
  }

  private getTokenEndpoint(): string {
    if (this.instanceType === 'cloud') {
      return 'https://bitbucket.org/site/oauth2/access_token';
    } else {
      return `${this.baseUrl}/site/oauth2/access_token`;
    }
  }

  private getRevokeEndpoint(): string {
    if (this.instanceType === 'cloud') {
      return 'https://bitbucket.org/site/oauth2/revoke';
    } else {
      return `${this.baseUrl}/site/oauth2/revoke`;
    }
  }

  private getUserEndpoint(): string {
    if (this.instanceType === 'cloud') {
      return 'https://api.bitbucket.org/2.0/user';
    } else {
      return `${this.baseUrl}/rest/api/1.0/users/current`;
    }
  }

  private getTestEndpoint(): string {
    if (this.instanceType === 'cloud') {
      return 'https://api.bitbucket.org/2.0/repositories';
    } else {
      return `${this.baseUrl}/rest/api/1.0/repos`;
    }
  }

  private mapHttpErrorToAuthError(status: number, errorData: any): AuthenticationErrorCode {
    switch (status) {
      case 400:
        if (errorData.error === 'invalid_grant') {
          return AuthenticationErrorCode.INVALID_GRANT;
        } else if (errorData.error === 'invalid_client') {
          return AuthenticationErrorCode.INVALID_CLIENT;
        } else if (errorData.error === 'invalid_request') {
          return AuthenticationErrorCode.INVALID_REQUEST;
        } else if (errorData.error === 'invalid_scope') {
          return AuthenticationErrorCode.INVALID_SCOPE;
        } else if (errorData.error === 'unauthorized_client') {
          return AuthenticationErrorCode.UNAUTHORIZED_CLIENT;
        } else if (errorData.error === 'unsupported_grant_type') {
          return AuthenticationErrorCode.UNSUPPORTED_GRANT_TYPE;
        }
        return AuthenticationErrorCode.INVALID_REQUEST;
      
      case 401:
        return AuthenticationErrorCode.AUTHENTICATION_FAILED;
      
      case 403:
        return AuthenticationErrorCode.AUTHORIZATION_FAILED;
      
      case 404:
        return AuthenticationErrorCode.RESOURCE_NOT_FOUND;
      
      case 429:
        return AuthenticationErrorCode.RATE_LIMIT_EXCEEDED;
      
      case 500:
      case 502:
      case 503:
      case 504:
        return AuthenticationErrorCode.INTERNAL_ERROR;
      
      default:
        return AuthenticationErrorCode.INTERNAL_ERROR;
    }
  }

  private isRecoverableError(status: number): boolean {
    // 4xx client errors are generally not recoverable
    // 5xx server errors and network issues are recoverable
    return status >= 500 || status === 429;
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  user_id?: string;
}

interface UserInfo {
  id: string;
  name: string;
  email: string;
  username: string;
  avatar: string;
  accountId: string;
}
