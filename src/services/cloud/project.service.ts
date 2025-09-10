/**
 * Project Service for Bitbucket Cloud REST API
 * Handles all project-related operations
 * Based on: https://developer.atlassian.com/cloud/bitbucket/rest/api-group-projects/
 */

import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';
import { PagedResponse, PaginationParams, ErrorResponse } from './types/base.types.js';
import {
  Project,
  DefaultReviewer,
  ProjectPermission,
  CreateProjectRequest,
  UpdateProjectRequest,
  CreateProjectParams,
  GetProjectParams,
  UpdateProjectParams,
  DeleteProjectParams,
  ListDefaultReviewersParams,
  AddDefaultReviewerParams,
  RemoveDefaultReviewerParams,
  ListGroupPermissionsParams,
  GetGroupPermissionParams,
  UpdateGroupPermissionParams,
  DeleteGroupPermissionParams,
  ListUserPermissionsParams,
  GetUserPermissionParams,
  UpdateUserPermissionParams,
  DeleteUserPermissionParams,
} from './types/project.types.js';

export class ProjectService {
  private apiClient: ApiClient;
  private logger: Logger;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.logger = Logger.forContext('ProjectService');
  }

  /**
   * Create a project in a workspace
   */
  async createProject(params: CreateProjectParams): Promise<Project> {
    this.logger.info('Creating project', { params });

    try {
      const response = await this.apiClient.post<Project>(
        `/workspaces/${params.workspace}/projects`,
        params.project
      );

      this.logger.info('Successfully created project', {
        workspace: params.workspace,
        project_key: response.data.key,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create project', { params, error });
      throw error;
    }
  }

  /**
   * Get a project for a workspace
   */
  async getProject(params: GetProjectParams): Promise<Project> {
    this.logger.info('Getting project', { params });

    try {
      const response = await this.apiClient.get<Project>(
        `/workspaces/${params.workspace}/projects/${params.project_key}`
      );

      this.logger.info('Successfully retrieved project', {
        workspace: params.workspace,
        project_key: params.project_key,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get project', { params, error });
      throw error;
    }
  }

  /**
   * Update a project for a workspace
   */
  async updateProject(params: UpdateProjectParams): Promise<Project> {
    this.logger.info('Updating project', { params });

    try {
      const response = await this.apiClient.put<Project>(
        `/workspaces/${params.workspace}/projects/${params.project_key}`,
        params.project
      );

      this.logger.info('Successfully updated project', {
        workspace: params.workspace,
        project_key: params.project_key,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update project', { params, error });
      throw error;
    }
  }

  /**
   * Delete a project for a workspace
   */
  async deleteProject(params: DeleteProjectParams): Promise<void> {
    this.logger.info('Deleting project', { params });

    try {
      await this.apiClient.delete(`/workspaces/${params.workspace}/projects/${params.project_key}`);

      this.logger.info('Successfully deleted project', {
        workspace: params.workspace,
        project_key: params.project_key,
      });
    } catch (error) {
      this.logger.error('Failed to delete project', { params, error });
      throw error;
    }
  }

  /**
   * List the default reviewers in a project
   */
  async listDefaultReviewers(
    params: ListDefaultReviewersParams
  ): Promise<PagedResponse<DefaultReviewer>> {
    this.logger.info('Listing default reviewers', { params });

    try {
      const response = await this.apiClient.get<PagedResponse<DefaultReviewer>>(
        `/workspaces/${params.workspace}/projects/${params.project_key}/default-reviewers`,
        { params: { page: params.page, pagelen: params.pagelen } }
      );

      this.logger.info('Successfully listed default reviewers', {
        workspace: params.workspace,
        project_key: params.project_key,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list default reviewers', { params, error });
      throw error;
    }
  }

  /**
   * Get a default reviewer
   */
  async getDefaultReviewer(params: AddDefaultReviewerParams): Promise<DefaultReviewer> {
    this.logger.info('Getting default reviewer', { params });

    try {
      const response = await this.apiClient.get<DefaultReviewer>(
        `/workspaces/${params.workspace}/projects/${params.project_key}/default-reviewers/${params.selected_user}`
      );

      this.logger.info('Successfully retrieved default reviewer', {
        workspace: params.workspace,
        project_key: params.project_key,
        selected_user: params.selected_user,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get default reviewer', { params, error });
      throw error;
    }
  }

  /**
   * Add the specific user as a default reviewer for the project
   */
  async addDefaultReviewer(params: AddDefaultReviewerParams): Promise<DefaultReviewer> {
    this.logger.info('Adding default reviewer', { params });

    try {
      const response = await this.apiClient.put<DefaultReviewer>(
        `/workspaces/${params.workspace}/projects/${params.project_key}/default-reviewers/${params.selected_user}`
      );

      this.logger.info('Successfully added default reviewer', {
        workspace: params.workspace,
        project_key: params.project_key,
        selected_user: params.selected_user,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to add default reviewer', { params, error });
      throw error;
    }
  }

  /**
   * Remove the specific user from the project's default reviewers
   */
  async removeDefaultReviewer(params: RemoveDefaultReviewerParams): Promise<void> {
    this.logger.info('Removing default reviewer', { params });

    try {
      await this.apiClient.delete(
        `/workspaces/${params.workspace}/projects/${params.project_key}/default-reviewers/${params.selected_user}`
      );

      this.logger.info('Successfully removed default reviewer', {
        workspace: params.workspace,
        project_key: params.project_key,
        selected_user: params.selected_user,
      });
    } catch (error) {
      this.logger.error('Failed to remove default reviewer', { params, error });
      throw error;
    }
  }

  /**
   * List explicit group permissions for a project
   */
  async listGroupPermissions(
    params: ListGroupPermissionsParams
  ): Promise<PagedResponse<ProjectPermission>> {
    this.logger.info('Listing group permissions', { params });

    try {
      const response = await this.apiClient.get<PagedResponse<ProjectPermission>>(
        `/workspaces/${params.workspace}/projects/${params.project_key}/permissions-config/groups`,
        { params: { page: params.page, pagelen: params.pagelen } }
      );

      this.logger.info('Successfully listed group permissions', {
        workspace: params.workspace,
        project_key: params.project_key,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list group permissions', { params, error });
      throw error;
    }
  }

  /**
   * Get an explicit group permission for a project
   */
  async getGroupPermission(params: GetGroupPermissionParams): Promise<ProjectPermission> {
    this.logger.info('Getting group permission', { params });

    try {
      const response = await this.apiClient.get<ProjectPermission>(
        `/workspaces/${params.workspace}/projects/${params.project_key}/permissions-config/groups/${params.group_slug}`
      );

      this.logger.info('Successfully retrieved group permission', {
        workspace: params.workspace,
        project_key: params.project_key,
        group_slug: params.group_slug,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get group permission', { params, error });
      throw error;
    }
  }

  /**
   * Update an explicit group permission for a project
   */
  async updateGroupPermission(params: UpdateGroupPermissionParams): Promise<ProjectPermission> {
    this.logger.info('Updating group permission', { params });

    try {
      const response = await this.apiClient.put<ProjectPermission>(
        `/workspaces/${params.workspace}/projects/${params.project_key}/permissions-config/groups/${params.group_slug}`,
        { permission: params.permission }
      );

      this.logger.info('Successfully updated group permission', {
        workspace: params.workspace,
        project_key: params.project_key,
        group_slug: params.group_slug,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update group permission', { params, error });
      throw error;
    }
  }

  /**
   * Delete an explicit group permission for a project
   */
  async deleteGroupPermission(params: DeleteGroupPermissionParams): Promise<void> {
    this.logger.info('Deleting group permission', { params });

    try {
      await this.apiClient.delete(
        `/workspaces/${params.workspace}/projects/${params.project_key}/permissions-config/groups/${params.group_slug}`
      );

      this.logger.info('Successfully deleted group permission', {
        workspace: params.workspace,
        project_key: params.project_key,
        group_slug: params.group_slug,
      });
    } catch (error) {
      this.logger.error('Failed to delete group permission', { params, error });
      throw error;
    }
  }

  /**
   * List explicit user permissions for a project
   */
  async listUserPermissions(
    params: ListUserPermissionsParams
  ): Promise<PagedResponse<ProjectPermission>> {
    this.logger.info('Listing user permissions', { params });

    try {
      const response = await this.apiClient.get<PagedResponse<ProjectPermission>>(
        `/workspaces/${params.workspace}/projects/${params.project_key}/permissions-config/users`,
        { params: { page: params.page, pagelen: params.pagelen } }
      );

      this.logger.info('Successfully listed user permissions', {
        workspace: params.workspace,
        project_key: params.project_key,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list user permissions', { params, error });
      throw error;
    }
  }

  /**
   * Get an explicit user permission for a project
   */
  async getUserPermission(params: GetUserPermissionParams): Promise<ProjectPermission> {
    this.logger.info('Getting user permission', { params });

    try {
      const response = await this.apiClient.get<ProjectPermission>(
        `/workspaces/${params.workspace}/projects/${params.project_key}/permissions-config/users/${params.selected_user_id}`
      );

      this.logger.info('Successfully retrieved user permission', {
        workspace: params.workspace,
        project_key: params.project_key,
        selected_user_id: params.selected_user_id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get user permission', { params, error });
      throw error;
    }
  }

  /**
   * Update an explicit user permission for a project
   */
  async updateUserPermission(params: UpdateUserPermissionParams): Promise<ProjectPermission> {
    this.logger.info('Updating user permission', { params });

    try {
      const response = await this.apiClient.put<ProjectPermission>(
        `/workspaces/${params.workspace}/projects/${params.project_key}/permissions-config/users/${params.selected_user_id}`,
        { permission: params.permission }
      );

      this.logger.info('Successfully updated user permission', {
        workspace: params.workspace,
        project_key: params.project_key,
        selected_user_id: params.selected_user_id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update user permission', { params, error });
      throw error;
    }
  }

  /**
   * Delete an explicit user permission for a project
   */
  async deleteUserPermission(params: DeleteUserPermissionParams): Promise<void> {
    this.logger.info('Deleting user permission', { params });

    try {
      await this.apiClient.delete(
        `/workspaces/${params.workspace}/projects/${params.project_key}/permissions-config/users/${params.selected_user_id}`
      );

      this.logger.info('Successfully deleted user permission', {
        workspace: params.workspace,
        project_key: params.project_key,
        selected_user_id: params.selected_user_id,
      });
    } catch (error) {
      this.logger.error('Failed to delete user permission', { params, error });
      throw error;
    }
  }
}
