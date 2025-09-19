/**
 * Data Sanitization Utilities
 * Sanitizes sensitive data for logging and external communication
 */

import { environment } from '../config/environment';

// ============================================================================
// Sensitive Data Patterns
// ============================================================================

const SENSITIVE_PATTERNS = [
  // Authentication tokens
  /token/i,
  /password/i,
  /secret/i,
  /key/i,
  /auth/i,
  /credential/i,
  
  // Personal information
  /email/i,
  /phone/i,
  /ssn/i,
  /social/i,
  
  // API keys and tokens
  /api[_-]?key/i,
  /access[_-]?token/i,
  /refresh[_-]?token/i,
  /bearer/i,
  /jwt/i,
  
  // URLs with credentials
  /https?:\/\/[^:]+:[^@]+@/i,
  
  // Common sensitive fields
  /authorization/i,
  /cookie/i,
  /session/i,
  /csrf/i,
  /x[_-]?csrf[_-]?token/i,
];

const SENSITIVE_VALUES = [
  'password',
  'token',
  'secret',
  'key',
  'auth',
  'credential',
  'email',
  'phone',
  'ssn',
  'social',
  'api_key',
  'access_token',
  'refresh_token',
  'bearer',
  'jwt',
  'authorization',
  'cookie',
  'session',
  'csrf',
  'x_csrf_token',
];

// ============================================================================
// Sanitization Functions
// ============================================================================

/**
 * Sanitizes a string value by replacing sensitive content
 */
export function sanitizeString(value: string): string {
  if (typeof value !== 'string') {
    return value;
  }
  
  // Replace URLs with credentials
  let sanitized = value.replace(/https?:\/\/[^:]+:[^@]+@/gi, 'https://***:***@');
  
  // Replace common token patterns
  sanitized = sanitized.replace(/[A-Za-z0-9]{20,}/g, '***REDACTED***');
  
  return sanitized;
}

/**
 * Sanitizes an object by recursively sanitizing sensitive fields
 */
export function sanitizeObject(obj: any, depth: number = 0): any {
  // Prevent infinite recursion
  if (depth > 10) {
    return '[MAX_DEPTH_REACHED]';
  }
  
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1));
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = sanitizeString(key);
      
      if (isSensitiveField(key)) {
        sanitized[sanitizedKey] = '[REDACTED]';
      } else {
        sanitized[sanitizedKey] = sanitizeObject(value, depth + 1);
      }
    }
    
    return sanitized;
  }
  
  return obj;
}

/**
 * Checks if a field name is considered sensitive
 */
export function isSensitiveField(fieldName: string): boolean {
  const lowerFieldName = fieldName.toLowerCase();
  
  // Check against sensitive values
  if (SENSITIVE_VALUES.includes(lowerFieldName)) {
    return true;
  }
  
  // Check against sensitive patterns
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(fieldName));
}

/**
 * Sanitizes data specifically for logging
 */
export function sanitizeForLogging(data: any): any {
  if (environment.isDevelopment()) {
    // In development, be more permissive but still sanitize obvious secrets
    return sanitizeObject(data);
  }
  
  // In production, be more aggressive
  return sanitizeObject(data);
}

/**
 * Sanitizes data for external API responses
 */
export function sanitizeForResponse(data: any): any {
  // Always sanitize for external responses
  return sanitizeObject(data);
}

/**
 * Sanitizes error objects
 */
export function sanitizeError(error: any): any {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: sanitizeString(error.message),
      stack: environment.isDevelopment() ? error.stack : '[REDACTED]'
    };
  }
  
  return sanitizeObject(error);
}

/**
 * Sanitizes HTTP headers
 */
export function sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(headers)) {
    if (isSensitiveField(key)) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = sanitizeString(String(value));
    }
  }
  
  return sanitized;
}

/**
 * Sanitizes query parameters
 */
export function sanitizeQueryParams(params: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(params)) {
    if (isSensitiveField(key)) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = sanitizeObject(value);
    }
  }
  
  return sanitized;
}

/**
 * Sanitizes request body
 */
export function sanitizeRequestBody(body: any): any {
  return sanitizeObject(body);
}

/**
 * Sanitizes response body
 */
export function sanitizeResponseBody(body: any): any {
  return sanitizeObject(body);
}

// ============================================================================
// Pull Request Specific Sanitization
// ============================================================================

/**
 * Sanitizes pull request data
 */
export function sanitizePullRequest(pr: any): any {
  if (!pr || typeof pr !== 'object') {
    return pr;
  }
  
  const sanitized = { ...pr };
  
  // Sanitize user information
  if (sanitized.author?.user) {
    sanitized.author.user = sanitizeUser(sanitized.author.user);
  }
  
  if (sanitized.reviewers) {
    sanitized.reviewers = sanitized.reviewers.map((reviewer: any) => ({
      ...reviewer,
      user: reviewer.user ? sanitizeUser(reviewer.user) : reviewer.user
    }));
  }
  
  if (sanitized.participants) {
    sanitized.participants = sanitized.participants.map((participant: any) => ({
      ...participant,
      user: participant.user ? sanitizeUser(participant.user) : participant.user
    }));
  }
  
  return sanitized;
}

/**
 * Sanitizes user data
 */
export function sanitizeUser(user: any): any {
  if (!user || typeof user !== 'object') {
    return user;
  }
  
  return {
    ...user,
    emailAddress: '[REDACTED]',
    // Keep display name and other non-sensitive info
  };
}

/**
 * Sanitizes comment data
 */
export function sanitizeComment(comment: any): any {
  if (!comment || typeof comment !== 'object') {
    return comment;
  }
  
  const sanitized = { ...comment };
  
  if (sanitized.author) {
    sanitized.author = sanitizeUser(sanitized.author);
  }
  
  if (sanitized.comments) {
    sanitized.comments = sanitized.comments.map((subComment: any) => sanitizeComment(subComment));
  }
  
  return sanitized;
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validates that data doesn't contain sensitive information
 */
export function validateNoSensitiveData(data: any, path: string = ''): boolean {
  if (data === null || data === undefined) {
    return true;
  }
  
  if (typeof data === 'string') {
    // Check for common sensitive patterns in strings
    const hasCredentials = /https?:\/\/[^:]+:[^@]+@/i.test(data);
    const hasToken = /[A-Za-z0-9]{20,}/.test(data);
    
    if (hasCredentials || hasToken) {
      console.warn(`Potential sensitive data found at path: ${path}`);
      return false;
    }
    
    return true;
  }
  
  if (Array.isArray(data)) {
    return data.every((item, index) => validateNoSensitiveData(item, `${path}[${index}]`));
  }
  
  if (typeof data === 'object') {
    return Object.entries(data).every(([key, value]) => {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (isSensitiveField(key)) {
        console.warn(`Sensitive field found at path: ${currentPath}`);
        return false;
      }
      
      return validateNoSensitiveData(value, currentPath);
    });
  }
  
  return true;
}

export default {
  sanitizeString,
  sanitizeObject,
  sanitizeForLogging,
  sanitizeForResponse,
  sanitizeError,
  sanitizeHeaders,
  sanitizeQueryParams,
  sanitizeRequestBody,
  sanitizeResponseBody,
  sanitizePullRequest,
  sanitizeUser,
  sanitizeComment,
  validateNoSensitiveData,
  isSensitiveField
};
