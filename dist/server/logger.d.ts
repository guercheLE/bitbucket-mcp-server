/**
 * MCP Server Logging System
 *
 * Implements comprehensive logging for the MCP server with Winston,
 * including daily rotation, retention policies, and optional remote aggregation.
 *
 * Key Features:
 * - Winston-based structured logging
 * - Daily log rotation with 30-day retention
 * - Constitutional sanitization requirements
 * - Optional Loki+Grafana remote aggregation
 * - Performance monitoring and metrics
 * - Error tracking and alerting
 * - Memory-efficient log management
 *
 * Constitutional Requirements:
 * - Complete API Coverage
 * - Error handling and logging
 * - Memory efficiency (<1GB limit)
 * - Performance optimization
 */
import { EventEmitter } from 'events';
import { ServerConfig, MCPErrorCode, ProtocolMessage } from '../types/index.js';
/**
 * Log Level Configuration
 * Standard Winston log levels with MCP-specific extensions
 */
export declare enum LogLevel {
    ERROR = "error",
    WARN = "warn",
    INFO = "info",
    HTTP = "http",
    VERBOSE = "verbose",
    DEBUG = "debug",
    SILLY = "silly"
}
/**
 * Log Category Types
 * Categorization for different types of server operations
 */
export declare enum LogCategory {
    SERVER = "server",
    SESSION = "session",
    TOOL = "tool",
    TRANSPORT = "transport",
    ERROR = "error",
    PERFORMANCE = "performance",
    SECURITY = "security",
    AUDIT = "audit"
}
/**
 * Log Sanitization Rules
 * Constitutional requirements for data sanitization
 */
export interface LogSanitizationRules {
    /** Remove sensitive data patterns */
    removeSensitiveData: boolean;
    /** Mask authentication tokens */
    maskAuthTokens: boolean;
    /** Truncate large payloads */
    truncateLargePayloads: boolean;
    /** Maximum payload size before truncation */
    maxPayloadSize: number;
    /** Fields to always exclude */
    excludeFields: string[];
    /** Fields to mask with asterisks */
    maskFields: string[];
}
/**
 * Remote Logging Configuration
 * Optional Loki+Grafana integration
 */
export interface RemoteLoggingConfig {
    /** Enable remote logging */
    enabled: boolean;
    /** Loki endpoint URL */
    lokiUrl?: string;
    /** Grafana endpoint URL */
    grafanaUrl?: string;
    /** Authentication token */
    authToken?: string;
    /** Log labels for Loki */
    labels?: Record<string, string>;
    /** Batch size for log shipping */
    batchSize?: number;
    /** Flush interval in milliseconds */
    flushInterval?: number;
}
/**
 * Logging Configuration
 * Complete configuration for the logging system
 */
export interface LoggingConfig {
    /** Log level */
    level: LogLevel;
    /** Enable console logging */
    console: boolean;
    /** Enable file logging */
    file: boolean;
    /** Log directory */
    logDir: string;
    /** Log file prefix */
    filePrefix: string;
    /** Daily rotation configuration */
    rotation: {
        /** Maximum file size before rotation */
        maxSize: string;
        /** Maximum number of files to keep */
        maxFiles: string;
        /** Date pattern for rotation */
        datePattern: string;
    };
    /** Sanitization rules */
    sanitization: LogSanitizationRules;
    /** Remote logging configuration */
    remote: RemoteLoggingConfig;
    /** Performance monitoring */
    performance: {
        /** Enable performance logging */
        enabled: boolean;
        /** Slow operation threshold in milliseconds */
        slowOperationThreshold: number;
        /** Memory usage logging interval */
        memoryLogInterval: number;
    };
}
/**
 * Base Log Entry
 * Common structure for all log entries
 */
export interface BaseLogEntry {
    /** Timestamp */
    timestamp: string;
    /** Log level */
    level: LogLevel;
    /** Log category */
    category: LogCategory;
    /** Log message */
    message: string;
    /** Additional metadata */
    metadata?: Record<string, any>;
    /** Request ID for correlation */
    requestId?: string;
    /** Session ID for correlation */
    sessionId?: string;
    /** Server instance ID */
    serverId?: string;
}
/**
 * Server Log Entry
 * Logging for server lifecycle events
 */
export interface ServerLogEntry extends BaseLogEntry {
    category: LogCategory.SERVER;
    metadata: {
        event: 'start' | 'stop' | 'restart' | 'error' | 'health_check' | 'cleanup' | 'shutdown';
        uptime?: number;
        memoryUsage?: NodeJS.MemoryUsage;
        activeSessions?: number;
        serverName?: string;
        version?: string;
        description?: string;
        maxConnections?: number;
        expiredSessions?: number;
        totalSessions?: number;
        defaultTimeout?: number;
        sessionsBefore?: number;
        sessionsAfter?: number;
        cleanedSessions?: number;
        finalSessions?: number;
        error?: {
            code: MCPErrorCode;
            message: string;
            stack?: string;
        };
    };
}
/**
 * Session Log Entry
 * Logging for client session events
 */
export interface SessionLogEntry extends BaseLogEntry {
    category: LogCategory.SESSION;
    sessionId: string;
    metadata: {
        event: 'created' | 'removed' | 'expired' | 'error' | 'activity' | 'authenticated' | 'disconnecting' | 'disconnected';
        clientId?: string;
        transportType?: string;
        duration?: number;
        requestsProcessed?: number;
        sessionId?: string;
        authData?: string;
        reason?: string;
        error?: {
            code: MCPErrorCode;
            message: string;
        };
    };
}
/**
 * Tool Log Entry
 * Logging for tool execution events
 */
