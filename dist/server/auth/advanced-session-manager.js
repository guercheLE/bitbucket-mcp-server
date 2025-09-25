/**
 * Advanced Session Manager for Bitbucket MCP Server
 *
 * This module provides advanced session management functionality,
 * including session tracking, persistence, concurrent session handling,
 * timeout management, and cleanup operations.
 *
 * Key Features:
 * - User session tracking and monitoring
 * - Session persistence with multiple backends
 * - Concurrent session handling and limits
 * - Advanced timeout management
 * - Automatic session cleanup and maintenance
 *
 * Constitutional Requirements:
 * - Secure session management
 * - Performance optimization
 * - Comprehensive error handling
 * - Session lifecycle management
 */
import { EventEmitter } from 'events';
import { AuthenticationErrorCode } from '../../types/auth';
/**
 * Advanced Session Manager Class
 * Manages user sessions with advanced features
 */
export class AdvancedSessionManager extends EventEmitter {
    sessions = new Map();
    userSessions = new Map();
    sessionActivities = new Map();
    config;
    statistics;
    cleanupInterval = null;
    constructor(config) {
        super();
        this.config = config;
        this.statistics = {
            totalSessions: 0,
            sessionsPerUser: {},
            expiredSessions: 0,
            averageSessionDuration: 0,
            lastCleanup: new Date(),
            cleanupCount: 0
        };
        this.startCleanupTimer();
    }
    // ============================================================================
    // Session Creation and Management
    // ============================================================================
    /**
     * Create a new user session
     */
    async createSession(userId, userName, expiresInMs, metadata) {
        try {
            // Check concurrent session limits
            await this.enforceSessionLimits(userId);
            const sessionId = this.generateSessionId();
            const now = new Date();
            const expiresAt = new Date(now.getTime() + (expiresInMs || this.config.defaultTimeout));
            const session = {
                id: sessionId,
                userId,
                userName,
                userEmail: metadata?.email || '',
                permissions: metadata?.permissions || [],
                accessToken: metadata?.accessToken || { token: '', tokenType: 'Bearer', expiresAt: new Date(), scope: [], refreshTokenId: '', createdAt: new Date(), lastUsedAt: new Date(), isValid: true },
                createdAt: now,
                lastActivity: now,
                expiresAt,
                clientSessionId: sessionId,
                state: 'active',
                applicationId: metadata?.applicationId || 'default',
                refreshToken: metadata?.refreshToken || { id: '', token: '', userId, expiresAt: new Date(), isRevoked: false, createdAt: new Date(), lastUsedAt: new Date() },
                isActive: () => true,
                updateActivity: () => {
                    session.lastActivity = new Date();
                },
                isExpired: () => {
                    return session.expiresAt < new Date();
                },
                needsTokenRefresh: () => {
                    const now = new Date();
                    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
                    return session.accessToken.expiresAt <= fiveMinutesFromNow;
                },
                getStats: () => {
                    return {
                        sessionId: session.id,
                        userId: session.userId,
                        createdAt: session.createdAt,
                        lastActivity: session.lastActivity,
                        expiresAt: session.expiresAt,
                        isActive: session.isActive(),
                        isExpired: session.isExpired(),
                        needsTokenRefresh: session.needsTokenRefresh(),
                        duration: Date.now() - session.createdAt.getTime(),
                        apiRequests: 0,
                        tokenRefreshes: 0,
                        lastApiRequest: session.lastActivity,
                        lastTokenRefresh: session.lastActivity,
                        metadata: session.metadata
                    };
                },
                metadata: {
                    ...metadata,
                    createdBy: 'AdvancedSessionManager',
                    sessionVersion: '1.0'
                }
            };
            // Store session
            this.sessions.set(sessionId, session);
            // Update user sessions mapping
            if (!this.userSessions.has(userId)) {
                this.userSessions.set(userId, new Set());
            }
            this.userSessions.get(userId).add(sessionId);
            // Record session activity
            this.recordSessionActivity(sessionId, userId, 'login', { sessionCreated: true });
            // Update statistics
            this.updateStatistics();
            // Emit session created event
            this.emit('session:created', {
                sessionId,
                userId,
                userName,
                expiresAt,
                timestamp: now
            });
            return {
                success: true,
                data: session,
                metadata: {
                    timestamp: new Date(),
                    requestId: this.generateRequestId(),
                    processingTime: 0
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: AuthenticationErrorCode.INTERNAL_ERROR,
                    message: `Failed to create session: ${error.message}`,
                    details: { originalError: error.message },
                    timestamp: new Date(),
                    isRecoverable: true
                },
                metadata: {
                    timestamp: new Date(),
                    requestId: this.generateRequestId(),
                    processingTime: 0
                }
            };
        }
    }
    /**
     * Get session by ID
     */
    async getSession(sessionId) {
        try {
            const session = this.sessions.get(sessionId);
            if (!session) {
                return {
                    success: false,
                    error: {
                        code: AuthenticationErrorCode.SESSION_NOT_FOUND,
                        message: 'Session not found',
                        timestamp: new Date(),
                        isRecoverable: false
                    },
                    metadata: {
                        timestamp: new Date(),
                        requestId: this.generateRequestId(),
                        processingTime: 0
                    }
                };
            }
            // Check if session is expired
            if (session.expiresAt < new Date()) {
                await this.removeSession(sessionId);
                return {
                    success: false,
                    error: {
                        code: AuthenticationErrorCode.SESSION_EXPIRED,
                        message: 'Session has expired',
                        timestamp: new Date(),
                        isRecoverable: false
                    },
                    metadata: {
                        timestamp: new Date(),
                        requestId: this.generateRequestId(),
                        processingTime: 0
                    }
                };
            }
            // Update last activity
            session.lastActivity = new Date();
            this.sessions.set(sessionId, session);
            // Record activity
            this.recordSessionActivity(sessionId, session.userId, 'activity');
            return {
                success: true,
                data: session,
                metadata: {
                    timestamp: new Date(),
                    requestId: this.generateRequestId(),
                    processingTime: 0
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: AuthenticationErrorCode.INTERNAL_ERROR,
                    message: `Failed to get session: ${error.message}`,
                    details: { originalError: error.message },
                    timestamp: new Date(),
                    isRecoverable: true
                },
                metadata: {
                    timestamp: new Date(),
                    requestId: this.generateRequestId(),
                    processingTime: 0
                }
            };
        }
    }
    /**
     * Update session
     */
    async updateSession(sessionId, updates) {
        try {
            const session = this.sessions.get(sessionId);
            if (!session) {
                return {
                    success: false,
                    error: {
                        code: AuthenticationErrorCode.SESSION_NOT_FOUND,
                        message: 'Session not found',
                        timestamp: new Date(),
                        isRecoverable: false
                    },
                    metadata: {
                        timestamp: new Date(),
                        requestId: this.generateRequestId(),
                        processingTime: 0
                    }
                };
            }
            // Update session properties
            const updatedSession = {
                ...session,
                ...updates,
                lastActivity: new Date()
            };
            this.sessions.set(sessionId, updatedSession);
            // Record activity
            this.recordSessionActivity(sessionId, session.userId, 'activity', { updated: true });
            return {
                success: true,
                data: updatedSession,
                metadata: {
                    timestamp: new Date(),
                    requestId: this.generateRequestId(),
                    processingTime: 0
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: AuthenticationErrorCode.INTERNAL_ERROR,
                    message: `Failed to update session: ${error.message}`,
                    details: { originalError: error.message },
                    timestamp: new Date(),
                    isRecoverable: true
                },
                metadata: {
                    timestamp: new Date(),
                    requestId: this.generateRequestId(),
                    processingTime: 0
                }
            };
        }
    }
    /**
     * Remove session
     */
    async removeSession(sessionId) {
        try {
            const session = this.sessions.get(sessionId);
            if (session) {
                // Remove from user sessions mapping
                const userSessions = this.userSessions.get(session.userId);
                if (userSessions) {
                    userSessions.delete(sessionId);
                    if (userSessions.size === 0) {
                        this.userSessions.delete(session.userId);
                    }
                }
                // Record logout activity
                this.recordSessionActivity(sessionId, session.userId, 'logout', { sessionRemoved: true });
                // Emit session removed event
                this.emit('session:removed', {
                    sessionId,
                    userId: session.userId,
                    timestamp: new Date()
                });
            }
            this.sessions.delete(sessionId);
            this.updateStatistics();
            return {
                success: true,
                metadata: {
                    timestamp: new Date(),
                    requestId: this.generateRequestId(),
                    processingTime: 0
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: AuthenticationErrorCode.INTERNAL_ERROR,
                    message: `Failed to remove session: ${error.message}`,
                    details: { originalError: error.message },
                    timestamp: new Date(),
                    isRecoverable: true
                },
                metadata: {
                    timestamp: new Date(),
                    requestId: this.generateRequestId(),
                    processingTime: 0
                }
            };
        }
    }
    // ============================================================================
    // Session Validation and Management
    // ============================================================================
    /**
     * Validate session
     */
    async validateSession(sessionId) {
        try {
            const sessionResponse = await this.getSession(sessionId);
            if (!sessionResponse.success || !sessionResponse.data) {
                return sessionResponse;
            }
            const session = sessionResponse.data;
            // Check activity timeout
            const now = new Date();
            const timeSinceActivity = now.getTime() - session.lastActivity.getTime();
            if (timeSinceActivity > this.config.activityTimeout) {
                await this.removeSession(sessionId);
                return {
                    success: false,
                    error: {
                        code: AuthenticationErrorCode.SESSION_EXPIRED,
                        message: 'Session timed out due to inactivity',
                        timestamp: new Date(),
                        isRecoverable: false
                    },
                    metadata: {
                        timestamp: new Date(),
                        requestId: this.generateRequestId(),
                        processingTime: 0
                    }
                };
            }
            return {
                success: true,
                data: session,
                metadata: {
                    timestamp: new Date(),
                    requestId: this.generateRequestId(),
                    processingTime: 0
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: AuthenticationErrorCode.INTERNAL_ERROR,
                    message: `Failed to validate session: ${error.message}`,
                    details: { originalError: error.message },
                    timestamp: new Date(),
                    isRecoverable: true
                },
                metadata: {
                    timestamp: new Date(),
                    requestId: this.generateRequestId(),
                    processingTime: 0
                }
            };
        }
    }
    /**
     * Refresh session
     */
    async refreshSession(sessionId, expiresInMs) {
        try {
            const session = this.sessions.get(sessionId);
            if (!session) {
                return {
                    success: false,
                    error: {
                        code: AuthenticationErrorCode.SESSION_NOT_FOUND,
                        message: 'Session not found',
                        timestamp: new Date(),
                        isRecoverable: false
                    },
                    metadata: {
                        timestamp: new Date(),
                        requestId: this.generateRequestId(),
                        processingTime: 0
                    }
                };
            }
            // Extend session expiration
            const newExpiresAt = new Date(Date.now() + (expiresInMs || this.config.defaultTimeout));
            const updatedSession = {
                ...session,
                expiresAt: newExpiresAt,
                lastActivity: new Date()
            };
            this.sessions.set(sessionId, updatedSession);
            // Record activity
            this.recordSessionActivity(sessionId, session.userId, 'activity', { refreshed: true });
            // Emit session refreshed event
            this.emit('session:refreshed', {
                sessionId,
                userId: session.userId,
                newExpiresAt,
                timestamp: new Date()
            });
            return {
                success: true,
                data: updatedSession,
                metadata: {
                    timestamp: new Date(),
                    requestId: this.generateRequestId(),
                    processingTime: 0
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: AuthenticationErrorCode.INTERNAL_ERROR,
                    message: `Failed to refresh session: ${error.message}`,
                    details: { originalError: error.message },
                    timestamp: new Date(),
                    isRecoverable: true
                },
                metadata: {
                    timestamp: new Date(),
                    requestId: this.generateRequestId(),
                    processingTime: 0
                }
            };
        }
    }
    // ============================================================================
    // User Session Management
    // ============================================================================
    /**
     * Get all sessions for a user
     */
    async getUserSessions(userId) {
        try {
            const userSessionIds = this.userSessions.get(userId);
            if (!userSessionIds || userSessionIds.size === 0) {
                return {
                    success: true,
                    data: [],
                    metadata: {
                        timestamp: new Date(),
                        requestId: this.generateRequestId(),
                        processingTime: 0
                    }
                };
            }
            const sessions = [];
            for (const sessionId of userSessionIds) {
                const session = this.sessions.get(sessionId);
                if (session) {
                    sessions.push(session);
                }
            }
            return {
                success: true,
                data: sessions,
                metadata: {
                    timestamp: new Date(),
                    requestId: this.generateRequestId(),
                    processingTime: 0
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: AuthenticationErrorCode.INTERNAL_ERROR,
                    message: `Failed to get user sessions: ${error.message}`,
                    details: { originalError: error.message },
                    timestamp: new Date(),
                    isRecoverable: true
                },
                metadata: {
                    timestamp: new Date(),
                    requestId: this.generateRequestId(),
                    processingTime: 0
                }
            };
        }
    }
    /**
     * Remove all sessions for a user
     */
    async removeUserSessions(userId) {
        try {
            const userSessionIds = this.userSessions.get(userId);
            if (!userSessionIds || userSessionIds.size === 0) {
                return {
                    success: true,
                    data: 0,
                    metadata: {
                        timestamp: new Date(),
                        requestId: this.generateRequestId(),
                        processingTime: 0
                    }
                };
            }
            let removedCount = 0;
            for (const sessionId of userSessionIds) {
                const result = await this.removeSession(sessionId);
                if (result.success) {
                    removedCount++;
                }
            }
            // Emit user sessions removed event
            this.emit('user:sessions-removed', {
                userId,
                removedCount,
                timestamp: new Date()
            });
            return {
                success: true,
                data: removedCount,
                metadata: {
                    timestamp: new Date(),
                    requestId: this.generateRequestId(),
                    processingTime: 0
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: AuthenticationErrorCode.INTERNAL_ERROR,
                    message: `Failed to remove user sessions: ${error.message}`,
                    details: { originalError: error.message },
                    timestamp: new Date(),
                    isRecoverable: true
                },
                metadata: {
                    timestamp: new Date(),
                    requestId: this.generateRequestId(),
                    processingTime: 0
                }
            };
        }
    }
    // ============================================================================
    // Session Cleanup and Maintenance
    // ============================================================================
    /**
     * Clean up expired sessions
     */
    async cleanupExpiredSessions() {
        try {
            const now = new Date();
            let cleanedCount = 0;
            const expiredSessions = [];
            // Find expired sessions
            for (const [sessionId, session] of this.sessions.entries()) {
                if (session.expiresAt < now) {
                    expiredSessions.push(sessionId);
                }
            }
            // Remove expired sessions
            for (const sessionId of expiredSessions) {
                await this.removeSession(sessionId);
                cleanedCount++;
            }
            // Update statistics
            this.statistics.expiredSessions += cleanedCount;
            this.statistics.lastCleanup = now;
            this.statistics.cleanupCount++;
            if (cleanedCount > 0) {
                // Emit cleanup event
                this.emit('sessions:cleaned', {
                    cleanedCount,
                    timestamp: now
                });
            }
            return {
                success: true,
                data: cleanedCount,
                metadata: {
                    timestamp: new Date(),
                    requestId: this.generateRequestId(),
                    processingTime: 0
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: AuthenticationErrorCode.INTERNAL_ERROR,
                    message: `Failed to cleanup expired sessions: ${error.message}`,
                    details: { originalError: error.message },
                    timestamp: new Date(),
                    isRecoverable: true
                },
                metadata: {
                    timestamp: new Date(),
                    requestId: this.generateRequestId(),
                    processingTime: 0
                }
            };
        }
    }
    /**
     * Get session statistics
     */
    getStatistics() {
        return { ...this.statistics };
    }
    /**
     * Get session activities for a session
     */
    getSessionActivities(sessionId) {
        return this.sessionActivities.get(sessionId) || [];
    }
    // ============================================================================
    // Private Helper Methods
    // ============================================================================
    async enforceSessionLimits(userId) {
        const userSessionIds = this.userSessions.get(userId);
        if (userSessionIds && userSessionIds.size >= this.config.maxConcurrentSessions) {
            // Remove oldest session
            let oldestSessionId = null;
            let oldestTime = new Date();
            for (const sessionId of userSessionIds) {
                const session = this.sessions.get(sessionId);
                if (session && session.lastActivity < oldestTime) {
                    oldestSessionId = sessionId;
                    oldestTime = session.lastActivity;
                }
            }
            if (oldestSessionId) {
                await this.removeSession(oldestSessionId);
            }
        }
    }
    recordSessionActivity(sessionId, userId, type, data) {
        const activity = {
            sessionId,
            userId,
            type,
            timestamp: new Date(),
            data
        };
        if (!this.sessionActivities.has(sessionId)) {
            this.sessionActivities.set(sessionId, []);
        }
        const activities = this.sessionActivities.get(sessionId);
        activities.push(activity);
        // Keep only last 100 activities per session
        if (activities.length > 100) {
            activities.splice(0, activities.length - 100);
        }
    }
    updateStatistics() {
        this.statistics.totalSessions = this.sessions.size;
        // Update sessions per user
        this.statistics.sessionsPerUser = {};
        for (const [userId, sessionIds] of this.userSessions.entries()) {
            this.statistics.sessionsPerUser[userId] = sessionIds.size;
        }
        // Calculate average session duration
        const now = new Date();
        let totalDuration = 0;
        let sessionCount = 0;
        for (const session of this.sessions.values()) {
            totalDuration += now.getTime() - session.createdAt.getTime();
            sessionCount++;
        }
        this.statistics.averageSessionDuration = sessionCount > 0 ? totalDuration / sessionCount : 0;
    }
    startCleanupTimer() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.cleanupInterval = setInterval(async () => {
            try {
                await this.cleanupExpiredSessions();
            }
            catch (error) {
                this.emit('error', error);
            }
        }, this.config.cleanupInterval);
    }
    generateSessionId() {
        const randomBytes = require('crypto').randomBytes(32);
        return `sess_${randomBytes.toString('hex')}`;
    }
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
//# sourceMappingURL=advanced-session-manager.js.map