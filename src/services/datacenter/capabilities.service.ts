/**
 * Capabilities Service for Bitbucket Data Center REST API
 * Based on official documentation: https://developer.atlassian.com/server/bitbucket/rest/v906/intro/
 */

import {
  Capability,
  CapabilityConfiguration,
  CapabilityConfigurationRequest,
  CapabilityConfigurationResponse,
  CapabilityEvent,
  CapabilityEventListResponse,
  CapabilityEventQueryParams,
  CapabilityEventResponse,
  CapabilityListResponse,
  CapabilityMetrics,
  CapabilityMetricsListResponse,
  CapabilityMetricsResponse,
  CapabilityQueryParams,
  CapabilityResponse,
  CapabilityStatus,
  CapabilityStatusListResponse,
  CapabilityStatusResponse,
  FeatureCapability,
  FeatureCapabilityListResponse,
  FeatureCapabilityResponse,
  IntegrationCapability,
  IntegrationCapabilityListResponse,
  IntegrationCapabilityResponse,
  PluginCapability,
  PluginCapabilityListResponse,
  PluginCapabilityResponse,
  SystemCapabilities,
  SystemCapabilitiesResponse,
} from './types/capabilities.types.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';

export class CapabilitiesService {
  private readonly apiClient: ApiClient;
  private readonly logger: Logger;

  constructor(apiClient: ApiClient, logger: Logger) {
    this.apiClient = apiClient;
    this.logger = logger;
  }

