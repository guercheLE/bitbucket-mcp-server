import { z } from 'zod';
import { MCPTool, ToolResult } from '@/types/mcp';
import { BitbucketConfig } from '@/types/config';
import { OAuthApplication, OAuthToken } from '@/types/datacenter';
import { configService } from '@/services/config.service';
import { bitbucketAPIService } from '@/services/bitbucket-api.service';
import { loggerService } from '@/services/logger.service';
import { assertApiResponse } from '@/integration/api-client';

// List OAuth Applications Schema
const ListOAuthApplicationsSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
  start: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(100).default(25),
});

// Get OAuth Application Schema
const GetOAuthApplicationSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  applicationId: z.string().min(1, 'Application ID is required'),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

// Create OAuth Application Schema
const CreateOAuthApplicationSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  name: z.string().min(1, 'Application name is required'),
  description: z.string().optional(),
  url: z.string().url().optional(),
  callbackUrl: z.string().url().optional(),
  scopes: z
    .array(
      z.enum([
        'REPO_READ',
        'REPO_WRITE',
        'REPO_ADMIN',
        'PROJECT_READ',
        'PROJECT_WRITE',
        'PROJECT_ADMIN',
        'USER',
      ])
    )
    .default([]),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

// Update OAuth Application Schema
const UpdateOAuthApplicationSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  applicationId: z.string().min(1, 'Application ID is required'),
  name: z.string().optional(),
  description: z.string().optional(),
  url: z.string().url().optional(),
  callbackUrl: z.string().url().optional(),
  scopes: z
    .array(
      z.enum([
        'REPO_READ',
        'REPO_WRITE',
        'REPO_ADMIN',
        'PROJECT_READ',
        'PROJECT_WRITE',
        'PROJECT_ADMIN',
        'USER',
      ])
    )
    .optional(),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

// Delete OAuth Application Schema
const DeleteOAuthApplicationSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  applicationId: z.string().min(1, 'Application ID is required'),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

// List OAuth Tokens Schema
const ListOAuthTokensSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
  start: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(100).default(25),
});

// Get OAuth Token Schema
const GetOAuthTokenSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  tokenId: z.string().min(1, 'Token ID is required'),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

// Create OAuth Token Schema
const CreateOAuthTokenSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  applicationId: z.string().min(1, 'Application ID is required'),
  name: z.string().min(1, 'Token name is required'),
  scopes: z.array(z.string()).default([]),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

// Delete OAuth Token Schema
const DeleteOAuthTokenSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  tokenId: z.string().min(1, 'Token ID is required'),
  authType: z.enum(['oauth', 'api_token', 'basic']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  password: z.string().optional(),
});

