/**
 * Data Center Dashboard Tools
 * Ferramentas para gerenciamento de dashboards no Bitbucket Data Center
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPool, Pool } from 'generic-pool';
import { DashboardService } from '../../services/datacenter/dashboard.service.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';
import { createMcpResponse, createErrorResponse } from '../../services/types/base.types.js';
import { z } from 'zod';

// Zod schemas for parameter validation
const CreateDashboardSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  is_public: z.boolean().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetDashboardSchema = z.object({
  dashboard_id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateDashboardSchema = z.object({
  dashboard_id: z.string(),
  updates: z.any(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteDashboardSchema = z.object({
  dashboard_id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListDashboardsSchema = z.object({
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CloneDashboardSchema = z.object({
  dashboard_id: z.string(),
  new_name: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const AddWidgetSchema = z.object({
  dashboard_id: z.string(),
  widget_type: z.string(),
  position: z.any().optional(),
  config: z.any().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateWidgetSchema = z.object({
  dashboard_id: z.string(),
  widget_id: z.string(),
  updates: z.any(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const RemoveWidgetSchema = z.object({
  dashboard_id: z.string(),
  widget_id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListAvailableWidgetsSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetWidgetSchema = z.object({
  widget_id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetDashboardDataSchema = z.object({
  dashboard_id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetWidgetDataSchema = z.object({
  dashboard_id: z.string(),
  widget_id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const RefreshDashboardDataSchema = z.object({
  dashboard_id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const RefreshWidgetDataSchema = z.object({
  dashboard_id: z.string(),
  widget_id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ShareDashboardSchema = z.object({
  dashboard_id: z.string(),
  share_config: z.any(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListDashboardSharesSchema = z.object({
  dashboard_id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateDashboardShareSchema = z.object({
  dashboard_id: z.string(),
  share_id: z.string(),
  updates: z.any(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const RemoveDashboardShareSchema = z.object({
  dashboard_id: z.string(),
  share_id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListDashboardTemplatesSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetDashboardTemplateSchema = z.object({
  template_id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateDashboardFromTemplateSchema = z.object({
  template_id: z.string(),
  name: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetDashboardPreferencesSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateDashboardPreferencesSchema = z.object({
  preferences: z.any(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetDashboardAnalyticsSchema = z.object({
  dashboard_id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListDashboardAnalyticsSchema = z.object({
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

/**
 * Data Center Dashboard Tools
 * Ferramentas para gerenciamento de dashboards no Bitbucket Data Center
 */
export class DataCenterDashboardTools {
  private static logger = Logger.forContext('DataCenterDashboardTools');
  private static dashboardServicePool: Pool<DashboardService>;

  static initialize(): void {
    const dashboardServiceFactory = {
      create: async () =>
        new DashboardService(new ApiClient(), Logger.forContext('DashboardService')),
      destroy: async () => {},
    };

    this.dashboardServicePool = createPool(dashboardServiceFactory, {
      min: 2,
      max: 10,
    });
    this.logger.info('Data Center Dashboard tools initialized');
  }

  static async createDashboard(params: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('createDashboard');
    let service: DashboardService | null = null;

    try {
      service = await this.dashboardServicePool.acquire();
      methodLogger.debug('Creating dashboard:', {
        name: params.name,
      });

      const result = await service.createDashboard(params);

      methodLogger.info('Successfully created dashboard');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create dashboard:', error);
      if (service) {
        this.dashboardServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.dashboardServicePool.release(service);
      }
    }
  }

  static async getDashboard(dashboardId: string, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getDashboard');
    let service: DashboardService | null = null;

    try {
      service = await this.dashboardServicePool.acquire();
      methodLogger.debug('Getting dashboard:', {
        dashboardId,
      });

      const result = await service.getDashboard(dashboardId);

      methodLogger.info('Successfully retrieved dashboard');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get dashboard:', error);
      if (service) {
        this.dashboardServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.dashboardServicePool.release(service);
      }
    }
  }

  static async updateDashboard(
    dashboardId: string,
    params: any,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('updateDashboard');
    let service: DashboardService | null = null;

    try {
      service = await this.dashboardServicePool.acquire();
      methodLogger.debug('Updating dashboard:', {
        dashboardId,
      });

      const result = await service.updateDashboard(dashboardId, params);

      methodLogger.info('Successfully updated dashboard');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update dashboard:', error);
      if (service) {
        this.dashboardServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.dashboardServicePool.release(service);
      }
    }
  }

