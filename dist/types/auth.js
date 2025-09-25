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
// User Session Types
// ============================================================================
/**
 * User Session State
 * Represents the current state of a user authentication session
 */
export var UserSessionState;
(function (UserSessionState) {
    UserSessionState["UNAUTHENTICATED"] = "unauthenticated";
    UserSessionState["AUTHENTICATING"] = "authenticating";
    UserSessionState["AUTHENTICATED"] = "authenticated";
    UserSessionState["TOKEN_REFRESHING"] = "token_refreshing";
    UserSessionState["EXPIRED"] = "expired";
    UserSessionState["REVOKED"] = "revoked";
    UserSessionState["ERROR"] = "error";
})(UserSessionState || (UserSessionState = {}));
/**
 * Authentication Error Class
 * Class implementation for authentication errors
 */
export class AuthenticationErrorClass extends Error {
    code;
    details;
    timestamp;
    sessionId;
    isRecoverable;
    constructor(error) {
        super(error.message);
        this.name = 'AuthenticationError';
        // Use Object.defineProperty to set readonly properties
        Object.defineProperty(this, 'code', { value: error.code });
        Object.defineProperty(this, 'details', { value: error.details });
        Object.defineProperty(this, 'timestamp', { value: error.timestamp });
        Object.defineProperty(this, 'sessionId', { value: error.sessionId });
        Object.defineProperty(this, 'isRecoverable', { value: error.isRecoverable });
    }
}
/**
 * Authentication Error Codes
 * Standard error codes for authentication failures
 */
export var AuthenticationErrorCode;
(function (AuthenticationErrorCode) {
    // OAuth Flow Errors
    AuthenticationErrorCode["INVALID_CLIENT"] = "invalid_client";
    AuthenticationErrorCode["INVALID_GRANT"] = "invalid_grant";
    AuthenticationErrorCode["INVALID_REQUEST"] = "invalid_request";
    AuthenticationErrorCode["INVALID_SCOPE"] = "invalid_scope";
    AuthenticationErrorCode["UNAUTHORIZED_CLIENT"] = "unauthorized_client";
    AuthenticationErrorCode["UNSUPPORTED_GRANT_TYPE"] = "unsupported_grant_type";
    // Token Errors
    AuthenticationErrorCode["TOKEN_EXPIRED"] = "token_expired";
    AuthenticationErrorCode["TOKEN_INVALID"] = "token_invalid";
    AuthenticationErrorCode["TOKEN_REVOKED"] = "token_revoked";
    AuthenticationErrorCode["TOKEN_MISSING"] = "token_missing";
    // Session Errors
    AuthenticationErrorCode["SESSION_EXPIRED"] = "session_expired";
    AuthenticationErrorCode["SESSION_INVALID"] = "session_invalid";
    AuthenticationErrorCode["SESSION_NOT_FOUND"] = "session_not_found";
    // Application Errors
    AuthenticationErrorCode["APPLICATION_NOT_FOUND"] = "application_not_found";
    AuthenticationErrorCode["APPLICATION_INACTIVE"] = "application_inactive";
    AuthenticationErrorCode["APPLICATION_MISMATCH"] = "application_mismatch";
    // Network Errors
    AuthenticationErrorCode["NETWORK_ERROR"] = "network_error";
    AuthenticationErrorCode["TIMEOUT_ERROR"] = "timeout_error";
    AuthenticationErrorCode["CONNECTION_ERROR"] = "connection_error";
    // Security Errors
    AuthenticationErrorCode["CSRF_TOKEN_MISMATCH"] = "csrf_token_mismatch";
    AuthenticationErrorCode["STATE_MISMATCH"] = "state_mismatch";
    AuthenticationErrorCode["INVALID_REDIRECT_URI"] = "invalid_redirect_uri";
    // General Errors
    AuthenticationErrorCode["AUTHENTICATION_FAILED"] = "authentication_failed";
    AuthenticationErrorCode["AUTHORIZATION_FAILED"] = "authorization_failed";
    AuthenticationErrorCode["INTERNAL_ERROR"] = "internal_error";
})(AuthenticationErrorCode || (AuthenticationErrorCode = {}));
// ============================================================================
// Type Guards
// ============================================================================
/**
 * Type guard for OAuthApplication
 */
export function isOAuthApplication(obj) {
    return (obj &&
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
        typeof obj.isActive === 'boolean');
}
/**
 * Type guard for AccessToken
 */
export function isAccessToken(obj) {
    return (obj &&
        typeof obj === 'object' &&
        typeof obj.token === 'string' &&
        typeof obj.tokenType === 'string' &&
        obj.expiresAt instanceof Date &&
        Array.isArray(obj.scope) &&
        obj.createdAt instanceof Date &&
        obj.lastUsedAt instanceof Date &&
        typeof obj.isValid === 'boolean');
}
/**
 * Type guard for UserSession
 */
export function isUserSession(obj) {
    return (obj &&
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
        typeof obj.getStats === 'function');
}
// ============================================================================
// Export All Types
// ============================================================================
export * from './auth';
//# sourceMappingURL=auth.js.map