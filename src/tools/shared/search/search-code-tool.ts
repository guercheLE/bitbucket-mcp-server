/**
 * MCP Tool: Search Code
 * Provides code search functionality through MCP interface
 */

import { z } from 'zod';
import { SearchCoordinatorService } from '../../../services/search-coordinator-service';
import { ServerInfo } from '../../../types/index';
import { logger } from '../../../utils/logger';

// ============================================================================
// Schema Definitions
// ============================================================================

/**
 * Input schema for code search
 */
export const SearchCodeInputSchema = z.object({
  query: z.string().min(1).max(500).describe('Search query for code'),
  projectKey: z.string().optional().describe('Project key to filter code search'),
  workspace: z.string().optional().describe('Workspace to filter code search (Cloud)'),
  repositorySlug: z.string().optional().describe('Repository to search in'),
  language: z.string().optional().describe('Programming language filter'),
  fileExtension: z.string().optional().describe('File extension filter'),
  filePath: z.string().optional().describe('File path filter'),
  branch: z.string().optional().describe('Branch to search in'),
  sortBy: z.enum(['relevance', 'filename', 'path', 'size', 'lastModified']).optional().describe('Sort field'),
  sortOrder: z.enum(['asc', 'desc']).optional().describe('Sort order'),
  page: z.number().int().min(0).optional().describe('Page number (0-based)'),
  limit: z.number().int().min(1).max(100).optional().describe('Results per page'),
  output: z.enum(['markdown', 'json']).optional().default('json').describe('Output format'),
});

export type SearchCodeInput = z.infer<typeof SearchCodeInputSchema>;

// ============================================================================
// Tool Implementation
// ============================================================================

/**
 * MCP Tool for searching code
 */
export class SearchCodeTool {
  constructor(
    private searchService: SearchCoordinatorService,
    private serverInfo: ServerInfo
  ) {}

  /**
   * Tool metadata
   */
  static get metadata() {
    return {
      name: 'mcp_bitbucket_search_code',
      description: 'Busca código no Bitbucket Data Center.\n\n' +
        '**Funcionalidades:**\n' +
        '- Busca de código\n' +
        '- Filtros por linguagem e arquivo\n' +
        '- Resultados paginados\n\n' +
        '**Parâmetros:**\n' +
        '- `query`: Query de busca para código\n' +
        '- `projectKey`: Chave do projeto para filtrar resultados (opcional)\n' +
        '- `workspace`: Workspace para filtrar resultados (Cloud, opcional)\n' +
        '- `repositorySlug`: Slug do repositório para filtrar resultados (opcional)\n' +
        '- `language`: Filtro por linguagem de programação (opcional)\n' +
        '- `fileExtension`: Filtro por extensão de arquivo (opcional)\n' +
        '- `filePath`: Filtro por caminho de arquivo (opcional)\n' +
        '- `branch`: Branch para buscar (opcional)\n' +
        '- `sortBy`: Campo de ordenação (opcional)\n' +
        '- `sortOrder`: Ordem de classificação (opcional)\n' +
        '- `page`: Número da página para paginação (opcional)\n' +
        '- `limit`: Número máximo de resultados por página (opcional)\n' +
        '- `output`: Formato de saída - \'markdown\' ou \'json\' (padrão)\n\n' +
        '**Retorna:** Objeto com content contendo array de objetos com type: \'text\' e text com os resultados da busca.',
      inputSchema: SearchCodeInputSchema,
    };
  }