  static async deleteDashboard(dashboardId: string, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('deleteDashboard');
    let service: DashboardService | null = null;

    try {
      service = await this.dashboardServicePool.acquire();
      methodLogger.debug('Deleting dashboard:', {
        dashboardId,
      });

      const result = await service.deleteDashboard(dashboardId);

      methodLogger.info('Successfully deleted dashboard');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to delete dashboard:', error);
      if (service) {
        this.dashboardServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.dashboardServicePool.release(service);
      }
    }
  }

  static async listDashboards(params: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('listDashboards');
    let service: DashboardService | null = null;

    try {
      service = await this.dashboardServicePool.acquire();
      methodLogger.debug('Listing dashboards');

      const result = await service.listDashboards(params);

      methodLogger.info('Successfully listed dashboards');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list dashboards:', error);
      if (service) {
        this.dashboardServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.dashboardServicePool.release(service);
      }
    }
  }

  static async cloneDashboard(
    dashboardId: string,
    newName: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('cloneDashboard');
    let service: DashboardService | null = null;

    try {
      service = await this.dashboardServicePool.acquire();
      methodLogger.debug('Cloning dashboard:', {
        dashboardId,
        newName,
      });

      const result = await service.cloneDashboard(dashboardId, newName);

      methodLogger.info('Successfully cloned dashboard');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to clone dashboard:', error);
      if (service) {
        this.dashboardServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.dashboardServicePool.release(service);
      }
    }
  }

  static async addWidget(dashboardId: string, params: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('addWidget');
    let service: DashboardService | null = null;

    try {
      service = await this.dashboardServicePool.acquire();
      methodLogger.debug('Adding widget to dashboard:', {
        dashboardId,
      });

      const result = await service.addWidgetToDashboard(dashboardId, params);

      methodLogger.info('Successfully added widget');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to add widget:', error);
      if (service) {
        this.dashboardServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.dashboardServicePool.release(service);
      }
    }
  }

  static async updateWidget(
    dashboardId: string,
    widgetId: string,
    params: any,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('updateWidget');
    let service: DashboardService | null = null;

    try {
      service = await this.dashboardServicePool.acquire();
      methodLogger.debug('Updating widget:', {
        dashboardId,
        widgetId,
      });

      const result = await service.updateWidget(dashboardId, widgetId, params);

      methodLogger.info('Successfully updated widget');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update widget:', error);
      if (service) {
        this.dashboardServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.dashboardServicePool.release(service);
      }
    }
  }

  static async removeWidget(
    dashboardId: string,
    widgetId: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('removeWidget');
    let service: DashboardService | null = null;

    try {
      service = await this.dashboardServicePool.acquire();
      methodLogger.debug('Removing widget:', {
        dashboardId,
        widgetId,
      });

      const result = await service.removeWidgetFromDashboard(dashboardId, widgetId);

      methodLogger.info('Successfully removed widget');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to remove widget:', error);
      if (service) {
        this.dashboardServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.dashboardServicePool.release(service);
      }
    }
  }

  static async listAvailableWidgets(output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('listAvailableWidgets');
    let service: DashboardService | null = null;

    try {
      service = await this.dashboardServicePool.acquire();
      methodLogger.debug('Listing available widgets');

      const result = await service.listAvailableWidgets();

      methodLogger.info('Successfully listed available widgets');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list available widgets:', error);
      if (service) {
        this.dashboardServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.dashboardServicePool.release(service);
      }
    }
  }

  static async getWidget(widgetId: string, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getWidget');
    let service: DashboardService | null = null;

    try {
      service = await this.dashboardServicePool.acquire();
      methodLogger.debug('Getting widget:', {
        widgetId,
      });

      const result = await service.getWidget(widgetId);

      methodLogger.info('Successfully retrieved widget');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get widget:', error);
      if (service) {
        this.dashboardServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.dashboardServicePool.release(service);
      }
    }
  }

  static async getData(dashboardId: string, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getData');
    let service: DashboardService | null = null;

    try {
      service = await this.dashboardServicePool.acquire();
      methodLogger.debug('Getting dashboard data:', { dashboardId });

      const result = await service.getDashboardData(dashboardId);

      methodLogger.info('Successfully retrieved dashboard data');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get dashboard data:', error);
      if (service) {
        this.dashboardServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.dashboardServicePool.release(service);
      }
    }
  }

