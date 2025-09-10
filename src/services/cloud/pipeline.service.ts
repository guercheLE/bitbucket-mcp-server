/**
 * Pipeline Service for Bitbucket Cloud REST API
 * Handles all pipeline-related operations
 * Based on: https://developer.atlassian.com/cloud/bitbucket/rest/api-group-pipelines/
 */

import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';
import { PagedResponse, PaginationParams, ErrorResponse } from './types/base.types.js';
import {
  Pipeline,
  PipelineStep,
  PipelineVariable,
  PipelineSchedule,
  PipelineConfiguration,
  PipelineCacheInfo,
  CreatePipelineRequest,
  CreatePipelineVariableRequest,
  UpdatePipelineVariableRequest,
  CreatePipelineScheduleRequest,
  UpdatePipelineScheduleRequest,
  ListPipelinesParams,
  GetPipelineParams,
  ListPipelineStepsParams,
  GetPipelineStepParams,
  GetPipelineLogParams,
  StopPipelineParams,
  ListPipelineVariablesParams,
  CreatePipelineVariableParams,
  UpdatePipelineVariableParams,
  DeletePipelineVariableParams,
  ListPipelineSchedulesParams,
  CreatePipelineScheduleParams,
  UpdatePipelineScheduleParams,
  DeletePipelineScheduleParams,
  GetPipelineVariableParams,
  GetPipelineScheduleParams,
  ListPipelineCachesParams,
  DeletePipelineCacheParams,
  GetPipelineCacheContentUriParams,
} from './types/pipeline.types.js';

