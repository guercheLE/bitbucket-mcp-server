import { z } from 'zod';

import type { OperationContract } from '../../../contracts/operations';

const workspaceParameter = z.string({ description: 'The workspace ID or slug.' }).min(1);
const repositorySlugParameter = z.string({ description: 'Repository slug.' }).min(1);

export const getRepositoryOperation: OperationContract = {
  id: 'bitbucket.repositories.get',
  method: 'GET',
  path: '/2.0/repositories/{workspace}/{repo_slug}',
  description:
    'Fetches metadata for a single repository including project details, links, and permissions.',
  schema: z.object({
    workspace: workspaceParameter,
    repo_slug: repositorySlugParameter,
    fields: z.string().optional(),
  }),
};
