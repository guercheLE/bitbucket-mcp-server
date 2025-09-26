// @ts-nocheck
const { createServer } = require('../../src/server');

const createLoggerStub = () => {
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
        startTimer: () => ({ done: noop }),
        silly: noop,
        verbose: noop,
        http: noop,
        setLevels: noop,
        query: noop,
        stream: noop,
        level: 'info',
        levels: {},
    };
};

const createBitbucketServiceStub = () => {
    const info = { version: '8.0.0', type: 'Server' };
    const service = {
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

const createTransportStub = () => ({
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

describe('health endpoint integration', () => {
    let server;

    beforeAll(async () => {
        const bitbucketService = createBitbucketServiceStub();
        const stdioTransport = createTransportStub();
        const httpTransport = createTransportStub();
        const mcpServer = createMcpServerStub();

        server = createServer({
            config: { port: 0, logLevel: 'error' },
            credentials: {
                host: 'https://bitbucket.example.com',
                username: 'ci-user',
                password: 'token',
            },
            dependencies: {
                createLogger: () => createLoggerStub(),
                createBitbucketService: () => bitbucketService,
                createMcpServer: () => mcpServer,
                createStdioTransport: () => stdioTransport,
                createHttpTransport: () => httpTransport,
            },
        });

        await server.start();
    });

    afterAll(async () => {
        if (server) {
            await server.stop();
        }
    });

    const getBaseUrl = () => {
        const address = server.getHttpAddress();
        if (!address) {
            throw new Error('HTTP address not available');
        }
        return `http://${address.address}:${address.port}`;
    };

    test('returns service health information', async () => {
        const response = await fetch(`${getBaseUrl()}/health`);
        expect(response.status).toBe(200);
        const payload = await response.json();
        expect(payload).toMatchObject({
            status: expect.any(String),
            bitbucketConnected: expect.any(Boolean),
            degradedMode: expect.any(Boolean),
        });
    });

    test('exposes prometheus metrics including health and latency', async () => {
        await fetch(`${getBaseUrl()}/health`);
        const response = await fetch(`${getBaseUrl()}/metrics`);
        expect(response.status).toBe(200);
        const metrics = await response.text();
        expect(metrics).toContain('health_check_success_rate');
        expect(metrics).toContain('api_latency');
    });
});
