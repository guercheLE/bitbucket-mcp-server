import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPool, Pool } from 'generic-pool';
import { Logger } from '../../utils/logger.util.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { ProjectService } from '../../services/cloud/project.service.js';
import { createMcpResponse, createErrorResponse } from '../../services/types/base.types.js';
import { z } from 'zod';

// Zod schemas for parameter validation
const CreateProjectSchema = z.object({
  workspace: z.string(),
  key: z.string(),
  name: z.string(),
  description: z.string().optional(),
  isPrivate: z.boolean().optional(),
  hasPubliclyVisibleRepos: z.boolean().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetProjectSchema = z.object({
  workspace: z.string(),
  projectKey: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateProjectSchema = z.object({
  workspace: z.string(),
  projectKey: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  isPrivate: z.boolean().optional(),
  hasPubliclyVisibleRepos: z.boolean().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteProjectSchema = z.object({
  workspace: z.string(),
  projectKey: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListDefaultReviewersSchema = z.object({
  workspace: z.string(),
  projectKey: z.string(),
  page: z.number().optional(),
  pagelen: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetDefaultReviewerSchema = z.object({
  workspace: z.string(),
  projectKey: z.string(),
  targetUuid: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const AddDefaultReviewerSchema = z.object({
  workspace: z.string(),
  projectKey: z.string(),
  targetUuid: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const RemoveDefaultReviewerSchema = z.object({
  workspace: z.string(),
  projectKey: z.string(),
  targetUuid: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListGroupPermissionsSchema = z.object({
  workspace: z.string(),
  projectKey: z.string(),
  page: z.number().optional(),
  pagelen: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetGroupPermissionSchema = z.object({
  workspace: z.string(),
  projectKey: z.string(),
  groupSlug: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateGroupPermissionSchema = z.object({
  workspace: z.string(),
  projectKey: z.string(),
  groupSlug: z.string(),
  permission: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteGroupPermissionSchema = z.object({
  workspace: z.string(),
  projectKey: z.string(),
  groupSlug: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListUserPermissionsSchema = z.object({
  workspace: z.string(),
  projectKey: z.string(),
  page: z.number().optional(),
  pagelen: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetUserPermissionSchema = z.object({
  workspace: z.string(),
  projectKey: z.string(),
  selectedUser: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateUserPermissionSchema = z.object({
  workspace: z.string(),
  projectKey: z.string(),
  selectedUser: z.string(),
  permission: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteUserPermissionSchema = z.object({
  workspace: z.string(),
  projectKey: z.string(),
  selectedUser: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

/**
 * Project Tools for Bitbucket Cloud
 *
 * Comprehensive project management including:
 * - Create, read, update, delete projects
 * - Manage default reviewers
 * - Manage group permissions
 * - Manage user permissions
 */

export class CloudProjectTools {
  private static logger = Logger.forContext('CloudProjectTools');
  private static projectServicePool: Pool<ProjectService>;

  static initialize(): void {
    const projectServiceFactory = {
      create: async () => new ProjectService(new ApiClient()),
      destroy: async () => {},
    };

    this.projectServicePool = createPool(projectServiceFactory, { min: 2, max: 10 });
    this.logger.info('Cloud Project tools initialized');
  }

  /**
   * Create a project in a workspace
   */
  static async createProject(
    workspace: string,
    key: string,
    name: string,
    description?: string,
    isPrivate?: boolean,
    hasPubliclyVisibleRepos?: boolean,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('createProject');
    let projectService = null;

    try {
      methodLogger.debug('Creating project:', { workspace, key, name });
      projectService = await this.projectServicePool.acquire();

      const result = await projectService.createProject({
        workspace: workspace,
        project: {
          key,
          name,
          description,
          is_private: isPrivate,
        },
      });

      methodLogger.debug('Successfully created project');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create project:', error);
      if (projectService) {
        this.projectServicePool.destroy(projectService);
        projectService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (projectService) {
        this.projectServicePool.release(projectService);
      }
    }
  }

  /**
   * Get a project for a workspace
   */
  static async getProject(
    workspace: string,
    projectKey: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getProject');
    let projectService = null;

    try {
      methodLogger.debug('Getting project:', { workspace, projectKey });
      projectService = await this.projectServicePool.acquire();

      const result = await projectService.getProject({
        workspace: workspace,
        project_key: projectKey,
      });

      methodLogger.debug('Successfully retrieved project');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get project:', error);
      if (projectService) {
        this.projectServicePool.destroy(projectService);
        projectService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (projectService) {
        this.projectServicePool.release(projectService);
      }
    }
  }

  /**
   * Update a project for a workspace
   */
  static async updateProject(
    workspace: string,
    projectKey: string,
    name?: string,
    description?: string,
    isPrivate?: boolean,
    hasPubliclyVisibleRepos?: boolean,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('updateProject');
    let projectService = null;

    try {
      methodLogger.debug('Updating project:', { workspace, projectKey });
      projectService = await this.projectServicePool.acquire();

      const result = await projectService.updateProject({
        workspace: workspace,
        project_key: projectKey,
        project: {
          name,
          description,
          is_private: isPrivate,
        },
      });

      methodLogger.debug('Successfully updated project');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update project:', error);
      if (projectService) {
        this.projectServicePool.destroy(projectService);
        projectService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (projectService) {
        this.projectServicePool.release(projectService);
      }
    }
  }

  /**
   * Delete a project for a workspace
   */
  static async deleteProject(
    workspace: string,
    projectKey: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('deleteProject');
    let projectService = null;

    try {
      methodLogger.debug('Deleting project:', { workspace, projectKey });
      projectService = await this.projectServicePool.acquire();

      await projectService.deleteProject({
        workspace: workspace,
        project_key: projectKey,
      });

      methodLogger.debug('Successfully deleted project');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to delete project:', error);
      if (projectService) {
        this.projectServicePool.destroy(projectService);
        projectService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (projectService) {
        this.projectServicePool.release(projectService);
      }
    }
  }

  /**
   * List the default reviewers in a project
   */
  static async listDefaultReviewers(
    workspace: string,
    projectKey: string,
    page?: number,
    pagelen?: number,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('listDefaultReviewers');
    let projectService = null;

    try {
      methodLogger.debug('Listing default reviewers:', { workspace, projectKey });
      projectService = await this.projectServicePool.acquire();

      const result = await projectService.listDefaultReviewers({
        workspace: workspace,
        project_key: projectKey,
        page,
        pagelen,
      });

      methodLogger.debug('Successfully listed default reviewers');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list default reviewers:', error);
      if (projectService) {
        this.projectServicePool.destroy(projectService);
        projectService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (projectService) {
        this.projectServicePool.release(projectService);
      }
    }
  }

  /**
   * Get a default reviewer
   */
  static async getDefaultReviewer(
    workspace: string,
    projectKey: string,
    selectedUser: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getDefaultReviewer');
    let projectService = null;

    try {
      methodLogger.debug('Getting default reviewer:', { workspace, projectKey, selectedUser });
      projectService = await this.projectServicePool.acquire();

      const result = await projectService.getDefaultReviewer({
        workspace: workspace,
        project_key: projectKey,
        selected_user: selectedUser,
      });

      methodLogger.debug('Successfully retrieved default reviewer');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get default reviewer:', error);
      if (projectService) {
        this.projectServicePool.destroy(projectService);
        projectService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (projectService) {
        this.projectServicePool.release(projectService);
      }
    }
  }

  /**
   * Add the specific user as a default reviewer for the project
   */
  static async addDefaultReviewer(
    workspace: string,
    projectKey: string,
    selectedUser: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('addDefaultReviewer');
    let projectService = null;

    try {
      methodLogger.debug('Adding default reviewer:', { workspace, projectKey, selectedUser });
      projectService = await this.projectServicePool.acquire();

      const result = await projectService.addDefaultReviewer({
        workspace: workspace,
        project_key: projectKey,
        selected_user: selectedUser,
      });

      methodLogger.debug('Successfully added default reviewer');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to add default reviewer:', error);
      if (projectService) {
        this.projectServicePool.destroy(projectService);
        projectService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (projectService) {
        this.projectServicePool.release(projectService);
      }
    }
  }

  /**
   * Remove the specific user from the project's default reviewers
   */
  static async removeDefaultReviewer(
    workspace: string,
    projectKey: string,
    selectedUser: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('removeDefaultReviewer');
    let projectService = null;

    try {
      methodLogger.debug('Removing default reviewer:', { workspace, projectKey, selectedUser });
      projectService = await this.projectServicePool.acquire();

      await projectService.removeDefaultReviewer({
        workspace: workspace,
        project_key: projectKey,
        selected_user: selectedUser,
      });

      methodLogger.debug('Successfully removed default reviewer');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to remove default reviewer:', error);
      if (projectService) {
        this.projectServicePool.destroy(projectService);
        projectService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (projectService) {
        this.projectServicePool.release(projectService);
      }
    }
  }

  /**
   * List explicit group permissions for a project
   */
  static async listGroupPermissions(
    workspace: string,
    projectKey: string,
    page?: number,
    pagelen?: number,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('listGroupPermissions');
    let projectService = null;

    try {
      methodLogger.debug('Listing group permissions:', { workspace, projectKey });
      projectService = await this.projectServicePool.acquire();

      const result = await projectService.listGroupPermissions({
        workspace: workspace,
        project_key: projectKey,
        page,
        pagelen,
      });

      methodLogger.debug('Successfully listed group permissions');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list group permissions:', error);
      if (projectService) {
        this.projectServicePool.destroy(projectService);
        projectService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (projectService) {
        this.projectServicePool.release(projectService);
      }
    }
  }

  /**
   * Get an explicit group permission for a project
   */
  static async getGroupPermission(
    workspace: string,
    projectKey: string,
    groupSlug: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getGroupPermission');
    let projectService = null;

    try {
      methodLogger.debug('Getting group permission:', { workspace, projectKey, groupSlug });
      projectService = await this.projectServicePool.acquire();

      const result = await projectService.getGroupPermission({
        workspace: workspace,
        project_key: projectKey,
        group_slug: groupSlug,
      });

      methodLogger.debug('Successfully retrieved group permission');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get group permission:', error);
      if (projectService) {
        this.projectServicePool.destroy(projectService);
        projectService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (projectService) {
        this.projectServicePool.release(projectService);
      }
    }
  }

  /**
   * Update an explicit group permission for a project
   */
  static async updateGroupPermission(
    workspace: string,
    projectKey: string,
    groupSlug: string,
    permission: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('updateGroupPermission');
    let projectService = null;

    try {
      methodLogger.debug('Updating group permission:', {
        workspace,
        projectKey,
        groupSlug,
        permission,
      });
      projectService = await this.projectServicePool.acquire();

      const result = await projectService.updateGroupPermission({
        workspace: workspace,
        project_key: projectKey,
        group_slug: groupSlug,
        permission: permission,
      });

      methodLogger.debug('Successfully updated group permission');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update group permission:', error);
      if (projectService) {
        this.projectServicePool.destroy(projectService);
        projectService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (projectService) {
        this.projectServicePool.release(projectService);
      }
    }
  }

  /**
   * Delete an explicit group permission for a project
   */
  static async deleteGroupPermission(
    workspace: string,
    projectKey: string,
    groupSlug: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('deleteGroupPermission');
    let projectService = null;

    try {
      methodLogger.debug('Deleting group permission:', { workspace, projectKey, groupSlug });
      projectService = await this.projectServicePool.acquire();

      await projectService.deleteGroupPermission({
        workspace: workspace,
        project_key: projectKey,
        group_slug: groupSlug,
      });

      methodLogger.debug('Successfully deleted group permission');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to delete group permission:', error);
      if (projectService) {
        this.projectServicePool.destroy(projectService);
        projectService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (projectService) {
        this.projectServicePool.release(projectService);
      }
    }
  }

  /**
   * List explicit user permissions for a project
   */
  static async listUserPermissions(
    workspace: string,
    projectKey: string,
    page?: number,
    pagelen?: number,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('listUserPermissions');
    let projectService = null;

    try {
      methodLogger.debug('Listing user permissions:', { workspace, projectKey });
      projectService = await this.projectServicePool.acquire();

      const result = await projectService.listUserPermissions({
        workspace: workspace,
        project_key: projectKey,
        page,
        pagelen,
      });

      methodLogger.debug('Successfully listed user permissions');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list user permissions:', error);
      if (projectService) {
        this.projectServicePool.destroy(projectService);
        projectService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (projectService) {
        this.projectServicePool.release(projectService);
      }
    }
  }

  /**
   * Get an explicit user permission for a project
   */
  static async getUserPermission(
    workspace: string,
    projectKey: string,
    selectedUserId: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getUserPermission');
    let projectService = null;

    try {
      methodLogger.debug('Getting user permission:', { workspace, projectKey, selectedUserId });
      projectService = await this.projectServicePool.acquire();

      const result = await projectService.getUserPermission({
        workspace: workspace,
        project_key: projectKey,
        selected_user_id: selectedUserId,
      });

      methodLogger.debug('Successfully retrieved user permission');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get user permission:', error);
      if (projectService) {
        this.projectServicePool.destroy(projectService);
        projectService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (projectService) {
        this.projectServicePool.release(projectService);
      }
    }
  }

  /**
   * Update an explicit user permission for a project
   */
  static async updateUserPermission(
    workspace: string,
    projectKey: string,
    selectedUserId: string,
    permission: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('updateUserPermission');
    let projectService = null;

    try {
      methodLogger.debug('Updating user permission:', {
        workspace,
        projectKey,
        selectedUserId,
        permission,
      });
      projectService = await this.projectServicePool.acquire();

      const result = await projectService.updateUserPermission({
        workspace: workspace,
        project_key: projectKey,
        selected_user_id: selectedUserId,
        permission: permission,
      });

      methodLogger.debug('Successfully updated user permission');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update user permission:', error);
      if (projectService) {
        this.projectServicePool.destroy(projectService);
        projectService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (projectService) {
        this.projectServicePool.release(projectService);
      }
    }
  }

  /**
   * Delete an explicit user permission for a project
   */
  static async deleteUserPermission(
    workspace: string,
    projectKey: string,
    selectedUserId: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('deleteUserPermission');
    let projectService = null;

    try {
      methodLogger.debug('Deleting user permission:', { workspace, projectKey, selectedUserId });
      projectService = await this.projectServicePool.acquire();

      await projectService.deleteUserPermission({
        workspace: workspace,
        project_key: projectKey,
        selected_user_id: selectedUserId,
      });

      methodLogger.debug('Successfully deleted user permission');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to delete user permission:', error);
      if (projectService) {
        this.projectServicePool.destroy(projectService);
        projectService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (projectService) {
        this.projectServicePool.release(projectService);
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

    // Register create project tool
    server.registerTool(
      'project_create',
      {
        description: `Cria um projeto em um workspace no Bitbucket Cloud.

**Funcionalidades:**
- Criação de novos projetos
- Configuração de visibilidade
- Definição de propriedades do projeto

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`key\`: Chave única do projeto
- \`name\`: Nome do projeto
- \`description\`: Descrição do projeto (opcional)
- \`isPrivate\`: Se o projeto é privado (opcional)
- \`hasPubliclyVisibleRepos\`: Se o projeto tem repositórios publicamente visíveis (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Informações do projeto criado.`,
        inputSchema: CreateProjectSchema.shape,
      },
      async params => {
        const validatedParams = CreateProjectSchema.parse(params);
        return this.createProject(
          validatedParams.workspace,
          validatedParams.key,
          validatedParams.name,
          validatedParams.description,
          validatedParams.isPrivate,
          validatedParams.hasPubliclyVisibleRepos,
          validatedParams.output || 'json'
        );
      }
    );

    // Register get project tool
    server.registerTool(
      'project_get',
      {
        description: `Obtém um projeto específico de um workspace no Bitbucket Cloud.

**Funcionalidades:**
- Recuperação de informações do projeto
- Detalhes completos do projeto
- Informações de propriedade e links

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`projectKey\`: Chave do projeto
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Informações detalhadas do projeto.`,
        inputSchema: GetProjectSchema.shape,
      },
      async params => {
        const validatedParams = GetProjectSchema.parse(params);
        return this.getProject(
          validatedParams.workspace,
          validatedParams.projectKey,
          validatedParams.output || 'json'
        );
      }
    );

    // Register update project tool
    server.registerTool(
      'project_update',
      {
        description: `Atualiza um projeto de um workspace no Bitbucket Cloud.

**Funcionalidades:**
- Atualização de propriedades do projeto
- Modificação de visibilidade
- Alteração de descrição e nome

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`projectKey\`: Chave do projeto
- \`name\`: Novo nome do projeto (opcional)
- \`description\`: Nova descrição do projeto (opcional)
- \`isPrivate\`: Se o projeto é privado (opcional)
- \`hasPubliclyVisibleRepos\`: Se o projeto tem repositórios publicamente visíveis (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Informações atualizadas do projeto.`,
        inputSchema: UpdateProjectSchema.shape,
      },
      async params => {
        const validatedParams = UpdateProjectSchema.parse(params);
        return this.updateProject(
          validatedParams.workspace,
          validatedParams.projectKey,
          validatedParams.name,
          validatedParams.description,
          validatedParams.isPrivate,
          validatedParams.hasPubliclyVisibleRepos,
          validatedParams.output || 'json'
        );
      }
    );

    // Register delete project tool
    server.registerTool(
      'project_delete',
      {
        description: `Exclui um projeto de um workspace no Bitbucket Cloud.

**Funcionalidades:**
- Remoção permanente do projeto
- Limpeza de recursos associados

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`projectKey\`: Chave do projeto
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Confirmação de exclusão.`,
        inputSchema: DeleteProjectSchema.shape,
      },
      async params => {
        const validatedParams = DeleteProjectSchema.parse(params);
        return this.deleteProject(
          validatedParams.workspace,
          validatedParams.projectKey,
          validatedParams.output || 'json'
        );
      }
    );

    // Register list default reviewers tool
    server.registerTool(
      'project_list_default_reviewers',
      {
        description: `Lista os revisores padrão de um projeto no Bitbucket Cloud.

**Funcionalidades:**
- Listagem de revisores padrão
- Informações de paginação
- Detalhes dos revisores

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`projectKey\`: Chave do projeto
- \`page\`: Número da página para paginação (opcional)
- \`pagelen\`: Número de itens por página (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Lista de revisores padrão do projeto.`,
        inputSchema: ListDefaultReviewersSchema.shape,
      },
      async params => {
        const validatedParams = ListDefaultReviewersSchema.parse(params);
        return this.listDefaultReviewers(
          validatedParams.workspace,
          validatedParams.projectKey,
          validatedParams.page,
          validatedParams.pagelen,
          validatedParams.output || 'json'
        );
      }
    );

    // Register get default reviewer tool
    server.registerTool(
      'project_get_default_reviewer',
      {
        description: `Obtém um revisor padrão específico de um projeto no Bitbucket Cloud.

**Funcionalidades:**
- Recuperação de informações do revisor
- Detalhes específicos do usuário

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`projectKey\`: Chave do projeto
- \`targetUuid\`: UUID do usuário selecionado
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Informações detalhadas do revisor padrão.`,
        inputSchema: GetDefaultReviewerSchema.shape,
      },
      async params => {
        const validatedParams = GetDefaultReviewerSchema.parse(params);
        return this.getDefaultReviewer(
          validatedParams.workspace,
          validatedParams.projectKey,
          validatedParams.targetUuid,
          validatedParams.output || 'json'
        );
      }
    );

    // Register add default reviewer tool
    server.registerTool(
      'project_add_default_reviewer',
      {
        description: `Adiciona um usuário específico como revisor padrão do projeto no Bitbucket Cloud.

**Funcionalidades:**
- Adição de revisores padrão
- Configuração automática de revisão

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`projectKey\`: Chave do projeto
- \`targetUuid\`: UUID do usuário selecionado
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Informações do revisor padrão adicionado.`,
        inputSchema: AddDefaultReviewerSchema.shape,
      },
      async params => {
        const validatedParams = AddDefaultReviewerSchema.parse(params);
        return this.addDefaultReviewer(
          validatedParams.workspace,
          validatedParams.projectKey,
          validatedParams.targetUuid,
          validatedParams.output || 'json'
        );
      }
    );

    // Register remove default reviewer tool
    server.registerTool(
      'project_remove_default_reviewer',
      {
        description: `Remove um usuário específico dos revisores padrão do projeto no Bitbucket Cloud.

**Funcionalidades:**
- Remoção de revisores padrão
- Limpeza de configurações de revisão

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`projectKey\`: Chave do projeto
- \`targetUuid\`: UUID do usuário selecionado
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Confirmação de remoção.`,
        inputSchema: RemoveDefaultReviewerSchema.shape,
      },
      async params => {
        const validatedParams = RemoveDefaultReviewerSchema.parse(params);
        return this.removeDefaultReviewer(
          validatedParams.workspace,
          validatedParams.projectKey,
          validatedParams.targetUuid,
          validatedParams.output || 'json'
        );
      }
    );

    // Register list group permissions tool
    server.registerTool(
      'project_list_group_permissions',
      {
        description: `Lista as permissões explícitas de grupos para um projeto no Bitbucket Cloud.

**Funcionalidades:**
- Listagem de permissões de grupos
- Informações de paginação
- Detalhes de permissões

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`projectKey\`: Chave do projeto
- \`page\`: Número da página para paginação (opcional)
- \`pagelen\`: Número de itens por página (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Lista de permissões de grupos do projeto.`,
        inputSchema: ListGroupPermissionsSchema.shape,
      },
      async params => {
        const validatedParams = ListGroupPermissionsSchema.parse(params);
        return this.listGroupPermissions(
          validatedParams.workspace,
          validatedParams.projectKey,
          validatedParams.page,
          validatedParams.pagelen,
          validatedParams.output || 'json'
        );
      }
    );

    // Register get group permission tool
    server.registerTool(
      'project_get_group_permission',
      {
        description: `Obtém uma permissão explícita de grupo para um projeto no Bitbucket Cloud.

**Funcionalidades:**
- Recuperação de permissão específica
- Detalhes do grupo e permissão

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`projectKey\`: Chave do projeto
- \`groupSlug\`: Slug do grupo
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Informações detalhadas da permissão do grupo.`,
        inputSchema: GetGroupPermissionSchema.shape,
      },
      async params => {
        const validatedParams = GetGroupPermissionSchema.parse(params);
        return this.getGroupPermission(
          validatedParams.workspace,
          validatedParams.projectKey,
          validatedParams.groupSlug,
          validatedParams.output || 'json'
        );
      }
    );

    // Register update group permission tool
    server.registerTool(
      'project_update_group_permission',
      {
        description: `Atualiza uma permissão explícita de grupo para um projeto no Bitbucket Cloud.

**Funcionalidades:**
- Modificação de permissões de grupos
- Configuração de níveis de acesso

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`projectKey\`: Chave do projeto
- \`groupSlug\`: Slug do grupo
- \`permission\`: Permissão (read, write, admin)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Informações atualizadas da permissão do grupo.`,
        inputSchema: UpdateGroupPermissionSchema.shape,
      },
      async params => {
        const validatedParams = UpdateGroupPermissionSchema.parse(params);
        return this.updateGroupPermission(
          validatedParams.workspace,
          validatedParams.projectKey,
          validatedParams.groupSlug,
          validatedParams.permission,
          validatedParams.output || 'json'
        );
      }
    );

    // Register delete group permission tool
    server.registerTool(
      'project_delete_group_permission',
      {
        description: `Exclui uma permissão explícita de grupo para um projeto no Bitbucket Cloud.

**Funcionalidades:**
- Remoção de permissões de grupos
- Limpeza de configurações de acesso

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`projectKey\`: Chave do projeto
- \`groupSlug\`: Slug do grupo
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Confirmação de exclusão da permissão.`,
        inputSchema: DeleteGroupPermissionSchema.shape,
      },
      async params => {
        const validatedParams = DeleteGroupPermissionSchema.parse(params);
        return this.deleteGroupPermission(
          validatedParams.workspace,
          validatedParams.projectKey,
          validatedParams.groupSlug,
          validatedParams.output || 'json'
        );
      }
    );

    // Register list user permissions tool
    server.registerTool(
      'project_list_user_permissions',
      {
        description: `Lista as permissões explícitas de usuários para um projeto no Bitbucket Cloud.

**Funcionalidades:**
- Listagem de permissões de usuários
- Informações de paginação
- Detalhes de permissões

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`projectKey\`: Chave do projeto
- \`page\`: Número da página para paginação (opcional)
- \`pagelen\`: Número de itens por página (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Lista de permissões de usuários do projeto.`,
        inputSchema: ListUserPermissionsSchema.shape,
      },
      async params => {
        const validatedParams = ListUserPermissionsSchema.parse(params);
        return this.listUserPermissions(
          validatedParams.workspace,
          validatedParams.projectKey,
          validatedParams.page,
          validatedParams.pagelen,
          validatedParams.output || 'json'
        );
      }
    );

    // Register get user permission tool
    server.registerTool(
      'project_get_user_permission',
      {
        description: `Obtém uma permissão explícita de usuário para um projeto no Bitbucket Cloud.

**Funcionalidades:**
- Recuperação de permissão específica
- Detalhes do usuário e permissão

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`projectKey\`: Chave do projeto
- \`selectedUser\`: UUID do usuário selecionado
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Informações detalhadas da permissão do usuário.`,
        inputSchema: GetUserPermissionSchema.shape,
      },
      async params => {
        const validatedParams = GetUserPermissionSchema.parse(params);
        return this.getUserPermission(
          validatedParams.workspace,
          validatedParams.projectKey,
          validatedParams.selectedUser,
          validatedParams.output || 'json'
        );
      }
    );

    // Register update user permission tool
    server.registerTool(
      'project_update_user_permission',
      {
        description: `Atualiza uma permissão explícita de usuário para um projeto no Bitbucket Cloud.

**Funcionalidades:**
- Modificação de permissões de usuários
- Configuração de níveis de acesso

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`projectKey\`: Chave do projeto
- \`selectedUser\`: UUID do usuário selecionado
- \`permission\`: Permissão (read, write, admin)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Informações atualizadas da permissão do usuário.`,
        inputSchema: UpdateUserPermissionSchema.shape,
      },
      async params => {
        const validatedParams = UpdateUserPermissionSchema.parse(params);
        return this.updateUserPermission(
          validatedParams.workspace,
          validatedParams.projectKey,
          validatedParams.selectedUser,
          validatedParams.permission,
          validatedParams.output || 'json'
        );
      }
    );

    // Register delete user permission tool
    server.registerTool(
      'project_delete_user_permission',
      {
        description: `Exclui uma permissão explícita de usuário para um projeto no Bitbucket Cloud.

**Funcionalidades:**
- Remoção de permissões de usuários
- Limpeza de configurações de acesso

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`projectKey\`: Chave do projeto
- \`selectedUser\`: UUID do usuário selecionado
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Confirmação de exclusão da permissão.`,
        inputSchema: DeleteUserPermissionSchema.shape,
      },
      async params => {
        const validatedParams = DeleteUserPermissionSchema.parse(params);
        return this.deleteUserPermission(
          validatedParams.workspace,
          validatedParams.projectKey,
          validatedParams.selectedUser,
          validatedParams.output || 'json'
        );
      }
    );

    registerLogger.info('Successfully registered all cloud project tools');
  }
}
