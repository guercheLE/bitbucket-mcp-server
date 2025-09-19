/**
 * Bitbucket Cloud Comments Service
 * 
 * Este serviço implementa operações específicas para comentários de Issues
 * do Bitbucket Cloud, incluindo CRUD e validações.
 * 
 * @fileoverview Serviço para gestão de comentários de Issues no Bitbucket Cloud
 * @version 1.0.0
 * @since 2024-12-19
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { logger, logRequest, logResponse, logError, logPerformance } from '../utils/logger';
import { issuesValidationService } from './issues-validation-service';
import {
  IssueComment,
  CreateCommentRequest,
  UpdateCommentRequest,
  CommentsListResponse,
  IssuesError
} from '../types/comments';

// ============================================================================
// Configuration Interface
// ============================================================================

export interface CommentsServiceConfig {
  baseUrl: string;
  workspace: string;
  repository: string;
  accessToken: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

// ============================================================================
// Comments Service Class
// ============================================================================

export class CommentsService {
  private axios: AxiosInstance;
  private config: CommentsServiceConfig;

  constructor(config: CommentsServiceConfig) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };

    this.axios = axios.create({
      baseURL: `${this.config.baseUrl}/repositories/${this.config.workspace}/${this.config.repository}/issues`,
      timeout: this.config.timeout,
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  /**
   * Setup axios interceptors for logging and error handling
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.axios.interceptors.request.use(
      (config) => {
        logRequest(config);
        return config;
      },
      (error) => {
        logError('Request interceptor error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axios.interceptors.response.use(
      (response) => {
        logResponse(response);
        return response;
      },
      (error) => {
        logError('Response interceptor error', error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get comments for a specific issue
   */
  async getComments(issueId: number, page: number = 1, pagelen: number = 50): Promise<CommentsListResponse> {
    const startTime = Date.now();
    
    try {
      logger.info('Getting comments for issue', { issueId, page, pagelen });

      // Validate input
      issuesValidationService.validateIssueId(issueId);
      issuesValidationService.validatePaginationParams(page, pagelen);

      const response: AxiosResponse<CommentsListResponse> = await this.axios.get(
        `/${issueId}/comments`,
        {
          params: { page, pagelen }
        }
      );

      logPerformance('getComments', Date.now() - startTime, { issueId, page, pagelen });
      
      return response.data;
    } catch (error) {
      logError('Failed to get comments', error, { issueId, page, pagelen });
      throw this.handleError(error, 'Failed to get comments');
    }
  }

  /**
   * Get a specific comment
   */
  async getComment(issueId: number, commentId: number): Promise<IssueComment> {
    const startTime = Date.now();
    
    try {
      logger.info('Getting comment', { issueId, commentId });

      // Validate input
      issuesValidationService.validateIssueId(issueId);
      issuesValidationService.validateCommentId(commentId);

      const response: AxiosResponse<IssueComment> = await this.axios.get(
        `/${issueId}/comments/${commentId}`
      );

      logPerformance('getComment', Date.now() - startTime, { issueId, commentId });
      
      return response.data;
    } catch (error) {
      logError('Failed to get comment', error, { issueId, commentId });
      throw this.handleError(error, 'Failed to get comment');
    }
  }

  /**
   * Create a new comment
   */
  async createComment(issueId: number, request: CreateCommentRequest): Promise<IssueComment> {
    const startTime = Date.now();
    
    try {
      logger.info('Creating comment', { issueId, request });

      // Validate input
      issuesValidationService.validateIssueId(issueId);
      issuesValidationService.validateCreateCommentRequest(request);

      const response: AxiosResponse<IssueComment> = await this.axios.post(
        `/${issueId}/comments`,
        request
      );

      logPerformance('createComment', Date.now() - startTime, { issueId });
      
      return response.data;
    } catch (error) {
      logError('Failed to create comment', error, { issueId, request });
      throw this.handleError(error, 'Failed to create comment');
    }
  }

  /**
   * Update an existing comment
   */
  async updateComment(issueId: number, commentId: number, request: UpdateCommentRequest): Promise<IssueComment> {
    const startTime = Date.now();
    
    try {
      logger.info('Updating comment', { issueId, commentId, request });

      // Validate input
      issuesValidationService.validateIssueId(issueId);
      issuesValidationService.validateCommentId(commentId);
      issuesValidationService.validateUpdateCommentRequest(request);

      const response: AxiosResponse<IssueComment> = await this.axios.put(
        `/${issueId}/comments/${commentId}`,
        request
      );

      logPerformance('updateComment', Date.now() - startTime, { issueId, commentId });
      
      return response.data;
    } catch (error) {
      logError('Failed to update comment', error, { issueId, commentId, request });
      throw this.handleError(error, 'Failed to update comment');
    }
  }

  /**
   * Delete a comment
   */
  async deleteComment(issueId: number, commentId: number): Promise<void> {
    const startTime = Date.now();
    
    try {
      logger.info('Deleting comment', { issueId, commentId });

      // Validate input
      issuesValidationService.validateIssueId(issueId);
      issuesValidationService.validateCommentId(commentId);

      await this.axios.delete(`/${issueId}/comments/${commentId}`);

      logPerformance('deleteComment', Date.now() - startTime, { issueId, commentId });
    } catch (error) {
      logError('Failed to delete comment', error, { issueId, commentId });
      throw this.handleError(error, 'Failed to delete comment');
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: any, message: string): Error {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      logger.error('API error', { status, data, message });
      
      if (data && data.error) {
        return new Error(`${message}: ${data.error.message || data.error}`);
      }
      
      return new Error(`${message}: HTTP ${status}`);
    }
    
    if (error.request) {
      logger.error('Network error', { message });
      return new Error(`${message}: Network error`);
    }
    
    logger.error('Unknown error', { error: error.message, message });
    return new Error(`${message}: ${error.message}`);
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new CommentsService instance
 */
export function createCommentsService(config: CommentsServiceConfig): CommentsService {
  return new CommentsService(config);
}
