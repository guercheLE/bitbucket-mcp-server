/**
<<<<<<< HEAD
 * Client Session Manager
 * 
 * Implements ClientSession lifecycle management for the MCP server.
 * This module provides comprehensive session management including
 * connection handling, activity tracking, timeout management,
 * and resource cleanup.
 * 
 * Key Features:
 * - Session lifecycle management (create, update, destroy)
 * - Activity tracking and timeout handling
 * - Memory-efficient session storage
 * - Concurrent session support
 * - Session statistics and monitoring
 * - Automatic cleanup of expired sessions
 * 
 * Constitutional Requirements:
 * - Memory efficiency (<1GB limit)
 * - Concurrent client support
 * - Proper resource cleanup
 * - Activity monitoring
=======
 * Client Session Management
 * 
 * This module implements the ClientSession class for managing individual
 * client connections to the MCP server. It handles session lifecycle,
 * state management, activity tracking, and cleanup operations.
 * 
 * Key Features:
 * - Session state management (connecting, connected, authenticated, etc.)
 * - Activity tracking and timeout handling
 * - Memory usage monitoring
 * - Graceful connection/disconnection handling
 * - Session statistics and metrics
 * 
 * Constitutional Requirements:
 * - Memory efficiency (<1GB total server limit)
 * - Proper session cleanup to prevent memory leaks
 * - Activity-based session expiration
 * - Thread-safe operations for concurrent access
>>>>>>> main
 */

import { EventEmitter } from 'events';
import { 
<<<<<<< HEAD
  ClientSession, 
  ClientSessionState, 
  ClientSessionStats,
  Transport,
  MCPServer,
  MCPErrorCode
=======
  ClientSession as IClientSession, 
  ClientSessionState, 
  ClientSessionStats, 
  Transport,
  MCPErrorCode 
>>>>>>> main
} from '../types/index.js';

/**
 * Client Session Implementation
<<<<<<< HEAD
 * 
 * Manages individual client connection state and lifecycle
 */
export class ClientSessionImpl implements ClientSession {
  // Core session properties
  public readonly id: string;
  public readonly clientId: string;
  public readonly transport: Transport;
  public readonly createdAt: Date;
  
  // Mutable state
  public state: ClientSessionState;
  public lastActivity: Date;
  public metadata: Record<string, any>;
  public availableTools: Set<string>;
  public timeout: number;
  
  // Internal tracking
  private _requestCount: number = 0;
  private _toolCallCount: number = 0;
  private _totalProcessingTime: number = 0;
  private _memoryUsage: number = 0;
  private _lastRequest: Date | null = null;
  private _eventEmitter: EventEmitter;
  private _cleanupTimer: NodeJS.Timeout | null = null;
=======
 * Manages individual client connection state and lifecycle
 */
export class ClientSession extends EventEmitter implements IClientSession {
  private _id: string;
  private _clientId: string;
  private _state: ClientSessionState;
  private _transport: Transport;
  private _createdAt: Date;
  private _lastActivity: Date;
  private _metadata: Record<string, any>;
  private _availableTools: Set<string>;
  private _timeout: number;
  private _timeoutHandle: NodeJS.Timeout | null = null;
  private _stats: {
    requestsProcessed: number;
    toolsCalled: number;
    totalProcessingTime: number;
    memoryUsage: number;
    lastRequest: Date | null;
  };
>>>>>>> main

  constructor(
    id: string,
    clientId: string,
    transport: Transport,
    timeout: number = 300000, // 5 minutes default
    metadata: Record<string, any> = {}
  ) {
<<<<<<< HEAD
    this.id = id;
    this.clientId = clientId;
    this.transport = transport;
    this.state = ClientSessionState.CONNECTING;
    this.createdAt = new Date();
    this.lastActivity = new Date();
    this.metadata = { ...metadata };
    this.availableTools = new Set();
    this.timeout = timeout;
    this._eventEmitter = new EventEmitter();
    
    // Setup cleanup timer
    this.setupCleanupTimer();
    
    // Setup transport event handlers
    this.setupTransportHandlers();
  }

