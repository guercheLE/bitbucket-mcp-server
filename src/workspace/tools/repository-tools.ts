/**
 * Workspace-Aware Repository Tools
 * 
 * Enhanced repository management tools that support workspace context
 * while maintaining full backward compatibility with existing implementations.
 */

import {
    ToolIntegrationHelper,
    WorkspaceContextManager,
    type ToolExecutionContext,
    type WorkspaceAwareToolSchema,
} from '../context/index.js';

// Tool parameter types
interface RepositoryListParams extends Record<string, unknown> {
    projectKey?: string;
    limit?: number;
    start?: number;
    name?: string;
    workspaceId?: string;
    workspaceSlug?: string;
}

interface RepositoryGetParams extends Record<string, unknown> {
    projectKey: string;
    repositorySlug: string;
    workspaceId?: string;
    workspaceSlug?: string;
}

interface RepositoryCreateParams extends Record<string, unknown> {
    projectKey: string;
    name: string;
    description?: string;
    isPrivate?: boolean;
    workspaceId?: string;
    workspaceSlug?: string;
}

interface RepositoryUpdateParams extends Record<string, unknown> {
    projectKey: string;
    repositorySlug: string;
    name?: string;
    description?: string;
    isPrivate?: boolean;
    workspaceId?: string;
    workspaceSlug?: string;
}

interface RepositoryDeleteParams extends Record<string, unknown> {
    projectKey: string;
    repositorySlug: string;
    workspaceId?: string;
    workspaceSlug?: string;
}

/**
 * Workspace-Aware Repository Tools Manager
 */
export class WorkspaceRepositoryTools {
    private contextManager: WorkspaceContextManager;
    private integrationHelper: ToolIntegrationHelper;

    constructor(contextManager: WorkspaceContextManager, integrationHelper: ToolIntegrationHelper) {
        this.contextManager = contextManager;
        this.integrationHelper = integrationHelper;
    }

    // ============================================================================
    // Tool Schema Definitions
    // ============================================================================

    /**
     * Create workspace-aware tool schemas for all repository tools
     */
    createRepositoryToolSchemas(): WorkspaceAwareToolSchema[] {
        return [
            this.createRepositoryListSchema(),
            this.createRepositoryGetSchema(),
            this.createRepositoryCreateSchema(),
            this.createRepositoryUpdateSchema(),
            this.createRepositoryDeleteSchema(),
        ];
    }

    private createRepositoryListSchema(): WorkspaceAwareToolSchema {
        const originalSchema = {
            name: 'repository_list',
            description: 'List repositories in a project or across all projects with workspace context support',
            inputSchema: {
                type: 'object' as const,
                properties: {
                    projectKey: {
                        type: 'string',
                        description: 'Project key to filter repositories',
                    },
                    limit: {
                        type: 'number',
                        description: 'Maximum number of repositories to return',
                        default: 25,
                    },
                    start: {
                        type: 'number',
                        description: 'Starting index for pagination',
                        default: 0,
                    },
                    name: {
                        type: 'string',
                        description: 'Filter repositories by name',
                    },
                },
                required: [],
            },
        };

        return this.integrationHelper.enhanceToolSchema(originalSchema, {
            requiresWorkspace: false,
            supportsMultiWorkspace: true,
            authenticationRequired: true,
        });
    }

    private createRepositoryGetSchema(): WorkspaceAwareToolSchema {
        const originalSchema = {
            name: 'repository_get',
            description: 'Get details of a specific repository with workspace context support',
            inputSchema: {
                type: 'object' as const,
                properties: {
                    projectKey: {
                        type: 'string',
                        description: 'Project key containing the repository',
                    },
                    repositorySlug: {
                        type: 'string',
                        description: 'Repository slug/name',
                    },
                },
                required: ['projectKey', 'repositorySlug'],
            },
        };

        return this.integrationHelper.enhanceToolSchema(originalSchema, {
            requiresWorkspace: false,
            supportsMultiWorkspace: true,
            authenticationRequired: true,
        });
    }

