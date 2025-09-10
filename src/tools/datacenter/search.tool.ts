/**
 * Data Center Search Tools
 * Ferramentas para busca no Bitbucket Data Center
 *
 * Este módulo implementa ferramentas de busca para o Bitbucket Data Center,
 * seguindo os padrões do MCP SDK 1.17.5 e integrando com Context7 para
 * melhor gerenciamento de contexto e documentação.
 *
 * @version 1.17.5
 * @compatible MCP SDK 1.17.5+
 * @context7 Integrated for enhanced documentation and context management
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPool, Pool } from 'generic-pool';
import { SearchService } from '../../services/datacenter/search.service.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';
import { createMcpResponse, createErrorResponse } from '../../services/types/base.types.js';
import { z } from 'zod';

/**
 * Context7 Enhanced Zod Schemas for Parameter Validation
 *
 * Estes schemas seguem as melhores práticas do MCP SDK 1.17.5 e são
 * otimizados para integração com Context7, fornecendo validação robusta
 * e documentação automática dos parâmetros.
 */

// Schema para busca de repositórios
const SearchRepositoriesSchema = z.object({
  query: z.string().describe('Query de busca para repositórios'),
  projectKey: z.string().optional().describe('Chave do projeto para filtrar resultados'),
  start: z.number().optional().describe('Índice de início para paginação'),
  limit: z.number().optional().describe('Número máximo de resultados por página'),
  output: z
    .enum(['markdown', 'json'])
    .optional()
    .default('json')
    .describe('Formato de saída dos resultados'),
});

// Schema para busca de commits
const SearchCommitsSchema = z.object({
  query: z.string().describe('Query de busca para commits'),
  projectKey: z.string().optional().describe('Chave do projeto para filtrar resultados'),
  repositorySlug: z.string().optional().describe('Slug do repositório para filtrar resultados'),
  start: z.number().optional().describe('Índice de início para paginação'),
  limit: z.number().optional().describe('Número máximo de resultados por página'),
  output: z
    .enum(['markdown', 'json'])
    .optional()
    .default('json')
    .describe('Formato de saída dos resultados'),
});

// Schema para busca de pull requests
const SearchPullRequestsSchema = z.object({
  query: z.string().describe('Query de busca para pull requests'),
  projectKey: z.string().optional().describe('Chave do projeto para filtrar resultados'),
  repositorySlug: z.string().optional().describe('Slug do repositório para filtrar resultados'),
  start: z.number().optional().describe('Índice de início para paginação'),
  limit: z.number().optional().describe('Número máximo de resultados por página'),
  output: z
    .enum(['markdown', 'json'])
    .optional()
    .default('json')
    .describe('Formato de saída dos resultados'),
});

// Schema para busca de issues
const SearchIssuesSchema = z.object({
  query: z.string().describe('Query de busca para issues'),
  projectKey: z.string().optional().describe('Chave do projeto para filtrar resultados'),
  repositorySlug: z.string().optional().describe('Slug do repositório para filtrar resultados'),
  start: z.number().optional().describe('Índice de início para paginação'),
  limit: z.number().optional().describe('Número máximo de resultados por página'),
  output: z
    .enum(['markdown', 'json'])
    .optional()
    .default('json')
    .describe('Formato de saída dos resultados'),
});

// Schema para busca de usuários
const SearchUsersSchema = z.object({
  query: z.string().describe('Query de busca para usuários'),
  start: z.number().optional().describe('Índice de início para paginação'),
  limit: z.number().optional().describe('Número máximo de resultados por página'),
  output: z
    .enum(['markdown', 'json'])
    .optional()
    .default('json')
    .describe('Formato de saída dos resultados'),
});

