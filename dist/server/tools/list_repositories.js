/**
 * List Repositories Tool
 *
 * MCP tool for listing and discovering Bitbucket repositories with filtering
 * and pagination support. Supports both Bitbucket Data Center and Cloud APIs.
 *
 * Features:
 * - Repository listing with comprehensive metadata
 * - Filtering by workspace, project, and repository properties
 * - Pagination support for large repository lists
 * - Search and sorting capabilities
 * - Integration with workspace and project management
 */
/**
 * List Repositories Tool Parameters
 */
const listRepositoriesParameters = [
    {
        name: 'workspace',
        type: 'string',
        description: 'Workspace or project key to list repositories from (optional, lists all accessible if not provided)',
        required: false,
        schema: {
            pattern: '^[a-zA-Z0-9_-]+$',
            minLength: 1,
            maxLength: 50
        }
    },
    {
        name: 'page',
        type: 'number',
        description: 'Page number for pagination (default: 1)',
        required: false,
        default: 1,
        schema: {
            minimum: 1,
            maximum: 1000
        }
    },
    {
        name: 'page_size',
        type: 'number',
        description: 'Number of repositories per page (default: 25, max: 100)',
        required: false,
        default: 25,
        schema: {
            minimum: 1,
            maximum: 100
        }
    },
    {
        name: 'sort',
        type: 'string',
        description: 'Sort repositories by field',
        required: false,
        default: 'updated_on',
        schema: {
            enum: ['name', 'created_on', 'updated_on', 'size']
        }
    },
    {
        name: 'q',
        type: 'string',
        description: 'Search query to filter repositories by name or description',
        required: false,
        schema: {
            maxLength: 200
        }
    },
    {
        name: 'is_private',
        type: 'boolean',
        description: 'Filter by repository visibility (optional)',
        required: false
    },
    {
        name: 'language',
        type: 'string',
        description: 'Filter by primary programming language',
        required: false,
        schema: {
            enum: ['javascript', 'typescript', 'python', 'java', 'csharp', 'go', 'rust', 'php', 'ruby', 'other']
        }
    },
    {
        name: 'has_issues',
        type: 'boolean',
        description: 'Filter repositories that have issue tracking enabled',
        required: false
    },
    {
        name: 'has_wiki',
        type: 'boolean',
        description: 'Filter repositories that have wiki enabled',
        required: false
    }
];
/**
 * List Repositories Tool Executor
 */
