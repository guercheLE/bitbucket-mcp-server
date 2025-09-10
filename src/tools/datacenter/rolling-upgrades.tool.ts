import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPool, Pool } from 'generic-pool';
import { RollingUpgradesService } from '../../services/datacenter/rolling-upgrades.service.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';
import { createMcpResponse, createErrorResponse } from '../../services/types/base.types.js';
import { z } from 'zod';

// Zod schemas for parameter validation
const OutputOnlySchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetNodeSchema = z.object({
  node_id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const StartRollingUpgradeSchema = z.object({
  target_version: z.string().optional(),
  force: z.boolean().optional(),
  dry_run: z.boolean().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateRollingUpgradeConfigurationSchema = z.object({
  max_concurrent_upgrades: z.number().optional(),
  upgrade_timeout: z.number().optional(),
  health_check_interval: z.number().optional(),
  auto_rollback: z.boolean().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

/**
 * Data Center Rolling Upgrades Tools
 * Ferramentas para gerenciamento de upgrades em rolagem no Bitbucket Data Center
 */
export class DataCenterRollingUpgradesTools {
  private static logger = Logger.forContext('DataCenterRollingUpgradesTools');
  private static rollingUpgradesServicePool: Pool<RollingUpgradesService>;

  static initialize(): void {
    const rollingUpgradesServiceFactory = {
      create: async () =>
        new RollingUpgradesService(new ApiClient(), Logger.forContext('RollingUpgradesService')),
      destroy: async () => {},
    };

    this.rollingUpgradesServicePool = createPool(rollingUpgradesServiceFactory, {
      min: 2,
      max: 10,
    });
    this.logger.info('Data Center Rolling Upgrades tools initialized');
  }

  // Static Methods
  static async getCluster(output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getCluster');
    let service: RollingUpgradesService | null = null;

    try {
      service = await this.rollingUpgradesServicePool.acquire();
      methodLogger.debug('Getting cluster information');

      const result = await service.getCluster();

      methodLogger.info('Successfully retrieved cluster information');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get cluster information:', error);
      if (service) {
        this.rollingUpgradesServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.rollingUpgradesServicePool.release(service);
      }
    }
  }

  static async getClusterState(output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getClusterState');
    let service: RollingUpgradesService | null = null;

    try {
      service = await this.rollingUpgradesServicePool.acquire();
      methodLogger.debug('Getting cluster state');

      const result = await service.getClusterState();

      methodLogger.info('Successfully retrieved cluster state');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get cluster state:', error);
      if (service) {
        this.rollingUpgradesServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.rollingUpgradesServicePool.release(service);
      }
    }
  }

  static async getNode(nodeId: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getNode');
    let service: RollingUpgradesService | null = null;

    try {
      service = await this.rollingUpgradesServicePool.acquire();
      methodLogger.debug('Getting node information:', {
        node_id: nodeId,
      });

      const result = await service.getNode(nodeId);

      methodLogger.info('Successfully retrieved node information');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get node information:', error);
      if (service) {
        this.rollingUpgradesServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.rollingUpgradesServicePool.release(service);
      }
    }
  }

  static async getNodes(output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getNodes');
    let service: RollingUpgradesService | null = null;

    try {
      service = await this.rollingUpgradesServicePool.acquire();
      methodLogger.debug('Getting all nodes');

      const result = await service.getNodes();

      methodLogger.info('Successfully retrieved all nodes');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get nodes:', error);
      if (service) {
        this.rollingUpgradesServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.rollingUpgradesServicePool.release(service);
      }
    }
  }

  static async getNodeWithBuildInfo(nodeId: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getNodeWithBuildInfo');
    let service: RollingUpgradesService | null = null;

    try {
      service = await this.rollingUpgradesServicePool.acquire();
      methodLogger.debug('Getting node with build info:', {
        node_id: nodeId,
      });

      const result = await service.getNodeWithBuildInfo(nodeId);

      methodLogger.info('Successfully retrieved node with build info');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get node with build info:', error);
      if (service) {
        this.rollingUpgradesServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.rollingUpgradesServicePool.release(service);
      }
    }
  }

  static async startRollingUpgrade(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('startRollingUpgrade');
    let service: RollingUpgradesService | null = null;

    try {
      service = await this.rollingUpgradesServicePool.acquire();
      methodLogger.debug('Starting rolling upgrade:', {
        target_version: params.target_version,
        force: params.force,
        dry_run: params.dry_run,
      });

      const result = await service.startRollingUpgrade({
        targetVersion: params.target_version,
        forceUpgrade: params.force,
        skipHealthChecks: params.dry_run,
      });

      methodLogger.info('Successfully started rolling upgrade');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to start rolling upgrade:', error);
      if (service) {
        this.rollingUpgradesServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.rollingUpgradesServicePool.release(service);
      }
    }
  }

  static async getRollingUpgradeStatus(output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getRollingUpgradeStatus');
    let service: RollingUpgradesService | null = null;

    try {
      service = await this.rollingUpgradesServicePool.acquire();
      methodLogger.debug('Getting rolling upgrade status');

      const result = await service.getRollingUpgradeStatus();

      methodLogger.info('Successfully retrieved rolling upgrade status');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get rolling upgrade status:', error);
      if (service) {
        this.rollingUpgradesServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.rollingUpgradesServicePool.release(service);
      }
    }
  }

  static async cancelRollingUpgrade(output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('cancelRollingUpgrade');
    let service: RollingUpgradesService | null = null;

    try {
      service = await this.rollingUpgradesServicePool.acquire();
      methodLogger.debug('Cancelling rolling upgrade');

      const result = await service.cancelRollingUpgrade();

      methodLogger.info('Successfully cancelled rolling upgrade');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to cancel rolling upgrade:', error);
      if (service) {
        this.rollingUpgradesServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.rollingUpgradesServicePool.release(service);
      }
    }
  }

  static async getRollingUpgradeConfiguration(output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getRollingUpgradeConfiguration');
    let service: RollingUpgradesService | null = null;

    try {
      service = await this.rollingUpgradesServicePool.acquire();
      methodLogger.debug('Getting rolling upgrade configuration');

      const result = await service.getRollingUpgradeConfiguration();

      methodLogger.info('Successfully retrieved rolling upgrade configuration');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get rolling upgrade configuration:', error);
      if (service) {
        this.rollingUpgradesServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.rollingUpgradesServicePool.release(service);
      }
    }
  }

  static async updateRollingUpgradeConfiguration(
    params: any,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('updateRollingUpgradeConfiguration');
    let service: RollingUpgradesService | null = null;

    try {
      service = await this.rollingUpgradesServicePool.acquire();
      methodLogger.debug('Updating rolling upgrade configuration:', {
        max_concurrent_upgrades: params.max_concurrent_upgrades,
        upgrade_timeout: params.upgrade_timeout,
        health_check_interval: params.health_check_interval,
        auto_rollback: params.auto_rollback,
      });

      const result = await service.updateRollingUpgradeConfiguration({
        defaultTargetVersion: params.target_version || '',
        maintenanceWindow: {
          enabled: false,
          startTime: '00:00',
          endTime: '23:59',
          timezone: 'UTC',
        },
        healthCheckSettings: {
          enabled: true,
          timeout: params.upgrade_timeout || 300,
          retryCount: 3,
        },
        rollbackSettings: {
          enabled: true,
          automaticRollback: params.auto_rollback || false,
          rollbackTimeout: 600,
        },
        notificationSettings: {
          email: {
            enabled: false,
            recipients: [],
          },
          webhook: {
            enabled: false,
          },
        },
        nodeSettings: {
          maxConcurrentUpgrades: params.max_concurrent_upgrades || 1,
          upgradeOrder: 'SEQUENTIAL',
        },
      });

      methodLogger.info('Successfully updated rolling upgrade configuration');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update rolling upgrade configuration:', error);
      if (service) {
        this.rollingUpgradesServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.rollingUpgradesServicePool.release(service);
      }
    }
  }

  static async getRollingUpgradeHistory(output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getRollingUpgradeHistory');
    let service: RollingUpgradesService | null = null;

    try {
      service = await this.rollingUpgradesServicePool.acquire();
      methodLogger.debug('Getting rolling upgrade history');

      const result = await service.getRollingUpgradeHistory();

      methodLogger.info('Successfully retrieved rolling upgrade history');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get rolling upgrade history:', error);
      if (service) {
        this.rollingUpgradesServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.rollingUpgradesServicePool.release(service);
      }
    }
  }

  static async enableUpgradeMode(output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('enableUpgradeMode');
    let service: RollingUpgradesService | null = null;

    try {
      service = await this.rollingUpgradesServicePool.acquire();
      methodLogger.debug('Enabling upgrade mode');

      const result = await service.enableUpgradeMode();

      methodLogger.info('Successfully enabled upgrade mode');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to enable upgrade mode:', error);
      if (service) {
        this.rollingUpgradesServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.rollingUpgradesServicePool.release(service);
      }
    }
  }

  static async disableUpgradeMode(output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('disableUpgradeMode');
    let service: RollingUpgradesService | null = null;

    try {
      service = await this.rollingUpgradesServicePool.acquire();
      methodLogger.debug('Disabling upgrade mode');

      const result = await service.disableUpgradeMode();

      methodLogger.info('Successfully disabled upgrade mode');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to disable upgrade mode:', error);
      if (service) {
        this.rollingUpgradesServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.rollingUpgradesServicePool.release(service);
      }
    }
  }

  static async getUpgradeModeStatus(output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getUpgradeModeStatus');
    let service: RollingUpgradesService | null = null;

    try {
      service = await this.rollingUpgradesServicePool.acquire();
      methodLogger.debug('Getting upgrade mode status');

      const result = await service.getUpgradeModeStatus();

      methodLogger.info('Successfully retrieved upgrade mode status');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get upgrade mode status:', error);
      if (service) {
        this.rollingUpgradesServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.rollingUpgradesServicePool.release(service);
      }
    }
  }

  static register(server: McpServer): void {
    const registerLogger = this.logger.forMethod('register');

    // Initialize the service
    this.initialize();

    // Get Cluster Information
    server.registerTool(
      'rolling_upgrades_get_cluster',
      {
        description: `Obtém informações do cluster no Bitbucket Data Center.

**Funcionalidades:**
- Informações do cluster
- Status dos nós
- Configurações do cluster

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com as informações do cluster.`,
        inputSchema: OutputOnlySchema.shape,
      },
      async (params: z.infer<typeof OutputOnlySchema>) => {
        const validatedParams = OutputOnlySchema.parse(params);
        return await this.getCluster(validatedParams.output);
      }
    );

    // Get Cluster State
    server.registerTool(
      'rolling_upgrades_get_cluster_state',
      {
        description: `Obtém o estado do cluster no Bitbucket Data Center.

**Funcionalidades:**
- Estado do cluster
- Status de saúde
- Informações de conectividade

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o estado do cluster.`,
        inputSchema: OutputOnlySchema.shape,
      },
      async (params: z.infer<typeof OutputOnlySchema>) => {
        const validatedParams = OutputOnlySchema.parse(params);
        return await this.getClusterState(validatedParams.output);
      }
    );

    // Get Node Information
    server.registerTool(
      'rolling_upgrades_get_node',
      {
        description: `Obtém informações de um nó específico no cluster do Bitbucket Data Center.

**Funcionalidades:**
- Informações do nó
- Status do nó
- Configurações específicas

**Parâmetros:**
- \`node_id\`: ID do nó

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com as informações do nó.`,
        inputSchema: GetNodeSchema.shape,
      },
      async (params: z.infer<typeof GetNodeSchema>) => {
        const validatedParams = GetNodeSchema.parse(params);
        return await this.getNode(validatedParams.node_id, validatedParams.output);
      }
    );

    // Get All Nodes
    server.registerTool(
      'rolling_upgrades_get_nodes',
      {
        description: `Obtém informações de todos os nós no cluster do Bitbucket Data Center.

**Funcionalidades:**
- Lista de todos os nós
- Status de cada nó
- Informações de conectividade

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de nós.`,
        inputSchema: OutputOnlySchema.shape,
      },
      async (params: z.infer<typeof OutputOnlySchema>) => {
        const validatedParams = OutputOnlySchema.parse(params);
        return await this.getNodes(validatedParams.output);
      }
    );

    // Get Node with Build Info
    server.registerTool(
      'rolling_upgrades_get_node_with_build_info',
      {
        description: `Obtém informações de um nó com detalhes de build no Bitbucket Data Center.

**Funcionalidades:**
- Informações do nó
- Detalhes de build
- Versão e configurações

**Parâmetros:**
- \`node_id\`: ID do nó

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com as informações do nó e build.`,
        inputSchema: GetNodeSchema.shape,
      },
      async (params: z.infer<typeof GetNodeSchema>) => {
        const validatedParams = GetNodeSchema.parse(params);
        return await this.getNodeWithBuildInfo(validatedParams.node_id, validatedParams.output);
      }
    );

    // Start Rolling Upgrade
    server.registerTool(
      'rolling_upgrades_start',
      {
        description: `Inicia um upgrade em rolagem no Bitbucket Data Center.

**Funcionalidades:**
- Início de upgrade
- Configuração de parâmetros
- Monitoramento de progresso

**Parâmetros:**
- \`target_version\`: Versão alvo (opcional)
- \`force\`: Forçar upgrade (opcional)
- \`dry_run\`: Execução de teste (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do upgrade iniciado.`,
        inputSchema: StartRollingUpgradeSchema.shape,
      },
      async (params: z.infer<typeof StartRollingUpgradeSchema>) => {
        const validatedParams = StartRollingUpgradeSchema.parse(params);
        return await this.startRollingUpgrade(
          {
            target_version: validatedParams.target_version,
            force: validatedParams.force,
            dry_run: validatedParams.dry_run,
          },
          validatedParams.output
        );
      }
    );

    // Get Rolling Upgrade Status
    server.registerTool(
      'rolling_upgrades_get_status',
      {
        description: `Obtém o status de um upgrade em rolagem no Bitbucket Data Center.

**Funcionalidades:**
- Status do upgrade
- Progresso atual
- Informações de erro

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o status do upgrade.`,
        inputSchema: OutputOnlySchema.shape,
      },
      async (params: z.infer<typeof OutputOnlySchema>) => {
        const validatedParams = OutputOnlySchema.parse(params);
        return await this.getRollingUpgradeStatus(validatedParams.output);
      }
    );

    // Cancel Rolling Upgrade
    server.registerTool(
      'rolling_upgrades_cancel',
      {
        description: `Cancela um upgrade em rolagem no Bitbucket Data Center.

**Funcionalidades:**
- Cancelamento de upgrade
- Limpeza de recursos
- Restauração de estado

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com confirmação do cancelamento.`,
        inputSchema: OutputOnlySchema.shape,
      },
      async (params: z.infer<typeof OutputOnlySchema>) => {
        const validatedParams = OutputOnlySchema.parse(params);
        return await this.cancelRollingUpgrade(validatedParams.output);
      }
    );

    // Get Rolling Upgrade Configuration
    server.registerTool(
      'rolling_upgrades_get_configuration',
      {
        description: `Obtém a configuração de upgrade em rolagem no Bitbucket Data Center.

**Funcionalidades:**
- Configurações de upgrade
- Parâmetros de execução
- Configurações de segurança

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a configuração de upgrade.`,
        inputSchema: OutputOnlySchema.shape,
      },
      async (params: z.infer<typeof OutputOnlySchema>) => {
        const validatedParams = OutputOnlySchema.parse(params);
        return await this.getRollingUpgradeConfiguration(validatedParams.output);
      }
    );

    // Update Rolling Upgrade Configuration
    server.registerTool(
      'rolling_upgrades_update_configuration',
      {
        description: `Atualiza a configuração de upgrade em rolagem no Bitbucket Data Center.

**Funcionalidades:**
- Atualização de configurações
- Modificação de parâmetros
- Configurações de segurança

**Parâmetros:**
- \`max_concurrent_upgrades\`: Máximo de upgrades simultâneos (opcional)
- \`upgrade_timeout\`: Timeout do upgrade (opcional)
- \`health_check_interval\`: Intervalo de verificação de saúde (opcional)
- \`auto_rollback\`: Rollback automático (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a configuração atualizada.`,
        inputSchema: UpdateRollingUpgradeConfigurationSchema.shape,
      },
      async (params: z.infer<typeof UpdateRollingUpgradeConfigurationSchema>) => {
        const validatedParams = UpdateRollingUpgradeConfigurationSchema.parse(params);
        return await this.updateRollingUpgradeConfiguration(
          {
            max_concurrent_upgrades: validatedParams.max_concurrent_upgrades,
            upgrade_timeout: validatedParams.upgrade_timeout,
            health_check_interval: validatedParams.health_check_interval,
            auto_rollback: validatedParams.auto_rollback,
          },
          validatedParams.output
        );
      }
    );

    // Get Rolling Upgrade History
    server.registerTool(
      'rolling_upgrades_get_history',
      {
        description: `Obtém o histórico de upgrades em rolagem no Bitbucket Data Center.

**Funcionalidades:**
- Histórico de upgrades
- Resultados de execução
- Estatísticas de performance

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o histórico de upgrades.`,
        inputSchema: OutputOnlySchema.shape,
      },
      async (params: z.infer<typeof OutputOnlySchema>) => {
        const validatedParams = OutputOnlySchema.parse(params);
        return await this.getRollingUpgradeHistory(validatedParams.output);
      }
    );

    // Enable Upgrade Mode
    server.registerTool(
      'rolling_upgrades_enable_upgrade_mode',
      {
        description: `Habilita o modo de upgrade no Bitbucket Data Center.

**Funcionalidades:**
- Habilitação do modo
- Preparação para upgrade
- Configurações de segurança

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com confirmação da habilitação.`,
        inputSchema: OutputOnlySchema.shape,
      },
      async (params: z.infer<typeof OutputOnlySchema>) => {
        const validatedParams = OutputOnlySchema.parse(params);
        return await this.enableUpgradeMode(validatedParams.output);
      }
    );

    // Disable Upgrade Mode
    server.registerTool(
      'rolling_upgrades_disable_upgrade_mode',
      {
        description: `Desabilita o modo de upgrade no Bitbucket Data Center.

**Funcionalidades:**
- Desabilitação do modo
- Restauração de operações
- Limpeza de configurações

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com confirmação da desabilitação.`,
        inputSchema: OutputOnlySchema.shape,
      },
      async (params: z.infer<typeof OutputOnlySchema>) => {
        const validatedParams = OutputOnlySchema.parse(params);
        return await this.disableUpgradeMode(validatedParams.output);
      }
    );

    // Get Upgrade Mode Status
    server.registerTool(
      'rolling_upgrades_get_upgrade_mode_status',
      {
        description: `Obtém o status do modo de upgrade no Bitbucket Data Center.

**Funcionalidades:**
- Status do modo
- Estado atual
- Configurações ativas

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o status do modo de upgrade.`,
        inputSchema: OutputOnlySchema.shape,
      },
      async (params: z.infer<typeof OutputOnlySchema>) => {
        const validatedParams = OutputOnlySchema.parse(params);
        return await this.getUpgradeModeStatus(validatedParams.output);
      }
    );

    registerLogger.info('Successfully registered all data center rolling upgrades tools');
  }
}
