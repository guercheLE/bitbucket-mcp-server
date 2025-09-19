/**
 * Bitbucket Cloud Issues MCP Tools
 * 
 * Este arquivo implementa as ferramentas MCP para gestão de Issues
 * do Bitbucket Cloud, seguindo o padrão MCP (Model Context Protocol).
 * 
 * @fileoverview Ferramentas MCP para Issues no Bitbucket Cloud
 * @version 1.0.0
 * @since 2024-12-19
 */

import { IssuesService, createIssuesService } from './issues-service';
import { logger } from '../../../utils/logger';
import {
  CreateIssueRequest,
  UpdateIssueRequest,
  CreateCommentRequest,
  UpdateCommentRequest,
  TransitionIssueRequest,
  IssuesSearchParams
} from '../../../types/issues';

// ============================================================================
// MCP Tool Definitions
// ============================================================================

export const issuesMcpTools = [
  // ============================================================================
  // Issue CRUD Tools
  // ============================================================================

  {
    name: 'mcp_bitbucket_issues_create',
    description: 'Cria uma nova issue no Bitbucket Cloud',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Título da issue'
        },
        content: {
          type: 'object',
          properties: {
            raw: { type: 'string', description: 'Conteúdo em texto puro' },
            markup: { type: 'string', description: 'Tipo de markup (markdown, html, etc.)' }
          },
          description: 'Conteúdo da issue'
        },
        kind: {
          type: 'string',
          enum: ['bug', 'enhancement', 'proposal', 'task'],
          description: 'Tipo da issue'
        },
        priority: {
          type: 'string',
          enum: ['trivial', 'minor', 'major', 'critical', 'blocker'],
          description: 'Prioridade da issue'
        },
        assignee: {
          type: 'object',
          properties: {
            uuid: { type: 'string', description: 'UUID do responsável' }
          },
          description: 'Responsável pela issue'
        },
        component: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Nome do componente' }
          },
          description: 'Componente relacionado'
        },
        milestone: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Nome do milestone' }
          },
          description: 'Milestone relacionado'
        },
        version: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Nome da versão' }
          },
          description: 'Versão relacionada'
        }
      },
      required: ['title']
    }
  },

  {
    name: 'mcp_bitbucket_issues_get',
    description: 'Obtém uma issue específica do Bitbucket Cloud',
    inputSchema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'number',
          description: 'ID da issue'
        }
      },
      required: ['issueId']
    }
  },

  {
    name: 'mcp_bitbucket_issues_update',
    description: 'Atualiza uma issue existente no Bitbucket Cloud',
    inputSchema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'number',
          description: 'ID da issue'
        },
        title: {
          type: 'string',
          description: 'Novo título da issue'
        },
        content: {
          type: 'object',
          properties: {
            raw: { type: 'string', description: 'Conteúdo em texto puro' },
            markup: { type: 'string', description: 'Tipo de markup' }
          },
          description: 'Novo conteúdo da issue'
        },
        kind: {
          type: 'string',
          enum: ['bug', 'enhancement', 'proposal', 'task'],
          description: 'Novo tipo da issue'
        },
        priority: {
          type: 'string',
          enum: ['trivial', 'minor', 'major', 'critical', 'blocker'],
          description: 'Nova prioridade da issue'
        },
        assignee: {
          type: 'object',
          properties: {
            uuid: { type: 'string', description: 'UUID do responsável' }
          },
          description: 'Novo responsável pela issue'
        },
        component: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Nome do componente' }
          },
          description: 'Novo componente relacionado'
        },
        milestone: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Nome do milestone' }
          },
          description: 'Novo milestone relacionado'
        },
        version: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Nome da versão' }
          },
          description: 'Nova versão relacionada'
        }
      },
      required: ['issueId']
    }
  },

  {
    name: 'mcp_bitbucket_issues_delete',
    description: 'Remove uma issue do Bitbucket Cloud',
    inputSchema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'number',
          description: 'ID da issue'
        }
      },
      required: ['issueId']
    }
  },

  // ============================================================================
  // Issue Search and Listing Tools
  // ============================================================================

  {
    name: 'mcp_bitbucket_issues_search',
    description: 'Busca issues no Bitbucket Cloud com filtros',
    inputSchema: {
      type: 'object',
      properties: {
        q: {
          type: 'string',
          description: 'Query de busca'
        },
        sort: {
          type: 'string',
          description: 'Campo de ordenação'
        },
        state: {
          type: 'string',
          enum: ['new', 'open', 'resolved', 'on hold', 'invalid', 'duplicate', 'wontfix', 'closed'],
          description: 'Estado da issue'
        },
        kind: {
          type: 'string',
          enum: ['bug', 'enhancement', 'proposal', 'task'],
          description: 'Tipo da issue'
        },
        priority: {
          type: 'string',
          enum: ['trivial', 'minor', 'major', 'critical', 'blocker'],
          description: 'Prioridade da issue'
        },
        assignee: {
          type: 'string',
          description: 'UUID do responsável'
        },
        reporter: {
          type: 'string',
          description: 'UUID do reporter'
        },
        component: {
          type: 'string',
          description: 'Nome do componente'
        },
        milestone: {
          type: 'string',
          description: 'Nome do milestone'
        },
        version: {
          type: 'string',
          description: 'Nome da versão'
        },
        created_on: {
          type: 'string',
          description: 'Data de criação (formato ISO)'
        },
        updated_on: {
          type: 'string',
          description: 'Data de atualização (formato ISO)'
        },
        page: {
          type: 'number',
          description: 'Número da página'
        },
        pagelen: {
          type: 'number',
          description: 'Tamanho da página'
        }
      }
    }
  },

  {
    name: 'mcp_bitbucket_issues_list',
    description: 'Lista issues do Bitbucket Cloud',
    inputSchema: {
      type: 'object',
      properties: {
        page: {
          type: 'number',
          description: 'Número da página',
          default: 1
        },
        pagelen: {
          type: 'number',
          description: 'Tamanho da página',
          default: 10
        }
      }
    }
  },

  // ============================================================================
  // Issue Transitions Tools
  // ============================================================================

  {
    name: 'mcp_bitbucket_issues_get_transitions',
    description: 'Obtém transições disponíveis para uma issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'number',
          description: 'ID da issue'
        }
      },
      required: ['issueId']
    }
  },

  {
    name: 'mcp_bitbucket_issues_transition',
    description: 'Transiciona uma issue para um novo estado',
    inputSchema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'number',
          description: 'ID da issue'
        },
        transition: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID da transição'
            }
          },
          required: ['id'],
          description: 'Transição a ser aplicada'
        },
        fields: {
          type: 'object',
          description: 'Campos adicionais para a transição'
        }
      },
      required: ['issueId', 'transition']
    }
  },

  // ============================================================================
  // Comments Management Tools
  // ============================================================================

  {
    name: 'mcp_bitbucket_issues_get_comments',
    description: 'Obtém comentários de uma issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'number',
          description: 'ID da issue'
        },
        page: {
          type: 'number',
          description: 'Número da página',
          default: 1
        },
        pagelen: {
          type: 'number',
          description: 'Tamanho da página',
          default: 10
        }
      },
      required: ['issueId']
    }
  },

  {
    name: 'mcp_bitbucket_issues_create_comment',
    description: 'Cria um comentário em uma issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'number',
          description: 'ID da issue'
        },
        content: {
          type: 'object',
          properties: {
            raw: { type: 'string', description: 'Conteúdo em texto puro' },
            markup: { type: 'string', description: 'Tipo de markup' }
          },
          required: ['raw'],
          description: 'Conteúdo do comentário'
        }
      },
      required: ['issueId', 'content']
    }
  },

  {
    name: 'mcp_bitbucket_issues_update_comment',
    description: 'Atualiza um comentário de uma issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'number',
          description: 'ID da issue'
        },
        commentId: {
          type: 'number',
          description: 'ID do comentário'
        },
        content: {
          type: 'object',
          properties: {
            raw: { type: 'string', description: 'Conteúdo em texto puro' },
            markup: { type: 'string', description: 'Tipo de markup' }
          },
          required: ['raw'],
          description: 'Novo conteúdo do comentário'
        }
      },
      required: ['issueId', 'commentId', 'content']
    }
  },

  {
    name: 'mcp_bitbucket_issues_delete_comment',
    description: 'Remove um comentário de uma issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'number',
          description: 'ID da issue'
        },
        commentId: {
          type: 'number',
          description: 'ID do comentário'
        }
      },
      required: ['issueId', 'commentId']
    }
  },

  // ============================================================================
  // Issue Relationships Tools
  // ============================================================================

  {
    name: 'mcp_bitbucket_issues_get_relationships',
    description: 'Obtém relacionamentos de uma issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'number',
          description: 'ID da issue'
        },
        page: {
          type: 'number',
          description: 'Número da página',
          default: 1
        },
        pagelen: {
          type: 'number',
          description: 'Tamanho da página',
          default: 10
        }
      },
      required: ['issueId']
    }
  },

  {
    name: 'mcp_bitbucket_issues_create_relationship',
    description: 'Cria um relacionamento entre issues',
    inputSchema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'number',
          description: 'ID da issue principal'
        },
        relatedIssueId: {
          type: 'number',
          description: 'ID da issue relacionada'
        },
        relationshipType: {
          type: 'string',
          enum: ['relates', 'duplicates', 'duplicated_by', 'blocks', 'blocked_by', 'clones', 'cloned_by'],
          description: 'Tipo de relacionamento'
        }
      },
      required: ['issueId', 'relatedIssueId', 'relationshipType']
    }
  },

  {
    name: 'mcp_bitbucket_issues_delete_relationship',
    description: 'Remove um relacionamento entre issues',
    inputSchema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'number',
          description: 'ID da issue principal'
        },
        relationshipId: {
          type: 'number',
          description: 'ID do relacionamento'
        }
      },
      required: ['issueId', 'relationshipId']
    }
  },

  // ============================================================================
  // Attachments Management Tools
  // ============================================================================

  {
    name: 'mcp_bitbucket_issues_get_attachments',
    description: 'Obtém anexos de uma issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'number',
          description: 'ID da issue'
        },
        page: {
          type: 'number',
          description: 'Número da página',
          default: 1
        },
        pagelen: {
          type: 'number',
          description: 'Tamanho da página',
          default: 10
        }
      },
      required: ['issueId']
    }
  },

  {
    name: 'mcp_bitbucket_issues_upload_attachment',
    description: 'Faz upload de um anexo para uma issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'number',
          description: 'ID da issue'
        },
        filename: {
          type: 'string',
          description: 'Nome do arquivo'
        },
        contentType: {
          type: 'string',
          description: 'Tipo de conteúdo do arquivo'
        },
        fileData: {
          type: 'string',
          description: 'Dados do arquivo em base64'
        }
      },
      required: ['issueId', 'filename', 'contentType', 'fileData']
    }
  },

  {
    name: 'mcp_bitbucket_issues_delete_attachment',
    description: 'Remove um anexo de uma issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'number',
          description: 'ID da issue'
        },
        attachmentId: {
          type: 'number',
          description: 'ID do anexo'
        }
      },
      required: ['issueId', 'attachmentId']
    }
  }
];

