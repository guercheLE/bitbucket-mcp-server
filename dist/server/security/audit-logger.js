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
import crypto from 'crypto';
import { EventEmitter } from 'events';
/**
 * Security Event Types
 */
export var SecurityEventType;
(function (SecurityEventType) {
    // Authentication Events
    SecurityEventType["LOGIN_SUCCESS"] = "auth.login.success";
    SecurityEventType["LOGIN_FAILURE"] = "auth.login.failure";
    SecurityEventType["LOGOUT"] = "auth.logout";
    SecurityEventType["MFA_CHALLENGE"] = "auth.mfa.challenge";
    SecurityEventType["MFA_SUCCESS"] = "auth.mfa.success";
    SecurityEventType["MFA_FAILURE"] = "auth.mfa.failure";
    SecurityEventType["PASSWORD_CHANGED"] = "auth.password.changed";
    SecurityEventType["ACCOUNT_LOCKED"] = "auth.account.locked";
    SecurityEventType["ACCOUNT_UNLOCKED"] = "auth.account.unlocked";
    // Authorization Events
    SecurityEventType["ACCESS_GRANTED"] = "authz.access.granted";
    SecurityEventType["ACCESS_DENIED"] = "authz.access.denied";
    SecurityEventType["PERMISSION_CHANGED"] = "authz.permission.changed";
    SecurityEventType["ROLE_ASSIGNED"] = "authz.role.assigned";
    SecurityEventType["ROLE_REMOVED"] = "authz.role.removed";
    SecurityEventType["ELEVATION_GRANTED"] = "authz.elevation.granted";
    SecurityEventType["ELEVATION_DENIED"] = "authz.elevation.denied";
    // Session Events
    SecurityEventType["SESSION_CREATED"] = "session.created";
    SecurityEventType["SESSION_EXPIRED"] = "session.expired";
    SecurityEventType["SESSION_TERMINATED"] = "session.terminated";
    SecurityEventType["SESSION_EXTENDED"] = "session.extended";
    SecurityEventType["CONCURRENT_SESSION_LIMIT"] = "session.concurrent.limit";
    // Security Events
    SecurityEventType["SUSPICIOUS_ACTIVITY"] = "security.activity.suspicious";
    SecurityEventType["BRUTE_FORCE_DETECTED"] = "security.brute_force.detected";
    SecurityEventType["RATE_LIMIT_EXCEEDED"] = "security.rate_limit.exceeded";
    SecurityEventType["SECURITY_VIOLATION"] = "security.violation";
    SecurityEventType["DATA_BREACH_ATTEMPT"] = "security.breach.attempt";
    SecurityEventType["INTRUSION_DETECTED"] = "security.intrusion.detected";
    // System Events
    SecurityEventType["SYSTEM_CONFIG_CHANGED"] = "system.config.changed";
    SecurityEventType["ENCRYPTION_KEY_ROTATED"] = "system.key.rotated";
    SecurityEventType["SECURITY_POLICY_UPDATED"] = "system.policy.updated";
    SecurityEventType["BACKUP_CREATED"] = "system.backup.created";
    SecurityEventType["RESTORE_PERFORMED"] = "system.restore.performed";
    // Data Events
    SecurityEventType["DATA_ACCESSED"] = "data.accessed";
    SecurityEventType["DATA_MODIFIED"] = "data.modified";
    SecurityEventType["DATA_DELETED"] = "data.deleted";
    SecurityEventType["DATA_EXPORTED"] = "data.exported";
    SecurityEventType["PII_ACCESSED"] = "data.pii.accessed";
    SecurityEventType["SENSITIVE_DATA_VIEWED"] = "data.sensitive.viewed";
    // Administrative Events
    SecurityEventType["ADMIN_LOGIN"] = "admin.login";
    SecurityEventType["ADMIN_ACTION"] = "admin.action";
    SecurityEventType["USER_CREATED"] = "admin.user.created";
    SecurityEventType["USER_DELETED"] = "admin.user.deleted";
    SecurityEventType["AUDIT_LOG_ACCESSED"] = "admin.audit.accessed";
    SecurityEventType["SECURITY_REPORT_GENERATED"] = "admin.report.generated";
})(SecurityEventType || (SecurityEventType = {}));
/**
 * Event Severity Levels
 */
export var EventSeverity;
(function (EventSeverity) {
    EventSeverity["LOW"] = "low";
    EventSeverity["MEDIUM"] = "medium";
    EventSeverity["HIGH"] = "high";
    EventSeverity["CRITICAL"] = "critical";
})(EventSeverity || (EventSeverity = {}));
/**
 * Event Categories for filtering and grouping
 */
