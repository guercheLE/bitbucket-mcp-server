/**
 * MCP Server Implementation
 * 
<<<<<<< HEAD
 * Main server entity implementing MCP (Model Context Protocol) compliance.
 * This class provides the core server functionality with full protocol support,
 * multi-transport capabilities, and constitutional requirements compliance.
 * 
 * Key Features:
 * - Full MCP protocol compliance (JSON-RPC 2.0)
 * - Multi-transport support (stdio, HTTP, SSE)
 * - Client session management
 * - Tool registration and execution
 * - Memory efficiency (<1GB limit)
 * - Error handling and logging
 * - Health monitoring and statistics
 * 
 * Constitutional Requirements:
 * - MCP Protocol First
 * - Multi-Transport Protocol
 * - Selective Tool Registration
 * - Complete API Coverage
 * - Test-First Development
=======
 * This module implements the main MCPServer class that manages the Model Context Protocol
 * server infrastructure. It handles client connections, session management, tool execution,
 * and protocol compliance.
 * 
 * Key Features:
 * - Multi-client session management with graceful connection/disconnection
 * - Tool registration and execution system
 * - Multi-transport support (stdio, HTTP, SSE)
 * - Memory usage monitoring and limits
 * - Event-driven architecture with comprehensive logging
 * - Automatic session cleanup and timeout handling
 * 
 * Constitutional Requirements:
 * - Full MCP protocol compliance (JSON-RPC 2.0)
 * - Memory efficiency (<1GB total server limit)
 * - Support for 200+ Bitbucket API endpoints as tools
 * - Graceful error handling and recovery
 * - Thread-safe operations for concurrent access
>>>>>>> main
 */

import { EventEmitter } from 'events';
import { 
<<<<<<< HEAD
  MCPServer, 
  ServerConfig, 
  ServerStats, 
  HealthStatus,
  ClientSession,
  Tool,
  Transport,
  TransportType,
  ProtocolMessage,
  MCPErrorCode,
  ApiResponse,
  ServerEvents
} from '../types/index.js';

/**
 * MCP Server Implementation
 * 
 * Core server class implementing the MCP protocol with full compliance
 * and constitutional requirements support.
 */
export class MCPServerImpl extends EventEmitter implements MCPServer {
  // Server configuration and state
  public readonly config: ServerConfig;
  public readonly stats: ServerStats;
  public readonly isRunning: boolean = false;
  
  // Core collections
  public readonly tools: Map<string, Tool> = new Map();
  public readonly sessions: Map<string, ClientSession> = new Map();
  public readonly transports: Map<TransportType, Transport> = new Map();
  
  // Internal state
  private _isRunning: boolean = false;
  private _startTime: Date | null = null;
  private _requestCount: number = 0;
  private _errorCount: number = 0;
  private _totalProcessingTime: number = 0;
  private _memoryCheckInterval: NodeJS.Timeout | null = null;
  private _sessionCleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: ServerConfig) {
    super();
    this.config = config;
    this.stats = this.initializeStats();
    
    // Validate configuration
    this.validateConfig();
    
    // Setup event handlers
    this.setupEventHandlers();
  }

  /**
   * Start the MCP server
   * Initializes all transports and begins accepting client connections
=======
  MCPServer as IMCPServer,
  ServerConfig,
  ServerStats,
  ClientSession,
  ClientSessionState,
  Tool,
  ToolResult,
  Transport,
  TransportType,
  HealthStatus,
  MCPErrorCode,
  ProtocolMessage,
  ServerEvents
} from '../types/index.js';
import { ClientSession as ClientSessionImpl, SessionManager } from './client-session.js';

/**
 * MCP Server Implementation
 * Main server entity implementing MCP protocol compliance
 */
export class MCPServer extends EventEmitter implements IMCPServer {
  private _config: ServerConfig;
  private _isRunning: boolean = false;
  private _startTime: Date | null = null;
  private _sessions: Map<string, ClientSession> = new Map();
  private _tools: Map<string, Tool> = new Map();
  private _transports: Map<TransportType, Transport> = new Map();
  private _cleanupInterval: NodeJS.Timeout | null = null;
  private _stats: {
    totalRequests: number;
    totalToolsExecuted: number;
    totalErrors: number;
    totalResponseTime: number;
  };

  constructor(config: ServerConfig) {
    super();
    
    this._config = { ...config };
    this._stats = {
      totalRequests: 0,
      totalToolsExecuted: 0,
      totalErrors: 0,
      totalResponseTime: 0
    };

    // Set up event handlers
    this._setupEventHandlers();
  }

