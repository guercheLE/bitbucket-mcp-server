/**
 * Workspace Context Management Types
 *
 * Defines types for managing workspace context during MCP tool execution.
 * Supports context switching, validation, and tool integration.
 */
import { z } from 'zod';
// ============================================================================
// Zod Schemas
// ============================================================================
/**
 * Schema for workspace parameter validation
 */
const WorkspaceParameterSchemaDefinition = z.object({
    workspaceId: z.string().optional(),
    workspaceSlug: z.string().optional(),
}).refine((data) => data.workspaceId || data.workspaceSlug, {
    message: "Either workspaceId or workspaceSlug must be provided",
    path: ["workspace"],
}).optional();
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
// Context Events
// ============================================================================
/**
 * Context event types
 */
var ContextEventType;
(function (ContextEventType) {
    ContextEventType["CONTEXT_CREATED"] = "context_created";
    ContextEventType["CONTEXT_SWITCHED"] = "context_switched";
    ContextEventType["CONTEXT_VALIDATED"] = "context_validated";
    ContextEventType["TOOL_EXECUTED"] = "tool_executed";
    ContextEventType["ERROR_OCCURRED"] = "error_occurred";
})(ContextEventType || (ContextEventType = {}));
// ============================================================================
// Exported Types
// ============================================================================
export { ContextEventType, ContextManagerConfigSchemaDefinition, ToolExecutionContextSchemaDefinition, WorkspaceParameterSchemaDefinition };
//# sourceMappingURL=types.js.map