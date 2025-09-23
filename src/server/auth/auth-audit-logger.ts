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
import { createHash, createHmac } from 'crypto';
import {
  AuthenticationError,
  AuthenticationErrorCode,
  SecurityViolation,
  UserSession
} from '../../types/auth';

/**
 * Audit Event Types
 * Categories of events that can be audited
 */
export enum AuditEventType {
  // Authentication Events
  AUTH_LOGIN_SUCCESS = 'auth.login.success',
  AUTH_LOGIN_FAILURE = 'auth.login.failure',
  AUTH_LOGOUT = 'auth.logout',
  AUTH_TOKEN_REFRESH = 'auth.token.refresh',
  AUTH_TOKEN_EXPIRED = 'auth.token.expired',
  AUTH_TOKEN_REVOKED = 'auth.token.revoked',
  
  // Session Events
  SESSION_CREATED = 'session.created',
  SESSION_EXPIRED = 'session.expired',
  SESSION_REVOKED = 'session.revoked',
  SESSION_ACTIVITY = 'session.activity',
  
  // Security Events
  SECURITY_VIOLATION = 'security.violation',
  RATE_LIMIT_EXCEEDED = 'security.rate_limit',
  SUSPICIOUS_ACTIVITY = 'security.suspicious',
  CSRF_ATTACK = 'security.csrf',
  
  // Application Events
  APP_REGISTERED = 'app.registered',
  APP_UPDATED = 'app.updated',
  APP_DELETED = 'app.deleted',
  
  // System Events
  SYSTEM_STARTUP = 'system.startup',
  SYSTEM_SHUTDOWN = 'system.shutdown',
  SYSTEM_ERROR = 'system.error'
}

/**
 * Audit Event Severity Levels
 * Severity classification for audit events
 */
export enum AuditSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
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
export class AuthAuditLogger extends EventEmitter {
  private config: AuditConfig;
  private events: Map<string, AuditEvent> = new Map();
  private stats: AuditStats;
  private alertCounters: Map<string, number> = new Map();
  private processingQueue: AuditEvent[] = [];
  private isProcessing = false;

  constructor(config: Partial<AuditConfig> = {}) {
    super();
    
    this.config = {
      enabled: true,
      logLevel: AuditSeverity.LOW,
      maxMemoryEntries: 10000,
      retentionDays: 90,
      realTimeAlerts: true,
      alertThresholds: {
        failedLogins: 5,
        securityViolations: 3,
        suspiciousActivity: 10
      },
      performanceMetrics: true,
      complianceReporting: true,
      ...config
    };

    this.stats = {
      totalEvents: 0,
      eventsByType: {} as Record<AuditEventType, number>,
      eventsBySeverity: {} as Record<AuditSeverity, number>,
      securityViolations: 0,
      failedAuthAttempts: 0,
      averageProcessingTime: 0,
      memoryUsage: 0,
      lastCleanup: new Date()
    };

    this.initializeCounters();
    this.setupCleanupInterval();
  }

  /**
   * Log an authentication event
   */
  async logEvent(
    type: AuditEventType,
    message: string,
    details: Record<string, any> = {},
    severity: AuditSeverity = AuditSeverity.LOW,
    context?: {
      sessionId?: string;
      userId?: string;
      sourceIp?: string;
      userAgent?: string;
    }
  ): Promise<string> {
    if (!this.config.enabled) {
      return '';
    }

    const startTime = Date.now();
    
    try {
      const event: AuditEvent = {
        id: this.generateEventId(),
        type,
        severity,
        timestamp: new Date(),
        message,
        details,
        sessionId: context?.sessionId,
        userId: context?.userId,
        sourceIp: context?.sourceIp,
        userAgent: context?.userAgent,
        hash: '',
        processed: false
      };

      // Calculate event hash for integrity
      event.hash = this.calculateEventHash(event);

      // Add to processing queue
      this.processingQueue.push(event);

      // Process queue if not already processing
      if (!this.isProcessing) {
        await this.processQueue();
      }

      // Update statistics
      this.updateStats(event, Date.now() - startTime);

      // Check for alerts
      await this.checkAlerts(event);

      // Emit event for real-time monitoring
      this.emit('audit:event', event);

      return event.id;
    } catch (error) {
      this.emit('audit:error', error);
      throw new Error(`Failed to log audit event: ${error.message}`);
    }
  }

