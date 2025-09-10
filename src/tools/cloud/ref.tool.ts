import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPool, Pool } from 'generic-pool';
import { Logger } from '../../utils/logger.util.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { RefService } from '../../services/cloud/ref.service.js';
import { createMcpResponse, createErrorResponse } from '../../services/types/base.types.js';
import { z } from 'zod';

// Zod schemas for parameter validation
const ListRefsSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  page: z.number().optional(),
  pagelen: z.number().optional(),
  q: z.string().optional(),
  sort: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListBranchesSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  page: z.number().optional(),
  pagelen: z.number().optional(),
  q: z.string().optional(),
  sort: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateBranchSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  branch: z.any(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetBranchSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  name: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteBranchSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  name: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListTagsSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  page: z.number().optional(),
  pagelen: z.number().optional(),
  q: z.string().optional(),
  sort: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateTagSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  tag: z.any(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetTagSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  name: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteTagSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  name: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

/**
 * Ref Tools for Bitbucket Cloud
 *
 * Comprehensive ref management including:
 * - List refs (branches and tags)
 * - List branches
 * - Create branches
 * - Get branches
 * - Delete branches
 * - List tags
 * - Create tags
 * - Get tags
 * - Delete tags
 */
export class CloudRefTools {
  private static logger = Logger.forContext('CloudRefTools');
  private static refServicePool: Pool<RefService>;

  static initialize(): void {
    const refServiceFactory = {
      create: async () => new RefService(new ApiClient()),
      destroy: async () => {},
    };

    this.refServicePool = createPool(refServiceFactory, { min: 2, max: 10 });
    this.logger.info('Cloud Ref tools initialized');
  }

  /**
   * List refs (branches and tags)
   */
  static async listRefs(
    workspace: string,
    repoSlug: string,
    page?: number,
    pagelen?: number,
    q?: string,
    sort?: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('listRefs');
    let refService = null;

    try {
      methodLogger.debug('Listing refs:', { workspace, repoSlug, page, pagelen, q, sort });
      refService = await this.refServicePool.acquire();

      const result = await refService.listRefs({
        workspace,
        repo_slug: repoSlug,
        page: page || 1,
        pagelen: pagelen || 10,
        q,
        sort,
      });

      methodLogger.debug('Successfully listed refs');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list refs:', error);
      if (refService) {
        this.refServicePool.destroy(refService);
        refService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (refService) {
        this.refServicePool.release(refService);
      }
    }
  }

  /**
   * List branches
   */
  static async listBranches(
    workspace: string,
    repoSlug: string,
    page?: number,
    pagelen?: number,
    q?: string,
    sort?: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('listBranches');
    let refService = null;

    try {
      methodLogger.debug('Listing branches:', { workspace, repoSlug, page, pagelen, q, sort });
      refService = await this.refServicePool.acquire();

      const result = await refService.listBranches({
        workspace,
        repo_slug: repoSlug,
        page: page || 1,
        pagelen: pagelen || 10,
        q,
        sort,
      });

      methodLogger.debug('Successfully listed branches');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list branches:', error);
      if (refService) {
        this.refServicePool.destroy(refService);
        refService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (refService) {
        this.refServicePool.release(refService);
      }
    }
  }

  /**
   * Create a branch
   */
  static async createBranch(
    workspace: string,
    repoSlug: string,
    branch: any,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('createBranch');
    let refService = null;

    try {
      methodLogger.debug('Creating branch:', { workspace, repoSlug, branch });
      refService = await this.refServicePool.acquire();

      const result = await refService.createBranch({
        workspace,
        repo_slug: repoSlug,
        branch,
      });

      methodLogger.debug('Successfully created branch');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create branch:', error);
      if (refService) {
        this.refServicePool.destroy(refService);
        refService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (refService) {
        this.refServicePool.release(refService);
      }
    }
  }

  /**
   * Get a branch
   */
  static async getBranch(
    workspace: string,
    repoSlug: string,
    name: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getBranch');
    let refService = null;

    try {
      methodLogger.debug('Getting branch:', { workspace, repoSlug, name });
      refService = await this.refServicePool.acquire();

      const result = await refService.getBranch({
        workspace,
        repo_slug: repoSlug,
        name,
      });

      methodLogger.debug('Successfully retrieved branch');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get branch:', error);
      if (refService) {
        this.refServicePool.destroy(refService);
        refService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (refService) {
        this.refServicePool.release(refService);
      }
    }
  }

  /**
   * Delete a branch
   */
  static async deleteBranch(
    workspace: string,
    repoSlug: string,
    name: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('deleteBranch');
    let refService = null;

    try {
      methodLogger.debug('Deleting branch:', { workspace, repoSlug, name });
      refService = await this.refServicePool.acquire();

      await refService.deleteBranch({
        workspace,
        repo_slug: repoSlug,
        name,
      });

      methodLogger.debug('Successfully deleted branch');
      return createMcpResponse({ message: 'Branch deleted successfully' }, output);
    } catch (error) {
      methodLogger.error('Failed to delete branch:', error);
      if (refService) {
        this.refServicePool.destroy(refService);
        refService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (refService) {
        this.refServicePool.release(refService);
      }
    }
  }

  /**
   * List tags
   */
  static async listTags(
    workspace: string,
    repoSlug: string,
    page?: number,
    pagelen?: number,
    q?: string,
    sort?: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('listTags');
    let refService = null;

    try {
      methodLogger.debug('Listing tags:', { workspace, repoSlug, page, pagelen, q, sort });
      refService = await this.refServicePool.acquire();

      const result = await refService.listTags({
        workspace,
        repo_slug: repoSlug,
        page: page || 1,
        pagelen: pagelen || 10,
        q,
        sort,
      });

      methodLogger.debug('Successfully listed tags');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list tags:', error);
      if (refService) {
        this.refServicePool.destroy(refService);
        refService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (refService) {
        this.refServicePool.release(refService);
      }
    }
  }

  /**
   * Create a tag
   */
  static async createTag(
    workspace: string,
    repoSlug: string,
    tag: any,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('createTag');
    let refService = null;

    try {
      methodLogger.debug('Creating tag:', { workspace, repoSlug, tag });
      refService = await this.refServicePool.acquire();

      const result = await refService.createTag({
        workspace,
        repo_slug: repoSlug,
        tag,
      });

      methodLogger.debug('Successfully created tag');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create tag:', error);
      if (refService) {
        this.refServicePool.destroy(refService);
        refService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (refService) {
        this.refServicePool.release(refService);
      }
    }
  }

  /**
   * Get a tag
   */
  static async getTag(
    workspace: string,
    repoSlug: string,
    name: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getTag');
    let refService = null;

    try {
      methodLogger.debug('Getting tag:', { workspace, repoSlug, name });
      refService = await this.refServicePool.acquire();

      const result = await refService.getTag({
        workspace,
        repo_slug: repoSlug,
        name,
      });

      methodLogger.debug('Successfully retrieved tag');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get tag:', error);
      if (refService) {
        this.refServicePool.destroy(refService);
        refService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (refService) {
        this.refServicePool.release(refService);
      }
    }
  }

  /**
   * Delete a tag
   */
  static async deleteTag(
    workspace: string,
    repoSlug: string,
    name: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('deleteTag');
    let refService = null;

    try {
      methodLogger.debug('Deleting tag:', { workspace, repoSlug, name });
      refService = await this.refServicePool.acquire();

      await refService.deleteTag({
        workspace,
        repo_slug: repoSlug,
        name,
      });

      methodLogger.debug('Successfully deleted tag');
      return createMcpResponse({ message: 'Tag deleted successfully' }, output);
    } catch (error) {
      methodLogger.error('Failed to delete tag:', error);
      if (refService) {
        this.refServicePool.destroy(refService);
        refService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (refService) {
        this.refServicePool.release(refService);
      }
    }
  }

  /**
   * Register all ref tools with the MCP server
   */
  static register(server: McpServer): void {
    const registerLogger = this.logger.forMethod('register');

    // Initialize the service
    this.initialize();

    // Register list refs tool
    server.registerTool(
      'ref_list',
      {
        description: `Lista refs (branches e tags) de um repositório no Bitbucket Cloud.

**Funcionalidades:**
- Listagem de branches e tags com paginação
- Filtros e ordenação
- Informações detalhadas de cada ref

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`page\`: Número da página (opcional)
- \`pagelen\`: Tamanho da página (opcional)
- \`q\`: Query de busca (opcional)
- \`sort\`: Campo de ordenação (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de refs.`,
        inputSchema: ListRefsSchema.shape,
      },
      async (params: z.infer<typeof ListRefsSchema>) => {
        const validatedParams = ListRefsSchema.parse(params);
        return this.listRefs(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.page,
          validatedParams.pagelen,
          validatedParams.q,
          validatedParams.sort,
          validatedParams.output
        );
      }
    );

    // Register list branches tool
    server.registerTool(
      'ref_list_branches',
      {
        description: `Lista branches de um repositório no Bitbucket Cloud.

**Funcionalidades:**
- Listagem de branches com paginação
- Filtros e ordenação
- Informações detalhadas de cada branch

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`page\`: Número da página (opcional)
- \`pagelen\`: Tamanho da página (opcional)
- \`q\`: Query de busca (opcional)
- \`sort\`: Campo de ordenação (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de branches.`,
        inputSchema: ListBranchesSchema.shape,
      },
      async (params: z.infer<typeof ListBranchesSchema>) => {
        const validatedParams = ListBranchesSchema.parse(params);
        return this.listBranches(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.page,
          validatedParams.pagelen,
          validatedParams.q,
          validatedParams.sort,
          validatedParams.output
        );
      }
    );

    // Register create branch tool
    server.registerTool(
      'ref_create_branch',
      {
        description: `Cria uma nova branch no Bitbucket Cloud.

**Funcionalidades:**
- Criação de branches
- Configuração de branch de origem
- Metadados e informações da branch

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`branch\`: Objeto com configurações da branch

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes da branch criada.`,
        inputSchema: CreateBranchSchema.shape,
      },
      async (params: z.infer<typeof CreateBranchSchema>) => {
        const validatedParams = CreateBranchSchema.parse(params);
        return this.createBranch(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.branch,
          validatedParams.output
        );
      }
    );

    // Register get branch tool
    server.registerTool(
      'ref_get_branch',
      {
        description: `Obtém detalhes de uma branch específica no Bitbucket Cloud.

**Funcionalidades:**
- Informações detalhadas da branch
- Metadados e configurações
- Status e histórico

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`name\`: Nome da branch

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes da branch.`,
        inputSchema: GetBranchSchema.shape,
      },
      async (params: z.infer<typeof GetBranchSchema>) => {
        const validatedParams = GetBranchSchema.parse(params);
        return this.getBranch(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.name,
          validatedParams.output
        );
      }
    );

    // Register delete branch tool
    server.registerTool(
      'ref_delete_branch',
      {
        description: `Remove uma branch no Bitbucket Cloud.

**Funcionalidades:**
- Remoção de branches
- Limpeza de branches obsoletas
- Controle de acesso

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`name\`: Nome da branch

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a confirmação da remoção.`,
        inputSchema: DeleteBranchSchema.shape,
      },
      async (params: z.infer<typeof DeleteBranchSchema>) => {
        const validatedParams = DeleteBranchSchema.parse(params);
        return this.deleteBranch(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.name,
          validatedParams.output
        );
      }
    );

    // Register list tags tool
    server.registerTool(
      'ref_list_tags',
      {
        description: `Lista tags de um repositório no Bitbucket Cloud.

**Funcionalidades:**
- Listagem de tags com paginação
- Filtros e ordenação
- Informações detalhadas de cada tag

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`page\`: Número da página (opcional)
- \`pagelen\`: Tamanho da página (opcional)
- \`q\`: Query de busca (opcional)
- \`sort\`: Campo de ordenação (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de tags.`,
        inputSchema: ListTagsSchema.shape,
      },
      async (params: z.infer<typeof ListTagsSchema>) => {
        const validatedParams = ListTagsSchema.parse(params);
        return this.listTags(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.page,
          validatedParams.pagelen,
          validatedParams.q,
          validatedParams.sort,
          validatedParams.output
        );
      }
    );

    // Register create tag tool
    server.registerTool(
      'ref_create_tag',
      {
        description: `Cria uma nova tag no Bitbucket Cloud.

**Funcionalidades:**
- Criação de tags
- Configuração de commit de referência
- Metadados e informações da tag

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`tag\`: Objeto com configurações da tag

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes da tag criada.`,
        inputSchema: CreateTagSchema.shape,
      },
      async (params: z.infer<typeof CreateTagSchema>) => {
        const validatedParams = CreateTagSchema.parse(params);
        return this.createTag(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.tag,
          validatedParams.output
        );
      }
    );

    // Register get tag tool
    server.registerTool(
      'ref_get_tag',
      {
        description: `Obtém detalhes de uma tag específica no Bitbucket Cloud.

**Funcionalidades:**
- Informações detalhadas da tag
- Metadados e configurações
- Commit de referência

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`name\`: Nome da tag

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes da tag.`,
        inputSchema: GetTagSchema.shape,
      },
      async (params: z.infer<typeof GetTagSchema>) => {
        const validatedParams = GetTagSchema.parse(params);
        return this.getTag(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.name,
          validatedParams.output
        );
      }
    );

    // Register delete tag tool
    server.registerTool(
      'ref_delete_tag',
      {
        description: `Remove uma tag no Bitbucket Cloud.

**Funcionalidades:**
- Remoção de tags
- Limpeza de tags obsoletas
- Controle de versões

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`name\`: Nome da tag

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a confirmação da remoção.`,
        inputSchema: DeleteTagSchema.shape,
      },
      async (params: z.infer<typeof DeleteTagSchema>) => {
        const validatedParams = DeleteTagSchema.parse(params);
        return this.deleteTag(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.name,
          validatedParams.output
        );
      }
    );

    registerLogger.info('Successfully registered all cloud ref tools');
  }
}
