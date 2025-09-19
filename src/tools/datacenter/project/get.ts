/**
 * Get Project Tool
 * T041: Project MCP tools in src/tools/datacenter/project/
 * 
 * Gets a specific project from Bitbucket Data Center
 */

import { Tool } from '@modelcontextprotocol/sdk/types';
import { z } from 'zod';
import { ProjectService } from '../../../services/ProjectService';
import { serverDetectionService } from '../../../services/server-detection';
import { logger } from '../../../utils/logger';

// Tool schema
const GetProjectSchema = z.object({
  projectKey: z.string().min(1),
});

export const getProjectTool: Tool = {
  name: 'mcp_bitbucket_project_get',
  description: 'Obtém um projeto específico no Bitbucket Data Center.',
  inputSchema: {
    type: 'object',
    properties: {
      projectKey: {
        type: 'string',
        description: 'Chave do projeto'
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

export async function handleGetProject(args: unknown): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const validatedArgs = GetProjectSchema.parse(args);
    
    // Detect server type
    const serverInfo = await serverDetectionService.detectServerType(process.env.BITBUCKET_URL || '');
    
    if (serverInfo.serverType !== 'datacenter') {
      throw new Error('Esta ferramenta é específica para Bitbucket Data Center');
    }

    // Create project service
    const projectService = new ProjectService();
    
    // Get project
    const project = await projectService.getProject({
      serverInfo,
      auth: { access_token: '', token_type: 'Bearer' },
      projectKey: validatedArgs.projectKey,
    });

    logger.info('Project retrieved successfully', {
      projectKey: project.key,
      projectName: project.name,
    });

    const result = {
      success: true,
      project: {
        key: project.key,
        name: project.name,
        description: project.description,
        public: project.isPublic,
        createdDate: project.createdDate,
        updatedDate: project.updatedDate,
        links: project.links,
      }
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };

  } catch (error) {
    logger.error('Failed to get project', {
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
