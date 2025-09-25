/**
 * Security Audit Logger
 *
 * Comprehensive security event logging and monitoring system for compliance
 * and security analysis. Provides structured audit trails with event classification,
 * correlation, and retention management.
 *
 * Features:
 * - Structured audit event logging
 * - Event classification and severity levels
 * - Correlation tracking for related events
 * - Configurable retention policies
 * - Query and search capabilities
 * - Compliance reporting support
 */
import { EventEmitter } from 'events';
/**
 * Security Event Types
 */
export declare enum SecurityEventType {
    LOGIN_SUCCESS = "auth.login.success",
    LOGIN_FAILURE = "auth.login.failure",
    LOGOUT = "auth.logout",
    MFA_CHALLENGE = "auth.mfa.challenge",
    MFA_SUCCESS = "auth.mfa.success",
    MFA_FAILURE = "auth.mfa.failure",
    PASSWORD_CHANGED = "auth.password.changed",
    ACCOUNT_LOCKED = "auth.account.locked",
    ACCOUNT_UNLOCKED = "auth.account.unlocked",
    ACCESS_GRANTED = "authz.access.granted",
    ACCESS_DENIED = "authz.access.denied",
    PERMISSION_CHANGED = "authz.permission.changed",
    ROLE_ASSIGNED = "authz.role.assigned",
    ROLE_REMOVED = "authz.role.removed",
    ELEVATION_GRANTED = "authz.elevation.granted",
    ELEVATION_DENIED = "authz.elevation.denied",
    SESSION_CREATED = "session.created",
    SESSION_EXPIRED = "session.expired",
    SESSION_TERMINATED = "session.terminated",
    SESSION_EXTENDED = "session.extended",
    CONCURRENT_SESSION_LIMIT = "session.concurrent.limit",
    SUSPICIOUS_ACTIVITY = "security.activity.suspicious",
    BRUTE_FORCE_DETECTED = "security.brute_force.detected",
    RATE_LIMIT_EXCEEDED = "security.rate_limit.exceeded",
    SECURITY_VIOLATION = "security.violation",
    DATA_BREACH_ATTEMPT = "security.breach.attempt",
    INTRUSION_DETECTED = "security.intrusion.detected",
    SYSTEM_CONFIG_CHANGED = "system.config.changed",
    ENCRYPTION_KEY_ROTATED = "system.key.rotated",
    SECURITY_POLICY_UPDATED = "system.policy.updated",
    BACKUP_CREATED = "system.backup.created",
    RESTORE_PERFORMED = "system.restore.performed",
    DATA_ACCESSED = "data.accessed",
    DATA_MODIFIED = "data.modified",
    DATA_DELETED = "data.deleted",
    DATA_EXPORTED = "data.exported",
    PII_ACCESSED = "data.pii.accessed",
    SENSITIVE_DATA_VIEWED = "data.sensitive.viewed",
    ADMIN_LOGIN = "admin.login",
    ADMIN_ACTION = "admin.action",
    USER_CREATED = "admin.user.created",
    USER_DELETED = "admin.user.deleted",
    AUDIT_LOG_ACCESSED = "admin.audit.accessed",
    SECURITY_REPORT_GENERATED = "admin.report.generated"
}
/**
 * Event Severity Levels
 */
export declare enum EventSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
/**
 * Event Categories for filtering and grouping
 */
export declare enum EventCategory {
    AUTHENTICATION = "authentication",
    AUTHORIZATION = "authorization",
    SESSION = "session",
    SECURITY = "security",
    SYSTEM = "system",
    DATA = "data",
    ADMIN = "admin"
}
/**
 * Audit Event Details
 */
export interface AuditEventDetails {
    /** Request/action parameters */
    parameters?: Record<string, any>;
    /** Previous state (for change events) */
    previousState?: Record<string, any>;
    /** New state (for change events) */
    newState?: Record<string, any>;
    /** Error details (for failure events) */
    error?: {
        code: string;
        message: string;
        stack?: string;
    };
    /** Related resource identifiers */
    relatedResources?: {
        type: string;
        id: string;
    }[];
    /** Additional context data */
    context?: Record<string, any>;
}
/**
 * Complete Audit Event Record
 */
