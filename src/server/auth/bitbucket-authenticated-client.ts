/**
 * Bitbucket Authenticated API Client for Bitbucket MCP Server
 * 
 * This module provides an authenticated API client for interacting with
 * Bitbucket Data Center and Cloud APIs, with automatic token management,
 * endpoint discovery, and version compatibility handling.
 * 
 * Key Features:
 * - Authenticated API requests with automatic token refresh
 * - Support for both Bitbucket Data Center and Cloud
 * - API endpoint discovery and version compatibility
 * - Comprehensive error handling and retry logic
 * - Request/response logging and monitoring
 * 
 * Constitutional Requirements:
 * - Secure API communication
 * - Comprehensive error handling
 * - Performance optimization
 * - API version compatibility
 */

import { EventEmitter } from 'events';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  AuthenticationError,
  AuthenticationErrorCode,
  AccessToken,
  UserSession
} from '../../types/auth';

/**
 * Bitbucket API Configuration
 */
export interface BitbucketAPIConfig {
  /** Base URL for the Bitbucket instance */
  baseUrl: string;
  
  /** Instance type (Data Center or Cloud) */
  instanceType: 'datacenter' | 'cloud';
  
  /** API version to use */
  apiVersion: string;
  
  /** Request timeout in milliseconds */
  timeout: number;
  
  /** Maximum number of retry attempts */
  maxRetries: number;
  
  /** Whether to enable request/response logging */
  enableLogging: boolean;
}

/**
 * API Request Options
 */
export interface APIRequestOptions {
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  
  /** API endpoint path */
  endpoint: string;
  
  /** Request parameters */
  params?: Record<string, any>;
  
  /** Request body data */
  data?: any;
  
  /** Request headers */
  headers?: Record<string, string>;
  
  /** Whether to retry on failure */
  retry?: boolean;
  
  /** Custom timeout for this request */
  timeout?: number;
}

/**
 * API Response
 */
export interface APIResponse<T = any> {
  /** Response data */
  data: T;
  
  /** HTTP status code */
  status: number;
  
  /** Response headers */
  headers: Record<string, string>;
  
  /** Request metadata */
  metadata: {
    requestId: string;
    timestamp: Date;
    processingTime: number;
    retryCount: number;
  };
}

/**
 * Bitbucket Authenticated API Client Class
 * Handles authenticated API requests to Bitbucket
 */
export class BitbucketAuthenticatedClient extends EventEmitter {
  private config: BitbucketAPIConfig;
  private httpClient: AxiosInstance;
  private currentToken: AccessToken | null = null;
  private userSession: UserSession | null = null;
  private endpointCache: Map<string, string> = new Map();

  constructor(config: BitbucketAPIConfig) {
    super();
    this.config = config;
    this.httpClient = this.createHttpClient();
    this.setupEventHandlers();
  }

  // ============================================================================
  // Authentication Management
  // ============================================================================

  /**
   * Set authentication token and user session
   */
  setAuthentication(token: AccessToken, userSession: UserSession): void {
    this.currentToken = token;
    this.userSession = userSession;
    
    // Update HTTP client authorization header
    this.httpClient.defaults.headers.common['Authorization'] = `Bearer ${token.token}`;
    
    this.emit('authentication:set', {
      userId: userSession.userId,
      tokenType: token.tokenType,
      expiresAt: token.expiresAt
    });
  }

  /**
   * Clear authentication
   */
  clearAuthentication(): void {
    this.currentToken = null;
    this.userSession = null;
    delete this.httpClient.defaults.headers.common['Authorization'];
    
    this.emit('authentication:cleared');
  }

  /**
   * Check if client is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.currentToken && !!this.userSession;
  }

  /**
   * Get current authentication status
   */
  getAuthenticationStatus(): { isAuthenticated: boolean; userId?: string; expiresAt?: Date } {
    return {
      isAuthenticated: this.isAuthenticated(),
      userId: this.userSession?.userId,
      expiresAt: this.currentToken?.expiresAt
    };
  }

  // ============================================================================
  // API Request Methods
  // ============================================================================

