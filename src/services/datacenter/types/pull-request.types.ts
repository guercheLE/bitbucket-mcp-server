/**
 * Pull Request Types for Bitbucket Data Center REST API
 * Based on official documentation: https://developer.atlassian.com/server/bitbucket/rest/v906/intro/
 */

import { Link, PagedResponse, PaginationParams, User, Repository } from './base.types.js';

// Pull request state enum
export type PullRequestState = 'OPEN' | 'MERGED' | 'DECLINED' | 'SUPERSEDED';

// Pull request role enum
export type PullRequestRole = 'AUTHOR' | 'REVIEWER' | 'PARTICIPANT';

// Pull request status enum
export type PullRequestStatus = 'UNAPPROVED' | 'NEEDS_WORK' | 'APPROVED';

// Pull request merge strategy enum
export type MergeStrategy = 'NO_FF' | 'FF_ONLY' | 'FF';

// Pull request creation request
export interface PullRequestCreateRequest {
  title: string;
  description?: string;
  fromRef: {
    id: string;
    repository: {
      slug: string;
      project: {
        key: string;
      };
    };
  };
  toRef: {
    id: string;
    repository: {
      slug: string;
      project: {
        key: string;
      };
    };
  };
  reviewers?: Array<{
    user: {
      name: string;
    };
  }>;
  closeSourceBranch?: boolean;
}

// Pull request update request
export interface PullRequestUpdateRequest {
  version: number;
  title?: string;
  description?: string;
  reviewers?: Array<{
    user: {
      name: string;
    };
  }>;
  closeSourceBranch?: boolean;
}

// Pull request response
export interface PullRequestResponse {
  id: number;
  version: number;
  title: string;
  description?: string;
  state: PullRequestState;
  open: boolean;
  closed: boolean;
  created_on: string;
  updated_on: string;
  fromRef: {
    id: string;
    displayId: string;
    latestCommit: string;
    repository: Repository;
  };
  toRef: {
    id: string;
    displayId: string;
    latestCommit: string;
    repository: Repository;
  };
  locked: boolean;
  author: {
    user: User;
    role: PullRequestRole;
    approved: boolean;
    status: PullRequestStatus;
    lastReviewedCommit?: string;
  };
  reviewers: Array<{
    user: User;
    role: PullRequestRole;
    approved: boolean;
    status: PullRequestStatus;
    lastReviewedCommit?: string;
  }>;
  participants: Array<{
    user: User;
    role: PullRequestRole;
    approved: boolean;
    status: PullRequestStatus;
    lastReviewedCommit?: string;
  }>;
  properties: Record<string, any>;
  links: {
    self: Link[];
  };
}

// Pull request list response
export interface PullRequestListResponse extends PagedResponse<PullRequestResponse> {}

// Pull request merge request
export interface PullRequestMergeRequest {
  version: number;
  message?: string;
  closeSourceBranch?: boolean;
  strategy?: MergeStrategy;
}

// Pull request merge response
export interface PullRequestMergeResponse {
  id: number;
  version: number;
  title: string;
  description?: string;
  state: PullRequestState;
  open: boolean;
  closed: boolean;
  created_on: string;
  updated_on: string;
  fromRef: {
    id: string;
    displayId: string;
    latestCommit: string;
    repository: Repository;
  };
  toRef: {
    id: string;
    displayId: string;
    latestCommit: string;
    repository: Repository;
  };
  locked: boolean;
  author: {
    user: User;
    role: PullRequestRole;
    approved: boolean;
    status: PullRequestStatus;
    lastReviewedCommit?: string;
  };
  reviewers: Array<{
    user: User;
    role: PullRequestRole;
    approved: boolean;
    status: PullRequestStatus;
    lastReviewedCommit?: string;
  }>;
  participants: Array<{
    user: User;
    role: PullRequestRole;
    approved: boolean;
    status: PullRequestStatus;
    lastReviewedCommit?: string;
  }>;
  properties: Record<string, any>;
  links: {
    self: Link[];
  };
}

