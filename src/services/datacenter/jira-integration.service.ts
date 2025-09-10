/**
 * Jira Integration Service for Bitbucket Data Center REST API
 * Based on official documentation: https://developer.atlassian.com/server/bitbucket/rest/v906/intro/
 */

import {
  JiraIntegrationSettings,
  JiraIntegrationRequest,
  JiraIssue,
  JiraProject,
  JiraIssueLink,
  JiraIssueLinkRequest,
  JiraIssueLinkListResponse,
  JiraIntegrationQueryParams,
} from './types/jira-integration.types.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';

export class JiraIntegrationService {
  private readonly apiClient: ApiClient;
  private readonly logger: Logger;

  constructor(apiClient: ApiClient, logger: Logger) {
    this.apiClient = apiClient;
    this.logger = logger;
  }

  /**
   * Get Jira integration settings
   * GET /rest/api/1.0/admin/jira-integration
   */
  async getJiraIntegrationSettings(): Promise<JiraIntegrationSettings> {
    this.logger.info('Getting Jira integration settings');

    try {
      const response = await this.apiClient.get<JiraIntegrationSettings>('/admin/jira-integration');
      this.logger.info('Successfully retrieved Jira integration settings');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get Jira integration settings', { error });
      throw error;
    }
  }

  /**
   * Update Jira integration settings
   * PUT /rest/api/1.0/admin/jira-integration
   */
  async updateJiraIntegrationSettings(
    request: JiraIntegrationRequest
  ): Promise<JiraIntegrationSettings> {
    this.logger.info('Updating Jira integration settings', { request });

    try {
      const response = await this.apiClient.put<JiraIntegrationSettings>(
        '/admin/jira-integration',
        request
      );
      this.logger.info('Successfully updated Jira integration settings');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update Jira integration settings', { request, error });
      throw error;
    }
  }

