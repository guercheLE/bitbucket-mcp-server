import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPool, Pool } from 'generic-pool';
import { SearchService } from '../../services/cloud/search.service.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';
import { createMcpResponse, createErrorResponse } from '../../services/types/base.types.js';
import { z } from 'zod';

// Zod schemas for parameter validation
const SearchTeamCodeSchema = z.object({
  username: z.string(),
  search_query: z.string(),
  page: z.number().optional(),
  pagelen: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const SearchUserCodeSchema = z.object({
  selected_user: z.string(),
  search_query: z.string(),
  page: z.number().optional(),
  pagelen: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const SearchWorkspaceCodeSchema = z.object({
  workspace: z.string(),
  search_query: z.string(),
  page: z.number().optional(),
  pagelen: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

/**
 * Cloud Search Tools
 * Ferramentas para busca de código no Bitbucket Cloud
 */
export class CloudSearchTools {
  private static logger = Logger.forContext('CloudSearchTools');
  private static searchServicePool: Pool<SearchService>;

  static initialize(): void {
    const searchServiceFactory = {
      create: async () => new SearchService(new ApiClient()),
      destroy: async () => {},
    };

    this.searchServicePool = createPool(searchServiceFactory, {
      min: 2,
      max: 10,
    });
    this.logger.info('Cloud Search tools initialized');
  }

  static async searchTeamCode(params: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('searchTeamCode');
    let service: SearchService | null = null;

    try {
      service = await this.searchServicePool.acquire();
      methodLogger.debug('Searching team code:', {
        username: params.username,
        search_query: params.search_query,
        page: params.page,
        pagelen: params.pagelen,
      });

      const result = await service.searchTeamCode({
        username: params.username,
        search_query: params.search_query,
        page: params.page,
        pagelen: params.pagelen,
      });

      methodLogger.info('Successfully searched team code');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to search team code:', error);
      if (service) {
        this.searchServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.searchServicePool.release(service);
      }
    }
  }

  static async searchUserCode(params: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('searchUserCode');
    let service: SearchService | null = null;

    try {
      service = await this.searchServicePool.acquire();
      methodLogger.debug('Searching user code:', {
        selected_user: params.selected_user,
        search_query: params.search_query,
        page: params.page,
        pagelen: params.pagelen,
      });

      const result = await service.searchUserCode({
        selected_user: params.selected_user,
        search_query: params.search_query,
        page: params.page,
        pagelen: params.pagelen,
      });

      methodLogger.info('Successfully searched user code');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to search user code:', error);
      if (service) {
        this.searchServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.searchServicePool.release(service);
      }
    }
  }

  static async searchWorkspaceCode(params: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('searchWorkspaceCode');
    let service: SearchService | null = null;

    try {
      service = await this.searchServicePool.acquire();
      methodLogger.debug('Searching workspace code:', {
        workspace: params.workspace,
        search_query: params.search_query,
        page: params.page,
        pagelen: params.pagelen,
      });

      const result = await service.searchWorkspaceCode({
        workspace: params.workspace,
        search_query: params.search_query,
        page: params.page,
        pagelen: params.pagelen,
      });

      methodLogger.info('Successfully searched workspace code');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to search workspace code:', error);
      if (service) {
        this.searchServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.searchServicePool.release(service);
      }
    }
  }

  static register(server: McpServer): void {
    const registerLogger = this.logger.forMethod('register');

    // Initialize the service
    this.initialize();

    // Search Team Code
    server.registerTool(
      'search_team_code',
      {
        description: `Busca código em repositórios de uma equipe no Bitbucket Cloud.

**Funcionalidades:**
- Busca de código em equipe
- Filtros e paginação
- Resultados de busca

**Parâmetros:**
- \`username\`: Nome de usuário da equipe
- \`search_query\`: Query de busca
- \`page\`: Número da página (opcional)
- \`pagelen\`: Tamanho da página (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os resultados da busca.`,
        inputSchema: SearchTeamCodeSchema.shape,
      },
      async (params: z.infer<typeof SearchTeamCodeSchema>) => {
        const validatedParams = SearchTeamCodeSchema.parse(params);
        return await this.searchTeamCode(
          {
            username: validatedParams.username,
            search_query: validatedParams.search_query,
            page: validatedParams.page,
            pagelen: validatedParams.pagelen,
          },
          validatedParams.output
        );
      }
    );

    // Search User Code
    server.registerTool(
      'search_user_code',
      {
        description: `Busca código em repositórios de um usuário no Bitbucket Cloud.

**Funcionalidades:**
- Busca de código de usuário
- Filtros e paginação
- Resultados de busca

**Parâmetros:**
- \`selected_user\`: Nome de usuário
- \`search_query\`: Query de busca
- \`page\`: Número da página (opcional)
- \`pagelen\`: Tamanho da página (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os resultados da busca.`,
        inputSchema: SearchUserCodeSchema.shape,
      },
      async (params: z.infer<typeof SearchUserCodeSchema>) => {
        const validatedParams = SearchUserCodeSchema.parse(params);
        return await this.searchUserCode(
          {
            selected_user: validatedParams.selected_user,
            search_query: validatedParams.search_query,
            page: validatedParams.page,
            pagelen: validatedParams.pagelen,
          },
          validatedParams.output
        );
      }
    );

    // Search Workspace Code
    server.registerTool(
      'search_workspace_code',
      {
        description: `Busca código em repositórios de um workspace no Bitbucket Cloud.

**Funcionalidades:**
- Busca de código de workspace
- Filtros e paginação
- Resultados de busca

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`search_query\`: Query de busca
- \`page\`: Número da página (opcional)
- \`pagelen\`: Tamanho da página (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os resultados da busca.`,
        inputSchema: SearchWorkspaceCodeSchema.shape,
      },
      async (params: z.infer<typeof SearchWorkspaceCodeSchema>) => {
        const validatedParams = SearchWorkspaceCodeSchema.parse(params);
        return await this.searchWorkspaceCode(
          {
            workspace: validatedParams.workspace,
            search_query: validatedParams.search_query,
            page: validatedParams.page,
            pagelen: validatedParams.pagelen,
          },
          validatedParams.output
        );
      }
    );

    registerLogger.info('Successfully registered all cloud search tools');
  }
}
