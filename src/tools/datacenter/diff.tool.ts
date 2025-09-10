import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPool, Pool } from 'generic-pool';
import { Logger } from '../../utils/logger.util.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { PullRequestService } from '../../services/datacenter/pull-request.service.js';
import { createMcpResponse, createErrorResponse } from '../../services/types/base.types.js';
import { z } from 'zod';

// Zod schemas for parameter validation
const GetPullRequestDiffSchema = z.object({
  projectKey: z.string(),
  repositorySlug: z.string(),
  pullRequestId: z.number(),
  context: z.number().optional(),
  whitespace: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetPullRequestDiffStatsSchema = z.object({
  projectKey: z.string(),
  repositorySlug: z.string(),
  pullRequestId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetPullRequestPatchSchema = z.object({
  projectKey: z.string(),
  repositorySlug: z.string(),
  pullRequestId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetPullRequestCommitsSchema = z.object({
  projectKey: z.string(),
  repositorySlug: z.string(),
  pullRequestId: z.number(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

/**
 * Diff Tools for Bitbucket Data Center
 *
 * Comprehensive diff management including:
 * - Get pull request diff
 * - Get pull request diff statistics
 * - Get pull request patch
 * - Get pull request commits
 */
export class DataCenterDiffTools {
  private static logger = Logger.forContext('DataCenterDiffTools');
  private static pullRequestServicePool: Pool<PullRequestService>;

  static initialize(): void {
    const pullRequestServiceFactory = {
      create: async () =>
        new PullRequestService(new ApiClient(), Logger.forContext('PullRequestService')),
      destroy: async () => {},
    };

    this.pullRequestServicePool = createPool(pullRequestServiceFactory, {
      min: 2,
      max: 10,
    });
    this.logger.info('Data Center Diff tools initialized');
  }

  /**
   * Get pull request diff
   */
  static async getPullRequestDiff(
    projectKey: string,
    repositorySlug: string,
    pullRequestId: number,
    contextLines?: number,
    whitespace?: string,
    withComments?: boolean,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getPullRequestDiff');
    let pullRequestService = null;

    try {
      methodLogger.debug('Getting pull request diff:', {
        projectKey,
        repositorySlug,
        pullRequestId,
      });
      pullRequestService = await this.pullRequestServicePool.acquire();

      const result = await pullRequestService.getPullRequestDiff(
        projectKey,
        repositorySlug,
        pullRequestId,
        {
          contextLines,
          whitespace,
          withComments,
        }
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
   * Get pull request diff statistics
   */
  static async getPullRequestDiffStat(
    projectKey: string,
    repositorySlug: string,
    pullRequestId: number,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getPullRequestDiffStat');
    let pullRequestService = null;

    try {
      methodLogger.debug('Getting pull request diff stat:', {
        projectKey,
        repositorySlug,
        pullRequestId,
      });
      pullRequestService = await this.pullRequestServicePool.acquire();

      const result = await pullRequestService.getPullRequestDiff(
        projectKey,
        repositorySlug,
        pullRequestId
      );

      methodLogger.debug('Successfully retrieved pull request diff stat');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get pull request diff stat:', error);
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
    projectKey: string,
    repositorySlug: string,
    pullRequestId: number,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getPullRequestPatch');
    let pullRequestService = null;

    try {
      methodLogger.debug('Getting pull request patch:', {
        projectKey,
        repositorySlug,
        pullRequestId,
      });
      pullRequestService = await this.pullRequestServicePool.acquire();

      const result = await pullRequestService.getPullRequest(
        projectKey,
        repositorySlug,
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
   * Get pull request commits
   */
  static async getPullRequestCommits(
    projectKey: string,
    repositorySlug: string,
    pullRequestId: number,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getPullRequestCommits');
    let pullRequestService = null;

    try {
      methodLogger.debug('Getting pull request commits:', {
        projectKey,
        repositorySlug,
        pullRequestId,
      });
      pullRequestService = await this.pullRequestServicePool.acquire();

      const result = await pullRequestService.getPullRequestComments(
        projectKey,
        repositorySlug,
        pullRequestId
      );

      methodLogger.debug('Successfully retrieved pull request commits');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get pull request commits:', error);
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
   * Register all diff tools with the MCP server
   */
  static register(server: McpServer): void {
    const registerLogger = this.logger.forMethod('register');

    // Initialize the service
    this.initialize();

    // Register get pull request diff tool
    server.registerTool(
      'diff_get_pull_request',
      {
        description: `Obtém o diff de um pull request específico no Bitbucket Data Center.

**Funcionalidades:**
- Diff completo do pull request
- Controle de linhas de contexto
- Opções de espaços em branco
- Inclusão de comentários

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`repositorySlug\`: Slug do repositório
- \`pullRequestId\`: ID do pull request
- \`contextLines\`: Número de linhas de contexto (opcional)
- \`whitespace\`: Tratamento de espaços em branco (opcional)
- \`withComments\`: Incluir comentários (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Diff completo do pull request no formato git.`,
        inputSchema: GetPullRequestDiffSchema.shape,
      },
      async (params: z.infer<typeof GetPullRequestDiffSchema>) => {
        const validatedParams = GetPullRequestDiffSchema.parse(params);
        return await this.getPullRequestDiff(
          validatedParams.projectKey,
          validatedParams.repositorySlug,
          validatedParams.pullRequestId,
          validatedParams.context,
          validatedParams.whitespace,
          undefined,
          validatedParams.output
        );
      }
    );

    // Register get pull request diff stat tool
    server.registerTool(
      'diff_get_pull_request_stat',
      {
        description: `Obtém estatísticas de diff de um pull request no Bitbucket Data Center.

**Funcionalidades:**
- Estatísticas detalhadas de mudanças
- Contagem de linhas adicionadas/removidas
- Informações sobre arquivos modificados
- Dados de renomeação e status

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`repositorySlug\`: Slug do repositório
- \`pullRequestId\`: ID do pull request
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Estatísticas de diff em formato JSON com contagem de linhas e arquivos modificados.`,
        inputSchema: GetPullRequestDiffStatsSchema.shape,
      },
      async (params: z.infer<typeof GetPullRequestDiffStatsSchema>) => {
        const validatedParams = GetPullRequestDiffStatsSchema.parse(params);
        return await this.getPullRequestDiffStat(
          validatedParams.projectKey,
          validatedParams.repositorySlug,
          validatedParams.pullRequestId,
          validatedParams.output
        );
      }
    );

    // Register get pull request patch tool
    server.registerTool(
      'diff_get_pull_request_patch',
      {
        description: `Obtém um patch para um pull request específico no Bitbucket Data Center.

**Funcionalidades:**
- Patch bruto para o pull request
- Formato de patch padrão
- Informações completas de mudanças

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`repositorySlug\`: Slug do repositório
- \`pullRequestId\`: ID do pull request
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Patch bruto no formato padrão para o pull request especificado.`,
        inputSchema: GetPullRequestPatchSchema.shape,
      },
      async (params: z.infer<typeof GetPullRequestPatchSchema>) => {
        const validatedParams = GetPullRequestPatchSchema.parse(params);
        return await this.getPullRequestPatch(
          validatedParams.projectKey,
          validatedParams.repositorySlug,
          validatedParams.pullRequestId,
          validatedParams.output
        );
      }
    );

    // Register get pull request commits tool
    server.registerTool(
      'diff_get_pull_request_commits',
      {
        description: `Obtém os commits de um pull request específico no Bitbucket Data Center.

**Funcionalidades:**
- Lista de commits do pull request
- Informações detalhadas de cada commit
- Histórico completo de mudanças

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`repositorySlug\`: Slug do repositório
- \`pullRequestId\`: ID do pull request
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Lista de commits com informações detalhadas do pull request.`,
        inputSchema: GetPullRequestCommitsSchema.shape,
      },
      async (params: z.infer<typeof GetPullRequestCommitsSchema>) => {
        const validatedParams = GetPullRequestCommitsSchema.parse(params);
        return await this.getPullRequestCommits(
          validatedParams.projectKey,
          validatedParams.repositorySlug,
          validatedParams.pullRequestId,
          validatedParams.output
        );
      }
    );

    registerLogger.info('Successfully registered all data center diff tools');
  }
}
