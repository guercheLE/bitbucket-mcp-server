/**
 * Performance Monitoring and Optimization
 * Metrics, health checks, circuit breakers, and rate limiting
 */

import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';
import { logger } from './logger';
import { environment } from '../config/environment';

// ============================================================================
// Performance Metrics Interface
// ============================================================================

export interface PerformanceMetrics {
  timestamp: number;
  memory: {
    used: number;
    total: number;
    external: number;
    arrayBuffers: number;
  };
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  uptime: number;
  requests: {
    total: number;
    active: number;
    completed: number;
    failed: number;
  };
  responseTime: {
    min: number;
    max: number;
    avg: number;
    p95: number;
    p99: number;
  };
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  checks: Record<string, HealthCheck>;
  metrics: PerformanceMetrics;
}

export interface HealthCheck {
  status: 'pass' | 'fail' | 'warn';
  message: string;
  duration: number;
  timestamp: number;
}

// ============================================================================
// Circuit Breaker Implementation
// ============================================================================

export enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half-open',
}

export interface CircuitBreakerConfig {
  threshold: number;
  timeout: number;
  resetTimeout: number;
}

export class CircuitBreaker extends EventEmitter {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig) {
    super();
    this.config = config;
  }

  public async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
        this.state = CircuitBreakerState.HALF_OPEN;
        this.emit('stateChange', { from: CircuitBreakerState.OPEN, to: this.state });
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.state = CircuitBreakerState.CLOSED;
      this.emit('stateChange', { from: CircuitBreakerState.HALF_OPEN, to: this.state });
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.config.threshold) {
      this.state = CircuitBreakerState.OPEN;
      this.emit('stateChange', { from: CircuitBreakerState.CLOSED, to: this.state });
      this.emit('open', { failures: this.failures, threshold: this.config.threshold });
    }
  }

  public getState(): CircuitBreakerState {
    return this.state;
  }

  public getFailures(): number {
    return this.failures;
  }

  public reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failures = 0;
    this.lastFailureTime = 0;
    this.emit('reset');
  }
}

// ============================================================================
// Rate Limiter Implementation
// ============================================================================

export interface RateLimiterConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: RateLimiterConfig;

  constructor(config: RateLimiterConfig) {
    this.config = config;
  }

  public isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // Get or create request history for this identifier
    let requestHistory = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    requestHistory = requestHistory.filter(timestamp => timestamp > windowStart);
    
    // Check if under the limit
    if (requestHistory.length >= this.config.maxRequests) {
      return false;
    }
    
    // Add current request
    requestHistory.push(now);
    this.requests.set(identifier, requestHistory);
    
    return true;
  }

  public getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const requestHistory = this.requests.get(identifier) || [];
    const validRequests = requestHistory.filter(timestamp => timestamp > windowStart);
    
    return Math.max(0, this.config.maxRequests - validRequests.length);
  }

  public getResetTime(identifier: string): number {
    const requestHistory = this.requests.get(identifier) || [];
    if (requestHistory.length === 0) {
      return Date.now();
    }
    
    const oldestRequest = Math.min(...requestHistory);
    return oldestRequest + this.config.windowMs;
  }

  public clear(identifier?: string): void {
    if (identifier) {
      this.requests.delete(identifier);
    } else {
      this.requests.clear();
    }
  }
}

// ============================================================================
// Performance Monitor
// ============================================================================

