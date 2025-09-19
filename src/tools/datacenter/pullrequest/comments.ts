import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { pullRequestCommentsService } from '../../../services/pullrequest-comments-service';
import { detectServer } from '../../../services/server-detection';

/**
 * Pull Request Comments Tools for Bitbucket Data Center
 * T023: Pull request comments tools in src/tools/datacenter/pullrequest/comments.ts
 * 
 * MCP tools for pull request comment operations
 * Based on contracts/pull-request-comments.yaml specifications
 */

// Input schemas for MCP tools
const CreateCommentInputSchema = z.object({
  projectKey: z.string().min(1, 'Project key is required'),
  repositorySlug: z.string().min(1, 'Repository slug is required'),
  pullRequestId: z.number().int().positive('Pull request ID must be positive'),
  text: z.string().min(1, 'Comment text is required').max(32768, 'Comment text too long'),
  parentId: z.number().int().positive('Parent comment ID must be positive').optional(),
  anchor: z.object({
    line: z.number().int().positive('Line must be positive'),
    lineType: z.enum(['ADDED', 'REMOVED', 'CONTEXT']),
    fileType: z.enum(['FROM', 'TO']),
    path: z.string().min(1, 'File path is required'),
    srcPath: z.string().optional()
  }).optional(),
  severity: z.enum(['NORMAL', 'BLOCKER', 'WARNING']).optional(),
  serverUrl: z.string().url('Invalid server URL'),
  accessToken: z.string().min(1, 'Access token is required'),
  tokenType: z.string().default('Bearer')
});

const GetCommentInputSchema = z.object({
  projectKey: z.string().min(1, 'Project key is required'),
  repositorySlug: z.string().min(1, 'Repository slug is required'),
  pullRequestId: z.number().int().positive('Pull request ID must be positive'),
  commentId: z.number().int().positive('Comment ID must be positive'),
  serverUrl: z.string().url('Invalid server URL'),
  accessToken: z.string().min(1, 'Access token is required'),
  tokenType: z.string().default('Bearer')
});

const UpdateCommentInputSchema = z.object({
  projectKey: z.string().min(1, 'Project key is required'),
  repositorySlug: z.string().min(1, 'Repository slug is required'),
  pullRequestId: z.number().int().positive('Pull request ID must be positive'),
  commentId: z.number().int().positive('Comment ID must be positive'),
  version: z.number().int().nonnegative('Version must be non-negative'),
  text: z.string().min(1, 'Comment text is required').max(32768, 'Comment text too long'),
  severity: z.enum(['NORMAL', 'BLOCKER', 'WARNING']).optional(),
  serverUrl: z.string().url('Invalid server URL'),
  accessToken: z.string().min(1, 'Access token is required'),
  tokenType: z.string().default('Bearer')
});

const DeleteCommentInputSchema = z.object({
  projectKey: z.string().min(1, 'Project key is required'),
  repositorySlug: z.string().min(1, 'Repository slug is required'),
  pullRequestId: z.number().int().positive('Pull request ID must be positive'),
  commentId: z.number().int().positive('Comment ID must be positive'),
  version: z.number().int().nonnegative('Version must be non-negative'),
  serverUrl: z.string().url('Invalid server URL'),
  accessToken: z.string().min(1, 'Access token is required'),
  tokenType: z.string().default('Bearer')
});

