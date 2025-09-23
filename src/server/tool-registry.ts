/**
 * Tool Registry Implementation
 * 
 * Implements Tool registration and discovery system with snake_case naming validation.
 * This module provides comprehensive tool management including registration,
 * validation, discovery, and execution coordination.
 * 
 * Key Features:
 * - Tool registration with validation
 * - Snake_case naming convention enforcement (no bitbucket_, mcp_, bb_ prefixes)
 * - Tool discovery and listing
 * - Category-based organization
 * - Version management
 * - Execution statistics
 * - Selective loading support
 * - Tool metadata management
 * 
 * Constitutional Requirements:
 * - Selective Tool Registration
 * - Complete API Coverage
 * - Snake_case naming convention
 * - No forbidden prefixes
 * - Tool validation and security
 */

import { EventEmitter } from 'events';
import { 
  Tool, 
  ToolParameter, 
  ToolExecutor, 
  ToolValidator,
  ToolExecutionContext,
  ToolResult,
  MCPErrorCode
} from '../types/index';

/**
 * Tool Registry Statistics
 * Tracks tool usage and performance metrics
 */
export interface ToolRegistryStats {
  totalTools: number;
  enabledTools: number;
  disabledTools: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  toolsByCategory: Record<string, number>;
  mostUsedTools: Array<{ name: string; count: number }>;
}

/**
 * Tool Registration Options
 * Configuration options for tool registration
 */
export interface ToolRegistrationOptions {
  /** Whether to validate tool parameters */
  validateParameters?: boolean;
  /** Whether to track execution statistics */
  trackStatistics?: boolean;
  /** Whether to enable tool by default */
  enabled?: boolean;
  /** Tool category for organization */
  category?: string;
  /** Tool version */
  version?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Tool Registry Implementation
 * 
 * Manages tool registration, validation, discovery, and execution
 * with full compliance to constitutional requirements.
 */
export class ToolRegistry extends EventEmitter {
  private tools: Map<string, Tool> = new Map();
  private categories: Map<string, Set<string>> = new Map();
  private executionStats: Map<string, {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    totalExecutionTime: number;
    lastExecution: Date | null;
  }> = new Map();
  
  private options: {
    validateParameters: boolean;
    trackStatistics: boolean;
    allowOverwrite: boolean;
    maxTools: number;
  };

  constructor(options: {
    validateParameters?: boolean;
    trackStatistics?: boolean;
    allowOverwrite?: boolean;
    maxTools?: number;
  } = {}) {
    super();
    
    this.options = {
      validateParameters: options.validateParameters ?? true,
      trackStatistics: options.trackStatistics ?? true,
      allowOverwrite: options.allowOverwrite ?? false,
      maxTools: options.maxTools ?? 1000
    };
  }

  /**
   * Register a tool with the registry
   * Validates tool compliance and adds to registry
   */
  async registerTool(
    tool: Tool, 
    options: ToolRegistrationOptions = {}
  ): Promise<void> {
    try {
      // Validate tool name (snake_case, no prefixes)
      this.validateToolName(tool.name);
      
      // Check tool limit
      if (this.tools.size >= this.options.maxTools) {
        throw new Error(`Maximum tools limit reached (${this.options.maxTools})`);
      }
      
      // Check if tool already exists
      if (this.tools.has(tool.name) && !this.options.allowOverwrite) {
        throw new Error(`Tool '${tool.name}' is already registered`);
      }
      
      // Validate tool structure
      this.validateTool(tool);
      
      // Create enhanced tool with options
      const enhancedTool: Tool = {
        ...tool,
        enabled: options.enabled ?? tool.enabled ?? true,
        category: options.category ?? tool.category,
        version: options.version ?? tool.version ?? '1.0.0',
        metadata: {
          ...tool.metadata,
          ...options.metadata,
          registeredAt: new Date(),
          registryOptions: options
        }
      };
      
      // Register the tool
      this.tools.set(tool.name, enhancedTool);
      
      // Add to category
      if (enhancedTool.category) {
        this.addToCategory(enhancedTool.name, enhancedTool.category);
      }
      
      // Initialize execution statistics
      if (this.options.trackStatistics) {
        this.executionStats.set(tool.name, {
          totalExecutions: 0,
          successfulExecutions: 0,
          failedExecutions: 0,
          totalExecutionTime: 0,
          lastExecution: null
        });
      }
      
      // Emit tool registered event
      this.emit('toolRegistered', enhancedTool);
      
      console.log(`Tool registered: ${tool.name} (${enhancedTool.category || 'uncategorized'})`);
      
    } catch (error) {
      this.emit('toolRegistrationError', tool.name, error);
      throw new Error(`Failed to register tool '${tool.name}': ${(error as any).message}`);
    }
  }

