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
import { MCPErrorCode, ProtocolMessage, ClientSession, ToolExecutionContext } from '../types/index.js';
import { AuthenticationError } from '../types/auth.js';
/**
 * MCP Error Response Structure
 * Follows JSON-RPC 2.0 specification for error responses
 */
export interface MCPErrorResponse {
    jsonrpc: '2.0';
    id: string | number | null;
    error: {
        code: MCPErrorCode;
        message: string;
        data?: {
            details?: string;
            stack?: string;
            context?: Record<string, any>;
            timestamp: string;
            requestId?: string;
            sessionId?: string;
        };
    };
}
/**
 * Error Context Information
 * Additional context for error debugging and logging
 */
export interface ErrorContext {
    session?: ClientSession;
    request?: ProtocolMessage;
    toolContext?: ToolExecutionContext;
    operation?: string;
    metadata?: Record<string, any>;
}
/**
 * Error Severity Levels
 * For logging and monitoring purposes
 */
export declare enum ErrorSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
/**
 * MCP Error Handler Class
 *
 * Centralized error handling for MCP server operations
 */
export declare class MCPErrorHandler {
    private errorCounts;
    private errorLog;
    private maxErrorLogSize;
    constructor();
    /**
     * Create a standardized MCP error response
     */
    createErrorResponse(id: string | number | null, code: MCPErrorCode, message: string, context?: ErrorContext): MCPErrorResponse;
    /**
     * Handle JSON-RPC 2.0 standard errors
     */
    handleJSONRPCError(id: string | number | null, code: MCPErrorCode, message: string, context?: ErrorContext): MCPErrorResponse;
    /**
     * Handle MCP protocol specific errors
     */
    handleMCPError(id: string | number | null, code: MCPErrorCode, message: string, context?: ErrorContext): MCPErrorResponse;
    /**
     * Handle authentication errors
     * Provides specific error handling for authentication-related failures
     */
    handleAuthenticationError(id: string | number | null, error: AuthenticationError, context?: ErrorContext): MCPErrorResponse;
    /**
     * Handle tool execution errors
     */
    handleToolError(id: string | number | null, toolName: string, error: Error, context?: ErrorContext): MCPErrorResponse;
    /**
     * Handle transport errors
     */
    handleTransportError(id: string | number | null, transportType: string, error: Error, context?: ErrorContext): MCPErrorResponse;
    /**
     * Handle session errors
     */
    handleSessionError(id: string | number | null, sessionId: string, error: Error, context?: ErrorContext): MCPErrorResponse;
    /**
     * Handle validation errors
     */
    handleValidationError(id: string | number | null, field: string, value: any, rule: string, context?: ErrorContext): MCPErrorResponse;
    /**
     * Handle memory limit errors
     */
    handleMemoryError(id: string | number | null, currentUsage: number, limit: number, context?: ErrorContext): MCPErrorResponse;
    /**
     * Handle rate limiting errors
     */
    handleRateLimitError(id: string | number | null, limit: number, window: number, context?: ErrorContext): MCPErrorResponse;
    /**
     * Get error statistics
     */
    getErrorStatistics(): {
        totalErrors: number;
        errorCounts: Record<MCPErrorCode, number>;
        recentErrors: Array<{
            timestamp: Date;
            code: MCPErrorCode;
            message: string;
        }>;
        errorRate: number;
    };
    /**
     * Clear error log (for memory management)
     */
    clearErrorLog(): void;
    /**
     * Initialize error counts for all MCP error codes
     */
    private initializeErrorCounts;
    /**
     * Map generic errors to MCP error codes
     */
    private mapErrorToMCPCode;
    /**
     * Map authentication error codes to MCP error codes
     */
    private mapAuthenticationErrorCode;
    /**
     * Get user-friendly error message for authentication errors
     */
    private getAuthenticationErrorMessage;
    /**
     * Get error severity based on error code
     */
    private getErrorSeverity;
    /**
     * Log error for monitoring and debugging
     */
    private logError;
    /**
     * Update error count for monitoring
     */
    private updateErrorCount;
    /**
     * Calculate error rate (errors per minute)
     */
    private calculateErrorRate;
}
/**
 * Global error handler instance
 */
export declare const mcpErrorHandler: MCPErrorHandler;
/**
 * Utility function to create error responses
 */
export declare function createMCPError(id: string | number | null, code: MCPErrorCode, message: string, context?: ErrorContext): MCPErrorResponse;
/**
 * Utility function to handle tool errors
 */
export declare function handleToolError(id: string | number | null, toolName: string, error: Error, context?: ErrorContext): MCPErrorResponse;
/**
 * Utility function to handle transport errors
 */
export declare function handleTransportError(id: string | number | null, transportType: string, error: Error, context?: ErrorContext): MCPErrorResponse;
/**
 * Utility function to handle authentication errors
 */
export declare function handleAuthenticationError(id: string | number | null, error: AuthenticationError, context?: ErrorContext): MCPErrorResponse;
export default MCPErrorHandler;
//# sourceMappingURL=error-handler.d.ts.map