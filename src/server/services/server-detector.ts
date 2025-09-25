/**
 * @fileoverview Server detection service
 * 
 * This service implements server detection and selective registration as specified
 * in the Constitution. It automatically detects Bitbucket server type and version
 * and provides fallback strategies.
 * 
 * @author Bitbucket MCP Server
 * @version 1.0.0
 * @license LGPL-3.0
 */

import axios, { AxiosInstance } from 'axios';

/**
 * Server information interface
 */
export interface ServerInfo {
  type: 'datacenter' | 'cloud';
  version: string;
  apiVersion: string;
  baseUrl: string;
  capabilities: string[];
  detected: boolean;
  fallback: boolean;
}

/**
 * Server detection service implementation
 */
export class ServerDetector {
  private httpClient: AxiosInstance;
  private cachedInfo: ServerInfo | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(baseUrl: string) {
    this.httpClient = axios.create({
      baseURL: baseUrl,
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Bitbucket-MCP-Server/1.0.0'
      }
    });
  }

  /**
   * Detect server type and version
   */
  async detectServer(): Promise<ServerInfo> {
    // Check cache first
    if (this.cachedInfo && Date.now() < this.cacheExpiry) {
      return this.cachedInfo;
    }

    try {
      // Try to detect server type and version
      const serverInfo = await this.performDetection();
      
      // Cache the result
      this.cachedInfo = serverInfo;
      this.cacheExpiry = Date.now() + this.CACHE_TTL;
      
      return serverInfo;
    } catch (error) {
      // Fallback to default Data Center 7.16
      const fallbackInfo: ServerInfo = {
        type: 'datacenter',
        version: '7.16',
        apiVersion: '1.0',
        baseUrl: this.httpClient.defaults.baseURL || '',
        capabilities: ['basic'],
        detected: false,
        fallback: true
      };

      // Cache fallback result with shorter TTL
      this.cachedInfo = fallbackInfo;
      this.cacheExpiry = Date.now() + (this.CACHE_TTL / 2);
      
      return fallbackInfo;
    }
  }

  /**
   * Perform actual server detection
   */
  private async performDetection(): Promise<ServerInfo> {
    try {
      // Try Data Center application properties endpoint first
      const response = await this.httpClient.get('/rest/api/1.0/application-properties');
      
      if (response.data) {
        return this.parseDataCenterResponse(response.data);
      }
    } catch (error) {
      // Data Center detection failed, try Cloud
    }

    try {
      // Try Cloud API endpoint
      const response = await this.httpClient.get('/2.0/user');
      
      if (response.data) {
        return this.parseCloudResponse(response.data);
      }
    } catch (error) {
      // Cloud detection also failed
    }

    throw new Error('Unable to detect server type and version');
  }

  /**
   * Parse Data Center response
   */
  private parseDataCenterResponse(data: any): ServerInfo {
    const version = data.version || '7.16';
    const capabilities = this.determineDataCenterCapabilities(version);

    return {
      type: 'datacenter',
      version,
      apiVersion: '1.0',
      baseUrl: this.httpClient.defaults.baseURL || '',
      capabilities,
      detected: true,
      fallback: false
    };
  }

  /**
   * Parse Cloud response
   */
  private parseCloudResponse(data: any): ServerInfo {
    const capabilities = this.determineCloudCapabilities();

    return {
      type: 'cloud',
      version: 'latest',
      apiVersion: '2.0',
      baseUrl: this.httpClient.defaults.baseURL || '',
      capabilities,
      detected: true,
      fallback: false
    };
  }

  /**
   * Determine Data Center capabilities based on version
   */
  private determineDataCenterCapabilities(version: string): string[] {
    const capabilities = ['basic'];
    const versionNum = this.parseVersion(version);

    if (versionNum >= this.parseVersion('7.16')) {
      capabilities.push('advanced-search', 'hooks', 'admin');
    }

    if (versionNum >= this.parseVersion('8.0')) {
      capabilities.push('enhanced-admin', 'dashboards');
    }

    if (versionNum >= this.parseVersion('8.6')) {
      capabilities.push('advanced-admin');
    }

    return capabilities;
  }

  /**
   * Determine Cloud capabilities
   */
  private determineCloudCapabilities(): string[] {
    return [
      'basic',
      'workspaces',
      'pipelines',
      'issues',
      'snippets',
      'webhooks',
      'ssh-keys',
      'gpg-keys',
      'branch-restrictions',
      'commit-status',
      'deployments',
      'downloads',
      'cache',
      'search',
      'dashboards',
      'add-ons',
      'reports',
      'source-management',
      'refs',
      'branching-model',
      'projects',
      'users',
      'teams'
    ];
  }

  /**
   * Parse version string to comparable number
   */
  private parseVersion(version: string): number {
    const parts = version.split('.').map(Number);
    return parts[0] * 10000 + (parts[1] || 0) * 100 + (parts[2] || 0);
  }

  /**
   * Check if server supports a specific capability
   */
  async hasCapability(capability: string): Promise<boolean> {
    const serverInfo = await this.detectServer();
    return serverInfo.capabilities.includes(capability);
  }

  /**
   * Get server type
   */
  async getServerType(): Promise<'datacenter' | 'cloud'> {
    const serverInfo = await this.detectServer();
    return serverInfo.type;
  }

  /**
   * Get server version
   */
  async getServerVersion(): Promise<string> {
    const serverInfo = await this.detectServer();
    return serverInfo.version;
  }

  /**
   * Check if server is compatible with minimum version
   */
  async isCompatibleWith(minVersion: string): Promise<boolean> {
    const serverInfo = await this.detectServer();
    const serverVersionNum = this.parseVersion(serverInfo.version);
    const minVersionNum = this.parseVersion(minVersion);
    
    return serverVersionNum >= minVersionNum;
  }

  /**
   * Clear cache (useful for testing or when server configuration changes)
   */
  clearCache(): void {
    this.cachedInfo = null;
    this.cacheExpiry = 0;
  }

  /**
   * Perform health check
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    serverInfo?: ServerInfo;
    error?: string;
  }> {
    try {
      const serverInfo = await this.detectServer();
      return {
        healthy: true,
        serverInfo
      };
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}
