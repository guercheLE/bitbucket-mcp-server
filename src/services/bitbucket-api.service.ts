import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { BitbucketConfig } from '@/types/config';
import { OperationResult, createSuccessResult, createErrorResult } from '@/types/errors';
import { loggerService } from './logger.service';
import { errorHandlerService } from './error-handler.service';

export interface ApiRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  requestId: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

export class BitbucketAPIService {
  private static instance: BitbucketAPIService;
  private clients: Map<string, AxiosInstance> = new Map();
  private rateLimitInfo: Map<string, RateLimitInfo> = new Map();
  private logger = loggerService.getLogger('bitbucket-api');

  private constructor() {}

  public static getInstance(): BitbucketAPIService {
    if (!BitbucketAPIService.instance) {
      BitbucketAPIService.instance = new BitbucketAPIService();
    }
    return BitbucketAPIService.instance;
  }

  public async request(
    config: BitbucketConfig,
    options: ApiRequestOptions
  ): Promise<OperationResult> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      this.logger.debug('Making API request', {
        requestId,
        method: options.method,
        endpoint: options.endpoint,
        serverType: config.serverType,
      });

      const client = this.getOrCreateClient(config);
      const response = await this.executeRequest(client, options, requestId);

      const duration = Date.now() - startTime;

      loggerService.logApiCall(
        'bitbucket-api',
        `${options.method} ${options.endpoint}`,
        true,
        duration,
        { requestId, serverType: config.serverType }
      );

      return createSuccessResult({
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: this.extractHeaders(response.headers),
        requestId,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      const apiError = errorHandlerService.handleError(error, {
        operation: `${options.method} ${options.endpoint}`,
        requestId,
        serverType: config.serverType,
      });

      loggerService.logApiCall(
        'bitbucket-api',
        `${options.method} ${options.endpoint}`,
        false,
        duration,
        { requestId, serverType: config.serverType, error: apiError.message }
      );

      return createErrorResult(apiError);
    }
  }

  public async get(
    config: BitbucketConfig,
    endpoint: string,
    params?: Record<string, any>
  ): Promise<OperationResult> {
    return this.request(config, {
      method: 'GET',
      endpoint,
      params: params || {},
    });
  }

  public async post(
    config: BitbucketConfig,
    endpoint: string,
    data?: any
  ): Promise<OperationResult> {
    return this.request(config, {
      method: 'POST',
      endpoint,
      data,
    });
  }

  public async put(
    config: BitbucketConfig,
    endpoint: string,
    data?: any
  ): Promise<OperationResult> {
    return this.request(config, {
      method: 'PUT',
      endpoint,
      data,
    });
  }

  public async delete(config: BitbucketConfig, endpoint: string): Promise<OperationResult> {
    return this.request(config, {
      method: 'DELETE',
      endpoint,
    });
  }

  public async patch(
    config: BitbucketConfig,
    endpoint: string,
    data?: any
  ): Promise<OperationResult> {
    return this.request(config, {
      method: 'PATCH',
      endpoint,
      data,
    });
  }

  public getRateLimitInfo(config: BitbucketConfig): RateLimitInfo | null {
    const key = this.getClientKey(config);
    return this.rateLimitInfo.get(key) || null;
  }

  public isRateLimited(config: BitbucketConfig): boolean {
    const rateLimitInfo = this.getRateLimitInfo(config);
    return rateLimitInfo ? rateLimitInfo.remaining <= 0 : false;
  }

  public getRetryAfter(config: BitbucketConfig): number | null {
    const rateLimitInfo = this.getRateLimitInfo(config);
    return rateLimitInfo?.retryAfter || null;
  }

  private getOrCreateClient(config: BitbucketConfig): AxiosInstance {
    const key = this.getClientKey(config);

    if (!this.clients.has(key)) {
      this.clients.set(key, this.createClient(config));
    }

    return this.clients.get(key)!;
  }

