/**
 * Core Types for Bitbucket MCP Server
 * 
 * This module defines the core TypeScript interfaces and types for the
 * MCP server, including tool definitions, execution contexts, and
 * authentication integration.
 * 
 * Key Components:
 * - Tool: MCP tool definition with authentication support
 * - ToolExecutionContext: Enhanced context with authentication
 * - ToolRequest/Response: Request/response types with auth metadata
 * - MCPErrorCode: Error codes for MCP operations
 * 
 * Constitutional Requirements:
 * - MCP protocol compliance
 * - Authentication integration
 * - Comprehensive error handling
 * - Type safety and validation
 */

// ============================================================================
// Core MCP Types
// ============================================================================

/**
 * MCP Server Interface
 * Core server functionality for MCP protocol
 */
export interface MCPServer {
  /** Server identifier */
  readonly id: string;

  /** Server name */
  readonly name: string;

  /** Server version */
  readonly version: string;

  /** Whether server is running */
  readonly isRunning: boolean;

  /** Start the server */
  start(): Promise<void>;

  /** Stop the server */
  stop(): Promise<void>;

  /** Execute a tool */
  executeTool(request: ToolRequest): Promise<ToolResponse>;

  /** Get server capabilities */
  getCapabilities(): ServerCapabilities;
}

/**
 * Server Capabilities
 * Defines what the server can do
 */
export interface ServerCapabilities {
  /** Supported MCP protocol version */
  protocolVersion: string;

  /** Available tools */
  tools: string[];

  /** Authentication requirements */
  authentication: {
    required: boolean;
    methods: string[];
  };

  /** Server features */
  features: string[];
}

// ============================================================================
// Tool Definition Types
// ============================================================================

/**
 * Tool Parameter Definition
 * Defines a parameter for a tool
 */
export interface ToolParameter {
  /** Parameter name */
  name: string;

  /** Parameter type */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';

  /** Whether parameter is required */
  required: boolean;

  /** Parameter description */
  description?: string;

  /** Default value */
  default?: any;

  /** Validation constraints */
  constraints?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
  };

  /** JSON Schema validation */
  schema?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    minimum?: number;
    maximum?: number;
    enum?: any[];
    type?: string;
    properties?: Record<string, any>;
    required?: string[];
  };
}

/**
 * Tool Definition
 * Complete tool definition with authentication support
 */
export interface Tool {
  /** Tool name (snake_case) */
  name: string;

  /** Tool description */
  description: string;

  /** Tool parameters */
  parameters: ToolParameter[];

  /** Tool execution function */
  execute: ToolExecutor;

  /** Whether tool is enabled */
  enabled?: boolean;

  /** Tool category */
  category?: string;

  /** Tool version */
  version?: string;

  /** Authentication requirements */
  authentication?: {
    /** Whether authentication is required */
    required: boolean;

    /** Required permissions */
    permissions?: string[];

    /** Required scopes */
    scopes?: string[];
  };

  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Tool Executor Function
 * Executes a tool with context
 */
export type ToolExecutor = (
  params: Record<string, any>,
  context: ToolExecutionContext
) => Promise<ToolResult>;

/**
 * Tool Validator Function
 * Validates tool parameters
 */
export type ToolValidator = (
  params: Record<string, any>,
  context: ToolExecutionContext
) => Promise<boolean>;

// ============================================================================
// Execution Context Types
// ============================================================================

/**
 * Client Session
 * Represents an active client connection
 */
export interface ClientSession {
  /** Unique session identifier */
  id: string;

  /** Transport type */
  transport: {
    type: 'stdio' | 'websocket' | 'http';
    endpoint?: string;
  };

  /** Connection timestamp */
  connectedAt: Date;

  /** Last activity timestamp */
  lastActivity: Date;

  /** Session metadata */
  metadata: Record<string, any>;
}

/**
 * Tool Execution Context
 * Enhanced context with authentication support
 */
export interface ToolExecutionContext {
  /** Client session */
  session: ClientSession;

  /** MCP server instance */
  server: MCPServer;

  /** Request information */
  request: {
    id: string;
    timestamp: Date;
    transport: string;
  };

