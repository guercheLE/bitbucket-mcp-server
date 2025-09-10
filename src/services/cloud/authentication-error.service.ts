/**
 * Authentication Error Service for Bitbucket Cloud REST API
 * Based on official documentation: https://developer.atlassian.com/cloud/bitbucket/rest/intro/#authentication
 */

import {
  AuthenticationError,
  OAuthErrorDetails,
  OAuthErrorType,
  OAuthTokenErrorResponse,
  OAuthAuthorizationErrorResponse,
  OAuthDeviceFlowErrorResponse,
  OAuthDeviceFlowStatus,
} from './types/authentication.types.js';
import { Logger } from '../../utils/logger.util.js';

export class AuthenticationErrorService {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  // ===== ERROR CREATION =====

  /**
   * Create Authentication Error
   */
  createAuthenticationError(
    type: AuthenticationError['type'],
    message: string,
    details?: string,
    errorCode?: string
  ): AuthenticationError {
    const error: AuthenticationError = {
      type,
      message,
      details,
      error_code: errorCode,
    };

    this.logger.error('Authentication error created', { error });
    return error;
  }

  /**
   * Create OAuth Error Details
   */
  createOAuthErrorDetails(
    error: OAuthErrorType,
    description?: string,
    uri?: string,
    state?: string,
    requestId?: string
  ): OAuthErrorDetails {
    const errorDetails: OAuthErrorDetails = {
      error,
      error_description: description,
      error_uri: uri,
      state,
      timestamp: Date.now(),
      request_id: requestId,
    };

    this.logger.error('OAuth error details created', { errorDetails });
    return errorDetails;
  }

  // ===== ERROR HANDLING =====

