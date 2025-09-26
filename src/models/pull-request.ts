import { z } from 'zod';

import { BranchSchema } from './branch';
import { UserSchema } from './user';

const LinkSchema = z.object({
  href: z.string().min(1, 'Link href is required'),
  name: z.string().optional(),
});

const LinksSchema = z
  .object({})
  .catchall(z.union([LinkSchema, z.array(LinkSchema), z.string(), z.null()]))
  .default({});

export const PullRequestSchema = z.object({
  id: z.number().int('Pull request id must be an integer'),
  title: z.string().min(1, 'Pull request title is required'),
  description: z.string().optional(),
  state: z.string().min(1, 'Pull request state is required'),
  author: UserSchema,
  fromRef: BranchSchema,
  toRef: BranchSchema,
  createdDate: z.number().int('Created date must be a timestamp'),
  updatedDate: z.number().int('Updated date must be a timestamp'),
  links: LinksSchema,
});

export type PullRequest = z.infer<typeof PullRequestSchema>;
