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

import * as crypto from 'crypto';
import { EventEmitter } from 'events';

/**
 * Security Event Types
 */
export enum SecurityEventType {
    // Authentication Events
    LOGIN_SUCCESS = 'auth.login.success',
    LOGIN_FAILURE = 'auth.login.failure',
    LOGOUT = 'auth.logout',
    MFA_CHALLENGE = 'auth.mfa.challenge',
    MFA_SUCCESS = 'auth.mfa.success',
    MFA_FAILURE = 'auth.mfa.failure',
    PASSWORD_CHANGED = 'auth.password.changed',
    ACCOUNT_LOCKED = 'auth.account.locked',
    ACCOUNT_UNLOCKED = 'auth.account.unlocked',

    // Authorization Events
    ACCESS_GRANTED = 'authz.access.granted',
    ACCESS_DENIED = 'authz.access.denied',
    PERMISSION_CHANGED = 'authz.permission.changed',
    ROLE_ASSIGNED = 'authz.role.assigned',
    ROLE_REMOVED = 'authz.role.removed',
    ELEVATION_GRANTED = 'authz.elevation.granted',
    ELEVATION_DENIED = 'authz.elevation.denied',

    // Session Events
    SESSION_CREATED = 'session.created',
    SESSION_EXPIRED = 'session.expired',
    SESSION_TERMINATED = 'session.terminated',
    SESSION_EXTENDED = 'session.extended',
    CONCURRENT_SESSION_LIMIT = 'session.concurrent.limit',

    // Security Events
    SUSPICIOUS_ACTIVITY = 'security.activity.suspicious',
    BRUTE_FORCE_DETECTED = 'security.brute_force.detected',
    RATE_LIMIT_EXCEEDED = 'security.rate_limit.exceeded',
    SECURITY_VIOLATION = 'security.violation',
    DATA_BREACH_ATTEMPT = 'security.breach.attempt',
    INTRUSION_DETECTED = 'security.intrusion.detected',

    // System Events
    SYSTEM_CONFIG_CHANGED = 'system.config.changed',
    ENCRYPTION_KEY_ROTATED = 'system.key.rotated',
    SECURITY_POLICY_UPDATED = 'system.policy.updated',
    BACKUP_CREATED = 'system.backup.created',
    RESTORE_PERFORMED = 'system.restore.performed',

    // Data Events
    DATA_ACCESSED = 'data.accessed',
    DATA_MODIFIED = 'data.modified',
    DATA_DELETED = 'data.deleted',
    DATA_EXPORTED = 'data.exported',
    PII_ACCESSED = 'data.pii.accessed',
    SENSITIVE_DATA_VIEWED = 'data.sensitive.viewed',

    // Administrative Events
    ADMIN_LOGIN = 'admin.login',
    ADMIN_ACTION = 'admin.action',
    USER_CREATED = 'admin.user.created',
    USER_DELETED = 'admin.user.deleted',
    AUDIT_LOG_ACCESSED = 'admin.audit.accessed',
    SECURITY_REPORT_GENERATED = 'admin.report.generated'
}

/**
 * Event Severity Levels
 */
export enum EventSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
}

/**
 * Event Categories for filtering and grouping
 */
export enum EventCategory {
    AUTHENTICATION = 'authentication',
    AUTHORIZATION = 'authorization',
    SESSION = 'session',
    SECURITY = 'security',
    SYSTEM = 'system',
    DATA = 'data',
    ADMIN = 'admin'
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
export class SecurityAuditLogger extends EventEmitter {
    private events: AuditEvent[] = [];
    private correlationMap = new Map<string, string>();
    private deduplicationCache = new Map<string, Date>();
    private flushTimer?: NodeJS.Timeout;

    constructor(private config: AuditLoggerConfig) {
        super();
        this.startFlushTimer();
    }

