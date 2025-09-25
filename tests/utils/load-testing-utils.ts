/**
 * Load Testing Utilities for MCP Server
 * 
 * Provides utilities for creating and managing load tests including:
 * - Load test configuration
 * - Request generation
 * - Performance metrics collection
 * - Result analysis and reporting
 */

import { ToolRegistry } from '../../src/server/tool-registry';
import { Tool, ToolResult, ToolExecutionContext } from '../../src/types';

export interface LoadTestConfig {
  /** Number of concurrent users/requests */
  concurrency: number;
  /** Total number of requests to send */
  totalRequests: number;
  /** Duration of the test in milliseconds */
  duration?: number;
  /** Ramp-up time in milliseconds */
  rampUpTime?: number;
  /** Request timeout in milliseconds */
  requestTimeout?: number;
  /** Whether to use constant load or ramp-up */
  rampUp?: boolean;
}

export interface LoadTestResult {
  /** Total requests sent */
  totalRequests: number;
  /** Successful requests */
  successfulRequests: number;
  /** Failed requests */
  failedRequests: number;
  /** Average response time in milliseconds */
  averageResponseTime: number;
  /** Minimum response time in milliseconds */
  minResponseTime: number;
  /** Maximum response time in milliseconds */
  maxResponseTime: number;
  /** 95th percentile response time in milliseconds */
  p95ResponseTime: number;
  /** 99th percentile response time in milliseconds */
  p99ResponseTime: number;
  /** Requests per second */
  requestsPerSecond: number;
  /** Test duration in milliseconds */
  testDuration: number;
  /** Error rate percentage */
  errorRate: number;
  /** Detailed response times array */
  responseTimes: number[];
  /** Error details */
  errors: Array<{ error: string; count: number }>;
}

export interface LoadTestOperation {
  /** Operation name */
  name: string;
  /** Operation weight (for weighted random selection) */
  weight: number;
  /** Operation function */
  operation: () => Promise<any>;
}

export class LoadTestRunner {
  private config: LoadTestConfig;
  private operations: LoadTestOperation[] = [];
  private results: LoadTestResult | null = null;

  constructor(config: LoadTestConfig) {
    this.config = {
      requestTimeout: 30000,
      rampUpTime: 0,
      rampUp: false,
      ...config
    };
  }

  /**
   * Add an operation to the load test
   */
  addOperation(operation: LoadTestOperation): void {
    this.operations.push(operation);
  }

  /**
   * Run the load test
   */
  async run(): Promise<LoadTestResult> {
    if (this.operations.length === 0) {
      throw new Error('No operations defined for load test');
    }

    const startTime = Date.now();
    const responseTimes: number[] = [];
    const errors: Map<string, number> = new Map();
    let successfulRequests = 0;
    let failedRequests = 0;

    // Calculate requests per user
    const requestsPerUser = Math.ceil(this.config.totalRequests / this.config.concurrency);
    
    // Create user tasks
    const userTasks = Array.from({ length: this.config.concurrency }, (_, userIndex) => 
      this.runUserLoad(userIndex, requestsPerUser, responseTimes, errors, startTime)
    );

    // Wait for all users to complete
    const userResults = await Promise.all(userTasks);
    
    // Aggregate results
    userResults.forEach(result => {
      successfulRequests += result.successful;
      failedRequests += result.failed;
    });

    const endTime = Date.now();
    const testDuration = endTime - startTime;

    // Calculate statistics
    const sortedResponseTimes = responseTimes.sort((a, b) => a - b);
    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);
    const p95Index = Math.floor(sortedResponseTimes.length * 0.95);
    const p99Index = Math.floor(sortedResponseTimes.length * 0.99);
    const p95ResponseTime = sortedResponseTimes[p95Index] || 0;
    const p99ResponseTime = sortedResponseTimes[p99Index] || 0;
    const requestsPerSecond = (successfulRequests + failedRequests) / (testDuration / 1000);
    const errorRate = (failedRequests / (successfulRequests + failedRequests)) * 100;

    // Convert errors map to array
    const errorDetails = Array.from(errors.entries()).map(([error, count]) => ({
      error,
      count
    }));

    this.results = {
      totalRequests: successfulRequests + failedRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      minResponseTime,
      maxResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      requestsPerSecond,
      testDuration,
      errorRate,
      responseTimes: sortedResponseTimes,
      errors: errorDetails
    };

