/**
 * Authentication Service for Bitbucket Data Center REST API
 * Based on official documentation: https://developer.atlassian.com/server/bitbucket/rest/v906/intro/
 */

import {
  AccessTokenInfo,
  AuthenticationConfig,
  AuthenticationError,
  AuthenticationMethod,
  OAuthApplication,
  OAuthApplicationRequest,
  OAuthApplicationResponse,
  OAuthAuthorizationRequest,
  OAuthAuthorizationResponse,
  OAuthTokenRequest,
  OAuthTokenResponse,
  SessionManagement,
  UserSession,
} from './types/authentication.types.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';

export class AuthenticationService {
  private readonly apiClient: ApiClient;
  private readonly logger: Logger;

  constructor(apiClient: ApiClient, logger: Logger) {
    this.apiClient = apiClient;
    this.logger = logger;
  }

  /**
   * Authenticate using OAuth authorization code flow
   * POST /rest/api/1.0/oauth/token
   */
  async getOAuthToken(request: OAuthTokenRequest): Promise<OAuthTokenResponse> {
    this.logger.info('Getting OAuth token', { grantType: request.grant_type });

    try {
      const response = await this.apiClient.post<OAuthTokenResponse>('/oauth/token', request);
      this.logger.info('Successfully obtained OAuth token');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get OAuth token', { request, error });
      throw error;
    }
  }

