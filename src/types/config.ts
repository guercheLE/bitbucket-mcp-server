import { z } from "zod";

export const ServerConfigSchema = z
    .object({
        port: z.number().int().min(0).max(65535),
        logLevel: z.enum(["error", "warn", "info", "http", "verbose", "debug", "silly"]).default("info")
    })
    .strict();

export type ServerConfig = z.infer<typeof ServerConfigSchema>;

export const BitbucketCredentialsSchema = z
    .object({
        host: z.string().url(),
        username: z.string().min(1),
        password: z.string().min(1)
    })
    .strict();

export type BitbucketCredentials = z.infer<typeof BitbucketCredentialsSchema>;
