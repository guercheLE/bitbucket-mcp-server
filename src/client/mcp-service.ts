import { Client, type ClientOptions } from "@modelcontextprotocol/sdk/client";
import {
    StreamableHTTPClientTransport,
    type StreamableHTTPClientTransportOptions
} from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";

import pkg from "../../package.json";

import type {
    CapabilityDiscoveryResult,
    ConsoleClientConfig,
    ToolCapability,
    ToolParameter,
    TransportKind
} from "./types";

export interface McpService {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    discoverCapabilities(): Promise<CapabilityDiscoveryResult>;
    executeTool(id: string, args: Record<string, unknown>): Promise<unknown>;
}

type Logger = Pick<typeof console, "debug" | "info" | "warn" | "error">;

export interface McpServiceDependencies {
    createClient?: (clientInfo: ClientInfo, options?: ClientOptions) => Client;
    clientOptions?: ClientOptions;
    createStreamableHttpTransport?: (
        endpoint: URL,
        options?: StreamableHTTPClientTransportOptions
    ) => Transport;
    streamableHttpOptions?: StreamableHTTPClientTransportOptions;
    clientInfo?: ClientInfo;
    logger?: Logger;
}

type ClientInfo = {
    name: string;
    version: string;
};

type NormalizedDependencies = {
    createClient: (clientInfo: ClientInfo, options?: ClientOptions) => Client;
    clientOptions?: ClientOptions;
    createStreamableHttpTransport: (
        endpoint: URL,
        options?: StreamableHTTPClientTransportOptions
    ) => Transport;
    streamableHttpOptions?: StreamableHTTPClientTransportOptions;
    clientInfo: ClientInfo;
    logger: Logger;
};

type JsonSchema = {
    [key: string]: unknown;
    type?: unknown;
    properties?: unknown;
    required?: unknown;
    anyOf?: unknown;
    oneOf?: unknown;
    allOf?: unknown;
    description?: unknown;
    title?: unknown;
};

const DEFAULT_CLIENT_INFO: ClientInfo = {
    name: "mcp-client",
    version: typeof pkg.version === "string" ? pkg.version : "0.0.0"
};

const ENDPOINT_ENV_VARS = ["BITBUCKET_MCP_ENDPOINT", "MCP_SERVER_URL", "MCP_ENDPOINT"];
const CONNECTION_CLOSED_CODE = -32000;

const noopLogger: Logger = {
    debug: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined
};

class DefaultMcpService implements McpService {
    private client: Client | undefined;
    private transport: Transport | undefined;
    private readonly dependencies: NormalizedDependencies;
    private readonly transportKind: TransportKind;
    private readonly endpoint: URL;
    private closing = false;
    private connectPromise: Promise<void> | undefined;

    constructor(config: ConsoleClientConfig, dependencies: McpServiceDependencies) {
        this.dependencies = this.normalizeDependencies(dependencies);
        this.transportKind = config.transport ?? "streamable-http";
        this.endpoint = this.resolveEndpoint(config.endpoint, this.transportKind);
    }

    async connect(): Promise<void> {
        if (this.client) {
            return;
        }

        await this.establishConnection();
    }

    async disconnect(): Promise<void> {
        await this.closeExistingConnection();
    }

    async discoverCapabilities(): Promise<CapabilityDiscoveryResult> {
        return this.callWithReconnect(async (client) => {
            const result = await client.listTools({});
            const tools = Array.isArray(result?.tools) ? result.tools : [];
            return {
                tools: tools.map((tool: unknown) => this.mapTool(tool))
            };
        });
    }

    async executeTool(id: string, args: Record<string, unknown>): Promise<unknown> {
        return this.callWithReconnect(async (client) => {
            const result = await client.callTool({
                name: id,
                arguments: args
            });
            return this.normalizeToolResult(result);
        });
    }

    private normalizeDependencies(dependencies: McpServiceDependencies): NormalizedDependencies {
        return {
            createClient:
                dependencies.createClient ??
                ((info, options) => new Client(info, options)),
            clientOptions: dependencies.clientOptions,
            createStreamableHttpTransport:
                dependencies.createStreamableHttpTransport ??
                ((endpoint, options) => new StreamableHTTPClientTransport(endpoint, options)),
            streamableHttpOptions: dependencies.streamableHttpOptions,
            clientInfo: dependencies.clientInfo ?? DEFAULT_CLIENT_INFO,
            logger: dependencies.logger ?? noopLogger
        };
    }

