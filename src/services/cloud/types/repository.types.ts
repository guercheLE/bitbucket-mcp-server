/**
 * Repository Types for Bitbucket Cloud REST API
 * Based on official documentation: https://developer.atlassian.com/cloud/bitbucket/rest/api-group-repositories/
 */

import { Link, PagedResponse, PaginationParams } from './base.types.js';

// Repository
export interface Repository {
  uuid: string;
  name: string;
  slug: string;
  full_name: string;
  description?: string;
  scm: 'git';
  website?: string;
  owner: {
    uuid: string;
    display_name: string;
    nickname: string;
    type: 'user' | 'team';
    account_id: string;
    links: {
      self: Link;
      html: Link;
      avatar: Link;
    };
  };
  workspace: {
    uuid: string;
    name: string;
    slug: string;
    type: 'workspace';
    links: {
      self: Link;
      html: Link;
      avatar: Link;
    };
  };
  is_private: boolean;
  project?: {
    uuid: string;
    key: string;
    name: string;
    description?: string;
    type: 'project';
    links: {
      self: Link;
      html: Link;
      avatar: Link;
    };
  };
  fork_policy: 'allow_forks' | 'no_public_forks' | 'no_forks';
  created_on: string;
  updated_on: string;
  size: number;
  language?: string;
  has_issues: boolean;
  has_wiki: boolean;
  mainbranch: {
    type: 'branch';
    name: string;
    target: {
      hash: string;
      repository: Repository;
      links: {
        self: Link;
        html: Link;
      };
    };
    links: {
      self: Link;
      html: Link;
      commits: Link;
    };
  };
  links: {
    self: Link;
    html: Link;
    avatar: Link;
    hooks: Link;
    forks: Link;
    downloads: Link;
    commits: Link;
    tags: Link;
    watchers: Link;
    branches: Link;
    clone: Array<{
      href: string;
      name: string;
    }>;
    pullrequests: Link;
  };
}

// Repository Fork
export interface RepositoryFork {
  uuid: string;
  name: string;
  slug: string;
  full_name: string;
  description?: string;
  scm: 'git';
  website?: string;
  owner: {
    uuid: string;
    display_name: string;
    nickname: string;
    type: 'user' | 'team';
    account_id: string;
    links: {
      self: Link;
      html: Link;
      avatar: Link;
    };
  };
  workspace: {
    uuid: string;
    name: string;
    slug: string;
    type: 'workspace';
    links: {
      self: Link;
      html: Link;
      avatar: Link;
    };
  };
  is_private: boolean;
  project?: {
    uuid: string;
    key: string;
    name: string;
    description?: string;
    type: 'project';
    links: {
      self: Link;
      html: Link;
      avatar: Link;
    };
  };
  fork_policy: 'allow_forks' | 'no_public_forks' | 'no_forks';
  created_on: string;
  updated_on: string;
  size: number;
  language?: string;
  has_issues: boolean;
  has_wiki: boolean;
  parent?: Repository;
  links: {
    self: Link;
    html: Link;
    avatar: Link;
    hooks: Link;
    forks: Link;
    downloads: Link;
    commits: Link;
    tags: Link;
    watchers: Link;
    branches: Link;
    clone: Array<{
      href: string;
      name: string;
    }>;
    pullrequests: Link;
  };
}

// Create Repository Request
export interface CreateRepositoryRequest {
  name: string;
  description?: string;
  scm?: 'git';
  website?: string;
  is_private?: boolean;
  fork_policy?: 'allow_forks' | 'no_public_forks' | 'no_forks';
  has_issues?: boolean;
  has_wiki?: boolean;
  project?: {
    key: string;
  };
}

// Update Repository Request
export interface UpdateRepositoryRequest {
  name?: string;
  description?: string;
  website?: string;
  is_private?: boolean;
  fork_policy?: 'allow_forks' | 'no_public_forks' | 'no_forks';
  has_issues?: boolean;
  has_wiki?: boolean;
  project?: {
    key: string;
  };
}

// List Repositories Parameters
export interface ListRepositoriesParams extends PaginationParams {
  role?: 'owner' | 'admin' | 'contributor' | 'member';
  q?: string;
  sort?: 'created_on' | 'updated_on' | 'size' | 'name';
}

// List Repositories Response
export interface ListRepositoriesResponse extends PagedResponse<Repository> {}

