/**
 * MCP Tool: Search Users
 * Provides user search functionality through MCP interface
 */

import { z } from 'zod';
import { SearchCoordinatorService } from '../../../services/search-coordinator-service';
import { ServerInfo } from '../../../types/index';
import { logger } from '../../../utils/logger';

// ============================================================================
// Schema Definitions
// ============================================================================

/**
 * Input schema for user search
 */
export const SearchUsersInputSchema = z.object({
  query: z.string().min(1).max(500).describe('Search query for users'),
  workspace: z.string().optional().describe('Workspace to filter users (Cloud)'),
  role: z.string().optional().describe('User role filter'),
  permission: z.string().optional().describe('User permission filter'),
  active: z.boolean().optional().describe('Filter by active/inactive users'),
  sortBy: z.enum(['displayName', 'username', 'email', 'lastActive', 'created']).optional().describe('Sort field'),
  sortOrder: z.enum(['asc', 'desc']).optional().describe('Sort order'),
  page: z.number().int().min(0).optional().describe('Page number (0-based)'),
  limit: z.number().int().min(1).max(100).optional().describe('Results per page'),
  output: z.enum(['markdown', 'json']).optional().default('json').describe('Output format'),
});

export type SearchUsersInput = z.infer<typeof SearchUsersInputSchema>;

// ============================================================================
// Tool Implementation
// ============================================================================

/**
 * MCP Tool for searching users
 */
export class SearchUsersTool {
  constructor(
    private searchService: SearchCoordinatorService,
    private serverInfo: ServerInfo
  ) {}

  /**
   * Tool metadata
   */
  static get metadata() {
    return {
      name: 'mcp_bitbucket_search_users',
      description: 'Busca usuários no Bitbucket Data Center.\n\n' +
        '**Funcionalidades:**\n' +
        '- Busca de usuários\n' +
        '- Filtros por permissões\n' +
        '- Resultados paginados\n\n' +
        '**Parâmetros:**\n' +
        '- `query`: Query de busca para usuários\n' +
        '- `workspace`: Workspace para filtrar usuários (Cloud, opcional)\n' +
        '- `role`: Filtro por papel do usuário (opcional)\n' +
        '- `permission`: Filtro por permissão (opcional)\n' +
        '- `active`: Filtrar por usuários ativos/inativos (opcional)\n' +
        '- `sortBy`: Campo de ordenação (opcional)\n' +
        '- `sortOrder`: Ordem de classificação (opcional)\n' +
        '- `page`: Número da página para paginação (opcional)\n' +
        '- `limit`: Número máximo de resultados por página (opcional)\n' +
        '- `output`: Formato de saída - \'markdown\' ou \'json\' (padrão)\n\n' +
        '**Retorna:** Objeto com content contendo array de objetos com type: \'text\' e text com os resultados da busca.',
      inputSchema: SearchUsersInputSchema,
    };
  }

  /**
   * Executes the user search
   */
  async execute(input: SearchUsersInput) {
    try {
      logger.debug('Executing user search', {
        query: input.query,
        role: input.role,
        workspace: input.workspace,
      });

      // Validate server info
      if (!this.serverInfo) {
        throw new Error('Server information not available');
      }

      // Execute search
      const results = await this.searchService.searchUsers(
        this.serverInfo,
        {
          query: input.query,
          workspace: input.workspace,
          role: input.role,
          permission: input.permission,
          active: input.active,
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
      logger.error('User search failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: input.query,
      });

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return {
        content: [{
          type: 'text' as const,
          text: input.output === 'markdown' 
            ? `# Erro na Busca de Usuários\n\n**Erro:** ${errorMessage}`
            : JSON.stringify({ error: errorMessage, query: input.query }, null, 2)
        }]
      };
    }
  }

  /**
   * Formats output as JSON
   */
  private formatJsonOutput(results: any[], input: SearchUsersInput) {
    const response = {
      query: input.query,
      filters: {
        workspace: input.workspace,
        role: input.role,
        permission: input.permission,
        active: input.active,
      },
      pagination: {
        page: input.page || 0,
        limit: input.limit || 25,
        totalResults: results.length,
      },
      sorting: {
        sortBy: input.sortBy || 'displayName',
        sortOrder: input.sortOrder || 'asc',
      },
      results: results.map(user => ({
        id: user.id,
        title: user.title,
        description: user.description,
        url: user.url,
        metadata: user.metadata,
        relevanceScore: user.relevanceScore,
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
  private formatMarkdownOutput(results: any[], input: SearchUsersInput) {
    let markdown = `# Busca de Usuários\n\n`;
    markdown += `**Query:** ${input.query}\n\n`;

    // Add filters if present
    const filters = [];
    if (input.workspace) filters.push(`Workspace: ${input.workspace}`);
    if (input.role) filters.push(`Papel: ${input.role}`);
    if (input.permission) filters.push(`Permissão: ${input.permission}`);
    if (input.active !== undefined) filters.push(`Ativo: ${input.active ? 'Sim' : 'Não'}`);
    
    if (filters.length > 0) {
      markdown += `**Filtros:** ${filters.join(' • ')}\n\n`;
    }

    // Add pagination info
    markdown += `**Resultados:** ${results.length} usuários encontrados\n`;
    markdown += `**Página:** ${(input.page || 0) + 1} (${input.limit || 25} por página)\n\n`;

    // Add results
    if (results.length === 0) {
      markdown += `*Nenhum usuário encontrado para esta busca.*\n`;
    } else {
      markdown += `## Usuários Encontrados\n\n`;
      
      results.forEach((user, index) => {
        markdown += `### ${index + 1}. ${user.title}\n\n`;
        
        if (user.description && user.description !== user.title) {
          markdown += `**Informações:** ${user.description}\n\n`;
        }
        
        markdown += `**URL:** [${user.url}](${user.url})\n\n`;
        
        if (user.metadata) {
          const meta = user.metadata;
          const metaItems = [];
          
          if (meta.username && meta.username !== user.title) metaItems.push(`Username: @${meta.username}`);
          if (meta.email) metaItems.push(`Email: ${meta.email}`);
          if (meta.role) metaItems.push(`Papel: ${meta.role}`);
          if (meta.workspace) metaItems.push(`Workspace: ${meta.workspace}`);
          if (meta.active !== undefined) metaItems.push(`Status: ${meta.active ? 'Ativo' : 'Inativo'}`);
          if (meta.lastActive) metaItems.push(`Último acesso: ${new Date(meta.lastActive).toLocaleDateString('pt-BR')}`);
          if (meta.created) metaItems.push(`Criado: ${new Date(meta.created).toLocaleDateString('pt-BR')}`);
          
          if (metaItems.length > 0) {
            markdown += `**Detalhes:** ${metaItems.join(' • ')}\n\n`;
          }
          
          // Show avatar if available
          if (meta.avatarUrl) {
            markdown += `**Avatar:** [Ver imagem](${meta.avatarUrl})\n\n`;
          }
        }
        
        if (user.relevanceScore !== undefined) {
          markdown += `**Relevância:** ${(user.relevanceScore * 100).toFixed(1)}%\n\n`;
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
 * Creates a user search tool instance
 */
export function createSearchUsersTool(
  searchService: SearchCoordinatorService,
  serverInfo: ServerInfo
) {
  return new SearchUsersTool(searchService, serverInfo);
}

// ============================================================================
// Export
// ============================================================================

export default SearchUsersTool;
