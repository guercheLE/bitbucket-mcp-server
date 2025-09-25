/**
 * Tool Integration Helper
 *
 * Provides utilities for integrating existing MCP tools with workspace context.
 * Enables backward compatibility while adding workspace features.
 */
import { z } from 'zod';
import { WorkspaceConfig } from '../types.js';
import { WorkspaceContextManager } from './manager.js';
import { EnhancedToolParameters, ToolExecutionContext, WorkspaceAwareToolSchema } from './types.js';
/**
 * Tool wrapper configuration
 */
export interface ToolWrapperConfig {
    requireWorkspace: boolean;
    allowOptionalWorkspace: boolean;
    preserveOriginalParams: boolean;
    validateWorkspace: boolean;
    addWorkspaceContext: boolean;
}
/**
 * Enhanced tool function signature
 */
export type EnhancedToolFunction<TParams = Record<string, unknown>, TResult = unknown> = (params: TParams, context: ToolExecutionContext, workspace?: WorkspaceConfig) => Promise<TResult>;
/**
 * Original tool function signature (for backward compatibility)
 */
export type OriginalToolFunction<TParams = Record<string, unknown>, TResult = unknown> = (params: TParams) => Promise<TResult>;
/**
 * Tool Integration Helper Class
 */
export declare class ToolIntegrationHelper {
    private contextManager;
    constructor(contextManager: WorkspaceContextManager);
    /**
     * Enhance existing tool schema with workspace support
     */
    enhanceToolSchema(originalSchema: {
        name: string;
        description: string;
        inputSchema: {
            type: 'object';
            properties: Record<string, unknown>;
            required?: string[];
        };
    }, workspaceConfig?: {
        requiresWorkspace?: boolean;
        supportsMultiWorkspace?: boolean;
        workspaceParameterName?: string;
        authenticationRequired?: boolean;
    }): WorkspaceAwareToolSchema;
    /**
     * Wrap an original tool function to support workspace context
     */
    wrapTool<TParams extends Record<string, unknown>, TResult>(toolName: string, originalFunction: OriginalToolFunction<TParams, TResult>, config?: Partial<ToolWrapperConfig>): EnhancedToolFunction<TParams, TResult>;
    /**
     * Create workspace-aware parameter schema
     */
    createWorkspaceParameterSchema(baseSchema: z.ZodObject<any>, requireWorkspace?: boolean): z.ZodType;
    /**
     * Extract workspace context from enhanced parameters
     */
    extractWorkspaceContext(enhancedParams: EnhancedToolParameters): {
        workspaceId?: string;
        workspaceConfig?: WorkspaceConfig;
        authContext?: Record<string, unknown>;
    };
    /**
     * Create a migration wrapper that maintains full backward compatibility
     */
    createBackwardCompatibleWrapper<TParams extends Record<string, unknown>, TResult>(toolName: string, originalFunction: OriginalToolFunction<TParams, TResult>): {
        enhanced: EnhancedToolFunction<TParams, TResult>;
        original: OriginalToolFunction<TParams, TResult>;
    };
    /**
     * Create parameter validator for workspace-aware tools
     */
    createParameterValidator(schema: WorkspaceAwareToolSchema): (params: Record<string, unknown>) => {
        valid: boolean;
        errors: string[];
        enhanced: Record<string, unknown>;
    };
    /**
     * Record tool execution for tracking
     */
    private recordToolExecution;
}
//# sourceMappingURL=integration.d.ts.map