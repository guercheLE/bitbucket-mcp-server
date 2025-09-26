import { Command } from "commander";

import type { CapabilityDiscoveryResult } from "./types";

export interface CommandMapper {
    registerCapabilities(capabilities: CapabilityDiscoveryResult): void;
}

export class DefaultCommandMapper implements CommandMapper {
    constructor(private readonly program: Command) { }

    registerCapabilities(_capabilities: CapabilityDiscoveryResult): void {
        // Placeholder: dynamic command registration will be implemented in later tasks.
    }
}
