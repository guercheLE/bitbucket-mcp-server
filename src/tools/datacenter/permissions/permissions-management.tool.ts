import { z } from 'zod';
import { MCPTool, ToolResult } from '@/types/mcp';
import { BitbucketConfig } from '@/types/config';
import { Group, Permission } from '@/types/datacenter';
import { configService } from '@/services/config.service';
import { bitbucketAPIService } from '@/services/bitbucket-api.service';
import { loggerService } from '@/services/logger.service';
import { assertApiResponse } from '@/integration/api-client';

// List Groups Schema
const ListGroupsSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
  start: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(100).default(25),
  filter: z.string().optional(),
});

// Get Group Schema
const GetGroupSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  groupName: z.string().min(1, 'Group name is required'),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

// Create Group Schema
const CreateGroupSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  name: z.string().min(1, 'Group name is required'),
  description: z.string().optional(),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

// Update Group Schema
const UpdateGroupSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  groupName: z.string().min(1, 'Group name is required'),
  name: z.string().optional(),
  description: z.string().optional(),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

// Delete Group Schema
const DeleteGroupSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  groupName: z.string().min(1, 'Group name is required'),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

// List Project Permissions Schema
const ListProjectPermissionsSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  projectKey: z.string().min(1, 'Project key is required'),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
  start: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(100).default(25),
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

