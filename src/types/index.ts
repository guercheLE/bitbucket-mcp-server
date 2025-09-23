/**
 * Core Type Definitions for Bitbucket MCP Server
 * 
 * This module defines the fundamental TypeScript interfaces and types
 * for the MCP (Model Context Protocol) server infrastructure.
 * 
 * Key Components:
 * - MCPServer: Main server entity with protocol compliance
 * - ClientSession: Individual client connection management
 * - Tool: MCP tool definition and registration
 * - Transport: Multi-transport support (stdio, HTTP, SSE)
 * - ProtocolMessage: MCP JSON-RPC 2.0 message structure
 * 
 * Constitutional Requirements:
 * - Full MCP protocol compliance
 * - Multi-transport support
 * - Selective tool registration
 * - Memory efficiency (<1GB limit)
 * - Type safety and validation
 */

import { EventEmitter } from 'events';

// ============================================================================
// MCP Protocol Types (JSON-RPC 2.0 compliant)
// ============================================================================

/**
 * MCP Protocol Message Structure
 * Follows JSON-RPC 2.0 specification for MCP protocol compliance
 */
export interface ProtocolMessage {
  /** JSON-RPC version, must be "2.0" */
  jsonrpc: '2.0';
  
  /** Unique identifier for the request/response */
  id: string | number | null;
  
  /** Method name for requests, undefined for responses */
  method?: string;
  
  /** Parameters for the method call */
  params?: any;
  
  /** Result data for successful responses */
  result?: any;
  
  /** Error information for failed responses */
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

/**
 * MCP Protocol Error Codes
 * Standard JSON-RPC 2.0 error codes with MCP-specific extensions
 */
export enum MCPErrorCode {
  // JSON-RPC 2.0 Standard Errors
  PARSE_ERROR = -32700,
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_ERROR = -32603,
  
  // MCP Protocol Errors
  INITIALIZATION_FAILED = -32000,
  TOOL_NOT_FOUND = -32001,
  TOOL_EXECUTION_FAILED = -32002,
  TRANSPORT_ERROR = -32003,
  SESSION_EXPIRED = -32004,
  RATE_LIMIT_EXCEEDED = -32005,
  AUTHENTICATION_FAILED = -32006,
  AUTHORIZATION_FAILED = -32007,
  RESOURCE_NOT_FOUND = -32008,
  CONCURRENT_OPERATION = -32009,
  MEMORY_LIMIT_EXCEEDED = -32010
}

// ============================================================================
// Transport Layer Types
// ============================================================================

/**
 * Transport Protocol Types
 * Supported transport mechanisms for MCP communication
 */
export type TransportType = 'stdio' | 'http' | 'sse';

/**
 * Transport Configuration
 * Configuration options for different transport types
 */
export interface TransportConfig {
  /** Transport protocol type */
  type: TransportType;
  
  /** Host address (for HTTP/SSE) */
  host?: string;
  
  /** Port number (for HTTP/SSE) */
  port?: number;
  
  /** Path/endpoint (for HTTP/SSE) */
  path?: string;
  
  /** Connection timeout in milliseconds */
  timeout?: number;
  
  /** Additional transport-specific options */
  options?: Record<string, any>;
}

/**
 * Transport Interface
 * Common interface for all transport implementations
 */
export interface Transport extends EventEmitter {
  /** Transport type identifier */
  readonly type: TransportType;
  
  /** Transport configuration */
  readonly config: TransportConfig;
  
  /** Connection status */
  readonly isConnected: boolean;
  
  /** Connect to the transport */
  connect(): Promise<void>;
  
  /** Disconnect from the transport */
  disconnect(): Promise<void>;
  
  /** Send a message through the transport */
  send(message: ProtocolMessage): Promise<void>;
  
  /** Receive a message from the transport */
  receive(): Promise<ProtocolMessage>;
  
  /** Check if transport is healthy */
  isHealthy(): boolean;
  
