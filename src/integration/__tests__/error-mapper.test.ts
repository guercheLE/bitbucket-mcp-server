import { ErrorMapper } from '../error-mapper';

describe('ErrorMapper', () => {
  let errorMapper: ErrorMapper;

  beforeEach(() => {
    errorMapper = new ErrorMapper();
  });

  describe('mapError', () => {
    it('should map authentication errors', () => {
      const error = new Error('401 Unauthorized');
      const mappedError = errorMapper.mapError(error);

      expect(mappedError.type).toBe('AUTHENTICATION_ERROR');
      expect(mappedError.severity).toBe('HIGH');
      expect(mappedError.message).toContain('Authentication failed');
      expect(mappedError.retryable).toBe(false);
      expect(mappedError.statusCode).toBe(401);
    });

    it('should map authorization errors', () => {
      const error = new Error('403 Forbidden');
      const mappedError = errorMapper.mapError(error);

      expect(mappedError.type).toBe('AUTHORIZATION_ERROR');
      expect(mappedError.severity).toBe('HIGH');
      expect(mappedError.message).toContain('Access denied');
      expect(mappedError.retryable).toBe(false);
      expect(mappedError.statusCode).toBe(403);
    });

    it('should map rate limit errors', () => {
      const error = new Error('429 Rate limit exceeded');
      const mappedError = errorMapper.mapError(error);

      expect(mappedError.type).toBe('RATE_LIMIT_ERROR');
      expect(mappedError.severity).toBe('MEDIUM');
      expect(mappedError.message).toContain('Rate limit exceeded');
      expect(mappedError.retryable).toBe(true);
      expect(mappedError.statusCode).toBe(429);
    });

    it('should map network errors', () => {
      const error = new Error('Network error: connection refused');
      const mappedError = errorMapper.mapError(error);

      expect(mappedError.type).toBe('NETWORK_ERROR');
      expect(mappedError.severity).toBe('MEDIUM');
      expect(mappedError.message).toContain('Network connection failed');
      expect(mappedError.retryable).toBe(true);
    });

    it('should map timeout errors', () => {
      const error = new Error('Request timeout');
      const mappedError = errorMapper.mapError(error);

      expect(mappedError.type).toBe('TIMEOUT_ERROR');
      expect(mappedError.severity).toBe('MEDIUM');
      expect(mappedError.message).toContain('Request timed out');
      expect(mappedError.retryable).toBe(true);
    });

    it('should map server errors', () => {
      const error = new Error('500 Internal server error');
      const mappedError = errorMapper.mapError(error);

      expect(mappedError.type).toBe('SERVER_ERROR');
      expect(mappedError.severity).toBe('HIGH');
      expect(mappedError.message).toContain('Internal server error');
      expect(mappedError.retryable).toBe(true);
      expect(mappedError.statusCode).toBe(500);
    });

    it('should map validation errors', () => {
      const error = new Error('400 Bad request');
      const mappedError = errorMapper.mapError(error);

      expect(mappedError.type).toBe('VALIDATION_ERROR');
      expect(mappedError.severity).toBe('MEDIUM');
      expect(mappedError.message).toContain('Invalid request');
      expect(mappedError.retryable).toBe(false);
      expect(mappedError.statusCode).toBe(400);
    });

    it('should map not found errors', () => {
      const error = new Error('404 Not found');
      const mappedError = errorMapper.mapError(error);

      expect(mappedError.type).toBe('NOT_FOUND_ERROR');
      expect(mappedError.severity).toBe('MEDIUM');
      expect(mappedError.message).toContain('Resource not found');
      expect(mappedError.retryable).toBe(false);
      expect(mappedError.statusCode).toBe(404);
    });

    it('should map conflict errors', () => {
      const error = new Error('409 Conflict');
      const mappedError = errorMapper.mapError(error);

      expect(mappedError.type).toBe('CONFLICT_ERROR');
      expect(mappedError.severity).toBe('MEDIUM');
      expect(mappedError.message).toContain('Resource conflict');
      expect(mappedError.retryable).toBe(false);
      expect(mappedError.statusCode).toBe(409);
    });

    it('should map Bitbucket specific errors', () => {
      const error = new Error('Repository not found');
      const mappedError = errorMapper.mapError(error);

      expect(mappedError.type).toBe('NOT_FOUND_ERROR');
      expect(mappedError.severity).toBe('MEDIUM');
      expect(mappedError.message).toContain('Repository not found');
      expect(mappedError.retryable).toBe(false);
    });

    it('should map unknown errors to default', () => {
      const error = new Error('Some unknown error');
      const mappedError = errorMapper.mapError(error);

      expect(mappedError.type).toBe('UNKNOWN_ERROR');
      expect(mappedError.severity).toBe('MEDIUM');
      expect(mappedError.message).toBe('An unexpected error occurred.');
      expect(mappedError.retryable).toBe(false);
    });

    it('should handle string errors', () => {
      const errorString = '401 Unauthorized';
      const mappedError = errorMapper.mapError(errorString);

      expect(mappedError.type).toBe('AUTHENTICATION_ERROR');
      expect(mappedError.severity).toBe('HIGH');
    });

    it('should extract context from error', () => {
      const error = new Error('Test error');
      (error as any).code = 'TEST_CODE';
      (error as any).status = 500;
      error.stack = 'Error stack trace';

      const mappedError = errorMapper.mapError(error);

      expect(mappedError.context).toEqual({
        stack: 'Error stack trace',
        code: 'TEST_CODE',
        status: 500,
      });
    });

    it('should extract HTTP status code from message', () => {
      const error = new Error('HTTP 404 Not Found');
      const mappedError = errorMapper.mapError(error);

      expect(mappedError.context).toEqual({
        httpStatusCode: 404,
      });
    });
  });

  describe('addMapping', () => {
    it('should add custom error mapping', () => {
      const customMapping = {
        pattern: /custom error/i,
        type: 'CUSTOM_ERROR' as any,
        severity: 'LOW' as any,
        message: 'Custom error occurred',
        retryable: false,
      };

      errorMapper.addMapping(customMapping);

      const error = new Error('Custom error message');
      const mappedError = errorMapper.mapError(error);

      expect(mappedError.type).toBe('CUSTOM_ERROR');
      expect(mappedError.severity).toBe('LOW');
      expect(mappedError.message).toBe('Custom error occurred');
    });
  });

  describe('removeMapping', () => {
    it('should remove error mapping', () => {
      const pattern = /401|unauthorized/i;
      errorMapper.removeMapping(pattern);

      const error = new Error('401 Unauthorized');
      const mappedError = errorMapper.mapError(error);

      // Should fall back to default mapping
      expect(mappedError.type).toBe('UNKNOWN_ERROR');
    });
  });

  describe('getMappings', () => {
    it('should return all mappings', () => {
      const mappings = errorMapper.getMappings();

      expect(mappings).toBeInstanceOf(Array);
      expect(mappings.length).toBeGreaterThan(0);
    });
  });

  describe('clearMappings', () => {
    it('should clear all mappings', () => {
      errorMapper.clearMappings();

      const error = new Error('401 Unauthorized');
      const mappedError = errorMapper.mapError(error);

      // Should fall back to default mapping
      expect(mappedError.type).toBe('UNKNOWN_ERROR');
    });
  });

  describe('getMappingStats', () => {
    it('should return mapping statistics', () => {
      const stats = errorMapper.getMappingStats();

      expect(stats.totalMappings).toBeGreaterThan(0);
      expect(stats.retryableMappings).toBeGreaterThan(0);
      expect(stats.nonRetryableMappings).toBeGreaterThan(0);
      expect(stats.severityCounts).toHaveProperty('LOW');
      expect(stats.severityCounts).toHaveProperty('MEDIUM');
      expect(stats.severityCounts).toHaveProperty('HIGH');
      expect(stats.severityCounts).toHaveProperty('CRITICAL');
      expect(stats.typeCounts).toBeInstanceOf(Object);
    });
  });
});
