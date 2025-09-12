import { z } from 'zod';
import { MCPTool, ToolResult } from '@/types/mcp';
import { BitbucketConfig } from '@/types/config';
import { PersonalAccessToken } from '@/types/datacenter';
import { configService } from '@/services/config.service';
import { bitbucketAPIService } from '@/services/bitbucket-api.service';
import { loggerService } from '@/services/logger.service';
import { assertApiResponse } from '@/integration/api-client';

// List Personal Access Tokens Schema
const ListPersonalAccessTokensSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
  start: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(100).default(25),
});

// Get Personal Access Token Schema
const GetPersonalAccessTokenSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  tokenId: z.number().int().positive('Token ID must be positive'),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

// Create Personal Access Token Schema
const CreatePersonalAccessTokenSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  name: z.string().min(1, 'Token name is required'),
  permissions: z
    .array(
      z.enum([
        'REPO_READ',
        'REPO_WRITE',
        'REPO_ADMIN',
        'PROJECT_READ',
        'PROJECT_WRITE',
        'PROJECT_ADMIN',
      ])
    )
    .min(1, 'At least one permission is required'),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

// Update Personal Access Token Schema
const UpdatePersonalAccessTokenSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  tokenId: z.number().int().positive('Token ID must be positive'),
  name: z.string().optional(),
  permissions: z
    .array(
      z.enum([
        'REPO_READ',
        'REPO_WRITE',
        'REPO_ADMIN',
        'PROJECT_READ',
        'PROJECT_WRITE',
        'PROJECT_ADMIN',
      ])
    )
    .optional(),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

// Delete Personal Access Token Schema
const DeletePersonalAccessTokenSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  tokenId: z.number().int().positive('Token ID must be positive'),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

