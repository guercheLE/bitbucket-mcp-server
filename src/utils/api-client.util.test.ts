import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock axios
jest.mock('axios');
const mockAxios = jest.mocked(require('axios'));

// Mock the config and logger
jest.mock('./config.util', () => ({
  config: {
    getBitbucketType: jest.fn().mockReturnValue('cloud'),
    getBaseUrl: jest.fn().mockReturnValue('https://test.bitbucket.org'),
    getCredentials: jest.fn().mockReturnValue({
      username: 'test-user',
      password: 'test-password',
    }),
    getNumber: jest.fn().mockReturnValue(30000),
  },
}));

jest.mock('./logger.util', () => ({
  Logger: {
    forContext: jest.fn().mockReturnValue({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      forMethod: jest.fn().mockReturnValue({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      }),
    }),
  },
}));

describe('ApiClient', () => {
  let ApiClient: any;
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAxiosInstance = {
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
      create: jest.fn(),
    };

    mockAxios.create.mockReturnValue(mockAxiosInstance);

    // Import the class after mocking
    const { ApiClient: ApiClientClass } = require('./api-client.util');
    ApiClient = ApiClientClass;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create axios instance with correct configuration', () => {
      const apiClient = new ApiClient();

      expect(mockAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://test.bitbucket.org',
        timeout: 30000,
        auth: {
          username: 'test-user',
          password: 'test-password',
        },
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
    });

    it('should set up request and response interceptors', () => {
      const apiClient = new ApiClient();

      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('instance creation', () => {
    it('should create instance without errors', () => {
      expect(() => new ApiClient()).not.toThrow();
    });

    it('should configure logger correctly', () => {
      const { Logger } = require('./logger.util');
      new ApiClient();

      expect(Logger.forContext).toHaveBeenCalledWith('ApiClient');
    });
  });

  describe('configuration loading', () => {
    it('should load configuration from config utility', () => {
      const { config } = require('./config.util');
      new ApiClient();

      expect(config.getBitbucketType).toHaveBeenCalled();
      expect(config.getBaseUrl).toHaveBeenCalled();
      expect(config.getCredentials).toHaveBeenCalled();
      expect(config.getNumber).toHaveBeenCalledWith('API_TIMEOUT');
      expect(config.getNumber).toHaveBeenCalledWith('API_MAX_RETRIES');
    });
  });
});
