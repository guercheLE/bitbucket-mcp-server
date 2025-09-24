/**
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
 */

import { EventEmitter } from 'events';
import { 
  ClientSession as IClientSession, 
  ClientSessionState, 
  ClientSessionStats, 
  Transport,
  MCPErrorCode 
} from '../types/index.js';

/**
 * Client Session Implementation
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

  constructor(
    id: string,
    clientId: string,
    transport: Transport,
    timeout: number = 300000, // 5 minutes default
    metadata: Record<string, any> = {}
  ) {
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
    this.updateActivity();
  }

  /**
   * Record a tool being called
   */
  recordToolCall(): void {
    this._stats.toolsCalled++;
    this.updateActivity();
  }

  /**
   * Update memory usage for this session
   */
  updateMemoryUsage(bytes: number): void {
    this._stats.memoryUsage = bytes;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
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
    });
  }

  /**
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

  /**
   * Update metadata
   */
  updateMetadata(key: string, value: any): void {
    this._metadata[key] = value;
  }

  /**
   * Update state
   */
  updateState(state: ClientSessionState): void {
    this._state = state;
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
    
    return true;
  }

  /**
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