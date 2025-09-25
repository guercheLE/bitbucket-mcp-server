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
// import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { MCPErrorCode } from '../types/index.js';
import { createMCPError, handleToolError } from './error-handler.js';
/**
 * MCP Server with Official SDK Integration
 *
 * Wraps the official MCP SDK server with our custom functionality
 * and ensures full protocol compliance.
 */
export class MCPServerSDK extends Server {
    customServer;
    registeredTools = new Map();
    registeredResources = new Map();
    registeredPrompts = new Map();
    constructor(config, customServer) {
        super({
            name: config.name,
            version: config.version
        }, {
            capabilities: {
                tools: {},
                resources: {},
                prompts: {}
            }
        });
        this.customServer = customServer;
        this.setupHandlers();
    }
    /**
     * Setup MCP protocol handlers
     * Configures all required handlers for protocol compliance
     */
    setupHandlers() {
        // Tool handlers
        this.setRequestHandler(ListToolsRequestSchema, async () => {
            const tools = Array.from(this.registeredTools.values()).map(tool => ({
                name: tool.name,
                description: tool.description,
                inputSchema: this.convertToolParametersToSchema(tool.parameters)
            }));
            return { tools };
        });
        this.setRequestHandler(CallToolRequestSchema, async (request) => {
            const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const tool = this.registeredTools.get(request.params.name);
            if (!tool) {
                const errorResponse = createMCPError(requestId, MCPErrorCode.TOOL_NOT_FOUND, `Tool '${request.params.name}' not found`, {
                    operation: 'tool_call',
                    metadata: { toolName: request.params.name }
                });
                throw new Error(JSON.stringify(errorResponse));
            }
            try {
                // Create a mock session for tool execution
                const mockSession = {
                    id: 'sdk-session',
                    clientId: 'sdk-client',
                    state: 'connected',
                    transport: { type: 'stdio' },
                    createdAt: new Date(),
                    lastActivity: new Date(),
                    metadata: {},
                    availableTools: new Set([tool.name]),
                    timeout: 300000,
                    updateActivity: () => { },
                    isActive: () => true,
                    isExpired: () => false,
                    getStats: () => ({
                        duration: 0,
                        requestsProcessed: 0,
                        toolsCalled: 0,
                        averageProcessingTime: 0,
                        memoryUsage: 0,
                        lastRequest: new Date()
                    })
                };
                const context = {
                    session: mockSession,
                    server: this.customServer,
                    request: {
                        id: requestId,
                        timestamp: new Date(),
                        transport: 'stdio'
                    },
                    environment: {
                        nodeVersion: process.version,
                        platform: process.platform,
                        memoryUsage: process.memoryUsage()
                    }
                };
                const result = await tool.execute(request.params.arguments || {}, context);
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify(result.data || result)
                        }]
                };
            }
            catch (error) {
                const errorResponse = handleToolError(requestId, request.params.name, error, {
                    operation: 'tool_execution',
                    metadata: {
                        toolName: request.params.name,
                        arguments: request.params.arguments
                    }
                });
                throw new Error(JSON.stringify(errorResponse));
            }
        });
        // Resource handlers
        this.setRequestHandler(ListResourcesRequestSchema, async () => {
            const resources = Array.from(this.registeredResources.values());
            return { resources };
        });
        this.setRequestHandler(ReadResourceRequestSchema, async (request) => {
            const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const resource = this.registeredResources.get(request.params.uri);
            if (!resource) {
                const errorResponse = createMCPError(requestId, MCPErrorCode.RESOURCE_NOT_FOUND, `Resource '${request.params.uri}' not found`, {
                    operation: 'resource_read',
                    metadata: { resourceUri: request.params.uri }
                });
                throw new Error(JSON.stringify(errorResponse));
            }
            return {
                contents: [{
                        uri: resource.uri,
                        mimeType: resource.mimeType || 'text/plain',
                        text: resource.text || ''
                    }]
            };
        });
        // Prompt handlers
        this.setRequestHandler(ListPromptsRequestSchema, async () => {
            const prompts = Array.from(this.registeredPrompts.values());
            return { prompts };
        });
        this.setRequestHandler(GetPromptRequestSchema, async (request) => {
            const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const prompt = this.registeredPrompts.get(request.params.name);
            if (!prompt) {
                const errorResponse = createMCPError(requestId, MCPErrorCode.RESOURCE_NOT_FOUND, `Prompt '${request.params.name}' not found`, {
                    operation: 'prompt_get',
                    metadata: { promptName: request.params.name }
                });
                throw new Error(JSON.stringify(errorResponse));
            }
            return {
                description: prompt.description,
                messages: prompt.messages || []
            };
        });
    }
    /**
     * Register a tool with the MCP server
     * Integrates custom tools with the official SDK
     */
    async registerTool(tool) {
        try {
            // Validate tool name (snake_case, no prefixes)
            this.validateToolName(tool.name);
            // Register with custom server
            await this.customServer.registerTool(tool);
            // Register with SDK
            this.registeredTools.set(tool.name, tool);
            console.log(`Tool registered with MCP SDK: ${tool.name}`);
        }
        catch (error) {
            const errorResponse = createMCPError(null, MCPErrorCode.TOOL_EXECUTION_FAILED, `Failed to register tool '${tool.name}': ${error.message}`, {
                operation: 'tool_registration',
                metadata: { toolName: tool.name }
            });
            throw new Error(JSON.stringify(errorResponse));
        }
    }
    /**
     * Unregister a tool from the MCP server
     */
    async unregisterTool(toolName) {
        await this.customServer.unregisterTool(toolName);
        this.registeredTools.delete(toolName);
        console.log(`Tool unregistered from MCP SDK: ${toolName}`);
    }
    /**
     * Register a resource with the MCP server
     */
    async registerResource(resource) {
        this.registeredResources.set(resource.uri, resource);
        console.log(`Resource registered: ${resource.uri}`);
    }
    /**
     * Register a prompt with the MCP server
     */
    async registerPrompt(prompt) {
        this.registeredPrompts.set(prompt.name, prompt);
        console.log(`Prompt registered: ${prompt.name}`);
    }
    /**
     * Get all available tools
     */
    getAvailableTools() {
        return Array.from(this.registeredTools.values()).filter(tool => tool.enabled);
    }
    /**
     * Execute a tool with given parameters
     */
    async executeTool(toolName, params, sessionId) {
        return await this.customServer.executeTool(toolName, params, sessionId);
    }
    /**
     * Create a new client session
     */
    async createSession(clientId, transport) {
        return await this.customServer.createSession(clientId, transport);
    }
    /**
     * Remove a client session
     */
    async removeSession(sessionId) {
        return await this.customServer.removeSession(sessionId);
    }
    /**
     * Get server health status
     */
    getHealthStatus() {
        return this.customServer.getHealthStatus();
    }
    /**
     * Validate server configuration
     */
    async validateConfig() {
        return await this.customServer.validateConfig();
    }
    /**
     * Start the MCP server
     */
    async start() {
        await this.customServer.start();
        console.log('MCP Server with SDK integration started');
    }
    /**
     * Stop the MCP server
     */
    async stop() {
        await this.customServer.stop();
        console.log('MCP Server with SDK integration stopped');
    }
    /**
     * Restart the MCP server
     */
    async restart() {
        await this.customServer.restart();
    }
    // ============================================================================
    // Private Methods
    // ============================================================================
    /**
     * Convert custom tool parameters to MCP schema format
     */
    convertToolParametersToSchema(parameters) {
        const properties = {};
        const required = [];
        for (const param of parameters) {
            properties[param.name] = {
                type: param.type,
                description: param.description,
                ...(param.default !== undefined && { default: param.default })
            };
            if (param.required) {
                required.push(param.name);
            }
        }
        return {
            type: 'object',
            properties,
            required
        };
    }
    /**
     * Validate tool name according to constitutional requirements
     */
    validateToolName(name) {
        // Check for forbidden prefixes
        if (name.startsWith('bitbucket_') || name.startsWith('mcp_') || name.startsWith('bb_')) {
            throw new Error('Tool name cannot start with bitbucket_, mcp_, or bb_ prefixes');
        }
        // Check snake_case format
        if (!/^[a-z][a-z0-9_]*$/.test(name)) {
            throw new Error('Tool name must be in snake_case format (lowercase letters, numbers, underscores)');
        }
    }
}
/**
 * Create MCP server with SDK integration
 * Factory function for creating an MCP server with official SDK integration
 */
export async function createMCPServerWithSDK(config, customServer) {
    const sdkServer = new MCPServerSDK(config, customServer);
    return sdkServer;
}
/**
 * Create transport based on configuration
 * Creates the appropriate transport for the MCP server
 */
export function createTransport(config) {
    switch (config.type) {
        case 'stdio':
            return new StdioServerTransport();
        case 'sse':
            return new SSEServerTransport(config.path || '/messages', config.response);
        case 'http':
            // return new StreamableHTTPServerTransport(config);
            throw new Error('HTTP transport not yet implemented');
        default:
            throw new Error(`Unsupported transport type: ${config.type}`);
    }
}
export default MCPServerSDK;
//# sourceMappingURL=mcp-server-sdk.js.map