import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { pullRequestService } from '../../../services/pullrequest-service';
import { detectServer } from '../../../services/server-detection';

/**
 * Pull Request Operations Tools for Bitbucket Data Center
 * T025: Pull request operations tools in src/tools/datacenter/pullrequest/operations.ts
 * 
 * MCP tools for pull request operations (merge, decline, reopen)
 * Based on contracts/pull-request-crud.yaml specifications
 */

// Input schemas for MCP tools
const MergePullRequestInputSchema = z.object({
  projectKey: z.string().min(1, 'Project key is required'),
  repositorySlug: z.string().min(1, 'Repository slug is required'),
  pullRequestId: z.number().int().positive('Pull request ID must be positive'),
  version: z.number().int().nonnegative('Version must be non-negative'),
  mergeCommitMessage: z.string().max(1000, 'Merge commit message too long').optional(),
  closeSourceBranch: z.boolean().optional(),
  serverUrl: z.string().url('Invalid server URL'),
  accessToken: z.string().min(1, 'Access token is required'),
  tokenType: z.string().default('Bearer')
});

const DeclinePullRequestInputSchema = z.object({
  projectKey: z.string().min(1, 'Project key is required'),
  repositorySlug: z.string().min(1, 'Repository slug is required'),
  pullRequestId: z.number().int().positive('Pull request ID must be positive'),
  version: z.number().int().nonnegative('Version must be non-negative'),
  reason: z.string().max(1000, 'Reason too long').optional(),
  serverUrl: z.string().url('Invalid server URL'),
  accessToken: z.string().min(1, 'Access token is required'),
  tokenType: z.string().default('Bearer')
});

const ReopenPullRequestInputSchema = z.object({
  projectKey: z.string().min(1, 'Project key is required'),
  repositorySlug: z.string().min(1, 'Repository slug is required'),
  pullRequestId: z.number().int().positive('Pull request ID must be positive'),
  version: z.number().int().nonnegative('Version must be non-negative'),
  serverUrl: z.string().url('Invalid server URL'),
  accessToken: z.string().min(1, 'Access token is required'),
  tokenType: z.string().default('Bearer')
});

/**
 * Merges a pull request
 */
export const mergePullRequestTool: Tool = {
  name: 'mcp_bitbucket_pull_request_merge',
  description: 'Faz merge de um pull request no Bitbucket Data Center.',
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
      mergeCommitMessage: {
        type: 'string',
        description: 'Mensagem personalizada do commit de merge (opcional)'
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

export async function mergePullRequest(args: any): Promise<any> {
  try {
    const input = MergePullRequestInputSchema.parse(args);
    
    // Detect server type
    const serverInfo = await detectServer(input.serverUrl);
    
    // Merge pull request
    const pullRequest = await pullRequestService.mergePullRequest({
      serverInfo,
      auth: {
        access_token: input.accessToken,
        token_type: input.tokenType
      },
      projectKey: input.projectKey,
      repositorySlug: input.repositorySlug,
      pullRequestId: input.pullRequestId,
      version: input.version,
      mergeCommitMessage: input.mergeCommitMessage,
      closeSourceBranch: input.closeSourceBranch
    });

    return {
      content: [{
        type: 'text',
        text: `Pull request mergeado com sucesso!\n\n` +
              `ID: ${pullRequest.id}\n` +
              `Título: ${pullRequest.title}\n` +
              `Estado: ${pullRequest.state}\n` +
              `Versão: ${pullRequest.version}\n` +
              `Atualizado em: ${new Date(pullRequest.updatedDate).toLocaleString('pt-BR')}\n` +
              `Branch origem fechada: ${input.closeSourceBranch ? 'Sim' : 'Não'}\n` +
              `URL: ${pullRequest.links.html?.[0]?.href || 'N/A'}\n\n` +
              `${input.mergeCommitMessage ? `Mensagem do merge: ${input.mergeCommitMessage}\n` : ''}` +
              `O pull request foi integrado com sucesso ao branch de destino.`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Erro ao fazer merge do pull request: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }]
    };
  }
}

/**
 * Declines a pull request
 */
export const declinePullRequestTool: Tool = {
  name: 'mcp_bitbucket_pull_request_decline',
  description: 'Recusa um pull request no Bitbucket Data Center.',
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
      reason: {
        type: 'string',
        description: 'Motivo da recusa (opcional)'
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

export async function declinePullRequest(args: any): Promise<any> {
  try {
    const input = DeclinePullRequestInputSchema.parse(args);
    
    // Detect server type
    const serverInfo = await detectServer(input.serverUrl);
    
    // Decline pull request
    const pullRequest = await pullRequestService.declinePullRequest({
      serverInfo,
      auth: {
        access_token: input.accessToken,
        token_type: input.tokenType
      },
      projectKey: input.projectKey,
      repositorySlug: input.repositorySlug,
      pullRequestId: input.pullRequestId,
      version: input.version,
      reason: input.reason
    });

    return {
      content: [{
        type: 'text',
        text: `Pull request recusado com sucesso!\n\n` +
              `ID: ${pullRequest.id}\n` +
              `Título: ${pullRequest.title}\n` +
              `Estado: ${pullRequest.state}\n` +
              `Versão: ${pullRequest.version}\n` +
              `Atualizado em: ${new Date(pullRequest.updatedDate).toLocaleString('pt-BR')}\n` +
              `URL: ${pullRequest.links.html?.[0]?.href || 'N/A'}\n\n` +
              `${input.reason ? `Motivo da recusa: ${input.reason}\n` : ''}` +
              `O pull request foi recusado e não será integrado ao branch de destino.`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Erro ao recusar pull request: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }]
    };
  }
}

/**
 * Reopens a pull request
 */
export const reopenPullRequestTool: Tool = {
  name: 'mcp_bitbucket_pull_request_reopen',
  description: 'Reabre um pull request no Bitbucket Data Center.',
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

export async function reopenPullRequest(args: any): Promise<any> {
  try {
    const input = ReopenPullRequestInputSchema.parse(args);
    
    // Detect server type
    const serverInfo = await detectServer(input.serverUrl);
    
    // Reopen pull request
    const pullRequest = await pullRequestService.reopenPullRequest({
      serverInfo,
      auth: {
        access_token: input.accessToken,
        token_type: input.tokenType
      },
      projectKey: input.projectKey,
      repositorySlug: input.repositorySlug,
      pullRequestId: input.pullRequestId,
      version: input.version
    });

    return {
      content: [{
        type: 'text',
        text: `Pull request reaberto com sucesso!\n\n` +
              `ID: ${pullRequest.id}\n` +
              `Título: ${pullRequest.title}\n` +
              `Estado: ${pullRequest.state}\n` +
              `Versão: ${pullRequest.version}\n` +
              `Atualizado em: ${new Date(pullRequest.updatedDate).toLocaleString('pt-BR')}\n` +
              `URL: ${pullRequest.links.html?.[0]?.href || 'N/A'}\n\n` +
              `O pull request foi reaberto e está disponível para revisão e merge novamente.`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Erro ao reabrir pull request: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }]
    };
  }
}

// Export all tools
export const pullRequestOperationsTools = [
  mergePullRequestTool,
  declinePullRequestTool,
  reopenPullRequestTool
];

// Export all handlers
export const pullRequestOperationsHandlers = {
  mcp_bitbucket_pull_request_merge: mergePullRequest,
  mcp_bitbucket_pull_request_decline: declinePullRequest,
  mcp_bitbucket_pull_request_reopen: reopenPullRequest
};
