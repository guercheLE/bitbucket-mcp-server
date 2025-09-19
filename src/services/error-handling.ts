/**
 * Error Handling and Retry Logic Service
 * Comprehensive error handling with retry mechanisms and error classification
 */

import { environment } from '../config/environment';
import { logger } from '../utils/logger';
import { rateLimitAndCircuitBreaker } from './rate-limiter';

// ============================================================================
// Error Types and Interfaces
// ============================================================================

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // Base delay in milliseconds
  maxDelay: number; // Maximum delay in milliseconds
  backoffMultiplier: number; // Exponential backoff multiplier
  jitter: boolean; // Add random jitter to delays
  retryCondition?: (error: Error) => boolean; // Custom retry condition
}

export interface ErrorContext {
  operation: string;
  requestId?: string;
  userId?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ClassifiedError {
  type: 'network' | 'timeout' | 'rate-limit' | 'auth' | 'validation' | 'server' | 'client' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  retryable: boolean;
  error: Error;
  context: ErrorContext;
  retryAfter?: number; // Seconds to wait before retry
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
  lastError?: Error;
}

// ============================================================================
// Error Classification Service
// ============================================================================

export class ErrorClassificationService {
  private static readonly ERROR_PATTERNS = {
    network: [
      'ECONNREFUSED',
      'ENOTFOUND',
      'ECONNRESET',
      'ETIMEDOUT',
      'EHOSTUNREACH',
      'network error',
      'connection refused',
      'connection reset',
      'timeout'
    ],
    timeout: [
      'timeout',
      'ETIMEDOUT',
      'request timeout',
      'operation timeout'
    ],
    rateLimit: [
      'rate limit',
      'too many requests',
      '429',
      'quota exceeded',
      'throttled'
    ],
    auth: [
      'unauthorized',
      '401',
      'forbidden',
      '403',
      'authentication',
      'authorization',
      'invalid token',
      'expired token',
      'access denied'
    ],
    validation: [
      'validation',
      'invalid',
      'bad request',
      '400',
      'malformed',
      'schema',
      'required'
    ],
    server: [
      'internal server error',
      '500',
      '502',
      '503',
      '504',
      'service unavailable',
      'bad gateway',
      'gateway timeout'
    ],
    client: [
      'not found',
      '404',
      'method not allowed',
      '405',
      'conflict',
      '409',
      'unprocessable entity',
      '422'
    ]
  };

  /**
   * Classifies an error based on its message and properties
   */
  static classifyError(error: Error, context: ErrorContext): ClassifiedError {
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();
    const combinedText = `${errorName} ${errorMessage}`;

    // Determine error type
    let type: ClassifiedError['type'] = 'unknown';
    let severity: ClassifiedError['severity'] = 'medium';
    let retryable = false;
    let retryAfter: number | undefined;

    // Check for network errors
    if (this.ERROR_PATTERNS.network.some(pattern => combinedText.includes(pattern))) {
      type = 'network';
      severity = 'high';
      retryable = true;
    }
    // Check for timeout errors
    else if (this.ERROR_PATTERNS.timeout.some(pattern => combinedText.includes(pattern))) {
      type = 'timeout';
      severity = 'medium';
      retryable = true;
    }
    // Check for rate limit errors
    else if (this.ERROR_PATTERNS.rateLimit.some(pattern => combinedText.includes(pattern))) {
      type = 'rate-limit';
      severity = 'medium';
      retryable = true;
      retryAfter = this.extractRetryAfter(error);
    }
    // Check for authentication errors
    else if (this.ERROR_PATTERNS.auth.some(pattern => combinedText.includes(pattern))) {
      type = 'auth';
      severity = 'high';
      retryable = false;
    }
    // Check for validation errors
    else if (this.ERROR_PATTERNS.validation.some(pattern => combinedText.includes(pattern))) {
      type = 'validation';
      severity = 'low';
      retryable = false;
    }
    // Check for server errors
    else if (this.ERROR_PATTERNS.server.some(pattern => combinedText.includes(pattern))) {
      type = 'server';
      severity = 'high';
      retryable = true;
    }
    // Check for client errors
    else if (this.ERROR_PATTERNS.client.some(pattern => combinedText.includes(pattern))) {
      type = 'client';
      severity = 'medium';
      retryable = false;
    }

    // Adjust severity based on context
    if (context.operation.includes('critical') || context.operation.includes('auth')) {
      severity = 'critical';
    }

    return {
      type,
      severity,
      retryable,
      error,
      context,
      retryAfter
    };
  }

