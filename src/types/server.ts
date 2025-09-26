import { z } from "zod";

export const BitbucketServerInfoSchema = z
    .object({
        version: z.string().min(1),
        type: z.string().min(1)
    })
    .strict();

export type BitbucketServerInfo = z.infer<typeof BitbucketServerInfoSchema>;

export const ServerStateSchema = z
    .object({
        isRunning: z.boolean().default(false),
        bitbucketConnected: z.boolean().default(false),
        bitbucketServerInfo: BitbucketServerInfoSchema.nullable().default(null),
        degradedMode: z.boolean().default(false)
    })
    .strict();

export type ServerState = z.infer<typeof ServerStateSchema>;