  // ============================================================================
  // Public Interface Implementation
  // ============================================================================

  get config(): ServerConfig {
    return { ...this._config };
  }

  get isRunning(): boolean {
    return this._isRunning;
  }

  get tools(): Map<string, Tool> {
    return new Map(this._tools);
  }

  get sessions(): Map<string, ClientSession> {
    return new Map(this._sessions);
  }

  get transports(): Map<TransportType, Transport> {
    return new Map(this._transports);
  }

  get stats(): ServerStats {
    const now = new Date();
    const uptime = this._startTime ? now.getTime() - this._startTime.getTime() : 0;
    const activeSessions = Array.from(this._sessions.values()).filter(s => s.isActive()).length;
    const averageResponseTime = this._stats.totalRequests > 0 
      ? this._stats.totalResponseTime / this._stats.totalRequests 
      : 0;
    const errorRate = this._stats.totalRequests > 0 
      ? this._stats.totalErrors / this._stats.totalRequests 
      : 0;

    return {
      uptime,
      activeSessions,
      totalRequests: this._stats.totalRequests,
      totalToolsExecuted: this._stats.totalToolsExecuted,
      memoryUsage: this._getCurrentMemoryUsage(),
      averageResponseTime,
      errorRate,
      transportStats: this._getTransportStats()
    };
  }

  // ============================================================================
  // Server Lifecycle Management
  // ============================================================================

  /**
   * Start the MCP server
>>>>>>> main
   */
  async start(): Promise<void> {
    if (this._isRunning) {
      throw new Error('Server is already running');
    }

    try {
<<<<<<< HEAD
      console.log(`Starting MCP Server: ${this.config.name} v${this.config.version}`);
      
      // Initialize transports
      await this.initializeTransports();
      
      // Start memory monitoring
      this.startMemoryMonitoring();
      
      // Start session cleanup
      this.startSessionCleanup();
      
      // Mark server as running
      this._isRunning = true;
      this._startTime = new Date();
      
      // Emit server started event
      this.emit('server:started', this);
      
      console.log('MCP Server started successfully');
      
    } catch (error) {
      this.emit('server:error', error, this);
      throw new Error(`Failed to start MCP server: ${error.message}`);
=======
      // Validate configuration
      await this.validateConfig();

      // Initialize transports
      await this._initializeTransports();

      // Start cleanup monitoring
      this._startCleanupMonitoring();

      this._isRunning = true;
      this._startTime = new Date();
      
      this.emit('server:started', this);
      this._log('info', 'MCP Server started successfully');
    } catch (error) {
      this.emit('server:error', error, this);
      this._log('error', 'Failed to start MCP server', error);
      throw error;
>>>>>>> main
    }
  }

