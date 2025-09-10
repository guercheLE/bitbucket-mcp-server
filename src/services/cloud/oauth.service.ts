/**
 * OAuth 2.0 Service for Bitbucket Cloud REST API
 * Based on official documentation: https://developer.atlassian.com/cloud/bitbucket/rest/intro/#authentication
 */

import {
  OAuthAuthorizationRequest,
  OAuthAuthorizationResponse,
  OAuthAuthorizationErrorResponse,
  OAuthTokenRequest,
  OAuthTokenResponse,
  OAuthTokenErrorResponse,
  OAuthTokenIntrospectionRequest,
  OAuthTokenIntrospectionResponse,
  OAuthTokenRevocationRequest,
  OAuthClientCredentials,
  OAuthAuthorizationServerMetadata,
  OAuthPKCEParams,
  OAuthState,
  OAuthSession,
  OAuthConfig,
  OAuthErrorDetails,
  OAuthTokenValidationResult,
  OAuthRefreshTokenRequest,
  OAuthJWTExchangeRequest,
  OAuthDeviceFlowRequest,
  OAuthDeviceFlowResponse,
  OAuthDeviceFlowTokenRequest,
  OAuthDeviceFlowErrorResponse,
  OAuthScope,
  OAuthGrantType,
  OAuthErrorType,
  OAuthTokenType,
} from './types/authentication.types.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';
import { createHash, randomBytes } from 'crypto';

export class OAuthService {
  private readonly apiClient: ApiClient;
  private readonly logger: Logger;
  private readonly config: OAuthConfig;
  private readonly stateStorage: Map<string, OAuthState> = new Map();

  constructor(apiClient: ApiClient, logger: Logger, config: OAuthConfig) {
    this.apiClient = apiClient;
    this.logger = logger;
    this.config = config;
  }

  /**
   * Generate OAuth 2.0 Authorization URL
   * Creates the authorization URL for the Authorization Code Grant flow
   */
  generateAuthorizationUrl(params?: Partial<OAuthAuthorizationRequest>): string {
    this.logger.info('Generating OAuth authorization URL', {
      clientId: this.config.client_id,
    });

    const state = this.generateState();
    const requestParams: OAuthAuthorizationRequest = {
      client_id: this.config.client_id,
      redirect_uri: this.config.redirect_uri,
      scope: this.config.scopes.join(' '),
      response_type: 'code',
      state,
      ...params,
    };

    const urlParams = new URLSearchParams();
    Object.entries(requestParams).forEach(([key, value]) => {
      if (value !== undefined) {
        urlParams.append(key, value.toString());
      }
    });

    const url = `${this.config.authorization_endpoint}?${urlParams.toString()}`;
    this.logger.info('Generated OAuth authorization URL', { state });
    return url;
  }

