import { z } from "zod";

import type { OperationContract } from "../../../contracts/operations";
import { withBitbucketPagination } from "../../../utils/pagination";

const workspaceParameter = z.string({ description: "The workspace ID or slug." }).min(1);
const repoSlugParameter = z.string({ description: "The repository slug." }).min(1);
const pullRequestState = z.enum(["OPEN", "MERGED", "DECLINED", "SUPERSEDED"], {
    description: "Filter results to pull requests in a specific state."
});

export const listPullRequestsOperation: OperationContract = {
    id: "bitbucket.pull-requests.list",
    method: "GET",
    path: "/2.0/repositories/{workspace}/{repo_slug}/pullrequests",
    description: "Returns a paginated list of pull requests for a repository.",
    schema: withBitbucketPagination({
        workspace: workspaceParameter,
        repo_slug: repoSlugParameter,
        state: pullRequestState.optional(),
        q: z.string().optional(),
        sort: z.string().optional()
    })
};