export const listPersonalAccessTokensTool: MCPTool = {
  name: 'mcp_bitbucket_security_list_personal_access_tokens',
  description: 'List personal access tokens in Bitbucket Data Center',
  inputSchema: ListPersonalAccessTokensSchema.shape,
  serverType: ['datacenter'],
  category: 'security',
  operation: 'list',
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'listPersonalAccessTokens',
      serverType: ['datacenter'],
      operation: 'list_personal_access_tokens',
      category: 'unknown',
    });

    try {
      logger.info('Starting personal access token list operation', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      // Validate input parameters
      const validatedParams = ListPersonalAccessTokensSchema.parse(params);

      // Build configuration
      const config: BitbucketConfig = buildConfig(validatedParams);

      // Build query parameters
      const queryParams: Record<string, string> = {
        start: validatedParams.start.toString(),
        limit: validatedParams.limit.toString(),
      };

      // Make API call
      const endpoint = `/rest/access-tokens/1.0/users/current?${new URLSearchParams(queryParams).toString()}`;
      const response = await bitbucketAPIService.get(config, endpoint);

      // Transform response
      const responseData = assertApiResponse(response.data) as any;
      const tokens = responseData.values?.map(transformPersonalAccessToken) || [];

      const duration = Date.now() - startTime;
      logger.info('Personal access token list operation completed', {
        count: tokens.length,
        duration,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                tokens,
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
      logger.error('Personal access token list operation failed', { error, duration });

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

export const getPersonalAccessTokenTool: MCPTool = {
  name: 'mcp_bitbucket_security_get_personal_access_token',
  description: 'Get a specific personal access token from Bitbucket Data Center',
  inputSchema: GetPersonalAccessTokenSchema.shape,
  serverType: ['datacenter'],
  category: 'security',
  operation: 'get',
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'getPersonalAccessToken',
      serverType: ['datacenter'],
      operation: 'get_personal_access_token',
      category: 'unknown',
    });

    try {
      logger.info('Starting personal access token get operation', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      // Validate input parameters
      const validatedParams = GetPersonalAccessTokenSchema.parse(params);

      // Build configuration
      const config: BitbucketConfig = buildConfig(validatedParams);

      // Make API call
      const response = await bitbucketAPIService.get(
        config,
        `/rest/access-tokens/1.0/users/current/${validatedParams.tokenId}`
      );

      // Transform response
      const token = transformPersonalAccessToken(assertApiResponse(response.data));

      const duration = Date.now() - startTime;
      logger.info('Personal access token get operation completed', {
        tokenId: validatedParams.tokenId,
        duration,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(token, null, 2),
          },
        ],
        isError: false,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Personal access token get operation failed', { error, duration });

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

export const createPersonalAccessTokenTool: MCPTool = {
  name: 'mcp_bitbucket_security_create_personal_access_token',
  description: 'Create a new personal access token in Bitbucket Data Center',
  inputSchema: CreatePersonalAccessTokenSchema.shape,
  serverType: ['datacenter'],
  category: 'security',
  operation: 'create',
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'createPersonalAccessToken',
      serverType: ['datacenter'],
      operation: 'create_personal_access_token',
      category: 'unknown',
    });

    try {
      logger.info('Starting personal access token create operation', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      // Validate input parameters
      const validatedParams = CreatePersonalAccessTokenSchema.parse(params);

      // Build configuration
      const config: BitbucketConfig = buildConfig(validatedParams);

      // Build request body
      const requestBody = {
        name: validatedParams.name,
        permissions: validatedParams.permissions,
      };

      // Make API call
      const response = await bitbucketAPIService.post(
        config,
        '/rest/access-tokens/1.0/users/current',
        requestBody
      );

      // Transform response
      const token = transformPersonalAccessToken(assertApiResponse(response.data));

      const duration = Date.now() - startTime;
      logger.info('Personal access token create operation completed', {
        tokenId: token.id,
        duration,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(token, null, 2),
          },
        ],
        isError: false,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Personal access token create operation failed', { error, duration });

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

export const updatePersonalAccessTokenTool: MCPTool = {
  name: 'mcp_bitbucket_security_update_personal_access_token',
  description: 'Update a personal access token in Bitbucket Data Center',
  inputSchema: UpdatePersonalAccessTokenSchema.shape,
  serverType: ['datacenter'],
  category: 'security',
  operation: 'update',
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'updatePersonalAccessToken',
      serverType: ['datacenter'],
      operation: 'update_personal_access_token',
      category: 'unknown',
    });

    try {
      logger.info('Starting personal access token update operation', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      // Validate input parameters
      const validatedParams = UpdatePersonalAccessTokenSchema.parse(params);

      // Build configuration
      const config: BitbucketConfig = buildConfig(validatedParams);

      // Build request body
      const requestBody: Record<string, any> = {};

      if (validatedParams.name !== undefined) {
        requestBody['name'] = validatedParams.name;
      }

      if (validatedParams.permissions !== undefined) {
        requestBody['permissions'] = validatedParams.permissions;
      }

      // Make API call
      const response = await bitbucketAPIService.put(
        config,
        `/rest/access-tokens/1.0/users/current/${validatedParams.tokenId}`,
        requestBody
      );

      // Transform response
      const token = transformPersonalAccessToken(assertApiResponse(response.data));

      const duration = Date.now() - startTime;
      logger.info('Personal access token update operation completed', {
        tokenId: validatedParams.tokenId,
        duration,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(token, null, 2),
          },
        ],
        isError: false,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Personal access token update operation failed', { error, duration });

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

export const deletePersonalAccessTokenTool: MCPTool = {
  name: 'mcp_bitbucket_security_delete_personal_access_token',
  description: 'Delete a personal access token from Bitbucket Data Center',
  inputSchema: DeletePersonalAccessTokenSchema.shape,
  serverType: ['datacenter'],
  category: 'security',
  operation: 'delete',
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'deletePersonalAccessToken',
      serverType: ['datacenter'],
      operation: 'delete_personal_access_token',
      category: 'unknown',
    });

    try {
      logger.info('Starting personal access token delete operation', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      // Validate input parameters
      const validatedParams = DeletePersonalAccessTokenSchema.parse(params);

      // Build configuration
      const config: BitbucketConfig = buildConfig(validatedParams);

      // Make API call
      await bitbucketAPIService.delete(
        config,
        `/rest/access-tokens/1.0/users/current/${validatedParams.tokenId}`
      );

      const duration = Date.now() - startTime;
      logger.info('Personal access token delete operation completed', {
        tokenId: validatedParams.tokenId,
        duration,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                message: 'Personal access token deleted successfully',
                tokenId: validatedParams.tokenId,
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
      logger.error('Personal access token delete operation failed', { error, duration });

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

// Helper function to transform personal access token data
function transformPersonalAccessToken(data: any): PersonalAccessToken {
  return {
    id: data.id,
    name: data.name,
    token: data.token,
    permissions: data.permissions || [],
    created_date: data.created_date,
    last_authenticated: data.last_authenticated,
    user: {
      name: data.user?.displayName || data.user?.name,
      id: data.user?.id,
      displayName: data.user?.displayName,
      uuid: data.user?.id,
    },
  };
}
