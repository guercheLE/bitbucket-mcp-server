/**
 * Error Handler Utilities
 * Centralized error handling with sanitization and logging
 */

import { logger } from './logger.js';
import { environment } from '../config/environment.js';

// ============================================================================
// Error Types
// ============================================================================

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode?: number;
  timestamp: string;
  requestId?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface PullRequestError extends ApiError {
  pullRequestId?: number;
  repository?: string;
  project?: string;
}

// ============================================================================
// Error Codes
// ============================================================================

export const ERROR_CODES = {
  // General errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Pull Request specific errors
  PULL_REQUEST_NOT_FOUND: 'PULL_REQUEST_NOT_FOUND',
  PULL_REQUEST_ALREADY_MERGED: 'PULL_REQUEST_ALREADY_MERGED',
  PULL_REQUEST_ALREADY_DECLINED: 'PULL_REQUEST_ALREADY_DECLINED',
  PULL_REQUEST_VERSION_CONFLICT: 'PULL_REQUEST_VERSION_CONFLICT',
  PULL_REQUEST_INVALID_STATE: 'PULL_REQUEST_INVALID_STATE',
  PULL_REQUEST_BRANCH_NOT_FOUND: 'PULL_REQUEST_BRANCH_NOT_FOUND',
  PULL_REQUEST_PERMISSION_DENIED: 'PULL_REQUEST_PERMISSION_DENIED',
  
  // Comment specific errors
  COMMENT_NOT_FOUND: 'COMMENT_NOT_FOUND',
  COMMENT_VERSION_CONFLICT: 'COMMENT_VERSION_CONFLICT',
  COMMENT_PERMISSION_DENIED: 'COMMENT_PERMISSION_DENIED',
  
  // Repository/Project errors
  REPOSITORY_NOT_FOUND: 'REPOSITORY_NOT_FOUND',
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
  REPOSITORY_PERMISSION_DENIED: 'REPOSITORY_PERMISSION_DENIED',
  
  // Network/API errors
  BITBUCKET_API_ERROR: 'BITBUCKET_API_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
} as const;

// ============================================================================
// Error Handler Class
// ============================================================================

export class ErrorHandler {
  private static instance: ErrorHandler;
  
  private constructor() {}
  
  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }
  
  /**
   * Handles and formats errors for API responses
   */
  public handleError(error: Error, context?: Record<string, any>): ApiError {
    const sanitizedContext = environment.sanitizeForLogging(context || {});
    
    // Log the error
    logger.error('Error occurred', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context: sanitizedContext,
      timestamp: new Date().toISOString()
    });
    
    // Determine error type and create appropriate response
    if (error instanceof ValidationError) {
      return this.createValidationError(error, sanitizedContext);
    }
    
    if (error instanceof PullRequestError) {
      return this.createPullRequestError(error, sanitizedContext);
    }
    
    if (error instanceof NetworkError) {
      return this.createNetworkError(error, sanitizedContext);
    }
    
    // Default to internal error
    return this.createInternalError(error, sanitizedContext);
  }
  
  /**
   * Creates a validation error response
   */
  private createValidationError(error: ValidationError, context: Record<string, any>): ApiError {
    return {
      code: ERROR_CODES.VALIDATION_ERROR,
      message: error.message,
      details: {
        field: error.field,
        value: error.value
      },
      statusCode: 400,
      timestamp: new Date().toISOString(),
      requestId: context.requestId
    };
  }
  
  /**
   * Creates a pull request specific error response
   */
  private createPullRequestError(error: PullRequestError, context: Record<string, any>): PullRequestError {
    return {
      name: error.name || 'PullRequestError',
      code: error.code,
      message: error.message,
      details: error.details,
      statusCode: error.statusCode || 400,
      timestamp: new Date().toISOString(),
      requestId: context.requestId,
      pullRequestId: error.pullRequestId,
      repository: error.repository,
      project: error.project
    };
  }
  
  /**
   * Creates a network error response
   */
  private createNetworkError(error: NetworkError, context: Record<string, any>): ApiError {
    return {
      code: ERROR_CODES.NETWORK_ERROR,
      message: 'Network error occurred while communicating with Bitbucket',
      details: {
        originalError: error.message,
        url: error.url,
        method: error.method
      },
      statusCode: 502,
      timestamp: new Date().toISOString(),
      requestId: context.requestId
    };
  }
  
  /**
   * Creates an internal error response
   */
  private createInternalError(error: Error, context: Record<string, any>): ApiError {
    return {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: environment.isDevelopment() ? error.message : 'An internal error occurred',
      details: environment.isDevelopment() ? {
        stack: error.stack,
        name: error.name
      } : undefined,
      statusCode: 500,
      timestamp: new Date().toISOString(),
      requestId: context.requestId
    };
  }
  
  /**
   * Sanitizes error details for logging
   */
  public sanitizeErrorDetails(details: any): any {
    return environment.sanitizeForLogging(details);
  }
}

