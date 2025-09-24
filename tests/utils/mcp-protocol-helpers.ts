/**
 * MCP Protocol Test Helpers
 * 
 * Specialized helpers for testing MCP protocol compliance and behavior
 */

import { EventEmitter } from 'events';
import { z } from 'zod';

/**
 * MCP Protocol Error Codes
 */
export const MCPErrorCodes = {
    PARSE_ERROR: -32700,
    INVALID_REQUEST: -32600,
    METHOD_NOT_FOUND: -32601,
    INVALID_PARAMS: -32602,
    INTERNAL_ERROR: -32603,
    SERVER_ERROR: -32000,
    APPLICATION_ERROR: -32500
} as const;

/**
 * MCP Protocol Validation Schemas
 */
export const MCPSchemas = {
    // Initialize protocol schemas
    InitializeRequest: z.object({
        jsonrpc: z.literal('2.0'),
        id: z.union([z.string(), z.number()]),
        method: z.literal('initialize'),
        params: z.object({
            protocolVersion: z.string(),
            capabilities: z.record(z.any()),
            clientInfo: z.object({
                name: z.string(),
                version: z.string()
            })
        })
    }),

    InitializeResult: z.object({
        protocolVersion: z.string(),
        capabilities: z.record(z.any()),
        serverInfo: z.object({
            name: z.string(),
            version: z.string()
        })
    }),

    // Tool protocol schemas
    ListToolsRequest: z.object({
        jsonrpc: z.literal('2.0'),
        id: z.union([z.string(), z.number()]),
        method: z.literal('tools/list'),
        params: z.record(z.any()).optional()
    }),

    ToolDefinition: z.object({
        name: z.string(),
        description: z.string(),
        inputSchema: z.object({
            type: z.literal('object'),
            properties: z.record(z.any()),
            required: z.array(z.string()).optional()
        })
    }),

    CallToolRequest: z.object({
        jsonrpc: z.literal('2.0'),
        id: z.union([z.string(), z.number()]),
        method: z.literal('tools/call'),
        params: z.object({
            name: z.string(),
            arguments: z.record(z.any())
        })
    }),

    // Error schema
    ErrorResponse: z.object({
        jsonrpc: z.literal('2.0'),
        id: z.union([z.string(), z.number(), z.null()]),
        error: z.object({
            code: z.number(),
            message: z.string(),
            data: z.any().optional()
        })
    })
};

/**
 * Mock MCP Transport for testing
 */
export class MockMCPTransport extends EventEmitter {
    private messageQueue: any[] = [];
    private responseHandlers: Map<string | number, (response: any) => void> = new Map();
    private connected: boolean = false;

    constructor() {
        super();
    }

    /**
     * Connect the mock transport
     */
    async connect(): Promise<void> {
        this.connected = true;
        this.emit('connect');
    }

    /**
     * Disconnect the mock transport
     */
    async disconnect(): Promise<void> {
        this.connected = false;
        this.emit('disconnect');
    }

    /**
     * Send a message through the transport
     */
    async send(message: any): Promise<any> {
        if (!this.connected) {
            throw new Error('Transport not connected');
        }

        this.messageQueue.push(message);
        this.emit('message:sent', message);

        // If it's a request (has id), wait for response
        if (message.id !== undefined) {
            return new Promise((resolve, reject) => {
                this.responseHandlers.set(message.id, resolve);

                // Auto-timeout after 5 seconds in tests
                setTimeout(() => {
                    if (this.responseHandlers.has(message.id)) {
                        this.responseHandlers.delete(message.id);
                        reject(new Error(`Request timeout for id: ${message.id}`));
                    }
                }, 5000);
            });
        }
    }

    /**
     * Simulate receiving a message
     */
    simulateReceive(message: any): void {
        this.emit('message', message);

        // Handle responses to previous requests
        if (message.id && this.responseHandlers.has(message.id)) {
            const handler = this.responseHandlers.get(message.id);
            this.responseHandlers.delete(message.id);
            handler!(message);
        }
    }

    /**
     * Get sent messages for inspection
     */
    getSentMessages(): any[] {
        return [...this.messageQueue];
    }

    /**
     * Clear sent messages queue
     */
    clearMessages(): void {
        this.messageQueue = [];
    }

    /**
     * Check if transport is connected
     */
    isConnected(): boolean {
        return this.connected;
    }
}

/**
 * MCP Client Test Helper
 */
export class MCPClientTestHelper {
    private transport: MockMCPTransport;
    private initialized: boolean = false;
    private capabilities: Record<string, any> = {};
    private tools: any[] = [];

