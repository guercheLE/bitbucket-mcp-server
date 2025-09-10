import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPool, Pool } from 'generic-pool';
import { Logger } from '../../utils/logger.util.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { SourceService } from '../../services/cloud/source.service.js';
import { createMcpResponse, createErrorResponse } from '../../services/types/base.types.js';
import { z } from 'zod';

// Zod schemas for parameter validation
const ListFileHistorySchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  commit: z.string(),
  path: z.string(),
  page: z.number().optional(),
  pagelen: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetRootDirectorySchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  revision: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateCommitSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  commit: z.any(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetFileOrDirectorySchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  commit: z.string(),
  path: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

/**
 * Source Tools for Bitbucket Cloud
 *
 * Comprehensive source code management including:
 * - List file history
 * - Get root directory
 * - Create commits
 * - Get files or directories
 */
export class CloudSourceTools {
  private static logger = Logger.forContext('CloudSourceTools');
  private static sourceServicePool: Pool<SourceService>;

  static initialize(): void {
    const sourceServiceFactory = {
      create: async () => new SourceService(new ApiClient()),
      destroy: async () => {},
    };

    this.sourceServicePool = createPool(sourceServiceFactory, { min: 2, max: 10 });
    this.logger.info('Cloud Source tools initialized');
  }

  /**
   * List file history
   */
  static async listFileHistory(
    workspace: string,
    repoSlug: string,
    commit: string,
    path: string,
    page?: number,
    pagelen?: number,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('listFileHistory');
    let sourceService = null;

    try {
      methodLogger.debug('Listing file history:', {
        workspace,
        repoSlug,
        commit,
        path,
        page,
        pagelen,
      });
      sourceService = await this.sourceServicePool.acquire();

      const result = await sourceService.listFileHistory({
        workspace,
        repo_slug: repoSlug,
        commit,
        path,
        page: page || 1,
        pagelen: pagelen || 10,
      });

      methodLogger.debug('Successfully listed file history');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list file history:', error);
      if (sourceService) {
        this.sourceServicePool.destroy(sourceService);
        sourceService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (sourceService) {
        this.sourceServicePool.release(sourceService);
      }
    }
  }

  /**
   * Get root directory
   */
  static async getRootDirectory(
    workspace: string,
    repoSlug: string,
    revision?: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getRootDirectory');
    let sourceService = null;

    try {
      methodLogger.debug('Getting root directory:', { workspace, repoSlug, revision });
      sourceService = await this.sourceServicePool.acquire();

      const result = await sourceService.getRootDirectory({
        workspace,
        repo_slug: repoSlug,
      });

      methodLogger.debug('Successfully retrieved root directory');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get root directory:', error);
      if (sourceService) {
        this.sourceServicePool.destroy(sourceService);
        sourceService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (sourceService) {
        this.sourceServicePool.release(sourceService);
      }
    }
  }

  /**
   * Create a commit
   */
  static async createCommit(
    workspace: string,
    repoSlug: string,
    commit: any,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('createCommit');
    let sourceService = null;

    try {
      methodLogger.debug('Creating commit:', { workspace, repoSlug, commit });
      sourceService = await this.sourceServicePool.acquire();

      const result = await sourceService.createCommit({
        workspace,
        repo_slug: repoSlug,
        commit,
      });

      methodLogger.debug('Successfully created commit');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create commit:', error);
      if (sourceService) {
        this.sourceServicePool.destroy(sourceService);
        sourceService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (sourceService) {
        this.sourceServicePool.release(sourceService);
      }
    }
  }

  /**
   * Get file or directory
   */
  static async getFileOrDirectory(
    workspace: string,
    repoSlug: string,
    commit: string,
    path: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getFileOrDirectory');
    let sourceService = null;

    try {
      methodLogger.debug('Getting file or directory:', { workspace, repoSlug, commit, path });
      sourceService = await this.sourceServicePool.acquire();

      const result = await sourceService.getFileOrDirectory({
        workspace,
        repo_slug: repoSlug,
        commit,
        path,
      });

      methodLogger.debug('Successfully retrieved file or directory');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get file or directory:', error);
      if (sourceService) {
        this.sourceServicePool.destroy(sourceService);
        sourceService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (sourceService) {
        this.sourceServicePool.release(sourceService);
      }
    }
  }

  /**
   * Register all source tools with the MCP server
   */
  static register(server: McpServer): void {
    const registerLogger = this.logger.forMethod('register');

    // Initialize the service
    this.initialize();

    // Register list file history tool
    server.registerTool(
      'source_list_file_history',
      {
        description: `Lista histórico de um arquivo.

**Funcionalidades:**
- Histórico de commits de um arquivo
- Paginação de resultados
- Informações detalhadas de cada commit

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`commit\`: Hash do commit
- \`path\`: Caminho do arquivo
- \`page\`: Número da página (opcional)
- \`pagelen\`: Tamanho da página (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com o histórico do arquivo.`,
        inputSchema: ListFileHistorySchema.shape,
      },
      async (params: z.infer<typeof ListFileHistorySchema>) => {
        const validatedParams = ListFileHistorySchema.parse(params);
        return this.listFileHistory(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.commit,
          validatedParams.path,
          validatedParams.page,
          validatedParams.pagelen,
          validatedParams.output
        );
      }
    );

    // Register get root directory tool
    server.registerTool(
      'source_get_root_directory',
      {
        description: `Obtém diretório raiz do repositório.

**Funcionalidades:**
- Listagem de arquivos e diretórios raiz
- Estrutura do repositório
- Metadados de arquivos

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`revision\`: Revisão específica (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com o conteúdo do diretório raiz.`,
        inputSchema: GetRootDirectorySchema.shape,
      },
      async (params: z.infer<typeof GetRootDirectorySchema>) => {
        const validatedParams = GetRootDirectorySchema.parse(params);
        return this.getRootDirectory(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.revision,
          validatedParams.output
        );
      }
    );

    // Register create commit tool
    server.registerTool(
      'source_create_commit',
      {
        description: `Cria um novo commit.

**Funcionalidades:**
- Criação de commits
- Upload de arquivos
- Configuração de metadados

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`commit\`: Objeto com configurações do commit
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com os detalhes do commit criado.`,
        inputSchema: CreateCommitSchema.shape,
      },
      async (params: z.infer<typeof CreateCommitSchema>) => {
        const validatedParams = CreateCommitSchema.parse(params);
        return this.createCommit(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.commit,
          validatedParams.output
        );
      }
    );

    // Register get file or directory tool
    server.registerTool(
      'source_get_file_or_directory',
      {
        description: `Obtém arquivo ou diretório específico.

**Funcionalidades:**
- Leitura de arquivos
- Listagem de diretórios
- Conteúdo e metadados

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`commit\`: Hash do commit
- \`path\`: Caminho do arquivo ou diretório
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com o conteúdo do arquivo ou diretório.`,
        inputSchema: GetFileOrDirectorySchema.shape,
      },
      async (params: z.infer<typeof GetFileOrDirectorySchema>) => {
        const validatedParams = GetFileOrDirectorySchema.parse(params);
        return this.getFileOrDirectory(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.commit,
          validatedParams.path,
          validatedParams.output
        );
      }
    );

    registerLogger.info('Successfully registered all cloud source tools');
  }
}