  /**
   * Refresh OAuth token
   * POST /rest/api/1.0/oauth/token
   */
  async refreshOAuthToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string
  ): Promise<OAuthTokenResponse> {
    this.logger.info('Refreshing OAuth token');

    const request: OAuthTokenRequest = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    };

    try {
      const response = await this.apiClient.post<OAuthTokenResponse>('/oauth/token', request);
      this.logger.info('Successfully refreshed OAuth token');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to refresh OAuth token', { error });
      throw error;
    }
  }

  /**
   * Get OAuth authorization URL
   * GET /rest/api/1.0/oauth/authorize
   */
  getOAuthAuthorizationUrl(request: OAuthAuthorizationRequest): string {
    this.logger.info('Generating OAuth authorization URL', { clientId: request.client_id });

    const params = new URLSearchParams({
      response_type: request.response_type,
      client_id: request.client_id,
      redirect_uri: request.redirect_uri,
      scope: request.scope,
    });

    if (request.state) {
      params.append('state', request.state);
    }

    const baseUrl = this.apiClient.getBaseUrl();
    const url = `${baseUrl}/oauth/authorize?${params.toString()}`;

    this.logger.info('Generated OAuth authorization URL');
    return url;
  }

  /**
   * Get access token information
   * GET /rest/api/1.0/oauth/token/info
   */
  async getAccessTokenInfo(accessToken: string): Promise<AccessTokenInfo> {
    this.logger.info('Getting access token information');

    try {
      const response = await this.apiClient.get<AccessTokenInfo>('/oauth/token/info', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      this.logger.info('Successfully retrieved access token information');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get access token information', { error });
      throw error;
    }
  }

  /**
   * Revoke access token
   * POST /rest/api/1.0/oauth/token/revoke
   */
  async revokeAccessToken(accessToken: string): Promise<void> {
    this.logger.info('Revoking access token');

    try {
      await this.apiClient.post(
        '/oauth/token/revoke',
        {
          token: accessToken,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      this.logger.info('Successfully revoked access token');
    } catch (error) {
      this.logger.error('Failed to revoke access token', { error });
      throw error;
    }
  }

  /**
   * Create OAuth application
   * POST /rest/api/1.0/oauth/applications
   */
  async createOAuthApplication(
    request: OAuthApplicationRequest
  ): Promise<OAuthApplicationResponse> {
    this.logger.info('Creating OAuth application', { name: request.name });

    try {
      const response = await this.apiClient.post<OAuthApplicationResponse>(
        '/oauth/applications',
        request
      );
      this.logger.info('Successfully created OAuth application', { id: response.data.id });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create OAuth application', { request, error });
      throw error;
    }
  }

  /**
   * Get OAuth application
   * GET /rest/api/1.0/oauth/applications/{applicationId}
   */
  async getOAuthApplication(applicationId: string): Promise<OAuthApplication> {
    this.logger.info('Getting OAuth application', { applicationId });

    try {
      const response = await this.apiClient.get<OAuthApplication>(
        `/oauth/applications/${applicationId}`
      );
      this.logger.info('Successfully retrieved OAuth application', { applicationId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get OAuth application', { applicationId, error });
      throw error;
    }
  }

  /**
   * Update OAuth application
   * PUT /rest/api/1.0/oauth/applications/{applicationId}
   */
  async updateOAuthApplication(
    applicationId: string,
    request: OAuthApplicationRequest
  ): Promise<OAuthApplication> {
    this.logger.info('Updating OAuth application', { applicationId, request });

    try {
      const response = await this.apiClient.put<OAuthApplication>(
        `/oauth/applications/${applicationId}`,
        request
      );
      this.logger.info('Successfully updated OAuth application', { applicationId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update OAuth application', { applicationId, request, error });
      throw error;
    }
  }

  /**
   * Delete OAuth application
   * DELETE /rest/api/1.0/oauth/applications/{applicationId}
   */
  async deleteOAuthApplication(applicationId: string): Promise<void> {
    this.logger.info('Deleting OAuth application', { applicationId });

    try {
      await this.apiClient.delete(`/oauth/applications/${applicationId}`);
      this.logger.info('Successfully deleted OAuth application', { applicationId });
    } catch (error) {
      this.logger.error('Failed to delete OAuth application', { applicationId, error });
      throw error;
    }
  }

  /**
   * List OAuth applications
   * GET /rest/api/1.0/oauth/applications
   */
  async listOAuthApplications(): Promise<OAuthApplication[]> {
    this.logger.info('Listing OAuth applications');

    try {
      const response = await this.apiClient.get<{ applications: OAuthApplication[] }>(
        '/oauth/applications'
      );
      this.logger.info('Successfully listed OAuth applications', {
        count: response.data.applications.length,
      });
      return response.data.applications;
    } catch (error) {
      this.logger.error('Failed to list OAuth applications', { error });
      throw error;
    }
  }

  /**
   * Get current user session
   * GET /rest/api/1.0/session
   */
  async getCurrentSession(): Promise<UserSession> {
    this.logger.info('Getting current user session');

    try {
      const response = await this.apiClient.get<UserSession>('/session');
      this.logger.info('Successfully retrieved current user session');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get current user session', { error });
      throw error;
    }
  }

  /**
   * Create user session
   * POST /rest/api/1.0/session
   */
  async createSession(userId: number): Promise<UserSession> {
    this.logger.info('Creating user session', { userId });

    try {
      const response = await this.apiClient.post<UserSession>('/session', { userId });
      this.logger.info('Successfully created user session', { userId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create user session', { userId, error });
      throw error;
    }
  }

  /**
   * Refresh user session
   * PUT /rest/api/1.0/session/{sessionId}
   */
  async refreshSession(sessionId: string): Promise<UserSession> {
    this.logger.info('Refreshing user session', { sessionId });

    try {
      const response = await this.apiClient.put<UserSession>(`/session/${sessionId}`);
      this.logger.info('Successfully refreshed user session', { sessionId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to refresh user session', { sessionId, error });
      throw error;
    }
  }

  /**
   * Revoke user session
   * DELETE /rest/api/1.0/session/{sessionId}
   */
  async revokeSession(sessionId: string): Promise<void> {
    this.logger.info('Revoking user session', { sessionId });

    try {
      await this.apiClient.delete(`/session/${sessionId}`);
      this.logger.info('Successfully revoked user session', { sessionId });
    } catch (error) {
      this.logger.error('Failed to revoke user session', { sessionId, error });
      throw error;
    }
  }

  /**
   * List active sessions for user
   * GET /rest/api/1.0/sessions/user/{userId}
   */
  async listActiveSessions(userId: number): Promise<UserSession[]> {
    this.logger.info('Listing active sessions for user', { userId });

    try {
      const response = await this.apiClient.get<{ sessions: UserSession[] }>(
        `/sessions/user/${userId}`
      );
      this.logger.info('Successfully listed active sessions for user', {
        userId,
        count: response.data.sessions.length,
      });
      return response.data.sessions;
    } catch (error) {
      this.logger.error('Failed to list active sessions for user', { userId, error });
      throw error;
    }
  }

  /**
   * Validate authentication configuration
   */
  validateAuthenticationConfig(config: AuthenticationConfig): boolean {
    this.logger.info('Validating authentication configuration', { method: config.method });

    switch (config.method) {
      case 'BASIC':
        return !!(config.username && config.password);
      case 'OAUTH':
        return !!(config.clientId && config.clientSecret);
      case 'ACCESS_TOKEN':
        return !!config.token;
      case 'COOKIE':
        return true; // Cookie authentication doesn't require additional config
      default:
        this.logger.error('Invalid authentication method', { method: config.method });
        return false;
    }
  }

  /**
   * Get authentication method from config
   */
  getAuthenticationMethod(config: AuthenticationConfig): AuthenticationMethod {
    return config.method;
  }
}