// Pull request decline request
export interface PullRequestDeclineRequest {
  version: number;
  message?: string;
}

// Pull request decline response
export interface PullRequestDeclineResponse {
  id: number;
  version: number;
  title: string;
  description?: string;
  state: PullRequestState;
  open: boolean;
  closed: boolean;
  created_on: string;
  updated_on: string;
  fromRef: {
    id: string;
    displayId: string;
    latestCommit: string;
    repository: Repository;
  };
  toRef: {
    id: string;
    displayId: string;
    latestCommit: string;
    repository: Repository;
  };
  locked: boolean;
  author: {
    user: User;
    role: PullRequestRole;
    approved: boolean;
    status: PullRequestStatus;
    lastReviewedCommit?: string;
  };
  reviewers: Array<{
    user: User;
    role: PullRequestRole;
    approved: boolean;
    status: PullRequestStatus;
    lastReviewedCommit?: string;
  }>;
  participants: Array<{
    user: User;
    role: PullRequestRole;
    approved: boolean;
    status: PullRequestStatus;
    lastReviewedCommit?: string;
  }>;
  properties: Record<string, any>;
  links: {
    self: Link[];
  };
}

// Pull request reopen request
export interface PullRequestReopenRequest {
  version: number;
  message?: string;
}

// Pull request reopen response
export interface PullRequestReopenResponse {
  id: number;
  version: number;
  title: string;
  description?: string;
  state: PullRequestState;
  open: boolean;
  closed: boolean;
  created_on: string;
  updated_on: string;
  fromRef: {
    id: string;
    displayId: string;
    latestCommit: string;
    repository: Repository;
  };
  toRef: {
    id: string;
    displayId: string;
    latestCommit: string;
    repository: Repository;
  };
  locked: boolean;
  author: {
    user: User;
    role: PullRequestRole;
    approved: boolean;
    status: PullRequestStatus;
    lastReviewedCommit?: string;
  };
  reviewers: Array<{
    user: User;
    role: PullRequestRole;
    approved: boolean;
    status: PullRequestStatus;
    lastReviewedCommit?: string;
  }>;
  participants: Array<{
    user: User;
    role: PullRequestRole;
    approved: boolean;
    status: PullRequestStatus;
    lastReviewedCommit?: string;
  }>;
  properties: Record<string, any>;
  links: {
    self: Link[];
  };
}

// Pull request comment
export interface PullRequestComment {
  id: number;
  version: number;
  text: string;
  author: User;
  created_on: string;
  updated_on: string;
  comments: PullRequestComment[];
  properties: Record<string, any>;
  links: {
    self: Link[];
  };
}

// Pull request comment request
export interface PullRequestCommentRequest {
  text: string;
  parent?: {
    id: number;
  };
}

// Pull request comment update request
export interface PullRequestCommentUpdateRequest {
  version: number;
  text: string;
}

// Pull request comment list response
export interface PullRequestCommentListResponse extends PagedResponse<PullRequestComment> {}

// Pull request activity
export interface PullRequestActivity {
  id: number;
  created_on: string;
  user: User;
  action: string;
  commentAction?: string;
  comment?: PullRequestComment;
  fromHash?: string;
  toHash?: string;
  previousFromHash?: string;
  previousToHash?: string;
  properties: Record<string, any>;
  links: {
    self: Link[];
  };
}

// Pull request activity list response
export interface PullRequestActivityListResponse extends PagedResponse<PullRequestActivity> {}

// Pull request query parameters
export interface PullRequestQueryParams extends PaginationParams {
  state?: PullRequestState;
  order?: 'NEWEST' | 'OLDEST';
  role1?: PullRequestRole;
  role2?: PullRequestRole;
  role3?: PullRequestRole;
  username?: string;
  start?: number;
  limit?: number;
}