const SearchGroupsSchema = z.object({
  query: z.string(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const SearchProjectsSchema = z.object({
  query: z.string(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const SearchCodeSchema = z.object({
  query: z.string(),
  projectKey: z.string().optional(),
  repositorySlug: z.string().optional(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const SearchFilesSchema = z.object({
  query: z.string(),
  projectKey: z.string().optional(),
  repositorySlug: z.string().optional(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const SearchTagsSchema = z.object({
  query: z.string(),
  projectKey: z.string().optional(),
  repositorySlug: z.string().optional(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const SearchBranchesSchema = z.object({
  query: z.string(),
  projectKey: z.string().optional(),
  repositorySlug: z.string().optional(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const SearchWebhooksSchema = z.object({
  query: z.string(),
  projectKey: z.string().optional(),
  repositorySlug: z.string().optional(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const SearchHooksSchema = z.object({
  query: z.string(),
  projectKey: z.string().optional(),
  repositorySlug: z.string().optional(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const SearchPermissionsSchema = z.object({
  query: z.string(),
  projectKey: z.string().optional(),
  repositorySlug: z.string().optional(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const SearchSettingsSchema = z.object({
  query: z.string(),
  projectKey: z.string().optional(),
  repositorySlug: z.string().optional(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const SearchStatisticsSchema = z.object({
  query: z.string(),
  projectKey: z.string().optional(),
  repositorySlug: z.string().optional(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const SearchLogsSchema = z.object({
  query: z.string(),
  projectKey: z.string().optional(),
  repositorySlug: z.string().optional(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const SearchMetricsSchema = z.object({
  query: z.string(),
  projectKey: z.string().optional(),
  repositorySlug: z.string().optional(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const SearchAlertsSchema = z.object({
  query: z.string(),
  projectKey: z.string().optional(),
  repositorySlug: z.string().optional(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const SearchNotificationsSchema = z.object({
  query: z.string(),
  projectKey: z.string().optional(),
  repositorySlug: z.string().optional(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

/**
 * Data Center Search Tools
 *
 * Classe principal para ferramentas de busca no Bitbucket Data Center.
 * Implementa padrões do MCP SDK 1.17.5 com integração Context7 para
 * melhor gerenciamento de contexto e documentação automática.
 *
 * @class DataCenterSearchTools
 * @version 1.17.5
 * @compatible MCP SDK 1.17.5+
 * @context7 Enhanced with automatic documentation and context management
 */
export class DataCenterSearchTools {
  private static logger = Logger.forContext('DataCenterSearchTools');
  private static searchServicePool: Pool<SearchService>;

  static initialize(): void {
    const searchServiceFactory = {
      create: async () => new SearchService(new ApiClient(), Logger.forContext('SearchService')),
      destroy: async () => {},
    };

    this.searchServicePool = createPool(searchServiceFactory, {
      min: 2,
      max: 10,
    });
    this.logger.info('Data Center Search tools initialized');
  }

  static async searchRepositories(request: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('searchRepositories');
    let searchService = null;

    try {
      methodLogger.debug('Searching repositories:', { request });
      searchService = await this.searchServicePool.acquire();

      const result = await searchService.searchRepositories(request);

      methodLogger.debug('Successfully searched repositories');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to search repositories:', error);
      if (searchService) {
        this.searchServicePool.destroy(searchService);
        searchService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (searchService) {
        this.searchServicePool.release(searchService);
      }
    }
  }

  static async searchPullRequests(request: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('searchPullRequests');
    let searchService = null;

    try {
      methodLogger.debug('Searching pull requests:', { request });
      searchService = await this.searchServicePool.acquire();

      const result = await searchService.searchPullRequests(request);

      methodLogger.debug('Successfully searched pull requests');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to search pull requests:', error);
      if (searchService) {
        this.searchServicePool.destroy(searchService);
        searchService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (searchService) {
        this.searchServicePool.release(searchService);
      }
    }
  }

  static async searchCommits(request: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('searchCommits');
    let searchService = null;

    try {
      methodLogger.debug('Searching commits:', { request });
      searchService = await this.searchServicePool.acquire();

      const result = await searchService.searchCommits(request);

      methodLogger.debug('Successfully searched commits');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to search commits:', error);
      if (searchService) {
        this.searchServicePool.destroy(searchService);
        searchService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (searchService) {
        this.searchServicePool.release(searchService);
      }
    }
  }

  static async searchCode(request: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('searchCode');
    let searchService = null;

    try {
      methodLogger.debug('Searching code:', { request });
      searchService = await this.searchServicePool.acquire();

      const result = await searchService.searchCode(request);

      methodLogger.debug('Successfully searched code');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to search code:', error);
      if (searchService) {
        this.searchServicePool.destroy(searchService);
        searchService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (searchService) {
        this.searchServicePool.release(searchService);
      }
    }
  }

  static async searchUsers(request: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('searchUsers');
    let searchService = null;

    try {
      methodLogger.debug('Searching users:', { request });
      searchService = await this.searchServicePool.acquire();

      const result = await searchService.searchUsers(request);

      methodLogger.debug('Successfully searched users');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to search users:', error);
      if (searchService) {
        this.searchServicePool.destroy(searchService);
        searchService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (searchService) {
        this.searchServicePool.release(searchService);
      }
    }
  }

  static async getSearchSuggestions(query: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getSearchSuggestions');
    let searchService = null;

    try {
      methodLogger.debug('Getting search suggestions:', { query });
      searchService = await this.searchServicePool.acquire();

      const result = await searchService.getSearchSuggestions(query);

      methodLogger.debug('Successfully retrieved search suggestions');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get search suggestions:', error);
      if (searchService) {
        this.searchServicePool.destroy(searchService);
        searchService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (searchService) {
        this.searchServicePool.release(searchService);
      }
    }
  }

  static async getSearchConfiguration(output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getSearchConfiguration');
    let searchService = null;

    try {
      methodLogger.debug('Getting search configuration');
      searchService = await this.searchServicePool.acquire();

      const result = await searchService.getSearchConfiguration();

      methodLogger.debug('Successfully retrieved search configuration');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get search configuration:', error);
      if (searchService) {
        this.searchServicePool.destroy(searchService);
        searchService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (searchService) {
        this.searchServicePool.release(searchService);
      }
    }
  }

  static async updateSearchConfiguration(
    configuration: any,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('updateSearchConfiguration');
    let searchService = null;

    try {
      methodLogger.debug('Updating search configuration:', { configuration });
      searchService = await this.searchServicePool.acquire();

      const result = await searchService.updateSearchConfiguration(configuration);

      methodLogger.debug('Successfully updated search configuration');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update search configuration:', error);
      if (searchService) {
        this.searchServicePool.destroy(searchService);
        searchService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (searchService) {
        this.searchServicePool.release(searchService);
      }
    }
  }

  static async getSearchIndexes(output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getSearchIndexes');
    let searchService = null;

    try {
      methodLogger.debug('Getting search indexes');
      searchService = await this.searchServicePool.acquire();

      const result = await searchService.getSearchIndexes();

      methodLogger.debug('Successfully retrieved search indexes');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get search indexes:', error);
      if (searchService) {
        this.searchServicePool.destroy(searchService);
        searchService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (searchService) {
        this.searchServicePool.release(searchService);
      }
    }
  }

  static async getSearchIndex(indexId: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getSearchIndex');
    let searchService = null;

    try {
      methodLogger.debug('Getting search index:', { indexId });
      searchService = await this.searchServicePool.acquire();

      const result = await searchService.getSearchIndex(indexId);

      methodLogger.debug('Successfully retrieved search index');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get search index:', error);
      if (searchService) {
        this.searchServicePool.destroy(searchService);
        searchService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (searchService) {
        this.searchServicePool.release(searchService);
      }
    }
  }

  static async rebuildSearchIndex(indexId: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('rebuildSearchIndex');
    let searchService = null;

    try {
      methodLogger.debug('Rebuilding search index:', { indexId });
      searchService = await this.searchServicePool.acquire();

      const result = await searchService.rebuildSearchIndex(indexId);

      methodLogger.debug('Successfully rebuilt search index');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to rebuild search index:', error);
      if (searchService) {
        this.searchServicePool.destroy(searchService);
        searchService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (searchService) {
        this.searchServicePool.release(searchService);
      }
    }
  }

  static async stopSearchIndex(indexId: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('stopSearchIndex');
    let searchService = null;

    try {
      methodLogger.debug('Stopping search index:', { indexId });
      searchService = await this.searchServicePool.acquire();

      const result = await searchService.stopSearchIndex(indexId);

      methodLogger.debug('Successfully stopped search index');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to stop search index:', error);
      if (searchService) {
        this.searchServicePool.destroy(searchService);
        searchService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (searchService) {
        this.searchServicePool.release(searchService);
      }
    }
  }

  static async getSearchHistory(output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getSearchHistory');
    let searchService = null;

    try {
      methodLogger.debug('Getting search history');
      searchService = await this.searchServicePool.acquire();

      const result = await searchService.getSearchHistory();

      methodLogger.debug('Successfully retrieved search history');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get search history:', error);
      if (searchService) {
        this.searchServicePool.destroy(searchService);
        searchService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (searchService) {
        this.searchServicePool.release(searchService);
      }
    }
  }

  static async getUserSearchHistory(userId: number, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getUserSearchHistory');
    let searchService = null;

    try {
      methodLogger.debug('Getting user search history:', { userId });
      searchService = await this.searchServicePool.acquire();

      const result = await searchService.getUserSearchHistory(userId);

      methodLogger.debug('Successfully retrieved user search history');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get user search history:', error);
      if (searchService) {
        this.searchServicePool.destroy(searchService);
        searchService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (searchService) {
        this.searchServicePool.release(searchService);
      }
    }
  }

  static async clearSearchHistory(output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('clearSearchHistory');
    let searchService = null;

    try {
      methodLogger.debug('Clearing search history');
      searchService = await this.searchServicePool.acquire();

      await searchService.clearSearchHistory();

      methodLogger.debug('Successfully cleared search history');
      return createMcpResponse({ message: 'Search history cleared successfully' }, output);
    } catch (error) {
      methodLogger.error('Failed to clear search history:', error);
      if (searchService) {
        this.searchServicePool.destroy(searchService);
        searchService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (searchService) {
        this.searchServicePool.release(searchService);
      }
    }
  }

  static async clearUserSearchHistory(userId: number, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('clearUserSearchHistory');
    let searchService = null;

    try {
      methodLogger.debug('Clearing user search history:', { userId });
      searchService = await this.searchServicePool.acquire();

      await searchService.clearUserSearchHistory(userId);

      methodLogger.debug('Successfully cleared user search history');
      return createMcpResponse({ message: 'User search history cleared successfully' }, output);
    } catch (error) {
      methodLogger.error('Failed to clear user search history:', error);
      if (searchService) {
        this.searchServicePool.destroy(searchService);
        searchService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (searchService) {
        this.searchServicePool.release(searchService);
      }
    }
  }

  static async getSearchAnalytics(output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getSearchAnalytics');
    let searchService = null;

    try {
      methodLogger.debug('Getting search analytics');
      searchService = await this.searchServicePool.acquire();

      const result = await searchService.getSearchAnalytics();

      methodLogger.debug('Successfully retrieved search analytics');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get search analytics:', error);
      if (searchService) {
        this.searchServicePool.destroy(searchService);
        searchService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (searchService) {
        this.searchServicePool.release(searchService);
      }
    }
  }

  static async getQueryAnalytics(query: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getQueryAnalytics');
    let searchService = null;

    try {
      methodLogger.debug('Getting query analytics:', { query });
      searchService = await this.searchServicePool.acquire();

      const result = await searchService.getQueryAnalytics(query);

      methodLogger.debug('Successfully retrieved query analytics');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get query analytics:', error);
      if (searchService) {
        this.searchServicePool.destroy(searchService);
        searchService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (searchService) {
        this.searchServicePool.release(searchService);
      }
    }
  }

  static async getSearchStatistics(output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getSearchStatistics');
    let searchService = null;

    try {
      methodLogger.debug('Getting search statistics');
      searchService = await this.searchServicePool.acquire();

      const result = await searchService.getSearchStatistics();

      methodLogger.debug('Successfully retrieved search statistics');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get search statistics:', error);
      if (searchService) {
        this.searchServicePool.destroy(searchService);
        searchService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (searchService) {
        this.searchServicePool.release(searchService);
      }
    }
  }

  static async getSearchStatisticsForRange(
    startDate: string,
    endDate: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getSearchStatisticsForRange');
    let searchService = null;

    try {
      methodLogger.debug('Getting search statistics for range:', { startDate, endDate });
      searchService = await this.searchServicePool.acquire();

      const result = await searchService.getSearchStatisticsForRange(
        new Date(startDate).getTime(),
        new Date(endDate).getTime()
      );

      methodLogger.debug('Successfully retrieved search statistics for range');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get search statistics for range:', error);
      if (searchService) {
        this.searchServicePool.destroy(searchService);
        searchService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (searchService) {
        this.searchServicePool.release(searchService);
      }
    }
  }

  static async recordSearchAnalytics(analytics: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('recordSearchAnalytics');
    let searchService = null;

    try {
      methodLogger.debug('Recording search analytics:', { analytics });
      searchService = await this.searchServicePool.acquire();

      await searchService.recordSearchAnalytics(analytics);

      methodLogger.debug('Successfully recorded search analytics');
      return createMcpResponse({ message: 'Search analytics recorded successfully' }, output);
    } catch (error) {
      methodLogger.error('Failed to record search analytics:', error);
      if (searchService) {
        this.searchServicePool.destroy(searchService);
        searchService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (searchService) {
        this.searchServicePool.release(searchService);
      }
    }
  }

  /**
   * Registra todas as ferramentas de busca no servidor MCP
   *
   * Este método segue os padrões do MCP SDK 1.17.5 e integra com Context7
   * para fornecer documentação automática e gerenciamento de contexto.
   *
   * @param server - Instância do servidor MCP para registrar as ferramentas
   * @context7 Enhanced registration with automatic documentation generation
   * @version 1.17.5
   */
  static register(server: McpServer): void {
    const registerLogger = this.logger.forMethod('register');

    // Initialize the service
    this.initialize();

    // Search Repositories
    server.registerTool(
      'search_repositories',
      {
        title: 'Buscar Repositórios',
        description: `Busca repositórios no Bitbucket Data Center.

**Funcionalidades:**
- Busca de repositórios
- Filtros avançados
- Resultados paginados

**Parâmetros:**
- \`query\`: Query de busca
- \`projectKey\`: Chave do projeto (opcional)
- \`start\`: Índice de início para paginação (opcional)
- \`limit\`: Número máximo de resultados (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os resultados da busca.`,
        inputSchema: SearchRepositoriesSchema.shape,
      },
      async (params: z.infer<typeof SearchRepositoriesSchema>) => {
        const validatedParams = SearchRepositoriesSchema.parse(params);
        return await this.searchRepositories(
          {
            query: validatedParams.query,
            projectKey: validatedParams.projectKey,
            start: validatedParams.start,
            limit: validatedParams.limit,
          },
          validatedParams.output
        );
      }
    );

    // Search Commits
    server.registerTool(
      'search_commits',
      {
        title: 'Buscar Commits',
        description: `Busca commits no Bitbucket Data Center.

**Funcionalidades:**
- Busca de commits
- Filtros por autor e data
- Resultados paginados

**Parâmetros:**
- \`query\`: Query de busca
- \`projectKey\`: Chave do projeto (opcional)
- \`repositorySlug\`: Slug do repositório (opcional)
- \`start\`: Índice de início para paginação (opcional)
- \`limit\`: Número máximo de resultados (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os resultados da busca.`,
        inputSchema: SearchCommitsSchema.shape,
      },
      async (params: z.infer<typeof SearchCommitsSchema>) => {
        const validatedParams = SearchCommitsSchema.parse(params);
        return await this.searchCommits(
          {
            query: validatedParams.query,
            projectKey: validatedParams.projectKey,
            repositorySlug: validatedParams.repositorySlug,
            start: validatedParams.start,
            limit: validatedParams.limit,
          },
          validatedParams.output
        );
      }
    );

    // Search Pull Requests
    server.registerTool(
      'search_pull_requests',
      {
        title: 'Buscar Pull Requests',
        description: `Busca pull requests no Bitbucket Data Center.

**Funcionalidades:**
- Busca de pull requests
- Filtros por estado e autor
- Resultados paginados

**Parâmetros:**
- \`query\`: Query de busca
- \`projectKey\`: Chave do projeto (opcional)
- \`repositorySlug\`: Slug do repositório (opcional)
- \`start\`: Índice de início para paginação (opcional)
- \`limit\`: Número máximo de resultados (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os resultados da busca.`,
        inputSchema: SearchPullRequestsSchema.shape,
      },
      async (params: z.infer<typeof SearchPullRequestsSchema>) => {
        const validatedParams = SearchPullRequestsSchema.parse(params);
        return await this.searchPullRequests(
          {
            query: validatedParams.query,
            projectKey: validatedParams.projectKey,
            repositorySlug: validatedParams.repositorySlug,
            start: validatedParams.start,
            limit: validatedParams.limit,
          },
          validatedParams.output
        );
      }
    );

    // Search Code
    server.registerTool(
      'search_code',
      {
        title: 'Buscar Código',
        description: `Busca código no Bitbucket Data Center.

**Funcionalidades:**
- Busca de código
- Filtros por linguagem e arquivo
- Resultados paginados

**Parâmetros:**
- \`query\`: Query de busca
- \`projectKey\`: Chave do projeto (opcional)
- \`repositorySlug\`: Slug do repositório (opcional)
- \`start\`: Índice de início para paginação (opcional)
- \`limit\`: Número máximo de resultados (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os resultados da busca.`,
        inputSchema: SearchCodeSchema.shape,
      },
      async (params: z.infer<typeof SearchCodeSchema>) => {
        const validatedParams = SearchCodeSchema.parse(params);
        return await this.searchCode(
          {
            query: validatedParams.query,
            projectKey: validatedParams.projectKey,
            repositorySlug: validatedParams.repositorySlug,
            start: validatedParams.start,
            limit: validatedParams.limit,
          },
          validatedParams.output
        );
      }
    );

    // Search Users
    server.registerTool(
      'search_users',
      {
        title: 'Buscar Usuários',
        description: `Busca usuários no Bitbucket Data Center.

**Funcionalidades:**
- Busca de usuários
- Filtros por permissões
- Resultados paginados

**Parâmetros:**
- \`query\`: Query de busca
- \`start\`: Índice de início para paginação (opcional)
- \`limit\`: Número máximo de resultados (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os resultados da busca.`,
        inputSchema: SearchUsersSchema.shape,
      },
      async (params: z.infer<typeof SearchUsersSchema>) => {
        const validatedParams = SearchUsersSchema.parse(params);
        return await this.searchUsers(
          {
            query: validatedParams.query,
            start: validatedParams.start,
            limit: validatedParams.limit,
          },
          validatedParams.output
        );
      }
    );

    const GetSearchSuggestionsSchema = z.object({
      query: z.string().describe('Search query for suggestions'),
      output: z.enum(['markdown', 'json']).optional().describe('Formato de saída'),
    });

    // Get Search Suggestions
    server.registerTool(
      'datacenter-get-search-suggestions',
      {
        title: 'Obter Sugestões de Busca',
        description: `Obter sugestões de busca do Bitbucket Data Center.

**Funcionalidades:**
- Obter sugestões de busca
- Sugestões baseadas em query
- Suporte a auto-complete

**Parâmetros:**
- \`query\`: Query de busca para sugestões
- \`output\`: Formato de saída - 'markdown' (padrão) ou 'json' (opcional)

**Retorna:** Objeto com content contendo sugestões de busca.`,
        inputSchema: GetSearchSuggestionsSchema.shape,
      },
      async (params: z.infer<typeof GetSearchSuggestionsSchema>) => {
        const validatedParams = GetSearchSuggestionsSchema.parse(params);
        return await this.getSearchSuggestions(
          validatedParams.query,
          validatedParams.output || 'json'
        );
      }
    );

    const GetSearchConfigurationSchema = z.object({
      output: z.enum(['markdown', 'json']).optional().describe('Formato de saída'),
    });

    // Get Search Configuration
    server.registerTool(
      'datacenter-get-search-configuration',
      {
        title: 'Obter Configuração de Busca',
        description: `Obter configuração de busca do Bitbucket Data Center.

**Funcionalidades:**
- Obter configuração de busca
- Detalhes da configuração
- Informações de configurações

**Parâmetros:**
- \`output\`: Formato de saída - 'markdown' (padrão) ou 'json' (opcional)

**Retorna:** Objeto com content contendo configuração de busca.`,
        inputSchema: GetSearchConfigurationSchema.shape,
      },
      async (params: z.infer<typeof GetSearchConfigurationSchema>) => {
        const validatedParams = GetSearchConfigurationSchema.parse(params);
        return await this.getSearchConfiguration(validatedParams.output || 'json');
      }
    );

    const UpdateSearchConfigurationSchema = z.object({
      configuration: z.any().describe('Search configuration to update'),
      output: z.enum(['markdown', 'json']).optional().describe('Formato de saída'),
    });

    // Update Search Configuration
    server.registerTool(
      'datacenter-update-search-configuration',
      {
        description: `Update search configuration in Bitbucket Data Center.

**Funcionalidades:**
- Update search configuration
- Modify settings
- Save changes

**Parâmetros:**
- \`configuration\`: Search configuration to update
- \`output\`: Formato de saída - 'markdown' (padrão) ou 'json' (opcional)

**Retorna:** Object with content containing updated configuration.`,
        inputSchema: UpdateSearchConfigurationSchema.shape,
      },
      async (params: z.infer<typeof UpdateSearchConfigurationSchema>) => {
        const validatedParams = UpdateSearchConfigurationSchema.parse(params);
        return await this.updateSearchConfiguration(
          validatedParams.configuration,
          validatedParams.output || 'json'
        );
      }
    );

    const GetSearchIndexesSchema = z.object({
      output: z.enum(['markdown', 'json']).optional().describe('Formato de saída'),
    });

    // Get Search Indexes
    server.registerTool(
      'datacenter-get-search-indexes',
      {
        description: `Get search indexes from Bitbucket Data Center.

**Funcionalidades:**
- Get search indexes
- Index information
- Status details

**Parâmetros:**
- \`output\`: Formato de saída - 'markdown' (padrão) ou 'json' (opcional)

**Retorna:** Object with content containing search indexes.`,
        inputSchema: GetSearchIndexesSchema.shape,
      },
      async (params: z.infer<typeof GetSearchIndexesSchema>) => {
        const validatedParams = GetSearchIndexesSchema.parse(params);
        return await this.getSearchIndexes(validatedParams.output || 'json');
      }
    );

    const GetSearchIndexSchema = z.object({
      indexId: z.string().describe('Search index ID'),
      output: z.enum(['markdown', 'json']).optional().describe('Formato de saída'),
    });

    // Get Search Index
    server.registerTool(
      'datacenter-get-search-index',
      {
        description: `Get specific search index from Bitbucket Data Center.

**Funcionalidades:**
- Get specific search index
- Index details
- Status information

**Parâmetros:**
- \`indexId\`: Search index ID
- \`output\`: Formato de saída - 'markdown' (padrão) ou 'json' (opcional)

**Retorna:** Object with content containing search index details.`,
        inputSchema: GetSearchIndexSchema.shape,
      },
      async (params: z.infer<typeof GetSearchIndexSchema>) => {
        const validatedParams = GetSearchIndexSchema.parse(params);
        return await this.getSearchIndex(validatedParams.indexId, validatedParams.output || 'json');
      }
    );

    const RebuildSearchIndexSchema = z.object({
      indexId: z.string().describe('Search index ID to rebuild'),
      output: z.enum(['markdown', 'json']).optional().describe('Formato de saída'),
    });

    // Rebuild Search Index
    server.registerTool(
      'datacenter-rebuild-search-index',
      {
        description: `Rebuild search index in Bitbucket Data Center.

**Funcionalidades:**
- Rebuild search index
- Force reindexing
- Update index

**Parâmetros:**
- \`indexId\`: Search index ID to rebuild
- \`output\`: Formato de saída - 'markdown' (padrão) ou 'json' (opcional)

**Retorna:** Object with content containing rebuild result.`,
        inputSchema: RebuildSearchIndexSchema.shape,
      },
      async (params: z.infer<typeof RebuildSearchIndexSchema>) => {
        const validatedParams = RebuildSearchIndexSchema.parse(params);
        return await this.rebuildSearchIndex(
          validatedParams.indexId,
          validatedParams.output || 'json'
        );
      }
    );

    const StopSearchIndexSchema = z.object({
      indexId: z.string().describe('Search index ID to stop'),
      output: z.enum(['markdown', 'json']).optional().describe('Formato de saída'),
    });

    // Stop Search Index
    server.registerTool(
      'datacenter-stop-search-index',
      {
        description: `Stop search index in Bitbucket Data Center.

**Funcionalidades:**
- Stop search index
- Pause indexing
- Halt operations

**Parâmetros:**
- \`indexId\`: Search index ID to stop
- \`output\`: Formato de saída - 'markdown' (padrão) ou 'json' (opcional)

**Retorna:** Object with content containing stop result.`,
        inputSchema: StopSearchIndexSchema.shape,
      },
      async (params: z.infer<typeof StopSearchIndexSchema>) => {
        const validatedParams = StopSearchIndexSchema.parse(params);
        return await this.stopSearchIndex(
          validatedParams.indexId,
          validatedParams.output || 'json'
        );
      }
    );

    const GetSearchHistorySchema = z.object({
      output: z.enum(['markdown', 'json']).optional().describe('Formato de saída'),
    });

    // Get Search History
    server.registerTool(
      'datacenter-get-search-history',
      {
        description: `Get search history from Bitbucket Data Center.

**Funcionalidades:**
- Get search history
- Historical queries
- Usage patterns

**Parâmetros:**
- \`output\`: Formato de saída - 'markdown' (padrão) ou 'json' (opcional)

**Retorna:** Object with content containing search history.`,
        inputSchema: GetSearchHistorySchema.shape,
      },
      async (params: z.infer<typeof GetSearchHistorySchema>) => {
        const validatedParams = GetSearchHistorySchema.parse(params);
        return await this.getSearchHistory(validatedParams.output || 'json');
      }
    );

    const GetUserSearchHistorySchema = z.object({
      userId: z.number().describe('User ID'),
      output: z.enum(['markdown', 'json']).optional().describe('Formato de saída'),
    });

    // Get User Search History
    server.registerTool(
      'datacenter-get-user-search-history',
      {
        description: `Get user search history from Bitbucket Data Center.

**Funcionalidades:**
- Get user search history
- User-specific queries
- Personal usage patterns

**Parâmetros:**
- \`userId\`: User ID
- \`output\`: Formato de saída - 'markdown' (padrão) ou 'json' (opcional)

**Retorna:** Object with content containing user search history.`,
        inputSchema: GetUserSearchHistorySchema.shape,
      },
      async (params: z.infer<typeof GetUserSearchHistorySchema>) => {
        const validatedParams = GetUserSearchHistorySchema.parse(params);
        return await this.getUserSearchHistory(
          validatedParams.userId,
          validatedParams.output || 'json'
        );
      }
    );

    const ClearSearchHistorySchema = z.object({
      output: z.enum(['markdown', 'json']).optional().describe('Formato de saída'),
    });

    // Clear Search History
    server.registerTool(
      'datacenter-clear-search-history',
      {
        description: `Clear search history in Bitbucket Data Center.

**Funcionalidades:**
- Clear search history
- Remove all queries
- Reset history

**Parâmetros:**
- \`output\`: Formato de saída - 'markdown' (padrão) ou 'json' (opcional)

**Retorna:** Object with content containing clear result.`,
        inputSchema: ClearSearchHistorySchema.shape,
      },
      async (params: z.infer<typeof ClearSearchHistorySchema>) => {
        const validatedParams = ClearSearchHistorySchema.parse(params);
        return await this.clearSearchHistory(validatedParams.output || 'json');
      }
    );

    const ClearUserSearchHistorySchema = z.object({
      userId: z.number().describe('User ID'),
      output: z.enum(['markdown', 'json']).optional().describe('Formato de saída'),
    });

    // Clear User Search History
    server.registerTool(
      'datacenter-clear-user-search-history',
      {
        description: `Clear user search history in Bitbucket Data Center.

**Funcionalidades:**
- Clear user search history
- Remove user queries
- Reset user history

**Parâmetros:**
- \`userId\`: User ID
- \`output\`: Formato de saída - 'markdown' (padrão) ou 'json' (opcional)

**Retorna:** Object with content containing clear result.`,
        inputSchema: ClearUserSearchHistorySchema.shape,
      },
      async (params: z.infer<typeof ClearUserSearchHistorySchema>) => {
        const validatedParams = ClearUserSearchHistorySchema.parse(params);
        return await this.clearUserSearchHistory(
          validatedParams.userId,
          validatedParams.output || 'json'
        );
      }
    );

    const GetSearchAnalyticsSchema = z.object({
      output: z.enum(['markdown', 'json']).optional().describe('Formato de saída'),
    });

    // Get Search Analytics
    server.registerTool(
      'datacenter-get-search-analytics',
      {
        description: `Get search analytics from Bitbucket Data Center.

**Funcionalidades:**
- Get search analytics
- Usage statistics
- Performance metrics

**Parâmetros:**
- \`output\`: Formato de saída - 'markdown' (padrão) ou 'json' (opcional)

**Retorna:** Object with content containing search analytics.`,
        inputSchema: GetSearchAnalyticsSchema.shape,
      },
      async (params: z.infer<typeof GetSearchAnalyticsSchema>) => {
        const validatedParams = GetSearchAnalyticsSchema.parse(params);
        return await this.getSearchAnalytics(validatedParams.output || 'json');
      }
    );

    const GetQueryAnalyticsSchema = z.object({
      query: z.string().describe('Search query'),
      output: z.enum(['markdown', 'json']).optional().describe('Formato de saída'),
    });

    // Get Query Analytics
    server.registerTool(
      'datacenter-get-query-analytics',
      {
        title: 'Obter Análise de Query',
        description: `Obter análise de query do Bitbucket Data Center.

**Funcionalidades:**
- Obter análise de query
- Estatísticas de query
- Dados de performance

**Parâmetros:**
- \`query\`: Query de busca
- \`output\`: Formato de saída - 'markdown' (padrão) ou 'json' (opcional)

**Retorna:** Objeto com content contendo análise de query.`,
        inputSchema: GetQueryAnalyticsSchema.shape,
      },
      async (params: z.infer<typeof GetQueryAnalyticsSchema>) => {
        const validatedParams = GetQueryAnalyticsSchema.parse(params);
        return await this.getQueryAnalytics(
          validatedParams.query,
          validatedParams.output || 'json'
        );
      }
    );

    const GetSearchStatisticsSchema = z.object({
      output: z.enum(['markdown', 'json']).optional().describe('Formato de saída'),
    });

    // Get Search Statistics
    server.registerTool(
      'datacenter-get-search-statistics',
      {
        title: 'Obter Estatísticas de Busca',
        description: `Obter estatísticas de busca do Bitbucket Data Center.

**Funcionalidades:**
- Obter estatísticas de busca
- Métricas gerais
- Performance do sistema

**Parâmetros:**
- \`output\`: Formato de saída - 'markdown' (padrão) ou 'json' (opcional)

**Retorna:** Objeto com content contendo estatísticas de busca.`,
        inputSchema: GetSearchStatisticsSchema.shape,
      },
      async (params: z.infer<typeof GetSearchStatisticsSchema>) => {
        const validatedParams = GetSearchStatisticsSchema.parse(params);
        return await this.getSearchStatistics(validatedParams.output || 'json');
      }
    );

    const GetSearchStatisticsForRangeSchema = z.object({
      startDate: z.string().describe('Start date (ISO format)'),
      endDate: z.string().describe('End date (ISO format)'),
      output: z.enum(['markdown', 'json']).optional().describe('Formato de saída'),
    });

    // Get Search Statistics for Range
    server.registerTool(
      'datacenter-get-search-statistics-for-range',
      {
        title: 'Obter Estatísticas de Busca por Período',
        description: `Obter estatísticas de busca por período do Bitbucket Data Center.

**Funcionalidades:**
- Obter estatísticas de busca por período
- Métricas baseadas em data
- Análise de período de tempo

**Parâmetros:**
- \`startDate\`: Data de início (formato ISO)
- \`endDate\`: Data de fim (formato ISO)
- \`output\`: Formato de saída - 'markdown' (padrão) ou 'json' (opcional)

**Retorna:** Objeto com content contendo estatísticas de busca por período.`,
        inputSchema: GetSearchStatisticsForRangeSchema.shape,
      },
      async (params: z.infer<typeof GetSearchStatisticsForRangeSchema>) => {
        const validatedParams = GetSearchStatisticsForRangeSchema.parse(params);
        return await this.getSearchStatisticsForRange(
          validatedParams.startDate,
          validatedParams.endDate,
          validatedParams.output || 'json'
        );
      }
    );

    const RecordSearchAnalyticsSchema = z.object({
      analytics: z.any().describe('Search analytics data to record'),
      output: z.enum(['markdown', 'json']).optional().describe('Formato de saída'),
    });

    // Record Search Analytics
    server.registerTool(
      'datacenter-record-search-analytics',
      {
        title: 'Registrar Análise de Busca',
        description: `Registrar análise de busca no Bitbucket Data Center.

**Funcionalidades:**
- Registrar análise de busca
- Log de dados de uso
- Rastrear métricas

**Parâmetros:**
- \`analytics\`: Dados de análise de busca para registrar
- \`output\`: Formato de saída - 'markdown' (padrão) ou 'json' (opcional)

**Retorna:** Objeto com content contendo resultado do registro.`,
        inputSchema: RecordSearchAnalyticsSchema.shape,
      },
      async (params: z.infer<typeof RecordSearchAnalyticsSchema>) => {
        const validatedParams = RecordSearchAnalyticsSchema.parse(params);
        return await this.recordSearchAnalytics(
          validatedParams.analytics,
          validatedParams.output || 'json'
        );
      }
    );

    registerLogger.info('Successfully registered all data center search tools');
  }
}
