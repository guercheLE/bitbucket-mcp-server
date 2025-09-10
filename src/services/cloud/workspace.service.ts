/**
 * Workspace Service for Bitbucket Cloud REST API
 * Based on official documentation: https://developer.atlassian.com/cloud/bitbucket/rest/api-group-workspaces/
 */

import {
  CreateWorkspaceRequest,
  ListWorkspaceHooksResponse,
  ListWorkspaceMembersParams,
  ListWorkspaceMembersResponse,
  ListWorkspacePermissionsParams,
  ListWorkspacePermissionsResponse,
  ListWorkspaceVariablesResponse,
  ListWorkspacesParams,
  ListWorkspacesResponse,
  UpdateWorkspaceRequest,
  Workspace,
  WorkspaceHook,
  WorkspaceMember,
  WorkspacePermission,
  WorkspaceVariable,
} from './types/workspace.types.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';

export class WorkspaceService {
  private readonly apiClient: ApiClient;
  private readonly logger: Logger;

  constructor(apiClient: ApiClient, logger: Logger) {
    this.apiClient = apiClient;
    this.logger = logger;
  }

  /**
   * Get Workspace
   * GET /2.0/workspaces/{workspace}
   */
  async getWorkspace(workspace: string): Promise<Workspace> {
    this.logger.info('Getting workspace', { workspace });

    try {
      const response = await this.apiClient.get<Workspace>(`/workspaces/${workspace}`);
      this.logger.info('Successfully retrieved workspace', { workspace });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get workspace', { workspace, error });
      throw error;
    }
  }

  /**
   * List Workspaces
   * GET /2.0/workspaces
   */
  async listWorkspaces(params?: ListWorkspacesParams): Promise<ListWorkspacesResponse> {
    this.logger.info('Listing workspaces');

    try {
      const response = await this.apiClient.get<ListWorkspacesResponse>('/workspaces', { params });
      this.logger.info('Successfully listed workspaces', { count: response.data.values.length });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list workspaces', { error });
      throw error;
    }
  }

  /**
   * Create Workspace
   * POST /2.0/workspaces
   */
  async createWorkspace(request: CreateWorkspaceRequest): Promise<Workspace> {
    this.logger.info('Creating workspace', { name: request.name });

    try {
      const response = await this.apiClient.post<Workspace>('/workspaces', request);
      this.logger.info('Successfully created workspace', { name: request.name });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create workspace', { request, error });
      throw error;
    }
  }

  /**
   * Update Workspace
   * PUT /2.0/workspaces/{workspace}
   */
  async updateWorkspace(workspace: string, request: UpdateWorkspaceRequest): Promise<Workspace> {
    this.logger.info('Updating workspace', { workspace });

    try {
      const response = await this.apiClient.put<Workspace>(`/workspaces/${workspace}`, request);
      this.logger.info('Successfully updated workspace', { workspace });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update workspace', { workspace, request, error });
      throw error;
    }
  }

  /**
   * Delete Workspace
   * DELETE /2.0/workspaces/{workspace}
   */
  async deleteWorkspace(workspace: string): Promise<void> {
    this.logger.info('Deleting workspace', { workspace });

    try {
      await this.apiClient.delete(`/workspaces/${workspace}`);
      this.logger.info('Successfully deleted workspace', { workspace });
    } catch (error) {
      this.logger.error('Failed to delete workspace', { workspace, error });
      throw error;
    }
  }

