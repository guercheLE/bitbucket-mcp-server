/**
 * MCP Tool: Search Commits
 * Provides commit search functionality through MCP interface
 */

import { z } from 'zod';
import { SearchCoordinatorService } from '../../../services/search-coordinator-service.js';
import { ServerInfo } from '../../../types/index.js';
import { logger } from '../../../utils/logger.js';

// ============================================================================
// Schema Definitions
// ============================================================================

/**
 * Input schema for commit search
 */
export const SearchCommitsInputSchema = z.object({
  query: z.string().min(1).max(500).describe('Search query for commits'),
  projectKey: z.string().optional().describe('Project key to filter commits'),
  workspace: z.string().optional().describe('Workspace to filter commits (Cloud)'),
  repositorySlug: z.string().optional().describe('Repository to search in'),
  author: z.string().optional().describe('Commit author filter'),
  committer: z.string().optional().describe('Commit committer filter'),
  fromDate: z.string().optional().describe('Start date for commit range (ISO format)'),
  toDate: z.string().optional().describe('End date for commit range (ISO format)'),
  sortBy: z.enum(['commitDate', 'author', 'message']).optional().describe('Sort field'),
  sortOrder: z.enum(['asc', 'desc']).optional().describe('Sort order'),
  page: z.number().int().min(0).optional().describe('Page number (0-based)'),
  limit: z.number().int().min(1).max(100).optional().describe('Results per page'),
  output: z.enum(['markdown', 'json']).optional().default('json').describe('Output format'),
});

export type SearchCommitsInput = z.infer<typeof SearchCommitsInputSchema>;

// ============================================================================
// Tool Implementation
// ============================================================================

/**
 * MCP Tool for searching commits
 */
export class SearchCommitsTool {
  constructor(
    private searchService: SearchCoordinatorService,
    private serverInfo: ServerInfo
  ) {}

  /**
   * Tool metadata
   */
  static get metadata() {
    return {
      name: 'mcp_bitbucket_search_commits',
      description: 'Busca commits no Bitbucket Data Center.\n\n' +
        '**Funcionalidades:**\n' +
        '- Busca de commits\n' +
        '- Filtros por autor e data\n' +
        '- Resultados paginados\n\n' +
        '**Parâmetros:**\n' +
        '- `query`: Query de busca para commits\n' +
        '- `projectKey`: Chave do projeto para filtrar resultados (opcional)\n' +
        '- `workspace`: Workspace para filtrar resultados (Cloud, opcional)\n' +
        '- `repositorySlug`: Slug do repositório para filtrar resultados (opcional)\n' +
        '- `author`: Filtro por autor do commit (opcional)\n' +
        '- `committer`: Filtro por committer (opcional)\n' +
        '- `fromDate`: Data de início para intervalo de commits (formato ISO, opcional)\n' +
        '- `toDate`: Data de fim para intervalo de commits (formato ISO, opcional)\n' +
        '- `sortBy`: Campo de ordenação (opcional)\n' +
        '- `sortOrder`: Ordem de classificação (opcional)\n' +
        '- `page`: Número da página para paginação (opcional)\n' +
        '- `limit`: Número máximo de resultados por página (opcional)\n' +
        '- `output`: Formato de saída - \'markdown\' ou \'json\' (padrão)\n\n' +
        '**Retorna:** Objeto com content contendo array de objetos com type: \'text\' e text com os resultados da busca.',
      inputSchema: SearchCommitsInputSchema,
    };
  }

