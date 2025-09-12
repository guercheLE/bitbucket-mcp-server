import { z } from 'zod';
import { MCPTool, ToolResult } from '@/types/mcp';
import { BitbucketConfig } from '@/types/config';
import { configService } from '@/services/config.service';
import { authService } from '@/services/auth.service';
import { loggerService } from '@/services/logger.service';

// API Token Authentication Schema
const ApiTokenAuthSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  username: z.string().min(1, 'Username is required'),
  token: z.string().min(1, 'API Token is required'),
});

// Basic Authentication Schema
const BasicAuthSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

// OAuth Authentication Schema (Data Center)
const OAuthAuthSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  accessToken: z.string().min(1, 'Access Token is required'),
  tokenType: z.string().default('Bearer'),
});

// Union of authentication schemas
const AuthSchema = z.union([ApiTokenAuthSchema, BasicAuthSchema, OAuthAuthSchema]);

export const authenticateTool: MCPTool = {
  name: 'mcp_bitbucket_auth_authenticate',
  description: 'Authenticate with Bitbucket Data Center using API Token, Basic Auth, or OAuth',
  inputSchema: AuthSchema,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', { tool: 'authenticate' });

    try {
      logger.info('Starting Data Center authentication', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      // Validate input parameters
      const validatedParams = AuthSchema.parse(params);

      // Build configuration
      const config: BitbucketConfig = {
        baseUrl: validatedParams.serverUrl,
        serverType: 'datacenter',
        auth: buildAuthConfig(validatedParams),
        timeouts: configService.getTimeoutConfig(),
        rateLimit: configService.getRateLimitConfig(),
      };

      // Perform authentication
      const result = await authService.authenticate(config);

      const duration = Date.now() - startTime;

      if (result.success && result.user) {
        logger.info('Data Center authentication successful', {
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
                    slug: result.user.slug,
                    type: result.user.type,
                    active: result.user.active,
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
        logger.warn('Data Center authentication failed', {
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
      logger.error('Data Center authentication tool error', {
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
  if ('token' in params) {
    // API Token authentication
    return {
      type: 'api_token',
      credentials: {
        username: params.username,
        token: params.token,
      },
    };
  } else if ('password' in params) {
    // Basic authentication
    return {
      type: 'basic',
      credentials: {
        username: params.username,
        password: params.password,
      },
    };
  } else {
    // OAuth authentication
    return {
      type: 'oauth',
      credentials: {
        clientId: 'dummy',
        clientSecret: 'dummy',
        // accessToken: params.accessToken, // Propriedade não existe no tipo
        tokenType: params.tokenType,
      },
    };
  }
}