  /**
   * Update session activity
   * Resets the last activity timestamp and extends session lifetime
   */
  updateActivity(): void {
    this.lastActivity = new Date();
    this._lastRequest = new Date();
    
    // Reset cleanup timer
    this.resetCleanupTimer();
    
    // Emit activity event
    this._eventEmitter.emit('activity', this);
  }

  /**
   * Check if session is active
   * Returns true if session has been active within timeout period
   */
  isActive(): boolean {
    const now = Date.now();
    const lastActivityTime = this.lastActivity.getTime();
    return (now - lastActivityTime) < this.timeout;
  }

  /**
   * Check if session has expired
   * Returns true if session has exceeded timeout period
   */
  isExpired(): boolean {
    return !this.isActive();
  }

  /**
   * Get comprehensive session statistics
   * Returns detailed performance and usage metrics
   */
  getStats(): ClientSessionStats {
    const now = Date.now();
    const duration = now - this.createdAt.getTime();
    
    return {
      duration,
      requestsProcessed: this._requestCount,
      toolsCalled: this._toolCallCount,
      averageProcessingTime: this._requestCount > 0 ? 
        this._totalProcessingTime / this._requestCount : 0,
      memoryUsage: this._memoryUsage,
      lastRequest: this._lastRequest || this.createdAt
    };
  }

  /**
   * Update session state
   * Transitions session to new state with validation
   */
  updateState(newState: ClientSessionState): void {
    const oldState = this.state;
    
    // Validate state transition
    if (!this.isValidStateTransition(oldState, newState)) {
      throw new Error(`Invalid state transition from ${oldState} to ${newState}`);
    }
    
    this.state = newState;
    this.updateActivity();
    
    // Emit state change event
    this._eventEmitter.emit('stateChange', { oldState, newState, session: this });
    
    // Handle state-specific actions
    this.handleStateChange(oldState, newState);
  }

  /**
   * Add tool to available tools set
   * Registers a tool as available for this session
   */
  addAvailableTool(toolName: string): void {
    this.availableTools.add(toolName);
    this.updateActivity();
  }

  /**
   * Remove tool from available tools set
   * Unregisters a tool from this session
   */
  removeAvailableTool(toolName: string): void {
    this.availableTools.delete(toolName);
    this.updateActivity();
  }

  /**
   * Update session metadata
   * Adds or updates metadata key-value pairs
   */
  updateMetadata(key: string, value: any): void {
    this.metadata[key] = value;
    this.updateActivity();
  }

  /**
   * Get metadata value
   * Retrieves metadata value by key
   */
  getMetadata(key: string): any {
    return this.metadata[key];
  }

  /**
   * Record request processing
   * Updates request statistics and processing time
   */
  recordRequest(processingTime: number): void {
    this._requestCount++;
    this._totalProcessingTime += processingTime;
=======
    super();
    
    this._id = id;
    this._clientId = clientId;
    this._transport = transport;
    this._createdAt = new Date();
    this._lastActivity = new Date();
    this._metadata = { ...metadata };
    this._availableTools = new Set();
    this._timeout = timeout;
    this._state = ClientSessionState.CONNECTING;
    
    this._stats = {
      requestsProcessed: 0,
      toolsCalled: 0,
      totalProcessingTime: 0,
      memoryUsage: 0,
      lastRequest: null
    };

    // Set up transport event handlers
    this._setupTransportHandlers();
    
    // Start timeout monitoring
    this._startTimeoutMonitoring();
  }

  // ============================================================================
  // Public Interface Implementation
  // ============================================================================

  get id(): string {
    return this._id;
  }

  get clientId(): string {
    return this._clientId;
  }

  get state(): ClientSessionState {
    return this._state;
  }

