import { loggerService } from '@/services/logger.service';
import { ServerTypeDetectorService } from '@/services/server-type-detector.service';
import { BitbucketCloudIntegration, CloudIntegrationConfig } from './bitbucket-cloud-integration';
import {
  BitbucketDataCenterIntegration,
  DataCenterIntegrationConfig,
} from './bitbucket-datacenter-integration';
import { ProcessedResponse } from './response-processor';
import { BitbucketError } from '@/types/errors';

export interface IntegrationManagerConfig {
  cloud: CloudIntegrationConfig;
  datacenter: DataCenterIntegrationConfig;
  autoDetectServerType: boolean;
  fallbackToCloud: boolean;
  healthCheckInterval: number;
  maxRetries: number;
}

export class IntegrationManager {
  private logger = loggerService.getLogger('integration-manager');
  private config: IntegrationManagerConfig;
  private serverTypeDetector!: ServerTypeDetectorService;
  private cloudIntegration!: BitbucketCloudIntegration;
  private datacenterIntegration!: BitbucketDataCenterIntegration;
  private currentServerType: 'cloud' | 'datacenter' | null = null;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private isHealthy: boolean = false;

  constructor(config: IntegrationManagerConfig) {
    this.config = config;
    this.initializeComponents();
  }

  private initializeComponents(): void {
    this.logger.info('Initializing integration manager components');

    // Initialize server type detector
    this.serverTypeDetector = ServerTypeDetectorService.getInstance();

    // Initialize cloud integration
    this.cloudIntegration = new BitbucketCloudIntegration(this.config.cloud);

    // Initialize datacenter integration
    this.datacenterIntegration = new BitbucketDataCenterIntegration(this.config.datacenter);

    // Start health check if enabled
    if (this.config.healthCheckInterval > 0) {
      this.startHealthCheck();
    }

    this.logger.info('Integration manager components initialized successfully');
  }

