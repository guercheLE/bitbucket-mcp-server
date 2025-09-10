/**
 * Token Management Service for Bitbucket Cloud REST API
 * Based on official documentation: https://developer.atlassian.com/cloud/bitbucket/rest/intro/#authentication
 */

import {
  AccessToken,
  AccessTokenType,
  AccessTokenScope,
  RepositoryAccessToken,
  ProjectAccessToken,
  WorkspaceAccessToken,
  CreateAccessTokenRequest,
  CreateAccessTokenResponse,
  CreateRepositoryAccessTokenRequest,
  CreateProjectAccessTokenRequest,
  CreateWorkspaceAccessTokenRequest,
  ListAccessTokensParams,
  ListAccessTokensResponse,
  DeleteAccessTokenParams,
  UpdateAccessTokenParams,
  AppPassword,
  CreateAppPasswordRequest,
  CreateAppPasswordResponse,
  ListAppPasswordsResponse,
  ApiToken,
  CreateApiTokenRequest,
  CreateApiTokenResponse,
  ListApiTokensResponse,
  TokenValidationResponse,
  AuthenticationConfig,
  AuthenticationError,
  RepositoryAccessTokenScope,
  ProjectAccessTokenScope,
  WorkspaceAccessTokenScope,
} from './types/authentication.types.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';

export class TokenManagementService {
  private readonly apiClient: ApiClient;
  private readonly logger: Logger;

  constructor(apiClient: ApiClient, logger: Logger) {
    this.apiClient = apiClient;
    this.logger = logger;
  }

  // ===== ACCESS TOKENS =====

  /**
   * Create Repository Access Token
   * POST /2.0/repositories/{workspace}/{repo_slug}/access-keys
   */
  async createRepositoryAccessToken(
    workspace: string,
    repoSlug: string,
    request: CreateRepositoryAccessTokenRequest
  ): Promise<CreateAccessTokenResponse> {
    this.logger.info('Creating repository access token', {
      workspace,
      repoSlug,
      name: request.name,
    });

    this.validateRepositoryAccessTokenRequest(request);

    try {
      const response = await this.apiClient.post<CreateAccessTokenResponse>(
        `/repositories/${workspace}/${repoSlug}/access-keys`,
        request
      );
      this.logger.info('Successfully created repository access token', {
        workspace,
        repoSlug,
        tokenId: response.data.access_token.id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create repository access token', {
        workspace,
        repoSlug,
        request,
        error,
      });
      throw this.handleTokenError(error, 'repository_access_token');
    }
  }

  /**
   * Create Project Access Token
   * POST /2.0/workspaces/{workspace}/projects/{project_key}/access-keys
   */
  async createProjectAccessToken(
    workspace: string,
    projectKey: string,
    request: CreateProjectAccessTokenRequest
  ): Promise<CreateAccessTokenResponse> {
    this.logger.info('Creating project access token', {
      workspace,
      projectKey,
      name: request.name,
    });

    this.validateProjectAccessTokenRequest(request);

    try {
      const response = await this.apiClient.post<CreateAccessTokenResponse>(
        `/workspaces/${workspace}/projects/${projectKey}/access-keys`,
        request
      );
      this.logger.info('Successfully created project access token', {
        workspace,
        projectKey,
        tokenId: response.data.access_token.id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create project access token', {
        workspace,
        projectKey,
        request,
        error,
      });
      throw this.handleTokenError(error, 'project_access_token');
    }
  }

