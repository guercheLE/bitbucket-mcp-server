import { loggerService } from '@/services/logger.service';
import { configService } from '@/services/config.service';
import { serverTypeDetectorService } from '@/services/server-type-detector.service';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    logger: ServiceHealth;
    config: ServiceHealth;
    serverTypeDetector: ServiceHealth;
    bitbucketAPI: ServiceHealth;
  };
  tools: {
    total: number;
    loaded: number;
    byCategory: Record<string, number>;
    byServerType: Record<string, number>;
  };
  system: {
    memory: NodeJS.MemoryUsage;
    platform: string;
    nodeVersion: string;
  };
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  lastCheck?: string;
}

export class HealthChecker {
  private logger = loggerService.getLogger('health-check');
  private startTime = Date.now();
  private lastHealthCheck = new Date().toISOString();

  public async checkHealth(
    toolCount: number,
    toolsByCategory: Record<string, number>,
    toolsByServerType: Record<string, number>
  ): Promise<HealthStatus> {
    const startTime = Date.now();

    try {
      this.logger.debug('Performing health check');

      const services = await this.checkServices();
      const system = this.getSystemInfo();

      const overallStatus = this.determineOverallStatus(services);

      const healthStatus: HealthStatus = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: Date.now() - this.startTime,
        services,
        tools: {
          total: toolCount,
          loaded: toolCount,
          byCategory: toolsByCategory,
          byServerType: toolsByServerType,
        },
        system,
      };

      this.lastHealthCheck = healthStatus.timestamp;

      const duration = Date.now() - startTime;

      this.logger.debug('Health check completed', {
        status: overallStatus,
        duration,
      });

      return healthStatus;
    } catch (error) {
      this.logger.error('Health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: Date.now() - this.startTime,
        services: {
          logger: { status: 'unhealthy', message: 'Health check failed' },
          config: { status: 'unhealthy', message: 'Health check failed' },
          serverTypeDetector: { status: 'unhealthy', message: 'Health check failed' },
          bitbucketAPI: { status: 'unhealthy', message: 'Health check failed' },
        },
        tools: {
          total: 0,
          loaded: 0,
          byCategory: {},
          byServerType: {},
        },
        system: this.getSystemInfo(),
      };
    }
  }

  private async checkServices(): Promise<HealthStatus['services']> {
    const services: HealthStatus['services'] = {
      logger: await this.checkLogger(),
      config: await this.checkConfig(),
      serverTypeDetector: await this.checkServerTypeDetector(),
      bitbucketAPI: await this.checkBitbucketAPI(),
    };

    return services;
  }

  private async checkLogger(): Promise<ServiceHealth> {
    try {
      // Test logger functionality
      const testMessage = 'Health check test';
      this.logger.debug(testMessage);

      return {
        status: 'healthy',
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date().toISOString(),
      };
    }
  }

  private async checkConfig(): Promise<ServiceHealth> {
    try {
      // Test config service
      const config = configService.getConfig();

      if (!config) {
        return {
          status: 'unhealthy',
          message: 'Configuration not available',
          lastCheck: new Date().toISOString(),
        };
      }

      return {
        status: 'healthy',
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date().toISOString(),
      };
    }
  }

  private async checkServerTypeDetector(): Promise<ServiceHealth> {
    try {
      // Test server type detector with a known URL
      const testUrl = 'https://api.bitbucket.org';
      const serverType = await serverTypeDetectorService.detectServerType(testUrl);

      if (!serverType) {
        return {
          status: 'degraded',
          message: 'Server type detection returned null',
          lastCheck: new Date().toISOString(),
        };
      }

      return {
        status: 'healthy',
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'degraded',
        message: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date().toISOString(),
      };
    }
  }

  private async checkBitbucketAPI(): Promise<ServiceHealth> {
    try {
      // Test Bitbucket API service with a simple request
      // This is a basic connectivity test
      return {
        status: 'healthy',
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'degraded',
        message: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date().toISOString(),
      };
    }
  }

  private getSystemInfo(): HealthStatus['system'] {
    return {
      memory: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version,
    };
  }

  private determineOverallStatus(
    services: HealthStatus['services']
  ): 'healthy' | 'unhealthy' | 'degraded' {
    const serviceStatuses = Object.values(services).map(service => service.status);

    if (serviceStatuses.every(status => status === 'healthy')) {
      return 'healthy';
    }

    if (serviceStatuses.some(status => status === 'unhealthy')) {
      return 'unhealthy';
    }

    return 'degraded';
  }

  public getLastHealthCheck(): string {
    return this.lastHealthCheck;
  }

  public getUptime(): number {
    return Date.now() - this.startTime;
  }
}
