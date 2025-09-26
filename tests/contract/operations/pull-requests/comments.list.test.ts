import type { ZodIssue } from 'zod';

import { SchemaService } from '../../../../src/services/SchemaService';

const OPERATION_ID = 'bitbucket.pull-requests.comments.list';

describe('bitbucket.pull-requests.comments.list contract', () => {
  const buildService = () => new SchemaService();

  it('describes the REST operation metadata', async () => {
    const service = buildService();
    const operation = await service.getOperation(OPERATION_ID);

    expect(operation.method).toBe('GET');
    expect(operation.path).toBe(
      '/2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/comments',
    );
    expect(operation.description.toLowerCase()).toContain('comment');
  });

  it('requires workspace, repo_slug and pull_request_id', async () => {
    const service = buildService();
    const operation = await service.getOperation(OPERATION_ID);

    const result = operation.schema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const missingPaths = result.error.issues.map((issue: ZodIssue) => issue.path.join('.'));
      expect(missingPaths).toEqual(
        expect.arrayContaining(['workspace', 'repo_slug', 'pull_request_id']),
      );
    }
  });

  it('accepts pagination and filtering parameters', async () => {
    const service = buildService();
    const operation = await service.getOperation(OPERATION_ID);

    const payload = {
      workspace: 'acme',
      repo_slug: 'mobile-app',
      pull_request_id: 42,
      page: 'cursor',
      pagelen: 25,
      sort: 'created_on',
      q: 'user.display_name ~ "Alice"',
    };

    await expect(operation.schema.parseAsync(payload)).resolves.toEqual(payload);
  });

  it('rejects pagelen outside Bitbucket bounds', async () => {
    const service = buildService();
    const operation = await service.getOperation(OPERATION_ID);

    const result = operation.schema.safeParse({
      workspace: 'acme',
      repo_slug: 'mobile-app',
      pull_request_id: 42,
      pagelen: 101,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((candidate) => candidate.path.join('.') === 'pagelen');
      expect(issue).toBeDefined();
      expect(issue?.message.toLowerCase()).toContain('less than or equal to 100');
    }
  });
});
