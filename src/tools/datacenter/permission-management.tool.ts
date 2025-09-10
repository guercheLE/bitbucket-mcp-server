/**
 * Data Center Permission Management Tools
 * Ferramentas para gerenciamento de permissões no Bitbucket Data Center
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPool, Pool } from 'generic-pool';
import { PermissionManagementService } from '../../services/datacenter/permission-management.service.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';
import { createMcpResponse, createErrorResponse } from '../../services/types/base.types.js';
import { z } from 'zod';

// Schemas Zod para validação de parâmetros
const OutputOnlySchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListPermissionsSchema = z.object({
  type: z.string().optional(),
  resource: z.string().optional(),
  user: z.string().optional(),
  group: z.string().optional(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetPermissionSummarySchema = z.object({
  resource: z.string().optional(),
  user: z.string().optional(),
  group: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetPermissionAuditLogSchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  user: z.string().optional(),
  action: z.string().optional(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const BulkUpdatePermissionsSchema = z.object({
  permissions: z.array(z.object({})).optional(),
  operation: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListPermissionTemplatesSchema = z.object({
  name: z.string().optional(),
  type: z.string().optional(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GrantPermissionSchema = z.object({
  type: z.string(),
  scope: z.string(),
  grantee: z.object({}),
  context: z.object({}).optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetPermissionSchema = z.object({
  permissionId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const RevokePermissionSchema = z.object({
  permissionId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreatePermissionTemplateSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  permissions: z.array(z.object({})),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetPermissionTemplateSchema = z.object({
  templateId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdatePermissionTemplateSchema = z.object({
  templateId: z.number(),
  name: z.string().optional(),
  description: z.string().optional(),
  permissions: z.array(z.object({})).optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeletePermissionTemplateSchema = z.object({
  templateId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ApplyPermissionTemplateSchema = z.object({
  templateId: z.number(),
  targets: z.array(z.object({})),
  dryRun: z.boolean().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetProjectPermissionsSchema = z.object({
  projectKey: z.string(),
  type: z.string().optional(),
  scope: z.string().optional(),
  grantee: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetRepositoryPermissionsSchema = z.object({
  projectKey: z.string(),
  repositorySlug: z.string(),
  type: z.string().optional(),
  scope: z.string().optional(),
  grantee: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

export class DataCenterPermissionManagementTools {
  private static logger = Logger.forContext('DataCenterPermissionManagementTools');
  private static permissionManagementServicePool: Pool<PermissionManagementService>;

  static initialize(): void {
    const permissionManagementServiceFactory = {
      create: async () =>
        new PermissionManagementService(
          new ApiClient(),
          Logger.forContext('PermissionManagementService')
        ),
      destroy: async () => {},
    };

    this.permissionManagementServicePool = createPool(permissionManagementServiceFactory, {
      min: 2,
      max: 10,
    });
    this.logger.info('Data Center Permission Management tools initialized');
  }

  static async listPermissions(params?: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('listPermissions');
    let service: PermissionManagementService | null = null;

    try {
      service = await this.permissionManagementServicePool.acquire();
      methodLogger.debug('Listing permissions:', params);

      const result = await service.listPermissions(params);

      methodLogger.info('Successfully listed permissions');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list permissions:', error);
      if (service) {
        this.permissionManagementServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.permissionManagementServicePool.release(service);
      }
    }
  }

  static async grantPermission(request: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('grantPermission');
    let service: PermissionManagementService | null = null;

    try {
      service = await this.permissionManagementServicePool.acquire();
      methodLogger.debug('Granting permission:', request);

      const result = await service.grantPermission(request);

      methodLogger.info('Successfully granted permission');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to grant permission:', error);
      if (service) {
        this.permissionManagementServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.permissionManagementServicePool.release(service);
      }
    }
  }

  static async getPermission(permissionId: number, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getPermission');
    let service: PermissionManagementService | null = null;

    try {
      service = await this.permissionManagementServicePool.acquire();
      methodLogger.debug('Getting permission:', { permissionId });

      const result = await service.getPermission(permissionId);

      methodLogger.info('Successfully retrieved permission');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get permission:', error);
      if (service) {
        this.permissionManagementServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.permissionManagementServicePool.release(service);
      }
    }
  }

  static async revokePermission(permissionId: number, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('revokePermission');
    let service: PermissionManagementService | null = null;

    try {
      service = await this.permissionManagementServicePool.acquire();
      methodLogger.debug('Revoking permission:', { permissionId });

      await service.revokePermission(permissionId);

      methodLogger.info('Successfully revoked permission');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to revoke permission:', error);
      if (service) {
        this.permissionManagementServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.permissionManagementServicePool.release(service);
      }
    }
  }

  static async listPermissionSummaries(params?: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('listPermissionSummaries');
    let service: PermissionManagementService | null = null;

    try {
      service = await this.permissionManagementServicePool.acquire();
      methodLogger.debug('Listing permission summaries:', params);

      const result = await service.listPermissionSummaries(params);

      methodLogger.info('Successfully listed permission summaries');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list permission summaries:', error);
      if (service) {
        this.permissionManagementServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.permissionManagementServicePool.release(service);
      }
    }
  }

  static async getPermissionAuditLog(params?: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getPermissionAuditLog');
    let service: PermissionManagementService | null = null;

    try {
      service = await this.permissionManagementServicePool.acquire();
      methodLogger.debug('Getting permission audit log:', params);

      const result = await service.getPermissionAuditLog(params);

      methodLogger.info('Successfully retrieved permission audit log');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get permission audit log:', error);
      if (service) {
        this.permissionManagementServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.permissionManagementServicePool.release(service);
      }
    }
  }

  static async bulkGrantPermissions(request: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('bulkGrantPermissions');
    let service: PermissionManagementService | null = null;

    try {
      service = await this.permissionManagementServicePool.acquire();
      methodLogger.debug('Bulk granting permissions:', request);

      const result = await service.bulkGrantPermissions(request);

      methodLogger.info('Successfully bulk granted permissions');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to bulk grant permissions:', error);
      if (service) {
        this.permissionManagementServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.permissionManagementServicePool.release(service);
      }
    }
  }

  static async listPermissionTemplates(output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('listPermissionTemplates');
    let service: PermissionManagementService | null = null;

    try {
      service = await this.permissionManagementServicePool.acquire();
      methodLogger.debug('Listing permission templates');

      const result = await service.listPermissionTemplates();

      methodLogger.info('Successfully listed permission templates');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list permission templates:', error);
      if (service) {
        this.permissionManagementServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.permissionManagementServicePool.release(service);
      }
    }
  }

  static async createPermissionTemplate(request: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('createPermissionTemplate');
    let service: PermissionManagementService | null = null;

    try {
      service = await this.permissionManagementServicePool.acquire();
      methodLogger.debug('Creating permission template:', request);

      const result = await service.createPermissionTemplate(request);

      methodLogger.info('Successfully created permission template');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create permission template:', error);
      if (service) {
        this.permissionManagementServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.permissionManagementServicePool.release(service);
      }
    }
  }

  static async getPermissionTemplate(templateId: number, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getPermissionTemplate');
    let service: PermissionManagementService | null = null;

    try {
      service = await this.permissionManagementServicePool.acquire();
      methodLogger.debug('Getting permission template:', { templateId });

      const result = await service.getPermissionTemplate(templateId);

      methodLogger.info('Successfully retrieved permission template');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get permission template:', error);
      if (service) {
        this.permissionManagementServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.permissionManagementServicePool.release(service);
      }
    }
  }

  static async updatePermissionTemplate(
    templateId: number,
    request: any,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('updatePermissionTemplate');
    let service: PermissionManagementService | null = null;

    try {
      service = await this.permissionManagementServicePool.acquire();
      methodLogger.debug('Updating permission template:', { templateId, request });

      const result = await service.updatePermissionTemplate(templateId, request);

      methodLogger.info('Successfully updated permission template');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update permission template:', error);
      if (service) {
        this.permissionManagementServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.permissionManagementServicePool.release(service);
      }
    }
  }

  static async deletePermissionTemplate(
    templateId: number,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('deletePermissionTemplate');
    let service: PermissionManagementService | null = null;

    try {
      service = await this.permissionManagementServicePool.acquire();
      methodLogger.debug('Deleting permission template:', { templateId });

      await service.deletePermissionTemplate(templateId);

      methodLogger.info('Successfully deleted permission template');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to delete permission template:', error);
      if (service) {
        this.permissionManagementServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.permissionManagementServicePool.release(service);
      }
    }
  }

  static async applyPermissionTemplate(
    templateId: number,
    request: any,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('applyPermissionTemplate');
    let service: PermissionManagementService | null = null;

    try {
      service = await this.permissionManagementServicePool.acquire();
      methodLogger.debug('Applying permission template:', { templateId, request });

      const result = await service.applyPermissionTemplate(templateId, request);

      methodLogger.info('Successfully applied permission template');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to apply permission template:', error);
      if (service) {
        this.permissionManagementServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.permissionManagementServicePool.release(service);
      }
    }
  }

  static async getProjectPermissions(
    projectKey: string,
    params?: any,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getProjectPermissions');
    let service: PermissionManagementService | null = null;

    try {
      service = await this.permissionManagementServicePool.acquire();
      methodLogger.debug('Getting project permissions:', { projectKey, params });

      const result = await service.getProjectPermissions(projectKey, params);

      methodLogger.info('Successfully retrieved project permissions');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get project permissions:', error);
      if (service) {
        this.permissionManagementServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.permissionManagementServicePool.release(service);
      }
    }
  }

  static async getRepositoryPermissions(
    projectKey: string,
    repositorySlug: string,
    params?: any,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getRepositoryPermissions');
    let service: PermissionManagementService | null = null;

    try {
      service = await this.permissionManagementServicePool.acquire();
      methodLogger.debug('Getting repository permissions:', { projectKey, repositorySlug, params });

      const result = await service.getRepositoryPermissions(projectKey, repositorySlug, params);

      methodLogger.info('Successfully retrieved repository permissions');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get repository permissions:', error);
      if (service) {
        this.permissionManagementServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.permissionManagementServicePool.release(service);
      }
    }
  }

  static register(server: McpServer): void {
    const registerLogger = this.logger.forMethod('register');

    // Initialize the service
    this.initialize();

    // List Permissions
    server.registerTool(
      'permission_list',
      {
        description: `Lista permissões no Bitbucket Data Center.

**Funcionalidades:**
- Listagem de permissões
- Filtros e paginação
- Informações resumidas

**Parâmetros:**
- \`type\`: Tipo de permissão (opcional)
- \`resource\`: Recurso (opcional)
- \`user\`: Usuário (opcional)
- \`group\`: Grupo (opcional)
- \`start\`: Índice de início para paginação (opcional)
- \`limit\`: Número máximo de resultados (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de permissões.`,
        inputSchema: ListPermissionsSchema.shape,
      },
      async (params: z.infer<typeof ListPermissionsSchema>) => {
        const validatedParams = ListPermissionsSchema.parse(params);
        return await this.listPermissions(
          {
            type: validatedParams.type,
            resource: validatedParams.resource,
            user: validatedParams.user,
            group: validatedParams.group,
            start: validatedParams.start,
            limit: validatedParams.limit,
          },
          validatedParams.output
        );
      }
    );

    // Get Permission Summary
    server.registerTool(
      'permission_get_summary',
      {
        description: `Obtém resumo de permissões no Bitbucket Data Center.

**Funcionalidades:**
- Resumo de permissões
- Estatísticas de acesso
- Informações consolidadas

**Parâmetros:**
- \`resource\`: Recurso (opcional)
- \`user\`: Usuário (opcional)
- \`group\`: Grupo (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o resumo de permissões.`,
        inputSchema: GetPermissionSummarySchema.shape,
      },
      async (params: z.infer<typeof GetPermissionSummarySchema>) => {
        const validatedParams = GetPermissionSummarySchema.parse(params);
        return await this.listPermissionSummaries(
          {
            resource: validatedParams.resource,
            user: validatedParams.user,
            group: validatedParams.group,
          },
          validatedParams.output
        );
      }
    );

    // Get Permission Audit Log
    server.registerTool(
      'permission_get_audit_log',
      {
        description: `Obtém log de auditoria de permissões no Bitbucket Data Center.

**Funcionalidades:**
- Log de auditoria
- Histórico de mudanças
- Rastreamento de ações

**Parâmetros:**
- \`start_date\`: Data de início (opcional)
- \`end_date\`: Data de fim (opcional)
- \`user\`: Usuário (opcional)
- \`action\`: Ação (opcional)
- \`start\`: Índice de início para paginação (opcional)
- \`limit\`: Número máximo de resultados (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o log de auditoria.`,
        inputSchema: GetPermissionAuditLogSchema.shape,
      },
      async (params: z.infer<typeof GetPermissionAuditLogSchema>) => {
        const validatedParams = GetPermissionAuditLogSchema.parse(params);
        return await this.getPermissionAuditLog(
          {
            start_date: validatedParams.start_date,
            end_date: validatedParams.end_date,
            user: validatedParams.user,
            action: validatedParams.action,
            start: validatedParams.start,
            limit: validatedParams.limit,
          },
          validatedParams.output
        );
      }
    );

    // Bulk Update Permissions
    server.registerTool(
      'permission_bulk_update',
      {
        description: `Atualiza permissões em lote no Bitbucket Data Center.

**Funcionalidades:**
- Atualização em lote
- Operações eficientes
- Validação de permissões

**Parâmetros:**
- \`permissions\`: Lista de permissões para atualizar
- \`operation\`: Operação (add, remove, update)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os resultados da atualização em lote.`,
        inputSchema: BulkUpdatePermissionsSchema.shape,
      },
      async (params: z.infer<typeof BulkUpdatePermissionsSchema>) => {
        const validatedParams = BulkUpdatePermissionsSchema.parse(params);
        return await this.bulkGrantPermissions(
          {
            permissions: validatedParams.permissions,
            operation: validatedParams.operation,
          },
          validatedParams.output
        );
      }
    );

    // List Permission Templates
    server.registerTool(
      'permission_list_templates',
      {
        description: `Lista templates de permissões no Bitbucket Data Center.

**Funcionalidades:**
- Listagem de templates
- Filtros e paginação
- Informações resumidas

**Parâmetros:**
- \`name\`: Filtro por nome do template (opcional)
- \`type\`: Filtro por tipo (opcional)
- \`start\`: Índice de início para paginação (opcional)
- \`limit\`: Número máximo de resultados (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de templates de permissões.`,
        inputSchema: ListPermissionTemplatesSchema.shape,
      },
      async (params: z.infer<typeof ListPermissionTemplatesSchema>) => {
        const validatedParams = ListPermissionTemplatesSchema.parse(params);
        return await this.listPermissionTemplates(validatedParams.output);
      }
    );

    // Grant Permission
    server.registerTool(
      'permission_grant',
      {
        description: `Concede uma permissão no Bitbucket Data Center.

**Funcionalidades:**
- Concessão de permissão
- Configuração de acesso
- Aplicação de políticas

**Parâmetros:**
- \`type\`: Tipo de permissão
- \`scope\`: Escopo da permissão
- \`grantee\`: Concedente da permissão
- \`context\`: Contexto da permissão (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes da permissão concedida.`,
        inputSchema: GrantPermissionSchema.shape,
      },
      async (params: z.infer<typeof GrantPermissionSchema>) => {
        const validatedParams = GrantPermissionSchema.parse(params);
        return await this.grantPermission(
          {
            type: validatedParams.type,
            scope: validatedParams.scope,
            grantee: validatedParams.grantee,
            context: validatedParams.context,
          },
          validatedParams.output
        );
      }
    );

    // Get Permission
    server.registerTool(
      'permission_get',
      {
        description: `Obtém uma permissão específica no Bitbucket Data Center.

**Funcionalidades:**
- Detalhes da permissão
- Informações de acesso
- Status atual

**Parâmetros:**
- \`permissionId\`: ID da permissão

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes da permissão.`,
        inputSchema: GetPermissionSchema.shape,
      },
      async (params: z.infer<typeof GetPermissionSchema>) => {
        const validatedParams = GetPermissionSchema.parse(params);
        return await this.getPermission(validatedParams.permissionId, validatedParams.output);
      }
    );

    // Revoke Permission
    server.registerTool(
      'permission_revoke',
      {
        description: `Revoga uma permissão no Bitbucket Data Center.

**Funcionalidades:**
- Revogação de permissão
- Remoção de acesso
- Confirmação de operação

**Parâmetros:**
- \`permissionId\`: ID da permissão

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o resultado da operação.`,
        inputSchema: RevokePermissionSchema.shape,
      },
      async (params: z.infer<typeof RevokePermissionSchema>) => {
        const validatedParams = RevokePermissionSchema.parse(params);
        return await this.revokePermission(validatedParams.permissionId, validatedParams.output);
      }
    );

    // Create Permission Template
    server.registerTool(
      'permission_create_template',
      {
        description: `Cria um template de permissão no Bitbucket Data Center.

**Funcionalidades:**
- Criação de template
- Configuração de permissões
- Reutilização de políticas

**Parâmetros:**
- \`name\`: Nome do template
- \`description\`: Descrição do template (opcional)
- \`permissions\`: Lista de permissões

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do template criado.`,
        inputSchema: CreatePermissionTemplateSchema.shape,
      },
      async (params: z.infer<typeof CreatePermissionTemplateSchema>) => {
        const validatedParams = CreatePermissionTemplateSchema.parse(params);
        return await this.createPermissionTemplate(
          {
            name: validatedParams.name,
            description: validatedParams.description,
            permissions: validatedParams.permissions,
          },
          validatedParams.output
        );
      }
    );

    // Get Permission Template
    server.registerTool(
      'permission_get_template',
      {
        description: `Obtém um template de permissão específico no Bitbucket Data Center.

**Funcionalidades:**
- Detalhes do template
- Configurações de permissões
- Informações de uso

**Parâmetros:**
- \`templateId\`: ID do template

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do template.`,
        inputSchema: GetPermissionTemplateSchema.shape,
      },
      async (params: z.infer<typeof GetPermissionTemplateSchema>) => {
        const validatedParams = GetPermissionTemplateSchema.parse(params);
        return await this.getPermissionTemplate(validatedParams.templateId, validatedParams.output);
      }
    );

    // Update Permission Template
    server.registerTool(
      'permission_update_template',
      {
        description: `Atualiza um template de permissão no Bitbucket Data Center.

**Funcionalidades:**
- Atualização de template
- Modificação de permissões
- Aplicação de mudanças

**Parâmetros:**
- \`templateId\`: ID do template
- \`name\`: Nome do template (opcional)
- \`description\`: Descrição do template (opcional)
- \`permissions\`: Lista de permissões (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do template atualizado.`,
        inputSchema: UpdatePermissionTemplateSchema.shape,
      },
      async (params: z.infer<typeof UpdatePermissionTemplateSchema>) => {
        const validatedParams = UpdatePermissionTemplateSchema.parse(params);
        return await this.updatePermissionTemplate(
          validatedParams.templateId,
          {
            name: validatedParams.name,
            description: validatedParams.description,
            permissions: validatedParams.permissions,
          },
          validatedParams.output
        );
      }
    );

    // Delete Permission Template
    server.registerTool(
      'permission_delete_template',
      {
        description: `Remove um template de permissão no Bitbucket Data Center.

**Funcionalidades:**
- Remoção de template
- Limpeza de configurações
- Confirmação de operação

**Parâmetros:**
- \`templateId\`: ID do template

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o resultado da operação.`,
        inputSchema: DeletePermissionTemplateSchema.shape,
      },
      async (params: z.infer<typeof DeletePermissionTemplateSchema>) => {
        const validatedParams = DeletePermissionTemplateSchema.parse(params);
        return await this.deletePermissionTemplate(
          validatedParams.templateId,
          validatedParams.output
        );
      }
    );

    // Apply Permission Template
    server.registerTool(
      'permission_apply_template',
      {
        description: `Aplica um template de permissão no Bitbucket Data Center.

**Funcionalidades:**
- Aplicação de template
- Configuração automática
- Aplicação de políticas

**Parâmetros:**
- \`templateId\`: ID do template
- \`targets\`: Alvos para aplicação
- \`dryRun\`: Execução de teste (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o resultado da aplicação.`,
        inputSchema: ApplyPermissionTemplateSchema.shape,
      },
      async (params: z.infer<typeof ApplyPermissionTemplateSchema>) => {
        const validatedParams = ApplyPermissionTemplateSchema.parse(params);
        return await this.applyPermissionTemplate(
          validatedParams.templateId,
          {
            targets: validatedParams.targets,
            dryRun: validatedParams.dryRun,
          },
          validatedParams.output
        );
      }
    );

    // Get Project Permissions
    server.registerTool(
      'permission_get_projects',
      {
        description: `Obtém permissões de um projeto específico no Bitbucket Data Center.

**Funcionalidades:**
- Permissões do projeto
- Configurações de acesso
- Informações de usuários e grupos

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`type\`: Filtro por tipo de permissão (opcional)
- \`scope\`: Filtro por escopo (opcional)
- \`grantee\`: Filtro por concedente (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com as permissões do projeto.`,
        inputSchema: GetProjectPermissionsSchema.shape,
      },
      async (params: z.infer<typeof GetProjectPermissionsSchema>) => {
        const validatedParams = GetProjectPermissionsSchema.parse(params);
        return await this.getProjectPermissions(
          validatedParams.projectKey,
          {
            type: validatedParams.type,
            scope: validatedParams.scope,
            grantee: validatedParams.grantee,
          },
          validatedParams.output
        );
      }
    );

    // Get Repository Permissions
    server.registerTool(
      'permission_get_repositorys',
      {
        description: `Obtém permissões de um repositório específico no Bitbucket Data Center.

**Funcionalidades:**
- Permissões do repositório
- Configurações de acesso
- Informações de usuários e grupos

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`repositorySlug\`: Slug do repositório
- \`type\`: Filtro por tipo de permissão (opcional)
- \`scope\`: Filtro por escopo (opcional)
- \`grantee\`: Filtro por concedente (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com as permissões do repositório.`,
        inputSchema: GetRepositoryPermissionsSchema.shape,
      },
      async (params: z.infer<typeof GetRepositoryPermissionsSchema>) => {
        const validatedParams = GetRepositoryPermissionsSchema.parse(params);
        return await this.getRepositoryPermissions(
          validatedParams.projectKey,
          validatedParams.repositorySlug,
          {
            type: validatedParams.type,
            scope: validatedParams.scope,
            grantee: validatedParams.grantee,
          },
          validatedParams.output
        );
      }
    );

    registerLogger.info('Successfully registered all data center permission management tools');
  }
}
