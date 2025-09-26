import axios from 'axios';
import { EventEmitter } from 'node:events';

import type { Logger } from 'winston';
import { createServer } from '../../src/server';
import { BitbucketConnectionError } from '../../src/services/bitbucket';
import type { BitbucketServerInfo } from '../../src/types/server';

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

class SuccessfulBitbucketServiceStub extends EventEmitter {
  connect: jest.Mock<Promise<BitbucketServerInfo>>;
  scheduleReconnect: jest.Mock;
  dispose: jest.Mock;

  constructor(info: BitbucketServerInfo) {
    super();
    this.connect = jest.fn().mockResolvedValue(info);
    this.scheduleReconnect = jest.fn();
    this.dispose = jest.fn();
  }
}

class FailingBitbucketServiceStub extends EventEmitter {
  connect: jest.Mock<Promise<never>>;
  scheduleReconnect: jest.Mock;
  dispose: jest.Mock;

  constructor(error: Error) {
    super();
    this.connect = jest.fn().mockRejectedValue(error);
    this.scheduleReconnect = jest.fn();
    this.dispose = jest.fn();
  }
}

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

const createStdioTransportStub = () => ({
  close: jest.fn().mockResolvedValue(undefined),
});

const createHttpTransportStub = () => ({
  handleRequest: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
});

interface StartServerOptions {
  rateLimit?: {
    max: number;
    windowMs: number;
  };
  bitbucketService?: SuccessfulBitbucketServiceStub | FailingBitbucketServiceStub;
}

const startServer = async (options: StartServerOptions = {}) => {
  const bitbucketService =
    options.bitbucketService ??
    new SuccessfulBitbucketServiceStub({ version: '8.0.0', type: 'Server' });

  const server = createServer({
    config: {
      port: 0,
      logLevel: 'error',
    },
    credentials: {
      host: 'https://bitbucket.example.com',
      username: 'ci-user',
      password: 'token',
    },
    appConfig: {
      security: {
        helmet: true,
        cors: {
          origin: 'https://allowed.test',
          methods: ['GET', 'POST', 'OPTIONS'],
        },
        rateLimit: {
          windowMs: options.rateLimit?.windowMs ?? 1000,
          max: options.rateLimit?.max ?? 100,
        },
        circuitBreaker: {
          timeout: 1000,
          errorThresholdPercentage: 50,
          resetTimeout: 2000,
        },
      },
      observability: {
        enableMetrics: false,
        logRotation: {
          filename: 'test-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: false,
          maxSize: '1m',
          maxFiles: '1d',
        },
      },
    },
    dependencies: {
      createLogger: () => createLoggerStub(),
      bitbucketService: bitbucketService as any,
      createMcpServer: () => createMcpServerStub() as any,
      createStdioTransport: () => createStdioTransportStub() as any,
      createHttpTransport: () => createHttpTransportStub() as any,
    },
  });

  await server.start();
  const address = server.getHttpAddress();
  if (!address) {
    throw new Error('Server address unavailable');
  }

  const client = axios.create({
    baseURL: `http://${address.address}:${address.port}`,
    validateStatus: () => true,
  });

  return { server, client, bitbucketService };
};

describe('security integration', () => {
  afterEach(async () => {
    jest.clearAllMocks();
  });

  it('applies helmet security headers and configured CORS policy', async () => {
    const { server, client } = await startServer();

    try {
      const response = await client.get('/health', {
        headers: {
          Origin: 'https://allowed.test',
        },
      });

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe('https://allowed.test');
      expect(response.headers['x-dns-prefetch-control']).toBe('off');
    } finally {
      await server.stop();
    }
  });

  it('enforces rate limiting for repeated requests from the same user', async () => {
    const { server, client } = await startServer({
      rateLimit: {
        windowMs: 1000,
        max: 1,
      },
    });

    try {
      const headers = {
        Origin: 'https://allowed.test',
        'X-User-Id': 'user-1',
      } as Record<string, string>;

      const first = await client.get('/health', { headers });
      expect(first.status).toBe(200);

      const second = await client.get('/health', { headers });
      expect(second.status).toBe(429);
      if (typeof second.data === 'string') {
        expect(second.data.toLowerCase()).toContain('too many requests');
      } else {
        expect(second.data).toMatchObject({ message: expect.stringMatching(/too many requests/i) });
      }
    } finally {
      await server.stop();
    }
  });

  it('reports degraded health when Bitbucket connectivity fails', async () => {
    const failure = new BitbucketConnectionError('Bitbucket unavailable');
    const failingService = new FailingBitbucketServiceStub(failure);
    const { server, client, bitbucketService } = await startServer({
      bitbucketService: failingService,
    });

    try {
      const response = await client.get('/health', {
        headers: {
          Origin: 'https://allowed.test',
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.status).toBe('degraded');
      expect(response.data.degradedMode).toBe(true);
      expect(response.headers['x-dns-prefetch-control']).toBe('off');
      expect(bitbucketService.scheduleReconnect).toHaveBeenCalled();
    } finally {
      await server.stop();
    }
  });
});
