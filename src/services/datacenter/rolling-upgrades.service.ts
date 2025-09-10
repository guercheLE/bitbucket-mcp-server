/**
 * Rolling Upgrades Service for Bitbucket Data Center REST API
 * Based on official documentation: https://developer.atlassian.com/server/bitbucket/rest/v906/intro/
 */

import {
  Cluster,
  ClusterState,
  NodeInfoDTO,
  NodeState,
  NodeWithBuildInfo,
  RollingUpgradeConfiguration,
  RollingUpgradeHistory,
  RollingUpgradeRequest,
  RollingUpgradeResponse,
  RollingUpgradeStatus,
} from './types/rolling-upgrades.types.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';

export class RollingUpgradesService {
  private readonly apiClient: ApiClient;
  private readonly logger: Logger;

  constructor(apiClient: ApiClient, logger: Logger) {
    this.apiClient = apiClient;
    this.logger = logger;
  }

  /**
   * Get cluster information
   * GET /rest/api/1.0/admin/cluster
   */
  async getCluster(): Promise<Cluster> {
    this.logger.info('Getting cluster information');

    try {
      const response = await this.apiClient.get<Cluster>('/admin/cluster');
      this.logger.info('Successfully retrieved cluster information');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get cluster information', error);
      throw error;
    }
  }

  /**
   * Get cluster state
   * GET /rest/api/1.0/admin/cluster/state
   */
  async getClusterState(): Promise<ClusterState> {
    this.logger.info('Getting cluster state');

    try {
      const response = await this.apiClient.get<{ state: ClusterState }>('/admin/cluster/state');
      this.logger.info('Successfully retrieved cluster state', { state: response.data.state });
      return response.data.state;
    } catch (error) {
      this.logger.error('Failed to get cluster state', error);
      throw error;
    }
  }

