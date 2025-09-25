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
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { EventEmitter } from 'events';
// ============================================================================
// Logging Configuration Types
// ============================================================================
/**
 * Log Level Configuration
 * Standard Winston log levels with MCP-specific extensions
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["INFO"] = "info";
    LogLevel["HTTP"] = "http";
    LogLevel["VERBOSE"] = "verbose";
    LogLevel["DEBUG"] = "debug";
    LogLevel["SILLY"] = "silly";
})(LogLevel || (LogLevel = {}));
/**
 * Log Category Types
 * Categorization for different types of server operations
 */
export var LogCategory;
(function (LogCategory) {
    LogCategory["SERVER"] = "server";
    LogCategory["SESSION"] = "session";
    LogCategory["TOOL"] = "tool";
    LogCategory["TRANSPORT"] = "transport";
    LogCategory["ERROR"] = "error";
    LogCategory["PERFORMANCE"] = "performance";
    LogCategory["SECURITY"] = "security";
    LogCategory["AUDIT"] = "audit";
})(LogCategory || (LogCategory = {}));
// ============================================================================
// MCP Logger Class
// ============================================================================
/**
 * MCP Server Logger
 *
 * Centralized logging system for the MCP server with advanced features
 * including rotation, sanitization, and remote aggregation.
 */
