import { z } from 'zod';
import { MCPTool, ToolResult } from '@/types/mcp';
import { BitbucketConfig } from '@/types/config';
import { configService } from '@/services/config.service';
import { bitbucketAPIService } from '@/services/bitbucket-api.service';
import { loggerService } from '@/services/logger.service';
import { assertApiDataResponse } from '@/integration/api-client';

// Get Project Settings Schema
const GetProjectSettingsSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  projectKey: z.string().min(1, 'Project key is required'),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

// Update Project Settings Schema
const UpdateProjectSettingsSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  projectKey: z.string().min(1, 'Project key is required'),
  settings: z.object({
    defaultBranch: z.string().optional(),
    defaultMergeStrategy: z.string().optional(),
    defaultCommitMessage: z.string().optional(),
  }),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

export const getProjectSettingsTool: MCPTool = {
  name: 'mcp_bitbucket_project_get_settings',
  description: 'Get project settings from Bitbucket Data Center',
  inputSchema: GetProjectSettingsSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'getProjectSettings',
      serverType: ['datacenter'],
      operation: 'get_project_settings',
      category: 'unknown',
    });

    try {
      logger.info('Getting project settings', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      const validatedParams = GetProjectSettingsSchema.parse(params);
      const config = buildConfig(validatedParams);

      const result = await bitbucketAPIService.get(
        config,
        `/rest/api/1.0/projects/${validatedParams.projectKey}/settings`
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        const settings = assertApiDataResponse(result.data).data;

        logger.info('Project settings retrieved successfully', {
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
                  settings,
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to get project settings', {
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
      logger.error('Get project settings tool error', {
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
  operation: 'get_settings',
};

export const updateProjectSettingsTool: MCPTool = {
  name: 'mcp_bitbucket_project_update_settings',
  description: 'Update project settings in Bitbucket Data Center',
  inputSchema: UpdateProjectSettingsSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'updateProjectSettings',
      serverType: ['datacenter'],
      operation: 'update_project_settings',
      category: 'unknown',
    });

    try {
      logger.info('Updating project settings', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      const validatedParams = UpdateProjectSettingsSchema.parse(params);
      const config = buildConfig(validatedParams);

      const result = await bitbucketAPIService.put(
        config,
        `/rest/api/1.0/projects/${validatedParams.projectKey}/settings`,
        validatedParams.settings
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        const settings = assertApiDataResponse(result.data).data;

        logger.info('Project settings updated successfully', {
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
                  settings,
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to update project settings', {
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
      logger.error('Update project settings tool error', {
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
  operation: 'update_settings',
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
