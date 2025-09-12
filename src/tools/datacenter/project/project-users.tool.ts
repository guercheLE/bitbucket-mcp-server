import { z } from 'zod';
import { MCPTool, ToolResult } from '@/types/mcp';
import { BitbucketConfig } from '@/types/config';
import { User } from '@/types/bitbucket';
import { configService } from '@/services/config.service';
import { bitbucketAPIService } from '@/services/bitbucket-api.service';
import { loggerService } from '@/services/logger.service';
import { assertPaginatedDataResponse } from '@/integration/api-client';

// List Project Users Schema
const ListProjectUsersSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  projectKey: z.string().min(1, 'Project key is required'),
  start: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(100).default(25),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

// Add Project User Schema
const AddProjectUserSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  projectKey: z.string().min(1, 'Project key is required'),
  user: z.string().min(1, 'Username is required'),
  permission: z.enum(['PROJECT_READ', 'PROJECT_WRITE', 'PROJECT_ADMIN']).default('PROJECT_READ'),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

// Remove Project User Schema
const RemoveProjectUserSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  projectKey: z.string().min(1, 'Project key is required'),
  user: z.string().min(1, 'Username is required'),
  permission: z.enum(['PROJECT_READ', 'PROJECT_WRITE', 'PROJECT_ADMIN']).default('PROJECT_READ'),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

export const listProjectUsersTool: MCPTool = {
  name: 'mcp_bitbucket_project_list_users',
  description: 'List users in a project from Bitbucket Data Center',
  inputSchema: ListProjectUsersSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'listProjectUsers',
      serverType: ['datacenter'],
      operation: 'list_project_users',
      category: 'unknown',
    });

    try {
      logger.info('Listing project users', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      const validatedParams = ListProjectUsersSchema.parse(params);
      const config = buildConfig(validatedParams);

      const result = await bitbucketAPIService.get(
        config,
        `/rest/api/1.0/projects/${validatedParams.projectKey}/users`,
        {
          start: validatedParams.start,
          limit: validatedParams.limit,
        }
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        const users = assertPaginatedDataResponse(result.data).data.values.map(transformUser);

        logger.info('Project users listed successfully', {
          projectKey: validatedParams.projectKey,
          count: users.length,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  users,
                  pagination: {
                    start: validatedParams.start,
                    limit: validatedParams.limit,
                    size: assertPaginatedDataResponse(result.data).data.size,
                    isLastPage: assertPaginatedDataResponse(result.data).data.isLastPage,
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
        logger.warn('Failed to list project users', {
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
      logger.error('List project users tool error', {
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
  operation: 'list_users',
};

export const addProjectUserTool: MCPTool = {
  name: 'mcp_bitbucket_project_add_user',
  description: 'Add a user to a project in Bitbucket Data Center',
  inputSchema: AddProjectUserSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'addProjectUser',
      serverType: ['datacenter'],
      operation: 'add_project_user',
      category: 'unknown',
    });

    try {
      logger.info('Adding project user', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      const validatedParams = AddProjectUserSchema.parse(params);
      const config = buildConfig(validatedParams);

      const userData = {
        user: validatedParams.user,
        permission: validatedParams.permission,
      };

      const result = await bitbucketAPIService.put(
        config,
        `/rest/api/1.0/projects/${validatedParams.projectKey}/users`,
        userData
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        logger.info('Project user added successfully', {
          projectKey: validatedParams.projectKey,
          user: validatedParams.user,
          permission: validatedParams.permission,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: 'User added successfully',
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to add project user', {
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
      logger.error('Add project user tool error', {
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
  operation: 'add_user',
};

export const removeProjectUserTool: MCPTool = {
  name: 'mcp_bitbucket_project_remove_user',
  description: 'Remove a user from a project in Bitbucket Data Center',
  inputSchema: RemoveProjectUserSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'removeProjectUser',
      serverType: ['datacenter'],
      operation: 'remove_project_user',
      category: 'unknown',
    });

    try {
      logger.info('Removing project user', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      const validatedParams = RemoveProjectUserSchema.parse(params);
      const config = buildConfig(validatedParams);

      const endpoint = `/rest/api/1.0/projects/${validatedParams.projectKey}/users?user=${validatedParams.user}&permission=${validatedParams.permission}`;
      const result = await bitbucketAPIService.delete(config, endpoint);

      const duration = Date.now() - startTime;

      if (result.success) {
        logger.info('Project user removed successfully', {
          projectKey: validatedParams.projectKey,
          user: validatedParams.user,
          permission: validatedParams.permission,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: 'User removed successfully',
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to remove project user', {
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
      logger.error('Remove project user tool error', {
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
  operation: 'remove_user',
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

function transformUser(data: any): User {
  return {
    id: data.id || data.uuid,
    name: data.name || data.username || data.displayName,
    displayName: data.displayName,
    emailAddress: data.emailAddress,
    accountStatus: data.accountStatus,
  };
}
