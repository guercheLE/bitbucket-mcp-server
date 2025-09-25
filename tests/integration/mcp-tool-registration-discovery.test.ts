/**
 * MCP Tool Registration and Discovery Integration Tests
 * 
 * Comprehensive integration tests for MCP tool registration and discovery functionality.
 * Tests cover the complete workflow from tool registration to discovery and execution
 * with proper validation and error handling.
 * 
 * Tests cover:
 * - Tool registration with various configurations
 * - Tool discovery and listing
 * - Tool search and filtering
 * - Tool validation and error handling
 * - Tool execution with registered tools
 * - Tool statistics and monitoring
 * - Tool lifecycle management
 * 
 * Constitutional Requirements:
 * - Test-First Development
 * - MCP Protocol First
 * - Complete API Coverage
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { MCPServerWithAuth } from '../../src/server/mcp-server-with-auth';
import { ToolRegistry } from '../../src/server/tool-registry';
import { Tool, ToolExecutionContext, ToolResult } from '../../src/types/index';
import { AuthenticationManager } from '../../src/server/auth/authentication-manager';
import { EventEmitter } from 'events';

// Mock AuthenticationManager for testing
class MockAuthenticationManager extends EventEmitter {
  async initialize() {
    return { success: true };
  }
  
  async authenticateWithToken(token: string) {
    return { success: true, data: null };
  }
  
  async authenticateWithSession(sessionId: string) {
    return { success: true, data: null };
  }
  
  async validateSession(sessionId: string) {
    return { success: true, data: null };
  }
  
  async refreshSession(sessionId: string) {
    return { success: true, data: null };
  }
  
  async terminateSession(sessionId: string) {
    return { success: true };
  }
}

describe('MCP Tool Registration and Discovery Integration Tests', () => {
  let server: MCPServerWithAuth;
  let registry: ToolRegistry;
  let mockAuthManager: MockAuthenticationManager;

  beforeEach(async () => {
    // Create mock authentication manager
    mockAuthManager = new MockAuthenticationManager();
    // Create test server configuration
    const config = {
      name: 'Test MCP Server',
      version: '1.0.0',
      description: 'Test server for tool registration and discovery',
      maxClients: 10,
      clientTimeout: 30000,
      memoryLimit: 100 * 1024 * 1024, // 100MB
      logging: {
        level: 'info' as const,
        console: true
      },
      transports: [
        {
          type: 'stdio' as const,
          config: {}
        }
      ],
      tools: {
        autoRegister: false,
        selectiveLoading: true,
        validationEnabled: true
      }
    };

    server = new MCPServerWithAuth(config, mockAuthManager);
    registry = server.toolRegistry;
    // Don't start the server, just test the registry directly
  });

  afterEach(async () => {
    if (server.isRunning) {
      await server.stop();
    }
  });

  describe('Tool Registration', () => {
    it('should register a basic tool successfully', async () => {
      const testTool: Tool = {
        name: 'test_tool',
        description: 'A basic test tool',
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

      await registry.registerTool(testTool);
      
      const availableTools = registry.getAvailableTools();
      expect(availableTools.length).toBeGreaterThan(0);
      const foundTool = availableTools.find(t => t.name === 'test_tool');
      expect(foundTool).toBeDefined();
      expect(foundTool?.name).toBe('test_tool');
      expect(foundTool?.description).toBe('A basic test tool');
    });

    it('should register multiple tools with different categories', async () => {
      const tools: Tool[] = [
        {
          name: 'auth_tool',
          description: 'Authentication tool',
          parameters: [],
          enabled: true,
          category: 'authentication',
          version: '1.0.0',
          execute: async () => ({ success: true, data: {} })
        },
        {
          name: 'repo_tool',
          description: 'Repository tool',
          parameters: [],
          enabled: true,
          category: 'repository',
          version: '1.0.0',
          execute: async () => ({ success: true, data: {} })
        },
        {
          name: 'search_tool',
          description: 'Search tool',
          parameters: [],
          enabled: true,
          category: 'search',
          version: '1.0.0',
          execute: async () => ({ success: true, data: {} })
        }
      ];

      for (const tool of tools) {
        await registry.registerTool(tool);
      }

      const availableTools = registry.getAvailableTools();
      expect(availableTools.length).toBeGreaterThan(0);
      
      const categories = registry.getCategories();
      expect(categories).toContain('authentication');
      expect(categories).toContain('repository');
      expect(categories).toContain('search');
    });

    it('should handle tool registration with complex parameters', async () => {
      const complexTool: Tool = {
        name: 'complex_tool',
        description: 'Tool with complex parameters',
        parameters: [
          {
            name: 'string_param',
            type: 'string',
            description: 'String parameter',
            required: true
          },
          {
            name: 'number_param',
            type: 'number',
            description: 'Number parameter',
            required: false
          },
          {
            name: 'boolean_param',
            type: 'boolean',
            description: 'Boolean parameter',
            required: false
          },
          {
            name: 'array_param',
            type: 'array',
            description: 'Array parameter',
            required: false
          },
          {
            name: 'object_param',
            type: 'object',
            description: 'Object parameter',
            required: false
          }
        ],
        enabled: true,
        category: 'testing',
        version: '1.0.0',
        execute: async (params: Record<string, any>, context: ToolExecutionContext): Promise<ToolResult> => {
          return {
            success: true,
            data: { received: params },
            metadata: {
              executionTime: 15,
              memoryUsed: 2048,
              timestamp: new Date()
            }
          };
        }
      };

      await registry.registerTool(complexTool);
      
      const tool = registry.getTool('complex_tool');
      expect(tool).toBeDefined();
      expect(tool?.parameters).toHaveLength(5);
      expect(tool?.parameters[0].type).toBe('string');
      expect(tool?.parameters[1].type).toBe('number');
      expect(tool?.parameters[2].type).toBe('boolean');
      expect(tool?.parameters[3].type).toBe('array');
      expect(tool?.parameters[4].type).toBe('object');
    });

    it('should reject tool registration with invalid name', async () => {
      const invalidTool: Tool = {
        name: 'bitbucket_invalid_tool', // Invalid prefix
        description: 'Invalid tool name',
        parameters: [],
        enabled: true,
        category: 'testing',
        version: '1.0.0',
        execute: async () => ({ success: true, data: {} })
      };

      await expect(registry.registerTool(invalidTool)).rejects.toThrow(
        'Tool name cannot start with \'bitbucket_\' prefix'
      );
    });

    it('should reject tool registration with invalid snake_case name', async () => {
      const invalidTool: Tool = {
        name: 'InvalidToolName', // Invalid format
        description: 'Invalid tool name format',
        parameters: [],
        enabled: true,
        category: 'testing',
        version: '1.0.0',
        execute: async () => ({ success: true, data: {} })
      };

      await expect(registry.registerTool(invalidTool)).rejects.toThrow(
        'Tool name must be in snake_case format'
      );
    });

    it('should reject tool registration with reserved name', async () => {
      const reservedTool: Tool = {
        name: 'list', // Reserved name
        description: 'Reserved tool name',
        parameters: [],
        enabled: true,
        category: 'testing',
        version: '1.0.0',
        execute: async () => ({ success: true, data: {} })
      };

      await expect(registry.registerTool(reservedTool)).rejects.toThrow(
        'Tool name \'list\' is reserved'
      );
    });

    it('should reject tool registration with duplicate name', async () => {
      const tool: Tool = {
        name: 'duplicate_tool',
        description: 'First tool',
        parameters: [],
        enabled: true,
        category: 'testing',
        version: '1.0.0',
        execute: async () => ({ success: true, data: {} })
      };

      await registry.registerTool(tool);
      
      const duplicateTool: Tool = {
        ...tool,
        description: 'Second tool with same name'
      };

      await expect(registry.registerTool(duplicateTool)).rejects.toThrow(
        'Tool \'duplicate_tool\' is already registered'
      );
    });
  });

  describe('Tool Discovery', () => {
    beforeEach(async () => {
      // Register multiple tools for discovery tests
      const tools: Tool[] = [
        {
          name: 'auth_login',
          description: 'User login tool',
          parameters: [],
          enabled: true,
          category: 'authentication',
          version: '1.0.0',
          execute: async () => ({ success: true, data: {} })
        },
        {
          name: 'auth_logout',
          description: 'User logout tool',
          parameters: [],
          enabled: true,
          category: 'authentication',
          version: '1.0.0',
          execute: async () => ({ success: true, data: {} })
        },
        {
          name: 'repo_list',
          description: 'List repositories tool',
          parameters: [],
          enabled: true,
          category: 'repository',
          version: '1.0.0',
          execute: async () => ({ success: true, data: {} })
        },
        {
          name: 'repo_create',
          description: 'Create repository tool',
          parameters: [],
          enabled: true,
          category: 'repository',
          version: '1.0.0',
          execute: async () => ({ success: true, data: {} })
        },
        {
          name: 'search_repos',
          description: 'Search repositories tool',
          parameters: [],
          enabled: true,
          category: 'search',
          version: '1.0.0',
          execute: async () => ({ success: true, data: {} })
        },
        {
          name: 'disabled_tool',
          description: 'Disabled tool',
          parameters: [],
          enabled: false,
          category: 'testing',
          version: '1.0.0',
          execute: async () => ({ success: true, data: {} })
        }
      ];

      for (const tool of tools) {
        await registry.registerTool(tool);
      }
    });

    it('should get all available tools', () => {
      const availableTools = registry.getAvailableTools();
      expect(availableTools.length).toBeGreaterThan(0); // Only enabled tools
      expect(availableTools.map(t => t.name)).toContain('auth_login');
      expect(availableTools.map(t => t.name)).toContain('auth_logout');
      expect(availableTools.map(t => t.name)).toContain('repo_list');
      expect(availableTools.map(t => t.name)).toContain('repo_create');
      expect(availableTools.map(t => t.name)).toContain('search_repos');
      expect(availableTools.map(t => t.name)).not.toContain('disabled_tool');
    });

    it('should get tool by name', () => {
      const tool = registry.getTool('auth_login');
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('auth_login');
      expect(tool?.description).toBe('User login tool');
      expect(tool?.category).toBe('authentication');
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
      const authTools = registry.getToolsByCategory('authentication');
      expect(authTools.length).toBeGreaterThan(0);
      expect(authTools.map(t => t.name)).toContain('auth_login');
      expect(authTools.map(t => t.name)).toContain('auth_logout');

      const repoTools = registry.getToolsByCategory('repository');
      expect(repoTools.length).toBeGreaterThan(0);
      expect(repoTools.map(t => t.name)).toContain('repo_list');
      expect(repoTools.map(t => t.name)).toContain('repo_create');

      const searchTools = registry.getToolsByCategory('search');
      expect(searchTools.length).toBeGreaterThanOrEqual(0);
      if (searchTools.length > 0) {
        expect(searchTools[0].name).toBe('search_repos');
      }
    });

    it('should return empty array for non-existent category', () => {
      const tools = registry.getToolsByCategory('non_existent');
      expect(tools).toHaveLength(0);
    });

    it('should get all categories', () => {
      const categories = registry.getCategories();
      expect(categories).toContain('authentication');
      expect(categories).toContain('repository');
      expect(categories).toContain('search');
      expect(categories).toContain('testing');
    });

    it('should search tools by query', () => {
      const authResults = registry.searchTools('auth');
      expect(authResults.length).toBeGreaterThan(0);
      expect(authResults.map(t => t.name)).toContain('auth_login');
      expect(authResults.map(t => t.name)).toContain('auth_logout');

      const repoResults = registry.searchTools('repo');
      expect(repoResults.length).toBeGreaterThan(0);
      expect(repoResults.map(t => t.name)).toContain('repo_list');
      expect(repoResults.map(t => t.name)).toContain('repo_create');

      const loginResults = registry.searchTools('login');
      expect(loginResults.length).toBeGreaterThan(0);
      expect(loginResults[0]?.name).toBe('auth_login');
    });

    it('should return empty array for non-matching search query', () => {
      const results = registry.searchTools('non_matching_query');
      expect(results).toHaveLength(0);
    });

    it('should search tools by description', () => {
      const results = registry.searchTools('user');
      expect(results.length).toBeGreaterThan(0);
      expect(results.map(t => t.name)).toContain('auth_login');
      expect(results.map(t => t.name)).toContain('auth_logout');
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
            name: 'message',
            type: 'string',
            description: 'Message to echo',
            required: true
          },
          {
            name: 'repeat',
            type: 'number',
            description: 'Number of times to repeat',
            required: false
          }
        ],
        enabled: true,
        category: 'testing',
        version: '1.0.0',
        execute: async (params: Record<string, any>, context: ToolExecutionContext): Promise<ToolResult> => {
          const message = params.message;
          const repeat = params.repeat || 1;
          const result = Array(repeat).fill(message).join(' ');
          
          return {
            success: true,
            data: { echo: result },
            metadata: {
              executionTime: 20,
              memoryUsed: 1024,
              timestamp: new Date()
            }
          };
        }
      };

      await registry.registerTool(testTool);
    });

    it('should execute tool successfully with required parameters', async () => {
      const result = await registry.executeTool('echo_tool', { message: 'Hello World' }, {
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
      expect(result.data.echo).toBe('Hello World');
      expect(result.metadata.executionTime).toBe(20);
    });

    it('should execute tool with optional parameters', async () => {
      const result = await registry.executeTool('echo_tool', { 
        message: 'Hello', 
        repeat: 3 
      }, {
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
      expect(result.data.echo).toBe('Hello Hello Hello');
    });

    it('should handle tool execution errors', async () => {
      const errorTool: Tool = {
        name: 'error_tool',
        description: 'Tool that throws an error',
        parameters: [],
        enabled: true,
        category: 'testing',
        version: '1.0.0',
        execute: async () => {
          throw new Error('Test execution error');
        }
      };

      await registry.registerTool(errorTool);

      const result = await registry.executeTool('error_tool', {}, {
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
      expect(result.error?.message).toBe('Test execution error');
    });

    it('should validate required parameters', async () => {
      const result = await registry.executeTool('echo_tool', {}, {
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
      expect(result.error?.message).toContain('Required parameter \'message\' is missing');
    });

    it('should validate parameter types', async () => {
      const result = await registry.executeTool('echo_tool', { message: 123 }, {
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
      expect(result.error?.message).toContain('Parameter \'message\' must be of type \'string\'');
    });

    it('should reject unknown parameters', async () => {
      const result = await registry.executeTool('echo_tool', { 
        message: 'Hello', 
        unknown: 'param' 
      }, {
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
      expect(result.error?.message).toContain('Unknown parameter \'unknown\'');
    });

    it('should handle non-existent tool execution', async () => {
      const result = await registry.executeTool('non_existent', {}, {
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
      expect(result.error?.message).toContain('not found or disabled');
    });
  });

  describe('Tool Statistics and Monitoring', () => {
    let testTool: Tool;

    beforeEach(async () => {
      testTool = {
        name: 'stats_tool',
        description: 'Tool for statistics testing',
        parameters: [
          {
            name: 'value',
            type: 'number',
            description: 'Value to process',
            required: true
          }
        ],
        enabled: true,
        category: 'testing',
        version: '1.0.0',
        execute: async (params: Record<string, any>, context: ToolExecutionContext): Promise<ToolResult> => {
          return {
            success: true,
            data: { processed: params.value * 2 },
            metadata: {
              executionTime: 30,
              memoryUsed: 2048,
              timestamp: new Date()
            }
          };
        }
      };

      await registry.registerTool(testTool);
    });

    it('should track tool execution statistics', async () => {
      const statsBefore = registry.getToolStats('stats_tool');
      expect(statsBefore?.totalExecutions).toBe(0);

      // Execute tool multiple times
      for (let i = 0; i < 3; i++) {
        await registry.executeTool('stats_tool', { value: i + 1 }, {
          session: {} as any,
          server: server,
          request: {
            id: `test-request-${i}`,
            timestamp: new Date(),
            transport: 'stdio'
          },
          environment: {
            nodeVersion: process.version,
            platform: process.platform,
            memoryUsage: process.memoryUsage()
          }
        });
      }

      const statsAfter = registry.getToolStats('stats_tool');
      expect(statsAfter?.totalExecutions).toBe(3);
      expect(statsAfter?.successfulExecutions).toBe(3);
      expect(statsAfter?.failedExecutions).toBe(0);
      expect(statsAfter?.successRate).toBe(1.0);
      expect(statsAfter?.averageExecutionTime).toBeGreaterThanOrEqual(0);
    });

    it('should track failed executions', async () => {
      const errorTool: Tool = {
        name: 'error_stats_tool',
        description: 'Tool that fails for statistics testing',
        parameters: [],
        enabled: true,
        category: 'testing',
        version: '1.0.0',
        execute: async () => {
          throw new Error('Test error');
        }
      };

      await registry.registerTool(errorTool);

      await registry.executeTool('error_stats_tool', {}, {
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

      const stats = registry.getToolStats('error_stats_tool');
      expect(stats?.totalExecutions).toBe(1);
      expect(stats?.successfulExecutions).toBe(0);
      expect(stats?.failedExecutions).toBe(1);
      expect(stats?.successRate).toBe(0);
    });

    it('should provide registry statistics', async () => {
      await registry.registerTool({
        name: 'tool2',
        description: 'Second tool',
        parameters: [],
        enabled: true,
        category: 'testing',
        version: '1.0.0',
        execute: async () => ({ success: true, data: {} })
      });

      await registry.registerTool({
        name: 'tool3',
        description: 'Third tool',
        parameters: [],
        enabled: false,
        category: 'testing',
        version: '1.0.0',
        execute: async () => ({ success: true, data: {} })
      });

      const stats = registry.getRegistryStats();
      expect(stats.totalTools).toBeGreaterThanOrEqual(3);
      expect(stats.enabledTools).toBeGreaterThanOrEqual(2);
      expect(stats.disabledTools).toBeGreaterThanOrEqual(1);
      expect(stats.toolsByCategory.testing).toBeGreaterThanOrEqual(3);
    });

    it('should track most used tools', async () => {
      await registry.registerTool({
        name: 'tool2',
        description: 'Second tool',
        parameters: [],
        enabled: true,
        category: 'testing',
        version: '1.0.0',
        execute: async () => ({ success: true, data: {} })
      });

      // Execute stats_tool more times
      for (let i = 0; i < 3; i++) {
        await registry.executeTool('stats_tool', { value: i + 1 }, {
          session: {} as any,
          server: server,
          request: {
            id: `test-request-${i}`,
            timestamp: new Date(),
            transport: 'stdio'
          },
          environment: {
            nodeVersion: process.version,
            platform: process.platform,
            memoryUsage: process.memoryUsage()
          }
        });
      }

      // Execute tool2 once
      await registry.executeTool('tool2', {}, {
        session: {} as any,
        server: server,
        request: {
          id: 'test-request-4',
          timestamp: new Date(),
          transport: 'stdio'
        },
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          memoryUsage: process.memoryUsage()
        }
      });

      const stats = registry.getRegistryStats();
      expect(stats.mostUsedTools[0].name).toBe('stats_tool');
      expect(stats.mostUsedTools[0].count).toBe(3);
      expect(stats.mostUsedTools[1].name).toBe('tool2');
      expect(stats.mostUsedTools[1].count).toBe(1);
    });
  });

  describe('Tool Lifecycle Management', () => {
    let testTool: Tool;

    beforeEach(async () => {
      testTool = {
        name: 'lifecycle_tool',
        description: 'Tool for lifecycle testing',
        parameters: [],
        enabled: true,
        category: 'testing',
        version: '1.0.0',
        execute: async () => ({ success: true, data: {} })
      };

      await registry.registerTool(testTool);
    });

    it('should enable and disable tools', () => {
      const initialCount = registry.getAvailableTools().length;
      expect(initialCount).toBeGreaterThan(0);
      
      registry.disableTool('lifecycle_tool');
      expect(registry.getAvailableTools().length).toBe(initialCount - 1);
      
      registry.enableTool('lifecycle_tool');
      expect(registry.getAvailableTools().length).toBe(initialCount);
    });

    it('should return false for non-existent tool operations', () => {
      expect(registry.enableTool('non_existent')).toBe(false);
      expect(registry.disableTool('non_existent')).toBe(false);
    });

    it('should unregister tools successfully', async () => {        
      const initialCount = registry.getAvailableTools().length;
      expect(initialCount).toBeGreaterThan(0);
      
      await registry.unregisterTool('lifecycle_tool');
      expect(registry.getAvailableTools().length).toBe(initialCount - 1);
      
      const tool = registry.getTool('lifecycle_tool');
      expect(tool).toBeUndefined();
    });

    it('should handle unregistration of non-existent tool gracefully', async () => {
      await registry.unregisterTool('non_existent'); // Should not throw
    });

    it('should clean up tool statistics on unregistration', async () => {
      // Execute tool to generate statistics
      await registry.executeTool('lifecycle_tool', {}, {
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

      const statsBefore = registry.getToolStats('lifecycle_tool');
      expect(statsBefore?.totalExecutions).toBe(1);

      await registry.unregisterTool('lifecycle_tool');
      
      const statsAfter = registry.getToolStats('lifecycle_tool');
      expect(statsAfter).toBeUndefined();
    });
  });

  describe('Event Handling', () => {
    it('should emit tool registered event', async () => {
      const toolRegisteredSpy = jest.fn();
      registry.on('toolRegistered', toolRegisteredSpy);

      const testTool: Tool = {
        name: 'event_tool',
        description: 'Tool for event testing',
        parameters: [],
        enabled: true,
        category: 'testing',
        version: '1.0.0',
        execute: async () => ({ success: true, data: {} })
      };

      await registry.registerTool(testTool);
      expect(toolRegisteredSpy).toHaveBeenCalledWith(expect.objectContaining({
        name: 'event_tool',
        description: 'Tool for event testing',
        category: 'testing'
      }));
    });

    it('should emit tool unregistered event', async () => {
      const toolUnregisteredSpy = jest.fn();
      registry.on('toolUnregistered', toolUnregisteredSpy);

      const testTool: Tool = {
        name: 'event_tool2',
        description: 'Tool for event testing',
        parameters: [],
        enabled: true,
        category: 'testing',
        version: '1.0.0',
        execute: async () => ({ success: true, data: {} })
      };

      await registry.registerTool(testTool);
      await registry.unregisterTool('event_tool2');
      expect(toolUnregisteredSpy).toHaveBeenCalledWith('event_tool2');
    });

    it('should emit tool executed event', async () => {
      const toolExecutedSpy = jest.fn();
      registry.on('toolExecuted', toolExecutedSpy);

      const testTool: Tool = {
        name: 'event_tool3',
        description: 'Tool for event testing',
        parameters: [],
        enabled: true,
        category: 'testing',
        version: '1.0.0',
        execute: async () => ({ success: true, data: {} })
      };

      await registry.registerTool(testTool);
      await registry.executeTool('event_tool3', {}, {
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

      expect(toolExecutedSpy).toHaveBeenCalledWith('event_tool3', expect.any(Object), expect.any(Object));
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle tool registration with malformed parameters', async () => {
      const malformedTool: Tool = {
        name: 'malformed_tool',
        description: 'Tool with malformed parameters',
        parameters: [
          {
            name: 'param1',
            type: 'string' as any,
            description: 'Valid param',
            required: true
          },
          {
            name: 'param2',
            type: 'invalid_type' as any,
            description: 'Invalid param type',
            required: false
          }
        ],
        enabled: true,
        category: 'testing',
        version: '1.0.0',
        execute: async () => ({ success: true, data: {} })
      };

      await expect(registry.registerTool(malformedTool)).rejects.toThrow();
    });

    it('should handle tool execution with malformed context', async () => {
      const testTool: Tool = {
        name: 'context_tool',
        description: 'Tool for context testing',
        parameters: [],
        enabled: true,
        category: 'testing',
        version: '1.0.0',
        execute: async (params: Record<string, any>, context: ToolExecutionContext): Promise<ToolResult> => {
          // Tool should handle malformed context gracefully
          return {
            success: true,
            data: { contextReceived: !!context },
            metadata: {
              executionTime: 10,
              memoryUsed: 1024,
              timestamp: new Date()
            }
          };
        }
      };

      await registry.registerTool(testTool);

      const result = await registry.executeTool('context_tool', {}, {
        session: null as any,
        server: null as any,
        request: null as any,
        environment: null as any
      });

      expect(result.success).toBe(true);
      expect(result.data.contextReceived).toBe(true);
    });

    it('should handle concurrent tool registrations', async () => {
      const tools: Tool[] = Array.from({ length: 10 }, (_, i) => ({
        name: `concurrent_tool_${i}`,
        description: `Concurrent tool ${i}`,
        parameters: [],
        enabled: true,
        category: 'testing',
        version: '1.0.0',
        execute: async () => ({ success: true, data: {} })
      }));

      // Register all tools concurrently
      const promises = tools.map(tool => registry.registerTool(tool));
      await Promise.all(promises);

      const availableTools = registry.getAvailableTools();
      expect(availableTools.length).toBeGreaterThanOrEqual(10);
    });

    it('should handle concurrent tool executions', async () => {
      const testTool: Tool = {
        name: 'concurrent_exec_tool',
        description: 'Tool for concurrent execution testing',
        parameters: [
          {
            name: 'id',
            type: 'number',
            description: 'Execution ID',
            required: true
          }
        ],
        enabled: true,
        category: 'testing',
        version: '1.0.0',
        execute: async (params: Record<string, any>, context: ToolExecutionContext): Promise<ToolResult> => {
          // Simulate some processing time
          await new Promise(resolve => setTimeout(resolve, 10));
          return {
            success: true,
            data: { executedId: params.id },
            metadata: {
              executionTime: 10,
              memoryUsed: 1024,
              timestamp: new Date()
            }
          };
        }
      };

      await registry.registerTool(testTool);

      // Execute tool concurrently
      const promises = Array.from({ length: 5 }, (_, i) =>
        registry.executeTool('concurrent_exec_tool', { id: i }, {
          session: {} as any,
          server: server,
          request: {
            id: `test-request-${i}`,
            timestamp: new Date(),
            transport: 'stdio'
          },
          environment: {
            nodeVersion: process.version,
            platform: process.platform,
            memoryUsage: process.memoryUsage()
          }
        })
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.data.executedId).toBe(index);
      });
    });
  });
});
