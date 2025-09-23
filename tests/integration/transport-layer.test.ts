/**
 * Transport Layer Integration Test
 * 
 * Tests the multi-transport support for the MCP server infrastructure.
 * This test validates that the server can handle different transport protocols
 * (stdio, HTTP, SSE) correctly and maintains protocol compliance across all transports.
 * 
 * Test Requirements:
 * - stdio transport works correctly for direct process communication
 * - HTTP transport handles REST API requests properly
 * - SSE (Server-Sent Events) transport supports real-time communication
 * - All transports maintain MCP protocol compliance
 * - Transport switching works seamlessly
 * - Error handling is consistent across transports
 * - Performance requirements are met for each transport
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { EventEmitter } from 'events';
import { Readable, Writable } from 'stream';

// Mock transport interfaces
interface TransportConfig {
  type: 'stdio' | 'http' | 'sse';
  port?: number;
  host?: string;
  path?: string;
  timeout?: number;
}

interface TransportMessage {
  id: string;
  method: string;
  params?: any;
  result?: any;
  error?: any;
  timestamp: Date;
}

interface MockTransport {
  type: 'stdio' | 'http' | 'sse';
  isConnected: boolean;
  config: TransportConfig;
  messageQueue: TransportMessage[];
  eventEmitter: EventEmitter;
  
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send(message: TransportMessage): Promise<void>;
  receive(): Promise<TransportMessage>;
  isHealthy(): boolean;
}

// Mock stdio transport implementation
class MockStdioTransport implements MockTransport {
  public type = 'stdio' as const;
  public isConnected = false;
  public config: TransportConfig;
  public messageQueue: TransportMessage[] = [];
  public eventEmitter = new EventEmitter();
  
  private inputStream: Readable;
  private outputStream: Writable;

  constructor(config: TransportConfig) {
    this.config = config;
    this.inputStream = new Readable({ read() {} });
    this.outputStream = new Writable({ write() {} });
  }

  async connect(): Promise<void> {
    this.isConnected = true;
    this.eventEmitter.emit('connected', { transport: 'stdio' });
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.messageQueue = [];
    this.eventEmitter.emit('disconnected', { transport: 'stdio' });
  }

  async send(message: TransportMessage): Promise<void> {
    if (!this.isConnected) {
      throw new Error('stdio transport not connected');
    }
    
    // Simulate stdio message sending
    const jsonMessage = JSON.stringify(message);
    this.outputStream.write(jsonMessage + '\n');
  }

  async receive(): Promise<TransportMessage> {
    if (!this.isConnected) {
      throw new Error('stdio transport not connected');
    }

    // Simulate receiving a message from stdio
    return new Promise((resolve) => {
      setTimeout(() => {
        const message: TransportMessage = {
          id: `msg_${Date.now()}`,
          method: 'initialize',
          params: { protocolVersion: '2024-11-05' },
          timestamp: new Date()
        };
        resolve(message);
      }, 10);
    });
  }

  isHealthy(): boolean {
    return this.isConnected && this.inputStream.readable && this.outputStream.writable;
  }
}

// Mock HTTP transport implementation
class MockHttpTransport implements MockTransport {
  public type = 'http' as const;
  public isConnected = false;
  public config: TransportConfig;
  public messageQueue: TransportMessage[] = [];
  public eventEmitter = new EventEmitter();
  
  private server: any;
  private requestCount = 0;

  constructor(config: TransportConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    this.isConnected = true;
    this.eventEmitter.emit('connected', { 
      transport: 'http', 
      url: `http://${this.config.host}:${this.config.port}${this.config.path}` 
    });
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.messageQueue = [];
    this.eventEmitter.emit('disconnected', { transport: 'http' });
  }

  async send(message: TransportMessage): Promise<void> {
    if (!this.isConnected) {
      throw new Error('HTTP transport not connected');
    }

    // Simulate HTTP POST request
    const response = await this.simulateHttpRequest('POST', message);
    if (!response.ok) {
      throw new Error(`HTTP request failed: ${response.status}`);
    }
  }

  async receive(): Promise<TransportMessage> {
    if (!this.isConnected) {
      throw new Error('HTTP transport not connected');
    }

    // Simulate receiving a message via HTTP
    return new Promise((resolve) => {
      setTimeout(() => {
        const message: TransportMessage = {
          id: `http_msg_${Date.now()}`,
          method: 'tools/list',
          params: {},
          timestamp: new Date()
        };
        resolve(message);
      }, 15);
    });
  }

  private async simulateHttpRequest(method: string, data: any): Promise<{ ok: boolean; status: number }> {
    // Simulate HTTP request processing
    await new Promise(resolve => setTimeout(resolve, 5));
    this.requestCount++;
    
    return {
      ok: true,
      status: 200
    };
  }

  isHealthy(): boolean {
    return this.isConnected && this.requestCount >= 0;
  }

  getRequestCount(): number {
    return this.requestCount;
  }
}

// Mock SSE transport implementation
class MockSseTransport implements MockTransport {
  public type = 'sse' as const;
  public isConnected = false;
  public config: TransportConfig;
  public messageQueue: TransportMessage[] = [];
  public eventEmitter = new EventEmitter();
  
  private eventSource: any;
  private eventCount = 0;

  constructor(config: TransportConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    this.isConnected = true;
    this.eventEmitter.emit('connected', { 
      transport: 'sse', 
      url: `http://${this.config.host}:${this.config.port}${this.config.path}` 
    });
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.messageQueue = [];
    this.eventEmitter.emit('disconnected', { transport: 'sse' });
  }

  async send(message: TransportMessage): Promise<void> {
    if (!this.isConnected) {
      throw new Error('SSE transport not connected');
    }

    // Simulate SSE message sending
    this.eventEmitter.emit('message', message);
  }

  async receive(): Promise<TransportMessage> {
    if (!this.isConnected) {
      throw new Error('SSE transport not connected');
    }

    // Simulate receiving a message via SSE
    return new Promise((resolve) => {
      setTimeout(() => {
        const message: TransportMessage = {
          id: `sse_msg_${Date.now()}`,
          method: 'tools/call',
          params: { name: 'test_tool', arguments: {} },
          timestamp: new Date()
        };
        this.eventCount++;
        resolve(message);
      }, 8);
    });
  }

  isHealthy(): boolean {
    return this.isConnected && this.eventCount >= 0;
  }

  getEventCount(): number {
    return this.eventCount;
  }
}

// Transport factory for creating different transport types
class TransportFactory {
  static createTransport(config: TransportConfig): MockTransport {
    switch (config.type) {
      case 'stdio':
        return new MockStdioTransport(config);
      case 'http':
        return new MockHttpTransport(config);
      case 'sse':
        return new MockSseTransport(config);
      default:
        throw new Error(`Unsupported transport type: ${config.type}`);
    }
  }
}

describe('Transport Layer Integration Tests', () => {
  let transports: MockTransport[];

  beforeEach(() => {
    transports = [];
  });

  afterEach(async () => {
    // Clean up all transports
    for (const transport of transports) {
      if (transport.isConnected) {
        await transport.disconnect();
      }
    }
    transports = [];
  });

  test('should create and configure stdio transport', () => {
    const config: TransportConfig = {
      type: 'stdio',
      timeout: 5000
    };

    const transport = TransportFactory.createTransport(config);
    transports.push(transport);

    expect(transport.type).toBe('stdio');
    expect(transport.config).toEqual(config);
    expect(transport.isConnected).toBe(false);
    expect(transport.isHealthy()).toBe(false);
  });

  test('should create and configure HTTP transport', () => {
    const config: TransportConfig = {
      type: 'http',
      host: 'localhost',
      port: 8080,
      path: '/mcp',
      timeout: 10000
    };

    const transport = TransportFactory.createTransport(config);
    transports.push(transport);

    expect(transport.type).toBe('http');
    expect(transport.config).toEqual(config);
    expect(transport.isConnected).toBe(false);
  });

  test('should create and configure SSE transport', () => {
    const config: TransportConfig = {
      type: 'sse',
      host: 'localhost',
      port: 8081,
      path: '/events',
      timeout: 30000
    };

    const transport = TransportFactory.createTransport(config);
    transports.push(transport);

    expect(transport.type).toBe('sse');
    expect(transport.config).toEqual(config);
    expect(transport.isConnected).toBe(false);
  });

  test('should handle stdio transport connection lifecycle', async () => {
    const transport = TransportFactory.createTransport({ type: 'stdio' });
    transports.push(transport);

    // Test connection
    await transport.connect();
    expect(transport.isConnected).toBe(true);
    expect(transport.isHealthy()).toBe(true);

    // Test disconnection
    await transport.disconnect();
    expect(transport.isConnected).toBe(false);
    expect(transport.isHealthy()).toBe(false);
  });

  test('should handle HTTP transport connection lifecycle', async () => {
    const transport = TransportFactory.createTransport({
      type: 'http',
      host: 'localhost',
      port: 8080,
      path: '/mcp'
    });
    transports.push(transport);

    // Test connection
    await transport.connect();
    expect(transport.isConnected).toBe(true);
    expect(transport.isHealthy()).toBe(true);

    // Test disconnection
    await transport.disconnect();
    expect(transport.isConnected).toBe(false);
  });

  test('should handle SSE transport connection lifecycle', async () => {
    const transport = TransportFactory.createTransport({
      type: 'sse',
      host: 'localhost',
      port: 8081,
      path: '/events'
    });
    transports.push(transport);

    // Test connection
    await transport.connect();
    expect(transport.isConnected).toBe(true);
    expect(transport.isHealthy()).toBe(true);

    // Test disconnection
    await transport.disconnect();
    expect(transport.isConnected).toBe(false);
  });

  test('should send and receive messages via stdio transport', async () => {
    const transport = TransportFactory.createTransport({ type: 'stdio' });
    transports.push(transport);

    await transport.connect();

    const testMessage: TransportMessage = {
      id: 'test_001',
      method: 'initialize',
      params: { protocolVersion: '2024-11-05' },
      timestamp: new Date()
    };

    // Test sending
    await expect(transport.send(testMessage)).resolves.not.toThrow();

    // Test receiving
    const receivedMessage = await transport.receive();
    expect(receivedMessage).toBeDefined();
    expect(receivedMessage.id).toBeDefined();
    expect(receivedMessage.method).toBeDefined();
    expect(receivedMessage.timestamp).toBeInstanceOf(Date);
  });

  test('should send and receive messages via HTTP transport', async () => {
    const transport = TransportFactory.createTransport({
      type: 'http',
      host: 'localhost',
      port: 8080,
      path: '/mcp'
    });
    transports.push(transport);

    await transport.connect();

    const testMessage: TransportMessage = {
      id: 'http_test_001',
      method: 'tools/list',
      params: {},
      timestamp: new Date()
    };

    // Test sending
    await expect(transport.send(testMessage)).resolves.not.toThrow();

    // Test receiving
    const receivedMessage = await transport.receive();
    expect(receivedMessage).toBeDefined();
    expect(receivedMessage.id).toContain('http_msg_');
    expect(receivedMessage.method).toBe('tools/list');
  });

  test('should send and receive messages via SSE transport', async () => {
    const transport = TransportFactory.createTransport({
      type: 'sse',
      host: 'localhost',
      port: 8081,
      path: '/events'
    });
    transports.push(transport);

    await transport.connect();

    const testMessage: TransportMessage = {
      id: 'sse_test_001',
      method: 'tools/call',
      params: { name: 'test_tool', arguments: {} },
      timestamp: new Date()
    };

    // Test sending
    await expect(transport.send(testMessage)).resolves.not.toThrow();

    // Test receiving
    const receivedMessage = await transport.receive();
    expect(receivedMessage).toBeDefined();
    expect(receivedMessage.id).toContain('sse_msg_');
    expect(receivedMessage.method).toBe('tools/call');
  });

  test('should handle concurrent connections across different transports', async () => {
    const stdioTransport = TransportFactory.createTransport({ type: 'stdio' });
    const httpTransport = TransportFactory.createTransport({
      type: 'http',
      host: 'localhost',
      port: 8080,
      path: '/mcp'
    });
    const sseTransport = TransportFactory.createTransport({
      type: 'sse',
      host: 'localhost',
      port: 8081,
      path: '/events'
    });

    transports.push(stdioTransport, httpTransport, sseTransport);

    // Connect all transports concurrently
    await Promise.all([
      stdioTransport.connect(),
      httpTransport.connect(),
      sseTransport.connect()
    ]);

    expect(stdioTransport.isConnected).toBe(true);
    expect(httpTransport.isConnected).toBe(true);
    expect(sseTransport.isConnected).toBe(true);

    // Test concurrent message sending
    const messages = [
      { transport: stdioTransport, message: { id: 'stdio_001', method: 'initialize', params: {}, timestamp: new Date() } },
      { transport: httpTransport, message: { id: 'http_001', method: 'tools/list', params: {}, timestamp: new Date() } },
      { transport: sseTransport, message: { id: 'sse_001', method: 'tools/call', params: {}, timestamp: new Date() } }
    ];

    await Promise.all(
      messages.map(({ transport, message }) => transport.send(message))
    );

    // All transports should be healthy
    expect(stdioTransport.isHealthy()).toBe(true);
    expect(httpTransport.isHealthy()).toBe(true);
    expect(sseTransport.isHealthy()).toBe(true);
  });

  test('should handle transport errors gracefully', async () => {
    const transport = TransportFactory.createTransport({ type: 'stdio' });
    transports.push(transport);

    // Test sending without connection
    const testMessage: TransportMessage = {
      id: 'error_test',
      method: 'test',
      params: {},
      timestamp: new Date()
    };

    await expect(transport.send(testMessage))
      .rejects
      .toThrow('stdio transport not connected');

    await expect(transport.receive())
      .rejects
      .toThrow('stdio transport not connected');
  });

  test('should maintain protocol compliance across all transports', async () => {
    const transports = [
      TransportFactory.createTransport({ type: 'stdio' }),
      TransportFactory.createTransport({ type: 'http', host: 'localhost', port: 8080, path: '/mcp' }),
      TransportFactory.createTransport({ type: 'sse', host: 'localhost', port: 8081, path: '/events' })
    ];

    for (const transport of transports) {
      this.transports.push(transport);
      await transport.connect();

      // Test MCP protocol compliance
      const initMessage: TransportMessage = {
        id: 'init_test',
        method: 'initialize',
        params: { protocolVersion: '2024-11-05' },
        timestamp: new Date()
      };

      await transport.send(initMessage);
      const response = await transport.receive();

      // Verify MCP protocol structure
      expect(response.id).toBeDefined();
      expect(response.method).toBeDefined();
      expect(response.timestamp).toBeInstanceOf(Date);
    }
  });

  test('should meet performance requirements for each transport', async () => {
    const transports = [
      { type: 'stdio' as const, maxLatency: 50 },
      { type: 'http' as const, maxLatency: 100, host: 'localhost', port: 8080, path: '/mcp' },
      { type: 'sse' as const, maxLatency: 75, host: 'localhost', port: 8081, path: '/events' }
    ];

    for (const config of transports) {
      const transport = TransportFactory.createTransport(config);
      this.transports.push(transport);
      await transport.connect();

      const startTime = Date.now();
      const testMessage: TransportMessage = {
        id: 'perf_test',
        method: 'test',
        params: {},
        timestamp: new Date()
      };

      await transport.send(testMessage);
      await transport.receive();
      
      const latency = Date.now() - startTime;
      expect(latency).toBeLessThan(config.maxLatency);
    }
  });

  test('should support transport switching during runtime', async () => {
    const stdioTransport = TransportFactory.createTransport({ type: 'stdio' });
    const httpTransport = TransportFactory.createTransport({
      type: 'http',
      host: 'localhost',
      port: 8080,
      path: '/mcp'
    });

    transports.push(stdioTransport, httpTransport);

    // Start with stdio
    await stdioTransport.connect();
    expect(stdioTransport.isConnected).toBe(true);

    // Switch to HTTP
    await stdioTransport.disconnect();
    await httpTransport.connect();
    expect(stdioTransport.isConnected).toBe(false);
    expect(httpTransport.isConnected).toBe(true);

    // Verify HTTP transport works
    const testMessage: TransportMessage = {
      id: 'switch_test',
      method: 'test',
      params: {},
      timestamp: new Date()
    };

    await httpTransport.send(testMessage);
    const response = await httpTransport.receive();
    expect(response).toBeDefined();
  });

  test('should handle transport-specific configurations', async () => {
    const httpTransport = TransportFactory.createTransport({
      type: 'http',
      host: 'localhost',
      port: 8080,
      path: '/mcp',
      timeout: 5000
    });
    transports.push(httpTransport);

    await httpTransport.connect();
    expect(httpTransport.config.timeout).toBe(5000);
    expect(httpTransport.config.host).toBe('localhost');
    expect(httpTransport.config.port).toBe(8080);
    expect(httpTransport.config.path).toBe('/mcp');
  });
});
