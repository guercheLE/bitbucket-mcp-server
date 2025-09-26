import { z } from 'zod';

import type { OperationContract } from '../../src/contracts/operations';
import { SchemaNotFoundError, SchemaService } from '../../src/services/SchemaService';

describe('SchemaService', () => {
  const buildService = (overrides: Partial<OperationContract> = {}) => {
    const schema = overrides.schema ?? z.object({ example: z.string() });
    const contract: OperationContract = {
      id: overrides.id ?? 'GET /rest/api/1.0/example',
      method: overrides.method ?? 'GET',
      path: overrides.path ?? '/rest/api/1.0/example',
      description: overrides.description ?? 'Example operation',
      schema,
    };

    const service = new SchemaService({
      contracts: new Map([[contract.id, contract]]),
    });

    return { service, contract, schema };
  };

  it('returns the schema for a known operation', async () => {
    const { service, contract, schema } = buildService();
    await expect(service.getSchema(contract.id)).resolves.toBe(schema);
  });

  it('returns operation metadata for a known operation', async () => {
    const { service, contract } = buildService();
    await expect(service.getOperation(contract.id)).resolves.toBe(contract);
  });

  it('lists registered operation identifiers', () => {
    const first = buildService({ id: 'op:first' });
    const second = buildService({ id: 'op:second' });

    const service = new SchemaService({
      contracts: new Map([
        [first.contract.id, first.contract],
        [second.contract.id, second.contract],
      ]),
    });

    expect(service.listOperationIds()).toEqual([first.contract.id, second.contract.id]);
  });

  it('throws SchemaNotFoundError for unknown operations', async () => {
    const warn = jest.fn();
    const missingId = 'unknown-operation';
    const instrumented = new SchemaService({
      contracts: new Map(),
      logger: {
        warn,
        info: jest.fn(),
        debug: jest.fn(),
        error: jest.fn(),
      },
    });

    await expect(instrumented.getSchema(missingId)).rejects.toBeInstanceOf(SchemaNotFoundError);
    expect(warn).toHaveBeenCalledWith('Requested schema for unknown operation', { id: missingId });
  });
});