  /**
   * Get node information
   * GET /rest/api/1.0/admin/cluster/nodes/{nodeId}
   */
  async getNode(nodeId: string): Promise<NodeInfoDTO> {
    this.logger.info('Getting node information', { nodeId });

    try {
      const response = await this.apiClient.get<NodeInfoDTO>(`/admin/cluster/nodes/${nodeId}`);
      this.logger.info('Successfully retrieved node information', { nodeId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get node information', { nodeId, error });
      throw error;
    }
  }

  /**
   * Get all nodes in the cluster
   * GET /rest/api/1.0/admin/cluster/nodes
   */
  async getNodes(): Promise<NodeInfoDTO[]> {
    this.logger.info('Getting all nodes in cluster');

    try {
      const response = await this.apiClient.get<{ nodes: NodeInfoDTO[] }>('/admin/cluster/nodes');
      this.logger.info('Successfully retrieved all nodes', { count: response.data.nodes.length });
      return response.data.nodes;
    } catch (error) {
      this.logger.error('Failed to get nodes', error);
      throw error;
    }
  }

  /**
   * Get node with build information
   * GET /rest/api/1.0/admin/cluster/nodes/{nodeId}/build-info
   */
  async getNodeWithBuildInfo(nodeId: string): Promise<NodeWithBuildInfo> {
    this.logger.info('Getting node with build information', { nodeId });

    try {
      const response = await this.apiClient.get<NodeWithBuildInfo>(
        `/admin/cluster/nodes/${nodeId}/build-info`
      );
      this.logger.info('Successfully retrieved node with build information', { nodeId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get node with build information', { nodeId, error });
      throw error;
    }
  }

  /**
   * Start rolling upgrade
   * POST /rest/api/1.0/admin/cluster/rolling-upgrade
   */
  async startRollingUpgrade(request: RollingUpgradeRequest): Promise<RollingUpgradeResponse> {
    this.logger.info('Starting rolling upgrade', { request });

    try {
      const response = await this.apiClient.post<RollingUpgradeResponse>(
        '/admin/cluster/rolling-upgrade',
        request
      );
      this.logger.info('Successfully started rolling upgrade', { upgradeId: response.data.id });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to start rolling upgrade', { request, error });
      throw error;
    }
  }

  /**
   * Get rolling upgrade status
   * GET /rest/api/1.0/admin/cluster/rolling-upgrade/status
   */
  async getRollingUpgradeStatus(): Promise<RollingUpgradeStatus> {
    this.logger.info('Getting rolling upgrade status');

    try {
      const response = await this.apiClient.get<RollingUpgradeStatus>(
        '/admin/cluster/rolling-upgrade/status'
      );
      this.logger.info('Successfully retrieved rolling upgrade status', {
        status: response.data.status,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get rolling upgrade status', error);
      throw error;
    }
  }

  /**
   * Cancel rolling upgrade
   * POST /rest/api/1.0/admin/cluster/rolling-upgrade/cancel
   */
  async cancelRollingUpgrade(): Promise<RollingUpgradeResponse> {
    this.logger.info('Cancelling rolling upgrade');

    try {
      const response = await this.apiClient.post<RollingUpgradeResponse>(
        '/admin/cluster/rolling-upgrade/cancel'
      );
      this.logger.info('Successfully cancelled rolling upgrade', { upgradeId: response.data.id });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to cancel rolling upgrade', error);
      throw error;
    }
  }

  /**
   * Get rolling upgrade configuration
   * GET /rest/api/1.0/admin/cluster/rolling-upgrade/configuration
   */
  async getRollingUpgradeConfiguration(): Promise<RollingUpgradeConfiguration> {
    this.logger.info('Getting rolling upgrade configuration');

    try {
      const response = await this.apiClient.get<RollingUpgradeConfiguration>(
        '/admin/cluster/rolling-upgrade/configuration'
      );
      this.logger.info('Successfully retrieved rolling upgrade configuration');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get rolling upgrade configuration', error);
      throw error;
    }
  }

  /**
   * Update rolling upgrade configuration
   * PUT /rest/api/1.0/admin/cluster/rolling-upgrade/configuration
   */
  async updateRollingUpgradeConfiguration(
    configuration: RollingUpgradeConfiguration
  ): Promise<RollingUpgradeConfiguration> {
    this.logger.info('Updating rolling upgrade configuration', { configuration });

    try {
      const response = await this.apiClient.put<RollingUpgradeConfiguration>(
        '/admin/cluster/rolling-upgrade/configuration',
        configuration
      );
      this.logger.info('Successfully updated rolling upgrade configuration');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update rolling upgrade configuration', { configuration, error });
      throw error;
    }
  }

  /**
   * Get rolling upgrade history
   * GET /rest/api/1.0/admin/cluster/rolling-upgrade/history
   */
  async getRollingUpgradeHistory(): Promise<RollingUpgradeHistory[]> {
    this.logger.info('Getting rolling upgrade history');

    try {
      const response = await this.apiClient.get<{ history: RollingUpgradeHistory[] }>(
        '/admin/cluster/rolling-upgrade/history'
      );
      this.logger.info('Successfully retrieved rolling upgrade history', {
        count: response.data.history.length,
      });
      return response.data.history;
    } catch (error) {
      this.logger.error('Failed to get rolling upgrade history', error);
      throw error;
    }
  }

  /**
   * Enable upgrade mode
   * POST /rest/api/1.0/admin/cluster/upgrade-mode/enable
   */
  async enableUpgradeMode(): Promise<{ enabled: boolean }> {
    this.logger.info('Enabling upgrade mode');

    try {
      const response = await this.apiClient.post<{ enabled: boolean }>(
        '/admin/cluster/upgrade-mode/enable'
      );
      this.logger.info('Successfully enabled upgrade mode');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to enable upgrade mode', error);
      throw error;
    }
  }

  /**
   * Disable upgrade mode
   * POST /rest/api/1.0/admin/cluster/upgrade-mode/disable
   */
  async disableUpgradeMode(): Promise<{ enabled: boolean }> {
    this.logger.info('Disabling upgrade mode');

    try {
      const response = await this.apiClient.post<{ enabled: boolean }>(
        '/admin/cluster/upgrade-mode/disable'
      );
      this.logger.info('Successfully disabled upgrade mode');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to disable upgrade mode', error);
      throw error;
    }
  }

  /**
   * Get upgrade mode status
   * GET /rest/api/1.0/admin/cluster/upgrade-mode/status
   */
  async getUpgradeModeStatus(): Promise<{ enabled: boolean }> {
    this.logger.info('Getting upgrade mode status');

    try {
      const response = await this.apiClient.get<{ enabled: boolean }>(
        '/admin/cluster/upgrade-mode/status'
      );
      this.logger.info('Successfully retrieved upgrade mode status', {
        enabled: response.data.enabled,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get upgrade mode status', error);
      throw error;
    }
  }
}
