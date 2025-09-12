import { z } from 'zod';
import { MCPTool, ToolResult } from '@/types/mcp';
import { BitbucketConfig } from '@/types/config';
import { Permission } from '@/types/datacenter';
import { configService } from '@/services/config.service';
import { bitbucketAPIService } from '@/services/bitbucket-api.service';
import { loggerService } from '@/services/logger.service';
import { assertApiDataResponse } from '@/integration/api-client';

// Get Project Permissions Schema
const GetProjectPermissionsSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  projectKey: z.string().min(1, 'Project key is required'),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

// Add Project Permission Schema
const AddProjectPermissionSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  projectKey: z.string().min(1, 'Project key is required'),
  user: z.string().optional(),
  group: z.string().optional(),
  permission: z.enum(['PROJECT_READ', 'PROJECT_WRITE', 'PROJECT_ADMIN']).default('PROJECT_READ'),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

// Remove Project Permission Schema
const RemoveProjectPermissionSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  projectKey: z.string().min(1, 'Project key is required'),
  user: z.string().optional(),
  group: z.string().optional(),
  permission: z.enum(['PROJECT_READ', 'PROJECT_WRITE', 'PROJECT_ADMIN']).default('PROJECT_READ'),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

export const getProjectPermissionsTool: MCPTool = {
  name: 'mcp_bitbucket_project_get_permissions',
  description: 'Get project permissions from Bitbucket Data Center',
  inputSchema: GetProjectPermissionsSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'getProjectPermissions',
      serverType: ['datacenter'],
      operation: 'get_project_permissions',
      category: 'unknown',
    });

    try {
      logger.info('Getting project permissions', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      const validatedParams = GetProjectPermissionsSchema.parse(params);
      const config = buildConfig(validatedParams);

      const result = await bitbucketAPIService.get(
        config,
        `/rest/api/1.0/projects/${validatedParams.projectKey}/permissions`
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        const responseData = assertApiDataResponse(result.data) as any;
        const permissions = responseData.data.values.map(transformPermission);

        logger.info('Project permissions retrieved successfully', {
          projectKey: validatedParams.projectKey,
          count: permissions.length,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  permissions,
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to get project permissions', {
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
      logger.error('Get project permissions tool error', {
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
  operation: 'get_permissions',
};

export const addProjectPermissionTool: MCPTool = {
  name: 'mcp_bitbucket_project_add_permission',
  description: 'Add permission to a project in Bitbucket Data Center',
  inputSchema: AddProjectPermissionSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'addProjectPermission',
      serverType: ['datacenter'],
      operation: 'add_project_permission',
      category: 'unknown',
    });

    try {
      logger.info('Adding project permission', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      const validatedParams = AddProjectPermissionSchema.parse(params);
      const config = buildConfig(validatedParams);

      const permissionData = {
        user: validatedParams.user,
        group: validatedParams.group,
        permission: validatedParams.permission,
      };

      const result = await bitbucketAPIService.put(
        config,
        `/rest/api/1.0/projects/${validatedParams.projectKey}/permissions`,
        permissionData
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        logger.info('Project permission added successfully', {
          projectKey: validatedParams.projectKey,
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
                  message: 'Permission added successfully',
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to add project permission', {
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
      logger.error('Add project permission tool error', {
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
  operation: 'add_permission',
};

export const removeProjectPermissionTool: MCPTool = {
  name: 'mcp_bitbucket_project_remove_permission',
  description: 'Remove permission from a project in Bitbucket Data Center',
  inputSchema: RemoveProjectPermissionSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'removeProjectPermission',
      serverType: ['datacenter'],
      operation: 'remove_project_permission',
      category: 'unknown',
    });

    try {
      logger.info('Removing project permission', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      const validatedParams = RemoveProjectPermissionSchema.parse(params);
      const config = buildConfig(validatedParams);

      const queryParams = new URLSearchParams();
      if (validatedParams.user) queryParams.append('user', validatedParams.user);
      if (validatedParams.group) queryParams.append('group', validatedParams.group);
      queryParams.append('permission', validatedParams.permission);

      const endpoint = `/rest/api/1.0/projects/${validatedParams.projectKey}/permissions?${queryParams.toString()}`;
      const result = await bitbucketAPIService.delete(config, endpoint);

      const duration = Date.now() - startTime;

      if (result.success) {
        logger.info('Project permission removed successfully', {
          projectKey: validatedParams.projectKey,
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
                  message: 'Permission removed successfully',
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to remove project permission', {
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
      logger.error('Remove project permission tool error', {
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
  operation: 'remove_permission',
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

function transformPermission(data: any): Permission {
  return {
    user: data.user,
    group: data.group,
    permission: data.permission,
  };
}
