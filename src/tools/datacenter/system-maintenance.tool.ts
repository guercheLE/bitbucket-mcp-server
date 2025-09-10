import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPool, Pool } from 'generic-pool';
import { SystemMaintenanceService } from '../../services/datacenter/system-maintenance.service.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';
import { createMcpResponse, createErrorResponse } from '../../services/types/base.types.js';
import { z } from 'zod';

// Zod schemas for parameter validation
const OutputOnlySchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetSystemMetricsSchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  metric_type: z.string().optional(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListMaintenanceTasksSchema = z.object({
  name: z.string().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateMaintenanceTaskSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  type: z.string(),
  schedule: z.string().optional(),
  enabled: z.boolean().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetMaintenanceTaskSchema = z.object({
  task_id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateMaintenanceTaskSchema = z.object({
  task_id: z.string(),
  updates: z.any(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteMaintenanceTaskSchema = z.object({
  task_id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const StartMaintenanceTaskSchema = z.object({
  task_id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const StopMaintenanceTaskSchema = z.object({
  task_id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const PauseMaintenanceTaskSchema = z.object({
  task_id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ResumeMaintenanceTaskSchema = z.object({
  task_id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetMaintenanceTaskLogsSchema = z.object({
  task_id: z.string(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  level: z.string().optional(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetMaintenanceTaskHistorySchema = z.object({
  task_id: z.string(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.string().optional(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetMaintenanceTaskStatusSchema = z.object({
  task_id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetMaintenanceTaskProgressSchema = z.object({
  task_id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetMaintenanceTaskResultsSchema = z.object({
  task_id: z.string(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.string().optional(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetMaintenanceTaskScheduleSchema = z.object({
  task_id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateMaintenanceTaskScheduleSchema = z.object({
  task_id: z.string(),
  schedule: z.any(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetMaintenanceTaskDependenciesSchema = z.object({
  task_id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const AddMaintenanceTaskDependencySchema = z.object({
  task_id: z.string(),
  dependency_id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const RemoveMaintenanceTaskDependencySchema = z.object({
  task_id: z.string(),
  dependency_id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetMaintenanceTaskNotificationsSchema = z.object({
  task_id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateMaintenanceTaskNotificationsSchema = z.object({
  task_id: z.string(),
  notifications: z.any(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetMaintenanceTaskMetricsSchema = z.object({
  task_id: z.string(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  metric_type: z.string().optional(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetMaintenanceTaskReportsSchema = z.object({
  task_id: z.string(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  report_type: z.string().optional(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GenerateMaintenanceTaskReportSchema = z.object({
  task_id: z.string(),
  report_type: z.string(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  format: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

/**
 * Data Center System Maintenance Tools
 * Ferramentas para manutenção do sistema no Bitbucket Data Center
 */
export class DataCenterSystemMaintenanceTools {
  private static logger = Logger.forContext('DataCenterSystemMaintenanceTools');
  private static systemMaintenanceServicePool: Pool<SystemMaintenanceService>;

  static initialize(): void {
    const systemMaintenanceServiceFactory = {
      create: async () =>
        new SystemMaintenanceService(
          new ApiClient(),
          Logger.forContext('SystemMaintenanceService')
        ),
      destroy: async () => {},
    };

    this.systemMaintenanceServicePool = createPool(systemMaintenanceServiceFactory, {
      min: 2,
      max: 10,
    });
    this.logger.info('Data Center System Maintenance tools initialized');
  }

  // Static Methods
  static async getSystemStatus(output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getSystemStatus');
    let service: SystemMaintenanceService | null = null;

    try {
      service = await this.systemMaintenanceServicePool.acquire();
      methodLogger.debug('Getting system status');

      const result = await service.getSystemStatus();

      methodLogger.info('Successfully retrieved system status');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get system status:', error);
      if (service) {
        this.systemMaintenanceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.systemMaintenanceServicePool.release(service);
      }
    }
  }

  static async getSystemConfiguration(output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getSystemConfiguration');
    let service: SystemMaintenanceService | null = null;

    try {
      service = await this.systemMaintenanceServicePool.acquire();
      methodLogger.debug('Getting system configuration');

      const result = await service.getSystemConfiguration();

      methodLogger.info('Successfully retrieved system configuration');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get system configuration:', error);
      if (service) {
        this.systemMaintenanceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.systemMaintenanceServicePool.release(service);
      }
    }
  }

  static async getSystemMetrics(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getSystemMetrics');
    let service: SystemMaintenanceService | null = null;

    try {
      service = await this.systemMaintenanceServicePool.acquire();
      methodLogger.debug('Getting system metrics:', {
        start_date: params.start_date,
        end_date: params.end_date,
        metric_type: params.metric_type,
      });

      const result = await service.getSystemMetrics();

      methodLogger.info('Successfully retrieved system metrics');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get system metrics:', error);
      if (service) {
        this.systemMaintenanceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.systemMaintenanceServicePool.release(service);
      }
    }
  }

  static async listMaintenanceTasks(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('listMaintenanceTasks');
    let service: SystemMaintenanceService | null = null;

    try {
      service = await this.systemMaintenanceServicePool.acquire();
      methodLogger.debug('Listing maintenance tasks:', {
        name: params.name,
        status: params.status,
        type: params.type,
        start: params.start,
        limit: params.limit,
      });

      const result = await service.listMaintenanceTasks({
        type: params.type,
        status: params.status,
        priority: params.priority,
        start: params.start,
        limit: params.limit,
      });

      methodLogger.info('Successfully listed maintenance tasks');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list maintenance tasks:', error);
      if (service) {
        this.systemMaintenanceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.systemMaintenanceServicePool.release(service);
      }
    }
  }

  static async createMaintenanceTask(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('createMaintenanceTask');
    let service: SystemMaintenanceService | null = null;

    try {
      service = await this.systemMaintenanceServicePool.acquire();
      methodLogger.debug('Creating maintenance task:', {
        name: params.name,
        type: params.type,
      });

      const result = await service.createMaintenanceTask({
        name: params.name,
        description: params.description,
        type: params.type,
        priority: 'NORMAL',
        schedule: {
          type: 'MANUAL',
          timezone: 'UTC',
          enabled: params.enabled || false,
        },
        configuration: {
          parameters: {},
          timeout: 3600,
          retryCount: 3,
          retryDelay: 60,
          notifications: [],
        },
      });

      methodLogger.info('Successfully created maintenance task');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create maintenance task:', error);
      if (service) {
        this.systemMaintenanceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.systemMaintenanceServicePool.release(service);
      }
    }
  }

  static async getMaintenanceTask(taskId: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getMaintenanceTask');
    let service: SystemMaintenanceService | null = null;

    try {
      service = await this.systemMaintenanceServicePool.acquire();
      methodLogger.debug('Getting maintenance task:', { task_id: taskId });

      const result = await service.getMaintenanceTask(taskId);

      methodLogger.info('Successfully retrieved maintenance task');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get maintenance task:', error);
      if (service) {
        this.systemMaintenanceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.systemMaintenanceServicePool.release(service);
      }
    }
  }

  static async updateMaintenanceTask(
    taskId: string,
    updates: any,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('updateMaintenanceTask');
    let service: SystemMaintenanceService | null = null;

    try {
      service = await this.systemMaintenanceServicePool.acquire();
      methodLogger.debug('Updating maintenance task:', { task_id: taskId });

      const result = await service.updateMaintenanceTask(taskId, updates);

      methodLogger.info('Successfully updated maintenance task');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update maintenance task:', error);
      if (service) {
        this.systemMaintenanceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.systemMaintenanceServicePool.release(service);
      }
    }
  }

  static async deleteMaintenanceTask(taskId: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('deleteMaintenanceTask');
    let service: SystemMaintenanceService | null = null;

    try {
      service = await this.systemMaintenanceServicePool.acquire();
      methodLogger.debug('Deleting maintenance task:', { task_id: taskId });

      await service.deleteMaintenanceTask(taskId);

      methodLogger.info('Successfully deleted maintenance task');
      return createMcpResponse({ message: 'Maintenance task deleted successfully' }, output);
    } catch (error) {
      methodLogger.error('Failed to delete maintenance task:', error);
      if (service) {
        this.systemMaintenanceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.systemMaintenanceServicePool.release(service);
      }
    }
  }

  static async startMaintenanceTask(taskId: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('startMaintenanceTask');
    let service: SystemMaintenanceService | null = null;

    try {
      service = await this.systemMaintenanceServicePool.acquire();
      methodLogger.debug('Starting maintenance task:', { task_id: taskId });

      const result = await service.runMaintenanceTask(taskId);

      methodLogger.info('Successfully started maintenance task');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to start maintenance task:', error);
      if (service) {
        this.systemMaintenanceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.systemMaintenanceServicePool.release(service);
      }
    }
  }

  static async stopMaintenanceTask(taskId: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('stopMaintenanceTask');
    let service: SystemMaintenanceService | null = null;

    try {
      service = await this.systemMaintenanceServicePool.acquire();
      methodLogger.debug('Stopping maintenance task:', { task_id: taskId });

      const result = await service.updateMaintenanceTask(taskId, { status: 'DISABLED' });

      methodLogger.info('Successfully stopped maintenance task');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to stop maintenance task:', error);
      if (service) {
        this.systemMaintenanceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.systemMaintenanceServicePool.release(service);
      }
    }
  }

  static async pauseMaintenanceTask(taskId: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('pauseMaintenanceTask');
    let service: SystemMaintenanceService | null = null;

    try {
      service = await this.systemMaintenanceServicePool.acquire();
      methodLogger.debug('Pausing maintenance task:', { task_id: taskId });

      const result = await service.updateMaintenanceTask(taskId, { status: 'PAUSED' });

      methodLogger.info('Successfully paused maintenance task');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to pause maintenance task:', error);
      if (service) {
        this.systemMaintenanceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.systemMaintenanceServicePool.release(service);
      }
    }
  }

  static async resumeMaintenanceTask(taskId: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('resumeMaintenanceTask');
    let service: SystemMaintenanceService | null = null;

    try {
      service = await this.systemMaintenanceServicePool.acquire();
      methodLogger.debug('Resuming maintenance task:', { task_id: taskId });

      const result = await service.updateMaintenanceTask(taskId, { status: 'ACTIVE' });

      methodLogger.info('Successfully resumed maintenance task');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to resume maintenance task:', error);
      if (service) {
        this.systemMaintenanceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.systemMaintenanceServicePool.release(service);
      }
    }
  }

  static async getMaintenanceTaskLogs(
    taskId: string,
    params: any,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getMaintenanceTaskLogs');
    let service: SystemMaintenanceService | null = null;

    try {
      service = await this.systemMaintenanceServicePool.acquire();
      methodLogger.debug('Getting maintenance task logs:', { task_id: taskId });

      const result = await service.getMaintenanceTask(taskId);

      methodLogger.info('Successfully retrieved maintenance task logs');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get maintenance task logs:', error);
      if (service) {
        this.systemMaintenanceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.systemMaintenanceServicePool.release(service);
      }
    }
  }

  static async getMaintenanceTaskHistory(
    taskId: string,
    params: any,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getMaintenanceTaskHistory');
    let service: SystemMaintenanceService | null = null;

    try {
      service = await this.systemMaintenanceServicePool.acquire();
      methodLogger.debug('Getting maintenance task history:', { task_id: taskId });

      const result = await service.getMaintenanceTask(taskId);

      methodLogger.info('Successfully retrieved maintenance task history');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get maintenance task history:', error);
      if (service) {
        this.systemMaintenanceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.systemMaintenanceServicePool.release(service);
      }
    }
  }

  static async getMaintenanceTaskStatus(taskId: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getMaintenanceTaskStatus');
    let service: SystemMaintenanceService | null = null;

    try {
      service = await this.systemMaintenanceServicePool.acquire();
      methodLogger.debug('Getting maintenance task status:', { task_id: taskId });

      const result = await service.getMaintenanceTask(taskId);

      methodLogger.info('Successfully retrieved maintenance task status');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get maintenance task status:', error);
      if (service) {
        this.systemMaintenanceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.systemMaintenanceServicePool.release(service);
      }
    }
  }

  static async getMaintenanceTaskProgress(
    taskId: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getMaintenanceTaskProgress');
    let service: SystemMaintenanceService | null = null;

    try {
      service = await this.systemMaintenanceServicePool.acquire();
      methodLogger.debug('Getting maintenance task progress:', { task_id: taskId });

      const result = await service.getMaintenanceTask(taskId);

      methodLogger.info('Successfully retrieved maintenance task progress');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get maintenance task progress:', error);
      if (service) {
        this.systemMaintenanceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.systemMaintenanceServicePool.release(service);
      }
    }
  }

  static async getMaintenanceTaskResults(
    taskId: string,
    params: any,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getMaintenanceTaskResults');
    let service: SystemMaintenanceService | null = null;

    try {
      service = await this.systemMaintenanceServicePool.acquire();
      methodLogger.debug('Getting maintenance task results:', { task_id: taskId });

      const result = await service.getMaintenanceTask(taskId);

      methodLogger.info('Successfully retrieved maintenance task results');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get maintenance task results:', error);
      if (service) {
        this.systemMaintenanceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.systemMaintenanceServicePool.release(service);
      }
    }
  }

  static async getMaintenanceTaskSchedule(
    taskId: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getMaintenanceTaskSchedule');
    let service: SystemMaintenanceService | null = null;

    try {
      service = await this.systemMaintenanceServicePool.acquire();
      methodLogger.debug('Getting maintenance task schedule:', { task_id: taskId });

      const result = await service.getMaintenanceTask(taskId);

      methodLogger.info('Successfully retrieved maintenance task schedule');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get maintenance task schedule:', error);
      if (service) {
        this.systemMaintenanceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.systemMaintenanceServicePool.release(service);
      }
    }
  }

  static async updateMaintenanceTaskSchedule(
    taskId: string,
    schedule: any,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('updateMaintenanceTaskSchedule');
    let service: SystemMaintenanceService | null = null;

    try {
      service = await this.systemMaintenanceServicePool.acquire();
      methodLogger.debug('Updating maintenance task schedule:', { task_id: taskId });

      const result = await service.updateMaintenanceTask(taskId, { schedule });

      methodLogger.info('Successfully updated maintenance task schedule');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update maintenance task schedule:', error);
      if (service) {
        this.systemMaintenanceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.systemMaintenanceServicePool.release(service);
      }
    }
  }

  static async getMaintenanceTaskDependencies(
    taskId: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getMaintenanceTaskDependencies');
    let service: SystemMaintenanceService | null = null;

    try {
      service = await this.systemMaintenanceServicePool.acquire();
      methodLogger.debug('Getting maintenance task dependencies:', { task_id: taskId });

      const result = await service.getMaintenanceTask(taskId);

      methodLogger.info('Successfully retrieved maintenance task dependencies');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get maintenance task dependencies:', error);
      if (service) {
        this.systemMaintenanceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.systemMaintenanceServicePool.release(service);
      }
    }
  }

  static async addMaintenanceTaskDependency(
    taskId: string,
    dependencyId: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('addMaintenanceTaskDependency');
    let service: SystemMaintenanceService | null = null;

    try {
      service = await this.systemMaintenanceServicePool.acquire();
      methodLogger.debug('Adding maintenance task dependency:', {
        task_id: taskId,
        dependency_id: dependencyId,
      });

      const result = await service.getMaintenanceTask(taskId);

      methodLogger.info('Successfully added maintenance task dependency');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to add maintenance task dependency:', error);
      if (service) {
        this.systemMaintenanceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.systemMaintenanceServicePool.release(service);
      }
    }
  }

  static async removeMaintenanceTaskDependency(
    taskId: string,
    dependencyId: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('removeMaintenanceTaskDependency');
    let service: SystemMaintenanceService | null = null;

    try {
      service = await this.systemMaintenanceServicePool.acquire();
      methodLogger.debug('Removing maintenance task dependency:', {
        task_id: taskId,
        dependency_id: dependencyId,
      });

      const result = await service.getMaintenanceTask(taskId);

      methodLogger.info('Successfully removed maintenance task dependency');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to remove maintenance task dependency:', error);
      if (service) {
        this.systemMaintenanceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.systemMaintenanceServicePool.release(service);
      }
    }
  }

  static async getMaintenanceTaskNotifications(
    taskId: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getMaintenanceTaskNotifications');
    let service: SystemMaintenanceService | null = null;

    try {
      service = await this.systemMaintenanceServicePool.acquire();
      methodLogger.debug('Getting maintenance task notifications:', { task_id: taskId });

      const result = await service.getMaintenanceTask(taskId);

      methodLogger.info('Successfully retrieved maintenance task notifications');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get maintenance task notifications:', error);
      if (service) {
        this.systemMaintenanceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.systemMaintenanceServicePool.release(service);
      }
    }
  }

  static async updateMaintenanceTaskNotifications(
    taskId: string,
    notifications: any,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('updateMaintenanceTaskNotifications');
    let service: SystemMaintenanceService | null = null;

    try {
      service = await this.systemMaintenanceServicePool.acquire();
      methodLogger.debug('Updating maintenance task notifications:', { task_id: taskId });

      const result = await service.updateMaintenanceTask(taskId, {
        configuration: {
          parameters: {},
          timeout: 3600,
          retryCount: 3,
          retryDelay: 60,
          notifications: notifications || [],
        },
      });

      methodLogger.info('Successfully updated maintenance task notifications');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update maintenance task notifications:', error);
      if (service) {
        this.systemMaintenanceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.systemMaintenanceServicePool.release(service);
      }
    }
  }

  static async getMaintenanceTaskMetrics(
    taskId: string,
    params: any,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getMaintenanceTaskMetrics');
    let service: SystemMaintenanceService | null = null;

    try {
      service = await this.systemMaintenanceServicePool.acquire();
      methodLogger.debug('Getting maintenance task metrics:', { task_id: taskId });

      const result = await service.getMaintenanceTask(taskId);

      methodLogger.info('Successfully retrieved maintenance task metrics');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get maintenance task metrics:', error);
      if (service) {
        this.systemMaintenanceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.systemMaintenanceServicePool.release(service);
      }
    }
  }

  static async getMaintenanceTaskReports(
    taskId: string,
    params: any,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getMaintenanceTaskReports');
    let service: SystemMaintenanceService | null = null;

    try {
      service = await this.systemMaintenanceServicePool.acquire();
      methodLogger.debug('Getting maintenance task reports:', { task_id: taskId });

      const result = await service.getMaintenanceTask(taskId);

      methodLogger.info('Successfully retrieved maintenance task reports');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get maintenance task reports:', error);
      if (service) {
        this.systemMaintenanceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.systemMaintenanceServicePool.release(service);
      }
    }
  }

  static async generateMaintenanceTaskReport(
    taskId: string,
    params: any,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('generateMaintenanceTaskReport');
    let service: SystemMaintenanceService | null = null;

    try {
      service = await this.systemMaintenanceServicePool.acquire();
      methodLogger.debug('Generating maintenance task report:', { task_id: taskId });

      const result = await service.getMaintenanceTask(taskId);

      methodLogger.info('Successfully generated maintenance task report');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to generate maintenance task report:', error);
      if (service) {
        this.systemMaintenanceServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.systemMaintenanceServicePool.release(service);
      }
    }
  }

  static register(server: McpServer): void {
    const registerLogger = this.logger.forMethod('register');

    // Initialize the service
    this.initialize();

    // Get System Status
    server.registerTool(
      'maintenance_get_system_status',
      {
        description: `Obtém status do sistema no Bitbucket Data Center.

**Funcionalidades:**
- Status do sistema
- Informações de versão
- Estado dos serviços

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o status do sistema.`,
        inputSchema: OutputOnlySchema.shape,
      },
      async (params: z.infer<typeof OutputOnlySchema>) => {
        const validatedParams = OutputOnlySchema.parse(params);
        return await this.getSystemStatus(validatedParams.output);
      }
    );

    // Get System Configuration
    server.registerTool(
      'maintenance_get_system_configuration',
      {
        description: `Obtém configuração do sistema no Bitbucket Data Center.

**Funcionalidades:**
- Configurações do sistema
- Parâmetros de ambiente
- Configurações de banco de dados

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a configuração do sistema.`,
        inputSchema: OutputOnlySchema.shape,
      },
      async (params: z.infer<typeof OutputOnlySchema>) => {
        const validatedParams = OutputOnlySchema.parse(params);
        return await this.getSystemConfiguration(validatedParams.output);
      }
    );

    // Get System Metrics
    server.registerTool(
      'maintenance_get_system_metrics',
      {
        description: `Obtém métricas do sistema no Bitbucket Data Center.

**Funcionalidades:**
- Métricas de performance
- Estatísticas de uso
- Indicadores de saúde

**Parâmetros:**
- \`start_date\`: Data de início (opcional)
- \`end_date\`: Data de fim (opcional)
- \`metric_type\`: Tipo de métrica (opcional)
- \`start\`: Índice de início para paginação (opcional)
- \`limit\`: Número máximo de resultados (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com as métricas do sistema.`,
        inputSchema: GetSystemMetricsSchema.shape,
      },
      async (params: z.infer<typeof GetSystemMetricsSchema>) => {
        const validatedParams = GetSystemMetricsSchema.parse(params);
        return await this.getSystemMetrics(
          {
            start_date: validatedParams.start_date,
            end_date: validatedParams.end_date,
            metric_type: validatedParams.metric_type,
            start: validatedParams.start,
            limit: validatedParams.limit,
          },
          validatedParams.output
        );
      }
    );

    // List Maintenance Tasks
    server.registerTool(
      'maintenance_list_tasks',
      {
        description: `Lista tarefas de manutenção no Bitbucket Data Center.

**Funcionalidades:**
- Listagem de tarefas
- Filtros e paginação
- Informações de status

**Parâmetros:**
- \`name\`: Filtro por nome da tarefa (opcional)
- \`status\`: Filtro por status (opcional)
- \`type\`: Filtro por tipo (opcional)
- \`start\`: Índice de início para paginação (opcional)
- \`limit\`: Número máximo de resultados (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de tarefas de manutenção.`,
        inputSchema: ListMaintenanceTasksSchema.shape,
      },
      async (params: z.infer<typeof ListMaintenanceTasksSchema>) => {
        const validatedParams = ListMaintenanceTasksSchema.parse(params);
        return await this.listMaintenanceTasks(
          {
            name: validatedParams.name,
            status: validatedParams.status,
            type: validatedParams.type,
            start: validatedParams.start,
            limit: validatedParams.limit,
          },
          validatedParams.output
        );
      }
    );

    // Create Maintenance Task
    server.registerTool(
      'maintenance_create_task',
      {
        description: `Cria uma nova tarefa de manutenção no Bitbucket Data Center.

**Funcionalidades:**
- Criação de tarefas
- Configuração de agendamento
- Metadados da tarefa

**Parâmetros:**
- \`name\`: Nome da tarefa
- \`description\`: Descrição da tarefa (opcional)
- \`type\`: Tipo da tarefa
- \`schedule\`: Agendamento da tarefa (opcional)
- \`enabled\`: Se a tarefa está habilitada (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes da tarefa criada.`,
        inputSchema: CreateMaintenanceTaskSchema.shape,
      },
      async (params: z.infer<typeof CreateMaintenanceTaskSchema>) => {
        const validatedParams = CreateMaintenanceTaskSchema.parse(params);
        return await this.createMaintenanceTask(
          {
            name: validatedParams.name,
            description: validatedParams.description,
            type: validatedParams.type,
            schedule: validatedParams.schedule,
            enabled: validatedParams.enabled,
          },
          validatedParams.output
        );
      }
    );

    // Get Maintenance Task
    server.registerTool(
      'maintenance_get_task',
      {
        description: `Obtém uma tarefa de manutenção específica no Bitbucket Data Center.

**Funcionalidades:**
- Detalhes da tarefa
- Informações específicas
- Status atual

**Parâmetros:**
- \`task_id\`: ID da tarefa

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes da tarefa.`,
        inputSchema: GetMaintenanceTaskSchema.shape,
      },
      async (params: z.infer<typeof GetMaintenanceTaskSchema>) => {
        const validatedParams = GetMaintenanceTaskSchema.parse(params);
        return await this.getMaintenanceTask(validatedParams.task_id, validatedParams.output);
      }
    );

    // Update Maintenance Task
    server.registerTool(
      'maintenance_update_task',
      {
        description: `Atualiza uma tarefa de manutenção no Bitbucket Data Center.

**Funcionalidades:**
- Modificação de tarefas
- Atualização de configurações
- Alteração de parâmetros

**Parâmetros:**
- \`task_id\`: ID da tarefa
- \`updates\`: Objeto com as atualizações

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a tarefa atualizada.`,
        inputSchema: UpdateMaintenanceTaskSchema.shape,
      },
      async (params: z.infer<typeof UpdateMaintenanceTaskSchema>) => {
        const validatedParams = UpdateMaintenanceTaskSchema.parse(params);
        return await this.updateMaintenanceTask(
          validatedParams.task_id,
          validatedParams.updates,
          validatedParams.output
        );
      }
    );

    // Delete Maintenance Task
    server.registerTool(
      'maintenance_delete_task',
      {
        description: `Remove uma tarefa de manutenção no Bitbucket Data Center.

**Funcionalidades:**
- Remoção de tarefas
- Limpeza de configurações
- Confirmação de exclusão

**Parâmetros:**
- \`task_id\`: ID da tarefa

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a confirmação da remoção.`,
        inputSchema: DeleteMaintenanceTaskSchema.shape,
      },
      async (params: z.infer<typeof DeleteMaintenanceTaskSchema>) => {
        const validatedParams = DeleteMaintenanceTaskSchema.parse(params);
        return await this.deleteMaintenanceTask(validatedParams.task_id, validatedParams.output);
      }
    );

    // Start Maintenance Task
    server.registerTool(
      'maintenance_start_task',
      {
        description: `Inicia uma tarefa de manutenção no Bitbucket Data Center.

**Funcionalidades:**
- Início de tarefas
- Execução imediata
- Monitoramento de progresso

**Parâmetros:**
- \`task_id\`: ID da tarefa

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a tarefa iniciada.`,
        inputSchema: StartMaintenanceTaskSchema.shape,
      },
      async (params: z.infer<typeof StartMaintenanceTaskSchema>) => {
        const validatedParams = StartMaintenanceTaskSchema.parse(params);
        return await this.startMaintenanceTask(validatedParams.task_id, validatedParams.output);
      }
    );

    // Stop Maintenance Task
    server.registerTool(
      'maintenance_stop_task',
      {
        description: `Para uma tarefa de manutenção no Bitbucket Data Center.

**Funcionalidades:**
- Parada de tarefas
- Interrupção de execução
- Limpeza de recursos

**Parâmetros:**
- \`task_id\`: ID da tarefa

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a tarefa parada.`,
        inputSchema: StopMaintenanceTaskSchema.shape,
      },
      async (params: z.infer<typeof StopMaintenanceTaskSchema>) => {
        const validatedParams = StopMaintenanceTaskSchema.parse(params);
        return await this.stopMaintenanceTask(validatedParams.task_id, validatedParams.output);
      }
    );

    // Pause Maintenance Task
    server.registerTool(
      'maintenance_pause_task',
      {
        description: `Pausa uma tarefa de manutenção no Bitbucket Data Center.

**Funcionalidades:**
- Pausa de tarefas
- Interrupção temporária
- Preservação de estado

**Parâmetros:**
- \`task_id\`: ID da tarefa

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a tarefa pausada.`,
        inputSchema: PauseMaintenanceTaskSchema.shape,
      },
      async (params: z.infer<typeof PauseMaintenanceTaskSchema>) => {
        const validatedParams = PauseMaintenanceTaskSchema.parse(params);
        return await this.pauseMaintenanceTask(validatedParams.task_id, validatedParams.output);
      }
    );

    // Resume Maintenance Task
    server.registerTool(
      'maintenance_resume_task',
      {
        description: `Retoma uma tarefa de manutenção no Bitbucket Data Center.

**Funcionalidades:**
- Retomada de tarefas
- Continuação de execução
- Restauração de estado

**Parâmetros:**
- \`task_id\`: ID da tarefa

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a tarefa retomada.`,
        inputSchema: ResumeMaintenanceTaskSchema.shape,
      },
      async (params: z.infer<typeof ResumeMaintenanceTaskSchema>) => {
        const validatedParams = ResumeMaintenanceTaskSchema.parse(params);
        return await this.resumeMaintenanceTask(validatedParams.task_id, validatedParams.output);
      }
    );

    // Get Maintenance Task Logs
    server.registerTool(
      'maintenance_get_task_logs',
      {
        description: `Obtém logs de uma tarefa de manutenção no Bitbucket Data Center.

**Funcionalidades:**
- Logs de tarefas
- Filtros e paginação
- Informações de debug

**Parâmetros:**
- \`task_id\`: ID da tarefa
- \`start_date\`: Data de início (opcional)
- \`end_date\`: Data de fim (opcional)
- \`level\`: Nível de log (opcional)
- \`start\`: Índice de início para paginação (opcional)
- \`limit\`: Número máximo de resultados (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os logs da tarefa.`,
        inputSchema: GetMaintenanceTaskLogsSchema.shape,
      },
      async (params: z.infer<typeof GetMaintenanceTaskLogsSchema>) => {
        const validatedParams = GetMaintenanceTaskLogsSchema.parse(params);
        return await this.getMaintenanceTaskLogs(
          validatedParams.task_id,
          {
            start_date: validatedParams.start_date,
            end_date: validatedParams.end_date,
            level: validatedParams.level,
            start: validatedParams.start,
            limit: validatedParams.limit,
          },
          validatedParams.output
        );
      }
    );

    // Get Maintenance Task History
    server.registerTool(
      'maintenance_get_task_history',
      {
        description: `Obtém histórico de uma tarefa de manutenção no Bitbucket Data Center.

**Funcionalidades:**
- Histórico de tarefas
- Filtros e paginação
- Informações de execução

**Parâmetros:**
- \`task_id\`: ID da tarefa
- \`start_date\`: Data de início (opcional)
- \`end_date\`: Data de fim (opcional)
- \`status\`: Filtro por status (opcional)
- \`start\`: Índice de início para paginação (opcional)
- \`limit\`: Número máximo de resultados (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o histórico da tarefa.`,
        inputSchema: GetMaintenanceTaskHistorySchema.shape,
      },
      async (params: z.infer<typeof GetMaintenanceTaskHistorySchema>) => {
        const validatedParams = GetMaintenanceTaskHistorySchema.parse(params);
        return await this.getMaintenanceTaskHistory(
          validatedParams.task_id,
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

    // Get Maintenance Task Status
    server.registerTool(
      'maintenance_get_task_status',
      {
        description: `Obtém status de uma tarefa de manutenção no Bitbucket Data Center.

**Funcionalidades:**
- Status da tarefa
- Informações de estado
- Indicadores de progresso

**Parâmetros:**
- \`task_id\`: ID da tarefa

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o status da tarefa.`,
        inputSchema: GetMaintenanceTaskStatusSchema.shape,
      },
      async (params: z.infer<typeof GetMaintenanceTaskStatusSchema>) => {
        const validatedParams = GetMaintenanceTaskStatusSchema.parse(params);
        return await this.getMaintenanceTaskStatus(validatedParams.task_id, validatedParams.output);
      }
    );

    // Get Maintenance Task Progress
    server.registerTool(
      'maintenance_get_task_progress',
      {
        description: `Obtém progresso de uma tarefa de manutenção no Bitbucket Data Center.

**Funcionalidades:**
- Progresso da tarefa
- Percentual de conclusão
- Estimativas de tempo

**Parâmetros:**
- \`task_id\`: ID da tarefa

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o progresso da tarefa.`,
        inputSchema: GetMaintenanceTaskProgressSchema.shape,
      },
      async (params: z.infer<typeof GetMaintenanceTaskProgressSchema>) => {
        const validatedParams = GetMaintenanceTaskProgressSchema.parse(params);
        return await this.getMaintenanceTaskProgress(
          validatedParams.task_id,
          validatedParams.output
        );
      }
    );

    // Get Maintenance Task Results
    server.registerTool(
      'maintenance_get_task_results',
      {
        description: `Obtém resultados de uma tarefa de manutenção no Bitbucket Data Center.

**Funcionalidades:**
- Resultados da tarefa
- Filtros e paginação
- Informações de saída

**Parâmetros:**
- \`task_id\`: ID da tarefa
- \`start_date\`: Data de início (opcional)
- \`end_date\`: Data de fim (opcional)
- \`status\`: Filtro por status (opcional)
- \`start\`: Índice de início para paginação (opcional)
- \`limit\`: Número máximo de resultados (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os resultados da tarefa.`,
        inputSchema: GetMaintenanceTaskResultsSchema.shape,
      },
      async (params: z.infer<typeof GetMaintenanceTaskResultsSchema>) => {
        const validatedParams = GetMaintenanceTaskResultsSchema.parse(params);
        return await this.getMaintenanceTaskResults(
          validatedParams.task_id,
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

    // Get Maintenance Task Schedule
    server.registerTool(
      'maintenance_get_task_schedule',
      {
        description: `Obtém agendamento de uma tarefa de manutenção no Bitbucket Data Center.

**Funcionalidades:**
- Agendamento da tarefa
- Configurações de cron
- Próximas execuções

**Parâmetros:**
- \`task_id\`: ID da tarefa

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o agendamento da tarefa.`,
        inputSchema: GetMaintenanceTaskScheduleSchema.shape,
      },
      async (params: z.infer<typeof GetMaintenanceTaskScheduleSchema>) => {
        const validatedParams = GetMaintenanceTaskScheduleSchema.parse(params);
        return await this.getMaintenanceTaskSchedule(
          validatedParams.task_id,
          validatedParams.output
        );
      }
    );

    // Update Maintenance Task Schedule
    server.registerTool(
      'maintenance_update_task_schedule',
      {
        description: `Atualiza agendamento de uma tarefa de manutenção no Bitbucket Data Center.

**Funcionalidades:**
- Atualização de agendamento
- Modificação de cron
- Reconfiguração de execução

**Parâmetros:**
- \`task_id\`: ID da tarefa
- \`schedule\`: Objeto com o novo agendamento

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o agendamento atualizado.`,
        inputSchema: UpdateMaintenanceTaskScheduleSchema.shape,
      },
      async (params: z.infer<typeof UpdateMaintenanceTaskScheduleSchema>) => {
        const validatedParams = UpdateMaintenanceTaskScheduleSchema.parse(params);
        return await this.updateMaintenanceTaskSchedule(
          validatedParams.task_id,
          validatedParams.schedule,
          validatedParams.output
        );
      }
    );

    // Get Maintenance Task Dependencies
    server.registerTool(
      'maintenance_get_task_dependencies',
      {
        description: `Obtém dependências de uma tarefa de manutenção no Bitbucket Data Center.

**Funcionalidades:**
- Dependências da tarefa
- Relacionamentos
- Ordem de execução

**Parâmetros:**
- \`task_id\`: ID da tarefa

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com as dependências da tarefa.`,
        inputSchema: GetMaintenanceTaskDependenciesSchema.shape,
      },
      async (params: z.infer<typeof GetMaintenanceTaskDependenciesSchema>) => {
        const validatedParams = GetMaintenanceTaskDependenciesSchema.parse(params);
        return await this.getMaintenanceTaskDependencies(
          validatedParams.task_id,
          validatedParams.output
        );
      }
    );

    // Add Maintenance Task Dependency
    server.registerTool(
      'maintenance_add_task_dependency',
      {
        description: `Adiciona dependência a uma tarefa de manutenção no Bitbucket Data Center.

**Funcionalidades:**
- Adição de dependências
- Configuração de relacionamentos
- Ordem de execução

**Parâmetros:**
- \`task_id\`: ID da tarefa
- \`dependency_id\`: ID da dependência

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a dependência adicionada.`,
        inputSchema: AddMaintenanceTaskDependencySchema.shape,
      },
      async (params: z.infer<typeof AddMaintenanceTaskDependencySchema>) => {
        const validatedParams = AddMaintenanceTaskDependencySchema.parse(params);
        return await this.addMaintenanceTaskDependency(
          validatedParams.task_id,
          validatedParams.dependency_id,
          validatedParams.output
        );
      }
    );

    // Remove Maintenance Task Dependency
    server.registerTool(
      'maintenance_remove_task_dependency',
      {
        description: `Remove dependência de uma tarefa de manutenção no Bitbucket Data Center.

**Funcionalidades:**
- Remoção de dependências
- Limpeza de relacionamentos
- Reconfiguração de ordem

**Parâmetros:**
- \`task_id\`: ID da tarefa
- \`dependency_id\`: ID da dependência

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a dependência removida.`,
        inputSchema: RemoveMaintenanceTaskDependencySchema.shape,
      },
      async (params: z.infer<typeof RemoveMaintenanceTaskDependencySchema>) => {
        const validatedParams = RemoveMaintenanceTaskDependencySchema.parse(params);
        return await this.removeMaintenanceTaskDependency(
          validatedParams.task_id,
          validatedParams.dependency_id,
          validatedParams.output
        );
      }
    );

    // Get Maintenance Task Notifications
    server.registerTool(
      'maintenance_get_task_notifications',
      {
        description: `Obtém notificações de uma tarefa de manutenção no Bitbucket Data Center.

**Funcionalidades:**
- Notificações da tarefa
- Configurações de alerta
- Canais de comunicação

**Parâmetros:**
- \`task_id\`: ID da tarefa

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com as notificações da tarefa.`,
        inputSchema: GetMaintenanceTaskNotificationsSchema.shape,
      },
      async (params: z.infer<typeof GetMaintenanceTaskNotificationsSchema>) => {
        const validatedParams = GetMaintenanceTaskNotificationsSchema.parse(params);
        return await this.getMaintenanceTaskNotifications(
          validatedParams.task_id,
          validatedParams.output
        );
      }
    );

    // Update Maintenance Task Notifications
    server.registerTool(
      'maintenance_update_task_notifications',
      {
        description: `Atualiza notificações de uma tarefa de manutenção no Bitbucket Data Center.

**Funcionalidades:**
- Atualização de notificações
- Modificação de alertas
- Configuração de canais

**Parâmetros:**
- \`task_id\`: ID da tarefa
- \`notifications\`: Objeto com as notificações

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com as notificações atualizadas.`,
        inputSchema: UpdateMaintenanceTaskNotificationsSchema.shape,
      },
      async (params: z.infer<typeof UpdateMaintenanceTaskNotificationsSchema>) => {
        const validatedParams = UpdateMaintenanceTaskNotificationsSchema.parse(params);
        return await this.updateMaintenanceTaskNotifications(
          validatedParams.task_id,
          validatedParams.notifications,
          validatedParams.output
        );
      }
    );

    // Get Maintenance Task Metrics
    server.registerTool(
      'maintenance_get_task_metrics',
      {
        description: `Obtém métricas de uma tarefa de manutenção no Bitbucket Data Center.

**Funcionalidades:**
- Métricas da tarefa
- Estatísticas de performance
- Indicadores de uso

**Parâmetros:**
- \`task_id\`: ID da tarefa
- \`start_date\`: Data de início (opcional)
- \`end_date\`: Data de fim (opcional)
- \`metric_type\`: Tipo de métrica (opcional)
- \`start\`: Índice de início para paginação (opcional)
- \`limit\`: Número máximo de resultados (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com as métricas da tarefa.`,
        inputSchema: GetMaintenanceTaskMetricsSchema.shape,
      },
      async (params: z.infer<typeof GetMaintenanceTaskMetricsSchema>) => {
        const validatedParams = GetMaintenanceTaskMetricsSchema.parse(params);
        return await this.getMaintenanceTaskMetrics(
          validatedParams.task_id,
          {
            start_date: validatedParams.start_date,
            end_date: validatedParams.end_date,
            metric_type: validatedParams.metric_type,
            start: validatedParams.start,
            limit: validatedParams.limit,
          },
          validatedParams.output
        );
      }
    );

    // Get Maintenance Task Reports
    server.registerTool(
      'maintenance_get_task_reports',
      {
        description: `Obtém relatórios de uma tarefa de manutenção no Bitbucket Data Center.

**Funcionalidades:**
- Relatórios da tarefa
- Filtros e paginação
- Informações de saída

**Parâmetros:**
- \`task_id\`: ID da tarefa
- \`start_date\`: Data de início (opcional)
- \`end_date\`: Data de fim (opcional)
- \`report_type\`: Tipo de relatório (opcional)
- \`start\`: Índice de início para paginação (opcional)
- \`limit\`: Número máximo de resultados (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os relatórios da tarefa.`,
        inputSchema: GetMaintenanceTaskReportsSchema.shape,
      },
      async (params: z.infer<typeof GetMaintenanceTaskReportsSchema>) => {
        const validatedParams = GetMaintenanceTaskReportsSchema.parse(params);
        return await this.getMaintenanceTaskReports(
          validatedParams.task_id,
          {
            start_date: validatedParams.start_date,
            end_date: validatedParams.end_date,
            report_type: validatedParams.report_type,
            start: validatedParams.start,
            limit: validatedParams.limit,
          },
          validatedParams.output
        );
      }
    );

    // Generate Maintenance Task Report
    server.registerTool(
      'maintenance_generate_task_report',
      {
        description: `Gera relatório de uma tarefa de manutenção no Bitbucket Data Center.

**Funcionalidades:**
- Geração de relatórios
- Configuração de formato
- Exportação de dados

**Parâmetros:**
- \`task_id\`: ID da tarefa
- \`report_type\`: Tipo de relatório
- \`start_date\`: Data de início (opcional)
- \`end_date\`: Data de fim (opcional)
- \`format\`: Formato do relatório (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o relatório gerado.`,
        inputSchema: GenerateMaintenanceTaskReportSchema.shape,
      },
      async (params: z.infer<typeof GenerateMaintenanceTaskReportSchema>) => {
        const validatedParams = GenerateMaintenanceTaskReportSchema.parse(params);
        return await this.generateMaintenanceTaskReport(
          validatedParams.task_id,
          {
            report_type: validatedParams.report_type,
            start_date: validatedParams.start_date,
            end_date: validatedParams.end_date,
            format: validatedParams.format,
          },
          validatedParams.output
        );
      }
    );

    registerLogger.info('Successfully registered all data center system maintenance tools');
  }
}
