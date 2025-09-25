/**
 * Performance Metrics Collection for Tests
 * 
 * This module provides detailed performance monitoring capabilities
 * for test execution, including timing, memory, and resource usage.
 */

import { performance } from 'perf_hooks';
import { createMockLogger } from '../mocks/logger.mock';
import { Logger } from '../../../src/types/logger';

export interface PerformanceSnapshot {
  timestamp: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  eventLoopLag: number;
  activeHandles: number;
  activeRequests: number;
}

export interface TestPerformanceMetrics {
  testName: string;
  startTime: number;
  endTime: number;
  duration: number;
  memoryStart: NodeJS.MemoryUsage;
  memoryEnd: NodeJS.MemoryUsage;
  memoryDelta: NodeJS.MemoryUsage;
  cpuStart: NodeJS.CpuUsage;
  cpuEnd: NodeJS.CpuUsage;
  cpuDelta: NodeJS.CpuUsage;
  snapshots: PerformanceSnapshot[];
  eventLoopLag: number;
  activeHandles: number;
  activeRequests: number;
}

export interface PerformanceThresholds {
  maxExecutionTime: number; // milliseconds
  maxMemoryUsage: number; // bytes
  maxCpuUsage: number; // percentage
  maxEventLoopLag: number; // milliseconds
  maxActiveHandles: number;
  maxActiveRequests: number;
}

export interface PerformanceAlert {
  testName: string;
  threshold: string;
  actualValue: number;
  thresholdValue: number;
  severity: 'warning' | 'error' | 'critical';
  timestamp: Date;
  message: string;
}

export class PerformanceMetricsCollector {
  private logger: Logger;
  private thresholds: PerformanceThresholds;
  private alerts: PerformanceAlert[] = [];
  private isCollecting: boolean = false;
  private collectionInterval?: NodeJS.Timeout;
  private snapshots: PerformanceSnapshot[] = [];

  constructor(logger?: Logger, thresholds?: Partial<PerformanceThresholds>) {
    this.logger = logger || createMockLogger();
    this.thresholds = {
      maxExecutionTime: 5000, // 5 seconds
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB
      maxCpuUsage: 80, // 80%
      maxEventLoopLag: 100, // 100ms
      maxActiveHandles: 1000,
      maxActiveRequests: 1000,
      ...thresholds
    };
  }

  /**
   * Start collecting performance metrics
   */
  startCollection(intervalMs: number = 1000): void {
    if (this.isCollecting) {
      this.logger.warn('Performance metrics collection is already running');
      return;
    }

    this.isCollecting = true;
    this.logger.info('Starting performance metrics collection', { intervalMs });

    this.collectionInterval = setInterval(() => {
      this.collectSnapshot();
    }, intervalMs);
  }

  /**
   * Stop collecting performance metrics
   */
  stopCollection(): void {
    if (!this.isCollecting) {
      this.logger.warn('Performance metrics collection is not running');
      return;
    }

    this.isCollecting = false;
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = undefined;
    }

