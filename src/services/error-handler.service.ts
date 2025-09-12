import { AxiosError } from 'axios';
import { ZodError } from 'zod';
import {
  BaseError,
  ApiError,
  ValidationError,
  NetworkError,
  RateLimitError,
  MCPToolError,
  CLIError,
  ErrorCode,
  createError,
  createApiError,
  createValidationError,
  createNetworkError,
  createAuthenticationError,
  createRateLimitError,
  createMCPToolError,
  createCLIError,
  getHttpStatusFromErrorCode,
} from '@/types/errors';
import { loggerService } from './logger.service';

export interface ErrorContext {
  operation?: string;
  userId?: string;
  repositoryId?: string;
  toolName?: string;
  command?: string;
  requestId?: string;
  [key: string]: unknown;
}

export interface ErrorStats {
  total: number;
  byCode: Record<string, number>;
  bySeverity: Record<string, number>;
  lastError?: BaseError;
}

export class ErrorHandlerService {
  private static instance: ErrorHandlerService;
  private logger = loggerService.getLogger('error-handler');
  private errorStats: ErrorStats = {
    total: 0,
    byCode: {},
    bySeverity: {},
  };

  private constructor() {}

  public static getInstance(): ErrorHandlerService {
    if (!ErrorHandlerService.instance) {
      ErrorHandlerService.instance = new ErrorHandlerService();
    }
    return ErrorHandlerService.instance;
  }

  public handleError(error: unknown, context: ErrorContext = {}): BaseError {
    this.logger.debug('Handling error', { error, context });

    if (this.isBaseError(error)) {
      this.logError(error, context);
      return error;
    }

    if (this.isAxiosError(error)) {
      return this.handleAxiosError(error, context);
    }

    if (this.isZodError(error)) {
      return this.handleZodError(error, context);
    }

    if (error instanceof Error) {
      return this.handleGenericError(error, context);
    }

    // Handle unknown error types
    return this.handleUnknownError(error, context);
  }

  public handleAxiosError(error: AxiosError, context: ErrorContext = {}): BaseError {
    const status = error.response?.status || 0;
    const statusText = error.response?.statusText || 'Unknown';
    const responseData = error.response?.data as any;
    const url = error.config?.url || 'unknown';
    const method = error.config?.method?.toUpperCase() || 'UNKNOWN';

    let errorCode: ErrorCode;
    let message: string;

    // Map HTTP status codes to our error codes
    switch (status) {
      case 400:
        errorCode = 'BAD_REQUEST';
        message = responseData?.message || 'Bad request';
        break;
      case 401:
        errorCode = 'AUTHENTICATION_FAILED';
        message = 'Authentication failed';
        break;
      case 403:
        errorCode = 'PERMISSION_DENIED';
        message = 'Permission denied';
        break;
      case 404:
        if (url.includes('/repositories/')) {
          errorCode = 'REPOSITORY_NOT_FOUND';
          message = 'Repository not found';
        } else if (url.includes('/pullrequests/')) {
          errorCode = 'PULL_REQUEST_NOT_FOUND';
          message = 'Pull request not found';
        } else if (url.includes('/issues/')) {
          errorCode = 'ISSUE_NOT_FOUND';
          message = 'Issue not found';
        } else if (url.includes('/projects/')) {
          errorCode = 'PROJECT_NOT_FOUND';
          message = 'Project not found';
        } else {
          errorCode = 'REPOSITORY_NOT_FOUND';
          message = 'Resource not found';
        }
        break;
      case 409:
        errorCode = 'RESOURCE_CONFLICT';
        message = 'Resource conflict';
        break;
      case 429:
        errorCode = 'RATE_LIMIT_EXCEEDED';
        message = 'Rate limit exceeded';
        break;
      case 500:
        errorCode = 'INTERNAL_SERVER_ERROR';
        message = 'Internal server error';
        break;
      case 502:
        errorCode = 'BAD_GATEWAY';
        message = 'Bad gateway';
        break;
      case 503:
        errorCode = 'SERVICE_UNAVAILABLE';
        message = 'Service unavailable';
        break;
      default:
        if (error.code === 'ECONNABORTED' || error.code === 'ECONNRESET') {
          errorCode = 'CONNECTION_TIMEOUT';
          message = 'Connection timeout';
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          errorCode = 'NETWORK_ERROR';
          message = 'Network error';
        } else {
          errorCode = 'SERVER_ERROR';
          message = `HTTP ${status}: ${statusText}`;
        }
    }

    const baseError = createApiError(errorCode, message, status, {
      url,
      method,
      statusText,
      responseData,
      requestData: error.config?.data,
      ...context,
    });

    // Handle rate limiting specifically
    if (status === 429) {
      const resetTime = this.extractRateLimitResetTime(error);
      const remaining = this.extractRateLimitRemaining(error);
      const retryAfter = this.extractRetryAfter(error);

      const rateLimitError = createRateLimitError(
        message,
        undefined,
        remaining,
        resetTime,
        retryAfter
      );

      this.logError(rateLimitError, context);
      return rateLimitError;
    }

    // Handle authentication errors specifically
    if (status === 401 || status === 403) {
      const authError = createAuthenticationError(
        errorCode as any,
        message,
        context['authType'] as string,
        context['serverType'] as 'cloud' | 'datacenter'
      );

      this.logError(authError, context);
      return authError;
    }

    this.logError(baseError, context);
    return baseError;
  }

