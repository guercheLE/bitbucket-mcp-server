/**
 * Create Repository Tool
 * T042: Repository MCP tools in src/tools/datacenter/repository/
 * 
 * Creates a new repository in Bitbucket Data Center
 */

import { Tool } from '@modelcontextprotocol/sdk/types';
import { z } from 'zod';
import { RepositoryService } from '../../../services/RepositoryService';
import { serverDetectionService } from '../../../services/server-detection';
import { logger } from '../../../utils/logger';

// Tool schema
const CreateRepositorySchema = z.object({
  projectKey: z.string().min(1),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  public: z.boolean().optional(),
  forkable: z.boolean().optional(),
});

export const createRepositoryTool: Tool = {
  name: 'mcp_bitbucket_repository_create',
  description: 'Cria um novo repositório no Bitbucket Data Center.',
  inputSchema: {
    type: 'object',
    properties: {
      projectKey: {
        type: 'string',
        description: 'Chave do projeto'
      },
      name: {
        type: 'string',
        description: 'Nome do repositório',
        minLength: 1,
        maxLength: 255
      },
      description: {
        type: 'string',
        description: 'Descrição do repositório (opcional)',
        maxLength: 1000
      },
      public: {
        type: 'boolean',
        description: 'Se é público (opcional)'
      },
      forkable: {
        type: 'boolean',
        description: 'Se pode ser forkado (opcional)'
      },
      output: {
        type: 'string',
        enum: ['markdown', 'json'],
        description: 'Formato de saída',
        default: 'json'
      }
    },
    required: ['projectKey', 'name']
  }
};

export async function handleCreateRepository(args: unknown): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const validatedArgs = CreateRepositorySchema.parse(args);
    
    // Detect server type
    const serverInfo = await serverDetectionService.detectServerType(process.env.BITBUCKET_URL || '');
    
    if (serverInfo.serverType !== 'datacenter') {
      throw new Error('Esta ferramenta é específica para Bitbucket Data Center');
    }

    // Create repository service
    const repositoryService = new RepositoryService(serverInfo, {});
    
    // Create repository
    const repository = await repositoryService.createRepository(validatedArgs.projectKey, {
      name: validatedArgs.name,
      description: validatedArgs.description,
      public: validatedArgs.public,
      forkable: validatedArgs.forkable,
    });

    logger.info('Repository created successfully', {
      projectKey: validatedArgs.projectKey,
      repositorySlug: repository.slug,
      repositoryName: repository.name,
    });

    const result = {
      success: true,
      repository: {
        id: repository.id,
        slug: repository.slug,
        name: repository.name,
        description: repository.description,
        public: repository.public,
        forkable: repository.forkable,
        project: repository.project,
        createdDate: repository.createdDate,
        updatedDate: repository.updatedDate,
        size: repository.size,
        defaultBranch: repository.defaultBranch,
      }
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };

  } catch (error) {
    logger.error('Failed to create repository', {
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
