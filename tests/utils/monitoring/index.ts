/**
 * Test Health Monitoring System - Main Entry Point
 * 
 * This module provides a unified interface for the complete test health monitoring system,
 * including health monitoring, performance metrics, dashboard, and alerting.
 */

export { TestHealthMonitor, getTestHealthMonitor, initializeTestHealthMonitoring, stopTestHealthMonitoring, recordTestExecution, getTestHealthStatus } from './test-health-monitor';
export { PerformanceMetricsCollector, getPerformanceCollector, measureTestPerformance, startPerformanceMonitoring, stopPerformanceMonitoring, getPerformanceAlerts, getPerformanceStats } from './performance-metrics';
export { TestDashboard, getTestDashboard, startTestDashboard, stopTestDashboard } from './test-dashboard';
export { AlertSystem, getAlertSystem, initializeAlertSystem, evaluateTestHealthAlerts, evaluatePerformanceAlerts } from './alert-system';
export { FlakyTestDetector, getFlakyTestDetector, recordTestExecutionForFlakiness, generateFlakyTestReport, getFlakyTests } from './flaky-test-detector';
export { FlakyTestReporter, getFlakyTestReporter, generateFlakyTestReports } from './flaky-test-reporter';
export { TestMaintenanceAutomation, getMaintenanceAutomation, startMaintenanceAutomation, stopMaintenanceAutomation, runMaintenanceTasks } from './test-maintenance-automation';

// Re-export types for convenience
export type {
  TestExecutionMetrics,
  TestHealthMetrics,
  FlakyTestInfo,
  TestTrend
} from './test-health-monitor';

export type {
  PerformanceSnapshot,
  TestPerformanceMetrics,
  PerformanceThresholds,
  PerformanceAlert
} from './performance-metrics';

export type {
  DashboardConfig,
  DashboardData
} from './test-dashboard';

export type {
  AlertRule,
  Alert,
  NotificationChannel,
  EmailConfig,
  WebhookConfig,
  SlackConfig,
  FileConfig
} from './alert-system';

export type {
  FlakyTestDetection,
  FlakyTestReport,
  FlakyTestRecommendation,
  FlakyTestConfig
} from './flaky-test-detector';

export type {
  ReportConfig,
  ReportMetadata
} from './flaky-test-reporter';

export type {
  MaintenanceConfig,
  MaintenanceTask,
  MaintenanceResult
} from './test-maintenance-automation';

import { TestHealthMonitor } from './test-health-monitor';
import { PerformanceMetricsCollector } from './performance-metrics';
import { TestDashboard } from './test-dashboard';
import { AlertSystem } from './alert-system';
import { Logger } from '../../../src/types/logger';
import { createMockLogger } from '../mocks/logger.mock';

/**
 * Complete Test Health Monitoring System
 */
export class TestHealthMonitoringSystem {
  private healthMonitor: TestHealthMonitor;
  private performanceCollector: PerformanceMetricsCollector;
  private dashboard: TestDashboard;
  private alertSystem: AlertSystem;
  private logger: Logger;
  private isInitialized: boolean = false;

  constructor(logger?: Logger) {
    this.logger = logger || createMockLogger();
    
    // Initialize components
    this.healthMonitor = new TestHealthMonitor(this.logger);
    this.performanceCollector = new PerformanceMetricsCollector(this.logger);
    this.dashboard = new TestDashboard({}, this.healthMonitor, this.performanceCollector, this.logger);
    this.alertSystem = new AlertSystem(this.logger);
  }

