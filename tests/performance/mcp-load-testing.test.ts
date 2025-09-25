/**
 * MCP Load Testing Integration Tests
 * 
 * Tests the MCP server's ability to handle various load scenarios using
 * the load testing utilities including:
 * - Light load testing
 * - Medium load testing
 * - Heavy load testing
 * - Burst load testing
 * - Sustained load testing
 */

import { ToolRegistry } from '../../src/server/tool-registry';
import { Tool, ToolResult, ToolExecutionContext } from '../../src/types';
import { 
  LoadTestRunner, 
  LoadTestConfig, 
  MCPLoadTestUtils, 
  evaluatePerformance,
  PERFORMANCE_THRESHOLDS 
} from '../utils/load-testing-utils';
import { MemoryMonitor, monitorMemory, MEMORY_LIMITS } from '../utils/memory-monitor';
import { ResponseTimeValidator, measureResponseTime, RESPONSE_TIME_LIMITS } from '../utils/response-time-validator';

// Mock Authentication Manager for load testing
class MockAuthenticationManager {
  private sessions = new Map<string, any>();
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
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(handler => handler(data));
  }

  async authenticateWithToken(token: string): Promise<any> {
    if (token === 'invalid_token') {
      throw new Error('Invalid token');
    }
    return { sessionId: `session_${token}`, userId: 'test_user' };
  }

  async authenticateWithSession(sessionId: string): Promise<any> {
    if (sessionId === 'invalid_session') {
      throw new Error('Invalid session');
    }
    return { sessionId, userId: 'test_user' };
  }

  async validateSession(sessionId: string): Promise<boolean> {
    return sessionId !== 'invalid_session';
  }

  async refreshSession(sessionId: string): Promise<any> {
    return { sessionId: `refreshed_${sessionId}`, userId: 'test_user' };
  }

  async terminateSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }
}

