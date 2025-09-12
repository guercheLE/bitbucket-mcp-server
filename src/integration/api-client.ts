import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { loggerService } from '@/services/logger.service';
import { BitbucketConfig } from '@/types/config';
import { createToolError } from '@/services/error-handler.service';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    status?: number;
  };
}

// Tipos específicos para respostas paginadas do Bitbucket
export interface PaginatedResponse<T> {
  values: T[];
  size: number;
  isLastPage?: boolean;
  nextPageStart?: number;
  next?: string;
  previous?: string;
}

// Tipos específicos para respostas de dados únicos
export interface SingleResponse<T> {
  data: T;
}

// Helper para fazer type assertion de respostas unknown
export function assertApiResponse<T>(data: unknown): T {
  return data as T;
}

// Helper específico para respostas com estrutura { data: T }
export function assertApiDataResponse<T>(data: unknown): { data: T } {
  return data as { data: T };
}

// Helper para respostas paginadas do Bitbucket
export function assertPaginatedResponse<T>(data: unknown): {
  values: T[];
  size: number;
  isLastPage?: boolean;
  nextPageStart?: number;
  next?: string;
  previous?: string;
} {
  return data as {
    values: T[];
    size: number;
    isLastPage?: boolean;
    nextPageStart?: number;
    next?: string;
    previous?: string;
  };
}

// Helper específico para respostas paginadas com estrutura { data: { values: T[], ... } }
export function assertPaginatedDataResponse<T>(data: unknown): {
  data: {
    values: T[];
    size: number;
    isLastPage?: boolean;
    nextPageStart?: number;
    next?: string;
    previous?: string;
  };
} {
  return data as {
    data: {
      values: T[];
      size: number;
      isLastPage?: boolean;
      nextPageStart?: number;
      next?: string;
      previous?: string;
    };
  };
}

// Helper específico para respostas de dados únicos
export function assertSingleDataResponse<T>(data: unknown): { data: T } {
  return data as { data: T };
}

export class ApiClient {
  private logger = loggerService.getLogger('api-client');
  private axiosInstance: AxiosInstance;
  private config: BitbucketConfig;

  constructor(config: { baseUrl: string; timeout: number; headers?: Record<string, string> }) {
    this.config = {
      baseUrl: config.baseUrl,
      serverType: 'cloud',
      timeouts: {
        read: config.timeout,
        write: config.timeout,
        connect: config.timeout,
      },
      auth: {
        type: 'oauth',
        credentials: {
          clientId: '',
          clientSecret: '',
          tokenType: 'Bearer',
        },
      },
      rateLimit: {
        requestsPerMinute: 60,
        burstLimit: 10,
        retryAfter: 1000,
      },
    };
    this.axiosInstance = this.createAxiosInstance();
  }

  private createAxiosInstance(): AxiosInstance {
    const instance = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeouts.read,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Request interceptor for authentication
    instance.interceptors.request.use(
      config => {
        this.logger.debug('API request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
        });

        // Add authentication headers
        this.addAuthentication(config);

        return config;
      },
      error => {
        this.logger.error('Request interceptor error', {
          error: error.message,
        });
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    instance.interceptors.response.use(
      response => {
        this.logger.debug('API response', {
          status: response.status,
          url: response.config.url,
        });

        return response;
      },
      error => {
        this.logger.error('API response error', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
        });

        return Promise.reject(this.transformError(error));
      }
    );

    return instance;
  }

