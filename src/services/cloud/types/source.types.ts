/**
 * Source Types for Bitbucket Cloud REST API
 * Based on: https://developer.atlassian.com/cloud/bitbucket/rest/api-group-source/
 */

import { PaginationParams } from './base.types.js';

// Source Types
export interface CommitFile {
  type: 'commit_file';
  path: string;
  commit: {
    type: string;
    hash: string;
    links: {
      self: { href: string };
      html: { href: string };
    };
  };
  links: {
    self: { href: string };
    meta: { href: string };
  };
  attributes: string[];
  size: number;
}

export interface CommitDirectory {
  type: 'commit_directory';
  path: string;
  commit: {
    type: string;
    hash: string;
    links: {
      self: { href: string };
      html: { href: string };
    };
  };
  links: {
    self: { href: string };
    meta: { href: string };
  };
}

export interface FileHistoryEntry {
  commit: {
    date: string;
  };
  path: string;
}

export interface CreateCommitRequest {
  message: string;
  author?: string;
  parents?: string;
  files?: string[];
  branch?: string;
}

// Parameter Types
export interface ListFileHistoryParams extends PaginationParams {
  workspace: string;
  repo_slug: string;
  commit: string;
  path: string;
  renames?: boolean;
  q?: string;
  sort?: string;
}

export interface GetRootDirectoryParams {
  workspace: string;
  repo_slug: string;
  format?: string;
}

export interface CreateCommitParams {
  workspace: string;
  repo_slug: string;
  commit: CreateCommitRequest;
  files?: Record<string, string | Buffer>;
}

export interface GetFileOrDirectoryParams extends PaginationParams {
  workspace: string;
  repo_slug: string;
  commit: string;
  path: string;
  format?: string;
  q?: string;
  sort?: string;
  max_depth?: number;
}
