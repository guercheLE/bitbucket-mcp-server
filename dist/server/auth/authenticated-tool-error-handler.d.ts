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
import { AuthenticationError, UserSession } from '../../types/auth.js';
import { ToolResult } from '../../types/index.js';
/**
 * Error Context for Authenticated Tools
 */
export interface AuthenticatedToolErrorContext {
    /** Tool name that failed */
    toolName: string;
    /** User session (if available) */
    userSession?: UserSession;
    /** User ID */
    userId?: string;
    /** User permissions */
    userPermissions?: string[];
    /** Required permissions for the tool */
    requiredPermissions?: string[];
    /** Original error */
    originalError: Error;
    /** Request timestamp */
    timestamp: Date;
    /** Request ID */
    requestId: string;
}
/**
 * Error Recovery Suggestion
 */
export interface ErrorRecoverySuggestion {
    /** Recovery action */
    action: string;
    /** Recovery description */
    description: string;
    /** Whether recovery is automatic */
    automatic: boolean;
    /** Recovery parameters */
    parameters?: Record<string, any>;
}
/**
 * Authenticated Tool Error Handler
 * Handles errors specific to authenticated tool execution
 */
export declare class AuthenticatedToolErrorHandler extends EventEmitter {
    private errorMappings;
    private recoveryStrategies;
    constructor();
    /**
     * Handle authentication error
     */
    handleAuthenticationError(error: AuthenticationError, context: AuthenticatedToolErrorContext): ToolResult;
    /**
     * Handle authorization error
     */
    handleAuthorizationError(error: AuthenticationError, context: AuthenticatedToolErrorContext): ToolResult;
    /**
     * Handle general tool execution error
     */
    handleToolExecutionError(error: Error, context: AuthenticatedToolErrorContext): ToolResult;
    /**
     * Create user-friendly authentication error message
     */
    private createUserFriendlyMessage;
    /**
     * Create user-friendly authorization error message
     */
    private createAuthorizationMessage;
    /**
     * Create generic error message
     */
    private createGenericErrorMessage;
    /**
     * Create error details for authentication errors
     */
    private createErrorDetails;
    /**
     * Create generic error details
     */
    private createGenericErrorDetails;
    /**
     * Map authentication error code to MCP error code
     */
    private mapAuthenticationErrorToMCP;
    /**
     * Check if error code is authorization-related
     */
    private isAuthorizationError;
    /**
     * Get recovery suggestions for error code
     */
    private getRecoverySuggestions;
    /**
     * Initialize error code mappings
     */
    private initializeErrorMappings;
    /**
     * Initialize recovery strategies
     */
    private initializeRecoveryStrategies;
}
//# sourceMappingURL=authenticated-tool-error-handler.d.ts.map