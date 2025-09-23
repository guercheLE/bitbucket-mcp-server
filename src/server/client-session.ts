/**
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
 */

import { EventEmitter } from 'events';
import { 
  ClientSession, 
  ClientSessionState, 
  ClientSessionStats,
  Transport,
  MCPServer,
  MCPErrorCode
} from '../types/index.js';

/**
 * Client Session Implementation
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

  constructor(
    id: string,
    clientId: string,
    transport: Transport,
    timeout: number = 300000, // 5 minutes default
    metadata: Record<string, any> = {}
  ) {
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
    this.updateActivity();
  }

  /**
   * Record tool call
   * Updates tool call statistics
   */
  recordToolCall(): void {
    this._toolCallCount++;
    this.updateActivity();
  }

  /**
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
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
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
    });
  }

  /**
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
    
    return true;
  }

  /**
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