  /**
   * Extracts retry-after value from error (for rate limiting)
   */
  private static extractRetryAfter(error: Error): number | undefined {
    // Check if error has retry-after header or property
    if ('response' in error && error.response) {
      const response = (error as any).response;
      if (response.headers && response.headers['retry-after']) {
        return parseInt(response.headers['retry-after'], 10);
      }
    }

    // Check error message for retry-after information
    const retryAfterMatch = error.message.match(/retry[-\s]after[:\s]+(\d+)/i);
    if (retryAfterMatch) {
      return parseInt(retryAfterMatch[1], 10);
    }

    return undefined;
  }

  /**
   * Determines if an error should be retried
   */
  static shouldRetry(error: Error, context: ErrorContext, attempt: number, maxRetries: number): boolean {
    if (attempt >= maxRetries) {
      return false;
    }

    const classified = this.classifyError(error, context);
    
    // Don't retry non-retryable errors
    if (!classified.retryable) {
      return false;
    }

    // Don't retry critical operations after first failure
    if (classified.severity === 'critical' && attempt > 0) {
      return false;
    }

    return true;
  }
}

// ============================================================================
// Retry Service
// ============================================================================

export class RetryService {
  private defaultConfig: RetryConfig;

  constructor(config?: Partial<RetryConfig>) {
    this.defaultConfig = {
      maxRetries: environment.getConfig().performance.maxRetries,
      baseDelay: 1000, // 1 second
      maxDelay: 30000, // 30 seconds
      backoffMultiplier: 2,
      jitter: true,
      ...config
    };
  }

  /**
   * Executes a function with retry logic
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    context: ErrorContext,
    config?: Partial<RetryConfig>
  ): Promise<RetryResult<T>> {
    const retryConfig = { ...this.defaultConfig, ...config };
    const startTime = Date.now();
    let lastError: Error | undefined;
    let attempts = 0;

    while (attempts <= retryConfig.maxRetries) {
      attempts++;

      try {
        const result = await fn();
        const totalTime = Date.now() - startTime;

        logger.info('Operation succeeded', {
          operation: context.operation,
          attempts,
          totalTime,
          requestId: context.requestId
        });

        return {
          success: true,
          result,
          attempts,
          totalTime
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const totalTime = Date.now() - startTime;

        // Check if we should retry
        if (!ErrorClassificationService.shouldRetry(lastError, context, attempts - 1, retryConfig.maxRetries)) {
          logger.error('Operation failed, no more retries', {
            operation: context.operation,
            attempts,
            totalTime,
            error: lastError.message,
            requestId: context.requestId
          });

          return {
            success: false,
            error: lastError,
            attempts,
            totalTime,
            lastError
          };
        }

        // Calculate delay for next retry
        const delay = this.calculateDelay(attempts - 1, retryConfig, lastError);
        
        logger.warn('Operation failed, retrying', {
          operation: context.operation,
          attempt: attempts,
          totalTime,
          delay,
          error: lastError.message,
          requestId: context.requestId
        });

        // Wait before retry
        if (attempts <= retryConfig.maxRetries) {
          await this.sleep(delay);
        }
      }
    }

    const totalTime = Date.now() - startTime;

    logger.error('Operation failed after all retries', {
      operation: context.operation,
      attempts,
      totalTime,
      error: lastError?.message,
      requestId: context.requestId
    });

    return {
      success: false,
      error: lastError,
      attempts,
      totalTime,
      lastError
    };
  }

  /**
   * Calculates delay for next retry attempt
   */
  private calculateDelay(attempt: number, config: RetryConfig, error: Error): number {
    let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
    
    // Apply maximum delay limit
    delay = Math.min(delay, config.maxDelay);

    // Add jitter to prevent thundering herd
    if (config.jitter) {
      const jitterRange = delay * 0.1; // 10% jitter
      delay += (Math.random() - 0.5) * 2 * jitterRange;
    }

    // Check for retry-after header (rate limiting)
    const classified = ErrorClassificationService.classifyError(error, {
      operation: 'retry-delay-calculation',
      timestamp: new Date().toISOString()
    });

    if (classified.retryAfter) {
      delay = Math.max(delay, classified.retryAfter * 1000);
    }

    return Math.max(0, delay);
  }

