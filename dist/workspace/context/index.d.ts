/**
 * Workspace Context Management System
 *
 * Provides comprehensive workspace context management for MCP tool execution.
 * Includes context switching, validation, parameter enhancement, and tool integration.
 */
export * from './types.js';
export { WorkspaceContextManager } from './manager.js';
export { ToolIntegrationHelper, type EnhancedToolFunction, type OriginalToolFunction, type ToolWrapperConfig } from './integration.js';
export type { ContextManagerConfig, ContextValidationResult, EnhancedToolParameters, ParameterEnhancementOptions, ToolExecutionContext, ToolExecutionResult, WorkspaceAwareToolSchema } from './types.js';
//# sourceMappingURL=index.d.ts.map