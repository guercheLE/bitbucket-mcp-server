import { EventEmitter } from 'node:events';
import http from 'node:http';

import type { Logger } from 'winston';

import { createServer } from '../../src/server';
import type { BitbucketServerInfo } from '../../src/types/server';

const describeTransportIntegration =
  process.env.RUN_SERVER_INTEGRATION === 'true' ? describe : describe.skip;

const createLoggerStub = (): Logger => {
  const noop = () => undefined;
  return {
    child: jest.fn().mockReturnValue({
      info: noop,
      warn: noop,
      error: noop,
      debug: noop,
    }),
    info: noop,
    warn: noop,
    error: noop,
    debug: noop,
    log: noop,
    add: noop,
    remove: noop,
    close: noop,
    configure: noop,
    clear: noop,
    profile: noop,
    startTimer: () => ({ done: noop }) as any,
    silly: noop,
    verbose: noop,
    http: noop,
    setLevels: noop,
    query: noop,
    stream: noop,
    level: 'info',
    levels: {},
  } as unknown as Logger;
};

const createBitbucketServiceStub = (info: BitbucketServerInfo) => {
  const service: any = {
    connect: jest.fn().mockResolvedValue(info),
    isConnected: jest.fn().mockReturnValue(true),
    getServerInfo: jest.fn().mockReturnValue(info),
    scheduleReconnect: jest.fn(),
    dispose: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
  };

  service.on.mockReturnValue(service);
  service.once.mockReturnValue(service);

  return service;
};

