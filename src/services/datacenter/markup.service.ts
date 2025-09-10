/**
 * Markup Service for Bitbucket Data Center REST API
 * Based on official documentation: https://developer.atlassian.com/server/bitbucket/rest/v906/intro/
 */

import {
  MarkupRenderRequest,
  MarkupRenderResponse,
  MarkupPreviewRequest,
  MarkupPreviewResponse,
  MarkupValidationRequest,
  MarkupValidationResponse,
  MarkupSupportedTypesResponse,
} from './types/markup.types.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';

export class MarkupService {
  private readonly apiClient: ApiClient;
  private readonly logger: Logger;

  constructor(apiClient: ApiClient, logger: Logger) {
    this.apiClient = apiClient;
    this.logger = logger;
  }

  /**
   * Render markup to HTML
   * POST /rest/api/1.0/markup/render
   */
  async renderMarkup(request: MarkupRenderRequest): Promise<MarkupRenderResponse> {
    this.logger.info('Rendering markup', { type: request.type });

    try {
      const response = await this.apiClient.post<MarkupRenderResponse>('/markup/render', request);
      this.logger.info('Successfully rendered markup', { type: request.type });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to render markup', { request, error });
      throw error;
    }
  }

  /**
   * Preview markup
   * POST /rest/api/1.0/markup/preview
   */
  async previewMarkup(request: MarkupPreviewRequest): Promise<MarkupPreviewResponse> {
    this.logger.info('Previewing markup', { type: request.type });

    try {
      const response = await this.apiClient.post<MarkupPreviewResponse>('/markup/preview', request);
      this.logger.info('Successfully previewed markup', { type: request.type });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to preview markup', { request, error });
      throw error;
    }
  }

  /**
   * Validate markup
   * POST /rest/api/1.0/markup/validate
   */
  async validateMarkup(request: MarkupValidationRequest): Promise<MarkupValidationResponse> {
    this.logger.info('Validating markup', { type: request.type });

    try {
      const response = await this.apiClient.post<MarkupValidationResponse>(
        '/markup/validate',
        request
      );
      this.logger.info('Successfully validated markup', {
        type: request.type,
        valid: response.data.valid,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to validate markup', { request, error });
      throw error;
    }
  }

  /**
   * Get supported markup types
   * GET /rest/api/1.0/markup/types
   */
  async getSupportedMarkupTypes(): Promise<MarkupSupportedTypesResponse> {
    this.logger.info('Getting supported markup types');

    try {
      const response = await this.apiClient.get<MarkupSupportedTypesResponse>('/markup/types');
      this.logger.info('Successfully retrieved supported markup types', {
        count: response.data.types.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get supported markup types', { error });
      throw error;
    }
  }

  /**
   * Render markup for repository context
   * POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/markup/render
   */
  async renderMarkupForRepository(
    projectKey: string,
    repositorySlug: string,
    request: MarkupRenderRequest
  ): Promise<MarkupRenderResponse> {
    this.logger.info('Rendering markup for repository', {
      projectKey,
      repositorySlug,
      type: request.type,
    });

    try {
      const response = await this.apiClient.post<MarkupRenderResponse>(
        `/projects/${projectKey}/repos/${repositorySlug}/markup/render`,
        request
      );
      this.logger.info('Successfully rendered markup for repository', {
        projectKey,
        repositorySlug,
        type: request.type,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to render markup for repository', {
        projectKey,
        repositorySlug,
        request,
        error,
      });
      throw error;
    }
  }

  /**
   * Preview markup for repository context
   * POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/markup/preview
   */
  async previewMarkupForRepository(
    projectKey: string,
    repositorySlug: string,
    request: MarkupPreviewRequest
  ): Promise<MarkupPreviewResponse> {
    this.logger.info('Previewing markup for repository', {
      projectKey,
      repositorySlug,
      type: request.type,
    });

    try {
      const response = await this.apiClient.post<MarkupPreviewResponse>(
        `/projects/${projectKey}/repos/${repositorySlug}/markup/preview`,
        request
      );
      this.logger.info('Successfully previewed markup for repository', {
        projectKey,
        repositorySlug,
        type: request.type,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to preview markup for repository', {
        projectKey,
        repositorySlug,
        request,
        error,
      });
      throw error;
    }
  }

  /**
   * Validate markup for repository context
   * POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/markup/validate
   */
  async validateMarkupForRepository(
    projectKey: string,
    repositorySlug: string,
    request: MarkupValidationRequest
  ): Promise<MarkupValidationResponse> {
    this.logger.info('Validating markup for repository', {
      projectKey,
      repositorySlug,
      type: request.type,
    });

    try {
      const response = await this.apiClient.post<MarkupValidationResponse>(
        `/projects/${projectKey}/repos/${repositorySlug}/markup/validate`,
        request
      );
      this.logger.info('Successfully validated markup for repository', {
        projectKey,
        repositorySlug,
        type: request.type,
        valid: response.data.valid,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to validate markup for repository', {
        projectKey,
        repositorySlug,
        request,
        error,
      });
      throw error;
    }
  }

  /**
   * Render markup for project context
   * POST /rest/api/1.0/projects/{projectKey}/markup/render
   */
  async renderMarkupForProject(
    projectKey: string,
    request: MarkupRenderRequest
  ): Promise<MarkupRenderResponse> {
    this.logger.info('Rendering markup for project', { projectKey, type: request.type });

    try {
      const response = await this.apiClient.post<MarkupRenderResponse>(
        `/projects/${projectKey}/markup/render`,
        request
      );
      this.logger.info('Successfully rendered markup for project', {
        projectKey,
        type: request.type,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to render markup for project', { projectKey, request, error });
      throw error;
    }
  }

  /**
   * Preview markup for project context
   * POST /rest/api/1.0/projects/{projectKey}/markup/preview
   */
  async previewMarkupForProject(
    projectKey: string,
    request: MarkupPreviewRequest
  ): Promise<MarkupPreviewResponse> {
    this.logger.info('Previewing markup for project', { projectKey, type: request.type });

    try {
      const response = await this.apiClient.post<MarkupPreviewResponse>(
        `/projects/${projectKey}/markup/preview`,
        request
      );
      this.logger.info('Successfully previewed markup for project', {
        projectKey,
        type: request.type,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to preview markup for project', { projectKey, request, error });
      throw error;
    }
  }

  /**
   * Validate markup for project context
   * POST /rest/api/1.0/projects/{projectKey}/markup/validate
   */
  async validateMarkupForProject(
    projectKey: string,
    request: MarkupValidationRequest
  ): Promise<MarkupValidationResponse> {
    this.logger.info('Validating markup for project', { projectKey, type: request.type });

    try {
      const response = await this.apiClient.post<MarkupValidationResponse>(
        `/projects/${projectKey}/markup/validate`,
        request
      );
      this.logger.info('Successfully validated markup for project', {
        projectKey,
        type: request.type,
        valid: response.data.valid,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to validate markup for project', { projectKey, request, error });
      throw error;
    }
  }
}
