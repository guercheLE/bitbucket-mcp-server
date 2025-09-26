import { z } from 'zod';

import type { OperationContract } from '../../../contracts/operations';

const workspaceParameter = z.string({ description: 'The workspace ID or slug.' }).min(1);
const repoSlugParameter = z.string({ description: 'The repository slug.' }).min(1);
const pullRequestIdParameter = z
  .number({ description: 'The numeric identifier of the pull request.' })
  .int()
  .min(1);

const mergeStrategy = z.enum(['merge_commit', 'squash', 'fast_forward', 'rebase_merge'], {
  description: 'Strategy Bitbucket should use when merging the pull request.',
});

const mergeBodySchema = z.object({
  message: z.string({ description: 'Commit message for the merge.' }).optional(),
  close_source_branch: z
    .boolean({ description: 'Close the source branch after merging.' })
    .optional(),
  merge_strategy: mergeStrategy.optional(),
  user: z
    .object({
      uuid: z.string({ description: 'UUID of the acting user.' }).min(1),
    })
    .optional(),
});

export const mergePullRequestOperation: OperationContract = {
  id: 'bitbucket.pull-requests.merge',
  method: 'POST',
  path: '/2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/merge',
  description: 'Merge a pull request into the destination branch.',
  schema: z.object({
    workspace: workspaceParameter,
    repo_slug: repoSlugParameter,
    pull_request_id: pullRequestIdParameter,
    body: mergeBodySchema,
  }),
};