  /**
   * Sleeps for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Gets default retry configuration
   */
  getDefaultConfig(): RetryConfig {
    return { ...this.defaultConfig };
  }

  /**
   * Updates default retry configuration
   */
  updateDefaultConfig(config: Partial<RetryConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }
}

// ============================================================================
// Error Handler Service
// ============================================================================

export class ErrorHandlerService {
  private retryService: RetryService;

  constructor() {
    this.retryService = new RetryService();
  }

  /**
   * Handles an error with appropriate logging and classification
   */
  handleError(error: Error, context: ErrorContext): ClassifiedError {
    const classified = ErrorClassificationService.classifyError(error, context);

    // Log error based on severity
    switch (classified.severity) {
      case 'critical':
        logger.error('Critical error occurred', {
          type: classified.type,
          operation: context.operation,
          error: error.message,
          stack: error.stack,
          requestId: context.requestId,
          metadata: context.metadata
        });
        break;
      case 'high':
        logger.error('High severity error occurred', {
          type: classified.type,
          operation: context.operation,
          error: error.message,
          requestId: context.requestId,
          metadata: context.metadata
        });
        break;
      case 'medium':
        logger.warn('Medium severity error occurred', {
          type: classified.type,
          operation: context.operation,
          error: error.message,
          requestId: context.requestId,
          metadata: context.metadata
        });
        break;
      case 'low':
        logger.info('Low severity error occurred', {
          type: classified.type,
          operation: context.operation,
          error: error.message,
          requestId: context.requestId,
          metadata: context.metadata
        });
        break;
    }

    return classified;
  }

  /**
   * Executes an operation with error handling and retry logic
   */
  async executeWithErrorHandling<T>(
    fn: () => Promise<T>,
    context: ErrorContext,
    retryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const result = await this.retryService.executeWithRetry(fn, context, retryConfig);

    if (result.success && result.result !== undefined) {
      return result.result;
    }

    // Handle final failure
    const finalError = result.error || new Error('Operation failed after all retries');
    const classified = this.handleError(finalError, context);

    // Create enhanced error with context
    const enhancedError = new Error(
      `${context.operation} failed: ${finalError.message} (${classified.type}, ${classified.severity})`
    );
    enhancedError.name = finalError.name;
    enhancedError.stack = finalError.stack;

    // Add additional properties
    (enhancedError as any).classified = classified;
    (enhancedError as any).context = context;
    (enhancedError as any).attempts = result.attempts;
    (enhancedError as any).totalTime = result.totalTime;

    throw enhancedError;
  }

  /**
   * Creates error context for an operation
   */
  createContext(operation: string, metadata?: Record<string, any>): ErrorContext {
    return {
      operation,
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId(),
      metadata
    };
  }

  /**
   * Generates a unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Gets retry service instance
   */
  getRetryService(): RetryService {
    return this.retryService;
  }
}

// ============================================================================
// Global Error Handlers
// ============================================================================

/**
 * Global uncaught exception handler
 */
process.on('uncaughtException', (error: Error) => {
  const errorHandler = new ErrorHandlerService();
  const context = errorHandler.createContext('uncaught-exception', {
    process: 'main',
    pid: process.pid
  });

  const classified = errorHandler.handleError(error, context);
  
  logger.error('Uncaught exception, process will exit', {
    classified,
    context
  });

  // Exit process for critical errors
  if (classified.severity === 'critical') {
    process.exit(1);
  }
});

/**
 * Global unhandled rejection handler
 */
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  const errorHandler = new ErrorHandlerService();
  const context = errorHandler.createContext('unhandled-rejection', {
    promise: promise.toString(),
    reason: typeof reason === 'object' ? reason.toString() : reason
  });

  const error = reason instanceof Error ? reason : new Error(String(reason));
  const classified = errorHandler.handleError(error, context);
  
  logger.error('Unhandled promise rejection', {
    classified,
    context
  });
});

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const errorHandlerService = new ErrorHandlerService();
export const retryService = new RetryService();
