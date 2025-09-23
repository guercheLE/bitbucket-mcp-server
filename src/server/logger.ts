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
import { 
  ServerConfig, 
  MCPErrorCode, 
  ClientSession,
  ProtocolMessage,
  ToolExecutionContext
} from '../types/index';

// ============================================================================
// Logging Configuration Types
// ============================================================================

/**
 * Log Level Configuration
 * Standard Winston log levels with MCP-specific extensions
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly'
}

/**
 * Log Category Types
 * Categorization for different types of server operations
 */
export enum LogCategory {
  SERVER = 'server',
  SESSION = 'session',
  TOOL = 'tool',
  TRANSPORT = 'transport',
  ERROR = 'error',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  AUDIT = 'audit'
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

// ============================================================================
// Log Entry Types
// ============================================================================

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
  private logger: winston.Logger;
  private config: LoggingConfig;
  private serverId: string;
  private performanceTimer?: NodeJS.Timeout;
  private remoteLogger?: any; // Will be typed when implementing remote logging

  constructor(config: Partial<LoggingConfig> = {}) {
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
  logServerEvent(
    event: ServerLogEntry['metadata']['event'],
    metadata: Partial<ServerLogEntry['metadata']> = {}
  ): void {
    const entry: ServerLogEntry = {
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
  logSessionEvent(
    sessionId: string,
    event: SessionLogEntry['metadata']['event'],
    metadata: Partial<SessionLogEntry['metadata']> = {}
  ): void {
    const entry: SessionLogEntry = {
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
  logToolEvent(
    toolName: string,
    event: ToolLogEntry['metadata']['event'],
    metadata: Partial<ToolLogEntry['metadata']> = {}
  ): void {
    const entry: ToolLogEntry = {
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
  logTransportEvent(
    transportType: string,
    event: TransportLogEntry['metadata']['event'],
    metadata: Partial<TransportLogEntry['metadata']> = {}
  ): void {
    const entry: TransportLogEntry = {
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
  logPerformanceMetric(
    metric: PerformanceLogEntry['metadata']['metric'],
    value: number,
    metadata: Partial<PerformanceLogEntry['metadata']> = {}
  ): void {
    const entry: PerformanceLogEntry = {
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
  logSecurityEvent(
    event: SecurityLogEntry['metadata']['event'],
    metadata: Partial<SecurityLogEntry['metadata']> = {}
  ): void {
    const entry: SecurityLogEntry = {
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
  logAuditEvent(
    action: string,
    resource: string,
    clientId: string,
    sessionId: string,
    success: boolean,
    metadata: Partial<AuditLogEntry['metadata']> = {}
  ): void {
    const entry: AuditLogEntry = {
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
  logError(
    error: Error,
    context: {
      category: LogCategory;
      requestId?: string;
      sessionId?: string;
      metadata?: Record<string, any>;
    }
  ): void {
    const entry: BaseLogEntry = {
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
  logProtocolMessage(
    message: ProtocolMessage,
    direction: 'incoming' | 'outgoing',
    sessionId?: string
  ): void {
    const entry: BaseLogEntry = {
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
  getLoggerStats(): {
    totalLogs: number;
    logsByLevel: Record<LogLevel, number>;
    logsByCategory: Record<LogCategory, number>;
    memoryUsage: number;
    uptime: number;
  } {
    // This would be implemented with actual statistics tracking
    return {
      totalLogs: 0,
      logsByLevel: {} as Record<LogLevel, number>,
      logsByCategory: {} as Record<LogCategory, number>,
      memoryUsage: process.memoryUsage().heapUsed,
      uptime: process.uptime()
    };
  }

  /**
   * Close the logger
   */
  async close(): Promise<void> {
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
  private createWinstonLogger(): winston.Logger {
    const transports: winston.transport[] = [];

    // Console transport
    if (this.config.console) {
      transports.push(new winston.transports.Console({
        level: this.config.level,
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            return `${timestamp} [${level}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
          })
        )
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
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
      });

      transports.push(fileTransport);
    }

    return winston.createLogger({
      level: this.config.level,
      transports,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      )
    });
  }

  /**
   * Log entry with sanitization
   */
  private logEntry(entry: BaseLogEntry): void {
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
  private sanitizeLogEntry(entry: BaseLogEntry): BaseLogEntry {
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
  private sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
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
  private setupPerformanceMonitoring(): void {
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
  private setupRemoteLogging(): void {
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
  private getLogLevelForEvent(event: string): LogLevel {
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
  private getLogLevelForMetric(
    metric: string, 
    value: number, 
    threshold?: number
  ): LogLevel {
    if (threshold && value > threshold) {
      return LogLevel.WARN;
    }
    return LogLevel.DEBUG;
  }

  /**
   * Merge configuration with defaults
   */
  private mergeWithDefaults(config: Partial<LoggingConfig>): LoggingConfig {
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
export function createLoggerFromConfig(config: ServerConfig): MCPServerLogger {
  const loggingConfig: Partial<LoggingConfig> = {
    level: config.logging.level as LogLevel,
    console: config.logging.console,
    file: !!config.logging.file,
    logDir: config.logging.file ? './logs' : undefined
  };

  return new MCPServerLogger(loggingConfig);
}

/**
 * Global logger instance
 */
let globalLogger: MCPServerLogger | null = null;

/**
 * Get or create global logger
 */
export function getGlobalLogger(): MCPServerLogger {
  if (!globalLogger) {
    globalLogger = new MCPServerLogger();
  }
  return globalLogger;
}

/**
 * Set global logger
 */
export function setGlobalLogger(logger: MCPServerLogger): void {
  globalLogger = logger;
}

export default MCPServerLogger;
