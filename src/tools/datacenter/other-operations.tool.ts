/**
 * Data Center Other Operations Tools
 * Ferramentas para operações diversas no Bitbucket Data Center
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPool, Pool } from 'generic-pool';
import { OtherOperationsService } from '../../services/datacenter/other-operations.service.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';
import { createMcpResponse, createErrorResponse } from '../../services/types/base.types.js';
import { z } from 'zod';

// Zod schemas for parameter validation
const ListConfigurationsSchema = z.object({
  category: z.string().optional(),
  name: z.string().optional(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListBackupResultsSchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.string().optional(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetLogEntriesSchema = z.object({
  level: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  search: z.string().optional(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListPluginInformationSchema = z.object({
  name: z.string().optional(),
  status: z.string().optional(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetConfigurationSchema = z.object({
  key: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateConfigurationSchema = z.object({
  key: z.string(),
  value: z.any(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateConfigurationSchema = z.object({
  key: z.string(),
  value: z.any(),
  description: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteConfigurationSchema = z.object({
  key: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateBackupConfigurationSchema = z.object({
  name: z.string(),
  schedule: z.string(),
  storage_location: z.string(),
  enabled: z.boolean().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetBackupConfigurationSchema = z.object({
  backup_id: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateBackupConfigurationSchema = z.object({
  backup_id: z.number(),
  updates: z.any(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteBackupConfigurationSchema = z.object({
  backup_id: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const StartBackupSchema = z.object({
  backup_id: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetBackupResultsSchema = z.object({
  backup_id: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetLogEntrySchema = z.object({
  log_id: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListPluginsSchema = z.object({
  name: z.string().optional(),
  status: z.string().optional(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetPluginSchema = z.object({
  plugin_key: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const EnablePluginSchema = z.object({
  plugin_key: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DisablePluginSchema = z.object({
  plugin_key: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const OutputOnlySchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

export class DataCenterOtherOperationsTools {
  private static logger = Logger.forContext('DataCenterOtherOperationsTools');
  private static otherOperationsServicePool: Pool<OtherOperationsService>;

  static initialize(): void {
    const otherOperationsServiceFactory = {
      create: async () =>
        new OtherOperationsService(new ApiClient(), Logger.forContext('OtherOperationsService')),
      destroy: async () => {},
    };

    this.otherOperationsServicePool = createPool(otherOperationsServiceFactory, {
      min: 2,
      max: 10,
    });
    this.logger.info('Data Center Other Operations tools initialized');
  }

  static async getSystemInformation(output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getSystemInformation');
    let service: OtherOperationsService | null = null;

    try {
      service = await this.otherOperationsServicePool.acquire();
      methodLogger.debug('Getting system information');

      const result = await service.getSystemInformation();

      methodLogger.info('Successfully retrieved system information');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get system information:', error);
      if (service) {
        this.otherOperationsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.otherOperationsServicePool.release(service);
      }
    }
  }

  static async getHealthCheck(output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getHealthCheck');
    let service: OtherOperationsService | null = null;

    try {
      service = await this.otherOperationsServicePool.acquire();
      methodLogger.debug('Getting health check');

      const result = await service.getHealthCheck();

      methodLogger.info('Successfully retrieved health check');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get health check:', error);
      if (service) {
        this.otherOperationsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.otherOperationsServicePool.release(service);
      }
    }
  }

  static async getMetrics(output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getMetrics');
    let service: OtherOperationsService | null = null;

    try {
      service = await this.otherOperationsServicePool.acquire();
      methodLogger.debug('Getting metrics');

      const result = await service.getMetrics();

      methodLogger.info('Successfully retrieved metrics');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get metrics:', error);
      if (service) {
        this.otherOperationsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.otherOperationsServicePool.release(service);
      }
    }
  }

  static async listConfigurations(params: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('listConfigurations');
    let service: OtherOperationsService | null = null;

    try {
      service = await this.otherOperationsServicePool.acquire();
      methodLogger.debug('Listing configurations:', params);

      const result = await service.listConfigurations(params);

      methodLogger.info('Successfully listed configurations');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list configurations:', error);
      if (service) {
        this.otherOperationsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.otherOperationsServicePool.release(service);
      }
    }
  }

  static async getSystemBackupConfiguration(output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getSystemBackupConfiguration');
    let service: OtherOperationsService | null = null;

    try {
      service = await this.otherOperationsServicePool.acquire();
      methodLogger.debug('Getting system backup configuration');

      const result = await service.getBackupConfiguration(1);

      methodLogger.info('Successfully retrieved system backup configuration');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get system backup configuration:', error);
      if (service) {
        this.otherOperationsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.otherOperationsServicePool.release(service);
      }
    }
  }

  static async listBackupResults(params: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('listBackupResults');
    let service: OtherOperationsService | null = null;

    try {
      service = await this.otherOperationsServicePool.acquire();
      methodLogger.debug('Listing backup results:', params);

      const result = await service.getBackupResults(1);

      methodLogger.info('Successfully listed backup results');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list backup results:', error);
      if (service) {
        this.otherOperationsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.otherOperationsServicePool.release(service);
      }
    }
  }

  static async getLogEntries(params: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getLogEntries');
    let service: OtherOperationsService | null = null;

    try {
      service = await this.otherOperationsServicePool.acquire();
      methodLogger.debug('Getting log entries:', params);

      const result = await service.getLogEntries(params);

      methodLogger.info('Successfully retrieved log entries');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get log entries:', error);
      if (service) {
        this.otherOperationsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.otherOperationsServicePool.release(service);
      }
    }
  }

  static async listPluginInformation(params: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('listPluginInformation');
    let service: OtherOperationsService | null = null;

    try {
      service = await this.otherOperationsServicePool.acquire();
      methodLogger.debug('Listing plugin information:', params);

      const result = await service.listPlugins(params);

      methodLogger.info('Successfully listed plugin information');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list plugin information:', error);
      if (service) {
        this.otherOperationsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.otherOperationsServicePool.release(service);
      }
    }
  }

  static async getConfiguration(key: string, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getConfiguration');
    let service: OtherOperationsService | null = null;

    try {
      service = await this.otherOperationsServicePool.acquire();
      methodLogger.debug('Getting configuration:', { key });

      const result = await service.getConfiguration(key);

      methodLogger.info('Successfully retrieved configuration');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get configuration:', error);
      if (service) {
        this.otherOperationsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.otherOperationsServicePool.release(service);
      }
    }
  }

  static async updateConfiguration(key: string, value: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('updateConfiguration');
    let service: OtherOperationsService | null = null;

    try {
      service = await this.otherOperationsServicePool.acquire();
      methodLogger.debug('Updating configuration:', { key });

      const result = await service.updateConfiguration(key, value);

      methodLogger.info('Successfully updated configuration');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update configuration:', error);
      if (service) {
        this.otherOperationsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.otherOperationsServicePool.release(service);
      }
    }
  }

  static async createConfiguration(params: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('createConfiguration');
    let service: OtherOperationsService | null = null;

    try {
      service = await this.otherOperationsServicePool.acquire();
      methodLogger.debug('Creating configuration:', { key: params.key });

      const result = await service.createConfiguration(params);

      methodLogger.info('Successfully created configuration');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create configuration:', error);
      if (service) {
        this.otherOperationsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.otherOperationsServicePool.release(service);
      }
    }
  }

  static async deleteConfiguration(key: string, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('deleteConfiguration');
    let service: OtherOperationsService | null = null;

    try {
      service = await this.otherOperationsServicePool.acquire();
      methodLogger.debug('Deleting configuration:', { key });

      await service.deleteConfiguration(key);

      methodLogger.info('Successfully deleted configuration');
      return createMcpResponse({ message: 'Configuration deleted successfully' }, output);
    } catch (error) {
      methodLogger.error('Failed to delete configuration:', error);
      if (service) {
        this.otherOperationsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.otherOperationsServicePool.release(service);
      }
    }
  }

  static async listBackupConfigurations(output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('listBackupConfigurations');
    let service: OtherOperationsService | null = null;

    try {
      service = await this.otherOperationsServicePool.acquire();
      methodLogger.debug('Listing backup configurations');

      const result = await service.listBackupConfigurations();

      methodLogger.info('Successfully listed backup configurations');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list backup configurations:', error);
      if (service) {
        this.otherOperationsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.otherOperationsServicePool.release(service);
      }
    }
  }

  static async createBackupConfiguration(params: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('createBackupConfiguration');
    let service: OtherOperationsService | null = null;

    try {
      service = await this.otherOperationsServicePool.acquire();
      methodLogger.debug('Creating backup configuration:', { name: params.name });

      const result = await service.createBackupConfiguration(params);

      methodLogger.info('Successfully created backup configuration');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create backup configuration:', error);
      if (service) {
        this.otherOperationsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.otherOperationsServicePool.release(service);
      }
    }
  }

  static async getBackupConfiguration(backupId: number, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getBackupConfiguration');
    let service: OtherOperationsService | null = null;

    try {
      service = await this.otherOperationsServicePool.acquire();
      methodLogger.debug('Getting backup configuration:', { backup_id: backupId });

      const result = await service.getBackupConfiguration(backupId);

      methodLogger.info('Successfully retrieved backup configuration');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get backup configuration:', error);
      if (service) {
        this.otherOperationsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.otherOperationsServicePool.release(service);
      }
    }
  }

  static async updateBackupConfiguration(
    backupId: number,
    updates: any,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('updateBackupConfiguration');
    let service: OtherOperationsService | null = null;

    try {
      service = await this.otherOperationsServicePool.acquire();
      methodLogger.debug('Updating backup configuration:', { backup_id: backupId });

      const result = await service.updateBackupConfiguration(backupId, updates);

      methodLogger.info('Successfully updated backup configuration');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update backup configuration:', error);
      if (service) {
        this.otherOperationsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.otherOperationsServicePool.release(service);
      }
    }
  }

  static async deleteBackupConfiguration(backupId: number, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('deleteBackupConfiguration');
    let service: OtherOperationsService | null = null;

    try {
      service = await this.otherOperationsServicePool.acquire();
      methodLogger.debug('Deleting backup configuration:', { backup_id: backupId });

      await service.deleteBackupConfiguration(backupId);

      methodLogger.info('Successfully deleted backup configuration');
      return createMcpResponse({ message: 'Backup configuration deleted successfully' }, output);
    } catch (error) {
      methodLogger.error('Failed to delete backup configuration:', error);
      if (service) {
        this.otherOperationsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.otherOperationsServicePool.release(service);
      }
    }
  }

  static async startBackup(backupId: number, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('startBackup');
    let service: OtherOperationsService | null = null;

    try {
      service = await this.otherOperationsServicePool.acquire();
      methodLogger.debug('Starting backup:', { backup_id: backupId });

      const result = await service.startBackup(backupId);

      methodLogger.info('Successfully started backup');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to start backup:', error);
      if (service) {
        this.otherOperationsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.otherOperationsServicePool.release(service);
      }
    }
  }

  static async getBackupResults(backupId: number, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getBackupResults');
    let service: OtherOperationsService | null = null;

    try {
      service = await this.otherOperationsServicePool.acquire();
      methodLogger.debug('Getting backup results:', { backup_id: backupId });

      const result = await service.getBackupResults(backupId);

      methodLogger.info('Successfully retrieved backup results');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get backup results:', error);
      if (service) {
        this.otherOperationsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.otherOperationsServicePool.release(service);
      }
    }
  }

  static async getLogEntry(logId: number, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getLogEntry');
    let service: OtherOperationsService | null = null;

    try {
      service = await this.otherOperationsServicePool.acquire();
      methodLogger.debug('Getting log entry:', { log_id: logId });

      const result = await service.getLogEntry(logId);

      methodLogger.info('Successfully retrieved log entry');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get log entry:', error);
      if (service) {
        this.otherOperationsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.otherOperationsServicePool.release(service);
      }
    }
  }

  static async listPlugins(params: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('listPlugins');
    let service: OtherOperationsService | null = null;

    try {
      service = await this.otherOperationsServicePool.acquire();
      methodLogger.debug('Listing plugins:', params);

      const result = await service.listPlugins(params);

      methodLogger.info('Successfully listed plugins');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list plugins:', error);
      if (service) {
        this.otherOperationsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.otherOperationsServicePool.release(service);
      }
    }
  }

  static async getPlugin(pluginKey: string, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getPlugin');
    let service: OtherOperationsService | null = null;

    try {
      service = await this.otherOperationsServicePool.acquire();
      methodLogger.debug('Getting plugin:', { plugin_key: pluginKey });

      const result = await service.getPlugin(pluginKey);

      methodLogger.info('Successfully retrieved plugin');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get plugin:', error);
      if (service) {
        this.otherOperationsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.otherOperationsServicePool.release(service);
      }
    }
  }

  static async enablePlugin(pluginKey: string, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('enablePlugin');
    let service: OtherOperationsService | null = null;

    try {
      service = await this.otherOperationsServicePool.acquire();
      methodLogger.debug('Enabling plugin:', { plugin_key: pluginKey });

      await service.enablePlugin(pluginKey);

      methodLogger.info('Successfully enabled plugin');
      return createMcpResponse({ message: 'Plugin enabled successfully' }, output);
    } catch (error) {
      methodLogger.error('Failed to enable plugin:', error);
      if (service) {
        this.otherOperationsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.otherOperationsServicePool.release(service);
      }
    }
  }

  static async disablePlugin(pluginKey: string, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('disablePlugin');
    let service: OtherOperationsService | null = null;

    try {
      service = await this.otherOperationsServicePool.acquire();
      methodLogger.debug('Disabling plugin:', { plugin_key: pluginKey });

      await service.disablePlugin(pluginKey);

      methodLogger.info('Successfully disabled plugin');
      return createMcpResponse({ message: 'Plugin disabled successfully' }, output);
    } catch (error) {
      methodLogger.error('Failed to disable plugin:', error);
      if (service) {
        this.otherOperationsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.otherOperationsServicePool.release(service);
      }
    }
  }

  static async restartSystem(output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('restartSystem');
    let service: OtherOperationsService | null = null;

    try {
      service = await this.otherOperationsServicePool.acquire();
      methodLogger.debug('Restarting system');

      const result = await service.restartSystem();

      methodLogger.info('Successfully restarted system');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to restart system:', error);
      if (service) {
        this.otherOperationsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.otherOperationsServicePool.release(service);
      }
    }
  }

  static async shutdownSystem(output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('shutdownSystem');
    let service: OtherOperationsService | null = null;

    try {
      service = await this.otherOperationsServicePool.acquire();
      methodLogger.debug('Shutting down system');

      const result = await service.shutdownSystem();

      methodLogger.info('Successfully shut down system');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to shutdown system:', error);
      if (service) {
        this.otherOperationsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.otherOperationsServicePool.release(service);
      }
    }
  }

  static register(server: McpServer): void {
    const registerLogger = this.logger.forMethod('register');

    // Initialize the service
    this.initialize();

    // Get System Information
    server.registerTool(
      'ops_get_system_information',
      {
        description: `Obtém informações do sistema no Bitbucket Data Center.

**Funcionalidades:**
- Informações do sistema
- Versão e build
- Configurações básicas

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com as informações do sistema.`,
        inputSchema: OutputOnlySchema.shape,
      },
      async (params: z.infer<typeof OutputOnlySchema>) => {
        const validatedParams = OutputOnlySchema.parse(params);
        return await this.getSystemInformation(validatedParams.output);
      }
    );

    // Get Health Check
    server.registerTool(
      'ops_get_health_check',
      {
        description: `Obtém status de saúde do sistema no Bitbucket Data Center.

**Funcionalidades:**
- Verificação de saúde
- Status dos serviços
- Indicadores de performance

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o status de saúde do sistema.`,
        inputSchema: OutputOnlySchema.shape,
      },
      async (params: z.infer<typeof OutputOnlySchema>) => {
        const validatedParams = OutputOnlySchema.parse(params);
        return await this.getHealthCheck(validatedParams.output);
      }
    );

    // Get Metrics
    server.registerTool(
      'ops_get_metrics',
      {
        description: `Obtém métricas do sistema no Bitbucket Data Center.

**Funcionalidades:**
- Métricas de performance
- Estatísticas de uso
- Indicadores de sistema

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com as métricas do sistema.`,
        inputSchema: OutputOnlySchema.shape,
      },
      async (params: z.infer<typeof OutputOnlySchema>) => {
        const validatedParams = OutputOnlySchema.parse(params);
        return await this.getMetrics(validatedParams.output);
      }
    );

    // List Configurations
    server.registerTool(
      'ops_list_configurations',
      {
        description: `Lista configurações do sistema no Bitbucket Data Center.

**Funcionalidades:**
- Listagem de configurações
- Filtros e paginação
- Informações de configuração

**Parâmetros:**
- \`category\`: Categoria da configuração (opcional)
- \`name\`: Nome da configuração (opcional)
- \`start\`: Índice de início para paginação (opcional)
- \`limit\`: Número máximo de resultados (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de configurações.`,
        inputSchema: ListConfigurationsSchema.shape,
      },
      async (params: z.infer<typeof ListConfigurationsSchema>) => {
        const validatedParams = ListConfigurationsSchema.parse(params);
        return await this.listConfigurations(
          {
            category: validatedParams.category,
            key: validatedParams.name,
            start: validatedParams.start,
            limit: validatedParams.limit,
          },
          validatedParams.output
        );
      }
    );

    // Get System Backup Configuration
    server.registerTool(
      'ops_get_system_backup_configuration',
      {
        description: `Obtém configuração de backup do sistema no Bitbucket Data Center.

**Funcionalidades:**
- Configuração de backup
- Agendamentos
- Configurações de armazenamento

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a configuração de backup.`,
        inputSchema: OutputOnlySchema.shape,
      },
      async (params: z.infer<typeof OutputOnlySchema>) => {
        const validatedParams = OutputOnlySchema.parse(params);
        return await this.getSystemBackupConfiguration(validatedParams.output);
      }
    );

    // List Backup Results
    server.registerTool(
      'ops_list_backup_results',
      {
        description: `Lista resultados de backup no Bitbucket Data Center.

**Funcionalidades:**
- Listagem de backups
- Status de execução
- Histórico de backups

**Parâmetros:**
- \`start_date\`: Data de início (opcional)
- \`end_date\`: Data de fim (opcional)
- \`status\`: Status do backup (opcional)
- \`start\`: Índice de início para paginação (opcional)
- \`limit\`: Número máximo de resultados (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de resultados de backup.`,
        inputSchema: ListBackupResultsSchema.shape,
      },
      async (params: z.infer<typeof ListBackupResultsSchema>) => {
        const validatedParams = ListBackupResultsSchema.parse(params);
        return await this.listBackupResults(
          {
            start_date: validatedParams.start_date,
            end_date: validatedParams.end_date,
            status: validatedParams.status,
            start: validatedParams.start,
            limit: validatedParams.limit,
          },
          validatedParams.output
        );
      }
    );

    // Get Log Entries
    server.registerTool(
      'ops_get_log_entries',
      {
        description: `Obtém entradas de log no Bitbucket Data Center.

**Funcionalidades:**
- Entradas de log
- Filtros por nível e data
- Busca em logs

**Parâmetros:**
- \`level\`: Nível do log (opcional)
- \`start_date\`: Data de início (opcional)
- \`end_date\`: Data de fim (opcional)
- \`search\`: Termo de busca (opcional)
- \`start\`: Índice de início para paginação (opcional)
- \`limit\`: Número máximo de resultados (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com as entradas de log.`,
        inputSchema: GetLogEntriesSchema.shape,
      },
      async (params: z.infer<typeof GetLogEntriesSchema>) => {
        const validatedParams = GetLogEntriesSchema.parse(params);
        return await this.getLogEntries(
          {
            level: validatedParams.level,
            fromDate: validatedParams.start_date,
            toDate: validatedParams.end_date,
            message: validatedParams.search,
            start: validatedParams.start,
            limit: validatedParams.limit,
          },
          validatedParams.output
        );
      }
    );

    // List Plugin Information
    server.registerTool(
      'ops_list_plugin_information',
      {
        description: `Lista informações de plugins no Bitbucket Data Center.

**Funcionalidades:**
- Listagem de plugins
- Status e versões
- Configurações de plugins

**Parâmetros:**
- \`name\`: Nome do plugin (opcional)
- \`status\`: Status do plugin (opcional)
- \`start\`: Índice de início para paginação (opcional)
- \`limit\`: Número máximo de resultados (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de informações de plugins.`,
        inputSchema: ListPluginInformationSchema.shape,
      },
      async (params: z.infer<typeof ListPluginInformationSchema>) => {
        const validatedParams = ListPluginInformationSchema.parse(params);
        return await this.listPluginInformation(
          {
            key: validatedParams.name,
            enabled: validatedParams.status === 'enabled',
            start: validatedParams.start,
            limit: validatedParams.limit,
          },
          validatedParams.output
        );
      }
    );

    // Get Configuration
    server.registerTool(
      'ops_get_configuration',
      {
        description: `Obtém uma configuração específica no Bitbucket Data Center.

**Funcionalidades:**
- Detalhes da configuração
- Valor atual
- Metadados da configuração

**Parâmetros:**
- \`key\`: Chave da configuração

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes da configuração.`,
        inputSchema: GetConfigurationSchema.shape,
      },
      async (params: z.infer<typeof GetConfigurationSchema>) => {
        const validatedParams = GetConfigurationSchema.parse(params);
        return await this.getConfiguration(validatedParams.key, validatedParams.output);
      }
    );

    // Update Configuration
    server.registerTool(
      'ops_update_configuration',
      {
        description: `Atualiza uma configuração no Bitbucket Data Center.

**Funcionalidades:**
- Atualização de configurações
- Modificação de valores
- Aplicação de mudanças

**Parâmetros:**
- \`key\`: Chave da configuração
- \`value\`: Novo valor da configuração

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a configuração atualizada.`,
        inputSchema: UpdateConfigurationSchema.shape,
      },
      async (params: z.infer<typeof UpdateConfigurationSchema>) => {
        const validatedParams = UpdateConfigurationSchema.parse(params);
        return await this.updateConfiguration(
          validatedParams.key,
          validatedParams.value,
          validatedParams.output
        );
      }
    );

    // Create Configuration
    server.registerTool(
      'ops_create_configuration',
      {
        description: `Cria uma nova configuração no Bitbucket Data Center.

**Funcionalidades:**
- Criação de configurações
- Definição de valores
- Metadados da configuração

**Parâmetros:**
- \`key\`: Chave da configuração
- \`value\`: Valor da configuração
- \`description\`: Descrição da configuração (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a configuração criada.`,
        inputSchema: CreateConfigurationSchema.shape,
      },
      async (params: z.infer<typeof CreateConfigurationSchema>) => {
        const validatedParams = CreateConfigurationSchema.parse(params);
        return await this.createConfiguration(
          {
            key: validatedParams.key,
            value: validatedParams.value,
            type: 'STRING',
            description: validatedParams.description,
            category: 'general',
          },
          validatedParams.output
        );
      }
    );

    // Delete Configuration
    server.registerTool(
      'ops_delete_configuration',
      {
        description: `Remove uma configuração no Bitbucket Data Center.

**Funcionalidades:**
- Remoção de configurações
- Limpeza de valores
- Confirmação de exclusão

**Parâmetros:**
- \`key\`: Chave da configuração

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a confirmação da remoção.`,
        inputSchema: DeleteConfigurationSchema.shape,
      },
      async (params: z.infer<typeof DeleteConfigurationSchema>) => {
        const validatedParams = DeleteConfigurationSchema.parse(params);
        return await this.deleteConfiguration(validatedParams.key, validatedParams.output);
      }
    );

    // List Backup Configurations
    server.registerTool(
      'ops_list_backup_configurations',
      {
        description: `Lista configurações de backup no Bitbucket Data Center.

**Funcionalidades:**
- Listagem de configurações de backup
- Informações de agendamento
- Status das configurações

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de configurações de backup.`,
        inputSchema: OutputOnlySchema.shape,
      },
      async (params: z.infer<typeof OutputOnlySchema>) => {
        const validatedParams = OutputOnlySchema.parse(params);
        return await this.listBackupConfigurations(validatedParams.output);
      }
    );

    // Create Backup Configuration
    server.registerTool(
      'ops_create_backup_configuration',
      {
        description: `Cria uma nova configuração de backup no Bitbucket Data Center.

**Funcionalidades:**
- Criação de configurações de backup
- Definição de agendamento
- Configuração de armazenamento

**Parâmetros:**
- \`name\`: Nome da configuração
- \`schedule\`: Agendamento do backup
- \`storage_location\`: Local de armazenamento
- \`enabled\`: Se está habilitado (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a configuração de backup criada.`,
        inputSchema: CreateBackupConfigurationSchema.shape,
      },
      async (params: z.infer<typeof CreateBackupConfigurationSchema>) => {
        const validatedParams = CreateBackupConfigurationSchema.parse(params);
        return await this.createBackupConfiguration(
          {
            name: validatedParams.name,
            schedule: {
              enabled: true,
              cronExpression: validatedParams.schedule,
              timezone: 'UTC',
            },
            location: {
              type: 'LOCAL',
              path: validatedParams.storage_location,
            },
            retention: {
              days: 30,
              maxBackups: 10,
            },
            enabled: validatedParams.enabled,
          },
          validatedParams.output
        );
      }
    );

    // Get Backup Configuration
    server.registerTool(
      'ops_get_backup_configuration',
      {
        description: `Obtém uma configuração de backup específica no Bitbucket Data Center.

**Funcionalidades:**
- Detalhes da configuração de backup
- Informações de agendamento
- Status da configuração

**Parâmetros:**
- \`backup_id\`: ID da configuração de backup

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes da configuração de backup.`,
        inputSchema: GetBackupConfigurationSchema.shape,
      },
      async (params: z.infer<typeof GetBackupConfigurationSchema>) => {
        const validatedParams = GetBackupConfigurationSchema.parse(params);
        return await this.getBackupConfiguration(validatedParams.backup_id, validatedParams.output);
      }
    );

    // Update Backup Configuration
    server.registerTool(
      'ops_update_backup_configuration',
      {
        description: `Atualiza uma configuração de backup no Bitbucket Data Center.

**Funcionalidades:**
- Atualização de configurações de backup
- Modificação de agendamento
- Alteração de configurações

**Parâmetros:**
- \`backup_id\`: ID da configuração de backup
- \`updates\`: Objeto com as atualizações

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a configuração de backup atualizada.`,
        inputSchema: UpdateBackupConfigurationSchema.shape,
      },
      async (params: z.infer<typeof UpdateBackupConfigurationSchema>) => {
        const validatedParams = UpdateBackupConfigurationSchema.parse(params);
        return await this.updateBackupConfiguration(
          validatedParams.backup_id,
          validatedParams.updates,
          validatedParams.output
        );
      }
    );

    // Delete Backup Configuration
    server.registerTool(
      'ops_delete_backup_configuration',
      {
        description: `Remove uma configuração de backup no Bitbucket Data Center.

**Funcionalidades:**
- Remoção de configurações de backup
- Limpeza de agendamentos
- Confirmação de exclusão

**Parâmetros:**
- \`backup_id\`: ID da configuração de backup

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a confirmação da remoção.`,
        inputSchema: DeleteBackupConfigurationSchema.shape,
      },
      async (params: z.infer<typeof DeleteBackupConfigurationSchema>) => {
        const validatedParams = DeleteBackupConfigurationSchema.parse(params);
        return await this.deleteBackupConfiguration(
          validatedParams.backup_id,
          validatedParams.output
        );
      }
    );

    // Start Backup
    server.registerTool(
      'ops_start_backup',
      {
        description: `Inicia um backup no Bitbucket Data Center.

**Funcionalidades:**
- Início de backup
- Execução imediata
- Monitoramento de progresso

**Parâmetros:**
- \`backup_id\`: ID da configuração de backup

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o resultado do backup.`,
        inputSchema: StartBackupSchema.shape,
      },
      async (params: z.infer<typeof StartBackupSchema>) => {
        const validatedParams = StartBackupSchema.parse(params);
        return await this.startBackup(validatedParams.backup_id, validatedParams.output);
      }
    );

    // Get Backup Results
    server.registerTool(
      'ops_get_backup_results',
      {
        description: `Obtém resultados de backup no Bitbucket Data Center.

**Funcionalidades:**
- Resultados de backup
- Status de execução
- Histórico de backups

**Parâmetros:**
- \`backup_id\`: ID da configuração de backup

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os resultados de backup.`,
        inputSchema: GetBackupResultsSchema.shape,
      },
      async (params: z.infer<typeof GetBackupResultsSchema>) => {
        const validatedParams = GetBackupResultsSchema.parse(params);
        return await this.getBackupResults(validatedParams.backup_id, validatedParams.output);
      }
    );

    // Get Log Entry
    server.registerTool(
      'ops_get_log_entry',
      {
        description: `Obtém uma entrada de log específica no Bitbucket Data Center.

**Funcionalidades:**
- Detalhes da entrada de log
- Informações específicas
- Metadados do log

**Parâmetros:**
- \`log_id\`: ID da entrada de log

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes da entrada de log.`,
        inputSchema: GetLogEntrySchema.shape,
      },
      async (params: z.infer<typeof GetLogEntrySchema>) => {
        const validatedParams = GetLogEntrySchema.parse(params);
        return await this.getLogEntry(validatedParams.log_id, validatedParams.output);
      }
    );

    // List Plugins
    server.registerTool(
      'ops_list_plugins',
      {
        description: `Lista plugins no Bitbucket Data Center.

**Funcionalidades:**
- Listagem de plugins
- Status e versões
- Configurações de plugins

**Parâmetros:**
- \`name\`: Nome do plugin (opcional)
- \`status\`: Status do plugin (opcional)
- \`start\`: Índice de início para paginação (opcional)
- \`limit\`: Número máximo de resultados (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de plugins.`,
        inputSchema: ListPluginsSchema.shape,
      },
      async (params: z.infer<typeof ListPluginsSchema>) => {
        const validatedParams = ListPluginsSchema.parse(params);
        return await this.listPlugins(
          {
            key: validatedParams.name,
            enabled: validatedParams.status === 'enabled',
            start: validatedParams.start,
            limit: validatedParams.limit,
          },
          validatedParams.output
        );
      }
    );

    // Get Plugin
    server.registerTool(
      'ops_get_plugin',
      {
        description: `Obtém um plugin específico no Bitbucket Data Center.

**Funcionalidades:**
- Detalhes do plugin
- Configurações específicas
- Status atual

**Parâmetros:**
- \`plugin_key\`: Chave do plugin

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do plugin.`,
        inputSchema: GetPluginSchema.shape,
      },
      async (params: z.infer<typeof GetPluginSchema>) => {
        const validatedParams = GetPluginSchema.parse(params);
        return await this.getPlugin(validatedParams.plugin_key, validatedParams.output);
      }
    );

    // Enable Plugin
    server.registerTool(
      'ops_enable_plugin',
      {
        description: `Habilita um plugin no Bitbucket Data Center.

**Funcionalidades:**
- Ativação de plugins
- Habilitação de funcionalidades
- Configuração de recursos

**Parâmetros:**
- \`plugin_key\`: Chave do plugin

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a confirmação da habilitação.`,
        inputSchema: EnablePluginSchema.shape,
      },
      async (params: z.infer<typeof EnablePluginSchema>) => {
        const validatedParams = EnablePluginSchema.parse(params);
        return await this.enablePlugin(validatedParams.plugin_key, validatedParams.output);
      }
    );

    // Disable Plugin
    server.registerTool(
      'ops_disable_plugin',
      {
        description: `Desabilita um plugin no Bitbucket Data Center.

**Funcionalidades:**
- Desativação de plugins
- Desabilitação de funcionalidades
- Limpeza de recursos

**Parâmetros:**
- \`plugin_key\`: Chave do plugin

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a confirmação da desabilitação.`,
        inputSchema: DisablePluginSchema.shape,
      },
      async (params: z.infer<typeof DisablePluginSchema>) => {
        const validatedParams = DisablePluginSchema.parse(params);
        return await this.disablePlugin(validatedParams.plugin_key, validatedParams.output);
      }
    );

    // Restart System
    server.registerTool(
      'ops_restart_system',
      {
        description: `Reinicia o sistema Bitbucket Data Center.

**Funcionalidades:**
- Reinicialização do sistema
- Recarregamento de configurações
- Reinício de serviços

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a confirmação do reinício.`,
        inputSchema: OutputOnlySchema.shape,
      },
      async (params: z.infer<typeof OutputOnlySchema>) => {
        const validatedParams = OutputOnlySchema.parse(params);
        return await this.restartSystem(validatedParams.output);
      }
    );

    // Shutdown System
    server.registerTool(
      'ops_shutdown_system',
      {
        description: `Desliga o sistema Bitbucket Data Center.

**Funcionalidades:**
- Desligamento do sistema
- Parada de serviços
- Limpeza de recursos

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a confirmação do desligamento.`,
        inputSchema: OutputOnlySchema.shape,
      },
      async (params: z.infer<typeof OutputOnlySchema>) => {
        const validatedParams = OutputOnlySchema.parse(params);
        return await this.shutdownSystem(validatedParams.output);
      }
    );

    registerLogger.info('Successfully registered all data center other operations tools');
  }
}
