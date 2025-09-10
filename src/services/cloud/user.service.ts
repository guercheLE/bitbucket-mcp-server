/**
 * User Service for Bitbucket Cloud REST API
 * Handles all user-related operations
 * Based on: https://developer.atlassian.com/cloud/bitbucket/rest/api-group-users/
 */

import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';
import { PagedResponse, PaginationParams, ErrorResponse } from './types/base.types.js';
import {
  User,
  UserEmail,
  GetCurrentUserParams,
  GetUserParams,
  GetUserEmailParams,
  ListUserEmailsParams,
} from './types/user.types.js';

export class UserService {
  private apiClient: ApiClient;
  private logger: Logger;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.logger = Logger.forContext('UserService');
  }

  /**
   * Get current user
   * Returns the currently logged in user
   */
  async getCurrentUser(params?: GetCurrentUserParams): Promise<User> {
    this.logger.info('Getting current user');

    try {
      const response = await this.apiClient.get<User>('/user');

      this.logger.info('Successfully retrieved current user', {
        user_uuid: response.data.uuid,
        display_name: response.data.display_name,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get current user', { error });
      throw error;
    }
  }

  /**
   * List email addresses for current user
   * Returns all the authenticated user's email addresses. Both confirmed and unconfirmed.
   */
  async listUserEmails(params?: ListUserEmailsParams): Promise<PagedResponse<UserEmail>> {
    this.logger.info('Listing user emails', { params });

    try {
      const queryParams: Record<string, any> = {};

      if (params?.page) queryParams.page = params.page;
      if (params?.pagelen) queryParams.pagelen = params.pagelen;

      const response = await this.apiClient.get<PagedResponse<UserEmail>>('/user/emails', {
        params: queryParams,
      });

      this.logger.info('Successfully listed user emails', {
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list user emails', { params, error });
      throw error;
    }
  }

  /**
   * Get an email address for current user
   * Returns details about a specific one of the authenticated user's email addresses.
   * Details describe whether the address has been confirmed by the user and whether it is the user's primary address or not.
   */
  async getUserEmail(params: GetUserEmailParams): Promise<UserEmail> {
    this.logger.info('Getting user email', { params });

    try {
      const response = await this.apiClient.get<UserEmail>(
        `/user/emails/${encodeURIComponent(params.email)}`
      );

      this.logger.info('Successfully retrieved user email', {
        email: params.email,
        is_primary: response.data.is_primary,
        is_confirmed: response.data.is_confirmed,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get user email', { params, error });
      throw error;
    }
  }

  /**
   * Get a user
   * Gets the public information associated with a user account.
   * If the user's profile is private, location, website and created_on elements are omitted.
   */
  async getUser(params: GetUserParams): Promise<User> {
    this.logger.info('Getting user', { params });

    try {
      const response = await this.apiClient.get<User>(
        `/users/${encodeURIComponent(params.selected_user)}`
      );

      this.logger.info('Successfully retrieved user', {
        selected_user: params.selected_user,
        user_uuid: response.data.uuid,
        display_name: response.data.display_name,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get user', { params, error });
      throw error;
    }
  }
}