    this.logger.info('Stopped performance metrics collection');
  }

  /**
   * Measure test performance
   */
  async measureTestPerformance<T>(
    testName: string,
    testFunction: () => Promise<T>
  ): Promise<{ result: T; metrics: TestPerformanceMetrics }> {
    const startTime = performance.now();
    const memoryStart = process.memoryUsage();
    const cpuStart = process.cpuUsage();
    
    // Start collecting snapshots during test execution
    const testSnapshots: PerformanceSnapshot[] = [];
    const snapshotInterval = setInterval(() => {
      testSnapshots.push(this.createSnapshot());
    }, 100);

    try {
      const result = await testFunction();
      return {
        result,
        metrics: this.calculateTestMetrics(testName, startTime, memoryStart, cpuStart, testSnapshots)
      };
    } finally {
      clearInterval(snapshotInterval);
    }
  }

  /**
   * Create a performance snapshot
   */
  private createSnapshot(): PerformanceSnapshot {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Measure event loop lag
    const start = performance.now();
    setImmediate(() => {
      // This will be executed on the next tick
    });
    const eventLoopLag = performance.now() - start;

    return {
      timestamp: performance.now(),
      memoryUsage,
      cpuUsage,
      eventLoopLag,
      activeHandles: (process as any)._getActiveHandles().length,
      activeRequests: (process as any)._getActiveRequests().length
    };
  }

  /**
   * Collect a performance snapshot
   */
  private collectSnapshot(): void {
    const snapshot = this.createSnapshot();
    this.snapshots.push(snapshot);

    // Keep only last 1000 snapshots to prevent memory issues
    if (this.snapshots.length > 1000) {
      this.snapshots = this.snapshots.slice(-1000);
    }
  }

  /**
   * Calculate test performance metrics
   */
  private calculateTestMetrics(
    testName: string,
    startTime: number,
    memoryStart: NodeJS.MemoryUsage,
    cpuStart: NodeJS.CpuUsage,
    snapshots: PerformanceSnapshot[]
  ): TestPerformanceMetrics {
    const endTime = performance.now();
    const duration = endTime - startTime;
    const memoryEnd = process.memoryUsage();
    const cpuEnd = process.cpuUsage();

    const memoryDelta: NodeJS.MemoryUsage = {
      rss: memoryEnd.rss - memoryStart.rss,
      heapTotal: memoryEnd.heapTotal - memoryStart.heapTotal,
      heapUsed: memoryEnd.heapUsed - memoryStart.heapUsed,
      external: memoryEnd.external - memoryStart.external,
      arrayBuffers: memoryEnd.arrayBuffers - memoryStart.arrayBuffers
    };

    const cpuDelta: NodeJS.CpuUsage = {
      user: cpuEnd.user - cpuStart.user,
      system: cpuEnd.system - cpuStart.system
    };

    // Calculate average event loop lag
    const avgEventLoopLag = snapshots.length > 0
      ? snapshots.reduce((sum, s) => sum + s.eventLoopLag, 0) / snapshots.length
      : 0;

    // Get final active handles and requests
    const finalSnapshot = snapshots[snapshots.length - 1] || this.createSnapshot();

    const metrics: TestPerformanceMetrics = {
      testName,
      startTime,
      endTime,
      duration,
      memoryStart,
      memoryEnd,
      memoryDelta,
      cpuStart,
      cpuEnd,
      cpuDelta,
      snapshots,
      eventLoopLag: avgEventLoopLag,
      activeHandles: finalSnapshot.activeHandles,
      activeRequests: finalSnapshot.activeRequests
    };

    // Check thresholds and generate alerts
    this.checkPerformanceThresholds(metrics);

    return metrics;
  }

  /**
   * Check performance thresholds and generate alerts
   */
  private checkPerformanceThresholds(metrics: TestPerformanceMetrics): void {
    const alerts: PerformanceAlert[] = [];

    // Check execution time
    if (metrics.duration > this.thresholds.maxExecutionTime) {
      alerts.push({
        testName: metrics.testName,
        threshold: 'maxExecutionTime',
        actualValue: metrics.duration,
        thresholdValue: this.thresholds.maxExecutionTime,
        severity: metrics.duration > this.thresholds.maxExecutionTime * 2 ? 'critical' : 'error',
        timestamp: new Date(),
        message: `Test execution time ${metrics.duration}ms exceeds threshold ${this.thresholds.maxExecutionTime}ms`
      });
    }

    // Check memory usage
    if (metrics.memoryEnd.heapUsed > this.thresholds.maxMemoryUsage) {
      alerts.push({
        testName: metrics.testName,
        threshold: 'maxMemoryUsage',
        actualValue: metrics.memoryEnd.heapUsed,
        thresholdValue: this.thresholds.maxMemoryUsage,
        severity: metrics.memoryEnd.heapUsed > this.thresholds.maxMemoryUsage * 2 ? 'critical' : 'error',
        timestamp: new Date(),
        message: `Memory usage ${Math.round(metrics.memoryEnd.heapUsed / 1024 / 1024)}MB exceeds threshold ${Math.round(this.thresholds.maxMemoryUsage / 1024 / 1024)}MB`
      });
    }

    // Check CPU usage
    const cpuPercentage = (metrics.cpuDelta.user + metrics.cpuDelta.system) / 1000000; // Convert to seconds
    if (cpuPercentage > this.thresholds.maxCpuUsage) {
      alerts.push({
        testName: metrics.testName,
        threshold: 'maxCpuUsage',
        actualValue: cpuPercentage,
        thresholdValue: this.thresholds.maxCpuUsage,
        severity: cpuPercentage > this.thresholds.maxCpuUsage * 1.5 ? 'critical' : 'error',
        timestamp: new Date(),
        message: `CPU usage ${cpuPercentage.toFixed(2)}% exceeds threshold ${this.thresholds.maxCpuUsage}%`
      });
    }

    // Check event loop lag
    if (metrics.eventLoopLag > this.thresholds.maxEventLoopLag) {
      alerts.push({
        testName: metrics.testName,
        threshold: 'maxEventLoopLag',
        actualValue: metrics.eventLoopLag,
        thresholdValue: this.thresholds.maxEventLoopLag,
        severity: metrics.eventLoopLag > this.thresholds.maxEventLoopLag * 2 ? 'critical' : 'warning',
        timestamp: new Date(),
        message: `Event loop lag ${metrics.eventLoopLag.toFixed(2)}ms exceeds threshold ${this.thresholds.maxEventLoopLag}ms`
      });
    }

    // Check active handles
    if (metrics.activeHandles > this.thresholds.maxActiveHandles) {
      alerts.push({
        testName: metrics.testName,
        threshold: 'maxActiveHandles',
        actualValue: metrics.activeHandles,
        thresholdValue: this.thresholds.maxActiveHandles,
        severity: metrics.activeHandles > this.thresholds.maxActiveHandles * 2 ? 'critical' : 'warning',
        timestamp: new Date(),
        message: `Active handles ${metrics.activeHandles} exceeds threshold ${this.thresholds.maxActiveHandles}`
      });
    }

    // Check active requests
    if (metrics.activeRequests > this.thresholds.maxActiveRequests) {
      alerts.push({
        testName: metrics.testName,
        threshold: 'maxActiveRequests',
        actualValue: metrics.activeRequests,
        thresholdValue: this.thresholds.maxActiveRequests,
        severity: metrics.activeRequests > this.thresholds.maxActiveRequests * 2 ? 'critical' : 'warning',
        timestamp: new Date(),
        message: `Active requests ${metrics.activeRequests} exceeds threshold ${this.thresholds.maxActiveRequests}`
      });
    }

    // Add alerts and log them
    this.alerts.push(...alerts);
    alerts.forEach(alert => {
      this.logger.warn('Performance threshold exceeded', {
        testName: alert.testName,
        threshold: alert.threshold,
        actualValue: alert.actualValue,
        thresholdValue: alert.thresholdValue,
        severity: alert.severity,
        message: alert.message
      });
    });
  }

  /**
   * Get performance alerts
   */
  getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  /**
   * Get recent performance snapshots
   */
  getRecentSnapshots(count: number = 100): PerformanceSnapshot[] {
    return this.snapshots.slice(-count);
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    totalAlerts: number;
    criticalAlerts: number;
    errorAlerts: number;
    warningAlerts: number;
    averageMemoryUsage: number;
    averageCpuUsage: number;
    averageEventLoopLag: number;
  } {
    const recentSnapshots = this.getRecentSnapshots(100);
    
    const totalAlerts = this.alerts.length;
    const criticalAlerts = this.alerts.filter(a => a.severity === 'critical').length;
    const errorAlerts = this.alerts.filter(a => a.severity === 'error').length;
    const warningAlerts = this.alerts.filter(a => a.severity === 'warning').length;

    const averageMemoryUsage = recentSnapshots.length > 0
      ? recentSnapshots.reduce((sum, s) => sum + s.memoryUsage.heapUsed, 0) / recentSnapshots.length
      : 0;

    const averageCpuUsage = recentSnapshots.length > 0
      ? recentSnapshots.reduce((sum, s) => sum + (s.cpuUsage.user + s.cpuUsage.system), 0) / recentSnapshots.length / 1000000
      : 0;

    const averageEventLoopLag = recentSnapshots.length > 0
      ? recentSnapshots.reduce((sum, s) => sum + s.eventLoopLag, 0) / recentSnapshots.length
      : 0;

    return {
      totalAlerts,
      criticalAlerts,
      errorAlerts,
      warningAlerts,
      averageMemoryUsage,
      averageCpuUsage,
      averageEventLoopLag
    };
  }

  /**
   * Clear all performance data
   */
  clearData(): void {
    this.alerts = [];
    this.snapshots = [];
    this.logger.info('Cleared all performance metrics data');
  }

  /**
   * Update performance thresholds
   */
  updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    this.logger.info('Updated performance thresholds', { thresholds: this.thresholds });
  }
}