// ============================================================================
// MCP Tool Handlers
// ============================================================================

export class IssuesMcpHandlers {
  private issuesService: IssuesService;

  constructor(issuesService: IssuesService) {
    this.issuesService = issuesService;
  }

  // ============================================================================
  // Issue CRUD Handlers
  // ============================================================================

  async handleCreateIssue(args: any): Promise<any> {
    const request: CreateIssueRequest = {
      title: args.title,
      content: args.content,
      kind: args.kind,
      priority: args.priority,
      assignee: args.assignee,
      component: args.component,
      milestone: args.milestone,
      version: args.version
    };

    const issue = await this.issuesService.createIssue(request);
    
    return {
      content: [
        {
          type: 'text',
          text: `Issue criada com sucesso!\n\nID: ${issue.id}\nTítulo: ${issue.title}\nEstado: ${issue.state.name}\nTipo: ${issue.kind}\nPrioridade: ${issue.priority}\nCriada em: ${issue.created_on}`
        }
      ]
    };
  }

  async handleGetIssue(args: any): Promise<any> {
    const issue = await this.issuesService.getIssue(args.issueId);
    
    return {
      content: [
        {
          type: 'text',
          text: `Issue #${issue.id}: ${issue.title}\n\nEstado: ${issue.state.name}\nTipo: ${issue.kind}\nPrioridade: ${issue.priority}\nReporter: ${issue.reporter.display_name}\nResponsável: ${issue.assignee?.display_name || 'Não atribuído'}\nCriada em: ${issue.created_on}\nAtualizada em: ${issue.updated_on}\n\nConteúdo:\n${issue.content?.raw || 'Sem conteúdo'}`
        }
      ]
    };
  }

