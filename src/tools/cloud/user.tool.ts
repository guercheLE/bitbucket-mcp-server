import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPool, Pool } from 'generic-pool';
import { UserService } from '../../services/cloud/user.service.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';
import { createMcpResponse, createErrorResponse } from '../../services/types/base.types.js';
import { z } from 'zod';

// Zod schemas for parameter validation
const GetCurrentUserSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListUserEmailsSchema = z.object({
  page: z.number().optional(),
  pagelen: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetUserEmailSchema = z.object({
  email: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetUserSchema = z.object({
  selected_user: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

/**
 * Cloud User Tools
 * Ferramentas para gerenciamento de usuários no Bitbucket Cloud
 */

export class CloudUserTools {
  private static logger = Logger.forContext('CloudUserTools');
  private static userServicePool: Pool<UserService>;

  static initialize(): void {
    const userServiceFactory = {
      create: async () => new UserService(new ApiClient()),
      destroy: async () => {},
    };

    this.userServicePool = createPool(userServiceFactory, {
      min: 2,
      max: 10,
    });
    this.logger.info('Cloud User tools initialized');
  }

  static async getCurrentUser(output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getCurrentUser');
    let service: UserService | null = null;

    try {
      service = await this.userServicePool.acquire();
      methodLogger.debug('Getting current user');

      const result = await service.getCurrentUser();

      methodLogger.info('Successfully retrieved current user');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get current user:', error);
      if (service) {
        this.userServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.userServicePool.release(service);
      }
    }
  }

  static async listUserEmails(params: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('listUserEmails');
    let service: UserService | null = null;

    try {
      service = await this.userServicePool.acquire();
      methodLogger.debug('Listing user emails:', {
        page: params.page,
        pagelen: params.pagelen,
      });

      const result = await service.listUserEmails({
        page: params.page,
        pagelen: params.pagelen,
      });

      methodLogger.info('Successfully listed user emails');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list user emails:', error);
      if (service) {
        this.userServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.userServicePool.release(service);
      }
    }
  }

  static async getUserEmail(params: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getUserEmail');
    let service: UserService | null = null;

    try {
      service = await this.userServicePool.acquire();
      methodLogger.debug('Getting user email:', {
        email: params.email,
      });

      const result = await service.getUserEmail({
        email: params.email,
      });

      methodLogger.info('Successfully retrieved user email');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get user email:', error);
      if (service) {
        this.userServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.userServicePool.release(service);
      }
    }
  }

  static async getUser(params: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getUser');
    let service: UserService | null = null;

    try {
      service = await this.userServicePool.acquire();
      methodLogger.debug('Getting user:', {
        selected_user: params.selected_user,
      });

      const result = await service.getUser({
        selected_user: params.selected_user,
      });

      methodLogger.info('Successfully retrieved user');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get user:', error);
      if (service) {
        this.userServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.userServicePool.release(service);
      }
    }
  }

  static register(server: McpServer): void {
    const registerLogger = this.logger.forMethod('register');

    // Initialize the service
    this.initialize();

    // Get Current User
    server.registerTool(
      'user_get_current',
      {
        description: `Obtém o usuário atualmente logado no Bitbucket Cloud.

**Funcionalidades:**
- Obtenção de informações do usuário atual
- Dados de perfil e configurações
- Informações de autenticação

**Parâmetros:**
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com as informações do usuário atual.`,
        inputSchema: GetCurrentUserSchema.shape,
      },
      async (params: z.infer<typeof GetCurrentUserSchema>) => {
        const validatedParams = GetCurrentUserSchema.parse(params);
        return await this.getCurrentUser(validatedParams.output);
      }
    );

    // List User Emails
    server.registerTool(
      'user_list_emails',
      {
        description: `Lista os endereços de email do usuário atual no Bitbucket Cloud.

**Funcionalidades:**
- Listagem de emails do usuário atual
- Paginação de resultados
- Informações de verificação de email

**Parâmetros:**
- \`page\`: Número da página para paginação (opcional)
- \`pagelen\`: Número de itens por página (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de emails do usuário.`,
        inputSchema: ListUserEmailsSchema.shape,
      },
      async (params: z.infer<typeof ListUserEmailsSchema>) => {
        const validatedParams = ListUserEmailsSchema.parse(params);
        return await this.listUserEmails(
          {
            page: validatedParams.page,
            pagelen: validatedParams.pagelen,
          },
          validatedParams.output
        );
      }
    );

    // Get User Email
    server.registerTool(
      'user_get_email',
      {
        description: `Obtém um endereço de email específico do usuário atual no Bitbucket Cloud.

**Funcionalidades:**
- Obtenção de email específico do usuário
- Informações de verificação
- Detalhes do endereço de email

**Parâmetros:**
- \`email\`: Endereço de email
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com as informações do email específico.`,
        inputSchema: GetUserEmailSchema.shape,
      },
      async (params: z.infer<typeof GetUserEmailSchema>) => {
        const validatedParams = GetUserEmailSchema.parse(params);
        return await this.getUserEmail(
          {
            email: validatedParams.email,
          },
          validatedParams.output
        );
      }
    );

    // Get User
    server.registerTool(
      'user_get',
      {
        description: `Obtém informações públicas de uma conta de usuário no Bitbucket Cloud.

**Funcionalidades:**
- Obtenção de informações públicas de usuário
- Dados de perfil público
- Informações de conta

**Parâmetros:**
- \`selected_user\`: Nome de usuário ou UUID do usuário
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com as informações públicas do usuário.`,
        inputSchema: GetUserSchema.shape,
      },
      async (params: z.infer<typeof GetUserSchema>) => {
        const validatedParams = GetUserSchema.parse(params);
        return await this.getUser(
          {
            selected_user: validatedParams.selected_user,
          },
          validatedParams.output
        );
      }
    );

    registerLogger.info('Successfully registered all cloud user tools');
  }
}
