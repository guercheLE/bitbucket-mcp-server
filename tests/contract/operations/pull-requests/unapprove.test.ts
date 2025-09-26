import type { ZodIssue } from "zod";

import { SchemaService } from "../../../../src/services/SchemaService";

const OPERATION_ID = "bitbucket.pull-requests.unapprove";

describe("bitbucket.pull-requests.unapprove contract", () => {
    const buildService = () => new SchemaService();

    it("describes the REST operation metadata", async () => {
        const service = buildService();
        const operation = await service.getOperation(OPERATION_ID);

        expect(operation.method).toBe("DELETE");
        expect(operation.path).toBe(
            "/2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/approve"
        );
        expect(operation.description.toLowerCase()).toContain("remove");
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

    it("accepts a minimal unapproval payload", async () => {
        const service = buildService();
        const operation = await service.getOperation(OPERATION_ID);

        const payload = {
            workspace: "acme",
            repo_slug: "mobile-app",
            pull_request_id: 42
        };

        await expect(operation.schema.parseAsync(payload)).resolves.toEqual(payload);
    });

    it("rejects non-positive pull_request_id values", async () => {
        const service = buildService();
        const operation = await service.getOperation(OPERATION_ID);

        const result = operation.schema.safeParse({
            workspace: "acme",
            repo_slug: "mobile-app",
            pull_request_id: 0
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            const issue = result.error.issues.find((candidate) => candidate.path.join(".") === "pull_request_id");
            expect(issue).toBeDefined();
            expect(issue?.message.toLowerCase()).toContain("greater than or equal to 1");
        }
    });
});
