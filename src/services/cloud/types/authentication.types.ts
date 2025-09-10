/**
 * Authentication Types for Bitbucket Cloud REST API
 * Based on official documentation: https://developer.atlassian.com/cloud/bitbucket/rest/intro/#authentication
 */

import { Link, PagedResponse, PaginationParams, ErrorResponse } from './base.types.js';

// Access Token Types
export type AccessTokenType = 'repository' | 'project' | 'workspace';

// Repository Access Token Scopes
export type RepositoryAccessTokenScope =
  | 'repository'
  | 'repository:write'
  | 'repository:admin'
  | 'repository:delete'
  | 'pullrequest'
  | 'pullrequest:write'
  | 'webhook'
  | 'pipeline'
  | 'pipeline:write'
  | 'pipeline:variable'
  | 'runner'
  | 'runner:write';

// Project Access Token Scopes
export type ProjectAccessTokenScope =
  | 'project'
  | 'repository'
  | 'repository:write'
  | 'repository:admin'
  | 'repository:delete'
  | 'pullrequest'
  | 'pullrequest:write'
  | 'webhook'
  | 'pipeline'
  | 'pipeline:write'
  | 'pipeline:variable'
  | 'runner'
  | 'runner:write';

// Workspace Access Token Scopes
export type WorkspaceAccessTokenScope =
  | 'project'
  | 'project:admin'
  | 'repository'
  | 'repository:write'
  | 'repository:admin'
  | 'repository:delete'
  | 'pullrequest'
  | 'pullrequest:write'
  | 'webhook'
  | 'account'
  | 'pipeline'
  | 'pipeline:write'
  | 'pipeline:variable'
  | 'runner'
  | 'runner:write';

// Union type for all scopes
export type AccessTokenScope =
  | RepositoryAccessTokenScope
  | ProjectAccessTokenScope
  | WorkspaceAccessTokenScope;

// Repository Access Token
export interface RepositoryAccessToken {
  id: string;
  name: string;
  created_on: string;
  last_accessed?: string;
  scopes: RepositoryAccessTokenScope[];
  type: 'repository';
  links: {
    self: Link;
  };
}

// Project Access Token
export interface ProjectAccessToken {
  id: string;
  name: string;
  created_on: string;
  last_accessed?: string;
  scopes: ProjectAccessTokenScope[];
  type: 'project';
  links: {
    self: Link;
  };
}

// Workspace Access Token
export interface WorkspaceAccessToken {
  id: string;
  name: string;
  created_on: string;
  last_accessed?: string;
  scopes: WorkspaceAccessTokenScope[];
  type: 'workspace';
  links: {
    self: Link;
  };
}

// Union type for all access tokens
export type AccessToken = RepositoryAccessToken | ProjectAccessToken | WorkspaceAccessToken;

// Create Repository Access Token Request
export interface CreateRepositoryAccessTokenRequest {
  name: string;
  scopes: RepositoryAccessTokenScope[];
  expires_at?: string; // ISO 8601 timestamp
}

// Create Project Access Token Request
export interface CreateProjectAccessTokenRequest {
  name: string;
  scopes: ProjectAccessTokenScope[];
  expires_at?: string; // ISO 8601 timestamp
}

// Create Workspace Access Token Request
export interface CreateWorkspaceAccessTokenRequest {
  name: string;
  scopes: WorkspaceAccessTokenScope[];
  expires_at?: string; // ISO 8601 timestamp
}

// Union type for create requests
export type CreateAccessTokenRequest =
  | CreateRepositoryAccessTokenRequest
  | CreateProjectAccessTokenRequest
  | CreateWorkspaceAccessTokenRequest;

// Create Repository Access Token Response
export interface CreateRepositoryAccessTokenResponse {
  token: string; // Only returned on creation
  access_token: RepositoryAccessToken;
}

// Create Project Access Token Response
export interface CreateProjectAccessTokenResponse {
  token: string; // Only returned on creation
  access_token: ProjectAccessToken;
}

// Create Workspace Access Token Response
export interface CreateWorkspaceAccessTokenResponse {
  token: string; // Only returned on creation
  access_token: WorkspaceAccessToken;
}

// Union type for create responses
export type CreateAccessTokenResponse =
  | CreateRepositoryAccessTokenResponse
  | CreateProjectAccessTokenResponse
  | CreateWorkspaceAccessTokenResponse;

// App Password
export interface AppPassword {
  id: string;
  name: string;
  created_on: string;
  last_used?: string;
  scopes: string[];
  links: {
    self: Link;
  };
}