  /**
   * Unregister a tool from the registry
   * Removes tool and cleans up associated resources
   */
  async unregisterTool(toolName: string): Promise<boolean> {
    try {
      const tool = this.tools.get(toolName);
      if (!tool) {
        return false;
      }
      
      // Remove from category
      if (tool.category) {
        this.removeFromCategory(toolName, tool.category);
      }
      
      // Remove execution statistics
      this.executionStats.delete(toolName);
      
      // Remove the tool
      this.tools.delete(toolName);
      
      // Emit tool unregistered event
      this.emit('toolUnregistered', toolName);
      
      console.log(`Tool unregistered: ${toolName}`);
      
      return true;
      
    } catch (error) {
      this.emit('toolUnregistrationError', toolName, error);
      throw new Error(`Failed to unregister tool '${toolName}': ${(error as any).message}`);
    }
  }

  /**
   * Get tool by name
   * Retrieves tool if it exists and is enabled
   */
  getTool(toolName: string): Tool | undefined {
    const tool = this.tools.get(toolName);
    return tool && tool.enabled ? tool : undefined;
  }

  /**
   * Get all available tools
   * Returns array of enabled tools
   */
  getAvailableTools(): Tool[] {
    return Array.from(this.tools.values()).filter(tool => tool.enabled);
  }

  /**
   * Get tools by category
   * Returns tools filtered by category
   */
  getToolsByCategory(category: string): Tool[] {
    const toolNames = this.categories.get(category);
    if (!toolNames) {
      return [];
    }
    
    return Array.from(toolNames)
      .map(name => this.tools.get(name))
      .filter(tool => tool && tool.enabled) as Tool[];
  }

  /**
   * Get all categories
   * Returns array of available categories
   */
  getCategories(): string[] {
    return Array.from(this.categories.keys());
  }

  /**
   * Search tools by name or description
   * Performs case-insensitive search across tool names and descriptions
   */
  searchTools(query: string): Tool[] {
    const lowerQuery = query.toLowerCase();
    
    return Array.from(this.tools.values())
      .filter(tool => 
        tool.enabled && (
          tool.name.toLowerCase().includes(lowerQuery) ||
          tool.description.toLowerCase().includes(lowerQuery) ||
          (tool.category && tool.category.toLowerCase().includes(lowerQuery))
        )
      );
  }

  /**
   * Enable a tool
   * Enables a previously disabled tool
   */
  enableTool(toolName: string): boolean {
    const tool = this.tools.get(toolName);
    if (!tool) {
      return false;
    }
    
    (tool as any).enabled = true;
    this.emit('toolEnabled', tool);
    
    return true;
  }

  /**
   * Disable a tool
   * Disables a tool without removing it from registry
   */
  disableTool(toolName: string): boolean {
    const tool = this.tools.get(toolName);
    if (!tool) {
      return false;
    }
    
    (tool as any).enabled = false;
    this.emit('toolDisabled', tool);
    
    return true;
  }

