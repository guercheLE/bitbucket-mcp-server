/**
 * Winston Logger Implementation
 * Structured logging with sanitization and correlation
 */

import winston from 'winston';
import { LogLevel, LoggingConfig } from '../types/index.js';
import { environment } from '../config/environment.js';

// ============================================================================
// Log Format Configuration
// ============================================================================

const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const sanitizedMeta = environment.sanitizeForLogging(meta);
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...sanitizedMeta,
    });
  })
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss.SSS',
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
// Logger Configuration
// ============================================================================

class LoggerManager {
  private logger: winston.Logger;
  private config: LoggingConfig;

  constructor() {
    this.config = this.getLoggingConfig();
    this.logger = this.createLogger();
  }

  private getLoggingConfig(): LoggingConfig {
    const envConfig = environment.getConfig();
    
    return {
      level: envConfig.logging.level as LogLevel,
      format: envConfig.logging.format as 'json' | 'text',
      destinations: [
        {
          type: 'console',
          config: {
            colorize: true,
          },
        },
        ...(envConfig.logging.file ? [{
          type: 'file' as const,
          config: {
            filename: envConfig.logging.file,
            maxSize: '10m',
            maxFiles: 5,
          },
        }] : []),
      ],
    };
  }

  private createLogger(): winston.Logger {
    const transports: winston.transport[] = [];

    // Console transport
    const consoleTransport = new winston.transports.Console({
      level: this.config.level,
      format: this.config.format === 'json' ? logFormat : consoleFormat,
      silent: environment.isTest(),
    });
    transports.push(consoleTransport);

    // File transport (if configured)
    const fileDestination = this.config.destinations.find(d => d.type === 'file');
    if (fileDestination) {
      const fileConfig = fileDestination.config as any;
      const fileTransport = new winston.transports.File({
        filename: fileConfig.filename || 'logs/app.log',
        level: this.config.level,
        format: logFormat,
        maxsize: this.parseSize(fileConfig.maxSize || '10m'),
        maxFiles: fileConfig.maxFiles || 5,
        tailable: true,
      });
      transports.push(fileTransport);
    }

    return winston.createLogger({
      level: this.config.level,
      format: logFormat,
      transports,
      exitOnError: false,
      silent: environment.isTest(),
    });
  }

  private parseSize(size: string): number {
    const units: Record<string, number> = {
      'b': 1,
      'k': 1024,
      'm': 1024 * 1024,
      'g': 1024 * 1024 * 1024,
    };

    const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)([bkmg]?)$/);
    if (!match) {
      return 10 * 1024 * 1024; // Default 10MB
    }

    const value = parseFloat(match[1] || '0');
    const unit = match[2] || 'b';
    return Math.floor(value * (units[unit] || 1));
  }

  // ============================================================================
  // Public Logging Methods
  // ============================================================================

  public error(message: string, meta?: any): void {
    this.logger.error(message, this.addCorrelationId(meta));
  }

  public warn(message: string, meta?: any): void {
    this.logger.warn(message, this.addCorrelationId(meta));
  }

  public info(message: string, meta?: any): void {
    this.logger.info(message, this.addCorrelationId(meta));
  }

  public debug(message: string, meta?: any): void {
    this.logger.debug(message, this.addCorrelationId(meta));
  }

  // ============================================================================
  // Structured Logging Methods
  // ============================================================================

  public logRequest(method: string, url: string, meta?: any): void {
    this.info('HTTP Request', {
      method,
      url,
      ...meta,
    });
  }

  public logResponse(method: string, url: string, statusCode: number, duration: number, meta?: any): void {
    this.info('HTTP Response', {
      method,
      url,
      statusCode,
      duration,
      ...meta,
    });
  }

  public logError(error: Error, context?: any): void {
    this.error('Application Error', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
    });
  }

  public logPerformance(operation: string, duration: number, meta?: any): void {
    this.info('Performance Metric', {
      operation,
      duration,
      ...meta,
    });
  }

  public logSecurity(event: string, meta?: any): void {
    this.warn('Security Event', {
      event,
      ...meta,
    });
  }

  public logBusiness(event: string, meta?: any): void {
    this.info('Business Event', {
      event,
      ...meta,
    });
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private addCorrelationId(meta?: any): any {
    if (!meta) {
      meta = {};
    }

    // Add correlation ID if not present
    if (!meta.correlationId) {
      meta.correlationId = this.generateCorrelationId();
    }

    // Add process information
    meta.process = {
      pid: process.pid,
      uptime: process.uptime(),
    };

    // Add environment information
    meta.environment = {
      nodeEnv: environment.getRawEnvironment().NODE_ENV,
      version: process.env['npm_package_version'] || '1.0.0',
    };

    return meta;
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public createChildLogger(prefix: string): winston.Logger {
    return this.logger.child({ prefix });
  }

  public setLevel(level: LogLevel): void {
    this.logger.level = level;
  }

  public getLevel(): string {
    return this.logger.level;
  }

  public isLevelEnabled(level: LogLevel): boolean {
    return this.logger.isLevelEnabled(level);
  }

  // ============================================================================
  // Log Rotation and Management
  // ============================================================================

  public async rotateLogs(): Promise<void> {
    try {
      // Close current file transports
      const fileTransports = this.logger.transports.filter(
        transport => transport instanceof winston.transports.File
      );

      for (const transport of fileTransports) {
        await new Promise<void>((resolve, reject) => {
          (transport as any).close((error: any) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });
      }

      // Recreate logger with new transports
      this.logger = this.createLogger();
      
      this.info('Log rotation completed');
    } catch (error) {
      this.error('Log rotation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public getLogStats(): any {
    const stats: any = {
      level: this.logger.level,
      transports: this.logger.transports.length,
      silent: this.logger.silent,
    };

    // Add file transport stats
    const fileTransports = this.logger.transports.filter(
      transport => transport instanceof winston.transports.File
    );

    if (fileTransports.length > 0) {
      stats.fileTransports = fileTransports.map((transport: any) => ({
        filename: transport.filename,
        level: transport.level,
      }));
    }

    return stats;
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const logger = new LoggerManager();

// Export convenience methods
export const logError = (message: string, meta?: any) => logger.error(message, meta);
export const logWarn = (message: string, meta?: any) => logger.warn(message, meta);
export const logInfo = (message: string, meta?: any) => logger.info(message, meta);
export const logDebug = (message: string, meta?: any) => logger.debug(message, meta);

// Export structured logging methods
export const logRequest = (method: string, url: string, meta?: any) => 
  logger.logRequest(method, url, meta);
export const logResponse = (method: string, url: string, statusCode: number, duration: number, meta?: any) => 
  logger.logResponse(method, url, statusCode, duration, meta);
export const logApplicationError = (error: Error, context?: any) => 
  logger.logError(error, context);
export const logPerformance = (operation: string, duration: number, meta?: any) => 
  logger.logPerformance(operation, duration, meta);
export const logSecurity = (event: string, meta?: any) => 
  logger.logSecurity(event, meta);
export const logBusiness = (event: string, meta?: any) => 
  logger.logBusiness(event, meta);

// Export types
export type { LogLevel, LoggingConfig };
