import { z } from 'zod';

import { RepositorySchema } from './repository';

export const BranchSchema = z.object({
  id: z.string().min(1, 'Branch id is required'),
  displayId: z.string().min(1, 'Branch displayId is required'),
  latestCommit: z.string().min(1, 'Latest commit hash is required'),
  repository: RepositorySchema,
});

export type Branch = z.infer<typeof BranchSchema>;
