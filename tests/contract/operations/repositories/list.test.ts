import type { ZodIssue } from 'zod';

import { SchemaService } from '../../../../src/services/SchemaService';

const OPERATION_ID = 'bitbucket.repositories.list';

describe('bitbucket.repositories.list contract', () => {
  const buildService = () => new SchemaService();

  it('describes the REST operation metadata', async () => {
    const service = buildService();
    const operation = await service.getOperation(OPERATION_ID);

    expect(operation.method).toBe('GET');
    expect(operation.path).toBe('/2.0/repositories/{workspace}');
    expect(operation.description).toContain('list of repositories');
  });

  it('requires the workspace parameter', async () => {
    const service = buildService();
    const operation = await service.getOperation(OPERATION_ID);

    const result = operation.schema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue: ZodIssue) => issue.path.join('.'))).toContain(
        'workspace',
      );
    }
  });

  it('accepts optional pagination parameters', async () => {
    const service = buildService();
    const operation = await service.getOperation(OPERATION_ID);

    const payload = {
      workspace: 'acme',
      pagelen: 25,
      page: 'abc123',
      q: 'project.key="MKT"',
      sort: '-updated_on',
    };

    await expect(operation.schema.parseAsync(payload)).resolves.toEqual(payload);
  });

  it('rejects pagelen outside Bitbucket bounds', async () => {
    const service = buildService();
    const operation = await service.getOperation(OPERATION_ID);

    const result = operation.schema.safeParse({
      workspace: 'acme',
      pagelen: 0,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((candidate) => candidate.path.join('.') === 'pagelen');
      expect(issue).toBeDefined();
      expect(issue?.message.toLowerCase()).toContain('greater than or equal to 1');
    }
  });
});
