/**
 * Permission Service
 * T038: Permission service in src/services/PermissionService.ts
 * 
 * Handles permission operations for both Data Center and Cloud
 * Based on research.md specifications
 */

import axios, { AxiosResponse } from 'axios';
import { z } from 'zod';
import { ServerInfo } from './server-detection';
import { logger } from '../utils/logger';
import { cache } from './cache';

// Permission schemas
export const PermissionSchema = z.object({
  user: z.object({
    name: z.string(),
    displayName: z.string().optional(),
    emailAddress: z.string().optional(),
    active: z.boolean().optional(),
    slug: z.string().optional(),
  }).optional(),
  group: z.object({
    name: z.string(),
    displayName: z.string().optional(),
  }).optional(),
  permission: z.enum(['PROJECT_READ', 'PROJECT_WRITE', 'PROJECT_ADMIN', 'REPO_READ', 'REPO_WRITE', 'REPO_ADMIN']),
  grantedBy: z.object({
    name: z.string(),
    displayName: z.string().optional(),
  }).optional(),
  grantedDate: z.string().datetime().optional(),
});

export const PermissionListSchema = z.object({
  size: z.number(),
  limit: z.number(),
  isLastPage: z.boolean(),
  values: z.array(PermissionSchema),
  start: z.number().optional(),
});

export const GroupSchema = z.object({
  name: z.string(),
  displayName: z.string().optional(),
  description: z.string().optional(),
  members: z.number().optional(),
  createdDate: z.string().datetime().optional(),
});

export const UserSchema = z.object({
  name: z.string(),
  displayName: z.string().optional(),
  emailAddress: z.string().optional(),
  active: z.boolean().optional(),
  slug: z.string().optional(),
  createdDate: z.string().datetime().optional(),
  lastLoginDate: z.string().datetime().optional(),
});

export type Permission = z.infer<typeof PermissionSchema>;
export type PermissionList = z.infer<typeof PermissionListSchema>;
export type Group = z.infer<typeof GroupSchema>;
export type User = z.infer<typeof UserSchema>;

/**
 * Permission Service Class
 */
export class PermissionService {
  private serverInfo: ServerInfo;
  private baseUrl: string;
  private authHeaders: Record<string, string>;

  constructor(serverInfo: ServerInfo, authHeaders: Record<string, string> = {}) {
    this.serverInfo = serverInfo;
    this.baseUrl = serverInfo.baseUrl;
    this.authHeaders = authHeaders;
  }

