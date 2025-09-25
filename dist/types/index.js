/**
 * Core Types for Bitbucket MCP Server
 *
 * This module defines the core TypeScript interfaces and types for the
 * MCP server, including tool definitions, execution contexts, and
 * authentication integration.
 *
 * Key Components:
 * - Tool: MCP tool definition with authentication support
 * - ToolExecutionContext: Enhanced context with authentication
 * - ToolRequest/Response: Request/response types with auth metadata
 * - MCPErrorCode: Error codes for MCP operations
 *
 * Constitutional Requirements:
 * - MCP protocol compliance
 * - Authentication integration
 * - Comprehensive error handling
 * - Type safety and validation
 */
// ============================================================================
// Error Codes
// ============================================================================
/**
 * MCP Error Codes
 * Standard error codes for MCP operations
 */
export var MCPErrorCode;
(function (MCPErrorCode) {
    // General errors
    MCPErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    MCPErrorCode["INVALID_REQUEST"] = "INVALID_REQUEST";
    MCPErrorCode["INVALID_PARAMS"] = "INVALID_PARAMS";
    // Tool errors
    MCPErrorCode["TOOL_NOT_FOUND"] = "TOOL_NOT_FOUND";
    MCPErrorCode["TOOL_EXECUTION_FAILED"] = "TOOL_EXECUTION_FAILED";
    MCPErrorCode["TOOL_VALIDATION_FAILED"] = "TOOL_VALIDATION_FAILED";
    // Authentication errors
    MCPErrorCode["AUTHENTICATION_REQUIRED"] = "AUTHENTICATION_REQUIRED";
    MCPErrorCode["AUTHENTICATION_FAILED"] = "AUTHENTICATION_FAILED";
    MCPErrorCode["AUTHORIZATION_FAILED"] = "AUTHORIZATION_FAILED";
    MCPErrorCode["SESSION_EXPIRED"] = "SESSION_EXPIRED";
    // Network errors
    MCPErrorCode["NETWORK_ERROR"] = "NETWORK_ERROR";
    MCPErrorCode["TIMEOUT_ERROR"] = "TIMEOUT_ERROR";
    MCPErrorCode["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    // Bitbucket API errors
    MCPErrorCode["BITBUCKET_API_ERROR"] = "BITBUCKET_API_ERROR";
    MCPErrorCode["BITBUCKET_PERMISSION_DENIED"] = "BITBUCKET_PERMISSION_DENIED";
    MCPErrorCode["BITBUCKET_RESOURCE_NOT_FOUND"] = "BITBUCKET_RESOURCE_NOT_FOUND";
})(MCPErrorCode || (MCPErrorCode = {}));
// ============================================================================
// Export all types
// ============================================================================
export * from './auth.js';
//# sourceMappingURL=index.js.map