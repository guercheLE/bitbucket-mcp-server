/**
 * Winston Logger Configuration
 * Centralized logging with sanitization and multiple transports
 */

import winston from 'winston';
import { environment } from '../config/environment';
import { LogLevel } from '../types/index';

// ============================================================================
// Logger Configuration
// ============================================================================

const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const sanitizedMeta = environment.sanitizeForLogging(meta);
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...sanitizedMeta
    });
  })
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss.SSS'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const sanitizedMeta = environment.sanitizeForLogging(meta);
    const metaStr = Object.keys(sanitizedMeta).length > 0 
      ? ` ${JSON.stringify(sanitizedMeta)}` 
      : '';
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// ============================================================================
// Transport Configuration
// ============================================================================

const transports: winston.transport[] = [];

// Console transport
transports.push(
  new winston.transports.Console({
    level: environment.getConfig().logging.level,
    format: environment.getConfig().logging.format === 'json' ? logFormat : consoleFormat,
    silent: environment.isTest()
  })
);

// File transport (if configured)
if (environment.getConfig().logging.file) {
  transports.push(
    new winston.transports.File({
      filename: environment.getConfig().logging.file,
      level: environment.getConfig().logging.level,
      format: logFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    })
  );
}

// ============================================================================
// Logger Instance
// ============================================================================

export const logger = winston.createLogger({
  level: environment.getConfig().logging.level,
  format: logFormat,
  transports,
  exitOnError: false,
  silent: environment.isTest()
});

// ============================================================================
// Request/Response Logging Middleware
// ============================================================================

export interface RequestLogData {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: any;
  query?: Record<string, any>;
  params?: Record<string, any>;
  userAgent?: string;
  ip?: string;
  requestId?: string;
}

export interface ResponseLogData {
  statusCode?: number;
  headers?: Record<string, any>;
  body?: any;
  responseTime?: number;
  requestId?: string;
}

export interface ErrorLogData {
  error?: Error;
  requestId?: string;
  context?: Record<string, any>;
  stack?: string;
}

/**
 * Logs incoming requests with sanitization
 */
export function logRequest(data: RequestLogData): void {
  const sanitizedData = environment.sanitizeForLogging(data);
  
  logger.info('Incoming request', {
    type: 'request',
    ...sanitizedData,
    timestamp: new Date().toISOString()
  });
}

/**
 * Logs outgoing responses with sanitization
 */
export function logResponse(data: ResponseLogData): void {
  const sanitizedData = environment.sanitizeForLogging(data);
  
  logger.info('Outgoing response', {
    type: 'response',
    ...sanitizedData,
    timestamp: new Date().toISOString()
  });
}

/**
 * Logs errors with sanitization and context
 */
export function logError(message: string, error?: Error | unknown, context?: Record<string, any>): void {
  const errorObj = error instanceof Error ? error : new Error(String(error || message));
  const errorData: ErrorLogData = {
    error: errorObj,
    context: context || {}
  };
  
  const sanitizedData = environment.sanitizeForLogging(errorData);
  
  logger.error(message, {
    type: 'error',
    error: {
      name: errorObj.name,
      message: errorObj.message,
      stack: errorObj.stack
    },
    ...sanitizedData,
    timestamp: new Date().toISOString()
  });
}

/**
 * Logs performance metrics
 */
export function logPerformance(operation: string, duration: number, metadata?: Record<string, any>): void {
  const sanitizedMetadata = environment.sanitizeForLogging(metadata || {});
  
  logger.info('Performance metric', {
    type: 'performance',
    operation,
    duration,
    ...sanitizedMetadata,
    timestamp: new Date().toISOString()
  });
}

/**
 * Logs authentication events
 */
export function logAuth(event: string, method: string, success: boolean, metadata?: Record<string, any>): void {
  const sanitizedMetadata = environment.sanitizeForLogging(metadata || {});
  
  logger.info('Authentication event', {
    type: 'auth',
    event,
    method,
    success,
    ...sanitizedMetadata,
    timestamp: new Date().toISOString()
  });
}

/**
 * Logs cache operations
 */
export function logCache(operation: 'hit' | 'miss' | 'set' | 'delete' | 'clear', key: string, metadata?: Record<string, any>): void {
  const sanitizedMetadata = environment.sanitizeForLogging(metadata || {});
  
  logger.debug('Cache operation', {
    type: 'cache',
    operation,
    key,
    ...sanitizedMetadata,
    timestamp: new Date().toISOString()
  });
}

/**
 * Logs transport events
 */
export function logTransport(event: string, transport: string, metadata?: Record<string, any>): void {
  const sanitizedMetadata = environment.sanitizeForLogging(metadata || {});
  
  logger.info('Transport event', {
    type: 'transport',
    event,
    transport,
    ...sanitizedMetadata,
    timestamp: new Date().toISOString()
  });
}

/**
 * Logs health check results
 */
export function logHealthCheck(service: string, status: 'healthy' | 'unhealthy', metadata?: Record<string, any>): void {
  const sanitizedMetadata = environment.sanitizeForLogging(metadata || {});
  
  logger.info('Health check', {
    type: 'health',
    service,
    status,
    ...sanitizedMetadata,
    timestamp: new Date().toISOString()
  });
}

// ============================================================================
// Logger Utilities
// ============================================================================

/**
 * Creates a child logger with additional context
 */
export function createChildLogger(context: Record<string, any>): winston.Logger {
  const sanitizedContext = environment.sanitizeForLogging(context);
  
  return logger.child(sanitizedContext);
}

/**
 * Sets the log level dynamically
 */
export function setLogLevel(level: LogLevel): void {
  logger.level = level;
  logger.transports.forEach(transport => {
    if ('level' in transport) {
      transport.level = level;
    }
  });
}

/**
 * Gets current log level
 */
export function getLogLevel(): string {
  return logger.level;
}

/**
 * Checks if a log level is enabled
 */
export function isLogLevelEnabled(level: LogLevel): boolean {
  return logger.isLevelEnabled(level);
}

// ============================================================================
// Development Helpers
// ============================================================================

if (environment.isDevelopment()) {
  // Add development-specific logging
  logger.add(new winston.transports.Console({
    level: 'debug',
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// ============================================================================
// Graceful Shutdown
// ============================================================================

process.on('SIGINT', () => {
  logger.info('Received SIGINT, closing logger...');
  logger.end();
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, closing logger...');
  logger.end();
});

export default logger;