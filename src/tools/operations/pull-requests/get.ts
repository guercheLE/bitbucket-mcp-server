import { z } from 'zod';

import type { OperationContract } from '../../../contracts/operations';

const workspaceParameter = z.string({ description: 'The workspace ID or slug.' }).min(1);
const repoSlugParameter = z.string({ description: 'The repository slug.' }).min(1);
const pullRequestIdParameter = z
  .number({ description: 'The numeric identifier of the pull request.' })
  .int()
  .min(1);

export const getPullRequestOperation: OperationContract = {
  id: 'bitbucket.pull-requests.get',
  method: 'GET',
  path: '/2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}',
  description: 'Retrieve metadata for a single pull request.',
  schema: z.object({
    workspace: workspaceParameter,
    repo_slug: repoSlugParameter,
    pull_request_id: pullRequestIdParameter,
    fields: z.string().optional(),
  }),
};
