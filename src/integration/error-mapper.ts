import { loggerService } from '@/services/logger.service';
import { BitbucketError, ErrorType, ErrorSeverity } from '@/types/errors';

export interface ErrorMapping {
  pattern: RegExp;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  retryable: boolean;
  statusCode?: number;
}

export class ErrorMapper {
  private logger = loggerService.getLogger('error-mapper');
  private mappings: ErrorMapping[] = [];

  constructor() {
    this.initializeDefaultMappings();
  }

  private initializeDefaultMappings(): void {
    // Authentication errors
    this.addMapping({
      pattern: /401|unauthorized|invalid credentials/i,
      type: 'AUTHENTICATION_ERROR',
      severity: 'HIGH',
      message: 'Authentication failed. Please check your credentials.',
      retryable: false,
      statusCode: 401,
    });

    this.addMapping({
      pattern: /403|forbidden|access denied/i,
      type: 'AUTHORIZATION_ERROR',
      severity: 'HIGH',
      message: 'Access denied. You do not have permission to perform this action.',
      retryable: false,
      statusCode: 403,
    });

    // Rate limiting errors
    this.addMapping({
      pattern: /429|rate limit|too many requests/i,
      type: 'RATE_LIMIT_ERROR',
      severity: 'MEDIUM',
      message: 'Rate limit exceeded. Please wait before making more requests.',
      retryable: true,
      statusCode: 429,
    });

    // Network errors
    this.addMapping({
      pattern: /network error|connection refused|econnreset|enotfound/i,
      type: 'NETWORK_ERROR',
      severity: 'MEDIUM',
      message: 'Network connection failed. Please check your internet connection.',
      retryable: true,
    });

    this.addMapping({
      pattern: /timeout|etimedout|request timeout/i,
      type: 'TIMEOUT_ERROR',
      severity: 'MEDIUM',
      message: 'Request timed out. The server may be slow or unavailable.',
      retryable: true,
    });

    // Server errors
    this.addMapping({
      pattern: /500|internal server error/i,
      type: 'SERVER_ERROR',
      severity: 'HIGH',
      message: 'Internal server error. Please try again later.',
      retryable: true,
      statusCode: 500,
    });

    this.addMapping({
      pattern: /502|bad gateway/i,
      type: 'SERVER_ERROR',
      severity: 'HIGH',
      message: 'Bad gateway. The server is temporarily unavailable.',
      retryable: true,
      statusCode: 502,
    });

    this.addMapping({
      pattern: /503|service unavailable/i,
      type: 'SERVER_ERROR',
      severity: 'HIGH',
      message: 'Service unavailable. The server is temporarily down.',
      retryable: true,
      statusCode: 503,
    });

    this.addMapping({
      pattern: /504|gateway timeout/i,
      type: 'SERVER_ERROR',
      severity: 'HIGH',
      message: 'Gateway timeout. The server is taking too long to respond.',
      retryable: true,
      statusCode: 504,
    });

    // Validation errors
    this.addMapping({
      pattern: /400|bad request|validation error/i,
      type: 'VALIDATION_ERROR',
      severity: 'MEDIUM',
      message: 'Invalid request. Please check your input parameters.',
      retryable: false,
      statusCode: 400,
    });

    // Not found errors
    this.addMapping({
      pattern: /404|not found/i,
      type: 'NOT_FOUND_ERROR',
      severity: 'MEDIUM',
      message: 'Resource not found. The requested item may not exist.',
      retryable: false,
      statusCode: 404,
    });

    // Conflict errors
    this.addMapping({
      pattern: /409|conflict/i,
      type: 'CONFLICT_ERROR',
      severity: 'MEDIUM',
      message: 'Resource conflict. The operation cannot be completed due to a conflict.',
      retryable: false,
      statusCode: 409,
    });

    // Bitbucket specific errors
    this.addMapping({
      pattern: /repository.*not found/i,
      type: 'NOT_FOUND_ERROR',
      severity: 'MEDIUM',
      message: 'Repository not found. Please check the repository name and permissions.',
      retryable: false,
    });

    this.addMapping({
      pattern: /project.*not found/i,
      type: 'NOT_FOUND_ERROR',
      severity: 'MEDIUM',
      message: 'Project not found. Please check the project key and permissions.',
      retryable: false,
    });

    this.addMapping({
      pattern: /pull request.*not found/i,
      type: 'NOT_FOUND_ERROR',
      severity: 'MEDIUM',
      message: 'Pull request not found. Please check the pull request ID and repository.',
      retryable: false,
    });

    this.addMapping({
      pattern: /branch.*not found/i,
      type: 'NOT_FOUND_ERROR',
      severity: 'MEDIUM',
      message: 'Branch not found. Please check the branch name and repository.',
      retryable: false,
    });

    this.addMapping({
      pattern: /permission.*denied/i,
      type: 'AUTHORIZATION_ERROR',
      severity: 'HIGH',
      message: 'Permission denied. You do not have the required permissions for this operation.',
      retryable: false,
    });

    this.addMapping({
      pattern: /quota.*exceeded/i,
      type: 'QUOTA_ERROR',
      severity: 'HIGH',
      message: 'Quota exceeded. You have reached your usage limit.',
      retryable: false,
    });

    this.addMapping({
      pattern: /maintenance.*mode/i,
      type: 'MAINTENANCE_ERROR',
      severity: 'HIGH',
      message: 'System is in maintenance mode. Please try again later.',
      retryable: true,
    });
  }