export interface ToolLogEntry extends BaseLogEntry {
    category: LogCategory.TOOL;
    metadata: {
        event: 'registered' | 'unregistered' | 'executed' | 'error';
        toolName: string;
        description?: string;
        parameters?: number;
        executionTime?: number;
        memoryUsed?: number;
        success?: boolean;
        result?: any;
        error?: {
            code: MCPErrorCode;
            message: string;
            stack?: string;
        };
    };
}
/**
 * Transport Log Entry
 * Logging for transport layer events
 */
export interface TransportLogEntry extends BaseLogEntry {
    category: LogCategory.TRANSPORT;
    metadata: {
        event: 'connected' | 'disconnected' | 'error' | 'message_sent' | 'message_received';
        transportType: string;
        messageSize?: number;
        responseTime?: number;
        headers?: Record<string, any>;
        sessionId?: string;
        error?: {
            code: MCPErrorCode;
            message: string;
        };
    };
}
/**
 * Performance Log Entry
 * Logging for performance metrics
 */
export interface PerformanceLogEntry extends BaseLogEntry {
    category: LogCategory.PERFORMANCE;
    metadata: {
        metric: 'memory_usage' | 'response_time' | 'throughput' | 'error_rate';
        value: number;
        threshold?: number;
        exceeded?: boolean;
        details?: Record<string, any>;
    };
}
/**
 * Security Log Entry
 * Logging for security-related events
 */
export interface SecurityLogEntry extends BaseLogEntry {
    category: LogCategory.SECURITY;
    metadata: {
        event: 'authentication' | 'authorization' | 'rate_limit' | 'suspicious_activity';
        clientId?: string;
        ipAddress?: string;
        userAgent?: string;
        success?: boolean;
        reason?: string;
    };
}
/**
 * Audit Log Entry
 * Logging for audit trail events
 */
export interface AuditLogEntry extends BaseLogEntry {
    category: LogCategory.AUDIT;
    metadata: {
        action: string;
        resource: string;
        clientId: string;
        sessionId: string;
        success: boolean;
        executionTime?: number;
        parameters?: Record<string, any>;
        details?: Record<string, any>;
    };
}
/**
 * MCP Server Logger
 *
 * Centralized logging system for the MCP server with advanced features
 * including rotation, sanitization, and remote aggregation.
 */
export declare class MCPServerLogger extends EventEmitter {
    private logger;
    private config;
    private serverId;
    private performanceTimer?;
    private remoteLogger?;
    constructor(config?: Partial<LoggingConfig>);
    /**
     * Log server events
     */
    logServerEvent(event: ServerLogEntry['metadata']['event'], metadata?: Partial<ServerLogEntry['metadata']>): void;
    /**
     * Log session events
     */
    logSessionEvent(sessionId: string, event: SessionLogEntry['metadata']['event'], metadata?: Partial<SessionLogEntry['metadata']>): void;
    /**
     * Log tool events
     */
    logToolEvent(toolName: string, event: ToolLogEntry['metadata']['event'], metadata?: Partial<ToolLogEntry['metadata']>): void;
    /**
     * Log transport events
     */
    logTransportEvent(transportType: string, event: TransportLogEntry['metadata']['event'], metadata?: Partial<TransportLogEntry['metadata']>): void;
    /**
     * Log performance metrics
     */
    logPerformanceMetric(metric: PerformanceLogEntry['metadata']['metric'], value: number, metadata?: Partial<PerformanceLogEntry['metadata']>): void;
    /**
     * Log security events
     */
    logSecurityEvent(event: SecurityLogEntry['metadata']['event'], metadata?: Partial<SecurityLogEntry['metadata']>): void;
    /**
     * Log audit events
     */
    logAuditEvent(action: string, resource: string, clientId: string, sessionId: string, success: boolean, metadata?: Partial<AuditLogEntry['metadata']>): void;
    /**
     * Log error with context
     */
    logError(error: Error, context: {
        category: LogCategory;
        requestId?: string;
        sessionId?: string;
        metadata?: Record<string, any>;
    }): void;
    /**
     * Log MCP protocol message
     */
    logProtocolMessage(message: ProtocolMessage, direction: 'incoming' | 'outgoing', sessionId?: string): void;
    /**
     * Get logger statistics
     */
    getLoggerStats(): {
        totalLogs: number;
        logsByLevel: Record<LogLevel, number>;
        logsByCategory: Record<LogCategory, number>;
        memoryUsage: number;
        uptime: number;
    };
    /**
     * Close the logger
     */
    close(): Promise<void>;
    /**
     * Create Winston logger instance
     */
    private createWinstonLogger;
    /**
     * Log entry with sanitization
     */
    private logEntry;
    /**
     * Sanitize log entry according to constitutional requirements
     */
    private sanitizeLogEntry;
    /**
     * Sanitize metadata object
     */
    private sanitizeMetadata;
    /**
     * Setup performance monitoring
     */
    private setupPerformanceMonitoring;
    /**
     * Setup remote logging (Loki+Grafana)
     */
    private setupRemoteLogging;
    /**
     * Get log level for event type
     */
    private getLogLevelForEvent;
    /**
     * Get log level for performance metric
     */
    private getLogLevelForMetric;
    /**
     * Merge configuration with defaults
     */
    private mergeWithDefaults;
}
/**
 * Create logger instance from server config
 */
export declare function createLoggerFromConfig(config: ServerConfig): MCPServerLogger;
/**
 * Get or create global logger
 */
export declare function getGlobalLogger(): MCPServerLogger;
/**
 * Set global logger
 */
export declare function setGlobalLogger(logger: MCPServerLogger): void;
export default MCPServerLogger;
//# sourceMappingURL=logger.d.ts.map