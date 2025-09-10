/**
 * Cloud Types Index
 * Exports all types for Bitbucket Cloud REST API
 */

// Base types (common types used across all modules)
export * from './base.types.js';

// Authentication types (includes OAuth 2.0 and token management types)
export * from './authentication.types.js';

// Workspace types
export * from './workspace.types.js';

// Repository types
export * from './repository.types.js';

// Pull Request types
export * from './pull-request.types.js';

// Commit types
export * from './commit.types.js';

// Project types
export * from './project.types.js';

// Pipeline types
export * from './pipeline.types.js';

// User types
export * from './user.types.js';

// Snippet types
export * from './snippet.types.js';

// Webhook types
export * from './webhook.types.js';

// Issue types
export * from './issue.types.js';

// Ref types
export * from './ref.types.js';

// Source types
export * from './source.types.js';

// SSH types
export * from './ssh.types.js';

// Branch Restriction types
export * from './branch-restriction.types.js';

// Diff types
export * from './diff.types.js';

// Search types
export * from './search.types.js';

// Base types (re-exported for convenience)
export type { Link, PagedResponse, PaginationParams, ErrorResponse } from './base.types.js';

// OAuth 2.0 specific types (re-exported for convenience)
export type {
  OAuthScope,
  ForgeAppScope,
  OAuthGrantType,
  OAuthResponseType,
  OAuthTokenType,
  OAuthErrorType,
  OAuthAuthorizationRequest,
  OAuthAuthorizationResponse,
  OAuthAuthorizationErrorResponse,
  OAuthTokenRequest,
  OAuthTokenResponse,
  OAuthTokenErrorResponse,
  OAuthTokenIntrospectionRequest,
  OAuthTokenIntrospectionResponse,
  OAuthTokenRevocationRequest,
  OAuthClientCredentials,
  OAuthAuthorizationServerMetadata,
  OAuthPKCEParams,
  OAuthState,
  OAuthSession,
  OAuthConfig,
  OAuthErrorDetails,
  OAuthTokenValidationResult,
  OAuthRefreshTokenRequest,
  OAuthJWTExchangeRequest,
  OAuthDeviceFlowRequest,
  OAuthDeviceFlowResponse,
  OAuthDeviceFlowTokenRequest,
  OAuthDeviceFlowErrorResponse,
  OAuthDeviceFlowStatus,
} from './authentication.types.js';

// Token Management specific types (re-exported for convenience)
export type {
  AccessToken,
  AccessTokenType,
  AccessTokenScope,
  RepositoryAccessToken,
  ProjectAccessToken,
  WorkspaceAccessToken,
  CreateAccessTokenRequest,
  CreateAccessTokenResponse,
  CreateRepositoryAccessTokenRequest,
  CreateProjectAccessTokenRequest,
  CreateWorkspaceAccessTokenRequest,
  ListAccessTokensParams,
  ListAccessTokensResponse,
  DeleteAccessTokenParams,
  UpdateAccessTokenParams,
  AppPassword,
  CreateAppPasswordRequest,
  CreateAppPasswordResponse,
  ListAppPasswordsResponse,
  ApiToken,
  CreateApiTokenRequest,
  CreateApiTokenResponse,
  ListApiTokensResponse,
  TokenValidationResponse,
  AuthenticationConfig,
  AuthenticationError,
  RepositoryAccessTokenScope,
  ProjectAccessTokenScope,
  WorkspaceAccessTokenScope,
} from './authentication.types.js';
