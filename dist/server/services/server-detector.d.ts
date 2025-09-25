/**
 * @fileoverview Server detection service
 *
 * This service implements server detection and selective registration as specified
 * in the Constitution. It automatically detects Bitbucket server type and version
 * and provides fallback strategies.
 *
 * @author Bitbucket MCP Server
 * @version 1.0.0
 * @license LGPL-3.0
 */
/**
 * Server information interface
 */
export interface ServerInfo {
    type: 'datacenter' | 'cloud';
    version: string;
    apiVersion: string;
    baseUrl: string;
    capabilities: string[];
    detected: boolean;
    fallback: boolean;
}
/**
 * Server detection service implementation
 */
export declare class ServerDetector {
    private httpClient;
    private cachedInfo;
    private cacheExpiry;
    private readonly CACHE_TTL;
    constructor(baseUrl: string);
    /**
     * Detect server type and version
     */
    detectServer(): Promise<ServerInfo>;
    /**
     * Perform actual server detection
     */
    private performDetection;
    /**
     * Parse Data Center response
     */
    private parseDataCenterResponse;
    /**
     * Parse Cloud response
     */
    private parseCloudResponse;
    /**
     * Determine Data Center capabilities based on version
     */
    private determineDataCenterCapabilities;
    /**
     * Determine Cloud capabilities
     */
    private determineCloudCapabilities;
    /**
     * Parse version string to comparable number
     */
    private parseVersion;
    /**
     * Check if server supports a specific capability
     */
    hasCapability(capability: string): Promise<boolean>;
    /**
     * Get server type
     */
    getServerType(): Promise<'datacenter' | 'cloud'>;
    /**
     * Get server version
     */
    getServerVersion(): Promise<string>;
    /**
     * Check if server is compatible with minimum version
     */
    isCompatibleWith(minVersion: string): Promise<boolean>;
    /**
     * Clear cache (useful for testing or when server configuration changes)
     */
    clearCache(): void;
    /**
     * Perform health check
     */
    healthCheck(): Promise<{
        healthy: boolean;
        serverInfo?: ServerInfo;
        error?: string;
    }>;
}
//# sourceMappingURL=server-detector.d.ts.map