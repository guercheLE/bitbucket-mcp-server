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
import { AuthenticationErrorCode } from '../../types/auth';
import { AuthenticatedToolErrorHandler } from './authenticated-tool-error-handler';
/**
 * Bitbucket Tools Integration Class
 * Integrates MCP tools with Bitbucket APIs
 */
export class BitbucketToolsIntegration extends EventEmitter {
    apiManager;
    toolMappings = new Map();
    errorHandler;
    constructor(apiManager) {
        super();
        this.apiManager = apiManager;
        this.errorHandler = new AuthenticatedToolErrorHandler();
        this.initializeToolMappings();
        this.setupEventHandlers();
    }
    // ============================================================================
    // Tool Execution
    // ============================================================================
    /**
     * Execute Bitbucket tool with authentication
     */
    async executeTool(toolName, params, context) {
        const startTime = Date.now();
        const requestId = this.generateRequestId();
        try {
            // Validate authentication context
            if (!context.authentication?.isAuthenticated || !context.authentication.userSession) {
                const authError = new AuthError({
                    code: AuthenticationErrorCode.AUTHENTICATION_FAILED,
                    message: 'Tool execution requires authentication',
                    timestamp: new Date(),
                    isRecoverable: false
                });
                throw authError;
            }
            // Get tool mapping
            const mapping = this.toolMappings.get(toolName);
            if (!mapping) {
                const authError = new AuthError({
                    code: AuthenticationErrorCode.INTERNAL_ERROR,
                    message: `Unknown tool: ${toolName}`,
                    timestamp: new Date(),
                    isRecoverable: false
                });
                throw authError;
            }
            // Validate parameters
            this.validateToolParameters(toolName, params, mapping);
            // Create API request context
            const apiContext = {
                userSession: context.authentication.userSession,
                accessToken: context.authentication.userSession.accessToken,
                preferredInstanceId: context.bitbucket?.baseUrl ? this.findInstanceByBaseUrl(context.bitbucket.baseUrl) : undefined,
                metadata: {
                    toolName,
                    requestId,
                    timestamp: new Date()
                }
            };
            // Execute tool-specific logic
            const result = await this.executeToolLogic(toolName, params, apiContext, mapping);
            const executionTime = Date.now() - startTime;
            // Emit successful execution event
            this.emit('tool:executed', {
                toolName,
                success: true,
                executionTime,
                requestId,
                instanceId: result.instanceId
            });
            return {
                success: true,
                data: result.data,
                metadata: {
                    toolName,
                    instanceId: result.instanceId,
                    executionTime,
                    timestamp: new Date(),
                    requestId
                }
            };
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            // Emit failed execution event
            this.emit('tool:executed', {
                toolName,
                success: false,
                executionTime,
                requestId,
                error: error instanceof Error ? error.message : String(error)
            });
            // Create error context for authenticated error handling
            const errorContext = {
                toolName,
                userSession: context.authentication?.userSession,
                userId: context.authentication?.userId,
                userPermissions: context.authentication?.permissions,
                requiredPermissions: this.getRequiredPermissions(toolName),
                originalError: error instanceof Error ? error : new Error(String(error)),
                timestamp: new Date(),
                requestId
            };
            // Handle error through authenticated error handler
            const errorResult = this.errorHandler.handleToolExecutionError(error instanceof Error ? error : new Error(String(error)), errorContext);
            return {
                success: false,
                error: errorResult.error,
                metadata: {
                    ...errorResult.metadata,
                    toolName,
                    instanceId: 'unknown',
                    executionTime,
                    requestId
                }
            };
        }
    }
    // ============================================================================
    // Tool Logic Implementation
    // ============================================================================
    /**
     * Execute tool-specific logic
     */
    async executeToolLogic(toolName, params, context, mapping) {
        switch (toolName) {
            // Repository tools
            case 'bitbucket/repository/list':
                return await this.executeRepositoryList(params, context, mapping);
            case 'bitbucket/repository/get':
                return await this.executeRepositoryGet(params, context, mapping);
            case 'bitbucket/repository/create':
                return await this.executeRepositoryCreate(params, context, mapping);
            case 'bitbucket/repository/update':
                return await this.executeRepositoryUpdate(params, context, mapping);
            case 'bitbucket/repository/delete':
                return await this.executeRepositoryDelete(params, context, mapping);
            // Project tools
            case 'bitbucket/project/list':
                return await this.executeProjectList(params, context, mapping);
            case 'bitbucket/project/get':
                return await this.executeProjectGet(params, context, mapping);
            case 'bitbucket/project/create':
                return await this.executeProjectCreate(params, context, mapping);
            case 'bitbucket/project/update':
                return await this.executeProjectUpdate(params, context, mapping);
            case 'bitbucket/project/delete':
                return await this.executeProjectDelete(params, context, mapping);
            // Pull Request tools
            case 'bitbucket/pull-request/list':
                return await this.executePullRequestList(params, context, mapping);
            case 'bitbucket/pull-request/get':
                return await this.executePullRequestGet(params, context, mapping);
            case 'bitbucket/pull-request/create':
                return await this.executePullRequestCreate(params, context, mapping);
            case 'bitbucket/pull-request/update':
                return await this.executePullRequestUpdate(params, context, mapping);
            case 'bitbucket/pull-request/merge':
                return await this.executePullRequestMerge(params, context, mapping);
            case 'bitbucket/pull-request/decline':
                return await this.executePullRequestDecline(params, context, mapping);
            // User tools
            case 'bitbucket/user/info':
                return await this.executeUserInfo(params, context, mapping);
            case 'bitbucket/user/list':
                return await this.executeUserList(params, context, mapping);
            // OAuth Application tools
            case 'bitbucket/oauth/application/create':
                return await this.executeOAuthApplicationCreate(params, context, mapping);
            case 'bitbucket/oauth/application/get':
                return await this.executeOAuthApplicationGet(params, context, mapping);
            case 'bitbucket/oauth/application/update':
                return await this.executeOAuthApplicationUpdate(params, context, mapping);
            case 'bitbucket/oauth/application/delete':
                return await this.executeOAuthApplicationDelete(params, context, mapping);
            case 'bitbucket/oauth/application/list':
                return await this.executeOAuthApplicationList(params, context, mapping);
            // Session tools
            case 'bitbucket/session/create':
                return await this.executeSessionCreate(params, context, mapping);
            case 'bitbucket/session/get':
                return await this.executeSessionGet(params, context, mapping);
            case 'bitbucket/session/refresh':
                return await this.executeSessionRefresh(params, context, mapping);
            case 'bitbucket/session/revoke':
                return await this.executeSessionRevoke(params, context, mapping);
            case 'bitbucket/session/list':
                return await this.executeSessionList(params, context, mapping);
            // Search tools
            case 'bitbucket/search/repositories':
                return await this.executeSearchRepositories(params, context, mapping);
            case 'bitbucket/search/commits':
                return await this.executeSearchCommits(params, context, mapping);
            case 'bitbucket/search/pull-requests':
                return await this.executeSearchPullRequests(params, context, mapping);
            case 'bitbucket/search/code':
                return await this.executeSearchCode(params, context, mapping);
            case 'bitbucket/search/users':
                return await this.executeSearchUsers(params, context, mapping);
            default:
                const authError = new AuthError({
                    code: AuthenticationErrorCode.INTERNAL_ERROR,
                    message: `Tool logic not implemented: ${toolName}`,
                    timestamp: new Date(),
                    isRecoverable: false
                });
                throw authError;
        }
    }
    /**
     * Execute repository list tool
     */
    async executeRepositoryList(params, context, mapping) {
        const endpoint = mapping.endpoint;
        const requestParams = {
            limit: params.limit || 25,
            start: params.start || 0,
            ...params.filters
        };
        const result = await this.apiManager.makeRequest(context, {
            method: 'GET',
            endpoint,
            params: requestParams
        });
        return {
            instanceId: result.instanceId,
            data: this.formatRepositoryListResponse(result.response.data)
        };
    }
    /**
     * Execute repository get tool
     */
    async executeRepositoryGet(params, context, mapping) {
        const endpoint = this.buildEndpoint(mapping.endpoint, params);
        const result = await this.apiManager.makeRequest(context, {
            method: 'GET',
            endpoint
        });
        return {
            instanceId: result.instanceId,
            data: this.formatRepositoryResponse(result.response.data)
        };
    }
    /**
     * Execute repository create tool
     */
    async executeRepositoryCreate(params, context, mapping) {
        const endpoint = mapping.endpoint;
        const requestData = {
            name: params.name,
            description: params.description,
            is_private: params.isPrivate || false,
            ...params.options
        };
        const result = await this.apiManager.makeRequest(context, {
            method: 'POST',
            endpoint,
            data: requestData
        });
        return {
            instanceId: result.instanceId,
            data: this.formatRepositoryResponse(result.response.data)
        };
    }
    /**
     * Execute project list tool
     */
    async executeProjectList(params, context, mapping) {
        const endpoint = mapping.endpoint;
        const requestParams = {
            limit: params.limit || 25,
            start: params.start || 0,
            ...params.filters
        };
        const result = await this.apiManager.makeRequest(context, {
            method: 'GET',
            endpoint,
            params: requestParams
        });
        return {
            instanceId: result.instanceId,
            data: this.formatProjectListResponse(result.response.data)
        };
    }
    /**
     * Execute project get tool
     */
    async executeProjectGet(params, context, mapping) {
        const endpoint = this.buildEndpoint(mapping.endpoint, params);
        const result = await this.apiManager.makeRequest(context, {
            method: 'GET',
            endpoint
        });
        return {
            instanceId: result.instanceId,
            data: this.formatProjectResponse(result.response.data)
        };
    }
    /**
     * Execute pull request list tool
     */
    async executePullRequestList(params, context, mapping) {
        const endpoint = this.buildEndpoint(mapping.endpoint, params);
        const requestParams = {
            limit: params.limit || 25,
            start: params.start || 0,
            state: params.state || 'OPEN',
            ...params.filters
        };
        const result = await this.apiManager.makeRequest(context, {
            method: 'GET',
            endpoint,
            params: requestParams
        });
        return {
            instanceId: result.instanceId,
            data: this.formatPullRequestListResponse(result.response.data)
        };
    }
    /**
     * Execute pull request get tool
     */
    async executePullRequestGet(params, context, mapping) {
        const endpoint = this.buildEndpoint(mapping.endpoint, params);
        const result = await this.apiManager.makeRequest(context, {
            method: 'GET',
            endpoint
        });
        return {
            instanceId: result.instanceId,
            data: this.formatPullRequestResponse(result.response.data)
        };
    }
    /**
     * Execute pull request create tool
     */
    async executePullRequestCreate(params, context, mapping) {
        const endpoint = this.buildEndpoint(mapping.endpoint, params);
        const requestData = {
            title: params.title,
            description: params.description,
            fromRef: params.fromRef,
            toRef: params.toRef,
            reviewers: params.reviewers || [],
            ...params.options
        };
        const result = await this.apiManager.makeRequest(context, {
            method: 'POST',
            endpoint,
            data: requestData
        });
        return {
            instanceId: result.instanceId,
            data: this.formatPullRequestResponse(result.response.data)
        };
    }
    /**
     * Execute user info tool
     */
    async executeUserInfo(params, context, mapping) {
        const endpoint = mapping.endpoint;
        const result = await this.apiManager.makeRequest(context, {
            method: 'GET',
            endpoint
        });
        return {
            instanceId: result.instanceId,
            data: this.formatUserInfoResponse(result.response.data)
        };
    }
    /**
     * Execute repository update tool
     */
    async executeRepositoryUpdate(params, context, mapping) {
        const endpoint = this.buildEndpoint(mapping.endpoint, params);
        const requestData = {
            name: params.name,
            description: params.description,
            is_private: params.isPrivate,
            ...params.options
        };
        const result = await this.apiManager.makeRequest(context, {
            method: 'PUT',
            endpoint,
            data: requestData
        });
        return {
            instanceId: result.instanceId,
            data: this.formatRepositoryResponse(result.response.data)
        };
    }
    /**
     * Execute repository delete tool
     */
    async executeRepositoryDelete(params, context, mapping) {
        const endpoint = this.buildEndpoint(mapping.endpoint, params);
        const result = await this.apiManager.makeRequest(context, {
            method: 'DELETE',
            endpoint
        });
        return {
            instanceId: result.instanceId,
            data: { success: true, message: 'Repository deleted successfully' }
        };
    }
    /**
     * Execute project create tool
     */
    async executeProjectCreate(params, context, mapping) {
        const endpoint = mapping.endpoint;
        const requestData = {
            key: params.key,
            name: params.name,
            description: params.description,
            ...params.options
        };
        const result = await this.apiManager.makeRequest(context, {
            method: 'POST',
            endpoint,
            data: requestData
        });
        return {
            instanceId: result.instanceId,
            data: this.formatProjectResponse(result.response.data)
        };
    }
    /**
     * Execute project update tool
     */
    async executeProjectUpdate(params, context, mapping) {
        const endpoint = this.buildEndpoint(mapping.endpoint, params);
        const requestData = {
            name: params.name,
            description: params.description,
            ...params.options
        };
        const result = await this.apiManager.makeRequest(context, {
            method: 'PUT',
            endpoint,
            data: requestData
        });
        return {
            instanceId: result.instanceId,
            data: this.formatProjectResponse(result.response.data)
        };
    }
    /**
     * Execute project delete tool
     */
    async executeProjectDelete(params, context, mapping) {
        const endpoint = this.buildEndpoint(mapping.endpoint, params);
        const result = await this.apiManager.makeRequest(context, {
            method: 'DELETE',
            endpoint
        });
        return {
            instanceId: result.instanceId,
            data: { success: true, message: 'Project deleted successfully' }
        };
    }
    /**
     * Execute pull request update tool
     */
    async executePullRequestUpdate(params, context, mapping) {
        const endpoint = this.buildEndpoint(mapping.endpoint, params);
        const requestData = {
            title: params.title,
            description: params.description,
            ...params.options
        };
        const result = await this.apiManager.makeRequest(context, {
            method: 'PUT',
            endpoint,
            data: requestData
        });
        return {
            instanceId: result.instanceId,
            data: this.formatPullRequestResponse(result.response.data)
        };
    }
    /**
     * Execute pull request merge tool
     */
    async executePullRequestMerge(params, context, mapping) {
        const endpoint = this.buildEndpoint(mapping.endpoint, params);
        const requestData = {
            mergeStrategy: params.mergeStrategy,
            ...params.options
        };
        const result = await this.apiManager.makeRequest(context, {
            method: 'POST',
            endpoint,
            data: requestData
        });
        return {
            instanceId: result.instanceId,
            data: this.formatPullRequestResponse(result.response.data)
        };
    }
    /**
     * Execute pull request decline tool
     */
    async executePullRequestDecline(params, context, mapping) {
        const endpoint = this.buildEndpoint(mapping.endpoint, params);
        const requestData = {
            reason: params.reason,
            ...params.options
        };
        const result = await this.apiManager.makeRequest(context, {
            method: 'POST',
            endpoint,
            data: requestData
        });
        return {
            instanceId: result.instanceId,
            data: this.formatPullRequestResponse(result.response.data)
        };
    }
    /**
     * Execute user list tool
     */
    async executeUserList(params, context, mapping) {
        const endpoint = mapping.endpoint;
        const requestParams = {
            limit: params.limit || 25,
            start: params.start || 0,
            ...params.filters
        };
        const result = await this.apiManager.makeRequest(context, {
            method: 'GET',
            endpoint,
            params: requestParams
        });
        return {
            instanceId: result.instanceId,
            data: this.formatUserListResponse(result.response.data)
        };
    }
    // ============================================================================
    // OAuth Application Tools
    // ============================================================================
    /**
     * Execute OAuth application create tool
     */
    async executeOAuthApplicationCreate(params, context, mapping) {
        const endpoint = mapping.endpoint;
        const requestData = {
            name: params.name,
            description: params.description,
            callbackUrl: params.callbackUrl,
            ...params.options
        };
        const result = await this.apiManager.makeRequest(context, {
            method: 'POST',
            endpoint,
            data: requestData
        });
        return {
            instanceId: result.instanceId,
            data: this.formatOAuthApplicationResponse(result.response.data)
        };
    }
    /**
     * Execute OAuth application get tool
     */
    async executeOAuthApplicationGet(params, context, mapping) {
        const endpoint = this.buildEndpoint(mapping.endpoint, params);
        const result = await this.apiManager.makeRequest(context, {
            method: 'GET',
            endpoint
        });
        return {
            instanceId: result.instanceId,
            data: this.formatOAuthApplicationResponse(result.response.data)
        };
    }
    /**
     * Execute OAuth application update tool
     */
    async executeOAuthApplicationUpdate(params, context, mapping) {
        const endpoint = this.buildEndpoint(mapping.endpoint, params);
        const requestData = {
            name: params.name,
            description: params.description,
            callbackUrl: params.callbackUrl,
            ...params.options
        };
        const result = await this.apiManager.makeRequest(context, {
            method: 'PUT',
            endpoint,
            data: requestData
        });
        return {
            instanceId: result.instanceId,
            data: this.formatOAuthApplicationResponse(result.response.data)
        };
    }
    /**
     * Execute OAuth application delete tool
     */
    async executeOAuthApplicationDelete(params, context, mapping) {
        const endpoint = this.buildEndpoint(mapping.endpoint, params);
        const result = await this.apiManager.makeRequest(context, {
            method: 'DELETE',
            endpoint
        });
        return {
            instanceId: result.instanceId,
            data: { success: true, message: 'OAuth application deleted successfully' }
        };
    }
    /**
     * Execute OAuth application list tool
     */
    async executeOAuthApplicationList(params, context, mapping) {
        const endpoint = mapping.endpoint;
        const result = await this.apiManager.makeRequest(context, {
            method: 'GET',
            endpoint
        });
        return {
            instanceId: result.instanceId,
            data: this.formatOAuthApplicationListResponse(result.response.data)
        };
    }
    // ============================================================================
    // Session Tools
    // ============================================================================
    /**
     * Execute session create tool
     */
    async executeSessionCreate(params, context, mapping) {
        const endpoint = mapping.endpoint;
        const requestData = {
            userId: params.userId,
            ...params.options
        };
        const result = await this.apiManager.makeRequest(context, {
            method: 'POST',
            endpoint,
            data: requestData
        });
        return {
            instanceId: result.instanceId,
            data: this.formatSessionResponse(result.response.data)
        };
    }
    /**
     * Execute session get tool
     */
    async executeSessionGet(params, context, mapping) {
        const endpoint = mapping.endpoint;
        const result = await this.apiManager.makeRequest(context, {
            method: 'GET',
            endpoint
        });
        return {
            instanceId: result.instanceId,
            data: this.formatSessionResponse(result.response.data)
        };
    }
    /**
     * Execute session refresh tool
     */
    async executeSessionRefresh(params, context, mapping) {
        const endpoint = this.buildEndpoint(mapping.endpoint, params);
        const result = await this.apiManager.makeRequest(context, {
            method: 'POST',
            endpoint
        });
        return {
            instanceId: result.instanceId,
            data: this.formatSessionResponse(result.response.data)
        };
    }
    /**
     * Execute session revoke tool
     */
    async executeSessionRevoke(params, context, mapping) {
        const endpoint = this.buildEndpoint(mapping.endpoint, params);
        const result = await this.apiManager.makeRequest(context, {
            method: 'DELETE',
            endpoint
        });
        return {
            instanceId: result.instanceId,
            data: { success: true, message: 'Session revoked successfully' }
        };
    }
    /**
     * Execute session list tool
     */
    async executeSessionList(params, context, mapping) {
        const endpoint = mapping.endpoint;
        const requestParams = {
            userId: params.userId,
            ...params.filters
        };
        const result = await this.apiManager.makeRequest(context, {
            method: 'GET',
            endpoint,
            params: requestParams
        });
        return {
            instanceId: result.instanceId,
            data: this.formatSessionListResponse(result.response.data)
        };
    }
    // ============================================================================
    // Search Tools
    // ============================================================================
    /**
     * Execute search repositories tool
     */
    async executeSearchRepositories(params, context, mapping) {
        const endpoint = mapping.endpoint;
        const requestParams = {
            q: params.query,
            projectKey: params.projectKey,
            limit: params.limit || 25,
            start: params.start || 0,
            ...params.filters
        };
        const result = await this.apiManager.makeRequest(context, {
            method: 'GET',
            endpoint,
            params: requestParams
        });
        return {
            instanceId: result.instanceId,
            data: this.formatRepositoryListResponse(result.response.data)
        };
    }
    /**
     * Execute search commits tool
     */
    async executeSearchCommits(params, context, mapping) {
        const endpoint = mapping.endpoint;
        const requestParams = {
            q: params.query,
            projectKey: params.projectKey,
            repositorySlug: params.repositorySlug,
            limit: params.limit || 25,
            start: params.start || 0,
            ...params.filters
        };
        const result = await this.apiManager.makeRequest(context, {
            method: 'GET',
            endpoint,
            params: requestParams
        });
        return {
            instanceId: result.instanceId,
            data: this.formatCommitListResponse(result.response.data)
        };
    }
    /**
     * Execute search pull requests tool
     */
    async executeSearchPullRequests(params, context, mapping) {
        const endpoint = mapping.endpoint;
        const requestParams = {
            q: params.query,
            projectKey: params.projectKey,
            repositorySlug: params.repositorySlug,
            limit: params.limit || 25,
            start: params.start || 0,
            ...params.filters
        };
        const result = await this.apiManager.makeRequest(context, {
            method: 'GET',
            endpoint,
            params: requestParams
        });
        return {
            instanceId: result.instanceId,
            data: this.formatPullRequestListResponse(result.response.data)
        };
    }
    /**
     * Execute search code tool
     */
    async executeSearchCode(params, context, mapping) {
        const endpoint = mapping.endpoint;
        const requestParams = {
            q: params.query,
            projectKey: params.projectKey,
            repositorySlug: params.repositorySlug,
            limit: params.limit || 25,
            start: params.start || 0,
            ...params.filters
        };
        const result = await this.apiManager.makeRequest(context, {
            method: 'GET',
            endpoint,
            params: requestParams
        });
        return {
            instanceId: result.instanceId,
            data: this.formatCodeSearchResponse(result.response.data)
        };
    }
    /**
     * Execute search users tool
     */
    async executeSearchUsers(params, context, mapping) {
        const endpoint = mapping.endpoint;
        const requestParams = {
            q: params.query,
            limit: params.limit || 25,
            start: params.start || 0,
            ...params.filters
        };
        const result = await this.apiManager.makeRequest(context, {
            method: 'GET',
            endpoint,
            params: requestParams
        });
        return {
            instanceId: result.instanceId,
            data: this.formatUserListResponse(result.response.data)
        };
    }
    // ============================================================================
    // Response Formatting
    // ============================================================================
    formatRepositoryListResponse(data) {
        // Format repository list response for MCP
        return {
            repositories: data.values || data.repositories || [],
            total: data.size || data.total || 0,
            hasMore: data.isLastPage === false || data.next !== undefined
        };
    }
    formatRepositoryResponse(data) {
        // Format single repository response for MCP
        return {
            id: data.id || data.uuid,
            name: data.name || data.slug,
            description: data.description,
            isPrivate: data.is_private || data.public === false,
            createdDate: data.created_on || data.createdDate,
            updatedDate: data.updated_on || data.updatedDate,
            links: data.links,
            project: data.project
        };
    }
    formatProjectListResponse(data) {
        // Format project list response for MCP
        return {
            projects: data.values || data.projects || [],
            total: data.size || data.total || 0,
            hasMore: data.isLastPage === false || data.next !== undefined
        };
    }
    formatProjectResponse(data) {
        // Format single project response for MCP
        return {
            id: data.id || data.key,
            name: data.name,
            description: data.description,
            type: data.type,
            createdDate: data.created_on || data.createdDate,
            updatedDate: data.updated_on || data.updatedDate,
            links: data.links
        };
    }
    formatPullRequestListResponse(data) {
        // Format pull request list response for MCP
        return {
            pullRequests: data.values || data.pullRequests || [],
            total: data.size || data.total || 0,
            hasMore: data.isLastPage === false || data.next !== undefined
        };
    }
    formatPullRequestResponse(data) {
        // Format single pull request response for MCP
        return {
            id: data.id,
            title: data.title,
            description: data.description,
            state: data.state,
            author: data.author,
            reviewers: data.reviewers || [],
            fromRef: data.fromRef,
            toRef: data.toRef,
            createdDate: data.createdDate,
            updatedDate: data.updatedDate,
            links: data.links
        };
    }
    formatUserInfoResponse(data) {
        // Format user info response for MCP
        return {
            id: data.id || data.uuid,
            username: data.username || data.slug,
            displayName: data.display_name || data.name,
            email: data.email_address || data.email,
            avatar: data.links?.avatar?.href || data.avatar_url,
            createdDate: data.created_on || data.createdDate
        };
    }
    formatUserListResponse(data) {
        // Format user list response for MCP
        return {
            users: data.values || data.users || [],
            total: data.size || data.total || 0,
            hasMore: data.isLastPage === false || data.next !== undefined
        };
    }
    formatOAuthApplicationResponse(data) {
        // Format OAuth application response for MCP
        return {
            id: data.id || data.clientId,
            name: data.name,
            description: data.description,
            callbackUrl: data.callbackUrl,
            clientId: data.clientId,
            clientSecret: data.clientSecret,
            createdDate: data.createdDate,
            updatedDate: data.updatedDate
        };
    }
    formatOAuthApplicationListResponse(data) {
        // Format OAuth application list response for MCP
        return {
            applications: data.values || data.applications || [],
            total: data.size || data.total || 0,
            hasMore: data.isLastPage === false || data.next !== undefined
        };
    }
    formatSessionResponse(data) {
        // Format session response for MCP
        return {
            id: data.id || data.sessionId,
            userId: data.userId,
            createdDate: data.createdDate,
            expiresDate: data.expiresDate,
            isActive: data.isActive,
            metadata: data.metadata
        };
    }
    formatSessionListResponse(data) {
        // Format session list response for MCP
        return {
            sessions: data.values || data.sessions || [],
            total: data.size || data.total || 0,
            hasMore: data.isLastPage === false || data.next !== undefined
        };
    }
    formatCommitListResponse(data) {
        // Format commit list response for MCP
        return {
            commits: data.values || data.commits || [],
            total: data.size || data.total || 0,
            hasMore: data.isLastPage === false || data.next !== undefined
        };
    }
    formatCodeSearchResponse(data) {
        // Format code search response for MCP
        return {
            results: data.values || data.results || [],
            total: data.size || data.total || 0,
            hasMore: data.isLastPage === false || data.next !== undefined
        };
    }
    // ============================================================================
    // Utility Methods
    // ============================================================================
    initializeToolMappings() {
        // Initialize tool to API endpoint mappings
        // Repository tools
        this.toolMappings.set('bitbucket/repository/list', {
            endpoint: '/rest/api/1.0/repos',
            method: 'GET',
            requiredParams: [],
            optionalParams: ['limit', 'start', 'projectKey', 'name']
        });
        this.toolMappings.set('bitbucket/repository/get', {
            endpoint: '/rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}',
            method: 'GET',
            requiredParams: ['projectKey', 'repositorySlug'],
            optionalParams: []
        });
        this.toolMappings.set('bitbucket/repository/create', {
            endpoint: '/rest/api/1.0/projects/{projectKey}/repos',
            method: 'POST',
            requiredParams: ['projectKey', 'name'],
            optionalParams: ['description', 'isPrivate']
        });
        this.toolMappings.set('bitbucket/repository/update', {
            endpoint: '/rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}',
            method: 'PUT',
            requiredParams: ['projectKey', 'repositorySlug'],
            optionalParams: ['name', 'description', 'isPrivate']
        });
        this.toolMappings.set('bitbucket/repository/delete', {
            endpoint: '/rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}',
            method: 'DELETE',
            requiredParams: ['projectKey', 'repositorySlug'],
            optionalParams: []
        });
        // Project tools
        this.toolMappings.set('bitbucket/project/list', {
            endpoint: '/rest/api/1.0/projects',
            method: 'GET',
            requiredParams: [],
            optionalParams: ['limit', 'start', 'name']
        });
        this.toolMappings.set('bitbucket/project/get', {
            endpoint: '/rest/api/1.0/projects/{projectKey}',
            method: 'GET',
            requiredParams: ['projectKey'],
            optionalParams: []
        });
        this.toolMappings.set('bitbucket/project/create', {
            endpoint: '/rest/api/1.0/projects',
            method: 'POST',
            requiredParams: ['key', 'name'],
            optionalParams: ['description']
        });
        this.toolMappings.set('bitbucket/project/update', {
            endpoint: '/rest/api/1.0/projects/{projectKey}',
            method: 'PUT',
            requiredParams: ['projectKey'],
            optionalParams: ['name', 'description']
        });
        this.toolMappings.set('bitbucket/project/delete', {
            endpoint: '/rest/api/1.0/projects/{projectKey}',
            method: 'DELETE',
            requiredParams: ['projectKey'],
            optionalParams: []
        });
        // Pull Request tools
        this.toolMappings.set('bitbucket/pull-request/list', {
            endpoint: '/rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests',
            method: 'GET',
            requiredParams: ['projectKey', 'repositorySlug'],
            optionalParams: ['limit', 'start', 'state']
        });
        this.toolMappings.set('bitbucket/pull-request/get', {
            endpoint: '/rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}',
            method: 'GET',
            requiredParams: ['projectKey', 'repositorySlug', 'pullRequestId'],
            optionalParams: []
        });
        this.toolMappings.set('bitbucket/pull-request/create', {
            endpoint: '/rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests',
            method: 'POST',
            requiredParams: ['projectKey', 'repositorySlug', 'title', 'fromRef', 'toRef'],
            optionalParams: ['description', 'reviewers']
        });
        this.toolMappings.set('bitbucket/pull-request/update', {
            endpoint: '/rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}',
            method: 'PUT',
            requiredParams: ['projectKey', 'repositorySlug', 'pullRequestId'],
            optionalParams: ['title', 'description']
        });
        this.toolMappings.set('bitbucket/pull-request/merge', {
            endpoint: '/rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/merge',
            method: 'POST',
            requiredParams: ['projectKey', 'repositorySlug', 'pullRequestId'],
            optionalParams: ['mergeStrategy']
        });
        this.toolMappings.set('bitbucket/pull-request/decline', {
            endpoint: '/rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/decline',
            method: 'POST',
            requiredParams: ['projectKey', 'repositorySlug', 'pullRequestId'],
            optionalParams: ['reason']
        });
        // User tools
        this.toolMappings.set('bitbucket/user/info', {
            endpoint: '/rest/api/1.0/users/current',
            method: 'GET',
            requiredParams: [],
            optionalParams: []
        });
        this.toolMappings.set('bitbucket/user/list', {
            endpoint: '/rest/api/1.0/users',
            method: 'GET',
            requiredParams: [],
            optionalParams: ['limit', 'start']
        });
        // OAuth Application tools
        this.toolMappings.set('bitbucket/oauth/application/create', {
            endpoint: '/rest/oauth/1.0/applications',
            method: 'POST',
            requiredParams: ['name'],
            optionalParams: ['description', 'callbackUrl']
        });
        this.toolMappings.set('bitbucket/oauth/application/get', {
            endpoint: '/rest/oauth/1.0/applications/{applicationId}',
            method: 'GET',
            requiredParams: ['applicationId'],
            optionalParams: []
        });
        this.toolMappings.set('bitbucket/oauth/application/update', {
            endpoint: '/rest/oauth/1.0/applications/{applicationId}',
            method: 'PUT',
            requiredParams: ['applicationId'],
            optionalParams: ['name', 'description', 'callbackUrl']
        });
        this.toolMappings.set('bitbucket/oauth/application/delete', {
            endpoint: '/rest/oauth/1.0/applications/{applicationId}',
            method: 'DELETE',
            requiredParams: ['applicationId'],
            optionalParams: []
        });
        this.toolMappings.set('bitbucket/oauth/application/list', {
            endpoint: '/rest/oauth/1.0/applications',
            method: 'GET',
            requiredParams: [],
            optionalParams: []
        });
        // Session tools
        this.toolMappings.set('bitbucket/session/create', {
            endpoint: '/rest/api/1.0/sessions',
            method: 'POST',
            requiredParams: ['userId'],
            optionalParams: []
        });
        this.toolMappings.set('bitbucket/session/get', {
            endpoint: '/rest/api/1.0/sessions/current',
            method: 'GET',
            requiredParams: [],
            optionalParams: []
        });
        this.toolMappings.set('bitbucket/session/refresh', {
            endpoint: '/rest/api/1.0/sessions/{sessionId}/refresh',
            method: 'POST',
            requiredParams: ['sessionId'],
            optionalParams: []
        });
        this.toolMappings.set('bitbucket/session/revoke', {
            endpoint: '/rest/api/1.0/sessions/{sessionId}',
            method: 'DELETE',
            requiredParams: ['sessionId'],
            optionalParams: []
        });
        this.toolMappings.set('bitbucket/session/list', {
            endpoint: '/rest/api/1.0/sessions',
            method: 'GET',
            requiredParams: ['userId'],
            optionalParams: []
        });
        // Search tools
        this.toolMappings.set('bitbucket/search/repositories', {
            endpoint: '/rest/api/1.0/repos',
            method: 'GET',
            requiredParams: ['query'],
            optionalParams: ['projectKey', 'limit', 'start']
        });
        this.toolMappings.set('bitbucket/search/commits', {
            endpoint: '/rest/api/1.0/commits',
            method: 'GET',
            requiredParams: ['query'],
            optionalParams: ['projectKey', 'repositorySlug', 'limit', 'start']
        });
        this.toolMappings.set('bitbucket/search/pull-requests', {
            endpoint: '/rest/api/1.0/pull-requests',
            method: 'GET',
            requiredParams: ['query'],
            optionalParams: ['projectKey', 'repositorySlug', 'limit', 'start']
        });
        this.toolMappings.set('bitbucket/search/code', {
            endpoint: '/rest/api/1.0/search/code',
            method: 'GET',
            requiredParams: ['query'],
            optionalParams: ['projectKey', 'repositorySlug', 'limit', 'start']
        });
        this.toolMappings.set('bitbucket/search/users', {
            endpoint: '/rest/api/1.0/users',
            method: 'GET',
            requiredParams: ['query'],
            optionalParams: ['limit', 'start']
        });
    }
    validateToolParameters(toolName, params, mapping) {
        // Check required parameters
        for (const requiredParam of mapping.requiredParams) {
            if (!(requiredParam in params)) {
                const authError = new AuthError({
                    code: AuthenticationErrorCode.INVALID_REQUEST,
                    message: `Missing required parameter: ${requiredParam}`,
                    details: { toolName, requiredParam },
                    timestamp: new Date(),
                    isRecoverable: false
                });
                throw authError;
            }
        }
    }
    buildEndpoint(template, params) {
        let endpoint = template;
        // Replace path parameters
        for (const [key, value] of Object.entries(params)) {
            endpoint = endpoint.replace(`{${key}}`, encodeURIComponent(String(value)));
        }
        return endpoint;
    }
    findInstanceByBaseUrl(baseUrl) {
        // Find instance ID by base URL
        for (const [instanceId, client] of this.apiManager.getAllInstances().entries()) {
            // This would need to be implemented based on how baseUrl is stored
            // For now, return undefined to use default selection
            return undefined;
        }
        return undefined;
    }
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Get required permissions for a tool
     */
    getRequiredPermissions(toolName) {
        const permissionMap = {
            'bitbucket/repository/list': ['REPO_READ'],
            'bitbucket/repository/get': ['REPO_READ'],
            'bitbucket/repository/create': ['REPO_WRITE'],
            'bitbucket/repository/update': ['REPO_WRITE'],
            'bitbucket/repository/delete': ['REPO_ADMIN'],
            'bitbucket/project/list': ['PROJECT_READ'],
            'bitbucket/project/get': ['PROJECT_READ'],
            'bitbucket/project/create': ['PROJECT_ADMIN'],
            'bitbucket/project/update': ['PROJECT_ADMIN'],
            'bitbucket/project/delete': ['PROJECT_ADMIN'],
            'bitbucket/pull-request/list': ['REPO_READ'],
            'bitbucket/pull-request/get': ['REPO_READ'],
            'bitbucket/pull-request/create': ['REPO_WRITE'],
            'bitbucket/pull-request/update': ['REPO_WRITE'],
            'bitbucket/pull-request/merge': ['REPO_WRITE'],
            'bitbucket/pull-request/decline': ['REPO_WRITE'],
            'bitbucket/user/info': [],
            'bitbucket/user/list': ['USER_READ'],
            'bitbucket/oauth/application/create': ['OAUTH_ADMIN'],
            'bitbucket/oauth/application/get': ['OAUTH_READ'],
            'bitbucket/oauth/application/update': ['OAUTH_ADMIN'],
            'bitbucket/oauth/application/delete': ['OAUTH_ADMIN'],
            'bitbucket/oauth/application/list': ['OAUTH_READ'],
            'bitbucket/session/create': ['SESSION_ADMIN'],
            'bitbucket/session/get': [],
            'bitbucket/session/refresh': ['SESSION_ADMIN'],
            'bitbucket/session/revoke': ['SESSION_ADMIN'],
            'bitbucket/session/list': ['SESSION_READ'],
            'bitbucket/search/repositories': ['REPO_READ'],
            'bitbucket/search/commits': ['REPO_READ'],
            'bitbucket/search/pull-requests': ['REPO_READ'],
            'bitbucket/search/code': ['REPO_READ'],
            'bitbucket/search/users': ['USER_READ']
        };
        return permissionMap[toolName] || [];
    }
    setupEventHandlers() {
        // Handle API manager events
        this.apiManager.on('request:completed', (data) => {
            this.emit('api:request-completed', data);
        });
        this.apiManager.on('request:failed', (data) => {
            this.emit('api:request-failed', data);
        });
    }
}
//# sourceMappingURL=bitbucket-tools-integration.js.map