/**
 * List Projects Tool
 * T041: Project MCP tools in src/tools/datacenter/project/
 * 
 * Lists all projects in Bitbucket Data Center
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { ProjectService } from '../../../services/ProjectService.js';
import { serverDetectionService } from '../../../services/server-detection.js';
import { logger } from '../../../utils/logger.js';

// Tool schema
const ListProjectsSchema = z.object({
  start: z.number().min(0).optional(),
  limit: z.number().min(1).max(100).optional(),
  name: z.string().optional(),
  permission: z.string().optional(),
});

export const listProjectsTool: Tool = {
  name: 'mcp_bitbucket_project_list',
  description: 'Lista todos os projetos no Bitbucket Data Center.',
  inputSchema: {
    type: 'object',
    properties: {
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
    }
  }
};

export async function handleListProjects(args: unknown): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const validatedArgs = ListProjectsSchema.parse(args);
    
    // Detect server type
    const serverInfo = await serverDetectionService.detectServerType(process.env.BITBUCKET_URL || '');
    
    if (serverInfo.serverType !== 'datacenter') {
      throw new Error('Esta ferramenta é específica para Bitbucket Data Center');
    }

    // Create project service
    const projectService = new ProjectService();
    
    // List projects
    const projects = await projectService.listProjects({
      serverInfo,
      auth: { access_token: '', token_type: 'Bearer' },
      start: validatedArgs.start,
      limit: validatedArgs.limit,
    });

    logger.info('Projects listed successfully', {
      count: projects.values.length,
      total: projects.size,
    });

    const result = {
      success: true,
      projects: {
        size: projects.size,
        limit: projects.limit,
        isLastPage: projects.isLastPage,
        start: projects.start,
        values: projects.values.map(project => ({
          key: project.key,
          name: project.name,
          description: project.description,
          public: project.isPublic,
          createdDate: project.createdDate,
          updatedDate: project.updatedDate,
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
    logger.error('Failed to list projects', {
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
