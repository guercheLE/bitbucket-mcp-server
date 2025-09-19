/**
 * Pull Request Logging Service
 * T029: Request/response logging with sanitization for pull request operations
 * 
 * Specialized logging service for pull request operations with advanced sanitization
 * and structured logging for monitoring and debugging
 */

import { logger } from '../utils/logger.js';
import { sanitizeObject, sanitizeString } from '../utils/sanitizer.js';

// Log levels for pull request operations
export type PullRequestLogLevel = 'debug' | 'info' | 'warn' | 'error';

// Log entry types
export type LogEntryType = 'request' | 'response' | 'error' | 'performance' | 'authentication' | 'cache';

// Pull request operation context
export interface PullRequestLogContext {
  operation: string;
  projectKey?: string;
  repositorySlug?: string;
  pullRequestId?: number;
  commentId?: number;
  userId?: string;
  serverUrl?: string;
  requestId?: string;
  sessionId?: string;
  timestamp?: Date;
  duration?: number;
  statusCode?: number;
  errorCode?: string;
  authenticationMethod?: string;
  cacheHit?: boolean;
  rateLimitRemaining?: number;
}

// Log entry structure
export interface PullRequestLogEntry {
  type: LogEntryType;
  level: PullRequestLogLevel;
  message: string;
  context: PullRequestLogContext;
  data?: any;
  metadata?: any;
}

/**
 * Pull Request Logging Service
 */
export class PullRequestLoggingService {
  private static instance: PullRequestLoggingService;
  private readonly MAX_LOG_SIZE = 10000; // 10KB max per log entry
  private readonly SENSITIVE_FIELDS = [
    'accessToken', 'access_token', 'token', 'password', 'secret', 'key',
    'clientSecret', 'client_secret', 'authorization', 'authorizationCode',
    'refreshToken', 'refresh_token', 'jwt', 'sessionId', 'session_id',
    'apiKey', 'api_key', 'bearer', 'credentials', 'auth', 'authentication'
  ];

  private constructor() {}

  public static getInstance(): PullRequestLoggingService {
    if (!PullRequestLoggingService.instance) {
      PullRequestLoggingService.instance = new PullRequestLoggingService();
    }
    return PullRequestLoggingService.instance;
  }

  /**
   * Log pull request request
   */
  public logRequest(
    operation: string,
    context: Partial<PullRequestLogContext>,
    requestData?: any
  ): void {
    const logEntry: PullRequestLogEntry = {
      type: 'request',
      level: 'info',
      message: `Pull request ${operation} request`,
      context: {
        operation,
        timestamp: new Date(),
        ...context
      },
      data: this.sanitizeRequestData(requestData)
    };

    this.writeLog(logEntry);
  }

  /**
   * Log pull request response
   */
  public logResponse(
    operation: string,
    context: Partial<PullRequestLogContext>,
    responseData?: any,
    performance?: { duration: number; statusCode: number }
  ): void {
    const logEntry: PullRequestLogEntry = {
      type: 'response',
      level: 'info',
      message: `Pull request ${operation} response`,
      context: {
        operation,
        timestamp: new Date(),
        duration: performance?.duration,
        statusCode: performance?.statusCode,
        ...context
      },
      data: this.sanitizeResponseData(responseData)
    };

    this.writeLog(logEntry);
  }

  /**
   * Log pull request error
   */
  public logError(
    operation: string,
    context: Partial<PullRequestLogContext>,
    error: Error | string,
    errorData?: any
  ): void {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;

    const logEntry: PullRequestLogEntry = {
      type: 'error',
      level: 'error',
      message: `Pull request ${operation} error: ${errorMessage}`,
      context: {
        operation,
        timestamp: new Date(),
        errorCode: error instanceof Error ? error.name : 'UnknownError',
        ...context
      },
      data: {
        error: errorMessage,
        stack: errorStack,
        ...this.sanitizeErrorData(errorData)
      }
    };

    this.writeLog(logEntry);
  }

