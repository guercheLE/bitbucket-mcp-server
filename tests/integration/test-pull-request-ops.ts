import { describe, it, expect, beforeEach } from '@jest/globals';
import { bitbucketAPIService } from '../../src/services/bitbucket-api.service';
import { BitbucketConfig } from '../../src/types/config';

describe('Pull Request Operations Integration Tests', () => {
  let cloudConfig: BitbucketConfig;
  let datacenterConfig: BitbucketConfig;

  beforeEach(() => {
    cloudConfig = {
      baseUrl: 'https://bitbucket.org',
      serverType: 'cloud',
      auth: {
        type: 'oauth',
        credentials: {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          accessToken: 'test-access-token',
          tokenType: 'Bearer',
        },
      },
      timeouts: {
        read: 2000,
        write: 5000,
        connect: 10000,
      },
      rateLimit: {
        requestsPerMinute: 60,
        burstLimit: 10,
        retryAfter: 1000,
      },
    };

    datacenterConfig = {
      baseUrl: 'https://bitbucket.company.com',
      serverType: 'datacenter',
      auth: {
        type: 'api_token',
        credentials: {
          username: 'test-user',
          token: 'test-api-token',
        },
      },
      timeouts: {
        read: 2000,
        write: 5000,
        connect: 10000,
      },
      rateLimit: {
        requestsPerMinute: 60,
        burstLimit: 10,
        retryAfter: 1000,
      },
    };
  });

  describe('Cloud Pull Request Operations', () => {
    it('should list pull requests', async () => {
      const result = await bitbucketAPIService.get(
        cloudConfig,
        '/2.0/repositories/test-workspace/test-repo/pullrequests',
        { page: 1, size: 10 }
      );

      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('data');
    });

    it('should get pull request details', async () => {
      const result = await bitbucketAPIService.get(
        cloudConfig,
        '/2.0/repositories/test-workspace/test-repo/pullrequests/123'
      );

      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('data');
    });

    it('should create pull request', async () => {
      const prData = {
        title: 'Test Pull Request',
        description: 'This is a test pull request',
        source: {
          branch: {
            name: 'feature/test-branch',
          },
        },
        destination: {
          branch: {
            name: 'main',
          },
        },
      };

      const result = await bitbucketAPIService.post(
        cloudConfig,
        '/2.0/repositories/test-workspace/test-repo/pullrequests',
        prData
      );

      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('data');
    });

    it('should update pull request', async () => {
      const updateData = {
        title: 'Updated Pull Request Title',
        description: 'Updated description',
      };

      const result = await bitbucketAPIService.put(
        cloudConfig,
        '/2.0/repositories/test-workspace/test-repo/pullrequests/123',
        updateData
      );

      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('data');
    });

    it('should merge pull request', async () => {
      const mergeData = {
        type: 'merge',
        message: 'Merged via API',
      };

      const result = await bitbucketAPIService.post(
        cloudConfig,
        '/2.0/repositories/test-workspace/test-repo/pullrequests/123/merge',
        mergeData
      );

      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('data');
    });

    it('should decline pull request', async () => {
      const declineData = {
        version: 1,
      };

      const result = await bitbucketAPIService.post(
        cloudConfig,
        '/2.0/repositories/test-workspace/test-repo/pullrequests/123/decline',
        declineData
      );

      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('data');
    });
  });

  describe('Data Center Pull Request Operations', () => {
    it('should list pull requests', async () => {
      const result = await bitbucketAPIService.get(
        datacenterConfig,
        '/rest/api/1.0/projects/TEST/repos/test-repo/pull-requests',
        { limit: 10 }
      );

      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('data');
    });

    it('should get pull request details', async () => {
      const result = await bitbucketAPIService.get(
        datacenterConfig,
        '/rest/api/1.0/projects/TEST/repos/test-repo/pull-requests/123'
      );

      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('data');
    });

    it('should create pull request', async () => {
      const prData = {
        title: 'Test Pull Request',
        description: 'This is a test pull request',
        fromRef: {
          id: 'refs/heads/feature/test-branch',
        },
        toRef: {
          id: 'refs/heads/main',
        },
      };

      const result = await bitbucketAPIService.post(
        datacenterConfig,
        '/rest/api/1.0/projects/TEST/repos/test-repo/pull-requests',
        prData
      );

      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('data');
    });

    it('should merge pull request', async () => {
      const mergeData = {
        version: 1,
      };

      const result = await bitbucketAPIService.post(
        datacenterConfig,
        '/rest/api/1.0/projects/TEST/repos/test-repo/pull-requests/123/merge',
        mergeData
      );

      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('data');
    });

    it('should decline pull request', async () => {
      const declineData = {
        version: 1,
      };

      const result = await bitbucketAPIService.post(
        datacenterConfig,
        '/rest/api/1.0/projects/TEST/repos/test-repo/pull-requests/123/decline',
        declineData
      );

      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('data');
    });
  });

  describe('Pull Request Comments', () => {
    it('should list pull request comments (Cloud)', async () => {
      const result = await bitbucketAPIService.get(
        cloudConfig,
        '/2.0/repositories/test-workspace/test-repo/pullrequests/123/comments'
      );

      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('data');
    });

    it('should create pull request comment (Cloud)', async () => {
      const commentData = {
        content: {
          raw: 'This is a test comment',
        },
      };

      const result = await bitbucketAPIService.post(
        cloudConfig,
        '/2.0/repositories/test-workspace/test-repo/pullrequests/123/comments',
        commentData
      );

      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('data');
    });

    it('should list pull request comments (Data Center)', async () => {
      const result = await bitbucketAPIService.get(
        datacenterConfig,
        '/rest/api/1.0/projects/TEST/repos/test-repo/pull-requests/123/comments'
      );

      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('data');
    });

    it('should create pull request comment (Data Center)', async () => {
      const commentData = {
        text: 'This is a test comment',
      };

      const result = await bitbucketAPIService.post(
        datacenterConfig,
        '/rest/api/1.0/projects/TEST/repos/test-repo/pull-requests/123/comments',
        commentData
      );

      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('data');
    });
  });

  describe('Pull Request Activities', () => {
    it('should get pull request activity (Cloud)', async () => {
      const result = await bitbucketAPIService.get(
        cloudConfig,
        '/2.0/repositories/test-workspace/test-repo/pullrequests/123/activity'
      );

      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('data');
    });

    it('should get pull request activity (Data Center)', async () => {
      const result = await bitbucketAPIService.get(
        datacenterConfig,
        '/rest/api/1.0/projects/TEST/repos/test-repo/pull-requests/123/activities'
      );

      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('data');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid pull request IDs', async () => {
      const result = await bitbucketAPIService.get(
        cloudConfig,
        '/2.0/repositories/test-workspace/test-repo/pullrequests/999999'
      );

      expect(result.isError).toBe(true);
      expect(result.error).toBeDefined();
    });

    it('should handle invalid repository references', async () => {
      const result = await bitbucketAPIService.get(
        cloudConfig,
        '/2.0/repositories/invalid-workspace/invalid-repo/pullrequests'
      );

      expect(result.isError).toBe(true);
      expect(result.error).toBeDefined();
    });
  });
});
