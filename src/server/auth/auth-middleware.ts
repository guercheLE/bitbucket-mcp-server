/**
 * Authentication Middleware for MCP Server
 * 
 * This module provides middleware functionality for integrating authentication
 * with the MCP server, including request authentication, session management,
 * and tool execution context.
 * 
 * Key Features:
 * - MCP request authentication
 * - Session validation and refresh
 * - Tool execution context with user information
 * - Error handling and security monitoring
 * - Integration with existing MCP infrastructure
 * 
 * Constitutional Requirements:
 * - MCP protocol compliance
 * - Secure authentication flow
 * - Comprehensive error handling
 * - Performance optimization
 */

import { AuthenticationManager } from './authentication-manager';
import { UserSession, AuthenticationError, AuthenticationErrorCode } from '../../types/auth';
import { ClientSession, ToolExecutionContext, MCPServer } from '../../types';

/**
 * Authentication Middleware Class
 * Handles authentication for MCP requests and tool execution
 */
export class AuthenticationMiddleware {
  private authManager: AuthenticationManager;
  private requireAuth: boolean;

  constructor(authManager: AuthenticationManager, requireAuth: boolean = true) {
    this.authManager = authManager;
    this.requireAuth = requireAuth;
  }

  // ============================================================================
  // MCP Request Authentication
  // ============================================================================