// Create App Password Request
export interface CreateAppPasswordRequest {
  name: string;
  scopes: string[];
}

// Create App Password Response
export interface CreateAppPasswordResponse {
  password: string; // Only returned on creation, never visible again
  app_password: AppPassword;
}

// API Token
export interface ApiToken {
  id: string;
  name: string;
  created_on: string;
  last_used?: string;
  expires_at: string; // Required, maximum 1 year
  scopes: string[];
  links: {
    self: Link;
  };
}

// Create API Token Request
export interface CreateApiTokenRequest {
  name: string;
  scopes: string[];
  expires_at: string; // Required, maximum 1 year (ISO 8601 timestamp)
}

// Create API Token Response
export interface CreateApiTokenResponse {
  token: string; // Only returned on creation, never visible again
  api_token: ApiToken;
}

// OAuth 2.0 Token Response
export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

// OAuth 2.0 Error Response
export interface OAuthErrorResponse {
  error: string;
  error_description?: string;
  error_uri?: string;
  state?: string;
}

// Authorization Code Grant - Authorization URL Parameters
export interface AuthorizationUrlParams {
  client_id: string;
  redirect_uri: string;
  scopes: string[];
  state?: string;
  response_type?: 'code';
}

// Authorization Code Grant - Exchange Code Parameters
export interface ExchangeCodeParams {
  code: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  grant_type: 'authorization_code';
}

// Refresh Token Parameters
export interface RefreshTokenParams {
  refresh_token: string;
  client_id: string;
  client_secret: string;
  grant_type: 'refresh_token';
}

// JWT Exchange Parameters (Bitbucket-specific flow)
export interface ExchangeJwtParams {
  assertion: string; // JWT token
  client_id: string;
  client_secret: string;
  grant_type: 'urn:bitbucket:oauth2:jwt';
}

// Revoke Token Parameters
export interface RevokeTokenParams {
  token: string;
  client_id: string;
  client_secret: string;
  token_type_hint?: 'access_token' | 'refresh_token';
}

// Authentication Configuration
export interface AuthenticationConfig {
  type:
    | 'repository_access_token'
    | 'project_access_token'
    | 'workspace_access_token'
    | 'app_password'
    | 'api_token'
    | 'oauth';
  credentials: {
    username?: string;
    password?: string;
    token?: string;
    client_id?: string;
    client_secret?: string;
    redirect_uri?: string;
  };
  scopes?: string[];
  // Specific information for access tokens
  repository?: {
    workspace: string;
    slug: string;
  };
  project?: {
    workspace: string;
    key: string;
  };
  workspace?: {
    slug: string;
  };
}

// Token Validation Response
export interface TokenValidationResponse {
  valid: boolean;
  scopes?: string[];
  expires_at?: string;
  type?:
    | 'repository_access_token'
    | 'project_access_token'
    | 'workspace_access_token'
    | 'app_password'
    | 'api_token'
    | 'oauth';
  // Token-specific information
  repository?: {
    workspace: string;
    slug: string;
  };
  project?: {
    workspace: string;
    key: string;
  };
  workspace?: {
    slug: string;
  };
}

// Authentication Error
export interface AuthenticationError {
  type:
    | 'authentication_error'
    | 'authorization_error'
    | 'token_expired'
    | 'invalid_scope'
    | 'token_not_found'
    | 'insufficient_permissions';
  message: string;
  details?: string;
  error_code?: string;
  // Additional error information
  scopes_required?: string[];
  scopes_provided?: string[];
}

// List Access Tokens Parameters
export interface ListAccessTokensParams extends PaginationParams {
  workspace?: string;
  repository?: string;
  project?: string;
}

// List Access Tokens Response
export interface ListAccessTokensResponse extends PagedResponse<AccessToken> {}

// Delete Access Token Parameters
export interface DeleteAccessTokenParams {
  token_id: string;
  workspace?: string;
  repository?: string;
  project?: string;
}

// Update Access Token Parameters
export interface UpdateAccessTokenParams {
  token_id: string;
  name?: string;
  scopes?: string[];
  workspace?: string;
  repository?: string;
  project?: string;
}

// List App Passwords Response
export interface ListAppPasswordsResponse extends PagedResponse<AppPassword> {}

// List API Tokens Response
export interface ListApiTokensResponse extends PagedResponse<ApiToken> {}

