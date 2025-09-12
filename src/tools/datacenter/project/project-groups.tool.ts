import { z } from 'zod';
import { MCPTool, ToolResult } from '@/types/mcp';
import { BitbucketConfig } from '@/types/config';
import { Group } from '@/types/datacenter';
import { configService } from '@/services/config.service';
import { bitbucketAPIService } from '@/services/bitbucket-api.service';
import { loggerService } from '@/services/logger.service';
import { assertPaginatedDataResponse } from '@/integration/api-client';

// List Project Groups Schema
const ListProjectGroupsSchema = z.object({
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

// Add Project Group Schema
const AddProjectGroupSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  projectKey: z.string().min(1, 'Project key is required'),
  group: z.string().min(1, 'Group name is required'),
  permission: z.enum(['PROJECT_READ', 'PROJECT_WRITE', 'PROJECT_ADMIN']).default('PROJECT_READ'),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

// Remove Project Group Schema
const RemoveProjectGroupSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  projectKey: z.string().min(1, 'Project key is required'),
  group: z.string().min(1, 'Group name is required'),
  permission: z.enum(['PROJECT_READ', 'PROJECT_WRITE', 'PROJECT_ADMIN']).default('PROJECT_READ'),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

export const listProjectGroupsTool: MCPTool = {
  name: 'mcp_bitbucket_project_list_groups',
  description: 'List groups in a project from Bitbucket Data Center',
  inputSchema: ListProjectGroupsSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'listProjectGroups',
      serverType: ['datacenter'],
      operation: 'list_project_groups',
      category: 'unknown',
    });

    try {
      logger.info('Listing project groups', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      const validatedParams = ListProjectGroupsSchema.parse(params);
      const config = buildConfig(validatedParams);

      const result = await bitbucketAPIService.get(
        config,
        `/rest/api/1.0/projects/${validatedParams.projectKey}/groups`,
        {
          start: validatedParams.start,
          limit: validatedParams.limit,
        }
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        const groups = assertPaginatedDataResponse(result.data).data.values.map(transformGroup);

        logger.info('Project groups listed successfully', {
          projectKey: validatedParams.projectKey,
          count: groups.length,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  groups,
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
        logger.warn('Failed to list project groups', {
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
      logger.error('List project groups tool error', {
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
  operation: 'list_groups',
};

export const addProjectGroupTool: MCPTool = {
  name: 'mcp_bitbucket_project_add_group',
  description: 'Add a group to a project in Bitbucket Data Center',
  inputSchema: AddProjectGroupSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'addProjectGroup',
      serverType: ['datacenter'],
      operation: 'add_project_group',
      category: 'unknown',
    });

    try {
      logger.info('Adding project group', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      const validatedParams = AddProjectGroupSchema.parse(params);
      const config = buildConfig(validatedParams);

      const groupData = {
        group: validatedParams.group,
        permission: validatedParams.permission,
      };

      const result = await bitbucketAPIService.put(
        config,
        `/rest/api/1.0/projects/${validatedParams.projectKey}/groups`,
        groupData
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        logger.info('Project group added successfully', {
          projectKey: validatedParams.projectKey,
          group: validatedParams.group,
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
                  message: 'Group added successfully',
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to add project group', {
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
      logger.error('Add project group tool error', {
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
  operation: 'add_group',
};

export const removeProjectGroupTool: MCPTool = {
  name: 'mcp_bitbucket_project_remove_group',
  description: 'Remove a group from a project in Bitbucket Data Center',
  inputSchema: RemoveProjectGroupSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'removeProjectGroup',
      serverType: ['datacenter'],
      operation: 'remove_project_group',
      category: 'unknown',
    });

    try {
      logger.info('Removing project group', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      const validatedParams = RemoveProjectGroupSchema.parse(params);
      const config = buildConfig(validatedParams);

      const endpoint = `/rest/api/1.0/projects/${validatedParams.projectKey}/groups?group=${validatedParams.group}&permission=${validatedParams.permission}`;
      const result = await bitbucketAPIService.delete(config, endpoint);

      const duration = Date.now() - startTime;

      if (result.success) {
        logger.info('Project group removed successfully', {
          projectKey: validatedParams.projectKey,
          group: validatedParams.group,
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
                  message: 'Group removed successfully',
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to remove project group', {
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
      logger.error('Remove project group tool error', {
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
  operation: 'remove_group',
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

function transformGroup(data: any): Group {
  return {
    name: data.name,
    active: true, // Default value for active
    description: data.description,
  };
}
