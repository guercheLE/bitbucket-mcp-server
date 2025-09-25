/**
 * Authentication Types for Bitbucket MCP Server
 * 
 * This module defines TypeScript interfaces and types for OAuth-based
 * authentication with Bitbucket Data Center and Cloud.
 * 
 * Key Components:
 * - OAuth Application: OAuth app configuration and credentials
 * - Access Token: Short-lived token for API requests
 * - Refresh Token: Long-lived token for token renewal
 * - User Session: Active authentication session management
 * - Authentication State: Current auth status and permissions
 * 
 * Constitutional Requirements:
 * - OAuth 2.0 compliance for Bitbucket integration
 * - Secure token storage and management
 * - Session persistence and concurrent handling
 * - MCP protocol integration
 * - Security auditing and error handling
 */

// ============================================================================
// OAuth Application Types
// ============================================================================

/**
 * OAuth Application Configuration
 * Represents a registered OAuth application with Bitbucket
 */
export interface OAuthApplication {
  /** Unique application identifier */
  readonly id: string;

  /** Application name */
  readonly name: string;

  /** Application description */
  readonly description?: string;

  /** OAuth client ID */
  readonly clientId: string;

  /** OAuth client secret (encrypted in storage) */
  readonly clientSecret: string;

  /** Redirect URI for OAuth flow */
  readonly redirectUri: string;

  /** Bitbucket instance type */
  readonly instanceType: 'datacenter' | 'cloud';

  /** Bitbucket base URL */
  readonly baseUrl: string;

  /** OAuth scopes requested */
  readonly scopes: string[];

  /** Application creation timestamp */
  readonly createdAt: Date;

  /** Last configuration update */
  readonly updatedAt: Date;

  /** Whether application is active */
  readonly isActive: boolean;
}

/**
 * OAuth Application Registration Request
 * Parameters for creating a new OAuth application
 */
export interface OAuthApplicationRequest {
  /** Application name */
  name: string;

  /** Application description */
  description?: string;

  /** Redirect URI */
  redirectUri: string;

  /** Bitbucket instance type */
  instanceType: 'datacenter' | 'cloud';

  /** Bitbucket base URL */
  baseUrl: string;

  /** Requested OAuth scopes */
  scopes?: string[];
}

// ============================================================================
// Token Management Types
// ============================================================================

/**
 * Token Storage Configuration
 * Configuration for token storage backends
 */
export interface TokenStorageConfig {
  /** Storage backend type */
  type: 'memory' | 'file' | 'database';

  /** Encryption key for token storage */
  encryptionKey?: string;

  /** Storage-specific configuration */
  options?: Record<string, any>;
}

/**
 * Token Validation Result
 * Result of token validation operation
 */
export interface TokenValidationResult {
  /** Whether the token is valid */
  isValid: boolean;

  /** Token expiration date */
  expiresAt: Date;

  /** Time until expiration in milliseconds */
  timeUntilExpiration: number;

  /** Whether token needs refresh */
  needsRefresh: boolean;

  /** Validation timestamp */
  validatedAt: Date;
}

/**
 * Access Token Information
 * Short-lived token used for API requests
 */
export interface AccessToken {
  /** Token value */
  readonly token: string;

  /** Token type (usually "Bearer") */
  readonly tokenType: string;

  /** Token expiration timestamp */
  readonly expiresAt: Date;

  /** Token scope */
  readonly scope: string[];

  /** Associated refresh token ID */
  readonly refreshTokenId?: string;

  /** Token creation timestamp */
  readonly createdAt: Date;

  /** Last usage timestamp */
  lastUsedAt: Date;

  /** Whether token is valid */
  readonly isValid: boolean;
}

/**
 * Refresh Token Information
 * Long-lived token used to obtain new access tokens
 */
export interface RefreshToken {
  /** Unique refresh token identifier */
  readonly id: string;

  /** Token value (encrypted in storage) */
  readonly token: string;

  /** Token expiration timestamp */
  readonly expiresAt: Date;

  /** Associated OAuth application ID */
  readonly applicationId: string;

  /** Associated user identifier */
  readonly userId: string;

  /** Token creation timestamp */
  readonly createdAt: Date;

  /** Last usage timestamp */
  lastUsedAt: Date;

  /** Whether token is valid */
  readonly isValid: boolean;

