import { z } from 'zod';

import type { OperationContract } from '../../../contracts/operations';

const workspaceParameter = z.string({ description: 'The workspace ID or slug.' }).min(1);
const repoSlugParameter = z.string({ description: 'The repository slug.' }).min(1);
const pullRequestIdParameter = z
  .number({ description: 'The numeric identifier of the pull request.' })
  .int()
  .min(1);

const titleParameter = z.string({ description: 'Updated title for the pull request.' }).min(1);
const descriptionParameter = z
  .string({ description: 'Updated description for the pull request.' })
  .min(1);
const closeSourceBranchParameter = z.boolean({
  description: 'Whether the source branch should be closed after merging.',
});

const destinationParameter = z
  .object({
    branch: z
      .object({
        name: z.string({ description: 'The destination branch name.' }).min(1),
      })
      .optional(),
    commit: z
      .object({
        hash: z.string({ description: 'Optional commit hash for the destination.' }).min(1),
      })
      .optional(),
  })
  .refine((value) => Boolean(value.branch || value.commit), {
    message: 'Destination must include branch or commit information.',
  });

const reviewerParameter = z.object({
  uuid: z.string({ description: 'UUID of the reviewer.' }).min(1),
});

const schema = z
  .object({
    workspace: workspaceParameter,
    repo_slug: repoSlugParameter,
    pull_request_id: pullRequestIdParameter,
    title: titleParameter.optional(),
    description: descriptionParameter.optional(),
    close_source_branch: closeSourceBranchParameter.optional(),
    destination: destinationParameter.optional(),
    reviewers: z.array(reviewerParameter).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.title === undefined &&
      data.description === undefined &&
      data.close_source_branch === undefined &&
      data.destination === undefined &&
      data.reviewers === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'You must provide at least one field to update the pull request.',
        path: [],
      });
    }
  });

export const updatePullRequestOperation: OperationContract = {
  id: 'bitbucket.pull-requests.update',
  method: 'PUT',
  path: '/2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}',
  description: 'Update metadata for an existing pull request.',
  schema,
};
