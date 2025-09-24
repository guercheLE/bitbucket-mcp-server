/**
 * Performance Monitor
 * 
 * This module implements comprehensive performance monitoring for the MCP server
 * to ensure compliance with constitutional requirements:
 * - Response time monitoring (<2s requirement)
 * - Memory usage monitoring (<1GB requirement)
 * - Performance metrics collection
 * - Health status tracking
 * - Performance alerts and warnings
 * 
 * Constitutional Requirements:
 * - <2s response times for all operations
 * - <1GB memory usage limit
 * - Real-time performance monitoring
 * - Performance degradation detection
 */

import { EventEmitter } from 'events';
import { ServerStats, HealthStatus, TransportType } from '../types/index.js';

/**
 * Performance Metrics
 * Detailed performance metrics for monitoring
 */
export interface PerformanceMetrics {
  /** Timestamp of the metrics */
  timestamp: Date;
  
  /** Response time metrics */
  responseTime: {
    current: number;
    average: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
  };
  
  /** Memory usage metrics */
  memory: {
    current: number;
    peak: number;
    limit: number;
    usage: number; // percentage
  };
  
  /** Request metrics */
  requests: {
    total: number;
    successful: number;
    failed: number;
    rate: number; // requests per second
  };
  
  /** Session metrics */
  sessions: {
    active: number;
    total: number;
    averageLifetime: number;
  };
  
  /** Tool execution metrics */
  tools: {
    totalExecutions: number;
    averageExecutionTime: number;
    errorRate: number;
  };
}

/**
 * Performance Alert
 * Alert for performance issues
 */
export interface PerformanceAlert {
  /** Alert ID */
  id: string;
  
  /** Alert type */
  type: 'response_time' | 'memory_usage' | 'error_rate' | 'session_count';
  
  /** Alert severity */
  severity: 'warning' | 'critical';
  
  /** Alert message */
  message: string;
  
  /** Alert timestamp */
  timestamp: Date;
  
  /** Alert data */
  data: {
    current: number;
    threshold: number;
    limit?: number;
  };
}

/**
 * Performance Monitor Configuration
 */
export interface PerformanceMonitorConfig {
  /** Memory limit in bytes */
  memoryLimit: number;
  
  /** Response time threshold in milliseconds */
  responseTimeThreshold: number;
  
  /** Error rate threshold (0-1) */
  errorRateThreshold: number;
  
  /** Session count threshold */
  sessionCountThreshold: number;
  
  /** Monitoring interval in milliseconds */
  monitoringInterval: number;
  
  /** Alert cooldown in milliseconds */
  alertCooldown: number;
  
  /** Enable detailed logging */
  enableDetailedLogging: boolean;
  
  /** Enable performance alerts */
  enableAlerts: boolean;
}

/**
 * Performance Monitor
 * Main performance monitoring class
 */
export class PerformanceMonitor extends EventEmitter {
  private _config: PerformanceMonitorConfig;
  private _isMonitoring: boolean = false;
  private _monitoringInterval: NodeJS.Timeout | null = null;
  private _metrics: PerformanceMetrics[] = [];
  private _alerts: PerformanceAlert[] = [];
  private _alertCooldowns: Map<string, number> = new Map();
  
  // Performance tracking
  private _responseTimes: number[] = [];
  private _memorySnapshots: number[] = [];
  private _requestCounts: { total: number; successful: number; failed: number } = {
    total: 0,
    successful: 0,
    failed: 0
  };
  private _sessionMetrics: { active: number; total: number; lifetimes: number[] } = {
    active: 0,
    total: 0,
    lifetimes: []
  };
  private _toolMetrics: { executions: number; executionTimes: number[]; errors: number } = {
    executions: 0,
    executionTimes: [],
    errors: 0
  };
  
  // Peak tracking
  private _peakMemory: number = 0;
  private _startTime: Date = new Date();

  constructor(config: PerformanceMonitorConfig) {
    super();
    this._config = { ...config };
    this._setupEventHandlers();
  }

  // ============================================================================
  // Public Interface
  // ============================================================================

