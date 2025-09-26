import { z } from "zod";

export const ProjectSchema = z.object({
    key: z.string().min(1, "Project key is required"),
    name: z.string().min(1, "Project name is required")
});

export type Project = z.infer<typeof ProjectSchema>;
