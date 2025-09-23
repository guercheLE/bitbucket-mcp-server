/**
 * MCP Server Unit Tests
 * 
 * Tests the MCPServer class methods and functionality including:
 * - Server lifecycle management (start/stop/restart)
 * - Tool registration and management
 * - Client session management
 * - Health monitoring and statistics
 * - Configuration validation
 * - Error handling and recovery
 */

import { MCPServer } from '../../src/server/mcp-server';
import { ToolRegistry } from '../../src/server/tool-registry';
import { Tool, ToolExecutionContext, ToolResult } from '../../src/types/index';

// Mock tool for testing
const mockTool: Tool = {
  name: 'test_tool',
  description: 'A test tool for server testing',
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

describe('MCPServer', () => {
  let server: MCPServer;

  beforeEach(() => {
    server = new MCPServer(mockConfig);
  });

  afterEach(async () => {
    if (server.isRunning) {
      await server.stop();
    }
  });

  describe('Server Initialization', () => {
    it('should initialize with correct configuration', () => {
      expect(server.config.name).toBe('test-server');
      expect(server.config.version).toBe('1.0.0');
      expect(server.config.maxClients).toBe(10);
      expect(server.isRunning).toBe(false);
    });

    it('should have tool registry initialized', () => {
      expect(server.toolRegistry).toBeInstanceOf(ToolRegistry);
    });

    it('should have empty tools and sessions initially', () => {
      expect(server.tools.size).toBe(0);
      expect(server.sessions.size).toBe(0);
    });
  });

  describe('Server Lifecycle', () => {
    it('should start the server successfully', async () => {
      await server.start();
      expect(server.isRunning).toBe(true);
    });

    it('should stop the server successfully', async () => {
      await server.start();
      expect(server.isRunning).toBe(true);
      
      await server.stop();
      expect(server.isRunning).toBe(false);
    });

    it('should restart the server successfully', async () => {
      await server.start();
      expect(server.isRunning).toBe(true);
      
      await server.restart();
      expect(server.isRunning).toBe(true);
    });

    it('should throw error when starting already running server', async () => {
      await server.start();
      
      await expect(server.start()).rejects.toThrow('Server is already running');
    });

    it('should handle stop gracefully when server is not running', async () => {
      await server.stop(); // Should not throw
      expect(server.isRunning).toBe(false);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate correct configuration', async () => {
      const isValid = await server.validateConfig();
      expect(isValid).toBe(true);
    });

    it('should throw error for missing server name', async () => {
      const invalidConfig = { ...mockConfig, name: '' };
      const invalidServer = new MCPServer(invalidConfig);
      
      await expect(invalidServer.validateConfig()).rejects.toThrow('Server name and version are required');
    });

    it('should throw error for missing server version', async () => {
      const invalidConfig = { ...mockConfig, version: '' };
      const invalidServer = new MCPServer(invalidConfig);
      
      await expect(invalidServer.validateConfig()).rejects.toThrow('Server name and version are required');
    });

    it('should throw error for invalid maxClients', async () => {
      const invalidConfig = { ...mockConfig, maxClients: 0 };
      const invalidServer = new MCPServer(invalidConfig);
      
      await expect(invalidServer.validateConfig()).rejects.toThrow('maxClients must be greater than 0');
    });

    it('should throw error for invalid clientTimeout', async () => {
      const invalidConfig = { ...mockConfig, clientTimeout: 0 };
      const invalidServer = new MCPServer(invalidConfig);
      
      await expect(invalidServer.validateConfig()).rejects.toThrow('clientTimeout must be greater than 0');
    });

    it('should throw error for invalid memoryLimit', async () => {
      const invalidConfig = { ...mockConfig, memoryLimit: 0 };
      const invalidServer = new MCPServer(invalidConfig);
      
      await expect(invalidServer.validateConfig()).rejects.toThrow('memoryLimit must be greater than 0');
    });
  });

  describe('Tool Management', () => {
    it('should register a tool successfully', async () => {
      await server.registerTool(mockTool);
      
      const availableTools = server.getAvailableTools();
      expect(availableTools).toHaveLength(1);
      expect(availableTools[0].name).toBe('test_tool');
    });

    it('should unregister a tool successfully', async () => {
      await server.registerTool(mockTool);
      expect(server.getAvailableTools()).toHaveLength(1);
      
      await server.unregisterTool('test_tool');
      expect(server.getAvailableTools()).toHaveLength(0);
    });

    it('should get tool by name', async () => {
      await server.registerTool(mockTool);
      
      const tool = server.getTool('test_tool');
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('test_tool');
    });

    it('should return undefined for non-existent tool', () => {
      const tool = server.getTool('non_existent');
      expect(tool).toBeUndefined();
    });

    it('should get tools by category', async () => {
      await server.registerTool(mockTool);
      
      const tools = server.getToolsByCategory('testing');
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('test_tool');
    });

    it('should search tools by query', async () => {
      await server.registerTool(mockTool);
      
      const tools = server.searchTools('test');
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('test_tool');
    });

    it('should enable and disable tools', async () => {
      await server.registerTool(mockTool);
      expect(server.getAvailableTools()).toHaveLength(1);
      
      server.disableTool('test_tool');
      expect(server.getAvailableTools()).toHaveLength(0);
      
      server.enableTool('test_tool');
      expect(server.getAvailableTools()).toHaveLength(1);
    });

    it('should get tool statistics', async () => {
      await server.registerTool(mockTool);
      
      const stats = server.getToolStats('test_tool');
      expect(stats).toBeDefined();
      expect(stats?.totalExecutions).toBe(0);
    });

    it('should get registry statistics', async () => {
      await server.registerTool(mockTool);
      
      const stats = server.getRegistryStats();
      expect(stats).toBeDefined();
      expect(stats.totalTools).toBe(1);
      expect(stats.enabledTools).toBe(1);
    });
  });

  describe('Server Statistics', () => {
    it('should provide server statistics', () => {
      const stats = server.stats;
      
      expect(stats).toBeDefined();
      expect(stats.uptime).toBe(0);
      expect(stats.activeSessions).toBe(0);
      expect(stats.totalRequests).toBe(0);
      expect(stats.totalToolsExecuted).toBe(0);
      expect(stats.memoryUsage).toBeGreaterThan(0);
      expect(stats.averageResponseTime).toBe(0);
      expect(stats.errorRate).toBe(0);
    });

    it('should update uptime when server is running', async () => {
      await server.start();
      
      // Wait a bit to ensure uptime is updated
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const stats = server.stats;
      expect(stats.uptime).toBeGreaterThan(0);
    });
  });

  describe('Health Status', () => {
    it('should provide health status', () => {
      const health = server.getHealthStatus();
      
      expect(health).toBeDefined();
      expect(health.status).toBe('healthy');
      expect(health.timestamp).toBeInstanceOf(Date);
      expect(health.components).toBeDefined();
      expect(health.metrics).toBeDefined();
      expect(health.issues).toBeInstanceOf(Array);
    });

    it('should show server as unhealthy when not running', () => {
      const health = server.getHealthStatus();
      expect(health.components.server).toBe(false);
    });

    it('should show server as healthy when running', async () => {
      await server.start();
      
      const health = server.getHealthStatus();
      expect(health.components.server).toBe(true);
    });
  });

  describe('Tool Execution', () => {
    beforeEach(async () => {
      await server.registerTool(mockTool);
    });

    it('should execute tool successfully', async () => {
      // Note: This test would require a mock session, which is complex to set up
      // For now, we'll test the tool registry execution directly
      const result = await server.toolRegistry.executeTool('test_tool', { message: 'Hello' }, {
        session: {} as any,
        server: server,
        request: {
          id: 'test-request',
          timestamp: new Date(),
          transport: 'stdio'
        },
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          memoryUsage: process.memoryUsage()
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.message).toBe('Echo: Hello');
    });

    it('should handle tool execution errors', async () => {
      const invalidTool: Tool = {
        ...mockTool,
        name: 'error_tool',
        execute: async () => {
          throw new Error('Test error');
        }
      };

      await server.registerTool(invalidTool);

      const result = await server.toolRegistry.executeTool('error_tool', { message: 'Hello' }, {
        session: {} as any,
        server: server,
        request: {
          id: 'test-request',
          timestamp: new Date(),
          transport: 'stdio'
        },
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          memoryUsage: process.memoryUsage()
        }
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Test error');
    });
  });

  describe('Event Handling', () => {
    it('should emit server started event', async () => {
      const startedSpy = jest.fn();
      server.on('server:started', startedSpy);

      await server.start();
      expect(startedSpy).toHaveBeenCalledWith(server);
    });

    it('should emit server stopped event', async () => {
      const stoppedSpy = jest.fn();
      server.on('server:stopped', stoppedSpy);

      await server.start();
      await server.stop();
      expect(stoppedSpy).toHaveBeenCalledWith(server);
    });

    it('should emit tool registered event', async () => {
      const toolRegisteredSpy = jest.fn();
      server.on('tool:registered', toolRegisteredSpy);

      await server.registerTool(mockTool);
      expect(toolRegisteredSpy).toHaveBeenCalledWith(mockTool);
    });

    it('should emit tool unregistered event', async () => {
      const toolUnregisteredSpy = jest.fn();
      server.on('tool:unregistered', toolUnregisteredSpy);

      await server.registerTool(mockTool);
      await server.unregisterTool('test_tool');
      expect(toolUnregisteredSpy).toHaveBeenCalledWith('test_tool');
    });
  });

  describe('Memory Management', () => {
    it('should track memory usage', () => {
      const stats = server.stats;
      expect(stats.memoryUsage).toBeGreaterThan(0);
      expect(stats.memoryUsage).toBeLessThan(mockConfig.memoryLimit);
    });

    it('should provide memory usage in health status', () => {
      const health = server.getHealthStatus();
      expect(health.metrics.memoryUsage).toBeGreaterThan(0);
      expect(health.metrics.memoryLimit).toBe(mockConfig.memoryLimit);
    });
  });

  describe('Error Handling', () => {
    it('should handle tool registration errors gracefully', async () => {
      const invalidTool = { ...mockTool, name: 'InvalidTool' };
      
      await expect(server.registerTool(invalidTool)).rejects.toThrow();
    });

    it('should handle tool unregistration of non-existent tool gracefully', async () => {
      await server.unregisterTool('non_existent'); // Should not throw
    });

    it('should handle tool execution of non-existent tool', async () => {
      const result = await server.toolRegistry.executeTool('non_existent', {}, {
        session: {} as any,
        server: server,
        request: {
          id: 'test-request',
          timestamp: new Date(),
          transport: 'stdio'
        },
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          memoryUsage: process.memoryUsage()
        }
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('not found');
    });
  });
});

export { mockTool, mockConfig };