const ListCommentsInputSchema = z.object({
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
 * Creates a new comment on a pull request
 */
export const createCommentTool: Tool = {
  name: 'mcp_bitbucket_pull_request_create_comment',
  description: 'Cria um comentário em um pull request no Bitbucket Data Center.',
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
      text: {
        type: 'string',
        description: 'Texto do comentário'
      },
      parentId: {
        type: 'number',
        description: 'ID do comentário pai (opcional)'
      },
      anchor: {
        type: 'object',
        description: 'Âncora no código (opcional)',
        properties: {
          line: { type: 'number', description: 'Número da linha' },
          lineType: { type: 'string', enum: ['ADDED', 'REMOVED', 'CONTEXT'], description: 'Tipo de linha' },
          fileType: { type: 'string', enum: ['FROM', 'TO'], description: 'Tipo de arquivo' },
          path: { type: 'string', description: 'Caminho do arquivo' },
          srcPath: { type: 'string', description: 'Caminho de origem (opcional)' }
        },
        required: ['line', 'lineType', 'fileType', 'path']
      },
      severity: {
        type: 'string',
        enum: ['NORMAL', 'BLOCKER', 'WARNING'],
        description: 'Severidade do comentário (opcional)'
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
    required: ['projectKey', 'repositorySlug', 'pullRequestId', 'text', 'serverUrl', 'accessToken']
  }
};

export async function createComment(args: any): Promise<any> {
  try {
    const input = CreateCommentInputSchema.parse(args);
    
    // Detect server type
    const serverInfo = await detectServer(input.serverUrl);
    
    // Create comment
    const comment = await pullRequestCommentsService.createComment({
      serverInfo,
      auth: {
        access_token: input.accessToken,
        token_type: input.tokenType
      },
      projectKey: input.projectKey,
      repositorySlug: input.repositorySlug,
      pullRequestId: input.pullRequestId,
      text: input.text,
      parentId: input.parentId,
      anchor: input.anchor,
      severity: input.severity
    });

    return {
      content: [{
        type: 'text',
        text: `Comentário criado com sucesso!\n\n` +
              `ID: ${comment.id}\n` +
              `Autor: ${comment.author.name}\n` +
              `Criado em: ${new Date(comment.createdDate).toLocaleString('pt-BR')}\n` +
              `Severidade: ${comment.severity || 'NORMAL'}\n` +
              `Texto: ${comment.text}\n` +
              `URL: ${comment.links.html?.[0]?.href || 'N/A'}`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Erro ao criar comentário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }]
    };
  }
}

/**
 * Gets a specific comment
 */
export const getCommentTool: Tool = {
  name: 'mcp_bitbucket_pull_request_get_comment',
  description: 'Obtém um comentário específico de um pull request no Bitbucket Data Center.',
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
      commentId: {
        type: 'number',
        description: 'ID do comentário'
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
    required: ['projectKey', 'repositorySlug', 'pullRequestId', 'commentId', 'serverUrl', 'accessToken']
  }
};

export async function getComment(args: any): Promise<any> {
  try {
    const input = GetCommentInputSchema.parse(args);
    
    // Detect server type
    const serverInfo = await detectServer(input.serverUrl);
    
    // Get comment
    const comment = await pullRequestCommentsService.getComment({
      serverInfo,
      auth: {
        access_token: input.accessToken,
        token_type: input.tokenType
      },
      projectKey: input.projectKey,
      repositorySlug: input.repositorySlug,
      pullRequestId: input.pullRequestId,
      commentId: input.commentId
    });

    return {
      content: [{
        type: 'text',
        text: `Comentário #${comment.id}\n\n` +
              `Autor: ${comment.author.name}\n` +
              `Criado em: ${new Date(comment.createdDate).toLocaleString('pt-BR')}\n` +
              `Atualizado em: ${comment.updatedDate ? new Date(comment.updatedDate).toLocaleString('pt-BR') : 'Nunca'}\n` +
              `Versão: ${comment.version}\n` +
              `Severidade: ${comment.severity || 'NORMAL'}\n` +
              `Deletado: ${comment.deleted ? 'Sim' : 'Não'}\n` +
              `URL: ${comment.links.html?.[0]?.href || 'N/A'}\n\n` +
              `Texto:\n${comment.text}\n\n` +
              `${comment.anchor ? `Âncora: Linha ${comment.anchor.line} (${comment.anchor.lineType}) em ${comment.anchor.path}\n` : ''}` +
              `${comment.parent ? `Comentário pai: #${comment.parent.id}\n` : ''}` +
              `${comment.comments && comment.comments.length > 0 ? `Respostas: ${comment.comments.length}\n` : ''}`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Erro ao obter comentário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }]
    };
  }
}

/**
 * Updates a comment
 */
export const updateCommentTool: Tool = {
  name: 'mcp_bitbucket_pull_request_update_comment',
  description: 'Atualiza um comentário de um pull request no Bitbucket Data Center.',
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
      commentId: {
        type: 'number',
        description: 'ID do comentário'
      },
      version: {
        type: 'number',
        description: 'Versão do comentário'
      },
      text: {
        type: 'string',
        description: 'Novo texto do comentário'
      },
      severity: {
        type: 'string',
        enum: ['NORMAL', 'BLOCKER', 'WARNING'],
        description: 'Nova severidade (opcional)'
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
    required: ['projectKey', 'repositorySlug', 'pullRequestId', 'commentId', 'version', 'text', 'serverUrl', 'accessToken']
  }
};

export async function updateComment(args: any): Promise<any> {
  try {
    const input = UpdateCommentInputSchema.parse(args);
    
    // Detect server type
    const serverInfo = await detectServer(input.serverUrl);
    
    // Update comment
    const comment = await pullRequestCommentsService.updateComment({
      serverInfo,
      auth: {
        access_token: input.accessToken,
        token_type: input.tokenType
      },
      projectKey: input.projectKey,
      repositorySlug: input.repositorySlug,
      pullRequestId: input.pullRequestId,
      commentId: input.commentId,
      version: input.version,
      text: input.text,
      severity: input.severity
    });

    return {
      content: [{
        type: 'text',
        text: `Comentário atualizado com sucesso!\n\n` +
              `ID: ${comment.id}\n` +
              `Versão: ${comment.version}\n` +
              `Atualizado em: ${new Date(comment.updatedDate || comment.createdDate).toLocaleString('pt-BR')}\n` +
              `Severidade: ${comment.severity || 'NORMAL'}\n` +
              `Texto: ${comment.text}\n` +
              `URL: ${comment.links.html?.[0]?.href || 'N/A'}`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Erro ao atualizar comentário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }]
    };
  }
}

/**
 * Deletes a comment
 */
export const deleteCommentTool: Tool = {
  name: 'mcp_bitbucket_pull_request_delete_comment',
  description: 'Remove um comentário de um pull request no Bitbucket Data Center.',
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
      commentId: {
        type: 'number',
        description: 'ID do comentário'
      },
      version: {
        type: 'number',
        description: 'Versão do comentário'
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
    required: ['projectKey', 'repositorySlug', 'pullRequestId', 'commentId', 'version', 'serverUrl', 'accessToken']
  }
};

export async function deleteComment(args: any): Promise<any> {
  try {
    const input = DeleteCommentInputSchema.parse(args);
    
    // Detect server type
    const serverInfo = await detectServer(input.serverUrl);
    
    // Delete comment
    await pullRequestCommentsService.deleteComment({
      serverInfo,
      auth: {
        access_token: input.accessToken,
        token_type: input.tokenType
      },
      projectKey: input.projectKey,
      repositorySlug: input.repositorySlug,
      pullRequestId: input.pullRequestId,
      commentId: input.commentId,
      version: input.version
    });

    return {
      content: [{
        type: 'text',
        text: `Comentário #${input.commentId} removido com sucesso!`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Erro ao remover comentário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }]
    };
  }
}

/**
 * Lists all comments for a pull request
 */
export const listCommentsTool: Tool = {
  name: 'mcp_bitbucket_pull_request_list_comments',
  description: 'Lista comentários de um pull request no Bitbucket Data Center.',
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
    required: ['projectKey', 'repositorySlug', 'pullRequestId', 'serverUrl', 'accessToken']
  }
};

export async function listComments(args: any): Promise<any> {
  try {
    const input = ListCommentsInputSchema.parse(args);
    
    // Detect server type
    const serverInfo = await detectServer(input.serverUrl);
    
    // List comments
    const commentList = await pullRequestCommentsService.listComments({
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

    if (commentList.values.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'Nenhum comentário encontrado para este pull request.'
        }]
      };
    }

    const commentsText = commentList.values.map(comment => 
      `#${comment.id} - ${comment.author.name}\n` +
      `  Criado: ${new Date(comment.createdDate).toLocaleString('pt-BR')}\n` +
      `  Severidade: ${comment.severity || 'NORMAL'}\n` +
      `  ${comment.anchor ? `Âncora: Linha ${comment.anchor.line} em ${comment.anchor.path}\n` : ''}` +
      `  ${comment.parent ? `Resposta para: #${comment.parent.id}\n` : ''}` +
      `  Texto: ${comment.text.length > 100 ? comment.text.substring(0, 100) + '...' : comment.text}\n` +
      `  URL: ${comment.links.html?.[0]?.href || 'N/A'}\n`
    ).join('\n');

    return {
      content: [{
        type: 'text',
        text: `Comentários encontrados (${commentList.values.length} de ${commentList.size}):\n\n${commentsText}\n\n` +
              `Página: ${commentList.start + 1} (${commentList.isLastPage ? 'última' : 'mais páginas disponíveis'})`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Erro ao listar comentários: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }]
    };
  }
}

// Export all tools
export const pullRequestCommentsTools = [
  createCommentTool,
  getCommentTool,
  updateCommentTool,
  deleteCommentTool,
  listCommentsTool
];

// Export all handlers
export const pullRequestCommentsHandlers = {
  mcp_bitbucket_pull_request_create_comment: createComment,
  mcp_bitbucket_pull_request_get_comment: getComment,
  mcp_bitbucket_pull_request_update_comment: updateComment,
  mcp_bitbucket_pull_request_delete_comment: deleteComment,
  mcp_bitbucket_pull_request_list_comments: listComments
};
