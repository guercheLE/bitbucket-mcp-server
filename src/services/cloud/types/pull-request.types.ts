/**
 * Pull Request Types for Bitbucket Cloud REST API
 * Based on official documentation: https://developer.atlassian.com/cloud/bitbucket/rest/api-group-pullrequests/
 */

import { Link, PagedResponse, PaginationParams } from './base.types.js';
import { Repository } from './repository.types.js';

// Pull Request
export interface PullRequest {
  id: number;
  title: string;
  description?: string;
  state: 'OPEN' | 'MERGED' | 'DECLINED' | 'SUPERSEDED';
  author: {
    uuid: string;
    display_name: string;
    nickname: string;
    type: 'user';
    account_id: string;
    links: {
      self: Link;
      html: Link;
      avatar: Link;
    };
  };
  source: {
    branch: {
      name: string;
    };
    commit: {
      hash: string;
      type: 'commit';
      links: {
        self: Link;
        html: Link;
      };
    };
    repository: Repository;
  };
  destination: {
    branch: {
      name: string;
    };
    commit: {
      hash: string;
      type: 'commit';
      links: {
        self: Link;
        html: Link;
      };
    };
    repository: Repository;
  };
  merge_commit?: {
    hash: string;
    type: 'commit';
    links: {
      self: Link;
      html: Link;
    };
  };
  participants: Array<{
    user: {
      uuid: string;
      display_name: string;
      nickname: string;
      type: 'user';
      account_id: string;
      links: {
        self: Link;
        html: Link;
        avatar: Link;
      };
    };
    role: 'REVIEWER' | 'PARTICIPANT';
    approved: boolean;
    state: 'approved' | 'changes_requested' | 'no_action';
    participated_on?: string;
  }>;
  reviewers: Array<{
    user: {
      uuid: string;
      display_name: string;
      nickname: string;
      type: 'user';
      account_id: string;
      links: {
        self: Link;
        html: Link;
        avatar: Link;
      };
    };
    type: 'user';
  }>;
  close_source_branch: boolean;
  closed_by?: {
    uuid: string;
    display_name: string;
    nickname: string;
    type: 'user';
    account_id: string;
    links: {
      self: Link;
      html: Link;
      avatar: Link;
    };
  };
  reason?: string;
  created_on: string;
  updated_on: string;
  links: {
    self: Link;
    html: Link;
    diff: Link;
    patch: Link;
    decline: Link;
    approve: Link;
    request_changes: Link;
    statuses: Link;
    comments: Link;
    activity: Link;
    merge: Link;
  };
}

// Create Pull Request Request
export interface CreatePullRequestRequest {
  title: string;
  description?: string;
  source: {
    branch: {
      name: string;
    };
  };
  destination: {
    branch: {
      name: string;
    };
  };
  close_source_branch?: boolean;
  reviewers?: Array<{
    uuid: string;
  }>;
}

// Update Pull Request Request
export interface UpdatePullRequestRequest {
  title?: string;
  description?: string;
  destination?: {
    branch: {
      name: string;
    };
  };
  close_source_branch?: boolean;
  reviewers?: Array<{
    uuid: string;
  }>;
}

// List Pull Requests Parameters
export interface ListPullRequestsParams extends PaginationParams {
  state?: 'OPEN' | 'MERGED' | 'DECLINED' | 'SUPERSEDED';
  q?: string;
  sort?: 'created_on' | '-created_on' | 'updated_on' | '-updated_on';
}

// List Pull Requests Response
export interface ListPullRequestsResponse extends PagedResponse<PullRequest> {}

// Pull Request Comment
export interface PullRequestComment {
  id: number;
  content: {
    raw: string;
    markup: 'markdown' | 'creole' | 'plaintext';
    html: string;
    type: 'rendered';
  };
  user: {
    uuid: string;
    display_name: string;
    nickname: string;
    type: 'user';
    account_id: string;
    links: {
      self: Link;
      html: Link;
      avatar: Link;
    };
  };
  created_on: string;
  updated_on: string;
  deleted: boolean;
  parent?: {
    id: number;
    links: {
      self: Link;
      html: Link;
    };
  };
  inline?: {
    path: string;
    from?: number;
    to?: number;
  };
  links: {
    self: Link;
    html: Link;
  };
  type: 'pullrequest_comment';
}

