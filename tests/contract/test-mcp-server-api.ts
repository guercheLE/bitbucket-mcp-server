import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { BitbucketMCPServer } from '../../src/server/mcp-server';
import { MCPTool } from '../../src/types/mcp';

describe('MCP Server API Contract Tests', () => {
  let server: BitbucketMCPServer;

  beforeEach(() => {
    server = new BitbucketMCPServer();
  });

  afterEach(() => {
    // Cleanup if needed
  });

  describe('Tool Registration', () => {
    it('should register tools correctly', () => {
      const toolCount = server.getToolCount();
      expect(toolCount).toBeGreaterThan(0);
    });

    it('should have tools for both cloud and datacenter', () => {
      const tools = server.getTools();
      const cloudTools = tools.filter(tool => tool.serverType.includes('cloud'));
      const datacenterTools = tools.filter(tool => tool.serverType.includes('datacenter'));

      expect(cloudTools.length).toBeGreaterThan(0);
      expect(datacenterTools.length).toBeGreaterThan(0);
    });

    it('should categorize tools correctly', () => {
      const tools = server.getTools();
      const authTools = server.getToolsByCategory('auth');
      const repoTools = server.getToolsByCategory('repository');

      expect(authTools.length).toBeGreaterThan(0);
      expect(repoTools.length).toBeGreaterThan(0);
    });
  });

  describe('Tool Structure', () => {
    it('should have valid tool structure', () => {
      const tools = server.getTools();
      
      tools.forEach(tool => {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.inputSchema).toBeDefined();
        expect(tool.handler).toBeDefined();
        expect(tool.serverType).toBeDefined();
        expect(tool.category).toBeDefined();
        expect(tool.operation).toBeDefined();
      });
    });

    it('should have proper input schemas', () => {
      const tools = server.getTools();
      
      tools.forEach(tool => {
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema.properties).toBeDefined();
      });
    });
  });

  describe('Server Lifecycle', () => {
    it('should start without errors', async () => {
      await expect(server.start()).resolves.not.toThrow();
    });

    it('should stop without errors', async () => {
      await expect(server.stop()).resolves.not.toThrow();
    });
  });

  describe('Tool Operations', () => {
    it('should support authentication operations', () => {
      const authTools = server.getToolsByOperation('authenticate');
      expect(authTools.length).toBeGreaterThan(0);
    });

    it('should support repository operations', () => {
      const repoTools = server.getToolsByOperation('list');
      expect(repoTools.length).toBeGreaterThan(0);
    });

    it('should support pull request operations', () => {
      const prTools = server.getToolsByOperation('create');
      expect(prTools.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid tool names gracefully', async () => {
      // This test will be implemented when we have the actual server running
      expect(true).toBe(true); // Placeholder
    });

    it('should validate input parameters', async () => {
      // This test will be implemented when we have the actual server running
      expect(true).toBe(true); // Placeholder
    });
  });
});
