/**
 * Jest setup file for global test utilities
 */

// Mock test utilities
(global as any).testUtils = {
  createMockRequest: (overrides: any = {}) => ({
    method: 'tools/list',
    params: {},
    id: 'test-request-id',
    ...overrides,
  }),
  
  createMockExtra: () => ({
    requestId: 'test-request-id',
    clientInfo: {
      name: 'test-client',
      version: '1.0.0',
    },
  }),
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock process.exit to prevent tests from actually exiting
const originalExit = process.exit;
process.exit = jest.fn() as any;

// Restore original exit after all tests
afterAll(() => {
  process.exit = originalExit;
});