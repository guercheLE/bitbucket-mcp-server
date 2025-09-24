/**
 * Response Time Validation Utilities
 * 
 * Provides comprehensive response time validation and performance analysis
 * for MCP operations and tool executions.
 */

export interface ResponseTimeSnapshot {
  timestamp: number;
  duration: number; // milliseconds
  operation: string;
  success: boolean;
  error?: string;
}

export interface ResponseTimeLimits {
  maxResponseTime: number; // milliseconds
  averageResponseTime: number; // milliseconds
  p95ResponseTime: number; // milliseconds
  p99ResponseTime: number; // milliseconds
  maxErrorRate: number; // percentage (0-100)
}

export interface ResponseTimeReport {
  operation: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  errorRate: number; // percentage
  minResponseTime: number;
  maxResponseTime: number;
  averageResponseTime: number;
  medianResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  standardDeviation: number;
  withinLimits: boolean;
  limits: ResponseTimeLimits;
  snapshots: ResponseTimeSnapshot[];
  duration: number; // total test duration in milliseconds
  requestsPerSecond: number;
  performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export class ResponseTimeValidator {
  private snapshots: ResponseTimeSnapshot[] = [];
  private startTime: number = 0;
  private operation: string = '';

  /**
   * Start monitoring response times for an operation
   */
  start(operation: string): void {
    this.operation = operation;
    this.startTime = Date.now();
    this.snapshots = [];
  }

  /**
   * Record a response time snapshot
   */
  recordResponse(duration: number, success: boolean = true, error?: string): void {
    const snapshot: ResponseTimeSnapshot = {
      timestamp: Date.now(),
      duration,
      operation: this.operation,
      success,
      error
    };
    this.snapshots.push(snapshot);
  }

  /**
   * Stop monitoring and generate report
   */
  stop(limits: ResponseTimeLimits): ResponseTimeReport {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;
    
    if (this.snapshots.length === 0) {
      throw new Error('No response time data recorded. Call recordResponse() at least once.');
    }

    const successfulSnapshots = this.snapshots.filter(s => s.success);
    const failedSnapshots = this.snapshots.filter(s => !s.success);
    
    const responseTimes = this.snapshots.map(s => s.duration).sort((a, b) => a - b);
    
    const report: ResponseTimeReport = {
      operation: this.operation,
      totalRequests: this.snapshots.length,
      successfulRequests: successfulSnapshots.length,
      failedRequests: failedSnapshots.length,
      errorRate: (failedSnapshots.length / this.snapshots.length) * 100,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      averageResponseTime: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
      medianResponseTime: this.calculatePercentile(responseTimes, 50),
      p95ResponseTime: this.calculatePercentile(responseTimes, 95),
      p99ResponseTime: this.calculatePercentile(responseTimes, 99),
      standardDeviation: this.calculateStandardDeviation(responseTimes),
      withinLimits: this.checkWithinLimits(responseTimes, limits),
      limits,
      snapshots: [...this.snapshots],
      duration: totalDuration,
      requestsPerSecond: (this.snapshots.length / totalDuration) * 1000,
      performanceGrade: this.calculatePerformanceGrade(responseTimes, limits)
    };

    return report;
  }

  /**
   * Calculate percentile from sorted array
   */
  private calculatePercentile(sortedArray: number[], percentile: number): number {
    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (upper >= sortedArray.length) {
      return sortedArray[sortedArray.length - 1];
    }

    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  /**
   * Calculate standard deviation
   */
  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Check if response times are within limits
   */
  private checkWithinLimits(responseTimes: number[], limits: ResponseTimeLimits): boolean {
    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const p95ResponseTime = this.calculatePercentile(responseTimes, 95);
    const p99ResponseTime = this.calculatePercentile(responseTimes, 99);
    const maxResponseTime = Math.max(...responseTimes);
    
    return (
      averageResponseTime <= limits.averageResponseTime &&
      p95ResponseTime <= limits.p95ResponseTime &&
      p99ResponseTime <= limits.p99ResponseTime &&
      maxResponseTime <= limits.maxResponseTime
    );
  }

  /**
   * Calculate performance grade based on response times and limits
   */
  private calculatePerformanceGrade(responseTimes: number[], limits: ResponseTimeLimits): 'A' | 'B' | 'C' | 'D' | 'F' {
    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const p95ResponseTime = this.calculatePercentile(responseTimes, 95);
    const maxResponseTime = Math.max(...responseTimes);
    
    // Grade based on how well we perform relative to limits
    const avgScore = (limits.averageResponseTime / averageResponseTime) * 100;
    const p95Score = (limits.p95ResponseTime / p95ResponseTime) * 100;
    const maxScore = (limits.maxResponseTime / maxResponseTime) * 100;
    
    const overallScore = (avgScore + p95Score + maxScore) / 3;
    
    if (overallScore >= 90) return 'A';
    if (overallScore >= 80) return 'B';
    if (overallScore >= 70) return 'C';
    if (overallScore >= 60) return 'D';
    return 'F';
  }

  /**
   * Generate a formatted report string
   */
  generateFormattedReport(report: ResponseTimeReport): string {
    const lines = [
      `\n=== Response Time Validation Report ===`,
      `Operation: ${report.operation}`,
      `Total Requests: ${report.totalRequests}`,
      `Successful: ${report.successfulRequests} (${(100 - report.errorRate).toFixed(1)}%)`,
      `Failed: ${report.failedRequests} (${report.errorRate.toFixed(1)}%)`,
      `Duration: ${report.duration}ms`,
      `Requests/sec: ${report.requestsPerSecond.toFixed(2)}`,
      ``,
      `Response Times (ms):`,
      `  Min: ${report.minResponseTime.toFixed(2)}`,
      `  Max: ${report.maxResponseTime.toFixed(2)}`,
      `  Average: ${report.averageResponseTime.toFixed(2)}`,
      `  Median: ${report.medianResponseTime.toFixed(2)}`,
      `  P95: ${report.p95ResponseTime.toFixed(2)}`,
      `  P99: ${report.p99ResponseTime.toFixed(2)}`,
      `  Std Dev: ${report.standardDeviation.toFixed(2)}`,
      ``,
      `Limits:`,
      `  Max: ${report.limits.maxResponseTime}ms`,
      `  Average: ${report.limits.averageResponseTime}ms`,
      `  P95: ${report.limits.p95ResponseTime}ms`,
      `  P99: ${report.limits.p99ResponseTime}ms`,
      `  Max Error Rate: ${report.limits.maxErrorRate}%`,
      ``,
      `Performance Grade: ${report.performanceGrade}`,
      `Within Limits: ${report.withinLimits ? '✅ YES' : '❌ NO'}`,
      `========================================\n`
    ];

    return lines.join('\n');
  }

  /**
   * Get current snapshots for analysis
   */
  getSnapshots(): ResponseTimeSnapshot[] {
    return [...this.snapshots];
  }

  /**
   * Clear all recorded data
   */
  clear(): void {
    this.snapshots = [];
    this.startTime = 0;
    this.operation = '';
  }
}

/**
 * Utility function to measure and validate response time for an async operation
 */
export async function measureResponseTime<T>(
  operation: () => Promise<T>,
  operationName: string,
  limits: ResponseTimeLimits
): Promise<{ result: T; report: ResponseTimeReport }> {
  const validator = new ResponseTimeValidator();
  validator.start(operationName);

  try {
    const startTime = Date.now();
    const result = await operation();
    const duration = Date.now() - startTime;
    
    validator.recordResponse(duration, true);
    const report = validator.stop(limits);
    
    return { result, report };
  } catch (error) {
    const duration = Date.now() - validator['startTime'];
    validator.recordResponse(duration, false, error instanceof Error ? error.message : 'Unknown error');
    const report = validator.stop(limits);
    
    throw { error, report };
  }
}

/**
 * Utility function to measure and validate response time for a sync operation
 */
export function measureResponseTimeSync<T>(
  operation: () => T,
  operationName: string,
  limits: ResponseTimeLimits
): { result: T; report: ResponseTimeReport } {
  const validator = new ResponseTimeValidator();
  validator.start(operationName);

  try {
    const startTime = Date.now();
    const result = operation();
    const duration = Date.now() - startTime;
    
    validator.recordResponse(duration, true);
    const report = validator.stop(limits);
    
    return { result, report };
  } catch (error) {
    const duration = Date.now() - validator['startTime'];
    validator.recordResponse(duration, false, error instanceof Error ? error.message : 'Unknown error');
    const report = validator.stop(limits);
    
    throw { error, report };
  }
}

/**
 * Predefined response time limits for different test scenarios
 */
export const RESPONSE_TIME_LIMITS = {
  // Unit tests - very fast operations
  UNIT: {
    maxResponseTime: 100, // 100ms
    averageResponseTime: 50, // 50ms
    p95ResponseTime: 80, // 80ms
    p99ResponseTime: 95, // 95ms
    maxErrorRate: 0 // 0%
  },

  // Integration tests - moderate operations
  INTEGRATION: {
    maxResponseTime: 500, // 500ms
    averageResponseTime: 200, // 200ms
    p95ResponseTime: 400, // 400ms
    p99ResponseTime: 480, // 480ms
    maxErrorRate: 5 // 5%
  },

  // Performance tests - acceptable performance
  PERFORMANCE: {
    maxResponseTime: 1000, // 1s
    averageResponseTime: 500, // 500ms
    p95ResponseTime: 800, // 800ms
    p99ResponseTime: 950, // 950ms
    maxErrorRate: 10 // 10%
  },

  // Load tests - under load conditions
  LOAD: {
    maxResponseTime: 2000, // 2s
    averageResponseTime: 1000, // 1s
    p95ResponseTime: 1500, // 1.5s
    p99ResponseTime: 1800, // 1.8s
    maxErrorRate: 15 // 15%
  },

  // Stress tests - extreme conditions
  STRESS: {
    maxResponseTime: 5000, // 5s
    averageResponseTime: 2000, // 2s
    p95ResponseTime: 3500, // 3.5s
    p99ResponseTime: 4500, // 4.5s
    maxErrorRate: 25 // 25%
  }
};