  /**
   * List Workspace Members
   * GET /2.0/workspaces/{workspace}/members
   */
  async listWorkspaceMembers(
    workspace: string,
    params?: ListWorkspaceMembersParams
  ): Promise<ListWorkspaceMembersResponse> {
    this.logger.info('Listing workspace members', { workspace });

    try {
      const response = await this.apiClient.get<ListWorkspaceMembersResponse>(
        `/workspaces/${workspace}/members`,
        { params }
      );
      this.logger.info('Successfully listed workspace members', {
        workspace,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list workspace members', { workspace, error });
      throw error;
    }
  }

  /**
   * Get Workspace Member
   * GET /2.0/workspaces/{workspace}/members/{member}
   */
  async getWorkspaceMember(workspace: string, member: string): Promise<WorkspaceMember> {
    this.logger.info('Getting workspace member', { workspace, member });

    try {
      const response = await this.apiClient.get<WorkspaceMember>(
        `/workspaces/${workspace}/members/${member}`
      );
      this.logger.info('Successfully retrieved workspace member', { workspace, member });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get workspace member', { workspace, member, error });
      throw error;
    }
  }

  /**
   * List Workspace Permissions
   * GET /2.0/workspaces/{workspace}/permissions
   */
  async listWorkspacePermissions(
    workspace: string,
    params?: ListWorkspacePermissionsParams
  ): Promise<ListWorkspacePermissionsResponse> {
    this.logger.info('Listing workspace permissions', { workspace });

    try {
      const response = await this.apiClient.get<ListWorkspacePermissionsResponse>(
        `/workspaces/${workspace}/permissions`,
        { params }
      );
      this.logger.info('Successfully listed workspace permissions', {
        workspace,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list workspace permissions', { workspace, error });
      throw error;
    }
  }

  /**
   * List Workspace Hooks
   * GET /2.0/workspaces/{workspace}/hooks
   */
  async listWorkspaceHooks(workspace: string): Promise<ListWorkspaceHooksResponse> {
    this.logger.info('Listing workspace hooks', { workspace });

    try {
      const response = await this.apiClient.get<ListWorkspaceHooksResponse>(
        `/workspaces/${workspace}/hooks`
      );
      this.logger.info('Successfully listed workspace hooks', {
        workspace,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list workspace hooks', { workspace, error });
      throw error;
    }
  }

  /**
   * Get Workspace Hook
   * GET /2.0/workspaces/{workspace}/hooks/{uid}
   */
  async getWorkspaceHook(workspace: string, hookUid: string): Promise<WorkspaceHook> {
    this.logger.info('Getting workspace hook', { workspace, hookUid });

    try {
      const response = await this.apiClient.get<WorkspaceHook>(
        `/workspaces/${workspace}/hooks/${hookUid}`
      );
      this.logger.info('Successfully retrieved workspace hook', { workspace, hookUid });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get workspace hook', { workspace, hookUid, error });
      throw error;
    }
  }

  /**
   * Create Workspace Hook
   * POST /2.0/workspaces/{workspace}/hooks
   */
  async createWorkspaceHook(
    workspace: string,
    request: any // CreateWorkspaceHookRequest
  ): Promise<WorkspaceHook> {
    this.logger.info('Creating workspace hook', { workspace });

    try {
      const response = await this.apiClient.post<WorkspaceHook>(
        `/workspaces/${workspace}/hooks`,
        request
      );
      this.logger.info('Successfully created workspace hook', { workspace });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create workspace hook', { workspace, request, error });
      throw error;
    }
  }

  /**
   * Update Workspace Hook
   * PUT /2.0/workspaces/{workspace}/hooks/{uid}
   */
  async updateWorkspaceHook(
    workspace: string,
    hookUid: string,
    request: any // UpdateWorkspaceHookRequest
  ): Promise<WorkspaceHook> {
    this.logger.info('Updating workspace hook', { workspace, hookUid });

    try {
      const response = await this.apiClient.put<WorkspaceHook>(
        `/workspaces/${workspace}/hooks/${hookUid}`,
        request
      );
      this.logger.info('Successfully updated workspace hook', { workspace, hookUid });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update workspace hook', { workspace, hookUid, request, error });
      throw error;
    }
  }

  /**
   * Delete Workspace Hook
   * DELETE /2.0/workspaces/{workspace}/hooks/{uid}
   */
  async deleteWorkspaceHook(workspace: string, hookUid: string): Promise<void> {
    this.logger.info('Deleting workspace hook', { workspace, hookUid });

    try {
      await this.apiClient.delete(`/workspaces/${workspace}/hooks/${hookUid}`);
      this.logger.info('Successfully deleted workspace hook', { workspace, hookUid });
    } catch (error) {
      this.logger.error('Failed to delete workspace hook', { workspace, hookUid, error });
      throw error;
    }
  }

  /**
   * List Workspace Variables
   * GET /2.0/workspaces/{workspace}/pipelines_config/variables
   */
  async listWorkspaceVariables(workspace: string): Promise<ListWorkspaceVariablesResponse> {
    this.logger.info('Listing workspace variables', { workspace });

    try {
      const response = await this.apiClient.get<ListWorkspaceVariablesResponse>(
        `/workspaces/${workspace}/pipelines_config/variables`
      );
      this.logger.info('Successfully listed workspace variables', {
        workspace,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list workspace variables', { workspace, error });
      throw error;
    }
  }

  /**
   * Get Workspace Variable
   * GET /2.0/workspaces/{workspace}/pipelines_config/variables/{variable_uuid}
   */
  async getWorkspaceVariable(workspace: string, variableUuid: string): Promise<WorkspaceVariable> {
    this.logger.info('Getting workspace variable', { workspace, variableUuid });

    try {
      const response = await this.apiClient.get<WorkspaceVariable>(
        `/workspaces/${workspace}/pipelines_config/variables/${variableUuid}`
      );
      this.logger.info('Successfully retrieved workspace variable', { workspace, variableUuid });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get workspace variable', { workspace, variableUuid, error });
      throw error;
    }
  }

  /**
   * Create Workspace Variable
   * POST /2.0/workspaces/{workspace}/pipelines_config/variables
   */
  async createWorkspaceVariable(
    workspace: string,
    request: any // CreateWorkspaceVariableRequest
  ): Promise<WorkspaceVariable> {
    this.logger.info('Creating workspace variable', { workspace });

    try {
      const response = await this.apiClient.post<WorkspaceVariable>(
        `/workspaces/${workspace}/pipelines_config/variables`,
        request
      );
      this.logger.info('Successfully created workspace variable', { workspace });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create workspace variable', { workspace, request, error });
      throw error;
    }
  }

  /**
   * Update Workspace Variable
   * PUT /2.0/workspaces/{workspace}/pipelines_config/variables/{variable_uuid}
   */
  async updateWorkspaceVariable(
    workspace: string,
    variableUuid: string,
    request: any // UpdateWorkspaceVariableRequest
  ): Promise<WorkspaceVariable> {
    this.logger.info('Updating workspace variable', { workspace, variableUuid });

    try {
      const response = await this.apiClient.put<WorkspaceVariable>(
        `/workspaces/${workspace}/pipelines_config/variables/${variableUuid}`,
        request
      );
      this.logger.info('Successfully updated workspace variable', { workspace, variableUuid });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update workspace variable', {
        workspace,
        variableUuid,
        request,
        error,
      });
      throw error;
    }
  }

  /**
   * Delete Workspace Variable
   * DELETE /2.0/workspaces/{workspace}/pipelines_config/variables/{variable_uuid}
   */
  async deleteWorkspaceVariable(workspace: string, variableUuid: string): Promise<void> {
    this.logger.info('Deleting workspace variable', { workspace, variableUuid });

    try {
      await this.apiClient.delete(
        `/workspaces/${workspace}/pipelines_config/variables/${variableUuid}`
      );
      this.logger.info('Successfully deleted workspace variable', { workspace, variableUuid });
    } catch (error) {
      this.logger.error('Failed to delete workspace variable', { workspace, variableUuid, error });
      throw error;
    }
  }
}
