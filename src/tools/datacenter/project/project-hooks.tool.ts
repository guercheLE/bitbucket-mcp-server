import { z } from 'zod';
import { MCPTool, ToolResult } from '@/types/mcp';
import { BitbucketConfig } from '@/types/config';
import { Hook } from '@/types/datacenter';
import { configService } from '@/services/config.service';
import { bitbucketAPIService } from '@/services/bitbucket-api.service';
import { loggerService } from '@/services/logger.service';
import { assertApiDataResponse } from '@/integration/api-client';

// Get Project Hooks Schema
const GetProjectHooksSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  projectKey: z.string().min(1, 'Project key is required'),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

// Create Project Hook Schema
const CreateProjectHookSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  projectKey: z.string().min(1, 'Project key is required'),
  name: z.string().min(1, 'Hook name is required'),
  url: z.string().url('Hook URL must be a valid URL'),
  events: z.array(z.string()).min(1, 'At least one event is required'),
  active: z.boolean().default(true),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

// Get Project Hook Schema
const GetProjectHookSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  projectKey: z.string().min(1, 'Project key is required'),
  hookId: z.number().int().positive('Hook ID must be positive'),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

// Update Project Hook Schema
const UpdateProjectHookSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  projectKey: z.string().min(1, 'Project key is required'),
  hookId: z.number().int().positive('Hook ID must be positive'),
  name: z.string().min(1, 'Hook name is required').optional(),
  url: z.string().url('Hook URL must be a valid URL').optional(),
  events: z.array(z.string()).min(1, 'At least one event is required').optional(),
  active: z.boolean().optional(),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

// Delete Project Hook Schema
const DeleteProjectHookSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  projectKey: z.string().min(1, 'Project key is required'),
  hookId: z.number().int().positive('Hook ID must be positive'),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

