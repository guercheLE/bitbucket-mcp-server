import { z } from 'zod';
import { MCPTool, ToolResult } from '@/types/mcp';
import { BitbucketConfig } from '@/types/config';
import { configService } from '@/services/config.service';
import { bitbucketAPIService } from '@/services/bitbucket-api.service';
import { loggerService } from '@/services/logger.service';
import { assertApiDataResponse } from '@/integration/api-client';

// Get Project Avatar Info Schema
const GetProjectAvatarInfoSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  projectKey: z.string().min(1, 'Project key is required'),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

export const getProjectAvatarInfoTool: MCPTool = {
  name: 'mcp_bitbucket_project_get_avatar_info',
  description: 'Get project avatar information from Bitbucket Data Center',
  inputSchema: GetProjectAvatarInfoSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'getProjectAvatarInfo',
      serverType: ['datacenter'],
      operation: 'get_project_avatar_info',
      category: 'unknown',
    });

    try {
      logger.info('Getting project avatar info', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      const validatedParams = GetProjectAvatarInfoSchema.parse(params);
      const config = buildConfig(validatedParams);

      const result = await bitbucketAPIService.get(
        config,
        `/rest/api/1.0/projects/${validatedParams.projectKey}/avatar/info`
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        const avatarInfo = assertApiDataResponse(result.data).data;

        logger.info('Project avatar info retrieved successfully', {
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
                  avatarInfo,
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to get project avatar info', {
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
      logger.error('Get project avatar info tool error', {
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
  operation: 'get_avatar_info',
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
