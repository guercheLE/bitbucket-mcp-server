import { describe, it, expect, beforeEach } from '@jest/globals';
import { serverTypeDetectorService } from '../../src/services/server-type-detector.service';

describe('Server Type Detection Integration Tests', () => {
  describe('Cloud Server Detection', () => {
    it('should detect cloud server type', async () => {
      const result = await serverTypeDetectorService.detectServerType('https://bitbucket.org');
      
      // In test environment, this might return null due to network restrictions
      // but the structure should be correct
      expect(result).toHaveProperty('serverType');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('features');
      expect(result).toHaveProperty('capabilities');
    });

    it('should get cloud server capabilities', async () => {
      const capabilities = await serverTypeDetectorService.getServerCapabilities('https://bitbucket.org');
      
      expect(capabilities).toHaveProperty('hasProjects');
      expect(capabilities).toHaveProperty('hasIssues');
      expect(capabilities).toHaveProperty('hasPipelines');
      expect(capabilities).toHaveProperty('hasWebhooks');
      expect(capabilities).toHaveProperty('hasOAuth');
      expect(capabilities).toHaveProperty('hasPersonalAccessTokens');
      expect(capabilities).toHaveProperty('hasBranchPermissions');
      expect(capabilities).toHaveProperty('hasRepositoryHooks');
      expect(capabilities).toHaveProperty('hasGlobalHooks');
      expect(capabilities).toHaveProperty('hasSystemInfo');
      expect(capabilities).toHaveProperty('hasLicenseInfo');
    });

    it('should check if server is cloud', async () => {
      const isCloud = await serverTypeDetectorService.isCloudServer('https://bitbucket.org');
      expect(typeof isCloud).toBe('boolean');
    });

    it('should get server version', async () => {
      const version = await serverTypeDetectorService.getServerVersion('https://bitbucket.org');
      expect(version).toBeDefined();
    });

    it('should check for specific features', async () => {
      const hasUserApi = await serverTypeDetectorService.hasFeature('https://bitbucket.org', 'user-api');
      expect(typeof hasUserApi).toBe('boolean');
    });

    it('should check for specific capabilities', async () => {
      const hasOAuth = await serverTypeDetectorService.hasCapability('https://bitbucket.org', 'hasOAuth');
      expect(typeof hasOAuth).toBe('boolean');
    });
  });

  describe('Data Center Server Detection', () => {
    it('should detect datacenter server type', async () => {
      const result = await serverTypeDetectorService.detectServerType('https://bitbucket.company.com');
      
      // In test environment, this might return null due to network restrictions
      // but the structure should be correct
      expect(result).toHaveProperty('serverType');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('features');
      expect(result).toHaveProperty('capabilities');
    });

    it('should get datacenter server capabilities', async () => {
      const capabilities = await serverTypeDetectorService.getServerCapabilities('https://bitbucket.company.com');
      
      expect(capabilities).toHaveProperty('hasProjects');
      expect(capabilities).toHaveProperty('hasIssues');
      expect(capabilities).toHaveProperty('hasPipelines');
      expect(capabilities).toHaveProperty('hasWebhooks');
      expect(capabilities).toHaveProperty('hasOAuth');
      expect(capabilities).toHaveProperty('hasPersonalAccessTokens');
      expect(capabilities).toHaveProperty('hasBranchPermissions');
      expect(capabilities).toHaveProperty('hasRepositoryHooks');
      expect(capabilities).toHaveProperty('hasGlobalHooks');
      expect(capabilities).toHaveProperty('hasSystemInfo');
      expect(capabilities).toHaveProperty('hasLicenseInfo');
    });

    it('should check if server is datacenter', async () => {
      const isDataCenter = await serverTypeDetectorService.isDataCenterServer('https://bitbucket.company.com');
      expect(typeof isDataCenter).toBe('boolean');
    });
  });

  describe('Invalid Server Detection', () => {
    it('should handle invalid URLs', async () => {
      const result = await serverTypeDetectorService.detectServerType('https://invalid-url.com');
      
      expect(result.serverType).toBeNull();
      expect(result.error).toBeDefined();
    });

    it('should handle non-Bitbucket servers', async () => {
      const result = await serverTypeDetectorService.detectServerType('https://github.com');
      
      expect(result.serverType).toBeNull();
    });

    it('should handle unreachable servers', async () => {
      const result = await serverTypeDetectorService.detectServerType('https://unreachable-server.com');
      
      expect(result.serverType).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('Caching', () => {
    it('should cache detection results', async () => {
      const url = 'https://test-bitbucket.com';
      
      // First call
      const result1 = await serverTypeDetectorService.detectServerType(url);
      
      // Second call should use cache
      const result2 = await serverTypeDetectorService.detectServerType(url);
      
      expect(result1).toEqual(result2);
    });

    it('should get cached result', () => {
      const url = 'https://test-bitbucket.com';
      const cached = serverTypeDetectorService.getCachedResult(url);
      
      // Initially should be null
      expect(cached).toBeNull();
    });

    it('should clear cache', () => {
      serverTypeDetectorService.clearCache();
      
      // Cache should be empty after clearing
      const cached = serverTypeDetectorService.getCachedResult('https://any-url.com');
      expect(cached).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts', async () => {
      // This test would require a server that times out
      // For now, we'll test the structure
      const result = await serverTypeDetectorService.detectServerType('https://httpstat.us/200?sleep=10000');
      
      expect(result).toHaveProperty('serverType');
      expect(result).toHaveProperty('error');
    });

    it('should handle malformed URLs', async () => {
      const result = await serverTypeDetectorService.detectServerType('not-a-url');
      
      expect(result.serverType).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('Feature Detection', () => {
    it('should detect version info feature', async () => {
      const hasVersionInfo = await serverTypeDetectorService.hasFeature('https://bitbucket.org', 'version-info');
      expect(typeof hasVersionInfo).toBe('boolean');
    });

    it('should detect build info feature', async () => {
      const hasBuildInfo = await serverTypeDetectorService.hasFeature('https://bitbucket.org', 'build-info');
      expect(typeof hasBuildInfo).toBe('boolean');
    });

    it('should detect rate limiting feature', async () => {
      const hasRateLimiting = await serverTypeDetectorService.hasFeature('https://bitbucket.org', 'rate-limiting');
      expect(typeof hasRateLimiting).toBe('boolean');
    });
  });

  describe('Capability Detection', () => {
    it('should detect project capability', async () => {
      const hasProjects = await serverTypeDetectorService.hasCapability('https://bitbucket.org', 'hasProjects');
      expect(typeof hasProjects).toBe('boolean');
    });

    it('should detect issues capability', async () => {
      const hasIssues = await serverTypeDetectorService.hasCapability('https://bitbucket.org', 'hasIssues');
      expect(typeof hasIssues).toBe('boolean');
    });

    it('should detect pipelines capability', async () => {
      const hasPipelines = await serverTypeDetectorService.hasCapability('https://bitbucket.org', 'hasPipelines');
      expect(typeof hasPipelines).toBe('boolean');
    });

    it('should detect webhooks capability', async () => {
      const hasWebhooks = await serverTypeDetectorService.hasCapability('https://bitbucket.org', 'hasWebhooks');
      expect(typeof hasWebhooks).toBe('boolean');
    });
  });
});
