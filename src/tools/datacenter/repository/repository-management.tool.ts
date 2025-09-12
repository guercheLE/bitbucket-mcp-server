import { z } from 'zod';
import { MCPTool, ToolResult } from '@/types/mcp';
import { BitbucketConfig } from '@/types/config';
import { Repository } from '@/types/bitbucket';
import { configService } from '@/services/config.service';
import { bitbucketAPIService } from '@/services/bitbucket-api.service';
import { loggerService } from '@/services/logger.service';
import { assertApiResponse } from '@/integration/api-client';

// List Repositories Schema
const ListRepositoriesSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  projectKey: z.string().min(1, 'Project key is required'),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
  start: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(100).default(25),
  name: z.string().optional(),
  permission: z.enum(['REPO_READ', 'REPO_WRITE', 'REPO_ADMIN']).optional(),
});

// Get Repository Schema
const GetRepositorySchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  projectKey: z.string().min(1, 'Project key is required'),
  repositorySlug: z.string().min(1, 'Repository slug is required'),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

// Create Repository Schema
const CreateRepositorySchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  projectKey: z.string().min(1, 'Project key is required'),
  name: z.string().min(1, 'Repository name is required'),
  description: z.string().optional(),
  forkable: z.boolean().default(true),
  isPublic: z.boolean().default(false),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

// Update Repository Schema
const UpdateRepositorySchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  projectKey: z.string().min(1, 'Project key is required'),
  repositorySlug: z.string().min(1, 'Repository slug is required'),
  name: z.string().optional(),
  description: z.string().optional(),
  forkable: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

// Delete Repository Schema
const DeleteRepositorySchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  projectKey: z.string().min(1, 'Project key is required'),
  repositorySlug: z.string().min(1, 'Repository slug is required'),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

