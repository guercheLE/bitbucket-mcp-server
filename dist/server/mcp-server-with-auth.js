/**
 * MCP Server with Authentication Integration
 *
 * This module provides a complete MCP server implementation with
 * authentication support, integrating all Bitbucket tools with
 * proper authentication, authorization, and user context.
 *
 * Key Features:
 * - Complete MCP protocol compliance
 * - OAuth 2.0 authentication integration
 * - Bitbucket API tool execution
 * - User session management
 * - Permission-based access control
 * - Comprehensive error handling
 * - User context in responses
 *
 * Constitutional Requirements:
 * - MCP protocol compliance
 * - OAuth 2.0 authentication
 * - Secure API communication
 * - Comprehensive error handling
 */
import { EventEmitter } from 'events';
import { MCPErrorCode } from '../types/index.js';
import { ToolRegistry } from './tool-registry.js';
import { BitbucketMCPTools } from './bitbucket-mcp-tools.js';
import { BitbucketToolsIntegration } from './auth/bitbucket-tools-integration.js';
import { MCPAuthIntegration } from './auth/mcp-auth-integration.js';
import { MCPAuthMiddleware } from './auth/mcp-auth-middleware.js';
import { BitbucketAPIManager } from './auth/bitbucket-api-manager.js';
/**
 * MCP Server with Authentication
 * Complete MCP server with OAuth authentication and Bitbucket integration
 */
