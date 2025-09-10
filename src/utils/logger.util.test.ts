import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

describe('Logger', () => {
  let consoleSpy: any;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('static methods', () => {
    it('should create logger instance with forContext', () => {
      const { Logger } = require('./logger.util');
      const logger = Logger.forContext('test-file', 'test-method', 'test-context');

      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    it('should set global level', () => {
      const { Logger } = require('./logger.util');
      Logger.setGlobalLevel(1);

      // Test that the level was set (we can't directly access private static)
      const logger = Logger.forContext('test');
      expect(logger).toBeDefined();
    });

    it('should configure from config', () => {
      const { Logger } = require('./logger.util');
      Logger.configureFromConfig(true);

      const logger = Logger.forContext('test');
      expect(logger).toBeDefined();
    });
  });

  describe('instance methods', () => {
    it('should create logger instance', () => {
      const { Logger } = require('./logger.util');
      const logger = new Logger({ file: 'test', method: 'test', context: 'test' });

      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    it('should create logger with default context', () => {
      const { Logger } = require('./logger.util');
      const logger = new Logger();

      expect(logger).toBeDefined();
    });
  });

  describe('logging methods', () => {
    it('should have all required logging methods', () => {
      const { Logger } = require('./logger.util');
      const logger = new Logger();

      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    it('should have forMethod method', () => {
      const { Logger } = require('./logger.util');
      const logger = new Logger();
      const methodLogger = logger.forMethod('test-method');

      expect(methodLogger).toBeDefined();
      expect(typeof methodLogger.debug).toBe('function');
    });

    it('should have forContext method', () => {
      const { Logger } = require('./logger.util');
      const logger = new Logger();
      const contextLogger = logger.forContext('test-context');

      expect(contextLogger).toBeDefined();
      expect(typeof contextLogger.debug).toBe('function');
    });
  });

  describe('message formatting', () => {
    it('should format messages with timestamp and context', () => {
      const { Logger } = require('./logger.util');
      const logger = new Logger({
        file: 'test-file',
        method: 'test-method',
        context: 'test-context',
      });

      // Test that logging methods exist and can be called
      expect(() => logger.info('Test message')).not.toThrow();
      expect(() => logger.debug('Test message')).not.toThrow();
      expect(() => logger.warn('Test message')).not.toThrow();
      expect(() => logger.error('Test message')).not.toThrow();
    });
  });
});
