import axios, { AxiosResponse } from 'axios';
import { z } from 'zod';
import { 
  Comment,
  CreateCommentRequest,
  UpdateCommentRequest,
  PaginatedResponse,
  CommentSchema,
  CreateCommentRequestSchema,
  UpdateCommentRequestSchema,
  PaginatedResponseSchema
} from '../types/pullrequest';
import { ServerInfo } from './server-detection';

/**
 * Pull Request Comments Service for Bitbucket Data Center and Cloud
 * T020: Pull request comments service in src/services/pullrequest-comments-service.ts
 * 
 * Handles all pull request comment operations for Data Center and Cloud
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
export interface PullRequestCommentsServiceRequest {
  serverInfo: ServerInfo;
  auth: AuthInfo;
}

// Specific request types
export interface CreateCommentServiceRequest extends PullRequestCommentsServiceRequest {
  projectKey: string;
  repositorySlug: string;
  pullRequestId: number;
  text: string;
  parentId?: number;
  anchor?: {
    line: number;
    lineType: 'ADDED' | 'REMOVED' | 'CONTEXT';
    fileType: 'FROM' | 'TO';
    path: string;
    srcPath?: string;
  };
  severity?: 'NORMAL' | 'BLOCKER' | 'WARNING';
}

export interface GetCommentRequest extends PullRequestCommentsServiceRequest {
  projectKey: string;
  repositorySlug: string;
  pullRequestId: number;
  commentId: number;
}

export interface UpdateCommentServiceRequest extends PullRequestCommentsServiceRequest {
  projectKey: string;
  repositorySlug: string;
  pullRequestId: number;
  commentId: number;
  version: number;
  text: string;
  severity?: 'NORMAL' | 'BLOCKER' | 'WARNING';
}

export interface DeleteCommentRequest extends PullRequestCommentsServiceRequest {
  projectKey: string;
  repositorySlug: string;
  pullRequestId: number;
  commentId: number;
  version: number;
}

export interface ListCommentsRequest extends PullRequestCommentsServiceRequest {
  projectKey: string;
  repositorySlug: string;
  pullRequestId: number;
  start?: number;
  limit?: number;
}

/**
 * Pull Request Comments Service Class
 */
