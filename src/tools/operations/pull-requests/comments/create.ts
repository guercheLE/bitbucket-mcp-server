import { z } from "zod";

import type { OperationContract } from "../../../../contracts/operations";

const workspaceParameter = z.string({ description: "The workspace ID or slug." }).min(1);
const repoSlugParameter = z.string({ description: "The repository slug." }).min(1);
const pullRequestIdParameter = z
    .number({ description: "The numeric identifier of the pull request." })
    .int()
    .min(1);
const parentIdParameter = z
    .number({ description: "Identifier of the parent comment when replying." })
    .int()
    .min(1);

const rawContentParameter = z
    .string({ description: "Markdown content of the comment." })
    .min(1);

const contentParameter = z
    .union([
        z.object({
            raw: rawContentParameter
        }),
        z.null()
    ])
    .transform((value, ctx) => {
        if (value === null) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Required",
                path: []
            });
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Required",
                path: ["raw"]
            });
        }
        return value;
    })
    .pipe(
        z.object({
            raw: rawContentParameter
        })
    );

const inlineParameter = z.object({
    path: z.string({ description: "The file path in the pull request diff." }).min(1),
    from: z
        .number({ description: "Optional source line number for the inline comment." })
        .int()
        .min(0)
        .optional(),
    to: z
        .number({ description: "Optional destination line number for the inline comment." })
        .int()
        .min(0)
        .optional(),
    line_type: z
        .enum(["ADDED", "REMOVED", "CONTEXT"], {
            description: "Type of diff line the comment targets."
        })
        .optional()
});

const preprocessMissingContent = (input: unknown) => {
    if (typeof input !== "object" || input === null) {
        return input;
    }

    const data = input as Record<string, unknown>;
    if (Object.prototype.hasOwnProperty.call(data, "content")) {
        return input;
    }

    return {
        ...data,
        content: null
    };
};

export const createPullRequestCommentOperation: OperationContract = {
    id: "bitbucket.pull-requests.comments.create",
    method: "POST",
    path: "/2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/comments",
    description: "Create a comment on a pull request, optionally targeting a specific diff line.",
    schema: z
        .preprocess(
            preprocessMissingContent,
            z
                .object({
                    workspace: workspaceParameter,
                    repo_slug: repoSlugParameter,
                    pull_request_id: pullRequestIdParameter,
                    parent_id: parentIdParameter.optional(),
                    content: contentParameter,
                    inline: inlineParameter.optional()
                })
        )
};
