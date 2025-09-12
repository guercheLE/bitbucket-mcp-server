import axios, { AxiosResponse } from 'axios';
import { ServerType } from '@/types/config';
import { loggerService } from './logger.service';
import { errorHandlerService } from './error-handler.service';

export interface ServerDetectionResult {
  serverType: ServerType | null;
  version?: string;
  features?: string[];
  capabilities?: Record<string, boolean>;
  error?: string;
}

export interface ServerCapabilities extends Record<string, boolean> {
  hasProjects: boolean;
  hasIssues: boolean;
  hasPipelines: boolean;
  hasWebhooks: boolean;
  hasOAuth: boolean;
  hasPersonalAccessTokens: boolean;
  hasBranchPermissions: boolean;
  hasRepositoryHooks: boolean;
  hasGlobalHooks: boolean;
  hasSystemInfo: boolean;
  hasLicenseInfo: boolean;
}

export class ServerTypeDetectorService {
  private static instance: ServerTypeDetectorService;
  private cache: Map<string, ServerDetectionResult> = new Map();
  private logger = loggerService.getLogger('server-detector');

  private constructor() {}

  public static getInstance(): ServerTypeDetectorService {
    if (!ServerTypeDetectorService.instance) {
      ServerTypeDetectorService.instance = new ServerTypeDetectorService();
    }
    return ServerTypeDetectorService.instance;
  }

  public async detectServerType(baseUrl: string): Promise<ServerDetectionResult> {
    // Check cache first
    const cached = this.cache.get(baseUrl);
    if (cached) {
      this.logger.debug('Using cached server detection result', { baseUrl });
      return cached;
    }

    this.logger.info('Detecting server type', { baseUrl });

    try {
      const result = await this.performDetection(baseUrl);
      this.cache.set(baseUrl, result);

      this.logger.info('Server type detected', {
        baseUrl,
        serverType: result.serverType,
        version: result.version,
      });

      return result;
    } catch (error) {
      const detectionError = errorHandlerService.handleError(error, {
        operation: 'detectServerType',
        baseUrl,
      });

      const result: ServerDetectionResult = {
        serverType: null,
        error: detectionError.message,
      };

      this.cache.set(baseUrl, result);
      return result;
    }
  }

  public async getServerCapabilities(baseUrl: string): Promise<ServerCapabilities> {
    const detection = await this.detectServerType(baseUrl);

    if (!detection.serverType) {
      return this.getDefaultCapabilities();
    }

    try {
      return await this.detectCloudCapabilities(baseUrl);
    } catch (error) {
      this.logger.warn('Failed to detect server capabilities', {
        baseUrl,
        error: error instanceof Error ? error.message : String(error),
      });
      return this.getDefaultCapabilities();
    }
  }

  public clearCache(): void {
    this.cache.clear();
    this.logger.info('Cleared server detection cache');
  }

  public getCachedResult(baseUrl: string): ServerDetectionResult | null {
    return this.cache.get(baseUrl) || null;
  }

  private async performDetection(baseUrl: string): Promise<ServerDetectionResult> {
    // Try Data Center endpoints first
    const datacenterResult = await this.tryDataCenterDetection(baseUrl);
    if (datacenterResult.serverType === 'datacenter') {
      return datacenterResult;
    }

    // Try Cloud endpoints
    const cloudResult = await this.tryCloudDetection(baseUrl);
    if (cloudResult.serverType === 'cloud') {
      return cloudResult;
    }

    // If neither worked, return null
    return {
      serverType: null,
      error: 'Could not determine server type - neither Data Center nor Cloud endpoints responded',
    };
  }

