/**
 * Bitbucket Cloud Transitions Service
 * 
 * Este serviço implementa operações específicas para transições de estado
 * de Issues do Bitbucket Cloud, incluindo validações e regras de negócio.
 * 
 * @fileoverview Serviço para gestão de transições de Issues no Bitbucket Cloud
 * @version 1.0.0
 * @since 2024-12-19
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { logger, logRequest, logResponse, logError, logPerformance } from '../utils/logger';
import { issuesValidationService } from './issues-validation-service';
import {
  IssueTransition,
  TransitionIssueRequest,
  TransitionsListResponse,
  IssuesError
} from '../types/issues';

// ============================================================================
// Configuration Interface
// ============================================================================

export interface TransitionsServiceConfig {
  baseUrl: string;
  workspace: string;
  repository: string;
  accessToken: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

// ============================================================================
// Transitions Service Class
// ============================================================================

export class TransitionsService {
  private axios: AxiosInstance;
  private config: TransitionsServiceConfig;

  constructor(config: TransitionsServiceConfig) {
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
   * Get available transitions for an issue
   */
  async getTransitions(issueId: number): Promise<TransitionsListResponse> {
    const startTime = Date.now();
    
    try {
      logger.info('Getting transitions for issue', { issueId });

      // Validate input
      issuesValidationService.validateIssueId(issueId);

      const response: AxiosResponse<TransitionsListResponse> = await this.axios.get(
        `/${issueId}/transitions`
      );

      logPerformance('getTransitions', Date.now() - startTime, { issueId });
      
      return response.data;
    } catch (error) {
      logError('Failed to get transitions', error, { issueId });
      throw this.handleError(error, 'Failed to get transitions');
    }
  }

  /**
   * Transition an issue to a new state
   */
  async transitionIssue(issueId: number, request: TransitionIssueRequest): Promise<void> {
    const startTime = Date.now();
    
    try {
      logger.info('Transitioning issue', { issueId, request });

      // Validate input
      issuesValidationService.validateIssueId(issueId);
      issuesValidationService.validateTransitionRequest(request);

      // Validate business rules
      await this.validateTransitionRules(issueId, request);

      await this.axios.post(`/${issueId}/transitions`, request);

      logPerformance('transitionIssue', Date.now() - startTime, { issueId });
    } catch (error) {
      logError('Failed to transition issue', error, { issueId, request });
      throw this.handleError(error, 'Failed to transition issue');
    }
  }

  /**
   * Validate transition business rules
   */
  private async validateTransitionRules(issueId: number, request: TransitionIssueRequest): Promise<void> {
    try {
      // Get current issue state
      const issueResponse = await this.axios.get(`/${issueId}`);
      const currentIssue = issueResponse.data;
      
      // Get available transitions
      const transitionsResponse = await this.axios.get(`/${issueId}/transitions`);
      const availableTransitions = transitionsResponse.data.values;
      
      // Check if the requested transition is available
      const requestedTransition = availableTransitions.find(
        (t: IssueTransition) => t.id === request.transition.id
      );
      
      if (!requestedTransition) {
        throw new Error(`Transition '${request.transition.id}' is not available for this issue`);
      }
      
      // Validate required fields
      if (requestedTransition.fields) {
        for (const [fieldName, fieldConfig] of Object.entries(requestedTransition.fields)) {
          if (fieldConfig.required && !request.fields?.[fieldName]) {
            throw new Error(`Required field '${fieldName}' is missing for transition '${request.transition.id}'`);
          }
          
          // Validate field values
          if (fieldConfig.allowed_values && request.fields?.[fieldName]) {
            const fieldValue = request.fields[fieldName];
            if (!fieldConfig.allowed_values.includes(fieldValue)) {
              throw new Error(`Field '${fieldName}' value '${fieldValue}' is not allowed. Allowed values: ${fieldConfig.allowed_values.join(', ')}`);
            }
          }
        }
      }
      
      logger.debug('Transition validation passed', { issueId, transition: request.transition.id });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Transition') || error.message.includes('Field')) {
        throw error; // Re-throw validation errors
      }
      throw new Error(`Failed to validate transition rules: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get transition history for an issue
   */
  async getTransitionHistory(issueId: number, page: number = 1, pagelen: number = 50): Promise<any> {
    const startTime = Date.now();
    
    try {
      logger.info('Getting transition history', { issueId, page, pagelen });

      // Validate input
      issuesValidationService.validateIssueId(issueId);
      issuesValidationService.validatePaginationParams(page, pagelen);

      const response = await this.axios.get(
        `/${issueId}/changes`,
        {
          params: { 
            page, 
            pagelen,
            q: 'type="status"' // Filter for status changes only
          }
        }
      );

      logPerformance('getTransitionHistory', Date.now() - startTime, { issueId, page, pagelen });
      
      return response.data;
    } catch (error) {
      logError('Failed to get transition history', error, { issueId, page, pagelen });
      throw this.handleError(error, 'Failed to get transition history');
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
 * Create a new TransitionsService instance
 */
export function createTransitionsService(config: TransitionsServiceConfig): TransitionsService {
  return new TransitionsService(config);
}
