/**
 * Connection Manager for MCP Server
 *
 * This module provides comprehensive connection management functionality
 * for handling client connections, disconnections, and session lifecycle.
 *
 * Features:
 * - Graceful connection/disconnection handling
 * - Session timeout management
 * - Connection pooling and limits
 * - Health monitoring and cleanup
 * - Event-driven architecture
 *
 * Constitutional Requirements:
 * - Memory efficient connection tracking
 * - Graceful shutdown procedures
 * - Comprehensive error handling
 * - Performance monitoring
 */
import { EventEmitter } from 'events';
import { ClientSession, Transport, TransportType, ServerConfig } from '../types/index.js';
import { MCPServerLogger } from './logger.js';
/**
 * Connection Manager Events
 */
export interface ConnectionManagerEvents {
    'connection:created': (session: ClientSession) => void;
    'connection:authenticated': (session: ClientSession) => void;
    'connection:disconnected': (session: ClientSession, reason: string) => void;
    'connection:timeout': (session: ClientSession) => void;
    'connection:error': (session: ClientSession, error: Error) => void;
    'session:expired': (session: ClientSession) => void;
    'cleanup:started': () => void;
    'cleanup:completed': (cleanedSessions: number) => void;
}
/**
 * Connection Statistics
 */
export interface ConnectionStats {
    /** Total active connections */
    activeConnections: number;
    /** Total connections created */
    totalConnections: number;
    /** Total connections closed */
    totalDisconnections: number;
    /** Connections by transport type */
    connectionsByTransport: Record<TransportType, number>;
    /** Average connection duration */
    averageConnectionDuration: number;
    /** Connection success rate */
    connectionSuccessRate: number;
    /** Last cleanup timestamp */
    lastCleanup: Date;
    /** Memory usage for connections */
    memoryUsage: number;
}
/**
 * Connection Manager Configuration
 */
export interface ConnectionManagerConfig {
    /** Maximum number of concurrent connections */
    maxConnections: number;
    /** Default session timeout in milliseconds */
    defaultTimeout: number;
    /** Cleanup interval in milliseconds */
    cleanupInterval: number;
    /** Graceful shutdown timeout in milliseconds */
    shutdownTimeout: number;
    /** Enable connection pooling */
    enablePooling: boolean;
    /** Connection health check interval */
    healthCheckInterval: number;
    /** Enable automatic cleanup of expired sessions */
    autoCleanup: boolean;
}
/**
 * Connection Manager Implementation
 *
 * Manages client connections with graceful handling of:
 * - Connection establishment and authentication
 * - Session timeout and expiration
 * - Graceful disconnection
 * - Resource cleanup
 * - Health monitoring
 */
export declare class ConnectionManager extends EventEmitter {
    private sessions;
    private config;
    private logger;
    private cleanupTimer;
    private healthCheckTimer;
    private isShuttingDown;
    private stats;
    constructor(config: ServerConfig, logger: MCPServerLogger);
    /**
     * Create a new client session
     */
    createSession(clientId: string, transport: Transport): Promise<ClientSession>;
    /**
     * Authenticate a client session
     */
    authenticateSession(sessionId: string, authData?: any): Promise<void>;
    /**
     * Gracefully disconnect a client session
     */
    disconnectSession(sessionId: string, reason?: string): Promise<void>;
    /**
     * Get session by ID
     */
    getSession(sessionId: string): ClientSession | undefined;
    /**
     * Get all active sessions
     */
    getActiveSessions(): ClientSession[];
    /**
     * Get connection statistics
     */
    getStats(): ConnectionStats;
    /**
     * Perform health check on all sessions
     */
    performHealthCheck(): Promise<void>;
    /**
     * Clean up expired and inactive sessions
     */
    cleanup(): Promise<number>;
    /**
     * Graceful shutdown of connection manager
     */
    shutdown(): Promise<void>;
    /**
     * Private helper methods
     */
    private generateSessionId;
    private initializeStats;
    private updateStats;
    private setupCleanupTimer;
    private setupHealthCheckTimer;
    private cleanupSession;
}
/**
 * Create a connection manager instance
 */
export declare function createConnectionManager(config: ServerConfig, logger: MCPServerLogger): ConnectionManager;
//# sourceMappingURL=connection-manager.d.ts.map