export var EventCategory;
(function (EventCategory) {
    EventCategory["AUTHENTICATION"] = "authentication";
    EventCategory["AUTHORIZATION"] = "authorization";
    EventCategory["SESSION"] = "session";
    EventCategory["SECURITY"] = "security";
    EventCategory["SYSTEM"] = "system";
    EventCategory["DATA"] = "data";
    EventCategory["ADMIN"] = "admin";
})(EventCategory || (EventCategory = {}));
/**
 * Security Audit Logger
 */
export class SecurityAuditLogger extends EventEmitter {
    config;
    events = [];
    correlationMap = new Map();
    deduplicationCache = new Map();
    flushTimer;
    constructor(config) {
        super();
        this.config = config;
        this.startFlushTimer();
    }
    /**
     * Log a security event
     */
    logEvent(event) {
        try {
            const auditEvent = {
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
                this.deduplicationCache.set(auditEvent.fingerprint, auditEvent.timestamp);
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
        }
        catch (error) {
            this.emit('error', new Error(`Failed to log audit event: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
    }
    /**
     * Query audit events
     */
    queryEvents(options = {}) {
        let filteredEvents = [...this.events];
        // Apply filters
        if (options.eventTypes?.length) {
            filteredEvents = filteredEvents.filter(e => options.eventTypes.includes(e.eventType));
        }
        if (options.severities?.length) {
            filteredEvents = filteredEvents.filter(e => options.severities.includes(e.severity));
        }
        if (options.categories?.length) {
            filteredEvents = filteredEvents.filter(e => options.categories.includes(e.category));
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
            filteredEvents = filteredEvents.filter(e => e.timestamp >= options.timeRange.start &&
                e.timestamp <= options.timeRange.end);
        }
        if (options.searchText) {
            const searchLower = options.searchText.toLowerCase();
            filteredEvents = filteredEvents.filter(e => JSON.stringify(e.details).toLowerCase().includes(searchLower) ||
                e.action.toLowerCase().includes(searchLower) ||
                e.resourceType.toLowerCase().includes(searchLower));
        }
        // Apply sorting
        if (options.sort) {
            const { field, direction } = options.sort;
            filteredEvents.sort((a, b) => {
                const aVal = a[field];
                const bVal = b[field];
                // Handle undefined values
                if (aVal == null && bVal == null)
                    return 0;
                if (aVal == null)
                    return direction === 'asc' ? -1 : 1;
                if (bVal == null)
                    return direction === 'asc' ? 1 : -1;
                if (aVal < bVal)
                    return direction === 'asc' ? -1 : 1;
                if (aVal > bVal)
                    return direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        else {
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
    getSecurityStats(timeRange) {
        const events = timeRange ?
            this.queryEvents({ timeRange }) :
            this.events;
        const stats = {
            totalEvents: events.length,
            eventsByType: {},
            eventsBySeverity: {},
            eventsByCategory: {},
            failedAttempts: 0,
            criticalEvents: 0,
            suspiciousEvents: 0,
            topIpAddresses: [],
            topUsers: []
        };
        const ipCounts = new Map();
        const userCounts = new Map();
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
    getCorrelatedEvents(correlationId) {
        return this.queryEvents({ correlationId });
    }
    /**
     * Create correlation between events
     */
    createCorrelation(eventIds, correlationId) {
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
    generateFingerprint(event) {
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
    isDuplicate(event) {
        const lastSeen = this.deduplicationCache.get(event.fingerprint);
        if (!lastSeen) {
            return false;
        }
        const timeDiff = event.timestamp.getTime() - lastSeen.getTime();
        return timeDiff < this.config.deduplicationWindow;
    }
    /**
     * Generate correlation ID based on event context
     */
    generateCorrelationId(event) {
        // Use existing correlation for same session/user within time window
        if (event.sessionId && this.correlationMap.has(event.sessionId)) {
            return this.correlationMap.get(event.sessionId);
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
    determineRetention(event) {
        let category = 'standard';
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
    checkSuspiciousPatterns(event) {
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
    startFlushTimer() {
        this.flushTimer = setInterval(() => {
            this.emit('flush', this.events.slice());
        }, this.config.flushInterval);
    }
    /**
     * Generate unique event ID
     */
    generateEventId() {
        return `audit_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    }
    /**
     * Shutdown audit logger
     */
    shutdown() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }
        // Final flush
        this.emit('flush', this.events.slice());
        this.removeAllListeners();
    }
}
export default SecurityAuditLogger;
//# sourceMappingURL=audit-logger.js.map