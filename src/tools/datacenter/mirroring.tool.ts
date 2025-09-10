import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPool, Pool } from 'generic-pool';
import { MirroringService } from '../../services/datacenter/mirroring.service.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';
import { createMcpResponse, createErrorResponse } from '../../services/types/base.types.js';
import { z } from 'zod';

// Zod schemas for parameter validation
const ListConfigurationsSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateConfigurationSchema = z.object({
  name: z.string(),
  sourceUrl: z.string(),
  targetProjectKey: z.string(),
  targetRepositorySlug: z.string(),
  schedule: z.string().optional(),
  enabled: z.boolean().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateConfigurationSchema = z.object({
  configurationId: z.number(),
  name: z.string().optional(),
  sourceUrl: z.string().optional(),
  schedule: z.string().optional(),
  enabled: z.boolean().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteConfigurationSchema = z.object({
  configurationId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const StartMirrorSchema = z.object({
  configurationId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetSyncResultsSchema = z.object({
  configurationId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetConfigurationSchema = z.object({
  configurationId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const StopMirrorSyncSchema = z.object({
  configurationId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetSyncResultSchema = z.object({
  syncResultId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListUpstreamMirrorsSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateUpstreamMirrorSchema = z.object({
  name: z.string(),
  url: z.string(),
  username: z.string().optional(),
  password: z.string().optional(),
  enabled: z.boolean().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetUpstreamMirrorSchema = z.object({
  mirrorId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateUpstreamMirrorSchema = z.object({
  mirrorId: z.number(),
  name: z.string().optional(),
  url: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  enabled: z.boolean().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteUpstreamMirrorSchema = z.object({
  mirrorId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const StartUpstreamMirrorSyncSchema = z.object({
  mirrorId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const StopUpstreamMirrorSyncSchema = z.object({
  mirrorId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

/**
 * Data Center Mirroring Tools
 * Ferramentas para gerenciamento de espelhamento no Bitbucket Data Center
 */
export class DataCenterMirroringTools {
  private static logger = Logger.forContext('DataCenterMirroringTools');
  private static mirroringServicePool: Pool<MirroringService>;

  static initialize(): void {
    const mirroringServiceFactory = {
      create: async () =>
        new MirroringService(new ApiClient(), Logger.forContext('MirroringService')),
      destroy: async () => {},
    };

    this.mirroringServicePool = createPool(mirroringServiceFactory, {
      min: 2,
      max: 10,
    });
    this.logger.info('Data Center Mirroring tools initialized');
  }

  static async listConfigurations(output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('listConfigurations');
    let service: MirroringService | null = null;

    try {
      service = await this.mirroringServicePool.acquire();
      methodLogger.debug('Listing mirror configurations');

      const result = await service.listMirrorConfigurations();

      methodLogger.info('Successfully listed mirror configurations');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list mirror configurations:', error);
      if (service) {
        this.mirroringServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.mirroringServicePool.release(service);
      }
    }
  }

  static async createConfiguration(params: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('createConfiguration');
    let service: MirroringService | null = null;

    try {
      service = await this.mirroringServicePool.acquire();
      methodLogger.debug('Creating mirror configuration');

      const result = await service.createMirrorConfiguration(params);

      methodLogger.info('Successfully created mirror configuration');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create mirror configuration:', error);
      if (service) {
        this.mirroringServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.mirroringServicePool.release(service);
      }
    }
  }

  static async updateConfiguration(
    configurationId: number,
    params: any,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('updateConfiguration');
    let service: MirroringService | null = null;

    try {
      service = await this.mirroringServicePool.acquire();
      methodLogger.debug('Updating mirror configuration:', { configurationId });

      const result = await service.updateMirrorConfiguration(configurationId, params);

      methodLogger.info('Successfully updated mirror configuration');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update mirror configuration:', error);
      if (service) {
        this.mirroringServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.mirroringServicePool.release(service);
      }
    }
  }

  static async deleteConfiguration(configurationId: number, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('deleteConfiguration');
    let service: MirroringService | null = null;

    try {
      service = await this.mirroringServicePool.acquire();
      methodLogger.debug('Deleting mirror configuration:', { configurationId });

      await service.deleteMirrorConfiguration(configurationId);

      methodLogger.info('Successfully deleted mirror configuration');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to delete mirror configuration:', error);
      if (service) {
        this.mirroringServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.mirroringServicePool.release(service);
      }
    }
  }

  static async startSync(configurationId: number, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('startSync');
    let service: MirroringService | null = null;

    try {
      service = await this.mirroringServicePool.acquire();
      methodLogger.debug('Starting mirror sync:', { configurationId });

      const result = await service.startMirrorSync(configurationId);

      methodLogger.info('Successfully started mirror sync');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to start mirror sync:', error);
      if (service) {
        this.mirroringServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.mirroringServicePool.release(service);
      }
    }
  }

  static async getSyncResults(configurationId: number, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getSyncResults');
    let service: MirroringService | null = null;

    try {
      service = await this.mirroringServicePool.acquire();
      methodLogger.debug('Getting mirror sync results:', { configurationId });

      const result = await service.getMirrorSyncResults(configurationId);

      methodLogger.info('Successfully retrieved mirror sync results');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get mirror sync results:', error);
      if (service) {
        this.mirroringServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.mirroringServicePool.release(service);
      }
    }
  }

  static async getConfiguration(mirrorId: number, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getConfiguration');
    let service: MirroringService | null = null;

    try {
      service = await this.mirroringServicePool.acquire();
      methodLogger.debug('Getting mirror configuration:', { mirrorId });

      const result = await service.getMirrorConfiguration(mirrorId);

      methodLogger.info('Successfully retrieved mirror configuration');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get mirror configuration:', error);
      if (service) {
        this.mirroringServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.mirroringServicePool.release(service);
      }
    }
  }

  static async stopSync(mirrorId: number, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('stopSync');
    let service: MirroringService | null = null;

    try {
      service = await this.mirroringServicePool.acquire();
      methodLogger.debug('Stopping mirror sync:', { mirrorId });

      await service.stopMirrorSync(mirrorId);

      methodLogger.info('Successfully stopped mirror sync');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to stop mirror sync:', error);
      if (service) {
        this.mirroringServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.mirroringServicePool.release(service);
      }
    }
  }

  static async getSyncResult(
    mirrorId: number,
    syncResultId: number,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getSyncResult');
    let service: MirroringService | null = null;

    try {
      service = await this.mirroringServicePool.acquire();
      methodLogger.debug('Getting mirror sync result:', { mirrorId, syncResultId });

      const result = await service.getMirrorSyncResult(mirrorId, syncResultId);

      methodLogger.info('Successfully retrieved mirror sync result');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get mirror sync result:', error);
      if (service) {
        this.mirroringServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.mirroringServicePool.release(service);
      }
    }
  }

  static async listUpstreamMirrors(params?: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('listUpstreamMirrors');
    let service: MirroringService | null = null;

    try {
      service = await this.mirroringServicePool.acquire();
      methodLogger.debug('Listing upstream mirrors:', params);

      const result = await service.listUpstreamMirrors(params);

      methodLogger.info('Successfully listed upstream mirrors');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list upstream mirrors:', error);
      if (service) {
        this.mirroringServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.mirroringServicePool.release(service);
      }
    }
  }

  static async createUpstreamMirror(request: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('createUpstreamMirror');
    let service: MirroringService | null = null;

    try {
      service = await this.mirroringServicePool.acquire();
      methodLogger.debug('Creating upstream mirror:', request);

      const result = await service.createUpstreamMirror(request);

      methodLogger.info('Successfully created upstream mirror');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create upstream mirror:', error);
      if (service) {
        this.mirroringServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.mirroringServicePool.release(service);
      }
    }
  }

  static async getUpstreamMirror(mirrorId: number, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getUpstreamMirror');
    let service: MirroringService | null = null;

    try {
      service = await this.mirroringServicePool.acquire();
      methodLogger.debug('Getting upstream mirror:', { mirrorId });

      const result = await service.getUpstreamMirror(mirrorId);

      methodLogger.info('Successfully retrieved upstream mirror');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get upstream mirror:', error);
      if (service) {
        this.mirroringServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.mirroringServicePool.release(service);
      }
    }
  }

  static async updateUpstreamMirror(
    mirrorId: number,
    request: any,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('updateUpstreamMirror');
    let service: MirroringService | null = null;

    try {
      service = await this.mirroringServicePool.acquire();
      methodLogger.debug('Updating upstream mirror:', { mirrorId, request });

      const result = await service.updateUpstreamMirror(mirrorId, request);

      methodLogger.info('Successfully updated upstream mirror');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update upstream mirror:', error);
      if (service) {
        this.mirroringServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.mirroringServicePool.release(service);
      }
    }
  }

  static async deleteUpstreamMirror(mirrorId: number, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('deleteUpstreamMirror');
    let service: MirroringService | null = null;

    try {
      service = await this.mirroringServicePool.acquire();
      methodLogger.debug('Deleting upstream mirror:', { mirrorId });

      await service.deleteUpstreamMirror(mirrorId);

      methodLogger.info('Successfully deleted upstream mirror');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to delete upstream mirror:', error);
      if (service) {
        this.mirroringServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.mirroringServicePool.release(service);
      }
    }
  }

  static async startUpstreamMirrorSync(mirrorId: number, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('startUpstreamMirrorSync');
    let service: MirroringService | null = null;

    try {
      service = await this.mirroringServicePool.acquire();
      methodLogger.debug('Starting upstream mirror sync:', { mirrorId });

      const result = await service.startUpstreamMirrorSync(mirrorId);

      methodLogger.info('Successfully started upstream mirror sync');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to start upstream mirror sync:', error);
      if (service) {
        this.mirroringServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.mirroringServicePool.release(service);
      }
    }
  }

  static async stopUpstreamMirrorSync(mirrorId: number, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('stopUpstreamMirrorSync');
    let service: MirroringService | null = null;

    try {
      service = await this.mirroringServicePool.acquire();
      methodLogger.debug('Stopping upstream mirror sync:', { mirrorId });

      await service.stopUpstreamMirrorSync(mirrorId);

      methodLogger.info('Successfully stopped upstream mirror sync');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to stop upstream mirror sync:', error);
      if (service) {
        this.mirroringServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.mirroringServicePool.release(service);
      }
    }
  }

  static register(server: McpServer): void {
    const registerLogger = this.logger.forMethod('register');

    // Initialize the service
    this.initialize();

    // List Mirror Configurations
    server.registerTool(
      'mirror_list_configurations',
      {
        description: `Lista configurações de espelhamento no Bitbucket Data Center.

**Funcionalidades:**
- Listagem de configurações
- Filtros e paginação
- Informações de status

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de configurações de espelhamento.`,
        inputSchema: ListConfigurationsSchema.shape,
      },
      async (params: z.infer<typeof ListConfigurationsSchema>) => {
        const validatedParams = ListConfigurationsSchema.parse(params);
        return await this.listConfigurations(validatedParams.output);
      }
    );

    // Create Mirror Configuration
    server.registerTool(
      'mirror_create_configuration',
      {
        description: `Cria uma nova configuração de espelhamento no Bitbucket Data Center.

**Funcionalidades:**
- Criação de configurações
- Configuração de sincronização
- Metadados da configuração

**Parâmetros:**
- \`name\`: Nome da configuração
- \`sourceUrl\`: URL da fonte
- \`targetProjectKey\`: Chave do projeto de destino
- \`targetRepositorySlug\`: Slug do repositório de destino
- \`schedule\`: Agendamento (opcional)
- \`enabled\`: Se a configuração está habilitada (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes da configuração criada.`,
        inputSchema: CreateConfigurationSchema.shape,
      },
      async (params: z.infer<typeof CreateConfigurationSchema>) => {
        const validatedParams = CreateConfigurationSchema.parse(params);
        return await this.createConfiguration(
          {
            name: validatedParams.name,
            sourceUrl: validatedParams.sourceUrl,
            targetProjectKey: validatedParams.targetProjectKey,
            targetRepositorySlug: validatedParams.targetRepositorySlug,
            schedule: validatedParams.schedule,
            enabled: validatedParams.enabled,
          },
          validatedParams.output
        );
      }
    );

    // Update Mirror Configuration
    server.registerTool(
      'mirror_update_configuration',
      {
        description: `Atualiza uma configuração de espelhamento existente no Bitbucket Data Center.

**Funcionalidades:**
- Atualização de configurações
- Modificação de parâmetros
- Alteração de status

**Parâmetros:**
- \`configurationId\`: ID da configuração
- \`name\`: Novo nome da configuração (opcional)
- \`sourceUrl\`: Nova URL da fonte (opcional)
- \`schedule\`: Novo agendamento (opcional)
- \`enabled\`: Se a configuração está habilitada (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes da configuração atualizada.`,
        inputSchema: UpdateConfigurationSchema.shape,
      },
      async (params: z.infer<typeof UpdateConfigurationSchema>) => {
        const validatedParams = UpdateConfigurationSchema.parse(params);
        return await this.updateConfiguration(
          validatedParams.configurationId,
          {
            name: validatedParams.name,
            sourceUrl: validatedParams.sourceUrl,
            schedule: validatedParams.schedule,
            enabled: validatedParams.enabled,
          },
          validatedParams.output
        );
      }
    );

    // Delete Mirror Configuration
    server.registerTool(
      'mirror_delete_configuration',
      {
        description: `Exclui uma configuração de espelhamento no Bitbucket Data Center.

**Funcionalidades:**
- Remoção de configurações
- Limpeza de recursos
- Verificação de dependências

**Parâmetros:**
- \`configurationId\`: ID da configuração

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com confirmação da exclusão.`,
        inputSchema: DeleteConfigurationSchema.shape,
      },
      async (params: z.infer<typeof DeleteConfigurationSchema>) => {
        const validatedParams = DeleteConfigurationSchema.parse(params);
        return await this.deleteConfiguration(
          validatedParams.configurationId,
          validatedParams.output
        );
      }
    );

    // Sync Mirror
    server.registerTool(
      'mirror_start',
      {
        description: `Inicia um espelhamento no Bitbucket Data Center.

**Funcionalidades:**
- Sincronização manual
- Execução de espelhamento
- Monitoramento de progresso

**Parâmetros:**
- \`configurationId\`: ID da configuração

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os resultados da sincronização.`,
        inputSchema: StartMirrorSchema.shape,
      },
      async (params: z.infer<typeof StartMirrorSchema>) => {
        const validatedParams = StartMirrorSchema.parse(params);
        return await this.startSync(validatedParams.configurationId, validatedParams.output);
      }
    );

    // Get Mirror Sync Results
    server.registerTool(
      'mirror_get_sync_results',
      {
        description: `Obtém resultados de sincronização de espelhamento no Bitbucket Data Center.

**Funcionalidades:**
- Resultados de sincronização
- Histórico de execução
- Estatísticas de performance

**Parâmetros:**
- \`configurationId\`: ID da configuração

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os resultados de sincronização.`,
        inputSchema: GetSyncResultsSchema.shape,
      },
      async (params: z.infer<typeof GetSyncResultsSchema>) => {
        const validatedParams = GetSyncResultsSchema.parse(params);
        return await this.getSyncResults(validatedParams.configurationId, validatedParams.output);
      }
    );

    // Get Mirror Configuration
    server.registerTool(
      'mirror_get_configuration',
      {
        description: `Obtém uma configuração de espelhamento específica no Bitbucket Data Center.

**Funcionalidades:**
- Detalhes da configuração
- Status atual
- Informações de sincronização

**Parâmetros:**
- \`configurationId\`: ID da configuração de espelhamento

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes da configuração.`,
        inputSchema: GetConfigurationSchema.shape,
      },
      async (params: z.infer<typeof GetConfigurationSchema>) => {
        const validatedParams = GetConfigurationSchema.parse(params);
        return await this.getConfiguration(validatedParams.configurationId, validatedParams.output);
      }
    );

    // Stop Mirror Sync
    server.registerTool(
      'mirror_stop_sync',
      {
        description: `Para a sincronização de uma configuração de espelhamento no Bitbucket Data Center.

**Funcionalidades:**
- Parada da sincronização
- Status atualizado
- Controle de processo

**Parâmetros:**
- \`configurationId\`: ID da configuração de espelhamento

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o resultado da operação.`,
        inputSchema: StopMirrorSyncSchema.shape,
      },
      async (params: z.infer<typeof StopMirrorSyncSchema>) => {
        const validatedParams = StopMirrorSyncSchema.parse(params);
        return await this.stopSync(validatedParams.configurationId, validatedParams.output);
      }
    );

    // Get Mirror Sync Result
    server.registerTool(
      'mirror_get_sync_result',
      {
        description: `Obtém um resultado específico de sincronização no Bitbucket Data Center.

**Funcionalidades:**
- Detalhes do resultado
- Status da sincronização
- Informações de erro

**Parâmetros:**
- \`syncResultId\`: ID do resultado de sincronização

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do resultado.`,
        inputSchema: GetSyncResultSchema.shape,
      },
      async (params: z.infer<typeof GetSyncResultSchema>) => {
        const validatedParams = GetSyncResultSchema.parse(params);
        return await this.getSyncResult(1, validatedParams.syncResultId, validatedParams.output);
      }
    );

    // List Upstream Mirrors
    server.registerTool(
      'mirror_list_upstream_mirrors',
      {
        description: `Lista espelhos upstream no Bitbucket Data Center.

**Funcionalidades:**
- Listagem de espelhos upstream
- Filtros e paginação
- Informações de status

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de espelhos upstream.`,
        inputSchema: ListUpstreamMirrorsSchema.shape,
      },
      async (params: z.infer<typeof ListUpstreamMirrorsSchema>) => {
        const validatedParams = ListUpstreamMirrorsSchema.parse(params);
        return await this.listUpstreamMirrors({}, validatedParams.output);
      }
    );

    // Create Upstream Mirror
    server.registerTool(
      'mirror_create_upstream_mirror',
      {
        description: `Cria um espelho upstream no Bitbucket Data Center.

**Funcionalidades:**
- Criação de espelho upstream
- Configuração de sincronização
- Autenticação e filtros

**Parâmetros:**
- \`name\`: Nome do espelho upstream
- \`url\`: URL do repositório fonte
- \`username\`: Nome de usuário (opcional)
- \`password\`: Senha (opcional)
- \`enabled\`: Se o espelho está habilitado (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do espelho criado.`,
        inputSchema: CreateUpstreamMirrorSchema.shape,
      },
      async (params: z.infer<typeof CreateUpstreamMirrorSchema>) => {
        const validatedParams = CreateUpstreamMirrorSchema.parse(params);
        return await this.createUpstreamMirror(
          {
            name: validatedParams.name,
            url: validatedParams.url,
            username: validatedParams.username,
            password: validatedParams.password,
            enabled: validatedParams.enabled,
          },
          validatedParams.output
        );
      }
    );

    // Get Upstream Mirror
    server.registerTool(
      'mirror_get_upstream_mirror',
      {
        description: `Obtém um espelho upstream específico no Bitbucket Data Center.

**Funcionalidades:**
- Detalhes do espelho upstream
- Status atual
- Informações de configuração

**Parâmetros:**
- \`mirrorId\`: ID do espelho upstream

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do espelho upstream.`,
        inputSchema: GetUpstreamMirrorSchema.shape,
      },
      async (params: z.infer<typeof GetUpstreamMirrorSchema>) => {
        const validatedParams = GetUpstreamMirrorSchema.parse(params);
        return await this.getUpstreamMirror(validatedParams.mirrorId, validatedParams.output);
      }
    );

    // Update Upstream Mirror
    server.registerTool(
      'mirror_update_upstream_mirror',
      {
        description: `Atualiza um espelho upstream no Bitbucket Data Center.

**Funcionalidades:**
- Atualização de configuração
- Modificação de parâmetros
- Aplicação de mudanças

**Parâmetros:**
- \`mirrorId\`: ID do espelho upstream
- \`name\`: Nome do espelho upstream (opcional)
- \`url\`: URL do repositório fonte (opcional)
- \`username\`: Nome de usuário (opcional)
- \`password\`: Senha (opcional)
- \`enabled\`: Se o espelho está habilitado (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do espelho atualizado.`,
        inputSchema: UpdateUpstreamMirrorSchema.shape,
      },
      async (params: z.infer<typeof UpdateUpstreamMirrorSchema>) => {
        const validatedParams = UpdateUpstreamMirrorSchema.parse(params);
        return await this.updateUpstreamMirror(
          validatedParams.mirrorId,
          {
            name: validatedParams.name,
            url: validatedParams.url,
            username: validatedParams.username,
            password: validatedParams.password,
            enabled: validatedParams.enabled,
          },
          validatedParams.output
        );
      }
    );

    // Delete Upstream Mirror
    server.registerTool(
      'mirror_delete_upstream_mirror',
      {
        description: `Remove um espelho upstream no Bitbucket Data Center.

**Funcionalidades:**
- Remoção de espelho upstream
- Limpeza de configurações
- Confirmação de operação

**Parâmetros:**
- \`mirrorId\`: ID do espelho upstream

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o resultado da operação.`,
        inputSchema: DeleteUpstreamMirrorSchema.shape,
      },
      async (params: z.infer<typeof DeleteUpstreamMirrorSchema>) => {
        const validatedParams = DeleteUpstreamMirrorSchema.parse(params);
        return await this.deleteUpstreamMirror(validatedParams.mirrorId, validatedParams.output);
      }
    );

    // Start Upstream Mirror Sync
    server.registerTool(
      'mirror_start_upstream_sync',
      {
        description: `Inicia a sincronização de um espelho upstream no Bitbucket Data Center.

**Funcionalidades:**
- Início da sincronização
- Controle de processo
- Monitoramento de status

**Parâmetros:**
- \`mirrorId\`: ID do espelho upstream

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o resultado da sincronização.`,
        inputSchema: StartUpstreamMirrorSyncSchema.shape,
      },
      async (params: z.infer<typeof StartUpstreamMirrorSyncSchema>) => {
        const validatedParams = StartUpstreamMirrorSyncSchema.parse(params);
        return await this.startUpstreamMirrorSync(validatedParams.mirrorId, validatedParams.output);
      }
    );

    // Stop Upstream Mirror Sync
    server.registerTool(
      'mirror_stop_upstream_sync',
      {
        description: `Para a sincronização de um espelho upstream no Bitbucket Data Center.

**Funcionalidades:**
- Parada da sincronização
- Status atualizado
- Controle de processo

**Parâmetros:**
- \`mirrorId\`: ID do espelho upstream

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o resultado da operação.`,
        inputSchema: StopUpstreamMirrorSyncSchema.shape,
      },
      async (params: z.infer<typeof StopUpstreamMirrorSyncSchema>) => {
        const validatedParams = StopUpstreamMirrorSyncSchema.parse(params);
        return await this.stopUpstreamMirrorSync(validatedParams.mirrorId, validatedParams.output);
      }
    );

    registerLogger.info('Successfully registered all data center mirroring tools');
  }
}
