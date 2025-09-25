/**
 * Authentication Audit Logger for Bitbucket MCP Server
 *
 * This module provides comprehensive audit logging for authentication events,
 * security violations, and compliance tracking.
 *
 * Key Features:
 * - Comprehensive event logging
 * - Security violation tracking
 * - Performance metrics
 * - Compliance reporting
 * - Real-time monitoring
 * - Data retention management
 *
 * Constitutional Requirements:
 * - Complete audit trail
 * - Security compliance
 * - Performance monitoring
 * - Data protection
 * - Real-time alerting
 */
import { EventEmitter } from 'events';
import { AuthenticationError, SecurityViolation, UserSession } from '../../types/auth';
/**
 * Audit Event Types
 * Categories of events that can be audited
 */
export declare enum AuditEventType {
    AUTH_LOGIN_SUCCESS = "auth.login.success",
    AUTH_LOGIN_FAILURE = "auth.login.failure",
    AUTH_LOGOUT = "auth.logout",
    AUTH_TOKEN_REFRESH = "auth.token.refresh",
    AUTH_TOKEN_EXPIRED = "auth.token.expired",
    AUTH_TOKEN_REVOKED = "auth.token.revoked",
    SESSION_CREATED = "session.created",
    SESSION_EXPIRED = "session.expired",
    SESSION_REVOKED = "session.revoked",
    SESSION_ACTIVITY = "session.activity",
    SECURITY_VIOLATION = "security.violation",
    RATE_LIMIT_EXCEEDED = "security.rate_limit",
    SUSPICIOUS_ACTIVITY = "security.suspicious",
    CSRF_ATTACK = "security.csrf",
    APP_REGISTERED = "app.registered",
    APP_UPDATED = "app.updated",
    APP_DELETED = "app.deleted",
    SYSTEM_STARTUP = "system.startup",
    SYSTEM_SHUTDOWN = "system.shutdown",
    SYSTEM_ERROR = "system.error"
}
/**
 * Audit Event Severity Levels
 * Severity classification for audit events
 */
export declare enum AuditSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
/**
 * Audit Event Structure
 * Standard structure for audit events
 */
export interface AuditEvent {
    /** Unique event identifier */
    readonly id: string;
    /** Event type */
    readonly type: AuditEventType;
    /** Event severity */
    readonly severity: AuditSeverity;
    /** Event timestamp */
    readonly timestamp: Date;
    /** Event message */
    readonly message: string;
    /** Event details */
    readonly details: Record<string, any>;
    /** Associated session ID */
    readonly sessionId?: string;
    /** Associated user ID */
    readonly userId?: string;
    /** Source IP address */
    readonly sourceIp?: string;
    /** User agent */
    readonly userAgent?: string;
    /** Event hash for integrity */
    readonly hash: string;
    /** Whether event was processed */
    readonly processed: boolean;
    /** Processing timestamp */
    readonly processedAt?: Date;
}
/**
 * Audit Configuration
 * Configuration options for audit logging
 */
export interface AuditConfig {
    /** Enable audit logging */
    enabled: boolean;
    /** Log level threshold */
    logLevel: AuditSeverity;
    /** Maximum log entries to keep in memory */
    maxMemoryEntries: number;
    /** Log retention period in days */
    retentionDays: number;
    /** Enable real-time alerts */
    realTimeAlerts: boolean;
    /** Alert thresholds */
    alertThresholds: {
        failedLogins: number;
        securityViolations: number;
        suspiciousActivity: number;
    };
    /** Enable performance metrics */
    performanceMetrics: boolean;
    /** Enable compliance reporting */
    complianceReporting: boolean;
    /** Log file path */
    logFilePath?: string;
    /** Database connection string */
    databaseUrl?: string;
}
/**
 * Audit Statistics
 * Performance and usage statistics for audit system
 */
export interface AuditStats {
    /** Total events logged */
    totalEvents: number;
    /** Events by type */
    eventsByType: Record<AuditEventType, number>;
    /** Events by severity */
    eventsBySeverity: Record<AuditSeverity, number>;
    /** Security violations */
    securityViolations: number;
    /** Failed authentication attempts */
    failedAuthAttempts: number;
    /** Average processing time */
    averageProcessingTime: number;
    /** Memory usage in bytes */
    memoryUsage: number;
    /** Last cleanup timestamp */
    lastCleanup: Date;
}
/**
 * Authentication Audit Logger
 * Main class for audit logging and monitoring
 */
export declare class AuthAuditLogger extends EventEmitter {
    private config;
    private events;
    private stats;
    private alertCounters;
    private processingQueue;
    private isProcessing;
    constructor(config?: Partial<AuditConfig>);
    /**
     * Log an authentication event
     */
    logEvent(type: AuditEventType, message: string, details?: Record<string, any>, severity?: AuditSeverity, context?: {
        sessionId?: string;
        userId?: string;
        sourceIp?: string;
        userAgent?: string;
    }): Promise<string>;
    /**
     * Log authentication success
     */
    logAuthSuccess(userId: string, sessionId: string, context?: {
        sourceIp?: string;
        userAgent?: string;
    }): Promise<string>;
    /**
     * Log authentication failure
     */
    logAuthFailure(userId: string, error: AuthenticationError, context?: {
        sourceIp?: string;
        userAgent?: string;
    }): Promise<string>;
    /**
     * Log security violation
     */
    logSecurityViolation(violation: SecurityViolation, context?: {
        sourceIp?: string;
        userAgent?: string;
    }): Promise<string>;
    /**
     * Log session activity
     */
    logSessionActivity(session: UserSession, activity: string, context?: {
        sourceIp?: string;
        userAgent?: string;
    }): Promise<string>;
    /**
     * Get audit events by criteria
     */
    getEvents(criteria?: {
        type?: AuditEventType;
        severity?: AuditSeverity;
        userId?: string;
        sessionId?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
    }): AuditEvent[];
    /**
     * Get audit statistics
     */
    getStats(): AuditStats;
    /**
     * Generate compliance report
     */
    generateComplianceReport(startDate: Date, endDate: Date): {
        totalEvents: number;
        securityViolations: number;
        failedAuthAttempts: number;
        uniqueUsers: number;
        uniqueSessions: number;
        eventsByType: Record<AuditEventType, number>;
        eventsBySeverity: Record<AuditSeverity, number>;
    };
    /**
     * Clean up old events
     */
    cleanup(): Promise<number>;
    /**
     * Destroy the audit logger
     */
    destroy(): void;
    private processQueue;
    private generateEventId;
    private calculateEventHash;
    private updateStats;
    private checkAlerts;
    private initializeCounters;
    private setupCleanupInterval;
    private estimateMemoryUsage;
}
/**
 * Default audit logger instance
 */
export declare const defaultAuditLogger: AuthAuditLogger;
/**
 * Factory function for creating audit loggers
 */
export declare function createAuditLogger(config?: Partial<AuditConfig>): AuthAuditLogger;
//# sourceMappingURL=auth-audit-logger.d.ts.map