export const listOAuthApplicationsTool: MCPTool = {
  name: 'mcp_bitbucket_oauth_list_applications',
  description: 'List OAuth applications in Bitbucket Data Center',
  inputSchema: ListOAuthApplicationsSchema.shape,
  serverType: ['datacenter'],
  category: 'oauth',
  operation: 'list',
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'listOAuthApplications',
      serverType: ['datacenter'],
      operation: 'list_o_auth_applications',
      category: 'unknown',
    });

    try {
      logger.info('Starting OAuth application list operation', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      // Validate input parameters
      const validatedParams = ListOAuthApplicationsSchema.parse(params);

      // Build configuration
      const config: BitbucketConfig = buildConfig(validatedParams);

      // Build query parameters
      const queryParams: Record<string, string> = {
        start: validatedParams.start.toString(),
        limit: validatedParams.limit.toString(),
      };

      // Make API call
      const response = await bitbucketAPIService.get(
        config,
        '/rest/oauth/1.0/applications',
        queryParams
      );

      // Transform response
      const responseData = assertApiResponse(response.data) as any;
      const applications = responseData.values?.map(transformOAuthApplication) || [];

      const duration = Date.now() - startTime;
      logger.info('OAuth application list operation completed', {
        count: applications.length,
        duration,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                applications,
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
      logger.error('OAuth application list operation failed', { error, duration });

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

export const getOAuthApplicationTool: MCPTool = {
  name: 'mcp_bitbucket_oauth_get_application',
  description: 'Get a specific OAuth application from Bitbucket Data Center',
  inputSchema: GetOAuthApplicationSchema.shape,
  serverType: ['datacenter'],
  category: 'oauth',
  operation: 'get',
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'getOAuthApplication',
      serverType: ['datacenter'],
      operation: 'get_o_auth_application',
      category: 'unknown',
    });

    try {
      logger.info('Starting OAuth application get operation', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      // Validate input parameters
      const validatedParams = GetOAuthApplicationSchema.parse(params);

      // Build configuration
      const config: BitbucketConfig = buildConfig(validatedParams);

      // Make API call
      const response = await bitbucketAPIService.get(
        config,
        `/rest/oauth/1.0/applications/${validatedParams.applicationId}`
      );

      // Transform response
      const application = transformOAuthApplication(assertApiResponse(response.data));

      const duration = Date.now() - startTime;
      logger.info('OAuth application get operation completed', {
        applicationId: validatedParams.applicationId,
        duration,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(application, null, 2),
          },
        ],
        isError: false,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('OAuth application get operation failed', { error, duration });

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

export const createOAuthApplicationTool: MCPTool = {
  name: 'mcp_bitbucket_oauth_create_application',
  description: 'Create a new OAuth application in Bitbucket Data Center',
  inputSchema: CreateOAuthApplicationSchema.shape,
  serverType: ['datacenter'],
  category: 'oauth',
  operation: 'create',
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'createOAuthApplication',
      serverType: ['datacenter'],
      operation: 'create_o_auth_application',
      category: 'unknown',
    });

    try {
      logger.info('Starting OAuth application create operation', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      // Validate input parameters
      const validatedParams = CreateOAuthApplicationSchema.parse(params);

      // Build configuration
      const config: BitbucketConfig = buildConfig(validatedParams);

      // Build request body
      const requestBody = {
        name: validatedParams.name,
        description: validatedParams.description,
        url: validatedParams.url,
        callback_url: validatedParams.callbackUrl,
        scopes: validatedParams.scopes,
      };

      // Make API call
      const response = await bitbucketAPIService.post(
        config,
        '/rest/oauth/1.0/applications',
        requestBody
      );

      // Transform response
      const application = transformOAuthApplication(assertApiResponse(response.data));

      const duration = Date.now() - startTime;
      logger.info('OAuth application create operation completed', {
        applicationId: application.id,
        duration,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(application, null, 2),
          },
        ],
        isError: false,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('OAuth application create operation failed', { error, duration });

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

export const updateOAuthApplicationTool: MCPTool = {
  name: 'mcp_bitbucket_oauth_update_application',
  description: 'Update an OAuth application in Bitbucket Data Center',
  inputSchema: UpdateOAuthApplicationSchema.shape,
  serverType: ['datacenter'],
  category: 'oauth',
  operation: 'update',
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'updateOAuthApplication',
      serverType: ['datacenter'],
      operation: 'update_o_auth_application',
      category: 'unknown',
    });

    try {
      logger.info('Starting OAuth application update operation', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      // Validate input parameters
      const validatedParams = UpdateOAuthApplicationSchema.parse(params);

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

      if (validatedParams.url !== undefined) {
        requestBody['url'] = validatedParams.url;
      }

      if (validatedParams.callbackUrl !== undefined) {
        requestBody['callback_url'] = validatedParams.callbackUrl;
      }

      if (validatedParams.scopes !== undefined) {
        requestBody['scopes'] = validatedParams.scopes;
      }

      // Make API call
      const response = await bitbucketAPIService.put(
        config,
        `/rest/oauth/1.0/applications/${validatedParams.applicationId}`,
        requestBody
      );

      // Transform response
      const application = transformOAuthApplication(assertApiResponse(response.data));

      const duration = Date.now() - startTime;
      logger.info('OAuth application update operation completed', {
        applicationId: validatedParams.applicationId,
        duration,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(application, null, 2),
          },
        ],
        isError: false,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('OAuth application update operation failed', { error, duration });

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

export const deleteOAuthApplicationTool: MCPTool = {
  name: 'mcp_bitbucket_oauth_delete_application',
  description: 'Delete an OAuth application from Bitbucket Data Center',
  inputSchema: DeleteOAuthApplicationSchema.shape,
  serverType: ['datacenter'],
  category: 'oauth',
  operation: 'delete',
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'deleteOAuthApplication',
      serverType: ['datacenter'],
      operation: 'delete_o_auth_application',
      category: 'unknown',
    });

    try {
      logger.info('Starting OAuth application delete operation', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      // Validate input parameters
      const validatedParams = DeleteOAuthApplicationSchema.parse(params);

      // Build configuration
      const config: BitbucketConfig = buildConfig(validatedParams);

      // Make API call
      await bitbucketAPIService.delete(
        config,
        `/rest/oauth/1.0/applications/${validatedParams.applicationId}`
      );

      const duration = Date.now() - startTime;
      logger.info('OAuth application delete operation completed', {
        applicationId: validatedParams.applicationId,
        duration,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                message: 'OAuth application deleted successfully',
                applicationId: validatedParams.applicationId,
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
      logger.error('OAuth application delete operation failed', { error, duration });

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

export const listOAuthTokensTool: MCPTool = {
  name: 'mcp_bitbucket_oauth_list_tokens',
  description: 'List OAuth tokens in Bitbucket Data Center',
  inputSchema: ListOAuthTokensSchema.shape,
  serverType: ['datacenter'],
  category: 'oauth',
  operation: 'list',
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'listOAuthTokens',
      serverType: ['datacenter'],
      operation: 'list_o_auth_tokens',
      category: 'unknown',
    });

    try {
      logger.info('Starting OAuth token list operation', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      // Validate input parameters
      const validatedParams = ListOAuthTokensSchema.parse(params);

      // Build configuration
      const config: BitbucketConfig = buildConfig(validatedParams);

      // Build query parameters
      const queryParams: Record<string, string> = {
        start: validatedParams.start.toString(),
        limit: validatedParams.limit.toString(),
      };

      // Make API call
      const response = await bitbucketAPIService.get(config, '/rest/oauth/1.0/tokens', queryParams);

      // Transform response
      const responseData = assertApiResponse(response.data) as any;
      const tokens = responseData.values?.map(transformOAuthToken) || [];

      const duration = Date.now() - startTime;
      logger.info('OAuth token list operation completed', {
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
      logger.error('OAuth token list operation failed', { error, duration });

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

export const getOAuthTokenTool: MCPTool = {
  name: 'mcp_bitbucket_oauth_get_token',
  description: 'Get a specific OAuth token from Bitbucket Data Center',
  inputSchema: GetOAuthTokenSchema.shape,
  serverType: ['datacenter'],
  category: 'oauth',
  operation: 'get',
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'getOAuthToken',
      serverType: ['datacenter'],
      operation: 'get_o_auth_token',
      category: 'unknown',
    });

    try {
      logger.info('Starting OAuth token get operation', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      // Validate input parameters
      const validatedParams = GetOAuthTokenSchema.parse(params);

      // Build configuration
      const config: BitbucketConfig = buildConfig(validatedParams);

      // Make API call
      const response = await bitbucketAPIService.get(
        config,
        `/rest/oauth/1.0/tokens/${validatedParams.tokenId}`
      );

      // Transform response
      const token = transformOAuthToken(assertApiResponse(response.data));

      const duration = Date.now() - startTime;
      logger.info('OAuth token get operation completed', {
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
      logger.error('OAuth token get operation failed', { error, duration });

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

export const createOAuthTokenTool: MCPTool = {
  name: 'mcp_bitbucket_oauth_create_token',
  description: 'Create a new OAuth token in Bitbucket Data Center',
  inputSchema: CreateOAuthTokenSchema.shape,
  serverType: ['datacenter'],
  category: 'oauth',
  operation: 'create',
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'createOAuthToken',
      serverType: ['datacenter'],
      operation: 'create_o_auth_token',
      category: 'unknown',
    });

    try {
      logger.info('Starting OAuth token create operation', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      // Validate input parameters
      const validatedParams = CreateOAuthTokenSchema.parse(params);

      // Build configuration
      const config: BitbucketConfig = buildConfig(validatedParams);

      // Build request body
      const requestBody = {
        applicationId: validatedParams.applicationId,
        name: validatedParams.name,
        scopes: validatedParams.scopes,
      };

      // Make API call
      const response = await bitbucketAPIService.post(
        config,
        '/rest/oauth/1.0/tokens',
        requestBody
      );

      // Transform response
      const token = transformOAuthToken(assertApiResponse(response.data));

      const duration = Date.now() - startTime;
      logger.info('OAuth token create operation completed', {
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
      logger.error('OAuth token create operation failed', { error, duration });

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

export const deleteOAuthTokenTool: MCPTool = {
  name: 'mcp_bitbucket_oauth_delete_token',
  description: 'Delete an OAuth token from Bitbucket Data Center',
  inputSchema: DeleteOAuthTokenSchema.shape,
  serverType: ['datacenter'],
  category: 'oauth',
  operation: 'delete',
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'deleteOAuthToken',
      serverType: ['datacenter'],
      operation: 'delete_o_auth_token',
      category: 'unknown',
    });

    try {
      logger.info('Starting OAuth token delete operation', {
        params: {
          ...(params as Record<string, unknown>),
          token: '[REDACTED]',
          password: '[REDACTED]',
        },
      });

      // Validate input parameters
      const validatedParams = DeleteOAuthTokenSchema.parse(params);

      // Build configuration
      const config: BitbucketConfig = buildConfig(validatedParams);

      // Make API call
      await bitbucketAPIService.delete(config, `/rest/oauth/1.0/tokens/${validatedParams.tokenId}`);

      const duration = Date.now() - startTime;
      logger.info('OAuth token delete operation completed', {
        tokenId: validatedParams.tokenId,
        duration,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                message: 'OAuth token deleted successfully',
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
      logger.error('OAuth token delete operation failed', { error, duration });

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
          clientId: params.clientId || '',
          clientSecret: params.clientSecret || '',
          tokenType: 'Bearer',
          accessToken: params.accessToken,
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

// Helper function to transform OAuth application data
function transformOAuthApplication(data: any): OAuthApplication {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    // url: data.url, // Propriedade não existe no tipo
    callback_url: data.callback_url,
    client_id: data.client_id,
    client_secret: data.client_secret,
    scopes: data.scopes || [],
    created_date: data.created_date,
    updated_date: data.updated_date,
  };
}

// Helper function to transform OAuth token data
function transformOAuthToken(data: any): OAuthToken {
  return {
    id: data.id,
    name: data.name,
    created_date: data.created_date,
    expires_date: data.expires_date,
    scopes: data.scopes || [],
    access_token: data.access_token,
    token_type: data.token_type || 'Bearer',
    expires_in: data.expires_in,
    refresh_token: data.refresh_token,
    scope: data.scope || 'PROJECT',
  };
}