export const getProjectHooksTool: MCPTool = {
  name: 'mcp_bitbucket_project_get_hooks',
  description: 'Get project hooks from Bitbucket Data Center',
  inputSchema: GetProjectHooksSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'getProjectHooks',
      serverType: ['datacenter'],
      operation: 'get_project_hooks',
      category: 'unknown',
    });

    try {
      logger.info('Getting project hooks', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      const validatedParams = GetProjectHooksSchema.parse(params);
      const config = buildConfig(validatedParams);

      const result = await bitbucketAPIService.get(
        config,
        `/rest/api/1.0/projects/${validatedParams.projectKey}/hooks`
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        const responseData = assertApiDataResponse(result.data) as any;
        const hooks = responseData.data.values.map(transformHook);

        logger.info('Project hooks retrieved successfully', {
          projectKey: validatedParams.projectKey,
          count: hooks.length,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  hooks,
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to get project hooks', {
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
      logger.error('Get project hooks tool error', {
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
  serverType: ['datacenter'],

  category: 'project',
  operation: 'get_hooks',
};

export const createProjectHookTool: MCPTool = {
  name: 'mcp_bitbucket_project_create_hook',
  description: 'Create a new project hook in Bitbucket Data Center',
  inputSchema: CreateProjectHookSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'createProjectHook',
      serverType: ['datacenter'],
      operation: 'create_project_hook',
      category: 'unknown',
    });

    try {
      logger.info('Creating project hook', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      const validatedParams = CreateProjectHookSchema.parse(params);
      const config = buildConfig(validatedParams);

      const hookData = {
        name: validatedParams.name,
        url: validatedParams.url,
        events: validatedParams.events,
        active: validatedParams.active,
      };

      const result = await bitbucketAPIService.post(
        config,
        `/rest/api/1.0/projects/${validatedParams.projectKey}/hooks`,
        hookData
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        const hook = transformHook(assertApiDataResponse(result.data).data);

        logger.info('Project hook created successfully', {
          projectKey: validatedParams.projectKey,
          hookId: hook.id,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  hook,
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to create project hook', {
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
      logger.error('Create project hook tool error', {
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
  serverType: ['datacenter'],

  category: 'project',
  operation: 'create_hook',
};

export const getProjectHookTool: MCPTool = {
  name: 'mcp_bitbucket_project_get_hook',
  description: 'Get a specific project hook from Bitbucket Data Center',
  inputSchema: GetProjectHookSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'getProjectHook',
      serverType: ['datacenter'],
      operation: 'get_project_hook',
      category: 'unknown',
    });

    try {
      logger.info('Getting project hook', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      const validatedParams = GetProjectHookSchema.parse(params);
      const config = buildConfig(validatedParams);

      const result = await bitbucketAPIService.get(
        config,
        `/rest/api/1.0/projects/${validatedParams.projectKey}/hooks/${validatedParams.hookId}`
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        const hook = transformHook(assertApiDataResponse(result.data).data);

        logger.info('Project hook retrieved successfully', {
          projectKey: validatedParams.projectKey,
          hookId: validatedParams.hookId,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  hook,
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to get project hook', {
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
      logger.error('Get project hook tool error', {
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
  serverType: ['datacenter'],

  category: 'project',
  operation: 'get_hook',
};

export const updateProjectHookTool: MCPTool = {
  name: 'mcp_bitbucket_project_update_hook',
  description: 'Update a project hook in Bitbucket Data Center',
  inputSchema: UpdateProjectHookSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'updateProjectHook',
      serverType: ['datacenter'],
      operation: 'update_project_hook',
      category: 'unknown',
    });

    try {
      logger.info('Updating project hook', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      const validatedParams = UpdateProjectHookSchema.parse(params);
      const config = buildConfig(validatedParams);

      const hookData = {
        name: validatedParams.name,
        url: validatedParams.url,
        events: validatedParams.events,
        active: validatedParams.active,
      };

      const result = await bitbucketAPIService.put(
        config,
        `/rest/api/1.0/projects/${validatedParams.projectKey}/hooks/${validatedParams.hookId}`,
        hookData
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        const hook = transformHook(assertApiDataResponse(result.data).data);

        logger.info('Project hook updated successfully', {
          projectKey: validatedParams.projectKey,
          hookId: validatedParams.hookId,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  hook,
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to update project hook', {
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
      logger.error('Update project hook tool error', {
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
  serverType: ['datacenter'],

  category: 'project',
  operation: 'update_hook',
};

export const deleteProjectHookTool: MCPTool = {
  name: 'mcp_bitbucket_project_delete_hook',
  description: 'Delete a project hook from Bitbucket Data Center',
  inputSchema: DeleteProjectHookSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'deleteProjectHook',
      serverType: ['datacenter'],
      operation: 'delete_project_hook',
      category: 'unknown',
    });

    try {
      logger.info('Deleting project hook', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      const validatedParams = DeleteProjectHookSchema.parse(params);
      const config = buildConfig(validatedParams);

      const result = await bitbucketAPIService.delete(
        config,
        `/rest/api/1.0/projects/${validatedParams.projectKey}/hooks/${validatedParams.hookId}`
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        logger.info('Project hook deleted successfully', {
          projectKey: validatedParams.projectKey,
          hookId: validatedParams.hookId,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: 'Hook deleted successfully',
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to delete project hook', {
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
      logger.error('Delete project hook tool error', {
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
  serverType: ['datacenter'],

  category: 'project',
  operation: 'delete_hook',
};

function buildConfig(params: any): BitbucketConfig {
  let authConfig;

  if (params.authType === 'oauth') {
    authConfig = {
      type: 'oauth' as const,
      credentials: {
        clientId: 'dummy',
        clientSecret: 'dummy',
        tokenType: 'Bearer',
      },
    };
  } else if (params.authType === 'api_token') {
    authConfig = {
      type: 'api_token' as const,
      credentials: {
        username: params.username || '',
        token: params.token || '',
      },
    };
  } else {
    authConfig = {
      type: 'basic' as const,
      credentials: {
        username: params.username || '',
        password: params.password || '',
      },
    };
  }

  return {
    baseUrl: params.serverUrl,
    serverType: 'datacenter' as const,
    auth: authConfig,
    timeouts: configService.getTimeoutConfig(),
    rateLimit: configService.getRateLimitConfig(),
  };
}

function transformHook(data: any): Hook {
  return {
    id: data.id,
    name: data.name,
    type: data.type || 'POST_RECEIVE',
    scope: data.scope || 'REPOSITORY',
    enabled: data.enabled || true,
    configured: data.configured || false,
    events: data.events || [],
  };
}