  public async detectServerType(baseUrl: string): Promise<'cloud' | 'datacenter'> {
    this.logger.info('Detecting server type', {
      baseUrl,
      autoDetect: this.config.autoDetectServerType,
    });

    try {
      const serverType = await this.serverTypeDetector.detectServerType(baseUrl);

      this.logger.info('Server type detected', {
        serverType,
        baseUrl,
      });

      this.currentServerType = serverType.serverType || 'cloud';
      return serverType.serverType || 'cloud';
    } catch (error) {
      this.logger.error('Failed to detect server type', {
        baseUrl,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (this.config.fallbackToCloud) {
        this.logger.warn('Falling back to cloud integration', {
          baseUrl,
        });
        this.currentServerType = 'cloud';
        return 'cloud';
      }

      throw error;
    }
  }

  public async authenticate(
    baseUrl: string,
    credentials: {
      username: string;
      password: string;
    }
  ): Promise<ProcessedResponse<{ access_token: string; token_type: string }>> {
    this.logger.info('Authenticating with Bitbucket', {
      baseUrl,
      username: credentials.username,
    });

    try {
      // Detect server type if not already detected
      if (!this.currentServerType) {
        await this.detectServerType(baseUrl);
      }

      // Authenticate with appropriate integration
      if (this.currentServerType === 'cloud') {
        return await this.cloudIntegration.authenticate(credentials);
      } else {
        return await this.datacenterIntegration.authenticate(credentials);
      }
    } catch (error) {
      this.logger.error('Authentication failed', {
        baseUrl,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const mappedError = this.mapError(error);
      throw mappedError;
    }
  }

  public async getCurrentUser(
    baseUrl: string,
    accessToken: string
  ): Promise<ProcessedResponse<any>> {
    this.logger.info('Getting current user', {
      baseUrl,
    });

    try {
      // Detect server type if not already detected
      if (!this.currentServerType) {
        await this.detectServerType(baseUrl);
      }

      // Get current user from appropriate integration
      if (this.currentServerType === 'cloud') {
        return await this.cloudIntegration.getCurrentUser(accessToken);
      } else {
        return await this.datacenterIntegration.getCurrentUser(accessToken);
      }
    } catch (error) {
      this.logger.error('Failed to get current user', {
        baseUrl,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const mappedError = this.mapError(error);
      throw mappedError;
    }
  }

  public async getRepositories(
    baseUrl: string,
    accessToken: string,
    options: {
      projectKey?: string;
      page?: number;
      size?: number;
      sort?: string;
      q?: string;
    } = {}
  ): Promise<ProcessedResponse<any[]>> {
    this.logger.info('Getting repositories', {
      baseUrl,
      projectKey: options.projectKey,
      page: options.page,
      size: options.size,
      sort: options.sort,
      hasQuery: !!options.q,
    });

    try {
      // Detect server type if not already detected
      if (!this.currentServerType) {
        await this.detectServerType(baseUrl);
      }

      // Get repositories from appropriate integration
      if (this.currentServerType === 'cloud') {
        return await this.cloudIntegration.getRepositories(accessToken, {
          page: options.page || 1,
          size: options.size || 50,
          ...(options.sort && { sort: options.sort }),
          ...(options.q && { q: options.q }),
        });
      } else {
        if (!options.projectKey) {
          throw new Error('Project key is required for Data Center repositories');
        }
        return await this.datacenterIntegration.getRepositories(accessToken, options.projectKey, {
          page: options.page || 1,
          size: options.size || 50,
          ...(options.sort && { sort: options.sort }),
          ...(options.q && { q: options.q }),
        });
      }
    } catch (error) {
      this.logger.error('Failed to get repositories', {
        baseUrl,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const mappedError = this.mapError(error);
      throw mappedError;
    }
  }

  public async getRepository(
    baseUrl: string,
    accessToken: string,
    repositoryInfo: {
      projectKey?: string;
      workspace?: string;
      repoSlug: string;
    }
  ): Promise<ProcessedResponse<any>> {
    this.logger.info('Getting repository', {
      baseUrl,
      projectKey: repositoryInfo.projectKey,
      workspace: repositoryInfo.workspace,
      repoSlug: repositoryInfo.repoSlug,
    });

    try {
      // Detect server type if not already detected
      if (!this.currentServerType) {
        await this.detectServerType(baseUrl);
      }

      // Get repository from appropriate integration
      if (this.currentServerType === 'cloud') {
        if (!repositoryInfo.workspace) {
          throw new Error('Workspace is required for Cloud repositories');
        }
        return await this.cloudIntegration.getRepository(
          accessToken,
          repositoryInfo.workspace,
          repositoryInfo.repoSlug
        );
      } else {
        if (!repositoryInfo.projectKey) {
          throw new Error('Project key is required for Data Center repositories');
        }
        return await this.datacenterIntegration.getRepository(
          accessToken,
          repositoryInfo.projectKey,
          repositoryInfo.repoSlug
        );
      }
    } catch (error) {
      this.logger.error('Failed to get repository', {
        baseUrl,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const mappedError = this.mapError(error);
      throw mappedError;
    }
  }

  public async getPullRequests(
    baseUrl: string,
    accessToken: string,
    repositoryInfo: {
      projectKey?: string;
      workspace?: string;
      repoSlug: string;
    },
    options: {
      page?: number;
      size?: number;
      state?: string;
      sort?: string;
    } = {}
  ): Promise<ProcessedResponse<any[]>> {
    this.logger.info('Getting pull requests', {
      baseUrl,
      projectKey: repositoryInfo.projectKey,
      workspace: repositoryInfo.workspace,
      repoSlug: repositoryInfo.repoSlug,
      page: options.page,
      size: options.size,
      state: options.state,
      sort: options.sort,
    });

    try {
      // Detect server type if not already detected
      if (!this.currentServerType) {
        await this.detectServerType(baseUrl);
      }

      // Get pull requests from appropriate integration
      if (this.currentServerType === 'cloud') {
        if (!repositoryInfo.workspace) {
          throw new Error('Workspace is required for Cloud repositories');
        }
        return await this.cloudIntegration.getPullRequests(
          accessToken,
          repositoryInfo.workspace,
          repositoryInfo.repoSlug,
          options
        );
      } else {
        if (!repositoryInfo.projectKey) {
          throw new Error('Project key is required for Data Center repositories');
        }
        return await this.datacenterIntegration.getPullRequests(
          accessToken,
          repositoryInfo.projectKey,
          repositoryInfo.repoSlug,
          options
        );
      }
    } catch (error) {
      this.logger.error('Failed to get pull requests', {
        baseUrl,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const mappedError = this.mapError(error);
      throw mappedError;
    }
  }

  public async getPullRequest(
    baseUrl: string,
    accessToken: string,
    repositoryInfo: {
      projectKey?: string;
      workspace?: string;
      repoSlug: string;
    },
    pullRequestId: number
  ): Promise<ProcessedResponse<any>> {
    this.logger.info('Getting pull request', {
      baseUrl,
      projectKey: repositoryInfo.projectKey,
      workspace: repositoryInfo.workspace,
      repoSlug: repositoryInfo.repoSlug,
      pullRequestId,
    });

    try {
      // Detect server type if not already detected
      if (!this.currentServerType) {
        await this.detectServerType(baseUrl);
      }

      // Get pull request from appropriate integration
      if (this.currentServerType === 'cloud') {
        if (!repositoryInfo.workspace) {
          throw new Error('Workspace is required for Cloud repositories');
        }
        return await this.cloudIntegration.getPullRequest(
          accessToken,
          repositoryInfo.workspace,
          repositoryInfo.repoSlug,
          pullRequestId
        );
      } else {
        if (!repositoryInfo.projectKey) {
          throw new Error('Project key is required for Data Center repositories');
        }
        return await this.datacenterIntegration.getPullRequest(
          accessToken,
          repositoryInfo.projectKey,
          repositoryInfo.repoSlug,
          pullRequestId
        );
      }
    } catch (error) {
      this.logger.error('Failed to get pull request', {
        baseUrl,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const mappedError = this.mapError(error);
      throw mappedError;
    }
  }

  public async createPullRequest(
    baseUrl: string,
    accessToken: string,
    repositoryInfo: {
      projectKey?: string;
      workspace?: string;
      repoSlug: string;
    },
    pullRequestData: any
  ): Promise<ProcessedResponse<any>> {
    this.logger.info('Creating pull request', {
      baseUrl,
      projectKey: repositoryInfo.projectKey,
      workspace: repositoryInfo.workspace,
      repoSlug: repositoryInfo.repoSlug,
      title: pullRequestData.title,
    });

    try {
      // Detect server type if not already detected
      if (!this.currentServerType) {
        await this.detectServerType(baseUrl);
      }

      // Create pull request with appropriate integration
      if (this.currentServerType === 'cloud') {
        if (!repositoryInfo.workspace) {
          throw new Error('Workspace is required for Cloud repositories');
        }
        return await this.cloudIntegration.createPullRequest(
          accessToken,
          repositoryInfo.workspace,
          repositoryInfo.repoSlug,
          pullRequestData
        );
      } else {
        if (!repositoryInfo.projectKey) {
          throw new Error('Project key is required for Data Center repositories');
        }
        return await this.datacenterIntegration.createPullRequest(
          accessToken,
          repositoryInfo.projectKey,
          repositoryInfo.repoSlug,
          pullRequestData
        );
      }
    } catch (error) {
      this.logger.error('Failed to create pull request', {
        baseUrl,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const mappedError = this.mapError(error);
      throw mappedError;
    }
  }

  public async getProjects(
    baseUrl: string,
    accessToken: string,
    options: {
      page?: number;
      size?: number;
      sort?: string;
      q?: string;
    } = {}
  ): Promise<ProcessedResponse<any[]>> {
    this.logger.info('Getting projects', {
      baseUrl,
      page: options.page,
      size: options.size,
      sort: options.sort,
      hasQuery: !!options.q,
    });

    try {
      // Detect server type if not already detected
      if (!this.currentServerType) {
        await this.detectServerType(baseUrl);
      }

      // Get projects from appropriate integration
      if (this.currentServerType === 'cloud') {
        // Cloud doesn't have projects in the same way, return empty array
        return {
          data: [],
          metadata: {
            timestamp: new Date().toISOString(),
            processingTime: 0,
            source: 'bitbucket-cloud',
          },
          errors: [],
          warnings: ['Projects are not available in Bitbucket Cloud'],
        };
      } else {
        return await this.datacenterIntegration.getProjects(accessToken, options);
      }
    } catch (error) {
      this.logger.error('Failed to get projects', {
        baseUrl,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const mappedError = this.mapError(error);
      throw mappedError;
    }
  }

  public async getProject(
    baseUrl: string,
    accessToken: string,
    projectKey: string
  ): Promise<ProcessedResponse<any>> {
    this.logger.info('Getting project', {
      baseUrl,
      projectKey,
    });

    try {
      // Detect server type if not already detected
      if (!this.currentServerType) {
        await this.detectServerType(baseUrl);
      }

      // Get project from appropriate integration
      if (this.currentServerType === 'cloud') {
        // Cloud doesn't have projects in the same way, return error
        throw new Error('Projects are not available in Bitbucket Cloud');
      } else {
        return await this.datacenterIntegration.getProject(accessToken, projectKey);
      }
    } catch (error) {
      this.logger.error('Failed to get project', {
        baseUrl,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const mappedError = this.mapError(error);
      throw mappedError;
    }
  }

  private mapError(error: any): BitbucketError {
    // Simple error mapping - in a real implementation, you might want to use the ErrorMapper
    return {
      type: 'UNKNOWN_ERROR',
      severity: 'MEDIUM',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      originalMessage: error instanceof Error ? error.message : 'Unknown error',
      retryable: false,
      timestamp: new Date().toISOString(),
      context: { error },
    };
  }

  private startHealthCheck(): void {
    this.logger.info('Starting health check', {
      interval: this.config.healthCheckInterval,
    });

    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  private async performHealthCheck(): Promise<void> {
    try {
      // Perform basic health check
      this.isHealthy = true;
      this.logger.debug('Health check passed');
    } catch (error) {
      this.isHealthy = false;
      this.logger.warn('Health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  public async stopHealthCheck(): Promise<void> {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
      this.logger.info('Health check stopped');
    }
  }

  public async getStats(): Promise<{
    currentServerType: 'cloud' | 'datacenter' | null;
    isHealthy: boolean;
    cloud: any;
    datacenter: any;
  }> {
    return {
      currentServerType: this.currentServerType,
      isHealthy: this.isHealthy,
      cloud: await this.cloudIntegration.getStats(),
      datacenter: await this.datacenterIntegration.getStats(),
    };
  }

  public async updateConfig(newConfig: Partial<IntegrationManagerConfig>): Promise<void> {
    this.logger.info('Updating integration manager config', {
      hasNewConfig: !!newConfig,
    });

    if (newConfig.cloud) {
      await this.cloudIntegration.updateConfig(newConfig.cloud);
    }

    if (newConfig.datacenter) {
      await this.datacenterIntegration.updateConfig(newConfig.datacenter);
    }

    if (newConfig.healthCheckInterval !== undefined) {
      if (this.healthCheckTimer) {
        await this.stopHealthCheck();
      }
      if (newConfig.healthCheckInterval > 0) {
        this.startHealthCheck();
      }
    }

    this.config = { ...this.config, ...newConfig };

    this.logger.info('Integration manager config updated successfully');
  }

  public async cleanup(): Promise<void> {
    this.logger.info('Cleaning up integration manager');

    await this.stopHealthCheck();

    this.logger.info('Integration manager cleanup completed');
  }
}
