import { ErrorHandlerService } from '../error-handler.service';
import { createMCPToolError, createValidationError, createNetworkError } from '@/types/errors';

describe('ErrorHandlerService', () => {
  let errorHandler: ErrorHandlerService;

  beforeEach(() => {
    errorHandler = ErrorHandlerService.getInstance();
  });

  describe('handleError', () => {
    it('should handle standard errors', () => {
      const error = new Error('Test error');
      const result = errorHandler.handleError(error, { operation: 'test-operation' });

      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toContain('Test error');
    });

    it('should handle validation errors', () => {
      const validationError = createValidationError('Invalid input', 'field', 'value');
      const result = errorHandler.handleError(validationError, { operation: 'test-operation' });

      expect(result.code).toBe('VALIDATION_ERROR');
      expect(result.message).toBe('Invalid input');
    });

    it('should handle network errors', () => {
      const networkError = createNetworkError('NETWORK_ERROR', 'Connection failed');
      const result = errorHandler.handleError(networkError, { operation: 'test-operation' });

      expect(result.code).toBe('NETWORK_ERROR');
      expect(result.message).toBe('Connection failed');
    });

    it('should handle tool errors', () => {
      const toolError = createMCPToolError('test-tool', 'test-operation', new Error('Tool failed'));
      const result = errorHandler.handleError(toolError, { operation: 'test-operation' });

      expect(result.code).toBe('MCP_TOOL_ERROR');
      expect(result.message).toContain('Tool failed');
    });

    it('should include context in error details', () => {
      const error = new Error('Test error');
      const context = { userId: '123', requestId: 'abc' };
      const result = errorHandler.handleError(error, context);

      expect(result.context).toEqual(expect.objectContaining(context));
    });
  });

  describe('handleAxiosError', () => {
    it('should handle 401 authentication errors', () => {
      const axiosError = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
        message: 'Request failed with status code 401',
      } as any;

      const result = errorHandler.handleAxiosError(axiosError, { operation: 'test-operation' });

      expect(result.code).toBe('AUTHENTICATION_ERROR');
      expect(result.message).toContain('Authentication failed');
    });

    it('should handle 403 authorization errors', () => {
      const axiosError = {
        response: {
          status: 403,
          data: { message: 'Forbidden' },
        },
        message: 'Request failed with status code 403',
      } as any;

      const result = errorHandler.handleAxiosError(axiosError, { operation: 'test-operation' });

      expect(result.code).toBe('AUTHORIZATION_ERROR');
      expect(result.message).toContain('Access denied');
    });

    it('should handle 429 rate limit errors', () => {
      const axiosError = {
        response: {
          status: 429,
          data: { message: 'Rate limit exceeded' },
        },
        message: 'Request failed with status code 429',
      } as any;

      const result = errorHandler.handleAxiosError(axiosError, { operation: 'test-operation' });

      expect(result.code).toBe('RATE_LIMIT_ERROR');
      expect(result.message).toContain('Rate limit exceeded');
    });

    it('should handle network errors', () => {
      const axiosError = {
        code: 'ENOTFOUND',
        message: 'getaddrinfo ENOTFOUND api.bitbucket.org',
      } as any;

      const result = errorHandler.handleAxiosError(axiosError, { operation: 'test-operation' });

      expect(result.code).toBe('NETWORK_ERROR');
      expect(result.message).toContain('Network connection failed');
    });
  });

  describe('handleZodError', () => {
    it('should handle Zod validation errors', () => {
      const zodError = {
        issues: [
          { path: ['username'], message: 'Required' },
          { path: ['password'], message: 'String must contain at least 8 character(s)' },
        ],
      } as any;

      const result = errorHandler.handleZodError(zodError, { operation: 'test-operation' });

      expect(result.code).toBe('VALIDATION_ERROR');
      expect(result.message).toContain('Validation failed');
      expect(result.details).toHaveProperty('issues');
    });
  });

  describe('isRetryableError', () => {
    it('should identify retryable errors', () => {
      const networkError = createNetworkError('NETWORK_ERROR', 'Connection failed');
      const rateLimitError = createNetworkError('RATE_LIMIT_ERROR', 'Rate limit exceeded');

      expect(errorHandler.isRetryableError(networkError)).toBe(true);
      expect(errorHandler.isRetryableError(rateLimitError)).toBe(true);
    });

    it('should identify non-retryable errors', () => {
      const validationError = createValidationError('Invalid input');
      const authError = createNetworkError('AUTHENTICATION_ERROR', 'Authentication failed');

      expect(errorHandler.isRetryableError(validationError)).toBe(false);
      expect(errorHandler.isRetryableError(authError)).toBe(false);
    });
  });

  describe('getErrorSeverity', () => {
    it('should return correct severity for different error types', () => {
      const networkError = createNetworkError('NETWORK_ERROR', 'Connection failed');
      const validationError = createValidationError('Invalid input');
      const authError = createNetworkError('AUTHENTICATION_ERROR', 'Authentication failed');

      expect(errorHandler.getErrorSeverity(networkError)).toBe('medium');
      expect(errorHandler.getErrorSeverity(validationError)).toBe('medium');
      expect(errorHandler.getErrorSeverity(authError)).toBe('high');
    });
  });

  describe('formatError', () => {
    it('should format error for logging', () => {
      const error = new Error('Test error');
      const formatted = errorHandler.formatError(error, { operation: 'test-operation' });

      expect(formatted).toContain('Test error');
      expect(formatted).toContain('test-operation');
      expect(formatted).toContain('Error');
    });

    it('should format error with context', () => {
      const error = new Error('Test error');
      const context = { userId: '123' };
      const formatted = errorHandler.formatError(error, context);

      expect(formatted).toContain('Test error');
      expect(formatted).toContain('123');
    });
  });

  describe('getErrorStats', () => {
    it('should return error statistics', () => {
      // Generate some errors
      errorHandler.handleError(new Error('Error 1'), { operation: 'op1' });
      errorHandler.handleError(new Error('Error 2'), { operation: 'op2' });

      const stats = errorHandler.getErrorStats();

      expect(stats.totalErrors).toBe(2);
      expect(stats.errorsByOperation).toHaveProperty('op1');
      expect(stats.errorsByOperation).toHaveProperty('op2');
    });
  });

  describe('clearStats', () => {
    it('should clear error statistics', () => {
      errorHandler.handleError(new Error('Test error'), { operation: 'test-operation' });
      errorHandler.clearStats();

      const stats = errorHandler.getErrorStats();
      expect(stats.totalErrors).toBe(0);
    });
  });
});
