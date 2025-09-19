/**
 * Get Avatar Tool
 * T047: Avatar MCP tools in src/tools/shared/avatar/
 * 
 * Gets avatars for both Data Center and Cloud
 */

import { Tool } from '@modelcontextprotocol/sdk/types';
import { z } from 'zod';
import { AvatarService } from '../../../services/AvatarService';
import { serverDetectionService } from '../../../services/server-detection';
import { logger } from '../../../utils/logger';

// Tool schema
const GetAvatarSchema = z.object({
  type: z.enum(['project', 'user', 'group']),
  identifier: z.string().min(1), // projectKey, username, or groupName
  size: z.number().min(16).max(512).optional(),
});

export const getAvatarTool: Tool = {
  name: 'mcp_bitbucket_avatar_get',
  description: 'Obtém avatar de um projeto, usuário ou grupo no Bitbucket.',
  inputSchema: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['project', 'user', 'group'],
        description: 'Tipo de entidade (project, user, group)'
      },
      identifier: {
        type: 'string',
        description: 'Identificador da entidade (projectKey, username, ou groupName)'
      },
      size: {
        type: 'number',
        description: 'Tamanho do avatar em pixels (opcional)',
        minimum: 16,
        maximum: 512
      },
      output: {
        type: 'string',
        enum: ['markdown', 'json'],
        description: 'Formato de saída',
        default: 'json'
      }
    },
    required: ['type', 'identifier']
  }
};

export async function handleGetAvatar(args: unknown): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const validatedArgs = GetAvatarSchema.parse(args);
    
    // Detect server type
    const serverInfo = await serverDetectionService.detectServerType(process.env.BITBUCKET_URL || '');

    // Create avatar service
    const avatarService = new AvatarService(serverInfo, {});
    
    // Get avatar based on type
    let avatar;
    switch (validatedArgs.type) {
      case 'project':
        avatar = await avatarService.getProjectAvatar(validatedArgs.identifier);
        break;
      case 'user':
        avatar = await avatarService.getUserAvatar(validatedArgs.identifier);
        break;
      case 'group':
        avatar = await avatarService.getGroupAvatar(validatedArgs.identifier);
        break;
      default:
        throw new Error(`Invalid avatar type: ${validatedArgs.type}`);
    }

    // Get avatar URL with size if specified
    const avatarUrl = validatedArgs.size 
      ? avatarService.getAvatarUrl(avatar, validatedArgs.size)
      : avatar.url;

    logger.info('Avatar retrieved successfully', {
      type: validatedArgs.type,
      identifier: validatedArgs.identifier,
      size: validatedArgs.size,
      serverType: serverInfo.serverType,
    });

    const result = {
      success: true,
      avatar: {
        id: avatar.id,
        url: avatarUrl,
        size: avatar.size,
        width: avatar.width,
        height: avatar.height,
        type: avatar.type,
        createdDate: avatar.createdDate,
        updatedDate: avatar.updatedDate,
      }
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };

  } catch (error) {
    logger.error('Failed to get avatar', {
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
