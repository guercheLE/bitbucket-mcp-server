/**
 * Protocol Message Handler Implementation
 * 
 * Implements MCP JSON-RPC 2.0 message processing for the MCP server infrastructure.
 * This module provides comprehensive message handling including parsing, validation,
 * routing, and response generation with full protocol compliance.
 * 
 * Key Features:
 * - MCP JSON-RPC 2.0 protocol compliance
 * - Message parsing and validation
 * - Request/response routing
 * - Error handling and reporting
 * - Batch request support
 * - Notification handling
 * - Protocol version negotiation
 * - Message queuing and processing
 * - Performance monitoring
 * 
 * Constitutional Requirements:
 * - MCP Protocol First
 * - Complete API Coverage
 * - Error handling and logging
 * - Memory efficiency (<1GB limit)
 * - Performance optimization
 */

import { EventEmitter } from 'events';
import { 
  ProtocolMessage, 
  MCPErrorCode,
  ClientSession,
  MCPServer,
  Tool,
  ApiResponse
} from '../types/index.js';

/**
 * Message Handler Statistics
 * Performance metrics for message processing
 */
export interface MessageHandlerStats {
  totalMessages: number;
  successfulMessages: number;
  failedMessages: number;
  averageProcessingTime: number;
  messagesByType: Record<string, number>;
  errorCounts: Record<MCPErrorCode, number>;
  lastActivity: Date;
}

/**
 * Message Processing Context
 * Context information for message processing
 */
export interface MessageProcessingContext {
  session: ClientSession;
  server: MCPServer;
  transport: any;
  timestamp: Date;
  requestId: string;
}

/**
 * Protocol Message Handler Implementation
 * 
 * Handles MCP JSON-RPC 2.0 message processing with full protocol compliance
 * and comprehensive error handling.
 */
export class ProtocolMessageHandler extends EventEmitter {
  private stats: MessageHandlerStats;
  private messageQueue: Map<string, ProtocolMessage> = new Map();
  private processingQueue: Set<string> = new Set();
  private options: {
    maxQueueSize: number;
    processingTimeout: number;
    enableBatchProcessing: boolean;
    enableNotifications: boolean;
  };

  constructor(options: {
    maxQueueSize?: number;
    processingTimeout?: number;
    enableBatchProcessing?: boolean;
    enableNotifications?: boolean;
  } = {}) {
    super();
    
    this.options = {
      maxQueueSize: options.maxQueueSize ?? 1000,
      processingTimeout: options.processingTimeout ?? 30000,
      enableBatchProcessing: options.enableBatchProcessing ?? true,
      enableNotifications: options.enableNotifications ?? true
    };
    
    this.stats = this.initializeStats();
  }

  /**
   * Process incoming message
   * Handles message parsing, validation, and routing
   */
  async processMessage(
    rawMessage: string, 
    context: MessageProcessingContext
  ): Promise<ProtocolMessage | ProtocolMessage[]> {
    const startTime = Date.now();
    
    try {
      // Parse JSON message
      const message = this.parseMessage(rawMessage);
      
      // Validate message structure
      this.validateMessage(message);
      
      // Update statistics
      this.updateMessageStats(message, startTime, true);
      
      // Process message based on type
      if (Array.isArray(message)) {
        // Batch request
        if (!this.options.enableBatchProcessing) {
          throw this.createError(MCPErrorCode.INVALID_REQUEST, 'Batch processing is disabled');
        }
        return await this.processBatchRequest(message, context);
      } else {
        // Single message
        return await this.processSingleMessage(message, context);
      }
      
    } catch (error) {
      this.updateErrorStats(error, startTime);
      this.emit('messageProcessingError', error, context);
      
      // Return error response
      return this.createErrorResponse(
        (error as any).id || null,
        (error as any).code || MCPErrorCode.INTERNAL_ERROR,
        (error as any).message || 'Internal error'
      );
    }
  }

