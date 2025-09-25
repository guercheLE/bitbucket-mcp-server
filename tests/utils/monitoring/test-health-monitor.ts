/**
 * Test Health Monitoring System
 * 
 * This module provides comprehensive monitoring capabilities for test health,
 * including performance metrics, flakiness detection, and trend analysis.
 */

import { Logger } from '../../../src/types/logger';
import { createMockLogger } from '../mocks/logger.mock';

export interface TestExecutionMetrics {
  testName: string;
  executionTime: number;
  memoryUsage: number;
  cpuUsage: number;
  timestamp: Date;
  status: 'passed' | 'failed' | 'skipped';
  retryCount: number;
  errorMessage?: string;
  stackTrace?: string;
}

export interface TestHealthMetrics {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  flakyTests: number;
  averageExecutionTime: number;
  slowestTest: string;
  fastestTest: string;
  memoryPeak: number;
  cpuPeak: number;
  timestamp: Date;
}

export interface FlakyTestInfo {
  testName: string;
  flakinessRate: number;
  totalRuns: number;
  failureCount: number;
  lastFailure: Date;
  commonErrors: string[];
  trend: 'improving' | 'stable' | 'degrading';
}

export interface TestTrend {
  period: string;
  totalTests: number;
  passRate: number;
  averageExecutionTime: number;
  flakinessRate: number;
  memoryUsage: number;
  cpuUsage: number;
}

export class TestHealthMonitor {
  private metrics: TestExecutionMetrics[] = [];
  private flakyTests: Map<string, FlakyTestInfo> = new Map();
  private trends: TestTrend[] = [];
  private logger: Logger;
  private isMonitoring: boolean = false;
  private monitoringInterval?: NodeJS.Timeout;

  constructor(logger?: Logger) {
    this.logger = logger || createMockLogger();
  }

  /**
   * Start monitoring test health
   */
  startMonitoring(intervalMs: number = 60000): void {
    if (this.isMonitoring) {
      this.logger.warn('Test health monitoring is already running');
      return;
    }

    this.isMonitoring = true;
    this.logger.info('Starting test health monitoring', { intervalMs });

    this.monitoringInterval = setInterval(() => {
      this.analyzeHealth();
    }, intervalMs);
  }

  /**
   * Stop monitoring test health
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      this.logger.warn('Test health monitoring is not running');
      return;
    }

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    this.logger.info('Stopped test health monitoring');
  }

  /**
   * Record test execution metrics
   */
  recordTestExecution(metrics: Omit<TestExecutionMetrics, 'timestamp'>): void {
    const fullMetrics: TestExecutionMetrics = {
      ...metrics,
      timestamp: new Date()
    };

    this.metrics.push(fullMetrics);
    this.updateFlakyTestInfo(fullMetrics);

    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    this.logger.debug('Recorded test execution metrics', {
      testName: fullMetrics.testName,
      executionTime: fullMetrics.executionTime,
      status: fullMetrics.status
    });
  }

  /**
   * Get current test health metrics
   */
  getHealthMetrics(): TestHealthMetrics {
    const recentMetrics = this.getRecentMetrics(24 * 60 * 60 * 1000); // Last 24 hours

    const totalTests = recentMetrics.length;
    const passedTests = recentMetrics.filter(m => m.status === 'passed').length;
    const failedTests = recentMetrics.filter(m => m.status === 'failed').length;
    const skippedTests = recentMetrics.filter(m => m.status === 'skipped').length;
    const flakyTests = Array.from(this.flakyTests.values()).filter(f => f.flakinessRate > 0.1).length;

    const executionTimes = recentMetrics.map(m => m.executionTime);
    const averageExecutionTime = executionTimes.length > 0 
      ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length 
      : 0;

    const slowestTest = recentMetrics.reduce((slowest, current) => 
      current.executionTime > slowest.executionTime ? current : slowest, 
      recentMetrics[0] || { testName: 'N/A', executionTime: 0 }
    ).testName;

    const fastestTest = recentMetrics.reduce((fastest, current) => 
      current.executionTime < fastest.executionTime ? current : fastest, 
      recentMetrics[0] || { testName: 'N/A', executionTime: Infinity }
    ).testName;

    const memoryPeak = Math.max(...recentMetrics.map(m => m.memoryUsage));
    const cpuPeak = Math.max(...recentMetrics.map(m => m.cpuUsage));

    return {
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      flakyTests,
      averageExecutionTime,
      slowestTest,
      fastestTest,
      memoryPeak,
      cpuPeak,
      timestamp: new Date()
    };
  }

