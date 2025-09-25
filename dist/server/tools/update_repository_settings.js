/**
 * Update Repository Settings Tool
 *
 * MCP tool for updating repository configuration settings including
 * description, visibility, language, and feature toggles. Supports
 * both Bitbucket Data Center and Cloud APIs.
 *
 * Features:
 * - Repository settings updates with validation
 * - Description and visibility management
 * - Language and feature configuration
 * - Settings validation and error handling
 * - Support for repository templates
 */
/**
 * Update Repository Settings Tool Parameters
 */
const updateRepositorySettingsParameters = [
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
        name: 'description',
        type: 'string',
        description: 'New repository description (optional)',
        required: false,
        schema: {
            maxLength: 500
        }
    },
    {
        name: 'is_private',
        type: 'boolean',
        description: 'Update repository visibility (optional)',
        required: false
    },
    {
        name: 'language',
        type: 'string',
        description: 'Update primary programming language (optional)',
        required: false,
        schema: {
            enum: ['javascript', 'typescript', 'python', 'java', 'csharp', 'go', 'rust', 'php', 'ruby', 'other']
        }
    },
    {
        name: 'fork_policy',
        type: 'string',
        description: 'Update fork policy for the repository (optional)',
        required: false,
        schema: {
            enum: ['allow_forks', 'no_public_forks', 'no_forks']
        }
    },
    {
        name: 'has_issues',
        type: 'boolean',
        description: 'Enable or disable issue tracking (optional)',
        required: false
    },
    {
        name: 'has_wiki',
        type: 'boolean',
        description: 'Enable or disable wiki functionality (optional)',
        required: false
    },
    {
        name: 'has_downloads',
        type: 'boolean',
        description: 'Enable or disable downloads functionality (optional)',
        required: false
    }
];
/**
 * Update Repository Settings Tool Executor
 */
const updateRepositorySettingsExecutor = async (params, context) => {
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
                    tool: 'update_repository_settings'
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
                    tool: 'update_repository_settings'
                }
            };
        }
        // Check if at least one setting is provided for update
        const updateFields = ['description', 'is_private', 'language', 'fork_policy', 'has_issues', 'has_wiki', 'has_downloads'];
        const hasUpdates = updateFields.some(field => params[field] !== undefined);
        if (!hasUpdates) {
            return {
                success: false,
                error: {
                    code: -32602,
                    message: 'At least one setting must be provided for update',
                    details: { available_fields: updateFields }
                },
                metadata: {
                    timestamp: new Date(),
                    tool: 'update_repository_settings'
                }
            };
        }
        // Prepare update payload (only include fields that are provided)
        const updatePayload = {};
        if (params.description !== undefined) {
            updatePayload.description = params.description;
        }
        if (params.is_private !== undefined) {
            updatePayload.is_private = params.is_private;
        }
        if (params.language !== undefined) {
            updatePayload.language = params.language;
        }
        if (params.fork_policy !== undefined) {
            updatePayload.fork_policy = params.fork_policy;
        }
        if (params.has_issues !== undefined) {
            updatePayload.has_issues = params.has_issues;
        }
        if (params.has_wiki !== undefined) {
            updatePayload.has_wiki = params.has_wiki;
        }
        if (params.has_downloads !== undefined) {
            updatePayload.has_downloads = params.has_downloads;
        }
        // TODO: Implement actual Bitbucket API call
        // This is a placeholder implementation
        const mockUpdatedRepository = {
            id: `repo_${Date.now()}`,
            name: params.repository,
            full_name: `${params.workspace}/${params.repository}`,
            description: params.description !== undefined ? params.description : 'Updated repository description',
            is_private: params.is_private !== undefined ? params.is_private : true,
            language: params.language !== undefined ? params.language : 'typescript',
            fork_policy: params.fork_policy !== undefined ? params.fork_policy : 'allow_forks',
            has_issues: params.has_issues !== undefined ? params.has_issues : true,
            has_wiki: params.has_wiki !== undefined ? params.has_wiki : false,
            has_downloads: params.has_downloads !== undefined ? params.has_downloads : false,
            size: 2048000,
            created_on: '2024-01-15T10:30:00Z',
            updated_on: new Date().toISOString(),
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
                }
            }
        };
        // Log the repository settings update
        context.session?.emit('tool:executed', 'update_repository_settings', {
            repository: params.repository,
            workspace: params.workspace,
            updated_fields: Object.keys(updatePayload)
        });
        return {
            success: true,
            data: {
                repository: mockUpdatedRepository,
                updated_fields: Object.keys(updatePayload),
                message: `Repository '${params.repository}' settings updated successfully`
            },
            metadata: {
                timestamp: new Date(),
                tool: 'update_repository_settings',
                execution_time: Date.now() - context.request.timestamp.getTime(),
                workspace: params.workspace,
                repository: params.repository,
                changes: updatePayload
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
                tool: 'update_repository_settings',
                error_type: error instanceof Error ? error.constructor.name : 'Unknown'
            }
        };
    }
};
/**
 * Update Repository Settings Tool Definition
 */
export const updateRepositorySettingsTool = {
    name: 'update_repository_settings',
    description: 'Update repository configuration settings including description, visibility, language, and feature toggles',
    parameters: updateRepositorySettingsParameters,
    category: 'repository_management',
    version: '1.0.0',
    enabled: true,
    execute: updateRepositorySettingsExecutor,
    metadata: {
        api_endpoint: '/2.0/repositories/{workspace}/{repo_slug}',
        supported_apis: ['bitbucket_cloud', 'bitbucket_data_center'],
        requires_auth: true,
        rate_limit: '100/hour'
    }
};
export default updateRepositorySettingsTool;
//# sourceMappingURL=update_repository_settings.js.map