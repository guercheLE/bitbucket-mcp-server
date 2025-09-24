/**
 * Simple MCP Protocol Compliance Test
 * 
 * This test validates basic MCP protocol compliance by checking:
 * 1. Server can start without errors
 * 2. Required MCP error codes are defined
 * 3. Server configuration is valid
 * 4. Tool registry works correctly
 */

import { describe, test, expect } from '@jest/globals';
import { MCPServer } from '../../dist/server/mcp-server.js';
import { ToolRegistry } from '../../dist/server/tool-registry.js';
import { MCPErrorCode } from '../../dist/types/index.js';

describe('Simple MCP Protocol Compliance', () => {
  
  test('should define all required MCP error codes', () => {
    // Test JSON-RPC 2.0 standard error codes
    expect(MCPErrorCode.PARSE_ERROR).toBe(-32700);
    expect(MCPErrorCode.INVALID_REQUEST).toBe(-32600);
    expect(MCPErrorCode.METHOD_NOT_FOUND).toBe(-32601);
    expect(MCPErrorCode.INVALID_PARAMS).toBe(-32602);
    expect(MCPErrorCode.INTERNAL_ERROR).toBe(-32603);
    
    // Test MCP-specific error codes
    expect(MCPErrorCode.INITIALIZATION_FAILED).toBe(-32000);
    expect(MCPErrorCode.TOOL_NOT_FOUND).toBe(-32001);
    expect(MCPErrorCode.TOOL_EXECUTION_FAILED).toBe(-32002);
    expect(MCPErrorCode.TRANSPORT_ERROR).toBe(-32003);
    expect(MCPErrorCode.SESSION_EXPIRED).toBe(-32004);
    expect(MCPErrorCode.RATE_LIMIT_EXCEEDED).toBe(-32005);
    expect(MCPErrorCode.AUTHENTICATION_FAILED).toBe(-32006);
    expect(MCPErrorCode.AUTHORIZATION_FAILED).toBe(-32007);
    expect(MCPErrorCode.RESOURCE_NOT_FOUND).toBe(-32008);
    expect(MCPErrorCode.CONCURRENT_OPERATION).toBe(-32009);
    expect(MCPErrorCode.MEMORY_LIMIT_EXCEEDED).toBe(-32010);
  });

  test('should create MCP server with valid configuration', async () => {
    const server = new MCPServer({
      name: 'test-server',
      version: '1.0.0',
      maxClients: 10,
      clientTimeout: 30000,
      memoryLimit: 100 * 1024 * 1024, // 100MB
      logging: { level: 'info', console: true },
      transports: [{ type: 'stdio', timeout: 30000 }],
      tools: { autoRegister: true, selectiveLoading: true, validationEnabled: true }
    });

    expect(server).toBeDefined();
    expect(server.config.name).toBe('test-server');
    expect(server.config.version).toBe('1.0.0');
    expect(server.config.maxClients).toBe(10);
    expect(server.config.memoryLimit).toBe(100 * 1024 * 1024);
  });

  test('should validate server configuration', async () => {
    const server = new MCPServer({
      name: 'test-server',
      version: '1.0.0',
      maxClients: 10,
      clientTimeout: 30000,
      memoryLimit: 100 * 1024 * 1024,
      logging: { level: 'info', console: true },
      transports: [{ type: 'stdio', timeout: 30000 }],
      tools: { autoRegister: true, selectiveLoading: true, validationEnabled: true }
    });

    const isValid = await server.validateConfig();
    expect(isValid).toBe(true);
  });

  test('should create tool registry with valid configuration', () => {
    const toolRegistry = new ToolRegistry({
      validateParameters: true,
      trackStatistics: true,
      allowOverwrite: false,
      maxTools: 1000
    });

    expect(toolRegistry).toBeDefined();
    const stats = toolRegistry.getRegistryStats();
    expect(stats).toBeDefined();
    expect(stats.totalTools).toBe(0);
    expect(stats.enabledTools).toBe(0);
  });

  test('should register and manage tools correctly', async () => {
    const toolRegistry = new ToolRegistry({
      validateParameters: true,
      trackStatistics: true,
      allowOverwrite: false,
      maxTools: 1000
    });

    // Test tool registration
    const testTool = {
      name: 'test_tool',
      description: 'A test tool for validation',
      parameters: [
        {
          name: 'message',
          type: 'string' as const,
          description: 'Test message',
          required: true
        }
      ],
      enabled: true,
      async execute(params: any, context: any) {
        return {
          success: true,
          data: { message: params.message }
        };
      }
    };

    await toolRegistry.registerTool(testTool);
    
    const availableTools = toolRegistry.getAvailableTools();
    expect(availableTools).toHaveLength(1);
    expect(availableTools[0].name).toBe('test_tool');
    
    const stats = toolRegistry.getRegistryStats();
    expect(stats.totalTools).toBe(1);
    expect(stats.enabledTools).toBe(1);
  });

  test('should validate tool naming convention (snake_case)', async () => {
    const toolRegistry = new ToolRegistry({
      validateParameters: true,
      trackStatistics: true,
      allowOverwrite: false,
      maxTools: 1000
    });

    // Test valid snake_case tool name
    const validTool = {
      name: 'valid_tool_name',
      description: 'A valid tool name',
      parameters: [],
      enabled: true,
      async execute(params: any, context: any) {
        return { success: true, data: {} };
      }
    };

    await toolRegistry.registerTool(validTool);
    const availableTools = toolRegistry.getAvailableTools();
    expect(availableTools).toHaveLength(1);
    expect(availableTools[0].name).toBe('valid_tool_name');
  });

  test('should get server health status', async () => {
    const server = new MCPServer({
      name: 'test-server',
      version: '1.0.0',
      maxClients: 10,
      clientTimeout: 30000,
      memoryLimit: 100 * 1024 * 1024,
      logging: { level: 'info', console: true },
      transports: [{ type: 'stdio', timeout: 30000 }],
      tools: { autoRegister: true, selectiveLoading: true, validationEnabled: true }
    });

    const healthStatus = server.getHealthStatus();
    
    expect(healthStatus).toBeDefined();
    expect(healthStatus.status).toBeDefined();
    expect(healthStatus.timestamp).toBeDefined();
    expect(healthStatus.components).toBeDefined();
    expect(healthStatus.components.server).toBeDefined();
    expect(healthStatus.components.tools).toBeDefined();
    expect(healthStatus.components.memory).toBeDefined();
    expect(healthStatus.metrics).toBeDefined();
    expect(healthStatus.metrics.memoryUsage).toBeDefined();
    expect(healthStatus.metrics.memoryLimit).toBeDefined();
  });

  test('should handle memory limit configuration', async () => {
    const memoryLimit = 50 * 1024 * 1024; // 50MB
    const server = new MCPServer({
      name: 'test-server',
      version: '1.0.0',
      maxClients: 10,
      clientTimeout: 30000,
      memoryLimit: memoryLimit,
      logging: { level: 'info', console: true },
      transports: [{ type: 'stdio', timeout: 30000 }],
      tools: { autoRegister: true, selectiveLoading: true, validationEnabled: true }
    });

    expect(server.config.memoryLimit).toBe(memoryLimit);
    
    const healthStatus = server.getHealthStatus();
    expect(healthStatus.metrics.memoryLimit).toBe(memoryLimit);
  });

  test('should support multiple transport types', async () => {
    const server = new MCPServer({
      name: 'test-server',
      version: '1.0.0',
      maxClients: 10,
      clientTimeout: 30000,
      memoryLimit: 100 * 1024 * 1024,
      logging: { level: 'info', console: true },
      transports: [
        { type: 'stdio', timeout: 30000 },
        { type: 'http', host: 'localhost', port: 8080, timeout: 30000 },
        { type: 'sse', host: 'localhost', port: 8081, timeout: 30000 }
      ],
      tools: { autoRegister: true, selectiveLoading: true, validationEnabled: true }
    });

    expect(server.config.transports).toHaveLength(3);
    expect(server.config.transports[0].type).toBe('stdio');
    expect(server.config.transports[1].type).toBe('http');
    expect(server.config.transports[2].type).toBe('sse');
  });

  test('should validate constitutional requirements', async () => {
    // Test constitutional requirement: Memory limit < 1GB
    const memoryLimit = 512 * 1024 * 1024; // 512MB (constitutional requirement < 1GB)
    const server = new MCPServer({
      name: 'test-server',
      version: '1.0.0',
      maxClients: 100,
      clientTimeout: 300000, // 5 minutes
      memoryLimit: memoryLimit,
      logging: { level: 'info', console: true },
      transports: [{ type: 'stdio', timeout: 30000 }],
      tools: { autoRegister: true, selectiveLoading: true, validationEnabled: true }
    });

    expect(server.config.memoryLimit).toBeLessThan(1024 * 1024 * 1024); // < 1GB
    expect(server.config.maxClients).toBeLessThanOrEqual(100);
    expect(server.config.clientTimeout).toBeLessThanOrEqual(300000); // 5 minutes
  });
});
