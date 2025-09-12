import { z } from 'zod';
import { MCPTool, ToolResult } from '@/types/mcp';
import { BitbucketConfig } from '@/types/config';
import { Webhook } from '@/types/cloud';
import { configService } from '@/services/config.service';
import { bitbucketAPIService } from '@/services/bitbucket-api.service';
import { loggerService } from '@/services/logger.service';
import { assertPaginatedDataResponse } from '@/integration/api-client';

// List Webhooks Schema
const ListWebhooksSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  workspace: z.string().min(1, 'Workspace is required'),
  repo: z.string().min(1, 'Repository name is required'),
  authType: z.enum(['oauth', 'app_password']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  appPassword: z.string().optional(),
});

// Get Webhook Schema
const GetWebhookSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  workspace: z.string().min(1, 'Workspace is required'),
  repo: z.string().min(1, 'Repository name is required'),
  webhookId: z.string().min(1, 'Webhook ID is required'),
  authType: z.enum(['oauth', 'app_password']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  appPassword: z.string().optional(),
});

// Create Webhook Schema
const CreateWebhookSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  workspace: z.string().min(1, 'Workspace is required'),
  repo: z.string().min(1, 'Repository name is required'),
  description: z.string().min(1, 'Description is required'),
  url: z.string().url('Webhook URL must be a valid URL'),
  events: z
    .array(
      z.enum([
        'repo:push',
        'repo:fork',
        'repo:updated',
        'repo:commit_comment_created',
        'repo:commit_status_created',
        'repo:commit_status_updated',
        'issue:created',
        'issue:updated',
        'issue:comment_created',
        'pullrequest:created',
        'pullrequest:updated',
        'pullrequest:approved',
        'pullrequest:unapproved',
        'pullrequest:fulfilled',
        'pullrequest:rejected',
        'pullrequest:comment_created',
        'pullrequest:comment_updated',
        'pullrequest:comment_deleted',
      ])
    )
    .min(1, 'At least one event is required'),
  active: z.boolean().default(true),
  authType: z.enum(['oauth', 'app_password']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  appPassword: z.string().optional(),
});

// Update Webhook Schema
const UpdateWebhookSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  workspace: z.string().min(1, 'Workspace is required'),
  repo: z.string().min(1, 'Repository name is required'),
  webhookId: z.string().min(1, 'Webhook ID is required'),
  description: z.string().optional(),
  url: z.string().url().optional(),
  events: z
    .array(
      z.enum([
        'repo:push',
        'repo:fork',
        'repo:updated',
        'repo:commit_comment_created',
        'repo:commit_status_created',
        'repo:commit_status_updated',
        'issue:created',
        'issue:updated',
        'issue:comment_created',
        'pullrequest:created',
        'pullrequest:updated',
        'pullrequest:approved',
        'pullrequest:unapproved',
        'pullrequest:fulfilled',
        'pullrequest:rejected',
        'pullrequest:comment_created',
        'pullrequest:comment_updated',
        'pullrequest:comment_deleted',
      ])
    )
    .optional(),
  active: z.boolean().optional(),
  authType: z.enum(['oauth', 'app_password']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  appPassword: z.string().optional(),
});

// Delete Webhook Schema
const DeleteWebhookSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  workspace: z.string().min(1, 'Workspace is required'),
  repo: z.string().min(1, 'Repository name is required'),
  webhookId: z.string().min(1, 'Webhook ID is required'),
  authType: z.enum(['oauth', 'app_password']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  appPassword: z.string().optional(),
});