  /**
   * Authenticate MCP request
   */
  async authenticateRequest(
    request: any,
    clientSession: ClientSession,
    server: MCPServer
  ): Promise<AuthenticationResult> {
    try {
      // Extract authentication information from request
      const authInfo = this.extractAuthInfo(request);
      
      if (!authInfo && this.requireAuth) {
        return {
          success: false,
          error: {
            code: AuthenticationErrorCode.AUTHENTICATION_FAILED,
            message: 'Authentication required but not provided',
            timestamp: new Date(),
            isRecoverable: false
          }
        };
      }

      if (!authInfo && !this.requireAuth) {
        // No authentication required, return anonymous context
        return {
          success: true,
          userSession: null,
          isAuthenticated: false
        };
      }

      // Authenticate the request
      const authResponse = await this.authManager.authenticateRequest(
        authInfo?.authorization,
        authInfo?.sessionId
      );

      if (!authResponse.success || !authResponse.data) {
        return {
          success: false,
          error: authResponse.error || {
            code: AuthenticationErrorCode.AUTHENTICATION_FAILED,
            message: 'Authentication failed',
            timestamp: new Date(),
            isRecoverable: false
          }
        };
      }

      // Update client session metadata with authentication info
      clientSession.metadata.authenticated = true;
      clientSession.metadata.userId = authResponse.data.userId;
      clientSession.metadata.userName = authResponse.data.userName;
      clientSession.metadata.permissions = authResponse.data.permissions;

      return {
        success: true,
        userSession: authResponse.data,
        isAuthenticated: true
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: AuthenticationErrorCode.INTERNAL_ERROR,
          message: `Authentication middleware error: ${error.message}`,
          details: { originalError: error.message },
          timestamp: new Date(),
          isRecoverable: true
        }
      };
    }
  }

  /**
   * Create tool execution context with authentication
   */
  async createToolExecutionContext(
    toolName: string,
    params: Record<string, any>,
    clientSession: ClientSession,
    server: MCPServer,
    userSession?: UserSession
  ): Promise<ToolExecutionContext> {
    const requestId = this.generateRequestId();
    const timestamp = new Date();

    // Create base execution context
    const context: ToolExecutionContext = {
      session: clientSession,
      server,
      request: {
        id: requestId,
        timestamp,
        transport: clientSession.transport.type
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsage: process.memoryUsage()
      }
    };

    // Add authentication context if user is authenticated
    if (userSession) {
      // Add user information to context
      (context as any).authentication = {
        userSession,
        userId: userSession.userId,
        userName: userSession.userName,
        userEmail: userSession.userEmail,
        permissions: userSession.permissions,
        accessToken: userSession.accessToken.token,
        isAuthenticated: true
      };

      // Add Bitbucket API context
      (context as any).bitbucket = {
        baseUrl: userSession.metadata.baseUrl,
        instanceType: userSession.metadata.instanceType,
        accessToken: userSession.accessToken.token,
        userId: userSession.userId,
        permissions: userSession.permissions
      };
    } else {
      // Add anonymous context
      (context as any).authentication = {
        userSession: null,
        isAuthenticated: false
      };
    }

    return context;
  }

  /**
   * Validate tool execution permissions
   */
  async validateToolPermissions(
    toolName: string,
    userSession: UserSession | null,
    requiredPermissions: string[] = []
  ): Promise<boolean> {
    // If no authentication required, allow execution
    if (!this.requireAuth && !userSession) {
      return true;
    }

    // If authentication required but no user session, deny
    if (this.requireAuth && !userSession) {
      return false;
    }

    // If no specific permissions required, allow execution
    if (requiredPermissions.length === 0) {
      return true;
    }

    // Check if user has all required permissions
    const userPermissions = userSession!.permissions;
    return requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    );
  }

  /**
   * Handle authentication errors
   */
  handleAuthenticationError(error: AuthenticationError, request: any): any {
    // Log security events
    if (this.authManager.getAuthenticationState().logging?.logSecurityEvents) {
      console.warn('Authentication error:', {
        error: error.code,
        message: error.message,
        requestId: request.id,
        timestamp: error.timestamp,
        recoverable: error.isRecoverable
      });
    }

    // Return appropriate MCP error response
    return {
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: this.mapAuthErrorToMCPError(error.code),
        message: error.message,
        data: {
          authError: error.code,
          recoverable: error.isRecoverable,
          timestamp: error.timestamp
        }
      }
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private extractAuthInfo(request: any): AuthInfo | null {
    // Extract from Authorization header
    const authHeader = request.headers?.authorization || request.authorization;
    
    // Extract from session ID in metadata
    const sessionId = request.metadata?.sessionId || request.sessionId;
    
    // Extract from request parameters
    const tokenParam = request.params?.accessToken || request.accessToken;

    if (authHeader || sessionId || tokenParam) {
      return {
        authorization: authHeader,
        sessionId,
        token: tokenParam
      };
    }

    return null;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private mapAuthErrorToMCPError(authError: AuthenticationErrorCode): number {
    switch (authError) {
      case AuthenticationErrorCode.AUTHENTICATION_FAILED:
        return -32006; // MCP AUTHENTICATION_FAILED
      case AuthenticationErrorCode.AUTHORIZATION_FAILED:
        return -32007; // MCP AUTHORIZATION_FAILED
      case AuthenticationErrorCode.TOKEN_EXPIRED:
        return -32004; // MCP SESSION_EXPIRED
      case AuthenticationErrorCode.TOKEN_INVALID:
        return -32006; // MCP AUTHENTICATION_FAILED
      case AuthenticationErrorCode.SESSION_EXPIRED:
        return -32004; // MCP SESSION_EXPIRED
      case AuthenticationErrorCode.RATE_LIMIT_EXCEEDED:
        return -32005; // MCP RATE_LIMIT_EXCEEDED
      case AuthenticationErrorCode.NETWORK_ERROR:
        return -32003; // MCP TRANSPORT_ERROR
      case AuthenticationErrorCode.TIMEOUT_ERROR:
        return -32003; // MCP TRANSPORT_ERROR
      default:
        return -32603; // MCP INTERNAL_ERROR
    }
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface AuthInfo {
  authorization?: string;
  sessionId?: string;
  token?: string;
}

interface AuthenticationResult {
  success: boolean;
  userSession?: UserSession | null;
  isAuthenticated?: boolean;
  error?: AuthenticationError;
}
