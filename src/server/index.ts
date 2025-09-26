import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import http from "node:http";
import path from "node:path";

import cors, { type CorsOptions } from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import packageJson from "../../package.json";
import { CallIdParams, type CallIdParamsOutput } from "../contracts/call-id";
import { GetIdParams, type GetIdParamsInput } from "../contracts/get-id";
import { SearchIdsParams, type SearchIdsParamsInput } from "../contracts/search-ids";
import { AppConfigSchema, type AppConfig } from "../models/config";
import { AuthService } from "../services/authService";
import { BitbucketConnectionError, BitbucketRateLimitError, BitbucketService, BitbucketServiceError } from "../services/bitbucket";
import { createI18nService, type I18nService } from "../services/i18n";
import { createRotatingLogger } from "../services/logger";
import { createMetricsService, type MetricsService, type MetricsServiceOptions } from "../services/metricsService";
import { SchemaService } from "../services/SchemaService";
import { VectorDBService } from "../services/VectorDBService";
import { createCallIdTool } from "../tools/call-id";
import { createGetIdTool } from "../tools/get-id";
import { createSearchIdsTool } from "../tools/search-ids";
import type { BitbucketCredentials, ServerConfig } from "../types/config";
import { BitbucketCredentialsSchema, ServerConfigSchema } from "../types/config";
import type { BitbucketServerInfo, ServerState } from "../types/server";
import { type Logger, type LoggerOptions } from "../utils/logger";
import { createAuthenticationMiddleware } from "./middleware/authentication";
import { createRateLimiter, type CombinedRateLimiterOptions } from "./security/rateLimiter";
import { createHttpStreamTransport, type HttpStreamTransport, type HttpStreamTransportOptions } from "./transports/httpStream";
import { createSseTransport, type SseTransport, type SseTransportOptions } from "./transports/sse";

const DEFAULT_HTTP_PORT = 3000;
const MAX_PORT_ATTEMPTS = 3;
const PORT_RETRY_DELAY_MS = 5_000;

interface HttpAddress {
    address: string;
    port: number;
}

type DelayFn = (ms: number) => Promise<void>;

interface HttpServerFactoryContext {
    port: number;
    logger: Logger;
    state: ServerState;
    httpTransport: StreamableHTTPServerTransport;
    onShutdown: () => Promise<void>;
    delay: DelayFn;
    appConfig: AppConfig;
    metricsService: MetricsService | null;
    i18nService: I18nService | null;
    rateLimiter: ReturnType<typeof createRateLimiter>;
    corsOptions: CorsOptions;
    sseTransport: SseTransport;
    httpStreamTransport: HttpStreamTransport;
    eventBus: EventEmitter;
    authService: AuthService | null;
}

interface HttpServerController {
    start(): Promise<HttpAddress>;
    stop(): Promise<void>;
    getAddress(): HttpAddress | null;
    getServer(): http.Server | null;
}

type LoggerFactory = (options: LoggerOptions) => Logger;
type BitbucketServiceFactory = (credentials: BitbucketCredentials, logger: Logger) => BitbucketService;
type McpServerFactory = (logger: Logger) => McpServer;
type HttpServerFactory = (context: HttpServerFactoryContext) => HttpServerController;

export interface ServerDependencies {
    logger?: Logger;
    createLogger?: LoggerFactory;
    bitbucketService?: BitbucketService;
    createBitbucketService?: BitbucketServiceFactory;
    mcpServer?: McpServer;
    createMcpServer?: McpServerFactory;
    createStdioTransport?: () => StdioServerTransport;
    createHttpTransport?: () => StreamableHTTPServerTransport;
    createHttpServer?: HttpServerFactory;
    delay?: DelayFn;
    env?: NodeJS.ProcessEnv;
    vectorDbService?: VectorDBService;
    schemaService?: SchemaService;
    authService?: AuthService;
    createAuthService?: (config: AppConfig["authentication"], logger: Logger) => AuthService;
    metricsService?: MetricsService;
    createMetricsService?: (options?: MetricsServiceOptions) => MetricsService;
    i18nService?: I18nService;
    createI18nService?: (options: Parameters<typeof createI18nService>[0]) => I18nService;
    rateLimiter?: ReturnType<typeof createRateLimiter>;
    createRateLimiter?: (options?: CombinedRateLimiterOptions) => ReturnType<typeof createRateLimiter>;
    sseTransport?: SseTransport;
    createSseTransport?: (options?: SseTransportOptions) => SseTransport;
    httpStreamTransport?: HttpStreamTransport;
    createHttpStreamTransport?: (options?: HttpStreamTransportOptions) => HttpStreamTransport;
    eventBus?: EventEmitter;
}

