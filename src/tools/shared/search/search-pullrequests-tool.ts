/**
 * MCP Tool: Search Pull Requests
 * Provides pull request search functionality through MCP interface
 */

import { z } from 'zod';
import { SearchCoordinatorService } from '../../../services/search-coordinator-service';
import { ServerInfo } from '../../../types/index';
import { logger } from '../../../utils/logger';

// ============================================================================
// Schema Definitions
// ============================================================================

/**
 * Input schema for pull request search
 */
export const SearchPullRequestsInputSchema = z.object({
  query: z.string().min(1).max(500).describe('Search query for pull requests'),
  projectKey: z.string().optional().describe('Project key to filter pull requests'),
  workspace: z.string().optional().describe('Workspace to filter pull requests (Cloud)'),
  repositorySlug: z.string().optional().describe('Repository to search in'),
  author: z.string().optional().describe('Pull request author filter'),
  reviewer: z.string().optional().describe('Pull request reviewer filter'),
  state: z.string().optional().describe('Pull request state (OPEN, MERGED, DECLINED, SUPERSEDED)'),
  sourceBranch: z.string().optional().describe('Source branch filter'),
  targetBranch: z.string().optional().describe('Target branch filter'),
  fromDate: z.string().optional().describe('Start date for PR range (ISO format)'),
  toDate: z.string().optional().describe('End date for PR range (ISO format)'),
  sortBy: z.enum(['updatedDate', 'createdDate', 'title', 'author', 'state']).optional().describe('Sort field'),
  sortOrder: z.enum(['asc', 'desc']).optional().describe('Sort order'),
  page: z.number().int().min(0).optional().describe('Page number (0-based)'),
  limit: z.number().int().min(1).max(100).optional().describe('Results per page'),
  output: z.enum(['markdown', 'json']).optional().default('json').describe('Output format'),
});

export type SearchPullRequestsInput = z.infer<typeof SearchPullRequestsInputSchema>;

// ============================================================================
// Tool Implementation
// ============================================================================

/**
 * MCP Tool for searching pull requests
 */
export class SearchPullRequestsTool {
  constructor(
    private searchService: SearchCoordinatorService,
    private serverInfo: ServerInfo
  ) {}

  /**
   * Tool metadata
   */
  static get metadata() {
    return {
      name: 'mcp_bitbucket_search_pull_requests',
      description: 'Busca pull requests no Bitbucket Data Center.\n\n' +
        '**Funcionalidades:**\n' +
        '- Busca de pull requests\n' +
        '- Filtros por estado e autor\n' +
        '- Resultados paginados\n\n' +
        '**Parâmetros:**\n' +
        '- `query`: Query de busca para pull requests\n' +
        '- `projectKey`: Chave do projeto para filtrar resultados (opcional)\n' +
        '- `workspace`: Workspace para filtrar resultados (Cloud, opcional)\n' +
        '- `repositorySlug`: Slug do repositório para filtrar resultados (opcional)\n' +
        '- `author`: Filtro por autor do pull request (opcional)\n' +
        '- `reviewer`: Filtro por revisor (opcional)\n' +
        '- `state`: Estado do pull request (OPEN, MERGED, DECLINED, SUPERSEDED, opcional)\n' +
        '- `sourceBranch`: Filtro por branch de origem (opcional)\n' +
        '- `targetBranch`: Filtro por branch de destino (opcional)\n' +
        '- `fromDate`: Data de início para intervalo de PRs (formato ISO, opcional)\n' +
        '- `toDate`: Data de fim para intervalo de PRs (formato ISO, opcional)\n' +
        '- `sortBy`: Campo de ordenação (opcional)\n' +
        '- `sortOrder`: Ordem de classificação (opcional)\n' +
        '- `page`: Número da página para paginação (opcional)\n' +
        '- `limit`: Número máximo de resultados por página (opcional)\n' +
        '- `output`: Formato de saída - \'markdown\' ou \'json\' (padrão)\n\n' +
        '**Retorna:** Objeto com content contendo array de objetos com type: \'text\' e text com os resultados da busca.',
      inputSchema: SearchPullRequestsInputSchema,
    };
  }

