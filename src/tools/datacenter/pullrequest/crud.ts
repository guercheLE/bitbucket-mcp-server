import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { pullRequestService } from '../../../services/pullrequest-service';
import { detectServer } from '../../../services/server-detection';

/**
 * Pull Request CRUD Tools for Bitbucket Data Center
 * T022: Pull request CRUD tools in src/tools/datacenter/pullrequest/crud.ts
 * 
 * MCP tools for pull request CRUD operations
 * Based on contracts/pull-request-crud.yaml specifications
 */

// Input schemas for MCP tools
const CreatePullRequestInputSchema = z.object({
  projectKey: z.string().min(1, 'Project key is required'),
  repositorySlug: z.string().min(1, 'Repository slug is required'),
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().max(32768, 'Description too long').optional(),
  fromRef: z.string().min(1, 'Source branch is required'),
  toRef: z.string().min(1, 'Target branch is required'),
  reviewers: z.array(z.string()).optional(),
  closeSourceBranch: z.boolean().optional(),
  serverUrl: z.string().url('Invalid server URL'),
  accessToken: z.string().min(1, 'Access token is required'),
  tokenType: z.string().default('Bearer')
});

const GetPullRequestInputSchema = z.object({
  projectKey: z.string().min(1, 'Project key is required'),
  repositorySlug: z.string().min(1, 'Repository slug is required'),
  pullRequestId: z.number().int().positive('Pull request ID must be positive'),
  serverUrl: z.string().url('Invalid server URL'),
  accessToken: z.string().min(1, 'Access token is required'),
  tokenType: z.string().default('Bearer')
});

const UpdatePullRequestInputSchema = z.object({
  projectKey: z.string().min(1, 'Project key is required'),
  repositorySlug: z.string().min(1, 'Repository slug is required'),
  pullRequestId: z.number().int().positive('Pull request ID must be positive'),
  version: z.number().int().nonnegative('Version must be non-negative'),
  title: z.string().min(1, 'Title is required').max(255, 'Title too long').optional(),
  description: z.string().max(32768, 'Description too long').optional(),
  reviewers: z.array(z.string()).optional(),
  closeSourceBranch: z.boolean().optional(),
  serverUrl: z.string().url('Invalid server URL'),
  accessToken: z.string().min(1, 'Access token is required'),
  tokenType: z.string().default('Bearer')
});

const DeletePullRequestInputSchema = z.object({
  projectKey: z.string().min(1, 'Project key is required'),
  repositorySlug: z.string().min(1, 'Repository slug is required'),
  pullRequestId: z.number().int().positive('Pull request ID must be positive'),
  serverUrl: z.string().url('Invalid server URL'),
  accessToken: z.string().min(1, 'Access token is required'),
  tokenType: z.string().default('Bearer')
});

const ListPullRequestsInputSchema = z.object({
  projectKey: z.string().min(1, 'Project key is required'),
  repositorySlug: z.string().min(1, 'Repository slug is required'),
  state: z.enum(['OPEN', 'MERGED', 'DECLINED', 'SUPERSEDED', 'DRAFT']).optional(),
  start: z.number().int().nonnegative('Start must be non-negative').optional(),
  limit: z.number().int().positive('Limit must be positive').optional(),
  serverUrl: z.string().url('Invalid server URL'),
  accessToken: z.string().min(1, 'Access token is required'),
  tokenType: z.string().default('Bearer')
});

/**
 * Creates a new pull request
 */
export const createPullRequestTool: Tool = {
  name: 'mcp_bitbucket_pull_request_create',
  description: 'Cria um novo pull request no Bitbucket Data Center.',
  inputSchema: {
    type: 'object',
    properties: {
      projectKey: {
        type: 'string',
        description: 'Chave do projeto'
      },
      repositorySlug: {
        type: 'string',
        description: 'Slug do repositório'
      },
      title: {
        type: 'string',
        description: 'Título do pull request'
      },
      description: {
        type: 'string',
        description: 'Descrição do pull request (opcional)'
      },
      fromRef: {
        type: 'string',
        description: 'Branch de origem'
      },
      toRef: {
        type: 'string',
        description: 'Branch de destino'
      },
      reviewers: {
        type: 'array',
        items: { type: 'string' },
        description: 'Lista de revisores (opcional)'
      },
      closeSourceBranch: {
        type: 'boolean',
        description: 'Se deve fechar a branch de origem após merge (opcional)'
      },
      serverUrl: {
        type: 'string',
        description: 'URL do servidor Bitbucket'
      },
      accessToken: {
        type: 'string',
        description: 'Token de acesso'
      },
      tokenType: {
        type: 'string',
        description: 'Tipo do token (padrão: Bearer)'
      }
    },
    required: ['projectKey', 'repositorySlug', 'title', 'fromRef', 'toRef', 'serverUrl', 'accessToken']
  }
};

