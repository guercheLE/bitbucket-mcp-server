/**
 * Webhook Service
 * T039: Webhook service in src/services/WebhookService.ts
 * 
 * Handles webhook operations for both Data Center and Cloud
 * Based on research.md specifications
 */

import axios, { AxiosResponse } from 'axios';
import { z } from 'zod';
import { ServerInfo } from './server-detection';
import { logger } from '../utils/logger';
import { cache } from './cache';

// Webhook schemas
export const WebhookSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url(),
  events: z.array(z.string()),
  active: z.boolean().default(true),
  configuration: z.record(z.any()).optional(),
  createdDate: z.string().datetime().optional(),
  updatedDate: z.string().datetime().optional(),
  statistics: z.object({
    calls: z.number().optional(),
    lastCall: z.string().datetime().optional(),
    failures: z.number().optional(),
  }).optional(),
});

export const WebhookListSchema = z.object({
  size: z.number(),
  limit: z.number(),
  isLastPage: z.boolean(),
  values: z.array(WebhookSchema),
  start: z.number().optional(),
});

export const WebhookEventSchema = z.object({
  event: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
});

export const WebhookStatisticsSchema = z.object({
  calls: z.number(),
  lastCall: z.string().datetime().optional(),
  failures: z.number(),
  successRate: z.number().optional(),
});

export type Webhook = z.infer<typeof WebhookSchema>;
export type WebhookList = z.infer<typeof WebhookListSchema>;
export type WebhookEvent = z.infer<typeof WebhookEventSchema>;
export type WebhookStatistics = z.infer<typeof WebhookStatisticsSchema>;

/**
 * Webhook Service Class
 */
export class WebhookService {
  private serverInfo: ServerInfo;
  private baseUrl: string;
  private authHeaders: Record<string, string>;

  constructor(serverInfo: ServerInfo, authHeaders: Record<string, string> = {}) {
    this.serverInfo = serverInfo;
    this.baseUrl = serverInfo.baseUrl;
    this.authHeaders = authHeaders;
  }

