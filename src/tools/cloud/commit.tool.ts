import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPool, Pool } from 'generic-pool';
import { Logger } from '../../utils/logger.util.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { CommitService } from '../../services/cloud/commit.service.js';
import { createMcpResponse, createErrorResponse } from '../../services/types/base.types.js';
import { z } from 'zod';

// Zod schemas for parameter validation
const GetCommitSchema = z.object({
  workspaceSlug: z.string(),
  repoSlug: z.string(),
  commit: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ApproveCommitSchema = z.object({
  workspaceSlug: z.string(),
  repoSlug: z.string(),
  commit: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UnapproveCommitSchema = z.object({
  workspaceSlug: z.string(),
  repoSlug: z.string(),
  commit: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListCommitCommentsSchema = z.object({
  workspaceSlug: z.string(),
  repoSlug: z.string(),
  commit: z.string(),
  page: z.number().optional(),
  pagelen: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateCommitCommentSchema = z.object({
  workspaceSlug: z.string(),
  repoSlug: z.string(),
  commit: z.string(),
  content: z.string(),
  inline: z.any().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetCommitCommentSchema = z.object({
  workspaceSlug: z.string(),
  repoSlug: z.string(),
  commit: z.string(),
  commentId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateCommitCommentSchema = z.object({
  workspaceSlug: z.string(),
  repoSlug: z.string(),
  commit: z.string(),
  commentId: z.number(),
  content: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteCommitCommentSchema = z.object({
  workspaceSlug: z.string(),
  repoSlug: z.string(),
  commit: z.string(),
  commentId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListCommitsSchema = z.object({
  workspaceSlug: z.string(),
  repoSlug: z.string(),
  page: z.number().optional(),
  pagelen: z.number().optional(),
  include: z.string().optional(),
  exclude: z.string().optional(),
  q: z.string().optional(),
  sort: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListCommitsForRevisionSchema = z.object({
  workspaceSlug: z.string(),
  repoSlug: z.string(),
  revision: z.string(),
  page: z.number().optional(),
  pagelen: z.number().optional(),
  include: z.string().optional(),
  exclude: z.string().optional(),
  q: z.string().optional(),
  sort: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CompareCommitsSchema = z.object({
  workspaceSlug: z.string(),
  repoSlug: z.string(),
  spec: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetCommitDiffStatsSchema = z.object({
  workspaceSlug: z.string(),
  repoSlug: z.string(),
  spec: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetCommonAncestorSchema = z.object({
  workspaceSlug: z.string(),
  repoSlug: z.string(),
  spec: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetCommitPatchSchema = z.object({
  workspaceSlug: z.string(),
  repoSlug: z.string(),
  spec: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

/**
 * Commit Tools for Bitbucket Cloud
 *
 * Comprehensive commit management including:
 * - Get commit details
 * - Approve/unapprove commits
 * - Manage commit comments
 * - List commits
 * - Compare commits
 * - Get commit statistics
 */
export class CloudCommitTools {
  private static logger = Logger.forContext('CloudCommitTools');
  private static commitServicePool: Pool<CommitService>;

  static initialize(): void {
    const commitServiceFactory = {
      create: async () => new CommitService(new ApiClient()),
      destroy: async () => {},
    };

    this.commitServicePool = createPool(commitServiceFactory, { min: 2, max: 10 });
    this.logger.info('Cloud Commit tools initialized');
  }

  /**
   * Get a specific commit
   */
  static async getCommit(
    workspaceSlug: string,
    repoSlug: string,
    commit: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getCommit');
    let commitService = null;

    try {
      methodLogger.debug('Getting commit:', { workspaceSlug, repoSlug, commit });
      commitService = await this.commitServicePool.acquire();

      const result = await commitService.getCommit({
        workspace: workspaceSlug,
        repo_slug: repoSlug,
        commit,
      });

      methodLogger.debug('Successfully retrieved commit');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get commit:', error);
      if (commitService) {
        this.commitServicePool.destroy(commitService);
        commitService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (commitService) {
        this.commitServicePool.release(commitService);
      }
    }
  }

  /**
   * Approve a commit
   */
  static async approveCommit(
    workspaceSlug: string,
    repoSlug: string,
    commit: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('approveCommit');
    let commitService = null;

    try {
      methodLogger.debug('Approving commit:', { workspaceSlug, repoSlug, commit });
      commitService = await this.commitServicePool.acquire();

      await commitService.approveCommit({
        workspace: workspaceSlug,
        repo_slug: repoSlug,
        commit,
      });

      methodLogger.debug('Successfully approved commit');
      return createMcpResponse({ message: 'Commit approved successfully' }, output);
    } catch (error) {
      methodLogger.error('Failed to approve commit:', error);
      if (commitService) {
        this.commitServicePool.destroy(commitService);
        commitService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (commitService) {
        this.commitServicePool.release(commitService);
      }
    }
  }

  /**
   * Unapprove a commit
   */
  static async unapproveCommit(
    workspaceSlug: string,
    repoSlug: string,
    commit: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('unapproveCommit');
    let commitService = null;

    try {
      methodLogger.debug('Unapproving commit:', { workspaceSlug, repoSlug, commit });
      commitService = await this.commitServicePool.acquire();

      await commitService.unapproveCommit({
        workspace: workspaceSlug,
        repo_slug: repoSlug,
        commit,
      });

      methodLogger.debug('Successfully unapproved commit');
      return createMcpResponse({ message: 'Commit unapproved successfully' }, output);
    } catch (error) {
      methodLogger.error('Failed to unapprove commit:', error);
      if (commitService) {
        this.commitServicePool.destroy(commitService);
        commitService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (commitService) {
        this.commitServicePool.release(commitService);
      }
    }
  }

  /**
   * List comments on a commit
   */
  static async listCommitComments(
    workspaceSlug: string,
    repoSlug: string,
    commit: string,
    page?: number,
    pagelen?: number,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('listCommitComments');
    let commitService = null;

    try {
      methodLogger.debug('Listing commit comments:', { workspaceSlug, repoSlug, commit });
      commitService = await this.commitServicePool.acquire();

      const result = await commitService.listCommitComments({
        workspace: workspaceSlug,
        repo_slug: repoSlug,
        commit,
        page,
        pagelen,
      });

      methodLogger.debug('Successfully listed commit comments');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list commit comments:', error);
      if (commitService) {
        this.commitServicePool.destroy(commitService);
        commitService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (commitService) {
        this.commitServicePool.release(commitService);
      }
    }
  }

  /**
   * Create a comment on a commit
   */
  static async createCommitComment(
    workspaceSlug: string,
    repoSlug: string,
    commit: string,
    content: string,
    inline?: any,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('createCommitComment');
    let commitService = null;

    try {
      methodLogger.debug('Creating commit comment:', { workspaceSlug, repoSlug, commit });
      commitService = await this.commitServicePool.acquire();

      const result = await commitService.createCommitComment({
        workspace: workspaceSlug,
        repo_slug: repoSlug,
        commit,
        content,
        inline,
      });

      methodLogger.debug('Successfully created commit comment');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create commit comment:', error);
      if (commitService) {
        this.commitServicePool.destroy(commitService);
        commitService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (commitService) {
        this.commitServicePool.release(commitService);
      }
    }
  }

  /**
   * Get a specific commit comment
   */
  static async getCommitComment(
    workspaceSlug: string,
    repoSlug: string,
    commit: string,
    commentId: number,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getCommitComment');
    let commitService = null;

    try {
      methodLogger.debug('Getting commit comment:', { workspaceSlug, repoSlug, commit, commentId });
      commitService = await this.commitServicePool.acquire();

      const result = await commitService.getCommitComment({
        workspace: workspaceSlug,
        repo_slug: repoSlug,
        commit,
        comment_id: commentId,
      });

      methodLogger.debug('Successfully retrieved commit comment');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get commit comment:', error);
      if (commitService) {
        this.commitServicePool.destroy(commitService);
        commitService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (commitService) {
        this.commitServicePool.release(commitService);
      }
    }
  }

  /**
   * Update a commit comment
   */
  static async updateCommitComment(
    workspaceSlug: string,
    repoSlug: string,
    commit: string,
    commentId: number,
    content: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('updateCommitComment');
    let commitService = null;

    try {
      methodLogger.debug('Updating commit comment:', {
        workspaceSlug,
        repoSlug,
        commit,
        commentId,
      });
      commitService = await this.commitServicePool.acquire();

      const result = await commitService.updateCommitComment({
        workspace: workspaceSlug,
        repo_slug: repoSlug,
        commit,
        comment_id: commentId,
        content,
      });

      methodLogger.debug('Successfully updated commit comment');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update commit comment:', error);
      if (commitService) {
        this.commitServicePool.destroy(commitService);
        commitService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (commitService) {
        this.commitServicePool.release(commitService);
      }
    }
  }

  /**
   * Delete a commit comment
   */
  static async deleteCommitComment(
    workspaceSlug: string,
    repoSlug: string,
    commit: string,
    commentId: number,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('deleteCommitComment');
    let commitService = null;

    try {
      methodLogger.debug('Deleting commit comment:', {
        workspaceSlug,
        repoSlug,
        commit,
        commentId,
      });
      commitService = await this.commitServicePool.acquire();

      await commitService.deleteCommitComment({
        workspace: workspaceSlug,
        repo_slug: repoSlug,
        commit,
        comment_id: commentId,
      });

      methodLogger.debug('Successfully deleted commit comment');
      return createMcpResponse({ message: 'Commit comment deleted successfully' }, output);
    } catch (error) {
      methodLogger.error('Failed to delete commit comment:', error);
      if (commitService) {
        this.commitServicePool.destroy(commitService);
        commitService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (commitService) {
        this.commitServicePool.release(commitService);
      }
    }
  }

  /**
   * List commits in a repository
   */
  static async listCommits(
    workspaceSlug: string,
    repoSlug: string,
    page?: number,
    pagelen?: number,
    include?: string,
    exclude?: string,
    q?: string,
    sort?: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('listCommits');
    let commitService = null;

    try {
      methodLogger.debug('Listing commits:', { workspaceSlug, repoSlug });
      commitService = await this.commitServicePool.acquire();

      const result = await commitService.listCommits({
        workspace: workspaceSlug,
        repo_slug: repoSlug,
        page,
        pagelen,
        include,
        exclude,
        q,
        sort,
      });

      methodLogger.debug('Successfully listed commits');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list commits:', error);
      if (commitService) {
        this.commitServicePool.destroy(commitService);
        commitService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (commitService) {
        this.commitServicePool.release(commitService);
      }
    }
  }

  /**
   * List commits for a specific revision
   */
  static async listCommitsForRevision(
    workspaceSlug: string,
    repoSlug: string,
    revision: string,
    page?: number,
    pagelen?: number,
    include?: string,
    exclude?: string,
    q?: string,
    sort?: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('listCommitsForRevision');
    let commitService = null;

    try {
      methodLogger.debug('Listing commits for revision:', { workspaceSlug, repoSlug, revision });
      commitService = await this.commitServicePool.acquire();

      const result = await commitService.listCommitsForRevision({
        workspace: workspaceSlug,
        repo_slug: repoSlug,
        revision,
        page,
        pagelen,
        include,
        exclude,
        q,
        sort,
      });

      methodLogger.debug('Successfully listed commits for revision');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list commits for revision:', error);
      if (commitService) {
        this.commitServicePool.destroy(commitService);
        commitService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (commitService) {
        this.commitServicePool.release(commitService);
      }
    }
  }

  /**
   * Compare two commits
   */
  static async compareCommits(
    workspaceSlug: string,
    repoSlug: string,
    spec: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('compareCommits');
    let commitService = null;

    try {
      methodLogger.debug('Comparing commits:', { workspaceSlug, repoSlug, spec });
      commitService = await this.commitServicePool.acquire();

      const result = await commitService.compareCommits({
        workspace: workspaceSlug,
        repo_slug: repoSlug,
        spec,
      });

      methodLogger.debug('Successfully compared commits');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to compare commits:', error);
      if (commitService) {
        this.commitServicePool.destroy(commitService);
        commitService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (commitService) {
        this.commitServicePool.release(commitService);
      }
    }
  }

  /**
   * Get diff stats between two commits
   */
  static async getCommitDiffStats(
    workspaceSlug: string,
    repoSlug: string,
    spec: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getCommitDiffStats');
    let commitService = null;

    try {
      methodLogger.debug('Getting commit diff stats:', { workspaceSlug, repoSlug, spec });
      commitService = await this.commitServicePool.acquire();

      const result = await commitService.getCommitDiffStats({
        workspace: workspaceSlug,
        repo_slug: repoSlug,
        spec,
      });

      methodLogger.debug('Successfully retrieved commit diff stats');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get commit diff stats:', error);
      if (commitService) {
        this.commitServicePool.destroy(commitService);
        commitService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (commitService) {
        this.commitServicePool.release(commitService);
      }
    }
  }

  /**
   * Get common ancestor between two commits
   */
  static async getCommonAncestor(
    workspaceSlug: string,
    repoSlug: string,
    spec: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getCommonAncestor');
    let commitService = null;

    try {
      methodLogger.debug('Getting common ancestor:', { workspaceSlug, repoSlug, spec });
      commitService = await this.commitServicePool.acquire();

      const result = await commitService.getCommonAncestor({
        workspace: workspaceSlug,
        repo_slug: repoSlug,
        spec,
      });

      methodLogger.debug('Successfully retrieved common ancestor');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get common ancestor:', error);
      if (commitService) {
        this.commitServicePool.destroy(commitService);
        commitService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (commitService) {
        this.commitServicePool.release(commitService);
      }
    }
  }

  /**
   * Get patch between two commits
   */
  static async getCommitPatch(
    workspaceSlug: string,
    repoSlug: string,
    spec: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getCommitPatch');
    let commitService = null;

    try {
      methodLogger.debug('Getting commit patch:', { workspaceSlug, repoSlug, spec });
      commitService = await this.commitServicePool.acquire();

      const result = await commitService.getCommitPatch({
        workspace: workspaceSlug,
        repo_slug: repoSlug,
        spec,
      });

      methodLogger.debug('Successfully retrieved commit patch');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get commit patch:', error);
      if (commitService) {
        this.commitServicePool.destroy(commitService);
        commitService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (commitService) {
        this.commitServicePool.release(commitService);
      }
    }
  }

  /**
   * Register all commit tools with the MCP server
   */
  static register(server: McpServer): void {
    const registerLogger = this.logger.forMethod('register');

    // Initialize the service
    this.initialize();

    // Register get commit tool
    server.registerTool(
      'commit_get',
      {
        description: `Obtém detalhes de um commit específico no Bitbucket Cloud.

**Funcionalidades:**
- Informações detalhadas do commit
- Metadados do autor e data
- Hash e mensagem do commit
- Estatísticas de mudanças

**Parâmetros:**
- \`workspaceSlug\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`commit\`: Hash ou identificador do commit

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do commit.`,
        inputSchema: GetCommitSchema.shape,
      },
      async (params: z.infer<typeof GetCommitSchema>) => {
        const validatedParams = GetCommitSchema.parse(params);
        return this.getCommit(
          validatedParams.workspaceSlug,
          validatedParams.repoSlug,
          validatedParams.commit,
          validatedParams.output
        );
      }
    );

    // Register approve commit tool
    server.registerTool(
      'commit_approve',
      {
        description: `Aprova um commit específico no Bitbucket Cloud.

**Funcionalidades:**
- Aprovação de commits
- Controle de qualidade de código
- Integração com workflows de revisão

**Parâmetros:**
- \`workspaceSlug\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`commit\`: Hash ou identificador do commit

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a confirmação da aprovação.`,
        inputSchema: ApproveCommitSchema.shape,
      },
      async (params: z.infer<typeof ApproveCommitSchema>) => {
        const validatedParams = ApproveCommitSchema.parse(params);
        return this.approveCommit(
          validatedParams.workspaceSlug,
          validatedParams.repoSlug,
          validatedParams.commit,
          validatedParams.output
        );
      }
    );

    // Register unapprove commit tool
    server.registerTool(
      'commit_unapprove',
      {
        description: `Remove a aprovação de um commit específico no Bitbucket Cloud.

**Funcionalidades:**
- Remoção de aprovação de commits
- Reversão de decisões de revisão
- Controle de qualidade de código

**Parâmetros:**
- \`workspaceSlug\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`commit\`: Hash ou identificador do commit

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a confirmação da remoção da aprovação.`,
        inputSchema: UnapproveCommitSchema.shape,
      },
      async (params: z.infer<typeof UnapproveCommitSchema>) => {
        const validatedParams = UnapproveCommitSchema.parse(params);
        return this.unapproveCommit(
          validatedParams.workspaceSlug,
          validatedParams.repoSlug,
          validatedParams.commit,
          validatedParams.output
        );
      }
    );

    // Register list commit comments tool
    server.registerTool(
      'commit_list_comments',
      {
        description: `Lista comentários de um commit específico no Bitbucket Cloud.

**Funcionalidades:**
- Listagem de comentários de commit
- Paginação de resultados
- Informações detalhadas dos comentários

**Parâmetros:**
- \`workspaceSlug\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`commit\`: Hash ou identificador do commit
- \`page\`: Número da página (opcional)
- \`pagelen\`: Tamanho da página (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de comentários.`,
        inputSchema: ListCommitCommentsSchema.shape,
      },
      async (params: z.infer<typeof ListCommitCommentsSchema>) => {
        const validatedParams = ListCommitCommentsSchema.parse(params);
        return this.listCommitComments(
          validatedParams.workspaceSlug,
          validatedParams.repoSlug,
          validatedParams.commit,
          validatedParams.page,
          validatedParams.pagelen,
          validatedParams.output
        );
      }
    );

    // Register create commit comment tool
    server.registerTool(
      'commit_create_comment',
      {
        description: `Cria um comentário em um commit específico no Bitbucket Cloud.

**Funcionalidades:**
- Criação de comentários em commits
- Comentários inline opcionais
- Feedback detalhado sobre mudanças

**Parâmetros:**
- \`workspaceSlug\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`commit\`: Hash ou identificador do commit
- \`content\`: Conteúdo do comentário
- \`inline\`: Informações inline (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do comentário criado.`,
        inputSchema: CreateCommitCommentSchema.shape,
      },
      async (params: z.infer<typeof CreateCommitCommentSchema>) => {
        const validatedParams = CreateCommitCommentSchema.parse(params);
        return this.createCommitComment(
          validatedParams.workspaceSlug,
          validatedParams.repoSlug,
          validatedParams.commit,
          validatedParams.content,
          validatedParams.inline,
          validatedParams.output
        );
      }
    );

    // Register list commits tool
    server.registerTool(
      'commit_list',
      {
        description: `Lista commits de um repositório no Bitbucket Cloud.

**Funcionalidades:**
- Listagem de commits com paginação
- Filtros e ordenação
- Informações detalhadas de cada commit

**Parâmetros:**
- \`workspaceSlug\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`page\`: Número da página (opcional)
- \`pagelen\`: Tamanho da página (opcional)
- \`include\`: Campos a incluir (opcional)
- \`exclude\`: Campos a excluir (opcional)
- \`q\`: Query de busca (opcional)
- \`sort\`: Campo de ordenação (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de commits.`,
        inputSchema: ListCommitsSchema.shape,
      },
      async (params: z.infer<typeof ListCommitsSchema>) => {
        const validatedParams = ListCommitsSchema.parse(params);
        return this.listCommits(
          validatedParams.workspaceSlug,
          validatedParams.repoSlug,
          validatedParams.page,
          validatedParams.pagelen,
          validatedParams.include,
          validatedParams.exclude,
          validatedParams.q,
          validatedParams.sort,
          validatedParams.output
        );
      }
    );

    // Register compare commits tool
    server.registerTool(
      'commit_compare',
      {
        description: `Compara dois commits no Bitbucket Cloud.

**Funcionalidades:**
- Comparação entre commits
- Análise de diferenças
- Histórico de mudanças

**Parâmetros:**
- \`workspaceSlug\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`spec\`: Especificação dos commits (ex: "main..feature")

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a comparação entre commits.`,
        inputSchema: CompareCommitsSchema.shape,
      },
      async (params: z.infer<typeof CompareCommitsSchema>) => {
        const validatedParams = CompareCommitsSchema.parse(params);
        return this.compareCommits(
          validatedParams.workspaceSlug,
          validatedParams.repoSlug,
          validatedParams.spec,
          validatedParams.output
        );
      }
    );

    registerLogger.info('Successfully registered all cloud commit tools');
  }
}