    return this.results;
  }

  /**
   * Run load for a single user
   */
  private async runUserLoad(
    userIndex: number,
    requestsPerUser: number,
    responseTimes: number[],
    errors: Map<string, number>,
    startTime: number
  ): Promise<{ successful: number; failed: number }> {
    let successful = 0;
    let failed = 0;

    // Calculate delay for ramp-up
    const userDelay = this.config.rampUp ? 
      (this.config.rampUpTime! / this.config.concurrency) * userIndex : 0;

    if (userDelay > 0) {
      await this.sleep(userDelay);
    }

    for (let i = 0; i < requestsPerUser; i++) {
      // Check if test duration has been exceeded
      if (this.config.duration && (Date.now() - startTime) > this.config.duration) {
        break;
      }

      try {
        const operationStartTime = Date.now();
        
        // Select operation based on weight
        const operation = this.selectWeightedOperation();
        await Promise.race([
          operation.operation(),
          this.timeoutPromise(this.config.requestTimeout!)
        ]);

        const operationEndTime = Date.now();
        const responseTime = operationEndTime - operationStartTime;
        
        responseTimes.push(responseTime);
        successful++;
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.set(errorMessage, (errors.get(errorMessage) || 0) + 1);
      }

      // Small delay between requests to prevent overwhelming
      await this.sleep(1);
    }

    return { successful, failed };
  }

  /**
   * Select an operation based on weight
   */
  private selectWeightedOperation(): LoadTestOperation {
    const totalWeight = this.operations.reduce((sum, op) => sum + op.weight, 0);
    let random = Math.random() * totalWeight;

    for (const operation of this.operations) {
      random -= operation.weight;
      if (random <= 0) {
        return operation;
      }
    }

    return this.operations[0];
  }

  /**
   * Create a timeout promise
   */
  private timeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      const timeoutId = setTimeout(() => reject(new Error('Request timeout')), timeout);
      // Store timeout ID for potential cleanup (though we don't need it for this use case)
      return timeoutId;
    });
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get the last test results
   */
  getResults(): LoadTestResult | null {
    return this.results;
  }

  /**
   * Generate a load test report
   */
  generateReport(): string {
    if (!this.results) {
      return 'No test results available';
    }

    const r = this.results;
    return `
Load Test Report
================

Configuration:
- Concurrency: ${this.config.concurrency}
- Total Requests: ${this.config.totalRequests}
- Duration: ${r.testDuration}ms
- Ramp-up: ${this.config.rampUp ? 'Yes' : 'No'}

Results:
- Total Requests: ${r.totalRequests}
- Successful: ${r.successfulRequests} (${(100 - r.errorRate).toFixed(2)}%)
- Failed: ${r.failedRequests} (${r.errorRate.toFixed(2)}%)
- Requests/Second: ${r.requestsPerSecond.toFixed(2)}

Response Times:
- Average: ${r.averageResponseTime.toFixed(2)}ms
- Min: ${r.minResponseTime.toFixed(2)}ms
- Max: ${r.maxResponseTime.toFixed(2)}ms
- 95th percentile: ${r.p95ResponseTime.toFixed(2)}ms
- 99th percentile: ${r.p99ResponseTime.toFixed(2)}ms

Errors:
${r.errors.map(e => `- ${e.error}: ${e.count}`).join('\n')}
    `.trim();
  }
}

/**
 * MCP-specific load testing utilities
 */
export class MCPLoadTestUtils {
  /**
   * Create a tool execution operation
   */
  static createToolExecutionOperation(
    registry: ToolRegistry,
    toolName: string,
    params: any,
    context: ToolExecutionContext,
    weight: number = 1
  ): LoadTestOperation {
    return {
      name: `execute_${toolName}`,
      weight,
      operation: async () => {
        const result = await registry.executeTool(toolName, params, context);
        if (!result.success) {
          throw new Error(result.error?.message || 'Tool execution failed');
        }
        return result;
      }
    };
  }

  /**
   * Create a tool registration operation
   */
  static createToolRegistrationOperation(
    registry: ToolRegistry,
    toolFactory: (index: number) => Tool,
    weight: number = 1
  ): LoadTestOperation {
    return {
      name: 'register_tool',
      weight,
      operation: async () => {
        const tool = toolFactory(Math.floor(Math.random() * 1000));
        await registry.registerTool(tool);
        return tool;
      }
    };
  }

  /**
   * Create a tool discovery operation
   */
  static createToolDiscoveryOperation(
    registry: ToolRegistry,
    weight: number = 1
  ): LoadTestOperation {
    return {
      name: 'discover_tools',
      weight,
      operation: async () => {
        const tools = registry.getAvailableTools();
        const categories = registry.getCategories();
        return { tools: tools.length, categories: categories.length };
      }
    };
  }

