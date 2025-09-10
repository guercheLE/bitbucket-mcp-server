import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPool, Pool } from 'generic-pool';
import { SnippetService } from '../../services/cloud/snippet.service.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';
import { createMcpResponse, createErrorResponse } from '../../services/types/base.types.js';
import { z } from 'zod';

// Zod schemas for input validation
const ListSnippetsSchema = z.object({
  page: z.number().optional(),
  pagelen: z.number().optional(),
  role: z.string().optional(),
});

const CreateSnippetSchema = z.object({
  title: z.string(),
  files: z.string(),
  is_private: z.boolean().optional(),
  description: z.string().optional(),
});

const ListWorkspaceSnippetsSchema = z.object({
  workspace: z.string(),
  page: z.number().optional(),
  pagelen: z.number().optional(),
  role: z.string().optional(),
});

const CreateWorkspaceSnippetSchema = z.object({
  workspace: z.string(),
  title: z.string(),
  files: z.string(),
  is_private: z.boolean().optional(),
  description: z.string().optional(),
});

const GetSnippetSchema = z.object({
  workspace: z.string(),
  encoded_id: z.string(),
});

const UpdateSnippetSchema = z.object({
  workspace: z.string(),
  encoded_id: z.string(),
  title: z.string().optional(),
  files: z.string().optional(),
  is_private: z.boolean().optional(),
  description: z.string().optional(),
});

const DeleteSnippetSchema = z.object({
  workspace: z.string(),
  encoded_id: z.string(),
});

const ListSnippetCommentsSchema = z.object({
  workspace: z.string(),
  encoded_id: z.string(),
  page: z.number().optional(),
  pagelen: z.number().optional(),
});

const CreateSnippetCommentSchema = z.object({
  workspace: z.string(),
  encoded_id: z.string(),
  content: z.string(),
  inline: z.boolean().optional(),
});

const GetSnippetCommentSchema = z.object({
  workspace: z.string(),
  encoded_id: z.string(),
  comment_id: z.number(),
});

const UpdateSnippetCommentSchema = z.object({
  workspace: z.string(),
  encoded_id: z.string(),
  comment_id: z.number(),
  content: z.string(),
});

const DeleteSnippetCommentSchema = z.object({
  workspace: z.string(),
  encoded_id: z.string(),
  comment_id: z.number(),
});

const ListSnippetChangesSchema = z.object({
  workspace: z.string(),
  encoded_id: z.string(),
  page: z.number().optional(),
  pagelen: z.number().optional(),
});

const GetSnippetCommitSchema = z.object({
  workspace: z.string(),
  encoded_id: z.string(),
  revision: z.string(),
});

const GetSnippetFileSchema = z.object({
  workspace: z.string(),
  encoded_id: z.string(),
  path: z.string(),
  node_id: z.string().optional(),
});

const WatchSnippetSchema = z.object({
  workspace: z.string(),
  encoded_id: z.string(),
});

const StopWatchingSnippetSchema = z.object({
  workspace: z.string(),
  encoded_id: z.string(),
});

const ListSnippetWatchersSchema = z.object({
  workspace: z.string(),
  encoded_id: z.string(),
  page: z.number().optional(),
  pagelen: z.number().optional(),
});

/**
 * Cloud Snippet Tools
 * Ferramentas para gerenciamento de snippets no Bitbucket Cloud
 */
export class CloudSnippetTools {
  private static logger = Logger.forContext('CloudSnippetTools');
  private static snippetServicePool: Pool<SnippetService>;

  static initialize(): void {
    const snippetServiceFactory = {
      create: async () => new SnippetService(new ApiClient()),
      destroy: async () => {},
    };

    this.snippetServicePool = createPool(snippetServiceFactory, {
      min: 2,
      max: 10,
    });
    this.logger.info('Cloud Snippet tools initialized');
  }