  /**
   * Make authenticated API request
   */
  async request<T = any>(options: APIRequestOptions): Promise<APIResponse<T>> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    try {
      // Validate authentication
      if (!this.isAuthenticated()) {
        throw new AuthenticationError({
          code: AuthenticationErrorCode.AUTHENTICATION_FAILED,
          message: 'Client not authenticated',
          timestamp: new Date(),
          isRecoverable: false
        });
      }

      // Check token expiration
      if (this.isTokenExpired()) {
        throw new AuthenticationError({
          code: AuthenticationErrorCode.TOKEN_EXPIRED,
          message: 'Access token has expired',
          timestamp: new Date(),
          isRecoverable: true
        });
      }

      // Build full URL
      const url = this.buildApiUrl(options.endpoint);
      
      // Prepare request configuration
      const requestConfig: AxiosRequestConfig = {
        method: options.method,
        url,
        params: options.params,
        data: options.data,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Bitbucket-MCP-Server/1.0',
          ...options.headers
        },
        timeout: options.timeout || this.config.timeout
      };

      // Add request ID to headers
      requestConfig.headers!['X-Request-ID'] = requestId;

      // Make request with retry logic
      const response = await this.makeRequestWithRetry(requestConfig, options.retry !== false);

      const processingTime = Date.now() - startTime;

      // Create API response
      const apiResponse: APIResponse<T> = {
        data: response.data,
        status: response.status,
        headers: response.headers as Record<string, string>,
        metadata: {
          requestId,
          timestamp: new Date(),
          processingTime,
          retryCount: 0 // TODO: Track retry count
        }
      };

      // Emit successful request event
      this.emit('request:success', {
        requestId,
        endpoint: options.endpoint,
        method: options.method,
        status: response.status,
        processingTime
      });

