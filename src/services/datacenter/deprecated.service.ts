/**
 * Deprecated Service for Bitbucket Data Center REST API
 * Based on official documentation: https://developer.atlassian.com/server/bitbucket/rest/v906/intro/
 */

import {
  DeprecatedApiVersion,
  DeprecatedApiVersionListResponse,
  DeprecatedApiVersionQueryParams,
  DeprecatedEndpoint,
  DeprecatedEndpointListResponse,
  DeprecatedEndpointQueryParams,
  DeprecatedEndpointResponse,
  DeprecatedEndpointUsage,
  DeprecatedEndpointUsageQueryParams,
  DeprecatedEndpointUsageResponse,
  DeprecatedFeature,
  DeprecatedFeatureListResponse,
  DeprecatedFeatureQueryParams,
  DeprecationPolicyResponse,
  DeprecationNotice,
  DeprecationNoticeListResponse,
  DeprecationNoticeQueryParams,
  DeprecationTimeline,
  DeprecationTimelineQueryParams,
  DeprecationTimelineResponse,
} from './types/deprecated.types.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';

export class DeprecatedService {
  private readonly apiClient: ApiClient;
  private readonly logger: Logger;

  constructor(apiClient: ApiClient, logger: Logger) {
    this.apiClient = apiClient;
    this.logger = logger;
  }

