/**
 * MCP Server Implementation
 * 
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
 */

import { EventEmitter } from 'events';
import { 
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
} from '../types/index';
import { ClientSession as ClientSessionImpl, SessionManager } from './client-session';
import { ToolRegistry } from './tool-registry';
import { PerformanceMonitor, PerformanceMonitorConfig, DEFAULT_PERFORMANCE_CONFIG } from './performance-monitor';

/**
 * MCP Server Implementation
 * Main server entity implementing MCP protocol compliance
 */
export class MCPServer extends EventEmitter implements IMCPServer {
  private _config: ServerConfig;
  private _isRunning: boolean = false;
  private _startTime: Date | null = null;
  private _sessions: Map<string, ClientSession> = new Map();
  private _toolRegistry: ToolRegistry;
  private _transports: Map<TransportType, Transport> = new Map();
  private _cleanupInterval: NodeJS.Timeout | null = null;
  private _stats: {
    totalRequests: number;
    totalToolsExecuted: number;
    totalErrors: number;
    totalResponseTime: number;
  };
  private _performanceMonitor: PerformanceMonitor;

  constructor(config: ServerConfig) {
    super();
    
    this._config = { ...config };
    this._stats = {
      totalRequests: 0,
      totalToolsExecuted: 0,
      totalErrors: 0,
      totalResponseTime: 0
    };

    // Initialize tool registry
    this._toolRegistry = new ToolRegistry({
      validateParameters: true,
      trackStatistics: true,
      allowOverwrite: false,
      maxTools: 1000
    });

    // Initialize performance monitor
    const performanceConfig: PerformanceMonitorConfig = {
      ...DEFAULT_PERFORMANCE_CONFIG,
      memoryLimit: config.memoryLimit,
      responseTimeThreshold: 2000, // 2 seconds constitutional requirement
      errorRateThreshold: 0.1, // 10% error rate threshold
      sessionCountThreshold: config.maxClients,
      enableDetailedLogging: config.logging.level === 'debug',
      enableAlerts: true
    };
    
    this._performanceMonitor = new PerformanceMonitor(performanceConfig);
    this._setupPerformanceMonitorEvents();

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
    return new Map(this._toolRegistry.getAvailableTools().map(tool => [tool.name, tool]));
  }

  get toolRegistry(): ToolRegistry {
    return this._toolRegistry;
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
   */
  async start(): Promise<void> {
    if (this._isRunning) {
      throw new Error('Server is already running');
    }

    try {
      // Validate configuration
      await this.validateConfig();

      // Initialize transports
      await this._initializeTransports();

      // Start cleanup monitoring
      this._startCleanupMonitoring();

      // Start performance monitoring
      this._performanceMonitor.start();

      this._isRunning = true;
      this._startTime = new Date();
      
      this.emit('server:started', this);
      this._log('info', 'MCP Server started successfully');
    } catch (error) {
      this.emit('server:error', error, this);
      this._log('error', 'Failed to start MCP server', error);
      throw error;
    }
  }

  /**
   * Stop the MCP server
   */
  async stop(): Promise<void> {
    if (!this._isRunning) {
      return;
    }

    try {
      this._log('info', 'Stopping MCP server...');

      // Stop cleanup monitoring
      this._stopCleanupMonitoring();

      // Stop performance monitoring
      this._performanceMonitor.stop();

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
    }
  }

  /**
   * Restart the MCP server
   */
  async restart(): Promise<void> {
    this._log('info', 'Restarting MCP server...');
    await this.stop();
    await this.start();
  }

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
    try {
      // Use tool registry for registration
      await this._toolRegistry.registerTool(tool);
      
      this.emit('tool:registered', tool);
      this._log('info', `Tool registered: ${tool.name}`);

      // Add tool to all active sessions
      for (const session of this._sessions.values()) {
        if (session.isActive()) {
          session.addTool(tool.name);
        }
      }
    } catch (error) {
      this.emit('tool:registrationError', tool.name, error);
      this._log('error', `Failed to register tool: ${tool.name}`, error);
      throw error;
    }
  }

