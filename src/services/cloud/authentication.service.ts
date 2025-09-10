/**
 * Authentication Service for Bitbucket Cloud REST API
 * Based on official documentation: https://developer.atlassian.com/cloud/bitbucket/rest/intro/#authentication
 */

import {
  AccessToken,
  ApiToken,
  AppPassword,
  AuthenticationConfig,
  AuthenticationError,
  AuthorizationUrlParams,
  CreateAccessTokenRequest,
  CreateAccessTokenResponse,
  CreateApiTokenRequest,
  CreateApiTokenResponse,
  CreateAppPasswordRequest,
  CreateAppPasswordResponse,
  DeleteAccessTokenParams,
  ExchangeCodeParams,
  ExchangeJwtParams,
  ListAccessTokensParams,
  ListAccessTokensResponse,
  ListApiTokensResponse,
  ListAppPasswordsResponse,
  OAuthApplication,
  OAuthApplicationRequest,
  OAuthApplicationResponse,
  OAuthErrorResponse,
  OAuthTokenResponse,
  RefreshTokenParams,
  RevokeTokenParams,
  TokenValidationResponse,
  UpdateAccessTokenParams,
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
   * Create Repository Access Token
   * POST /2.0/repositories/{workspace}/{repo_slug}/access-keys
   */
  async createRepositoryAccessToken(
    workspace: string,
    repoSlug: string,
    request: CreateAccessTokenRequest
  ): Promise<CreateAccessTokenResponse> {
    this.logger.info('Creating repository access token', {
      workspace,
      repoSlug,
      name: request.name,
    });

    try {
      const response = await this.apiClient.post<CreateAccessTokenResponse>(
        `/repositories/${workspace}/${repoSlug}/access-keys`,
        request
      );
      this.logger.info('Successfully created repository access token', { workspace, repoSlug });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create repository access token', {
        workspace,
        repoSlug,
        request,
        error,
      });
      throw error;
    }
  }

  /**
   * Create Project Access Token
   * POST /2.0/workspaces/{workspace}/projects/{project_key}/access-keys
   */
  async createProjectAccessToken(
    workspace: string,
    projectKey: string,
    request: CreateAccessTokenRequest
  ): Promise<CreateAccessTokenResponse> {
    this.logger.info('Creating project access token', {
      workspace,
      projectKey,
      name: request.name,
    });

    try {
      const response = await this.apiClient.post<CreateAccessTokenResponse>(
        `/workspaces/${workspace}/projects/${projectKey}/access-keys`,
        request
      );
      this.logger.info('Successfully created project access token', { workspace, projectKey });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create project access token', {
        workspace,
        projectKey,
        request,
        error,
      });
      throw error;
    }
  }

  /**
   * Create Workspace Access Token
   * POST /2.0/workspaces/{workspace}/access-keys
   */
  async createWorkspaceAccessToken(
    workspace: string,
    request: CreateAccessTokenRequest
  ): Promise<CreateAccessTokenResponse> {
    this.logger.info('Creating workspace access token', { workspace, name: request.name });

    try {
      const response = await this.apiClient.post<CreateAccessTokenResponse>(
        `/workspaces/${workspace}/access-keys`,
        request
      );
      this.logger.info('Successfully created workspace access token', { workspace });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create workspace access token', { workspace, request, error });
      throw error;
    }
  }

  /**
   * List Repository Access Tokens
   * GET /2.0/repositories/{workspace}/{repo_slug}/access-keys
   */
  async listRepositoryAccessTokens(
    workspace: string,
    repoSlug: string,
    params?: ListAccessTokensParams
  ): Promise<ListAccessTokensResponse> {
    this.logger.info('Listing repository access tokens', { workspace, repoSlug });

    try {
      const response = await this.apiClient.get<ListAccessTokensResponse>(
        `/repositories/${workspace}/${repoSlug}/access-keys`,
        { params }
      );
      this.logger.info('Successfully listed repository access tokens', {
        workspace,
        repoSlug,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list repository access tokens', { workspace, repoSlug, error });
      throw error;
    }
  }

  /**
   * List Project Access Tokens
   * GET /2.0/workspaces/{workspace}/projects/{project_key}/access-keys
   */
  async listProjectAccessTokens(
    workspace: string,
    projectKey: string,
    params?: ListAccessTokensParams
  ): Promise<ListAccessTokensResponse> {
    this.logger.info('Listing project access tokens', { workspace, projectKey });

    try {
      const response = await this.apiClient.get<ListAccessTokensResponse>(
        `/workspaces/${workspace}/projects/${projectKey}/access-keys`,
        { params }
      );
      this.logger.info('Successfully listed project access tokens', {
        workspace,
        projectKey,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list project access tokens', { workspace, projectKey, error });
      throw error;
    }
  }

  /**
   * List Workspace Access Tokens
   * GET /2.0/workspaces/{workspace}/access-keys
   */
  async listWorkspaceAccessTokens(
    workspace: string,
    params?: ListAccessTokensParams
  ): Promise<ListAccessTokensResponse> {
    this.logger.info('Listing workspace access tokens', { workspace });

    try {
      const response = await this.apiClient.get<ListAccessTokensResponse>(
        `/workspaces/${workspace}/access-keys`,
        { params }
      );
      this.logger.info('Successfully listed workspace access tokens', {
        workspace,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list workspace access tokens', { workspace, error });
      throw error;
    }
  }

  /**
   * Delete Access Token
   * DELETE /2.0/access-keys/{token_id}
   */
  async deleteAccessToken(params: DeleteAccessTokenParams): Promise<void> {
    this.logger.info('Deleting access token', { tokenId: params.token_id });

    try {
      await this.apiClient.delete(`/access-keys/${params.token_id}`);
      this.logger.info('Successfully deleted access token', { tokenId: params.token_id });
    } catch (error) {
      this.logger.error('Failed to delete access token', { params, error });
      throw error;
    }
  }

  /**
   * Update Access Token
   * PUT /2.0/access-keys/{token_id}
   */
  async updateAccessToken(params: UpdateAccessTokenParams): Promise<AccessToken> {
    this.logger.info('Updating access token', { tokenId: params.token_id });

    try {
      const response = await this.apiClient.put<AccessToken>(`/access-keys/${params.token_id}`, {
        name: params.name,
        scopes: params.scopes,
      });
      this.logger.info('Successfully updated access token', { tokenId: params.token_id });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update access token', { params, error });
      throw error;
    }
  }

  /**
   * Create App Password
   * POST /2.0/user/app-passwords
   */
  async createAppPassword(request: CreateAppPasswordRequest): Promise<CreateAppPasswordResponse> {
    this.logger.info('Creating app password', { name: request.name });

    try {
      const response = await this.apiClient.post<CreateAppPasswordResponse>(
        '/user/app-passwords',
        request
      );
      this.logger.info('Successfully created app password', { name: request.name });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create app password', { request, error });
      throw error;
    }
  }

  /**
   * List App Passwords
   * GET /2.0/user/app-passwords
   */
  async listAppPasswords(): Promise<ListAppPasswordsResponse> {
    this.logger.info('Listing app passwords');

    try {
      const response = await this.apiClient.get<ListAppPasswordsResponse>('/user/app-passwords');
      this.logger.info('Successfully listed app passwords', { count: response.data.values.length });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list app passwords', { error });
      throw error;
    }
  }

  /**
   * Delete App Password
   * DELETE /2.0/user/app-passwords/{app_password_id}
   */
  async deleteAppPassword(appPasswordId: string): Promise<void> {
    this.logger.info('Deleting app password', { appPasswordId });

    try {
      await this.apiClient.delete(`/user/app-passwords/${appPasswordId}`);
      this.logger.info('Successfully deleted app password', { appPasswordId });
    } catch (error) {
      this.logger.error('Failed to delete app password', { appPasswordId, error });
      throw error;
    }
  }

  /**
   * Create API Token
   * POST /2.0/user/api-tokens
   */
  async createApiToken(request: CreateApiTokenRequest): Promise<CreateApiTokenResponse> {
    this.logger.info('Creating API token', { name: request.name });

    try {
      const response = await this.apiClient.post<CreateApiTokenResponse>(
        '/user/api-tokens',
        request
      );
      this.logger.info('Successfully created API token', { name: request.name });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create API token', { request, error });
      throw error;
    }
  }

  /**
   * List API Tokens
   * GET /2.0/user/api-tokens
   */
  async listApiTokens(): Promise<ListApiTokensResponse> {
    this.logger.info('Listing API tokens');

    try {
      const response = await this.apiClient.get<ListApiTokensResponse>('/user/api-tokens');
      this.logger.info('Successfully listed API tokens', { count: response.data.values.length });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list API tokens', { error });
      throw error;
    }
  }

  /**
   * Delete API Token
   * DELETE /2.0/user/api-tokens/{api_token_id}
   */
  async deleteApiToken(apiTokenId: string): Promise<void> {
    this.logger.info('Deleting API token', { apiTokenId });

    try {
      await this.apiClient.delete(`/user/api-tokens/${apiTokenId}`);
      this.logger.info('Successfully deleted API token', { apiTokenId });
    } catch (error) {
      this.logger.error('Failed to delete API token', { apiTokenId, error });
      throw error;
    }
  }

  /**
   * Get OAuth Authorization URL
   * Generates the authorization URL for OAuth 2.0 Authorization Code Grant flow
   */
  getOAuthAuthorizationUrl(params: AuthorizationUrlParams): string {
    this.logger.info('Generating OAuth authorization URL', { clientId: params.client_id });

    const urlParams = new URLSearchParams({
      client_id: params.client_id,
      redirect_uri: params.redirect_uri,
      scope: params.scopes.join(' '),
      response_type: params.response_type || 'code',
    });

    if (params.state) {
      urlParams.append('state', params.state);
    }

    const url = `https://bitbucket.org/site/oauth2/authorize?${urlParams.toString()}`;
    this.logger.info('Generated OAuth authorization URL');
    return url;
  }

  /**
   * Exchange Authorization Code for Access Token
   * POST https://bitbucket.org/site/oauth2/access_token
   */
  async exchangeCodeForToken(params: ExchangeCodeParams): Promise<OAuthTokenResponse> {
    this.logger.info('Exchanging authorization code for access token');

    try {
      const response = await this.apiClient.post<OAuthTokenResponse>(
        'https://bitbucket.org/site/oauth2/access_token',
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      this.logger.info('Successfully exchanged code for access token');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to exchange code for access token', { error });
      throw error;
    }
  }

  /**
   * Refresh OAuth Token
   * POST https://bitbucket.org/site/oauth2/access_token
   */
  async refreshOAuthToken(params: RefreshTokenParams): Promise<OAuthTokenResponse> {
    this.logger.info('Refreshing OAuth token');

    try {
      const response = await this.apiClient.post<OAuthTokenResponse>(
        'https://bitbucket.org/site/oauth2/access_token',
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      this.logger.info('Successfully refreshed OAuth token');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to refresh OAuth token', { error });
      throw error;
    }
  }

  /**
   * Exchange JWT for Access Token (Bitbucket-specific flow)
   * POST https://bitbucket.org/site/oauth2/access_token
   */
  async exchangeJwtForToken(params: ExchangeJwtParams): Promise<OAuthTokenResponse> {
    this.logger.info('Exchanging JWT for access token');

    try {
      const response = await this.apiClient.post<OAuthTokenResponse>(
        'https://bitbucket.org/site/oauth2/access_token',
        params,
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
      throw error;
    }
  }

  /**
   * Revoke OAuth Token
   * POST https://bitbucket.org/site/oauth2/revoke
   */
  async revokeOAuthToken(params: RevokeTokenParams): Promise<void> {
    this.logger.info('Revoking OAuth token');

    try {
      await this.apiClient.post('https://bitbucket.org/site/oauth2/revoke', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      this.logger.info('Successfully revoked OAuth token');
    } catch (error) {
      this.logger.error('Failed to revoke OAuth token', { error });
      throw error;
    }
  }

  /**
   * Validate Token
   * GET /2.0/user
   */
  async validateToken(token: string): Promise<TokenValidationResponse> {
    this.logger.info('Validating token');

    try {
      const response = await this.apiClient.get('/user', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const validation: TokenValidationResponse = {
        valid: true,
        type: 'oauth',
        scopes: [], // Would need to be extracted from token or additional API call
      };

      this.logger.info('Successfully validated token');
      return validation;
    } catch (error) {
      this.logger.error('Failed to validate token', { error });
      return {
        valid: false,
        type: 'oauth',
      };
    }
  }

  /**
   * Create OAuth Application
   * POST /2.0/oauth/applications
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
      this.logger.info('Successfully created OAuth application', { name: request.name });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create OAuth application', { request, error });
      throw error;
    }
  }

  /**
   * Get OAuth Application
   * GET /2.0/oauth/applications/{client_id}
   */
  async getOAuthApplication(clientId: string): Promise<OAuthApplication> {
    this.logger.info('Getting OAuth application', { clientId });

    try {
      const response = await this.apiClient.get<OAuthApplication>(
        `/oauth/applications/${clientId}`
      );
      this.logger.info('Successfully retrieved OAuth application', { clientId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get OAuth application', { clientId, error });
      throw error;
    }
  }

  /**
   * Update OAuth Application
   * PUT /2.0/oauth/applications/{client_id}
   */
  async updateOAuthApplication(
    clientId: string,
    request: OAuthApplicationRequest
  ): Promise<OAuthApplication> {
    this.logger.info('Updating OAuth application', { clientId });

    try {
      const response = await this.apiClient.put<OAuthApplication>(
        `/oauth/applications/${clientId}`,
        request
      );
      this.logger.info('Successfully updated OAuth application', { clientId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update OAuth application', { clientId, request, error });
      throw error;
    }
  }

  /**
   * Delete OAuth Application
   * DELETE /2.0/oauth/applications/{client_id}
   */
  async deleteOAuthApplication(clientId: string): Promise<void> {
    this.logger.info('Deleting OAuth application', { clientId });

    try {
      await this.apiClient.delete(`/oauth/applications/${clientId}`);
      this.logger.info('Successfully deleted OAuth application', { clientId });
    } catch (error) {
      this.logger.error('Failed to delete OAuth application', { clientId, error });
      throw error;
    }
  }

  /**
   * List OAuth Applications
   * GET /2.0/oauth/applications
   */
  async listOAuthApplications(): Promise<OAuthApplication[]> {
    this.logger.info('Listing OAuth applications');

    try {
      const response = await this.apiClient.get<{ values: OAuthApplication[] }>(
        '/oauth/applications'
      );
      this.logger.info('Successfully listed OAuth applications', {
        count: response.data.values.length,
      });
      return response.data.values;
    } catch (error) {
      this.logger.error('Failed to list OAuth applications', { error });
      throw error;
    }
  }

  /**
   * Validate Authentication Configuration
   */
  validateAuthenticationConfig(config: AuthenticationConfig): boolean {
    this.logger.info('Validating authentication configuration', { type: config.type });

    switch (config.type) {
      case 'repository_access_token':
      case 'project_access_token':
      case 'workspace_access_token':
        return !!config.credentials.token;
      case 'app_password':
        return !!(config.credentials.username && config.credentials.password);
      case 'api_token':
        return !!(config.credentials.username && config.credentials.password);
      case 'oauth':
        return !!(config.credentials.client_id && config.credentials.client_secret);
      default:
        this.logger.error('Invalid authentication type', { type: config.type });
        return false;
    }
  }

  /**
   * Get Authentication Method from Config
   */
  getAuthenticationMethod(config: AuthenticationConfig): string {
    return config.type;
  }
}
