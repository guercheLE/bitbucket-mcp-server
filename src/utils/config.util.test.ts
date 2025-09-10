import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock dotenv
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

// Mock zod
jest.mock('zod', () => ({
  z: {
    object: jest.fn().mockReturnValue({
      optional: jest.fn().mockReturnThis(),
      default: jest.fn().mockReturnThis(),
      transform: jest.fn().mockReturnThis(),
      enum: jest.fn().mockReturnValue({
        default: jest.fn().mockReturnThis(),
      }),
      string: jest.fn().mockReturnValue({
        optional: jest.fn().mockReturnThis(),
        email: jest.fn().mockReturnThis(),
        transform: jest.fn().mockReturnThis(),
        default: jest.fn().mockReturnThis(),
      }),
      parse: jest.fn().mockReturnValue({
        BITBUCKET_USERNAME: 'test-user',
        BITBUCKET_APP_PASSWORD: 'test-password',
        BITBUCKET_API_TOKEN: 'test-token',
        BITBUCKET_BASE_URL: 'https://test.bitbucket.org',
        BITBUCKET_WORKSPACE: 'test-workspace',
        TRANSPORT_MODE: 'stdio',
        PORT: '3000',
        DEBUG: 'false',
        API_TIMEOUT: '30000',
        API_MAX_RETRIES: '3',
        API_RATE_LIMIT: '1000',
        ENABLE_ISSUES: 'true',
        ENABLE_PIPELINES: 'true',
        ENABLE_WEBHOOKS: 'true',
        ENABLE_PROJECTS: 'true',
      }),
    }),
  },
}));

// Mock logger
jest.mock('./logger.util', () => ({
  Logger: {
    forContext: jest.fn().mockReturnValue({
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
    }),
    configureFromConfig: jest.fn(),
  },
}));

describe('ConfigManager', () => {
  let ConfigManager: any;
  let mockProcessEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    jest.clearAllMocks();

    // Save original process.env
    mockProcessEnv = { ...process.env };

    // Set test environment variables
    process.env.BITBUCKET_USERNAME = 'test-user';
    process.env.BITBUCKET_APP_PASSWORD = 'test-password';
    process.env.BITBUCKET_API_TOKEN = 'test-token';
    process.env.BITBUCKET_BASE_URL = 'https://test.bitbucket.org';
    process.env.BITBUCKET_WORKSPACE = 'test-workspace';
    process.env.TRANSPORT_MODE = 'stdio';
    process.env.PORT = '3000';
    process.env.DEBUG = 'false';

    // Import the class after mocking
    const { ConfigManager: ConfigManagerClass } = require('./config.util');
    ConfigManager = ConfigManagerClass;
  });

  afterEach(() => {
    // Restore original process.env
    process.env = mockProcessEnv;
    jest.restoreAllMocks();
  });

  describe('load method', () => {
    it('should load configuration successfully', () => {
      const configManager = new ConfigManager();
      configManager.load();

      const { config } = require('dotenv');
      expect(config).toHaveBeenCalled();
    });

    it('should configure logger from config', () => {
      const { Logger } = require('./logger.util');
      const configManager = new ConfigManager();
      configManager.load();

      expect(Logger.configureFromConfig).toHaveBeenCalledWith(false); // DEBUG = 'false'
    });
  });

  describe('configuration access', () => {
    it('should provide access to configuration values', () => {
      const configManager = new ConfigManager();
      configManager.load();

      // Test that the config manager can be instantiated and loaded
      expect(configManager).toBeDefined();
    });
  });

  describe('environment variable handling', () => {
    it('should handle missing environment variables gracefully', () => {
      // Clear some environment variables
      delete process.env.BITBUCKET_USERNAME;
      delete process.env.BITBUCKET_APP_PASSWORD;

      const configManager = new ConfigManager();
      expect(() => configManager.load()).not.toThrow();
    });
  });
});
