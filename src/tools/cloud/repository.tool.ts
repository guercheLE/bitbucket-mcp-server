/**
 * Cloud Repository Tools
 * Ferramentas para gerenciamento de repositórios no Bitbucket Cloud
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPool, Pool } from 'generic-pool';
import { RepositoryService } from '../../services/cloud/repository.service.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';
import { createMcpResponse, createErrorResponse } from '../../services/types/base.types.js';
import { z } from 'zod';

// Zod schemas for parameter validation
const GetRepositorySchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListRepositoriesSchema = z.object({
  role: z.string().optional(),
  q: z.string().optional(),
  sort: z.string().optional(),
  page: z.number().optional(),
  pagelen: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListWorkspaceRepositoriesSchema = z.object({
  workspace: z.string(),
  role: z.string().optional(),
  q: z.string().optional(),
  sort: z.string().optional(),
  page: z.number().optional(),
  pagelen: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateRepositorySchema = z.object({
  workspace: z.string(),
  name: z.string(),
  description: z.string().optional(),
  scm: z.string().optional(),
  website: z.string().optional(),
  isPrivate: z.boolean().optional(),
  forkPolicy: z.string().optional(),
  hasIssues: z.boolean().optional(),
  hasWiki: z.boolean().optional(),
  project: z.object({}).optional(),
  language: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateRepositorySchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  website: z.string().optional(),
  isPrivate: z.boolean().optional(),
  forkPolicy: z.string().optional(),
  language: z.string().optional(),
  hasIssues: z.boolean().optional(),
  hasWiki: z.boolean().optional(),
  project: z.object({}).optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteRepositorySchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ForkRepositorySchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  isPrivate: z.boolean().optional(),
  forkPolicy: z.string().optional(),
  hasIssues: z.boolean().optional(),
  hasWiki: z.boolean().optional(),
  project: z.object({}).optional(),
  language: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListForksSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  role: z.string().optional(),
  q: z.string().optional(),
  sort: z.string().optional(),
  page: z.number().optional(),
  pagelen: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListBranchesSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  q: z.string().optional(),
  sort: z.string().optional(),
  page: z.number().optional(),
  pagelen: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetBranchSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  name: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateBranchSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  name: z.string(),
  target: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteBranchSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  name: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListTagsSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  q: z.string().optional(),
  sort: z.string().optional(),
  page: z.number().optional(),
  pagelen: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListCommitsSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  include: z.string().optional(),
  exclude: z.string().optional(),
  q: z.string().optional(),
  sort: z.string().optional(),
  page: z.number().optional(),
  pagelen: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetCommitSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  commit: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetTagSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  name: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateTagSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  name: z.string(),
  target: z.string(),
  message: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteTagSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  name: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListWebhooksSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  page: z.number().optional(),
  pagelen: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetWebhookSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  webhookUuid: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateWebhookSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  description: z.string(),
  url: z.string(),
  active: z.boolean().optional(),
  events: z.array(z.string()),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateWebhookSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  webhookUuid: z.string(),
  description: z.string().optional(),
  url: z.string().optional(),
  active: z.boolean().optional(),
  events: z.array(z.string()).optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteWebhookSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  webhookUuid: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListVariablesSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  page: z.number().optional(),
  pagelen: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetVariableSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  variableUuid: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateVariableSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  key: z.string(),
  value: z.string(),
  secured: z.boolean().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateVariableSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  variableUuid: z.string(),
  key: z.string().optional(),
  value: z.string().optional(),
  secured: z.boolean().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteVariableSchema = z.object({
  workspace: z.string(),
  repoSlug: z.string(),
  variableUuid: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

/**
 * Repository Tools for Bitbucket Cloud
 *
 * Comprehensive repository management including:
 * - Get repository information
 * - List repositories
 * - Create, update, delete repositories
 * - Fork repositories
 * - Manage branches and tags
 * - Manage webhooks and variables
 */
export class CloudRepositoryTools {
  private static logger = Logger.forContext('CloudRepositoryTools');
  private static repositoryServicePool: Pool<RepositoryService>;

  static initialize(): void {
    const repositoryServiceFactory = {
      create: async () =>
        new RepositoryService(new ApiClient(), Logger.forContext('RepositoryService')),
      destroy: async () => {},
    };

    this.repositoryServicePool = createPool(repositoryServiceFactory, { min: 2, max: 10 });
    this.logger.info('Cloud Repository tools initialized');
  }

