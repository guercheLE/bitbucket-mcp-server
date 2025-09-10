/**
 * Permission Management Service for Bitbucket Data Center REST API
 * Based on official documentation: https://developer.atlassian.com/server/bitbucket/rest/v906/intro/
 */

import {
  Permission,
  PermissionRequest,
  PermissionListResponse,
  PermissionSummary,
  PermissionSummaryListResponse,
  PermissionAuditLogEntry,
  PermissionAuditLogListResponse,
  PermissionQueryParams,
  PermissionBulkRequest,
  PermissionBulkResponse,
  PermissionTemplate,
  PermissionTemplateRequest,
  PermissionTemplateListResponse,
} from './types/permission-management.types.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';

export class PermissionManagementService {
  private readonly apiClient: ApiClient;
  private readonly logger: Logger;

  constructor(apiClient: ApiClient, logger: Logger) {
    this.apiClient = apiClient;
    this.logger = logger;
  }

  /**
   * List permissions
   * GET /rest/api/1.0/admin/permissions
   */
  async listPermissions(params?: PermissionQueryParams): Promise<PermissionListResponse> {
    this.logger.info('Listing permissions', { params });

    try {
      const response = await this.apiClient.get<PermissionListResponse>('/admin/permissions', {
        params,
      });
      this.logger.info('Successfully listed permissions', { count: response.data.values.length });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list permissions', { params, error });
      throw error;
    }
  }

  /**
   * Grant permission
   * POST /rest/api/1.0/admin/permissions
   */
  async grantPermission(request: PermissionRequest): Promise<Permission> {
    this.logger.info('Granting permission', { request });

    try {
      const response = await this.apiClient.post<Permission>('/admin/permissions', request);
      this.logger.info('Successfully granted permission', { id: response.data.id });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to grant permission', { request, error });
      throw error;
    }
  }

