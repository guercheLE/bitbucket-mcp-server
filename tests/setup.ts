/**
 * Jest Setup File
 * 
 * This file is executed before each test file to set up the testing environment.
 */

// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to suppress console output during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Set up global test timeout (can be overridden per test)
jest.setTimeout(30000);

// Mock crypto for tests that don't need real crypto
if (!global.crypto) {
  global.crypto = require('crypto').webcrypto;
}

// Global test utilities for MCP testing
(global as any).testUtils = {
  // Helper to create mock MCP messages
  mockMCPMessage: (type: string, data: any = {}) => ({
    jsonrpc: '2.0',
    id: Math.random().toString(36).substr(2, 9),
    method: type,
    params: data,
  }),

  // Helper to create mock transport
  createMockTransport: () => ({
    start: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    send: jest.fn().mockResolvedValue(undefined),
    onMessage: jest.fn(),
    onError: jest.fn(),
    onClose: jest.fn(),
  }),

  // Helper for async operations in tests
  waitForAsync: async (fn: () => Promise<any>, timeout: number = 5000): Promise<any> => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Async operation timed out after ${timeout}ms`));
      }, timeout);

      fn()
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  },
};

// Global test cleanup
afterEach(() => {
  // Clear all mocks after each test
  jest.clearAllMocks();
});