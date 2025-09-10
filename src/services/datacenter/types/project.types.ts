/**
 * Project Types for Bitbucket Data Center REST API
 * Based on official documentation: https://developer.atlassian.com/server/bitbucket/rest/v906/intro/
 */

import { Link, PagedResponse, PaginationParams } from './base.types.js';

// Project type enum
export type ProjectType = 'NORMAL' | 'PERSONAL';

// Project creation request
export interface ProjectCreateRequest {
  key: string;
  name: string;
  description?: string;
  public?: boolean;
  type?: ProjectType;
}

// Project update request
export interface ProjectUpdateRequest {
  name?: string;
  description?: string;
  public?: boolean;
}

// Project response
export interface ProjectResponse {
  key: string;
  id: number;
  name: string;
  description?: string;
  public: boolean;
  type: ProjectType;
  created_on: string;
  updated_on: string;
  links: {
    self: Link[];
    avatar: Link[];
  };
}

// Project list response
export interface ProjectListResponse extends PagedResponse<ProjectResponse> {}

// Project permissions
export interface ProjectPermissions {
  project: {
    key: string;
    id: number;
    name: string;
    public: boolean;
    type: ProjectType;
    links: {
      self: Link[];
    };
  };
  permissions: Array<{
    user?: {
      name: string;
      emailAddress: string;
      id: number;
      displayName: string;
      active: boolean;
      slug: string;
      type: string;
      links: {
        self: Link[];
      };
    };
    group?: {
      name: string;
    };
    permission: 'PROJECT_READ' | 'PROJECT_WRITE' | 'PROJECT_ADMIN';
  }>;
}

// Project permission request
export interface ProjectPermissionRequest {
  user?: {
    name: string;
  };
  group?: {
    name: string;
  };
  permission: 'PROJECT_READ' | 'PROJECT_WRITE' | 'PROJECT_ADMIN';
}

// Project avatar
export interface ProjectAvatar {
  id: string;
  data: string;
  contentType: string;
  size: number;
  created_on: string;
  updated_on: string;
  links: {
    self: Link[];
  };
}

// Project avatar upload request
export interface ProjectAvatarUploadRequest {
  data: string; // Base64 encoded image data
  contentType: string;
}

// Project hooks
export interface ProjectHook {
  id: number;
  name: string;
  url: string;
  active: boolean;
  events: string[];
  configuration: Record<string, any>;
  created_on: string;
  updated_on: string;
  links: {
    self: Link[];
  };
}

// Project hook request
export interface ProjectHookRequest {
  name: string;
  url: string;
  active?: boolean;
  events: string[];
  configuration?: Record<string, any>;
}

// Project hook update request
export interface ProjectHookUpdateRequest {
  name?: string;
  url?: string;
  active?: boolean;
  events?: string[];
  configuration?: Record<string, any>;
}

// Project settings
export interface ProjectSettings {
  project: {
    key: string;
    id: number;
    name: string;
    public: boolean;
    type: ProjectType;
    links: {
      self: Link[];
    };
  };
  settings: {
    forkable: boolean;
    publicAccess: boolean;
    defaultBranch: string;
    defaultMergeStrategy: 'NO_FF' | 'FF_ONLY' | 'FF';
    defaultCommitMessage: string;
    defaultCommitMessagePrefix: string;
    defaultCommitMessageSuffix: string;
    defaultCommitMessageTemplate: string;
    defaultCommitMessageTemplateEnabled: boolean;
    defaultCommitMessageTemplateType: 'PLAIN' | 'MARKDOWN';
    defaultCommitMessageTemplateContent: string;
    defaultCommitMessageTemplateSubject: string;
    defaultCommitMessageTemplateBody: string;
    defaultCommitMessageTemplateFooter: string;
    defaultCommitMessageTemplateHeader: string;
  };
}

// Project settings update request
export interface ProjectSettingsUpdateRequest {
  forkable?: boolean;
  publicAccess?: boolean;
  defaultBranch?: string;
  defaultMergeStrategy?: 'NO_FF' | 'FF_ONLY' | 'FF';
  defaultCommitMessage?: string;
  defaultCommitMessagePrefix?: string;
  defaultCommitMessageSuffix?: string;
  defaultCommitMessageTemplate?: string;
  defaultCommitMessageTemplateEnabled?: boolean;
  defaultCommitMessageTemplateType?: 'PLAIN' | 'MARKDOWN';
  defaultCommitMessageTemplateContent?: string;
  defaultCommitMessageTemplateSubject?: string;
  defaultCommitMessageTemplateBody?: string;
  defaultCommitMessageTemplateFooter?: string;
  defaultCommitMessageTemplateHeader?: string;
}

// Project query parameters
export interface ProjectQueryParams extends PaginationParams {
  name?: string;
  permission?: 'PROJECT_READ' | 'PROJECT_WRITE' | 'PROJECT_ADMIN';
  type?: ProjectType;
}