export const listWebhooksTool: MCPTool = {
  name: 'mcp_bitbucket_webhook_list',
  description: 'List webhooks in a Bitbucket Cloud repository',
  inputSchema: ListWebhooksSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'listWebhooks',
      serverType: ['datacenter'],
      operation: 'list_webhooks',
      category: 'unknown',
    });

    try {
      logger.info('Listing webhooks', {
        params: { ...(params as Record<string, unknown>), appPassword: '[REDACTED]' },
      });

      const validatedParams = ListWebhooksSchema.parse(params);
      const config = buildConfig(validatedParams);

      const result = await bitbucketAPIService.get(
        config,
        `/2.0/repositories/${validatedParams.workspace}/${validatedParams.repo}/hooks`
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        const webhooks = assertPaginatedDataResponse(result.data).data.values.map(transformWebhook);

        logger.info('Webhooks listed successfully', {
          count: webhooks.length,
          workspace: validatedParams.workspace,
          repo: validatedParams.repo,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  webhooks,
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to list webhooks', {
          error: result.error?.message,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error: {
                    code: result.error?.code,
                    message: result.error?.message,
                  },
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      logger.error('List webhooks tool error', {
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: {
                  code: 'MCP_TOOL_ERROR',
                  message: error instanceof Error ? error.message : String(error),
                },
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  },
  serverType: ['cloud'],
  category: 'webhook',
  operation: 'list',
};

export const getWebhookTool: MCPTool = {
  name: 'mcp_bitbucket_webhook_get',
  description: 'Get webhook details from Bitbucket Cloud',
  inputSchema: GetWebhookSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'getWebhook',
      serverType: ['datacenter'],
      operation: 'get_webhook',
      category: 'unknown',
    });

    try {
      logger.info('Getting webhook', {
        params: { ...(params as Record<string, unknown>), appPassword: '[REDACTED]' },
      });

      const validatedParams = GetWebhookSchema.parse(params);
      const config = buildConfig(validatedParams);

      const result = await bitbucketAPIService.get(
        config,
        `/2.0/repositories/${validatedParams.workspace}/${validatedParams.repo}/hooks/${validatedParams.webhookId}`
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        const webhook = transformWebhook(assertPaginatedDataResponse(result.data).data);

        logger.info('Webhook retrieved successfully', {
          webhookId: validatedParams.webhookId,
          workspace: validatedParams.workspace,
          repo: validatedParams.repo,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  webhook,
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to get webhook', {
          error: result.error?.message,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error: {
                    code: result.error?.code,
                    message: result.error?.message,
                  },
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      logger.error('Get webhook tool error', {
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: {
                  code: 'MCP_TOOL_ERROR',
                  message: error instanceof Error ? error.message : String(error),
                },
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  },
  serverType: ['cloud'],
  category: 'webhook',
  operation: 'get',
};

export const createWebhookTool: MCPTool = {
  name: 'mcp_bitbucket_webhook_create',
  description: 'Create a new webhook in Bitbucket Cloud',
  inputSchema: CreateWebhookSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'createWebhook',
      serverType: ['datacenter'],
      operation: 'create_webhook',
      category: 'unknown',
    });

    try {
      logger.info('Creating webhook', {
        params: { ...(params as Record<string, unknown>), appPassword: '[REDACTED]' },
      });

      const validatedParams = CreateWebhookSchema.parse(params);
      const config = buildConfig(validatedParams);

      const webhookData = {
        description: validatedParams.description,
        url: validatedParams.url,
        active: validatedParams.active,
        events: validatedParams.events,
      };

      const result = await bitbucketAPIService.post(
        config,
        `/2.0/repositories/${validatedParams.workspace}/${validatedParams.repo}/hooks`,
        webhookData
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        const webhook = transformWebhook(assertPaginatedDataResponse(result.data).data);

        logger.info('Webhook created successfully', {
          webhookId: webhook.uuid,
          workspace: validatedParams.workspace,
          repo: validatedParams.repo,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  webhook,
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to create webhook', {
          error: result.error?.message,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error: {
                    code: result.error?.code,
                    message: result.error?.message,
                  },
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      logger.error('Create webhook tool error', {
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: {
                  code: 'MCP_TOOL_ERROR',
                  message: error instanceof Error ? error.message : String(error),
                },
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  },
  serverType: ['cloud'],
  category: 'webhook',
  operation: 'create',
};

export const updateWebhookTool: MCPTool = {
  name: 'mcp_bitbucket_webhook_update',
  description: 'Update a webhook in Bitbucket Cloud',
  inputSchema: UpdateWebhookSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'updateWebhook',
      serverType: ['datacenter'],
      operation: 'update_webhook',
      category: 'unknown',
    });

    try {
      logger.info('Updating webhook', {
        params: { ...(params as Record<string, unknown>), appPassword: '[REDACTED]' },
      });

      const validatedParams = UpdateWebhookSchema.parse(params);
      const config = buildConfig(validatedParams);

      const webhookData: Record<string, any> = {};

      if (validatedParams.description !== undefined) {
        webhookData['description'] = validatedParams.description;
      }
      if (validatedParams.url !== undefined) {
        webhookData['url'] = validatedParams.url;
      }
      if (validatedParams.events !== undefined) {
        webhookData['events'] = validatedParams.events;
      }
      if (validatedParams.active !== undefined) {
        webhookData['active'] = validatedParams.active;
      }

      const result = await bitbucketAPIService.put(
        config,
        `/2.0/repositories/${validatedParams.workspace}/${validatedParams.repo}/hooks/${validatedParams.webhookId}`,
        webhookData
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        const webhook = transformWebhook(assertPaginatedDataResponse(result.data).data);

        logger.info('Webhook updated successfully', {
          webhookId: validatedParams.webhookId,
          workspace: validatedParams.workspace,
          repo: validatedParams.repo,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  webhook,
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to update webhook', {
          error: result.error?.message,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error: {
                    code: result.error?.code,
                    message: result.error?.message,
                  },
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      logger.error('Update webhook tool error', {
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: {
                  code: 'MCP_TOOL_ERROR',
                  message: error instanceof Error ? error.message : String(error),
                },
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  },
  serverType: ['cloud'],
  category: 'webhook',
  operation: 'update',
};

export const deleteWebhookTool: MCPTool = {
  name: 'mcp_bitbucket_webhook_delete',
  description: 'Delete a webhook in Bitbucket Cloud',
  inputSchema: DeleteWebhookSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'deleteWebhook',
      serverType: ['datacenter'],
      operation: 'delete_webhook',
      category: 'unknown',
    });

    try {
      logger.info('Deleting webhook', {
        params: { ...(params as Record<string, unknown>), appPassword: '[REDACTED]' },
      });

      const validatedParams = DeleteWebhookSchema.parse(params);
      const config = buildConfig(validatedParams);

      const result = await bitbucketAPIService.delete(
        config,
        `/2.0/repositories/${validatedParams.workspace}/${validatedParams.repo}/hooks/${validatedParams.webhookId}`
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        logger.info('Webhook deleted successfully', {
          webhookId: validatedParams.webhookId,
          workspace: validatedParams.workspace,
          repo: validatedParams.repo,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: 'Webhook deleted successfully',
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to delete webhook', {
          error: result.error?.message,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error: {
                    code: result.error?.code,
                    message: result.error?.message,
                  },
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      logger.error('Delete webhook tool error', {
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: {
                  code: 'MCP_TOOL_ERROR',
                  message: error instanceof Error ? error.message : String(error),
                },
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  },
  serverType: ['cloud'],
  category: 'webhook',
  operation: 'delete',
};

function buildConfig(params: any): BitbucketConfig {
  const authConfig =
    params.authType === 'oauth'
      ? {
          type: 'oauth' as const,
          credentials: {
            clientId: 'dummy',
            clientSecret: 'dummy',
            tokenType: 'Bearer',
          },
        }
      : {
          type: 'app_password' as const,
          credentials: {
            username: params.username || '',
            appPassword: params.appPassword,
          },
        };

  return {
    baseUrl: params.serverUrl,
    serverType: 'cloud',
    auth: authConfig,
    timeouts: configService.getTimeoutConfig(),
    rateLimit: configService.getRateLimitConfig(),
  };
}

function transformWebhook(data: any): Webhook {
  return {
    uuid: data.uuid,
    description: data.description,
    url: data.url,
    active: data.active || true,
    links: {
      self: { href: data.links?.self?.href || '' },
    },
    events: data.events,
    createdAt: data.created_on,
    updatedAt: data.updated_on,
    subject_type: data.subject_type,
    subject: data.subject,
  };
}
