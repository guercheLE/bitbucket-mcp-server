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
import { MCPErrorCode } from '../types/index.js';
/**
 * Bitbucket MCP Tools Registry
 * Manages all Bitbucket-related MCP tools
 */
export class BitbucketMCPTools {
    toolsIntegration;
    constructor(toolsIntegration) {
        this.toolsIntegration = toolsIntegration;
    }
    /**
     * Get all available Bitbucket MCP tools
     */
    getTools() {
        return [
            // Repository tools
            this.createRepositoryListTool(),
            this.createRepositoryGetTool(),
            this.createRepositoryCreateTool(),
            this.createRepositoryUpdateTool(),
            this.createRepositoryDeleteTool(),
            // Project tools
            this.createProjectListTool(),
            this.createProjectGetTool(),
            this.createProjectCreateTool(),
            this.createProjectUpdateTool(),
            this.createProjectDeleteTool(),
            // Pull Request tools
            this.createPullRequestListTool(),
            this.createPullRequestGetTool(),
            this.createPullRequestCreateTool(),
            this.createPullRequestUpdateTool(),
            this.createPullRequestMergeTool(),
            this.createPullRequestDeclineTool(),
            // User tools
            this.createUserInfoTool(),
            this.createUserListTool(),
            // Authentication tools
            this.createOAuthApplicationCreateTool(),
            this.createOAuthApplicationGetTool(),
            this.createOAuthApplicationUpdateTool(),
            this.createOAuthApplicationDeleteTool(),
            this.createOAuthApplicationListTool(),
            // Session tools
            this.createSessionCreateTool(),
            this.createSessionGetTool(),
            this.createSessionRefreshTool(),
            this.createSessionRevokeTool(),
            this.createSessionListTool(),
            // Search tools
            this.createSearchRepositoriesTool(),
            this.createSearchCommitsTool(),
            this.createSearchPullRequestsTool(),
            this.createSearchCodeTool(),
            this.createSearchUsersTool()
        ];
    }
    // ============================================================================
    // Repository Tools
    // ============================================================================
    createRepositoryListTool() {
        return {
            name: 'repository_list',
            description: 'List repositories in a project or across all projects',
            category: 'repository',
            version: '1.0.0',
            parameters: [
                {
                    name: 'projectKey',
                    type: 'string',
                    required: false,
                    description: 'Project key to filter repositories'
                },
                {
                    name: 'limit',
                    type: 'number',
                    required: false,
                    description: 'Maximum number of repositories to return',
                    default: 25
                },
                {
                    name: 'start',
                    type: 'number',
                    required: false,
                    description: 'Starting index for pagination',
                    default: 0
                },
                {
                    name: 'name',
                    type: 'string',
                    required: false,
                    description: 'Filter repositories by name'
                }
            ],
            authentication: {
                required: true,
                permissions: ['REPO_READ']
            },
            execute: async (params, context) => {
                return await this.executeTool('bitbucket/repository/list', params, context);
            }
        };
    }
    createRepositoryGetTool() {
        return {
            name: 'repository_get',
            description: 'Get details of a specific repository',
            category: 'repository',
            version: '1.0.0',
            parameters: [
                {
                    name: 'projectKey',
                    type: 'string',
                    required: true,
                    description: 'Project key containing the repository'
                },
                {
                    name: 'repositorySlug',
                    type: 'string',
                    required: true,
                    description: 'Repository slug/name'
                }
            ],
            authentication: {
                required: true,
                permissions: ['REPO_READ']
            },
            execute: async (params, context) => {
                return await this.executeTool('bitbucket/repository/get', params, context);
            }
        };
    }
    createRepositoryCreateTool() {
        return {
            name: 'repository_create',
            description: 'Create a new repository',
            category: 'repository',
            version: '1.0.0',
            parameters: [
                {
                    name: 'projectKey',
                    type: 'string',
                    required: true,
                    description: 'Project key where repository will be created'
                },
                {
                    name: 'name',
                    type: 'string',
                    required: true,
                    description: 'Repository name'
                },
                {
                    name: 'description',
                    type: 'string',
                    required: false,
                    description: 'Repository description'
                },
                {
                    name: 'isPrivate',
                    type: 'boolean',
                    required: false,
                    description: 'Whether repository is private',
                    default: false
                }
            ],
            authentication: {
                required: true,
                permissions: ['REPO_WRITE']
            },
            execute: async (params, context) => {
                return await this.executeTool('bitbucket/repository/create', params, context);
            }
        };
    }
    createRepositoryUpdateTool() {
        return {
            name: 'repository_update',
            description: 'Update repository settings',
            category: 'repository',
            version: '1.0.0',
            parameters: [
                {
                    name: 'projectKey',
                    type: 'string',
                    required: true,
                    description: 'Project key containing the repository'
                },
                {
                    name: 'repositorySlug',
                    type: 'string',
                    required: true,
                    description: 'Repository slug/name'
                },
                {
                    name: 'name',
                    type: 'string',
                    required: false,
                    description: 'New repository name'
                },
                {
                    name: 'description',
                    type: 'string',
                    required: false,
                    description: 'New repository description'
                },
                {
                    name: 'isPrivate',
                    type: 'boolean',
                    required: false,
                    description: 'New privacy setting'
                }
            ],
            authentication: {
                required: true,
                permissions: ['REPO_WRITE']
            },
            execute: async (params, context) => {
                return await this.executeTool('bitbucket/repository/update', params, context);
            }
        };
    }
    createRepositoryDeleteTool() {
        return {
            name: 'repository_delete',
            description: 'Delete a repository',
            category: 'repository',
            version: '1.0.0',
            parameters: [
                {
                    name: 'projectKey',
                    type: 'string',
                    required: true,
                    description: 'Project key containing the repository'
                },
                {
                    name: 'repositorySlug',
                    type: 'string',
                    required: true,
                    description: 'Repository slug/name to delete'
                }
            ],
            authentication: {
                required: true,
                permissions: ['REPO_ADMIN']
            },
            execute: async (params, context) => {
                return await this.executeTool('bitbucket/repository/delete', params, context);
            }
        };
    }
    // ============================================================================
    // Project Tools
    // ============================================================================
    createProjectListTool() {
        return {
            name: 'project_list',
            description: 'List all projects',
            category: 'project',
            version: '1.0.0',
            parameters: [
                {
                    name: 'limit',
                    type: 'number',
                    required: false,
                    description: 'Maximum number of projects to return',
                    default: 25
                },
                {
                    name: 'start',
                    type: 'number',
                    required: false,
                    description: 'Starting index for pagination',
                    default: 0
                },
                {
                    name: 'name',
                    type: 'string',
                    required: false,
                    description: 'Filter projects by name'
                }
            ],
            authentication: {
                required: true,
                permissions: ['PROJECT_READ']
            },
            execute: async (params, context) => {
                return await this.executeTool('bitbucket/project/list', params, context);
            }
        };
    }
    createProjectGetTool() {
        return {
            name: 'project_get',
            description: 'Get details of a specific project',
            category: 'project',
            version: '1.0.0',
            parameters: [
                {
                    name: 'projectKey',
                    type: 'string',
                    required: true,
                    description: 'Project key'
                }
            ],
            authentication: {
                required: true,
                permissions: ['PROJECT_READ']
            },
            execute: async (params, context) => {
                return await this.executeTool('bitbucket/project/get', params, context);
            }
        };
    }
    createProjectCreateTool() {
        return {
            name: 'project_create',
            description: 'Create a new project',
            category: 'project',
            version: '1.0.0',
            parameters: [
                {
                    name: 'key',
                    type: 'string',
                    required: true,
                    description: 'Project key (unique identifier)'
                },
                {
                    name: 'name',
                    type: 'string',
                    required: true,
                    description: 'Project name'
                },
                {
                    name: 'description',
                    type: 'string',
                    required: false,
                    description: 'Project description'
                }
            ],
            authentication: {
                required: true,
                permissions: ['PROJECT_ADMIN']
            },
            execute: async (params, context) => {
                return await this.executeTool('bitbucket/project/create', params, context);
            }
        };
    }
    createProjectUpdateTool() {
        return {
            name: 'project_update',
            description: 'Update project settings',
            category: 'project',
            version: '1.0.0',
            parameters: [
                {
                    name: 'projectKey',
                    type: 'string',
                    required: true,
                    description: 'Project key to update'
                },
                {
                    name: 'name',
                    type: 'string',
                    required: false,
                    description: 'New project name'
                },
                {
                    name: 'description',
                    type: 'string',
                    required: false,
                    description: 'New project description'
                }
            ],
            authentication: {
                required: true,
                permissions: ['PROJECT_ADMIN']
            },
            execute: async (params, context) => {
                return await this.executeTool('bitbucket/project/update', params, context);
            }
        };
    }
    createProjectDeleteTool() {
        return {
            name: 'project_delete',
            description: 'Delete a project',
            category: 'project',
            version: '1.0.0',
            parameters: [
                {
                    name: 'projectKey',
                    type: 'string',
                    required: true,
                    description: 'Project key to delete'
                }
            ],
            authentication: {
                required: true,
                permissions: ['PROJECT_ADMIN']
            },
            execute: async (params, context) => {
                return await this.executeTool('bitbucket/project/delete', params, context);
            }
        };
    }
    // ============================================================================
    // Pull Request Tools
    // ============================================================================
    createPullRequestListTool() {
        return {
            name: 'pull_request_list',
            description: 'List pull requests in a repository',
            category: 'pull_request',
            version: '1.0.0',
            parameters: [
                {
                    name: 'projectKey',
                    type: 'string',
                    required: true,
                    description: 'Project key containing the repository'
                },
                {
                    name: 'repositorySlug',
                    type: 'string',
                    required: true,
                    description: 'Repository slug/name'
                },
                {
                    name: 'state',
                    type: 'string',
                    required: false,
                    description: 'Filter by pull request state',
                    default: 'OPEN'
                },
                {
                    name: 'limit',
                    type: 'number',
                    required: false,
                    description: 'Maximum number of pull requests to return',
                    default: 25
                },
                {
                    name: 'start',
                    type: 'number',
                    required: false,
                    description: 'Starting index for pagination',
                    default: 0
                }
            ],
            authentication: {
                required: true,
                permissions: ['REPO_READ']
            },
            execute: async (params, context) => {
                return await this.executeTool('bitbucket/pull-request/list', params, context);
            }
        };
    }
    createPullRequestGetTool() {
        return {
            name: 'pull_request_get',
            description: 'Get details of a specific pull request',
            category: 'pull_request',
            version: '1.0.0',
            parameters: [
                {
                    name: 'projectKey',
                    type: 'string',
                    required: true,
                    description: 'Project key containing the repository'
                },
                {
                    name: 'repositorySlug',
                    type: 'string',
                    required: true,
                    description: 'Repository slug/name'
                },
                {
                    name: 'pullRequestId',
                    type: 'number',
                    required: true,
                    description: 'Pull request ID'
                }
            ],
            authentication: {
                required: true,
                permissions: ['REPO_READ']
            },
            execute: async (params, context) => {
                return await this.executeTool('bitbucket/pull-request/get', params, context);
            }
        };
    }
    createPullRequestCreateTool() {
        return {
            name: 'pull_request_create',
            description: 'Create a new pull request',
            category: 'pull_request',
            version: '1.0.0',
            parameters: [
                {
                    name: 'projectKey',
                    type: 'string',
                    required: true,
                    description: 'Project key containing the repository'
                },
                {
                    name: 'repositorySlug',
                    type: 'string',
                    required: true,
                    description: 'Repository slug/name'
                },
                {
                    name: 'title',
                    type: 'string',
                    required: true,
                    description: 'Pull request title'
                },
                {
                    name: 'description',
                    type: 'string',
                    required: false,
                    description: 'Pull request description'
                },
                {
                    name: 'fromRef',
                    type: 'string',
                    required: true,
                    description: 'Source branch/commit'
                },
                {
                    name: 'toRef',
                    type: 'string',
                    required: true,
                    description: 'Target branch/commit'
                },
                {
                    name: 'reviewers',
                    type: 'array',
                    required: false,
                    description: 'List of reviewer usernames'
                }
            ],
            authentication: {
                required: true,
                permissions: ['REPO_WRITE']
            },
            execute: async (params, context) => {
                return await this.executeTool('bitbucket/pull-request/create', params, context);
            }
        };
    }
    createPullRequestUpdateTool() {
        return {
            name: 'pull_request_update',
            description: 'Update a pull request',
            category: 'pull_request',
            version: '1.0.0',
            parameters: [
                {
                    name: 'projectKey',
                    type: 'string',
                    required: true,
                    description: 'Project key containing the repository'
                },
                {
                    name: 'repositorySlug',
                    type: 'string',
                    required: true,
                    description: 'Repository slug/name'
                },
                {
                    name: 'pullRequestId',
                    type: 'number',
                    required: true,
                    description: 'Pull request ID to update'
                },
                {
                    name: 'title',
                    type: 'string',
                    required: false,
                    description: 'New pull request title'
                },
                {
                    name: 'description',
                    type: 'string',
                    required: false,
                    description: 'New pull request description'
                }
            ],
            authentication: {
                required: true,
                permissions: ['REPO_WRITE']
            },
            execute: async (params, context) => {
                return await this.executeTool('bitbucket/pull-request/update', params, context);
            }
        };
    }
    createPullRequestMergeTool() {
        return {
            name: 'pull_request_merge',
            description: 'Merge a pull request',
            category: 'pull_request',
            version: '1.0.0',
            parameters: [
                {
                    name: 'projectKey',
                    type: 'string',
                    required: true,
                    description: 'Project key containing the repository'
                },
                {
                    name: 'repositorySlug',
                    type: 'string',
                    required: true,
                    description: 'Repository slug/name'
                },
                {
                    name: 'pullRequestId',
                    type: 'number',
                    required: true,
                    description: 'Pull request ID to merge'
                },
                {
                    name: 'mergeStrategy',
                    type: 'string',
                    required: false,
                    description: 'Merge strategy to use'
                }
            ],
            authentication: {
                required: true,
                permissions: ['REPO_WRITE']
            },
            execute: async (params, context) => {
                return await this.executeTool('bitbucket/pull-request/merge', params, context);
            }
        };
    }
    createPullRequestDeclineTool() {
        return {
            name: 'pull_request_decline',
            description: 'Decline a pull request',
            category: 'pull_request',
            version: '1.0.0',
            parameters: [
                {
                    name: 'projectKey',
                    type: 'string',
                    required: true,
                    description: 'Project key containing the repository'
                },
                {
                    name: 'repositorySlug',
                    type: 'string',
                    required: true,
                    description: 'Repository slug/name'
                },
                {
                    name: 'pullRequestId',
                    type: 'number',
                    required: true,
                    description: 'Pull request ID to decline'
                },
                {
                    name: 'reason',
                    type: 'string',
                    required: false,
                    description: 'Reason for declining the pull request'
                }
            ],
            authentication: {
                required: true,
                permissions: ['REPO_WRITE']
            },
            execute: async (params, context) => {
                return await this.executeTool('bitbucket/pull-request/decline', params, context);
            }
        };
    }
    // ============================================================================
    // User Tools
    // ============================================================================
    createUserInfoTool() {
        return {
            name: 'user_info',
            description: 'Get current user information',
            category: 'user',
            version: '1.0.0',
            parameters: [],
            authentication: {
                required: true,
                permissions: []
            },
            execute: async (params, context) => {
                return await this.executeTool('bitbucket/user/info', params, context);
            }
        };
    }
    createUserListTool() {
        return {
            name: 'user_list',
            description: 'List users in the system',
            category: 'user',
            version: '1.0.0',
            parameters: [
                {
                    name: 'limit',
                    type: 'number',
                    required: false,
                    description: 'Maximum number of users to return',
                    default: 25
                },
                {
                    name: 'start',
                    type: 'number',
                    required: false,
                    description: 'Starting index for pagination',
                    default: 0
                }
            ],
            authentication: {
                required: true,
                permissions: ['USER_READ']
            },
            execute: async (params, context) => {
                return await this.executeTool('bitbucket/user/list', params, context);
            }
        };
    }
    // ============================================================================
    // Authentication Tools
    // ============================================================================
    createOAuthApplicationCreateTool() {
        return {
            name: 'oauth_application_create',
            description: 'Create a new OAuth application',
            category: 'auth',
            version: '1.0.0',
            parameters: [
                {
                    name: 'name',
                    type: 'string',
                    required: true,
                    description: 'Application name'
                },
                {
                    name: 'description',
                    type: 'string',
                    required: false,
                    description: 'Application description'
                },
                {
                    name: 'callbackUrl',
                    type: 'string',
                    required: false,
                    description: 'OAuth callback URL'
                }
            ],
            authentication: {
                required: true,
                permissions: ['OAUTH_ADMIN']
            },
            execute: async (params, context) => {
                return await this.executeTool('bitbucket/oauth/application/create', params, context);
            }
        };
    }
    createOAuthApplicationGetTool() {
        return {
            name: 'oauth_application_get',
            description: 'Get OAuth application details',
            category: 'auth',
            version: '1.0.0',
            parameters: [
                {
                    name: 'applicationId',
                    type: 'string',
                    required: true,
                    description: 'OAuth application ID'
                }
            ],
            authentication: {
                required: true,
                permissions: ['OAUTH_READ']
            },
            execute: async (params, context) => {
                return await this.executeTool('bitbucket/oauth/application/get', params, context);
            }
        };
    }
    createOAuthApplicationUpdateTool() {
        return {
            name: 'oauth_application_update',
            description: 'Update OAuth application settings',
            category: 'auth',
            version: '1.0.0',
            parameters: [
                {
                    name: 'applicationId',
                    type: 'string',
                    required: true,
                    description: 'OAuth application ID to update'
                },
                {
                    name: 'name',
                    type: 'string',
                    required: false,
                    description: 'New application name'
                },
                {
                    name: 'description',
                    type: 'string',
                    required: false,
                    description: 'New application description'
                },
                {
                    name: 'callbackUrl',
                    type: 'string',
                    required: false,
                    description: 'New OAuth callback URL'
                }
            ],
            authentication: {
                required: true,
                permissions: ['OAUTH_ADMIN']
            },
            execute: async (params, context) => {
                return await this.executeTool('bitbucket/oauth/application/update', params, context);
            }
        };
    }
    createOAuthApplicationDeleteTool() {
        return {
            name: 'oauth_application_delete',
            description: 'Delete an OAuth application',
            category: 'auth',
            version: '1.0.0',
            parameters: [
                {
                    name: 'applicationId',
                    type: 'string',
                    required: true,
                    description: 'OAuth application ID to delete'
                }
            ],
            authentication: {
                required: true,
                permissions: ['OAUTH_ADMIN']
            },
            execute: async (params, context) => {
                return await this.executeTool('bitbucket/oauth/application/delete', params, context);
            }
        };
    }
    createOAuthApplicationListTool() {
        return {
            name: 'oauth_application_list',
            description: 'List OAuth applications',
            category: 'auth',
            version: '1.0.0',
            parameters: [],
            authentication: {
                required: true,
                permissions: ['OAUTH_READ']
            },
            execute: async (params, context) => {
                return await this.executeTool('bitbucket/oauth/application/list', params, context);
            }
        };
    }
    // ============================================================================
    // Session Tools
    // ============================================================================
    createSessionCreateTool() {
        return {
            name: 'session_create',
            description: 'Create a new user session',
            category: 'auth',
            version: '1.0.0',
            parameters: [
                {
                    name: 'userId',
                    type: 'number',
                    required: true,
                    description: 'User ID for the session'
                }
            ],
            authentication: {
                required: true,
                permissions: ['SESSION_ADMIN']
            },
            execute: async (params, context) => {
                return await this.executeTool('bitbucket/session/create', params, context);
            }
        };
    }
    createSessionGetTool() {
        return {
            name: 'session_get',
            description: 'Get current session information',
            category: 'auth',
            version: '1.0.0',
            parameters: [],
            authentication: {
                required: true,
                permissions: []
            },
            execute: async (params, context) => {
                return await this.executeTool('bitbucket/session/get', params, context);
            }
        };
    }
    createSessionRefreshTool() {
        return {
            name: 'session_refresh',
            description: 'Refresh a user session',
            category: 'auth',
            version: '1.0.0',
            parameters: [
                {
                    name: 'sessionId',
                    type: 'string',
                    required: true,
                    description: 'Session ID to refresh'
                }
            ],
            authentication: {
                required: true,
                permissions: ['SESSION_ADMIN']
            },
            execute: async (params, context) => {
                return await this.executeTool('bitbucket/session/refresh', params, context);
            }
        };
    }
    createSessionRevokeTool() {
        return {
            name: 'session_revoke',
            description: 'Revoke a user session',
            category: 'auth',
            version: '1.0.0',
            parameters: [
                {
                    name: 'sessionId',
                    type: 'string',
                    required: true,
                    description: 'Session ID to revoke'
                }
            ],
            authentication: {
                required: true,
                permissions: ['SESSION_ADMIN']
            },
            execute: async (params, context) => {
                return await this.executeTool('bitbucket/session/revoke', params, context);
            }
        };
    }
    createSessionListTool() {
        return {
            name: 'session_list',
            description: 'List active user sessions',
            category: 'auth',
            version: '1.0.0',
            parameters: [
                {
                    name: 'userId',
                    type: 'number',
                    required: true,
                    description: 'User ID to list sessions for'
                }
            ],
            authentication: {
                required: true,
                permissions: ['SESSION_READ']
            },
            execute: async (params, context) => {
                return await this.executeTool('bitbucket/session/list', params, context);
            }
        };
    }
    // ============================================================================
    // Search Tools
    // ============================================================================
    createSearchRepositoriesTool() {
        return {
            name: 'search_repositories',
            description: 'Search repositories',
            category: 'search',
            version: '1.0.0',
            parameters: [
                {
                    name: 'query',
                    type: 'string',
                    required: true,
                    description: 'Search query'
                },
                {
                    name: 'projectKey',
                    type: 'string',
                    required: false,
                    description: 'Filter by project key'
                },
                {
                    name: 'limit',
                    type: 'number',
                    required: false,
                    description: 'Maximum number of results',
                    default: 25
                },
                {
                    name: 'start',
                    type: 'number',
                    required: false,
                    description: 'Starting index for pagination',
                    default: 0
                }
            ],
            authentication: {
                required: true,
                permissions: ['REPO_READ']
            },
            execute: async (params, context) => {
                return await this.executeTool('bitbucket/search/repositories', params, context);
            }
        };
    }
    createSearchCommitsTool() {
        return {
            name: 'search_commits',
            description: 'Search commits',
            category: 'search',
            version: '1.0.0',
            parameters: [
                {
                    name: 'query',
                    type: 'string',
                    required: true,
                    description: 'Search query'
                },
                {
                    name: 'projectKey',
                    type: 'string',
                    required: false,
                    description: 'Filter by project key'
                },
                {
                    name: 'repositorySlug',
                    type: 'string',
                    required: false,
                    description: 'Filter by repository slug'
                },
                {
                    name: 'limit',
                    type: 'number',
                    required: false,
                    description: 'Maximum number of results',
                    default: 25
                },
                {
                    name: 'start',
                    type: 'number',
                    required: false,
                    description: 'Starting index for pagination',
                    default: 0
                }
            ],
            authentication: {
                required: true,
                permissions: ['REPO_READ']
            },
            execute: async (params, context) => {
                return await this.executeTool('bitbucket/search/commits', params, context);
            }
        };
    }
    createSearchPullRequestsTool() {
        return {
            name: 'search_pull_requests',
            description: 'Search pull requests',
            category: 'search',
            version: '1.0.0',
            parameters: [
                {
                    name: 'query',
                    type: 'string',
                    required: true,
                    description: 'Search query'
                },
                {
                    name: 'projectKey',
                    type: 'string',
                    required: false,
                    description: 'Filter by project key'
                },
                {
                    name: 'repositorySlug',
                    type: 'string',
                    required: false,
                    description: 'Filter by repository slug'
                },
                {
                    name: 'limit',
                    type: 'number',
                    required: false,
                    description: 'Maximum number of results',
                    default: 25
                },
                {
                    name: 'start',
                    type: 'number',
                    required: false,
                    description: 'Starting index for pagination',
                    default: 0
                }
            ],
            authentication: {
                required: true,
                permissions: ['REPO_READ']
            },
            execute: async (params, context) => {
                return await this.executeTool('bitbucket/search/pull-requests', params, context);
            }
        };
    }
    createSearchCodeTool() {
        return {
            name: 'search_code',
            description: 'Search code',
            category: 'search',
            version: '1.0.0',
            parameters: [
                {
                    name: 'query',
                    type: 'string',
                    required: true,
                    description: 'Search query'
                },
                {
                    name: 'projectKey',
                    type: 'string',
                    required: false,
                    description: 'Filter by project key'
                },
                {
                    name: 'repositorySlug',
                    type: 'string',
                    required: false,
                    description: 'Filter by repository slug'
                },
                {
                    name: 'limit',
                    type: 'number',
                    required: false,
                    description: 'Maximum number of results',
                    default: 25
                },
                {
                    name: 'start',
                    type: 'number',
                    required: false,
                    description: 'Starting index for pagination',
                    default: 0
                }
            ],
            authentication: {
                required: true,
                permissions: ['REPO_READ']
            },
            execute: async (params, context) => {
                return await this.executeTool('bitbucket/search/code', params, context);
            }
        };
    }
    createSearchUsersTool() {
        return {
            name: 'search_users',
            description: 'Search users',
            category: 'search',
            version: '1.0.0',
            parameters: [
                {
                    name: 'query',
                    type: 'string',
                    required: true,
                    description: 'Search query'
                },
                {
                    name: 'limit',
                    type: 'number',
                    required: false,
                    description: 'Maximum number of results',
                    default: 25
                },
                {
                    name: 'start',
                    type: 'number',
                    required: false,
                    description: 'Starting index for pagination',
                    default: 0
                }
            ],
            authentication: {
                required: true,
                permissions: ['USER_READ']
            },
            execute: async (params, context) => {
                return await this.executeTool('bitbucket/search/users', params, context);
            }
        };
    }
    // ============================================================================
    // Helper Methods
    // ============================================================================
    /**
     * Execute a tool with authentication context
     */
    async executeTool(toolName, params, context) {
        try {
            // Execute tool through integration layer
            const result = await this.toolsIntegration.executeTool(toolName, params, context);
            // Add user context to response metadata
            const enhancedResult = {
                success: result.success,
                data: result.data,
                error: result.error,
                metadata: {
                    ...result.metadata,
                    authentication: {
                        isAuthenticated: context.authentication?.isAuthenticated || false,
                        userId: context.authentication?.userId,
                        userName: context.authentication?.userName,
                        permissions: context.authentication?.permissions || []
                    }
                }
            };
            return enhancedResult;
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: MCPErrorCode.TOOL_EXECUTION_FAILED,
                    message: error.message,
                    details: error
                },
                metadata: {
                    executionTime: 0,
                    memoryUsed: 0,
                    timestamp: new Date(),
                    authentication: {
                        isAuthenticated: context.authentication?.isAuthenticated || false,
                        userId: context.authentication?.userId,
                        userName: context.authentication?.userName,
                        permissions: context.authentication?.permissions || []
                    }
                }
            };
        }
    }
}
//# sourceMappingURL=bitbucket-mcp-tools.js.map