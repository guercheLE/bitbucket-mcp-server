/**
 * SAML Configuration Service for Bitbucket Data Center REST API
 * Based on official documentation: https://developer.atlassian.com/server/bitbucket/rest/v906/intro/
 */

import {
  SamlConfiguration,
  SamlConfigurationRequest,
  SamlConfigurationUpdateRequest,
  SamlConfigurationListResponse,
  SamlCertificate,
  SamlCertificateRequest,
  SamlTestConfiguration,
  SamlTestResult,
  SamlMetadata,
  SamlUserMapping,
  SamlGroupMapping,
} from './types/saml-configuration.types.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';

export class SamlConfigurationService {
  private readonly apiClient: ApiClient;
  private readonly logger: Logger;

  constructor(apiClient: ApiClient, logger: Logger) {
    this.apiClient = apiClient;
    this.logger = logger;
  }

  /**
   * List SAML configurations
   * GET /rest/api/1.0/admin/saml/configurations
   */
  async listSamlConfigurations(): Promise<SamlConfigurationListResponse> {
    this.logger.info('Listing SAML configurations');

    try {
      const response = await this.apiClient.get<SamlConfigurationListResponse>(
        '/admin/saml/configurations'
      );
      this.logger.info('Successfully listed SAML configurations', {
        count: response.data.configurations.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list SAML configurations', { error });
      throw error;
    }
  }

  /**
   * Create SAML configuration
   * POST /rest/api/1.0/admin/saml/configurations
   */
  async createSamlConfiguration(request: SamlConfigurationRequest): Promise<SamlConfiguration> {
    this.logger.info('Creating SAML configuration', { request });

    try {
      const response = await this.apiClient.post<SamlConfiguration>(
        '/admin/saml/configurations',
        request
      );
      this.logger.info('Successfully created SAML configuration', { id: response.data.id });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create SAML configuration', { request, error });
      throw error;
    }
  }

  /**
   * Get SAML configuration by ID
   * GET /rest/api/1.0/admin/saml/configurations/{configurationId}
   */
  async getSamlConfiguration(configurationId: number): Promise<SamlConfiguration> {
    this.logger.info('Getting SAML configuration', { configurationId });

    try {
      const response = await this.apiClient.get<SamlConfiguration>(
        `/admin/saml/configurations/${configurationId}`
      );
      this.logger.info('Successfully retrieved SAML configuration', { configurationId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get SAML configuration', { configurationId, error });
      throw error;
    }
  }

  /**
   * Update SAML configuration
   * PUT /rest/api/1.0/admin/saml/configurations/{configurationId}
   */
  async updateSamlConfiguration(
    configurationId: number,
    request: SamlConfigurationUpdateRequest
  ): Promise<SamlConfiguration> {
    this.logger.info('Updating SAML configuration', { configurationId, request });

    try {
      const response = await this.apiClient.put<SamlConfiguration>(
        `/admin/saml/configurations/${configurationId}`,
        request
      );
      this.logger.info('Successfully updated SAML configuration', { configurationId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update SAML configuration', { configurationId, request, error });
      throw error;
    }
  }

  /**
   * Delete SAML configuration
   * DELETE /rest/api/1.0/admin/saml/configurations/{configurationId}
   */
  async deleteSamlConfiguration(configurationId: number): Promise<void> {
    this.logger.info('Deleting SAML configuration', { configurationId });

    try {
      await this.apiClient.delete(`/admin/saml/configurations/${configurationId}`);
      this.logger.info('Successfully deleted SAML configuration', { configurationId });
    } catch (error) {
      this.logger.error('Failed to delete SAML configuration', { configurationId, error });
      throw error;
    }
  }

  /**
   * Test SAML configuration
   * POST /rest/api/1.0/admin/saml/configurations/test
   */
  async testSamlConfiguration(request: SamlTestConfiguration): Promise<SamlTestResult> {
    this.logger.info('Testing SAML configuration', { request });

    try {
      const response = await this.apiClient.post<SamlTestResult>(
        '/admin/saml/configurations/test',
        request
      );
      this.logger.info('Successfully tested SAML configuration', {
        success: response.data.success,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to test SAML configuration', { request, error });
      throw error;
    }
  }

  /**
   * Get SAML metadata
   * GET /rest/api/1.0/admin/saml/metadata
   */
  async getSamlMetadata(): Promise<SamlMetadata> {
    this.logger.info('Getting SAML metadata');

    try {
      const response = await this.apiClient.get<SamlMetadata>('/admin/saml/metadata');
      this.logger.info('Successfully retrieved SAML metadata');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get SAML metadata', { error });
      throw error;
    }
  }

  /**
   * Upload SAML certificate
   * POST /rest/api/1.0/admin/saml/certificates
   */
  async uploadSamlCertificate(request: SamlCertificateRequest): Promise<SamlCertificate> {
    this.logger.info('Uploading SAML certificate');

    try {
      const response = await this.apiClient.post<SamlCertificate>(
        '/admin/saml/certificates',
        request
      );
      this.logger.info('Successfully uploaded SAML certificate', { id: response.data.id });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to upload SAML certificate', { error });
      throw error;
    }
  }

  /**
   * Get SAML certificate by ID
   * GET /rest/api/1.0/admin/saml/certificates/{certificateId}
   */
  async getSamlCertificate(certificateId: string): Promise<SamlCertificate> {
    this.logger.info('Getting SAML certificate', { certificateId });

    try {
      const response = await this.apiClient.get<SamlCertificate>(
        `/admin/saml/certificates/${certificateId}`
      );
      this.logger.info('Successfully retrieved SAML certificate', { certificateId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get SAML certificate', { certificateId, error });
      throw error;
    }
  }

  /**
   * Delete SAML certificate
   * DELETE /rest/api/1.0/admin/saml/certificates/{certificateId}
   */
  async deleteSamlCertificate(certificateId: string): Promise<void> {
    this.logger.info('Deleting SAML certificate', { certificateId });

    try {
      await this.apiClient.delete(`/admin/saml/certificates/${certificateId}`);
      this.logger.info('Successfully deleted SAML certificate', { certificateId });
    } catch (error) {
      this.logger.error('Failed to delete SAML certificate', { certificateId, error });
      throw error;
    }
  }

  /**
   * Get SAML user mappings
   * GET /rest/api/1.0/admin/saml/user-mappings
   */
  async getSamlUserMappings(): Promise<SamlUserMapping[]> {
    this.logger.info('Getting SAML user mappings');

    try {
      const response = await this.apiClient.get<{ mappings: SamlUserMapping[] }>(
        '/admin/saml/user-mappings'
      );
      this.logger.info('Successfully retrieved SAML user mappings', {
        count: response.data.mappings.length,
      });
      return response.data.mappings;
    } catch (error) {
      this.logger.error('Failed to get SAML user mappings', { error });
      throw error;
    }
  }

  /**
   * Get SAML user mapping by username
   * GET /rest/api/1.0/admin/saml/user-mappings/{username}
   */
  async getSamlUserMapping(username: string): Promise<SamlUserMapping> {
    this.logger.info('Getting SAML user mapping', { username });

    try {
      const response = await this.apiClient.get<SamlUserMapping>(
        `/admin/saml/user-mappings/${username}`
      );
      this.logger.info('Successfully retrieved SAML user mapping', { username });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get SAML user mapping', { username, error });
      throw error;
    }
  }

  /**
   * Get SAML group mappings
   * GET /rest/api/1.0/admin/saml/group-mappings
   */
  async getSamlGroupMappings(): Promise<SamlGroupMapping[]> {
    this.logger.info('Getting SAML group mappings');

    try {
      const response = await this.apiClient.get<{ mappings: SamlGroupMapping[] }>(
        '/admin/saml/group-mappings'
      );
      this.logger.info('Successfully retrieved SAML group mappings', {
        count: response.data.mappings.length,
      });
      return response.data.mappings;
    } catch (error) {
      this.logger.error('Failed to get SAML group mappings', { error });
      throw error;
    }
  }

  /**
   * Get SAML group mapping by SAML group
   * GET /rest/api/1.0/admin/saml/group-mappings/{samlGroup}
   */
  async getSamlGroupMapping(samlGroup: string): Promise<SamlGroupMapping> {
    this.logger.info('Getting SAML group mapping', { samlGroup });

    try {
      const response = await this.apiClient.get<SamlGroupMapping>(
        `/admin/saml/group-mappings/${samlGroup}`
      );
      this.logger.info('Successfully retrieved SAML group mapping', { samlGroup });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get SAML group mapping', { samlGroup, error });
      throw error;
    }
  }

  /**
   * Enable SAML configuration
   * POST /rest/api/1.0/admin/saml/configurations/{configurationId}/enable
   */
  async enableSamlConfiguration(configurationId: number): Promise<void> {
    this.logger.info('Enabling SAML configuration', { configurationId });

    try {
      await this.apiClient.post(`/admin/saml/configurations/${configurationId}/enable`);
      this.logger.info('Successfully enabled SAML configuration', { configurationId });
    } catch (error) {
      this.logger.error('Failed to enable SAML configuration', { configurationId, error });
      throw error;
    }
  }

  /**
   * Disable SAML configuration
   * POST /rest/api/1.0/admin/saml/configurations/{configurationId}/disable
   */
  async disableSamlConfiguration(configurationId: number): Promise<void> {
    this.logger.info('Disabling SAML configuration', { configurationId });

    try {
      await this.apiClient.post(`/admin/saml/configurations/${configurationId}/disable`);
      this.logger.info('Successfully disabled SAML configuration', { configurationId });
    } catch (error) {
      this.logger.error('Failed to disable SAML configuration', { configurationId, error });
      throw error;
    }
  }
}
