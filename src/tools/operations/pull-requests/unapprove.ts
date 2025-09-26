import { z } from 'zod';

import type { OperationContract } from '../../../contracts/operations';

const workspaceParameter = z.string({ description: 'The workspace ID or slug.' }).min(1);
const repoSlugParameter = z.string({ description: 'The repository slug.' }).min(1);
const pullRequestIdParameter = z
  .number({ description: 'The numeric identifier of the pull request.' })
  .int()
  .min(1);

export const unapprovePullRequestOperation: OperationContract = {
  id: 'bitbucket.pull-requests.unapprove',
  method: 'DELETE',
  path: '/2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/approve',
  description: "Remove the authenticated user's approval from a pull request.",
  schema: z.object({
    workspace: workspaceParameter,
    repo_slug: repoSlugParameter,
    pull_request_id: pullRequestIdParameter,
  }),
};
