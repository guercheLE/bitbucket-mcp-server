/**
 * Bitbucket API Manager for Bitbucket MCP Server
 *
 * This module provides centralized management of Bitbucket API clients,
 * supporting multiple instances (Data Center and Cloud), automatic
 * failover, load balancing, and unified API access.
 *
 * Key Features:
 * - Multi-instance API management
 * - Automatic failover and load balancing
 * - Unified API access interface
 * - Instance health monitoring
 * - Request routing and distribution
 *
 * Constitutional Requirements:
 * - High availability
 * - Performance optimization
 * - Comprehensive error handling
 * - Instance management
 */
import { EventEmitter } from 'events';
import { AccessToken, UserSession } from '../../types/auth';
import { BitbucketAuthenticatedClient, BitbucketAPIConfig } from './bitbucket-authenticated-client';
/**
 * Bitbucket Instance Configuration
 */
export interface BitbucketInstanceConfig extends BitbucketAPIConfig {
    /** Unique identifier for this instance */
    id: string;
    /** Human-readable name for this instance */
    name: string;
    /** Instance priority (lower number = higher priority) */
    priority: number;
    /** Whether this instance is enabled */
    enabled: boolean;
    /** Health check interval in milliseconds */
    healthCheckInterval: number;
}
/**
 * Instance Health Status
 */
export interface InstanceHealthStatus {
    /** Instance ID */
    instanceId: string;
    /** Whether instance is healthy */
    isHealthy: boolean;
    /** Last health check timestamp */
    lastCheck: Date;
    /** Response time in milliseconds */
    responseTime: number;
    /** Error message if unhealthy */
    error?: string;
    /** Number of consecutive failures */
    failureCount: number;
}
/**
 * API Request Context
 */
export interface APIRequestContext {
    /** User session information */
    userSession: UserSession;
    /** Access token */
    accessToken: AccessToken;
    /** Preferred instance ID (optional) */
    preferredInstanceId?: string;
    /** Request metadata */
    metadata?: Record<string, any>;
}
/**
 * Bitbucket API Manager Class
 * Manages multiple Bitbucket API instances
 */
export declare class BitbucketAPIManager extends EventEmitter {
    private instances;
    private instanceConfigs;
    private healthStatus;
    private healthCheckIntervals;
    private requestCounters;
    constructor();
    /**
     * Add Bitbucket instance
     */
    addInstance(config: BitbucketInstanceConfig): void;
    /**
     * Remove Bitbucket instance
     */
    removeInstance(instanceId: string): void;
    /**
     * Get instance by ID
     */
    getInstance(instanceId: string): BitbucketAuthenticatedClient | null;
    /**
     * Get all instances
     */
    getAllInstances(): Map<string, BitbucketAuthenticatedClient>;
    /**
     * Get enabled instances
     */
    getEnabledInstances(): Map<string, BitbucketAuthenticatedClient>;
    /**
     * Set authentication for specific instance
     */
    setInstanceAuthentication(instanceId: string, accessToken: AccessToken, userSession: UserSession): void;
    /**
     * Set authentication for all instances
     */
    setGlobalAuthentication(accessToken: AccessToken, userSession: UserSession): void;
    /**
     * Clear authentication for specific instance
     */
    clearInstanceAuthentication(instanceId: string): void;
    /**
     * Clear authentication for all instances
     */
    clearGlobalAuthentication(): void;
    /**
     * Make API request with automatic instance selection
     */
    makeRequest<T = any>(context: APIRequestContext, options: {
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
        endpoint: string;
        params?: Record<string, any>;
        data?: any;
        headers?: Record<string, string>;
    }): Promise<{
        instanceId: string;
        response: any;
    }>;
    /**
     * Select best instance for request
     */
    private selectBestInstance;
    /**
     * Check if instance is available
     */
    private isInstanceAvailable;
    /**
     * Start health monitoring for instance
     */
    private startHealthMonitoring;
    /**
     * Stop health monitoring for instance
     */
    private stopHealthMonitoring;
    /**
     * Perform health check for instance
     */
    private performHealthCheck;
    /**
     * Get health status for all instances
     */
    getHealthStatus(): Map<string, InstanceHealthStatus>;
    /**
     * Get health status for specific instance
     */
    getInstanceHealthStatus(instanceId: string): InstanceHealthStatus | null;
    /**
     * Get API manager statistics
     */
    getStatistics(): {
        totalInstances: number;
        enabledInstances: number;
        healthyInstances: number;
        totalRequests: number;
        requestCounts: Record<string, number>;
    };
    private setupEventHandlers;
}
//# sourceMappingURL=bitbucket-api-manager.d.ts.map