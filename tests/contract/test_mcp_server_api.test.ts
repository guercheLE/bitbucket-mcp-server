import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('MCP Server API Contract Tests', () => {
  let server: any;
  let baseUrl: string;

  beforeAll(async () => {
    // This test should FAIL initially - no server implementation yet
    baseUrl = 'http://localhost:3000';
  });

  afterAll(async () => {
    if (server) {
      await server.close();
    }
  });

  describe('GET /tools', () => {
    it('should return list of available MCP tools', async () => {
      const response = await fetch(`${baseUrl}/tools`);
      
      expect(response.status).toBe(200);
      
      const data = await response.json() as any;
      expect(data).toHaveProperty('tools');
      expect(Array.isArray(data.tools)).toBe(true);
      
      // Validate tool structure
      if (data.tools.length > 0) {
        const tool = data.tools[0];
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(tool).toHaveProperty('serverType');
        expect(tool).toHaveProperty('category');
        expect(tool).toHaveProperty('operation');
        
        // Validate name pattern
        expect(tool.name).toMatch(/^mcp_bitbucket_[a-z_]+$/);
        
        // Validate serverType
        expect(tool.serverType).toEqual(
          expect.arrayContaining(['cloud', 'datacenter'])
        );
      }
    });
  });

  describe('POST /tools/{toolName}/call', () => {
    it('should execute MCP tool with valid arguments', async () => {
      const toolName = 'mcp_bitbucket_auth_get_current_user';
      const arguments_ = {
        serverUrl: 'https://bitbucket.org',
        authType: 'oauth',
        accessToken: 'test-token'
      };

      const response = await fetch(`${baseUrl}/tools/${toolName}/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ arguments: arguments_ }),
      });

      expect(response.status).toBe(200);
      
      const data = await response.json() as any;
      expect(data).toHaveProperty('content');
      expect(Array.isArray(data.content)).toBe(true);
      
      if (data.content.length > 0) {
        expect(data.content[0]).toHaveProperty('type');
        expect(data.content[0]).toHaveProperty('text');
      }
    });

    it('should return 400 for invalid arguments', async () => {
      const toolName = 'mcp_bitbucket_auth_get_current_user';
      const invalidArguments = {
        invalidField: 'invalid'
      };

      const response = await fetch(`${baseUrl}/tools/${toolName}/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ arguments: invalidArguments }),
      });

      expect(response.status).toBe(400);
      
      const data = await response.json() as any;
      expect(data).toHaveProperty('code');
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('timestamp');
    });

    it('should return 404 for non-existent tool', async () => {
      const toolName = 'non_existent_tool';
      const arguments_ = {};

      const response = await fetch(`${baseUrl}/tools/${toolName}/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ arguments: arguments_ }),
      });

      expect(response.status).toBe(404);
      
      const data = await response.json() as any;
      expect(data).toHaveProperty('code');
      expect(data).toHaveProperty('message');
    });
  });

  describe('GET /server/info', () => {
    it('should return server information', async () => {
      const response = await fetch(`${baseUrl}/server/info`);
      
      expect(response.status).toBe(200);
      
      const data = await response.json() as any;
      expect(data).toHaveProperty('name');
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('serverType');
      expect(data).toHaveProperty('baseUrl');
      expect(data).toHaveProperty('toolsLoaded');
      expect(data).toHaveProperty('uptime');
      
      // Validate serverType
      expect(['cloud', 'datacenter']).toContain(data.serverType);
      
      // Validate types
      expect(typeof data.toolsLoaded).toBe('number');
      expect(typeof data.uptime).toBe('number');
    });
  });

  describe('GET /server/config', () => {
    it('should return server configuration', async () => {
      const response = await fetch(`${baseUrl}/server/config`);
      
      expect(response.status).toBe(200);
      
      const data = await response.json() as any;
      expect(data).toHaveProperty('baseUrl');
      expect(data).toHaveProperty('serverType');
      expect(data).toHaveProperty('auth');
      expect(data).toHaveProperty('timeouts');
      expect(data).toHaveProperty('rateLimit');
      
      // Validate auth structure
      expect(data.auth).toHaveProperty('type');
      expect(data.auth).toHaveProperty('credentials');
      
      // Validate timeouts structure
      expect(data.timeouts).toHaveProperty('read');
      expect(data.timeouts).toHaveProperty('write');
      expect(data.timeouts).toHaveProperty('connect');
      
      // Validate rateLimit structure
      expect(data.rateLimit).toHaveProperty('requestsPerMinute');
      expect(data.rateLimit).toHaveProperty('burstLimit');
      expect(data.rateLimit).toHaveProperty('retryAfter');
    });
  });
});
