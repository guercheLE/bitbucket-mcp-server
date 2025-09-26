import http from 'node:http';

import { createServer } from '../../src/server';
import {
  BitbucketConnectionError,
  BitbucketRateLimitError,
  BitbucketServiceError,
} from '../../src/services/bitbucket';
import type { Logger } from '../../src/utils/logger';

const createLoggerStub = () => {
  const childLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  } as unknown as Logger;

  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnValue(childLogger),
  } as unknown as Logger & { child: jest.Mock };

  return { logger, childLogger };
};

const createTransportStub = () => ({
  start: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
  handleRequest: jest.fn().mockResolvedValue(undefined),
});

const createHttpControllerStub = () => ({
  start: jest.fn().mockResolvedValue({ address: '127.0.0.1', port: 3300 }),
  stop: jest.fn().mockResolvedValue(undefined),
  getAddress: jest.fn().mockReturnValue({ address: '127.0.0.1', port: 3300 }),
  getServer: jest.fn().mockReturnValue({}),
});

const createMcpServerStub = () => ({
  connect: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
  registerTool: jest.fn().mockReturnValue({
    enable: jest.fn(),
    disable: jest.fn(),
    remove: jest.fn(),
  }),
  sendToolListChanged: jest.fn(),
});

const createBitbucketServiceMock = () => {
  const handlers: Record<string, ((...args: any[]) => void)[]> = {};

  const register = (event: string, listener: (...args: any[]) => void) => {
    handlers[event] = handlers[event] ?? [];
    handlers[event].push(listener);
    return service;
  };

  const service: any = {
    connect: jest.fn().mockResolvedValue({ version: '8.0.0', type: 'Server' }),
    scheduleReconnect: jest.fn(),
    dispose: jest.fn(),
    on: jest.fn(register),
    once: jest.fn(register),
  };

  const emit = (event: string, ...args: any[]) => {
    (handlers[event] ?? []).forEach((listener) => listener(...args));
  };

  return { service, emit };
};

