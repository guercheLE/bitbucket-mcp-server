/**
 * Get Repository Tool
 *
 * MCP tool for retrieving comprehensive repository information including
 * metadata, statistics, and configuration details. Supports both Bitbucket
 * Data Center and Cloud APIs.
 *
 * Features:
 * - Comprehensive repository metadata retrieval
 * - Clone URL generation and access information
 * - Repository statistics and activity data
 * - Branch information and default branch details
 * - Integration with workspace and project management
 */
/**
 * Get Repository Tool Parameters
 */
const getRepositoryParameters = [
    {
        name: 'workspace',
        type: 'string',
        description: 'Workspace or project key where the repository is located',
        required: true,
        schema: {
            pattern: '^[a-zA-Z0-9_-]+$',
            minLength: 1,
            maxLength: 50
        }
    },
    {
        name: 'repository',
        type: 'string',
        description: 'Repository name or slug',
        required: true,
        schema: {
            pattern: '^[a-zA-Z0-9_-]+$',
            minLength: 1,
            maxLength: 100
        }
    },
    {
        name: 'include_branches',
        type: 'boolean',
        description: 'Include branch information in the response (default: true)',
        required: false,
        default: true
    },
    {
        name: 'include_statistics',
        type: 'boolean',
        description: 'Include repository statistics and activity data (default: true)',
        required: false,
        default: true
    },
    {
        name: 'include_permissions',
        type: 'boolean',
        description: 'Include repository permissions and access information (default: false)',
        required: false,
        default: false
    }
];
/**
 * Get Repository Tool Executor
 */
