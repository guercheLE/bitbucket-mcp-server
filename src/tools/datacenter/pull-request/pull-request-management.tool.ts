import { z } from 'zod';
import { MCPTool, ToolResult } from '@/types/mcp';
import { BitbucketConfig } from '@/types/config';
import { PullRequest } from '@/types/bitbucket';
import { configService } from '@/services/config.service';
import { bitbucketAPIService } from '@/services/bitbucket-api.service';
import { loggerService } from '@/services/logger.service';
import { assertApiResponse } from '@/integration/api-client';

// List Pull Requests Schema
const ListPullRequestsSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  projectKey: z.string().min(1, 'Project key is required'),
  repositorySlug: z.string().min(1, 'Repository slug is required'),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
  state: z.enum(['OPEN', 'DECLINED', 'MERGED', 'SUPERSEDED']).optional(),
  start: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(100).default(25),
});

// Get Pull Request Schema
const GetPullRequestSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  projectKey: z.string().min(1, 'Project key is required'),
  repositorySlug: z.string().min(1, 'Repository slug is required'),
  pullRequestId: z.number().int().positive('Pull request ID must be positive'),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

// Create Pull Request Schema
const CreatePullRequestSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  projectKey: z.string().min(1, 'Project key is required'),
  repositorySlug: z.string().min(1, 'Repository slug is required'),
  title: z.string().min(1, 'Pull request title is required'),
  description: z.string().optional(),
  sourceBranch: z.string().min(1, 'Source branch is required'),
  destinationBranch: z.string().min(1, 'Destination branch is required'),
  reviewers: z.array(z.string()).optional(),
  closeSourceBranch: z.boolean().default(false),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

// Update Pull Request Schema
const UpdatePullRequestSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  projectKey: z.string().min(1, 'Project key is required'),
  repositorySlug: z.string().min(1, 'Repository slug is required'),
  pullRequestId: z.number().int().positive('Pull request ID must be positive'),
  title: z.string().optional(),
  description: z.string().optional(),
  version: z.number().int().min(0).optional(),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

// Merge Pull Request Schema
const MergePullRequestSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  projectKey: z.string().min(1, 'Project key is required'),
  repositorySlug: z.string().min(1, 'Repository slug is required'),
  pullRequestId: z.number().int().positive('Pull request ID must be positive'),
  version: z.number().int().min(0),
  mergeStrategy: z.enum(['no-ff', 'ff', 'squash']).default('no-ff'),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

// Decline Pull Request Schema
const DeclinePullRequestSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  projectKey: z.string().min(1, 'Project key is required'),
  repositorySlug: z.string().min(1, 'Repository slug is required'),
  pullRequestId: z.number().int().positive('Pull request ID must be positive'),
  version: z.number().int().min(0),
  reason: z.string().optional(),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

