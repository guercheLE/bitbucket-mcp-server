import { z } from "zod";

/**
 * Zod schema describing the Bitbucket API operation source objects that feed the embedding pipeline.
 * Each record represents a single REST operation and includes everything required to produce a high-quality embedding.
 */
export const ApiOperationSourceSchema = z.object({
    id: z.string(),
    operationName: z.string(),
    summary: z.string().optional(),
    endpoint: z.string(),
    type: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
    tags: z.array(z.string()),
    description: z.string(),
    compatibility: z
        .object({
            cloud: z.boolean().optional(),
            dataCenter: z.union([z.boolean(), z.string()]).optional()
        })
        .default({ cloud: true }),
    documentationUrl: z.string().url().optional(),
    inputSchema: z.record(z.string(), z.any()).optional(),
    outputSchema: z.record(z.string(), z.any()).optional(),
    errorSchema: z.record(z.string(), z.any()).optional(),
    samples: z.string().optional()
});

export type ApiOperationSource = z.infer<typeof ApiOperationSourceSchema>;

/**
 * Helper schema that validates arrays of API operation sources.
 */
export const ApiOperationSourceCollectionSchema = z.array(ApiOperationSourceSchema);
