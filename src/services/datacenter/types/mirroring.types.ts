/**
 * Mirroring Types for Bitbucket Data Center REST API
 * Based on official documentation: https://developer.atlassian.com/server/bitbucket/rest/v906/intro/
 */

import { Link, PagedResponse, PaginationParams } from './base.types.js';

// Mirror status enum
export type MirrorStatus = 'INITIALIZING' | 'RUNNING' | 'STOPPED' | 'FAILED' | 'PAUSED';

// Mirror direction enum
export type MirrorDirection = 'PUSH' | 'PULL' | 'BIDIRECTIONAL';

// Mirror repository
export interface MirrorRepository {
  id: number;
  name: string;
  slug: string;
  scmId: string;
  state: string;
  statusMessage: string;
  forkable: boolean;
  project: {
    key: string;
    id: number;
    name: string;
    public: boolean;
    type: string;
    links: {
      self: Link[];
    };
  };
  public: boolean;
  links: {
    clone: Link[];
    self: Link[];
  };
}

// Mirror configuration
export interface MirrorConfiguration {
  id: number;
  name: string;
  description?: string;
  sourceRepository: {
    slug: string;
    project: {
      key: string;
    };
  };
  targetRepository: {
    slug: string;
    project: {
      key: string;
    };
  };
  direction: MirrorDirection;
  enabled: boolean;
  schedule: {
    enabled: boolean;
    cronExpression?: string;
    timezone?: string;
  };
  authentication: {
    type: 'NONE' | 'BASIC' | 'SSH_KEY' | 'OAUTH';
    username?: string;
    password?: string;
    sshKey?: string;
    oauthToken?: string;
  };
  filters: {
    branches?: string[];
    tags?: string[];
    paths?: string[];
  };
  createdDate: string;
  updatedDate: string;
  lastSyncDate?: string;
  status: MirrorStatus;
  statusMessage?: string;
  links: {
    self: Link[];
  };
}

// Mirror configuration request
export interface MirrorConfigurationRequest {
  name: string;
  description?: string;
  sourceRepository: {
    slug: string;
    project: {
      key: string;
    };
  };
  targetRepository: {
    slug: string;
    project: {
      key: string;
    };
  };
  direction: MirrorDirection;
  enabled?: boolean;
  schedule?: {
    enabled: boolean;
    cronExpression?: string;
    timezone?: string;
  };
  authentication?: {
    type: 'NONE' | 'BASIC' | 'SSH_KEY' | 'OAUTH';
    username?: string;
    password?: string;
    sshKey?: string;
    oauthToken?: string;
  };
  filters?: {
    branches?: string[];
    tags?: string[];
    paths?: string[];
  };
}

// Mirror configuration update request
export interface MirrorConfigurationUpdateRequest {
  name?: string;
  description?: string;
  direction?: MirrorDirection;
  enabled?: boolean;
  schedule?: {
    enabled: boolean;
    cronExpression?: string;
    timezone?: string;
  };
  authentication?: {
    type: 'NONE' | 'BASIC' | 'SSH_KEY' | 'OAUTH';
    username?: string;
    password?: string;
    sshKey?: string;
    oauthToken?: string;
  };
  filters?: {
    branches?: string[];
    tags?: string[];
    paths?: string[];
  };
}

// Mirror sync result
export interface MirrorSyncResult {
  id: number;
  configurationId: number;
  status: MirrorStatus;
  statusMessage?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  itemsProcessed: number;
  itemsSkipped: number;
  itemsFailed: number;
  errors: Array<{
    type: string;
    message: string;
    path?: string;
    revision?: string;
  }>;
  links: {
    self: Link[];
  };
}

// Mirror sync result list response
export interface MirrorSyncResultListResponse extends PagedResponse<MirrorSyncResult> {}

// Mirror configuration list response
export interface MirrorConfigurationListResponse extends PagedResponse<MirrorConfiguration> {}

// Mirror query parameters
export interface MirrorQueryParams extends PaginationParams {
  repository?: string;
  project?: string;
  status?: MirrorStatus;
  direction?: MirrorDirection;
}

// Upstream mirror
export interface UpstreamMirror {
  id: number;
  name: string;
  description?: string;
  sourceUrl: string;
  targetRepository: {
    slug: string;
    project: {
      key: string;
    };
  };
  direction: MirrorDirection;
  enabled: boolean;
  schedule: {
    enabled: boolean;
    cronExpression?: string;
    timezone?: string;
  };
  authentication: {
    type: 'NONE' | 'BASIC' | 'SSH_KEY' | 'OAUTH';
    username?: string;
    password?: string;
    sshKey?: string;
    oauthToken?: string;
  };
  filters: {
    branches?: string[];
    tags?: string[];
    paths?: string[];
  };
  createdDate: string;
  updatedDate: string;
  lastSyncDate?: string;
  status: MirrorStatus;
  statusMessage?: string;
  links: {
    self: Link[];
  };
}

// Upstream mirror request
export interface UpstreamMirrorRequest {
  name: string;
  description?: string;
  sourceUrl: string;
  targetRepository: {
    slug: string;
    project: {
      key: string;
    };
  };
  direction: MirrorDirection;
  enabled?: boolean;
  schedule?: {
    enabled: boolean;
    cronExpression?: string;
    timezone?: string;
  };
  authentication?: {
    type: 'NONE' | 'BASIC' | 'SSH_KEY' | 'OAUTH';
    username?: string;
    password?: string;
    sshKey?: string;
    oauthToken?: string;
  };
  filters?: {
    branches?: string[];
    tags?: string[];
    paths?: string[];
  };
}

// Upstream mirror list response
export interface UpstreamMirrorListResponse extends PagedResponse<UpstreamMirror> {}