export interface ServerOptions {
    config?: Partial<ServerConfig>;
    credentials?: Partial<BitbucketCredentials>;
    appConfig?: Partial<AppConfig>;
    dependencies?: ServerDependencies;
}

export interface ServerInstance {
    start(): Promise<void>;
    stop(): Promise<void>;
    getState(): ServerState;
    getHttpAddress(): HttpAddress | null;
    getLogger(): Logger;
}

const cloneState = (state: ServerState): ServerState => ({
    isRunning: state.isRunning,
    bitbucketConnected: state.bitbucketConnected,
    bitbucketServerInfo: state.bitbucketServerInfo ? { ...state.bitbucketServerInfo } : null,
    degradedMode: state.degradedMode
});

const resolveConfig = (overrides: Partial<ServerConfig> | undefined, env: NodeJS.ProcessEnv): ServerConfig => {
    const portCandidate = overrides?.port ?? env.HTTP_PORT;
    const logLevelCandidate = overrides?.logLevel ?? env.LOG_LEVEL ?? "info";

    const parsed = ServerConfigSchema.safeParse({
        port: typeof portCandidate === "string" ? Number(portCandidate) : portCandidate ?? DEFAULT_HTTP_PORT,
        logLevel: logLevelCandidate
    });

    if (!parsed.success) {
        throw new Error(`Invalid server configuration: ${parsed.error.message}`);
    }

    return parsed.data;
};

const resolveCredentials = (overrides: Partial<BitbucketCredentials> | undefined, env: NodeJS.ProcessEnv): BitbucketCredentials => {
    const candidate = {
        host: overrides?.host ?? env.BITBUCKET_HOST,
        username: overrides?.username ?? env.BITBUCKET_USERNAME,
        password: overrides?.password ?? env.BITBUCKET_PASSWORD
    };

    const result = BitbucketCredentialsSchema.safeParse(candidate);
    if (!result.success) {
        throw new Error(`Invalid Bitbucket credentials: ${result.error.message}`);
    }

    return result.data;
};

