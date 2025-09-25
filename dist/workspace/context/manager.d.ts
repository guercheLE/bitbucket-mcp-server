/**
 * Workspace Context Manager
 *
 * Core system for managing workspace context during MCP tool execution.
 * Provides context switching, validation, and tool integration capabilities.
 */
import { EventEmitter } from 'events';
import { ToolExecutionContext as MainToolExecutionContext } from '../../types/index.js';
import { WorkspaceContextProvider } from '../context.js';
import { WorkspaceManager } from '../manager.js';
import { ContextManagerConfig, ContextValidationResult, EnhancedToolParameters, ParameterEnhancementOptions, ToolExecutionResult, WorkspaceAwareToolSchema } from './types.js';
/**
 * Context Manager for workspace-aware MCP tool execution
 */
export declare class WorkspaceContextManager extends EventEmitter {
    private workspaceManager;
    private contextProvider;
    private config;
    private contextStack;
    private activeContext?;
    private toolSchemas;
    private executionHistory;
    constructor(workspaceManager: WorkspaceManager, contextProvider: WorkspaceContextProvider, config?: Partial<ContextManagerConfig>);
    /**
     * Create a new tool execution context
     */
    createContext(toolName: string, workspaceId?: string, parentContext?: MainToolExecutionContext, metadata?: Record<string, unknown>): Promise<MainToolExecutionContext>;
    /**
     * Switch to a different workspace context
     */
    switchContext(toWorkspaceId: string, preserveAuth?: boolean, switchReason?: string): Promise<MainToolExecutionContext>;
    /**
     * Enhance tool parameters with workspace context
     */
    enhanceParameters(toolName: string, parameters: Record<string, unknown>, options?: Partial<ParameterEnhancementOptions>): Promise<EnhancedToolParameters>;
    /**
     * Register a workspace-aware tool schema
     */
    registerToolSchema(schema: WorkspaceAwareToolSchema): void;
    /**
     * Get registered tool schema
     */
    getToolSchema(toolName: string): WorkspaceAwareToolSchema | undefined;
    /**
     * Check if tool supports workspace context
     */
    supportsWorkspaceContext(toolName: string): boolean;
    /**
     * Validate workspace context
     */
    validateWorkspaceContext(workspaceInfo: {
        id?: string;
        slug?: string;
    }): Promise<ContextValidationResult>;
    /**
     * Get current active context
     */
    getActiveContext(): MainToolExecutionContext | undefined;
    /**
     * Get context stack
     */
    getContextStack(): ReadonlyArray<MainToolExecutionContext>;
    /**
     * Get execution history
     */
    getExecutionHistory(limit?: number): ReadonlyArray<ToolExecutionResult>;
    /**
     * Clean up expired contexts
     */
    private cleanupExpiredContexts;
    /**
     * Extract workspace information from parameters
     */
    private extractWorkspaceFromParameters;
    /**
     * Extract authentication context from workspace
     */
    private extractAuthContext;
    /**
     * Validate parameters against tool schema
     */
    private validateAgainstSchema;
    /**
     * Generate unique request ID
     */
    private generateRequestId;
    /**
     * Create workspace error
     */
    private createError;
    /**
     * Emit context event
     */
    private emitContextEvent;
}
//# sourceMappingURL=manager.d.ts.map