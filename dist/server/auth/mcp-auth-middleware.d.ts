/**
 * MCP Authentication Middleware for Bitbucket MCP Server
 *
 * This module provides middleware functionality for integrating authentication
 * with MCP server requests, including request interception, authentication
 * validation, and response modification.
 *
 * Key Features:
 * - MCP request authentication middleware
 * - Automatic token validation and refresh
 * - Request/response modification
 * - Error handling and security monitoring
 * - Integration with MCP protocol handlers
 *
 * Constitutional Requirements:
 * - MCP protocol compliance
 * - Secure authentication flow
 * - Comprehensive error handling
 * - Performance optimization
 */
import { EventEmitter } from 'events';
import { AuthenticationManager, AuthenticationResponse } from '../../types/auth';
import { MCPServer, ClientSession, ToolRequest, ToolResponse, MCPRequest, MCPResponse } from '../../types';
import { MCPAuthIntegration } from './mcp-auth-integration';
/**
 * MCP Authentication Middleware Class
 * Handles authentication for MCP requests and responses
 */
export declare class MCPAuthMiddleware extends EventEmitter {
    private authIntegration;
    private authManager;
    private mcpServer;
    private requireAuth;
    private autoRefresh;
    constructor(authIntegration: MCPAuthIntegration, authManager: AuthenticationManager, mcpServer: MCPServer, requireAuth?: boolean, autoRefresh?: boolean);
    /**
     * Process incoming MCP request with authentication
     */
    processRequest(request: MCPRequest, clientSession: ClientSession): Promise<AuthenticationResponse<MCPRequest>>;
    /**
     * Process outgoing MCP response with authentication context
     */
    processResponse(response: MCPResponse, clientSession: ClientSession, originalRequest: MCPRequest): Promise<AuthenticationResponse<MCPResponse>>;
    /**
     * Process tool request with authentication
     */
    processToolRequest(toolRequest: ToolRequest, clientSession: ClientSession): Promise<AuthenticationResponse<ToolRequest>>;
    /**
     * Process tool response with authentication context
     */
    processToolResponse(toolResponse: ToolResponse, clientSession: ClientSession, originalRequest: ToolRequest): Promise<AuthenticationResponse<ToolResponse>>;
    /**
     * Check if user has permission to execute tool
     */
    private checkToolPermissions;
    /**
     * Extract authentication information from MCP request
     */
    private extractAuthInfo;
    /**
     * Add authentication context to MCP request
     */
    private addAuthContext;
    /**
     * Add authentication metadata to MCP response
     */
    private addAuthMetadata;
    /**
     * Add authentication context to tool request
     */
    private addToolAuthContext;
    /**
     * Add authentication metadata to tool response
     */
    private addToolAuthMetadata;
    /**
     * Create authentication error response for MCP request
     */
    private createAuthErrorResponse;
    /**
     * Create authentication error response for tool request
     */
    private createToolAuthErrorResponse;
    /**
     * Check if error is recoverable
     */
    private isRecoverableError;
    /**
     * Setup event handlers
     */
    private setupEventHandlers;
    /**
     * Generate unique request ID
     */
    private generateRequestId;
}
//# sourceMappingURL=mcp-auth-middleware.d.ts.map