  /**
   * Get system capabilities
   * GET /rest/api/1.0/capabilities
   */
  async getSystemCapabilities(): Promise<SystemCapabilitiesResponse> {
    this.logger.info('Getting system capabilities');

    try {
      const response = await this.apiClient.get<SystemCapabilitiesResponse>('/capabilities');
      this.logger.info('Successfully retrieved system capabilities', {
        version: response.data.version,
        buildNumber: response.data.buildNumber,
        capabilitiesCount: response.data.capabilities.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get system capabilities', { error });
      throw error;
    }
  }

  /**
   * List all capabilities
   * GET /rest/api/1.0/capabilities/list
   */
  async listCapabilities(params?: CapabilityQueryParams): Promise<CapabilityListResponse> {
    this.logger.info('Listing capabilities', { params });

    try {
      const response = await this.apiClient.get<CapabilityListResponse>('/capabilities/list', {
        params,
      });
      this.logger.info('Successfully listed capabilities', {
        count: response.data.capabilities.length,
        total: response.data.total,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list capabilities', { params, error });
      throw error;
    }
  }

  /**
   * Get capability by ID
   * GET /rest/api/1.0/capabilities/{capabilityId}
   */
  async getCapability(capabilityId: string): Promise<CapabilityResponse> {
    this.logger.info('Getting capability', { capabilityId });

    try {
      const response = await this.apiClient.get<CapabilityResponse>(
        `/capabilities/${capabilityId}`
      );
      this.logger.info('Successfully retrieved capability', {
        capabilityId,
        name: response.data.name,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get capability', { capabilityId, error });
      throw error;
    }
  }

  /**
   * Enable capability
   * POST /rest/api/1.0/capabilities/{capabilityId}/enable
   */
  async enableCapability(capabilityId: string): Promise<CapabilityResponse> {
    this.logger.info('Enabling capability', { capabilityId });

    try {
      const response = await this.apiClient.post<CapabilityResponse>(
        `/capabilities/${capabilityId}/enable`
      );
      this.logger.info('Successfully enabled capability', { capabilityId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to enable capability', { capabilityId, error });
      throw error;
    }
  }

  /**
   * Disable capability
   * POST /rest/api/1.0/capabilities/{capabilityId}/disable
   */
  async disableCapability(capabilityId: string): Promise<CapabilityResponse> {
    this.logger.info('Disabling capability', { capabilityId });

    try {
      const response = await this.apiClient.post<CapabilityResponse>(
        `/capabilities/${capabilityId}/disable`
      );
      this.logger.info('Successfully disabled capability', { capabilityId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to disable capability', { capabilityId, error });
      throw error;
    }
  }

  /**
   * Get capability configuration
   * GET /rest/api/1.0/capabilities/{capabilityId}/configuration
   */
  async getCapabilityConfiguration(capabilityId: string): Promise<CapabilityConfigurationResponse> {
    this.logger.info('Getting capability configuration', { capabilityId });

    try {
      const response = await this.apiClient.get<CapabilityConfigurationResponse>(
        `/capabilities/${capabilityId}/configuration`
      );
      this.logger.info('Successfully retrieved capability configuration', { capabilityId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get capability configuration', { capabilityId, error });
      throw error;
    }
  }

  /**
   * Update capability configuration
   * PUT /rest/api/1.0/capabilities/{capabilityId}/configuration
   */
  async updateCapabilityConfiguration(
    capabilityId: string,
    request: CapabilityConfigurationRequest
  ): Promise<CapabilityConfigurationResponse> {
    this.logger.info('Updating capability configuration', { capabilityId, request });

    try {
      const response = await this.apiClient.put<CapabilityConfigurationResponse>(
        `/capabilities/${capabilityId}/configuration`,
        request
      );
      this.logger.info('Successfully updated capability configuration', { capabilityId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update capability configuration', {
        capabilityId,
        request,
        error,
      });
      throw error;
    }
  }

  /**
   * Get capability status
   * GET /rest/api/1.0/capabilities/{capabilityId}/status
   */
  async getCapabilityStatus(capabilityId: string): Promise<CapabilityStatusResponse> {
    this.logger.info('Getting capability status', { capabilityId });

    try {
      const response = await this.apiClient.get<CapabilityStatusResponse>(
        `/capabilities/${capabilityId}/status`
      );
      this.logger.info('Successfully retrieved capability status', {
        capabilityId,
        status: response.data.status,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get capability status', { capabilityId, error });
      throw error;
    }
  }

  /**
   * List capability statuses
   * GET /rest/api/1.0/capabilities/status
   */
  async listCapabilityStatuses(): Promise<CapabilityStatusListResponse> {
    this.logger.info('Listing capability statuses');

    try {
      const response =
        await this.apiClient.get<CapabilityStatusListResponse>('/capabilities/status');
      this.logger.info('Successfully listed capability statuses', {
        count: response.data.statuses.length,
        total: response.data.total,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list capability statuses', { error });
      throw error;
    }
  }

  /**
   * Get capability metrics
   * GET /rest/api/1.0/capabilities/{capabilityId}/metrics
   */
  async getCapabilityMetrics(capabilityId: string): Promise<CapabilityMetricsResponse> {
    this.logger.info('Getting capability metrics', { capabilityId });

    try {
      const response = await this.apiClient.get<CapabilityMetricsResponse>(
        `/capabilities/${capabilityId}/metrics`
      );
      this.logger.info('Successfully retrieved capability metrics', {
        capabilityId,
        metricsCount: response.data.metrics.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get capability metrics', { capabilityId, error });
      throw error;
    }
  }

  /**
   * List capability metrics
   * GET /rest/api/1.0/capabilities/metrics
   */
  async listCapabilityMetrics(): Promise<CapabilityMetricsListResponse> {
    this.logger.info('Listing capability metrics');

    try {
      const response =
        await this.apiClient.get<CapabilityMetricsListResponse>('/capabilities/metrics');
      this.logger.info('Successfully listed capability metrics', {
        count: response.data.metrics.length,
        total: response.data.total,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list capability metrics', { error });
      throw error;
    }
  }

  /**
   * Get capability events
   * GET /rest/api/1.0/capabilities/{capabilityId}/events
   */
  async getCapabilityEvents(
    capabilityId: string,
    params?: CapabilityEventQueryParams
  ): Promise<CapabilityEventListResponse> {
    this.logger.info('Getting capability events', { capabilityId, params });

    try {
      const response = await this.apiClient.get<CapabilityEventListResponse>(
        `/capabilities/${capabilityId}/events`,
        { params }
      );
      this.logger.info('Successfully retrieved capability events', {
        capabilityId,
        count: response.data.events.length,
        total: response.data.total,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get capability events', { capabilityId, params, error });
      throw error;
    }
  }

  /**
   * List all capability events
   * GET /rest/api/1.0/capabilities/events
   */
  async listCapabilityEvents(
    params?: CapabilityEventQueryParams
  ): Promise<CapabilityEventListResponse> {
    this.logger.info('Listing capability events', { params });

    try {
      const response = await this.apiClient.get<CapabilityEventListResponse>(
        '/capabilities/events',
        { params }
      );
      this.logger.info('Successfully listed capability events', {
        count: response.data.events.length,
        total: response.data.total,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list capability events', { params, error });
      throw error;
    }
  }

  // Plugin Capabilities
  /**
   * List plugin capabilities
   * GET /rest/api/1.0/capabilities/plugins
   */
  async listPluginCapabilities(): Promise<PluginCapabilityListResponse> {
    this.logger.info('Listing plugin capabilities');

    try {
      const response =
        await this.apiClient.get<PluginCapabilityListResponse>('/capabilities/plugins');
      this.logger.info('Successfully listed plugin capabilities', {
        count: response.data.plugins.length,
        total: response.data.total,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list plugin capabilities', { error });
      throw error;
    }
  }

  /**
   * Get plugin capability
   * GET /rest/api/1.0/capabilities/plugins/{pluginKey}
   */
  async getPluginCapability(pluginKey: string): Promise<PluginCapabilityResponse> {
    this.logger.info('Getting plugin capability', { pluginKey });

    try {
      const response = await this.apiClient.get<PluginCapabilityResponse>(
        `/capabilities/plugins/${pluginKey}`
      );
      this.logger.info('Successfully retrieved plugin capability', {
        pluginKey,
        name: response.data.pluginName,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get plugin capability', { pluginKey, error });
      throw error;
    }
  }

  /**
   * Enable plugin capability
   * POST /rest/api/1.0/capabilities/plugins/{pluginKey}/enable
   */
  async enablePluginCapability(pluginKey: string): Promise<PluginCapabilityResponse> {
    this.logger.info('Enabling plugin capability', { pluginKey });

    try {
      const response = await this.apiClient.post<PluginCapabilityResponse>(
        `/capabilities/plugins/${pluginKey}/enable`
      );
      this.logger.info('Successfully enabled plugin capability', { pluginKey });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to enable plugin capability', { pluginKey, error });
      throw error;
    }
  }

  /**
   * Disable plugin capability
   * POST /rest/api/1.0/capabilities/plugins/{pluginKey}/disable
   */
  async disablePluginCapability(pluginKey: string): Promise<PluginCapabilityResponse> {
    this.logger.info('Disabling plugin capability', { pluginKey });

    try {
      const response = await this.apiClient.post<PluginCapabilityResponse>(
        `/capabilities/plugins/${pluginKey}/disable`
      );
      this.logger.info('Successfully disabled plugin capability', { pluginKey });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to disable plugin capability', { pluginKey, error });
      throw error;
    }
  }

  // Feature Capabilities
  /**
   * List feature capabilities
   * GET /rest/api/1.0/capabilities/features
   */
  async listFeatureCapabilities(): Promise<FeatureCapabilityListResponse> {
    this.logger.info('Listing feature capabilities');

    try {
      const response =
        await this.apiClient.get<FeatureCapabilityListResponse>('/capabilities/features');
      this.logger.info('Successfully listed feature capabilities', {
        count: response.data.features.length,
        total: response.data.total,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list feature capabilities', { error });
      throw error;
    }
  }

  /**
   * Get feature capability
   * GET /rest/api/1.0/capabilities/features/{featureKey}
   */
  async getFeatureCapability(featureKey: string): Promise<FeatureCapabilityResponse> {
    this.logger.info('Getting feature capability', { featureKey });

    try {
      const response = await this.apiClient.get<FeatureCapabilityResponse>(
        `/capabilities/features/${featureKey}`
      );
      this.logger.info('Successfully retrieved feature capability', {
        featureKey,
        name: response.data.featureName,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get feature capability', { featureKey, error });
      throw error;
    }
  }

  /**
   * Enable feature capability
   * POST /rest/api/1.0/capabilities/features/{featureKey}/enable
   */
  async enableFeatureCapability(featureKey: string): Promise<FeatureCapabilityResponse> {
    this.logger.info('Enabling feature capability', { featureKey });

    try {
      const response = await this.apiClient.post<FeatureCapabilityResponse>(
        `/capabilities/features/${featureKey}/enable`
      );
      this.logger.info('Successfully enabled feature capability', { featureKey });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to enable feature capability', { featureKey, error });
      throw error;
    }
  }

  /**
   * Disable feature capability
   * POST /rest/api/1.0/capabilities/features/{featureKey}/disable
   */
  async disableFeatureCapability(featureKey: string): Promise<FeatureCapabilityResponse> {
    this.logger.info('Disabling feature capability', { featureKey });

    try {
      const response = await this.apiClient.post<FeatureCapabilityResponse>(
        `/capabilities/features/${featureKey}/disable`
      );
      this.logger.info('Successfully disabled feature capability', { featureKey });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to disable feature capability', { featureKey, error });
      throw error;
    }
  }

  // Integration Capabilities
  /**
   * List integration capabilities
   * GET /rest/api/1.0/capabilities/integrations
   */
  async listIntegrationCapabilities(): Promise<IntegrationCapabilityListResponse> {
    this.logger.info('Listing integration capabilities');

    try {
      const response = await this.apiClient.get<IntegrationCapabilityListResponse>(
        '/capabilities/integrations'
      );
      this.logger.info('Successfully listed integration capabilities', {
        count: response.data.integrations.length,
        total: response.data.total,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list integration capabilities', { error });
      throw error;
    }
  }

  /**
   * Get integration capability
   * GET /rest/api/1.0/capabilities/integrations/{integrationKey}
   */
  async getIntegrationCapability(integrationKey: string): Promise<IntegrationCapabilityResponse> {
    this.logger.info('Getting integration capability', { integrationKey });

    try {
      const response = await this.apiClient.get<IntegrationCapabilityResponse>(
        `/capabilities/integrations/${integrationKey}`
      );
      this.logger.info('Successfully retrieved integration capability', {
        integrationKey,
        name: response.data.integrationName,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get integration capability', { integrationKey, error });
      throw error;
    }
  }

  /**
   * Enable integration capability
   * POST /rest/api/1.0/capabilities/integrations/{integrationKey}/enable
   */
  async enableIntegrationCapability(
    integrationKey: string
  ): Promise<IntegrationCapabilityResponse> {
    this.logger.info('Enabling integration capability', { integrationKey });

    try {
      const response = await this.apiClient.post<IntegrationCapabilityResponse>(
        `/capabilities/integrations/${integrationKey}/enable`
      );
      this.logger.info('Successfully enabled integration capability', { integrationKey });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to enable integration capability', { integrationKey, error });
      throw error;
    }
  }

  /**
   * Disable integration capability
   * POST /rest/api/1.0/capabilities/integrations/{integrationKey}/disable
   */
  async disableIntegrationCapability(
    integrationKey: string
  ): Promise<IntegrationCapabilityResponse> {
    this.logger.info('Disabling integration capability', { integrationKey });

    try {
      const response = await this.apiClient.post<IntegrationCapabilityResponse>(
        `/capabilities/integrations/${integrationKey}/disable`
      );
      this.logger.info('Successfully disabled integration capability', { integrationKey });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to disable integration capability', { integrationKey, error });
      throw error;
    }
  }
}