  /**
   * Gets project permissions
   */
  async getProjectPermissions(
    projectKey: string,
    options: {
      start?: number;
      limit?: number;
      permission?: string;
    } = {}
  ): Promise<PermissionList> {
    const cacheKey = `project-permissions:${projectKey}:${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = await cache.get<PermissionList>(cacheKey);
    if (cached) {
      logger.debug('Project permissions cache hit', { projectKey });
      return cached;
    }

    try {
      const params = new URLSearchParams();
      if (options.start !== undefined) params.append('start', options.start.toString());
      if (options.limit !== undefined) params.append('limit', options.limit.toString());
      if (options.permission) params.append('permission', options.permission);

      const endpoint = this.serverInfo.serverType === 'cloud'
        ? `/2.0/workspaces/${projectKey}/permissions`
        : `/rest/api/1.0/projects/${projectKey}/permissions`;

      const response: AxiosResponse<PermissionList> = await axios.get(
        `${this.baseUrl}${endpoint}?${params.toString()}`,
        {
          headers: {
            'Accept': 'application/json',
            ...this.authHeaders,
          },
          timeout: 10000,
        }
      );

      const permissions = PermissionListSchema.parse(response.data);
      
      // Cache the result
      await cache.set(cacheKey, permissions, 300); // 5 minutes
      
      logger.info('Project permissions retrieved', {
        projectKey,
        count: permissions.values.length,
        serverType: this.serverInfo.serverType,
      });

      return permissions;
    } catch (error) {
      logger.error('Failed to get project permissions', {
        projectKey,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Gets repository permissions
   */
  async getRepositoryPermissions(
    projectKey: string,
    repositorySlug: string,
    options: {
      start?: number;
      limit?: number;
      permission?: string;
    } = {}
  ): Promise<PermissionList> {
    const cacheKey = `repository-permissions:${projectKey}:${repositorySlug}:${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = await cache.get<PermissionList>(cacheKey);
    if (cached) {
      logger.debug('Repository permissions cache hit', { projectKey, repositorySlug });
      return cached;
    }

    try {
      const params = new URLSearchParams();
      if (options.start !== undefined) params.append('start', options.start.toString());
      if (options.limit !== undefined) params.append('limit', options.limit.toString());
      if (options.permission) params.append('permission', options.permission);

      const endpoint = this.serverInfo.serverType === 'cloud'
        ? `/2.0/repositories/${projectKey}/${repositorySlug}/permissions`
        : `/rest/api/1.0/projects/${projectKey}/repos/${repositorySlug}/permissions`;

      const response: AxiosResponse<PermissionList> = await axios.get(
        `${this.baseUrl}${endpoint}?${params.toString()}`,
        {
          headers: {
            'Accept': 'application/json',
            ...this.authHeaders,
          },
          timeout: 10000,
        }
      );

      const permissions = PermissionListSchema.parse(response.data);
      
      // Cache the result
      await cache.set(cacheKey, permissions, 300); // 5 minutes
      
      logger.info('Repository permissions retrieved', {
        projectKey,
        repositorySlug,
        count: permissions.values.length,
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
   * Adds project permission
   */
  async addProjectPermission(
    projectKey: string,
    permissionData: {
      user?: string;
      group?: string;
      permission: 'PROJECT_READ' | 'PROJECT_WRITE' | 'PROJECT_ADMIN';
    }
  ): Promise<Permission> {
    try {
      const endpoint = this.serverInfo.serverType === 'cloud'
        ? `/2.0/workspaces/${projectKey}/permissions`
        : `/rest/api/1.0/projects/${projectKey}/permissions`;

      const payload = this.serverInfo.serverType === 'cloud'
        ? {
            ...(permissionData.user && { user: { username: permissionData.user } }),
            ...(permissionData.group && { group: { slug: permissionData.group } }),
            permission: permissionData.permission.toLowerCase().replace('project_', ''),
          }
        : {
            ...(permissionData.user && { user: { name: permissionData.user } }),
            ...(permissionData.group && { group: { name: permissionData.group } }),
            permission: permissionData.permission,
          };

      const response: AxiosResponse<Permission> = await axios.post(
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

      const permission = PermissionSchema.parse(response.data);
      
      // Invalidate cache
      await cache.invalidatePattern(`project-permissions:${projectKey}:*`);
      
      logger.info('Project permission added', {
        projectKey,
        user: permissionData.user,
        group: permissionData.group,
        permission: permissionData.permission,
        serverType: this.serverInfo.serverType,
      });

      return permission;
    } catch (error) {
      logger.error('Failed to add project permission', {
        projectKey,
        permissionData,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Adds repository permission
   */
  async addRepositoryPermission(
    projectKey: string,
    repositorySlug: string,
    permissionData: {
      user?: string;
      group?: string;
      permission: 'REPO_READ' | 'REPO_WRITE' | 'REPO_ADMIN';
    }
  ): Promise<Permission> {
    try {
      const endpoint = this.serverInfo.serverType === 'cloud'
        ? `/2.0/repositories/${projectKey}/${repositorySlug}/permissions`
        : `/rest/api/1.0/projects/${projectKey}/repos/${repositorySlug}/permissions`;

      const payload = this.serverInfo.serverType === 'cloud'
        ? {
            ...(permissionData.user && { user: { username: permissionData.user } }),
            ...(permissionData.group && { group: { slug: permissionData.group } }),
            permission: permissionData.permission.toLowerCase().replace('repo_', ''),
          }
        : {
            ...(permissionData.user && { user: { name: permissionData.user } }),
            ...(permissionData.group && { group: { name: permissionData.group } }),
            permission: permissionData.permission,
          };

      const response: AxiosResponse<Permission> = await axios.post(
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

      const permission = PermissionSchema.parse(response.data);
      
      // Invalidate cache
      await cache.invalidatePattern(`repository-permissions:${projectKey}:${repositorySlug}:*`);
      
      logger.info('Repository permission added', {
        projectKey,
        repositorySlug,
        user: permissionData.user,
        group: permissionData.group,
        permission: permissionData.permission,
        serverType: this.serverInfo.serverType,
      });

      return permission;
    } catch (error) {
      logger.error('Failed to add repository permission', {
        projectKey,
        repositorySlug,
        permissionData,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Removes project permission
   */
  async removeProjectPermission(
    projectKey: string,
    permissionData: {
      user?: string;
      group?: string;
      permission: 'PROJECT_READ' | 'PROJECT_WRITE' | 'PROJECT_ADMIN';
    }
  ): Promise<void> {
    try {
      const endpoint = this.serverInfo.serverType === 'cloud'
        ? `/2.0/workspaces/${projectKey}/permissions`
        : `/rest/api/1.0/projects/${projectKey}/permissions`;

      const params = new URLSearchParams();
      if (permissionData.user) params.append('user', permissionData.user);
      if (permissionData.group) params.append('group', permissionData.group);
      params.append('permission', permissionData.permission);

      await axios.delete(
        `${this.baseUrl}${endpoint}?${params.toString()}`,
        {
          headers: {
            ...this.authHeaders,
          },
          timeout: 15000,
        }
      );

      // Invalidate cache
      await cache.invalidatePattern(`project-permissions:${projectKey}:*`);
      
      logger.info('Project permission removed', {
        projectKey,
        user: permissionData.user,
        group: permissionData.group,
        permission: permissionData.permission,
        serverType: this.serverInfo.serverType,
      });
    } catch (error) {
      logger.error('Failed to remove project permission', {
        projectKey,
        permissionData,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Removes repository permission
   */
  async removeRepositoryPermission(
    projectKey: string,
    repositorySlug: string,
    permissionData: {
      user?: string;
      group?: string;
      permission: 'REPO_READ' | 'REPO_WRITE' | 'REPO_ADMIN';
    }
  ): Promise<void> {
    try {
      const endpoint = this.serverInfo.serverType === 'cloud'
        ? `/2.0/repositories/${projectKey}/${repositorySlug}/permissions`
        : `/rest/api/1.0/projects/${projectKey}/repos/${repositorySlug}/permissions`;

      const params = new URLSearchParams();
      if (permissionData.user) params.append('user', permissionData.user);
      if (permissionData.group) params.append('group', permissionData.group);
      params.append('permission', permissionData.permission);

      await axios.delete(
        `${this.baseUrl}${endpoint}?${params.toString()}`,
        {
          headers: {
            ...this.authHeaders,
          },
          timeout: 15000,
        }
      );

      // Invalidate cache
      await cache.invalidatePattern(`repository-permissions:${projectKey}:${repositorySlug}:*`);
      
      logger.info('Repository permission removed', {
        projectKey,
        repositorySlug,
        user: permissionData.user,
        group: permissionData.group,
        permission: permissionData.permission,
        serverType: this.serverInfo.serverType,
      });
    } catch (error) {
      logger.error('Failed to remove repository permission', {
        projectKey,
        repositorySlug,
        permissionData,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Gets all groups
   */
  async getGroups(options: {
    start?: number;
    limit?: number;
    filter?: string;
  } = {}): Promise<{ values: Group[]; size: number; isLastPage: boolean }> {
    const cacheKey = `groups:${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = await cache.get<{ values: Group[]; size: number; isLastPage: boolean }>(cacheKey);
    if (cached) {
      logger.debug('Groups cache hit');
      return cached;
    }

    try {
      const params = new URLSearchParams();
      if (options.start !== undefined) params.append('start', options.start.toString());
      if (options.limit !== undefined) params.append('limit', options.limit.toString());
      if (options.filter) params.append('filter', options.filter);

      const endpoint = this.serverInfo.serverType === 'cloud'
        ? `/2.0/workspaces/groups`
        : `/rest/api/1.0/admin/groups`;

      const response: AxiosResponse<{ values: Group[]; size: number; isLastPage: boolean }> = await axios.get(
        `${this.baseUrl}${endpoint}?${params.toString()}`,
        {
          headers: {
            'Accept': 'application/json',
            ...this.authHeaders,
          },
          timeout: 10000,
        }
      );

      const groups = {
        values: response.data.values.map(group => GroupSchema.parse(group)),
        size: response.data.size,
        isLastPage: response.data.isLastPage,
      };
      
      // Cache the result
      await cache.set(cacheKey, groups, 600); // 10 minutes
      
      logger.info('Groups retrieved', {
        count: groups.values.length,
        serverType: this.serverInfo.serverType,
      });

      return groups;
    } catch (error) {
      logger.error('Failed to get groups', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Gets all users
   */
  async getUsers(options: {
    start?: number;
    limit?: number;
    filter?: string;
  } = {}): Promise<{ values: User[]; size: number; isLastPage: boolean }> {
    const cacheKey = `users:${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = await cache.get<{ values: User[]; size: number; isLastPage: boolean }>(cacheKey);
    if (cached) {
      logger.debug('Users cache hit');
      return cached;
    }

    try {
      const params = new URLSearchParams();
      if (options.start !== undefined) params.append('start', options.start.toString());
      if (options.limit !== undefined) params.append('limit', options.limit.toString());
      if (options.filter) params.append('filter', options.filter);

      const endpoint = this.serverInfo.serverType === 'cloud'
        ? `/2.0/workspaces/users`
        : `/rest/api/1.0/admin/users`;

      const response: AxiosResponse<{ values: User[]; size: number; isLastPage: boolean }> = await axios.get(
        `${this.baseUrl}${endpoint}?${params.toString()}`,
        {
          headers: {
            'Accept': 'application/json',
            ...this.authHeaders,
          },
          timeout: 10000,
        }
      );

      const users = {
        values: response.data.values.map(user => UserSchema.parse(user)),
        size: response.data.size,
        isLastPage: response.data.isLastPage,
      };
      
      // Cache the result
      await cache.set(cacheKey, users, 600); // 10 minutes
      
      logger.info('Users retrieved', {
        count: users.values.length,
        serverType: this.serverInfo.serverType,
      });

      return users;
    } catch (error) {
      logger.error('Failed to get users', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Gets user permissions
   */
  async getUserPermissions(
    username: string,
    options: {
      start?: number;
      limit?: number;
    } = {}
  ): Promise<PermissionList> {
    const cacheKey = `user-permissions:${username}:${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = await cache.get<PermissionList>(cacheKey);
    if (cached) {
      logger.debug('User permissions cache hit', { username });
      return cached;
    }

    try {
      const params = new URLSearchParams();
      if (options.start !== undefined) params.append('start', options.start.toString());
      if (options.limit !== undefined) params.append('limit', options.limit.toString());

      const endpoint = this.serverInfo.serverType === 'cloud'
        ? `/2.0/users/${username}/permissions`
        : `/rest/api/1.0/users/${username}/permissions`;

      const response: AxiosResponse<PermissionList> = await axios.get(
        `${this.baseUrl}${endpoint}?${params.toString()}`,
        {
          headers: {
            'Accept': 'application/json',
            ...this.authHeaders,
          },
          timeout: 10000,
        }
      );

      const permissions = PermissionListSchema.parse(response.data);
      
      // Cache the result
      await cache.set(cacheKey, permissions, 300); // 5 minutes
      
      logger.info('User permissions retrieved', {
        username,
        count: permissions.values.length,
        serverType: this.serverInfo.serverType,
      });

      return permissions;
    } catch (error) {
      logger.error('Failed to get user permissions', {
        username,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

// Export singleton instance
export const permissionService = new PermissionService(
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
