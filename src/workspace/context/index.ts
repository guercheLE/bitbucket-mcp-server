/**
 * Workspace Context Management System
 * 
 * Provides comprehensive workspace context management for MCP tool execution.
 * Includes context switching, validation, parameter enhancement, and tool integration.
 */

// Core types and schemas
export * from './types.js';

// Context manager
export { WorkspaceContextManager } from './manager.js';

// Tool integration helper
export {
    ToolIntegrationHelper, type EnhancedToolFunction,
    type OriginalToolFunction, type ToolWrapperConfig
} from './integration.js';

// Re-export commonly used types for convenience
export type {
    ContextManagerConfig, ContextValidationResult, EnhancedToolParameters,
    ParameterEnhancementOptions, ToolExecutionContext, ToolExecutionResult, WorkspaceAwareToolSchema
} from './types.js';
