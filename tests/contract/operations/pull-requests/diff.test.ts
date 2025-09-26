import type { ZodIssue } from "zod";

import { SchemaService } from "../../../../src/services/SchemaService";

const OPERATION_ID = "bitbucket.pull-requests.diff";

describe("bitbucket.pull-requests.diff contract", () => {
    const buildService = () => new SchemaService();

    it("describes the REST operation metadata", async () => {
        const service = buildService();
        const operation = await service.getOperation(OPERATION_ID);

        expect(operation.method).toBe("GET");
        expect(operation.path).toBe(
            "/2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/diff"
        );
        expect(operation.description.toLowerCase()).toContain("diff");
    });

    it("requires workspace, repo_slug and pull_request_id", async () => {
        const service = buildService();
        const operation = await service.getOperation(OPERATION_ID);

        const result = operation.schema.safeParse({});
        expect(result.success).toBe(false);
        if (!result.success) {
            const missingPaths = result.error.issues.map((issue: ZodIssue) => issue.path.join("."));
            expect(missingPaths).toEqual(
                expect.arrayContaining(["workspace", "repo_slug", "pull_request_id"])
            );
        }
    });

    it("accepts optional filtering flags", async () => {
        const service = buildService();
        const operation = await service.getOperation(OPERATION_ID);

        const payload = {
            workspace: "acme",
            repo_slug: "mobile-app",
            pull_request_id: 42,
            path: "src/index.ts",
            ignore_whitespace: true,
            merge_commit: false
        };

        await expect(operation.schema.parseAsync(payload)).resolves.toEqual(payload);
    });
});
