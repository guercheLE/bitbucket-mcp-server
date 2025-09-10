/**
 * Snippet Types for Bitbucket Cloud REST API
 * Based on: https://developer.atlassian.com/cloud/bitbucket/rest/api-group-snippets/
 */

import { PaginationParams } from './base.types.js';

// Snippet Types
export interface Snippet {
  type: string;
  id: number;
  title: string;
  scm: string;
  created_on: string;
  updated_on: string;
  owner: SnippetOwner;
  creator: SnippetCreator;
  is_private: boolean;
  links: SnippetLinks;
}

export interface SnippetOwner {
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

export interface SnippetCreator {
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

export interface SnippetLinks {
  self: { href: string };
  html: { href: string };
  commits: { href: string };
  patch: { href: string };
  diff: { href: string };
  clone: { href: string }[];
}

export interface SnippetComment {
  type: string;
  id: number;
  content: SnippetContent;
  created_on: string;
  updated_on: string;
  user: SnippetOwner;
  deleted: boolean;
  parent?: SnippetComment;
  inline?: SnippetInline;
  links: {
    self: { href: string };
    html: { href: string };
  };
}

export interface SnippetContent {
  type: string;
  raw: string;
  markup: string;
  html: string;
}

export interface SnippetInline {
  path: string;
  from?: number;
  to?: number;
}

export interface SnippetCommit {
  type: string;
  hash: string;
  date: string;
  author: SnippetAuthor;
  message: string;
  summary: SnippetContent;
  parents: SnippetParent[];
  links: {
    self: { href: string };
    html: { href: string };
    diff: { href: string };
    patch: { href: string };
  };
}

export interface SnippetAuthor {
  type: string;
  raw: string;
  user?: SnippetOwner;
}

export interface SnippetParent {
  type: string;
  hash: string;
  links: {
    self: { href: string };
    html: { href: string };
  };
}

export interface SnippetFile {
  type: string;
  path: string;
  size: number;
  links: {
    self: { href: string };
    meta: { href: string };
  };
}

export interface SnippetWatcher {
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

// Request Types
export interface CreateSnippetRequest {
  title: string;
  scm: string;
  is_private: boolean;
  files: {
    [filename: string]: {
      content: string;
    };
  };
  description?: string;
}

export interface UpdateSnippetRequest {
  title?: string;
  is_private?: boolean;
  description?: string;
}

export interface CreateSnippetCommentRequest {
  content: string;
  inline?: SnippetInline;
}

export interface UpdateSnippetCommentRequest {
  content: string;
}

// Parameter Types
export interface ListSnippetsParams extends PaginationParams {
  role?: 'owner' | 'contributor' | 'member';
}

export interface ListWorkspaceSnippetsParams extends PaginationParams {
  workspace: string;
  role?: 'owner' | 'contributor' | 'member';
}

export interface GetSnippetParams {
  workspace: string;
  encoded_id: string;
}

export interface UpdateSnippetParams {
  workspace: string;
  encoded_id: string;
  snippet: UpdateSnippetRequest;
}

export interface DeleteSnippetParams {
  workspace: string;
  encoded_id: string;
}

export interface ListSnippetCommentsParams extends PaginationParams {
  workspace: string;
  encoded_id: string;
}

export interface CreateSnippetCommentParams {
  workspace: string;
  encoded_id: string;
  comment: CreateSnippetCommentRequest;
}

export interface GetSnippetCommentParams {
  workspace: string;
  encoded_id: string;
  comment_id: number;
}

export interface UpdateSnippetCommentParams {
  workspace: string;
  encoded_id: string;
  comment_id: number;
  comment: UpdateSnippetCommentRequest;
}

export interface DeleteSnippetCommentParams {
  workspace: string;
  encoded_id: string;
  comment_id: number;
}

export interface ListSnippetCommitsParams extends PaginationParams {
  workspace: string;
  encoded_id: string;
}

export interface GetSnippetCommitParams {
  workspace: string;
  encoded_id: string;
  revision: string;
}

export interface GetSnippetFileParams {
  workspace: string;
  encoded_id: string;
  path: string;
  node_id?: string;
}

export interface WatchSnippetParams {
  workspace: string;
  encoded_id: string;
}

export interface ListSnippetWatchersParams extends PaginationParams {
  workspace: string;
  encoded_id: string;
}

export interface GetSnippetRevisionParams {
  workspace: string;
  encoded_id: string;
  node_id: string;
}

export interface UpdateSnippetRevisionParams {
  workspace: string;
  encoded_id: string;
  node_id: string;
  snippet: UpdateSnippetRequest;
}

export interface DeleteSnippetRevisionParams {
  workspace: string;
  encoded_id: string;
  node_id: string;
}

export interface GetSnippetDiffParams {
  workspace: string;
  encoded_id: string;
  revision: string;
}

export interface GetSnippetPatchParams {
  workspace: string;
  encoded_id: string;
  revision: string;
}
