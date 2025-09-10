/**
 * SSH Types for Bitbucket Cloud REST API
 * Based on: https://developer.atlassian.com/cloud/bitbucket/rest/api-group-ssh/
 */

import { PaginationParams, Link } from './base.types.js';

// SSH Types
export interface SSHKey {
  type: 'ssh_key';
  uuid: string;
  key: string;
  comment: string;
  label: string;
  created_on: string;
  last_used?: string;
  expires_on?: string;
  fingerprint: string;
  links: {
    self: Link;
  };
  owner: {
    type: string;
    uuid: string;
    display_name: string;
    username: string;
    nickname: string;
    links: {
      self: Link;
      html: Link;
      avatar: Link;
    };
  };
}

// Request Types
export interface CreateSSHKeyRequest {
  key: string;
  label?: string;
}

export interface UpdateSSHKeyRequest {
  label?: string;
}

// Parameter Types
export interface ListSSHKeysParams extends PaginationParams {
  selected_user: string;
}

export interface CreateSSHKeyParams {
  selected_user: string;
  ssh_key: CreateSSHKeyRequest;
  expires_on?: string;
}

export interface GetSSHKeyParams {
  selected_user: string;
  key_id: string;
}

export interface UpdateSSHKeyParams {
  selected_user: string;
  key_id: string;
  ssh_key: UpdateSSHKeyRequest;
}

export interface DeleteSSHKeyParams {
  selected_user: string;
  key_id: string;
}
