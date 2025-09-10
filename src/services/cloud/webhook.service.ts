/**
 * Webhook Service for Bitbucket Cloud REST API
 * Handles all webhook-related operations
 * Based on: https://developer.atlassian.com/cloud/bitbucket/rest/api-group-webhooks/
 */

import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';
import { PagedResponse, PaginationParams, ErrorResponse } from './types/base.types.js';
import {
  WebhookResource,
  WebhookEvent,
  SubjectTypes,
  GetWebhookResourceParams,
  ListWebhookTypesParams,
} from './types/webhook.types.js';

export class WebhookService {
  private apiClient: ApiClient;
  private logger: Logger;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.logger = Logger.forContext('WebhookService');
  }

  /**
   * Get a webhook resource
   * Returns the webhook resource or subject types on which webhooks can be registered.
   * Each resource/subject type contains an events link that returns the paginated list of specific events each individual subject type can emit.
   * This endpoint is publicly accessible and does not require authentication or scopes.
   */
  async getWebhookResource(params?: GetWebhookResourceParams): Promise<SubjectTypes> {
    this.logger.info('Getting webhook resource');

    try {
      const response = await this.apiClient.get<SubjectTypes>('/hook_events');

      this.logger.info('Successfully retrieved webhook resource', {
        available_subjects: Object.keys(response),
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get webhook resource', { error });
      throw error;
    }
  }

  /**
   * List subscribable webhook types
   * Returns a paginated list of all valid webhook events for the specified entity.
   * The team and user webhooks are deprecated, and you should use workspace instead.
   * This is public data that does not require any scopes or authentication.
   */
  async listWebhookTypes(params: ListWebhookTypesParams): Promise<PagedResponse<WebhookEvent>> {
    this.logger.info('Listing webhook types', { params });

    try {
      const queryParams: Record<string, any> = {};

      if (params.page) queryParams.page = params.page;
      if (params.pagelen) queryParams.pagelen = params.pagelen;

      const response = await this.apiClient.get<PagedResponse<WebhookEvent>>(
        `/hook_events/${params.subject_type}`,
        { params: queryParams }
      );

      this.logger.info('Successfully listed webhook types', {
        subject_type: params.subject_type,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list webhook types', { params, error });
      throw error;
    }
  }
}
