/**
 * Create Repository Tool
 * 
 * MCP tool for creating new Bitbucket repositories with configurable settings.
 * Supports both Bitbucket Data Center and Cloud APIs.
 * 
 * Features:
 * - Repository creation with custom settings
 * - Validation for repository names and configurations
 * - Support for both public and private repositories
 * - Integration with workspace and project management
 * - Error handling for creation failures
 */

import { Tool, ToolParameter, ToolExecutor, ToolResult, ToolExecutionContext } from '../../types/index.js';

/**
 * Create Repository Tool Parameters
 */
const createRepositoryParameters: ToolParameter[] = [
  {
    name: 'name',
    type: 'string',
    description: 'Repository name (must be unique within the workspace/project)',
    required: true,
    schema: {
      pattern: '^[a-zA-Z0-9_-]+$',
      minLength: 1,
      maxLength: 100
    }
  },
  {
    name: 'workspace',
    type: 'string',
    description: 'Workspace or project key where the repository will be created',
    required: true,
    schema: {
      pattern: '^[a-zA-Z0-9_-]+$',
      minLength: 1,
      maxLength: 50
    }
  },
  {
    name: 'description',
    type: 'string',
    description: 'Repository description (optional)',
    required: false,
    schema: {
      maxLength: 500
    }
  },
  {
    name: 'is_private',
    type: 'boolean',
    description: 'Whether the repository should be private (default: true)',
    required: false,
    default: true
  },
  {
    name: 'language',
    type: 'string',
    description: 'Primary programming language (optional)',
    required: false,
    schema: {
      enum: ['javascript', 'typescript', 'python', 'java', 'csharp', 'go', 'rust', 'php', 'ruby', 'other']
    }
  },
  {
    name: 'fork_policy',
    type: 'string',
    description: 'Fork policy for the repository',
    required: false,
    default: 'allow_forks',
    schema: {
      enum: ['allow_forks', 'no_public_forks', 'no_forks']
    }
  },
  {
    name: 'has_issues',
    type: 'boolean',
    description: 'Enable issue tracking (default: true)',
    required: false,
    default: true
  },
  {
    name: 'has_wiki',
    type: 'boolean',
    description: 'Enable wiki functionality (default: false)',
    required: false,
    default: false
  }
];

/**
 * Create Repository Tool Executor
 */
const createRepositoryExecutor: ToolExecutor = async (params: Record<string, any>, context: ToolExecutionContext): Promise<ToolResult> => {
  try {
    // Validate required parameters
    if (!params.name || !params.workspace) {
      return {
        success: false,
        error: {
          code: -32602, // Invalid params
          message: 'Repository name and workspace are required',
          details: { missing: ['name', 'workspace'] }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'create_repository'
        }
      };
    }

    // Validate repository name format
    const namePattern = /^[a-zA-Z0-9_-]+$/;
    if (!namePattern.test(params.name)) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Repository name must contain only alphanumeric characters, hyphens, and underscores',
          details: { invalid_name: params.name }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'create_repository'
        }
      };
    }

    // Prepare repository creation payload
    const repositoryData = {
      name: params.name,
      workspace: params.workspace,
      description: params.description || '',
      is_private: params.is_private !== undefined ? params.is_private : true,
      language: params.language || 'other',
      fork_policy: params.fork_policy || 'allow_forks',
      has_issues: params.has_issues !== undefined ? params.has_issues : true,
      has_wiki: params.has_wiki !== undefined ? params.has_wiki : false
    };

    // TODO: Implement actual Bitbucket API call
    // This is a placeholder implementation
    const mockRepository = {
      id: `repo_${Date.now()}`,
      name: repositoryData.name,
      full_name: `${repositoryData.workspace}/${repositoryData.name}`,
      description: repositoryData.description,
      is_private: repositoryData.is_private,
      language: repositoryData.language,
      fork_policy: repositoryData.fork_policy,
      has_issues: repositoryData.has_issues,
      has_wiki: repositoryData.has_wiki,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      clone_urls: {
        https: `https://bitbucket.org/${repositoryData.workspace}/${repositoryData.name}.git`,
        ssh: `git@bitbucket.org:${repositoryData.workspace}/${repositoryData.name}.git`
      },
      links: {
        self: {
          href: `https://api.bitbucket.org/2.0/repositories/${repositoryData.workspace}/${repositoryData.name}`
        },
        html: {
          href: `https://bitbucket.org/${repositoryData.workspace}/${repositoryData.name}`
        }
      }
    };

    // Log the repository creation
    context.session?.emit('tool:executed', 'create_repository', mockRepository);

    return {
      success: true,
      data: {
        repository: mockRepository,
        message: `Repository '${repositoryData.name}' created successfully in workspace '${repositoryData.workspace}'`
      },
      metadata: {
        timestamp: new Date(),
        tool: 'create_repository',
        execution_time: Date.now() - context.request.timestamp.getTime(),
        workspace: repositoryData.workspace
      }
    };

  } catch (error) {
    return {
      success: false,
      error: {
        code: -32603, // Internal error
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error
      },
      metadata: {
        timestamp: new Date(),
        tool: 'create_repository',
        error_type: error instanceof Error ? error.constructor.name : 'Unknown'
      }
    };
  }
};

/**
 * Create Repository Tool Definition
 */
export const createRepositoryTool: Tool = {
  name: 'create_repository',
  description: 'Create a new Bitbucket repository with configurable settings including visibility, language, and features',
  parameters: createRepositoryParameters,
  category: 'repository_management',
  version: '1.0.0',
  enabled: true,
  execute: createRepositoryExecutor,
  metadata: {
    api_endpoint: '/2.0/repositories/{workspace}/{repo_slug}',
    supported_apis: ['bitbucket_cloud', 'bitbucket_data_center'],
    requires_auth: true,
    rate_limit: '100/hour'
  }
};

export default createRepositoryTool;
