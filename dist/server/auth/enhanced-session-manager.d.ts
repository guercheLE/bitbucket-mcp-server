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
import { EventEmitter } from 'events';
/**
 * Session Security Level
 */
export type SessionSecurityLevel = 'basic' | 'elevated' | 'admin';
/**
 * Session Status
 */
export type SessionStatus = 'active' | 'expired' | 'terminated' | 'locked';
/**
 * Device Information
 */
export interface DeviceInfo {
    /** Device fingerprint hash */
    fingerprint: string;
    /** Operating system */
    os?: string;
    /** Browser/client information */
    browser?: string;
    /** IP address */
    ipAddress: string;
    /** User agent string */
    userAgent: string;
    /** Whether device is trusted */
    trusted: boolean;
    /** Last seen timestamp */
    lastSeen: Date;
}
/**
 * Session Flags
 */
export interface SessionFlag {
    /** Flag name */
    name: string;
    /** Flag value */
    value: any;
    /** When flag was set */
    timestamp: Date;
    /** Flag expiration (optional) */
    expiresAt?: Date;
}
/**
 * Enhanced Session Context
 */
export interface EnhancedSession {
    /** Unique session identifier */
    id: string;
    /** Associated user ID */
    userId: string;
    /** Associated workspace ID (if applicable) */
    workspaceId?: string;
    /** Session creation timestamp */
    createdAt: Date;
    /** Last activity timestamp */
    lastActivity: Date;
    /** Session expiration timestamp */
    expiresAt: Date;
    /** Device information */
    device: DeviceInfo;
    /** Whether MFA has been verified for this session */
    mfaVerified: boolean;
    /** Timestamp of MFA verification */
    mfaVerifiedAt?: Date;
    /** User permissions in this session */
    permissions: string[];
    /** Session security level */
    securityLevel: SessionSecurityLevel;
    /** Session status */
    status: SessionStatus;
    /** Session flags for feature toggles and metadata */
    flags: SessionFlag[];
    /** Session metadata */
    metadata: Record<string, any>;
}
/**
 * Session Configuration
 */
export interface SessionConfig {
    /** Default session duration in milliseconds */
    defaultDuration: number;
    /** Maximum session duration in milliseconds */
    maxDuration: number;
    /** MFA requirement settings */
    mfaRequired: {
        /** Roles that require MFA */
        forRoles: string[];
        /** Actions that require MFA */
        forActions: string[];
        /** MFA timeout in milliseconds */
        timeout: number;
    };
    /** Session cleanup interval in milliseconds */
    cleanupInterval: number;
    /** Maximum concurrent sessions per user */
    maxConcurrentSessions: number;
}
/**
 * Enhanced Session Manager
 */
export declare class EnhancedSessionManager extends EventEmitter {
    private config;
    private sessions;
    private userSessions;
    private cleanupTimer?;
    constructor(config: SessionConfig);
    /**
     * Create a new secure session
     */
    createSession(options: {
        userId: string;
        workspaceId?: string;
        permissions: string[];
        securityLevel?: SessionSecurityLevel;
        device: Omit<DeviceInfo, 'lastSeen'>;
        metadata?: Record<string, any>;
        customDuration?: number;
    }): EnhancedSession;
    /**
     * Validate and retrieve session
     */
    validateSession(sessionId: string): EnhancedSession | null;
    /**
     * Update session with MFA verification
     */
    markMfaVerified(sessionId: string): boolean;
    /**
     * Add or update session flag
     */
    setSessionFlag(sessionId: string, name: string, value: any, expiresAt?: Date): boolean;
    /**
     * Get session flag value
     */
    getSessionFlag(sessionId: string, name: string): any | undefined;
    /**
     * Check if user has permission
     */
    hasPermission(sessionId: string, permission: string): boolean;
    /**
     * Extend session expiration
     */
    extendSession(sessionId: string, additionalTime: number): boolean;
    /**
     * Terminate session
     */
    terminateSession(sessionId: string, reason?: 'logout' | 'expired' | 'security' | 'admin'): boolean;
    /**
     * Get all active sessions for a user
     */
    getUserSessions(userId: string): EnhancedSession[];
    /**
     * Terminate all sessions for a user
     */
    terminateUserSessions(userId: string, reason?: 'security' | 'admin'): number;
    /**
     * Get session statistics
     */
    getSessionStats(): {
        totalSessions: number;
        activeUsers: number;
        mfaVerifiedSessions: number;
        sessionsBySecurityLevel: Record<SessionSecurityLevel, number>;
    };
    /**
     * Cleanup expired sessions and flags
     */
    private cleanup;
    /**
     * Start cleanup timer
     */
    private startCleanupTimer;
    /**
     * Stop cleanup timer
     */
    stopCleanupTimer(): void;
    /**
     * Enforce concurrent session limits
     */
    private enforceSessionLimits;
    /**
     * Generate cryptographically secure session ID
     */
    private generateSecureSessionId;
    /**
     * Shutdown session manager
     */
    shutdown(): void;
}
export default EnhancedSessionManager;
//# sourceMappingURL=enhanced-session-manager.d.ts.map