/**
 * Workspace-Aware Repository Tools
 *
 * Enhanced repository management tools that support workspace context
 * while maintaining full backward compatibility with existing implementations.
 */
import { ToolIntegrationHelper, WorkspaceContextManager, type ToolExecutionContext, type WorkspaceAwareToolSchema } from '../context/index.js';
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
export declare class WorkspaceRepositoryTools {
    private contextManager;
    private integrationHelper;
    constructor(contextManager: WorkspaceContextManager, integrationHelper: ToolIntegrationHelper);
    /**
     * Create workspace-aware tool schemas for all repository tools
     */
    createRepositoryToolSchemas(): WorkspaceAwareToolSchema[];
    private createRepositoryListSchema;
    private createRepositoryGetSchema;
    private createRepositoryCreateSchema;
    private createRepositoryUpdateSchema;
    private createRepositoryDeleteSchema;
    /**
     * List repositories with workspace context
     */
    repositoryList(params: RepositoryListParams, context?: ToolExecutionContext): Promise<{
        repositories: Array<{
            name: string;
            slug: string;
            project: {
                key: string;
            };
        }>;
    }>;
    /**
     * Get repository details with workspace context
     */
    repositoryGet(params: RepositoryGetParams, context?: ToolExecutionContext): Promise<{
        name: string;
        slug: string;
        project: {
            key: string;
        };
        description?: string;
    }>;
    /**
     * Create repository with workspace context
     */
    repositoryCreate(params: RepositoryCreateParams, context?: ToolExecutionContext): Promise<{
        name: string;
        slug: string;
        project: {
            key: string;
        };
        links: {
            self: Array<{
                href: string;
            }>;
        };
    }>;
    /**
     * Update repository with workspace context
     */
    repositoryUpdate(params: RepositoryUpdateParams, context?: ToolExecutionContext): Promise<{
        name: string;
        slug: string;
        project: {
            key: string;
        };
        description?: string;
    }>;
    /**
     * Delete repository with workspace context
     */
    repositoryDelete(params: RepositoryDeleteParams, context?: ToolExecutionContext): Promise<{
        success: boolean;
        message: string;
    }>;
    private mockRepositoryListResponse;
    private mockRepositoryGetResponse;
    private mockRepositoryCreateResponse;
    private mockRepositoryUpdateResponse;
    private mockRepositoryDeleteResponse;
    /**
     * Register all repository tool schemas with the context manager
     */
    registerAllSchemas(): void;
    /**
     * Create backward compatible tool wrappers
     */
    createBackwardCompatibleWrappers(): Record<string, any>;
}
export {};
//# sourceMappingURL=repository-tools.d.ts.map