  /**
   * Log authentication success
   */
  async logAuthSuccess(
    userId: string,
    sessionId: string,
    context?: { sourceIp?: string; userAgent?: string }
  ): Promise<string> {
    return this.logEvent(
      AuditEventType.AUTH_LOGIN_SUCCESS,
      `User ${userId} successfully authenticated`,
      { userId, sessionId },
      AuditSeverity.LOW,
      { sessionId, userId, ...context }
    );
  }

  /**
   * Log authentication failure
   */
  async logAuthFailure(
    userId: string,
    error: AuthenticationError,
    context?: { sourceIp?: string; userAgent?: string }
  ): Promise<string> {
    return this.logEvent(
      AuditEventType.AUTH_LOGIN_FAILURE,
      `Authentication failed for user ${userId}: ${error.message}`,
      { userId, error: error.code, details: error.details },
      AuditSeverity.MEDIUM,
      { userId, ...context }
    );
  }

  /**
   * Log security violation
   */
  async logSecurityViolation(
    violation: SecurityViolation,
    context?: { sourceIp?: string; userAgent?: string }
  ): Promise<string> {
    return this.logEvent(
      AuditEventType.SECURITY_VIOLATION,
      `Security violation: ${violation.description}`,
      { violation },
      AuditSeverity.HIGH,
      { sessionId: violation.sessionId, ...context }
    );
  }

  /**
   * Log session activity
   */
  async logSessionActivity(
    session: UserSession,
    activity: string,
    context?: { sourceIp?: string; userAgent?: string }
  ): Promise<string> {
    return this.logEvent(
      AuditEventType.SESSION_ACTIVITY,
      `Session activity: ${activity}`,
      { 
        sessionId: session.id,
        userId: session.userId,
        activity,
        sessionState: session.state
      },
      AuditSeverity.LOW,
      { sessionId: session.id, userId: session.userId, ...context }
    );
  }

  /**
   * Get audit events by criteria
   */
  getEvents(criteria: {
    type?: AuditEventType;
    severity?: AuditSeverity;
    userId?: string;
    sessionId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}): AuditEvent[] {
    const events = Array.from(this.events.values());
    
    return events
      .filter(event => {
        if (criteria.type && event.type !== criteria.type) return false;
        if (criteria.severity && event.severity !== criteria.severity) return false;
        if (criteria.userId && event.userId !== criteria.userId) return false;
        if (criteria.sessionId && event.sessionId !== criteria.sessionId) return false;
        if (criteria.startDate && event.timestamp < criteria.startDate) return false;
        if (criteria.endDate && event.timestamp > criteria.endDate) return false;
        return true;
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, criteria.limit || 100);
  }

  /**
   * Get audit statistics
   */
  getStats(): AuditStats {
    return { ...this.stats };
  }

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
  } {
    const events = this.getEvents({ startDate, endDate });
    const uniqueUsers = new Set(events.map(e => e.userId).filter(Boolean));
    const uniqueSessions = new Set(events.map(e => e.sessionId).filter(Boolean));
    
    const eventsByType = {} as Record<AuditEventType, number>;
    const eventsBySeverity = {} as Record<AuditSeverity, number>;
    
    for (const event of events) {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
    }
    
    return {
      totalEvents: events.length,
      securityViolations: events.filter(e => e.type === AuditEventType.SECURITY_VIOLATION).length,
      failedAuthAttempts: events.filter(e => e.type === AuditEventType.AUTH_LOGIN_FAILURE).length,
      uniqueUsers: uniqueUsers.size,
      uniqueSessions: uniqueSessions.size,
      eventsByType,
      eventsBySeverity
    };
  }

  /**
   * Clean up old events
   */
  async cleanup(): Promise<number> {
    const cutoffDate = new Date(Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000));
    let cleanedCount = 0;
    
    for (const [id, event] of this.events.entries()) {
      if (event.timestamp < cutoffDate) {
        this.events.delete(id);
        cleanedCount++;
      }
    }
    