// Create Pull Request Comment Request
export interface CreatePullRequestCommentRequest {
  content: {
    raw: string;
  };
  inline?: {
    path: string;
    from?: number;
    to?: number;
  };
  parent?: {
    id: number;
  };
}

// Update Pull Request Comment Request
export interface UpdatePullRequestCommentRequest {
  content: {
    raw: string;
  };
}

// List Pull Request Comments Parameters
export interface ListPullRequestCommentsParams extends PaginationParams {
  q?: string;
  sort?: 'created_on' | '-created_on' | 'updated_on' | '-updated_on';
}

// List Pull Request Comments Response
export interface ListPullRequestCommentsResponse extends PagedResponse<PullRequestComment> {}

// Pull Request Activity
export interface PullRequestActivity {
  id: number;
  user: {
    uuid: string;
    display_name: string;
    nickname: string;
    type: 'user';
    account_id: string;
    links: {
      self: Link;
      html: Link;
      avatar: Link;
    };
  };
  created_on: string;
  action:
    | 'approved'
    | 'unapproved'
    | 'changes_requested'
    | 'commented'
    | 'declined'
    | 'merged'
    | 'opened'
    | 'updated';
  pull_request: {
    id: number;
    title: string;
    links: {
      self: Link;
      html: Link;
    };
  };
  changes?: {
    status?: {
      old: string;
      new: string;
    };
    title?: {
      old: string;
      new: string;
    };
    description?: {
      old: string;
      new: string;
    };
    reviewers?: {
      added?: Array<{
        user: {
          uuid: string;
          display_name: string;
          nickname: string;
          type: 'user';
          account_id: string;
          links: {
            self: Link;
            html: Link;
            avatar: Link;
          };
        };
      }>;
      removed?: Array<{
        user: {
          uuid: string;
          display_name: string;
          nickname: string;
          type: 'user';
          account_id: string;
          links: {
            self: Link;
            html: Link;
            avatar: Link;
          };
        };
      }>;
    };
  };
  comment?: PullRequestComment;
  links: {
    self: Link;
    html: Link;
  };
  type: 'pullrequest_activity';
}

// List Pull Request Activities Parameters
export interface ListPullRequestActivitiesParams extends PaginationParams {
  q?: string;
  sort?: 'created_on' | '-created_on';
}

// List Pull Request Activities Response
export interface ListPullRequestActivitiesResponse extends PagedResponse<PullRequestActivity> {}

// Pull Request Status
export interface PullRequestStatus {
  uuid: string;
  key: string;
  refname: string;
  url: string;
  state: 'SUCCESSFUL' | 'FAILED' | 'INPROGRESS' | 'STOPPED';
  name: string;
  description: string;
  created_on: string;
  updated_on: string;
  links: {
    self: Link;
    commit: Link;
  };
  type: 'build' | 'test' | 'security' | 'quality' | 'deployment';
}

// Create Pull Request Status Request
export interface CreatePullRequestStatusRequest {
  key: string;
  url: string;
  state: 'SUCCESSFUL' | 'FAILED' | 'INPROGRESS' | 'STOPPED';
  name: string;
  description: string;
  type?: 'build' | 'test' | 'security' | 'quality' | 'deployment';
}

// List Pull Request Statuses Response
export interface ListPullRequestStatusesResponse extends PagedResponse<PullRequestStatus> {}

// Pull Request Diff
export interface PullRequestDiff {
  type: 'diff';
  status: 'new' | 'removed' | 'renamed' | 'modified';
  lines_added: number;
  lines_removed: number;
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
  diff?: string;
}

// Get Pull Request Diff Response
export interface GetPullRequestDiffResponse {
  type: 'diff';
  status: 'new' | 'removed' | 'renamed' | 'modified';
  lines_added: number;
  lines_removed: number;
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
  diff?: string;
}

// Pull Request Patch
export interface PullRequestPatch {
  type: 'patch';
  status: 'new' | 'removed' | 'renamed' | 'modified';
  lines_added: number;
  lines_removed: number;
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
  patch?: string;
}

// Get Pull Request Patch Response
export interface GetPullRequestPatchResponse {
  type: 'patch';
  status: 'new' | 'removed' | 'renamed' | 'modified';
  lines_added: number;
  lines_removed: number;
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
  patch?: string;
}
