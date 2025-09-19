/**
 * Rate Limiting and Circuit Breaker Service
 * Implements rate limiting with sliding window and circuit breaker pattern
 */

import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import CircuitBreaker from 'opossum';
import { environment } from '../config/environment';
import { logger } from '../utils/logger';
import { cache } from './cache';

// ============================================================================
// Rate Limiter Configuration
// ============================================================================

export interface RateLimiterConfig {
  keyPrefix: string;
  points: number; // Number of requests
  duration: number; // Per duration in seconds
  blockDuration?: number; // Block duration in seconds
  execEvenly?: boolean; // Execute requests evenly across duration
  storeClient?: any; // Redis client for distributed rate limiting
}

export interface CircuitBreakerConfig {
  timeout: number; // Timeout in milliseconds
  errorThresholdPercentage: number; // Error percentage threshold
  resetTimeout: number; // Reset timeout in milliseconds
  rollingCountTimeout: number; // Rolling count timeout in milliseconds
  rollingCountBuckets: number; // Number of rolling count buckets
  name?: string; // Circuit breaker name
  group?: string; // Circuit breaker group
  volumeThreshold?: number; // Minimum number of requests before circuit opens
}

// ============================================================================
// Rate Limiter Service
// ============================================================================

export class RateLimiterService {
  private limiters: Map<string, RateLimiterMemory | RateLimiterRedis> = new Map();
  private config: RateLimiterConfig;

  constructor(config?: Partial<RateLimiterConfig>) {
    this.config = {
      keyPrefix: 'bitbucket-mcp:rate-limit:',
      points: environment.getConfig().security.rateLimit.max,
      duration: Math.floor(environment.getConfig().security.rateLimit.windowMs / 1000),
      blockDuration: 60, // 1 minute block
      execEvenly: true,
      ...config
    };

    this.initializeLimiters();
  }

  private initializeLimiters(): void {
    // Global rate limiter
    this.createLimiter('global', {
      points: this.config.points,
      duration: this.config.duration,
      blockDuration: this.config.blockDuration,
      execEvenly: this.config.execEvenly
    });

    // Per-IP rate limiter (more restrictive)
    this.createLimiter('ip', {
      points: Math.floor(this.config.points / 2),
      duration: this.config.duration,
      blockDuration: this.config.blockDuration,
      execEvenly: this.config.execEvenly
    });

    // Per-user rate limiter (if authenticated)
    this.createLimiter('user', {
      points: this.config.points,
      duration: this.config.duration,
      blockDuration: this.config.blockDuration,
      execEvenly: this.config.execEvenly
    });

    // API endpoint specific limiters
    this.createLimiter('api:heavy', {
      points: Math.floor(this.config.points / 4),
      duration: this.config.duration,
      blockDuration: (this.config.blockDuration ?? 60) * 2,
      execEvenly: this.config.execEvenly
    });

    logger.info('Rate limiters initialized', {
      global: this.config.points,
      ip: Math.floor(this.config.points / 2),
      user: this.config.points,
      heavy: Math.floor(this.config.points / 4)
    });
  }

