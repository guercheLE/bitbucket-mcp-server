/**
 * Unit Tests for Error Handling and Retry Service
 * Tests for error classification, retry logic, and error handling
 */

import { 
  ErrorClassificationService, 
  RetryService, 
  ErrorHandlerService,
  ClassifiedError,
  RetryResult,
  ErrorContext
} from '../../../src/services/error-handling.js';

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

describe('ErrorClassificationService', () => {
  describe('Error Classification', () => {
    it('should classify network errors', () => {
      const error = new Error('ECONNREFUSED: Connection refused');
      const context: ErrorContext = {
        operation: 'test-operation',
        timestamp: new Date().toISOString()
      };

      const classified = ErrorClassificationService.classifyError(error, context);

      expect(classified.type).toBe('network');
      expect(classified.severity).toBe('high');
      expect(classified.retryable).toBe(true);
      expect(classified.error).toBe(error);
      expect(classified.context).toBe(context);
    });

    it('should classify timeout errors', () => {
      const error = new Error('Request timeout');
      const context: ErrorContext = {
        operation: 'test-operation',
        timestamp: new Date().toISOString()
      };

      const classified = ErrorClassificationService.classifyError(error, context);

      expect(classified.type).toBe('timeout');
      expect(classified.severity).toBe('medium');
      expect(classified.retryable).toBe(true);
    });

    it('should classify rate limit errors', () => {
      const error = new Error('Rate limit exceeded');
      const context: ErrorContext = {
        operation: 'test-operation',
        timestamp: new Date().toISOString()
      };

      const classified = ErrorClassificationService.classifyError(error, context);

      expect(classified.type).toBe('rate-limit');
      expect(classified.severity).toBe('medium');
      expect(classified.retryable).toBe(true);
    });

    it('should classify authentication errors', () => {
      const error = new Error('Unauthorized: Invalid token');
      const context: ErrorContext = {
        operation: 'test-operation',
        timestamp: new Date().toISOString()
      };

      const classified = ErrorClassificationService.classifyError(error, context);

      expect(classified.type).toBe('auth');
      expect(classified.severity).toBe('high');
      expect(classified.retryable).toBe(false);
    });

    it('should classify validation errors', () => {
      const error = new Error('Validation failed: Required field missing');
      const context: ErrorContext = {
        operation: 'test-operation',
        timestamp: new Date().toISOString()
      };

      const classified = ErrorClassificationService.classifyError(error, context);

      expect(classified.type).toBe('validation');
      expect(classified.severity).toBe('low');
      expect(classified.retryable).toBe(false);
    });

    it('should classify server errors', () => {
      const error = new Error('Internal server error');
      const context: ErrorContext = {
        operation: 'test-operation',
        timestamp: new Date().toISOString()
      };

      const classified = ErrorClassificationService.classifyError(error, context);

      expect(classified.type).toBe('server');
      expect(classified.severity).toBe('high');
      expect(classified.retryable).toBe(true);
    });

    it('should classify client errors', () => {
      const error = new Error('Not found: Resource does not exist');
      const context: ErrorContext = {
        operation: 'test-operation',
        timestamp: new Date().toISOString()
      };

      const classified = ErrorClassificationService.classifyError(error, context);

      expect(classified.type).toBe('client');
      expect(classified.severity).toBe('medium');
      expect(classified.retryable).toBe(false);
    });

    it('should classify unknown errors', () => {
      const error = new Error('Some random error');
      const context: ErrorContext = {
        operation: 'test-operation',
        timestamp: new Date().toISOString()
      };

      const classified = ErrorClassificationService.classifyError(error, context);

      expect(classified.type).toBe('unknown');
      expect(classified.severity).toBe('medium');
      expect(classified.retryable).toBe(false);
    });

    it('should adjust severity for critical operations', () => {
      const error = new Error('Some error');
      const context: ErrorContext = {
        operation: 'critical-auth-operation',
        timestamp: new Date().toISOString()
      };

      const classified = ErrorClassificationService.classifyError(error, context);

      expect(classified.severity).toBe('critical');
    });
  });

  describe('Retry Decision', () => {
    it('should not retry when max attempts reached', () => {
      const error = new Error('Network error');
      const context: ErrorContext = {
        operation: 'test-operation',
        timestamp: new Date().toISOString()
      };

      const shouldRetry = ErrorClassificationService.shouldRetry(error, context, 3, 3);
      expect(shouldRetry).toBe(false);
    });

    it('should not retry non-retryable errors', () => {
      const error = new Error('Validation failed');
      const context: ErrorContext = {
        operation: 'test-operation',
        timestamp: new Date().toISOString()
      };

      const shouldRetry = ErrorClassificationService.shouldRetry(error, context, 0, 3);
      expect(shouldRetry).toBe(false);
    });

    it('should retry retryable errors within limits', () => {
      const error = new Error('Network timeout');
      const context: ErrorContext = {
        operation: 'test-operation',
        timestamp: new Date().toISOString()
      };

      const shouldRetry = ErrorClassificationService.shouldRetry(error, context, 1, 3);
      expect(shouldRetry).toBe(true);
    });

    it('should not retry critical operations after first failure', () => {
      const error = new Error('Critical error');
      const context: ErrorContext = {
        operation: 'critical-operation',
        timestamp: new Date().toISOString()
      };

      const shouldRetry = ErrorClassificationService.shouldRetry(error, context, 1, 3);
      expect(shouldRetry).toBe(false);
    });
  });
});

