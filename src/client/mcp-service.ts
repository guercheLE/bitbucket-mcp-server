import type { CapabilityDiscoveryResult, ConsoleClientConfig } from "./types";

export interface McpService {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    discoverCapabilities(): Promise<CapabilityDiscoveryResult>;
    executeTool(id: string, args: Record<string, unknown>): Promise<unknown>;
}

export interface McpServiceDependencies { }

class StubMcpService implements McpService {
    constructor(_config: ConsoleClientConfig, _dependencies: McpServiceDependencies) { }

    async connect(): Promise<void> {
        // Placeholder implementation
    }

    async disconnect(): Promise<void> {
        // Placeholder implementation
    }

    async discoverCapabilities(): Promise<CapabilityDiscoveryResult> {
        return { tools: [] };
    }

    async executeTool(_id: string, _args: Record<string, unknown>): Promise<unknown> {
        return undefined;
    }
}

export const createMcpService = (
    config: ConsoleClientConfig = {},
    dependencies: McpServiceDependencies = {}
): McpService => {
    return new StubMcpService(config, dependencies);
};
