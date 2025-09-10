/**
 * Authentication Types for Bitbucket Data Center REST API
 * Based on official documentation: https://developer.atlassian.com/server/bitbucket/rest/v906/intro/
 */

import { Link } from './base.types.js';

// OAuth token request
export interface OAuthTokenRequest {
  grant_type: 'authorization_code' | 'refresh_token' | 'client_credentials';
  code?: string;
  redirect_uri?: string;
  client_id: string;
  client_secret: string;
  refresh_token?: string;
}

// OAuth token response
export interface OAuthTokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

// OAuth authorization request
export interface OAuthAuthorizationRequest {
  response_type: 'code';
  client_id: string;
  redirect_uri: string;
  scope: string;
  state?: string;
}

// OAuth authorization response
export interface OAuthAuthorizationResponse {
  code: string;
  state?: string;
}

// Access token information
export interface AccessTokenInfo {
  token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  created_at: number;
}

// User session information
export interface UserSession {
  user: {
    name: string;
    emailAddress: string;
    id: number;
    displayName: string;
    active: boolean;
    slug: string;
    type: string;
    links: {
      self: Link[];
    };
  };
  sessionId: string;
  created_at: string;
  expires_at: string;
  last_accessed: string;
}

// Authentication method
export type AuthenticationMethod = 'BASIC' | 'OAUTH' | 'COOKIE' | 'ACCESS_TOKEN';

// Authentication configuration
export interface AuthenticationConfig {
  method: AuthenticationMethod;
  username?: string;
  password?: string;
  token?: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  scope?: string;
}

// Authentication error
export interface AuthenticationError {
  error: string;
  error_description?: string;
  error_uri?: string;
  state?: string;
}

// Session management
export interface SessionManagement {
  createSession(userId: number): Promise<UserSession>;
  getSession(sessionId: string): Promise<UserSession | null>;
  refreshSession(sessionId: string): Promise<UserSession>;
  revokeSession(sessionId: string): Promise<void>;
  listActiveSessions(userId: number): Promise<UserSession[]>;
}

// OAuth application
export interface OAuthApplication {
  id: string;
  name: string;
  description?: string;
  client_id: string;
  client_secret: string;
  redirect_uris: string[];
  scopes: string[];
  created_at: string;
  updated_at: string;
  links: {
    self: Link[];
  };
}

// OAuth application request
export interface OAuthApplicationRequest {
  name: string;
  description?: string;
  redirect_uris: string[];
  scopes: string[];
}

// OAuth application response
export interface OAuthApplicationResponse {
  id: string;
  name: string;
  description?: string;
  client_id: string;
  client_secret: string;
  redirect_uris: string[];
  scopes: string[];
  created_at: string;
  updated_at: string;
  links: {
    self: Link[];
  };
}
