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
import { BitbucketAuthenticatedClient } from './bitbucket-authenticated-client';
/**
 * Bitbucket API Manager Class
 * Manages multiple Bitbucket API instances
 */
export class BitbucketAPIManager extends EventEmitter {
    instances = new Map();
    instanceConfigs = new Map();
    healthStatus = new Map();
    healthCheckIntervals = new Map();
    requestCounters = new Map();
    constructor() {
        super();
        this.setupEventHandlers();
    }
    // ============================================================================
    // Instance Management
    // ============================================================================
    /**
     * Add Bitbucket instance
     */
    addInstance(config) {
        try {
            // Create API client for this instance
            const client = new BitbucketAuthenticatedClient(config);
            // Store instance and configuration
            this.instances.set(config.id, client);
            this.instanceConfigs.set(config.id, config);
            this.requestCounters.set(config.id, 0);
            // Initialize health status
            this.healthStatus.set(config.id, {
                instanceId: config.id,
                isHealthy: true,
                lastCheck: new Date(),
                responseTime: 0,
                failureCount: 0
            });
            // Start health monitoring if enabled
            if (config.enabled && config.healthCheckInterval > 0) {
                this.startHealthMonitoring(config.id);
            }
            this.emit('instance:added', {
                instanceId: config.id,
                name: config.name,
                type: config.instanceType,
                enabled: config.enabled
            });
        }
        catch (error) {
            throw new Error(`Failed to add Bitbucket instance: ${error.message}`);
        }
    }
    /**
     * Remove Bitbucket instance
     */
    removeInstance(instanceId) {
        try {
            // Stop health monitoring
            this.stopHealthMonitoring(instanceId);
            // Clear authentication
            const client = this.instances.get(instanceId);
            if (client) {
                client.clearAuthentication();
            }
            // Remove from maps
            this.instances.delete(instanceId);
            this.instanceConfigs.delete(instanceId);
            this.healthStatus.delete(instanceId);
            this.requestCounters.delete(instanceId);
            this.emit('instance:removed', { instanceId });
        }
        catch (error) {
            throw new Error(`Failed to remove Bitbucket instance: ${error.message}`);
        }
    }
    /**
     * Get instance by ID
     */
    getInstance(instanceId) {
        return this.instances.get(instanceId) || null;
    }
    /**
     * Get all instances
     */
    getAllInstances() {
        return new Map(this.instances);
    }
    /**
     * Get enabled instances
     */
    getEnabledInstances() {
        const enabled = new Map();
        for (const [id, client] of this.instances.entries()) {
            const config = this.instanceConfigs.get(id);
            if (config?.enabled) {
                enabled.set(id, client);
            }
        }
        return enabled;
    }
    // ============================================================================
    // Authentication Management
    // ============================================================================
    /**
     * Set authentication for specific instance
     */
    setInstanceAuthentication(instanceId, accessToken, userSession) {
        const client = this.instances.get(instanceId);
        if (!client) {
            throw new Error(`Instance not found: ${instanceId}`);
        }
        client.setAuthentication(accessToken, userSession);
        this.emit('instance:authenticated', {
            instanceId,
            userId: userSession.userId,
            userName: userSession.userName
        });
    }
    /**
     * Set authentication for all instances
     */
    setGlobalAuthentication(accessToken, userSession) {
        for (const [instanceId, client] of this.instances.entries()) {
            const config = this.instanceConfigs.get(instanceId);
            if (config?.enabled) {
                client.setAuthentication(accessToken, userSession);
            }
        }
        this.emit('global:authenticated', {
            userId: userSession.userId,
            userName: userSession.userName,
            instanceCount: this.instances.size
        });
    }
    /**
     * Clear authentication for specific instance
     */
    clearInstanceAuthentication(instanceId) {
        const client = this.instances.get(instanceId);
        if (client) {
            client.clearAuthentication();
            this.emit('instance:authentication-cleared', { instanceId });
        }
    }
    /**
     * Clear authentication for all instances
     */
    clearGlobalAuthentication() {
        for (const [instanceId, client] of this.instances.entries()) {
            client.clearAuthentication();
        }
        this.emit('global:authentication-cleared', { instanceCount: this.instances.size });
    }
    // ============================================================================
    // Request Routing
    // ============================================================================
    /**
     * Make API request with automatic instance selection
     */
    async makeRequest(context, options) {
        try {
            // Select best instance for this request
            const instanceId = this.selectBestInstance(context.preferredInstanceId);
            const client = this.instances.get(instanceId);
            if (!client) {
                throw new Error('No available instances for request');
            }
            // Set authentication for this request
            client.setAuthentication(context.accessToken, context.userSession);
            // Make request
            const response = await client.request({
                method: options.method,
                endpoint: options.endpoint,
                params: options.params,
                data: options.data,
                headers: options.headers
            });
            // Update request counter
            const currentCount = this.requestCounters.get(instanceId) || 0;
            this.requestCounters.set(instanceId, currentCount + 1);
            this.emit('request:completed', {
                instanceId,
                endpoint: options.endpoint,
                method: options.method,
                success: true,
                responseTime: response.metadata.processingTime
            });
            return { instanceId, response };
        }
        catch (error) {
            this.emit('request:failed', {
                endpoint: options.endpoint,
                method: options.method,
                error: error.message,
                timestamp: new Date()
            });
            throw error;
        }
    }
    /**
     * Select best instance for request
     */
    selectBestInstance(preferredInstanceId) {
        // If preferred instance is specified and available, use it
        if (preferredInstanceId && this.isInstanceAvailable(preferredInstanceId)) {
            return preferredInstanceId;
        }
        // Get enabled instances sorted by priority
        const enabledInstances = Array.from(this.instanceConfigs.entries())
            .filter(([_, config]) => config.enabled)
            .sort((a, b) => a[1].priority - b[1].priority);
        if (enabledInstances.length === 0) {
            throw new Error('No enabled instances available');
        }
        // Select instance with lowest request count among healthy instances
        let bestInstance = enabledInstances[0][0];
        let lowestRequestCount = this.requestCounters.get(bestInstance) || 0;
        for (const [instanceId, config] of enabledInstances) {
            const health = this.healthStatus.get(instanceId);
            if (health?.isHealthy) {
                const requestCount = this.requestCounters.get(instanceId) || 0;
                if (requestCount < lowestRequestCount) {
                    bestInstance = instanceId;
                    lowestRequestCount = requestCount;
                }
            }
        }
        return bestInstance;
    }
    /**
     * Check if instance is available
     */
    isInstanceAvailable(instanceId) {
        const config = this.instanceConfigs.get(instanceId);
        const health = this.healthStatus.get(instanceId);
        return !!(config?.enabled && health?.isHealthy);
    }
    // ============================================================================
    // Health Monitoring
    // ============================================================================
    /**
     * Start health monitoring for instance
     */
    startHealthMonitoring(instanceId) {
        const config = this.instanceConfigs.get(instanceId);
        if (!config) {
            return;
        }
        const interval = setInterval(async () => {
            await this.performHealthCheck(instanceId);
        }, config.healthCheckInterval);
        this.healthCheckIntervals.set(instanceId, interval);
    }
    /**
     * Stop health monitoring for instance
     */
    stopHealthMonitoring(instanceId) {
        const interval = this.healthCheckIntervals.get(instanceId);
        if (interval) {
            clearInterval(interval);
            this.healthCheckIntervals.delete(instanceId);
        }
    }
    /**
     * Perform health check for instance
     */
    async performHealthCheck(instanceId) {
        const client = this.instances.get(instanceId);
        const config = this.instanceConfigs.get(instanceId);
        if (!client || !config) {
            return;
        }
        const startTime = Date.now();
        try {
            const isHealthy = await client.testConnectivity();
            const responseTime = Date.now() - startTime;
            const healthStatus = {
                instanceId,
                isHealthy,
                lastCheck: new Date(),
                responseTime,
                failureCount: isHealthy ? 0 : (this.healthStatus.get(instanceId)?.failureCount || 0) + 1
            };
            this.healthStatus.set(instanceId, healthStatus);
            if (isHealthy) {
                this.emit('instance:healthy', { instanceId, responseTime });
            }
            else {
                this.emit('instance:unhealthy', { instanceId, failureCount: healthStatus.failureCount });
            }
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            const currentHealth = this.healthStatus.get(instanceId);
            const healthStatus = {
                instanceId,
                isHealthy: false,
                lastCheck: new Date(),
                responseTime,
                error: error.message,
                failureCount: (currentHealth?.failureCount || 0) + 1
            };
            this.healthStatus.set(instanceId, healthStatus);
            this.emit('instance:health-check-failed', {
                instanceId,
                error: error.message,
                failureCount: healthStatus.failureCount
            });
        }
    }
    /**
     * Get health status for all instances
     */
    getHealthStatus() {
        return new Map(this.healthStatus);
    }
    /**
     * Get health status for specific instance
     */
    getInstanceHealthStatus(instanceId) {
        return this.healthStatus.get(instanceId) || null;
    }
    // ============================================================================
    // Statistics and Monitoring
    // ============================================================================
    /**
     * Get API manager statistics
     */
    getStatistics() {
        const totalInstances = this.instances.size;
        const enabledInstances = Array.from(this.instanceConfigs.values()).filter(config => config.enabled).length;
        const healthyInstances = Array.from(this.healthStatus.values()).filter(health => health.isHealthy).length;
        const totalRequests = Array.from(this.requestCounters.values()).reduce((sum, count) => sum + count, 0);
        const requestCounts = {};
        for (const [instanceId, count] of this.requestCounters.entries()) {
            requestCounts[instanceId] = count;
        }
        return {
            totalInstances,
            enabledInstances,
            healthyInstances,
            totalRequests,
            requestCounts
        };
    }
    // ============================================================================
    // Event Handlers
    // ============================================================================
    setupEventHandlers() {
        // Handle instance events
        for (const [instanceId, client] of this.instances.entries()) {
            client.on('authentication:set', (data) => {
                this.emit('instance:authenticated', { instanceId, ...data });
            });
            client.on('authentication:cleared', () => {
                this.emit('instance:authentication-cleared', { instanceId });
            });
            client.on('request:success', (data) => {
                this.emit('request:success', { instanceId, ...data });
            });
            client.on('request:error', (data) => {
                this.emit('request:error', { instanceId, ...data });
            });
        }
    }
}
//# sourceMappingURL=bitbucket-api-manager.js.map