    // Limit memory usage
    if (this.events.size > this.config.maxMemoryEntries) {
      const sortedEvents = Array.from(this.events.entries())
        .sort((a, b) => a[1].timestamp.getTime() - b[1].timestamp.getTime());
      
      const toRemove = sortedEvents.slice(0, this.events.size - this.config.maxMemoryEntries);
      for (const [id] of toRemove) {
        this.events.delete(id);
        cleanedCount++;
      }
    }
    
    this.stats.lastCleanup = new Date();
    this.stats.memoryUsage = this.estimateMemoryUsage();
    
    if (cleanedCount > 0) {
      this.emit('audit:cleanup', { count: cleanedCount });
    }
    
    return cleanedCount;
  }

  /**
   * Destroy the audit logger
   */
  destroy(): void {
    this.removeAllListeners();
    this.events.clear();
    this.processingQueue = [];
    this.alertCounters.clear();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.processingQueue.length > 0) {
        const event = this.processingQueue.shift()!;
        
        // Store event
        this.events.set(event.id, {
          ...event,
          processed: true,
          processedAt: new Date()
        });

        // Emit processed event
        this.emit('audit:processed', event);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateEventHash(event: Omit<AuditEvent, 'hash'>): string {
    const data = JSON.stringify({
      id: event.id,
      type: event.type,
      timestamp: event.timestamp.toISOString(),
      message: event.message,
      details: event.details
    });
    
    return createHash('sha256').update(data).digest('hex');
  }

  private updateStats(event: AuditEvent, processingTime: number): void {
    this.stats.totalEvents++;
    this.stats.eventsByType[event.type] = (this.stats.eventsByType[event.type] || 0) + 1;
    this.stats.eventsBySeverity[event.severity] = (this.stats.eventsBySeverity[event.severity] || 0) + 1;
    
    if (event.type === AuditEventType.SECURITY_VIOLATION) {
      this.stats.securityViolations++;
    }
    
    if (event.type === AuditEventType.AUTH_LOGIN_FAILURE) {
      this.stats.failedAuthAttempts++;
    }
    
    // Update average processing time
    this.stats.averageProcessingTime = 
      (this.stats.averageProcessingTime * (this.stats.totalEvents - 1) + processingTime) / this.stats.totalEvents;
    
    this.stats.memoryUsage = this.estimateMemoryUsage();
  }

  private async checkAlerts(event: AuditEvent): Promise<void> {
    if (!this.config.realTimeAlerts) {
      return;
    }

    const key = `${event.type}_${event.userId || 'anonymous'}`;
    const count = (this.alertCounters.get(key) || 0) + 1;
    this.alertCounters.set(key, count);

    // Check alert thresholds
    if (event.type === AuditEventType.AUTH_LOGIN_FAILURE && 
        count >= this.config.alertThresholds.failedLogins) {
      this.emit('audit:alert', {
        type: 'failed_logins',
        message: `Multiple failed login attempts detected for user ${event.userId}`,
        count,
        userId: event.userId,
        severity: AuditSeverity.HIGH
      });
    }

    if (event.type === AuditEventType.SECURITY_VIOLATION && 
        count >= this.config.alertThresholds.securityViolations) {
      this.emit('audit:alert', {
        type: 'security_violations',
        message: `Multiple security violations detected`,
        count,
        userId: event.userId,
        severity: AuditSeverity.CRITICAL
      });
    }
  }

  private initializeCounters(): void {
    // Initialize all event type counters
    for (const eventType of Object.values(AuditEventType)) {
      this.stats.eventsByType[eventType] = 0;
    }
    
    for (const severity of Object.values(AuditSeverity)) {
      this.stats.eventsBySeverity[severity] = 0;
    }
  }

  private setupCleanupInterval(): void {
    // Clean up old events every hour
    setInterval(async () => {
      try {
        await this.cleanup();
      } catch (error) {
        this.emit('audit:error', error);
      }
    }, 60 * 60 * 1000);
  }

  private estimateMemoryUsage(): number {
    let size = 0;
    for (const event of this.events.values()) {
      size += JSON.stringify(event).length;
    }
    return size;
  }
}

/**
 * Default audit logger instance
 */
export const defaultAuditLogger = new AuthAuditLogger();

/**
 * Factory function for creating audit loggers
 */
export function createAuditLogger(config?: Partial<AuditConfig>): AuthAuditLogger {
  return new AuthAuditLogger(config);
}
