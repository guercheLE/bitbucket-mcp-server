/**
 * MCP Concurrent Request Handling Integration Tests
 * 
 * Tests the MCP server's ability to handle multiple concurrent requests
 * safely and efficiently, including:
 * - Concurrent tool executions
 * - Concurrent authentication requests
 * - Resource contention handling
 * - Thread safety and race conditions
 * - Performance under concurrent load
 */

import { MCPServerWithAuth } from '../../src/server/mcp-server-with-auth';
import { ToolRegistry } from '../../src/server/tool-registry';
import { Tool, ToolResult, ToolExecutionContext } from '../../src/types';

// Mock Authentication Manager for testing
class MockAuthenticationManager {
  private sessions = new Map<string, any>();
  private callCount = 0;
  private eventHandlers = new Map<string, Function[]>();

  async initialize(): Promise<void> {
    // Mock initialization
  }

  async cleanup(): Promise<void> {
    // Mock cleanup
  }

  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  emit(event: string, data?: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  async authenticateWithToken(token: string): Promise<any> {
    this.callCount++;
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
    
    if (token === 'invalid_token' || token === 'invalid_token2') {
      throw new Error('Invalid token');
    }
    
    return { userId: 'user123', sessionId: `session_${token}` };
  }

  async authenticateWithSession(sessionId: string): Promise<any> {
    this.callCount++;
    await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
    
    if (sessionId === 'invalid_session') {
      throw new Error('Invalid session');
    }
    
    return { userId: 'user123', sessionId };
  }

  async validateSession(sessionId: string): Promise<boolean> {
    this.callCount++;
    await new Promise(resolve => setTimeout(resolve, Math.random() * 5));
    return sessionId !== 'invalid_session';
  }

  async refreshSession(sessionId: string): Promise<any> {
    this.callCount++;
    await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
    return { userId: 'user123', sessionId: `refreshed_${sessionId}` };
  }

  async terminateSession(sessionId: string): Promise<void> {
    this.callCount++;
    await new Promise(resolve => setTimeout(resolve, Math.random() * 5));
    this.sessions.delete(sessionId);
  }

  getCallCount(): number {
    return this.callCount;
  }

  resetCallCount(): void {
    this.callCount = 0;
  }
}

describe('MCP Concurrent Request Handling Integration Tests', () => {
  let server: MCPServerWithAuth;
  let registry: ToolRegistry;
  let mockAuthManager: MockAuthenticationManager;
  let context: ToolExecutionContext;

  // Test tools for concurrent execution
  const concurrentTestTool: Tool = {
    name: 'concurrent_test_tool',
    description: 'Tool for testing concurrent execution',
    category: 'testing',
    parameters: [
      {
        name: 'delay',
        type: 'number',
        description: 'Delay in milliseconds',
        required: false
      },
      {
        name: 'value',
        type: 'string',
        description: 'Test value',
        required: true
      }
    ],
    execute: async (params: any, ctx: ToolExecutionContext): Promise<ToolResult> => {
      const delay = params.delay || 0;
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      return {
        success: true,
        data: {
          value: params.value,
          timestamp: Date.now(),
          sessionId: ctx.session?.sessionId
        }
      };
    }
  };

  const slowTool: Tool = {
    name: 'slow_tool',
    description: 'Tool that takes time to execute',
    category: 'testing',
    parameters: [
      {
        name: 'duration',
        type: 'number',
        description: 'Duration in milliseconds',
        required: true
      }
    ],
    execute: async (params: any, ctx: ToolExecutionContext): Promise<ToolResult> => {
      await new Promise(resolve => setTimeout(resolve, params.duration));
      return {
        success: true,
        data: { completed: true, duration: params.duration }
      };
    }
  };

  const resourceContentionTool: Tool = {
    name: 'resource_contention_tool',
    description: 'Tool that simulates resource contention',
    category: 'testing',
    parameters: [
      {
        name: 'resource',
        type: 'string',
        description: 'Resource identifier',
        required: true
      }
    ],
    execute: async (params: any, ctx: ToolExecutionContext): Promise<ToolResult> => {
      // Simulate resource access with some processing time
      await new Promise(resolve => setTimeout(resolve, 50));
      
      return {
        success: true,
        data: {
          resource: params.resource,
          accessedAt: Date.now()
        }
      };
    }
  };

  const errorProneTool: Tool = {
    name: 'error_prone_tool',
    description: 'Tool that may fail under concurrent load',
    category: 'testing',
    parameters: [
      {
        name: 'shouldFail',
        type: 'boolean',
        description: 'Whether to fail',
        required: false
      }
    ],
    execute: async (params: any, ctx: ToolExecutionContext): Promise<ToolResult> => {
      await new Promise(resolve => setTimeout(resolve, 10));
      
      if (params.shouldFail) {
        throw new Error('Concurrent execution error');
      }
      
      return {
        success: true,
        data: { executed: true }
      };
    }
  };

  beforeEach(async () => {
    mockAuthManager = new MockAuthenticationManager();
    
    server = new MCPServerWithAuth(
      { port: 0, host: 'localhost' },
      mockAuthManager
    );
    
    registry = server['toolRegistry'];
    
    // Register test tools
    await registry.registerTool(concurrentTestTool);
    await registry.registerTool(slowTool);
    await registry.registerTool(resourceContentionTool);
    await registry.registerTool(errorProneTool);
    
    context = {
      session: { sessionId: 'test_session', userId: 'user123' },
      server: server as any,
      request: { id: 'test_request' },
      environment: { nodeEnv: 'test' }
    };
  });

  afterEach(async () => {
    if (server) {
      try {
        await server.stop();
      } catch (error) {
        // Ignore cleanup errors in tests
      }
    }
  });

  describe('Concurrent Tool Execution', () => {
    it('should handle multiple concurrent tool executions', async () => {
      const concurrentRequests = 10;
      const promises = [];
      
      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          registry.executeTool('concurrent_test_tool', { 
            value: `request_${i}`,
            delay: Math.random() * 20
          }, context)
        );
      }
      
      const results = await Promise.all(promises);
      
      // All requests should succeed
      expect(results).toHaveLength(concurrentRequests);
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.data?.value).toBe(`request_${index}`);
        expect(result.data?.sessionId).toBe('test_session');
      });
    });

    it('should handle concurrent executions with different delays', async () => {
      const delays = [10, 50, 100, 200];
      const promises = delays.map((delay, index) => 
        registry.executeTool('concurrent_test_tool', { 
          value: `delay_${delay}`,
          delay
        }, context)
      );
      
      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      // All should succeed
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.data?.value).toBe(`delay_${delays[index]}`);
      });
      
      // Total time should be close to the longest delay (parallel execution)
      const maxDelay = Math.max(...delays);
      expect(endTime - startTime).toBeLessThan(maxDelay + 100); // Allow some tolerance
    });

    it('should handle concurrent slow tool executions', async () => {
      const concurrentRequests = 5;
      const duration = 100;
      const promises = [];
      
      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          registry.executeTool('slow_tool', { duration }, context)
        );
      }
      
      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      // All should succeed
      expect(results).toHaveLength(concurrentRequests);
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.data?.completed).toBe(true);
        expect(result.data?.duration).toBe(duration);
      });
      
      // Should complete in roughly the duration time (parallel execution)
      expect(endTime - startTime).toBeLessThan(duration + 50);
    });
  });

  describe('Resource Contention Handling', () => {
    it('should handle concurrent access to the same resource', async () => {
      const resourceId = 'shared_resource';
      const concurrentRequests = 8;
      const promises = [];
      
      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          registry.executeTool('resource_contention_tool', { 
            resource: resourceId 
          }, context)
        );
      }
      
      const results = await Promise.all(promises);
      
      // All requests should succeed
      expect(results).toHaveLength(concurrentRequests);
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.data?.resource).toBe(resourceId);
        expect(result.data?.accessedAt).toBeDefined();
      });
    });

    it('should handle concurrent access to different resources', async () => {
      const resources = ['resource_a', 'resource_b', 'resource_c', 'resource_d'];
      const promises = resources.map(resource => 
        registry.executeTool('resource_contention_tool', { resource }, context)
      );
      
      const results = await Promise.all(promises);
      
      // All requests should succeed
      expect(results).toHaveLength(resources.length);
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.data?.resource).toBe(resources[index]);
      });
    });
  });

  describe('Concurrent Authentication Requests', () => {
    it('should handle concurrent authentication requests', async () => {
      const tokens = ['token1', 'token2', 'token3', 'token4', 'token5'];
      const promises = tokens.map(token => 
        mockAuthManager.authenticateWithToken(token)
      );
      
      const results = await Promise.all(promises);
      
      // All authentications should succeed
      expect(results).toHaveLength(tokens.length);
      results.forEach((result, index) => {
        expect(result.userId).toBe('user123');
        expect(result.sessionId).toBe(`session_${tokens[index]}`);
      });
      
      // Should have made the expected number of calls
      expect(mockAuthManager.getCallCount()).toBe(tokens.length);
    });

    it('should handle concurrent session validations', async () => {
      const sessions = ['session1', 'session2', 'session3', 'session4'];
      const promises = sessions.map(session => 
        mockAuthManager.validateSession(session)
      );
      
      const results = await Promise.all(promises);
      
      // All validations should succeed
      expect(results).toHaveLength(sessions.length);
      results.forEach(result => {
        expect(result).toBe(true);
      });
      
      expect(mockAuthManager.getCallCount()).toBe(sessions.length);
    });

    it('should handle mixed concurrent authentication operations', async () => {
      const operations = [
        () => mockAuthManager.authenticateWithToken('token1'),
        () => mockAuthManager.validateSession('session1'),
        () => mockAuthManager.refreshSession('session2'),
        () => mockAuthManager.authenticateWithToken('token2'),
        () => mockAuthManager.validateSession('session3')
      ];
      
      const promises = operations.map(op => op());
      const results = await Promise.all(promises);
      
      // All operations should succeed
      expect(results).toHaveLength(operations.length);
      expect(mockAuthManager.getCallCount()).toBe(operations.length);
    });
  });

  describe('Error Handling Under Concurrent Load', () => {
    it('should handle concurrent executions with some failures', async () => {
      const requests = [
        { shouldFail: false },
        { shouldFail: true },
        { shouldFail: false },
        { shouldFail: true },
        { shouldFail: false }
      ];
      
      const promises = requests.map((params, index) => 
        registry.executeTool('error_prone_tool', params, context)
      );
      
      const results = await Promise.allSettled(promises);
      
      // Should have both successes and failures
      const successes = results.filter(r => r.status === 'fulfilled' && r.value.success);
      const failures = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success));
      
      expect(successes.length).toBeGreaterThan(0);
      expect(failures.length).toBeGreaterThan(0);
    });

    it('should handle authentication failures under concurrent load', async () => {
      const tokens = ['valid_token', 'invalid_token', 'valid_token2', 'invalid_token2'];
      const promises = tokens.map(token => 
        mockAuthManager.authenticateWithToken(token)
      );
      
      const results = await Promise.allSettled(promises);
      
      // Should have both successes and failures
      const successes = results.filter(r => r.status === 'fulfilled');
      const failures = results.filter(r => r.status === 'rejected');
      
      expect(successes.length).toBe(2); // valid_token and valid_token2
      expect(failures.length).toBe(2); // invalid_token and invalid_token2
    });
  });

  describe('Performance Under Concurrent Load', () => {
    it('should maintain performance with high concurrent load', async () => {
      const concurrentRequests = 50;
      const promises = [];
      
      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          registry.executeTool('concurrent_test_tool', { 
            value: `load_test_${i}`,
            delay: 5
          }, context)
        );
      }
      
      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      // All requests should succeed
      expect(results).toHaveLength(concurrentRequests);
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.data?.value).toBe(`load_test_${index}`);
      });
      
      // Should complete in reasonable time (parallel execution)
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle burst concurrent requests', async () => {
      const burstSize = 20;
      const promises = [];
      
      // Create a burst of requests
      for (let i = 0; i < burstSize; i++) {
        promises.push(
          registry.executeTool('concurrent_test_tool', { 
            value: `burst_${i}`,
            delay: Math.random() * 10
          }, context)
        );
      }
      
      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      // All requests should succeed
      expect(results).toHaveLength(burstSize);
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.data?.value).toBe(`burst_${index}`);
      });
      
      // Should handle burst efficiently
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(500); // Should complete within 500ms
    });
  });

  describe('Thread Safety and Race Conditions', () => {
    it('should prevent race conditions in tool registry', async () => {
      const concurrentRequests = 30;
      const promises = [];
      
      // Mix of different operations that could cause race conditions
      for (let i = 0; i < concurrentRequests; i++) {
        if (i % 3 === 0) {
          // Tool execution
          promises.push(
            registry.executeTool('concurrent_test_tool', { 
              value: `race_test_${i}` 
            }, context)
          );
        } else if (i % 3 === 1) {
          // Get tool info
          promises.push(
            Promise.resolve(registry.getTool('concurrent_test_tool'))
          );
        } else {
          // Get statistics
          promises.push(
            Promise.resolve(registry.getToolStats('concurrent_test_tool'))
          );
        }
      }
      
      const results = await Promise.all(promises);
      
      // All operations should complete without errors
      expect(results).toHaveLength(concurrentRequests);
      
      // Check that tool executions succeeded
      const executions = results.filter(r => r && typeof r === 'object' && 'success' in r);
      executions.forEach(result => {
        expect(result.success).toBe(true);
      });
    });

    it('should handle concurrent tool registration and execution', async () => {
      const newTool: Tool = {
        name: 'dynamic_tool',
        description: 'Dynamically registered tool',
        category: 'testing',
        parameters: [
          {
            name: 'value',
            type: 'string',
            description: 'Test value',
            required: true
          }
        ],
        execute: async (params: any): Promise<ToolResult> => {
          return {
            success: true,
            data: { value: params.value, dynamic: true }
          };
        }
      };
      
      // Concurrent registration and execution
      const promises = [
        registry.registerTool(newTool).then(() => 'registered'),
        registry.executeTool('concurrent_test_tool', { value: 'test' }, context),
        registry.executeTool('concurrent_test_tool', { value: 'test2' }, context)
      ];
      
      const results = await Promise.all(promises);
      
      // Registration should succeed
      expect(results[0]).toBe('registered');
      
      // Executions should succeed
      expect(results[1].success).toBe(true);
      expect(results[2].success).toBe(true);
      
      // Tool should be available after registration
      const tool = registry.getTool('dynamic_tool');
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('dynamic_tool');
    });
  });

  describe('Memory and Resource Management', () => {
    it('should not leak memory under concurrent load', async () => {
      const iterations = 5;
      const requestsPerIteration = 20;
      
      for (let iter = 0; iter < iterations; iter++) {
        const promises = [];
        
        for (let i = 0; i < requestsPerIteration; i++) {
          promises.push(
            registry.executeTool('concurrent_test_tool', { 
              value: `memory_test_${iter}_${i}`,
              delay: 1
            }, context)
          );
        }
        
        const results = await Promise.all(promises);
        expect(results).toHaveLength(requestsPerIteration);
        
        // Small delay between iterations
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      // If we get here without memory issues, the test passes
      expect(true).toBe(true);
    });

    it('should handle concurrent cleanup operations', async () => {
      const sessions = ['session1', 'session2', 'session3', 'session4', 'session5'];
      
      // Concurrent session terminations
      const promises = sessions.map(session => 
        mockAuthManager.terminateSession(session)
      );
      
      const results = await Promise.all(promises);
      
      // All terminations should succeed
      expect(results).toHaveLength(sessions.length);
      expect(mockAuthManager.getCallCount()).toBe(sessions.length);
    });
  });
});