  private createLimiter(name: string, config: any): void {
    try {
      const limiter = new RateLimiterMemory(config);
      this.limiters.set(name, limiter);
      
      logger.debug('Rate limiter created', { name, config });
    } catch (error) {
      logger.error('Failed to create rate limiter', {
        name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Consumes rate limit points for a given key
   */
  async consume(key: string, limiterType: string = 'global', points: number = 1): Promise<{
    success: boolean;
    remainingPoints: number;
    msBeforeNext: number;
    totalHits: number;
  }> {
    const limiter = this.limiters.get(limiterType);
    if (!limiter) {
      throw new Error(`Rate limiter '${limiterType}' not found`);
    }

    const fullKey = `${this.config.keyPrefix}${limiterType}:${key}`;

    try {
      const result = await limiter.consume(fullKey, points);
      
      logger.debug('Rate limit consumed', {
        key: fullKey,
        limiterType,
        points,
        remainingPoints: result.remainingPoints,
        msBeforeNext: result.msBeforeNext
      });

      return {
        success: true,
        remainingPoints: result?.remainingPoints ?? 0,
        msBeforeNext: result?.msBeforeNext ?? 0,
        totalHits: 0 // Not available in rate-limiter-flexible
      };
    } catch (rejRes) {
      const result = rejRes as any;
      
      logger.warn('Rate limit exceeded', {
        key: fullKey,
        limiterType,
        points,
        remainingPoints: result.remainingPoints,
        msBeforeNext: result.msBeforeNext,
        totalHits: result.totalHits
      });

      return {
        success: false,
        remainingPoints: result?.remainingPoints ?? 0,
        msBeforeNext: result?.msBeforeNext ?? 0,
        totalHits: result?.totalHits ?? 0
      };
    }
  }

  /**
   * Gets rate limit status for a given key
   */
  async getStatus(key: string, limiterType: string = 'global'): Promise<{
    remainingPoints: number;
    msBeforeNext: number;
    totalHits: number;
  } | null> {
    const limiter = this.limiters.get(limiterType);
    if (!limiter) {
      return null;
    }

    const fullKey = `${this.config.keyPrefix}${limiterType}:${key}`;

    try {
      const result = await limiter.get(fullKey);
      if (!result) {
        return null;
      }
      return {
        remainingPoints: result.remainingPoints,
        msBeforeNext: result.msBeforeNext,
        totalHits: 0 // Not available in rate-limiter-flexible
      };
    } catch (error) {
      logger.error('Failed to get rate limit status', {
        key: fullKey,
        limiterType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Resets rate limit for a given key
   */
  async reset(key: string, limiterType: string = 'global'): Promise<boolean> {
    const limiter = this.limiters.get(limiterType);
    if (!limiter) {
      return false;
    }

    const fullKey = `${this.config.keyPrefix}${limiterType}:${key}`;

    try {
      await limiter.delete(fullKey);
      logger.debug('Rate limit reset', { key: fullKey, limiterType });
      return true;
    } catch (error) {
      logger.error('Failed to reset rate limit', {
        key: fullKey,
        limiterType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Gets all available limiter types
   */
  getLimiterTypes(): string[] {
    return Array.from(this.limiters.keys());
  }

  /**
   * Gets limiter configuration
   */
  getConfig(): RateLimiterConfig {
    return { ...this.config };
  }
}

// ============================================================================
// Circuit Breaker Service
// ============================================================================

export class CircuitBreakerService {
  private breakers: Map<string, CircuitBreaker> = new Map();
  private config: CircuitBreakerConfig;

  constructor(config?: Partial<CircuitBreakerConfig>) {
    this.config = {
      timeout: environment.getConfig().performance.requestTimeout,
      errorThresholdPercentage: 50,
      resetTimeout: environment.getConfig().performance.circuitBreaker.timeout,
      rollingCountTimeout: 10000, // 10 seconds
      rollingCountBuckets: 10,
      volumeThreshold: 5,
      ...config
    };

    this.initializeBreakers();
  }

  private initializeBreakers(): void {
    // Bitbucket API circuit breaker
    this.createBreaker('bitbucket-api', {
      timeout: this.config.timeout,
      errorThresholdPercentage: this.config.errorThresholdPercentage,
      resetTimeout: this.config.resetTimeout,
      rollingCountTimeout: this.config.rollingCountTimeout,
      rollingCountBuckets: this.config.rollingCountBuckets,
      volumeThreshold: this.config.volumeThreshold,
      name: 'Bitbucket API',
      group: 'external-apis'
    });

    // Database operations circuit breaker
    this.createBreaker('database', {
      timeout: 5000, // 5 seconds
      errorThresholdPercentage: 30,
      resetTimeout: 30000, // 30 seconds
      rollingCountTimeout: this.config.rollingCountTimeout,
      rollingCountBuckets: this.config.rollingCountBuckets,
      volumeThreshold: 3,
      name: 'Database',
      group: 'data-layer'
    });

    // Cache operations circuit breaker
    this.createBreaker('cache', {
      timeout: 1000, // 1 second
      errorThresholdPercentage: 40,
      resetTimeout: 15000, // 15 seconds
      rollingCountTimeout: this.config.rollingCountTimeout,
      rollingCountBuckets: this.config.rollingCountBuckets,
      volumeThreshold: 2,
      name: 'Cache',
      group: 'data-layer'
    });

    logger.info('Circuit breakers initialized', {
      bitbucketApi: this.config.timeout,
      database: 5000,
      cache: 1000
    });
  }

  private createBreaker(name: string, config: any): void {
    try {
      const breaker = new CircuitBreaker(this.createFallbackFunction(name), {
        timeout: config.timeout,
        errorThresholdPercentage: config.errorThresholdPercentage,
        resetTimeout: config.resetTimeout,
        rollingCountTimeout: config.rollingCountTimeout,
        rollingCountBuckets: config.rollingCountBuckets,
        volumeThreshold: config.volumeThreshold,
        name: config.name || name,
        group: config.group || 'default'
      });

      // Event listeners
      breaker.on('open', () => {
        logger.warn('Circuit breaker opened', {
          name,
          state: breaker.stats
        });
      });

      breaker.on('halfOpen', () => {
        logger.info('Circuit breaker half-open', {
          name,
          state: breaker.stats
        });
      });

      breaker.on('close', () => {
        logger.info('Circuit breaker closed', {
          name,
          state: breaker.stats
        });
      });

      breaker.on('success', (result: any) => {
        logger.debug('Circuit breaker success', {
          name,
          result: typeof result === 'object' ? 'object' : typeof result
        });
      });

      breaker.on('failure', (error: any) => {
        logger.warn('Circuit breaker failure', {
          name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      });

      breaker.on('timeout', () => {
        logger.warn('Circuit breaker timeout', {
          name,
          timeout: config.timeout
        });
      });

      this.breakers.set(name, breaker);
      
      logger.debug('Circuit breaker created', { name, config });
    } catch (error) {
      logger.error('Failed to create circuit breaker', {
        name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private createFallbackFunction(name: string): (...args: unknown[]) => Promise<unknown> {
    return async (...args: unknown[]) => {
      logger.warn('Circuit breaker fallback executed', {
        name,
        args: args.length
      });

      // Return appropriate fallback based on breaker type
      switch (name) {
        case 'bitbucket-api':
          return {
            success: false,
            error: 'Service temporarily unavailable',
            fallback: true
          };
        case 'database':
          return {
            success: false,
            error: 'Database temporarily unavailable',
            fallback: true
          };
        case 'cache':
          return {
            success: false,
            error: 'Cache temporarily unavailable',
            fallback: true
          };
        default:
          return {
            success: false,
            error: 'Service temporarily unavailable',
            fallback: true
          };
      }
    };
  }

  /**
   * Executes a function through a circuit breaker
   */
  async execute<T>(name: string, fn: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T> {
    const breaker = this.breakers.get(name);
    if (!breaker) {
      throw new Error(`Circuit breaker '${name}' not found`);
    }

    try {
      const result = await breaker.fire(fn, ...args);
      return result as T;
    } catch (error) {
      logger.error('Circuit breaker execution failed', {
        name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Gets circuit breaker status
   */
  getStatus(name: string): any | null {
    const breaker = this.breakers.get(name);
    if (!breaker) {
      return null;
    }

    return {
      state: breaker.opened ? 'open' : breaker.halfOpen ? 'half-open' : 'closed',
      stats: breaker.stats,
      name: breaker.name,
      group: breaker.group
    };
  }

  /**
   * Gets all circuit breaker statuses
   */
  getAllStatuses(): Record<string, any> {
    const statuses: Record<string, any> = {};
    
    for (const [name, breaker] of this.breakers) {
      statuses[name] = this.getStatus(name);
    }

    return statuses;
  }

  /**
   * Manually opens a circuit breaker
   */
  open(name: string): boolean {
    const breaker = this.breakers.get(name);
    if (!breaker) {
      return false;
    }

    breaker.open();
    logger.info('Circuit breaker manually opened', { name });
    return true;
  }

  /**
   * Manually closes a circuit breaker
   */
  close(name: string): boolean {
    const breaker = this.breakers.get(name);
    if (!breaker) {
      return false;
    }

    breaker.close();
    logger.info('Circuit breaker manually closed', { name });
    return true;
  }

  /**
   * Gets all available circuit breaker names
   */
  getBreakerNames(): string[] {
    return Array.from(this.breakers.keys());
  }

  /**
   * Gets circuit breaker configuration
   */
  getConfig(): CircuitBreakerConfig {
    return { ...this.config };
  }
}

// ============================================================================
// Combined Rate Limiting and Circuit Breaker Service
// ============================================================================

export class RateLimitAndCircuitBreakerService {
  private rateLimiter: RateLimiterService;
  private circuitBreaker: CircuitBreakerService;

  constructor(
    rateLimiterConfig?: Partial<RateLimiterConfig>,
    circuitBreakerConfig?: Partial<CircuitBreakerConfig>
  ) {
    this.rateLimiter = new RateLimiterService(rateLimiterConfig);
    this.circuitBreaker = new CircuitBreakerService(circuitBreakerConfig);
  }

  /**
   * Executes a function with both rate limiting and circuit breaker protection
   */
  async executeWithProtection<T>(
    fn: (...args: any[]) => Promise<T>,
    options: {
      rateLimitKey: string;
      rateLimitType?: string;
      circuitBreakerName: string;
      rateLimitPoints?: number;
    },
    ...args: any[]
  ): Promise<T> {
    // Check rate limit first
    const rateLimitResult = await this.rateLimiter.consume(
      options.rateLimitKey,
      options.rateLimitType || 'global',
      options.rateLimitPoints || 1
    );

    if (!rateLimitResult.success) {
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(rateLimitResult.msBeforeNext / 1000)} seconds`);
    }

    // Execute through circuit breaker
    return this.circuitBreaker.execute(options.circuitBreakerName, fn, ...args);
  }

  /**
   * Gets combined status of rate limiting and circuit breakers
   */
  getStatus(): {
    rateLimiter: {
      config: RateLimiterConfig;
      limiters: string[];
    };
    circuitBreaker: {
      config: CircuitBreakerConfig;
      breakers: Record<string, any>;
    };
  } {
    return {
      rateLimiter: {
        config: this.rateLimiter.getConfig(),
        limiters: this.rateLimiter.getLimiterTypes()
      },
      circuitBreaker: {
        config: this.circuitBreaker.getConfig(),
        breakers: this.circuitBreaker.getAllStatuses()
      }
    };
  }

  /**
   * Gets rate limiter service
   */
  getRateLimiter(): RateLimiterService {
    return this.rateLimiter;
  }

  /**
   * Gets circuit breaker service
   */
  getCircuitBreaker(): CircuitBreakerService {
    return this.circuitBreaker;
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const rateLimitAndCircuitBreaker = new RateLimitAndCircuitBreakerService();
