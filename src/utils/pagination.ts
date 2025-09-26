import { z, type ZodRawShape } from "zod";

const bitbucketPageParameter = z.string({ description: "Opaque cursor identifying the results page." });

const bitbucketPageLenParameter = z
    .number({ description: "Number of results per page." })
    .int()
    .min(1)
    .max(100);

export const bitbucketPaginationShape = {
    page: bitbucketPageParameter.optional(),
    pagelen: bitbucketPageLenParameter.optional()
} as const;

export const bitbucketPaginationSchema = z.object(bitbucketPaginationShape);

export type BitbucketPaginationParams = z.infer<typeof bitbucketPaginationSchema>;

const mcpPaginationSchema = z.object({
    cursor: bitbucketPageParameter.optional(),
    limit: bitbucketPageLenParameter.optional()
});

export type McpPaginationParams = z.infer<typeof mcpPaginationSchema>;

export type PaginationInput = Partial<McpPaginationParams & BitbucketPaginationParams>;

const normalizationSchema = z
    .object({
        cursor: bitbucketPageParameter.optional(),
        limit: bitbucketPageLenParameter.optional(),
        page: bitbucketPageParameter.optional(),
        pagelen: bitbucketPageLenParameter.optional()
    })
    .partial();

export const normalizePaginationParams = (
    params?: PaginationInput
): BitbucketPaginationParams => {
    if (!params) {
        return {};
    }

    const parsed = normalizationSchema.parse(params);

    const page = parsed.page ?? parsed.cursor;
    const pagelen = parsed.pagelen ?? parsed.limit;

    const result: BitbucketPaginationParams = {};
    if (typeof page === "string" && page.length > 0) {
        result.page = page;
    }
    if (typeof pagelen === "number") {
        result.pagelen = pagelen;
    }

    return result;
};

export const withBitbucketPagination = <Shape extends ZodRawShape>(shape: Shape) =>
    z.object({
        ...shape,
        ...bitbucketPaginationShape
    });
