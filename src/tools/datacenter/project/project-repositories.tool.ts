import { z } from 'zod';
import { MCPTool, ToolResult } from '@/types/mcp';
import { BitbucketConfig } from '@/types/config';
import { Repository } from '@/types/bitbucket';
import { configService } from '@/services/config.service';
import { bitbucketAPIService } from '@/services/bitbucket-api.service';
import { loggerService } from '@/services/logger.service';
import { assertPaginatedDataResponse } from '@/integration/api-client';

// List Project Repositories Schema
const ListProjectRepositoriesSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  projectKey: z.string().min(1, 'Project key is required'),
  start: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(100).default(25),
  name: z.string().optional(),
  permission: z.string().optional(),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

export const listProjectRepositoriesTool: MCPTool = {
  name: 'mcp_bitbucket_project_list_repositories',
  description: 'List repositories in a project from Bitbucket Data Center',
  inputSchema: ListProjectRepositoriesSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'listProjectRepositories',
      serverType: ['datacenter'],
      operation: 'list_project_repositories',
      category: 'unknown',
    });

    try {
      logger.info('Listing project repositories', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      const validatedParams = ListProjectRepositoriesSchema.parse(params);
      const config = buildConfig(validatedParams);

      const queryParams: any = {
        start: validatedParams.start,
        limit: validatedParams.limit,
      };

      if (validatedParams.name) {
        queryParams['name'] = validatedParams.name;
      }

      if (validatedParams.permission) {
        queryParams.permission = validatedParams.permission;
      }

      const result = await bitbucketAPIService.get(
        config,
        `/rest/api/1.0/projects/${validatedParams.projectKey}/repos`,
        queryParams
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        const repositories = assertPaginatedDataResponse(result.data).data.values.map(
          transformRepository
        );

        logger.info('Project repositories listed successfully', {
          projectKey: validatedParams.projectKey,
          count: repositories.length,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  repositories,
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
        logger.warn('Failed to list project repositories', {
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
      logger.error('List project repositories tool error', {
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
  operation: 'list_repositories',
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

function transformRepository(data: any): Repository {
  return {
    id: data.id || data.uuid,
    name: data.name,
    description: data.description,
    isPrivate: data.isPrivate,
    project: data.project,
    scmId: data.scmId || 'git',
  };
}
