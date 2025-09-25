/**
 * Workspace Context Management Types
 *
 * Defines types for managing workspace context during MCP tool execution.
 * Supports context switching, validation, and tool integration.
 */
import { z } from 'zod';
import { WorkspaceConfig, WorkspaceError } from '../types.js';
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
        workspaceOptional?: boolean;
    };
    workspaceIntegration: {
        requiresWorkspace: boolean;
        supportsMultiWorkspace: boolean;
        workspaceParameterName: string;
        authenticationRequired: boolean;
    };
}
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
/**
 * Schema for workspace parameter validation
 */
declare const WorkspaceParameterSchemaDefinition: z.ZodOptional<z.ZodEffects<z.ZodObject<{
    workspaceId: z.ZodOptional<z.ZodString>;
    workspaceSlug: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    workspaceId?: string | undefined;
    workspaceSlug?: string | undefined;
}, {
    workspaceId?: string | undefined;
    workspaceSlug?: string | undefined;
}>, {
    workspaceId?: string | undefined;
    workspaceSlug?: string | undefined;
}, {
    workspaceId?: string | undefined;
    workspaceSlug?: string | undefined;
}>>;
/**
 * Schema for tool execution context
 */
declare const ToolExecutionContextSchemaDefinition: z.ZodObject<{
    requestId: z.ZodString;
    toolName: z.ZodString;
    workspaceId: z.ZodOptional<z.ZodString>;
    authContext: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    timestamp: string;
    metadata: Record<string, unknown>;
    toolName: string;
    requestId: string;
    workspaceId?: string | undefined;
    authContext?: Record<string, unknown> | undefined;
}, {
    timestamp: string;
    toolName: string;
    requestId: string;
    metadata?: Record<string, unknown> | undefined;
    workspaceId?: string | undefined;
    authContext?: Record<string, unknown> | undefined;
}>;
/**
 * Schema for context manager configuration
 */
declare const ContextManagerConfigSchemaDefinition: z.ZodObject<{
    enableContextSwitching: z.ZodDefault<z.ZodBoolean>;
    maxContextStack: z.ZodDefault<z.ZodNumber>;
    contextTimeout: z.ZodDefault<z.ZodNumber>;
    validateParameters: z.ZodDefault<z.ZodBoolean>;
    trackToolExecution: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    validateParameters: boolean;
    enableContextSwitching: boolean;
    maxContextStack: number;
    contextTimeout: number;
    trackToolExecution: boolean;
}, {
    validateParameters?: boolean | undefined;
    enableContextSwitching?: boolean | undefined;
    maxContextStack?: number | undefined;
    contextTimeout?: number | undefined;
    trackToolExecution?: boolean | undefined;
}>;
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
/**
 * Context event types
 */
declare enum ContextEventType {
    CONTEXT_CREATED = "context_created",
    CONTEXT_SWITCHED = "context_switched",
    CONTEXT_VALIDATED = "context_validated",
    TOOL_EXECUTED = "tool_executed",
    ERROR_OCCURRED = "error_occurred"
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
export { ContextEventType, ContextManagerConfigSchemaDefinition, ToolExecutionContextSchemaDefinition, WorkspaceParameterSchemaDefinition };
//# sourceMappingURL=types.d.ts.map