export class PerformanceMonitor extends EventEmitter {
  private metrics: PerformanceMetrics;
  private responseTimes: number[] = [];
  private activeRequests: number = 0;
  private totalRequests: number = 0;
  private completedRequests: number = 0;
  private failedRequests: number = 0;
  // private startTime: number = Date.now();
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.metrics = this.initializeMetrics();
    this.startMonitoring();
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      timestamp: Date.now(),
      memory: {
        used: 0,
        total: 0,
        external: 0,
        arrayBuffers: 0,
      },
      cpu: {
        usage: 0,
        loadAverage: [],
      },
      uptime: 0,
      requests: {
        total: 0,
        active: 0,
        completed: 0,
        failed: 0,
      },
      responseTime: {
        min: 0,
        max: 0,
        avg: 0,
        p95: 0,
        p99: 0,
      },
    };
  }

  private startMonitoring(): void {
    const envConfig = environment.getConfig();
    const interval = envConfig.metrics.interval;

    this.intervalId = setInterval(() => {
      this.updateMetrics();
      this.emit('metrics', this.metrics);
    }, interval);

    logger.info('Performance monitoring started', {
      interval,
      enabled: envConfig.metrics.enabled,
    });
  }

  private updateMetrics(): void {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const loadAvg = require('os').loadavg();

    // Calculate response time percentiles
    const sortedTimes = [...this.responseTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedTimes.length * 0.95) || 0;
    const p99Index = Math.floor(sortedTimes.length * 0.99) || 0;

    this.metrics = {
      timestamp: Date.now(),
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        external: memUsage.external,
        arrayBuffers: memUsage.arrayBuffers,
      },
      cpu: {
        usage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
        loadAverage: loadAvg,
      },
      uptime: process.uptime(),
      requests: {
        total: this.totalRequests,
        active: this.activeRequests,
        completed: this.completedRequests,
        failed: this.failedRequests,
      },
      responseTime: {
        min: sortedTimes.length > 0 ? sortedTimes[0] || 0 : 0,
        max: sortedTimes.length > 0 ? sortedTimes[sortedTimes.length - 1] || 0 : 0,
        avg: sortedTimes.length > 0 ? sortedTimes.reduce((a, b) => a + b, 0) / sortedTimes.length : 0,
        p95: sortedTimes.length > 0 ? sortedTimes[p95Index] || 0 : 0,
        p99: sortedTimes.length > 0 ? sortedTimes[p99Index] || 0 : 0,
      },
    };

    // Log performance warnings
    this.checkPerformanceThresholds();
  }

  private checkPerformanceThresholds(): void {
    const warnings: string[] = [];

    // Memory usage warning
    if (this.metrics.memory.used > 500 * 1024 * 1024) { // 500MB
      warnings.push('High memory usage detected');
    }

    // CPU usage warning
    if (this.metrics.cpu.usage > 1000) { // 1 second
      warnings.push('High CPU usage detected');
    }

    // Response time warning
    if (this.metrics.responseTime.avg > 5000) { // 5 seconds
      warnings.push('High average response time detected');
    }

    // Failed requests warning
    const failureRate = this.metrics.requests.total > 0 
      ? (this.metrics.requests.failed / this.metrics.requests.total) * 100 
      : 0;
    
    if (failureRate > 10) { // 10%
      warnings.push('High failure rate detected');
    }

    if (warnings.length > 0) {
      logger.warn('Performance warnings', {
        warnings,
        metrics: this.metrics,
      });
      this.emit('warning', { warnings, metrics: this.metrics });
    }
  }

  public startRequest(): string {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.activeRequests++;
    this.totalRequests++;
    
    logger.debug('Request started', {
      requestId,
      activeRequests: this.activeRequests,
      totalRequests: this.totalRequests,
    });

    return requestId;
  }

  public endRequest(requestId: string, success: boolean, duration: number): void {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    
    if (success) {
      this.completedRequests++;
    } else {
      this.failedRequests++;
    }

    // Add response time (keep only last 1000 requests)
    this.responseTimes.push(duration);
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }

    logger.debug('Request completed', {
      requestId,
      success,
      duration,
      activeRequests: this.activeRequests,
      completedRequests: this.completedRequests,
      failedRequests: this.failedRequests,
    });
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public reset(): void {
    this.responseTimes = [];
    this.activeRequests = 0;
    this.totalRequests = 0;
    this.completedRequests = 0;
    this.failedRequests = 0;
    
    logger.info('Performance metrics reset');
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    logger.info('Performance monitoring stopped');
  }
}

// ============================================================================
// Health Check Manager
// ============================================================================

export class HealthCheckManager {
  private checks: Map<string, () => Promise<HealthCheck>> = new Map();
  private monitor: PerformanceMonitor;

  constructor(monitor: PerformanceMonitor) {
    this.monitor = monitor;
    this.registerDefaultChecks();
  }