  /**
   * Log performance metrics
   */
  public logPerformance(
    operation: string,
    context: Partial<PullRequestLogContext>,
    metrics: {
      duration: number;
      statusCode: number;
      cacheHit?: boolean;
      rateLimitRemaining?: number;
      requestSize?: number;
      responseSize?: number;
    }
  ): void {
    const logEntry: PullRequestLogEntry = {
      type: 'performance',
      level: 'info',
      message: `Pull request ${operation} performance`,
      context: {
        operation,
        timestamp: new Date(),
        duration: metrics.duration,
        statusCode: metrics.statusCode,
        cacheHit: metrics.cacheHit,
        rateLimitRemaining: metrics.rateLimitRemaining,
        ...context
      },
      data: {
        requestSize: metrics.requestSize,
        responseSize: metrics.responseSize,
        throughput: metrics.requestSize && metrics.duration ? 
          (metrics.requestSize / metrics.duration * 1000) : undefined // bytes/sec
      }
    };

    this.writeLog(logEntry);
  }

  /**
   * Log authentication events
   */
  public logAuthentication(
    operation: string,
    context: Partial<PullRequestLogContext>,
    authData?: any
  ): void {
    const logEntry: PullRequestLogEntry = {
      type: 'authentication',
      level: 'info',
      message: `Pull request ${operation} authentication`,
      context: {
        operation,
        timestamp: new Date(),
        ...context
      },
      data: this.sanitizeAuthData(authData)
    };

    this.writeLog(logEntry);
  }

  /**
   * Log cache operations
   */
  public logCache(
    operation: string,
    context: Partial<PullRequestLogContext>,
    cacheData?: any
  ): void {
    const logEntry: PullRequestLogEntry = {
      type: 'cache',
      level: 'debug',
      message: `Pull request ${operation} cache`,
      context: {
        operation,
        timestamp: new Date(),
        ...context
      },
      data: this.sanitizeCacheData(cacheData)
    };

    this.writeLog(logEntry);
  }

  /**
   * Write log entry
   */
  private writeLog(logEntry: PullRequestLogEntry): void {
    try {
      // Truncate large log entries
      const truncatedEntry = this.truncateLogEntry(logEntry);
      
      // Use appropriate logger method based on level
      switch (logEntry.level) {
        case 'debug':
          logger.debug(logEntry.message, {
            pullRequestLog: truncatedEntry
          });
          break;
        case 'info':
          logger.info(logEntry.message, {
            pullRequestLog: truncatedEntry
          });
          break;
        case 'warn':
          logger.warn(logEntry.message, {
            pullRequestLog: truncatedEntry
          });
          break;
        case 'error':
          logger.error(logEntry.message, {
            pullRequestLog: truncatedEntry
          });
          break;
      }
    } catch (error) {
      // Fallback logging if structured logging fails
      logger.error('Failed to write pull request log', {
        error: error instanceof Error ? error.message : 'Unknown error',
        originalMessage: logEntry.message
      });
    }
  }

  /**
   * Sanitize request data
   */
  private sanitizeRequestData(data: any): any {
    if (!data) return data;

    const sanitized = sanitizeObject(data);
    
    // Additional sanitization for pull request specific fields
    return this.sanitizePullRequestFields(sanitized);
  }

  /**
   * Sanitize response data
   */
  private sanitizeResponseData(data: any): any {
    if (!data) return data;

    const sanitized = sanitizeObject(data);
    
    // Additional sanitization for pull request specific fields
    return this.sanitizePullRequestFields(sanitized);
  }

  /**
   * Sanitize error data
   */
  private sanitizeErrorData(data: any): any {
    if (!data) return data;

    const sanitized = sanitizeObject(data);
    
    // Additional sanitization for error specific fields
    return this.sanitizePullRequestFields(sanitized);
  }

  /**
   * Sanitize authentication data
   */
  private sanitizeAuthData(data: any): any {
    if (!data) return data;

    const sanitized = sanitizeObject(data);
    
    // Remove all sensitive authentication fields
    const authSanitized = { ...sanitized };
    this.SENSITIVE_FIELDS.forEach(field => {
      if (authSanitized[field]) {
        authSanitized[field] = '[REDACTED]';
      }
    });

    return this.sanitizePullRequestFields(authSanitized);
  }

