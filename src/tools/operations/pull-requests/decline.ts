import { z } from "zod";

import type { OperationContract } from "../../../contracts/operations";

const workspaceParameter = z.string({ description: "The workspace ID or slug." }).min(1);
const repoSlugParameter = z.string({ description: "The repository slug." }).min(1);
const pullRequestIdParameter = z
    .number({ description: "The numeric identifier of the pull request." })
    .int()
    .min(1);
const declineMessageParameter = z
    .string({ description: "Optional message describing why the pull request is being declined." })
    .min(1)
    .optional();
const closeSourceBranchParameter = z
    .boolean({ description: "Whether to automatically close the source branch after declining." })
    .optional();

export const declinePullRequestOperation: OperationContract = {
    id: "bitbucket.pull-requests.decline",
    method: "POST",
    path: "/2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/decline",
    description: "Decline a pull request and optionally close the source branch.",
    schema: z.object({
        workspace: workspaceParameter,
        repo_slug: repoSlugParameter,
        pull_request_id: pullRequestIdParameter,
        message: declineMessageParameter,
        close_source_branch: closeSourceBranchParameter
    })
};
