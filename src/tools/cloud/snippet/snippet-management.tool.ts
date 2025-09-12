import { z } from 'zod';
import { MCPTool, ToolResult } from '@/types/mcp';
import { BitbucketConfig } from '@/types/config';
import { Snippet } from '@/types/cloud';
import { configService } from '@/services/config.service';
import { bitbucketAPIService } from '@/services/bitbucket-api.service';
import { loggerService } from '@/services/logger.service';
import { assertPaginatedDataResponse } from '@/integration/api-client';

// List Snippets Schema
const ListSnippetsSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  workspace: z.string().min(1, 'Workspace is required'),
  authType: z.enum(['oauth', 'app_password']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  appPassword: z.string().optional(),
  role: z.enum(['owner', 'contributor', 'member']).optional(),
  page: z.number().int().min(1).default(1),
  pagelen: z.number().int().min(1).max(100).default(50),
});

// Get Snippet Schema
const GetSnippetSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  workspace: z.string().min(1, 'Workspace is required'),
  snippetId: z.string().min(1, 'Snippet ID is required'),
  authType: z.enum(['oauth', 'app_password']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  appPassword: z.string().optional(),
});

// Create Snippet Schema
const CreateSnippetSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  workspace: z.string().min(1, 'Workspace is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  files: z.record(
    z.object({
      content: z.string().min(1, 'File content is required'),
    })
  ),
  isPrivate: z.boolean().default(false),
  authType: z.enum(['oauth', 'app_password']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  appPassword: z.string().optional(),
});

// Update Snippet Schema
const UpdateSnippetSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  workspace: z.string().min(1, 'Workspace is required'),
  snippetId: z.string().min(1, 'Snippet ID is required'),
  title: z.string().optional(),
  description: z.string().optional(),
  files: z
    .record(
      z.object({
        content: z.string().min(1, 'File content is required'),
      })
    )
    .optional(),
  isPrivate: z.boolean().optional(),
  authType: z.enum(['oauth', 'app_password']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  appPassword: z.string().optional(),
});

// Delete Snippet Schema
const DeleteSnippetSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  workspace: z.string().min(1, 'Workspace is required'),
  snippetId: z.string().min(1, 'Snippet ID is required'),
  authType: z.enum(['oauth', 'app_password']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  appPassword: z.string().optional(),
});