export class MCPServerWithAuth extends EventEmitter {
    id;
    name;
    version;
    isRunning = false;
    config;
    authManager;
    apiManager;
    toolsIntegration;
    authIntegration;
    authMiddleware;
    toolRegistry;
    bitbucketTools;
    activeConnections = new Map();
    constructor(config, authManager) {
        super();
        this.id = `mcp-server-${Date.now()}`;
        this.name = config.name;
        this.version = config.version;
        this.config = config;
        this.authManager = authManager;
        // Initialize components
        this.apiManager = new BitbucketAPIManager();
        this.toolsIntegration = new BitbucketToolsIntegration(this.apiManager);
        this.authIntegration = new MCPAuthIntegration(authManager, this);
        this.authMiddleware = new MCPAuthMiddleware(this.authIntegration, authManager, this, config.requireAuth, config.autoRefresh);
        this.toolRegistry = new ToolRegistry({
            validateParameters: true,
            trackStatistics: true,
            allowOverwrite: false,
            maxTools: 1000
        });
        this.bitbucketTools = new BitbucketMCPTools(this.toolsIntegration);
        this.setupEventHandlers();
        this.registerTools();
    }
    // ============================================================================
    // Server Lifecycle
    // ============================================================================
    /**
     * Start the MCP server
     */
    async start() {
        try {
            // Initialize authentication manager
            await this.authManager.initialize();
            // Initialize API manager
            await this.apiManager.initialize();
            // Emit server started event
            this.emit('server:started', {
                serverId: this.id,
                name: this.name,
                version: this.version,
                timestamp: new Date()
            });
            console.log(`MCP Server started: ${this.name} v${this.version}`);
        }
        catch (error) {
            this.emit('server:error', error);
            throw new Error(`Failed to start MCP server: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Stop the MCP server
     */
    async stop() {
        try {
            // Close all active connections
            for (const [connectionId, connection] of this.activeConnections) {
                await this.handleClientDisconnect(connectionId);
            }
            // Cleanup components
            await this.authManager.cleanup();
            await this.apiManager.cleanup();
            // Emit server stopped event
            this.emit('server:stopped', {
                serverId: this.id,
                timestamp: new Date()
            });
            console.log(`MCP Server stopped: ${this.name}`);
        }
        catch (error) {
            this.emit('server:error', error);
            throw new Error(`Failed to stop MCP server: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // ============================================================================
    // Tool Execution
    // ============================================================================
    /**
     * Execute a tool with authentication
     */
    async executeTool(request) {
        const startTime = Date.now();
        try {
            // Process tool request through authentication middleware
            const processedRequest = await this.authMiddleware.processToolRequest(request, request.context.session);
            if (!processedRequest.success) {
                return {
                    success: false,
                    error: {
                        code: MCPErrorCode.AUTHENTICATION_FAILED,
                        message: processedRequest.error?.message || 'Authentication failed',
                        details: processedRequest.error
                    },
                    metadata: {
                        executionTime: Date.now() - startTime,
                        timestamp: new Date()
                    }
                };
            }
            // Execute tool through registry
            const result = await this.toolRegistry.executeTool(request.name, request.arguments, processedRequest.data.context);
            // Process tool response through authentication middleware
            const processedResponse = await this.authMiddleware.processToolResponse({
                success: result.success,
                data: result.data,
                error: result.error,
                metadata: result.metadata
            }, request.context.session, request);
            if (!processedResponse.success) {
                return {
                    success: false,
                    error: {
                        code: MCPErrorCode.INTERNAL_ERROR,
                        message: 'Failed to process tool response',
                        details: processedResponse.error
                    },
                    metadata: {
                        executionTime: Date.now() - startTime,
                        timestamp: new Date()
                    }
                };
            }
            return processedResponse.data;
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: MCPErrorCode.TOOL_EXECUTION_FAILED,
                    message: error instanceof Error ? error.message : String(error),
                    details: error
                },
                metadata: {
                    executionTime: Date.now() - startTime,
                    timestamp: new Date()
                }
            };
        }
    }
    // ============================================================================
    // Client Connection Management
    // ============================================================================
    /**
     * Handle client connection
     */
    async handleClientConnect(clientSession) {
        try {
            // Store client connection
            this.activeConnections.set(clientSession.id, clientSession);
            // Emit client connected event
            this.emit('client:connected', {
                clientId: clientSession.id,
                transport: clientSession.transport.type,
                timestamp: new Date()
            });
            console.log(`Client connected: ${clientSession.id}`);
        }
        catch (error) {
            this.emit('client:error', clientSession.id, error);
            throw error;
        }
    }
    /**
     * Handle client disconnection
     */
    async handleClientDisconnect(clientId) {
        try {
            // Handle disconnection through auth integration
            await this.authIntegration.handleClientDisconnect(clientId);
            // Remove client connection
            this.activeConnections.delete(clientId);
            // Emit client disconnected event
            this.emit('client:disconnected', {
                clientId,
                timestamp: new Date()
            });
            console.log(`Client disconnected: ${clientId}`);
        }
        catch (error) {
            this.emit('client:error', clientId, error);
        }
    }
    /**
     * Authenticate client
     */
    async authenticateClient(clientSession, authToken, sessionId) {
        try {
            const authResponse = await this.authIntegration.authenticateClient(clientSession, authToken, sessionId);
            if (authResponse.success) {
                this.emit('client:authenticated', {
                    clientId: clientSession.id,
                    userId: authResponse.data?.userId,
                    timestamp: new Date()
                });
            }
            return {
                success: authResponse.success,
                error: authResponse.error
            };
        }
        catch (error) {
            this.emit('client:auth-error', clientSession.id, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    // ============================================================================
    // Server Capabilities
    // ============================================================================
    /**
     * Get server capabilities
     */
    getCapabilities() {
        const tools = this.toolRegistry.getAvailableTools();
        return {
            protocolVersion: '2024-11-05',
            tools: tools.map(tool => tool.name),
            authentication: {
                required: this.config.requireAuth,
                methods: ['oauth2', 'session']
            },
            features: [
                'tools',
                'authentication',
                'bitbucket-api',
                'oauth2',
                'session-management',
                'permission-based-access'
            ]
        };
    }
    // ============================================================================
    // Tool Management
    // ============================================================================
    /**
     * Get available tools
     */
    getAvailableTools() {
        return this.toolRegistry.getAvailableTools().map(tool => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
            authentication: tool.authentication,
            category: tool.category,
            version: tool.version
        }));
    }
    /**
     * Get tool by name
     */
    getTool(toolName) {
        const tool = this.toolRegistry.getTool(toolName);
        if (!tool) {
            return undefined;
        }
        return {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
            authentication: tool.authentication,
            category: tool.category,
            version: tool.version
        };
    }
    // ============================================================================
    // Authentication Status
    // ============================================================================
    /**
     * Get authentication status for client
     */
    getClientAuthStatus(clientId) {
        return this.authIntegration.getClientAuthStatus(clientId);
    }
    /**
     * Get all authenticated clients
     */
    getAllAuthenticatedClients() {
        return this.authIntegration.getAllAuthenticatedClients();
    }
    /**
     * Get authentication statistics
     */
    getAuthStatistics() {
        return this.authIntegration.getAuthStatistics();
    }
    // ============================================================================
    // Private Methods
    // ============================================================================
    /**
     * Register all Bitbucket tools
     */
    async registerTools() {
        try {
            const tools = this.bitbucketTools.getTools();
            for (const tool of tools) {
                // Determine authentication requirements based on tool name
                const authRequirements = this.getToolAuthRequirements(tool.name);
                await this.toolRegistry.registerTool(tool, {
                    validateParameters: true,
                    trackStatistics: true,
                    enabled: true,
                    category: tool.category,
                    version: tool.version,
                    authentication: authRequirements
                });
            }
            console.log(`Registered ${tools.length} Bitbucket MCP tools`);
        }
        catch (error) {
            this.emit('tools:registration-error', error);
            throw new Error(`Failed to register tools: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Get authentication requirements for a tool based on its name
     */
    getToolAuthRequirements(toolName) {
        // Define authentication requirements based on tool functionality
        switch (toolName) {
            case 'search-ids':
                // Search doesn't require authentication but benefits from user context
                return { required: false };
            case 'get-id':
                // Getting operation details doesn't require authentication
                return { required: false };
            case 'call-id':
                // Execution requires authentication for most operations
                return {
                    required: true,
                    minPermissionLevel: 'read'
                };
            default:
                // For other tools, determine based on functionality
                if (toolName.includes('admin') || toolName.includes('user') || toolName.includes('security')) {
                    return {
                        required: true,
                        minPermissionLevel: 'admin'
                    };
                }
                if (toolName.includes('create') || toolName.includes('update') || toolName.includes('delete')) {
                    return {
                        required: true,
                        minPermissionLevel: 'write'
                    };
                }
                // Default to read-level authentication
                return {
                    required: true,
                    minPermissionLevel: 'read'
                };
        }
    }
    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        // Handle authentication events
        this.authIntegration.on('client:authenticated', (data) => {
            this.emit('client:authenticated', data);
        });
        this.authIntegration.on('client:disconnected', (data) => {
            this.emit('client:disconnected', data);
        });
        this.authIntegration.on('client:session-expired', (data) => {
            this.emit('client:session-expired', data);
        });
        // Handle tool execution events
        this.toolRegistry.on('toolExecuted', (toolName, result, context) => {
            this.emit('tool:executed', {
                toolName,
                result,
                context,
                timestamp: new Date()
            });
        });
        this.toolRegistry.on('toolExecutionError', (toolName, error, context) => {
            this.emit('tool:execution-error', {
                toolName,
                error,
                context,
                timestamp: new Date()
            });
        });
        // Handle API events
        this.toolsIntegration.on('tool:executed', (data) => {
            this.emit('api:tool-executed', data);
        });
        this.toolsIntegration.on('api:request-completed', (data) => {
            this.emit('api:request-completed', data);
        });
        this.toolsIntegration.on('api:request-failed', (data) => {
            this.emit('api:request-failed', data);
        });
    }
}
//# sourceMappingURL=mcp-server-with-auth.js.map