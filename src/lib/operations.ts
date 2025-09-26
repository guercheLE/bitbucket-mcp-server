import type { z, ZodTypeAny } from 'zod';

export type OperationHandler<I extends ZodTypeAny, O extends ZodTypeAny> = (
  payload: z.infer<I>,
) => Promise<z.infer<O>>;

export interface OperationDefinition<
  I extends ZodTypeAny = ZodTypeAny,
  O extends ZodTypeAny = ZodTypeAny,
> {
  id: string;
  summary: string;
  description: string;
  input: I;
  output: O;
  handler: OperationHandler<I, O>;
  tags?: string[];
}

export interface OperationMetadata {
  id: string;
  summary: string;
  description: string;
  input: ZodTypeAny;
  output: ZodTypeAny;
  tags: string[];
}

export class OperationRegistry {
  private readonly operations = new Map<string, OperationDefinition>();

  register(definition: OperationDefinition): void {
    this.operations.set(definition.id, definition);
  }

  list(): OperationDefinition[] {
    return Array.from(this.operations.values());
  }

  get(id: string): OperationDefinition | undefined {
    return this.operations.get(id);
  }

  ensure(id: string): OperationDefinition {
    const operation = this.operations.get(id);
    if (!operation) {
      throw new Error(`Operation ${id} not found`);
    }
    return operation;
  }
}

export interface SearchableOperation {
  id: string;
  summary: string;
  description: string;
  tags: string[];
}

export const registryToSearchable = (operations: OperationDefinition[]): SearchableOperation[] =>
  operations.map(({ id, summary, description, tags = [] }) => ({ id, summary, description, tags }));
