/**
 * MCP Server Core Implementation
 * 
 * Core MCP server implementation providing the main server functionality
 * for the Bitbucket MCP Server with constitutional requirements compliance.
 * 
 * Key Features:
 * - MCP protocol compliance
 * - Tool registration and management
 * - Configuration validation
 * - Health monitoring
 * - Graceful startup/shutdown
 * 
 * Constitutional Requirements:
 * - MCP Protocol First
 * - Multi-Transport Protocol
 * - Selective Tool Registration
 * - Complete API Coverage
 * - Test-First Development
 */

import { MCPServer as IMCPServer, ServerConfig, Tool, ToolExecutionContext, ToolResult } from '../types/index.js';

/**
 * MCP Server Implementation
 * Core server functionality for MCP protocol
 */
export class MCPServer implements IMCPServer {
    /** Server identifier */
    public readonly id: string;

    /** Server name */
    public readonly name: string;

    /** Server version */
    public readonly version: string;

    /** Whether server is running */
    private _isRunning: boolean = false;

    /** Server configuration */
    private config: ServerConfig;

    /** Registered tools */
    private tools: Map<string, Tool> = new Map();

    /** Start time for uptime tracking */
    private _startTime?: Date;

    constructor(config: ServerConfig) {
        this.config = config;
        this.id = `mcp-server-${Date.now()}`;
        this.name = config.name;
        this.version = config.version;
    }

    /** Whether server is running */
    get isRunning(): boolean {
        return this._isRunning;
    }

    /**
     * Start the server
     */
    async start(): Promise<void> {
        if (this._isRunning) {
            throw new Error('Server is already running');
        }

        try {
            this._startTime = new Date();
            this._isRunning = true;

            // Initialize server components
            await this.initializeComponents();

            console.log(`MCP Server ${this.name} v${this.version} started`);
        } catch (error) {
            this._isRunning = false;
            throw error;
        }
    }

    /**
     * Stop the server
     */
    async stop(): Promise<void> {
        if (!this._isRunning) {
            return;
        }

        try {
            // Cleanup server components
            await this.cleanup();

            this._isRunning = false;
            this._startTime = undefined;

            console.log(`MCP Server ${this.name} stopped`);
        } catch (error) {
            console.error('Error stopping server:', error);
            throw error;
        }
    }

    /**
     * Execute a tool
     */
    async executeTool(request: {
        name: string;
        arguments: Record<string, any>;
        context: ToolExecutionContext;
    }): Promise<ToolResult> {
        const tool = this.tools.get(request.name);
        if (!tool) {
            return {
                success: false,
                error: {
                    code: 'TOOL_NOT_FOUND' as any,
                    message: `Tool '${request.name}' not found`
                },
                metadata: {
                    executionTime: 0,
                    memoryUsed: 0,
                    timestamp: new Date()
                }
            };
        }

        const startTime = Date.now();
        const startMemory = process.memoryUsage();

        try {
            const result = await tool.execute(request.arguments, request.context);

            const endTime = Date.now();
            const endMemory = process.memoryUsage();

            return {
                ...result,
                metadata: {
                    executionTime: endTime - startTime,
                    memoryUsed: endMemory.heapUsed - startMemory.heapUsed,
                    timestamp: new Date()
                }
            };
        } catch (error) {
            const endTime = Date.now();

            return {
                success: false,
                error: {
                    code: 'TOOL_EXECUTION_FAILED' as any,
                    message: error instanceof Error ? error.message : String(error)
                },
                metadata: {
                    executionTime: endTime - startTime,
                    memoryUsed: 0,
                    timestamp: new Date()
                }
            };
        }
    }

    /**
     * Get server capabilities
     */
    getCapabilities() {
        return {
            protocolVersion: '1.0.0',
            tools: Array.from(this.tools.keys()),
            authentication: {
                required: this.config.authentication?.required || false,
                methods: this.config.authentication?.methods || []
            },
            features: ['tool-execution', 'health-monitoring', 'multi-transport']
        };
    }

    /**
     * Validate server configuration
     */
    async validateConfig(): Promise<boolean> {
        try {
            // Validate required fields
            if (!this.config.name || !this.config.version) {
                return false;
            }

            // Validate memory limit
            if (this.config.memoryLimit <= 0) {
                return false;
            }

            // Validate max clients
            if (this.config.maxClients <= 0) {
                return false;
            }

            // Validate transports
            if (!this.config.transports || this.config.transports.length === 0) {
                return false;
            }

            return true;
        } catch (error) {
            console.error('Configuration validation failed:', error);
            return false;
        }
    }

    /**
     * Register a tool
     */
    async registerTool(tool: Tool): Promise<void> {
        if (this.tools.has(tool.name)) {
            throw new Error(`Tool '${tool.name}' is already registered`);
        }

        this.tools.set(tool.name, tool);
    }

    /**
     * Unregister a tool
     */
    async unregisterTool(toolName: string): Promise<void> {
        if (!this.tools.has(toolName)) {
            throw new Error(`Tool '${toolName}' is not registered`);
        }

        this.tools.delete(toolName);
    }

    /**
     * Get health status
     */
    getHealthStatus(): any {
        const uptime = this._startTime ? Date.now() - this._startTime.getTime() : 0;
        const memoryUsage = process.memoryUsage();

        return {
            isRunning: this._isRunning,
            uptime,
            memoryUsage,
            registeredTools: this.tools.size,
            serverInfo: {
                id: this.id,
                name: this.name,
                version: this.version
            }
        };
    }

    /**
     * Get registered tools
     */
    getRegisteredTools(): Tool[] {
        return Array.from(this.tools.values());
    }

    /**
     * Initialize server components
     */
    private async initializeComponents(): Promise<void> {
        // Initialize any required components
        // This could include database connections, cache initialization, etc.
        console.log('Initializing server components...');
    }

    /**
     * Cleanup server resources
     */
    private async cleanup(): Promise<void> {
        // Cleanup resources
        this.tools.clear();
        console.log('Server cleanup completed');
    }
}

export default MCPServer;