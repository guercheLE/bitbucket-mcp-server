/**
 * Tool Registry Unit Tests
 * 
 * Tests the ToolRegistry class functionality including:
 * - Tool registration and unregistration
 * - Snake_case naming convention validation
 * - Forbidden prefix validation (bitbucket_, mcp_, bb_)
 * - Tool discovery and search
 * - Tool execution and statistics
 * - Category management
 * - Error handling and validation
 */

import { ToolRegistry } from '../../src/server/tool-registry';
import { Tool, ToolExecutionContext, ToolResult } from '../../src/types/index';

// Mock tool for testing
const mockTool: Tool = {
  name: 'test_tool',
  description: 'A test tool for registry testing',
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

describe('ToolRegistry', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry({
      validateParameters: true,
      trackStatistics: true,
      allowOverwrite: false,
      maxTools: 100
    });
  });

  describe('Tool Registration', () => {
    it('should register a tool successfully', async () => {
      await registry.registerTool(mockTool);
      
      const tool = registry.getTool('test_tool');
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('test_tool');
      expect(tool?.description).toBe('A test tool for registry testing');
    });

    it('should register a tool with options', async () => {
      const toolWithOptions = {
        ...mockTool,
        category: 'custom_category',
        version: '2.0.0',
        enabled: false,
        metadata: { custom: 'data' }
      };
      
      await registry.registerTool(toolWithOptions);
      
      const tool = registry.getTool('test_tool');
      expect(tool?.category).toBe('custom_category');
      expect(tool?.version).toBe('2.0.0');
      expect(tool?.enabled).toBe(false);
      expect(tool?.metadata?.custom).toBe('data');
    });

    it('should throw error when registering duplicate tool', async () => {
      await registry.registerTool(mockTool);
      
      await expect(registry.registerTool(mockTool)).rejects.toThrow('Tool \'test_tool\' is already registered');
    });

    it('should allow overwrite when configured', async () => {
      const registryWithOverwrite = new ToolRegistry({ allowOverwrite: true });
      
      await registryWithOverwrite.registerTool(mockTool);
      await registryWithOverwrite.registerTool({ ...mockTool, description: 'Updated description' });
      
      const tool = registryWithOverwrite.getTool('test_tool');
      expect(tool?.description).toBe('Updated description');
    });

    it('should enforce maximum tools limit', async () => {
      const limitedRegistry = new ToolRegistry({ maxTools: 2 });
      
      await limitedRegistry.registerTool({ ...mockTool, name: 'tool1' });
      await limitedRegistry.registerTool({ ...mockTool, name: 'tool2' });
      
      await expect(limitedRegistry.registerTool({ ...mockTool, name: 'tool3' }))
        .rejects.toThrow('Maximum tools limit reached (2)');
    });
  });

  describe('Snake_case Naming Validation', () => {
    it('should accept valid snake_case names', async () => {
      const validNames = [
        'valid_tool',
        'another_valid_tool',
        'tool123',
        'ab',
        'valid_tool_name_with_numbers123'
      ];

      for (const name of validNames) {
        const tool = { ...mockTool, name };
        await expect(registry.registerTool(tool)).resolves.not.toThrow();
        await registry.unregisterTool(name);
      }
    });

    it('should reject invalid snake_case names', async () => {
      const invalidNames = [
        'InvalidTool',      // PascalCase
        'invalid-tool',     // kebab-case
        'invalid tool',     // spaces
        'invalid.tool',     // dots
        '123invalid',       // starts with number
        'tool_',            // ends with underscore
        '_tool',            // starts with underscore
        'TOOL',             // all caps
        'tool__name',       // double underscore
        ''                  // empty
      ];

      for (const name of invalidNames) {
        const tool = { ...mockTool, name };
        await expect(registry.registerTool(tool)).rejects.toThrow();
      }
    });

    it('should reject names that are too short', async () => {
      const tool = { ...mockTool, name: 'a' };
      await expect(registry.registerTool(tool)).rejects.toThrow('Tool name must be at least 2 characters long');
    });

    it('should reject names that are too long', async () => {
      const longName = 'a'.repeat(51);
      const tool = { ...mockTool, name: longName };
      await expect(registry.registerTool(tool)).rejects.toThrow('Tool name cannot exceed 50 characters');
    });
  });

  describe('Forbidden Prefix Validation', () => {
    it('should reject tools with bitbucket_ prefix', async () => {
      const tool = { ...mockTool, name: 'bitbucket_test' };
      await expect(registry.registerTool(tool)).rejects.toThrow('Tool name cannot start with \'bitbucket_\' prefix');
    });

    it('should reject tools with mcp_ prefix', async () => {
      const tool = { ...mockTool, name: 'mcp_test' };
      await expect(registry.registerTool(tool)).rejects.toThrow('Tool name cannot start with \'mcp_\' prefix');
    });

    it('should reject tools with bb_ prefix', async () => {
      const tool = { ...mockTool, name: 'bb_test' };
      await expect(registry.registerTool(tool)).rejects.toThrow('Tool name cannot start with \'bb_\' prefix');
    });

    it('should accept tools without forbidden prefixes', async () => {
      const validNames = [
        'test_tool',
        'bitbucket_test_tool',  // bitbucket_ in middle is OK
        'mcp_test_tool',        // mcp_ in middle is OK
        'bb_test_tool'          // bb_ in middle is OK
      ];

      for (const name of validNames) {
        const tool = { ...mockTool, name };
        await expect(registry.registerTool(tool)).resolves.not.toThrow();
        await registry.unregisterTool(name);
      }
    });
  });

  describe('Reserved Name Validation', () => {
    it('should reject reserved tool names', async () => {
      const reservedNames = ['list', 'call', 'initialize', 'shutdown', 'ping', 'help'];

      for (const name of reservedNames) {
        const tool = { ...mockTool, name };
        await expect(registry.registerTool(tool)).rejects.toThrow(`Tool name '${name}' is reserved`);
      }
    });
  });

  describe('Tool Structure Validation', () => {
    it('should validate required tool properties', async () => {
      const invalidTools = [
        { ...mockTool, name: undefined },
        { ...mockTool, name: '' },
        { ...mockTool, description: undefined },
        { ...mockTool, description: '' },
        { ...mockTool, execute: undefined },
        { ...mockTool, parameters: undefined },
        { ...mockTool, parameters: 'invalid' }
      ];

      for (const tool of invalidTools) {
        await expect(registry.registerTool(tool as any)).rejects.toThrow();
      }
    });

    it('should validate parameter structure', async () => {
      const invalidParamTools = [
        { ...mockTool, parameters: [{ name: undefined, type: 'string', required: true }] },
        { ...mockTool, parameters: [{ name: 'param', type: undefined, required: true }] },
        { ...mockTool, parameters: [{ name: 'param', type: 'string', required: 'invalid' }] },
        { ...mockTool, parameters: [{ name: 'param', type: 'invalid_type', required: true }] }
      ];

      for (const tool of invalidParamTools) {
        await expect(registry.registerTool(tool as any)).rejects.toThrow();
      }
    });

    it('should reject duplicate parameter names', async () => {
      const tool = {
        ...mockTool,
        parameters: [
          { name: 'param1', type: 'string' as const, description: 'First param', required: true },
          { name: 'param1', type: 'string' as const, description: 'Second param', required: false }
        ]
      };

      await expect(registry.registerTool(tool)).rejects.toThrow('Tool parameters must have unique names');
    });
  });

  describe('Tool Unregistration', () => {
    beforeEach(async () => {
      await registry.registerTool(mockTool);
    });

    it('should unregister a tool successfully', async () => {
      const result = await registry.unregisterTool('test_tool');
      expect(result).toBe(true);
      
      const tool = registry.getTool('test_tool');
      expect(tool).toBeUndefined();
    });

    it('should return false for non-existent tool', async () => {
      const result = await registry.unregisterTool('non_existent');
      expect(result).toBe(false);
    });

    it('should clean up tool statistics', async () => {
      // Execute tool to generate statistics
      await registry.executeTool('test_tool', { message: 'test' }, {
        session: {} as any,
        server: {} as any,
        request: { id: 'test', timestamp: new Date(), transport: 'stdio' },
        environment: { nodeVersion: '1.0.0', platform: 'test', memoryUsage: process.memoryUsage() }
      });

      const statsBefore = registry.getToolStats('test_tool');
      expect(statsBefore?.totalExecutions).toBe(1);

      await registry.unregisterTool('test_tool');
      
      const statsAfter = registry.getToolStats('test_tool');
      expect(statsAfter).toBeUndefined();
    });
  });

  describe('Tool Discovery', () => {
    beforeEach(async () => {
      await registry.registerTool(mockTool);
      await registry.registerTool({ ...mockTool, name: 'another_tool', category: 'other' });
      await registry.registerTool({ ...mockTool, name: 'disabled_tool', enabled: false });
    });

    it('should get available tools', () => {
      const tools = registry.getAvailableTools();
      expect(tools).toHaveLength(2); // Only enabled tools
      expect(tools.map(t => t.name)).toContain('test_tool');
      expect(tools.map(t => t.name)).toContain('another_tool');
      expect(tools.map(t => t.name)).not.toContain('disabled_tool');
    });

    it('should get tool by name', () => {
      const tool = registry.getTool('test_tool');
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('test_tool');
    });

    it('should return undefined for non-existent tool', () => {
      const tool = registry.getTool('non_existent');
      expect(tool).toBeUndefined();
    });

    it('should return undefined for disabled tool', () => {
      const tool = registry.getTool('disabled_tool');
      expect(tool).toBeUndefined();
    });

    it('should get tools by category', () => {
      const testingTools = registry.getToolsByCategory('testing');
      expect(testingTools).toHaveLength(1);
      expect(testingTools[0].name).toBe('test_tool');

      const otherTools = registry.getToolsByCategory('other');
      expect(otherTools).toHaveLength(1);
      expect(otherTools[0].name).toBe('another_tool');

      const emptyTools = registry.getToolsByCategory('empty');
      expect(emptyTools).toHaveLength(0);
    });

    it('should get all categories', () => {
      const categories = registry.getCategories();
      expect(categories).toContain('testing');
      expect(categories).toContain('other');
    });

    it('should search tools by query', () => {
      const results = registry.searchTools('test');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('test_tool');

      const allResults = registry.searchTools('tool');
      expect(allResults).toHaveLength(2);
    });
  });

  describe('Tool Management', () => {
    beforeEach(async () => {
      await registry.registerTool(mockTool);
    });

    it('should enable and disable tools', () => {
      expect(registry.getAvailableTools()).toHaveLength(1);
      
      registry.disableTool('test_tool');
      expect(registry.getAvailableTools()).toHaveLength(0);
      
      registry.enableTool('test_tool');
      expect(registry.getAvailableTools()).toHaveLength(1);
    });

    it('should return false for non-existent tool operations', () => {
      expect(registry.enableTool('non_existent')).toBe(false);
      expect(registry.disableTool('non_existent')).toBe(false);
    });
  });

  describe('Tool Execution', () => {
    beforeEach(async () => {
      await registry.registerTool(mockTool);
    });

    it('should execute tool successfully', async () => {
      const result = await registry.executeTool('test_tool', { message: 'Hello' }, {
        session: {} as any,
        server: {} as any,
        request: { id: 'test', timestamp: new Date(), transport: 'stdio' },
        environment: { nodeVersion: '1.0.0', platform: 'test', memoryUsage: process.memoryUsage() }
      });

      expect(result.success).toBe(true);
      expect(result.data.message).toBe('Echo: Hello');
    });

    it('should handle tool execution errors', async () => {
      const errorTool: Tool = {
        ...mockTool,
        name: 'error_tool',
        execute: async () => {
          throw new Error('Test error');
        }
      };

      await registry.registerTool(errorTool);

      const result = await registry.executeTool('error_tool', { message: 'Hello' }, {
        session: {} as any,
        server: {} as any,
        request: { id: 'test', timestamp: new Date(), transport: 'stdio' },
        environment: { nodeVersion: '1.0.0', platform: 'test', memoryUsage: process.memoryUsage() }
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Test error');
    });

    it('should validate required parameters', async () => {
      const result = await registry.executeTool('test_tool', {}, {
        session: {} as any,
        server: {} as any,
        request: { id: 'test', timestamp: new Date(), transport: 'stdio' },
        environment: { nodeVersion: '1.0.0', platform: 'test', memoryUsage: process.memoryUsage() }
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Required parameter \'message\' is missing');
    });

    it('should validate parameter types', async () => {
      const result = await registry.executeTool('test_tool', { message: 123 }, {
        session: {} as any,
        server: {} as any,
        request: { id: 'test', timestamp: new Date(), transport: 'stdio' },
        environment: { nodeVersion: '1.0.0', platform: 'test', memoryUsage: process.memoryUsage() }
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Parameter \'message\' must be of type \'string\'');
    });

    it('should reject unknown parameters', async () => {
      const result = await registry.executeTool('test_tool', { message: 'Hello', unknown: 'param' }, {
        session: {} as any,
        server: {} as any,
        request: { id: 'test', timestamp: new Date(), transport: 'stdio' },
        environment: { nodeVersion: '1.0.0', platform: 'test', memoryUsage: process.memoryUsage() }
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Unknown parameter \'unknown\'');
    });

    it('should handle non-existent tool execution', async () => {
      const result = await registry.executeTool('non_existent', {}, {
        session: {} as any,
        server: {} as any,
        request: { id: 'test', timestamp: new Date(), transport: 'stdio' },
        environment: { nodeVersion: '1.0.0', platform: 'test', memoryUsage: process.memoryUsage() }
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('not found or disabled');
    });
  });

  describe('Statistics Tracking', () => {
    beforeEach(async () => {
      await registry.registerTool(mockTool);
    });

    it('should track tool execution statistics', async () => {
      const statsBefore = registry.getToolStats('test_tool');
      expect(statsBefore?.totalExecutions).toBe(0);

      // Execute tool multiple times
      await registry.executeTool('test_tool', { message: 'Hello' }, {
        session: {} as any,
        server: {} as any,
        request: { id: 'test1', timestamp: new Date(), transport: 'stdio' },
        environment: { nodeVersion: '1.0.0', platform: 'test', memoryUsage: process.memoryUsage() }
      });

      await registry.executeTool('test_tool', { message: 'World' }, {
        session: {} as any,
        server: {} as any,
        request: { id: 'test2', timestamp: new Date(), transport: 'stdio' },
        environment: { nodeVersion: '1.0.0', platform: 'test', memoryUsage: process.memoryUsage() }
      });

      const statsAfter = registry.getToolStats('test_tool');
      expect(statsAfter?.totalExecutions).toBe(2);
      expect(statsAfter?.successfulExecutions).toBe(2);
      expect(statsAfter?.failedExecutions).toBe(0);
      expect(statsAfter?.successRate).toBe(1.0);
      expect(statsAfter?.averageExecutionTime).toBeGreaterThan(0);
    });

    it('should track failed executions', async () => {
      const errorTool: Tool = {
        ...mockTool,
        name: 'error_tool',
        execute: async () => {
          throw new Error('Test error');
        }
      };

      await registry.registerTool(errorTool);

      await registry.executeTool('error_tool', { message: 'Hello' }, {
        session: {} as any,
        server: {} as any,
        request: { id: 'test', timestamp: new Date(), transport: 'stdio' },
        environment: { nodeVersion: '1.0.0', platform: 'test', memoryUsage: process.memoryUsage() }
      });

      const stats = registry.getToolStats('error_tool');
      expect(stats?.totalExecutions).toBe(1);
      expect(stats?.successfulExecutions).toBe(0);
      expect(stats?.failedExecutions).toBe(1);
      expect(stats?.successRate).toBe(0);
    });

    it('should provide registry statistics', async () => {
      await registry.registerTool({ ...mockTool, name: 'tool2' });
      await registry.registerTool({ ...mockTool, name: 'tool3', enabled: false });

      const stats = registry.getRegistryStats();
      expect(stats.totalTools).toBe(3);
      expect(stats.enabledTools).toBe(2);
      expect(stats.disabledTools).toBe(1);
      expect(stats.toolsByCategory.testing).toBe(3);
    });

    it('should track most used tools', async () => {
      await registry.registerTool({ ...mockTool, name: 'tool2' });

      // Execute tool1 more times
      for (let i = 0; i < 3; i++) {
        await registry.executeTool('test_tool', { message: 'Hello' }, {
          session: {} as any,
          server: {} as any,
          request: { id: `test${i}`, timestamp: new Date(), transport: 'stdio' },
          environment: { nodeVersion: '1.0.0', platform: 'test', memoryUsage: process.memoryUsage() }
        });
      }

      // Execute tool2 once
      await registry.executeTool('tool2', { message: 'World' }, {
        session: {} as any,
        server: {} as any,
        request: { id: 'test4', timestamp: new Date(), transport: 'stdio' },
        environment: { nodeVersion: '1.0.0', platform: 'test', memoryUsage: process.memoryUsage() }
      });

      const stats = registry.getRegistryStats();
      expect(stats.mostUsedTools[0].name).toBe('test_tool');
      expect(stats.mostUsedTools[0].count).toBe(3);
      expect(stats.mostUsedTools[1].name).toBe('tool2');
      expect(stats.mostUsedTools[1].count).toBe(1);
    });
  });

  describe('Event Handling', () => {
    it('should emit tool registered event', async () => {
      const registeredSpy = jest.fn();
      registry.on('toolRegistered', registeredSpy);

      await registry.registerTool(mockTool);
      expect(registeredSpy).toHaveBeenCalledWith(expect.objectContaining({ name: 'test_tool' }));
    });

    it('should emit tool unregistered event', async () => {
      const unregisteredSpy = jest.fn();
      registry.on('toolUnregistered', unregisteredSpy);

      await registry.registerTool(mockTool);
      await registry.unregisterTool('test_tool');
      expect(unregisteredSpy).toHaveBeenCalledWith('test_tool');
    });

    it('should emit tool executed event', async () => {
      const executedSpy = jest.fn();
      registry.on('toolExecuted', executedSpy);

      await registry.registerTool(mockTool);
      await registry.executeTool('test_tool', { message: 'Hello' }, {
        session: {} as any,
        server: {} as any,
        request: { id: 'test', timestamp: new Date(), transport: 'stdio' },
        environment: { nodeVersion: '1.0.0', platform: 'test', memoryUsage: process.memoryUsage() }
      });

      expect(executedSpy).toHaveBeenCalledWith('test_tool', expect.any(Object), expect.any(Object));
    });

    it('should emit tool execution error event', async () => {
      const errorSpy = jest.fn();
      registry.on('toolExecutionError', errorSpy);

      const errorTool: Tool = {
        ...mockTool,
        name: 'error_tool',
        execute: async () => {
          throw new Error('Test error');
        }
      };

      await registry.registerTool(errorTool);
      await registry.executeTool('error_tool', { message: 'Hello' }, {
        session: {} as any,
        server: {} as any,
        request: { id: 'test', timestamp: new Date(), transport: 'stdio' },
        environment: { nodeVersion: '1.0.0', platform: 'test', memoryUsage: process.memoryUsage() }
      });

      expect(errorSpy).toHaveBeenCalledWith('error_tool', expect.any(Error), expect.any(Object));
    });
  });

  describe('Configuration Options', () => {
    it('should respect validateParameters option', async () => {
      const noValidationRegistry = new ToolRegistry({ validateParameters: false });
      await noValidationRegistry.registerTool(mockTool);

      // Should not throw even with invalid parameters
      const result = await noValidationRegistry.executeTool('test_tool', { invalid: 'param' }, {
        session: {} as any,
        server: {} as any,
        request: { id: 'test', timestamp: new Date(), transport: 'stdio' },
        environment: { nodeVersion: '1.0.0', platform: 'test', memoryUsage: process.memoryUsage() }
      });

      expect(result.success).toBe(true);
    });

    it('should respect trackStatistics option', async () => {
      const noStatsRegistry = new ToolRegistry({ trackStatistics: false });
      await noStatsRegistry.registerTool(mockTool);

      await noStatsRegistry.executeTool('test_tool', { message: 'Hello' }, {
        session: {} as any,
        server: {} as any,
        request: { id: 'test', timestamp: new Date(), transport: 'stdio' },
        environment: { nodeVersion: '1.0.0', platform: 'test', memoryUsage: process.memoryUsage() }
      });

      const stats = noStatsRegistry.getToolStats('test_tool');
      expect(stats).toBeUndefined();
    });
  });
});

export { mockTool };
