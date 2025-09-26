import axios from "axios";

import type { Logger } from "winston";

import { createServer } from "../../src/server";
import type { AuthCredentials, AuthFallbackResult, AuthMethod, AuthResult, AuthService } from "../../src/services/authService";
import type { BitbucketServerInfo } from "../../src/types/server";

const describeAuthIntegration = process.env.RUN_SERVER_INTEGRATION === "true" ? describe : describe.skip;

const createLoggerStub = (): Logger => {
    const noop = () => undefined;
    return {
        child: jest.fn().mockReturnValue({
            info: noop,
            warn: noop,
            error: noop,
            debug: noop
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
        startTimer: () => ({ done: noop } as any),
        silly: noop,
        verbose: noop,
        http: noop,
        setLevels: noop,
        query: noop,
        stream: noop,
        level: "info",
        levels: {}
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
        once: jest.fn()
    };

    service.on.mockReturnValue(service);
    service.once.mockReturnValue(service);

    return service;
};

const createStdioTransportStub = () => ({
    start: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined)
});

const createHttpTransportStub = () => ({
    handleRequest: jest.fn(async (req: any, res: any) => {
        res.status(200).json({
            ok: true,
            path: req.path,
            user: req.user ?? null,
            auth: req.auth ?? null
        });
    }),
    close: jest.fn().mockResolvedValue(undefined)
});

const createMcpServerStub = () => ({
    connect: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    registerTool: jest.fn().mockReturnValue({
        enable: jest.fn(),
        disable: jest.fn(),
        remove: jest.fn()
    }),
    sendToolListChanged: jest.fn()
});

type AuthServiceStub = {
    authenticateWithFallback: jest.Mock<Promise<AuthFallbackResult>, [AuthCredentials, AuthMethod[]?]>;
    hasStrategies: jest.Mock<boolean, []>;
    getPriority: jest.Mock<AuthMethod[], []>;
    getRegisteredStrategies: jest.Mock<AuthMethod[], []>;
    hasStrategy: jest.Mock<boolean, [AuthMethod]>;
    authenticateOAuth2: jest.Mock<Promise<AuthResult>, [unknown]>;
    registerStrategy: jest.Mock<void, [unknown]>;
};

const createAuthServiceStub = (overrides?: Partial<AuthServiceStub>): AuthServiceStub => {
    const defaultPriority: AuthMethod[] = ["oauth2", "bearer", "apiKey", "basic"];
    const stub: AuthServiceStub = {
        authenticateWithFallback: jest.fn().mockResolvedValue({ authenticated: true, user: { id: "user-1", name: "Integration" }, methodUsed: "oauth2" }),
        hasStrategies: jest.fn().mockReturnValue(true),
        getPriority: jest.fn().mockReturnValue([...defaultPriority]),
        getRegisteredStrategies: jest.fn().mockReturnValue([...defaultPriority]),
        hasStrategy: jest.fn().mockImplementation((method: AuthMethod) => defaultPriority.includes(method)),
        authenticateOAuth2: jest.fn().mockResolvedValue({ authenticated: true }),
        registerStrategy: jest.fn()
    };

    return Object.assign(stub, overrides);
};

describeAuthIntegration("authentication integration", () => {
    const startServer = async (options: {
        authService?: AuthServiceStub;
        priority?: AuthMethod[];
    } = {}) => {
        const serverInfo: BitbucketServerInfo = { version: "8.0.0", type: "Server" };
        const bitbucketService = createBitbucketServiceStub(serverInfo);
        const stdioTransport = createStdioTransportStub();
        const httpTransport = createHttpTransportStub();
        const mcpServer = createMcpServerStub();
        const authService = options.authService ?? createAuthServiceStub();

        const server = createServer({
            config: {
                port: 0,
                logLevel: "warn"
            },
            credentials: {
                host: "https://bitbucket.example.com",
                username: "ci-user",
                password: "token"
            },
            appConfig: {
                security: {
                    helmet: true,
                    cors: {
                        origin: "*",
                        methods: ["GET", "POST", "OPTIONS"]
                    },
                    rateLimit: {
                        windowMs: 1000,
                        max: 100
                    },
                    circuitBreaker: {
                        timeout: 1000,
                        errorThresholdPercentage: 50,
                        resetTimeout: 2000
                    }
                },
                observability: {
                    enableMetrics: false,
                    logRotation: {
                        filename: "auth-test-%DATE%.log",
                        datePattern: "YYYY-MM-DD",
                        zippedArchive: false,
                        maxSize: "1m",
                        maxFiles: "1d"
                    }
                },
                authentication: {
                    priority: options.priority ?? authService.getPriority()
                }
            },
            dependencies: {
                createLogger: () => createLoggerStub(),
                createBitbucketService: () => bitbucketService as any,
                createStdioTransport: () => stdioTransport as any,
                createHttpTransport: () => httpTransport as any,
                createMcpServer: () => mcpServer as any,
                authService: authService as unknown as AuthService
            }
        });

        await server.start();
        const address = server.getHttpAddress();
        if (!address) {
            throw new Error("HTTP address should be defined after start");
        }

        const client = axios.create({
            baseURL: `http://${address.address}:${address.port}`,
            timeout: 5_000,
            validateStatus: () => true
        });

        return { server, client, address, authService, httpTransport, mcpServer };
    };

    afterEach(async () => {
        jest.clearAllMocks();
    });

    it("serves health checks without invoking authentication", async () => {
        const authService = createAuthServiceStub();
        const { server, client } = await startServer({ authService });

        try {
            const response = await client.get("/health");

            expect(response.status).toBe(200);
            expect(authService.authenticateWithFallback).not.toHaveBeenCalled();
        } finally {
            await server.stop();
        }
    });

    it("rejects protected requests without credentials", async () => {
        const authService = createAuthServiceStub();
        const { server, client } = await startServer({ authService });

        try {
            const response = await client.get("/mcp");

            expect(response.status).toBe(401);
            expect(response.data).toEqual({ error: "Missing authentication credentials" });
            expect(authService.authenticateWithFallback).not.toHaveBeenCalled();
        } finally {
            await server.stop();
        }
    });

    it("authenticates requests with bearer tokens", async () => {
        const authService = createAuthServiceStub();
        const { server, client } = await startServer({ authService });

        const credentials: AuthCredentials = {};

        authService.authenticateWithFallback.mockImplementation(async (received, preferred) => {
            Object.assign(credentials, received);
            expect(preferred).toEqual(authService.getPriority());
            return { authenticated: true, user: { id: "user-1", name: "Integration" }, methodUsed: "oauth2" };
        });

        try {
            const response = await client.get("/mcp", {
                headers: {
                    Authorization: "Bearer test-token"
                }
            });

            expect(response.status).toBe(200);
            expect(response.data).toMatchObject({ ok: true, auth: { method: "oauth2" }, user: { id: "user-1" } });
            expect(credentials).toMatchObject({
                oauth2: { accessToken: "test-token" },
                bearer: { token: "test-token" }
            });
        } finally {
            await server.stop();
        }
    });

    it("applies configured priority order when authenticating", async () => {
        const customPriority: AuthMethod[] = ["apiKey", "basic", "oauth2", "bearer"];
        const authService = createAuthServiceStub({ getPriority: jest.fn().mockReturnValue([...customPriority]) });

        const { server, client } = await startServer({ authService, priority: customPriority });

        let usedOrder: AuthMethod[] | undefined;
        authService.authenticateWithFallback.mockImplementation(async (_credentials, preferred) => {
            usedOrder = preferred;
            return { authenticated: true, user: { id: "user-2", name: "Fallback" }, methodUsed: "apiKey" };
        });

        try {
            const response = await client.get("/mcp", {
                headers: {
                    "X-API-Key": "integration-key"
                }
            });

            expect(response.status).toBe(200);
            expect(usedOrder).toEqual(customPriority);
            expect(response.data).toMatchObject({ auth: { method: "apiKey" }, user: { id: "user-2" } });
        } finally {
            await server.stop();
        }
    });

    it("returns 401 when authentication fails despite credentials", async () => {
        const authService = createAuthServiceStub();
        authService.authenticateWithFallback.mockResolvedValue({ authenticated: false, methodUsed: null });

        const { server, client } = await startServer({ authService });

        try {
            const response = await client.get("/mcp", {
                headers: {
                    Authorization: "Bearer invalid"
                }
            });

            expect(response.status).toBe(401);
            expect(response.data).toEqual({ error: "Authentication failed" });
        } finally {
            await server.stop();
        }
    });
});
