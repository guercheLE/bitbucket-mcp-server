/**
 * Commit Types for Bitbucket Cloud REST API
 * Based on: https://developer.atlassian.com/cloud/bitbucket/rest/api-group-commits/
 */

import { PaginationParams } from './base.types.js';

// Commit Types
export interface Commit {
  type: string;
  hash: string;
  date: string;
  author: CommitAuthor;
  message: string;
  summary: CommitSummary;
  parents: CommitParent[];
  rendered?: CommitRendered;
  repository: CommitRepository;
  links: CommitLinks;
}

export interface CommitAuthor {
  type: string;
  raw: string;
  user?: CommitUser;
}

export interface CommitUser {
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

export interface CommitSummary {
  type: string;
  raw: string;
  markup: string;
  html: string;
}

export interface CommitParent {
  type: string;
  hash: string;
  links: {
    self: { href: string };
    html: { href: string };
  };
}

export interface CommitRendered {
  message: CommitSummary;
}

export interface CommitRepository {
  type: string;
  name: string;
  full_name: string;
  uuid: string;
  links: {
    self: { href: string };
    html: { href: string };
    avatar: { href: string };
  };
}

export interface CommitLinks {
  self: { href: string };
  comments: { href: string };
  patch: { href: string };
  html: { href: string };
  diff: { href: string };
  approve: { href: string };
}

export interface CommitComment {
  type: string;
  id: number;
  content: CommitSummary;
  created_on: string;
  updated_on: string;
  user: CommitUser;
  deleted: boolean;
  parent?: CommitComment;
  inline?: CommitInline;
  links: {
    self: { href: string };
    html: { href: string };
  };
}

export interface CommitInline {
  path: string;
  from?: number;
  to?: number;
}

export interface CommitDiff {
  type: string;
  context: string;
  old_path?: string;
  new_path?: string;
  hunks: CommitHunk[];
}

export interface CommitHunk {
  type: string;
  old_start: number;
  old_lines: number;
  new_start: number;
  new_lines: number;
  content: string;
  context: string;
}

export interface CommitPatch {
  type: string;
  subject: string;
  message: string;
  author: CommitAuthor;
  date: string;
  parents: CommitParent[];
  diff: CommitDiff;
}

// Parameter Types
export interface GetCommitParams {
  workspace: string;
  repo_slug: string;
  commit: string;
}

export interface ListCommitsParams extends PaginationParams {
  workspace: string;
  repo_slug: string;
  include?: string;
  exclude?: string;
  q?: string;
  sort?: string;
}

export interface ListCommitsForRevisionParams extends PaginationParams {
  workspace: string;
  repo_slug: string;
  revision: string;
  include?: string;
  exclude?: string;
  q?: string;
  sort?: string;
}

export interface CompareCommitsParams {
  workspace: string;
  repo_slug: string;
  spec: string;
}

export interface CreateCommitCommentParams {
  workspace: string;
  repo_slug: string;
  commit: string;
  content: string;
  inline?: CommitInline;
}

export interface UpdateCommitCommentParams {
  workspace: string;
  repo_slug: string;
  commit: string;
  comment_id: number;
  content: string;
}

export interface DeleteCommitCommentParams {
  workspace: string;
  repo_slug: string;
  commit: string;
  comment_id: number;
}
