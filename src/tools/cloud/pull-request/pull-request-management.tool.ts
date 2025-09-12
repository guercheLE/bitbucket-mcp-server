import { z } from 'zod';
import { MCPTool, ToolResult } from '@/types/mcp';
import { BitbucketConfig } from '@/types/config';
import { PullRequest } from '@/types/bitbucket';
import { configService } from '@/services/config.service';
import { bitbucketAPIService } from '@/services/bitbucket-api.service';
import { loggerService } from '@/services/logger.service';
import { assertPaginatedDataResponse } from '@/integration/api-client';

// List Pull Requests Schema
const ListPullRequestsSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  workspace: z.string().min(1, 'Workspace is required'),
  repo: z.string().min(1, 'Repository name is required'),
  authType: z.enum(['oauth', 'app_password']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  appPassword: z.string().optional(),
  state: z.enum(['OPEN', 'MERGED', 'DECLINED', 'SUPERSEDED']).optional(),
  page: z.number().int().min(1).default(1),
  pagelen: z.number().int().min(1).max(100).default(50),
});

// Get Pull Request Schema
const GetPullRequestSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  workspace: z.string().min(1, 'Workspace is required'),
  repo: z.string().min(1, 'Repository name is required'),
  pullRequestId: z.number().int().min(1, 'Pull request ID is required'),
  authType: z.enum(['oauth', 'app_password']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  appPassword: z.string().optional(),
});

// Create Pull Request Schema
const CreatePullRequestSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  workspace: z.string().min(1, 'Workspace is required'),
  repo: z.string().min(1, 'Repository name is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  sourceBranch: z.string().min(1, 'Source branch is required'),
  destinationBranch: z.string().min(1, 'Destination branch is required'),
  reviewers: z.array(z.string()).optional(),
  closeSourceBranch: z.boolean().default(false),
  authType: z.enum(['oauth', 'app_password']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  appPassword: z.string().optional(),
});

// Merge Pull Request Schema
const MergePullRequestSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  workspace: z.string().min(1, 'Workspace is required'),
  repo: z.string().min(1, 'Repository name is required'),
  pullRequestId: z.number().int().min(1, 'Pull request ID is required'),
  mergeStrategy: z.enum(['merge_commit', 'squash', 'fast_forward']).default('merge_commit'),
  authType: z.enum(['oauth', 'app_password']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  appPassword: z.string().optional(),
});

