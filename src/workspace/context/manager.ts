/**
 * Workspace Context Manager
 * 
 * Core system for managing workspace context during MCP tool execution.
 * Provides context switching, validation, and tool integration capabilities.
 */

import { EventEmitter } from 'events';
import { z } from 'zod';
import { ToolExecutionContext as MainToolExecutionContext } from '../../types/index.js';
import { WorkspaceContextProvider } from '../context.js';
import { WorkspaceManager } from '../manager.js';
import {
    WorkspaceConfig,
    WorkspaceError,
    WorkspaceErrorType
} from '../types.js';
import {
    ContextEvent,
    ContextEventType,
    ContextManagerConfig,
    ContextManagerConfigSchemaDefinition,
    ContextSwitchOperation,
    ContextValidationResult,
    EnhancedToolParameters,
    ParameterEnhancementOptions,
    ToolExecutionContextSchemaDefinition,
    ToolExecutionResult,
    WorkspaceAwareToolSchema
} from './types.js';

/**
 * Context Manager for workspace-aware MCP tool execution
 */
export class WorkspaceContextManager extends EventEmitter {
    private workspaceManager: WorkspaceManager;
    private contextProvider: WorkspaceContextProvider;
    private config: Required<ContextManagerConfig>;
    private contextStack: MainToolExecutionContext[] = [];
    private activeContext?: MainToolExecutionContext;
    private toolSchemas = new Map<string, WorkspaceAwareToolSchema>();
    private executionHistory: ToolExecutionResult[] = [];

    constructor(
        workspaceManager: WorkspaceManager,
        contextProvider: WorkspaceContextProvider,
        config?: Partial<ContextManagerConfig>
    ) {
        super();
        this.workspaceManager = workspaceManager;
        this.contextProvider = contextProvider;

        // Validate and set configuration
        const configResult = ContextManagerConfigSchemaDefinition.safeParse(config || {});
        if (!configResult.success) {
            throw new Error(`Invalid context manager configuration: ${configResult.error.message}`);
        }
        this.config = configResult.data as Required<ContextManagerConfig>;

        // Set up cleanup interval
        setInterval(() => {
            this.cleanupExpiredContexts();
        }, 60000); // Every minute
    }

    // ============================================================================
    // Context Creation and Management
    // ============================================================================

    /**
     * Create a new tool execution context
     */
    async createContext(
        toolName: string,
        workspaceId?: string,
        parentContext?: MainToolExecutionContext,
        metadata: Record<string, unknown> = {}
    ): Promise<MainToolExecutionContext> {
        const requestId = this.generateRequestId();
        const timestamp = new Date().toISOString();

        // Validate context creation parameters
        const contextData = {
            requestId,
            toolName,
            workspaceId,
            metadata,
            timestamp,
        };

        const validationResult = ToolExecutionContextSchemaDefinition.safeParse(contextData);
        if (!validationResult.success) {
            throw this.createError(
                WorkspaceErrorType.INVALID_CONFIGURATION,
                `Invalid context parameters: ${validationResult.error.message}`,
                workspaceId
            );
        }

        // Create context, handling case where parentContext is undefined
        const context: MainToolExecutionContext = {
            session: parentContext?.session || {
                id: validationResult.data.requestId,
                clientId: 'workspace-context',
                connected: true,
                lastRequest: new Date(),
                metadata: {}
            } as any,
            server: parentContext?.server || {
                id: 'workspace-server',
                name: 'Workspace MCP Server',
                version: '1.0.0',
                isRunning: true
            } as any,
            request: {
                id: validationResult.data.requestId,
                timestamp: new Date(),
                transport: parentContext?.request?.transport || 'stdio'
            },
            environment: parentContext?.environment || {
                nodeVersion: process.version,
                platform: process.platform,
                memoryUsage: process.memoryUsage()
            },
            authentication: parentContext?.authentication,
            bitbucket: parentContext?.bitbucket
        };

        // Add workspace configuration if workspace is specified
        if (workspaceId) {
            try {
                const workspace = await this.workspaceManager.getWorkspace(workspaceId);
                if (workspace) {
                    // Store workspace info in metadata since main context doesn't have workspace property
                    context.request.id = `${context.request.id}-${workspace.slug}`;
                    // Initialize authentication object with required properties
                    context.authentication = context.authentication || {
                        isAuthenticated: false
                    };
                    // Add workspace auth to authentication context
                    // TODO: Extract auth token from workspace.authConfig.credentials
                    // if (workspace.authConfig && workspace.authConfig.credentials) {
                    //     context.authentication.accessToken = workspace.authConfig.credentials.token;
                    //     context.authentication.isAuthenticated = true;
                    // }
                }
            } catch (error) {
                // Log workspace retrieval error but continue
                console.warn(`Failed to retrieve workspace ${workspaceId}:`, error);
            }
        }

        // Add to context stack if enabled
        if (this.config.enableContextSwitching) {
            if (this.contextStack.length >= this.config.maxContextStack) {
                // Remove oldest context
                this.contextStack.shift();
            }
            this.contextStack.push(context);
        }

        // Set as active context
        this.activeContext = context;

        // Emit context created event
        this.emitContextEvent(ContextEventType.CONTEXT_CREATED, context);

        return context;
    }

