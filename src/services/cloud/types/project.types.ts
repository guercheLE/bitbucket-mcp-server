/**
 * Project Types for Bitbucket Cloud REST API
 * Based on: https://developer.atlassian.com/cloud/bitbucket/rest/api-group-projects/
 */

import { PaginationParams } from './base.types.js';

// Project Types
export interface Project {
  type: string;
  uuid: string;
  key: string;
  name: string;
  description?: string;
  is_private: boolean;
  created_on: string;
  updated_on: string;
  owner: ProjectOwner;
  links: ProjectLinks;
  has_publicly_visible_repos: boolean;
}

export interface ProjectOwner {
  type: string;
  uuid: string;
  display_name: string;
  links: {
    self: { href: string };
    html: { href: string };
    avatar: { href: string };
  };
  nickname: string;
  account_id: string;
}

export interface ProjectLinks {
  self: { href: string };
  html: { href: string };
  avatar: { href: string };
  repositories: { href: string };
}

export interface CreateProjectRequest {
  name: string;
  key: string;
  description?: string;
  is_private?: boolean;
  links?: {
    avatar?: {
      href: string;
    };
  };
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  is_private?: boolean;
  links?: {
    avatar?: {
      href: string;
    };
  };
}

export interface DefaultReviewer {
  type: string;
  uuid: string;
  display_name: string;
  links: {
    self: { href: string };
    html: { href: string };
    avatar: { href: string };
  };
  nickname: string;
  account_id: string;
}

export interface ProjectPermission {
  type: string;
  permission: string;
  user?: ProjectOwner;
  group?: ProjectGroup;
  links: {
    self: { href: string };
  };
}

export interface ProjectGroup {
  type: string;
  name: string;
  slug: string;
  links: {
    self: { href: string };
    html: { href: string };
  };
}

// Parameter Types
export interface CreateProjectParams {
  workspace: string;
  project: CreateProjectRequest;
}

export interface GetProjectParams {
  workspace: string;
  project_key: string;
}

export interface UpdateProjectParams {
  workspace: string;
  project_key: string;
  project: UpdateProjectRequest;
}

export interface DeleteProjectParams {
  workspace: string;
  project_key: string;
}

export interface ListDefaultReviewersParams extends PaginationParams {
  workspace: string;
  project_key: string;
}

export interface AddDefaultReviewerParams {
  workspace: string;
  project_key: string;
  selected_user: string;
}

export interface RemoveDefaultReviewerParams {
  workspace: string;
  project_key: string;
  selected_user: string;
}

export interface ListGroupPermissionsParams extends PaginationParams {
  workspace: string;
  project_key: string;
}

export interface GetGroupPermissionParams {
  workspace: string;
  project_key: string;
  group_slug: string;
}

export interface UpdateGroupPermissionParams {
  workspace: string;
  project_key: string;
  group_slug: string;
  permission: string;
}

export interface DeleteGroupPermissionParams {
  workspace: string;
  project_key: string;
  group_slug: string;
}

export interface ListUserPermissionsParams extends PaginationParams {
  workspace: string;
  project_key: string;
}

export interface GetUserPermissionParams {
  workspace: string;
  project_key: string;
  selected_user_id: string;
}

export interface UpdateUserPermissionParams {
  workspace: string;
  project_key: string;
  selected_user_id: string;
  permission: string;
}

export interface DeleteUserPermissionParams {
  workspace: string;
  project_key: string;
  selected_user_id: string;
}