describe('MCP Load Testing', () => {
  let registry: ToolRegistry;
  let mockAuthManager: MockAuthenticationManager;
  let context: ToolExecutionContext;

  beforeEach(async () => {
    mockAuthManager = new MockAuthenticationManager();
    registry = new ToolRegistry();
    
    context = {
      session: { sessionId: 'test_session', userId: 'test_user' },
      server: {} as any,
      request: { id: 'test_request' },
      environment: { nodeEnv: 'test' }
    };

    // Register some test tools for load testing
    const testTools: Tool[] = [
      {
        name: 'fast_tool',
        description: 'Fast executing tool',
        category: 'testing',
        parameters: [
          {
            name: 'value',
            type: 'string',
            description: 'Test value',
            required: true
          }
        ],
        execute: async (params: any, ctx: ToolExecutionContext): Promise<ToolResult> => {
          return { success: true, data: { result: params.value } };
        }
      },
      {
        name: 'medium_tool',
        description: 'Medium executing tool',
        category: 'testing',
        parameters: [
          {
            name: 'delay',
            type: 'number',
            description: 'Delay in milliseconds',
            required: true
          }
        ],
        execute: async (params: any, ctx: ToolExecutionContext): Promise<ToolResult> => {
          await new Promise(resolve => setTimeout(resolve, params.delay || 10));
          return { success: true, data: { delay: params.delay } };
        }
      },
      {
        name: 'slow_tool',
        description: 'Slow executing tool',
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
          await new Promise(resolve => setTimeout(resolve, params.duration || 100));
          return { success: true, data: { duration: params.duration } };
        }
      }
    ];

    for (const tool of testTools) {
      await registry.registerTool(tool);
    }
  });

  afterEach(() => {
    // Cleanup
  });

  describe('Light Load Testing', () => {
    it('should handle light load with excellent performance', async () => {
      const { result, memoryReport } = await monitorMemory(async () => {
        const config: LoadTestConfig = {
          concurrency: 5,
          totalRequests: 50,
          requestTimeout: 5000
        };

        const runner = new LoadTestRunner(config);
        
        // Add fast tool execution operations
        runner.addOperation(
          MCPLoadTestUtils.createToolExecutionOperation(
            registry,
            'fast_tool',
            { value: 'test' },
            context,
            1
          )
        );

        return await runner.run();
      }, MEMORY_LIMITS.LOAD);

      const evaluation = evaluatePerformance(result);

      console.log('Light Load Test Results:');
      console.log(`Performance Grade: ${evaluation.overallGrade}`);
      console.log(memoryReport.generateFormattedReport());

      expect(result.errorRate).toBeLessThan(PERFORMANCE_THRESHOLDS.ERROR_RATE.GOOD);
      expect(result.averageResponseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.RESPONSE_TIME.GOOD);
      expect(evaluation.overallGrade).toMatch(/[AB]/);
      expect(memoryReport.withinLimits).toBe(true);
      expect(memoryReport.efficiencyScore).toBeGreaterThan(70);
    });

    it('should handle light load with mixed operations', async () => {
      const config: LoadTestConfig = {
        concurrency: 3,
        totalRequests: 30,
        requestTimeout: 5000
      };

      const runner = new LoadTestRunner(config);
      
      // Add mixed operations
      const operations = MCPLoadTestUtils.createRealisticLoadTest(registry, context);
      operations.forEach(op => runner.addOperation(op));

      const result = await runner.run();
      const evaluation = evaluatePerformance(result);

      console.log('Light Mixed Load Test Results:');
      console.log(runner.generateReport());
      console.log(`Performance Grade: ${evaluation.overallGrade}`);

      expect(result.errorRate).toBeLessThan(PERFORMANCE_THRESHOLDS.ERROR_RATE.POOR);
      expect(evaluation.overallGrade).toMatch(/[ABCD]/);
    });
  });

  describe('Medium Load Testing', () => {
    it('should handle medium load with good performance', async () => {
      const config: LoadTestConfig = {
        concurrency: 20,
        totalRequests: 200,
        requestTimeout: 10000
      };

      const runner = new LoadTestRunner(config);
      
      // Add medium tool execution operations
      runner.addOperation(
        MCPLoadTestUtils.createToolExecutionOperation(
          registry,
          'medium_tool',
          { delay: 5 },
          context,
          1
        )
      );

      const result = await runner.run();
      const evaluation = evaluatePerformance(result);

      console.log('Medium Load Test Results:');
      console.log(runner.generateReport());
      console.log(`Performance Grade: ${evaluation.overallGrade}`);

      expect(result.errorRate).toBeLessThan(PERFORMANCE_THRESHOLDS.ERROR_RATE.GOOD);
      expect(result.averageResponseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.RESPONSE_TIME.GOOD);
      expect(evaluation.overallGrade).toMatch(/[AB]/);
    });

    it('should handle medium load with ramp-up', async () => {
      const config: LoadTestConfig = {
        concurrency: 15,
        totalRequests: 150,
        rampUp: true,
        rampUpTime: 2000,
        requestTimeout: 10000
      };

      const runner = new LoadTestRunner(config);
      
      // Add fast tool execution operations
      runner.addOperation(
        MCPLoadTestUtils.createToolExecutionOperation(
          registry,
          'fast_tool',
          { value: 'ramp_test' },
          context,
          1
        )
      );

      const result = await runner.run();
      const evaluation = evaluatePerformance(result);

      console.log('Medium Ramp-up Load Test Results:');
      console.log(runner.generateReport());
      console.log(`Performance Grade: ${evaluation.overallGrade}`);

      expect(result.errorRate).toBeLessThan(PERFORMANCE_THRESHOLDS.ERROR_RATE.GOOD);
      expect(evaluation.overallGrade).toMatch(/[ABC]/);
    });
  });

  describe('Heavy Load Testing', () => {
    it('should handle heavy load with acceptable performance', async () => {
      const config: LoadTestConfig = {
        concurrency: 50,
        totalRequests: 500,
        requestTimeout: 15000
      };

      const runner = new LoadTestRunner(config);
      
      // Add mixed operations with different weights
      runner.addOperation(
        MCPLoadTestUtils.createToolExecutionOperation(
          registry,
          'fast_tool',
          { value: 'heavy_test' },
          context,
          3
        )
      );
      
      runner.addOperation(
        MCPLoadTestUtils.createToolExecutionOperation(
          registry,
          'medium_tool',
          { delay: 2 },
          context,
          2
        )
      );

      runner.addOperation(
        MCPLoadTestUtils.createToolDiscoveryOperation(registry, 1)
      );

      const result = await runner.run();
      const evaluation = evaluatePerformance(result);

      console.log('Heavy Load Test Results:');
      console.log(runner.generateReport());
      console.log(`Performance Grade: ${evaluation.overallGrade}`);

      expect(result.errorRate).toBeLessThan(PERFORMANCE_THRESHOLDS.ERROR_RATE.ACCEPTABLE);
      expect(result.averageResponseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.RESPONSE_TIME.ACCEPTABLE);
      expect(evaluation.overallGrade).toMatch(/[ABC]/);
    });

    it('should handle heavy load with sustained duration', async () => {
      const config: LoadTestConfig = {
        concurrency: 30,
        totalRequests: 1000,
        duration: 10000, // 10 seconds
        requestTimeout: 15000
      };

      const runner = new LoadTestRunner(config);
      
      // Add realistic mixed operations
      const operations = MCPLoadTestUtils.createRealisticLoadTest(registry, context);
      operations.forEach(op => runner.addOperation(op));

      const result = await runner.run();
      const evaluation = evaluatePerformance(result);

      console.log('Heavy Sustained Load Test Results:');
      console.log(runner.generateReport());
      console.log(`Performance Grade: ${evaluation.overallGrade}`);

      expect(result.errorRate).toBeLessThan(PERFORMANCE_THRESHOLDS.ERROR_RATE.POOR);
      expect(evaluation.overallGrade).toMatch(/[ABCD]/);
    });
  });

  describe('Burst Load Testing', () => {
    it('should handle burst load with high concurrency', async () => {
      const config: LoadTestConfig = {
        concurrency: 100,
        totalRequests: 200,
        requestTimeout: 20000
      };

      const runner = new LoadTestRunner(config);
      
      // Add fast operations for burst testing
      runner.addOperation(
        MCPLoadTestUtils.createToolExecutionOperation(
          registry,
          'fast_tool',
          { value: 'burst_test' },
          context,
          1
        )
      );

      const result = await runner.run();
      const evaluation = evaluatePerformance(result);

      console.log('Burst Load Test Results:');
      console.log(runner.generateReport());
      console.log(`Performance Grade: ${evaluation.overallGrade}`);

      expect(result.errorRate).toBeLessThan(PERFORMANCE_THRESHOLDS.ERROR_RATE.ACCEPTABLE);
      expect(evaluation.overallGrade).toMatch(/[ABC]/);
    });

    it('should handle burst load with mixed operations', async () => {
      const config: LoadTestConfig = {
        concurrency: 75,
        totalRequests: 300,
        requestTimeout: 20000
      };

      const runner = new LoadTestRunner(config);
      
      // Add mixed operations for burst testing
      const operations = MCPLoadTestUtils.createMixedOperationsLoadTest(registry, context, {
        toolExecutionWeight: 80,
        toolRegistrationWeight: 5,
        toolDiscoveryWeight: 15
      });
      operations.forEach(op => runner.addOperation(op));

      const result = await runner.run();
      const evaluation = evaluatePerformance(result);

      console.log('Burst Mixed Load Test Results:');
      console.log(runner.generateReport());
      console.log(`Performance Grade: ${evaluation.overallGrade}`);

      expect(result.errorRate).toBeLessThan(PERFORMANCE_THRESHOLDS.ERROR_RATE.POOR);
      expect(evaluation.overallGrade).toMatch(/[ABCD]/);
    });
  });

  describe('Stress Load Testing', () => {
    it('should handle stress load with high volume', async () => {
      const config: LoadTestConfig = {
        concurrency: 200,
        totalRequests: 1000,
        requestTimeout: 30000
      };

      const runner = new LoadTestRunner(config);
      
      // Add lightweight operations for stress testing
      runner.addOperation(
        MCPLoadTestUtils.createToolExecutionOperation(
          registry,
          'fast_tool',
          { value: 'stress_test' },
          context,
          1
        )
      );

      const result = await runner.run();
      const evaluation = evaluatePerformance(result);

      console.log('Stress Load Test Results:');
      console.log(runner.generateReport());
      console.log(`Performance Grade: ${evaluation.overallGrade}`);

      // Stress tests may have higher error rates and response times
      expect(result.errorRate).toBeLessThan(PERFORMANCE_THRESHOLDS.ERROR_RATE.POOR);
      expect(evaluation.overallGrade).toMatch(/[ABCD]/);
    });

    it('should handle stress load with memory-intensive operations', async () => {
      // Register a memory-intensive tool
      const memoryTool: Tool = {
        name: 'memory_intensive_tool',
        description: 'Memory intensive tool for stress testing',
        category: 'testing',
        parameters: [
          {
            name: 'size',
            type: 'number',
            description: 'Data size',
            required: true
          }
        ],
        execute: async (params: any, ctx: ToolExecutionContext): Promise<ToolResult> => {
          // Create some data to use memory
          const data = new Array(params.size).fill('x');
          return { success: true, data: { size: data.length } };
        }
      };

      await registry.registerTool(memoryTool);

      const { result, memoryReport } = await monitorMemory(async () => {
        const config: LoadTestConfig = {
          concurrency: 50,
          totalRequests: 200,
          requestTimeout: 30000
        };

        const runner = new LoadTestRunner(config);
        
        // Add memory-intensive operations
        runner.addOperation(
          MCPLoadTestUtils.createToolExecutionOperation(
            registry,
            'memory_intensive_tool',
            { size: 1000 },
            context,
            1
          )
        );

        return await runner.run();
      }, MEMORY_LIMITS.LOAD);

      const evaluation = evaluatePerformance(result);

      console.log('Memory Stress Load Test Results:');
      console.log(`Performance Grade: ${evaluation.overallGrade}`);
      console.log(memoryReport.generateFormattedReport());

      expect(result.errorRate).toBeLessThan(PERFORMANCE_THRESHOLDS.ERROR_RATE.POOR);
      expect(evaluation.overallGrade).toMatch(/[ABCD]/);
      expect(memoryReport.withinLimits).toBe(true);
      expect(memoryReport.efficiencyScore).toBeGreaterThan(50); // Acceptable for stress testing
    });
  });

  describe('Load Test Utilities', () => {
    it('should create realistic load test operations', () => {
      const operations = MCPLoadTestUtils.createRealisticLoadTest(registry, context);
      
      expect(operations).toHaveLength(3);
      expect(operations.some(op => op.name === 'execute_fast_tool')).toBe(true);
      expect(operations.some(op => op.name === 'register_tool')).toBe(true);
      expect(operations.some(op => op.name === 'discover_tools')).toBe(true);
    });

    it('should create mixed operations load test', () => {
      const operations = MCPLoadTestUtils.createMixedOperationsLoadTest(registry, context, {
        toolExecutionWeight: 60,
        toolRegistrationWeight: 20,
        toolDiscoveryWeight: 20
      });
      
      expect(operations).toHaveLength(3);
      
      const executionOp = operations.find(op => op.name.startsWith('execute_'));
      const registrationOp = operations.find(op => op.name === 'register_tool');
      const discoveryOp = operations.find(op => op.name === 'discover_tools');
      
      expect(executionOp?.weight).toBe(60);
      expect(registrationOp?.weight).toBe(20);
      expect(discoveryOp?.weight).toBe(20);
    });

    it('should evaluate performance correctly', () => {
      const excellentResult = {
        totalRequests: 100,
        successfulRequests: 100,
        failedRequests: 0,
        averageResponseTime: 50,
        minResponseTime: 10,
        maxResponseTime: 100,
        p95ResponseTime: 80,
        p99ResponseTime: 95,
        requestsPerSecond: 1000,
        testDuration: 1000,
        errorRate: 0,
        responseTimes: [],
        errors: []
      };

      const evaluation = evaluatePerformance(excellentResult);
      expect(evaluation.overallGrade).toBe('A');
      expect(evaluation.responseTimeGrade).toBe('A');
      expect(evaluation.errorRateGrade).toBe('A');
      expect(evaluation.throughputGrade).toBe('A');
    });

    it('should generate comprehensive load test reports', async () => {
      const config: LoadTestConfig = {
        concurrency: 10,
        totalRequests: 50,
        requestTimeout: 5000
      };

      const runner = new LoadTestRunner(config);
      runner.addOperation(
        MCPLoadTestUtils.createToolExecutionOperation(
          registry,
          'fast_tool',
          { value: 'report_test' },
          context,
          1
        )
      );

      await runner.run();
      const report = runner.generateReport();

      expect(report).toContain('Load Test Report');
      expect(report).toContain('Configuration:');
      expect(report).toContain('Results:');
      expect(report).toContain('Response Times:');
      expect(report).toContain('Errors:');
    });
  });

  describe('Response Time Validation in Load Tests', () => {
    it('should validate response times during light load', async () => {
      const validator = new ResponseTimeValidator();
      validator.start('light_load_response_times');

      const config: LoadTestConfig = {
        concurrency: 5,
        totalRequests: 50,
        requestTimeout: 5000
      };

      const runner = new LoadTestRunner(config);
      runner.addOperation(
        MCPLoadTestUtils.createToolExecutionOperation(
          registry,
          'fast_tool',
          { value: 'test' },
          context,
          1
        )
      );

      // Override the runner's operation execution to measure response times
      const originalExecute = runner['executeOperation'];
      runner['executeOperation'] = async (operation: any) => {
        const startTime = Date.now();
        try {
          const result = await originalExecute.call(runner, operation);
          const duration = Date.now() - startTime;
          validator.recordResponse(duration, true);
          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          validator.recordResponse(duration, false, error instanceof Error ? error.message : 'Unknown error');
          throw error;
        }
      };

      const result = await runner.run();
      const report = validator.stop(RESPONSE_TIME_LIMITS.LOAD);
      
      console.log('Light Load Response Time Validation:');
      console.log(validator.generateFormattedReport(report));

      expect(report.totalRequests).toBe(50);
      expect(report.errorRate).toBeLessThan(RESPONSE_TIME_LIMITS.LOAD.maxErrorRate);
      expect(report.averageResponseTime).toBeLessThan(RESPONSE_TIME_LIMITS.LOAD.averageResponseTime);
      expect(report.performanceGrade).toMatch(/[ABC]/);
    });

    it('should validate response times during medium load', async () => {
      const validator = new ResponseTimeValidator();
      validator.start('medium_load_response_times');

      const config: LoadTestConfig = {
        concurrency: 15,
        totalRequests: 150,
        requestTimeout: 10000
      };

      const runner = new LoadTestRunner(config);
      runner.addOperation(
        MCPLoadTestUtils.createToolExecutionOperation(
          registry,
          'medium_tool',
          { delay: 5 },
          context,
          1
        )
      );

      // Override the runner's operation execution to measure response times
      const originalExecute = runner['executeOperation'];
      runner['executeOperation'] = async (operation: any) => {
        const startTime = Date.now();
        try {
          const result = await originalExecute.call(runner, operation);
          const duration = Date.now() - startTime;
          validator.recordResponse(duration, true);
          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          validator.recordResponse(duration, false, error instanceof Error ? error.message : 'Unknown error');
          throw error;
        }
      };

      const result = await runner.run();
      const report = validator.stop(RESPONSE_TIME_LIMITS.LOAD);
      
      console.log('Medium Load Response Time Validation:');
      console.log(validator.generateFormattedReport(report));

      expect(report.totalRequests).toBe(150);
      expect(report.errorRate).toBeLessThan(RESPONSE_TIME_LIMITS.LOAD.maxErrorRate);
      expect(report.averageResponseTime).toBeLessThan(RESPONSE_TIME_LIMITS.LOAD.averageResponseTime);
      expect(report.performanceGrade).toMatch(/[BCD]/);
    });

    it('should validate response times during heavy load', async () => {
      const validator = new ResponseTimeValidator();
      validator.start('heavy_load_response_times');

      const config: LoadTestConfig = {
        concurrency: 30,
        totalRequests: 300,
        requestTimeout: 15000
      };

      const runner = new LoadTestRunner(config);
      runner.addOperation(
        MCPLoadTestUtils.createToolExecutionOperation(
          registry,
          'heavy_tool',
          { delay: 10 },
          context,
          1
        )
      );

      // Override the runner's operation execution to measure response times
      const originalExecute = runner['executeOperation'];
      runner['executeOperation'] = async (operation: any) => {
        const startTime = Date.now();
        try {
          const result = await originalExecute.call(runner, operation);
          const duration = Date.now() - startTime;
          validator.recordResponse(duration, true);
          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          validator.recordResponse(duration, false, error instanceof Error ? error.message : 'Unknown error');
          throw error;
        }
      };

      const result = await runner.run();
      const report = validator.stop(RESPONSE_TIME_LIMITS.LOAD);
      
      console.log('Heavy Load Response Time Validation:');
      console.log(validator.generateFormattedReport(report));

      expect(report.totalRequests).toBe(300);
      expect(report.errorRate).toBeLessThan(RESPONSE_TIME_LIMITS.LOAD.maxErrorRate);
      expect(report.averageResponseTime).toBeLessThan(RESPONSE_TIME_LIMITS.LOAD.averageResponseTime);
      expect(report.performanceGrade).toMatch(/[CD]/);
    });

    it('should validate response times during burst load', async () => {
      const validator = new ResponseTimeValidator();
      validator.start('burst_load_response_times');

      const config: LoadTestConfig = {
        concurrency: 50,
        totalRequests: 100,
        requestTimeout: 10000
      };

      const runner = new LoadTestRunner(config);
      runner.addOperation(
        MCPLoadTestUtils.createToolExecutionOperation(
          registry,
          'fast_tool',
          { value: 'burst_test' },
          context,
          1
        )
      );

      // Override the runner's operation execution to measure response times
      const originalExecute = runner['executeOperation'];
      runner['executeOperation'] = async (operation: any) => {
        const startTime = Date.now();
        try {
          const result = await originalExecute.call(runner, operation);
          const duration = Date.now() - startTime;
          validator.recordResponse(duration, true);
          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          validator.recordResponse(duration, false, error instanceof Error ? error.message : 'Unknown error');
          throw error;
        }
      };

      const result = await runner.run();
      const report = validator.stop(RESPONSE_TIME_LIMITS.LOAD);
      
      console.log('Burst Load Response Time Validation:');
      console.log(validator.generateFormattedReport(report));

      expect(report.totalRequests).toBe(100);
      expect(report.errorRate).toBeLessThan(RESPONSE_TIME_LIMITS.LOAD.maxErrorRate);
      expect(report.averageResponseTime).toBeLessThan(RESPONSE_TIME_LIMITS.LOAD.averageResponseTime);
      expect(report.performanceGrade).toMatch(/[BCD]/);
    });

    it('should detect response time degradation under load', async () => {
      const validator = new ResponseTimeValidator();
      validator.start('load_degradation_test');

      // Test with increasing load to detect degradation
      const loads = [
        { concurrency: 5, requests: 25 },
        { concurrency: 10, requests: 50 },
        { concurrency: 20, requests: 100 },
        { concurrency: 30, requests: 150 }
      ];

      for (const load of loads) {
        const config: LoadTestConfig = {
          concurrency: load.concurrency,
          totalRequests: load.requests,
          requestTimeout: 10000
        };

        const runner = new LoadTestRunner(config);
        runner.addOperation(
          MCPLoadTestUtils.createToolExecutionOperation(
            registry,
            'medium_tool',
            { delay: 5 },
            context,
            1
          )
        );

        // Override the runner's operation execution to measure response times
        const originalExecute = runner['executeOperation'];
        runner['executeOperation'] = async (operation: any) => {
          const startTime = Date.now();
          try {
            const result = await originalExecute.call(runner, operation);
            const duration = Date.now() - startTime;
            validator.recordResponse(duration, true);
            return result;
          } catch (error) {
            const duration = Date.now() - startTime;
            validator.recordResponse(duration, false, error instanceof Error ? error.message : 'Unknown error');
            throw error;
          }
        };

        await runner.run();
      }

      const report = validator.stop(RESPONSE_TIME_LIMITS.LOAD);
      
      console.log('Load Degradation Response Time Validation:');
      console.log(validator.generateFormattedReport(report));

      expect(report.totalRequests).toBe(325); // Sum of all requests
      expect(report.errorRate).toBeLessThan(RESPONSE_TIME_LIMITS.LOAD.maxErrorRate);
      expect(report.standardDeviation).toBeGreaterThan(0); // Should show variation
    });
  });
});