  private createClient(config: BitbucketConfig): AxiosInstance {
    const client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeouts.read,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'Bitbucket-MCP-Server/1.0.0',
      },
    });

    // Add request interceptor for authentication
    client.interceptors.request.use(
      async requestConfig => {
        const authHeader = await this.getAuthHeader(config);
        if (authHeader) {
          requestConfig.headers.Authorization = authHeader;
        }
        return requestConfig;
      },
      error => Promise.reject(error)
    );

    // Add response interceptor for rate limiting and error handling
    client.interceptors.response.use(
      response => {
        this.updateRateLimitInfo(config, response);
        return response;
      },
      async error => {
        if (error.response?.status === 429) {
          await this.handleRateLimit(config, error);
        }
        return Promise.reject(error);
      }
    );

    return client;
  }

  private async getAuthHeader(config: BitbucketConfig): Promise<string | null> {
    try {
      switch (config.auth.type) {
        case 'oauth': {
          const oauthCreds = config.auth.credentials as any;
          if (oauthCreds.accessToken) {
            return `Bearer ${oauthCreds.accessToken}`;
          }
          break;
        }
        case 'app_password': {
          const appPasswordCreds = config.auth.credentials as any;
          const appPasswordAuth = Buffer.from(
            `${appPasswordCreds.username}:${appPasswordCreds.appPassword}`
          ).toString('base64');
          return `Basic ${appPasswordAuth}`;
        }
        case 'api_token': {
          const apiTokenCreds = config.auth.credentials as any;
          const apiTokenAuth = Buffer.from(
            `${apiTokenCreds.username}:${apiTokenCreds.token}`
          ).toString('base64');
          return `Basic ${apiTokenAuth}`;
        }
        case 'basic': {
          const basicCreds = config.auth.credentials as any;
          const basicAuth = Buffer.from(`${basicCreds.username}:${basicCreds.password}`).toString(
            'base64'
          );
          return `Basic ${basicAuth}`;
        }
      }
    } catch (error) {
      this.logger.warn('Failed to create auth header', {
        authType: config.auth.type,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return null;
  }

  private async executeRequest(
    client: AxiosInstance,
    options: ApiRequestOptions,
    requestId: string
  ): Promise<AxiosResponse> {
    const requestConfig: AxiosRequestConfig = {
      method: options.method,
      url: options.endpoint,
      data: options.data,
      params: options.params,
      headers: {
        'X-Request-ID': requestId,
        ...options.headers,
      },
      timeout: options.timeout || 30000,
    };

    let retries = options.retries || 3;
    let lastError: any;

    while (retries > 0) {
      try {
        return await client.request(requestConfig);
      } catch (error) {
        lastError = error;
        retries--;

        if (retries > 0 && this.shouldRetry(error)) {
          const delay = this.getRetryDelay(error);
          this.logger.debug('Retrying request after delay', {
            requestId,
            retries,
            delay,
            error: error instanceof Error ? error.message : String(error),
          });

          await this.sleep(delay);
        } else {
          break;
        }
      }
    }

    throw lastError;
  }

  private shouldRetry(error: any): boolean {
    if (!error.response) {
      // Network errors
      return true;
    }

    const status = error.response.status;
    return status >= 500 || status === 429 || status === 408;
  }

  private getRetryDelay(error: any): number {
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      return retryAfter ? parseInt(retryAfter) * 1000 : 1000;
    }

    // Exponential backoff for other retryable errors
    return 1000;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private updateRateLimitInfo(config: BitbucketConfig, response: AxiosResponse): void {
    const key = this.getClientKey(config);
    const headers = response.headers;

    const limit = parseInt(headers['x-ratelimit-limit'] || '0');
    const remaining = parseInt(headers['x-ratelimit-remaining'] || '0');
    const resetTime = headers['x-ratelimit-reset'];

    if (limit > 0) {
      this.rateLimitInfo.set(key, {
        limit,
        remaining,
        resetTime: resetTime ? new Date(parseInt(resetTime) * 1000) : new Date(),
      });
    }
  }

  private async handleRateLimit(config: BitbucketConfig, error: any): Promise<void> {
    const retryAfter = error.response?.headers['retry-after'];
    const delay = retryAfter ? parseInt(retryAfter) * 1000 : 60000; // Default 1 minute

    this.logger.warn('Rate limit exceeded', {
      serverType: config.serverType,
      retryAfter: delay,
    });

    loggerService.logRateLimit(
      'bitbucket-api',
      this.rateLimitInfo.get(this.getClientKey(config))?.remaining || 0,
      new Date(Date.now() + delay),
      { serverType: config.serverType }
    );

    // Update rate limit info
    const key = this.getClientKey(config);
    this.rateLimitInfo.set(key, {
      limit: 0,
      remaining: 0,
      resetTime: new Date(Date.now() + delay),
      retryAfter: delay,
    });
  }

  private extractHeaders(headers: any): Record<string, string> {
    const extracted: Record<string, string> = {};

    for (const [key, value] of Object.entries(headers)) {
      if (typeof value === 'string') {
        extracted[key] = value;
      } else if (Array.isArray(value) && value.length > 0) {
        extracted[key] = value[0] as string;
      }
    }

    return extracted;
  }

  private getClientKey(config: BitbucketConfig): string {
    return `${config.baseUrl}:${config.serverType}:${config.auth.type}`;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public clearClients(): void {
    this.clients.clear();
    this.rateLimitInfo.clear();
    this.logger.info('Cleared all API clients and rate limit info');
  }

  public getClientCount(): number {
    return this.clients.size;
  }

  public getActiveClients(): string[] {
    return Array.from(this.clients.keys());
  }
}

// Export singleton instance
export const bitbucketAPIService = BitbucketAPIService.getInstance();
