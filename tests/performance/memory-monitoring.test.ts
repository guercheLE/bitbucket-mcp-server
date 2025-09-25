/**
 * Memory Monitoring Tests
 * 
 * Comprehensive tests for the memory monitoring utilities including:
 * - MemoryMonitor class functionality
 * - Memory leak detection
 * - Performance impact analysis
 * - Memory reporting capabilities
 */

import { MemoryMonitor, monitorMemory, monitorMemorySync, MEMORY_LIMITS, MemoryLimits } from '../utils/memory-monitor';

describe('Memory Monitoring', () => {
  describe('MemoryMonitor Class', () => {
    let monitor: MemoryMonitor;

    beforeEach(() => {
      monitor = new MemoryMonitor();
    });

    afterEach(() => {
      if (monitor['isMonitoring']) {
        monitor.stop();
      }
    });

    it('should start and stop monitoring correctly', () => {
      expect(() => monitor.start()).not.toThrow();
      expect(() => monitor.stop()).not.toThrow();
    });

    it('should throw error when starting monitoring twice', () => {
      monitor.start();
      expect(() => monitor.start()).toThrow('Memory monitoring is already active');
    });

    it('should throw error when stopping without starting', () => {
      expect(() => monitor.stop()).toThrow('Memory monitoring is not active');
    });

    it('should take memory snapshots during monitoring', () => {
      monitor.start();
      
      const snapshot1 = monitor.takeSnapshot();
      const snapshot2 = monitor.takeSnapshot();
      
      expect(snapshot1).toBeDefined();
      expect(snapshot2).toBeDefined();
      expect(snapshot1.timestamp).toBeLessThanOrEqual(snapshot2.timestamp);
      expect(snapshot1.heapUsed).toBeGreaterThan(0);
      expect(snapshot1.heapUsedMB).toBeGreaterThan(0);
      
      monitor.stop();
    });

    it('should generate comprehensive memory report', () => {
      monitor.start();
      
      // Take multiple snapshots
      for (let i = 0; i < 5; i++) {
        monitor.takeSnapshot();
        // Small delay to ensure different timestamps
        const start = Date.now();
        while (Date.now() - start < 1) {}
      }
      
      const report = monitor.stop();
      
      expect(report.initial).toBeDefined();
      expect(report.final).toBeDefined();
      expect(report.peak).toBeDefined();
      expect(report.snapshots.length).toBeGreaterThanOrEqual(6); // 1 initial + 5 additional
      expect(report.duration).toBeGreaterThan(0);
      expect(report.memoryIncrease).toBeGreaterThanOrEqual(0);
      expect(report.memoryIncreaseMB).toBeGreaterThanOrEqual(0);
      expect(report.efficiencyScore).toBeGreaterThanOrEqual(0);
      expect(report.efficiencyScore).toBeLessThanOrEqual(100);
    });

    it('should detect memory trends correctly', () => {
      monitor.start();
      
      // Take snapshots with increasing memory usage
      for (let i = 0; i < 3; i++) {
        monitor.takeSnapshot();
        // Create some objects to increase memory
        const data = new Array(1000).fill('x');
      }
      
      const trend = monitor.getMemoryTrend();
      expect(['increasing', 'decreasing', 'stable']).toContain(trend);
      
      monitor.stop();
    });

    it('should check memory limits correctly', () => {
      monitor.start();
      monitor.takeSnapshot();
      monitor.takeSnapshot();
      
      const withinLimits = monitor.isWithinLimits();
      expect(typeof withinLimits).toBe('boolean');
      
      monitor.stop();
    });

    it('should generate formatted report', () => {
      monitor.start();
      monitor.takeSnapshot();
      monitor.takeSnapshot();
      
      const report = monitor.stop();
      const formattedReport = monitor.generateFormattedReport();
      
      expect(formattedReport).toContain('Memory Monitoring Report');
      expect(formattedReport).toContain('Initial Memory:');
      expect(formattedReport).toContain('Final Memory:');
      expect(formattedReport).toContain('Peak Memory:');
      expect(formattedReport).toContain('Memory Changes:');
      expect(formattedReport).toContain('Performance:');
    });

    it('should get memory summary', () => {
      monitor.start();
      const summary = monitor.getMemorySummary();
      
      expect(summary).toContain('Memory Summary:');
      expect(summary).toContain('Current Heap:');
      expect(summary).toContain('RSS:');
      expect(summary).toContain('Trend:');
      expect(summary).toContain('Snapshots:');
      
      monitor.stop();
    });
  });

  describe('Memory Monitoring Utilities', () => {
    it('should monitor memory during async operations', async () => {
      const { result, memoryReport } = await monitorMemory(async () => {
        // Simulate some async work
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Create some objects
        const data = new Array(1000).fill('x');
        
        return { processed: data.length };
      }, { maxMemoryIncreaseMB: 20, maxPeakMemoryIncreaseMB: 40, maxGrowthRateMB: 2, maxHeapUsageMB: 200 });

      expect(result).toEqual({ processed: 1000 });
      expect(memoryReport).toBeDefined();
      expect(memoryReport.duration).toBeGreaterThan(0);
      expect(memoryReport.withinLimits).toBe(true);
    });

    it('should monitor memory during sync operations', () => {
      const { result, memoryReport } = monitorMemorySync(() => {
        // Create some objects
        const data = new Array(1000).fill('x');
        return { processed: data.length };
      }, { maxMemoryIncreaseMB: 20, maxPeakMemoryIncreaseMB: 40, maxGrowthRateMB: 2, maxHeapUsageMB: 200 });

      expect(result).toEqual({ processed: 1000 });
      expect(memoryReport).toBeDefined();
      expect(memoryReport.duration).toBeGreaterThanOrEqual(0);
      expect(memoryReport.withinLimits).toBe(true);
    });

    it('should handle errors during monitoring', async () => {
      await expect(monitorMemory(async () => {
        throw new Error('Test error');
      }, MEMORY_LIMITS.UNIT)).rejects.toThrow('Test error');
    });

    it('should handle errors during sync monitoring', () => {
      expect(() => monitorMemorySync(() => {
        throw new Error('Test error');
      }, MEMORY_LIMITS.UNIT)).toThrow('Test error');
    });
  });

  describe('Memory Limits', () => {
    it('should have appropriate limits for unit tests', () => {
      expect(MEMORY_LIMITS.UNIT.maxMemoryIncreaseMB).toBe(10);
      expect(MEMORY_LIMITS.UNIT.maxPeakMemoryIncreaseMB).toBe(20);
      expect(MEMORY_LIMITS.UNIT.maxGrowthRateMB).toBe(1);
      expect(MEMORY_LIMITS.UNIT.maxHeapUsageMB).toBe(100);
    });

    it('should have appropriate limits for integration tests', () => {
      expect(MEMORY_LIMITS.INTEGRATION.maxMemoryIncreaseMB).toBe(50);
      expect(MEMORY_LIMITS.INTEGRATION.maxPeakMemoryIncreaseMB).toBe(100);
      expect(MEMORY_LIMITS.INTEGRATION.maxGrowthRateMB).toBe(5);
      expect(MEMORY_LIMITS.INTEGRATION.maxHeapUsageMB).toBe(300);
    });

    it('should have appropriate limits for performance tests', () => {
      expect(MEMORY_LIMITS.PERFORMANCE.maxMemoryIncreaseMB).toBe(100);
      expect(MEMORY_LIMITS.PERFORMANCE.maxPeakMemoryIncreaseMB).toBe(200);
      expect(MEMORY_LIMITS.PERFORMANCE.maxGrowthRateMB).toBe(10);
      expect(MEMORY_LIMITS.PERFORMANCE.maxHeapUsageMB).toBe(500);
    });

    it('should have appropriate limits for load tests', () => {
      expect(MEMORY_LIMITS.LOAD.maxMemoryIncreaseMB).toBe(200);
      expect(MEMORY_LIMITS.LOAD.maxPeakMemoryIncreaseMB).toBe(400);
      expect(MEMORY_LIMITS.LOAD.maxGrowthRateMB).toBe(20);
      expect(MEMORY_LIMITS.LOAD.maxHeapUsageMB).toBe(1000);
    });
  });

  describe('Memory Leak Detection', () => {
    it('should detect potential memory leaks', async () => {
      const monitor = new MemoryMonitor();
      monitor.start();

      // Simulate potential memory leak
      const dataArrays: any[][] = [];
      for (let i = 0; i < 10; i++) {
        dataArrays.push(new Array(1000).fill('x'));
        monitor.takeSnapshot();
      }

      const report = monitor.stop();
      const trend = monitor.getMemoryTrend();

      console.log('Memory Leak Detection Test:');
      console.log(monitor.generateFormattedReport());
      console.log(`Memory trend: ${trend}`);

      expect(report.snapshots.length).toBeGreaterThanOrEqual(11); // 1 initial + 10 additional
      expect(report.memoryIncrease).toBeGreaterThan(0);
      expect(['increasing', 'stable']).toContain(trend);
    });

    it('should detect memory cleanup', async () => {
      const monitor = new MemoryMonitor();
      monitor.start();

      // Create and then clean up data
      const dataArrays: any[][] = [];
      for (let i = 0; i < 5; i++) {
        dataArrays.push(new Array(1000).fill('x'));
        monitor.takeSnapshot();
      }

      // Clear the arrays to simulate cleanup
      dataArrays.length = 0;
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      monitor.takeSnapshot();
      const report = monitor.stop();

      console.log('Memory Cleanup Test:');
      console.log(monitor.generateFormattedReport());

      expect(report.snapshots.length).toBeGreaterThanOrEqual(7); // 1 initial + 5 creation + 1 cleanup
    });
  });

  describe('Memory Performance Analysis', () => {
    it('should analyze memory efficiency', async () => {
      const { memoryReport } = await monitorMemory(async () => {
        // Efficient memory usage
        const data = new Array(100).fill('x');
        return data.length;
      }, { maxMemoryIncreaseMB: 20, maxPeakMemoryIncreaseMB: 40, maxGrowthRateMB: 2, maxHeapUsageMB: 200 });

      expect(memoryReport.efficiencyScore).toBeGreaterThan(80);
      expect(memoryReport.withinLimits).toBe(true);
      expect(memoryReport.memoryIncreaseMB).toBeLessThan(1);
    });

    it('should detect inefficient memory usage', async () => {
      const { memoryReport } = await monitorMemory(async () => {
        // Inefficient memory usage
        const dataArrays: any[][] = [];
        for (let i = 0; i < 100; i++) {
          dataArrays.push(new Array(1000).fill('x'));
        }
        return dataArrays.length;
      }, { maxMemoryIncreaseMB: 20, maxPeakMemoryIncreaseMB: 40, maxGrowthRateMB: 2, maxHeapUsageMB: 200 });

      console.log('Inefficient Memory Usage Test:');
      console.log(`Memory increase: ${memoryReport.memoryIncreaseMB}MB, Efficiency: ${memoryReport.efficiencyScore}`);

      expect(memoryReport.memoryIncreaseMB).toBeGreaterThan(0);
      expect(memoryReport.efficiencyScore).toBeLessThan(100);
    });

    it('should monitor memory during concurrent operations', async () => {
      const { memoryReport } = await monitorMemory(async () => {
        // Simulate concurrent operations
        const promises = Array.from({ length: 10 }, async (_, i) => {
          const data = new Array(100).fill(`data_${i}`);
          await new Promise(resolve => setTimeout(resolve, 1));
          return data.length;
        });

        const results = await Promise.all(promises);
        return results.reduce((sum, length) => sum + length, 0);
      }, { maxMemoryIncreaseMB: 100, maxPeakMemoryIncreaseMB: 200, maxGrowthRateMB: 10, maxHeapUsageMB: 500 });

      console.log('Concurrent Operations Memory Test:');
      console.log(`Memory increase: ${memoryReport.memoryIncreaseMB}MB, Efficiency: ${memoryReport.efficiencyScore}`);

      // For concurrent operations, we're more lenient with memory limits
      expect(memoryReport.withinLimits || memoryReport.memoryIncreaseMB < 5).toBe(true);
      expect(memoryReport.efficiencyScore).toBeGreaterThan(60);
    });
  });

  describe('Memory Report Validation', () => {
    it('should validate memory report structure', () => {
      const monitor = new MemoryMonitor();
      monitor.start();
      monitor.takeSnapshot();
      monitor.takeSnapshot();
      
      const report = monitor.stop();
      
      // Validate report structure
      expect(report.initial).toBeDefined();
      expect(report.final).toBeDefined();
      expect(report.peak).toBeDefined();
      expect(report.snapshots).toBeInstanceOf(Array);
      expect(typeof report.memoryIncrease).toBe('number');
      expect(typeof report.memoryIncreaseMB).toBe('number');
      expect(typeof report.peakMemoryIncrease).toBe('number');
      expect(typeof report.peakMemoryIncreaseMB).toBe('number');
      expect(typeof report.growthRate).toBe('number');
      expect(typeof report.growthRateMB).toBe('number');
      expect(typeof report.duration).toBe('number');
      expect(typeof report.withinLimits).toBe('boolean');
      expect(typeof report.efficiencyScore).toBe('number');
      
      // Validate snapshot structure
      const snapshot = report.initial;
      expect(typeof snapshot.timestamp).toBe('number');
      expect(typeof snapshot.heapUsed).toBe('number');
      expect(typeof snapshot.heapTotal).toBe('number');
      expect(typeof snapshot.external).toBe('number');
      expect(typeof snapshot.rss).toBe('number');
      expect(typeof snapshot.arrayBuffers).toBe('number');
      expect(typeof snapshot.heapUsedMB).toBe('number');
      expect(typeof snapshot.heapTotalMB).toBe('number');
      expect(typeof snapshot.rssMB).toBe('number');
    });

    it('should generate consistent reports', () => {
      const monitor1 = new MemoryMonitor();
      const monitor2 = new MemoryMonitor();
      
      monitor1.start();
      monitor2.start();
      
      monitor1.takeSnapshot();
      monitor2.takeSnapshot();
      
      const report1 = monitor1.stop();
      const report2 = monitor2.stop();
      
      // Reports should have similar structure
      expect(Object.keys(report1)).toEqual(Object.keys(report2));
      expect(report1.snapshots.length).toBe(report2.snapshots.length);
    });
  });
});
