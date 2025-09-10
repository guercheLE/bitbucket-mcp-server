/**
 * Security Service for Bitbucket Data Center REST API
 * Based on official documentation: https://developer.atlassian.com/server/bitbucket/rest/v906/intro/
 */

import {
  SecurityAudit,
  SecurityAuditListResponse,
  SecurityAuditQueryParams,
  SecurityAuditResponse,
  SecurityConfig,
  SecurityConfigurationResponse,
  SecurityMetrics,
  SecurityMetricsResponse,
  SecurityPolicy,
  SecurityPolicyCreateRequest,
  SecurityPolicyListResponse,
  SecurityPolicyQueryParams,
  SecurityPolicyResponse,
  SecurityPolicyUpdateRequest,
  SecurityScan,
  SecurityScanCreateRequest,
  SecurityScanListResponse,
  SecurityScanQueryParams,
  SecurityScanResponse,
  SecurityViolation,
  SecurityViolationListResponse,
  SecurityViolationQueryParams,
  SecurityViolationResponse,
  SecurityViolationUpdateRequest,
} from './types/security.types.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';

export class SecurityService {
  private readonly apiClient: ApiClient;
  private readonly logger: Logger;

  constructor(apiClient: ApiClient, logger: Logger) {
    this.apiClient = apiClient;
    this.logger = logger;
  }

