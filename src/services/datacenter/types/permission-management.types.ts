/**
 * Permission Management Types for Bitbucket Data Center REST API
 * Based on official documentation: https://developer.atlassian.com/server/bitbucket/rest/v906/intro/
 */

import { Link, PagedResponse, PaginationParams } from './base.types.js';

// Permission type enum
export type PermissionType =
  | 'PROJECT_READ'
  | 'PROJECT_WRITE'
  | 'PROJECT_ADMIN'
  | 'REPO_READ'
  | 'REPO_WRITE'
  | 'REPO_ADMIN'
  | 'LICENSED_USER'
  | 'PROJECT_CREATE'
  | 'ADMIN'
  | 'SYS_ADMIN'
  | 'REPO_FORK'
  | 'REPO_CLONE'
  | 'REPO_PULL'
  | 'REPO_PUSH'
  | 'REPO_DELETE'
  | 'REPO_VIEW'
  | 'REPO_EDIT'
  | 'REPO_CREATE';

// Permission scope enum
export type PermissionScope = 'PROJECT' | 'REPOSITORY' | 'GLOBAL' | 'USER';

// Permission grantee type enum
export type PermissionGranteeType = 'USER' | 'GROUP' | 'ANONYMOUS' | 'AUTHENTICATED';

// Permission grantee
export interface PermissionGrantee {
  type: PermissionGranteeType;
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
    type: string;
  };
}

// Permission
export interface Permission {
  id: number;
  type: PermissionType;
  scope: PermissionScope;
  grantee: PermissionGrantee;
  grantedBy: {
    name: string;
    displayName: string;
    emailAddress: string;
  };
  grantedDate: string;
  context?: {
    project?: {
      key: string;
      name: string;
    };
    repository?: {
      slug: string;
      name: string;
      project: {
        key: string;
      };
    };
  };
  links: {
    self: Link[];
  };
}

// Permission request
export interface PermissionRequest {
  type: PermissionType;
  scope: PermissionScope;
  grantee: PermissionGrantee;
  context?: {
    project?: {
      key: string;
    };
    repository?: {
      slug: string;
      project: {
        key: string;
      };
    };
  };
}

// Permission list response
export interface PermissionListResponse extends PagedResponse<Permission> {}

// Permission summary
export interface PermissionSummary {
  type: PermissionType;
  scope: PermissionScope;
  count: number;
  grantees: PermissionGrantee[];
  context?: {
    project?: {
      key: string;
      name: string;
    };
    repository?: {
      slug: string;
      name: string;
      project: {
        key: string;
      };
    };
  };
}

// Permission summary list response
export interface PermissionSummaryListResponse extends PagedResponse<PermissionSummary> {}

// Permission audit log entry
export interface PermissionAuditLogEntry {
  id: number;
  timestamp: string;
  action: 'GRANTED' | 'REVOKED' | 'MODIFIED';
  permission: PermissionType;
  scope: PermissionScope;
  grantee: PermissionGrantee;
  grantedBy: {
    name: string;
    displayName: string;
    emailAddress: string;
  };
  context?: {
    project?: {
      key: string;
      name: string;
    };
    repository?: {
      slug: string;
      name: string;
      project: {
        key: string;
      };
    };
  };
  details?: string;
  links: {
    self: Link[];
  };
}

// Permission audit log list response
export interface PermissionAuditLogListResponse extends PagedResponse<PermissionAuditLogEntry> {}

// Permission query parameters
export interface PermissionQueryParams extends PaginationParams {
  type?: PermissionType;
  scope?: PermissionScope;
  grantee?: string;
  project?: string;
  repository?: string;
  action?: 'GRANTED' | 'REVOKED' | 'MODIFIED';
  fromDate?: string;
  toDate?: string;
}

// Permission bulk request
export interface PermissionBulkRequest {
  permissions: PermissionRequest[];
  dryRun?: boolean;
}

// Permission bulk response
export interface PermissionBulkResponse {
  success: boolean;
  processed: number;
  failed: number;
  errors: Array<{
    permission: PermissionRequest;
    error: string;
  }>;
  results: Array<{
    permission: PermissionRequest;
    success: boolean;
    permissionId?: number;
    error?: string;
  }>;
}

// Permission template
export interface PermissionTemplate {
  id: number;
  name: string;
  description?: string;
  permissions: PermissionRequest[];
  createdBy: {
    name: string;
    displayName: string;
    emailAddress: string;
  };
  createdDate: string;
  updatedDate: string;
  links: {
    self: Link[];
  };
}

// Permission template request
export interface PermissionTemplateRequest {
  name: string;
  description?: string;
  permissions: PermissionRequest[];
}

// Permission template list response
export interface PermissionTemplateListResponse extends PagedResponse<PermissionTemplate> {}
