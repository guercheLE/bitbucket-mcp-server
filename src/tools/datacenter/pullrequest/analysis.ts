import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { pullRequestAnalysisService } from '../../../services/pullrequest-analysis-service';
import { detectServer } from '../../../services/server-detection';

/**
 * Pull Request Analysis Tools for Bitbucket Data Center
 * T024: Pull request analysis tools in src/tools/datacenter/pullrequest/analysis.ts
 * 
 * MCP tools for pull request analysis operations
 * Based on contracts/pull-request-analysis.yaml specifications
 */

// Input schemas for MCP tools
const GetActivitiesInputSchema = z.object({
  projectKey: z.string().min(1, 'Project key is required'),
  repositorySlug: z.string().min(1, 'Repository slug is required'),
  pullRequestId: z.number().int().positive('Pull request ID must be positive'),
  start: z.number().int().nonnegative('Start must be non-negative').optional(),
  limit: z.number().int().positive('Limit must be positive').optional(),
  serverUrl: z.string().url('Invalid server URL'),
  accessToken: z.string().min(1, 'Access token is required'),
  tokenType: z.string().default('Bearer')
});

const GetDiffInputSchema = z.object({
  projectKey: z.string().min(1, 'Project key is required'),
  repositorySlug: z.string().min(1, 'Repository slug is required'),
  pullRequestId: z.number().int().positive('Pull request ID must be positive'),
  contextLines: z.number().int().nonnegative('Context lines must be non-negative').optional(),
  whitespace: z.enum(['ignore-all', 'ignore-change-amount', 'ignore-eol-at-eof', 'show-all']).optional(),
  srcPath: z.string().optional(),
  withComments: z.boolean().optional(),
  serverUrl: z.string().url('Invalid server URL'),
  accessToken: z.string().min(1, 'Access token is required'),
  tokenType: z.string().default('Bearer')
});

const GetChangesInputSchema = z.object({
  projectKey: z.string().min(1, 'Project key is required'),
  repositorySlug: z.string().min(1, 'Repository slug is required'),
  pullRequestId: z.number().int().positive('Pull request ID must be positive'),
  start: z.number().int().nonnegative('Start must be non-negative').optional(),
  limit: z.number().int().positive('Limit must be positive').optional(),
  serverUrl: z.string().url('Invalid server URL'),
  accessToken: z.string().min(1, 'Access token is required'),
  tokenType: z.string().default('Bearer')
});

/**
 * Gets pull request activities (history)
 */
export const getActivitiesTool: Tool = {
  name: 'mcp_bitbucket_pull_request_get_activities',
  description: 'Obtém a atividade de um pull request no Bitbucket Data Center.',
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
      start: {
        type: 'number',
        description: 'Índice inicial para paginação (opcional)'
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
    required: ['projectKey', 'repositorySlug', 'pullRequestId', 'serverUrl', 'accessToken']
  }
};

export async function getActivities(args: any): Promise<any> {
  try {
    const input = GetActivitiesInputSchema.parse(args);
    
    // Detect server type
    const serverInfo = await detectServer(input.serverUrl);
    
    // Get activities
    const activityList = await pullRequestAnalysisService.getActivities({
      serverInfo,
      auth: {
        access_token: input.accessToken,
        token_type: input.tokenType
      },
      projectKey: input.projectKey,
      repositorySlug: input.repositorySlug,
      pullRequestId: input.pullRequestId,
      start: input.start,
      limit: input.limit
    });

    if (activityList.values.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'Nenhuma atividade encontrada para este pull request.'
        }]
      };
    }

    const activitiesText = activityList.values.map(activity => 
      `#${activity.id} - ${activity.action}\n` +
      `  Usuário: ${activity.user.name}\n` +
      `  Data: ${new Date(activity.createdDate).toLocaleString('pt-BR')}\n` +
      `  ${activity.commentAction ? `Ação do comentário: ${activity.commentAction}\n` : ''}` +
      `  ${activity.fromHash ? `Hash origem: ${activity.fromHash}\n` : ''}` +
      `  ${activity.toHash ? `Hash destino: ${activity.toHash}\n` : ''}` +
      `  ${activity.comment ? `Comentário: ${activity.comment.text.substring(0, 100)}${activity.comment.text.length > 100 ? '...' : ''}\n` : ''}` +
      `  ${activity.added !== undefined ? `Adicionado: ${activity.added}\n` : ''}` +
      `  ${activity.removed !== undefined ? `Removido: ${activity.removed}\n` : ''}`
    ).join('\n');

    return {
      content: [{
        type: 'text',
        text: `Atividades encontradas (${activityList.values.length} de ${activityList.size}):\n\n${activitiesText}\n\n` +
              `Página: ${activityList.start + 1} (${activityList.isLastPage ? 'última' : 'mais páginas disponíveis'})`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Erro ao obter atividades: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }]
    };
  }
}

