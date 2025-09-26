import { z } from 'zod';

import {
  bitbucketPaginationSchema,
  normalizePaginationParams,
  withBitbucketPagination,
} from '../../../src/utils/pagination';

describe('pagination utilities', () => {
  describe('normalizePaginationParams', () => {
    it('returns an empty object when no pagination is provided', () => {
      expect(normalizePaginationParams()).toEqual({});
    });

    it('maps MCP cursor and limit to Bitbucket parameters', () => {
      const result = normalizePaginationParams({ cursor: 'cursor-123', limit: 50 });
      expect(result).toEqual({ page: 'cursor-123', pagelen: 50 });
    });

    it('prefers explicit Bitbucket pagination values over MCP aliases', () => {
      const result = normalizePaginationParams({
        cursor: 'ignored',
        limit: 7,
        page: 'used',
        pagelen: 10,
      });

      expect(result).toEqual({ page: 'used', pagelen: 10 });
    });

    it('throws when pagination values fall outside Bitbucket constraints', () => {
      expect(() => normalizePaginationParams({ limit: 0 })).toThrow(z.ZodError);
    });
  });

  describe('withBitbucketPagination', () => {
    it('extends a schema shape with optional page and pagelen parameters', () => {
      const schema = withBitbucketPagination({ foo: z.string() });
      const parsed = schema.parse({ foo: 'bar', pagelen: 25 });

      expect(parsed).toEqual({ foo: 'bar', pagelen: 25 });

      const result = schema.safeParse({ foo: 'bar', pagelen: 101 });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(
          (candidate) => candidate.path.join('.') === 'pagelen',
        );
        expect(issue).toBeDefined();
        expect(issue?.message.toLowerCase()).toContain('less than or equal to 100');
      }
    });

    it('preserves the raw shape when creating the base schema', () => {
      const schema = withBitbucketPagination({ foo: z.string() });
      expect(schema.shape).toHaveProperty('foo');
      expect(schema.shape).toHaveProperty('page');
      expect(schema.shape).toHaveProperty('pagelen');
    });
  });

  it('exports a reusable Bitbucket pagination schema', () => {
    const result = bitbucketPaginationSchema.parse({ page: 'cursor', pagelen: 10 });
    expect(result).toEqual({ page: 'cursor', pagelen: 10 });
  });
});
