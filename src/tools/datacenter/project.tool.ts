/**
 * Data Center Project Tools
 * Ferramentas para gerenciamento de projetos no Bitbucket Data Center
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPool, Pool } from 'generic-pool';
import { ProjectService } from '../../services/datacenter/project.service.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';
import { createMcpResponse, createErrorResponse } from '../../services/types/base.types.js';
import { z } from 'zod';

// Zod schemas for parameter validation
const CreateProjectSchema = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string().optional(),
  avatar: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetProjectSchema = z.object({
  projectKey: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateProjectSchema = z.object({
  projectKey: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  avatar: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteProjectSchema = z.object({
  projectKey: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListProjectsSchema = z.object({
  start: z.number().optional(),
  limit: z.number().optional(),
  name: z.string().optional(),
  permission: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetProjectPermissionsSchema = z.object({
  projectKey: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const AddProjectPermissionSchema = z.object({
  projectKey: z.string(),
  user: z.string().optional(),
  group: z.string().optional(),
  permission: z.string().optional().default('PROJECT_READ'),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const RemoveProjectPermissionSchema = z.object({
  projectKey: z.string(),
  user: z.string().optional(),
  group: z.string().optional(),
  permission: z.string().optional().default('PROJECT_READ'),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetProjectAvatarSchema = z.object({
  projectKey: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UploadProjectAvatarSchema = z.object({
  projectKey: z.string(),
  avatarData: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteProjectAvatarSchema = z.object({
  projectKey: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetProjectHooksSchema = z.object({
  projectKey: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateProjectHookSchema = z.object({
  projectKey: z.string(),
  name: z.string(),
  url: z.string(),
  events: z.array(z.string()),
  active: z.boolean().optional().default(true),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetProjectHookSchema = z.object({
  projectKey: z.string(),
  hookId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateProjectHookSchema = z.object({
  projectKey: z.string(),
  hookId: z.number(),
  name: z.string().optional(),
  url: z.string().optional(),
  events: z.array(z.string()).optional(),
  active: z.boolean().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteProjectHookSchema = z.object({
  projectKey: z.string(),
  hookId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetProjectSettingsSchema = z.object({
  projectKey: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateProjectSettingsSchema = z.object({
  projectKey: z.string(),
  settings: z.object({
    defaultBranch: z.string().optional(),
    defaultMergeStrategy: z.string().optional(),
    defaultCommitMessage: z.string().optional(),
  }),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

export class DataCenterProjectTools {
  private static logger = Logger.forContext('DataCenterProjectTools');
  private static projectServicePool: Pool<ProjectService>;

  static initialize(): void {
    const projectServiceFactory = {
      create: async () => new ProjectService(new ApiClient(), Logger.forContext('ProjectService')),
      destroy: async () => {},
    };

    this.projectServicePool = createPool(projectServiceFactory, {
      min: 2,
      max: 10,
    });
    this.logger.info('Data Center Project tools initialized');
  }

  /**
   * Create a new project
   */
  static async createProject(
    key: string,
    name: string,
    description?: string,
    avatar?: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('createProject');
    let service: ProjectService | null = null;

    try {
      service = await this.projectServicePool.acquire();
      methodLogger.debug('Creating project:', { key, name });

      const request = {
        key,
        name,
        ...(description && { description }),
        ...(avatar && { avatar }),
      };

      const result = await service.createProject(request);
      methodLogger.info('Successfully created project');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create project:', error);
      if (service) {
        this.projectServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.projectServicePool.release(service);
      }
    }
  }

  /**
   * Get project by key
   */
  static async getProject(projectKey: string, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getProject');
    let service: ProjectService | null = null;

    try {
      service = await this.projectServicePool.acquire();
      methodLogger.debug('Getting project:', { projectKey });

      const result = await service.getProject(projectKey);
      methodLogger.info('Successfully retrieved project');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get project:', error);
      if (service) {
        this.projectServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.projectServicePool.release(service);
      }
    }
  }

  /**
   * Update project
   */
  static async updateProject(
    projectKey: string,
    name?: string,
    description?: string,
    avatar?: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('updateProject');
    let service: ProjectService | null = null;

    try {
      service = await this.projectServicePool.acquire();
      methodLogger.debug('Updating project:', { projectKey });

      const request = {
        ...(name && { name }),
        ...(description && { description }),
        ...(avatar && { avatar }),
      };

      const result = await service.updateProject(projectKey, request);
      methodLogger.info('Successfully updated project');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update project:', error);
      if (service) {
        this.projectServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.projectServicePool.release(service);
      }
    }
  }

  /**
   * Delete project
   */
  static async deleteProject(projectKey: string, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('deleteProject');
    let service: ProjectService | null = null;

    try {
      service = await this.projectServicePool.acquire();
      methodLogger.debug('Deleting project:', { projectKey });

      await service.deleteProject(projectKey);
      methodLogger.info('Successfully deleted project');
      return createMcpResponse({ success: true, message: 'Project deleted successfully' }, output);
    } catch (error) {
      methodLogger.error('Failed to delete project:', error);
      if (service) {
        this.projectServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.projectServicePool.release(service);
      }
    }
  }

  /**
   * List projects
   */
  static async listProjects(
    start?: number,
    limit?: number,
    name?: string,
    permission?: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('listProjects');
    let service: ProjectService | null = null;

    try {
      service = await this.projectServicePool.acquire();
      methodLogger.debug('Listing projects');

      const params = {
        ...(start && { start }),
        ...(limit && { limit }),
        ...(name && { name }),
        ...(permission && {
          permission: permission as 'PROJECT_READ' | 'PROJECT_WRITE' | 'PROJECT_ADMIN',
        }),
      };

      const result = await service.listProjects(params);
      methodLogger.info('Successfully listed projects');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list projects:', error);
      if (service) {
        this.projectServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.projectServicePool.release(service);
      }
    }
  }

  /**
   * Get project permissions
   */
  static async getProjectPermissions(projectKey: string, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getProjectPermissions');
    let service: ProjectService | null = null;

    try {
      service = await this.projectServicePool.acquire();
      methodLogger.debug('Getting project permissions:', { projectKey });

      const result = await service.getProjectPermissions(projectKey);
      methodLogger.info('Successfully retrieved project permissions');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get project permissions:', error);
      if (service) {
        this.projectServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.projectServicePool.release(service);
      }
    }
  }

  /**
   * Add project permission
   */
  static async addProjectPermission(
    projectKey: string,
    user?: string,
    group?: string,
    permission: string = 'PROJECT_READ',
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('addProjectPermission');
    let service: ProjectService | null = null;

    try {
      service = await this.projectServicePool.acquire();
      methodLogger.debug('Adding project permission:', { projectKey, user, group, permission });

      const request = {
        ...(user && { user: { name: user } }),
        ...(group && { group: { name: group } }),
        permission: permission as 'PROJECT_READ' | 'PROJECT_WRITE' | 'PROJECT_ADMIN',
      };

      await service.addProjectPermission(projectKey, request);
      methodLogger.info('Successfully added project permission');
      return createMcpResponse(
        { success: true, message: 'Project permission added successfully' },
        output
      );
    } catch (error) {
      methodLogger.error('Failed to add project permission:', error);
      if (service) {
        this.projectServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.projectServicePool.release(service);
      }
    }
  }

  /**
   * Remove project permission
   */
  static async removeProjectPermission(
    projectKey: string,
    user?: string,
    group?: string,
    permission: string = 'PROJECT_READ',
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('removeProjectPermission');
    let service: ProjectService | null = null;

    try {
      service = await this.projectServicePool.acquire();
      methodLogger.debug('Removing project permission:', { projectKey, user, group, permission });

      const request = {
        ...(user && { user: { name: user } }),
        ...(group && { group: { name: group } }),
        permission: permission as 'PROJECT_READ' | 'PROJECT_WRITE' | 'PROJECT_ADMIN',
      };

      await service.removeProjectPermission(projectKey, request);
      methodLogger.info('Successfully removed project permission');
      return createMcpResponse(
        { success: true, message: 'Project permission removed successfully' },
        output
      );
    } catch (error) {
      methodLogger.error('Failed to remove project permission:', error);
      if (service) {
        this.projectServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.projectServicePool.release(service);
      }
    }
  }

  /**
   * Get project avatar
   */
  static async getProjectAvatar(projectKey: string, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getProjectAvatar');
    let service: ProjectService | null = null;

    try {
      service = await this.projectServicePool.acquire();
      methodLogger.debug('Getting project avatar:', { projectKey });

      const result = await service.getProjectAvatar(projectKey);
      methodLogger.info('Successfully retrieved project avatar');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get project avatar:', error);
      if (service) {
        this.projectServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.projectServicePool.release(service);
      }
    }
  }

  /**
   * Upload project avatar
   */
  static async uploadProjectAvatar(
    projectKey: string,
    avatarData: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('uploadProjectAvatar');
    let service: ProjectService | null = null;

    try {
      service = await this.projectServicePool.acquire();
      methodLogger.debug('Uploading project avatar:', { projectKey });

      const request = {
        data: avatarData,
        contentType: 'image/png',
      };

      const result = await service.uploadProjectAvatar(projectKey, request);
      methodLogger.info('Successfully uploaded project avatar');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to upload project avatar:', error);
      if (service) {
        this.projectServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.projectServicePool.release(service);
      }
    }
  }

  /**
   * Delete project avatar
   */
  static async deleteProjectAvatar(projectKey: string, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('deleteProjectAvatar');
    let service: ProjectService | null = null;

    try {
      service = await this.projectServicePool.acquire();
      methodLogger.debug('Deleting project avatar:', { projectKey });

      await service.deleteProjectAvatar(projectKey);
      methodLogger.info('Successfully deleted project avatar');
      return createMcpResponse(
        { success: true, message: 'Project avatar deleted successfully' },
        output
      );
    } catch (error) {
      methodLogger.error('Failed to delete project avatar:', error);
      if (service) {
        this.projectServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.projectServicePool.release(service);
      }
    }
  }

  /**
   * Get project hooks
   */
  static async getProjectHooks(projectKey: string, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getProjectHooks');
    let service: ProjectService | null = null;

    try {
      service = await this.projectServicePool.acquire();
      methodLogger.debug('Getting project hooks:', { projectKey });

      const result = await service.getProjectHooks(projectKey);
      methodLogger.info('Successfully retrieved project hooks');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get project hooks:', error);
      if (service) {
        this.projectServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.projectServicePool.release(service);
      }
    }
  }

  /**
   * Create project hook
   */
  static async createProjectHook(
    projectKey: string,
    name: string,
    url: string,
    events: string[],
    active: boolean = true,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('createProjectHook');
    let service: ProjectService | null = null;

    try {
      service = await this.projectServicePool.acquire();
      methodLogger.debug('Creating project hook:', { projectKey, name });

      const request = {
        name,
        url,
        events,
        active,
      };

      const result = await service.createProjectHook(projectKey, request);
      methodLogger.info('Successfully created project hook');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create project hook:', error);
      if (service) {
        this.projectServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.projectServicePool.release(service);
      }
    }
  }

  /**
   * Get project hook
   */
  static async getProjectHook(
    projectKey: string,
    hookId: number,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getProjectHook');
    let service: ProjectService | null = null;

    try {
      service = await this.projectServicePool.acquire();
      methodLogger.debug('Getting project hook:', { projectKey, hookId });

      const result = await service.getProjectHook(projectKey, hookId);
      methodLogger.info('Successfully retrieved project hook');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get project hook:', error);
      if (service) {
        this.projectServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.projectServicePool.release(service);
      }
    }
  }

  /**
   * Update project hook
   */
  static async updateProjectHook(
    projectKey: string,
    hookId: number,
    name?: string,
    url?: string,
    events?: string[],
    active?: boolean,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('updateProjectHook');
    let service: ProjectService | null = null;

    try {
      service = await this.projectServicePool.acquire();
      methodLogger.debug('Updating project hook:', { projectKey, hookId });

      const request = {
        ...(name && { name }),
        ...(url && { url }),
        ...(events && { events }),
        ...(active !== undefined && { active }),
      };

      const result = await service.updateProjectHook(projectKey, hookId, request);
      methodLogger.info('Successfully updated project hook');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update project hook:', error);
      if (service) {
        this.projectServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.projectServicePool.release(service);
      }
    }
  }

  /**
   * Delete project hook
   */
  static async deleteProjectHook(
    projectKey: string,
    hookId: number,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('deleteProjectHook');
    let service: ProjectService | null = null;

    try {
      service = await this.projectServicePool.acquire();
      methodLogger.debug('Deleting project hook:', { projectKey, hookId });

      await service.deleteProjectHook(projectKey, hookId);
      methodLogger.info('Successfully deleted project hook');
      return createMcpResponse(
        { success: true, message: 'Project hook deleted successfully' },
        output
      );
    } catch (error) {
      methodLogger.error('Failed to delete project hook:', error);
      if (service) {
        this.projectServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.projectServicePool.release(service);
      }
    }
  }

  /**
   * Get project settings
   */
  static async getProjectSettings(projectKey: string, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getProjectSettings');
    let service: ProjectService | null = null;

    try {
      service = await this.projectServicePool.acquire();
      methodLogger.debug('Getting project settings:', { projectKey });

      const result = await service.getProjectSettings(projectKey);
      methodLogger.info('Successfully retrieved project settings');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get project settings:', error);
      if (service) {
        this.projectServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.projectServicePool.release(service);
      }
    }
  }

  /**
   * Update project settings
   */
  static async updateProjectSettings(
    projectKey: string,
    settings: any,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('updateProjectSettings');
    let service: ProjectService | null = null;

    try {
      service = await this.projectServicePool.acquire();
      methodLogger.debug('Updating project settings:', { projectKey });

      const result = await service.updateProjectSettings(projectKey, settings);
      methodLogger.info('Successfully updated project settings');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update project settings:', error);
      if (service) {
        this.projectServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.projectServicePool.release(service);
      }
    }
  }

  /**
   * Register all project tools with the MCP server
   */
  static register(server: McpServer): void {
    const registerLogger = this.logger.forMethod('register');

    // Initialize the service
    this.initialize();

    // Create Project
    server.registerTool(
      'project_create',
      {
        description: `Cria um novo projeto no Bitbucket Data Center.

**Funcionalidades:**
- Criação de projeto completo
- Configuração de chave e nome
- Definição de descrição e avatar

**Parâmetros:**
- \`key\`: Chave única do projeto
- \`name\`: Nome do projeto
- \`description\`: Descrição do projeto (opcional)
- \`avatar\`: Avatar do projeto (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do projeto criado.`,
        inputSchema: CreateProjectSchema.shape,
      },
      async (params: z.infer<typeof CreateProjectSchema>) => {
        const validatedParams = CreateProjectSchema.parse(params);
        return this.createProject(
          validatedParams.key,
          validatedParams.name,
          validatedParams.description,
          validatedParams.avatar,
          validatedParams.output
        );
      }
    );

    // Get Project
    server.registerTool(
      'project_get',
      {
        description: `Obtém um projeto específico no Bitbucket Data Center.

**Funcionalidades:**
- Informações completas do projeto
- Metadados e configurações
- Status do projeto

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com as informações detalhadas do projeto.`,
        inputSchema: GetProjectSchema.shape,
      },
      async (params: z.infer<typeof GetProjectSchema>) => {
        const validatedParams = GetProjectSchema.parse(params);
        return this.getProject(validatedParams.projectKey, validatedParams.output);
      }
    );

    // Update Project
    server.registerTool(
      'project_update',
      {
        description: `Atualiza um projeto existente no Bitbucket Data Center.

**Funcionalidades:**
- Atualização de informações
- Modificação de configurações
- Alteração de metadados

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`name\`: Novo nome do projeto (opcional)
- \`description\`: Nova descrição (opcional)
- \`avatar\`: Novo avatar (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o projeto atualizado.`,
        inputSchema: UpdateProjectSchema.shape,
      },
      async (params: z.infer<typeof UpdateProjectSchema>) => {
        const validatedParams = UpdateProjectSchema.parse(params);
        return this.updateProject(
          validatedParams.projectKey,
          validatedParams.name,
          validatedParams.description,
          validatedParams.avatar,
          validatedParams.output
        );
      }
    );

    // Delete Project
    server.registerTool(
      'project_delete',
      {
        description: `Remove um projeto do Bitbucket Data Center.

**Funcionalidades:**
- Remoção segura do projeto
- Limpeza de dados associados
- Confirmação de exclusão

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com confirmação de remoção.`,
        inputSchema: DeleteProjectSchema.shape,
      },
      async (params: z.infer<typeof DeleteProjectSchema>) => {
        const validatedParams = DeleteProjectSchema.parse(params);
        return this.deleteProject(validatedParams.projectKey, validatedParams.output);
      }
    );

    // List Projects
    server.registerTool(
      'project_list',
      {
        description: `Lista todos os projetos no Bitbucket Data Center.

**Funcionalidades:**
- Lista completa de projetos
- Filtros por nome e permissão
- Paginação de resultados

**Parâmetros:**
- \`start\`: Índice inicial (opcional)
- \`limit\`: Limite de resultados (opcional)
- \`name\`: Filtro por nome (opcional)
- \`permission\`: Filtro por permissão (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de projetos.`,
        inputSchema: ListProjectsSchema.shape,
      },
      async (params: z.infer<typeof ListProjectsSchema>) => {
        const validatedParams = ListProjectsSchema.parse(params);
        return this.listProjects(
          validatedParams.start,
          validatedParams.limit,
          validatedParams.name,
          validatedParams.permission,
          validatedParams.output
        );
      }
    );

    // Get Project Permissions
    server.registerTool(
      'project_get_permissions',
      {
        description: `Obtém permissões de um projeto no Bitbucket Data Center.

**Funcionalidades:**
- Lista de permissões do projeto
- Usuários e grupos com acesso
- Níveis de permissão

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de permissões.`,
        inputSchema: GetProjectPermissionsSchema.shape,
      },
      async (params: z.infer<typeof GetProjectPermissionsSchema>) => {
        const validatedParams = GetProjectPermissionsSchema.parse(params);
        return this.getProjectPermissions(validatedParams.projectKey, validatedParams.output);
      }
    );

    // Add Project Permission
    server.registerTool(
      'project_add_permission',
      {
        description: `Adiciona permissão a um projeto no Bitbucket Data Center.

**Funcionalidades:**
- Adição de permissão de usuário
- Adição de permissão de grupo
- Configuração de nível de acesso

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`user\`: Nome do usuário (opcional)
- \`group\`: Nome do grupo (opcional)
- \`permission\`: Nível de permissão (padrão: 'PROJECT_READ')
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com confirmação de adição.`,
        inputSchema: AddProjectPermissionSchema.shape,
      },
      async (params: z.infer<typeof AddProjectPermissionSchema>) => {
        const validatedParams = AddProjectPermissionSchema.parse(params);
        return this.addProjectPermission(
          validatedParams.projectKey,
          validatedParams.user,
          validatedParams.group,
          validatedParams.permission,
          validatedParams.output
        );
      }
    );

    // Remove Project Permission
    server.registerTool(
      'project_remove_permission',
      {
        description: `Remove permissão de um projeto no Bitbucket Data Center.

**Funcionalidades:**
- Remoção de permissão de usuário
- Remoção de permissão de grupo
- Limpeza de acesso

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`user\`: Nome do usuário (opcional)
- \`group\`: Nome do grupo (opcional)
- \`permission\`: Nível de permissão (padrão: 'PROJECT_READ')
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com confirmação de remoção.`,
        inputSchema: RemoveProjectPermissionSchema.shape,
      },
      async (params: z.infer<typeof RemoveProjectPermissionSchema>) => {
        const validatedParams = RemoveProjectPermissionSchema.parse(params);
        return this.removeProjectPermission(
          validatedParams.projectKey,
          validatedParams.user,
          validatedParams.group,
          validatedParams.permission,
          validatedParams.output
        );
      }
    );

    // Get Project Avatar
    server.registerTool(
      'project_get_avatar',
      {
        description: `Obtém avatar de um projeto no Bitbucket Data Center.

**Funcionalidades:**
- Informações do avatar
- URL de acesso
- Metadados da imagem

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com informações do avatar.`,
        inputSchema: GetProjectAvatarSchema.shape,
      },
      async (params: z.infer<typeof GetProjectAvatarSchema>) => {
        const validatedParams = GetProjectAvatarSchema.parse(params);
        return this.getProjectAvatar(validatedParams.projectKey, validatedParams.output);
      }
    );

    // Upload Project Avatar
    server.registerTool(
      'project_upload_avatar',
      {
        description: `Faz upload de avatar para um projeto no Bitbucket Data Center.

**Funcionalidades:**
- Upload de nova imagem
- Substituição de avatar existente
- Validação de formato

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`avatarData\`: Dados do avatar (base64)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com avatar atualizado.`,
        inputSchema: UploadProjectAvatarSchema.shape,
      },
      async (params: z.infer<typeof UploadProjectAvatarSchema>) => {
        const validatedParams = UploadProjectAvatarSchema.parse(params);
        return this.uploadProjectAvatar(
          validatedParams.projectKey,
          validatedParams.avatarData,
          validatedParams.output
        );
      }
    );

    // Delete Project Avatar
    server.registerTool(
      'project_delete_avatar',
      {
        description: `Remove avatar de um projeto no Bitbucket Data Center.

**Funcionalidades:**
- Remoção de avatar
- Limpeza de dados
- Restauração do padrão

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com confirmação de remoção.`,
        inputSchema: DeleteProjectAvatarSchema.shape,
      },
      async (params: z.infer<typeof DeleteProjectAvatarSchema>) => {
        const validatedParams = DeleteProjectAvatarSchema.parse(params);
        return this.deleteProjectAvatar(validatedParams.projectKey, validatedParams.output);
      }
    );

    // Get Project Hooks
    server.registerTool(
      'project_get_hooks',
      {
        description: `Obtém hooks de um projeto no Bitbucket Data Center.

**Funcionalidades:**
- Lista de hooks do projeto
- Configurações de cada hook
- Status de ativação

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de hooks.`,
        inputSchema: GetProjectHooksSchema.shape,
      },
      async (params: z.infer<typeof GetProjectHooksSchema>) => {
        const validatedParams = GetProjectHooksSchema.parse(params);
        return this.getProjectHooks(validatedParams.projectKey, validatedParams.output);
      }
    );

    // Create Project Hook
    server.registerTool(
      'project_create_hook',
      {
        description: `Cria um hook para um projeto no Bitbucket Data Center.

**Funcionalidades:**
- Criação de novo hook
- Configuração de eventos
- Definição de URL de callback

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`name\`: Nome do hook
- \`url\`: URL de callback
- \`events\`: Lista de eventos
- \`active\`: Status ativo (padrão: true)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o hook criado.`,
        inputSchema: CreateProjectHookSchema.shape,
      },
      async (params: z.infer<typeof CreateProjectHookSchema>) => {
        const validatedParams = CreateProjectHookSchema.parse(params);
        return this.createProjectHook(
          validatedParams.projectKey,
          validatedParams.name,
          validatedParams.url,
          validatedParams.events,
          validatedParams.active,
          validatedParams.output
        );
      }
    );

    // Get Project Hook
    server.registerTool(
      'project_get_hook',
      {
        description: `Obtém um hook específico de um projeto no Bitbucket Data Center.

**Funcionalidades:**
- Informações detalhadas do hook
- Configurações atuais
- Status e eventos

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`hookId\`: ID do hook
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com informações detalhadas do hook.`,
        inputSchema: GetProjectHookSchema.shape,
      },
      async (params: z.infer<typeof GetProjectHookSchema>) => {
        const validatedParams = GetProjectHookSchema.parse(params);
        return this.getProjectHook(
          validatedParams.projectKey,
          validatedParams.hookId,
          validatedParams.output
        );
      }
    );

    // Update Project Hook
    server.registerTool(
      'project_update_hook',
      {
        description: `Atualiza um hook de um projeto no Bitbucket Data Center.

**Funcionalidades:**
- Atualização de configurações
- Modificação de eventos
- Alteração de status

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`hookId\`: ID do hook
- \`name\`: Novo nome (opcional)
- \`url\`: Nova URL (opcional)
- \`events\`: Novos eventos (opcional)
- \`active\`: Novo status (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o hook atualizado.`,
        inputSchema: UpdateProjectHookSchema.shape,
      },
      async (params: z.infer<typeof UpdateProjectHookSchema>) => {
        const validatedParams = UpdateProjectHookSchema.parse(params);
        return this.updateProjectHook(
          validatedParams.projectKey,
          validatedParams.hookId,
          validatedParams.name,
          validatedParams.url,
          validatedParams.events,
          validatedParams.active,
          validatedParams.output
        );
      }
    );

    // Delete Project Hook
    server.registerTool(
      'project_delete_hook',
      {
        description: `Remove um hook de um projeto no Bitbucket Data Center.

**Funcionalidades:**
- Remoção de hook
- Limpeza de configurações
- Confirmação de exclusão

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`hookId\`: ID do hook
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com confirmação de remoção.`,
        inputSchema: DeleteProjectHookSchema.shape,
      },
      async (params: z.infer<typeof DeleteProjectHookSchema>) => {
        const validatedParams = DeleteProjectHookSchema.parse(params);
        return this.deleteProjectHook(
          validatedParams.projectKey,
          validatedParams.hookId,
          validatedParams.output
        );
      }
    );

    // Get Project Settings
    server.registerTool(
      'project_get_settings',
      {
        description: `Obtém configurações de um projeto no Bitbucket Data Center.

**Funcionalidades:**
- Configurações do projeto
- Parâmetros de comportamento
- Opções avançadas

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com as configurações atuais.`,
        inputSchema: GetProjectSettingsSchema.shape,
      },
      async (params: z.infer<typeof GetProjectSettingsSchema>) => {
        const validatedParams = GetProjectSettingsSchema.parse(params);
        return this.getProjectSettings(validatedParams.projectKey, validatedParams.output);
      }
    );

    // Update Project Settings
    server.registerTool(
      'project_update_settings',
      {
        description: `Atualiza configurações de um projeto no Bitbucket Data Center.

**Funcionalidades:**
- Atualização de configurações
- Modificação de parâmetros
- Aplicação de mudanças

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`settings\`: Configurações a serem atualizadas
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com as configurações atualizadas.`,
        inputSchema: UpdateProjectSettingsSchema.shape,
      },
      async (params: z.infer<typeof UpdateProjectSettingsSchema>) => {
        const validatedParams = UpdateProjectSettingsSchema.parse(params);
        return this.updateProjectSettings(
          validatedParams.projectKey,
          validatedParams.settings,
          validatedParams.output
        );
      }
    );

    registerLogger.info('Successfully registered all data center project tools');
  }
}