    /**
     * Switch to a different workspace context
     */
    async switchContext(
        toWorkspaceId: string,
        preserveAuth: boolean = true,
        switchReason: string = 'Manual switch'
    ): Promise<MainToolExecutionContext> {
        const currentContext = this.activeContext;
        // Extract workspace ID from request ID if present (stored as suffix)
        const fromWorkspaceId = currentContext?.request.id.includes('-')
            ? currentContext.request.id.split('-').pop()
            : undefined;

        if (!this.config.enableContextSwitching) {
            throw this.createError(
                WorkspaceErrorType.PERMISSION_DENIED,
                'Context switching is disabled'
            );
        }

        // Create switch operation record
        const switchOperation: ContextSwitchOperation = {
            fromWorkspaceId,
            toWorkspaceId,
            preserveAuth,
            switchReason,
            timestamp: new Date().toISOString(),
        };

        try {
            // Resolve target workspace
            const targetWorkspace = await this.workspaceManager.getWorkspace(toWorkspaceId);
            if (!targetWorkspace) {
                throw this.createError(
                    WorkspaceErrorType.WORKSPACE_NOT_FOUND,
                    `Target workspace not found: ${toWorkspaceId}`,
                    toWorkspaceId
                );
            }

            // Create new context for target workspace
            const newContext = await this.createContext(
                'context_switch',
                toWorkspaceId,
                currentContext,
                { switchOperation }
            );

            // Preserve authentication context if requested
            // Note: Cannot preserve auth context as main interface doesn't support authContext
            // if (preserveAuth && currentContext?.authContext) {
            //     newContext.authContext = { ...currentContext.authContext };
            // }

            // Emit context switched event
            this.emitContextEvent(ContextEventType.CONTEXT_SWITCHED, newContext, {
                switchOperation,
                previousContext: currentContext,
            });

            return newContext;
        } catch (error) {
            throw this.createError(
                WorkspaceErrorType.CONNECTION_FAILED,
                `Failed to switch context: ${error instanceof Error ? error.message : String(error)}`,
                toWorkspaceId
            );
        }
    }

    // ============================================================================
    // Parameter Enhancement
    // ============================================================================

