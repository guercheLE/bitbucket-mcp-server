/**
 * Test Maintenance Automation System
 * 
 * This module provides automated maintenance capabilities for the test suite,
 * including data cleanup, report generation, and CI/CD integration.
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { Logger } from '../../../src/types/logger';
import { createMockLogger } from '../mocks/logger.mock';
import { TestHealthMonitor } from './test-health-monitor';
import { PerformanceMetricsCollector } from './performance-metrics';
import { FlakyTestDetector } from './flaky-test-detector';
import { FlakyTestReporter } from './flaky-test-reporter';
import { AlertSystem } from './alert-system';

export interface MaintenanceConfig {
  cleanup: {
    enabled: boolean;
    intervalHours: number;
    maxAgeDays: number;
    maxFileSizeMB: number;
    maxFiles: number;
  };
  reporting: {
    enabled: boolean;
    intervalHours: number;
    formats: ('html' | 'json' | 'csv' | 'markdown')[];
    outputDir: string;
    includeCharts: boolean;
  };
  monitoring: {
    enabled: boolean;
    intervalMinutes: number;
    alertThresholds: {
      maxFlakyTests: number;
      maxFlakinessRate: number;
      maxExecutionTime: number;
      maxMemoryUsage: number;
    };
  };
  ciCd: {
    enabled: boolean;
    generateReports: boolean;
    failOnCriticalIssues: boolean;
    uploadArtifacts: boolean;
    artifactPaths: string[];
  };
}

export interface MaintenanceTask {
  id: string;
  name: string;
  description: string;
  type: 'cleanup' | 'reporting' | 'monitoring' | 'ciCd';
  schedule: string; // cron expression
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

export interface MaintenanceResult {
  taskId: string;
  taskName: string;
  status: 'success' | 'failure';
  startTime: Date;
  endTime: Date;
  duration: number;
  result?: any;
  error?: string;
  metrics?: {
    filesProcessed?: number;
    filesDeleted?: number;
    reportsGenerated?: number;
    alertsTriggered?: number;
  };
}

export class TestMaintenanceAutomation {
  private config: MaintenanceConfig;
  private logger: Logger;
  private tasks: Map<string, MaintenanceTask> = new Map();
  private isRunning: boolean = false;
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private healthMonitor: TestHealthMonitor;
  private performanceCollector: PerformanceMetricsCollector;
  private flakyDetector: FlakyTestDetector;
  private flakyReporter: FlakyTestReporter;
  private alertSystem: AlertSystem;

  constructor(config?: Partial<MaintenanceConfig>, logger?: Logger) {
    this.config = {
      cleanup: {
        enabled: true,
        intervalHours: 24,
        maxAgeDays: 30,
        maxFileSizeMB: 100,
        maxFiles: 1000
      },
      reporting: {
        enabled: true,
        intervalHours: 6,
        formats: ['html', 'json'],
        outputDir: './reports',
        includeCharts: true
      },
      monitoring: {
        enabled: true,
        intervalMinutes: 15,
        alertThresholds: {
          maxFlakyTests: 10,
          maxFlakinessRate: 0.1,
          maxExecutionTime: 30000,
          maxMemoryUsage: 500 * 1024 * 1024
        }
      },
      ciCd: {
        enabled: false,
        generateReports: true,
        failOnCriticalIssues: true,
        uploadArtifacts: false,
        artifactPaths: ['./reports', './logs']
      },
      ...config
    };

    this.logger = logger || createMockLogger();
    
    // Initialize monitoring components
    this.healthMonitor = new TestHealthMonitor(this.logger);
    this.performanceCollector = new PerformanceMetricsCollector(this.logger);
    this.flakyDetector = new FlakyTestDetector(undefined, this.logger);
    this.flakyReporter = new FlakyTestReporter(undefined, this.logger);
    this.alertSystem = new AlertSystem(this.logger);

    this.initializeTasks();
  }

  /**
   * Initialize maintenance tasks
   */
  private initializeTasks(): void {
    // Cleanup task
    this.addTask({
      id: 'cleanup',
      name: 'Data Cleanup',
      description: 'Clean up old test data, logs, and temporary files',
      type: 'cleanup',
      schedule: `0 */${this.config.cleanup.intervalHours} * * *`, // Every N hours
      enabled: this.config.cleanup.enabled,
      status: 'pending'
    });

    // Reporting task
    this.addTask({
      id: 'reporting',
      name: 'Report Generation',
      description: 'Generate comprehensive test health and flaky test reports',
      type: 'reporting',
      schedule: `0 */${this.config.reporting.intervalHours} * * *`, // Every N hours
      enabled: this.config.reporting.enabled,
      status: 'pending'
    });

    // Monitoring task
    this.addTask({
      id: 'monitoring',
      name: 'Health Monitoring',
      description: 'Monitor test health and trigger alerts for issues',
      type: 'monitoring',
      schedule: `*/${this.config.monitoring.intervalMinutes} * * * *`, // Every N minutes
      enabled: this.config.monitoring.enabled,
      status: 'pending'
    });

    // CI/CD task
    this.addTask({
      id: 'ciCd',
      name: 'CI/CD Integration',
      description: 'Generate reports and artifacts for CI/CD pipeline',
      type: 'ciCd',
      schedule: '0 0 * * *', // Daily at midnight
      enabled: this.config.ciCd.enabled,
      status: 'pending'
    });
  }

  /**
   * Add a maintenance task
   */
  addTask(task: MaintenanceTask): void {
    this.tasks.set(task.id, task);
    this.logger.info('Added maintenance task', { taskId: task.id, name: task.name });
  }

  /**
   * Remove a maintenance task
   */
  removeTask(taskId: string): void {
    if (this.tasks.delete(taskId)) {
      this.logger.info('Removed maintenance task', { taskId });
    }
  }

  /**
   * Start the maintenance automation system
   */
  start(): void {
    if (this.isRunning) {
      this.logger.warn('Test maintenance automation is already running');
      return;
    }

    this.isRunning = true;
    this.logger.info('Starting test maintenance automation');

    // Start monitoring components
    this.healthMonitor.startMonitoring(60000); // 1 minute
    this.performanceCollector.startCollection(1000); // 1 second
    this.alertSystem.start();

    // Schedule tasks
    for (const [taskId, task] of this.tasks) {
      if (task.enabled) {
        this.scheduleTask(task);
      }
    }
  }

  /**
   * Stop the maintenance automation system
   */
  stop(): void {
    if (!this.isRunning) {
      this.logger.warn('Test maintenance automation is not running');
      return;
    }

    this.isRunning = false;
    this.logger.info('Stopping test maintenance automation');

    // Stop monitoring components
    this.healthMonitor.stopMonitoring();
    this.performanceCollector.stopCollection();
    this.alertSystem.stop();

    // Clear all intervals
    for (const interval of this.intervals.values()) {
      clearInterval(interval);
    }
    this.intervals.clear();
  }

  /**
   * Schedule a task
   */
  private scheduleTask(task: MaintenanceTask): void {
    const interval = this.parseCronExpression(task.schedule);
    if (interval > 0) {
      const timeout = setInterval(() => {
        this.executeTask(task.id);
      }, interval);
      
      this.intervals.set(task.id, timeout);
      this.logger.info('Scheduled maintenance task', { 
        taskId: task.id, 
        interval: `${interval}ms` 
      });
    }
  }

  /**
   * Parse cron expression (simplified)
   */
  private parseCronExpression(cron: string): number {
    const parts = cron.split(' ');
    if (parts.length !== 5) {
      this.logger.warn('Invalid cron expression', { cron });
      return 0;
    }

    const [minute, hour, day, month, weekday] = parts;
    
    // Simple parsing for common patterns
    if (minute.startsWith('*/')) {
      const minutes = parseInt(minute.substring(2));
      return minutes * 60 * 1000; // Convert to milliseconds
    }
    
    if (hour.startsWith('*/')) {
      const hours = parseInt(hour.substring(2));
      return hours * 60 * 60 * 1000; // Convert to milliseconds
    }
    
    // Default to 1 hour if parsing fails
    return 60 * 60 * 1000;
  }

  /**
   * Execute a maintenance task
   */
  async executeTask(taskId: string): Promise<MaintenanceResult> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    if (!task.enabled) {
      this.logger.info('Task is disabled', { taskId });
      return {
        taskId,
        taskName: task.name,
        status: 'failure',
        startTime: new Date(),
        endTime: new Date(),
        duration: 0,
        error: 'Task is disabled'
      };
    }

    this.logger.info('Executing maintenance task', { taskId, name: task.name });
    
    task.status = 'running';
    task.lastRun = new Date();
    
    const startTime = new Date();
    let result: MaintenanceResult;

    try {
      switch (task.type) {
        case 'cleanup':
          result = await this.executeCleanupTask(task);
          break;
        case 'reporting':
          result = await this.executeReportingTask(task);
          break;
        case 'monitoring':
          result = await this.executeMonitoringTask(task);
          break;
        case 'ciCd':
          result = await this.executeCiCdTask(task);
          break;
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }
      
      task.status = 'completed';
      task.result = result;
      
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      
      result = {
        taskId,
        taskName: task.name,
        status: 'failure',
        startTime,
        endTime: new Date(),
        duration: Date.now() - startTime.getTime(),
        error: task.error
      };
    }

    this.logger.info('Completed maintenance task', {
      taskId,
      status: result.status,
      duration: result.duration
    });

    return result;
  }

  /**
   * Execute cleanup task
   */
  private async executeCleanupTask(task: MaintenanceTask): Promise<MaintenanceResult> {
    const startTime = new Date();
    const metrics = {
      filesProcessed: 0,
      filesDeleted: 0
    };

    try {
      // Clean up old log files
      await this.cleanupLogFiles(metrics);
      
      // Clean up old report files
      await this.cleanupReportFiles(metrics);
      
      // Clean up temporary files
      await this.cleanupTempFiles(metrics);
      
      // Clean up old test data
      await this.cleanupTestData(metrics);

      return {
        taskId: task.id,
        taskName: task.name,
        status: 'success',
        startTime,
        endTime: new Date(),
        duration: Date.now() - startTime.getTime(),
        metrics
      };
      
    } catch (error) {
      return {
        taskId: task.id,
        taskName: task.name,
        status: 'failure',
        startTime,
        endTime: new Date(),
        duration: Date.now() - startTime.getTime(),
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics
      };
    }
  }

  /**
   * Execute reporting task
   */
  private async executeReportingTask(task: MaintenanceTask): Promise<MaintenanceResult> {
    const startTime = new Date();
    const metrics = {
      reportsGenerated: 0
    };

    try {
      // Generate flaky test report
      const flakyReport = this.flakyDetector.generateReport();
      await this.flakyReporter.generateReports(flakyReport, {
        outputDir: this.config.reporting.outputDir,
        formats: this.config.reporting.formats,
        includeCharts: this.config.reporting.includeCharts
      });
      metrics.reportsGenerated++;

      // Generate health metrics report
      const healthMetrics = this.healthMonitor.getHealthMetrics();
      const healthReportPath = join(this.config.reporting.outputDir, 'health-metrics.json');
      await fs.writeFile(healthReportPath, JSON.stringify(healthMetrics, null, 2));
      metrics.reportsGenerated++;

      // Generate performance report
      const performanceStats = this.performanceCollector.getPerformanceStats();
      const performanceReportPath = join(this.config.reporting.outputDir, 'performance-stats.json');
      await fs.writeFile(performanceReportPath, JSON.stringify(performanceStats, null, 2));
      metrics.reportsGenerated++;

      return {
        taskId: task.id,
        taskName: task.name,
        status: 'success',
        startTime,
        endTime: new Date(),
        duration: Date.now() - startTime.getTime(),
        metrics
      };
      
    } catch (error) {
      return {
        taskId: task.id,
        taskName: task.name,
        status: 'failure',
        startTime,
        endTime: new Date(),
        duration: Date.now() - startTime.getTime(),
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics
      };
    }
  }

  /**
   * Execute monitoring task
   */
  private async executeMonitoringTask(task: MaintenanceTask): Promise<MaintenanceResult> {
    const startTime = new Date();
    const metrics = {
      alertsTriggered: 0
    };

    try {
      // Check health metrics
      const healthMetrics = this.healthMonitor.getHealthMetrics();
      const flakyTests = this.flakyDetector.detectFlakyTests();
      
      // Check thresholds
      if (flakyTests.length > this.config.monitoring.alertThresholds.maxFlakyTests) {
        this.alertSystem.evaluateRules(healthMetrics, 'health');
        metrics.alertsTriggered++;
      }
      
      if (healthMetrics.averageExecutionTime > this.config.monitoring.alertThresholds.maxExecutionTime) {
        this.alertSystem.evaluateRules(healthMetrics, 'performance');
        metrics.alertsTriggered++;
      }
      
      if (healthMetrics.memoryPeak > this.config.monitoring.alertThresholds.maxMemoryUsage) {
        this.alertSystem.evaluateRules(healthMetrics, 'memory');
        metrics.alertsTriggered++;
      }

      return {
        taskId: task.id,
        taskName: task.name,
        status: 'success',
        startTime,
        endTime: new Date(),
        duration: Date.now() - startTime.getTime(),
        metrics
      };
      
    } catch (error) {
      return {
        taskId: task.id,
        taskName: task.name,
        status: 'failure',
        startTime,
        endTime: new Date(),
        duration: Date.now() - startTime.getTime(),
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics
      };
    }
  }

  /**
   * Execute CI/CD task
   */
  private async executeCiCdTask(task: MaintenanceTask): Promise<MaintenanceResult> {
    const startTime = new Date();
    const metrics = {
      reportsGenerated: 0
    };

    try {
      if (this.config.ciCd.generateReports) {
        // Generate reports for CI/CD
        const flakyReport = this.flakyDetector.generateReport();
        await this.flakyReporter.generateReports(flakyReport, {
          outputDir: this.config.reporting.outputDir,
          formats: ['json', 'html'],
          includeCharts: true
        });
        metrics.reportsGenerated++;
      }

      // Check for critical issues
      if (this.config.ciCd.failOnCriticalIssues) {
        const flakyTests = this.flakyDetector.detectFlakyTests();
        const criticalFlakyTests = flakyTests.filter(test => test.flakinessRate > 0.5);
        
        if (criticalFlakyTests.length > 0) {
          throw new Error(`Critical flaky tests detected: ${criticalFlakyTests.length}`);
        }
      }

      return {
        taskId: task.id,
        taskName: task.name,
        status: 'success',
        startTime,
        endTime: new Date(),
        duration: Date.now() - startTime.getTime(),
        metrics
      };
      
    } catch (error) {
      return {
        taskId: task.id,
        taskName: task.name,
        status: 'failure',
        startTime,
        endTime: new Date(),
        duration: Date.now() - startTime.getTime(),
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics
      };
    }
  }

  /**
   * Clean up old log files
   */
  private async cleanupLogFiles(metrics: { filesProcessed: number; filesDeleted: number }): Promise<void> {
    const logDir = './logs';
    const cutoffDate = new Date(Date.now() - this.config.cleanup.maxAgeDays * 24 * 60 * 60 * 1000);
    
    try {
      const files = await fs.readdir(logDir);
      
      for (const file of files) {
        if (file.endsWith('.log')) {
          const filePath = join(logDir, file);
          const stats = await fs.stat(filePath);
          
          metrics.filesProcessed++;
          
          if (stats.mtime < cutoffDate || stats.size > this.config.cleanup.maxFileSizeMB * 1024 * 1024) {
            await fs.unlink(filePath);
            metrics.filesDeleted++;
            this.logger.info('Deleted old log file', { filePath });
          }
        }
      }
    } catch (error) {
      this.logger.warn('Error cleaning up log files', { error });
    }
  }

  /**
   * Clean up old report files
   */
  private async cleanupReportFiles(metrics: { filesProcessed: number; filesDeleted: number }): Promise<void> {
    const reportDir = this.config.reporting.outputDir;
    const cutoffDate = new Date(Date.now() - this.config.cleanup.maxAgeDays * 24 * 60 * 60 * 1000);
    
    try {
      const files = await fs.readdir(reportDir);
      const reportFiles = files.filter(file => 
        file.endsWith('.html') || file.endsWith('.json') || file.endsWith('.csv')
      );
      
      // Sort by modification time and keep only the most recent ones
      const fileStats = await Promise.all(
        reportFiles.map(async (file) => {
          const filePath = join(reportDir, file);
          const stats = await fs.stat(filePath);
          return { file, filePath, stats };
        })
      );
      
      fileStats.sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());
      
      for (let i = 0; i < fileStats.length; i++) {
        const { file, filePath, stats } = fileStats[i];
        
        metrics.filesProcessed++;
        
        if (i >= this.config.cleanup.maxFiles || stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          metrics.filesDeleted++;
          this.logger.info('Deleted old report file', { filePath });
        }
      }
    } catch (error) {
      this.logger.warn('Error cleaning up report files', { error });
    }
  }

  /**
   * Clean up temporary files
   */
  private async cleanupTempFiles(metrics: { filesProcessed: number; filesDeleted: number }): Promise<void> {
    const tempDirs = ['./tmp', './temp', './.tmp'];
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
    
    for (const tempDir of tempDirs) {
      try {
        const files = await fs.readdir(tempDir);
        
        for (const file of files) {
          const filePath = join(tempDir, file);
          const stats = await fs.stat(filePath);
          
          metrics.filesProcessed++;
          
          if (stats.mtime < cutoffDate) {
            if (stats.isDirectory()) {
              await fs.rmdir(filePath, { recursive: true });
            } else {
              await fs.unlink(filePath);
            }
            metrics.filesDeleted++;
            this.logger.info('Deleted temporary file', { filePath });
          }
        }
      } catch (error) {
        // Directory might not exist, which is fine
      }
    }
  }

  /**
   * Clean up old test data
   */
  private async cleanupTestData(metrics: { filesProcessed: number; filesDeleted: number }): Promise<void> {
    // Clear old monitoring data
    this.healthMonitor.clearMetrics();
    this.performanceCollector.clearData();
    this.flakyDetector.clearData();
    
    this.logger.info('Cleared old test monitoring data');
  }

  /**
   * Get maintenance status
   */
  getStatus(): {
    isRunning: boolean;
    tasks: MaintenanceTask[];
    config: MaintenanceConfig;
  } {
    return {
      isRunning: this.isRunning,
      tasks: Array.from(this.tasks.values()),
      config: this.config
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<MaintenanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('Updated maintenance automation configuration', { config: this.config });
    
    // Restart if running
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  /**
   * Run all tasks manually
   */
  async runAllTasks(): Promise<MaintenanceResult[]> {
    const results: MaintenanceResult[] = [];
    
    for (const [taskId] of this.tasks) {
      try {
        const result = await this.executeTask(taskId);
        results.push(result);
      } catch (error) {
        results.push({
          taskId,
          taskName: 'Unknown',
          status: 'failure',
          startTime: new Date(),
          endTime: new Date(),
          duration: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return results;
  }
}

// Global instance for easy access
let globalMaintenanceAutomation: TestMaintenanceAutomation | null = null;

/**
 * Get or create the global maintenance automation system
 */
export function getMaintenanceAutomation(): TestMaintenanceAutomation {
  if (!globalMaintenanceAutomation) {
    globalMaintenanceAutomation = new TestMaintenanceAutomation();
  }
  return globalMaintenanceAutomation;
}

/**
 * Start maintenance automation
 */
export function startMaintenanceAutomation(config?: Partial<MaintenanceConfig>): void {
  const automation = new TestMaintenanceAutomation(config);
  automation.start();
  globalMaintenanceAutomation = automation;
}

/**
 * Stop maintenance automation
 */
export function stopMaintenanceAutomation(): void {
  if (globalMaintenanceAutomation) {
    globalMaintenanceAutomation.stop();
    globalMaintenanceAutomation = null;
  }
}

/**
 * Run maintenance tasks manually
 */
export async function runMaintenanceTasks(): Promise<MaintenanceResult[]> {
  const automation = getMaintenanceAutomation();
  return automation.runAllTasks();
}
