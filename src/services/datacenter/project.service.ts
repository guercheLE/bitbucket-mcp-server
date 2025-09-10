/**
 * Project Service for Bitbucket Data Center REST API
 * Based on official documentation: https://developer.atlassian.com/server/bitbucket/rest/v906/intro/
 */

import {
  ProjectAvatar,
  ProjectAvatarUploadRequest,
  ProjectCreateRequest,
  ProjectHook,
  ProjectHookRequest,
  ProjectHookUpdateRequest,
  ProjectListResponse,
  ProjectPermissionRequest,
  ProjectPermissions,
  ProjectQueryParams,
  ProjectResponse,
  ProjectSettings,
  ProjectSettingsUpdateRequest,
  ProjectUpdateRequest,
} from './types/project.types.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';

export class ProjectService {
  private readonly apiClient: ApiClient;
  private readonly logger: Logger;

  constructor(apiClient: ApiClient, logger: Logger) {
    this.apiClient = apiClient;
    this.logger = logger;
  }

  /**
   * Create a new project
   * POST /rest/api/1.0/projects
   */
  async createProject(request: ProjectCreateRequest): Promise<ProjectResponse> {
    this.logger.info('Creating project', { key: request.key, name: request.name });

    try {
      const response = await this.apiClient.post<ProjectResponse>('/projects', request);
      this.logger.info('Successfully created project', {
        key: response.data.key,
        id: response.data.id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create project', { request, error });
      throw error;
    }
  }

  /**
   * Get project by key
   * GET /rest/api/1.0/projects/{projectKey}
   */
  async getProject(projectKey: string): Promise<ProjectResponse> {
    this.logger.info('Getting project', { projectKey });

    try {
      const response = await this.apiClient.get<ProjectResponse>(`/projects/${projectKey}`);
      this.logger.info('Successfully retrieved project', { projectKey, id: response.data.id });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get project', { projectKey, error });
      throw error;
    }
  }

  /**
   * Update project
   * PUT /rest/api/1.0/projects/{projectKey}
   */
  async updateProject(projectKey: string, request: ProjectUpdateRequest): Promise<ProjectResponse> {
    this.logger.info('Updating project', { projectKey, request });

    try {
      const response = await this.apiClient.put<ProjectResponse>(
        `/projects/${projectKey}`,
        request
      );
      this.logger.info('Successfully updated project', { projectKey });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update project', { projectKey, request, error });
      throw error;
    }
  }

  /**
   * Delete project
   * DELETE /rest/api/1.0/projects/{projectKey}
   */
  async deleteProject(projectKey: string): Promise<void> {
    this.logger.info('Deleting project', { projectKey });

    try {
      await this.apiClient.delete(`/projects/${projectKey}`);
      this.logger.info('Successfully deleted project', { projectKey });
    } catch (error) {
      this.logger.error('Failed to delete project', { projectKey, error });
      throw error;
    }
  }

  /**
   * List projects
   * GET /rest/api/1.0/projects
   */
  async listProjects(params?: ProjectQueryParams): Promise<ProjectListResponse> {
    this.logger.info('Listing projects', { params });

    try {
      const response = await this.apiClient.get<ProjectListResponse>('/projects', { params });
      this.logger.info('Successfully listed projects', { count: response.data.values.length });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list projects', { params, error });
      throw error;
    }
  }

  /**
   * Get project permissions
   * GET /rest/api/1.0/projects/{projectKey}/permissions
   */
  async getProjectPermissions(projectKey: string): Promise<ProjectPermissions> {
    this.logger.info('Getting project permissions', { projectKey });

    try {
      const response = await this.apiClient.get<ProjectPermissions>(
        `/projects/${projectKey}/permissions`
      );
      this.logger.info('Successfully retrieved project permissions', { projectKey });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get project permissions', { projectKey, error });
      throw error;
    }
  }

  /**
   * Add project permission
   * POST /rest/api/1.0/projects/{projectKey}/permissions
   */
  async addProjectPermission(projectKey: string, request: ProjectPermissionRequest): Promise<void> {
    this.logger.info('Adding project permission', { projectKey, request });

    try {
      await this.apiClient.post(`/projects/${projectKey}/permissions`, request);
      this.logger.info('Successfully added project permission', { projectKey });
    } catch (error) {
      this.logger.error('Failed to add project permission', { projectKey, request, error });
      throw error;
    }
  }

  /**
   * Remove project permission
   * DELETE /rest/api/1.0/projects/{projectKey}/permissions
   */
  async removeProjectPermission(
    projectKey: string,
    request: ProjectPermissionRequest
  ): Promise<void> {
    this.logger.info('Removing project permission', { projectKey, request });

    try {
      await this.apiClient.delete(`/projects/${projectKey}/permissions`, { data: request });
      this.logger.info('Successfully removed project permission', { projectKey });
    } catch (error) {
      this.logger.error('Failed to remove project permission', { projectKey, request, error });
      throw error;
    }
  }

  /**
   * Get project avatar
   * GET /rest/api/1.0/projects/{projectKey}/avatar
   */
  async getProjectAvatar(projectKey: string): Promise<ProjectAvatar> {
    this.logger.info('Getting project avatar', { projectKey });

    try {
      const response = await this.apiClient.get<ProjectAvatar>(`/projects/${projectKey}/avatar`);
      this.logger.info('Successfully retrieved project avatar', { projectKey });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get project avatar', { projectKey, error });
      throw error;
    }
  }

  /**
   * Upload project avatar
   * POST /rest/api/1.0/projects/{projectKey}/avatar
   */
  async uploadProjectAvatar(
    projectKey: string,
    request: ProjectAvatarUploadRequest
  ): Promise<ProjectAvatar> {
    this.logger.info('Uploading project avatar', { projectKey });

    try {
      const response = await this.apiClient.post<ProjectAvatar>(
        `/projects/${projectKey}/avatar`,
        request
      );
      this.logger.info('Successfully uploaded project avatar', { projectKey });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to upload project avatar', { projectKey, error });
      throw error;
    }
  }

  /**
   * Delete project avatar
   * DELETE /rest/api/1.0/projects/{projectKey}/avatar
   */
  async deleteProjectAvatar(projectKey: string): Promise<void> {
    this.logger.info('Deleting project avatar', { projectKey });

    try {
      await this.apiClient.delete(`/projects/${projectKey}/avatar`);
      this.logger.info('Successfully deleted project avatar', { projectKey });
    } catch (error) {
      this.logger.error('Failed to delete project avatar', { projectKey, error });
      throw error;
    }
  }

  /**
   * Get project hooks
   * GET /rest/api/1.0/projects/{projectKey}/hooks
   */
  async getProjectHooks(projectKey: string): Promise<ProjectHook[]> {
    this.logger.info('Getting project hooks', { projectKey });

    try {
      const response = await this.apiClient.get<{ hooks: ProjectHook[] }>(
        `/projects/${projectKey}/hooks`
      );
      this.logger.info('Successfully retrieved project hooks', {
        projectKey,
        count: response.data.hooks.length,
      });
      return response.data.hooks;
    } catch (error) {
      this.logger.error('Failed to get project hooks', { projectKey, error });
      throw error;
    }
  }

  /**
   * Create project hook
   * POST /rest/api/1.0/projects/{projectKey}/hooks
   */
  async createProjectHook(projectKey: string, request: ProjectHookRequest): Promise<ProjectHook> {
    this.logger.info('Creating project hook', { projectKey, request });

    try {
      const response = await this.apiClient.post<ProjectHook>(
        `/projects/${projectKey}/hooks`,
        request
      );
      this.logger.info('Successfully created project hook', {
        projectKey,
        hookId: response.data.id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create project hook', { projectKey, request, error });
      throw error;
    }
  }

  /**
   * Get project hook
   * GET /rest/api/1.0/projects/{projectKey}/hooks/{hookId}
   */
  async getProjectHook(projectKey: string, hookId: number): Promise<ProjectHook> {
    this.logger.info('Getting project hook', { projectKey, hookId });

    try {
      const response = await this.apiClient.get<ProjectHook>(
        `/projects/${projectKey}/hooks/${hookId}`
      );
      this.logger.info('Successfully retrieved project hook', { projectKey, hookId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get project hook', { projectKey, hookId, error });
      throw error;
    }
  }

  /**
   * Update project hook
   * PUT /rest/api/1.0/projects/{projectKey}/hooks/{hookId}
   */
  async updateProjectHook(
    projectKey: string,
    hookId: number,
    request: ProjectHookUpdateRequest
  ): Promise<ProjectHook> {
    this.logger.info('Updating project hook', { projectKey, hookId, request });

    try {
      const response = await this.apiClient.put<ProjectHook>(
        `/projects/${projectKey}/hooks/${hookId}`,
        request
      );
      this.logger.info('Successfully updated project hook', { projectKey, hookId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update project hook', { projectKey, hookId, request, error });
      throw error;
    }
  }

  /**
   * Delete project hook
   * DELETE /rest/api/1.0/projects/{projectKey}/hooks/{hookId}
   */
  async deleteProjectHook(projectKey: string, hookId: number): Promise<void> {
    this.logger.info('Deleting project hook', { projectKey, hookId });

    try {
      await this.apiClient.delete(`/projects/${projectKey}/hooks/${hookId}`);
      this.logger.info('Successfully deleted project hook', { projectKey, hookId });
    } catch (error) {
      this.logger.error('Failed to delete project hook', { projectKey, hookId, error });
      throw error;
    }
  }

  /**
   * Get project settings
   * GET /rest/api/1.0/projects/{projectKey}/settings
   */
  async getProjectSettings(projectKey: string): Promise<ProjectSettings> {
    this.logger.info('Getting project settings', { projectKey });

    try {
      const response = await this.apiClient.get<ProjectSettings>(
        `/projects/${projectKey}/settings`
      );
      this.logger.info('Successfully retrieved project settings', { projectKey });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get project settings', { projectKey, error });
      throw error;
    }
  }

  /**
   * Update project settings
   * PUT /rest/api/1.0/projects/{projectKey}/settings
   */
  async updateProjectSettings(
    projectKey: string,
    request: ProjectSettingsUpdateRequest
  ): Promise<ProjectSettings> {
    this.logger.info('Updating project settings', { projectKey, request });

    try {
      const response = await this.apiClient.put<ProjectSettings>(
        `/projects/${projectKey}/settings`,
        request
      );
      this.logger.info('Successfully updated project settings', { projectKey });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update project settings', { projectKey, request, error });
      throw error;
    }
  }
}
