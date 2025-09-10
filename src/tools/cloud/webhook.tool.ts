import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPool, Pool } from 'generic-pool';
import { WebhookService } from '../../services/cloud/webhook.service.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';
import { createMcpResponse, createErrorResponse } from '../../services/types/base.types.js';
import { z } from 'zod';

// Zod schemas for parameter validation
const GetWebhookResourceSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListWebhookTypesSchema = z.object({
  subject_type: z.string(),
  page: z.number().optional(),
  pagelen: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

/**
 * Cloud Webhook Tools
 * Ferramentas para gerenciamento de webhooks no Bitbucket Cloud
 */
export class CloudWebhookTools {
  private static logger = Logger.forContext('CloudWebhookTools');
  private static webhookServicePool: Pool<WebhookService>;

  static initialize(): void {
    const webhookServiceFactory = {
      create: async () => new WebhookService(new ApiClient()),
      destroy: async () => {},
    };

    this.webhookServicePool = createPool(webhookServiceFactory, {
      min: 2,
      max: 10,
    });
    this.logger.info('Cloud Webhook tools initialized');
  }

  static async getWebhookResource(output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getWebhookResource');
    let service: WebhookService | null = null;

    try {
      service = await this.webhookServicePool.acquire();
      methodLogger.debug('Getting webhook resource');

      const result = await service.getWebhookResource();

      methodLogger.info('Successfully retrieved webhook resource');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get webhook resource:', error);
      if (service) {
        this.webhookServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.webhookServicePool.release(service);
      }
    }
  }

  static async listWebhookTypes(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('listWebhookTypes');
    let service: WebhookService | null = null;

    try {
      service = await this.webhookServicePool.acquire();
      methodLogger.debug('Listing webhook types:', {
        subject_type: params.subject_type,
        page: params.page,
        pagelen: params.pagelen,
      });

      const result = await service.listWebhookTypes({
        subject_type: params.subject_type,
        page: params.page,
        pagelen: params.pagelen,
      });

      methodLogger.info('Successfully listed webhook types');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list webhook types:', error);
      if (service) {
        this.webhookServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.webhookServicePool.release(service);
      }
    }
  }

  static register(server: McpServer): void {
    const registerLogger = this.logger.forMethod('register');

    // Initialize the service
    this.initialize();

    // Get Webhook Resource
    server.registerTool(
      'webhook_get_resource',
      {
        description: `Obtém o recurso de webhook ou tipos de assunto nos quais webhooks podem ser registrados no Bitbucket Cloud.

**Funcionalidades:**
- Obtenção de recursos de webhook
- Listagem de tipos de assunto disponíveis
- Informações sobre eventos de webhook

**Parâmetros:**
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os recursos de webhook disponíveis.`,
        inputSchema: GetWebhookResourceSchema.shape,
      },
      async (params: z.infer<typeof GetWebhookResourceSchema>) => {
        const validatedParams = GetWebhookResourceSchema.parse(params);
        return await this.getWebhookResource(validatedParams.output);
      }
    );

    // List Webhook Types
    server.registerTool(
      'webhook_list_types',
      {
        description: `Lista todos os eventos de webhook válidos para a entidade especificada no Bitbucket Cloud.

**Funcionalidades:**
- Listagem de eventos de webhook válidos
- Filtros por tipo de assunto
- Paginação de resultados

**Parâmetros:**
- \`subject_type\`: Tipo de assunto (repository, workspace, user, team)
- \`page\`: Número da página para paginação (opcional)
- \`pagelen\`: Número de itens por página (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de tipos de webhook.`,
        inputSchema: ListWebhookTypesSchema.shape,
      },
      async (params: z.infer<typeof ListWebhookTypesSchema>) => {
        const validatedParams = ListWebhookTypesSchema.parse(params);
        return await this.listWebhookTypes(
          {
            subject_type: validatedParams.subject_type,
            page: validatedParams.page,
            pagelen: validatedParams.pagelen,
          },
          validatedParams.output
        );
      }
    );

    registerLogger.info('Successfully registered all cloud webhook tools');
  }
}
