/**
 * Repository Service for Bitbucket Cloud REST API
 * Based on official documentation: https://developer.atlassian.com/cloud/bitbucket/rest/api-group-repositories/
 */

import {
  CreateRepositoryRequest,
  CreateRepositoryWebhookRequest,
  CreateRepositoryVariableRequest,
  CreateTagRequest,
  ForkRepositoryRequest,
  ListRepositoryBranchesParams,
  ListRepositoryBranchesResponse,
  ListRepositoryCommitsParams,
  ListRepositoryCommitsResponse,
  ListRepositoryForksParams,
  ListRepositoryForksResponse,
  ListRepositoryTagsParams,
  ListRepositoryTagsResponse,
  ListRepositoryVariablesResponse,
  ListRepositoryWebhooksResponse,
  ListRepositoriesParams,
  ListRepositoriesResponse,
  Repository,
  RepositoryBranch,
  RepositoryCommit,
  RepositoryFork,
  RepositoryTag,
  RepositoryVariable,
  RepositoryWebhook,
  UpdateRepositoryRequest,
  UpdateRepositoryVariableRequest,
  UpdateRepositoryWebhookRequest,
} from './types/repository.types.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';

export class RepositoryService {
  private readonly apiClient: ApiClient;
  private readonly logger: Logger;

  constructor(apiClient: ApiClient, logger: Logger) {
    this.apiClient = apiClient;
    this.logger = logger;
  }

  /**
   * Get Repository
   * GET /2.0/repositories/{workspace}/{repo_slug}
   */
  async getRepository(workspace: string, repoSlug: string): Promise<Repository> {
    this.logger.info('Getting repository', { workspace, repoSlug });

    try {
      const response = await this.apiClient.get<Repository>(
        `/repositories/${workspace}/${repoSlug}`
      );
      this.logger.info('Successfully retrieved repository', { workspace, repoSlug });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get repository', { workspace, repoSlug, error });
      throw error;
    }
  }

  /**
   * List Repositories
   * GET /2.0/repositories
   */
  async listRepositories(params?: ListRepositoriesParams): Promise<ListRepositoriesResponse> {
    this.logger.info('Listing repositories');

    try {
      const response = await this.apiClient.get<ListRepositoriesResponse>('/repositories', {
        params,
      });
      this.logger.info('Successfully listed repositories', { count: response.data.values.length });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list repositories', { error });
      throw error;
    }
  }

