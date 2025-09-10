import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPool, Pool } from 'generic-pool';
import { Logger } from '../../utils/logger.util.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { DiffService } from '../../services/cloud/diff.service.js';
import { createMcpResponse, createErrorResponse } from '../../services/types/base.types.js';
import { z } from 'zod';

// Zod schemas for parameter validation
const GetDiffSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  spec: z.string(),
  context: z.number().optional(),
  path: z.string().optional(),
  ignoreWhitespace: z.boolean().optional(),
  binary: z.boolean().optional(),
  renames: z.boolean().optional(),
  merge: z.boolean().optional(),
  topic: z.boolean().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetDiffStatSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  spec: z.string(),
  ignoreWhitespace: z.boolean().optional(),
  merge: z.boolean().optional(),
  path: z.string().optional(),
  renames: z.boolean().optional(),
  topic: z.boolean().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetPatchSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  spec: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetMergeBaseSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  revspec: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

/**
 * Diff Tools for Bitbucket Cloud
 *
 * Comprehensive diff management including:
 * - Compare two commits
 * - Get diff statistics
 * - Get patches for commits
 * - Find common ancestors between commits
 */
export class CloudDiffTools {
  private static logger = Logger.forContext('CloudDiffTools');
  private static diffServicePool: Pool<DiffService>;

  static initialize(): void {
    const diffServiceFactory = {
      create: async () => new DiffService(new ApiClient()),
      destroy: async () => {},
    };

    this.diffServicePool = createPool(diffServiceFactory, { min: 2, max: 10 });
    this.logger.info('Cloud Diff tools initialized');
  }