export async function createPullRequest(args: any): Promise<any> {
  try {
    const input = CreatePullRequestInputSchema.parse(args);
    
    // Detect server type
    const serverInfo = await detectServer(input.serverUrl);
    
    // Create pull request
    const pullRequest = await pullRequestService.createPullRequest({
      serverInfo,
      auth: {
        access_token: input.accessToken,
        token_type: input.tokenType
      },
      projectKey: input.projectKey,
      repositorySlug: input.repositorySlug,
      title: input.title,
      description: input.description,
      fromRef: input.fromRef,
      toRef: input.toRef,
      reviewers: input.reviewers,
      closeSourceBranch: input.closeSourceBranch
    });

    return {
      content: [{
        type: 'text',
        text: `Pull request criado com sucesso!\n\n` +
              `ID: ${pullRequest.id}\n` +
              `Título: ${pullRequest.title}\n` +
              `Estado: ${pullRequest.state}\n` +
              `Autor: ${pullRequest.author.name}\n` +
              `Branch origem: ${pullRequest.fromRef.displayId}\n` +
              `Branch destino: ${pullRequest.toRef.displayId}\n` +
              `Criado em: ${new Date(pullRequest.createdDate).toLocaleString('pt-BR')}\n` +
              `URL: ${pullRequest.links.html?.[0]?.href || 'N/A'}`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Erro ao criar pull request: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }]
    };
  }
}

/**
 * Gets a specific pull request
 */
export const getPullRequestTool: Tool = {
  name: 'mcp_bitbucket_pull_request_get',
  description: 'Obtém um pull request específico no Bitbucket Data Center.',
  inputSchema: {
    type: 'object',
    properties: {
      projectKey: {
        type: 'string',
        description: 'Chave do projeto'
      },
      repositorySlug: {
        type: 'string',
        description: 'Slug do repositório'
      },
      pullRequestId: {
        type: 'number',
        description: 'ID do pull request'
      },
      serverUrl: {
        type: 'string',
        description: 'URL do servidor Bitbucket'
      },
      accessToken: {
        type: 'string',
        description: 'Token de acesso'
      },
      tokenType: {
        type: 'string',
        description: 'Tipo do token (padrão: Bearer)'
      }
    },
    required: ['projectKey', 'repositorySlug', 'pullRequestId', 'serverUrl', 'accessToken']
  }
};

export async function getPullRequest(args: any): Promise<any> {
  try {
    const input = GetPullRequestInputSchema.parse(args);
    
    // Detect server type
    const serverInfo = await detectServer(input.serverUrl);
    
    // Get pull request
    const pullRequest = await pullRequestService.getPullRequest({
      serverInfo,
      auth: {
        access_token: input.accessToken,
        token_type: input.tokenType
      },
      projectKey: input.projectKey,
      repositorySlug: input.repositorySlug,
      pullRequestId: input.pullRequestId
    });

    return {
      content: [{
        type: 'text',
        text: `Pull Request #${pullRequest.id}\n\n` +
              `Título: ${pullRequest.title}\n` +
              `Estado: ${pullRequest.state}\n` +
              `Autor: ${pullRequest.author.name}\n` +
              `Branch origem: ${pullRequest.fromRef.displayId}\n` +
              `Branch destino: ${pullRequest.toRef.displayId}\n` +
              `Revisores: ${pullRequest.reviewers.map(r => r.user.name).join(', ') || 'Nenhum'}\n` +
              `Criado em: ${new Date(pullRequest.createdDate).toLocaleString('pt-BR')}\n` +
              `Atualizado em: ${new Date(pullRequest.updatedDate).toLocaleString('pt-BR')}\n` +
              `Aberto: ${pullRequest.open ? 'Sim' : 'Não'}\n` +
              `Fechado: ${pullRequest.closed ? 'Sim' : 'Não'}\n` +
              `Bloqueado: ${pullRequest.locked ? 'Sim' : 'Não'}\n` +
              `URL: ${pullRequest.links.html?.[0]?.href || 'N/A'}\n\n` +
              `Descrição:\n${pullRequest.description || 'Nenhuma descrição'}`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Erro ao obter pull request: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }]
    };
  }
}

