import { ServerDetectionService } from '../../src/services/server-detection';

/**
 * Integration test for server type detection
 * T013: Integration test server type detection in tests/integration/test_server_detection.ts
 * 
 * This test MUST fail before implementation (Constitution Article V - TDD)
 * Tests automatic server type detection with fallback to Data Center 7.16
 */

describe('Server Detection Integration Tests', () => {
  let serverDetectionService: ServerDetectionService;

  beforeEach(() => {
    serverDetectionService = new ServerDetectionService();
  });

  describe('Data Center Detection', () => {
    it('should detect Data Center 7.16+ server', async () => {
      // Mock Data Center response
      const mockDataCenterResponse = {
        data: {
          version: '7.16.0',
          buildNumber: '716000',
          buildDate: '2025-01-27T10:00:00Z',
          displayName: 'Bitbucket Data Center',
          serverTitle: 'Bitbucket Data Center'
        }
      };

      // This test will fail until ServerDetectionService is implemented
      const result = await serverDetectionService.detectServerType('https://bitbucket.example.com');
      
      expect(result.serverType).toBe('datacenter');
      expect(result.version).toBe('7.16.0');
      expect(result.buildNumber).toBe('716000');
      expect(result.isSupported).toBe(true);
    });

    it('should detect Data Center 8.0+ server', async () => {
      // Mock newer Data Center response
      const mockDataCenterResponse = {
        data: {
          version: '8.0.0',
          buildNumber: '800000',
          buildDate: '2025-01-27T10:00:00Z',
          displayName: 'Bitbucket Data Center',
          serverTitle: 'Bitbucket Data Center'
        }
      };

      const result = await serverDetectionService.detectServerType('https://bitbucket.example.com');
      
      expect(result.serverType).toBe('datacenter');
      expect(result.version).toBe('8.0.0');
      expect(result.isSupported).toBe(true);
    });

    it('should handle Data Center with custom context path', async () => {
      const result = await serverDetectionService.detectServerType('https://bitbucket.example.com/bitbucket');
      
      expect(result.serverType).toBe('datacenter');
      expect(result.baseUrl).toBe('https://bitbucket.example.com/bitbucket');
    });
  });

  describe('Cloud Detection', () => {
    it('should detect Bitbucket Cloud server', async () => {
      // Mock Cloud response
      const mockCloudResponse = {
        data: {
          version: '2.0',
          buildNumber: '200000',
          buildDate: '2025-01-27T10:00:00Z',
          displayName: 'Bitbucket Cloud',
          serverTitle: 'Bitbucket Cloud'
        }
      };

      const result = await serverDetectionService.detectServerType('https://bitbucket.org');
      
      expect(result.serverType).toBe('cloud');
      expect(result.version).toBe('2.0');
      expect(result.isSupported).toBe(true);
    });

    it('should detect Cloud with workspace-specific URL', async () => {
      const result = await serverDetectionService.detectServerType('https://bitbucket.org/my-workspace');
      
      expect(result.serverType).toBe('cloud');
      expect(result.baseUrl).toBe('https://bitbucket.org');
    });
  });

  describe('Fallback Behavior', () => {
    it('should fallback to Data Center 7.16 when detection fails', async () => {
      // Mock failed detection
      const result = await serverDetectionService.detectServerType('https://unknown-server.com');
      
      expect(result.serverType).toBe('datacenter');
      expect(result.version).toBe('7.16.0');
      expect(result.isSupported).toBe(true);
      expect(result.fallbackUsed).toBe(true);
    });

    it('should fallback when server is unreachable', async () => {
      const result = await serverDetectionService.detectServerType('https://unreachable-server.com');
      
      expect(result.serverType).toBe('datacenter');
      expect(result.version).toBe('7.16.0');
      expect(result.fallbackUsed).toBe(true);
    });

    it('should fallback when response is invalid', async () => {
      // Mock invalid response
      const result = await serverDetectionService.detectServerType('https://invalid-response.com');
      
      expect(result.serverType).toBe('datacenter');
      expect(result.version).toBe('7.16.0');
      expect(result.fallbackUsed).toBe(true);
    });
  });

  describe('Caching Behavior', () => {
    it('should cache detection results for 5 minutes', async () => {
      const serverUrl = 'https://bitbucket.example.com';
      
      // First detection
      const result1 = await serverDetectionService.detectServerType(serverUrl);
      
      // Second detection should use cache
      const result2 = await serverDetectionService.detectServerType(serverUrl);
      
      expect(result1).toEqual(result2);
      expect(result1.cached).toBe(false);
      expect(result2.cached).toBe(true);
    });

    it('should invalidate cache after 5 minutes', async () => {
      const serverUrl = 'https://bitbucket.example.com';
      
      // First detection
      await serverDetectionService.detectServerType(serverUrl);
      
      // Mock time passage
      jest.advanceTimersByTime(5 * 60 * 1000 + 1000); // 5 minutes + 1 second
      
      // Second detection should not use cache
      const result = await serverDetectionService.detectServerType(serverUrl);
      
      expect(result.cached).toBe(false);
    });
  });

  describe('Health Checks', () => {
    it('should perform health check every 30 seconds', async () => {
      const serverUrl = 'https://bitbucket.example.com';
      
      // Initial detection
      await serverDetectionService.detectServerType(serverUrl);
      
      // Mock time passage
      jest.advanceTimersByTime(30 * 1000 + 1000); // 30 seconds + 1 second
      
      // Health check should be performed
      const result = await serverDetectionService.detectServerType(serverUrl);
      
      expect(result.lastHealthCheck).toBeDefined();
      expect(result.healthStatus).toBe('healthy');
    });

    it('should detect server health issues', async () => {
      const serverUrl = 'https://unhealthy-server.com';
      
      const result = await serverDetectionService.detectServerType(serverUrl);
      
      expect(result.healthStatus).toBe('unhealthy');
      expect(result.fallbackUsed).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts gracefully', async () => {
      const serverUrl = 'https://timeout-server.com';
      
      const result = await serverDetectionService.detectServerType(serverUrl);
      
      expect(result.serverType).toBe('datacenter');
      expect(result.fallbackUsed).toBe(true);
      expect(result.error).toBeDefined();
    });

    it('should handle SSL certificate errors', async () => {
      const serverUrl = 'https://invalid-ssl.com';
      
      const result = await serverDetectionService.detectServerType(serverUrl);
      
      expect(result.serverType).toBe('datacenter');
      expect(result.fallbackUsed).toBe(true);
      expect(result.error).toBeDefined();
    });

    it('should handle malformed URLs', async () => {
      const result = await serverDetectionService.detectServerType('not-a-url');
      
      expect(result.serverType).toBe('datacenter');
      expect(result.fallbackUsed).toBe(true);
      expect(result.error).toBeDefined();
    });
  });

  describe('Performance Requirements', () => {
    it('should detect server type within 2 seconds', async () => {
      const startTime = Date.now();
      
      await serverDetectionService.detectServerType('https://bitbucket.example.com');
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(2000); // 2 seconds
    });

    it('should use cached results within 100ms', async () => {
      const serverUrl = 'https://bitbucket.example.com';
      
      // First detection
      await serverDetectionService.detectServerType(serverUrl);
      
      // Cached detection
      const startTime = Date.now();
      await serverDetectionService.detectServerType(serverUrl);
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(100); // 100ms
    });
  });
});
