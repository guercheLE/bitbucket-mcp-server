/**
 * Transport Factory Implementation
 *
 * Implements multi-transport support for the MCP server infrastructure.
 * This module provides a factory pattern for creating and managing different
 * transport types (stdio, HTTP, SSE) with proper configuration and lifecycle management.
 *
 * Key Features:
 * - Multi-transport support (stdio, HTTP, SSE)
 * - Transport factory pattern with type-safe creation
 * - Configuration validation and management
 * - Transport lifecycle management
 * - Connection pooling and reuse
 * - Error handling and recovery
 * - Performance monitoring and statistics
 * - Automatic transport selection
 *
 * Constitutional Requirements:
 * - Multi-Transport Protocol
 * - MCP Protocol First
 * - Complete API Coverage
 * - Memory efficiency (<1GB limit)
 * - Error handling and logging
 */
import { EventEmitter } from 'events';
import { ProtocolMessage, Transport, TransportConfig, TransportStats, TransportType } from '../types/index.js';
/**
 * Transport Factory Options
 * Configuration options for transport factory
 */
export interface TransportFactoryOptions {
    /** Maximum number of concurrent connections per transport */
    maxConnections?: number;
    /** Connection timeout in milliseconds */
    connectionTimeout?: number;
    /** Request timeout in milliseconds */
    requestTimeout?: number;
    /** Enable connection pooling */
    enablePooling?: boolean;
    /** Enable performance monitoring */
    enableMonitoring?: boolean;
    /** Default transport type */
    defaultTransport?: TransportType;
}
/**
 * Transport Factory Statistics
 * Performance metrics for transport factory
 */
export interface TransportFactoryStats {
    totalTransports: number;
    activeTransports: number;
    totalConnections: number;
    activeConnections: number;
    totalMessages: number;
    failedConnections: number;
    averageResponseTime: number;
    transportsByType: Record<TransportType, number>;
}
/**
 * Stdio Transport Implementation
 * Handles direct process communication via stdin/stdout
 */
declare class StdioTransport extends EventEmitter implements Transport {
    readonly type: TransportType;
    readonly config: TransportConfig;
    isConnected: boolean;
    private inputStream;
    private outputStream;
    private messageQueue;
    private stats;
    constructor(config: TransportConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    send(message: ProtocolMessage): Promise<void>;
    receive(): Promise<ProtocolMessage>;
    isHealthy(): boolean;
    getStats(): TransportStats;
    private setupStreamHandlers;
    private initializeStats;
    onMessage(handler: (message: ProtocolMessage) => void): void;
    onError(handler: (error: Error) => void): void;
}
/**
 * HTTP Transport Implementation
 * Handles HTTP-based communication for REST API integration
 */
declare class HttpTransport extends EventEmitter implements Transport {
    readonly type: TransportType;
    readonly config: TransportConfig;
    isConnected: boolean;
    private server;
    private requestCount;
    private stats;
    constructor(config: TransportConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    send(message: ProtocolMessage): Promise<void>;
    receive(): Promise<ProtocolMessage>;
    isHealthy(): boolean;
    getStats(): TransportStats;
    private handleHttpRequest;
    private initializeStats;
    onMessage(handler: (message: ProtocolMessage) => void): void;
    onError(handler: (error: Error) => void): void;
}
/**
 * SSE Transport Implementation
 * Handles Server-Sent Events for real-time communication
 */
declare class SseTransport extends EventEmitter implements Transport {
    readonly type: TransportType;
    readonly config: TransportConfig;
    isConnected: boolean;
    private server;
    private clients;
    private eventCount;
    private stats;
    constructor(config: TransportConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    send(message: ProtocolMessage): Promise<void>;
    receive(): Promise<ProtocolMessage>;
    isHealthy(): boolean;
    getStats(): TransportStats;
    private handleSseRequest;
    private initializeStats;
    onMessage(handler: (message: ProtocolMessage) => void): void;
    onError(handler: (error: Error) => void): void;
}
/**
 * Transport Factory Implementation
 *
 * Factory class for creating and managing different transport types
 * with proper configuration, lifecycle management, and monitoring.
 */
export declare class TransportFactory extends EventEmitter {
    private transports;
    private options;
    private stats;
    constructor(options?: TransportFactoryOptions);
    /**
     * Create a transport instance
     * Creates and configures a transport based on the provided configuration
     */
    createTransport(config: TransportConfig): Promise<Transport>;
    /**
     * Get transport by ID
     * Retrieves a registered transport by its ID
     */
    getTransport(transportId: string): Transport | undefined;
    /**
     * Get all transports
     * Returns array of all registered transports
     */
    getAllTransports(): Transport[];
    /**
     * Get transports by type
     * Returns transports filtered by type
     */
    getTransportsByType(type: TransportType): Transport[];
    /**
     * Remove transport
     * Properly disposes of a transport and cleans up resources
     */
    removeTransport(transportId: string): Promise<boolean>;
    /**
     * Get factory statistics
     * Returns comprehensive factory performance metrics
     */
    getStats(): TransportFactoryStats;
    /**
     * Shutdown factory
     * Properly disposes of all transports and resources
     */
    shutdown(): Promise<void>;
    /**
     * Validate transport configuration
     * Ensures configuration is valid for the transport type
     */
    private validateTransportConfig;
    /**
     * Setup transport event handlers
     * Handles events from individual transports
     */
    private setupTransportHandlers;
    /**
     * Generate unique transport ID
     * Creates a unique identifier for the transport
     */
    private generateTransportId;
    /**
     * Initialize factory statistics
     */
    private initializeStats;
    /**
     * Update factory statistics
     */
    private updateStats;
}
export default TransportFactory;
export { HttpTransport, SseTransport, StdioTransport };
//# sourceMappingURL=transport-factory.d.ts.map