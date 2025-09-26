import type { ZodError } from 'zod';

import { OperationRegistry } from '../lib/operations';

const formatZodError = (error: ZodError): string =>
  error.errors.map((issue) => issue.message).join(', ');

export class ExecutionService {
  constructor(private readonly registry: OperationRegistry) {}

  async execute(operationId: string, payload: unknown): Promise<unknown> {
    const definition = this.registry.get(operationId);
    if (!definition) {
      throw new Error(`Operation ${operationId} not found`);
    }

    const parsed = definition.input.safeParse(payload);
    if (!parsed.success) {
      const message = formatZodError(parsed.error as ZodError);
      throw new Error(`Invalid payload for operation ${operationId}: ${message}`);
    }

    const handled = await definition.handler(parsed.data);
    const result = definition.output.safeParse(handled);
    if (!result.success) {
      const message = formatZodError(result.error as ZodError);
      throw new Error(`Invalid response from operation ${operationId}: ${message}`);
    }

    return result.data;
  }
}
