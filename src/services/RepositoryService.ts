/**
 * Repository Service
 * T037: Repository service in src/services/RepositoryService.ts
 * 
 * Handles repository operations for both Data Center and Cloud
 * Based on research.md specifications
 */

import axios, { AxiosResponse } from 'axios';
import { z } from 'zod';
import { ServerInfo } from './server-detection.js';
import { logger } from '../utils/logger.js';
import { cache } from './cache.js';

// Repository schemas
export const RepositorySchema = z.object({
  id: z.number().optional(),
  slug: z.string(),
  name: z.string(),
  description: z.string().optional(),
  public: z.boolean().default(false),
  forkable: z.boolean().default(true),
  project: z.object({
    key: z.string(),
    name: z.string().optional(),
  }),
  links: z.object({
    clone: z.array(z.object({
      href: z.string(),
      name: z.string(),
    })).optional(),
    self: z.array(z.object({
      href: z.string(),
    })).optional(),
  }).optional(),
  createdDate: z.string().datetime().optional(),
  updatedDate: z.string().datetime().optional(),
  size: z.number().optional(),
  defaultBranch: z.string().optional(),
});

export const RepositoryListSchema = z.object({
  size: z.number(),
  limit: z.number(),
  isLastPage: z.boolean(),
  values: z.array(RepositorySchema),
  start: z.number().optional(),
});

export const RepositoryPermissionSchema = z.object({
  user: z.object({
    name: z.string(),
    displayName: z.string().optional(),
    emailAddress: z.string().optional(),
  }).optional(),
  group: z.object({
    name: z.string(),
  }).optional(),
  permission: z.enum(['REPO_READ', 'REPO_WRITE', 'REPO_ADMIN']),
});

export const RepositoryHookSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  events: z.array(z.string()),
  active: z.boolean().default(true),
  configuration: z.record(z.any()).optional(),
});

export type Repository = z.infer<typeof RepositorySchema>;
export type RepositoryList = z.infer<typeof RepositoryListSchema>;
export type RepositoryPermission = z.infer<typeof RepositoryPermissionSchema>;
export type RepositoryHook = z.infer<typeof RepositoryHookSchema>;

/**
 * Repository Service Class
 */
export class RepositoryService {
  private serverInfo: ServerInfo;
  private baseUrl: string;
  private authHeaders: Record<string, string>;

  constructor(serverInfo: ServerInfo, authHeaders: Record<string, string> = {}) {
    this.serverInfo = serverInfo;
    this.baseUrl = serverInfo.baseUrl;
    this.authHeaders = authHeaders;
  }

