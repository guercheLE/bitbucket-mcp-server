export type TransportKind = "streamable-http" | "stdio";

export interface ToolParameter {
    name: string;
    type?: "string" | "number" | "boolean";
    required?: boolean;
    description?: string;
}

export interface ToolCapability {
    name: string;
    title?: string;
    description?: string;
    parameters?: ToolParameter[];
}

export interface CapabilityDiscoveryResult {
    tools: ToolCapability[];
}

export interface ConsoleClientConfig {
    transport?: TransportKind;
    endpoint?: string;
}
