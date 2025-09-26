export type TransportKind = "streamable-http" | "stdio";

export interface ToolCapability {
    name: string;
    title?: string;
    description?: string;
}

export interface CapabilityDiscoveryResult {
    tools: ToolCapability[];
}

export interface ConsoleClientConfig {
    transport?: TransportKind;
    endpoint?: string;
}