  /**
   * Get list of deprecated endpoints
   * GET /rest/api/1.0/admin/deprecated/endpoints
   */
  async getDeprecatedEndpoints(
    params?: DeprecatedEndpointQueryParams
  ): Promise<DeprecatedEndpointListResponse> {
    this.logger.info('Getting deprecated endpoints', { params });

    try {
      const response = await this.apiClient.get<DeprecatedEndpointListResponse>(
        '/admin/deprecated/endpoints',
        { params }
      );
      this.logger.info('Successfully retrieved deprecated endpoints', {
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get deprecated endpoints', { params, error });
      throw error;
    }
  }

  /**
   * Get details of a specific deprecated endpoint
   * GET /rest/api/1.0/admin/deprecated/endpoints/{endpoint}
   */
  async getDeprecatedEndpoint(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  ): Promise<DeprecatedEndpointResponse> {
    this.logger.info('Getting deprecated endpoint details', { endpoint, method });

    try {
      const response = await this.apiClient.get<DeprecatedEndpointResponse>(
        `/admin/deprecated/endpoints/${encodeURIComponent(endpoint)}`,
        { params: { method } }
      );
      this.logger.info('Successfully retrieved deprecated endpoint details', { endpoint });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get deprecated endpoint details', { endpoint, method, error });
      throw error;
    }
  }

  /**
   * Get usage statistics for deprecated endpoints
   * GET /rest/api/1.0/admin/deprecated/endpoints/usage
   */
  async getDeprecatedEndpointUsage(
    params?: DeprecatedEndpointUsageQueryParams
  ): Promise<DeprecatedEndpointUsageResponse> {
    this.logger.info('Getting deprecated endpoint usage statistics', { params });

    try {
      const response = await this.apiClient.get<DeprecatedEndpointUsageResponse>(
        '/admin/deprecated/endpoints/usage',
        { params }
      );
      this.logger.info('Successfully retrieved deprecated endpoint usage statistics', {
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get deprecated endpoint usage statistics', { params, error });
      throw error;
    }
  }

  /**
   * Get list of deprecated features
   * GET /rest/api/1.0/admin/deprecated/features
   */
  async getDeprecatedFeatures(
    params?: DeprecatedFeatureQueryParams
  ): Promise<DeprecatedFeatureListResponse> {
    this.logger.info('Getting deprecated features', { params });

    try {
      const response = await this.apiClient.get<DeprecatedFeatureListResponse>(
        '/admin/deprecated/features',
        { params }
      );
      this.logger.info('Successfully retrieved deprecated features', {
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get deprecated features', { params, error });
      throw error;
    }
  }

  /**
   * Get details of a specific deprecated feature
   * GET /rest/api/1.0/admin/deprecated/features/{feature}
   */
  async getDeprecatedFeature(feature: string): Promise<DeprecatedFeature> {
    this.logger.info('Getting deprecated feature details', { feature });

    try {
      const response = await this.apiClient.get<DeprecatedFeature>(
        `/admin/deprecated/features/${encodeURIComponent(feature)}`
      );
      this.logger.info('Successfully retrieved deprecated feature details', { feature });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get deprecated feature details', { feature, error });
      throw error;
    }
  }

  /**
   * Get list of deprecated API versions
   * GET /rest/api/1.0/admin/deprecated/versions
   */
  async getDeprecatedApiVersions(
    params?: DeprecatedApiVersionQueryParams
  ): Promise<DeprecatedApiVersionListResponse> {
    this.logger.info('Getting deprecated API versions', { params });

    try {
      const response = await this.apiClient.get<DeprecatedApiVersionListResponse>(
        '/admin/deprecated/versions',
        { params }
      );
      this.logger.info('Successfully retrieved deprecated API versions', {
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get deprecated API versions', { params, error });
      throw error;
    }
  }

  /**
   * Get details of a specific deprecated API version
   * GET /rest/api/1.0/admin/deprecated/versions/{version}
   */
  async getDeprecatedApiVersion(version: string): Promise<DeprecatedApiVersion> {
    this.logger.info('Getting deprecated API version details', { version });

    try {
      const response = await this.apiClient.get<DeprecatedApiVersion>(
        `/admin/deprecated/versions/${encodeURIComponent(version)}`
      );
      this.logger.info('Successfully retrieved deprecated API version details', { version });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get deprecated API version details', { version, error });
      throw error;
    }
  }

  /**
   * Get deprecation notices
   * GET /rest/api/1.0/admin/deprecated/notices
   */
  async getDeprecationNotices(
    params?: DeprecationNoticeQueryParams
  ): Promise<DeprecationNoticeListResponse> {
    this.logger.info('Getting deprecation notices', { params });

    try {
      const response = await this.apiClient.get<DeprecationNoticeListResponse>(
        '/admin/deprecated/notices',
        { params }
      );
      this.logger.info('Successfully retrieved deprecation notices', {
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get deprecation notices', { params, error });
      throw error;
    }
  }

  /**
   * Get details of a specific deprecation notice
   * GET /rest/api/1.0/admin/deprecated/notices/{noticeId}
   */
  async getDeprecationNotice(noticeId: string): Promise<DeprecationNotice> {
    this.logger.info('Getting deprecation notice details', { noticeId });

    try {
      const response = await this.apiClient.get<DeprecationNotice>(
        `/admin/deprecated/notices/${encodeURIComponent(noticeId)}`
      );
      this.logger.info('Successfully retrieved deprecation notice details', { noticeId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get deprecation notice details', { noticeId, error });
      throw error;
    }
  }

  /**
   * Get deprecation policy
   * GET /rest/api/1.0/admin/deprecated/policy
   */
  async getDeprecationPolicy(): Promise<DeprecationPolicyResponse> {
    this.logger.info('Getting deprecation policy');

    try {
      const response = await this.apiClient.get<DeprecationPolicyResponse>(
        '/admin/deprecated/policy'
      );
      this.logger.info('Successfully retrieved deprecation policy');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get deprecation policy', { error });
      throw error;
    }
  }

  /**
   * Get deprecation timeline for a resource
   * GET /rest/api/1.0/admin/deprecated/timeline
   */
  async getDeprecationTimeline(
    params?: DeprecationTimelineQueryParams
  ): Promise<DeprecationTimelineResponse> {
    this.logger.info('Getting deprecation timeline', { params });

    try {
      const response = await this.apiClient.get<DeprecationTimelineResponse>(
        '/admin/deprecated/timeline',
        { params }
      );
      this.logger.info('Successfully retrieved deprecation timeline');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get deprecation timeline', { params, error });
      throw error;
    }
  }

  /**
   * Get deprecation timeline for a specific resource
   * GET /rest/api/1.0/admin/deprecated/timeline/{resource}
   */
  async getResourceDeprecationTimeline(resource: string): Promise<DeprecationTimeline> {
    this.logger.info('Getting resource deprecation timeline', { resource });

    try {
      const response = await this.apiClient.get<DeprecationTimeline>(
        `/admin/deprecated/timeline/${encodeURIComponent(resource)}`
      );
      this.logger.info('Successfully retrieved resource deprecation timeline', { resource });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get resource deprecation timeline', { resource, error });
      throw error;
    }
  }

  /**
   * Check if an endpoint is deprecated
   * GET /rest/api/1.0/admin/deprecated/check
   */
  async checkEndpointDeprecation(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  ): Promise<{ deprecated: boolean; details?: DeprecatedEndpointResponse }> {
    this.logger.info('Checking endpoint deprecation status', { endpoint, method });

    try {
      const response = await this.apiClient.get<{
        deprecated: boolean;
        details?: DeprecatedEndpointResponse;
      }>('/admin/deprecated/check', { params: { endpoint, method } });
      this.logger.info('Successfully checked endpoint deprecation status', {
        endpoint,
        deprecated: response.data.deprecated,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to check endpoint deprecation status', { endpoint, method, error });
      throw error;
    }
  }

  /**
   * Get migration recommendations for deprecated resources
   * GET /rest/api/1.0/admin/deprecated/migration
   */
  async getMigrationRecommendations(
    resource: string,
    type: 'ENDPOINT' | 'FEATURE' | 'API_VERSION' | 'PARAMETER'
  ): Promise<{
    resource: string;
    type: string;
    recommendations: Array<{
      alternative: string;
      migrationSteps: string[];
      estimatedEffort: 'LOW' | 'MEDIUM' | 'HIGH';
      documentation: string;
    }>;
  }> {
    this.logger.info('Getting migration recommendations', { resource, type });

    try {
      const response = await this.apiClient.get<{
        resource: string;
        type: string;
        recommendations: Array<{
          alternative: string;
          migrationSteps: string[];
          estimatedEffort: 'LOW' | 'MEDIUM' | 'HIGH';
          documentation: string;
        }>;
      }>('/admin/deprecated/migration', { params: { resource, type } });
      this.logger.info('Successfully retrieved migration recommendations', { resource });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get migration recommendations', { resource, type, error });
      throw error;
    }
  }
}
