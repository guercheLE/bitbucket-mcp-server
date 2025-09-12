import { z } from 'zod';
import { MCPTool, ToolResult } from '@/types/mcp';
import { BitbucketConfig } from '@/types/config';
import { Pipeline } from '@/types/cloud';
import { configService } from '@/services/config.service';
import { bitbucketAPIService } from '@/services/bitbucket-api.service';
import { loggerService } from '@/services/logger.service';
import { assertPaginatedDataResponse } from '@/integration/api-client';

// List Pipelines Schema
const ListPipelinesSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  workspace: z.string().min(1, 'Workspace is required'),
  repo: z.string().min(1, 'Repository name is required'),
  authType: z.enum(['oauth', 'app_password']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  appPassword: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pagelen: z.number().int().min(1).max(100).default(50),
});

// Get Pipeline Schema
const GetPipelineSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  workspace: z.string().min(1, 'Workspace is required'),
  repo: z.string().min(1, 'Repository name is required'),
  pipelineUuid: z.string().min(1, 'Pipeline UUID is required'),
  authType: z.enum(['oauth', 'app_password']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  appPassword: z.string().optional(),
});

// Trigger Pipeline Schema
const TriggerPipelineSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  workspace: z.string().min(1, 'Workspace is required'),
  repo: z.string().min(1, 'Repository name is required'),
  target: z.object({
    type: z.enum(['pipeline_ref', 'pipeline_commit']),
    ref_type: z.enum(['branch', 'tag']).optional(),
    ref_name: z.string().optional(),
    commit: z
      .object({
        type: z.literal('commit'),
        hash: z.string(),
      })
      .optional(),
  }),
  authType: z.enum(['oauth', 'app_password']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  appPassword: z.string().optional(),
});

// Stop Pipeline Schema
const StopPipelineSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  workspace: z.string().min(1, 'Workspace is required'),
  repo: z.string().min(1, 'Repository name is required'),
  pipelineUuid: z.string().min(1, 'Pipeline UUID is required'),
  authType: z.enum(['oauth', 'app_password']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  appPassword: z.string().optional(),
});