  private async tryDataCenterDetection(baseUrl: string): Promise<ServerDetectionResult> {
    try {
      // Try the application properties endpoint (Data Center specific)
      const response = await axios.get(`${baseUrl}/rest/api/1.0/application-properties`, {
        timeout: 5000,
        validateStatus: status => status < 500, // Don't throw on 4xx errors
      });

      if (response.status === 200) {
        const data = response.data;
        return {
          serverType: 'datacenter',
          version: data.version || data.buildNumber,
          features: this.extractDataCenterFeatures(data),
          capabilities: await this.detectDataCenterCapabilities(baseUrl),
        };
      }

      // Try system info endpoint
      const systemResponse = await axios.get(`${baseUrl}/rest/api/1.0/admin/system-info`, {
        timeout: 5000,
        validateStatus: status => status < 500,
      });

      if (systemResponse.status === 200) {
        const data = systemResponse.data;
        return {
          serverType: 'datacenter',
          version: data.version || data.buildNumber,
          features: ['system-info'],
          capabilities: await this.detectDataCenterCapabilities(baseUrl),
        };
      }

      return { serverType: null };
    } catch (error) {
      this.logger.debug('Data Center detection failed', {
        baseUrl,
        error: error instanceof Error ? error.message : String(error),
      });
      return { serverType: null };
    }
  }

  private async tryCloudDetection(baseUrl: string): Promise<ServerDetectionResult> {
    try {
      // Try the user endpoint (Cloud specific)
      const response = await axios.get(`${baseUrl}/2.0/user`, {
        timeout: 5000,
        validateStatus: status => status < 500, // Don't throw on 4xx errors
      });

      if (response.status === 200 || response.status === 401) {
        // 401 is expected for unauthenticated requests
        return {
          serverType: 'cloud',
          version: this.extractCloudVersion(response),
          features: this.extractCloudFeatures(response),
          capabilities: await this.detectCloudCapabilities(baseUrl),
        };
      }

      // Try repositories endpoint
      const reposResponse = await axios.get(`${baseUrl}/2.0/repositories`, {
        timeout: 5000,
        validateStatus: status => status < 500,
      });

      if (reposResponse.status === 200 || reposResponse.status === 401) {
        return {
          serverType: 'cloud',
          version: 'unknown',
          features: ['repositories'],
          capabilities: await this.detectCloudCapabilities(baseUrl),
        };
      }

      return { serverType: null };
    } catch (error) {
      this.logger.debug('Cloud detection failed', {
        baseUrl,
        error: error instanceof Error ? error.message : String(error),
      });
      return { serverType: null };
    }
  }

  private extractDataCenterFeatures(data: any): string[] {
    const features: string[] = [];

    if (data.version) features.push('version-info');
    if (data.buildNumber) features.push('build-info');
    if (data.displayName) features.push('display-name');

    return features;
  }

  private extractCloudVersion(response: AxiosResponse): string {
    const serverHeader = response.headers['server'];
    if (serverHeader && serverHeader.includes('Bitbucket')) {
      return serverHeader;
    }
    return 'unknown';
  }

  private extractCloudFeatures(response: AxiosResponse): string[] {
    const features: string[] = ['user-api'];

    // Check for additional features based on response headers
    if (response.headers['x-ratelimit-limit']) {
      features.push('rate-limiting');
    }

    return features;
  }

