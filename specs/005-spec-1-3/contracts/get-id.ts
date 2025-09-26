import { z } from 'zod';

export const GetIdParams = z.object({
  id: z.string().describe('The operation ID to retrieve the schema for.'),
});

// The response is a dynamic Zod schema, which can't be easily represented
// in a static Zod type. The actual implementation will return a Zod schema object.
export const GetIdResponse = z.any().describe('The Zod schema for the requested operation ID.');
