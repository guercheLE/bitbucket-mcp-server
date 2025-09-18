import axios, { AxiosResponse } from 'axios';
import { z } from 'zod';
import { 
  Project, 
  CreateProjectInput, 
  UpdateProjectInput, 
  ProjectList,
  ProjectSchema,
  CreateProjectSchema,
  UpdateProjectSchema,
  ProjectListSchema,
  ProjectFactory,
  ProjectValidator
} from '../types/project';
import { ServerInfo } from './server-detection';

/**
 * Project Service for Bitbucket Data Center
 * T036: Project service in src/services/ProjectService.ts
 * 
 * Handles all project-related operations for Data Center
 * Based on data-model.md specifications
 */

// Authentication info type
export interface AuthInfo {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
}

// Project service request types
export interface ProjectServiceRequest {
  serverInfo: ServerInfo;
  auth: AuthInfo;
}

export interface CreateProjectRequest extends ProjectServiceRequest {
  key: string;
  name: string;
  description?: string;
  avatar?: string;
  isPublic?: boolean;
}

export interface UpdateProjectRequest extends ProjectServiceRequest {
  projectKey: string;
  name?: string;
  description?: string;
  avatar?: string;
  isPublic?: boolean;
}

export interface GetProjectRequest extends ProjectServiceRequest {
  projectKey: string;
}

export interface DeleteProjectRequest extends ProjectServiceRequest {
  projectKey: string;
}

export interface ListProjectsRequest extends ProjectServiceRequest {
  start?: number;
  limit?: number;
}

export interface ProjectPermissionRequest extends ProjectServiceRequest {
  projectKey: string;
  user?: string;
  group?: string;
  permission: string;
}

export interface ProjectSettingsRequest extends ProjectServiceRequest {
  projectKey: string;
  settings: {
    defaultBranch?: string;
    defaultMergeStrategy?: string;
    defaultCommitMessage?: string;
  };
}

export interface ProjectHookRequest extends ProjectServiceRequest {
  projectKey: string;
  name: string;
  url: string;
  events: string[];
  active?: boolean;
}

export interface ProjectAvatarRequest extends ProjectServiceRequest {
  projectKey: string;
  avatarData: string;
  contentType: string;
}

/**
 * Project Service Class
 */