    private createRepositoryCreateSchema(): WorkspaceAwareToolSchema {
        const originalSchema = {
            name: 'repository_create',
            description: 'Create a new repository with workspace context support',
            inputSchema: {
                type: 'object' as const,
                properties: {
                    projectKey: {
                        type: 'string',
                        description: 'Project key where repository will be created',
                    },
                    name: {
                        type: 'string',
                        description: 'Repository name',
                    },
                    description: {
                        type: 'string',
                        description: 'Repository description',
                    },
                    isPrivate: {
                        type: 'boolean',
                        description: 'Whether repository is private',
                        default: false,
                    },
                },
                required: ['projectKey', 'name'],
            },
        };

        return this.integrationHelper.enhanceToolSchema(originalSchema, {
            requiresWorkspace: false,
            supportsMultiWorkspace: true,
            authenticationRequired: true,
        });
    }

    private createRepositoryUpdateSchema(): WorkspaceAwareToolSchema {
        const originalSchema = {
            name: 'repository_update',
            description: 'Update repository settings with workspace context support',
            inputSchema: {
                type: 'object' as const,
                properties: {
                    projectKey: {
                        type: 'string',
                        description: 'Project key containing the repository',
                    },
                    repositorySlug: {
                        type: 'string',
                        description: 'Repository slug/name',
                    },
                    name: {
                        type: 'string',
                        description: 'New repository name',
                    },
                    description: {
                        type: 'string',
                        description: 'New repository description',
                    },
                    isPrivate: {
                        type: 'boolean',
                        description: 'New privacy setting',
                    },
                },
                required: ['projectKey', 'repositorySlug'],
            },
        };

        return this.integrationHelper.enhanceToolSchema(originalSchema, {
            requiresWorkspace: false,
            supportsMultiWorkspace: true,
            authenticationRequired: true,
        });
    }

    private createRepositoryDeleteSchema(): WorkspaceAwareToolSchema {
        const originalSchema = {
            name: 'repository_delete',
            description: 'Delete a repository with workspace context support',
            inputSchema: {
                type: 'object' as const,
                properties: {
                    projectKey: {
                        type: 'string',
                        description: 'Project key containing the repository',
                    },
                    repositorySlug: {
                        type: 'string',
                        description: 'Repository slug/name to delete',
                    },
                },
                required: ['projectKey', 'repositorySlug'],
            },
        };

        return this.integrationHelper.enhanceToolSchema(originalSchema, {
            requiresWorkspace: false,
            supportsMultiWorkspace: true,
            authenticationRequired: true,
        });
    }

    // ============================================================================
    // Tool Implementation Functions
    // ============================================================================

    /**
     * List repositories with workspace context
     */
    async repositoryList(
        params: RepositoryListParams,
        context?: ToolExecutionContext
    ): Promise<{ repositories: Array<{ name: string; slug: string; project: { key: string } }> }> {
        // Create or use existing context
        const executionContext = context || await this.contextManager.createContext('repository_list', params.workspaceId);

        // Enhance parameters with workspace context
        const enhancedParams = await this.contextManager.enhanceParameters('repository_list', params, {
            validateWorkspace: !!params.workspaceId || !!params.workspaceSlug,
            addWorkspaceContext: true,
        });

        if (!enhancedParams.validation.valid) {
            throw new Error(`Parameter validation failed: ${enhancedParams.validation.errors.join(', ')}`);
        }

        // Extract workspace context
        const workspaceContext = this.integrationHelper.extractWorkspaceContext(enhancedParams);

        // Log workspace usage (generate ID from timestamp if no requestId available)
        const logId = (executionContext as any).requestId || (executionContext as any).request?.id || Date.now().toString().slice(-6);
        console.log(`🏢 [${logId}] Repository List - Workspace: ${workspaceContext.workspaceId || 'default'}`);

        // Call original implementation with enhanced context
        // In a real implementation, this would make API calls using the workspace configuration
        return this.mockRepositoryListResponse(params, workspaceContext.workspaceConfig);
    }