/**
 * Updates a pull request
 */
export const updatePullRequestTool: Tool = {
  name: 'mcp_bitbucket_pull_request_update',
  description: 'Atualiza um pull request existente no Bitbucket Data Center.',
  inputSchema: {
    type: 'object',
    properties: {
      projectKey: {
        type: 'string',
        description: 'Chave do projeto'
      },
      repositorySlug: {
        type: 'string',
        description: 'Slug do repositório'
      },
      pullRequestId: {
        type: 'number',
        description: 'ID do pull request'
      },
      version: {
        type: 'number',
        description: 'Versão para controle de concorrência'
      },
      title: {
        type: 'string',
        description: 'Novo título (opcional)'
      },
      description: {
        type: 'string',
        description: 'Nova descrição (opcional)'
      },
      reviewers: {
        type: 'array',
        items: { type: 'string' },
        description: 'Nova lista de revisores (opcional)'
      },
      closeSourceBranch: {
        type: 'boolean',
        description: 'Fechar branch origem após merge (opcional)'
      },
      serverUrl: {
        type: 'string',
        description: 'URL do servidor Bitbucket'
      },
      accessToken: {
        type: 'string',
        description: 'Token de acesso'
      },
      tokenType: {
        type: 'string',
        description: 'Tipo do token (padrão: Bearer)'
      }
    },
    required: ['projectKey', 'repositorySlug', 'pullRequestId', 'version', 'serverUrl', 'accessToken']
  }
};

export async function updatePullRequest(args: any): Promise<any> {
  try {
    const input = UpdatePullRequestInputSchema.parse(args);
    
    // Detect server type
    const serverInfo = await detectServer(input.serverUrl);
    
    // Update pull request
    const pullRequest = await pullRequestService.updatePullRequest({
      serverInfo,
      auth: {
        access_token: input.accessToken,
        token_type: input.tokenType
      },
      projectKey: input.projectKey,
      repositorySlug: input.repositorySlug,
      pullRequestId: input.pullRequestId,
      version: input.version,
      title: input.title,
      description: input.description,
      reviewers: input.reviewers,
      closeSourceBranch: input.closeSourceBranch
    });

    return {
      content: [{
        type: 'text',
        text: `Pull request atualizado com sucesso!\n\n` +
              `ID: ${pullRequest.id}\n` +
              `Título: ${pullRequest.title}\n` +
              `Estado: ${pullRequest.state}\n` +
              `Versão: ${pullRequest.version}\n` +
              `Atualizado em: ${new Date(pullRequest.updatedDate).toLocaleString('pt-BR')}\n` +
              `URL: ${pullRequest.links.html?.[0]?.href || 'N/A'}`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Erro ao atualizar pull request: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }]
    };
  }
}

/**
 * Deletes a pull request
 */
export const deletePullRequestTool: Tool = {
  name: 'mcp_bitbucket_pull_request_delete',
  description: 'Exclui um pull request no Bitbucket Data Center.',
  inputSchema: {
    type: 'object',
    properties: {
      projectKey: {
        type: 'string',
        description: 'Chave do projeto'
      },
      repositorySlug: {
        type: 'string',
        description: 'Slug do repositório'
      },
      pullRequestId: {
        type: 'number',
        description: 'ID do pull request'
      },
      serverUrl: {
        type: 'string',
        description: 'URL do servidor Bitbucket'
      },
      accessToken: {
        type: 'string',
        description: 'Token de acesso'
      },
      tokenType: {
        type: 'string',
        description: 'Tipo do token (padrão: Bearer)'
      }
    },
    required: ['projectKey', 'repositorySlug', 'pullRequestId', 'serverUrl', 'accessToken']
  }
};

