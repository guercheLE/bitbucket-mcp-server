/**
 * Test file for MCP Protocol Helpers
 * Validates that our protocol testing utilities work correctly
 */

import { describe, expect, test } from '@jest/globals';
import {
    MCPClientTestHelper,
    MCPErrorCodes,
    MCPErrorTestHelper,
    MCPProtocolValidator,
    MockMCPTransport,
    ToolRegistrationTestHelper
} from '../utils/mcp-protocol-helpers';

describe('MCP Protocol Helpers', () => {

    describe('MockMCPTransport', () => {
        test('should create transport with correct configuration', () => {
            const transport = new MockMCPTransport();

            expect(transport).toBeDefined();
            expect(transport.isConnected()).toBe(false);
        });

        test('should handle connection lifecycle', async () => {
            const transport = new MockMCPTransport();

            await transport.connect();
            expect(transport.isConnected()).toBe(true);

            await transport.disconnect();
            expect(transport.isConnected()).toBe(false);
        });

        test('should emit and receive messages', async () => {
            const transport = new MockMCPTransport();

            const testMessage = {
                jsonrpc: '2.0',
                id: 1,
                method: 'ping',
                params: {}
            };

            let receivedMessage = null;
            transport.on('message', (message) => {
                receivedMessage = message;
            });

            await transport.connect();

            // Simulate receiving a message instead of sending
            transport.simulateReceive(testMessage);

            // Give some time for message processing
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(receivedMessage).toEqual(testMessage);
        });
    });

    describe('MCPClientTestHelper', () => {
        test('should create client with initialization', async () => {
            const client = new MCPClientTestHelper();

            expect(client).toBeDefined();
            expect(client.isInitialized()).toBe(false);
        });

        test('should handle initialization flow', async () => {
            const client = new MCPClientTestHelper();

            const result = await client.initialize({
                name: 'test-client',
                version: '1.0.0'
            });

            expect(result).toBeDefined();
            expect(client.isInitialized()).toBe(true);
        });
    });

    describe('MCPProtocolValidator', () => {
        test('should validate initialize request', () => {
            const request = {
                jsonrpc: '2.0',
                id: 1,
                method: 'initialize',
                params: {
                    protocolVersion: '2024-11-05',
                    capabilities: {
                        tools: {}
                    },
                    clientInfo: {
                        name: 'test-client',
                        version: '1.0.0'
                    }
                }
            };

            const result = MCPProtocolValidator.validateInitializeRequest(request);
            expect(result.valid).toBe(true);
        });

        test('should validate tools/list request', () => {
            const request = {
                jsonrpc: '2.0',
                id: 2,
                method: 'tools/list',
                params: {}
            };

            const result = MCPProtocolValidator.validateListToolsRequest(request);
            expect(result.valid).toBe(true);
        });

        test('should validate tools/call request', () => {
            const request = {
                jsonrpc: '2.0',
                id: 3,
                method: 'tools/call',
                params: {
                    name: 'test_tool',
                    arguments: {
                        param1: 'value1'
                    }
                }
            };

            const result = MCPProtocolValidator.validateCallToolRequest(request);
            expect(result.valid).toBe(true);
        });

        test('should reject invalid requests', () => {
            const invalidRequest = {
                jsonrpc: '2.0',
                id: 1,
                method: 'initialize',
                params: {
                    // Missing required fields
                    protocolVersion: '2024-11-05'
                    // Missing capabilities and clientInfo
                }
            };

            const result = MCPProtocolValidator.validateInitializeRequest(invalidRequest);
            expect(result.valid).toBe(false);
            expect(result.errors).toBeDefined();
        });
    });

    describe('ToolRegistrationTestHelper', () => {
        test('should create and manage tool registrations', () => {
            const helper = new ToolRegistrationTestHelper();

            // Register a simple tool
            helper.registerTool({
                name: 'test_tool',
                description: 'A test tool',
                inputSchema: {
                    type: 'object',
                    properties: {
                        param1: { type: 'string' }
                    }
                }
            });

            expect(helper.isToolRegistered('test_tool')).toBe(true);
            expect(helper.getTool('test_tool')).toBeDefined();
            expect(helper.listTools()).toHaveLength(1);
        });

        test('should execute registered tools', async () => {
            const helper = new ToolRegistrationTestHelper();

            // Register a tool
            helper.registerTool({
                name: 'test_tool',
                description: 'A test tool',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            });

            // Execute the tool
            const result = await helper.executeTool('test_tool', {});
            expect(result.content).toBeDefined();
            expect(result.content[0].type).toBe('text');
        });
    });

    describe('MCPErrorTestHelper', () => {
        test('should create parse errors', () => {
            const error = MCPErrorTestHelper.createParseError(1);

            expect(error.jsonrpc).toBe('2.0');
            expect(error.id).toBe(1);
            expect(error.error.code).toBe(MCPErrorCodes.PARSE_ERROR);
        });

        test('should create method not found errors', () => {
            const error = MCPErrorTestHelper.createMethodNotFoundError(1, 'unknown_method');

            expect(error.jsonrpc).toBe('2.0');
            expect(error.id).toBe(1);
            expect(error.error.code).toBe(MCPErrorCodes.METHOD_NOT_FOUND);
            expect(error.error.data?.method).toBe('unknown_method');
        });

        test('should create application errors', () => {
            const error = MCPErrorTestHelper.createApplicationError(
                1,
                'Custom application error',
                { detail: 'test' }
            );

            expect(error.jsonrpc).toBe('2.0');
            expect(error.id).toBe(1);
            expect(error.error.code).toBe(MCPErrorCodes.APPLICATION_ERROR);
            expect(error.error.message).toBe('Custom application error');
            expect(error.error.data.detail).toBe('test');
        });
    });

    describe('Integration', () => {
        test('should work together for complete MCP testing workflow', async () => {
            // Create a client
            const client = new MCPClientTestHelper();

            // Create test tool helper
            const toolHelper = new ToolRegistrationTestHelper();

            toolHelper.registerTool({
                name: 'test_tool',
                description: 'Integration test tool',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            });

            // Initialize client
            await client.initialize({
                name: 'integration-test',
                version: '1.0.0'
            });

            expect(client.isInitialized()).toBe(true);

            // Validate initialization request
            const initRequest = {
                jsonrpc: '2.0',
                id: 1,
                method: 'initialize',
                params: {
                    protocolVersion: '2024-11-05',
                    capabilities: {
                        tools: {}
                    },
                    clientInfo: {
                        name: 'integration-test',
                        version: '1.0.0'
                    }
                }
            };

            const validationResult = MCPProtocolValidator.validateInitializeRequest(initRequest);
            expect(validationResult.valid).toBe(true);

            // Test tool call validation
            const toolCallRequest = {
                jsonrpc: '2.0',
                id: 2,
                method: 'tools/call',
                params: {
                    name: 'test_tool',
                    arguments: {}
                }
            };

            const toolCallValidation = MCPProtocolValidator.validateCallToolRequest(toolCallRequest);
            expect(toolCallValidation.valid).toBe(true);

            expect(toolHelper.isToolRegistered('test_tool')).toBe(true);
        });
    });
});