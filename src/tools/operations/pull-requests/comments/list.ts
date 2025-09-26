import { z } from 'zod';

import type { OperationContract } from '../../../../contracts/operations';
import { withBitbucketPagination } from '../../../../utils/pagination';

const workspaceParameter = z.string({ description: 'The workspace ID or slug.' }).min(1);
const repoSlugParameter = z.string({ description: 'The repository slug.' }).min(1);
const pullRequestIdParameter = z
  .number({ description: 'The numeric identifier of the pull request.' })
  .int()
  .min(1);

const sortParameter = z.string({ description: "Optional sort field, e.g. '-created_on'." });
const queryParameter = z.string({ description: 'Bitbucket query string to filter comments.' });

export const listPullRequestCommentsOperation: OperationContract = {
  id: 'bitbucket.pull-requests.comments.list',
  method: 'GET',
  path: '/2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/comments',
  description: 'List comments on a pull request with optional filtering and pagination.',
  schema: withBitbucketPagination({
    workspace: workspaceParameter,
    repo_slug: repoSlugParameter,
    pull_request_id: pullRequestIdParameter,
    sort: sortParameter.optional(),
    q: queryParameter.optional(),
  }),
};