export async function deletePullRequest(args: any): Promise<any> {
  try {
    const input = DeletePullRequestInputSchema.parse(args);
    
    // Detect server type
    const serverInfo = await detectServer(input.serverUrl);
    
    // Delete pull request
    await pullRequestService.deletePullRequest({
      serverInfo,
      auth: {
        access_token: input.accessToken,
        token_type: input.tokenType
      },
      projectKey: input.projectKey,
      repositorySlug: input.repositorySlug,
      pullRequestId: input.pullRequestId
    });

    return {
      content: [{
        type: 'text',
        text: `Pull request #${input.pullRequestId} excluído com sucesso!`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Erro ao excluir pull request: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }]
    };
  }
}

/**
 * Lists pull requests
 */
export const listPullRequestsTool: Tool = {
  name: 'mcp_bitbucket_pull_request_list',
  description: 'Lista pull requests no Bitbucket Data Center.',
  inputSchema: {
    type: 'object',
    properties: {
      projectKey: {
        type: 'string',
        description: 'Chave do projeto'
      },
      repositorySlug: {
        type: 'string',
        description: 'Slug do repositório'
      },
      state: {
        type: 'string',
        enum: ['OPEN', 'MERGED', 'DECLINED', 'SUPERSEDED', 'DRAFT'],
        description: 'Estado do pull request (opcional)'
      },
      start: {
        type: 'number',
        description: 'Índice de início para paginação (opcional)'
      },
      limit: {
        type: 'number',
        description: 'Número máximo de resultados (opcional)'
      },
      serverUrl: {
        type: 'string',
        description: 'URL do servidor Bitbucket'
      },
      accessToken: {
        type: 'string',
        description: 'Token de acesso'
      },
      tokenType: {
        type: 'string',
        description: 'Tipo do token (padrão: Bearer)'
      }
    },
    required: ['projectKey', 'repositorySlug', 'serverUrl', 'accessToken']
  }
};

export async function listPullRequests(args: any): Promise<any> {
  try {
    const input = ListPullRequestsInputSchema.parse(args);
    
    // Detect server type
    const serverInfo = await detectServer(input.serverUrl);
    
    // List pull requests
    const pullRequestList = await pullRequestService.listPullRequests({
      serverInfo,
      auth: {
        access_token: input.accessToken,
        token_type: input.tokenType
      },
      projectKey: input.projectKey,
      repositorySlug: input.repositorySlug,
      state: input.state,
      start: input.start,
      limit: input.limit
    });

    if (pullRequestList.values.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'Nenhum pull request encontrado.'
        }]
      };
    }

    const pullRequestsText = pullRequestList.values.map(pr => 
      `#${pr.id} - ${pr.title}\n` +
      `  Estado: ${pr.state}\n` +
      `  Autor: ${pr.author.name}\n` +
      `  Branch: ${pr.fromRef.displayId} → ${pr.toRef.displayId}\n` +
      `  Criado: ${new Date(pr.createdDate).toLocaleString('pt-BR')}\n` +
      `  URL: ${pr.links.html?.[0]?.href || 'N/A'}\n`
    ).join('\n');

    return {
      content: [{
        type: 'text',
        text: `Pull Requests encontrados (${pullRequestList.values.length} de ${pullRequestList.size}):\n\n${pullRequestsText}\n\n` +
              `Página: ${pullRequestList.start + 1} (${pullRequestList.isLastPage ? 'última' : 'mais páginas disponíveis'})`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Erro ao listar pull requests: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }]
    };
  }
}

// Export all tools
export const pullRequestCrudTools = [
  createPullRequestTool,
  getPullRequestTool,
  updatePullRequestTool,
  deletePullRequestTool,
  listPullRequestsTool
];

// Export all handlers
export const pullRequestCrudHandlers = {
  mcp_bitbucket_pull_request_create: createPullRequest,
  mcp_bitbucket_pull_request_get: getPullRequest,
  mcp_bitbucket_pull_request_update: updatePullRequest,
  mcp_bitbucket_pull_request_delete: deletePullRequest,
  mcp_bitbucket_pull_request_list: listPullRequests
};
