/**
 * Diff Types for Bitbucket Cloud REST API
 * Based on: https://developer.atlassian.com/cloud/bitbucket/rest/api-group-commits/
 */

import { PaginationParams, Link } from './base.types.js';

// Diff Types
export interface DiffStat {
  type: 'diffstat';
  status: 'added' | 'removed' | 'modified' | 'renamed';
  lines_removed: number;
  lines_added: number;
  old?: {
    path: string;
    escaped_path: string;
    type: 'commit_file';
    links: {
      self: Link;
    };
  };
  new?: {
    path: string;
    escaped_path: string;
    type: 'commit_file';
    links: {
      self: Link;
    };
  };
}

// Parameter Types
export interface GetDiffParams {
  workspace: string;
  repo_slug: string;
  spec: string;
  context?: number;
  path?: string;
  ignore_whitespace?: boolean;
  binary?: boolean;
  renames?: boolean;
  merge?: boolean;
  topic?: boolean;
}

export interface GetDiffStatParams {
  workspace: string;
  repo_slug: string;
  spec: string;
  ignore_whitespace?: boolean;
  merge?: boolean;
  path?: string;
  renames?: boolean;
  topic?: boolean;
}

export interface GetPatchParams {
  workspace: string;
  repo_slug: string;
  spec: string;
}

export interface GetMergeBaseParams {
  workspace: string;
  repo_slug: string;
  revspec: string;
}