export const listPullRequestsTool: MCPTool = {
  name: 'mcp_bitbucket_pull_request_list',
  description: 'List pull requests in a Bitbucket Cloud repository',
  inputSchema: ListPullRequestsSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'listPullRequests',
      serverType: ['datacenter'],
      operation: 'list_pull_requests',
      category: 'unknown',
    });

    try {
      logger.info('Listing pull requests', {
        params: { ...(params as Record<string, unknown>), appPassword: '[REDACTED]' },
      });

      const validatedParams = ListPullRequestsSchema.parse(params);
      const config = buildConfig(validatedParams);

      const queryParams: Record<string, any> = {
        page: validatedParams.page,
        pagelen: validatedParams.pagelen,
      };

      if (validatedParams.state) {
        queryParams['state'] = validatedParams.state;
      }

      const result = await bitbucketAPIService.get(
        config,
        `/2.0/repositories/${validatedParams.workspace}/${validatedParams.repo}/pullrequests`,
        queryParams
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        const pullRequests = assertPaginatedDataResponse(result.data).data.values.map(
          transformPullRequest
        );

        logger.info('Pull requests listed successfully', {
          count: pullRequests.length,
          workspace: validatedParams.workspace,
          repo: validatedParams.repo,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  pullRequests,
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
        logger.warn('Failed to list pull requests', {
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
      logger.error('List pull requests tool error', {
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
  serverType: ['cloud'],
  category: 'pull_request',
  operation: 'list',
};

export const getPullRequestTool: MCPTool = {
  name: 'mcp_bitbucket_pull_request_get',
  description: 'Get pull request details from Bitbucket Cloud',
  inputSchema: GetPullRequestSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'getPullRequest',
      serverType: ['datacenter'],
      operation: 'get_pull_request',
      category: 'unknown',
    });

    try {
      logger.info('Getting pull request', {
        params: { ...(params as Record<string, unknown>), appPassword: '[REDACTED]' },
      });

      const validatedParams = GetPullRequestSchema.parse(params);
      const config = buildConfig(validatedParams);

      const result = await bitbucketAPIService.get(
        config,
        `/2.0/repositories/${validatedParams.workspace}/${validatedParams.repo}/pullrequests/${validatedParams.pullRequestId}`
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        const pullRequest = transformPullRequest(assertPaginatedDataResponse(result.data).data);

        logger.info('Pull request retrieved successfully', {
          pullRequestId: validatedParams.pullRequestId,
          workspace: validatedParams.workspace,
          repo: validatedParams.repo,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  pullRequest,
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to get pull request', {
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
      logger.error('Get pull request tool error', {
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
  serverType: ['cloud'],
  category: 'pull_request',
  operation: 'get',
};

export const createPullRequestTool: MCPTool = {
  name: 'mcp_bitbucket_pull_request_create',
  description: 'Create a new pull request in Bitbucket Cloud',
  inputSchema: CreatePullRequestSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'createPullRequest',
      serverType: ['datacenter'],
      operation: 'create_pull_request',
      category: 'unknown',
    });

    try {
      logger.info('Creating pull request', {
        params: { ...(params as Record<string, unknown>), appPassword: '[REDACTED]' },
      });

      const validatedParams = CreatePullRequestSchema.parse(params);
      const config = buildConfig(validatedParams);

      const pullRequestData = {
        title: validatedParams.title,
        description: validatedParams.description,
        source: {
          branch: {
            name: validatedParams.sourceBranch,
          },
        },
        destination: {
          branch: {
            name: validatedParams.destinationBranch,
          },
        },
        reviewers: validatedParams.reviewers?.map(username => ({ username })),
        close_source_branch: validatedParams.closeSourceBranch,
      };

      const result = await bitbucketAPIService.post(
        config,
        `/2.0/repositories/${validatedParams.workspace}/${validatedParams.repo}/pullrequests`,
        pullRequestData
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        const pullRequest = transformPullRequest(assertPaginatedDataResponse(result.data).data);

        logger.info('Pull request created successfully', {
          pullRequestId: pullRequest.id,
          workspace: validatedParams.workspace,
          repo: validatedParams.repo,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  pullRequest,
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to create pull request', {
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
      logger.error('Create pull request tool error', {
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
  serverType: ['cloud'],
  category: 'pull_request',
  operation: 'create',
};

export const mergePullRequestTool: MCPTool = {
  name: 'mcp_bitbucket_pull_request_merge',
  description: 'Merge a pull request in Bitbucket Cloud',
  inputSchema: MergePullRequestSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'mergePullRequest',
      serverType: ['datacenter'],
      operation: 'merge_pull_request',
      category: 'unknown',
    });

    try {
      logger.info('Merging pull request', {
        params: { ...(params as Record<string, unknown>), appPassword: '[REDACTED]' },
      });

      const validatedParams = MergePullRequestSchema.parse(params);
      const config = buildConfig(validatedParams);

      const mergeData = {
        type: 'pullrequest',
        merge_strategy: validatedParams.mergeStrategy,
      };

      const result = await bitbucketAPIService.post(
        config,
        `/2.0/repositories/${validatedParams.workspace}/${validatedParams.repo}/pullrequests/${validatedParams.pullRequestId}/merge`,
        mergeData
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        logger.info('Pull request merged successfully', {
          pullRequestId: validatedParams.pullRequestId,
          workspace: validatedParams.workspace,
          repo: validatedParams.repo,
          mergeStrategy: validatedParams.mergeStrategy,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: 'Pull request merged successfully',
                  mergeStrategy: validatedParams.mergeStrategy,
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to merge pull request', {
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
      logger.error('Merge pull request tool error', {
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
  serverType: ['cloud'],
  category: 'pull_request',
  operation: 'merge',
};

function buildConfig(params: any): BitbucketConfig {
  const authConfig =
    params.authType === 'oauth'
      ? {
          type: 'oauth' as const,
          credentials: {
            clientId: 'dummy',
            clientSecret: 'dummy',
            tokenType: 'Bearer',
          },
        }
      : {
          type: 'app_password' as const,
          credentials: {
            username: params.username || '',
            appPassword: params.appPassword,
          },
        };

  return {
    baseUrl: params.serverUrl,
    serverType: 'cloud',
    auth: authConfig,
    timeouts: configService.getTimeoutConfig(),
    rateLimit: configService.getRateLimitConfig(),
  };
}

function transformPullRequest(data: any): PullRequest {
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    state: data.state,
    author: {
      user: {
        name: data.author?.display_name || data.author?.username,
        id: data.author?.uuid,
        displayName: data.author?.display_name,
        uuid: data.author?.uuid,
      },
    },
    fromRef: {
      id: data.source?.branch?.name || '',
      displayId: data.source?.branch?.name || '',
      latestCommit: data.source?.commit?.hash || '',
      repository: data.repository,
    },
    toRef: {
      id: data.destination?.branch?.name || '',
      displayId: data.destination?.branch?.name || '',
      latestCommit: data.destination?.commit?.hash || '',
      repository: data.repository,
    },
    reviewers:
      data.reviewers?.map((reviewer: any) => ({
        user: {
          name: reviewer.user?.display_name || reviewer.user?.username,
          id: reviewer.user?.uuid,
          displayName: reviewer.user?.display_name,
          uuid: reviewer.user?.uuid,
        },
        approved: reviewer.approved || false,
        status: reviewer.status,
      })) || [],
    createdDate: data.created_on,
    updatedDate: data.updated_on,
    repository: data.repository,
  };
}
