/**
 * Tool Registration API Integration Test
 * 
 * Tests the integration between ToolRegistry and MCPServer for tool registration
 * and MCP protocol tool discovery methods.
 */

import { MCPServer } from './mcp-server';
import { ToolRegistry } from './tool-registry';
import { Tool, ToolParameter, ToolExecutionContext, ToolResult } from '../types/index';

// Mock tool for testing
const mockTool: Tool = {
  name: 'test_tool',
  description: 'A test tool for validation',
  parameters: [
    {
      name: 'message',
      type: 'string',
      description: 'Test message',
      required: true
    }
  ],
  enabled: true,
  category: 'testing',
  version: '1.0.0',
  execute: async (params: Record<string, any>, context: ToolExecutionContext): Promise<ToolResult> => {
    return {
      success: true,
      data: { message: `Echo: ${params.message}` },
      metadata: {
        executionTime: 10,
        memoryUsed: 1024,
        timestamp: new Date()
      }
    };
  }
};

// Mock server configuration
const mockConfig = {
  name: 'test-server',
  version: '1.0.0',
  maxClients: 10,
  clientTimeout: 30000,
  memoryLimit: 1024 * 1024 * 1024, // 1GB
  logging: {
    level: 'info' as const,
    console: true
  },
  transports: [
    { type: 'stdio' as const, config: {} }
  ],
  tools: {
    autoRegister: false,
    selectiveLoading: true,
    validationEnabled: true
  }
};

describe('Tool Registration API Integration', () => {
  let server: MCPServer;
  let toolRegistry: ToolRegistry;

  beforeEach(() => {
    server = new MCPServer(mockConfig);
    toolRegistry = server.toolRegistry;
  });

  afterEach(async () => {
    if (server.isRunning) {
      await server.stop();
    }
  });

  describe('Tool Registration', () => {
    it('should register a tool through the server', async () => {
      await server.registerTool(mockTool);
      
      const availableTools = server.getAvailableTools();
      expect(availableTools).toHaveLength(1);
      expect(availableTools[0].name).toBe('test_tool');
    });

    it('should validate tool names according to snake_case convention', async () => {
      const invalidTool = { ...mockTool, name: 'InvalidTool' };
      
      await expect(server.registerTool(invalidTool)).rejects.toThrow();
    });

    it('should reject tools with forbidden prefixes', async () => {
      const invalidTool = { ...mockTool, name: 'bitbucket_test' };
      
      await expect(server.registerTool(invalidTool)).rejects.toThrow();
    });

    it('should unregister a tool through the server', async () => {
      await server.registerTool(mockTool);
      expect(server.getAvailableTools()).toHaveLength(1);
      
      await server.unregisterTool('test_tool');
      expect(server.getAvailableTools()).toHaveLength(0);
    });
  });

  describe('Tool Discovery', () => {
    beforeEach(async () => {
      await server.registerTool(mockTool);
    });

    it('should get available tools', () => {
      const tools = server.getAvailableTools();
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('test_tool');
    });

    it('should get tool by name', () => {
      const tool = server.getTool('test_tool');
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('test_tool');
    });

    it('should get tools by category', () => {
      const tools = server.getToolsByCategory('testing');
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('test_tool');
    });

    it('should search tools by query', () => {
      const tools = server.searchTools('test');
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('test_tool');
    });

    it('should return empty array for non-existent tool', () => {
      const tool = server.getTool('non_existent');
      expect(tool).toBeUndefined();
    });
  });

  describe('Tool Management', () => {
    beforeEach(async () => {
      await server.registerTool(mockTool);
    });

    it('should enable and disable tools', () => {
      expect(server.getAvailableTools()).toHaveLength(1);
      
      server.disableTool('test_tool');
      expect(server.getAvailableTools()).toHaveLength(0);
      
      server.enableTool('test_tool');
      expect(server.getAvailableTools()).toHaveLength(1);
    });

    it('should get tool statistics', () => {
      const stats = server.getToolStats('test_tool');
      expect(stats).toBeDefined();
      expect(stats?.totalExecutions).toBe(0);
    });

    it('should get registry statistics', () => {
      const stats = server.getRegistryStats();
      expect(stats).toBeDefined();
      expect(stats.totalTools).toBe(1);
      expect(stats.enabledTools).toBe(1);
    });
  });

  describe('MCP Protocol Integration', () => {
    it('should expose tools through the tools getter', () => {
      const tools = server.tools;
      expect(tools).toBeInstanceOf(Map);
      expect(tools.size).toBe(0); // No tools registered yet
    });

    it('should maintain tool registry reference', () => {
      expect(server.toolRegistry).toBeInstanceOf(ToolRegistry);
    });
  });
});

export { mockTool, mockConfig };