  /** Environment information */
  environment: {
    nodeVersion: string;
    platform: string;
    memoryUsage: NodeJS.MemoryUsage;
  };

  /** Authentication context */
  authentication?: {
    /** User session */
    userSession?: any; // Will be properly typed with auth types

    /** User ID */
    userId?: string;

    /** User name */
    userName?: string;

    /** User email */
    userEmail?: string;

    /** User permissions */
    permissions?: string[];

    /** Access token */
    accessToken?: string;

    /** Whether user is authenticated */
    isAuthenticated: boolean;
  };

  /** Bitbucket API context */
  bitbucket?: {
    /** Base URL */
    baseUrl?: string;

    /** Instance type */
    instanceType?: 'datacenter' | 'cloud';

    /** Access token */
    accessToken?: string;

    /** User ID */
    userId?: string;

    /** User permissions */
    permissions?: string[];
  };
}

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * Tool Request
 * Request to execute a tool
 */
export interface ToolRequest {
  /** Tool name */
  name: string;

  /** Tool arguments */
  arguments: Record<string, any>;

  /** Execution context */
  context: ToolExecutionContext;

  /** Request metadata */
  metadata?: Record<string, any>;
}

/**
 * Tool Response
 * Response from tool execution
 */
export interface ToolResponse {
  /** Whether execution was successful */
  success: boolean;

  /** Result data */
  data?: any;

  /** Error information */
  error?: {
    code: string;
    message: string;
    details?: any;
  };

  /** Response metadata */
  metadata?: {
    executionTime?: number;
    memoryUsed?: number;
    timestamp?: Date;
    authentication?: {
      isAuthenticated: boolean;
      userId?: string;
      permissions?: string[];
    };
  };
}

/**
 * MCP Request
 * Generic MCP protocol request
 */
export interface MCPRequest {
  /** Request ID */
  id: string;

  /** Request method */
  method: string;

  /** Request parameters */
  params?: Record<string, any>;

  /** Request metadata */
  metadata?: Record<string, any>;

  /** Authorization header */
  authorization?: string;

  /** Session ID */
  sessionId?: string;

  /** Access token */
  accessToken?: string;
}

/**
 * MCP Response
 * Generic MCP protocol response
 */
export interface MCPResponse {
  /** Response ID */
  id: string;

  /** Response result */
  result?: any;

  /** Response error */
  error?: {
    code: string;
    message: string;
    data?: any;
  };

  /** Response metadata */
  metadata?: Record<string, any>;
}

// ============================================================================
// Result Types
// ============================================================================

/**
 * Tool Result
 * Result from tool execution
 */
export interface ToolResult {
  /** Whether execution was successful */
  success: boolean;

  /** Result data */
  data?: any;

  /** Error information */
  error?: {
    code: MCPErrorCode;
    message: string;
    details?: any;
  };

  /** Execution metadata */
  metadata: {
    executionTime: number;
    memoryUsed: number;
    timestamp: Date;
  };
}

// ============================================================================
// Error Codes
// ============================================================================

/**
 * MCP Error Codes
 * Standard error codes for MCP operations
 */
export enum MCPErrorCode {
  // General errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  INVALID_REQUEST = 'INVALID_REQUEST',
  INVALID_PARAMS = 'INVALID_PARAMS',

  // Tool errors
  TOOL_NOT_FOUND = 'TOOL_NOT_FOUND',
  TOOL_EXECUTION_FAILED = 'TOOL_EXECUTION_FAILED',
  TOOL_VALIDATION_FAILED = 'TOOL_VALIDATION_FAILED',

  // Authentication errors
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  AUTHORIZATION_FAILED = 'AUTHORIZATION_FAILED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Bitbucket API errors
  BITBUCKET_API_ERROR = 'BITBUCKET_API_ERROR',
  BITBUCKET_PERMISSION_DENIED = 'BITBUCKET_PERMISSION_DENIED',
  BITBUCKET_RESOURCE_NOT_FOUND = 'BITBUCKET_RESOURCE_NOT_FOUND'
}

// ============================================================================
// Export all types
// ============================================================================

export * from './auth.js';
