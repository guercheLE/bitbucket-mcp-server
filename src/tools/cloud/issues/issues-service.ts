/**
 * Bitbucket Cloud Issues Service
 * 
 * Este serviço implementa todas as operações relacionadas a Issues
 * do Bitbucket Cloud, incluindo CRUD, busca, transições e relacionamentos.
 * 
 * @fileoverview Serviço principal para gestão de Issues no Bitbucket Cloud
 * @version 1.0.0
 * @since 2024-12-19
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { logger, logRequest, logResponse, logError, logPerformance } from '../../../utils/logger';
import { issuesValidationService } from '../../../services/issues-validation-service';
import {
  Issue,
  IssueComment,
  IssueRelationship,
  IssueAttachment,
  IssueTransition,
  CreateIssueRequest,
  UpdateIssueRequest,
  CreateCommentRequest,
  UpdateCommentRequest,
  TransitionIssueRequest,
  IssuesListResponse,
  CommentsListResponse,
  RelationshipsListResponse,
  AttachmentsListResponse,
  TransitionsListResponse,
  IssuesSearchParams,
  IssuesError
} from '../../../types/issues';

// ============================================================================
// Configuration Interface
// ============================================================================

export interface IssuesServiceConfig {
  baseUrl: string;
  workspace: string;
  repository: string;
  accessToken: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

// ============================================================================
// Issues Service Class
// ============================================================================

export class IssuesService {
  private axiosInstance: AxiosInstance;
  private config: IssuesServiceConfig;

  constructor(config: IssuesServiceConfig) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };

    this.axiosInstance = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private setupInterceptors(): void {
    // Request interceptor for logging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        logRequest({
          method: config.method?.toUpperCase() || 'UNKNOWN',
          url: config.url || '',
          headers: {
            workspace: this.config.workspace,
            repository: this.config.repository
          }
        });
        return config;
      },
      (error) => {
        logError('Request failed', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging and error handling
    this.axiosInstance.interceptors.response.use(
      (response) => {
        logResponse({
          statusCode: response.status,
          headers: {
            url: response.config.url || '',
            dataSize: JSON.stringify(response.data).length.toString()
          }
        });
        return response;
      },
      async (error) => {
        logError('Request failed', error);
        
        // Handle authentication errors
        if (error.response?.status === 401) {
          throw new Error('Authentication failed. Please check your access token.');
        }

        // Handle rate limiting
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'] || 60;
          throw new Error(`Rate limit exceeded. Please try again after ${retryAfter} seconds.`);
        }

        return Promise.reject(error);
      }
    );
  }

  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    retryCount = 0
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.request({
        method,
        url: endpoint,
        data
      });

      const duration = Date.now() - startTime;
      logPerformance(`Issues API ${method} ${endpoint}`, duration, { success: true });

      return response.data;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logPerformance(`Issues API ${method} ${endpoint}`, duration, { success: false });

      // Retry logic for network errors
      if (retryCount < this.config.retryAttempts! && this.shouldRetry(error)) {
        const delay = this.config.retryDelay! * Math.pow(2, retryCount);
        logger.info(`Retrying request after ${delay}ms (attempt ${retryCount + 1}/${this.config.retryAttempts})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequest<T>(method, endpoint, data, retryCount + 1);
      }

      throw this.handleError(error);
    }
  }

  private shouldRetry(error: any): boolean {
    return (
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ECONNREFUSED' ||
      (error.response?.status >= 500 && error.response?.status < 600)
    );
  }

  private handleError(error: any): IssuesError {
    if (error.response?.data) {
      return {
        type: 'api_error',
        error: {
          message: error.response.data.error?.message || 'API Error',
          detail: error.response.data.error?.detail || error.message,
          data: error.response.data
        }
      };
    }

    return {
      type: 'network_error',
      error: {
        message: 'Network Error',
        detail: error.message,
        data: { code: error.code }
      }
    };
  }

  private buildIssuesEndpoint(path = ''): string {
    return `/repositories/${this.config.workspace}/${this.config.repository}/issues${path}`;
  }

  // ============================================================================
  // Issue CRUD Operations
  // ============================================================================

  /**
   * Create a new issue
   */
  async createIssue(request: CreateIssueRequest): Promise<Issue> {
    logger.info('Creating new issue', { title: request.title });
    
    // Validate request
    const validation = issuesValidationService.validateCreateIssue(request);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    if (validation.warnings.length > 0) {
      logger.warn('Issue creation warnings', { warnings: validation.warnings });
    }
    
    const issue = await this.makeRequest<Issue>(
      'POST',
      this.buildIssuesEndpoint(),
      request
    );

    logger.info('Issue created successfully', {
      issueId: issue.id,
      title: issue.title,
      kind: issue.kind,
      priority: issue.priority
    });

    return issue;
  }

  /**
   * Get an issue by ID
   */
  async getIssue(issueId: number): Promise<Issue> {
    logger.info('Getting issue', { issueId });
    
    const issue = await this.makeRequest<Issue>(
      'GET',
      this.buildIssuesEndpoint(`/${issueId}`)
    );

    logger.info('Issue retrieved successfully', {
      issueId: issue.id,
      title: issue.title,
      state: issue.state.name
    });

    return issue;
  }

  /**
   * Update an issue
   */
  async updateIssue(issueId: number, request: UpdateIssueRequest): Promise<Issue> {
    logger.info('Updating issue', { issueId, updates: Object.keys(request) });
    
    // Get current issue for validation
    const currentIssue = await this.getIssue(issueId);
    
    // Validate request
    const validation = issuesValidationService.validateUpdateIssue(request, currentIssue);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    if (validation.warnings.length > 0) {
      logger.warn('Issue update warnings', { warnings: validation.warnings });
    }
    
    const issue = await this.makeRequest<Issue>(
      'PUT',
      this.buildIssuesEndpoint(`/${issueId}`),
      request
    );

    logger.info('Issue updated successfully', {
      issueId: issue.id,
      title: issue.title,
      updatedOn: issue.updated_on
    });

    return issue;
  }

  /**
   * Delete an issue
   */
  async deleteIssue(issueId: number): Promise<void> {
    logger.info('Deleting issue', { issueId });
    
    await this.makeRequest<void>(
      'DELETE',
      this.buildIssuesEndpoint(`/${issueId}`)
    );

    logger.info('Issue deleted successfully', { issueId });
  }

  // ============================================================================
  // Issue Search and Listing
  // ============================================================================

  /**
   * Search and list issues with filters
   */
  async searchIssues(params: IssuesSearchParams = {}): Promise<IssuesListResponse> {
    logger.info('Searching issues', { 
      query: params.q,
      filters: Object.keys(params).length - 1 // Exclude 'q' from count
    });

    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = this.buildIssuesEndpoint(queryString ? `?${queryString}` : '');

    const response = await this.makeRequest<IssuesListResponse>('GET', endpoint);

    logger.info('Issues search completed', {
      query: params.q,
      resultCount: response.values.length,
      totalSize: response.size
    });

    return response;
  }

  /**
   * List all issues (convenience method)
   */
  async listIssues(page = 1, pageSize = 10): Promise<IssuesListResponse> {
    return this.searchIssues({ page, pagelen: pageSize });
  }

  // ============================================================================
  // Issue Transitions
  // ============================================================================

  /**
   * Get available transitions for an issue
   */
  async getIssueTransitions(issueId: number): Promise<IssueTransition[]> {
    logger.info('Getting issue transitions', { issueId });
    
    const response = await this.makeRequest<TransitionsListResponse>(
      'GET',
      this.buildIssuesEndpoint(`/${issueId}/transitions`)
    );

    logger.info('Issue transitions retrieved', {
      issueId,
      transitionCount: response.values.length
    });

    return response.values;
  }

  /**
   * Transition an issue to a new state
   */
  async transitionIssue(issueId: number, request: TransitionIssueRequest): Promise<Issue> {
    logger.info('Transitioning issue', { 
      issueId, 
      transitionId: request.transition.id 
    });
    
    // Get current issue and available transitions for validation
    const [currentIssue, availableTransitions] = await Promise.all([
      this.getIssue(issueId),
      this.getIssueTransitions(issueId)
    ]);
    
    // Validate transition
    const validation = issuesValidationService.validateTransition(request, currentIssue, availableTransitions);
    if (!validation.isValid) {
      throw new Error(`Transition validation failed: ${validation.errors.join(', ')}`);
    }
    
    if (validation.warnings.length > 0) {
      logger.warn('Issue transition warnings', { warnings: validation.warnings });
    }
    
    const issue = await this.makeRequest<Issue>(
      'POST',
      this.buildIssuesEndpoint(`/${issueId}/transitions`),
      request
    );

    logger.info('Issue transitioned successfully', {
      issueId,
      transitionId: request.transition.id,
      newState: issue.state.name
    });

    return issue;
  }

  // ============================================================================
  // Comments Management
  // ============================================================================

  /**
   * Get comments for an issue
   */
  async getIssueComments(issueId: number, page = 1, pageSize = 10): Promise<CommentsListResponse> {
    logger.info('Getting issue comments', { issueId, page, pageSize });
    
    const response = await this.makeRequest<CommentsListResponse>(
      'GET',
      this.buildIssuesEndpoint(`/${issueId}/comments?page=${page}&pagelen=${pageSize}`)
    );

    logger.info('Issue comments retrieved', {
      issueId,
      commentCount: response.values.length
    });

    return response;
  }

  /**
   * Create a comment on an issue
   */
  async createComment(issueId: number, request: CreateCommentRequest): Promise<IssueComment> {
    logger.info('Creating comment on issue', { issueId });
    
    // Get current issue for validation
    const currentIssue = await this.getIssue(issueId);
    
    // Validate comment
    const validation = issuesValidationService.validateComment(request.content.raw, currentIssue);
    if (!validation.isValid) {
      throw new Error(`Comment validation failed: ${validation.errors.join(', ')}`);
    }
    
    if (validation.warnings.length > 0) {
      logger.warn('Comment creation warnings', { warnings: validation.warnings });
    }
    
    const comment = await this.makeRequest<IssueComment>(
      'POST',
      this.buildIssuesEndpoint(`/${issueId}/comments`),
      request
    );

    logger.info('Comment created successfully', {
      issueId,
      commentId: comment.id
    });

    return comment;
  }

  /**
   * Update a comment
   */
  async updateComment(issueId: number, commentId: number, request: UpdateCommentRequest): Promise<IssueComment> {
    logger.info('Updating comment', { issueId, commentId });
    
    const comment = await this.makeRequest<IssueComment>(
      'PUT',
      this.buildIssuesEndpoint(`/${issueId}/comments/${commentId}`),
      request
    );

    logger.info('Comment updated successfully', {
      issueId,
      commentId: comment.id
    });

    return comment;
  }

  /**
   * Delete a comment
   */
  async deleteComment(issueId: number, commentId: number): Promise<void> {
    logger.info('Deleting comment', { issueId, commentId });
    
    await this.makeRequest<void>(
      'DELETE',
      this.buildIssuesEndpoint(`/${issueId}/comments/${commentId}`)
    );

    logger.info('Comment deleted successfully', { issueId, commentId });
  }

  // ============================================================================
  // Issue Relationships
  // ============================================================================

  /**
   * Get relationships for an issue
   */
  async getIssueRelationships(issueId: number, page = 1, pageSize = 10): Promise<RelationshipsListResponse> {
    logger.info('Getting issue relationships', { issueId, page, pageSize });
    
    const response = await this.makeRequest<RelationshipsListResponse>(
      'GET',
      this.buildIssuesEndpoint(`/${issueId}/relationships?page=${page}&pagelen=${pageSize}`)
    );

    logger.info('Issue relationships retrieved', {
      issueId,
      relationshipCount: response.values.length
    });

    return response;
  }

  /**
   * Create a relationship between issues
   */
  async createIssueRelationship(
    issueId: number, 
    relatedIssueId: number, 
    relationshipType: string
  ): Promise<IssueRelationship> {
    logger.info('Creating issue relationship', { 
      issueId, 
      relatedIssueId, 
      relationshipType 
    });
    
    const relationship = await this.makeRequest<IssueRelationship>(
      'POST',
      this.buildIssuesEndpoint(`/${issueId}/relationships`),
      {
        related_issue: { id: relatedIssueId },
        type: relationshipType
      }
    );

    logger.info('Issue relationship created successfully', {
      issueId,
      relatedIssueId,
      relationshipId: relationship.id
    });

    return relationship;
  }

  /**
   * Delete a relationship between issues
   */
  async deleteIssueRelationship(issueId: number, relationshipId: number): Promise<void> {
    logger.info('Deleting issue relationship', { issueId, relationshipId });
    
    await this.makeRequest<void>(
      'DELETE',
      this.buildIssuesEndpoint(`/${issueId}/relationships/${relationshipId}`)
    );

    logger.info('Issue relationship deleted successfully', { issueId, relationshipId });
  }

  // ============================================================================
  // Attachments Management
  // ============================================================================

  /**
   * Get attachments for an issue
   */
  async getIssueAttachments(issueId: number, page = 1, pageSize = 10): Promise<AttachmentsListResponse> {
    logger.info('Getting issue attachments', { issueId, page, pageSize });
    
    const response = await this.makeRequest<AttachmentsListResponse>(
      'GET',
      this.buildIssuesEndpoint(`/${issueId}/attachments?page=${page}&pagelen=${pageSize}`)
    );

    logger.info('Issue attachments retrieved', {
      issueId,
      attachmentCount: response.values.length
    });

    return response;
  }

  /**
   * Upload an attachment to an issue
   */
  async uploadAttachment(
    issueId: number, 
    file: Buffer, 
    filename: string, 
    contentType: string
  ): Promise<IssueAttachment> {
    logger.info('Uploading attachment to issue', { 
      issueId, 
      filename, 
      contentType,
      fileSize: file.length 
    });
    
    const attachment = await this.makeRequest<IssueAttachment>(
      'POST',
      this.buildIssuesEndpoint(`/${issueId}/attachments`),
      file
    );

    logger.info('Attachment uploaded successfully', {
      issueId,
      attachmentId: attachment.id,
      filename: attachment.name
    });

    return attachment;
  }

  /**
   * Delete an attachment
   */
  async deleteAttachment(issueId: number, attachmentId: number): Promise<void> {
    logger.info('Deleting attachment', { issueId, attachmentId });
    
    await this.makeRequest<void>(
      'DELETE',
      this.buildIssuesEndpoint(`/${issueId}/attachments/${attachmentId}`)
    );

    logger.info('Attachment deleted successfully', { issueId, attachmentId });
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Update access token
   */
  updateAccessToken(accessToken: string): void {
    this.config.accessToken = accessToken;
    this.axiosInstance.defaults.headers['Authorization'] = `Bearer ${accessToken}`;
    logger.info('Access token updated');
  }

  /**
   * Get service configuration
   */
  getConfig(): Readonly<IssuesServiceConfig> {
    return { ...this.config };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.makeRequest('GET', this.buildIssuesEndpoint('?pagelen=1'));
      return true;
    } catch (error) {
      logger.error('Issues service health check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createIssuesService(config: IssuesServiceConfig): IssuesService {
  return new IssuesService(config);
}
