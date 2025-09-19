import axios, { AxiosResponse } from 'axios';
import { z } from 'zod';
import { 
  PullRequest,
  CreatePullRequestRequest,
  UpdatePullRequestRequest,
  MergePullRequestRequest,
  DeclinePullRequestRequest,
  PaginatedResponse,
  PullRequestSchema,
  CreatePullRequestRequestSchema,
  UpdatePullRequestRequestSchema,
  MergePullRequestRequestSchema,
  DeclinePullRequestRequestSchema,
  PaginatedResponseSchema
} from '../types/pullrequest';
import { ServerInfo } from './server-detection';

/**
 * Pull Request Service for Bitbucket Data Center and Cloud
 * T019: Pull request CRUD service in src/services/pullrequest-service.ts
 * 
 * Handles all pull request CRUD operations for Data Center and Cloud
 * Based on data-model.md specifications
 */

// Authentication info type
export interface AuthInfo {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
}

// Base service request type
export interface PullRequestServiceRequest {
  serverInfo: ServerInfo;
  auth: AuthInfo;
}

// Specific request types
export interface CreatePullRequestServiceRequest extends PullRequestServiceRequest {
  projectKey: string;
  repositorySlug: string;
  title: string;
  description?: string;
  fromRef: string;
  toRef: string;
  reviewers?: string[];
  closeSourceBranch?: boolean;
}

export interface GetPullRequestRequest extends PullRequestServiceRequest {
  projectKey: string;
  repositorySlug: string;
  pullRequestId: number;
}

export interface UpdatePullRequestServiceRequest extends PullRequestServiceRequest {
  projectKey: string;
  repositorySlug: string;
  pullRequestId: number;
  version: number;
  title?: string;
  description?: string;
  reviewers?: string[];
  closeSourceBranch?: boolean;
}

export interface DeletePullRequestRequest extends PullRequestServiceRequest {
  projectKey: string;
  repositorySlug: string;
  pullRequestId: number;
}

export interface ListPullRequestsRequest extends PullRequestServiceRequest {
  projectKey: string;
  repositorySlug: string;
  state?: 'OPEN' | 'MERGED' | 'DECLINED' | 'SUPERSEDED' | 'DRAFT';
  start?: number;
  limit?: number;
}

export interface MergePullRequestServiceRequest extends PullRequestServiceRequest {
  projectKey: string;
  repositorySlug: string;
  pullRequestId: number;
  version: number;
  mergeCommitMessage?: string;
  closeSourceBranch?: boolean;
}

export interface DeclinePullRequestServiceRequest extends PullRequestServiceRequest {
  projectKey: string;
  repositorySlug: string;
  pullRequestId: number;
  version: number;
  reason?: string;
}

export interface ReopenPullRequestRequest extends PullRequestServiceRequest {
  projectKey: string;
  repositorySlug: string;
  pullRequestId: number;
  version: number;
}

/**
 * Pull Request Service Class
 */
