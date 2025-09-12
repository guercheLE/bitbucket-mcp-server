import { z } from 'zod';
import { MCPTool, ToolResult } from '@/types/mcp';
import { BitbucketConfig } from '@/types/config';
import { Project } from '@/types/datacenter';
import { configService } from '@/services/config.service';
import { bitbucketAPIService } from '@/services/bitbucket-api.service';
import { loggerService } from '@/services/logger.service';
import { assertApiDataResponse } from '@/integration/api-client';

// Update Project Schema
const UpdateProjectSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  projectKey: z.string().min(1, 'Project key is required'),
  name: z.string().min(1, 'Project name is required').optional(),
  description: z.string().optional(),
  avatar: z.string().optional(),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

// Delete Project Schema
const DeleteProjectSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  projectKey: z.string().min(1, 'Project key is required'),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

export const updateProjectTool: MCPTool = {
  name: 'mcp_bitbucket_project_update',
  description: 'Update a project in Bitbucket Data Center',
  inputSchema: UpdateProjectSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'updateProject',
      serverType: ['datacenter'],
      operation: 'update_project',
      category: 'unknown',
    });

    try {
      logger.info('Updating project', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      const validatedParams = UpdateProjectSchema.parse(params);
      const config = buildConfig(validatedParams);

      const projectData = {
        name: validatedParams.name,
        description: validatedParams.description,
        avatar: validatedParams.avatar,
      };

      const result = await bitbucketAPIService.put(
        config,
        `/rest/api/1.0/projects/${validatedParams.projectKey}`,
        projectData
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        const project = transformProject(assertApiDataResponse(result.data).data);

        logger.info('Project updated successfully', {
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
        logger.warn('Failed to update project', {
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
      logger.error('Update project tool error', {
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
  operation: 'update',
};

export const deleteProjectTool: MCPTool = {
  name: 'mcp_bitbucket_project_delete',
  description: 'Delete a project from Bitbucket Data Center',
  inputSchema: DeleteProjectSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'deleteProject',
      serverType: ['datacenter'],
      operation: 'delete_project',
      category: 'unknown',
    });

    try {
      logger.info('Deleting project', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      const validatedParams = DeleteProjectSchema.parse(params);
      const config = buildConfig(validatedParams);

      const result = await bitbucketAPIService.delete(
        config,
        `/rest/api/1.0/projects/${validatedParams.projectKey}`
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        logger.info('Project deleted successfully', {
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
                  message: 'Project deleted successfully',
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to delete project', {
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
      logger.error('Delete project tool error', {
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
  operation: 'delete',
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