  /**
   * Get flaky tests information
   */
  getFlakyTests(): FlakyTestInfo[] {
    return Array.from(this.flakyTests.values())
      .filter(test => test.flakinessRate > 0.05) // 5% flakiness threshold
      .sort((a, b) => b.flakinessRate - a.flakinessRate);
  }

  /**
   * Get test trends over time
   */
  getTrends(periodHours: number = 24): TestTrend[] {
    const periodMs = periodHours * 60 * 60 * 1000;
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - periodMs);

    const hourlyTrends: TestTrend[] = [];
    
    for (let i = 0; i < periodHours; i++) {
      const hourStart = new Date(startTime.getTime() + i * 60 * 60 * 1000);
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
      
      const hourMetrics = this.metrics.filter(m => 
        m.timestamp >= hourStart && m.timestamp < hourEnd
      );

      const totalTests = hourMetrics.length;
      const passRate = totalTests > 0 
        ? hourMetrics.filter(m => m.status === 'passed').length / totalTests 
        : 0;
      
      const averageExecutionTime = hourMetrics.length > 0
        ? hourMetrics.reduce((sum, m) => sum + m.executionTime, 0) / hourMetrics.length
        : 0;

      const flakinessRate = this.calculateFlakinessRate(hourMetrics);
      const memoryUsage = hourMetrics.length > 0
        ? hourMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / hourMetrics.length
        : 0;
      const cpuUsage = hourMetrics.length > 0
        ? hourMetrics.reduce((sum, m) => sum + m.cpuUsage, 0) / hourMetrics.length
        : 0;

      hourlyTrends.push({
        period: hourStart.toISOString(),
        totalTests,
        passRate,
        averageExecutionTime,
        flakinessRate,
        memoryUsage,
        cpuUsage
      });
    }

