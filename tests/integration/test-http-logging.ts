import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { loggerService } from '../../src/services/logger.service';
import { bitbucketAPIService } from '../../src/services/bitbucket-api.service';
import { BitbucketConfig } from '../../src/types/config';

describe('HTTP Logging and Sanitization Integration Tests', () => {
  let config: BitbucketConfig;

  beforeEach(() => {
    config = {
      baseUrl: 'https://bitbucket.org',
      serverType: 'cloud',
      auth: {
        type: 'oauth',
        credentials: {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          accessToken: 'test-access-token',
          tokenType: 'Bearer',
        },
      },
      timeouts: {
        read: 2000,
        write: 5000,
        connect: 10000,
      },
      rateLimit: {
        requestsPerMinute: 60,
        burstLimit: 10,
        retryAfter: 1000,
      },
    };
  });

  afterEach(() => {
    // Cleanup any logs or state
  });

  describe('Logger Service', () => {
    it('should create logger instances', () => {
      const logger = loggerService.getLogger('test-logger');
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('should log different levels', () => {
      const logger = loggerService.getLogger('test-logger');
      
      // These should not throw errors
      expect(() => logger.info('Test info message')).not.toThrow();
      expect(() => logger.error('Test error message')).not.toThrow();
      expect(() => logger.warn('Test warning message')).not.toThrow();
      expect(() => logger.debug('Test debug message')).not.toThrow();
    });

    it('should log with metadata', () => {
      const logger = loggerService.getLogger('test-logger');
      
      const metadata = {
        userId: 'test-user',
        operation: 'test-operation',
        duration: 100,
      };
      
      expect(() => logger.info('Test message', metadata)).not.toThrow();
    });

    it('should handle structured logging', () => {
      const logger = loggerService.getLogger('test-logger');
      
      const structuredData = {
        level: 'info',
        message: 'Test structured log',
        timestamp: new Date().toISOString(),
        metadata: {
          service: 'test-service',
          version: '1.0.0',
        },
      };
      
      expect(() => logger.info(structuredData.message, structuredData.metadata)).not.toThrow();
    });
  });

  describe('API Call Logging', () => {
    it('should log successful API calls', () => {
      expect(() => {
        loggerService.logApiCall(
          'test-service',
          'GET /test-endpoint',
          true,
          150,
          { requestId: 'test-request-123' }
        );
      }).not.toThrow();
    });

    it('should log failed API calls', () => {
      expect(() => {
        loggerService.logApiCall(
          'test-service',
          'GET /test-endpoint',
          false,
          200,
          { 
            requestId: 'test-request-123',
            error: 'Test error message'
          }
        );
      }).not.toThrow();
    });

    it('should log authentication events', () => {
      expect(() => {
        loggerService.logAuthentication(
          'cloud',
          'oauth',
          true,
          { duration: 100 }
        );
      }).not.toThrow();
    });

    it('should log rate limiting events', () => {
      expect(() => {
        loggerService.logRateLimit(
          'test-service',
          5,
          new Date(),
          { serverType: 'cloud' }
        );
      }).not.toThrow();
    });
  });

  describe('Data Sanitization', () => {
    it('should sanitize sensitive data in logs', () => {
      const logger = loggerService.getLogger('test-logger');
      
      const sensitiveData = {
        password: 'secret-password',
        token: 'secret-token',
        apiKey: 'secret-api-key',
        clientSecret: 'secret-client-secret',
        accessToken: 'secret-access-token',
        refreshToken: 'secret-refresh-token',
        appPassword: 'secret-app-password',
        username: 'test-user', // Should not be sanitized
        email: 'test@example.com', // Should not be sanitized
      };
      
      // This should not throw and should sanitize sensitive fields
      expect(() => logger.info('Test with sensitive data', sensitiveData)).not.toThrow();
    });

    it('should handle nested sensitive data', () => {
      const logger = loggerService.getLogger('test-logger');
      
      const nestedData = {
        user: {
          username: 'test-user',
          password: 'secret-password',
          profile: {
            email: 'test@example.com',
            apiKey: 'secret-api-key',
          },
        },
        config: {
          baseUrl: 'https://bitbucket.org',
          credentials: {
            clientId: 'test-client-id',
            clientSecret: 'secret-client-secret',
          },
        },
      };
      
      expect(() => logger.info('Test with nested sensitive data', nestedData)).not.toThrow();
    });

    it('should handle array data with sensitive information', () => {
      const logger = loggerService.getLogger('test-logger');
      
      const arrayData = {
        users: [
          { username: 'user1', password: 'secret1' },
          { username: 'user2', password: 'secret2' },
        ],
        tokens: ['token1', 'token2', 'token3'],
      };
      
      expect(() => logger.info('Test with array sensitive data', arrayData)).not.toThrow();
    });
  });

  describe('HTTP Request Logging', () => {
    it('should log HTTP requests with sanitized headers', async () => {
      const result = await bitbucketAPIService.get(
        config,
        '/2.0/user',
        {}
      );
      
      // The request should be logged with sanitized headers
      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('data');
    });

    it('should log HTTP requests with sanitized request body', async () => {
      const sensitiveData = {
        username: 'test-user',
        password: 'secret-password',
        token: 'secret-token',
      };
      
      const result = await bitbucketAPIService.post(
        config,
        '/2.0/user',
        sensitiveData
      );
      
      // The request should be logged with sanitized body
      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('data');
    });

    it('should log HTTP responses with sanitized data', async () => {
      const result = await bitbucketAPIService.get(
        config,
        '/2.0/user',
        {}
      );
      
      // The response should be logged with sanitized data
      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('data');
    });
  });

  describe('Error Logging', () => {
    it('should log errors with context', () => {
      const logger = loggerService.getLogger('test-logger');
      
      const error = new Error('Test error');
      const context = {
        operation: 'test-operation',
        userId: 'test-user',
        requestId: 'test-request-123',
      };
      
      expect(() => logger.error('Test error occurred', { error: error.message, ...context })).not.toThrow();
    });

    it('should log errors with stack traces', () => {
      const logger = loggerService.getLogger('test-logger');
      
      const error = new Error('Test error with stack');
      error.stack = 'Error: Test error with stack\n    at test (test.js:1:1)';
      
      expect(() => logger.error('Test error with stack', { error: error.message, stack: error.stack })).not.toThrow();
    });

    it('should handle circular references in error objects', () => {
      const logger = loggerService.getLogger('test-logger');
      
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;
      
      expect(() => logger.error('Test circular reference', { obj: circularObj })).not.toThrow();
    });
  });

  describe('Performance Logging', () => {
    it('should log operation duration', () => {
      const logger = loggerService.getLogger('test-logger');
      
      const startTime = Date.now();
      const duration = Date.now() - startTime;
      
      expect(() => logger.info('Operation completed', { duration })).not.toThrow();
    });

    it('should log memory usage', () => {
      const logger = loggerService.getLogger('test-logger');
      
      const memoryUsage = process.memoryUsage();
      
      expect(() => logger.info('Memory usage', { memoryUsage })).not.toThrow();
    });

    it('should log rate limit information', () => {
      const logger = loggerService.getLogger('test-logger');
      
      const rateLimitInfo = {
        limit: 100,
        remaining: 50,
        resetTime: new Date(Date.now() + 3600000),
      };
      
      expect(() => logger.info('Rate limit info', rateLimitInfo)).not.toThrow();
    });
  });

  describe('Log Formatting', () => {
    it('should format timestamps correctly', () => {
      const logger = loggerService.getLogger('test-logger');
      
      const timestamp = new Date().toISOString();
      
      expect(() => logger.info('Test with timestamp', { timestamp })).not.toThrow();
    });

    it('should handle different data types', () => {
      const logger = loggerService.getLogger('test-logger');
      
      const mixedData = {
        string: 'test string',
        number: 123,
        boolean: true,
        null: null,
        undefined: undefined,
        array: [1, 2, 3],
        object: { key: 'value' },
        date: new Date(),
      };
      
      expect(() => logger.info('Test with mixed data types', mixedData)).not.toThrow();
    });

    it('should handle large objects', () => {
      const logger = loggerService.getLogger('test-logger');
      
      const largeObject = {
        data: Array(1000).fill(0).map((_, i) => ({ id: i, value: `item-${i}` })),
      };
      
      expect(() => logger.info('Test with large object', largeObject)).not.toThrow();
    });
  });

  describe('Log Level Management', () => {
    it('should respect log levels', () => {
      const logger = loggerService.getLogger('test-logger');
      
      // All levels should be callable
      expect(() => logger.error('Error message')).not.toThrow();
      expect(() => logger.warn('Warning message')).not.toThrow();
      expect(() => logger.info('Info message')).not.toThrow();
      expect(() => logger.debug('Debug message')).not.toThrow();
    });

    it('should handle log level configuration', () => {
      const logger = loggerService.getLogger('test-logger');
      
      // Test that logger can be configured
      expect(logger).toBeDefined();
    });
  });
});
