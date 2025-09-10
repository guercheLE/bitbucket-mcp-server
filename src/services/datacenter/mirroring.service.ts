/**
 * Mirroring Service for Bitbucket Data Center REST API
 * Based on official documentation: https://developer.atlassian.com/server/bitbucket/rest/v906/intro/
 */

import {
  MirrorConfiguration,
  MirrorConfigurationRequest,
  MirrorConfigurationUpdateRequest,
  MirrorConfigurationListResponse,
  MirrorSyncResult,
  MirrorSyncResultListResponse,
  MirrorQueryParams,
  UpstreamMirror,
  UpstreamMirrorRequest,
  UpstreamMirrorListResponse,
} from './types/mirroring.types.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';

export class MirroringService {
  private readonly apiClient: ApiClient;
  private readonly logger: Logger;

  constructor(apiClient: ApiClient, logger: Logger) {
    this.apiClient = apiClient;
    this.logger = logger;
  }

  /**
   * List mirror configurations
   * GET /rest/api/1.0/admin/mirrors
   */
  async listMirrorConfigurations(
    params?: MirrorQueryParams
  ): Promise<MirrorConfigurationListResponse> {
    this.logger.info('Listing mirror configurations', { params });

    try {
      const response = await this.apiClient.get<MirrorConfigurationListResponse>('/admin/mirrors', {
        params,
      });
      this.logger.info('Successfully listed mirror configurations', {
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list mirror configurations', { params, error });
      throw error;
    }
  }

  /**
   * Create mirror configuration
   * POST /rest/api/1.0/admin/mirrors
   */
  async createMirrorConfiguration(
    request: MirrorConfigurationRequest
  ): Promise<MirrorConfiguration> {
    this.logger.info('Creating mirror configuration', { request });

    try {
      const response = await this.apiClient.post<MirrorConfiguration>('/admin/mirrors', request);
      this.logger.info('Successfully created mirror configuration', { id: response.data.id });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create mirror configuration', { request, error });
      throw error;
    }
  }

  /**
   * Get mirror configuration by ID
   * GET /rest/api/1.0/admin/mirrors/{mirrorId}
   */
  async getMirrorConfiguration(mirrorId: number): Promise<MirrorConfiguration> {
    this.logger.info('Getting mirror configuration', { mirrorId });

    try {
      const response = await this.apiClient.get<MirrorConfiguration>(`/admin/mirrors/${mirrorId}`);
      this.logger.info('Successfully retrieved mirror configuration', { mirrorId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get mirror configuration', { mirrorId, error });
      throw error;
    }
  }

  /**
   * Update mirror configuration
   * PUT /rest/api/1.0/admin/mirrors/{mirrorId}
   */
  async updateMirrorConfiguration(
    mirrorId: number,
    request: MirrorConfigurationUpdateRequest
  ): Promise<MirrorConfiguration> {
    this.logger.info('Updating mirror configuration', { mirrorId, request });

    try {
      const response = await this.apiClient.put<MirrorConfiguration>(
        `/admin/mirrors/${mirrorId}`,
        request
      );
      this.logger.info('Successfully updated mirror configuration', { mirrorId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update mirror configuration', { mirrorId, request, error });
      throw error;
    }
  }

  /**
   * Delete mirror configuration
   * DELETE /rest/api/1.0/admin/mirrors/{mirrorId}
   */
  async deleteMirrorConfiguration(mirrorId: number): Promise<void> {
    this.logger.info('Deleting mirror configuration', { mirrorId });

    try {
      await this.apiClient.delete(`/admin/mirrors/${mirrorId}`);
      this.logger.info('Successfully deleted mirror configuration', { mirrorId });
    } catch (error) {
      this.logger.error('Failed to delete mirror configuration', { mirrorId, error });
      throw error;
    }
  }

  /**
   * Start mirror sync
   * POST /rest/api/1.0/admin/mirrors/{mirrorId}/sync
   */
  async startMirrorSync(mirrorId: number): Promise<MirrorSyncResult> {
    this.logger.info('Starting mirror sync', { mirrorId });

    try {
      const response = await this.apiClient.post<MirrorSyncResult>(
        `/admin/mirrors/${mirrorId}/sync`
      );
      this.logger.info('Successfully started mirror sync', { mirrorId, syncId: response.data.id });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to start mirror sync', { mirrorId, error });
      throw error;
    }
  }

  /**
   * Stop mirror sync
   * DELETE /rest/api/1.0/admin/mirrors/{mirrorId}/sync
   */
  async stopMirrorSync(mirrorId: number): Promise<void> {
    this.logger.info('Stopping mirror sync', { mirrorId });

    try {
      await this.apiClient.delete(`/admin/mirrors/${mirrorId}/sync`);
      this.logger.info('Successfully stopped mirror sync', { mirrorId });
    } catch (error) {
      this.logger.error('Failed to stop mirror sync', { mirrorId, error });
      throw error;
    }
  }

  /**
   * Get mirror sync results
   * GET /rest/api/1.0/admin/mirrors/{mirrorId}/sync-results
   */
  async getMirrorSyncResults(
    mirrorId: number,
    params?: MirrorQueryParams
  ): Promise<MirrorSyncResultListResponse> {
    this.logger.info('Getting mirror sync results', { mirrorId, params });

    try {
      const response = await this.apiClient.get<MirrorSyncResultListResponse>(
        `/admin/mirrors/${mirrorId}/sync-results`,
        { params }
      );
      this.logger.info('Successfully retrieved mirror sync results', {
        mirrorId,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get mirror sync results', { mirrorId, params, error });
      throw error;
    }
  }

  /**
   * Get mirror sync result by ID
   * GET /rest/api/1.0/admin/mirrors/{mirrorId}/sync-results/{syncResultId}
   */
  async getMirrorSyncResult(mirrorId: number, syncResultId: number): Promise<MirrorSyncResult> {
    this.logger.info('Getting mirror sync result', { mirrorId, syncResultId });

    try {
      const response = await this.apiClient.get<MirrorSyncResult>(
        `/admin/mirrors/${mirrorId}/sync-results/${syncResultId}`
      );
      this.logger.info('Successfully retrieved mirror sync result', { mirrorId, syncResultId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get mirror sync result', { mirrorId, syncResultId, error });
      throw error;
    }
  }

  /**
   * List upstream mirrors
   * GET /rest/api/1.0/admin/upstream-mirrors
   */
  async listUpstreamMirrors(params?: MirrorQueryParams): Promise<UpstreamMirrorListResponse> {
    this.logger.info('Listing upstream mirrors', { params });

    try {
      const response = await this.apiClient.get<UpstreamMirrorListResponse>(
        '/admin/upstream-mirrors',
        { params }
      );
      this.logger.info('Successfully listed upstream mirrors', {
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list upstream mirrors', { params, error });
      throw error;
    }
  }

  /**
   * Create upstream mirror
   * POST /rest/api/1.0/admin/upstream-mirrors
   */
  async createUpstreamMirror(request: UpstreamMirrorRequest): Promise<UpstreamMirror> {
    this.logger.info('Creating upstream mirror', { request });

    try {
      const response = await this.apiClient.post<UpstreamMirror>(
        '/admin/upstream-mirrors',
        request
      );
      this.logger.info('Successfully created upstream mirror', { id: response.data.id });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create upstream mirror', { request, error });
      throw error;
    }
  }

  /**
   * Get upstream mirror by ID
   * GET /rest/api/1.0/admin/upstream-mirrors/{mirrorId}
   */
  async getUpstreamMirror(mirrorId: number): Promise<UpstreamMirror> {
    this.logger.info('Getting upstream mirror', { mirrorId });

    try {
      const response = await this.apiClient.get<UpstreamMirror>(
        `/admin/upstream-mirrors/${mirrorId}`
      );
      this.logger.info('Successfully retrieved upstream mirror', { mirrorId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get upstream mirror', { mirrorId, error });
      throw error;
    }
  }

  /**
   * Update upstream mirror
   * PUT /rest/api/1.0/admin/upstream-mirrors/{mirrorId}
   */
  async updateUpstreamMirror(
    mirrorId: number,
    request: UpstreamMirrorRequest
  ): Promise<UpstreamMirror> {
    this.logger.info('Updating upstream mirror', { mirrorId, request });

    try {
      const response = await this.apiClient.put<UpstreamMirror>(
        `/admin/upstream-mirrors/${mirrorId}`,
        request
      );
      this.logger.info('Successfully updated upstream mirror', { mirrorId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update upstream mirror', { mirrorId, request, error });
      throw error;
    }
  }

  /**
   * Delete upstream mirror
   * DELETE /rest/api/1.0/admin/upstream-mirrors/{mirrorId}
   */
  async deleteUpstreamMirror(mirrorId: number): Promise<void> {
    this.logger.info('Deleting upstream mirror', { mirrorId });

    try {
      await this.apiClient.delete(`/admin/upstream-mirrors/${mirrorId}`);
      this.logger.info('Successfully deleted upstream mirror', { mirrorId });
    } catch (error) {
      this.logger.error('Failed to delete upstream mirror', { mirrorId, error });
      throw error;
    }
  }

  /**
   * Start upstream mirror sync
   * POST /rest/api/1.0/admin/upstream-mirrors/{mirrorId}/sync
   */
  async startUpstreamMirrorSync(mirrorId: number): Promise<MirrorSyncResult> {
    this.logger.info('Starting upstream mirror sync', { mirrorId });

    try {
      const response = await this.apiClient.post<MirrorSyncResult>(
        `/admin/upstream-mirrors/${mirrorId}/sync`
      );
      this.logger.info('Successfully started upstream mirror sync', {
        mirrorId,
        syncId: response.data.id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to start upstream mirror sync', { mirrorId, error });
      throw error;
    }
  }

  /**
   * Stop upstream mirror sync
   * DELETE /rest/api/1.0/admin/upstream-mirrors/{mirrorId}/sync
   */
  async stopUpstreamMirrorSync(mirrorId: number): Promise<void> {
    this.logger.info('Stopping upstream mirror sync', { mirrorId });

    try {
      await this.apiClient.delete(`/admin/upstream-mirrors/${mirrorId}/sync`);
      this.logger.info('Successfully stopped upstream mirror sync', { mirrorId });
    } catch (error) {
      this.logger.error('Failed to stop upstream mirror sync', { mirrorId, error });
      throw error;
    }
  }
}
