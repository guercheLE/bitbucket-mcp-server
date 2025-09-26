import { z } from 'zod';

import { OperationRegistry } from '../../src/lib/operations';
import { PullRequestSchema } from '../../src/models/pull-request';
import { DiscoveryService } from '../../src/services/discovery';
import { ExecutionService } from '../../src/services/execution';
import { SearchService } from '../../src/services/search';

const registry = new OperationRegistry();

const GetOpenPullRequestsInput = z.object({
  projectKey: z.string().min(1),
  repositorySlug: z.string().min(1),
});

const GetOpenPullRequestsOutput = z.array(
  PullRequestSchema.pick({ id: true, title: true, state: true }),
);

registry.register({
  id: 'get-open-pull-requests',
  summary: 'Retrieve open pull requests',
  description: 'Lists all pull requests that are currently open for the repository.',
  input: GetOpenPullRequestsInput,
  output: GetOpenPullRequestsOutput,
  handler: async ({
    projectKey,
    repositorySlug,
  }: {
    projectKey: string;
    repositorySlug: string;
  }) => {
    return [
      {
        id: 101,
        title: `Open PR for ${projectKey}/${repositorySlug}`,
        state: 'OPEN',
      },
    ];
  },
});

registry.register({
  id: 'merge-pull-request',
  summary: 'Merge a pull request',
  description: 'Merges the specified pull request into the target branch.',
  input: z.object({ id: z.number().int(), projectKey: z.string(), repositorySlug: z.string() }),
  output: PullRequestSchema.pick({ id: true, state: true }),
  handler: async ({ id }: { id: number }) => ({ id, state: 'MERGED' }),
});

describe('search-ids', () => {
  it('returns matching operations for a natural language query', async () => {
    const search = new SearchService(registry);
    const results = await search.search('open pull requests');
    expect(results[0].id).toBe('get-open-pull-requests');
  });
});

describe('get-id', () => {
  it('returns the Zod schema definitions for an operation', () => {
    const discovery = new DiscoveryService(registry);
    const metadata = discovery.getOperation('get-open-pull-requests');
    expect(metadata.summary).toContain('Retrieve open pull requests');

    const payload = metadata.input.parse({ projectKey: 'PROJ', repositorySlug: 'repo' });
    expect(payload.projectKey).toBe('PROJ');
  });

  it('throws when the operation is missing', () => {
    const discovery = new DiscoveryService(registry);
    expect(() => discovery.getOperation('unknown' as any)).toThrow('Operation unknown not found');
  });
});

describe('call-id', () => {
  it('executes the operation handler and validates the response', async () => {
    const execution = new ExecutionService(registry);
    const result = (await execution.execute('get-open-pull-requests', {
      projectKey: 'PROJ',
      repositorySlug: 'repo',
    })) as { id: number; title: string; state: string }[];

    expect(Array.isArray(result)).toBe(true);
    expect(result[0].state).toBe('OPEN');
  });

  it('validates input payloads', async () => {
    const execution = new ExecutionService(registry);
    await expect(
      execution.execute('get-open-pull-requests', {
        projectKey: '',
        repositorySlug: 'repo',
      }),
    ).rejects.toThrow('Invalid payload for operation get-open-pull-requests');
  });

  it('surfaced handler errors to the caller', async () => {
    const failingRegistry = new OperationRegistry();
    failingRegistry.register({
      id: 'failing',
      summary: 'Fails',
      description: 'Always fails',
      input: z.object({ value: z.string() }),
      output: z.object({ value: z.string() }),
      handler: async () => {
        throw new Error('Boom');
      },
    });
    const execution = new ExecutionService(failingRegistry);
    await expect(execution.execute('failing', { value: 'test' })).rejects.toThrow('Boom');
  });
});