describe('RetryService', () => {
  let retryService: RetryService;

  beforeEach(() => {
    retryService = new RetryService({
      maxRetries: 3,
      baseDelay: 100,
      maxDelay: 1000,
      backoffMultiplier: 2,
      jitter: false
    });
  });

  describe('Retry Logic', () => {
    it('should execute successful operation without retry', async () => {
      const successFn = jest.fn().mockResolvedValue('success');
      const context: ErrorContext = {
        operation: 'test-operation',
        timestamp: new Date().toISOString()
      };

      const result = await retryService.executeWithRetry(successFn, context);

      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.attempts).toBe(1);
      expect(result.totalTime).toBeGreaterThan(0);
      expect(successFn).toHaveBeenCalledTimes(1);
    });

    it('should retry failed operation and eventually succeed', async () => {
      let callCount = 0;
      const failThenSucceedFn = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      });

      const context: ErrorContext = {
        operation: 'test-operation',
        timestamp: new Date().toISOString()
      };

      const result = await retryService.executeWithRetry(failThenSucceedFn, context);

      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.attempts).toBe(3);
      expect(failThenSucceedFn).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const failFn = jest.fn().mockRejectedValue(new Error('Persistent failure'));
      const context: ErrorContext = {
        operation: 'test-operation',
        timestamp: new Date().toISOString()
      };

      const result = await retryService.executeWithRetry(failFn, context);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.attempts).toBe(4); // Initial + 3 retries
      expect(result.lastError).toBeDefined();
      expect(failFn).toHaveBeenCalledTimes(4);
    });

    it('should not retry non-retryable errors', async () => {
      const failFn = jest.fn().mockRejectedValue(new Error('Validation failed'));
      const context: ErrorContext = {
        operation: 'test-operation',
        timestamp: new Date().toISOString()
      };

      const result = await retryService.executeWithRetry(failFn, context);

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1); // No retries
      expect(failFn).toHaveBeenCalledTimes(1);
    });

    it('should respect custom retry condition', async () => {
      const retryServiceWithCondition = new RetryService({
        maxRetries: 3,
        baseDelay: 100,
        maxDelay: 1000,
        backoffMultiplier: 2,
        jitter: false,
        retryCondition: (error) => error.message.includes('retryable')
      });

      const failFn = jest.fn().mockRejectedValue(new Error('Non-retryable error'));
      const context: ErrorContext = {
        operation: 'test-operation',
        timestamp: new Date().toISOString()
      };

      const result = await retryServiceWithCondition.executeWithRetry(failFn, context);

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1); // No retries due to custom condition
    });
  });

  describe('Delay Calculation', () => {
    it('should calculate exponential backoff delays', async () => {
      const failFn = jest.fn().mockRejectedValue(new Error('Network error'));
      const context: ErrorContext = {
        operation: 'test-operation',
        timestamp: new Date().toISOString()
      };

      const startTime = Date.now();
      await retryService.executeWithRetry(failFn, context);
      const totalTime = Date.now() - startTime;

      // Should have delays: 100ms, 200ms, 400ms = ~700ms minimum
      expect(totalTime).toBeGreaterThan(600);
    });

    it('should respect maximum delay', async () => {
      const retryServiceWithMaxDelay = new RetryService({
        maxRetries: 2,
        baseDelay: 1000,
        maxDelay: 500,
        backoffMultiplier: 2,
        jitter: false
      });

      const failFn = jest.fn().mockRejectedValue(new Error('Network error'));
      const context: ErrorContext = {
        operation: 'test-operation',
        timestamp: new Date().toISOString()
      };

      const startTime = Date.now();
      await retryServiceWithMaxDelay.executeWithRetry(failFn, context);
      const totalTime = Date.now() - startTime;

      // Should cap at maxDelay: 500ms + 500ms = ~1000ms
      expect(totalTime).toBeLessThan(1500);
    });
  });

  describe('Configuration', () => {
    it('should return default configuration', () => {
      const config = retryService.getDefaultConfig();

      expect(config).toHaveProperty('maxRetries');
      expect(config).toHaveProperty('baseDelay');
      expect(config).toHaveProperty('maxDelay');
      expect(config).toHaveProperty('backoffMultiplier');
      expect(config).toHaveProperty('jitter');
    });

    it('should update default configuration', () => {
      retryService.updateDefaultConfig({ maxRetries: 5 });
      
      const config = retryService.getDefaultConfig();
      expect(config.maxRetries).toBe(5);
    });
  });
});

