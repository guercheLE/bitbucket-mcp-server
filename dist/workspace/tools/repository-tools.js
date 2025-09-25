/**
 * Workspace-Aware Repository Tools
 *
 * Enhanced repository management tools that support workspace context
 * while maintaining full backward compatibility with existing implementations.
 */
/**
 * Workspace-Aware Repository Tools Manager
 */
export class WorkspaceRepositoryTools {
    contextManager;
    integrationHelper;
    constructor(contextManager, integrationHelper) {
        this.contextManager = contextManager;
        this.integrationHelper = integrationHelper;
    }
    // ============================================================================
    // Tool Schema Definitions
    // ============================================================================
    /**
     * Create workspace-aware tool schemas for all repository tools
     */
    createRepositoryToolSchemas() {
        return [
            this.createRepositoryListSchema(),
            this.createRepositoryGetSchema(),
            this.createRepositoryCreateSchema(),
            this.createRepositoryUpdateSchema(),
            this.createRepositoryDeleteSchema(),
        ];
    }
    createRepositoryListSchema() {
        const originalSchema = {
            name: 'repository_list',
            description: 'List repositories in a project or across all projects with workspace context support',
            inputSchema: {
                type: 'object',
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
    createRepositoryGetSchema() {
        const originalSchema = {
            name: 'repository_get',
            description: 'Get details of a specific repository with workspace context support',
            inputSchema: {
                type: 'object',
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
    createRepositoryCreateSchema() {
        const originalSchema = {
            name: 'repository_create',
            description: 'Create a new repository with workspace context support',
            inputSchema: {
                type: 'object',
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
    createRepositoryUpdateSchema() {
        const originalSchema = {
            name: 'repository_update',
            description: 'Update repository settings with workspace context support',
            inputSchema: {
                type: 'object',
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
    createRepositoryDeleteSchema() {
        const originalSchema = {
            name: 'repository_delete',
            description: 'Delete a repository with workspace context support',
            inputSchema: {
                type: 'object',
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
    async repositoryList(params, context) {
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
        const logId = executionContext.requestId || executionContext.request?.id || Date.now().toString().slice(-6);
        console.log(`🏢 [${logId}] Repository List - Workspace: ${workspaceContext.workspaceId || 'default'}`);
        // Call original implementation with enhanced context
        // In a real implementation, this would make API calls using the workspace configuration
        return this.mockRepositoryListResponse(params, workspaceContext.workspaceConfig);
    }
    /**
     * Get repository details with workspace context
     */
    async repositoryGet(params, context) {
        const executionContext = context || await this.contextManager.createContext('repository_get', params.workspaceId);
        const enhancedParams = await this.contextManager.enhanceParameters('repository_get', params, {
            validateWorkspace: !!params.workspaceId || !!params.workspaceSlug,
            addWorkspaceContext: true,
        });
        if (!enhancedParams.validation.valid) {
            throw new Error(`Parameter validation failed: ${enhancedParams.validation.errors.join(', ')}`);
        }
        const workspaceContext = this.integrationHelper.extractWorkspaceContext(enhancedParams);
        const logId = executionContext.requestId || executionContext.request?.id || Date.now().toString().slice(-6);
        console.log(`🏢 [${logId}] Repository Get - Workspace: ${workspaceContext.workspaceId || 'default'}`);
        return this.mockRepositoryGetResponse(params, workspaceContext.workspaceConfig);
    }
    /**
     * Create repository with workspace context
     */
    async repositoryCreate(params, context) {
        const executionContext = context || await this.contextManager.createContext('repository_create', params.workspaceId);
        const enhancedParams = await this.contextManager.enhanceParameters('repository_create', params, {
            validateWorkspace: !!params.workspaceId || !!params.workspaceSlug,
            addWorkspaceContext: true,
        });
        if (!enhancedParams.validation.valid) {
            throw new Error(`Parameter validation failed: ${enhancedParams.validation.errors.join(', ')}`);
        }
        const workspaceContext = this.integrationHelper.extractWorkspaceContext(enhancedParams);
        const logId = executionContext.requestId || executionContext.request?.id || Date.now().toString().slice(-6);
        console.log(`🏢 [${logId}] Repository Create - Workspace: ${workspaceContext.workspaceId || 'default'}`);
        return this.mockRepositoryCreateResponse(params, workspaceContext.workspaceConfig);
    }
    /**
     * Update repository with workspace context
     */
    async repositoryUpdate(params, context) {
        const executionContext = context || await this.contextManager.createContext('repository_update', params.workspaceId);
        const enhancedParams = await this.contextManager.enhanceParameters('repository_update', params, {
            validateWorkspace: !!params.workspaceId || !!params.workspaceSlug,
            addWorkspaceContext: true,
        });
        if (!enhancedParams.validation.valid) {
            throw new Error(`Parameter validation failed: ${enhancedParams.validation.errors.join(', ')}`);
        }
        const workspaceContext = this.integrationHelper.extractWorkspaceContext(enhancedParams);
        const logId = executionContext.requestId || executionContext.request?.id || Date.now().toString().slice(-6);
        console.log(`🏢 [${logId}] Repository Update - Workspace: ${workspaceContext.workspaceId || 'default'}`);
        return this.mockRepositoryUpdateResponse(params, workspaceContext.workspaceConfig);
    }
    /**
     * Delete repository with workspace context
     */
    async repositoryDelete(params, context) {
        const executionContext = context || await this.contextManager.createContext('repository_delete', params.workspaceId);
        const enhancedParams = await this.contextManager.enhanceParameters('repository_delete', params, {
            validateWorkspace: !!params.workspaceId || !!params.workspaceSlug,
            addWorkspaceContext: true,
        });
        if (!enhancedParams.validation.valid) {
            throw new Error(`Parameter validation failed: ${enhancedParams.validation.errors.join(', ')}`);
        }
        const workspaceContext = this.integrationHelper.extractWorkspaceContext(enhancedParams);
        const logId = executionContext.requestId || executionContext.request?.id || Date.now().toString().slice(-6);
        console.log(`🏢 [${logId}] Repository Delete - Workspace: ${workspaceContext.workspaceId || 'default'}`);
        return this.mockRepositoryDeleteResponse(params, workspaceContext.workspaceConfig);
    }
    // ============================================================================
    // Mock Response Functions (for demonstration)
    // ============================================================================
    mockRepositoryListResponse(params, workspaceConfig) {
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
    mockRepositoryGetResponse(params, workspaceConfig) {
        const workspaceName = workspaceConfig?.name || 'Default';
        return {
            name: `${workspaceName} ${params.repositorySlug}`,
            slug: params.repositorySlug,
            project: { key: params.projectKey },
            description: `Repository in ${workspaceName} workspace`,
        };
    }
    mockRepositoryCreateResponse(params, workspaceConfig) {
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
    mockRepositoryUpdateResponse(params, workspaceConfig) {
        const workspaceName = workspaceConfig?.name || 'Default';
        return {
            name: params.name || params.repositorySlug,
            slug: params.repositorySlug,
            project: { key: params.projectKey },
            description: params.description || `Updated repository in ${workspaceName} workspace`,
        };
    }
    mockRepositoryDeleteResponse(params, workspaceConfig) {
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
    registerAllSchemas() {
        const schemas = this.createRepositoryToolSchemas();
        schemas.forEach(schema => {
            this.contextManager.registerToolSchema(schema);
        });
    }
    /**
     * Create backward compatible tool wrappers
     */
    createBackwardCompatibleWrappers() {
        return {
            repository_list: this.integrationHelper.createBackwardCompatibleWrapper('repository_list', async (params) => this.repositoryList(params)),
            repository_get: this.integrationHelper.createBackwardCompatibleWrapper('repository_get', async (params) => this.repositoryGet(params)),
            repository_create: this.integrationHelper.createBackwardCompatibleWrapper('repository_create', async (params) => this.repositoryCreate(params)),
            repository_update: this.integrationHelper.createBackwardCompatibleWrapper('repository_update', async (params) => this.repositoryUpdate(params)),
            repository_delete: this.integrationHelper.createBackwardCompatibleWrapper('repository_delete', async (params) => this.repositoryDelete(params)),
        };
    }
}
//# sourceMappingURL=repository-tools.js.map