    /**
     * Get repository details with workspace context
     */
    async repositoryGet(
        params: RepositoryGetParams,
        context?: ToolExecutionContext
    ): Promise<{ name: string; slug: string; project: { key: string }; description?: string }> {
        const executionContext = context || await this.contextManager.createContext('repository_get', params.workspaceId);

        const enhancedParams = await this.contextManager.enhanceParameters('repository_get', params, {
            validateWorkspace: !!params.workspaceId || !!params.workspaceSlug,
            addWorkspaceContext: true,
        });

        if (!enhancedParams.validation.valid) {
            throw new Error(`Parameter validation failed: ${enhancedParams.validation.errors.join(', ')}`);
        }

        const workspaceContext = this.integrationHelper.extractWorkspaceContext(enhancedParams);

        const logId = (executionContext as any).requestId || (executionContext as any).request?.id || Date.now().toString().slice(-6);
        console.log(`🏢 [${logId}] Repository Get - Workspace: ${workspaceContext.workspaceId || 'default'}`);

        return this.mockRepositoryGetResponse(params, workspaceContext.workspaceConfig);
    }

    /**
     * Create repository with workspace context
     */
    async repositoryCreate(
        params: RepositoryCreateParams,
        context?: ToolExecutionContext
    ): Promise<{ name: string; slug: string; project: { key: string }; links: { self: Array<{ href: string }> } }> {
        const executionContext = context || await this.contextManager.createContext('repository_create', params.workspaceId);

        const enhancedParams = await this.contextManager.enhanceParameters('repository_create', params, {
            validateWorkspace: !!params.workspaceId || !!params.workspaceSlug,
            addWorkspaceContext: true,
        });

        if (!enhancedParams.validation.valid) {
            throw new Error(`Parameter validation failed: ${enhancedParams.validation.errors.join(', ')}`);
        }

        const workspaceContext = this.integrationHelper.extractWorkspaceContext(enhancedParams);

        const logId = (executionContext as any).requestId || (executionContext as any).request?.id || Date.now().toString().slice(-6);
        console.log(`🏢 [${logId}] Repository Create - Workspace: ${workspaceContext.workspaceId || 'default'}`);

        return this.mockRepositoryCreateResponse(params, workspaceContext.workspaceConfig);
    }

    /**
     * Update repository with workspace context
     */
    async repositoryUpdate(
        params: RepositoryUpdateParams,
        context?: ToolExecutionContext
    ): Promise<{ name: string; slug: string; project: { key: string }; description?: string }> {
        const executionContext = context || await this.contextManager.createContext('repository_update', params.workspaceId);

        const enhancedParams = await this.contextManager.enhanceParameters('repository_update', params, {
            validateWorkspace: !!params.workspaceId || !!params.workspaceSlug,
            addWorkspaceContext: true,
        });

        if (!enhancedParams.validation.valid) {
            throw new Error(`Parameter validation failed: ${enhancedParams.validation.errors.join(', ')}`);
        }

        const workspaceContext = this.integrationHelper.extractWorkspaceContext(enhancedParams);

        const logId = (executionContext as any).requestId || (executionContext as any).request?.id || Date.now().toString().slice(-6);
        console.log(`🏢 [${logId}] Repository Update - Workspace: ${workspaceContext.workspaceId || 'default'}`);

        return this.mockRepositoryUpdateResponse(params, workspaceContext.workspaceConfig);
    }

    /**
     * Delete repository with workspace context
     */
    async repositoryDelete(
        params: RepositoryDeleteParams,
        context?: ToolExecutionContext
    ): Promise<{ success: boolean; message: string }> {
        const executionContext = context || await this.contextManager.createContext('repository_delete', params.workspaceId);

        const enhancedParams = await this.contextManager.enhanceParameters('repository_delete', params, {
            validateWorkspace: !!params.workspaceId || !!params.workspaceSlug,
            addWorkspaceContext: true,
        });

        if (!enhancedParams.validation.valid) {
            throw new Error(`Parameter validation failed: ${enhancedParams.validation.errors.join(', ')}`);
        }

        const workspaceContext = this.integrationHelper.extractWorkspaceContext(enhancedParams);

        const logId = (executionContext as any).requestId || (executionContext as any).request?.id || Date.now().toString().slice(-6);
        console.log(`🏢 [${logId}] Repository Delete - Workspace: ${workspaceContext.workspaceId || 'default'}`);

        return this.mockRepositoryDeleteResponse(params, workspaceContext.workspaceConfig);
    }

