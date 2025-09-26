import type { Logger } from 'winston';

import { createServer } from '../../src/server';
import type { BitbucketServerInfo } from '../../src/types/server';

const describeServerIntegration =
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

const createFailingBitbucketServiceStub = (error: Error) => {
  const service: any = {
    connect: jest.fn().mockRejectedValue(error),
    isConnected: jest.fn().mockReturnValue(false),
    getServerInfo: jest.fn().mockReturnValue(null),
    scheduleReconnect: jest.fn(),
    dispose: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
  };

  service.on.mockReturnValue(service);
  service.once.mockReturnValue(service);

  return service;
};

const createTransportStub = () => ({
  start: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
  handleRequest: jest.fn().mockResolvedValue(undefined),
});

const createHttpControllerStub = () => ({
  start: jest.fn().mockResolvedValue(3200),
  stop: jest.fn().mockResolvedValue(undefined),
  getAddress: jest.fn().mockReturnValue({ address: '127.0.0.1', port: 3200 }),
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

describeServerIntegration('Server lifecycle', () => {
  it('starts and stops gracefully', async () => {
    const serverInfo: BitbucketServerInfo = { version: '8.0.0', type: 'Server' };
    const bitbucketService = createBitbucketServiceStub(serverInfo);
    const stdioTransport = createTransportStub();
    const httpTransport = createTransportStub();
    const httpController = createHttpControllerStub();
    const mcpServer = createMcpServerStub();

    const server = createServer({
      config: {
        port: 3200,
        logLevel: 'info',
      },
      credentials: {
        host: 'https://bitbucket.example.com',
        username: 'ci-user',
        password: 'token',
      },
      dependencies: {
        createLogger: () => createLoggerStub(),
        createBitbucketService: () => bitbucketService as any,
        createMcpServer: () => mcpServer as any,
        createStdioTransport: () => stdioTransport as any,
        createHttpTransport: () => httpTransport as any,
        createHttpServer: () => httpController as any,
      },
    });

    await server.start();

    expect(mcpServer.connect).toHaveBeenCalledTimes(2);
    expect(mcpServer.registerTool).toHaveBeenCalledTimes(3);
    expect(mcpServer.sendToolListChanged).toHaveBeenCalledTimes(1);
    expect(bitbucketService.connect).toHaveBeenCalled();

    const state = server.getState();
    expect(state.isRunning).toBe(true);
    expect(state.bitbucketConnected).toBe(true);
    expect(state.bitbucketServerInfo).toEqual(serverInfo);
    expect(server.getHttpAddress()).toEqual({ address: '127.0.0.1', port: 3200 });

    await server.stop();

    const finalState = server.getState();
    expect(finalState.isRunning).toBe(false);
    expect(httpController.stop).toHaveBeenCalled();
    expect(bitbucketService.dispose).toHaveBeenCalled();
    expect(mcpServer.close).toHaveBeenCalled();
  });

  it('enters degraded mode when the Bitbucket connection fails', async () => {
    const failure = new Error('Bitbucket unavailable');
    const bitbucketService = createFailingBitbucketServiceStub(failure);
    const stdioTransport = createTransportStub();
    const httpTransport = createTransportStub();
    const httpController = createHttpControllerStub();
    const mcpServer = createMcpServerStub();

    const server = createServer({
      config: {
        port: 3201,
        logLevel: 'info',
      },
      credentials: {
        host: 'https://bitbucket.example.com',
        username: 'ci-user',
        password: 'token',
      },
      dependencies: {
        createLogger: () => createLoggerStub(),
        createBitbucketService: () => bitbucketService as any,
        createMcpServer: () => mcpServer as any,
        createStdioTransport: () => stdioTransport as any,
        createHttpTransport: () => httpTransport as any,
        createHttpServer: () => httpController as any,
      },
    });

    await server.start();

    const state = server.getState();
    expect(state.degradedMode).toBe(true);
    expect(state.bitbucketConnected).toBe(false);
    expect(bitbucketService.scheduleReconnect).toHaveBeenCalled();

    await server.stop();
    expect(bitbucketService.dispose).toHaveBeenCalled();
  });
});