  private async detectDataCenterCapabilities(baseUrl: string): Promise<ServerCapabilities> {
    const capabilities: ServerCapabilities = {
      hasProjects: false,
      hasIssues: false,
      hasPipelines: false,
      hasWebhooks: false,
      hasOAuth: false,
      hasPersonalAccessTokens: false,
      hasBranchPermissions: false,
      hasRepositoryHooks: false,
      hasGlobalHooks: false,
      hasSystemInfo: false,
      hasLicenseInfo: false,
    };

    try {
      // Test multiple endpoints in parallel
      const tests = await Promise.allSettled([
        this.testEndpoint(`${baseUrl}/rest/api/1.0/projects`),
        this.testEndpoint(`${baseUrl}/rest/api/1.0/admin/system-info`),
        this.testEndpoint(`${baseUrl}/rest/api/1.0/admin/license`),
        this.testEndpoint(`${baseUrl}/rest/api/1.0/admin/oauth`),
        this.testEndpoint(`${baseUrl}/rest/api/1.0/admin/personal-access-tokens`),
        this.testEndpoint(`${baseUrl}/rest/api/1.0/admin/hooks`),
      ]);

      capabilities.hasProjects = tests[0].status === 'fulfilled';
      capabilities.hasSystemInfo = tests[1].status === 'fulfilled';
      capabilities.hasLicenseInfo = tests[2].status === 'fulfilled';
      capabilities.hasOAuth = tests[3].status === 'fulfilled';
      capabilities.hasPersonalAccessTokens = tests[4].status === 'fulfilled';
      capabilities.hasGlobalHooks = tests[5].status === 'fulfilled';

      // Data Center specific capabilities
      capabilities.hasBranchPermissions = true;
      capabilities.hasRepositoryHooks = true;
      capabilities.hasWebhooks = true;
    } catch (error) {
      this.logger.debug('Failed to detect Data Center capabilities', {
        baseUrl,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return capabilities;
  }

  private async detectCloudCapabilities(baseUrl: string): Promise<ServerCapabilities> {
    const capabilities: ServerCapabilities = {
      hasProjects: false,
      hasIssues: false,
      hasPipelines: false,
      hasWebhooks: false,
      hasOAuth: false,
      hasPersonalAccessTokens: false,
      hasBranchPermissions: false,
      hasRepositoryHooks: false,
      hasGlobalHooks: false,
      hasSystemInfo: false,
      hasLicenseInfo: false,
    };

    try {
      // Test Cloud-specific endpoints
      const tests = await Promise.allSettled([
        this.testEndpoint(`${baseUrl}/2.0/repositories`),
        this.testEndpoint(`${baseUrl}/2.0/user`),
        this.testEndpoint(`${baseUrl}/2.0/workspaces`),
        this.testEndpoint(`${baseUrl}/2.0/pipelines`),
        this.testEndpoint(`${baseUrl}/2.0/hooks`),
      ]);

      capabilities.hasProjects = tests[2].status === 'fulfilled'; // Workspaces in Cloud
      capabilities.hasIssues = true; // Cloud always has issues
      capabilities.hasPipelines = tests[3].status === 'fulfilled';
      capabilities.hasWebhooks = tests[4].status === 'fulfilled';
      capabilities.hasOAuth = true; // Cloud always has OAuth
      capabilities.hasRepositoryHooks = true; // Cloud has repository hooks
    } catch (error) {
      this.logger.debug('Failed to detect Cloud capabilities', {
        baseUrl,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return capabilities;
  }

  private async testEndpoint(url: string): Promise<boolean> {
    try {
      const response = await axios.get(url, {
        timeout: 3000,
        validateStatus: status => status < 500, // Don't throw on 4xx errors
      });

      // Consider 200, 401 (unauthorized), and 403 (forbidden) as successful endpoint detection
      return response.status < 500;
    } catch (error) {
      return false;
    }
  }

  private getDefaultCapabilities(): ServerCapabilities {
    return {
      hasProjects: false,
      hasIssues: false,
      hasPipelines: false,
      hasWebhooks: false,
      hasOAuth: false,
      hasPersonalAccessTokens: false,
      hasBranchPermissions: false,
      hasRepositoryHooks: false,
      hasGlobalHooks: false,
      hasSystemInfo: false,
      hasLicenseInfo: false,
    };
  }

  public isCloudServer(baseUrl: string): Promise<boolean> {
    return this.detectServerType(baseUrl).then(result => result.serverType === 'cloud');
  }

  public isDataCenterServer(baseUrl: string): Promise<boolean> {
    return this.detectServerType(baseUrl).then(result => result.serverType === 'datacenter');
  }

  public getServerVersion(baseUrl: string): Promise<string | undefined> {
    return this.detectServerType(baseUrl).then(result => result.version);
  }

  public hasFeature(baseUrl: string, feature: string): Promise<boolean> {
    return this.detectServerType(baseUrl).then(
      result => result.features?.includes(feature) || false
    );
  }

  public hasCapability(baseUrl: string, capability: keyof ServerCapabilities): Promise<boolean> {
    return this.getServerCapabilities(baseUrl).then(
      capabilities => capabilities[capability] || false
    );
  }
}

// Export singleton instance
export const serverTypeDetectorService = ServerTypeDetectorService.getInstance();