const defaultHttpServerFactory: HttpServerFactory = ({
    port,
    logger,
    state,
    httpTransport,
    onShutdown,
    delay,
    appConfig,
    metricsService,
    i18nService,
    rateLimiter,
    corsOptions,
    sseTransport,
    httpStreamTransport,
    eventBus,
    authService
}) => {
    let server: http.Server | null = null;
    let address: HttpAddress | null = null;

    const buildServer = () => {
        const app = express();

        app.set("trust proxy", true);
        app.use(express.json({ limit: "1mb" }));
        app.use(express.urlencoded({ extended: true }));

        if (appConfig.security.helmet) {
            app.use(helmet());
        }

        app.use(rateLimiter);

        if (authService && authService.hasStrategies()) {
            const authLogger = typeof logger.child === "function" ? logger.child({ scope: "auth-middleware" }) : logger;
            const authMiddleware = createAuthenticationMiddleware(authService, {
                logger: authLogger,
                priority: appConfig.authentication.priority
            });
            app.use(authMiddleware);
        }

        if (appConfig.security.cors) {
            app.use(cors(corsOptions));
        }

        if (metricsService) {
            app.use((req, res, next) => {
                const start = Date.now();
                res.on("finish", () => {
                    metricsService.recordHttpRequest({
                        route: req.route?.path ?? req.path,
                        method: req.method,
                        statusCode: res.statusCode,
                        durationMs: Date.now() - start
                    });
                });
                next();
            });
        }

        if (i18nService) {
            app.use(i18nService.middleware());
        }

        /**
         * @summary Reports the readiness of the MCP server and feeds metrics into the health gauge.
         * @route GET /health
         * @returns 200 {object} JSON payload describing Bitbucket connectivity and degraded mode status.
         */
        app.get("/health", (_req, res) => {
            const startTime = metricsService ? process.hrtime.bigint() : null;
            const isHealthy = state.bitbucketConnected && !state.degradedMode;

            const payload = {
                status: state.degradedMode ? "degraded" : "ok",
                bitbucketConnected: state.bitbucketConnected,
                bitbucketServerInfo: state.bitbucketServerInfo,
                degradedMode: state.degradedMode
            } satisfies Record<string, unknown>;

            res.status(200).json(payload);

            if (metricsService && startTime !== null) {
                const elapsedNs = process.hrtime.bigint() - startTime;
                const elapsedMs = Number(elapsedNs) / 1_000_000;
                metricsService.recordHealthCheck({ success: isHealthy, durationMs: elapsedMs });
            }
        });

        if (metricsService) {
            app.get("/metrics", metricsService.createHandler());
        }

        app.post("/shutdown", async (_req, res) => {
            res.status(202).json({ status: "shutting down" });
            try {
                await onShutdown();
            } catch (error) {
                logger.error("Failed to stop server from shutdown endpoint", { error: (error as Error).message });
            }
        });

        app.get("/transports/sse", async (req, res, next) => {
            try {
                const topic = typeof req.query.topic === "string" ? req.query.topic : "default";
                const channel = `sse:${topic}`;

                await sseTransport.handle(req, res, async (connection) => {
                    const listener = async (payload: unknown) => {
                        try {
                            await connection.send({ event: "message", data: payload });
                        } catch (error) {
                            logger.warn("Failed to deliver SSE payload", { error: (error as Error).message });
                        }
                    };

                    eventBus.on(channel, listener);
                    await connection.send({ event: "ready", data: { topic } });

                    await new Promise<void>((resolve) => {
                        req.on("close", () => resolve());
                    });

                    eventBus.off(channel, listener);
                });
            } catch (error) {
                next(error);
            }
        });

        app.get("/transports/http-stream", async (req, res, next) => {
            try {
                const resourceId = typeof req.query.resourceId === "string" ? req.query.resourceId : "default";
                const channel = `http-stream:${resourceId}`;

                await httpStreamTransport.handle(req, res, async (stream) => {
                    const handler = async (payload: { data: string | Buffer; isLast?: boolean }) => {
                        try {
                            await stream.write({ data: payload.data, isLast: payload.isLast ?? false });
                        } catch (error) {
                            logger.warn("Failed to deliver streaming chunk", { error: (error as Error).message });
                        }
                    };

                    eventBus.on(channel, handler);
                    await stream.write({ data: JSON.stringify({ status: "ready", resourceId }) + "\n", isLast: false });

                    await new Promise<void>((resolve) => {
                        req.on("close", () => resolve());
                    });

                    eventBus.off(channel, handler);
                });
            } catch (error) {
                next(error);
            }
        });

        app.all(["/mcp", "/mcp/*"], async (req: Request, res: Response, next: NextFunction) => {
            try {
                await httpTransport.handleRequest(req, res);
            } catch (error) {
                next(error);
            }
        });

        app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
            logger.error("HTTP request handling failed", { error: (error as Error).message, path: req.path });
            if (res.headersSent) {
                res.end();
                return;
            }
            res.status(500).json({ error: "Internal Server Error" });
        });

        app.use((_req, res) => {
            res.status(404).json({ error: "Not Found" });
        });

        return http.createServer(app);
    };

    const listen = async (): Promise<HttpAddress> => {
        if (server) {
            server.removeAllListeners();
        }
        server = buildServer();

        let attempt = 0;
        while (attempt < MAX_PORT_ATTEMPTS) {
            try {
                await new Promise<void>((resolve, reject) => {
                    const onError = (error: Error & { code?: string }) => {
                        server?.off("error", onError);
                        reject(error);
                    };
                    server?.once("error", onError);
                    server?.listen(port, "127.0.0.1", () => {
                        server?.off("error", onError);
                        resolve();
                    });
                });

                const rawAddress = server.address();
                if (rawAddress && typeof rawAddress === "object") {
                    address = { address: rawAddress.address, port: rawAddress.port };
                } else {
                    address = { address: "127.0.0.1", port };
                }

                logger.info("HTTP transport listening", address);
                return address;
            } catch (error) {
                attempt += 1;
                const code = (error as NodeJS.ErrnoException).code;
                if (code !== "EADDRINUSE" || attempt >= MAX_PORT_ATTEMPTS) {
                    throw error;
                }
                logger.warn("HTTP port in use, retrying", { attempt, port, delayMs: PORT_RETRY_DELAY_MS });
                await delay(PORT_RETRY_DELAY_MS);
                server?.close();
                server = buildServer();
            }
        }

        throw new Error("Unable to start HTTP server: maximum retries exceeded");
    };

    return {
        async start(): Promise<HttpAddress> {
            if (address) {
                return address;
            }
            return listen();
        },
        async stop(): Promise<void> {
            if (!server) {
                address = null;
                return;
            }
            await new Promise<void>((resolve, reject) => {
                server?.close((error) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve();
                });
            });
            server = null;
            address = null;
        },
        getAddress(): HttpAddress | null {
            return address ? { ...address } : null;
        },
        getServer(): http.Server | null {
            return server;
        }
    };
};