  /**
   * Executes the pull request search
   */
  async execute(input: SearchPullRequestsInput) {
    try {
      logger.debug('Executing pull request search', {
        query: input.query,
        author: input.author,
        state: input.state,
      });

      // Validate server info
      if (!this.serverInfo) {
        throw new Error('Server information not available');
      }

      // Execute search
      const results = await this.searchService.searchPullRequests(
        this.serverInfo,
        {
          query: input.query,
          projectKey: input.projectKey,
          workspace: input.workspace,
          repositorySlug: input.repositorySlug,
          author: input.author,
          reviewer: input.reviewer,
          state: input.state,
          sourceBranch: input.sourceBranch,
          targetBranch: input.targetBranch,
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
      logger.error('Pull request search failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: input.query,
      });

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return {
        content: [{
          type: 'text' as const,
          text: input.output === 'markdown' 
            ? `# Erro na Busca de Pull Requests\n\n**Erro:** ${errorMessage}`
            : JSON.stringify({ error: errorMessage, query: input.query }, null, 2)
        }]
      };
    }
  }

  /**
   * Formats output as JSON
   */
  private formatJsonOutput(results: any[], input: SearchPullRequestsInput) {
    const response = {
      query: input.query,
      filters: {
        projectKey: input.projectKey,
        workspace: input.workspace,
        repositorySlug: input.repositorySlug,
        author: input.author,
        reviewer: input.reviewer,
        state: input.state,
        sourceBranch: input.sourceBranch,
        targetBranch: input.targetBranch,
        fromDate: input.fromDate,
        toDate: input.toDate,
      },
      pagination: {
        page: input.page || 0,
        limit: input.limit || 25,
        totalResults: results.length,
      },
      sorting: {
        sortBy: input.sortBy || 'updatedDate',
        sortOrder: input.sortOrder || 'desc',
      },
      results: results.map(pr => ({
        id: pr.id,
        title: pr.title,
        description: pr.description,
        url: pr.url,
        metadata: pr.metadata,
        relevanceScore: pr.relevanceScore,
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
  private formatMarkdownOutput(results: any[], input: SearchPullRequestsInput) {
    let markdown = `# Busca de Pull Requests\n\n`;
    markdown += `**Query:** ${input.query}\n\n`;

    // Add filters if present
    const filters = [];
    if (input.projectKey) filters.push(`Projeto: ${input.projectKey}`);
    if (input.workspace) filters.push(`Workspace: ${input.workspace}`);
    if (input.repositorySlug) filters.push(`Repositório: ${input.repositorySlug}`);
    if (input.author) filters.push(`Autor: ${input.author}`);
    if (input.reviewer) filters.push(`Revisor: ${input.reviewer}`);
    if (input.state) filters.push(`Estado: ${input.state}`);
    if (input.sourceBranch) filters.push(`Branch origem: ${input.sourceBranch}`);
    if (input.targetBranch) filters.push(`Branch destino: ${input.targetBranch}`);
    if (input.fromDate) filters.push(`De: ${new Date(input.fromDate).toLocaleDateString('pt-BR')}`);
    if (input.toDate) filters.push(`Até: ${new Date(input.toDate).toLocaleDateString('pt-BR')}`);
    
    if (filters.length > 0) {
      markdown += `**Filtros:** ${filters.join(' • ')}\n\n`;
    }

    // Add pagination info
    markdown += `**Resultados:** ${results.length} pull requests encontrados\n`;
    markdown += `**Página:** ${(input.page || 0) + 1} (${input.limit || 25} por página)\n\n`;

    // Add results
    if (results.length === 0) {
      markdown += `*Nenhum pull request encontrado para esta busca.*\n`;
    } else {
      markdown += `## Pull Requests Encontrados\n\n`;
      
      results.forEach((pr, index) => {
        markdown += `### ${index + 1}. ${pr.title}\n\n`;
        
        if (pr.description && pr.description !== pr.title) {
          // Show first few lines of PR description
          const lines = pr.description.split('\n');
          const preview = lines.slice(0, 2).join('\n');
          if (lines.length > 2) {
            markdown += `**Descrição:**\n\`\`\`\n${preview}\n...\n\`\`\`\n\n`;
          } else {
            markdown += `**Descrição:**\n\`\`\`\n${preview}\n\`\`\`\n\n`;
          }
        }
        
        markdown += `**URL:** [${pr.url}](${pr.url})\n\n`;
        
        if (pr.metadata) {
          const meta = pr.metadata;
          const metaItems = [];
          
          if (meta.projectKey) metaItems.push(`Projeto: ${meta.projectKey}`);
          if (meta.workspace) metaItems.push(`Workspace: ${meta.workspace}`);
          if (meta.repositorySlug) metaItems.push(`Repositório: ${meta.repositorySlug}`);
          if (meta.author) metaItems.push(`Autor: ${meta.author}`);
          if (meta.reviewer) metaItems.push(`Revisor: ${meta.reviewer}`);
          if (meta.state) metaItems.push(`Estado: ${meta.state}`);
          if (meta.sourceBranch) metaItems.push(`De: ${meta.sourceBranch}`);
          if (meta.targetBranch) metaItems.push(`Para: ${meta.targetBranch}`);
          if (meta.createdDate) metaItems.push(`Criado: ${new Date(meta.createdDate).toLocaleDateString('pt-BR')}`);
          if (meta.updatedDate) metaItems.push(`Atualizado: ${new Date(meta.updatedDate).toLocaleDateString('pt-BR')}`);
          if (meta.commentCount !== undefined) metaItems.push(`Comentários: ${meta.commentCount}`);
          if (meta.taskCount !== undefined) metaItems.push(`Tarefas: ${meta.taskCount}`);
          
          if (metaItems.length > 0) {
            markdown += `**Detalhes:** ${metaItems.join(' • ')}\n\n`;
          }
        }
        
        if (pr.relevanceScore !== undefined) {
          markdown += `**Relevância:** ${(pr.relevanceScore * 100).toFixed(1)}%\n\n`;
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
 * Creates a pull request search tool instance
 */
export function createSearchPullRequestsTool(
  searchService: SearchCoordinatorService,
  serverInfo: ServerInfo
) {
  return new SearchPullRequestsTool(searchService, serverInfo);
}

// ============================================================================
// Export
// ============================================================================

export default SearchPullRequestsTool;
