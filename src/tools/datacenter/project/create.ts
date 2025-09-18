/**
 * Create Project Tool
 * T041: Project MCP tools in src/tools/datacenter/project/
 * 
 * Creates a new project in Bitbucket Data Center
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { ProjectService } from '../../../services/ProjectService.js';
import { serverDetectionService } from '../../../services/server-detection.js';
import { logger } from '../../../utils/logger.js';

// Tool schema
const CreateProjectSchema = z.object({
  key: z.string().min(1).max(10).regex(/^[A-Z][A-Z0-9]*$/, 'Project key must be uppercase alphanumeric starting with a letter'),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  avatar: z.string().optional(), // Base64 encoded avatar
});

export const createProjectTool: Tool = {
  name: 'mcp_bitbucket_project_create',
  description: 'Cria um novo projeto no Bitbucket Data Center.',
  inputSchema: {
    type: 'object',
    properties: {
      key: {
        type: 'string',
        description: 'Chave única do projeto (máximo 10 caracteres, maiúsculas)',
        minLength: 1,
        maxLength: 10,
        pattern: '^[A-Z][A-Z0-9]*$'
      },
      name: {
        type: 'string',
        description: 'Nome do projeto',
        minLength: 1,
        maxLength: 255
      },
      description: {
        type: 'string',
        description: 'Descrição do projeto (opcional)',
        maxLength: 1000
      },
      avatar: {
        type: 'string',
        description: 'Avatar do projeto em base64 (opcional)'
      },
      output: {
        type: 'string',
        enum: ['markdown', 'json'],
        description: 'Formato de saída',
        default: 'json'
      }
    },
    required: ['key', 'name']
  }
};

export async function handleCreateProject(args: unknown): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const validatedArgs = CreateProjectSchema.parse(args);
    
    // Detect server type
    const serverInfo = await serverDetectionService.detectServerType(process.env.BITBUCKET_URL || '');
    
    if (serverInfo.serverType !== 'datacenter') {
      throw new Error('Esta ferramenta é específica para Bitbucket Data Center');
    }

    // Create project service
    const projectService = new ProjectService();
    
    // Create project
    const project = await projectService.createProject({
      serverInfo,
      auth: { access_token: '', token_type: 'Bearer' },
      key: validatedArgs.key,
      name: validatedArgs.name,
      description: validatedArgs.description,
      avatar: validatedArgs.avatar,
    });

    logger.info('Project created successfully', {
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
      }
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };

  } catch (error) {
    logger.error('Failed to create project', {
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
