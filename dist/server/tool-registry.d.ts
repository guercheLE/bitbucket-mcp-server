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
import { Tool, ToolExecutionContext, ToolResult } from '../types/index';
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
    mostUsedTools: Array<{
        name: string;
        count: number;
    }>;
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
    /** Authentication requirements */
    authentication?: {
        /** Whether authentication is required */
        required?: boolean;
        /** Required permissions */
        permissions?: string[];
        /** Required user groups */
        groups?: string[];
        /** Minimum permission level */
        minPermissionLevel?: 'read' | 'write' | 'admin';
    };
}
/**
 * Tool Registry Implementation
 *
 * Manages tool registration, validation, discovery, and execution
 * with full compliance to constitutional requirements.
 */
export declare class ToolRegistry extends EventEmitter {
    private tools;
    private categories;
    private executionStats;
    private options;
    constructor(options?: {
        validateParameters?: boolean;
        trackStatistics?: boolean;
        allowOverwrite?: boolean;
        maxTools?: number;
    });
    /**
     * Register a tool with the registry
     * Validates tool compliance and adds to registry
     */
    registerTool(tool: Tool, options?: ToolRegistrationOptions): Promise<void>;
    /**
     * Unregister a tool from the registry
     * Removes tool and cleans up associated resources
     */
    unregisterTool(toolName: string): Promise<boolean>;
    /**
     * Get tool by name
     * Retrieves tool if it exists and is enabled
     */
    getTool(toolName: string): Tool | undefined;
    /**
     * Get all available tools
     * Returns array of enabled tools
     */
    getAvailableTools(): Tool[];
    /**
     * Get tools by category
     * Returns tools filtered by category
     */
    getToolsByCategory(category: string): Tool[];
    /**
     * Get all categories
     * Returns array of available categories
     */
    getCategories(): string[];
    /**
     * Search tools by name or description
     * Performs case-insensitive search across tool names and descriptions
     */
    searchTools(query: string): Tool[];
    /**
     * Enable a tool
     * Enables a previously disabled tool
     */
    enableTool(toolName: string): boolean;
    /**
     * Disable a tool
     * Disables a tool without removing it from registry
     */
    disableTool(toolName: string): boolean;
    /**
     * Execute a tool
     * Handles tool execution with proper error handling, authentication, and statistics
     */
    executeTool(toolName: string, params: Record<string, any>, context: ToolExecutionContext): Promise<ToolResult>;
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
    } | undefined;
    /**
     * Get registry statistics
     * Returns comprehensive registry performance metrics
     */
    getRegistryStats(): ToolRegistryStats;
    /**
     * Validate tool name
     * Ensures tool name follows snake_case convention and has no forbidden prefixes
     */
    private validateToolName;
    /**
     * Validate tool structure
     * Ensures tool has required properties and valid structure
     */
    private validateTool;
    /**
     * Validate tool parameter
     * Ensures parameter has valid structure
     */
    private validateToolParameter;
    /**
     * Validate tool authentication requirements
     * Ensures user has proper authentication and permissions
     */
    private validateToolAuthentication;
    /**
     * Validate tool parameters against tool definition
     * Ensures provided parameters match tool requirements
     */
    private validateToolParameters;
    /**
     * Validate parameter type
     * Ensures parameter value matches expected type
     */
    private validateParameterType;
    /**
     * Add tool to category
     * Organizes tools by category
     */
    private addToCategory;
    /**
     * Remove tool from category
     * Removes tool from category organization
     */
    private removeFromCategory;
    /**
     * Update execution statistics
     * Tracks tool execution performance
     */
    private updateExecutionStats;
}
export default ToolRegistry;
//# sourceMappingURL=tool-registry.d.ts.map