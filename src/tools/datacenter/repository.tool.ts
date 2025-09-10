/**
 * Data Center Repository Tools
 * Ferramentas para gerenciamento de repositórios no Bitbucket Data Center
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPool, Pool } from 'generic-pool';
import { RepositoryService } from '../../services/datacenter/repository.service.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';
import { createMcpResponse, createErrorResponse } from '../../services/types/base.types.js';
import { z } from 'zod';

// Zod schemas for parameter validation
const CreateRepositorySchema = z.object({
  projectKey: z.string(),
  name: z.string(),
  description: z.string().optional(),
  forkable: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetRepositorySchema = z.object({
  projectKey: z.string(),
  repositorySlug: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateRepositorySchema = z.object({
  projectKey: z.string(),
  repositorySlug: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  forkable: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteRepositorySchema = z.object({
  projectKey: z.string(),
  repositorySlug: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListRepositoriesSchema = z.object({
  projectKey: z.string(),
  start: z.number().optional(),
  limit: z.number().optional(),
  name: z.string().optional(),
  permission: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetRepositoryPermissionsSchema = z.object({
  projectKey: z.string(),
  repositorySlug: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const AddRepositoryPermissionSchema = z.object({
  projectKey: z.string(),
  repositorySlug: z.string(),
  user: z.string().optional(),
  group: z.string().optional(),
  permission: z.string().optional().default('REPO_READ'),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const RemoveRepositoryPermissionSchema = z.object({
  projectKey: z.string(),
  repositorySlug: z.string(),
  user: z.string().optional(),
  group: z.string().optional(),
  permission: z.string().optional().default('REPO_READ'),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetRepositoryBranchesSchema = z.object({
  projectKey: z.string(),
  repositorySlug: z.string(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateRepositoryBranchSchema = z.object({
  projectKey: z.string(),
  repositorySlug: z.string(),
  name: z.string(),
  startPoint: z.string(),
  message: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetRepositoryTagsSchema = z.object({
  projectKey: z.string(),
  repositorySlug: z.string(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateRepositoryTagSchema = z.object({
  projectKey: z.string(),
  repositorySlug: z.string(),
  name: z.string(),
  startPoint: z.string(),
  message: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetRepositorySettingsSchema = z.object({
  projectKey: z.string(),
  repositorySlug: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateRepositorySettingsSchema = z.object({
  projectKey: z.string(),
  repositorySlug: z.string(),
  settings: z.object({
    defaultBranch: z.string().optional(),
    defaultMergeStrategy: z.string().optional(),
    defaultCommitMessage: z.string().optional(),
  }),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetRepositoryHooksSchema = z.object({
  projectKey: z.string(),
  repositorySlug: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateRepositoryHookSchema = z.object({
  projectKey: z.string(),
  repositorySlug: z.string(),
  hook: z.object({
    url: z.string(),
    events: z.array(z.string()),
    active: z.boolean().optional(),
  }),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetRepositoryHookSchema = z.object({
  projectKey: z.string(),
  repositorySlug: z.string(),
  hookId: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateRepositoryHookSchema = z.object({
  projectKey: z.string(),
  repositorySlug: z.string(),
  hookId: z.string(),
  hook: z.object({
    url: z.string().optional(),
    events: z.array(z.string()).optional(),
    active: z.boolean().optional(),
  }),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteRepositoryHookSchema = z.object({
  projectKey: z.string(),
  repositorySlug: z.string(),
  hookId: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetRepositoryForksSchema = z.object({
  projectKey: z.string(),
  repositorySlug: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateRepositoryForkSchema = z.object({
  projectKey: z.string(),
  repositorySlug: z.string(),
  fork: z.object({
    name: z.string().optional(),
    project: z
      .object({
        key: z.string(),
      })
      .optional(),
    public: z.boolean().optional(),
  }),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

/**
 * Repository Tools for Bitbucket Data Center
 *
 * Comprehensive repository management including:
 * - Repository CRUD operations
 * - Repository permissions
 * - Repository settings
 * - Repository hooks
 * - Branches and tags
 */
export class DataCenterRepositoryTools {
  private static logger = Logger.forContext('DataCenterRepositoryTools');
  private static repositoryServicePool: Pool<RepositoryService>;

  static initialize(): void {
    const repositoryServiceFactory = {
      create: async () =>
        new RepositoryService(new ApiClient(), Logger.forContext('RepositoryService')),
      destroy: async () => {},
    };

    this.repositoryServicePool = createPool(repositoryServiceFactory, {
      min: 2,
      max: 10,
    });
    this.logger.info('Data Center Repository tools initialized');
  }