  public addMapping(mapping: ErrorMapping): void {
    this.mappings.push(mapping);
    this.logger.debug('Added error mapping', {
      pattern: mapping.pattern.toString(),
      type: mapping.type,
      severity: mapping.severity,
      retryable: mapping.retryable,
    });
  }

  public removeMapping(pattern: RegExp): void {
    const initialLength = this.mappings.length;
    this.mappings = this.mappings.filter(
      mapping => mapping.pattern.toString() !== pattern.toString()
    );

    if (this.mappings.length < initialLength) {
      this.logger.debug('Removed error mapping', {
        pattern: pattern.toString(),
      });
    }
  }

  public mapError(error: Error | string): BitbucketError {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const originalError = typeof error === 'string' ? new Error(error) : error;

    this.logger.debug('Mapping error', {
      originalMessage: errorMessage,
    });

    // Find matching mapping
    for (const mapping of this.mappings) {
      if (mapping.pattern.test(errorMessage)) {
        this.logger.debug('Found matching error mapping', {
          pattern: mapping.pattern.toString(),
          type: mapping.type,
          severity: mapping.severity,
          retryable: mapping.retryable,
        });

        return {
          type: mapping.type,
          severity: mapping.severity,
          message: mapping.message,
          originalMessage: errorMessage,
          retryable: mapping.retryable,
          statusCode: mapping.statusCode,
          timestamp: new Date().toISOString(),
          context: this.extractContext(originalError),
        };
      }
    }

    // Default mapping for unknown errors
    this.logger.debug('No matching error mapping found, using default', {
      originalMessage: errorMessage,
    });

    return {
      type: 'UNKNOWN_ERROR',
      severity: 'MEDIUM',
      message: 'An unexpected error occurred.',
      originalMessage: errorMessage,
      retryable: false,
      timestamp: new Date().toISOString(),
      context: this.extractContext(originalError),
    };
  }

  private extractContext(error: Error): Record<string, any> {
    const context: Record<string, any> = {};

    // Extract stack trace if available
    if (error.stack) {
      context['stack'] = error.stack;
    }

    // Extract additional properties from error
    if ('code' in error) {
      context['code'] = (error as any).code;
    }

    if ('status' in error) {
      context['status'] = (error as any).status;
    }

    if ('response' in error) {
      context['response'] = (error as any).response;
    }

    // Extract HTTP status code from message if available
    const statusMatch = error.message.match(/HTTP (\d+)/);
    if (statusMatch && statusMatch[1]) {
      context['httpStatusCode'] = parseInt(statusMatch[1]);
    }

    return context;
  }

  public getMappings(): ErrorMapping[] {
    return [...this.mappings];
  }

  public clearMappings(): void {
    this.mappings = [];
    this.logger.info('Cleared all error mappings');
  }

  public getMappingStats(): {
    totalMappings: number;
    retryableMappings: number;
    nonRetryableMappings: number;
    severityCounts: Record<ErrorSeverity, number>;
    typeCounts: Record<string, number>;
  } {
    const severityCounts: Record<ErrorSeverity, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };

    const typeCounts: Record<string, number> = {};

    let retryableMappings = 0;
    let nonRetryableMappings = 0;

    for (const mapping of this.mappings) {
      if (mapping.retryable) {
        retryableMappings++;
      } else {
        nonRetryableMappings++;
      }

      severityCounts[mapping.severity]++;
      typeCounts[mapping.type] = (typeCounts[mapping.type] || 0) + 1;
    }

    return {
      totalMappings: this.mappings.length,
      retryableMappings,
      nonRetryableMappings,
      severityCounts,
      typeCounts,
    };
  }
}
