# Authentication Error Handling Guide

This document provides comprehensive guidance on handling authentication and authorization errors in the Bitbucket MCP Server.

## Table of Contents

1. [Overview](#overview)
2. [Error Types and Codes](#error-types-and-codes)
3. [Error Handling Patterns](#error-handling-patterns)
4. [Client-Side Error Handling](#client-side-error-handling)
5. [Server-Side Error Handling](#server-side-error-handling)
6. [Recovery Strategies](#recovery-strategies)
7. [Monitoring and Logging](#monitoring-and-logging)
8. [Best Practices](#best-practices)

## Overview

The Bitbucket MCP Server implements a comprehensive error handling system for authentication and authorization scenarios. This system provides:

- **Specific error types** for different authentication failures
- **Detailed error codes** for programmatic error handling
- **Recovery strategies** for common error scenarios
- **User-friendly error messages** for end users
- **Comprehensive logging** for debugging and monitoring

### Error Categories

1. **Authentication Errors**: Issues with user identity verification
2. **Authorization Errors**: Issues with user permissions and access control
3. **Session Errors**: Issues with user session management
4. **Token Errors**: Issues with OAuth token management
5. **Network Errors**: Issues with connectivity to Bitbucket
6. **Configuration Errors**: Issues with server configuration

## Error Types and Codes

### Authentication Error Codes

```typescript
enum AuthenticationErrorCode {
  // Credential Errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  CREDENTIALS_EXPIRED = 'CREDENTIALS_EXPIRED',
  CREDENTIALS_REVOKED = 'CREDENTIALS_REVOKED',
  
  // Session Errors
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_INVALID = 'SESSION_INVALID',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  
  // Token Errors
  TOKEN_INVALID = 'TOKEN_INVALID',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_REVOKED = 'TOKEN_REVOKED',
  REFRESH_TOKEN_INVALID = 'REFRESH_TOKEN_INVALID',
  REFRESH_TOKEN_EXPIRED = 'REFRESH_TOKEN_EXPIRED',
  
  // User Errors
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_DISABLED = 'USER_DISABLED',
  USER_LOCKED = 'USER_LOCKED',
  
  // Application Errors
  APPLICATION_NOT_FOUND = 'APPLICATION_NOT_FOUND',
  APPLICATION_DISABLED = 'APPLICATION_DISABLED',
  APPLICATION_SUSPENDED = 'APPLICATION_SUSPENDED',
  
  // Network Errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  
  // Server Errors
  SERVER_ERROR = 'SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Unknown Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}
```

### Authorization Error Codes

```typescript
enum AuthorizationErrorCode {
  // Permission Errors
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  RESOURCE_ACCESS_DENIED = 'RESOURCE_ACCESS_DENIED',
  
  // Scope Errors
  INVALID_SCOPE = 'INVALID_SCOPE',
  SCOPE_NOT_GRANTED = 'SCOPE_NOT_GRANTED',
  SCOPE_EXPIRED = 'SCOPE_EXPIRED',
  
  // Resource Errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_LOCKED = 'RESOURCE_LOCKED',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  
  // Operation Errors
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  OPERATION_FORBIDDEN = 'OPERATION_FORBIDDEN',
  OPERATION_TIMEOUT = 'OPERATION_TIMEOUT'
}
```

## Error Handling Patterns

### 1. Authentication Error Handling

```typescript
import { AuthenticationError, AuthenticationErrorCode } from './types/auth';

class AuthenticationErrorHandler {
  handleAuthenticationError(error: AuthenticationError): ErrorResponse {
    switch (error.code) {
      case AuthenticationErrorCode.INVALID_CREDENTIALS:
        return {
          code: 'AUTH_INVALID_CREDENTIALS',
          message: 'Invalid username or password',
          userMessage: 'Please check your credentials and try again',
          recoverable: true,
          action: 'retry_authentication'
        };
        
      case AuthenticationErrorCode.SESSION_EXPIRED:
        return {
          code: 'AUTH_SESSION_EXPIRED',
          message: 'User session has expired',
          userMessage: 'Your session has expired. Please log in again.',
          recoverable: true,
          action: 'redirect_to_login'
        };
        
      case AuthenticationErrorCode.TOKEN_EXPIRED:
        return {
          code: 'AUTH_TOKEN_EXPIRED',
          message: 'Access token has expired',
          userMessage: 'Your access token has expired. Please log in again.',
          recoverable: true,
          action: 'refresh_token'
        };
        
      case AuthenticationErrorCode.USER_NOT_FOUND:
        return {
          code: 'AUTH_USER_NOT_FOUND',
          message: 'User not found in system',
          userMessage: 'User account not found. Please contact your administrator.',
          recoverable: false,
          action: 'contact_admin'
        };
        
      case AuthenticationErrorCode.RATE_LIMIT_EXCEEDED:
        return {
          code: 'AUTH_RATE_LIMIT_EXCEEDED',
          message: 'Too many authentication attempts',
          userMessage: 'Too many login attempts. Please wait before trying again.',
          recoverable: true,
          action: 'wait_and_retry',
          retryAfter: 300 // 5 minutes
        };
        
      default:
        return {
          code: 'AUTH_UNKNOWN_ERROR',
          message: 'Unknown authentication error',
          userMessage: 'An unexpected error occurred. Please try again.',
          recoverable: true,
          action: 'retry'
        };
    }
  }
}
```

### 2. Authorization Error Handling

```typescript
import { AuthorizationError, AuthorizationErrorCode } from './types/auth';

class AuthorizationErrorHandler {
  handleAuthorizationError(error: AuthorizationError): ErrorResponse {
    switch (error.code) {
      case AuthorizationErrorCode.INSUFFICIENT_PERMISSIONS:
        return {
          code: 'AUTHZ_INSUFFICIENT_PERMISSIONS',
          message: 'User lacks required permissions',
          userMessage: 'You do not have permission to perform this action.',
          recoverable: false,
          action: 'request_permissions',
          requiredPermissions: error.requiredPermissions,
          userPermissions: error.userPermissions
        };
        
      case AuthorizationErrorCode.RESOURCE_ACCESS_DENIED:
        return {
          code: 'AUTHZ_RESOURCE_ACCESS_DENIED',
          message: 'Access denied to resource',
          userMessage: 'You do not have access to this resource.',
          recoverable: false,
          action: 'request_access',
          resourceId: error.resourceId,
          resourceType: error.resourceType
        };
        
      case AuthorizationErrorCode.OPERATION_NOT_ALLOWED:
        return {
          code: 'AUTHZ_OPERATION_NOT_ALLOWED',
          message: 'Operation not allowed for user',
          userMessage: 'This operation is not allowed for your account.',
          recoverable: false,
          action: 'contact_admin',
          operation: error.operation
        };
        
      default:
        return {
          code: 'AUTHZ_UNKNOWN_ERROR',
          message: 'Unknown authorization error',
          userMessage: 'An unexpected error occurred. Please try again.',
          recoverable: true,
          action: 'retry'
        };
    }
  }
}
```

### 3. Comprehensive Error Handler

```typescript
class ComprehensiveErrorHandler {
  private authErrorHandler = new AuthenticationErrorHandler();
  private authzErrorHandler = new AuthorizationErrorHandler();
  
  handleError(error: Error): ErrorResponse {
    if (error instanceof AuthenticationError) {
      return this.authErrorHandler.handleAuthenticationError(error);
    }
    
    if (error instanceof AuthorizationError) {
      return this.authzErrorHandler.handleAuthorizationError(error);
    }
    
    // Handle other error types
    if (error.message.includes('network') || error.message.includes('timeout')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network connectivity issue',
        userMessage: 'Unable to connect to the server. Please check your internet connection.',
        recoverable: true,
        action: 'retry'
      };
    }
    
    if (error.message.includes('not found')) {
      return {
        code: 'RESOURCE_NOT_FOUND',
        message: 'Resource not found',
        userMessage: 'The requested resource was not found.',
        recoverable: false,
        action: 'check_resource_id'
      };
    }
    
    // Default error handling
    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
      userMessage: 'An unexpected error occurred. Please try again.',
      recoverable: true,
      action: 'retry'
    };
  }
}
```

## Client-Side Error Handling

### 1. MCP Client Error Handling

```typescript
class MCPClientErrorHandler {
  async handleToolExecutionError(
    toolName: string,
    error: Error,
    userSession?: UserSession
  ): Promise<void> {
    const errorResponse = this.comprehensiveErrorHandler.handleError(error);
    
    // Log error for debugging
    console.error(`Tool execution error for ${toolName}:`, error);
    
    // Handle based on error type
    switch (errorResponse.action) {
      case 'redirect_to_login':
        await this.redirectToLogin();
        break;
        
      case 'refresh_token':
        await this.refreshUserToken(userSession);
        break;
        
      case 'retry_authentication':
        await this.retryAuthentication();
        break;
        
      case 'request_permissions':
        await this.requestPermissions(errorResponse.requiredPermissions);
        break;
        
      case 'wait_and_retry':
        await this.waitAndRetry(errorResponse.retryAfter);
        break;
        
      case 'contact_admin':
        await this.showContactAdminMessage();
        break;
        
      default:
        await this.showGenericErrorMessage(errorResponse.userMessage);
    }
  }
  
  private async redirectToLogin(): Promise<void> {
    // Redirect user to login page
    window.location.href = '/auth/login';
  }
  
  private async refreshUserToken(userSession: UserSession): Promise<void> {
    try {
      const newSession = await this.sessionManager.refreshSession(userSession.id);
      // Update user session in client
      this.updateUserSession(newSession);
    } catch (error) {
      // If refresh fails, redirect to login
      await this.redirectToLogin();
    }
  }
  
  private async retryAuthentication(): Promise<void> {
    // Show retry option to user
    const retry = confirm('Authentication failed. Would you like to try again?');
    if (retry) {
      await this.redirectToLogin();
    }
  }
  
  private async requestPermissions(requiredPermissions: string[]): Promise<void> {
    // Show permission request dialog
    const message = `This operation requires the following permissions:\n${requiredPermissions.join('\n')}\n\nPlease contact your administrator to request these permissions.`;
    alert(message);
  }
  
  private async waitAndRetry(retryAfter: number): Promise<void> {
    // Show countdown and retry option
    const message = `Too many requests. Please wait ${retryAfter} seconds before trying again.`;
    alert(message);
    
    // Disable UI for retry period
    this.disableUI(retryAfter);
  }
  
  private async showContactAdminMessage(): Promise<void> {
    const message = 'This operation requires administrator privileges. Please contact your system administrator.';
    alert(message);
  }
  
  private async showGenericErrorMessage(message: string): Promise<void> {
    // Show user-friendly error message
    this.showNotification(message, 'error');
  }
}
```

### 2. React Component Error Handling

```typescript
import React, { useState, useEffect } from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onError?: (error: Error) => void;
}

const AuthenticationErrorBoundary: React.FC<ErrorBoundaryProps> = ({
  children,
  onError
}) => {
  const [error, setError] = useState<Error | null>(null);
  const [errorInfo, setErrorInfo] = useState<any>(null);
  
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const error = new Error(event.message);
      setError(error);
      setErrorInfo({
        componentStack: event.filename,
        errorBoundary: 'AuthenticationErrorBoundary'
      });
      
      if (onError) {
        onError(error);
      }
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [onError]);
  
  if (error) {
    return (
      <div className="error-boundary">
        <h2>Authentication Error</h2>
        <p>An authentication error occurred. Please try refreshing the page.</p>
        <button onClick={() => window.location.reload()}>
          Refresh Page
        </button>
        <details>
          <summary>Error Details</summary>
          <pre>{error.message}</pre>
          <pre>{JSON.stringify(errorInfo, null, 2)}</pre>
        </details>
      </div>
    );
  }
  
  return <>{children}</>;
};

// Usage in component
const MyComponent: React.FC = () => {
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleToolExecution = async (toolName: string, params: any) => {
    try {
      const result = await mcpClient.executeTool(toolName, params, userSession);
      setError(null);
      return result;
    } catch (error) {
      const errorResponse = errorHandler.handleError(error);
      setError(errorResponse.userMessage);
      
      // Handle specific error actions
      if (errorResponse.action === 'redirect_to_login') {
        window.location.href = '/auth/login';
      }
      
      throw error;
    }
  };
  
  return (
    <AuthenticationErrorBoundary onError={setError}>
      <div>
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        {/* Component content */}
      </div>
    </AuthenticationErrorBoundary>
  );
};
```

## Server-Side Error Handling

### 1. Express Middleware Error Handling

```typescript
import express from 'express';
import { AuthenticationError, AuthorizationError } from './types/auth';

const app = express();

// Authentication middleware
app.use('/api', async (req, res, next) => {
  try {
    const userSession = await authenticateRequest(req);
    req.userSession = userSession;
    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      res.status(401).json({
        error: 'Authentication failed',
        code: error.code,
        message: error.message,
        recoverable: error.isRecoverable
      });
    } else {
      next(error);
    }
  }
});

// Authorization middleware
app.use('/api/admin', async (req, res, next) => {
  try {
    if (!req.userSession) {
      throw new AuthenticationError('Authentication required');
    }
    
    if (!req.userSession.permissions.includes('ADMIN_WRITE')) {
      throw new AuthorizationError('Admin permissions required');
    }
    
    next();
  } catch (error) {
    if (error instanceof AuthorizationError) {
      res.status(403).json({
        error: 'Authorization failed',
        code: error.code,
        message: error.message,
        requiredPermissions: error.requiredPermissions
      });
    } else {
      next(error);
    }
  }
});

// Global error handler
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  
  if (error instanceof AuthenticationError) {
    res.status(401).json({
      error: 'Authentication error',
      code: error.code,
      message: error.message,
      recoverable: error.isRecoverable
    });
  } else if (error instanceof AuthorizationError) {
    res.status(403).json({
      error: 'Authorization error',
      code: error.code,
      message: error.message,
      requiredPermissions: error.requiredPermissions
    });
  } else {
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});
```

### 2. MCP Server Error Handling

```typescript
import { MCPErrorHandler } from './mcp-error-handler';

class AuthenticatedMCPServer {
  private errorHandler = new MCPErrorHandler();
  
  async handleToolRequest(
    toolName: string,
    params: any,
    userSession?: UserSession
  ): Promise<ToolExecutionResult> {
    try {
      // Validate authentication if required
      if (this.requiresAuthentication(toolName)) {
        if (!userSession) {
          throw new AuthenticationError(
            'Authentication required',
            AuthenticationErrorCode.SESSION_NOT_FOUND
          );
        }
        
        if (!userSession.isActive()) {
          throw new AuthenticationError(
            'Session expired',
            AuthenticationErrorCode.SESSION_EXPIRED
          );
        }
      }
      
      // Execute tool
      const result = await this.executeTool(toolName, params, userSession);
      return result;
      
    } catch (error) {
      // Handle authentication errors
      if (error instanceof AuthenticationError) {
        return this.errorHandler.handleAuthenticationError(
          error,
          { toolName, params, userSession }
        );
      }
      
      // Handle authorization errors
      if (error instanceof AuthorizationError) {
        return this.errorHandler.handleAuthorizationError(
          error,
          { toolName, params, userSession }
        );
      }
      
      // Handle other errors
      return this.errorHandler.handleGenericError(
        error,
        { toolName, params, userSession }
      );
    }
  }
}
```

## Recovery Strategies

### 1. Token Refresh Strategy

```typescript
class TokenRefreshStrategy {
  async refreshTokenIfNeeded(userSession: UserSession): Promise<UserSession> {
    try {
      // Check if token is close to expiry (5 minutes)
      const timeUntilExpiry = userSession.expiresAt.getTime() - Date.now();
      
      if (timeUntilExpiry < 300000) { // 5 minutes
        console.log('Token close to expiry, refreshing...');
        
        const newSession = await this.sessionManager.refreshSession(userSession.id);
        console.log('Token refreshed successfully');
        
        return newSession;
      }
      
      return userSession;
      
    } catch (error) {
      console.error('Token refresh failed:', error);
      
      // If refresh fails, the session is invalid
      throw new AuthenticationError(
        'Token refresh failed',
        AuthenticationErrorCode.REFRESH_TOKEN_INVALID
      );
    }
  }
}
```

### 2. Retry Strategy

```typescript
class RetryStrategy {
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    backoffMs: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry certain errors
        if (error instanceof AuthenticationError && !error.isRecoverable) {
          throw error;
        }
        
        if (error instanceof AuthorizationError) {
          throw error;
        }
        
        // Wait before retry
        if (attempt < maxRetries) {
          const delay = backoffMs * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError!;
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 3. Circuit Breaker Pattern

```typescript
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  private readonly failureThreshold = 5;
  private readonly timeout = 60000; // 1 minute
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
}
```

## Monitoring and Logging

### 1. Error Logging

```typescript
class AuthenticationLogger {
  logAuthenticationError(error: AuthenticationError, context: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      category: 'AUTHENTICATION',
      error: {
        code: error.code,
        message: error.message,
        recoverable: error.isRecoverable
      },
      context: {
        userId: context.userId,
        sessionId: context.sessionId,
        operation: context.operation,
        userAgent: context.userAgent,
        ipAddress: context.ipAddress
      }
    };
    
    console.error('Authentication Error:', JSON.stringify(logEntry, null, 2));
    
    // Send to monitoring service
    this.sendToMonitoring(logEntry);
  }
  
  logAuthorizationError(error: AuthorizationError, context: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      category: 'AUTHORIZATION',
      error: {
        code: error.code,
        message: error.message,
        requiredPermissions: error.requiredPermissions,
        userPermissions: error.userPermissions
      },
      context: {
        userId: context.userId,
        sessionId: context.sessionId,
        operation: context.operation,
        resourceId: context.resourceId,
        resourceType: context.resourceType
      }
    };
    
    console.warn('Authorization Error:', JSON.stringify(logEntry, null, 2));
    
    // Send to monitoring service
    this.sendToMonitoring(logEntry);
  }
  
  private sendToMonitoring(logEntry: any): void {
    // Send to monitoring service (e.g., DataDog, New Relic, etc.)
    // Implementation depends on your monitoring setup
  }
}
```

### 2. Error Metrics

```typescript
class AuthenticationMetrics {
  private metrics = new Map<string, number>();
  
  incrementErrorCount(errorCode: string): void {
    const key = `auth_error_${errorCode}`;
    const current = this.metrics.get(key) || 0;
    this.metrics.set(key, current + 1);
  }
  
  incrementSuccessCount(): void {
    const key = 'auth_success';
    const current = this.metrics.get(key) || 0;
    this.metrics.set(key, current + 1);
  }
  
  getErrorRate(): number {
    const totalErrors = Array.from(this.metrics.entries())
      .filter(([key]) => key.startsWith('auth_error_'))
      .reduce((sum, [, count]) => sum + count, 0);
    
    const totalSuccess = this.metrics.get('auth_success') || 0;
    const total = totalErrors + totalSuccess;
    
    return total > 0 ? totalErrors / total : 0;
  }
  
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }
}
```

## Best Practices

### 1. Error Message Guidelines

```typescript
class ErrorMessageGuidelines {
  // Good error messages
  static readonly GOOD_MESSAGES = {
    INVALID_CREDENTIALS: 'Invalid username or password. Please check your credentials and try again.',
    SESSION_EXPIRED: 'Your session has expired. Please log in again.',
    INSUFFICIENT_PERMISSIONS: 'You do not have permission to perform this action. Please contact your administrator.',
    RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait a moment before trying again.'
  };
  
  // Bad error messages (avoid these)
  static readonly BAD_MESSAGES = {
    INVALID_CREDENTIALS: 'Error 401',
    SESSION_EXPIRED: 'Session invalid',
    INSUFFICIENT_PERMISSIONS: 'Access denied',
    RATE_LIMIT_EXCEEDED: 'Rate limit exceeded'
  };
}
```

### 2. Error Handling Checklist

```typescript
class ErrorHandlingChecklist {
  static validateErrorHandling(implementation: any): boolean {
    const checks = [
      // Authentication errors are handled
      implementation.handlesAuthenticationErrors,
      
      // Authorization errors are handled
      implementation.handlesAuthorizationErrors,
      
      // Network errors are handled
      implementation.handlesNetworkErrors,
      
      // Rate limiting is handled
      implementation.handlesRateLimiting,
      
      // User-friendly messages are provided
      implementation.providesUserFriendlyMessages,
      
      // Recovery strategies are implemented
      implementation.implementsRecoveryStrategies,
      
      // Logging is comprehensive
      implementation.logsErrorsComprehensively,
      
      // Metrics are collected
      implementation.collectsErrorMetrics
    ];
    
    return checks.every(check => check === true);
  }
}
```

### 3. Testing Error Scenarios

```typescript
describe('Authentication Error Handling', () => {
  it('should handle invalid credentials', async () => {
    const error = new AuthenticationError(
      'Invalid credentials',
      AuthenticationErrorCode.INVALID_CREDENTIALS
    );
    
    const response = await errorHandler.handleError(error);
    
    expect(response.code).toBe('AUTH_INVALID_CREDENTIALS');
    expect(response.recoverable).toBe(true);
    expect(response.action).toBe('retry_authentication');
  });
  
  it('should handle session expiration', async () => {
    const error = new AuthenticationError(
      'Session expired',
      AuthenticationErrorCode.SESSION_EXPIRED
    );
    
    const response = await errorHandler.handleError(error);
    
    expect(response.code).toBe('AUTH_SESSION_EXPIRED');
    expect(response.recoverable).toBe(true);
    expect(response.action).toBe('redirect_to_login');
  });
  
  it('should handle insufficient permissions', async () => {
    const error = new AuthorizationError(
      'Insufficient permissions',
      AuthorizationErrorCode.INSUFFICIENT_PERMISSIONS,
      ['REPO_WRITE'],
      ['REPO_READ']
    );
    
    const response = await errorHandler.handleError(error);
    
    expect(response.code).toBe('AUTHZ_INSUFFICIENT_PERMISSIONS');
    expect(response.recoverable).toBe(false);
    expect(response.action).toBe('request_permissions');
    expect(response.requiredPermissions).toEqual(['REPO_WRITE']);
  });
});
```

## Next Steps

After implementing error handling:

1. **Test all error scenarios** with your Bitbucket instance
2. **Monitor error rates** and patterns
3. **Implement alerting** for critical errors
4. **Review and update** error messages based on user feedback
5. **Document error codes** for your team and users

For additional help:
- [Authentication Setup Guide](./authentication-setup.md)
- [Authentication Flow Guide](./authentication-flow.md)
- [MCP Tools Examples](./mcp-tools-examples.md)
- [Troubleshooting Guide](./troubleshooting.md)
