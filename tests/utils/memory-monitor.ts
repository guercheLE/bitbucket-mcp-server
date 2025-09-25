/**
 * Memory Monitoring Utilities for MCP Server Tests
 * 
 * Provides comprehensive memory monitoring capabilities including:
 * - Real-time memory usage tracking
 * - Memory leak detection
 * - Performance impact analysis
 * - Detailed memory reports
 */

export interface MemorySnapshot {
  /** Timestamp of the snapshot */
  timestamp: number;
  /** Heap used in bytes */
  heapUsed: number;
  /** Heap total in bytes */
  heapTotal: number;
  /** External memory in bytes */
  external: number;
  /** Resident set size in bytes */
  rss: number;
  /** Array buffers in bytes */
  arrayBuffers: number;
  /** Human readable heap used */
  heapUsedMB: number;
  /** Human readable heap total */
  heapTotalMB: number;
  /** Human readable RSS */
  rssMB: number;
}

export interface MemoryReport {
  /** Initial memory snapshot */
  initial: MemorySnapshot;
  /** Final memory snapshot */
  final: MemorySnapshot;
  /** Peak memory usage during monitoring */
  peak: MemorySnapshot;
  /** Memory increase from initial to final */
  memoryIncrease: number;
  /** Memory increase in MB */
  memoryIncreaseMB: number;
  /** Peak memory increase from initial */
  peakMemoryIncrease: number;
  /** Peak memory increase in MB */
  peakMemoryIncreaseMB: number;
  /** All snapshots taken during monitoring */
  snapshots: MemorySnapshot[];
  /** Memory growth rate (bytes per second) */
  growthRate: number;
  /** Memory growth rate (MB per second) */
  growthRateMB: number;
  /** Test duration in milliseconds */
  duration: number;
  /** Whether memory usage is within acceptable limits */
  withinLimits: boolean;
  /** Memory efficiency score (0-100) */
  efficiencyScore: number;
}

export interface MemoryLimits {
  /** Maximum allowed memory increase in MB */
  maxMemoryIncreaseMB: number;
  /** Maximum allowed peak memory increase in MB */
  maxPeakMemoryIncreaseMB: number;
  /** Maximum allowed growth rate in MB/s */
  maxGrowthRateMB: number;
  /** Maximum allowed heap usage in MB */
  maxHeapUsageMB: number;
}

export class MemoryMonitor {
  private snapshots: MemorySnapshot[] = [];
  private startTime: number = 0;
  private isMonitoring: boolean = false;
  private defaultLimits: MemoryLimits = {
    maxMemoryIncreaseMB: 100,
    maxPeakMemoryIncreaseMB: 200,
    maxGrowthRateMB: 10,
    maxHeapUsageMB: 500
  };

  /**
   * Start monitoring memory usage
   */
  start(): void {
    if (this.isMonitoring) {
      throw new Error('Memory monitoring is already active');
    }

    this.snapshots = [];
    this.startTime = Date.now();
    this.isMonitoring = true;
    
    // Take initial snapshot
    this.takeSnapshot();
  }

  /**
   * Stop monitoring memory usage
   */
  stop(): MemoryReport {
    if (!this.isMonitoring) {
      throw new Error('Memory monitoring is not active');
    }

    // Take final snapshot
    this.takeSnapshot();
    this.isMonitoring = false;

    return this.generateReport();
  }

  /**
   * Take a memory snapshot
   */
  takeSnapshot(): MemorySnapshot {
    if (!this.isMonitoring) {
      throw new Error('Memory monitoring is not active');
    }

    const memoryUsage = process.memoryUsage();
    const timestamp = Date.now();
    
    const snapshot: MemorySnapshot = {
      timestamp,
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external,
      rss: memoryUsage.rss,
      arrayBuffers: memoryUsage.arrayBuffers,
      heapUsedMB: this.bytesToMB(memoryUsage.heapUsed),
      heapTotalMB: this.bytesToMB(memoryUsage.heapTotal),
      rssMB: this.bytesToMB(memoryUsage.rss)
    };

    this.snapshots.push(snapshot);
    return snapshot;
  }