  private addAuthentication(config: AxiosRequestConfig): void {
    if (this.config.auth.type === 'basic') {
      const credentials = this.config.auth.credentials as { username: string; password: string };
      if ('username' in credentials && 'password' in credentials) {
        const auth = Buffer.from(`${credentials.username}:${credentials.password}`).toString(
          'base64'
        );
        config.headers = {
          ...config.headers,
          Authorization: `Basic ${auth}`,
        };
      }
    } else if (this.config.auth.type === 'api_token') {
      const credentials = this.config.auth.credentials as { username: string; token: string };
      if ('username' in credentials && 'token' in credentials) {
        const auth = Buffer.from(`${credentials.username}:${credentials.token}`).toString('base64');
        config.headers = {
          ...config.headers,
          Authorization: `Basic ${auth}`,
        };
      }
    } else if (this.config.auth.type === 'oauth') {
      const credentials = this.config.auth.credentials as { accessToken?: string };
      if ('accessToken' in credentials && credentials.accessToken) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${credentials.accessToken}`,
        };
      }
    }
  }

  private transformError(error: unknown): Error {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as {
        response?: { status: number; data?: { error?: { message?: string }; message?: string } };
        config?: { url?: string; method?: string };
      };

      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data;

        let message = `HTTP ${status}`;
        if (data?.error?.message) {
          message = data.error.message;
        } else if (data?.message) {
          message = data.message;
        }

        const toolError = createToolError('api-client', 'request', new Error(message), {
          status,
          url: axiosError.config?.url,
          method: axiosError.config?.method,
        });

        return new Error(toolError.message);
      }
    }

    if (error && typeof error === 'object' && 'request' in error) {
      const axiosError = error as { config?: { url?: string } };
      const toolError = createToolError('api-client', 'network', new Error('Network error'), {
        url: axiosError.config?.url,
      });
      return new Error(toolError.message);
    }

    const axiosError = error as { config?: { url?: string } };
    const toolError = createToolError(
      'api-client',
      'unknown',
      error instanceof Error ? error : new Error('Unknown error'),
      {
        url: axiosError.config?.url,
      }
    );
    return new Error(toolError.message);
  }

  public async get<T = unknown>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      this.logger.info('Making GET request', { endpoint, config });

      const response: AxiosResponse<T> = await this.axiosInstance.get(endpoint, config);

      return response.data;
    } catch (error) {
      this.logger.error('GET request failed', {
        endpoint,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  public async post<T = unknown>(
    endpoint: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      this.logger.info('Making POST request', { endpoint });

      const response: AxiosResponse<T> = await this.axiosInstance.post(endpoint, data, config);

      return response.data;
    } catch (error) {
      this.logger.error('POST request failed', {
        endpoint,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  public async put<T = unknown>(
    endpoint: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      this.logger.info('Making PUT request', { endpoint });

      const response: AxiosResponse<T> = await this.axiosInstance.put(endpoint, data, config);

      return response.data;
    } catch (error) {
      this.logger.error('PUT request failed', {
        endpoint,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  public async delete<T = unknown>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      this.logger.info('Making DELETE request', { endpoint, config });

      const response: AxiosResponse<T> = await this.axiosInstance.delete(endpoint, config);

      return response.data;
    } catch (error) {
      this.logger.error('DELETE request failed', {
        endpoint,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  public async patch<T = unknown>(
    endpoint: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      this.logger.info('Making PATCH request', { endpoint });

      const response: AxiosResponse<T> = await this.axiosInstance.patch(endpoint, data, config);

      return response.data;
    } catch (error) {
      this.logger.error('PATCH request failed', {
        endpoint,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  public updateConfig(newConfig: {
    baseUrl: string;
    timeout: number;
    headers?: Record<string, string>;
  }): void {
    this.logger.info('Updating API client configuration');

    this.config = {
      baseUrl: newConfig.baseUrl,
      serverType: 'cloud',
      timeouts: {
        read: newConfig.timeout,
        write: newConfig.timeout,
        connect: newConfig.timeout,
      },
      auth: {
        type: 'oauth',
        credentials: {
          clientId: '',
          clientSecret: '',
          tokenType: 'Bearer',
        },
      },
      rateLimit: {
        requestsPerMinute: 60,
        burstLimit: 10,
        retryAfter: 1000,
      },
    };
    this.axiosInstance = this.createAxiosInstance();
  }

  public getConfig(): BitbucketConfig {
    return this.config;
  }
}