  async handleUpdateIssue(args: any): Promise<any> {
    const request: UpdateIssueRequest = {
      title: args.title,
      content: args.content,
      kind: args.kind,
      priority: args.priority,
      assignee: args.assignee,
      component: args.component,
      milestone: args.milestone,
      version: args.version
    };

    const issue = await this.issuesService.updateIssue(args.issueId, request);
    
    return {
      content: [
        {
          type: 'text',
          text: `Issue #${issue.id} atualizada com sucesso!\n\nTítulo: ${issue.title}\nEstado: ${issue.state.name}\nTipo: ${issue.kind}\nPrioridade: ${issue.priority}\nAtualizada em: ${issue.updated_on}`
        }
      ]
    };
  }

  async handleDeleteIssue(args: any): Promise<any> {
    await this.issuesService.deleteIssue(args.issueId);
    
    return {
      content: [
        {
          type: 'text',
          text: `Issue #${args.issueId} removida com sucesso!`
        }
      ]
    };
  }

  // ============================================================================
  // Search and Listing Handlers
  // ============================================================================

  async handleSearchIssues(args: any): Promise<any> {
    const params: IssuesSearchParams = {
      q: args.q,
      sort: args.sort,
      state: args.state,
      kind: args.kind,
      priority: args.priority,
      assignee: args.assignee,
      reporter: args.reporter,
      component: args.component,
      milestone: args.milestone,
      version: args.version,
      created_on: args.created_on,
      updated_on: args.updated_on,
      page: args.page,
      pagelen: args.pagelen
    };

    const response = await this.issuesService.searchIssues(params);
    
    const issuesList = response.values.map(issue => 
      `#${issue.id}: ${issue.title} (${issue.state.name}) - ${issue.kind}/${issue.priority}`
    ).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Encontradas ${response.size} issues (página ${response.page} de ${Math.ceil(response.size / response.pagelen)}):\n\n${issuesList}`
        }
      ]
    };
  }

  async handleListIssues(args: any): Promise<any> {
    const response = await this.issuesService.listIssues(args.page || 1, args.pagelen || 10);
    
    const issuesList = response.values.map(issue => 
      `#${issue.id}: ${issue.title} (${issue.state.name}) - ${issue.kind}/${issue.priority}`
    ).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Listando ${response.values.length} issues (página ${response.page} de ${Math.ceil(response.size / response.pagelen)}):\n\n${issuesList}`
        }
      ]
    };
  }

  // ============================================================================
  // Transitions Handlers
  // ============================================================================

  async handleGetTransitions(args: any): Promise<any> {
    const transitions = await this.issuesService.getIssueTransitions(args.issueId);
    
    const transitionsList = transitions.map(transition => 
      `${transition.id}: ${transition.name} → ${transition.to.name}`
    ).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Transições disponíveis para issue #${args.issueId}:\n\n${transitionsList}`
        }
      ]
    };
  }

  async handleTransitionIssue(args: any): Promise<any> {
    const request: TransitionIssueRequest = {
      transition: { id: args.transition.id },
      fields: args.fields
    };

    const issue = await this.issuesService.transitionIssue(args.issueId, request);
    
    return {
      content: [
        {
          type: 'text',
          text: `Issue #${issue.id} transicionada com sucesso!\n\nNovo estado: ${issue.state.name}\nTransição: ${args.transition.id}\nAtualizada em: ${issue.updated_on}`
        }
      ]
    };
  }

  // ============================================================================
  // Comments Handlers
  // ============================================================================

  async handleGetComments(args: any): Promise<any> {
    const response = await this.issuesService.getIssueComments(args.issueId, args.page || 1, args.pagelen || 10);
    
    const commentsList = response.values.map(comment => 
      `#${comment.id} por ${comment.user.display_name} (${comment.created_on}):\n${comment.content.raw}\n`
    ).join('\n---\n');

    return {
      content: [
        {
          type: 'text',
          text: `Comentários da issue #${args.issueId}:\n\n${commentsList}`
        }
      ]
    };
  }

  async handleCreateComment(args: any): Promise<any> {
    const request: CreateCommentRequest = {
      content: {
        raw: args.content.raw,
        markup: args.content.markup || 'markdown'
      }
    };

    const comment = await this.issuesService.createComment(args.issueId, request);
    
    return {
      content: [
        {
          type: 'text',
          text: `Comentário criado com sucesso na issue #${args.issueId}!\n\nID: ${comment.id}\nAutor: ${comment.user.display_name}\nCriado em: ${comment.created_on}\n\nConteúdo:\n${comment.content.raw}`
        }
      ]
    };
  }

  async handleUpdateComment(args: any): Promise<any> {
    const request: UpdateCommentRequest = {
      content: {
        raw: args.content.raw,
        markup: args.content.markup || 'markdown'
      }
    };

    const comment = await this.issuesService.updateComment(args.issueId, args.commentId, request);
    
    return {
      content: [
        {
          type: 'text',
          text: `Comentário #${comment.id} atualizado com sucesso!\n\nAutor: ${comment.user.display_name}\nAtualizado em: ${comment.updated_on}\n\nConteúdo:\n${comment.content.raw}`
        }
      ]
    };
  }

  async handleDeleteComment(args: any): Promise<any> {
    await this.issuesService.deleteComment(args.issueId, args.commentId);
    
    return {
      content: [
        {
          type: 'text',
          text: `Comentário #${args.commentId} removido com sucesso da issue #${args.issueId}!`
        }
      ]
    };
  }

  // ============================================================================
  // Relationships Handlers
  // ============================================================================

  async handleGetRelationships(args: any): Promise<any> {
    const response = await this.issuesService.getIssueRelationships(args.issueId, args.page || 1, args.pagelen || 10);
    
    const relationshipsList = response.values.map(rel => 
      `${rel.type}: #${rel.related_issue.id} - ${rel.related_issue.title}`
    ).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Relacionamentos da issue #${args.issueId}:\n\n${relationshipsList}`
        }
      ]
    };
  }

  async handleCreateRelationship(args: any): Promise<any> {
    const relationship = await this.issuesService.createIssueRelationship(
      args.issueId, 
      args.relatedIssueId, 
      args.relationshipType
    );
    
    return {
      content: [
        {
          type: 'text',
          text: `Relacionamento criado com sucesso!\n\nID: ${relationship.id}\nTipo: ${relationship.type}\nIssue principal: #${relationship.issue.id}\nIssue relacionada: #${relationship.related_issue.id}`
        }
      ]
    };
  }

  async handleDeleteRelationship(args: any): Promise<any> {
    await this.issuesService.deleteIssueRelationship(args.issueId, args.relationshipId);
    
    return {
      content: [
        {
          type: 'text',
          text: `Relacionamento #${args.relationshipId} removido com sucesso da issue #${args.issueId}!`
        }
      ]
    };
  }

  // ============================================================================
  // Attachments Handlers
  // ============================================================================

  async handleGetAttachments(args: any): Promise<any> {
    const response = await this.issuesService.getIssueAttachments(args.issueId, args.page || 1, args.pagelen || 10);
    
    const attachmentsList = response.values.map(attachment => 
      `#${attachment.id}: ${attachment.name} (${attachment.size} bytes) - ${attachment.type}`
    ).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Anexos da issue #${args.issueId}:\n\n${attachmentsList}`
        }
      ]
    };
  }

  async handleUploadAttachment(args: any): Promise<any> {
    const fileBuffer = Buffer.from(args.fileData, 'base64');
    
    const attachment = await this.issuesService.uploadAttachment(
      args.issueId,
      fileBuffer,
      args.filename,
      args.contentType
    );
    
    return {
      content: [
        {
          type: 'text',
          text: `Anexo enviado com sucesso para a issue #${args.issueId}!\n\nID: ${attachment.id}\nNome: ${attachment.name}\nTamanho: ${attachment.size} bytes\nTipo: ${attachment.type}\nEnviado por: ${attachment.user.display_name}`
        }
      ]
    };
  }

  async handleDeleteAttachment(args: any): Promise<any> {
    await this.issuesService.deleteAttachment(args.issueId, args.attachmentId);
    
    return {
      content: [
        {
          type: 'text',
          text: `Anexo #${args.attachmentId} removido com sucesso da issue #${args.issueId}!`
        }
      ]
    };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createIssuesMcpHandlers(config: any): IssuesMcpHandlers {
  const issuesService = createIssuesService({
    baseUrl: config.baseUrl || process.env.BITBUCKET_CLOUD_API_URL || 'https://api.bitbucket.org/2.0',
    workspace: config.workspace || process.env.BITBUCKET_WORKSPACE || '',
    repository: config.repository || process.env.BITBUCKET_REPOSITORY || '',
    accessToken: config.accessToken || process.env.BITBUCKET_OAUTH_TOKEN || ''
  });

  return new IssuesMcpHandlers(issuesService);
}