export const listGroupsTool: MCPTool = {
  name: 'mcp_bitbucket_permissions_list_groups',
  description: 'List groups in Bitbucket Data Center',
  inputSchema: ListGroupsSchema.shape,
  serverType: ['datacenter'],
  category: 'permissions',
  operation: 'list',
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'listGroups',
      serverType: ['datacenter'],
      operation: 'list_groups',
      category: 'unknown',
    });

    try {
      logger.info('Starting group list operation', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      // Validate input parameters
      const validatedParams = ListGroupsSchema.parse(params);

      // Build configuration
      const config: BitbucketConfig = buildConfig(validatedParams);

      // Build query parameters
      const queryParams: Record<string, string> = {
        start: validatedParams.start.toString(),
        limit: validatedParams.limit.toString(),
      };

      if (validatedParams.filter) {
        queryParams['filter'] = validatedParams.filter;
      }

      // Make API call
      const response = await bitbucketAPIService.get(
        config,
        '/rest/api/1.0/admin/groups',
        queryParams
      );

      // Transform response
      const responseData = assertApiResponse(response.data) as any;
      const groups = responseData.values?.map(transformGroup) || [];

      const duration = Date.now() - startTime;
      logger.info('Group list operation completed', {
        count: groups.length,
        duration,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                groups,
                size: responseData.size,
                isLastPage: responseData.isLastPage,
                nextPageStart: responseData.nextPageStart,
              },
              null,
              2
            ),
          },
        ],
        isError: false,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Group list operation failed', { error, duration });

      return {
        content: [
          {
            type: 'text',
            text: `Erro: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
};

export const getGroupTool: MCPTool = {
  name: 'mcp_bitbucket_permissions_get_group',
  description: 'Get a specific group from Bitbucket Data Center',
  inputSchema: GetGroupSchema.shape,
  serverType: ['datacenter'],
  category: 'permissions',
  operation: 'get',
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'getGroup',
      serverType: ['datacenter'],
      operation: 'get_group',
      category: 'unknown',
    });

    try {
      logger.info('Starting group get operation', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      // Validate input parameters
      const validatedParams = GetGroupSchema.parse(params);

      // Build configuration
      const config: BitbucketConfig = buildConfig(validatedParams);

      // Make API call
      const response = await bitbucketAPIService.get(
        config,
        `/rest/api/1.0/admin/groups/${validatedParams.groupName}`
      );

      // Transform response
      const group = transformGroup(assertApiResponse(response.data));

      const duration = Date.now() - startTime;
      logger.info('Group get operation completed', {
        groupName: validatedParams.groupName,
        duration,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(group, null, 2),
          },
        ],
        isError: false,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Group get operation failed', { error, duration });

      return {
        content: [
          {
            type: 'text',
            text: `Erro: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
};

export const createGroupTool: MCPTool = {
  name: 'mcp_bitbucket_permissions_create_group',
  description: 'Create a new group in Bitbucket Data Center',
  inputSchema: CreateGroupSchema.shape,
  serverType: ['datacenter'],
  category: 'permissions',
  operation: 'create',
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'createGroup',
      serverType: ['datacenter'],
      operation: 'create_group',
      category: 'unknown',
    });

    try {
      logger.info('Starting group create operation', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      // Validate input parameters
      const validatedParams = CreateGroupSchema.parse(params);

      // Build configuration
      const config: BitbucketConfig = buildConfig(validatedParams);

      // Build request body
      const requestBody = {
        name: validatedParams.name,
        description: validatedParams.description,
      };

      // Make API call
      const response = await bitbucketAPIService.post(
        config,
        '/rest/api/1.0/admin/groups',
        requestBody
      );

      // Transform response
      const group = transformGroup(assertApiResponse(response.data));

      const duration = Date.now() - startTime;
      logger.info('Group create operation completed', {
        groupName: group.name,
        duration,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(group, null, 2),
          },
        ],
        isError: false,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Group create operation failed', { error, duration });

      return {
        content: [
          {
            type: 'text',
            text: `Erro: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
};

export const updateGroupTool: MCPTool = {
  name: 'mcp_bitbucket_permissions_update_group',
  description: 'Update a group in Bitbucket Data Center',
  inputSchema: UpdateGroupSchema.shape,
  serverType: ['datacenter'],
  category: 'permissions',
  operation: 'update',
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'updateGroup',
      serverType: ['datacenter'],
      operation: 'update_group',
      category: 'unknown',
    });

    try {
      logger.info('Starting group update operation', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      // Validate input parameters
      const validatedParams = UpdateGroupSchema.parse(params);

      // Build configuration
      const config: BitbucketConfig = buildConfig(validatedParams);

      // Build request body
      const requestBody: Record<string, any> = {};

      if (validatedParams.name !== undefined) {
        requestBody['name'] = validatedParams.name;
      }

      if (validatedParams.description !== undefined) {
        requestBody['description'] = validatedParams.description;
      }

      // Make API call
      const response = await bitbucketAPIService.put(
        config,
        `/rest/api/1.0/admin/groups/${validatedParams.groupName}`,
        requestBody
      );

      // Transform response
      const group = transformGroup(assertApiResponse(response.data));

      const duration = Date.now() - startTime;
      logger.info('Group update operation completed', {
        groupName: validatedParams.groupName,
        duration,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(group, null, 2),
          },
        ],
        isError: false,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Group update operation failed', { error, duration });

      return {
        content: [
          {
            type: 'text',
            text: `Erro: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
};

export const deleteGroupTool: MCPTool = {
  name: 'mcp_bitbucket_permissions_delete_group',
  description: 'Delete a group from Bitbucket Data Center',
  inputSchema: DeleteGroupSchema.shape,
  serverType: ['datacenter'],
  category: 'permissions',
  operation: 'delete',
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'deleteGroup',
      serverType: ['datacenter'],
      operation: 'delete_group',
      category: 'unknown',
    });

    try {
      logger.info('Starting group delete operation', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      // Validate input parameters
      const validatedParams = DeleteGroupSchema.parse(params);

      // Build configuration
      const config: BitbucketConfig = buildConfig(validatedParams);

      // Make API call
      await bitbucketAPIService.delete(
        config,
        `/rest/api/1.0/admin/groups/${validatedParams.groupName}`
      );

      const duration = Date.now() - startTime;
      logger.info('Group delete operation completed', {
        groupName: validatedParams.groupName,
        duration,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                message: 'Group deleted successfully',
                groupName: validatedParams.groupName,
              },
              null,
              2
            ),
          },
        ],
        isError: false,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Group delete operation failed', { error, duration });

      return {
        content: [
          {
            type: 'text',
            text: `Erro: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
};

export const listProjectPermissionsTool: MCPTool = {
  name: 'mcp_bitbucket_permissions_list_project_permissions',
  description: 'List project permissions in Bitbucket Data Center',
  inputSchema: ListProjectPermissionsSchema.shape,
  serverType: ['datacenter'],
  category: 'permissions',
  operation: 'list',
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'listProjectPermissions',
      serverType: ['datacenter'],
      operation: 'list_project_permissions',
      category: 'unknown',
    });

    try {
      logger.info('Starting project permissions list operation', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      // Validate input parameters
      const validatedParams = ListProjectPermissionsSchema.parse(params);

      // Build configuration
      const config: BitbucketConfig = buildConfig(validatedParams);

      // Build query parameters
      const queryParams: Record<string, string> = {
        start: validatedParams.start.toString(),
        limit: validatedParams.limit.toString(),
      };

      // Make API call
      const response = await bitbucketAPIService.get(
        config,
        `/rest/api/1.0/projects/${validatedParams.projectKey}/permissions`,
        queryParams
      );

      // Transform response
      const responseData = assertApiResponse(response.data) as any;
      const permissions = responseData.values?.map(transformPermission) || [];

      const duration = Date.now() - startTime;
      logger.info('Project permissions list operation completed', {
        count: permissions.length,
        duration,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                permissions,
                size: responseData.size,
                isLastPage: responseData.isLastPage,
                nextPageStart: responseData.nextPageStart,
              },
              null,
              2
            ),
          },
        ],
        isError: false,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Project permissions list operation failed', { error, duration });

      return {
        content: [
          {
            type: 'text',
            text: `Erro: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
};

export const addProjectPermissionTool: MCPTool = {
  name: 'mcp_bitbucket_permissions_add_project_permission',
  description: 'Add a project permission in Bitbucket Data Center',
  inputSchema: AddProjectPermissionSchema.shape,
  serverType: ['datacenter'],
  category: 'permissions',
  operation: 'create',
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'addProjectPermission',
      serverType: ['datacenter'],
      operation: 'add_project_permission',
      category: 'unknown',
    });

    try {
      logger.info('Starting project permission add operation', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      // Validate input parameters
      const validatedParams = AddProjectPermissionSchema.parse(params);

      // Build configuration
      const config: BitbucketConfig = buildConfig(validatedParams);

      // Build request body
      const requestBody: Record<string, any> = {
        permission: validatedParams.permission,
      };

      if (validatedParams.user) {
        requestBody['user'] = { name: validatedParams.user };
      }

      if (validatedParams.group) {
        requestBody['group'] = { name: validatedParams.group };
      }

      // Make API call
      const response = await bitbucketAPIService.put(
        config,
        `/rest/api/1.0/projects/${validatedParams.projectKey}/permissions`,
        requestBody
      );

      // Transform response
      const permission = transformPermission(assertApiResponse(response.data));

      const duration = Date.now() - startTime;
      logger.info('Project permission add operation completed', {
        projectKey: validatedParams.projectKey,
        duration,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(permission, null, 2),
          },
        ],
        isError: false,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Project permission add operation failed', { error, duration });

      return {
        content: [
          {
            type: 'text',
            text: `Erro: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
};

export const removeProjectPermissionTool: MCPTool = {
  name: 'mcp_bitbucket_permissions_remove_project_permission',
  description: 'Remove a project permission in Bitbucket Data Center',
  inputSchema: RemoveProjectPermissionSchema.shape,
  serverType: ['datacenter'],
  category: 'permissions',
  operation: 'delete',
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'removeProjectPermission',
      serverType: ['datacenter'],
      operation: 'remove_project_permission',
      category: 'unknown',
    });

    try {
      logger.info('Starting project permission remove operation', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      // Validate input parameters
      const validatedParams = RemoveProjectPermissionSchema.parse(params);

      // Build configuration
      const config: BitbucketConfig = buildConfig(validatedParams);

      // Build query parameters
      const queryParams: Record<string, string> = {
        permission: validatedParams.permission,
      };

      if (validatedParams.user) {
        queryParams['user'] = validatedParams.user;
      }

      if (validatedParams.group) {
        queryParams['group'] = validatedParams.group;
      }

      // Make API call
      const endpoint = `/rest/api/1.0/projects/${validatedParams.projectKey}/permissions?${new URLSearchParams(queryParams).toString()}`;
      await bitbucketAPIService.delete(config, endpoint);

      const duration = Date.now() - startTime;
      logger.info('Project permission remove operation completed', {
        projectKey: validatedParams.projectKey,
        duration,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                message: 'Project permission removed successfully',
                projectKey: validatedParams.projectKey,
                permission: validatedParams.permission,
              },
              null,
              2
            ),
          },
        ],
        isError: false,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Project permission remove operation failed', { error, duration });

      return {
        content: [
          {
            type: 'text',
            text: `Erro: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
};

// Helper function to build BitbucketConfig
function buildConfig(params: any): BitbucketConfig {
  const baseConfig = {
    baseUrl: params.serverUrl,
    serverType: 'datacenter' as const,
    timeouts: configService.getTimeoutConfig(),
    rateLimit: configService.getRateLimitConfig(),
  };

  if (params.authType === 'oauth') {
    return {
      ...baseConfig,
      auth: {
        type: 'oauth',
        credentials: {
          clientId: params.clientId || '',
          clientSecret: params.clientSecret || '',
          tokenType: 'Bearer',
          accessToken: params.accessToken,
        },
      },
    };
  } else if (params.authType === 'api_token') {
    return {
      ...baseConfig,
      auth: {
        type: 'api_token',
        credentials: {
          username: params.username || '',
          token: params.token || '',
        },
      },
    };
  } else {
    return {
      ...baseConfig,
      auth: {
        type: 'basic',
        credentials: {
          username: params.username || '',
          password: params.password || '',
        },
      },
    };
  }
}

// Helper function to transform group data
function transformGroup(data: any): Group {
  return {
    name: data.name,
    active: data.active ?? true,
    description: data.description,
    memberCount: data.memberCount || 0,
  };
}

// Helper function to transform permission data
function transformPermission(data: any): Permission {
  return {
    user: data.user
      ? {
          name: data.user.displayName || data.user.name,
          id: data.user.id,
          displayName: data.user.displayName,
          uuid: data.user.id,
        }
      : undefined,
    group: data.group
      ? {
          name: data.group.name,
          active: data.group.active ?? true,
          description: data.group.description,
          memberCount: data.group.memberCount || 0,
        }
      : undefined,
    permission: data.permission,
  };
}
