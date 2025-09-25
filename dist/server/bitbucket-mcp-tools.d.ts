/**
 * Bitbucket MCP Tools Implementation
 *
 * This module defines and implements all Bitbucket MCP tools with
 * authentication support, including repository, project, pull request,
 * and user management tools.
 *
 * Key Features:
 * - Complete Bitbucket API coverage
 * - Authentication-aware tool execution
 * - Comprehensive error handling
 * - User context in responses
 * - Permission-based access control
 *
 * Constitutional Requirements:
 * - MCP protocol compliance
 * - OAuth 2.0 authentication
 * - Secure API communication
 * - Comprehensive error handling
 */
import { Tool } from '../types/index.js';
import { BitbucketToolsIntegration } from './auth/bitbucket-tools-integration.js';
/**
 * Bitbucket MCP Tools Registry
 * Manages all Bitbucket-related MCP tools
 */
export declare class BitbucketMCPTools {
    private toolsIntegration;
    constructor(toolsIntegration: BitbucketToolsIntegration);
    /**
     * Get all available Bitbucket MCP tools
     */
    getTools(): Tool[];
    private createRepositoryListTool;
    private createRepositoryGetTool;
    private createRepositoryCreateTool;
    private createRepositoryUpdateTool;
    private createRepositoryDeleteTool;
    private createProjectListTool;
    private createProjectGetTool;
    private createProjectCreateTool;
    private createProjectUpdateTool;
    private createProjectDeleteTool;
    private createPullRequestListTool;
    private createPullRequestGetTool;
    private createPullRequestCreateTool;
    private createPullRequestUpdateTool;
    private createPullRequestMergeTool;
    private createPullRequestDeclineTool;
    private createUserInfoTool;
    private createUserListTool;
    private createOAuthApplicationCreateTool;
    private createOAuthApplicationGetTool;
    private createOAuthApplicationUpdateTool;
    private createOAuthApplicationDeleteTool;
    private createOAuthApplicationListTool;
    private createSessionCreateTool;
    private createSessionGetTool;
    private createSessionRefreshTool;
    private createSessionRevokeTool;
    private createSessionListTool;
    private createSearchRepositoriesTool;
    private createSearchCommitsTool;
    private createSearchPullRequestsTool;
    private createSearchCodeTool;
    private createSearchUsersTool;
    /**
     * Execute a tool with authentication context
     */
    private executeTool;
}
//# sourceMappingURL=bitbucket-mcp-tools.d.ts.map