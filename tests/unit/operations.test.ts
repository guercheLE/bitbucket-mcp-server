import { z } from "zod";

import { OperationRegistry, registryToSearchable } from "../../src/lib/operations";

describe("OperationRegistry", () => {
    it("registers and lists operations", () => {
        const registry = new OperationRegistry();
        const definition = {
            id: "sample",
            summary: "Sample operation",
            description: "Demonstrates registry mechanics",
            input: z.object({ id: z.string() }),
            output: z.object({ ok: z.boolean() }),
            handler: async () => ({ ok: true })
        };

        registry.register(definition);

        const operations = registry.list();
        expect(operations).toHaveLength(1);
        expect(registry.get("sample")).toBe(definition);
        expect(registry.ensure("sample")).toBe(definition);
    });

    it("throws when ensuring a missing operation", () => {
        const registry = new OperationRegistry();
        expect(() => registry.ensure("missing")).toThrow("Operation missing not found");
    });
});

describe("registryToSearchable", () => {
    it("maps operation definitions to searchable metadata", () => {
        const operations = [
            {
                id: "tagged",
                summary: "Tagged operation",
                description: "Includes tags",
                tags: ["alpha", "beta"],
                input: z.unknown(),
                output: z.unknown(),
                handler: async () => undefined
            },
            {
                id: "untagged",
                summary: "No tags",
                description: "Defaults to empty tag list",
                input: z.unknown(),
                output: z.unknown(),
                handler: async () => undefined
            }
        ];

        const searchable = registryToSearchable(operations);
        expect(searchable).toEqual([
            {
                id: "tagged",
                summary: "Tagged operation",
                description: "Includes tags",
                tags: ["alpha", "beta"]
            },
            {
                id: "untagged",
                summary: "No tags",
                description: "Defaults to empty tag list",
                tags: []
            }
        ]);
    });
});