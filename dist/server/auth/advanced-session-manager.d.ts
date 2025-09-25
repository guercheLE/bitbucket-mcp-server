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
import { UserSession, AuthenticationResponse } from '../../types/auth';
/**
 * Session Configuration
 */
export interface SessionConfig {
    /** Default session timeout in milliseconds */
    defaultTimeout: number;
    /** Maximum number of concurrent sessions per user */
    maxConcurrentSessions: number;
    /** Session cleanup interval in milliseconds */
    cleanupInterval: number;
    /** Session activity timeout in milliseconds */
    activityTimeout: number;
    /** Whether to enable session persistence */
    enablePersistence: boolean;
    /** Session storage backend type */
    storageType: 'memory' | 'file' | 'database';
    /** Session storage configuration */
    storageConfig?: Record<string, any>;
}
/**
 * Session Statistics
 */
export interface SessionStatistics {
    /** Total number of active sessions */
    totalSessions: number;
    /** Number of sessions per user */
    sessionsPerUser: Record<string, number>;
    /** Number of expired sessions */
    expiredSessions: number;
    /** Average session duration */
    averageSessionDuration: number;
    /** Last cleanup timestamp */
    lastCleanup: Date;
    /** Cleanup operations count */
    cleanupCount: number;
}
/**
 * Session Activity
 */
export interface SessionActivity {
    /** Session ID */
    sessionId: string;
    /** User ID */
    userId: string;
    /** Activity type */
    type: 'login' | 'logout' | 'activity' | 'timeout' | 'cleanup';
    /** Activity timestamp */
    timestamp: Date;
    /** Additional activity data */
    data?: Record<string, any>;
}
/**
 * Advanced Session Manager Class
 * Manages user sessions with advanced features
 */
export declare class AdvancedSessionManager extends EventEmitter {
    private sessions;
    private userSessions;
    private sessionActivities;
    private config;
    private statistics;
    private cleanupInterval;
    constructor(config: SessionConfig);
    /**
     * Create a new user session
     */
    createSession(userId: string, userName: string, expiresInMs?: number, metadata?: Record<string, any>): Promise<AuthenticationResponse<UserSession>>;
    /**
     * Get session by ID
     */
    getSession(sessionId: string): Promise<AuthenticationResponse<UserSession>>;
    /**
     * Update session
     */
    updateSession(sessionId: string, updates: Partial<UserSession>): Promise<AuthenticationResponse<UserSession>>;
    /**
     * Remove session
     */
    removeSession(sessionId: string): Promise<AuthenticationResponse<void>>;
    /**
     * Validate session
     */
    validateSession(sessionId: string): Promise<AuthenticationResponse<UserSession>>;
    /**
     * Refresh session
     */
    refreshSession(sessionId: string, expiresInMs?: number): Promise<AuthenticationResponse<UserSession>>;
    /**
     * Get all sessions for a user
     */
    getUserSessions(userId: string): Promise<AuthenticationResponse<UserSession[]>>;
    /**
     * Remove all sessions for a user
     */
    removeUserSessions(userId: string): Promise<AuthenticationResponse<number>>;
    /**
     * Clean up expired sessions
     */
    cleanupExpiredSessions(): Promise<AuthenticationResponse<number>>;
    /**
     * Get session statistics
     */
    getStatistics(): SessionStatistics;
    /**
     * Get session activities for a session
     */
    getSessionActivities(sessionId: string): SessionActivity[];
    private enforceSessionLimits;
    private recordSessionActivity;
    private updateStatistics;
    private startCleanupTimer;
    private generateSessionId;
    private generateRequestId;
}
//# sourceMappingURL=advanced-session-manager.d.ts.map