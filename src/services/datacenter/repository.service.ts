/**
 * Repository Service for Bitbucket Data Center REST API
 * Based on official documentation: https://developer.atlassian.com/server/bitbucket/rest/v906/intro/
 */

import {
  RepositoryBranch,
  RepositoryBranchCreateRequest,
  RepositoryBranchListResponse,
  RepositoryCreateRequest,
  RepositoryFork,
  RepositoryForkCreateRequest,
  RepositoryForkListResponse,
  RepositoryHook,
  RepositoryHookRequest,
  RepositoryHookUpdateRequest,
  RepositoryListResponse,
  RepositoryPermissionRequest,
  RepositoryPermissions,
  RepositoryQueryParams,
  RepositoryResponse,
  RepositorySettings,
  RepositorySettingsUpdateRequest,
  RepositoryTag,
  RepositoryTagCreateRequest,
  RepositoryTagListResponse,
  RepositoryUpdateRequest,
} from './types/repository.types.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';

export class RepositoryService {
  private readonly apiClient: ApiClient;
  private readonly logger: Logger;

  constructor(apiClient: ApiClient, logger: Logger) {
    this.apiClient = apiClient;
    this.logger = logger;
  }

  /**
   * Create a new repository
   * POST /rest/api/1.0/projects/{projectKey}/repos
   */
  async createRepository(
    projectKey: string,
    request: RepositoryCreateRequest
  ): Promise<RepositoryResponse> {
    this.logger.info('Creating repository', { projectKey, name: request.name });

    try {
      const response = await this.apiClient.post<RepositoryResponse>(
        `/projects/${projectKey}/repos`,
        request
      );
      this.logger.info('Successfully created repository', {
        projectKey,
        slug: response.data.slug,
        id: response.data.id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create repository', { projectKey, request, error });
      throw error;
    }
  }

  /**
   * Get repository
   * GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}
   */
  async getRepository(projectKey: string, repositorySlug: string): Promise<RepositoryResponse> {
    this.logger.info('Getting repository', { projectKey, repositorySlug });

    try {
      const response = await this.apiClient.get<RepositoryResponse>(
        `/projects/${projectKey}/repos/${repositorySlug}`
      );
      this.logger.info('Successfully retrieved repository', {
        projectKey,
        repositorySlug,
        id: response.data.id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get repository', { projectKey, repositorySlug, error });
      throw error;
    }
  }

  /**
   * Update repository
   * PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}
   */
  async updateRepository(
    projectKey: string,
    repositorySlug: string,
    request: RepositoryUpdateRequest
  ): Promise<RepositoryResponse> {
    this.logger.info('Updating repository', { projectKey, repositorySlug, request });

    try {
      const response = await this.apiClient.put<RepositoryResponse>(
        `/projects/${projectKey}/repos/${repositorySlug}`,
        request
      );
      this.logger.info('Successfully updated repository', { projectKey, repositorySlug });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update repository', {
        projectKey,
        repositorySlug,
        request,
        error,
      });
      throw error;
    }
  }

  /**
   * Delete repository
   * DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}
   */
  async deleteRepository(projectKey: string, repositorySlug: string): Promise<void> {
    this.logger.info('Deleting repository', { projectKey, repositorySlug });

    try {
      await this.apiClient.delete(`/projects/${projectKey}/repos/${repositorySlug}`);
      this.logger.info('Successfully deleted repository', { projectKey, repositorySlug });
    } catch (error) {
      this.logger.error('Failed to delete repository', { projectKey, repositorySlug, error });
      throw error;
    }
  }

  /**
   * List repositories
   * GET /rest/api/1.0/projects/{projectKey}/repos
   */
  async listRepositories(
    projectKey: string,
    params?: RepositoryQueryParams
  ): Promise<RepositoryListResponse> {
    this.logger.info('Listing repositories', { projectKey, params });

    try {
      const response = await this.apiClient.get<RepositoryListResponse>(
        `/projects/${projectKey}/repos`,
        { params }
      );
      this.logger.info('Successfully listed repositories', {
        projectKey,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list repositories', { projectKey, params, error });
      throw error;
    }
  }

  /**
   * Get repository permissions
   * GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/permissions
   */
  async getRepositoryPermissions(
    projectKey: string,
    repositorySlug: string
  ): Promise<RepositoryPermissions> {
    this.logger.info('Getting repository permissions', { projectKey, repositorySlug });

    try {
      const response = await this.apiClient.get<RepositoryPermissions>(
        `/projects/${projectKey}/repos/${repositorySlug}/permissions`
      );
      this.logger.info('Successfully retrieved repository permissions', {
        projectKey,
        repositorySlug,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get repository permissions', {
        projectKey,
        repositorySlug,
        error,
      });
      throw error;
    }
  }

  /**
   * Add repository permission
   * POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/permissions
   */
  async addRepositoryPermission(
    projectKey: string,
    repositorySlug: string,
    request: RepositoryPermissionRequest
  ): Promise<void> {
    this.logger.info('Adding repository permission', { projectKey, repositorySlug, request });

    try {
      await this.apiClient.post(
        `/projects/${projectKey}/repos/${repositorySlug}/permissions`,
        request
      );
      this.logger.info('Successfully added repository permission', { projectKey, repositorySlug });
    } catch (error) {
      this.logger.error('Failed to add repository permission', {
        projectKey,
        repositorySlug,
        request,
        error,
      });
      throw error;
    }
  }

  /**
   * Remove repository permission
   * DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/permissions
   */
  async removeRepositoryPermission(
    projectKey: string,
    repositorySlug: string,
    request: RepositoryPermissionRequest
  ): Promise<void> {
    this.logger.info('Removing repository permission', { projectKey, repositorySlug, request });

    try {
      await this.apiClient.delete(`/projects/${projectKey}/repos/${repositorySlug}/permissions`, {
        data: request,
      });
      this.logger.info('Successfully removed repository permission', {
        projectKey,
        repositorySlug,
      });
    } catch (error) {
      this.logger.error('Failed to remove repository permission', {
        projectKey,
        repositorySlug,
        request,
        error,
      });
      throw error;
    }
  }

  /**
   * Get repository settings
   * GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/settings
   */
  async getRepositorySettings(
    projectKey: string,
    repositorySlug: string
  ): Promise<RepositorySettings> {
    this.logger.info('Getting repository settings', { projectKey, repositorySlug });

    try {
      const response = await this.apiClient.get<RepositorySettings>(
        `/projects/${projectKey}/repos/${repositorySlug}/settings`
      );
      this.logger.info('Successfully retrieved repository settings', {
        projectKey,
        repositorySlug,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get repository settings', { projectKey, repositorySlug, error });
      throw error;
    }
  }

  /**
   * Update repository settings
   * PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/settings
   */
  async updateRepositorySettings(
    projectKey: string,
    repositorySlug: string,
    request: RepositorySettingsUpdateRequest
  ): Promise<RepositorySettings> {
    this.logger.info('Updating repository settings', { projectKey, repositorySlug, request });

    try {
      const response = await this.apiClient.put<RepositorySettings>(
        `/projects/${projectKey}/repos/${repositorySlug}/settings`,
        request
      );
      this.logger.info('Successfully updated repository settings', { projectKey, repositorySlug });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update repository settings', {
        projectKey,
        repositorySlug,
        request,
        error,
      });
      throw error;
    }
  }

  /**
   * Get repository hooks
   * GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/hooks
   */
  async getRepositoryHooks(projectKey: string, repositorySlug: string): Promise<RepositoryHook[]> {
    this.logger.info('Getting repository hooks', { projectKey, repositorySlug });

    try {
      const response = await this.apiClient.get<{ hooks: RepositoryHook[] }>(
        `/projects/${projectKey}/repos/${repositorySlug}/hooks`
      );
      this.logger.info('Successfully retrieved repository hooks', {
        projectKey,
        repositorySlug,
        count: response.data.hooks.length,
      });
      return response.data.hooks;
    } catch (error) {
      this.logger.error('Failed to get repository hooks', { projectKey, repositorySlug, error });
      throw error;
    }
  }

  /**
   * Create repository hook
   * POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/hooks
   */
  async createRepositoryHook(
    projectKey: string,
    repositorySlug: string,
    request: RepositoryHookRequest
  ): Promise<RepositoryHook> {
    this.logger.info('Creating repository hook', { projectKey, repositorySlug, request });

    try {
      const response = await this.apiClient.post<RepositoryHook>(
        `/projects/${projectKey}/repos/${repositorySlug}/hooks`,
        request
      );
      this.logger.info('Successfully created repository hook', {
        projectKey,
        repositorySlug,
        hookId: response.data.id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create repository hook', {
        projectKey,
        repositorySlug,
        request,
        error,
      });
      throw error;
    }
  }

  /**
   * Get repository hook
   * GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/hooks/{hookId}
   */
  async getRepositoryHook(
    projectKey: string,
    repositorySlug: string,
    hookId: number
  ): Promise<RepositoryHook> {
    this.logger.info('Getting repository hook', { projectKey, repositorySlug, hookId });

    try {
      const response = await this.apiClient.get<RepositoryHook>(
        `/projects/${projectKey}/repos/${repositorySlug}/hooks/${hookId}`
      );
      this.logger.info('Successfully retrieved repository hook', {
        projectKey,
        repositorySlug,
        hookId,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get repository hook', {
        projectKey,
        repositorySlug,
        hookId,
        error,
      });
      throw error;
    }
  }

  /**
   * Update repository hook
   * PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/hooks/{hookId}
   */
  async updateRepositoryHook(
    projectKey: string,
    repositorySlug: string,
    hookId: number,
    request: RepositoryHookUpdateRequest
  ): Promise<RepositoryHook> {
    this.logger.info('Updating repository hook', { projectKey, repositorySlug, hookId, request });

    try {
      const response = await this.apiClient.put<RepositoryHook>(
        `/projects/${projectKey}/repos/${repositorySlug}/hooks/${hookId}`,
        request
      );
      this.logger.info('Successfully updated repository hook', {
        projectKey,
        repositorySlug,
        hookId,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update repository hook', {
        projectKey,
        repositorySlug,
        hookId,
        request,
        error,
      });
      throw error;
    }
  }

  /**
   * Delete repository hook
   * DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/hooks/{hookId}
   */
  async deleteRepositoryHook(
    projectKey: string,
    repositorySlug: string,
    hookId: number
  ): Promise<void> {
    this.logger.info('Deleting repository hook', { projectKey, repositorySlug, hookId });

    try {
      await this.apiClient.delete(
        `/projects/${projectKey}/repos/${repositorySlug}/hooks/${hookId}`
      );
      this.logger.info('Successfully deleted repository hook', {
        projectKey,
        repositorySlug,
        hookId,
      });
    } catch (error) {
      this.logger.error('Failed to delete repository hook', {
        projectKey,
        repositorySlug,
        hookId,
        error,
      });
      throw error;
    }
  }

  /**
   * Get repository branches
   * GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/branches
   */
  async getRepositoryBranches(
    projectKey: string,
    repositorySlug: string,
    params?: { start?: number; limit?: number }
  ): Promise<RepositoryBranchListResponse> {
    this.logger.info('Getting repository branches', { projectKey, repositorySlug, params });

    try {
      const response = await this.apiClient.get<RepositoryBranchListResponse>(
        `/projects/${projectKey}/repos/${repositorySlug}/branches`,
        { params }
      );
      this.logger.info('Successfully retrieved repository branches', {
        projectKey,
        repositorySlug,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get repository branches', {
        projectKey,
        repositorySlug,
        params,
        error,
      });
      throw error;
    }
  }

  /**
   * Create repository branch
   * POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/branches
   */
  async createRepositoryBranch(
    projectKey: string,
    repositorySlug: string,
    request: RepositoryBranchCreateRequest
  ): Promise<RepositoryBranch> {
    this.logger.info('Creating repository branch', { projectKey, repositorySlug, request });

    try {
      const response = await this.apiClient.post<RepositoryBranch>(
        `/projects/${projectKey}/repos/${repositorySlug}/branches`,
        request
      );
      this.logger.info('Successfully created repository branch', {
        projectKey,
        repositorySlug,
        branchId: response.data.id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create repository branch', {
        projectKey,
        repositorySlug,
        request,
        error,
      });
      throw error;
    }
  }

  /**
   * Get repository tags
   * GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/tags
   */
  async getRepositoryTags(
    projectKey: string,
    repositorySlug: string,
    params?: { start?: number; limit?: number }
  ): Promise<RepositoryTagListResponse> {
    this.logger.info('Getting repository tags', { projectKey, repositorySlug, params });

    try {
      const response = await this.apiClient.get<RepositoryTagListResponse>(
        `/projects/${projectKey}/repos/${repositorySlug}/tags`,
        { params }
      );
      this.logger.info('Successfully retrieved repository tags', {
        projectKey,
        repositorySlug,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get repository tags', {
        projectKey,
        repositorySlug,
        params,
        error,
      });
      throw error;
    }
  }

  /**
   * Create repository tag
   * POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/tags
   */
  async createRepositoryTag(
    projectKey: string,
    repositorySlug: string,
    request: RepositoryTagCreateRequest
  ): Promise<RepositoryTag> {
    this.logger.info('Creating repository tag', { projectKey, repositorySlug, request });

    try {
      const response = await this.apiClient.post<RepositoryTag>(
        `/projects/${projectKey}/repos/${repositorySlug}/tags`,
        request
      );
      this.logger.info('Successfully created repository tag', {
        projectKey,
        repositorySlug,
        tagId: response.data.id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create repository tag', {
        projectKey,
        repositorySlug,
        request,
        error,
      });
      throw error;
    }
  }

  /**
   * Get repository forks
   * GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/forks
   */
  async getRepositoryForks(
    projectKey: string,
    repositorySlug: string,
    params?: { start?: number; limit?: number }
  ): Promise<RepositoryForkListResponse> {
    this.logger.info('Getting repository forks', { projectKey, repositorySlug, params });

    try {
      const response = await this.apiClient.get<RepositoryForkListResponse>(
        `/projects/${projectKey}/repos/${repositorySlug}/forks`,
        { params }
      );
      this.logger.info('Successfully retrieved repository forks', {
        projectKey,
        repositorySlug,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get repository forks', {
        projectKey,
        repositorySlug,
        params,
        error,
      });
      throw error;
    }
  }

  /**
   * Create repository fork
   * POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/forks
   */
  async createRepositoryFork(
    projectKey: string,
    repositorySlug: string,
    request: RepositoryForkCreateRequest
  ): Promise<RepositoryFork> {
    this.logger.info('Creating repository fork', { projectKey, repositorySlug, request });

    try {
      const response = await this.apiClient.post<RepositoryFork>(
        `/projects/${projectKey}/repos/${repositorySlug}/forks`,
        request
      );
      this.logger.info('Successfully created repository fork', {
        projectKey,
        repositorySlug,
        forkId: response.data.id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create repository fork', {
        projectKey,
        repositorySlug,
        request,
        error,
      });
      throw error;
    }
  }
}
