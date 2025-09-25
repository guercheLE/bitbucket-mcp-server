/**
 * Tool Integration Helper
 *
 * Provides utilities for integrating existing MCP tools with workspace context.
 * Enables backward compatibility while adding workspace features.
 */
import { z } from 'zod';
/**
 * Tool Integration Helper Class
 */
export class ToolIntegrationHelper {
    contextManager;
    constructor(contextManager) {
        this.contextManager = contextManager;
    }
    // ============================================================================
    // Tool Schema Enhancement
    // ============================================================================
    /**
     * Enhance existing tool schema with workspace support
     */
    enhanceToolSchema(originalSchema, workspaceConfig = {}) {
        const config = {
            requiresWorkspace: false,
            supportsMultiWorkspace: false,
            workspaceParameterName: 'workspaceId',
            authenticationRequired: false,
            ...workspaceConfig,
        };
        // Add workspace parameters to schema
        const enhancedProperties = { ...originalSchema.inputSchema.properties };
        if (!config.requiresWorkspace) {
            // Add optional workspace parameters for backward compatibility
            enhancedProperties.workspaceId = {
                type: 'string',
                description: 'Optional workspace ID for workspace-specific operations',
            };
            enhancedProperties.workspaceSlug = {
                type: 'string',
                description: 'Optional workspace slug for workspace-specific operations',
            };
        }
        else {
            // Add required workspace parameter
            enhancedProperties[config.workspaceParameterName] = {
                type: 'string',
                description: 'Workspace ID or slug (required)',
            };
        }
        return {
            name: originalSchema.name,
            description: originalSchema.description,
            inputSchema: {
                type: 'object',
                properties: enhancedProperties,
                required: config.requiresWorkspace
                    ? [...(originalSchema.inputSchema.required || []), config.workspaceParameterName]
                    : originalSchema.inputSchema.required,
                workspaceOptional: !config.requiresWorkspace,
            },
            workspaceIntegration: config,
        };
    }
    // ============================================================================
    // Tool Function Wrapping
    // ============================================================================
    /**
     * Wrap an original tool function to support workspace context
     */
    wrapTool(toolName, originalFunction, config = {}) {
        const wrapperConfig = {
            requireWorkspace: false,
            allowOptionalWorkspace: true,
            preserveOriginalParams: true,
            validateWorkspace: true,
            addWorkspaceContext: true,
            ...config,
        };
        return async (params, context, workspace) => {
            // Create or use existing context
            const executionContext = context || await this.contextManager.createContext(toolName);
            try {
                // Enhance parameters with workspace context
                const enhancedParams = await this.contextManager.enhanceParameters(toolName, params, {
                    validateWorkspace: wrapperConfig.validateWorkspace,
                    preserveOriginal: wrapperConfig.preserveOriginalParams,
                    addWorkspaceContext: wrapperConfig.addWorkspaceContext,
                    requireAuth: false, // Tools handle their own auth
                });
                // Validate parameters
                if (!enhancedParams.validation.valid) {
                    throw new Error(`Parameter validation failed: ${enhancedParams.validation.errors.join(', ')}`);
                }
                // Check workspace requirement
                if (wrapperConfig.requireWorkspace && !enhancedParams.workspace) {
                    throw new Error(`Tool '${toolName}' requires a workspace but none was provided`);
                }
                // Call original function with enhanced parameters
                const originalParams = wrapperConfig.preserveOriginalParams
                    ? enhancedParams.original
                    : params;
                const result = await originalFunction(originalParams);
                // Record execution if tracking is enabled
                this.recordToolExecution(toolName, executionContext, true, undefined);
                return result;
            }
            catch (error) {
                // Record failed execution
                this.recordToolExecution(toolName, executionContext, false, error);
                throw error;
            }
        };
    }
    // ============================================================================
    // Parameter Enhancement Utilities
    // ============================================================================
    /**
     * Create workspace-aware parameter schema
     */
    createWorkspaceParameterSchema(baseSchema, requireWorkspace = false) {
        const workspaceFields = requireWorkspace
            ? {
                workspaceId: z.string().min(1, 'Workspace ID is required'),
            }
            : {
                workspaceId: z.string().optional(),
                workspaceSlug: z.string().optional(),
            };
        return baseSchema.extend(workspaceFields);
    }
    /**
     * Extract workspace context from enhanced parameters
     */
    extractWorkspaceContext(enhancedParams) {
        return {
            workspaceId: enhancedParams.workspace?.id,
            workspaceConfig: enhancedParams.workspace?.config,
            authContext: enhancedParams.auth,
        };
    }
    // ============================================================================
    // Migration Utilities
    // ============================================================================
    /**
     * Create a migration wrapper that maintains full backward compatibility
     */
    createBackwardCompatibleWrapper(toolName, originalFunction) {
        const enhanced = this.wrapTool(toolName, originalFunction, {
            requireWorkspace: false,
            allowOptionalWorkspace: true,
            preserveOriginalParams: true,
            validateWorkspace: false, // Less strict for migration
            addWorkspaceContext: true,
        });
        // Return both enhanced and original versions
        return {
            enhanced,
            original: originalFunction,
        };
    }
    /**
     * Create parameter validator for workspace-aware tools
     */
    createParameterValidator(schema) {
        return (params) => {
            try {
                // Create Zod schema from tool schema
                const properties = schema.inputSchema.properties;
                const zodFields = {};
                // Convert schema properties to Zod types (simplified)
                Object.entries(properties).forEach(([key, prop]) => {
                    if (typeof prop === 'object' && prop && 'type' in prop) {
                        switch (prop.type) {
                            case 'string':
                                zodFields[key] = z.string();
                                break;
                            case 'number':
                                zodFields[key] = z.number();
                                break;
                            case 'boolean':
                                zodFields[key] = z.boolean();
                                break;
                            default:
                                zodFields[key] = z.unknown();
                        }
                    }
                    else {
                        zodFields[key] = z.unknown();
                    }
                });
                const zodSchema = z.object(zodFields);
                const result = zodSchema.safeParse(params);
                if (result.success) {
                    return {
                        valid: true,
                        errors: [],
                        enhanced: result.data,
                    };
                }
                else {
                    return {
                        valid: false,
                        errors: result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`),
                        enhanced: params,
                    };
                }
            }
            catch (error) {
                return {
                    valid: false,
                    errors: [`Schema validation error: ${error instanceof Error ? error.message : String(error)}`],
                    enhanced: params,
                };
            }
        };
    }
    // ============================================================================
    // Private Methods
    // ============================================================================
    /**
     * Record tool execution for tracking
     */
    recordToolExecution(toolName, context, success, error) {
        try {
            // This could be extended to integrate with the context manager's execution history
            // For now, just emit an event
            this.contextManager.emit('toolExecution', {
                toolName,
                context,
                success,
                error: error instanceof Error ? error.message : String(error),
                timestamp: new Date().toISOString(),
            });
        }
        catch (recordError) {
            // Don't let recording errors affect tool execution
            console.warn('Failed to record tool execution:', recordError);
        }
    }
}
//# sourceMappingURL=integration.js.map