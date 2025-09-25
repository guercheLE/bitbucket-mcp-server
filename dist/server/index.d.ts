/**
 * MCP Server Entry Point
 *
 * Main entry point for the Bitbucket MCP Server implementation.
 * This module provides server initialization, startup logic, and graceful shutdown
 * with full MCP protocol compliance and constitutional requirements.
 *
 * Key Features:
 * - Server initialization and configuration
 * - Transport setup and management
 * - Tool registration and discovery
 * - Graceful startup and shutdown
 * - Error handling and logging
 * - Health monitoring
 * - CLI interface support
 * - Environment configuration
 *
 * Constitutional Requirements:
 * - MCP Protocol First
 * - Multi-Transport Protocol
 * - Selective Tool Registration
 * - Complete API Coverage
 * - Test-First Development
 * - Memory efficiency (<1GB limit)
 * - Error handling and logging
 */
import { ServerConfig, Tool } from '../types/index.js';
/**
 * Server Application Class
 *
 * Main application class that orchestrates all server components
 * and provides the entry point for the MCP server.
 */
export declare class MCPServerApplication {
    private server;
    private sdkServer;
    private logger;
    private connectionManager;
    private sessionManager;
    private toolRegistry;
    private transportFactory;
    private messageHandler;
    private config;
    private isRunning;
    constructor(config?: Partial<ServerConfig>);
    /**
     * Start the MCP server application
     * Initializes all components and begins accepting connections
     */
    start(): Promise<void>;
    /**
     * Stop the MCP server application
     * Gracefully shuts down all components and connections
     */
    stop(): Promise<void>;
    /**
     * Restart the MCP server application
     * Stops and starts the server in sequence
     */
    restart(): Promise<void>;
    /**
     * Get server health status
     * Returns comprehensive health information
     */
    getHealthStatus(): any;
    /**
     * Create a new client session
     * Establishes a new client connection with graceful handling
     */
    createSession(clientId: string, transport: any): Promise<any>;
    /**
     * Authenticate a client session
     * Authenticates a client and updates session state
     */
    authenticateSession(sessionId: string, authData?: any): Promise<void>;
    /**
     * Remove a client session
     * Gracefully disconnects a client and cleans up resources
     */
    removeSession(sessionId: string, reason?: string): Promise<void>;
    /**
     * Get active sessions
     * Returns all currently active client sessions
     */
    getActiveSessions(): any[];
    /**
     * Get session by ID
     * Retrieves a specific session by its identifier
     */
    getSession(sessionId: string): any | undefined;
    /**
     * Perform connection health check
     * Checks all connections and cleans up expired sessions
     */
    performHealthCheck(): Promise<void>;
    /**
     * Register a tool with the server
     * Adds a tool to the registry and makes it available
     */
    registerTool(tool: Tool): Promise<void>;
    /**
     * Get server configuration
     * Returns the current server configuration
     */
    getConfig(): ServerConfig;
    /**
     * Create default configuration
     * Creates server configuration with sensible defaults
     */
    private createDefaultConfig;
    /**
     * Setup component integration
     * Connects all server components together
     */
    private setupComponentIntegration;
    /**
     * Setup event handlers
     * Configures application-level event handling
     */
    private setupEventHandlers;
    /**
     * Initialize transports
     * Creates and configures all configured transports using official MCP SDK
     */
    private initializeTransports;
    /**
     * Register default tools
     * Registers basic tools for server functionality
     */
    private registerDefaultTools;
    /**
     * Start health monitoring
     * Begins periodic health checks and monitoring
     */
    private startHealthMonitoring;
    /**
     * Stop health monitoring
     * Stops periodic health checks
     */
    private stopHealthMonitoring;
}
/**
 * Create and start MCP server application
 * Factory function for creating and starting the server
 */
export declare function createMCPServer(config?: Partial<ServerConfig>): Promise<MCPServerApplication>;
/**
 * Main entry point
 * CLI entry point for the MCP server
 */
export declare function main(): Promise<void>;
export { main as default };
//# sourceMappingURL=index.d.ts.map