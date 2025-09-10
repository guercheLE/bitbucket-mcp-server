/**
 * System Maintenance Service for Bitbucket Data Center REST API
 * Based on official documentation: https://developer.atlassian.com/server/bitbucket/rest/v906/intro/
 */

import {
  MaintenanceTask,
  MaintenanceTaskCreateRequest,
  MaintenanceTaskListResponse,
  MaintenanceTaskQueryParams,
  MaintenanceTaskResponse,
  MaintenanceTaskUpdateRequest,
  SystemConfiguration,
  SystemConfigurationResponse,
  SystemMetrics,
  SystemMetricsListResponse,
  SystemMetricsQueryParams,
  SystemMetricsResponse,
  SystemStatus,
  SystemStatusResponse,
  TaskExecution,
  TaskExecutionListResponse,
  TaskExecutionQueryParams,
  TaskExecutionResponse,
} from './types/system-maintenance.types.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';

export class SystemMaintenanceService {
  private readonly apiClient: ApiClient;
  private readonly logger: Logger;

  constructor(apiClient: ApiClient, logger: Logger) {
    this.apiClient = apiClient;
    this.logger = logger;
  }

  // System Status
  /**
   * Get system status
   * GET /rest/api/1.0/system/status
   */
  async getSystemStatus(): Promise<SystemStatusResponse> {
    this.logger.info('Getting system status');

    try {
      const response = await this.apiClient.get<SystemStatusResponse>('/system/status');
      this.logger.info('Successfully retrieved system status', {
        status: response.data.status,
        version: response.data.version,
        buildNumber: response.data.buildNumber,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get system status', { error });
      throw error;
    }
  }

  /**
   * Get system health
   * GET /rest/api/1.0/system/health
   */
  async getSystemHealth(): Promise<SystemStatusResponse> {
    this.logger.info('Getting system health');

    try {
      const response = await this.apiClient.get<SystemStatusResponse>('/system/health');
      this.logger.info('Successfully retrieved system health', {
        status: response.data.status,
        servicesCount: response.data.services.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get system health', { error });
      throw error;
    }
  }

  /**
   * Get system information
   * GET /rest/api/1.0/system/info
   */
  async getSystemInfo(): Promise<SystemStatusResponse> {
    this.logger.info('Getting system information');

    try {
      const response = await this.apiClient.get<SystemStatusResponse>('/system/info');
      this.logger.info('Successfully retrieved system information', {
        version: response.data.version,
        buildNumber: response.data.buildNumber,
        displayName: response.data.displayName,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get system information', { error });
      throw error;
    }
  }

  // System Configuration
  /**
   * Get system configuration
   * GET /rest/api/1.0/system/configuration
   */
  async getSystemConfiguration(): Promise<SystemConfigurationResponse> {
    this.logger.info('Getting system configuration');

    try {
      const response =
        await this.apiClient.get<SystemConfigurationResponse>('/system/configuration');
      this.logger.info('Successfully retrieved system configuration');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get system configuration', { error });
      throw error;
    }
  }

  /**
   * Update system configuration
   * PUT /rest/api/1.0/system/configuration
   */
  async updateSystemConfiguration(
    configuration: SystemConfiguration
  ): Promise<SystemConfigurationResponse> {
    this.logger.info('Updating system configuration', { configuration });

    try {
      const response = await this.apiClient.put<SystemConfigurationResponse>(
        '/system/configuration',
        configuration
      );
      this.logger.info('Successfully updated system configuration');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update system configuration', { configuration, error });
      throw error;
    }
  }

  /**
   * Reset system configuration
   * POST /rest/api/1.0/system/configuration/reset
   */
  async resetSystemConfiguration(): Promise<SystemConfigurationResponse> {
    this.logger.info('Resetting system configuration');

    try {
      const response = await this.apiClient.post<SystemConfigurationResponse>(
        '/system/configuration/reset'
      );
      this.logger.info('Successfully reset system configuration');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to reset system configuration', { error });
      throw error;
    }
  }

  // System Metrics
  /**
   * Get system metrics
   * GET /rest/api/1.0/system/metrics
   */
  async getSystemMetrics(): Promise<SystemMetricsResponse> {
    this.logger.info('Getting system metrics');

    try {
      const response = await this.apiClient.get<SystemMetricsResponse>('/system/metrics');
      this.logger.info('Successfully retrieved system metrics', {
        timestamp: response.data.timestamp,
        system: response.data.system,
        application: response.data.application,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get system metrics', { error });
      throw error;
    }
  }

  /**
   * Get system metrics for time range
   * GET /rest/api/1.0/system/metrics/range
   */
  async getSystemMetricsForRange(
    params: SystemMetricsQueryParams
  ): Promise<SystemMetricsListResponse> {
    this.logger.info('Getting system metrics for range', { params });

    try {
      const response = await this.apiClient.get<SystemMetricsListResponse>(
        '/system/metrics/range',
        { params }
      );
      this.logger.info('Successfully retrieved system metrics for range', {
        count: response.data.metrics.length,
        total: response.data.total,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get system metrics for range', { params, error });
      throw error;
    }
  }

  /**
   * Export system metrics
   * GET /rest/api/1.0/system/metrics/export
   */
  async exportSystemMetrics(params?: SystemMetricsQueryParams): Promise<Blob> {
    this.logger.info('Exporting system metrics', { params });

    try {
      const response = await this.apiClient.get('/system/metrics/export', {
        params,
        responseType: 'blob',
      });
      this.logger.info('Successfully exported system metrics');
      return response.data as Blob;
    } catch (error) {
      this.logger.error('Failed to export system metrics', { params, error });
      throw error;
    }
  }

  // Maintenance Tasks
  /**
   * List maintenance tasks
   * GET /rest/api/1.0/system/tasks
   */
  async listMaintenanceTasks(
    params?: MaintenanceTaskQueryParams
  ): Promise<MaintenanceTaskListResponse> {
    this.logger.info('Listing maintenance tasks', { params });

    try {
      const response = await this.apiClient.get<MaintenanceTaskListResponse>('/system/tasks', {
        params,
      });
      this.logger.info('Successfully listed maintenance tasks', {
        count: response.data.values.length,
        total: response.data.size,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list maintenance tasks', { params, error });
      throw error;
    }
  }

  /**
   * Get maintenance task by ID
   * GET /rest/api/1.0/system/tasks/{taskId}
   */
  async getMaintenanceTask(taskId: string): Promise<MaintenanceTaskResponse> {
    this.logger.info('Getting maintenance task', { taskId });

    try {
      const response = await this.apiClient.get<MaintenanceTaskResponse>(`/system/tasks/${taskId}`);
      this.logger.info('Successfully retrieved maintenance task', {
        taskId,
        name: response.data.name,
        type: response.data.type,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get maintenance task', { taskId, error });
      throw error;
    }
  }

  /**
   * Create maintenance task
   * POST /rest/api/1.0/system/tasks
   */
  async createMaintenanceTask(
    request: MaintenanceTaskCreateRequest
  ): Promise<MaintenanceTaskResponse> {
    this.logger.info('Creating maintenance task', { name: request.name, type: request.type });

    try {
      const response = await this.apiClient.post<MaintenanceTaskResponse>('/system/tasks', request);
      this.logger.info('Successfully created maintenance task', {
        id: response.data.id,
        name: response.data.name,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create maintenance task', { request, error });
      throw error;
    }
  }

  /**
   * Update maintenance task
   * PUT /rest/api/1.0/system/tasks/{taskId}
   */
  async updateMaintenanceTask(
    taskId: string,
    request: MaintenanceTaskUpdateRequest
  ): Promise<MaintenanceTaskResponse> {
    this.logger.info('Updating maintenance task', { taskId, request });

    try {
      const response = await this.apiClient.put<MaintenanceTaskResponse>(
        `/system/tasks/${taskId}`,
        request
      );
      this.logger.info('Successfully updated maintenance task', { taskId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update maintenance task', { taskId, request, error });
      throw error;
    }
  }

  /**
   * Delete maintenance task
   * DELETE /rest/api/1.0/system/tasks/{taskId}
   */
  async deleteMaintenanceTask(taskId: string): Promise<void> {
    this.logger.info('Deleting maintenance task', { taskId });

    try {
      await this.apiClient.delete(`/system/tasks/${taskId}`);
      this.logger.info('Successfully deleted maintenance task', { taskId });
    } catch (error) {
      this.logger.error('Failed to delete maintenance task', { taskId, error });
      throw error;
    }
  }

  /**
   * Enable maintenance task
   * POST /rest/api/1.0/system/tasks/{taskId}/enable
   */
  async enableMaintenanceTask(taskId: string): Promise<MaintenanceTaskResponse> {
    this.logger.info('Enabling maintenance task', { taskId });

    try {
      const response = await this.apiClient.post<MaintenanceTaskResponse>(
        `/system/tasks/${taskId}/enable`
      );
      this.logger.info('Successfully enabled maintenance task', { taskId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to enable maintenance task', { taskId, error });
      throw error;
    }
  }

  /**
   * Disable maintenance task
   * POST /rest/api/1.0/system/tasks/{taskId}/disable
   */
  async disableMaintenanceTask(taskId: string): Promise<MaintenanceTaskResponse> {
    this.logger.info('Disabling maintenance task', { taskId });

    try {
      const response = await this.apiClient.post<MaintenanceTaskResponse>(
        `/system/tasks/${taskId}/disable`
      );
      this.logger.info('Successfully disabled maintenance task', { taskId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to disable maintenance task', { taskId, error });
      throw error;
    }
  }

  /**
   * Run maintenance task manually
   * POST /rest/api/1.0/system/tasks/{taskId}/run
   */
  async runMaintenanceTask(taskId: string): Promise<TaskExecutionResponse> {
    this.logger.info('Running maintenance task manually', { taskId });

    try {
      const response = await this.apiClient.post<TaskExecutionResponse>(
        `/system/tasks/${taskId}/run`
      );
      this.logger.info('Successfully started maintenance task', {
        taskId,
        executionId: response.data.id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to run maintenance task', { taskId, error });
      throw error;
    }
  }

  // Task Executions
  /**
   * List task executions
   * GET /rest/api/1.0/system/executions
   */
  async listTaskExecutions(params?: TaskExecutionQueryParams): Promise<TaskExecutionListResponse> {
    this.logger.info('Listing task executions', { params });

    try {
      const response = await this.apiClient.get<TaskExecutionListResponse>('/system/executions', {
        params,
      });
      this.logger.info('Successfully listed task executions', {
        count: response.data.values.length,
        total: response.data.size,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list task executions', { params, error });
      throw error;
    }
  }

  /**
   * Get task execution by ID
   * GET /rest/api/1.0/system/executions/{executionId}
   */
  async getTaskExecution(executionId: string): Promise<TaskExecutionResponse> {
    this.logger.info('Getting task execution', { executionId });

    try {
      const response = await this.apiClient.get<TaskExecutionResponse>(
        `/system/executions/${executionId}`
      );
      this.logger.info('Successfully retrieved task execution', {
        executionId,
        taskId: response.data.taskId,
        status: response.data.status,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get task execution', { executionId, error });
      throw error;
    }
  }

  /**
   * Cancel task execution
   * POST /rest/api/1.0/system/executions/{executionId}/cancel
   */
  async cancelTaskExecution(executionId: string): Promise<TaskExecutionResponse> {
    this.logger.info('Cancelling task execution', { executionId });

    try {
      const response = await this.apiClient.post<TaskExecutionResponse>(
        `/system/executions/${executionId}/cancel`
      );
      this.logger.info('Successfully cancelled task execution', { executionId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to cancel task execution', { executionId, error });
      throw error;
    }
  }

  /**
   * Get task execution logs
   * GET /rest/api/1.0/system/executions/{executionId}/logs
   */
  async getTaskExecutionLogs(executionId: string): Promise<string> {
    this.logger.info('Getting task execution logs', { executionId });

    try {
      const response = await this.apiClient.get(`/system/executions/${executionId}/logs`, {
        responseType: 'text',
      });
      this.logger.info('Successfully retrieved task execution logs', { executionId });
      return response.data as string;
    } catch (error) {
      this.logger.error('Failed to get task execution logs', { executionId, error });
      throw error;
    }
  }

  // System Operations
  /**
   * Restart system
   * POST /rest/api/1.0/system/restart
   */
  async restartSystem(): Promise<void> {
    this.logger.info('Restarting system');

    try {
      await this.apiClient.post('/system/restart');
      this.logger.info('Successfully initiated system restart');
    } catch (error) {
      this.logger.error('Failed to restart system', { error });
      throw error;
    }
  }

  /**
   * Shutdown system
   * POST /rest/api/1.0/system/shutdown
   */
  async shutdownSystem(): Promise<void> {
    this.logger.info('Shutting down system');

    try {
      await this.apiClient.post('/system/shutdown');
      this.logger.info('Successfully initiated system shutdown');
    } catch (error) {
      this.logger.error('Failed to shutdown system', { error });
      throw error;
    }
  }

  /**
   * Clear system cache
   * POST /rest/api/1.0/system/cache/clear
   */
  async clearSystemCache(): Promise<void> {
    this.logger.info('Clearing system cache');

    try {
      await this.apiClient.post('/system/cache/clear');
      this.logger.info('Successfully cleared system cache');
    } catch (error) {
      this.logger.error('Failed to clear system cache', { error });
      throw error;
    }
  }

  /**
   * Rebuild system indexes
   * POST /rest/api/1.0/system/indexes/rebuild
   */
  async rebuildSystemIndexes(): Promise<void> {
    this.logger.info('Rebuilding system indexes');

    try {
      await this.apiClient.post('/system/indexes/rebuild');
      this.logger.info('Successfully initiated system index rebuild');
    } catch (error) {
      this.logger.error('Failed to rebuild system indexes', { error });
      throw error;
    }
  }

  /**
   * Perform system backup
   * POST /rest/api/1.0/system/backup
   */
  async performSystemBackup(): Promise<void> {
    this.logger.info('Performing system backup');

    try {
      await this.apiClient.post('/system/backup');
      this.logger.info('Successfully initiated system backup');
    } catch (error) {
      this.logger.error('Failed to perform system backup', { error });
      throw error;
    }
  }

  /**
   * Perform system cleanup
   * POST /rest/api/1.0/system/cleanup
   */
  async performSystemCleanup(): Promise<void> {
    this.logger.info('Performing system cleanup');

    try {
      await this.apiClient.post('/system/cleanup');
      this.logger.info('Successfully initiated system cleanup');
    } catch (error) {
      this.logger.error('Failed to perform system cleanup', { error });
      throw error;
    }
  }
}
