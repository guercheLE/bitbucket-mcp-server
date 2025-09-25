/**
 * MCP Server Authentication Integration for Bitbucket MCP Server
 *
 * This module provides the main integration point between the authentication
 * system and the MCP server, handling server initialization, client connections,
 * and authentication flow management.
 *
 * Key Features:
 * - MCP server authentication initialization
 * - Client connection management with authentication
 * - Authentication flow orchestration
 * - Server lifecycle management
 * - Integration with existing MCP infrastructure
 *
 * Constitutional Requirements:
 * - MCP protocol compliance
 * - Secure authentication flow
 * - Comprehensive error handling
 * - Performance optimization
 */
import { EventEmitter } from 'events';
import { AuthenticationManager, AuthenticationErrorCode } from '../../types/auth';
import { MCPAuthIntegration } from './mcp-auth-integration';
import { MCPAuthMiddleware } from './mcp-auth-middleware';
/**
 * MCP Server Authentication Integration Class
 * Main integration point for authentication with MCP server
 */
export class MCPServerAuthIntegration extends EventEmitter {
    authManager;
    mcpServer;
    authIntegration;
    authMiddleware;
    config;
    initialized = false;
    constructor(mcpServer, config) {
        super();
        this.mcpServer = mcpServer;
        this.config = config;
        this.authManager = new AuthenticationManager(config);
        this.authIntegration = new MCPAuthIntegration(this.authManager, this.mcpServer);
        this.authMiddleware = new MCPAuthMiddleware(this.authIntegration, this.authManager, this.mcpServer, true, // requireAuth
        true // autoRefresh
        );
        this.setupEventHandlers();
    }
    // ============================================================================
    // Server Initialization
    // ============================================================================
    /**
     * Initialize authentication integration with MCP server
     */
    async initialize() {
        try {
            if (this.initialized) {
                return {
                    success: true,
                    metadata: {
                        timestamp: new Date(),
                        requestId: this.generateRequestId(),
                        processingTime: 0
                    }
                };
            }
            // Initialize authentication manager
            const authInitResponse = await this.authManager.initialize();
            if (!authInitResponse.success) {
                return authInitResponse;
            }
            // Setup MCP server authentication hooks
            await this.setupMCPServerHooks();
            this.initialized = true;
            // Emit initialization complete event
            this.emit('integration:initialized', {
                timestamp: new Date(),
                config: this.config
            });
            return {
                success: true,
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
                    message: `Authentication integration initialization failed: ${error.message}`,
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
     * Setup MCP server authentication hooks
     */
    async setupMCPServerHooks() {
        // Hook into client connection events
        this.mcpServer.on('client:connected', async (clientSession) => {
            await this.handleClientConnected(clientSession);
        });
        this.mcpServer.on('client:disconnected', async (clientSession) => {
            await this.handleClientDisconnected(clientSession);
        });
        // Hook into request processing
        this.mcpServer.on('request:received', async (request, clientSession) => {
            await this.handleRequestReceived(request, clientSession);
        });
        this.mcpServer.on('response:sent', async (response, clientSession) => {
            await this.handleResponseSent(response, clientSession);
        });
        // Hook into tool execution
        this.mcpServer.on('tool:request', async (toolRequest, clientSession) => {
            await this.handleToolRequest(toolRequest, clientSession);
        });
        this.mcpServer.on('tool:response', async (toolResponse, clientSession) => {
            await this.handleToolResponse(toolResponse, clientSession);
        });
    }
    // ============================================================================
    // Client Connection Management
    // ============================================================================
    /**
     * Handle client connection with authentication
     */
    async handleClientConnected(clientSession) {
        try {
            // Emit client connection event
            this.emit('client:connected', {
                clientId: clientSession.id,
                transport: clientSession.transport.type,
                timestamp: new Date()
            });
            // Note: Authentication will be handled when the first request is received
            // This allows for different authentication methods per request
        }
        catch (error) {
            this.emit('error', {
                event: 'client:connected',
                error: error.message,
                clientId: clientSession.id,
                timestamp: new Date()
            });
        }
    }
    /**
     * Handle client disconnection
     */
    async handleClientDisconnected(clientSession) {
        try {
            // Handle disconnection in auth integration
            await this.authIntegration.handleClientDisconnect(clientSession.id);
            // Emit client disconnection event
            this.emit('client:disconnected', {
                clientId: clientSession.id,
                timestamp: new Date()
            });
        }
        catch (error) {
            this.emit('error', {
                event: 'client:disconnected',
                error: error.message,
                clientId: clientSession.id,
                timestamp: new Date()
            });
        }
    }
    // ============================================================================
    // Request/Response Processing
    // ============================================================================
    /**
     * Handle incoming MCP request with authentication
     */
    async handleRequestReceived(request, clientSession) {
        try {
            // Process request through authentication middleware
            const processedRequest = await this.authMiddleware.processRequest(request, clientSession);
            if (!processedRequest.success) {
                // Send authentication error response
                const errorResponse = this.createMCPErrorResponse(request, processedRequest.error?.code || AuthenticationErrorCode.AUTHENTICATION_FAILED, processedRequest.error?.message || 'Authentication failed');
                await this.mcpServer.sendResponse(errorResponse, clientSession);
                return;
            }
            // Continue with normal request processing
            this.emit('request:authenticated', {
                requestId: request.id,
                clientId: clientSession.id,
                timestamp: new Date()
            });
        }
        catch (error) {
            this.emit('error', {
                event: 'request:received',
                error: error.message,
                requestId: request.id,
                clientId: clientSession.id,
                timestamp: new Date()
            });
        }
    }
    /**
     * Handle outgoing MCP response with authentication context
     */
    async handleResponseSent(response, clientSession) {
        try {
            // Process response through authentication middleware
            const processedResponse = await this.authMiddleware.processResponse(response, clientSession, response.originalRequest);
            if (processedResponse.success) {
                this.emit('response:processed', {
                    responseId: response.id,
                    clientId: clientSession.id,
                    timestamp: new Date()
                });
            }
        }
        catch (error) {
            this.emit('error', {
                event: 'response:sent',
                error: error.message,
                responseId: response.id,
                clientId: clientSession.id,
                timestamp: new Date()
            });
        }
    }
    // ============================================================================
    // Tool Execution Management
    // ============================================================================
    /**
     * Handle tool request with authentication
     */
    async handleToolRequest(toolRequest, clientSession) {
        try {
            // Process tool request through authentication middleware
            const processedRequest = await this.authMiddleware.processToolRequest(toolRequest, clientSession);
            if (!processedRequest.success) {
                // Send tool authentication error response
                const errorResponse = this.createToolErrorResponse(toolRequest, processedRequest.error?.code || AuthenticationErrorCode.AUTHENTICATION_FAILED, processedRequest.error?.message || 'Tool execution requires authentication');
                await this.mcpServer.sendToolResponse(errorResponse, clientSession);
                return;
            }
            // Continue with normal tool execution
            this.emit('tool:request-authenticated', {
                toolName: toolRequest.name,
                clientId: clientSession.id,
                timestamp: new Date()
            });
        }
        catch (error) {
            this.emit('error', {
                event: 'tool:request',
                error: error.message,
                toolName: toolRequest.name,
                clientId: clientSession.id,
                timestamp: new Date()
            });
        }
    }
    /**
     * Handle tool response with authentication context
     */
    async handleToolResponse(toolResponse, clientSession) {
        try {
            // Process tool response through authentication middleware
            const processedResponse = await this.authMiddleware.processToolResponse(toolResponse, clientSession, toolResponse.originalRequest);
            if (processedResponse.success) {
                this.emit('tool:response-processed', {
                    toolName: toolResponse.originalRequest?.name,
                    clientId: clientSession.id,
                    timestamp: new Date()
                });
            }
        }
        catch (error) {
            this.emit('error', {
                event: 'tool:response',
                error: error.message,
                toolName: toolResponse.originalRequest?.name,
                clientId: clientSession.id,
                timestamp: new Date()
            });
        }
    }
    // ============================================================================
    // Authentication Management
    // ============================================================================
    /**
     * Get authentication status for all clients
     */
    getAuthenticationStatus() {
        return {
            initialized: this.initialized,
            authenticatedClients: this.authIntegration.getAllAuthenticatedClients(),
            statistics: this.authIntegration.getAuthStatistics(),
            config: this.config
        };
    }
    /**
     * Get authentication status for specific client
     */
    getClientAuthenticationStatus(clientId) {
        return this.authIntegration.getClientAuthStatus(clientId);
    }
    /**
     * Refresh authentication for specific client
     */
    async refreshClientAuthentication(clientId) {
        return await this.authIntegration.refreshClientAuth(clientId);
    }
    /**
     * Terminate authentication for specific client
     */
    async terminateClientAuthentication(clientId) {
        await this.authIntegration.handleClientDisconnect(clientId);
    }
    // ============================================================================
    // Utility Methods
    // ============================================================================
    /**
     * Create MCP error response for authentication failures
     */
    createMCPErrorResponse(request, errorCode, message) {
        return {
            jsonrpc: '2.0',
            id: request.id,
            error: {
                code: this.mapAuthErrorToMCPError(errorCode),
                message,
                data: {
                    authError: errorCode,
                    timestamp: new Date()
                }
            }
        };
    }
    /**
     * Create tool error response for authentication failures
     */
    createToolErrorResponse(toolRequest, errorCode, message) {
        return {
            success: false,
            error: {
                code: this.mapAuthErrorToMCPError(errorCode),
                message,
                data: {
                    authError: errorCode,
                    toolName: toolRequest.name,
                    timestamp: new Date()
                }
            }
        };
    }
    /**
     * Map authentication error codes to MCP error codes
     */
    mapAuthErrorToMCPError(authError) {
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
        // Handle authentication middleware events
        this.authMiddleware.on('request:authenticated', (data) => {
            this.emit('request:authenticated', data);
        });
        this.authMiddleware.on('tool:request-authenticated', (data) => {
            this.emit('tool:request-authenticated', data);
        });
    }
    /**
     * Generate unique request ID
     */
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
//# sourceMappingURL=mcp-server-auth-integration.js.map