describe('server instance behavior', () => {
  it('does not restart when already running', async () => {
    const { logger } = createLoggerStub();
    const { service } = createBitbucketServiceMock();
    const stdioTransport = createTransportStub();
    const httpTransport = createTransportStub();
    const httpController = createHttpControllerStub();
    const mcpServer = createMcpServerStub();

    const server = createServer({
      config: {
        port: 3300,
        logLevel: 'info',
      },
      credentials: {
        host: 'https://bitbucket.example.com',
        username: 'ci-user',
        password: 'token',
      },
      dependencies: {
        createLogger: () => logger,
        createBitbucketService: () => service,
        createStdioTransport: () => stdioTransport as any,
        createHttpTransport: () => httpTransport as any,
        createHttpServer: () => httpController as any,
        createMcpServer: () => mcpServer as any,
      },
    });

    await server.start();
    expect(service.connect).toHaveBeenCalledTimes(1);
    expect(httpController.start).toHaveBeenCalledTimes(1);

    await server.start();
    expect(service.connect).toHaveBeenCalledTimes(1);
    expect(httpController.start).toHaveBeenCalledTimes(1);

    const state = server.getState();
    state.degradedMode = true;
    expect(server.getState().degradedMode).toBe(false);

    await server.stop();
  });

  it('reacts to Bitbucket lifecycle events', async () => {
    const { logger } = createLoggerStub();
    const { service, emit } = createBitbucketServiceMock();
    const stdioTransport = createTransportStub();
    const httpTransport = createTransportStub();
    const httpController = createHttpControllerStub();
    const mcpServer = createMcpServerStub();

    const server = createServer({
      config: {
        port: 3301,
        logLevel: 'info',
      },
      credentials: {
        host: 'https://bitbucket.example.com',
        username: 'ci-user',
        password: 'token',
      },
      dependencies: {
        createLogger: () => logger,
        createBitbucketService: () => service,
        createStdioTransport: () => stdioTransport as any,
        createHttpTransport: () => httpTransport as any,
        createHttpServer: () => httpController as any,
        createMcpServer: () => mcpServer as any,
      },
    });

    await server.start();

    emit('disconnected');
    const degraded = server.getState();
    expect(degraded.degradedMode).toBe(true);
    expect(service.scheduleReconnect).toHaveBeenCalled();

    const info = { version: '9.0.0', type: 'cloud' as const };
    emit('reconnected', info);
    expect(server.getState().bitbucketServerInfo).toEqual(info);

    emit('error', new BitbucketRateLimitError('Slow down'));
    expect(logger.warn).toHaveBeenCalledWith('Bitbucket rate limit hit', { error: 'Slow down' });

    emit('error', new BitbucketConnectionError('Offline'));
    expect(logger.error).toHaveBeenCalledWith('Bitbucket connection error', { error: 'Offline' });

    emit('error', new BitbucketServiceError('Unexpected'));
    expect(logger.error).toHaveBeenCalledWith('Bitbucket service error', { error: 'Unexpected' });

    await server.stop();
  });

  it('allows stop to be called before start', async () => {
    const { logger } = createLoggerStub();
    const { service } = createBitbucketServiceMock();
    const stdioTransport = createTransportStub();
    const httpTransport = createTransportStub();
    const httpController = createHttpControllerStub();
    const mcpServer = createMcpServerStub();

    const server = createServer({
      config: {
        port: 3302,
        logLevel: 'info',
      },
      credentials: {
        host: 'https://bitbucket.example.com',
        username: 'ci-user',
        password: 'token',
      },
      dependencies: {
        createLogger: () => logger,
        createBitbucketService: () => service,
        createStdioTransport: () => stdioTransport as any,
        createHttpTransport: () => httpTransport as any,
        createHttpServer: () => httpController as any,
        createMcpServer: () => mcpServer as any,
      },
    });

    await server.stop();
    expect(httpController.stop).not.toHaveBeenCalled();
  });

  it('serves health and shutdown endpoints with the default HTTP server', async () => {
    const { logger } = createLoggerStub();
    const { service } = createBitbucketServiceMock();
    const stdioTransport = createTransportStub();
    const httpTransport = createTransportStub();

    const server = createServer({
      config: {
        port: 0,
        logLevel: 'info',
      },
      credentials: {
        host: 'https://bitbucket.example.com',
        username: 'ci-user',
        password: 'token',
      },
      dependencies: {
        createLogger: () => logger,
        createBitbucketService: () => service,
        createStdioTransport: () => stdioTransport as any,
        createHttpTransport: () => httpTransport as any,
      },
    });

    await server.start();

    const address = server.getHttpAddress();
    expect(address).not.toBeNull();
    if (!address) {
      throw new Error('HTTP address should be available after start');
    }

    const request = (method: string, path: string) =>
      new Promise<{ statusCode: number; body: any }>((resolve, reject) => {
        const req = http.request(
          {
            host: address.address,
            port: address.port,
            path,
            method,
          },
          (res: any) => {
            const chunks: Buffer[] = [];
            res.on('data', (chunk: Buffer) => chunks.push(chunk));
            res.on('end', () => {
              const raw = Buffer.concat(chunks).toString();
              resolve({
                statusCode: res.statusCode ?? 0,
                body: raw ? JSON.parse(raw) : null,
              });
            });
          },
        );
        req.on('error', reject);
        req.end();
      });

    const health = await request('GET', '/health');
    expect(health.statusCode).toBe(200);
    expect(health.body).toMatchObject({ status: 'ok', bitbucketConnected: true });

    const shutdown = await request('POST', '/shutdown');
    expect(shutdown.statusCode).toBe(202);
    expect(shutdown.body).toEqual({ status: 'shutting down' });

    await server.stop();
    expect(stdioTransport.close).toHaveBeenCalled();
    expect(httpTransport.close).toHaveBeenCalled();
  });
});
