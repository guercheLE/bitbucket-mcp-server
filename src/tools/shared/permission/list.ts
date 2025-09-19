/**
 * List Permissions Tool
 * T045: Permission MCP tools in src/tools/shared/permission/
 * 
 * Lists permissions for both Data Center and Cloud
 */

import { Tool } from '@modelcontextprotocol/sdk/types';
import { z } from 'zod';
import { PermissionService } from '../../../services/PermissionService';
import { serverDetectionService } from '../../../services/server-detection';
import { logger } from '../../../utils/logger';

// Tool schema
const ListPermissionsSchema = z.object({
  projectKey: z.string().min(1),
  repositorySlug: z.string().optional(),
  start: z.number().min(0).optional(),
  limit: z.number().min(1).max(100).optional(),
  permission: z.string().optional(),
});

export const listPermissionsTool: Tool = {
  name: 'mcp_bitbucket_permission_list',
  description: 'Lista permissões de um projeto ou repositório no Bitbucket.',
  inputSchema: {
    type: 'object',
    properties: {
      projectKey: {
        type: 'string',
        description: 'Chave do projeto'
      },
      repositorySlug: {
        type: 'string',
        description: 'Slug do repositório (opcional - se não fornecido, lista permissões do projeto)'
      },
      start: {
        type: 'number',
        description: 'Índice inicial (opcional)',
        minimum: 0
      },
      limit: {
        type: 'number',
        description: 'Limite de resultados (opcional)',
        minimum: 1,
        maximum: 100
      },
      permission: {
        type: 'string',
        description: 'Filtro por permissão (opcional)'
      },
      output: {
        type: 'string',
        enum: ['markdown', 'json'],
        description: 'Formato de saída',
        default: 'json'
      }
    },
    required: ['projectKey']
  }
};

export async function handleListPermissions(args: unknown): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const validatedArgs = ListPermissionsSchema.parse(args);
    
    // Detect server type
    const serverInfo = await serverDetectionService.detectServerType(process.env.BITBUCKET_URL || '');

    // Create permission service
    const permissionService = new PermissionService(serverInfo, {});
    
    // List permissions
    const permissions = validatedArgs.repositorySlug
      ? await permissionService.getRepositoryPermissions(
          validatedArgs.projectKey,
          validatedArgs.repositorySlug,
          {
            start: validatedArgs.start,
            limit: validatedArgs.limit,
            permission: validatedArgs.permission,
          }
        )
      : await permissionService.getProjectPermissions(
          validatedArgs.projectKey,
          {
            start: validatedArgs.start,
            limit: validatedArgs.limit,
            permission: validatedArgs.permission,
          }
        );

    logger.info('Permissions listed successfully', {
      projectKey: validatedArgs.projectKey,
      repositorySlug: validatedArgs.repositorySlug,
      count: permissions.values.length,
      total: permissions.size,
      serverType: serverInfo.serverType,
    });

    const result = {
      success: true,
      permissions: {
        size: permissions.size,
        limit: permissions.limit,
        isLastPage: permissions.isLastPage,
        start: permissions.start,
        values: permissions.values.map(permission => ({
          user: permission.user,
          group: permission.group,
          permission: permission.permission,
          grantedBy: permission.grantedBy,
          grantedDate: permission.grantedDate,
        }))
      }
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };

  } catch (error) {
    logger.error('Failed to list permissions', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const errorResult = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(errorResult, null, 2)
      }]
    };
  }
}
