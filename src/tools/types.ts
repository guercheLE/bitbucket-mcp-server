import type { z } from 'zod';

export interface ToolConfig<TParams extends z.ZodTypeAny> {
  title: string;
  description: string;
  inputSchema: TParams;
}

export interface ToolRegistration<TParams extends z.ZodTypeAny, TResult> {
  name: string;
  config: ToolConfig<TParams>;
  outputSchema: z.ZodTypeAny;
  handler: (params: z.infer<TParams>) => Promise<TResult>;
}
