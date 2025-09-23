/**
 * MCP Authentication Integration for Bitbucket MCP Server
 * 
 * This module provides integration between the authentication system
 * and the MCP server, handling authentication for MCP requests,
 * tool execution context, and session management.
 * 
 * Key Features:
 * - MCP request authentication
 * - Tool execution context with user information
 * - Session management for MCP clients
 * - Authentication status reporting
 * - Integration with existing MCP infrastructure
 * 
 * Constitutional Requirements:
 * - MCP protocol compliance
 * - Secure authentication flow
 * - Comprehensive error handling
 * - Performance optimization
 */

import { EventEmitter } from 'events';
import {
  AuthenticationManager,
  UserSession,
  AuthenticationError,
  AuthenticationErrorCode,
  AuthenticationResponse
} from '../../types/auth';
import { MCPServer, ClientSession, ToolExecutionContext, ToolRequest, ToolResponse } from '../../types';

/**
 * MCP Authentication Integration Class
 * Integrates authentication with MCP server operations
 */
export class MCPAuthIntegration extends EventEmitter {
  private authManager: AuthenticationManager;
  private mcpServer: MCPServer;
  private authenticatedClients: Map<string, UserSession> = new Map();
  private clientSessions: Map<string, ClientSession> = new Map();

  constructor(authManager: AuthenticationManager, mcpServer: MCPServer) {
    super();
    this.authManager = authManager;
    this.mcpServer = mcpServer;
    this.setupEventHandlers();
  }

  // ============================================================================
  // MCP Request Authentication
  // ============================================================================