  /**
   * Stop the MCP server
<<<<<<< HEAD
   * Gracefully shuts down all connections and cleans up resources
   */
  async stop(): Promise<void> {
    if (!this._isRunning) {
      throw new Error('Server is not running');
    }

    try {
      console.log('Stopping MCP Server...');
      
      // Stop memory monitoring
      this.stopMemoryMonitoring();
      
      // Stop session cleanup
      this.stopSessionCleanup();
      
      // Disconnect all client sessions
      await this.disconnectAllSessions();
      
      // Stop all transports
      await this.stopTransports();
      
      // Clear collections
      this.tools.clear();
      this.sessions.clear();
      this.transports.clear();
      
      // Mark server as stopped
      this._isRunning = false;
      this._startTime = null;
      
      // Emit server stopped event
      this.emit('server:stopped', this);
      
      console.log('MCP Server stopped successfully');
      
    } catch (error) {
      this.emit('server:error', error, this);
      throw new Error(`Failed to stop MCP server: ${error.message}`);
=======
   */
  async stop(): Promise<void> {
    if (!this._isRunning) {
      return;
    }

    try {
      this._log('info', 'Stopping MCP server...');

      // Stop cleanup monitoring
      this._stopCleanupMonitoring();

      // Disconnect all client sessions
      await this._disconnectAllSessions();

      // Stop all transports
      await this._stopTransports();

      this._isRunning = false;
      this._startTime = null;
      
      this.emit('server:stopped', this);
      this._log('info', 'MCP Server stopped successfully');
    } catch (error) {
      this.emit('server:error', error, this);
      this._log('error', 'Error stopping MCP server', error);
      throw error;
>>>>>>> main
    }
  }

  /**
   * Restart the MCP server
<<<<<<< HEAD
   * Stops and starts the server in sequence
   */
  async restart(): Promise<void> {
    console.log('Restarting MCP Server...');
=======
   */
  async restart(): Promise<void> {
    this._log('info', 'Restarting MCP server...');
>>>>>>> main
    await this.stop();
    await this.start();
  }

<<<<<<< HEAD
  /**
   * Register a tool with the server
   * Validates tool compliance and adds to registry
   */
  async registerTool(tool: Tool): Promise<void> {
    try {
      // Validate tool name (snake_case, no prefixes)
      this.validateToolName(tool.name);
      
      // Check if tool already exists
      if (this.tools.has(tool.name)) {
        throw new Error(`Tool '${tool.name}' is already registered`);
      }
      
      // Validate tool structure
      this.validateTool(tool);
      
      // Register the tool
      this.tools.set(tool.name, tool);
      
      // Emit tool registered event
      this.emit('tool:registered', tool);
      
      console.log(`Tool registered: ${tool.name}`);
      
    } catch (error) {
      this.emit('tool:error', tool.name, error, null);
      throw new Error(`Failed to register tool '${tool.name}': ${error.message}`);
=======
  // ============================================================================
  // Client Session Management
  // ============================================================================

  /**
   * Create a new client session
   */
  async createSession(clientId: string, transport: Transport): Promise<ClientSession> {
    if (!this._isRunning) {
      throw new Error('Server is not running');
    }

    // Check client limit
    if (this._sessions.size >= this._config.maxClients) {
      throw new Error(`Maximum client connections exceeded (${this._config.maxClients})`);
    }

    // Check if client already has an active session
    const existingSession = Array.from(this._sessions.values())
      .find(session => session.clientId === clientId && session.isActive());
    
    if (existingSession) {
      throw new Error(`Client ${clientId} already has an active session`);
    }

    try {
      // Create new session
      const session = SessionManager.createSession(clientId, transport, {
        timeout: this._config.clientTimeout,
        metadata: {
          serverVersion: this._config.version,
          connectedAt: new Date().toISOString()
        }
      });

      // Set up session event handlers
      this._setupSessionEventHandlers(session);

      // Add to sessions map
      this._sessions.set(session.id, session);

      // Connect the session
      await session.connect();

      this.emit('session:created', session);
      this._log('info', `Client session created: ${session.getSummary()}`);

      return session;
    } catch (error) {
      this.emit('session:error', error, null);
      this._log('error', `Failed to create session for client ${clientId}`, error);
      throw error;
    }
  }

  /**
   * Remove a client session
   */
  async removeSession(sessionId: string): Promise<void> {
    const session = this._sessions.get(sessionId);
    if (!session) {
      return; // Session not found
    }

    try {
      // Disconnect the session
      await session.disconnect('Session removed by server');

      // Remove from sessions map
      this._sessions.delete(sessionId);

      // Clean up session resources
      await session.destroy();

      this.emit('session:removed', sessionId);
      this._log('info', `Client session removed: ${sessionId}`);
    } catch (error) {
      this.emit('session:error', error, session);
      this._log('error', `Error removing session ${sessionId}`, error);
      throw error;
    }
  }

  /**
   * Get active sessions count
   */
  getActiveSessionsCount(): number {
    return Array.from(this._sessions.values()).filter(session => session.isActive()).length;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): ClientSession | undefined {
    return this._sessions.get(sessionId);
  }

  /**
   * Get session by client ID
   */
  getSessionByClientId(clientId: string): ClientSession | undefined {
    return Array.from(this._sessions.values())
      .find(session => session.clientId === clientId && session.isActive());
  }

  // ============================================================================
  // Tool Management
  // ============================================================================

  /**
   * Register a tool
   */
  async registerTool(tool: Tool): Promise<void> {
    if (this._tools.has(tool.name)) {
      throw new Error(`Tool ${tool.name} is already registered`);
    }

    // Validate tool name (snake_case, no prefixes)
    if (!this._validateToolName(tool.name)) {
      throw new Error(`Invalid tool name: ${tool.name}. Must be snake_case with no prefixes`);
    }

    this._tools.set(tool.name, tool);
    this.emit('tool:registered', tool);
    this._log('info', `Tool registered: ${tool.name}`);

    // Add tool to all active sessions
    for (const session of this._sessions.values()) {
      if (session.isActive()) {
        session.addTool(tool.name);
      }
>>>>>>> main
    }
  }

  /**
<<<<<<< HEAD
   * Unregister a tool from the server
   * Removes tool from registry and cleans up resources
   */
  async unregisterTool(toolName: string): Promise<void> {
    try {
      if (!this.tools.has(toolName)) {
        throw new Error(`Tool '${toolName}' is not registered`);
      }
      
      // Remove the tool
      this.tools.delete(toolName);
      
      // Emit tool unregistered event
      this.emit('tool:unregistered', toolName);
      
      console.log(`Tool unregistered: ${toolName}`);
      
    } catch (error) {
      this.emit('tool:error', toolName, error, null);
      throw new Error(`Failed to unregister tool '${toolName}': ${error.message}`);
=======
   * Unregister a tool
   */
  async unregisterTool(toolName: string): Promise<void> {
    if (!this._tools.has(toolName)) {
      return; // Tool not found
    }

    this._tools.delete(toolName);
    this.emit('tool:unregistered', toolName);
    this._log('info', `Tool unregistered: ${toolName}`);

    // Remove tool from all active sessions
    for (const session of this._sessions.values()) {
      if (session.isActive()) {
        session.removeTool(toolName);
      }
>>>>>>> main
    }
  }

  /**
<<<<<<< HEAD
   * Get all available tools
   * Returns array of registered tools
   */
  getAvailableTools(): Tool[] {
    return Array.from(this.tools.values()).filter(tool => tool.enabled);
  }

  /**
   * Execute a tool with given parameters
   * Handles tool execution with proper error handling and logging
   */
  async executeTool(toolName: string, params: Record<string, any>, sessionId: string): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Get the tool
      const tool = this.tools.get(toolName);
      if (!tool) {
        throw new Error(`Tool '${toolName}' not found`);
      }
      
      if (!tool.enabled) {
        throw new Error(`Tool '${toolName}' is disabled`);
      }
      
      // Get the session
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Session '${sessionId}' not found`);
      }
      
      // Validate parameters if validator exists
      if (tool.validate) {
        const isValid = await tool.validate(params);
        if (!isValid) {
          throw new Error(`Invalid parameters for tool '${toolName}'`);
        }
      }
      
      // Create execution context
      const context = {
        session,
        server: this,
        request: {
          id: `req_${Date.now()}`,
=======
   * Get available tools
   */
  getAvailableTools(): Tool[] {
    return Array.from(this._tools.values()).filter(tool => tool.enabled);
  }

  /**
   * Execute a tool
   */
  async executeTool(toolName: string, params: Record<string, any>, sessionId: string): Promise<ToolResult> {
    const startTime = Date.now();
    
    try {
      // Get session
      const session = this._sessions.get(sessionId);
      if (!session || !session.isActive()) {
        throw new Error(`Invalid or inactive session: ${sessionId}`);
      }

      // Get tool
      const tool = this._tools.get(toolName);
      if (!tool || !tool.enabled) {
        throw new Error(`Tool not found or disabled: ${toolName}`);
      }

      // Check if tool is available for this session
      if (!session.hasTool(toolName)) {
        throw new Error(`Tool ${toolName} not available for session ${sessionId}`);
      }

      // Update statistics
      this._stats.totalRequests++;
      session.recordRequest(0); // Will be updated after execution

      // Execute tool
      const result = await tool.execute(params, {
        session,
        server: this,
        request: {
          id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
>>>>>>> main
          timestamp: new Date(),
          transport: session.transport.type
        },
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          memoryUsage: process.memoryUsage()
        }
<<<<<<< HEAD
      };
      
      // Execute the tool
      const result = await tool.execute(params, context);
      
      // Update statistics
      this.updateExecutionStats(startTime);
      
      // Emit tool executed event
      this.emit('tool:executed', toolName, result, session);
      
      return result;
      
    } catch (error) {
      this._errorCount++;
      this.emit('tool:error', toolName, error, this.sessions.get(sessionId));
      throw error;
    }
  }

  /**
   * Create a new client session
   * Establishes client connection and session management
   */
  async createSession(clientId: string, transport: Transport): Promise<ClientSession> {
    try {
      // Check client limit
      if (this.sessions.size >= this.config.maxClients) {
        throw new Error('Maximum client connections exceeded');
      }
      
      // Create session ID
      const sessionId = `session_${clientId}_${Date.now()}`;
      
      // Create session object (simplified for now)
      const session: ClientSession = {
        id: sessionId,
        clientId,
        state: 'connected' as any,
        transport,
        createdAt: new Date(),
        lastActivity: new Date(),
        metadata: {},
        availableTools: new Set(this.getAvailableTools().map(t => t.name)),
        timeout: this.config.clientTimeout,
        
        updateActivity() {
          this.lastActivity = new Date();
        },
        
        isActive() {
          return Date.now() - this.lastActivity.getTime() < this.timeout;
        },
        
        isExpired() {
          return Date.now() - this.lastActivity.getTime() >= this.timeout;
        },
        
        getStats() {
          return {
            duration: Date.now() - this.createdAt.getTime(),
            requestsProcessed: 0,
            toolsCalled: 0,
            averageProcessingTime: 0,
            memoryUsage: 0,
            lastRequest: this.lastActivity
          };
        }
      };
      
      // Register the session
      this.sessions.set(sessionId, session);
      
      // Emit session created event
      this.emit('session:created', session);
      
      console.log(`Client session created: ${sessionId}`);
      
      return session;
      
    } catch (error) {
      this.emit('session:error', error, null);
      throw new Error(`Failed to create session for client '${clientId}': ${error.message}`);
    }
  }

  /**
   * Remove a client session
   * Cleans up session resources and connections
   */
  async removeSession(sessionId: string): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Session '${sessionId}' not found`);
      }
      
      // Disconnect transport if needed
      if (session.transport.isConnected) {
        await session.transport.disconnect();
      }
      
      // Remove the session
      this.sessions.delete(sessionId);
      
      // Emit session removed event
      this.emit('session:removed', sessionId);
      
      console.log(`Client session removed: ${sessionId}`);
      
    } catch (error) {
      this.emit('session:error', error, this.sessions.get(sessionId));
      throw new Error(`Failed to remove session '${sessionId}': ${error.message}`);
    }
  }

  /**
   * Get server health status
   * Returns comprehensive health information
   */
  getHealthStatus(): HealthStatus {
    const memoryUsage = process.memoryUsage();
    const isMemoryHealthy = memoryUsage.heapUsed < this.config.memoryLimit;
    
    const issues: string[] = [];
    if (!isMemoryHealthy) {
      issues.push('Memory usage exceeds limit');
    }
    
    if (this._errorCount > this._requestCount * 0.1) {
      issues.push('High error rate detected');
    }
    
    const status = issues.length === 0 ? 'healthy' : 
                   issues.length <= 2 ? 'degraded' : 'unhealthy';
    
=======
      });

      // Update statistics
      const executionTime = Date.now() - startTime;
      this._stats.totalToolsExecuted++;
      this._stats.totalResponseTime += executionTime;
      session.recordToolCall();
      session.recordRequest(executionTime);

      this.emit('tool:executed', toolName, result, session);
      this._log('debug', `Tool executed: ${toolName} in ${executionTime}ms`);

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this._stats.totalErrors++;
      this._stats.totalResponseTime += executionTime;

      this.emit('tool:error', toolName, error, this._sessions.get(sessionId));
      this._log('error', `Tool execution failed: ${toolName}`, error);

      return {
        success: false,
        error: {
          code: MCPErrorCode.TOOL_EXECUTION_FAILED,
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        },
        metadata: {
          executionTime,
          memoryUsed: process.memoryUsage().heapUsed,
          timestamp: new Date()
        }
      };
    }
  }

