/**
 * List Repositories Tool
 * T042: Repository MCP tools in src/tools/datacenter/repository/
 * 
 * Lists repositories in a project from Bitbucket Data Center
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { RepositoryService } from '../../../services/RepositoryService.js';
import { serverDetectionService } from '../../../services/server-detection.js';
import { logger } from '../../../utils/logger.js';

// Tool schema
const ListRepositoriesSchema = z.object({
  projectKey: z.string().min(1),
  start: z.number().min(0).optional(),
  limit: z.number().min(1).max(100).optional(),
  name: z.string().optional(),
  permission: z.string().optional(),
});

export const listRepositoriesTool: Tool = {
  name: 'mcp_bitbucket_repository_list',
  description: 'Lista todos os repositórios de um projeto no Bitbucket Data Center.',
  inputSchema: {
    type: 'object',
    properties: {
      projectKey: {
        type: 'string',
        description: 'Chave do projeto'
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
      name: {
        type: 'string',
        description: 'Filtro por nome (opcional)'
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

export async function handleListRepositories(args: unknown): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const validatedArgs = ListRepositoriesSchema.parse(args);
    
    // Detect server type
    const serverInfo = await serverDetectionService.detectServerType(process.env.BITBUCKET_URL || '');
    
    if (serverInfo.serverType !== 'datacenter') {
      throw new Error('Esta ferramenta é específica para Bitbucket Data Center');
    }

    // Create repository service
    const repositoryService = new RepositoryService(serverInfo, {});
    
    // List repositories
    const repositories = await repositoryService.listRepositories(validatedArgs.projectKey, {
      start: validatedArgs.start,
      limit: validatedArgs.limit,
      name: validatedArgs.name,
      permission: validatedArgs.permission,
    });

    logger.info('Repositories listed successfully', {
      projectKey: validatedArgs.projectKey,
      count: repositories.values.length,
      total: repositories.size,
    });

    const result = {
      success: true,
      repositories: {
        size: repositories.size,
        limit: repositories.limit,
        isLastPage: repositories.isLastPage,
        start: repositories.start,
        values: repositories.values.map(repository => ({
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
    logger.error('Failed to list repositories', {
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