    /**
     * Enhance tool parameters with workspace context
     */
    async enhanceParameters(
        toolName: string,
        parameters: Record<string, unknown>,
        options: Partial<ParameterEnhancementOptions> = {}
    ): Promise<EnhancedToolParameters> {
        const enhancementOptions: ParameterEnhancementOptions = {
            validateWorkspace: true,
            requireAuth: false,
            preserveOriginal: true,
            addWorkspaceContext: true,
            ...options,
        };

        const enhanced: EnhancedToolParameters = {
            original: enhancementOptions.preserveOriginal ? { ...parameters } : parameters,
            validation: { valid: true, errors: [] },
        };

        try {
            // Extract workspace information from parameters
            const workspaceInfo = this.extractWorkspaceFromParameters(parameters);

            if (workspaceInfo && enhancementOptions.validateWorkspace) {
                // Validate workspace
                const validationResult = await this.validateWorkspaceContext(workspaceInfo);
                if (!validationResult.valid) {
                    enhanced.validation = {
                        valid: false,
                        errors: [validationResult.error?.message || 'Workspace validation failed'],
                    };
                    return enhanced;
                }

                // Add workspace context if requested
                if (enhancementOptions.addWorkspaceContext && validationResult.workspace) {
                    enhanced.workspace = {
                        id: validationResult.workspace.id,
                        slug: validationResult.workspace.slug,
                        config: validationResult.workspace,
                    };
                }

                // Add authentication context if required
                if (enhancementOptions.requireAuth && validationResult.workspace) {
                    enhanced.auth = this.extractAuthContext(validationResult.workspace);
                }
            }

            // Validate against tool schema if available
            const toolSchema = this.toolSchemas.get(toolName);
            if (toolSchema && this.config.validateParameters) {
                const schemaValidation = this.validateAgainstSchema(parameters, toolSchema);
                if (!schemaValidation.valid) {
                    enhanced.validation = schemaValidation;
                }
            }

            return enhanced;
        } catch (error) {
            enhanced.validation = {
                valid: false,
                errors: [error instanceof Error ? error.message : String(error)],
            };
            return enhanced;
        }
    }

    // ============================================================================
    // Tool Schema Management
    // ============================================================================

    /**
     * Register a workspace-aware tool schema
     */
    registerToolSchema(schema: WorkspaceAwareToolSchema): void {
        this.toolSchemas.set(schema.name, schema);
    }

    /**
     * Get registered tool schema
     */
    getToolSchema(toolName: string): WorkspaceAwareToolSchema | undefined {
        return this.toolSchemas.get(toolName);
    }

    /**
     * Check if tool supports workspace context
     */
    supportsWorkspaceContext(toolName: string): boolean {
        const schema = this.toolSchemas.get(toolName);
        return schema?.workspaceIntegration.requiresWorkspace || false;
    }

    // ============================================================================
    // Context Validation
    // ============================================================================

    /**
     * Validate workspace context
     */
    async validateWorkspaceContext(workspaceInfo: { id?: string; slug?: string }): Promise<ContextValidationResult> {
        try {
            // Use workspace ID or slug to resolve workspace
            const workspaceIdentifier = workspaceInfo.id || workspaceInfo.slug;
            if (!workspaceIdentifier) {
                return {
                    valid: false,
                    error: this.createError(
                        WorkspaceErrorType.INVALID_CONFIGURATION,
                        'No workspace identifier provided'
                    ),
                    validatedParameters: {},
                };
            }

            // Resolve workspace
            const workspace = await this.workspaceManager.getWorkspace(workspaceIdentifier);
            if (!workspace) {
                return {
                    valid: false,
                    error: this.createError(
                        WorkspaceErrorType.WORKSPACE_NOT_FOUND,
                        `Workspace not found: ${workspaceIdentifier}`,
                        workspaceIdentifier
                    ),
                    validatedParameters: {},
                };
            }

            // Validate workspace status
            if (workspace.status !== 'active') {
                return {
                    valid: false,
                    error: this.createError(
                        WorkspaceErrorType.WORKSPACE_UNAVAILABLE,
                        `Workspace '${workspace.name}' is not active (status: ${workspace.status})`,
                        workspace.id
                    ),
                    validatedParameters: {},
                };
            }

            return {
                valid: true,
                workspace,
                validatedParameters: {
                    workspaceId: workspace.id,
                    workspaceSlug: workspace.slug,
                },
            };
        } catch (error) {
            return {
                valid: false,
                error: this.createError(
                    WorkspaceErrorType.INVALID_CONFIGURATION,
                    `Workspace validation failed: ${error instanceof Error ? error.message : String(error)}`
                ),
                validatedParameters: {},
            };
        }
    }