  /**
   * Create Workspace Access Token
   * POST /2.0/workspaces/{workspace}/access-keys
   */
  async createWorkspaceAccessToken(
    workspace: string,
    request: CreateWorkspaceAccessTokenRequest
  ): Promise<CreateAccessTokenResponse> {
    this.logger.info('Creating workspace access token', {
      workspace,
      name: request.name,
    });

    this.validateWorkspaceAccessTokenRequest(request);

    try {
      const response = await this.apiClient.post<CreateAccessTokenResponse>(
        `/workspaces/${workspace}/access-keys`,
        request
      );
      this.logger.info('Successfully created workspace access token', {
        workspace,
        tokenId: response.data.access_token.id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create workspace access token', {
        workspace,
        request,
        error,
      });
      throw this.handleTokenError(error, 'workspace_access_token');
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
      this.logger.error('Failed to list repository access tokens', {
        workspace,
        repoSlug,
        error,
      });
      throw this.handleTokenError(error, 'repository_access_token');
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
      this.logger.error('Failed to list project access tokens', {
        workspace,
        projectKey,
        error,
      });
      throw this.handleTokenError(error, 'project_access_token');
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
      this.logger.error('Failed to list workspace access tokens', {
        workspace,
        error,
      });
      throw this.handleTokenError(error, 'workspace_access_token');
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
      this.logger.info('Successfully deleted access token', {
        tokenId: params.token_id,
      });
    } catch (error) {
      this.logger.error('Failed to delete access token', { params, error });
      throw this.handleTokenError(error, 'access_token');
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
      this.logger.info('Successfully updated access token', {
        tokenId: params.token_id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update access token', { params, error });
      throw this.handleTokenError(error, 'access_token');
    }
  }

  // ===== APP PASSWORDS =====

  /**
   * Create App Password
   * POST /2.0/user/app-passwords
   */
  async createAppPassword(request: CreateAppPasswordRequest): Promise<CreateAppPasswordResponse> {
    this.logger.info('Creating app password', { name: request.name });

    this.validateAppPasswordRequest(request);

    try {
      const response = await this.apiClient.post<CreateAppPasswordResponse>(
        '/user/app-passwords',
        request
      );
      this.logger.info('Successfully created app password', {
        name: request.name,
        appPasswordId: response.data.app_password.id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create app password', { request, error });
      throw this.handleTokenError(error, 'app_password');
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
      this.logger.info('Successfully listed app passwords', {
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list app passwords', { error });
      throw this.handleTokenError(error, 'app_password');
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
      throw this.handleTokenError(error, 'app_password');
    }
  }

  // ===== API TOKENS =====

  /**
   * Create API Token
   * POST /2.0/user/api-tokens
   */
  async createApiToken(request: CreateApiTokenRequest): Promise<CreateApiTokenResponse> {
    this.logger.info('Creating API token', { name: request.name });

    this.validateApiTokenRequest(request);

    try {
      const response = await this.apiClient.post<CreateApiTokenResponse>(
        '/user/api-tokens',
        request
      );
      this.logger.info('Successfully created API token', {
        name: request.name,
        apiTokenId: response.data.api_token.id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create API token', { request, error });
      throw this.handleTokenError(error, 'api_token');
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
      this.logger.info('Successfully listed API tokens', {
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list API tokens', { error });
      throw this.handleTokenError(error, 'api_token');
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
      throw this.handleTokenError(error, 'api_token');
    }
  }

  // ===== TOKEN VALIDATION =====

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

  // ===== VALIDATION HELPERS =====

  /**
   * Validate Repository Access Token Request
   */
  private validateRepositoryAccessTokenRequest(request: CreateRepositoryAccessTokenRequest): void {
    if (!request.name || request.name.trim().length === 0) {
      throw new Error('Token name is required');
    }

    if (!request.scopes || request.scopes.length === 0) {
      throw new Error('At least one scope is required');
    }

    this.validateRepositoryScopes(request.scopes);
  }

  /**
   * Validate Project Access Token Request
   */
  private validateProjectAccessTokenRequest(request: CreateProjectAccessTokenRequest): void {
    if (!request.name || request.name.trim().length === 0) {
      throw new Error('Token name is required');
    }

    if (!request.scopes || request.scopes.length === 0) {
      throw new Error('At least one scope is required');
    }

    this.validateProjectScopes(request.scopes);
  }

  /**
   * Validate Workspace Access Token Request
   */
  private validateWorkspaceAccessTokenRequest(request: CreateWorkspaceAccessTokenRequest): void {
    if (!request.name || request.name.trim().length === 0) {
      throw new Error('Token name is required');
    }

    if (!request.scopes || request.scopes.length === 0) {
      throw new Error('At least one scope is required');
    }

    this.validateWorkspaceScopes(request.scopes);
  }

  /**
   * Validate App Password Request
   */
  private validateAppPasswordRequest(request: CreateAppPasswordRequest): void {
    if (!request.name || request.name.trim().length === 0) {
      throw new Error('App password name is required');
    }

    if (!request.scopes || request.scopes.length === 0) {
      throw new Error('At least one scope is required');
    }
  }

  /**
   * Validate API Token Request
   */
  private validateApiTokenRequest(request: CreateApiTokenRequest): void {
    if (!request.name || request.name.trim().length === 0) {
      throw new Error('API token name is required');
    }

    if (!request.scopes || request.scopes.length === 0) {
      throw new Error('At least one scope is required');
    }

    if (!request.expires_at) {
      throw new Error('Expiration date is required for API tokens');
    }

    // Validate expiration date is not more than 1 year from now
    const expirationDate = new Date(request.expires_at);
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    if (expirationDate > oneYearFromNow) {
      throw new Error('API token expiration cannot be more than 1 year from now');
    }
  }

  /**
   * Validate Repository Scopes
   */
  private validateRepositoryScopes(scopes: RepositoryAccessTokenScope[]): void {
    const validScopes: RepositoryAccessTokenScope[] = [
      'repository',
      'repository:write',
      'repository:admin',
      'repository:delete',
      'pullrequest',
      'pullrequest:write',
      'webhook',
      'pipeline',
      'pipeline:write',
      'pipeline:variable',
      'runner',
      'runner:write',
    ];

    for (const scope of scopes) {
      if (!validScopes.includes(scope)) {
        throw new Error(`Invalid repository scope: ${scope}`);
      }
    }
  }

  /**
   * Validate Project Scopes
   */
  private validateProjectScopes(scopes: ProjectAccessTokenScope[]): void {
    const validScopes: ProjectAccessTokenScope[] = [
      'project',
      'repository',
      'repository:write',
      'repository:admin',
      'repository:delete',
      'pullrequest',
      'pullrequest:write',
      'webhook',
      'pipeline',
      'pipeline:write',
      'pipeline:variable',
      'runner',
      'runner:write',
    ];

    for (const scope of scopes) {
      if (!validScopes.includes(scope)) {
        throw new Error(`Invalid project scope: ${scope}`);
      }
    }
  }

  /**
   * Validate Workspace Scopes
   */
  private validateWorkspaceScopes(scopes: WorkspaceAccessTokenScope[]): void {
    const validScopes: WorkspaceAccessTokenScope[] = [
      'project',
      'project:admin',
      'repository',
      'repository:write',
      'repository:admin',
      'repository:delete',
      'pullrequest',
      'pullrequest:write',
      'webhook',
      'account',
      'pipeline',
      'pipeline:write',
      'pipeline:variable',
      'runner',
      'runner:write',
    ];

    for (const scope of scopes) {
      if (!validScopes.includes(scope)) {
        throw new Error(`Invalid workspace scope: ${scope}`);
      }
    }
  }

  /**
   * Handle Token Errors
   */
  private handleTokenError(error: any, tokenType: string): AuthenticationError {
    const authError: AuthenticationError = {
      type: 'authentication_error',
      message: 'An authentication error occurred',
    };

    if (error.response?.status === 401) {
      authError.type = 'authentication_error';
      authError.message = 'Invalid credentials or token';
    } else if (error.response?.status === 403) {
      authError.type = 'authorization_error';
      authError.message = 'Insufficient permissions';
    } else if (error.response?.status === 404) {
      authError.type = 'token_not_found';
      authError.message = 'Token not found';
    } else if (error.response?.data?.error) {
      authError.message = error.response.data.error.message || authError.message;
      authError.details = error.response.data.error.detail;
    }

    this.logger.error('Token operation failed', {
      tokenType,
      error: authError,
    });

    return authError;
  }
}