// OAuth Scopes (from documentation)
export type OAuthScope =
  | 'account'
  | 'account:write'
  | 'repositories'
  | 'repositories:write'
  | 'repositories:admin'
  | 'repositories:delete'
  | 'pullrequests'
  | 'pullrequests:write'
  | 'issues'
  | 'issues:write'
  | 'wiki'
  | 'snippets'
  | 'snippets:write'
  | 'projects'
  | 'projects:write'
  | 'projects:delete'
  | 'webhooks'
  | 'pipeline'
  | 'pipeline:write'
  | 'pipeline:variable'
  | 'runner'
  | 'runner:write'
  | 'email';

// Forge App and API Token Scopes (from documentation)
export type ForgeAppScope =
  | 'read:repository:bitbucket'
  | 'write:repository:bitbucket'
  | 'admin:repository:bitbucket'
  | 'delete:repository:bitbucket'
  | 'read:pullrequest:bitbucket'
  | 'write:pullrequest:bitbucket'
  | 'read:project:bitbucket'
  | 'admin:project:bitbucket'
  | 'read:workspace:bitbucket'
  | 'admin:workspace:bitbucket'
  | 'read:user:bitbucket'
  | 'write:user:bitbucket'
  | 'read:pipeline:bitbucket'
  | 'write:pipeline:bitbucket'
  | 'admin:pipeline:bitbucket'
  | 'read:runner:bitbucket'
  | 'write:runner:bitbucket'
  | 'read:issue:bitbucket'
  | 'write:issue:bitbucket'
  | 'delete:issue:bitbucket'
  | 'read:webhook:bitbucket'
  | 'write:webhook:bitbucket'
  | 'delete:webhook:bitbucket'
  | 'read:snippet:bitbucket'
  | 'write:snippet:bitbucket'
  | 'delete:snippet:bitbucket'
  | 'read:ssh-key:bitbucket'
  | 'write:ssh-key:bitbucket'
  | 'delete:ssh-key:bitbucket'
  | 'read:gpg-key:bitbucket'
  | 'write:gpg-key:bitbucket'
  | 'delete:gpg-key:bitbucket'
  | 'read:permission:bitbucket'
  | 'write:permission:bitbucket'
  | 'delete:permission:bitbucket';

// OAuth 2.0 Grant Types
export type OAuthGrantType = 'authorization_code' | 'refresh_token' | 'urn:bitbucket:oauth2:jwt';

// OAuth 2.0 Response Types
export type OAuthResponseType = 'code';

// OAuth 2.0 Token Types
export type OAuthTokenType = 'Bearer';

// OAuth 2.0 Error Types
export type OAuthErrorType =
  | 'invalid_request'
  | 'invalid_client'
  | 'invalid_grant'
  | 'unauthorized_client'
  | 'unsupported_grant_type'
  | 'invalid_scope'
  | 'access_denied'
  | 'unsupported_response_type'
  | 'server_error'
  | 'temporarily_unavailable';

// OAuth 2.0 Authorization Request Parameters
export interface OAuthAuthorizationRequest {
  client_id: string;
  redirect_uri: string;
  scope: string;
  state?: string;
  response_type?: OAuthResponseType;
}

// OAuth 2.0 Authorization Response
export interface OAuthAuthorizationResponse {
  code: string;
  state?: string;
}

// OAuth 2.0 Authorization Error Response
export interface OAuthAuthorizationErrorResponse {
  error: OAuthErrorType;
  error_description?: string;
  error_uri?: string;
  state?: string;
}

// OAuth 2.0 Token Request (Authorization Code Grant)
export interface OAuthTokenRequest {
  grant_type: OAuthGrantType;
  code?: string;
  redirect_uri?: string;
  client_id: string;
  client_secret: string;
  refresh_token?: string;
  assertion?: string; // For JWT grant type
}

// OAuth 2.0 Token Response
export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

// OAuth 2.0 Token Error Response
export interface OAuthTokenErrorResponse {
  error: OAuthErrorType;
  error_description?: string;
  error_uri?: string;
}

// OAuth 2.0 Token Introspection Request
export interface OAuthTokenIntrospectionRequest {
  token: string;
  token_type_hint?: 'access_token' | 'refresh_token';
}

// OAuth 2.0 Token Introspection Response
export interface OAuthTokenIntrospectionResponse {
  active: boolean;
  scope?: string;
  client_id?: string;
  username?: string;
  token_type?: string;
  exp?: number;
  iat?: number;
  nbf?: number;
  sub?: string;
  aud?: string | string[];
  iss?: string;
  jti?: string;
}

