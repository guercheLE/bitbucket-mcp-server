/**
 * MCP Test Utilities
 * 
 * Base utilities for testing MCP protocol implementations
 */

import { z } from 'zod';

/**
 * MCP Protocol Message Types
 */
export const MCPMessageTypes = {
    INITIALIZE: 'initialize',
    INITIALIZED: 'initialized',
    LIST_TOOLS: 'tools/list',
    CALL_TOOL: 'tools/call',
    LIST_RESOURCES: 'resources/list',
    READ_RESOURCE: 'resources/read',
    LIST_PROMPTS: 'prompts/list',
    GET_PROMPT: 'prompts/get',
    NOTIFICATION: 'notification',
    ERROR: 'error'
} as const;

/**
 * MCP Message Schema for validation
 */
export const MCPMessageSchema = z.object({
    jsonrpc: z.literal('2.0'),
    id: z.union([z.string(), z.number()]).optional(),
    method: z.string(),
    params: z.record(z.any()).optional(),
    result: z.any().optional(),
    error: z.object({
        code: z.number(),
        message: z.string(),
        data: z.any().optional()
    }).optional()
});

/**
 * MCP Test Utilities Class
 */
export class MCPTestUtils {
    /**
     * Create a mock MCP request message
     */
    static createMockRequest(
        method: string,
        params: Record<string, any> = {},
        id: string | number = Math.random().toString(36).substr(2, 9)
    ) {
        return {
            jsonrpc: '2.0' as const,
            id,
            method,
            params
        };
    }

    /**
     * Create a mock MCP response message
     */
    static createMockResponse(
        id: string | number,
        result: any,
        error?: { code: number; message: string; data?: any }
    ) {
        const response: any = {
            jsonrpc: '2.0',
            id
        };

        if (error) {
            response.error = error;
        } else {
            response.result = result;
        }

        return response;
    }

    /**
     * Create a mock MCP notification
     */
    static createMockNotification(method: string, params: Record<string, any> = {}) {
        return {
            jsonrpc: '2.0' as const,
            method,
            params
        };
    }

    /**
     * Create a mock initialize request
     */
    static createInitializeRequest(
        clientInfo: { name: string; version: string } = { name: 'test-client', version: '1.0.0' },
        capabilities: Record<string, any> = {}
    ) {
        return this.createMockRequest(MCPMessageTypes.INITIALIZE, {
            protocolVersion: '2024-11-05',
            clientInfo,
            capabilities
        });
    }

    /**
     * Create a mock initialize response
     */
    static createInitializeResponse(
        requestId: string | number,
        serverInfo: { name: string; version: string } = { name: 'test-server', version: '1.0.0' },
        capabilities: Record<string, any> = {}
    ) {
        return this.createMockResponse(requestId, {
            protocolVersion: '2024-11-05',
            serverInfo,
            capabilities
        });
    }

    /**
     * Create a mock list tools request
     */
    static createListToolsRequest() {
        return this.createMockRequest(MCPMessageTypes.LIST_TOOLS);
    }

    /**
     * Create a mock list tools response
     */
    static createListToolsResponse(requestId: string | number, tools: any[] = []) {
        return this.createMockResponse(requestId, { tools });
    }

    /**
     * Create a mock tool call request
     */
    static createToolCallRequest(
        toolName: string,
        args: Record<string, any> = {}
    ) {
        return this.createMockRequest(MCPMessageTypes.CALL_TOOL, {
            name: toolName,
            arguments: args
        });
    }

    /**
     * Create a mock tool call response
     */
    static createToolCallResponse(
        requestId: string | number,
        content: any[] = [],
        isError: boolean = false
    ) {
        return this.createMockResponse(requestId, {
            content,
            isError
        });
    }

    /**
     * Validate MCP message format
     */
    static validateMCPMessage(message: any): boolean {
        try {
            MCPMessageSchema.parse(message);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Assert that a message is a valid MCP message
     */
    static assertValidMCPMessage(message: any): void {
        const result = MCPMessageSchema.safeParse(message);
        if (!result.success) {
            throw new Error(`Invalid MCP message: ${result.error.message}`);
        }
    }

    /**
     * Create a mock MCP transport for testing
     */
    static createMockTransport() {
        const messageHandlers = new Map<string, (message: any) => void>();
        const errorHandlers = new Set<(error: Error) => void>();
        const closeHandlers = new Set<() => void>();

        return {
            // Transport state
            isConnected: true,
            messageQueue: [] as any[],

            // Connection methods
            start: jest.fn().mockResolvedValue(undefined),
            close: jest.fn().mockImplementation(() => {
                closeHandlers.forEach(handler => handler());
                return Promise.resolve();
            }),

            // Message handling
            send: jest.fn().mockImplementation((message: any) => {
                return Promise.resolve();
            }),

            onMessage: jest.fn().mockImplementation((handler: (message: any) => void) => {
                messageHandlers.set('message', handler);
            }),

            onError: jest.fn().mockImplementation((handler: (error: Error) => void) => {
                errorHandlers.add(handler);
            }),

            onClose: jest.fn().mockImplementation((handler: () => void) => {
                closeHandlers.add(handler);
            }),

            // Test utilities
            simulateMessage: (message: any) => {
                const handler = messageHandlers.get('message');
                if (handler) {
                    handler(message);
                }
            },

            simulateError: (error: Error) => {
                errorHandlers.forEach(handler => handler(error));
            },

            simulateClose: () => {
                closeHandlers.forEach(handler => handler());
            }
        };
    }

    /**
     * Wait for async operations to complete
     */
    static async waitForAsync<T>(
        operation: () => Promise<T>,
        timeout: number = 5000
    ): Promise<T> {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Operation timed out after ${timeout}ms`));
            }, timeout);

            operation()
                .then((result) => {
                    clearTimeout(timeoutId);
                    resolve(result);
                })
                .catch((error) => {
                    clearTimeout(timeoutId);
                    reject(error);
                });
        });
    }

    /**
     * Create a promise that resolves after a delay
     */
    static delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Assert that an operation completes within a time limit
     */
    static async assertTimedOperation<T>(
        operation: () => Promise<T>,
        maxTime: number,
        description: string = 'Operation'
    ): Promise<T> {
        const startTime = Date.now();
        const result = await operation();
        const elapsed = Date.now() - startTime;

        if (elapsed > maxTime) {
            throw new Error(`${description} took ${elapsed}ms, expected < ${maxTime}ms`);
        }

        return result;
    }

    /**
     * Generate a unique test ID
     */
    static generateTestId(prefix: string = 'test'): string {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `${prefix}_${timestamp}_${random}`;
    }
}

export default MCPTestUtils;