/**
 * MCP Server with Authentication Integration
 *
 * This module provides a complete MCP server implementation with
 * authentication support, integrating all Bitbucket tools with
 * proper authentication, authorization, and user context.
 *
 * Key Features:
 * - Complete MCP protocol compliance
 * - OAuth 2.0 authentication integration
 * - Bitbucket API tool execution
 * - User session management
 * - Permission-based access control
 * - Comprehensive error handling
 * - User context in responses
 *
 * Constitutional Requirements:
 * - MCP protocol compliance
 * - OAuth 2.0 authentication
 * - Secure API communication
 * - Comprehensive error handling
 */
import { EventEmitter } from 'events';
import { MCPServer, ServerCapabilities, ToolRequest, ToolResponse } from '../types/index.js';
import { AuthenticationManager } from './auth/authentication-manager.js';
/**
 * MCP Server Configuration
 */
export interface MCPServerConfig {
    /** Server name */
    name: string;
    /** Server version */
    version: string;
    /** Whether authentication is required */
    requireAuth: boolean;
    /** Whether to auto-refresh tokens */
    autoRefresh: boolean;
    /** Maximum concurrent connections */
    maxConnections: number;
    /** Request timeout in milliseconds */
    requestTimeout: number;
}
/**
 * MCP Server with Authentication
 * Complete MCP server with OAuth authentication and Bitbucket integration
 */
export declare class MCPServerWithAuth extends EventEmitter implements MCPServer {
    readonly id: string;
    readonly name: string;
    readonly version: string;
    readonly isRunning: boolean;
    private config;
    private authManager;
    private apiManager;
    private toolsIntegration;
    private authIntegration;
    private authMiddleware;
    private toolRegistry;
    private bitbucketTools;
    private activeConnections;
    constructor(config: MCPServerConfig, authManager: AuthenticationManager);
    /**
     * Start the MCP server
     */
    start(): Promise<void>;
    /**
     * Stop the MCP server
     */
    stop(): Promise<void>;
    /**
     * Execute a tool with authentication
     */
    executeTool(request: ToolRequest): Promise<ToolResponse>;
    /**
     * Handle client connection
     */
    handleClientConnect(clientSession: any): Promise<void>;
    /**
     * Handle client disconnection
     */
    handleClientDisconnect(clientId: string): Promise<void>;
    /**
     * Authenticate client
     */
    authenticateClient(clientSession: any, authToken?: string, sessionId?: string): Promise<{
        success: boolean;
        error?: any;
    }>;
    /**
     * Get server capabilities
     */
    getCapabilities(): ServerCapabilities;
    /**
     * Get available tools
     */
    getAvailableTools(): any[];
    /**
     * Get tool by name
     */
    getTool(toolName: string): any | undefined;
    /**
     * Get authentication status for client
     */
    getClientAuthStatus(clientId: string): any;
    /**
     * Get all authenticated clients
     */
    getAllAuthenticatedClients(): any[];
    /**
     * Get authentication statistics
     */
    getAuthStatistics(): any;
    /**
     * Register all Bitbucket tools
     */
    private registerTools;
    /**
     * Get authentication requirements for a tool based on its name
     */
    private getToolAuthRequirements;
    /**
     * Setup event handlers
     */
    private setupEventHandlers;
}
//# sourceMappingURL=mcp-server-with-auth.d.ts.map