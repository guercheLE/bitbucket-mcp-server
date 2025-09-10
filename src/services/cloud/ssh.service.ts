/**
 * SSH Service for Bitbucket Cloud REST API
 * Handles all SSH key-related operations
 * Based on: https://developer.atlassian.com/cloud/bitbucket/rest/api-group-ssh/
 */

import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';
import { PagedResponse, PaginationParams, ErrorResponse } from './types/base.types.js';
import {
  SSHKey,
  CreateSSHKeyRequest,
  UpdateSSHKeyRequest,
  ListSSHKeysParams,
  CreateSSHKeyParams,
  GetSSHKeyParams,
  UpdateSSHKeyParams,
  DeleteSSHKeyParams,
} from './types/ssh.types.js';

export class SSHService {
  private apiClient: ApiClient;
  private logger: Logger;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.logger = Logger.forContext('SSHService');
  }

  /**
   * List SSH keys
   * Returns a paginated list of the user's SSH public keys.
   */
  async listSSHKeys(params: ListSSHKeysParams): Promise<PagedResponse<SSHKey>> {
    this.logger.info('Listing SSH keys', { params });

    try {
      const queryParams: Record<string, any> = {
        page: params.page,
        pagelen: params.pagelen,
      };

      const response = await this.apiClient.get<PagedResponse<SSHKey>>(
        `/users/${params.selected_user}/ssh-keys`,
        { params: queryParams }
      );

      this.logger.info('Successfully listed SSH keys', {
        selected_user: params.selected_user,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list SSH keys', { params, error });
      throw error;
    }
  }

  /**
   * Add a new SSH key
   * Adds a new SSH public key to the specified user account and returns the resulting key.
   */
  async createSSHKey(params: CreateSSHKeyParams): Promise<SSHKey> {
    this.logger.info('Creating SSH key', { params });

    try {
      const queryParams: Record<string, any> = {};
      if (params.expires_on) queryParams.expires_on = params.expires_on;

      const response = await this.apiClient.post<SSHKey>(
        `/users/${params.selected_user}/ssh-keys`,
        params.ssh_key,
        { params: queryParams }
      );

      this.logger.info('Successfully created SSH key', {
        selected_user: params.selected_user,
        key_uuid: response.data.uuid,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create SSH key', { params, error });
      throw error;
    }
  }

  /**
   * Get a SSH key
   * Returns a specific SSH public key belonging to a user.
   */
  async getSSHKey(params: GetSSHKeyParams): Promise<SSHKey> {
    this.logger.info('Getting SSH key', { params });

    try {
      const response = await this.apiClient.get<SSHKey>(
        `/users/${params.selected_user}/ssh-keys/${params.key_id}`
      );

      this.logger.info('Successfully retrieved SSH key', {
        selected_user: params.selected_user,
        key_id: params.key_id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get SSH key', { params, error });
      throw error;
    }
  }

  /**
   * Update a SSH key
   * Updates a specific SSH public key on a user's account.
   * Note: Only the 'label' field can be updated using this API.
   */
  async updateSSHKey(params: UpdateSSHKeyParams): Promise<SSHKey> {
    this.logger.info('Updating SSH key', { params });

    try {
      const response = await this.apiClient.put<SSHKey>(
        `/users/${params.selected_user}/ssh-keys/${params.key_id}`,
        params.ssh_key
      );

      this.logger.info('Successfully updated SSH key', {
        selected_user: params.selected_user,
        key_id: params.key_id,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update SSH key', { params, error });
      throw error;
    }
  }

  /**
   * Delete a SSH key
   * Deletes a specific SSH public key from a user's account.
   */
  async deleteSSHKey(params: DeleteSSHKeyParams): Promise<void> {
    this.logger.info('Deleting SSH key', { params });

    try {
      await this.apiClient.delete(`/users/${params.selected_user}/ssh-keys/${params.key_id}`);

      this.logger.info('Successfully deleted SSH key', {
        selected_user: params.selected_user,
        key_id: params.key_id,
      });
    } catch (error) {
      this.logger.error('Failed to delete SSH key', { params, error });
      throw error;
    }
  }
}
