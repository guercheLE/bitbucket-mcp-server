/**
 * Enhanced Session Manager
 *
 * Manages secure session lifecycle with advanced security features including
 * MFA verification tracking, device fingerprinting, and enhanced session metadata.
 *
 * Features:
 * - Secure session creation and validation
 * - MFA verification tracking
 * - Device fingerprinting
 * - Permission-based access control
 * - Session expiration and cleanup
 * - Concurrent session management
 */
import crypto from 'crypto';
import { EventEmitter } from 'events';
/**
 * Enhanced Session Manager
 */
export class EnhancedSessionManager extends EventEmitter {
    config;
    sessions = new Map();
    userSessions = new Map();
    cleanupTimer;
    constructor(config) {
        super();
        this.config = config;
        this.startCleanupTimer();
    }
    /**
     * Create a new secure session
     */
    createSession(options) {
        const sessionId = this.generateSecureSessionId();
        const now = new Date();
        const duration = options.customDuration || this.config.defaultDuration;
        const expiresAt = new Date(now.getTime() + Math.min(duration, this.config.maxDuration));
        // Check concurrent session limit
        this.enforceSessionLimits(options.userId);
        const session = {
            id: sessionId,
            userId: options.userId,
            workspaceId: options.workspaceId,
            createdAt: now,
            lastActivity: now,
            expiresAt,
            device: {
                ...options.device,
                lastSeen: now
            },
            mfaVerified: false,
            permissions: [...options.permissions],
            securityLevel: options.securityLevel || 'basic',
            status: 'active',
            flags: [],
            metadata: options.metadata || {}
        };
        // Store session
        this.sessions.set(sessionId, session);
        // Track user sessions
        if (!this.userSessions.has(options.userId)) {
            this.userSessions.set(options.userId, new Set());
        }
        this.userSessions.get(options.userId).add(sessionId);
        this.emit('sessionCreated', session);
        return session;
    }
    /**
     * Validate and retrieve session
     */
    validateSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return null;
        }
        // Check if session has expired
        if (session.expiresAt < new Date()) {
            this.terminateSession(sessionId, 'expired');
            return null;
        }
        // Check session status
        if (session.status !== 'active') {
            return null;
        }
        // Update last activity
        session.lastActivity = new Date();
        session.device.lastSeen = new Date();
        return session;
    }
    /**
     * Update session with MFA verification
     */
    markMfaVerified(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session || session.status !== 'active') {
            return false;
        }
        session.mfaVerified = true;
        session.mfaVerifiedAt = new Date();
        // Upgrade security level if needed
        if (session.securityLevel === 'basic') {
            session.securityLevel = 'elevated';
        }
        this.emit('mfaVerified', session);
        return true;
    }
    /**
     * Add or update session flag
     */
    setSessionFlag(sessionId, name, value, expiresAt) {
        const session = this.sessions.get(sessionId);
        if (!session || session.status !== 'active') {
            return false;
        }
        // Remove existing flag with same name
        session.flags = session.flags.filter(flag => flag.name !== name);
        // Add new flag
        session.flags.push({
            name,
            value,
            timestamp: new Date(),
            expiresAt
        });
        return true;
    }
    /**
     * Get session flag value
     */
    getSessionFlag(sessionId, name) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return undefined;
        }
        const flag = session.flags.find(f => f.name === name);
        if (!flag) {
            return undefined;
        }
        // Check if flag has expired
        if (flag.expiresAt && flag.expiresAt < new Date()) {
            session.flags = session.flags.filter(f => f.name !== name);
            return undefined;
        }
        return flag.value;
    }
    /**
     * Check if user has permission
     */
    hasPermission(sessionId, permission) {
        const session = this.sessions.get(sessionId);
        if (!session || session.status !== 'active') {
            return false;
        }
        return session.permissions.includes(permission) || session.permissions.includes('*');
    }
    /**
     * Extend session expiration
     */
    extendSession(sessionId, additionalTime) {
        const session = this.sessions.get(sessionId);
        if (!session || session.status !== 'active') {
            return false;
        }
        const newExpiry = new Date(session.expiresAt.getTime() + additionalTime);
        const maxExpiry = new Date(session.createdAt.getTime() + this.config.maxDuration);
        session.expiresAt = newExpiry < maxExpiry ? newExpiry : maxExpiry;
        this.emit('sessionExtended', session);
        return true;
    }
    /**
     * Terminate session
     */
    terminateSession(sessionId, reason = 'logout') {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return false;
        }
        // Update session status
        session.status = reason === 'expired' ? 'expired' : 'terminated';
        // Remove from active sessions
        this.sessions.delete(sessionId);
        // Remove from user sessions
        const userSessionSet = this.userSessions.get(session.userId);
        if (userSessionSet) {
            userSessionSet.delete(sessionId);
            if (userSessionSet.size === 0) {
                this.userSessions.delete(session.userId);
            }
        }
        this.emit('sessionTerminated', session, reason);
        return true;
    }
    /**
     * Get all active sessions for a user
     */
    getUserSessions(userId) {
        const sessionIds = this.userSessions.get(userId);
        if (!sessionIds) {
            return [];
        }
        const sessions = [];
        for (const sessionId of sessionIds) {
            const session = this.sessions.get(sessionId);
            if (session && session.status === 'active') {
                sessions.push(session);
            }
        }
        return sessions;
    }
    /**
     * Terminate all sessions for a user
     */
    terminateUserSessions(userId, reason = 'admin') {
        const sessionIds = this.userSessions.get(userId);
        if (!sessionIds) {
            return 0;
        }
        let terminatedCount = 0;
        for (const sessionId of [...sessionIds]) {
            if (this.terminateSession(sessionId, reason)) {
                terminatedCount++;
            }
        }
        return terminatedCount;
    }
    /**
     * Get session statistics
     */
    getSessionStats() {
        const stats = {
            totalSessions: this.sessions.size,
            activeUsers: this.userSessions.size,
            mfaVerifiedSessions: 0,
            sessionsBySecurityLevel: {
                basic: 0,
                elevated: 0,
                admin: 0
            }
        };
        for (const session of this.sessions.values()) {
            if (session.mfaVerified) {
                stats.mfaVerifiedSessions++;
            }
            stats.sessionsBySecurityLevel[session.securityLevel]++;
        }
        return stats;
    }
    /**
     * Cleanup expired sessions and flags
     */
    cleanup() {
        const now = new Date();
        const expiredSessions = [];
        for (const [sessionId, session] of this.sessions.entries()) {
            // Mark expired sessions
            if (session.expiresAt < now) {
                expiredSessions.push(sessionId);
                continue;
            }
            // Clean expired flags
            session.flags = session.flags.filter(flag => !flag.expiresAt || flag.expiresAt > now);
        }
        // Remove expired sessions
        for (const sessionId of expiredSessions) {
            this.terminateSession(sessionId, 'expired');
        }
        if (expiredSessions.length > 0) {
            this.emit('cleanupCompleted', expiredSessions.length);
        }
    }
    /**
     * Start cleanup timer
     */
    startCleanupTimer() {
        this.cleanupTimer = setInterval(() => {
            this.cleanup();
        }, this.config.cleanupInterval);
    }
    /**
     * Stop cleanup timer
     */
    stopCleanupTimer() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = undefined;
        }
    }
    /**
     * Enforce concurrent session limits
     */
    enforceSessionLimits(userId) {
        const userSessionIds = this.userSessions.get(userId);
        if (!userSessionIds || userSessionIds.size < this.config.maxConcurrentSessions) {
            return;
        }
        // Find oldest session and terminate it
        let oldestSession = null;
        let oldestSessionId = '';
        for (const sessionId of userSessionIds) {
            const session = this.sessions.get(sessionId);
            if (session && (!oldestSession || session.createdAt < oldestSession.createdAt)) {
                oldestSession = session;
                oldestSessionId = sessionId;
            }
        }
        if (oldestSessionId) {
            this.terminateSession(oldestSessionId, 'admin');
        }
    }
    /**
     * Generate cryptographically secure session ID
     */
    generateSecureSessionId() {
        return crypto.randomBytes(32).toString('hex');
    }
    /**
     * Shutdown session manager
     */
    shutdown() {
        this.stopCleanupTimer();
        // Terminate all active sessions
        for (const sessionId of [...this.sessions.keys()]) {
            this.terminateSession(sessionId, 'admin');
        }
        this.removeAllListeners();
    }
}
export default EnhancedSessionManager;
//# sourceMappingURL=enhanced-session-manager.js.map