export class ProjectService {
  private readonly REQUEST_TIMEOUT = 10000; // 10 seconds
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  /**
   * Creates a new project
   */
  async createProject(request: CreateProjectRequest): Promise<Project> {
    // Validate input
    const validation = ProjectValidator.validate({
      key: request.key,
      name: request.name,
      description: request.description,
      avatar: request.avatar,
      isPublic: request.isPublic ?? false
    });

    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Validate server type
    if (request.serverInfo.serverType !== 'datacenter') {
      throw new Error('Project operations are only supported for Data Center');
    }

    try {
      const response: AxiosResponse<Project> = await this.makeRequest(
        request.serverInfo.baseUrl,
        `/rest/api/1.0/projects/${request.key}`,
        'POST',
        request.auth,
        {
          key: request.key,
          name: request.name,
          description: request.description,
          avatar: request.avatar,
          isPublic: request.isPublic ?? false
        }
      );

      const project = ProjectSchema.parse(response.data);
      return ProjectFactory.withSelfLink(project, request.serverInfo.baseUrl);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 409) {
          throw new Error('Project key already exists');
        } else if (error.response?.status === 403) {
          throw new Error('Insufficient permissions');
        } else if (error.response?.status === 401) {
          throw new Error('Authentication failed');
        }
      }
      throw new Error(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets project details
   */
  async getProject(request: GetProjectRequest): Promise<Project> {
    try {
      const response: AxiosResponse<Project> = await this.makeRequest(
        request.serverInfo.baseUrl,
        `/rest/api/1.0/projects/${request.projectKey}`,
        'GET',
        request.auth
      );

      const project = ProjectSchema.parse(response.data);
      return ProjectFactory.withSelfLink(project, request.serverInfo.baseUrl);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Project not found');
        } else if (error.response?.status === 403) {
          throw new Error('Insufficient permissions');
        } else if (error.response?.status === 401) {
          throw new Error('Authentication failed');
        }
      }
      throw new Error(`Failed to get project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Updates project
   */
  async updateProject(request: UpdateProjectRequest): Promise<Project> {
    try {
      const response: AxiosResponse<Project> = await this.makeRequest(
        request.serverInfo.baseUrl,
        `/rest/api/1.0/projects/${request.projectKey}`,
        'PUT',
        request.auth,
        {
          name: request.name,
          description: request.description,
          avatar: request.avatar,
          isPublic: request.isPublic
        }
      );

      const project = ProjectSchema.parse(response.data);
      return ProjectFactory.withSelfLink(project, request.serverInfo.baseUrl);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Project not found');
        } else if (error.response?.status === 403) {
          throw new Error('Insufficient permissions');
        } else if (error.response?.status === 401) {
          throw new Error('Authentication failed');
        }
      }
      throw new Error(`Failed to update project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deletes project
   */
  async deleteProject(request: DeleteProjectRequest): Promise<void> {
    try {
      await this.makeRequest(
        request.serverInfo.baseUrl,
        `/rest/api/1.0/projects/${request.projectKey}`,
        'DELETE',
        request.auth
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Project not found');
        } else if (error.response?.status === 403) {
          throw new Error('Insufficient permissions');
        } else if (error.response?.status === 401) {
          throw new Error('Authentication failed');
        } else if (error.response?.status === 409) {
          throw new Error('Cannot delete project with active repositories');
        }
      }
      throw new Error(`Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Lists projects
   */
  async listProjects(request: ListProjectsRequest): Promise<ProjectList> {
    try {
      const params = new URLSearchParams();
      if (request.start !== undefined) params.append('start', request.start.toString());
      if (request.limit !== undefined) params.append('limit', request.limit.toString());

      const response: AxiosResponse<ProjectList> = await this.makeRequest(
        request.serverInfo.baseUrl,
        `/rest/api/1.0/projects?${params.toString()}`,
        'GET',
        request.auth
      );

      const projectList = ProjectListSchema.parse(response.data);
      
      // Add self links to all projects
      projectList.values = projectList.values.map(project => 
        ProjectFactory.withSelfLink(project, request.serverInfo.baseUrl)
      );

      return projectList;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          throw new Error('Insufficient permissions');
        } else if (error.response?.status === 401) {
          throw new Error('Authentication failed');
        }
      }
      throw new Error(`Failed to list projects: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Adds project permission
   */
  async addPermission(request: ProjectPermissionRequest): Promise<void> {
    try {
      await this.makeRequest(
        request.serverInfo.baseUrl,
        `/rest/api/1.0/projects/${request.projectKey}/permissions/users`,
        'PUT',
        request.auth,
        {
          user: request.user,
          group: request.group,
          permission: request.permission
        }
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Project not found');
        } else if (error.response?.status === 403) {
          throw new Error('Insufficient permissions');
        } else if (error.response?.status === 401) {
          throw new Error('Authentication failed');
        }
      }
      throw new Error(`Failed to add permission: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Removes project permission
   */
  async removePermission(request: ProjectPermissionRequest): Promise<void> {
    try {
      await this.makeRequest(
        request.serverInfo.baseUrl,
        `/rest/api/1.0/projects/${request.projectKey}/permissions/users`,
        'DELETE',
        request.auth,
        {
          user: request.user,
          group: request.group,
          permission: request.permission
        }
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Project not found');
        } else if (error.response?.status === 403) {
          throw new Error('Insufficient permissions');
        } else if (error.response?.status === 401) {
          throw new Error('Authentication failed');
        }
      }
      throw new Error(`Failed to remove permission: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets project permissions
   */
  async getPermissions(request: GetProjectRequest): Promise<any[]> {
    try {
      const response: AxiosResponse<any> = await this.makeRequest(
        request.serverInfo.baseUrl,
        `/rest/api/1.0/projects/${request.projectKey}/permissions/users`,
        'GET',
        request.auth
      );

      return response.data.values || [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Project not found');
        } else if (error.response?.status === 403) {
          throw new Error('Insufficient permissions');
        } else if (error.response?.status === 401) {
          throw new Error('Authentication failed');
        }
      }
      throw new Error(`Failed to get permissions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Updates project settings
   */
  async updateSettings(request: ProjectSettingsRequest): Promise<any> {
    try {
      const response: AxiosResponse<any> = await this.makeRequest(
        request.serverInfo.baseUrl,
        `/rest/api/1.0/projects/${request.projectKey}/settings`,
        'PUT',
        request.auth,
        request.settings
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Project not found');
        } else if (error.response?.status === 403) {
          throw new Error('Insufficient permissions');
        } else if (error.response?.status === 401) {
          throw new Error('Authentication failed');
        }
      }
      throw new Error(`Failed to update settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets project settings
   */
  async getSettings(request: GetProjectRequest): Promise<any> {
    try {
      const response: AxiosResponse<any> = await this.makeRequest(
        request.serverInfo.baseUrl,
        `/rest/api/1.0/projects/${request.projectKey}/settings`,
        'GET',
        request.auth
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Project not found');
        } else if (error.response?.status === 403) {
          throw new Error('Insufficient permissions');
        } else if (error.response?.status === 401) {
          throw new Error('Authentication failed');
        }
      }
      throw new Error(`Failed to get settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Creates project webhook
   */
  async createHook(request: ProjectHookRequest): Promise<any> {
    try {
      const response: AxiosResponse<any> = await this.makeRequest(
        request.serverInfo.baseUrl,
        `/rest/api/1.0/projects/${request.projectKey}/webhooks`,
        'POST',
        request.auth,
        {
          name: request.name,
          url: request.url,
          events: request.events,
          active: request.active ?? true
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Project not found');
        } else if (error.response?.status === 403) {
          throw new Error('Insufficient permissions');
        } else if (error.response?.status === 401) {
          throw new Error('Authentication failed');
        }
      }
      throw new Error(`Failed to create webhook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets project webhooks
   */
  async getHooks(request: GetProjectRequest): Promise<any[]> {
    try {
      const response: AxiosResponse<any> = await this.makeRequest(
        request.serverInfo.baseUrl,
        `/rest/api/1.0/projects/${request.projectKey}/webhooks`,
        'GET',
        request.auth
      );

      return response.data.values || [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Project not found');
        } else if (error.response?.status === 403) {
          throw new Error('Insufficient permissions');
        } else if (error.response?.status === 401) {
          throw new Error('Authentication failed');
        }
      }
      throw new Error(`Failed to get webhooks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Updates project webhook
   */
  async updateHook(request: ProjectHookRequest & { hookId: string }): Promise<any> {
    try {
      const response: AxiosResponse<any> = await this.makeRequest(
        request.serverInfo.baseUrl,
        `/rest/api/1.0/projects/${request.projectKey}/webhooks/${request.hookId}`,
        'PUT',
        request.auth,
        {
          name: request.name,
          url: request.url,
          events: request.events,
          active: request.active
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Webhook not found');
        } else if (error.response?.status === 403) {
          throw new Error('Insufficient permissions');
        } else if (error.response?.status === 401) {
          throw new Error('Authentication failed');
        }
      }
      throw new Error(`Failed to update webhook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deletes project webhook
   */
  async deleteHook(request: GetProjectRequest & { hookId: string }): Promise<void> {
    try {
      await this.makeRequest(
        request.serverInfo.baseUrl,
        `/rest/api/1.0/projects/${request.projectKey}/webhooks/${request.hookId}`,
        'DELETE',
        request.auth
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Webhook not found');
        } else if (error.response?.status === 403) {
          throw new Error('Insufficient permissions');
        } else if (error.response?.status === 401) {
          throw new Error('Authentication failed');
        }
      }
      throw new Error(`Failed to delete webhook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Uploads project avatar
   */
  async uploadAvatar(request: ProjectAvatarRequest): Promise<any> {
    try {
      const response: AxiosResponse<any> = await this.makeRequest(
        request.serverInfo.baseUrl,
        `/rest/api/1.0/projects/${request.projectKey}/avatar`,
        'POST',
        request.auth,
        {
          data: request.avatarData,
          contentType: request.contentType
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Project not found');
        } else if (error.response?.status === 403) {
          throw new Error('Insufficient permissions');
        } else if (error.response?.status === 401) {
          throw new Error('Authentication failed');
        }
      }
      throw new Error(`Failed to upload avatar: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets project avatar
   */
  async getAvatar(request: GetProjectRequest): Promise<any> {
    try {
      const response: AxiosResponse<any> = await this.makeRequest(
        request.serverInfo.baseUrl,
        `/rest/api/1.0/projects/${request.projectKey}/avatar`,
        'GET',
        request.auth
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Avatar not found');
        } else if (error.response?.status === 403) {
          throw new Error('Insufficient permissions');
        } else if (error.response?.status === 401) {
          throw new Error('Authentication failed');
        }
      }
      throw new Error(`Failed to get avatar: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deletes project avatar
   */
  async deleteAvatar(request: GetProjectRequest): Promise<void> {
    try {
      await this.makeRequest(
        request.serverInfo.baseUrl,
        `/rest/api/1.0/projects/${request.projectKey}/avatar`,
        'DELETE',
        request.auth
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Avatar not found');
        } else if (error.response?.status === 403) {
          throw new Error('Insufficient permissions');
        } else if (error.response?.status === 401) {
          throw new Error('Authentication failed');
        }
      }
      throw new Error(`Failed to delete avatar: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Makes HTTP request with retry logic
   */
  private async makeRequest(
    baseUrl: string,
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    auth: AuthInfo,
    data?: any
  ): Promise<AxiosResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const response = await axios({
          method,
          url: `${baseUrl}${endpoint}`,
          headers: {
            'Authorization': `${auth.token_type} ${auth.access_token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          data,
          timeout: this.REQUEST_TIMEOUT
        });

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry on client errors (4xx)
        if (axios.isAxiosError(error) && error.response?.status && error.response.status >= 400 && error.response.status < 500) {
          throw error;
        }

        // Wait before retry
        if (attempt < this.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * attempt));
        }
      }
    }

    throw lastError || new Error('Request failed after all retries');
  }
}

// Export singleton instance
export const projectService = new ProjectService();