  /**
   * Unregister a tool
   */
  async unregisterTool(toolName: string): Promise<void> {
    try {
      // Use tool registry for unregistration
      const removed = await this._toolRegistry.unregisterTool(toolName);
      
      if (removed) {
        this.emit('tool:unregistered', toolName);
        this._log('info', `Tool unregistered: ${toolName}`);

        // Remove tool from all active sessions
        for (const session of this._sessions.values()) {
          if (session.isActive()) {
            session.removeTool(toolName);
          }
        }
      }
    } catch (error) {
      this.emit('tool:unregistrationError', toolName, error);
      this._log('error', `Failed to unregister tool: ${toolName}`, error);
      throw error;
    }
  }

  /**
   * Get available tools
   */
  getAvailableTools(): Tool[] {
    return this._toolRegistry.getAvailableTools();
  }

  /**
   * Get tool by name
   */
  getTool(toolName: string): Tool | undefined {
    return this._toolRegistry.getTool(toolName);
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: string): Tool[] {
    return this._toolRegistry.getToolsByCategory(category);
  }

  /**
   * Search tools
   */
  searchTools(query: string): Tool[] {
    return this._toolRegistry.searchTools(query);
  }

  /**
   * Get tool statistics
   */
  getToolStats(toolName: string) {
    return this._toolRegistry.getToolStats(toolName);
  }

  /**
   * Get registry statistics
   */
  getRegistryStats() {
    return this._toolRegistry.getRegistryStats();
  }

  /**
   * Enable a tool
   */
  enableTool(toolName: string): boolean {
    return this._toolRegistry.enableTool(toolName);
  }

  /**
   * Disable a tool
   */
  disableTool(toolName: string): boolean {
    return this._toolRegistry.disableTool(toolName);
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

      // Get tool from registry
      const tool = this._toolRegistry.getTool(toolName);
      if (!tool) {
        throw new Error(`Tool not found or disabled: ${toolName}`);
      }

      // Check if tool is available for this session
      if (!session.hasTool(toolName)) {
        throw new Error(`Tool ${toolName} not available for session ${sessionId}`);
      }

      // Update statistics
      this._stats.totalRequests++;
      session.recordRequest(0); // Will be updated after execution

      // Execute tool using registry
      const result = await this._toolRegistry.executeTool(toolName, params, {
        session,
        server: this,
        request: {
          id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          transport: session.transport.type
        },
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          memoryUsage: process.memoryUsage()
        }
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

    return {
      status,
      timestamp: new Date(),
      components: {
        server: this._isRunning,
        transports: transportHealth,
        tools: this._toolRegistry.getAvailableTools().length > 0,
        memory: memoryUsage < memoryLimit,
        sessions: activeSessions <= maxSessions
      },
      metrics: {
        memoryUsage,
        memoryLimit,
        activeSessions,
        maxSessions,
        errorRate
      },
      issues
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return this._performanceMonitor.getCurrentMetrics();
  }

  /**
   * Get performance alerts
   */
  getPerformanceAlerts() {
    return this._performanceMonitor.getAlerts();
  }

  /**
   * Get performance history
   */
  getPerformanceHistory(limit?: number) {
    return this._performanceMonitor.getMetricsHistory(limit);
  }

  /**
   * Check if server is constitutionally compliant
   */
  isConstitutionalCompliant(): boolean {
    return this._performanceMonitor.isConstitutionalCompliant();
  }

  /**
   * Get performance health status
   */
  getPerformanceHealthStatus() {
    return this._performanceMonitor.getPerformanceHealthStatus();
  }

  /**
   * Validate server configuration
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
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Set up performance monitor event handlers
   */
  private _setupPerformanceMonitorEvents(): void {
    this._performanceMonitor.on('alert:generated', (alert) => {
      this.emit('performance:alert', alert);
      this._log('warn', `Performance alert: ${alert.message}`, alert);
    });

    this._performanceMonitor.on('metrics:collected', (metrics) => {
      this.emit('performance:metrics', metrics);
    });
  }

  /**
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
    });
  }

  /**
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
    }
  }

  /**
   * Stop all transports
   */
  private async _stopTransports(): Promise<void> {
    for (const [type, transport] of this._transports) {
      try {
        if (transport.isConnected) {
          await transport.disconnect();
        }
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
    }
  }

  /**
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
    }
  }

  /**
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