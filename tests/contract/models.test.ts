import { ProjectSchema } from "../../src/models/project";
import { PullRequestSchema } from "../../src/models/pull-request";
import { RepositorySchema } from "../../src/models/repository";

const baseProject = {
    key: "PROJ",
    name: "Core Project"
};

const baseRepository = {
    slug: "service-repo",
    name: "Service Repo",
    project: baseProject
};

const baseBranch = {
    id: "refs/heads/main",
    displayId: "main",
    latestCommit: "abcdef1234567890",
    repository: baseRepository
};

const baseUser = {
    name: "jane",
    emailAddress: "jane@example.com",
    displayName: "Jane Doe"
};

const validPullRequest = {
    id: 42,
    title: "Add semantic discovery tools",
    description: "Implements the MVP tools for discovery.",
    state: "OPEN",
    author: baseUser,
    fromRef: baseBranch,
    toRef: baseBranch,
    createdDate: Date.now(),
    updatedDate: Date.now(),
    links: {
        self: [
            {
                href: "https://bitbucket.example.com/projects/PROJ/repos/service-repo/pull-requests/42"
            }
        ]
    }
};

describe("PullRequestSchema contract", () => {
    it("accepts a valid pull request payload", () => {
        const result = PullRequestSchema.safeParse(validPullRequest);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.title).toBe(validPullRequest.title);
        }
    });

    it("rejects payloads with invalid email addresses", () => {
        const invalidUser = { ...baseUser, emailAddress: "invalid-email" };
        const invalid = {
            ...validPullRequest,
            author: invalidUser
        };
        const result = PullRequestSchema.safeParse(invalid);
        expect(result.success).toBe(false);
    });

    it("rejects payloads with non-integer identifiers", () => {
        const invalid = {
            ...validPullRequest,
            id: 12.5
        };
        const result = PullRequestSchema.safeParse(invalid);
        expect(result.success).toBe(false);
    });
});

describe("Auxiliary schemas", () => {
    it("validates repository references", () => {
        const repository = RepositorySchema.safeParse(baseRepository);
        expect(repository.success).toBe(true);
    });

    it("rejects project payloads without names", () => {
        const project = ProjectSchema.safeParse({ key: "PRJ", name: "" });
        expect(project.success).toBe(false);
    });
});