const getRepositoryExecutor = async (params, context) => {
    try {
        // Validate required parameters
        if (!params.workspace || !params.repository) {
            return {
                success: false,
                error: {
                    code: -32602, // Invalid params
                    message: 'Workspace and repository are required',
                    details: { missing: ['workspace', 'repository'] }
                },
                metadata: {
                    timestamp: new Date(),
                    tool: 'get_repository'
                }
            };
        }
        // Validate repository name format
        const namePattern = /^[a-zA-Z0-9_-]+$/;
        if (!namePattern.test(params.repository)) {
            return {
                success: false,
                error: {
                    code: -32602,
                    message: 'Repository name must contain only alphanumeric characters, hyphens, and underscores',
                    details: { invalid_repository: params.repository }
                },
                metadata: {
                    timestamp: new Date(),
                    tool: 'get_repository'
                }
            };
        }
        // TODO: Implement actual Bitbucket API call
        // This is a placeholder implementation
        const mockRepository = {
            id: `repo_${Date.now()}`,
            name: params.repository,
            full_name: `${params.workspace}/${params.repository}`,
            description: 'A comprehensive repository with detailed information',
            is_private: true,
            language: 'typescript',
            fork_policy: 'allow_forks',
            has_issues: true,
            has_wiki: false,
            size: 2048000,
            created_on: '2024-01-15T10:30:00Z',
            updated_on: '2024-09-20T14:45:00Z',
            clone_urls: {
                https: `https://bitbucket.org/${params.workspace}/${params.repository}.git`,
                ssh: `git@bitbucket.org:${params.workspace}/${params.repository}.git`
            },
            links: {
                self: {
                    href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}`
                },
                html: {
                    href: `https://bitbucket.org/${params.workspace}/${params.repository}`
                },
                clone: [
                    {
                        name: 'https',
                        href: `https://bitbucket.org/${params.workspace}/${params.repository}.git`
                    },
                    {
                        name: 'ssh',
                        href: `git@bitbucket.org:${params.workspace}/${params.repository}.git`
                    }
                ]
            },
            owner: {
                display_name: 'Repository Owner',
                username: params.workspace,
                links: {
                    self: {
                        href: `https://api.bitbucket.org/2.0/workspaces/${params.workspace}`
                    },
                    html: {
                        href: `https://bitbucket.org/${params.workspace}/`
                    }
                }
            }
        };
        // Add branch information if requested
        let branches = null;
        if (params.include_branches !== false) {
            branches = {
                default_branch: 'main',
                branches: [
                    {
                        name: 'main',
                        type: 'branch',
                        target: {
                            hash: 'abc123def456',
                            author: {
                                raw: 'Developer <developer@example.com>'
                            },
                            date: '2024-09-20T14:45:00Z',
                            message: 'Latest commit message'
                        },
                        links: {
                            commits: {
                                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/commits/main`
                            },
                            self: {
                                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/refs/branches/main`
                            },
                            html: {
                                href: `https://bitbucket.org/${params.workspace}/${params.repository}/branch/main`
                            }
                        }
                    },
                    {
                        name: 'develop',
                        type: 'branch',
                        target: {
                            hash: 'def456ghi789',
                            author: {
                                raw: 'Developer <developer@example.com>'
                            },
                            date: '2024-09-19T16:30:00Z',
                            message: 'Development branch commit'
                        },
                        links: {
                            commits: {
                                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/commits/develop`
                            },
                            self: {
                                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/refs/branches/develop`
                            },
                            html: {
                                href: `https://bitbucket.org/${params.workspace}/${params.repository}/branch/develop`
                            }
                        }
                    }
                ]
            };
        }
        // Add statistics if requested
        let statistics = null;
        if (params.include_statistics !== false) {
            statistics = {
                commits: 1250,
                branches: 8,
                tags: 12,
                forks: 5,
                watchers: 15,
                issues: {
                    open: 3,
                    closed: 47
                },
                pull_requests: {
                    open: 2,
                    merged: 89,
                    declined: 5
                },
                contributors: 8,
                last_activity: '2024-09-20T14:45:00Z'
            };
        }
        // Add permissions if requested
        let permissions = null;
        if (params.include_permissions === true) {
            permissions = {
                read: ['user1', 'user2', 'group:developers'],
                write: ['user1', 'group:developers'],
                admin: ['user1'],
                public_read: false
            };
        }
        // Build response data
        const responseData = {
            repository: mockRepository
        };
        if (branches) {
            responseData.branches = branches;
        }
        if (statistics) {
            responseData.statistics = statistics;
        }
        if (permissions) {
            responseData.permissions = permissions;
        }
        // Log the repository retrieval
        context.session?.emit('tool:executed', 'get_repository', {
            repository: params.repository,
            workspace: params.workspace
        });
        return {
            success: true,
            data: responseData,
            metadata: {
                timestamp: new Date(),
                tool: 'get_repository',
                execution_time: Date.now() - context.request.timestamp.getTime(),
                workspace: params.workspace,
                repository: params.repository,
                includes: {
                    branches: params.include_branches !== false,
                    statistics: params.include_statistics !== false,
                    permissions: params.include_permissions === true
                }
            }
        };
    }
    catch (error) {
        return {
            success: false,
            error: {
                code: -32603, // Internal error
                message: error instanceof Error ? error.message : 'Unknown error occurred',
                details: error
            },
            metadata: {
                timestamp: new Date(),
                tool: 'get_repository',
                error_type: error instanceof Error ? error.constructor.name : 'Unknown'
            }
        };
    }
};
/**
 * Get Repository Tool Definition
 */
export const getRepositoryTool = {
    name: 'get_repository',
    description: 'Retrieve comprehensive repository information including metadata, statistics, branches, and permissions',
    parameters: getRepositoryParameters,
    category: 'repository_management',
    version: '1.0.0',
    enabled: true,
    execute: getRepositoryExecutor,
    metadata: {
        api_endpoint: '/2.0/repositories/{workspace}/{repo_slug}',
        supported_apis: ['bitbucket_cloud', 'bitbucket_data_center'],
        requires_auth: true,
        rate_limit: '1000/hour'
    }
};
export default getRepositoryTool;
//# sourceMappingURL=get_repository.js.map