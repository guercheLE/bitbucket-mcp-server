/**
 * MCP Error Handler Implementation
 *
 * Implements comprehensive error handling for MCP protocol compliance
 * with JSON-RPC 2.0 error codes and MCP-specific error extensions.
 *
 * Key Features:
 * - JSON-RPC 2.0 standard error codes
 * - MCP protocol specific error codes
 * - Structured error responses
 * - Error logging and monitoring
 * - Error recovery mechanisms
 * - Client-friendly error messages
 *
 * Constitutional Requirements:
 * - MCP Protocol First
 * - Complete API Coverage
 * - Error handling and logging
 * - Memory efficiency (<1GB limit)
 */
import { MCPErrorCode } from '../types/index.js';
import { AuthenticationErrorCode } from '../types/auth.js';
/**
 * Error Severity Levels
 * For logging and monitoring purposes
 */
export var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "low";
    ErrorSeverity["MEDIUM"] = "medium";
    ErrorSeverity["HIGH"] = "high";
    ErrorSeverity["CRITICAL"] = "critical";
})(ErrorSeverity || (ErrorSeverity = {}));
/**
 * MCP Error Handler Class
 *
 * Centralized error handling for MCP server operations
 */
export class MCPErrorHandler {
    errorCounts = new Map();
    errorLog = [];
    maxErrorLogSize = 1000;
    constructor() {
        this.initializeErrorCounts();
    }
    /**
     * Create a standardized MCP error response
     */
    createErrorResponse(id, code, message, context) {
        const errorData = {
            timestamp: new Date().toISOString(),
            requestId: context?.request?.id,
            sessionId: context?.session?.id
        };
        // Add operation context if available
        if (context?.operation) {
            errorData.operation = context.operation;
        }
        // Add metadata if available
        if (context?.metadata) {
            errorData.context = context.metadata;
        }
        // Add stack trace in development mode
        if (process.env.NODE_ENV === 'development') {
            const stack = new Error().stack;
            if (stack) {
                errorData.stack = stack;
            }
        }
        const errorResponse = {
            jsonrpc: '2.0',
            id,
            error: {
                code,
                message,
                data: errorData
            }
        };
        // Log the error
        this.logError(errorResponse, this.getErrorSeverity(code));
        // Update error counts
        this.updateErrorCount(code);
        return errorResponse;
    }
    /**
     * Handle JSON-RPC 2.0 standard errors
     */
    handleJSONRPCError(id, code, message, context) {
        return this.createErrorResponse(id, code, message, context);
    }
    /**
     * Handle MCP protocol specific errors
     */
    handleMCPError(id, code, message, context) {
        return this.createErrorResponse(id, code, message, context);
    }
    /**
     * Handle authentication errors
     * Provides specific error handling for authentication-related failures
     */
    handleAuthenticationError(id, error, context) {
        const mcpCode = this.mapAuthenticationErrorCode(error.code);
        const message = this.getAuthenticationErrorMessage(error);
        const authContext = {
            ...context,
            operation: 'authentication',
            metadata: {
                errorCode: error.code,
                isRecoverable: error.isRecoverable,
                timestamp: error.timestamp.toISOString(),
                ...context?.metadata
            }
        };
        return this.createErrorResponse(id, mcpCode, message, authContext);
    }
    /**
     * Handle tool execution errors
     */
    handleToolError(id, toolName, error, context) {
        const mcpCode = this.mapErrorToMCPCode(error);
        const message = `Tool execution failed for '${toolName}': ${error.message}`;
        const toolContext = {
            ...context,
            operation: `tool_execution:${toolName}`,
            metadata: {
                toolName,
                originalError: error.message,
                ...context?.metadata
            }
        };
        return this.createErrorResponse(id, mcpCode, message, toolContext);
    }
    /**
     * Handle transport errors
     */
    handleTransportError(id, transportType, error, context) {
        const mcpCode = MCPErrorCode.TRANSPORT_ERROR;
        const message = `Transport error (${transportType}): ${error.message}`;
        const transportContext = {
            ...context,
            operation: `transport:${transportType}`,
            metadata: {
                transportType,
                originalError: error.message,
                ...context?.metadata
            }
        };
        return this.createErrorResponse(id, mcpCode, message, transportContext);
    }
    /**
     * Handle session errors
     */
    handleSessionError(id, sessionId, error, context) {
        const mcpCode = this.mapErrorToMCPCode(error);
        const message = `Session error for '${sessionId}': ${error.message}`;
        const sessionContext = {
            ...context,
            operation: `session:${sessionId}`,
            metadata: {
                sessionId,
                originalError: error.message,
                ...context?.metadata
            }
        };
        return this.createErrorResponse(id, mcpCode, message, sessionContext);
    }
    /**
     * Handle validation errors
     */
    handleValidationError(id, field, value, rule, context) {
        const mcpCode = MCPErrorCode.INVALID_PARAMS;
        const message = `Validation failed for field '${field}': ${rule}`;
        const validationContext = {
            ...context,
            operation: 'validation',
            metadata: {
                field,
                value: typeof value === 'object' ? JSON.stringify(value) : value,
                rule,
                ...context?.metadata
            }
        };
        return this.createErrorResponse(id, mcpCode, message, validationContext);
    }
    /**
     * Handle memory limit errors
     */
    handleMemoryError(id, currentUsage, limit, context) {
        const mcpCode = MCPErrorCode.MEMORY_LIMIT_EXCEEDED;
        const message = `Memory limit exceeded: ${currentUsage} bytes (limit: ${limit} bytes)`;
        const memoryContext = {
            ...context,
            operation: 'memory_check',
            metadata: {
                currentUsage,
                limit,
                usagePercentage: Math.round((currentUsage / limit) * 100),
                ...context?.metadata
            }
        };
        return this.createErrorResponse(id, mcpCode, message, memoryContext);
    }
    /**
     * Handle rate limiting errors
     */
    handleRateLimitError(id, limit, window, context) {
        const mcpCode = MCPErrorCode.RATE_LIMIT_EXCEEDED;
        const message = `Rate limit exceeded: ${limit} requests per ${window}ms`;
        const rateLimitContext = {
            ...context,
            operation: 'rate_limit',
            metadata: {
                limit,
                window,
                ...context?.metadata
            }
        };
        return this.createErrorResponse(id, mcpCode, message, rateLimitContext);
    }
    /**
     * Get error statistics
     */
    getErrorStatistics() {
        const totalErrors = Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0);
        const errorCounts = Object.fromEntries(this.errorCounts);
        const recentErrors = this.errorLog.slice(-10).map(entry => ({
            timestamp: entry.timestamp,
            code: entry.error.error.code,
            message: entry.error.error.message
        }));
        return {
            totalErrors,
            errorCounts,
            recentErrors,
            errorRate: this.calculateErrorRate()
        };
    }
    /**
     * Clear error log (for memory management)
     */
    clearErrorLog() {
        this.errorLog = [];
        this.errorCounts.clear();
        this.initializeErrorCounts();
    }
    // ============================================================================
    // Private Methods
    // ============================================================================
    /**
     * Initialize error counts for all MCP error codes
     */
    initializeErrorCounts() {
        Object.values(MCPErrorCode).forEach(code => {
            if (typeof code === 'number') {
                this.errorCounts.set(code, 0);
            }
        });
    }
    /**
     * Map generic errors to MCP error codes
     */
    mapErrorToMCPCode(error) {
        const message = error.message.toLowerCase();
        if (message.includes('not found') || message.includes('does not exist')) {
            return MCPErrorCode.RESOURCE_NOT_FOUND;
        }
        if (message.includes('unauthorized') || message.includes('authentication')) {
            return MCPErrorCode.AUTHENTICATION_FAILED;
        }
        if (message.includes('forbidden') || message.includes('permission')) {
            return MCPErrorCode.AUTHORIZATION_FAILED;
        }
        if (message.includes('timeout') || message.includes('expired')) {
            return MCPErrorCode.SESSION_EXPIRED;
        }
        if (message.includes('concurrent') || message.includes('lock')) {
            return MCPErrorCode.CONCURRENT_OPERATION;
        }
        if (message.includes('memory') || message.includes('heap')) {
            return MCPErrorCode.MEMORY_LIMIT_EXCEEDED;
        }
        if (message.includes('tool') && message.includes('execution')) {
            return MCPErrorCode.TOOL_EXECUTION_FAILED;
        }
        if (message.includes('tool') && message.includes('not found')) {
            return MCPErrorCode.TOOL_NOT_FOUND;
        }
        if (message.includes('transport') || message.includes('connection')) {
            return MCPErrorCode.TRANSPORT_ERROR;
        }
        if (message.includes('initialization') || message.includes('init')) {
            return MCPErrorCode.INITIALIZATION_FAILED;
        }
        // Default to internal error
        return MCPErrorCode.INTERNAL_ERROR;
    }
    /**
     * Map authentication error codes to MCP error codes
     */
    mapAuthenticationErrorCode(authCode) {
        switch (authCode) {
            case AuthenticationErrorCode.INVALID_CREDENTIALS:
                return MCPErrorCode.AUTHENTICATION_FAILED;
            case AuthenticationErrorCode.SESSION_EXPIRED:
                return MCPErrorCode.SESSION_EXPIRED;
            case AuthenticationErrorCode.INSUFFICIENT_PERMISSIONS:
                return MCPErrorCode.AUTHORIZATION_FAILED;
            case AuthenticationErrorCode.ACCOUNT_LOCKED:
                return MCPErrorCode.AUTHENTICATION_FAILED;
            case AuthenticationErrorCode.TOKEN_INVALID:
                return MCPErrorCode.AUTHENTICATION_FAILED;
            case AuthenticationErrorCode.TOKEN_EXPIRED:
                return MCPErrorCode.SESSION_EXPIRED;
            case AuthenticationErrorCode.REFRESH_TOKEN_INVALID:
                return MCPErrorCode.AUTHENTICATION_FAILED;
            case AuthenticationErrorCode.REFRESH_TOKEN_EXPIRED:
                return MCPErrorCode.SESSION_EXPIRED;
            case AuthenticationErrorCode.USER_NOT_FOUND:
                return MCPErrorCode.AUTHENTICATION_FAILED;
            case AuthenticationErrorCode.APPLICATION_NOT_FOUND:
                return MCPErrorCode.AUTHENTICATION_FAILED;
            case AuthenticationErrorCode.APPLICATION_DISABLED:
                return MCPErrorCode.AUTHENTICATION_FAILED;
            case AuthenticationErrorCode.RATE_LIMIT_EXCEEDED:
                return MCPErrorCode.RATE_LIMIT_EXCEEDED;
            case AuthenticationErrorCode.NETWORK_ERROR:
                return MCPErrorCode.TRANSPORT_ERROR;
            case AuthenticationErrorCode.SERVER_ERROR:
                return MCPErrorCode.INTERNAL_ERROR;
            case AuthenticationErrorCode.UNKNOWN_ERROR:
            default:
                return MCPErrorCode.INTERNAL_ERROR;
        }
    }
    /**
     * Get user-friendly error message for authentication errors
     */
    getAuthenticationErrorMessage(error) {
        switch (error.code) {
            case AuthenticationErrorCode.INVALID_CREDENTIALS:
                return 'Invalid credentials provided';
            case AuthenticationErrorCode.SESSION_EXPIRED:
                return 'User session has expired';
            case AuthenticationErrorCode.INSUFFICIENT_PERMISSIONS:
                return 'Insufficient permissions for this operation';
            case AuthenticationErrorCode.ACCOUNT_LOCKED:
                return 'User account is locked';
            case AuthenticationErrorCode.TOKEN_INVALID:
                return 'Invalid access token';
            case AuthenticationErrorCode.TOKEN_EXPIRED:
                return 'Access token has expired';
            case AuthenticationErrorCode.REFRESH_TOKEN_INVALID:
                return 'Invalid refresh token';
            case AuthenticationErrorCode.REFRESH_TOKEN_EXPIRED:
                return 'Refresh token has expired';
            case AuthenticationErrorCode.USER_NOT_FOUND:
                return 'User not found';
            case AuthenticationErrorCode.APPLICATION_NOT_FOUND:
                return 'Application not found';
            case AuthenticationErrorCode.APPLICATION_DISABLED:
                return 'Application is disabled';
            case AuthenticationErrorCode.RATE_LIMIT_EXCEEDED:
                return 'Rate limit exceeded';
            case AuthenticationErrorCode.NETWORK_ERROR:
                return 'Network error during authentication';
            case AuthenticationErrorCode.SERVER_ERROR:
                return 'Authentication server error';
            case AuthenticationErrorCode.UNKNOWN_ERROR:
            default:
                return 'Unknown authentication error';
        }
    }
    /**
     * Get error severity based on error code
     */
    getErrorSeverity(code) {
        switch (code) {
            case MCPErrorCode.PARSE_ERROR:
            case MCPErrorCode.INVALID_REQUEST:
            case MCPErrorCode.INVALID_PARAMS:
                return ErrorSeverity.LOW;
            case MCPErrorCode.METHOD_NOT_FOUND:
            case MCPErrorCode.TOOL_NOT_FOUND:
            case MCPErrorCode.RESOURCE_NOT_FOUND:
                return ErrorSeverity.MEDIUM;
            case MCPErrorCode.TOOL_EXECUTION_FAILED:
            case MCPErrorCode.TRANSPORT_ERROR:
            case MCPErrorCode.SESSION_EXPIRED:
            case MCPErrorCode.RATE_LIMIT_EXCEEDED:
                return ErrorSeverity.HIGH;
            case MCPErrorCode.INTERNAL_ERROR:
            case MCPErrorCode.INITIALIZATION_FAILED:
            case MCPErrorCode.MEMORY_LIMIT_EXCEEDED:
            case MCPErrorCode.AUTHENTICATION_FAILED:
            case MCPErrorCode.AUTHORIZATION_FAILED:
                return ErrorSeverity.CRITICAL;
            default:
                return ErrorSeverity.MEDIUM;
        }
    }
    /**
     * Log error for monitoring and debugging
     */
    logError(error, severity) {
        this.errorLog.push({
            timestamp: new Date(),
            error,
            severity
        });
        // Maintain log size limit
        if (this.errorLog.length > this.maxErrorLogSize) {
            this.errorLog = this.errorLog.slice(-this.maxErrorLogSize);
        }
        // Log to console based on severity
        const logMessage = `[${severity.toUpperCase()}] MCP Error ${error.error.code}: ${error.error.message}`;
        switch (severity) {
            case ErrorSeverity.LOW:
                console.debug(logMessage);
                break;
            case ErrorSeverity.MEDIUM:
                console.warn(logMessage);
                break;
            case ErrorSeverity.HIGH:
                console.error(logMessage);
                break;
            case ErrorSeverity.CRITICAL:
                console.error(`🚨 CRITICAL: ${logMessage}`);
                break;
        }
    }
    /**
     * Update error count for monitoring
     */
    updateErrorCount(code) {
        const currentCount = this.errorCounts.get(code) || 0;
        this.errorCounts.set(code, currentCount + 1);
    }
    /**
     * Calculate error rate (errors per minute)
     */
    calculateErrorRate() {
        const now = new Date();
        const oneMinuteAgo = new Date(now.getTime() - 60000);
        const recentErrors = this.errorLog.filter(entry => entry.timestamp >= oneMinuteAgo);
        return recentErrors.length;
    }
}
/**
 * Global error handler instance
 */
export const mcpErrorHandler = new MCPErrorHandler();
/**
 * Utility function to create error responses
 */
export function createMCPError(id, code, message, context) {
    return mcpErrorHandler.createErrorResponse(id, code, message, context);
}
/**
 * Utility function to handle tool errors
 */
export function handleToolError(id, toolName, error, context) {
    return mcpErrorHandler.handleToolError(id, toolName, error, context);
}
/**
 * Utility function to handle transport errors
 */
export function handleTransportError(id, transportType, error, context) {
    return mcpErrorHandler.handleTransportError(id, transportType, error, context);
}
/**
 * Utility function to handle authentication errors
 */
export function handleAuthenticationError(id, error, context) {
    return mcpErrorHandler.handleAuthenticationError(id, error, context);
}
export default MCPErrorHandler;
//# sourceMappingURL=error-handler.js.map