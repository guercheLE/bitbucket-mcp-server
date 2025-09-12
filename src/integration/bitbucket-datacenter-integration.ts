import { loggerService } from '@/services/logger.service';
import { ApiClient } from './api-client';
import { RateLimiter } from './rate-limiter';
import { RetryHandler } from './retry-handler';
import { ErrorMapper } from './error-mapper';
import { ResponseProcessor } from './response-processor';
import { ProcessedResponse } from './response-processor';

export interface DataCenterIntegrationConfig {
  baseUrl: string;
  apiVersion: string;
  timeout: number;
  retryConfig: {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
  };
  rateLimitConfig: {
    requestsPerMinute: number;
    burstLimit: number;
  };
  responseProcessorConfig: {
    enablePagination: boolean;
    enableMetadata: boolean;
    enableErrorCollection: boolean;
    enableWarningCollection: boolean;
    maxResponseSize: number;
  };
}

export class BitbucketDataCenterIntegration {
  private logger = loggerService.getLogger('bitbucket-datacenter-integration');
  private config: DataCenterIntegrationConfig;
  private apiClient!: ApiClient;
  private rateLimiter!: RateLimiter;
  private retryHandler!: RetryHandler;
  private errorMapper!: ErrorMapper;
  private responseProcessor!: ResponseProcessor;

  constructor(config: DataCenterIntegrationConfig) {
    this.config = config;
    this.initializeComponents();
  }

  private initializeComponents(): void {
    this.logger.info('Initializing Bitbucket Data Center integration components');

    // Initialize API client
    this.apiClient = new ApiClient({
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'bitbucket-mcp-server/1.0.0',
      },
    });

    // Initialize rate limiter
    this.rateLimiter = new RateLimiter({
      requestsPerMinute: this.config.rateLimitConfig.requestsPerMinute,
      burstLimit: this.config.rateLimitConfig.burstLimit,
    });

    // Initialize retry handler
    this.retryHandler = new RetryHandler({
      maxAttempts: this.config.retryConfig.maxAttempts,
      baseDelay: this.config.retryConfig.baseDelay,
      maxDelay: this.config.retryConfig.maxDelay,
      backoffMultiplier: this.config.retryConfig.backoffMultiplier,
      retryableStatusCodes: [429, 500, 502, 503, 504],
      retryableErrors: [
        'rate limit',
        'timeout',
        'network error',
        'connection refused',
        'internal server error',
        'service unavailable',
      ],
    });

    // Initialize error mapper
    this.errorMapper = new ErrorMapper();

    // Initialize response processor
    this.responseProcessor = new ResponseProcessor({
      enablePagination: this.config.responseProcessorConfig.enablePagination,
      enableMetadata: this.config.responseProcessorConfig.enableMetadata,
      enableErrorCollection: this.config.responseProcessorConfig.enableErrorCollection,
      enableWarningCollection: this.config.responseProcessorConfig.enableWarningCollection,
      maxResponseSize: this.config.responseProcessorConfig.maxResponseSize,
      timeout: this.config.timeout,
    });

