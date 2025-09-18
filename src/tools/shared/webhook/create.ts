/**
 * Create Webhook Tool
 * T046: Webhook MCP tools in src/tools/shared/webhook/
 * 
 * Creates a new webhook for both Data Center and Cloud
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { WebhookService } from '../../../services/WebhookService.js';
import { serverDetectionService } from '../../../services/server-detection.js';
import { logger } from '../../../utils/logger.js';

// Tool schema
const CreateWebhookSchema = z.object({
  projectKey: z.string().min(1),
  repositorySlug: z.string().optional(),
  name: z.string().min(1).max(255),
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  active: z.boolean().optional(),
  configuration: z.record(z.any()).optional(),
});

export const createWebhookTool: Tool = {
  name: 'mcp_bitbucket_webhook_create',
  description: 'Cria um novo webhook no Bitbucket.',
  inputSchema: {
    type: 'object',
    properties: {
      projectKey: {
        type: 'string',
        description: 'Chave do projeto'
      },
      repositorySlug: {
        type: 'string',
        description: 'Slug do repositório (opcional - se não fornecido, cria webhook do projeto)'
      },
      name: {
        type: 'string',
        description: 'Nome do webhook',
        minLength: 1,
        maxLength: 255
      },
      url: {
        type: 'string',
        format: 'uri',
        description: 'URL do webhook'
      },
      events: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: 'Lista de eventos do webhook',
        minItems: 1
      },
      active: {
        type: 'boolean',
        description: 'Se o webhook está ativo (opcional)'
      },
      configuration: {
        type: 'object',
        description: 'Configuração adicional do webhook (opcional)'
      },
      output: {
        type: 'string',
        enum: ['markdown', 'json'],
        description: 'Formato de saída',
        default: 'json'
      }
    },
    required: ['projectKey', 'name', 'url', 'events']
  }
};

export async function handleCreateWebhook(args: unknown): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const validatedArgs = CreateWebhookSchema.parse(args);
    
    // Detect server type
    const serverInfo = await serverDetectionService.detectServerType(process.env.BITBUCKET_URL || '');

    // Create webhook service
    const webhookService = new WebhookService(serverInfo, {});
    
    // Create webhook
    const webhook = await webhookService.createWebhook(
      validatedArgs.projectKey,
      validatedArgs.repositorySlug || null,
      {
        name: validatedArgs.name,
        url: validatedArgs.url,
        events: validatedArgs.events,
        active: validatedArgs.active,
        configuration: validatedArgs.configuration,
      }
    );

    logger.info('Webhook created successfully', {
      projectKey: validatedArgs.projectKey,
      repositorySlug: validatedArgs.repositorySlug,
      webhookId: webhook.id,
      webhookName: webhook.name,
      serverType: serverInfo.serverType,
    });

    const result = {
      success: true,
      webhook: {
        id: webhook.id,
        name: webhook.name,
        url: webhook.url,
        events: webhook.events,
        active: webhook.active,
        configuration: webhook.configuration,
        createdDate: webhook.createdDate,
        updatedDate: webhook.updatedDate,
        statistics: webhook.statistics,
      }
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };

  } catch (error) {
    logger.error('Failed to create webhook', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const errorResult = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(errorResult, null, 2)
      }]
    };
  }
}