  /**
   * Create a mixed operations load test
   */
  static createMixedOperationsLoadTest(
    registry: ToolRegistry,
    context: ToolExecutionContext,
    config: {
      toolExecutionWeight: number;
      toolRegistrationWeight: number;
      toolDiscoveryWeight: number;
    }
  ): LoadTestOperation[] {
    const operations: LoadTestOperation[] = [];

    // Add tool execution operations
    const availableTools = registry.getAvailableTools();
    if (availableTools.length > 0) {
      const randomTool = availableTools[Math.floor(Math.random() * availableTools.length)];
      operations.push(
        MCPLoadTestUtils.createToolExecutionOperation(
          registry,
          randomTool.name,
          {},
          context,
          config.toolExecutionWeight
        )
      );
    }

    // Add tool registration operation
    operations.push(
      MCPLoadTestUtils.createToolRegistrationOperation(
        registry,
        (index) => ({
          name: `load_test_tool_${index}`,
          description: `Load test tool ${index}`,
          category: 'testing',
          parameters: [],
          execute: async (): Promise<ToolResult> => ({ success: true, data: { index } })
        }),
        config.toolRegistrationWeight
      )
    );

    // Add tool discovery operation
    operations.push(
      MCPLoadTestUtils.createToolDiscoveryOperation(
        registry,
        config.toolDiscoveryWeight
      )
    );

    return operations;
  }

  /**
   * Create a realistic load test scenario
   */
  static createRealisticLoadTest(
    registry: ToolRegistry,
    context: ToolExecutionContext
  ): LoadTestOperation[] {
    return MCPLoadTestUtils.createMixedOperationsLoadTest(registry, context, {
      toolExecutionWeight: 70,  // 70% tool executions
      toolRegistrationWeight: 10, // 10% tool registrations
      toolDiscoveryWeight: 20   // 20% tool discoveries
    });
  }
}

/**
 * Performance thresholds for load testing
 */
export const PERFORMANCE_THRESHOLDS = {
  // Response time thresholds (in milliseconds)
  RESPONSE_TIME: {
    EXCELLENT: 100,
    GOOD: 500,
    ACCEPTABLE: 1000,
    POOR: 2000
  },
  
  // Error rate thresholds (in percentage)
  ERROR_RATE: {
    EXCELLENT: 0.1,
    GOOD: 1.0,
    ACCEPTABLE: 5.0,
    POOR: 10.0
  },
  
  // Throughput thresholds (requests per second)
  THROUGHPUT: {
    EXCELLENT: 1000,
    GOOD: 500,
    ACCEPTABLE: 100,
    POOR: 50
  }
};

/**
 * Evaluate performance against thresholds
 */
export function evaluatePerformance(result: LoadTestResult): {
  responseTimeGrade: string;
  errorRateGrade: string;
  throughputGrade: string;
  overallGrade: string;
} {
  const { RESPONSE_TIME, ERROR_RATE, THROUGHPUT } = PERFORMANCE_THRESHOLDS;

  // Evaluate response time
  let responseTimeGrade: string;
  if (result.averageResponseTime <= RESPONSE_TIME.EXCELLENT) {
    responseTimeGrade = 'A';
  } else if (result.averageResponseTime <= RESPONSE_TIME.GOOD) {
    responseTimeGrade = 'B';
  } else if (result.averageResponseTime <= RESPONSE_TIME.ACCEPTABLE) {
    responseTimeGrade = 'C';
  } else {
    responseTimeGrade = 'D';
  }

  // Evaluate error rate
  let errorRateGrade: string;
  if (result.errorRate <= ERROR_RATE.EXCELLENT) {
    errorRateGrade = 'A';
  } else if (result.errorRate <= ERROR_RATE.GOOD) {
    errorRateGrade = 'B';
  } else if (result.errorRate <= ERROR_RATE.ACCEPTABLE) {
    errorRateGrade = 'C';
  } else {
    errorRateGrade = 'D';
  }

  // Evaluate throughput
  let throughputGrade: string;
  if (result.requestsPerSecond >= THROUGHPUT.EXCELLENT) {
    throughputGrade = 'A';
  } else if (result.requestsPerSecond >= THROUGHPUT.GOOD) {
    throughputGrade = 'B';
  } else if (result.requestsPerSecond >= THROUGHPUT.ACCEPTABLE) {
    throughputGrade = 'C';
  } else {
    throughputGrade = 'D';
  }

  // Calculate overall grade
  const grades = [responseTimeGrade, errorRateGrade, throughputGrade];
  const gradeValues = grades.map(g => g === 'A' ? 4 : g === 'B' ? 3 : g === 'C' ? 2 : 1);
  const averageGrade = gradeValues.reduce((sum, val) => sum + val, 0) / gradeValues.length;
  
  let overallGrade: string;
  if (averageGrade >= 3.5) {
    overallGrade = 'A';
  } else if (averageGrade >= 2.5) {
    overallGrade = 'B';
  } else if (averageGrade >= 1.5) {
    overallGrade = 'C';
  } else {
    overallGrade = 'D';
  }

  return {
    responseTimeGrade,
    errorRateGrade,
    throughputGrade,
    overallGrade
  };
}