    constructor() {
        this.transport = new MockMCPTransport();
    }

    /**
     * Get the mock transport for direct manipulation
     */
    getTransport(): MockMCPTransport {
        return this.transport;
    }

    /**
     * Initialize the MCP client
     */
    async initialize(
        clientInfo: { name: string; version: string } = { name: 'test-client', version: '1.0.0' },
        capabilities: Record<string, any> = {}
    ): Promise<any> {
        await this.transport.connect();

        const request = {
            jsonrpc: '2.0' as const,
            id: 'init-1',
            method: 'initialize',
            params: {
                protocolVersion: '2024-11-05',
                capabilities,
                clientInfo
            }
        };

        const responsePromise = this.transport.send(request);

        // Simulate server response
        setTimeout(() => {
            this.transport.simulateReceive({
                jsonrpc: '2.0',
                id: 'init-1',
                result: {
                    protocolVersion: '2024-11-05',
                    capabilities: {
                        tools: {},
                        resources: {},
                        prompts: {}
                    },
                    serverInfo: {
                        name: 'test-server',
                        version: '1.0.0'
                    }
                }
            });
        }, 10);

        const response = await responsePromise;
        this.initialized = true;
        return response;
    }

    /**
     * List available tools
     */
    async listTools(): Promise<any> {
        if (!this.initialized) {
            throw new Error('Client must be initialized first');
        }

        const request = {
            jsonrpc: '2.0' as const,
            id: 'list-tools-1',
            method: 'tools/list',
            params: {}
        };

        const responsePromise = this.transport.send(request);

        // Simulate server response with mock tools
        setTimeout(() => {
            this.transport.simulateReceive({
                jsonrpc: '2.0',
                id: 'list-tools-1',
                result: {
                    tools: this.tools
                }
            });
        }, 10);

        return await responsePromise;
    }

    /**
     * Call a tool
     */
    async callTool(name: string, arguments_: Record<string, any>): Promise<any> {
        if (!this.initialized) {
            throw new Error('Client must be initialized first');
        }

        const request = {
            jsonrpc: '2.0' as const,
            id: `call-${name}-${Date.now()}`,
            method: 'tools/call',
            params: {
                name,
                arguments: arguments_
            }
        };

        const responsePromise = this.transport.send(request);

        // Simulate tool execution result
        setTimeout(() => {
            this.transport.simulateReceive({
                jsonrpc: '2.0',
                id: request.id,
                result: {
                    content: [
                        {
                            type: 'text',
                            text: `Tool ${name} executed successfully with arguments: ${JSON.stringify(arguments_)}`
                        }
                    ]
                }
            });
        }, 10);

        return await responsePromise;
    }

    /**
     * Add mock tools for testing
     */
    addMockTool(tool: {
        name: string;
        description: string;
        inputSchema: any;
    }): void {
        this.tools.push(tool);
    }

    /**
     * Simulate an error response
     */
    simulateError(id: string | number, code: number, message: string, data?: any): void {
        this.transport.simulateReceive({
            jsonrpc: '2.0',
            id,
            error: {
                code,
                message,
                data
            }
        });
    }

    /**
     * Check if client is initialized
     */
    isInitialized(): boolean {
        return this.initialized;
    }
}

/**
 * Protocol Message Validation Utilities
 */
export class MCPProtocolValidator {
    /**
     * Validate an MCP message against its schema
     */
    static validateMessage(message: any, schema: z.ZodSchema): { valid: boolean; errors?: string[] } {
        try {
            schema.parse(message);
            return { valid: true };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return {
                    valid: false,
                    errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
                };
            }
            return {
                valid: false,
                errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
            };
        }
    }

    /**
     * Validate initialize request
     */
    static validateInitializeRequest(message: any) {
        return this.validateMessage(message, MCPSchemas.InitializeRequest);
    }

    /**
     * Validate initialize response
     */
    static validateInitializeResult(result: any) {
        return this.validateMessage(result, MCPSchemas.InitializeResult);
    }

    /**
     * Validate list tools request
     */
    static validateListToolsRequest(message: any) {
        return this.validateMessage(message, MCPSchemas.ListToolsRequest);
    }

    /**
     * Validate tool definition
     */
    static validateToolDefinition(tool: any) {
        return this.validateMessage(tool, MCPSchemas.ToolDefinition);
    }

    /**
     * Validate call tool request
     */
    static validateCallToolRequest(message: any) {
        return this.validateMessage(message, MCPSchemas.CallToolRequest);
    }

    /**
     * Validate error response
     */
    static validateErrorResponse(message: any) {
        return this.validateMessage(message, MCPSchemas.ErrorResponse);
    }
}

