import type { Client } from '@modelcontextprotocol/sdk/client';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';

import { createMcpService, type McpService } from '../../../src/client/mcp-service';

interface ClientStub {
    connect: jest.Mock<Promise<void>, [Transport]>;
    close: jest.Mock<Promise<void>, []>;
    listTools: jest.Mock<Promise<unknown>, [unknown?]>;
    callTool: jest.Mock<Promise<unknown>, [unknown]>;
    onclose?: ((...args: unknown[]) => void) | undefined;
    onerror?: ((error: Error) => void) | undefined;
}

interface TransportStub {
    close: jest.Mock<Promise<void>, []>;
}

const createClientStub = (): ClientStub => ({
    connect: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    listTools: jest.fn(),
    callTool: jest.fn(),
    onclose: undefined,
    onerror: undefined,
});

const createTransportStub = (): TransportStub => ({
    close: jest.fn().mockResolvedValue(undefined),
});

interface BuildServiceOverrides {
    clients?: ClientStub[];
    transports?: TransportStub[];
    logger?: Partial<Record<'debug' | 'info' | 'warn' | 'error', jest.Mock>>;
    endpoint?: string | null;
    transportFactory?: () => Transport;
}

const buildService = (
    overrides: BuildServiceOverrides = {},
): {
    service: McpService;
    clients: ClientStub[];
    transports: TransportStub[];
    logger: Required<Record<'debug' | 'info' | 'warn' | 'error', jest.Mock>>;
    transportFactory: () => Transport;
} => {
    const clients = overrides.clients ?? [createClientStub()];
    const transports = overrides.transports ?? [createTransportStub()];

    const clientQueue = [...clients];
    const transportQueue = [...transports];

    const logger = {
        debug: overrides.logger?.debug ?? jest.fn(),
        info: overrides.logger?.info ?? jest.fn(),
        warn: overrides.logger?.warn ?? jest.fn(),
        error: overrides.logger?.error ?? jest.fn(),
    } as Required<Record<'debug' | 'info' | 'warn' | 'error', jest.Mock>>;

    const transportFactory =
        overrides.transportFactory ??
        (() => (transportQueue.shift() ?? createTransportStub()) as unknown as Transport);

    const config =
        overrides.endpoint === null
            ? {}
            : { endpoint: overrides.endpoint ?? 'https://example.test' };

    const service = createMcpService(config, {
        createClient: () => (clientQueue.shift() ?? createClientStub()) as unknown as Client,
        createStreamableHttpTransport: transportFactory,
        logger,
    });

    return { service, clients, transports, logger, transportFactory };
};

describe('DefaultMcpService', () => {
    afterEach(() => {
        jest.resetAllMocks();
        delete process.env.BITBUCKET_MCP_ENDPOINT;
        delete process.env.MCP_SERVER_URL;
        delete process.env.MCP_ENDPOINT;
    });

    it('connects only once and reuses the existing connection', async () => {
        const { service, clients } = buildService();

        await service.connect();
        await service.connect();

        expect(clients[0].connect).toHaveBeenCalledTimes(1);
    });

    it('discovers and maps tool capabilities', async () => {
        const client = createClientStub();
        client.listTools.mockResolvedValue({
            tools: [
                {
                    name: 'search-ids',
                    title: 'Search',
                    description: 'Find operations',
                    inputSchema: {
                        type: 'object',
                        required: ['query', 'limit'],
                        properties: {
                            query: { type: 'string', description: 'Term' },
                            limit: { anyOf: [{ type: 'integer' }] },
                            'include-archived': { oneOf: [{ type: 'boolean' }], title: 'Include archived' },
                        },
                    },
                },
            ],
        });

        const { service } = buildService({ clients: [client] });
        const capabilities = await service.discoverCapabilities();

        expect(capabilities.tools).toHaveLength(1);
        expect(capabilities.tools[0]).toEqual({
            name: 'search-ids',
            title: 'Search',
            description: 'Find operations',
            parameters: [
                { name: 'query', type: 'string', description: 'Term', required: true },
                { name: 'limit', type: 'number', required: true },
                {
                    name: 'include-archived',
                    type: 'boolean',
                    description: 'Include archived',
                },
            ],
        });
    });

    it('throws when server returns malformed tool definitions', async () => {
        const client = createClientStub();
        client.listTools.mockResolvedValue({ tools: [{}] });

        const { service } = buildService({ clients: [client] });

        await expect(service.discoverCapabilities()).rejects.toThrow('Tool definitions must include a non-empty name.');
    });

    it('executes tools and normalizes structured MCP responses', async () => {
        const client = createClientStub();
        client.listTools.mockResolvedValue({ tools: [] });
        client.callTool
            .mockResolvedValueOnce({ structuredContent: { ok: true } })
            .mockResolvedValueOnce({ content: [{ type: 'text', text: 'Line 1' }, { type: 'text', text: 'Line 2' }] })
            .mockResolvedValueOnce({ output: { value: 42 } })
            .mockResolvedValueOnce('raw-result');

        const { service } = buildService({ clients: [client] });

        await service.discoverCapabilities();

        await expect(service.executeTool('tool-1', {})).resolves.toEqual({ ok: true });
        await expect(service.executeTool('tool-1', {})).resolves.toEqual('Line 1\nLine 2');
        await expect(service.executeTool('tool-1', {})).resolves.toEqual({ value: 42 });
        await expect(service.executeTool('tool-1', {})).resolves.toEqual('raw-result');
    });

    it('reconnects once when the transport reports a closed connection', async () => {
        const firstClient = createClientStub();
        const secondClient = createClientStub();

        firstClient.listTools.mockResolvedValue({ tools: [] });
        secondClient.listTools.mockResolvedValue({ tools: [] });

        const closedError = Object.assign(new Error('connection closed'), { code: -32000 });
        firstClient.callTool.mockRejectedValueOnce(closedError);
        secondClient.callTool.mockResolvedValue({ output: 'ok' });

        const { service, logger } = buildService({ clients: [firstClient, secondClient] });

        await service.discoverCapabilities();
        await expect(service.executeTool('call-id', {})).resolves.toEqual('ok');

        expect(firstClient.close).toHaveBeenCalledTimes(1);
        expect(secondClient.connect).toHaveBeenCalledTimes(1);
        expect(logger.warn).toHaveBeenCalledWith('Connection lost. Attempting to reconnect once...');
    });

    it('derives endpoint from environment variables when not provided', async () => {
        delete process.env.BITBUCKET_MCP_ENDPOINT;
        process.env.MCP_SERVER_URL = 'https://env-endpoint.example';

        const client = createClientStub();
        client.listTools.mockResolvedValue({ tools: [] });

        const transport = createTransportStub();
        const transportFactory = jest.fn(() => transport as unknown as Transport);

        const { service, transportFactory: factory } = buildService({
            clients: [client],
            transports: [transport],
            endpoint: null,
            transportFactory,
        });

        await service.discoverCapabilities();

        expect(factory).toHaveBeenCalledTimes(1);
        const [urlArg] = (factory as jest.Mock).mock.calls[0];
        expect(urlArg).toBeInstanceOf(URL);
        expect((urlArg as URL).href).toBe('https://env-endpoint.example/');
    });

    it('disconnects gracefully even when no connection was established', async () => {
        const { service, clients, transports } = buildService();

        await service.disconnect();

        expect(clients[0].close).not.toHaveBeenCalled();
        expect(transports[0].close).not.toHaveBeenCalled();
    });
});

