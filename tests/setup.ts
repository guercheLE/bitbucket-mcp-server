/**
 * Jest Setup File
 * 
 * This file is executed before each test file to set up the testing environment.
 */

// Set up test environment variables
process.env.NODE_ENV = 'test';

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

// Set up global test timeout
jest.setTimeout(10000);

// Mock crypto for tests that don't need real crypto
if (!global.crypto) {
  global.crypto = require('crypto').webcrypto;
}