/**
 * Issue Types for Bitbucket Cloud REST API
 * Based on: https://developer.atlassian.com/cloud/bitbucket/rest/api-group-issue-tracker/
 */

import { PaginationParams } from './base.types.js';

// Issue Types
export interface Issue {
  type: string;
  id: number;
  title: string;
  content: IssueContent;
  reporter: IssueUser;
  assignee?: IssueUser;
  component?: IssueComponent;
  milestone?: IssueMilestone;
  version?: IssueVersion;
  priority: string;
  state: string;
  responsible?: IssueUser;
  kind: string;
  votes: number;
  watches: number;
  content_updated_on: string;
  created_on: string;
  updated_on: string;
  edited_on?: string;
  links: IssueLinks;
}

export interface IssueContent {
  type: string;
  raw: string;
  markup: string;
  html: string;
}

export interface IssueUser {
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

export interface IssueComponent {
  type: string;
  id: number;
  name: string;
  links: {
    self: { href: string };
  };
}

export interface IssueMilestone {
  type: string;
  id: number;
  name: string;
  links: {
    self: { href: string };
  };
}

export interface IssueVersion {
  type: string;
  id: number;
  name: string;
  links: {
    self: { href: string };
  };
}

export interface IssueLinks {
  self: { href: string };
  html: { href: string };
  comments: { href: string };
  attachments: { href: string };
  watch: { href: string };
  vote: { href: string };
}

export interface IssueComment {
  type: string;
  id: number;
  content: IssueContent;
  created_on: string;
  updated_on: string;
  user: IssueUser;
  deleted: boolean;
  parent?: IssueComment;
  links: {
    self: { href: string };
    html: { href: string };
  };
}

export interface IssueChange {
  type: string;
  id: number;
  changes: IssueChangeDetail;
  created_on: string;
  user: IssueUser;
  links: {
    self: { href: string };
    html: { href: string };
  };
}

export interface IssueChangeDetail {
  [key: string]: {
    old?: string;
    new?: string;
  };
}

export interface IssueAttachment {
  type: string;
  name: string;
  path: string;
  size: number;
  links: {
    self: { href: string };
  };
}

// Request Types
export interface CreateIssueRequest {
  title: string;
  content?: string;
  kind?: string;
  priority?: string;
  assignee?: string;
  component?: string;
  milestone?: string;
  version?: string;
}

export interface UpdateIssueRequest {
  title?: string;
  content?: string;
  kind?: string;
  priority?: string;
  assignee?: string;
  component?: string;
  milestone?: string;
  version?: string;
  state?: string;
}

export interface CreateIssueCommentRequest {
  content: string;
  parent?: number;
}

export interface UpdateIssueCommentRequest {
  content: string;
}

export interface CreateIssueChangeRequest {
  changes: IssueChangeDetail;
}

// Parameter Types
export interface ListIssuesParams extends PaginationParams {
  workspace: string;
  repo_slug: string;
  q?: string;
  sort?: string;
}

export interface GetIssueParams {
  workspace: string;
  repo_slug: string;
  issue_id: number;
}

export interface CreateIssueParams {
  workspace: string;
  repo_slug: string;
  issue: CreateIssueRequest;
}

export interface UpdateIssueParams {
  workspace: string;
  repo_slug: string;
  issue_id: number;
  issue: UpdateIssueRequest;
}

export interface DeleteIssueParams {
  workspace: string;
  repo_slug: string;
  issue_id: number;
}

export interface ListIssueCommentsParams extends PaginationParams {
  workspace: string;
  repo_slug: string;
  issue_id: number;
}

export interface CreateIssueCommentParams {
  workspace: string;
  repo_slug: string;
  issue_id: number;
  comment: CreateIssueCommentRequest;
}

export interface GetIssueCommentParams {
  workspace: string;
  repo_slug: string;
  issue_id: number;
  comment_id: number;
}

export interface UpdateIssueCommentParams {
  workspace: string;
  repo_slug: string;
  issue_id: number;
  comment_id: number;
  comment: UpdateIssueCommentRequest;
}

export interface DeleteIssueCommentParams {
  workspace: string;
  repo_slug: string;
  issue_id: number;
  comment_id: number;
}

export interface ListIssueChangesParams extends PaginationParams {
  workspace: string;
  repo_slug: string;
  issue_id: number;
}

export interface CreateIssueChangeParams {
  workspace: string;
  repo_slug: string;
  issue_id: number;
  change: CreateIssueChangeRequest;
}

export interface GetIssueChangeParams {
  workspace: string;
  repo_slug: string;
  issue_id: number;
  change_id: number;
}

export interface ListIssueAttachmentsParams extends PaginationParams {
  workspace: string;
  repo_slug: string;
  issue_id: number;
}

export interface GetIssueAttachmentParams {
  workspace: string;
  repo_slug: string;
  issue_id: number;
  path: string;
}

export interface DeleteIssueAttachmentParams {
  workspace: string;
  repo_slug: string;
  issue_id: number;
  path: string;
}

export interface VoteIssueParams {
  workspace: string;
  repo_slug: string;
  issue_id: number;
}

export interface WatchIssueParams {
  workspace: string;
  repo_slug: string;
  issue_id: number;
}

export interface ListComponentsParams extends PaginationParams {
  workspace: string;
  repo_slug: string;
}

export interface GetComponentParams {
  workspace: string;
  repo_slug: string;
  component_id: number;
}

export interface ListMilestonesParams extends PaginationParams {
  workspace: string;
  repo_slug: string;
}

export interface GetMilestoneParams {
  workspace: string;
  repo_slug: string;
  milestone_id: number;
}

export interface ListVersionsParams extends PaginationParams {
  workspace: string;
  repo_slug: string;
}

export interface GetVersionParams {
  workspace: string;
  repo_slug: string;
  version_id: number;
}