  /**
   * Execute a tool
   * Handles tool execution with proper error handling and statistics
   */
  async executeTool(
    toolName: string, 
    params: Record<string, any>, 
    context: ToolExecutionContext
  ): Promise<ToolResult> {
    const startTime = Date.now();
    
    try {
      // Get the tool
      const tool = this.getTool(toolName);
      if (!tool) {
        throw new Error(`Tool '${toolName}' not found or disabled`);
      }
      
      // Validate parameters if enabled
      if (this.options.validateParameters) {
        this.validateToolParameters(tool, params);
      }
      
      // Execute the tool
      const result = await tool.execute(params, context);
      
      // Update statistics
      if (this.options.trackStatistics) {
        this.updateExecutionStats(toolName, startTime, true);
      }
      
      // Emit tool executed event
      this.emit('toolExecuted', toolName, result, context);
      
      return result;
      
    } catch (error) {
      // Update statistics
      if (this.options.trackStatistics) {
        this.updateExecutionStats(toolName, startTime, false);
      }
      
      // Emit tool execution error event
      this.emit('toolExecutionError', toolName, error, context);
      
      // Return error result
      return {
        success: false,
        error: {
          code: MCPErrorCode.TOOL_EXECUTION_FAILED,
          message: (error as any).message,
          details: error
        },
        metadata: {
          executionTime: Date.now() - startTime,
          memoryUsed: 0,
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Get tool execution statistics
   * Returns performance metrics for a specific tool
   */
  getToolStats(toolName: string): {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    successRate: number;
    averageExecutionTime: number;
    lastExecution: Date | null;
  } | undefined {
    const stats = this.executionStats.get(toolName);
    if (!stats) {
      return undefined;
    }
    
    return {
      ...stats,
      successRate: stats.totalExecutions > 0 ? 
        stats.successfulExecutions / stats.totalExecutions : 0,
      averageExecutionTime: stats.totalExecutions > 0 ? 
        stats.totalExecutionTime / stats.totalExecutions : 0
    };
  }

  /**
   * Get registry statistics
   * Returns comprehensive registry performance metrics
   */
  getRegistryStats(): ToolRegistryStats {
    const tools = Array.from(this.tools.values());
    const enabledTools = tools.filter(tool => tool.enabled);
    const disabledTools = tools.filter(tool => !tool.enabled);
    
    // Calculate category distribution
    const toolsByCategory: Record<string, number> = {};
    for (const [category, toolNames] of this.categories) {
      toolsByCategory[category] = toolNames.size;
    }
    
    // Calculate most used tools
    const mostUsedTools = Array.from(this.executionStats.entries())
      .map(([name, stats]) => ({ name, count: stats.totalExecutions }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Calculate overall execution statistics
    let totalExecutions = 0;
    let successfulExecutions = 0;
    let failedExecutions = 0;
    let totalExecutionTime = 0;
    
    for (const stats of this.executionStats.values()) {
      totalExecutions += stats.totalExecutions;
      successfulExecutions += stats.successfulExecutions;
      failedExecutions += stats.failedExecutions;
      totalExecutionTime += stats.totalExecutionTime;
    }
    
    return {
      totalTools: tools.length,
      enabledTools: enabledTools.length,
      disabledTools: disabledTools.length,
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      averageExecutionTime: totalExecutions > 0 ? totalExecutionTime / totalExecutions : 0,
      toolsByCategory,
      mostUsedTools
    };
  }

  /**
   * Validate tool name
   * Ensures tool name follows snake_case convention and has no forbidden prefixes
   */
  private validateToolName(name: string): void {
    // Check for forbidden prefixes
    const forbiddenPrefixes = ['bitbucket_', 'mcp_', 'bb_'];
    for (const prefix of forbiddenPrefixes) {
      if (name.startsWith(prefix)) {
        throw new Error(`Tool name cannot start with '${prefix}' prefix`);
      }
    }
    
    // Check snake_case format
    if (!/^[a-z][a-z0-9_]*$/.test(name)) {
      throw new Error('Tool name must be in snake_case format (lowercase letters, numbers, underscores only)');
    }
    
    // Check minimum length
    if (name.length < 2) {
      throw new Error('Tool name must be at least 2 characters long');
    }
    
    // Check maximum length
    if (name.length > 50) {
      throw new Error('Tool name cannot exceed 50 characters');
    }
    
    // Check for reserved names
    const reservedNames = ['list', 'call', 'initialize', 'shutdown', 'ping', 'help'];
    if (reservedNames.includes(name)) {
      throw new Error(`Tool name '${name}' is reserved`);
    }
  }

  /**
   * Validate tool structure
   * Ensures tool has required properties and valid structure
   */
  private validateTool(tool: Tool): void {
    // Check required properties
    if (!tool.name || typeof tool.name !== 'string') {
      throw new Error('Tool must have a valid name');
    }
    
    if (!tool.description || typeof tool.description !== 'string') {
      throw new Error('Tool must have a valid description');
    }
    
    if (!tool.execute || typeof tool.execute !== 'function') {
      throw new Error('Tool must have a valid execute function');
    }
    
    // Check parameters array
    if (!Array.isArray(tool.parameters)) {
      throw new Error('Tool parameters must be an array');
    }
    
    // Validate each parameter
    for (const param of tool.parameters) {
      this.validateToolParameter(param);
    }
    
    // Check for duplicate parameter names
    const paramNames = tool.parameters.map(p => p.name);
    const uniqueParamNames = new Set(paramNames);
    if (paramNames.length !== uniqueParamNames.size) {
      throw new Error('Tool parameters must have unique names');
    }
  }

  /**
   * Validate tool parameter
   * Ensures parameter has valid structure
   */
  private validateToolParameter(param: ToolParameter): void {
    if (!param.name || typeof param.name !== 'string') {
      throw new Error('Parameter must have a valid name');
    }
    
    if (!param.type || typeof param.type !== 'string') {
      throw new Error('Parameter must have a valid type');
    }
    
    const validTypes = ['string', 'number', 'boolean', 'object', 'array'];
    if (!validTypes.includes(param.type)) {
      throw new Error(`Parameter type must be one of: ${validTypes.join(', ')}`);
    }
    
    if (typeof param.required !== 'boolean') {
      throw new Error('Parameter required property must be a boolean');
    }
  }

  /**
   * Validate tool parameters against tool definition
   * Ensures provided parameters match tool requirements
   */
  private validateToolParameters(tool: Tool, params: Record<string, any>): void {
    for (const param of tool.parameters) {
      const value = params[param.name];
      
      // Check required parameters
      if (param.required && (value === undefined || value === null)) {
        throw new Error(`Required parameter '${param.name}' is missing`);
      }
      
      // Skip validation if parameter is not provided and not required
      if (value === undefined || value === null) {
        continue;
      }
      
      // Type validation
      this.validateParameterType(param.name, value, param.type);
    }
    
    // Check for unknown parameters
    const knownParamNames = new Set(tool.parameters.map(p => p.name));
    for (const paramName of Object.keys(params)) {
      if (!knownParamNames.has(paramName)) {
        throw new Error(`Unknown parameter '${paramName}'`);
      }
    }
  }

  /**
   * Validate parameter type
   * Ensures parameter value matches expected type
   */
  private validateParameterType(name: string, value: any, expectedType: string): void {
    let isValid = false;
    
    switch (expectedType) {
      case 'string':
        isValid = typeof value === 'string';
        break;
      case 'number':
        isValid = typeof value === 'number' && !isNaN(value);
        break;
      case 'boolean':
        isValid = typeof value === 'boolean';
        break;
      case 'object':
        isValid = typeof value === 'object' && value !== null && !Array.isArray(value);
        break;
      case 'array':
        isValid = Array.isArray(value);
        break;
    }
    
    if (!isValid) {
      throw new Error(`Parameter '${name}' must be of type '${expectedType}'`);
    }
  }

  /**
   * Add tool to category
   * Organizes tools by category
   */
  private addToCategory(toolName: string, category: string): void {
    if (!this.categories.has(category)) {
      this.categories.set(category, new Set());
    }
    this.categories.get(category)!.add(toolName);
  }

  /**
   * Remove tool from category
   * Removes tool from category organization
   */
  private removeFromCategory(toolName: string, category: string): void {
    const categoryTools = this.categories.get(category);
    if (categoryTools) {
      categoryTools.delete(toolName);
      if (categoryTools.size === 0) {
        this.categories.delete(category);
      }
    }
  }

  /**
   * Update execution statistics
   * Tracks tool execution performance
   */
  private updateExecutionStats(toolName: string, startTime: number, success: boolean): void {
    const stats = this.executionStats.get(toolName);
    if (!stats) {
      return;
    }
    
    const executionTime = Date.now() - startTime;
    
    stats.totalExecutions++;
    stats.totalExecutionTime += executionTime;
    stats.lastExecution = new Date();
    
    if (success) {
      stats.successfulExecutions++;
    } else {
      stats.failedExecutions++;
    }
  }
}

// Export the registry
export default ToolRegistry;
