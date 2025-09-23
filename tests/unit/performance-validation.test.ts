/**
 * Performance Validation Tests
 * 
 * This module implements comprehensive performance validation tests for the MCP server
 * to ensure compliance with constitutional requirements:
 * - Response times < 2 seconds
 * - Memory usage < 1GB
 * - Concurrent client handling
 * - Tool execution performance
 * 
 * Constitutional Requirements:
 * - <2s response times for all operations
 * - <1GB memory usage limit
 * - Efficient session management
 * - Scalable tool execution
 */

import { MCPServer } from '../../src/server/mcp-server.js';
import { ServerConfig, Tool, Transport, TransportType, ToolResult, ToolExecutionContext } from '../../src/types/index.js';
import { EventEmitter } from 'events';

// Mock Transport for testing
class MockTransport extends EventEmitter implements Transport {
  readonly type: TransportType = 'stdio';
  readonly config = { type: 'stdio' as TransportType };
  readonly isConnected = true;
  private _stats = {
    messagesSent: 0,
    messagesReceived: 0,
    bytesSent: 0,
    bytesReceived: 0,
    averageResponseTime: 0,
    uptime: 0,
    lastActivity: new Date()
  };

  async connect(): Promise<void> {
    this._stats.uptime = Date.now();
  }

  async disconnect(): Promise<void> {
    // Mock disconnect
  }

  async send(message: any): Promise<void> {
    this._stats.messagesSent++;
    this._stats.bytesSent += JSON.stringify(message).length;
  }

  async receive(): Promise<any> {
    this._stats.messagesReceived++;
    return { jsonrpc: '2.0', id: 1, result: {} };
  }

  isHealthy(): boolean {
    return true;
  }

  getStats() {
    return this._stats;
  }
}

// Mock Tool for testing
const createMockTool = (name: string, executionTime: number = 100): Tool => ({
  name,
  description: `Mock tool ${name}`,
  parameters: [],
  enabled: true,
  execute: async (params: Record<string, any>, context: ToolExecutionContext): Promise<ToolResult> => {
    // Simulate execution time
    await new Promise(resolve => setTimeout(resolve, executionTime));
    
    return {
      success: true,
      data: { result: `Tool ${name} executed successfully` },
      metadata: {
        executionTime,
        memoryUsed: process.memoryUsage().heapUsed,
        timestamp: new Date()
      }
    };
  }
});

