import axios, { AxiosResponse } from 'axios';
import { z } from 'zod';

/**
 * Server Detection Service
 * T027: Server type detection service in src/services/server-detection.ts
 * 
 * Detects Bitbucket server type (Data Center vs Cloud) and version
 * Based on research.md specifications
 */

// Server info schema
export const ServerInfoSchema = z.object({
  serverType: z.enum(['datacenter', 'cloud']),
  version: z.string(),
  buildNumber: z.string().optional(),
  baseUrl: z.string().url(),
  isSupported: z.boolean(),
  fallbackUsed: z.boolean().default(false),
  cached: z.boolean().default(false),
  lastHealthCheck: z.string().datetime().optional(),
  healthStatus: z.enum(['healthy', 'unhealthy']).optional(),
  error: z.string().optional()
});

export type ServerInfo = z.infer<typeof ServerInfoSchema>;

// Application properties response schema
const ApplicationPropertiesSchema = z.object({
  version: z.string(),
  buildNumber: z.string().optional(),
  buildDate: z.string().optional(),
  displayName: z.string().optional(),
  serverTitle: z.string().optional()
});

type ApplicationProperties = z.infer<typeof ApplicationPropertiesSchema>;

// Cache entry schema
const CacheEntrySchema = z.object({
  serverInfo: ServerInfoSchema,
  timestamp: z.number(),
  ttl: z.number()
});

type CacheEntry = z.infer<typeof CacheEntrySchema>;

/**
 * Server Detection Service Class
 */