export const listSnippetsTool: MCPTool = {
  name: 'mcp_bitbucket_snippet_list',
  description: 'List snippets in a Bitbucket Cloud workspace',
  inputSchema: ListSnippetsSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'listSnippets',
      serverType: ['datacenter'],
      operation: 'list_snippets',
      category: 'unknown',
    });

    try {
      logger.info('Listing snippets', {
        params: { ...(params as Record<string, unknown>), appPassword: '[REDACTED]' },
      });

      const validatedParams = ListSnippetsSchema.parse(params);
      const config = buildConfig(validatedParams);

      const queryParams: Record<string, any> = {
        page: validatedParams.page,
        pagelen: validatedParams.pagelen,
      };

      if (validatedParams.role) {
        queryParams['role'] = validatedParams.role;
      }

      const result = await bitbucketAPIService.get(
        config,
        `/2.0/snippets/${validatedParams.workspace}`,
        queryParams
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        const snippets = assertPaginatedDataResponse(result.data).data.values.map(transformSnippet);

        logger.info('Snippets listed successfully', {
          count: snippets.length,
          workspace: validatedParams.workspace,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  snippets,
                  pagination: {
                    page: validatedParams.page,
                    pagelen: validatedParams.pagelen,
                    size: assertPaginatedDataResponse(result.data).data.size,
                    next: assertPaginatedDataResponse(result.data).data.next,
                    previous: assertPaginatedDataResponse(result.data).data.previous,
                  },
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to list snippets', {
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
      logger.error('List snippets tool error', {
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
  category: 'snippet',
  operation: 'list',
};

export const getSnippetTool: MCPTool = {
  name: 'mcp_bitbucket_snippet_get',
  description: 'Get snippet details from Bitbucket Cloud',
  inputSchema: GetSnippetSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'getSnippet',
      serverType: ['datacenter'],
      operation: 'get_snippet',
      category: 'unknown',
    });

    try {
      logger.info('Getting snippet', {
        params: { ...(params as Record<string, unknown>), appPassword: '[REDACTED]' },
      });

      const validatedParams = GetSnippetSchema.parse(params);
      const config = buildConfig(validatedParams);

      const result = await bitbucketAPIService.get(
        config,
        `/2.0/snippets/${validatedParams.workspace}/${validatedParams.snippetId}`
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        const snippet = transformSnippet(assertPaginatedDataResponse(result.data).data);

        logger.info('Snippet retrieved successfully', {
          snippetId: validatedParams.snippetId,
          workspace: validatedParams.workspace,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  snippet,
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to get snippet', {
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
      logger.error('Get snippet tool error', {
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
  category: 'snippet',
  operation: 'get',
};

export const createSnippetTool: MCPTool = {
  name: 'mcp_bitbucket_snippet_create',
  description: 'Create a new snippet in Bitbucket Cloud',
  inputSchema: CreateSnippetSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'createSnippet',
      serverType: ['datacenter'],
      operation: 'create_snippet',
      category: 'unknown',
    });

    try {
      logger.info('Creating snippet', {
        params: { ...(params as Record<string, unknown>), appPassword: '[REDACTED]' },
      });

      const validatedParams = CreateSnippetSchema.parse(params);
      const config = buildConfig(validatedParams);

      const snippetData = {
        title: validatedParams.title,
        description: validatedParams.description,
        files: validatedParams.files,
        is_private: validatedParams.isPrivate,
      };

      const result = await bitbucketAPIService.post(
        config,
        `/2.0/snippets/${validatedParams.workspace}`,
        snippetData
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        const snippet = transformSnippet(assertPaginatedDataResponse(result.data).data);

        logger.info('Snippet created successfully', {
          snippetId: snippet.id,
          workspace: validatedParams.workspace,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  snippet,
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to create snippet', {
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
      logger.error('Create snippet tool error', {
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
  category: 'snippet',
  operation: 'create',
};

export const updateSnippetTool: MCPTool = {
  name: 'mcp_bitbucket_snippet_update',
  description: 'Update a snippet in Bitbucket Cloud',
  inputSchema: UpdateSnippetSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'updateSnippet',
      serverType: ['datacenter'],
      operation: 'update_snippet',
      category: 'unknown',
    });

    try {
      logger.info('Updating snippet', {
        params: { ...(params as Record<string, unknown>), appPassword: '[REDACTED]' },
      });

      const validatedParams = UpdateSnippetSchema.parse(params);
      const config = buildConfig(validatedParams);

      const snippetData: Record<string, any> = {};

      if (validatedParams.title !== undefined) {
        snippetData['title'] = validatedParams.title;
      }
      if (validatedParams.description !== undefined) {
        snippetData['description'] = validatedParams.description;
      }
      if (validatedParams.files !== undefined) {
        snippetData['files'] = validatedParams.files;
      }
      if (validatedParams.isPrivate !== undefined) {
        snippetData['is_private'] = validatedParams.isPrivate;
      }

      const result = await bitbucketAPIService.put(
        config,
        `/2.0/snippets/${validatedParams.workspace}/${validatedParams.snippetId}`,
        snippetData
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        const snippet = transformSnippet(assertPaginatedDataResponse(result.data).data);

        logger.info('Snippet updated successfully', {
          snippetId: validatedParams.snippetId,
          workspace: validatedParams.workspace,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  snippet,
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to update snippet', {
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
      logger.error('Update snippet tool error', {
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
  category: 'snippet',
  operation: 'update',
};

export const deleteSnippetTool: MCPTool = {
  name: 'mcp_bitbucket_snippet_delete',
  description: 'Delete a snippet in Bitbucket Cloud',
  inputSchema: DeleteSnippetSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'deleteSnippet',
      serverType: ['datacenter'],
      operation: 'delete_snippet',
      category: 'unknown',
    });

    try {
      logger.info('Deleting snippet', {
        params: { ...(params as Record<string, unknown>), appPassword: '[REDACTED]' },
      });

      const validatedParams = DeleteSnippetSchema.parse(params);
      const config = buildConfig(validatedParams);

      const result = await bitbucketAPIService.delete(
        config,
        `/2.0/snippets/${validatedParams.workspace}/${validatedParams.snippetId}`
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        logger.info('Snippet deleted successfully', {
          snippetId: validatedParams.snippetId,
          workspace: validatedParams.workspace,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: 'Snippet deleted successfully',
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to delete snippet', {
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
      logger.error('Delete snippet tool error', {
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
  category: 'snippet',
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

function transformSnippet(data: any): Snippet {
  return {
    type: 'snippet',
    id: data.id,
    links: {
      self: { href: data.links?.self?.href || '' },
      html: { href: data.links?.html?.href || '' },
      comments: { href: data.links?.comments?.href || '' },
      watchers: { href: data.links?.watchers?.href || '' },
      commits: { href: data.links?.commits?.href || '' },
    },
    title: data.title,
    scm: data.scm || 'git',
    is_private: data.is_private,
    owner: {
      name: data.owner?.display_name || data.owner?.username,
      id: data.owner?.uuid,
      displayName: data.owner?.display_name,
      uuid: data.owner?.uuid,
    },
    creator: data.creator || data.owner,
    created_on: data.created_on,
    updated_on: data.updated_on,
  };
}