  // ============================================================================
  // Health and Monitoring
  // ============================================================================

  /**
   * Get server health status
   */
  getHealthStatus(): HealthStatus {
    const memoryUsage = this._getCurrentMemoryUsage();
    const memoryLimit = this._config.memoryLimit;
    const activeSessions = this.getActiveSessionsCount();
    const maxSessions = this._config.maxClients;
    const errorRate = this._stats.totalRequests > 0 
      ? this._stats.totalErrors / this._stats.totalRequests 
      : 0;

    const issues: string[] = [];
    
    // Check memory usage
    if (memoryUsage > memoryLimit * 0.9) {
      issues.push('High memory usage');
    }
    
    // Check session count
    if (activeSessions > maxSessions * 0.9) {
      issues.push('High session count');
    }
    
    // Check error rate
    if (errorRate > 0.1) {
      issues.push('High error rate');
    }

    // Check transport health
    const transportHealth: Record<TransportType, boolean> = {} as any;
    for (const [type, transport] of this._transports) {
      transportHealth[type] = transport.isHealthy();
      if (!transport.isHealthy()) {
        issues.push(`Transport ${type} is unhealthy`);
      }
    }

    const status = issues.length === 0 ? 'healthy' : 
                  issues.length <= 2 ? 'degraded' : 'unhealthy';

>>>>>>> main
    return {
      status,
      timestamp: new Date(),
      components: {
        server: this._isRunning,
<<<<<<< HEAD
        transports: this.getTransportHealth(),
        tools: this.tools.size > 0,
        memory: isMemoryHealthy,
        sessions: this.sessions.size < this.config.maxClients
      },
      metrics: {
        memoryUsage: memoryUsage.heapUsed,
        memoryLimit: this.config.memoryLimit,
        activeSessions: this.sessions.size,
        maxSessions: this.config.maxClients,
        errorRate: this._requestCount > 0 ? this._errorCount / this._requestCount : 0
=======
        transports: transportHealth,
        tools: this._tools.size > 0,
        memory: memoryUsage < memoryLimit,
        sessions: activeSessions <= maxSessions
      },
      metrics: {
        memoryUsage,
        memoryLimit,
        activeSessions,
        maxSessions,
        errorRate
>>>>>>> main
      },
      issues
    };
  }

