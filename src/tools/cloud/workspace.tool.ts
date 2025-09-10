/**
 * Cloud Workspace Tools
 * Ferramentas para gerenciamento de workspaces no Bitbucket Cloud
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPool, Pool } from 'generic-pool';
import { WorkspaceService } from '../../services/cloud/workspace.service.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';
import { createMcpResponse, createErrorResponse } from '../../services/types/base.types.js';
import { z } from 'zod';

// Zod schemas for parameter validation
const GetWorkspaceSchema = z.object({
  workspace: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListWorkspacesSchema = z.object({
  page: z.number().optional(),
  pagelen: z.number().optional(),
  role: z.string().optional(),
  q: z.string().optional(),
  sort: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateWorkspaceSchema = z.object({
  name: z.string(),
  isPrivate: z.boolean().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateWorkspaceSchema = z.object({
  workspace: z.string(),
  name: z.string().optional(),
  isPrivate: z.boolean().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteWorkspaceSchema = z.object({
  workspace: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListWorkspaceMembersSchema = z.object({
  workspace: z.string(),
  q: z.string().optional(),
  sort: z.string().optional(),
  page: z.number().optional(),
  pagelen: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetWorkspaceMemberSchema = z.object({
  workspace: z.string(),
  memberId: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListWorkspacePermissionsSchema = z.object({
  workspace: z.string(),
  q: z.string().optional(),
  sort: z.string().optional(),
  page: z.number().optional(),
  pagelen: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListWorkspaceHooksSchema = z.object({
  workspace: z.string(),
  page: z.number().optional(),
  pagelen: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetWorkspaceHookSchema = z.object({
  workspace: z.string(),
  hookId: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateWorkspaceHookSchema = z.object({
  workspace: z.string(),
  description: z.string(),
  url: z.string(),
  events: z.array(z.string()),
  active: z.boolean().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateWorkspaceHookSchema = z.object({
  workspace: z.string(),
  hookId: z.string(),
  description: z.string().optional(),
  url: z.string().optional(),
  events: z.array(z.string()).optional(),
  active: z.boolean().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteWorkspaceHookSchema = z.object({
  workspace: z.string(),
  hookId: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListWorkspaceVariablesSchema = z.object({
  workspace: z.string(),
  page: z.number().optional(),
  pagelen: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetWorkspaceVariableSchema = z.object({
  workspace: z.string(),
  variableId: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateWorkspaceVariableSchema = z.object({
  workspace: z.string(),
  key: z.string(),
  value: z.string(),
  secured: z.boolean().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateWorkspaceVariableSchema = z.object({
  workspace: z.string(),
  variableId: z.string(),
  key: z.string().optional(),
  value: z.string().optional(),
  secured: z.boolean().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteWorkspaceVariableSchema = z.object({
  workspace: z.string(),
  variableId: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

export class CloudWorkspaceTools {
  private static logger = Logger.forContext('CloudWorkspaceTools');
  private static workspaceServicePool: Pool<WorkspaceService>;

  static initialize(): void {
    const workspaceServiceFactory = {
      create: async () =>
        new WorkspaceService(new ApiClient(), Logger.forContext('WorkspaceService')),
      destroy: async () => {},
    };

    this.workspaceServicePool = createPool(workspaceServiceFactory, {
      min: 2,
      max: 10,
    });
    this.logger.info('Cloud Workspace tools initialized');
  }

  /**
   * Get workspace details
   */
  static async getWorkspace(workspace: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getWorkspace');
    let service: WorkspaceService | null = null;

    try {
      service = await this.workspaceServicePool.acquire();
      methodLogger.debug('Getting workspace:', { workspace });

      const result = await service.getWorkspace(workspace);

      methodLogger.info('Successfully retrieved workspace');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get workspace:', error);
      if (service) {
        this.workspaceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.workspaceServicePool.release(service);
      }
    }
  }

  /**
   * List workspaces
   */
  static async listWorkspaces(
    role?: 'owner' | 'collaborator' | 'member',
    q?: string,
    sort?: 'created_on' | 'name' | 'updated_on',
    page?: number,
    pagelen?: number,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('listWorkspaces');
    let service: WorkspaceService | null = null;

    try {
      service = await this.workspaceServicePool.acquire();
      methodLogger.debug('Listing workspaces:', { role, q, sort, page, pagelen });

      const result = await service.listWorkspaces({
        role,
        q,
        sort,
        page,
        pagelen,
      });

      methodLogger.info('Successfully listed workspaces');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list workspaces:', error);
      if (service) {
        this.workspaceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.workspaceServicePool.release(service);
      }
    }
  }

  /**
   * Create workspace
   */
  static async createWorkspace(
    name: string,
    isPrivate?: boolean,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('createWorkspace');
    let service: WorkspaceService | null = null;

    try {
      service = await this.workspaceServicePool.acquire();
      methodLogger.debug('Creating workspace:', { name, isPrivate });

      const result = await service.createWorkspace({
        name,
        is_private: isPrivate,
      });

      methodLogger.info('Successfully created workspace');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create workspace:', error);
      if (service) {
        this.workspaceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.workspaceServicePool.release(service);
      }
    }
  }

  /**
   * Update workspace
   */
  static async updateWorkspace(
    workspace: string,
    name?: string,
    isPrivate?: boolean,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('updateWorkspace');
    let service: WorkspaceService | null = null;

    try {
      service = await this.workspaceServicePool.acquire();
      methodLogger.debug('Updating workspace:', { workspace, name, isPrivate });

      const result = await service.updateWorkspace(workspace, {
        name,
        is_private: isPrivate,
      });

      methodLogger.info('Successfully updated workspace');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update workspace:', error);
      if (service) {
        this.workspaceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.workspaceServicePool.release(service);
      }
    }
  }

  /**
   * Delete workspace
   */
  static async deleteWorkspace(workspace: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('deleteWorkspace');
    let service: WorkspaceService | null = null;

    try {
      service = await this.workspaceServicePool.acquire();
      methodLogger.debug('Deleting workspace:', { workspace });

      await service.deleteWorkspace(workspace);

      methodLogger.info('Successfully deleted workspace');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to delete workspace:', error);
      if (service) {
        this.workspaceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.workspaceServicePool.release(service);
      }
    }
  }

  /**
   * List workspace members
   */
  static async listWorkspaceMembers(
    workspace: string,
    q?: string,
    sort?: 'created_on' | 'display_name',
    page?: number,
    pagelen?: number,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('listWorkspaceMembers');
    let service: WorkspaceService | null = null;

    try {
      service = await this.workspaceServicePool.acquire();
      methodLogger.debug('Listing workspace members:', { workspace, q, sort, page, pagelen });

      const result = await service.listWorkspaceMembers(workspace, {
        q,
        sort,
        page,
        pagelen,
      });

      methodLogger.info('Successfully listed workspace members');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list workspace members:', error);
      if (service) {
        this.workspaceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.workspaceServicePool.release(service);
      }
    }
  }

  /**
   * Get workspace member
   */
  static async getWorkspaceMember(
    workspace: string,
    member: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getWorkspaceMember');
    let service: WorkspaceService | null = null;

    try {
      service = await this.workspaceServicePool.acquire();
      methodLogger.debug('Getting workspace member:', { workspace, member });

      const result = await service.getWorkspaceMember(workspace, member);

      methodLogger.info('Successfully retrieved workspace member');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get workspace member:', error);
      if (service) {
        this.workspaceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.workspaceServicePool.release(service);
      }
    }
  }

  /**
   * List workspace permissions
   */
  static async listWorkspacePermissions(
    workspace: string,
    q?: string,
    sort?: 'created_on' | 'display_name',
    page?: number,
    pagelen?: number,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('listWorkspacePermissions');
    let service: WorkspaceService | null = null;

    try {
      service = await this.workspaceServicePool.acquire();
      methodLogger.debug('Listing workspace permissions:', { workspace, q, sort, page, pagelen });

      const result = await service.listWorkspacePermissions(workspace, {
        q,
        sort,
        page,
        pagelen,
      });

      methodLogger.info('Successfully listed workspace permissions');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list workspace permissions:', error);
      if (service) {
        this.workspaceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.workspaceServicePool.release(service);
      }
    }
  }

  /**
   * List workspace hooks
   */
  static async listWorkspaceHooks(workspace: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('listWorkspaceHooks');
    let service: WorkspaceService | null = null;

    try {
      service = await this.workspaceServicePool.acquire();
      methodLogger.debug('Listing workspace hooks:', { workspace });

      const result = await service.listWorkspaceHooks(workspace);

      methodLogger.info('Successfully listed workspace hooks');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list workspace hooks:', error);
      if (service) {
        this.workspaceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.workspaceServicePool.release(service);
      }
    }
  }

  /**
   * Get workspace hook
   */
  static async getWorkspaceHook(
    workspace: string,
    hookUid: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getWorkspaceHook');
    let service: WorkspaceService | null = null;

    try {
      service = await this.workspaceServicePool.acquire();
      methodLogger.debug('Getting workspace hook:', { workspace, hookUid });

      const result = await service.getWorkspaceHook(workspace, hookUid);

      methodLogger.info('Successfully retrieved workspace hook');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get workspace hook:', error);
      if (service) {
        this.workspaceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.workspaceServicePool.release(service);
      }
    }
  }

  /**
   * Create workspace hook
   */
  static async createWorkspaceHook(
    workspace: string,
    description: string,
    url: string,
    events: string[],
    active?: boolean,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('createWorkspaceHook');
    let service: WorkspaceService | null = null;

    try {
      service = await this.workspaceServicePool.acquire();
      methodLogger.debug('Creating workspace hook:', { workspace, description, url, events });

      const result = await service.createWorkspaceHook(workspace, {
        description,
        url,
        events,
        active,
      });

      methodLogger.info('Successfully created workspace hook');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create workspace hook:', error);
      if (service) {
        this.workspaceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.workspaceServicePool.release(service);
      }
    }
  }

  /**
   * Update workspace hook
   */
  static async updateWorkspaceHook(
    workspace: string,
    hookUid: string,
    description?: string,
    url?: string,
    events?: string[],
    active?: boolean,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('updateWorkspaceHook');
    let service: WorkspaceService | null = null;

    try {
      service = await this.workspaceServicePool.acquire();
      methodLogger.debug('Updating workspace hook:', {
        workspace,
        hookUid,
        description,
        url,
        events,
      });

      const result = await service.updateWorkspaceHook(workspace, hookUid, {
        description,
        url,
        events,
        active,
      });

      methodLogger.info('Successfully updated workspace hook');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update workspace hook:', error);
      if (service) {
        this.workspaceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.workspaceServicePool.release(service);
      }
    }
  }

  /**
   * Delete workspace hook
   */
  static async deleteWorkspaceHook(
    workspace: string,
    hookUid: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('deleteWorkspaceHook');
    let service: WorkspaceService | null = null;

    try {
      service = await this.workspaceServicePool.acquire();
      methodLogger.debug('Deleting workspace hook:', { workspace, hookUid });

      await service.deleteWorkspaceHook(workspace, hookUid);

      methodLogger.info('Successfully deleted workspace hook');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to delete workspace hook:', error);
      if (service) {
        this.workspaceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.workspaceServicePool.release(service);
      }
    }
  }

  /**
   * List workspace variables
   */
  static async listWorkspaceVariables(workspace: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('listWorkspaceVariables');
    let service: WorkspaceService | null = null;

    try {
      service = await this.workspaceServicePool.acquire();
      methodLogger.debug('Listing workspace variables:', { workspace });

      const result = await service.listWorkspaceVariables(workspace);

      methodLogger.info('Successfully listed workspace variables');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list workspace variables:', error);
      if (service) {
        this.workspaceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.workspaceServicePool.release(service);
      }
    }
  }

  /**
   * Get workspace variable
   */
  static async getWorkspaceVariable(
    workspace: string,
    variableUuid: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getWorkspaceVariable');
    let service: WorkspaceService | null = null;

    try {
      service = await this.workspaceServicePool.acquire();
      methodLogger.debug('Getting workspace variable:', { workspace, variableUuid });

      const result = await service.getWorkspaceVariable(workspace, variableUuid);

      methodLogger.info('Successfully retrieved workspace variable');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get workspace variable:', error);
      if (service) {
        this.workspaceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.workspaceServicePool.release(service);
      }
    }
  }

  /**
   * Create workspace variable
   */
  static async createWorkspaceVariable(
    workspace: string,
    key: string,
    value: string,
    secured?: boolean,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('createWorkspaceVariable');
    let service: WorkspaceService | null = null;

    try {
      service = await this.workspaceServicePool.acquire();
      methodLogger.debug('Creating workspace variable:', { workspace, key, secured });

      const result = await service.createWorkspaceVariable(workspace, {
        key,
        value,
        secured,
      });

      methodLogger.info('Successfully created workspace variable');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create workspace variable:', error);
      if (service) {
        this.workspaceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.workspaceServicePool.release(service);
      }
    }
  }

  /**
   * Update workspace variable
   */
  static async updateWorkspaceVariable(
    workspace: string,
    variableUuid: string,
    key?: string,
    value?: string,
    secured?: boolean,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('updateWorkspaceVariable');
    let service: WorkspaceService | null = null;

    try {
      service = await this.workspaceServicePool.acquire();
      methodLogger.debug('Updating workspace variable:', { workspace, variableUuid, key, secured });

      const result = await service.updateWorkspaceVariable(workspace, variableUuid, {
        key,
        value,
        secured,
      });

      methodLogger.info('Successfully updated workspace variable');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update workspace variable:', error);
      if (service) {
        this.workspaceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.workspaceServicePool.release(service);
      }
    }
  }

  /**
   * Delete workspace variable
   */
  static async deleteWorkspaceVariable(
    workspace: string,
    variableUuid: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('deleteWorkspaceVariable');
    let service: WorkspaceService | null = null;

    try {
      service = await this.workspaceServicePool.acquire();
      methodLogger.debug('Deleting workspace variable:', { workspace, variableUuid });

      await service.deleteWorkspaceVariable(workspace, variableUuid);

      methodLogger.info('Successfully deleted workspace variable');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to delete workspace variable:', error);
      if (service) {
        this.workspaceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.workspaceServicePool.release(service);
      }
    }
  }

  /**
   * Register all workspace tools with the MCP server
   */
  static register(server: McpServer): void {
    const registerLogger = this.logger.forMethod('register');

    // Initialize the service
    this.initialize();

    // Get Workspace
    server.registerTool(
      'workspace_get',
      {
        description: `Obtém detalhes de um workspace específico no Bitbucket Cloud.

**Funcionalidades:**
- Informações completas do workspace
- Dados de configuração e permissões
- Links e metadados do workspace

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Detalhes completos do workspace incluindo UUID, nome, slug, configurações e links.`,
        inputSchema: GetWorkspaceSchema.shape,
      },
      async (params: z.infer<typeof GetWorkspaceSchema>) => {
        const validatedParams = GetWorkspaceSchema.parse(params);
        return this.getWorkspace(validatedParams.workspace, validatedParams.output);
      }
    );

    // List Workspaces
    server.registerTool(
      'workspace_list',
      {
        description: `Lista workspaces no Bitbucket Cloud com filtros e paginação.

**Funcionalidades:**
- Lista todos os workspaces acessíveis
- Filtros por papel do usuário
- Busca por query
- Ordenação e paginação

**Parâmetros:**
- \`role\`: Filtro por papel do usuário (opcional)
- \`q\`: Query de busca (opcional)
- \`sort\`: Campo para ordenação (opcional)
- \`page\`: Número da página para paginação (opcional)
- \`pagelen\`: Número de itens por página (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Lista paginada de workspaces com informações básicas.`,
        inputSchema: ListWorkspacesSchema.shape,
      },
      async (params: z.infer<typeof ListWorkspacesSchema>) => {
        const validatedParams = ListWorkspacesSchema.parse(params);
        return this.listWorkspaces(
          validatedParams.role as 'owner' | 'collaborator' | 'member',
          validatedParams.q,
          validatedParams.sort as 'created_on' | 'name' | 'updated_on',
          validatedParams.page,
          validatedParams.pagelen,
          validatedParams.output
        );
      }
    );

    // Create Workspace
    server.registerTool(
      'workspace_create',
      {
        description: `Cria um novo workspace no Bitbucket Cloud.

**Funcionalidades:**
- Criação de workspace com nome
- Configuração de privacidade
- Geração automática de UUID

**Parâmetros:**
- \`name\`: Nome do workspace
- \`isPrivate\`: Se o workspace é privado (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Detalhes do workspace criado incluindo UUID e configurações.`,
        inputSchema: CreateWorkspaceSchema.shape,
      },
      async (params: z.infer<typeof CreateWorkspaceSchema>) => {
        const validatedParams = CreateWorkspaceSchema.parse(params);
        return this.createWorkspace(
          validatedParams.name,
          validatedParams.isPrivate,
          validatedParams.output
        );
      }
    );

    // Update Workspace
    server.registerTool(
      'workspace_update',
      {
        description: `Atualiza um workspace existente no Bitbucket Cloud.

**Funcionalidades:**
- Atualização de nome do workspace
- Modificação de configurações de privacidade
- Preservação de configurações existentes

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`name\`: Novo nome do workspace (opcional)
- \`isPrivate\`: Se o workspace é privado (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Detalhes atualizados do workspace.`,
        inputSchema: UpdateWorkspaceSchema.shape,
      },
      async (params: z.infer<typeof UpdateWorkspaceSchema>) => {
        const validatedParams = UpdateWorkspaceSchema.parse(params);
        return this.updateWorkspace(
          validatedParams.workspace,
          validatedParams.name,
          validatedParams.isPrivate,
          validatedParams.output
        );
      }
    );

    // Delete Workspace
    server.registerTool(
      'workspace_delete',
      {
        description: `Exclui um workspace no Bitbucket Cloud.

**Funcionalidades:**
- Exclusão permanente do workspace
- Remoção de todos os dados associados
- Operação irreversível

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Confirmação de exclusão do workspace.`,
        inputSchema: DeleteWorkspaceSchema.shape,
      },
      async (params: z.infer<typeof DeleteWorkspaceSchema>) => {
        const validatedParams = DeleteWorkspaceSchema.parse(params);
        return this.deleteWorkspace(validatedParams.workspace, validatedParams.output);
      }
    );

    // List Workspace Members
    server.registerTool(
      'workspace_list_members',
      {
        description: `Lista os membros de um workspace no Bitbucket Cloud.

**Funcionalidades:**
- Lista todos os membros do workspace
- Filtros por query e ordenação
- Paginação de resultados

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`q\`: Query de busca (opcional)
- \`sort\`: Campo para ordenação (opcional)
- \`page\`: Número da página para paginação (opcional)
- \`pagelen\`: Número de itens por página (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Lista paginada de membros do workspace.`,
        inputSchema: ListWorkspaceMembersSchema.shape,
      },
      async (params: z.infer<typeof ListWorkspaceMembersSchema>) => {
        const validatedParams = ListWorkspaceMembersSchema.parse(params);
        return this.listWorkspaceMembers(
          validatedParams.workspace,
          validatedParams.q,
          validatedParams.sort as 'created_on' | 'display_name',
          validatedParams.page,
          validatedParams.pagelen,
          validatedParams.output
        );
      }
    );

    // Get Workspace Member
    server.registerTool(
      'workspace_get_member',
      {
        description: `Obtém um membro específico de um workspace no Bitbucket Cloud.

**Funcionalidades:**
- Detalhes completos do membro
- Informações de perfil e permissões
- Links e metadados do usuário

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`memberId\`: UUID do membro
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Detalhes completos do membro do workspace.`,
        inputSchema: GetWorkspaceMemberSchema.shape,
      },
      async (params: z.infer<typeof GetWorkspaceMemberSchema>) => {
        const validatedParams = GetWorkspaceMemberSchema.parse(params);
        return this.getWorkspaceMember(
          validatedParams.workspace,
          validatedParams.memberId,
          validatedParams.output
        );
      }
    );

    // List Workspace Permissions
    server.registerTool(
      'workspace_list_permissions',
      {
        description: `Lista as permissões de um workspace no Bitbucket Cloud.

**Funcionalidades:**
- Lista todas as permissões do workspace
- Filtros por query e ordenação
- Paginação de resultados

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`q\`: Query de busca (opcional)
- \`sort\`: Campo para ordenação (opcional)
- \`page\`: Número da página para paginação (opcional)
- \`pagelen\`: Número de itens por página (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Lista paginada de permissões do workspace.`,
        inputSchema: ListWorkspacePermissionsSchema.shape,
      },
      async (params: z.infer<typeof ListWorkspacePermissionsSchema>) => {
        const validatedParams = ListWorkspacePermissionsSchema.parse(params);
        return this.listWorkspacePermissions(
          validatedParams.workspace,
          validatedParams.q,
          validatedParams.sort as 'created_on' | 'display_name',
          validatedParams.page,
          validatedParams.pagelen,
          validatedParams.output
        );
      }
    );

    // List Workspace Hooks
    server.registerTool(
      'workspace_list_hooks',
      {
        description: `Lista os hooks de um workspace no Bitbucket Cloud.

**Funcionalidades:**
- Lista todos os hooks do workspace
- Informações de configuração e status
- Detalhes de eventos e URLs

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`page\`: Número da página para paginação (opcional)
- \`pagelen\`: Número de itens por página (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Lista de hooks configurados no workspace.`,
        inputSchema: ListWorkspaceHooksSchema.shape,
      },
      async (params: z.infer<typeof ListWorkspaceHooksSchema>) => {
        const validatedParams = ListWorkspaceHooksSchema.parse(params);
        return this.listWorkspaceHooks(validatedParams.workspace, validatedParams.output);
      }
    );

    // Get Workspace Hook
    server.registerTool(
      'workspace_get_hook',
      {
        description: `Obtém um hook específico de um workspace no Bitbucket Cloud.

**Funcionalidades:**
- Detalhes completos do hook
- Configuração de eventos e URLs
- Status e metadados

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`hookId\`: ID do hook
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Detalhes completos do hook do workspace.`,
        inputSchema: GetWorkspaceHookSchema.shape,
      },
      async (params: z.infer<typeof GetWorkspaceHookSchema>) => {
        const validatedParams = GetWorkspaceHookSchema.parse(params);
        return this.getWorkspaceHook(
          validatedParams.workspace,
          validatedParams.hookId,
          validatedParams.output
        );
      }
    );

    // Create Workspace Hook
    server.registerTool(
      'workspace_create_hook',
      {
        description: `Cria um hook em um workspace no Bitbucket Cloud.

**Funcionalidades:**
- Criação de hook com URL e eventos
- Configuração de descrição e status
- Ativação/desativação do hook

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`description\`: Descrição do hook
- \`url\`: URL do hook
- \`events\`: Array de eventos do hook
- \`active\`: Se o hook está ativo (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Detalhes do hook criado.`,
        inputSchema: CreateWorkspaceHookSchema.shape,
      },
      async (params: z.infer<typeof CreateWorkspaceHookSchema>) => {
        const validatedParams = CreateWorkspaceHookSchema.parse(params);
        return this.createWorkspaceHook(
          validatedParams.workspace,
          validatedParams.description,
          validatedParams.url,
          validatedParams.events,
          validatedParams.active,
          validatedParams.output
        );
      }
    );

    // Update Workspace Hook
    server.registerTool(
      'workspace_update_hook',
      {
        description: `Atualiza um hook de um workspace no Bitbucket Cloud.

**Funcionalidades:**
- Atualização de configurações do hook
- Modificação de URL e eventos
- Alteração de status e descrição

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`hookId\`: ID do hook
- \`description\`: Descrição do hook (opcional)
- \`url\`: URL do hook (opcional)
- \`events\`: Array de eventos do hook (opcional)
- \`active\`: Se o hook está ativo (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Detalhes atualizados do hook.`,
        inputSchema: UpdateWorkspaceHookSchema.shape,
      },
      async (params: z.infer<typeof UpdateWorkspaceHookSchema>) => {
        const validatedParams = UpdateWorkspaceHookSchema.parse(params);
        return this.updateWorkspaceHook(
          validatedParams.workspace,
          validatedParams.hookId,
          validatedParams.description,
          validatedParams.url,
          validatedParams.events,
          validatedParams.active,
          validatedParams.output
        );
      }
    );

    // Delete Workspace Hook
    server.registerTool(
      'workspace_delete_hook',
      {
        description: `Exclui um hook de um workspace no Bitbucket Cloud.

**Funcionalidades:**
- Exclusão permanente do hook
- Remoção de configurações e eventos
- Operação irreversível

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`hookId\`: ID do hook
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Confirmação de exclusão do hook.`,
        inputSchema: DeleteWorkspaceHookSchema.shape,
      },
      async (params: z.infer<typeof DeleteWorkspaceHookSchema>) => {
        const validatedParams = DeleteWorkspaceHookSchema.parse(params);
        return this.deleteWorkspaceHook(
          validatedParams.workspace,
          validatedParams.hookId,
          validatedParams.output
        );
      }
    );

    // List Workspace Variables
    server.registerTool(
      'workspace_list_variables',
      {
        description: `Lista as variáveis de um workspace no Bitbucket Cloud.

**Funcionalidades:**
- Lista todas as variáveis do workspace
- Informações de configuração e segurança
- Detalhes de chaves e valores

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`page\`: Número da página para paginação (opcional)
- \`pagelen\`: Número de itens por página (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Lista de variáveis configuradas no workspace.`,
        inputSchema: ListWorkspaceVariablesSchema.shape,
      },
      async (params: z.infer<typeof ListWorkspaceVariablesSchema>) => {
        const validatedParams = ListWorkspaceVariablesSchema.parse(params);
        return this.listWorkspaceVariables(validatedParams.workspace, validatedParams.output);
      }
    );

    // Get Workspace Variable
    server.registerTool(
      'workspace_get_variable',
      {
        description: `Obtém uma variável específica de um workspace no Bitbucket Cloud.

**Funcionalidades:**
- Detalhes completos da variável
- Informações de segurança e configuração
- Valores e metadados

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`variableUuid\`: UUID da variável
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Detalhes completos da variável do workspace.`,
        inputSchema: GetWorkspaceVariableSchema.shape,
      },
      async (params: z.infer<typeof GetWorkspaceVariableSchema>) => {
        const validatedParams = GetWorkspaceVariableSchema.parse(params);
        return this.getWorkspaceVariable(
          validatedParams.workspace,
          validatedParams.variableId,
          validatedParams.output
        );
      }
    );

    // Create Workspace Variable
    server.registerTool(
      'workspace_create_variable',
      {
        description: `Cria uma variável em um workspace no Bitbucket Cloud.

**Funcionalidades:**
- Criação de variável com chave e valor
- Configuração de segurança
- Armazenamento de configurações

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`key\`: Chave da variável
- \`value\`: Valor da variável
- \`secured\`: Se a variável é segura (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Detalhes da variável criada.`,
        inputSchema: CreateWorkspaceVariableSchema.shape,
      },
      async (params: z.infer<typeof CreateWorkspaceVariableSchema>) => {
        const validatedParams = CreateWorkspaceVariableSchema.parse(params);
        return this.createWorkspaceVariable(
          validatedParams.workspace,
          validatedParams.key,
          validatedParams.value,
          validatedParams.secured,
          validatedParams.output
        );
      }
    );

    // Update Workspace Variable
    server.registerTool(
      'workspace_update_variable',
      {
        description: `Atualiza uma variável de um workspace no Bitbucket Cloud.

**Funcionalidades:**
- Atualização de chave e valor da variável
- Modificação de configurações de segurança
- Preservação de configurações existentes

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`variableUuid\`: UUID da variável
- \`key\`: Chave da variável (opcional)
- \`value\`: Valor da variável (opcional)
- \`secured\`: Se a variável é segura (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Detalhes atualizados da variável.`,
        inputSchema: UpdateWorkspaceVariableSchema.shape,
      },
      async (params: z.infer<typeof UpdateWorkspaceVariableSchema>) => {
        const validatedParams = UpdateWorkspaceVariableSchema.parse(params);
        return this.updateWorkspaceVariable(
          validatedParams.workspace,
          validatedParams.variableId,
          validatedParams.key,
          validatedParams.value,
          validatedParams.secured,
          validatedParams.output
        );
      }
    );

    // Delete Workspace Variable
    server.registerTool(
      'workspace_delete_variable',
      {
        description: `Exclui uma variável de um workspace no Bitbucket Cloud.

**Funcionalidades:**
- Exclusão permanente da variável
- Remoção de configurações e valores
- Operação irreversível

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`variableUuid\`: UUID da variável
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Confirmação de exclusão da variável.`,
        inputSchema: DeleteWorkspaceVariableSchema.shape,
      },
      async (params: z.infer<typeof DeleteWorkspaceVariableSchema>) => {
        const validatedParams = DeleteWorkspaceVariableSchema.parse(params);
        return this.deleteWorkspaceVariable(
          validatedParams.workspace,
          validatedParams.variableId,
          validatedParams.output
        );
      }
    );

    registerLogger.info('Successfully registered all cloud workspace tools');
  }
}