    private resolveEndpoint(endpoint: string | undefined, transport: TransportKind): URL {
        if (transport !== "streamable-http") {
            throw new Error(`Transport "${transport}" is not supported yet.`);
        }

        const value = this.resolveEndpointValue(endpoint);
        try {
            return new URL(value);
        } catch (error) {
            throw new Error(`Invalid MCP endpoint URL: ${value}`);
        }
    }

    private resolveEndpointValue(explicit: string | undefined): string {
        if (explicit && explicit.length > 0) {
            return explicit;
        }

        for (const key of ENDPOINT_ENV_VARS) {
            const candidate = process.env[key];
            if (candidate && candidate.length > 0) {
                return candidate;
            }
        }

        throw new Error(
            "Unable to determine MCP endpoint. Provide a console client endpoint in configuration or set BITBUCKET_MCP_ENDPOINT."
        );
    }

    private async establishConnection(): Promise<void> {
        if (!this.connectPromise) {
            this.connectPromise = this.createConnection().finally(() => {
                this.connectPromise = undefined;
            });
        }

        return this.connectPromise;
    }

    private async createConnection(): Promise<void> {
        const transport = this.createTransport();
        const client = this.dependencies.createClient(this.dependencies.clientInfo, this.dependencies.clientOptions);

        client.onclose = () => this.handleClientClosed();
        client.onerror = (error: Error) => this.dependencies.logger.error?.(`MCP transport error: ${error.message}`);

        try {
            await client.connect(transport);
            this.client = client;
            this.transport = transport;
        } catch (error) {
            await this.safeCloseTransport(transport);
            throw this.wrapConnectionError(error);
        }
    }

    private createTransport(): Transport {
        if (this.transportKind !== "streamable-http") {
            throw new Error(`Transport "${this.transportKind}" is not supported yet.`);
        }

        return this.dependencies.createStreamableHttpTransport(
            this.endpoint,
            this.dependencies.streamableHttpOptions
        );
    }

    private async closeExistingConnection(): Promise<void> {
        if (!this.client && !this.transport) {
            return;
        }

        this.closing = true;
        try {
            if (this.client) {
                await this.client.close().catch((error: unknown) => {
                    this.dependencies.logger.debug?.(
                        `Error while closing MCP client: ${error instanceof Error ? error.message : String(error)}`
                    );
                });
            } else if (this.transport) {
                await this.safeCloseTransport(this.transport);
            }
        } finally {
            this.client = undefined;
            this.transport = undefined;
            this.closing = false;
        }
    }