  static async getWidgetData(
    dashboardId: string,
    widgetId: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getWidgetData');
    let service: DashboardService | null = null;

    try {
      service = await this.dashboardServicePool.acquire();
      methodLogger.debug('Getting widget data:', { dashboardId, widgetId });

      const result = await service.getWidgetData(dashboardId, widgetId);

      methodLogger.info('Successfully retrieved widget data');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get widget data:', error);
      if (service) {
        this.dashboardServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.dashboardServicePool.release(service);
      }
    }
  }

  static async refreshData(dashboardId: string, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('refreshData');
    let service: DashboardService | null = null;

    try {
      service = await this.dashboardServicePool.acquire();
      methodLogger.debug('Refreshing dashboard data:', { dashboardId });

      const result = await service.refreshDashboardData(dashboardId);

      methodLogger.info('Successfully refreshed dashboard data');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to refresh dashboard data:', error);
      if (service) {
        this.dashboardServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.dashboardServicePool.release(service);
      }
    }
  }

  static async refreshWidgetData(
    dashboardId: string,
    widgetId: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('refreshWidgetData');
    let service: DashboardService | null = null;

    try {
      service = await this.dashboardServicePool.acquire();
      methodLogger.debug('Refreshing widget data:', { dashboardId, widgetId });

      const result = await service.refreshWidgetData(dashboardId, widgetId);

      methodLogger.info('Successfully refreshed widget data');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to refresh widget data:', error);
      if (service) {
        this.dashboardServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.dashboardServicePool.release(service);
      }
    }
  }

  static async shareDashboard(
    dashboardId: string,
    params: any,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('shareDashboard');
    let service: DashboardService | null = null;

    try {
      service = await this.dashboardServicePool.acquire();
      methodLogger.debug('Sharing dashboard:', { dashboardId });

      const result = await service.shareDashboard(dashboardId, params);

      methodLogger.info('Successfully shared dashboard');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to share dashboard:', error);
      if (service) {
        this.dashboardServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.dashboardServicePool.release(service);
      }
    }
  }

  static async listShares(dashboardId: string, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('listShares');
    let service: DashboardService | null = null;

    try {
      service = await this.dashboardServicePool.acquire();
      methodLogger.debug('Listing dashboard shares:', { dashboardId });

      const result = await service.listDashboardShares(dashboardId);

      methodLogger.info('Successfully listed dashboard shares');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list dashboard shares:', error);
      if (service) {
        this.dashboardServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.dashboardServicePool.release(service);
      }
    }
  }

  static async updateShare(
    dashboardId: string,
    shareId: string,
    params: any,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('updateShare');
    let service: DashboardService | null = null;

    try {
      service = await this.dashboardServicePool.acquire();
      methodLogger.debug('Updating dashboard share:', { dashboardId, shareId });

      const result = await service.updateDashboardShare(dashboardId, shareId, params);

      methodLogger.info('Successfully updated dashboard share');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update dashboard share:', error);
      if (service) {
        this.dashboardServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.dashboardServicePool.release(service);
      }
    }
  }

  static async removeShare(
    dashboardId: string,
    shareId: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('removeShare');
    let service: DashboardService | null = null;

    try {
      service = await this.dashboardServicePool.acquire();
      methodLogger.debug('Removing dashboard share:', { dashboardId, shareId });

      const result = await service.removeDashboardShare(dashboardId, shareId);

      methodLogger.info('Successfully removed dashboard share');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to remove dashboard share:', error);
      if (service) {
        this.dashboardServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.dashboardServicePool.release(service);
      }
    }
  }

  static async listTemplates(output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('listTemplates');
    let service: DashboardService | null = null;

    try {
      service = await this.dashboardServicePool.acquire();
      methodLogger.debug('Listing dashboard templates');

      const result = await service.listDashboardTemplates();

      methodLogger.info('Successfully listed dashboard templates');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list dashboard templates:', error);
      if (service) {
        this.dashboardServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.dashboardServicePool.release(service);
      }
    }
  }

  static async getTemplate(templateId: string, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getTemplate');
    let service: DashboardService | null = null;

    try {
      service = await this.dashboardServicePool.acquire();
      methodLogger.debug('Getting dashboard template:', { templateId });

      const result = await service.getDashboardTemplate(templateId);

      methodLogger.info('Successfully retrieved dashboard template');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get dashboard template:', error);
      if (service) {
        this.dashboardServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.dashboardServicePool.release(service);
      }
    }
  }