  /**
   * Lists webhooks for a repository
   */
  async listRepositoryWebhooks(
    projectKey: string,
    repositorySlug: string,
    options: {
      start?: number;
      limit?: number;
    } = {}
  ): Promise<WebhookList> {
    const cacheKey = `webhooks:${projectKey}:${repositorySlug}:${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = await cache.get<WebhookList>(cacheKey);
    if (cached) {
      logger.debug('Repository webhooks cache hit', { projectKey, repositorySlug });
      return cached;
    }

    try {
      const params = new URLSearchParams();
      if (options.start !== undefined) params.append('start', options.start.toString());
      if (options.limit !== undefined) params.append('limit', options.limit.toString());

      const endpoint = this.serverInfo.serverType === 'cloud'
        ? `/2.0/repositories/${projectKey}/${repositorySlug}/hooks`
        : `/rest/api/1.0/projects/${projectKey}/repos/${repositorySlug}/webhooks`;

      const response: AxiosResponse<WebhookList> = await axios.get(
        `${this.baseUrl}${endpoint}?${params.toString()}`,
        {
          headers: {
            'Accept': 'application/json',
            ...this.authHeaders,
          },
          timeout: 10000,
        }
      );

      const webhooks = WebhookListSchema.parse(response.data);
      
      // Cache the result
      await cache.set(cacheKey, webhooks, 300); // 5 minutes
      
      logger.info('Repository webhooks retrieved', {
        projectKey,
        repositorySlug,
        count: webhooks.values.length,
        serverType: this.serverInfo.serverType,
      });

      return webhooks;
    } catch (error) {
      logger.error('Failed to list repository webhooks', {
        projectKey,
        repositorySlug,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Lists webhooks for a project
   */
  async listProjectWebhooks(
    projectKey: string,
    options: {
      start?: number;
      limit?: number;
    } = {}
  ): Promise<WebhookList> {
    const cacheKey = `project-webhooks:${projectKey}:${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = await cache.get<WebhookList>(cacheKey);
    if (cached) {
      logger.debug('Project webhooks cache hit', { projectKey });
      return cached;
    }

    try {
      const params = new URLSearchParams();
      if (options.start !== undefined) params.append('start', options.start.toString());
      if (options.limit !== undefined) params.append('limit', options.limit.toString());

      const endpoint = this.serverInfo.serverType === 'cloud'
        ? `/2.0/workspaces/${projectKey}/hooks`
        : `/rest/api/1.0/projects/${projectKey}/webhooks`;

      const response: AxiosResponse<WebhookList> = await axios.get(
        `${this.baseUrl}${endpoint}?${params.toString()}`,
        {
          headers: {
            'Accept': 'application/json',
            ...this.authHeaders,
          },
          timeout: 10000,
        }
      );

      const webhooks = WebhookListSchema.parse(response.data);
      
      // Cache the result
      await cache.set(cacheKey, webhooks, 300); // 5 minutes
      
      logger.info('Project webhooks retrieved', {
        projectKey,
        count: webhooks.values.length,
        serverType: this.serverInfo.serverType,
      });

      return webhooks;
    } catch (error) {
      logger.error('Failed to list project webhooks', {
        projectKey,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Gets a specific webhook
   */
  async getWebhook(
    projectKey: string,
    repositorySlug: string | null,
    webhookId: string
  ): Promise<Webhook> {
    const cacheKey = `webhook:${projectKey}:${repositorySlug || 'project'}:${webhookId}`;
    
    // Check cache first
    const cached = await cache.get<Webhook>(cacheKey);
    if (cached) {
      logger.debug('Webhook cache hit', { projectKey, repositorySlug, webhookId });
      return cached;
    }

    try {
      const endpoint = repositorySlug
        ? (this.serverInfo.serverType === 'cloud'
            ? `/2.0/repositories/${projectKey}/${repositorySlug}/hooks/${webhookId}`
            : `/rest/api/1.0/projects/${projectKey}/repos/${repositorySlug}/webhooks/${webhookId}`)
        : (this.serverInfo.serverType === 'cloud'
            ? `/2.0/workspaces/${projectKey}/hooks/${webhookId}`
            : `/rest/api/1.0/projects/${projectKey}/webhooks/${webhookId}`);

      const response: AxiosResponse<Webhook> = await axios.get(
        `${this.baseUrl}${endpoint}`,
        {
          headers: {
            'Accept': 'application/json',
            ...this.authHeaders,
          },
          timeout: 10000,
        }
      );

      const webhook = WebhookSchema.parse(response.data);
      
      // Cache the result
      await cache.set(cacheKey, webhook, 300); // 5 minutes
      
      logger.info('Webhook retrieved', {
        projectKey,
        repositorySlug,
        webhookId,
        serverType: this.serverInfo.serverType,
      });

      return webhook;
    } catch (error) {
      logger.error('Failed to get webhook', {
        projectKey,
        repositorySlug,
        webhookId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Creates a new webhook
   */
  async createWebhook(
    projectKey: string,
    repositorySlug: string | null,
    webhookData: {
      name: string;
      url: string;
      events: string[];
      active?: boolean;
      configuration?: Record<string, any>;
    }
  ): Promise<Webhook> {
    try {
      const endpoint = repositorySlug
        ? (this.serverInfo.serverType === 'cloud'
            ? `/2.0/repositories/${projectKey}/${repositorySlug}/hooks`
            : `/rest/api/1.0/projects/${projectKey}/repos/${repositorySlug}/webhooks`)
        : (this.serverInfo.serverType === 'cloud'
            ? `/2.0/workspaces/${projectKey}/hooks`
            : `/rest/api/1.0/projects/${projectKey}/webhooks`);

      const payload = this.serverInfo.serverType === 'cloud'
        ? {
            description: webhookData.name,
            url: webhookData.url,
            events: webhookData.events,
            active: webhookData.active !== false,
            ...(webhookData.configuration && { configuration: webhookData.configuration }),
          }
        : {
            name: webhookData.name,
            url: webhookData.url,
            events: webhookData.events,
            active: webhookData.active !== false,
            ...(webhookData.configuration && { configuration: webhookData.configuration }),
          };

      const response: AxiosResponse<Webhook> = await axios.post(
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

      const webhook = WebhookSchema.parse(response.data);
      
      // Invalidate cache
      const cachePattern = repositorySlug
        ? `webhooks:${projectKey}:${repositorySlug}:*`
        : `project-webhooks:${projectKey}:*`;
      await cache.invalidatePattern(cachePattern);
      
      logger.info('Webhook created', {
        projectKey,
        repositorySlug,
        webhookId: webhook.id,
        serverType: this.serverInfo.serverType,
      });

      return webhook;
    } catch (error) {
      logger.error('Failed to create webhook', {
        projectKey,
        repositorySlug,
        webhookData,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Updates a webhook
   */
  async updateWebhook(
    projectKey: string,
    repositorySlug: string | null,
    webhookId: string,
    updates: {
      name?: string;
      url?: string;
      events?: string[];
      active?: boolean;
      configuration?: Record<string, any>;
    }
  ): Promise<Webhook> {
    try {
      const endpoint = repositorySlug
        ? (this.serverInfo.serverType === 'cloud'
            ? `/2.0/repositories/${projectKey}/${repositorySlug}/hooks/${webhookId}`
            : `/rest/api/1.0/projects/${projectKey}/repos/${repositorySlug}/webhooks/${webhookId}`)
        : (this.serverInfo.serverType === 'cloud'
            ? `/2.0/workspaces/${projectKey}/hooks/${webhookId}`
            : `/rest/api/1.0/projects/${projectKey}/webhooks/${webhookId}`);

      const payload = this.serverInfo.serverType === 'cloud'
        ? {
            ...(updates.name && { description: updates.name }),
            ...(updates.url && { url: updates.url }),
            ...(updates.events && { events: updates.events }),
            ...(updates.active !== undefined && { active: updates.active }),
            ...(updates.configuration && { configuration: updates.configuration }),
          }
        : {
            ...(updates.name && { name: updates.name }),
            ...(updates.url && { url: updates.url }),
            ...(updates.events && { events: updates.events }),
            ...(updates.active !== undefined && { active: updates.active }),
            ...(updates.configuration && { configuration: updates.configuration }),
          };

      const response: AxiosResponse<Webhook> = await axios.put(
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

      const webhook = WebhookSchema.parse(response.data);
      
      // Invalidate cache
      const cachePattern = repositorySlug
        ? `webhooks:${projectKey}:${repositorySlug}:*`
        : `project-webhooks:${projectKey}:*`;
      await cache.invalidatePattern(cachePattern);
      await cache.delete(`webhook:${projectKey}:${repositorySlug || 'project'}:${webhookId}`);
      
      logger.info('Webhook updated', {
        projectKey,
        repositorySlug,
        webhookId,
        serverType: this.serverInfo.serverType,
      });

      return webhook;
    } catch (error) {
      logger.error('Failed to update webhook', {
        projectKey,
        repositorySlug,
        webhookId,
        updates,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Deletes a webhook
   */
  async deleteWebhook(
    projectKey: string,
    repositorySlug: string | null,
    webhookId: string
  ): Promise<void> {
    try {
      const endpoint = repositorySlug
        ? (this.serverInfo.serverType === 'cloud'
            ? `/2.0/repositories/${projectKey}/${repositorySlug}/hooks/${webhookId}`
            : `/rest/api/1.0/projects/${projectKey}/repos/${repositorySlug}/webhooks/${webhookId}`)
        : (this.serverInfo.serverType === 'cloud'
            ? `/2.0/workspaces/${projectKey}/hooks/${webhookId}`
            : `/rest/api/1.0/projects/${projectKey}/webhooks/${webhookId}`);

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
      const cachePattern = repositorySlug
        ? `webhooks:${projectKey}:${repositorySlug}:*`
        : `project-webhooks:${projectKey}:*`;
      await cache.invalidatePattern(cachePattern);
      await cache.delete(`webhook:${projectKey}:${repositorySlug || 'project'}:${webhookId}`);
      
      logger.info('Webhook deleted', {
        projectKey,
        repositorySlug,
        webhookId,
        serverType: this.serverInfo.serverType,
      });
    } catch (error) {
      logger.error('Failed to delete webhook', {
        projectKey,
        repositorySlug,
        webhookId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Gets webhook statistics
   */
  async getWebhookStatistics(
    projectKey: string,
    repositorySlug: string | null,
    webhookId: string
  ): Promise<WebhookStatistics> {
    const cacheKey = `webhook-stats:${projectKey}:${repositorySlug || 'project'}:${webhookId}`;
    
    // Check cache first
    const cached = await cache.get<WebhookStatistics>(cacheKey);
    if (cached) {
      logger.debug('Webhook statistics cache hit', { projectKey, repositorySlug, webhookId });
      return cached;
    }

    try {
      const endpoint = repositorySlug
        ? (this.serverInfo.serverType === 'cloud'
            ? `/2.0/repositories/${projectKey}/${repositorySlug}/hooks/${webhookId}/statistics`
            : `/rest/api/1.0/projects/${projectKey}/repos/${repositorySlug}/webhooks/${webhookId}/statistics`)
        : (this.serverInfo.serverType === 'cloud'
            ? `/2.0/workspaces/${projectKey}/hooks/${webhookId}/statistics`
            : `/rest/api/1.0/projects/${projectKey}/webhooks/${webhookId}/statistics`);

      const response: AxiosResponse<WebhookStatistics> = await axios.get(
        `${this.baseUrl}${endpoint}`,
        {
          headers: {
            'Accept': 'application/json',
            ...this.authHeaders,
          },
          timeout: 10000,
        }
      );

      const statistics = WebhookStatisticsSchema.parse(response.data);
      
      // Cache the result
      await cache.set(cacheKey, statistics, 60); // 1 minute (statistics change frequently)
      
      logger.info('Webhook statistics retrieved', {
        projectKey,
        repositorySlug,
        webhookId,
        serverType: this.serverInfo.serverType,
      });

      return statistics;
    } catch (error) {
      logger.error('Failed to get webhook statistics', {
        projectKey,
        repositorySlug,
        webhookId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Gets available webhook events
   */
  async getAvailableWebhookEvents(): Promise<WebhookEvent[]> {
    const cacheKey = 'webhook-events:available';
    
    // Check cache first
    const cached = await cache.get<WebhookEvent[]>(cacheKey);
    if (cached) {
      logger.debug('Available webhook events cache hit');
      return cached;
    }

    try {
      const endpoint = this.serverInfo.serverType === 'cloud'
        ? `/2.0/hooks/events`
        : `/rest/api/1.0/webhooks/events`;

      const response: AxiosResponse<{ values: WebhookEvent[] }> = await axios.get(
        `${this.baseUrl}${endpoint}`,
        {
          headers: {
            'Accept': 'application/json',
            ...this.authHeaders,
          },
          timeout: 10000,
        }
      );

      const events = response.data.values.map(event => 
        WebhookEventSchema.parse(event)
      );
      
      // Cache the result
      await cache.set(cacheKey, events, 3600); // 1 hour (events don't change often)
      
      logger.info('Available webhook events retrieved', {
        count: events.length,
        serverType: this.serverInfo.serverType,
      });

      return events;
    } catch (error) {
      logger.error('Failed to get available webhook events', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Tests a webhook
   */
  async testWebhook(
    projectKey: string,
    repositorySlug: string | null,
    webhookId: string
  ): Promise<{ success: boolean; message: string; responseTime?: number }> {
    try {
      const endpoint = repositorySlug
        ? (this.serverInfo.serverType === 'cloud'
            ? `/2.0/repositories/${projectKey}/${repositorySlug}/hooks/${webhookId}/test`
            : `/rest/api/1.0/projects/${projectKey}/repos/${repositorySlug}/webhooks/${webhookId}/test`)
        : (this.serverInfo.serverType === 'cloud'
            ? `/2.0/workspaces/${projectKey}/hooks/${webhookId}/test`
            : `/rest/api/1.0/projects/${projectKey}/webhooks/${webhookId}/test`);

      const startTime = Date.now();
      const response: AxiosResponse<{ success: boolean; message: string }> = await axios.post(
        `${this.baseUrl}${endpoint}`,
        {},
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...this.authHeaders,
          },
          timeout: 30000, // Longer timeout for webhook tests
        }
      );
      const responseTime = Date.now() - startTime;

      const result = {
        success: response.data.success,
        message: response.data.message,
        responseTime,
      };
      
      logger.info('Webhook test completed', {
        projectKey,
        repositorySlug,
        webhookId,
        success: result.success,
        responseTime,
        serverType: this.serverInfo.serverType,
      });

      return result;
    } catch (error) {
      logger.error('Failed to test webhook', {
        projectKey,
        repositorySlug,
        webhookId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

// Export singleton instance
export const webhookService = new WebhookService(
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
