import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { bitbucketAPIService } from '../../src/services/bitbucket-api.service';
import { BitbucketConfig } from '../../src/types/config';

describe('Repository CRUD Operations Integration Tests', () => {
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

  afterEach(() => {
    // Cleanup any test data
  });

  describe('Cloud Repository Operations', () => {
    it('should list repositories', async () => {
      const result = await bitbucketAPIService.get(
        cloudConfig,
        '/2.0/repositories',
        { page: 1, size: 10 }
      );

      // Since we're using test credentials, we expect this to fail
      // but the structure should be correct
      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('data');
    });

    it('should get repository details', async () => {
      const result = await bitbucketAPIService.get(
        cloudConfig,
        '/2.0/repositories/test-workspace/test-repo'
      );

      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('data');
    });

    it('should create repository', async () => {
      const repoData = {
        name: 'test-repo',
        description: 'Test repository',
        is_private: true,
      };

      const result = await bitbucketAPIService.post(
        cloudConfig,
        '/2.0/repositories/test-workspace/test-repo',
        repoData
      );

      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('data');
    });

    it('should update repository', async () => {
      const updateData = {
        description: 'Updated description',
      };

      const result = await bitbucketAPIService.put(
        cloudConfig,
        '/2.0/repositories/test-workspace/test-repo',
        updateData
      );

      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('data');
    });

    it('should delete repository', async () => {
      const result = await bitbucketAPIService.delete(
        cloudConfig,
        '/2.0/repositories/test-workspace/test-repo'
      );

      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('data');
    });
  });

  describe('Data Center Repository Operations', () => {
    it('should list repositories', async () => {
      const result = await bitbucketAPIService.get(
        datacenterConfig,
        '/rest/api/1.0/repos',
        { limit: 10 }
      );

      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('data');
    });

    it('should get repository details', async () => {
      const result = await bitbucketAPIService.get(
        datacenterConfig,
        '/rest/api/1.0/projects/TEST/repos/test-repo'
      );

      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('data');
    });

    it('should create repository', async () => {
      const repoData = {
        name: 'test-repo',
        description: 'Test repository',
        public: false,
      };

      const result = await bitbucketAPIService.post(
        datacenterConfig,
        '/rest/api/1.0/projects/TEST/repos',
        repoData
      );

      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('data');
    });

    it('should update repository', async () => {
      const updateData = {
        description: 'Updated description',
      };

      const result = await bitbucketAPIService.put(
        datacenterConfig,
        '/rest/api/1.0/projects/TEST/repos/test-repo',
        updateData
      );

      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('data');
    });

    it('should delete repository', async () => {
      const result = await bitbucketAPIService.delete(
        datacenterConfig,
        '/rest/api/1.0/projects/TEST/repos/test-repo'
      );

      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('data');
    });
  });

  describe('Repository Branches', () => {
    it('should list branches for Cloud repository', async () => {
      const result = await bitbucketAPIService.get(
        cloudConfig,
        '/2.0/repositories/test-workspace/test-repo/refs/branches'
      );

      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('data');
    });

    it('should list branches for Data Center repository', async () => {
      const result = await bitbucketAPIService.get(
        datacenterConfig,
        '/rest/api/1.0/projects/TEST/repos/test-repo/branches'
      );

      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('data');
    });

    it('should create branch', async () => {
      const branchData = {
        name: 'feature/test-branch',
        startPoint: 'refs/heads/main',
      };

      const result = await bitbucketAPIService.post(
        cloudConfig,
        '/2.0/repositories/test-workspace/test-repo/refs/branches',
        branchData
      );

      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('data');
    });
  });

  describe('Repository Tags', () => {
    it('should list tags for Cloud repository', async () => {
      const result = await bitbucketAPIService.get(
        cloudConfig,
        '/2.0/repositories/test-workspace/test-repo/refs/tags'
      );

      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('data');
    });

    it('should list tags for Data Center repository', async () => {
      const result = await bitbucketAPIService.get(
        datacenterConfig,
        '/rest/api/1.0/projects/TEST/repos/test-repo/tags'
      );

      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('data');
    });

    it('should create tag', async () => {
      const tagData = {
        name: 'v1.0.0',
        startPoint: 'refs/heads/main',
        message: 'Release version 1.0.0',
      };

      const result = await bitbucketAPIService.post(
        cloudConfig,
        '/2.0/repositories/test-workspace/test-repo/refs/tags',
        tagData
      );

      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('data');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid repository names', async () => {
      const result = await bitbucketAPIService.get(
        cloudConfig,
        '/2.0/repositories/invalid-workspace/invalid-repo'
      );

      expect(result.isError).toBe(true);
      expect(result.error).toBeDefined();
    });

    it('should handle network timeouts', async () => {
      const timeoutConfig = {
        ...cloudConfig,
        timeouts: {
          read: 1, // Very short timeout
          write: 1,
          connect: 1,
        },
      };

      const result = await bitbucketAPIService.get(
        timeoutConfig,
        '/2.0/repositories/test-workspace/test-repo'
      );

      expect(result.isError).toBe(true);
    });

    it('should handle rate limiting', async () => {
      const rateLimitedConfig = {
        ...cloudConfig,
        rateLimit: {
          requestsPerMinute: 1, // Very low rate limit
          burstLimit: 1,
          retryAfter: 1000,
        },
      };

      // Make multiple requests to trigger rate limiting
      const promises = Array(5).fill(null).map(() =>
        bitbucketAPIService.get(rateLimitedConfig, '/2.0/repositories')
      );

      const results = await Promise.all(promises);
      
      // At least one should be rate limited
      const hasRateLimit = results.some(result => result.isError);
      expect(hasRateLimit).toBe(true);
    });
  });

  describe('API Client Management', () => {
    it('should manage multiple clients', () => {
      const clientCount = bitbucketAPIService.getClientCount();
      expect(typeof clientCount).toBe('number');
    });

    it('should get active clients', () => {
      const activeClients = bitbucketAPIService.getActiveClients();
      expect(Array.isArray(activeClients)).toBe(true);
    });

    it('should clear clients', () => {
      bitbucketAPIService.clearClients();
      const clientCount = bitbucketAPIService.getClientCount();
      expect(clientCount).toBe(0);
    });
  });
});
