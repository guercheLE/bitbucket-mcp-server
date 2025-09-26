import { z } from 'zod';

export const SearchIdsParams = z.object({
  query: z.string().describe('The natural language query for the Bitbucket operation.'),
  limit: z
    .number()
    .int()
    .positive()
    .max(50)
    .optional()
    .describe('Maximum number of results to return. Defaults to 10.'),
});

export const SearchIdsResponse = z.array(
  z.object({
    id: z.string().describe('The operation ID.'),
    description: z.string().describe('A short description of the operation.'),
    score: z.number().describe('The similarity score.'),
  }),
);

export type SearchIdsParamsInput = z.input<typeof SearchIdsParams>;
export type SearchIdsResponseOutput = z.output<typeof SearchIdsResponse>;