  /** Get transport statistics */
  getStats(): TransportStats;
}

/**
 * Transport Statistics
 * Performance and usage metrics for transport monitoring
 */
export interface TransportStats {
  /** Number of messages sent */
  messagesSent: number;
  
  /** Number of messages received */
  messagesReceived: number;
  
  /** Total bytes sent */
  bytesSent: number;
  
  /** Total bytes received */
  bytesReceived: number;
  
  /** Average response time in milliseconds */
  averageResponseTime: number;
  
  /** Connection uptime in milliseconds */
  uptime: number;
  
  /** Last activity timestamp */
  lastActivity: Date;
}

// ============================================================================
// Client Session Types
// ============================================================================

/**
 * Client Session State
 * Represents the current state of a client connection
 */
export enum ClientSessionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  AUTHENTICATED = 'authenticated',
  DISCONNECTING = 'disconnecting',
  DISCONNECTED = 'disconnected',
  ERROR = 'error'
}

/**
 * Client Session Information
 * Manages individual client connection state and metadata
 */
export interface ClientSession extends EventEmitter {
  /** Unique session identifier */
  readonly id: string;
  
  /** Client connection identifier */
  readonly clientId: string;
  
  /** Current session state */
  readonly state: ClientSessionState;
  
  /** Transport used for this session */
  readonly transport: Transport;
  
  /** Session creation timestamp */
  readonly createdAt: Date;
  
  /** Last activity timestamp */
  lastActivity: Date;
  
  /** Session metadata */
  metadata: Record<string, any>;
  
  /** Available tools for this session */
  availableTools: Set<string>;
  
  /** Session timeout in milliseconds */
  timeout: number;
  
  /** Update session activity */
  updateActivity(): void;
  
  /** Check if session is active */
  isActive(): boolean;
  
  /** Check if session has expired */
  isExpired(): boolean;
  
  /** Get session statistics */
  getStats(): ClientSessionStats;
  
  /** Connect the session */
  connect(): Promise<void>;
  
  /** Disconnect the session */
  disconnect(reason?: string): Promise<void>;
  
  /** Destroy the session and clean up resources */
  destroy(): Promise<void>;
  
  /** Add a tool to available tools */
  addTool(toolName: string): void;
  
  /** Remove a tool from available tools */
  removeTool(toolName: string): void;
  
  /** Check if a tool is available */
  hasTool(toolName: string): boolean;
  
  /** Record a request being processed */
  recordRequest(processingTime: number): void;
  
  /** Record a tool being called */
  recordToolCall(): void;
  
  /** Update memory usage */
  updateMemoryUsage(bytes: number): void;
  
  /** Get session summary for logging */
  getSummary(): string;
  
  /** Update metadata */
  updateMetadata(key: string, value: any): void;
  
  /** Update state */
  updateState(state: ClientSessionState): void;
}

/**
 * Client Session Statistics
 * Performance metrics for individual client sessions
 */
export interface ClientSessionStats {
  /** Session duration in milliseconds */
  duration: number;
  
  /** Number of requests processed */
  requestsProcessed: number;
  
  /** Number of tools called */
  toolsCalled: number;
  
  /** Average request processing time */
  averageProcessingTime: number;
  
  /** Memory usage in bytes */
  memoryUsage: number;
  
  /** Last request timestamp */
  lastRequest: Date;
}

// ============================================================================
// Tool System Types
// ============================================================================

/**
 * Tool Parameter Definition
 * Defines a parameter for an MCP tool
 */
export interface ToolParameter {
  /** Parameter name */
  name: string;
  
  /** Parameter type */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  
  /** Parameter description */
  description: string;
  
  /** Whether parameter is required */
  required: boolean;
  
  /** Default value */
  default?: any;
  
  /** Parameter validation schema */
  schema?: any;
}

/**
 * Tool Definition
 * Complete definition of an MCP tool
 */
export interface Tool {
  /** Tool name (must follow snake_case convention, no prefixes) */
  readonly name: string;
  
  /** Tool description */
  readonly description: string;
  
