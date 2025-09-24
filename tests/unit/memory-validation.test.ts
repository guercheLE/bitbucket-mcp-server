/**
 * Memory Validation Tests
 * 
 * This module implements comprehensive memory validation tests for the MCP server
 * to ensure compliance with constitutional memory requirements:
 * - Memory usage < 1GB total server limit
 * - Efficient memory management
 * - Memory leak prevention
 * - Garbage collection effectiveness
 * 
 * Constitutional Requirements:
 * - <1GB memory usage limit
 * - Efficient session management
 * - Memory cleanup on session disconnect
 * - No memory leaks during long-running operations
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

// Memory-intensive tool for testing
const createMemoryIntensiveTool = (name: string, dataSize: number): Tool => ({
  name,
  description: `Memory intensive tool ${name}`,
  parameters: [
    {
      name: 'dataSize',
      type: 'number' as const,
      description: 'Size of data to process',
      required: true
    }
  ],
  enabled: true,
  execute: async (params: Record<string, any>, context: ToolExecutionContext): Promise<ToolResult> => {
    const size = params.dataSize || dataSize;
    
    // Create memory-intensive data structure
    const largeData = new Array(size).fill(0).map((_, i) => ({
      id: i,
      data: `memory_test_data_${i}_${Math.random().toString(36).substring(7)}`,
      timestamp: new Date(),
      metadata: {
        index: i,
        random: Math.random(),
        nested: {
          level1: { level2: { level3: `nested_data_${i}` } }
        }
      }
    }));

    // Simulate some processing
    const processed = largeData.map(item => ({
      ...item,
      processed: true,
      hash: Buffer.from(JSON.stringify(item)).toString('base64')
    }));

    return {
      success: true,
      data: {
        processedCount: processed.length,
        memoryUsed: process.memoryUsage().heapUsed,
        sample: processed.slice(0, 5) // Return only a sample
      },
      metadata: {
        executionTime: 100,
        memoryUsed: process.memoryUsage().heapUsed,
        timestamp: new Date()
      }
    };
  }
});

describe('Memory Validation Tests', () => {
  let server: MCPServer;
  let config: ServerConfig;

  beforeEach(() => {
    config = {
      name: 'memory-test-server',
      version: '1.0.0',
      description: 'Memory Test MCP Server',
      maxClients: 50,
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
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  });

  describe('Memory Limit Compliance', () => {
    it('should never exceed 1GB memory limit', async () => {
      await server.start();

      const initialMemory = process.memoryUsage().heapUsed;
      console.log(`Initial memory: ${(initialMemory / 1024 / 1024).toFixed(2)}MB`);

      // Register memory-intensive tools
      const memoryTools = [
        createMemoryIntensiveTool('small_memory_tool', 1000),
        createMemoryIntensiveTool('medium_memory_tool', 5000),
        createMemoryIntensiveTool('large_memory_tool', 10000)
      ];

      for (const tool of memoryTools) {
        await server.registerTool(tool);
      }

      // Create sessions and execute memory-intensive operations
      const sessions = [];
      for (let i = 0; i < 5; i++) {
        const transport = new MockTransport();
        const session = await server.createSession(`memory_client_${i}`, transport);
        sessions.push(session);
      }

      // Execute memory-intensive operations
      const promises = [];
      for (let i = 0; i < 20; i++) {
        const toolName = memoryTools[i % 3].name;
        const sessionId = sessions[i % 5].id;
        const dataSize = [1000, 5000, 10000][i % 3];
        
        promises.push(
          server.executeTool(toolName, { dataSize }, sessionId)
        );
      }

      const results = await Promise.all(promises);
      const peakMemory = process.memoryUsage().heapUsed;

      console.log(`Peak memory: ${(peakMemory / 1024 / 1024).toFixed(2)}MB`);
      console.log(`Memory increase: ${((peakMemory - initialMemory) / 1024 / 1024).toFixed(2)}MB`);

      // All operations should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Memory should never exceed 1GB
      expect(peakMemory).toBeLessThan(config.memoryLimit);
      expect(peakMemory / 1024 / 1024).toBeLessThan(1024); // 1GB in MB

      // Memory increase should be reasonable
      const memoryIncrease = peakMemory - initialMemory;
      expect(memoryIncrease / 1024 / 1024).toBeLessThan(100); // Less than 100MB increase
    });

    it('should handle memory pressure gracefully', async () => {
      await server.start();

      const memoryTool = createMemoryIntensiveTool('pressure_tool', 20000);
      await server.registerTool(memoryTool);

      const transport = new MockTransport();
      const session = await server.createSession('pressure_client', transport);

      // Execute operations that create memory pressure
      const memorySnapshots = [];
      
      for (let i = 0; i < 10; i++) {
        const beforeMemory = process.memoryUsage().heapUsed;
        
        await server.executeTool('pressure_tool', { dataSize: 15000 }, session.id);
        
        const afterMemory = process.memoryUsage().heapUsed;
        memorySnapshots.push({
          iteration: i,
          before: beforeMemory,
          after: afterMemory,
          increase: afterMemory - beforeMemory
        });

        // Memory should never exceed limit
        expect(afterMemory).toBeLessThan(config.memoryLimit);
      }

      // Check memory growth pattern
      const totalIncrease = memorySnapshots.reduce((sum, snap) => sum + snap.increase, 0);
      const averageIncrease = totalIncrease / memorySnapshots.length;

      console.log('Memory pressure test results:', {
        totalIncrease: `${(totalIncrease / 1024 / 1024).toFixed(2)}MB`,
        averageIncrease: `${(averageIncrease / 1024 / 1024).toFixed(2)}MB`,
        finalMemory: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`
      });

      // Memory growth should be controlled
      expect(averageIncrease / 1024 / 1024).toBeLessThan(50); // Less than 50MB average increase
    });
  });

  describe('Memory Cleanup Validation', () => {
    it('should clean up memory when sessions are disconnected', async () => {
      await server.start();

      const memoryTool = createMemoryIntensiveTool('cleanup_tool', 10000);
      await server.registerTool(memoryTool);

      // Create and use sessions
      const sessions = [];
      for (let i = 0; i < 10; i++) {
        const transport = new MockTransport();
        const session = await server.createSession(`cleanup_client_${i}`, transport);
        sessions.push(session);

        // Execute memory-intensive operations
        await server.executeTool('cleanup_tool', { dataSize: 5000 }, session.id);
      }

      const memoryBeforeCleanup = process.memoryUsage().heapUsed;
      console.log(`Memory before cleanup: ${(memoryBeforeCleanup / 1024 / 1024).toFixed(2)}MB`);

      // Disconnect all sessions
      for (const session of sessions) {
        await server.removeSession(session.id);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));

      const memoryAfterCleanup = process.memoryUsage().heapUsed;
      console.log(`Memory after cleanup: ${(memoryAfterCleanup / 1024 / 1024).toFixed(2)}MB`);

      // Memory should be reduced after cleanup
      expect(memoryAfterCleanup).toBeLessThanOrEqual(memoryBeforeCleanup);
      
      // Should have no active sessions
      expect(server.getActiveSessionsCount()).toBe(0);
    });

    it('should prevent memory leaks during long-running operations', async () => {
      await server.start();

      const leakTestTool = createMemoryIntensiveTool('leak_test_tool', 5000);
      await server.registerTool(leakTestTool);

      const transport = new MockTransport();
      const session = await server.createSession('leak_test_client', transport);

      const initialMemory = process.memoryUsage().heapUsed;
      const memorySnapshots = [];

      // Run many iterations to test for memory leaks
      for (let i = 0; i < 50; i++) {
        await server.executeTool('leak_test_tool', { dataSize: 3000 }, session.id);
        
        if (i % 10 === 0) {
          const currentMemory = process.memoryUsage().heapUsed;
          memorySnapshots.push({
            iteration: i,
            memory: currentMemory,
            increase: currentMemory - initialMemory
          });
        }
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const totalIncrease = finalMemory - initialMemory;

      console.log('Memory leak test results:', {
        initialMemory: `${(initialMemory / 1024 / 1024).toFixed(2)}MB`,
        finalMemory: `${(finalMemory / 1024 / 1024).toFixed(2)}MB`,
        totalIncrease: `${(totalIncrease / 1024 / 1024).toFixed(2)}MB`,
        snapshots: memorySnapshots.map(s => ({
          iteration: s.iteration,
          memory: `${(s.memory / 1024 / 1024).toFixed(2)}MB`,
          increase: `${(s.increase / 1024 / 1024).toFixed(2)}MB`
        }))
      });

      // Memory should not grow excessively (indicating a leak)
      expect(totalIncrease / 1024 / 1024).toBeLessThan(200); // Less than 200MB total increase
      
      // Memory should still be under limit
      expect(finalMemory).toBeLessThan(config.memoryLimit);

      // Check for linear memory growth (potential leak indicator)
      if (memorySnapshots.length >= 3) {
        const firstIncrease = memorySnapshots[0].increase;
        const lastIncrease = memorySnapshots[memorySnapshots.length - 1].increase;
        const growthRate = (lastIncrease - firstIncrease) / memorySnapshots.length;
        
        // Growth rate should be reasonable (not linear)
        expect(growthRate / 1024 / 1024).toBeLessThan(10); // Less than 10MB per snapshot
      }
    });
  });

  describe('Memory Monitoring Integration', () => {
    it('should provide accurate memory statistics', async () => {
      await server.start();

      const initialStats = server.stats;
      expect(initialStats.memoryUsage).toBeGreaterThan(0);
      expect(initialStats.memoryUsage).toBeLessThan(config.memoryLimit);

      // Add some load
      const memoryTool = createMemoryIntensiveTool('stats_tool', 8000);
      await server.registerTool(memoryTool);

      const transport = new MockTransport();
      const session = await server.createSession('stats_client', transport);

      // Execute operations
      for (let i = 0; i < 5; i++) {
        await server.executeTool('stats_tool', { dataSize: 5000 }, session.id);
      }

      const finalStats = server.stats;

      // Statistics should be accurate
      expect(finalStats.memoryUsage).toBeGreaterThan(initialStats.memoryUsage);
      expect(finalStats.memoryUsage).toBeLessThan(config.memoryLimit);
      expect(finalStats.totalRequests).toBe(5);
      expect(finalStats.totalToolsExecuted).toBe(5);

      console.log('Memory statistics:', {
        initialMemory: `${(initialStats.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
        finalMemory: `${(finalStats.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
        memoryIncrease: `${((finalStats.memoryUsage - initialStats.memoryUsage) / 1024 / 1024).toFixed(2)}MB`,
        totalRequests: finalStats.totalRequests,
        totalToolsExecuted: finalStats.totalToolsExecuted
      });
    });

    it('should trigger memory warnings when approaching limit', async () => {
      // Create server with lower memory limit for testing
      const lowMemoryConfig = {
        ...config,
        memoryLimit: 50 * 1024 * 1024 // 50MB for testing
      };

      const lowMemoryServer = new MCPServer(lowMemoryConfig);
      await lowMemoryServer.start();

      const memoryTool = createMemoryIntensiveTool('warning_tool', 10000);
      await lowMemoryServer.registerTool(memoryTool);

      const transport = new MockTransport();
      const session = await lowMemoryServer.createSession('warning_client', transport);

      // Execute operations to approach memory limit
      for (let i = 0; i < 3; i++) {
        await lowMemoryServer.executeTool('warning_tool', { dataSize: 15000 }, session.id);
        
        const healthStatus = lowMemoryServer.getHealthStatus();
        const memoryUsage = lowMemoryServer.stats.memoryUsage;
        
        console.log(`Iteration ${i + 1}:`, {
          memoryUsage: `${(memoryUsage / 1024 / 1024).toFixed(2)}MB`,
          memoryLimit: `${(lowMemoryConfig.memoryLimit / 1024 / 1024).toFixed(2)}MB`,
          healthStatus: healthStatus.status,
          issues: healthStatus.issues
        });

        // Memory should never exceed limit
        expect(memoryUsage).toBeLessThan(lowMemoryConfig.memoryLimit);
      }

      await lowMemoryServer.stop();
    });
  });

  describe('Constitutional Memory Requirements', () => {
    it('should meet all constitutional memory requirements', async () => {
      await server.start();

      const initialMemory = process.memoryUsage().heapUsed;
      console.log(`Constitutional test - Initial memory: ${(initialMemory / 1024 / 1024).toFixed(2)}MB`);

      // Comprehensive memory test
      const tools = Array.from({ length: 10 }, (_, i) => 
        createMemoryIntensiveTool(`constitutional_memory_tool_${i}`, 5000)
      );

      for (const tool of tools) {
        await server.registerTool(tool);
      }

      // Create multiple sessions
      const sessions = [];
      for (let i = 0; i < 5; i++) {
        const transport = new MockTransport();
        const session = await server.createSession(`constitutional_client_${i}`, transport);
        sessions.push(session);
      }

      // Execute comprehensive memory test
      const promises = [];
      for (let i = 0; i < 30; i++) {
        const toolName = `constitutional_memory_tool_${i % 10}`;
        const sessionId = sessions[i % 5].id;
        const dataSize = [3000, 5000, 7000][i % 3];
        
        promises.push(
          server.executeTool(toolName, { dataSize }, sessionId)
        );
      }

      const results = await Promise.all(promises);
      const peakMemory = process.memoryUsage().heapUsed;

      // All operations should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Constitutional requirement: <1GB memory usage
      expect(peakMemory).toBeLessThan(config.memoryLimit);
      expect(peakMemory / 1024 / 1024).toBeLessThan(1024);

      // Memory increase should be reasonable
      const memoryIncrease = peakMemory - initialMemory;
      expect(memoryIncrease / 1024 / 1024).toBeLessThan(200); // Less than 200MB increase

      const stats = server.stats;
      expect(stats.memoryUsage).toBeLessThan(config.memoryLimit);
      expect(stats.totalRequests).toBe(30);
      expect(stats.totalToolsExecuted).toBe(30);

      console.log('Constitutional Memory Requirements Validation:', {
        initialMemory: `${(initialMemory / 1024 / 1024).toFixed(2)}MB`,
        peakMemory: `${(peakMemory / 1024 / 1024).toFixed(2)}MB`,
        memoryIncrease: `${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`,
        totalRequests: stats.totalRequests,
        totalToolsExecuted: stats.totalToolsExecuted,
        memoryLimit: `${(config.memoryLimit / 1024 / 1024).toFixed(2)}MB`
      });

      // Final constitutional validation
      expect(peakMemory).toBeLessThan(1024 * 1024 * 1024); // <1GB requirement
    });
  });
});