  get transport(): Transport {
    return this._transport;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get lastActivity(): Date {
    return this._lastActivity;
  }

  set lastActivity(value: Date) {
    this._lastActivity = value;
    this._resetTimeout();
  }

  get metadata(): Record<string, any> {
    return { ...this._metadata };
  }

  set metadata(value: Record<string, any>) {
    this._metadata = { ...value };
  }

  get availableTools(): Set<string> {
    return new Set(this._availableTools);
  }

  set availableTools(value: Set<string>) {
    this._availableTools = new Set(value);
  }

  get timeout(): number {
    return this._timeout;
  }

  set timeout(value: number) {
    this._timeout = value;
    this._resetTimeout();
  }

  /**
   * Update session activity timestamp
   */
  updateActivity(): void {
    this._lastActivity = new Date();
    this._resetTimeout();
    this.emit('activity', this);
  }

  /**
   * Check if session is currently active
   */
  isActive(): boolean {
    return this._state === ClientSessionState.CONNECTED || 
           this._state === ClientSessionState.AUTHENTICATED;
  }

  /**
   * Check if session has expired based on timeout
   */
  isExpired(): boolean {
    const now = new Date();
    const timeSinceActivity = now.getTime() - this._lastActivity.getTime();
    return timeSinceActivity > this._timeout;
  }

  /**
   * Get session statistics
   */
  getStats(): ClientSessionStats {
    const now = new Date();
    const duration = now.getTime() - this._createdAt.getTime();
    const averageProcessingTime = this._stats.requestsProcessed > 0 
      ? this._stats.totalProcessingTime / this._stats.requestsProcessed 
      : 0;

    return {
      duration,
      requestsProcessed: this._stats.requestsProcessed,
      toolsCalled: this._stats.toolsCalled,
      averageProcessingTime,
      memoryUsage: this._stats.memoryUsage,
      lastRequest: this._stats.lastRequest || this._createdAt
    };
  }

  // ============================================================================
  // Session State Management
  // ============================================================================

  /**
   * Transition session to connected state
   */
  async connect(): Promise<void> {
    if (this._state !== ClientSessionState.CONNECTING) {
      throw new Error(`Cannot connect session in state: ${this._state}`);
    }

    try {
      await this._transport.connect();
      this._state = ClientSessionState.CONNECTED;
      this.updateActivity();
      this.emit('connected', this);
    } catch (error) {
      this._state = ClientSessionState.ERROR;
      this.emit('error', error, this);
      throw error;
    }
  }

  /**
   * Transition session to authenticated state
   */
  async authenticate(authData?: any): Promise<void> {
    if (this._state !== ClientSessionState.CONNECTED) {
      throw new Error(`Cannot authenticate session in state: ${this._state}`);
    }

    try {
      // Store authentication data in metadata
      if (authData) {
        this._metadata.auth = authData;
      }
      
      this._state = ClientSessionState.AUTHENTICATED;
      this.updateActivity();
      this.emit('authenticated', this);
    } catch (error) {
      this._state = ClientSessionState.ERROR;
      this.emit('error', error, this);
      throw error;
    }
  }

  /**
   * Gracefully disconnect the session
   */
  async disconnect(reason?: string): Promise<void> {
    if (this._state === ClientSessionState.DISCONNECTED) {
      return; // Already disconnected
    }

    this._state = ClientSessionState.DISCONNECTING;
    this.emit('disconnecting', this, reason);

    try {
      // Clean up timeout monitoring
      this._clearTimeout();
      
      // Disconnect transport
      if (this._transport.isConnected) {
        await this._transport.disconnect();
      }
      
      this._state = ClientSessionState.DISCONNECTED;
      this.emit('disconnected', this, reason);
    } catch (error) {
      this._state = ClientSessionState.ERROR;
      this.emit('error', error, this);
      throw error;
    }
  }

  /**
   * Force disconnect due to error or timeout
   */
  async forceDisconnect(reason: string): Promise<void> {
    this._state = ClientSessionState.DISCONNECTING;
    this.emit('forceDisconnect', this, reason);

    try {
      this._clearTimeout();
      
      if (this._transport.isConnected) {
        await this._transport.disconnect();
      }
      
      this._state = ClientSessionState.DISCONNECTED;
      this.emit('disconnected', this, reason);
    } catch (error) {
      this._state = ClientSessionState.ERROR;
      this.emit('error', error, this);
    }
  }

  // ============================================================================
  // Tool and Request Management
  // ============================================================================

  /**
   * Add a tool to the session's available tools
   */
  addTool(toolName: string): void {
    this._availableTools.add(toolName);
    this.emit('toolAdded', toolName, this);
  }

  /**
   * Remove a tool from the session's available tools
   */
  removeTool(toolName: string): void {
    this._availableTools.delete(toolName);
    this.emit('toolRemoved', toolName, this);
  }

  /**
   * Check if a tool is available for this session
   */
  hasTool(toolName: string): boolean {
    return this._availableTools.has(toolName);
  }

  /**
   * Record a request being processed
   */
  recordRequest(processingTime: number): void {
    this._stats.requestsProcessed++;
    this._stats.totalProcessingTime += processingTime;
    this._stats.lastRequest = new Date();
>>>>>>> main
    this.updateActivity();
  }

  /**
<<<<<<< HEAD
   * Record tool call
   * Updates tool call statistics
   */
  recordToolCall(): void {
    this._toolCallCount++;
=======
   * Record a tool being called
   */
  recordToolCall(): void {
    this._stats.toolsCalled++;
>>>>>>> main
    this.updateActivity();
  }

  /**
<<<<<<< HEAD
   * Update memory usage
   * Tracks memory consumption for this session
   */
  updateMemoryUsage(bytes: number): void {
    this._memoryUsage = bytes;
  }

  /**
   * Cleanup session resources
   * Properly disposes of session resources and timers
   */
  cleanup(): void {
    // Clear cleanup timer
    if (this._cleanupTimer) {
      clearTimeout(this._cleanupTimer);
      this._cleanupTimer = null;
    }
    
    // Update state to disconnected
    this.state = ClientSessionState.DISCONNECTED;
    
    // Emit cleanup event
    this._eventEmitter.emit('cleanup', this);
    
    // Remove all event listeners
    this._eventEmitter.removeAllListeners();
  }

  /**
   * Get session summary
   * Returns a summary of session information
   */
  getSummary(): {
    id: string;
    clientId: string;
    state: ClientSessionState;
    duration: number;
    isActive: boolean;
    requestCount: number;
    toolCount: number;
    availableTools: string[];
  } {
    return {
      id: this.id,
      clientId: this.clientId,
      state: this.state,
      duration: Date.now() - this.createdAt.getTime(),
      isActive: this.isActive(),
      requestCount: this._requestCount,
      toolCount: this._toolCallCount,
      availableTools: Array.from(this.availableTools)
    };
=======
   * Update memory usage for this session
   */
  updateMemoryUsage(bytes: number): void {
    this._stats.memoryUsage = bytes;
>>>>>>> main
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
<<<<<<< HEAD
   * Setup cleanup timer
   * Sets up automatic cleanup when session expires
   */
  private setupCleanupTimer(): void {
    this._cleanupTimer = setTimeout(() => {
      if (this.isExpired()) {
        this._eventEmitter.emit('expired', this);
      }
    }, this.timeout);
  }

  /**
   * Reset cleanup timer
   * Resets the cleanup timer when activity occurs
   */
  private resetCleanupTimer(): void {
    if (this._cleanupTimer) {
      clearTimeout(this._cleanupTimer);
    }
    this.setupCleanupTimer();
  }

  /**
   * Setup transport event handlers
   * Handles transport-specific events
   */
  private setupTransportHandlers(): void {
    this.transport.on('disconnect', () => {
      this.updateState(ClientSessionState.DISCONNECTED);
    });
    
    this.transport.on('error', (error) => {
      this.updateState(ClientSessionState.ERROR);
      this._eventEmitter.emit('transportError', error, this);
=======
   * Set up transport event handlers
   */
  private _setupTransportHandlers(): void {
    this._transport.on('error', (error) => {
      this.emit('transportError', error, this);
      this._handleTransportError(error);
    });

    this._transport.on('disconnect', () => {
      this.emit('transportDisconnected', this);
      this._handleTransportDisconnect();
    });

    this._transport.on('message', (message) => {
      this.updateActivity();
      this.emit('message', message, this);
>>>>>>> main
    });
  }

  /**
<<<<<<< HEAD
   * Validate state transition
   * Ensures state transitions are valid
   */
  private isValidStateTransition(from: ClientSessionState, to: ClientSessionState): boolean {
    const validTransitions: Record<ClientSessionState, ClientSessionState[]> = {
      [ClientSessionState.CONNECTING]: [
        ClientSessionState.CONNECTED,
        ClientSessionState.ERROR,
        ClientSessionState.DISCONNECTED
      ],
      [ClientSessionState.CONNECTED]: [
        ClientSessionState.AUTHENTICATED,
        ClientSessionState.DISCONNECTING,
        ClientSessionState.ERROR,
        ClientSessionState.DISCONNECTED
      ],
      [ClientSessionState.AUTHENTICATED]: [
        ClientSessionState.DISCONNECTING,
        ClientSessionState.ERROR,
        ClientSessionState.DISCONNECTED
      ],
      [ClientSessionState.DISCONNECTING]: [
        ClientSessionState.DISCONNECTED,
        ClientSessionState.ERROR
      ],
      [ClientSessionState.DISCONNECTED]: [],
      [ClientSessionState.ERROR]: [
        ClientSessionState.DISCONNECTED
      ]
    };
    
    return validTransitions[from]?.includes(to) || false;
  }

  /**
   * Handle state change
   * Performs actions based on state transitions
   */
  private handleStateChange(oldState: ClientSessionState, newState: ClientSessionState): void {
    switch (newState) {
      case ClientSessionState.CONNECTED:
        this._eventEmitter.emit('connected', this);
        break;
        
      case ClientSessionState.AUTHENTICATED:
        this._eventEmitter.emit('authenticated', this);
        break;
        
      case ClientSessionState.DISCONNECTING:
        this._eventEmitter.emit('disconnecting', this);
        break;
        
      case ClientSessionState.DISCONNECTED:
        this._eventEmitter.emit('disconnected', this);
        this.cleanup();
        break;
        
      case ClientSessionState.ERROR:
        this._eventEmitter.emit('error', this);
        break;
    }
  }
}

/**
 * Client Session Manager
 * 
 * Manages multiple client sessions with lifecycle tracking,
 * cleanup, and monitoring capabilities.
 */
export class ClientSessionManager extends EventEmitter {
  private sessions: Map<string, ClientSessionImpl> = new Map();
  private maxSessions: number;
  private defaultTimeout: number;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private stats: {
    totalSessions: number;
    activeSessions: number;
    expiredSessions: number;
    errorSessions: number;
  } = {
    totalSessions: 0,
    activeSessions: 0,
    expiredSessions: 0,
    errorSessions: 0
  };

  constructor(maxSessions: number = 100, defaultTimeout: number = 300000) {
    super();
    this.maxSessions = maxSessions;
    this.defaultTimeout = defaultTimeout;
    
    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Create a new client session
   * Establishes new session with proper validation
   */
  async createSession(
    clientId: string,
    transport: Transport,
    timeout?: number,
    metadata?: Record<string, any>
  ): Promise<ClientSessionImpl> {
    // Check session limit
    if (this.sessions.size >= this.maxSessions) {
      throw new Error(`Maximum sessions limit reached (${this.maxSessions})`);
    }
    
    // Generate unique session ID
    const sessionId = this.generateSessionId(clientId);
    
    // Create session
    const session = new ClientSessionImpl(
      sessionId,
      clientId,
      transport,
      timeout || this.defaultTimeout,
      metadata
    );
    
    // Setup session event handlers
    this.setupSessionHandlers(session);
    
    // Register session
    this.sessions.set(sessionId, session);
    this.stats.totalSessions++;
    this.stats.activeSessions++;
    
    // Emit session created event
    this.emit('sessionCreated', session);
    
    return session;
  }

  /**
   * Get session by ID
   * Retrieves session if it exists and is active
   */
  getSession(sessionId: string): ClientSessionImpl | undefined {
    const session = this.sessions.get(sessionId);
    if (session && session.isActive()) {
      return session;
    }
    return undefined;
  }

  /**
   * Get session by client ID
   * Retrieves the most recent active session for a client
   */
  getSessionByClientId(clientId: string): ClientSessionImpl | undefined {
    for (const session of this.sessions.values()) {
      if (session.clientId === clientId && session.isActive()) {
        return session;
      }
    }
    return undefined;
  }

  /**
   * Remove session
   * Properly disposes of session and cleans up resources
   */
  async removeSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }
    
    // Cleanup session
    session.cleanup();
    
    // Remove from registry
    this.sessions.delete(sessionId);
    this.stats.activeSessions--;
    
    // Emit session removed event
    this.emit('sessionRemoved', session);
=======
   * Handle transport errors
   */
  private _handleTransportError(error: Error): void {
    this._state = ClientSessionState.ERROR;
    this.emit('error', error, this);
  }

  /**
   * Handle transport disconnection
   */
  private _handleTransportDisconnect(): void {
    if (this._state !== ClientSessionState.DISCONNECTED) {
      this._state = ClientSessionState.DISCONNECTED;
      this.emit('disconnected', this, 'Transport disconnected');
    }
  }

  /**
   * Start timeout monitoring
   */
  private _startTimeoutMonitoring(): void {
    this._resetTimeout();
  }

  /**
   * Reset the timeout timer
   */
  private _resetTimeout(): void {
    this._clearTimeout();
    
    this._timeoutHandle = setTimeout(() => {
      this._handleTimeout();
    }, this._timeout);
  }

  /**
   * Clear the timeout timer
   */
  private _clearTimeout(): void {
    if (this._timeoutHandle) {
      clearTimeout(this._timeoutHandle);
      this._timeoutHandle = null;
    }
  }

  /**
   * Handle session timeout
   */
  private _handleTimeout(): void {
    this.emit('timeout', this);
    this.forceDisconnect('Session timeout');
  }

  /**
   * Clean up resources
   */
  private _cleanup(): void {
    this._clearTimeout();
    this.removeAllListeners();
  }

  // ============================================================================
  // Lifecycle Management
  // ============================================================================

  /**
   * Destroy the session and clean up all resources
   */
  async destroy(): Promise<void> {
    try {
      await this.disconnect('Session destroyed');
    } catch (error) {
      // Ignore errors during cleanup
    } finally {
      this._cleanup();
    }
  }

  /**
   * Get a summary of the session for logging/debugging
   */
  getSummary(): string {
    const stats = this.getStats();
    return `Session[${this._id}] Client[${this._clientId}] State[${this._state}] ` +
           `Duration[${Math.round(stats.duration / 1000)}s] ` +
           `Requests[${stats.requestsProcessed}] Tools[${stats.toolsCalled}] ` +
           `Memory[${Math.round(stats.memoryUsage / 1024)}KB]`;
  }
}

/**
 * Session Manager Utility Functions
 */
export class SessionManager {
  /**
   * Create a new session with proper validation
   */
  static createSession(
    clientId: string,
    transport: Transport,
    options: {
      timeout?: number;
      metadata?: Record<string, any>;
    } = {}
  ): ClientSession {
    const sessionId = `session_${clientId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return new ClientSession(
      sessionId,
      clientId,
      transport,
      options.timeout,
      options.metadata
    );
  }

  /**
   * Validate session configuration
   */
  static validateSessionConfig(config: {
    timeout?: number;
    maxMemory?: number;
  }): boolean {
    if (config.timeout && (config.timeout < 1000 || config.timeout > 3600000)) {
      return false; // Timeout must be between 1 second and 1 hour
    }
    
    if (config.maxMemory && (config.maxMemory < 1024 || config.maxMemory > 104857600)) {
      return false; // Memory limit must be between 1KB and 100MB per session
    }
>>>>>>> main
    
    return true;
  }

  /**
<<<<<<< HEAD
   * Get all active sessions
   * Returns array of currently active sessions
   */
  getActiveSessions(): ClientSessionImpl[] {
    return Array.from(this.sessions.values()).filter(session => session.isActive());
  }

  /**
   * Get session statistics
   * Returns comprehensive session management statistics
   */
  getStats(): {
    total: number;
    active: number;
    expired: number;
    errors: number;
    memoryUsage: number;
    averageDuration: number;
  } {
    const activeSessions = this.getActiveSessions();
    const totalDuration = activeSessions.reduce((sum, session) => {
      return sum + (Date.now() - session.createdAt.getTime());
    }, 0);
    
    const totalMemoryUsage = activeSessions.reduce((sum, session) => {
      return sum + session.getStats().memoryUsage;
    }, 0);
    
    return {
      total: this.stats.totalSessions,
      active: this.stats.activeSessions,
      expired: this.stats.expiredSessions,
      errors: this.stats.errorSessions,
      memoryUsage: totalMemoryUsage,
      averageDuration: activeSessions.length > 0 ? totalDuration / activeSessions.length : 0
    };
  }

  /**
   * Cleanup expired sessions
   * Removes all expired sessions and updates statistics
   */
  async cleanupExpiredSessions(): Promise<number> {
    const expiredSessions: string[] = [];
    
    for (const [sessionId, session] of this.sessions) {
      if (session.isExpired()) {
        expiredSessions.push(sessionId);
      }
    }
    
    let cleanedCount = 0;
    for (const sessionId of expiredSessions) {
      if (await this.removeSession(sessionId)) {
        cleanedCount++;
        this.stats.expiredSessions++;
      }
    }
    
    if (cleanedCount > 0) {
      this.emit('sessionsCleaned', cleanedCount);
    }
    
    return cleanedCount;
  }

  /**
   * Shutdown session manager
   * Properly disposes of all sessions and resources
   */
  async shutdown(): Promise<void> {
    // Stop cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    // Cleanup all sessions
    const sessionIds = Array.from(this.sessions.keys());
    for (const sessionId of sessionIds) {
      await this.removeSession(sessionId);
    }
    
    // Clear collections
    this.sessions.clear();
    
    // Emit shutdown event
    this.emit('shutdown');
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Generate unique session ID
   * Creates a unique session identifier
   */
  private generateSessionId(clientId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `session_${clientId}_${timestamp}_${random}`;
  }

  /**
   * Setup session event handlers
   * Handles events from individual sessions
   */
  private setupSessionHandlers(session: ClientSessionImpl): void {
    session['_eventEmitter'].on('expired', () => {
      this.stats.expiredSessions++;
      this.emit('sessionExpired', session);
    });
    
    session['_eventEmitter'].on('error', () => {
      this.stats.errorSessions++;
      this.emit('sessionError', session);
    });
    
    session['_eventEmitter'].on('disconnected', () => {
      this.removeSession(session.id);
    });
  }

  /**
   * Start cleanup interval
   * Begins periodic cleanup of expired sessions
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(async () => {
      await this.cleanupExpiredSessions();
    }, 60000); // Cleanup every minute
  }
}

// Export implementations
export default ClientSessionManager;
export { ClientSessionImpl };
=======
   * Calculate memory usage for a session
   */
  static calculateSessionMemoryUsage(session: ClientSession): number {
    const stats = session.getStats();
    const baseMemory = 1024; // 1KB base memory per session
    const toolMemory = session.availableTools.size * 64; // 64 bytes per tool
    const metadataMemory = JSON.stringify(session.metadata).length;
    
    return baseMemory + toolMemory + metadataMemory + stats.memoryUsage;
  }
}
>>>>>>> main