// ============================================================================
// Custom Error Classes
// ============================================================================

export class ValidationError extends Error {
  public field: string;
  public value?: any;
  
  constructor(field: string, message: string, value?: any) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}

export class PullRequestError extends Error {
  public code: string;
  public details?: any;
  public statusCode?: number;
  public pullRequestId?: number;
  public repository?: string;
  public project?: string;
  
  constructor(
    code: string,
    message: string,
    options?: {
      details?: any;
      statusCode?: number;
      pullRequestId?: number;
      repository?: string;
      project?: string;
    }
  ) {
    super(message);
    this.name = 'PullRequestError';
    this.code = code;
    this.details = options?.details;
    this.statusCode = options?.statusCode;
    this.pullRequestId = options?.pullRequestId;
    this.repository = options?.repository;
    this.project = options?.project;
  }
}

export class NetworkError extends Error {
  public url?: string;
  public method?: string;
  public statusCode?: number;
  
  constructor(message: string, options?: {
    url?: string;
    method?: string;
    statusCode?: number;
  }) {
    super(message);
    this.name = 'NetworkError';
    this.url = options?.url;
    this.method = options?.method;
    this.statusCode = options?.statusCode;
  }
}

// ============================================================================
// Error Factory Functions
// ============================================================================

export function createValidationError(field: string, message: string, value?: any): ValidationError {
  return new ValidationError(field, message, value);
}

export function createPullRequestError(
  code: string,
  message: string,
  options?: {
    details?: any;
    statusCode?: number;
    pullRequestId?: number;
    repository?: string;
    project?: string;
  }
): PullRequestError {
  return new PullRequestError(code, message, options);
}

export function createNetworkError(
  message: string,
  options?: {
    url?: string;
    method?: string;
    statusCode?: number;
  }
): NetworkError {
  return new NetworkError(message, options);
}

// ============================================================================
// Error Response Helpers
// ============================================================================

export function isRetryableError(error: ApiError): boolean {
  const retryableCodes = [
    ERROR_CODES.NETWORK_ERROR,
    ERROR_CODES.TIMEOUT_ERROR,
    ERROR_CODES.RATE_LIMIT_EXCEEDED,
    ERROR_CODES.BITBUCKET_API_ERROR
  ];
  
  return retryableCodes.includes(error.code as any);
}

export function getRetryDelay(error: ApiError, attempt: number): number {
  if (error.code === ERROR_CODES.RATE_LIMIT_EXCEEDED) {
    return Math.min(1000 * Math.pow(2, attempt), 30000); // Exponential backoff, max 30s
  }
  
  return Math.min(1000 * attempt, 5000); // Linear backoff, max 5s
}

// ============================================================================
// Global Error Handler
// ============================================================================

export const errorHandler = ErrorHandler.getInstance();

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  const apiError = errorHandler.handleError(error, { type: 'uncaughtException' });
  logger.error('Uncaught exception', { apiError });
  
  if (!environment.isDevelopment()) {
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  const apiError = errorHandler.handleError(error, { 
    type: 'unhandledRejection',
    promise: promise.toString()
  });
  logger.error('Unhandled promise rejection', { apiError });
});

export default errorHandler;