  /** Whether token has been revoked */
  readonly isRevoked: boolean;
}

/**
 * Token Exchange Request
 * Parameters for exchanging authorization code for tokens
 */
export interface TokenExchangeRequest {
  /** Authorization code from OAuth flow */
  code: string;

  /** OAuth application ID */
  applicationId: string;

  /** State parameter for CSRF protection */
  state?: string;

  /** Redirect URI used in authorization */
  redirectUri: string;
}

/**
 * Token Refresh Request
 * Parameters for refreshing an access token
 */
export interface TokenRefreshRequest {
  /** Refresh token ID */
  refreshTokenId: string;

  /** OAuth application ID */
  applicationId: string;
}

// ============================================================================
// User Session Types
// ============================================================================

/**
 * User Session State
 * Represents the current state of a user authentication session
 */
export enum UserSessionState {
  UNAUTHENTICATED = 'unauthenticated',
  AUTHENTICATING = 'authenticating',
  AUTHENTICATED = 'authenticated',
  TOKEN_REFRESHING = 'token_refreshing',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
  ERROR = 'error'
}

/**
 * User Session Information
 * Manages an active user authentication session
 */
export interface UserSession {
  /** Unique session identifier */
  readonly id: string;

  /** Associated client session ID */
  readonly clientSessionId: string;

  /** Current session state */
  readonly state: UserSessionState;

  /** Associated OAuth application ID */
  readonly applicationId: string;

  /** User identifier from Bitbucket */
  readonly userId: string;

  /** User display name */
  readonly userName: string;

  /** User email address */
  readonly userEmail: string;

  /** Current access token */
  readonly accessToken: AccessToken;

  /** Associated refresh token */
  readonly refreshToken: RefreshToken;

  /** Session creation timestamp */
  readonly createdAt: Date;

  /** Last activity timestamp */
  lastActivity: Date;

  /** Session expiration timestamp */
  readonly expiresAt: Date;

  /** Session metadata */
  metadata: Record<string, any>;

  /** User permissions and scopes */
  readonly permissions: string[];

  /** Update session activity */
  updateActivity(): void;

  /** Check if session is active */
  isActive(): boolean;

  /** Check if session has expired */
  isExpired(): boolean;

  /** Check if access token needs refresh */
  needsTokenRefresh(): boolean;

  /** Get session statistics */
  getStats(): UserSessionStats;
}

/**
 * User Session Statistics
 * Performance metrics for user sessions
 */
export interface UserSessionStats {
  /** Session duration in milliseconds */
  duration: number;

  /** Number of API requests made */
  apiRequests: number;

  /** Number of token refreshes */
  tokenRefreshes: number;

  /** Last API request timestamp */
  lastApiRequest: Date;

  /** Average request interval */
  averageRequestInterval: number;

  /** Memory usage in bytes */
  memoryUsage: number;
}

// ============================================================================
// Authentication State Types
// ============================================================================

/**
 * Authentication State Information
 * Current authentication status and user context
 */
export interface AuthenticationState {
  /** Whether user is authenticated */
  readonly isAuthenticated: boolean;

  /** Current user session */
  readonly session?: UserSession;

  /** Available OAuth applications */
  readonly applications: OAuthApplication[];

  /** Current authentication method */
  readonly authMethod?: 'oauth' | 'token' | 'session';

  /** Authentication timestamp */
  readonly authenticatedAt?: Date;

  /** Last authentication check */
  readonly lastAuthCheck: Date;

  /** Authentication errors */
  readonly errors: AuthenticationError[];

  /** Get current access token */
  getCurrentAccessToken(): AccessToken | null;

  /** Check if authentication is valid */
  isValid(): boolean;

  /** Check if token refresh is needed */
  needsRefresh(): boolean;

  /** Get user permissions */
  getUserPermissions(): string[];
}

/**
 * Authentication Error Information
 * Details about authentication failures
 */
export interface AuthenticationError {
  /** Error code */
  readonly code: AuthenticationErrorCode;

  /** Error message */
  readonly message: string;

  /** Error details */
  readonly details?: any;

  /** Error timestamp */
  readonly timestamp: Date;

  /** Associated session ID */
  readonly sessionId?: string;

  /** Whether error is recoverable */
  readonly isRecoverable: boolean;
}

/**
 * Authentication Error Class
 * Class implementation for authentication errors
 */
