import { z } from 'zod';

export const GetIdParams = z.object({
  id: z.string().describe('The operation ID to retrieve the schema for.'),
});

export const GetIdResponse = z.any().describe('The Zod schema for the requested operation ID.');

export type GetIdParamsInput = z.input<typeof GetIdParams>;
