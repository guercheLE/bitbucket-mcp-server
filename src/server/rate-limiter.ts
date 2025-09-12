import { loggerService } from '@/services/logger.service';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: any) => string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export class RateLimiter {
  private logger = loggerService.getLogger('rate-limiter');
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      keyGenerator: () => 'default',
      ...config,
    };
  }

  public isAllowed(key: string = 'default'): { allowed: boolean; info: RateLimitInfo } {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get or create request history for this key
    let requestTimes = this.requests.get(key) || [];

    // Remove old requests outside the window
    requestTimes = requestTimes.filter(time => time > windowStart);

    // Check if we're within the limit
    const allowed = requestTimes.length < this.config.maxRequests;

    if (allowed) {
      // Add current request
      requestTimes.push(now);
      this.requests.set(key, requestTimes);
    }

    // Calculate rate limit info
    const remaining = Math.max(0, this.config.maxRequests - requestTimes.length);
    const reset =
      requestTimes.length > 0
        ? (requestTimes[0] || now) + this.config.windowMs
        : now + this.config.windowMs;
    const retryAfter = allowed ? undefined : Math.ceil((reset - now) / 1000);

    const info: RateLimitInfo = {
      limit: this.config.maxRequests,
      remaining,
      reset,
      retryAfter: retryAfter || 0,
    };

    this.logger.debug('Rate limit check', {
      key,
      allowed,
      remaining,
      reset: new Date(reset).toISOString(),
      retryAfter,
    });

    return { allowed, info };
  }

  public recordRequest(key: string = 'default', success: boolean = true): void {
    // Skip recording if configured to do so
    if (success && this.config.skipSuccessfulRequests) {
      return;
    }

    if (!success && this.config.skipFailedRequests) {
      return;
    }

    // The request is already recorded in isAllowed, but we can add additional logic here
    this.logger.debug('Request recorded', {
      key,
      success,
    });
  }

  public getInfo(key: string = 'default'): RateLimitInfo {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    let requestTimes = this.requests.get(key) || [];
    requestTimes = requestTimes.filter(time => time > windowStart);

    const remaining = Math.max(0, this.config.maxRequests - requestTimes.length);
    const reset =
      requestTimes.length > 0
        ? (requestTimes[0] || now) + this.config.windowMs
        : now + this.config.windowMs;

    return {
      limit: this.config.maxRequests,
      remaining,
      reset,
    };
  }

  public reset(key?: string): void {
    if (key) {
      this.requests.delete(key);
      this.logger.debug('Rate limit reset for key', { key });
    } else {
      this.requests.clear();
      this.logger.info('All rate limits reset');
    }
  }

  public getStats(): {
    totalKeys: number;
    totalRequests: number;
    averageRequestsPerKey: number;
  } {
    const totalKeys = this.requests.size;
    const totalRequests = Array.from(this.requests.values()).reduce(
      (sum, times) => sum + times.length,
      0
    );
    const averageRequestsPerKey = totalKeys > 0 ? totalRequests / totalKeys : 0;

    return {
      totalKeys,
      totalRequests,
      averageRequestsPerKey,
    };
  }

  public cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    for (const [key, requestTimes] of this.requests.entries()) {
      const filteredTimes = requestTimes.filter(time => time > windowStart);

      if (filteredTimes.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, filteredTimes);
      }
    }

    this.logger.debug('Rate limiter cleanup completed', {
      remainingKeys: this.requests.size,
    });
  }

  public setConfig(newConfig: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('Rate limiter config updated', {
      windowMs: this.config.windowMs,
      maxRequests: this.config.maxRequests,
    });
  }

  public getConfig(): RateLimitConfig {
    return { ...this.config };
  }
}