  /**
   * Validate server configuration
<<<<<<< HEAD
   * Ensures configuration meets constitutional requirements
   */
  async validateConfig(): Promise<boolean> {
    try {
      // Validate memory limit
      if (this.config.memoryLimit > 1024 * 1024 * 1024) { // 1GB
        throw new Error('Memory limit exceeds constitutional requirement (<1GB)');
      }
      
      // Validate client limits
      if (this.config.maxClients <= 0) {
        throw new Error('Max clients must be greater than 0');
      }
      
      // Validate transports
      if (this.config.transports.length === 0) {
        throw new Error('At least one transport must be configured');
      }
      
      // Validate tool configuration
      if (!this.config.tools) {
        throw new Error('Tool configuration is required');
      }
      
      return true;
      
    } catch (error) {
      console.error('Configuration validation failed:', error.message);
      return false;
    }
=======
   */
  async validateConfig(): Promise<boolean> {
    // Validate basic configuration
    if (!this._config.name || !this._config.version) {
      throw new Error('Server name and version are required');
    }

    if (this._config.maxClients <= 0) {
      throw new Error('maxClients must be greater than 0');
    }

    if (this._config.clientTimeout <= 0) {
      throw new Error('clientTimeout must be greater than 0');
    }

    if (this._config.memoryLimit <= 0) {
      throw new Error('memoryLimit must be greater than 0');
    }

    // Validate transport configurations
    for (const transportConfig of this._config.transports) {
      if (!transportConfig.type) {
        throw new Error('Transport type is required');
      }
    }

    return true;
>>>>>>> main
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
<<<<<<< HEAD
   * Initialize server statistics
   */
  private initializeStats(): ServerStats {
    return {
      uptime: 0,
      activeSessions: 0,
      totalRequests: 0,
      totalToolsExecuted: 0,
      memoryUsage: 0,
      averageResponseTime: 0,
      errorRate: 0,
      transportStats: {} as Record<TransportType, any>
    };
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Handle uncaught errors
    this.on('error', (error) => {
      console.error('Server error:', error);
    });
    
    // Handle memory warnings
    process.on('warning', (warning) => {
      if (warning.name === 'MaxListenersExceededWarning') {
        console.warn('Max listeners exceeded:', warning.message);
      }
=======
   * Set up event handlers
   */
  private _setupEventHandlers(): void {
    // Handle process signals
    process.on('SIGINT', () => this._handleShutdown('SIGINT'));
    process.on('SIGTERM', () => this._handleShutdown('SIGTERM'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this._log('error', 'Uncaught exception', error);
      this.emit('server:error', error, this);
    });

    process.on('unhandledRejection', (reason) => {
      this._log('error', 'Unhandled rejection', reason);
      this.emit('server:error', new Error(String(reason)), this);
>>>>>>> main
    });
  }

  /**
<<<<<<< HEAD
   * Initialize all configured transports
   */
  private async initializeTransports(): Promise<void> {
    for (const transportConfig of this.config.transports) {
      try {
        // This would be implemented by the transport factory
        // For now, we'll create a mock transport
        const transport: Transport = {
          type: transportConfig.type,
          config: transportConfig,
          isConnected: false,
          
          async connect() {
            this.isConnected = true;
            console.log(`Transport ${this.type} connected`);
          },
          
          async disconnect() {
            this.isConnected = false;
            console.log(`Transport ${this.type} disconnected`);
          },
          
          async send(message: ProtocolMessage) {
            if (!this.isConnected) {
              throw new Error('Transport not connected');
            }
            console.log(`Sending message via ${this.type}:`, message.method);
          },
          
          async receive(): Promise<ProtocolMessage> {
            if (!this.isConnected) {
              throw new Error('Transport not connected');
            }
            // Mock response
            return {
              jsonrpc: '2.0',
              id: 'mock',
              method: 'initialize',
              params: {}
            };
          },
          
          isHealthy() {
            return this.isConnected;
          },
          
          getStats() {
            return {
              messagesSent: 0,
              messagesReceived: 0,
              bytesSent: 0,
              bytesReceived: 0,
              averageResponseTime: 0,
              uptime: 0,
              lastActivity: new Date()
            };
          }
        } as Transport;
        
        // Connect the transport
        await transport.connect();
        
        // Register the transport
        this.transports.set(transportConfig.type, transport);
        
        // Emit transport connected event
        this.emit('transport:connected', transport);
        
      } catch (error) {
        this.emit('transport:error', error, null);
        throw new Error(`Failed to initialize transport ${transportConfig.type}: ${error.message}`);
      }
=======
   * Set up session event handlers
   */
  private _setupSessionEventHandlers(session: ClientSession): void {
    session.on('disconnected', (session, reason) => {
      this._log('info', `Session disconnected: ${session.id}, reason: ${reason}`);
      // Session will be cleaned up by cleanup monitoring
    });

    session.on('timeout', (session) => {
      this._log('warn', `Session timeout: ${session.id}`);
      this.removeSession(session.id).catch(error => {
        this._log('error', `Error removing timed out session: ${session.id}`, error);
      });
    });

    session.on('error', (error, session) => {
      this._log('error', `Session error: ${session.id}`, error);
      this.emit('session:error', error, session);
    });
  }

  /**
   * Initialize transports
   */
  private async _initializeTransports(): Promise<void> {
    for (const transportConfig of this._config.transports) {
      // Transport initialization would be implemented by transport factory
      // For now, we'll create a placeholder
      this._log('info', `Initializing transport: ${transportConfig.type}`);
>>>>>>> main
    }
  }

  /**
   * Stop all transports
   */
<<<<<<< HEAD
  private async stopTransports(): Promise<void> {
    for (const [type, transport] of this.transports) {
=======
  private async _stopTransports(): Promise<void> {
    for (const [type, transport] of this._transports) {
>>>>>>> main
      try {
        if (transport.isConnected) {
          await transport.disconnect();
        }
<<<<<<< HEAD
        this.emit('transport:disconnected', transport);
      } catch (error) {
        this.emit('transport:error', error, transport);
        console.error(`Error stopping transport ${type}:`, error.message);
      }
    }
  }

  /**
   * Disconnect all client sessions
   */
  private async disconnectAllSessions(): Promise<void> {
    const sessionIds = Array.from(this.sessions.keys());
    for (const sessionId of sessionIds) {
      try {
        await this.removeSession(sessionId);
      } catch (error) {
        console.error(`Error removing session ${sessionId}:`, error.message);
      }
    }
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    this._memoryCheckInterval = setInterval(() => {
      const memoryUsage = process.memoryUsage();
      if (memoryUsage.heapUsed > this.config.memoryLimit) {
        console.warn('Memory usage exceeds limit:', memoryUsage.heapUsed);
        this.emit('server:error', new Error('Memory limit exceeded'), this);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Stop memory monitoring
   */
  private stopMemoryMonitoring(): void {
    if (this._memoryCheckInterval) {
      clearInterval(this._memoryCheckInterval);
      this._memoryCheckInterval = null;
=======
        this._log('info', `Transport stopped: ${type}`);
      } catch (error) {
        this._log('error', `Error stopping transport ${type}`, error);
      }
    }
    this._transports.clear();
  }

  /**
   * Disconnect all sessions
   */
  private async _disconnectAllSessions(): Promise<void> {
    const disconnectPromises = Array.from(this._sessions.values()).map(session => 
      session.disconnect('Server shutting down').catch(error => {
        this._log('error', `Error disconnecting session: ${session.id}`, error);
      })
    );

    await Promise.all(disconnectPromises);
    this._sessions.clear();
  }

  /**
   * Start cleanup monitoring
   */
  private _startCleanupMonitoring(): void {
    this._cleanupInterval = setInterval(() => {
      this._performCleanup();
    }, 30000); // Run cleanup every 30 seconds
  }

  /**
   * Stop cleanup monitoring
   */
  private _stopCleanupMonitoring(): void {
    if (this._cleanupInterval) {
      clearInterval(this._cleanupInterval);
      this._cleanupInterval = null;
    }
  }

  /**
   * Perform periodic cleanup
   */
  private _performCleanup(): void {
    try {
      // Clean up expired sessions
      const expiredSessions = Array.from(this._sessions.values())
        .filter(session => session.isExpired());

      for (const session of expiredSessions) {
        this._log('info', `Cleaning up expired session: ${session.id}`);
        this.removeSession(session.id).catch(error => {
          this._log('error', `Error cleaning up expired session: ${session.id}`, error);
        });
      }

      // Check memory usage
      const memoryUsage = this._getCurrentMemoryUsage();
      if (memoryUsage > this._config.memoryLimit * 0.8) {
        this._log('warn', `High memory usage: ${Math.round(memoryUsage / 1024 / 1024)}MB`);
      }

    } catch (error) {
      this._log('error', 'Error during cleanup', error);
>>>>>>> main
    }
  }

  /**
<<<<<<< HEAD
   * Start session cleanup
   */
  private startSessionCleanup(): void {
    this._sessionCleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60000); // Cleanup every minute
  }

  /**
   * Stop session cleanup
   */
  private stopSessionCleanup(): void {
    if (this._sessionCleanupInterval) {
      clearInterval(this._sessionCleanupInterval);
      this._sessionCleanupInterval = null;
=======
   * Handle server shutdown
   */
  private async _handleShutdown(signal: string): Promise<void> {
    this._log('info', `Received ${signal}, shutting down gracefully...`);
    try {
      await this.stop();
      process.exit(0);
    } catch (error) {
      this._log('error', 'Error during shutdown', error);
      process.exit(1);
>>>>>>> main
    }
  }

  /**
<<<<<<< HEAD
   * Cleanup expired sessions
   */
  private cleanupExpiredSessions(): void {
    const expiredSessions: string[] = [];
    
    for (const [sessionId, session] of this.sessions) {
      if (session.isExpired()) {
        expiredSessions.push(sessionId);
      }
    }
    
    for (const sessionId of expiredSessions) {
      this.removeSession(sessionId).catch(error => {
        console.error(`Error cleaning up expired session ${sessionId}:`, error.message);
      });
    }
=======
   * Get current memory usage
   */
  private _getCurrentMemoryUsage(): number {
    return process.memoryUsage().heapUsed;
  }

  /**
   * Get transport statistics
   */
  private _getTransportStats(): Record<TransportType, any> {
    const stats: Record<TransportType, any> = {} as any;
    for (const [type, transport] of this._transports) {
      stats[type] = transport.getStats();
    }
    return stats;
>>>>>>> main
  }

  /**
   * Validate tool name
   */
<<<<<<< HEAD
  private validateToolName(name: string): void {
    // Check for forbidden prefixes
    if (name.startsWith('bitbucket_') || name.startsWith('mcp_') || name.startsWith('bb_')) {
      throw new Error('Tool name cannot start with bitbucket_, mcp_, or bb_ prefixes');
    }
    
    // Check snake_case format
    if (!/^[a-z][a-z0-9_]*$/.test(name)) {
      throw new Error('Tool name must be in snake_case format (lowercase letters, numbers, underscores)');
    }
  }

  /**
   * Validate tool structure
   */
  private validateTool(tool: Tool): void {
    if (!tool.name || !tool.description || !tool.execute) {
      throw new Error('Tool must have name, description, and execute function');
    }
    
    if (!Array.isArray(tool.parameters)) {
      throw new Error('Tool parameters must be an array');
    }
  }

  /**
   * Update execution statistics
   */
  private updateExecutionStats(startTime: number): void {
    const processingTime = Date.now() - startTime;
    this._requestCount++;
    this._totalProcessingTime += processingTime;
  }

  /**
   * Get transport health status
   */
  private getTransportHealth(): Record<TransportType, boolean> {
    const health: Record<TransportType, boolean> = {} as any;
    
    for (const [type, transport] of this.transports) {
      health[type] = transport.isHealthy();
    }
    
    return health;
  }
}

// Export the implementation
export default MCPServerImpl;
=======
  private _validateToolName(name: string): boolean {
    // Must be snake_case with no prefixes (bitbucket_, mcp_, bb_)
    const snakeCaseRegex = /^[a-z][a-z0-9_]*[a-z0-9]$/;
    const hasPrefix = name.startsWith('bitbucket_') || name.startsWith('mcp_') || name.startsWith('bb_');
    
    return snakeCaseRegex.test(name) && !hasPrefix;
  }

  /**
   * Log message
   */
  private _log(level: string, message: string, error?: any): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (error) {
      console.error(logMessage, error);
    } else {
      console.log(logMessage);
    }
  }
}
>>>>>>> main