  /** Tool parameters */
  readonly parameters: ToolParameter[];
  
  /** Tool category for organization */
  readonly category?: string;
  
  /** Tool version */
  readonly version?: string;
  
  /** Whether tool is enabled */
  readonly enabled: boolean;
  
  /** Tool execution function */
  readonly execute: ToolExecutor;
  
  /** Tool validation function */
  readonly validate?: ToolValidator;
  
  /** Tool metadata */
  readonly metadata?: Record<string, any>;
}

/**
 * Tool Executor Function
 * Executes the tool with given parameters
 */
export type ToolExecutor = (params: Record<string, any>, context: ToolExecutionContext) => Promise<ToolResult>;

/**
 * Tool Validator Function
 * Validates tool parameters before execution
 */
export type ToolValidator = (params: Record<string, any>) => Promise<boolean>;

/**
 * Tool Execution Context
 * Context information available during tool execution
 */
export interface ToolExecutionContext {
  /** Client session executing the tool */
  session: ClientSession;
  
  /** Server instance */
  server: MCPServer;
  
  /** Request metadata */
  request: {
    id: string;
    timestamp: Date;
    transport: TransportType;
  };
  
  /** Execution environment */
  environment: {
    nodeVersion: string;
    platform: string;
    memoryUsage: NodeJS.MemoryUsage;
  };
}

/**
 * Tool Execution Result
 * Result of tool execution
 */
export interface ToolResult {
  /** Execution success status */
  success: boolean;
  
  /** Result data */
  data?: any;
  
  /** Error information if execution failed */
  error?: {
    code: MCPErrorCode;
    message: string;
    details?: any;
  };
  
  /** Execution metadata */
  metadata?: {
    executionTime: number;
    memoryUsed: number;
    timestamp: Date;
  };
}

// ============================================================================
// Server Core Types
// ============================================================================

/**
 * Server Configuration
 * Configuration options for the MCP server
 */
export interface ServerConfig {
  /** Server name */
  name: string;
  
  /** Server version */
  version: string;
  
  /** Server description */
  description?: string;
  
  /** Maximum number of concurrent clients */
  maxClients: number;
  
  /** Client session timeout in milliseconds */
  clientTimeout: number;
  
  /** Memory limit in bytes */
  memoryLimit: number;
  
  /** Logging configuration */
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug';
    file?: string;
    console?: boolean;
  };
  
  /** Transport configurations */
  transports: TransportConfig[];
  
  /** Tool registration configuration */
  tools: {
    autoRegister: boolean;
    selectiveLoading: boolean;
    validationEnabled: boolean;
  };
}

/**
 * Server Statistics
 * Runtime statistics for the MCP server
 */
export interface ServerStats {
  /** Server uptime in milliseconds */
  uptime: number;
  
  /** Number of active client sessions */
  activeSessions: number;
  
  /** Total number of requests processed */
  totalRequests: number;
  
  /** Total number of tools executed */
  totalToolsExecuted: number;
  
  /** Current memory usage in bytes */
  memoryUsage: number;
  
  /** Average response time in milliseconds */
  averageResponseTime: number;
  
  /** Error rate (errors per total requests) */
  errorRate: number;
  
  /** Transport statistics */
  transportStats: Record<TransportType, TransportStats>;
}

/**
 * MCP Server Interface
 * Main server entity implementing MCP protocol compliance
 */
export interface MCPServer extends EventEmitter {
  /** Server configuration */
  readonly config: ServerConfig;
  
  /** Server statistics */
  readonly stats: ServerStats;
  
  /** Server running status */
  readonly isRunning: boolean;
  
  /** Registered tools */
  readonly tools: Map<string, Tool>;
  
  /** Active client sessions */
  readonly sessions: Map<string, ClientSession>;
  
  /** Available transports */
  readonly transports: Map<TransportType, Transport>;
  
  /** Start the server */
  start(): Promise<void>;
  
  /** Stop the server */
  stop(): Promise<void>;
  