  /**
   * Test Jira integration connection
   * POST /rest/api/1.0/admin/jira-integration/test
   */
  async testJiraIntegrationConnection(
    request: JiraIntegrationRequest
  ): Promise<{ success: boolean; message: string }> {
    this.logger.info('Testing Jira integration connection', { request });

    try {
      const response = await this.apiClient.post<{ success: boolean; message: string }>(
        '/admin/jira-integration/test',
        request
      );
      this.logger.info('Successfully tested Jira integration connection', {
        success: response.data.success,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to test Jira integration connection', { request, error });
      throw error;
    }
  }

  /**
   * Get Jira issue by key
   * GET /rest/api/1.0/jira/issues/{issueKey}
   */
  async getJiraIssue(issueKey: string): Promise<JiraIssue> {
    this.logger.info('Getting Jira issue', { issueKey });

    try {
      const response = await this.apiClient.get<JiraIssue>(`/jira/issues/${issueKey}`);
      this.logger.info('Successfully retrieved Jira issue', { issueKey, id: response.data.id });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get Jira issue', { issueKey, error });
      throw error;
    }
  }

  /**
   * Get Jira project by key
   * GET /rest/api/1.0/jira/projects/{projectKey}
   */
  async getJiraProject(projectKey: string): Promise<JiraProject> {
    this.logger.info('Getting Jira project', { projectKey });

    try {
      const response = await this.apiClient.get<JiraProject>(`/jira/projects/${projectKey}`);
      this.logger.info('Successfully retrieved Jira project', {
        projectKey,
        name: response.data.name,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get Jira project', { projectKey, error });
      throw error;
    }
  }

  /**
   * List Jira issue links
   * GET /rest/api/1.0/jira/issue-links
   */
  async listJiraIssueLinks(
    params?: JiraIntegrationQueryParams
  ): Promise<JiraIssueLinkListResponse> {
    this.logger.info('Listing Jira issue links', { params });

    try {
      const response = await this.apiClient.get<JiraIssueLinkListResponse>('/jira/issue-links', {
        params,
      });
      this.logger.info('Successfully listed Jira issue links', {
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list Jira issue links', { params, error });
      throw error;
    }
  }

  /**
   * Create Jira issue link
   * POST /rest/api/1.0/jira/issue-links
   */
  async createJiraIssueLink(request: JiraIssueLinkRequest): Promise<JiraIssueLink> {
    this.logger.info('Creating Jira issue link', { request });

    try {
      const response = await this.apiClient.post<JiraIssueLink>('/jira/issue-links', request);
      this.logger.info('Successfully created Jira issue link', { id: response.data.id });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create Jira issue link', { request, error });
      throw error;
    }
  }

  /**
   * Get Jira issue link by ID
   * GET /rest/api/1.0/jira/issue-links/{linkId}
   */
  async getJiraIssueLink(linkId: string): Promise<JiraIssueLink> {
    this.logger.info('Getting Jira issue link', { linkId });

    try {
      const response = await this.apiClient.get<JiraIssueLink>(`/jira/issue-links/${linkId}`);
      this.logger.info('Successfully retrieved Jira issue link', { linkId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get Jira issue link', { linkId, error });
      throw error;
    }
  }

  /**
   * Delete Jira issue link
   * DELETE /rest/api/1.0/jira/issue-links/{linkId}
   */
  async deleteJiraIssueLink(linkId: string): Promise<void> {
    this.logger.info('Deleting Jira issue link', { linkId });

    try {
      await this.apiClient.delete(`/jira/issue-links/${linkId}`);
      this.logger.info('Successfully deleted Jira issue link', { linkId });
    } catch (error) {
      this.logger.error('Failed to delete Jira issue link', { linkId, error });
      throw error;
    }
  }

  /**
   * Get Jira issue links for repository
   * GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/jira/issue-links
   */
  async getJiraIssueLinksForRepository(
    projectKey: string,
    repositorySlug: string,
    params?: JiraIntegrationQueryParams
  ): Promise<JiraIssueLinkListResponse> {
    this.logger.info('Getting Jira issue links for repository', {
      projectKey,
      repositorySlug,
      params,
    });

    try {
      const response = await this.apiClient.get<JiraIssueLinkListResponse>(
        `/projects/${projectKey}/repos/${repositorySlug}/jira/issue-links`,
        { params }
      );
      this.logger.info('Successfully retrieved Jira issue links for repository', {
        projectKey,
        repositorySlug,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get Jira issue links for repository', {
        projectKey,
        repositorySlug,
        params,
        error,
      });
      throw error;
    }
  }

  /**
   * Get Jira issue links for commit
   * GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/jira/issue-links
   */
  async getJiraIssueLinksForCommit(
    projectKey: string,
    repositorySlug: string,
    commitId: string,
    params?: JiraIntegrationQueryParams
  ): Promise<JiraIssueLinkListResponse> {
    this.logger.info('Getting Jira issue links for commit', {
      projectKey,
      repositorySlug,
      commitId,
      params,
    });

    try {
      const response = await this.apiClient.get<JiraIssueLinkListResponse>(
        `/projects/${projectKey}/repos/${repositorySlug}/commits/${commitId}/jira/issue-links`,
        { params }
      );
      this.logger.info('Successfully retrieved Jira issue links for commit', {
        projectKey,
        repositorySlug,
        commitId,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get Jira issue links for commit', {
        projectKey,
        repositorySlug,
        commitId,
        params,
        error,
      });
      throw error;
    }
  }

  /**
   * Get Jira issue links for pull request
   * GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/jira/issue-links
   */
  async getJiraIssueLinksForPullRequest(
    projectKey: string,
    repositorySlug: string,
    pullRequestId: number,
    params?: JiraIntegrationQueryParams
  ): Promise<JiraIssueLinkListResponse> {
    this.logger.info('Getting Jira issue links for pull request', {
      projectKey,
      repositorySlug,
      pullRequestId,
      params,
    });

    try {
      const response = await this.apiClient.get<JiraIssueLinkListResponse>(
        `/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${pullRequestId}/jira/issue-links`,
        { params }
      );
      this.logger.info('Successfully retrieved Jira issue links for pull request', {
        projectKey,
        repositorySlug,
        pullRequestId,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get Jira issue links for pull request', {
        projectKey,
        repositorySlug,
        pullRequestId,
        params,
        error,
      });
      throw error;
    }
  }
}
