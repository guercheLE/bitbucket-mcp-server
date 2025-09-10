/**
 * Workspace Types for Bitbucket Cloud REST API
 * Based on official documentation: https://developer.atlassian.com/cloud/bitbucket/rest/api-group-workspaces/
 */

import { Link, PagedResponse, PaginationParams } from './base.types.js';

// Workspace
export interface Workspace {
  uuid: string;
  name: string;
  slug: string;
  is_private: boolean;
  created_on: string;
  updated_on: string;
  type: 'workspace';
  links: {
    self: Link;
    html: Link;
    avatar: Link;
    members: Link;
    projects: Link;
    repositories: Link;
    snippets: Link;
  };
}

// Workspace Member
export interface WorkspaceMember {
  uuid: string;
  display_name: string;
  nickname: string;
  type: 'user';
  account_id: string;
  links: {
    self: Link;
    html: Link;
    avatar: Link;
  };
  created_on: string;
  is_staff: boolean;
  location?: string;
  website?: string;
}

// Workspace Permission
export interface WorkspacePermission {
  permission: 'owner' | 'collaborator' | 'member';
  user: WorkspaceMember;
  workspace: Workspace;
}

// Create Workspace Request
export interface CreateWorkspaceRequest {
  name: string;
  is_private?: boolean;
}

// Update Workspace Request
export interface UpdateWorkspaceRequest {
  name?: string;
  is_private?: boolean;
}

// List Workspaces Parameters
export interface ListWorkspacesParams extends PaginationParams {
  role?: 'owner' | 'collaborator' | 'member';
  q?: string;
  sort?: 'created_on' | 'name' | 'updated_on';
}

// List Workspaces Response
export interface ListWorkspacesResponse extends PagedResponse<Workspace> {}

// List Workspace Members Parameters
export interface ListWorkspaceMembersParams extends PaginationParams {
  q?: string;
  sort?: 'created_on' | 'display_name';
}

// List Workspace Members Response
export interface ListWorkspaceMembersResponse extends PagedResponse<WorkspaceMember> {}

// List Workspace Permissions Parameters
export interface ListWorkspacePermissionsParams extends PaginationParams {
  q?: string;
  sort?: 'created_on' | 'display_name';
}

// List Workspace Permissions Response
export interface ListWorkspacePermissionsResponse extends PagedResponse<WorkspacePermission> {}

// Workspace Hook
export interface WorkspaceHook {
  uuid: string;
  url: string;
  description: string;
  subject_type: 'workspace';
  subject: {
    uuid: string;
    name: string;
    slug: string;
    links: {
      self: Link;
      html: Link;
      avatar: Link;
    };
  };
  active: boolean;
  events: string[];
  created_on: string;
  updated_on: string;
  links: {
    self: Link;
  };
}

// Create Workspace Hook Request
export interface CreateWorkspaceHookRequest {
  url: string;
  description: string;
  events: string[];
  active?: boolean;
}

// Update Workspace Hook Request
export interface UpdateWorkspaceHookRequest {
  url?: string;
  description?: string;
  events?: string[];
  active?: boolean;
}

// List Workspace Hooks Response
export interface ListWorkspaceHooksResponse extends PagedResponse<WorkspaceHook> {}

// Workspace Variable
export interface WorkspaceVariable {
  uuid: string;
  key: string;
  value: string;
  secured: boolean;
  created_on: string;
  updated_on: string;
  links: {
    self: Link;
  };
}

// Create Workspace Variable Request
export interface CreateWorkspaceVariableRequest {
  key: string;
  value: string;
  secured?: boolean;
}

// Update Workspace Variable Request
export interface UpdateWorkspaceVariableRequest {
  key?: string;
  value?: string;
  secured?: boolean;
}

// List Workspace Variables Response
export interface ListWorkspaceVariablesResponse extends PagedResponse<WorkspaceVariable> {}