const createStdioTransportStub = () => ({
  start: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
  handleRequest: jest.fn().mockResolvedValue(undefined),
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

describeTransportIntegration('Transports', () => {
  const startServer = async (overrides: { eventBus?: EventEmitter } = {}) => {
    const serverInfo: BitbucketServerInfo = { version: '8.0.0', type: 'Server' };
    const bitbucketService = createBitbucketServiceStub(serverInfo);
    const stdioTransport = createStdioTransportStub();
    const mcpServer = createMcpServerStub();

    const eventBus = overrides.eventBus ?? new EventEmitter();

    const server = createServer({
      config: {
        port: 0,
        logLevel: 'warn',
      },
      credentials: {
        host: 'https://bitbucket.example.com',
        username: 'ci-user',
        password: 'token',
      },
      dependencies: {
        createLogger: () => createLoggerStub(),
        createBitbucketService: () => bitbucketService as any,
        createStdioTransport: () => stdioTransport as any,
        createMcpServer: () => mcpServer as any,
        eventBus,
      },
    });

    await server.start();
    const address = server.getHttpAddress();
    if (!address) {
      throw new Error('HTTP address should be defined after start');
    }

    return { server, address, bitbucketService, stdioTransport, mcpServer, eventBus };
  };

  it('exposes working stdio and HTTP transports', async () => {
    const { server, address, mcpServer } = await startServer();

    expect(mcpServer.connect).toHaveBeenCalledTimes(2);

    const responsePayload = await new Promise<{ statusCode: number; body: any }>(
      (resolve, reject) => {
        const req = http.request(
          {
            host: address.address,
            port: address.port,
            path: '/health',
            method: 'GET',
          },
          (res) => {
            const chunks: Buffer[] = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
              const bodyRaw = Buffer.concat(chunks).toString();
              resolve({
                statusCode: res.statusCode ?? 0,
                body: bodyRaw ? JSON.parse(bodyRaw) : null,
              });
            });
          },
        );
        req.on('error', reject);
        req.end();
      },
    );

    expect(responsePayload.statusCode).toBe(200);
    expect(responsePayload.body).toMatchObject({ status: 'ok', bitbucketConnected: true });

    await server.stop();
    expect(mcpServer.close).toHaveBeenCalled();
  });

  it('returns 404 for unknown routes and supports shutdown', async () => {
    const { server, address } = await startServer();

    const request = (method: string, path: string) =>
      new Promise<{ statusCode: number; body: any }>((resolve, reject) => {
        const req = http.request(
          {
            host: address.address,
            port: address.port,
            path,
            method,
          },
          (res) => {
            const chunks: Buffer[] = [];
            res.on('data', (chunk) => chunks.push(chunk));
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

    const notFound = await request('GET', '/missing');
    expect(notFound.statusCode).toBe(404);
    expect(notFound.body).toEqual({ error: 'Not Found' });

    const shutdownResponse = await request('POST', '/shutdown');
    expect(shutdownResponse.statusCode).toBe(202);
    expect(shutdownResponse.body).toEqual({ status: 'shutting down' });

    await server.stop();
  });

  it('streams SSE events for subscribed topics', async () => {
    const eventBus = new EventEmitter();
    const { server, address } = await startServer({ eventBus });

    const topic = 'builds';
    const channel = `sse:${topic}`;

    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error('Timed out waiting for SSE events')),
          5_000,
        );

        const req = http.request(
          {
            host: address.address,
            port: address.port,
            path: `/transports/sse?topic=${topic}`,
            method: 'GET',
            headers: {
              Accept: 'text/event-stream',
            },
          },
          (res) => {
            res.setEncoding('utf8');
            let buffer = '';
            let readyReceived = false;

            res.on('data', (chunk) => {
              buffer += chunk;
              const frames = buffer.split('\n\n');
              buffer = frames.pop() ?? '';

              for (const frame of frames) {
                if (!frame.trim()) {
                  continue;
                }

                const lines = frame.split('\n');
                const eventLine = lines.find((line) => line.startsWith('event: '));
                const dataLine = lines.find((line) => line.startsWith('data: '));
                const payload = dataLine ? dataLine.slice(6) : null;

                if (!readyReceived) {
                  expect(eventLine).toBe('event: ready');
                  expect(payload).not.toBeNull();
                  expect(JSON.parse(payload!)).toEqual({ topic });
                  readyReceived = true;
                  setTimeout(() => {
                    eventBus.emit(channel, { message: 'build complete' });
                  }, 50);
                  continue;
                }

                expect(eventLine).toBe('event: message');
                expect(payload).not.toBeNull();
                expect(JSON.parse(payload!)).toEqual({ message: 'build complete' });
                clearTimeout(timeout);
                req.destroy();
                if (typeof res.destroy === 'function') {
                  res.destroy();
                }
                resolve();
                return;
              }
            });

            res.on('error', reject);
          },
        );

        req.on('error', reject);
        req.end();
      });
    } finally {
      await server.stop();
    }
  });

  it('delivers HTTP streaming chunks for resource updates', async () => {
    const eventBus = new EventEmitter();
    const { server, address } = await startServer({ eventBus });

    const resourceId = 'repo-123';
    const channel = `http-stream:${resourceId}`;

    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error('Timed out waiting for streaming chunks')),
          5_000,
        );

        const req = http.request(
          {
            host: address.address,
            port: address.port,
            path: `/transports/http-stream?resourceId=${resourceId}`,
            method: 'GET',
          },
          (res) => {
            res.setEncoding('utf8');
            let readyReceived = false;
            let buffer = '';

            res.on('data', (chunk) => {
              buffer += chunk;

              let newlineIndex = buffer.indexOf('\n');
              while (newlineIndex !== -1) {
                const line = buffer.slice(0, newlineIndex).trim();
                buffer = buffer.slice(newlineIndex + 1);
                newlineIndex = buffer.indexOf('\n');

                if (!line) {
                  continue;
                }

                const payload = JSON.parse(line);

                if (!readyReceived) {
                  expect(payload).toMatchObject({ status: 'ready', resourceId });
                  readyReceived = true;
                  setTimeout(() => {
                    eventBus.emit(channel, {
                      data: JSON.stringify({ step: 'upload', progress: 45 }) + '\n',
                      isLast: false,
                    });
                  }, 50);
                  continue;
                }

                expect(payload).toMatchObject({ step: 'upload', progress: 45 });
                clearTimeout(timeout);
                req.destroy();
                if (typeof res.destroy === 'function') {
                  res.destroy();
                }
                resolve();
                return;
              }
            });

            res.on('error', reject);
          },
        );

        req.on('error', reject);
        req.end();
      });
    } finally {
      await server.stop();
    }
  });
});
