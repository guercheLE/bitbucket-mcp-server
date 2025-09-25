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
import { UserSession, AuthenticationError } from '../../types/auth';
import { ClientSession, ToolExecutionContext, MCPServer } from '../../types';
/**
 * Authentication Middleware Class
 * Handles authentication for MCP requests and tool execution
 */
export declare class AuthenticationMiddleware {
    private authManager;
    private requireAuth;
    constructor(authManager: AuthenticationManager, requireAuth?: boolean);
    /**
     * Authenticate MCP request
     */
    authenticateRequest(request: any, clientSession: ClientSession, server: MCPServer): Promise<AuthenticationResult>;
    /**
     * Create tool execution context with authentication
     */
    createToolExecutionContext(toolName: string, params: Record<string, any>, clientSession: ClientSession, server: MCPServer, userSession?: UserSession): Promise<ToolExecutionContext>;
    /**
     * Validate tool execution permissions
     */
    validateToolPermissions(toolName: string, userSession: UserSession | null, requiredPermissions?: string[]): Promise<boolean>;
    /**
     * Handle authentication errors
     */
    handleAuthenticationError(error: AuthenticationError, request: any): any;
    private extractAuthInfo;
    private generateRequestId;
    private mapAuthErrorToMCPError;
}
interface AuthenticationResult {
    success: boolean;
    userSession?: UserSession | null;
    isAuthenticated?: boolean;
    error?: AuthenticationError;
}
export {};
//# sourceMappingURL=auth-middleware.d.ts.map