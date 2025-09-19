/**
 * List Webhooks Tool
 * T046: Webhook MCP tools in src/tools/shared/webhook/
 * 
 * Lists webhooks for both Data Center and Cloud
 */

import { Tool } from '@modelcontextprotocol/sdk/types';
import { z } from 'zod';
import { WebhookService } from '../../../services/WebhookService';
import { serverDetectionService } from '../../../services/server-detection';
import { logger } from '../../../utils/logger';

// Tool schema
const ListWebhooksSchema = z.object({
  projectKey: z.string().min(1),
  repositorySlug: z.string().optional(),
  start: z.number().min(0).optional(),
  limit: z.number().min(1).max(100).optional(),
});

export const listWebhooksTool: Tool = {
  name: 'mcp_bitbucket_webhook_list',
  description: 'Lista webhooks de um projeto ou repositório no Bitbucket.',
  inputSchema: {
    type: 'object',
    properties: {
      projectKey: {
        type: 'string',
        description: 'Chave do projeto'
      },
      repositorySlug: {
        type: 'string',
        description: 'Slug do repositório (opcional - se não fornecido, lista webhooks do projeto)'
      },
      start: {
        type: 'number',
        description: 'Índice inicial (opcional)',
        minimum: 0
      },
      limit: {
        type: 'number',
        description: 'Limite de resultados (opcional)',
        minimum: 1,
        maximum: 100
      },
      output: {
        type: 'string',
        enum: ['markdown', 'json'],
        description: 'Formato de saída',
        default: 'json'
      }
    },
    required: ['projectKey']
  }
};

export async function handleListWebhooks(args: unknown): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const validatedArgs = ListWebhooksSchema.parse(args);
    
    // Detect server type
    const serverInfo = await serverDetectionService.detectServerType(process.env.BITBUCKET_URL || '');

    // Create webhook service
    const webhookService = new WebhookService(serverInfo, {});
    
    // List webhooks
    const webhooks = validatedArgs.repositorySlug
      ? await webhookService.listRepositoryWebhooks(
          validatedArgs.projectKey,
          validatedArgs.repositorySlug,
          {
            start: validatedArgs.start,
            limit: validatedArgs.limit,
          }
        )
      : await webhookService.listProjectWebhooks(
          validatedArgs.projectKey,
          {
            start: validatedArgs.start,
            limit: validatedArgs.limit,
          }
        );

    logger.info('Webhooks listed successfully', {
      projectKey: validatedArgs.projectKey,
      repositorySlug: validatedArgs.repositorySlug,
      count: webhooks.values.length,
      total: webhooks.size,
      serverType: serverInfo.serverType,
    });

    const result = {
      success: true,
      webhooks: {
        size: webhooks.size,
        limit: webhooks.limit,
        isLastPage: webhooks.isLastPage,
        start: webhooks.start,
        values: webhooks.values.map(webhook => ({
          id: webhook.id,
          name: webhook.name,
          url: webhook.url,
          events: webhook.events,
          active: webhook.active,
          configuration: webhook.configuration,
          createdDate: webhook.createdDate,
          updatedDate: webhook.updatedDate,
          statistics: webhook.statistics,
        }))
      }
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };

  } catch (error) {
    logger.error('Failed to list webhooks', {
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
