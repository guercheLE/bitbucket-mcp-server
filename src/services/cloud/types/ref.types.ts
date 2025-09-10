/**
 * Ref Types for Bitbucket Cloud REST API
 * Based on: https://developer.atlassian.com/cloud/bitbucket/rest/api-group-refs/
 */

import { PaginationParams } from './base.types.js';

// Ref Types
export interface Ref {
  type: string;
  links: {
    self: { href: string; name?: string };
    commits: { href: string; name?: string };
    html: { href: string; name?: string };
  };
  name: string;
  target: {
    type: string;
    hash: string;
    repository: {
      type: string;
      name: string;
      full_name: string;
      uuid: string;
      links: {
        self: { href: string };
        html: { href: string };
        avatar: { href: string };
      };
    };
    links: {
      self: { href: string };
      comments: { href: string };
      patch: { href: string };
      html: { href: string };
      diff: { href: string };
      approve: { href: string };
      statuses: { href: string };
    };
    author: {
      raw: string;
      type: string;
      user?: {
        display_name: string;
        uuid: string;
        links: {
          self: { href: string };
          html: { href: string };
          avatar: { href: string };
        };
        nickname: string;
        type: string;
        account_id: string;
      };
    };
    parents: Array<{
      hash: string;
      type: string;
      links: {
        self: { href: string };
        html: { href: string };
      };
    }>;
    date: string;
    message: string;
  };
}

export interface Branch extends Ref {
  type: 'branch';
  default_merge_strategy: string;
  merge_strategies: string[];
}

export interface Tag extends Ref {
  type: 'tag';
  message: string;
  date: string;
  tagger: {
    type: string;
    raw: string;
    user?: {
      display_name: string;
      uuid: string;
      links: {
        self: { href: string };
        html: { href: string };
        avatar: { href: string };
      };
      nickname: string;
      type: string;
      account_id: string;
    };
  };
}

// Request Types
export interface CreateRefBranchRequest {
  name: string;
  target: {
    hash: string;
  };
}

export interface CreateRefTagRequest {
  name: string;
  target: {
    hash: string;
  };
  message?: string;
}

// Parameter Types
export interface ListRefsParams extends PaginationParams {
  workspace: string;
  repo_slug: string;
  q?: string;
  sort?: string;
}

export interface ListBranchesParams extends PaginationParams {
  workspace: string;
  repo_slug: string;
  q?: string;
  sort?: string;
}

export interface CreateBranchParams {
  workspace: string;
  repo_slug: string;
  branch: CreateRefBranchRequest;
}

export interface GetBranchParams {
  workspace: string;
  repo_slug: string;
  name: string;
}

export interface DeleteBranchParams {
  workspace: string;
  repo_slug: string;
  name: string;
}

export interface ListTagsParams extends PaginationParams {
  workspace: string;
  repo_slug: string;
  q?: string;
  sort?: string;
}

export interface CreateTagParams {
  workspace: string;
  repo_slug: string;
  tag: CreateRefTagRequest;
}

export interface GetTagParams {
  workspace: string;
  repo_slug: string;
  name: string;
}

export interface DeleteTagParams {
  workspace: string;
  repo_slug: string;
  name: string;
}
