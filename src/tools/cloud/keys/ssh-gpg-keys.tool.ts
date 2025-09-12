import { z } from 'zod';
import { MCPTool, ToolResult } from '@/types/mcp';
import { BitbucketConfig } from '@/types/config';
import { configService } from '@/services/config.service';
import { bitbucketAPIService } from '@/services/bitbucket-api.service';
import { loggerService } from '@/services/logger.service';
import {
  assertApiDataResponse,
  assertPaginatedResponse,
  assertPaginatedDataResponse,
} from '@/integration/api-client';

// List SSH Keys Schema
const ListSSHKeysSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  workspace: z.string().min(1, 'Workspace is required'),
  authType: z.enum(['oauth', 'app_password']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  appPassword: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pagelen: z.number().int().min(1).max(100).default(50),
});

// Create SSH Key Schema
const CreateSSHKeySchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  workspace: z.string().min(1, 'Workspace is required'),
  key: z.string().min(1, 'SSH key is required'),
  label: z.string().min(1, 'Label is required'),
  authType: z.enum(['oauth', 'app_password']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  appPassword: z.string().optional(),
});

// Delete SSH Key Schema
const DeleteSSHKeySchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  workspace: z.string().min(1, 'Workspace is required'),
  keyId: z.string().min(1, 'SSH key ID is required'),
  authType: z.enum(['oauth', 'app_password']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  appPassword: z.string().optional(),
});

// List GPG Keys Schema
const ListGPGKeysSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  workspace: z.string().min(1, 'Workspace is required'),
  authType: z.enum(['oauth', 'app_password']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  appPassword: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pagelen: z.number().int().min(1).max(100).default(50),
});

// Create GPG Key Schema
const CreateGPGKeySchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  workspace: z.string().min(1, 'Workspace is required'),
  key: z.string().min(1, 'GPG key is required'),
  authType: z.enum(['oauth', 'app_password']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  appPassword: z.string().optional(),
});

// Delete GPG Key Schema
const DeleteGPGKeySchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  workspace: z.string().min(1, 'Workspace is required'),
  keyId: z.string().min(1, 'GPG key ID is required'),
  authType: z.enum(['oauth', 'app_password']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  appPassword: z.string().optional(),
});