    // ============================================================================
    // Utility Methods
    // ============================================================================

    /**
     * Get current active context
     */
    getActiveContext(): MainToolExecutionContext | undefined {
        return this.activeContext;
    }

    /**
     * Get context stack
     */
    getContextStack(): ReadonlyArray<MainToolExecutionContext> {
        return [...this.contextStack];
    }

    /**
     * Get execution history
     */
    getExecutionHistory(limit?: number): ReadonlyArray<ToolExecutionResult> {
        const history = [...this.executionHistory];
        return limit ? history.slice(-limit) : history;
    }

    /**
     * Clean up expired contexts
     */
    private cleanupExpiredContexts(): void {
        const now = Date.now();
        const timeout = this.config.contextTimeout;

        this.contextStack = this.contextStack.filter(context => {
            const contextTime = context.request.timestamp.getTime();
            return (now - contextTime) < timeout;
        });

        this.executionHistory = this.executionHistory.filter(result => {
            const resultTime = new Date(result.context.timestamp).getTime();
            return (now - resultTime) < timeout;
        });
    }

    /**
     * Extract workspace information from parameters
     */
    private extractWorkspaceFromParameters(parameters: Record<string, unknown>): { id?: string; slug?: string } | null {
        const workspaceId = parameters.workspaceId as string;
        const workspaceSlug = parameters.workspaceSlug as string;
        const workspace = parameters.workspace as { id?: string; slug?: string };

        if (workspaceId || workspaceSlug) {
            return { id: workspaceId, slug: workspaceSlug };
        }

        if (workspace && (workspace.id || workspace.slug)) {
            return workspace;
        }

        return null;
    }

    /**
     * Extract authentication context from workspace
     */
    private extractAuthContext(workspace: WorkspaceConfig): Record<string, unknown> {
        return {
            baseUrl: workspace.baseUrl,
            // Add other non-sensitive workspace information as needed
        };
    }

    /**
     * Validate parameters against tool schema
     */
    private validateAgainstSchema(
        parameters: Record<string, unknown>,
        schema: WorkspaceAwareToolSchema
    ): { valid: boolean; errors: string[] } {
        try {
            // Create Zod schema from tool schema
            const zodSchema = z.object(schema.inputSchema.properties as Record<string, z.ZodTypeAny>);
            const result = zodSchema.safeParse(parameters);

            if (result.success) {
                return { valid: true, errors: [] };
            } else {
                return {
                    valid: false,
                    errors: result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`),
                };
            }
        } catch (error) {
            return {
                valid: false,
                errors: [`Schema validation error: ${error instanceof Error ? error.message : String(error)}`],
            };
        }
    }

    /**
     * Generate unique request ID
     */
    private generateRequestId(): string {
        return `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Create workspace error
     */
    private createError(
        type: WorkspaceErrorType,
        message: string,
        workspaceId?: string
    ): WorkspaceError {
        const error = new Error(message) as WorkspaceError;
        error.type = type;
        error.workspaceId = workspaceId;
        return error;
    }

    /**
     * Emit context event
     */
    private emitContextEvent(
        type: ContextEventType,
        context: MainToolExecutionContext,
        additionalData: Record<string, unknown> = {}
    ): void {
        const event: ContextEvent = {
            type,
            timestamp: new Date().toISOString(),
            requestId: context.request.id,
            data: additionalData,
            workspaceId: context.request.id.includes('-')
                ? context.request.id.split('-').pop()
                : undefined,
            toolName: 'unknown', // Tool name not available in main context
        };

        this.emit('contextEvent', event);
        this.emit(type, event);
    }
}