    // ============================================================================
    // Mock Response Functions (for demonstration)
    // ============================================================================

    private mockRepositoryListResponse(params: RepositoryListParams, workspaceConfig?: any): any {
        const workspaceName = workspaceConfig?.name || 'Default';
        return {
            repositories: [
                {
                    name: `${workspaceName} Repository 1`,
                    slug: 'repo-1',
                    project: { key: params.projectKey || 'PROJ' }
                },
                {
                    name: `${workspaceName} Repository 2`,
                    slug: 'repo-2',
                    project: { key: params.projectKey || 'PROJ' }
                },
            ],
        };
    }

    private mockRepositoryGetResponse(params: RepositoryGetParams, workspaceConfig?: any): any {
        const workspaceName = workspaceConfig?.name || 'Default';
        return {
            name: `${workspaceName} ${params.repositorySlug}`,
            slug: params.repositorySlug,
            project: { key: params.projectKey },
            description: `Repository in ${workspaceName} workspace`,
        };
    }

    private mockRepositoryCreateResponse(params: RepositoryCreateParams, workspaceConfig?: any): any {
        const workspaceName = workspaceConfig?.name || 'Default';
        const slug = params.name.toLowerCase().replace(/\s+/g, '-');
        return {
            name: params.name,
            slug,
            project: { key: params.projectKey },
            links: {
                self: [{ href: `${workspaceConfig?.baseUrl || 'https://bitbucket.local'}/projects/${params.projectKey}/repos/${slug}` }],
            },
        };
    }

    private mockRepositoryUpdateResponse(params: RepositoryUpdateParams, workspaceConfig?: any): any {
        const workspaceName = workspaceConfig?.name || 'Default';
        return {
            name: params.name || params.repositorySlug,
            slug: params.repositorySlug,
            project: { key: params.projectKey },
            description: params.description || `Updated repository in ${workspaceName} workspace`,
        };
    }

    private mockRepositoryDeleteResponse(params: RepositoryDeleteParams, workspaceConfig?: any): any {
        const workspaceName = workspaceConfig?.name || 'Default';
        return {
            success: true,
            message: `Repository ${params.repositorySlug} deleted successfully from ${workspaceName} workspace`,
        };
    }

    // ============================================================================
    // Registration Helper
    // ============================================================================

    /**
     * Register all repository tool schemas with the context manager
     */
    registerAllSchemas(): void {
        const schemas = this.createRepositoryToolSchemas();
        schemas.forEach(schema => {
            this.contextManager.registerToolSchema(schema);
        });
    }

    /**
     * Create backward compatible tool wrappers
     */
    createBackwardCompatibleWrappers(): Record<string, any> {
        return {
            repository_list: this.integrationHelper.createBackwardCompatibleWrapper(
                'repository_list',
                async (params: Record<string, unknown>) => this.repositoryList(params as RepositoryListParams)
            ),
            repository_get: this.integrationHelper.createBackwardCompatibleWrapper(
                'repository_get',
                async (params: Record<string, unknown>) => this.repositoryGet(params as RepositoryGetParams)
            ),
            repository_create: this.integrationHelper.createBackwardCompatibleWrapper(
                'repository_create',
                async (params: Record<string, unknown>) => this.repositoryCreate(params as RepositoryCreateParams)
            ),
            repository_update: this.integrationHelper.createBackwardCompatibleWrapper(
                'repository_update',
                async (params: Record<string, unknown>) => this.repositoryUpdate(params as RepositoryUpdateParams)
            ),
            repository_delete: this.integrationHelper.createBackwardCompatibleWrapper(
                'repository_delete',
                async (params: Record<string, unknown>) => this.repositoryDelete(params as RepositoryDeleteParams)
            ),
        };
    }
}