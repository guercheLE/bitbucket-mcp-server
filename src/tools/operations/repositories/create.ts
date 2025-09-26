import { z } from 'zod';

import type { OperationContract } from '../../../contracts/operations';

const workspaceParameter = z.string({ description: 'The workspace ID or slug.' }).min(1);
const repositorySlugParameter = z.string({ description: 'Repository slug.' }).min(1);

const requestBodySchema = z.object({
  scm: z.enum(['git', 'hg']),
  is_private: z.boolean().optional(),
  project: z
    .object({
      key: z.string().optional(),
    })
    .optional(),
  description: z.string().optional(),
});

export const createRepositoryOperation: OperationContract = {
  id: 'bitbucket.repositories.create',
  method: 'POST',
  path: '/2.0/repositories/{workspace}/{repo_slug}',
  description: 'Creates a new repository in the specified workspace.',
  schema: z.object({
    workspace: workspaceParameter,
    repo_slug: repositorySlugParameter,
    body: requestBodySchema,
  }),
};