export const listPipelinesTool: MCPTool = {
  name: 'mcp_bitbucket_pipeline_list',
  description: 'List pipelines in a Bitbucket Cloud repository',
  inputSchema: ListPipelinesSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'listPipelines',
      serverType: ['datacenter'],
      operation: 'list_pipelines',
      category: 'unknown',
    });

    try {
      logger.info('Listing pipelines', {
        params: { ...(params as Record<string, unknown>), appPassword: '[REDACTED]' },
      });

      const validatedParams = ListPipelinesSchema.parse(params);
      const config = buildConfig(validatedParams);

      const result = await bitbucketAPIService.get(
        config,
        `/2.0/repositories/${validatedParams.workspace}/${validatedParams.repo}/pipelines`,
        {
          page: validatedParams.page,
          pagelen: validatedParams.pagelen,
        }
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        const pipelines = assertPaginatedDataResponse(result.data).data.values.map(
          transformPipeline
        );

        logger.info('Pipelines listed successfully', {
          count: pipelines.length,
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
                  pipelines,
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
        logger.warn('Failed to list pipelines', {
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
      logger.error('List pipelines tool error', {
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

export const getPipelineTool: MCPTool = {
  name: 'mcp_bitbucket_pipeline_get',
  description: 'Get pipeline details from Bitbucket Cloud',
  inputSchema: GetPipelineSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'getPipeline',
      serverType: ['datacenter'],
      operation: 'get_pipeline',
      category: 'unknown',
    });

    try {
      logger.info('Getting pipeline', {
        params: { ...(params as Record<string, unknown>), appPassword: '[REDACTED]' },
      });

      const validatedParams = GetPipelineSchema.parse(params);
      const config = buildConfig(validatedParams);

      const result = await bitbucketAPIService.get(
        config,
        `/2.0/repositories/${validatedParams.workspace}/${validatedParams.repo}/pipelines/${validatedParams.pipelineUuid}`
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        const pipeline = transformPipeline(assertPaginatedDataResponse(result.data).data);

        logger.info('Pipeline retrieved successfully', {
          pipelineUuid: validatedParams.pipelineUuid,
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
                  pipeline,
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to get pipeline', {
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
      logger.error('Get pipeline tool error', {
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

export const triggerPipelineTool: MCPTool = {
  name: 'mcp_bitbucket_pipeline_trigger',
  description: 'Trigger a pipeline in Bitbucket Cloud',
  inputSchema: TriggerPipelineSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'triggerPipeline',
      serverType: ['datacenter'],
      operation: 'trigger_pipeline',
      category: 'unknown',
    });

    try {
      logger.info('Triggering pipeline', {
        params: { ...(params as Record<string, unknown>), appPassword: '[REDACTED]' },
      });

      const validatedParams = TriggerPipelineSchema.parse(params);
      const config = buildConfig(validatedParams);

      const pipelineData = {
        target: validatedParams.target,
      };

      const result = await bitbucketAPIService.post(
        config,
        `/2.0/repositories/${validatedParams.workspace}/${validatedParams.repo}/pipelines`,
        pipelineData
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        const pipeline = transformPipeline(assertPaginatedDataResponse(result.data).data);

        logger.info('Pipeline triggered successfully', {
          pipelineUuid: pipeline.uuid,
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
                  pipeline,
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to trigger pipeline', {
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
      logger.error('Trigger pipeline tool error', {
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
  operation: 'trigger',
};

export const stopPipelineTool: MCPTool = {
  name: 'mcp_bitbucket_pipeline_stop',
  description: 'Stop a pipeline in Bitbucket Cloud',
  inputSchema: StopPipelineSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'stopPipeline',
      serverType: ['datacenter'],
      operation: 'stop_pipeline',
      category: 'unknown',
    });

    try {
      logger.info('Stopping pipeline', {
        params: { ...(params as Record<string, unknown>), appPassword: '[REDACTED]' },
      });

      const validatedParams = StopPipelineSchema.parse(params);
      const config = buildConfig(validatedParams);

      const result = await bitbucketAPIService.post(
        config,
        `/2.0/repositories/${validatedParams.workspace}/${validatedParams.repo}/pipelines/${validatedParams.pipelineUuid}/stopPipeline`
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        logger.info('Pipeline stopped successfully', {
          pipelineUuid: validatedParams.pipelineUuid,
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
                  message: 'Pipeline stopped successfully',
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to stop pipeline', {
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
      logger.error('Stop pipeline tool error', {
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
  operation: 'stop',
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

function transformPipeline(data: any): Pipeline {
  return {
    type: 'pipeline',
    uuid: data.uuid,
    build_number: data.build_number,
    state: data.state,
    links: {
      self: { href: data.links?.self?.href || '' },
      steps: { href: data.links?.steps?.href || '' },
    },
    target: {
      type: data.target?.type,
      ref_type: data.target?.ref_type,
      ref_name: data.target?.ref_name,
      commit: data.target?.commit
        ? {
            type: 'commit' as const,
            hash: data.target.commit.hash,
            links: {
              self: { href: data.target.commit.links?.self?.href || '' },
            },
          }
        : undefined,
    },
    creator: {
      name: data.creator?.display_name || data.creator?.username,
      id: data.creator?.uuid,
      displayName: data.creator?.display_name,
      uuid: data.creator?.uuid,
    },
    repository: data.repository,
    trigger: data.trigger,
    created_on: data.created_on,
    completed_on: data.completed_on,
    build_seconds_used: data.build_seconds_used || 0,
    duration_in_seconds: data.duration_in_seconds,
    first_successful: data.first_successful || false,
    expired: data.expired || false,
    // links: { ... }, // Propriedade não existe no tipo
  };
}