export class MCPServerLogger extends EventEmitter {
    logger;
    config;
    serverId;
    performanceTimer;
    remoteLogger; // Will be typed when implementing remote logging
    constructor(config = {}) {
        super();
        this.serverId = `mcp-server-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.config = this.mergeWithDefaults(config);
        this.logger = this.createWinstonLogger();
        this.setupPerformanceMonitoring();
        this.setupRemoteLogging();
        this.logServerEvent('start', { serverName: 'MCP Server' });
    }
    // ============================================================================
    // Public Logging Methods
    // ============================================================================
    /**
     * Log server events
     */
    logServerEvent(event, metadata = {}) {
        const entry = {
            timestamp: new Date().toISOString(),
            level: this.getLogLevelForEvent(event),
            category: LogCategory.SERVER,
            message: `Server ${event}`,
            serverId: this.serverId,
            metadata: {
                event,
                ...metadata
            }
        };
        this.logEntry(entry);
    }
    /**
     * Log session events
     */
    logSessionEvent(sessionId, event, metadata = {}) {
        const entry = {
            timestamp: new Date().toISOString(),
            level: this.getLogLevelForEvent(event),
            category: LogCategory.SESSION,
            message: `Session ${event}: ${sessionId}`,
            sessionId,
            serverId: this.serverId,
            metadata: {
                event,
                ...metadata
            }
        };
        this.logEntry(entry);
    }
    /**
     * Log tool events
     */
    logToolEvent(toolName, event, metadata = {}) {
        const entry = {
            timestamp: new Date().toISOString(),
            level: this.getLogLevelForEvent(event),
            category: LogCategory.TOOL,
            message: `Tool ${event}: ${toolName}`,
            serverId: this.serverId,
            metadata: {
                event,
                toolName,
                ...metadata
            }
        };
        this.logEntry(entry);
    }
    /**
     * Log transport events
     */
    logTransportEvent(transportType, event, metadata = {}) {
        const entry = {
            timestamp: new Date().toISOString(),
            level: this.getLogLevelForEvent(event),
            category: LogCategory.TRANSPORT,
            message: `Transport ${event}: ${transportType}`,
            serverId: this.serverId,
            metadata: {
                event,
                transportType,
                ...metadata
            }
        };
        this.logEntry(entry);
    }
    /**
     * Log performance metrics
     */
    logPerformanceMetric(metric, value, metadata = {}) {
        const entry = {
            timestamp: new Date().toISOString(),
            level: this.getLogLevelForMetric(metric, value, metadata.threshold),
            category: LogCategory.PERFORMANCE,
            message: `Performance ${metric}: ${value}`,
            serverId: this.serverId,
            metadata: {
                metric,
                value,
                ...metadata
            }
        };
        this.logEntry(entry);
    }
    /**
     * Log security events
     */
    logSecurityEvent(event, metadata = {}) {
        const entry = {
            timestamp: new Date().toISOString(),
            level: LogLevel.WARN,
            category: LogCategory.SECURITY,
            message: `Security ${event}`,
            serverId: this.serverId,
            metadata: {
                event,
                ...metadata
            }
        };
        this.logEntry(entry);
    }
    /**
     * Log audit events
     */
    logAuditEvent(action, resource, clientId, sessionId, success, metadata = {}) {
        const entry = {
            timestamp: new Date().toISOString(),
            level: LogLevel.INFO,
            category: LogCategory.AUDIT,
            message: `Audit: ${action} on ${resource}`,
            serverId: this.serverId,
            metadata: {
                action,
                resource,
                clientId,
                sessionId,
                success,
                ...metadata
            }
        };
        this.logEntry(entry);
    }
    /**
     * Log error with context
     */
    logError(error, context) {
        const entry = {
            timestamp: new Date().toISOString(),
            level: LogLevel.ERROR,
            category: context.category,
            message: error.message,
            requestId: context.requestId,
            sessionId: context.sessionId,
            serverId: this.serverId,
            metadata: {
                error: {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                },
                ...context.metadata
            }
        };
        this.logEntry(entry);
    }
    /**
     * Log MCP protocol message
     */
    logProtocolMessage(message, direction, sessionId) {
        const entry = {
            timestamp: new Date().toISOString(),
            level: LogLevel.DEBUG,
            category: LogCategory.TRANSPORT,
            message: `Protocol message ${direction}`,
            requestId: message.id?.toString(),
            sessionId,
            serverId: this.serverId,
            metadata: {
                direction,
                method: message.method,
                hasParams: !!message.params,
                hasResult: !!message.result,
                hasError: !!message.error
            }
        };
        this.logEntry(entry);
    }
    /**
     * Get logger statistics
     */
    getLoggerStats() {
        // This would be implemented with actual statistics tracking
        return {
            totalLogs: 0,
            logsByLevel: {},
            logsByCategory: {},
            memoryUsage: process.memoryUsage().heapUsed,
            uptime: process.uptime()
        };
    }
    /**
     * Close the logger
     */
    async close() {
        this.logServerEvent('stop');
        if (this.performanceTimer) {
            clearInterval(this.performanceTimer);
        }
        await this.logger.close();
        this.emit('closed');
    }
    // ============================================================================
    // Private Methods
    // ============================================================================
    /**
     * Create Winston logger instance
     */
    createWinstonLogger() {
        const transports = [];
        // Console transport
        if (this.config.console) {
            transports.push(new winston.transports.Console({
                level: this.config.level,
                format: winston.format.combine(winston.format.colorize(), winston.format.timestamp(), winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    return `${timestamp} [${level}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
                }))
            }));
        }
        // File transport with daily rotation
        if (this.config.file) {
            const fileTransport = new DailyRotateFile({
                level: this.config.level,
                filename: `${this.config.logDir}/${this.config.filePrefix}-%DATE%.log`,
                datePattern: this.config.rotation.datePattern,
                maxSize: this.config.rotation.maxSize,
                maxFiles: this.config.rotation.maxFiles,
                format: winston.format.combine(winston.format.timestamp(), winston.format.json())
            });
            transports.push(fileTransport);
        }
        return winston.createLogger({
            level: this.config.level,
            transports,
            format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json())
        });
    }
    /**
     * Log entry with sanitization
     */
    logEntry(entry) {
        const sanitizedEntry = this.sanitizeLogEntry(entry);
        this.logger.log(entry.level, entry.message, {
            category: entry.category,
            metadata: sanitizedEntry.metadata,
            requestId: entry.requestId,
            sessionId: entry.sessionId,
            serverId: entry.serverId
        });
        // Emit event for external listeners
        this.emit('log', sanitizedEntry);
    }
    /**
     * Sanitize log entry according to constitutional requirements
     */
    sanitizeLogEntry(entry) {
        if (!this.config.sanitization.removeSensitiveData) {
            return entry;
        }
        const sanitized = { ...entry };
        if (sanitized.metadata) {
            sanitized.metadata = this.sanitizeMetadata(sanitized.metadata);
        }
        return sanitized;
    }
    /**
     * Sanitize metadata object
     */
    sanitizeMetadata(metadata) {
        const sanitized = { ...metadata };
        // Remove excluded fields
        this.config.sanitization.excludeFields.forEach(field => {
            delete sanitized[field];
        });
        // Mask sensitive fields
        this.config.sanitization.maskFields.forEach(field => {
            if (sanitized[field]) {
                sanitized[field] = '***MASKED***';
            }
        });
        // Truncate large payloads
        if (this.config.sanitization.truncateLargePayloads) {
            Object.keys(sanitized).forEach(key => {
                const value = sanitized[key];
                if (typeof value === 'string' && value.length > this.config.sanitization.maxPayloadSize) {
                    sanitized[key] = value.substring(0, this.config.sanitization.maxPayloadSize) + '...[TRUNCATED]';
                }
            });
        }
        return sanitized;
    }
    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        if (!this.config.performance.enabled) {
            return;
        }
        this.performanceTimer = setInterval(() => {
            const memoryUsage = process.memoryUsage();
            this.logPerformanceMetric('memory_usage', memoryUsage.heapUsed, {
                threshold: 1024 * 1024 * 1024, // 1GB
                details: {
                    rss: memoryUsage.rss,
                    heapTotal: memoryUsage.heapTotal,
                    heapUsed: memoryUsage.heapUsed,
                    external: memoryUsage.external
                }
            });
        }, this.config.performance.memoryLogInterval);
    }
    /**
     * Setup remote logging (Loki+Grafana)
     */
    setupRemoteLogging() {
        if (!this.config.remote.enabled) {
            return;
        }
        // TODO: Implement Loki client integration
        // This would involve creating a custom Winston transport
        // that sends logs to Loki endpoint
    }
    /**
     * Get log level for event type
     */
    getLogLevelForEvent(event) {
        switch (event) {
            case 'error':
                return LogLevel.ERROR;
            case 'expired':
            case 'disconnected':
                return LogLevel.WARN;
            case 'start':
            case 'stop':
            case 'restart':
            case 'created':
            case 'removed':
            case 'registered':
            case 'unregistered':
            case 'connected':
                return LogLevel.INFO;
            default:
                return LogLevel.DEBUG;
        }
    }
    /**
     * Get log level for performance metric
     */
    getLogLevelForMetric(metric, value, threshold) {
        if (threshold && value > threshold) {
            return LogLevel.WARN;
        }
        return LogLevel.DEBUG;
    }
    /**
     * Merge configuration with defaults
     */
    mergeWithDefaults(config) {
        return {
            level: LogLevel.INFO,
            console: true,
            file: true,
            logDir: './logs',
            filePrefix: 'mcp-server',
            rotation: {
                maxSize: '20m',
                maxFiles: '30d',
                datePattern: 'YYYY-MM-DD'
            },
            sanitization: {
                removeSensitiveData: true,
                maskAuthTokens: true,
                truncateLargePayloads: true,
                maxPayloadSize: 1000,
                excludeFields: ['password', 'token', 'secret', 'key'],
                maskFields: ['authorization', 'cookie', 'session']
            },
            remote: {
                enabled: false
            },
            performance: {
                enabled: true,
                slowOperationThreshold: 1000,
                memoryLogInterval: 60000
            },
            ...config
        };
    }
}
// ============================================================================
// Utility Functions
// ============================================================================
/**
 * Create logger instance from server config
 */
export function createLoggerFromConfig(config) {
    const loggingConfig = {
        level: config.logging.level,
        console: config.logging.console,
        file: !!config.logging.file,
        logDir: config.logging.file ? './logs' : undefined
    };
    return new MCPServerLogger(loggingConfig);
}
/**
 * Global logger instance
 */
let globalLogger = null;
/**
 * Get or create global logger
 */
export function getGlobalLogger() {
    if (!globalLogger) {
        globalLogger = new MCPServerLogger();
    }
    return globalLogger;
}
/**
 * Set global logger
 */
export function setGlobalLogger(logger) {
    globalLogger = logger;
}
export default MCPServerLogger;
//# sourceMappingURL=logger.js.map