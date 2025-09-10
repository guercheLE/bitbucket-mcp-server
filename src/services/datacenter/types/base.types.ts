/**
 * Base Types for Bitbucket Data Center REST API
 * Based on official documentation: https://developer.atlassian.com/server/bitbucket/rest/v906/intro/
 */

// Base Link interface
export interface Link {
  rel: string;
  href: string;
}

// Base pagination response structure
export interface PagedResponse<T> {
  size: number;
  limit: number;
  isLastPage: boolean;
  values: T[];
  start: number;
  filter?: string | null;
  nextPageStart?: number;
}

// Base pagination parameters
export interface PaginationParams {
  start?: number;
  limit?: number;
}

// Base error response
export interface ErrorResponse {
  errors: Array<{
    context?: string | null;
    message: string;
    exceptionName?: string | null;
  }>;
}

// Base user interface
export interface User {
  name: string;
  emailAddress: string;
  id: number;
  displayName: string;
  active: boolean;
  slug: string;
  type: 'NORMAL' | 'SERVICE';
  directoryName?: string;
  mutableDetails?: boolean;
  mutableGroups?: boolean;
  lastAuthenticationTimestamp?: number;
  deletionTimestamp?: number;
  links: {
    self: Link[];
  };
}

// Base project interface
export interface Project {
  key: string;
  id: number;
  name: string;
  description?: string;
  public: boolean;
  type: 'NORMAL' | 'PERSONAL';
  created_on: string;
  updated_on: string;
  links: {
    self: Link[];
    avatar: Link[];
  };
}

// Base repository interface
export interface Repository {
  id: number;
  slug: string;
  name: string;
  scmId: string;
  state: 'AVAILABLE' | 'INITIALISING' | 'INITIALISATION_FAILED';
  statusMessage?: string;
  forkable: boolean;
  project: Project;
  public: boolean;
  created_on: string;
  updated_on: string;
  size: number;
  description?: string;
  links: {
    self: Link[];
    clone: Array<{
      href: string;
      name: string;
    }>;
  };
}

// Base commit interface
export interface Commit {
  id: string;
  displayId: string;
  author: User;
  authorTimestamp: number;
  committer: User;
  committerTimestamp: number;
  message: string;
  parents: Array<{
    id: string;
    displayId: string;
  }>;
  properties: Record<string, any>;
  links: {
    self: Link[];
  };
}

// Base pull request interface
export interface PullRequest {
  id: number;
  version: number;
  title: string;
  description?: string;
  state: 'OPEN' | 'MERGED' | 'DECLINED' | 'SUPERSEDED';
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
    role: 'AUTHOR' | 'REVIEWER' | 'PARTICIPANT';
    approved: boolean;
    status: 'UNAPPROVED' | 'NEEDS_WORK' | 'APPROVED';
    lastReviewedCommit?: string;
  };
  reviewers: Array<{
    user: User;
    role: 'AUTHOR' | 'REVIEWER' | 'PARTICIPANT';
    approved: boolean;
    status: 'UNAPPROVED' | 'NEEDS_WORK' | 'APPROVED';
    lastReviewedCommit?: string;
  }>;
  participants: Array<{
    user: User;
    role: 'AUTHOR' | 'REVIEWER' | 'PARTICIPANT';
    approved: boolean;
    status: 'UNAPPROVED' | 'NEEDS_WORK' | 'APPROVED';
    lastReviewedCommit?: string;
  }>;
  properties: Record<string, any>;
  links: {
    self: Link[];
  };
}

// Base webhook interface
export interface Webhook {
  id: number;
  name: string;
  url: string;
  active: boolean;
  events: string[];
  configuration: Record<string, any>;
  scopeType: 'PROJECT' | 'REPOSITORY';
  scope: {
    type: string;
    resourceId: number;
  };
  created_on: string;
  updated_on: string;
  links: {
    self: Link[];
  };
}

// Base branch restriction interface
export interface BranchRestriction {
  id: number;
  type: string;
  matcher: {
    id: string;
    displayId: string;
    type: {
      id: string;
      name: string;
    };
    active: boolean;
  };
  users: User[];
  groups: Array<{
    name: string;
  }>;
  accessKeys: any[];
  permission: 'REPO_READ' | 'REPO_WRITE' | 'REPO_ADMIN';
  created_on: string;
  updated_on: string;
  links: {
    self: Link[];
  };
}

// Base issue interface
export interface Issue {
  id: number;
  version: number;
  title: string;
  description?: string;
  state: 'OPEN' | 'RESOLVED' | 'CLOSED';
  type: 'IMPROVEMENT' | 'NEW_FEATURE' | 'BUG' | 'TASK';
  priority: 'TRIVIAL' | 'MINOR' | 'MAJOR' | 'CRITICAL' | 'BLOCKER';
  created_on: string;
  updated_on: string;
  reporter: User;
  assignee?: User;
  votes: number;
  watchers: number;
  properties: Record<string, any>;
  links: {
    self: Link[];
  };
}

// Base search result interface
export interface SearchResult {
  query: string;
  size: number;
  limit: number;
  isLastPage: boolean;
  values: any[];
  start: number;
  nextPageStart?: number;
  prevPageStart?: number;
}

// Base query parameters
export interface QueryParams extends PaginationParams {
  [key: string]: any;
}

// Base request body
export interface RequestBody {
  [key: string]: any;
}