  /**
   * Get current memory usage
   */
  getCurrentMemory(): MemorySnapshot {
    const memoryUsage = process.memoryUsage();
    const timestamp = Date.now();
    
    return {
      timestamp,
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external,
      rss: memoryUsage.rss,
      arrayBuffers: memoryUsage.arrayBuffers,
      heapUsedMB: this.bytesToMB(memoryUsage.heapUsed),
      heapTotalMB: this.bytesToMB(memoryUsage.heapTotal),
      rssMB: this.bytesToMB(memoryUsage.rss)
    };
  }

  /**
   * Generate a comprehensive memory report
   */
  generateReport(limits?: Partial<MemoryLimits>): MemoryReport {
    if (this.snapshots.length < 2) {
      throw new Error('At least 2 snapshots required to generate report');
    }

    const finalLimits = { ...this.defaultLimits, ...limits };
    const initial = this.snapshots[0];
    const final = this.snapshots[this.snapshots.length - 1];
    
    // Find peak memory usage
    const peak = this.snapshots.reduce((max, snapshot) => 
      snapshot.heapUsed > max.heapUsed ? snapshot : max
    );

    const memoryIncrease = final.heapUsed - initial.heapUsed;
    const memoryIncreaseMB = this.bytesToMB(memoryIncrease);
    const peakMemoryIncrease = peak.heapUsed - initial.heapUsed;
    const peakMemoryIncreaseMB = this.bytesToMB(peakMemoryIncrease);
    
    const duration = final.timestamp - initial.timestamp;
    const growthRate = duration > 0 ? memoryIncrease / (duration / 1000) : 0;
    const growthRateMB = this.bytesToMB(growthRate);

    // Calculate efficiency score
    const efficiencyScore = this.calculateEfficiencyScore(
      memoryIncreaseMB,
      peakMemoryIncreaseMB,
      growthRateMB,
      final.heapUsedMB,
      finalLimits
    );

    // Check if within limits
    const withinLimits = 
      memoryIncreaseMB <= finalLimits.maxMemoryIncreaseMB &&
      peakMemoryIncreaseMB <= finalLimits.maxPeakMemoryIncreaseMB &&
      growthRateMB <= finalLimits.maxGrowthRateMB &&
      final.heapUsedMB <= finalLimits.maxHeapUsageMB;

    return {
      initial,
      final,
      peak,
      memoryIncrease,
      memoryIncreaseMB,
      peakMemoryIncrease,
      peakMemoryIncreaseMB,
      snapshots: [...this.snapshots],
      growthRate,
      growthRateMB,
      duration,
      withinLimits,
      efficiencyScore
    };
  }

  /**
   * Calculate memory efficiency score (0-100)
   */
  private calculateEfficiencyScore(
    memoryIncreaseMB: number,
    peakMemoryIncreaseMB: number,
    growthRateMB: number,
    finalHeapMB: number,
    limits: MemoryLimits
  ): number {
    const memoryScore = Math.max(0, 100 - (memoryIncreaseMB / limits.maxMemoryIncreaseMB) * 100);
    const peakScore = Math.max(0, 100 - (peakMemoryIncreaseMB / limits.maxPeakMemoryIncreaseMB) * 100);
    const growthScore = Math.max(0, 100 - (growthRateMB / limits.maxGrowthRateMB) * 100);
    const heapScore = Math.max(0, 100 - (finalHeapMB / limits.maxHeapUsageMB) * 100);
    
    return Math.round((memoryScore + peakScore + growthScore + heapScore) / 4);
  }

  /**
   * Convert bytes to megabytes
   */
  private bytesToMB(bytes: number): number {
    return Math.round((bytes / 1024 / 1024) * 100) / 100;
  }

  /**
   * Check if memory usage is within limits
   */
  isWithinLimits(limits?: Partial<MemoryLimits>): boolean {
    if (this.snapshots.length < 2) {
      return true; // Not enough data to determine
    }

    const report = this.generateReport(limits);
    return report.withinLimits;
  }

  /**
   * Get memory usage trend
   */
  getMemoryTrend(): 'increasing' | 'decreasing' | 'stable' {
    if (this.snapshots.length < 3) {
      return 'stable';
    }

    const recent = this.snapshots.slice(-3);
    const trend = recent[2].heapUsed - recent[0].heapUsed;
    const threshold = 1024 * 1024; // 1MB threshold

    if (trend > threshold) return 'increasing';
    if (trend < -threshold) return 'decreasing';
    return 'stable';
  }

