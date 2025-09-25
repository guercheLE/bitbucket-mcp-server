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
import { MCPErrorCode } from '../types/index.js';
/**
 * Protocol Message Handler Implementation
 *
 * Handles MCP JSON-RPC 2.0 message processing with full protocol compliance
 * and comprehensive error handling.
 */
export class ProtocolMessageHandler extends EventEmitter {
    stats;
    messageQueue = new Map();
    processingQueue = new Set();
    options;
    constructor(options = {}) {
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
    async processMessage(rawMessage, context) {
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
            }
            else {
                // Single message
                return await this.processSingleMessage(message, context);
            }
        }
        catch (error) {
            this.updateErrorStats(error, startTime);
            this.emit('messageProcessingError', error, context);
            // Return error response
            return this.createErrorResponse(error.id || null, error.code || MCPErrorCode.INTERNAL_ERROR, error.message || 'Internal error');
        }
    }
    /**
     * Handle MCP protocol initialization
     * Processes initialize requests and establishes protocol version
     */
    async handleInitialize(message, context) {
        try {
            const params = message.params || {};
            const protocolVersion = params.protocolVersion || '2024-11-05';
            // Validate protocol version
            if (!this.isSupportedProtocolVersion(protocolVersion)) {
                throw this.createError(MCPErrorCode.INVALID_PARAMS, `Unsupported protocol version: ${protocolVersion}`);
            }
            // Update session with protocol information
            context.session.updateMetadata('protocolVersion', protocolVersion);
            context.session.updateMetadata('initialized', true);
            context.session.updateState('authenticated');
            // Return initialization response
            const response = {
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
        }
        catch (error) {
            throw this.createError(MCPErrorCode.INITIALIZATION_FAILED, `Initialization failed: ${error.message}`);
        }
    }
    /**
     * Handle tools/list request
     * Returns list of available tools for the client
     */
    async handleToolsList(message, context) {
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
            const response = {
                jsonrpc: '2.0',
                id: message.id,
                result: {
                    tools
                }
            };
            this.emit('toolsListRequested', context.session, tools.length);
            return response;
        }
        catch (error) {
            throw this.createError(MCPErrorCode.INTERNAL_ERROR, `Failed to list tools: ${error.message}`);
        }
    }
    /**
     * Handle tools/call request
     * Executes a tool with provided parameters
     */
    async handleToolsCall(message, context) {
        try {
            const params = message.params || {};
            const toolName = params.name;
            const toolParams = params.arguments || {};
            if (!toolName) {
                throw this.createError(MCPErrorCode.INVALID_PARAMS, 'Tool name is required');
            }
            // Execute the tool
            const result = await context.server.executeTool(toolName, toolParams, context.session.id);
            const response = {
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
        }
        catch (error) {
            throw this.createError(MCPErrorCode.TOOL_EXECUTION_FAILED, `Tool execution failed: ${error.message}`);
        }
    }
    /**
     * Handle ping request
     * Returns pong response for health checks
     */
    async handlePing(message, context) {
        const response = {
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
    async handleShutdown(message, context) {
        try {
            // Emit shutdown event
            this.emit('shutdownRequested', context.session);
            // Schedule server shutdown
            setTimeout(async () => {
                await context.server.stop();
            }, 1000);
            const response = {
                jsonrpc: '2.0',
                id: message.id,
                result: {
                    shutdown: true,
                    message: 'Server shutdown initiated'
                }
            };
            return response;
        }
        catch (error) {
            throw this.createError(MCPErrorCode.INTERNAL_ERROR, `Shutdown failed: ${error.message}`);
        }
    }
    /**
     * Get handler statistics
     * Returns comprehensive message processing metrics
     */
    getStats() {
        return { ...this.stats };
    }
    /**
     * Reset statistics
     * Clears all performance metrics
     */
    resetStats() {
        this.stats = this.initializeStats();
    }
    // ============================================================================
    // Private Methods
    // ============================================================================
    /**
     * Parse JSON message
     * Parses and validates JSON structure
     */
    parseMessage(rawMessage) {
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
            }
            else {
                // Single message
                if (parsed.jsonrpc !== '2.0') {
                    throw new Error('Invalid JSON-RPC version');
                }
                return parsed;
            }
        }
        catch (error) {
            throw this.createError(MCPErrorCode.PARSE_ERROR, `Failed to parse JSON: ${error.message}`);
        }
    }
    /**
     * Validate message structure
     * Ensures message follows JSON-RPC 2.0 specification
     */
    validateMessage(message) {
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
        }
        else {
            this.validateSingleMessage(message);
        }
    }
    /**
     * Validate single message
     * Validates individual message structure
     */
    validateSingleMessage(message) {
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
    async processSingleMessage(message, context) {
        // Handle notifications (no ID)
        if (message.method && message.id === undefined) {
            if (!this.options.enableNotifications) {
                throw this.createError(MCPErrorCode.INVALID_REQUEST, 'Notifications are disabled');
            }
            await this.handleNotification(message, context);
            return null; // Notifications don't return responses
        }
        // Route request to appropriate handler
        const handler = this.getMethodHandler(message.method);
        if (!handler) {
            throw this.createError(MCPErrorCode.METHOD_NOT_FOUND, `Method not found: ${message.method}`);
        }
        return await handler(message, context);
    }
    /**
     * Process batch request
     * Handles multiple messages in a single request
     */
    async processBatchRequest(messages, context) {
        const responses = [];
        for (const message of messages) {
            try {
                const response = await this.processSingleMessage(message, context);
                if (response) {
                    responses.push(response);
                }
            }
            catch (error) {
                // Add error response for failed batch items
                responses.push(this.createErrorResponse(message.id, error.code || MCPErrorCode.INTERNAL_ERROR, error.message || 'Internal error'));
            }
        }
        return responses;
    }
    /**
     * Handle notification
     * Processes notification messages (no response required)
     */
    async handleNotification(message, context) {
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
    getMethodHandler(method) {
        const handlers = {
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
    buildParameterSchema(parameters) {
        const schema = {};
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
    isSupportedProtocolVersion(version) {
        const supportedVersions = ['2024-11-05', '2024-10-07'];
        return supportedVersions.includes(version);
    }
    /**
     * Create error object
     * Creates standardized error objects
     */
    createError(code, message, id = null) {
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
    createErrorResponse(id, code, message) {
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
    updateMessageStats(message, startTime, success) {
        this.stats.totalMessages++;
        if (success) {
            this.stats.successfulMessages++;
        }
        else {
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
        }
        else {
            const type = message.method || 'response';
            this.stats.messagesByType[type] = (this.stats.messagesByType[type] || 0) + 1;
        }
    }
    /**
     * Update error statistics
     * Tracks error occurrences and types
     */
    updateErrorStats(error, startTime) {
        this.stats.failedMessages++;
        const code = error.code || MCPErrorCode.INTERNAL_ERROR;
        this.stats.errorCounts[code] = (this.stats.errorCounts[code] || 0) + 1;
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
    initializeStats() {
        return {
            totalMessages: 0,
            successfulMessages: 0,
            failedMessages: 0,
            averageProcessingTime: 0,
            messagesByType: {},
            errorCounts: {},
            lastActivity: new Date()
        };
    }
}
// Export the handler
export default ProtocolMessageHandler;
//# sourceMappingURL=protocol-handler.js.map