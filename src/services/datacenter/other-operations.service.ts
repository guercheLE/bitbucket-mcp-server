/**
 * Other Operations Service for Bitbucket Data Center REST API
 * Based on official documentation: https://developer.atlassian.com/server/bitbucket/rest/v906/intro/
 */

import {
  SystemInformation,
  HealthCheck,
  Metrics,
  Configuration,
  ConfigurationRequest,
  ConfigurationListResponse,
  ConfigurationQueryParams,
  SystemBackupConfiguration,
  SystemBackupConfigurationRequest,
  BackupResult,
  BackupResultListResponse,
  LogEntry,
  LogEntryListResponse,
  LogQueryParams,
  PluginInformation,
  PluginInformationListResponse,
  PluginQueryParams,
} from './types/other-operations.types.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';

export class OtherOperationsService {
  private readonly apiClient: ApiClient;
  private readonly logger: Logger;

  constructor(apiClient: ApiClient, logger: Logger) {
    this.apiClient = apiClient;
    this.logger = logger;
  }

  /**
   * Get system information
   * GET /rest/api/1.0/admin/system/info
   */
  async getSystemInformation(): Promise<SystemInformation> {
    this.logger.info('Getting system information');

    try {
      const response = await this.apiClient.get<SystemInformation>('/admin/system/info');
      this.logger.info('Successfully retrieved system information', {
        version: response.data.version,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get system information', { error });
      throw error;
    }
  }

  /**
   * Get health check
   * GET /rest/api/1.0/admin/health
   */
  async getHealthCheck(): Promise<HealthCheck> {
    this.logger.info('Getting health check');

    try {
      const response = await this.apiClient.get<HealthCheck>('/admin/health');
      this.logger.info('Successfully retrieved health check', { status: response.data.status });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get health check', { error });
      throw error;
    }
  }

  /**
   * Get metrics
   * GET /rest/api/1.0/admin/metrics
   */
  async getMetrics(): Promise<Metrics> {
    this.logger.info('Getting metrics');

    try {
      const response = await this.apiClient.get<Metrics>('/admin/metrics');
      this.logger.info('Successfully retrieved metrics', { timestamp: response.data.timestamp });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get metrics', { error });
      throw error;
    }
  }

  /**
   * List configurations
   * GET /rest/api/1.0/admin/configurations
   */
  async listConfigurations(params?: ConfigurationQueryParams): Promise<ConfigurationListResponse> {
    this.logger.info('Listing configurations', { params });

    try {
      const response = await this.apiClient.get<ConfigurationListResponse>(
        '/admin/configurations',
        { params }
      );
      this.logger.info('Successfully listed configurations', {
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list configurations', { params, error });
      throw error;
    }
  }

  /**
   * Get configuration by key
   * GET /rest/api/1.0/admin/configurations/{key}
   */
  async getConfiguration(key: string): Promise<Configuration> {
    this.logger.info('Getting configuration', { key });

    try {
      const response = await this.apiClient.get<Configuration>(`/admin/configurations/${key}`);
      this.logger.info('Successfully retrieved configuration', { key });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get configuration', { key, error });
      throw error;
    }
  }

  /**
   * Update configuration
   * PUT /rest/api/1.0/admin/configurations/{key}
   */
  async updateConfiguration(key: string, value: any): Promise<Configuration> {
    this.logger.info('Updating configuration', { key, value });

    try {
      const response = await this.apiClient.put<Configuration>(`/admin/configurations/${key}`, {
        value,
      });
      this.logger.info('Successfully updated configuration', { key });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update configuration', { key, value, error });
      throw error;
    }
  }

  /**
   * Create configuration
   * POST /rest/api/1.0/admin/configurations
   */
  async createConfiguration(request: ConfigurationRequest): Promise<Configuration> {
    this.logger.info('Creating configuration', { request });

    try {
      const response = await this.apiClient.post<Configuration>('/admin/configurations', request);
      this.logger.info('Successfully created configuration', { key: response.data.key });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create configuration', { request, error });
      throw error;
    }
  }

  /**
   * Delete configuration
   * DELETE /rest/api/1.0/admin/configurations/{key}
   */
  async deleteConfiguration(key: string): Promise<void> {
    this.logger.info('Deleting configuration', { key });

    try {
      await this.apiClient.delete(`/admin/configurations/${key}`);
      this.logger.info('Successfully deleted configuration', { key });
    } catch (error) {
      this.logger.error('Failed to delete configuration', { key, error });
      throw error;
    }
  }

  /**
   * List backup configurations
   * GET /rest/api/1.0/admin/backups
   */
  async listBackupConfigurations(): Promise<SystemBackupConfiguration[]> {
    this.logger.info('Listing backup configurations');

    try {
      const response = await this.apiClient.get<{ configurations: SystemBackupConfiguration[] }>(
        '/admin/backups'
      );
      this.logger.info('Successfully listed backup configurations', {
        count: response.data.configurations.length,
      });
      return response.data.configurations;
    } catch (error) {
      this.logger.error('Failed to list backup configurations', { error });
      throw error;
    }
  }

  /**
   * Create backup configuration
   * POST /rest/api/1.0/admin/backups
   */
  async createBackupConfiguration(
    request: SystemBackupConfigurationRequest
  ): Promise<SystemBackupConfiguration> {
    this.logger.info('Creating backup configuration', { request });

    try {
      const response = await this.apiClient.post<SystemBackupConfiguration>(
        '/admin/backups',
        request
      );
      this.logger.info('Successfully created backup configuration', { id: response.data.id });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create backup configuration', { request, error });
      throw error;
    }
  }

  /**
   * Get backup configuration by ID
   * GET /rest/api/1.0/admin/backups/{backupId}
   */
  async getBackupConfiguration(backupId: number): Promise<SystemBackupConfiguration> {
    this.logger.info('Getting backup configuration', { backupId });

    try {
      const response = await this.apiClient.get<SystemBackupConfiguration>(
        `/admin/backups/${backupId}`
      );
      this.logger.info('Successfully retrieved backup configuration', { backupId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get backup configuration', { backupId, error });
      throw error;
    }
  }

  /**
   * Update backup configuration
   * PUT /rest/api/1.0/admin/backups/{backupId}
   */
  async updateBackupConfiguration(
    backupId: number,
    request: SystemBackupConfigurationRequest
  ): Promise<SystemBackupConfiguration> {
    this.logger.info('Updating backup configuration', { backupId, request });

    try {
      const response = await this.apiClient.put<SystemBackupConfiguration>(
        `/admin/backups/${backupId}`,
        request
      );
      this.logger.info('Successfully updated backup configuration', { backupId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update backup configuration', { backupId, request, error });
      throw error;
    }
  }

  /**
   * Delete backup configuration
   * DELETE /rest/api/1.0/admin/backups/{backupId}
   */
  async deleteBackupConfiguration(backupId: number): Promise<void> {
    this.logger.info('Deleting backup configuration', { backupId });

    try {
      await this.apiClient.delete(`/admin/backups/${backupId}`);
      this.logger.info('Successfully deleted backup configuration', { backupId });
    } catch (error) {
      this.logger.error('Failed to delete backup configuration', { backupId, error });
      throw error;
    }
  }

  /**
   * Start backup
   * POST /rest/api/1.0/admin/backups/{backupId}/start
   */
  async startBackup(backupId: number): Promise<BackupResult> {
    this.logger.info('Starting backup', { backupId });

    try {
      const response = await this.apiClient.post<BackupResult>(`/admin/backups/${backupId}/start`);
      this.logger.info('Successfully started backup', { backupId, resultId: response.data.id });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to start backup', { backupId, error });
      throw error;
    }
  }

  /**
   * Get backup results
   * GET /rest/api/1.0/admin/backups/{backupId}/results
   */
  async getBackupResults(backupId: number): Promise<BackupResultListResponse> {
    this.logger.info('Getting backup results', { backupId });

    try {
      const response = await this.apiClient.get<BackupResultListResponse>(
        `/admin/backups/${backupId}/results`
      );
      this.logger.info('Successfully retrieved backup results', {
        backupId,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get backup results', { backupId, error });
      throw error;
    }
  }

  /**
   * Get log entries
   * GET /rest/api/1.0/admin/logs
   */
  async getLogEntries(params?: LogQueryParams): Promise<LogEntryListResponse> {
    this.logger.info('Getting log entries', { params });

    try {
      const response = await this.apiClient.get<LogEntryListResponse>('/admin/logs', { params });
      this.logger.info('Successfully retrieved log entries', {
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get log entries', { params, error });
      throw error;
    }
  }

  /**
   * Get log entry by ID
   * GET /rest/api/1.0/admin/logs/{logId}
   */
  async getLogEntry(logId: number): Promise<LogEntry> {
    this.logger.info('Getting log entry', { logId });

    try {
      const response = await this.apiClient.get<LogEntry>(`/admin/logs/${logId}`);
      this.logger.info('Successfully retrieved log entry', { logId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get log entry', { logId, error });
      throw error;
    }
  }

  /**
   * List plugins
   * GET /rest/api/1.0/admin/plugins
   */
  async listPlugins(params?: PluginQueryParams): Promise<PluginInformationListResponse> {
    this.logger.info('Listing plugins', { params });

    try {
      const response = await this.apiClient.get<PluginInformationListResponse>('/admin/plugins', {
        params,
      });
      this.logger.info('Successfully listed plugins', { count: response.data.values.length });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list plugins', { params, error });
      throw error;
    }
  }

  /**
   * Get plugin by key
   * GET /rest/api/1.0/admin/plugins/{pluginKey}
   */
  async getPlugin(pluginKey: string): Promise<PluginInformation> {
    this.logger.info('Getting plugin', { pluginKey });

    try {
      const response = await this.apiClient.get<PluginInformation>(`/admin/plugins/${pluginKey}`);
      this.logger.info('Successfully retrieved plugin', { pluginKey });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get plugin', { pluginKey, error });
      throw error;
    }
  }

  /**
   * Enable plugin
   * POST /rest/api/1.0/admin/plugins/{pluginKey}/enable
   */
  async enablePlugin(pluginKey: string): Promise<void> {
    this.logger.info('Enabling plugin', { pluginKey });

    try {
      await this.apiClient.post(`/admin/plugins/${pluginKey}/enable`);
      this.logger.info('Successfully enabled plugin', { pluginKey });
    } catch (error) {
      this.logger.error('Failed to enable plugin', { pluginKey, error });
      throw error;
    }
  }

  /**
   * Disable plugin
   * POST /rest/api/1.0/admin/plugins/{pluginKey}/disable
   */
  async disablePlugin(pluginKey: string): Promise<void> {
    this.logger.info('Disabling plugin', { pluginKey });

    try {
      await this.apiClient.post(`/admin/plugins/${pluginKey}/disable`);
      this.logger.info('Successfully disabled plugin', { pluginKey });
    } catch (error) {
      this.logger.error('Failed to disable plugin', { pluginKey, error });
      throw error;
    }
  }

  /**
   * Restart system
   * POST /rest/api/1.0/admin/system/restart
   */
  async restartSystem(): Promise<{ message: string }> {
    this.logger.info('Restarting system');

    try {
      const response = await this.apiClient.post<{ message: string }>('/admin/system/restart');
      this.logger.info('Successfully initiated system restart');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to restart system', { error });
      throw error;
    }
  }

  /**
   * Shutdown system
   * POST /rest/api/1.0/admin/system/shutdown
   */
  async shutdownSystem(): Promise<{ message: string }> {
    this.logger.info('Shutting down system');

    try {
      const response = await this.apiClient.post<{ message: string }>('/admin/system/shutdown');
      this.logger.info('Successfully initiated system shutdown');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to shutdown system', { error });
      throw error;
    }
  }
}
