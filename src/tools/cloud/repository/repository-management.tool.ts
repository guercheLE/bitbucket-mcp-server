import { z } from 'zod';
import { MCPTool, ToolResult } from '@/types/mcp';
import { Repository } from '@/types/bitbucket';
import { bitbucketAPIService } from '@/services/bitbucket-api.service';
import { loggerService } from '@/services/logger.service';
import { buildConfig } from '@/utils/config-builder';
import { assertPaginatedDataResponse } from '@/integration/api-client';

// List Repositories Schema
const ListRepositoriesSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  workspace: z.string().min(1, 'Workspace is required'),
  authType: z.enum(['oauth', 'app_password']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  appPassword: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pagelen: z.number().int().min(1).max(100).default(50),
});

// Get Repository Schema
const GetRepositorySchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  workspace: z.string().min(1, 'Workspace is required'),
  repo: z.string().min(1, 'Repository name is required'),
  authType: z.enum(['oauth', 'app_password']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  appPassword: z.string().optional(),
});

// Create Repository Schema
const CreateRepositorySchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  workspace: z.string().min(1, 'Workspace is required'),
  name: z.string().min(1, 'Repository name is required'),
  description: z.string().optional(),
  isPrivate: z.boolean().default(false),
  hasIssues: z.boolean().default(true),
  hasWiki: z.boolean().default(false),
  authType: z.enum(['oauth', 'app_password']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  appPassword: z.string().optional(),
});

// Union of all repository schemas (commented out as not currently used)
// const RepositorySchema = z.union([
//   ListRepositoriesSchema,
//   GetRepositorySchema,
//   CreateRepositorySchema,
// ]);

export const listRepositoriesTool: MCPTool = {
  name: 'mcp_bitbucket_repository_list',
  description: 'List repositories in a Bitbucket Cloud workspace',
  inputSchema: ListRepositoriesSchema.shape,
  serverType: ['cloud'],
  category: 'repository',
  operation: 'list',
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', { tool: 'listRepositories' });

    try {
      logger.info('Listing repositories', {
        params: { ...(params as Record<string, unknown>), appPassword: '[REDACTED]' },
      });

      const validatedParams = ListRepositoriesSchema.parse(params);
      const config = buildConfig(validatedParams);

      const result = await bitbucketAPIService.get(
        config,
        `/2.0/repositories/${validatedParams.workspace}`,
        {
          page: validatedParams.page,
          pagelen: validatedParams.pagelen,
        }
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        const repositories = assertPaginatedDataResponse(result.data).data.values.map(
          transformRepository
        );

        logger.info('Repositories listed successfully', {
          count: repositories.length,
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
                  repositories,
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
        logger.warn('Failed to list repositories', {
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
      logger.error('List repositories tool error', {
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
};

export const getRepositoryTool: MCPTool = {
  name: 'mcp_bitbucket_repository_get',
  description: 'Get repository details from Bitbucket Cloud',
  inputSchema: GetRepositorySchema.shape,
  serverType: ['cloud'],
  category: 'repository',
  operation: 'get',
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', { tool: 'getRepository' });

    try {
      logger.info('Getting repository', {
        params: { ...(params as Record<string, unknown>), appPassword: '[REDACTED]' },
      });

      const validatedParams = GetRepositorySchema.parse(params);
      const config = buildConfig(validatedParams);

      const result = await bitbucketAPIService.get(
        config,
        `/2.0/repositories/${validatedParams.workspace}/${validatedParams.repo}`
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        const repository = transformRepository(assertPaginatedDataResponse(result.data).data);

        logger.info('Repository retrieved successfully', {
          repository: validatedParams.repo,
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
                  repository,
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to get repository', {
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
      logger.error('Get repository tool error', {
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
};

export const createRepositoryTool: MCPTool = {
  name: 'mcp_bitbucket_repository_create',
  description: 'Create a new repository in Bitbucket Cloud',
  inputSchema: CreateRepositorySchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', { tool: 'createRepository' });

    try {
      logger.info('Creating repository', {
        params: { ...(params as Record<string, unknown>), appPassword: '[REDACTED]' },
      });

      const validatedParams = CreateRepositorySchema.parse(params);
      const config = buildConfig(validatedParams);

      const repositoryData = {
        name: validatedParams.name,
        description: validatedParams.description,
        is_private: validatedParams.isPrivate,
        has_issues: validatedParams.hasIssues,
        has_wiki: validatedParams.hasWiki,
        scm: 'git',
      };

      const result = await bitbucketAPIService.post(
        config,
        `/2.0/repositories/${validatedParams.workspace}/${validatedParams.name}`,
        repositoryData
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        const repository = transformRepository(assertPaginatedDataResponse(result.data).data);

        logger.info('Repository created successfully', {
          repository: validatedParams.name,
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
                  repository,
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to create repository', {
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
      logger.error('Create repository tool error', {
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

function transformRepository(data: any): Repository {
  return {
    id: data.uuid,
    name: data.name,
    scmId: 'git',
    description: data.description,
    uuid: data.uuid,
    fullName: data.full_name,
    isPrivate: data.is_private,
    workspace: {
      slug: data.workspace?.slug || '',
      name: data.workspace?.name || '',
    },
    createdAt: data.created_on,
    updatedAt: data.updated_on,
  };
}