  /**
   * Executes the commit search
   */
  async execute(input: SearchCommitsInput) {
    try {
      logger.debug('Executing commit search', {
        query: input.query,
        author: input.author,
        repositorySlug: input.repositorySlug,
      });

      // Validate server info
      if (!this.serverInfo) {
        throw new Error('Server information not available');
      }

      // Execute search
      const results = await this.searchService.searchCommits(
        this.serverInfo,
        {
          query: input.query,
          projectKey: input.projectKey,
          workspace: input.workspace,
          repositorySlug: input.repositorySlug,
          author: input.author,
          committer: input.committer,
          fromDate: input.fromDate,
          toDate: input.toDate,
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
      logger.error('Commit search failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: input.query,
      });

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return {
        content: [{
          type: 'text' as const,
          text: input.output === 'markdown' 
            ? `# Erro na Busca de Commits\n\n**Erro:** ${errorMessage}`
            : JSON.stringify({ error: errorMessage, query: input.query }, null, 2)
        }]
      };
    }
  }

  /**
   * Formats output as JSON
   */
  private formatJsonOutput(results: any[], input: SearchCommitsInput) {
    const response = {
      query: input.query,
      filters: {
        projectKey: input.projectKey,
        workspace: input.workspace,
        repositorySlug: input.repositorySlug,
        author: input.author,
        committer: input.committer,
        fromDate: input.fromDate,
        toDate: input.toDate,
      },
      pagination: {
        page: input.page || 0,
        limit: input.limit || 25,
        totalResults: results.length,
      },
      sorting: {
        sortBy: input.sortBy || 'commitDate',
        sortOrder: input.sortOrder || 'desc',
      },
      results: results.map(commit => ({
        id: commit.id,
        title: commit.title,
        description: commit.description,
        url: commit.url,
        metadata: commit.metadata,
        relevanceScore: commit.relevanceScore,
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
  private formatMarkdownOutput(results: any[], input: SearchCommitsInput) {
    let markdown = `# Busca de Commits\n\n`;
    markdown += `**Query:** ${input.query}\n\n`;

    // Add filters if present
    const filters = [];
    if (input.projectKey) filters.push(`Projeto: ${input.projectKey}`);
    if (input.workspace) filters.push(`Workspace: ${input.workspace}`);
    if (input.repositorySlug) filters.push(`Repositório: ${input.repositorySlug}`);
    if (input.author) filters.push(`Autor: ${input.author}`);
    if (input.committer) filters.push(`Committer: ${input.committer}`);
    if (input.fromDate) filters.push(`De: ${new Date(input.fromDate).toLocaleDateString('pt-BR')}`);
    if (input.toDate) filters.push(`Até: ${new Date(input.toDate).toLocaleDateString('pt-BR')}`);
    
    if (filters.length > 0) {
      markdown += `**Filtros:** ${filters.join(' • ')}\n\n`;
    }

    // Add pagination info
    markdown += `**Resultados:** ${results.length} commits encontrados\n`;
    markdown += `**Página:** ${(input.page || 0) + 1} (${input.limit || 25} por página)\n\n`;

    // Add results
    if (results.length === 0) {
      markdown += `*Nenhum commit encontrado para esta busca.*\n`;
    } else {
      markdown += `## Commits Encontrados\n\n`;
      
      results.forEach((commit, index) => {
        markdown += `### ${index + 1}. ${commit.title}\n\n`;
        
        if (commit.description && commit.description !== commit.title) {
          // Show first few lines of commit message
          const lines = commit.description.split('\n');
          const preview = lines.slice(0, 3).join('\n');
          if (lines.length > 3) {
            markdown += `**Mensagem:**\n\`\`\`\n${preview}\n...\n\`\`\`\n\n`;
          } else {
            markdown += `**Mensagem:**\n\`\`\`\n${preview}\n\`\`\`\n\n`;
          }
        }
        
        markdown += `**URL:** [${commit.url}](${commit.url})\n\n`;
        
        if (commit.metadata) {
          const meta = commit.metadata;
          const metaItems = [];
          
          if (meta.projectKey) metaItems.push(`Projeto: ${meta.projectKey}`);
          if (meta.workspace) metaItems.push(`Workspace: ${meta.workspace}`);
          if (meta.repositorySlug) metaItems.push(`Repositório: ${meta.repositorySlug}`);
          if (meta.author) metaItems.push(`Autor: ${meta.author}`);
          if (meta.committer && meta.committer !== meta.author) metaItems.push(`Committer: ${meta.committer}`);
          if (meta.commitDate) metaItems.push(`Data: ${new Date(meta.commitDate).toLocaleString('pt-BR')}`);
          
          if (metaItems.length > 0) {
            markdown += `**Detalhes:** ${metaItems.join(' • ')}\n\n`;
          }
        }
        
        if (commit.relevanceScore !== undefined) {
          markdown += `**Relevância:** ${(commit.relevanceScore * 100).toFixed(1)}%\n\n`;
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
 * Creates a commit search tool instance
 */
export function createSearchCommitsTool(
  searchService: SearchCoordinatorService,
  serverInfo: ServerInfo
) {
  return new SearchCommitsTool(searchService, serverInfo);
}

// ============================================================================
// Export
// ============================================================================

export default SearchCommitsTool;
