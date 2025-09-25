/**
 * Jest test setup configuration
 * This file is run before each test file
 */

// Configure test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent'; // Suppress logs during tests

// Set test timeout
jest.setTimeout(30000); // 30 seconds

// Mock crypto for tests that don't need real crypto
if (!global.crypto) {
  global.crypto = require('crypto').webcrypto;
}

// Global test cleanup
afterEach(() => {
  // Clear all mocks after each test
  jest.clearAllMocks();
});
