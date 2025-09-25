/**
 * Bitbucket Tools Integration for Bitbucket MCP Server
 *
 * This module provides integration between the MCP tools and Bitbucket APIs,
 * handling tool execution with authentication, API routing, and response
 * processing for Bitbucket operations.
 *
 * Key Features:
 * - MCP tool to Bitbucket API mapping
 * - Authenticated tool execution
 * - API response processing and formatting
 * - Error handling and validation
 * - Tool result caching and optimization
 *
 * Constitutional Requirements:
 * - MCP protocol compliance
 * - Secure API communication
 * - Comprehensive error handling
 * - Performance optimization
 */
import { EventEmitter } from 'events';
import { ToolExecutionContext } from '../../types/index.js';
import { BitbucketAPIManager } from './bitbucket-api-manager';
/**
 * Tool Execution Result
 */
export interface ToolExecutionResult {
    /** Whether execution was successful */
    success: boolean;
    /** Result data */
    data?: any;
    /** Error information */
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    /** Execution metadata */
    metadata: {
        toolName: string;
        instanceId: string;
        executionTime: number;
        timestamp: Date;
        requestId: string;
    };
}
/**
 * Bitbucket Tools Integration Class
 * Integrates MCP tools with Bitbucket APIs
 */
export declare class BitbucketToolsIntegration extends EventEmitter {
    private apiManager;
    private toolMappings;
    private errorHandler;
    constructor(apiManager: BitbucketAPIManager);
    /**
     * Execute Bitbucket tool with authentication
     */
    executeTool(toolName: string, params: Record<string, any>, context: ToolExecutionContext): Promise<ToolExecutionResult>;
    /**
     * Execute tool-specific logic
     */
    private executeToolLogic;
    /**
     * Execute repository list tool
     */
    private executeRepositoryList;
    /**
     * Execute repository get tool
     */
    private executeRepositoryGet;
    /**
     * Execute repository create tool
     */
    private executeRepositoryCreate;
    /**
     * Execute project list tool
     */
    private executeProjectList;
    /**
     * Execute project get tool
     */
    private executeProjectGet;
    /**
     * Execute pull request list tool
     */
    private executePullRequestList;
    /**
     * Execute pull request get tool
     */
    private executePullRequestGet;
    /**
     * Execute pull request create tool
     */
    private executePullRequestCreate;
    /**
     * Execute user info tool
     */
    private executeUserInfo;
    /**
     * Execute repository update tool
     */
    private executeRepositoryUpdate;
    /**
     * Execute repository delete tool
     */
    private executeRepositoryDelete;
    /**
     * Execute project create tool
     */
    private executeProjectCreate;
    /**
     * Execute project update tool
     */
    private executeProjectUpdate;
    /**
     * Execute project delete tool
     */
    private executeProjectDelete;
    /**
     * Execute pull request update tool
     */
    private executePullRequestUpdate;
    /**
     * Execute pull request merge tool
     */
    private executePullRequestMerge;
    /**
     * Execute pull request decline tool
     */
    private executePullRequestDecline;
    /**
     * Execute user list tool
     */
    private executeUserList;
    /**
     * Execute OAuth application create tool
     */
    private executeOAuthApplicationCreate;
    /**
     * Execute OAuth application get tool
     */
    private executeOAuthApplicationGet;
    /**
     * Execute OAuth application update tool
     */
    private executeOAuthApplicationUpdate;
    /**
     * Execute OAuth application delete tool
     */
    private executeOAuthApplicationDelete;
    /**
     * Execute OAuth application list tool
     */
    private executeOAuthApplicationList;
    /**
     * Execute session create tool
     */
    private executeSessionCreate;
    /**
     * Execute session get tool
     */
    private executeSessionGet;
    /**
     * Execute session refresh tool
     */
    private executeSessionRefresh;
    /**
     * Execute session revoke tool
     */
    private executeSessionRevoke;
    /**
     * Execute session list tool
     */
    private executeSessionList;
    /**
     * Execute search repositories tool
     */
    private executeSearchRepositories;
    /**
     * Execute search commits tool
     */
    private executeSearchCommits;
    /**
     * Execute search pull requests tool
     */
    private executeSearchPullRequests;
    /**
     * Execute search code tool
     */
    private executeSearchCode;
    /**
     * Execute search users tool
     */
    private executeSearchUsers;
    private formatRepositoryListResponse;
    private formatRepositoryResponse;
    private formatProjectListResponse;
    private formatProjectResponse;
    private formatPullRequestListResponse;
    private formatPullRequestResponse;
    private formatUserInfoResponse;
    private formatUserListResponse;
    private formatOAuthApplicationResponse;
    private formatOAuthApplicationListResponse;
    private formatSessionResponse;
    private formatSessionListResponse;
    private formatCommitListResponse;
    private formatCodeSearchResponse;
    private initializeToolMappings;
    private validateToolParameters;
    private buildEndpoint;
    private findInstanceByBaseUrl;
    private generateRequestId;
    /**
     * Get required permissions for a tool
     */
    private getRequiredPermissions;
    private setupEventHandlers;
}
//# sourceMappingURL=bitbucket-tools-integration.d.ts.map