const defaultDelay: DelayFn = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const createServer = (options: ServerOptions = {}): ServerInstance => {
    const env = options.dependencies?.env ?? process.env;
    const config = resolveConfig(options.config, env);
    const credentials = resolveCredentials(options.credentials, env);
    const appConfig = AppConfigSchema.parse(options.appConfig ?? {});

    const loggerFactory = options.dependencies?.createLogger ?? ((loggerOptions: LoggerOptions) => createRotatingLogger({
        level: loggerOptions.level,
        defaultMeta: loggerOptions.defaultMeta,
        rotation: appConfig.observability.logRotation
    }));
    const logger = options.dependencies?.logger ?? loggerFactory({ level: config.logLevel, defaultMeta: { service: "bitbucket-mcp-server" } });

    const bitbucketServiceFactory = options.dependencies?.createBitbucketService ?? ((creds: BitbucketCredentials, svcLogger: Logger) => new BitbucketService(creds, { logger: svcLogger }));
    const bitbucketService = options.dependencies?.bitbucketService ?? bitbucketServiceFactory(credentials, logger.child({ scope: "bitbucket" }));

    const mcpServerFactory = options.dependencies?.createMcpServer ?? ((svcLogger: Logger) => new McpServer({
        name: "bitbucket-mcp-server",
        version: packageJson.version,
        description: "Bitbucket MCP Server"
    }, {
        capabilities: { logging: {} }
    }));
    const mcpServer = options.dependencies?.mcpServer ?? mcpServerFactory(logger);

    const stdioTransport = options.dependencies?.createStdioTransport?.() ?? new StdioServerTransport();
    const httpTransport = options.dependencies?.createHttpTransport?.() ??
        new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID()
        });

    const delay = options.dependencies?.delay ?? defaultDelay;

    const corsOptions: CorsOptions = {
        origin: appConfig.security.cors.origin,
        methods: appConfig.security.cors.methods
    };

    const rateLimiterFactory = options.dependencies?.createRateLimiter ?? ((rateLimiterOptions?: CombinedRateLimiterOptions) => createRateLimiter(rateLimiterOptions));
    const rateLimiter = options.dependencies?.rateLimiter ?? rateLimiterFactory({
        windowMs: appConfig.security.rateLimit.windowMs,
        max: appConfig.security.rateLimit.max
    });

    const metricsServiceFactory = options.dependencies?.createMetricsService ?? ((metricsOptions?: MetricsServiceOptions) => createMetricsService(metricsOptions));
    const metricsService = appConfig.observability.enableMetrics
        ? options.dependencies?.metricsService ?? metricsServiceFactory()
        : null;

    const defaultLocalesDir = path.resolve(process.cwd(), "locales");
    const i18nServiceFactory = options.dependencies?.createI18nService ?? ((i18nOptions: Parameters<typeof createI18nService>[0]) => createI18nService(i18nOptions));
    const i18nService = options.dependencies?.i18nService ?? i18nServiceFactory({
        fallbackLng: "en",
        supportedLngs: ["en"],
        resourcesPath: defaultLocalesDir
    });

    const sseTransportFactory = options.dependencies?.createSseTransport ?? ((sseOptions?: SseTransportOptions) => createSseTransport(sseOptions));
    const sseTransport = options.dependencies?.sseTransport ?? sseTransportFactory();

    const httpStreamTransportFactory = options.dependencies?.createHttpStreamTransport ?? ((streamOptions?: HttpStreamTransportOptions) => createHttpStreamTransport(streamOptions));
    const httpStreamTransport = options.dependencies?.httpStreamTransport ?? httpStreamTransportFactory();

    const eventBus = options.dependencies?.eventBus ?? new EventEmitter();

    const vectorDbService = options.dependencies?.vectorDbService ?? new VectorDBService({
        logger: logger.child({ scope: "vector-db-service" })
    });

    const schemaService = options.dependencies?.schemaService ?? new SchemaService({
        logger: logger.child({ scope: "schema-service" })
    });

    const authServiceFactory = options.dependencies?.createAuthService ?? ((config: AppConfig["authentication"], svcLogger: Logger) => new AuthService({
        config,
        logger: svcLogger
    }));
    const authService = options.dependencies?.authService ?? authServiceFactory(appConfig.authentication, logger.child({ scope: "auth-service" }));

    const searchIdsTool = createSearchIdsTool({
        vectorDb: vectorDbService,
        logger: logger.child({ scope: "tool:search-ids" })
    });

    const getIdTool = createGetIdTool({
        schemaService,
        logger: logger.child({ scope: "tool:get-id" })
    });

    const callIdTool = createCallIdTool({
        schemaService,
        baseUrl: credentials.host,
        logger: logger.child({ scope: "tool:call-id" })
    });

    type ToolTextContent = {
        type: "text";
        text: string;
        _meta?: Record<string, unknown>;
    };

    interface ToolResult {
        [key: string]: unknown;
        content: ToolTextContent[];
        structuredContent?: Record<string, unknown>;
        isError?: boolean;
    }

    const buildToolResult = (payload: unknown): ToolResult => {
        const text = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2) ?? "";
        return {
            content: [
                {
                    type: "text",
                    text
                }
            ],
            structuredContent: {
                data: payload
            }
        } satisfies ToolResult;
    };

    const registerTools = () => {
        mcpServer.registerTool(
            searchIdsTool.name,
            {
                title: searchIdsTool.config.title,
                description: searchIdsTool.config.description
            },
            async (args) => {
                const parsed = SearchIdsParams.parse(args) as SearchIdsParamsInput;
                const result = await searchIdsTool.handler(parsed);
                return buildToolResult(result);
            }
        );

        mcpServer.registerTool(
            getIdTool.name,
            {
                title: getIdTool.config.title,
                description: getIdTool.config.description
            },
            async (args) => {
                const parsed = GetIdParams.parse(args) as GetIdParamsInput;
                const result = await getIdTool.handler(parsed);
                return buildToolResult(result);
            }
        );

        mcpServer.registerTool(
            callIdTool.name,
            {
                title: callIdTool.config.title,
                description: callIdTool.config.description
            },
            async (args) => {
                const parsed = CallIdParams.parse(args) as CallIdParamsOutput;
                const normalized = {
                    id: parsed.id,
                    parameters: parsed.parameters ?? {}
                } satisfies CallIdParamsOutput;
                const result = await callIdTool.handler(normalized);
                return buildToolResult(result);
            }
        );

        if (typeof mcpServer.sendToolListChanged === "function") {
            mcpServer.sendToolListChanged();
        }
    };

    registerTools();

    const state: ServerState = {
        isRunning: false,
        bitbucketConnected: false,
        bitbucketServerInfo: null,
        degradedMode: false
    };

    let httpController: HttpServerController | null = null;
    let httpAddress: HttpAddress | null = null;
    let startPromise: Promise<void> | null = null;
    let stopPromise: Promise<void> | null = null;

    const getHttpController = (): HttpServerController => {
        if (!httpController) {
            const factory = options.dependencies?.createHttpServer ?? defaultHttpServerFactory;
            httpController = factory({
                port: config.port,
                logger,
                state,
                httpTransport,
                onShutdown: async () => {
                    await instance.stop();
                },
                delay,
                appConfig,
                metricsService,
                i18nService,
                rateLimiter,
                corsOptions,
                sseTransport,
                httpStreamTransport,
                eventBus,
                authService
            });
        }
        return httpController;
    };

    const handleConnected = (info: BitbucketServerInfo) => {
        state.bitbucketConnected = true;
        state.bitbucketServerInfo = info;
        state.degradedMode = false;
        logger.info("Bitbucket connection established", info);
    };

    const handleDisconnected = () => {
        state.bitbucketConnected = false;
        state.bitbucketServerInfo = null;
        state.degradedMode = true;
        logger.warn("Bitbucket connection lost");
        bitbucketService.scheduleReconnect();
    };

    const handleBitbucketError = (error: BitbucketServiceError) => {
        if (error instanceof BitbucketRateLimitError) {
            logger.warn("Bitbucket rate limit hit", { error: error.message });
        } else if (error instanceof BitbucketConnectionError) {
            logger.error("Bitbucket connection error", { error: error.message });
        } else {
            logger.error("Bitbucket service error", { error: error.message });
        }
    };

    bitbucketService.on("connected", handleConnected);
    bitbucketService.on("reconnected", handleConnected);
    bitbucketService.on("disconnected", handleDisconnected);
    bitbucketService.on("error", handleBitbucketError);

    const startTransports = async () => {
        await mcpServer.connect(stdioTransport);
        await mcpServer.connect(httpTransport);
    };

    const instance: ServerInstance = {
        async start(): Promise<void> {
            if (state.isRunning) {
                return;
            }

            if (startPromise) {
                return startPromise;
            }

            startPromise = (async () => {
                await startTransports();

                if (i18nService) {
                    await i18nService.init();
                }

                const controller = getHttpController();
                const startResult = await controller.start();
                httpAddress = controller.getAddress() ?? (typeof startResult === "number"
                    ? { address: "127.0.0.1", port: startResult }
                    : startResult ?? null);
                state.isRunning = true;

                try {
                    const info = await bitbucketService.connect();
                    if (!state.bitbucketConnected && info) {
                        handleConnected(info);
                    }
                } catch (error) {
                    const normalized = error instanceof BitbucketServiceError ? error : new BitbucketServiceError((error as Error).message, error);
                    handleBitbucketError(normalized);
                    state.degradedMode = true;
                    bitbucketService.scheduleReconnect();
                }
            })();

            try {
                await startPromise;
            } finally {
                startPromise = null;
            }
        },
        async stop(): Promise<void> {
            if (!state.isRunning && !startPromise) {
                return;
            }

            if (stopPromise) {
                return stopPromise;
            }

            stopPromise = (async () => {
                const controller = httpController;
                if (controller) {
                    await controller.stop();
                }
                httpAddress = null;
                httpController = null;

                if (typeof stdioTransport.close === "function") {
                    await stdioTransport.close();
                }

                if (typeof httpTransport.close === "function") {
                    await httpTransport.close();
                }

                await mcpServer.close();

                bitbucketService.dispose();
                vectorDbService.dispose();

                state.isRunning = false;
                state.bitbucketConnected = false;
                state.bitbucketServerInfo = null;
                state.degradedMode = false;
            })();

            try {
                await stopPromise;
            } finally {
                stopPromise = null;
            }
        },
        getState(): ServerState {
            return cloneState(state);
        },
        getHttpAddress(): HttpAddress | null {
            return httpAddress ? { ...httpAddress } : null;
        },
        getLogger(): Logger {
            return logger;
        }
    };

    return instance;
};
