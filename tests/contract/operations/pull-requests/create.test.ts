import type { ZodIssue } from "zod";

import { SchemaService } from "../../../../src/services/SchemaService";

const OPERATION_ID = "bitbucket.pull-requests.create";

describe("bitbucket.pull-requests.create contract", () => {
    const buildService = () => new SchemaService();

    it("describes the REST operation metadata", async () => {
        const service = buildService();
        const operation = await service.getOperation(OPERATION_ID);

        expect(operation.method).toBe("POST");
        expect(operation.path).toBe("/2.0/repositories/{workspace}/{repo_slug}/pullrequests");
        expect(operation.description.toLowerCase()).toContain("create");
    });

    it("requires workspace, repo_slug and body", async () => {
        const service = buildService();
        const operation = await service.getOperation(OPERATION_ID);

        const result = operation.schema.safeParse({});
        expect(result.success).toBe(false);
        if (!result.success) {
            const missingPaths = result.error.issues.map((issue: ZodIssue) => issue.path.join("."));
            expect(missingPaths).toEqual(expect.arrayContaining(["workspace", "repo_slug", "body"]));
        }
    });

    it("accepts a valid create payload", async () => {
        const service = buildService();
        const operation = await service.getOperation(OPERATION_ID);

        const payload = {
            workspace: "acme",
            repo_slug: "mobile-app",
            body: {
                title: "Feature: add payment flow",
                description: "Implements the payment feature.",
                close_source_branch: true,
                source: {
                    branch: {
                        name: "feature/payment"
                    },
                    repository: {
                        full_name: "acme/mobile-app"
                    }
                },
                destination: {
                    branch: {
                        name: "main"
                    }
                },
                reviewers: [
                    { uuid: "{a1b2}" },
                    { uuid: "{c3d4}" }
                ]
            }
        };

        await expect(operation.schema.parseAsync(payload)).resolves.toEqual(payload);
    });

    it("rejects a payload missing required source branch name", async () => {
        const service = buildService();
        const operation = await service.getOperation(OPERATION_ID);

        const result = operation.schema.safeParse({
            workspace: "acme",
            repo_slug: "mobile-app",
            body: {
                title: "Missing source branch",
                source: {
                    branch: {}
                },
                destination: {
                    branch: {
                        name: "main"
                    }
                }
            }
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            const issue = result.error.issues.find((candidate) => candidate.path.join(".") === "body.source.branch.name");
            expect(issue).toBeDefined();
            expect(issue?.message.toLowerCase()).toContain("required");
        }
    });
});
