import type { ZodIssue } from "zod";

import { SchemaService } from "../../../../src/services/SchemaService";

const OPERATION_ID = "bitbucket.repositories.get";

describe("bitbucket.repositories.get contract", () => {
    const buildService = () => new SchemaService();

    it("describes the REST operation metadata", async () => {
        const service = buildService();
        const operation = await service.getOperation(OPERATION_ID);

        expect(operation.method).toBe("GET");
        expect(operation.path).toBe("/2.0/repositories/{workspace}/{repo_slug}");
        expect(operation.description).toContain("repository");
    });

    it("requires workspace and repo_slug parameters", async () => {
        const service = buildService();
        const operation = await service.getOperation(OPERATION_ID);

        const result = operation.schema.safeParse({});
        expect(result.success).toBe(false);
        if (!result.success) {
            const missing = result.error.issues.map((issue: ZodIssue) => issue.path.join("."));
            expect(missing).toEqual(expect.arrayContaining(["workspace", "repo_slug"]));
        }
    });

    it("accepts optional response field filtering", async () => {
        const service = buildService();
        const operation = await service.getOperation(OPERATION_ID);

        const payload = {
            workspace: "acme",
            repo_slug: "website",
            fields: "links,project,key"
        };

        await expect(operation.schema.parseAsync(payload)).resolves.toEqual(payload);
    });
});