export class AuthenticationError extends Error implements AuthenticationError {
  public readonly code: AuthenticationErrorCode;
  public readonly details?: any;
  public readonly timestamp: Date;
  public readonly sessionId?: string;
  public readonly isRecoverable: boolean;

  constructor(error: AuthenticationError) {
    super(error.message);
    this.name = 'AuthenticationError';
    this.code = error.code;
    this.details = error.details;
    this.timestamp = error.timestamp;
    this.sessionId = error.sessionId;
    this.isRecoverable = error.isRecoverable;
  }
}

/**
 * Authentication Error Codes
 * Standard error codes for authentication failures
 */
export enum AuthenticationErrorCode {
  // OAuth Flow Errors
  INVALID_CLIENT = 'invalid_client',
  INVALID_GRANT = 'invalid_grant',
  INVALID_REQUEST = 'invalid_request',
  INVALID_SCOPE = 'invalid_scope',
  UNAUTHORIZED_CLIENT = 'unauthorized_client',
  UNSUPPORTED_GRANT_TYPE = 'unsupported_grant_type',

  // Token Errors
  TOKEN_EXPIRED = 'token_expired',
  TOKEN_INVALID = 'token_invalid',
  TOKEN_REVOKED = 'token_revoked',
  TOKEN_MISSING = 'token_missing',

  // Session Errors
  SESSION_EXPIRED = 'session_expired',
  SESSION_INVALID = 'session_invalid',
  SESSION_NOT_FOUND = 'session_not_found',

  // Application Errors
  APPLICATION_NOT_FOUND = 'application_not_found',
  APPLICATION_INACTIVE = 'application_inactive',
  APPLICATION_MISMATCH = 'application_mismatch',

  // Network Errors
  NETWORK_ERROR = 'network_error',
  TIMEOUT_ERROR = 'timeout_error',
  CONNECTION_ERROR = 'connection_error',

  // Security Errors
  CSRF_TOKEN_MISMATCH = 'csrf_token_mismatch',
  STATE_MISMATCH = 'state_mismatch',
  INVALID_REDIRECT_URI = 'invalid_redirect_uri',

  // General Errors
  AUTHENTICATION_FAILED = 'authentication_failed',
  INVALID_CREDENTIALS = 'invalid_credentials',
  INSUFFICIENT_PERMISSIONS = 'insufficient_permissions',
  ACCOUNT_LOCKED = 'account_locked',
  REFRESH_TOKEN_INVALID = 'refresh_token_invalid',
  REFRESH_TOKEN_EXPIRED = 'refresh_token_expired',
  USER_NOT_FOUND = 'user_not_found',
  APPLICATION_DISABLED = 'application_disabled',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SERVER_ERROR = 'server_error',
  UNKNOWN_ERROR = 'unknown_error',
  AUTHORIZATION_FAILED = 'authorization_failed',
  INTERNAL_ERROR = 'internal_error'
}

// ============================================================================
// OAuth Flow Types
// ============================================================================

/**
 * OAuth Authorization Request
 * Parameters for initiating OAuth authorization flow
 */
export interface OAuthAuthorizationRequest {
  /** OAuth application ID */
  applicationId: string;

  /** State parameter for CSRF protection */
  state?: string;

  /** Additional OAuth parameters */
  params?: Record<string, string>;
}

/**
 * OAuth Authorization Response
 * Result of OAuth authorization flow
 */
export interface OAuthAuthorizationResponse {
  /** Authorization URL */
  authorizationUrl: string;

  /** State parameter for verification */
  state: string;

  /** Expiration timestamp for the authorization request */
  expiresAt: Date;
}

/**
 * OAuth Callback Request
 * Parameters received in OAuth callback
 */
export interface OAuthCallbackRequest {
  /** Authorization code */
  code: string;

  /** State parameter */
  state: string;

  /** Error code if authorization failed */
  error?: string;

  /** Error description if authorization failed */
  errorDescription?: string;

  /** Additional callback parameters */
  params?: Record<string, string>;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Authentication Configuration
 * Configuration options for the authentication system
 */
export interface AuthenticationConfig {
  /** Default OAuth application settings */
  defaultApplication: {
    name: string;
    description: string;
    scopes: string[];
  };

