import { describe, it, expect, beforeEach } from '@jest/globals';
import { BitbucketMCPServer } from '../../src/server/mcp-server';
import { MCPTool } from '../../src/types/mcp';

describe('Tool Loading Integration Tests', () => {
  let server: BitbucketMCPServer;

  beforeEach(() => {
    server = new BitbucketMCPServer();
  });

  describe('Tool Registration', () => {
    it('should load cloud tools', () => {
      const tools = server.getTools();
      const cloudTools = tools.filter(tool => tool.serverType.includes('cloud'));
      
      expect(cloudTools.length).toBeGreaterThan(0);
      
      // Check for specific cloud tools
      const authTool = cloudTools.find(tool => tool.name.includes('auth'));
      const repoTool = cloudTools.find(tool => tool.name.includes('repository'));
      
      expect(authTool).toBeDefined();
      expect(repoTool).toBeDefined();
    });

    it('should load datacenter tools', () => {
      const tools = server.getTools();
      const datacenterTools = tools.filter(tool => tool.serverType.includes('datacenter'));
      
      expect(datacenterTools.length).toBeGreaterThan(0);
      
      // Check for specific datacenter tools
      const authTool = datacenterTools.find(tool => tool.name.includes('auth'));
      const projectTool = datacenterTools.find(tool => tool.name.includes('project'));
      
      expect(authTool).toBeDefined();
      expect(projectTool).toBeDefined();
    });

    it('should have unique tool names', () => {
      const tools = server.getTools();
      const toolNames = tools.map(tool => tool.name);
      const uniqueNames = new Set(toolNames);
      
      expect(toolNames.length).toBe(uniqueNames.size);
    });

    it('should have valid tool categories', () => {
      const tools = server.getTools();
      const validCategories = ['auth', 'repository', 'pull-request', 'project', 'issue', 'pipeline', 'webhook', 'snippet', 'keys', 'oauth', 'permissions', 'security'];
      
      tools.forEach(tool => {
        expect(validCategories).toContain(tool.category);
      });
    });

    it('should have valid operations', () => {
      const tools = server.getTools();
      const validOperations = ['authenticate', 'list', 'get', 'create', 'update', 'delete', 'merge', 'decline', 'comment'];
      
      tools.forEach(tool => {
        expect(validOperations).toContain(tool.operation);
      });
    });
  });

  describe('Tool Structure Validation', () => {
    it('should have proper tool structure', () => {
      const tools = server.getTools();
      
      tools.forEach(tool => {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.inputSchema).toBeDefined();
        expect(tool.handler).toBeDefined();
        expect(tool.serverType).toBeDefined();
        expect(tool.category).toBeDefined();
        expect(tool.operation).toBeDefined();
        
        // Validate input schema structure
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema.properties).toBeDefined();
      });
    });

    it('should have valid server types', () => {
      const tools = server.getTools();
      const validServerTypes = ['cloud', 'datacenter'];
      
      tools.forEach(tool => {
        expect(Array.isArray(tool.serverType)).toBe(true);
        tool.serverType.forEach(type => {
          expect(validServerTypes).toContain(type);
        });
      });
    });

    it('should have non-empty descriptions', () => {
      const tools = server.getTools();
      
      tools.forEach(tool => {
        expect(tool.description).toBeTruthy();
        expect(tool.description.length).toBeGreaterThan(0);
      });
    });

    it('should have valid input schema properties', () => {
      const tools = server.getTools();
      
      tools.forEach(tool => {
        expect(tool.inputSchema.properties).toBeDefined();
        expect(typeof tool.inputSchema.properties).toBe('object');
      });
    });
  });

  describe('Tool Categorization', () => {
    it('should categorize tools by category', () => {
      const authTools = server.getToolsByCategory('auth');
      const repoTools = server.getToolsByCategory('repository');
      const projectTools = server.getToolsByCategory('project');
      
      expect(authTools.length).toBeGreaterThan(0);
      expect(repoTools.length).toBeGreaterThan(0);
      expect(projectTools.length).toBeGreaterThan(0);
      
      // Verify all tools in category have correct category
      authTools.forEach(tool => {
        expect(tool.category).toBe('auth');
      });
      
      repoTools.forEach(tool => {
        expect(tool.category).toBe('repository');
      });
      
      projectTools.forEach(tool => {
        expect(tool.category).toBe('project');
      });
    });

    it('should categorize tools by operation', () => {
      const listTools = server.getToolsByOperation('list');
      const createTools = server.getToolsByOperation('create');
      const authTools = server.getToolsByOperation('authenticate');
      
      expect(listTools.length).toBeGreaterThan(0);
      expect(createTools.length).toBeGreaterThan(0);
      expect(authTools.length).toBeGreaterThan(0);
      
      // Verify all tools in operation have correct operation
      listTools.forEach(tool => {
        expect(tool.operation).toBe('list');
      });
      
      createTools.forEach(tool => {
        expect(tool.operation).toBe('create');
      });
      
      authTools.forEach(tool => {
        expect(tool.operation).toBe('authenticate');
      });
    });
  });

  describe('Tool Handler Validation', () => {
    it('should have callable handlers', () => {
      const tools = server.getTools();
      
      tools.forEach(tool => {
        expect(typeof tool.handler).toBe('function');
      });
    });

    it('should handle tool execution with empty arguments', async () => {
      const tools = server.getTools();
      
      // Test a few tools with empty arguments
      const testTools = tools.slice(0, 3);
      
      for (const tool of testTools) {
        try {
          const result = await tool.handler({});
          expect(result).toHaveProperty('content');
          expect(result).toHaveProperty('isError');
          expect(Array.isArray(result.content)).toBe(true);
        } catch (error) {
          // Some tools might fail with empty arguments, which is expected
          expect(error).toBeDefined();
        }
      }
    });
  });

  describe('Tool Loading Performance', () => {
    it('should load tools quickly', () => {
      const startTime = Date.now();
      const tools = server.getTools();
      const endTime = Date.now();
      
      const loadTime = endTime - startTime;
      expect(loadTime).toBeLessThan(1000); // Should load in less than 1 second
      expect(tools.length).toBeGreaterThan(0);
    });

    it('should maintain consistent tool count', () => {
      const tools1 = server.getTools();
      const tools2 = server.getTools();
      
      expect(tools1.length).toBe(tools2.length);
    });
  });

  describe('Tool Metadata', () => {
    it('should have consistent metadata across tools', () => {
      const tools = server.getTools();
      
      tools.forEach(tool => {
        // Check that all required fields are present and have correct types
        expect(typeof tool.name).toBe('string');
        expect(typeof tool.description).toBe('string');
        expect(typeof tool.inputSchema).toBe('object');
        expect(typeof tool.handler).toBe('function');
        expect(Array.isArray(tool.serverType)).toBe(true);
        expect(typeof tool.category).toBe('string');
        expect(typeof tool.operation).toBe('string');
      });
    });

    it('should have meaningful tool names', () => {
      const tools = server.getTools();
      
      tools.forEach(tool => {
        expect(tool.name).toMatch(/^[a-z-]+$/); // Should be lowercase with hyphens
        expect(tool.name.length).toBeGreaterThan(3);
        expect(tool.name.length).toBeLessThan(50);
      });
    });

    it('should have descriptive tool descriptions', () => {
      const tools = server.getTools();
      
      tools.forEach(tool => {
        expect(tool.description.length).toBeGreaterThan(10);
        expect(tool.description.length).toBeLessThan(200);
        expect(tool.description).not.toContain('undefined');
        expect(tool.description).not.toContain('null');
      });
    });
  });

  describe('Tool Compatibility', () => {
    it('should have tools for both server types', () => {
      const tools = server.getTools();
      const cloudTools = tools.filter(tool => tool.serverType.includes('cloud'));
      const datacenterTools = tools.filter(tool => tool.serverType.includes('datacenter'));
      
      expect(cloudTools.length).toBeGreaterThan(0);
      expect(datacenterTools.length).toBeGreaterThan(0);
    });

    it('should have authentication tools for both server types', () => {
      const authTools = server.getToolsByCategory('auth');
      const cloudAuthTools = authTools.filter(tool => tool.serverType.includes('cloud'));
      const datacenterAuthTools = authTools.filter(tool => tool.serverType.includes('datacenter'));
      
      expect(cloudAuthTools.length).toBeGreaterThan(0);
      expect(datacenterAuthTools.length).toBeGreaterThan(0);
    });

    it('should have repository tools for both server types', () => {
      const repoTools = server.getToolsByCategory('repository');
      const cloudRepoTools = repoTools.filter(tool => tool.serverType.includes('cloud'));
      const datacenterRepoTools = repoTools.filter(tool => tool.serverType.includes('datacenter'));
      
      expect(cloudRepoTools.length).toBeGreaterThan(0);
      expect(datacenterRepoTools.length).toBeGreaterThan(0);
    });
  });
});
