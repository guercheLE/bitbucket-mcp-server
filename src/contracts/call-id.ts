import { z } from "zod";

export const CallIdParams = z.object({
    id: z.string().describe("The operation ID to call."),
    parameters: z.record(z.any()).default({}).describe("The parameters for the API call."),
});

export const CallIdResponse = z.any().describe("The response from the Bitbucket API.");

export type CallIdParamsInput = z.input<typeof CallIdParams>;
export type CallIdParamsOutput = z.output<typeof CallIdParams>;
