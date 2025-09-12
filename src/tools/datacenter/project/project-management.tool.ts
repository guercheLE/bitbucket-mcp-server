import { z } from 'zod';
import { MCPTool, ToolResult } from '@/types/mcp';
import { BitbucketConfig } from '@/types/config';
import { Project } from '@/types/datacenter';
import { configService } from '@/services/config.service';
import { bitbucketAPIService } from '@/services/bitbucket-api.service';
import { loggerService } from '@/services/logger.service';
import { assertPaginatedDataResponse } from '@/integration/api-client';

// List Projects Schema
const ListProjectsSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
  start: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(100).default(25),
});

// Get Project Schema
const GetProjectSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  projectKey: z.string().min(1, 'Project key is required'),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

// Create Project Schema
const CreateProjectSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  key: z.string().min(1).max(10, 'Project key must be 1-10 characters'),
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  avatar: z.string().optional(),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

export const listProjectsTool: MCPTool = {
  name: 'mcp_bitbucket_project_list',
  description: 'List projects in Bitbucket Data Center',
  inputSchema: ListProjectsSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'listProjects',
      serverType: ['datacenter'],
      operation: 'list_projects',
      category: 'unknown',
    });

    try {
      logger.info('Listing projects', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      const validatedParams = ListProjectsSchema.parse(params);
      const config = buildConfig(validatedParams);

      const result = await bitbucketAPIService.get(config, '/rest/api/1.0/projects', {
        start: validatedParams.start,
        limit: validatedParams.limit,
      });

      const duration = Date.now() - startTime;

      if (result.success) {
        const projects = assertPaginatedDataResponse(result.data).data.values.map(transformProject);

        logger.info('Projects listed successfully', {
          count: projects.length,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  projects,
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
        logger.warn('Failed to list projects', {
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
      logger.error('List projects tool error', {
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
  operation: 'list',
};

export const getProjectTool: MCPTool = {
  name: 'mcp_bitbucket_project_get',
  description: 'Get project details from Bitbucket Data Center',
  inputSchema: GetProjectSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'getProject',
      serverType: ['datacenter'],
      operation: 'get_project',
      category: 'unknown',
    });

    try {
      logger.info('Getting project', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      const validatedParams = GetProjectSchema.parse(params);
      const config = buildConfig(validatedParams);

      const result = await bitbucketAPIService.get(
        config,
        `/rest/api/1.0/projects/${validatedParams.projectKey}`
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        const project = transformProject(assertPaginatedDataResponse(result.data).data);

        logger.info('Project retrieved successfully', {
          projectKey: validatedParams.projectKey,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  project,
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to get project', {
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
      logger.error('Get project tool error', {
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
  operation: 'get',
};

export const createProjectTool: MCPTool = {
  name: 'mcp_bitbucket_project_create',
  description: 'Create a new project in Bitbucket Data Center',
  inputSchema: CreateProjectSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'createProject',
      serverType: ['datacenter'],
      operation: 'create_project',
      category: 'unknown',
    });

    try {
      logger.info('Creating project', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      const validatedParams = CreateProjectSchema.parse(params);
      const config = buildConfig(validatedParams);

      const projectData = {
        key: validatedParams.key,
        name: validatedParams.name,
        description: validatedParams.description,
        avatar: validatedParams.avatar,
      };

      const result = await bitbucketAPIService.post(config, '/rest/api/1.0/projects', projectData);

      const duration = Date.now() - startTime;

      if (result.success) {
        const project = transformProject(assertPaginatedDataResponse(result.data).data);

        logger.info('Project created successfully', {
          projectKey: validatedParams.key,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  project,
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to create project', {
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
      logger.error('Create project tool error', {
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
  operation: 'create',
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

function transformProject(data: any): Project {
  return {
    key: data.key,
    id: data.id,
    name: data.name,
    description: data.description,
    public: data.public,
    type: data.type || 'POST_RECEIVE',
    // links: { ... }, // Propriedade não existe no tipo
  };
}
