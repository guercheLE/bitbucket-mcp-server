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
import { ClientSessionState, MCPErrorCode } from '../types/index.js';
import { ClientSession as ClientSessionImpl } from './client-session.js';
import { createMCPError } from './error-handler.js';
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
export class ConnectionManager extends EventEmitter {
    sessions = new Map();
    config;
    logger;
    cleanupTimer = null;
    healthCheckTimer = null;
    isShuttingDown = false;
    stats;
    constructor(config, logger) {
        super();
        this.config = {
            maxConnections: config.maxClients || 100,
            defaultTimeout: config.clientTimeout || 300000, // 5 minutes
            cleanupInterval: 60000, // 1 minute
            shutdownTimeout: 30000, // 30 seconds
            enablePooling: true,
            healthCheckInterval: 30000, // 30 seconds
            autoCleanup: true
        };
        this.logger = logger;
        this.stats = this.initializeStats();
        this.setupCleanupTimer();
        this.setupHealthCheckTimer();
        this.logger.logServerEvent('start', {
            serverName: 'Connection Manager',
            maxConnections: this.config.maxConnections,
            defaultTimeout: this.config.defaultTimeout
        });
    }
    /**
     * Create a new client session
     */
    async createSession(clientId, transport) {
        if (this.isShuttingDown) {
            throw new Error('Server is shutting down, cannot create new sessions');
        }
        if (this.sessions.size >= this.config.maxConnections) {
            const error = createMCPError(null, MCPErrorCode.RATE_LIMIT_EXCEEDED, `Maximum connections (${this.config.maxConnections}) exceeded`, {
                operation: 'session_creation',
                metadata: { clientId, currentConnections: this.sessions.size }
            });
            throw new Error(JSON.stringify(error));
        }
        const sessionId = this.generateSessionId(clientId);
        const session = new ClientSessionImpl(sessionId, clientId, transport, this.config.defaultTimeout, {});
        this.sessions.set(sessionId, session);
        this.updateStats();
        this.logger.logSessionEvent(sessionId, 'created', {
            clientId,
            transportType: transport.type,
            sessionId
        });
        this.emit('connection:created', session);
        return session;
    }
    /**
     * Authenticate a client session
     */
    async authenticateSession(sessionId, authData) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        if (session.state !== ClientSessionState.CONNECTING) {
            throw new Error(`Session ${sessionId} is not in connecting state`);
        }
        // Update session state to authenticated
        session.state = ClientSessionState.AUTHENTICATED;
        session.updateActivity();
        this.logger.logSessionEvent(sessionId, 'authenticated', {
            clientId: session.clientId,
            authData: authData ? 'provided' : 'none'
        });
        this.emit('connection:authenticated', session);
    }
    /**
     * Gracefully disconnect a client session
     */
    async disconnectSession(sessionId, reason = 'client_request') {
        const session = this.sessions.get(sessionId);
        if (!session) {
            this.logger.logSessionEvent(sessionId, 'error', {
                error: {
                    code: MCPErrorCode.SESSION_EXPIRED,
                    message: 'Session not found for disconnection'
                },
                reason
            });
            return;
        }
        try {
            // Update state to disconnecting
            session.state = ClientSessionState.DISCONNECTING;
            this.logger.logSessionEvent(sessionId, 'disconnecting', {
                clientId: session.clientId,
                reason,
                duration: new Date().getTime() - session.createdAt.getTime()
            });
            // Clean up session resources
            await this.cleanupSession(session);
            // Remove from active sessions
            this.sessions.delete(sessionId);
            this.stats.totalDisconnections++;
            this.updateStats();
            // Update state to disconnected
            session.state = ClientSessionState.DISCONNECTED;
            this.logger.logSessionEvent(sessionId, 'disconnected', {
                clientId: session.clientId,
                reason
            });
            this.emit('connection:disconnected', session, reason);
        }
        catch (error) {
            this.logger.logSessionEvent(sessionId, 'error', {
                error: {
                    code: MCPErrorCode.INTERNAL_ERROR,
                    message: error.message
                },
                reason: 'disconnection_failed'
            });
            this.emit('connection:error', session, error);
            throw error;
        }
    }
    /**
     * Get session by ID
     */
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    /**
     * Get all active sessions
     */
    getActiveSessions() {
        return Array.from(this.sessions.values()).filter(session => session.isActive());
    }
    /**
     * Get connection statistics
     */
    getStats() {
        return { ...this.stats };
    }
    /**
     * Perform health check on all sessions
     */
    async performHealthCheck() {
        const now = new Date();
        const expiredSessions = [];
        for (const session of this.sessions.values()) {
            if (session.isExpired()) {
                expiredSessions.push(session);
            }
        }
        if (expiredSessions.length > 0) {
            this.logger.logServerEvent('health_check', {
                expiredSessions: expiredSessions.length,
                totalSessions: this.sessions.size
            });
            for (const session of expiredSessions) {
                await this.disconnectSession(session.id, 'session_expired');
                this.emit('session:expired', session);
            }
        }
    }
    /**
     * Clean up expired and inactive sessions
     */
    async cleanup() {
        this.emit('cleanup:started');
        const beforeCount = this.sessions.size;
        const expiredSessions = [];
        for (const [sessionId, session] of this.sessions.entries()) {
            if (session.isExpired() || !session.isActive()) {
                expiredSessions.push(sessionId);
            }
        }
        for (const sessionId of expiredSessions) {
            await this.disconnectSession(sessionId, 'cleanup');
        }
        const cleanedCount = beforeCount - this.sessions.size;
        this.stats.lastCleanup = new Date();
        this.logger.logServerEvent('cleanup', {
            sessionsBefore: beforeCount,
            sessionsAfter: this.sessions.size,
            cleanedSessions: cleanedCount
        });
        this.emit('cleanup:completed', cleanedCount);
        return cleanedCount;
    }
    /**
     * Graceful shutdown of connection manager
     */
    async shutdown() {
        if (this.isShuttingDown) {
            return;
        }
        this.isShuttingDown = true;
        this.logger.logServerEvent('shutdown', {
            activeSessions: this.sessions.size
        });
        // Stop timers
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = null;
        }
        // Gracefully disconnect all sessions
        const disconnectPromises = [];
        const shutdownTimeout = setTimeout(() => {
            this.logger.logServerEvent('error', {
                error: {
                    code: MCPErrorCode.INTERNAL_ERROR,
                    message: 'Shutdown timeout reached, forcing disconnection'
                }
            });
        }, this.config.shutdownTimeout);
        for (const session of this.sessions.values()) {
            disconnectPromises.push(this.disconnectSession(session.id, 'server_shutdown')
                .catch(error => {
                this.logger.logSessionEvent(session.id, 'error', {
                    error: {
                        code: MCPErrorCode.INTERNAL_ERROR,
                        message: error.message
                    },
                    reason: 'shutdown_disconnect_failed'
                });
            }));
        }
        try {
            await Promise.all(disconnectPromises);
            clearTimeout(shutdownTimeout);
            this.logger.logServerEvent('stop', {
                totalSessions: this.stats.totalConnections,
                finalSessions: this.sessions.size
            });
        }
        catch (error) {
            this.logger.logServerEvent('error', {
                error: {
                    code: MCPErrorCode.INTERNAL_ERROR,
                    message: error.message
                }
            });
            throw error;
        }
    }
    /**
     * Private helper methods
     */
    generateSessionId(clientId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `session_${clientId}_${timestamp}_${random}`;
    }
    initializeStats() {
        return {
            activeConnections: 0,
            totalConnections: 0,
            totalDisconnections: 0,
            connectionsByTransport: {
                stdio: 0,
                http: 0,
                sse: 0
            },
            averageConnectionDuration: 0,
            connectionSuccessRate: 100,
            lastCleanup: new Date(),
            memoryUsage: 0
        };
    }
    updateStats() {
        this.stats.activeConnections = this.sessions.size;
        this.stats.totalConnections = this.sessions.size + this.stats.totalDisconnections;
        // Reset transport counts
        this.stats.connectionsByTransport = { stdio: 0, http: 0, sse: 0 };
        // Count by transport type
        for (const session of this.sessions.values()) {
            this.stats.connectionsByTransport[session.transport.type]++;
        }
        // Calculate average connection duration
        if (this.sessions.size > 0) {
            const totalDuration = Array.from(this.sessions.values())
                .reduce((sum, session) => sum + session.getStats().duration, 0);
            this.stats.averageConnectionDuration = totalDuration / this.sessions.size;
        }
        // Calculate memory usage (approximate)
        this.stats.memoryUsage = this.sessions.size * 1024; // Rough estimate
    }
    setupCleanupTimer() {
        if (this.config.autoCleanup) {
            this.cleanupTimer = setInterval(async () => {
                try {
                    await this.cleanup();
                }
                catch (error) {
                    this.logger.logServerEvent('error', {
                        error: {
                            code: MCPErrorCode.INTERNAL_ERROR,
                            message: error.message
                        }
                    });
                }
            }, this.config.cleanupInterval);
        }
    }
    setupHealthCheckTimer() {
        this.healthCheckTimer = setInterval(async () => {
            try {
                await this.performHealthCheck();
            }
            catch (error) {
                this.logger.logServerEvent('error', {
                    error: {
                        code: MCPErrorCode.INTERNAL_ERROR,
                        message: error.message
                    }
                });
            }
        }, this.config.healthCheckInterval);
    }
    async cleanupSession(session) {
        // Clean up transport resources
        if (session.transport && typeof session.transport.disconnect === 'function') {
            try {
                await session.transport.disconnect();
            }
            catch (error) {
                this.logger.logTransportEvent(session.transport.type, 'error', {
                    error: {
                        code: MCPErrorCode.TRANSPORT_ERROR,
                        message: error.message
                    },
                    sessionId: session.id
                });
            }
        }
        // Clear available tools
        session.availableTools.clear();
        // Clear metadata
        session.metadata = {};
    }
}
/**
 * Create a connection manager instance
 */
export function createConnectionManager(config, logger) {
    return new ConnectionManager(config, logger);
}
//# sourceMappingURL=connection-manager.js.map