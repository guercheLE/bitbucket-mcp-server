import { z } from 'zod';

import { listPullRequestActivitiesOperation } from '../tools/operations/pull-requests/activities';
import { approvePullRequestOperation } from '../tools/operations/pull-requests/approve';
import { createPullRequestCommentOperation } from '../tools/operations/pull-requests/comments/create';
import { listPullRequestCommentsOperation } from '../tools/operations/pull-requests/comments/list';
import { listPullRequestCommitsOperation } from '../tools/operations/pull-requests/commits';
import { createPullRequestOperation } from '../tools/operations/pull-requests/create';
import { declinePullRequestOperation } from '../tools/operations/pull-requests/decline';
import { getPullRequestDiffOperation } from '../tools/operations/pull-requests/diff';
import { getPullRequestOperation } from '../tools/operations/pull-requests/get';
import { listPullRequestsOperation } from '../tools/operations/pull-requests/list';
import { mergePullRequestOperation } from '../tools/operations/pull-requests/merge';
import { unapprovePullRequestOperation } from '../tools/operations/pull-requests/unapprove';
import { updatePullRequestOperation } from '../tools/operations/pull-requests/update';
import { createRepositoryOperation } from '../tools/operations/repositories/create';
import { getRepositoryOperation } from '../tools/operations/repositories/get';
import { listRepositoriesOperation } from '../tools/operations/repositories/list';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface OperationContract {
  id: string;
  method: HttpMethod;
  path: string;
  description: string;
  schema: z.ZodTypeAny;
}

const operations: OperationContract[] = [
  listRepositoriesOperation,
  getRepositoryOperation,
  createRepositoryOperation,
  listPullRequestsOperation,
  getPullRequestOperation,
  createPullRequestOperation,
  mergePullRequestOperation,
  approvePullRequestOperation,
  declinePullRequestOperation,
  unapprovePullRequestOperation,
  updatePullRequestOperation,
  listPullRequestActivitiesOperation,
  listPullRequestCommitsOperation,
  listPullRequestCommentsOperation,
  createPullRequestCommentOperation,
  getPullRequestDiffOperation,
  {
    id: 'GET /rest/api/1.0/projects',
    method: 'GET',
    path: '/rest/api/1.0/projects',
    description: 'Get a list of projects.',
    schema: z.object({}),
  },
  {
    id: 'GET /rest/api/1.0/projects/{projectKey}/repos',
    method: 'GET',
    path: '/rest/api/1.0/projects/{projectKey}/repos',
    description: 'Get a list of repositories within a project.',
    schema: z.object({
      projectKey: z.string().min(1),
    }),
  },
  {
    id: 'GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests',
    method: 'GET',
    path: '/rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests',
    description: 'List pull requests for a repository.',
    schema: z.object({
      projectKey: z.string().min(1),
      repositorySlug: z.string().min(1),
    }),
  },
];

export const OPERATION_CONTRACTS: ReadonlyMap<string, OperationContract> = new Map(
  operations.map((operation) => [operation.id, operation]),
);

export const SUPPORTED_OPERATION_IDS = Array.from(OPERATION_CONTRACTS.keys());
