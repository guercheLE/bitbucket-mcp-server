import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Logger } from './logger.util.js';
import { config } from './config.util.js';
import { DEFAULT_TIMEOUT, MAX_PAGE_SIZE } from './constants.util.js';
import { ScopeValidator } from './scope-validator.util.js';

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, unknown>;
}

export interface PaginatedResponse<T = unknown> {
  values: T[];
  pagelen: number;
  size: number;
  page: number;
  next?: string;
  previous?: string;
}

export interface BitbucketError {
  type: string;
  error: {
    message: string;
    detail?: string;
  };
}

// Types for request data and parameters
export type RequestData = unknown;
export type RequestParams = Record<string, string | number | boolean | undefined>;

export class ApiClient {
  private client: AxiosInstance;
  private logger: Logger;
  private bitbucketType: 'cloud' | 'server';
  private baseUrl: string;
  private credentials: { username: string; password: string; tokenType?: string; scope?: string };
  private retryCount: number = 0;
  private readonly maxRetries: number;

  constructor() {
    this.logger = Logger.forContext('ApiClient');
    this.bitbucketType = config.getBitbucketType();
    this.baseUrl = config.getBaseUrl();
    this.credentials = config.getCredentials();
    this.maxRetries = config.getNumber('API_MAX_RETRIES') || 3;

    // Create axios instance with configuration
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: config.getNumber('API_TIMEOUT') || DEFAULT_TIMEOUT,
      auth: {
        username: this.credentials.username,
        password: this.credentials.password,
      },
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Add request interceptor for logging and scope validation
    this.client.interceptors.request.use(
      config => {
        this.logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`);

        // Validate scopes for specific token types
        this.validateRequestScopes(config);

        return config;
      },
      error => {
        this.logger.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => {
        this.logger.debug(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      async error => {
        if (this.shouldRetry(error) && this.retryCount < this.maxRetries) {
          this.retryCount++;
          this.logger.warn(
            `Retrying request (${this.retryCount}/${this.maxRetries}): ${error.config?.url}`
          );

          // Exponential backoff
          const delay = Math.pow(2, this.retryCount) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));

          return this.client.request(error.config);
        }

        this.retryCount = 0;
        return Promise.reject(this.formatError(error));
      }
    );

    this.logger.info(
      `API Client initialized for Bitbucket ${this.bitbucketType} with ${this.credentials.tokenType || 'basic'} authentication`
    );
  }

  /**
   * Validate request scopes based on token type and operation
   */
  private validateRequestScopes(requestConfig: AxiosRequestConfig): void {
    const methodLogger = this.logger.forMethod('validateRequestScopes');

    // Only validate for specific access tokens
    if (
      !this.credentials.tokenType ||
      !['repository-token', 'project-token', 'workspace-token'].includes(this.credentials.tokenType)
    ) {
      return;
    }

    try {
      const operation = this.getOperationFromRequest(requestConfig);
      if (!operation) {
        return; // Can't determine operation, skip validation
      }

      // Get required scopes for the operation
      const requiredScopes = ScopeValidator.getRequiredScopesForOperation(operation);
      if (requiredScopes.length === 0) {
        return; // No scopes required for this operation
      }

      // For now, we'll log scope requirements since we don't have the actual token scopes
      // In a real implementation, you'd get the token scopes from the token metadata
      methodLogger.debug('Operation requires scopes', {
        operation,
        requiredScopes,
        tokenType: this.credentials.tokenType,
        scope: this.credentials.scope,
      });

      // TODO: Implement actual scope validation when token metadata is available
      // This would require fetching token information from Bitbucket's API
    } catch (error) {
      methodLogger.warn('Failed to validate request scopes', error);
    }
  }

  /**
   * Determine the operation being performed from the request
   */
  private getOperationFromRequest(requestConfig: AxiosRequestConfig): string | null {
    const method = requestConfig.method?.toLowerCase();
    const url = requestConfig.url || '';

    // Repository operations
    if (url.includes('/repositories/')) {
      if (method === 'get') return 'repository:read';
      if (method === 'post' || method === 'put' || method === 'patch') return 'repository:write';
      if (method === 'delete') return 'repository:delete';
    }

    // Pull request operations
    if (url.includes('/pullrequests/')) {
      if (method === 'get') return 'pullrequest:read';
      if (method === 'post' || method === 'put' || method === 'patch') return 'pullrequest:write';
    }

    // Pipeline operations
    if (url.includes('/pipelines/')) {
      if (method === 'get') return 'pipeline:read';
      if (method === 'post' || method === 'put' || method === 'patch') return 'pipeline:write';
    }

    // Webhook operations
    if (url.includes('/hooks/')) {
      if (method === 'get') return 'webhook:read';
      if (method === 'post' || method === 'put' || method === 'patch') return 'webhook:write';
    }

    // Project operations
    if (url.includes('/projects/')) {
      if (method === 'get') return 'project:read';
      if (method === 'post' || method === 'put' || method === 'patch') return 'project:admin';
    }

    return null;
  }

  private shouldRetry(error: { response?: { status: number } }): boolean {
    // Retry on network errors or 5xx server errors
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
  }

  private formatError(error: unknown): BitbucketError {
    if (error && typeof error === 'object' && 'response' in error) {
      // Server responded with error status
      const response = error.response as { status: number; statusText?: string };
      const { status, statusText } = response;

      return {
        type: 'api_error',
        error: {
          message: `HTTP ${status}: ${statusText || 'Unknown error'}`,
          detail: 'Server error response',
        },
      };
    } else if (error && typeof error === 'object' && 'request' in error) {
      // Request was made but no response received
      return {
        type: 'network_error',
        error: {
          message: 'No response received from server',
          detail: 'Network timeout or connection error',
        },
      };
    } else {
      // Something else happened
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? (error as { message: string }).message
          : 'Unknown request error';

      return {
        type: 'request_error',
        error: {
          message: 'Request setup failed',
          detail: errorMessage,
        },
      };
    }
  }

  // Generic HTTP methods
  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get<T>(url, config);
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      };
    } catch (error) {
      throw this.formatError(error);
    }
  }

  async post<T = unknown>(
    url: string,
    data?: RequestData,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post<T>(url, data, config);
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      };
    } catch (error) {
      throw this.formatError(error);
    }
  }

  async put<T = unknown>(
    url: string,
    data?: RequestData,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put<T>(url, data, config);
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      };
    } catch (error) {
      throw this.formatError(error);
    }
  }

  async patch<T = unknown>(
    url: string,
    data?: RequestData,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.patch<T>(url, data, config);
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      };
    } catch (error) {
      throw this.formatError(error);
    }
  }

  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete<T>(url, config);
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      };
    } catch (error) {
      throw this.formatError(error);
    }
  }

  // Pagination helper
  async getAllPages<T = unknown>(
    url: string,
    params: RequestParams = {},
    pageSize: number = MAX_PAGE_SIZE
  ): Promise<T[]> {
    const allResults: T[] = [];
    let currentPage = 1;
    let hasMore = true;

    while (hasMore) {
      const pageParams = {
        ...params,
        page: currentPage,
        pagelen: pageSize,
      };

      try {
        const response = await this.get<PaginatedResponse<T>>(url, { params: pageParams });
        const { values, next } = response.data;

        allResults.push(...values);

        if (next && values.length === pageSize) {
          currentPage++;
        } else {
          hasMore = false;
        }
      } catch (error) {
        this.logger.error(`Failed to fetch page ${currentPage}:`, error);
        hasMore = false;
      }
    }

    return allResults;
  }

  // Utility methods
  getBitbucketType(): 'cloud' | 'server' {
    return this.bitbucketType;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  isCloud(): boolean {
    return this.bitbucketType === 'cloud';
  }

  isServer(): boolean {
    return this.bitbucketType === 'server';
  }

  getTokenType(): string | undefined {
    return this.credentials.tokenType;
  }

  getTokenScope(): string | undefined {
    return this.credentials.scope;
  }

  /**
   * Check if the current token has sufficient scopes for an operation
   */
  hasSufficientScopes(operation: string): boolean {
    // For now, return true since we don't have actual token scopes
    // In a real implementation, this would validate against the actual token scopes
    this.logger.debug('Scope validation not fully implemented yet', { operation });
    return true;
  }

  /**
   * Get authentication information for debugging
   */
  getAuthInfo(): { type: string; scope?: string; platform: string } {
    return {
      type: this.credentials.tokenType || 'basic',
      scope: this.credentials.scope,
      platform: this.bitbucketType,
    };
  }
}
