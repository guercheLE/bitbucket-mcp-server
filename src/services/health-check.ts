/**
 * Health Check and Monitoring Service
 * Comprehensive health monitoring for all system components
 */

import { environment } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import { cache } from './cache.js';
import { rateLimitAndCircuitBreaker } from './rate-limiter.js';
import { serverDetectionService } from './server-detection.js';
import axios from 'axios';

// ============================================================================
// Health Check Types
// ============================================================================

export interface HealthCheckResult {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  details?: Record<string, any>;
  timestamp: string;
  responseTime?: number;
  error?: string;
}

export interface SystemHealth {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: HealthCheckResult[];
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
    degraded: number;
  };
}

export interface HealthCheckConfig {
  name: string;
  enabled: boolean;
  timeout: number;
  interval?: number;
  retries?: number;
  critical?: boolean;
}

// ============================================================================
// Health Check Service
// ============================================================================

export class HealthCheckService {
  private checks: Map<string, HealthCheckConfig> = new Map();
  private results: Map<string, HealthCheckResult> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
    this.initializeDefaultChecks();
    this.startPeriodicChecks();
  }

  private initializeDefaultChecks(): void {
    // System health checks
    this.registerCheck({
      name: 'system',
      enabled: true,
      timeout: 1000,
      interval: 30000, // 30 seconds
      critical: true
    });

    // Cache health check
    this.registerCheck({
      name: 'cache',
      enabled: true,
      timeout: 2000,
      interval: 30000,
      critical: false
    });

    // Rate limiter health check
    this.registerCheck({
      name: 'rate-limiter',
      enabled: true,
      timeout: 1000,
      interval: 60000, // 1 minute
      critical: false
    });

    // Circuit breaker health check
    this.registerCheck({
      name: 'circuit-breaker',
      enabled: true,
      timeout: 1000,
      interval: 60000,
      critical: false
    });

    // Server detection health check
    this.registerCheck({
      name: 'server-detection',
      enabled: true,
      timeout: 5000,
      interval: 120000, // 2 minutes
      critical: false
    });

    // External dependencies health check
    this.registerCheck({
      name: 'external-deps',
      enabled: true,
      timeout: 10000,
      interval: 300000, // 5 minutes
      critical: false
    });

    logger.info('Health checks initialized', {
      checks: Array.from(this.checks.keys())
    });
  }

  /**
   * Registers a new health check
   */
  registerCheck(config: HealthCheckConfig): void {
    this.checks.set(config.name, config);
    logger.debug('Health check registered', { name: config.name, config });
  }

  /**
   * Unregisters a health check
   */
  unregisterCheck(name: string): void {
    const check = this.checks.get(name);
    if (check) {
      this.checks.delete(name);
      
      // Clear interval if exists
      const interval = this.intervals.get(name);
      if (interval) {
        clearInterval(interval);
        this.intervals.delete(name);
      }
      
      logger.debug('Health check unregistered', { name });
    }
  }

  /**
   * Starts periodic health checks
   */
  private startPeriodicChecks(): void {
    for (const [name, config] of this.checks) {
      if (config.enabled && config.interval) {
        const interval = setInterval(async () => {
          try {
            await this.runCheck(name);
          } catch (error) {
            logger.error('Periodic health check failed', {
              name,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }, config.interval);

        this.intervals.set(name, interval);
      }
    }
  }

  /**
   * Runs a specific health check
   */
  async runCheck(name: string): Promise<HealthCheckResult> {
    const config = this.checks.get(name);
    if (!config) {
      throw new Error(`Health check '${name}' not found`);
    }

    const startTime = Date.now();
    let result: HealthCheckResult;

    try {
      switch (name) {
        case 'system':
          result = await this.checkSystem();
          break;
        case 'cache':
          result = await this.checkCache();
          break;
        case 'rate-limiter':
          result = await this.checkRateLimiter();
          break;
        case 'circuit-breaker':
          result = await this.checkCircuitBreaker();
          break;
        case 'server-detection':
          result = await this.checkServerDetection();
          break;
        case 'external-deps':
          result = await this.checkExternalDependencies();
          break;
        default:
          result = {
            name,
            status: 'unhealthy',
            message: 'Unknown health check',
            timestamp: new Date().toISOString()
          };
      }

      result.responseTime = Date.now() - startTime;
      this.results.set(name, result);

      // Log health check result
      if (result.status === 'unhealthy' && config.critical) {
        logger.error('Critical health check failed', result);
      } else if (result.status === 'unhealthy') {
        logger.warn('Health check failed', result);
      } else {
        logger.debug('Health check passed', result);
      }

      return result;
    } catch (error) {
      result = {
        name,
        status: 'unhealthy',
        message: 'Health check execution failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime
      };

      this.results.set(name, result);
      logger.error('Health check execution error', result);
      return result;
    }
  }

  /**
   * System health check
   */
  private async checkSystem(): Promise<HealthCheckResult> {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const uptime = process.uptime();

    const details = {
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      uptime,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    };

    // Determine health status based on memory usage
    const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

    if (memoryUsagePercent > 90) {
      status = 'unhealthy';
    } else if (memoryUsagePercent > 75) {
      status = 'degraded';
    }

    return {
      name: 'system',
      status,
      message: `Memory usage: ${memoryUsagePercent.toFixed(2)}%`,
      details,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Cache health check
   */
  private async checkCache(): Promise<HealthCheckResult> {
    try {
      const stats = await cache.getStats();
      
      return {
        name: 'cache',
        status: 'healthy',
        message: `Cache hit rate: ${stats.hitRate.toFixed(2)}%`,
        details: {
          hits: stats.hits,
          misses: stats.misses,
          hitRate: stats.hitRate,
          size: stats.size,
          entries: stats.entries,
          memoryUsage: stats.memoryUsage
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        name: 'cache',
        status: 'unhealthy',
        message: 'Cache health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Rate limiter health check
   */
  private async checkRateLimiter(): Promise<HealthCheckResult> {
    try {
      const status = rateLimitAndCircuitBreaker.getStatus();
      
      return {
        name: 'rate-limiter',
        status: 'healthy',
        message: 'Rate limiter operational',
        details: {
          limiters: status.rateLimiter.limiters,
          config: status.rateLimiter.config
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        name: 'rate-limiter',
        status: 'unhealthy',
        message: 'Rate limiter health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Circuit breaker health check
   */
  private async checkCircuitBreaker(): Promise<HealthCheckResult> {
    try {
      const status = rateLimitAndCircuitBreaker.getStatus();
      const breakers = status.circuitBreaker.breakers;
      
      // Check if any circuit breakers are open
      const openBreakers = Object.values(breakers).filter((breaker: any) => breaker.state === 'open');
      
      let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
      if (openBreakers.length > 0) {
        overallStatus = 'degraded';
      }

      return {
        name: 'circuit-breaker',
        status: overallStatus,
        message: `${openBreakers.length} circuit breaker(s) open`,
        details: {
          breakers,
          openCount: openBreakers.length,
          totalCount: Object.keys(breakers).length
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        name: 'circuit-breaker',
        status: 'unhealthy',
        message: 'Circuit breaker health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Server detection health check
   */
  private async checkServerDetection(): Promise<HealthCheckResult> {
    try {
      const stats = serverDetectionService.getCacheStats();
      
      return {
        name: 'server-detection',
        status: 'healthy',
        message: `Server detection cache: ${stats.size} entries`,
        details: {
          cacheSize: stats.size,
          entries: stats.entries
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        name: 'server-detection',
        status: 'unhealthy',
        message: 'Server detection health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * External dependencies health check
   */
  private async checkExternalDependencies(): Promise<HealthCheckResult> {
    const dependencies = [];
    let healthyCount = 0;

    // Check Bitbucket server if configured
    const bitbucketUrl = environment.getConfig().bitbucket.serverUrl;
    if (bitbucketUrl) {
      try {
        const response = await axios.get(`${bitbucketUrl}/rest/api/1.0/application-properties`, {
          timeout: 5000,
          headers: { 'Accept': 'application/json' }
        });
        
        dependencies.push({
          name: 'bitbucket-server',
          status: response.status === 200 ? 'healthy' : 'unhealthy',
          responseTime: response.headers['x-response-time'] || 'unknown'
        });
        
        if (response.status === 200) healthyCount++;
      } catch (error) {
        dependencies.push({
          name: 'bitbucket-server',
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Check Redis if configured
    if (environment.getConfig().cache.type === 'redis') {
      try {
        // Simple Redis ping test
        await cache.get('health-check-ping');
        dependencies.push({
          name: 'redis',
          status: 'healthy'
        });
        healthyCount++;
      } catch (error) {
        dependencies.push({
          name: 'redis',
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const totalDeps = dependencies.length;
    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    
    if (totalDeps === 0) {
      status = 'healthy';
    } else if (healthyCount === 0) {
      status = 'unhealthy';
    } else if (healthyCount < totalDeps) {
      status = 'degraded';
    }

    return {
      name: 'external-deps',
      status,
      message: `${healthyCount}/${totalDeps} external dependencies healthy`,
      details: {
        dependencies,
        healthyCount,
        totalCount: totalDeps
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Gets overall system health
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const checks: HealthCheckResult[] = [];
    let healthyCount = 0;
    let unhealthyCount = 0;
    let degradedCount = 0;

    // Run all enabled checks
    for (const [name, config] of this.checks) {
      if (config.enabled) {
        try {
          const result = await this.runCheck(name);
          checks.push(result);

          switch (result.status) {
            case 'healthy':
              healthyCount++;
              break;
            case 'unhealthy':
              unhealthyCount++;
              break;
            case 'degraded':
              degradedCount++;
              break;
          }
        } catch (error) {
          const errorResult: HealthCheckResult = {
            name,
            status: 'unhealthy',
            message: 'Health check execution failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          };
          checks.push(errorResult);
          unhealthyCount++;
        }
      }
    }

    // Determine overall health
    let overall: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (unhealthyCount > 0) {
      overall = 'unhealthy';
    } else if (degradedCount > 0) {
      overall = 'degraded';
    }

    return {
      overall,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || '1.0.0',
      environment: environment.getConfig().node.env,
      checks,
      summary: {
        total: checks.length,
        healthy: healthyCount,
        unhealthy: unhealthyCount,
        degraded: degradedCount
      }
    };
  }

  /**
   * Gets health check results
   */
  getResults(): Map<string, HealthCheckResult> {
    return new Map(this.results);
  }

  /**
   * Gets a specific health check result
   */
  getResult(name: string): HealthCheckResult | undefined {
    return this.results.get(name);
  }

  /**
   * Stops all periodic health checks
   */
  stop(): void {
    for (const [name, interval] of this.intervals) {
      clearInterval(interval);
      logger.debug('Health check interval stopped', { name });
    }
    this.intervals.clear();
  }

  /**
   * Gets health check configuration
   */
  getConfig(): Map<string, HealthCheckConfig> {
    return new Map(this.checks);
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const healthCheckService = new HealthCheckService();