/**
 * Tool Registration Test Helpers
 */
export class ToolRegistrationTestHelper {
    private registeredTools: Map<string, any> = new Map();

    /**
     * Register a mock tool
     */
    registerTool(tool: {
        name: string;
        description: string;
        inputSchema: any;
        handler?: (args: any) => Promise<any>;
    }): void {
        // Validate tool definition
        const validation = MCPProtocolValidator.validateToolDefinition({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema
        });

        if (!validation.valid) {
            throw new Error(`Invalid tool definition: ${validation.errors?.join(', ')}`);
        }

        this.registeredTools.set(tool.name, {
            ...tool,
            handler: tool.handler || this.createDefaultHandler(tool.name)
        });
    }

    /**
     * Unregister a tool
     */
    unregisterTool(name: string): boolean {
        return this.registeredTools.delete(name);
    }

    /**
     * Get registered tool
     */
    getTool(name: string): any | undefined {
        return this.registeredTools.get(name);
    }

    /**
     * List all registered tools
     */
    listTools(): any[] {
        return Array.from(this.registeredTools.values()).map(tool => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema
        }));
    }

    /**
     * Execute a tool
     */
    async executeTool(name: string, arguments_: Record<string, any>): Promise<any> {
        const tool = this.registeredTools.get(name);
        if (!tool) {
            throw new Error(`Tool not found: ${name}`);
        }

        return await tool.handler(arguments_);
    }

    /**
     * Check if a tool is registered
     */
    isToolRegistered(name: string): boolean {
        return this.registeredTools.has(name);
    }

    /**
     * Clear all registered tools
     */
    clearTools(): void {
        this.registeredTools.clear();
    }

    /**
     * Create default handler for a tool
     */
    private createDefaultHandler(toolName: string) {
        return async (args: any) => ({
            content: [
                {
                    type: 'text',
                    text: `Mock execution of ${toolName} with args: ${JSON.stringify(args)}`
                }
            ]
        });
    }
}

/**
 * MCP Error Handling Test Utilities
 */
export class MCPErrorTestHelper {
    /**
     * Create a parse error
     */
    static createParseError(id: string | number | null = null, data?: any) {
        return {
            jsonrpc: '2.0' as const,
            id,
            error: {
                code: MCPErrorCodes.PARSE_ERROR,
                message: 'Parse error',
                data
            }
        };
    }

    /**
     * Create an invalid request error
     */
    static createInvalidRequestError(id: string | number | null = null, data?: any) {
        return {
            jsonrpc: '2.0' as const,
            id,
            error: {
                code: MCPErrorCodes.INVALID_REQUEST,
                message: 'Invalid Request',
                data
            }
        };
    }

    /**
     * Create a method not found error
     */
    static createMethodNotFoundError(id: string | number, method: string) {
        return {
            jsonrpc: '2.0' as const,
            id,
            error: {
                code: MCPErrorCodes.METHOD_NOT_FOUND,
                message: 'Method not found',
                data: { method }
            }
        };
    }

    /**
     * Create an invalid params error
     */
    static createInvalidParamsError(id: string | number, details?: string) {
        return {
            jsonrpc: '2.0' as const,
            id,
            error: {
                code: MCPErrorCodes.INVALID_PARAMS,
                message: 'Invalid params',
                data: details ? { details } : undefined
            }
        };
    }

    /**
     * Create an internal error
     */
    static createInternalError(id: string | number, details?: string) {
        return {
            jsonrpc: '2.0' as const,
            id,
            error: {
                code: MCPErrorCodes.INTERNAL_ERROR,
                message: 'Internal error',
                data: details ? { details } : undefined
            }
        };
    }

    /**
     * Create a custom application error
     */
    static createApplicationError(id: string | number, message: string, data?: any) {
        return {
            jsonrpc: '2.0' as const,
            id,
            error: {
                code: MCPErrorCodes.APPLICATION_ERROR,
                message,
                data
            }
        };
    }

    /**
     * Test error response format
     */
    static validateErrorFormat(errorResponse: any): { valid: boolean; errors?: string[] } {
        return MCPProtocolValidator.validateErrorResponse(errorResponse);
    }
}

/**
 * Default export with all helpers
 */
export default {
    MCPErrorCodes,
    MCPSchemas,
    MockMCPTransport,
    MCPClientTestHelper,
    MCPProtocolValidator,
    ToolRegistrationTestHelper,
    MCPErrorTestHelper
};