// OAuth 2.0 Token Revocation Request
export interface OAuthTokenRevocationRequest {
  token: string;
  token_type_hint?: 'access_token' | 'refresh_token';
  client_id?: string;
  client_secret?: string;
}

// OAuth 2.0 Client Credentials
export interface OAuthClientCredentials {
  client_id: string;
  client_secret: string;
  redirect_uri?: string;
}

// OAuth 2.0 Authorization Server Metadata
export interface OAuthAuthorizationServerMetadata {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  revocation_endpoint?: string;
  introspection_endpoint?: string;
  userinfo_endpoint?: string;
  jwks_uri?: string;
  scopes_supported: string[];
  response_types_supported: OAuthResponseType[];
  grant_types_supported: OAuthGrantType[];
  token_endpoint_auth_methods_supported: string[];
  code_challenge_methods_supported?: string[];
}

// OAuth 2.0 PKCE (Proof Key for Code Exchange) Parameters
export interface OAuthPKCEParams {
  code_challenge: string;
  code_challenge_method: 'S256' | 'plain';
  code_verifier: string;
}

// OAuth 2.0 State Management
export interface OAuthState {
  state: string;
  code_verifier?: string;
  nonce?: string;
  created_at: number;
  expires_at: number;
}

// OAuth 2.0 Session Management
export interface OAuthSession {
  access_token: string;
  refresh_token?: string;
  token_type: OAuthTokenType;
  expires_at: number;
  scope?: string;
  state?: string;
}

// OAuth 2.0 Configuration
export interface OAuthConfig {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  scopes: OAuthScope[];
  authorization_endpoint: string;
  token_endpoint: string;
  revocation_endpoint?: string;
  introspection_endpoint?: string;
  use_pkce?: boolean;
  state_length?: number;
  token_storage?: 'memory' | 'localStorage' | 'sessionStorage' | 'custom';
}

// OAuth 2.0 Error Details
export interface OAuthErrorDetails {
  error: OAuthErrorType;
  error_description?: string;
  error_uri?: string;
  state?: string;
  timestamp: number;
  request_id?: string;
}

// OAuth 2.0 Token Validation Result
export interface OAuthTokenValidationResult {
  valid: boolean;
  token_type?: OAuthTokenType;
  scope?: string[];
  expires_at?: number;
  client_id?: string;
  username?: string;
  error?: OAuthErrorDetails;
}

// OAuth 2.0 Refresh Token Request
export interface OAuthRefreshTokenRequest {
  grant_type: 'refresh_token';
  refresh_token: string;
  client_id: string;
  client_secret: string;
  scope?: string;
}

// OAuth 2.0 JWT Exchange Request (Bitbucket-specific)
export interface OAuthJWTExchangeRequest {
  grant_type: 'urn:bitbucket:oauth2:jwt';
  assertion: string; // JWT token
  client_id: string;
  client_secret: string;
}

// OAuth 2.0 Device Flow Request
export interface OAuthDeviceFlowRequest {
  client_id: string;
  scope?: string;
}

// OAuth 2.0 Device Flow Response
export interface OAuthDeviceFlowResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete?: string;
  expires_in: number;
  interval: number;
}

// OAuth 2.0 Device Flow Token Request
export interface OAuthDeviceFlowTokenRequest {
  grant_type: 'urn:ietf:params:oauth:grant-type:device_code';
  device_code: string;
  client_id: string;
  client_secret: string;
}

// OAuth 2.0 Device Flow Status
export type OAuthDeviceFlowStatus =
  | 'authorization_pending'
  | 'authorization_expired'
  | 'access_denied'
  | 'slow_down'
  | 'expired_token';

// OAuth 2.0 Device Flow Error Response
export interface OAuthDeviceFlowErrorResponse {
  error: OAuthDeviceFlowStatus;
  error_description?: string;
  interval?: number;
}

// OAuth Application (for OAuth 2.0 flow)
export interface OAuthApplication {
  client_id: string;
  name: string;
  description?: string;
  url?: string;
  callback_url?: string;
  is_disabled: boolean;
  created_on: string;
  updated_on: string;
  links: {
    self: Link;
  };
}

// OAuth Application Request
export interface OAuthApplicationRequest {
  name: string;
  description?: string;
  url?: string;
  callback_url?: string;
}

// OAuth Application Response
export interface OAuthApplicationResponse {
  client_id: string;
  client_secret: string;
  name: string;
  description?: string;
  url?: string;
  callback_url?: string;
  is_disabled: boolean;
  created_on: string;
  updated_on: string;
  links: {
    self: Link;
  };
}
