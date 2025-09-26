import { z } from 'zod';

import type { OperationContract } from '../../../contracts/operations';
import { withBitbucketPagination } from '../../../utils/pagination';

const workspaceParameter = z.string({ description: 'The workspace ID or slug.' }).min(1);
const repoSlugParameter = z.string({ description: 'The repository slug.' }).min(1);
const pullRequestIdParameter = z
  .number({ description: 'The numeric identifier of the pull request.' })
  .int()
  .min(1);

export const listPullRequestActivitiesOperation: OperationContract = {
  id: 'bitbucket.pull-requests.activities',
  method: 'GET',
  path: '/2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/activities',
  description: 'Retrieve the activity stream for a pull request.',
  schema: withBitbucketPagination({
    workspace: workspaceParameter,
    repo_slug: repoSlugParameter,
    pull_request_id: pullRequestIdParameter,
  }),
};