    return hourlyTrends;
  }

  /**
   * Analyze test health and generate alerts
   */
  private analyzeHealth(): void {
    const healthMetrics = this.getHealthMetrics();
    const flakyTests = this.getFlakyTests();
    const trends = this.getTrends(1); // Last hour

    // Check for health issues
    this.checkHealthIssues(healthMetrics, flakyTests, trends);

    // Update trends
    this.trends.push({
      period: new Date().toISOString(),
      totalTests: healthMetrics.totalTests,
      passRate: healthMetrics.passedTests / Math.max(healthMetrics.totalTests, 1),
      averageExecutionTime: healthMetrics.averageExecutionTime,
      flakinessRate: flakyTests.length / Math.max(healthMetrics.totalTests, 1),
      memoryUsage: healthMetrics.memoryPeak,
      cpuUsage: healthMetrics.cpuPeak
    });

    // Keep only last 168 trends (1 week of hourly data)
    if (this.trends.length > 168) {
      this.trends = this.trends.slice(-168);
    }
  }

  /**
   * Check for health issues and generate alerts
   */
  private checkHealthIssues(
    healthMetrics: TestHealthMetrics, 
    flakyTests: FlakyTestInfo[], 
    trends: TestTrend[]
  ): void {
    // Check pass rate
    const passRate = healthMetrics.passedTests / Math.max(healthMetrics.totalTests, 1);
    if (passRate < 0.9) {
      this.logger.warn('Low test pass rate detected', {
        passRate,
        totalTests: healthMetrics.totalTests,
        failedTests: healthMetrics.failedTests
      });
    }

    // Check flaky tests
    if (flakyTests.length > 0) {
      this.logger.warn('Flaky tests detected', {
        flakyTestCount: flakyTests.length,
        flakyTests: flakyTests.map(t => ({
          name: t.testName,
          rate: t.flakinessRate
        }))
      });
    }

    // Check execution time
    if (healthMetrics.averageExecutionTime > 5000) { // 5 seconds
      this.logger.warn('Slow test execution detected', {
        averageExecutionTime: healthMetrics.averageExecutionTime,
        slowestTest: healthMetrics.slowestTest
      });
    }

    // Check memory usage
    if (healthMetrics.memoryPeak > 1024 * 1024 * 1024) { // 1GB
      this.logger.warn('High memory usage detected', {
        memoryPeak: healthMetrics.memoryPeak,
        memoryPeakMB: Math.round(healthMetrics.memoryPeak / 1024 / 1024)
      });
    }

    // Check trends
    if (trends.length >= 2) {
      const currentTrend = trends[trends.length - 1];
      const previousTrend = trends[trends.length - 2];
      
      if (currentTrend.passRate < previousTrend.passRate - 0.1) {
        this.logger.warn('Declining test pass rate trend', {
          currentPassRate: currentTrend.passRate,
          previousPassRate: previousTrend.passRate,
          decline: previousTrend.passRate - currentTrend.passRate
        });
      }
    }
  }

  /**
   * Update flaky test information
   */
  private updateFlakyTestInfo(metrics: TestExecutionMetrics): void {
    const testName = metrics.testName;
    const existing = this.flakyTests.get(testName);

    if (!existing) {
      this.flakyTests.set(testName, {
        testName,
        flakinessRate: metrics.status === 'failed' ? 1 : 0,
        totalRuns: 1,
        failureCount: metrics.status === 'failed' ? 1 : 0,
        lastFailure: metrics.status === 'failed' ? metrics.timestamp : new Date(0),
        commonErrors: metrics.status === 'failed' ? [metrics.errorMessage || 'Unknown error'] : [],
        trend: 'stable'
      });
    } else {
      existing.totalRuns++;
      if (metrics.status === 'failed') {
        existing.failureCount++;
        existing.lastFailure = metrics.timestamp;
        if (metrics.errorMessage && !existing.commonErrors.includes(metrics.errorMessage)) {
          existing.commonErrors.push(metrics.errorMessage);
        }
      }
      
      existing.flakinessRate = existing.failureCount / existing.totalRuns;
      
      // Determine trend (simplified)
      if (existing.flakinessRate > 0.2) {
        existing.trend = 'degrading';
      } else if (existing.flakinessRate < 0.05) {
        existing.trend = 'improving';
      } else {
        existing.trend = 'stable';
      }
    }
  }

  /**
   * Get recent metrics within specified time window
   */
  private getRecentMetrics(timeWindowMs: number): TestExecutionMetrics[] {
    const cutoffTime = new Date(Date.now() - timeWindowMs);
    return this.metrics.filter(m => m.timestamp >= cutoffTime);
  }

  /**
   * Calculate flakiness rate for a set of metrics
   */
  private calculateFlakinessRate(metrics: TestExecutionMetrics[]): number {
    if (metrics.length === 0) return 0;
    
    const testGroups = new Map<string, TestExecutionMetrics[]>();
    metrics.forEach(m => {
      const group = testGroups.get(m.testName) || [];
      group.push(m);
      testGroups.set(m.testName, group);
    });

    let totalFlakiness = 0;
    let testCount = 0;

    testGroups.forEach(testMetrics => {
      const failureRate = testMetrics.filter(m => m.status === 'failed').length / testMetrics.length;
      if (failureRate > 0 && failureRate < 1) { // Flaky if sometimes fails, sometimes passes
        totalFlakiness += failureRate;
        testCount++;
      }
    });

    return testCount > 0 ? totalFlakiness / testCount : 0;
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(): {
    healthMetrics: TestHealthMetrics;
    flakyTests: FlakyTestInfo[];
    trends: TestTrend[];
    rawMetrics: TestExecutionMetrics[];
  } {
    return {
      healthMetrics: this.getHealthMetrics(),
      flakyTests: this.getFlakyTests(),
      trends: this.trends,
      rawMetrics: [...this.metrics]
    };
  }

  /**
   * Clear all metrics (useful for testing)
   */
  clearMetrics(): void {
    this.metrics = [];
    this.flakyTests.clear();
    this.trends = [];
    this.logger.info('Cleared all test health metrics');
  }
}

// Global instance for easy access
let globalTestHealthMonitor: TestHealthMonitor | null = null;

/**
 * Get or create the global test health monitor instance
 */
export function getTestHealthMonitor(): TestHealthMonitor {
  if (!globalTestHealthMonitor) {
    globalTestHealthMonitor = new TestHealthMonitor();
  }
  return globalTestHealthMonitor;
}

/**
 * Initialize test health monitoring
 */
export function initializeTestHealthMonitoring(intervalMs: number = 60000): void {
  const monitor = getTestHealthMonitor();
  monitor.startMonitoring(intervalMs);
}

/**
 * Stop test health monitoring
 */
export function stopTestHealthMonitoring(): void {
  if (globalTestHealthMonitor) {
    globalTestHealthMonitor.stopMonitoring();
  }
}

/**
 * Record test execution metrics
 */
export function recordTestExecution(metrics: Omit<TestExecutionMetrics, 'timestamp'>): void {
  const monitor = getTestHealthMonitor();
  monitor.recordTestExecution(metrics);
}

/**
 * Get current test health status
 */
export function getTestHealthStatus(): TestHealthMetrics {
  const monitor = getTestHealthMonitor();
  return monitor.getHealthMetrics();
}
