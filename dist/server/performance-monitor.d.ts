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
import { HealthStatus } from '../types/index.js';
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
        usage: number;
    };
    /** Request metrics */
    requests: {
        total: number;
        successful: number;
        failed: number;
        rate: number;
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
export declare class PerformanceMonitor extends EventEmitter {
    private _config;
    private _isMonitoring;
    private _monitoringInterval;
    private _metrics;
    private _alerts;
    private _alertCooldowns;
    private _responseTimes;
    private _memorySnapshots;
    private _requestCounts;
    private _sessionMetrics;
    private _toolMetrics;
    private _peakMemory;
    private _startTime;
    constructor(config: PerformanceMonitorConfig);
    /**
     * Start performance monitoring
     */
    start(): void;
    /**
     * Stop performance monitoring
     */
    stop(): void;
    /**
     * Record a request
     */
    recordRequest(success: boolean, responseTime: number): void;
    /**
     * Record tool execution
     */
    recordToolExecution(executionTime: number, success: boolean): void;
    /**
     * Update session metrics
     */
    updateSessionMetrics(active: number, total: number, sessionLifetime?: number): void;
    /**
     * Get current performance metrics
     */
    getCurrentMetrics(): PerformanceMetrics;
    /**
     * Get performance alerts
     */
    getAlerts(): PerformanceAlert[];
    /**
     * Get performance history
     */
    getMetricsHistory(limit?: number): PerformanceMetrics[];
    /**
     * Check if performance is within constitutional requirements
     */
    isConstitutionalCompliant(): boolean;
    /**
     * Get performance health status
     */
    getPerformanceHealthStatus(): HealthStatus;
    /**
     * Set up event handlers
     */
    private _setupEventHandlers;
    /**
     * Collect performance metrics
     */
    private _collectMetrics;
    /**
     * Check for performance issues and generate alerts
     */
    private _checkPerformanceIssues;
    /**
     * Generate performance alert
     */
    private _generateAlert;
    /**
     * Calculate response time statistics
     */
    private _calculateResponseTimeStats;
    /**
     * Log message
     */
    private _log;
}
/**
 * Default performance monitor configuration
 */
export declare const DEFAULT_PERFORMANCE_CONFIG: PerformanceMonitorConfig;
//# sourceMappingURL=performance-monitor.d.ts.map