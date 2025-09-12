import { LoggerService } from '../logger.service';

describe('LoggerService', () => {
  let loggerService: LoggerService;

  beforeEach(() => {
    loggerService = LoggerService.getInstance();
  });

  describe('getLogger', () => {
    it('should return a logger instance', () => {
      const logger = loggerService.getLogger('test-module');

      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('should return the same logger instance for the same name', () => {
      const logger1 = loggerService.getLogger('test-module');
      const logger2 = loggerService.getLogger('test-module');

      expect(logger1).toBe(logger2);
    });

    it('should return different logger instances for different names', () => {
      const logger1 = loggerService.getLogger('module1');
      const logger2 = loggerService.getLogger('module2');

      expect(logger1).not.toBe(logger2);
    });

    it('should create logger with context', () => {
      const context = { userId: '123', requestId: 'abc' };
      const logger = loggerService.getLogger('test-module', context);

      expect(logger).toBeDefined();
    });
  });

  describe('createChildLogger', () => {
    it('should create a child logger with additional context', () => {
      const parentLogger = loggerService.getLogger('parent');
      const childLogger = loggerService.createChildLogger(parentLogger, { childId: '456' });

      expect(childLogger).toBeDefined();
      expect(childLogger).not.toBe(parentLogger);
    });
  });

  describe('logRequest', () => {
    it('should log HTTP request information', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      loggerService.logRequest('GET', '/api/test', 200, 150);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log error level for 4xx status codes', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      loggerService.logRequest('GET', '/api/test', 404, 50);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log warn level for 3xx status codes', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      loggerService.logRequest('GET', '/api/test', 301, 100);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('logApiCall', () => {
    it('should log successful API call', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      loggerService.logApiCall('bitbucket', 'getRepositories', true, 200);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log failed API call', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      loggerService.logApiCall('bitbucket', 'getRepositories', false, 500, {
        error: 'Network error',
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('logError', () => {
    it('should log error with context', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Test error');

      loggerService.logError(error, { operation: 'test-operation' });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('logPerformance', () => {
    it('should log performance metrics', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      loggerService.logPerformance('test-operation', 150);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  // Security and audit logging methods not implemented yet

  describe('Logger methods', () => {
    let logger: any;

    beforeEach(() => {
      logger = loggerService.getLogger('test');
    });

    it('should log info messages', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      logger.info('Test info message');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log error messages', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      logger.error('Test error message');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log warn messages', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      logger.warn('Test warning message');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log debug messages', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      logger.debug('Test debug message');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should create child logger with additional context', () => {
      const childLogger = logger.child({ additionalContext: 'test' });

      expect(childLogger).toBeDefined();
      expect(childLogger).not.toBe(logger);
    });
  });

  // Statistics methods not implemented yet
});