  /** Restart the server */
  restart(): Promise<void>;
  
  /** Register a tool */
  registerTool(tool: Tool): Promise<void>;
  
  /** Unregister a tool */
  unregisterTool(toolName: string): Promise<void>;
  
  /** Get available tools */
  getAvailableTools(): Tool[];
  
  /** Execute a tool */
  executeTool(toolName: string, params: Record<string, any>, sessionId: string): Promise<ToolResult>;
  
  /** Create a new client session */
  createSession(clientId: string, transport: Transport): Promise<ClientSession>;
  
  /** Remove a client session */
  removeSession(sessionId: string): Promise<void>;
  
  /** Get server health status */
  getHealthStatus(): HealthStatus;
  
  /** Validate server configuration */
  validateConfig(): Promise<boolean>;
}

/**
 * Server Health Status
 * Health check information for monitoring
 */
export interface HealthStatus {
  /** Overall health status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  
  /** Health check timestamp */
  timestamp: Date;
  
  /** Individual component health */
  components: {
    server: boolean;
    transports: Record<TransportType, boolean>;
    tools: boolean;
    memory: boolean;
    sessions: boolean;
  };
  
  /** Health metrics */
  metrics: {
    memoryUsage: number;
    memoryLimit: number;
    activeSessions: number;
    maxSessions: number;
    errorRate: number;
  };
  
  /** Health issues */
  issues: string[];
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Generic API Response
 * Standard response format for API operations
 */
export interface ApiResponse<T = any> {
  /** Response success status */
  success: boolean;
  
  /** Response data */
  data?: T;
  
  /** Error information */
  error?: {
    code: MCPErrorCode;
    message: string;
    details?: any;
  };
  
  /** Response metadata */
  metadata?: {
    timestamp: Date;
    requestId: string;
    processingTime: number;
  };
}

/**
 * Pagination Parameters
 * Standard pagination for list operations
 */
export interface PaginationParams {
  /** Page number (1-based) */
  page: number;
  
  /** Items per page */
  limit: number;
  
  /** Sort field */
  sortBy?: string;
  
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated Response
 * Standard paginated response format
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  /** Pagination information */
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * Server Events
 * Events emitted by the MCP server
 */
export interface ServerEvents {
  'server:started': (server: MCPServer) => void;
  'server:stopped': (server: MCPServer) => void;
  'server:error': (error: Error, server: MCPServer) => void;
  
  'session:created': (session: ClientSession) => void;
  'session:removed': (sessionId: string) => void;
  'session:error': (error: Error, session: ClientSession) => void;
  
  'tool:registered': (tool: Tool) => void;
  'tool:unregistered': (toolName: string) => void;
  'tool:executed': (toolName: string, result: ToolResult, session: ClientSession) => void;
  'tool:error': (toolName: string, error: Error, session: ClientSession) => void;
  
  'transport:connected': (transport: Transport) => void;
  'transport:disconnected': (transport: Transport) => void;
  'transport:error': (error: Error, transport: Transport) => void;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for ProtocolMessage
 */
export function isProtocolMessage(obj: any): obj is ProtocolMessage {
  return (
    obj &&
    typeof obj === 'object' &&
    obj.jsonrpc === '2.0' &&
    (typeof obj.id === 'string' || typeof obj.id === 'number' || obj.id === null)
  );
}

/**
 * Type guard for Tool
 */
export function isTool(obj: any): obj is Tool {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.name === 'string' &&
    typeof obj.description === 'string' &&
    Array.isArray(obj.parameters) &&
    typeof obj.execute === 'function' &&
    typeof obj.enabled === 'boolean'
  );
}

/**
 * Type guard for ClientSession
 */
export function isClientSession(obj: any): obj is ClientSession {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.clientId === 'string' &&
    typeof obj.state === 'string' &&
    obj.transport &&
    obj.createdAt instanceof Date
  );
}

// ============================================================================
// Export All Types
// ============================================================================

export * from './index';
