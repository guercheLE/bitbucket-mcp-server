import { RetryHandler } from '../retry-handler';

describe('RetryHandler', () => {
  let retryHandler: RetryHandler;

  beforeEach(() => {
    retryHandler = new RetryHandler({
      maxAttempts: 3,
      baseDelay: 100,
      maxDelay: 1000,
      backoffMultiplier: 2,
      retryableStatusCodes: [429, 500, 502, 503, 504],
      retryableErrors: ['rate limit', 'timeout', 'network error'],
    });
  });

  describe('executeWithRetry', () => {
    it('should execute operation successfully on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await retryHandler.executeWithRetry(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('rate limit exceeded'))
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValue('success');

      const result = await retryHandler.executeWithRetry(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('validation error'));

      await expect(retryHandler.executeWithRetry(operation)).rejects.toThrow('validation error');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should respect max attempts', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('rate limit exceeded'));

      await expect(retryHandler.executeWithRetry(operation)).rejects.toThrow('rate limit exceeded');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should use exponential backoff with jitter', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('rate limit exceeded'))
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValue('success');

      const startTime = Date.now();
      await retryHandler.executeWithRetry(operation);
      const endTime = Date.now();

      // Should have waited at least baseDelay + baseDelay * backoffMultiplier
      expect(endTime - startTime).toBeGreaterThan(100 + 200);
    });

    it('should respect max delay', async () => {
      const retryHandlerWithLongDelay = new RetryHandler({
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 100,
        backoffMultiplier: 2,
        retryableStatusCodes: [500],
        retryableErrors: ['server error'],
      });

      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('server error'))
        .mockResolvedValue('success');

      const startTime = Date.now();
      await retryHandlerWithLongDelay.executeWithRetry(operation);
      const endTime = Date.now();

      // Should not wait longer than maxDelay
      expect(endTime - startTime).toBeLessThan(200);
    });

    it('should handle network errors as retryable', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValue('success');

      const result = await retryHandler.executeWithRetry(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should handle timeout errors as retryable', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('request timeout'))
        .mockResolvedValue('success');

      const result = await retryHandler.executeWithRetry(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should handle HTTP status codes in error messages', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('HTTP 429'))
        .mockResolvedValue('success');

      const result = await retryHandler.executeWithRetry(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should include context in logging', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      await retryHandler.executeWithRetry(operation, 'test-context');

      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('shouldRetry', () => {
    it('should return false when max attempts reached', () => {
      const error = new Error('rate limit exceeded');
      const shouldRetry = (retryHandler as any).shouldRetry(error, 3);

      expect(shouldRetry).toBe(false);
    });

    it('should return true for retryable error patterns', () => {
      const error = new Error('rate limit exceeded');
      const shouldRetry = (retryHandler as any).shouldRetry(error, 1);

      expect(shouldRetry).toBe(true);
    });

    it('should return true for retryable HTTP status codes', () => {
      const error = new Error('HTTP 500');
      const shouldRetry = (retryHandler as any).shouldRetry(error, 1);

      expect(shouldRetry).toBe(true);
    });

    it('should return true for network errors', () => {
      const error = new Error('connection refused');
      const shouldRetry = (retryHandler as any).shouldRetry(error, 1);

      expect(shouldRetry).toBe(true);
    });

    it('should return true for timeout errors', () => {
      const error = new Error('request timeout');
      const shouldRetry = (retryHandler as any).shouldRetry(error, 1);

      expect(shouldRetry).toBe(true);
    });

    it('should return false for non-retryable errors', () => {
      const error = new Error('validation error');
      const shouldRetry = (retryHandler as any).shouldRetry(error, 1);

      expect(shouldRetry).toBe(false);
    });
  });

  describe('calculateDelay', () => {
    it('should calculate exponential backoff delay', () => {
      const delay1 = (retryHandler as any).calculateDelay(1);
      const delay2 = (retryHandler as any).calculateDelay(2);
      const delay3 = (retryHandler as any).calculateDelay(3);

      expect(delay2).toBeGreaterThan(delay1);
      expect(delay3).toBeGreaterThan(delay2);
    });

    it('should respect max delay', () => {
      const delay = (retryHandler as any).calculateDelay(10); // High attempt number

      expect(delay).toBeLessThanOrEqual(1000);
    });

    it('should include jitter', () => {
      const delay1 = (retryHandler as any).calculateDelay(2);
      const delay2 = (retryHandler as any).calculateDelay(2);

      // With jitter, delays should be slightly different
      expect(delay1).not.toBe(delay2);
    });
  });

  describe('setConfig', () => {
    it('should update configuration', () => {
      const newConfig = {
        maxAttempts: 5,
        baseDelay: 200,
        maxDelay: 2000,
        backoffMultiplier: 3,
      };

      retryHandler.setConfig(newConfig);
      const config = retryHandler.getConfig();

      expect(config.maxAttempts).toBe(5);
      expect(config.baseDelay).toBe(200);
      expect(config.maxDelay).toBe(2000);
      expect(config.backoffMultiplier).toBe(3);
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', () => {
      const config = retryHandler.getConfig();

      expect(config.maxAttempts).toBe(3);
      expect(config.baseDelay).toBe(100);
      expect(config.maxDelay).toBe(1000);
      expect(config.backoffMultiplier).toBe(2);
    });
  });

  describe('getStats', () => {
    it('should return configuration stats', () => {
      const stats = retryHandler.getStats();

      expect(stats.maxAttempts).toBe(3);
      expect(stats.baseDelay).toBe(100);
      expect(stats.maxDelay).toBe(1000);
      expect(stats.backoffMultiplier).toBe(2);
    });
  });
});
