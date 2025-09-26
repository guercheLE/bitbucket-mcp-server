import type { ZodIssue } from 'zod';

import { SchemaService } from '../../../../src/services/SchemaService';

const OPERATION_ID = 'bitbucket.pull-requests.list';

describe('bitbucket.pull-requests.list contract', () => {
  const buildService = () => new SchemaService();

  it('describes the REST operation metadata', async () => {
    const service = buildService();
    const operation = await service.getOperation(OPERATION_ID);

    expect(operation.method).toBe('GET');
    expect(operation.path).toBe('/2.0/repositories/{workspace}/{repo_slug}/pullrequests');
    expect(operation.description).toContain('pull requests');
  });

  it('requires workspace and repo_slug parameters', async () => {
    const service = buildService();
    const operation = await service.getOperation(OPERATION_ID);

    const result = operation.schema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const missingPaths = result.error.issues.map((issue: ZodIssue) => issue.path.join('.'));
      expect(missingPaths).toEqual(expect.arrayContaining(['workspace', 'repo_slug']));
    }
  });

  it('accepts optional filtering and pagination parameters', async () => {
    const service = buildService();
    const operation = await service.getOperation(OPERATION_ID);

    const payload = {
      workspace: 'acme',
      repo_slug: 'web-app',
      state: 'OPEN',
      q: 'state="OPEN"',
      sort: '-updated_on',
      page: 'cursor123',
      pagelen: 20,
    };

    await expect(operation.schema.parseAsync(payload)).resolves.toEqual(payload);
  });

  it('enforces pagelen bounds', async () => {
    const service = buildService();
    const operation = await service.getOperation(OPERATION_ID);

    const result = operation.schema.safeParse({
      workspace: 'acme',
      repo_slug: 'web-app',
      pagelen: 101,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((candidate) => candidate.path.join('.') === 'pagelen');
      expect(issue).toBeDefined();
      expect(issue?.message.toLowerCase()).toContain('less than or equal to 100');
    }
  });

  it('rejects unsupported state values', async () => {
    const service = buildService();
    const operation = await service.getOperation(OPERATION_ID);

    const result = operation.schema.safeParse({
      workspace: 'acme',
      repo_slug: 'web-app',
      state: 'ARCHIVED',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((candidate) => candidate.path.join('.') === 'state');
      expect(issue).toBeDefined();
      expect(issue?.message).toContain('Invalid enum value');
    }
  });
});