  /**
   * Handle MCP protocol initialization
   * Processes initialize requests and establishes protocol version
   */
  async handleInitialize(
    message: ProtocolMessage, 
    context: MessageProcessingContext
  ): Promise<ProtocolMessage> {
    try {
      const params = message.params || {};
      const protocolVersion = params.protocolVersion || '2024-11-05';
      
      // Validate protocol version
      if (!this.isSupportedProtocolVersion(protocolVersion)) {
        throw this.createError(
          MCPErrorCode.INVALID_PARAMS,
          `Unsupported protocol version: ${protocolVersion}`
        );
      }
      
      // Update session with protocol information
      context.session.updateMetadata('protocolVersion', protocolVersion);
      context.session.updateMetadata('initialized', true);
      context.session.updateState('authenticated' as any);
      
      // Return initialization response
      const response: ProtocolMessage = {
        jsonrpc: '2.0',
        id: message.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {
              listChanged: true
            },
            logging: {
              level: 'info'
            }
          },
          serverInfo: {
            name: context.server.config.name,
            version: context.server.config.version
          }
        }
      };
      
      this.emit('clientInitialized', context.session, protocolVersion);
      
      return response;
      
    } catch (error) {
      throw this.createError(
        MCPErrorCode.INITIALIZATION_FAILED,
        `Initialization failed: ${(error as any).message}`
      );
    }
  }

  /**
   * Handle tools/list request
   * Returns list of available tools for the client
   */
  async handleToolsList(
    message: ProtocolMessage, 
    context: MessageProcessingContext
  ): Promise<ProtocolMessage> {
    try {
      const availableTools = context.server.getAvailableTools();
      
      const tools = availableTools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: {
          type: 'object',
          properties: this.buildParameterSchema(tool.parameters),
          required: tool.parameters
            .filter(param => param.required)
            .map(param => param.name)
        }
      }));
      
      const response: ProtocolMessage = {
        jsonrpc: '2.0',
        id: message.id,
        result: {
          tools
        }
      };
      
      this.emit('toolsListRequested', context.session, tools.length);
      
      return response;
      
    } catch (error) {
      throw this.createError(
        MCPErrorCode.INTERNAL_ERROR,
        `Failed to list tools: ${(error as any).message}`
      );
    }
  }

  /**
   * Handle tools/call request
   * Executes a tool with provided parameters
   */
  async handleToolsCall(
    message: ProtocolMessage, 
    context: MessageProcessingContext
  ): Promise<ProtocolMessage> {
    try {
      const params = message.params || {};
      const toolName = params.name;
      const toolParams = params.arguments || {};
      
      if (!toolName) {
        throw this.createError(
          MCPErrorCode.INVALID_PARAMS,
          'Tool name is required'
        );
      }
      
      // Execute the tool
      const result = await context.server.executeTool(toolName, toolParams, context.session.id);
      
      const response: ProtocolMessage = {
        jsonrpc: '2.0',
        id: message.id,
        result: {
          content: result.success ? result.data : null,
          isError: !result.success
        }
      };
      
      if (!result.success && result.error) {
        response.error = {
          code: result.error.code,
          message: result.error.message,
          data: result.error.details
        };
      }
      
      this.emit('toolExecuted', toolName, result, context.session);
      
      return response;
      
    } catch (error) {
      throw this.createError(
        MCPErrorCode.TOOL_EXECUTION_FAILED,
        `Tool execution failed: ${(error as any).message}`
      );
    }
  }

  /**
   * Handle ping request
   * Returns pong response for health checks
   */
  async handlePing(
    message: ProtocolMessage, 
    context: MessageProcessingContext
  ): Promise<ProtocolMessage> {
    const response: ProtocolMessage = {
      jsonrpc: '2.0',
      id: message.id,
      result: {
        pong: true,
        timestamp: new Date().toISOString(),
        serverTime: Date.now()
      }
    };
    
    this.emit('pingReceived', context.session);
    
    return response;
  }

  /**
   * Handle shutdown request
   * Gracefully shuts down the server
   */
  async handleShutdown(
    message: ProtocolMessage, 
    context: MessageProcessingContext
  ): Promise<ProtocolMessage> {
    try {
      // Emit shutdown event
      this.emit('shutdownRequested', context.session);
      
      // Schedule server shutdown
      setTimeout(async () => {
        await context.server.stop();
      }, 1000);
      
      const response: ProtocolMessage = {
        jsonrpc: '2.0',
        id: message.id,
        result: {
          shutdown: true,
          message: 'Server shutdown initiated'
        }
      };
      
      return response;
      
    } catch (error) {
      throw this.createError(
        MCPErrorCode.INTERNAL_ERROR,
        `Shutdown failed: ${(error as any).message}`
      );
    }
  }

  /**
   * Get handler statistics
   * Returns comprehensive message processing metrics
   */
  getStats(): MessageHandlerStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   * Clears all performance metrics
   */
  resetStats(): void {
    this.stats = this.initializeStats();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Parse JSON message
   * Parses and validates JSON structure
   */
  private parseMessage(rawMessage: string): ProtocolMessage | ProtocolMessage[] {
    try {
      const parsed = JSON.parse(rawMessage);
      
      // Validate JSON-RPC version
      if (Array.isArray(parsed)) {
        // Batch request
        for (const message of parsed) {
          if (message.jsonrpc !== '2.0') {
            throw new Error('Invalid JSON-RPC version in batch request');
          }
        }
        return parsed;
      } else {
        // Single message
        if (parsed.jsonrpc !== '2.0') {
          throw new Error('Invalid JSON-RPC version');
        }
        return parsed;
      }
      
    } catch (error) {
      throw this.createError(
        MCPErrorCode.PARSE_ERROR,
        `Failed to parse JSON: ${(error as any).message}`
      );
    }
  }

  /**
   * Validate message structure
   * Ensures message follows JSON-RPC 2.0 specification
   */
  private validateMessage(message: ProtocolMessage | ProtocolMessage[]): void {
    if (Array.isArray(message)) {
      // Validate batch request
      if (message.length === 0) {
        throw this.createError(MCPErrorCode.INVALID_REQUEST, 'Empty batch request');
      }
      
      if (message.length > 100) {
        throw this.createError(MCPErrorCode.INVALID_REQUEST, 'Batch request too large');
      }
      
      for (const msg of message) {
        this.validateSingleMessage(msg);
      }
    } else {
      this.validateSingleMessage(message);
    }
  }

  /**
   * Validate single message
   * Validates individual message structure
   */
  private validateSingleMessage(message: ProtocolMessage): void {
    // Check required fields
    if (!message.jsonrpc || message.jsonrpc !== '2.0') {
      throw this.createError(MCPErrorCode.INVALID_REQUEST, 'Invalid jsonrpc field');
    }
    
    // Check for method or result/error
    if (!message.method && !message.result && !message.error) {
      throw this.createError(MCPErrorCode.INVALID_REQUEST, 'Message must have method, result, or error');
    }
    
    // Validate ID for requests and responses
    if (message.method && message.id === undefined) {
      throw this.createError(MCPErrorCode.INVALID_REQUEST, 'Request must have id');
    }
    
    // Validate error structure
    if (message.error) {
      if (typeof message.error.code !== 'number') {
        throw this.createError(MCPErrorCode.INVALID_REQUEST, 'Error code must be a number');
      }
      if (typeof message.error.message !== 'string') {
        throw this.createError(MCPErrorCode.INVALID_REQUEST, 'Error message must be a string');
      }
    }
  }

  /**
   * Process single message
   * Handles individual message processing and routing
   */
  private async processSingleMessage(
    message: ProtocolMessage, 
    context: MessageProcessingContext
  ): Promise<ProtocolMessage> {
    // Handle notifications (no ID)
    if (message.method && message.id === undefined) {
      if (!this.options.enableNotifications) {
        throw this.createError(MCPErrorCode.INVALID_REQUEST, 'Notifications are disabled');
      }
      
      await this.handleNotification(message, context);
      return null as any; // Notifications don't return responses
    }
    
    // Route request to appropriate handler
    const handler = this.getMethodHandler(message.method!);
    if (!handler) {
      throw this.createError(
        MCPErrorCode.METHOD_NOT_FOUND,
        `Method not found: ${message.method}`
      );
    }
    
    return await handler(message, context);
  }

  /**
   * Process batch request
   * Handles multiple messages in a single request
   */
  private async processBatchRequest(
    messages: ProtocolMessage[], 
    context: MessageProcessingContext
  ): Promise<ProtocolMessage[]> {
    const responses: ProtocolMessage[] = [];
    
    for (const message of messages) {
      try {
        const response = await this.processSingleMessage(message, context);
        if (response) {
          responses.push(response);
        }
      } catch (error) {
        // Add error response for failed batch items
        responses.push(this.createErrorResponse(
          message.id,
          (error as any).code || MCPErrorCode.INTERNAL_ERROR,
          (error as any).message || 'Internal error'
        ));
      }
    }
    
    return responses;
  }

  /**
   * Handle notification
   * Processes notification messages (no response required)
   */
  private async handleNotification(
    message: ProtocolMessage, 
    context: MessageProcessingContext
  ): Promise<void> {
    this.emit('notificationReceived', message, context);
    
    // Handle specific notification types
    switch (message.method) {
      case 'notifications/initialized':
        this.emit('clientInitialized', context.session);
        break;
      default:
        console.log(`Unhandled notification: ${message.method}`);
    }
  }

  /**
   * Get method handler
   * Returns the appropriate handler for a given method
   */
  private getMethodHandler(method: string): ((message: ProtocolMessage, context: MessageProcessingContext) => Promise<ProtocolMessage>) | null {
    const handlers: Record<string, (message: ProtocolMessage, context: MessageProcessingContext) => Promise<ProtocolMessage>> = {
      'initialize': this.handleInitialize.bind(this),
      'tools/list': this.handleToolsList.bind(this),
      'tools/call': this.handleToolsCall.bind(this),
      'ping': this.handlePing.bind(this),
      'shutdown': this.handleShutdown.bind(this)
    };
    
    return handlers[method] || null;
  }

  /**
   * Build parameter schema
   * Creates JSON schema for tool parameters
   */
  private buildParameterSchema(parameters: any[]): Record<string, any> {
    const schema: Record<string, any> = {};
    
    for (const param of parameters) {
      schema[param.name] = {
        type: param.type,
        description: param.description
      };
      
      if (param.default !== undefined) {
        schema[param.name].default = param.default;
      }
      
      if (param.schema) {
        schema[param.name] = { ...schema[param.name], ...param.schema };
      }
    }
    
    return schema;
  }

  /**
   * Check if protocol version is supported
   * Validates protocol version compatibility
   */
  private isSupportedProtocolVersion(version: string): boolean {
    const supportedVersions = ['2024-11-05', '2024-10-07'];
    return supportedVersions.includes(version);
  }

  /**
   * Create error object
   * Creates standardized error objects
   */
  private createError(code: MCPErrorCode, message: string, id: string | number | null = null): any {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message
      }
    };
  }

  /**
   * Create error response
   * Creates standardized error response messages
   */
  private createErrorResponse(id: string | number | null, code: MCPErrorCode, message: string): ProtocolMessage {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message
      }
    };
  }

  /**
   * Update message statistics
   * Tracks message processing performance
   */
  private updateMessageStats(message: ProtocolMessage | ProtocolMessage[], startTime: number, success: boolean): void {
    this.stats.totalMessages++;
    
    if (success) {
      this.stats.successfulMessages++;
    } else {
      this.stats.failedMessages++;
    }
    
    const processingTime = Date.now() - startTime;
    this.stats.averageProcessingTime = 
      (this.stats.averageProcessingTime * (this.stats.totalMessages - 1) + processingTime) / 
      this.stats.totalMessages;
    
    this.stats.lastActivity = new Date();
    
    // Track message types
    if (Array.isArray(message)) {
      this.stats.messagesByType['batch'] = (this.stats.messagesByType['batch'] || 0) + 1;
    } else {
      const type = message.method || 'response';
      this.stats.messagesByType[type] = (this.stats.messagesByType[type] || 0) + 1;
    }
  }

  /**
   * Update error statistics
   * Tracks error occurrences and types
   */
  private updateErrorStats(error: any, startTime: number): void {
    this.stats.failedMessages++;
    
    const code = (error as any).code || MCPErrorCode.INTERNAL_ERROR;
    this.stats.errorCounts[code as MCPErrorCode] = (this.stats.errorCounts[code as MCPErrorCode] || 0) + 1;
    
    const processingTime = Date.now() - startTime;
    this.stats.averageProcessingTime = 
      (this.stats.averageProcessingTime * (this.stats.totalMessages - 1) + processingTime) / 
      this.stats.totalMessages;
    
    this.stats.lastActivity = new Date();
  }

  /**
   * Initialize statistics
   * Creates initial statistics object
   */
  private initializeStats(): MessageHandlerStats {
    return {
      totalMessages: 0,
      successfulMessages: 0,
      failedMessages: 0,
      averageProcessingTime: 0,
      messagesByType: {},
      errorCounts: {} as Record<MCPErrorCode, number>,
      lastActivity: new Date()
    };
  }
}

// Export the handler
export default ProtocolMessageHandler;
