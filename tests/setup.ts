/**
 * Jest Setup File
 * 
 * Global setup for all tests in the MCP server test suite.
 * This file is executed before each test file.
 */

// Set test timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };

beforeAll(() => {
  // Suppress console output during tests unless explicitly enabled
  if (!process.env.TEST_VERBOSE) {
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  }
});

afterAll(() => {
  // Restore console methods
  Object.assign(console, originalConsole);
});

// Global test utilities
global.testUtils = {
  createMockTransport: () => {
    const mockTransport = {
      type: 'stdio' as const,
      config: { type: 'stdio' as const },
      isConnected: true,
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      send: jest.fn().mockResolvedValue(undefined),
      receive: jest.fn().mockResolvedValue(undefined),
      isHealthy: jest.fn().mockReturnValue(true),
      getStats: jest.fn().mockReturnValue({
        messagesSent: 0,
        messagesReceived: 0,
        bytesSent: 0,
        bytesReceived: 0,
        averageResponseTime: 0,
        uptime: 0,
        lastActivity: new Date()
      }),
      // EventEmitter methods
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      once: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
      setMaxListeners: jest.fn(),
      getMaxListeners: jest.fn().mockReturnValue(10),
      listeners: jest.fn().mockReturnValue([]),
      rawListeners: jest.fn().mockReturnValue([]),
      listenerCount: jest.fn().mockReturnValue(0),
      eventNames: jest.fn().mockReturnValue([]),
      prependListener: jest.fn(),
      prependOnceListener: jest.fn()
    };
    return mockTransport;
  },
  
  createMockSession: (id: string = 'test-session') => ({
    id,
    clientId: 'test-client',
    state: 'connected' as const,
    transport: global.testUtils.createMockTransport(),
    createdAt: new Date(),
    lastActivity: new Date(),
    metadata: {},
    availableTools: new Set(),
    timeout: 300000,
    updateActivity: jest.fn(),
    isActive: jest.fn().mockReturnValue(true),
    isExpired: jest.fn().mockReturnValue(false),
    getStats: jest.fn().mockReturnValue({
      duration: 0,
      requestsProcessed: 0,
      toolsCalled: 0,
      averageProcessingTime: 0,
      memoryUsage: 0,
      lastRequest: new Date()
    }),
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn().mockResolvedValue(undefined),
    addTool: jest.fn(),
    removeTool: jest.fn(),
    hasTool: jest.fn().mockReturnValue(true),
    recordRequest: jest.fn(),
    recordToolCall: jest.fn(),
    updateMemoryUsage: jest.fn(),
    getSummary: jest.fn().mockReturnValue(`Session ${id}`),
    updateMetadata: jest.fn(),
    updateState: jest.fn()
  }),
  
  createMockTool: (name: string = 'test-tool') => ({
    name,
    description: `Test tool ${name}`,
    parameters: [],
    enabled: true,
    execute: jest.fn().mockResolvedValue({
      success: true,
      data: { result: 'test' }
    })
  }),
  
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
};

// Extend global types
declare global {
  var testUtils: {
    createMockTransport: () => any;
    createMockSession: (id?: string) => any;
    createMockTool: (name?: string) => any;
    waitFor: (ms: number) => Promise<void>;
  };
}