  /**
   * Lists repositories in a project
   */
  async listRepositories(
    projectKey: string,
    options: {
      start?: number;
      limit?: number;
      name?: string;
      permission?: string;
    } = {}
  ): Promise<RepositoryList> {
    const cacheKey = `repositories:${projectKey}:${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = await cache.get<RepositoryList>(cacheKey);
    if (cached) {
      logger.debug('Repository list cache hit', { projectKey, options });
      return cached;
    }

    try {
      const params = new URLSearchParams();
      if (options.start !== undefined) params.append('start', options.start.toString());
      if (options.limit !== undefined) params.append('limit', options.limit.toString());
      if (options.name) params.append('name', options.name);
      if (options.permission) params.append('permission', options.permission);

      const endpoint = this.serverInfo.serverType === 'cloud' 
        ? `/2.0/repositories/${projectKey}`
        : `/rest/api/1.0/projects/${projectKey}/repos`;

      const response: AxiosResponse<RepositoryList> = await axios.get(
        `${this.baseUrl}${endpoint}?${params.toString()}`,
        {
          headers: {
            'Accept': 'application/json',
            ...this.authHeaders,
          },
          timeout: 10000,
        }
      );

      const repositories = RepositoryListSchema.parse(response.data);
      
      // Cache the result
      await cache.set(cacheKey, repositories, 300); // 5 minutes
      
      logger.info('Repository list retrieved', {
        projectKey,
        count: repositories.values.length,
        serverType: this.serverInfo.serverType,
      });

      return repositories;
    } catch (error) {
      logger.error('Failed to list repositories', {
        projectKey,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Gets a specific repository
   */
  async getRepository(projectKey: string, repositorySlug: string): Promise<Repository> {
    const cacheKey = `repository:${projectKey}:${repositorySlug}`;
    
    // Check cache first
    const cached = await cache.get<Repository>(cacheKey);
    if (cached) {
      logger.debug('Repository cache hit', { projectKey, repositorySlug });
      return cached;
    }

    try {
      const endpoint = this.serverInfo.serverType === 'cloud'
        ? `/2.0/repositories/${projectKey}/${repositorySlug}`
        : `/rest/api/1.0/projects/${projectKey}/repos/${repositorySlug}`;

      const response: AxiosResponse<Repository> = await axios.get(
        `${this.baseUrl}${endpoint}`,
        {
          headers: {
            'Accept': 'application/json',
            ...this.authHeaders,
          },
          timeout: 10000,
        }
      );

      const repository = RepositorySchema.parse(response.data);
      
      // Cache the result
      await cache.set(cacheKey, repository, 300); // 5 minutes
      
      logger.info('Repository retrieved', {
        projectKey,
        repositorySlug,
        serverType: this.serverInfo.serverType,
      });

      return repository;
    } catch (error) {
      logger.error('Failed to get repository', {
        projectKey,
        repositorySlug,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Creates a new repository
   */
  async createRepository(
    projectKey: string,
    repositoryData: {
      name: string;
      description?: string;
      public?: boolean;
      forkable?: boolean;
    }
  ): Promise<Repository> {
    try {
      const endpoint = this.serverInfo.serverType === 'cloud'
        ? `/2.0/repositories/${projectKey}/${repositoryData.name}`
        : `/rest/api/1.0/projects/${projectKey}/repos`;

      const payload = this.serverInfo.serverType === 'cloud' 
        ? {
            name: repositoryData.name,
            description: repositoryData.description,
            is_private: !repositoryData.public,
            fork_policy: repositoryData.forkable ? 'allow_forks' : 'no_public_forks',
          }
        : {
            name: repositoryData.name,
            description: repositoryData.description,
            public: repositoryData.public,
            forkable: repositoryData.forkable,
          };

      const response: AxiosResponse<Repository> = await axios.post(
        `${this.baseUrl}${endpoint}`,
        payload,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...this.authHeaders,
          },
          timeout: 15000,
        }
      );

      const repository = RepositorySchema.parse(response.data);
      
      // Invalidate cache
      await cache.invalidatePattern(`repositories:${projectKey}:*`);
      
      logger.info('Repository created', {
        projectKey,
        repositorySlug: repository.slug,
        serverType: this.serverInfo.serverType,
      });

      return repository;
    } catch (error) {
      logger.error('Failed to create repository', {
        projectKey,
        repositoryData,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Updates a repository
   */
  async updateRepository(
    projectKey: string,
    repositorySlug: string,
    updates: {
      name?: string;
      description?: string;
      public?: boolean;
      forkable?: boolean;
    }
  ): Promise<Repository> {
    try {
      const endpoint = this.serverInfo.serverType === 'cloud'
        ? `/2.0/repositories/${projectKey}/${repositorySlug}`
        : `/rest/api/1.0/projects/${projectKey}/repos/${repositorySlug}`;

      const payload = this.serverInfo.serverType === 'cloud'
        ? {
            ...(updates.name && { name: updates.name }),
            ...(updates.description && { description: updates.description }),
            ...(updates.public !== undefined && { is_private: !updates.public }),
            ...(updates.forkable !== undefined && { 
              fork_policy: updates.forkable ? 'allow_forks' : 'no_public_forks' 
            }),
          }
        : {
            ...(updates.name && { name: updates.name }),
            ...(updates.description && { description: updates.description }),
            ...(updates.public !== undefined && { public: updates.public }),
            ...(updates.forkable !== undefined && { forkable: updates.forkable }),
          };

      const response: AxiosResponse<Repository> = await axios.put(
        `${this.baseUrl}${endpoint}`,
        payload,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...this.authHeaders,
          },
          timeout: 15000,
        }
      );

      const repository = RepositorySchema.parse(response.data);
      
      // Invalidate cache
      await cache.invalidatePattern(`repositories:${projectKey}:*`);
      await cache.delete(`repository:${projectKey}:${repositorySlug}`);
      
      logger.info('Repository updated', {
        projectKey,
        repositorySlug,
        serverType: this.serverInfo.serverType,
      });

      return repository;
    } catch (error) {
      logger.error('Failed to update repository', {
        projectKey,
        repositorySlug,
        updates,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Deletes a repository
   */
  async deleteRepository(projectKey: string, repositorySlug: string): Promise<void> {
    try {
      const endpoint = this.serverInfo.serverType === 'cloud'
        ? `/2.0/repositories/${projectKey}/${repositorySlug}`
        : `/rest/api/1.0/projects/${projectKey}/repos/${repositorySlug}`;

      await axios.delete(
        `${this.baseUrl}${endpoint}`,
        {
          headers: {
            ...this.authHeaders,
          },
          timeout: 15000,
        }
      );

      // Invalidate cache
      await cache.invalidatePattern(`repositories:${projectKey}:*`);
      await cache.delete(`repository:${projectKey}:${repositorySlug}`);
      
      logger.info('Repository deleted', {
        projectKey,
        repositorySlug,
        serverType: this.serverInfo.serverType,
      });
    } catch (error) {
      logger.error('Failed to delete repository', {
        projectKey,
        repositorySlug,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Gets repository permissions
   */
  async getRepositoryPermissions(projectKey: string, repositorySlug: string): Promise<RepositoryPermission[]> {
    const cacheKey = `repository-permissions:${projectKey}:${repositorySlug}`;
    
    // Check cache first
    const cached = await cache.get<RepositoryPermission[]>(cacheKey);
    if (cached) {
      logger.debug('Repository permissions cache hit', { projectKey, repositorySlug });
      return cached;
    }

    try {
      const endpoint = this.serverInfo.serverType === 'cloud'
        ? `/2.0/repositories/${projectKey}/${repositorySlug}/permissions`
        : `/rest/api/1.0/projects/${projectKey}/repos/${repositorySlug}/permissions`;

      const response: AxiosResponse<{ values: RepositoryPermission[] }> = await axios.get(
        `${this.baseUrl}${endpoint}`,
        {
          headers: {
            'Accept': 'application/json',
            ...this.authHeaders,
          },
          timeout: 10000,
        }
      );

      const permissions = response.data.values.map(perm => 
        RepositoryPermissionSchema.parse(perm)
      );
      
      // Cache the result
      await cache.set(cacheKey, permissions, 300); // 5 minutes
      
      logger.info('Repository permissions retrieved', {
        projectKey,
        repositorySlug,
        count: permissions.length,
        serverType: this.serverInfo.serverType,
      });

      return permissions;
    } catch (error) {
      logger.error('Failed to get repository permissions', {
        projectKey,
        repositorySlug,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Gets repository hooks
   */
  async getRepositoryHooks(projectKey: string, repositorySlug: string): Promise<RepositoryHook[]> {
    const cacheKey = `repository-hooks:${projectKey}:${repositorySlug}`;
    
    // Check cache first
    const cached = await cache.get<RepositoryHook[]>(cacheKey);
    if (cached) {
      logger.debug('Repository hooks cache hit', { projectKey, repositorySlug });
      return cached;
    }

    try {
      const endpoint = this.serverInfo.serverType === 'cloud'
        ? `/2.0/repositories/${projectKey}/${repositorySlug}/hooks`
        : `/rest/api/1.0/projects/${projectKey}/repos/${repositorySlug}/hooks`;

      const response: AxiosResponse<{ values: RepositoryHook[] }> = await axios.get(
        `${this.baseUrl}${endpoint}`,
        {
          headers: {
            'Accept': 'application/json',
            ...this.authHeaders,
          },
          timeout: 10000,
        }
      );

      const hooks = response.data.values.map(hook => 
        RepositoryHookSchema.parse(hook)
      );
      
      // Cache the result
      await cache.set(cacheKey, hooks, 300); // 5 minutes
      
      logger.info('Repository hooks retrieved', {
        projectKey,
        repositorySlug,
        count: hooks.length,
        serverType: this.serverInfo.serverType,
      });

      return hooks;
    } catch (error) {
      logger.error('Failed to get repository hooks', {
        projectKey,
        repositorySlug,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Gets repository branches
   */
  async getRepositoryBranches(
    projectKey: string,
    repositorySlug: string,
    options: { start?: number; limit?: number } = {}
  ): Promise<{ values: any[]; size: number; isLastPage: boolean }> {
    const cacheKey = `repository-branches:${projectKey}:${repositorySlug}:${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = await cache.get<{ values: any[]; size: number; isLastPage: boolean }>(cacheKey);
    if (cached) {
      logger.debug('Repository branches cache hit', { projectKey, repositorySlug });
      return cached;
    }

    try {
      const params = new URLSearchParams();
      if (options.start !== undefined) params.append('start', options.start.toString());
      if (options.limit !== undefined) params.append('limit', options.limit.toString());

      const endpoint = this.serverInfo.serverType === 'cloud'
        ? `/2.0/repositories/${projectKey}/${repositorySlug}/refs/branches`
        : `/rest/api/1.0/projects/${projectKey}/repos/${repositorySlug}/branches`;

      const response: AxiosResponse<{ values: any[]; size: number; isLastPage: boolean }> = await axios.get(
        `${this.baseUrl}${endpoint}?${params.toString()}`,
        {
          headers: {
            'Accept': 'application/json',
            ...this.authHeaders,
          },
          timeout: 10000,
        }
      );

      const branches = response.data;
      
      // Cache the result
      await cache.set(cacheKey, branches, 300); // 5 minutes
      
      logger.info('Repository branches retrieved', {
        projectKey,
        repositorySlug,
        count: branches.values.length,
        serverType: this.serverInfo.serverType,
      });

      return branches;
    } catch (error) {
      logger.error('Failed to get repository branches', {
        projectKey,
        repositorySlug,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Gets repository tags
   */
  async getRepositoryTags(
    projectKey: string,
    repositorySlug: string,
    options: { start?: number; limit?: number } = {}
  ): Promise<{ values: any[]; size: number; isLastPage: boolean }> {
    const cacheKey = `repository-tags:${projectKey}:${repositorySlug}:${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = await cache.get<{ values: any[]; size: number; isLastPage: boolean }>(cacheKey);
    if (cached) {
      logger.debug('Repository tags cache hit', { projectKey, repositorySlug });
      return cached;
    }

    try {
      const params = new URLSearchParams();
      if (options.start !== undefined) params.append('start', options.start.toString());
      if (options.limit !== undefined) params.append('limit', options.limit.toString());

      const endpoint = this.serverInfo.serverType === 'cloud'
        ? `/2.0/repositories/${projectKey}/${repositorySlug}/refs/tags`
        : `/rest/api/1.0/projects/${projectKey}/repos/${repositorySlug}/tags`;

      const response: AxiosResponse<{ values: any[]; size: number; isLastPage: boolean }> = await axios.get(
        `${this.baseUrl}${endpoint}?${params.toString()}`,
        {
          headers: {
            'Accept': 'application/json',
            ...this.authHeaders,
          },
          timeout: 10000,
        }
      );

      const tags = response.data;
      
      // Cache the result
      await cache.set(cacheKey, tags, 300); // 5 minutes
      
      logger.info('Repository tags retrieved', {
        projectKey,
        repositorySlug,
        count: tags.values.length,
        serverType: this.serverInfo.serverType,
      });

      return tags;
    } catch (error) {
      logger.error('Failed to get repository tags', {
        projectKey,
        repositorySlug,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

// Export singleton instance
export const repositoryService = new RepositoryService(
  { 
    serverType: 'datacenter', 
    version: '7.16.0', 
    baseUrl: '', 
    isSupported: true,
    fallbackUsed: false,
    cached: false
  },
  {}
);
