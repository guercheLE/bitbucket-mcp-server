/**
 * Dashboard Service for Bitbucket Data Center REST API
 * Based on official documentation: https://developer.atlassian.com/server/bitbucket/rest/v906/intro/
 */

import {
  Dashboard,
  DashboardAnalytics,
  DashboardAnalyticsListResponse,
  DashboardAnalyticsResponse,
  DashboardCreateRequest,
  DashboardData,
  DashboardDataListResponse,
  DashboardDataResponse,
  DashboardListResponse,
  DashboardPreferences,
  DashboardPreferencesResponse,
  DashboardQueryParams,
  DashboardResponse,
  DashboardShare,
  DashboardShareListResponse,
  DashboardShareRequest,
  DashboardShareResponse,
  DashboardTemplate,
  DashboardTemplateListResponse,
  DashboardTemplateQueryParams,
  DashboardTemplateResponse,
  DashboardUpdateRequest,
  Widget,
  WidgetCreateRequest,
  WidgetListResponse,
  WidgetResponse,
  WidgetUpdateRequest,
} from './types/dashboard.types.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';

export class DashboardService {
  private readonly apiClient: ApiClient;
  private readonly logger: Logger;

  constructor(apiClient: ApiClient, logger: Logger) {
    this.apiClient = apiClient;
    this.logger = logger;
  }