  /**
   * Get permission by ID
   * GET /rest/api/1.0/admin/permissions/{permissionId}
   */
  async getPermission(permissionId: number): Promise<Permission> {
    this.logger.info('Getting permission', { permissionId });

    try {
      const response = await this.apiClient.get<Permission>(`/admin/permissions/${permissionId}`);
      this.logger.info('Successfully retrieved permission', { permissionId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get permission', { permissionId, error });
      throw error;
    }
  }

  /**
   * Revoke permission
   * DELETE /rest/api/1.0/admin/permissions/{permissionId}
   */
  async revokePermission(permissionId: number): Promise<void> {
    this.logger.info('Revoking permission', { permissionId });

    try {
      await this.apiClient.delete(`/admin/permissions/${permissionId}`);
      this.logger.info('Successfully revoked permission', { permissionId });
    } catch (error) {
      this.logger.error('Failed to revoke permission', { permissionId, error });
      throw error;
    }
  }

  /**
   * List permission summaries
   * GET /rest/api/1.0/admin/permissions/summary
   */
  async listPermissionSummaries(
    params?: PermissionQueryParams
  ): Promise<PermissionSummaryListResponse> {
    this.logger.info('Listing permission summaries', { params });

    try {
      const response = await this.apiClient.get<PermissionSummaryListResponse>(
        '/admin/permissions/summary',
        { params }
      );
      this.logger.info('Successfully listed permission summaries', {
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list permission summaries', { params, error });
      throw error;
    }
  }

  /**
   * Get permission audit log
   * GET /rest/api/1.0/admin/permissions/audit
   */
  async getPermissionAuditLog(
    params?: PermissionQueryParams
  ): Promise<PermissionAuditLogListResponse> {
    this.logger.info('Getting permission audit log', { params });

    try {
      const response = await this.apiClient.get<PermissionAuditLogListResponse>(
        '/admin/permissions/audit',
        { params }
      );
      this.logger.info('Successfully retrieved permission audit log', {
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get permission audit log', { params, error });
      throw error;
    }
  }

  /**
   * Bulk grant permissions
   * POST /rest/api/1.0/admin/permissions/bulk
   */
  async bulkGrantPermissions(request: PermissionBulkRequest): Promise<PermissionBulkResponse> {
    this.logger.info('Bulk granting permissions', { request });

    try {
      const response = await this.apiClient.post<PermissionBulkResponse>(
        '/admin/permissions/bulk',
        request
      );
      this.logger.info('Successfully bulk granted permissions', {
        processed: response.data.processed,
        failed: response.data.failed,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to bulk grant permissions', { request, error });
      throw error;
    }
  }

  /**
   * List permission templates
   * GET /rest/api/1.0/admin/permissions/templates
   */
  async listPermissionTemplates(): Promise<PermissionTemplateListResponse> {
    this.logger.info('Listing permission templates');

    try {
      const response = await this.apiClient.get<PermissionTemplateListResponse>(
        '/admin/permissions/templates'
      );
      this.logger.info('Successfully listed permission templates', {
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list permission templates', { error });
      throw error;
    }
  }

  /**
   * Create permission template
   * POST /rest/api/1.0/admin/permissions/templates
   */
  async createPermissionTemplate(request: PermissionTemplateRequest): Promise<PermissionTemplate> {
    this.logger.info('Creating permission template', { request });

    try {
      const response = await this.apiClient.post<PermissionTemplate>(
        '/admin/permissions/templates',
        request
      );
      this.logger.info('Successfully created permission template', { id: response.data.id });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create permission template', { request, error });
      throw error;
    }
  }

  /**
   * Get permission template by ID
   * GET /rest/api/1.0/admin/permissions/templates/{templateId}
   */
  async getPermissionTemplate(templateId: number): Promise<PermissionTemplate> {
    this.logger.info('Getting permission template', { templateId });

    try {
      const response = await this.apiClient.get<PermissionTemplate>(
        `/admin/permissions/templates/${templateId}`
      );
      this.logger.info('Successfully retrieved permission template', { templateId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get permission template', { templateId, error });
      throw error;
    }
  }

  /**
   * Update permission template
   * PUT /rest/api/1.0/admin/permissions/templates/{templateId}
   */
  async updatePermissionTemplate(
    templateId: number,
    request: PermissionTemplateRequest
  ): Promise<PermissionTemplate> {
    this.logger.info('Updating permission template', { templateId, request });

    try {
      const response = await this.apiClient.put<PermissionTemplate>(
        `/admin/permissions/templates/${templateId}`,
        request
      );
      this.logger.info('Successfully updated permission template', { templateId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update permission template', { templateId, request, error });
      throw error;
    }
  }

  /**
   * Delete permission template
   * DELETE /rest/api/1.0/admin/permissions/templates/{templateId}
   */
  async deletePermissionTemplate(templateId: number): Promise<void> {
    this.logger.info('Deleting permission template', { templateId });

    try {
      await this.apiClient.delete(`/admin/permissions/templates/${templateId}`);
      this.logger.info('Successfully deleted permission template', { templateId });
    } catch (error) {
      this.logger.error('Failed to delete permission template', { templateId, error });
      throw error;
    }
  }

  /**
   * Apply permission template
   * POST /rest/api/1.0/admin/permissions/templates/{templateId}/apply
   */
  async applyPermissionTemplate(
    templateId: number,
    context?: { project?: string; repository?: string }
  ): Promise<void> {
    this.logger.info('Applying permission template', { templateId, context });

    try {
      await this.apiClient.post(`/admin/permissions/templates/${templateId}/apply`, context);
      this.logger.info('Successfully applied permission template', { templateId });
    } catch (error) {
      this.logger.error('Failed to apply permission template', { templateId, context, error });
      throw error;
    }
  }

  /**
   * Get project permissions
   * GET /rest/api/1.0/projects/{projectKey}/permissions
   */
  async getProjectPermissions(
    projectKey: string,
    params?: PermissionQueryParams
  ): Promise<PermissionListResponse> {
    this.logger.info('Getting project permissions', { projectKey, params });

    try {
      const response = await this.apiClient.get<PermissionListResponse>(
        `/projects/${projectKey}/permissions`,
        { params }
      );
      this.logger.info('Successfully retrieved project permissions', {
        projectKey,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get project permissions', { projectKey, params, error });
      throw error;
    }
  }

  /**
   * Get repository permissions
   * GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/permissions
   */
  async getRepositoryPermissions(
    projectKey: string,
    repositorySlug: string,
    params?: PermissionQueryParams
  ): Promise<PermissionListResponse> {
    this.logger.info('Getting repository permissions', { projectKey, repositorySlug, params });

    try {
      const response = await this.apiClient.get<PermissionListResponse>(
        `/projects/${projectKey}/repos/${repositorySlug}/permissions`,
        { params }
      );
      this.logger.info('Successfully retrieved repository permissions', {
        projectKey,
        repositorySlug,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get repository permissions', {
        projectKey,
        repositorySlug,
        params,
        error,
      });
      throw error;
    }
  }
}