  /**
   * Authenticate MCP client connection
   */
  async authenticateClient(
    clientSession: ClientSession,
    authToken?: string,
    sessionId?: string
  ): Promise<AuthenticationResponse<UserSession>> {
    try {
      let userSession: UserSession | null = null;

      // Try to authenticate with provided token or session
      if (authToken) {
        const tokenAuth = await this.authManager.authenticateWithToken(authToken);
        if (tokenAuth.success && tokenAuth.data) {
          userSession = tokenAuth.data;
        }
      } else if (sessionId) {
        const sessionAuth = await this.authManager.authenticateWithSession(sessionId);
        if (sessionAuth.success && sessionAuth.data) {
          userSession = sessionAuth.data;
        }
      }

      if (!userSession) {
        return {
          success: false,
          error: {
            code: AuthenticationErrorCode.AUTHENTICATION_FAILED,
            message: 'Authentication failed: invalid token or session',
            timestamp: new Date(),
            isRecoverable: false
          },
          metadata: {
            timestamp: new Date(),
            requestId: this.generateRequestId(),
            processingTime: 0
          }
        };
      }

      // Store authenticated client
      this.authenticatedClients.set(clientSession.id, userSession);
      this.clientSessions.set(clientSession.id, clientSession);

      // Update client session metadata
      clientSession.metadata.authenticated = true;
      clientSession.metadata.userId = userSession.userId;
      clientSession.metadata.userName = userSession.userName;
      clientSession.metadata.permissions = userSession.permissions;

      // Emit authentication event
      this.emit('client:authenticated', {
        clientId: clientSession.id,
        userId: userSession.userId,
        userName: userSession.userName
      });

      return {
        success: true,
        data: userSession,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: AuthenticationErrorCode.INTERNAL_ERROR,
          message: `Client authentication failed: ${error.message}`,
          details: { originalError: error.message },
          timestamp: new Date(),
          isRecoverable: true
        },
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0
        }
      };
    }
  }

  /**
   * Validate client authentication for MCP request
   */
  async validateClientAuth(clientId: string): Promise<AuthenticationResponse<UserSession>> {
    try {
      const userSession = this.authenticatedClients.get(clientId);
      if (!userSession) {
        return {
          success: false,
          error: {
            code: AuthenticationErrorCode.AUTHENTICATION_FAILED,
            message: 'Client not authenticated',
            timestamp: new Date(),
            isRecoverable: false
          },
          metadata: {
            timestamp: new Date(),
            requestId: this.generateRequestId(),
            processingTime: 0
          }
        };
      }

      // Validate session is still active
      const sessionValidation = await this.authManager.validateSession(userSession.id);
      if (!sessionValidation.success || !sessionValidation.data) {
        // Remove invalid session
        this.authenticatedClients.delete(clientId);
        this.clientSessions.delete(clientId);

        return {
          success: false,
          error: {
            code: AuthenticationErrorCode.SESSION_EXPIRED,
            message: 'User session has expired',
            timestamp: new Date(),
            isRecoverable: false
          },
          metadata: {
            timestamp: new Date(),
            requestId: this.generateRequestId(),
            processingTime: 0
          }
        };
      }

      return {
        success: true,
        data: sessionValidation.data,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: AuthenticationErrorCode.INTERNAL_ERROR,
          message: `Client validation failed: ${error.message}`,
          details: { originalError: error.message },
          timestamp: new Date(),
          isRecoverable: true
        },
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0
        }
      };
    }
  }

  // ============================================================================
  // Tool Execution Context
  // ============================================================================

  /**
   * Create authenticated tool execution context
   */
  async createToolExecutionContext(
    clientId: string,
    toolName: string,
    params: Record<string, any>
  ): Promise<AuthenticationResponse<ToolExecutionContext>> {
    try {
      // Validate client authentication
      const authValidation = await this.validateClientAuth(clientId);
      if (!authValidation.success || !authValidation.data) {
        return authValidation as AuthenticationResponse<ToolExecutionContext>;
      }

      const userSession = authValidation.data;
      const clientSession = this.clientSessions.get(clientId);

      if (!clientSession) {
        return {
          success: false,
          error: {
            code: AuthenticationErrorCode.INTERNAL_ERROR,
            message: 'Client session not found',
            timestamp: new Date(),
            isRecoverable: false
          },
          metadata: {
            timestamp: new Date(),
            requestId: this.generateRequestId(),
            processingTime: 0
          }
        };
      }

      // Create tool execution context with authentication
      const context: ToolExecutionContext = {
        session: clientSession,
        server: this.mcpServer,
        request: {
          id: this.generateRequestId(),
          timestamp: new Date(),
          transport: clientSession.transport.type
        },
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          memoryUsage: process.memoryUsage()
        },
        // Add authentication context
        authentication: {
          userSession,
          userId: userSession.userId,
          userName: userSession.userName,
          userEmail: userSession.userEmail,
          permissions: userSession.permissions,
          accessToken: userSession.accessToken.token,
          isAuthenticated: true
        },
        // Add Bitbucket API context
        bitbucket: {
          baseUrl: userSession.metadata.baseUrl,
          instanceType: userSession.metadata.instanceType,
          accessToken: userSession.accessToken.token,
          userId: userSession.userId,
          permissions: userSession.permissions
        }
      };

      return {
        success: true,
        data: context,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: AuthenticationErrorCode.INTERNAL_ERROR,
          message: `Failed to create tool execution context: ${error.message}`,
          details: { originalError: error.message },
          timestamp: new Date(),
          isRecoverable: true
        },
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0
        }
      };
    }
  }

  /**
   * Execute tool with authentication context
   */
  async executeToolWithAuth(
    clientId: string,
    toolName: string,
    params: Record<string, any>
  ): Promise<AuthenticationResponse<ToolResponse>> {
    try {
      // Create authenticated execution context
      const contextResponse = await this.createToolExecutionContext(clientId, toolName, params);
      if (!contextResponse.success || !contextResponse.data) {
        return contextResponse as AuthenticationResponse<ToolResponse>;
      }

      const context = contextResponse.data;

      // Execute tool with context
      const toolRequest: ToolRequest = {
        name: toolName,
        arguments: params,
        context
      };

      const toolResponse = await this.mcpServer.executeTool(toolRequest);

      // Emit tool execution event
      this.emit('tool:executed', {
        clientId,
        toolName,
        userId: context.authentication.userId,
        success: toolResponse.success,
        timestamp: new Date()
      });

      return {
        success: true,
        data: toolResponse,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: AuthenticationErrorCode.INTERNAL_ERROR,
          message: `Tool execution failed: ${error.message}`,
          details: { originalError: error.message },
          timestamp: new Date(),
          isRecoverable: true
        },
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0
        }
      };
    }
  }

  // ============================================================================
  // Session Management
  // ============================================================================

  /**
   * Handle client disconnection
   */
  async handleClientDisconnect(clientId: string): Promise<void> {
    try {
      const userSession = this.authenticatedClients.get(clientId);
      if (userSession) {
        // Optionally terminate session on disconnect
        // await this.authManager.terminateSession(userSession.id);
        
        this.authenticatedClients.delete(clientId);
        this.clientSessions.delete(clientId);

        this.emit('client:disconnected', {
          clientId,
          userId: userSession.userId,
          timestamp: new Date()
        });
      }
    } catch (error) {
      this.emit('error', error);
    }
  }

  /**
   * Refresh client authentication
   */
  async refreshClientAuth(clientId: string): Promise<AuthenticationResponse<UserSession>> {
    try {
      const userSession = this.authenticatedClients.get(clientId);
      if (!userSession) {
        return {
          success: false,
          error: {
            code: AuthenticationErrorCode.AUTHENTICATION_FAILED,
            message: 'Client not authenticated',
            timestamp: new Date(),
            isRecoverable: false
          },
          metadata: {
            timestamp: new Date(),
            requestId: this.generateRequestId(),
            processingTime: 0
          }
        };
      }

      // Refresh session
      const refreshResponse = await this.authManager.refreshSession(userSession.id);
      if (!refreshResponse.success || !refreshResponse.data) {
        return refreshResponse;
      }

      // Update stored session
      this.authenticatedClients.set(clientId, refreshResponse.data);

      return {
        success: true,
        data: refreshResponse.data,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: AuthenticationErrorCode.INTERNAL_ERROR,
          message: `Session refresh failed: ${error.message}`,
          details: { originalError: error.message },
          timestamp: new Date(),
          isRecoverable: true
        },
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0
        }
      };
    }
  }

  // ============================================================================
  // Authentication Status Reporting
  // ============================================================================

  /**
   * Get authentication status for client
   */
  getClientAuthStatus(clientId: string): AuthenticationStatus {
    const userSession = this.authenticatedClients.get(clientId);
    const clientSession = this.clientSessions.get(clientId);

    return {
      clientId,
      isAuthenticated: !!userSession,
      userId: userSession?.userId,
      userName: userSession?.userName,
      permissions: userSession?.permissions || [],
      sessionExpiresAt: userSession?.expiresAt,
      lastActivity: userSession?.lastActivity,
      clientInfo: clientSession ? {
        transport: clientSession.transport.type,
        connectedAt: clientSession.connectedAt,
        metadata: clientSession.metadata
      } : undefined
    };
  }

  /**
   * Get all authenticated clients
   */
  getAllAuthenticatedClients(): AuthenticationStatus[] {
    const statuses: AuthenticationStatus[] = [];
    
    for (const clientId of this.authenticatedClients.keys()) {
      statuses.push(this.getClientAuthStatus(clientId));
    }
    
    return statuses;
  }

  /**
   * Get authentication statistics
   */
  getAuthStatistics(): AuthStatistics {
    const now = new Date();
    const authenticatedClients = this.authenticatedClients.size;
    const activeSessions = Array.from(this.authenticatedClients.values())
      .filter(session => session.expiresAt > now).length;
    
    const expiredSessions = authenticatedClients - activeSessions;
    
    return {
      totalAuthenticatedClients: authenticatedClients,
      activeSessions,
      expiredSessions,
      lastUpdated: now
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private setupEventHandlers(): void {
    // Handle authentication manager events
    this.authManager.on('session:expired', (data) => {
      // Remove expired sessions from authenticated clients
      for (const [clientId, userSession] of this.authenticatedClients.entries()) {
        if (userSession.id === data.sessionId) {
          this.authenticatedClients.delete(clientId);
          this.clientSessions.delete(clientId);
          this.emit('client:session-expired', { clientId, sessionId: data.sessionId });
        }
      }
    });

    this.authManager.on('session:terminated', (data) => {
      // Remove terminated sessions from authenticated clients
      for (const [clientId, userSession] of this.authenticatedClients.entries()) {
        if (userSession.id === data.sessionId) {
          this.authenticatedClients.delete(clientId);
          this.clientSessions.delete(clientId);
          this.emit('client:session-terminated', { clientId, sessionId: data.sessionId });
        }
      }
    });
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface AuthenticationStatus {
  clientId: string;
  isAuthenticated: boolean;
  userId?: string;
  userName?: string;
  permissions?: string[];
  sessionExpiresAt?: Date;
  lastActivity?: Date;
  clientInfo?: {
    transport: string;
    connectedAt: Date;
    metadata: Record<string, any>;
  };
}

interface AuthStatistics {
  totalAuthenticatedClients: number;
  activeSessions: number;
  expiredSessions: number;
  lastUpdated: Date;
}
