import { loggerService } from '@/services/logger.service';

export interface RateLimitConfig {
  requestsPerMinute: number;
  burstLimit: number;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export class RateLimiter {
  private logger = loggerService.getLogger('integration-rate-limiter');
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  public async checkRateLimit(
    key: string = 'default'
  ): Promise<{ allowed: boolean; info: RateLimitInfo }> {
    const now = Date.now();
    const minuteWindow = 60 * 1000; // 1 minute

    // Get or create request history for this key
    let requestTimes = this.requests.get(key) || [];

    // Remove old requests outside the window
    requestTimes = requestTimes.filter(time => time > now - minuteWindow);

    // Check minute limit
    const minuteRequests = requestTimes.filter(time => time > now - minuteWindow);
    const minuteAllowed = minuteRequests.length < this.config.requestsPerMinute;

    // Check burst limit (requests in last 10 seconds)
    const burstWindow = 10 * 1000; // 10 seconds
    const burstRequests = requestTimes.filter(time => time > now - burstWindow);
    const burstAllowed = burstRequests.length < this.config.burstLimit;

    const allowed = minuteAllowed && burstAllowed;

    if (allowed) {
      // Add current request
      requestTimes.push(now);
      this.requests.set(key, requestTimes);
    }

    // Calculate rate limit info
    const remaining = Math.max(0, this.config.requestsPerMinute - minuteRequests.length);
    const reset =
      minuteRequests.length > 0 ? (minuteRequests[0] || now) + minuteWindow : now + minuteWindow;
    const retryAfter = allowed ? undefined : Math.ceil((reset - now) / 1000);

    const info: RateLimitInfo = {
      limit: this.config.requestsPerMinute,
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

  public async waitForSlot(key: string = 'default'): Promise<void> {
    const { allowed, info } = await this.checkRateLimit(key);

    if (!allowed && info.retryAfter) {
      this.logger.info('Rate limit exceeded, waiting', {
        key,
        retryAfter: info.retryAfter,
      });

      await new Promise(resolve => setTimeout(resolve, info.retryAfter! * 1000));
    }
  }

  public getInfo(key: string = 'default'): RateLimitInfo {
    const now = Date.now();
    const minuteWindow = 60 * 1000;

    let requestTimes = this.requests.get(key) || [];
    requestTimes = requestTimes.filter(time => time > now - minuteWindow);

    const remaining = Math.max(0, this.config.requestsPerMinute - requestTimes.length);
    const reset =
      requestTimes.length > 0 ? (requestTimes[0] || now) + minuteWindow : now + minuteWindow;

    return {
      limit: this.config.requestsPerMinute,
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

  public cleanup(): void {
    const now = Date.now();
    const minuteWindow = 60 * 1000;

    for (const [key, requestTimes] of this.requests.entries()) {
      const filteredTimes = requestTimes.filter(time => time > now - minuteWindow);

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

  public setConfig(newConfig: RateLimitConfig): void {
    this.config = newConfig;
    this.logger.info('Rate limiter config updated', {
      requestsPerMinute: this.config.requestsPerMinute,
      burstLimit: this.config.burstLimit,
    });
  }

  public getConfig(): RateLimitConfig {
    return { ...this.config };
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
}
