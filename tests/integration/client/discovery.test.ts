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

describe("console client dynamic discovery", () => {
    const discovery = {
        tools: [
            {
                name: "search-ids",
                title: "Semantic Search",
                description: "Search Bitbucket operations",
                parameters: [
                    { name: "query", type: "string", required: true, description: "Search term" }
                ]
            },
            {
                name: "get-id",
                title: "Retrieve Schema",
                description: "Retrieve schema for a Bitbucket operation",
                parameters: [
                    { name: "endpoint-id", type: "string", required: true, description: "Operation identifier" }
                ]
            }
        ]
    } as unknown as CapabilityDiscoveryResult;

    const createService = (): McpService & { executeTool: jest.Mock } => ({
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
        discoverCapabilities: jest.fn().mockResolvedValue(discovery),
        executeTool: jest.fn().mockResolvedValue([{ id: "abc", description: "Sample" }])
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("registers only discovered commands and forwards arguments", async () => {
        const stdout = createBuffer();
        const stderr = createBuffer();
        const service = createService();

        await run(["node", "mcp-client", "search-ids", "--query", "projects"], {}, {
            createMcpService: () => service,
            stdout: stdout.writable,
            stderr: stderr.writable
        });

        expect(service.executeTool).toHaveBeenCalledWith("search-ids", { query: "projects" });
        expect(stdout.value()).toContain("\"id\": \"abc\"");
        expect(stderr.value()).toBe("");
    });

    it("throws an error for commands not provided by the server", async () => {
        const stdout = createBuffer();
        const stderr = createBuffer();
        const service = createService();

        await expect(
            run(["node", "mcp-client", "call-id", "--endpoint-id", "missing"], {}, {
                createMcpService: () => service,
                stdout: stdout.writable,
                stderr: stderr.writable
            })
        ).rejects.toThrow(/not supported/);

        expect(service.executeTool).not.toHaveBeenCalled();
    });
});