  // Dashboard Management
  /**
   * Create a new dashboard
   * POST /rest/api/1.0/dashboards
   */
  async createDashboard(request: DashboardCreateRequest): Promise<DashboardResponse> {
    this.logger.info('Creating dashboard', { name: request.name });

    try {
      const response = await this.apiClient.post<DashboardResponse>('/dashboards', request);
      this.logger.info('Successfully created dashboard', {
        id: response.data.id,
        name: response.data.name,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create dashboard', { request, error });
      throw error;
    }
  }

  /**
   * Get dashboard by ID
   * GET /rest/api/1.0/dashboards/{dashboardId}
   */
  async getDashboard(dashboardId: string): Promise<DashboardResponse> {
    this.logger.info('Getting dashboard', { dashboardId });

    try {
      const response = await this.apiClient.get<DashboardResponse>(`/dashboards/${dashboardId}`);
      this.logger.info('Successfully retrieved dashboard', {
        dashboardId,
        name: response.data.name,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get dashboard', { dashboardId, error });
      throw error;
    }
  }

  /**
   * Update dashboard
   * PUT /rest/api/1.0/dashboards/{dashboardId}
   */
  async updateDashboard(
    dashboardId: string,
    request: DashboardUpdateRequest
  ): Promise<DashboardResponse> {
    this.logger.info('Updating dashboard', { dashboardId, request });

    try {
      const response = await this.apiClient.put<DashboardResponse>(
        `/dashboards/${dashboardId}`,
        request
      );
      this.logger.info('Successfully updated dashboard', { dashboardId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update dashboard', { dashboardId, request, error });
      throw error;
    }
  }

  /**
   * Delete dashboard
   * DELETE /rest/api/1.0/dashboards/{dashboardId}
   */
  async deleteDashboard(dashboardId: string): Promise<void> {
    this.logger.info('Deleting dashboard', { dashboardId });

    try {
      await this.apiClient.delete(`/dashboards/${dashboardId}`);
      this.logger.info('Successfully deleted dashboard', { dashboardId });
    } catch (error) {
      this.logger.error('Failed to delete dashboard', { dashboardId, error });
      throw error;
    }
  }

  /**
   * List dashboards
   * GET /rest/api/1.0/dashboards
   */
  async listDashboards(params?: DashboardQueryParams): Promise<DashboardListResponse> {
    this.logger.info('Listing dashboards', { params });

    try {
      const response = await this.apiClient.get<DashboardListResponse>('/dashboards', { params });
      this.logger.info('Successfully listed dashboards', { count: response.data.values.length });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list dashboards', { params, error });
      throw error;
    }
  }

  /**
   * Clone dashboard
   * POST /rest/api/1.0/dashboards/{dashboardId}/clone
   */
  async cloneDashboard(dashboardId: string, newName: string): Promise<DashboardResponse> {
    this.logger.info('Cloning dashboard', { dashboardId, newName });

    try {
      const response = await this.apiClient.post<DashboardResponse>(
        `/dashboards/${dashboardId}/clone`,
        {
          name: newName,
        }
      );
      this.logger.info('Successfully cloned dashboard', { dashboardId, newId: response.data.id });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to clone dashboard', { dashboardId, newName, error });
      throw error;
    }
  }

  // Widget Management
  /**
   * Add widget to dashboard
   * POST /rest/api/1.0/dashboards/{dashboardId}/widgets
   */
  async addWidgetToDashboard(
    dashboardId: string,
    request: WidgetCreateRequest
  ): Promise<WidgetResponse> {
    this.logger.info('Adding widget to dashboard', { dashboardId, request });

    try {
      const response = await this.apiClient.post<WidgetResponse>(
        `/dashboards/${dashboardId}/widgets`,
        request
      );
      this.logger.info('Successfully added widget to dashboard', {
        dashboardId,
        widgetId: response.data.id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to add widget to dashboard', { dashboardId, request, error });
      throw error;
    }
  }

  /**
   * Update widget
   * PUT /rest/api/1.0/dashboards/{dashboardId}/widgets/{widgetId}
   */
  async updateWidget(
    dashboardId: string,
    widgetId: string,
    request: WidgetUpdateRequest
  ): Promise<WidgetResponse> {
    this.logger.info('Updating widget', { dashboardId, widgetId, request });

    try {
      const response = await this.apiClient.put<WidgetResponse>(
        `/dashboards/${dashboardId}/widgets/${widgetId}`,
        request
      );
      this.logger.info('Successfully updated widget', { dashboardId, widgetId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update widget', { dashboardId, widgetId, request, error });
      throw error;
    }
  }

  /**
   * Remove widget from dashboard
   * DELETE /rest/api/1.0/dashboards/{dashboardId}/widgets/{widgetId}
   */
  async removeWidgetFromDashboard(dashboardId: string, widgetId: string): Promise<void> {
    this.logger.info('Removing widget from dashboard', { dashboardId, widgetId });

    try {
      await this.apiClient.delete(`/dashboards/${dashboardId}/widgets/${widgetId}`);
      this.logger.info('Successfully removed widget from dashboard', { dashboardId, widgetId });
    } catch (error) {
      this.logger.error('Failed to remove widget from dashboard', { dashboardId, widgetId, error });
      throw error;
    }
  }

  /**
   * List available widgets
   * GET /rest/api/1.0/widgets
   */
  async listAvailableWidgets(): Promise<WidgetListResponse> {
    this.logger.info('Listing available widgets');

    try {
      const response = await this.apiClient.get<WidgetListResponse>('/widgets');
      this.logger.info('Successfully listed available widgets', {
        count: response.data.widgets.length,
        total: response.data.total,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list available widgets', { error });
      throw error;
    }
  }

  /**
   * Get widget by ID
   * GET /rest/api/1.0/widgets/{widgetId}
   */
  async getWidget(widgetId: string): Promise<WidgetResponse> {
    this.logger.info('Getting widget', { widgetId });

    try {
      const response = await this.apiClient.get<WidgetResponse>(`/widgets/${widgetId}`);
      this.logger.info('Successfully retrieved widget', { widgetId, name: response.data.name });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get widget', { widgetId, error });
      throw error;
    }
  }

  // Dashboard Data
  /**
   * Get dashboard data
   * GET /rest/api/1.0/dashboards/{dashboardId}/data
   */
  async getDashboardData(dashboardId: string): Promise<DashboardDataListResponse> {
    this.logger.info('Getting dashboard data', { dashboardId });

    try {
      const response = await this.apiClient.get<DashboardDataListResponse>(
        `/dashboards/${dashboardId}/data`
      );
      this.logger.info('Successfully retrieved dashboard data', {
        dashboardId,
        count: response.data.data.length,
        total: response.data.total,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get dashboard data', { dashboardId, error });
      throw error;
    }
  }

  /**
   * Get widget data
   * GET /rest/api/1.0/dashboards/{dashboardId}/widgets/{widgetId}/data
   */
  async getWidgetData(dashboardId: string, widgetId: string): Promise<DashboardDataResponse> {
    this.logger.info('Getting widget data', { dashboardId, widgetId });

    try {
      const response = await this.apiClient.get<DashboardDataResponse>(
        `/dashboards/${dashboardId}/widgets/${widgetId}/data`
      );
      this.logger.info('Successfully retrieved widget data', { dashboardId, widgetId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get widget data', { dashboardId, widgetId, error });
      throw error;
    }
  }

  /**
   * Refresh dashboard data
   * POST /rest/api/1.0/dashboards/{dashboardId}/refresh
   */
  async refreshDashboardData(dashboardId: string): Promise<void> {
    this.logger.info('Refreshing dashboard data', { dashboardId });

    try {
      await this.apiClient.post(`/dashboards/${dashboardId}/refresh`);
      this.logger.info('Successfully refreshed dashboard data', { dashboardId });
    } catch (error) {
      this.logger.error('Failed to refresh dashboard data', { dashboardId, error });
      throw error;
    }
  }

  /**
   * Refresh widget data
   * POST /rest/api/1.0/dashboards/{dashboardId}/widgets/{widgetId}/refresh
   */
  async refreshWidgetData(dashboardId: string, widgetId: string): Promise<void> {
    this.logger.info('Refreshing widget data', { dashboardId, widgetId });

    try {
      await this.apiClient.post(`/dashboards/${dashboardId}/widgets/${widgetId}/refresh`);
      this.logger.info('Successfully refreshed widget data', { dashboardId, widgetId });
    } catch (error) {
      this.logger.error('Failed to refresh widget data', { dashboardId, widgetId, error });
      throw error;
    }
  }

  // Dashboard Sharing
  /**
   * Share dashboard
   * POST /rest/api/1.0/dashboards/{dashboardId}/shares
   */
  async shareDashboard(
    dashboardId: string,
    request: DashboardShareRequest
  ): Promise<DashboardShareResponse> {
    this.logger.info('Sharing dashboard', { dashboardId, request });

    try {
      const response = await this.apiClient.post<DashboardShareResponse>(
        `/dashboards/${dashboardId}/shares`,
        request
      );
      this.logger.info('Successfully shared dashboard', { dashboardId, shareId: response.data.id });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to share dashboard', { dashboardId, request, error });
      throw error;
    }
  }

  /**
   * List dashboard shares
   * GET /rest/api/1.0/dashboards/{dashboardId}/shares
   */
  async listDashboardShares(dashboardId: string): Promise<DashboardShareListResponse> {
    this.logger.info('Listing dashboard shares', { dashboardId });

    try {
      const response = await this.apiClient.get<DashboardShareListResponse>(
        `/dashboards/${dashboardId}/shares`
      );
      this.logger.info('Successfully listed dashboard shares', {
        dashboardId,
        count: response.data.shares.length,
        total: response.data.total,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list dashboard shares', { dashboardId, error });
      throw error;
    }
  }

  /**
   * Update dashboard share
   * PUT /rest/api/1.0/dashboards/{dashboardId}/shares/{shareId}
   */
  async updateDashboardShare(
    dashboardId: string,
    shareId: string,
    request: DashboardShareRequest
  ): Promise<DashboardShareResponse> {
    this.logger.info('Updating dashboard share', { dashboardId, shareId, request });

    try {
      const response = await this.apiClient.put<DashboardShareResponse>(
        `/dashboards/${dashboardId}/shares/${shareId}`,
        request
      );
      this.logger.info('Successfully updated dashboard share', { dashboardId, shareId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update dashboard share', {
        dashboardId,
        shareId,
        request,
        error,
      });
      throw error;
    }
  }

  /**
   * Remove dashboard share
   * DELETE /rest/api/1.0/dashboards/{dashboardId}/shares/{shareId}
   */
  async removeDashboardShare(dashboardId: string, shareId: string): Promise<void> {
    this.logger.info('Removing dashboard share', { dashboardId, shareId });

    try {
      await this.apiClient.delete(`/dashboards/${dashboardId}/shares/${shareId}`);
      this.logger.info('Successfully removed dashboard share', { dashboardId, shareId });
    } catch (error) {
      this.logger.error('Failed to remove dashboard share', { dashboardId, shareId, error });
      throw error;
    }
  }

  // Dashboard Templates
  /**
   * List dashboard templates
   * GET /rest/api/1.0/dashboard-templates
   */
  async listDashboardTemplates(
    params?: DashboardTemplateQueryParams
  ): Promise<DashboardTemplateListResponse> {
    this.logger.info('Listing dashboard templates', { params });

    try {
      const response = await this.apiClient.get<DashboardTemplateListResponse>(
        '/dashboard-templates',
        { params }
      );
      this.logger.info('Successfully listed dashboard templates', {
        count: response.data.templates.length,
        total: response.data.total,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list dashboard templates', { params, error });
      throw error;
    }
  }

  /**
   * Get dashboard template by ID
   * GET /rest/api/1.0/dashboard-templates/{templateId}
   */
  async getDashboardTemplate(templateId: string): Promise<DashboardTemplateResponse> {
    this.logger.info('Getting dashboard template', { templateId });

    try {
      const response = await this.apiClient.get<DashboardTemplateResponse>(
        `/dashboard-templates/${templateId}`
      );
      this.logger.info('Successfully retrieved dashboard template', {
        templateId,
        name: response.data.name,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get dashboard template', { templateId, error });
      throw error;
    }
  }

  /**
   * Create dashboard from template
   * POST /rest/api/1.0/dashboard-templates/{templateId}/create
   */
  async createDashboardFromTemplate(templateId: string, name: string): Promise<DashboardResponse> {
    this.logger.info('Creating dashboard from template', { templateId, name });

    try {
      const response = await this.apiClient.post<DashboardResponse>(
        `/dashboard-templates/${templateId}/create`,
        {
          name,
        }
      );
      this.logger.info('Successfully created dashboard from template', {
        templateId,
        dashboardId: response.data.id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create dashboard from template', { templateId, name, error });
      throw error;
    }
  }

  // Dashboard Preferences
  /**
   * Get user dashboard preferences
   * GET /rest/api/1.0/dashboard-preferences
   */
  async getDashboardPreferences(): Promise<DashboardPreferencesResponse> {
    this.logger.info('Getting dashboard preferences');

    try {
      const response =
        await this.apiClient.get<DashboardPreferencesResponse>('/dashboard-preferences');
      this.logger.info('Successfully retrieved dashboard preferences', {
        userId: response.data.userId,
        defaultDashboard: response.data.defaultDashboard,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get dashboard preferences', { error });
      throw error;
    }
  }

  /**
   * Update user dashboard preferences
   * PUT /rest/api/1.0/dashboard-preferences
   */
  async updateDashboardPreferences(
    preferences: DashboardPreferences
  ): Promise<DashboardPreferencesResponse> {
    this.logger.info('Updating dashboard preferences', { preferences });

    try {
      const response = await this.apiClient.put<DashboardPreferencesResponse>(
        '/dashboard-preferences',
        preferences
      );
      this.logger.info('Successfully updated dashboard preferences');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update dashboard preferences', { preferences, error });
      throw error;
    }
  }

  // Dashboard Analytics
  /**
   * Get dashboard analytics
   * GET /rest/api/1.0/dashboards/{dashboardId}/analytics
   */
  async getDashboardAnalytics(dashboardId: string): Promise<DashboardAnalyticsResponse> {
    this.logger.info('Getting dashboard analytics', { dashboardId });

    try {
      const response = await this.apiClient.get<DashboardAnalyticsResponse>(
        `/dashboards/${dashboardId}/analytics`
      );
      this.logger.info('Successfully retrieved dashboard analytics', {
        dashboardId,
        views: response.data.views,
        uniqueViewers: response.data.uniqueViewers,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get dashboard analytics', { dashboardId, error });
      throw error;
    }
  }

  /**
   * List dashboard analytics
   * GET /rest/api/1.0/dashboards/analytics
   */
  async listDashboardAnalytics(): Promise<DashboardAnalyticsListResponse> {
    this.logger.info('Listing dashboard analytics');

    try {
      const response =
        await this.apiClient.get<DashboardAnalyticsListResponse>('/dashboards/analytics');
      this.logger.info('Successfully listed dashboard analytics', {
        count: response.data.analytics.length,
        total: response.data.total,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list dashboard analytics', { error });
      throw error;
    }
  }
}