export class PullRequestService {
  private readonly REQUEST_TIMEOUT = 10000; // 10 seconds
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  /**
   * Creates a new pull request
   */
  async createPullRequest(request: CreatePullRequestServiceRequest): Promise<PullRequest> {
    // Validate input
    const validation = CreatePullRequestRequestSchema.safeParse({
      title: request.title,
      description: request.description,
      fromRef: {
        id: `refs/heads/${request.fromRef}`,
        displayId: request.fromRef,
        latestCommit: '', // Will be filled by server
        repository: {
          slug: request.repositorySlug,
          name: request.repositorySlug,
          project: {
            key: request.projectKey,
            name: request.projectKey
          }
        }
      },
      toRef: {
        id: `refs/heads/${request.toRef}`,
        displayId: request.toRef,
        latestCommit: '', // Will be filled by server
        repository: {
          slug: request.repositorySlug,
          name: request.repositorySlug,
          project: {
            key: request.projectKey,
            name: request.projectKey
          }
        }
      },
      reviewers: request.reviewers?.map(name => ({ name })),
      closeSourceBranch: request.closeSourceBranch
    });

    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.error.errors.map(e => e.message).join(', ')}`);
    }

    try {
      const response: AxiosResponse<PullRequest> = await this.makeRequest(
        request.serverInfo.baseUrl,
        `/rest/api/1.0/projects/${request.projectKey}/repos/${request.repositorySlug}/pull-requests`,
        'POST',
        request.auth,
        {
          title: request.title,
          description: request.description,
          fromRef: {
            id: `refs/heads/${request.fromRef}`,
            repository: {
              slug: request.repositorySlug,
              project: {
                key: request.projectKey
              }
            }
          },
          toRef: {
            id: `refs/heads/${request.toRef}`,
            repository: {
              slug: request.repositorySlug,
              project: {
                key: request.projectKey
              }
            }
          },
          reviewers: request.reviewers?.map(name => ({ user: { name } })),
          closeSourceBranch: request.closeSourceBranch
        }
      );

      const pullRequest = PullRequestSchema.parse(response.data);
      return this.addSelfLinks(pullRequest, request.serverInfo.baseUrl, request.projectKey, request.repositorySlug);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 409) {
          throw new Error('Pull request already exists or conflict detected');
        } else if (error.response?.status === 403) {
          throw new Error('Insufficient permissions');
        } else if (error.response?.status === 401) {
          throw new Error('Authentication failed');
        } else if (error.response?.status === 400) {
          throw new Error('Invalid request data');
        }
      }
      throw new Error(`Failed to create pull request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets pull request details
   */
  async getPullRequest(request: GetPullRequestRequest): Promise<PullRequest> {
    try {
      const response: AxiosResponse<PullRequest> = await this.makeRequest(
        request.serverInfo.baseUrl,
        `/rest/api/1.0/projects/${request.projectKey}/repos/${request.repositorySlug}/pull-requests/${request.pullRequestId}`,
        'GET',
        request.auth
      );

      const pullRequest = PullRequestSchema.parse(response.data);
      return this.addSelfLinks(pullRequest, request.serverInfo.baseUrl, request.projectKey, request.repositorySlug);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Pull request not found');
        } else if (error.response?.status === 403) {
          throw new Error('Insufficient permissions');
        } else if (error.response?.status === 401) {
          throw new Error('Authentication failed');
        }
      }
      throw new Error(`Failed to get pull request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Updates pull request
   */
  async updatePullRequest(request: UpdatePullRequestServiceRequest): Promise<PullRequest> {
    // Validate input
    const validation = UpdatePullRequestRequestSchema.safeParse({
      version: request.version,
      title: request.title,
      description: request.description,
      reviewers: request.reviewers?.map(name => ({ name })),
      closeSourceBranch: request.closeSourceBranch
    });

    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.error.errors.map(e => e.message).join(', ')}`);
    }

    try {
      const response: AxiosResponse<PullRequest> = await this.makeRequest(
        request.serverInfo.baseUrl,
        `/rest/api/1.0/projects/${request.projectKey}/repos/${request.repositorySlug}/pull-requests/${request.pullRequestId}`,
        'PUT',
        request.auth,
        {
          version: request.version,
          title: request.title,
          description: request.description,
          reviewers: request.reviewers?.map(name => ({ user: { name } })),
          closeSourceBranch: request.closeSourceBranch
        }
      );

      const pullRequest = PullRequestSchema.parse(response.data);
      return this.addSelfLinks(pullRequest, request.serverInfo.baseUrl, request.projectKey, request.repositorySlug);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Pull request not found');
        } else if (error.response?.status === 409) {
          throw new Error('Version conflict - pull request was modified by another user');
        } else if (error.response?.status === 403) {
          throw new Error('Insufficient permissions');
        } else if (error.response?.status === 401) {
          throw new Error('Authentication failed');
        }
      }
      throw new Error(`Failed to update pull request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deletes pull request
   */
  async deletePullRequest(request: DeletePullRequestRequest): Promise<void> {
    try {
      await this.makeRequest(
        request.serverInfo.baseUrl,
        `/rest/api/1.0/projects/${request.projectKey}/repos/${request.repositorySlug}/pull-requests/${request.pullRequestId}`,
        'DELETE',
        request.auth
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Pull request not found');
        } else if (error.response?.status === 403) {
          throw new Error('Insufficient permissions');
        } else if (error.response?.status === 401) {
          throw new Error('Authentication failed');
        } else if (error.response?.status === 409) {
          throw new Error('Cannot delete pull request - it may be merged or have dependencies');
        }
      }
      throw new Error(`Failed to delete pull request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Lists pull requests
   */
  async listPullRequests(request: ListPullRequestsRequest): Promise<PaginatedResponse<PullRequest>> {
    try {
      const params = new URLSearchParams();
      if (request.state) params.append('state', request.state);
      if (request.start !== undefined) params.append('start', request.start.toString());
      if (request.limit !== undefined) params.append('limit', request.limit.toString());

      const response: AxiosResponse<PaginatedResponse<PullRequest>> = await this.makeRequest(
        request.serverInfo.baseUrl,
        `/rest/api/1.0/projects/${request.projectKey}/repos/${request.repositorySlug}/pull-requests?${params.toString()}`,
        'GET',
        request.auth
      );

      const pullRequestList = PaginatedResponseSchema(PullRequestSchema).parse(response.data);
      
      // Add self links to all pull requests
      pullRequestList.values = pullRequestList.values.map(pr => 
        this.addSelfLinks(pr, request.serverInfo.baseUrl, request.projectKey, request.repositorySlug)
      ) as any;

      return pullRequestList;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Repository not found');
        } else if (error.response?.status === 403) {
          throw new Error('Insufficient permissions');
        } else if (error.response?.status === 401) {
          throw new Error('Authentication failed');
        }
      }
      throw new Error(`Failed to list pull requests: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Merges pull request
   */
  async mergePullRequest(request: MergePullRequestServiceRequest): Promise<PullRequest> {
    // Validate input
    const validation = MergePullRequestRequestSchema.safeParse({
      version: request.version,
      mergeCommitMessage: request.mergeCommitMessage,
      closeSourceBranch: request.closeSourceBranch
    });

    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.error.errors.map(e => e.message).join(', ')}`);
    }

    try {
      const response: AxiosResponse<PullRequest> = await this.makeRequest(
        request.serverInfo.baseUrl,
        `/rest/api/1.0/projects/${request.projectKey}/repos/${request.repositorySlug}/pull-requests/${request.pullRequestId}/merge`,
        'POST',
        request.auth,
        {
          version: request.version,
          message: request.mergeCommitMessage,
          closeSourceBranch: request.closeSourceBranch
        }
      );

      const pullRequest = PullRequestSchema.parse(response.data);
      return this.addSelfLinks(pullRequest, request.serverInfo.baseUrl, request.projectKey, request.repositorySlug);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Pull request not found');
        } else if (error.response?.status === 409) {
          throw new Error('Cannot merge pull request - conflicts or version mismatch');
        } else if (error.response?.status === 403) {
          throw new Error('Insufficient permissions to merge');
        } else if (error.response?.status === 401) {
          throw new Error('Authentication failed');
        }
      }
      throw new Error(`Failed to merge pull request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Declines pull request
   */
  async declinePullRequest(request: DeclinePullRequestServiceRequest): Promise<PullRequest> {
    // Validate input
    const validation = DeclinePullRequestRequestSchema.safeParse({
      version: request.version,
      reason: request.reason
    });

    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.error.errors.map(e => e.message).join(', ')}`);
    }

    try {
      const response: AxiosResponse<PullRequest> = await this.makeRequest(
        request.serverInfo.baseUrl,
        `/rest/api/1.0/projects/${request.projectKey}/repos/${request.repositorySlug}/pull-requests/${request.pullRequestId}/decline`,
        'POST',
        request.auth,
        {
          version: request.version,
          reason: request.reason
        }
      );

      const pullRequest = PullRequestSchema.parse(response.data);
      return this.addSelfLinks(pullRequest, request.serverInfo.baseUrl, request.projectKey, request.repositorySlug);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Pull request not found');
        } else if (error.response?.status === 409) {
          throw new Error('Cannot decline pull request - version mismatch');
        } else if (error.response?.status === 403) {
          throw new Error('Insufficient permissions to decline');
        } else if (error.response?.status === 401) {
          throw new Error('Authentication failed');
        }
      }
      throw new Error(`Failed to decline pull request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Reopens pull request
   */
  async reopenPullRequest(request: ReopenPullRequestRequest): Promise<PullRequest> {
    try {
      const response: AxiosResponse<PullRequest> = await this.makeRequest(
        request.serverInfo.baseUrl,
        `/rest/api/1.0/projects/${request.projectKey}/repos/${request.repositorySlug}/pull-requests/${request.pullRequestId}/reopen`,
        'POST',
        request.auth,
        {
          version: request.version
        }
      );

      const pullRequest = PullRequestSchema.parse(response.data);
      return this.addSelfLinks(pullRequest, request.serverInfo.baseUrl, request.projectKey, request.repositorySlug);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Pull request not found');
        } else if (error.response?.status === 409) {
          throw new Error('Cannot reopen pull request - version mismatch or invalid state');
        } else if (error.response?.status === 403) {
          throw new Error('Insufficient permissions to reopen');
        } else if (error.response?.status === 401) {
          throw new Error('Authentication failed');
        }
      }
      throw new Error(`Failed to reopen pull request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Adds self links to pull request
   */
  private addSelfLinks(
    pullRequest: PullRequest, 
    baseUrl: string, 
    projectKey: string, 
    repositorySlug: string
  ): PullRequest {
    return {
      ...pullRequest,
      links: {
        ...pullRequest.links,
        self: [{
          href: `${baseUrl}/rest/api/1.0/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${pullRequest.id}`
        }],
        html: [{
          href: `${baseUrl}/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${pullRequest.id}`
        }]
      }
    };
  }

  /**
   * Makes HTTP request with retry logic
   */
  private async makeRequest(
    baseUrl: string,
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    auth: AuthInfo,
    data?: any
  ): Promise<AxiosResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const response = await axios({
          method,
          url: `${baseUrl}${endpoint}`,
          headers: {
            'Authorization': `${auth.token_type} ${auth.access_token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          data,
          timeout: this.REQUEST_TIMEOUT
        });

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry on client errors (4xx)
        if (axios.isAxiosError(error) && error.response?.status && error.response.status >= 400 && error.response.status < 500) {
          throw error;
        }

        // Wait before retry
        if (attempt < this.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * attempt));
        }
      }
    }

    throw lastError || new Error('Request failed after all retries');
  }
}

// Export singleton instance
export const pullRequestService = new PullRequestService();
