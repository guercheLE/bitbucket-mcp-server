import { z } from "zod";

import type { OperationContract } from "../../../contracts/operations";

const workspaceParameter = z.string({ description: "The workspace ID or slug." }).min(1);
const repoSlugParameter = z.string({ description: "The repository slug." }).min(1);
const branchName = z.string({ description: "The branch name." }).min(1);
const repositoryFullName = z.string({ description: "The full repository name (e.g. workspace/repo)." }).min(1);
const reviewerSchema = z.object({
    uuid: z.string({ description: "Reviewer UUID." }).min(1)
});

const branchSchema = z.object({
    name: branchName
});

const pullRequestBodySchema = z.object({
    title: z.string({ description: "Title for the pull request." }).min(1),
    source: z.object({
        branch: branchSchema,
        repository: z
            .object({
                full_name: repositoryFullName
            })
            .optional()
    }),
    destination: z.object({
        branch: branchSchema,
        repository: z
            .object({
                full_name: repositoryFullName
            })
            .optional()
    }),
    description: z.string().optional(),
    close_source_branch: z.boolean().optional(),
    reviewers: z.array(reviewerSchema).max(10).optional()
});

export const createPullRequestOperation: OperationContract = {
    id: "bitbucket.pull-requests.create",
    method: "POST",
    path: "/2.0/repositories/{workspace}/{repo_slug}/pullrequests",
    description: "Create a pull request from a source branch to a destination branch.",
    schema: z.object({
        workspace: workspaceParameter,
        repo_slug: repoSlugParameter,
        body: pullRequestBodySchema
    })
};