  /**
   * Handle HTTP Error Response
   */
  handleHttpError(error: any, context: string): AuthenticationError {
    this.logger.error('Handling HTTP error', { context, error });

    if (!error.response) {
      return this.createAuthenticationError(
        'authentication_error',
        'Network error occurred',
        'Unable to connect to Bitbucket API',
        'NETWORK_ERROR'
      );
    }

    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 400:
        return this.handleBadRequestError(data, context);
      case 401:
        return this.handleUnauthorizedError(data, context);
      case 403:
        return this.handleForbiddenError(data, context);
      case 404:
        return this.handleNotFoundError(data, context);
      case 429:
        return this.handleRateLimitError(data, context);
      case 500:
      case 502:
      case 503:
      case 504:
        return this.handleServerError(data, context);
      default:
        return this.createAuthenticationError(
          'authentication_error',
          `HTTP ${status} error occurred`,
          data?.error?.message || 'Unknown error',
          `HTTP_${status}`
        );
    }
  }

  /**
   * Handle OAuth Token Error Response
   */
  handleOAuthTokenError(error: any): OAuthErrorDetails {
    this.logger.error('Handling OAuth token error', { error });

    if (error.response?.data) {
      const oauthError = error.response.data as OAuthTokenErrorResponse;
      return this.createOAuthErrorDetails(
        oauthError.error as OAuthErrorType,
        oauthError.error_description,
        oauthError.error_uri
      );
    }

    return this.createOAuthErrorDetails(
      'server_error',
      'An unexpected error occurred during token exchange',
      undefined,
      undefined,
      error.requestId
    );
  }

  /**
   * Handle OAuth Authorization Error Response
   */
  handleOAuthAuthorizationError(error: any): OAuthErrorDetails {
    this.logger.error('Handling OAuth authorization error', { error });

    if (error.response?.data) {
      const authError = error.response.data as OAuthAuthorizationErrorResponse;
      return this.createOAuthErrorDetails(
        authError.error as OAuthErrorType,
        authError.error_description,
        authError.error_uri,
        authError.state
      );
    }

    return this.createOAuthErrorDetails(
      'server_error',
      'An unexpected error occurred during authorization',
      undefined,
      error.state
    );
  }

  /**
   * Handle OAuth Device Flow Error Response
   */
  handleOAuthDeviceFlowError(error: any): OAuthErrorDetails {
    this.logger.error('Handling OAuth device flow error', { error });

    if (error.response?.data) {
      const deviceError = error.response.data as OAuthDeviceFlowErrorResponse;
      return this.createOAuthErrorDetails(
        deviceError.error as OAuthErrorType,
        deviceError.error_description
      );
    }

    return this.createOAuthErrorDetails(
      'server_error',
      'An unexpected error occurred during device flow',
      undefined,
      undefined,
      error.requestId
    );
  }

  // ===== SPECIFIC ERROR HANDLERS =====

  /**
   * Handle Bad Request Error (400)
   */
  private handleBadRequestError(data: any, context: string): AuthenticationError {
    const message = data?.error?.message || 'Bad request';
    const details = data?.error?.detail || 'Invalid request parameters';

    // Check for specific OAuth errors
    if (data?.error) {
      const oauthError = data.error as OAuthTokenErrorResponse;
      if (oauthError.error) {
        return this.createAuthenticationError(
          'invalid_scope',
          this.getOAuthErrorMessage(oauthError.error as OAuthErrorType),
          oauthError.error_description,
          oauthError.error
        );
      }
    }

    return this.createAuthenticationError('authentication_error', message, details, 'BAD_REQUEST');
  }

  /**
   * Handle Unauthorized Error (401)
   */
  private handleUnauthorizedError(data: any, context: string): AuthenticationError {
    const message = data?.error?.message || 'Unauthorized';
    const details = data?.error?.detail || 'Invalid credentials or token';

    // Check for token expiration
    if (message.toLowerCase().includes('expired') || message.toLowerCase().includes('expire')) {
      return this.createAuthenticationError(
        'token_expired',
        'Token has expired',
        details,
        'TOKEN_EXPIRED'
      );
    }

    // Check for invalid token
    if (message.toLowerCase().includes('invalid') && message.toLowerCase().includes('token')) {
      return this.createAuthenticationError(
        'authentication_error',
        'Invalid token',
        details,
        'INVALID_TOKEN'
      );
    }

    return this.createAuthenticationError('authentication_error', message, details, 'UNAUTHORIZED');
  }

  /**
   * Handle Forbidden Error (403)
   */
  private handleForbiddenError(data: any, context: string): AuthenticationError {
    const message = data?.error?.message || 'Forbidden';
    const details = data?.error?.detail || 'Insufficient permissions';

    // Check for scope-related errors
    if (message.toLowerCase().includes('scope') || message.toLowerCase().includes('permission')) {
      return this.createAuthenticationError(
        'insufficient_permissions',
        'Insufficient permissions for this operation',
        details,
        'INSUFFICIENT_PERMISSIONS'
      );
    }

    return this.createAuthenticationError('authorization_error', message, details, 'FORBIDDEN');
  }

  /**
   * Handle Not Found Error (404)
   */
  private handleNotFoundError(data: any, context: string): AuthenticationError {
    const message = data?.error?.message || 'Not found';
    const details = data?.error?.detail || 'Resource not found';

    // Check for token not found
    if (context.includes('token') || message.toLowerCase().includes('token')) {
      return this.createAuthenticationError(
        'token_not_found',
        'Token not found',
        details,
        'TOKEN_NOT_FOUND'
      );
    }

    return this.createAuthenticationError('authentication_error', message, details, 'NOT_FOUND');
  }

  /**
   * Handle Rate Limit Error (429)
   */
  private handleRateLimitError(data: any, context: string): AuthenticationError {
    const message = data?.error?.message || 'Rate limit exceeded';
    const details = data?.error?.detail || 'Too many requests';

    return this.createAuthenticationError(
      'authentication_error',
      message,
      details,
      'RATE_LIMIT_EXCEEDED'
    );
  }

  /**
   * Handle Server Error (5xx)
   */
  private handleServerError(data: any, context: string): AuthenticationError {
    const message = data?.error?.message || 'Internal server error';
    const details = data?.error?.detail || 'An internal error occurred';

    return this.createAuthenticationError('authentication_error', message, details, 'SERVER_ERROR');
  }

  // ===== ERROR MESSAGE HELPERS =====

  /**
   * Get OAuth Error Message
   */
  private getOAuthErrorMessage(error: OAuthErrorType): string {
    const errorMessages: Record<OAuthErrorType, string> = {
      invalid_request:
        'The request is missing a required parameter, includes an invalid parameter value, or is otherwise malformed',
      invalid_client: 'Client authentication failed',
      invalid_grant: 'The provided authorization grant is invalid, expired, or revoked',
      unauthorized_client:
        'The authenticated client is not authorized to use this authorization grant type',
      unsupported_grant_type:
        'The authorization grant type is not supported by the authorization server',
      invalid_scope: 'The requested scope is invalid, unknown, or malformed',
      access_denied: 'The resource owner or authorization server denied the request',
      unsupported_response_type:
        'The authorization server does not support obtaining an authorization code using this method',
      server_error: 'The authorization server encountered an unexpected condition',
      temporarily_unavailable: 'The authorization server is currently unable to handle the request',
    };

    return errorMessages[error] || 'An unknown OAuth error occurred';
  }

  /**
   * Get Device Flow Error Message
   */
  getDeviceFlowErrorMessage(status: OAuthDeviceFlowStatus): string {
    const errorMessages: Record<OAuthDeviceFlowStatus, string> = {
      authorization_pending:
        "The authorization request is still pending as the end user hasn't yet completed the user-interaction steps",
      authorization_expired: 'The authorization request has expired',
      access_denied: 'The end user denied the authorization request',
      slow_down: 'The client is polling too frequently',
      expired_token: 'The device code has expired',
    };

    return errorMessages[status] || 'An unknown device flow error occurred';
  }

  // ===== ERROR VALIDATION =====

  /**
   * Validate Error Response
   */
  validateErrorResponse(error: any): boolean {
    if (!error) {
      return false;
    }

    // Check for required fields
    if (!error.type || !error.message) {
      return false;
    }

    // Validate error type
    const validTypes: AuthenticationError['type'][] = [
      'authentication_error',
      'authorization_error',
      'token_expired',
      'invalid_scope',
      'token_not_found',
      'insufficient_permissions',
    ];

    return validTypes.includes(error.type);
  }

  /**
   * Validate OAuth Error Response
   */
  validateOAuthErrorResponse(error: any): boolean {
    if (!error) {
      return false;
    }

    // Check for required fields
    if (!error.error || !error.timestamp) {
      return false;
    }

    // Validate error type
    const validOAuthErrors: OAuthErrorType[] = [
      'invalid_request',
      'invalid_client',
      'invalid_grant',
      'unauthorized_client',
      'unsupported_grant_type',
      'invalid_scope',
      'access_denied',
      'unsupported_response_type',
      'server_error',
      'temporarily_unavailable',
    ];

    return validOAuthErrors.includes(error.error);
  }

  // ===== ERROR RECOVERY =====

  /**
   * Get Recovery Suggestions
   */
  getRecoverySuggestions(error: AuthenticationError): string[] {
    const suggestions: string[] = [];

    switch (error.type) {
      case 'token_expired':
        suggestions.push('Refresh the token using the refresh token');
        suggestions.push('Request a new token from the authorization server');
        break;
      case 'invalid_scope':
        suggestions.push('Check the requested scopes are valid for the token type');
        suggestions.push('Request only the minimum required scopes');
        break;
      case 'insufficient_permissions':
        suggestions.push('Check if the token has the required permissions');
        suggestions.push('Request a token with additional scopes');
        break;
      case 'token_not_found':
        suggestions.push('Verify the token ID is correct');
        suggestions.push('Check if the token has been deleted');
        break;
      case 'authentication_error':
        suggestions.push('Verify the credentials are correct');
        suggestions.push('Check if the token is valid and not expired');
        break;
      case 'authorization_error':
        suggestions.push('Check if the user has the required permissions');
        suggestions.push('Verify the workspace/repository access');
        break;
    }

    return suggestions;
  }

  /**
   * Get OAuth Recovery Suggestions
   */
  getOAuthRecoverySuggestions(error: OAuthErrorDetails): string[] {
    const suggestions: string[] = [];

    switch (error.error) {
      case 'invalid_request':
        suggestions.push('Check all required parameters are provided');
        suggestions.push('Verify parameter values are correct');
        break;
      case 'invalid_client':
        suggestions.push('Verify client credentials are correct');
        suggestions.push('Check if the client is registered');
        break;
      case 'invalid_grant':
        suggestions.push('The authorization code may have expired');
        suggestions.push('Request a new authorization code');
        break;
      case 'invalid_scope':
        suggestions.push('Check the requested scopes are valid');
        suggestions.push('Request only supported scopes');
        break;
      case 'access_denied':
        suggestions.push('The user denied the authorization request');
        suggestions.push('Request authorization again');
        break;
      case 'server_error':
        suggestions.push('The authorization server is experiencing issues');
        suggestions.push('Retry the request after a delay');
        break;
    }

    return suggestions;
  }
}
