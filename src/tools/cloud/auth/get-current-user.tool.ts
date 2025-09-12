import { z } from 'zod';
import { MCPTool, ToolResult } from '@/types/mcp';
import { BitbucketConfig } from '@/types/config';
import { configService } from '@/services/config.service';
import { authService } from '@/services/auth.service';
import { loggerService } from '@/services/logger.service';

const GetCurrentUserSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  authType: z.enum(['oauth', 'app_password']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  appPassword: z.string().optional(),
});

export const getCurrentUserTool: MCPTool = {
  name: 'mcp_bitbucket_auth_get_current_user',
  description: 'Get current authenticated user information from Bitbucket Cloud',
  inputSchema: GetCurrentUserSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', { tool: 'getCurrentUser' });

    try {
      logger.info('Getting current user', {
        params: { ...(params as Record<string, unknown>), appPassword: '[REDACTED]' },
      });

      // Validate input parameters
      const validatedParams = GetCurrentUserSchema.parse(params);

      // Build configuration
      const config: BitbucketConfig = {
        baseUrl: validatedParams.serverUrl,
        serverType: 'cloud',
        auth: buildAuthConfig(validatedParams),
        timeouts: configService.getTimeoutConfig(),
        rateLimit: configService.getRateLimitConfig(),
      };

      // Perform authentication to get user info
      const result = await authService.authenticate(config);

      const duration = Date.now() - startTime;

      if (result.success && result.user) {
        logger.info('Current user retrieved successfully', {
          userId: result.user.id,
          username: result.user.name,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  user: {
                    id: result.user.id,
                    name: result.user.name,
                    displayName: result.user.displayName,
                    emailAddress: result.user.emailAddress,
                    avatarUrl: result.user.avatarUrl,
                    accountStatus: result.user.accountStatus,
                    uuid: result.user.uuid,
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
        logger.warn('Failed to get current user', {
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
      logger.error('Get current user tool error', {
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

function buildAuthConfig(params: z.infer<typeof GetCurrentUserSchema>): BitbucketConfig['auth'] {
  if (params.authType === 'oauth') {
    if (!params.accessToken) {
      throw new Error('Access token is required for OAuth authentication');
    }

    return {
      type: 'oauth',
      credentials: {
        clientId: 'dummy', // Not needed for getting user info
        clientSecret: 'dummy', // Not needed for getting user info
        tokenType: 'Bearer',
      },
    };
  } else {
    if (!params.username || !params.appPassword) {
      throw new Error('Username and app password are required for app password authentication');
    }

    return {
      type: 'app_password',
      credentials: {
        username: params.username || '',
        appPassword: params.appPassword,
      },
    };
  }
}