  /** Token management settings */
  tokens: {
    accessTokenLifetime: number; // milliseconds
    refreshTokenLifetime: number; // milliseconds
    refreshThreshold: number; // milliseconds before expiry
  };

  /** Session management settings */
  sessions: {
    maxConcurrentSessions: number;
    sessionTimeout: number; // milliseconds
    activityTimeout: number; // milliseconds
  };

  /** Security settings */
  security: {
    encryptTokens: boolean;
    requireHttps: boolean;
    csrfProtection: boolean;
    rateLimitRequests: boolean;
  };

  /** Storage settings */
  storage: {
    type: 'memory' | 'file' | 'database';
    path?: string;
    encryptionKey?: string;
  };

  /** Logging settings */
  logging: {
    logAuthEvents: boolean;
    logTokenUsage: boolean;
    logSecurityEvents: boolean;
  };
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Authentication API Response
 * Standard response format for authentication operations
 */
export interface AuthenticationResponse<T = any> {
  /** Response success status */
  success: boolean;

  /** Response data */
  data?: T;

  /** Authentication error if operation failed */
  error?: AuthenticationError;

  /** Response metadata */
  metadata?: {
    timestamp: Date;
    requestId: string;
    processingTime: number;
    sessionId?: string;
  };
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * Authentication Events
 * Events emitted by the authentication system
 */
export interface AuthenticationEvents {
  'auth:session:created': (session: UserSession) => void;
  'auth:session:expired': (sessionId: string) => void;
  'auth:session:revoked': (sessionId: string) => void;
  'auth:token:refreshed': (sessionId: string, newToken: AccessToken) => void;
  'auth:token:expired': (sessionId: string) => void;
  'auth:application:registered': (application: OAuthApplication) => void;
  'auth:application:updated': (application: OAuthApplication) => void;
  'auth:error': (error: AuthenticationError) => void;
  'auth:security:violation': (violation: SecurityViolation) => void;
}

/**
 * Security Violation Information
 * Details about security policy violations
 */
export interface SecurityViolation {
  /** Violation type */
  readonly type: 'rate_limit' | 'invalid_token' | 'suspicious_activity' | 'csrf_attack';

  /** Violation description */
  readonly description: string;

  /** Associated session ID */
  readonly sessionId?: string;

  /** Violation timestamp */
  readonly timestamp: Date;

  /** Source IP address */
  readonly sourceIp?: string;

  /** User agent */
  readonly userAgent?: string;

  /** Additional context */
  readonly context?: Record<string, any>;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for OAuthApplication
 */
export function isOAuthApplication(obj: any): obj is OAuthApplication {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.clientId === 'string' &&
    typeof obj.clientSecret === 'string' &&
    typeof obj.redirectUri === 'string' &&
    (obj.instanceType === 'datacenter' || obj.instanceType === 'cloud') &&
    typeof obj.baseUrl === 'string' &&
    Array.isArray(obj.scopes) &&
    obj.createdAt instanceof Date &&
    obj.updatedAt instanceof Date &&
    typeof obj.isActive === 'boolean'
  );
}

/**
 * Type guard for AccessToken
 */
export function isAccessToken(obj: any): obj is AccessToken {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.token === 'string' &&
    typeof obj.tokenType === 'string' &&
    obj.expiresAt instanceof Date &&
    Array.isArray(obj.scope) &&
    obj.createdAt instanceof Date &&
    obj.lastUsedAt instanceof Date &&
    typeof obj.isValid === 'boolean'
  );
}

/**
 * Type guard for UserSession
 */
export function isUserSession(obj: any): obj is UserSession {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.clientSessionId === 'string' &&
    typeof obj.state === 'string' &&
    typeof obj.applicationId === 'string' &&
    typeof obj.userId === 'string' &&
    typeof obj.userName === 'string' &&
    typeof obj.userEmail === 'string' &&
    isAccessToken(obj.accessToken) &&
    obj.createdAt instanceof Date &&
    obj.lastActivity instanceof Date &&
    obj.expiresAt instanceof Date &&
    Array.isArray(obj.permissions) &&
    typeof obj.updateActivity === 'function' &&
    typeof obj.isActive === 'function' &&
    typeof obj.isExpired === 'function' &&
    typeof obj.needsTokenRefresh === 'function' &&
    typeof obj.getStats === 'function'
  );
}

// ============================================================================
// Export All Types
// ============================================================================

export * from './auth';