export const listPullRequestsTool: MCPTool = {
  name: 'mcp_bitbucket_pull_request_list',
  description: 'List pull requests in a Bitbucket Data Center repository',
  inputSchema: ListPullRequestsSchema.shape,
  serverType: ['datacenter'],
  category: 'pull_request',
  operation: 'list',
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'listPullRequests',
      serverType: ['datacenter'],
      operation: 'list_pull_requests',
      category: 'unknown',
    });

    try {
      logger.info('Starting pull request list operation', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      // Validate input parameters
      const validatedParams = ListPullRequestsSchema.parse(params);

      // Build configuration
      const config: BitbucketConfig = buildConfig(validatedParams);

      // Build query parameters
      const queryParams: Record<string, string> = {
        start: validatedParams.start.toString(),
        limit: validatedParams.limit.toString(),
      };

      if (validatedParams.state) {
        queryParams['state'] = validatedParams.state;
      }

      // Make API call
      const response = await bitbucketAPIService.get(
        config,
        `/rest/api/1.0/projects/${validatedParams.projectKey}/repos/${validatedParams.repositorySlug}/pull-requests`,
        queryParams
      );

      // Transform response
      const responseData = assertApiResponse(response.data) as any;
      const pullRequests = responseData.values?.map(transformPullRequest) || [];

      const duration = Date.now() - startTime;
      logger.info('Pull request list operation completed', {
        count: pullRequests.length,
        duration,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                pullRequests,
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
      logger.error('Pull request list operation failed', { error, duration });

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

export const getPullRequestTool: MCPTool = {
  name: 'mcp_bitbucket_pull_request_get',
  description: 'Get a specific pull request from Bitbucket Data Center',
  inputSchema: GetPullRequestSchema.shape,
  serverType: ['datacenter'],
  category: 'pull_request',
  operation: 'get',
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'getPullRequest',
      serverType: ['datacenter'],
      operation: 'get_pull_request',
      category: 'unknown',
    });

    try {
      logger.info('Starting pull request get operation', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      // Validate input parameters
      const validatedParams = GetPullRequestSchema.parse(params);

      // Build configuration
      const config: BitbucketConfig = buildConfig(validatedParams);

      // Make API call
      const response = await bitbucketAPIService.get(
        config,
        `/rest/api/1.0/projects/${validatedParams.projectKey}/repos/${validatedParams.repositorySlug}/pull-requests/${validatedParams.pullRequestId}`
      );

      // Transform response
      const pullRequest = transformPullRequest(assertApiResponse(response.data));

      const duration = Date.now() - startTime;
      logger.info('Pull request get operation completed', {
        pullRequestId: validatedParams.pullRequestId,
        duration,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(pullRequest, null, 2),
          },
        ],
        isError: false,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Pull request get operation failed', { error, duration });

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

export const createPullRequestTool: MCPTool = {
  name: 'mcp_bitbucket_pull_request_create',
  description: 'Create a new pull request in Bitbucket Data Center',
  inputSchema: CreatePullRequestSchema.shape,
  serverType: ['datacenter'],
  category: 'pull_request',
  operation: 'create',
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'createPullRequest',
      serverType: ['datacenter'],
      operation: 'create_pull_request',
      category: 'unknown',
    });

    try {
      logger.info('Starting pull request create operation', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      // Validate input parameters
      const validatedParams = CreatePullRequestSchema.parse(params);

      // Build configuration
      const config: BitbucketConfig = buildConfig(validatedParams);

      // Build request body
      const requestBody = {
        title: validatedParams.title,
        description: validatedParams.description,
        fromRef: {
          id: `refs/heads/${validatedParams.sourceBranch}`,
          repository: {
            slug: validatedParams.repositorySlug,
            project: {
              key: validatedParams.projectKey,
            },
          },
        },
        toRef: {
          id: `refs/heads/${validatedParams.destinationBranch}`,
          repository: {
            slug: validatedParams.repositorySlug,
            project: {
              key: validatedParams.projectKey,
            },
          },
        },
        reviewers: validatedParams.reviewers?.map(username => ({ user: { name: username } })) || [],
        closeSourceBranch: validatedParams.closeSourceBranch,
      };

      // Make API call
      const response = await bitbucketAPIService.post(
        config,
        `/rest/api/1.0/projects/${validatedParams.projectKey}/repos/${validatedParams.repositorySlug}/pull-requests`,
        requestBody
      );

      // Transform response
      const pullRequest = transformPullRequest(assertApiResponse(response.data));

      const duration = Date.now() - startTime;
      logger.info('Pull request create operation completed', {
        pullRequestId: pullRequest.id,
        duration,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(pullRequest, null, 2),
          },
        ],
        isError: false,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Pull request create operation failed', { error, duration });

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

export const updatePullRequestTool: MCPTool = {
  name: 'mcp_bitbucket_pull_request_update',
  description: 'Update a pull request in Bitbucket Data Center',
  inputSchema: UpdatePullRequestSchema.shape,
  serverType: ['datacenter'],
  category: 'pull_request',
  operation: 'update',
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'updatePullRequest',
      serverType: ['datacenter'],
      operation: 'update_pull_request',
      category: 'unknown',
    });

    try {
      logger.info('Starting pull request update operation', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      // Validate input parameters
      const validatedParams = UpdatePullRequestSchema.parse(params);

      // Build configuration
      const config: BitbucketConfig = buildConfig(validatedParams);

      // Build request body
      const requestBody: Record<string, any> = {};

      if (validatedParams.title !== undefined) {
        requestBody['title'] = validatedParams.title;
      }

      if (validatedParams.description !== undefined) {
        requestBody['description'] = validatedParams.description;
      }

      if (validatedParams.version !== undefined) {
        requestBody['version'] = validatedParams.version;
      }

      // Make API call
      const response = await bitbucketAPIService.put(
        config,
        `/rest/api/1.0/projects/${validatedParams.projectKey}/repos/${validatedParams.repositorySlug}/pull-requests/${validatedParams.pullRequestId}`,
        requestBody
      );

      // Transform response
      const pullRequest = transformPullRequest(assertApiResponse(response.data));

      const duration = Date.now() - startTime;
      logger.info('Pull request update operation completed', {
        pullRequestId: validatedParams.pullRequestId,
        duration,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(pullRequest, null, 2),
          },
        ],
        isError: false,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Pull request update operation failed', { error, duration });

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

export const mergePullRequestTool: MCPTool = {
  name: 'mcp_bitbucket_pull_request_merge',
  description: 'Merge a pull request in Bitbucket Data Center',
  inputSchema: MergePullRequestSchema.shape,
  serverType: ['datacenter'],
  category: 'pull_request',
  operation: 'merge',
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'mergePullRequest',
      serverType: ['datacenter'],
      operation: 'merge_pull_request',
      category: 'unknown',
    });

    try {
      logger.info('Starting pull request merge operation', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      // Validate input parameters
      const validatedParams = MergePullRequestSchema.parse(params);

      // Build configuration
      const config: BitbucketConfig = buildConfig(validatedParams);

      // Build request body
      const requestBody = {
        version: validatedParams.version,
        mergeStrategy: validatedParams.mergeStrategy,
      };

      // Make API call
      const response = await bitbucketAPIService.post(
        config,
        `/rest/api/1.0/projects/${validatedParams.projectKey}/repos/${validatedParams.repositorySlug}/pull-requests/${validatedParams.pullRequestId}/merge`,
        requestBody
      );

      // Transform response
      const pullRequest = transformPullRequest(assertApiResponse(response.data));

      const duration = Date.now() - startTime;
      logger.info('Pull request merge operation completed', {
        pullRequestId: validatedParams.pullRequestId,
        duration,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(pullRequest, null, 2),
          },
        ],
        isError: false,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Pull request merge operation failed', { error, duration });

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

export const declinePullRequestTool: MCPTool = {
  name: 'mcp_bitbucket_pull_request_decline',
  description: 'Decline a pull request in Bitbucket Data Center',
  inputSchema: DeclinePullRequestSchema.shape,
  serverType: ['datacenter'],
  category: 'pull_request',
  operation: 'decline',
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'declinePullRequest',
      serverType: ['datacenter'],
      operation: 'decline_pull_request',
      category: 'unknown',
    });

    try {
      logger.info('Starting pull request decline operation', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      // Validate input parameters
      const validatedParams = DeclinePullRequestSchema.parse(params);

      // Build configuration
      const config: BitbucketConfig = buildConfig(validatedParams);

      // Build request body
      const requestBody: Record<string, any> = {
        version: validatedParams.version,
      };

      if (validatedParams.reason) {
        requestBody['reason'] = validatedParams.reason;
      }

      // Make API call
      const response = await bitbucketAPIService.post(
        config,
        `/rest/api/1.0/projects/${validatedParams.projectKey}/repos/${validatedParams.repositorySlug}/pull-requests/${validatedParams.pullRequestId}/decline`,
        requestBody
      );

      // Transform response
      const pullRequest = transformPullRequest(assertApiResponse(response.data));

      const duration = Date.now() - startTime;
      logger.info('Pull request decline operation completed', {
        pullRequestId: validatedParams.pullRequestId,
        duration,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(pullRequest, null, 2),
          },
        ],
        isError: false,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Pull request decline operation failed', { error, duration });

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

// Helper function to transform pull request data
function transformPullRequest(data: any): PullRequest {
  return {
    id: data.id,
    version: data.version,
    title: data.title,
    description: data.description,
    state: data.state,
    open: data.open,
    closed: data.closed,
    createdDate: data.createdDate || new Date().toISOString(),
    updatedDate: data.updatedDate || new Date().toISOString(),
    fromRef: {
      id: data.fromRef?.id,
      displayId: data.fromRef?.displayId,
      latestCommit: data.fromRef?.latestCommit,
      repository: data.fromRef?.repository,
    },
    toRef: {
      id: data.toRef?.id,
      displayId: data.toRef?.displayId,
      latestCommit: data.toRef?.latestCommit,
      repository: data.toRef?.repository,
    },
    author: {
      user: {
        name: data.author?.user?.displayName || data.author?.user?.name,
        id: data.author?.user?.id,
        displayName: data.author?.user?.displayName,
        uuid: data.author?.user?.id,
      },
    },
    reviewers:
      data.reviewers?.map((reviewer: any) => ({
        user: {
          name: reviewer.user?.displayName || reviewer.user?.name,
          id: reviewer.user?.id,
          displayName: reviewer.user?.displayName,
          uuid: reviewer.user?.id,
        },
        approved: reviewer.approved || false,
        status: reviewer.status,
      })) || [],
    repository: data.repository,
  };
}
