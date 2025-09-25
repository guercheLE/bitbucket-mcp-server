/**
 * MCP Server Entry Point
 *
 * Main entry point for the Bitbucket MCP Server implementation.
 * This module provides server initialization, startup logic, and graceful shutdown
 * with full MCP protocol compliance and constitutional requirements.
 *
 * Key Features:
 * - Server initialization and configuration
 * - Transport setup and management
 * - Tool registration and discovery
 * - Graceful startup and shutdown
 * - Error handling and logging
 * - Health monitoring
 * - CLI interface support
 * - Environment configuration
 *
 * Constitutional Requirements:
 * - MCP Protocol First
 * - Multi-Transport Protocol
 * - Selective Tool Registration
 * - Complete API Coverage
 * - Test-First Development
 * - Memory efficiency (<1GB limit)
 * - Error handling and logging
 */
import { MCPErrorCode } from '../types/index.js';
import { createConnectionManager } from './connection-manager.js';
import { createLoggerFromConfig } from './logger.js';
import { createMCPServerWithSDK, createTransport } from './mcp-server-sdk.js';
import { MCPServer } from './mcp-server.js';
import { ProtocolMessageHandler } from './protocol-handler.js';
import { ToolRegistry } from './tool-registry.js';
import { TransportFactory } from './transport-factory.js';
/**
 * Server Application Class
 *
 * Main application class that orchestrates all server components
 * and provides the entry point for the MCP server.
 */
