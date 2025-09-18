/**
 * Add Permission Tool
 * T045: Permission MCP tools in src/tools/shared/permission/
 * 
 * Adds permissions for both Data Center and Cloud
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { PermissionService } from '../../../services/PermissionService.js';
import { serverDetectionService } from '../../../services/server-detection.js';
import { logger } from '../../../utils/logger.js';

// Tool schema
const AddPermissionSchema = z.object({
  projectKey: z.string().min(1),
  repositorySlug: z.string().optional(),
  user: z.string().optional(),
  group: z.string().optional(),
  permission: z.enum(['PROJECT_READ', 'PROJECT_WRITE', 'PROJECT_ADMIN', 'REPO_READ', 'REPO_WRITE', 'REPO_ADMIN']),
});

export const addPermissionTool: Tool = {
  name: 'mcp_bitbucket_permission_add',
  description: 'Adiciona permissão a um projeto ou repositório no Bitbucket.',
  inputSchema: {
    type: 'object',
    properties: {
      projectKey: {
        type: 'string',
        description: 'Chave do projeto'
      },
      repositorySlug: {
        type: 'string',
        description: 'Slug do repositório (opcional - se não fornecido, adiciona permissão do projeto)'
      },
      user: {
        type: 'string',
        description: 'Nome do usuário (opcional)'
      },
      group: {
        type: 'string',
        description: 'Nome do grupo (opcional)'
      },
      permission: {
        type: 'string',
        enum: ['PROJECT_READ', 'PROJECT_WRITE', 'PROJECT_ADMIN', 'REPO_READ', 'REPO_WRITE', 'REPO_ADMIN'],
        description: 'Nível de permissão'
      },
      output: {
        type: 'string',
        enum: ['markdown', 'json'],
        description: 'Formato de saída',
        default: 'json'
      }
    },
    required: ['projectKey', 'permission']
  }
};

export async function handleAddPermission(args: unknown): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const validatedArgs = AddPermissionSchema.parse(args);
    
    // Validate that either user or group is provided
    if (!validatedArgs.user && !validatedArgs.group) {
      throw new Error('Either user or group must be provided');
    }

    // Validate permission type based on context
    if (validatedArgs.repositorySlug) {
      if (!['REPO_READ', 'REPO_WRITE', 'REPO_ADMIN'].includes(validatedArgs.permission)) {
        throw new Error('Repository permissions must be REPO_READ, REPO_WRITE, or REPO_ADMIN');
      }
    } else {
      if (!['PROJECT_READ', 'PROJECT_WRITE', 'PROJECT_ADMIN'].includes(validatedArgs.permission)) {
        throw new Error('Project permissions must be PROJECT_READ, PROJECT_WRITE, or PROJECT_ADMIN');
      }
    }
    
    // Detect server type
    const serverInfo = await serverDetectionService.detectServerType(process.env.BITBUCKET_URL || '');

    // Create permission service
    const permissionService = new PermissionService(serverInfo, {});
    
    // Add permission
    const permission = validatedArgs.repositorySlug
      ? await permissionService.addRepositoryPermission(
          validatedArgs.projectKey,
          validatedArgs.repositorySlug,
          {
            user: validatedArgs.user,
            group: validatedArgs.group,
            permission: validatedArgs.permission as 'REPO_READ' | 'REPO_WRITE' | 'REPO_ADMIN',
          }
        )
      : await permissionService.addProjectPermission(
          validatedArgs.projectKey,
          {
            user: validatedArgs.user,
            group: validatedArgs.group,
            permission: validatedArgs.permission as 'PROJECT_READ' | 'PROJECT_WRITE' | 'PROJECT_ADMIN',
          }
        );

    logger.info('Permission added successfully', {
      projectKey: validatedArgs.projectKey,
      repositorySlug: validatedArgs.repositorySlug,
      user: validatedArgs.user,
      group: validatedArgs.group,
      permission: validatedArgs.permission,
      serverType: serverInfo.serverType,
    });

    const result = {
      success: true,
      permission: {
        user: permission.user,
        group: permission.group,
        permission: permission.permission,
        grantedBy: permission.grantedBy,
        grantedDate: permission.grantedDate,
      }
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };

  } catch (error) {
    logger.error('Failed to add permission', {
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
