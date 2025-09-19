/**
 * Unit Tests for Rate Limiter and Circuit Breaker Service
 * Tests for rate limiting and circuit breaker functionality
 */

import { RateLimiterService, CircuitBreakerService, RateLimitAndCircuitBreakerService } from '../../../src/services/rate-limiter';

// Mock logger
jest.mock('../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

// Mock environment
jest.mock('../../../src/config/environment.js', () => ({
  environment: {
    getConfig: () => ({
      security: {
        rateLimit: {
          max: 100,
          windowMs: 900000 // 15 minutes
        }
      },
      performance: {
        requestTimeout: 10000,
        maxRetries: 3,
        circuitBreaker: {
          threshold: 5,
          timeout: 60000
        }
      }
    })
  }
}));

describe('RateLimiterService', () => {
  let rateLimiter: RateLimiterService;

  beforeEach(() => {
    rateLimiter = new RateLimiterService({
      keyPrefix: 'test:rate-limit:',
      points: 5,
      duration: 60, // 1 minute
      blockDuration: 10
    });
  });

  afterEach(async () => {
    // Clean up any test data
    await rateLimiter.reset('test-key', 'global');
  });

  describe('Rate Limiting', () => {
    it('should allow requests within limit', async () => {
      const key = 'test-key';
      const result = await rateLimiter.consume(key, 'global', 1);

      expect(result.success).toBe(true);
      expect(result.remainingPoints).toBe(4);
      expect(result.totalHits).toBe(1);
    });

    it('should block requests when limit exceeded', async () => {
      const key = 'test-key';
      
      // Consume all points
      for (let i = 0; i < 5; i++) {
        await rateLimiter.consume(key, 'global', 1);
      }

      // This should be blocked
      const result = await rateLimiter.consume(key, 'global', 1);
      
      expect(result.success).toBe(false);
      expect(result.remainingPoints).toBe(0);
      expect(result.totalHits).toBe(5);
    });

    it('should track multiple points consumption', async () => {
      const key = 'test-key';
      const result = await rateLimiter.consume(key, 'global', 3);

      expect(result.success).toBe(true);
      expect(result.remainingPoints).toBe(2);
      expect(result.totalHits).toBe(3);
    });

    it('should get rate limit status', async () => {
      const key = 'test-key';
      await rateLimiter.consume(key, 'global', 2);

      const status = await rateLimiter.getStatus(key, 'global');
      
      expect(status).not.toBeNull();
      expect(status!.remainingPoints).toBe(3);
      expect(status!.totalHits).toBe(2);
    });

    it('should reset rate limit', async () => {
      const key = 'test-key';
      await rateLimiter.consume(key, 'global', 5); // Exhaust limit

      const reset = await rateLimiter.reset(key, 'global');
      expect(reset).toBe(true);

      const status = await rateLimiter.getStatus(key, 'global');
      expect(status).toBeNull();
    });

    it('should handle different limiter types', async () => {
      const key = 'test-key';
      
      const globalResult = await rateLimiter.consume(key, 'global', 1);
      const ipResult = await rateLimiter.consume(key, 'ip', 1);

      expect(globalResult.success).toBe(true);
      expect(ipResult.success).toBe(true);
    });
  });

  describe('Configuration', () => {
    it('should return available limiter types', () => {
      const types = rateLimiter.getLimiterTypes();
      
      expect(types).toContain('global');
      expect(types).toContain('ip');
      expect(types).toContain('user');
    });

    it('should return configuration', () => {
      const config = rateLimiter.getConfig();
      
      expect(config).toHaveProperty('keyPrefix');
      expect(config).toHaveProperty('points');
      expect(config).toHaveProperty('duration');
      expect(config.keyPrefix).toBe('test:rate-limit:');
    });
  });
});

describe('CircuitBreakerService', () => {
  let circuitBreaker: CircuitBreakerService;

  beforeEach(() => {
    circuitBreaker = new CircuitBreakerService({
      timeout: 1000,
      errorThresholdPercentage: 50,
      resetTimeout: 5000,
      rollingCountTimeout: 10000,
      rollingCountBuckets: 10,
      volumeThreshold: 2
    });
  });

  describe('Circuit Breaker Operations', () => {
    it('should execute successful operations', async () => {
      const successFn = jest.fn().mockResolvedValue('success');
      
      const result = await circuitBreaker.execute('bitbucket-api', successFn);
      
      expect(result).toBe('success');
      expect(successFn).toHaveBeenCalledTimes(1);
    });

    it('should handle failed operations', async () => {
      const failFn = jest.fn().mockRejectedValue(new Error('Test error'));
      
      await expect(circuitBreaker.execute('bitbucket-api', failFn))
        .rejects.toThrow('Test error');
      
      expect(failFn).toHaveBeenCalledTimes(1);
    });

    it('should open circuit after threshold', async () => {
      const failFn = jest.fn().mockRejectedValue(new Error('Test error'));
      
      // Execute multiple failing operations
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute('bitbucket-api', failFn);
        } catch (error) {
          // Expected to fail
        }
      }

      // Circuit should be open now
      const status = circuitBreaker.getStatus('bitbucket-api');
      expect(status?.state).toBe('open');
    });

    it('should get circuit breaker status', () => {
      const status = circuitBreaker.getStatus('bitbucket-api');
      
      expect(status).toHaveProperty('state');
      expect(status).toHaveProperty('stats');
      expect(status).toHaveProperty('name');
      expect(status?.name).toBe('Bitbucket API');
    });

    it('should get all circuit breaker statuses', () => {
      const statuses = circuitBreaker.getAllStatuses();
      
      expect(statuses).toHaveProperty('bitbucket-api');
      expect(statuses).toHaveProperty('database');
      expect(statuses).toHaveProperty('cache');
    });

    it('should manually open circuit breaker', () => {
      const opened = circuitBreaker.open('bitbucket-api');
      
      expect(opened).toBe(true);
      
      const status = circuitBreaker.getStatus('bitbucket-api');
      expect(status?.state).toBe('open');
    });

    it('should manually close circuit breaker', () => {
      circuitBreaker.open('bitbucket-api');
      const closed = circuitBreaker.close('bitbucket-api');
      
      expect(closed).toBe(true);
      
      const status = circuitBreaker.getStatus('bitbucket-api');
      expect(status?.state).toBe('closed');
    });

    it('should return available breaker names', () => {
      const names = circuitBreaker.getBreakerNames();
      
      expect(names).toContain('bitbucket-api');
      expect(names).toContain('database');
      expect(names).toContain('cache');
    });
  });

  describe('Fallback Functions', () => {
    it('should execute fallback when circuit is open', async () => {
      // Open the circuit
      circuitBreaker.open('bitbucket-api');
      
      const failFn = jest.fn().mockRejectedValue(new Error('Test error'));
      
      const result = await circuitBreaker.execute('bitbucket-api', failFn);
      
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('fallback', true);
      expect(result).toHaveProperty('error', 'Service temporarily unavailable');
    });
  });
});

