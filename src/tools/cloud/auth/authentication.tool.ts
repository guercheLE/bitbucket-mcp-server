import { z } from 'zod';
import { MCPTool, ToolResult } from '@/types/mcp';
import { BitbucketConfig } from '@/types/config';
import { configService } from '@/services/config.service';
import { authService } from '@/services/auth.service';
import { loggerService } from '@/services/logger.service';

// OAuth Authentication Schema
const OAuthAuthSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  clientId: z.string().min(1, 'Client ID is required'),
  clientSecret: z.string().min(1, 'Client Secret is required'),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
});

// App Password Authentication Schema
const AppPasswordAuthSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  username: z.string().min(1, 'Username is required'),
  appPassword: z.string().min(1, 'App Password is required'),
});

// Union of authentication schemas
const AuthSchema = z.union([OAuthAuthSchema, AppPasswordAuthSchema]);

export const authenticateTool: MCPTool = {
  name: 'mcp_bitbucket_auth_authenticate',
  description: 'Authenticate with Bitbucket Cloud using OAuth or App Password',
  inputSchema: AuthSchema,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', { tool: 'authenticate' });

    try {
      logger.info('Starting authentication', {
        params: { ...(params as Record<string, unknown>), appPassword: '[REDACTED]' },
      });

      // Validate input parameters
      const validatedParams = AuthSchema.parse(params);

      // Build configuration
      const config: BitbucketConfig = {
        baseUrl: validatedParams.serverUrl,
        serverType: 'cloud',
        auth: buildAuthConfig(validatedParams),
        timeouts: configService.getTimeoutConfig(),
        rateLimit: configService.getRateLimitConfig(),
      };

      // Perform authentication
      const result = await authService.authenticate(config);

      const duration = Date.now() - startTime;

      if (result.success && result.user) {
        logger.info('Authentication successful', {
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
                  },
                  expiresAt: result.expiresAt?.toISOString(),
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Authentication failed', {
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
      logger.error('Authentication tool error', {
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
  operation: 'authenticate',
};

function buildAuthConfig(params: z.infer<typeof AuthSchema>): BitbucketConfig['auth'] {
  if ('clientId' in params) {
    // OAuth authentication
    return {
      type: 'oauth',
      credentials: {
        clientId: params.clientId,
        clientSecret: params.clientSecret,
        tokenType: 'Bearer',
        refreshToken: params.refreshToken,
      },
    };
  } else {
    // App Password authentication
    return {
      type: 'app_password',
      credentials: {
        username: params.username || '',
        appPassword: params.appPassword,
      },
    };
  }
}