  /**
   * Compare two commits and get raw diff
   */
  static async getDiff(
    workspace: string,
    repoSlug: string,
    spec: string,
    context?: number,
    path?: string,
    ignoreWhitespace?: boolean,
    binary?: boolean,
    renames?: boolean,
    merge?: boolean,
    topic?: boolean,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getDiff');
    let diffService = null;

    try {
      methodLogger.debug('Getting diff:', { workspace, repoSlug, spec });
      diffService = await this.diffServicePool.acquire();

      const result = await diffService.getDiff({
        workspace: workspace,
        repo_slug: repoSlug,
        spec,
        context,
        path,
        ignore_whitespace: ignoreWhitespace,
        binary,
        renames,
        merge,
        topic,
      });

      methodLogger.debug('Successfully retrieved diff');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get diff:', error);
      if (diffService) {
        this.diffServicePool.destroy(diffService);
        diffService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (diffService) {
        this.diffServicePool.release(diffService);
      }
    }
  }

  /**
   * Get diff statistics between two commits
   */
  static async getDiffStat(
    workspace: string,
    repoSlug: string,
    spec: string,
    ignoreWhitespace?: boolean,
    merge?: boolean,
    path?: string,
    renames?: boolean,
    topic?: boolean,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getDiffStat');
    let diffService = null;

    try {
      methodLogger.debug('Getting diff stat:', { workspace, repoSlug, spec });
      diffService = await this.diffServicePool.acquire();

      const result = await diffService.getDiffStat({
        workspace: workspace,
        repo_slug: repoSlug,
        spec,
        ignore_whitespace: ignoreWhitespace,
        merge,
        path,
        renames,
        topic,
      });

      methodLogger.debug('Successfully retrieved diff stat');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get diff stat:', error);
      if (diffService) {
        this.diffServicePool.destroy(diffService);
        diffService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (diffService) {
        this.diffServicePool.release(diffService);
      }
    }
  }

  /**
   * Get patch for commits
   */
  static async getPatch(
    workspace: string,
    repoSlug: string,
    spec: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getPatch');
    let diffService = null;

    try {
      methodLogger.debug('Getting patch:', { workspace, repoSlug, spec });
      diffService = await this.diffServicePool.acquire();

      const result = await diffService.getPatch({
        workspace: workspace,
        repo_slug: repoSlug,
        spec,
      });

      methodLogger.debug('Successfully retrieved patch');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get patch:', error);
      if (diffService) {
        this.diffServicePool.destroy(diffService);
        diffService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (diffService) {
        this.diffServicePool.release(diffService);
      }
    }
  }

  /**
   * Get common ancestor between two commits
   */
  static async getMergeBase(
    workspace: string,
    repoSlug: string,
    revspec: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getMergeBase');
    let diffService = null;

    try {
      methodLogger.debug('Getting merge base:', { workspace, repoSlug, revspec });
      diffService = await this.diffServicePool.acquire();

      const result = await diffService.getMergeBase({
        workspace: workspace,
        repo_slug: repoSlug,
        revspec,
      });

      methodLogger.debug('Successfully retrieved merge base');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get merge base:', error);
      if (diffService) {
        this.diffServicePool.destroy(diffService);
        diffService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (diffService) {
        this.diffServicePool.release(diffService);
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

    // Register get diff tool
    server.registerTool(
      'diff_get',
      {
        description: `Compara dois commits e retorna um diff bruto no estilo git no Bitbucket Cloud.

**Funcionalidades:**
- Comparação completa entre commits
- Diff bruto no formato git
- Filtros por arquivo e contexto
- Opções de formatação avançadas

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`spec\`: Especificação dos commits (ex: "main..feature", "abc123..def456")
- \`context\`: Número de linhas de contexto (opcional)
- \`path\`: Caminho do arquivo para filtrar (opcional)
- \`ignoreWhitespace\`: Ignorar mudanças de espaços em branco (opcional)
- \`binary\`: Incluir arquivos binários (opcional)
- \`renames\`: Detectar renomeações (opcional)
- \`merge\`: Incluir commits de merge (opcional)
- \`topic\`: Incluir tópicos (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o diff bruto no formato git.`,
        inputSchema: GetDiffSchema.shape,
      },
      async (params: z.infer<typeof GetDiffSchema>) => {
        const validatedParams = GetDiffSchema.parse(params);
        return this.getDiff(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.spec,
          validatedParams.context,
          validatedParams.path,
          validatedParams.ignoreWhitespace,
          validatedParams.binary,
          validatedParams.renames,
          validatedParams.merge,
          validatedParams.topic,
          validatedParams.output
        );
      }
    );

    // Register get diff stat tool
    server.registerTool(
      'diff_get_stat',
      {
        description: `Obtém estatísticas de diff entre dois commits no Bitbucket Cloud.

**Funcionalidades:**
- Estatísticas detalhadas de mudanças
- Contagem de linhas adicionadas/removidas
- Informações sobre arquivos modificados
- Dados de renomeação e status

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`spec\`: Especificação dos commits (ex: "main..feature")
- \`ignoreWhitespace\`: Ignorar mudanças de espaços em branco (opcional)
- \`merge\`: Incluir commits de merge (opcional)
- \`path\`: Caminho do arquivo para filtrar (opcional)
- \`renames\`: Detectar renomeações (opcional)
- \`topic\`: Incluir tópicos (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com as estatísticas de diff.`,
        inputSchema: GetDiffStatSchema.shape,
      },
      async (params: z.infer<typeof GetDiffStatSchema>) => {
        const validatedParams = GetDiffStatSchema.parse(params);
        return this.getDiffStat(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.spec,
          validatedParams.ignoreWhitespace,
          validatedParams.merge,
          validatedParams.path,
          validatedParams.renames,
          validatedParams.topic,
          validatedParams.output
        );
      }
    );

    // Register get patch tool
    server.registerTool(
      'diff_get_patch',
      {
        description: `Obtém um patch para commits específicos no Bitbucket Cloud.

**Funcionalidades:**
- Patch bruto para commits individuais
- Patch-series para especificações de revisão
- Formato de patch padrão

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`spec\`: Especificação dos commits (ex: "abc123", "main..feature")

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o patch bruto.`,
        inputSchema: GetPatchSchema.shape,
      },
      async (params: z.infer<typeof GetPatchSchema>) => {
        const validatedParams = GetPatchSchema.parse(params);
        return this.getPatch(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.spec,
          validatedParams.output
        );
      }
    );

    // Register get merge base tool
    server.registerTool(
      'diff_get_merge_base',
      {
        description: `Encontra o ancestral comum entre dois commits no Bitbucket Cloud.

**Funcionalidades:**
- Encontra o melhor ancestral comum
- Informações sobre o commit base
- Útil para operações de merge

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`revspec\`: Especificação de revisão (ex: "main...feature")

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com informações sobre o commit ancestral comum.`,
        inputSchema: GetMergeBaseSchema.shape,
      },
      async (params: z.infer<typeof GetMergeBaseSchema>) => {
        const validatedParams = GetMergeBaseSchema.parse(params);
        return this.getMergeBase(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.revspec,
          validatedParams.output
        );
      }
    );

    registerLogger.info('Successfully registered all cloud diff tools');
  }
}
