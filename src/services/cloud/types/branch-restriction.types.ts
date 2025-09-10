/**
 * Branch Restriction Types for Bitbucket Cloud REST API
 * Based on: https://developer.atlassian.com/cloud/bitbucket/rest/api-group-branch-restrictions/
 */

import { PaginationParams, Link } from './base.types.js';

// Branch Restriction Types
export type BranchRestrictionKind =
  | 'push'
  | 'force'
  | 'delete'
  | 'restrict_merges'
  | 'require_tasks_to_be_completed'
  | 'require_approvals_to_merge'
  | 'require_default_reviewer_approvals_to_merge'
  | 'require_no_changes_requested'
  | 'require_passing_builds_to_merge'
  | 'require_commits_behind'
  | 'reset_pullrequest_approvals_on_change'
  | 'smart_reset_pullrequest_approvals'
  | 'reset_pullrequest_changes_requested_on_change'
  | 'require_all_dependencies_merged'
  | 'enforce_merge_checks'
  | 'allow_auto_merge_when_builds_pass';

export type BranchMatchKind = 'glob' | 'branching_model';

export type BranchType = 'production' | 'development' | 'bugfix' | 'release' | 'feature' | 'hotfix';

export interface BranchRestriction {
  type: string;
  links: {
    self: Link;
  };
  id: number;
  kind: BranchRestrictionKind;
  branch_match_kind: BranchMatchKind;
  branch_type?: BranchType;
  pattern?: string;
  value?: number;
  users: Array<{
    type: string;
  }>;
  groups: Array<{
    type: string;
  }>;
}

// Request Types
export interface CreateBranchRestrictionRequest {
  kind: BranchRestrictionKind;
  branch_match_kind: BranchMatchKind;
  branch_type?: BranchType;
  pattern?: string;
  value?: number;
  users?: Array<{
    type: string;
  }>;
  groups?: Array<{
    type: string;
  }>;
}

export interface UpdateBranchRestrictionRequest {
  kind?: BranchRestrictionKind;
  branch_match_kind?: BranchMatchKind;
  branch_type?: BranchType;
  pattern?: string;
  value?: number;
  users?: Array<{
    type: string;
  }>;
  groups?: Array<{
    type: string;
  }>;
}

// Parameter Types
export interface ListBranchRestrictionsParams extends PaginationParams {
  workspace: string;
  repo_slug: string;
  kind?: BranchRestrictionKind;
  pattern?: string;
}

export interface CreateBranchRestrictionParams {
  workspace: string;
  repo_slug: string;
  branch_restriction: CreateBranchRestrictionRequest;
}

export interface GetBranchRestrictionParams {
  workspace: string;
  repo_slug: string;
  id: string;
}

export interface UpdateBranchRestrictionParams {
  workspace: string;
  repo_slug: string;
  id: string;
  branch_restriction: UpdateBranchRestrictionRequest;
}

export interface DeleteBranchRestrictionParams {
  workspace: string;
  repo_slug: string;
  id: string;
}
