/**
 * Example Usage of Test Health Monitoring System
 * 
 * This file demonstrates how to use the test health monitoring system
 * in your tests and CI/CD pipelines.
 */

import { 
  initializeMonitoringSystem, 
  shutdownMonitoringSystem, 
  recordTestExecution,
  getSystemStatus,
  TestHealthMonitoringSystem
} from '../utils/monitoring';

// Example 1: Basic setup and usage
export async function basicMonitoringExample() {
  console.log('=== Basic Monitoring Example ===');

  // Initialize the monitoring system
  await initializeMonitoringSystem({
    healthMonitoring: {
      intervalMs: 30000 // Check health every 30 seconds
    },
    performanceMonitoring: {
      intervalMs: 1000 // Collect performance data every second
    },
    dashboard: {
      port: 3001,
      host: 'localhost',
      refreshInterval: 5000
    },
    alerting: {
      enableConsole: true,
      enableFile: true,
      filePath: './logs/test-alerts.log'
    }
  });

  // Record a test execution
  const { result, metrics } = await recordTestExecution(
    'example-test',
    async () => {
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 100));
      return 'test result';
    }
  );

  console.log('Test result:', result);
  console.log('Performance metrics:', {
    duration: metrics.duration,
    memoryUsage: metrics.memoryEnd.heapUsed,
    cpuUsage: metrics.cpuDelta
  });

  // Get system status
  const status = getSystemStatus();
  console.log('System status:', status);

  // Shutdown when done
  await shutdownMonitoringSystem();
}

// Example 2: Custom monitoring system instance
export async function customMonitoringExample() {
  console.log('=== Custom Monitoring Example ===');

  const monitoringSystem = new TestHealthMonitoringSystem();

  // Initialize with custom configuration
  await monitoringSystem.initialize({
    dashboard: {
      port: 3002, // Different port
      host: '0.0.0.0' // Listen on all interfaces
    },
    alerting: {
      enableConsole: true,
      enableFile: false // Disable file logging
    }
  });

  // Add custom alert rule
  const alertSystem = monitoringSystem.getAlertSystem();
  alertSystem.addRule({
    id: 'custom-rule',
    name: 'Custom Test Rule',
    description: 'Custom alert rule for demonstration',
    condition: (data: any) => data.totalTests > 100,
    severity: 'warning',
    enabled: true,
    cooldownMs: 60000 // 1 minute cooldown
  });

  // Add webhook notification channel
  alertSystem.addChannel({
    id: 'webhook',
    name: 'Webhook Notifications',
    type: 'webhook',
    enabled: true,
    config: {
      url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    }
  });

  // Record multiple test executions
  for (let i = 0; i < 5; i++) {
    await monitoringSystem.recordTestExecution(
      `test-${i}`,
      async () => {
        // Simulate different test scenarios
        const delay = Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Simulate occasional failures
        if (Math.random() < 0.1) {
          throw new Error('Simulated test failure');
        }
        
        return `result-${i}`;
      }
    );
  }

  // Get comprehensive status
  const status = monitoringSystem.getSystemStatus();
  console.log('Custom system status:', status);

  // Shutdown
  await monitoringSystem.shutdown();
}

// Example 3: Integration with Jest tests
export function jestIntegrationExample() {
  console.log('=== Jest Integration Example ===');

  // This would typically be in your jest setup file
  beforeAll(async () => {
    await initializeMonitoringSystem({
      dashboard: {
        port: 3001
      },
      alerting: {
        enableConsole: true,
        enableFile: true
      }
    });
  });

  afterAll(async () => {
    await shutdownMonitoringSystem();
  });

  // Example test with monitoring
  it('should perform well with monitoring', async () => {
    const { result, metrics } = await recordTestExecution(
      'performance-test',
      async () => {
        // Your test logic here
        const startTime = Date.now();
        
        // Simulate some work
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const endTime = Date.now();
        return { duration: endTime - startTime };
      }
    );

    // Assert on both result and performance
    expect(result.duration).toBeLessThan(1000);
    expect(metrics.duration).toBeLessThan(1000);
    expect(metrics.memoryEnd.heapUsed).toBeLessThan(100 * 1024 * 1024); // 100MB
  });
}

// Example 4: CI/CD Pipeline Integration
export async function ciCdIntegrationExample() {
  console.log('=== CI/CD Integration Example ===');

  // Initialize monitoring for CI environment
  await initializeMonitoringSystem({
    healthMonitoring: {
      intervalMs: 60000 // Less frequent in CI
    },
    dashboard: {
      port: 0, // Let system choose port
      host: 'localhost'
    },
    alerting: {
      enableConsole: true,
      enableFile: true,
      filePath: process.env.CI ? '/tmp/test-alerts.log' : './logs/test-alerts.log'
    }
  });

  // Run your test suite
  const testResults = await runTestSuite();

  // Get final status
  const status = getSystemStatus();
  
  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    testResults,
    healthMetrics: status.healthMetrics,
    performanceStats: status.performanceStats,
    alertStats: status.alertStats,
    dashboardUrl: status.dashboardUrl
  };

  // Save report
  const fs = require('fs').promises;
  await fs.writeFile(
    './test-report.json',
    JSON.stringify(report, null, 2)
  );

  // Check for critical issues
  if (status.alertStats.criticalAlerts > 0) {
    console.error('Critical alerts detected:', status.alertStats.criticalAlerts);
    process.exit(1);
  }

  // Shutdown
  await shutdownMonitoringSystem();
}

