/**
 * MCP Server with Official SDK Integration
 *
 * This module integrates the official @modelcontextprotocol/sdk with our custom
 * server implementation to ensure full protocol compliance and compatibility.
 *
 * Key Features:
 * - Official MCP SDK integration
 * - Full protocol compliance
 * - Tool registration and execution
 * - Resource management
 * - Prompt handling
 * - Error handling and logging
 * - Multi-transport support
 *
 * Constitutional Requirements:
 * - MCP Protocol First
 * - Complete API Coverage
 * - Test-First Development
 * - Memory efficiency (<1GB limit)
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { Resource, Prompt } from '@modelcontextprotocol/sdk/types.js';
import { MCPServer, ServerConfig, Tool as CustomTool } from '../types/index.js';
/**
 * MCP Server with Official SDK Integration
 *
 * Wraps the official MCP SDK server with our custom functionality
 * and ensures full protocol compliance.
 */
export declare class MCPServerSDK extends Server {
    private customServer;
    private registeredTools;
    private registeredResources;
    private registeredPrompts;
    constructor(config: ServerConfig, customServer: MCPServer);
    /**
     * Setup MCP protocol handlers
     * Configures all required handlers for protocol compliance
     */
    private setupHandlers;
    /**
     * Register a tool with the MCP server
     * Integrates custom tools with the official SDK
     */
    registerTool(tool: CustomTool): Promise<void>;
    /**
     * Unregister a tool from the MCP server
     */
    unregisterTool(toolName: string): Promise<void>;
    /**
     * Register a resource with the MCP server
     */
    registerResource(resource: Resource): Promise<void>;
    /**
     * Register a prompt with the MCP server
     */
    registerPrompt(prompt: Prompt): Promise<void>;
    /**
     * Get all available tools
     */
    getAvailableTools(): CustomTool[];
    /**
     * Execute a tool with given parameters
     */
    executeTool(toolName: string, params: Record<string, any>, sessionId: string): Promise<any>;
    /**
     * Create a new client session
     */
    createSession(clientId: string, transport: any): Promise<any>;
    /**
     * Remove a client session
     */
    removeSession(sessionId: string): Promise<void>;
    /**
     * Get server health status
     */
    getHealthStatus(): any;
    /**
     * Validate server configuration
     */
    validateConfig(): Promise<boolean>;
    /**
     * Start the MCP server
     */
    start(): Promise<void>;
    /**
     * Stop the MCP server
     */
    stop(): Promise<void>;
    /**
     * Restart the MCP server
     */
    restart(): Promise<void>;
    /**
     * Convert custom tool parameters to MCP schema format
     */
    private convertToolParametersToSchema;
    /**
     * Validate tool name according to constitutional requirements
     */
    private validateToolName;
}
/**
 * Create MCP server with SDK integration
 * Factory function for creating an MCP server with official SDK integration
 */
export declare function createMCPServerWithSDK(config: ServerConfig, customServer: MCPServer): Promise<MCPServerSDK>;
/**
 * Create transport based on configuration
 * Creates the appropriate transport for the MCP server
 */
export declare function createTransport(config: any): StdioServerTransport | SSEServerTransport;
export default MCPServerSDK;
//# sourceMappingURL=mcp-server-sdk.d.ts.map