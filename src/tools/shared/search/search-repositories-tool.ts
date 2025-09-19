/**
 * MCP Tool: Search Repositories
 * Provides repository search functionality through MCP interface
 */

import { z } from 'zod';
import { SearchCoordinatorService } from '../../../services/search-coordinator-service';
import { ServerInfo } from '../../../types/index';
import { logger } from '../../../utils/logger';

// ============================================================================
// Schema Definitions
// ============================================================================

/**
 * Input schema for repository search
 */
export const SearchRepositoriesInputSchema = z.object({
  query: z.string().min(1).max(500).describe('Search query for repositories'),
  projectKey: z.string().optional().describe('Project key to filter repositories'),
  workspace: z.string().optional().describe('Workspace to filter repositories (Cloud)'),
  language: z.string().optional().describe('Programming language filter'),
  isPublic: z.boolean().optional().describe('Filter by public/private repositories'),
  sortBy: z.enum(['name', 'lastModified', 'size', 'forks']).optional().describe('Sort field'),
  sortOrder: z.enum(['asc', 'desc']).optional().describe('Sort order'),
  page: z.number().int().min(0).optional().describe('Page number (0-based)'),
  limit: z.number().int().min(1).max(100).optional().describe('Results per page'),
  output: z.enum(['markdown', 'json']).optional().default('json').describe('Output format'),
});

export type SearchRepositoriesInput = z.infer<typeof SearchRepositoriesInputSchema>;

// ============================================================================
// Tool Implementation
// ============================================================================

/**
 * MCP Tool for searching repositories
 */
export class SearchRepositoriesTool {
  constructor(
    private searchService: SearchCoordinatorService,
    private serverInfo: ServerInfo
  ) {}

  /**
   * Tool metadata
   */
  static get metadata() {
    return {
      name: 'mcp_bitbucket_search_repositories',
      description: 'Busca repositórios no Bitbucket Data Center.\n\n' +
        '**Funcionalidades:**\n' +
        '- Busca de repositórios\n' +
        '- Filtros por projeto e linguagem\n' +
        '- Resultados paginados\n\n' +
        '**Parâmetros:**\n' +
        '- `query`: Query de busca para repositórios\n' +
        '- `projectKey`: Chave do projeto para filtrar resultados (opcional)\n' +
        '- `workspace`: Workspace para filtrar resultados (Cloud, opcional)\n' +
        '- `language`: Filtro por linguagem de programação (opcional)\n' +
        '- `isPublic`: Filtrar por repositórios públicos/privados (opcional)\n' +
        '- `sortBy`: Campo de ordenação (opcional)\n' +
        '- `sortOrder`: Ordem de classificação (opcional)\n' +
        '- `page`: Número da página para paginação (opcional)\n' +
        '- `limit`: Número máximo de resultados por página (opcional)\n' +
        '- `output`: Formato de saída - \'markdown\' ou \'json\' (padrão)\n\n' +
        '**Retorna:** Objeto com content contendo array de objetos com type: \'text\' e text com os resultados da busca.',
      inputSchema: SearchRepositoriesInputSchema,
    };
  }

