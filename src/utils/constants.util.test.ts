import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

describe('Constants', () => {
  let Constants: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Import the class after mocking
    const { Constants: ConstantsClass } = require('./constants.util');
    Constants = ConstantsClass;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('API_ENDPOINTS', () => {
    it('should have all required API endpoints defined', () => {
      expect(Constants.API_ENDPOINTS).toBeDefined();
      expect(Constants.API_ENDPOINTS.WORKSPACES).toBeDefined();
      expect(Constants.API_ENDPOINTS.REPOSITORIES).toBeDefined();
      expect(Constants.API_ENDPOINTS.PULL_REQUESTS).toBeDefined();
      expect(Constants.API_ENDPOINTS.ISSUES).toBeDefined();
      expect(Constants.API_ENDPOINTS.COMMITS).toBeDefined();
      expect(Constants.API_ENDPOINTS.PIPELINES).toBeDefined();
    });

    it('should have correct endpoint paths', () => {
      expect(Constants.API_ENDPOINTS.WORKSPACES).toBe('/workspaces');
      expect(Constants.API_ENDPOINTS.REPOSITORIES).toBe('/repositories');
      expect(Constants.API_ENDPOINTS.PULL_REQUESTS).toBe('/pullrequests');
      expect(Constants.API_ENDPOINTS.ISSUES).toBe('/issues');
      expect(Constants.API_ENDPOINTS.COMMITS).toBe('/commits');
      expect(Constants.API_ENDPOINTS.PIPELINES).toBe('/pipelines');
    });
  });

  describe('HTTP_STATUS_CODES', () => {
    it('should have common HTTP status codes defined', () => {
      expect(Constants.HTTP_STATUS_CODES).toBeDefined();
      expect(Constants.HTTP_STATUS_CODES.OK).toBe(200);
      expect(Constants.HTTP_STATUS_CODES.CREATED).toBe(201);
      expect(Constants.HTTP_STATUS_CODES.BAD_REQUEST).toBe(400);
      expect(Constants.HTTP_STATUS_CODES.UNAUTHORIZED).toBe(401);
      expect(Constants.HTTP_STATUS_CODES.FORBIDDEN).toBe(403);
      expect(Constants.HTTP_STATUS_CODES.NOT_FOUND).toBe(404);
      expect(Constants.HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).toBe(500);
    });
  });

  describe('MCP_CONSTANTS', () => {
    it('should have MCP-related constants defined', () => {
      expect(Constants.MCP_CONSTANTS).toBeDefined();
      expect(Constants.MCP_CONSTANTS.PROTOCOL_VERSION).toBeDefined();
      expect(Constants.MCP_CONSTANTS.SERVER_NAME).toBeDefined();
      expect(Constants.MCP_CONSTANTS.SERVER_VERSION).toBeDefined();
    });

    it('should have correct MCP values', () => {
      expect(Constants.MCP_CONSTANTS.PROTOCOL_VERSION).toBe('2024-11-05');
      expect(Constants.MCP_CONSTANTS.SERVER_NAME).toBe('bitbucket-mcp-server');
      expect(Constants.MCP_CONSTANTS.SERVER_VERSION).toBeDefined();
    });
  });

  describe('DEFAULT_CONFIG', () => {
    it('should have default configuration values', () => {
      expect(Constants.DEFAULT_CONFIG).toBeDefined();
      expect(Constants.DEFAULT_CONFIG.PORT).toBeDefined();
      expect(Constants.DEFAULT_CONFIG.HOST).toBeDefined();
      expect(Constants.DEFAULT_CONFIG.TIMEOUT).toBeDefined();
    });

    it('should have reasonable default values', () => {
      expect(Constants.DEFAULT_CONFIG.PORT).toBeGreaterThan(0);
      expect(Constants.DEFAULT_CONFIG.HOST).toBeDefined();
      expect(Constants.DEFAULT_CONFIG.TIMEOUT).toBeGreaterThan(0);
    });
  });

  describe('ERROR_MESSAGES', () => {
    it('should have error message constants defined', () => {
      expect(Constants.ERROR_MESSAGES).toBeDefined();
      expect(Constants.ERROR_MESSAGES.INVALID_CONFIG).toBeDefined();
      expect(Constants.ERROR_MESSAGES.API_ERROR).toBeDefined();
      expect(Constants.ERROR_MESSAGES.AUTHENTICATION_FAILED).toBeDefined();
    });

    it('should have meaningful error messages', () => {
      expect(typeof Constants.ERROR_MESSAGES.INVALID_CONFIG).toBe('string');
      expect(typeof Constants.ERROR_MESSAGES.API_ERROR).toBe('string');
      expect(typeof Constants.ERROR_MESSAGES.AUTHENTICATION_FAILED).toBe('string');
      expect(Constants.ERROR_MESSAGES.INVALID_CONFIG.length).toBeGreaterThan(0);
    });
  });

  describe('class instantiation', () => {
    it('should create instance without errors', () => {
      expect(() => new Constants()).not.toThrow();
    });

    it('should have all required constant properties', () => {
      const constants = new Constants();

      expect(constants.API_ENDPOINTS).toBeDefined();
      expect(constants.HTTP_STATUS_CODES).toBeDefined();
      expect(constants.MCP_CONSTANTS).toBeDefined();
      expect(constants.DEFAULT_CONFIG).toBeDefined();
      expect(constants.ERROR_MESSAGES).toBeDefined();
    });
  });
});
