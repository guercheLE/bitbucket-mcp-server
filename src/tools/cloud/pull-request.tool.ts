import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPool, Pool } from 'generic-pool';
import { Logger } from '../../utils/logger.util.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { PullRequestService } from '../../services/cloud/pull-request.service.js';
import { createMcpResponse, createErrorResponse } from '../../services/types/base.types.js';
import { z } from 'zod';

// Zod schemas for parameter validation
const GetPullRequestSchema = z.object({
  workspaceSlug: z.string(),
  repoSlug: z.string(),
  pullRequestId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListPullRequestsSchema = z.object({
  workspaceSlug: z.string(),
  repoSlug: z.string(),
  state: z.string().optional(),
  page: z.number().optional(),
  pagelen: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreatePullRequestSchema = z.object({
  workspaceSlug: z.string(),
  repoSlug: z.string(),
  title: z.string(),
  sourceBranch: z.string(),
  destinationBranch: z.string(),
  description: z.string().optional(),
  reviewers: z.array(z.string()).optional(),
  closeSourceBranch: z.boolean().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const MergePullRequestSchema = z.object({
  workspaceSlug: z.string(),
  repoSlug: z.string(),
  pullRequestId: z.number(),
  mergeStrategy: z.string().optional(),
  message: z.string().optional(),
  closeSourceBranch: z.boolean().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ApprovePullRequestSchema = z.object({
  workspaceSlug: z.string(),
  repoSlug: z.string(),
  pullRequestId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetPullRequestDiffSchema = z.object({
  workspaceSlug: z.string(),
  repoSlug: z.string(),
  pullRequestId: z.number(),
  context: z.number().optional(),
  path: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdatePullRequestSchema = z.object({
  workspaceSlug: z.string(),
  repoSlug: z.string(),
  pullRequestId: z.number(),
  title: z.string().optional(),
  description: z.string().optional(),
  closeSourceBranch: z.boolean().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeclinePullRequestSchema = z.object({
  workspaceSlug: z.string(),
  repoSlug: z.string(),
  pullRequestId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UnapprovePullRequestSchema = z.object({
  workspaceSlug: z.string(),
  repoSlug: z.string(),
  pullRequestId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const RequestChangesPullRequestSchema = z.object({
  workspaceSlug: z.string(),
  repoSlug: z.string(),
  pullRequestId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListPullRequestCommentsSchema = z.object({
  workspaceSlug: z.string(),
  repoSlug: z.string(),
  pullRequestId: z.number(),
  page: z.number().optional(),
  pagelen: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreatePullRequestCommentSchema = z.object({
  workspaceSlug: z.string(),
  repoSlug: z.string(),
  pullRequestId: z.number(),
  content: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetPullRequestPatchSchema = z.object({
  workspaceSlug: z.string(),
  repoSlug: z.string(),
  pullRequestId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

/**
 * Pull Request Tools for Bitbucket Cloud
 *
 * Comprehensive pull request management including:
 * - Get pull request details
 * - List pull requests
 * - Create/update/delete pull requests
 * - Manage pull request comments
 * - Approve/decline/merge pull requests
 * - Get pull request diff and patch
 */
export class CloudPullRequestTools {
  private static logger = Logger.forContext('CloudPullRequestTools');
  private static pullRequestServicePool: Pool<PullRequestService>;

  static initialize(): void {
    const pullRequestServiceFactory = {
      create: async () =>
        new PullRequestService(new ApiClient(), Logger.forContext('PullRequestService')),
      destroy: async () => {},
    };

    this.pullRequestServicePool = createPool(pullRequestServiceFactory, { min: 2, max: 10 });
    this.logger.info('Cloud Pull Request tools initialized');
  }

  /**
   * Get a specific pull request
   */
  static async getPullRequest(
    workspaceSlug: string,
    repoSlug: string,
    pullRequestId: number,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getPullRequest');
    let pullRequestService = null;

    try {
      methodLogger.debug('Getting pull request:', { workspaceSlug, repoSlug, pullRequestId });
      pullRequestService = await this.pullRequestServicePool.acquire();

      const result = await pullRequestService.getPullRequest(
        workspaceSlug,
        repoSlug,
        pullRequestId
      );

      methodLogger.debug('Successfully retrieved pull request');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get pull request:', error);
      if (pullRequestService) {
        this.pullRequestServicePool.destroy(pullRequestService);
        pullRequestService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (pullRequestService) {
        this.pullRequestServicePool.release(pullRequestService);
      }
    }
  }

  /**
   * List pull requests
   */
  static async listPullRequests(
    workspaceSlug: string,
    repoSlug: string,
    state?: string,
    page?: number,
    pagelen?: number,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('listPullRequests');
    let pullRequestService = null;

    try {
      methodLogger.debug('Listing pull requests:', { workspaceSlug, repoSlug });
      pullRequestService = await this.pullRequestServicePool.acquire();

      const params: any = {};
      if (state) params.state = state;
      if (page) params.page = page;
      if (pagelen) params.pagelen = pagelen;

      const result = await pullRequestService.listPullRequests(workspaceSlug, repoSlug, params);

      methodLogger.debug('Successfully listed pull requests');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list pull requests:', error);
      if (pullRequestService) {
        this.pullRequestServicePool.destroy(pullRequestService);
        pullRequestService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (pullRequestService) {
        this.pullRequestServicePool.release(pullRequestService);
      }
    }
  }

  /**
   * Create a pull request
   */
  static async createPullRequest(
    workspaceSlug: string,
    repoSlug: string,
    title: string,
    sourceBranch: string,
    destinationBranch: string,
    description?: string,
    closeSourceBranch?: boolean,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('createPullRequest');
    let pullRequestService = null;

    try {
      methodLogger.debug('Creating pull request:', { workspaceSlug, repoSlug, title });
      pullRequestService = await this.pullRequestServicePool.acquire();

      const request = {
        title,
        source: { branch: { name: sourceBranch } },
        destination: { branch: { name: destinationBranch } },
        description: description,
        close_source_branch: closeSourceBranch,
      };

      const result = await pullRequestService.createPullRequest(workspaceSlug, repoSlug, request);

      methodLogger.debug('Successfully created pull request');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create pull request:', error);
      if (pullRequestService) {
        this.pullRequestServicePool.destroy(pullRequestService);
        pullRequestService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (pullRequestService) {
        this.pullRequestServicePool.release(pullRequestService);
      }
    }
  }

  /**
   * Update a pull request
   */
  static async updatePullRequest(
    workspaceSlug: string,
    repoSlug: string,
    pullRequestId: number,
    title?: string,
    description?: string,
    closeSourceBranch?: boolean,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('updatePullRequest');
    let pullRequestService = null;

    try {
      methodLogger.debug('Updating pull request:', { workspaceSlug, repoSlug, pullRequestId });
      pullRequestService = await this.pullRequestServicePool.acquire();

      const request: any = {};
      if (title) request.title = title;
      if (description) request.description = description;
      if (closeSourceBranch !== undefined) request.close_source_branch = closeSourceBranch;

      const result = await pullRequestService.updatePullRequest(
        workspaceSlug,
        repoSlug,
        pullRequestId,
        request
      );

      methodLogger.debug('Successfully updated pull request');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update pull request:', error);
      if (pullRequestService) {
        this.pullRequestServicePool.destroy(pullRequestService);
        pullRequestService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (pullRequestService) {
        this.pullRequestServicePool.release(pullRequestService);
      }
    }
  }

  /**
   * Decline a pull request
   */
  static async declinePullRequest(
    workspaceSlug: string,
    repoSlug: string,
    pullRequestId: number,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('declinePullRequest');
    let pullRequestService = null;

    try {
      methodLogger.debug('Declining pull request:', { workspaceSlug, repoSlug, pullRequestId });
      pullRequestService = await this.pullRequestServicePool.acquire();

      const result = await pullRequestService.declinePullRequest(
        workspaceSlug,
        repoSlug,
        pullRequestId
      );

      methodLogger.debug('Successfully declined pull request');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to decline pull request:', error);
      if (pullRequestService) {
        this.pullRequestServicePool.destroy(pullRequestService);
        pullRequestService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (pullRequestService) {
        this.pullRequestServicePool.release(pullRequestService);
      }
    }
  }

  /**
   * Merge a pull request
   */
  static async mergePullRequest(
    workspaceSlug: string,
    repoSlug: string,
    pullRequestId: number,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('mergePullRequest');
    let pullRequestService = null;

    try {
      methodLogger.debug('Merging pull request:', { workspaceSlug, repoSlug, pullRequestId });
      pullRequestService = await this.pullRequestServicePool.acquire();

      const result = await pullRequestService.mergePullRequest(
        workspaceSlug,
        repoSlug,
        pullRequestId
      );

      methodLogger.debug('Successfully merged pull request');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to merge pull request:', error);
      if (pullRequestService) {
        this.pullRequestServicePool.destroy(pullRequestService);
        pullRequestService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (pullRequestService) {
        this.pullRequestServicePool.release(pullRequestService);
      }
    }
  }

  /**
   * Approve a pull request
   */
  static async approvePullRequest(
    workspaceSlug: string,
    repoSlug: string,
    pullRequestId: number,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('approvePullRequest');
    let pullRequestService = null;

    try {
      methodLogger.debug('Approving pull request:', { workspaceSlug, repoSlug, pullRequestId });
      pullRequestService = await this.pullRequestServicePool.acquire();

      const result = await pullRequestService.approvePullRequest(
        workspaceSlug,
        repoSlug,
        pullRequestId
      );

      methodLogger.debug('Successfully approved pull request');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to approve pull request:', error);
      if (pullRequestService) {
        this.pullRequestServicePool.destroy(pullRequestService);
        pullRequestService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (pullRequestService) {
        this.pullRequestServicePool.release(pullRequestService);
      }
    }
  }

  /**
   * Unapprove a pull request
   */
  static async unapprovePullRequest(
    workspaceSlug: string,
    repoSlug: string,
    pullRequestId: number,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('unapprovePullRequest');
    let pullRequestService = null;

    try {
      methodLogger.debug('Unapproving pull request:', { workspaceSlug, repoSlug, pullRequestId });
      pullRequestService = await this.pullRequestServicePool.acquire();

      const result = await pullRequestService.unapprovePullRequest(
        workspaceSlug,
        repoSlug,
        pullRequestId
      );

      methodLogger.debug('Successfully unapproved pull request');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to unapprove pull request:', error);
      if (pullRequestService) {
        this.pullRequestServicePool.destroy(pullRequestService);
        pullRequestService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (pullRequestService) {
        this.pullRequestServicePool.release(pullRequestService);
      }
    }
  }

  /**
   * Request changes on a pull request
   */
  static async requestChangesPullRequest(
    workspaceSlug: string,
    repoSlug: string,
    pullRequestId: number,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('requestChangesPullRequest');
    let pullRequestService = null;

    try {
      methodLogger.debug('Requesting changes on pull request:', {
        workspaceSlug,
        repoSlug,
        pullRequestId,
      });
      pullRequestService = await this.pullRequestServicePool.acquire();

      const result = await pullRequestService.requestChangesPullRequest(
        workspaceSlug,
        repoSlug,
        pullRequestId
      );

      methodLogger.debug('Successfully requested changes on pull request');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to request changes on pull request:', error);
      if (pullRequestService) {
        this.pullRequestServicePool.destroy(pullRequestService);
        pullRequestService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (pullRequestService) {
        this.pullRequestServicePool.release(pullRequestService);
      }
    }
  }

  /**
   * List pull request comments
   */
  static async listPullRequestComments(
    workspaceSlug: string,
    repoSlug: string,
    pullRequestId: number,
    page?: number,
    pagelen?: number,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('listPullRequestComments');
    let pullRequestService = null;

    try {
      methodLogger.debug('Listing pull request comments:', {
        workspaceSlug,
        repoSlug,
        pullRequestId,
      });
      pullRequestService = await this.pullRequestServicePool.acquire();

      const params: any = {};
      if (page) params.page = page;
      if (pagelen) params.pagelen = pagelen;

      const result = await pullRequestService.listPullRequestComments(
        workspaceSlug,
        repoSlug,
        pullRequestId,
        params
      );

      methodLogger.debug('Successfully listed pull request comments');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list pull request comments:', error);
      if (pullRequestService) {
        this.pullRequestServicePool.destroy(pullRequestService);
        pullRequestService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (pullRequestService) {
        this.pullRequestServicePool.release(pullRequestService);
      }
    }
  }

  /**
   * Create a pull request comment
   */
  static async createPullRequestComment(
    workspaceSlug: string,
    repoSlug: string,
    pullRequestId: number,
    content: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('createPullRequestComment');
    let pullRequestService = null;

    try {
      methodLogger.debug('Creating pull request comment:', {
        workspaceSlug,
        repoSlug,
        pullRequestId,
      });
      pullRequestService = await this.pullRequestServicePool.acquire();

      const request = {
        content: { raw: content },
      };

      const result = await pullRequestService.createPullRequestComment(
        workspaceSlug,
        repoSlug,
        pullRequestId,
        request
      );

      methodLogger.debug('Successfully created pull request comment');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create pull request comment:', error);
      if (pullRequestService) {
        this.pullRequestServicePool.destroy(pullRequestService);
        pullRequestService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (pullRequestService) {
        this.pullRequestServicePool.release(pullRequestService);
      }
    }
  }

  /**
   * Get pull request diff
   */
  static async getPullRequestDiff(
    workspaceSlug: string,
    repoSlug: string,
    pullRequestId: number,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getPullRequestDiff');
    let pullRequestService = null;

    try {
      methodLogger.debug('Getting pull request diff:', { workspaceSlug, repoSlug, pullRequestId });
      pullRequestService = await this.pullRequestServicePool.acquire();

      const result = await pullRequestService.getPullRequestDiff(
        workspaceSlug,
        repoSlug,
        pullRequestId
      );

      methodLogger.debug('Successfully retrieved pull request diff');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get pull request diff:', error);
      if (pullRequestService) {
        this.pullRequestServicePool.destroy(pullRequestService);
        pullRequestService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (pullRequestService) {
        this.pullRequestServicePool.release(pullRequestService);
      }
    }
  }

  /**
   * Get pull request patch
   */
  static async getPullRequestPatch(
    workspaceSlug: string,
    repoSlug: string,
    pullRequestId: number,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getPullRequestPatch');
    let pullRequestService = null;

    try {
      methodLogger.debug('Getting pull request patch:', { workspaceSlug, repoSlug, pullRequestId });
      pullRequestService = await this.pullRequestServicePool.acquire();

      const result = await pullRequestService.getPullRequestPatch(
        workspaceSlug,
        repoSlug,
        pullRequestId
      );

      methodLogger.debug('Successfully retrieved pull request patch');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get pull request patch:', error);
      if (pullRequestService) {
        this.pullRequestServicePool.destroy(pullRequestService);
        pullRequestService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (pullRequestService) {
        this.pullRequestServicePool.release(pullRequestService);
      }
    }
  }

  /**
   * Register all pull request tools with the MCP server
   */
  static register(server: McpServer): void {
    const registerLogger = this.logger.forMethod('register');

    // Initialize the service
    this.initialize();

    // Register get pull request tool
    server.registerTool(
      'pull_request_get',
      {
        description: `Obtém detalhes de um pull request específico.

**Funcionalidades:**
- Informações detalhadas do pull request
- Status e metadados
- Informações de branch e merge
- Detalhes do autor e revisores

**Parâmetros:**
- \`workspaceSlug\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`pullRequestId\`: ID do pull request
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com os detalhes do pull request.`,
        inputSchema: GetPullRequestSchema.shape,
      },
      async params => {
        const validatedParams = GetPullRequestSchema.parse(params);
        return this.getPullRequest(
          validatedParams.workspaceSlug,
          validatedParams.repoSlug,
          validatedParams.pullRequestId,
          validatedParams.output || 'json'
        );
      }
    );

    // Register list pull requests tool
    server.registerTool(
      'pull_request_list',
      {
        description: `Lista pull requests de um repositório.

**Funcionalidades:**
- Listagem de pull requests com paginação
- Filtros por estado
- Informações detalhadas de cada pull request

**Parâmetros:**
- \`workspaceSlug\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`state\`: Estado do pull request (opcional)
- \`page\`: Número da página (opcional)
- \`pagelen\`: Tamanho da página (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com a lista de pull requests.`,
        inputSchema: ListPullRequestsSchema.shape,
      },
      async params => {
        const validatedParams = ListPullRequestsSchema.parse(params);
        return this.listPullRequests(
          validatedParams.workspaceSlug,
          validatedParams.repoSlug,
          validatedParams.state,
          validatedParams.page,
          validatedParams.pagelen,
          validatedParams.output || 'json'
        );
      }
    );

    // Register create pull request tool
    server.registerTool(
      'pull_request_create',
      {
        description: `Cria um novo pull request no Bitbucket Cloud.

**Funcionalidades:**
- Criação de pull requests
- Configuração de branches de origem e destino
- Descrição e configurações opcionais

**Parâmetros:**
- \`workspaceSlug\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`title\`: Título do pull request
- \`sourceBranch\`: Branch de origem
- \`destinationBranch\`: Branch de destino
- \`description\`: Descrição do pull request (opcional)
- \`reviewers\`: Lista de revisores (opcional)
- \`closeSourceBranch\`: Fechar branch de origem após merge (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do pull request criado.`,
        inputSchema: CreatePullRequestSchema.shape,
      },
      async (params: z.infer<typeof CreatePullRequestSchema>) => {
        const validatedParams = CreatePullRequestSchema.parse(params);
        return this.createPullRequest(
          validatedParams.workspaceSlug,
          validatedParams.repoSlug,
          validatedParams.title,
          validatedParams.sourceBranch,
          validatedParams.destinationBranch,
          validatedParams.description,
          validatedParams.closeSourceBranch,
          validatedParams.output
        );
      }
    );

    // Register merge pull request tool
    server.registerTool(
      'pull_request_merge',
      {
        description: `Faz merge de um pull request no Bitbucket Cloud.

**Funcionalidades:**
- Merge de pull requests
- Integração de mudanças
- Fechamento automático do pull request

**Parâmetros:**
- \`workspaceSlug\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`pullRequestId\`: ID do pull request
- \`mergeStrategy\`: Estratégia de merge (opcional)
- \`message\`: Mensagem de merge (opcional)
- \`closeSourceBranch\`: Fechar branch de origem após merge (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a confirmação do merge.`,
        inputSchema: MergePullRequestSchema.shape,
      },
      async (params: z.infer<typeof MergePullRequestSchema>) => {
        const validatedParams = MergePullRequestSchema.parse(params);
        return this.mergePullRequest(
          validatedParams.workspaceSlug,
          validatedParams.repoSlug,
          validatedParams.pullRequestId,
          validatedParams.output
        );
      }
    );

    // Register approve pull request tool
    server.registerTool(
      'pull_request_approve',
      {
        description: `Aprova um pull request no Bitbucket Cloud.

**Funcionalidades:**
- Aprovação de pull requests
- Controle de qualidade de código
- Integração com workflows de revisão

**Parâmetros:**
- \`workspaceSlug\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`pullRequestId\`: ID do pull request
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a confirmação da aprovação.`,
        inputSchema: ApprovePullRequestSchema.shape,
      },
      async (params: z.infer<typeof ApprovePullRequestSchema>) => {
        const validatedParams = ApprovePullRequestSchema.parse(params);
        return this.approvePullRequest(
          validatedParams.workspaceSlug,
          validatedParams.repoSlug,
          validatedParams.pullRequestId,
          validatedParams.output
        );
      }
    );

    // Register get pull request diff tool
    server.registerTool(
      'pull_request_get_diff',
      {
        description: `Obtém o diff de um pull request no Bitbucket Cloud.

**Funcionalidades:**
- Diff completo do pull request
- Comparação entre branches
- Visualização de mudanças

**Parâmetros:**
- \`workspaceSlug\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`pullRequestId\`: ID do pull request
- \`context\`: Número de linhas de contexto (opcional)
- \`path\`: Caminho específico do arquivo (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o diff do pull request.`,
        inputSchema: GetPullRequestDiffSchema.shape,
      },
      async (params: z.infer<typeof GetPullRequestDiffSchema>) => {
        const validatedParams = GetPullRequestDiffSchema.parse(params);
        return this.getPullRequestDiff(
          validatedParams.workspaceSlug,
          validatedParams.repoSlug,
          validatedParams.pullRequestId,
          validatedParams.output
        );
      }
    );

    registerLogger.info('Successfully registered all cloud pull request tools');
  }
}