  /**
   * Get Repository
   */
  static async getRepository(
    workspace: string,
    repoSlug: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getRepository');
    let repositoryService = null;

    try {
      methodLogger.debug('Getting repository:', { workspace, repoSlug });
      repositoryService = await this.repositoryServicePool.acquire();

      const result = await repositoryService.getRepository(workspace, repoSlug);

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
   * List Repositories
   */
  static async listRepositories(
    role?: string,
    q?: string,
    sort?: string,
    page?: number,
    pagelen?: number,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('listRepositories');
    let repositoryService = null;

    try {
      methodLogger.debug('Listing repositories:', { role, q, sort, page, pagelen });
      repositoryService = await this.repositoryServicePool.acquire();

      const result = await repositoryService.listRepositories({
        role: role as any,
        q,
        sort: sort as any,
        page,
        pagelen,
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
   * List Workspace Repositories
   */
  static async listWorkspaceRepositories(
    workspace: string,
    role?: string,
    q?: string,
    sort?: string,
    page?: number,
    pagelen?: number,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('listWorkspaceRepositories');
    let repositoryService = null;

    try {
      methodLogger.debug('Listing workspace repositories:', {
        workspace,
        role,
        q,
        sort,
        page,
        pagelen,
      });
      repositoryService = await this.repositoryServicePool.acquire();

      const result = await repositoryService.listWorkspaceRepositories(workspace, {
        role: role as any,
        q,
        sort: sort as any,
        page,
        pagelen,
      });

      methodLogger.debug('Successfully listed workspace repositories');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list workspace repositories:', error);
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
   * Create Repository
   */
  static async createRepository(
    workspace: string,
    name: string,
    description?: string,
    scm?: string,
    website?: string,
    isPrivate?: boolean,
    forkPolicy?: string,
    hasIssues?: boolean,
    hasWiki?: boolean,
    project?: any,
    language?: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('createRepository');
    let repositoryService = null;

    try {
      methodLogger.debug('Creating repository:', { workspace, name });
      repositoryService = await this.repositoryServicePool.acquire();

      const result = await repositoryService.createRepository(workspace, {
        name,
        description,
        scm: scm as any,
        website,
        is_private: isPrivate,
        fork_policy: forkPolicy as any,
        has_issues: hasIssues,
        has_wiki: hasWiki,
        project,
      });

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
   * Update Repository
   */
  static async updateRepository(
    workspace: string,
    repoSlug: string,
    name?: string,
    description?: string,
    website?: string,
    isPrivate?: boolean,
    forkPolicy?: string,
    hasIssues?: boolean,
    hasWiki?: boolean,
    project?: any,
    language?: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('updateRepository');
    let repositoryService = null;

    try {
      methodLogger.debug('Updating repository:', { workspace, repoSlug });
      repositoryService = await this.repositoryServicePool.acquire();

      const result = await repositoryService.updateRepository(workspace, repoSlug, {
        name,
        description,
        website,
        is_private: isPrivate,
        fork_policy: forkPolicy as any,
        has_issues: hasIssues,
        has_wiki: hasWiki,
        project,
      });

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
   * Delete Repository
   */
  static async deleteRepository(
    workspace: string,
    repoSlug: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('deleteRepository');
    let repositoryService = null;

    try {
      methodLogger.debug('Deleting repository:', { workspace, repoSlug });
      repositoryService = await this.repositoryServicePool.acquire();

      await repositoryService.deleteRepository(workspace, repoSlug);

      methodLogger.debug('Successfully deleted repository');
      return createMcpResponse({ success: true }, output);
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
   * Fork Repository
   */
  static async forkRepository(
    workspace: string,
    repoSlug: string,
    name?: string,
    description?: string,
    isPrivate?: boolean,
    forkPolicy?: string,
    hasIssues?: boolean,
    hasWiki?: boolean,
    project?: any,
    language?: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('forkRepository');
    let repositoryService = null;

    try {
      methodLogger.debug('Forking repository:', { workspace, repoSlug });
      repositoryService = await this.repositoryServicePool.acquire();

      const result = await repositoryService.forkRepository(workspace, repoSlug, {
        name,
        description,
        is_private: isPrivate,
        fork_policy: forkPolicy as any,
        has_issues: hasIssues,
        has_wiki: hasWiki,
        project,
      });

      methodLogger.debug('Successfully forked repository');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to fork repository:', error);
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
   * List Repository Forks
   */
  static async listRepositoryForks(
    workspace: string,
    repoSlug: string,
    role?: string,
    q?: string,
    sort?: string,
    page?: number,
    pagelen?: number,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('listRepositoryForks');
    let repositoryService = null;

    try {
      methodLogger.debug('Listing repository forks:', {
        workspace,
        repoSlug,
        role,
        q,
        sort,
        page,
        pagelen,
      });
      repositoryService = await this.repositoryServicePool.acquire();

      const result = await repositoryService.listRepositoryForks(workspace, repoSlug, {
        role: role as any,
        q,
        sort: sort as any,
        page,
        pagelen,
      });

      methodLogger.debug('Successfully listed repository forks');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list repository forks:', error);
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
   * List Repository Branches
   */
  static async listRepositoryBranches(
    workspace: string,
    repoSlug: string,
    q?: string,
    sort?: string,
    page?: number,
    pagelen?: number,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('listRepositoryBranches');
    let repositoryService = null;

    try {
      methodLogger.debug('Listing repository branches:', {
        workspace,
        repoSlug,
        q,
        sort,
        page,
        pagelen,
      });
      repositoryService = await this.repositoryServicePool.acquire();

      const result = await repositoryService.listRepositoryBranches(workspace, repoSlug, {
        q,
        sort: sort as any,
        page,
        pagelen,
      });

      methodLogger.debug('Successfully listed repository branches');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list repository branches:', error);
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
   * Get Repository Branch
   */
  static async getRepositoryBranch(
    workspace: string,
    repoSlug: string,
    branchName: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getRepositoryBranch');
    let repositoryService = null;

    try {
      methodLogger.debug('Getting repository branch:', { workspace, repoSlug, branchName });
      repositoryService = await this.repositoryServicePool.acquire();

      const result = await repositoryService.getRepositoryBranch(workspace, repoSlug, branchName);

      methodLogger.debug('Successfully retrieved repository branch');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get repository branch:', error);
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
   * Create Repository Branch
   */
  static async createRepositoryBranch(
    workspace: string,
    repoSlug: string,
    name: string,
    targetHash: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('createRepositoryBranch');
    let repositoryService = null;

    try {
      methodLogger.debug('Creating repository branch:', { workspace, repoSlug, name, targetHash });
      repositoryService = await this.repositoryServicePool.acquire();

      const result = await repositoryService.createRepositoryBranch(workspace, repoSlug, {
        name,
        target: { hash: targetHash },
      });

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
   * Delete Repository Branch
   */
  static async deleteRepositoryBranch(
    workspace: string,
    repoSlug: string,
    branchName: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('deleteRepositoryBranch');
    let repositoryService = null;

    try {
      methodLogger.debug('Deleting repository branch:', { workspace, repoSlug, branchName });
      repositoryService = await this.repositoryServicePool.acquire();

      await repositoryService.deleteRepositoryBranch(workspace, repoSlug, branchName);

      methodLogger.debug('Successfully deleted repository branch');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to delete repository branch:', error);
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
   * List Repository Tags
   */
  static async listRepositoryTags(
    workspace: string,
    repoSlug: string,
    q?: string,
    sort?: string,
    page?: number,
    pagelen?: number,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('listRepositoryTags');
    let repositoryService = null;

    try {
      methodLogger.debug('Listing repository tags:', {
        workspace,
        repoSlug,
        q,
        sort,
        page,
        pagelen,
      });
      repositoryService = await this.repositoryServicePool.acquire();

      const result = await repositoryService.listRepositoryTags(workspace, repoSlug, {
        q,
        sort: sort as any,
        page,
        pagelen,
      });

      methodLogger.debug('Successfully listed repository tags');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list repository tags:', error);
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
   * Get Repository Tag
   */
  static async getRepositoryTag(
    workspace: string,
    repoSlug: string,
    tagName: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getRepositoryTag');
    let repositoryService = null;

    try {
      methodLogger.debug('Getting repository tag:', { workspace, repoSlug, tagName });
      repositoryService = await this.repositoryServicePool.acquire();

      const result = await repositoryService.getRepositoryTag(workspace, repoSlug, tagName);

      methodLogger.debug('Successfully retrieved repository tag');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get repository tag:', error);
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
   * Create Repository Tag
   */
  static async createRepositoryTag(
    workspace: string,
    repoSlug: string,
    name: string,
    targetHash: string,
    message?: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('createRepositoryTag');
    let repositoryService = null;

    try {
      methodLogger.debug('Creating repository tag:', {
        workspace,
        repoSlug,
        name,
        targetHash,
        message,
      });
      repositoryService = await this.repositoryServicePool.acquire();

      const result = await repositoryService.createRepositoryTag(workspace, repoSlug, {
        name,
        target: { hash: targetHash },
        message,
      });

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

  /**
   * Delete Repository Tag
   */
  static async deleteRepositoryTag(
    workspace: string,
    repoSlug: string,
    tagName: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('deleteRepositoryTag');
    let repositoryService = null;

    try {
      methodLogger.debug('Deleting repository tag:', { workspace, repoSlug, tagName });
      repositoryService = await this.repositoryServicePool.acquire();

      await repositoryService.deleteRepositoryTag(workspace, repoSlug, tagName);

      methodLogger.debug('Successfully deleted repository tag');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to delete repository tag:', error);
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
   * List Repository Commits
   */
  static async listRepositoryCommits(
    workspace: string,
    repoSlug: string,
    include?: string,
    exclude?: string,
    q?: string,
    sort?: string,
    page?: number,
    pagelen?: number,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('listRepositoryCommits');
    let repositoryService = null;

    try {
      methodLogger.debug('Listing repository commits:', {
        workspace,
        repoSlug,
        include,
        exclude,
        q,
        sort,
        page,
        pagelen,
      });
      repositoryService = await this.repositoryServicePool.acquire();

      const result = await repositoryService.listRepositoryCommits(workspace, repoSlug, {
        include,
        exclude,
        q,
        sort: sort as any,
        page,
        pagelen,
      });

      methodLogger.debug('Successfully listed repository commits');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list repository commits:', error);
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
   * Get Repository Commit
   */
  static async getRepositoryCommit(
    workspace: string,
    repoSlug: string,
    commit: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getRepositoryCommit');
    let repositoryService = null;

    try {
      methodLogger.debug('Getting repository commit:', { workspace, repoSlug, commit });
      repositoryService = await this.repositoryServicePool.acquire();

      const result = await repositoryService.getRepositoryCommit(workspace, repoSlug, commit);

      methodLogger.debug('Successfully retrieved repository commit');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get repository commit:', error);
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
   * List Repository Webhooks
   */
  static async listRepositoryWebhooks(
    workspace: string,
    repoSlug: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('listRepositoryWebhooks');
    let repositoryService = null;

    try {
      methodLogger.debug('Listing repository webhooks:', { workspace, repoSlug });
      repositoryService = await this.repositoryServicePool.acquire();

      const result = await repositoryService.listRepositoryWebhooks(workspace, repoSlug);

      methodLogger.debug('Successfully listed repository webhooks');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list repository webhooks:', error);
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
   * Get Repository Webhook
   */
  static async getRepositoryWebhook(
    workspace: string,
    repoSlug: string,
    hookUid: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getRepositoryWebhook');
    let repositoryService = null;

    try {
      methodLogger.debug('Getting repository webhook:', { workspace, repoSlug, hookUid });
      repositoryService = await this.repositoryServicePool.acquire();

      const result = await repositoryService.getRepositoryWebhook(workspace, repoSlug, hookUid);

      methodLogger.debug('Successfully retrieved repository webhook');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get repository webhook:', error);
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
   * Create Repository Webhook
   */
  static async createRepositoryWebhook(
    workspace: string,
    repoSlug: string,
    url: string,
    description: string,
    events: string[],
    active?: boolean,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('createRepositoryWebhook');
    let repositoryService = null;

    try {
      methodLogger.debug('Creating repository webhook:', {
        workspace,
        repoSlug,
        url,
        description,
        events,
        active,
      });
      repositoryService = await this.repositoryServicePool.acquire();

      const result = await repositoryService.createRepositoryWebhook(workspace, repoSlug, {
        url,
        description,
        events,
        active,
      });

      methodLogger.debug('Successfully created repository webhook');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create repository webhook:', error);
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
   * Update Repository Webhook
   */
  static async updateRepositoryWebhook(
    workspace: string,
    repoSlug: string,
    hookUid: string,
    url?: string,
    description?: string,
    events?: string[],
    active?: boolean,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('updateRepositoryWebhook');
    let repositoryService = null;

    try {
      methodLogger.debug('Updating repository webhook:', {
        workspace,
        repoSlug,
        hookUid,
        url,
        description,
        events,
        active,
      });
      repositoryService = await this.repositoryServicePool.acquire();

      const result = await repositoryService.updateRepositoryWebhook(workspace, repoSlug, hookUid, {
        url,
        description,
        events,
        active,
      });

      methodLogger.debug('Successfully updated repository webhook');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update repository webhook:', error);
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
   * Delete Repository Webhook
   */
  static async deleteRepositoryWebhook(
    workspace: string,
    repoSlug: string,
    hookUid: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('deleteRepositoryWebhook');
    let repositoryService = null;

    try {
      methodLogger.debug('Deleting repository webhook:', { workspace, repoSlug, hookUid });
      repositoryService = await this.repositoryServicePool.acquire();

      await repositoryService.deleteRepositoryWebhook(workspace, repoSlug, hookUid);

      methodLogger.debug('Successfully deleted repository webhook');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to delete repository webhook:', error);
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
   * List Repository Variables
   */
  static async listRepositoryVariables(
    workspace: string,
    repoSlug: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('listRepositoryVariables');
    let repositoryService = null;

    try {
      methodLogger.debug('Listing repository variables:', { workspace, repoSlug });
      repositoryService = await this.repositoryServicePool.acquire();

      const result = await repositoryService.listRepositoryVariables(workspace, repoSlug);

      methodLogger.debug('Successfully listed repository variables');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list repository variables:', error);
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
   * Get Repository Variable
   */
  static async getRepositoryVariable(
    workspace: string,
    repoSlug: string,
    variableUuid: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getRepositoryVariable');
    let repositoryService = null;

    try {
      methodLogger.debug('Getting repository variable:', { workspace, repoSlug, variableUuid });
      repositoryService = await this.repositoryServicePool.acquire();

      const result = await repositoryService.getRepositoryVariable(
        workspace,
        repoSlug,
        variableUuid
      );

      methodLogger.debug('Successfully retrieved repository variable');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get repository variable:', error);
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
   * Create Repository Variable
   */
  static async createRepositoryVariable(
    workspace: string,
    repoSlug: string,
    key: string,
    value: string,
    secured?: boolean,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('createRepositoryVariable');
    let repositoryService = null;

    try {
      methodLogger.debug('Creating repository variable:', { workspace, repoSlug, key, secured });
      repositoryService = await this.repositoryServicePool.acquire();

      const result = await repositoryService.createRepositoryVariable(workspace, repoSlug, {
        key,
        value,
        secured,
      });

      methodLogger.debug('Successfully created repository variable');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create repository variable:', error);
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
   * Update Repository Variable
   */
  static async updateRepositoryVariable(
    workspace: string,
    repoSlug: string,
    variableUuid: string,
    key?: string,
    value?: string,
    secured?: boolean,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('updateRepositoryVariable');
    let repositoryService = null;

    try {
      methodLogger.debug('Updating repository variable:', {
        workspace,
        repoSlug,
        variableUuid,
        key,
        secured,
      });
      repositoryService = await this.repositoryServicePool.acquire();

      const result = await repositoryService.updateRepositoryVariable(
        workspace,
        repoSlug,
        variableUuid,
        {
          key,
          value,
          secured,
        }
      );

      methodLogger.debug('Successfully updated repository variable');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update repository variable:', error);
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
   * Delete Repository Variable
   */
  static async deleteRepositoryVariable(
    workspace: string,
    repoSlug: string,
    variableUuid: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('deleteRepositoryVariable');
    let repositoryService = null;

    try {
      methodLogger.debug('Deleting repository variable:', { workspace, repoSlug, variableUuid });
      repositoryService = await this.repositoryServicePool.acquire();

      await repositoryService.deleteRepositoryVariable(workspace, repoSlug, variableUuid);

      methodLogger.debug('Successfully deleted repository variable');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to delete repository variable:', error);
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

    // Register get repository tool
    server.registerTool(
      'repository_get',
      {
        description: `Obtém informações de um repositório específico no Bitbucket Cloud.

**Funcionalidades:**
- Informações completas do repositório
- Detalhes do workspace e proprietário
- Configurações de privacidade e funcionalidades
- Links e metadados do repositório

**Parâmetros:**
- \`workspace\`: Workspace contendo o repositório
- \`repoSlug\`: Slug/nome do repositório
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Informações detalhadas do repositório incluindo configurações, links e metadados.`,
        inputSchema: GetRepositorySchema.shape,
      },
      async (params: z.infer<typeof GetRepositorySchema>) => {
        const validatedParams = GetRepositorySchema.parse(params);
        return this.getRepository(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.output
        );
      }
    );

    // Register list repositories tool
    server.registerTool(
      'repository_list',
      {
        description: `Lista repositórios no Bitbucket Cloud.

**Funcionalidades:**
- Lista todos os repositórios acessíveis
- Filtros por papel do usuário
- Busca por nome ou descrição
- Ordenação e paginação

**Parâmetros:**
- \`role\`: Filtro por papel (owner, admin, contributor, member) (opcional)
- \`q\`: Query de busca (opcional)
- \`sort\`: Campo para ordenação (created_on, updated_on, size, name) (opcional)
- \`page\`: Número da página para paginação (opcional)
- \`pagelen\`: Número de itens por página (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Lista paginada de repositórios com informações básicas.`,
        inputSchema: ListRepositoriesSchema.shape,
      },
      async (params: z.infer<typeof ListRepositoriesSchema>) => {
        const validatedParams = ListRepositoriesSchema.parse(params);
        return this.listRepositories(
          validatedParams.role,
          validatedParams.q,
          validatedParams.sort,
          validatedParams.page,
          validatedParams.pagelen,
          validatedParams.output
        );
      }
    );

    // Register list workspace repositories tool
    server.registerTool(
      'repository_list_workspace',
      {
        description: `Lista repositórios de um workspace específico no Bitbucket Cloud.

**Funcionalidades:**
- Lista repositórios de um workspace específico
- Filtros por papel do usuário
- Busca por nome ou descrição
- Ordenação e paginação

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`role\`: Filtro por papel (owner, admin, contributor, member) (opcional)
- \`q\`: Query de busca (opcional)
- \`sort\`: Campo para ordenação (created_on, updated_on, size, name) (opcional)
- \`page\`: Número da página para paginação (opcional)
- \`pagelen\`: Número de itens por página (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Lista paginada de repositórios do workspace especificado.`,
        inputSchema: ListWorkspaceRepositoriesSchema.shape,
      },
      async (params: z.infer<typeof ListWorkspaceRepositoriesSchema>) => {
        const validatedParams = ListWorkspaceRepositoriesSchema.parse(params);
        return this.listWorkspaceRepositories(
          validatedParams.workspace,
          validatedParams.role,
          validatedParams.q,
          validatedParams.sort,
          validatedParams.page,
          validatedParams.pagelen,
          validatedParams.output
        );
      }
    );

    // Register create repository tool
    server.registerTool(
      'repository_create',
      {
        description: `Cria um novo repositório no Bitbucket Cloud.

**Funcionalidades:**
- Criação de repositório com configurações personalizadas
- Configuração de privacidade e funcionalidades
- Associação com projetos
- Configuração de políticas de fork

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`name\`: Nome do repositório
- \`description\`: Descrição do repositório (opcional)
- \`scm\`: Sistema de controle de versão (git) (opcional)
- \`website\`: Website do repositório (opcional)
- \`isPrivate\`: Se o repositório é privado (opcional)
- \`forkPolicy\`: Política de fork (allow_forks, no_public_forks, no_forks) (opcional)
- \`hasIssues\`: Se o repositório tem issues habilitadas (opcional)
- \`hasWiki\`: Se o repositório tem wiki habilitada (opcional)
- \`project\`: Projeto associado ao repositório (opcional)
- \`language\`: Linguagem principal do repositório (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Informações do repositório criado incluindo configurações e links.`,
        inputSchema: CreateRepositorySchema.shape,
      },
      async (params: z.infer<typeof CreateRepositorySchema>) => {
        const validatedParams = CreateRepositorySchema.parse(params);
        return this.createRepository(
          validatedParams.workspace,
          validatedParams.name,
          validatedParams.description,
          validatedParams.scm,
          undefined, // website
          validatedParams.isPrivate,
          validatedParams.forkPolicy,
          validatedParams.hasIssues,
          validatedParams.hasWiki,
          undefined, // project
          validatedParams.language,
          validatedParams.output
        );
      }
    );

    // Register update repository tool
    server.registerTool(
      'repository_update',
      {
        description: `Atualiza um repositório existente no Bitbucket Cloud.

**Funcionalidades:**
- Atualização de configurações do repositório
- Modificação de privacidade e funcionalidades
- Alteração de associação com projetos
- Atualização de políticas de fork

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`repoSlug\`: Slug do repositório
- \`name\`: Nome do repositório (opcional)
- \`description\`: Descrição do repositório (opcional)
- \`website\`: Website do repositório (opcional)
- \`isPrivate\`: Se o repositório é privado (opcional)
- \`forkPolicy\`: Política de fork (allow_forks, no_public_forks, no_forks) (opcional)
- \`hasIssues\`: Se o repositório tem issues habilitadas (opcional)
- \`hasWiki\`: Se o repositório tem wiki habilitada (opcional)
- \`project\`: Projeto associado ao repositório (opcional)
- \`language\`: Linguagem principal do repositório (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Informações atualizadas do repositório.`,
        inputSchema: UpdateRepositorySchema.shape,
      },
      async (params: z.infer<typeof UpdateRepositorySchema>) => {
        const validatedParams = UpdateRepositorySchema.parse(params);
        return this.updateRepository(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.name,
          validatedParams.description,
          undefined, // website not in schema
          validatedParams.isPrivate,
          validatedParams.forkPolicy,
          validatedParams.hasIssues,
          validatedParams.hasWiki,
          undefined, // project not in schema
          validatedParams.language,
          validatedParams.output
        );
      }
    );

    // Register delete repository tool
    server.registerTool(
      'repository_delete',
      {
        description: `Exclui um repositório no Bitbucket Cloud.

**Funcionalidades:**
- Exclusão permanente do repositório
- Remoção de todos os dados associados
- Operação irreversível

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`repoSlug\`: Slug do repositório
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Confirmação da exclusão do repositório.`,
        inputSchema: DeleteRepositorySchema.shape,
      },
      async (params: z.infer<typeof DeleteRepositorySchema>) => {
        const validatedParams = DeleteRepositorySchema.parse(params);
        return this.deleteRepository(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.output
        );
      }
    );

    // Register fork repository tool
    server.registerTool(
      'repository_fork',
      {
        description: `Faz fork de um repositório no Bitbucket Cloud.

**Funcionalidades:**
- Criação de fork com configurações personalizadas
- Configuração de privacidade do fork
- Associação com projetos
- Configuração de funcionalidades

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`repoSlug\`: Slug do repositório original
- \`name\`: Nome do repositório fork (opcional)
- \`description\`: Descrição do repositório fork (opcional)
- \`isPrivate\`: Se o repositório fork é privado (opcional)
- \`forkPolicy\`: Política de fork (allow_forks, no_public_forks, no_forks) (opcional)
- \`hasIssues\`: Se o repositório fork tem issues habilitadas (opcional)
- \`hasWiki\`: Se o repositório fork tem wiki habilitada (opcional)
- \`project\`: Projeto associado ao repositório fork (opcional)
- \`language\`: Linguagem principal do repositório fork (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Informações do repositório fork criado.`,
        inputSchema: ForkRepositorySchema.shape,
      },
      async (params: z.infer<typeof ForkRepositorySchema>) => {
        const validatedParams = ForkRepositorySchema.parse(params);
        return this.forkRepository(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.name,
          validatedParams.description,
          validatedParams.isPrivate,
          validatedParams.forkPolicy,
          validatedParams.hasIssues,
          validatedParams.hasWiki,
          validatedParams.project,
          validatedParams.language,
          validatedParams.output
        );
      }
    );

    // Register list repository forks tool
    server.registerTool(
      'repository_list_forks',
      {
        description: `Lista os forks de um repositório no Bitbucket Cloud.

**Funcionalidades:**
- Lista todos os forks do repositório
- Filtros por papel do usuário
- Busca por nome ou descrição
- Ordenação e paginação

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`repoSlug\`: Slug do repositório
- \`role\`: Filtro por papel (owner, admin, contributor, member) (opcional)
- \`q\`: Query de busca (opcional)
- \`sort\`: Campo para ordenação (created_on, updated_on, size, name) (opcional)
- \`page\`: Número da página para paginação (opcional)
- \`pagelen\`: Número de itens por página (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Lista paginada de forks do repositório.`,
        inputSchema: ListForksSchema.shape,
      },
      async (params: z.infer<typeof ListForksSchema>) => {
        const validatedParams = ListForksSchema.parse(params);
        return this.listRepositoryForks(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.role,
          validatedParams.q,
          validatedParams.sort,
          validatedParams.page,
          validatedParams.pagelen,
          validatedParams.output
        );
      }
    );

    // Register list repository branches tool
    server.registerTool(
      'repository_list_branches',
      {
        description: `Lista as branches de um repositório no Bitbucket Cloud.

**Funcionalidades:**
- Lista todas as branches do repositório
- Busca por nome de branch
- Ordenação por nome ou target
- Paginação

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`repoSlug\`: Slug do repositório
- \`q\`: Query de busca (opcional)
- \`sort\`: Campo para ordenação (name, -name, target, -target) (opcional)
- \`page\`: Número da página para paginação (opcional)
- \`pagelen\`: Número de itens por página (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Lista paginada de branches do repositório.`,
        inputSchema: ListBranchesSchema.shape,
      },
      async (params: z.infer<typeof ListBranchesSchema>) => {
        const validatedParams = ListBranchesSchema.parse(params);
        return this.listRepositoryBranches(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.q,
          validatedParams.sort,
          validatedParams.page,
          validatedParams.pagelen,
          validatedParams.output
        );
      }
    );

    // Register get repository branch tool
    server.registerTool(
      'repository_get_branch',
      {
        description: `Obtém informações de uma branch específica no Bitbucket Cloud.

**Funcionalidades:**
- Informações detalhadas da branch
- Detalhes do commit target
- Links para commits e histórico

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`repoSlug\`: Slug do repositório
- \`name\`: Nome da branch
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Informações detalhadas da branch incluindo target e links.`,
        inputSchema: GetBranchSchema.shape,
      },
      async (params: z.infer<typeof GetBranchSchema>) => {
        const validatedParams = GetBranchSchema.parse(params);
        return this.getRepositoryBranch(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.name,
          validatedParams.output
        );
      }
    );

    // Register create repository branch tool
    server.registerTool(
      'repository_create_branch',
      {
        description: `Cria uma nova branch em um repositório no Bitbucket Cloud.

**Funcionalidades:**
- Criação de branch a partir de um commit específico
- Configuração do commit target
- Validação de nomes de branch

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`repoSlug\`: Slug do repositório
- \`name\`: Nome da nova branch
- \`target\`: Hash do commit target
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Informações da branch criada incluindo target e links.`,
        inputSchema: CreateBranchSchema.shape,
      },
      async (params: z.infer<typeof CreateBranchSchema>) => {
        const validatedParams = CreateBranchSchema.parse(params);
        return this.createRepositoryBranch(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.name,
          validatedParams.target,
          validatedParams.output
        );
      }
    );

    // Register delete repository branch tool
    server.registerTool(
      'repository_delete_branch',
      {
        description: `Exclui uma branch de um repositório no Bitbucket Cloud.

**Funcionalidades:**
- Exclusão permanente da branch
- Validação de permissões
- Operação irreversível

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`repoSlug\`: Slug do repositório
- \`name\`: Nome da branch a ser excluída
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Confirmação da exclusão da branch.`,
        inputSchema: DeleteBranchSchema.shape,
      },
      async (params: z.infer<typeof DeleteBranchSchema>) => {
        const validatedParams = DeleteBranchSchema.parse(params);
        return this.deleteRepositoryBranch(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.name,
          validatedParams.output
        );
      }
    );

    // Register list repository tags tool
    server.registerTool(
      'repository_list_tags',
      {
        description: `Lista as tags de um repositório no Bitbucket Cloud.

**Funcionalidades:**
- Lista todas as tags do repositório
- Busca por nome de tag
- Ordenação por nome ou target
- Paginação

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`repoSlug\`: Slug do repositório
- \`q\`: Query de busca (opcional)
- \`sort\`: Campo para ordenação (name, -name, target, -target) (opcional)
- \`page\`: Número da página para paginação (opcional)
- \`pagelen\`: Número de itens por página (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Lista paginada de tags do repositório.`,
        inputSchema: ListTagsSchema.shape,
      },
      async (params: z.infer<typeof ListTagsSchema>) => {
        const validatedParams = ListTagsSchema.parse(params);
        return this.listRepositoryTags(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.q,
          validatedParams.sort,
          validatedParams.page,
          validatedParams.pagelen,
          validatedParams.output
        );
      }
    );

    // Register get repository tag tool
    server.registerTool(
      'repository_get_tag',
      {
        description: `Obtém informações de uma tag específica no Bitbucket Cloud.

**Funcionalidades:**
- Informações detalhadas da tag
- Detalhes do commit target
- Links para commits e histórico

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`repoSlug\`: Slug do repositório
- \`name\`: Nome da tag
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Informações detalhadas da tag incluindo target e links.`,
        inputSchema: GetTagSchema.shape,
      },
      async (params: z.infer<typeof GetTagSchema>) => {
        const validatedParams = GetTagSchema.parse(params);
        return this.getRepositoryTag(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.name,
          validatedParams.output
        );
      }
    );

    // Register create repository tag tool
    server.registerTool(
      'repository_create_tag',
      {
        description: `Cria uma nova tag em um repositório no Bitbucket Cloud.

**Funcionalidades:**
- Criação de tag a partir de um commit específico
- Configuração do commit target
- Mensagem opcional para a tag
- Validação de nomes de tag

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`repoSlug\`: Slug do repositório
- \`name\`: Nome da nova tag
- \`target\`: Hash do commit target
- \`message\`: Mensagem da tag (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Informações da tag criada incluindo target e links.`,
        inputSchema: CreateTagSchema.shape,
      },
      async (params: z.infer<typeof CreateTagSchema>) => {
        const validatedParams = CreateTagSchema.parse(params);
        return this.createRepositoryTag(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.name,
          validatedParams.target,
          validatedParams.message,
          validatedParams.output
        );
      }
    );

    // Register delete repository tag tool
    server.registerTool(
      'repository_delete_tag',
      {
        description: `Exclui uma tag de um repositório no Bitbucket Cloud.

**Funcionalidades:**
- Exclusão permanente da tag
- Validação de permissões
- Operação irreversível

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`repoSlug\`: Slug do repositório
- \`name\`: Nome da tag a ser excluída
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Confirmação da exclusão da tag.`,
        inputSchema: DeleteTagSchema.shape,
      },
      async (params: z.infer<typeof DeleteTagSchema>) => {
        const validatedParams = DeleteTagSchema.parse(params);
        return this.deleteRepositoryTag(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.name,
          validatedParams.output
        );
      }
    );

    // Register list repository commits tool
    server.registerTool(
      'repository_list_commits',
      {
        description: `Lista os commits de um repositório no Bitbucket Cloud.

**Funcionalidades:**
- Lista commits do repositório
- Filtros por include/exclude
- Busca por mensagem de commit
- Ordenação e paginação

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`repoSlug\`: Slug do repositório
- \`include\`: Incluir commits específicos (opcional)
- \`exclude\`: Excluir commits específicos (opcional)
- \`q\`: Query de busca (opcional)
- \`sort\`: Campo para ordenação (target, -target) (opcional)
- \`page\`: Número da página para paginação (opcional)
- \`pagelen\`: Número de itens por página (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Lista paginada de commits do repositório.`,
        inputSchema: ListCommitsSchema.shape,
      },
      async (params: z.infer<typeof ListCommitsSchema>) => {
        const validatedParams = ListCommitsSchema.parse(params);
        return this.listRepositoryCommits(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.include,
          validatedParams.exclude,
          validatedParams.q,
          validatedParams.sort,
          validatedParams.page,
          validatedParams.pagelen,
          validatedParams.output
        );
      }
    );

    // Register get repository commit tool
    server.registerTool(
      'repository_get_commit',
      {
        description: `Obtém informações de um commit específico no Bitbucket Cloud.

**Funcionalidades:**
- Informações detalhadas do commit
- Detalhes do autor e mensagem
- Links para diff e patch
- Informações dos commits pais

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`repoSlug\`: Slug do repositório
- \`commit\`: Hash do commit
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Informações detalhadas do commit incluindo autor, mensagem e links.`,
        inputSchema: GetCommitSchema.shape,
      },
      async (params: z.infer<typeof GetCommitSchema>) => {
        const validatedParams = GetCommitSchema.parse(params);
        return this.getRepositoryCommit(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.commit,
          validatedParams.output
        );
      }
    );

    // Register list repository webhooks tool
    server.registerTool(
      'repository_list_webhooks',
      {
        description: `Lista os webhooks de um repositório no Bitbucket Cloud.

**Funcionalidades:**
- Lista todos os webhooks do repositório
- Informações de configuração
- Status ativo/inativo

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`repoSlug\`: Slug do repositório
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Lista de webhooks do repositório com configurações.`,
        inputSchema: ListWebhooksSchema.shape,
      },
      async (params: z.infer<typeof ListWebhooksSchema>) => {
        const validatedParams = ListWebhooksSchema.parse(params);
        return this.listRepositoryWebhooks(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.output
        );
      }
    );

    // Register get repository webhook tool
    server.registerTool(
      'repository_get_webhook',
      {
        description: `Obtém informações de um webhook específico no Bitbucket Cloud.

**Funcionalidades:**
- Informações detalhadas do webhook
- Configurações de eventos
- Status e URLs
- Metadados de criação

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`repoSlug\`: Slug do repositório
- \`webhookUuid\`: UUID do webhook
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Informações detalhadas do webhook incluindo configurações e status.`,
        inputSchema: GetWebhookSchema.shape,
      },
      async (params: z.infer<typeof GetWebhookSchema>) => {
        const validatedParams = GetWebhookSchema.parse(params);
        return this.getRepositoryWebhook(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.webhookUuid,
          validatedParams.output
        );
      }
    );

    // Register create repository webhook tool
    server.registerTool(
      'repository_create_webhook',
      {
        description: `Cria um novo webhook em um repositório no Bitbucket Cloud.

**Funcionalidades:**
- Criação de webhook com configurações personalizadas
- Configuração de eventos
- URLs de callback
- Status ativo/inativo

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`repoSlug\`: Slug do repositório
- \`url\`: URL do webhook
- \`description\`: Descrição do webhook
- \`events\`: Lista de eventos (array de strings)
- \`active\`: Se o webhook está ativo (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Informações do webhook criado incluindo configurações e UID.`,
        inputSchema: CreateWebhookSchema.shape,
      },
      async (params: z.infer<typeof CreateWebhookSchema>) => {
        const validatedParams = CreateWebhookSchema.parse(params);
        return this.createRepositoryWebhook(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.url,
          validatedParams.description,
          validatedParams.events,
          validatedParams.active,
          validatedParams.output
        );
      }
    );

    // Register update repository webhook tool
    server.registerTool(
      'repository_update_webhook',
      {
        description: `Atualiza um webhook existente em um repositório no Bitbucket Cloud.

**Funcionalidades:**
- Atualização de configurações do webhook
- Modificação de eventos
- Alteração de URLs
- Ativação/desativação

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`repoSlug\`: Slug do repositório
- \`webhookUuid\`: UUID do webhook
- \`url\`: Nova URL do webhook (opcional)
- \`description\`: Nova descrição do webhook (opcional)
- \`events\`: Nova lista de eventos (opcional)
- \`active\`: Novo status ativo/inativo (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Informações atualizadas do webhook.`,
        inputSchema: UpdateWebhookSchema.shape,
      },
      async (params: z.infer<typeof UpdateWebhookSchema>) => {
        const validatedParams = UpdateWebhookSchema.parse(params);
        return this.updateRepositoryWebhook(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.webhookUuid,
          validatedParams.url,
          validatedParams.description,
          validatedParams.events,
          validatedParams.active,
          validatedParams.output
        );
      }
    );

    // Register delete repository webhook tool
    server.registerTool(
      'repository_delete_webhook',
      {
        description: `Exclui um webhook de um repositório no Bitbucket Cloud.

**Funcionalidades:**
- Exclusão permanente do webhook
- Validação de permissões
- Operação irreversível

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`repoSlug\`: Slug do repositório
- \`webhookUuid\`: UUID do webhook a ser excluído
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Confirmação da exclusão do webhook.`,
        inputSchema: DeleteWebhookSchema.shape,
      },
      async (params: z.infer<typeof DeleteWebhookSchema>) => {
        const validatedParams = DeleteWebhookSchema.parse(params);
        return this.deleteRepositoryWebhook(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.webhookUuid,
          validatedParams.output
        );
      }
    );

    // Register list repository variables tool
    server.registerTool(
      'repository_list_variables',
      {
        description: `Lista as variáveis de um repositório no Bitbucket Cloud.

**Funcionalidades:**
- Lista todas as variáveis do repositório
- Informações de segurança
- Valores e configurações

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`repoSlug\`: Slug do repositório
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Lista de variáveis do repositório com configurações.`,
        inputSchema: ListVariablesSchema.shape,
      },
      async (params: z.infer<typeof ListVariablesSchema>) => {
        const validatedParams = ListVariablesSchema.parse(params);
        return this.listRepositoryVariables(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.output
        );
      }
    );

    // Register get repository variable tool
    server.registerTool(
      'repository_get_variable',
      {
        description: `Obtém informações de uma variável específica no Bitbucket Cloud.

**Funcionalidades:**
- Informações detalhadas da variável
- Configurações de segurança
- Valores e metadados

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`repoSlug\`: Slug do repositório
- \`variableUuid\`: UUID da variável
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Informações detalhadas da variável incluindo configurações e valor.`,
        inputSchema: GetVariableSchema.shape,
      },
      async (params: z.infer<typeof GetVariableSchema>) => {
        const validatedParams = GetVariableSchema.parse(params);
        return this.getRepositoryVariable(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.variableUuid,
          validatedParams.output
        );
      }
    );

    // Register create repository variable tool
    server.registerTool(
      'repository_create_variable',
      {
        description: `Cria uma nova variável em um repositório no Bitbucket Cloud.

**Funcionalidades:**
- Criação de variável com configurações personalizadas
- Configuração de segurança
- Valores e chaves

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`repoSlug\`: Slug do repositório
- \`key\`: Chave da variável
- \`value\`: Valor da variável
- \`secured\`: Se a variável é segura (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Informações da variável criada incluindo configurações e UUID.`,
        inputSchema: CreateVariableSchema.shape,
      },
      async (params: z.infer<typeof CreateVariableSchema>) => {
        const validatedParams = CreateVariableSchema.parse(params);
        return this.createRepositoryVariable(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.key,
          validatedParams.value,
          validatedParams.secured,
          validatedParams.output
        );
      }
    );

    // Register update repository variable tool
    server.registerTool(
      'repository_update_variable',
      {
        description: `Atualiza uma variável existente em um repositório no Bitbucket Cloud.

**Funcionalidades:**
- Atualização de configurações da variável
- Modificação de valores
- Alteração de configurações de segurança

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`repoSlug\`: Slug do repositório
- \`variableUuid\`: UUID da variável
- \`key\`: Nova chave da variável (opcional)
- \`value\`: Novo valor da variável (opcional)
- \`secured\`: Nova configuração de segurança (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Informações atualizadas da variável.`,
        inputSchema: UpdateVariableSchema.shape,
      },
      async (params: z.infer<typeof UpdateVariableSchema>) => {
        const validatedParams = UpdateVariableSchema.parse(params);
        return this.updateRepositoryVariable(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.variableUuid,
          validatedParams.key,
          validatedParams.value,
          validatedParams.secured,
          validatedParams.output
        );
      }
    );

    // Register delete repository variable tool
    server.registerTool(
      'repository_delete_variable',
      {
        description: `Exclui uma variável de um repositório no Bitbucket Cloud.

**Funcionalidades:**
- Exclusão permanente da variável
- Validação de permissões
- Operação irreversível

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`repoSlug\`: Slug do repositório
- \`variableUuid\`: UUID da variável a ser excluída
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Confirmação da exclusão da variável.`,
        inputSchema: DeleteVariableSchema.shape,
      },
      async (params: z.infer<typeof DeleteVariableSchema>) => {
        const validatedParams = DeleteVariableSchema.parse(params);
        return this.deleteRepositoryVariable(
          validatedParams.workspace,
          validatedParams.repoSlug,
          validatedParams.variableUuid,
          validatedParams.output
        );
      }
    );

    registerLogger.info('Successfully registered all cloud repository tools');
  }
}
