import http from "node:http";

import type { Logger } from "winston";

import { createServer } from "../../src/server";
import type { BitbucketServerInfo } from "../../src/types/server";

const describeTransportIntegration = process.env.RUN_SERVER_INTEGRATION === "true" ? describe : describe.skip;

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
    close: jest.fn().mockResolvedValue(undefined),
    handleRequest: jest.fn().mockResolvedValue(undefined)
});

const createMcpServerStub = () => ({
    connect: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined)
});

describeTransportIntegration("Transports", () => {
    it("exposes working stdio and HTTP transports", async () => {
        const serverInfo: BitbucketServerInfo = { version: "8.0.0", type: "Server" };
        const bitbucketService = createBitbucketServiceStub(serverInfo);
        const stdioTransport = createStdioTransportStub();
        const mcpServer = createMcpServerStub();

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
            dependencies: {
                createLogger: () => createLoggerStub(),
                createBitbucketService: () => bitbucketService as any,
                createStdioTransport: () => stdioTransport as any,
                createMcpServer: () => mcpServer as any
            }
        });

        await server.start();

        expect(mcpServer.connect).toHaveBeenCalledTimes(2);

        const address = server.getHttpAddress();
        expect(address).not.toBeNull();
        if (!address) {
            throw new Error("HTTP address should be defined after start");
        }

        const responsePayload = await new Promise<{ statusCode: number; body: any }>((resolve, reject) => {
            const req = http.request(
                {
                    host: address.address,
                    port: address.port,
                    path: "/health",
                    method: "GET"
                },
                (res) => {
                    const chunks: Buffer[] = [];
                    res.on("data", (chunk) => chunks.push(chunk));
                    res.on("end", () => {
                        const bodyRaw = Buffer.concat(chunks).toString();
                        resolve({
                            statusCode: res.statusCode ?? 0,
                            body: bodyRaw ? JSON.parse(bodyRaw) : null
                        });
                    });
                }
            );
            req.on("error", reject);
            req.end();
        });

        expect(responsePayload.statusCode).toBe(200);
        expect(responsePayload.body).toMatchObject({ status: "ok", bitbucketConnected: true });

        await server.stop();
        expect(mcpServer.close).toHaveBeenCalled();
    });

    it("returns 404 for unknown routes and supports shutdown", async () => {
        const serverInfo: BitbucketServerInfo = { version: "8.0.0", type: "Server" };
        const bitbucketService = createBitbucketServiceStub(serverInfo);
        const stdioTransport = createStdioTransportStub();
        const mcpServer = createMcpServerStub();

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
            dependencies: {
                createLogger: () => createLoggerStub(),
                createBitbucketService: () => bitbucketService as any,
                createStdioTransport: () => stdioTransport as any,
                createMcpServer: () => mcpServer as any
            }
        });

        await server.start();

        const address = server.getHttpAddress();
        if (!address) {
            throw new Error("HTTP address should be available after start");
        }

        const request = (method: string, path: string) =>
            new Promise<{ statusCode: number; body: any }>((resolve, reject) => {
                const req = http.request(
                    {
                        host: address.address,
                        port: address.port,
                        path,
                        method
                    },
                    (res) => {
                        const chunks: Buffer[] = [];
                        res.on("data", (chunk) => chunks.push(chunk));
                        res.on("end", () => {
                            const raw = Buffer.concat(chunks).toString();
                            resolve({
                                statusCode: res.statusCode ?? 0,
                                body: raw ? JSON.parse(raw) : null
                            });
                        });
                    }
                );
                req.on("error", reject);
                req.end();
            });

        const notFound = await request("GET", "/missing");
        expect(notFound.statusCode).toBe(404);
        expect(notFound.body).toEqual({ error: "Not Found" });

        const shutdownResponse = await request("POST", "/shutdown");
        expect(shutdownResponse.statusCode).toBe(202);
        expect(shutdownResponse.body).toEqual({ status: "shutting down" });

        await server.stop();
    });
});