export const listRepositoriesTool: MCPTool = {
  name: 'mcp_bitbucket_repository_list',
  description: 'List repositories in a Bitbucket Data Center project',
  inputSchema: ListRepositoriesSchema.shape,
  serverType: ['datacenter'],
  category: 'repository',
  operation: 'list',
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'listRepositories',
      serverType: ['datacenter'],
      operation: 'list_repositories',
      category: 'unknown',
    });

    try {
      logger.info('Starting repository list operation', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      // Validate input parameters
      const validatedParams = ListRepositoriesSchema.parse(params);

      // Build configuration
      const config: BitbucketConfig = buildConfig(validatedParams);

      // Build query parameters
      const queryParams: Record<string, string> = {
        start: validatedParams.start.toString(),
        limit: validatedParams.limit.toString(),
      };

      if (validatedParams.name) {
        queryParams['name'] = validatedParams.name;
      }

      if (validatedParams.permission) {
        queryParams['permission'] = validatedParams.permission;
      }

      // Make API call
      const response = await bitbucketAPIService.get(
        config,
        `/rest/api/1.0/projects/${validatedParams.projectKey}/repos`,
        queryParams
      );

      // Transform response
      const responseData = assertApiResponse(response.data) as any;
      const repositories = responseData.values?.map(transformRepository) || [];

      const duration = Date.now() - startTime;
      logger.info('Repository list operation completed', {
        count: repositories.length,
        duration,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                repositories,
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
      logger.error('Repository list operation failed', { error, duration });

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

export const getRepositoryTool: MCPTool = {
  name: 'mcp_bitbucket_repository_get',
  description: 'Get a specific repository from Bitbucket Data Center',
  inputSchema: GetRepositorySchema.shape,
  serverType: ['datacenter'],
  category: 'repository',
  operation: 'get',
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'getRepository',
      serverType: ['datacenter'],
      operation: 'get_repository',
      category: 'unknown',
    });

    try {
      logger.info('Starting repository get operation', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      // Validate input parameters
      const validatedParams = GetRepositorySchema.parse(params);

      // Build configuration
      const config: BitbucketConfig = buildConfig(validatedParams);

      // Make API call
      const response = await bitbucketAPIService.get(
        config,
        `/rest/api/1.0/projects/${validatedParams.projectKey}/repos/${validatedParams.repositorySlug}`
      );

      // Transform response
      const repository = transformRepository(assertApiResponse(response.data));

      const duration = Date.now() - startTime;
      logger.info('Repository get operation completed', {
        repositorySlug: validatedParams.repositorySlug,
        duration,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(repository, null, 2),
          },
        ],
        isError: false,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Repository get operation failed', { error, duration });

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

export const createRepositoryTool: MCPTool = {
  name: 'mcp_bitbucket_repository_create',
  description: 'Create a new repository in Bitbucket Data Center',
  inputSchema: CreateRepositorySchema.shape,
  serverType: ['datacenter'],
  category: 'repository',
  operation: 'create',
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'createRepository',
      serverType: ['datacenter'],
      operation: 'create_repository',
      category: 'unknown',
    });

    try {
      logger.info('Starting repository create operation', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      // Validate input parameters
      const validatedParams = CreateRepositorySchema.parse(params);

      // Build configuration
      const config: BitbucketConfig = buildConfig(validatedParams);

      // Build request body
      const requestBody = {
        name: validatedParams.name,
        description: validatedParams.description,
        forkable: validatedParams.forkable,
        public: validatedParams.isPublic,
      };

      // Make API call
      const response = await bitbucketAPIService.post(
        config,
        `/rest/api/1.0/projects/${validatedParams.projectKey}/repos`,
        requestBody
      );

      // Transform response
      const repository = transformRepository(assertApiResponse(response.data));

      const duration = Date.now() - startTime;
      logger.info('Repository create operation completed', {
        repositorySlug: repository.slug,
        duration,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(repository, null, 2),
          },
        ],
        isError: false,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Repository create operation failed', { error, duration });

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

export const updateRepositoryTool: MCPTool = {
  name: 'mcp_bitbucket_repository_update',
  description: 'Update a repository in Bitbucket Data Center',
  inputSchema: UpdateRepositorySchema.shape,
  serverType: ['datacenter'],
  category: 'repository',
  operation: 'update',
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'updateRepository',
      serverType: ['datacenter'],
      operation: 'update_repository',
      category: 'unknown',
    });

    try {
      logger.info('Starting repository update operation', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      // Validate input parameters
      const validatedParams = UpdateRepositorySchema.parse(params);

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

      if (validatedParams.forkable !== undefined) {
        requestBody['forkable'] = validatedParams.forkable;
      }

      if (validatedParams.isPublic !== undefined) {
        requestBody['public'] = validatedParams.isPublic;
      }

      // Make API call
      const response = await bitbucketAPIService.put(
        config,
        `/rest/api/1.0/projects/${validatedParams.projectKey}/repos/${validatedParams.repositorySlug}`,
        requestBody
      );

      // Transform response
      const repository = transformRepository(assertApiResponse(response.data));

      const duration = Date.now() - startTime;
      logger.info('Repository update operation completed', {
        repositorySlug: validatedParams.repositorySlug,
        duration,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(repository, null, 2),
          },
        ],
        isError: false,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Repository update operation failed', { error, duration });

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

export const deleteRepositoryTool: MCPTool = {
  name: 'mcp_bitbucket_repository_delete',
  description: 'Delete a repository from Bitbucket Data Center',
  inputSchema: DeleteRepositorySchema.shape,
  serverType: ['datacenter'],
  category: 'repository',
  operation: 'delete',
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'deleteRepository',
      serverType: ['datacenter'],
      operation: 'delete_repository',
      category: 'unknown',
    });

    try {
      logger.info('Starting repository delete operation', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      // Validate input parameters
      const validatedParams = DeleteRepositorySchema.parse(params);

      // Build configuration
      const config: BitbucketConfig = buildConfig(validatedParams);

      // Make API call
      await bitbucketAPIService.delete(
        config,
        `/rest/api/1.0/projects/${validatedParams.projectKey}/repos/${validatedParams.repositorySlug}`
      );

      const duration = Date.now() - startTime;
      logger.info('Repository delete operation completed', {
        repositorySlug: validatedParams.repositorySlug,
        duration,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                message: 'Repository deleted successfully',
                projectKey: validatedParams.projectKey,
                repositorySlug: validatedParams.repositorySlug,
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
      logger.error('Repository delete operation failed', { error, duration });

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
          clientId: 'dummy',
          clientSecret: 'dummy',
          tokenType: 'Bearer',
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

// Helper function to transform repository data
function transformRepository(data: any): Repository {
  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    description: data.description,
    scmId: data.scmId,
    state: data.state,
    statusMessage: data.statusMessage,
    forkable: data.forkable,
    public: data.public,
    project: {
      key: data.project?.key,
      name: data.project?.name,
    },
    links: data.links,
  };
}
