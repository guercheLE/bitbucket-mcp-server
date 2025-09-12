import { z } from 'zod';

// Error Code enum
export const ErrorCodeSchema = z.enum([
  // Authentication Errors
  'AUTHENTICATION_FAILED',
  'INVALID_CREDENTIALS',
  'TOKEN_EXPIRED',
  'TOKEN_INVALID',
  'PERMISSION_DENIED',
  'UNAUTHORIZED',

  // Resource Errors
  'REPOSITORY_NOT_FOUND',
  'PULL_REQUEST_NOT_FOUND',
  'ISSUE_NOT_FOUND',
  'PROJECT_NOT_FOUND',
  'USER_NOT_FOUND',
  'COMMENT_NOT_FOUND',
  'BRANCH_NOT_FOUND',
  'TAG_NOT_FOUND',
  'COMMIT_NOT_FOUND',

  // Validation Errors
  'INVALID_INPUT',
  'INVALID_REPOSITORY_NAME',
  'INVALID_PROJECT_KEY',
  'INVALID_BRANCH_REFERENCE',
  'INVALID_ISSUE_STATE',
  'INVALID_PRIORITY',
  'INVALID_KIND',
  'INVALID_PERMISSION_LEVEL',
  'VALIDATION_ERROR',

  // Conflict Errors
  'REPOSITORY_ALREADY_EXISTS',
  'PROJECT_KEY_ALREADY_EXISTS',
  'MERGE_CONFLICT',
  'RESOURCE_CONFLICT',

  // Network Errors
  'NETWORK_ERROR',
  'CONNECTION_TIMEOUT',
  'REQUEST_TIMEOUT',
  'SERVICE_UNAVAILABLE',
  'BAD_GATEWAY',

  // Rate Limiting
  'RATE_LIMIT_EXCEEDED',
  'QUOTA_EXCEEDED',

  // Server Errors
  'INTERNAL_SERVER_ERROR',
  'SERVER_ERROR',
  'CONFIGURATION_ERROR',
  'TOOL_NOT_FOUND',
  'OPERATION_NOT_SUPPORTED',

  // Client Errors
  'BAD_REQUEST',
  'INVALID_COMMAND',
  'MISSING_REQUIRED_ARGUMENT',
  'INVALID_ARGUMENT',

  // MCP Specific Errors
  'MCP_TOOL_ERROR',
  'MCP_SERVER_ERROR',
  'MCP_VALIDATION_ERROR',
  'MCP_EXECUTION_ERROR',
]);

export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

// Error Severity enum
export const ErrorSeveritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export type ErrorSeverity = z.infer<typeof ErrorSeveritySchema>;

// Error Type enum
export const ErrorTypeSchema = z.enum([
  'AUTHENTICATION_ERROR',
  'AUTHORIZATION_ERROR',
  'RATE_LIMIT_ERROR',
  'NETWORK_ERROR',
  'TIMEOUT_ERROR',
  'SERVER_ERROR',
  'VALIDATION_ERROR',
  'NOT_FOUND_ERROR',
  'CONFLICT_ERROR',
  'QUOTA_ERROR',
  'MAINTENANCE_ERROR',
  'PROCESSING_ERROR',
  'UNKNOWN_ERROR',
]);
export type ErrorType = z.infer<typeof ErrorTypeSchema>;

// Bitbucket Error Schema
export const BitbucketErrorSchema = z.object({
  type: ErrorTypeSchema,
  severity: ErrorSeveritySchema,
  message: z.string().min(1, 'Error message is required'),
  originalMessage: z.string().optional(),
  retryable: z.boolean().default(false),
  statusCode: z.number().int().min(100).max(599).optional(),
  timestamp: z.string().default(() => new Date().toISOString()),
  context: z.record(z.unknown()).optional(),
});

export type BitbucketError = z.infer<typeof BitbucketErrorSchema>;

