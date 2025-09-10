/**
 * Search Types for Bitbucket Cloud REST API
 * Based on: https://developer.atlassian.com/cloud/bitbucket/rest/api-group-other-operations/
 */

import { PaginationParams, Link } from './base.types.js';

// Search Types
export interface CodeSearchResult {
  type: 'code_search_result';
  content_match_count: number;
  content_matches: Array<{
    lines: Array<{
      line: number;
      segments: Array<{
        text: string;
        match?: boolean;
      }>;
    }>;
  }>;
  path_matches: Array<{
    text: string;
    match?: boolean;
  }>;
  file: {
    path: string;
    type: 'commit_file';
    links: {
      self: Link;
    };
  };
}

export interface SearchResultPage {
  size: number;
  page: number;
  pagelen: number;
  query_substituted: boolean;
  values: CodeSearchResult[];
}

// Parameter Types
export interface SearchTeamCodeParams extends PaginationParams {
  username: string;
  search_query: string;
}

export interface SearchUserCodeParams extends PaginationParams {
  selected_user: string;
  search_query: string;
}

export interface SearchWorkspaceCodeParams extends PaginationParams {
  workspace: string;
  search_query: string;
}