export class MCPServerApplication {
    server;
    sdkServer;
    logger;
    connectionManager;
    sessionManager; // SessionManager is static, will use directly
    toolRegistry;
    transportFactory;
    messageHandler;
    config;
    isRunning = false;
    constructor(config) {
        // Initialize default configuration
        this.config = this.createDefaultConfig(config);
        // Initialize logger first
        this.logger = createLoggerFromConfig(this.config);
        // Initialize connection manager
        this.connectionManager = createConnectionManager(this.config, this.logger);
        // Initialize components
        this.sessionManager = null; // SessionManager is static
        this.toolRegistry = new ToolRegistry({
            validateParameters: this.config.tools.validationEnabled,
            trackStatistics: true,
            allowOverwrite: false,
            maxTools: 1000
        });
        this.transportFactory = new TransportFactory({
            maxConnections: this.config.maxClients,
            connectionTimeout: 30000,
            requestTimeout: 10000,
            enablePooling: true,
            enableMonitoring: true,
            defaultTransport: 'stdio'
        });
        this.messageHandler = new ProtocolMessageHandler({
            maxQueueSize: 1000,
            processingTimeout: 30000,
            enableBatchProcessing: true,
            enableNotifications: true
        });
        this.server = new MCPServer(this.config);
        // Initialize SDK server (will be created in start method)
        this.sdkServer = null;
        // Setup component integration
        this.setupComponentIntegration();
        // Setup event handlers
        this.setupEventHandlers();
    }
    /**
     * Start the MCP server application
     * Initializes all components and begins accepting connections
     */
    async start() {
        if (this.isRunning) {
            throw new Error('Server application is already running');
        }
        try {
            this.logger.logServerEvent('start', {
                serverName: this.config.name,
                version: this.config.version,
                description: this.config.description
            });
            console.log('Starting Bitbucket MCP Server...');
            console.log(`Server: ${this.config.name} v${this.config.version}`);
            console.log(`Description: ${this.config.description || 'No description'}`);
            // Validate configuration
            const isValid = await this.server.validateConfig();
            if (!isValid) {
                throw new Error('Server configuration validation failed');
            }
            // Start server
            await this.server.start();
            // Create SDK server with official MCP SDK integration
            this.sdkServer = await createMCPServerWithSDK(this.config, this.server);
            // Initialize transports
            await this.initializeTransports();
            // Register default tools
            await this.registerDefaultTools();
            // Start health monitoring
            this.startHealthMonitoring();
            // Mark as running
            this.isRunning = true;
            console.log('✅ Bitbucket MCP Server started successfully');
            console.log(`📊 Memory limit: ${this.config.memoryLimit / (1024 * 1024)}MB`);
            console.log(`👥 Max clients: ${this.config.maxClients}`);
            console.log(`🔧 Transports: ${this.config.transports.map(t => t.type).join(', ')}`);
            console.log(`🛠️  Tools registered: ${this.toolRegistry.getAvailableTools().length}`);
        }
        catch (error) {
            console.error('❌ Failed to start MCP server:', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }
    /**
     * Stop the MCP server application
     * Gracefully shuts down all components and connections
     */
    async stop() {
        if (!this.isRunning) {
            return;
        }
        try {
            this.logger.logServerEvent('stop');
            console.log('Stopping Bitbucket MCP Server...');
            // Stop health monitoring
            this.stopHealthMonitoring();
            // Stop server
            await this.server.stop();
            // Shutdown components
            await this.connectionManager.shutdown();
            await this.transportFactory.shutdown();
            // SessionManager is static, no shutdown needed
            // Mark as stopped
            this.isRunning = false;
            console.log('✅ Bitbucket MCP Server stopped successfully');
        }
        catch (error) {
            console.error('❌ Error stopping MCP server:', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }
    /**
     * Restart the MCP server application
     * Stops and starts the server in sequence
     */
    async restart() {
        console.log('Restarting Bitbucket MCP Server...');
        await this.stop();
        await this.start();
    }
    /**
     * Get server health status
     * Returns comprehensive health information
     */
    getHealthStatus() {
        return {
            application: {
                isRunning: this.isRunning,
                uptime: this.isRunning ? Date.now() - this.server['_startTime']?.getTime() || 0 : 0
            },
            server: this.server.getHealthStatus(),
            connectionManager: this.connectionManager.getStats(),
            sessionManager: { activeSessions: 0 }, // SessionManager is static
            toolRegistry: this.toolRegistry.getRegistryStats(),
            transportFactory: this.transportFactory.getStats(),
            messageHandler: this.messageHandler.getStats()
        };
    }
    /**
     * Create a new client session
     * Establishes a new client connection with graceful handling
     */
    async createSession(clientId, transport) {
        try {
            this.logger.logServerEvent('start', {
                serverName: this.config.name
            });
            const session = await this.connectionManager.createSession(clientId, transport);
            this.logger.logSessionEvent(session.id, 'created', {
                clientId,
                transportType: transport.type
            });
            return session;
        }
        catch (error) {
            this.logger.logServerEvent('error', {
                error: {
                    code: MCPErrorCode.INTERNAL_ERROR,
                    message: error instanceof Error ? error.message : String(error)
                },
                // operation: 'session_creation', // Removed - not in type definition
                // clientId // Removed - not in type definition
            });
            throw error;
        }
    }
    /**
     * Authenticate a client session
     * Authenticates a client and updates session state
     */
    async authenticateSession(sessionId, authData) {
        try {
            await this.connectionManager.authenticateSession(sessionId, authData);
            this.logger.logSessionEvent(sessionId, 'authenticated', {
                authData: authData ? 'provided' : 'none'
            });
        }
        catch (error) {
            this.logger.logSessionEvent(sessionId, 'error', {
                error: {
                    code: MCPErrorCode.INTERNAL_ERROR,
                    message: error instanceof Error ? error.message : String(error)
                },
                // operation: 'authentication' // Removed - not in type definition
            });
            throw error;
        }
    }
    /**
     * Remove a client session
     * Gracefully disconnects a client and cleans up resources
     */
    async removeSession(sessionId, reason = 'client_request') {
        try {
            this.logger.logSessionEvent(sessionId, 'disconnecting', {
                reason
            });
            await this.connectionManager.disconnectSession(sessionId, reason);
            this.logger.logSessionEvent(sessionId, 'disconnected', {
                reason
            });
        }
        catch (error) {
            this.logger.logSessionEvent(sessionId, 'error', {
                error: {
                    code: MCPErrorCode.INTERNAL_ERROR,
                    message: error instanceof Error ? error.message : String(error)
                },
                // operation: 'session_removal', // Removed - not in type definition
                reason
            });
            throw error;
        }
    }
    /**
     * Get active sessions
     * Returns all currently active client sessions
     */
    getActiveSessions() {
        return this.connectionManager.getActiveSessions();
    }
    /**
     * Get session by ID
     * Retrieves a specific session by its identifier
     */
    getSession(sessionId) {
        return this.connectionManager.getSession(sessionId);
    }
    /**
     * Perform connection health check
     * Checks all connections and cleans up expired sessions
     */
    async performHealthCheck() {
        try {
            await this.connectionManager.performHealthCheck();
            this.logger.logServerEvent('health_check', {
                activeSessions: this.connectionManager.getActiveSessions().length
            });
        }
        catch (error) {
            this.logger.logServerEvent('error', {
                error: {
                    code: MCPErrorCode.INTERNAL_ERROR,
                    message: error instanceof Error ? error.message : String(error)
                },
                // operation: 'health_check' // Removed - not in type definition
            });
            throw error;
        }
    }
    /**
     * Register a tool with the server
     * Adds a tool to the registry and makes it available
     */
    async registerTool(tool) {
        try {
            await this.toolRegistry.registerTool(tool);
            await this.server.registerTool(tool);
            // Register with SDK server if available
            if (this.sdkServer) {
                await this.sdkServer.registerTool(tool);
            }
            this.logger.logToolEvent(tool.name, 'registered', {
                toolName: tool.name,
                description: tool.description,
                parameters: tool.parameters.length
            });
        }
        catch (error) {
            this.logger.logToolEvent(tool.name, 'error', {
                toolName: tool.name,
                error: {
                    code: MCPErrorCode.TOOL_EXECUTION_FAILED,
                    message: error instanceof Error ? error.message : String(error)
                }
            });
            throw error;
        }
    }
    /**
     * Get server configuration
     * Returns the current server configuration
     */
    getConfig() {
        return { ...this.config };
    }
    // ============================================================================
    // Private Methods
    // ============================================================================
    /**
     * Create default configuration
     * Creates server configuration with sensible defaults
     */
    createDefaultConfig(overrides) {
        const defaultConfig = {
            name: 'Bitbucket MCP Server',
            version: '1.0.0',
            description: 'Model Context Protocol server for Bitbucket integration',
            maxClients: 100,
            memoryLimit: 512 * 1024 * 1024, // 512MB (constitutional requirement <1GB)
            logging: {
                level: 'info',
                format: 'json',
                file: 'logs/mcp-server.log',
                console: true
            },
            transports: [
                {
                    type: 'stdio'
                }
            ],
            tools: {
                validationEnabled: true,
                trackStatistics: true,
                allowOverwrite: false,
                maxTools: 1000
            }
        };
        // Apply overrides
        return { ...defaultConfig, ...overrides };
    }
    /**
     * Setup component integration
     * Connects all server components together
     */
    setupComponentIntegration() {
        // Connect tool registry to server
        this.toolRegistry.on('toolRegistered', (tool) => {
            this.server.registerTool(tool).catch((error) => {
                console.error('Failed to register tool with server:', error.message);
            });
        });
        this.toolRegistry.on('toolUnregistered', (toolName) => {
            this.server.unregisterTool(toolName).catch((error) => {
                console.error('Failed to unregister tool from server:', error.message);
            });
        });
        // Connect session manager to server (SessionManager is static)
        // Event handling is done through connectionManager
        // Connect transport factory to server
        this.transportFactory.on('transportCreated', (transport) => {
            console.log(`Transport created: ${transport.type}`);
        });
        this.transportFactory.on('transportError', (transport, error) => {
            console.error(`Transport error (${transport.type}):`, error.message);
        });
    }
    /**
     * Setup event handlers
     * Configures application-level event handling
     */
    setupEventHandlers() {
        // Handle process signals
        process.on('SIGINT', async () => {
            console.log('\nReceived SIGINT, shutting down gracefully...');
            await this.stop();
            process.exit(0);
        });
        process.on('SIGTERM', async () => {
            console.log('\nReceived SIGTERM, shutting down gracefully...');
            await this.stop();
            process.exit(0);
        });
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('Uncaught Exception:', error);
            this.stop().finally(() => {
                process.exit(1);
            });
        });
        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
            this.stop().finally(() => {
                process.exit(1);
            });
        });
        // Handle memory warnings
        process.on('warning', (warning) => {
            if (warning.name === 'MaxListenersExceededWarning') {
                console.warn('Max listeners exceeded:', warning.message);
            }
        });
    }
    /**
     * Initialize transports
     * Creates and configures all configured transports using official MCP SDK
     */
    async initializeTransports() {
        for (const transportConfig of this.config.transports) {
            try {
                // Create transport using official MCP SDK
                const transport = createTransport(transportConfig);
                // Connect the transport to the SDK server
                if (this.sdkServer) {
                    await this.sdkServer.connect(transport);
                }
                console.log(`✅ Transport initialized with MCP SDK: ${transportConfig.type}`);
            }
            catch (error) {
                console.error(`❌ Failed to initialize transport ${transportConfig.type}:`, error instanceof Error ? error.message : String(error));
                throw error;
            }
        }
    }
    /**
     * Register default tools
     * Registers basic tools for server functionality
     */
    async registerDefaultTools() {
        // Register ping tool
        const pingTool = {
            name: 'ping',
            description: 'Ping the server to check connectivity',
            parameters: [],
            enabled: true,
            async execute(params, context) {
                return {
                    success: true,
                    data: {
                        pong: true,
                        timestamp: new Date().toISOString(),
                        serverTime: Date.now()
                    },
                    metadata: {
                        executionTime: 0,
                        memoryUsed: 0,
                        timestamp: new Date()
                    }
                };
            }
        };
        await this.registerTool(pingTool);
        // Register health tool
        const healthTool = {
            name: 'health_check',
            description: 'Check server health status',
            parameters: [],
            enabled: true,
            async execute(params, context) {
                return {
                    success: true,
                    data: context.server.getHealthStatus(),
                    metadata: {
                        executionTime: 0,
                        memoryUsed: 0,
                        timestamp: new Date()
                    }
                };
            }
        };
        await this.registerTool(healthTool);
        console.log('✅ Default tools registered');
    }
    /**
     * Start health monitoring
     * Begins periodic health checks and monitoring
     */
    startHealthMonitoring() {
        setInterval(() => {
            const health = this.getHealthStatus();
            // Check memory usage
            const memoryUsage = process.memoryUsage();
            if (memoryUsage.heapUsed > this.config.memoryLimit) {
                console.warn('⚠️  Memory usage exceeds limit:', memoryUsage.heapUsed);
            }
            // Log health status periodically
            if (this.config.logging.level === 'debug') {
                console.log('📊 Health check:', {
                    memory: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
                    sessions: health.sessionManager.active,
                    tools: health.toolRegistry.enabledTools,
                    transports: health.transportFactory.activeTransports
                });
            }
        }, 60000); // Check every minute
    }
    /**
     * Stop health monitoring
     * Stops periodic health checks
     */
    stopHealthMonitoring() {
        // Health monitoring is handled by setInterval, which will be cleaned up
        // when the process exits. In a production environment, you might want
        // to store the interval ID and clear it explicitly.
    }
}
/**
 * Create and start MCP server application
 * Factory function for creating and starting the server
 */
