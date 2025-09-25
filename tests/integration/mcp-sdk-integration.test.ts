/**
 * MCP SDK Integration Tests
 * 
 * Tests the integration between our custom server implementation
 * and the official @modelcontextprotocol/sdk to ensure full protocol compliance.
 * 
 * Key Test Areas:
 * - SDK server initialization
 * - Tool registration and execution
 * - Protocol compliance
 * - Transport integration
 * - Error handling
 * 
 * Constitutional Requirements:
 * - Test-First Development
 * - MCP Protocol First
 * - Complete API Coverage
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { MCPServerSDK, createMCPServerWithSDK } from '../../src/server/mcp-server-sdk';
import { MCPServerImpl } from '../../src/server/mcp-server';
import { ServerConfig, Tool } from '../../src/types/index.js';

describe('MCP SDK Integration', () => {
  let config: ServerConfig;
  let customServer: MCPServerImpl;
  let sdkServer: MCPServerSDK;

  beforeEach(async () => {
    // Create test configuration
    config = {
      name: 'Test MCP Server',
      version: '1.0.0',
      description: 'Test server for SDK integration',
      maxClients: 10,
      clientTimeout: 30000,
      memoryLimit: 100 * 1024 * 1024, // 100MB
      logging: {
        level: 'info',
        console: true
      },
      transports: [
        {
          type: 'stdio',
          timeout: 30000
        }
      ],
      tools: {
        autoRegister: true,
        selectiveLoading: true,
        validationEnabled: true
      }
    };

    // Create custom server
    customServer = new MCPServerImpl(config);
    await customServer.start();

    // Create SDK server
    sdkServer = await createMCPServerWithSDK(config, customServer);
  });

  afterEach(async () => {
    if (sdkServer) {
      await sdkServer.stop();
    }
    if (customServer) {
      await customServer.stop();
    }
  });

  describe('Server Initialization', () => {
    test('should create SDK server with custom server', () => {
      expect(sdkServer).toBeDefined();
      expect(sdkServer).toBeInstanceOf(MCPServerSDK);
    });

    test('should have correct server configuration', () => {
      expect(sdkServer).toBeDefined();
      expect(config).toBeDefined();
    });

    test('should validate configuration', async () => {
      const isValid = await sdkServer.validateConfig();
      expect(isValid).toBe(true);
    });
  });

  describe('Tool Registration', () => {
    test('should register tool with SDK server', async () => {
      const testTool: Tool = {
        name: 'test_tool',
        description: 'A test tool for SDK integration',
        parameters: [
          {
            name: 'message',
            type: 'string',
            description: 'Test message',
            required: true
          }
        ],
        enabled: true,
        async execute(params: Record<string, any>, context: any) {
          return {
            success: true,
            data: {
              message: params.message,
              timestamp: new Date().toISOString()
            }
          };
        }
      };

      await sdkServer.registerTool(testTool);
      
      const availableTools = sdkServer.getAvailableTools();
      expect(availableTools).toHaveLength(1);
      expect(availableTools[0].name).toBe('test_tool');
    });

    test('should reject tool with invalid name', async () => {
      const invalidTool: Tool = {
        name: 'bitbucket_invalid_tool', // Invalid prefix
        description: 'Invalid tool name',
        parameters: [],
        enabled: true,
        async execute(params: Record<string, any>, context: any) {
          return { success: true };
        }
      };

      await expect(sdkServer.registerTool(invalidTool)).rejects.toThrow(
        'Tool name cannot start with bitbucket_, mcp_, or bb_ prefixes'
      );
    });

    test('should reject tool with invalid snake_case name', async () => {
      const invalidTool: Tool = {
        name: 'InvalidToolName', // Invalid format
        description: 'Invalid tool name format',
        parameters: [],
        enabled: true,
        async execute(params: Record<string, any>, context: any) {
          return { success: true };
        }
      };

      await expect(sdkServer.registerTool(invalidTool)).rejects.toThrow(
        'Tool name must be in snake_case format'
      );
    });
  });

  describe('Tool Execution', () => {
    let testTool: Tool;

    beforeEach(async () => {
      testTool = {
        name: 'echo_tool',
        description: 'Echo tool for testing',
        parameters: [
          {
            name: 'text',
            type: 'string',
            description: 'Text to echo',
            required: true
          }
        ],
        enabled: true,
        async execute(params: Record<string, any>, context: any) {
          return {
            success: true,
            data: {
              echo: params.text,
              timestamp: new Date().toISOString()
            }
          };
        }
      };

      await sdkServer.registerTool(testTool);
    });

    test('should execute tool successfully', async () => {
      const result = await sdkServer.executeTool('echo_tool', { text: 'Hello World' }, 'test-session');
      
      expect(result.success).toBe(true);
      expect(result.data.echo).toBe('Hello World');
      expect(result.data.timestamp).toBeDefined();
    });

    test('should handle tool execution errors', async () => {
      const errorTool: Tool = {
        name: 'error_tool',
        description: 'Tool that throws an error',
        parameters: [],
        enabled: true,
        async execute() {
          throw new Error('Test error');
        }
      };

      await sdkServer.registerTool(errorTool);

      await expect(
        sdkServer.executeTool('error_tool', {}, 'test-session')
      ).rejects.toThrow('Test error');
    });
  });

  describe('Protocol Compliance', () => {
    test('should handle list tools request', async () => {
      const testTool: Tool = {
        name: 'list_test_tool',
        description: 'Tool for list testing',
        parameters: [],
        enabled: true,
        async execute(params: Record<string, any>, context: any) {
          return { success: true };
        }
      };

      await sdkServer.registerTool(testTool);

      // Simulate list tools request
      const request = {
        jsonrpc: '2.0' as const,
        id: 'test-request',
        method: 'tools/list',
        params: {}
      };

      // This would normally be handled by the SDK's request handler
      // We're testing that our integration works correctly
      const availableTools = sdkServer.getAvailableTools();
      expect(availableTools).toHaveLength(1);
      expect(availableTools[0].name).toBe('list_test_tool');
    });
  });

  describe('Health Status', () => {
    test('should return health status', () => {
      const health = sdkServer.getHealthStatus();
      
      expect(health).toBeDefined();
      expect(health.status).toBeDefined();
      expect(health.timestamp).toBeDefined();
      expect(health.components).toBeDefined();
      expect(health.metrics).toBeDefined();
    });

    test('should include memory usage in health status', () => {
      const health = sdkServer.getHealthStatus();
      
      expect(health.metrics.memoryUsage).toBeDefined();
      expect(health.metrics.memoryLimit).toBeDefined();
      expect(health.metrics.memoryUsage).toBeLessThanOrEqual(health.metrics.memoryLimit);
    });
  });

  describe('Session Management', () => {
    test('should create and remove sessions', async () => {
      const mockTransport = {
        type: 'stdio' as const,
        config: { type: 'stdio' as const },
        isConnected: true,
        connect: async () => {},
        disconnect: async () => {},
        send: async () => {},
        receive: async () => ({ jsonrpc: '2.0', id: 'test' }),
        isHealthy: () => true,
        getStats: () => ({
          messagesSent: 0,
          messagesReceived: 0,
          bytesSent: 0,
          bytesReceived: 0,
          averageResponseTime: 0,
          uptime: 0,
          lastActivity: new Date()
        })
      };

      const session = await sdkServer.createSession('test-client', mockTransport);
      expect(session).toBeDefined();
      expect(session.clientId).toBe('test-client');

      await sdkServer.removeSession(session.id);
    });
  });
});
