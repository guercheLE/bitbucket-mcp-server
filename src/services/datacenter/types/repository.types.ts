/**
 * Repository Types for Bitbucket Data Center REST API
 * Based on official documentation: https://developer.atlassian.com/server/bitbucket/rest/v906/intro/
 */

import { Link, PagedResponse, PaginationParams, Project } from './base.types.js';

// Repository state enum
export type RepositoryState = 'AVAILABLE' | 'INITIALISING' | 'INITIALISATION_FAILED';

// SCM type enum
export type ScmType = 'git' | 'hg';

// Repository creation request
export interface RepositoryCreateRequest {
  name: string;
  scmId?: ScmType;
  forkable?: boolean;
  public?: boolean;
  description?: string;
}

// Repository update request
export interface RepositoryUpdateRequest {
  name?: string;
  description?: string;
  forkable?: boolean;
  public?: boolean;
}

// Repository response
export interface RepositoryResponse {
  id: number;
  slug: string;
  name: string;
  scmId: ScmType;
  state: RepositoryState;
  statusMessage?: string;
  forkable: boolean;
  project: Project;
  public: boolean;
  created_on: string;
  updated_on: string;
  size: number;
  description?: string;
  links: {
    self: Link[];
    clone: Array<{
      href: string;
      name: string;
    }>;
  };
}

// Repository list response
export interface RepositoryListResponse extends PagedResponse<RepositoryResponse> {}

// Repository permissions
export interface RepositoryPermissions {
  repository: {
    id: number;
    slug: string;
    name: string;
    project: Project;
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
    permission: 'REPO_READ' | 'REPO_WRITE' | 'REPO_ADMIN';
  }>;
}

// Repository permission request
export interface RepositoryPermissionRequest {
  user?: {
    name: string;
  };
  group?: {
    name: string;
  };
  permission: 'REPO_READ' | 'REPO_WRITE' | 'REPO_ADMIN';
}

// Repository settings
export interface RepositorySettings {
  repository: {
    id: number;
    slug: string;
    name: string;
    project: Project;
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

// Repository settings update request
export interface RepositorySettingsUpdateRequest {
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

// Repository hooks
export interface RepositoryHook {
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

// Repository hook request
export interface RepositoryHookRequest {
  name: string;
  url: string;
  active?: boolean;
  events: string[];
  configuration?: Record<string, any>;
}

// Repository hook update request
export interface RepositoryHookUpdateRequest {
  name?: string;
  url?: string;
  active?: boolean;
  events?: string[];
  configuration?: Record<string, any>;
}

// Repository branches
export interface RepositoryBranch {
  id: string;
  displayId: string;
  type: 'BRANCH' | 'TAG';
  latestCommit: string;
  latestChangeset: string;
  isDefault: boolean;
  links: {
    self: Link[];
  };
}

// Repository branch list response
export interface RepositoryBranchListResponse extends PagedResponse<RepositoryBranch> {}

// Repository branch creation request
export interface RepositoryBranchCreateRequest {
  name: string;
  startPoint: string;
  message?: string;
}

// Repository tags
export interface RepositoryTag {
  id: string;
  displayId: string;
  type: 'BRANCH' | 'TAG';
  latestCommit: string;
  latestChangeset: string;
  links: {
    self: Link[];
  };
}

// Repository tag list response
export interface RepositoryTagListResponse extends PagedResponse<RepositoryTag> {}

// Repository tag creation request
export interface RepositoryTagCreateRequest {
  name: string;
  startPoint: string;
  message?: string;
}

// Repository forks
export interface RepositoryFork {
  id: number;
  slug: string;
  name: string;
  scmId: ScmType;
  state: RepositoryState;
  statusMessage?: string;
  forkable: boolean;
  project: Project;
  public: boolean;
  created_on: string;
  updated_on: string;
  size: number;
  description?: string;
  origin: {
    id: number;
    slug: string;
    name: string;
    project: Project;
    links: {
      self: Link[];
    };
  };
  links: {
    self: Link[];
    clone: Array<{
      href: string;
      name: string;
    }>;
  };
}

// Repository fork list response
export interface RepositoryForkListResponse extends PagedResponse<RepositoryFork> {}

// Repository fork creation request
export interface RepositoryForkCreateRequest {
  name?: string;
  description?: string;
  public?: boolean;
}

// Repository query parameters
export interface RepositoryQueryParams extends PaginationParams {
  name?: string;
  permission?: 'REPO_READ' | 'REPO_WRITE' | 'REPO_ADMIN';
  state?: RepositoryState;
  scmId?: ScmType;
}
