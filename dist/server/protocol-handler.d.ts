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
import { ProtocolMessage, MCPErrorCode, ClientSession, MCPServer } from '../types/index.js';
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
export declare class ProtocolMessageHandler extends EventEmitter {
    private stats;
    private messageQueue;
    private processingQueue;
    private options;
    constructor(options?: {
        maxQueueSize?: number;
        processingTimeout?: number;
        enableBatchProcessing?: boolean;
        enableNotifications?: boolean;
    });
    /**
     * Process incoming message
     * Handles message parsing, validation, and routing
     */
    processMessage(rawMessage: string, context: MessageProcessingContext): Promise<ProtocolMessage | ProtocolMessage[]>;
    /**
     * Handle MCP protocol initialization
     * Processes initialize requests and establishes protocol version
     */
    handleInitialize(message: ProtocolMessage, context: MessageProcessingContext): Promise<ProtocolMessage>;
    /**
     * Handle tools/list request
     * Returns list of available tools for the client
     */
    handleToolsList(message: ProtocolMessage, context: MessageProcessingContext): Promise<ProtocolMessage>;
    /**
     * Handle tools/call request
     * Executes a tool with provided parameters
     */
    handleToolsCall(message: ProtocolMessage, context: MessageProcessingContext): Promise<ProtocolMessage>;
    /**
     * Handle ping request
     * Returns pong response for health checks
     */
    handlePing(message: ProtocolMessage, context: MessageProcessingContext): Promise<ProtocolMessage>;
    /**
     * Handle shutdown request
     * Gracefully shuts down the server
     */
    handleShutdown(message: ProtocolMessage, context: MessageProcessingContext): Promise<ProtocolMessage>;
    /**
     * Get handler statistics
     * Returns comprehensive message processing metrics
     */
    getStats(): MessageHandlerStats;
    /**
     * Reset statistics
     * Clears all performance metrics
     */
    resetStats(): void;
    /**
     * Parse JSON message
     * Parses and validates JSON structure
     */
    private parseMessage;
    /**
     * Validate message structure
     * Ensures message follows JSON-RPC 2.0 specification
     */
    private validateMessage;
    /**
     * Validate single message
     * Validates individual message structure
     */
    private validateSingleMessage;
    /**
     * Process single message
     * Handles individual message processing and routing
     */
    private processSingleMessage;
    /**
     * Process batch request
     * Handles multiple messages in a single request
     */
    private processBatchRequest;
    /**
     * Handle notification
     * Processes notification messages (no response required)
     */
    private handleNotification;
    /**
     * Get method handler
     * Returns the appropriate handler for a given method
     */
    private getMethodHandler;
    /**
     * Build parameter schema
     * Creates JSON schema for tool parameters
     */
    private buildParameterSchema;
    /**
     * Check if protocol version is supported
     * Validates protocol version compatibility
     */
    private isSupportedProtocolVersion;
    /**
     * Create error object
     * Creates standardized error objects
     */
    private createError;
    /**
     * Create error response
     * Creates standardized error response messages
     */
    private createErrorResponse;
    /**
     * Update message statistics
     * Tracks message processing performance
     */
    private updateMessageStats;
    /**
     * Update error statistics
     * Tracks error occurrences and types
     */
    private updateErrorStats;
    /**
     * Initialize statistics
     * Creates initial statistics object
     */
    private initializeStats;
}
export default ProtocolMessageHandler;
//# sourceMappingURL=protocol-handler.d.ts.map