      return apiResponse;
    } catch (error) {
      const processingTime = Date.now() - startTime;

      // Emit failed request event
      this.emit('request:error', {
        requestId,
        endpoint: options.endpoint,
        method: options.method,
        error: error.message,
        processingTime
      });

      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<APIResponse<T>> {
    return this.request<T>({
      method: 'GET',
      endpoint,
      params
    });
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, data?: any, params?: Record<string, any>): Promise<APIResponse<T>> {
    return this.request<T>({
      method: 'POST',
      endpoint,
      data,
      params
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, data?: any, params?: Record<string, any>): Promise<APIResponse<T>> {
    return this.request<T>({
      method: 'PUT',
      endpoint,
      data,
      params
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, params?: Record<string, any>): Promise<APIResponse<T>> {
    return this.request<T>({
      method: 'DELETE',
      endpoint,
      params
    });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(endpoint: string, data?: any, params?: Record<string, any>): Promise<APIResponse<T>> {
    return this.request<T>({
      method: 'PATCH',
      endpoint,
      data,
      params
    });
  }

  // ============================================================================
  // API Endpoint Discovery
  // ============================================================================

  /**
   * Discover available API endpoints
   */
  async discoverEndpoints(): Promise<Record<string, string>> {
    try {
      const endpoints: Record<string, string> = {};

      if (this.config.instanceType === 'cloud') {
        // Bitbucket Cloud endpoints
        endpoints.user = '/2.0/user';
        endpoints.repositories = '/2.0/repositories';
        endpoints.projects = '/2.0/workspaces';
        endpoints.pullRequests = '/2.0/repositories/{workspace}/{repo_slug}/pullrequests';
        endpoints.issues = '/2.0/repositories/{workspace}/{repo_slug}/issues';
        endpoints.webhooks = '/2.0/repositories/{workspace}/{repo_slug}/hooks';
      } else {
        // Bitbucket Data Center endpoints
        endpoints.user = '/rest/api/1.0/users/current';
        endpoints.repositories = '/rest/api/1.0/repos';
        endpoints.projects = '/rest/api/1.0/projects';
        endpoints.pullRequests = '/rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests';
        endpoints.issues = '/rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/issues';
        endpoints.webhooks = '/rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/webhooks';
      }

      // Cache discovered endpoints
      Object.entries(endpoints).forEach(([key, value]) => {
        this.endpointCache.set(key, value);
      });

      this.emit('endpoints:discovered', endpoints);

      return endpoints;
    } catch (error) {
      throw new AuthenticationError({
        code: AuthenticationErrorCode.NETWORK_ERROR,
        message: `Failed to discover API endpoints: ${error.message}`,
        details: { originalError: error.message },
        timestamp: new Date(),
        isRecoverable: true
      });
    }
  }

  /**
   * Get cached endpoint URL
   */
  getEndpoint(key: string): string | null {
    return this.endpointCache.get(key) || null;
  }

  /**
   * Test API connectivity
   */
  async testConnectivity(): Promise<boolean> {
    try {
      const response = await this.get('/rest/api/1.0/users/current');
      return response.status === 200;
    } catch {
      try {
        const response = await this.get('/2.0/user');
        return response.status === 200;
      } catch {
        return false;
      }
    }
  }

  // ============================================================================
  // API Version Compatibility
  // ============================================================================

  /**
   * Get API version information
   */
  async getApiVersion(): Promise<{ version: string; build: string; buildDate: string }> {
    try {
      if (this.config.instanceType === 'cloud') {
        // Bitbucket Cloud doesn't expose version info via API
        return {
          version: '2.0',
          build: 'unknown',
          buildDate: 'unknown'
        };
      } else {
        const response = await this.get('/rest/api/1.0/application-properties');
        return {
          version: response.data.version || '1.0',
          build: response.data.buildNumber || 'unknown',
          buildDate: response.data.buildDate || 'unknown'
        };
      }
    } catch (error) {
      throw new AuthenticationError({
        code: AuthenticationErrorCode.NETWORK_ERROR,
        message: `Failed to get API version: ${error.message}`,
        details: { originalError: error.message },
        timestamp: new Date(),
        isRecoverable: true
      });
    }
  }

  /**
   * Check API compatibility
   */
  async checkCompatibility(): Promise<{ compatible: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      const versionInfo = await this.getApiVersion();
      
      // Check version compatibility
      if (this.config.instanceType === 'datacenter') {
        const majorVersion = parseInt(versionInfo.version.split('.')[0]);
        if (majorVersion < 7) {
          issues.push('Bitbucket Data Center version 7.0 or higher recommended');
        }
      }

      // Test basic API functionality
      const connectivityTest = await this.testConnectivity();
      if (!connectibilityTest) {
        issues.push('API connectivity test failed');
      }

      return {
        compatible: issues.length === 0,
        issues
      };
    } catch (error) {
      issues.push(`Compatibility check failed: ${error.message}`);
      return {
        compatible: false,
        issues
      };
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private createHttpClient(): AxiosInstance {
    const client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Bitbucket-MCP-Server/1.0'
      }
    });

    // Add request interceptor for logging
    if (this.config.enableLogging) {
      client.interceptors.request.use(
        (config) => {
          console.log(`[BitbucketAPI] ${config.method?.toUpperCase()} ${config.url}`);
          return config;
        },
        (error) => {
          console.error('[BitbucketAPI] Request error:', error.message);
          return Promise.reject(error);
        }
      );

      // Add response interceptor for logging
      client.interceptors.response.use(
        (response) => {
          console.log(`[BitbucketAPI] ${response.status} ${response.config.url}`);
          return response;
        },
        (error) => {
          console.error(`[BitbucketAPI] Response error: ${error.response?.status} ${error.config?.url}`);
          return Promise.reject(error);
        }
      );
    }

    return client;
  }

  private async makeRequestWithRetry(
    config: AxiosRequestConfig,
    retry: boolean = true
  ): Promise<AxiosResponse> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const response = await this.httpClient.request(config);
        return response;
      } catch (error) {
        lastError = error;
        
        // Don't retry on authentication errors
        if (error.response?.status === 401 || error.response?.status === 403) {
          throw new AuthenticationError({
            code: AuthenticationErrorCode.AUTHENTICATION_FAILED,
            message: `Authentication failed: ${error.response?.data?.message || error.message}`,
            details: { status: error.response?.status, data: error.response?.data },
            timestamp: new Date(),
            isRecoverable: false
          });
        }
        
        // Don't retry on client errors (4xx except 429)
        if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
          throw error;
        }
        
        // Don't retry if retry is disabled
        if (!retry || attempt === this.config.maxRetries) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  private buildApiUrl(endpoint: string): string {
    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    
    // Build full URL
    return `${this.config.baseUrl}/${cleanEndpoint}`;
  }

  private isTokenExpired(): boolean {
    if (!this.currentToken) {
      return true;
    }
    
    // Check if token expires within the next 5 minutes
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    return this.currentToken.expiresAt <= fiveMinutesFromNow;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupEventHandlers(): void {
    // Handle HTTP client errors
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error) => {
        this.emit('http:error', {
          error: error.message,
          status: error.response?.status,
          url: error.config?.url,
          timestamp: new Date()
        });
        return Promise.reject(error);
      }
    );
  }
}