const listRepositoriesExecutor = async (params, context) => {
    try {
        // Set default values
        const page = params.page || 1;
        const pageSize = Math.min(params.page_size || 25, 100);
        const sort = params.sort || 'updated_on';
        // Prepare query parameters
        const queryParams = {
            page,
            pagelen: pageSize,
            sort: `-${sort}` // Bitbucket uses - prefix for descending order
        };
        // Add optional filters
        if (params.q) {
            queryParams.q = params.q;
        }
        if (params.is_private !== undefined) {
            queryParams.is_private = params.is_private;
        }
        if (params.language) {
            queryParams.language = params.language;
        }
        if (params.has_issues !== undefined) {
            queryParams.has_issues = params.has_issues;
        }
        if (params.has_wiki !== undefined) {
            queryParams.has_wiki = params.has_wiki;
        }
        // TODO: Implement actual Bitbucket API call
        // This is a placeholder implementation
        const mockRepositories = [
            {
                id: 'repo_1',
                name: 'my-awesome-project',
                full_name: `${params.workspace || 'workspace'}/my-awesome-project`,
                description: 'An awesome project for demonstration',
                is_private: true,
                language: 'typescript',
                fork_policy: 'allow_forks',
                has_issues: true,
                has_wiki: false,
                size: 1024000,
                created_on: '2024-01-15T10:30:00Z',
                updated_on: '2024-09-20T14:45:00Z',
                clone_urls: {
                    https: `https://bitbucket.org/${params.workspace || 'workspace'}/my-awesome-project.git`,
                    ssh: `git@bitbucket.org:${params.workspace || 'workspace'}/my-awesome-project.git`
                },
                links: {
                    self: {
                        href: `https://api.bitbucket.org/2.0/repositories/${params.workspace || 'workspace'}/my-awesome-project`
                    },
                    html: {
                        href: `https://bitbucket.org/${params.workspace || 'workspace'}/my-awesome-project`
                    }
                }
            },
            {
                id: 'repo_2',
                name: 'documentation-site',
                full_name: `${params.workspace || 'workspace'}/documentation-site`,
                description: 'Project documentation and guides',
                is_private: false,
                language: 'markdown',
                fork_policy: 'allow_forks',
                has_issues: true,
                has_wiki: true,
                size: 512000,
                created_on: '2024-02-01T09:15:00Z',
                updated_on: '2024-09-18T16:20:00Z',
                clone_urls: {
                    https: `https://bitbucket.org/${params.workspace || 'workspace'}/documentation-site.git`,
                    ssh: `git@bitbucket.org:${params.workspace || 'workspace'}/documentation-site.git`
                },
                links: {
                    self: {
                        href: `https://api.bitbucket.org/2.0/repositories/${params.workspace || 'workspace'}/documentation-site`
                    },
                    html: {
                        href: `https://bitbucket.org/${params.workspace || 'workspace'}/documentation-site`
                    }
                }
            }
        ];
        // Apply filters to mock data
        let filteredRepositories = mockRepositories;
        if (params.q) {
            const query = params.q.toLowerCase();
            filteredRepositories = filteredRepositories.filter(repo => repo.name.toLowerCase().includes(query) ||
                repo.description.toLowerCase().includes(query));
        }
        if (params.is_private !== undefined) {
            filteredRepositories = filteredRepositories.filter(repo => repo.is_private === params.is_private);
        }
        if (params.language) {
            filteredRepositories = filteredRepositories.filter(repo => repo.language === params.language);
        }
        if (params.has_issues !== undefined) {
            filteredRepositories = filteredRepositories.filter(repo => repo.has_issues === params.has_issues);
        }
        if (params.has_wiki !== undefined) {
            filteredRepositories = filteredRepositories.filter(repo => repo.has_wiki === params.has_wiki);
        }
        // Apply pagination
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedRepositories = filteredRepositories.slice(startIndex, endIndex);
        // Calculate pagination info
        const totalRepositories = filteredRepositories.length;
        const totalPages = Math.ceil(totalRepositories / pageSize);
        const hasNextPage = page < totalPages;
        const hasPreviousPage = page > 1;
        // Log the repository listing
        context.session?.emit('tool:executed', 'list_repositories', {
            count: paginatedRepositories.length,
            page,
            total_pages: totalPages
        });
        return {
            success: true,
            data: {
                repositories: paginatedRepositories,
                pagination: {
                    page,
                    page_size: pageSize,
                    total_pages: totalPages,
                    total_repositories: totalRepositories,
                    has_next_page: hasNextPage,
                    has_previous_page: hasPreviousPage
                },
                filters: {
                    workspace: params.workspace,
                    search_query: params.q,
                    is_private: params.is_private,
                    language: params.language,
                    has_issues: params.has_issues,
                    has_wiki: params.has_wiki
                }
            },
            metadata: {
                timestamp: new Date(),
                tool: 'list_repositories',
                execution_time: Date.now() - context.request.timestamp.getTime(),
                workspace: params.workspace || 'all'
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
                tool: 'list_repositories',
                error_type: error instanceof Error ? error.constructor.name : 'Unknown'
            }
        };
    }
};
/**
 * List Repositories Tool Definition
 */
export const listRepositoriesTool = {
    name: 'list_repositories',
    description: 'List and discover Bitbucket repositories with filtering, search, and pagination support',
    parameters: listRepositoriesParameters,
    category: 'repository_management',
    version: '1.0.0',
    enabled: true,
    execute: listRepositoriesExecutor,
    metadata: {
        api_endpoint: '/2.0/repositories/{workspace}',
        supported_apis: ['bitbucket_cloud', 'bitbucket_data_center'],
        requires_auth: true,
        rate_limit: '1000/hour'
    }
};
export default listRepositoriesTool;
//# sourceMappingURL=list_repositories.js.map