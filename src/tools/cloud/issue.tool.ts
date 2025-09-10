import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPool, Pool } from 'generic-pool';
import { Logger } from '../../utils/logger.util.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { IssueService } from '../../services/cloud/issue.service.js';
import { createMcpResponse, createErrorResponse } from '../../services/types/base.types.js';
import { z } from 'zod';

/**
 * Issue Tools for Bitbucket Cloud
 *
 * Comprehensive issue management including:
 * - List and manage issues
 * - Create, update, delete issues
 * - Manage issue comments
 * - Vote and watch issues
 * - Manage components, milestones, and versions
 */
export class CloudIssueTools {
  private static logger = Logger.forContext('CloudIssueTools');
  private static issueServicePool: Pool<IssueService>;

  static initialize(): void {
    const issueServiceFactory = {
      create: async () => new IssueService(new ApiClient()),
      destroy: async () => {},
    };

    this.issueServicePool = createPool(issueServiceFactory, { min: 2, max: 10 });
    this.logger.info('Cloud Issue tools initialized');
  }

  /**
   * List components
   */
  static async listComponents(
    workspace: string,
    repoSlug: string,
    page?: number,
    pagelen?: number,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('listComponents');
    let issueService = null;

    try {
      methodLogger.debug('Listing components:', { workspace, repoSlug });
      issueService = await this.issueServicePool.acquire();

      const result = await issueService.listComponents({
        workspace,
        repo_slug: repoSlug,
        page,
        pagelen,
      });

      methodLogger.debug('Successfully listed components');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list components:', error);
      if (issueService) {
        this.issueServicePool.destroy(issueService);
        issueService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (issueService) {
        this.issueServicePool.release(issueService);
      }
    }
  }

  /**
   * Get a component
   */
  static async getComponent(
    workspace: string,
    repoSlug: string,
    componentId: number,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getComponent');
    let issueService = null;

    try {
      methodLogger.debug('Getting component:', { workspace, repoSlug, componentId });
      issueService = await this.issueServicePool.acquire();

      const result = await issueService.getComponent({
        workspace,
        repo_slug: repoSlug,
        component_id: componentId,
      });

      methodLogger.debug('Successfully retrieved component');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get component:', error);
      if (issueService) {
        this.issueServicePool.destroy(issueService);
        issueService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (issueService) {
        this.issueServicePool.release(issueService);
      }
    }
  }

  /**
   * List issues
   */
  static async listIssues(
    workspace: string,
    repoSlug: string,
    page?: number,
    pagelen?: number,
    q?: string,
    sort?: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('listIssues');
    let issueService = null;

    try {
      methodLogger.debug('Listing issues:', { workspace, repoSlug });
      issueService = await this.issueServicePool.acquire();

      const result = await issueService.listIssues({
        workspace,
        repo_slug: repoSlug,
        page,
        pagelen,
        q,
        sort,
      });

      methodLogger.debug('Successfully listed issues');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list issues:', error);
      if (issueService) {
        this.issueServicePool.destroy(issueService);
        issueService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (issueService) {
        this.issueServicePool.release(issueService);
      }
    }
  }

  /**
   * Create an issue
   */
  static async createIssue(
    workspace: string,
    repoSlug: string,
    title: string,
    content?: string,
    kind?: string,
    priority?: string,
    assignee?: string,
    component?: string,
    milestone?: string,
    version?: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('createIssue');
    let issueService = null;

    try {
      methodLogger.debug('Creating issue:', { workspace, repoSlug, title });
      issueService = await this.issueServicePool.acquire();

      const result = await issueService.createIssue({
        workspace,
        repo_slug: repoSlug,
        issue: {
          title,
          content,
          kind,
          priority,
          assignee,
          component,
          milestone,
          version,
        },
      });

      methodLogger.debug('Successfully created issue');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create issue:', error);
      if (issueService) {
        this.issueServicePool.destroy(issueService);
        issueService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (issueService) {
        this.issueServicePool.release(issueService);
      }
    }
  }

  /**
   * Get an issue
   */
  static async getIssue(
    workspace: string,
    repoSlug: string,
    issueId: number,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getIssue');
    let issueService = null;

    try {
      methodLogger.debug('Getting issue:', { workspace, repoSlug, issueId });
      issueService = await this.issueServicePool.acquire();

      const result = await issueService.getIssue({
        workspace,
        repo_slug: repoSlug,
        issue_id: issueId,
      });

      methodLogger.debug('Successfully retrieved issue');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get issue:', error);
      if (issueService) {
        this.issueServicePool.destroy(issueService);
        issueService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (issueService) {
        this.issueServicePool.release(issueService);
      }
    }
  }

  /**
   * Update an issue
   */
  static async updateIssue(
    workspace: string,
    repoSlug: string,
    issueId: number,
    title?: string,
    content?: string,
    kind?: string,
    priority?: string,
    assignee?: string,
    component?: string,
    milestone?: string,
    version?: string,
    state?: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('updateIssue');
    let issueService = null;

    try {
      methodLogger.debug('Updating issue:', { workspace, repoSlug, issueId });
      issueService = await this.issueServicePool.acquire();

      const result = await issueService.updateIssue({
        workspace,
        repo_slug: repoSlug,
        issue_id: issueId,
        issue: {
          title,
          content,
          kind,
          priority,
          assignee,
          component,
          milestone,
          version,
          state,
        },
      });

      methodLogger.debug('Successfully updated issue');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update issue:', error);
      if (issueService) {
        this.issueServicePool.destroy(issueService);
        issueService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (issueService) {
        this.issueServicePool.release(issueService);
      }
    }
  }

  /**
   * Delete an issue
   */
  static async deleteIssue(
    workspace: string,
    repoSlug: string,
    issueId: number,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('deleteIssue');
    let issueService = null;

    try {
      methodLogger.debug('Deleting issue:', { workspace, repoSlug, issueId });
      issueService = await this.issueServicePool.acquire();

      await issueService.deleteIssue({
        workspace,
        repo_slug: repoSlug,
        issue_id: issueId,
      });

      methodLogger.debug('Successfully deleted issue');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to delete issue:', error);
      if (issueService) {
        this.issueServicePool.destroy(issueService);
        issueService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (issueService) {
        this.issueServicePool.release(issueService);
      }
    }
  }

  /**
   * List issue comments
   */
  static async listIssueComments(
    workspace: string,
    repoSlug: string,
    issueId: number,
    page?: number,
    pagelen?: number,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('listIssueComments');
    let issueService = null;

    try {
      methodLogger.debug('Listing issue comments:', { workspace, repoSlug, issueId });
      issueService = await this.issueServicePool.acquire();

      const result = await issueService.listIssueComments({
        workspace,
        repo_slug: repoSlug,
        issue_id: issueId,
        page,
        pagelen,
      });

      methodLogger.debug('Successfully listed issue comments');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list issue comments:', error);
      if (issueService) {
        this.issueServicePool.destroy(issueService);
        issueService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (issueService) {
        this.issueServicePool.release(issueService);
      }
    }
  }

  /**
   * Create an issue comment
   */
  static async createIssueComment(
    workspace: string,
    repoSlug: string,
    issueId: number,
    content: string,
    parent?: number,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('createIssueComment');
    let issueService = null;

    try {
      methodLogger.debug('Creating issue comment:', { workspace, repoSlug, issueId });
      issueService = await this.issueServicePool.acquire();

      const result = await issueService.createIssueComment({
        workspace,
        repo_slug: repoSlug,
        issue_id: issueId,
        comment: {
          content,
          parent,
        },
      });

      methodLogger.debug('Successfully created issue comment');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create issue comment:', error);
      if (issueService) {
        this.issueServicePool.destroy(issueService);
        issueService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (issueService) {
        this.issueServicePool.release(issueService);
      }
    }
  }

  /**
   * Get an issue comment
   */
  static async getIssueComment(
    workspace: string,
    repoSlug: string,
    issueId: number,
    commentId: number,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getIssueComment');
    let issueService = null;

    try {
      methodLogger.debug('Getting issue comment:', { workspace, repoSlug, issueId, commentId });
      issueService = await this.issueServicePool.acquire();

      const result = await issueService.getIssueComment({
        workspace,
        repo_slug: repoSlug,
        issue_id: issueId,
        comment_id: commentId,
      });

      methodLogger.debug('Successfully retrieved issue comment');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get issue comment:', error);
      if (issueService) {
        this.issueServicePool.destroy(issueService);
        issueService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (issueService) {
        this.issueServicePool.release(issueService);
      }
    }
  }

  /**
   * Update an issue comment
   */
  static async updateIssueComment(
    workspace: string,
    repoSlug: string,
    issueId: number,
    commentId: number,
    content: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('updateIssueComment');
    let issueService = null;

    try {
      methodLogger.debug('Updating issue comment:', { workspace, repoSlug, issueId, commentId });
      issueService = await this.issueServicePool.acquire();

      const result = await issueService.updateIssueComment({
        workspace,
        repo_slug: repoSlug,
        issue_id: issueId,
        comment_id: commentId,
        comment: {
          content,
        },
      });

      methodLogger.debug('Successfully updated issue comment');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update issue comment:', error);
      if (issueService) {
        this.issueServicePool.destroy(issueService);
        issueService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (issueService) {
        this.issueServicePool.release(issueService);
      }
    }
  }

  /**
   * Delete an issue comment
   */
  static async deleteIssueComment(
    workspace: string,
    repoSlug: string,
    issueId: number,
    commentId: number,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('deleteIssueComment');
    let issueService = null;

    try {
      methodLogger.debug('Deleting issue comment:', { workspace, repoSlug, issueId, commentId });
      issueService = await this.issueServicePool.acquire();

      await issueService.deleteIssueComment({
        workspace,
        repo_slug: repoSlug,
        issue_id: issueId,
        comment_id: commentId,
      });

      methodLogger.debug('Successfully deleted issue comment');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to delete issue comment:', error);
      if (issueService) {
        this.issueServicePool.destroy(issueService);
        issueService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (issueService) {
        this.issueServicePool.release(issueService);
      }
    }
  }

  /**
   * Vote for an issue
   */
  static async voteIssue(
    workspace: string,
    repoSlug: string,
    issueId: number,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('voteIssue');
    let issueService = null;

    try {
      methodLogger.debug('Voting for issue:', { workspace, repoSlug, issueId });
      issueService = await this.issueServicePool.acquire();

      await issueService.voteIssue({
        workspace,
        repo_slug: repoSlug,
        issue_id: issueId,
      });

      methodLogger.debug('Successfully voted for issue');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to vote for issue:', error);
      if (issueService) {
        this.issueServicePool.destroy(issueService);
        issueService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (issueService) {
        this.issueServicePool.release(issueService);
      }
    }
  }

  /**
   * Remove vote for an issue
   */
  static async removeVoteIssue(
    workspace: string,
    repoSlug: string,
    issueId: number,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('removeVoteIssue');
    let issueService = null;

    try {
      methodLogger.debug('Removing vote for issue:', { workspace, repoSlug, issueId });
      issueService = await this.issueServicePool.acquire();

      await issueService.removeVoteIssue({
        workspace,
        repo_slug: repoSlug,
        issue_id: issueId,
      });

      methodLogger.debug('Successfully removed vote for issue');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to remove vote for issue:', error);
      if (issueService) {
        this.issueServicePool.destroy(issueService);
        issueService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (issueService) {
        this.issueServicePool.release(issueService);
      }
    }
  }

  /**
   * Watch an issue
   */
  static async watchIssue(
    workspace: string,
    repoSlug: string,
    issueId: number,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('watchIssue');
    let issueService = null;

    try {
      methodLogger.debug('Watching issue:', { workspace, repoSlug, issueId });
      issueService = await this.issueServicePool.acquire();

      await issueService.watchIssue({
        workspace,
        repo_slug: repoSlug,
        issue_id: issueId,
      });

      methodLogger.debug('Successfully started watching issue');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to watch issue:', error);
      if (issueService) {
        this.issueServicePool.destroy(issueService);
        issueService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (issueService) {
        this.issueServicePool.release(issueService);
      }
    }
  }

  /**
   * Stop watching an issue
   */
  static async stopWatchingIssue(
    workspace: string,
    repoSlug: string,
    issueId: number,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('stopWatchingIssue');
    let issueService = null;

    try {
      methodLogger.debug('Stopping watching issue:', { workspace, repoSlug, issueId });
      issueService = await this.issueServicePool.acquire();

      await issueService.stopWatchingIssue({
        workspace,
        repo_slug: repoSlug,
        issue_id: issueId,
      });

      methodLogger.debug('Successfully stopped watching issue');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to stop watching issue:', error);
      if (issueService) {
        this.issueServicePool.destroy(issueService);
        issueService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (issueService) {
        this.issueServicePool.release(issueService);
      }
    }
  }

  /**
   * List milestones
   */
  static async listMilestones(
    workspace: string,
    repoSlug: string,
    page?: number,
    pagelen?: number,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('listMilestones');
    let issueService = null;

    try {
      methodLogger.debug('Listing milestones:', { workspace, repoSlug });
      issueService = await this.issueServicePool.acquire();

      const result = await issueService.listMilestones({
        workspace,
        repo_slug: repoSlug,
        page,
        pagelen,
      });

      methodLogger.debug('Successfully listed milestones');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list milestones:', error);
      if (issueService) {
        this.issueServicePool.destroy(issueService);
        issueService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (issueService) {
        this.issueServicePool.release(issueService);
      }
    }
  }

  /**
   * Get a milestone
   */
  static async getMilestone(
    workspace: string,
    repoSlug: string,
    milestoneId: number,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getMilestone');
    let issueService = null;

    try {
      methodLogger.debug('Getting milestone:', { workspace, repoSlug, milestoneId });
      issueService = await this.issueServicePool.acquire();

      const result = await issueService.getMilestone({
        workspace,
        repo_slug: repoSlug,
        milestone_id: milestoneId,
      });

      methodLogger.debug('Successfully retrieved milestone');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get milestone:', error);
      if (issueService) {
        this.issueServicePool.destroy(issueService);
        issueService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (issueService) {
        this.issueServicePool.release(issueService);
      }
    }
  }

  /**
   * List versions
   */
  static async listVersions(
    workspace: string,
    repoSlug: string,
    page?: number,
    pagelen?: number,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('listVersions');
    let issueService = null;

    try {
      methodLogger.debug('Listing versions:', { workspace, repoSlug });
      issueService = await this.issueServicePool.acquire();

      const result = await issueService.listVersions({
        workspace,
        repo_slug: repoSlug,
        page,
        pagelen,
      });

      methodLogger.debug('Successfully listed versions');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list versions:', error);
      if (issueService) {
        this.issueServicePool.destroy(issueService);
        issueService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (issueService) {
        this.issueServicePool.release(issueService);
      }
    }
  }

  /**
   * Get a version
   */
  static async getVersion(
    workspace: string,
    repoSlug: string,
    versionId: number,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getVersion');
    let issueService = null;

    try {
      methodLogger.debug('Getting version:', { workspace, repoSlug, versionId });
      issueService = await this.issueServicePool.acquire();

      const result = await issueService.getVersion({
        workspace,
        repo_slug: repoSlug,
        version_id: versionId,
      });

      methodLogger.debug('Successfully retrieved version');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get version:', error);
      if (issueService) {
        this.issueServicePool.destroy(issueService);
        issueService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (issueService) {
        this.issueServicePool.release(issueService);
      }
    }
  }

  /**
   * Register all issue tools with the MCP server
   */
  static register(server: McpServer): void {
    const registerLogger = this.logger.forMethod('register');

    // Initialize the service
    this.initialize();

    // Zod schemas for parameter validation
    const ListComponentsSchema = z.object({
      workspace: z.string().describe('Workspace contendo o repositório'),
      repoSlug: z.string().describe('Slug/nome do repositório'),
      page: z.number().optional().describe('Número da página para paginação'),
      pagelen: z.number().optional().describe('Número de itens por página'),
      output: z.enum(['markdown', 'json']).optional().describe('Formato de saída'),
    });

    // Register list components tool
    server.registerTool(
      'issue_list_components',
      {
        description: `Lista os componentes definidos no rastreador de issues do repositório.

**Funcionalidades:**
- Lista todos os componentes disponíveis
- Suporte a paginação
- Informações detalhadas dos componentes

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`page\`: Número da página para paginação (opcional)
- \`pagelen\`: Número de itens por página (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Lista paginada de componentes do rastreador de issues.`,
        inputSchema: ListComponentsSchema.shape,
      },
      async (params: z.infer<typeof ListComponentsSchema>) => {
        const validatedParams = ListComponentsSchema.parse(params);
        return this.listComponents(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.page,
          validatedParams.pagelen,
          validatedParams.output || 'json'
        );
      }
    );

    const GetComponentSchema = z.object({
      workspace: z.string().describe('Workspace contendo o repositório'),
      repoSlug: z.string().describe('Slug/nome do repositório'),
      componentId: z.number().describe('ID do componente'),
      output: z.enum(['markdown', 'json']).optional().describe('Formato de saída'),
    });

    // Register get component tool
    server.registerTool(
      'issue_get_component',
      {
        description: `Obtém um componente específico para issues.

**Funcionalidades:**
- Detalhes completos do componente
- Informações de links e metadados
- Validação de existência

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`componentId\`: ID do componente
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Informações detalhadas do componente especificado.`,
        inputSchema: GetComponentSchema.shape,
      },
      async (params: z.infer<typeof GetComponentSchema>) => {
        const validatedParams = GetComponentSchema.parse(params);
        return this.getComponent(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.componentId,
          validatedParams.output || 'json'
        );
      }
    );

    const ListIssuesSchema = z.object({
      workspace: z.string().describe('Workspace contendo o repositório'),
      repoSlug: z.string().describe('Slug/nome do repositório'),
      page: z.number().optional().describe('Número da página para paginação'),
      pagelen: z.number().optional().describe('Número de itens por página'),
      q: z.string().optional().describe('Query de busca'),
      sort: z.string().optional().describe('Campo para ordenação'),
      output: z.enum(['markdown', 'json']).optional().describe('Formato de saída'),
    });

    // Register list issues tool
    server.registerTool(
      'issue_list',
      {
        description: `Lista as issues do repositório.

**Funcionalidades:**
- Lista todas as issues com filtros
- Suporte a busca e ordenação
- Paginação completa
- Filtros por estado, tipo, prioridade

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`page\`: Número da página para paginação (opcional)
- \`pagelen\`: Número de itens por página (opcional)
- \`q\`: Query de busca (opcional)
- \`sort\`: Campo para ordenação (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Lista paginada de issues com informações completas.`,
        inputSchema: ListIssuesSchema.shape,
      },
      async (params: z.infer<typeof ListIssuesSchema>) => {
        const validatedParams = ListIssuesSchema.parse(params);
        return this.listIssues(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.page,
          validatedParams.pagelen,
          validatedParams.q,
          validatedParams.sort,
          validatedParams.output || 'json'
        );
      }
    );

    const CreateIssueSchema = z.object({
      workspace: z.string().describe('Workspace contendo o repositório'),
      repoSlug: z.string().describe('Slug/nome do repositório'),
      title: z.string().describe('Título da issue'),
      content: z.string().optional().describe('Conteúdo da issue'),
      kind: z.string().optional().describe('Tipo da issue (bug, enhancement, proposal, task)'),
      priority: z
        .string()
        .optional()
        .describe('Prioridade da issue (trivial, minor, major, critical, blocker)'),
      assignee: z.string().optional().describe('UUID do usuário atribuído'),
      component: z.string().optional().describe('ID do componente'),
      milestone: z.string().optional().describe('ID do milestone'),
      version: z.string().optional().describe('ID da versão'),
      output: z.enum(['markdown', 'json']).optional().describe('Formato de saída'),
    });

    // Register create issue tool
    server.registerTool(
      'issue_create',
      {
        description: `Cria uma nova issue no repositório.

**Funcionalidades:**
- Criação de issues com todos os campos
- Atribuição de usuários e componentes
- Definição de prioridade e tipo
- Associação com milestones e versões

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`title\`: Título da issue
- \`content\`: Conteúdo da issue (opcional)
- \`kind\`: Tipo da issue (opcional)
- \`priority\`: Prioridade da issue (opcional)
- \`assignee\`: UUID do usuário atribuído (opcional)
- \`component\`: ID do componente (opcional)
- \`milestone\`: ID do milestone (opcional)
- \`version\`: ID da versão (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Issue criada com todos os detalhes e metadados.`,
        inputSchema: CreateIssueSchema.shape,
      },
      async (params: z.infer<typeof CreateIssueSchema>) => {
        const validatedParams = CreateIssueSchema.parse(params);
        return this.createIssue(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.title,
          validatedParams.content,
          validatedParams.kind,
          validatedParams.priority,
          validatedParams.assignee,
          validatedParams.component,
          validatedParams.milestone,
          validatedParams.version,
          validatedParams.output || 'json'
        );
      }
    );

    const GetIssueSchema = z.object({
      workspace: z.string().describe('Workspace contendo o repositório'),
      repoSlug: z.string().describe('Slug/nome do repositório'),
      issueId: z.number().describe('ID da issue'),
      output: z.enum(['markdown', 'json']).optional().describe('Formato de saída'),
    });

    // Register get issue tool
    server.registerTool(
      'issue_get',
      {
        description: `Obtém uma issue específica do repositório.

**Funcionalidades:**
- Detalhes completos da issue
- Informações de comentários e anexos
- Histórico de mudanças
- Metadados de votação e acompanhamento

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`issueId\`: ID da issue
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Informações completas da issue especificada.`,
        inputSchema: GetIssueSchema.shape,
      },
      async (params: z.infer<typeof GetIssueSchema>) => {
        const validatedParams = GetIssueSchema.parse(params);
        return this.getIssue(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.issueId,
          validatedParams.output || 'json'
        );
      }
    );

    const UpdateIssueSchema = z.object({
      workspace: z.string().describe('Workspace contendo o repositório'),
      repoSlug: z.string().describe('Slug/nome do repositório'),
      issueId: z.number().describe('ID da issue'),
      title: z.string().optional().describe('Novo título da issue'),
      content: z.string().optional().describe('Novo conteúdo da issue'),
      kind: z.string().optional().describe('Novo tipo da issue'),
      priority: z.string().optional().describe('Nova prioridade da issue'),
      assignee: z.string().optional().describe('Novo UUID do usuário atribuído'),
      component: z.string().optional().describe('Novo ID do componente'),
      milestone: z.string().optional().describe('Novo ID do milestone'),
      version: z.string().optional().describe('Novo ID da versão'),
      state: z.string().optional().describe('Novo estado da issue'),
      output: z.enum(['markdown', 'json']).optional().describe('Formato de saída'),
    });

    // Register update issue tool
    server.registerTool(
      'issue_update',
      {
        description: `Atualiza uma issue existente no repositório.

**Funcionalidades:**
- Atualização de todos os campos da issue
- Mudança de estado e prioridade
- Reatribuição de usuários
- Atualização de conteúdo e metadados

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`issueId\`: ID da issue
- \`title\`: Novo título da issue (opcional)
- \`content\`: Novo conteúdo da issue (opcional)
- \`kind\`: Novo tipo da issue (opcional)
- \`priority\`: Nova prioridade da issue (opcional)
- \`assignee\`: Novo UUID do usuário atribuído (opcional)
- \`component\`: Novo ID do componente (opcional)
- \`milestone\`: Novo ID do milestone (opcional)
- \`version\`: Novo ID da versão (opcional)
- \`state\`: Novo estado da issue (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Issue atualizada com os novos valores.`,
        inputSchema: UpdateIssueSchema.shape,
      },
      async (params: z.infer<typeof UpdateIssueSchema>) => {
        const validatedParams = UpdateIssueSchema.parse(params);
        return this.updateIssue(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.issueId,
          validatedParams.title,
          validatedParams.content,
          validatedParams.kind,
          validatedParams.priority,
          validatedParams.assignee,
          validatedParams.component,
          validatedParams.milestone,
          validatedParams.version,
          validatedParams.state,
          validatedParams.output || 'json'
        );
      }
    );

    const DeleteIssueSchema = z.object({
      workspace: z.string().describe('Workspace contendo o repositório'),
      repoSlug: z.string().describe('Slug/nome do repositório'),
      issueId: z.number().describe('ID da issue'),
      output: z.enum(['markdown', 'json']).optional().describe('Formato de saída'),
    });

    // Register delete issue tool
    server.registerTool(
      'issue_delete',
      {
        description: `Exclui uma issue do repositório.

**Funcionalidades:**
- Exclusão permanente da issue
- Remoção de todos os dados associados
- Confirmação de exclusão

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`issueId\`: ID da issue
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Confirmação de exclusão bem-sucedida.`,
        inputSchema: DeleteIssueSchema.shape,
      },
      async (params: z.infer<typeof DeleteIssueSchema>) => {
        const validatedParams = DeleteIssueSchema.parse(params);
        return this.deleteIssue(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.issueId,
          validatedParams.output || 'json'
        );
      }
    );

    const ListIssueCommentsSchema = z.object({
      workspace: z.string().describe('Workspace contendo o repositório'),
      repoSlug: z.string().describe('Slug/nome do repositório'),
      issueId: z.number().describe('ID da issue'),
      page: z.number().optional().describe('Número da página para paginação'),
      pagelen: z.number().optional().describe('Número de itens por página'),
      output: z.enum(['markdown', 'json']).optional().describe('Formato de saída'),
    });

    // Register list issue comments tool
    server.registerTool(
      'issue_list_comments',
      {
        description: `Lista os comentários de uma issue.

**Funcionalidades:**
- Lista todos os comentários da issue
- Suporte a paginação
- Informações de autores e timestamps
- Comentários aninhados (respostas)

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`issueId\`: ID da issue
- \`page\`: Número da página para paginação (opcional)
- \`pagelen\`: Número de itens por página (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Lista paginada de comentários da issue.`,
        inputSchema: ListIssueCommentsSchema.shape,
      },
      async (params: z.infer<typeof ListIssueCommentsSchema>) => {
        const validatedParams = ListIssueCommentsSchema.parse(params);
        return this.listIssueComments(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.issueId,
          validatedParams.page,
          validatedParams.pagelen,
          validatedParams.output || 'json'
        );
      }
    );

    const CreateIssueCommentSchema = z.object({
      workspace: z.string().describe('Workspace contendo o repositório'),
      repoSlug: z.string().describe('Slug/nome do repositório'),
      issueId: z.number().describe('ID da issue'),
      content: z.string().describe('Conteúdo do comentário'),
      parent: z.number().optional().describe('ID do comentário pai (para respostas)'),
      output: z.enum(['markdown', 'json']).optional().describe('Formato de saída'),
    });

    // Register create issue comment tool
    server.registerTool(
      'issue_create_comment',
      {
        description: `Cria um comentário em uma issue.

**Funcionalidades:**
- Criação de comentários em issues
- Suporte a comentários aninhados (respostas)
- Formatação de texto rica
- Notificações automáticas

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`issueId\`: ID da issue
- \`content\`: Conteúdo do comentário
- \`parent\`: ID do comentário pai (para respostas) (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Comentário criado com todos os metadados.`,
        inputSchema: CreateIssueCommentSchema.shape,
      },
      async (params: z.infer<typeof CreateIssueCommentSchema>) => {
        const validatedParams = CreateIssueCommentSchema.parse(params);
        return this.createIssueComment(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.issueId,
          validatedParams.content,
          validatedParams.parent,
          validatedParams.output || 'json'
        );
      }
    );

    const GetIssueCommentSchema = z.object({
      workspace: z.string().describe('Workspace contendo o repositório'),
      repoSlug: z.string().describe('Slug/nome do repositório'),
      issueId: z.number().describe('ID da issue'),
      commentId: z.number().describe('ID do comentário'),
      output: z.enum(['markdown', 'json']).optional().describe('Formato de saída'),
    });

    // Register get issue comment tool
    server.registerTool(
      'issue_get_comment',
      {
        description: `Obtém um comentário específico de uma issue.

**Funcionalidades:**
- Detalhes completos do comentário
- Informações do autor e timestamps
- Conteúdo formatado
- Links e metadados

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`issueId\`: ID da issue
- \`commentId\`: ID do comentário
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Informações completas do comentário especificado.`,
        inputSchema: GetIssueCommentSchema.shape,
      },
      async (params: z.infer<typeof GetIssueCommentSchema>) => {
        const validatedParams = GetIssueCommentSchema.parse(params);
        return this.getIssueComment(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.issueId,
          validatedParams.commentId,
          validatedParams.output || 'json'
        );
      }
    );

    const UpdateIssueCommentSchema = z.object({
      workspace: z.string().describe('Workspace contendo o repositório'),
      repoSlug: z.string().describe('Slug/nome do repositório'),
      issueId: z.number().describe('ID da issue'),
      commentId: z.number().describe('ID do comentário'),
      content: z.string().describe('Novo conteúdo do comentário'),
      output: z.enum(['markdown', 'json']).optional().describe('Formato de saída'),
    });

    // Register update issue comment tool
    server.registerTool(
      'issue_update_comment',
      {
        description: `Atualiza um comentário de uma issue.

**Funcionalidades:**
- Edição de comentários existentes
- Preservação de histórico
- Atualização de timestamps
- Notificações de mudanças

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`issueId\`: ID da issue
- \`commentId\`: ID do comentário
- \`content\`: Novo conteúdo do comentário
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Comentário atualizado com o novo conteúdo.`,
        inputSchema: UpdateIssueCommentSchema.shape,
      },
      async (params: z.infer<typeof UpdateIssueCommentSchema>) => {
        const validatedParams = UpdateIssueCommentSchema.parse(params);
        return this.updateIssueComment(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.issueId,
          validatedParams.commentId,
          validatedParams.content,
          validatedParams.output || 'json'
        );
      }
    );

    const DeleteIssueCommentSchema = z.object({
      workspace: z.string().describe('Workspace contendo o repositório'),
      repoSlug: z.string().describe('Slug/nome do repositório'),
      issueId: z.number().describe('ID da issue'),
      commentId: z.number().describe('ID do comentário'),
      output: z.enum(['markdown', 'json']).optional().describe('Formato de saída'),
    });

    // Register delete issue comment tool
    server.registerTool(
      'issue_delete_comment',
      {
        description: `Exclui um comentário de uma issue.

**Funcionalidades:**
- Exclusão permanente do comentário
- Remoção de respostas aninhadas
- Confirmação de exclusão

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`issueId\`: ID da issue
- \`commentId\`: ID do comentário
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Confirmação de exclusão bem-sucedida.`,
        inputSchema: DeleteIssueCommentSchema.shape,
      },
      async (params: z.infer<typeof DeleteIssueCommentSchema>) => {
        const validatedParams = DeleteIssueCommentSchema.parse(params);
        return this.deleteIssueComment(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.issueId,
          validatedParams.commentId,
          validatedParams.output || 'json'
        );
      }
    );

    const VoteIssueSchema = z.object({
      workspace: z.string().describe('Workspace contendo o repositório'),
      repoSlug: z.string().describe('Slug/nome do repositório'),
      issueId: z.number().describe('ID da issue'),
      output: z.enum(['markdown', 'json']).optional().describe('Formato de saída'),
    });

    // Register vote issue tool
    server.registerTool(
      'issue_vote',
      {
        description: `Vota em uma issue.

**Funcionalidades:**
- Adiciona voto à issue
- Contagem automática de votos
- Controle de votação única por usuário

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`issueId\`: ID da issue
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Confirmação de voto registrado.`,
        inputSchema: VoteIssueSchema.shape,
      },
      async (params: z.infer<typeof VoteIssueSchema>) => {
        const validatedParams = VoteIssueSchema.parse(params);
        return this.voteIssue(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.issueId,
          validatedParams.output || 'json'
        );
      }
    );

    const RemoveVoteIssueSchema = z.object({
      workspace: z.string().describe('Workspace contendo o repositório'),
      repoSlug: z.string().describe('Slug/nome do repositório'),
      issueId: z.number().describe('ID da issue'),
      output: z.enum(['markdown', 'json']).optional().describe('Formato de saída'),
    });

    // Register remove vote issue tool
    server.registerTool(
      'issue_remove_vote',
      {
        description: `Remove o voto de uma issue.

**Funcionalidades:**
- Remove voto da issue
- Atualização automática da contagem
- Controle de votação única por usuário

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`issueId\`: ID da issue
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Confirmação de remoção de voto.`,
        inputSchema: RemoveVoteIssueSchema.shape,
      },
      async (params: z.infer<typeof RemoveVoteIssueSchema>) => {
        const validatedParams = RemoveVoteIssueSchema.parse(params);
        return this.removeVoteIssue(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.issueId,
          validatedParams.output || 'json'
        );
      }
    );

    const WatchIssueSchema = z.object({
      workspace: z.string().describe('Workspace contendo o repositório'),
      repoSlug: z.string().describe('Slug/nome do repositório'),
      issueId: z.number().describe('ID da issue'),
      output: z.enum(['markdown', 'json']).optional().describe('Formato de saída'),
    });

    // Register watch issue tool
    server.registerTool(
      'issue_watch',
      {
        description: `Inicia o acompanhamento de uma issue.

**Funcionalidades:**
- Acompanhamento de mudanças na issue
- Notificações automáticas
- Controle de acompanhamento por usuário

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`issueId\`: ID da issue
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Confirmação de início do acompanhamento.`,
        inputSchema: WatchIssueSchema.shape,
      },
      async (params: z.infer<typeof WatchIssueSchema>) => {
        const validatedParams = WatchIssueSchema.parse(params);
        return this.watchIssue(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.issueId,
          validatedParams.output || 'json'
        );
      }
    );

    const StopWatchingIssueSchema = z.object({
      workspace: z.string().describe('Workspace contendo o repositório'),
      repoSlug: z.string().describe('Slug/nome do repositório'),
      issueId: z.number().describe('ID da issue'),
      output: z.enum(['markdown', 'json']).optional().describe('Formato de saída'),
    });

    // Register stop watching issue tool
    server.registerTool(
      'issue_stop_watching',
      {
        description: `Para de acompanhar uma issue.

**Funcionalidades:**
- Para o acompanhamento da issue
- Remove notificações automáticas
- Controle de acompanhamento por usuário

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`issueId\`: ID da issue
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Confirmação de parada do acompanhamento.`,
        inputSchema: StopWatchingIssueSchema.shape,
      },
      async (params: z.infer<typeof StopWatchingIssueSchema>) => {
        const validatedParams = StopWatchingIssueSchema.parse(params);
        return this.stopWatchingIssue(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.issueId,
          validatedParams.output || 'json'
        );
      }
    );

    const ListMilestonesSchema = z.object({
      workspace: z.string().describe('Workspace contendo o repositório'),
      repoSlug: z.string().describe('Slug/nome do repositório'),
      page: z.number().optional().describe('Número da página para paginação'),
      pagelen: z.number().optional().describe('Número de itens por página'),
      output: z.enum(['markdown', 'json']).optional().describe('Formato de saída'),
    });

    // Register list milestones tool
    server.registerTool(
      'issue_list_milestones',
      {
        description: `Lista os milestones do repositório.

**Funcionalidades:**
- Lista todos os milestones disponíveis
- Suporte a paginação
- Informações detalhadas dos milestones

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`page\`: Número da página para paginação (opcional)
- \`pagelen\`: Número de itens por página (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Lista paginada de milestones do repositório.`,
        inputSchema: ListMilestonesSchema.shape,
      },
      async (params: z.infer<typeof ListMilestonesSchema>) => {
        const validatedParams = ListMilestonesSchema.parse(params);
        return this.listMilestones(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.page,
          validatedParams.pagelen,
          validatedParams.output || 'json'
        );
      }
    );

    const GetMilestoneSchema = z.object({
      workspace: z.string().describe('Workspace contendo o repositório'),
      repoSlug: z.string().describe('Slug/nome do repositório'),
      milestoneId: z.number().describe('ID do milestone'),
      output: z.enum(['markdown', 'json']).optional().describe('Formato de saída'),
    });

    // Register get milestone tool
    server.registerTool(
      'issue_get_milestone',
      {
        description: `Obtém um milestone específico do repositório.

**Funcionalidades:**
- Detalhes completos do milestone
- Informações de links e metadados
- Validação de existência

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`milestoneId\`: ID do milestone
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Informações detalhadas do milestone especificado.`,
        inputSchema: GetMilestoneSchema.shape,
      },
      async (params: z.infer<typeof GetMilestoneSchema>) => {
        const validatedParams = GetMilestoneSchema.parse(params);
        return this.getMilestone(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.milestoneId,
          validatedParams.output || 'json'
        );
      }
    );

    const ListVersionsSchema = z.object({
      workspace: z.string().describe('Workspace contendo o repositório'),
      repoSlug: z.string().describe('Slug/nome do repositório'),
      page: z.number().optional().describe('Número da página para paginação'),
      pagelen: z.number().optional().describe('Número de itens por página'),
      output: z.enum(['markdown', 'json']).optional().describe('Formato de saída'),
    });

    // Register list versions tool
    server.registerTool(
      'issue_list_versions',
      {
        description: `Lista as versões definidas para issues do repositório.

**Funcionalidades:**
- Lista todas as versões disponíveis
- Suporte a paginação
- Informações detalhadas das versões

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`page\`: Número da página para paginação (opcional)
- \`pagelen\`: Número de itens por página (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Lista paginada de versões do repositório.`,
        inputSchema: ListVersionsSchema.shape,
      },
      async (params: z.infer<typeof ListVersionsSchema>) => {
        const validatedParams = ListVersionsSchema.parse(params);
        return this.listVersions(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.page,
          validatedParams.pagelen,
          validatedParams.output || 'json'
        );
      }
    );

    const GetVersionSchema = z.object({
      workspace: z.string().describe('Workspace contendo o repositório'),
      repoSlug: z.string().describe('Slug/nome do repositório'),
      versionId: z.number().describe('ID da versão'),
      output: z.enum(['markdown', 'json']).optional().describe('Formato de saída'),
    });

    // Register get version tool
    server.registerTool(
      'issue_get_version',
      {
        description: `Obtém uma versão específica definida para issues do repositório.

**Funcionalidades:**
- Detalhes completos da versão
- Informações de links e metadados
- Validação de existência

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`versionId\`: ID da versão
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Informações detalhadas da versão especificada.`,
        inputSchema: GetVersionSchema.shape,
      },
      async (params: z.infer<typeof GetVersionSchema>) => {
        const validatedParams = GetVersionSchema.parse(params);
        return this.getVersion(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.versionId,
          validatedParams.output || 'json'
        );
      }
    );

    registerLogger.info('Successfully registered all cloud issue tools');
  }
}
