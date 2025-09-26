import { z } from "zod";

import type { OperationContract } from "../../../contracts/operations";

const workspaceParameter = z.string({ description: "The workspace ID or slug." }).min(1);
const repoSlugParameter = z.string({ description: "The repository slug." }).min(1);
const pullRequestIdParameter = z
    .number({ description: "The numeric identifier of the pull request." })
    .int()
    .min(1);

const pathParameter = z.string({ description: "Restrict the diff to a specific file path." }).min(1);
const ignoreWhitespaceParameter = z.boolean({ description: "Whether to ignore whitespace-only changes." });
const mergeCommitParameter = z.boolean({ description: "Include the synthetic merge commit diff." });

export const getPullRequestDiffOperation: OperationContract = {
    id: "bitbucket.pull-requests.diff",
    method: "GET",
    path: "/2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/diff",
    description: "Retrieve the aggregated diff for a pull request.",
    schema: z.object({
        workspace: workspaceParameter,
        repo_slug: repoSlugParameter,
        pull_request_id: pullRequestIdParameter,
        path: pathParameter.optional(),
        ignore_whitespace: ignoreWhitespaceParameter.optional(),
        merge_commit: mergeCommitParameter.optional()
    })
};
