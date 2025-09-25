import { z } from 'zod';

export const SearchIdsParams = z.object({
    query: z.string().describe('The natural language query for the Bitbucket operation.'),
});

export const SearchIdsResponse = z.array(z.object({
    id: z.string().describe('The operation ID.'),
    description: z.string().describe('A short description of the operation.'),
    score: z.number().describe('The similarity score.'),
}));
