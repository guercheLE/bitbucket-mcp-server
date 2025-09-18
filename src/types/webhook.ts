import { z } from 'zod';

/**
 * Webhook entity model for Bitbucket Data Center and Cloud
 * T034: Webhook entity model in src/types/webhook.ts
 * 
 * Configuration for automatic notifications on events
 * Based on data-model.md specifications
 */

// Webhook event types enum
export enum WebhookEvent {
  REPO_PUSH = 'repo:push',
  PULLREQUEST_CREATED = 'pullrequest:created',
  PULLREQUEST_UPDATED = 'pullrequest:updated',
  PULLREQUEST_APPROVED = 'pullrequest:approved',
  PULLREQUEST_MERGED = 'pullrequest:merged',
  PULLREQUEST_DECLINED = 'pullrequest:declined'
}

// Webhook schema definition
export const WebhookSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
  description: z.string().max(500).optional(),
  events: z.array(z.enum([
    WebhookEvent.REPO_PUSH,
    WebhookEvent.PULLREQUEST_CREATED,
    WebhookEvent.PULLREQUEST_UPDATED,
    WebhookEvent.PULLREQUEST_APPROVED,
    WebhookEvent.PULLREQUEST_MERGED,
    WebhookEvent.PULLREQUEST_DECLINED
  ])).min(1),
  active: z.boolean().default(true),
  createdDate: z.string().datetime(),
  updatedDate: z.string().datetime()
});

// Webhook type definition
export type Webhook = z.infer<typeof WebhookSchema>;

// Webhook creation input schema
export const CreateWebhookSchema = z.object({
  url: z.string().url(),
  description: z.string().max(500).optional(),
  events: z.array(z.enum([
    WebhookEvent.REPO_PUSH,
    WebhookEvent.PULLREQUEST_CREATED,
    WebhookEvent.PULLREQUEST_UPDATED,
    WebhookEvent.PULLREQUEST_APPROVED,
    WebhookEvent.PULLREQUEST_MERGED,
    WebhookEvent.PULLREQUEST_DECLINED
  ])).min(1),
  active: z.boolean().default(true)
});

export type CreateWebhookInput = z.infer<typeof CreateWebhookSchema>;

// Webhook update input schema
export const UpdateWebhookSchema = z.object({
  url: z.string().url().optional(),
  description: z.string().max(500).optional(),
  events: z.array(z.enum([
    WebhookEvent.REPO_PUSH,
    WebhookEvent.PULLREQUEST_CREATED,
    WebhookEvent.PULLREQUEST_UPDATED,
    WebhookEvent.PULLREQUEST_APPROVED,
    WebhookEvent.PULLREQUEST_MERGED,
    WebhookEvent.PULLREQUEST_DECLINED
  ])).min(1).optional(),
  active: z.boolean().optional()
});

export type UpdateWebhookInput = z.infer<typeof UpdateWebhookSchema>;

// Webhook list response schema
export const WebhookListSchema = z.object({
  size: z.number(),
  limit: z.number(),
  isLastPage: z.boolean(),
  values: z.array(WebhookSchema),
  start: z.number()
});

export type WebhookList = z.infer<typeof WebhookListSchema>;

// Webhook state enum
export enum WebhookState {
  CREATED = 'created',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DELETED = 'deleted'
}

