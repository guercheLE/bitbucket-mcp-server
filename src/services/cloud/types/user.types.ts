/**
 * User Types for Bitbucket Cloud REST API
 * Based on: https://developer.atlassian.com/cloud/bitbucket/rest/api-group-users/
 */

import { PaginationParams } from './base.types.js';

// User Types
export interface User {
  type: string;
  uuid: string;
  display_name: string;
  nickname: string;
  account_id: string;
  created_on: string;
  links: UserLinks;
}

export interface UserLinks {
  self: { href: string };
  html: { href: string };
  avatar: { href: string };
}

export interface UserEmail {
  type: string;
  email: string;
  is_primary: boolean;
  is_confirmed: boolean;
  links: {
    self: { href: string };
  };
}

// Parameter Types
export interface GetCurrentUserParams {
  // No parameters needed for current user
}

export interface GetUserParams {
  selected_user: string;
}

export interface GetUserEmailParams {
  email: string;
}

export interface ListUserEmailsParams extends PaginationParams {
  // No additional parameters needed
}
