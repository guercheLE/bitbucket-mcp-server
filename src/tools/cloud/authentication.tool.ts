/**
 * Cloud Authentication Tools
 * Ferramentas para gerenciamento de autenticação no Bitbucket Cloud
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPool, Pool } from 'generic-pool';
import { AuthenticationService } from '../../services/cloud/authentication.service.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';
import { createMcpResponse, createErrorResponse } from '../../services/types/base.types.js';
import { z } from 'zod';

// Zod schemas for parameter validation
const CreateRepositoryAccessTokenSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  name: z.string(),
  scopes: z.array(z.string()),
  expires_at: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateProjectAccessTokenSchema = z.object({
  workspace: z.string(),
  projectKey: z.string(),
  name: z.string(),
  scopes: z.array(z.string()),
  expires_at: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateWorkspaceAccessTokenSchema = z.object({
  workspace: z.string(),
  name: z.string(),
  scopes: z.array(z.string()),
  expires_at: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListRepositoryAccessTokensSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  page: z.number().optional(),
  pagelen: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListProjectAccessTokensSchema = z.object({
  workspace: z.string(),
  projectKey: z.string(),
  page: z.number().optional(),
  pagelen: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListWorkspaceAccessTokensSchema = z.object({
  workspace: z.string(),
  page: z.number().optional(),
  pagelen: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteAccessTokenSchema = z.object({
  tokenId: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateAccessTokenSchema = z.object({
  tokenId: z.string(),
  name: z.string(),
  scopes: z.array(z.string()),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateAppPasswordSchema = z.object({
  name: z.string(),
  scopes: z.array(z.string()),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListAppPasswordsSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteAppPasswordSchema = z.object({
  appPasswordId: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateApiTokenSchema = z.object({
  name: z.string(),
  scopes: z.array(z.string()),
  expires_at: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListApiTokensSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteApiTokenSchema = z.object({
  apiTokenId: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetOAuthAuthorizationUrlSchema = z.object({
  client_id: z.string(),
  redirect_uri: z.string(),
  scopes: z.array(z.string()),
  response_type: z.enum(['code']).optional(),
  state: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ExchangeCodeForTokenSchema = z.object({
  code: z.string(),
  redirect_uri: z.string(),
  client_id: z.string(),
  client_secret: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const RefreshOAuthTokenSchema = z.object({
  refresh_token: z.string(),
  client_id: z.string(),
  client_secret: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ExchangeJwtForTokenSchema = z.object({
  assertion: z.string(),
  client_id: z.string(),
  client_secret: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const RevokeOAuthTokenSchema = z.object({
  token: z.string(),
  token_type_hint: z.enum(['refresh_token', 'access_token']).optional(),
  client_id: z.string(),
  client_secret: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ValidateTokenSchema = z.object({
  token: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

export class CloudAuthenticationTools {
  private static logger = Logger.forContext('CloudAuthenticationTools');
  private static authenticationServicePool: Pool<AuthenticationService>;

  static initialize(): void {
    const authenticationServiceFactory = {
      create: async () =>
        new AuthenticationService(new ApiClient(), Logger.forContext('AuthenticationService')),
      destroy: async () => {},
    };

    this.authenticationServicePool = createPool(authenticationServiceFactory, {
      min: 2,
      max: 10,
    });
    this.logger.info('Cloud Authentication tools initialized');
  }

  /**
   * Create Repository Access Token
   */
  static async createRepositoryAccessToken(
    workspace: string,
    repoSlug: string,
    request: { name: string; scopes: string[]; expires_at?: string },
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('createRepositoryAccessToken');
    let service: AuthenticationService | null = null;

    try {
      service = await this.authenticationServicePool.acquire();
      methodLogger.debug('Creating repository access token:', {
        workspace,
        repoSlug,
        name: request.name,
      });

      const result = await service.createRepositoryAccessToken(workspace, repoSlug, request as any);

      methodLogger.info('Successfully created repository access token');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create repository access token:', error);
      if (service) {
        this.authenticationServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.authenticationServicePool.release(service);
      }
    }
  }

  /**
   * Create Project Access Token
   */
  static async createProjectAccessToken(
    workspace: string,
    projectKey: string,
    request: { name: string; scopes: string[]; expires_at?: string },
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('createProjectAccessToken');
    let service: AuthenticationService | null = null;

    try {
      service = await this.authenticationServicePool.acquire();
      methodLogger.debug('Creating project access token:', {
        workspace,
        projectKey,
        name: request.name,
      });

      const result = await service.createProjectAccessToken(workspace, projectKey, request as any);

      methodLogger.info('Successfully created project access token');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create project access token:', error);
      if (service) {
        this.authenticationServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.authenticationServicePool.release(service);
      }
    }
  }

  /**
   * Create Workspace Access Token
   */
  static async createWorkspaceAccessToken(
    workspace: string,
    request: { name: string; scopes: string[]; expires_at?: string },
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('createWorkspaceAccessToken');
    let service: AuthenticationService | null = null;

    try {
      service = await this.authenticationServicePool.acquire();
      methodLogger.debug('Creating workspace access token:', {
        workspace,
        name: request.name,
      });

      const result = await service.createWorkspaceAccessToken(workspace, request as any);

      methodLogger.info('Successfully created workspace access token');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create workspace access token:', error);
      if (service) {
        this.authenticationServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.authenticationServicePool.release(service);
      }
    }
  }

  /**
   * List Repository Access Tokens
   */
  static async listRepositoryAccessTokens(
    workspace: string,
    repoSlug: string,
    params?: { page?: number; pagelen?: number },
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('listRepositoryAccessTokens');
    let service: AuthenticationService | null = null;

    try {
      service = await this.authenticationServicePool.acquire();
      methodLogger.debug('Listing repository access tokens:', {
        workspace,
        repoSlug,
        page: params?.page,
        pagelen: params?.pagelen,
      });

      const result = await service.listRepositoryAccessTokens(workspace, repoSlug, params);

      methodLogger.info('Successfully listed repository access tokens');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list repository access tokens:', error);
      if (service) {
        this.authenticationServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.authenticationServicePool.release(service);
      }
    }
  }

  /**
   * List Project Access Tokens
   */
  static async listProjectAccessTokens(
    workspace: string,
    projectKey: string,
    params?: { page?: number; pagelen?: number },
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('listProjectAccessTokens');
    let service: AuthenticationService | null = null;

    try {
      service = await this.authenticationServicePool.acquire();
      methodLogger.debug('Listing project access tokens:', {
        workspace,
        projectKey,
        page: params?.page,
        pagelen: params?.pagelen,
      });

      const result = await service.listProjectAccessTokens(workspace, projectKey, params);

      methodLogger.info('Successfully listed project access tokens');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list project access tokens:', error);
      if (service) {
        this.authenticationServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.authenticationServicePool.release(service);
      }
    }
  }

  /**
   * List Workspace Access Tokens
   */
  static async listWorkspaceAccessTokens(
    workspace: string,
    params?: { page?: number; pagelen?: number },
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('listWorkspaceAccessTokens');
    let service: AuthenticationService | null = null;

    try {
      service = await this.authenticationServicePool.acquire();
      methodLogger.debug('Listing workspace access tokens:', {
        workspace,
        page: params?.page,
        pagelen: params?.pagelen,
      });

      const result = await service.listWorkspaceAccessTokens(workspace, params);

      methodLogger.info('Successfully listed workspace access tokens');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list workspace access tokens:', error);
      if (service) {
        this.authenticationServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.authenticationServicePool.release(service);
      }
    }
  }

  /**
   * Delete Access Token
   */
  static async deleteAccessToken(tokenId: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('deleteAccessToken');
    let service: AuthenticationService | null = null;

    try {
      service = await this.authenticationServicePool.acquire();
      methodLogger.debug('Deleting access token:', { tokenId });

      await service.deleteAccessToken({ token_id: tokenId });

      methodLogger.info('Successfully deleted access token');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to delete access token:', error);
      if (service) {
        this.authenticationServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.authenticationServicePool.release(service);
      }
    }
  }

  /**
   * Update Access Token
   */
  static async updateAccessToken(
    tokenId: string,
    name: string,
    scopes: string[],
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('updateAccessToken');
    let service: AuthenticationService | null = null;

    try {
      service = await this.authenticationServicePool.acquire();
      methodLogger.debug('Updating access token:', { tokenId, name });

      const result = await service.updateAccessToken({
        token_id: tokenId,
        name,
        scopes,
      });

      methodLogger.info('Successfully updated access token');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update access token:', error);
      if (service) {
        this.authenticationServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.authenticationServicePool.release(service);
      }
    }
  }

  /**
   * Create App Password
   */
  static async createAppPassword(
    request: { name: string; scopes: string[] },
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('createAppPassword');
    let service: AuthenticationService | null = null;

    try {
      service = await this.authenticationServicePool.acquire();
      methodLogger.debug('Creating app password:', { name: request.name });

      const result = await service.createAppPassword(request);

      methodLogger.info('Successfully created app password');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create app password:', error);
      if (service) {
        this.authenticationServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.authenticationServicePool.release(service);
      }
    }
  }

  /**
   * List App Passwords
   */
  static async listAppPasswords(output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('listAppPasswords');
    let service: AuthenticationService | null = null;

    try {
      service = await this.authenticationServicePool.acquire();
      methodLogger.debug('Listing app passwords');

      const result = await service.listAppPasswords();

      methodLogger.info('Successfully listed app passwords');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list app passwords:', error);
      if (service) {
        this.authenticationServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.authenticationServicePool.release(service);
      }
    }
  }

  /**
   * Delete App Password
   */
  static async deleteAppPassword(appPasswordId: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('deleteAppPassword');
    let service: AuthenticationService | null = null;

    try {
      service = await this.authenticationServicePool.acquire();
      methodLogger.debug('Deleting app password:', { appPasswordId });

      await service.deleteAppPassword(appPasswordId);

      methodLogger.info('Successfully deleted app password');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to delete app password:', error);
      if (service) {
        this.authenticationServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.authenticationServicePool.release(service);
      }
    }
  }

  /**
   * Create API Token
   */
  static async createApiToken(
    request: { name: string; scopes: string[]; expires_at: string },
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('createApiToken');
    let service: AuthenticationService | null = null;

    try {
      service = await this.authenticationServicePool.acquire();
      methodLogger.debug('Creating API token:', { name: request.name });

      const result = await service.createApiToken(request);

      methodLogger.info('Successfully created API token');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create API token:', error);
      if (service) {
        this.authenticationServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.authenticationServicePool.release(service);
      }
    }
  }

  /**
   * List API Tokens
   */
  static async listApiTokens(output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('listApiTokens');
    let service: AuthenticationService | null = null;

    try {
      service = await this.authenticationServicePool.acquire();
      methodLogger.debug('Listing API tokens');

      const result = await service.listApiTokens();

      methodLogger.info('Successfully listed API tokens');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list API tokens:', error);
      if (service) {
        this.authenticationServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.authenticationServicePool.release(service);
      }
    }
  }

  /**
   * Delete API Token
   */
  static async deleteApiToken(apiTokenId: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('deleteApiToken');
    let service: AuthenticationService | null = null;

    try {
      service = await this.authenticationServicePool.acquire();
      methodLogger.debug('Deleting API token:', { apiTokenId });

      await service.deleteApiToken(apiTokenId);

      methodLogger.info('Successfully deleted API token');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to delete API token:', error);
      if (service) {
        this.authenticationServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.authenticationServicePool.release(service);
      }
    }
  }

  /**
   * Get OAuth Authorization URL
   */
  static async getOAuthAuthorizationUrl(params: {
    client_id: string;
    redirect_uri: string;
    scopes: string[];
    response_type?: 'code';
    state?: string;
  }): Promise<string> {
    const methodLogger = this.logger.forMethod('getOAuthAuthorizationUrl');
    let service: AuthenticationService | null = null;

    try {
      service = await this.authenticationServicePool.acquire();
      methodLogger.debug('Getting OAuth authorization URL:', {
        client_id: params.client_id,
        redirect_uri: params.redirect_uri,
      });

      const result = service.getOAuthAuthorizationUrl(params);

      methodLogger.info('Successfully generated OAuth authorization URL');
      return result;
    } catch (error) {
      methodLogger.error('Failed to get OAuth authorization URL:', error);
      throw error;
    }
  }

  /**
   * Exchange Code for Token
   */
  static async exchangeCodeForToken(
    params: {
      grant_type: 'authorization_code';
      code: string;
      redirect_uri: string;
      client_id: string;
      client_secret: string;
    },
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('exchangeCodeForToken');
    let service: AuthenticationService | null = null;

    try {
      service = await this.authenticationServicePool.acquire();
      methodLogger.debug('Exchanging code for token');

      const result = await service.exchangeCodeForToken(params);

      methodLogger.info('Successfully exchanged code for token');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to exchange code for token:', error);
      if (service) {
        this.authenticationServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.authenticationServicePool.release(service);
      }
    }
  }

  /**
   * Refresh OAuth Token
   */
  static async refreshOAuthToken(
    params: {
      grant_type: 'refresh_token';
      refresh_token: string;
      client_id: string;
      client_secret: string;
    },
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('refreshOAuthToken');
    let service: AuthenticationService | null = null;

    try {
      service = await this.authenticationServicePool.acquire();
      methodLogger.debug('Refreshing OAuth token');

      const result = await service.refreshOAuthToken(params);

      methodLogger.info('Successfully refreshed OAuth token');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to refresh OAuth token:', error);
      if (service) {
        this.authenticationServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.authenticationServicePool.release(service);
      }
    }
  }

  /**
   * Exchange JWT for Token
   */
  static async exchangeJwtForToken(
    params: {
      grant_type: 'urn:bitbucket:oauth2:jwt';
      assertion: string;
      client_id: string;
      client_secret: string;
    },
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('exchangeJwtForToken');
    let service: AuthenticationService | null = null;

    try {
      service = await this.authenticationServicePool.acquire();
      methodLogger.debug('Exchanging JWT for token');

      const result = await service.exchangeJwtForToken(params);

      methodLogger.info('Successfully exchanged JWT for token');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to exchange JWT for token:', error);
      if (service) {
        this.authenticationServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.authenticationServicePool.release(service);
      }
    }
  }

  /**
   * Revoke OAuth Token
   */
  static async revokeOAuthToken(
    params: {
      token: string;
      token_type_hint?: 'refresh_token' | 'access_token';
      client_id: string;
      client_secret: string;
    },
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('revokeOAuthToken');
    let service: AuthenticationService | null = null;

    try {
      service = await this.authenticationServicePool.acquire();
      methodLogger.debug('Revoking OAuth token');

      await service.revokeOAuthToken(params);

      methodLogger.info('Successfully revoked OAuth token');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to revoke OAuth token:', error);
      if (service) {
        this.authenticationServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.authenticationServicePool.release(service);
      }
    }
  }

  /**
   * Validate Token
   */
  static async validateToken(token: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('validateToken');
    let service: AuthenticationService | null = null;

    try {
      service = await this.authenticationServicePool.acquire();
      methodLogger.debug('Validating token');

      const result = await service.validateToken(token);

      methodLogger.info('Successfully validated token');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to validate token:', error);
      if (service) {
        this.authenticationServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.authenticationServicePool.release(service);
      }
    }
  }

  /**
   * Register all authentication tools with the MCP server
   */
  static register(server: McpServer): void {
    const registerLogger = this.logger.forMethod('register');

    // Initialize the service
    this.initialize();

    // Create Repository Access Token
    server.registerTool(
      'auth_create_repository_access_token',
      {
        description: `Cria um token de acesso para um repositório específico no Bitbucket Cloud.

**Funcionalidades:**
- Criação de token de acesso para repositório
- Configuração de escopos específicos
- Gerenciamento de permissões granulares

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`repoSlug\`: Slug do repositório
- \`name\`: Nome do token de acesso
- \`scopes\`: Array de escopos do token de acesso
- \`expires_at\`: Data de expiração (opcional, formato ISO 8601)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do token criado.`,
        inputSchema: CreateRepositoryAccessTokenSchema.shape,
      },
      async (params: z.infer<typeof CreateRepositoryAccessTokenSchema>) => {
        const validatedParams = CreateRepositoryAccessTokenSchema.parse(params);
        return this.createRepositoryAccessToken(
          validatedParams.workspace,
          validatedParams.repoSlug,
          {
            name: validatedParams.name,
            scopes: validatedParams.scopes,
            expires_at: validatedParams.expires_at,
          },
          validatedParams.output
        );
      }
    );

    // Create Project Access Token
    server.registerTool(
      'auth_create_project_access_token',
      {
        description: `Cria um token de acesso para um projeto específico no Bitbucket Cloud.

**Funcionalidades:**
- Criação de token de acesso para projeto
- Configuração de escopos específicos
- Gerenciamento de permissões granulares

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`projectKey\`: Chave do projeto
- \`name\`: Nome do token de acesso
- \`scopes\`: Array de escopos do token de acesso
- \`expires_at\`: Data de expiração (opcional, formato ISO 8601)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do token criado.`,
        inputSchema: CreateProjectAccessTokenSchema.shape,
      },
      async (params: z.infer<typeof CreateProjectAccessTokenSchema>) => {
        const validatedParams = CreateProjectAccessTokenSchema.parse(params);
        return this.createProjectAccessToken(
          validatedParams.workspace,
          validatedParams.projectKey,
          {
            name: validatedParams.name,
            scopes: validatedParams.scopes,
            expires_at: validatedParams.expires_at,
          },
          validatedParams.output
        );
      }
    );

    // Create Workspace Access Token
    server.registerTool(
      'auth_create_workspace_access_token',
      {
        description: `Cria um token de acesso para um workspace específico no Bitbucket Cloud.

**Funcionalidades:**
- Criação de token de acesso para workspace
- Configuração de escopos específicos
- Gerenciamento de permissões granulares

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`name\`: Nome do token de acesso
- \`scopes\`: Array de escopos do token de acesso
- \`expires_at\`: Data de expiração (opcional, formato ISO 8601)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do token criado.`,
        inputSchema: CreateWorkspaceAccessTokenSchema.shape,
      },
      async (params: z.infer<typeof CreateWorkspaceAccessTokenSchema>) => {
        const validatedParams = CreateWorkspaceAccessTokenSchema.parse(params);
        return this.createWorkspaceAccessToken(
          validatedParams.workspace,
          {
            name: validatedParams.name,
            scopes: validatedParams.scopes,
            expires_at: validatedParams.expires_at,
          },
          validatedParams.output
        );
      }
    );

    // List Repository Access Tokens
    server.registerTool(
      'auth_list_repository_access_tokens',
      {
        description: `Lista os tokens de acesso de um repositório específico no Bitbucket Cloud.

**Funcionalidades:**
- Listagem de tokens de acesso do repositório
- Suporte a paginação
- Informações detalhadas dos tokens

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`repoSlug\`: Slug do repositório
- \`page\`: Número da página para paginação (opcional)
- \`pagelen\`: Número de itens por página (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Lista de tokens de acesso do repositório.`,
        inputSchema: ListRepositoryAccessTokensSchema.shape,
      },
      async (params: z.infer<typeof ListRepositoryAccessTokensSchema>) => {
        const validatedParams = ListRepositoryAccessTokensSchema.parse(params);
        return this.listRepositoryAccessTokens(
          validatedParams.workspace,
          validatedParams.repoSlug,
          { page: validatedParams.page, pagelen: validatedParams.pagelen },
          validatedParams.output
        );
      }
    );

    // List Project Access Tokens
    server.registerTool(
      'auth_list_project_access_tokens',
      {
        description: `Lista os tokens de acesso de um projeto específico no Bitbucket Cloud.

**Funcionalidades:**
- Listagem de tokens de acesso do projeto
- Suporte a paginação
- Informações detalhadas dos tokens

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`projectKey\`: Chave do projeto
- \`page\`: Número da página para paginação (opcional)
- \`pagelen\`: Número de itens por página (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Lista de tokens de acesso do projeto.`,
        inputSchema: ListProjectAccessTokensSchema.shape,
      },
      async (params: z.infer<typeof ListProjectAccessTokensSchema>) => {
        const validatedParams = ListProjectAccessTokensSchema.parse(params);
        return this.listProjectAccessTokens(
          validatedParams.workspace,
          validatedParams.projectKey,
          { page: validatedParams.page, pagelen: validatedParams.pagelen },
          validatedParams.output
        );
      }
    );

    // List Workspace Access Tokens
    server.registerTool(
      'auth_list_workspace_access_tokens',
      {
        description: `Lista os tokens de acesso de um workspace específico no Bitbucket Cloud.

**Funcionalidades:**
- Listagem de tokens de acesso do workspace
- Suporte a paginação
- Informações detalhadas dos tokens

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`page\`: Número da página para paginação (opcional)
- \`pagelen\`: Número de itens por página (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Lista de tokens de acesso do workspace.`,
        inputSchema: ListWorkspaceAccessTokensSchema.shape,
      },
      async (params: z.infer<typeof ListWorkspaceAccessTokensSchema>) => {
        const validatedParams = ListWorkspaceAccessTokensSchema.parse(params);
        return this.listWorkspaceAccessTokens(
          validatedParams.workspace,
          { page: validatedParams.page, pagelen: validatedParams.pagelen },
          validatedParams.output
        );
      }
    );

    // Delete Access Token
    server.registerTool(
      'auth_delete_access_token',
      {
        description: `Exclui um token de acesso no Bitbucket Cloud.

**Funcionalidades:**
- Exclusão de token de acesso
- Suporte a todos os tipos de tokens

**Parâmetros:**
- \`tokenId\`: ID do token de acesso
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Confirmação de exclusão do token.`,
        inputSchema: DeleteAccessTokenSchema.shape,
      },
      async (params: z.infer<typeof DeleteAccessTokenSchema>) => {
        const validatedParams = DeleteAccessTokenSchema.parse(params);
        return this.deleteAccessToken(validatedParams.tokenId, validatedParams.output);
      }
    );

    // Update Access Token
    server.registerTool(
      'auth_update_access_token',
      {
        description: `Atualiza um token de acesso no Bitbucket Cloud.

**Funcionalidades:**
- Atualização de nome e escopos do token
- Modificação de permissões

**Parâmetros:**
- \`tokenId\`: ID do token de acesso
- \`name\`: Novo nome do token de acesso
- \`scopes\`: Novos escopos do token de acesso
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Token de acesso atualizado.`,
        inputSchema: UpdateAccessTokenSchema.shape,
      },
      async (params: z.infer<typeof UpdateAccessTokenSchema>) => {
        const validatedParams = UpdateAccessTokenSchema.parse(params);
        return this.updateAccessToken(
          validatedParams.tokenId,
          validatedParams.name,
          validatedParams.scopes,
          validatedParams.output
        );
      }
    );

    // Create App Password
    server.registerTool(
      'auth_create_app_password',
      {
        description: `Cria uma senha de aplicativo no Bitbucket Cloud.

**Funcionalidades:**
- Criação de senha de aplicativo
- Configuração de escopos específicos
- Autenticação para aplicações

**Parâmetros:**
- \`name\`: Nome da senha de aplicativo
- \`scopes\`: Array de escopos da senha de aplicativo
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Senha de aplicativo criada.`,
        inputSchema: CreateAppPasswordSchema.shape,
      },
      async (params: z.infer<typeof CreateAppPasswordSchema>) => {
        const validatedParams = CreateAppPasswordSchema.parse(params);
        return this.createAppPassword(
          { name: validatedParams.name, scopes: validatedParams.scopes },
          validatedParams.output
        );
      }
    );

    // List App Passwords
    server.registerTool(
      'auth_list_app_passwords',
      {
        description: `Lista as senhas de aplicativo no Bitbucket Cloud.

**Funcionalidades:**
- Listagem de senhas de aplicativo
- Informações detalhadas das senhas

**Parâmetros:**
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Lista de senhas de aplicativo.`,
        inputSchema: ListAppPasswordsSchema.shape,
      },
      async (params: z.infer<typeof ListAppPasswordsSchema>) => {
        const validatedParams = ListAppPasswordsSchema.parse(params);
        return this.listAppPasswords(validatedParams.output);
      }
    );

    // Delete App Password
    server.registerTool(
      'auth_delete_app_password',
      {
        description: `Exclui uma senha de aplicativo no Bitbucket Cloud.

**Funcionalidades:**
- Exclusão de senha de aplicativo
- Revogação de acesso

**Parâmetros:**
- \`appPasswordId\`: ID da senha de aplicativo
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Confirmação de exclusão da senha de aplicativo.`,
        inputSchema: DeleteAppPasswordSchema.shape,
      },
      async (params: z.infer<typeof DeleteAppPasswordSchema>) => {
        const validatedParams = DeleteAppPasswordSchema.parse(params);
        return this.deleteAppPassword(validatedParams.appPasswordId, validatedParams.output);
      }
    );

    // Create API Token
    server.registerTool(
      'auth_create_api_token',
      {
        description: `Cria um token de API no Bitbucket Cloud.

**Funcionalidades:**
- Criação de token de API
- Configuração de escopos específicos
- Data de expiração obrigatória

**Parâmetros:**
- \`name\`: Nome do token de API
- \`scopes\`: Array de escopos do token de API
- \`expires_at\`: Data de expiração (obrigatório, formato ISO 8601, máximo 1 ano)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Token de API criado.`,
        inputSchema: CreateApiTokenSchema.shape,
      },
      async (params: z.infer<typeof CreateApiTokenSchema>) => {
        const validatedParams = CreateApiTokenSchema.parse(params);
        return this.createApiToken(
          {
            name: validatedParams.name,
            scopes: validatedParams.scopes,
            expires_at: validatedParams.expires_at,
          },
          validatedParams.output
        );
      }
    );

    // List API Tokens
    server.registerTool(
      'auth_list_api_tokens',
      {
        description: `Lista os tokens de API no Bitbucket Cloud.

**Funcionalidades:**
- Listagem de tokens de API
- Informações detalhadas dos tokens

**Parâmetros:**
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Lista de tokens de API.`,
        inputSchema: ListApiTokensSchema.shape,
      },
      async (params: z.infer<typeof ListApiTokensSchema>) => {
        const validatedParams = ListApiTokensSchema.parse(params);
        return this.listApiTokens(validatedParams.output);
      }
    );

    // Delete API Token
    server.registerTool(
      'auth_delete_api_token',
      {
        description: `Exclui um token de API no Bitbucket Cloud.

**Funcionalidades:**
- Exclusão de token de API
- Revogação de acesso

**Parâmetros:**
- \`apiTokenId\`: ID do token de API
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Confirmação de exclusão do token de API.`,
        inputSchema: DeleteApiTokenSchema.shape,
      },
      async (params: z.infer<typeof DeleteApiTokenSchema>) => {
        const validatedParams = DeleteApiTokenSchema.parse(params);
        return this.deleteApiToken(validatedParams.apiTokenId, validatedParams.output);
      }
    );

    // Get OAuth Authorization URL
    server.registerTool(
      'auth_get_oauth_authorization_url',
      {
        description: `Gera a URL de autorização OAuth para o Bitbucket Cloud.

**Funcionalidades:**
- Geração de URL de autorização OAuth
- Configuração de escopos e parâmetros
- Suporte a estado de segurança

**Parâmetros:**
- \`client_id\`: ID do cliente OAuth
- \`redirect_uri\`: URI de redirecionamento
- \`scopes\`: Array de escopos OAuth
- \`response_type\`: Tipo de resposta (padrão: 'code')
- \`state\`: Estado para segurança (opcional)

**Retorna:** URL de autorização OAuth.`,
        inputSchema: GetOAuthAuthorizationUrlSchema.shape,
      },
      async (params: z.infer<typeof GetOAuthAuthorizationUrlSchema>) => {
        const validatedParams = GetOAuthAuthorizationUrlSchema.parse(params);
        const url = await this.getOAuthAuthorizationUrl({
          client_id: validatedParams.client_id,
          redirect_uri: validatedParams.redirect_uri,
          scopes: validatedParams.scopes,
          response_type: validatedParams.response_type || 'code',
          state: validatedParams.state,
        });
        return createMcpResponse({ url }, validatedParams.output);
      }
    );

    // Exchange Code for Token
    server.registerTool(
      'auth_exchange_code_for_token',
      {
        description: `Troca um código de autorização por um token de acesso OAuth no Bitbucket Cloud.

**Funcionalidades:**
- Troca de código de autorização por token
- Obtenção de tokens de acesso e refresh
- Configuração OAuth completa

**Parâmetros:**
- \`code\`: Código de autorização
- \`redirect_uri\`: URI de redirecionamento
- \`client_id\`: ID do cliente OAuth
- \`client_secret\`: Segredo do cliente OAuth
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Tokens OAuth (access_token e refresh_token).`,
        inputSchema: ExchangeCodeForTokenSchema.shape,
      },
      async (params: z.infer<typeof ExchangeCodeForTokenSchema>) => {
        const validatedParams = ExchangeCodeForTokenSchema.parse(params);
        return this.exchangeCodeForToken(
          {
            grant_type: 'authorization_code',
            code: validatedParams.code,
            redirect_uri: validatedParams.redirect_uri,
            client_id: validatedParams.client_id,
            client_secret: validatedParams.client_secret,
          },
          validatedParams.output
        );
      }
    );

    // Refresh OAuth Token
    server.registerTool(
      'auth_refresh_oauth_token',
      {
        description: `Atualiza um token de acesso OAuth no Bitbucket Cloud.

**Funcionalidades:**
- Atualização de token OAuth usando refresh token
- Renovação de tokens expirados
- Manutenção de sessão OAuth

**Parâmetros:**
- \`refresh_token\`: Token de atualização
- \`client_id\`: ID do cliente OAuth
- \`client_secret\`: Segredo do cliente OAuth
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Novos tokens OAuth.`,
        inputSchema: RefreshOAuthTokenSchema.shape,
      },
      async (params: z.infer<typeof RefreshOAuthTokenSchema>) => {
        const validatedParams = RefreshOAuthTokenSchema.parse(params);
        return this.refreshOAuthToken(
          {
            grant_type: 'refresh_token',
            refresh_token: validatedParams.refresh_token,
            client_id: validatedParams.client_id,
            client_secret: validatedParams.client_secret,
          },
          validatedParams.output
        );
      }
    );

    // Exchange JWT for Token
    server.registerTool(
      'auth_exchange_jwt_for_token',
      {
        description: `Troca um JWT por um token de acesso OAuth no Bitbucket Cloud.

**Funcionalidades:**
- Troca de JWT por token OAuth
- Autenticação baseada em JWT
- Fluxo OAuth específico do Bitbucket

**Parâmetros:**
- \`assertion\`: JWT assertion
- \`client_id\`: ID do cliente OAuth
- \`client_secret\`: Segredo do cliente OAuth
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Token OAuth obtido do JWT.`,
        inputSchema: ExchangeJwtForTokenSchema.shape,
      },
      async (params: z.infer<typeof ExchangeJwtForTokenSchema>) => {
        const validatedParams = ExchangeJwtForTokenSchema.parse(params);
        return this.exchangeJwtForToken(
          {
            grant_type: 'urn:bitbucket:oauth2:jwt',
            assertion: validatedParams.assertion,
            client_id: validatedParams.client_id,
            client_secret: validatedParams.client_secret,
          },
          validatedParams.output
        );
      }
    );

    // Revoke OAuth Token
    server.registerTool(
      'auth_revoke_oauth_token',
      {
        description: `Revoga um token de acesso OAuth no Bitbucket Cloud.

**Funcionalidades:**
- Revogação de token OAuth
- Invalidação de acesso
- Limpeza de sessões

**Parâmetros:**
- \`token\`: Token a ser revogado
- \`token_type_hint\`: Tipo do token ('access_token' ou 'refresh_token')
- \`client_id\`: ID do cliente OAuth
- \`client_secret\`: Segredo do cliente OAuth
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Confirmação de revogação do token.`,
        inputSchema: RevokeOAuthTokenSchema.shape,
      },
      async (params: z.infer<typeof RevokeOAuthTokenSchema>) => {
        const validatedParams = RevokeOAuthTokenSchema.parse(params);
        return this.revokeOAuthToken(
          {
            token: validatedParams.token,
            token_type_hint: validatedParams.token_type_hint,
            client_id: validatedParams.client_id,
            client_secret: validatedParams.client_secret,
          },
          validatedParams.output
        );
      }
    );

    // Validate Token
    server.registerTool(
      'auth_validate_token',
      {
        description: `Valida um token de acesso no Bitbucket Cloud.

**Funcionalidades:**
- Validação de token de acesso
- Verificação de escopos
- Confirmação de autenticação

**Parâmetros:**
- \`token\`: Token a ser validado
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Resultado da validação do token.`,
        inputSchema: ValidateTokenSchema.shape,
      },
      async (params: z.infer<typeof ValidateTokenSchema>) => {
        const validatedParams = ValidateTokenSchema.parse(params);
        return this.validateToken(validatedParams.token, validatedParams.output);
      }
    );

    registerLogger.info('Successfully registered all cloud authentication tools');
  }
}