  private registerDefaultChecks(): void {
    // Memory check
    this.registerCheck('memory', async () => {
      const metrics = this.monitor.getMetrics();
      const memoryUsageMB = metrics.memory.used / (1024 * 1024);
      
      if (memoryUsageMB > 1000) { // 1GB
        return {
          status: 'fail',
          message: `High memory usage: ${memoryUsageMB.toFixed(2)}MB`,
          duration: 0,
          timestamp: Date.now(),
        };
      } else if (memoryUsageMB > 500) { // 500MB
        return {
          status: 'warn',
          message: `Moderate memory usage: ${memoryUsageMB.toFixed(2)}MB`,
          duration: 0,
          timestamp: Date.now(),
        };
      } else {
        return {
          status: 'pass',
          message: `Memory usage OK: ${memoryUsageMB.toFixed(2)}MB`,
          duration: 0,
          timestamp: Date.now(),
        };
      }
    });

    // CPU check
    this.registerCheck('cpu', async () => {
      const metrics = this.monitor.getMetrics();
      const cpuUsage = metrics.cpu.usage;
      
      if (cpuUsage > 2000) { // 2 seconds
        return {
          status: 'fail',
          message: `High CPU usage: ${cpuUsage.toFixed(2)}s`,
          duration: 0,
          timestamp: Date.now(),
        };
      } else if (cpuUsage > 1000) { // 1 second
        return {
          status: 'warn',
          message: `Moderate CPU usage: ${cpuUsage.toFixed(2)}s`,
          duration: 0,
          timestamp: Date.now(),
        };
      } else {
        return {
          status: 'pass',
          message: `CPU usage OK: ${cpuUsage.toFixed(2)}s`,
          duration: 0,
          timestamp: Date.now(),
        };
      }
    });

    // Response time check
    this.registerCheck('responseTime', async () => {
      const metrics = this.monitor.getMetrics();
      const avgResponseTime = metrics.responseTime.avg;
      
      if (avgResponseTime > 10000) { // 10 seconds
        return {
          status: 'fail',
          message: `High average response time: ${avgResponseTime.toFixed(2)}ms`,
          duration: 0,
          timestamp: Date.now(),
        };
      } else if (avgResponseTime > 5000) { // 5 seconds
        return {
          status: 'warn',
          message: `Moderate average response time: ${avgResponseTime.toFixed(2)}ms`,
          duration: 0,
          timestamp: Date.now(),
        };
      } else {
        return {
          status: 'pass',
          message: `Response time OK: ${avgResponseTime.toFixed(2)}ms`,
          duration: 0,
          timestamp: Date.now(),
        };
      }
    });

    // Failure rate check
    this.registerCheck('failureRate', async () => {
      const metrics = this.monitor.getMetrics();
      const failureRate = metrics.requests.total > 0 
        ? (metrics.requests.failed / metrics.requests.total) * 100 
        : 0;
      
      if (failureRate > 20) { // 20%
        return {
          status: 'fail',
          message: `High failure rate: ${failureRate.toFixed(2)}%`,
          duration: 0,
          timestamp: Date.now(),
        };
      } else if (failureRate > 10) { // 10%
        return {
          status: 'warn',
          message: `Moderate failure rate: ${failureRate.toFixed(2)}%`,
          duration: 0,
          timestamp: Date.now(),
        };
      } else {
        return {
          status: 'pass',
          message: `Failure rate OK: ${failureRate.toFixed(2)}%`,
          duration: 0,
          timestamp: Date.now(),
        };
      }
    });
  }

  public registerCheck(name: string, check: () => Promise<HealthCheck>): void {
    this.checks.set(name, check);
    logger.debug('Health check registered', { name });
  }