  /**
   * Create a new repository
   */
  static async createRepository(
    projectKey: string,
    name: string,
    description?: string,
    forkable?: boolean,
    isPublic?: boolean,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('createRepository');
    let repositoryService = null;

    try {
      methodLogger.debug('Creating repository:', { projectKey, name });
      repositoryService = await this.repositoryServicePool.acquire();

      const request = {
        name,
        ...(description && { description }),
        ...(forkable !== undefined && { forkable }),
        ...(isPublic !== undefined && { public: isPublic }),
      };

      const result = await repositoryService.createRepository(projectKey, request);
      methodLogger.debug('Successfully created repository');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create repository:', error);
      if (repositoryService) {
        this.repositoryServicePool.destroy(repositoryService);
        repositoryService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (repositoryService) {
        this.repositoryServicePool.release(repositoryService);
      }
    }
  }

  /**
   * Get repository
   */
  static async getRepository(
    projectKey: string,
    repositorySlug: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getRepository');
    let repositoryService = null;

    try {
      methodLogger.debug('Getting repository:', { projectKey, repositorySlug });
      repositoryService = await this.repositoryServicePool.acquire();

      const result = await repositoryService.getRepository(projectKey, repositorySlug);
      methodLogger.debug('Successfully retrieved repository');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get repository:', error);
      if (repositoryService) {
        this.repositoryServicePool.destroy(repositoryService);
        repositoryService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (repositoryService) {
        this.repositoryServicePool.release(repositoryService);
      }
    }
  }

  /**
   * Update repository
   */
  static async updateRepository(
    projectKey: string,
    repositorySlug: string,
    name?: string,
    description?: string,
    forkable?: boolean,
    isPublic?: boolean,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('updateRepository');
    let repositoryService = null;

    try {
      methodLogger.debug('Updating repository:', { projectKey, repositorySlug });
      repositoryService = await this.repositoryServicePool.acquire();

      const request = {
        ...(name && { name }),
        ...(description && { description }),
        ...(forkable !== undefined && { forkable }),
        ...(isPublic !== undefined && { public: isPublic }),
      };

      const result = await repositoryService.updateRepository(projectKey, repositorySlug, request);
      methodLogger.debug('Successfully updated repository');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update repository:', error);
      if (repositoryService) {
        this.repositoryServicePool.destroy(repositoryService);
        repositoryService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (repositoryService) {
        this.repositoryServicePool.release(repositoryService);
      }
    }
  }

  /**
   * Delete repository
   */
  static async deleteRepository(
    projectKey: string,
    repositorySlug: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('deleteRepository');
    let repositoryService = null;

    try {
      methodLogger.debug('Deleting repository:', { projectKey, repositorySlug });
      repositoryService = await this.repositoryServicePool.acquire();

      await repositoryService.deleteRepository(projectKey, repositorySlug);
      methodLogger.debug('Successfully deleted repository');
      return createMcpResponse(
        { success: true, message: 'Repository deleted successfully' },
        output
      );
    } catch (error) {
      methodLogger.error('Failed to delete repository:', error);
      if (repositoryService) {
        this.repositoryServicePool.destroy(repositoryService);
        repositoryService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (repositoryService) {
        this.repositoryServicePool.release(repositoryService);
      }
    }
  }

  /**
   * List repositories
   */
  static async listRepositories(
    projectKey: string,
    start?: number,
    limit?: number,
    name?: string,
    permission?: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('listRepositories');
    let repositoryService = null;

    try {
      methodLogger.debug('Listing repositories:', { projectKey });
      repositoryService = await this.repositoryServicePool.acquire();

      const params = {
        ...(start && { start }),
        ...(limit && { limit }),
        ...(name && { name }),
        ...(permission && { permission }),
      };

      const result = await repositoryService.listRepositories(projectKey, {
        permission: params.permission as 'REPO_READ' | 'REPO_WRITE' | 'REPO_ADMIN',
        name: params.name,
        limit: params.limit,
        start: params.start,
      });
      methodLogger.debug('Successfully listed repositories');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list repositories:', error);
      if (repositoryService) {
        this.repositoryServicePool.destroy(repositoryService);
        repositoryService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (repositoryService) {
        this.repositoryServicePool.release(repositoryService);
      }
    }
  }

  /**
   * Get repository permissions
   */
  static async getRepositoryPermissions(
    projectKey: string,
    repositorySlug: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getRepositoryPermissions');
    let repositoryService = null;

    try {
      methodLogger.debug('Getting repository permissions:', { projectKey, repositorySlug });
      repositoryService = await this.repositoryServicePool.acquire();

      const result = await repositoryService.getRepositoryPermissions(projectKey, repositorySlug);
      methodLogger.debug('Successfully retrieved repository permissions');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get repository permissions:', error);
      if (repositoryService) {
        this.repositoryServicePool.destroy(repositoryService);
        repositoryService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (repositoryService) {
        this.repositoryServicePool.release(repositoryService);
      }
    }
  }

  /**
   * Add repository permission
   */
  static async addRepositoryPermission(
    projectKey: string,
    repositorySlug: string,
    user?: string,
    group?: string,
    permission: string = 'REPO_READ',
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('addRepositoryPermission');
    let repositoryService = null;

    try {
      methodLogger.debug('Adding repository permission:', {
        projectKey,
        repositorySlug,
        user,
        group,
        permission,
      });
      repositoryService = await this.repositoryServicePool.acquire();

      const request = {
        ...(user && { user }),
        ...(group && { group }),
        permission,
      };

      await repositoryService.addRepositoryPermission(projectKey, repositorySlug, {
        permission: request.permission as 'REPO_READ' | 'REPO_WRITE' | 'REPO_ADMIN',
        group: request.group ? { name: request.group } : undefined,
        user: request.user ? { name: request.user } : undefined,
      });
      methodLogger.debug('Successfully added repository permission');
      return createMcpResponse(
        { success: true, message: 'Repository permission added successfully' },
        output
      );
    } catch (error) {
      methodLogger.error('Failed to add repository permission:', error);
      if (repositoryService) {
        this.repositoryServicePool.destroy(repositoryService);
        repositoryService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (repositoryService) {
        this.repositoryServicePool.release(repositoryService);
      }
    }
  }

  /**
   * Remove repository permission
   */
  static async removeRepositoryPermission(
    projectKey: string,
    repositorySlug: string,
    user?: string,
    group?: string,
    permission: string = 'REPO_READ',
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('removeRepositoryPermission');
    let repositoryService = null;

    try {
      methodLogger.debug('Removing repository permission:', {
        projectKey,
        repositorySlug,
        user,
        group,
        permission,
      });
      repositoryService = await this.repositoryServicePool.acquire();

      const request = {
        ...(user && { user }),
        ...(group && { group }),
        permission,
      };

      await repositoryService.removeRepositoryPermission(projectKey, repositorySlug, {
        permission: request.permission as 'REPO_READ' | 'REPO_WRITE' | 'REPO_ADMIN',
        group: request.group ? { name: request.group } : undefined,
        user: request.user ? { name: request.user } : undefined,
      });
      methodLogger.debug('Successfully removed repository permission');
      return createMcpResponse(
        { success: true, message: 'Repository permission removed successfully' },
        output
      );
    } catch (error) {
      methodLogger.error('Failed to remove repository permission:', error);
      if (repositoryService) {
        this.repositoryServicePool.destroy(repositoryService);
        repositoryService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (repositoryService) {
        this.repositoryServicePool.release(repositoryService);
      }
    }
  }

  /**
   * Get repository branches
   */
  static async getRepositoryBranches(
    projectKey: string,
    repositorySlug: string,
    start?: number,
    limit?: number,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getRepositoryBranches');
    let repositoryService = null;

    try {
      methodLogger.debug('Getting repository branches:', { projectKey, repositorySlug });
      repositoryService = await this.repositoryServicePool.acquire();

      const params = {
        ...(start && { start }),
        ...(limit && { limit }),
      };

      const result = await repositoryService.getRepositoryBranches(
        projectKey,
        repositorySlug,
        params
      );
      methodLogger.debug('Successfully retrieved repository branches');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get repository branches:', error);
      if (repositoryService) {
        this.repositoryServicePool.destroy(repositoryService);
        repositoryService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (repositoryService) {
        this.repositoryServicePool.release(repositoryService);
      }
    }
  }

  /**
   * Create repository branch
   */
  static async createRepositoryBranch(
    projectKey: string,
    repositorySlug: string,
    name: string,
    startPoint: string,
    message?: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('createRepositoryBranch');
    let repositoryService = null;

    try {
      methodLogger.debug('Creating repository branch:', { projectKey, repositorySlug, name });
      repositoryService = await this.repositoryServicePool.acquire();

      const request = {
        name,
        startPoint,
        ...(message && { message }),
      };

      const result = await repositoryService.createRepositoryBranch(
        projectKey,
        repositorySlug,
        request
      );
      methodLogger.debug('Successfully created repository branch');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create repository branch:', error);
      if (repositoryService) {
        this.repositoryServicePool.destroy(repositoryService);
        repositoryService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (repositoryService) {
        this.repositoryServicePool.release(repositoryService);
      }
    }
  }

  /**
   * Get repository tags
   */
  static async getRepositoryTags(
    projectKey: string,
    repositorySlug: string,
    start?: number,
    limit?: number,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getRepositoryTags');
    let repositoryService = null;

    try {
      methodLogger.debug('Getting repository tags:', { projectKey, repositorySlug });
      repositoryService = await this.repositoryServicePool.acquire();

      const params = {
        ...(start && { start }),
        ...(limit && { limit }),
      };

      const result = await repositoryService.getRepositoryTags(projectKey, repositorySlug, params);
      methodLogger.debug('Successfully retrieved repository tags');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get repository tags:', error);
      if (repositoryService) {
        this.repositoryServicePool.destroy(repositoryService);
        repositoryService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (repositoryService) {
        this.repositoryServicePool.release(repositoryService);
      }
    }
  }

  /**
   * Create repository tag
   */
  static async createRepositoryTag(
    projectKey: string,
    repositorySlug: string,
    name: string,
    startPoint: string,
    message?: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('createRepositoryTag');
    let repositoryService = null;

    try {
      methodLogger.debug('Creating repository tag:', { projectKey, repositorySlug, name });
      repositoryService = await this.repositoryServicePool.acquire();

      const request = {
        name,
        startPoint,
        ...(message && { message }),
      };

      const result = await repositoryService.createRepositoryTag(
        projectKey,
        repositorySlug,
        request
      );
      methodLogger.debug('Successfully created repository tag');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create repository tag:', error);
      if (repositoryService) {
        this.repositoryServicePool.destroy(repositoryService);
        repositoryService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (repositoryService) {
        this.repositoryServicePool.release(repositoryService);
      }
    }
  }

  static async getRepositorySettings(
    projectKey: string,
    repositorySlug: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getRepositorySettings');
    let repositoryService = null;

    try {
      methodLogger.debug('Getting repository settings:', { projectKey, repositorySlug });
      repositoryService = await this.repositoryServicePool.acquire();

      const result = await repositoryService.getRepositorySettings(projectKey, repositorySlug);

      methodLogger.debug('Successfully retrieved repository settings');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get repository settings:', error);
      if (repositoryService) {
        this.repositoryServicePool.destroy(repositoryService);
        repositoryService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (repositoryService) {
        this.repositoryServicePool.release(repositoryService);
      }
    }
  }

  static async updateRepositorySettings(
    projectKey: string,
    repositorySlug: string,
    settings: any,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('updateRepositorySettings');
    let repositoryService = null;

    try {
      methodLogger.debug('Updating repository settings:', { projectKey, repositorySlug });
      repositoryService = await this.repositoryServicePool.acquire();

      const result = await repositoryService.updateRepositorySettings(
        projectKey,
        repositorySlug,
        settings
      );

      methodLogger.debug('Successfully updated repository settings');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update repository settings:', error);
      if (repositoryService) {
        this.repositoryServicePool.destroy(repositoryService);
        repositoryService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (repositoryService) {
        this.repositoryServicePool.release(repositoryService);
      }
    }
  }

  static async getRepositoryHooks(
    projectKey: string,
    repositorySlug: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getRepositoryHooks');
    let repositoryService = null;

    try {
      methodLogger.debug('Getting repository hooks:', { projectKey, repositorySlug });
      repositoryService = await this.repositoryServicePool.acquire();

      const result = await repositoryService.getRepositoryHooks(projectKey, repositorySlug);

      methodLogger.debug('Successfully retrieved repository hooks');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get repository hooks:', error);
      if (repositoryService) {
        this.repositoryServicePool.destroy(repositoryService);
        repositoryService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (repositoryService) {
        this.repositoryServicePool.release(repositoryService);
      }
    }
  }

  static async createRepositoryHook(
    projectKey: string,
    repositorySlug: string,
    hook: any,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('createRepositoryHook');
    let repositoryService = null;

    try {
      methodLogger.debug('Creating repository hook:', { projectKey, repositorySlug });
      repositoryService = await this.repositoryServicePool.acquire();

      const result = await repositoryService.createRepositoryHook(projectKey, repositorySlug, hook);

      methodLogger.debug('Successfully created repository hook');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create repository hook:', error);
      if (repositoryService) {
        this.repositoryServicePool.destroy(repositoryService);
        repositoryService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (repositoryService) {
        this.repositoryServicePool.release(repositoryService);
      }
    }
  }

  static async getRepositoryHook(
    projectKey: string,
    repositorySlug: string,
    hookId: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getRepositoryHook');
    let repositoryService = null;

    try {
      methodLogger.debug('Getting repository hook:', { projectKey, repositorySlug, hookId });
      repositoryService = await this.repositoryServicePool.acquire();

      const result = await repositoryService.getRepositoryHook(
        projectKey,
        repositorySlug,
        parseInt(hookId)
      );

      methodLogger.debug('Successfully retrieved repository hook');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get repository hook:', error);
      if (repositoryService) {
        this.repositoryServicePool.destroy(repositoryService);
        repositoryService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (repositoryService) {
        this.repositoryServicePool.release(repositoryService);
      }
    }
  }

  static async updateRepositoryHook(
    projectKey: string,
    repositorySlug: string,
    hookId: string,
    hook: any,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('updateRepositoryHook');
    let repositoryService = null;

    try {
      methodLogger.debug('Updating repository hook:', { projectKey, repositorySlug, hookId });
      repositoryService = await this.repositoryServicePool.acquire();

      const result = await repositoryService.updateRepositoryHook(
        projectKey,
        repositorySlug,
        parseInt(hookId),
        hook
      );

      methodLogger.debug('Successfully updated repository hook');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update repository hook:', error);
      if (repositoryService) {
        this.repositoryServicePool.destroy(repositoryService);
        repositoryService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (repositoryService) {
        this.repositoryServicePool.release(repositoryService);
      }
    }
  }

  static async deleteRepositoryHook(
    projectKey: string,
    repositorySlug: string,
    hookId: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('deleteRepositoryHook');
    let repositoryService = null;

    try {
      methodLogger.debug('Deleting repository hook:', { projectKey, repositorySlug, hookId });
      repositoryService = await this.repositoryServicePool.acquire();

      await repositoryService.deleteRepositoryHook(projectKey, repositorySlug, parseInt(hookId));

      methodLogger.debug('Successfully deleted repository hook');
      return createMcpResponse({ message: 'Repository hook deleted successfully' }, output);
    } catch (error) {
      methodLogger.error('Failed to delete repository hook:', error);
      if (repositoryService) {
        this.repositoryServicePool.destroy(repositoryService);
        repositoryService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (repositoryService) {
        this.repositoryServicePool.release(repositoryService);
      }
    }
  }

  static async getRepositoryForks(
    projectKey: string,
    repositorySlug: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getRepositoryForks');
    let repositoryService = null;

    try {
      methodLogger.debug('Getting repository forks:', { projectKey, repositorySlug });
      repositoryService = await this.repositoryServicePool.acquire();

      const result = await repositoryService.getRepositoryForks(projectKey, repositorySlug);

      methodLogger.debug('Successfully retrieved repository forks');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get repository forks:', error);
      if (repositoryService) {
        this.repositoryServicePool.destroy(repositoryService);
        repositoryService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (repositoryService) {
        this.repositoryServicePool.release(repositoryService);
      }
    }
  }

  static async createRepositoryFork(
    projectKey: string,
    repositorySlug: string,
    fork: any,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('createRepositoryFork');
    let repositoryService = null;

    try {
      methodLogger.debug('Creating repository fork:', { projectKey, repositorySlug });
      repositoryService = await this.repositoryServicePool.acquire();

      const result = await repositoryService.createRepositoryFork(projectKey, repositorySlug, fork);

      methodLogger.debug('Successfully created repository fork');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create repository fork:', error);
      if (repositoryService) {
        this.repositoryServicePool.destroy(repositoryService);
        repositoryService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (repositoryService) {
        this.repositoryServicePool.release(repositoryService);
      }
    }
  }

  /**
   * Register all repository tools with the MCP server
   */
  static register(server: McpServer): void {
    const registerLogger = this.logger.forMethod('register');

    // Initialize the service
    this.initialize();

    // Create Repository
    server.registerTool(
      'repository_create',
      {
        description: `Cria um novo repositório no Bitbucket Data Center.

**Funcionalidades:**
- Criação de repositório completo
- Configuração de visibilidade
- Definição de propriedades

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`name\`: Nome do repositório
- \`description\`: Descrição do repositório (opcional)
- \`forkable\`: Se pode ser forkado (opcional)
- \`isPublic\`: Se é público (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Repositório criado com todas as informações.`,
        inputSchema: CreateRepositorySchema.shape,
      },
      async (params: z.infer<typeof CreateRepositorySchema>) => {
        const validatedParams = CreateRepositorySchema.parse(params);
        return this.createRepository(
          validatedParams.projectKey,
          validatedParams.name,
          validatedParams.description,
          validatedParams.forkable,
          validatedParams.isPublic,
          validatedParams.output
        );
      }
    );

    // Get Repository
    server.registerTool(
      'repository_get',
      {
        description: `Obtém um repositório específico no Bitbucket Data Center.

**Funcionalidades:**
- Informações completas do repositório
- Metadados e configurações
- Status do repositório

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`repositorySlug\`: Slug do repositório
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Informações detalhadas do repositório.`,
        inputSchema: GetRepositorySchema.shape,
      },
      async (params: z.infer<typeof GetRepositorySchema>) => {
        const validatedParams = GetRepositorySchema.parse(params);
        return this.getRepository(
          validatedParams.projectKey,
          validatedParams.repositorySlug,
          validatedParams.output
        );
      }
    );

    // Update Repository
    server.registerTool(
      'repository_update',
      {
        description: `Atualiza um repositório existente no Bitbucket Data Center.

**Funcionalidades:**
- Atualização de informações
- Modificação de configurações
- Alteração de propriedades

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`repositorySlug\`: Slug do repositório
- \`name\`: Novo nome (opcional)
- \`description\`: Nova descrição (opcional)
- \`forkable\`: Nova configuração de fork (opcional)
- \`isPublic\`: Nova visibilidade (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Repositório atualizado com novas informações.`,
        inputSchema: UpdateRepositorySchema.shape,
      },
      async (params: z.infer<typeof UpdateRepositorySchema>) => {
        const validatedParams = UpdateRepositorySchema.parse(params);
        return this.updateRepository(
          validatedParams.projectKey,
          validatedParams.repositorySlug,
          validatedParams.name,
          validatedParams.description,
          validatedParams.forkable,
          validatedParams.isPublic,
          validatedParams.output
        );
      }
    );

    // Delete Repository
    server.registerTool(
      'repository_delete',
      {
        description: `Remove um repositório do Bitbucket Data Center.

**Funcionalidades:**
- Remoção segura do repositório
- Limpeza de dados associados
- Confirmação de exclusão

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`repositorySlug\`: Slug do repositório
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Confirmação de remoção do repositório.`,
        inputSchema: DeleteRepositorySchema.shape,
      },
      async (params: z.infer<typeof DeleteRepositorySchema>) => {
        const validatedParams = DeleteRepositorySchema.parse(params);
        return this.deleteRepository(
          validatedParams.projectKey,
          validatedParams.repositorySlug,
          validatedParams.output
        );
      }
    );

    // List Repositories
    server.registerTool(
      'repository_list',
      {
        description: `Lista todos os repositórios de um projeto no Bitbucket Data Center.

**Funcionalidades:**
- Lista completa de repositórios
- Filtros por nome e permissão
- Paginação de resultados

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`start\`: Índice inicial (opcional)
- \`limit\`: Limite de resultados (opcional)
- \`name\`: Filtro por nome (opcional)
- \`permission\`: Filtro por permissão (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Lista de repositórios com informações básicas.`,
        inputSchema: ListRepositoriesSchema.shape,
      },
      async (params: z.infer<typeof ListRepositoriesSchema>) => {
        const validatedParams = ListRepositoriesSchema.parse(params);
        return this.listRepositories(
          validatedParams.projectKey,
          validatedParams.start,
          validatedParams.limit,
          validatedParams.name,
          validatedParams.permission,
          validatedParams.output
        );
      }
    );

    // Get Repository Permissions
    server.registerTool(
      'repository_get_permissions',
      {
        description: `Obtém permissões de um repositório no Bitbucket Data Center.

**Funcionalidades:**
- Lista de permissões do repositório
- Usuários e grupos com acesso
- Níveis de permissão

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`repositorySlug\`: Slug do repositório
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Lista de permissões do repositório.`,
        inputSchema: GetRepositoryPermissionsSchema.shape,
      },
      async (params: z.infer<typeof GetRepositoryPermissionsSchema>) => {
        const validatedParams = GetRepositoryPermissionsSchema.parse(params);
        return this.getRepositoryPermissions(
          validatedParams.projectKey,
          validatedParams.repositorySlug,
          validatedParams.output
        );
      }
    );

    // Add Repository Permission
    server.registerTool(
      'repository_add_permission',
      {
        description: `Adiciona permissão a um repositório no Bitbucket Data Center.

**Funcionalidades:**
- Adição de permissão de usuário
- Adição de permissão de grupo
- Configuração de nível de acesso

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`repositorySlug\`: Slug do repositório
- \`user\`: Nome do usuário (opcional)
- \`group\`: Nome do grupo (opcional)
- \`permission\`: Nível de permissão (padrão: 'REPO_READ')
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Confirmação de adição de permissão.`,
        inputSchema: AddRepositoryPermissionSchema.shape,
      },
      async (params: z.infer<typeof AddRepositoryPermissionSchema>) => {
        const validatedParams = AddRepositoryPermissionSchema.parse(params);
        return this.addRepositoryPermission(
          validatedParams.projectKey,
          validatedParams.repositorySlug,
          validatedParams.user,
          validatedParams.group,
          validatedParams.permission,
          validatedParams.output
        );
      }
    );

    // Remove Repository Permission
    server.registerTool(
      'repository_remove_permission',
      {
        description: `Remove permissão de um repositório no Bitbucket Data Center.

**Funcionalidades:**
- Remoção de permissão de usuário
- Remoção de permissão de grupo
- Limpeza de acesso

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`repositorySlug\`: Slug do repositório
- \`user\`: Nome do usuário (opcional)
- \`group\`: Nome do grupo (opcional)
- \`permission\`: Nível de permissão (padrão: 'REPO_READ')
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Confirmação de remoção de permissão.`,
        inputSchema: RemoveRepositoryPermissionSchema.shape,
      },
      async (params: z.infer<typeof RemoveRepositoryPermissionSchema>) => {
        const validatedParams = RemoveRepositoryPermissionSchema.parse(params);
        return this.removeRepositoryPermission(
          validatedParams.projectKey,
          validatedParams.repositorySlug,
          validatedParams.user,
          validatedParams.group,
          validatedParams.permission,
          validatedParams.output
        );
      }
    );

    // Get Repository Branches
    server.registerTool(
      'repository_get_branches',
      {
        description: `Obtém branches de um repositório no Bitbucket Data Center.

**Funcionalidades:**
- Lista de branches do repositório
- Informações de cada branch
- Status e commits

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`repositorySlug\`: Slug do repositório
- \`start\`: Índice inicial (opcional)
- \`limit\`: Limite de resultados (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Lista de branches do repositório.`,
        inputSchema: GetRepositoryBranchesSchema.shape,
      },
      async (params: z.infer<typeof GetRepositoryBranchesSchema>) => {
        const validatedParams = GetRepositoryBranchesSchema.parse(params);
        return this.getRepositoryBranches(
          validatedParams.projectKey,
          validatedParams.repositorySlug,
          validatedParams.start,
          validatedParams.limit,
          validatedParams.output
        );
      }
    );

    // Create Repository Branch
    server.registerTool(
      'repository_create_branch',
      {
        description: `Cria uma nova branch em um repositório no Bitbucket Data Center.

**Funcionalidades:**
- Criação de nova branch
- Definição de ponto de partida
- Mensagem de commit

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`repositorySlug\`: Slug do repositório
- \`name\`: Nome da branch
- \`startPoint\`: Ponto de partida (commit ou branch)
- \`message\`: Mensagem de commit (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Branch criada com informações.`,
        inputSchema: CreateRepositoryBranchSchema.shape,
      },
      async (params: z.infer<typeof CreateRepositoryBranchSchema>) => {
        const validatedParams = CreateRepositoryBranchSchema.parse(params);
        return this.createRepositoryBranch(
          validatedParams.projectKey,
          validatedParams.repositorySlug,
          validatedParams.name,
          validatedParams.startPoint,
          validatedParams.message,
          validatedParams.output
        );
      }
    );

    // Get Repository Tags
    server.registerTool(
      'repository_get_tags',
      {
        description: `Obtém tags de um repositório no Bitbucket Data Center.

**Funcionalidades:**
- Lista de tags do repositório
- Informações de cada tag
- Commits associados

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`repositorySlug\`: Slug do repositório
- \`start\`: Índice inicial (opcional)
- \`limit\`: Limite de resultados (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Lista de tags do repositório.`,
        inputSchema: GetRepositoryTagsSchema.shape,
      },
      async (params: z.infer<typeof GetRepositoryTagsSchema>) => {
        const validatedParams = GetRepositoryTagsSchema.parse(params);
        return this.getRepositoryTags(
          validatedParams.projectKey,
          validatedParams.repositorySlug,
          validatedParams.start,
          validatedParams.limit,
          validatedParams.output
        );
      }
    );

    // Create Repository Tag
    server.registerTool(
      'repository_create_tag',
      {
        description: `Cria uma nova tag em um repositório no Bitbucket Data Center.

**Funcionalidades:**
- Criação de nova tag
- Definição de ponto de partida
- Mensagem de tag

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`repositorySlug\`: Slug do repositório
- \`name\`: Nome da tag
- \`startPoint\`: Ponto de partida (commit ou branch)
- \`message\`: Mensagem da tag (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Tag criada com informações.`,
        inputSchema: CreateRepositoryTagSchema.shape,
      },
      async (params: z.infer<typeof CreateRepositoryTagSchema>) => {
        const validatedParams = CreateRepositoryTagSchema.parse(params);
        return this.createRepositoryTag(
          validatedParams.projectKey,
          validatedParams.repositorySlug,
          validatedParams.name,
          validatedParams.startPoint,
          validatedParams.message,
          validatedParams.output
        );
      }
    );

    // Get Repository Settings
    server.registerTool(
      'repository_get_settings',
      {
        description: `Obtém configurações de um repositório no Bitbucket Data Center.

**Funcionalidades:**
- Configurações do repositório
- Parâmetros específicos
- Valores atuais

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`repositorySlug\`: Slug do repositório
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Configurações do repositório.`,
        inputSchema: GetRepositorySettingsSchema.shape,
      },
      async (params: z.infer<typeof GetRepositorySettingsSchema>) => {
        const validatedParams = GetRepositorySettingsSchema.parse(params);
        return this.getRepositorySettings(
          validatedParams.projectKey,
          validatedParams.repositorySlug,
          validatedParams.output
        );
      }
    );

    // Update Repository Settings
    server.registerTool(
      'repository_update_settings',
      {
        description: `Atualiza configurações de um repositório no Bitbucket Data Center.

**Funcionalidades:**
- Modificação de configurações
- Aplicação de mudanças
- Validação de parâmetros

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`repositorySlug\`: Slug do repositório
- \`settings\`: Objeto com as configurações
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Configurações atualizadas do repositório.`,
        inputSchema: UpdateRepositorySettingsSchema.shape,
      },
      async (params: z.infer<typeof UpdateRepositorySettingsSchema>) => {
        const validatedParams = UpdateRepositorySettingsSchema.parse(params);
        return this.updateRepositorySettings(
          validatedParams.projectKey,
          validatedParams.repositorySlug,
          validatedParams.settings,
          validatedParams.output
        );
      }
    );

    // Get Repository Hooks
    server.registerTool(
      'repository_get_hooks',
      {
        description: `Obtém hooks de um repositório no Bitbucket Data Center.

**Funcionalidades:**
- Lista de hooks do repositório
- Configurações de cada hook
- Status dos hooks

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`repositorySlug\`: Slug do repositório
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Lista de hooks do repositório.`,
        inputSchema: GetRepositoryHooksSchema.shape,
      },
      async (params: z.infer<typeof GetRepositoryHooksSchema>) => {
        const validatedParams = GetRepositoryHooksSchema.parse(params);
        return this.getRepositoryHooks(
          validatedParams.projectKey,
          validatedParams.repositorySlug,
          validatedParams.output
        );
      }
    );

    // Create Repository Hook
    server.registerTool(
      'repository_create_hook',
      {
        description: `Cria um novo hook em um repositório no Bitbucket Data Center.

**Funcionalidades:**
- Criação de novo hook
- Configuração de eventos
- Definição de URL de callback

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`repositorySlug\`: Slug do repositório
- \`hook\`: Objeto com as configurações do hook
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Hook criado com informações.`,
        inputSchema: CreateRepositoryHookSchema.shape,
      },
      async (params: z.infer<typeof CreateRepositoryHookSchema>) => {
        const validatedParams = CreateRepositoryHookSchema.parse(params);
        return this.createRepositoryHook(
          validatedParams.projectKey,
          validatedParams.repositorySlug,
          validatedParams.hook,
          validatedParams.output
        );
      }
    );

    // Get Repository Hook
    server.registerTool(
      'repository_get_hook',
      {
        description: `Obtém um hook específico de um repositório no Bitbucket Data Center.

**Funcionalidades:**
- Detalhes do hook
- Configurações específicas
- Status atual

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`repositorySlug\`: Slug do repositório
- \`hookId\`: ID do hook
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Detalhes do hook.`,
        inputSchema: GetRepositoryHookSchema.shape,
      },
      async (params: z.infer<typeof GetRepositoryHookSchema>) => {
        const validatedParams = GetRepositoryHookSchema.parse(params);
        return this.getRepositoryHook(
          validatedParams.projectKey,
          validatedParams.repositorySlug,
          validatedParams.hookId,
          validatedParams.output
        );
      }
    );

    // Update Repository Hook
    server.registerTool(
      'repository_update_hook',
      {
        description: `Atualiza um hook de um repositório no Bitbucket Data Center.

**Funcionalidades:**
- Modificação de configurações do hook
- Aplicação de mudanças
- Validação de parâmetros

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`repositorySlug\`: Slug do repositório
- \`hookId\`: ID do hook
- \`hook\`: Objeto com as configurações atualizadas
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Hook atualizado com informações.`,
        inputSchema: UpdateRepositoryHookSchema.shape,
      },
      async (params: z.infer<typeof UpdateRepositoryHookSchema>) => {
        const validatedParams = UpdateRepositoryHookSchema.parse(params);
        return this.updateRepositoryHook(
          validatedParams.projectKey,
          validatedParams.repositorySlug,
          validatedParams.hookId,
          validatedParams.hook,
          validatedParams.output
        );
      }
    );

    // Delete Repository Hook
    server.registerTool(
      'repository_delete_hook',
      {
        description: `Remove um hook de um repositório no Bitbucket Data Center.

**Funcionalidades:**
- Remoção de hook
- Limpeza de configurações
- Confirmação de exclusão

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`repositorySlug\`: Slug do repositório
- \`hookId\`: ID do hook
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Confirmação da remoção do hook.`,
        inputSchema: DeleteRepositoryHookSchema.shape,
      },
      async (params: z.infer<typeof DeleteRepositoryHookSchema>) => {
        const validatedParams = DeleteRepositoryHookSchema.parse(params);
        return this.deleteRepositoryHook(
          validatedParams.projectKey,
          validatedParams.repositorySlug,
          validatedParams.hookId,
          validatedParams.output
        );
      }
    );

    // Get Repository Forks
    server.registerTool(
      'repository_get_forks',
      {
        description: `Obtém forks de um repositório no Bitbucket Data Center.

**Funcionalidades:**
- Lista de forks do repositório
- Informações de cada fork
- Relacionamentos

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`repositorySlug\`: Slug do repositório
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Lista de forks do repositório.`,
        inputSchema: GetRepositoryForksSchema.shape,
      },
      async (params: z.infer<typeof GetRepositoryForksSchema>) => {
        const validatedParams = GetRepositoryForksSchema.parse(params);
        return this.getRepositoryForks(
          validatedParams.projectKey,
          validatedParams.repositorySlug,
          validatedParams.output
        );
      }
    );

    // Create Repository Fork
    server.registerTool(
      'repository_create_fork',
      {
        description: `Cria um fork de um repositório no Bitbucket Data Center.

**Funcionalidades:**
- Criação de fork
- Definição de projeto de destino
- Configuração de visibilidade

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`repositorySlug\`: Slug do repositório
- \`fork\`: Objeto com as configurações do fork
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Fork criado com informações.`,
        inputSchema: CreateRepositoryForkSchema.shape,
      },
      async (params: z.infer<typeof CreateRepositoryForkSchema>) => {
        const validatedParams = CreateRepositoryForkSchema.parse(params);
        return this.createRepositoryFork(
          validatedParams.projectKey,
          validatedParams.repositorySlug,
          validatedParams.fork,
          validatedParams.output
        );
      }
    );

    registerLogger.info('Successfully registered all data center repository tools');
  }
}
