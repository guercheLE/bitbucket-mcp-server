import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPool, Pool } from 'generic-pool';
import { Logger } from '../../utils/logger.util.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { BranchRestrictionService } from '../../services/cloud/branch-restriction.service.js';
import { createMcpResponse, createErrorResponse } from '../../services/types/base.types.js';
import { z } from 'zod';

// Zod schemas for parameter validation
const ListBranchRestrictionsSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  page: z.number().optional(),
  pagelen: z.number().optional(),
  kind: z.string().optional(),
  pattern: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateBranchRestrictionSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  branchRestriction: z.any(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetBranchRestrictionSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateBranchRestrictionSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  id: z.string(),
  branchRestriction: z.any(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteBranchRestrictionSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

/**
 * Branch Restriction Tools for Bitbucket Cloud
 *
 * Comprehensive branch restriction management including:
 * - List branch restrictions
 * - Create branch restrictions
 * - Get branch restrictions
 * - Update branch restrictions
 * - Delete branch restrictions
 */
export class CloudBranchRestrictionTools {
  private static logger = Logger.forContext('CloudBranchRestrictionTools');
  private static branchRestrictionServicePool: Pool<BranchRestrictionService>;

  static initialize(): void {
    const branchRestrictionServiceFactory = {
      create: async () => new BranchRestrictionService(new ApiClient()),
      destroy: async () => {},
    };

    this.branchRestrictionServicePool = createPool(branchRestrictionServiceFactory, {
      min: 2,
      max: 10,
    });
    this.logger.info('Cloud Branch Restriction tools initialized');
  }

  /**
   * List branch restrictions
   */
  static async listBranchRestrictions(
    workspace: string,
    repoSlug: string,
    page?: number,
    pagelen?: number,
    kind?: string,
    pattern?: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('listBranchRestrictions');
    let branchRestrictionService = null;

    try {
      methodLogger.debug('Listing branch restrictions:', {
        workspace,
        repoSlug,
        page,
        pagelen,
        kind,
        pattern,
      });
      branchRestrictionService = await this.branchRestrictionServicePool.acquire();

      const result = await branchRestrictionService.listBranchRestrictions({
        workspace,
        repo_slug: repoSlug,
        page: page || 1,
        pagelen: pagelen || 10,
        kind: kind as any,
        pattern,
      });

      methodLogger.debug('Successfully listed branch restrictions');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list branch restrictions:', error);
      if (branchRestrictionService) {
        this.branchRestrictionServicePool.destroy(branchRestrictionService);
        branchRestrictionService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (branchRestrictionService) {
        this.branchRestrictionServicePool.release(branchRestrictionService);
      }
    }
  }

  /**
   * Create a branch restriction
   */
  static async createBranchRestriction(
    workspace: string,
    repoSlug: string,
    branchRestriction: any,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('createBranchRestriction');
    let branchRestrictionService = null;

    try {
      methodLogger.debug('Creating branch restriction:', {
        workspace,
        repoSlug,
        branchRestriction,
      });
      branchRestrictionService = await this.branchRestrictionServicePool.acquire();

      const result = await branchRestrictionService.createBranchRestriction({
        workspace,
        repo_slug: repoSlug,
        branch_restriction: branchRestriction,
      });

      methodLogger.debug('Successfully created branch restriction');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create branch restriction:', error);
      if (branchRestrictionService) {
        this.branchRestrictionServicePool.destroy(branchRestrictionService);
        branchRestrictionService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (branchRestrictionService) {
        this.branchRestrictionServicePool.release(branchRestrictionService);
      }
    }
  }

  /**
   * Get a branch restriction
   */
  static async getBranchRestriction(
    workspace: string,
    repoSlug: string,
    id: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getBranchRestriction');
    let branchRestrictionService = null;

    try {
      methodLogger.debug('Getting branch restriction:', { workspace, repoSlug, id });
      branchRestrictionService = await this.branchRestrictionServicePool.acquire();

      const result = await branchRestrictionService.getBranchRestriction({
        workspace,
        repo_slug: repoSlug,
        id,
      });

      methodLogger.debug('Successfully retrieved branch restriction');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get branch restriction:', error);
      if (branchRestrictionService) {
        this.branchRestrictionServicePool.destroy(branchRestrictionService);
        branchRestrictionService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (branchRestrictionService) {
        this.branchRestrictionServicePool.release(branchRestrictionService);
      }
    }
  }

  /**
   * Update a branch restriction
   */
  static async updateBranchRestriction(
    workspace: string,
    repoSlug: string,
    id: string,
    branchRestriction: any,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('updateBranchRestriction');
    let branchRestrictionService = null;

    try {
      methodLogger.debug('Updating branch restriction:', {
        workspace,
        repoSlug,
        id,
        branchRestriction,
      });
      branchRestrictionService = await this.branchRestrictionServicePool.acquire();

      const result = await branchRestrictionService.updateBranchRestriction({
        workspace,
        repo_slug: repoSlug,
        id,
        branch_restriction: branchRestriction,
      });

      methodLogger.debug('Successfully updated branch restriction');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update branch restriction:', error);
      if (branchRestrictionService) {
        this.branchRestrictionServicePool.destroy(branchRestrictionService);
        branchRestrictionService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (branchRestrictionService) {
        this.branchRestrictionServicePool.release(branchRestrictionService);
      }
    }
  }

  /**
   * Delete a branch restriction
   */
  static async deleteBranchRestriction(
    workspace: string,
    repoSlug: string,
    id: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('deleteBranchRestriction');
    let branchRestrictionService = null;

    try {
      methodLogger.debug('Deleting branch restriction:', { workspace, repoSlug, id });
      branchRestrictionService = await this.branchRestrictionServicePool.acquire();

      await branchRestrictionService.deleteBranchRestriction({
        workspace,
        repo_slug: repoSlug,
        id,
      });

      methodLogger.debug('Successfully deleted branch restriction');
      return createMcpResponse({ message: 'Branch restriction deleted successfully' }, output);
    } catch (error) {
      methodLogger.error('Failed to delete branch restriction:', error);
      if (branchRestrictionService) {
        this.branchRestrictionServicePool.destroy(branchRestrictionService);
        branchRestrictionService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (branchRestrictionService) {
        this.branchRestrictionServicePool.release(branchRestrictionService);
      }
    }
  }

  /**
   * Register all branch restriction tools with the MCP server
   */
  static register(server: McpServer): void {
    const registerLogger = this.logger.forMethod('register');

    // Initialize the service
    this.initialize();

    // Register list branch restrictions tool
    server.registerTool(
      'branch_restriction_lists',
      {
        description: `Lista restrições de branch de um repositório no Bitbucket Cloud.

**Funcionalidades:**
- Listagem de restrições de branch com paginação
- Filtros por tipo e padrão
- Informações detalhadas de cada restrição

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`page\`: Número da página (opcional)
- \`pagelen\`: Tamanho da página (opcional)
- \`kind\`: Tipo de restrição (opcional)
- \`pattern\`: Padrão de branch (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de restrições de branch.`,
        inputSchema: ListBranchRestrictionsSchema.shape,
      },
      async (params: z.infer<typeof ListBranchRestrictionsSchema>) => {
        const validatedParams = ListBranchRestrictionsSchema.parse(params);
        return this.listBranchRestrictions(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.page,
          validatedParams.pagelen,
          validatedParams.kind,
          validatedParams.pattern,
          validatedParams.output
        );
      }
    );

    // Register create branch restriction tool
    server.registerTool(
      'branch_restriction_create',
      {
        description: `Cria uma nova restrição de branch no Bitbucket Cloud.

**Funcionalidades:**
- Criação de restrições de branch
- Controle de acesso a branches
- Configuração de regras de proteção

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`branchRestriction\`: Objeto com configurações da restrição

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes da restrição criada.`,
        inputSchema: CreateBranchRestrictionSchema.shape,
      },
      async (params: z.infer<typeof CreateBranchRestrictionSchema>) => {
        const validatedParams = CreateBranchRestrictionSchema.parse(params);
        return this.createBranchRestriction(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.branchRestriction,
          validatedParams.output
        );
      }
    );

    // Register get branch restriction tool
    server.registerTool(
      'branch_restriction_get',
      {
        description: `Obtém detalhes de uma restrição de branch específica no Bitbucket Cloud.

**Funcionalidades:**
- Informações detalhadas da restrição
- Configurações e regras aplicadas
- Status e metadados

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`id\`: ID da restrição de branch

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes da restrição.`,
        inputSchema: GetBranchRestrictionSchema.shape,
      },
      async (params: z.infer<typeof GetBranchRestrictionSchema>) => {
        const validatedParams = GetBranchRestrictionSchema.parse(params);
        return this.getBranchRestriction(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.id,
          validatedParams.output
        );
      }
    );

    // Register update branch restriction tool
    server.registerTool(
      'branch_restriction_update',
      {
        description: `Atualiza uma restrição de branch existente no Bitbucket Cloud.

**Funcionalidades:**
- Modificação de restrições existentes
- Atualização de regras e configurações
- Ajuste de permissões

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`id\`: ID da restrição de branch
- \`branchRestriction\`: Objeto com novas configurações

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes da restrição atualizada.`,
        inputSchema: UpdateBranchRestrictionSchema.shape,
      },
      async (params: z.infer<typeof UpdateBranchRestrictionSchema>) => {
        const validatedParams = UpdateBranchRestrictionSchema.parse(params);
        return this.updateBranchRestriction(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.id,
          validatedParams.branchRestriction,
          validatedParams.output
        );
      }
    );

    // Register delete branch restriction tool
    server.registerTool(
      'branch_restriction_delete',
      {
        description: `Remove uma restrição de branch no Bitbucket Cloud.

**Funcionalidades:**
- Remoção de restrições de branch
- Liberação de acesso a branches
- Limpeza de regras obsoletas

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`id\`: ID da restrição de branch

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a confirmação da remoção.`,
        inputSchema: DeleteBranchRestrictionSchema.shape,
      },
      async (params: z.infer<typeof DeleteBranchRestrictionSchema>) => {
        const validatedParams = DeleteBranchRestrictionSchema.parse(params);
        return this.deleteBranchRestriction(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.id,
          validatedParams.output
        );
      }
    );

    registerLogger.info('Successfully registered all cloud branch restriction tools');
  }
}
