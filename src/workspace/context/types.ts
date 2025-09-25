/**
 * Workspace Context Management Types
 * 
 * Defines types for managing workspace context during MCP tool execution.
 * Supports context switching, validation, and tool integration.
 */

import { z } from 'zod';
import { WorkspaceConfig, WorkspaceError } from '../types.js';

// ============================================================================
// Tool Context Types
// ============================================================================

/**
 * Tool execution context with workspace information
 */
export interface ToolExecutionContext {
    requestId: string;
    toolName: string;
    workspaceId?: string;
    workspace?: WorkspaceConfig;
    authContext?: Record<string, unknown>;
    parentContext?: ToolExecutionContext;
    metadata: Record<string, unknown>;
    timestamp: string;
}

/**
 * Context validation result
 */
export interface ContextValidationResult {
    valid: boolean;
    workspace?: WorkspaceConfig;
    error?: WorkspaceError;
    validatedParameters: Record<string, unknown>;
}

/**
 * Tool parameter schema with workspace support
 */
export interface WorkspaceAwareToolSchema {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, unknown>;
        required?: string[];
        workspaceOptional?: boolean; // Indicates workspace parameter is optional for backward compatibility
    };
    workspaceIntegration: {
        requiresWorkspace: boolean;
        supportsMultiWorkspace: boolean;
        workspaceParameterName: string;
        authenticationRequired: boolean;
    };
}

// ============================================================================
// Context Management Types
// ============================================================================

/**
 * Context manager configuration
 */
export interface ContextManagerConfig {
    enableContextSwitching: boolean;
    maxContextStack: number;
    contextTimeout: number;
    validateParameters: boolean;
    trackToolExecution: boolean;
}

/**
 * Context switch operation
 */
export interface ContextSwitchOperation {
    fromWorkspaceId?: string;
    toWorkspaceId: string;
    preserveAuth: boolean;
    switchReason: string;
    timestamp: string;
}

/**
 * Tool execution result with context
 */
export interface ToolExecutionResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: WorkspaceError;
    context: ToolExecutionContext;
    executionTime: number;
    workspaceChanged: boolean;
}

// ============================================================================
// Zod Schemas
// ============================================================================

/**
 * Schema for workspace parameter validation
 */
const WorkspaceParameterSchemaDefinition = z.object({
    workspaceId: z.string().optional(),
    workspaceSlug: z.string().optional(),
}).refine(
    (data) => data.workspaceId || data.workspaceSlug,
    {
        message: "Either workspaceId or workspaceSlug must be provided",
        path: ["workspace"],
    }
).optional();

/**
 * Schema for tool execution context
 */
const ToolExecutionContextSchemaDefinition = z.object({
    requestId: z.string(),
    toolName: z.string(),
    workspaceId: z.string().optional(),
    authContext: z.record(z.string(), z.unknown()).optional(),
    metadata: z.record(z.string(), z.unknown()).default({}),
    timestamp: z.string(),
});

/**
 * Schema for context manager configuration
 */
const ContextManagerConfigSchemaDefinition = z.object({
    enableContextSwitching: z.boolean().default(true),
    maxContextStack: z.number().positive().default(10),
    contextTimeout: z.number().positive().default(300000), // 5 minutes
    validateParameters: z.boolean().default(true),
    trackToolExecution: z.boolean().default(true),
});

// ============================================================================
// Parameter Enhancement Types
// ============================================================================

/**
 * Enhanced parameters with workspace context
 */
export interface EnhancedToolParameters {
    original: Record<string, unknown>;
    workspace?: {
        id: string;
        slug: string;
        config: WorkspaceConfig;
    };
    auth?: Record<string, unknown>;
    validation: {
        valid: boolean;
        errors: string[];
    };
}

/**
 * Parameter enhancement options
 */
export interface ParameterEnhancementOptions {
    validateWorkspace: boolean;
    requireAuth: boolean;
    preserveOriginal: boolean;
    addWorkspaceContext: boolean;
}

// ============================================================================
// Context Events
// ============================================================================

/**
 * Context event types
 */
enum ContextEventType {
    CONTEXT_CREATED = 'context_created',
    CONTEXT_SWITCHED = 'context_switched',
    CONTEXT_VALIDATED = 'context_validated',
    TOOL_EXECUTED = 'tool_executed',
    ERROR_OCCURRED = 'error_occurred',
}

/**
 * Context event data
 */
export interface ContextEvent {
    type: ContextEventType;
    timestamp: string;
    requestId: string;
    data: Record<string, unknown>;
    workspaceId?: string;
    toolName?: string;
}

// ============================================================================
// Exported Types
// ============================================================================

export {
    ContextEventType, ContextManagerConfigSchemaDefinition, ToolExecutionContextSchemaDefinition, WorkspaceParameterSchemaDefinition
};
