import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPool, Pool } from 'generic-pool';
import { Logger } from '../../utils/logger.util.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { TokenManagementService } from '../../services/cloud/token-management.service.js';
import { createMcpResponse, createErrorResponse } from '../../services/types/base.types.js';
import { z } from 'zod';

// Zod schemas for parameter validation
const CreateRepositoryAccessTokenSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  token: z.any(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateAppPasswordSchema = z.object({
  appPassword: z.any(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteAppPasswordSchema = z.object({
  appPasswordId: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateApiTokenSchema = z.object({
  apiToken: z.any(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteApiTokenSchema = z.object({
  apiTokenId: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ValidateTokenSchema = z.object({
  token: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const OutputOnlySchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

/**
 * Token Management Tools for Bitbucket Cloud
 *
 * Comprehensive token management including:
 * - Repository access tokens
 * - App passwords
 * - API tokens
 * - Token validation
 */
export class CloudTokenManagementTools {
  private static logger = Logger.forContext('CloudTokenManagementTools');
  private static tokenManagementServicePool: Pool<TokenManagementService>;

  static initialize(): void {
    const tokenManagementServiceFactory = {
      create: async () =>
        new TokenManagementService(new ApiClient(), Logger.forContext('TokenManagementService')),
      destroy: async () => {},
    };

    this.tokenManagementServicePool = createPool(tokenManagementServiceFactory, {
      min: 2,
      max: 10,
    });
    this.logger.info('Cloud Token Management tools initialized');
  }

  /**
   * Create repository access token
   */
  static async createRepositoryAccessToken(
    workspace: string,
    repoSlug: string,
    token: any,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('createRepositoryAccessToken');
    let tokenManagementService = null;

    try {
      methodLogger.debug('Creating repository access token:', { workspace, repoSlug, token });
      tokenManagementService = await this.tokenManagementServicePool.acquire();

      const result = await tokenManagementService.createRepositoryAccessToken(
        workspace,
        repoSlug,
        token
      );

      methodLogger.debug('Successfully created repository access token');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create repository access token:', error);
      if (tokenManagementService) {
        this.tokenManagementServicePool.destroy(tokenManagementService);
        tokenManagementService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (tokenManagementService) {
        this.tokenManagementServicePool.release(tokenManagementService);
      }
    }
  }

  /**
   * List app passwords
   */
  static async listAppPasswords(output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('listAppPasswords');
    let tokenManagementService = null;

    try {
      methodLogger.debug('Listing app passwords');
      tokenManagementService = await this.tokenManagementServicePool.acquire();

      const result = await tokenManagementService.listAppPasswords();

      methodLogger.debug('Successfully listed app passwords');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list app passwords:', error);
      if (tokenManagementService) {
        this.tokenManagementServicePool.destroy(tokenManagementService);
        tokenManagementService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (tokenManagementService) {
        this.tokenManagementServicePool.release(tokenManagementService);
      }
    }
  }

  /**
   * Create app password
   */
  static async createAppPassword(appPassword: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('createAppPassword');
    let tokenManagementService = null;

    try {
      methodLogger.debug('Creating app password:', { appPassword });
      tokenManagementService = await this.tokenManagementServicePool.acquire();

      const result = await tokenManagementService.createAppPassword(appPassword);

      methodLogger.debug('Successfully created app password');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create app password:', error);
      if (tokenManagementService) {
        this.tokenManagementServicePool.destroy(tokenManagementService);
        tokenManagementService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (tokenManagementService) {
        this.tokenManagementServicePool.release(tokenManagementService);
      }
    }
  }

  /**
   * Delete app password
   */
  static async deleteAppPassword(appPasswordId: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('deleteAppPassword');
    let tokenManagementService = null;

    try {
      methodLogger.debug('Deleting app password:', { appPasswordId });
      tokenManagementService = await this.tokenManagementServicePool.acquire();

      await tokenManagementService.deleteAppPassword(appPasswordId);

      methodLogger.debug('Successfully deleted app password');
      return createMcpResponse({ message: 'App password deleted successfully' }, output);
    } catch (error) {
      methodLogger.error('Failed to delete app password:', error);
      if (tokenManagementService) {
        this.tokenManagementServicePool.destroy(tokenManagementService);
        tokenManagementService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (tokenManagementService) {
        this.tokenManagementServicePool.release(tokenManagementService);
      }
    }
  }

  /**
   * List API tokens
   */
  static async listApiTokens(output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('listApiTokens');
    let tokenManagementService = null;

    try {
      methodLogger.debug('Listing API tokens');
      tokenManagementService = await this.tokenManagementServicePool.acquire();

      const result = await tokenManagementService.listApiTokens();

      methodLogger.debug('Successfully listed API tokens');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list API tokens:', error);
      if (tokenManagementService) {
        this.tokenManagementServicePool.destroy(tokenManagementService);
        tokenManagementService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (tokenManagementService) {
        this.tokenManagementServicePool.release(tokenManagementService);
      }
    }
  }

  /**
   * Create API token
   */
  static async createApiToken(apiToken: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('createApiToken');
    let tokenManagementService = null;

    try {
      methodLogger.debug('Creating API token:', { apiToken });
      tokenManagementService = await this.tokenManagementServicePool.acquire();

      const result = await tokenManagementService.createApiToken(apiToken);

      methodLogger.debug('Successfully created API token');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create API token:', error);
      if (tokenManagementService) {
        this.tokenManagementServicePool.destroy(tokenManagementService);
        tokenManagementService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (tokenManagementService) {
        this.tokenManagementServicePool.release(tokenManagementService);
      }
    }
  }

  /**
   * Delete API token
   */
  static async deleteApiToken(apiTokenId: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('deleteApiToken');
    let tokenManagementService = null;

    try {
      methodLogger.debug('Deleting API token:', { apiTokenId });
      tokenManagementService = await this.tokenManagementServicePool.acquire();

      await tokenManagementService.deleteApiToken(apiTokenId);

      methodLogger.debug('Successfully deleted API token');
      return createMcpResponse({ message: 'API token deleted successfully' }, output);
    } catch (error) {
      methodLogger.error('Failed to delete API token:', error);
      if (tokenManagementService) {
        this.tokenManagementServicePool.destroy(tokenManagementService);
        tokenManagementService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (tokenManagementService) {
        this.tokenManagementServicePool.release(tokenManagementService);
      }
    }
  }

  /**
   * Validate token
   */
  static async validateToken(token: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('validateToken');
    let tokenManagementService = null;

    try {
      methodLogger.debug('Validating token');
      tokenManagementService = await this.tokenManagementServicePool.acquire();

      const result = await tokenManagementService.validateToken(token);

      methodLogger.debug('Successfully validated token');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to validate token:', error);
      if (tokenManagementService) {
        this.tokenManagementServicePool.destroy(tokenManagementService);
        tokenManagementService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (tokenManagementService) {
        this.tokenManagementServicePool.release(tokenManagementService);
      }
    }
  }

  /**
   * Register all token management tools with the MCP server
   */
  static register(server: McpServer): void {
    const registerLogger = this.logger.forMethod('register');

    // Initialize the service
    this.initialize();

    // Register create repository access token tool
    server.registerTool(
      'token_create_repository_access_token',
      {
        description: `Cria token de acesso para repositório no Bitbucket Cloud.

**Funcionalidades:**
- Criação de tokens de acesso específicos para repositórios
- Configuração de permissões
- Controle de acesso granular

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`token\`: Objeto com configurações do token
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do token criado.`,
        inputSchema: CreateRepositoryAccessTokenSchema.shape,
      },
      async (params: z.infer<typeof CreateRepositoryAccessTokenSchema>) => {
        const validatedParams = CreateRepositoryAccessTokenSchema.parse(params);
        return this.createRepositoryAccessToken(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.token,
          validatedParams.output
        );
      }
    );

    // Register list app passwords tool
    server.registerTool(
      'token_list_app_passwords',
      {
        description: `Lista senhas de aplicativo no Bitbucket Cloud.

**Funcionalidades:**
- Listagem de senhas de aplicativo
- Informações detalhadas de cada senha
- Metadados e configurações

**Parâmetros:**
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de senhas de aplicativo.`,
        inputSchema: OutputOnlySchema.shape,
      },
      async (params: z.infer<typeof OutputOnlySchema>) => {
        const validatedParams = OutputOnlySchema.parse(params);
        return this.listAppPasswords(validatedParams.output);
      }
    );

    // Register create app password tool
    server.registerTool(
      'token_create_app_password',
      {
        description: `Cria uma nova senha de aplicativo no Bitbucket Cloud.

**Funcionalidades:**
- Criação de senhas de aplicativo
- Configuração de permissões
- Metadados e informações da senha

**Parâmetros:**
- \`appPassword\`: Objeto com configurações da senha de aplicativo
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes da senha de aplicativo criada.`,
        inputSchema: CreateAppPasswordSchema.shape,
      },
      async (params: z.infer<typeof CreateAppPasswordSchema>) => {
        const validatedParams = CreateAppPasswordSchema.parse(params);
        return this.createAppPassword(validatedParams.appPassword, validatedParams.output);
      }
    );

    // Register delete app password tool
    server.registerTool(
      'token_delete_app_password',
      {
        description: `Remove uma senha de aplicativo no Bitbucket Cloud.

**Funcionalidades:**
- Remoção de senhas de aplicativo
- Limpeza de senhas obsoletas
- Controle de acesso

**Parâmetros:**
- \`appPasswordId\`: ID da senha de aplicativo
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a confirmação da remoção.`,
        inputSchema: DeleteAppPasswordSchema.shape,
      },
      async (params: z.infer<typeof DeleteAppPasswordSchema>) => {
        const validatedParams = DeleteAppPasswordSchema.parse(params);
        return this.deleteAppPassword(validatedParams.appPasswordId, validatedParams.output);
      }
    );

    // Register list API tokens tool
    server.registerTool(
      'token_list_api_tokens',
      {
        description: `Lista tokens de API no Bitbucket Cloud.

**Funcionalidades:**
- Listagem de tokens de API
- Informações detalhadas de cada token
- Metadados e configurações

**Parâmetros:**
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de tokens de API.`,
        inputSchema: OutputOnlySchema.shape,
      },
      async (params: z.infer<typeof OutputOnlySchema>) => {
        const validatedParams = OutputOnlySchema.parse(params);
        return this.listApiTokens(validatedParams.output);
      }
    );

    // Register create API token tool
    server.registerTool(
      'token_create_api_token',
      {
        description: `Cria um novo token de API no Bitbucket Cloud.

**Funcionalidades:**
- Criação de tokens de API
- Configuração de permissões
- Metadados e informações do token

**Parâmetros:**
- \`apiToken\`: Objeto com configurações do token de API
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do token de API criado.`,
        inputSchema: CreateApiTokenSchema.shape,
      },
      async (params: z.infer<typeof CreateApiTokenSchema>) => {
        const validatedParams = CreateApiTokenSchema.parse(params);
        return this.createApiToken(validatedParams.apiToken, validatedParams.output);
      }
    );

    // Register delete API token tool
    server.registerTool(
      'token_delete_api_token',
      {
        description: `Remove um token de API no Bitbucket Cloud.

**Funcionalidades:**
- Remoção de tokens de API
- Limpeza de tokens obsoletos
- Controle de acesso

**Parâmetros:**
- \`apiTokenId\`: ID do token de API
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a confirmação da remoção.`,
        inputSchema: DeleteApiTokenSchema.shape,
      },
      async (params: z.infer<typeof DeleteApiTokenSchema>) => {
        const validatedParams = DeleteApiTokenSchema.parse(params);
        return this.deleteApiToken(validatedParams.apiTokenId, validatedParams.output);
      }
    );

    // Register validate token tool
    server.registerTool(
      'token_validate_token',
      {
        description: `Valida um token no Bitbucket Cloud.

**Funcionalidades:**
- Validação de tokens
- Verificação de autenticidade
- Teste de conectividade

**Parâmetros:**
- \`token\`: Token a ser validado
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o resultado da validação.`,
        inputSchema: ValidateTokenSchema.shape,
      },
      async (params: z.infer<typeof ValidateTokenSchema>) => {
        const validatedParams = ValidateTokenSchema.parse(params);
        return this.validateToken(validatedParams.token, validatedParams.output);
      }
    );

    registerLogger.info('Successfully registered all cloud token management tools');
  }
}
