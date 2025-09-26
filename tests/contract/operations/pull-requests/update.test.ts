import type { ZodIssue } from "zod";

import { SchemaService } from "../../../../src/services/SchemaService";

const OPERATION_ID = "bitbucket.pull-requests.update";

describe("bitbucket.pull-requests.update contract", () => {
    const buildService = () => new SchemaService();

    it("describes the REST operation metadata", async () => {
        const service = buildService();
        const operation = await service.getOperation(OPERATION_ID);

        expect(operation.method).toBe("PUT");
        expect(operation.path).toBe(
            "/2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}"
        );
        expect(operation.description.toLowerCase()).toContain("update");
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

    it("accepts updating only the title", async () => {
        const service = buildService();
        const operation = await service.getOperation(OPERATION_ID);

        const payload = {
            workspace: "acme",
            repo_slug: "mobile-app",
            pull_request_id: 42,
            title: "Adjust feature flag defaults"
        };

        await expect(operation.schema.parseAsync(payload)).resolves.toEqual(payload);
    });

    it("accepts updating reviewers and destination", async () => {
        const service = buildService();
        const operation = await service.getOperation(OPERATION_ID);

        const payload = {
            workspace: "acme",
            repo_slug: "mobile-app",
            pull_request_id: 42,
            description: "Update reviewers and retarget the pull request.",
            reviewers: [{ uuid: "{1234-5678}" }],
            destination: {
                branch: {
                    name: "release/1.2.0"
                }
            },
            close_source_branch: true
        };

        await expect(operation.schema.parseAsync(payload)).resolves.toEqual(payload);
    });

    it("rejects updates without any change fields", async () => {
        const service = buildService();
        const operation = await service.getOperation(OPERATION_ID);

        const result = operation.schema.safeParse({
            workspace: "acme",
            repo_slug: "mobile-app",
            pull_request_id: 42
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues.some((issue) => issue.message.toLowerCase().includes("provide"))).toBe(true);
        }
    });
});