// Base Error Schema
export const BaseErrorSchema = z.object({
  code: ErrorCodeSchema,
  message: z.string().min(1, 'Error message is required'),
  details: z.record(z.unknown()).optional(),
  timestamp: z.union([z.string(), z.date()]).default(() => new Date()),
  severity: ErrorSeveritySchema.default('MEDIUM'),
  context: z.record(z.unknown()).optional(),
});

export type BaseError = z.infer<typeof BaseErrorSchema>;

// API Error Schema (for HTTP responses)
export const ApiErrorSchema = BaseErrorSchema.extend({
  statusCode: z.number().int().min(100).max(599),
  path: z.string().optional(),
  method: z.string().optional(),
  requestId: z.string().optional(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

// Validation Error Schema
export const ValidationErrorSchema = BaseErrorSchema.extend({
  code: z.literal('VALIDATION_ERROR'),
  field: z.string().optional(),
  value: z.unknown().optional(),
  constraint: z.string().optional(),
  validationErrors: z
    .array(
      z.object({
        field: z.string(),
        message: z.string(),
        value: z.unknown().optional(),
      })
    )
    .optional(),
});

export type ValidationError = z.infer<typeof ValidationErrorSchema>;

// Network Error Schema
export const NetworkErrorSchema = BaseErrorSchema.extend({
  code: z.enum(['NETWORK_ERROR', 'CONNECTION_TIMEOUT', 'REQUEST_TIMEOUT']),
  url: z.string().url().optional(),
  timeout: z.number().int().positive().optional(),
  retryCount: z.number().int().min(0).default(0),
  maxRetries: z.number().int().min(0).default(3),
});

export type NetworkError = z.infer<typeof NetworkErrorSchema>;

// Authentication Error Schema
export const AuthenticationErrorSchema = BaseErrorSchema.extend({
  code: z.enum(['AUTHENTICATION_FAILED', 'INVALID_CREDENTIALS', 'TOKEN_EXPIRED', 'TOKEN_INVALID']),
  authType: z.string().optional(),
  serverType: z.enum(['cloud', 'datacenter']).optional(),
});

export type AuthenticationError = z.infer<typeof AuthenticationErrorSchema>;

// Rate Limit Error Schema
export const RateLimitErrorSchema = BaseErrorSchema.extend({
  code: z.enum(['RATE_LIMIT_EXCEEDED', 'QUOTA_EXCEEDED']),
  limit: z.number().int().positive().optional(),
  remaining: z.number().int().min(0).optional(),
  resetTime: z.union([z.string(), z.date()]).optional(),
  retryAfter: z.number().int().positive().optional(),
});

export type RateLimitError = z.infer<typeof RateLimitErrorSchema>;

// MCP Tool Error Schema
export const MCPToolErrorSchema = BaseErrorSchema.extend({
  code: z.enum(['MCP_TOOL_ERROR', 'MCP_VALIDATION_ERROR', 'MCP_EXECUTION_ERROR']),
  toolName: z.string().optional(),
  operation: z.string().optional(),
  inputParams: z.record(z.unknown()).optional(),
});

export type MCPToolError = z.infer<typeof MCPToolErrorSchema>;

// CLI Error Schema
export const CLIErrorSchema = BaseErrorSchema.extend({
  code: z.enum(['INVALID_COMMAND', 'MISSING_REQUIRED_ARGUMENT', 'INVALID_ARGUMENT']),
  command: z.string().optional(),
  argument: z.string().optional(),
  suggestion: z.string().optional(),
});

export type CLIError = z.infer<typeof CLIErrorSchema>;

// Error Result Schema (for operations that can fail)
export const ErrorResultSchema = z.object({
  success: z.literal(false),
  error: BaseErrorSchema,
  data: z.null().optional(),
});

export type ErrorResult = z.infer<typeof ErrorResultSchema>;

// Success Result Schema
export const SuccessResultSchema = z.object({
  success: z.literal(true),
  data: z.unknown(),
  error: z.null().optional(),
});

export type SuccessResult = z.infer<typeof SuccessResultSchema>;

// Operation Result Schema (union of success and error)
export const OperationResultSchema = z.union([SuccessResultSchema, ErrorResultSchema]);
export type OperationResult = z.infer<typeof OperationResultSchema>;

// Error Factory functions
export const createError = (
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): BaseError => {
  return BaseErrorSchema.parse({
    code,
    message,
    details,
    timestamp: new Date(),
  });
};

export const createApiError = (
  code: ErrorCode,
  message: string,
  statusCode: number,
  details?: Record<string, unknown>
): ApiError => {
  return ApiErrorSchema.parse({
    code,
    message,
    statusCode,
    details,
    timestamp: new Date(),
  });
};

export const createValidationError = (
  message: string,
  field?: string,
  value?: unknown,
  validationErrors?: Array<{ field: string; message: string; value?: unknown }>
): ValidationError => {
  return ValidationErrorSchema.parse({
    code: 'VALIDATION_ERROR',
    message,
    field,
    value,
    validationErrors,
    timestamp: new Date(),
  });
};

export const createNetworkError = (
  code: 'NETWORK_ERROR' | 'CONNECTION_TIMEOUT' | 'REQUEST_TIMEOUT',
  message: string,
  url?: string,
  timeout?: number
): NetworkError => {
  return NetworkErrorSchema.parse({
    code,
    message,
    url,
    timeout,
    timestamp: new Date(),
  });
};

export const createAuthenticationError = (
  code: 'AUTHENTICATION_FAILED' | 'INVALID_CREDENTIALS' | 'TOKEN_EXPIRED' | 'TOKEN_INVALID',
  message: string,
  authType?: string,
  serverType?: 'cloud' | 'datacenter'
): AuthenticationError => {
  return AuthenticationErrorSchema.parse({
    code,
    message,
    authType,
    serverType,
    timestamp: new Date(),
  });
};

export const createRateLimitError = (
  message: string,
  limit?: number,
  remaining?: number,
  resetTime?: Date,
  retryAfter?: number
): RateLimitError => {
  return RateLimitErrorSchema.parse({
    code: 'RATE_LIMIT_EXCEEDED',
    message,
    limit,
    remaining,
    resetTime,
    retryAfter,
    timestamp: new Date(),
  });
};

export const createMCPToolError = (
  code: 'MCP_TOOL_ERROR' | 'MCP_VALIDATION_ERROR' | 'MCP_EXECUTION_ERROR',
  message: string,
  toolName?: string,
  operation?: string,
  inputParams?: Record<string, unknown>
): MCPToolError => {
  return MCPToolErrorSchema.parse({
    code,
    message,
    toolName,
    operation,
    inputParams,
    timestamp: new Date(),
  });
};

// Alias for backward compatibility
export const createToolError = createMCPToolError;

export const createCLIError = (
  code: 'INVALID_COMMAND' | 'MISSING_REQUIRED_ARGUMENT' | 'INVALID_ARGUMENT',
  message: string,
  command?: string,
  argument?: string,
  suggestion?: string
): CLIError => {
  return CLIErrorSchema.parse({
    code,
    message,
    command,
    argument,
    suggestion,
    timestamp: new Date(),
  });
};

// Result factory functions
export const createSuccessResult = <T>(data: T): SuccessResult => {
  return {
    success: true,
    data,
  };
};

export const createErrorResult = (error: BaseError): ErrorResult => {
  return {
    success: false,
    error,
  };
};

// Validation helpers
export const validateError = (error: unknown): BaseError => {
  return BaseErrorSchema.parse(error);
};

export const validateApiError = (error: unknown): ApiError => {
  return ApiErrorSchema.parse(error);
};

export const validateOperationResult = (result: unknown): OperationResult => {
  return OperationResultSchema.parse(result);
};

// Error type guards
export const isError = (result: OperationResult): result is ErrorResult => {
  return !result.success;
};

export const isSuccess = (result: OperationResult): result is SuccessResult => {
  return result.success;
};

export const isValidationError = (error: BaseError): error is ValidationError => {
  return error.code === 'VALIDATION_ERROR';
};

export const isNetworkError = (error: BaseError): error is NetworkError => {
  return ['NETWORK_ERROR', 'CONNECTION_TIMEOUT', 'REQUEST_TIMEOUT'].includes(error.code);
};

export const isAuthenticationError = (error: BaseError): error is AuthenticationError => {
  return [
    'AUTHENTICATION_FAILED',
    'INVALID_CREDENTIALS',
    'TOKEN_EXPIRED',
    'TOKEN_INVALID',
  ].includes(error.code);
};

export const isRateLimitError = (error: BaseError): error is RateLimitError => {
  return ['RATE_LIMIT_EXCEEDED', 'QUOTA_EXCEEDED'].includes(error.code);
};

// HTTP Status Code mapping
export const getHttpStatusFromErrorCode = (code: ErrorCode): number => {
  const statusMap: Record<ErrorCode, number> = {
    // 400 Bad Request
    INVALID_INPUT: 400,
    INVALID_REPOSITORY_NAME: 400,
    INVALID_PROJECT_KEY: 400,
    INVALID_BRANCH_REFERENCE: 400,
    INVALID_ISSUE_STATE: 400,
    INVALID_PRIORITY: 400,
    INVALID_KIND: 400,
    VALIDATION_ERROR: 400,
    BAD_REQUEST: 400,
    INVALID_COMMAND: 400,
    MISSING_REQUIRED_ARGUMENT: 400,
    INVALID_ARGUMENT: 400,

    // 401 Unauthorized
    AUTHENTICATION_FAILED: 401,
    INVALID_CREDENTIALS: 401,
    TOKEN_EXPIRED: 401,
    TOKEN_INVALID: 401,
    UNAUTHORIZED: 401,

    // 403 Forbidden
    PERMISSION_DENIED: 403,
    INVALID_PERMISSION_LEVEL: 403,

    // 404 Not Found
    REPOSITORY_NOT_FOUND: 404,
    PULL_REQUEST_NOT_FOUND: 404,
    ISSUE_NOT_FOUND: 404,
    PROJECT_NOT_FOUND: 404,
    USER_NOT_FOUND: 404,
    COMMENT_NOT_FOUND: 404,
    BRANCH_NOT_FOUND: 404,
    TAG_NOT_FOUND: 404,
    COMMIT_NOT_FOUND: 404,
    TOOL_NOT_FOUND: 404,

    // 409 Conflict
    REPOSITORY_ALREADY_EXISTS: 409,
    PROJECT_KEY_ALREADY_EXISTS: 409,
    MERGE_CONFLICT: 409,
    RESOURCE_CONFLICT: 409,

    // 408 Request Timeout
    CONNECTION_TIMEOUT: 408,
    REQUEST_TIMEOUT: 408,

    // 429 Too Many Requests
    RATE_LIMIT_EXCEEDED: 429,
    QUOTA_EXCEEDED: 429,

    // 500 Internal Server Error
    INTERNAL_SERVER_ERROR: 500,
    SERVER_ERROR: 500,
    CONFIGURATION_ERROR: 500,
    MCP_SERVER_ERROR: 500,
    MCP_TOOL_ERROR: 500,
    MCP_VALIDATION_ERROR: 500,
    MCP_EXECUTION_ERROR: 500,

    // 502 Bad Gateway
    BAD_GATEWAY: 502,

    // 503 Service Unavailable
    SERVICE_UNAVAILABLE: 503,
    OPERATION_NOT_SUPPORTED: 503,

    // 0 Network Error (for client-side errors)
    NETWORK_ERROR: 0,
  };

  return statusMap[code] || 500;
};