  /**
   * Force garbage collection (if available)
   */
  forceGC(): void {
    if (global.gc) {
      global.gc();
    }
  }

  /**
   * Get memory statistics summary
   */
  getMemorySummary(): string {
    if (this.snapshots.length === 0) {
      return 'No memory data available';
    }

    const current = this.getCurrentMemory();
    const trend = this.getMemoryTrend();
    
    return `
Memory Summary:
- Current Heap: ${current.heapUsedMB}MB / ${current.heapTotalMB}MB
- RSS: ${current.rssMB}MB
- Trend: ${trend}
- Snapshots: ${this.snapshots.length}
    `.trim();
  }

  /**
   * Create a memory report as a formatted string
   */
  generateFormattedReport(limits?: Partial<MemoryLimits>): string {
    const report = this.generateReport(limits);
    
    return `
Memory Monitoring Report
========================

Test Duration: ${report.duration}ms

Initial Memory:
- Heap Used: ${report.initial.heapUsedMB}MB
- Heap Total: ${report.initial.heapTotalMB}MB
- RSS: ${report.initial.rssMB}MB

Final Memory:
- Heap Used: ${report.final.heapUsedMB}MB
- Heap Total: ${report.final.heapTotalMB}MB
- RSS: ${report.final.rssMB}MB

Peak Memory:
- Heap Used: ${report.peak.heapUsedMB}MB
- Heap Total: ${report.peak.heapTotalMB}MB
- RSS: ${report.peak.rssMB}MB

Memory Changes:
- Memory Increase: ${report.memoryIncreaseMB}MB
- Peak Memory Increase: ${report.peakMemoryIncreaseMB}MB
- Growth Rate: ${report.growthRateMB}MB/s

Performance:
- Efficiency Score: ${report.efficiencyScore}/100
- Within Limits: ${report.withinLimits ? 'Yes' : 'No'}
- Snapshots Taken: ${report.snapshots.length}

Memory Trend: ${this.getMemoryTrend()}
    `.trim();
  }
}

/**
 * Utility function to monitor memory during a test
 */
export async function monitorMemory<T>(
  testFunction: () => Promise<T>,
  limits?: Partial<MemoryLimits>
): Promise<{ result: T; memoryReport: MemoryReport }> {
  const monitor = new MemoryMonitor();
  
  try {
    monitor.start();
    const result = await testFunction();
    const memoryReport = monitor.stop();
    
    return { result, memoryReport };
  } catch (error) {
    monitor.stop(); // Ensure monitoring is stopped
    throw error;
  }
}

/**
 * Utility function to monitor memory during a synchronous test
 */
export function monitorMemorySync<T>(
  testFunction: () => T,
  limits?: Partial<MemoryLimits>
): { result: T; memoryReport: MemoryReport } {
  const monitor = new MemoryMonitor();
  
  try {
    monitor.start();
    const result = testFunction();
    const memoryReport = monitor.stop();
    
    return { result, memoryReport };
  } catch (error) {
    monitor.stop(); // Ensure monitoring is stopped
    throw error;
  }
}

/**
 * Default memory limits for different test types
 */
export const MEMORY_LIMITS = {
  /** Limits for unit tests */
  UNIT: {
    maxMemoryIncreaseMB: 10,
    maxPeakMemoryIncreaseMB: 20,
    maxGrowthRateMB: 1,
    maxHeapUsageMB: 100
  },
  
  /** Limits for integration tests */
  INTEGRATION: {
    maxMemoryIncreaseMB: 50,
    maxPeakMemoryIncreaseMB: 100,
    maxGrowthRateMB: 5,
    maxHeapUsageMB: 300
  },
  
  /** Limits for performance tests */
  PERFORMANCE: {
    maxMemoryIncreaseMB: 100,
    maxPeakMemoryIncreaseMB: 200,
    maxGrowthRateMB: 10,
    maxHeapUsageMB: 500
  },
  
  /** Limits for load tests */
  LOAD: {
    maxMemoryIncreaseMB: 200,
    maxPeakMemoryIncreaseMB: 400,
    maxGrowthRateMB: 20,
    maxHeapUsageMB: 1000
  }
};
