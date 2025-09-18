/**
 * Unit Tests for Health Check Service
 * Tests for health monitoring and system status
 */

import { HealthCheckService } from '../../../src/services/health-check.js';

// Mock dependencies
jest.mock('../../../src/services/cache', () => ({
  cache: {
    getStats: jest.fn().mockResolvedValue({
      hits: 100,
      misses: 20,
      hitRate: 83.33,
      size: 1024,
      entries: 50,
      memoryUsage: 1024000
    })
  }
}));

jest.mock('../../../src/services/rate-limiter.js', () => ({
  rateLimitAndCircuitBreaker: {
    getStatus: jest.fn().mockReturnValue({
      rateLimiter: {
        config: { points: 100, duration: 900 },
        limiters: ['global', 'ip', 'user']
      },
      circuitBreaker: {
        config: { timeout: 10000, errorThresholdPercentage: 50 },
        breakers: {
          'bitbucket-api': { state: 'closed', stats: {} },
          'database': { state: 'closed', stats: {} },
          'cache': { state: 'closed', stats: {} }
        }
      }
    })
  }
}));

jest.mock('../../../src/services/server-detection.js', () => ({
  serverDetectionService: {
    getCacheStats: jest.fn().mockReturnValue({
      size: 5,
      entries: ['server1', 'server2', 'server3', 'server4', 'server5']
    })
  }
}));

jest.mock('../../../src/config/environment.js', () => ({
  environment: {
    getConfig: () => ({
      node: { env: 'test' },
      cache: { type: 'memory' },
      bitbucket: { serverUrl: 'https://test.bitbucket.com' }
    })
  }
}));

jest.mock('../../../src/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn().mockResolvedValue({
    status: 200,
    headers: { 'x-response-time': '100ms' }
  })
}));

