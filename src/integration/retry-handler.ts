import { loggerService } from '@/services/logger.service';

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableStatusCodes: number[];
  retryableErrors: string[];
}

export class RetryHandler {
  private logger = loggerService.getLogger('retry-handler');
  private config: RetryConfig;

  constructor(config: RetryConfig) {
    this.config = config;
  }

  public async executeWithRetry<T>(operation: () => Promise<T>, context?: string): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        this.logger.debug('Executing operation', {
          attempt,
          maxAttempts: this.config.maxAttempts,
          context,
        });

        const result = await operation();

        if (attempt > 1) {
          this.logger.info('Operation succeeded after retry', {
            attempt,
            context,
          });
        }

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        this.logger.warn('Operation failed', {
          attempt,
          maxAttempts: this.config.maxAttempts,
          error: lastError.message,
          context,
        });

        // Check if we should retry
        if (!this.shouldRetry(lastError, attempt)) {
          this.logger.error('Operation failed and will not be retried', {
            attempt,
            error: lastError.message,
            context,
          });
          throw lastError;
        }

        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt);

        if (attempt < this.config.maxAttempts) {
          this.logger.info('Retrying operation', {
            attempt,
            nextAttempt: attempt + 1,
            delay,
            context,
          });

          await this.sleep(delay);
        }
      }
    }

    this.logger.error('Operation failed after all retry attempts', {
      maxAttempts: this.config.maxAttempts,
      error: lastError?.message,
      context,
    });

    throw lastError || new Error('Operation failed after all retry attempts');
  }

  private shouldRetry(error: Error, attempt: number): boolean {
    // Don't retry if we've reached max attempts
    if (attempt >= this.config.maxAttempts) {
      return false;
    }

    // Check if error is retryable
    const errorMessage = error.message.toLowerCase();

    // Check retryable error patterns
    for (const retryableError of this.config.retryableErrors) {
      if (errorMessage.includes(retryableError.toLowerCase())) {
        this.logger.debug('Error is retryable', {
          error: error.message,
          retryablePattern: retryableError,
        });
        return true;
      }
    }

    // Check HTTP status codes if available
    const statusMatch = error.message.match(/HTTP (\d+)/);
    if (statusMatch && statusMatch[1]) {
      const statusCode = parseInt(statusMatch[1]);
      if (this.config.retryableStatusCodes.includes(statusCode)) {
        this.logger.debug('HTTP status code is retryable', {
          statusCode,
          error: error.message,
        });
        return true;
      }
    }

    // Check for specific error types
    if (this.isNetworkError(error) || this.isTimeoutError(error)) {
      this.logger.debug('Error type is retryable', {
        error: error.message,
        type: this.getErrorType(error),
      });
      return true;
    }

    this.logger.debug('Error is not retryable', {
      error: error.message,
    });

    return false;
  }

  private isNetworkError(error: Error): boolean {
    const networkErrors = [
      'network error',
      'connection refused',
      'connection reset',
      'connection timeout',
      'econnreset',
      'enotfound',
      'econnrefused',
    ];

    const errorMessage = error.message.toLowerCase();
    return networkErrors.some(networkError => errorMessage.includes(networkError));
  }

  private isTimeoutError(error: Error): boolean {
    const timeoutErrors = ['timeout', 'etimedout', 'request timeout'];

    const errorMessage = error.message.toLowerCase();
    return timeoutErrors.some(timeoutError => errorMessage.includes(timeoutError));
  }

  private getErrorType(error: Error): string {
    if (this.isNetworkError(error)) return 'network';
    if (this.isTimeoutError(error)) return 'timeout';
    return 'unknown';
  }

  private calculateDelay(attempt: number): number {
    // Exponential backoff with jitter
    const exponentialDelay =
      this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
    const delay = Math.min(exponentialDelay + jitter, this.config.maxDelay);

    this.logger.debug('Calculated retry delay', {
      attempt,
      baseDelay: this.config.baseDelay,
      exponentialDelay,
      jitter,
      finalDelay: delay,
    });

    return delay;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public setConfig(newConfig: Partial<RetryConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('Retry handler config updated', {
      maxAttempts: this.config.maxAttempts,
      baseDelay: this.config.baseDelay,
      maxDelay: this.config.maxDelay,
    });
  }

  public getConfig(): RetryConfig {
    return { ...this.config };
  }

  public getStats(): {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
  } {
    return {
      maxAttempts: this.config.maxAttempts,
      baseDelay: this.config.baseDelay,
      maxDelay: this.config.maxDelay,
      backoffMultiplier: this.config.backoffMultiplier,
    };
  }
}
