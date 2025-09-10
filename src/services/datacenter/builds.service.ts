/**
 * Builds and Deployments Service for Bitbucket Data Center REST API
 * Based on official documentation: https://developer.atlassian.com/server/bitbucket/rest/v906/intro/
 */

import {
  Build,
  BuildCreateRequest,
  BuildListResponse,
  BuildPlan,
  BuildPlanCreateRequest,
  BuildPlanListResponse,
  BuildPlanQueryParams,
  BuildPlanResponse,
  BuildPlanUpdateRequest,
  BuildQueryParams,
  BuildResponse,
  BuildUpdateRequest,
  Deployment,
  DeploymentCreateRequest,
  DeploymentListResponse,
  DeploymentQueryParams,
  DeploymentResponse,
  DeploymentUpdateRequest,
  Environment,
  EnvironmentCreateRequest,
  EnvironmentListResponse,
  EnvironmentQueryParams,
  EnvironmentResponse,
  EnvironmentUpdateRequest,
} from './types/builds.types.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';

export class BuildsService {
  private readonly apiClient: ApiClient;
  private readonly logger: Logger;

  constructor(apiClient: ApiClient, logger: Logger) {
    this.apiClient = apiClient;
    this.logger = logger;
  }

  // Build Management
  /**
   * Create a new build
   * POST /rest/api/1.0/builds
   */
  async createBuild(request: BuildCreateRequest): Promise<BuildResponse> {
    this.logger.info('Creating build', { name: request.name, planKey: request.planKey });

    try {
      const response = await this.apiClient.post<BuildResponse>('/builds', request);
      this.logger.info('Successfully created build', {
        id: response.data.id,
        name: response.data.name,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create build', { request, error });
      throw error;
    }
  }

  /**
   * Get build by ID
   * GET /rest/api/1.0/builds/{buildId}
   */
  async getBuild(buildId: number): Promise<BuildResponse> {
    this.logger.info('Getting build', { buildId });

    try {
      const response = await this.apiClient.get<BuildResponse>(`/builds/${buildId}`);
      this.logger.info('Successfully retrieved build', { buildId, name: response.data.name });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get build', { buildId, error });
      throw error;
    }
  }

  /**
   * Update build
   * PUT /rest/api/1.0/builds/{buildId}
   */
  async updateBuild(buildId: number, request: BuildUpdateRequest): Promise<BuildResponse> {
    this.logger.info('Updating build', { buildId, request });

    try {
      const response = await this.apiClient.put<BuildResponse>(`/builds/${buildId}`, request);
      this.logger.info('Successfully updated build', { buildId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update build', { buildId, request, error });
      throw error;
    }
  }

  /**
   * Delete build
   * DELETE /rest/api/1.0/builds/{buildId}
   */
  async deleteBuild(buildId: number): Promise<void> {
    this.logger.info('Deleting build', { buildId });

    try {
      await this.apiClient.delete(`/builds/${buildId}`);
      this.logger.info('Successfully deleted build', { buildId });
    } catch (error) {
      this.logger.error('Failed to delete build', { buildId, error });
      throw error;
    }
  }

  /**
   * List builds
   * GET /rest/api/1.0/builds
   */
  async listBuilds(params?: BuildQueryParams): Promise<BuildListResponse> {
    this.logger.info('Listing builds', { params });

    try {
      const response = await this.apiClient.get<BuildListResponse>('/builds', { params });
      this.logger.info('Successfully listed builds', { count: response.data.values.length });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list builds', { params, error });
      throw error;
    }
  }

  /**
   * Start build
   * POST /rest/api/1.0/builds/{buildId}/start
   */
  async startBuild(buildId: number): Promise<BuildResponse> {
    this.logger.info('Starting build', { buildId });

    try {
      const response = await this.apiClient.post<BuildResponse>(`/builds/${buildId}/start`);
      this.logger.info('Successfully started build', { buildId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to start build', { buildId, error });
      throw error;
    }
  }

  /**
   * Stop build
   * POST /rest/api/1.0/builds/{buildId}/stop
   */
  async stopBuild(buildId: number): Promise<BuildResponse> {
    this.logger.info('Stopping build', { buildId });

    try {
      const response = await this.apiClient.post<BuildResponse>(`/builds/${buildId}/stop`);
      this.logger.info('Successfully stopped build', { buildId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to stop build', { buildId, error });
      throw error;
    }
  }

  // Build Plan Management
  /**
   * Create a new build plan
   * POST /rest/api/1.0/builds/plans
   */
  async createBuildPlan(request: BuildPlanCreateRequest): Promise<BuildPlanResponse> {
    this.logger.info('Creating build plan', { key: request.key, name: request.name });

    try {
      const response = await this.apiClient.post<BuildPlanResponse>('/builds/plans', request);
      this.logger.info('Successfully created build plan', {
        id: response.data.id,
        key: response.data.key,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create build plan', { request, error });
      throw error;
    }
  }

  /**
   * Get build plan by ID
   * GET /rest/api/1.0/builds/plans/{planId}
   */
  async getBuildPlan(planId: number): Promise<BuildPlanResponse> {
    this.logger.info('Getting build plan', { planId });

    try {
      const response = await this.apiClient.get<BuildPlanResponse>(`/builds/plans/${planId}`);
      this.logger.info('Successfully retrieved build plan', { planId, key: response.data.key });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get build plan', { planId, error });
      throw error;
    }
  }

  /**
   * Update build plan
   * PUT /rest/api/1.0/builds/plans/{planId}
   */
  async updateBuildPlan(
    planId: number,
    request: BuildPlanUpdateRequest
  ): Promise<BuildPlanResponse> {
    this.logger.info('Updating build plan', { planId, request });

    try {
      const response = await this.apiClient.put<BuildPlanResponse>(
        `/builds/plans/${planId}`,
        request
      );
      this.logger.info('Successfully updated build plan', { planId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update build plan', { planId, request, error });
      throw error;
    }
  }

  /**
   * Delete build plan
   * DELETE /rest/api/1.0/builds/plans/{planId}
   */
  async deleteBuildPlan(planId: number): Promise<void> {
    this.logger.info('Deleting build plan', { planId });

    try {
      await this.apiClient.delete(`/builds/plans/${planId}`);
      this.logger.info('Successfully deleted build plan', { planId });
    } catch (error) {
      this.logger.error('Failed to delete build plan', { planId, error });
      throw error;
    }
  }

  /**
   * List build plans
   * GET /rest/api/1.0/builds/plans
   */
  async listBuildPlans(params?: BuildPlanQueryParams): Promise<BuildPlanListResponse> {
    this.logger.info('Listing build plans', { params });

    try {
      const response = await this.apiClient.get<BuildPlanListResponse>('/builds/plans', { params });
      this.logger.info('Successfully listed build plans', { count: response.data.values.length });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list build plans', { params, error });
      throw error;
    }
  }

  // Deployment Management
  /**
   * Create a new deployment
   * POST /rest/api/1.0/deployments
   */
  async createDeployment(request: DeploymentCreateRequest): Promise<DeploymentResponse> {
    this.logger.info('Creating deployment', {
      name: request.name,
      environmentId: request.environmentId,
    });

    try {
      const response = await this.apiClient.post<DeploymentResponse>('/deployments', request);
      this.logger.info('Successfully created deployment', {
        id: response.data.id,
        name: response.data.name,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create deployment', { request, error });
      throw error;
    }
  }

  /**
   * Get deployment by ID
   * GET /rest/api/1.0/deployments/{deploymentId}
   */
  async getDeployment(deploymentId: number): Promise<DeploymentResponse> {
    this.logger.info('Getting deployment', { deploymentId });

    try {
      const response = await this.apiClient.get<DeploymentResponse>(`/deployments/${deploymentId}`);
      this.logger.info('Successfully retrieved deployment', {
        deploymentId,
        name: response.data.name,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get deployment', { deploymentId, error });
      throw error;
    }
  }

  /**
   * Update deployment
   * PUT /rest/api/1.0/deployments/{deploymentId}
   */
  async updateDeployment(
    deploymentId: number,
    request: DeploymentUpdateRequest
  ): Promise<DeploymentResponse> {
    this.logger.info('Updating deployment', { deploymentId, request });

    try {
      const response = await this.apiClient.put<DeploymentResponse>(
        `/deployments/${deploymentId}`,
        request
      );
      this.logger.info('Successfully updated deployment', { deploymentId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update deployment', { deploymentId, request, error });
      throw error;
    }
  }

  /**
   * Delete deployment
   * DELETE /rest/api/1.0/deployments/{deploymentId}
   */
  async deleteDeployment(deploymentId: number): Promise<void> {
    this.logger.info('Deleting deployment', { deploymentId });

    try {
      await this.apiClient.delete(`/deployments/${deploymentId}`);
      this.logger.info('Successfully deleted deployment', { deploymentId });
    } catch (error) {
      this.logger.error('Failed to delete deployment', { deploymentId, error });
      throw error;
    }
  }

  /**
   * List deployments
   * GET /rest/api/1.0/deployments
   */
  async listDeployments(params?: DeploymentQueryParams): Promise<DeploymentListResponse> {
    this.logger.info('Listing deployments', { params });

    try {
      const response = await this.apiClient.get<DeploymentListResponse>('/deployments', { params });
      this.logger.info('Successfully listed deployments', { count: response.data.values.length });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list deployments', { params, error });
      throw error;
    }
  }

  /**
   * Start deployment
   * POST /rest/api/1.0/deployments/{deploymentId}/start
   */
  async startDeployment(deploymentId: number): Promise<DeploymentResponse> {
    this.logger.info('Starting deployment', { deploymentId });

    try {
      const response = await this.apiClient.post<DeploymentResponse>(
        `/deployments/${deploymentId}/start`
      );
      this.logger.info('Successfully started deployment', { deploymentId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to start deployment', { deploymentId, error });
      throw error;
    }
  }

  /**
   * Stop deployment
   * POST /rest/api/1.0/deployments/{deploymentId}/stop
   */
  async stopDeployment(deploymentId: number): Promise<DeploymentResponse> {
    this.logger.info('Stopping deployment', { deploymentId });

    try {
      const response = await this.apiClient.post<DeploymentResponse>(
        `/deployments/${deploymentId}/stop`
      );
      this.logger.info('Successfully stopped deployment', { deploymentId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to stop deployment', { deploymentId, error });
      throw error;
    }
  }

  // Environment Management
  /**
   * Create a new environment
   * POST /rest/api/1.0/environments
   */
  async createEnvironment(request: EnvironmentCreateRequest): Promise<EnvironmentResponse> {
    this.logger.info('Creating environment', { name: request.name, type: request.type });

    try {
      const response = await this.apiClient.post<EnvironmentResponse>('/environments', request);
      this.logger.info('Successfully created environment', {
        id: response.data.id,
        name: response.data.name,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create environment', { request, error });
      throw error;
    }
  }

  /**
   * Get environment by ID
   * GET /rest/api/1.0/environments/{environmentId}
   */
  async getEnvironment(environmentId: number): Promise<EnvironmentResponse> {
    this.logger.info('Getting environment', { environmentId });

    try {
      const response = await this.apiClient.get<EnvironmentResponse>(
        `/environments/${environmentId}`
      );
      this.logger.info('Successfully retrieved environment', {
        environmentId,
        name: response.data.name,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get environment', { environmentId, error });
      throw error;
    }
  }

  /**
   * Update environment
   * PUT /rest/api/1.0/environments/{environmentId}
   */
  async updateEnvironment(
    environmentId: number,
    request: EnvironmentUpdateRequest
  ): Promise<EnvironmentResponse> {
    this.logger.info('Updating environment', { environmentId, request });

    try {
      const response = await this.apiClient.put<EnvironmentResponse>(
        `/environments/${environmentId}`,
        request
      );
      this.logger.info('Successfully updated environment', { environmentId });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update environment', { environmentId, request, error });
      throw error;
    }
  }

  /**
   * Delete environment
   * DELETE /rest/api/1.0/environments/{environmentId}
   */
  async deleteEnvironment(environmentId: number): Promise<void> {
    this.logger.info('Deleting environment', { environmentId });

    try {
      await this.apiClient.delete(`/environments/${environmentId}`);
      this.logger.info('Successfully deleted environment', { environmentId });
    } catch (error) {
      this.logger.error('Failed to delete environment', { environmentId, error });
      throw error;
    }
  }

  /**
   * List environments
   * GET /rest/api/1.0/environments
   */
  async listEnvironments(params?: EnvironmentQueryParams): Promise<EnvironmentListResponse> {
    this.logger.info('Listing environments', { params });

    try {
      const response = await this.apiClient.get<EnvironmentListResponse>('/environments', {
        params,
      });
      this.logger.info('Successfully listed environments', { count: response.data.values.length });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list environments', { params, error });
      throw error;
    }
  }
}