  /**
   * Sanitize cache data
   */
  private sanitizeCacheData(data: any): any {
    if (!data) return data;

    const sanitized = sanitizeObject(data);
    
    // Cache data is generally safe, but sanitize any potential sensitive fields
    return this.sanitizePullRequestFields(sanitized);
  }

  /**
   * Sanitize pull request specific fields
   */
  private sanitizePullRequestFields(data: any): any {
    if (!data || typeof data !== 'object') return data;

    const sanitized = { ...data };

    // Sanitize pull request specific sensitive fields
    if (sanitized.author && sanitized.author.email) {
      sanitized.author.email = this.maskEmail(sanitized.author.email);
    }

    if (sanitized.reviewers && Array.isArray(sanitized.reviewers)) {
      sanitized.reviewers = sanitized.reviewers.map((reviewer: any) => {
        if (reviewer.email) {
          reviewer.email = this.maskEmail(reviewer.email);
        }
        return reviewer;
      });
    }

    if (sanitized.participants && Array.isArray(sanitized.participants)) {
      sanitized.participants = sanitized.participants.map((participant: any) => {
        if (participant.user && participant.user.email) {
          participant.user.email = this.maskEmail(participant.user.email);
        }
        return participant;
      });
    }

    return sanitized;
  }

  /**
   * Mask email address
   */
  private maskEmail(email: string): string {
    if (!email || typeof email !== 'string') return email;
    
    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) return '[REDACTED]';
    
    const maskedLocal = localPart.length > 2 
      ? `${localPart[0]}***${localPart[localPart.length - 1]}`
      : '***';
    
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Truncate large log entries
   */
  private truncateLogEntry(logEntry: PullRequestLogEntry): PullRequestLogEntry {
    const serialized = JSON.stringify(logEntry);
    
    if (serialized.length <= this.MAX_LOG_SIZE) {
      return logEntry;
    }

    // Truncate data if too large
    const truncatedEntry = { ...logEntry };
    if (truncatedEntry.data) {
      const dataStr = JSON.stringify(truncatedEntry.data);
      if (dataStr.length > this.MAX_LOG_SIZE / 2) {
        truncatedEntry.data = {
          ...truncatedEntry.data,
          _truncated: true,
          _originalSize: dataStr.length
        };
      }
    }

    return truncatedEntry;
  }

  /**
   * Get logging statistics
   */
  public getStats(): any {
    return {
      service: 'pullrequest-logging',
      maxLogSize: this.MAX_LOG_SIZE,
      sensitiveFields: this.SENSITIVE_FIELDS.length,
      supportedLogTypes: ['request', 'response', 'error', 'performance', 'authentication', 'cache']
    };
  }

  /**
   * Create a log context for an operation
   */
  public createLogContext(
    operation: string,
    projectKey?: string,
    repositorySlug?: string,
    pullRequestId?: number,
    requestId?: string
  ): PullRequestLogContext {
    return {
      operation,
      projectKey,
      repositorySlug,
      pullRequestId,
      requestId,
      timestamp: new Date()
    };
  }

  /**
   * Log operation start
   */
  public logOperationStart(
    operation: string,
    context: Partial<PullRequestLogContext>,
    requestData?: any
  ): string {
    const requestId = context.requestId || this.generateRequestId();
    const logContext = { ...context, requestId };

    this.logRequest(operation, logContext, requestData);
    return requestId;
  }

  /**
   * Log operation end
   */
  public logOperationEnd(
    operation: string,
    requestId: string,
    context: Partial<PullRequestLogContext>,
    responseData?: any,
    performance?: { duration: number; statusCode: number }
  ): void {
    const logContext = { ...context, requestId };
    this.logResponse(operation, logContext, responseData, performance);
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `pr_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}

// Export singleton instance
export const pullRequestLoggingService = PullRequestLoggingService.getInstance();