    /**
     * Log a security event
     */
    logEvent(event: Omit<AuditEvent, 'id' | 'timestamp' | 'fingerprint' | 'retention'>): void {
        try {
            const auditEvent: AuditEvent = {
                ...event,
                id: this.generateEventId(),
                timestamp: new Date(),
                fingerprint: this.generateFingerprint(event),
                retention: this.determineRetention(event)
            };

            // Check for deduplication
            if (this.config.enableDeduplication && this.isDuplicate(auditEvent)) {
                return;
            }

            // Auto-generate correlation ID if needed
            if (this.config.enableCorrelation && !auditEvent.correlationId) {
                auditEvent.correlationId = this.generateCorrelationId(auditEvent);
            }

            // Add to memory store
            this.events.push(auditEvent);

            // Update deduplication cache
            if (this.config.enableDeduplication) {
                this.deduplicationCache.set(auditEvent.fingerprint!, auditEvent.timestamp);
            }

            // Enforce memory limits
            if (this.events.length > this.config.maxMemoryEvents) {
                this.events.splice(0, this.events.length - this.config.maxMemoryEvents);
            }

            // Emit for real-time processing
            this.emit('eventLogged', auditEvent);

            // Check for critical events
            if (auditEvent.severity === EventSeverity.CRITICAL) {
                this.emit('criticalEvent', auditEvent);
            }

            // Check for suspicious patterns
            this.checkSuspiciousPatterns(auditEvent);

        } catch (error) {
            this.emit('error', new Error(`Failed to log audit event: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
    }

    /**
     * Query audit events
     */
    queryEvents(options: AuditQueryOptions = {}): AuditEvent[] {
        let filteredEvents = [...this.events];

        // Apply filters
        if (options.eventTypes?.length) {
            filteredEvents = filteredEvents.filter(e => options.eventTypes!.includes(e.eventType));
        }

        if (options.severities?.length) {
            filteredEvents = filteredEvents.filter(e => options.severities!.includes(e.severity));
        }

        if (options.categories?.length) {
            filteredEvents = filteredEvents.filter(e => options.categories!.includes(e.category));
        }

        if (options.userId) {
            filteredEvents = filteredEvents.filter(e => e.userId === options.userId);
        }

        if (options.sessionId) {
            filteredEvents = filteredEvents.filter(e => e.sessionId === options.sessionId);
        }

        if (options.workspaceId) {
            filteredEvents = filteredEvents.filter(e => e.workspaceId === options.workspaceId);
        }

        if (options.resourceType) {
            filteredEvents = filteredEvents.filter(e => e.resourceType === options.resourceType);
        }

        if (options.ipAddress) {
            filteredEvents = filteredEvents.filter(e => e.ipAddress === options.ipAddress);
        }

        if (options.correlationId) {
            filteredEvents = filteredEvents.filter(e => e.correlationId === options.correlationId);
        }

        if (options.timeRange) {
            filteredEvents = filteredEvents.filter(e =>
                e.timestamp >= options.timeRange!.start &&
                e.timestamp <= options.timeRange!.end
            );
        }

        if (options.searchText) {
            const searchLower = options.searchText.toLowerCase();
            filteredEvents = filteredEvents.filter(e =>
                JSON.stringify(e.details).toLowerCase().includes(searchLower) ||
                e.action.toLowerCase().includes(searchLower) ||
                e.resourceType.toLowerCase().includes(searchLower)
            );
        }

        // Apply sorting
        if (options.sort) {
            const { field, direction } = options.sort;
            filteredEvents.sort((a, b) => {
                const aVal = a[field];
                const bVal = b[field];

                // Handle undefined values
                if (aVal == null && bVal == null) return 0;
                if (aVal == null) return direction === 'asc' ? -1 : 1;
                if (bVal == null) return direction === 'asc' ? 1 : -1;

                if (aVal < bVal) return direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return direction === 'asc' ? 1 : -1;
                return 0;
            });
        } else {
            // Default sort by timestamp descending
            filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        }

        // Apply pagination
        if (options.pagination) {
            const { offset, limit } = options.pagination;
            filteredEvents = filteredEvents.slice(offset, offset + limit);
        }

        return filteredEvents;
    }

    /**
     * Get security statistics
     */
    getSecurityStats(timeRange?: { start: Date; end: Date }): {
        totalEvents: number;
        eventsByType: Record<string, number>;
        eventsBySeverity: Record<string, number>;
        eventsByCategory: Record<string, number>;
        failedAttempts: number;
        criticalEvents: number;
        suspiciousEvents: number;
        topIpAddresses: Array<{ ip: string; count: number }>;
        topUsers: Array<{ userId: string; count: number }>;
    } {
        const events = timeRange ?
            this.queryEvents({ timeRange }) :
            this.events;

        const stats = {
            totalEvents: events.length,
            eventsByType: {} as Record<string, number>,
            eventsBySeverity: {} as Record<string, number>,
            eventsByCategory: {} as Record<string, number>,
            failedAttempts: 0,
            criticalEvents: 0,
            suspiciousEvents: 0,
            topIpAddresses: [] as Array<{ ip: string; count: number }>,
            topUsers: [] as Array<{ userId: string; count: number }>
        };

        const ipCounts = new Map<string, number>();
        const userCounts = new Map<string, number>();

        for (const event of events) {
            // Count by type
            stats.eventsByType[event.eventType] = (stats.eventsByType[event.eventType] || 0) + 1;

            // Count by severity
            stats.eventsBySeverity[event.severity] = (stats.eventsBySeverity[event.severity] || 0) + 1;

            // Count by category
            stats.eventsByCategory[event.category] = (stats.eventsByCategory[event.category] || 0) + 1;

            // Count failures
            if (event.result === 'failure' || event.result === 'denied') {
                stats.failedAttempts++;
            }

            // Count critical events
            if (event.severity === EventSeverity.CRITICAL) {
                stats.criticalEvents++;
            }

            // Count suspicious events
            if (event.eventType.includes('suspicious') || event.eventType.includes('intrusion')) {
                stats.suspiciousEvents++;
            }

            // Track IP addresses
            if (event.ipAddress) {
                ipCounts.set(event.ipAddress, (ipCounts.get(event.ipAddress) || 0) + 1);
            }

            // Track users
            if (event.userId) {
                userCounts.set(event.userId, (userCounts.get(event.userId) || 0) + 1);
            }
        }

        // Sort and limit top IPs
        stats.topIpAddresses = Array.from(ipCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([ip, count]) => ({ ip, count }));

        // Sort and limit top users
        stats.topUsers = Array.from(userCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([userId, count]) => ({ userId, count }));

        return stats;
    }

    /**
     * Get events by correlation ID
     */
    getCorrelatedEvents(correlationId: string): AuditEvent[] {
        return this.queryEvents({ correlationId });
    }

    /**
     * Create correlation between events
     */
    createCorrelation(eventIds: string[], correlationId?: string): string {
        const correlationIdToUse = correlationId || crypto.randomUUID();

        for (const event of this.events) {
            if (eventIds.includes(event.id)) {
                event.correlationId = correlationIdToUse;
            }
        }

        return correlationIdToUse;
    }

    /**
     * Generate fingerprint for deduplication
     */
    private generateFingerprint(event: Omit<AuditEvent, 'id' | 'timestamp' | 'fingerprint' | 'retention'>): string {
        const fingerprintData = {
            eventType: event.eventType,
            userId: event.userId,
            resourceType: event.resourceType,
            resourceId: event.resourceId,
            action: event.action,
            ipAddress: event.ipAddress
        };

        return crypto.createHash('sha256')
            .update(JSON.stringify(fingerprintData))
            .digest('hex');
    }

    /**
     * Check if event is duplicate
     */
    private isDuplicate(event: AuditEvent): boolean {
        const lastSeen = this.deduplicationCache.get(event.fingerprint!);

        if (!lastSeen) {
            return false;
        }

        const timeDiff = event.timestamp.getTime() - lastSeen.getTime();
        return timeDiff < this.config.deduplicationWindow;
    }

    /**
     * Generate correlation ID based on event context
     */
    private generateCorrelationId(event: AuditEvent): string {
        // Use existing correlation for same session/user within time window
        if (event.sessionId && this.correlationMap.has(event.sessionId)) {
            return this.correlationMap.get(event.sessionId)!;
        }

        const correlationId = crypto.randomUUID();

        if (event.sessionId) {
            this.correlationMap.set(event.sessionId, correlationId);
        }

        return correlationId;
    }

    /**
     * Determine retention policy for event
     */
    private determineRetention(event: Omit<AuditEvent, 'id' | 'timestamp' | 'fingerprint' | 'retention'>): AuditEvent['retention'] {
        let category: 'standard' | 'compliance' | 'security' | 'legal' = 'standard';

        // Compliance events (authentication, authorization)
        if (event.category === EventCategory.AUTHENTICATION ||
            event.category === EventCategory.AUTHORIZATION) {
            category = 'compliance';
        }

        // Security events
        if (event.category === EventCategory.SECURITY ||
            event.severity === EventSeverity.CRITICAL) {
            category = 'security';
        }

        // Legal hold events (data access, PII)
        if (event.eventType.includes('pii') ||
            event.eventType.includes('sensitive') ||
            event.category === EventCategory.DATA) {
            category = 'legal';
        }

        const period = this.config.defaultRetention[category];

        return {
            category,
            period,
            archiveAfter: Math.floor(period * 0.1), // Archive after 10% of retention period
            deleteAfter: new Date(Date.now() + period * 24 * 60 * 60 * 1000)
        };
    }

    /**
     * Check for suspicious activity patterns
     */
    private checkSuspiciousPatterns(event: AuditEvent): void {
        // Check for multiple failed logins from same IP
        if (event.eventType === SecurityEventType.LOGIN_FAILURE && event.ipAddress) {
            const recentFailures = this.queryEvents({
                eventTypes: [SecurityEventType.LOGIN_FAILURE],
                ipAddress: event.ipAddress,
                timeRange: {
                    start: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
                    end: new Date()
                }
            });

            if (recentFailures.length >= 5) {
                this.logEvent({
                    eventType: SecurityEventType.BRUTE_FORCE_DETECTED,
                    category: EventCategory.SECURITY,
                    severity: EventSeverity.HIGH,
                    resourceType: 'authentication',
                    action: 'brute_force_detection',
                    result: 'success',
                    ipAddress: event.ipAddress,
                    correlationId: event.correlationId,
                    details: {
                        context: {
                            failedAttempts: recentFailures.length,
                            timeWindow: '15 minutes'
                        }
                    }
                });
            }
        }
    }

    /**
     * Start flush timer for batched persistence
     */
    private startFlushTimer(): void {
        this.flushTimer = setInterval(() => {
            this.emit('flush', this.events.slice());
        }, this.config.flushInterval);
    }

    /**
     * Generate unique event ID
     */
    private generateEventId(): string {
        return `audit_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    }

    /**
     * Shutdown audit logger
     */
    shutdown(): void {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }

        // Final flush
        this.emit('flush', this.events.slice());

        this.removeAllListeners();
    }
}

export default SecurityAuditLogger;