  static async listSnippets(params: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('listSnippets');
    let service: SnippetService | null = null;

    try {
      service = await this.snippetServicePool.acquire();
      methodLogger.debug('Listing snippets:', {
        page: params.page,
        pagelen: params.pagelen,
        role: params.role,
      });

      const result = await service.listSnippets({
        page: params.page,
        pagelen: params.pagelen,
        role: params.role,
      });

      methodLogger.info('Successfully listed snippets');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list snippets:', error);
      if (service) {
        this.snippetServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse('Failed to list snippets');
    } finally {
      if (service) {
        this.snippetServicePool.release(service);
      }
    }
  }

  static async createSnippet(params: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('createSnippet');
    let service: SnippetService | null = null;

    try {
      service = await this.snippetServicePool.acquire();
      methodLogger.debug('Creating snippet:', {
        title: params.title,
        is_private: params.is_private,
        description: params.description,
      });

      const snippet = {
        title: params.title,
        files: JSON.parse(params.files),
        is_private: params.is_private,
        description: params.description,
        scm: 'git',
      };

      const result = await service.createSnippet({ snippet });

      methodLogger.info('Successfully created snippet');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create snippet:', error);
      if (service) {
        this.snippetServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse('Failed to create snippet');
    } finally {
      if (service) {
        this.snippetServicePool.release(service);
      }
    }
  }

  static async listWorkspaceSnippets(params: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('listWorkspaceSnippets');
    let service: SnippetService | null = null;

    try {
      service = await this.snippetServicePool.acquire();
      methodLogger.debug('Listing workspace snippets:', {
        workspace: params.workspace,
        page: params.page,
        pagelen: params.pagelen,
        role: params.role,
      });

      const result = await service.listWorkspaceSnippets({
        workspace: params.workspace,
        page: params.page,
        pagelen: params.pagelen,
        role: params.role,
      });

      methodLogger.info('Successfully listed workspace snippets');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list workspace snippets:', error);
      if (service) {
        this.snippetServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse('Failed to list workspace snippets');
    } finally {
      if (service) {
        this.snippetServicePool.release(service);
      }
    }
  }

  static async createWorkspaceSnippet(params: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('createWorkspaceSnippet');
    let service: SnippetService | null = null;

    try {
      service = await this.snippetServicePool.acquire();
      methodLogger.debug('Creating workspace snippet:', {
        workspace: params.workspace,
        title: params.title,
        is_private: params.is_private,
        description: params.description,
      });

      const snippet = {
        title: params.title,
        files: JSON.parse(params.files),
        is_private: params.is_private,
        description: params.description,
        scm: 'git',
      };

      const result = await service.createWorkspaceSnippet({
        workspace: params.workspace,
        snippet,
      });

      methodLogger.info('Successfully created workspace snippet');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create workspace snippet:', error);
      if (service) {
        this.snippetServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse('Failed to create workspace snippet');
    } finally {
      if (service) {
        this.snippetServicePool.release(service);
      }
    }
  }

  static async getSnippet(
    workspace: string,
    encodedId: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getSnippet');
    let service: SnippetService | null = null;

    try {
      service = await this.snippetServicePool.acquire();
      methodLogger.debug('Getting snippet:', {
        workspace,
        encoded_id: encodedId,
      });

      const result = await service.getSnippet({
        workspace,
        encoded_id: encodedId,
      });

      methodLogger.info('Successfully retrieved snippet');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get snippet:', error);
      if (service) {
        this.snippetServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse('Failed to get snippet');
    } finally {
      if (service) {
        this.snippetServicePool.release(service);
      }
    }
  }

  static async updateSnippet(params: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('updateSnippet');
    let service: SnippetService | null = null;

    try {
      service = await this.snippetServicePool.acquire();
      methodLogger.debug('Updating snippet:', {
        workspace: params.workspace,
        encoded_id: params.encoded_id,
        title: params.title,
        is_private: params.is_private,
        description: params.description,
      });

      const snippet: any = {};
      if (params.title) snippet.title = params.title;
      if (params.files) snippet.files = JSON.parse(params.files);
      if (params.is_private !== undefined) snippet.is_private = params.is_private;
      if (params.description) snippet.description = params.description;

      const result = await service.updateSnippet({
        workspace: params.workspace,
        encoded_id: params.encoded_id,
        snippet,
      });

      methodLogger.info('Successfully updated snippet');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update snippet:', error);
      if (service) {
        this.snippetServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse('Failed to update snippet');
    } finally {
      if (service) {
        this.snippetServicePool.release(service);
      }
    }
  }

  static async deleteSnippet(
    workspace: string,
    encodedId: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('deleteSnippet');
    let service: SnippetService | null = null;

    try {
      service = await this.snippetServicePool.acquire();
      methodLogger.debug('Deleting snippet:', {
        workspace,
        encoded_id: encodedId,
      });

      await service.deleteSnippet({
        workspace,
        encoded_id: encodedId,
      });

      methodLogger.info('Successfully deleted snippet');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to delete snippet:', error);
      if (service) {
        this.snippetServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse('Failed to delete snippet');
    } finally {
      if (service) {
        this.snippetServicePool.release(service);
      }
    }
  }

  static async listSnippetComments(params: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('listSnippetComments');
    let service: SnippetService | null = null;

    try {
      service = await this.snippetServicePool.acquire();
      methodLogger.debug('Listing snippet comments:', {
        workspace: params.workspace,
        encoded_id: params.encoded_id,
        page: params.page,
        pagelen: params.pagelen,
      });

      const result = await service.listSnippetComments({
        workspace: params.workspace,
        encoded_id: params.encoded_id,
        page: params.page,
        pagelen: params.pagelen,
      });

      methodLogger.info('Successfully listed snippet comments');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list snippet comments:', error);
      if (service) {
        this.snippetServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse('Failed to list snippet comments');
    } finally {
      if (service) {
        this.snippetServicePool.release(service);
      }
    }
  }

  static async createSnippetComment(params: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('createSnippetComment');
    let service: SnippetService | null = null;

    try {
      service = await this.snippetServicePool.acquire();
      methodLogger.debug('Creating snippet comment:', {
        workspace: params.workspace,
        encoded_id: params.encoded_id,
        content: params.content,
        inline: params.inline,
      });

      const comment = {
        content: params.content,
        inline: params.inline,
      };

      const result = await service.createSnippetComment({
        workspace: params.workspace,
        encoded_id: params.encoded_id,
        comment,
      });

      methodLogger.info('Successfully created snippet comment');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create snippet comment:', error);
      if (service) {
        this.snippetServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse('Failed to create snippet comment');
    } finally {
      if (service) {
        this.snippetServicePool.release(service);
      }
    }
  }

  static async getSnippetComment(params: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getSnippetComment');
    let service: SnippetService | null = null;

    try {
      service = await this.snippetServicePool.acquire();
      methodLogger.debug('Getting snippet comment:', {
        workspace: params.workspace,
        encoded_id: params.encoded_id,
        comment_id: params.comment_id,
      });

      const result = await service.getSnippetComment({
        workspace: params.workspace,
        encoded_id: params.encoded_id,
        comment_id: params.comment_id,
      });

      methodLogger.info('Successfully retrieved snippet comment');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get snippet comment:', error);
      if (service) {
        this.snippetServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse('Failed to get snippet comment');
    } finally {
      if (service) {
        this.snippetServicePool.release(service);
      }
    }
  }

  static async updateSnippetComment(params: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('updateSnippetComment');
    let service: SnippetService | null = null;

    try {
      service = await this.snippetServicePool.acquire();
      methodLogger.debug('Updating snippet comment:', {
        workspace: params.workspace,
        encoded_id: params.encoded_id,
        comment_id: params.comment_id,
        content: params.content,
      });

      const comment = {
        content: params.content,
      };

      const result = await service.updateSnippetComment({
        workspace: params.workspace,
        encoded_id: params.encoded_id,
        comment_id: params.comment_id,
        comment,
      });

      methodLogger.info('Successfully updated snippet comment');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update snippet comment:', error);
      if (service) {
        this.snippetServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse('Failed to update snippet comment');
    } finally {
      if (service) {
        this.snippetServicePool.release(service);
      }
    }
  }

  static async deleteSnippetComment(params: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('deleteSnippetComment');
    let service: SnippetService | null = null;

    try {
      service = await this.snippetServicePool.acquire();
      methodLogger.debug('Deleting snippet comment:', {
        workspace: params.workspace,
        encoded_id: params.encoded_id,
        comment_id: params.comment_id,
      });

      await service.deleteSnippetComment({
        workspace: params.workspace,
        encoded_id: params.encoded_id,
        comment_id: params.comment_id,
      });

      methodLogger.info('Successfully deleted snippet comment');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to delete snippet comment:', error);
      if (service) {
        this.snippetServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse('Failed to delete snippet comment');
    } finally {
      if (service) {
        this.snippetServicePool.release(service);
      }
    }
  }

  static async listSnippetChanges(params: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('listSnippetChanges');
    let service: SnippetService | null = null;

    try {
      service = await this.snippetServicePool.acquire();
      methodLogger.debug('Listing snippet changes:', {
        workspace: params.workspace,
        encoded_id: params.encoded_id,
        page: params.page,
        pagelen: params.pagelen,
      });

      const result = await service.listSnippetChanges({
        workspace: params.workspace,
        encoded_id: params.encoded_id,
        page: params.page,
        pagelen: params.pagelen,
      });

      methodLogger.info('Successfully listed snippet changes');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list snippet changes:', error);
      if (service) {
        this.snippetServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse('Failed to list snippet changes');
    } finally {
      if (service) {
        this.snippetServicePool.release(service);
      }
    }
  }

  static async getSnippetCommit(params: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getSnippetCommit');
    let service: SnippetService | null = null;

    try {
      service = await this.snippetServicePool.acquire();
      methodLogger.debug('Getting snippet commit:', {
        workspace: params.workspace,
        encoded_id: params.encoded_id,
        revision: params.revision,
      });

      const result = await service.getSnippetCommit({
        workspace: params.workspace,
        encoded_id: params.encoded_id,
        revision: params.revision,
      });

      methodLogger.info('Successfully retrieved snippet commit');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get snippet commit:', error);
      if (service) {
        this.snippetServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse('Failed to get snippet commit');
    } finally {
      if (service) {
        this.snippetServicePool.release(service);
      }
    }
  }

  static async getSnippetFile(params: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getSnippetFile');
    let service: SnippetService | null = null;

    try {
      service = await this.snippetServicePool.acquire();
      methodLogger.debug('Getting snippet file:', {
        workspace: params.workspace,
        encoded_id: params.encoded_id,
        path: params.path,
        node_id: params.node_id,
      });

      const result = await service.getSnippetFile({
        workspace: params.workspace,
        encoded_id: params.encoded_id,
        path: params.path,
        node_id: params.node_id,
      });

      methodLogger.info('Successfully retrieved snippet file');
      return createMcpResponse({ content: result }, output);
    } catch (error) {
      methodLogger.error('Failed to get snippet file:', error);
      if (service) {
        this.snippetServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse('Failed to get snippet file');
    } finally {
      if (service) {
        this.snippetServicePool.release(service);
      }
    }
  }

  static async watchSnippet(params: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('watchSnippet');
    let service: SnippetService | null = null;

    try {
      service = await this.snippetServicePool.acquire();
      methodLogger.debug('Watching snippet:', {
        workspace: params.workspace,
        encoded_id: params.encoded_id,
      });

      await service.watchSnippet({
        workspace: params.workspace,
        encoded_id: params.encoded_id,
      });

      methodLogger.info('Successfully started watching snippet');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to watch snippet:', error);
      if (service) {
        this.snippetServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse('Failed to watch snippet');
    } finally {
      if (service) {
        this.snippetServicePool.release(service);
      }
    }
  }

  static async stopWatchingSnippet(params: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('stopWatchingSnippet');
    let service: SnippetService | null = null;

    try {
      service = await this.snippetServicePool.acquire();
      methodLogger.debug('Stopping watching snippet:', {
        workspace: params.workspace,
        encoded_id: params.encoded_id,
      });

      await service.stopWatchingSnippet({
        workspace: params.workspace,
        encoded_id: params.encoded_id,
      });

      methodLogger.info('Successfully stopped watching snippet');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to stop watching snippet:', error);
      if (service) {
        this.snippetServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse('Failed to stop watching snippet');
    } finally {
      if (service) {
        this.snippetServicePool.release(service);
      }
    }
  }

  static async listSnippetWatchers(params: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('listSnippetWatchers');
    let service: SnippetService | null = null;

    try {
      service = await this.snippetServicePool.acquire();
      methodLogger.debug('Listing snippet watchers:', {
        workspace: params.workspace,
        encoded_id: params.encoded_id,
        page: params.page,
        pagelen: params.pagelen,
      });

      const result = await service.listSnippetWatchers({
        workspace: params.workspace,
        encoded_id: params.encoded_id,
        page: params.page,
        pagelen: params.pagelen,
      });

      methodLogger.info('Successfully listed snippet watchers');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list snippet watchers:', error);
      if (service) {
        this.snippetServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse('Failed to list snippet watchers');
    } finally {
      if (service) {
        this.snippetServicePool.release(service);
      }
    }
  }

  static register(server: McpServer): void {
    const registerLogger = this.logger.forMethod('register');

    // Initialize the service
    this.initialize();

    // List Snippets
    server.registerTool(
      'snippet_list',
      {
        description: `Lista snippets no Bitbucket Cloud.

**Funcionalidades:**
- Listagem de snippets
- Filtros e paginação
- Informações de status

**Parâmetros:**
- \`page\`: Número da página (opcional)
- \`pagelen\`: Tamanho da página (opcional)
- \`role\`: Papel do usuário (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de snippets.`,
        inputSchema: ListSnippetsSchema.shape,
      },
      async params => {
        const args = ListSnippetsSchema.parse(params);
        return await this.listSnippets({
          page: args.page,
          pagelen: args.pagelen,
          role: args.role,
        });
      }
    );

    // Create Snippet
    server.registerTool(
      'snippet_create',
      {
        description: `Cria um novo snippet no Bitbucket Cloud.

**Funcionalidades:**
- Criação de snippet
- Configuração de arquivos
- Metadados do snippet

**Parâmetros:**
- \`title\`: Título do snippet
- \`files\`: Arquivos do snippet (JSON)
- \`is_private\`: Se é privado (opcional)
- \`description\`: Descrição (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do snippet criado.`,
        inputSchema: CreateSnippetSchema.shape,
      },
      async params => {
        const args = CreateSnippetSchema.parse(params);
        return await this.createSnippet({
          title: args.title,
          files: args.files,
          is_private: args.is_private,
          description: args.description,
        });
      }
    );

    // List Workspace Snippets
    server.registerTool(
      'snippet_list_workspace',
      {
        description: `Lista snippets de um workspace no Bitbucket Cloud.

**Funcionalidades:**
- Listagem de snippets de workspace
- Filtros e paginação
- Informações de status

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`page\`: Número da página (opcional)
- \`pagelen\`: Tamanho da página (opcional)
- \`role\`: Papel do usuário (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de snippets do workspace.`,
        inputSchema: ListWorkspaceSnippetsSchema.shape,
      },
      async params => {
        const args = ListWorkspaceSnippetsSchema.parse(params);
        return await this.listWorkspaceSnippets({
          workspace: args.workspace,
          page: args.page,
          pagelen: args.pagelen,
          role: args.role,
        });
      }
    );

    // Create Workspace Snippet
    server.registerTool(
      'snippet_create_workspace',
      {
        description: `Cria um snippet para um workspace no Bitbucket Cloud.

**Funcionalidades:**
- Criação de snippet de workspace
- Configuração de arquivos
- Metadados do snippet

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`title\`: Título do snippet
- \`files\`: Arquivos do snippet (JSON)
- \`is_private\`: Se é privado (opcional)
- \`description\`: Descrição (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do snippet criado.`,
        inputSchema: CreateWorkspaceSnippetSchema.shape,
      },
      async params => {
        const args = CreateWorkspaceSnippetSchema.parse(params);
        return await this.createWorkspaceSnippet({
          workspace: args.workspace,
          title: args.title,
          files: args.files,
          is_private: args.is_private,
          description: args.description,
        });
      }
    );

    // Get Snippet
    server.registerTool(
      'snippet_get',
      {
        description: `Obtém detalhes de um snippet específico no Bitbucket Cloud.

**Funcionalidades:**
- Detalhes do snippet
- Informações de arquivos
- Metadados do snippet

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`encoded_id\`: ID codificado do snippet

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do snippet.`,
        inputSchema: GetSnippetSchema.shape,
      },
      async params => {
        const args = GetSnippetSchema.parse(params);
        return await this.getSnippet(args.workspace, args.encoded_id);
      }
    );

    // Update Snippet
    server.registerTool(
      'snippet_update',
      {
        description: `Atualiza um snippet existente no Bitbucket Cloud.

**Funcionalidades:**
- Atualização de snippet
- Modificação de arquivos
- Alteração de metadados

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`encoded_id\`: ID codificado do snippet
- \`title\`: Novo título (opcional)
- \`files\`: Novos arquivos (JSON, opcional)
- \`is_private\`: Se é privado (opcional)
- \`description\`: Nova descrição (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do snippet atualizado.`,
        inputSchema: UpdateSnippetSchema.shape,
      },
      async params => {
        const args = UpdateSnippetSchema.parse(params);
        return await this.updateSnippet({
          workspace: args.workspace,
          encoded_id: args.encoded_id,
          title: args.title,
          files: args.files,
          is_private: args.is_private,
          description: args.description,
        });
      }
    );

    // Delete Snippet
    server.registerTool(
      'snippet_delete',
      {
        description: `Exclui um snippet no Bitbucket Cloud.

**Funcionalidades:**
- Exclusão de snippet
- Limpeza de recursos
- Verificação de permissões

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`encoded_id\`: ID codificado do snippet

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com confirmação da exclusão.`,
        inputSchema: DeleteSnippetSchema.shape,
      },
      async params => {
        const args = DeleteSnippetSchema.parse(params);
        return await this.deleteSnippet(args.workspace, args.encoded_id);
      }
    );

    // List Snippet Comments
    server.registerTool(
      'snippet_list_comments',
      {
        description: `Lista comentários de um snippet no Bitbucket Cloud.

**Funcionalidades:**
- Listagem de comentários
- Filtros e paginação
- Informações de comentários

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`encoded_id\`: ID codificado do snippet
- \`page\`: Número da página (opcional)
- \`pagelen\`: Tamanho da página (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de comentários.`,
        inputSchema: ListSnippetCommentsSchema.shape,
      },
      async params => {
        const args = ListSnippetCommentsSchema.parse(params);
        return await this.listSnippetComments({
          workspace: args.workspace,
          encoded_id: args.encoded_id,
          page: args.page,
          pagelen: args.pagelen,
        });
      }
    );

    // Create Snippet Comment
    server.registerTool(
      'snippet_create_comment',
      {
        description: `Cria um comentário em um snippet no Bitbucket Cloud.

**Funcionalidades:**
- Criação de comentário
- Comentários inline
- Metadados do comentário

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`encoded_id\`: ID codificado do snippet
- \`content\`: Conteúdo do comentário
- \`inline\`: Se é comentário inline (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do comentário criado.`,
        inputSchema: CreateSnippetCommentSchema.shape,
      },
      async params => {
        const args = CreateSnippetCommentSchema.parse(params);
        return await this.createSnippetComment({
          workspace: args.workspace,
          encoded_id: args.encoded_id,
          content: args.content,
          inline: args.inline,
        });
      }
    );

    // Get Snippet Comment
    server.registerTool(
      'snippet_get_comment',
      {
        description: `Obtém detalhes de um comentário específico de snippet no Bitbucket Cloud.

**Funcionalidades:**
- Detalhes do comentário
- Informações de autor
- Metadados do comentário

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`encoded_id\`: ID codificado do snippet
- \`comment_id\`: ID do comentário

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do comentário.`,
        inputSchema: GetSnippetCommentSchema.shape,
      },
      async params => {
        const args = GetSnippetCommentSchema.parse(params);
        return await this.getSnippetComment({
          workspace: args.workspace,
          encoded_id: args.encoded_id,
          comment_id: args.comment_id,
        });
      }
    );

    // Update Snippet Comment
    server.registerTool(
      'snippet_update_comment',
      {
        description: `Atualiza um comentário de snippet no Bitbucket Cloud.

**Funcionalidades:**
- Atualização de comentário
- Modificação de conteúdo
- Preservação de metadados

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`encoded_id\`: ID codificado do snippet
- \`comment_id\`: ID do comentário
- \`content\`: Novo conteúdo do comentário

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do comentário atualizado.`,
        inputSchema: UpdateSnippetCommentSchema.shape,
      },
      async params => {
        const args = UpdateSnippetCommentSchema.parse(params);
        return await this.updateSnippetComment({
          workspace: args.workspace,
          encoded_id: args.encoded_id,
          comment_id: args.comment_id,
          content: args.content,
        });
      }
    );

    // Delete Snippet Comment
    server.registerTool(
      'snippet_delete_comment',
      {
        description: `Exclui um comentário de snippet no Bitbucket Cloud.

**Funcionalidades:**
- Exclusão de comentário
- Limpeza de recursos
- Verificação de permissões

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`encoded_id\`: ID codificado do snippet
- \`comment_id\`: ID do comentário

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com confirmação da exclusão.`,
        inputSchema: DeleteSnippetCommentSchema.shape,
      },
      async params => {
        const args = DeleteSnippetCommentSchema.parse(params);
        return await this.deleteSnippetComment({
          workspace: args.workspace,
          encoded_id: args.encoded_id,
          comment_id: args.comment_id,
        });
      }
    );

    // List Snippet Changes
    server.registerTool(
      'snippet_list_changes',
      {
        description: `Lista mudanças de um snippet no Bitbucket Cloud.

**Funcionalidades:**
- Listagem de mudanças
- Histórico de commits
- Informações de versão

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`encoded_id\`: ID codificado do snippet
- \`page\`: Número da página (opcional)
- \`pagelen\`: Tamanho da página (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de mudanças.`,
        inputSchema: ListSnippetChangesSchema.shape,
      },
      async params => {
        const args = ListSnippetChangesSchema.parse(params);
        return await this.listSnippetChanges({
          workspace: args.workspace,
          encoded_id: args.encoded_id,
          page: args.page,
          pagelen: args.pagelen,
        });
      }
    );

    // Get Snippet Commit
    server.registerTool(
      'snippet_get_commit',
      {
        description: `Obtém detalhes de um commit específico de snippet no Bitbucket Cloud.

**Funcionalidades:**
- Detalhes do commit
- Informações de mudanças
- Metadados do commit

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`encoded_id\`: ID codificado do snippet
- \`revision\`: Revisão do commit

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do commit.`,
        inputSchema: GetSnippetCommitSchema.shape,
      },
      async params => {
        const args = GetSnippetCommitSchema.parse(params);
        return await this.getSnippetCommit({
          workspace: args.workspace,
          encoded_id: args.encoded_id,
          revision: args.revision,
        });
      }
    );

    // Get Snippet File
    server.registerTool(
      'snippet_get_file',
      {
        description: `Obtém arquivo de um snippet no Bitbucket Cloud.

**Funcionalidades:**
- Conteúdo do arquivo
- Informações de arquivo
- Dados binários

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`encoded_id\`: ID codificado do snippet
- \`path\`: Caminho do arquivo
- \`node_id\`: ID do nó (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o conteúdo do arquivo.`,
        inputSchema: GetSnippetFileSchema.shape,
      },
      async params => {
        const args = GetSnippetFileSchema.parse(params);
        return await this.getSnippetFile({
          workspace: args.workspace,
          encoded_id: args.encoded_id,
          path: args.path,
          node_id: args.node_id,
        });
      }
    );

    // Watch Snippet
    server.registerTool(
      'snippet_watch',
      {
        description: `Inicia observação de um snippet no Bitbucket Cloud.

**Funcionalidades:**
- Início de observação
- Notificações de mudanças
- Gerenciamento de watch

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`encoded_id\`: ID codificado do snippet

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com confirmação da observação.`,
        inputSchema: WatchSnippetSchema.shape,
      },
      async params => {
        const args = WatchSnippetSchema.parse(params);
        return await this.watchSnippet({
          workspace: args.workspace,
          encoded_id: args.encoded_id,
        });
      }
    );

    // Stop Watching Snippet
    server.registerTool(
      'snippet_stop_watching',
      {
        description: `Para observação de um snippet no Bitbucket Cloud.

**Funcionalidades:**
- Parada de observação
- Remoção de notificações
- Limpeza de watch

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`encoded_id\`: ID codificado do snippet

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com confirmação da parada da observação.`,
        inputSchema: StopWatchingSnippetSchema.shape,
      },
      async params => {
        const args = StopWatchingSnippetSchema.parse(params);
        return await this.stopWatchingSnippet({
          workspace: args.workspace,
          encoded_id: args.encoded_id,
        });
      }
    );

    // List Snippet Watchers
    server.registerTool(
      'snippet_list_watchers',
      {
        description: `Lista observadores de um snippet no Bitbucket Cloud.

**Funcionalidades:**
- Listagem de observadores
- Informações de usuários
- Filtros e paginação

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`encoded_id\`: ID codificado do snippet
- \`page\`: Número da página (opcional)
- \`pagelen\`: Tamanho da página (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de observadores.`,
        inputSchema: ListSnippetWatchersSchema.shape,
      },
      async params => {
        const args = ListSnippetWatchersSchema.parse(params);
        return await this.listSnippetWatchers({
          workspace: args.workspace,
          encoded_id: args.encoded_id,
          page: args.page,
          pagelen: args.pagelen,
        });
      }
    );

    registerLogger.info('Successfully registered all cloud snippet tools');
  }
}