  // Security Audit
  /**
   * Get security audit logs
   * GET /rest/api/1.0/security/audit
   */
  async getSecurityAuditLogs(
    params?: SecurityAuditQueryParams
  ): Promise<SecurityAuditListResponse> {
    this.logger.info('Getting security audit logs', { params });

    try {
      const response = await this.apiClient.get<SecurityAuditListResponse>('/security/audit', {
        params,
      });
      this.logger.info('Successfully retrieved security audit logs', {
        count: response.data.values.length,
        total: response.data.size,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get security audit logs', { params, error });
      throw error;
    }
  }

  /**
   * Get security audit log by ID
   * GET /rest/api/1.0/security/audit/{auditId}
   */
  async getSecurityAuditLog(auditId: string): Promise<SecurityAuditResponse> {
    this.logger.info('Getting security audit log', { auditId });

    try {
      const response = await this.apiClient.get<SecurityAuditResponse>(
        `/security/audit/${auditId}`
      );
      this.logger.info('Successfully retrieved security audit log', {
        auditId,
        action: response.data.action,
        result: response.data.result,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get security audit log', { auditId, error });
      throw error;
    }
  }

  /**
   * Export security audit logs
   * GET /rest/api/1.0/security/audit/export
   */
  async exportSecurityAuditLogs(params?: SecurityAuditQueryParams): Promise<Blob> {
    this.logger.info('Exporting security audit logs', { params });

    try {
      const response = await this.apiClient.get('/security/audit/export', {
        params,
        responseType: 'blob',
      });
      this.logger.info('Successfully exported security audit logs');
      return response.data as Blob;
    } catch (error) {
      this.logger.error('Failed to export security audit logs', { params, error });
      throw error;
    }
  }

  // Security Policies
  /**
   * List security policies
   * GET /rest/api/1.0/security/policies
   */
  async listSecurityPolicies(
    params?: SecurityPolicyQueryParams
  ): Promise<SecurityPolicyListResponse> {
    this.logger.info('Listing security policies', { params });

    try {
      const response = await this.apiClient.get<SecurityPolicyListResponse>('/security/policies', {
        params,
      });
      this.logger.info('Successfully listed security policies', {
        count: response.data.values.length,
        total: response.data.size,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list security policies', { params, error });
      throw error;
    }
  }

  /**
   * Get security policy by ID
   * GET /rest/api/1.0/security/policies/{policyId}
   */
  async getSecurityPolicy(policyId: string): Promise<SecurityPolicyResponse> {
    this.logger.info('Getting security policy', { policyId });

    try {
      const response = await this.apiClient.get<SecurityPolicyResponse>(
        `/security/policies/${policyId}`
      );
      this.logger.info('Successfully retrieved security policy', {
        policyId,
        name: response.data.name,
        type: response.data.type,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get security policy', { policyId, error });
      throw error;
    }
  }

  /**
   * Create security policy
   * POST /rest/api/1.0/security/policies
   */
  async createSecurityPolicy(
    request: SecurityPolicyCreateRequest
  ): Promise<SecurityPolicyResponse> {
    this.logger.info('Creating security policy', { name: request.name, type: request.type });

    try {
      const response = await this.apiClient.post<SecurityPolicyResponse>(
        '/security/policies',
        request
      );
      this.logger.info('Successfully created security policy', {
        id: response.data.id,
        name: response.data.name,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create security policy', { request, error });
      throw error;
    }
  }

  /**
   * Update security policy
   * PUT /rest/api/1.0/security/policies/{policyId}
   */
  async updateSecurityPolicy(
    policyId: string,
    request: SecurityPolicyUpdateRequest
  ): Promise<SecurityPolicyResponse> {
    this.logger.info('Updating security policy', { policyId, request });

    try {
      const response = await this.apiClient.put<SecurityPolicyResponse>(
        `/security/policies/${policyId}`,
        request
      );
      this.logger.info('Successfully updated security policy', { policyId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update security policy', { policyId, request, error });
      throw error;
    }
  }

  /**
   * Delete security policy
   * DELETE /rest/api/1.0/security/policies/{policyId}
   */
  async deleteSecurityPolicy(policyId: string): Promise<void> {
    this.logger.info('Deleting security policy', { policyId });

    try {
      await this.apiClient.delete(`/security/policies/${policyId}`);
      this.logger.info('Successfully deleted security policy', { policyId });
    } catch (error) {
      this.logger.error('Failed to delete security policy', { policyId, error });
      throw error;
    }
  }

  /**
   * Enable security policy
   * POST /rest/api/1.0/security/policies/{policyId}/enable
   */
  async enableSecurityPolicy(policyId: string): Promise<SecurityPolicyResponse> {
    this.logger.info('Enabling security policy', { policyId });

    try {
      const response = await this.apiClient.post<SecurityPolicyResponse>(
        `/security/policies/${policyId}/enable`
      );
      this.logger.info('Successfully enabled security policy', { policyId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to enable security policy', { policyId, error });
      throw error;
    }
  }

  /**
   * Disable security policy
   * POST /rest/api/1.0/security/policies/{policyId}/disable
   */
  async disableSecurityPolicy(policyId: string): Promise<SecurityPolicyResponse> {
    this.logger.info('Disabling security policy', { policyId });

    try {
      const response = await this.apiClient.post<SecurityPolicyResponse>(
        `/security/policies/${policyId}/disable`
      );
      this.logger.info('Successfully disabled security policy', { policyId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to disable security policy', { policyId, error });
      throw error;
    }
  }

  // Security Violations
  /**
   * List security violations
   * GET /rest/api/1.0/security/violations
   */
  async listSecurityViolations(
    params?: SecurityViolationQueryParams
  ): Promise<SecurityViolationListResponse> {
    this.logger.info('Listing security violations', { params });

    try {
      const response = await this.apiClient.get<SecurityViolationListResponse>(
        '/security/violations',
        { params }
      );
      this.logger.info('Successfully listed security violations', {
        count: response.data.values.length,
        total: response.data.size,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list security violations', { params, error });
      throw error;
    }
  }

  /**
   * Get security violation by ID
   * GET /rest/api/1.0/security/violations/{violationId}
   */
  async getSecurityViolation(violationId: string): Promise<SecurityViolationResponse> {
    this.logger.info('Getting security violation', { violationId });

    try {
      const response = await this.apiClient.get<SecurityViolationResponse>(
        `/security/violations/${violationId}`
      );
      this.logger.info('Successfully retrieved security violation', {
        violationId,
        severity: response.data.severity,
        status: response.data.status,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get security violation', { violationId, error });
      throw error;
    }
  }

  /**
   * Update security violation
   * PUT /rest/api/1.0/security/violations/{violationId}
   */
  async updateSecurityViolation(
    violationId: string,
    request: SecurityViolationUpdateRequest
  ): Promise<SecurityViolationResponse> {
    this.logger.info('Updating security violation', { violationId, request });

    try {
      const response = await this.apiClient.put<SecurityViolationResponse>(
        `/security/violations/${violationId}`,
        request
      );
      this.logger.info('Successfully updated security violation', { violationId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update security violation', { violationId, request, error });
      throw error;
    }
  }

  /**
   * Resolve security violation
   * POST /rest/api/1.0/security/violations/{violationId}/resolve
   */
  async resolveSecurityViolation(
    violationId: string,
    resolution: string,
    notes?: string
  ): Promise<SecurityViolationResponse> {
    this.logger.info('Resolving security violation', { violationId, resolution });

    try {
      const response = await this.apiClient.post<SecurityViolationResponse>(
        `/security/violations/${violationId}/resolve`,
        { resolution, notes }
      );
      this.logger.info('Successfully resolved security violation', { violationId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to resolve security violation', { violationId, resolution, error });
      throw error;
    }
  }

  /**
   * Ignore security violation
   * POST /rest/api/1.0/security/violations/{violationId}/ignore
   */
  async ignoreSecurityViolation(
    violationId: string,
    reason: string
  ): Promise<SecurityViolationResponse> {
    this.logger.info('Ignoring security violation', { violationId, reason });

    try {
      const response = await this.apiClient.post<SecurityViolationResponse>(
        `/security/violations/${violationId}/ignore`,
        { reason }
      );
      this.logger.info('Successfully ignored security violation', { violationId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to ignore security violation', { violationId, reason, error });
      throw error;
    }
  }

  // Security Scans
  /**
   * List security scans
   * GET /rest/api/1.0/security/scans
   */
  async listSecurityScans(params?: SecurityScanQueryParams): Promise<SecurityScanListResponse> {
    this.logger.info('Listing security scans', { params });

    try {
      const response = await this.apiClient.get<SecurityScanListResponse>('/security/scans', {
        params,
      });
      this.logger.info('Successfully listed security scans', {
        count: response.data.values.length,
        total: response.data.size,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list security scans', { params, error });
      throw error;
    }
  }

  /**
   * Get security scan by ID
   * GET /rest/api/1.0/security/scans/{scanId}
   */
  async getSecurityScan(scanId: string): Promise<SecurityScanResponse> {
    this.logger.info('Getting security scan', { scanId });

    try {
      const response = await this.apiClient.get<SecurityScanResponse>(`/security/scans/${scanId}`);
      this.logger.info('Successfully retrieved security scan', {
        scanId,
        type: response.data.type,
        status: response.data.status,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get security scan', { scanId, error });
      throw error;
    }
  }

  /**
   * Create security scan
   * POST /rest/api/1.0/security/scans
   */
  async createSecurityScan(request: SecurityScanCreateRequest): Promise<SecurityScanResponse> {
    this.logger.info('Creating security scan', { type: request.type, target: request.target });

    try {
      const response = await this.apiClient.post<SecurityScanResponse>('/security/scans', request);
      this.logger.info('Successfully created security scan', {
        id: response.data.id,
        type: response.data.type,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create security scan', { request, error });
      throw error;
    }
  }

  /**
   * Start security scan
   * POST /rest/api/1.0/security/scans/{scanId}/start
   */
  async startSecurityScan(scanId: string): Promise<SecurityScanResponse> {
    this.logger.info('Starting security scan', { scanId });

    try {
      const response = await this.apiClient.post<SecurityScanResponse>(
        `/security/scans/${scanId}/start`
      );
      this.logger.info('Successfully started security scan', { scanId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to start security scan', { scanId, error });
      throw error;
    }
  }

  /**
   * Stop security scan
   * POST /rest/api/1.0/security/scans/{scanId}/stop
   */
  async stopSecurityScan(scanId: string): Promise<SecurityScanResponse> {
    this.logger.info('Stopping security scan', { scanId });

    try {
      const response = await this.apiClient.post<SecurityScanResponse>(
        `/security/scans/${scanId}/stop`
      );
      this.logger.info('Successfully stopped security scan', { scanId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to stop security scan', { scanId, error });
      throw error;
    }
  }

  /**
   * Cancel security scan
   * POST /rest/api/1.0/security/scans/{scanId}/cancel
   */
  async cancelSecurityScan(scanId: string): Promise<SecurityScanResponse> {
    this.logger.info('Cancelling security scan', { scanId });

    try {
      const response = await this.apiClient.post<SecurityScanResponse>(
        `/security/scans/${scanId}/cancel`
      );
      this.logger.info('Successfully cancelled security scan', { scanId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to cancel security scan', { scanId, error });
      throw error;
    }
  }

  // Security Configuration
  /**
   * Get security configuration
   * GET /rest/api/1.0/security/configuration
   */
  async getSecurityConfiguration(): Promise<SecurityConfigurationResponse> {
    this.logger.info('Getting security configuration');

    try {
      const response =
        await this.apiClient.get<SecurityConfigurationResponse>('/security/configuration');
      this.logger.info('Successfully retrieved security configuration');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get security configuration', { error });
      throw error;
    }
  }

  /**
   * Update security configuration
   * PUT /rest/api/1.0/security/configuration
   */
  async updateSecurityConfiguration(
    configuration: SecurityConfig
  ): Promise<SecurityConfigurationResponse> {
    this.logger.info('Updating security configuration', { configuration });

    try {
      const response = await this.apiClient.put<SecurityConfigurationResponse>(
        '/security/configuration',
        configuration
      );
      this.logger.info('Successfully updated security configuration');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update security configuration', { configuration, error });
      throw error;
    }
  }

  // Security Metrics
  /**
   * Get security metrics
   * GET /rest/api/1.0/security/metrics
   */
  async getSecurityMetrics(): Promise<SecurityMetricsResponse> {
    this.logger.info('Getting security metrics');

    try {
      const response = await this.apiClient.get<SecurityMetricsResponse>('/security/metrics');
      this.logger.info('Successfully retrieved security metrics', {
        totalViolations: response.data.totalViolations,
        period: response.data.period,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get security metrics', { error });
      throw error;
    }
  }

  /**
   * Get security metrics for time range
   * GET /rest/api/1.0/security/metrics/range
   */
  async getSecurityMetricsForRange(
    fromTimestamp: number,
    toTimestamp: number
  ): Promise<SecurityMetricsResponse> {
    this.logger.info('Getting security metrics for range', { fromTimestamp, toTimestamp });

    try {
      const response = await this.apiClient.get<SecurityMetricsResponse>(
        '/security/metrics/range',
        {
          params: { from: fromTimestamp, to: toTimestamp },
        }
      );
      this.logger.info('Successfully retrieved security metrics for range', {
        fromTimestamp,
        toTimestamp,
        totalViolations: response.data.totalViolations,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get security metrics for range', {
        fromTimestamp,
        toTimestamp,
        error,
      });
      throw error;
    }
  }
}