// List Repository Forks Parameters
export interface ListRepositoryForksParams extends PaginationParams {
  role?: 'owner' | 'admin' | 'contributor' | 'member';
  q?: string;
  sort?: 'created_on' | 'updated_on' | 'size' | 'name';
}

// List Repository Forks Response
export interface ListRepositoryForksResponse extends PagedResponse<RepositoryFork> {}

// Fork Repository Request
export interface ForkRepositoryRequest {
  name?: string;
  description?: string;
  is_private?: boolean;
  fork_policy?: 'allow_forks' | 'no_public_forks' | 'no_forks';
  has_issues?: boolean;
  has_wiki?: boolean;
  project?: {
    key: string;
  };
}

// Repository Branch
export interface RepositoryBranch {
  name: string;
  target: {
    hash: string;
    repository: Repository;
    links: {
      self: Link;
      html: Link;
    };
  };
  links: {
    self: Link;
    html: Link;
    commits: Link;
  };
  type: 'branch';
}

// Create Branch Request
export interface CreateBranchRequest {
  name: string;
  target: {
    hash: string;
  };
}

// List Repository Branches Parameters
export interface ListRepositoryBranchesParams extends PaginationParams {
  q?: string;
  sort?: 'name' | '-name' | 'target' | '-target';
}

// List Repository Branches Response
export interface ListRepositoryBranchesResponse extends PagedResponse<RepositoryBranch> {}

// Repository Tag
export interface RepositoryTag {
  name: string;
  target: {
    hash: string;
    repository: Repository;
    links: {
      self: Link;
      html: Link;
    };
  };
  links: {
    self: Link;
    html: Link;
    commits: Link;
  };
  type: 'tag';
}

// Create Tag Request
export interface CreateTagRequest {
  name: string;
  target: {
    hash: string;
  };
  message?: string;
}

// List Repository Tags Parameters
export interface ListRepositoryTagsParams extends PaginationParams {
  q?: string;
  sort?: 'name' | '-name' | 'target' | '-target';
}

// List Repository Tags Response
export interface ListRepositoryTagsResponse extends PagedResponse<RepositoryTag> {}

// Repository Commit
export interface RepositoryCommit {
  hash: string;
  repository: Repository;
  links: {
    self: Link;
    html: Link;
    diff: Link;
    patch: Link;
  };
  author: {
    raw: string;
    type: 'author';
    user?: {
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
  };
  summary: {
    raw: string;
    markup: 'markdown' | 'creole' | 'plaintext';
    html: string;
    type: 'rendered';
  };
  parents: Array<{
    hash: string;
    type: 'commit';
    links: {
      self: Link;
      html: Link;
    };
  }>;
  date: string;
  message: string;
  type: 'commit';
}

// List Repository Commits Parameters
export interface ListRepositoryCommitsParams extends PaginationParams {
  include?: string;
  exclude?: string;
  q?: string;
  sort?: 'target' | '-target';
}

// List Repository Commits Response
export interface ListRepositoryCommitsResponse extends PagedResponse<RepositoryCommit> {}

// Repository Webhook
export interface RepositoryWebhook {
  uuid: string;
  url: string;
  description: string;
  subject_type: 'repository';
  subject: {
    uuid: string;
    name: string;
    slug: string;
    links: {
      self: Link;
      html: Link;
      avatar: Link;
    };
  };
  active: boolean;
  events: string[];
  created_on: string;
  updated_on: string;
  links: {
    self: Link;
  };
}

// Create Repository Webhook Request
export interface CreateRepositoryWebhookRequest {
  url: string;
  description: string;
  events: string[];
  active?: boolean;
}

// Update Repository Webhook Request
export interface UpdateRepositoryWebhookRequest {
  url?: string;
  description?: string;
  events?: string[];
  active?: boolean;
}

// List Repository Webhooks Response
export interface ListRepositoryWebhooksResponse extends PagedResponse<RepositoryWebhook> {}

// Repository Variable
export interface RepositoryVariable {
  uuid: string;
  key: string;
  value: string;
  secured: boolean;
  created_on: string;
  updated_on: string;
  links: {
    self: Link;
  };
}

// Create Repository Variable Request
export interface CreateRepositoryVariableRequest {
  key: string;
  value: string;
  secured?: boolean;
}

// Update Repository Variable Request
export interface UpdateRepositoryVariableRequest {
  key?: string;
  value?: string;
  secured?: boolean;
}

// List Repository Variables Response
export interface ListRepositoryVariablesResponse extends PagedResponse<RepositoryVariable> {}