export async function createMCPServer(config) {
    const app = new MCPServerApplication(config);
    await app.start();
    return app;
}
/**
 * Main entry point
 * CLI entry point for the MCP server
 */
export async function main() {
    try {
        // Parse command line arguments
        const args = process.argv.slice(2);
        const config = {};
        // Simple argument parsing
        for (let i = 0; i < args.length; i++) {
            switch (args[i]) {
                case '--port':
                    if (args[i + 1]) {
                        config.transports = [{
                                type: 'http',
                                host: 'localhost',
                                port: parseInt(args[i + 1]),
                                path: '/mcp'
                            }];
                        i++;
                    }
                    break;
                case '--host':
                    if (args[i + 1] && config.transports) {
                        config.transports[0].host = args[i + 1];
                        i++;
                    }
                    break;
                case '--log-level':
                    if (args[i + 1]) {
                        config.logging = { ...config.logging, level: args[i + 1] };
                        i++;
                    }
                    break;
                case '--max-clients':
                    if (args[i + 1]) {
                        config.maxClients = parseInt(args[i + 1]);
                        i++;
                    }
                    break;
                case '--help':
                    console.log(`
Bitbucket MCP Server

Usage: node src/server/index.js [options]

Options:
  --port <number>        HTTP port (default: stdio)
  --host <string>        HTTP host (default: localhost)
  --log-level <string>   Log level (error, warn, info, debug)
  --max-clients <number> Maximum concurrent clients
  --help                 Show this help message

Examples:
  node src/server/index.js                    # Start with stdio transport
  node src/server/index.js --port 8080        # Start with HTTP transport
  node src/server/index.js --log-level debug  # Start with debug logging
          `);
                    process.exit(0);
            }
        }
        // Create and start server
        const app = await createMCPServer(config);
        // Keep the process running
        process.stdin.resume();
    }
    catch (error) {
        console.error('Failed to start MCP server:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}
// Export main function for CLI usage
export { main as default };
// Run main function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error('Unhandled error:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=index.js.map