export class PipelineService {
  private apiClient: ApiClient;
  private logger: Logger;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.logger = Logger.forContext('PipelineService');
  }

  /**
   * List pipelines
   */
  async listPipelines(params: ListPipelinesParams): Promise<PagedResponse<Pipeline>> {
    this.logger.info('Listing pipelines', { params });

    try {
      const queryParams: Record<string, any> = {
        page: params.page,
        pagelen: params.pagelen,
      };

      if (params.sort) queryParams.sort = params.sort;
      if (params.q) queryParams.q = params.q;

      const response = await this.apiClient.get<PagedResponse<Pipeline>>(
        `/repositories/${params.workspace}/${params.repo_slug}/pipelines`,
        { params: queryParams }
      );

      this.logger.info('Successfully listed pipelines', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list pipelines', { params, error });
      throw error;
    }
  }

  /**
   * Run a pipeline
   */
  async runPipeline(params: {
    workspace: string;
    repo_slug: string;
    pipeline: CreatePipelineRequest;
  }): Promise<Pipeline> {
    this.logger.info('Running pipeline', { params });

    try {
      const response = await this.apiClient.post<Pipeline>(
        `/repositories/${params.workspace}/${params.repo_slug}/pipelines`,
        params.pipeline
      );

      this.logger.info('Successfully started pipeline', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        pipeline_uuid: response.data.uuid,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to run pipeline', { params, error });
      throw error;
    }
  }

  /**
   * Get a pipeline
   */
  async getPipeline(params: GetPipelineParams): Promise<Pipeline> {
    this.logger.info('Getting pipeline', { params });

    try {
      const response = await this.apiClient.get<Pipeline>(
        `/repositories/${params.workspace}/${params.repo_slug}/pipelines/${params.pipeline_uuid}`
      );

      this.logger.info('Successfully retrieved pipeline', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        pipeline_uuid: params.pipeline_uuid,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get pipeline', { params, error });
      throw error;
    }
  }

  /**
   * List steps for a pipeline
   */
  async listPipelineSteps(params: ListPipelineStepsParams): Promise<PagedResponse<PipelineStep>> {
    this.logger.info('Listing pipeline steps', { params });

    try {
      const response = await this.apiClient.get<PagedResponse<PipelineStep>>(
        `/repositories/${params.workspace}/${params.repo_slug}/pipelines/${params.pipeline_uuid}/steps`,
        { params: { page: params.page, pagelen: params.pagelen } }
      );

      this.logger.info('Successfully listed pipeline steps', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        pipeline_uuid: params.pipeline_uuid,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list pipeline steps', { params, error });
      throw error;
    }
  }

  /**
   * Get a step of a pipeline
   */
  async getPipelineStep(params: GetPipelineStepParams): Promise<PipelineStep> {
    this.logger.info('Getting pipeline step', { params });

    try {
      const response = await this.apiClient.get<PipelineStep>(
        `/repositories/${params.workspace}/${params.repo_slug}/pipelines/${params.pipeline_uuid}/steps/${params.step_uuid}`
      );

      this.logger.info('Successfully retrieved pipeline step', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        pipeline_uuid: params.pipeline_uuid,
        step_uuid: params.step_uuid,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get pipeline step', { params, error });
      throw error;
    }
  }

  /**
   * Get log file for a step
   */
  async getPipelineStepLog(params: GetPipelineLogParams): Promise<any> {
    this.logger.info('Getting pipeline step log', { params });

    try {
      const url = params.log_uuid
        ? `/repositories/${params.workspace}/${params.repo_slug}/pipelines/${params.pipeline_uuid}/steps/${params.step_uuid}/logs/${params.log_uuid}`
        : `/repositories/${params.workspace}/${params.repo_slug}/pipelines/${params.pipeline_uuid}/steps/${params.step_uuid}/log`;

      const response = await this.apiClient.get(url);

      this.logger.info('Successfully retrieved pipeline step log', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        pipeline_uuid: params.pipeline_uuid,
        step_uuid: params.step_uuid,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get pipeline step log', { params, error });
      throw error;
    }
  }

  /**
   * Stop a pipeline
   */
  async stopPipeline(params: StopPipelineParams): Promise<void> {
    this.logger.info('Stopping pipeline', { params });

    try {
      await this.apiClient.post(
        `/repositories/${params.workspace}/${params.repo_slug}/pipelines/${params.pipeline_uuid}/stopPipeline`
      );

      this.logger.info('Successfully stopped pipeline', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        pipeline_uuid: params.pipeline_uuid,
      });
    } catch (error) {
      this.logger.error('Failed to stop pipeline', { params, error });
      throw error;
    }
  }

  /**
   * Get configuration
   */
  async getConfiguration(params: {
    workspace: string;
    repo_slug: string;
  }): Promise<PipelineConfiguration> {
    this.logger.info('Getting pipeline configuration', { params });

    try {
      const response = await this.apiClient.get<PipelineConfiguration>(
        `/repositories/${params.workspace}/${params.repo_slug}/pipelines_config`
      );

      this.logger.info('Successfully retrieved pipeline configuration', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get pipeline configuration', { params, error });
      throw error;
    }
  }

  /**
   * Update configuration
   */
  async updateConfiguration(params: {
    workspace: string;
    repo_slug: string;
    config: Partial<PipelineConfiguration>;
  }): Promise<PipelineConfiguration> {
    this.logger.info('Updating pipeline configuration', { params });

    try {
      const response = await this.apiClient.put<PipelineConfiguration>(
        `/repositories/${params.workspace}/${params.repo_slug}/pipelines_config`,
        params.config
      );

      this.logger.info('Successfully updated pipeline configuration', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update pipeline configuration', { params, error });
      throw error;
    }
  }

  /**
   * Update the next build number
   */
  async updateNextBuildNumber(params: {
    workspace: string;
    repo_slug: string;
    build_number: number;
  }): Promise<void> {
    this.logger.info('Updating next build number', { params });

    try {
      await this.apiClient.put(
        `/repositories/${params.workspace}/${params.repo_slug}/pipelines_config/build_number`,
        { build_number: params.build_number }
      );

      this.logger.info('Successfully updated next build number', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        build_number: params.build_number,
      });
    } catch (error) {
      this.logger.error('Failed to update next build number', { params, error });
      throw error;
    }
  }

  /**
   * List schedules
   */
  async listSchedules(
    params: ListPipelineSchedulesParams
  ): Promise<PagedResponse<PipelineSchedule>> {
    this.logger.info('Listing pipeline schedules', { params });

    try {
      const response = await this.apiClient.get<PagedResponse<PipelineSchedule>>(
        `/repositories/${params.workspace}/${params.repo_slug}/pipelines_config/schedules`,
        { params: { page: params.page, pagelen: params.pagelen } }
      );

      this.logger.info('Successfully listed pipeline schedules', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list pipeline schedules', { params, error });
      throw error;
    }
  }

  /**
   * Create a schedule
   */
  async createSchedule(params: CreatePipelineScheduleParams): Promise<PipelineSchedule> {
    this.logger.info('Creating pipeline schedule', { params });

    try {
      const response = await this.apiClient.post<PipelineSchedule>(
        `/repositories/${params.workspace}/${params.repo_slug}/pipelines_config/schedules`,
        params.schedule
      );

      this.logger.info('Successfully created pipeline schedule', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        schedule_uuid: response.data.uuid,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create pipeline schedule', { params, error });
      throw error;
    }
  }

  /**
   * Get a schedule
   */
  async getSchedule(params: {
    workspace: string;
    repo_slug: string;
    schedule_uuid: string;
  }): Promise<PipelineSchedule> {
    this.logger.info('Getting pipeline schedule', { params });

    try {
      const response = await this.apiClient.get<PipelineSchedule>(
        `/repositories/${params.workspace}/${params.repo_slug}/pipelines_config/schedules/${params.schedule_uuid}`
      );

      this.logger.info('Successfully retrieved pipeline schedule', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        schedule_uuid: params.schedule_uuid,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get pipeline schedule', { params, error });
      throw error;
    }
  }

  /**
   * Update a schedule
   */
  async updateSchedule(params: UpdatePipelineScheduleParams): Promise<PipelineSchedule> {
    this.logger.info('Updating pipeline schedule', { params });

    try {
      const response = await this.apiClient.put<PipelineSchedule>(
        `/repositories/${params.workspace}/${params.repo_slug}/pipelines_config/schedules/${params.schedule_uuid}`,
        params.schedule
      );

      this.logger.info('Successfully updated pipeline schedule', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        schedule_uuid: params.schedule_uuid,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update pipeline schedule', { params, error });
      throw error;
    }
  }

  /**
   * Delete a schedule
   */
  async deleteSchedule(params: DeletePipelineScheduleParams): Promise<void> {
    this.logger.info('Deleting pipeline schedule', { params });

    try {
      await this.apiClient.delete(
        `/repositories/${params.workspace}/${params.repo_slug}/pipelines_config/schedules/${params.schedule_uuid}`
      );

      this.logger.info('Successfully deleted pipeline schedule', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        schedule_uuid: params.schedule_uuid,
      });
    } catch (error) {
      this.logger.error('Failed to delete pipeline schedule', { params, error });
      throw error;
    }
  }

  /**
   * List variables for a repository
   */
  async listVariables(
    params: ListPipelineVariablesParams
  ): Promise<PagedResponse<PipelineVariable>> {
    this.logger.info('Listing pipeline variables', { params });

    try {
      const url = params.environment_uuid
        ? `/repositories/${params.workspace}/${params.repo_slug}/deployments_config/environments/${params.environment_uuid}/variables`
        : `/repositories/${params.workspace}/${params.repo_slug}/pipelines_config/variables`;

      const response = await this.apiClient.get<PagedResponse<PipelineVariable>>(url, {
        params: { page: params.page, pagelen: params.pagelen },
      });

      this.logger.info('Successfully listed pipeline variables', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list pipeline variables', { params, error });
      throw error;
    }
  }

  /**
   * Create a variable for a repository
   */
  async createVariable(params: CreatePipelineVariableParams): Promise<PipelineVariable> {
    this.logger.info('Creating pipeline variable', { params });

    try {
      const url = params.environment_uuid
        ? `/repositories/${params.workspace}/${params.repo_slug}/deployments_config/environments/${params.environment_uuid}/variables`
        : `/repositories/${params.workspace}/${params.repo_slug}/pipelines_config/variables`;

      const response = await this.apiClient.post<PipelineVariable>(url, params.variable);

      this.logger.info('Successfully created pipeline variable', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        variable_uuid: response.data.uuid,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create pipeline variable', { params, error });
      throw error;
    }
  }

  /**
   * Get a variable for a repository
   */
  async getVariable(params: {
    workspace: string;
    repo_slug: string;
    variable_uuid: string;
    environment_uuid?: string;
  }): Promise<PipelineVariable> {
    this.logger.info('Getting pipeline variable', { params });

    try {
      const url = params.environment_uuid
        ? `/repositories/${params.workspace}/${params.repo_slug}/deployments_config/environments/${params.environment_uuid}/variables/${params.variable_uuid}`
        : `/repositories/${params.workspace}/${params.repo_slug}/pipelines_config/variables/${params.variable_uuid}`;

      const response = await this.apiClient.get<PipelineVariable>(url);

      this.logger.info('Successfully retrieved pipeline variable', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        variable_uuid: params.variable_uuid,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get pipeline variable', { params, error });
      throw error;
    }
  }

  /**
   * Update a variable for a repository
   */
  async updateVariable(params: UpdatePipelineVariableParams): Promise<PipelineVariable> {
    this.logger.info('Updating pipeline variable', { params });

    try {
      const url = params.environment_uuid
        ? `/repositories/${params.workspace}/${params.repo_slug}/deployments_config/environments/${params.environment_uuid}/variables/${params.variable_uuid}`
        : `/repositories/${params.workspace}/${params.repo_slug}/pipelines_config/variables/${params.variable_uuid}`;

      const response = await this.apiClient.put<PipelineVariable>(url, params.variable);

      this.logger.info('Successfully updated pipeline variable', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        variable_uuid: params.variable_uuid,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update pipeline variable', { params, error });
      throw error;
    }
  }

  /**
   * Delete a variable for a repository
   */
  async deleteVariable(params: DeletePipelineVariableParams): Promise<void> {
    this.logger.info('Deleting pipeline variable', { params });

    try {
      const url = params.environment_uuid
        ? `/repositories/${params.workspace}/${params.repo_slug}/deployments_config/environments/${params.environment_uuid}/variables/${params.variable_uuid}`
        : `/repositories/${params.workspace}/${params.repo_slug}/pipelines_config/variables/${params.variable_uuid}`;

      await this.apiClient.delete(url);

      this.logger.info('Successfully deleted pipeline variable', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        variable_uuid: params.variable_uuid,
      });
    } catch (error) {
      this.logger.error('Failed to delete pipeline variable', { params, error });
      throw error;
    }
  }

  /**
   * List caches
   */
  async listCaches(params: {
    workspace: string;
    repo_slug: string;
  }): Promise<PagedResponse<PipelineCacheInfo>> {
    this.logger.info('Listing pipeline caches', { params });

    try {
      const response = await this.apiClient.get<PagedResponse<PipelineCacheInfo>>(
        `/repositories/${params.workspace}/${params.repo_slug}/pipelines-config/caches`
      );

      this.logger.info('Successfully listed pipeline caches', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        count: response.data.values.length,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list pipeline caches', { params, error });
      throw error;
    }
  }

  /**
   * Delete caches
   */
  async deleteCaches(params: { workspace: string; repo_slug: string }): Promise<void> {
    this.logger.info('Deleting pipeline caches', { params });

    try {
      await this.apiClient.delete(
        `/repositories/${params.workspace}/${params.repo_slug}/pipelines-config/caches`
      );

      this.logger.info('Successfully deleted pipeline caches', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
      });
    } catch (error) {
      this.logger.error('Failed to delete pipeline caches', { params, error });
      throw error;
    }
  }

  /**
   * Delete a cache
   */
  async deleteCache(params: {
    workspace: string;
    repo_slug: string;
    cache_uuid: string;
  }): Promise<void> {
    this.logger.info('Deleting pipeline cache', { params });

    try {
      await this.apiClient.delete(
        `/repositories/${params.workspace}/${params.repo_slug}/pipelines-config/caches/${params.cache_uuid}`
      );

      this.logger.info('Successfully deleted pipeline cache', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        cache_uuid: params.cache_uuid,
      });
    } catch (error) {
      this.logger.error('Failed to delete pipeline cache', { params, error });
      throw error;
    }
  }

  /**
   * Get cache content URI
   */
  async getCacheContentUri(params: {
    workspace: string;
    repo_slug: string;
    cache_uuid: string;
  }): Promise<{ content_uri: string }> {
    this.logger.info('Getting cache content URI', { params });

    try {
      const response = await this.apiClient.get<{ content_uri: string }>(
        `/repositories/${params.workspace}/${params.repo_slug}/pipelines-config/caches/${params.cache_uuid}/content-uri`
      );

      this.logger.info('Successfully retrieved cache content URI', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        cache_uuid: params.cache_uuid,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get cache content URI', { params, error });
      throw error;
    }
  }
}