  public handleZodError(error: ZodError, context: ErrorContext = {}): ValidationError {
    const validationErrors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      value: (err as any).input,
    }));

    const validationError = createValidationError(
      'Validation failed',
      error.errors[0]?.path.join('.'),
      (error.errors[0] as any)?.input,
      validationErrors
    );

    this.logError(validationError, context);
    return validationError;
  }

  public handleGenericError(error: Error, context: ErrorContext = {}): BaseError {
    let errorCode: ErrorCode = 'INTERNAL_SERVER_ERROR';
    let message = error.message;

    // Try to map common error patterns
    if (error.name === 'TypeError') {
      errorCode = 'INVALID_INPUT';
      message = `Type error: ${error.message}`;
    } else if (error.name === 'ReferenceError') {
      errorCode = 'CONFIGURATION_ERROR';
      message = `Reference error: ${error.message}`;
    } else if (error.name === 'SyntaxError') {
      errorCode = 'INVALID_INPUT';
      message = `Syntax error: ${error.message}`;
    }

    const baseError = createError(errorCode, message, {
      name: error.name,
      stack: error.stack,
      ...context,
    });

    this.logError(baseError, context);
    return baseError;
  }

  public handleUnknownError(error: unknown, context: ErrorContext = {}): BaseError {
    const message = typeof error === 'string' ? error : 'Unknown error occurred';
    const baseError = createError('INTERNAL_SERVER_ERROR', message, {
      originalError: error,
      ...context,
    });

    this.logError(baseError, context);
    return baseError;
  }

  public createToolError(
    toolName: string,
    operation: string,
    error: unknown,
    inputParams?: Record<string, unknown>
  ): MCPToolError {
    const baseError = this.handleError(error);

    const toolError = createMCPToolError(
      'MCP_TOOL_ERROR',
      `Tool execution failed: ${baseError.message}`,
      toolName,
      operation,
      inputParams
    );

    this.logError(toolError, { toolName, operation });
    return toolError;
  }

  public createValidationToolError(
    toolName: string,
    operation: string,
    validationError: string,
    inputParams?: Record<string, unknown>
  ): MCPToolError {
    const toolError = createMCPToolError(
      'MCP_VALIDATION_ERROR',
      `Tool validation failed: ${validationError}`,
      toolName,
      operation,
      inputParams
    );

    this.logError(toolError, { toolName, operation });
    return toolError;
  }

  public createCommandError(
    command: string,
    error: unknown,
    argument?: string,
    suggestion?: string
  ): CLIError {
    const baseError = this.handleError(error);

    const commandError = createCLIError(
      'INVALID_COMMAND',
      `Command execution failed: ${baseError.message}`,
      command,
      argument,
      suggestion
    );

    this.logError(commandError, { command, argument });
    return commandError;
  }

  public createNetworkError(operation: string, url: string, timeout?: number): NetworkError {
    const networkError = createNetworkError(
      'NETWORK_ERROR',
      `Network error in ${operation}`,
      url,
      timeout
    );

    this.logError(networkError, { operation, url });
    return networkError;
  }

  public getHttpStatusFromError(error: BaseError): number {
    if (this.isApiError(error)) {
      return error.statusCode;
    }
    return getHttpStatusFromErrorCode(error.code);
  }

  public isRetryableError(error: BaseError): boolean {
    const retryableCodes: ErrorCode[] = [
      'NETWORK_ERROR',
      'CONNECTION_TIMEOUT',
      'REQUEST_TIMEOUT',
      'SERVICE_UNAVAILABLE',
      'BAD_GATEWAY',
      'RATE_LIMIT_EXCEEDED',
    ];

    return retryableCodes.includes(error.code);
  }

  public shouldRetryAfter(error: BaseError): number | null {
    if (this.isRateLimitError(error) && error.retryAfter) {
      return error.retryAfter;
    }

    if (this.isRetryableError(error)) {
      // Default retry after 1 second for retryable errors
      return 1000;
    }

    return null;
  }

  private logError(error: BaseError, context: ErrorContext = {}): void {
    this.updateStats(error);

    const logContext = {
      code: error.code,
      severity: error.severity,
      ...error.details,
      ...context,
    };

    switch (error.severity) {
      case 'CRITICAL':
        this.logger.error(error.message, logContext);
        break;
      case 'HIGH':
        this.logger.error(error.message, logContext);
        break;
      case 'MEDIUM':
        this.logger.warn(error.message, logContext);
        break;
      case 'LOW':
        this.logger.info(error.message, logContext);
        break;
      default:
        this.logger.warn(error.message, logContext);
    }
  }

  private extractRateLimitResetTime(error: AxiosError): Date | undefined {
    const resetHeader =
      error.response?.headers['x-ratelimit-reset'] || error.response?.headers['x-rate-limit-reset'];

    if (resetHeader) {
      const resetTime = parseInt(resetHeader as string, 10);
      return new Date(resetTime * 1000);
    }

    return undefined;
  }

  private extractRateLimitRemaining(error: AxiosError): number | undefined {
    const remainingHeader =
      error.response?.headers['x-ratelimit-remaining'] ||
      error.response?.headers['x-rate-limit-remaining'];

    if (remainingHeader) {
      return parseInt(remainingHeader as string, 10);
    }

    return undefined;
  }

  private extractRetryAfter(error: AxiosError): number | undefined {
    const retryAfterHeader = error.response?.headers['retry-after'];

    if (retryAfterHeader) {
      return parseInt(retryAfterHeader as string, 10) * 1000; // Convert to milliseconds
    }

    return undefined;
  }

  // Type guards
  private isBaseError(error: unknown): error is BaseError {
    return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
  }

  private isApiError(error: BaseError): error is ApiError {
    return 'statusCode' in error;
  }

  private isRateLimitError(error: BaseError): error is RateLimitError {
    return ['RATE_LIMIT_EXCEEDED', 'QUOTA_EXCEEDED'].includes(error.code);
  }

  private isAxiosError(error: unknown): error is AxiosError {
    return typeof error === 'object' && error !== null && 'isAxiosError' in error;
  }

  private isZodError(error: unknown): error is ZodError {
    return error instanceof ZodError;
  }

  // Additional methods required by tests
  public getErrorSeverity(error: BaseError): string {
    return error.severity;
  }

  public formatError(error: BaseError, context: ErrorContext = {}): string {
    const contextStr =
      Object.keys(context).length > 0 ? ` (Context: ${JSON.stringify(context)})` : '';
    return `${error.code}: ${error.message}${contextStr}`;
  }

  public getErrorStats(): ErrorStats {
    return { ...this.errorStats };
  }

  public clearStats(): void {
    this.errorStats = {
      total: 0,
      byCode: {},
      bySeverity: {},
    };
  }

  private updateStats(error: BaseError): void {
    this.errorStats.total++;
    this.errorStats.byCode[error.code] = (this.errorStats.byCode[error.code] || 0) + 1;
    this.errorStats.bySeverity[error.severity] =
      (this.errorStats.bySeverity[error.severity] || 0) + 1;
    this.errorStats.lastError = error;
  }
}

// Export singleton instance
export const errorHandlerService = ErrorHandlerService.getInstance();

// Utility functions
export const handleError = (error: unknown, context?: ErrorContext): BaseError => {
  return errorHandlerService.handleError(error, context);
};

export const createToolError = (
  toolName: string,
  operation: string,
  error: unknown,
  inputParams?: Record<string, unknown>
): MCPToolError => {
  return errorHandlerService.createToolError(toolName, operation, error, inputParams);
};

export const createCommandError = (
  command: string,
  error: unknown,
  argument?: string,
  suggestion?: string
): CLIError => {
  return errorHandlerService.createCommandError(command, error, argument, suggestion);
};

export const isRetryableError = (error: BaseError): boolean => {
  return errorHandlerService.isRetryableError(error);
};

export const getRetryDelay = (error: BaseError): number | null => {
  return errorHandlerService.shouldRetryAfter(error);
};