  static async createFromTemplate(
    templateId: string,
    name: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('createFromTemplate');
    let service: DashboardService | null = null;

    try {
      service = await this.dashboardServicePool.acquire();
      methodLogger.debug('Creating dashboard from template:', { templateId, name });

      const result = await service.createDashboardFromTemplate(templateId, name);

      methodLogger.info('Successfully created dashboard from template');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create dashboard from template:', error);
      if (service) {
        this.dashboardServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.dashboardServicePool.release(service);
      }
    }
  }

  static async getPreferences(output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getPreferences');
    let service: DashboardService | null = null;

    try {
      service = await this.dashboardServicePool.acquire();
      methodLogger.debug('Getting dashboard preferences');

      const result = await service.getDashboardPreferences();

      methodLogger.info('Successfully retrieved dashboard preferences');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get dashboard preferences:', error);
      if (service) {
        this.dashboardServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.dashboardServicePool.release(service);
      }
    }
  }

  static async updatePreferences(params: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('updatePreferences');
    let service: DashboardService | null = null;

    try {
      service = await this.dashboardServicePool.acquire();
      methodLogger.debug('Updating dashboard preferences');

      const result = await service.updateDashboardPreferences(params);

      methodLogger.info('Successfully updated dashboard preferences');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update dashboard preferences:', error);
      if (service) {
        this.dashboardServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.dashboardServicePool.release(service);
      }
    }
  }

  static async getAnalytics(dashboardId: string, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getAnalytics');
    let service: DashboardService | null = null;

    try {
      service = await this.dashboardServicePool.acquire();
      methodLogger.debug('Getting dashboard analytics:', { dashboardId });

      const result = await service.getDashboardAnalytics(dashboardId);

      methodLogger.info('Successfully retrieved dashboard analytics');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get dashboard analytics:', error);
      if (service) {
        this.dashboardServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.dashboardServicePool.release(service);
      }
    }
  }

  static async listAnalytics(
    params?: { start?: number; limit?: number },
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('listAnalytics');
    let service: DashboardService | null = null;

    try {
      service = await this.dashboardServicePool.acquire();
      methodLogger.debug('Listing dashboard analytics');

      const result = await service.listDashboardAnalytics();

      methodLogger.info('Successfully listed dashboard analytics');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list dashboard analytics:', error);
      if (service) {
        this.dashboardServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.dashboardServicePool.release(service);
      }
    }
  }

