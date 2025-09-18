import { ToolRegistry } from '../../src/services/tool-registry';
import { ServerDetectionService } from '../../src/services/server-detection';

/**
 * Integration test for tool registration
 * T014: Integration test tool registration in tests/integration/test_tool_registration.ts
 * 
 * This test MUST fail before implementation (Constitution Article V - TDD)
 * Tests selective tool loading based on server type and version
 */

describe('Tool Registration Integration Tests', () => {
  let toolRegistry: ToolRegistry;
  let serverDetectionService: ServerDetectionService;

  beforeEach(() => {
    toolRegistry = new ToolRegistry();
    serverDetectionService = new ServerDetectionService();
  });

  describe('Data Center Tool Registration', () => {
    it('should register Data Center specific tools for Data Center 7.16+', async () => {
      const serverInfo = {
        serverType: 'datacenter' as const,
        version: '7.16.0',
        baseUrl: 'https://bitbucket.example.com',
        isSupported: true
      };

      const tools = await toolRegistry.registerTools(serverInfo);
      
      // Data Center specific tools should be registered
      expect(tools).toContainEqual(expect.objectContaining({
        name: 'mcp_bitbucket_project_create'
      }));
      expect(tools).toContainEqual(expect.objectContaining({
        name: 'mcp_bitbucket_project_get'
      }));
      expect(tools).toContainEqual(expect.objectContaining({
        name: 'mcp_bitbucket_repository_create'
      }));
      expect(tools).toContainEqual(expect.objectContaining({
        name: 'mcp_bitbucket_repository_get'
      }));

      // Cloud specific tools should NOT be registered
      expect(tools).not.toContainEqual(expect.objectContaining({
        name: 'mcp_bitbucket_workspace_create'
      }));
    });

    it('should register all 32 Data Center endpoints', async () => {
      const serverInfo = {
        serverType: 'datacenter' as const,
        version: '7.16.0',
        baseUrl: 'https://bitbucket.example.com',
        isSupported: true
      };

      const tools = await toolRegistry.registerTools(serverInfo);
      
      // Count Data Center tools
      const dataCenterTools = tools.filter(tool => 
        tool.name.includes('project') || 
        tool.name.includes('repository') ||
        tool.name.includes('permission') ||
        tool.name.includes('webhook') ||
        tool.name.includes('avatar')
      );

      expect(dataCenterTools).toHaveLength(32);
    });

    it('should register tools with correct schemas', async () => {
      const serverInfo = {
        serverType: 'datacenter' as const,
        version: '7.16.0',
        baseUrl: 'https://bitbucket.example.com',
        isSupported: true
      };

      const tools = await toolRegistry.registerTools(serverInfo);
      
      const projectCreateTool = tools.find(tool => tool.name === 'mcp_bitbucket_project_create');
      
      expect(projectCreateTool).toBeDefined();
      expect(projectCreateTool?.inputSchema).toBeDefined();
      expect(projectCreateTool?.inputSchema.properties).toHaveProperty('key');
      expect(projectCreateTool?.inputSchema.properties).toHaveProperty('name');
      expect(projectCreateTool?.inputSchema.required).toContain('key');
      expect(projectCreateTool?.inputSchema.required).toContain('name');
    });
  });

  describe('Cloud Tool Registration', () => {
    it('should register Cloud specific tools for Bitbucket Cloud', async () => {
      const serverInfo = {
        serverType: 'cloud',
        version: '2.0',
        baseUrl: 'https://bitbucket.org',
        isSupported: true
      };

      const tools = await toolRegistry.registerTools(serverInfo);
      
      // Cloud specific tools should be registered
      expect(tools).toContainEqual(expect.objectContaining({
        name: 'mcp_bitbucket_workspace_get'
      }));
      expect(tools).toContainEqual(expect.objectContaining({
        name: 'mcp_bitbucket_cloud_repository_create'
      }));

      // Data Center specific tools should NOT be registered
      expect(tools).not.toContainEqual(expect.objectContaining({
        name: 'mcp_bitbucket_project_create'
      }));
    });

    it('should register all 34 Cloud endpoints', async () => {
      const serverInfo = {
        serverType: 'cloud',
        version: '2.0',
        baseUrl: 'https://bitbucket.org',
        isSupported: true
      };

      const tools = await toolRegistry.registerTools(serverInfo);
      
      // Count Cloud tools
      const cloudTools = tools.filter(tool => 
        tool.name.includes('workspace') || 
        tool.name.includes('cloud_repository') ||
        tool.name.includes('permission') ||
        tool.name.includes('webhook') ||
        tool.name.includes('avatar')
      );

      expect(cloudTools).toHaveLength(34);
    });
  });

  describe('Shared Tool Registration', () => {
    it('should register shared tools for both server types', async () => {
      const dataCenterInfo = {
        serverType: 'datacenter' as const,
        version: '7.16.0',
        baseUrl: 'https://bitbucket.example.com',
        isSupported: true
      };

      const cloudInfo = {
        serverType: 'cloud',
        version: '2.0',
        baseUrl: 'https://bitbucket.org',
        isSupported: true
      };

      const dataCenterTools = await toolRegistry.registerTools(dataCenterInfo);
      const cloudTools = await toolRegistry.registerTools(cloudInfo);
      
      // Shared tools should be present in both
      const sharedToolNames = [
        'mcp_bitbucket_auth_get_current_session',
        'mcp_bitbucket_auth_create_session',
        'mcp_bitbucket_search_repositories',
        'mcp_bitbucket_search_commits'
      ];

      sharedToolNames.forEach(toolName => {
        expect(dataCenterTools).toContainEqual(expect.objectContaining({
          name: toolName
        }));
        expect(cloudTools).toContainEqual(expect.objectContaining({
          name: toolName
        }));
      });
    });
  });

  describe('Version-Specific Registration', () => {
    it('should register version-specific features for newer Data Center versions', async () => {
      const serverInfo = {
        serverType: 'datacenter' as const,
        version: '8.0.0',
        baseUrl: 'https://bitbucket.example.com',
        isSupported: true
      };

      const tools = await toolRegistry.registerTools(serverInfo);
      
      // Newer features should be available
      expect(tools).toContainEqual(expect.objectContaining({
        name: 'mcp_bitbucket_project_advanced_settings'
      }));
    });

    it('should gracefully degrade for older versions', async () => {
      const serverInfo = {
        serverType: 'datacenter' as const,
        version: '7.16.0',
        baseUrl: 'https://bitbucket.example.com',
        isSupported: true
      };

      const tools = await toolRegistry.registerTools(serverInfo);
      
      // Older features should be available
      expect(tools).toContainEqual(expect.objectContaining({
        name: 'mcp_bitbucket_project_create'
      }));
      
      // Newer features should not be available
      expect(tools).not.toContainEqual(expect.objectContaining({
        name: 'mcp_bitbucket_project_advanced_settings'
      }));
    });
  });

  describe('Error Handling', () => {
    it('should handle unsupported server types gracefully', async () => {
      const serverInfo = {
        serverType: 'unknown',
        version: '1.0.0',
        baseUrl: 'https://unknown-server.com',
        isSupported: false
      };

      const tools = await toolRegistry.registerTools(serverInfo);
      
      // Should fallback to Data Center tools
      expect(tools).toContainEqual(expect.objectContaining({
        name: 'mcp_bitbucket_project_create'
      }));
    });

    it('should handle tool registration failures', async () => {
      const serverInfo = {
        serverType: 'datacenter' as const,
        version: '7.16.0',
        baseUrl: 'https://bitbucket.example.com',
        isSupported: true
      };

      // Mock tool registration failure
      const tools = await toolRegistry.registerTools(serverInfo);
      
      // Should still register available tools
      expect(tools.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Requirements', () => {
    it('should register tools within 1 second', async () => {
      const serverInfo = {
        serverType: 'datacenter' as const,
        version: '7.16.0',
        baseUrl: 'https://bitbucket.example.com',
        isSupported: true
      };

      const startTime = Date.now();
      await toolRegistry.registerTools(serverInfo);
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(1000); // 1 second
    });

    it('should cache registered tools', async () => {
      const serverInfo = {
        serverType: 'datacenter' as const,
        version: '7.16.0',
        baseUrl: 'https://bitbucket.example.com',
        isSupported: true
      };

      // First registration
      const tools1 = await toolRegistry.registerTools(serverInfo);
      
      // Second registration should use cache
      const startTime = Date.now();
      const tools2 = await toolRegistry.registerTools(serverInfo);
      const endTime = Date.now();
      
      expect(tools1).toEqual(tools2);
      expect(endTime - startTime).toBeLessThan(100); // 100ms for cached
    });
  });

  describe('Tool Validation', () => {
    it('should validate all registered tools have required properties', async () => {
      const serverInfo = {
        serverType: 'datacenter' as const,
        version: '7.16.0',
        baseUrl: 'https://bitbucket.example.com',
        isSupported: true
      };

      const tools = await toolRegistry.registerTools(serverInfo);
      
      tools.forEach(tool => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(tool.name).toMatch(/^mcp_bitbucket_/);
        expect(tool.description).toBeTruthy();
        expect(tool.inputSchema).toBeDefined();
      });
    });

    it('should validate tool schemas are valid JSON Schema', async () => {
      const serverInfo = {
        serverType: 'datacenter' as const,
        version: '7.16.0',
        baseUrl: 'https://bitbucket.example.com',
        isSupported: true
      };

      const tools = await toolRegistry.registerTools(serverInfo);
      
      tools.forEach(tool => {
        expect(tool.inputSchema).toHaveProperty('type', 'object');
        expect(tool.inputSchema).toHaveProperty('properties');
        expect(tool.inputSchema).toHaveProperty('required');
        expect(Array.isArray(tool.inputSchema.required)).toBe(true);
      });
    });
  });
});
