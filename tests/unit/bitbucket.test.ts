import type { AxiosInstance } from 'axios';
import type { Logger } from 'winston';

import { BitbucketService } from '../../src/services/bitbucket';
import type { BitbucketCredentials } from '../../src/types/config';
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

const createMockClient = (): AxiosInstance => {
  const interceptors = {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() },
  } as const;

  return {
    get: jest.fn(),
    interceptors,
  } as unknown as AxiosInstance;
};

describe('BitbucketService', () => {
  const credentials: BitbucketCredentials = {
    host: 'https://bitbucket.example.com',
    username: 'ci-user',
    password: 'secret',
  };

  it('connects and returns the server info', async () => {
    const client = createMockClient();
    (client.get as jest.Mock).mockResolvedValue({
      data: {
        version: '8.0.0',
        deploymentType: 'Server',
      },
    });

    const service = new BitbucketService(credentials, {
      client,
      logger: createLoggerStub(),
      retryAttempts: 1,
      retryDelayMs: 0,
    });

    const info = await service.connect();

    expect(info).toEqual({ version: '8.0.0', type: 'Server' });
    expect(service.getServerInfo()).toEqual({ version: '8.0.0', type: 'Server' });
    expect(service.isConnected()).toBe(true);
    expect(client.get).toHaveBeenCalledWith('/rest/api/1.0/application-properties');
  });

  it('throws an authentication error when credentials are invalid', async () => {
    const client = createMockClient();
    (client.get as jest.Mock).mockRejectedValue({
      response: {
        status: 401,
      },
    });

    const service = new BitbucketService(credentials, {
      client,
      logger: createLoggerStub(),
      retryAttempts: 0,
      retryDelayMs: 0,
    });

    const errors: unknown[] = [];
    service.on('error', (error) => errors.push(error));

    await expect(service.connect()).rejects.toMatchObject({ name: 'BitbucketAuthenticationError' });
    expect(service.isConnected()).toBe(false);
    expect(errors[0]).toMatchObject({ name: 'BitbucketAuthenticationError' });
  });

  it('retries on transient network failures before failing', async () => {
    const client = createMockClient();
    (client.get as jest.Mock).mockRejectedValue({ code: 'ECONNREFUSED' });

    const service = new BitbucketService(credentials, {
      client,
      logger: createLoggerStub(),
      retryAttempts: 2,
      retryDelayMs: 0,
    });

    const disconnected = jest.fn();
    const errors: unknown[] = [];
    service.on('disconnected', disconnected);
    service.on('error', (error) => errors.push(error));

    await expect(service.connect()).rejects.toMatchObject({ name: 'BitbucketConnectionError' });
    expect((client.get as jest.Mock).mock.calls.length).toBe(3);
    expect(disconnected).toHaveBeenCalledTimes(1);
    expect(errors[0]).toMatchObject({ name: 'BitbucketConnectionError' });
  });

  it('falls back to alternate endpoints when initial detection fails', async () => {
    const client = createMockClient();
    (client.get as jest.Mock)
      .mockRejectedValueOnce({ isAxiosError: true, response: { status: 404 } })
      .mockResolvedValueOnce({
        data: {
          buildNumber: '7.9.1',
          serverType: 'Data Center',
        },
      });

    const service = new BitbucketService(credentials, {
      client,
      logger: createLoggerStub(),
      retryAttempts: 0,
      retryDelayMs: 0,
    });

    service.on('error', () => undefined);

    const info = await service.connect();

    expect(client.get).toHaveBeenNthCalledWith(1, '/rest/api/1.0/application-properties');
    expect(client.get).toHaveBeenNthCalledWith(2, '/rest/api/latest/application-properties');
    expect(info).toEqual({ version: '7.9.1', type: 'Data Center' });
  });

  it('schedules reconnect attempts and emits events', async () => {
    const client = createMockClient();
    const service = new BitbucketService(credentials, {
      client,
      logger: createLoggerStub(),
      retryAttempts: 0,
      retryDelayMs: 0,
      reconnectDelayMs: 10,
    });

    const serverInfo: BitbucketServerInfo = { version: '9.0.0', type: 'Cloud' };
    const connectSpy = jest.spyOn(service, 'connect').mockResolvedValue(serverInfo);
    const reconnected = jest.fn();
    service.on('reconnected', reconnected);

    service.scheduleReconnect();
    await new Promise((resolve) => setTimeout(resolve, 25));

    expect(connectSpy).toHaveBeenCalledTimes(1);
    expect(reconnected).toHaveBeenCalledWith(serverInfo);

    connectSpy.mockRestore();
    service.dispose();
  });

  it('cancels scheduled reconnects on dispose', async () => {
    const client = createMockClient();
    const service = new BitbucketService(credentials, {
      client,
      logger: createLoggerStub(),
      retryAttempts: 0,
      retryDelayMs: 0,
      reconnectDelayMs: 10,
    });

    const connectSpy = jest
      .spyOn(service, 'connect')
      .mockResolvedValue({ version: '9.0.0', type: 'Server' });

    service.scheduleReconnect();
    service.dispose();

    await new Promise((resolve) => setTimeout(resolve, 25));

    expect(connectSpy).not.toHaveBeenCalled();
    connectSpy.mockRestore();
  });

  it('normalizes rate limit errors', async () => {
    const client = createMockClient();
    (client.get as jest.Mock).mockRejectedValue({ isAxiosError: true, response: { status: 429 } });

    const service = new BitbucketService(credentials, {
      client,
      logger: createLoggerStub(),
      retryAttempts: 0,
      retryDelayMs: 0,
    });

    const errors: unknown[] = [];
    service.on('error', (error) => errors.push(error));

    await expect(service.connect()).rejects.toMatchObject({ name: 'BitbucketRateLimitError' });
    expect(errors[0]).toMatchObject({ name: 'BitbucketRateLimitError' });
  });

  it('infers cloud type from host when not provided', async () => {
    const client = createMockClient();
    (client.get as jest.Mock).mockResolvedValue({
      data: {
        buildVersion: '10.0.0',
      },
    });

    const service = new BitbucketService(
      {
        host: 'https://bitbucket.org/workspace',
        username: 'cloud-user',
        password: 'token',
      },
      {
        client,
        logger: createLoggerStub(),
        retryAttempts: 0,
        retryDelayMs: 0,
      },
    );

    const info = await service.connect();

    expect(info).toEqual({ version: '10.0.0', type: 'Cloud' });
    expect(service.isConnected()).toBe(true);
  });
});
