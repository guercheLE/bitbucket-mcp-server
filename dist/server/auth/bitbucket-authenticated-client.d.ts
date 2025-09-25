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
import { AccessToken, UserSession } from '../../types/auth';
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
export declare class BitbucketAuthenticatedClient extends EventEmitter {
    private config;
    private httpClient;
    private currentToken;
    private userSession;
    private endpointCache;
    constructor(config: BitbucketAPIConfig);
    /**
     * Set authentication token and user session
     */
    setAuthentication(token: AccessToken, userSession: UserSession): void;
    /**
     * Clear authentication
     */
    clearAuthentication(): void;
    /**
     * Check if client is authenticated
     */
    isAuthenticated(): boolean;
    /**
     * Get current authentication status
     */
    getAuthenticationStatus(): {
        isAuthenticated: boolean;
        userId?: string;
        expiresAt?: Date;
    };
    /**
     * Make authenticated API request
     */
    request<T = any>(options: APIRequestOptions): Promise<APIResponse<T>>;
    /**
     * GET request
     */
    get<T = any>(endpoint: string, params?: Record<string, any>): Promise<APIResponse<T>>;
    /**
     * POST request
     */
    post<T = any>(endpoint: string, data?: any, params?: Record<string, any>): Promise<APIResponse<T>>;
    /**
     * PUT request
     */
    put<T = any>(endpoint: string, data?: any, params?: Record<string, any>): Promise<APIResponse<T>>;
    /**
     * DELETE request
     */
    delete<T = any>(endpoint: string, params?: Record<string, any>): Promise<APIResponse<T>>;
    /**
     * PATCH request
     */
    patch<T = any>(endpoint: string, data?: any, params?: Record<string, any>): Promise<APIResponse<T>>;
    /**
     * Discover available API endpoints
     */
    discoverEndpoints(): Promise<Record<string, string>>;
    /**
     * Get cached endpoint URL
     */
    getEndpoint(key: string): string | null;
    /**
     * Test API connectivity
     */
    testConnectivity(): Promise<boolean>;
    /**
     * Get API version information
     */
    getApiVersion(): Promise<{
        version: string;
        build: string;
        buildDate: string;
    }>;
    /**
     * Check API compatibility
     */
    checkCompatibility(): Promise<{
        compatible: boolean;
        issues: string[];
    }>;
    private createHttpClient;
    private makeRequestWithRetry;
    private buildApiUrl;
    private isTokenExpired;
    private generateRequestId;
    private setupEventHandlers;
}
//# sourceMappingURL=bitbucket-authenticated-client.d.ts.map