// Example 5: Performance Testing with Monitoring
export async function performanceTestingExample() {
  console.log('=== Performance Testing Example ===');

  await initializeMonitoringSystem({
    performanceMonitoring: {
      intervalMs: 100 // High frequency for performance testing
    }
  });

  const performanceResults = [];

  // Run performance tests
  for (let i = 0; i < 10; i++) {
    const { result, metrics } = await recordTestExecution(
      `performance-test-${i}`,
      async () => {
        // Simulate different performance scenarios
        const iterations = 1000 + Math.random() * 9000;
        let sum = 0;
        
        for (let j = 0; j < iterations; j++) {
          sum += Math.random();
        }
        
        return { iterations, sum };
      }
    );

    performanceResults.push({
      test: `performance-test-${i}`,
      duration: metrics.duration,
      memoryUsage: metrics.memoryEnd.heapUsed,
      cpuUsage: metrics.cpuDelta
    });
  }

  // Analyze performance results
  const avgDuration = performanceResults.reduce((sum, r) => sum + r.duration, 0) / performanceResults.length;
  const maxMemory = Math.max(...performanceResults.map(r => r.memoryUsage));
  const avgCpu = performanceResults.reduce((sum, r) => sum + (r.cpuUsage.user + r.cpuUsage.system), 0) / performanceResults.length;

  console.log('Performance Analysis:', {
    averageDuration: avgDuration,
    maxMemoryUsage: maxMemory,
    averageCpuUsage: avgCpu / 1000000 // Convert to seconds
  });

  // Check performance thresholds
  if (avgDuration > 1000) {
    console.warn('Average test duration exceeds 1 second');
  }

  if (maxMemory > 50 * 1024 * 1024) {
    console.warn('Maximum memory usage exceeds 50MB');
  }

  await shutdownMonitoringSystem();
}

// Helper function to simulate running a test suite
async function runTestSuite(): Promise<any> {
  // This would be your actual test suite execution
  return {
    totalTests: 100,
    passedTests: 95,
    failedTests: 5,
    duration: 30000
  };
}

// Example 6: Custom Alert Rules
export async function customAlertRulesExample() {
  console.log('=== Custom Alert Rules Example ===');

  const monitoringSystem = new TestHealthMonitoringSystem();
  await monitoringSystem.initialize();

  const alertSystem = monitoringSystem.getAlertSystem();

  // Add custom alert rules
  alertSystem.addRule({
    id: 'memory-leak-detection',
    name: 'Memory Leak Detection',
    description: 'Detect potential memory leaks in tests',
    condition: (data: any) => {
      // Check if memory usage is consistently increasing
      const recentMetrics = data.metrics?.slice(-10) || [];
      if (recentMetrics.length < 5) return false;
      
      const memoryTrend = recentMetrics.map((m: any) => m.memoryUsage);
      const isIncreasing = memoryTrend.every((val: number, i: number) => 
        i === 0 || val > memoryTrend[i - 1]
      );
      
      return isIncreasing && memoryTrend[memoryTrend.length - 1] > 100 * 1024 * 1024; // 100MB
    },
    severity: 'error',
    enabled: true,
    cooldownMs: 5 * 60 * 1000 // 5 minutes
  });

  alertSystem.addRule({
    id: 'test-execution-timeout',
    name: 'Test Execution Timeout',
    description: 'Detect tests that take too long to execute',
    condition: (data: any) => data.executionTime > 30000, // 30 seconds
    severity: 'critical',
    enabled: true,
    cooldownMs: 2 * 60 * 1000 // 2 minutes
  });

  // Add Slack notification channel
  alertSystem.addChannel({
    id: 'slack',
    name: 'Slack Notifications',
    type: 'slack',
    enabled: true,
    config: {
      webhookUrl: process.env.SLACK_WEBHOOK_URL || 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK',
      channel: '#test-alerts',
      username: 'Test Health Monitor',
      iconEmoji: ':warning:'
    }
  });

  // Simulate some test executions that might trigger alerts
  for (let i = 0; i < 20; i++) {
    await monitoringSystem.recordTestExecution(
      `memory-test-${i}`,
      async () => {
        // Simulate memory usage that might trigger leak detection
        const memoryUsage = 50 * 1024 * 1024 + (i * 5 * 1024 * 1024); // Increasing memory usage
        const buffer = Buffer.alloc(memoryUsage);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return { memoryUsage, bufferLength: buffer.length };
      }
    );
  }

  // Check alert status
  const alerts = alertSystem.getActiveAlerts();
  console.log('Active alerts:', alerts.length);

  await monitoringSystem.shutdown();
}

// Run examples if this file is executed directly
if (require.main === module) {
  (async () => {
    try {
      await basicMonitoringExample();
      await customMonitoringExample();
      await ciCdIntegrationExample();
      await performanceTestingExample();
      await customAlertRulesExample();
    } catch (error) {
      console.error('Example execution failed:', error);
      process.exit(1);
    }
  })();
}
