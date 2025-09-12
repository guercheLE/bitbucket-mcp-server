import { RateLimiter } from '../rate-limiter';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter({
      requestsPerMinute: 10,
      burstLimit: 3,
    });
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limits', async () => {
      const result = await rateLimiter.checkRateLimit('test-key');

      expect(result.allowed).toBe(true);
      expect(result.info.remaining).toBe(9);
      expect(result.info.limit).toBe(10);
      expect(result.info.retryAfter).toBeUndefined();
    });

    it('should reject requests when minute limit is exceeded', async () => {
      // Make 10 requests to exceed the limit
      for (let i = 0; i < 10; i++) {
        await rateLimiter.checkRateLimit('test-key');
      }

      const result = await rateLimiter.checkRateLimit('test-key');

      expect(result.allowed).toBe(false);
      expect(result.info.remaining).toBe(0);
      expect(result.info.retryAfter).toBeDefined();
    });

    it('should reject requests when burst limit is exceeded', async () => {
      // Make 3 requests quickly to exceed burst limit
      const promises = [];
      for (let i = 0; i < 3; i++) {
        promises.push(rateLimiter.checkRateLimit('test-key'));
      }
      await Promise.all(promises);

      const result = await rateLimiter.checkRateLimit('test-key');

      expect(result.allowed).toBe(false);
      expect(result.info.retryAfter).toBeDefined();
    });

    it('should handle different keys independently', async () => {
      // Exceed limit for key1
      for (let i = 0; i < 10; i++) {
        await rateLimiter.checkRateLimit('key1');
      }

      // key2 should still be allowed
      const result = await rateLimiter.checkRateLimit('key2');
      expect(result.allowed).toBe(true);
    });

    it('should reset limits after time window', async () => {
      // Exceed limit
      for (let i = 0; i < 10; i++) {
        await rateLimiter.checkRateLimit('test-key');
      }

      // Mock time to be 1 minute later
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => originalDateNow() + 60000);

      const result = await rateLimiter.checkRateLimit('test-key');
      expect(result.allowed).toBe(true);

      // Restore original Date.now
      Date.now = originalDateNow;
    });
  });

  describe('waitForSlot', () => {
    it('should not wait when request is allowed', async () => {
      const startTime = Date.now();
      await rateLimiter.waitForSlot('test-key');
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Should be immediate
    });

    it('should wait when request is rate limited', async () => {
      // Exceed burst limit
      for (let i = 0; i < 3; i++) {
        await rateLimiter.checkRateLimit('test-key');
      }

      const startTime = Date.now();
      await rateLimiter.waitForSlot('test-key');
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThan(100); // Should have waited
    });
  });

  describe('getInfo', () => {
    it('should return current rate limit info', () => {
      const info = rateLimiter.getInfo('test-key');

      expect(info.limit).toBe(10);
      expect(info.remaining).toBe(10);
      expect(info.reset).toBeDefined();
    });

    it('should return updated info after requests', async () => {
      await rateLimiter.checkRateLimit('test-key');
      const info = rateLimiter.getInfo('test-key');

      expect(info.remaining).toBe(9);
    });
  });

  describe('reset', () => {
    it('should reset specific key', async () => {
      await rateLimiter.checkRateLimit('test-key');
      rateLimiter.reset('test-key');

      const info = rateLimiter.getInfo('test-key');
      expect(info.remaining).toBe(10);
    });

    it('should reset all keys when no key specified', async () => {
      await rateLimiter.checkRateLimit('key1');
      await rateLimiter.checkRateLimit('key2');
      rateLimiter.reset();

      const info1 = rateLimiter.getInfo('key1');
      const info2 = rateLimiter.getInfo('key2');
      expect(info1.remaining).toBe(10);
      expect(info2.remaining).toBe(10);
    });
  });

  describe('cleanup', () => {
    it('should remove old request entries', async () => {
      await rateLimiter.checkRateLimit('test-key');

      // Mock time to be 1 minute later
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => originalDateNow() + 60000);

      rateLimiter.cleanup();

      const info = rateLimiter.getInfo('test-key');
      expect(info.remaining).toBe(10);

      // Restore original Date.now
      Date.now = originalDateNow;
    });
  });

  describe('setConfig', () => {
    it('should update configuration', () => {
      const newConfig = {
        requestsPerMinute: 20,
        burstLimit: 5,
      };

      rateLimiter.setConfig(newConfig);
      const config = rateLimiter.getConfig();

      expect(config.requestsPerMinute).toBe(20);
      expect(config.burstLimit).toBe(5);
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', () => {
      const config = rateLimiter.getConfig();

      expect(config.requestsPerMinute).toBe(10);
      expect(config.burstLimit).toBe(3);
    });
  });

  describe('getStats', () => {
    it('should return statistics', async () => {
      await rateLimiter.checkRateLimit('key1');
      await rateLimiter.checkRateLimit('key2');

      const stats = rateLimiter.getStats();

      expect(stats.totalKeys).toBe(2);
      expect(stats.totalRequests).toBe(2);
      expect(stats.averageRequestsPerKey).toBe(1);
    });
  });
});
