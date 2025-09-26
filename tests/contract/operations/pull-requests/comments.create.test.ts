import type { ZodIssue } from 'zod';

import { SchemaService } from '../../../../src/services/SchemaService';

const OPERATION_ID = 'bitbucket.pull-requests.comments.create';

describe('bitbucket.pull-requests.comments.create contract', () => {
  const buildService = () => new SchemaService();

  it('describes the REST operation metadata', async () => {
    const service = buildService();
    const operation = await service.getOperation(OPERATION_ID);

    expect(operation.method).toBe('POST');
    expect(operation.path).toBe(
      '/2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/comments',
    );
    expect(operation.description.toLowerCase()).toContain('comment');
  });

  it('requires workspace, repo_slug, pull_request_id, and content.raw', async () => {
    const service = buildService();
    const operation = await service.getOperation(OPERATION_ID);

    const result = operation.schema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const missingPaths = result.error.issues.map((issue: ZodIssue) => issue.path.join('.'));
      expect(missingPaths).toEqual(
        expect.arrayContaining([
          'workspace',
          'repo_slug',
          'pull_request_id',
          'content',
          'content.raw',
        ]),
      );
    }
  });

  it('accepts a minimal comment payload', async () => {
    const service = buildService();
    const operation = await service.getOperation(OPERATION_ID);

    const payload = {
      workspace: 'acme',
      repo_slug: 'mobile-app',
      pull_request_id: 42,
      content: {
        raw: 'Looks good to me',
      },
    };

    await expect(operation.schema.parseAsync(payload)).resolves.toEqual(payload);
  });

  it('accepts inline and parent comment options', async () => {
    const service = buildService();
    const operation = await service.getOperation(OPERATION_ID);

    const payload = {
      workspace: 'acme',
      repo_slug: 'mobile-app',
      pull_request_id: 42,
      parent_id: 7,
      content: {
        raw: 'Please consider renaming this variable',
      },
      inline: {
        path: 'src/index.ts',
        to: 120,
        line_type: 'ADDED',
      },
    };

    await expect(operation.schema.parseAsync(payload)).resolves.toEqual(payload);
  });

  it('rejects empty content raw text', async () => {
    const service = buildService();
    const operation = await service.getOperation(OPERATION_ID);

    const result = operation.schema.safeParse({
      workspace: 'acme',
      repo_slug: 'mobile-app',
      pull_request_id: 42,
      content: {
        raw: '',
      },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (candidate) => candidate.path.join('.') === 'content.raw',
      );
      expect(issue).toBeDefined();
      expect(issue?.message.toLowerCase()).toContain('at least 1');
    }
  });
});