describe('Performance Validation Tests', () => {
  let server: MCPServer;
  let config: ServerConfig;

  beforeEach(() => {
    config = {
      name: 'test-server',
      version: '1.0.0',
      description: 'Test MCP Server',
      maxClients: 100,
      clientTimeout: 30000,
      memoryLimit: 1024 * 1024 * 1024, // 1GB
      logging: {
        level: 'error',
        console: false
      },
      transports: [
        { type: 'stdio' }
      ],
      tools: {
        autoRegister: false,
        selectiveLoading: true,
        validationEnabled: true
      }
    };

    server = new MCPServer(config);
  });

  afterEach(async () => {
    if (server.isRunning) {
      await server.stop();
    }
  });

  describe('Memory Usage Validation', () => {
    it('should maintain memory usage under 1GB limit', async () => {
      await server.start();

      // Get initial memory usage
      const initialMemory = process.memoryUsage().heapUsed;
      const initialMemoryMB = initialMemory / 1024 / 1024;

      // Register multiple tools to simulate real usage
      const tools = Array.from({ length: 50 }, (_, i) => 
        createMockTool(`test_tool_${i}`, 50)
      );

      for (const tool of tools) {
        await server.registerTool(tool);
      }

      // Create multiple client sessions
      const sessions = [];
      for (let i = 0; i < 10; i++) {
        const transport = new MockTransport();
        const session = await server.createSession(`client_${i}`, transport);
        sessions.push(session);
      }

      // Execute tools to generate memory pressure
      for (let i = 0; i < 100; i++) {
        const toolName = `test_tool_${i % 50}`;
        const sessionId = sessions[i % 10].id;
        await server.executeTool(toolName, {}, sessionId);
      }

      // Check final memory usage
      const finalMemory = process.memoryUsage().heapUsed;
      const finalMemoryMB = finalMemory / 1024 / 1024;
      const memoryIncrease = finalMemoryMB - initialMemoryMB;

      console.log(`Initial memory: ${initialMemoryMB.toFixed(2)}MB`);
      console.log(`Final memory: ${finalMemoryMB.toFixed(2)}MB`);
      console.log(`Memory increase: ${memoryIncrease.toFixed(2)}MB`);

      // Validate memory usage is under 1GB
      expect(finalMemory).toBeLessThan(config.memoryLimit);
      expect(finalMemoryMB).toBeLessThan(1024); // 1GB in MB

      // Validate memory increase is reasonable (less than 100MB for this test)
      expect(memoryIncrease).toBeLessThan(100);
    });

    it('should handle memory pressure gracefully', async () => {
      await server.start();

      // Create a tool that uses more memory
      const memoryIntensiveTool = createMockTool('memory_intensive', 200);
      await server.registerTool(memoryIntensiveTool);

      const transport = new MockTransport();
      const session = await server.createSession('memory_test_client', transport);

      // Execute memory-intensive operations
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          server.executeTool('memory_intensive', { 
            data: new Array(1000).fill(`test_data_${i}`) 
          }, session.id)
        );
      }

      const results = await Promise.all(promises);

      // All operations should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Memory usage should still be under limit
      const memoryUsage = process.memoryUsage().heapUsed;
      expect(memoryUsage).toBeLessThan(config.memoryLimit);
    });
  });

  describe('Response Time Validation', () => {
    it('should respond to tool execution within 2 seconds', async () => {
      await server.start();

      // Register a tool with known execution time
      const fastTool = createMockTool('fast_tool', 100);
      const slowTool = createMockTool('slow_tool', 1500); // 1.5 seconds

      await server.registerTool(fastTool);
      await server.registerTool(slowTool);

      const transport = new MockTransport();
      const session = await server.createSession('response_test_client', transport);

      // Test fast tool
      const fastStart = Date.now();
      const fastResult = await server.executeTool('fast_tool', {}, session.id);
      const fastTime = Date.now() - fastStart;

      expect(fastResult.success).toBe(true);
      expect(fastTime).toBeLessThan(2000); // Should be well under 2 seconds
      expect(fastTime).toBeLessThan(500); // Should be under 500ms for fast tool

      // Test slow tool (but still under 2 seconds)
      const slowStart = Date.now();
      const slowResult = await server.executeTool('slow_tool', {}, session.id);
      const slowTime = Date.now() - slowStart;

      expect(slowResult.success).toBe(true);
      expect(slowTime).toBeLessThan(2000); // Must be under 2 seconds
      expect(slowTime).toBeGreaterThan(1000); // Should be around 1.5 seconds
    });

    it('should handle concurrent requests efficiently', async () => {
      await server.start();

      // Register multiple tools
      const tools = Array.from({ length: 10 }, (_, i) => 
        createMockTool(`concurrent_tool_${i}`, 100)
      );

      for (const tool of tools) {
        await server.registerTool(tool);
      }

      const transport = new MockTransport();
      const session = await server.createSession('concurrent_test_client', transport);

      // Execute multiple tools concurrently
      const startTime = Date.now();
      const promises = Array.from({ length: 20 }, (_, i) => 
        server.executeTool(`concurrent_tool_${i % 10}`, {}, session.id)
      );

      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // All operations should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Total time should be reasonable (concurrent execution)
      expect(totalTime).toBeLessThan(2000); // Should be under 2 seconds total
      expect(totalTime).toBeLessThan(1000); // Should be much less due to concurrency

      console.log(`Concurrent execution time: ${totalTime}ms for 20 operations`);
    });

    it('should maintain performance under load', async () => {
      await server.start();

      // Register a tool
      const loadTool = createMockTool('load_tool', 50);
      await server.registerTool(loadTool);

      // Create multiple sessions
      const sessions = [];
      for (let i = 0; i < 5; i++) {
        const transport = new MockTransport();
        const session = await server.createSession(`load_client_${i}`, transport);
        sessions.push(session);
      }

      // Execute tools from multiple sessions
      const startTime = Date.now();
      const promises = [];

      for (let i = 0; i < 50; i++) {
        const sessionId = sessions[i % 5].id;
        promises.push(server.executeTool('load_tool', {}, sessionId));
      }

      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // All operations should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Performance should remain good under load
      expect(totalTime).toBeLessThan(2000); // Under 2 seconds for 50 operations
      
      const averageTime = totalTime / 50;
      expect(averageTime).toBeLessThan(100); // Average should be under 100ms

      console.log(`Load test: ${totalTime}ms for 50 operations (avg: ${averageTime.toFixed(2)}ms)`);
    });
  });

  describe('Server Statistics Validation', () => {
    it('should track performance metrics accurately', async () => {
      await server.start();

      const tool = createMockTool('stats_tool', 100);
      await server.registerTool(tool);

      const transport = new MockTransport();
      const session = await server.createSession('stats_client', transport);

      // Execute some tools
      for (let i = 0; i < 5; i++) {
        await server.executeTool('stats_tool', {}, session.id);
      }

      const stats = server.stats;

      // Validate statistics
      expect(stats.totalRequests).toBe(5);
      expect(stats.totalToolsExecuted).toBe(5);
      expect(stats.activeSessions).toBe(1);
      expect(stats.averageResponseTime).toBeGreaterThan(0);
      expect(stats.averageResponseTime).toBeLessThan(2000); // Under 2 seconds
      expect(stats.memoryUsage).toBeLessThan(config.memoryLimit);
      expect(stats.errorRate).toBe(0); // No errors in this test

      console.log('Server Statistics:', {
        totalRequests: stats.totalRequests,
        totalToolsExecuted: stats.totalToolsExecuted,
        averageResponseTime: stats.averageResponseTime,
        memoryUsage: `${(stats.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
        errorRate: stats.errorRate
      });
    });

    it('should maintain health status under performance requirements', async () => {
      await server.start();

      const healthStatus = server.getHealthStatus();

      // Should be healthy initially
      expect(healthStatus.status).toBe('healthy');
      expect(healthStatus.components.server).toBe(true);
      expect(healthStatus.components.memory).toBe(true);
      expect(healthStatus.components.sessions).toBe(true);
      expect(healthStatus.metrics.memoryUsage).toBeLessThan(config.memoryLimit);

      // Add some load
      const tool = createMockTool('health_tool', 50);
      await server.registerTool(tool);

      const transport = new MockTransport();
      const session = await server.createSession('health_client', transport);

      // Execute tools to generate some load
      for (let i = 0; i < 10; i++) {
        await server.executeTool('health_tool', {}, session.id);
      }

      const healthAfterLoad = server.getHealthStatus();

      // Should still be healthy after load
      expect(healthAfterLoad.status).toBe('healthy');
      expect(healthAfterLoad.metrics.memoryUsage).toBeLessThan(config.memoryLimit);
      expect(healthAfterLoad.issues).toHaveLength(0);
    });
  });

  describe('Constitutional Requirements Compliance', () => {
    it('should meet all constitutional performance requirements', async () => {
      await server.start();

      // Test comprehensive scenario
      const tools = Array.from({ length: 20 }, (_, i) => 
        createMockTool(`constitutional_tool_${i}`, 100)
      );

      for (const tool of tools) {
        await server.registerTool(tool);
      }

      // Create multiple sessions
      const sessions = [];
      for (let i = 0; i < 10; i++) {
        const transport = new MockTransport();
        const session = await server.createSession(`constitutional_client_${i}`, transport);
        sessions.push(session);
      }

      // Execute comprehensive test
      const startTime = Date.now();
      const promises = [];

      for (let i = 0; i < 100; i++) {
        const toolName = `constitutional_tool_${i % 20}`;
        const sessionId = sessions[i % 10].id;
        promises.push(server.executeTool(toolName, {}, sessionId));
      }

      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // All operations should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Constitutional requirement: <2s response times
      expect(totalTime).toBeLessThan(2000);

      // Constitutional requirement: <1GB memory usage
      const finalMemory = process.memoryUsage().heapUsed;
      expect(finalMemory).toBeLessThan(config.memoryLimit);

      // Performance should be efficient
      const averageTime = totalTime / 100;
      expect(averageTime).toBeLessThan(50); // Average under 50ms per operation

      const stats = server.stats;
      expect(stats.averageResponseTime).toBeLessThan(2000);
      expect(stats.memoryUsage).toBeLessThan(config.memoryLimit);

      console.log('Constitutional Requirements Validation:', {
        totalTime: `${totalTime}ms`,
        averageTime: `${averageTime.toFixed(2)}ms`,
        memoryUsage: `${(finalMemory / 1024 / 1024).toFixed(2)}MB`,
        totalRequests: stats.totalRequests,
        errorRate: stats.errorRate
      });

      // Final validation
      expect(totalTime).toBeLessThan(2000); // <2s requirement
      expect(finalMemory).toBeLessThan(1024 * 1024 * 1024); // <1GB requirement
    });
  });
});
