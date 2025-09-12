// Test setup file
import { config } from 'dotenv';

// Load environment variables for testing
config({ path: '.env.test' });

// Set test environment variables
process.env['NODE_ENV'] = 'test';
process.env['LOG_LEVEL'] = 'error';

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