  /**
   * Initialize the complete monitoring system
   */
  async initialize(config: {
    healthMonitoring?: {
      intervalMs?: number;
    };
    performanceMonitoring?: {
      intervalMs?: number;
    };
    dashboard?: {
      port?: number;
      host?: string;
      refreshInterval?: number;
    };
    alerting?: {
      enableConsole?: boolean;
      enableFile?: boolean;
      filePath?: string;
    };
  } = {}): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('Test health monitoring system is already initialized');
      return;
    }

    this.logger.info('Initializing test health monitoring system');

    try {
      // Start health monitoring
      this.healthMonitor.startMonitoring(config.healthMonitoring?.intervalMs || 60000);

      // Start performance monitoring
      this.performanceCollector.startCollection(config.performanceMonitoring?.intervalMs || 1000);

      // Configure alerting
      this.setupAlerting(config.alerting);

      // Start dashboard
      await this.dashboard.start();

      this.isInitialized = true;
      this.logger.info('Test health monitoring system initialized successfully', {
        dashboardUrl: this.dashboard.getUrl()
      });

    } catch (error) {
      this.logger.error('Failed to initialize test health monitoring system', { error });
      throw error;
    }
  }

  /**
   * Shutdown the monitoring system
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      this.logger.warn('Test health monitoring system is not initialized');
      return;
    }

    this.logger.info('Shutting down test health monitoring system');

    try {
      // Stop all components
      this.healthMonitor.stopMonitoring();
      this.performanceCollector.stopCollection();
      this.alertSystem.stop();
      await this.dashboard.stop();

      this.isInitialized = false;
      this.logger.info('Test health monitoring system shutdown complete');

    } catch (error) {
      this.logger.error('Error during test health monitoring system shutdown', { error });
      throw error;
    }
  }

  /**
   * Setup alerting configuration
   */
  private setupAlerting(config: {
    enableConsole?: boolean;
    enableFile?: boolean;
    filePath?: string;
  } = {}): void {
    // Add console channel if enabled
    if (config.enableConsole !== false) {
      this.alertSystem.addChannel({
        id: 'console',
        name: 'Console Output',
        type: 'console',
        enabled: true,
        config: {}
      });
    }

    // Add file channel if enabled
    if (config.enableFile !== false) {
      this.alertSystem.addChannel({
        id: 'file',
        name: 'File Log',
        type: 'file',
        enabled: true,
        config: {
          path: config.filePath || './logs/test-alerts.log',
          maxSize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5
        }
      });
    }

    // Start alert system
    this.alertSystem.start();
  }

  /**
   * Record test execution with full monitoring
   */
  async recordTestExecution<T>(
    testName: string,
    testFunction: () => Promise<T>
  ): Promise<{ result: T; metrics: any }> {
    const startTime = Date.now();
    const memoryStart = process.memoryUsage();

    try {
      // Measure performance
      const { result, metrics: performanceMetrics } = await this.performanceCollector.measureTestPerformance(
        testName,
        testFunction
      );

      // Record health metrics
      this.healthMonitor.recordTestExecution({
        testName,
        executionTime: performanceMetrics.duration,
        memoryUsage: performanceMetrics.memoryEnd.heapUsed,
        cpuUsage: (performanceMetrics.cpuDelta.user + performanceMetrics.cpuDelta.system) / 1000000,
        status: 'passed',
        retryCount: 0
      });

      // Evaluate alerts
      this.alertSystem.evaluateRules(this.healthMonitor.getHealthMetrics(), 'health');
      this.alertSystem.evaluateRules(this.performanceCollector.getAlerts(), 'performance');

      return { result, metrics: performanceMetrics };

    } catch (error) {
      // Record failed test
      this.healthMonitor.recordTestExecution({
        testName,
        executionTime: Date.now() - startTime,
        memoryUsage: process.memoryUsage().heapUsed,
        cpuUsage: 0,
        status: 'failed',
        retryCount: 0,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        stackTrace: error instanceof Error ? error.stack : undefined
      });

      throw error;
    }
  }

  /**
   * Get comprehensive system status
   */
  getSystemStatus(): {
    initialized: boolean;
    healthMetrics: any;
    performanceStats: any;
    alertStats: any;
    dashboardUrl: string;
  } {
    return {
      initialized: this.isInitialized,
      healthMetrics: this.healthMonitor.getHealthMetrics(),
      performanceStats: this.performanceCollector.getPerformanceStats(),
      alertStats: this.alertSystem.getAlertStats(),
      dashboardUrl: this.dashboard.getUrl()
    };
  }

  /**
   * Get health monitor instance
   */
  getHealthMonitor(): TestHealthMonitor {
    return this.healthMonitor;
  }

  /**
   * Get performance collector instance
   */
  getPerformanceCollector(): PerformanceMetricsCollector {
    return this.performanceCollector;
  }

  /**
   * Get dashboard instance
   */
  getDashboard(): TestDashboard {
    return this.dashboard;
  }

  /**
   * Get alert system instance
   */
  getAlertSystem(): AlertSystem {
    return this.alertSystem;
  }
}

// Global instance for easy access
let globalMonitoringSystem: TestHealthMonitoringSystem | null = null;

/**
 * Get or create the global monitoring system
 */
export function getMonitoringSystem(): TestHealthMonitoringSystem {
  if (!globalMonitoringSystem) {
    globalMonitoringSystem = new TestHealthMonitoringSystem();
  }
  return globalMonitoringSystem;
}

/**
 * Initialize the global monitoring system
 */
export async function initializeMonitoringSystem(config?: any): Promise<void> {
  const system = getMonitoringSystem();
  await system.initialize(config);
}

/**
 * Shutdown the global monitoring system
 */
export async function shutdownMonitoringSystem(): Promise<void> {
  if (globalMonitoringSystem) {
    await globalMonitoringSystem.shutdown();
    globalMonitoringSystem = null;
  }
}

/**
 * Record test execution with monitoring
 */
export async function recordTestExecution<T>(
  testName: string,
  testFunction: () => Promise<T>
): Promise<{ result: T; metrics: any }> {
  const system = getMonitoringSystem();
  return system.recordTestExecution(testName, testFunction);
}

/**
 * Get system status
 */
export function getSystemStatus() {
  const system = getMonitoringSystem();
  return system.getSystemStatus();
}