/**
 * Gets pull request diff
 */
export const getDiffTool: Tool = {
  name: 'mcp_bitbucket_pull_request_get_diff',
  description: 'Obtém o diff de um pull request no Bitbucket Data Center.',
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
      contextLines: {
        type: 'number',
        description: 'Linhas de contexto (opcional)'
      },
      whitespace: {
        type: 'string',
        enum: ['ignore-all', 'ignore-change-amount', 'ignore-eol-at-eof', 'show-all'],
        description: 'Tratamento de espaços em branco (opcional)'
      },
      srcPath: {
        type: 'string',
        description: 'Caminho de origem (opcional)'
      },
      withComments: {
        type: 'boolean',
        description: 'Incluir comentários no diff (opcional)'
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

export async function getDiff(args: any): Promise<any> {
  try {
    const input = GetDiffInputSchema.parse(args);
    
    // Detect server type
    const serverInfo = await detectServer(input.serverUrl);
    
    // Get diff
    const diff = await pullRequestAnalysisService.getDiff({
      serverInfo,
      auth: {
        access_token: input.accessToken,
        token_type: input.tokenType
      },
      projectKey: input.projectKey,
      repositorySlug: input.repositorySlug,
      pullRequestId: input.pullRequestId,
      contextLines: input.contextLines,
      whitespace: input.whitespace
    });

    const diffPreview = diff.diff.length > 2000 
      ? diff.diff.substring(0, 2000) + '\n... (diff truncado)'
      : diff.diff;

    const commentsText = diff.comments && diff.comments.length > 0
      ? `\n\nComentários no diff (${diff.comments.length}):\n` +
        diff.comments.map(comment => 
          `  #${comment.id} - ${comment.author.name} (linha ${comment.anchor.line})\n` +
          `    ${comment.text.substring(0, 100)}${comment.text.length > 100 ? '...' : ''}\n` +
          `    Severidade: ${comment.severity || 'NORMAL'}`
        ).join('\n')
      : '';

    return {
      content: [{
        type: 'text',
        text: `Diff do Pull Request #${input.pullRequestId}\n\n` +
              `Hash origem: ${diff.fromHash}\n` +
              `Hash destino: ${diff.toHash}\n` +
              `Linhas de contexto: ${diff.contextLines}\n` +
              `Tratamento de espaços: ${diff.whitespace}\n` +
              `Truncado: ${diff.truncated ? 'Sim' : 'Não'}\n\n` +
              `Diff:\n${diffPreview}${commentsText}`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Erro ao obter diff: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }]
    };
  }
}

/**
 * Gets pull request changes (file changes)
 */
export const getChangesTool: Tool = {
  name: 'mcp_bitbucket_pull_request_get_changes',
  description: 'Obtém as mudanças de um pull request no Bitbucket Data Center.',
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
      start: {
        type: 'number',
        description: 'Índice inicial para paginação (opcional)'
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
    required: ['projectKey', 'repositorySlug', 'pullRequestId', 'serverUrl', 'accessToken']
  }
};

export async function getChanges(args: any): Promise<any> {
  try {
    const input = GetChangesInputSchema.parse(args);
    
    // Detect server type
    const serverInfo = await detectServer(input.serverUrl);
    
    // Get changes
    const changeList = await pullRequestAnalysisService.getChanges({
      serverInfo,
      auth: {
        access_token: input.accessToken,
        token_type: input.tokenType
      },
      projectKey: input.projectKey,
      repositorySlug: input.repositorySlug,
      pullRequestId: input.pullRequestId,
      start: input.start,
      limit: input.limit
    });

    if (changeList.values.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'Nenhuma mudança encontrada para este pull request.'
        }]
      };
    }

    const changesText = changeList.values.map(change => 
      `${change.type} - ${change.path}\n` +
      `  Tipo: ${change.nodeType}\n` +
      `  ID do conteúdo: ${change.contentId}\n` +
      `  ${change.fromContentId ? `ID de origem: ${change.fromContentId}\n` : ''}` +
      `  ${change.srcExecutable !== undefined ? `Origem executável: ${change.srcExecutable}\n` : ''}` +
      `  ${change.executable !== undefined ? `Destino executável: ${change.executable}\n` : ''}` +
      `  ${change.percentUnchanged !== undefined ? `% inalterado: ${change.percentUnchanged}\n` : ''}` +
      `  URL: ${change.links?.self?.[0]?.href || 'N/A'}\n`
    ).join('\n');

    // Calculate summary statistics
    const summary = changeList.values.reduce((acc, change) => {
      acc[change.type] = (acc[change.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const summaryText = Object.entries(summary)
      .map(([type, count]) => `${type}: ${count}`)
      .join(', ');

    return {
      content: [{
        type: 'text',
        text: `Mudanças encontradas (${changeList.values.length} de ${changeList.size}):\n\n` +
              `Resumo: ${summaryText}\n\n` +
              `Detalhes:\n${changesText}\n\n` +
              `Página: ${changeList.start + 1} (${changeList.isLastPage ? 'última' : 'mais páginas disponíveis'})`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Erro ao obter mudanças: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }]
    };
  }
}

/**
 * Gets pull request statistics
 */
export const getStatisticsTool: Tool = {
  name: 'mcp_bitbucket_pull_request_get_statistics',
  description: 'Obtém estatísticas de um pull request no Bitbucket Data Center.',
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

export async function getStatistics(args: any): Promise<any> {
  try {
    const input = GetStatisticsInputSchema.parse(args);
    
    // Detect server type
    const serverInfo = await detectServer(input.serverUrl);
    
    // Get statistics
    const statistics = await pullRequestAnalysisService.getStatistics({
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
        text: `Estatísticas do Pull Request #${input.pullRequestId}\n\n` +
              `Adições: ${statistics.additions || 0}\n` +
              `Remoções: ${statistics.deletions || 0}\n` +
              `Modificações: ${statistics.changes || 0}\n` +
              `Arquivos alterados: ${statistics.files || 0}\n` +
              `Commits: ${statistics.commits || 0}\n\n` +
              `Total de mudanças: ${(statistics.additions || 0) + (statistics.deletions || 0) + (statistics.changes || 0)}`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Erro ao obter estatísticas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }]
    };
  }
}

/**
 * Analyzes pull request for potential issues
 */
export const analyzePullRequestTool: Tool = {
  name: 'mcp_bitbucket_pull_request_analyze',
  description: 'Analisa um pull request para identificar possíveis problemas no Bitbucket Data Center.',
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

export async function analyzePullRequest(args: any): Promise<any> {
  try {
    const input = GetStatisticsInputSchema.parse(args);
    
    // Detect server type
    const serverInfo = await detectServer(input.serverUrl);
    
    // Analyze pull request
    const analysis = await pullRequestAnalysisService.analyzePullRequest({
      serverInfo,
      auth: {
        access_token: input.accessToken,
        token_type: input.tokenType
      },
      projectKey: input.projectKey,
      repositorySlug: input.repositorySlug,
      pullRequestId: input.pullRequestId
    });

    const issuesText = analysis.issues.length > 0
      ? analysis.issues.map((issue: any) => 
          `  ${issue.type?.toUpperCase() || 'ISSUE'}: ${issue.message || issue}${issue.file ? ` (${issue.file}${issue.line ? `:${issue.line}` : ''})` : ''}`
        ).join('\n')
      : '  Nenhum problema identificado';

    const suggestionsText = analysis.suggestions.length > 0
      ? analysis.suggestions.map((suggestion: any) => `  • ${suggestion}`).join('\n')
      : '  Nenhuma sugestão específica';

    return {
      content: [{
        type: 'text',
        text: `Análise do Pull Request #${input.pullRequestId}\n\n` +
              `Nível de risco: ${analysis.riskLevel.toUpperCase()}\n\n` +
              `Problemas identificados:\n${issuesText}\n\n` +
              `Sugestões:\n${suggestionsText}`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Erro ao analisar pull request: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }]
    };
  }
}

// Input schema for statistics and analysis
const GetStatisticsInputSchema = z.object({
  projectKey: z.string().min(1, 'Project key is required'),
  repositorySlug: z.string().min(1, 'Repository slug is required'),
  pullRequestId: z.number().int().positive('Pull request ID must be positive'),
  serverUrl: z.string().url('Invalid server URL'),
  accessToken: z.string().min(1, 'Access token is required'),
  tokenType: z.string().default('Bearer')
});

// Export all tools
export const pullRequestAnalysisTools = [
  getActivitiesTool,
  getDiffTool,
  getChangesTool,
  getStatisticsTool,
  analyzePullRequestTool
];

// Export all handlers
export const pullRequestAnalysisHandlers = {
  mcp_bitbucket_pull_request_get_activities: getActivities,
  mcp_bitbucket_pull_request_get_diff: getDiff,
  mcp_bitbucket_pull_request_get_changes: getChanges,
  mcp_bitbucket_pull_request_get_statistics: getStatistics,
  mcp_bitbucket_pull_request_analyze: analyzePullRequest
};
