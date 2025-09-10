/**
 * Webhook Types for Bitbucket Cloud REST API
 * Based on: https://developer.atlassian.com/cloud/bitbucket/rest/api-group-webhooks/
 */

import { PaginationParams } from './base.types.js';

// Webhook Types
export interface WebhookResource {
  type: string;
  links: {
    events: { href: string };
  };
}

export interface WebhookEvent {
  category: string;
  description: string;
  event: string;
  label: string;
}

export interface SubjectTypes {
  repository: WebhookResource;
  workspace: WebhookResource;
}

// Parameter Types
export interface GetWebhookResourceParams {
  // No parameters needed
}

export interface ListWebhookTypesParams extends PaginationParams {
  subject_type: 'repository' | 'workspace';
}