describe('ErrorHandlerService', () => {
  let errorHandler: ErrorHandlerService;

  beforeEach(() => {
    errorHandler = new ErrorHandlerService();
  });

  describe('Error Handling', () => {
    it('should handle and classify errors', () => {
      const error = new Error('Network timeout');
      const context = errorHandler.createContext('test-operation');

      const classified = errorHandler.handleError(error, context);

      expect(classified).toHaveProperty('type');
      expect(classified).toHaveProperty('severity');
      expect(classified).toHaveProperty('retryable');
      expect(classified.error).toBe(error);
      expect(classified.context).toBe(context);
    });

    it('should execute operation with error handling', async () => {
      const successFn = jest.fn().mockResolvedValue('success');
      const context = errorHandler.createContext('test-operation');

      const result = await errorHandler.executeWithErrorHandling(successFn, context);

      expect(result).toBe('success');
      expect(successFn).toHaveBeenCalledTimes(1);
    });

    it('should handle operation failures with retry', async () => {
      let callCount = 0;
      const failThenSucceedFn = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 2) {
          throw new Error('Network error');
        }
        return 'success';
      });

      const context = errorHandler.createContext('test-operation');

      const result = await errorHandler.executeWithErrorHandling(failThenSucceedFn, context);

      expect(result).toBe('success');
      expect(failThenSucceedFn).toHaveBeenCalledTimes(2);
    });

    it('should throw enhanced error after all retries fail', async () => {
      const failFn = jest.fn().mockRejectedValue(new Error('Persistent failure'));
      const context = errorHandler.createContext('test-operation');

      await expect(errorHandler.executeWithErrorHandling(failFn, context))
        .rejects.toThrow('test-operation failed: Persistent failure');

      expect(failFn).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });
  });

  describe('Context Creation', () => {
    it('should create error context with operation', () => {
      const context = errorHandler.createContext('test-operation');

      expect(context.operation).toBe('test-operation');
      expect(context.timestamp).toBeDefined();
      expect(context.requestId).toBeDefined();
      expect(context.requestId).toMatch(/^req_\d+_[a-z0-9]+$/);
    });

    it('should create error context with metadata', () => {
      const metadata = { userId: '123', action: 'create' };
      const context = errorHandler.createContext('test-operation', metadata);

      expect(context.operation).toBe('test-operation');
      expect(context.metadata).toBe(metadata);
    });

    it('should generate unique request IDs', () => {
      const context1 = errorHandler.createContext('test-operation');
      const context2 = errorHandler.createContext('test-operation');

      expect(context1.requestId).not.toBe(context2.requestId);
    });
  });

  describe('Service Access', () => {
    it('should provide access to retry service', () => {
      const retryService = errorHandler.getRetryService();

      expect(retryService).toBeInstanceOf(RetryService);
    });
  });
});
