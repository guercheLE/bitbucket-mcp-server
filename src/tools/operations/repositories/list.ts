import { z } from "zod";

import type { OperationContract } from "../../../contracts/operations";
import { withBitbucketPagination } from "../../../utils/pagination";

const workspaceParameter = z.string({ description: "The workspace ID or slug." }).min(1);

export const listRepositoriesOperation: OperationContract = {
    id: "bitbucket.repositories.list",
    method: "GET",
    path: "/2.0/repositories/{workspace}",
    description: "Returns a paginated list of repositories within the specified workspace.",
    schema: withBitbucketPagination({
        workspace: workspaceParameter,
        q: z.string().optional(),
        sort: z.string().optional()
    })
};
