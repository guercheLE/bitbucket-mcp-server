/**
 * MCP Authentication Middleware for Bitbucket MCP Server
 *
 * This module provides middleware functionality for integrating authentication
 * with MCP server requests, including request interception, authentication
 * validation, and response modification.
 *
 * Key Features:
 * - MCP request authentication middleware
 * - Automatic token validation and refresh
 * - Request/response modification
 * - Error handling and security monitoring
 * - Integration with MCP protocol handlers
 *
 * Constitutional Requirements:
 * - MCP protocol compliance
 * - Secure authentication flow
 * - Comprehensive error handling
 * - Performance optimization
 */
import { EventEmitter } from 'events';
import { AuthenticationErrorCode } from '../../types/auth';
/**
 * MCP Authentication Middleware Class
 * Handles authentication for MCP requests and responses
 */
export class MCPAuthMiddleware extends EventEmitter {
    authIntegration;
    authManager;
    mcpServer;
    requireAuth;
    autoRefresh;
    constructor(authIntegration, authManager, mcpServer, requireAuth = true, autoRefresh = true) {
        super();
        this.authIntegration = authIntegration;
        this.authManager = authManager;
        this.mcpServer = mcpServer;
        this.requireAuth = requireAuth;
        this.autoRefresh = autoRefresh;
        this.setupEventHandlers();
    }
    // ============================================================================
    // MCP Request Middleware
    // ============================================================================
    /**
     * Process incoming MCP request with authentication
     */
    async processRequest(request, clientSession) {
        try {
            // Extract authentication information from request
            const authInfo = this.extractAuthInfo(request);
            // Check if authentication is required
            if (this.requireAuth && !authInfo) {
                return this.createAuthErrorResponse(request, AuthenticationErrorCode.AUTHENTICATION_FAILED, 'Authentication required but not provided');
            }
            // If no authentication required and none provided, pass through
            if (!this.requireAuth && !authInfo) {
                return {
                    success: true,
                    data: request,
                    metadata: {
                        timestamp: new Date(),
                        requestId: this.generateRequestId(),
                        processingTime: 0
                    }
                };
            }
            // Authenticate client if not already authenticated
            if (!this.authIntegration.getClientAuthStatus(clientSession.id).isAuthenticated) {
                const authResponse = await this.authIntegration.authenticateClient(clientSession, authInfo?.token, authInfo?.sessionId);
                if (!authResponse.success) {
                    return this.createAuthErrorResponse(request, authResponse.error?.code || AuthenticationErrorCode.AUTHENTICATION_FAILED, authResponse.error?.message || 'Authentication failed');
                }
            }
            // Validate client authentication
            const validationResponse = await this.authIntegration.validateClientAuth(clientSession.id);
            if (!validationResponse.success) {
                return this.createAuthErrorResponse(request, validationResponse.error?.code || AuthenticationErrorCode.AUTHENTICATION_FAILED, validationResponse.error?.message || 'Authentication validation failed');
            }
            // Add authentication context to request
            const authenticatedRequest = this.addAuthContext(request, validationResponse.data);
            // Emit authenticated request event
            this.emit('request:authenticated', {
                requestId: request.id,
                clientId: clientSession.id,
                userId: validationResponse.data.userId,
                method: request.method
            });
            return {
                success: true,
                data: authenticatedRequest,
                metadata: {
                    timestamp: new Date(),
                    requestId: this.generateRequestId(),
                    processingTime: 0
                }
            };
        }
        catch (error) {
            return this.createAuthErrorResponse(request, AuthenticationErrorCode.INTERNAL_ERROR, `Request processing failed: ${error.message}`);
        }
    }
    /**
     * Process outgoing MCP response with authentication context
     */
    async processResponse(response, clientSession, originalRequest) {
        try {
            // Get client authentication status
            const authStatus = this.authIntegration.getClientAuthStatus(clientSession.id);
            // Add authentication metadata to response
            const authenticatedResponse = this.addAuthMetadata(response, authStatus);
            // Emit response processed event
            this.emit('response:processed', {
                responseId: response.id,
                clientId: clientSession.id,
                userId: authStatus.userId,
                success: !response.error
            });
            return {
                success: true,
                data: authenticatedResponse,
                metadata: {
                    timestamp: new Date(),
                    requestId: this.generateRequestId(),
                    processingTime: 0
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: AuthenticationErrorCode.INTERNAL_ERROR,
                    message: `Response processing failed: ${error.message}`,
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
    // Tool Request Middleware
    // ============================================================================
    /**
     * Process tool request with authentication
     */
    async processToolRequest(toolRequest, clientSession) {
        try {
            // Validate client authentication
            const validationResponse = await this.authIntegration.validateClientAuth(clientSession.id);
            if (!validationResponse.success) {
                return this.createToolAuthErrorResponse(toolRequest, validationResponse.error?.code || AuthenticationErrorCode.AUTHENTICATION_FAILED, validationResponse.error?.message || 'Tool execution requires authentication');
            }
            // Check tool permissions
            const hasPermission = await this.checkToolPermissions(toolRequest.name, validationResponse.data);
            if (!hasPermission) {
                return this.createToolAuthErrorResponse(toolRequest, AuthenticationErrorCode.AUTHORIZATION_FAILED, `Insufficient permissions for tool: ${toolRequest.name}`);
            }
            // Add authentication context to tool request
            const authenticatedToolRequest = this.addToolAuthContext(toolRequest, validationResponse.data);
            // Emit tool request authenticated event
            this.emit('tool:request-authenticated', {
                toolName: toolRequest.name,
                clientId: clientSession.id,
                userId: validationResponse.data.userId,
                timestamp: new Date()
            });
            return {
                success: true,
                data: authenticatedToolRequest,
                metadata: {
                    timestamp: new Date(),
                    requestId: this.generateRequestId(),
                    processingTime: 0
                }
            };
        }
        catch (error) {
            return this.createToolAuthErrorResponse(toolRequest, AuthenticationErrorCode.INTERNAL_ERROR, `Tool request processing failed: ${error.message}`);
        }
    }
    /**
     * Process tool response with authentication context
     */
    async processToolResponse(toolResponse, clientSession, originalRequest) {
        try {
            // Get client authentication status
            const authStatus = this.authIntegration.getClientAuthStatus(clientSession.id);
            // Add authentication metadata to tool response
            const authenticatedResponse = this.addToolAuthMetadata(toolResponse, authStatus);
            // Emit tool response processed event
            this.emit('tool:response-processed', {
                toolName: originalRequest.name,
                clientId: clientSession.id,
                userId: authStatus.userId,
                success: toolResponse.success,
                timestamp: new Date()
            });
            return {
                success: true,
                data: authenticatedResponse,
                metadata: {
                    timestamp: new Date(),
                    requestId: this.generateRequestId(),
                    processingTime: 0
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: AuthenticationErrorCode.INTERNAL_ERROR,
                    message: `Tool response processing failed: ${error.message}`,
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
    // Authentication Utilities
    // ============================================================================
    /**
     * Check if user has permission to execute tool
     */
    async checkToolPermissions(toolName, userSession) {
        // Define tool permission requirements
        const toolPermissions = {
            'bitbucket/repository/list': ['REPO_READ'],
            'bitbucket/repository/create': ['REPO_WRITE'],
            'bitbucket/repository/delete': ['REPO_ADMIN'],
            'bitbucket/project/list': ['PROJECT_READ'],
            'bitbucket/project/create': ['PROJECT_ADMIN'],
            'bitbucket/pull-request/list': ['REPO_READ'],
            'bitbucket/pull-request/create': ['REPO_WRITE'],
            'bitbucket/pull-request/merge': ['REPO_WRITE'],
            // Add more tool permissions as needed
        };
        const requiredPermissions = toolPermissions[toolName] || [];
        if (requiredPermissions.length === 0) {
            return true; // No specific permissions required
        }
        const userPermissions = userSession.permissions || [];
        return requiredPermissions.every(permission => userPermissions.includes(permission));
    }
    /**
     * Extract authentication information from MCP request
     */
    extractAuthInfo(request) {
        // Extract from request headers/metadata
        const authHeader = request.metadata?.authorization || request.authorization;
        const sessionId = request.metadata?.sessionId || request.sessionId;
        // Extract from request parameters
        const tokenParam = request.params?.accessToken || request.accessToken;
        if (authHeader || sessionId || tokenParam) {
            return {
                token: authHeader || tokenParam,
                sessionId
            };
        }
        return null;
    }
    /**
     * Add authentication context to MCP request
     */
    addAuthContext(request, userSession) {
        return {
            ...request,
            metadata: {
                ...request.metadata,
                authentication: {
                    userId: userSession.userId,
                    userName: userSession.userName,
                    permissions: userSession.permissions,
                    sessionId: userSession.id
                }
            }
        };
    }
    /**
     * Add authentication metadata to MCP response
     */
    addAuthMetadata(response, authStatus) {
        return {
            ...response,
            metadata: {
                ...response.metadata,
                authentication: {
                    isAuthenticated: authStatus.isAuthenticated,
                    userId: authStatus.userId,
                    sessionExpiresAt: authStatus.sessionExpiresAt
                }
            }
        };
    }
    /**
     * Add authentication context to tool request
     */
    addToolAuthContext(toolRequest, userSession) {
        return {
            ...toolRequest,
            context: {
                ...toolRequest.context,
                authentication: {
                    userSession,
                    userId: userSession.userId,
                    userName: userSession.userName,
                    permissions: userSession.permissions,
                    accessToken: userSession.accessToken.token,
                    isAuthenticated: true
                }
            }
        };
    }
    /**
     * Add authentication metadata to tool response
     */
    addToolAuthMetadata(toolResponse, authStatus) {
        return {
            ...toolResponse,
            metadata: {
                ...toolResponse.metadata,
                authentication: {
                    isAuthenticated: authStatus.isAuthenticated,
                    userId: authStatus.userId,
                    permissions: authStatus.permissions
                }
            }
        };
    }
    /**
     * Create authentication error response for MCP request
     */
    createAuthErrorResponse(request, errorCode, message) {
        return {
            success: false,
            error: {
                code: errorCode,
                message,
                timestamp: new Date(),
                isRecoverable: this.isRecoverableError(errorCode)
            },
            metadata: {
                timestamp: new Date(),
                requestId: this.generateRequestId(),
                processingTime: 0
            }
        };
    }
    /**
     * Create authentication error response for tool request
     */
    createToolAuthErrorResponse(toolRequest, errorCode, message) {
        return {
            success: false,
            error: {
                code: errorCode,
                message,
                timestamp: new Date(),
                isRecoverable: this.isRecoverableError(errorCode)
            },
            metadata: {
                timestamp: new Date(),
                requestId: this.generateRequestId(),
                processingTime: 0
            }
        };
    }
    /**
     * Check if error is recoverable
     */
    isRecoverableError(errorCode) {
        const recoverableErrors = [
            AuthenticationErrorCode.NETWORK_ERROR,
            AuthenticationErrorCode.TIMEOUT_ERROR,
            AuthenticationErrorCode.RATE_LIMIT_EXCEEDED
        ];
        return recoverableErrors.includes(errorCode);
    }
    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        // Handle authentication integration events
        this.authIntegration.on('client:authenticated', (data) => {
            this.emit('client:authenticated', data);
        });
        this.authIntegration.on('client:disconnected', (data) => {
            this.emit('client:disconnected', data);
        });
        this.authIntegration.on('client:session-expired', (data) => {
            this.emit('client:session-expired', data);
        });
    }
    /**
     * Generate unique request ID
     */
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
//# sourceMappingURL=mcp-auth-middleware.js.map