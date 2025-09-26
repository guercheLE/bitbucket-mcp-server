import { Writable } from "node:stream";

import { run } from "../../../src/client";
import type { McpService } from "../../../src/client/mcp-service";
import type { CapabilityDiscoveryResult } from "../../../src/client/types";

const createBuffer = () => {
    const chunks: string[] = [];
    const writable = new Writable({
        write(chunk, _encoding, callback) {
            chunks.push(chunk.toString());
            callback();
        }
    });
    return {
        writable,
        value: () => chunks.join("")
    };
};

describe("console client --help output", () => {
    const capabilities = {
        tools: [
            {
                name: "call-id",
                title: "Execute Bitbucket Operation",
                description: "Execute Bitbucket API operation with parameter validation",
                parameters: [
                    { name: "endpoint-id", type: "string", required: true, description: "Operation identifier" }
                ]
            },
            {
                name: "get-id",
                title: "Retrieve Schema",
                description: "Retrieve schema for a Bitbucket operation",
                parameters: [
                    { name: "endpoint-id", type: "string", required: true, description: "Operation identifier" }
                ]
            },
            {
                name: "search-ids",
                title: "Semantic Search",
                description: "Search Bitbucket operations",
                parameters: [
                    { name: "query", type: "string", required: true, description: "Search query" },
                    { name: "limit", type: "number", required: false, description: "Maximum results" }
                ]
            }
        ]
    } as unknown as CapabilityDiscoveryResult;

    const createService = (): McpService => ({
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
        discoverCapabilities: jest.fn().mockResolvedValue(capabilities),
        executeTool: jest.fn()
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("lists dynamically registered commands in alphabetical order", async () => {
        const stdout = createBuffer();
        const stderr = createBuffer();
        const service = createService();

        await run(["node", "mcp-client", "--help"], {}, {
            createMcpService: () => service,
            stdout: stdout.writable,
            stderr: stderr.writable
        });

        expect(service.connect).toHaveBeenCalledTimes(1);
        expect(service.discoverCapabilities).toHaveBeenCalledTimes(1);
        expect(service.disconnect).toHaveBeenCalledTimes(1);

        const output = stdout.value();
        const callIndex = output.indexOf("call-id");
        const getIndex = output.indexOf("get-id");
        const searchIndex = output.indexOf("search-ids");

        expect(output).toContain("Usage: mcp-client");
        expect(callIndex).toBeGreaterThan(-1);
        expect(getIndex).toBeGreaterThan(-1);
        expect(searchIndex).toBeGreaterThan(-1);
        expect(callIndex).toBeLessThan(getIndex);
        expect(getIndex).toBeLessThan(searchIndex);
        expect(output).toContain("Semantic Search");
    });
});
