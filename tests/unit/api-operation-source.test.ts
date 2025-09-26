import { ApiOperationSourceSchema } from "../../src/models/api-operation-source";

describe("ApiOperationSourceSchema", () => {
    const validSource = {
        id: "get-repository",
        operationName: "Get Repository",
        endpoint: "/2.0/repositories/{workspace}/{repo_slug}",
        type: "GET",
        tags: ["repositories", "metadata"],
        description: "Returns the repository with metadata and permissions.",
        inputSchema: {
            type: "object",
            properties: {
                workspace: { type: "string" },
                repo_slug: { type: "string" }
            }
        },
        outputSchema: {
            type: "object",
            properties: {
                uuid: { type: "string" }
            }
        },
        errorSchema: {
            type: "object",
            properties: {
                error: { type: "string" }
            }
        },
        samples: "axios.get('/2.0/repositories/my-workspace/my-repo')"
    };

    it("accepts a valid API operation source", () => {
        expect(ApiOperationSourceSchema.parse(validSource)).toEqual(validSource);
    });

    it("requires the minimal set of fields", () => {
        const { id, endpoint, ...missingFields } = validSource;
        expect(() => ApiOperationSourceSchema.parse(missingFields)).toThrow();
    });

    it("rejects unsupported HTTP methods", () => {
        expect(() =>
            ApiOperationSourceSchema.parse({
                ...validSource,
                type: "TRACE"
            })
        ).toThrow(/Invalid enum value/);
    });

    it("rejects malformed tag collections", () => {
        expect(() =>
            ApiOperationSourceSchema.parse({
                ...validSource,
                tags: "repositories"
            })
        ).toThrow(/Expected array/);
    });

    it("allows optional schemas and samples to be omitted", () => {
        expect(
            ApiOperationSourceSchema.parse({
                id: "search-pull-requests",
                operationName: "Search Pull Requests",
                endpoint: "/2.0/repositories/{workspace}/{repo_slug}/pullrequests",
                type: "GET",
                tags: ["pullrequests"],
                description: "Searches pull requests using a query syntax."
            })
        ).toEqual({
            id: "search-pull-requests",
            operationName: "Search Pull Requests",
            endpoint: "/2.0/repositories/{workspace}/{repo_slug}/pullrequests",
            type: "GET",
            tags: ["pullrequests"],
            description: "Searches pull requests using a query syntax."
        });
    });
});