  /**
   * Executes the repository search
   */
  async execute(input: SearchRepositoriesInput) {
    try {
      logger.debug('Executing repository search', {
        query: input.query,
        projectKey: input.projectKey,
        workspace: input.workspace,
      });

      // Validate server info
      if (!this.serverInfo) {
        throw new Error('Server information not available');
      }

      // Execute search
      const results = await this.searchService.searchRepositories(
        this.serverInfo,
        {
          query: input.query,
          projectKey: input.projectKey,
          workspace: input.workspace,
          language: input.language,
          isPublic: input.isPublic,
          sortBy: input.sortBy,
          sortOrder: input.sortOrder,
          page: input.page,
          limit: input.limit,
        }
      );

      // Format output
      if (input.output === 'markdown') {
        return this.formatMarkdownOutput(results, input);
      } else {
        return this.formatJsonOutput(results, input);
      }
    } catch (error) {
      logger.error('Repository search failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: input.query,
      });

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return {
        content: [{
          type: 'text' as const,
          text: input.output === 'markdown' 
            ? `# Erro na Busca de Repositórios\n\n**Erro:** ${errorMessage}`
            : JSON.stringify({ error: errorMessage, query: input.query }, null, 2)
        }]
      };
    }
  }

  /**
   * Formats output as JSON
   */
  private formatJsonOutput(results: any[], input: SearchRepositoriesInput) {
    const response = {
      query: input.query,
      filters: {
        projectKey: input.projectKey,
        workspace: input.workspace,
        language: input.language,
        isPublic: input.isPublic,
      },
      pagination: {
        page: input.page || 0,
        limit: input.limit || 25,
        totalResults: results.length,
      },
      sorting: {
        sortBy: input.sortBy || 'name',
        sortOrder: input.sortOrder || 'asc',
      },
      results: results.map(repo => ({
        id: repo.id,
        name: repo.title,
        description: repo.description,
        url: repo.url,
        metadata: repo.metadata,
        relevanceScore: repo.relevanceScore,
      })),
      timestamp: new Date().toISOString(),
    };

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(response, null, 2)
      }]
    };
  }

  /**
   * Formats output as Markdown
   */
  private formatMarkdownOutput(results: any[], input: SearchRepositoriesInput) {
    let markdown = `# Busca de Repositórios\n\n`;
    markdown += `**Query:** ${input.query}\n\n`;

    // Add filters if present
    const filters = [];
    if (input.projectKey) filters.push(`Projeto: ${input.projectKey}`);
    if (input.workspace) filters.push(`Workspace: ${input.workspace}`);
    if (input.language) filters.push(`Linguagem: ${input.language}`);
    if (input.isPublic !== undefined) filters.push(`Público: ${input.isPublic ? 'Sim' : 'Não'}`);
    
    if (filters.length > 0) {
      markdown += `**Filtros:** ${filters.join(' • ')}\n\n`;
    }

    // Add pagination info
    markdown += `**Resultados:** ${results.length} repositórios encontrados\n`;
    markdown += `**Página:** ${(input.page || 0) + 1} (${input.limit || 25} por página)\n\n`;

    // Add results
    if (results.length === 0) {
      markdown += `*Nenhum repositório encontrado para esta busca.*\n`;
    } else {
      markdown += `## Repositórios Encontrados\n\n`;
      
      results.forEach((repo, index) => {
        markdown += `### ${index + 1}. ${repo.title}\n\n`;
        
        if (repo.description) {
          markdown += `**Descrição:** ${repo.description}\n\n`;
        }
        
        markdown += `**URL:** [${repo.url}](${repo.url})\n\n`;
        
        if (repo.metadata) {
          const meta = repo.metadata;
          const metaItems = [];
          
          if (meta.projectKey) metaItems.push(`Projeto: ${meta.projectKey}`);
          if (meta.workspace) metaItems.push(`Workspace: ${meta.workspace}`);
          if (meta.language) metaItems.push(`Linguagem: ${meta.language}`);
          if (meta.isPublic !== undefined) metaItems.push(`Público: ${meta.isPublic ? 'Sim' : 'Não'}`);
          if (meta.size !== undefined) metaItems.push(`Tamanho: ${meta.size} bytes`);
          if (meta.forkCount !== undefined) metaItems.push(`Forks: ${meta.forkCount}`);
          if (meta.lastModified) metaItems.push(`Modificado: ${new Date(meta.lastModified).toLocaleDateString('pt-BR')}`);
          
          if (metaItems.length > 0) {
            markdown += `**Detalhes:** ${metaItems.join(' • ')}\n\n`;
          }
        }
        
        if (repo.relevanceScore !== undefined) {
          markdown += `**Relevância:** ${(repo.relevanceScore * 100).toFixed(1)}%\n\n`;
        }
        
        markdown += `---\n\n`;
      });
    }

    // Add footer
    markdown += `*Busca realizada em ${new Date().toLocaleString('pt-BR')}*\n`;

    return {
      content: [{
        type: 'text' as const,
        text: markdown
      }]
    };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Creates a repository search tool instance
 */
export function createSearchRepositoriesTool(
  searchService: SearchCoordinatorService,
  serverInfo: ServerInfo
) {
  return new SearchRepositoriesTool(searchService, serverInfo);
}

// ============================================================================
// Export
// ============================================================================

export default SearchRepositoriesTool;
