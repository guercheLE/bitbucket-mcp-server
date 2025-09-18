/**
 * Avatar Service
 * T040: Avatar service in src/services/AvatarService.ts
 * 
 * Handles avatar operations for both Data Center and Cloud
 * Based on research.md specifications
 */

import axios, { AxiosResponse } from 'axios';
import { z } from 'zod';
import { ServerInfo } from './server-detection.js';
import { logger } from '../utils/logger.js';
import { cache } from './cache.js';

// Avatar schemas
export const AvatarSchema = z.object({
  id: z.string().optional(),
  url: z.string().url(),
  size: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  type: z.enum(['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml']).optional(),
  createdDate: z.string().datetime().optional(),
  updatedDate: z.string().datetime().optional(),
});

export const AvatarUploadSchema = z.object({
  avatar: z.string(), // Base64 encoded image data
  contentType: z.enum(['image/png', 'image/jpeg', 'image/gif']),
  size: z.number().optional(),
});

export type Avatar = z.infer<typeof AvatarSchema>;
export type AvatarUpload = z.infer<typeof AvatarUploadSchema>;

/**
 * Avatar Service Class
 */
export class AvatarService {
  private serverInfo: ServerInfo;
  private baseUrl: string;
  private authHeaders: Record<string, string>;

  constructor(serverInfo: ServerInfo, authHeaders: Record<string, string> = {}) {
    this.serverInfo = serverInfo;
    this.baseUrl = serverInfo.baseUrl;
    this.authHeaders = authHeaders;
  }