export class PullRequestCommentsService {
  private readonly REQUEST_TIMEOUT = 10000; // 10 seconds
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  /**
   * Creates a new comment on a pull request
   */
  async createComment(request: CreateCommentServiceRequest): Promise<Comment> {
    // Validate input
    const validation = CreateCommentRequestSchema.safeParse({
      text: request.text,
      parent: request.parentId ? { id: request.parentId } : undefined,
      anchor: request.anchor,
      severity: request.severity
    });

    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.error.errors.map(e => e.message).join(', ')}`);
    }

    try {
      const response: AxiosResponse<Comment> = await this.makeRequest(
        request.serverInfo.baseUrl,
        `/rest/api/1.0/projects/${request.projectKey}/repos/${request.repositorySlug}/pull-requests/${request.pullRequestId}/comments`,
        'POST',
        request.auth,
        {
          text: request.text,
          parent: request.parentId ? { id: request.parentId } : undefined,
          anchor: request.anchor,
          severity: request.severity
        }
      );

      const comment = CommentSchema.parse(response.data);
      return this.addSelfLinks(comment, request.serverInfo.baseUrl, request.projectKey, request.repositorySlug, request.pullRequestId);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Pull request not found');
        } else if (error.response?.status === 403) {
          throw new Error('Insufficient permissions to comment');
        } else if (error.response?.status === 401) {
          throw new Error('Authentication failed');
        } else if (error.response?.status === 400) {
          throw new Error('Invalid comment data');
        }
      }
      throw new Error(`Failed to create comment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets a specific comment
   */
  async getComment(request: GetCommentRequest): Promise<Comment> {
    try {
      const response: AxiosResponse<Comment> = await this.makeRequest(
        request.serverInfo.baseUrl,
        `/rest/api/1.0/projects/${request.projectKey}/repos/${request.repositorySlug}/pull-requests/${request.pullRequestId}/comments/${request.commentId}`,
        'GET',
        request.auth
      );

      const comment = CommentSchema.parse(response.data);
      return this.addSelfLinks(comment, request.serverInfo.baseUrl, request.projectKey, request.repositorySlug, request.pullRequestId);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Comment not found');
        } else if (error.response?.status === 403) {
          throw new Error('Insufficient permissions');
        } else if (error.response?.status === 401) {
          throw new Error('Authentication failed');
        }
      }
      throw new Error(`Failed to get comment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Updates a comment
   */
  async updateComment(request: UpdateCommentServiceRequest): Promise<Comment> {
    // Validate input
    const validation = UpdateCommentRequestSchema.safeParse({
      version: request.version,
      text: request.text,
      severity: request.severity
    });

    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.error.errors.map(e => e.message).join(', ')}`);
    }

    try {
      const response: AxiosResponse<Comment> = await this.makeRequest(
        request.serverInfo.baseUrl,
        `/rest/api/1.0/projects/${request.projectKey}/repos/${request.repositorySlug}/pull-requests/${request.pullRequestId}/comments/${request.commentId}`,
        'PUT',
        request.auth,
        {
          version: request.version,
          text: request.text,
          severity: request.severity
        }
      );

      const comment = CommentSchema.parse(response.data);
      return this.addSelfLinks(comment, request.serverInfo.baseUrl, request.projectKey, request.repositorySlug, request.pullRequestId);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Comment not found');
        } else if (error.response?.status === 409) {
          throw new Error('Version conflict - comment was modified by another user');
        } else if (error.response?.status === 403) {
          throw new Error('Insufficient permissions to update comment');
        } else if (error.response?.status === 401) {
          throw new Error('Authentication failed');
        }
      }
      throw new Error(`Failed to update comment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deletes a comment
   */
  async deleteComment(request: DeleteCommentRequest): Promise<void> {
    try {
      await this.makeRequest(
        request.serverInfo.baseUrl,
        `/rest/api/1.0/projects/${request.projectKey}/repos/${request.repositorySlug}/pull-requests/${request.pullRequestId}/comments/${request.commentId}?version=${request.version}`,
        'DELETE',
        request.auth
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Comment not found');
        } else if (error.response?.status === 403) {
          throw new Error('Insufficient permissions to delete comment');
        } else if (error.response?.status === 401) {
          throw new Error('Authentication failed');
        } else if (error.response?.status === 409) {
          throw new Error('Version conflict - comment was modified by another user');
        }
      }
      throw new Error(`Failed to delete comment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Lists all comments for a pull request
   */
  async listComments(request: ListCommentsRequest): Promise<PaginatedResponse<Comment>> {
    try {
      const params = new URLSearchParams();
      if (request.start !== undefined) params.append('start', request.start.toString());
      if (request.limit !== undefined) params.append('limit', request.limit.toString());

      const response: AxiosResponse<PaginatedResponse<Comment>> = await this.makeRequest(
        request.serverInfo.baseUrl,
        `/rest/api/1.0/projects/${request.projectKey}/repos/${request.repositorySlug}/pull-requests/${request.pullRequestId}/comments?${params.toString()}`,
        'GET',
        request.auth
      );

      const commentList = PaginatedResponseSchema(CommentSchema).parse(response.data);
      
      // Add self links to all comments
      commentList.values = commentList.values.map(comment => 
        this.addSelfLinks(comment, request.serverInfo.baseUrl, request.projectKey, request.repositorySlug, request.pullRequestId)
      );

      return commentList;
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
      throw new Error(`Failed to list comments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Adds self links to comment
   */
  private addSelfLinks(
    comment: Comment, 
    baseUrl: string, 
    projectKey: string, 
    repositorySlug: string,
    pullRequestId: number
  ): Comment {
    return {
      ...comment,
      links: {
        ...comment.links,
        self: [{
          href: `${baseUrl}/rest/api/1.0/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${pullRequestId}/comments/${comment.id}`
        }],
        html: [{
          href: `${baseUrl}/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${pullRequestId}/comments/${comment.id}`
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
export const pullRequestCommentsService = new PullRequestCommentsService();
