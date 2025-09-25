/**
 * Authenticated Tool Error Handler
 *
 * This module provides specialized error handling for authenticated MCP tools,
 * including authentication-specific errors, authorization failures, and
 * user-friendly error messages with proper error codes.
 *
 * Key Features:
 * - Authentication error handling
 * - Authorization error handling
 * - User-friendly error messages
 * - Proper error code mapping
 * - Error recovery suggestions
 * - Security-aware error reporting
 *
 * Constitutional Requirements:
 * - Comprehensive error handling
 * - User-friendly error messages
 * - Security best practices
 * - Proper error code mapping
 */
import { EventEmitter } from 'events';
import { AuthenticationErrorCode } from '../../types/auth.js';
import { MCPErrorCode } from '../../types/index.js';
/**
 * Authenticated Tool Error Handler
 * Handles errors specific to authenticated tool execution
 */
export class AuthenticatedToolErrorHandler extends EventEmitter {
    errorMappings = new Map();
    recoveryStrategies = new Map();
    constructor() {
        super();
        this.initializeErrorMappings();
        this.initializeRecoveryStrategies();
    }
    // ============================================================================
    // Error Handling
    // ============================================================================
    /**
     * Handle authentication error
     */
    handleAuthenticationError(error, context) {
        const mcpErrorCode = this.mapAuthenticationErrorToMCP(error.code);
        const recoverySuggestions = this.getRecoverySuggestions(error.code);
        // Emit error event for monitoring
        this.emit('authentication:error', {
            error,
            context,
            mcpErrorCode,
            recoverySuggestions
        });
        return {
            success: false,
            error: {
                code: mcpErrorCode,
                message: this.createUserFriendlyMessage(error, context),
                details: this.createErrorDetails(error, context)
            },
            metadata: {
                executionTime: 0,
                memoryUsed: 0,
                timestamp: new Date(),
                authentication: {
                    isAuthenticated: false,
                    userId: context.userId,
                    permissions: context.userPermissions || []
                },
                recovery: recoverySuggestions
            }
        };
    }
    /**
     * Handle authorization error
     */
    handleAuthorizationError(error, context) {
        const mcpErrorCode = MCPErrorCode.AUTHORIZATION_FAILED;
        const recoverySuggestions = this.getRecoverySuggestions(error.code);
        // Emit error event for monitoring
        this.emit('authorization:error', {
            error,
            context,
            mcpErrorCode,
            recoverySuggestions
        });
        return {
            success: false,
            error: {
                code: mcpErrorCode,
                message: this.createAuthorizationMessage(error, context),
                details: this.createErrorDetails(error, context)
            },
            metadata: {
                executionTime: 0,
                memoryUsed: 0,
                timestamp: new Date(),
                authentication: {
                    isAuthenticated: context.userSession ? true : false,
                    userId: context.userId,
                    permissions: context.userPermissions || []
                },
                recovery: recoverySuggestions
            }
        };
    }
    /**
     * Handle general tool execution error
     */
    handleToolExecutionError(error, context) {
        // Check if it's an authentication-related error
        if (error instanceof AuthenticationError) {
            if (this.isAuthorizationError(error.code)) {
                return this.handleAuthorizationError(error, context);
            }
            else {
                return this.handleAuthenticationError(error, context);
            }
        }
        // Handle other types of errors
        const mcpErrorCode = MCPErrorCode.TOOL_EXECUTION_FAILED;
        // Emit error event for monitoring
        this.emit('tool:execution-error', {
            error,
            context,
            mcpErrorCode
        });
        return {
            success: false,
            error: {
                code: mcpErrorCode,
                message: this.createGenericErrorMessage(error, context),
                details: this.createGenericErrorDetails(error, context)
            },
            metadata: {
                executionTime: 0,
                memoryUsed: 0,
                timestamp: new Date(),
                authentication: {
                    isAuthenticated: context.userSession ? true : false,
                    userId: context.userId,
                    permissions: context.userPermissions || []
                }
            }
        };
    }
    // ============================================================================
    // Error Message Creation
    // ============================================================================
    /**
     * Create user-friendly authentication error message
     */
    createUserFriendlyMessage(error, context) {
        switch (error.code) {
            case AuthenticationErrorCode.AUTHENTICATION_FAILED:
                return `Authentication required to use the '${context.toolName}' tool. Please authenticate with Bitbucket first.`;
            case AuthenticationErrorCode.SESSION_EXPIRED:
                return `Your session has expired. Please re-authenticate to use the '${context.toolName}' tool.`;
            case AuthenticationErrorCode.TOKEN_EXPIRED:
                return `Your access token has expired. Please refresh your authentication to use the '${context.toolName}' tool.`;
            case AuthenticationErrorCode.INVALID_TOKEN:
                return `Invalid authentication token. Please re-authenticate to use the '${context.toolName}' tool.`;
            case AuthenticationErrorCode.NETWORK_ERROR:
                return `Network error while authenticating. Please check your connection and try again.`;
            case AuthenticationErrorCode.TIMEOUT_ERROR:
                return `Authentication request timed out. Please try again.`;
            case AuthenticationErrorCode.RATE_LIMIT_EXCEEDED:
                return `Too many authentication requests. Please wait a moment and try again.`;
            default:
                return `Authentication error: ${error.message}`;
        }
    }
    /**
     * Create user-friendly authorization error message
     */
    createAuthorizationMessage(error, context) {
        if (context.requiredPermissions && context.requiredPermissions.length > 0) {
            return `You don't have the required permissions to use the '${context.toolName}' tool. Required permissions: ${context.requiredPermissions.join(', ')}.`;
        }
        return `You don't have permission to use the '${context.toolName}' tool. Please contact your administrator.`;
    }
    /**
     * Create generic error message
     */
    createGenericErrorMessage(error, context) {
        return `Failed to execute '${context.toolName}' tool: ${error.message}`;
    }
    // ============================================================================
    // Error Details Creation
    // ============================================================================
    /**
     * Create error details for authentication errors
     */
    createErrorDetails(error, context) {
        return {
            authenticationError: {
                code: error.code,
                message: error.message,
                timestamp: error.timestamp,
                isRecoverable: error.isRecoverable
            },
            context: {
                toolName: context.toolName,
                userId: context.userId,
                userPermissions: context.userPermissions,
                requiredPermissions: context.requiredPermissions,
                requestId: context.requestId
            },
            suggestions: this.getRecoverySuggestions(error.code)
        };
    }
    /**
     * Create generic error details
     */
    createGenericErrorDetails(error, context) {
        return {
            originalError: {
                name: error.name,
                message: error.message,
                stack: error.stack
            },
            context: {
                toolName: context.toolName,
                userId: context.userId,
                requestId: context.requestId
            }
        };
    }
    // ============================================================================
    // Error Code Mapping
    // ============================================================================
    /**
     * Map authentication error code to MCP error code
     */
    mapAuthenticationErrorToMCP(authErrorCode) {
        const mapping = this.errorMappings.get(authErrorCode);
        return mapping || MCPErrorCode.AUTHENTICATION_FAILED;
    }
    /**
     * Check if error code is authorization-related
     */
    isAuthorizationError(errorCode) {
        return errorCode === AuthenticationErrorCode.AUTHORIZATION_FAILED;
    }
    // ============================================================================
    // Recovery Suggestions
    // ============================================================================
    /**
     * Get recovery suggestions for error code
     */
    getRecoverySuggestions(errorCode) {
        return this.recoveryStrategies.get(errorCode) || [];
    }
    // ============================================================================
    // Initialization
    // ============================================================================
    /**
     * Initialize error code mappings
     */
    initializeErrorMappings() {
        this.errorMappings.set(AuthenticationErrorCode.AUTHENTICATION_FAILED, MCPErrorCode.AUTHENTICATION_FAILED);
        this.errorMappings.set(AuthenticationErrorCode.AUTHORIZATION_FAILED, MCPErrorCode.AUTHORIZATION_FAILED);
        this.errorMappings.set(AuthenticationErrorCode.SESSION_EXPIRED, MCPErrorCode.SESSION_EXPIRED);
        this.errorMappings.set(AuthenticationErrorCode.TOKEN_EXPIRED, MCPErrorCode.AUTHENTICATION_FAILED);
        this.errorMappings.set(AuthenticationErrorCode.INVALID_TOKEN, MCPErrorCode.AUTHENTICATION_FAILED);
        this.errorMappings.set(AuthenticationErrorCode.NETWORK_ERROR, MCPErrorCode.NETWORK_ERROR);
        this.errorMappings.set(AuthenticationErrorCode.TIMEOUT_ERROR, MCPErrorCode.TIMEOUT_ERROR);
        this.errorMappings.set(AuthenticationErrorCode.RATE_LIMIT_EXCEEDED, MCPErrorCode.RATE_LIMIT_EXCEEDED);
        this.errorMappings.set(AuthenticationErrorCode.INTERNAL_ERROR, MCPErrorCode.INTERNAL_ERROR);
    }
    /**
     * Initialize recovery strategies
     */
    initializeRecoveryStrategies() {
        // Authentication failed
        this.recoveryStrategies.set(AuthenticationErrorCode.AUTHENTICATION_FAILED, [
            {
                action: 'authenticate',
                description: 'Authenticate with Bitbucket using OAuth',
                automatic: false,
                parameters: {
                    method: 'oauth2',
                    scopes: ['repository:read', 'repository:write']
                }
            }
        ]);
        // Session expired
        this.recoveryStrategies.set(AuthenticationErrorCode.SESSION_EXPIRED, [
            {
                action: 'refresh_session',
                description: 'Refresh your authentication session',
                automatic: true
            },
            {
                action: 're_authenticate',
                description: 'Re-authenticate with Bitbucket',
                automatic: false
            }
        ]);
        // Token expired
        this.recoveryStrategies.set(AuthenticationErrorCode.TOKEN_EXPIRED, [
            {
                action: 'refresh_token',
                description: 'Refresh your access token',
                automatic: true
            }
        ]);
        // Authorization failed
        this.recoveryStrategies.set(AuthenticationErrorCode.AUTHORIZATION_FAILED, [
            {
                action: 'request_permissions',
                description: 'Request additional permissions from your administrator',
                automatic: false
            },
            {
                action: 'use_different_account',
                description: 'Use an account with the required permissions',
                automatic: false
            }
        ]);
        // Network error
        this.recoveryStrategies.set(AuthenticationErrorCode.NETWORK_ERROR, [
            {
                action: 'retry',
                description: 'Retry the request after checking your network connection',
                automatic: true,
                parameters: {
                    maxRetries: 3,
                    retryDelay: 1000
                }
            }
        ]);
        // Timeout error
        this.recoveryStrategies.set(AuthenticationErrorCode.TIMEOUT_ERROR, [
            {
                action: 'retry',
                description: 'Retry the request with a longer timeout',
                automatic: true,
                parameters: {
                    maxRetries: 2,
                    retryDelay: 2000
                }
            }
        ]);
        // Rate limit exceeded
        this.recoveryStrategies.set(AuthenticationErrorCode.RATE_LIMIT_EXCEEDED, [
            {
                action: 'wait_and_retry',
                description: 'Wait for the rate limit to reset and retry',
                automatic: true,
                parameters: {
                    waitTime: 60000 // 1 minute
                }
            }
        ]);
    }
}
//# sourceMappingURL=authenticated-tool-error-handler.js.map