  /**
   * Gets project avatar
   */
  async getProjectAvatar(projectKey: string): Promise<Avatar> {
    const cacheKey = `project-avatar:${projectKey}`;
    
    // Check cache first
    const cached = await cache.get<Avatar>(cacheKey);
    if (cached) {
      logger.debug('Project avatar cache hit', { projectKey });
      return cached;
    }

    try {
      const endpoint = this.serverInfo.serverType === 'cloud'
        ? `/2.0/workspaces/${projectKey}/avatar`
        : `/rest/api/1.0/projects/${projectKey}/avatar`;

      const response: AxiosResponse<Avatar> = await axios.get(
        `${this.baseUrl}${endpoint}`,
        {
          headers: {
            'Accept': 'application/json',
            ...this.authHeaders,
          },
          timeout: 10000,
        }
      );

      const avatar = AvatarSchema.parse(response.data);
      
      // Cache the result
      await cache.set(cacheKey, avatar, 3600); // 1 hour (avatars don't change often)
      
      logger.info('Project avatar retrieved', {
        projectKey,
        serverType: this.serverInfo.serverType,
      });

      return avatar;
    } catch (error) {
      logger.error('Failed to get project avatar', {
        projectKey,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Uploads project avatar
   */
  async uploadProjectAvatar(
    projectKey: string,
    avatarData: AvatarUpload
  ): Promise<Avatar> {
    try {
      const endpoint = this.serverInfo.serverType === 'cloud'
        ? `/2.0/workspaces/${projectKey}/avatar`
        : `/rest/api/1.0/projects/${projectKey}/avatar`;

      // Convert base64 to buffer
      const imageBuffer = Buffer.from(avatarData.avatar, 'base64');
      
      const formData = new FormData();
      const blob = new Blob([imageBuffer], { type: avatarData.contentType });
      formData.append('avatar', blob, 'avatar');

      const response: AxiosResponse<Avatar> = await axios.post(
        `${this.baseUrl}${endpoint}`,
        formData,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'multipart/form-data',
            ...this.authHeaders,
          },
          timeout: 30000, // Longer timeout for file uploads
        }
      );

      const avatar = AvatarSchema.parse(response.data);
      
      // Invalidate cache
      await cache.delete(`project-avatar:${projectKey}`);
      
      logger.info('Project avatar uploaded', {
        projectKey,
        contentType: avatarData.contentType,
        size: avatarData.size,
        serverType: this.serverInfo.serverType,
      });

      return avatar;
    } catch (error) {
      logger.error('Failed to upload project avatar', {
        projectKey,
        avatarData: { ...avatarData, avatar: '[base64 data]' }, // Don't log the actual image data
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Deletes project avatar
   */
  async deleteProjectAvatar(projectKey: string): Promise<void> {
    try {
      const endpoint = this.serverInfo.serverType === 'cloud'
        ? `/2.0/workspaces/${projectKey}/avatar`
        : `/rest/api/1.0/projects/${projectKey}/avatar`;

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
      await cache.delete(`project-avatar:${projectKey}`);
      
      logger.info('Project avatar deleted', {
        projectKey,
        serverType: this.serverInfo.serverType,
      });
    } catch (error) {
      logger.error('Failed to delete project avatar', {
        projectKey,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Gets user avatar
   */
  async getUserAvatar(username: string): Promise<Avatar> {
    const cacheKey = `user-avatar:${username}`;
    
    // Check cache first
    const cached = await cache.get<Avatar>(cacheKey);
    if (cached) {
      logger.debug('User avatar cache hit', { username });
      return cached;
    }

    try {
      const endpoint = this.serverInfo.serverType === 'cloud'
        ? `/2.0/users/${username}/avatar`
        : `/rest/api/1.0/users/${username}/avatar`;

      const response: AxiosResponse<Avatar> = await axios.get(
        `${this.baseUrl}${endpoint}`,
        {
          headers: {
            'Accept': 'application/json',
            ...this.authHeaders,
          },
          timeout: 10000,
        }
      );

      const avatar = AvatarSchema.parse(response.data);
      
      // Cache the result
      await cache.set(cacheKey, avatar, 3600); // 1 hour
      
      logger.info('User avatar retrieved', {
        username,
        serverType: this.serverInfo.serverType,
      });

      return avatar;
    } catch (error) {
      logger.error('Failed to get user avatar', {
        username,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Uploads user avatar
   */
  async uploadUserAvatar(
    username: string,
    avatarData: AvatarUpload
  ): Promise<Avatar> {
    try {
      const endpoint = this.serverInfo.serverType === 'cloud'
        ? `/2.0/users/${username}/avatar`
        : `/rest/api/1.0/users/${username}/avatar`;

      // Convert base64 to buffer
      const imageBuffer = Buffer.from(avatarData.avatar, 'base64');
      
      const formData = new FormData();
      const blob = new Blob([imageBuffer], { type: avatarData.contentType });
      formData.append('avatar', blob, 'avatar');

      const response: AxiosResponse<Avatar> = await axios.post(
        `${this.baseUrl}${endpoint}`,
        formData,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'multipart/form-data',
            ...this.authHeaders,
          },
          timeout: 30000,
        }
      );

      const avatar = AvatarSchema.parse(response.data);
      
      // Invalidate cache
      await cache.delete(`user-avatar:${username}`);
      
      logger.info('User avatar uploaded', {
        username,
        contentType: avatarData.contentType,
        size: avatarData.size,
        serverType: this.serverInfo.serverType,
      });

      return avatar;
    } catch (error) {
      logger.error('Failed to upload user avatar', {
        username,
        avatarData: { ...avatarData, avatar: '[base64 data]' },
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Deletes user avatar
   */
  async deleteUserAvatar(username: string): Promise<void> {
    try {
      const endpoint = this.serverInfo.serverType === 'cloud'
        ? `/2.0/users/${username}/avatar`
        : `/rest/api/1.0/users/${username}/avatar`;

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
      await cache.delete(`user-avatar:${username}`);
      
      logger.info('User avatar deleted', {
        username,
        serverType: this.serverInfo.serverType,
      });
    } catch (error) {
      logger.error('Failed to delete user avatar', {
        username,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Gets group avatar
   */
  async getGroupAvatar(groupName: string): Promise<Avatar> {
    const cacheKey = `group-avatar:${groupName}`;
    
    // Check cache first
    const cached = await cache.get<Avatar>(cacheKey);
    if (cached) {
      logger.debug('Group avatar cache hit', { groupName });
      return cached;
    }

    try {
      const endpoint = this.serverInfo.serverType === 'cloud'
        ? `/2.0/groups/${groupName}/avatar`
        : `/rest/api/1.0/admin/groups/${groupName}/avatar`;

      const response: AxiosResponse<Avatar> = await axios.get(
        `${this.baseUrl}${endpoint}`,
        {
          headers: {
            'Accept': 'application/json',
            ...this.authHeaders,
          },
          timeout: 10000,
        }
      );

      const avatar = AvatarSchema.parse(response.data);
      
      // Cache the result
      await cache.set(cacheKey, avatar, 3600); // 1 hour
      
      logger.info('Group avatar retrieved', {
        groupName,
        serverType: this.serverInfo.serverType,
      });

      return avatar;
    } catch (error) {
      logger.error('Failed to get group avatar', {
        groupName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Uploads group avatar
   */
  async uploadGroupAvatar(
    groupName: string,
    avatarData: AvatarUpload
  ): Promise<Avatar> {
    try {
      const endpoint = this.serverInfo.serverType === 'cloud'
        ? `/2.0/groups/${groupName}/avatar`
        : `/rest/api/1.0/admin/groups/${groupName}/avatar`;

      // Convert base64 to buffer
      const imageBuffer = Buffer.from(avatarData.avatar, 'base64');
      
      const formData = new FormData();
      const blob = new Blob([imageBuffer], { type: avatarData.contentType });
      formData.append('avatar', blob, 'avatar');

      const response: AxiosResponse<Avatar> = await axios.post(
        `${this.baseUrl}${endpoint}`,
        formData,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'multipart/form-data',
            ...this.authHeaders,
          },
          timeout: 30000,
        }
      );

      const avatar = AvatarSchema.parse(response.data);
      
      // Invalidate cache
      await cache.delete(`group-avatar:${groupName}`);
      
      logger.info('Group avatar uploaded', {
        groupName,
        contentType: avatarData.contentType,
        size: avatarData.size,
        serverType: this.serverInfo.serverType,
      });

      return avatar;
    } catch (error) {
      logger.error('Failed to upload group avatar', {
        groupName,
        avatarData: { ...avatarData, avatar: '[base64 data]' },
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Deletes group avatar
   */
  async deleteGroupAvatar(groupName: string): Promise<void> {
    try {
      const endpoint = this.serverInfo.serverType === 'cloud'
        ? `/2.0/groups/${groupName}/avatar`
        : `/rest/api/1.0/admin/groups/${groupName}/avatar`;

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
      await cache.delete(`group-avatar:${groupName}`);
      
      logger.info('Group avatar deleted', {
        groupName,
        serverType: this.serverInfo.serverType,
      });
    } catch (error) {
      logger.error('Failed to delete group avatar', {
        groupName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Validates avatar data
   */
  validateAvatarData(avatarData: AvatarUpload): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check content type
    if (!['image/png', 'image/jpeg', 'image/gif'].includes(avatarData.contentType)) {
      errors.push('Invalid content type. Must be image/png, image/jpeg, or image/gif');
    }

    // Check size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (avatarData.size && avatarData.size > maxSize) {
      errors.push(`Avatar size too large. Maximum size is ${maxSize} bytes`);
    }

    // Check base64 data
    try {
      const buffer = Buffer.from(avatarData.avatar, 'base64');
      if (buffer.length === 0) {
        errors.push('Invalid base64 data');
      }
    } catch {
      errors.push('Invalid base64 encoding');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Gets avatar URL for display
   */
  getAvatarUrl(avatar: Avatar, size?: number): string {
    if (!avatar.url) {
      return '';
    }

    // For Data Center, we can add size parameter
    if (this.serverInfo.serverType === 'datacenter' && size) {
      const url = new URL(avatar.url);
      url.searchParams.set('s', size.toString());
      return url.toString();
    }

    return avatar.url;
  }
}

// Export singleton instance
export const avatarService = new AvatarService(
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
