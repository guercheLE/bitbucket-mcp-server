/**
 * Upload Avatar Tool
 * T047: Avatar MCP tools in src/tools/shared/avatar/
 * 
 * Uploads avatars for both Data Center and Cloud
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { AvatarService } from '../../../services/AvatarService.js';
import { serverDetectionService } from '../../../services/server-detection.js';
import { logger } from '../../../utils/logger.js';

// Tool schema
const UploadAvatarSchema = z.object({
  type: z.enum(['project', 'user', 'group']),
  identifier: z.string().min(1), // projectKey, username, or groupName
  avatar: z.string(), // Base64 encoded image data
  contentType: z.enum(['image/png', 'image/jpeg', 'image/gif']),
});

export const uploadAvatarTool: Tool = {
  name: 'mcp_bitbucket_avatar_upload',
  description: 'Faz upload de avatar para um projeto, usuário ou grupo no Bitbucket.',
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
      avatar: {
        type: 'string',
        description: 'Dados do avatar em base64'
      },
      contentType: {
        type: 'string',
        enum: ['image/png', 'image/jpeg', 'image/gif'],
        description: 'Tipo de conteúdo da imagem'
      },
      output: {
        type: 'string',
        enum: ['markdown', 'json'],
        description: 'Formato de saída',
        default: 'json'
      }
    },
    required: ['type', 'identifier', 'avatar', 'contentType']
  }
};

export async function handleUploadAvatar(args: unknown): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const validatedArgs = UploadAvatarSchema.parse(args);
    
    // Detect server type
    const serverInfo = await serverDetectionService.detectServerType(process.env.BITBUCKET_URL || '');

    // Create avatar service
    const avatarService = new AvatarService(serverInfo, {});
    
    // Validate avatar data
    const validation = avatarService.validateAvatarData({
      avatar: validatedArgs.avatar,
      contentType: validatedArgs.contentType,
    });

    if (!validation.valid) {
      throw new Error(`Invalid avatar data: ${validation.errors.join(', ')}`);
    }
    
    // Upload avatar based on type
    let avatar;
    switch (validatedArgs.type) {
      case 'project':
        avatar = await avatarService.uploadProjectAvatar(validatedArgs.identifier, {
          avatar: validatedArgs.avatar,
          contentType: validatedArgs.contentType,
        });
        break;
      case 'user':
        avatar = await avatarService.uploadUserAvatar(validatedArgs.identifier, {
          avatar: validatedArgs.avatar,
          contentType: validatedArgs.contentType,
        });
        break;
      case 'group':
        avatar = await avatarService.uploadGroupAvatar(validatedArgs.identifier, {
          avatar: validatedArgs.avatar,
          contentType: validatedArgs.contentType,
        });
        break;
      default:
        throw new Error(`Invalid avatar type: ${validatedArgs.type}`);
    }

    logger.info('Avatar uploaded successfully', {
      type: validatedArgs.type,
      identifier: validatedArgs.identifier,
      contentType: validatedArgs.contentType,
      serverType: serverInfo.serverType,
    });

    const result = {
      success: true,
      avatar: {
        id: avatar.id,
        url: avatar.url,
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
    logger.error('Failed to upload avatar', {
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
