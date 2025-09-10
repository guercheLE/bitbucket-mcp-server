import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPool, Pool } from 'generic-pool';
import { z } from 'zod';
import { Logger } from '../../utils/logger.util.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { AuthenticationService } from '../../services/datacenter/authentication.service.js';
import { createMcpResponse, createErrorResponse } from '../../services/types/base.types.js';

/**
 * Authentication Tools for Bitbucket Data Center
 *
 * Comprehensive authentication management including:
 * - OAuth token management
 * - OAuth application management
 * - Session management
 * - Access token operations
 */
// Zod schemas for parameter validation
const GetOAuthTokenSchema = z.object({
  grantType: z.string(),
  code: z.string().optional(),
  redirectUri: z.string().optional(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  refreshToken: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const RefreshOAuthTokenSchema = z.object({
  refreshToken: z.string(),
  clientId: z.string(),
  clientSecret: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetOAuthAuthorizationUrlSchema = z.object({
  responseType: z.string(),
  clientId: z.string(),
  redirectUri: z.string(),
  scope: z.string(),
  state: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const AccessTokenInfoSchema = z.object({
  accessToken: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const RevokeAccessTokenSchema = z.object({
  accessToken: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateOAuthApplicationSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  url: z.string().optional(),
  callbackUrl: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetOAuthApplicationSchema = z.object({
  applicationId: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateOAuthApplicationSchema = z.object({
  applicationId: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  url: z.string().optional(),
  callbackUrl: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteOAuthApplicationSchema = z.object({
  applicationId: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListOAuthApplicationsSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetCurrentSessionSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateSessionSchema = z.object({
  userId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const RefreshSessionSchema = z.object({
  sessionId: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const RevokeSessionSchema = z.object({
  sessionId: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListActiveSessionsSchema = z.object({
  userId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

export class DataCenterAuthenticationTools {
  private static logger = Logger.forContext('DataCenterAuthenticationTools');
  private static authenticationServicePool: Pool<AuthenticationService>;

  static initialize(): void {
    const authenticationServiceFactory = {
      create: async () => new AuthenticationService(new ApiClient(), new Logger()),
      destroy: async () => {},
    };

    this.authenticationServicePool = createPool(authenticationServiceFactory, { min: 2, max: 10 });
    this.logger.info('Data Center Authentication tools initialized');
  }

  /**
   * Get OAuth token
   */
  static async getOAuthToken(
    grantType: string,
    code?: string,
    redirectUri?: string,
    clientId?: string,
    clientSecret?: string,
    refreshToken?: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getOAuthToken');
    let authenticationService = null;

    try {
      methodLogger.debug('Getting OAuth token:', { grantType });
      authenticationService = await this.authenticationServicePool.acquire();

      const request = {
        grant_type: grantType as 'authorization_code' | 'refresh_token' | 'client_credentials',
        ...(code && { code }),
        ...(redirectUri && { redirect_uri: redirectUri }),
        client_id: clientId || '',
        client_secret: clientSecret || '',
        ...(refreshToken && { refresh_token: refreshToken }),
      };

      const result = await authenticationService.getOAuthToken(request);
      methodLogger.debug('Successfully retrieved OAuth token');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get OAuth token:', error);
      if (authenticationService) {
        this.authenticationServicePool.destroy(authenticationService);
        authenticationService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (authenticationService) {
        this.authenticationServicePool.release(authenticationService);
      }
    }
  }

  /**
   * Refresh OAuth token
   */
  static async refreshOAuthToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('refreshOAuthToken');
    let authenticationService = null;

    try {
      methodLogger.debug('Refreshing OAuth token');
      authenticationService = await this.authenticationServicePool.acquire();

      const result = await authenticationService.refreshOAuthToken(
        refreshToken,
        clientId,
        clientSecret
      );
      methodLogger.debug('Successfully refreshed OAuth token');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to refresh OAuth token:', error);
      if (authenticationService) {
        this.authenticationServicePool.destroy(authenticationService);
        authenticationService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (authenticationService) {
        this.authenticationServicePool.release(authenticationService);
      }
    }
  }

  /**
   * Get OAuth authorization URL
   */
  static async getOAuthAuthorizationUrl(
    responseType: string,
    clientId: string,
    redirectUri: string,
    scope: string,
    state?: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getOAuthAuthorizationUrl');
    let authenticationService = null;

    try {
      methodLogger.debug('Getting OAuth authorization URL:', { clientId });
      authenticationService = await this.authenticationServicePool.acquire();

      const request = {
        response_type: responseType as 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope,
        ...(state && { state }),
      };

      const result = authenticationService.getOAuthAuthorizationUrl(request);
      methodLogger.debug('Successfully generated OAuth authorization URL');
      return createMcpResponse({ url: result }, output);
    } catch (error) {
      methodLogger.error('Failed to get OAuth authorization URL:', error);
      if (authenticationService) {
        this.authenticationServicePool.destroy(authenticationService);
        authenticationService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (authenticationService) {
        this.authenticationServicePool.release(authenticationService);
      }
    }
  }

  /**
   * Get access token information
   */
  static async getAccessTokenInfo(accessToken: string, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getAccessTokenInfo');
    let authenticationService = null;

    try {
      methodLogger.debug('Getting access token information');
      authenticationService = await this.authenticationServicePool.acquire();

      const result = await authenticationService.getAccessTokenInfo(accessToken);
      methodLogger.debug('Successfully retrieved access token information');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get access token information:', error);
      if (authenticationService) {
        this.authenticationServicePool.destroy(authenticationService);
        authenticationService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (authenticationService) {
        this.authenticationServicePool.release(authenticationService);
      }
    }
  }

  /**
   * Revoke access token
   */
  static async revokeAccessToken(accessToken: string, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('revokeAccessToken');
    let authenticationService = null;

    try {
      methodLogger.debug('Revoking access token');
      authenticationService = await this.authenticationServicePool.acquire();

      await authenticationService.revokeAccessToken(accessToken);
      methodLogger.debug('Successfully revoked access token');
      return createMcpResponse(
        { success: true, message: 'Access token revoked successfully' },
        output
      );
    } catch (error) {
      methodLogger.error('Failed to revoke access token:', error);
      if (authenticationService) {
        this.authenticationServicePool.destroy(authenticationService);
        authenticationService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (authenticationService) {
        this.authenticationServicePool.release(authenticationService);
      }
    }
  }

  /**
   * Create OAuth application
   */
  static async createOAuthApplication(
    name: string,
    description?: string,
    url?: string,
    callbackUrl?: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('createOAuthApplication');
    let authenticationService = null;

    try {
      methodLogger.debug('Creating OAuth application:', { name });
      authenticationService = await this.authenticationServicePool.acquire();

      const request = {
        name,
        ...(description && { description }),
        redirect_uris: callbackUrl ? [callbackUrl] : [],
        scopes: ['read', 'write'],
      };

      const result = await authenticationService.createOAuthApplication(request);
      methodLogger.debug('Successfully created OAuth application');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create OAuth application:', error);
      if (authenticationService) {
        this.authenticationServicePool.destroy(authenticationService);
        authenticationService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (authenticationService) {
        this.authenticationServicePool.release(authenticationService);
      }
    }
  }

  /**
   * Get OAuth application
   */
  static async getOAuthApplication(applicationId: string, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getOAuthApplication');
    let authenticationService = null;

    try {
      methodLogger.debug('Getting OAuth application:', { applicationId });
      authenticationService = await this.authenticationServicePool.acquire();

      const result = await authenticationService.getOAuthApplication(applicationId);
      methodLogger.debug('Successfully retrieved OAuth application');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get OAuth application:', error);
      if (authenticationService) {
        this.authenticationServicePool.destroy(authenticationService);
        authenticationService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (authenticationService) {
        this.authenticationServicePool.release(authenticationService);
      }
    }
  }

  /**
   * Update OAuth application
   */
  static async updateOAuthApplication(
    applicationId: string,
    name?: string,
    description?: string,
    url?: string,
    callbackUrl?: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('updateOAuthApplication');
    let authenticationService = null;

    try {
      methodLogger.debug('Updating OAuth application:', { applicationId });
      authenticationService = await this.authenticationServicePool.acquire();

      const request = {
        name: name || 'Updated OAuth Application',
        ...(description && { description }),
        redirect_uris: callbackUrl ? [callbackUrl] : [],
        scopes: ['read', 'write'],
      };

      const result = await authenticationService.updateOAuthApplication(applicationId, request);
      methodLogger.debug('Successfully updated OAuth application');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update OAuth application:', error);
      if (authenticationService) {
        this.authenticationServicePool.destroy(authenticationService);
        authenticationService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (authenticationService) {
        this.authenticationServicePool.release(authenticationService);
      }
    }
  }

  /**
   * Delete OAuth application
   */
  static async deleteOAuthApplication(applicationId: string, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('deleteOAuthApplication');
    let authenticationService = null;

    try {
      methodLogger.debug('Deleting OAuth application:', { applicationId });
      authenticationService = await this.authenticationServicePool.acquire();

      await authenticationService.deleteOAuthApplication(applicationId);
      methodLogger.debug('Successfully deleted OAuth application');
      return createMcpResponse(
        { success: true, message: 'OAuth application deleted successfully' },
        output
      );
    } catch (error) {
      methodLogger.error('Failed to delete OAuth application:', error);
      if (authenticationService) {
        this.authenticationServicePool.destroy(authenticationService);
        authenticationService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (authenticationService) {
        this.authenticationServicePool.release(authenticationService);
      }
    }
  }

  /**
   * List OAuth applications
   */
  static async listOAuthApplications(output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('listOAuthApplications');
    let authenticationService = null;

    try {
      methodLogger.debug('Listing OAuth applications');
      authenticationService = await this.authenticationServicePool.acquire();

      const result = await authenticationService.listOAuthApplications();
      methodLogger.debug('Successfully listed OAuth applications');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list OAuth applications:', error);
      if (authenticationService) {
        this.authenticationServicePool.destroy(authenticationService);
        authenticationService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (authenticationService) {
        this.authenticationServicePool.release(authenticationService);
      }
    }
  }

  /**
   * Get current user session
   */
  static async getCurrentSession(output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getCurrentSession');
    let authenticationService = null;

    try {
      methodLogger.debug('Getting current user session');
      authenticationService = await this.authenticationServicePool.acquire();

      const result = await authenticationService.getCurrentSession();
      methodLogger.debug('Successfully retrieved current user session');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get current user session:', error);
      if (authenticationService) {
        this.authenticationServicePool.destroy(authenticationService);
        authenticationService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (authenticationService) {
        this.authenticationServicePool.release(authenticationService);
      }
    }
  }

  /**
   * Create user session
   */
  static async createSession(userId: number, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('createSession');
    let authenticationService = null;

    try {
      methodLogger.debug('Creating user session:', { userId });
      authenticationService = await this.authenticationServicePool.acquire();

      const result = await authenticationService.createSession(userId);
      methodLogger.debug('Successfully created user session');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create user session:', error);
      if (authenticationService) {
        this.authenticationServicePool.destroy(authenticationService);
        authenticationService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (authenticationService) {
        this.authenticationServicePool.release(authenticationService);
      }
    }
  }

  /**
   * Refresh user session
   */
  static async refreshSession(sessionId: string, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('refreshSession');
    let authenticationService = null;

    try {
      methodLogger.debug('Refreshing user session:', { sessionId });
      authenticationService = await this.authenticationServicePool.acquire();

      const result = await authenticationService.refreshSession(sessionId);
      methodLogger.debug('Successfully refreshed user session');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to refresh user session:', error);
      if (authenticationService) {
        this.authenticationServicePool.destroy(authenticationService);
        authenticationService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (authenticationService) {
        this.authenticationServicePool.release(authenticationService);
      }
    }
  }

  /**
   * Revoke user session
   */
  static async revokeSession(sessionId: string, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('revokeSession');
    let authenticationService = null;

    try {
      methodLogger.debug('Revoking user session:', { sessionId });
      authenticationService = await this.authenticationServicePool.acquire();

      await authenticationService.revokeSession(sessionId);
      methodLogger.debug('Successfully revoked user session');
      return createMcpResponse(
        { success: true, message: 'User session revoked successfully' },
        output
      );
    } catch (error) {
      methodLogger.error('Failed to revoke user session:', error);
      if (authenticationService) {
        this.authenticationServicePool.destroy(authenticationService);
        authenticationService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (authenticationService) {
        this.authenticationServicePool.release(authenticationService);
      }
    }
  }

  /**
   * List active sessions for user
   */
  static async listActiveSessions(userId: number, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('listActiveSessions');
    let authenticationService = null;

    try {
      methodLogger.debug('Listing active sessions for user:', { userId });
      authenticationService = await this.authenticationServicePool.acquire();

      const result = await authenticationService.listActiveSessions(userId);
      methodLogger.debug('Successfully listed active sessions for user');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list active sessions for user:', error);
      if (authenticationService) {
        this.authenticationServicePool.destroy(authenticationService);
        authenticationService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (authenticationService) {
        this.authenticationServicePool.release(authenticationService);
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

    // Register OAuth token tools
    server.registerTool(
      'auth_get_oauth_token',
      {
        description: `Obtém um token OAuth no Bitbucket Data Center.

**Funcionalidades:**
- Obter token de autorização
- Obter token de refresh
- Configuração completa de OAuth

**Parâmetros:**
- \`grantType\`: Tipo de concessão ('authorization_code' ou 'refresh_token')
- \`code\`: Código de autorização (opcional)
- \`redirectUri\`: URI de redirecionamento (opcional)
- \`clientId\`: ID do cliente (opcional)
- \`clientSecret\`: Segredo do cliente (opcional)
- \`refreshToken\`: Token de refresh (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Token OAuth com informações de acesso.`,
        inputSchema: GetOAuthTokenSchema.shape,
      },
      async (params: z.infer<typeof GetOAuthTokenSchema>) => {
        const validatedParams = GetOAuthTokenSchema.parse(params);
        return this.getOAuthToken(
          validatedParams.grantType,
          validatedParams.code,
          validatedParams.redirectUri,
          validatedParams.clientId,
          validatedParams.clientSecret,
          validatedParams.refreshToken,
          validatedParams.output
        );
      }
    );

    server.registerTool(
      'auth_refresh_oauth_token',
      {
        description: `Atualiza um token OAuth no Bitbucket Data Center.

**Funcionalidades:**
- Renovar token de acesso
- Manter sessão ativa
- Gerenciamento automático de tokens

**Parâmetros:**
- \`refreshToken\`: Token de refresh atual
- \`clientId\`: ID do cliente OAuth
- \`clientSecret\`: Segredo do cliente OAuth
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Novo token OAuth com informações atualizadas.`,
        inputSchema: RefreshOAuthTokenSchema.shape,
      },
      async (params: z.infer<typeof RefreshOAuthTokenSchema>) => {
        const validatedParams = RefreshOAuthTokenSchema.parse(params);
        return this.refreshOAuthToken(
          validatedParams.refreshToken,
          validatedParams.clientId,
          validatedParams.clientSecret,
          validatedParams.output
        );
      }
    );

    server.registerTool(
      'auth_get_oauth_authorization_url',
      {
        description: `Gera URL de autorização OAuth no Bitbucket Data Center.

**Funcionalidades:**
- URL de autorização completa
- Parâmetros de segurança
- Configuração de escopo

**Parâmetros:**
- \`responseType\`: Tipo de resposta ('code')
- \`clientId\`: ID do cliente OAuth
- \`redirectUri\`: URI de redirecionamento
- \`scope\`: Escopo de permissões
- \`state\`: Estado de segurança (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** URL completa de autorização OAuth.`,
        inputSchema: GetOAuthAuthorizationUrlSchema.shape,
      },
      async (params: z.infer<typeof GetOAuthAuthorizationUrlSchema>) => {
        const validatedParams = GetOAuthAuthorizationUrlSchema.parse(params);
        return this.getOAuthAuthorizationUrl(
          validatedParams.responseType,
          validatedParams.clientId,
          validatedParams.redirectUri,
          validatedParams.scope,
          validatedParams.state,
          validatedParams.output
        );
      }
    );

    // Register access token tools
    server.registerTool(
      'auth_get_access_token_info',
      {
        description: `Obtém informações de um token de acesso no Bitbucket Data Center.

**Funcionalidades:**
- Informações detalhadas do token
- Validação de token
- Metadados de acesso

**Parâmetros:**
- \`accessToken\`: Token de acesso
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Informações detalhadas do token de acesso.`,
        inputSchema: AccessTokenInfoSchema.shape,
      },
      async (params: z.infer<typeof AccessTokenInfoSchema>) => {
        const validatedParams = AccessTokenInfoSchema.parse(params);
        return this.getAccessTokenInfo(validatedParams.accessToken, validatedParams.output);
      }
    );

    server.registerTool(
      'auth_revoke_access_token',
      {
        description: `Revoga um token de acesso no Bitbucket Data Center.

**Funcionalidades:**
- Revogação segura de token
- Invalidação imediata
- Limpeza de sessão

**Parâmetros:**
- \`accessToken\`: Token de acesso a ser revogado
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Confirmação de revogação do token.`,
        inputSchema: RevokeAccessTokenSchema.shape,
      },
      async (params: z.infer<typeof RevokeAccessTokenSchema>) => {
        const validatedParams = RevokeAccessTokenSchema.parse(params);
        return this.revokeAccessToken(validatedParams.accessToken, validatedParams.output);
      }
    );

    // Register OAuth application tools
    server.registerTool(
      'auth_create_oauth_application',
      {
        description: `Cria uma aplicação OAuth no Bitbucket Data Center.

**Funcionalidades:**
- Criação de aplicação OAuth
- Configuração de callback
- Geração de credenciais

**Parâmetros:**
- \`name\`: Nome da aplicação
- \`description\`: Descrição da aplicação (opcional)
- \`url\`: URL da aplicação (opcional)
- \`callbackUrl\`: URL de callback (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Aplicação OAuth criada com credenciais.`,
        inputSchema: CreateOAuthApplicationSchema.shape,
      },
      async (params: z.infer<typeof CreateOAuthApplicationSchema>) => {
        const validatedParams = CreateOAuthApplicationSchema.parse(params);
        return this.createOAuthApplication(
          validatedParams.name,
          validatedParams.description,
          validatedParams.url,
          validatedParams.callbackUrl,
          validatedParams.output
        );
      }
    );

    server.registerTool(
      'auth_get_oauth_application',
      {
        description: `Obtém uma aplicação OAuth no Bitbucket Data Center.

**Funcionalidades:**
- Informações da aplicação
- Configurações atuais
- Status da aplicação

**Parâmetros:**
- \`applicationId\`: ID da aplicação OAuth
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Informações detalhadas da aplicação OAuth.`,
        inputSchema: GetOAuthApplicationSchema.shape,
      },
      async (params: z.infer<typeof GetOAuthApplicationSchema>) => {
        const validatedParams = GetOAuthApplicationSchema.parse(params);
        return this.getOAuthApplication(validatedParams.applicationId, validatedParams.output);
      }
    );

    server.registerTool(
      'auth_update_oauth_application',
      {
        description: `Atualiza uma aplicação OAuth no Bitbucket Data Center.

**Funcionalidades:**
- Atualização de configurações
- Modificação de URLs
- Alteração de descrição

**Parâmetros:**
- \`applicationId\`: ID da aplicação OAuth
- \`name\`: Novo nome da aplicação (opcional)
- \`description\`: Nova descrição (opcional)
- \`url\`: Nova URL (opcional)
- \`callbackUrl\`: Nova URL de callback (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Aplicação OAuth atualizada.`,
        inputSchema: UpdateOAuthApplicationSchema.shape,
      },
      async (params: z.infer<typeof UpdateOAuthApplicationSchema>) => {
        const validatedParams = UpdateOAuthApplicationSchema.parse(params);
        return this.updateOAuthApplication(
          validatedParams.applicationId,
          validatedParams.name,
          validatedParams.description,
          validatedParams.url,
          validatedParams.callbackUrl,
          validatedParams.output
        );
      }
    );

    server.registerTool(
      'auth_delete_oauth_application',
      {
        description: `Remove uma aplicação OAuth no Bitbucket Data Center.

**Funcionalidades:**
- Remoção segura da aplicação
- Limpeza de credenciais
- Confirmação de exclusão

**Parâmetros:**
- \`applicationId\`: ID da aplicação OAuth
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Confirmação de remoção da aplicação.`,
        inputSchema: DeleteOAuthApplicationSchema.shape,
      },
      async (params: z.infer<typeof DeleteOAuthApplicationSchema>) => {
        const validatedParams = DeleteOAuthApplicationSchema.parse(params);
        return this.deleteOAuthApplication(validatedParams.applicationId, validatedParams.output);
      }
    );

    server.registerTool(
      'auth_list_oauth_applications',
      {
        description: `Lista todas as aplicações OAuth no Bitbucket Data Center.

**Funcionalidades:**
- Lista completa de aplicações
- Informações básicas
- Status de cada aplicação

**Parâmetros:**
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Lista de todas as aplicações OAuth.`,
        inputSchema: ListOAuthApplicationsSchema.shape,
      },
      async (params: z.infer<typeof ListOAuthApplicationsSchema>) => {
        const validatedParams = ListOAuthApplicationsSchema.parse(params);
        return this.listOAuthApplications(validatedParams.output);
      }
    );

    // Register session management tools
    server.registerTool(
      'auth_get_current_session',
      {
        description: `Obtém a sessão atual do usuário no Bitbucket Data Center.

**Funcionalidades:**
- Informações da sessão atual
- Status de autenticação
- Metadados do usuário

**Parâmetros:**
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Informações da sessão atual do usuário.`,
        inputSchema: GetCurrentSessionSchema.shape,
      },
      async (params: z.infer<typeof GetCurrentSessionSchema>) => {
        const validatedParams = GetCurrentSessionSchema.parse(params);
        return this.getCurrentSession(validatedParams.output);
      }
    );

    server.registerTool(
      'auth_create_session',
      {
        description: `Cria uma nova sessão de usuário no Bitbucket Data Center.

**Funcionalidades:**
- Criação de sessão
- Autenticação de usuário
- Configuração de sessão

**Parâmetros:**
- \`userId\`: ID do usuário
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Nova sessão criada com informações do usuário.`,
        inputSchema: CreateSessionSchema.shape,
      },
      async (params: z.infer<typeof CreateSessionSchema>) => {
        const validatedParams = CreateSessionSchema.parse(params);
        return this.createSession(validatedParams.userId, validatedParams.output);
      }
    );

    server.registerTool(
      'auth_refresh_session',
      {
        description: `Atualiza uma sessão de usuário no Bitbucket Data Center.

**Funcionalidades:**
- Renovação de sessão
- Extensão de tempo de vida
- Manutenção de autenticação

**Parâmetros:**
- \`sessionId\`: ID da sessão
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Sessão atualizada com novo tempo de vida.`,
        inputSchema: RefreshSessionSchema.shape,
      },
      async (params: z.infer<typeof RefreshSessionSchema>) => {
        const validatedParams = RefreshSessionSchema.parse(params);
        return this.refreshSession(validatedParams.sessionId, validatedParams.output);
      }
    );

    server.registerTool(
      'auth_revoke_session',
      {
        description: `Revoga uma sessão de usuário no Bitbucket Data Center.

**Funcionalidades:**
- Revogação de sessão
- Logout seguro
- Limpeza de autenticação

**Parâmetros:**
- \`sessionId\`: ID da sessão
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Confirmação de revogação da sessão.`,
        inputSchema: RevokeSessionSchema.shape,
      },
      async (params: z.infer<typeof RevokeSessionSchema>) => {
        const validatedParams = RevokeSessionSchema.parse(params);
        return this.revokeSession(validatedParams.sessionId, validatedParams.output);
      }
    );

    server.registerTool(
      'auth_list_active_sessions',
      {
        description: `Lista sessões ativas de um usuário no Bitbucket Data Center.

**Funcionalidades:**
- Lista de sessões ativas
- Informações de cada sessão
- Status de autenticação

**Parâmetros:**
- \`userId\`: ID do usuário
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Lista de todas as sessões ativas do usuário.`,
        inputSchema: ListActiveSessionsSchema.shape,
      },
      async (params: z.infer<typeof ListActiveSessionsSchema>) => {
        const validatedParams = ListActiveSessionsSchema.parse(params);
        return this.listActiveSessions(validatedParams.userId, validatedParams.output);
      }
    );

    registerLogger.info('Successfully registered all data center authentication tools');
  }
}