export class ServerDetectionService {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly HEALTH_CHECK_INTERVAL = 30 * 1000; // 30 seconds
  private healthCheckTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Detects server type and version
   */
  async detectServerType(baseUrl: string): Promise<ServerInfo> {
    try {
      // Check cache first
      const cached = this.getCachedServerInfo(baseUrl);
      if (cached) {
        return { ...cached, cached: true };
      }

      // Try to detect server type
      const serverInfo = await this.performDetection(baseUrl);
      
      // Cache the result
      this.cacheServerInfo(baseUrl, serverInfo);
      
      // Start health check timer
      this.startHealthCheck(baseUrl);
      
      return serverInfo;
    } catch (error) {
      // Fallback to Data Center 7.16
      const fallbackInfo: ServerInfo = {
        serverType: 'datacenter',
        version: '7.16.0',
        buildNumber: '716000',
        baseUrl,
        isSupported: true,
        fallbackUsed: true,
        cached: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.cacheServerInfo(baseUrl, fallbackInfo);
      return fallbackInfo;
    }
  }

  /**
   * Performs actual server detection
   */
  private async performDetection(baseUrl: string): Promise<ServerInfo> {
    try {
      // Try Data Center endpoint first
      const dataCenterInfo = await this.detectDataCenter(baseUrl);
      if (dataCenterInfo) {
        return dataCenterInfo;
      }

      // Try Cloud endpoint
      const cloudInfo = await this.detectCloud(baseUrl);
      if (cloudInfo) {
        return cloudInfo;
      }

      throw new Error('Unable to detect server type');
    } catch (error) {
      throw new Error(`Server detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Detects Data Center server
   */
  private async detectDataCenter(baseUrl: string): Promise<ServerInfo | null> {
    try {
      const response: AxiosResponse<ApplicationProperties> = await axios.get(
        `${baseUrl}/rest/api/1.0/application-properties`,
        {
          timeout: 5000,
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      const properties = ApplicationPropertiesSchema.parse(response.data);
      
      // Determine if it's Data Center based on response
      const isDataCenter = properties.displayName?.includes('Data Center') || 
                          properties.serverTitle?.includes('Data Center') ||
                          !baseUrl.includes('bitbucket.org');

      if (isDataCenter) {
        return {
          serverType: 'datacenter',
          version: properties.version,
          buildNumber: properties.buildNumber,
          baseUrl,
          isSupported: this.isDataCenterVersionSupported(properties.version),
          fallbackUsed: false,
          cached: false,
          healthStatus: 'healthy'
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Detects Cloud server
   */
  private async detectCloud(baseUrl: string): Promise<ServerInfo | null> {
    try {
      // Cloud uses different endpoint structure
      const response: AxiosResponse<ApplicationProperties> = await axios.get(
        `${baseUrl}/2.0/application-properties`,
        {
          timeout: 5000,
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      const properties = ApplicationPropertiesSchema.parse(response.data);
      
      // Determine if it's Cloud based on response
      const isCloud = properties.displayName?.includes('Cloud') || 
                     properties.serverTitle?.includes('Cloud') ||
                     baseUrl.includes('bitbucket.org');

      if (isCloud) {
        return {
          serverType: 'cloud',
          version: properties.version,
          buildNumber: properties.buildNumber,
          baseUrl,
          isSupported: this.isCloudVersionSupported(properties.version),
          fallbackUsed: false,
          cached: false,
          healthStatus: 'healthy'
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Checks if Data Center version is supported
   */
  private isDataCenterVersionSupported(version: string): boolean {
    const versionParts = version.split('.').map(Number);
    const major = versionParts[0] || 0;
    const minor = versionParts[1] || 0;
    
    // Support Data Center 7.16+
    return major > 7 || (major === 7 && minor >= 16);
  }

  /**
   * Checks if Cloud version is supported
   */
  private isCloudVersionSupported(version: string): boolean {
    const versionParts = version.split('.').map(Number);
    const major = versionParts[0] || 0;
    
    // Support Cloud API 2.0+
    return major >= 2;
  }

  /**
   * Gets cached server info
   */
  private getCachedServerInfo(baseUrl: string): ServerInfo | null {
    const entry = this.cache.get(baseUrl);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(baseUrl);
      return null;
    }

    return entry.serverInfo;
  }

  /**
   * Caches server info
   */
  private cacheServerInfo(baseUrl: string, serverInfo: ServerInfo): void {
    const entry: CacheEntry = {
      serverInfo,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL
    };

    this.cache.set(baseUrl, entry);
  }

  /**
   * Starts health check timer
   */
  private startHealthCheck(baseUrl: string): void {
    // Clear existing timer
    const existingTimer = this.healthCheckTimers.get(baseUrl);
    if (existingTimer) {
      clearInterval(existingTimer);
    }

    // Start new timer
    const timer = setInterval(async () => {
      await this.performHealthCheck(baseUrl);
    }, this.HEALTH_CHECK_INTERVAL);

    this.healthCheckTimers.set(baseUrl, timer);
  }

  /**
   * Performs health check
   */
  private async performHealthCheck(baseUrl: string): Promise<void> {
    try {
      const response = await axios.get(
        `${baseUrl}/rest/api/1.0/application-properties`,
        {
          timeout: 5000,
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (response.status === 200) {
        // Update cache with healthy status
        const cached = this.cache.get(baseUrl);
        if (cached) {
          cached.serverInfo.healthStatus = 'healthy';
          cached.serverInfo.lastHealthCheck = new Date().toISOString();
        }
      }
    } catch (error) {
      // Update cache with unhealthy status
      const cached = this.cache.get(baseUrl);
      if (cached) {
        cached.serverInfo.healthStatus = 'unhealthy';
        cached.serverInfo.lastHealthCheck = new Date().toISOString();
        cached.serverInfo.error = error instanceof Error ? error.message : 'Health check failed';
      }
    }
  }

  /**
   * Clears cache for a specific server
   */
  clearCache(baseUrl: string): void {
    this.cache.delete(baseUrl);
    
    // Clear health check timer
    const timer = this.healthCheckTimers.get(baseUrl);
    if (timer) {
      clearInterval(timer);
      this.healthCheckTimers.delete(baseUrl);
    }
  }

  /**
   * Clears all cache
   */
  clearAllCache(): void {
    this.cache.clear();
    
    // Clear all health check timers
    this.healthCheckTimers.forEach(timer => clearInterval(timer));
    this.healthCheckTimers.clear();
  }

  /**
   * Gets cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const serverDetectionService = new ServerDetectionService();

// Export convenience function
export const detectServer = (baseUrl: string) => serverDetectionService.detectServerType(baseUrl);