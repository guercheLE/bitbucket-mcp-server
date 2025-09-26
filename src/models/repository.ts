import { z } from "zod";

import { ProjectSchema } from "./project";

export const RepositorySchema = z.object({
    slug: z.string().min(1, "Repository slug is required"),
    name: z.string().min(1, "Repository name is required"),
    project: ProjectSchema
});

export type Repository = z.infer<typeof RepositorySchema>;
