import winston from 'winston';
import { configService } from './config.service';

export interface LogContext {
  [key: string]: unknown;
}

export interface Logger {
  error(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
  child(context: LogContext): Logger;
}

class WinstonLogger implements Logger {
  private logger: winston.Logger;

  constructor(private context: LogContext = {}) {
    this.logger = this.createLogger();
  }

  private createLogger(): winston.Logger {
    const logLevel = configService.getLogLevel();
    const logFormat = configService.getLogFormat();
    const isProduction = configService.isProduction();

    const formats = [winston.format.timestamp(), winston.format.errors({ stack: true })];

    if (logFormat === 'json') {
      formats.push(winston.format.json());
    } else {
      formats.push(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const contextStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} [${level}] ${message}${contextStr}`;
        })
      );
    }

    return winston.createLogger({
      level: logLevel,
      format: winston.format.combine(...formats),
      defaultMeta: this.context,
      transports: [
        new winston.transports.Console({
          silent: configService.isTest(),
        }),
        ...(isProduction
          ? [
              new winston.transports.File({
                filename: 'logs/error.log',
                level: 'error',
                maxsize: 5242880, // 5MB
                maxFiles: 5,
              }),
              new winston.transports.File({
                filename: 'logs/combined.log',
                maxsize: 5242880, // 5MB
                maxFiles: 5,
              }),
            ]
          : []),
      ],
      exitOnError: false,
    });
  }

  error(message: string, context?: LogContext): void {
    this.logger.error(message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.logger.warn(message, context);
  }

  info(message: string, context?: LogContext): void {
    this.logger.info(message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.logger.debug(message, context);
  }

  child(context: LogContext): Logger {
    return new WinstonLogger({ ...this.context, ...context });
  }
}

export class LoggerService {
  private static instance: LoggerService;
  private loggers: Map<string, Logger> = new Map();

  private constructor() {}

  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  public getLogger(name: string = 'default', context: LogContext = {}): Logger {
    const key = `${name}:${JSON.stringify(context)}`;

    if (!this.loggers.has(key)) {
      const logger = new WinstonLogger({ service: name, ...context });
      this.loggers.set(key, logger);
    }

    return this.loggers.get(key)!;
  }

  public createChildLogger(parent: Logger, context: LogContext): Logger {
    return parent.child(context);
  }

  public logRequest(method: string, url: string, status: number, duration: number): void {
    const logger = this.getLogger('http');
    const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';

    logger[level](`${method} ${url}`, {
      method,
      url,
      status,
      duration,
      type: 'http_request',
    });
  }

  public logApiCall(
    service: string,
    operation: string,
    success: boolean,
    duration: number,
    details?: LogContext
  ): void {
    const logger = this.getLogger('api');
    const level = success ? 'info' : 'error';

    logger[level](`API call: ${service}.${operation}`, {
      service,
      operation,
      success,
      duration,
      type: 'api_call',
      ...details,
    });
  }

  public logToolExecution(
    toolName: string,
    success: boolean,
    duration: number,
    details?: LogContext
  ): void {
    const logger = this.getLogger('mcp-tools');
    const level = success ? 'info' : 'error';

    logger[level](`Tool execution: ${toolName}`, {
      tool: toolName,
      success,
      duration,
      type: 'tool_execution',
      ...details,
    });
  }

  public logCommandExecution(
    command: string,
    success: boolean,
    duration: number,
    details?: LogContext
  ): void {
    const logger = this.getLogger('cli');
    const level = success ? 'info' : 'error';

    logger[level](`Command execution: ${command}`, {
      command,
      success,
      duration,
      type: 'command_execution',
      ...details,
    });
  }

  public logAuthentication(
    serverType: string,
    authType: string,
    success: boolean,
    details?: LogContext
  ): void {
    const logger = this.getLogger('auth');
    const level = success ? 'info' : 'warn';

    logger[level](`Authentication attempt: ${authType} on ${serverType}`, {
      serverType,
      authType,
      success,
      type: 'authentication',
      ...details,
    });
  }

  public logRateLimit(
    operation: string,
    remaining: number,
    resetTime: Date,
    details?: LogContext
  ): void {
    const logger = this.getLogger('rate-limit');

    logger.warn(`Rate limit warning: ${operation}`, {
      operation,
      remaining,
      resetTime: resetTime.toISOString(),
      type: 'rate_limit',
      ...details,
    });
  }

  public logError(error: Error, context: LogContext = {}, loggerName: string = 'error'): void {
    const logger = this.getLogger(loggerName);

    logger.error(error.message, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      type: 'error',
      ...context,
    });
  }

  public logPerformance(
    operation: string,
    duration: number,
    threshold: number = 1000,
    details?: LogContext
  ): void {
    const logger = this.getLogger('performance');
    const level = duration > threshold ? 'warn' : 'debug';

    logger[level](`Performance: ${operation}`, {
      operation,
      duration,
      threshold,
      slow: duration > threshold,
      type: 'performance',
      ...details,
    });
  }

  public logServerEvent(event: string, details?: LogContext): void {
    const logger = this.getLogger('server');

    logger.info(`Server event: ${event}`, {
      event,
      type: 'server_event',
      ...details,
    });
  }

  public logConfigChange(
    property: string,
    oldValue: unknown,
    newValue: unknown,
    details?: LogContext
  ): void {
    const logger = this.getLogger('config');

    logger.info(`Configuration changed: ${property}`, {
      property,
      oldValue,
      newValue,
      type: 'config_change',
      ...details,
    });
  }

  public createRequestLogger(requestId: string): Logger {
    return this.getLogger('request', { requestId });
  }

  public createUserLogger(userId: string): Logger {
    return this.getLogger('user', { userId });
  }

  public createRepositoryLogger(repositoryId: string): Logger {
    return this.getLogger('repository', { repositoryId });
  }

  public flush(): Promise<void> {
    return new Promise(resolve => {
      // Winston doesn't have a built-in flush method, but we can end all transports
      const promises: Promise<void>[] = [];

      this.loggers.forEach(logger => {
        if (logger instanceof WinstonLogger) {
          const winstonLogger = (logger as any).logger as winston.Logger;
          winstonLogger.transports.forEach(transport => {
            if (transport.end) {
              promises.push(
                new Promise(resolve => {
                  transport.end(() => resolve());
                })
              );
            }
          });
        }
      });

      Promise.all(promises).then(() => resolve());
    });
  }
}

// Export singleton instance
export const loggerService = LoggerService.getInstance();

// Export default logger
export const logger = loggerService.getLogger();

// Performance measurement decorator
export function measurePerformance(
  target: any,
  propertyName: string,
  descriptor: PropertyDescriptor
): void {
  const method = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const start = Date.now();
    // const logger = loggerService.getLogger('performance');

    try {
      const result = await method.apply(this, args);
      const duration = Date.now() - start;

      loggerService.logPerformance(`${target.constructor.name}.${propertyName}`, duration, 1000, {
        args: args.length,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - start;

      loggerService.logPerformance(`${target.constructor.name}.${propertyName}`, duration, 1000, {
        args: args.length,
        error: true,
      });

      throw error;
    }
  };
}

// Logging utility functions
export const createLogger = (name: string, context?: LogContext): Logger => {
  return loggerService.getLogger(name, context);
};

export const logApiError = (operation: string, error: Error, context?: LogContext): void => {
  const logger = loggerService.getLogger('api-error');
  logger.error(`API Error in ${operation}: ${error.message}`, {
    operation,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    ...context,
  });
};

export const logValidationError = (
  field: string,
  value: unknown,
  constraint: string,
  context?: LogContext
): void => {
  const logger = loggerService.getLogger('validation');
  logger.warn(`Validation failed for field: ${field}`, {
    field,
    value,
    constraint,
    type: 'validation_error',
    ...context,
  });
};