export interface AuditEvent {
    /** Unique event identifier */
    id: string;
    /** Event timestamp */
    timestamp: Date;
    /** Event type */
    eventType: SecurityEventType;
    /** Event category */
    category: EventCategory;
    /** Event severity level */
    severity: EventSeverity;
    /** User who triggered the event */
    userId?: string;
    /** Session ID associated with the event */
    sessionId?: string;
    /** Workspace context */
    workspaceId?: string;
    /** Resource type being accessed/modified */
    resourceType: string;
    /** Specific resource identifier */
    resourceId?: string;
    /** Action performed */
    action: string;
    /** Result of the action */
    result: 'success' | 'failure' | 'error' | 'denied';
    /** Source IP address */
    ipAddress?: string;
    /** User agent string */
    userAgent?: string;
    /** Correlation ID for related events */
    correlationId?: string;
    /** Detailed event information */
    details: AuditEventDetails;
    /** Event fingerprint for deduplication */
    fingerprint?: string;
    /** Retention metadata */
    retention: {
        /** Retention category */
        category: 'standard' | 'compliance' | 'security' | 'legal';
        /** Retention period in days */
        period: number;
        /** Archive after days */
        archiveAfter?: number;
        /** Delete after date */
        deleteAfter?: Date;
    };
}
/**
 * Audit Query Options
 */
export interface AuditQueryOptions {
    /** Filter by event types */
    eventTypes?: SecurityEventType[];
    /** Filter by severity levels */
    severities?: EventSeverity[];
    /** Filter by categories */
    categories?: EventCategory[];
    /** Filter by user ID */
    userId?: string;
    /** Filter by session ID */
    sessionId?: string;
    /** Filter by workspace ID */
    workspaceId?: string;
    /** Filter by resource type */
    resourceType?: string;
    /** Filter by IP address */
    ipAddress?: string;
    /** Filter by correlation ID */
    correlationId?: string;
    /** Time range filter */
    timeRange?: {
        start: Date;
        end: Date;
    };
    /** Text search in event details */
    searchText?: string;
    /** Pagination */
    pagination?: {
        offset: number;
        limit: number;
    };
    /** Sort options */
    sort?: {
        field: keyof AuditEvent;
        direction: 'asc' | 'desc';
    };
}
/**
 * Security Audit Logger Configuration
 */
export interface AuditLoggerConfig {
    /** Maximum events to keep in memory */
    maxMemoryEvents: number;
    /** Batch size for persistence */
    batchSize: number;
    /** Flush interval in milliseconds */
    flushInterval: number;
    /** Enable event correlation */
    enableCorrelation: boolean;
    /** Default retention settings */
    defaultRetention: {
        standard: number;
        compliance: number;
        security: number;
        legal: number;
    };
    /** Enable deduplication */
    enableDeduplication: boolean;
    /** Deduplication window in milliseconds */
    deduplicationWindow: number;
}
/**
 * Security Audit Logger
 */
export declare class SecurityAuditLogger extends EventEmitter {
    private config;
    private events;
    private correlationMap;
    private deduplicationCache;
    private flushTimer?;
    constructor(config: AuditLoggerConfig);
    /**
     * Log a security event
     */
    logEvent(event: Omit<AuditEvent, 'id' | 'timestamp' | 'fingerprint' | 'retention'>): void;
    /**
     * Query audit events
     */
    queryEvents(options?: AuditQueryOptions): AuditEvent[];
    /**
     * Get security statistics
     */
    getSecurityStats(timeRange?: {
        start: Date;
        end: Date;
    }): {
        totalEvents: number;
        eventsByType: Record<string, number>;
        eventsBySeverity: Record<string, number>;
        eventsByCategory: Record<string, number>;
        failedAttempts: number;
        criticalEvents: number;
        suspiciousEvents: number;
        topIpAddresses: Array<{
            ip: string;
            count: number;
        }>;
        topUsers: Array<{
            userId: string;
            count: number;
        }>;
    };
    /**
     * Get events by correlation ID
     */
    getCorrelatedEvents(correlationId: string): AuditEvent[];
    /**
     * Create correlation between events
     */
    createCorrelation(eventIds: string[], correlationId?: string): string;
    /**
     * Generate fingerprint for deduplication
     */
    private generateFingerprint;
    /**
     * Check if event is duplicate
     */
    private isDuplicate;
    /**
     * Generate correlation ID based on event context
     */
    private generateCorrelationId;
    /**
     * Determine retention policy for event
     */
    private determineRetention;
    /**
     * Check for suspicious activity patterns
     */
    private checkSuspiciousPatterns;
    /**
     * Start flush timer for batched persistence
     */
    private startFlushTimer;
    /**
     * Generate unique event ID
     */
    private generateEventId;
    /**
     * Shutdown audit logger
     */
    shutdown(): void;
}
export default SecurityAuditLogger;
//# sourceMappingURL=audit-logger.d.ts.map