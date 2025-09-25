/**
 * MCP Server Core Implementation
 *
 * Core MCP server implementation providing the main server functionality
 * for the Bitbucket MCP Server with constitutional requirements compliance.
 *
 * Key Features:
 * - MCP protocol compliance
 * - Tool registration and management
 * - Configuration validation
 * - Health monitoring
 * - Graceful startup/shutdown
 *
 * Constitutional Requirements:
 * - MCP Protocol First
 * - Multi-Transport Protocol
 * - Selective Tool Registration
 * - Complete API Coverage
 * - Test-First Development
 */
import { MCPServer as IMCPServer, ServerConfig, Tool, ToolExecutionContext, ToolResult } from '../types/index.js';
/**
 * MCP Server Implementation
 * Core server functionality for MCP protocol
 */
export declare class MCPServer implements IMCPServer {
    /** Server identifier */
    readonly id: string;
    /** Server name */
    readonly name: string;
    /** Server version */
    readonly version: string;
    /** Whether server is running */
    private _isRunning;
    /** Server configuration */
    private config;
    /** Registered tools */
    private tools;
    /** Start time for uptime tracking */
    private _startTime?;
    constructor(config: ServerConfig);
    /** Whether server is running */
    get isRunning(): boolean;
    /**
     * Start the server
     */
    start(): Promise<void>;
    /**
     * Stop the server
     */
    stop(): Promise<void>;
    /**
     * Execute a tool
     */
    executeTool(request: {
        name: string;
        arguments: Record<string, any>;
        context: ToolExecutionContext;
    }): Promise<ToolResult>;
    /**
     * Get server capabilities
     */
    getCapabilities(): {
        protocolVersion: string;
        tools: string[];
        authentication: {
            required: any;
            methods: any;
        };
        features: string[];
    };
    /**
     * Validate server configuration
     */
    validateConfig(): Promise<boolean>;
    /**
     * Register a tool
     */
    registerTool(tool: Tool): Promise<void>;
    /**
     * Unregister a tool
     */
    unregisterTool(toolName: string): Promise<void>;
    /**
     * Get health status
     */
    getHealthStatus(): any;
    /**
     * Get registered tools
     */
    getRegisteredTools(): Tool[];
    /**
     * Initialize server components
     */
    private initializeComponents;
    /**
     * Cleanup server resources
     */
    private cleanup;
}
export default MCPServer;
//# sourceMappingURL=mcp-server.d.ts.map