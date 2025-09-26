import { z } from 'zod';

import type { OperationContract } from '../contracts/operations';
import { OPERATION_CONTRACTS } from '../contracts/operations';
import type { Logger } from '../utils/logger';
import { createLogger } from '../utils/logger';

/**
 * Error thrown when an operation contract or schema cannot be located.
 */
export class SchemaNotFoundError extends Error {
  constructor(id: string) {
    super(`Schema not found for operation ${id}`);
    this.name = 'SchemaNotFoundError';
  }
}
/**
 * Configuration options for {@link SchemaService}.
 */
export interface SchemaServiceOptions {
  logger?: Pick<Logger, 'debug' | 'info' | 'warn' | 'error'>;
  contracts?: ReadonlyMap<string, OperationContract>;
}
/**
 * Provides access to stored Bitbucket operation contracts and their associated Zod schemas.
 *
 * The service is intentionally lightweight; contracts are loaded eagerly so `getSchema` and
 * `getOperation` resolve synchronously with minimal overhead. Logging hooks are provided
 * to surface missing contract lookups for debugging purposes.
 */
export class SchemaService {
  private readonly logger: Pick<Logger, 'debug' | 'info' | 'warn' | 'error'>;
  private readonly contracts: ReadonlyMap<string, OperationContract>;

  constructor(options: SchemaServiceOptions = {}) {
    this.logger =
      options.logger ?? createLogger({ level: 'info', defaultMeta: { scope: 'schema-service' } });
    this.contracts = options.contracts ?? OPERATION_CONTRACTS;
  }

  /**
   * Retrieves the Zod schema associated with the supplied operation identifier.
   *
   * @param id - The unique operation identifier generated from the Bitbucket OpenAPI contract.
   * @throws {@link SchemaNotFoundError} when the identifier is not registered.
   */
  async getSchema(id: string): Promise<z.ZodTypeAny> {
    const contract = this.contracts.get(id);
    if (!contract) {
      this.logger.warn('Requested schema for unknown operation', { id });
      throw new SchemaNotFoundError(id);
    }
    return contract.schema;
  }

  /**
   * Returns the full {@link OperationContract} metadata for a given operation identifier.
   *
   * @param id - The operation identifier to look up.
   * @throws {@link SchemaNotFoundError} when the identifier has not been registered.
   */
  async getOperation(id: string): Promise<OperationContract> {
    const contract = this.contracts.get(id);
    if (!contract) {
      this.logger.warn('Requested operation metadata for unknown operation', { id });
      throw new SchemaNotFoundError(id);
    }
    return contract;
  }

  /**
   * Lists the identifiers for all registered operations.
   *
   * @returns A list of operation IDs available to the service.
   */
  listOperationIds(): string[] {
    return Array.from(this.contracts.keys());
  }
}