  static register(server: McpServer): void {
    const registerLogger = this.logger.forMethod('register');

    // Initialize the service
    this.initialize();

    // Create Dashboard
    server.registerTool(
      'dashboard_create',
      {
        description: `Cria um novo dashboard no Bitbucket Data Center.

**Funcionalidades:**
- Criação de dashboards
- Configuração de widgets
- Metadados do dashboard

**Parâmetros:**
- \`name\`: Nome do dashboard
- \`description\`: Descrição do dashboard (opcional)
- \`is_public\`: Se o dashboard é público (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do dashboard criado.`,
        inputSchema: CreateDashboardSchema.shape,
      },
      async (params: z.infer<typeof CreateDashboardSchema>) => {
        const validatedParams = CreateDashboardSchema.parse(params);
        return this.createDashboard(
          {
            name: validatedParams.name,
            description: validatedParams.description,
            is_public: validatedParams.is_public,
          },
          validatedParams.output
        );
      }
    );

    // Get Dashboard
    server.registerTool(
      'dashboard_get',
      {
        description: `Obtém um dashboard específico no Bitbucket Data Center.

**Funcionalidades:**
- Detalhes do dashboard
- Metadados e configurações
- Informações de widgets

**Parâmetros:**
- \`dashboard_id\`: ID do dashboard
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do dashboard.`,
        inputSchema: GetDashboardSchema.shape,
      },
      async (params: z.infer<typeof GetDashboardSchema>) => {
        const validatedParams = GetDashboardSchema.parse(params);
        return this.getDashboard(validatedParams.dashboard_id, validatedParams.output);
      }
    );

    // Update Dashboard
    server.registerTool(
      'dashboard_update',
      {
        description: `Atualiza um dashboard existente no Bitbucket Data Center.

**Funcionalidades:**
- Atualização de metadados
- Modificação de configurações
- Alteração de widgets

**Parâmetros:**
- \`dashboard_id\`: ID do dashboard
- \`updates\`: Objeto com as atualizações
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do dashboard atualizado.`,
        inputSchema: UpdateDashboardSchema.shape,
      },
      async (params: z.infer<typeof UpdateDashboardSchema>) => {
        const validatedParams = UpdateDashboardSchema.parse(params);
        return this.updateDashboard(
          validatedParams.dashboard_id,
          validatedParams.updates,
          validatedParams.output
        );
      }
    );

    // Delete Dashboard
    server.registerTool(
      'dashboard_delete',
      {
        description: `Exclui um dashboard no Bitbucket Data Center.

**Funcionalidades:**
- Remoção de dashboards
- Limpeza de recursos
- Verificação de dependências

**Parâmetros:**
- \`dashboard_id\`: ID do dashboard
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com confirmação da exclusão.`,
        inputSchema: DeleteDashboardSchema.shape,
      },
      async (params: z.infer<typeof DeleteDashboardSchema>) => {
        const validatedParams = DeleteDashboardSchema.parse(params);
        return this.deleteDashboard(validatedParams.dashboard_id, validatedParams.output);
      }
    );

    // List Dashboards
    server.registerTool(
      'dashboard_list',
      {
        description: `Lista dashboards no Bitbucket Data Center.

**Funcionalidades:**
- Listagem de dashboards
- Filtros e paginação
- Informações resumidas

**Parâmetros:**
- \`start\`: Índice de início para paginação (opcional)
- \`limit\`: Número máximo de resultados (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de dashboards.`,
        inputSchema: ListDashboardsSchema.shape,
      },
      async (params: z.infer<typeof ListDashboardsSchema>) => {
        const validatedParams = ListDashboardsSchema.parse(params);
        return this.listDashboards(
          { start: validatedParams.start, limit: validatedParams.limit },
          validatedParams.output
        );
      }
    );

    // Clone Dashboard
    server.registerTool(
      'dashboard_clone',
      {
        description: `Clona um dashboard existente no Bitbucket Data Center.

**Funcionalidades:**
- Clonagem de dashboards
- Cópia de configurações
- Criação de nova instância

**Parâmetros:**
- \`dashboard_id\`: ID do dashboard a ser clonado
- \`new_name\`: Nome do novo dashboard
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do dashboard clonado.`,
        inputSchema: CloneDashboardSchema.shape,
      },
      async (params: z.infer<typeof CloneDashboardSchema>) => {
        const validatedParams = CloneDashboardSchema.parse(params);
        return this.cloneDashboard(
          validatedParams.dashboard_id,
          validatedParams.new_name,
          validatedParams.output
        );
      }
    );

    // Add Widget to Dashboard
    server.registerTool(
      'dashboard_add_widget',
      {
        description: `Adiciona um widget a um dashboard no Bitbucket Data Center.

**Funcionalidades:**
- Adição de widgets
- Configuração de posição
- Metadados do widget

**Parâmetros:**
- \`dashboard_id\`: ID do dashboard
- \`widget_type\`: Tipo do widget
- \`position\`: Posição do widget (opcional)
- \`config\`: Configuração do widget (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do widget adicionado.`,
        inputSchema: AddWidgetSchema.shape,
      },
      async (params: z.infer<typeof AddWidgetSchema>) => {
        const validatedParams = AddWidgetSchema.parse(params);
        return this.addWidget(
          validatedParams.dashboard_id,
          {
            widget_type: validatedParams.widget_type,
            position: validatedParams.position,
            config: validatedParams.config,
          },
          validatedParams.output
        );
      }
    );

    // Update Widget
    server.registerTool(
      'dashboard_update_widget',
      {
        description: `Atualiza um widget em um dashboard no Bitbucket Data Center.

**Funcionalidades:**
- Atualização de widgets
- Modificação de configurações
- Alteração de posição

**Parâmetros:**
- \`dashboard_id\`: ID do dashboard
- \`widget_id\`: ID do widget
- \`updates\`: Objeto com as atualizações
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o widget atualizado.`,
        inputSchema: UpdateWidgetSchema.shape,
      },
      async (params: z.infer<typeof UpdateWidgetSchema>) => {
        const validatedParams = UpdateWidgetSchema.parse(params);
        return this.updateWidget(
          validatedParams.dashboard_id,
          validatedParams.widget_id,
          validatedParams.updates,
          validatedParams.output
        );
      }
    );

    // Remove Widget from Dashboard
    server.registerTool(
      'dashboard_remove_widget',
      {
        description: `Remove um widget de um dashboard no Bitbucket Data Center.

**Funcionalidades:**
- Remoção de widgets
- Limpeza de recursos
- Confirmação de exclusão

**Parâmetros:**
- \`dashboard_id\`: ID do dashboard
- \`widget_id\`: ID do widget
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a confirmação da remoção.`,
        inputSchema: RemoveWidgetSchema.shape,
      },
      async (params: z.infer<typeof RemoveWidgetSchema>) => {
        const validatedParams = RemoveWidgetSchema.parse(params);
        return this.removeWidget(
          validatedParams.dashboard_id,
          validatedParams.widget_id,
          validatedParams.output
        );
      }
    );

    // List Available Widgets
    server.registerTool(
      'dashboard_list_available_widgets',
      {
        description: `Lista widgets disponíveis no Bitbucket Data Center.

**Funcionalidades:**
- Listagem de widgets
- Informações de tipos
- Metadados disponíveis

**Parâmetros:**
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de widgets disponíveis.`,
        inputSchema: ListAvailableWidgetsSchema.shape,
      },
      async (params: z.infer<typeof ListAvailableWidgetsSchema>) => {
        const validatedParams = ListAvailableWidgetsSchema.parse(params);
        return this.listAvailableWidgets(validatedParams.output);
      }
    );

    // Get Widget
    server.registerTool(
      'dashboard_get_widget',
      {
        description: `Obtém um widget específico no Bitbucket Data Center.

**Funcionalidades:**
- Detalhes do widget
- Configurações específicas
- Metadados do widget

**Parâmetros:**
- \`widget_id\`: ID do widget
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do widget.`,
        inputSchema: GetWidgetSchema.shape,
      },
      async (params: z.infer<typeof GetWidgetSchema>) => {
        const validatedParams = GetWidgetSchema.parse(params);
        return this.getWidget(validatedParams.widget_id, validatedParams.output);
      }
    );

    // Get Dashboard Data
    server.registerTool(
      'dashboard_get_data',
      {
        description: `Obtém dados de um dashboard no Bitbucket Data Center.

**Funcionalidades:**
- Dados do dashboard
- Informações de widgets
- Métricas e estatísticas

**Parâmetros:**
- \`dashboard_id\`: ID do dashboard
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os dados do dashboard.`,
        inputSchema: GetDashboardDataSchema.shape,
      },
      async (params: z.infer<typeof GetDashboardDataSchema>) => {
        const validatedParams = GetDashboardDataSchema.parse(params);
        return this.getData(validatedParams.dashboard_id, validatedParams.output);
      }
    );

    // Get Widget Data
    server.registerTool(
      'dashboard_get_widget_data',
      {
        description: `Obtém dados de um widget específico no Bitbucket Data Center.

**Funcionalidades:**
- Dados do widget
- Métricas específicas
- Informações em tempo real

**Parâmetros:**
- \`dashboard_id\`: ID do dashboard
- \`widget_id\`: ID do widget
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os dados do widget.`,
        inputSchema: GetWidgetDataSchema.shape,
      },
      async (params: z.infer<typeof GetWidgetDataSchema>) => {
        const validatedParams = GetWidgetDataSchema.parse(params);
        return this.getWidgetData(
          validatedParams.dashboard_id,
          validatedParams.widget_id,
          validatedParams.output
        );
      }
    );

    // Refresh Dashboard Data
    server.registerTool(
      'dashboard_refresh_data',
      {
        description: `Atualiza dados de um dashboard no Bitbucket Data Center.

**Funcionalidades:**
- Atualização de dados
- Refresh de métricas
- Sincronização de informações

**Parâmetros:**
- \`dashboard_id\`: ID do dashboard
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a confirmação da atualização.`,
        inputSchema: RefreshDashboardDataSchema.shape,
      },
      async (params: z.infer<typeof RefreshDashboardDataSchema>) => {
        const validatedParams = RefreshDashboardDataSchema.parse(params);
        return this.refreshData(validatedParams.dashboard_id, validatedParams.output);
      }
    );

    // Refresh Widget Data
    server.registerTool(
      'dashboard_refresh_widget_data',
      {
        description: `Atualiza dados de um widget específico no Bitbucket Data Center.

**Funcionalidades:**
- Atualização de dados do widget
- Refresh de métricas específicas
- Sincronização de informações

**Parâmetros:**
- \`dashboard_id\`: ID do dashboard
- \`widget_id\`: ID do widget
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a confirmação da atualização.`,
        inputSchema: RefreshWidgetDataSchema.shape,
      },
      async (params: z.infer<typeof RefreshWidgetDataSchema>) => {
        const validatedParams = RefreshWidgetDataSchema.parse(params);
        return this.refreshWidgetData(
          validatedParams.dashboard_id,
          validatedParams.widget_id,
          validatedParams.output
        );
      }
    );

    // Share Dashboard
    server.registerTool(
      'dashboard_share',
      {
        description: `Compartilha um dashboard no Bitbucket Data Center.

**Funcionalidades:**
- Compartilhamento de dashboards
- Configuração de permissões
- Controle de acesso

**Parâmetros:**
- \`dashboard_id\`: ID do dashboard
- \`share_config\`: Configuração do compartilhamento
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do compartilhamento.`,
        inputSchema: ShareDashboardSchema.shape,
      },
      async (params: z.infer<typeof ShareDashboardSchema>) => {
        const validatedParams = ShareDashboardSchema.parse(params);
        return this.shareDashboard(
          validatedParams.dashboard_id,
          validatedParams.share_config,
          validatedParams.output
        );
      }
    );

    // List Dashboard Shares
    server.registerTool(
      'dashboard_list_shares',
      {
        description: `Lista compartilhamentos de um dashboard no Bitbucket Data Center.

**Funcionalidades:**
- Listagem de compartilhamentos
- Informações de permissões
- Controle de acesso

**Parâmetros:**
- \`dashboard_id\`: ID do dashboard
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de compartilhamentos.`,
        inputSchema: ListDashboardSharesSchema.shape,
      },
      async (params: z.infer<typeof ListDashboardSharesSchema>) => {
        const validatedParams = ListDashboardSharesSchema.parse(params);
        return this.listShares(validatedParams.dashboard_id, validatedParams.output);
      }
    );

    // Update Dashboard Share
    server.registerTool(
      'dashboard_update_share',
      {
        description: `Atualiza um compartilhamento de dashboard no Bitbucket Data Center.

**Funcionalidades:**
- Atualização de permissões
- Modificação de acesso
- Alteração de configurações

**Parâmetros:**
- \`dashboard_id\`: ID do dashboard
- \`share_id\`: ID do compartilhamento
- \`updates\`: Objeto com as atualizações
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o compartilhamento atualizado.`,
        inputSchema: UpdateDashboardShareSchema.shape,
      },
      async (params: z.infer<typeof UpdateDashboardShareSchema>) => {
        const validatedParams = UpdateDashboardShareSchema.parse(params);
        return this.updateShare(
          validatedParams.dashboard_id,
          validatedParams.share_id,
          validatedParams.updates,
          validatedParams.output
        );
      }
    );

    // Remove Dashboard Share
    server.registerTool(
      'dashboard_remove_share',
      {
        description: `Remove um compartilhamento de dashboard no Bitbucket Data Center.

**Funcionalidades:**
- Remoção de compartilhamentos
- Revogação de acesso
- Limpeza de permissões

**Parâmetros:**
- \`dashboard_id\`: ID do dashboard
- \`share_id\`: ID do compartilhamento
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a confirmação da remoção.`,
        inputSchema: RemoveDashboardShareSchema.shape,
      },
      async (params: z.infer<typeof RemoveDashboardShareSchema>) => {
        const validatedParams = RemoveDashboardShareSchema.parse(params);
        return this.removeShare(
          validatedParams.dashboard_id,
          validatedParams.share_id,
          validatedParams.output
        );
      }
    );

    // List Dashboard Templates
    server.registerTool(
      'dashboard_list_templates',
      {
        description: `Lista templates de dashboard no Bitbucket Data Center.

**Funcionalidades:**
- Listagem de templates
- Filtros e paginação
- Informações de templates

**Parâmetros:**
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de templates.`,
        inputSchema: ListDashboardTemplatesSchema.shape,
      },
      async (params: z.infer<typeof ListDashboardTemplatesSchema>) => {
        const validatedParams = ListDashboardTemplatesSchema.parse(params);
        return this.listTemplates(validatedParams.output);
      }
    );

    // Get Dashboard Template
    server.registerTool(
      'dashboard_get_template',
      {
        description: `Obtém um template de dashboard específico no Bitbucket Data Center.

**Funcionalidades:**
- Detalhes do template
- Configurações específicas
- Metadados do template

**Parâmetros:**
- \`template_id\`: ID do template
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do template.`,
        inputSchema: GetDashboardTemplateSchema.shape,
      },
      async (params: z.infer<typeof GetDashboardTemplateSchema>) => {
        const validatedParams = GetDashboardTemplateSchema.parse(params);
        return this.getTemplate(validatedParams.template_id, validatedParams.output);
      }
    );

    // Create Dashboard from Template
    server.registerTool(
      'dashboard_create_from_template',
      {
        description: `Cria um dashboard a partir de um template no Bitbucket Data Center.

**Funcionalidades:**
- Criação a partir de template
- Aplicação de configurações
- Personalização de metadados

**Parâmetros:**
- \`template_id\`: ID do template
- \`name\`: Nome do novo dashboard
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do dashboard criado.`,
        inputSchema: CreateDashboardFromTemplateSchema.shape,
      },
      async (params: z.infer<typeof CreateDashboardFromTemplateSchema>) => {
        const validatedParams = CreateDashboardFromTemplateSchema.parse(params);
        return this.createFromTemplate(
          validatedParams.template_id,
          validatedParams.name,
          validatedParams.output
        );
      }
    );

    // Get Dashboard Preferences
    server.registerTool(
      'dashboard_get_preferences',
      {
        description: `Obtém preferências de dashboard no Bitbucket Data Center.

**Funcionalidades:**
- Preferências do usuário
- Configurações personalizadas
- Metadados de preferências

**Parâmetros:**
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com as preferências do dashboard.`,
        inputSchema: GetDashboardPreferencesSchema.shape,
      },
      async (params: z.infer<typeof GetDashboardPreferencesSchema>) => {
        const validatedParams = GetDashboardPreferencesSchema.parse(params);
        return this.getPreferences(validatedParams.output);
      }
    );

    // Update Dashboard Preferences
    server.registerTool(
      'dashboard_update_preferences',
      {
        description: `Atualiza preferências de dashboard no Bitbucket Data Center.

**Funcionalidades:**
- Atualização de preferências
- Modificação de configurações
- Personalização de interface

**Parâmetros:**
- \`preferences\`: Objeto com as preferências a serem atualizadas
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com as preferências atualizadas.`,
        inputSchema: UpdateDashboardPreferencesSchema.shape,
      },
      async (params: z.infer<typeof UpdateDashboardPreferencesSchema>) => {
        const validatedParams = UpdateDashboardPreferencesSchema.parse(params);
        return this.updatePreferences(validatedParams.preferences, validatedParams.output);
      }
    );

    // Get Dashboard Analytics
    server.registerTool(
      'dashboard_get_analytics',
      {
        description: `Obtém analytics de um dashboard no Bitbucket Data Center.

**Funcionalidades:**
- Analytics do dashboard
- Métricas de uso
- Estatísticas de performance

**Parâmetros:**
- \`dashboard_id\`: ID do dashboard
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os analytics do dashboard.`,
        inputSchema: GetDashboardAnalyticsSchema.shape,
      },
      async (params: z.infer<typeof GetDashboardAnalyticsSchema>) => {
        const validatedParams = GetDashboardAnalyticsSchema.parse(params);
        return this.getAnalytics(validatedParams.dashboard_id, validatedParams.output);
      }
    );

    // List Dashboard Analytics
    server.registerTool(
      'dashboard_list_analytics',
      {
        description: `Lista analytics de dashboards no Bitbucket Data Center.

**Funcionalidades:**
- Listagem de analytics
- Filtros e paginação
- Informações de performance

**Parâmetros:**
- \`start\`: Índice de início para paginação (opcional)
- \`limit\`: Número máximo de resultados (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de analytics.`,
        inputSchema: ListDashboardAnalyticsSchema.shape,
      },
      async (params: z.infer<typeof ListDashboardAnalyticsSchema>) => {
        const validatedParams = ListDashboardAnalyticsSchema.parse(params);
        return this.listAnalytics(
          { start: validatedParams.start, limit: validatedParams.limit },
          validatedParams.output
        );
      }
    );

    registerLogger.info('Successfully registered all data center dashboard tools');
  }
}