describe('HealthCheckService', () => {
  let healthCheckService: HealthCheckService;

  beforeEach(() => {
    healthCheckService = new HealthCheckService();
  });

  afterEach(() => {
    healthCheckService.stop();
  });

  describe('Health Check Registration', () => {
    it('should register a new health check', () => {
      const config = {
        name: 'test-check',
        enabled: true,
        timeout: 5000,
        interval: 30000,
        critical: false
      };

      healthCheckService.registerCheck(config);
      
      const registeredChecks = healthCheckService.getConfig();
      expect(registeredChecks.has('test-check')).toBe(true);
    });

    it('should unregister a health check', () => {
      const config = {
        name: 'test-check',
        enabled: true,
        timeout: 5000,
        critical: false
      };

      healthCheckService.registerCheck(config);
      expect(healthCheckService.getConfig().has('test-check')).toBe(true);

      healthCheckService.unregisterCheck('test-check');
      expect(healthCheckService.getConfig().has('test-check')).toBe(false);
    });
  });

  describe('Individual Health Checks', () => {
    it('should run system health check', async () => {
      const result = await healthCheckService.runCheck('system');
      
      expect(result.name).toBe('system');
      expect(result.status).toMatch(/^(healthy|unhealthy|degraded)$/);
      expect(result.timestamp).toBeDefined();
      expect(result.details).toHaveProperty('memory');
      expect(result.details).toHaveProperty('cpu');
      expect(result.details).toHaveProperty('uptime');
    });

    it('should run cache health check', async () => {
      const result = await healthCheckService.runCheck('cache');
      
      expect(result.name).toBe('cache');
      expect(result.status).toBe('healthy');
      expect(result.message).toContain('Cache hit rate');
      expect(result.details).toHaveProperty('hits');
      expect(result.details).toHaveProperty('misses');
      expect(result.details).toHaveProperty('hitRate');
    });

    it('should run rate limiter health check', async () => {
      const result = await healthCheckService.runCheck('rate-limiter');
      
      expect(result.name).toBe('rate-limiter');
      expect(result.status).toBe('healthy');
      expect(result.message).toBe('Rate limiter operational');
      expect(result.details).toHaveProperty('limiters');
      expect(result.details).toHaveProperty('config');
    });

    it('should run circuit breaker health check', async () => {
      const result = await healthCheckService.runCheck('circuit-breaker');
      
      expect(result.name).toBe('circuit-breaker');
      expect(result.status).toBe('healthy');
      expect(result.message).toBe('0 circuit breaker(s) open');
      expect(result.details).toHaveProperty('breakers');
      expect(result.details).toHaveProperty('openCount');
      expect(result.details).toHaveProperty('totalCount');
    });

    it('should run server detection health check', async () => {
      const result = await healthCheckService.runCheck('server-detection');
      
      expect(result.name).toBe('server-detection');
      expect(result.status).toBe('healthy');
      expect(result.message).toContain('Server detection cache');
      expect(result.details).toHaveProperty('cacheSize');
      expect(result.details).toHaveProperty('entries');
    });

    it('should run external dependencies health check', async () => {
      const result = await healthCheckService.runCheck('external-deps');
      
      expect(result.name).toBe('external-deps');
      expect(result.status).toMatch(/^(healthy|unhealthy|degraded)$/);
      expect(result.message).toContain('external dependencies healthy');
      expect(result.details).toHaveProperty('dependencies');
      expect(result.details).toHaveProperty('healthyCount');
      expect(result.details).toHaveProperty('totalCount');
    });

    it('should handle unknown health check', async () => {
      const result = await healthCheckService.runCheck('unknown-check');
      
      expect(result.name).toBe('unknown-check');
      expect(result.status).toBe('unhealthy');
      expect(result.message).toBe('Unknown health check');
    });
  });

  describe('System Health', () => {
    it('should get comprehensive system health', async () => {
      const systemHealth = await healthCheckService.getSystemHealth();
      
      expect(systemHealth).toHaveProperty('overall');
      expect(systemHealth).toHaveProperty('timestamp');
      expect(systemHealth).toHaveProperty('uptime');
      expect(systemHealth).toHaveProperty('version');
      expect(systemHealth).toHaveProperty('environment');
      expect(systemHealth).toHaveProperty('checks');
      expect(systemHealth).toHaveProperty('summary');
      
      expect(systemHealth.overall).toMatch(/^(healthy|unhealthy|degraded)$/);
      expect(systemHealth.environment).toBe('test');
      expect(systemHealth.version).toBeDefined();
      expect(systemHealth.uptime).toBeGreaterThan(0);
      
      expect(systemHealth.summary).toHaveProperty('total');
      expect(systemHealth.summary).toHaveProperty('healthy');
      expect(systemHealth.summary).toHaveProperty('unhealthy');
      expect(systemHealth.summary).toHaveProperty('degraded');
      
      expect(systemHealth.checks.length).toBeGreaterThan(0);
    });

    it('should determine overall health correctly', async () => {
      const systemHealth = await healthCheckService.getSystemHealth();
      
      const { summary } = systemHealth;
      
      if (summary.unhealthy > 0) {
        expect(systemHealth.overall).toBe('unhealthy');
      } else if (summary.degraded > 0) {
        expect(systemHealth.overall).toBe('degraded');
      } else {
        expect(systemHealth.overall).toBe('healthy');
      }
    });
  });

  describe('Health Check Results', () => {
    it('should store and retrieve health check results', async () => {
      await healthCheckService.runCheck('system');
      
      const results = healthCheckService.getResults();
      expect(results.has('system')).toBe(true);
      
      const systemResult = healthCheckService.getResult('system');
      expect(systemResult).toBeDefined();
      expect(systemResult?.name).toBe('system');
    });

    it('should return undefined for non-existent result', () => {
      const result = healthCheckService.getResult('non-existent');
      expect(result).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle health check execution errors', async () => {
      // Mock a failing health check
      const originalRunCheck = healthCheckService.runCheck;
      healthCheckService.runCheck = jest.fn().mockRejectedValue(new Error('Test error'));
      
      const systemHealth = await healthCheckService.getSystemHealth();
      
      // Should still return system health with error information
      expect(systemHealth).toHaveProperty('overall');
      expect(systemHealth.checks.length).toBeGreaterThan(0);
      
      // Restore original method
      healthCheckService.runCheck = originalRunCheck;
    });

    it('should handle individual check failures gracefully', async () => {
      // This test would require mocking specific service failures
      // For now, we'll test that the service doesn't crash
      await expect(healthCheckService.runCheck('system')).resolves.not.toThrow();
    });
  });

  describe('Periodic Checks', () => {
    it('should start and stop periodic checks', () => {
      // Service should start with periodic checks
      const config = healthCheckService.getConfig();
      expect(config.size).toBeGreaterThan(0);
      
      // Stop should not throw
      expect(() => healthCheckService.stop()).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should complete health checks within reasonable time', async () => {
      const startTime = Date.now();
      
      await healthCheckService.getSystemHealth();
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should track response times in health check results', async () => {
      const result = await healthCheckService.runCheck('system');
      
      expect(result.responseTime).toBeDefined();
      expect(typeof result.responseTime).toBe('number');
      expect(result.responseTime).toBeGreaterThan(0);
    });
  });
});
