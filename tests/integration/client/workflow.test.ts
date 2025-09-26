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

const capabilities = {
    tools: [
        {
            name: "call-id",
            title: "Execute Operation",
            description: "Execute Bitbucket API operation",
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
                { name: "query", type: "string", required: true, description: "Search term" }
            ]
        }
    ]
} as unknown as CapabilityDiscoveryResult;

type MockService = McpService & {
    connect: jest.Mock;
    disconnect: jest.Mock;
    discoverCapabilities: jest.Mock;
    executeTool: jest.Mock;
};

const createService = (): MockService => ({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    discoverCapabilities: jest.fn().mockResolvedValue(capabilities),
    executeTool: jest.fn((tool: string, args: Record<string, unknown>) => {
        if (tool === "search-ids") {
            return Promise.resolve([{ id: "GET /rest/api/1.0/projects", description: "List projects" }]);
        }
        if (tool === "get-id") {
            expect(args).toEqual({ "endpoint-id": "GET /rest/api/1.0/projects" });
            return Promise.resolve({ schema: { type: "object" } });
        }
        if (tool === "call-id") {
            expect(args).toEqual({ "endpoint-id": "GET /rest/api/1.0/projects" });
            return Promise.resolve({ status: "ok" });
        }
        return Promise.resolve(undefined);
    })
});

describe("console client semantic workflow", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("supports the search → get → call workflow", async () => {
        const services: MockService[] = [];
        const factory = jest.fn(() => {
            const service = createService();
            services.push(service);
            return service;
        });

        const stdout = createBuffer();
        const stderr = createBuffer();

        await run(["node", "mcp-client", "search-ids", "--query", "projects"], {}, {
            createMcpService: factory,
            stdout: stdout.writable,
            stderr: stderr.writable
        });

        await run(["node", "mcp-client", "get-id", "--endpoint-id", "GET /rest/api/1.0/projects"], {}, {
            createMcpService: factory,
            stdout: stdout.writable,
            stderr: stderr.writable
        });

        await run(["node", "mcp-client", "call-id", "--endpoint-id", "GET /rest/api/1.0/projects"], {}, {
            createMcpService: factory,
            stdout: stdout.writable,
            stderr: stderr.writable
        });

        expect(factory).toHaveBeenCalledTimes(3);
        expect(services).toHaveLength(3);
        for (const service of services) {
            expect(service.connect).toHaveBeenCalled();
            expect(service.discoverCapabilities).toHaveBeenCalled();
            expect(service.disconnect).toHaveBeenCalled();
        }

        const combinedOutput = stdout.value();
        expect(combinedOutput).toContain("List projects");
        expect(combinedOutput).toContain("\"schema\"");
        expect(combinedOutput).toContain("\"status\": \"ok\"");
        expect(stderr.value()).toBe("");
    });
});
