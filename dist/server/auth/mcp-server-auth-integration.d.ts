/**
 * MCP Server Authentication Integration for Bitbucket MCP Server
 *
 * This module provides the main integration point between the authentication
 * system and the MCP server, handling server initialization, client connections,
 * and authentication flow management.
 *
 * Key Features:
 * - MCP server authentication initialization
 * - Client connection management with authentication
 * - Authentication flow orchestration
 * - Server lifecycle management
 * - Integration with existing MCP infrastructure
 *
 * Constitutional Requirements:
 * - MCP protocol compliance
 * - Secure authentication flow
 * - Comprehensive error handling
 * - Performance optimization
 */
import { EventEmitter } from 'events';
import { AuthenticationConfig, AuthenticationResponse } from '../../types/auth';
import { MCPServer } from '../../types';
/**
 * MCP Server Authentication Integration Class
 * Main integration point for authentication with MCP server
 */
export declare class MCPServerAuthIntegration extends EventEmitter {
    private authManager;
    private mcpServer;
    private authIntegration;
    private authMiddleware;
    private config;
    private initialized;
    constructor(mcpServer: MCPServer, config: AuthenticationConfig);
    /**
     * Initialize authentication integration with MCP server
     */
    initialize(): Promise<AuthenticationResponse<void>>;
    /**
     * Setup MCP server authentication hooks
     */
    private setupMCPServerHooks;
    /**
     * Handle client connection with authentication
     */
    private handleClientConnected;
    /**
     * Handle client disconnection
     */
    private handleClientDisconnected;
    /**
     * Handle incoming MCP request with authentication
     */
    private handleRequestReceived;
    /**
     * Handle outgoing MCP response with authentication context
     */
    private handleResponseSent;
    /**
     * Handle tool request with authentication
     */
    private handleToolRequest;
    /**
     * Handle tool response with authentication context
     */
    private handleToolResponse;
    /**
     * Get authentication status for all clients
     */
    getAuthenticationStatus(): any;
    /**
     * Get authentication status for specific client
     */
    getClientAuthenticationStatus(clientId: string): any;
    /**
     * Refresh authentication for specific client
     */
    refreshClientAuthentication(clientId: string): Promise<AuthenticationResponse<any>>;
    /**
     * Terminate authentication for specific client
     */
    terminateClientAuthentication(clientId: string): Promise<void>;
    /**
     * Create MCP error response for authentication failures
     */
    private createMCPErrorResponse;
    /**
     * Create tool error response for authentication failures
     */
    private createToolErrorResponse;
    /**
     * Map authentication error codes to MCP error codes
     */
    private mapAuthErrorToMCPError;
    /**
     * Setup event handlers
     */
    private setupEventHandlers;
    /**
     * Generate unique request ID
     */
    private generateRequestId;
}
//# sourceMappingURL=mcp-server-auth-integration.d.ts.map