export const listSSHKeysTool: MCPTool = {
  name: 'mcp_bitbucket_ssh_keys_list',
  description: 'List SSH keys in a Bitbucket Cloud workspace',
  inputSchema: ListSSHKeysSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'listSSHKeys',
      serverType: ['datacenter'],
      operation: 'list_s_s_h_keys',
      category: 'unknown',
    });

    try {
      logger.info('Listing SSH keys', {
        params: { ...(params as Record<string, unknown>), appPassword: '[REDACTED]' },
      });

      const validatedParams = ListSSHKeysSchema.parse(params);
      const config = buildConfig(validatedParams);

      const result = await bitbucketAPIService.get(
        config,
        `/2.0/workspaces/${validatedParams.workspace}/ssh-keys`,
        {
          page: validatedParams.page,
          pagelen: validatedParams.pagelen,
        }
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        const responseData = assertApiDataResponse(result.data);
        const paginatedData = assertPaginatedResponse(responseData.data);
        const sshKeys = paginatedData.values.map(transformSSHKey);

        logger.info('SSH keys listed successfully', {
          count: sshKeys.length,
          workspace: validatedParams.workspace,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  sshKeys,
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
        logger.warn('Failed to list SSH keys', {
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
      logger.error('List SSH keys tool error', {
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

export const createSSHKeyTool: MCPTool = {
  name: 'mcp_bitbucket_ssh_keys_create',
  description: 'Create a new SSH key in Bitbucket Cloud',
  inputSchema: CreateSSHKeySchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'createSSHKey',
      serverType: ['datacenter'],
      operation: 'create_s_s_h_key',
      category: 'unknown',
    });

    try {
      logger.info('Creating SSH key', {
        params: { ...(params as Record<string, unknown>), appPassword: '[REDACTED]' },
      });

      const validatedParams = CreateSSHKeySchema.parse(params);
      const config = buildConfig(validatedParams);

      const sshKeyData = {
        key: validatedParams.key,
        label: validatedParams.label,
      };

      const result = await bitbucketAPIService.post(
        config,
        `/2.0/workspaces/${validatedParams.workspace}/ssh-keys`,
        sshKeyData
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        const sshKey = transformSSHKey(assertPaginatedDataResponse(result.data).data);

        logger.info('SSH key created successfully', {
          keyId: sshKey.uuid,
          workspace: validatedParams.workspace,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  sshKey,
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to create SSH key', {
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
      logger.error('Create SSH key tool error', {
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
  operation: 'create',
};

export const deleteSSHKeyTool: MCPTool = {
  name: 'mcp_bitbucket_ssh_keys_delete',
  description: 'Delete an SSH key in Bitbucket Cloud',
  inputSchema: DeleteSSHKeySchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'deleteSSHKey',
      serverType: ['datacenter'],
      operation: 'delete_s_s_h_key',
      category: 'unknown',
    });

    try {
      logger.info('Deleting SSH key', {
        params: { ...(params as Record<string, unknown>), appPassword: '[REDACTED]' },
      });

      const validatedParams = DeleteSSHKeySchema.parse(params);
      const config = buildConfig(validatedParams);

      const result = await bitbucketAPIService.delete(
        config,
        `/2.0/workspaces/${validatedParams.workspace}/ssh-keys/${validatedParams.keyId}`
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        logger.info('SSH key deleted successfully', {
          keyId: validatedParams.keyId,
          workspace: validatedParams.workspace,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: 'SSH key deleted successfully',
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to delete SSH key', {
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
      logger.error('Delete SSH key tool error', {
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
  operation: 'delete',
};

export const listGPGKeysTool: MCPTool = {
  name: 'mcp_bitbucket_gpg_keys_list',
  description: 'List GPG keys in a Bitbucket Cloud workspace',
  inputSchema: ListGPGKeysSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'listGPGKeys',
      serverType: ['datacenter'],
      operation: 'list_g_p_g_keys',
      category: 'unknown',
    });

    try {
      logger.info('Listing GPG keys', {
        params: { ...(params as Record<string, unknown>), appPassword: '[REDACTED]' },
      });

      const validatedParams = ListGPGKeysSchema.parse(params);
      const config = buildConfig(validatedParams);

      const result = await bitbucketAPIService.get(
        config,
        `/2.0/workspaces/${validatedParams.workspace}/gpg-keys`,
        {
          page: validatedParams.page,
          pagelen: validatedParams.pagelen,
        }
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        const gpgKeys = assertPaginatedDataResponse(result.data).data.values.map(transformGPGKey);

        logger.info('GPG keys listed successfully', {
          count: gpgKeys.length,
          workspace: validatedParams.workspace,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  gpgKeys,
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
        logger.warn('Failed to list GPG keys', {
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
      logger.error('List GPG keys tool error', {
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

export const createGPGKeyTool: MCPTool = {
  name: 'mcp_bitbucket_gpg_keys_create',
  description: 'Create a new GPG key in Bitbucket Cloud',
  inputSchema: CreateGPGKeySchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'createGPGKey',
      serverType: ['datacenter'],
      operation: 'create_g_p_g_key',
      category: 'unknown',
    });

    try {
      logger.info('Creating GPG key', {
        params: { ...(params as Record<string, unknown>), appPassword: '[REDACTED]' },
      });

      const validatedParams = CreateGPGKeySchema.parse(params);
      const config = buildConfig(validatedParams);

      const gpgKeyData = {
        key: validatedParams.key,
      };

      const result = await bitbucketAPIService.post(
        config,
        `/2.0/workspaces/${validatedParams.workspace}/gpg-keys`,
        gpgKeyData
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        const gpgKey = transformGPGKey(assertPaginatedDataResponse(result.data).data);

        logger.info('GPG key created successfully', {
          keyId: gpgKey.uuid,
          workspace: validatedParams.workspace,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  gpgKey,
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to create GPG key', {
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
      logger.error('Create GPG key tool error', {
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
  operation: 'create',
};

export const deleteGPGKeyTool: MCPTool = {
  name: 'mcp_bitbucket_gpg_keys_delete',
  description: 'Delete a GPG key in Bitbucket Cloud',
  inputSchema: DeleteGPGKeySchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', {
      tool: 'deleteGPGKey',
      serverType: ['datacenter'],
      operation: 'delete_g_p_g_key',
      category: 'unknown',
    });

    try {
      logger.info('Deleting GPG key', {
        params: { ...(params as Record<string, unknown>), appPassword: '[REDACTED]' },
      });

      const validatedParams = DeleteGPGKeySchema.parse(params);
      const config = buildConfig(validatedParams);

      const result = await bitbucketAPIService.delete(
        config,
        `/2.0/workspaces/${validatedParams.workspace}/gpg-keys/${validatedParams.keyId}`
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        logger.info('GPG key deleted successfully', {
          keyId: validatedParams.keyId,
          workspace: validatedParams.workspace,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: 'GPG key deleted successfully',
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to delete GPG key', {
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
      logger.error('Delete GPG key tool error', {
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
  operation: 'delete',
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

function transformSSHKey(data: any): any {
  return {
    uuid: data.uuid,
    key: data.key,
    label: data.label,
    createdOn: data.created_on,
    lastUsed: data.last_used,
    // links: { ... }, // Propriedade não existe no tipo
  };
}

function transformGPGKey(data: any): any {
  return {
    uuid: data.uuid,
    key: data.key,
    createdOn: data.created_on,
    lastUsed: data.last_used,
    // links: { ... }, // Propriedade não existe no tipo
  };
}