// Global instance for easy access
let globalPerformanceCollector: PerformanceMetricsCollector | null = null;

/**
 * Get or create the global performance metrics collector
 */
export function getPerformanceCollector(): PerformanceMetricsCollector {
  if (!globalPerformanceCollector) {
    globalPerformanceCollector = new PerformanceMetricsCollector();
  }
  return globalPerformanceCollector;
}

/**
 * Measure test performance with automatic metrics collection
 */
export async function measureTestPerformance<T>(
  testName: string,
  testFunction: () => Promise<T>
): Promise<{ result: T; metrics: TestPerformanceMetrics }> {
  const collector = getPerformanceCollector();
  return collector.measureTestPerformance(testName, testFunction);
}

/**
 * Start performance monitoring
 */
export function startPerformanceMonitoring(intervalMs: number = 1000): void {
  const collector = getPerformanceCollector();
  collector.startCollection(intervalMs);
}

/**
 * Stop performance monitoring
 */
export function stopPerformanceMonitoring(): void {
  if (globalPerformanceCollector) {
    globalPerformanceCollector.stopCollection();
  }
}

/**
 * Get performance alerts
 */
export function getPerformanceAlerts(): PerformanceAlert[] {
  const collector = getPerformanceCollector();
  return collector.getAlerts();
}

/**
 * Get performance statistics
 */
export function getPerformanceStats() {
  const collector = getPerformanceCollector();
  return collector.getPerformanceStats();
}