    this.logger.info('Bitbucket Data Center integration components initialized successfully');
  }

  public async authenticate(credentials: {
    username: string;
    password: string;
  }): Promise<ProcessedResponse<{ access_token: string; token_type: string }>> {
    this.logger.info('Authenticating with Bitbucket Data Center', {
      username: credentials.username,
    });

    try {
      // Wait for rate limiter
      await this.rateLimiter.waitForSlot();

      // Execute authentication with retry
      const response = await this.retryHandler.executeWithRetry(async () => {
        return await this.apiClient.post('/rest/api/1.0/oauth/token', {
          grant_type: 'client_credentials',
          client_id: credentials.username,
          client_secret: credentials.password,
        });
      }, 'bitbucket-datacenter-authentication');

      // Process response
      const processedResponse = await this.responseProcessor.processResponse(
        response,
        'bitbucket-datacenter'
      );

      this.logger.info('Authentication successful', {
        tokenType: (processedResponse.data as any)?.token_type,
        hasAccessToken: !!(processedResponse.data as any)?.access_token,
      });

      return processedResponse as ProcessedResponse<{ access_token: string; token_type: string }>;
    } catch (error) {
      this.logger.error('Authentication failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const mappedError = this.errorMapper.mapError(
        error instanceof Error ? error : new Error('Unknown error')
      );
      throw mappedError;
    }
  }

  public async getCurrentUser(accessToken: string): Promise<ProcessedResponse<any>> {
    this.logger.info('Getting current user from Bitbucket Data Center');

    try {
      // Wait for rate limiter
      await this.rateLimiter.waitForSlot();

      // Execute request with retry
      const response = await this.retryHandler.executeWithRetry(async () => {
        return await this.apiClient.get('/rest/api/1.0/users/current', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      }, 'bitbucket-datacenter-get-current-user');

      // Process response
      const processedResponse = await this.responseProcessor.processResponse(
        response,
        'bitbucket-datacenter'
      );

      this.logger.info('Current user retrieved successfully', {
        username: (processedResponse.data as any)?.name,
        displayName: (processedResponse.data as any)?.displayName,
      });

      return processedResponse;
    } catch (error) {
      this.logger.error('Failed to get current user', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const mappedError = this.errorMapper.mapError(
        error instanceof Error ? error : new Error('Unknown error')
      );
      throw mappedError;
    }
  }

  public async getProjects(
    accessToken: string,
    options: {
      page?: number;
      size?: number;
      sort?: string;
      q?: string;
    } = {}
  ): Promise<ProcessedResponse<any[]>> {
    this.logger.info('Getting projects from Bitbucket Data Center', {
      page: options.page,
      size: options.size,
      sort: options.sort,
      hasQuery: !!options.q,
    });

    try {
      // Wait for rate limiter
      await this.rateLimiter.waitForSlot();

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (options.page) queryParams.append('start', (options.page - 1).toString());
      if (options.size) queryParams.append('limit', options.size.toString());
      if (options.sort) queryParams.append('sort', options.sort);
      if (options.q) queryParams.append('name', options.q);

      const queryString = queryParams.toString();
      const url = `/rest/api/1.0/projects${queryString ? `?${queryString}` : ''}`;

      // Execute request with retry
      const response = await this.retryHandler.executeWithRetry(async () => {
        return await this.apiClient.get(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      }, 'bitbucket-datacenter-get-projects');

      // Process response
      const processedResponse = await this.responseProcessor.processResponse(
        response,
        'bitbucket-datacenter'
      );

      this.logger.info('Projects retrieved successfully', {
        count: (processedResponse.data as any[])?.length || 0,
        hasPagination: !!processedResponse.metadata.pagination,
      });

      return processedResponse as ProcessedResponse<any[]>;
    } catch (error) {
      this.logger.error('Failed to get projects', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const mappedError = this.errorMapper.mapError(
        error instanceof Error ? error : new Error('Unknown error')
      );
      throw mappedError;
    }
  }

  public async getProject(
    accessToken: string,
    projectKey: string
  ): Promise<ProcessedResponse<any>> {
    this.logger.info('Getting project from Bitbucket Data Center', {
      projectKey,
    });

    try {
      // Wait for rate limiter
      await this.rateLimiter.waitForSlot();

      // Execute request with retry
      const response = await this.retryHandler.executeWithRetry(async () => {
        return await this.apiClient.get(`/rest/api/1.0/projects/${projectKey}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      }, 'bitbucket-datacenter-get-project');

      // Process response
      const processedResponse = await this.responseProcessor.processResponse(
        response,
        'bitbucket-datacenter'
      );

      this.logger.info('Project retrieved successfully', {
        key: (processedResponse.data as any)?.key,
        name: (processedResponse.data as any)?.name,
      });

      return processedResponse;
    } catch (error) {
      this.logger.error('Failed to get project', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const mappedError = this.errorMapper.mapError(
        error instanceof Error ? error : new Error('Unknown error')
      );
      throw mappedError;
    }
  }

  public async getRepositories(
    accessToken: string,
    projectKey: string,
    options: {
      page?: number;
      size?: number;
      sort?: string;
      q?: string;
    } = {}
  ): Promise<ProcessedResponse<any[]>> {
    this.logger.info('Getting repositories from Bitbucket Data Center', {
      projectKey,
      page: options.page,
      size: options.size,
      sort: options.sort,
      hasQuery: !!options.q,
    });

    try {
      // Wait for rate limiter
      await this.rateLimiter.waitForSlot();

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (options.page) queryParams.append('start', (options.page - 1).toString());
      if (options.size) queryParams.append('limit', options.size.toString());
      if (options.sort) queryParams.append('sort', options.sort);
      if (options.q) queryParams.append('name', options.q);

      const queryString = queryParams.toString();
      const url = `/rest/api/1.0/projects/${projectKey}/repos${queryString ? `?${queryString}` : ''}`;

      // Execute request with retry
      const response = await this.retryHandler.executeWithRetry(async () => {
        return await this.apiClient.get(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      }, 'bitbucket-datacenter-get-repositories');

      // Process response
      const processedResponse = await this.responseProcessor.processResponse(
        response,
        'bitbucket-datacenter'
      );

      this.logger.info('Repositories retrieved successfully', {
        count: (processedResponse.data as any[])?.length || 0,
        hasPagination: !!processedResponse.metadata.pagination,
      });

      return processedResponse as ProcessedResponse<any[]>;
    } catch (error) {
      this.logger.error('Failed to get repositories', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const mappedError = this.errorMapper.mapError(
        error instanceof Error ? error : new Error('Unknown error')
      );
      throw mappedError;
    }
  }

  public async getRepository(
    accessToken: string,
    projectKey: string,
    repoSlug: string
  ): Promise<ProcessedResponse<any>> {
    this.logger.info('Getting repository from Bitbucket Data Center', {
      projectKey,
      repoSlug,
    });

    try {
      // Wait for rate limiter
      await this.rateLimiter.waitForSlot();

      // Execute request with retry
      const response = await this.retryHandler.executeWithRetry(async () => {
        return await this.apiClient.get(`/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      }, 'bitbucket-datacenter-get-repository');

      // Process response
      const processedResponse = await this.responseProcessor.processResponse(
        response,
        'bitbucket-datacenter'
      );

      this.logger.info('Repository retrieved successfully', {
        name: (processedResponse.data as any)?.name,
        slug: (processedResponse.data as any)?.slug,
      });

      return processedResponse;
    } catch (error) {
      this.logger.error('Failed to get repository', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const mappedError = this.errorMapper.mapError(
        error instanceof Error ? error : new Error('Unknown error')
      );
      throw mappedError;
    }
  }

  public async getPullRequests(
    accessToken: string,
    projectKey: string,
    repoSlug: string,
    options: {
      page?: number;
      size?: number;
      state?: string;
      sort?: string;
    } = {}
  ): Promise<ProcessedResponse<any[]>> {
    this.logger.info('Getting pull requests from Bitbucket Data Center', {
      projectKey,
      repoSlug,
      page: options.page,
      size: options.size,
      state: options.state,
      sort: options.sort,
    });

    try {
      // Wait for rate limiter
      await this.rateLimiter.waitForSlot();

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (options.page) queryParams.append('start', (options.page - 1).toString());
      if (options.size) queryParams.append('limit', options.size.toString());
      if (options.state) queryParams.append('state', options.state);
      if (options.sort) queryParams.append('sort', options.sort);

      const queryString = queryParams.toString();
      const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests${queryString ? `?${queryString}` : ''}`;

      // Execute request with retry
      const response = await this.retryHandler.executeWithRetry(async () => {
        return await this.apiClient.get(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      }, 'bitbucket-datacenter-get-pull-requests');

      // Process response
      const processedResponse = await this.responseProcessor.processResponse(
        response,
        'bitbucket-datacenter'
      );

      this.logger.info('Pull requests retrieved successfully', {
        count: (processedResponse.data as any[])?.length || 0,
        hasPagination: !!processedResponse.metadata.pagination,
      });

      return processedResponse as ProcessedResponse<any[]>;
    } catch (error) {
      this.logger.error('Failed to get pull requests', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const mappedError = this.errorMapper.mapError(
        error instanceof Error ? error : new Error('Unknown error')
      );
      throw mappedError;
    }
  }

  public async getPullRequest(
    accessToken: string,
    projectKey: string,
    repoSlug: string,
    pullRequestId: number
  ): Promise<ProcessedResponse<any>> {
    this.logger.info('Getting pull request from Bitbucket Data Center', {
      projectKey,
      repoSlug,
      pullRequestId,
    });

    try {
      // Wait for rate limiter
      await this.rateLimiter.waitForSlot();

      // Execute request with retry
      const response = await this.retryHandler.executeWithRetry(async () => {
        return await this.apiClient.get(
          `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
      }, 'bitbucket-datacenter-get-pull-request');

      // Process response
      const processedResponse = await this.responseProcessor.processResponse(
        response,
        'bitbucket-datacenter'
      );

      this.logger.info('Pull request retrieved successfully', {
        id: (processedResponse.data as any)?.id,
        title: (processedResponse.data as any)?.title,
      });

      return processedResponse;
    } catch (error) {
      this.logger.error('Failed to get pull request', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const mappedError = this.errorMapper.mapError(
        error instanceof Error ? error : new Error('Unknown error')
      );
      throw mappedError;
    }
  }

  public async createPullRequest(
    accessToken: string,
    projectKey: string,
    repoSlug: string,
    pullRequestData: {
      title: string;
      description?: string;
      fromRef: {
        id: string;
        repository: {
          project: {
            key: string;
          };
          slug: string;
        };
      };
      toRef: {
        id: string;
        repository: {
          project: {
            key: string;
          };
          slug: string;
        };
      };
      reviewers?: Array<{ user: { name: string } }>;
    }
  ): Promise<ProcessedResponse<any>> {
    this.logger.info('Creating pull request in Bitbucket Data Center', {
      projectKey,
      repoSlug,
      title: pullRequestData.title,
      fromRef: pullRequestData.fromRef.id,
      toRef: pullRequestData.toRef.id,
    });

    try {
      // Wait for rate limiter
      await this.rateLimiter.waitForSlot();

      // Execute request with retry
      const response = await this.retryHandler.executeWithRetry(async () => {
        return await this.apiClient.post(
          `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests`,
          pullRequestData,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
      }, 'bitbucket-datacenter-create-pull-request');

      // Process response
      const processedResponse = await this.responseProcessor.processResponse(
        response,
        'bitbucket-datacenter'
      );

      this.logger.info('Pull request created successfully', {
        id: (processedResponse.data as any)?.id,
        title: (processedResponse.data as any)?.title,
      });

      return processedResponse;
    } catch (error) {
      this.logger.error('Failed to create pull request', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const mappedError = this.errorMapper.mapError(
        error instanceof Error ? error : new Error('Unknown error')
      );
      throw mappedError;
    }
  }

  public async getStats(): Promise<{
    rateLimiter: any;
    retryHandler: any;
    errorMapper: any;
    responseProcessor: any;
  }> {
    return {
      rateLimiter: this.rateLimiter.getStats(),
      retryHandler: this.retryHandler.getStats(),
      errorMapper: this.errorMapper.getMappingStats(),
      responseProcessor: this.responseProcessor.getStats(),
    };
  }

  public async updateConfig(newConfig: Partial<DataCenterIntegrationConfig>): Promise<void> {
    this.logger.info('Updating Bitbucket Data Center integration config', {
      hasNewConfig: !!newConfig,
    });

    if (newConfig.retryConfig) {
      this.retryHandler.setConfig(newConfig.retryConfig);
    }

    if (newConfig.rateLimitConfig) {
      this.rateLimiter.setConfig(newConfig.rateLimitConfig);
    }

    if (newConfig.responseProcessorConfig) {
      this.responseProcessor.setConfig(newConfig.responseProcessorConfig);
    }

    this.config = { ...this.config, ...newConfig };

    this.logger.info('Bitbucket Data Center integration config updated successfully');
  }
}
