import type { ZodIssue } from 'zod';

import { SchemaService } from '../../../../src/services/SchemaService';

const OPERATION_ID = 'bitbucket.pull-requests.merge';

describe('bitbucket.pull-requests.merge contract', () => {
  const buildService = () => new SchemaService();

  it('describes the REST operation metadata', async () => {
    const service = buildService();
    const operation = await service.getOperation(OPERATION_ID);

    expect(operation.method).toBe('POST');
    expect(operation.path).toBe(
      '/2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/merge',
    );
    expect(operation.description.toLowerCase()).toContain('merge');
  });

  it('requires workspace, repo_slug, pull_request_id and body', async () => {
    const service = buildService();
    const operation = await service.getOperation(OPERATION_ID);

    const result = operation.schema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const missingPaths = result.error.issues.map((issue: ZodIssue) => issue.path.join('.'));
      expect(missingPaths).toEqual(
        expect.arrayContaining(['workspace', 'repo_slug', 'pull_request_id', 'body']),
      );
    }
  });

  it('accepts a valid merge payload', async () => {
    const service = buildService();
    const operation = await service.getOperation(OPERATION_ID);

    const payload = {
      workspace: 'acme',
      repo_slug: 'mobile-app',
      pull_request_id: 42,
      body: {
        message: 'Merging feature branch',
        close_source_branch: true,
        merge_strategy: 'squash',
      },
    };

    await expect(operation.schema.parseAsync(payload)).resolves.toEqual(payload);
  });

  it('rejects unknown merge strategies', async () => {
    const service = buildService();
    const operation = await service.getOperation(OPERATION_ID);

    const result = operation.schema.safeParse({
      workspace: 'acme',
      repo_slug: 'mobile-app',
      pull_request_id: 42,
      body: {
        merge_strategy: 'octopus',
      },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (candidate) => candidate.path.join('.') === 'body.merge_strategy',
      );
      expect(issue).toBeDefined();
      expect(issue?.message.toLowerCase()).toContain('invalid');
    }
  });
});