    private async safeCloseTransport(transport: Transport): Promise<void> {
        try {
            await transport.close();
        } catch (error) {
            this.dependencies.logger.debug?.(
                `Error while closing MCP transport: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    private async ensureClient(): Promise<Client> {
        await this.connect();
        if (!this.client) {
            throw new Error("MCP client is not connected");
        }
        return this.client;
    }

    private async callWithReconnect<T>(operation: (client: Client) => Promise<T>, attempt = 0): Promise<T> {
        const client = await this.ensureClient();
        try {
            return await operation(client);
        } catch (error) {
            if (this.shouldReconnect(error) && attempt < 1) {
                this.dependencies.logger.warn?.("Connection lost. Attempting to reconnect once...");
                await this.closeExistingConnection();
                await this.establishConnection();
                return this.callWithReconnect(operation, attempt + 1);
            }

            if (error instanceof Error) {
                throw error;
            }
            throw new Error(String(error));
        }
    }

    private shouldReconnect(error: unknown): boolean {
        if (this.closing) {
            return false;
        }

        if (error && typeof error === "object" && "code" in error) {
            const code = (error as { code?: unknown }).code;
            if (code === CONNECTION_CLOSED_CODE) {
                return true;
            }
        }

        if (error instanceof Error) {
            const message = error.message.toLowerCase();
            return message.includes("not connected") || message.includes("connection closed");
        }

        return false;
    }

    private wrapConnectionError(error: unknown): Error {
        const description = error instanceof Error ? error.message : String(error);
        const wrapped = new Error(
            `Unable to connect to MCP server at ${this.endpoint.href}: ${description}`
        );
        (wrapped as Error & { cause?: unknown }).cause = error;
        return wrapped;
    }

    private handleClientClosed(): void {
        if (this.closing) {
            return;
        }

        this.client = undefined;
        this.transport = undefined;
        this.dependencies.logger.warn?.("MCP connection closed unexpectedly.");
    }

    private mapTool(tool: unknown): ToolCapability {
        if (!tool || typeof tool !== "object") {
            throw new Error("Received an invalid tool description from the server.");
        }

        const typed = tool as {
            name?: unknown;
            title?: unknown;
            description?: unknown;
            inputSchema?: unknown;
        };

        if (typeof typed.name !== "string" || typed.name.length === 0) {
            throw new Error("Tool definitions must include a non-empty name.");
        }

        const capability: ToolCapability = {
            name: typed.name
        };

        if (typeof typed.title === "string" && typed.title.length > 0) {
            capability.title = typed.title;
        }

        if (typeof typed.description === "string" && typed.description.length > 0) {
            capability.description = typed.description;
        }

        capability.parameters = this.extractParameters(typed.inputSchema);

        return capability;
    }

    private extractParameters(schema: unknown): ToolParameter[] {
        if (!schema || typeof schema !== "object") {
            return [];
        }

        const typed = schema as JsonSchema;
        const properties = this.asRecord(typed.properties);
        if (!properties) {
            return [];
        }

        const requiredList = Array.isArray(typed.required)
            ? typed.required.filter((value): value is string => typeof value === "string")
            : [];

        const parameters: ToolParameter[] = [];
        for (const [name, definition] of Object.entries(properties)) {
            const parameter = this.mapParameter(name, definition, requiredList.includes(name));
            if (parameter) {
                parameters.push(parameter);
            }
        }

        return parameters;
    }

    private mapParameter(name: string, definition: unknown, required: boolean): ToolParameter | undefined {
        if (!definition || typeof definition !== "object") {
            return undefined;
        }

        const typed = definition as JsonSchema;
        const parameter: ToolParameter = { name };

        const inferredType = this.deriveParameterType(typed);
        if (inferredType) {
            parameter.type = inferredType;
        }

        const description = this.getString(typed.description) ?? this.getString(typed.title);
        if (description) {
            parameter.description = description;
        }

        if (required) {
            parameter.required = true;
        }

        return parameter;
    }

    private deriveParameterType(schema: JsonSchema): ToolParameter["type"] | undefined {
        const direct = this.normalizePrimitiveTypes(schema.type);
        if (direct) {
            return direct;
        }

        return (
            this.deriveFromComposite(schema.anyOf) ??
            this.deriveFromComposite(schema.oneOf) ??
            this.deriveFromComposite(schema.allOf)
        );
    }

    private deriveFromComposite(value: unknown): ToolParameter["type"] | undefined {
        if (!Array.isArray(value)) {
            return undefined;
        }

        for (const entry of value) {
            if (entry && typeof entry === "object") {
                const derived = this.deriveParameterType(entry as JsonSchema);
                if (derived) {
                    return derived;
                }
            }
        }

        return undefined;
    }

    private normalizePrimitiveTypes(value: unknown): ToolParameter["type"] | undefined {
        if (!value) {
            return undefined;
        }

        const candidates = Array.isArray(value) ? value : [value];
        for (const candidate of candidates) {
            if (typeof candidate !== "string") {
                continue;
            }
            switch (candidate) {
                case "boolean":
                    return "boolean";
                case "integer":
                case "number":
                    return "number";
                case "string":
                    return "string";
                default:
                    break;
            }
        }
        return undefined;
    }

    private getString(value: unknown): string | undefined {
        return typeof value === "string" && value.length > 0 ? value : undefined;
    }

    private asRecord(value: unknown): Record<string, unknown> | undefined {
        if (!value || typeof value !== "object") {
            return undefined;
        }

        return value as Record<string, unknown>;
    }

    private normalizeToolResult(result: unknown): unknown {
        if (!result || typeof result !== "object") {
            return result;
        }

        const typed = result as {
            structuredContent?: unknown;
            content?: unknown;
            output?: unknown;
        };

        if (typed.structuredContent !== undefined) {
            return typed.structuredContent;
        }

        if (Array.isArray(typed.content)) {
            const text = typed.content
                .map((entry) => this.extractTextContent(entry))
                .filter((value): value is string => Boolean(value))
                .join("\n")
                .trim();

            if (text.length > 0) {
                return text;
            }

            return typed.content;
        }

        if (typed.output !== undefined) {
            return typed.output;
        }

        return result;
    }

    private extractTextContent(entry: unknown): string | undefined {
        if (!entry || typeof entry !== "object") {
            return undefined;
        }

        const typed = entry as { type?: unknown; text?: unknown };
        if (typed.type === "text" && typeof typed.text === "string") {
            return typed.text;
        }

        return undefined;
    }
}

export const createMcpService = (
    config: ConsoleClientConfig = {},
    dependencies: McpServiceDependencies = {}
): McpService => {
    return new DefaultMcpService(config, dependencies);
};