  /**
   * Executes the code search
   */
  async execute(input: SearchCodeInput) {
    try {
      logger.debug('Executing code search', {
        query: input.query,
        language: input.language,
        repositorySlug: input.repositorySlug,
      });

      // Validate server info
      if (!this.serverInfo) {
        throw new Error('Server information not available');
      }

      // Execute search
      const results = await this.searchService.searchCode(
        this.serverInfo,
        {
          query: input.query,
          projectKey: input.projectKey,
          workspace: input.workspace,
          repositorySlug: input.repositorySlug,
          language: input.language,
          fileExtension: input.fileExtension,
          filePath: input.filePath,
          branch: input.branch,
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
      logger.error('Code search failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: input.query,
      });

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return {
        content: [{
          type: 'text' as const,
          text: input.output === 'markdown' 
            ? `# Erro na Busca de Código\n\n**Erro:** ${errorMessage}`
            : JSON.stringify({ error: errorMessage, query: input.query }, null, 2)
        }]
      };
    }
  }

  /**
   * Formats output as JSON
   */
  private formatJsonOutput(results: any[], input: SearchCodeInput) {
    const response = {
      query: input.query,
      filters: {
        projectKey: input.projectKey,
        workspace: input.workspace,
        repositorySlug: input.repositorySlug,
        language: input.language,
        fileExtension: input.fileExtension,
        filePath: input.filePath,
        branch: input.branch,
      },
      pagination: {
        page: input.page || 0,
        limit: input.limit || 25,
        totalResults: results.length,
      },
      sorting: {
        sortBy: input.sortBy || 'relevance',
        sortOrder: input.sortOrder || 'desc',
      },
      results: results.map(code => ({
        id: code.id,
        title: code.title,
        description: code.description,
        url: code.url,
        metadata: code.metadata,
        relevanceScore: code.relevanceScore,
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
  private formatMarkdownOutput(results: any[], input: SearchCodeInput) {
    let markdown = `# Busca de Código\n\n`;
    markdown += `**Query:** ${input.query}\n\n`;

    // Add filters if present
    const filters = [];
    if (input.projectKey) filters.push(`Projeto: ${input.projectKey}`);
    if (input.workspace) filters.push(`Workspace: ${input.workspace}`);
    if (input.repositorySlug) filters.push(`Repositório: ${input.repositorySlug}`);
    if (input.language) filters.push(`Linguagem: ${input.language}`);
    if (input.fileExtension) filters.push(`Extensão: ${input.fileExtension}`);
    if (input.filePath) filters.push(`Caminho: ${input.filePath}`);
    if (input.branch) filters.push(`Branch: ${input.branch}`);
    
    if (filters.length > 0) {
      markdown += `**Filtros:** ${filters.join(' • ')}\n\n`;
    }

    // Add pagination info
    markdown += `**Resultados:** ${results.length} arquivos de código encontrados\n`;
    markdown += `**Página:** ${(input.page || 0) + 1} (${input.limit || 25} por página)\n\n`;

    // Add results
    if (results.length === 0) {
      markdown += `*Nenhum arquivo de código encontrado para esta busca.*\n`;
    } else {
      markdown += `## Arquivos Encontrados\n\n`;
      
      results.forEach((code, index) => {
        markdown += `### ${index + 1}. ${code.title}\n\n`;
        
        if (code.description && code.description !== code.title) {
          markdown += `**Descrição:** ${code.description}\n\n`;
        }
        
        markdown += `**URL:** [${code.url}](${code.url})\n\n`;
        
        if (code.metadata) {
          const meta = code.metadata;
          const metaItems = [];
          
          if (meta.projectKey) metaItems.push(`Projeto: ${meta.projectKey}`);
          if (meta.workspace) metaItems.push(`Workspace: ${meta.workspace}`);
          if (meta.repositorySlug) metaItems.push(`Repositório: ${meta.repositorySlug}`);
          if (meta.filePath) metaItems.push(`Caminho: ${meta.filePath}`);
          if (meta.language) metaItems.push(`Linguagem: ${meta.language}`);
          if (meta.fileExtension) metaItems.push(`Extensão: .${meta.fileExtension}`);
          if (meta.fileSize !== undefined) {
            const sizeKB = Math.round(meta.fileSize / 1024);
            metaItems.push(`Tamanho: ${sizeKB} KB`);
          }
          if (meta.branch) metaItems.push(`Branch: ${meta.branch}`);
          if (meta.lastModified) metaItems.push(`Modificado: ${new Date(meta.lastModified).toLocaleDateString('pt-BR')}`);
          
          if (metaItems.length > 0) {
            markdown += `**Detalhes:** ${metaItems.join(' • ')}\n\n`;
          }
          
          // Show code matches if available
          if (meta.matches && meta.matches.length > 0) {
            markdown += `**Matches encontrados:**\n\n`;
            meta.matches.slice(0, 3).forEach((match: any) => {
              markdown += `- Linha ${match.lineNumber}: \`${match.content.trim()}\`\n`;
            });
            if (meta.matches.length > 3) {
              markdown += `- ... e mais ${meta.matches.length - 3} matches\n`;
            }
            markdown += `\n`;
          }
        }
        
        if (code.relevanceScore !== undefined) {
          markdown += `**Relevância:** ${(code.relevanceScore * 100).toFixed(1)}%\n\n`;
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
 * Creates a code search tool instance
 */
export function createSearchCodeTool(
  searchService: SearchCoordinatorService,
  serverInfo: ServerInfo
) {
  return new SearchCodeTool(searchService, serverInfo);
}

// ============================================================================
// Export
// ============================================================================

export default SearchCodeTool;