// Webhook business rules validation
export class WebhookValidator {
  /**
   * Validates webhook URL according to business rules
   */
  static validateUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'https:' || urlObj.protocol === 'http:';
    } catch {
      return false;
    }
  }

  /**
   * Validates webhook description according to business rules
   */
  static validateDescription(description?: string): boolean {
    if (!description) return true;
    return description.length <= 500;
  }

  /**
   * Validates webhook events according to business rules
   */
  static validateEvents(events: WebhookEvent[]): boolean {
    return events.length > 0 && events.every(event => 
      Object.values(WebhookEvent).includes(event)
    );
  }

  /**
   * Validates complete webhook data
   */
  static validate(webhook: CreateWebhookInput): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.validateUrl(webhook.url)) {
      errors.push('Webhook URL must be a valid HTTP/HTTPS URL');
    }

    if (!this.validateDescription(webhook.description)) {
      errors.push('Webhook description must be maximum 500 characters');
    }

    if (!this.validateEvents(webhook.events)) {
      errors.push('Webhook events must be a non-empty array of valid event types');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Webhook factory for creating instances
export class WebhookFactory {
  /**
   * Creates a new webhook instance with default values
   */
  static create(input: CreateWebhookInput): Webhook {
    const now = new Date().toISOString();
    
    return {
      id: crypto.randomUUID(),
      url: input.url,
      description: input.description,
      events: input.events,
      active: input.active ?? true,
      createdDate: now,
      updatedDate: now
    };
  }

  /**
   * Updates an existing webhook instance
   */
  static update(webhook: Webhook, input: UpdateWebhookInput): Webhook {
    return {
      ...webhook,
      url: input.url ?? webhook.url,
      description: input.description ?? webhook.description,
      events: input.events ?? webhook.events,
      active: input.active ?? webhook.active,
      updatedDate: new Date().toISOString()
    };
  }
}

// Webhook state transitions
export class WebhookStateManager {
  /**
   * Transitions webhook to active state
   */
  static activate(webhook: Webhook): Webhook {
    return {
      ...webhook,
      active: true,
      updatedDate: new Date().toISOString()
    };
  }

  /**
   * Transitions webhook to inactive state
   */
  static deactivate(webhook: Webhook): Webhook {
    return {
      ...webhook,
      active: false,
      updatedDate: new Date().toISOString()
    };
  }

  /**
   * Transitions webhook to deleted state
   */
  static delete(webhook: Webhook): Webhook {
    return {
      ...webhook,
      updatedDate: new Date().toISOString()
    };
  }
}

// Webhook event utilities
export class WebhookEventManager {
  /**
   * Gets all available webhook events
   */
  static getAllEvents(): WebhookEvent[] {
    return Object.values(WebhookEvent);
  }

  /**
   * Gets repository-related events
   */
  static getRepositoryEvents(): WebhookEvent[] {
    return [WebhookEvent.REPO_PUSH];
  }

  /**
   * Gets pull request-related events
   */
  static getPullRequestEvents(): WebhookEvent[] {
    return [
      WebhookEvent.PULLREQUEST_CREATED,
      WebhookEvent.PULLREQUEST_UPDATED,
      WebhookEvent.PULLREQUEST_APPROVED,
      WebhookEvent.PULLREQUEST_MERGED,
      WebhookEvent.PULLREQUEST_DECLINED
    ];
  }

  /**
   * Validates if events are compatible with each other
   */
  static areEventsCompatible(events: WebhookEvent[]): boolean {
    // All events are compatible with each other
    return events.length > 0;
  }

  /**
   * Gets event description
   */
  static getEventDescription(event: WebhookEvent): string {
    const descriptions = {
      [WebhookEvent.REPO_PUSH]: 'Triggered when code is pushed to repository',
      [WebhookEvent.PULLREQUEST_CREATED]: 'Triggered when a pull request is created',
      [WebhookEvent.PULLREQUEST_UPDATED]: 'Triggered when a pull request is updated',
      [WebhookEvent.PULLREQUEST_APPROVED]: 'Triggered when a pull request is approved',
      [WebhookEvent.PULLREQUEST_MERGED]: 'Triggered when a pull request is merged',
      [WebhookEvent.PULLREQUEST_DECLINED]: 'Triggered when a pull request is declined'
    };

    return descriptions[event];
  }
}

// Webhook retry policy
export class WebhookRetryPolicy {
  static readonly MAX_RETRIES = 3;
  static readonly INITIAL_DELAY = 1000; // 1 second
  static readonly MAX_DELAY = 30000; // 30 seconds
  static readonly BACKOFF_FACTOR = 2;

  /**
   * Calculates retry delay based on attempt number
   */
  static calculateDelay(attempt: number): number {
    const delay = this.INITIAL_DELAY * Math.pow(this.BACKOFF_FACTOR, attempt - 1);
    return Math.min(delay, this.MAX_DELAY);
  }

  /**
   * Checks if retry should be attempted
   */
  static shouldRetry(attempt: number, error: Error): boolean {
    if (attempt >= this.MAX_RETRIES) return false;
    
    // Retry on network errors, timeouts, and 5xx status codes
    return error.message.includes('timeout') ||
           error.message.includes('network') ||
           error.message.includes('5');
  }
}

// Export all schemas and types
// Default export
export default WebhookSchema;