  public async runHealthCheck(): Promise<HealthCheckResult> {
    const startTime = performance.now();
    const checks: Record<string, HealthCheck> = {};
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Run all checks
    for (const [name, check] of this.checks) {
      try {
        const checkStartTime = performance.now();
        const result = await check();
        const duration = performance.now() - checkStartTime;
        
        result.duration = duration;
        checks[name] = result;

        // Update overall status
        if (result.status === 'fail') {
          overallStatus = 'unhealthy';
        } else if (result.status === 'warn' && overallStatus === 'healthy') {
          overallStatus = 'degraded';
        }
      } catch (error) {
        checks[name] = {
          status: 'fail',
          message: `Check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          duration: 0,
          timestamp: Date.now(),
        };
        overallStatus = 'unhealthy';
      }
    }

    const totalDuration = performance.now() - startTime;
    const metrics = this.monitor.getMetrics();

    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp: Date.now(),
      checks,
      metrics,
    };

    logger.info('Health check completed', {
      status: overallStatus,
      duration: totalDuration,
      checksCount: Object.keys(checks).length,
    });

    return result;
  }

  public getRegisteredChecks(): string[] {
    return Array.from(this.checks.keys());
  }
}

// ============================================================================
// Performance Manager
// ============================================================================

export class PerformanceManager {
  private monitor: PerformanceMonitor;
  private healthCheckManager: HealthCheckManager;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private rateLimiters: Map<string, RateLimiter> = new Map();

  constructor() {
    this.monitor = new PerformanceMonitor();
    this.healthCheckManager = new HealthCheckManager(this.monitor);
    
    // Set up event listeners
    this.monitor.on('warning', (data) => {
      logger.warn('Performance warning', data);
    });

    logger.info('Performance manager initialized');
  }

  public getMonitor(): PerformanceMonitor {
    return this.monitor;
  }

  public getHealthCheckManager(): HealthCheckManager {
    return this.healthCheckManager;
  }

  public createCircuitBreaker(name: string, config: CircuitBreakerConfig): CircuitBreaker {
    const circuitBreaker = new CircuitBreaker(config);
    this.circuitBreakers.set(name, circuitBreaker);
    
    circuitBreaker.on('open', (data) => {
      logger.warn('Circuit breaker opened', { name, ...data });
    });
    
    circuitBreaker.on('stateChange', (data) => {
      logger.info('Circuit breaker state changed', { name, ...data });
    });

    logger.info('Circuit breaker created', { name, config });
    return circuitBreaker;
  }

  public getCircuitBreaker(name: string): CircuitBreaker | undefined {
    return this.circuitBreakers.get(name);
  }

  public createRateLimiter(name: string, config: RateLimiterConfig): RateLimiter {
    const rateLimiter = new RateLimiter(config);
    this.rateLimiters.set(name, rateLimiter);
    
    logger.info('Rate limiter created', { name, config });
    return rateLimiter;
  }

  public getRateLimiter(name: string): RateLimiter | undefined {
    return this.rateLimiters.get(name);
  }

  public async getHealthStatus(): Promise<HealthCheckResult> {
    return this.healthCheckManager.runHealthCheck();
  }

  public getMetrics(): PerformanceMetrics {
    return this.monitor.getMetrics();
  }

  public reset(): void {
    this.monitor.reset();
    
    // Reset all circuit breakers
    for (const [name, circuitBreaker] of this.circuitBreakers) {
      circuitBreaker.reset();
      logger.info('Circuit breaker reset', { name });
    }
    
    // Clear all rate limiters
    for (const [name, rateLimiter] of this.rateLimiters) {
      rateLimiter.clear();
      logger.info('Rate limiter cleared', { name });
    }
  }

  public destroy(): void {
    this.monitor.stop();
    this.circuitBreakers.clear();
    this.rateLimiters.clear();
    
    logger.info('Performance manager destroyed');
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const performanceManager = new PerformanceManager();

// Export convenience functions
export const startRequest = () => performanceManager.getMonitor().startRequest();
export const endRequest = (requestId: string, success: boolean, duration: number) => 
  performanceManager.getMonitor().endRequest(requestId, success, duration);
export const getMetrics = () => performanceManager.getMetrics();
export const getHealthStatus = () => performanceManager.getHealthStatus();
export const createCircuitBreaker = (name: string, config: CircuitBreakerConfig) => 
  performanceManager.createCircuitBreaker(name, config);
export const createRateLimiter = (name: string, config: RateLimiterConfig) => 
  performanceManager.createRateLimiter(name, config);

// Export types
export type { 
  PerformanceMetrics as PerformanceMetricsType, 
  HealthCheckResult as HealthCheckResultType, 
  HealthCheck as HealthCheckType, 
  CircuitBreakerConfig as CircuitBreakerConfigType, 
  RateLimiterConfig as RateLimiterConfigType 
};
