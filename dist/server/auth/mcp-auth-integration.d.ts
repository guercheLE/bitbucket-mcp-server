/**
 * MCP Authentication Integration for Bitbucket MCP Server
 *
 * This module provides integration between the authentication system
 * and the MCP server, handling authentication for MCP requests,
 * tool execution context, and session management.
 *
 * Key Features:
 * - MCP request authentication
 * - Tool execution context with user information
 * - Session management for MCP clients
 * - Authentication status reporting
 * - Integration with existing MCP infrastructure
 *
 * Constitutional Requirements:
 * - MCP protocol compliance
 * - Secure authentication flow
 * - Comprehensive error handling
 * - Performance optimization
 */
import { EventEmitter } from 'events';
import { AuthenticationManager, UserSession, AuthenticationResponse } from '../../types/auth';
import { MCPServer, ClientSession, ToolExecutionContext, ToolResponse } from '../../types';
/**
 * MCP Authentication Integration Class
 * Integrates authentication with MCP server operations
 */
export declare class MCPAuthIntegration extends EventEmitter {
    private authManager;
    private mcpServer;
    private authenticatedClients;
    private clientSessions;
    constructor(authManager: AuthenticationManager, mcpServer: MCPServer);
    /**
     * Authenticate MCP client connection
     */
    authenticateClient(clientSession: ClientSession, authToken?: string, sessionId?: string): Promise<AuthenticationResponse<UserSession>>;
    /**
     * Validate client authentication for MCP request
     */
    validateClientAuth(clientId: string): Promise<AuthenticationResponse<UserSession>>;
    /**
     * Create authenticated tool execution context
     */
    createToolExecutionContext(clientId: string, toolName: string, params: Record<string, any>): Promise<AuthenticationResponse<ToolExecutionContext>>;
    /**
     * Execute tool with authentication context
     */
    executeToolWithAuth(clientId: string, toolName: string, params: Record<string, any>): Promise<AuthenticationResponse<ToolResponse>>;
    /**
     * Handle client disconnection
     */
    handleClientDisconnect(clientId: string): Promise<void>;
    /**
     * Refresh client authentication
     */
    refreshClientAuth(clientId: string): Promise<AuthenticationResponse<UserSession>>;
    /**
     * Get authentication status for client
     */
    getClientAuthStatus(clientId: string): AuthenticationStatus;
    /**
     * Get all authenticated clients
     */
    getAllAuthenticatedClients(): AuthenticationStatus[];
    /**
     * Get authentication statistics
     */
    getAuthStatistics(): AuthStatistics;
    private setupEventHandlers;
    private generateRequestId;
}
interface AuthenticationStatus {
    clientId: string;
    isAuthenticated: boolean;
    userId?: string;
    userName?: string;
    permissions?: string[];
    sessionExpiresAt?: Date;
    lastActivity?: Date;
    clientInfo?: {
        transport: string;
        connectedAt: Date;
        metadata: Record<string, any>;
    };
}
interface AuthStatistics {
    totalAuthenticatedClients: number;
    activeSessions: number;
    expiredSessions: number;
    lastUpdated: Date;
}
export {};
//# sourceMappingURL=mcp-auth-integration.d.ts.map