  /**
   * Start performance monitoring
   */
  start(): void {
    if (this._isMonitoring) {
      return;
    }

    this._isMonitoring = true;
    this._startTime = new Date();
    
    this._monitoringInterval = setInterval(() => {
      this._collectMetrics();
    }, this._config.monitoringInterval);

    this.emit('monitor:started');
    this._log('info', 'Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  stop(): void {
    if (!this._isMonitoring) {
      return;
    }

    this._isMonitoring = false;
    
    if (this._monitoringInterval) {
      clearInterval(this._monitoringInterval);
      this._monitoringInterval = null;
    }

    this.emit('monitor:stopped');
    this._log('info', 'Performance monitoring stopped');
  }

  /**
   * Record a request
   */
  recordRequest(success: boolean, responseTime: number): void {
    this._requestCounts.total++;
    if (success) {
      this._requestCounts.successful++;
    } else {
      this._requestCounts.failed++;
    }
    
    this._responseTimes.push(responseTime);
    
    // Keep only last 1000 response times for memory efficiency
    if (this._responseTimes.length > 1000) {
      this._responseTimes = this._responseTimes.slice(-1000);
    }
  }

  /**
   * Record tool execution
   */
  recordToolExecution(executionTime: number, success: boolean): void {
    this._toolMetrics.executions++;
    this._toolMetrics.executionTimes.push(executionTime);
    
    if (!success) {
      this._toolMetrics.errors++;
    }
    
    // Keep only last 1000 execution times for memory efficiency
    if (this._toolMetrics.executionTimes.length > 1000) {
      this._toolMetrics.executionTimes = this._toolMetrics.executionTimes.slice(-1000);
    }
  }

  /**
   * Update session metrics
   */
  updateSessionMetrics(active: number, total: number, sessionLifetime?: number): void {
    this._sessionMetrics.active = active;
    this._sessionMetrics.total = total;
    
    if (sessionLifetime !== undefined) {
      this._sessionMetrics.lifetimes.push(sessionLifetime);
      
      // Keep only last 1000 lifetimes for memory efficiency
      if (this._sessionMetrics.lifetimes.length > 1000) {
        this._sessionMetrics.lifetimes = this._sessionMetrics.lifetimes.slice(-1000);
      }
    }
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): PerformanceMetrics {
    const now = new Date();
    const uptime = now.getTime() - this._startTime.getTime();
    const currentMemory = process.memoryUsage().heapUsed;
    
    // Update peak memory
    if (currentMemory > this._peakMemory) {
      this._peakMemory = currentMemory;
    }
    
    // Calculate response time statistics
    const responseTimeStats = this._calculateResponseTimeStats();
    
    // Calculate request rate
    const requestRate = uptime > 0 ? (this._requestCounts.total / (uptime / 1000)) : 0;
    
    // Calculate session average lifetime
    const averageLifetime = this._sessionMetrics.lifetimes.length > 0
      ? this._sessionMetrics.lifetimes.reduce((sum, time) => sum + time, 0) / this._sessionMetrics.lifetimes.length
      : 0;
    
    // Calculate tool execution statistics
    const averageExecutionTime = this._toolMetrics.executionTimes.length > 0
      ? this._toolMetrics.executionTimes.reduce((sum, time) => sum + time, 0) / this._toolMetrics.executionTimes.length
      : 0;
    
    const toolErrorRate = this._toolMetrics.executions > 0
      ? this._toolMetrics.errors / this._toolMetrics.executions
      : 0;

    return {
      timestamp: now,
      responseTime: responseTimeStats,
      memory: {
        current: currentMemory,
        peak: this._peakMemory,
        limit: this._config.memoryLimit,
        usage: (currentMemory / this._config.memoryLimit) * 100
      },
      requests: {
        total: this._requestCounts.total,
        successful: this._requestCounts.successful,
        failed: this._requestCounts.failed,
        rate: requestRate
      },
      sessions: {
        active: this._sessionMetrics.active,
        total: this._sessionMetrics.total,
        averageLifetime
      },
      tools: {
        totalExecutions: this._toolMetrics.executions,
        averageExecutionTime,
        errorRate: toolErrorRate
      }
    };
  }

  /**
   * Get performance alerts
   */
  getAlerts(): PerformanceAlert[] {
    return [...this._alerts];
  }

  /**
   * Get performance history
   */
  getMetricsHistory(limit?: number): PerformanceMetrics[] {
    if (limit) {
      return this._metrics.slice(-limit);
    }
    return [...this._metrics];
  }

  /**
   * Check if performance is within constitutional requirements
   */
  isConstitutionalCompliant(): boolean {
    const metrics = this.getCurrentMetrics();
    
    // Check response time requirement (<2s)
    if (metrics.responseTime.current > this._config.responseTimeThreshold) {
      return false;
    }
    
    // Check memory usage requirement (<1GB)
    if (metrics.memory.current > this._config.memoryLimit) {
      return false;
    }
    
    // Check error rate requirement (<10%)
    const errorRate = metrics.requests.total > 0 
      ? metrics.requests.failed / metrics.requests.total 
      : 0;
    if (errorRate > this._config.errorRateThreshold) {
      return false;
    }
    
    return true;
  }

  /**
   * Get performance health status
   */
  getPerformanceHealthStatus(): HealthStatus {
    const metrics = this.getCurrentMetrics();
    const isCompliant = this.isConstitutionalCompliant();
    
    const issues: string[] = [];
    
    // Check response time
    if (metrics.responseTime.current > this._config.responseTimeThreshold) {
      issues.push(`Response time exceeds threshold: ${metrics.responseTime.current}ms > ${this._config.responseTimeThreshold}ms`);
    }
    
    // Check memory usage
    if (metrics.memory.usage > 90) {
      issues.push(`High memory usage: ${metrics.memory.usage.toFixed(1)}%`);
    }
    
    // Check error rate
    const errorRate = metrics.requests.total > 0 
      ? (metrics.requests.failed / metrics.requests.total) * 100 
      : 0;
    if (errorRate > this._config.errorRateThreshold * 100) {
      issues.push(`High error rate: ${errorRate.toFixed(1)}%`);
    }
    
    // Check session count
    if (metrics.sessions.active > this._config.sessionCountThreshold) {
      issues.push(`High session count: ${metrics.sessions.active} > ${this._config.sessionCountThreshold}`);
    }
    
    const status = isCompliant ? 'healthy' : 
                  issues.length <= 2 ? 'degraded' : 'unhealthy';

    return {
      status,
      timestamp: new Date(),
      components: {
        server: true,
        transports: {} as Record<TransportType, boolean>,
        tools: true,
        memory: metrics.memory.usage < 90,
        sessions: metrics.sessions.active <= this._config.sessionCountThreshold
      },
      metrics: {
        memoryUsage: metrics.memory.current,
        memoryLimit: this._config.memoryLimit,
        activeSessions: metrics.sessions.active,
        maxSessions: this._config.sessionCountThreshold,
        errorRate: errorRate / 100
      },
      issues
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Set up event handlers
   */
  private _setupEventHandlers(): void {
    // Handle process memory warnings
    process.on('warning', (warning) => {
      if (warning.name === 'MaxListenersExceededWarning') {
        this._log('warn', 'Max listeners exceeded warning', warning);
      }
    });
  }

  /**
   * Collect performance metrics
   */
  private _collectMetrics(): void {
    try {
      const metrics = this.getCurrentMetrics();
      this._metrics.push(metrics);
      
      // Keep only last 1000 metrics for memory efficiency
      if (this._metrics.length > 1000) {
        this._metrics = this._metrics.slice(-1000);
      }
      
      // Check for performance issues and generate alerts
      this._checkPerformanceIssues(metrics);
      
      this.emit('metrics:collected', metrics);
      
      if (this._config.enableDetailedLogging) {
        this._log('debug', 'Performance metrics collected', {
          responseTime: metrics.responseTime.current,
          memoryUsage: `${(metrics.memory.current / 1024 / 1024).toFixed(2)}MB`,
          requestRate: metrics.requests.rate.toFixed(2),
          activeSessions: metrics.sessions.active
        });
      }
    } catch (error) {
      this._log('error', 'Error collecting performance metrics', error);
    }
  }

  /**
   * Check for performance issues and generate alerts
   */
  private _checkPerformanceIssues(metrics: PerformanceMetrics): void {
    if (!this._config.enableAlerts) {
      return;
    }

    const now = Date.now();
    
    // Check response time
    if (metrics.responseTime.current > this._config.responseTimeThreshold) {
      this._generateAlert('response_time', 'critical', 
        `Response time exceeds threshold: ${metrics.responseTime.current}ms > ${this._config.responseTimeThreshold}ms`,
        { current: metrics.responseTime.current, threshold: this._config.responseTimeThreshold }, now);
    }
    
    // Check memory usage
    if (metrics.memory.usage > 90) {
      this._generateAlert('memory_usage', 'critical',
        `High memory usage: ${metrics.memory.usage.toFixed(1)}%`,
        { current: metrics.memory.usage, threshold: 90, limit: this._config.memoryLimit }, now);
    } else if (metrics.memory.usage > 80) {
      this._generateAlert('memory_usage', 'warning',
        `Memory usage approaching limit: ${metrics.memory.usage.toFixed(1)}%`,
        { current: metrics.memory.usage, threshold: 80, limit: this._config.memoryLimit }, now);
    }
    
    // Check error rate
    const errorRate = metrics.requests.total > 0 
      ? (metrics.requests.failed / metrics.requests.total) * 100 
      : 0;
    if (errorRate > this._config.errorRateThreshold * 100) {
      this._generateAlert('error_rate', 'critical',
        `High error rate: ${errorRate.toFixed(1)}%`,
        { current: errorRate, threshold: this._config.errorRateThreshold * 100 }, now);
    }
    
    // Check session count
    if (metrics.sessions.active > this._config.sessionCountThreshold) {
      this._generateAlert('session_count', 'warning',
        `High session count: ${metrics.sessions.active} > ${this._config.sessionCountThreshold}`,
        { current: metrics.sessions.active, threshold: this._config.sessionCountThreshold }, now);
    }
  }

  /**
   * Generate performance alert
   */
  private _generateAlert(
    type: PerformanceAlert['type'],
    severity: PerformanceAlert['severity'],
    message: string,
    data: PerformanceAlert['data'],
    timestamp: number
  ): void {
    const alertId = `${type}_${severity}`;
    const lastAlert = this._alertCooldowns.get(alertId);
    
    // Check cooldown
    if (lastAlert && (timestamp - lastAlert) < this._config.alertCooldown) {
      return;
    }
    
    const alert: PerformanceAlert = {
      id: `${alertId}_${timestamp}`,
      type,
      severity,
      message,
      timestamp: new Date(timestamp),
      data
    };
    
    this._alerts.push(alert);
    this._alertCooldowns.set(alertId, timestamp);
    
    // Keep only last 100 alerts for memory efficiency
    if (this._alerts.length > 100) {
      this._alerts = this._alerts.slice(-100);
    }
    
    this.emit('alert:generated', alert);
    this._log('warn', `Performance alert: ${message}`, alert);
  }

  /**
   * Calculate response time statistics
   */
  private _calculateResponseTimeStats(): PerformanceMetrics['responseTime'] {
    if (this._responseTimes.length === 0) {
      return {
        current: 0,
        average: 0,
        min: 0,
        max: 0,
        p95: 0,
        p99: 0
      };
    }
    
    const sorted = [...this._responseTimes].sort((a, b) => a - b);
    const len = sorted.length;
    
    return {
      current: this._responseTimes[this._responseTimes.length - 1] || 0,
      average: this._responseTimes.reduce((sum, time) => sum + time, 0) / len,
      min: sorted[0],
      max: sorted[len - 1],
      p95: sorted[Math.floor(len * 0.95)],
      p99: sorted[Math.floor(len * 0.99)]
    };
  }

  /**
   * Log message
   */
  private _log(level: string, message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [PERFORMANCE] [${level.toUpperCase()}] ${message}`;
    
    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
  }
}

/**
 * Default performance monitor configuration
 */
export const DEFAULT_PERFORMANCE_CONFIG: PerformanceMonitorConfig = {
  memoryLimit: 1024 * 1024 * 1024, // 1GB
  responseTimeThreshold: 2000, // 2 seconds
  errorRateThreshold: 0.1, // 10%
  sessionCountThreshold: 100,
  monitoringInterval: 5000, // 5 seconds
  alertCooldown: 30000, // 30 seconds
  enableDetailedLogging: false,
  enableAlerts: true
};