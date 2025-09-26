import type { ZodIssue } from "zod";

import { SchemaService } from "../../../../src/services/SchemaService";

const OPERATION_ID = "bitbucket.repositories.create";

describe("bitbucket.repositories.create contract", () => {
    const buildService = () => new SchemaService();

    it("describes the REST operation metadata", async () => {
        const service = buildService();
        const operation = await service.getOperation(OPERATION_ID);

        expect(operation.method).toBe("POST");
        expect(operation.path).toBe("/2.0/repositories/{workspace}/{repo_slug}");
        expect(operation.description).toContain("Creates a new repository");
    });

    it("requires workspace, repo_slug, and body parameters", async () => {
        const service = buildService();
        const operation = await service.getOperation(OPERATION_ID);

        const result = operation.schema.safeParse({});
        expect(result.success).toBe(false);
        if (!result.success) {
            const missing = result.error.issues.map((issue: ZodIssue) => issue.path.join("."));
            expect(missing).toEqual(expect.arrayContaining(["workspace", "repo_slug", "body"]));
        }
    });

    it("enforces SCM selection within body", async () => {
        const service = buildService();
        const operation = await service.getOperation(OPERATION_ID);

        const payload = {
            workspace: "acme",
            repo_slug: "design-system",
            body: {
                scm: "git",
                is_private: true,
                project: { key: "MKT" },
                description: "Design system repository"
            }
        } as const;

        await expect(operation.schema.parseAsync(payload)).resolves.toEqual(payload);

        const missingScm = operation.schema.safeParse({
            workspace: "acme",
            repo_slug: "design-system",
            body: {}
        });
        expect(missingScm.success).toBe(false);
        if (!missingScm.success) {
            const issues = missingScm.error.issues.map((issue: ZodIssue) => issue.path.join("."));
            expect(issues).toContain("body.scm");
        }
    });
});
