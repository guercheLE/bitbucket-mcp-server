import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPool, Pool } from 'generic-pool';
import { Logger } from '../../utils/logger.util.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { CapabilitiesService } from '../../services/datacenter/capabilities.service.js';
import { createMcpResponse, createErrorResponse } from '../../services/types/base.types.js';
import { z } from 'zod';

// Zod schemas for parameter validation
const GetSystemCapabilitiesSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetFeatureCapabilitiesSchema = z.object({
  feature: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetIntegrationCapabilitiesSchema = z.object({
  integration: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetPluginCapabilitiesSchema = z.object({
  plugin: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetSecurityCapabilitiesSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetPerformanceCapabilitiesSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetScalabilityCapabilitiesSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetMonitoringCapabilitiesSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetBackupCapabilitiesSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetRestoreCapabilitiesSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetMigrationCapabilitiesSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetUpgradeCapabilitiesSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetCustomizationCapabilitiesSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetApiCapabilitiesSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetWebhookCapabilitiesSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetNotificationCapabilitiesSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetAuthenticationCapabilitiesSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetAuthorizationCapabilitiesSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetAuditCapabilitiesSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetComplianceCapabilitiesSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetReportingCapabilitiesSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetAnalyticsCapabilitiesSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetWorkflowCapabilitiesSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetAutomationCapabilitiesSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetSystemStatusSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetSystemConfigurationSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetSystemMetricsSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetSystemEventsSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListCapabilitiesSchema = z.object({
  params: z.any().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetCapabilitySchema = z.object({
  capabilityId: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const EnableCapabilitySchema = z.object({
  capabilityId: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DisableCapabilitySchema = z.object({
  capabilityId: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetCapabilityConfigurationSchema = z.object({
  capabilityId: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateCapabilityConfigurationSchema = z.object({
  capabilityId: z.string(),
  configuration: z.any(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetCapabilityStatusSchema = z.object({
  capabilityId: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListCapabilityStatusesSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetCapabilityMetricsSchema = z.object({
  capabilityId: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListCapabilityMetricsSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetCapabilityEventsSchema = z.object({
  capabilityId: z.string(),
  params: z.any().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListCapabilityEventsSchema = z.object({
  params: z.any().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListPluginCapabilitiesSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetPluginCapabilitySchema = z.object({
  pluginKey: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const EnablePluginCapabilitySchema = z.object({
  pluginKey: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DisablePluginCapabilitySchema = z.object({
  pluginKey: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

/**
 * Capabilities Tools for Bitbucket Data Center
 *
 * Comprehensive capabilities management including:
 * - System capabilities
 * - Feature capabilities
 * - Integration capabilities
 * - Plugin capabilities
 */
export class DataCenterCapabilitiesTools {
  private static logger = Logger.forContext('DataCenterCapabilitiesTools');
  private static capabilitiesServicePool: Pool<CapabilitiesService>;

  static initialize(): void {
    const capabilitiesServiceFactory = {
      create: async () =>
        new CapabilitiesService(new ApiClient(), Logger.forContext('CapabilitiesService')),
      destroy: async () => {},
    };

    this.capabilitiesServicePool = createPool(capabilitiesServiceFactory, {
      min: 2,
      max: 10,
    });
    this.logger.info('Data Center Capabilities tools initialized');
  }

  /**
   * Get system capabilities
   */
  static async getSystemCapabilities(output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getSystemCapabilities');
    let capabilitiesService = null;

    try {
      methodLogger.debug('Getting system capabilities');
      capabilitiesService = await this.capabilitiesServicePool.acquire();

      const result = await capabilitiesService.getSystemCapabilities();

      methodLogger.debug('Successfully retrieved system capabilities');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get system capabilities:', error);
      if (capabilitiesService) {
        this.capabilitiesServicePool.destroy(capabilitiesService);
        capabilitiesService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (capabilitiesService) {
        this.capabilitiesServicePool.release(capabilitiesService);
      }
    }
  }

  /**
   * Get feature capabilities
   */
  static async getFeatureCapabilities(feature: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getFeatureCapabilities');
    let capabilitiesService = null;

    try {
      methodLogger.debug('Getting feature capabilities:', { feature });
      capabilitiesService = await this.capabilitiesServicePool.acquire();

      const result = await capabilitiesService.getFeatureCapability(feature);

      methodLogger.debug('Successfully retrieved feature capabilities');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get feature capabilities:', error);
      if (capabilitiesService) {
        this.capabilitiesServicePool.destroy(capabilitiesService);
        capabilitiesService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (capabilitiesService) {
        this.capabilitiesServicePool.release(capabilitiesService);
      }
    }
  }

  /**
   * Get integration capabilities
   */
  static async getIntegrationCapabilities(
    integration: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getIntegrationCapabilities');
    let capabilitiesService = null;

    try {
      methodLogger.debug('Getting integration capabilities:', { integration });
      capabilitiesService = await this.capabilitiesServicePool.acquire();

      const result = await capabilitiesService.getIntegrationCapability(integration);

      methodLogger.debug('Successfully retrieved integration capabilities');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get integration capabilities:', error);
      if (capabilitiesService) {
        this.capabilitiesServicePool.destroy(capabilitiesService);
        capabilitiesService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (capabilitiesService) {
        this.capabilitiesServicePool.release(capabilitiesService);
      }
    }
  }

  /**
   * Get plugin capabilities
   */
  static async getPluginCapabilities(plugin: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getPluginCapabilities');
    let capabilitiesService = null;

    try {
      methodLogger.debug('Getting plugin capabilities:', { plugin });
      capabilitiesService = await this.capabilitiesServicePool.acquire();

      const result = await capabilitiesService.getPluginCapability(plugin);

      methodLogger.debug('Successfully retrieved plugin capabilities');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get plugin capabilities:', error);
      if (capabilitiesService) {
        this.capabilitiesServicePool.destroy(capabilitiesService);
        capabilitiesService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (capabilitiesService) {
        this.capabilitiesServicePool.release(capabilitiesService);
      }
    }
  }

  /**
   * Get system status
   */
  static async getSystemStatus(output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getSystemStatus');
    let capabilitiesService = null;

    try {
      methodLogger.debug('Getting system status');
      capabilitiesService = await this.capabilitiesServicePool.acquire();

      const result = await capabilitiesService.getSystemCapabilities();

      methodLogger.debug('Successfully retrieved system status');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get system status:', error);
      if (capabilitiesService) {
        this.capabilitiesServicePool.destroy(capabilitiesService);
        capabilitiesService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (capabilitiesService) {
        this.capabilitiesServicePool.release(capabilitiesService);
      }
    }
  }

  /**
   * Get system configuration
   */
  static async getSystemConfiguration(output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getSystemConfiguration');
    let capabilitiesService = null;

    try {
      methodLogger.debug('Getting system configuration');
      capabilitiesService = await this.capabilitiesServicePool.acquire();

      const result = await capabilitiesService.getSystemCapabilities();

      methodLogger.debug('Successfully retrieved system configuration');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get system configuration:', error);
      if (capabilitiesService) {
        this.capabilitiesServicePool.destroy(capabilitiesService);
        capabilitiesService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (capabilitiesService) {
        this.capabilitiesServicePool.release(capabilitiesService);
      }
    }
  }

  /**
   * Get system metrics
   */
  static async getSystemMetrics(output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getSystemMetrics');
    let capabilitiesService = null;

    try {
      methodLogger.debug('Getting system metrics');
      capabilitiesService = await this.capabilitiesServicePool.acquire();

      const result = await capabilitiesService.getSystemCapabilities();

      methodLogger.debug('Successfully retrieved system metrics');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get system metrics:', error);
      if (capabilitiesService) {
        this.capabilitiesServicePool.destroy(capabilitiesService);
        capabilitiesService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (capabilitiesService) {
        this.capabilitiesServicePool.release(capabilitiesService);
      }
    }
  }

  /**
   * Get system events
   */
  static async getSystemEvents(
    page?: number,
    limit?: number,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getSystemEvents');
    let capabilitiesService = null;

    try {
      methodLogger.debug('Getting system events:', { page, limit });
      capabilitiesService = await this.capabilitiesServicePool.acquire();

      const result = await capabilitiesService.listCapabilityEvents({ start: page, limit });

      methodLogger.debug('Successfully retrieved system events');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get system events:', error);
      if (capabilitiesService) {
        this.capabilitiesServicePool.destroy(capabilitiesService);
        capabilitiesService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (capabilitiesService) {
        this.capabilitiesServicePool.release(capabilitiesService);
      }
    }
  }

  /**
   * List capabilities
   */
  static async listCapabilities(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('listCapabilities');
    let capabilitiesService = null;

    try {
      methodLogger.debug('Listing capabilities:', params);
      capabilitiesService = await this.capabilitiesServicePool.acquire();

      const result = await capabilitiesService.listCapabilities(params);

      methodLogger.debug('Successfully listed capabilities');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list capabilities:', error);
      if (capabilitiesService) {
        this.capabilitiesServicePool.destroy(capabilitiesService);
        capabilitiesService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (capabilitiesService) {
        this.capabilitiesServicePool.release(capabilitiesService);
      }
    }
  }

  /**
   * Get capability
   */
  static async getCapability(capabilityId: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getCapability');
    let capabilitiesService = null;

    try {
      methodLogger.debug('Getting capability:', { capabilityId });
      capabilitiesService = await this.capabilitiesServicePool.acquire();

      const result = await capabilitiesService.getCapability(capabilityId);

      methodLogger.debug('Successfully retrieved capability');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get capability:', error);
      if (capabilitiesService) {
        this.capabilitiesServicePool.destroy(capabilitiesService);
        capabilitiesService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (capabilitiesService) {
        this.capabilitiesServicePool.release(capabilitiesService);
      }
    }
  }

  /**
   * Enable capability
   */
  static async enableCapability(capabilityId: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('enableCapability');
    let capabilitiesService = null;

    try {
      methodLogger.debug('Enabling capability:', { capabilityId });
      capabilitiesService = await this.capabilitiesServicePool.acquire();

      const result = await capabilitiesService.enableCapability(capabilityId);

      methodLogger.debug('Successfully enabled capability');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to enable capability:', error);
      if (capabilitiesService) {
        this.capabilitiesServicePool.destroy(capabilitiesService);
        capabilitiesService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (capabilitiesService) {
        this.capabilitiesServicePool.release(capabilitiesService);
      }
    }
  }

  /**
   * Disable capability
   */
  static async disableCapability(capabilityId: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('disableCapability');
    let capabilitiesService = null;

    try {
      methodLogger.debug('Disabling capability:', { capabilityId });
      capabilitiesService = await this.capabilitiesServicePool.acquire();

      const result = await capabilitiesService.disableCapability(capabilityId);

      methodLogger.debug('Successfully disabled capability');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to disable capability:', error);
      if (capabilitiesService) {
        this.capabilitiesServicePool.destroy(capabilitiesService);
        capabilitiesService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (capabilitiesService) {
        this.capabilitiesServicePool.release(capabilitiesService);
      }
    }
  }

  static async getCapabilityConfiguration(
    capabilityId: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getCapabilityConfiguration');
    let capabilitiesService = null;

    try {
      methodLogger.debug('Getting capability configuration:', { capabilityId });
      capabilitiesService = await this.capabilitiesServicePool.acquire();

      const result = await capabilitiesService.getCapabilityConfiguration(capabilityId);

      methodLogger.debug('Successfully retrieved capability configuration');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get capability configuration:', error);
      if (capabilitiesService) {
        this.capabilitiesServicePool.destroy(capabilitiesService);
        capabilitiesService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (capabilitiesService) {
        this.capabilitiesServicePool.release(capabilitiesService);
      }
    }
  }

  static async updateCapabilityConfiguration(
    capabilityId: string,
    configuration: any,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('updateCapabilityConfiguration');
    let capabilitiesService = null;

    try {
      methodLogger.debug('Updating capability configuration:', { capabilityId });
      capabilitiesService = await this.capabilitiesServicePool.acquire();

      const result = await capabilitiesService.updateCapabilityConfiguration(
        capabilityId,
        configuration
      );

      methodLogger.debug('Successfully updated capability configuration');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update capability configuration:', error);
      if (capabilitiesService) {
        this.capabilitiesServicePool.destroy(capabilitiesService);
        capabilitiesService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (capabilitiesService) {
        this.capabilitiesServicePool.release(capabilitiesService);
      }
    }
  }

  static async getCapabilityStatus(capabilityId: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getCapabilityStatus');
    let capabilitiesService = null;

    try {
      methodLogger.debug('Getting capability status:', { capabilityId });
      capabilitiesService = await this.capabilitiesServicePool.acquire();

      const result = await capabilitiesService.getCapabilityStatus(capabilityId);

      methodLogger.debug('Successfully retrieved capability status');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get capability status:', error);
      if (capabilitiesService) {
        this.capabilitiesServicePool.destroy(capabilitiesService);
        capabilitiesService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (capabilitiesService) {
        this.capabilitiesServicePool.release(capabilitiesService);
      }
    }
  }

  static async listCapabilityStatuses(output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('listCapabilityStatuses');
    let capabilitiesService = null;

    try {
      methodLogger.debug('Listing capability statuses');
      capabilitiesService = await this.capabilitiesServicePool.acquire();

      const result = await capabilitiesService.listCapabilityStatuses();

      methodLogger.debug('Successfully listed capability statuses');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list capability statuses:', error);
      if (capabilitiesService) {
        this.capabilitiesServicePool.destroy(capabilitiesService);
        capabilitiesService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (capabilitiesService) {
        this.capabilitiesServicePool.release(capabilitiesService);
      }
    }
  }

  static async getCapabilityMetrics(
    capabilityId: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getCapabilityMetrics');
    let capabilitiesService = null;

    try {
      methodLogger.debug('Getting capability metrics:', { capabilityId });
      capabilitiesService = await this.capabilitiesServicePool.acquire();

      const result = await capabilitiesService.getCapabilityMetrics(capabilityId);

      methodLogger.debug('Successfully retrieved capability metrics');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get capability metrics:', error);
      if (capabilitiesService) {
        this.capabilitiesServicePool.destroy(capabilitiesService);
        capabilitiesService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (capabilitiesService) {
        this.capabilitiesServicePool.release(capabilitiesService);
      }
    }
  }

  static async listCapabilityMetrics(output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('listCapabilityMetrics');
    let capabilitiesService = null;

    try {
      methodLogger.debug('Listing capability metrics');
      capabilitiesService = await this.capabilitiesServicePool.acquire();

      const result = await capabilitiesService.listCapabilityMetrics();

      methodLogger.debug('Successfully listed capability metrics');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list capability metrics:', error);
      if (capabilitiesService) {
        this.capabilitiesServicePool.destroy(capabilitiesService);
        capabilitiesService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (capabilitiesService) {
        this.capabilitiesServicePool.release(capabilitiesService);
      }
    }
  }

  static async getCapabilityEvents(
    capabilityId: string,
    params: any,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getCapabilityEvents');
    let capabilitiesService = null;

    try {
      methodLogger.debug('Getting capability events:', { capabilityId });
      capabilitiesService = await this.capabilitiesServicePool.acquire();

      const result = await capabilitiesService.getCapabilityEvents(capabilityId, params);

      methodLogger.debug('Successfully retrieved capability events');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get capability events:', error);
      if (capabilitiesService) {
        this.capabilitiesServicePool.destroy(capabilitiesService);
        capabilitiesService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (capabilitiesService) {
        this.capabilitiesServicePool.release(capabilitiesService);
      }
    }
  }

  static async listCapabilityEvents(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('listCapabilityEvents');
    let capabilitiesService = null;

    try {
      methodLogger.debug('Listing capability events');
      capabilitiesService = await this.capabilitiesServicePool.acquire();

      const result = await capabilitiesService.listCapabilityEvents(params);

      methodLogger.debug('Successfully listed capability events');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list capability events:', error);
      if (capabilitiesService) {
        this.capabilitiesServicePool.destroy(capabilitiesService);
        capabilitiesService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (capabilitiesService) {
        this.capabilitiesServicePool.release(capabilitiesService);
      }
    }
  }

  static async listPluginCapabilities(output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('listPluginCapabilities');
    let capabilitiesService = null;

    try {
      methodLogger.debug('Listing plugin capabilities');
      capabilitiesService = await this.capabilitiesServicePool.acquire();

      const result = await capabilitiesService.listPluginCapabilities();

      methodLogger.debug('Successfully listed plugin capabilities');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list plugin capabilities:', error);
      if (capabilitiesService) {
        this.capabilitiesServicePool.destroy(capabilitiesService);
        capabilitiesService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (capabilitiesService) {
        this.capabilitiesServicePool.release(capabilitiesService);
      }
    }
  }

  static async getPluginCapability(pluginKey: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getPluginCapability');
    let capabilitiesService = null;

    try {
      methodLogger.debug('Getting plugin capability:', { pluginKey });
      capabilitiesService = await this.capabilitiesServicePool.acquire();

      const result = await capabilitiesService.getPluginCapability(pluginKey);

      methodLogger.debug('Successfully retrieved plugin capability');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get plugin capability:', error);
      if (capabilitiesService) {
        this.capabilitiesServicePool.destroy(capabilitiesService);
        capabilitiesService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (capabilitiesService) {
        this.capabilitiesServicePool.release(capabilitiesService);
      }
    }
  }

  static async enablePluginCapability(pluginKey: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('enablePluginCapability');
    let capabilitiesService = null;

    try {
      methodLogger.debug('Enabling plugin capability:', { pluginKey });
      capabilitiesService = await this.capabilitiesServicePool.acquire();

      const result = await capabilitiesService.enablePluginCapability(pluginKey);

      methodLogger.debug('Successfully enabled plugin capability');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to enable plugin capability:', error);
      if (capabilitiesService) {
        this.capabilitiesServicePool.destroy(capabilitiesService);
        capabilitiesService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (capabilitiesService) {
        this.capabilitiesServicePool.release(capabilitiesService);
      }
    }
  }

  static async disablePluginCapability(
    pluginKey: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('disablePluginCapability');
    let capabilitiesService = null;

    try {
      methodLogger.debug('Disabling plugin capability:', { pluginKey });
      capabilitiesService = await this.capabilitiesServicePool.acquire();

      const result = await capabilitiesService.disablePluginCapability(pluginKey);

      methodLogger.debug('Successfully disabled plugin capability');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to disable plugin capability:', error);
      if (capabilitiesService) {
        this.capabilitiesServicePool.destroy(capabilitiesService);
        capabilitiesService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (capabilitiesService) {
        this.capabilitiesServicePool.release(capabilitiesService);
      }
    }
  }

  /**
   * Register all capabilities tools with the MCP server
   */
  static register(server: McpServer): void {
    const registerLogger = this.logger.forMethod('register');

    // Initialize the service
    this.initialize();

    // Register get system capabilities tool
    server.registerTool(
      'capabilities_get_system_capabilities',
      {
        description: `Obtém capacidades do sistema.

**Funcionalidades:**
- Informações sobre capacidades do sistema
- Recursos disponíveis
- Limitações e configurações

**Parâmetros:**
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com as capacidades do sistema.`,
        inputSchema: GetSystemCapabilitiesSchema.shape,
      },
      async (params: z.infer<typeof GetSystemCapabilitiesSchema>) => {
        const validatedParams = GetSystemCapabilitiesSchema.parse(params);
        return await this.getSystemCapabilities(validatedParams.output);
      }
    );

    // Register get feature capabilities tool
    server.registerTool(
      'capabilities_get_feature_capabilities',
      {
        description: `Obtém capacidades de uma funcionalidade específica.

**Funcionalidades:**
- Informações sobre capacidades de funcionalidades
- Recursos disponíveis por funcionalidade
- Limitações e configurações

**Parâmetros:**
- \`feature\`: Nome da funcionalidade
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com as capacidades da funcionalidade.`,
        inputSchema: GetFeatureCapabilitiesSchema.shape,
      },
      async (params: z.infer<typeof GetFeatureCapabilitiesSchema>) => {
        const validatedParams = GetFeatureCapabilitiesSchema.parse(params);
        return await this.getFeatureCapabilities(validatedParams.feature, validatedParams.output);
      }
    );

    // Register get integration capabilities tool
    server.registerTool(
      'capabilities_get_integration_capabilities',
      {
        description: `Obtém capacidades de uma integração específica.

**Funcionalidades:**
- Informações sobre capacidades de integrações
- Recursos disponíveis por integração
- Limitações e configurações

**Parâmetros:**
- \`integration\`: Nome da integração
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com as capacidades da integração.`,
        inputSchema: GetIntegrationCapabilitiesSchema.shape,
      },
      async (params: z.infer<typeof GetIntegrationCapabilitiesSchema>) => {
        const validatedParams = GetIntegrationCapabilitiesSchema.parse(params);
        return await this.getIntegrationCapabilities(
          validatedParams.integration,
          validatedParams.output
        );
      }
    );

    // Register get plugin capabilities tool
    server.registerTool(
      'capabilities_get_plugin_capabilities',
      {
        description: `Obtém capacidades de um plugin específico.

**Funcionalidades:**
- Informações sobre capacidades de plugins
- Recursos disponíveis por plugin
- Limitações e configurações

**Parâmetros:**
- \`plugin\`: Nome do plugin
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com as capacidades do plugin.`,
        inputSchema: GetPluginCapabilitiesSchema.shape,
      },
      async (params: z.infer<typeof GetPluginCapabilitiesSchema>) => {
        const validatedParams = GetPluginCapabilitiesSchema.parse(params);
        return await this.getPluginCapabilities(validatedParams.plugin, validatedParams.output);
      }
    );

    // Register get system status tool
    server.registerTool(
      'capabilities_get_system_status',
      {
        description: `Obtém status do sistema.

**Funcionalidades:**
- Status geral do sistema
- Informações de saúde
- Estado dos serviços

**Parâmetros:**
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com o status do sistema.`,
        inputSchema: GetSystemStatusSchema.shape,
      },
      async (params: z.infer<typeof GetSystemStatusSchema>) => {
        const validatedParams = GetSystemStatusSchema.parse(params);
        return await this.getSystemStatus(validatedParams.output);
      }
    );

    // Register get system configuration tool
    server.registerTool(
      'capabilities_get_system_configuration',
      {
        description: `Obtém configuração do sistema.

**Funcionalidades:**
- Configurações do sistema
- Parâmetros e ajustes
- Informações de setup

**Parâmetros:**
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com a configuração do sistema.`,
        inputSchema: GetSystemConfigurationSchema.shape,
      },
      async (params: z.infer<typeof GetSystemConfigurationSchema>) => {
        const validatedParams = GetSystemConfigurationSchema.parse(params);
        return await this.getSystemConfiguration(validatedParams.output);
      }
    );

    // Register get system metrics tool
    server.registerTool(
      'capabilities_get_system_metrics',
      {
        description: `Obtém métricas do sistema.

**Funcionalidades:**
- Métricas de performance
- Estatísticas de uso
- Dados de monitoramento

**Parâmetros:**
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com as métricas do sistema.`,
        inputSchema: GetSystemMetricsSchema.shape,
      },
      async (params: z.infer<typeof GetSystemMetricsSchema>) => {
        const validatedParams = GetSystemMetricsSchema.parse(params);
        return await this.getSystemMetrics(validatedParams.output);
      }
    );

    // Register get system events tool
    server.registerTool(
      'capabilities_get_system_events',
      {
        description: `Obtém eventos do sistema.

**Funcionalidades:**
- Log de eventos do sistema
- Histórico de atividades
- Informações de auditoria

**Parâmetros:**
- \`page\`: Número da página (opcional)
- \`limit\`: Limite de resultados (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com os eventos do sistema.`,
        inputSchema: GetSystemEventsSchema.shape,
      },
      async (params: z.infer<typeof GetSystemEventsSchema>) => {
        const validatedParams = GetSystemEventsSchema.parse(params);
        return await this.getSystemEvents(
          validatedParams.page,
          validatedParams.limit,
          validatedParams.output
        );
      }
    );

    // Register list capabilities tool
    server.registerTool(
      'capabilities_list',
      {
        description: `Lista todas as capabilities disponíveis.

**Funcionalidades:**
- Listagem completa de capabilities
- Filtros e paginação
- Informações resumidas

**Parâmetros:**
- \`name\`: Filtro por nome (opcional)
- \`type\`: Filtro por tipo (opcional)
- \`status\`: Filtro por status (opcional)
- \`start\`: Índice de início (opcional)
- \`limit\`: Limite de resultados (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com a lista de capabilities.`,
        inputSchema: ListCapabilitiesSchema.shape,
      },
      async (params: z.infer<typeof ListCapabilitiesSchema>) => {
        const validatedParams = ListCapabilitiesSchema.parse(params);
        return await this.listCapabilities(validatedParams, validatedParams.output);
      }
    );

    // Register get capability tool
    server.registerTool(
      'capabilities_get',
      {
        description: `Obtém uma capability específica.

**Funcionalidades:**
- Detalhes da capability
- Configurações específicas
- Status atual

**Parâmetros:**
- \`capability_id\`: ID da capability
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com os detalhes da capability.`,
        inputSchema: GetCapabilitySchema.shape,
      },
      async (params: z.infer<typeof GetCapabilitySchema>) => {
        const validatedParams = GetCapabilitySchema.parse(params);
        return await this.getCapability(validatedParams.capabilityId, validatedParams.output);
      }
    );

    // Register enable capability tool
    server.registerTool(
      'capabilities_enable',
      {
        description: `Habilita uma capability.

**Funcionalidades:**
- Ativação de capabilities
- Configuração de recursos
- Verificação de dependências

**Parâmetros:**
- \`capability_id\`: ID da capability
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com a capability habilitada.`,
        inputSchema: EnableCapabilitySchema.shape,
      },
      async (params: z.infer<typeof EnableCapabilitySchema>) => {
        const validatedParams = EnableCapabilitySchema.parse(params);
        return await this.enableCapability(validatedParams.capabilityId, validatedParams.output);
      }
    );

    // Register disable capability tool
    server.registerTool(
      'capabilities_disable',
      {
        description: `Desabilita uma capability.

**Funcionalidades:**
- Desativação de capabilities
- Limpeza de recursos
- Verificação de dependências

**Parâmetros:**
- \`capability_id\`: ID da capability
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com a capability desabilitada.`,
        inputSchema: DisableCapabilitySchema.shape,
      },
      async (params: z.infer<typeof DisableCapabilitySchema>) => {
        const validatedParams = DisableCapabilitySchema.parse(params);
        return await this.disableCapability(validatedParams.capabilityId, validatedParams.output);
      }
    );

    // Register get capability configuration tool
    server.registerTool(
      'capabilities_get_configuration',
      {
        description: `Obtém configuração de uma capability específica.

**Funcionalidades:**
- Configurações da capability
- Parâmetros específicos
- Valores atuais

**Parâmetros:**
- \`capability_id\`: ID da capability
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com a configuração da capability.`,
        inputSchema: GetCapabilityConfigurationSchema.shape,
      },
      async (params: z.infer<typeof GetCapabilityConfigurationSchema>) => {
        const validatedParams = GetCapabilityConfigurationSchema.parse(params);
        return await this.getCapabilityConfiguration(
          validatedParams.capabilityId,
          validatedParams.output
        );
      }
    );

    // Register update capability configuration tool
    server.registerTool(
      'capabilities_update_configuration',
      {
        description: `Atualiza configuração de uma capability específica.

**Funcionalidades:**
- Modificação de configurações
- Aplicação de mudanças
- Validação de parâmetros

**Parâmetros:**
- \`capability_id\`: ID da capability
- \`configuration\`: Objeto com as configurações
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com a configuração atualizada.`,
        inputSchema: UpdateCapabilityConfigurationSchema.shape,
      },
      async (params: z.infer<typeof UpdateCapabilityConfigurationSchema>) => {
        const validatedParams = UpdateCapabilityConfigurationSchema.parse(params);
        return await this.updateCapabilityConfiguration(
          validatedParams.capabilityId,
          validatedParams.configuration,
          validatedParams.output
        );
      }
    );

    // Register get capability status tool
    server.registerTool(
      'capabilities_get_status',
      {
        description: `Obtém status de uma capability específica.

**Funcionalidades:**
- Status atual da capability
- Informações de saúde
- Indicadores de performance

**Parâmetros:**
- \`capability_id\`: ID da capability
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com o status da capability.`,
        inputSchema: GetCapabilityStatusSchema.shape,
      },
      async (params: z.infer<typeof GetCapabilityStatusSchema>) => {
        const validatedParams = GetCapabilityStatusSchema.parse(params);
        return await this.getCapabilityStatus(validatedParams.capabilityId, validatedParams.output);
      }
    );

    // Register list capability statuses tool
    server.registerTool(
      'capabilities_list_statuses',
      {
        description: `Lista status de todas as capabilities.

**Funcionalidades:**
- Status de todas as capabilities
- Visão geral do sistema
- Indicadores de saúde

**Parâmetros:**
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com os status das capabilities.`,
        inputSchema: ListCapabilityStatusesSchema.shape,
      },
      async (params: z.infer<typeof ListCapabilityStatusesSchema>) => {
        const validatedParams = ListCapabilityStatusesSchema.parse(params);
        return await this.listCapabilityStatuses(validatedParams.output);
      }
    );

    // Register get capability metrics tool
    server.registerTool(
      'capabilities_get_metrics',
      {
        description: `Obtém métricas de uma capability específica.

**Funcionalidades:**
- Métricas de performance
- Estatísticas de uso
- Indicadores de qualidade

**Parâmetros:**
- \`capability_id\`: ID da capability
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com as métricas da capability.`,
        inputSchema: GetCapabilityMetricsSchema.shape,
      },
      async (params: z.infer<typeof GetCapabilityMetricsSchema>) => {
        const validatedParams = GetCapabilityMetricsSchema.parse(params);
        return await this.getCapabilityMetrics(
          validatedParams.capabilityId,
          validatedParams.output
        );
      }
    );

    // Register list capability metrics tool
    server.registerTool(
      'capabilities_list_metrics',
      {
        description: `Lista métricas de todas as capabilities.

**Funcionalidades:**
- Métricas de todas as capabilities
- Visão geral de performance
- Comparação de indicadores

**Parâmetros:**
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com as métricas das capabilities.`,
        inputSchema: ListCapabilityMetricsSchema.shape,
      },
      async (params: z.infer<typeof ListCapabilityMetricsSchema>) => {
        const validatedParams = ListCapabilityMetricsSchema.parse(params);
        return await this.listCapabilityMetrics(validatedParams.output);
      }
    );

    // Register get capability events tool
    server.registerTool(
      'capabilities_get_events',
      {
        description: `Obtém eventos de uma capability específica.

**Funcionalidades:**
- Eventos da capability
- Histórico de atividades
- Logs de operações

**Parâmetros:**
- \`capability_id\`: ID da capability
- \`params\`: Parâmetros de filtro
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com os eventos da capability.`,
        inputSchema: GetCapabilityEventsSchema.shape,
      },
      async (params: z.infer<typeof GetCapabilityEventsSchema>) => {
        const validatedParams = GetCapabilityEventsSchema.parse(params);
        return await this.getCapabilityEvents(
          validatedParams.capabilityId,
          validatedParams.params,
          validatedParams.output
        );
      }
    );

    // Register list capability events tool
    server.registerTool(
      'capabilities_list_events',
      {
        description: `Lista eventos de todas as capabilities.

**Funcionalidades:**
- Eventos de todas as capabilities
- Visão geral de atividades
- Logs consolidados

**Parâmetros:**
- \`params\`: Parâmetros de filtro
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com os eventos das capabilities.`,
        inputSchema: ListCapabilityEventsSchema.shape,
      },
      async (params: z.infer<typeof ListCapabilityEventsSchema>) => {
        const validatedParams = ListCapabilityEventsSchema.parse(params);
        return await this.listCapabilityEvents(validatedParams.params, validatedParams.output);
      }
    );

    // Register list plugin capabilities tool
    server.registerTool(
      'capabilities_list_plugin_capabilities',
      {
        description: `Lista capabilities de plugins.

**Funcionalidades:**
- Capabilities de plugins
- Recursos disponíveis
- Status de plugins

**Parâmetros:**
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com as capabilities de plugins.`,
        inputSchema: ListPluginCapabilitiesSchema.shape,
      },
      async (params: z.infer<typeof ListPluginCapabilitiesSchema>) => {
        const validatedParams = ListPluginCapabilitiesSchema.parse(params);
        return await this.listPluginCapabilities(validatedParams.output);
      }
    );

    // Register get plugin capability tool
    server.registerTool(
      'capabilities_get_plugin_capability',
      {
        description: `Obtém capability de um plugin específico.

**Funcionalidades:**
- Capability do plugin
- Recursos específicos
- Configurações do plugin

**Parâmetros:**
- \`plugin_key\`: Chave do plugin
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com a capability do plugin.`,
        inputSchema: GetPluginCapabilitySchema.shape,
      },
      async (params: z.infer<typeof GetPluginCapabilitySchema>) => {
        const validatedParams = GetPluginCapabilitySchema.parse(params);
        return await this.getPluginCapability(validatedParams.pluginKey, validatedParams.output);
      }
    );

    // Register enable plugin capability tool
    server.registerTool(
      'capabilities_enable_plugin_capability',
      {
        description: `Habilita capability de um plugin específico.

**Funcionalidades:**
- Ativação de capability do plugin
- Configuração de recursos
- Verificação de dependências

**Parâmetros:**
- \`plugin_key\`: Chave do plugin
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com a capability do plugin habilitada.`,
        inputSchema: EnablePluginCapabilitySchema.shape,
      },
      async (params: z.infer<typeof EnablePluginCapabilitySchema>) => {
        const validatedParams = EnablePluginCapabilitySchema.parse(params);
        return await this.enablePluginCapability(validatedParams.pluginKey, validatedParams.output);
      }
    );

    // Register disable plugin capability tool
    server.registerTool(
      'capabilities_disable_plugin_capability',
      {
        description: `Desabilita capability de um plugin específico.

**Funcionalidades:**
- Desativação de capability do plugin
- Limpeza de recursos
- Verificação de dependências

**Parâmetros:**
- \`plugin_key\`: Chave do plugin
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com a capability do plugin desabilitada.`,
        inputSchema: DisablePluginCapabilitySchema.shape,
      },
      async (params: z.infer<typeof DisablePluginCapabilitySchema>) => {
        const validatedParams = DisablePluginCapabilitySchema.parse(params);
        return await this.disablePluginCapability(
          validatedParams.pluginKey,
          validatedParams.output
        );
      }
    );

    registerLogger.info('Successfully registered all data center capabilities tools');
  }
}