  /**
   * Generate OAuth 2.0 Authorization URL with PKCE
   * Creates the authorization URL with PKCE parameters for enhanced security
   */
  generateAuthorizationUrlWithPKCE(params?: Partial<OAuthAuthorizationRequest>): {
    url: string;
    codeVerifier: string;
    state: string;
  } {
    this.logger.info('Generating OAuth authorization URL with PKCE');

    const state = this.generateState();
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(codeVerifier);

    const requestParams: OAuthAuthorizationRequest = {
      client_id: this.config.client_id,
      redirect_uri: this.config.redirect_uri,
      scope: this.config.scopes.join(' '),
      response_type: 'code',
      state,
      ...params,
    };

    const urlParams = new URLSearchParams();
    Object.entries(requestParams).forEach(([key, value]) => {
      if (value !== undefined) {
        urlParams.append(key, value.toString());
      }
    });

    // Add PKCE parameters
    urlParams.append('code_challenge', codeChallenge);
    urlParams.append('code_challenge_method', 'S256');

    const url = `${this.config.authorization_endpoint}?${urlParams.toString()}`;

    // Store state with code verifier
    this.stateStorage.set(state, {
      state,
      code_verifier: codeVerifier,
      created_at: Date.now(),
      expires_at: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    this.logger.info('Generated OAuth authorization URL with PKCE', {
      state,
      codeVerifier: codeVerifier.substring(0, 8) + '...',
    });

    return { url, codeVerifier, state };
  }

  /**
   * Exchange Authorization Code for Access Token
   * POST https://bitbucket.org/site/oauth2/access_token
   */
  async exchangeCodeForToken(
    code: string,
    state?: string,
    codeVerifier?: string
  ): Promise<OAuthTokenResponse> {
    this.logger.info('Exchanging authorization code for access token');

    const tokenRequest: OAuthTokenRequest = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.config.redirect_uri,
      client_id: this.config.client_id,
      client_secret: this.config.client_secret,
    };

    // Add PKCE code verifier if provided
    if (codeVerifier) {
      (tokenRequest as any).code_verifier = codeVerifier;
    }

    try {
      const response = await this.apiClient.post<OAuthTokenResponse>(
        this.config.token_endpoint,
        tokenRequest,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      // Clean up state if provided
      if (state) {
        this.stateStorage.delete(state);
      }

      this.logger.info('Successfully exchanged code for access token');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to exchange code for access token', { error });
      throw this.handleOAuthError(error);
    }
  }

  /**
   * Generate Implicit Grant Authorization URL
   * GET https://bitbucket.org/site/oauth2/authorize
   */
  generateImplicitGrantUrl(params?: Partial<OAuthAuthorizationRequest>): string {
    this.logger.info('Generating implicit grant authorization URL', {
      clientId: this.config.client_id,
    });

    const request: OAuthAuthorizationRequest = {
      client_id: this.config.client_id,
      response_type: 'code', // This will be overridden for implicit grant
      redirect_uri: this.config.redirect_uri,
      scope: params?.scope || 'account',
      state: params?.state || this.generateState(),
      ...params,
    };

    // Override response_type for implicit grant
    (request as any).response_type = 'token';

    const urlParams = new URLSearchParams();
    Object.entries(request).forEach(([key, value]) => {
      if (value !== undefined) {
        urlParams.append(key, String(value));
      }
    });

    const url = `${this.config.authorization_endpoint}?${urlParams.toString()}`;

    this.logger.info('Generated implicit grant authorization URL', {
      state: request.state,
    });

    return url;
  }

  /**
   * Parse Implicit Grant Response from URL Fragment
   * Extracts access token from URL fragment after redirect
   */
  parseImplicitGrantResponse(urlFragment: string): OAuthTokenResponse {
    this.logger.info('Parsing implicit grant response from URL fragment');

    const params = new URLSearchParams(urlFragment);
    const accessToken = params.get('access_token');
    const tokenType = params.get('token_type');
    const expiresIn = params.get('expires_in');
    const scope = params.get('scope');
    const state = params.get('state');
    const error = params.get('error');
    const errorDescription = params.get('error_description');

    if (error) {
      this.logger.error('Implicit grant error in response', { error, errorDescription });
      throw new Error(`OAuth error: ${error} - ${errorDescription}`);
    }

    if (!accessToken || !tokenType) {
      this.logger.error('Missing required parameters in implicit grant response');
      throw new Error('Missing access_token or token_type in response');
    }

    const tokenResponse: OAuthTokenResponse = {
      access_token: accessToken,
      token_type: tokenType,
      expires_in: expiresIn ? parseInt(expiresIn, 10) : 3600,
      scope: scope || undefined,
    };

    this.logger.info('Successfully parsed implicit grant response');
    return tokenResponse;
  }

  /**
   * Refresh OAuth Access Token
   * POST https://bitbucket.org/site/oauth2/access_token
   */
  async refreshAccessToken(refreshToken: string): Promise<OAuthTokenResponse> {
    this.logger.info('Refreshing OAuth access token');

    const refreshRequest: OAuthRefreshTokenRequest = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.config.client_id,
      client_secret: this.config.client_secret,
    };

    try {
      const response = await this.apiClient.post<OAuthTokenResponse>(
        this.config.token_endpoint,
        refreshRequest,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.logger.info('Successfully refreshed OAuth access token');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to refresh OAuth access token', { error });
      throw this.handleOAuthError(error);
    }
  }

  /**
   * Client Credentials Grant
   * POST https://bitbucket.org/site/oauth2/access_token
   */
  async getClientCredentialsToken(scope?: string): Promise<OAuthTokenResponse> {
    this.logger.info('Getting client credentials token');

    try {
      const response = await this.apiClient.post<OAuthTokenResponse>(
        '/site/oauth2/access_token',
        {
          grant_type: 'client_credentials',
          scope,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${this.config.client_id}:${this.config.client_secret}`).toString('base64')}`,
          },
        }
      );

      this.logger.info('Successfully obtained client credentials token');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get client credentials token', { error });
      throw this.handleOAuthError(error);
    }
  }

  /**
   * Exchange JWT for Access Token (Bitbucket-specific flow)
   * POST https://bitbucket.org/site/oauth2/access_token
   */
  async exchangeJWTForToken(jwtToken: string): Promise<OAuthTokenResponse> {
    this.logger.info('Exchanging JWT for access token');

    const jwtRequest: OAuthJWTExchangeRequest = {
      grant_type: 'urn:bitbucket:oauth2:jwt',
      assertion: jwtToken,
      client_id: this.config.client_id,
      client_secret: this.config.client_secret,
    };

    try {
      const response = await this.apiClient.post<OAuthTokenResponse>(
        this.config.token_endpoint,
        jwtRequest,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.logger.info('Successfully exchanged JWT for access token');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to exchange JWT for access token', { error });
      throw this.handleOAuthError(error);
    }
  }

  /**
   * Revoke OAuth Token
   * POST https://bitbucket.org/site/oauth2/revoke
   */
  async revokeToken(
    token: string,
    tokenTypeHint?: 'access_token' | 'refresh_token'
  ): Promise<void> {
    this.logger.info('Revoking OAuth token');

    const revokeRequest: OAuthTokenRevocationRequest = {
      token,
      token_type_hint: tokenTypeHint,
      client_id: this.config.client_id,
      client_secret: this.config.client_secret,
    };

    try {
      await this.apiClient.post(
        this.config.revocation_endpoint || 'https://bitbucket.org/site/oauth2/revoke',
        revokeRequest,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.logger.info('Successfully revoked OAuth token');
    } catch (error) {
      this.logger.error('Failed to revoke OAuth token', { error });
      throw this.handleOAuthError(error);
    }
  }

  /**
   * Introspect OAuth Token
   * POST https://bitbucket.org/site/oauth2/introspect
   */
  async introspectToken(
    token: string,
    tokenTypeHint?: 'access_token' | 'refresh_token'
  ): Promise<OAuthTokenIntrospectionResponse> {
    this.logger.info('Introspecting OAuth token');

    const introspectionRequest: OAuthTokenIntrospectionRequest = {
      token,
      token_type_hint: tokenTypeHint,
    };

    try {
      const response = await this.apiClient.post<OAuthTokenIntrospectionResponse>(
        this.config.introspection_endpoint || 'https://bitbucket.org/site/oauth2/introspect',
        introspectionRequest,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${this.config.client_id}:${this.config.client_secret}`).toString('base64')}`,
          },
        }
      );

      this.logger.info('Successfully introspected OAuth token', {
        active: response.data.active,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to introspect OAuth token', { error });
      throw this.handleOAuthError(error);
    }
  }

  /**
   * Validate OAuth Token
   * Validates token by making a test API call
   */
  async validateToken(token: string): Promise<OAuthTokenValidationResult> {
    this.logger.info('Validating OAuth token');

    try {
      // Test the token by making a simple API call
      const response = await this.apiClient.get('/user', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const validation: OAuthTokenValidationResult = {
        valid: true,
        token_type: 'Bearer',
        // Extract scope from token if available
        scope: this.extractScopeFromToken(token),
      };

      this.logger.info('Successfully validated OAuth token');
      return validation;
    } catch (error) {
      this.logger.error('Failed to validate OAuth token', { error });
      return {
        valid: false,
        error: {
          error: 'invalid_grant',
          error_description: 'Token validation failed',
          timestamp: Date.now(),
        },
      };
    }
  }

  /**
   * Get Authorization Server Metadata
   * GET /.well-known/oauth-authorization-server
   */
  async getAuthorizationServerMetadata(): Promise<OAuthAuthorizationServerMetadata> {
    this.logger.info('Getting authorization server metadata');

    try {
      const response = await this.apiClient.get<OAuthAuthorizationServerMetadata>(
        'https://bitbucket.org/.well-known/oauth-authorization-server'
      );

      this.logger.info('Successfully retrieved authorization server metadata');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get authorization server metadata', { error });
      throw this.handleOAuthError(error);
    }
  }

  /**
   * Start Device Flow
   * POST https://bitbucket.org/site/oauth2/device
   */
  async startDeviceFlow(scope?: string): Promise<OAuthDeviceFlowResponse> {
    this.logger.info('Starting OAuth device flow');

    const deviceRequest: OAuthDeviceFlowRequest = {
      client_id: this.config.client_id,
      scope: scope || this.config.scopes.join(' '),
    };

    try {
      const response = await this.apiClient.post<OAuthDeviceFlowResponse>(
        'https://bitbucket.org/site/oauth2/device',
        deviceRequest,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.logger.info('Successfully started OAuth device flow', {
        deviceCode: response.data.device_code.substring(0, 8) + '...',
        userCode: response.data.user_code,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to start OAuth device flow', { error });
      throw this.handleOAuthError(error);
    }
  }

  /**
   * Poll for Device Flow Token
   * POST https://bitbucket.org/site/oauth2/access_token
   */
  async pollDeviceFlowToken(deviceCode: string, interval: number = 5): Promise<OAuthTokenResponse> {
    this.logger.info('Polling for device flow token');

    const tokenRequest: OAuthDeviceFlowTokenRequest = {
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      device_code: deviceCode,
      client_id: this.config.client_id,
      client_secret: this.config.client_secret,
    };

    try {
      const response = await this.apiClient.post<OAuthTokenResponse>(
        this.config.token_endpoint,
        tokenRequest,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.logger.info('Successfully obtained device flow token');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to poll device flow token', { error });
      throw this.handleOAuthError(error);
    }
  }

  /**
   * Create OAuth Session
   * Creates a session object from token response
   */
  createSession(tokenResponse: OAuthTokenResponse, state?: string): OAuthSession {
    this.logger.info('Creating OAuth session');

    const session: OAuthSession = {
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      token_type: tokenResponse.token_type as OAuthTokenType,
      expires_at: Date.now() + tokenResponse.expires_in * 1000,
      scope: tokenResponse.scope,
      state,
    };

    this.logger.info('Successfully created OAuth session');
    return session;
  }

  /**
   * Check if Session is Expired
   */
  isSessionExpired(session: OAuthSession): boolean {
    return Date.now() >= session.expires_at;
  }

  /**
   * Refresh Session if Needed
   */
  async refreshSessionIfNeeded(session: OAuthSession): Promise<OAuthSession> {
    if (this.isSessionExpired(session) && session.refresh_token) {
      this.logger.info('Session expired, refreshing token');
      const newTokenResponse = await this.refreshAccessToken(session.refresh_token);
      return this.createSession(newTokenResponse, session.state);
    }
    return session;
  }

  /**
   * Generate Random State
   */
  private generateState(): string {
    const length = this.config.state_length || 32;
    return randomBytes(length).toString('hex');
  }

  /**
   * Generate Code Verifier for PKCE
   */
  private generateCodeVerifier(): string {
    return randomBytes(32).toString('base64url');
  }

  /**
   * Generate Code Challenge for PKCE
   */
  private generateCodeChallenge(codeVerifier: string): string {
    return createHash('sha256').update(codeVerifier).digest('base64url');
  }

  /**
   * Extract Scope from Token
   * This is a placeholder - in a real implementation, you would decode the JWT
   */
  private extractScopeFromToken(token: string): string[] {
    // In a real implementation, you would decode the JWT token
    // and extract the scope claim
    return this.config.scopes;
  }

  /**
   * Handle OAuth Errors
   */
  private handleOAuthError(error: any): OAuthErrorDetails {
    const errorDetails: OAuthErrorDetails = {
      error: 'server_error',
      error_description: 'An unexpected error occurred',
      timestamp: Date.now(),
    };

    if (error.response?.data) {
      const oauthError = error.response.data as OAuthTokenErrorResponse;
      errorDetails.error = oauthError.error as OAuthErrorType;
      errorDetails.error_description = oauthError.error_description;
      errorDetails.error_uri = oauthError.error_uri;
    }

    return errorDetails;
  }

  /**
   * Clean Up Expired States
   */
  cleanupExpiredStates(): void {
    const now = Date.now();
    for (const [state, stateData] of this.stateStorage.entries()) {
      if (now >= stateData.expires_at) {
        this.stateStorage.delete(state);
      }
    }
  }

  /**
   * Get Stored State
   */
  getStoredState(state: string): OAuthState | undefined {
    return this.stateStorage.get(state);
  }

  /**
   * Remove Stored State
   */
  removeStoredState(state: string): boolean {
    return this.stateStorage.delete(state);
  }
}