  /**
   * List Workspace Repositories
   * GET /2.0/repositories/{workspace}
   */
  async listWorkspaceRepositories(
    workspace: string,
    params?: ListRepositoriesParams
  ): Promise<ListRepositoriesResponse> {
    this.logger.info('Listing workspace repositories', { workspace });

    try {
      const response = await this.apiClient.get<ListRepositoriesResponse>(
        `/repositories/${workspace}`,
        { params }
      );
      this.logger.info('Successfully listed workspace repositories', {
        workspace,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list workspace repositories', { workspace, error });
      throw error;
    }
  }

  /**
   * Create Repository
   * POST /2.0/repositories/{workspace}
   */
  async createRepository(workspace: string, request: CreateRepositoryRequest): Promise<Repository> {
    this.logger.info('Creating repository', { workspace, name: request.name });

    try {
      const response = await this.apiClient.post<Repository>(`/repositories/${workspace}`, request);
      this.logger.info('Successfully created repository', { workspace, name: request.name });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create repository', { workspace, request, error });
      throw error;
    }
  }

  /**
   * Update Repository
   * PUT /2.0/repositories/{workspace}/{repo_slug}
   */
  async updateRepository(
    workspace: string,
    repoSlug: string,
    request: UpdateRepositoryRequest
  ): Promise<Repository> {
    this.logger.info('Updating repository', { workspace, repoSlug });

    try {
      const response = await this.apiClient.put<Repository>(
        `/repositories/${workspace}/${repoSlug}`,
        request
      );
      this.logger.info('Successfully updated repository', { workspace, repoSlug });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update repository', { workspace, repoSlug, request, error });
      throw error;
    }
  }

  /**
   * Delete Repository
   * DELETE /2.0/repositories/{workspace}/{repo_slug}
   */
  async deleteRepository(workspace: string, repoSlug: string): Promise<void> {
    this.logger.info('Deleting repository', { workspace, repoSlug });

    try {
      await this.apiClient.delete(`/repositories/${workspace}/${repoSlug}`);
      this.logger.info('Successfully deleted repository', { workspace, repoSlug });
    } catch (error) {
      this.logger.error('Failed to delete repository', { workspace, repoSlug, error });
      throw error;
    }
  }

  /**
   * Fork Repository
   * POST /2.0/repositories/{workspace}/{repo_slug}/forks
   */
  async forkRepository(
    workspace: string,
    repoSlug: string,
    request: ForkRepositoryRequest
  ): Promise<RepositoryFork> {
    this.logger.info('Forking repository', { workspace, repoSlug });

    try {
      const response = await this.apiClient.post<RepositoryFork>(
        `/repositories/${workspace}/${repoSlug}/forks`,
        request
      );
      this.logger.info('Successfully forked repository', { workspace, repoSlug });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fork repository', { workspace, repoSlug, request, error });
      throw error;
    }
  }

  /**
   * List Repository Forks
   * GET /2.0/repositories/{workspace}/{repo_slug}/forks
   */
  async listRepositoryForks(
    workspace: string,
    repoSlug: string,
    params?: ListRepositoryForksParams
  ): Promise<ListRepositoryForksResponse> {
    this.logger.info('Listing repository forks', { workspace, repoSlug });

    try {
      const response = await this.apiClient.get<ListRepositoryForksResponse>(
        `/repositories/${workspace}/${repoSlug}/forks`,
        { params }
      );
      this.logger.info('Successfully listed repository forks', {
        workspace,
        repoSlug,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list repository forks', { workspace, repoSlug, error });
      throw error;
    }
  }

  /**
   * List Repository Branches
   * GET /2.0/repositories/{workspace}/{repo_slug}/refs/branches
   */
  async listRepositoryBranches(
    workspace: string,
    repoSlug: string,
    params?: ListRepositoryBranchesParams
  ): Promise<ListRepositoryBranchesResponse> {
    this.logger.info('Listing repository branches', { workspace, repoSlug });

    try {
      const response = await this.apiClient.get<ListRepositoryBranchesResponse>(
        `/repositories/${workspace}/${repoSlug}/refs/branches`,
        { params }
      );
      this.logger.info('Successfully listed repository branches', {
        workspace,
        repoSlug,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list repository branches', { workspace, repoSlug, error });
      throw error;
    }
  }

  /**
   * Get Repository Branch
   * GET /2.0/repositories/{workspace}/{repo_slug}/refs/branches/{name}
   */
  async getRepositoryBranch(
    workspace: string,
    repoSlug: string,
    branchName: string
  ): Promise<RepositoryBranch> {
    this.logger.info('Getting repository branch', { workspace, repoSlug, branchName });

    try {
      const response = await this.apiClient.get<RepositoryBranch>(
        `/repositories/${workspace}/${repoSlug}/refs/branches/${branchName}`
      );
      this.logger.info('Successfully retrieved repository branch', {
        workspace,
        repoSlug,
        branchName,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get repository branch', {
        workspace,
        repoSlug,
        branchName,
        error,
      });
      throw error;
    }
  }

  /**
   * Create Repository Branch
   * POST /2.0/repositories/{workspace}/{repo_slug}/refs/branches
   */
  async createRepositoryBranch(
    workspace: string,
    repoSlug: string,
    request: any // CreateBranchRequest
  ): Promise<RepositoryBranch> {
    this.logger.info('Creating repository branch', { workspace, repoSlug });

    try {
      const response = await this.apiClient.post<RepositoryBranch>(
        `/repositories/${workspace}/${repoSlug}/refs/branches`,
        request
      );
      this.logger.info('Successfully created repository branch', { workspace, repoSlug });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create repository branch', {
        workspace,
        repoSlug,
        request,
        error,
      });
      throw error;
    }
  }

  /**
   * Delete Repository Branch
   * DELETE /2.0/repositories/{workspace}/{repo_slug}/refs/branches/{name}
   */
  async deleteRepositoryBranch(
    workspace: string,
    repoSlug: string,
    branchName: string
  ): Promise<void> {
    this.logger.info('Deleting repository branch', { workspace, repoSlug, branchName });

    try {
      await this.apiClient.delete(
        `/repositories/${workspace}/${repoSlug}/refs/branches/${branchName}`
      );
      this.logger.info('Successfully deleted repository branch', {
        workspace,
        repoSlug,
        branchName,
      });
    } catch (error) {
      this.logger.error('Failed to delete repository branch', {
        workspace,
        repoSlug,
        branchName,
        error,
      });
      throw error;
    }
  }

  /**
   * List Repository Tags
   * GET /2.0/repositories/{workspace}/{repo_slug}/refs/tags
   */
  async listRepositoryTags(
    workspace: string,
    repoSlug: string,
    params?: ListRepositoryTagsParams
  ): Promise<ListRepositoryTagsResponse> {
    this.logger.info('Listing repository tags', { workspace, repoSlug });

    try {
      const response = await this.apiClient.get<ListRepositoryTagsResponse>(
        `/repositories/${workspace}/${repoSlug}/refs/tags`,
        { params }
      );
      this.logger.info('Successfully listed repository tags', {
        workspace,
        repoSlug,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list repository tags', { workspace, repoSlug, error });
      throw error;
    }
  }

  /**
   * Get Repository Tag
   * GET /2.0/repositories/{workspace}/{repo_slug}/refs/tags/{name}
   */
  async getRepositoryTag(
    workspace: string,
    repoSlug: string,
    tagName: string
  ): Promise<RepositoryTag> {
    this.logger.info('Getting repository tag', { workspace, repoSlug, tagName });

    try {
      const response = await this.apiClient.get<RepositoryTag>(
        `/repositories/${workspace}/${repoSlug}/refs/tags/${tagName}`
      );
      this.logger.info('Successfully retrieved repository tag', { workspace, repoSlug, tagName });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get repository tag', { workspace, repoSlug, tagName, error });
      throw error;
    }
  }

  /**
   * Create Repository Tag
   * POST /2.0/repositories/{workspace}/{repo_slug}/refs/tags
   */
  async createRepositoryTag(
    workspace: string,
    repoSlug: string,
    request: CreateTagRequest
  ): Promise<RepositoryTag> {
    this.logger.info('Creating repository tag', { workspace, repoSlug });

    try {
      const response = await this.apiClient.post<RepositoryTag>(
        `/repositories/${workspace}/${repoSlug}/refs/tags`,
        request
      );
      this.logger.info('Successfully created repository tag', { workspace, repoSlug });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create repository tag', { workspace, repoSlug, request, error });
      throw error;
    }
  }

  /**
   * Delete Repository Tag
   * DELETE /2.0/repositories/{workspace}/{repo_slug}/refs/tags/{name}
   */
  async deleteRepositoryTag(workspace: string, repoSlug: string, tagName: string): Promise<void> {
    this.logger.info('Deleting repository tag', { workspace, repoSlug, tagName });

    try {
      await this.apiClient.delete(`/repositories/${workspace}/${repoSlug}/refs/tags/${tagName}`);
      this.logger.info('Successfully deleted repository tag', { workspace, repoSlug, tagName });
    } catch (error) {
      this.logger.error('Failed to delete repository tag', { workspace, repoSlug, tagName, error });
      throw error;
    }
  }

  /**
   * List Repository Commits
   * GET /2.0/repositories/{workspace}/{repo_slug}/commits
   */
  async listRepositoryCommits(
    workspace: string,
    repoSlug: string,
    params?: ListRepositoryCommitsParams
  ): Promise<ListRepositoryCommitsResponse> {
    this.logger.info('Listing repository commits', { workspace, repoSlug });

    try {
      const response = await this.apiClient.get<ListRepositoryCommitsResponse>(
        `/repositories/${workspace}/${repoSlug}/commits`,
        { params }
      );
      this.logger.info('Successfully listed repository commits', {
        workspace,
        repoSlug,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list repository commits', { workspace, repoSlug, error });
      throw error;
    }
  }

  /**
   * Get Repository Commit
   * GET /2.0/repositories/{workspace}/{repo_slug}/commit/{commit}
   */
  async getRepositoryCommit(
    workspace: string,
    repoSlug: string,
    commit: string
  ): Promise<RepositoryCommit> {
    this.logger.info('Getting repository commit', { workspace, repoSlug, commit });

    try {
      const response = await this.apiClient.get<RepositoryCommit>(
        `/repositories/${workspace}/${repoSlug}/commit/${commit}`
      );
      this.logger.info('Successfully retrieved repository commit', { workspace, repoSlug, commit });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get repository commit', { workspace, repoSlug, commit, error });
      throw error;
    }
  }

  /**
   * List Repository Webhooks
   * GET /2.0/repositories/{workspace}/{repo_slug}/hooks
   */
  async listRepositoryWebhooks(
    workspace: string,
    repoSlug: string
  ): Promise<ListRepositoryWebhooksResponse> {
    this.logger.info('Listing repository webhooks', { workspace, repoSlug });

    try {
      const response = await this.apiClient.get<ListRepositoryWebhooksResponse>(
        `/repositories/${workspace}/${repoSlug}/hooks`
      );
      this.logger.info('Successfully listed repository webhooks', {
        workspace,
        repoSlug,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list repository webhooks', { workspace, repoSlug, error });
      throw error;
    }
  }

  /**
   * Get Repository Webhook
   * GET /2.0/repositories/{workspace}/{repo_slug}/hooks/{uid}
   */
  async getRepositoryWebhook(
    workspace: string,
    repoSlug: string,
    hookUid: string
  ): Promise<RepositoryWebhook> {
    this.logger.info('Getting repository webhook', { workspace, repoSlug, hookUid });

    try {
      const response = await this.apiClient.get<RepositoryWebhook>(
        `/repositories/${workspace}/${repoSlug}/hooks/${hookUid}`
      );
      this.logger.info('Successfully retrieved repository webhook', {
        workspace,
        repoSlug,
        hookUid,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get repository webhook', {
        workspace,
        repoSlug,
        hookUid,
        error,
      });
      throw error;
    }
  }

  /**
   * Create Repository Webhook
   * POST /2.0/repositories/{workspace}/{repo_slug}/hooks
   */
  async createRepositoryWebhook(
    workspace: string,
    repoSlug: string,
    request: CreateRepositoryWebhookRequest
  ): Promise<RepositoryWebhook> {
    this.logger.info('Creating repository webhook', { workspace, repoSlug });

    try {
      const response = await this.apiClient.post<RepositoryWebhook>(
        `/repositories/${workspace}/${repoSlug}/hooks`,
        request
      );
      this.logger.info('Successfully created repository webhook', { workspace, repoSlug });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create repository webhook', {
        workspace,
        repoSlug,
        request,
        error,
      });
      throw error;
    }
  }

  /**
   * Update Repository Webhook
   * PUT /2.0/repositories/{workspace}/{repo_slug}/hooks/{uid}
   */
  async updateRepositoryWebhook(
    workspace: string,
    repoSlug: string,
    hookUid: string,
    request: UpdateRepositoryWebhookRequest
  ): Promise<RepositoryWebhook> {
    this.logger.info('Updating repository webhook', { workspace, repoSlug, hookUid });

    try {
      const response = await this.apiClient.put<RepositoryWebhook>(
        `/repositories/${workspace}/${repoSlug}/hooks/${hookUid}`,
        request
      );
      this.logger.info('Successfully updated repository webhook', { workspace, repoSlug, hookUid });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update repository webhook', {
        workspace,
        repoSlug,
        hookUid,
        request,
        error,
      });
      throw error;
    }
  }

  /**
   * Delete Repository Webhook
   * DELETE /2.0/repositories/{workspace}/{repo_slug}/hooks/{uid}
   */
  async deleteRepositoryWebhook(
    workspace: string,
    repoSlug: string,
    hookUid: string
  ): Promise<void> {
    this.logger.info('Deleting repository webhook', { workspace, repoSlug, hookUid });

    try {
      await this.apiClient.delete(`/repositories/${workspace}/${repoSlug}/hooks/${hookUid}`);
      this.logger.info('Successfully deleted repository webhook', { workspace, repoSlug, hookUid });
    } catch (error) {
      this.logger.error('Failed to delete repository webhook', {
        workspace,
        repoSlug,
        hookUid,
        error,
      });
      throw error;
    }
  }

  /**
   * List Repository Variables
   * GET /2.0/repositories/{workspace}/{repo_slug}/pipelines_config/variables
   */
  async listRepositoryVariables(
    workspace: string,
    repoSlug: string
  ): Promise<ListRepositoryVariablesResponse> {
    this.logger.info('Listing repository variables', { workspace, repoSlug });

    try {
      const response = await this.apiClient.get<ListRepositoryVariablesResponse>(
        `/repositories/${workspace}/${repoSlug}/pipelines_config/variables`
      );
      this.logger.info('Successfully listed repository variables', {
        workspace,
        repoSlug,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list repository variables', { workspace, repoSlug, error });
      throw error;
    }
  }

  /**
   * Get Repository Variable
   * GET /2.0/repositories/{workspace}/{repo_slug}/pipelines_config/variables/{variable_uuid}
   */
  async getRepositoryVariable(
    workspace: string,
    repoSlug: string,
    variableUuid: string
  ): Promise<RepositoryVariable> {
    this.logger.info('Getting repository variable', { workspace, repoSlug, variableUuid });

    try {
      const response = await this.apiClient.get<RepositoryVariable>(
        `/repositories/${workspace}/${repoSlug}/pipelines_config/variables/${variableUuid}`
      );
      this.logger.info('Successfully retrieved repository variable', {
        workspace,
        repoSlug,
        variableUuid,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get repository variable', {
        workspace,
        repoSlug,
        variableUuid,
        error,
      });
      throw error;
    }
  }

  /**
   * Create Repository Variable
   * POST /2.0/repositories/{workspace}/{repo_slug}/pipelines_config/variables
   */
  async createRepositoryVariable(
    workspace: string,
    repoSlug: string,
    request: CreateRepositoryVariableRequest
  ): Promise<RepositoryVariable> {
    this.logger.info('Creating repository variable', { workspace, repoSlug });

    try {
      const response = await this.apiClient.post<RepositoryVariable>(
        `/repositories/${workspace}/${repoSlug}/pipelines_config/variables`,
        request
      );
      this.logger.info('Successfully created repository variable', { workspace, repoSlug });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create repository variable', {
        workspace,
        repoSlug,
        request,
        error,
      });
      throw error;
    }
  }

  /**
   * Update Repository Variable
   * PUT /2.0/repositories/{workspace}/{repo_slug}/pipelines_config/variables/{variable_uuid}
   */
  async updateRepositoryVariable(
    workspace: string,
    repoSlug: string,
    variableUuid: string,
    request: UpdateRepositoryVariableRequest
  ): Promise<RepositoryVariable> {
    this.logger.info('Updating repository variable', { workspace, repoSlug, variableUuid });

    try {
      const response = await this.apiClient.put<RepositoryVariable>(
        `/repositories/${workspace}/${repoSlug}/pipelines_config/variables/${variableUuid}`,
        request
      );
      this.logger.info('Successfully updated repository variable', {
        workspace,
        repoSlug,
        variableUuid,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update repository variable', {
        workspace,
        repoSlug,
        variableUuid,
        request,
        error,
      });
      throw error;
    }
  }

  /**
   * Delete Repository Variable
   * DELETE /2.0/repositories/{workspace}/{repo_slug}/pipelines_config/variables/{variable_uuid}
   */
  async deleteRepositoryVariable(
    workspace: string,
    repoSlug: string,
    variableUuid: string
  ): Promise<void> {
    this.logger.info('Deleting repository variable', { workspace, repoSlug, variableUuid });

    try {
      await this.apiClient.delete(
        `/repositories/${workspace}/${repoSlug}/pipelines_config/variables/${variableUuid}`
      );
      this.logger.info('Successfully deleted repository variable', {
        workspace,
        repoSlug,
        variableUuid,
      });
    } catch (error) {
      this.logger.error('Failed to delete repository variable', {
        workspace,
        repoSlug,
        variableUuid,
        error,
      });
      throw error;
    }
  }
}