describe('RateLimitAndCircuitBreakerService', () => {
  let service: RateLimitAndCircuitBreakerService;

  beforeEach(() => {
    service = new RateLimitAndCircuitBreakerService(
      {
        keyPrefix: 'test:combined:',
        points: 10,
        duration: 60
      },
      {
        timeout: 1000,
        errorThresholdPercentage: 50,
        resetTimeout: 5000
      }
    );
  });

  describe('Combined Protection', () => {
    it('should execute with both rate limiting and circuit breaker', async () => {
      const successFn = jest.fn().mockResolvedValue('success');
      
      const result = await service.executeWithProtection(
        successFn,
        {
          rateLimitKey: 'test-key',
          rateLimitType: 'global',
          circuitBreakerName: 'bitbucket-api'
        }
      );
      
      expect(result).toBe('success');
      expect(successFn).toHaveBeenCalledTimes(1);
    });

    it('should respect rate limits', async () => {
      const successFn = jest.fn().mockResolvedValue('success');
      
      // Exhaust rate limit
      for (let i = 0; i < 10; i++) {
        await service.executeWithProtection(
          successFn,
          {
            rateLimitKey: 'test-key',
            rateLimitType: 'global',
            circuitBreakerName: 'bitbucket-api'
          }
        );
      }

      // This should be rate limited
      await expect(service.executeWithProtection(
        successFn,
        {
          rateLimitKey: 'test-key',
          rateLimitType: 'global',
          circuitBreakerName: 'bitbucket-api'
        }
      )).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle circuit breaker failures', async () => {
      const failFn = jest.fn().mockRejectedValue(new Error('Test error'));
      
      // Open circuit breaker
      service.getCircuitBreaker().open('bitbucket-api');
      
      const result = await service.executeWithProtection(
        failFn,
        {
          rateLimitKey: 'test-key',
          rateLimitType: 'global',
          circuitBreakerName: 'bitbucket-api'
        }
      );
      
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('fallback', true);
    });

    it('should return combined status', () => {
      const status = service.getStatus();
      
      expect(status).toHaveProperty('rateLimiter');
      expect(status).toHaveProperty('circuitBreaker');
      expect(status.rateLimiter).toHaveProperty('config');
      expect(status.rateLimiter).toHaveProperty('limiters');
      expect(status.circuitBreaker).toHaveProperty('config');
      expect(status.circuitBreaker).toHaveProperty('breakers');
    });
  });

  describe('Service Access', () => {
    it('should provide access to rate limiter service', () => {
      const rateLimiter = service.getRateLimiter();
      
      expect(rateLimiter).toBeInstanceOf(RateLimiterService);
    });

    it('should provide access to circuit breaker service', () => {
      const circuitBreaker = service.getCircuitBreaker();
      
      expect(circuitBreaker).toBeInstanceOf(CircuitBreakerService);
    });
  });
});
