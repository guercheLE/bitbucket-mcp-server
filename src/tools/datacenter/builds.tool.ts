/**
 * Data Center Builds Tools
 * Ferramentas para gerenciamento de builds no Bitbucket Data Center
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPool, Pool } from 'generic-pool';
import { BuildsService } from '../../services/datacenter/builds.service.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';
import { createMcpResponse, createErrorResponse } from '../../services/types/base.types.js';
import { z } from 'zod';

// Zod schemas for parameter validation
const CreateBuildSchema = z.object({
  name: z.string(),
  planKey: z.string(),
  branch: z.string().optional(),
  commit: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetBuildSchema = z.object({
  buildId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateBuildSchema = z.object({
  buildId: z.number(),
  name: z.string().optional(),
  description: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteBuildSchema = z.object({
  buildId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListBuildsSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const StartBuildSchema = z.object({
  buildId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const StopBuildSchema = z.object({
  buildId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateBuildPlanSchema = z.object({
  name: z.string(),
  projectKey: z.string(),
  repositorySlug: z.string(),
  description: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetBuildPlanSchema = z.object({
  planKey: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateBuildPlanSchema = z.object({
  planKey: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteBuildPlanSchema = z.object({
  planKey: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListBuildPlansSchema = z.object({
  projectKey: z.string().optional(),
  repositorySlug: z.string().optional(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateDeploymentSchema = z.object({
  name: z.string(),
  environmentId: z.number(),
  buildKey: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetDeploymentSchema = z.object({
  deploymentId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateDeploymentSchema = z.object({
  deploymentId: z.number(),
  name: z.string().optional(),
  description: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteDeploymentSchema = z.object({
  deploymentId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListDeploymentsSchema = z.object({
  environmentId: z.number().optional(),
  status: z.string().optional(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const StartDeploymentSchema = z.object({
  deploymentId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const StopDeploymentSchema = z.object({
  deploymentId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateEnvironmentSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetEnvironmentSchema = z.object({
  environmentId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateEnvironmentSchema = z.object({
  environmentId: z.number(),
  name: z.string().optional(),
  description: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteEnvironmentSchema = z.object({
  environmentId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListEnvironmentsSchema = z.object({
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

/**
 * Builds Tools for Bitbucket Data Center
 *
 * Comprehensive build management including:
 * - Build management
 * - Build plan management
 * - Deployment management
 * - Environment management
 */
export class DataCenterBuildsTools {
  private static logger = Logger.forContext('DataCenterBuildsTools');
  private static buildsServicePool: Pool<BuildsService>;

  static initialize(): void {
    const buildsServiceFactory = {
      create: async () => new BuildsService(new ApiClient(), Logger.forContext('BuildsService')),
      destroy: async () => {},
    };

    this.buildsServicePool = createPool(buildsServiceFactory, {
      min: 2,
      max: 10,
    });
    this.logger.info('Data Center Builds tools initialized');
  }

  // Build Management Methods
  /**
   * Create a new build
   */
  static async createBuild(
    name: string,
    planKey: string,
    request: { branch?: string; commit?: string },
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('createBuild');
    let service: BuildsService | null = null;

    try {
      service = await this.buildsServicePool.acquire();
      methodLogger.debug('Creating build:', {
        name,
        planKey,
        branch: request.branch,
        commit: request.commit,
      });

      const result = await service.createBuild({
        name,
        planKey,
        description: request.branch ? `Branch: ${request.branch}` : undefined,
      });

      methodLogger.info('Successfully created build');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create build:', error);
      if (service) {
        this.buildsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.buildsServicePool.release(service);
      }
    }
  }

  /**
   * Get build by ID
   */
  static async getBuild(buildId: number, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getBuild');
    let service: BuildsService | null = null;

    try {
      service = await this.buildsServicePool.acquire();
      methodLogger.debug('Getting build:', { buildId });

      const result = await service.getBuild(buildId);

      methodLogger.info('Successfully retrieved build');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get build:', error);
      if (service) {
        this.buildsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.buildsServicePool.release(service);
      }
    }
  }

  /**
   * Update build
   */
  static async updateBuild(
    buildId: number,
    name: string,
    description: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('updateBuild');
    let service: BuildsService | null = null;

    try {
      service = await this.buildsServicePool.acquire();
      methodLogger.debug('Updating build:', { buildId, name });

      const result = await service.updateBuild(buildId, {
        name,
        description,
      });

      methodLogger.info('Successfully updated build');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update build:', error);
      if (service) {
        this.buildsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.buildsServicePool.release(service);
      }
    }
  }

  /**
   * Delete build
   */
  static async deleteBuild(buildId: number, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('deleteBuild');
    let service: BuildsService | null = null;

    try {
      service = await this.buildsServicePool.acquire();
      methodLogger.debug('Deleting build:', { buildId });

      await service.deleteBuild(buildId);

      methodLogger.info('Successfully deleted build');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to delete build:', error);
      if (service) {
        this.buildsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.buildsServicePool.release(service);
      }
    }
  }

  /**
   * List builds
   */
  static async listBuilds(output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('listBuilds');
    let service: BuildsService | null = null;

    try {
      service = await this.buildsServicePool.acquire();
      methodLogger.debug('Listing builds');

      const result = await service.listBuilds();

      methodLogger.info('Successfully listed builds');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list builds:', error);
      if (service) {
        this.buildsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.buildsServicePool.release(service);
      }
    }
  }

  /**
   * Start build
   */
  static async startBuild(buildId: number, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('startBuild');
    let service: BuildsService | null = null;

    try {
      service = await this.buildsServicePool.acquire();
      methodLogger.debug('Starting build:', { buildId });

      const result = await service.startBuild(buildId);

      methodLogger.info('Successfully started build');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to start build:', error);
      if (service) {
        this.buildsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.buildsServicePool.release(service);
      }
    }
  }

  /**
   * Stop build
   */
  static async stopBuild(buildId: number, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('stopBuild');
    let service: BuildsService | null = null;

    try {
      service = await this.buildsServicePool.acquire();
      methodLogger.debug('Stopping build:', { buildId });

      const result = await service.stopBuild(buildId);

      methodLogger.info('Successfully stopped build');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to stop build:', error);
      if (service) {
        this.buildsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.buildsServicePool.release(service);
      }
    }
  }

  // Build Plan Management Methods
  /**
   * Create a new build plan
   */
  static async createBuildPlan(
    name: string,
    projectKey: string,
    repositorySlug: string,
    description: string | undefined,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('createBuildPlan');
    let service: BuildsService | null = null;

    try {
      service = await this.buildsServicePool.acquire();
      methodLogger.debug('Creating build plan:', {
        name,
        projectKey,
        repositorySlug,
      });

      const result = await service.createBuildPlan({
        key: `${projectKey}-${name.toUpperCase().replace(/\s+/g, '-')}`,
        name,
        description,
        type: 'JAVA',
        projectKey,
        repositorySlug,
      });

      methodLogger.info('Successfully created build plan');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create build plan:', error);
      if (service) {
        this.buildsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.buildsServicePool.release(service);
      }
    }
  }

  /**
   * Get build plan by key
   */
  static async getBuildPlan(planKey: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getBuildPlan');
    let service: BuildsService | null = null;

    try {
      service = await this.buildsServicePool.acquire();
      methodLogger.debug('Getting build plan:', { planKey });

      const result = await service.getBuildPlan(parseInt(planKey));

      methodLogger.info('Successfully retrieved build plan');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get build plan:', error);
      if (service) {
        this.buildsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.buildsServicePool.release(service);
      }
    }
  }

  /**
   * Update build plan
   */
  static async updateBuildPlan(
    planKey: string,
    name: string | undefined,
    description: string | undefined,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('updateBuildPlan');
    let service: BuildsService | null = null;

    try {
      service = await this.buildsServicePool.acquire();
      methodLogger.debug('Updating build plan:', { planKey, name });

      const result = await service.updateBuildPlan(parseInt(planKey), {
        name,
        description,
      });

      methodLogger.info('Successfully updated build plan');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update build plan:', error);
      if (service) {
        this.buildsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.buildsServicePool.release(service);
      }
    }
  }

  /**
   * Delete build plan
   */
  static async deleteBuildPlan(planKey: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('deleteBuildPlan');
    let service: BuildsService | null = null;

    try {
      service = await this.buildsServicePool.acquire();
      methodLogger.debug('Deleting build plan:', { planKey });

      await service.deleteBuildPlan(parseInt(planKey));

      methodLogger.info('Successfully deleted build plan');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to delete build plan:', error);
      if (service) {
        this.buildsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.buildsServicePool.release(service);
      }
    }
  }

  /**
   * List build plans
   */
  static async listBuildPlans(
    projectKey: string | undefined,
    repositorySlug: string | undefined,
    start: number | undefined,
    limit: number | undefined,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('listBuildPlans');
    let service: BuildsService | null = null;

    try {
      service = await this.buildsServicePool.acquire();
      methodLogger.debug('Listing build plans:', {
        projectKey,
        repositorySlug,
        start,
        limit,
      });

      const result = await service.listBuildPlans({
        projectKey,
        repositorySlug,
        start,
        limit,
      });

      methodLogger.info('Successfully listed build plans');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list build plans:', error);
      if (service) {
        this.buildsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.buildsServicePool.release(service);
      }
    }
  }

  // Deployment Management Methods
  /**
   * Create a new deployment
   */
  static async createDeployment(
    name: string,
    environmentId: number,
    buildKey: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('createDeployment');
    let service: BuildsService | null = null;

    try {
      service = await this.buildsServicePool.acquire();
      methodLogger.debug('Creating deployment:', {
        name,
        environmentId,
        buildKey,
      });

      const result = await service.createDeployment({
        name,
        environmentId,
        buildId: parseInt(buildKey),
      });

      methodLogger.info('Successfully created deployment');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create deployment:', error);
      if (service) {
        this.buildsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.buildsServicePool.release(service);
      }
    }
  }

  /**
   * Get deployment by ID
   */
  static async getDeployment(deploymentId: number, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getDeployment');
    let service: BuildsService | null = null;

    try {
      service = await this.buildsServicePool.acquire();
      methodLogger.debug('Getting deployment:', { deploymentId });

      const result = await service.getDeployment(deploymentId);

      methodLogger.info('Successfully retrieved deployment');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get deployment:', error);
      if (service) {
        this.buildsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.buildsServicePool.release(service);
      }
    }
  }

  /**
   * Update deployment
   */
  static async updateDeployment(
    deploymentId: number,
    name: string | undefined,
    description: string | undefined,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('updateDeployment');
    let service: BuildsService | null = null;

    try {
      service = await this.buildsServicePool.acquire();
      methodLogger.debug('Updating deployment:', { deploymentId, name });

      const result = await service.updateDeployment(deploymentId, {
        name,
        description,
      });

      methodLogger.info('Successfully updated deployment');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update deployment:', error);
      if (service) {
        this.buildsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.buildsServicePool.release(service);
      }
    }
  }

  /**
   * Delete deployment
   */
  static async deleteDeployment(deploymentId: number, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('deleteDeployment');
    let service: BuildsService | null = null;

    try {
      service = await this.buildsServicePool.acquire();
      methodLogger.debug('Deleting deployment:', { deploymentId });

      await service.deleteDeployment(deploymentId);

      methodLogger.info('Successfully deleted deployment');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to delete deployment:', error);
      if (service) {
        this.buildsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.buildsServicePool.release(service);
      }
    }
  }

  /**
   * List deployments
   */
  static async listDeployments(
    environmentId: number | undefined,
    status: string | undefined,
    start: number | undefined,
    limit: number | undefined,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('listDeployments');
    let service: BuildsService | null = null;

    try {
      service = await this.buildsServicePool.acquire();
      methodLogger.debug('Listing deployments:', {
        environmentId,
        status,
        start,
        limit,
      });

      const result = await service.listDeployments({
        environmentId,
        state: status as any,
        start,
        limit,
      });

      methodLogger.info('Successfully listed deployments');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list deployments:', error);
      if (service) {
        this.buildsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.buildsServicePool.release(service);
      }
    }
  }

  /**
   * Start deployment
   */
  static async startDeployment(deploymentId: number, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('startDeployment');
    let service: BuildsService | null = null;

    try {
      service = await this.buildsServicePool.acquire();
      methodLogger.debug('Starting deployment:', { deploymentId });

      const result = await service.startDeployment(deploymentId);

      methodLogger.info('Successfully started deployment');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to start deployment:', error);
      if (service) {
        this.buildsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.buildsServicePool.release(service);
      }
    }
  }

  /**
   * Stop deployment
   */
  static async stopDeployment(deploymentId: number, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('stopDeployment');
    let service: BuildsService | null = null;

    try {
      service = await this.buildsServicePool.acquire();
      methodLogger.debug('Stopping deployment:', { deploymentId });

      const result = await service.stopDeployment(deploymentId);

      methodLogger.info('Successfully stopped deployment');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to stop deployment:', error);
      if (service) {
        this.buildsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.buildsServicePool.release(service);
      }
    }
  }

  // Environment Management Methods
  /**
   * Create a new environment
   */
  static async createEnvironment(
    name: string,
    description: string | undefined,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('createEnvironment');
    let service: BuildsService | null = null;

    try {
      service = await this.buildsServicePool.acquire();
      methodLogger.debug('Creating environment:', { name });

      const result = await service.createEnvironment({
        name,
        description,
        type: 'TEST',
        projectKey: 'DEFAULT',
      });

      methodLogger.info('Successfully created environment');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create environment:', error);
      if (service) {
        this.buildsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.buildsServicePool.release(service);
      }
    }
  }

  /**
   * Get environment by ID
   */
  static async getEnvironment(environmentId: number, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getEnvironment');
    let service: BuildsService | null = null;

    try {
      service = await this.buildsServicePool.acquire();
      methodLogger.debug('Getting environment:', { environmentId });

      const result = await service.getEnvironment(environmentId);

      methodLogger.info('Successfully retrieved environment');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get environment:', error);
      if (service) {
        this.buildsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.buildsServicePool.release(service);
      }
    }
  }

  /**
   * Update environment
   */
  static async updateEnvironment(
    environmentId: number,
    name: string | undefined,
    description: string | undefined,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('updateEnvironment');
    let service: BuildsService | null = null;

    try {
      service = await this.buildsServicePool.acquire();
      methodLogger.debug('Updating environment:', { environmentId, name });

      const result = await service.updateEnvironment(environmentId, {
        name,
        description,
      });

      methodLogger.info('Successfully updated environment');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update environment:', error);
      if (service) {
        this.buildsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.buildsServicePool.release(service);
      }
    }
  }

  /**
   * Delete environment
   */
  static async deleteEnvironment(environmentId: number, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('deleteEnvironment');
    let service: BuildsService | null = null;

    try {
      service = await this.buildsServicePool.acquire();
      methodLogger.debug('Deleting environment:', { environmentId });

      await service.deleteEnvironment(environmentId);

      methodLogger.info('Successfully deleted environment');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to delete environment:', error);
      if (service) {
        this.buildsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.buildsServicePool.release(service);
      }
    }
  }

  /**
   * List environments
   */
  static async listEnvironments(
    start: number | undefined,
    limit: number | undefined,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('listEnvironments');
    let service: BuildsService | null = null;

    try {
      service = await this.buildsServicePool.acquire();
      methodLogger.debug('Listing environments:', { start, limit });

      const result = await service.listEnvironments({ start, limit });

      methodLogger.info('Successfully listed environments');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list environments:', error);
      if (service) {
        this.buildsServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.buildsServicePool.release(service);
      }
    }
  }

  /**
   * Register all builds tools with the MCP server
   */
  static register(server: McpServer): void {
    const registerLogger = this.logger.forMethod('register');

    // Initialize the service
    this.initialize();

    // Build Management Tools
    server.registerTool(
      'builds_create',
      {
        description: `Cria um novo build.

**Funcionalidades:**
- Criação de builds
- Configuração de parâmetros
- Execução de builds

**Parâmetros:**
- \`name\`: Nome do build
- \`planKey\`: Chave do plano de build
- \`branch\`: Branch do repositório (opcional)
- \`commit\`: Commit específico (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com os detalhes do build criado.`,
        inputSchema: CreateBuildSchema.shape,
      },
      async (params: z.infer<typeof CreateBuildSchema>) => {
        const validatedParams = CreateBuildSchema.parse(params);
        return this.createBuild(
          validatedParams.name,
          validatedParams.planKey,
          {
            branch: validatedParams.branch,
            commit: validatedParams.commit,
          },
          validatedParams.output
        );
      }
    );

    server.registerTool(
      'builds_get',
      {
        description: `Obtém detalhes de um build específico.

**Funcionalidades:**
- Informações detalhadas do build
- Status e metadados
- Logs e resultados

**Parâmetros:**
- \`buildId\`: ID do build
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com os detalhes do build.`,
        inputSchema: GetBuildSchema.shape,
      },
      async (params: z.infer<typeof GetBuildSchema>) => {
        const validatedParams = GetBuildSchema.parse(params);
        return this.getBuild(validatedParams.buildId, validatedParams.output);
      }
    );

    server.registerTool(
      'builds_update',
      {
        description: `Atualiza um build existente.

**Funcionalidades:**
- Modificação de builds existentes
- Atualização de status
- Ajuste de configurações

**Parâmetros:**
- \`buildId\`: ID do build
- \`name\`: Novo nome do build (opcional)
- \`description\`: Nova descrição do build (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com os detalhes do build atualizado.`,
        inputSchema: UpdateBuildSchema.shape,
      },
      async (params: z.infer<typeof UpdateBuildSchema>) => {
        const validatedParams = UpdateBuildSchema.parse(params);
        return this.updateBuild(
          validatedParams.buildId,
          validatedParams.name || '',
          validatedParams.description || '',
          validatedParams.output
        );
      }
    );

    server.registerTool(
      'builds_delete',
      {
        description: `Remove um build.

**Funcionalidades:**
- Remoção de builds
- Limpeza de builds obsoletos
- Controle de histórico

**Parâmetros:**
- \`buildId\`: ID do build
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com a confirmação da remoção.`,
        inputSchema: DeleteBuildSchema.shape,
      },
      async (params: z.infer<typeof DeleteBuildSchema>) => {
        const validatedParams = DeleteBuildSchema.parse(params);
        return this.deleteBuild(validatedParams.buildId, validatedParams.output);
      }
    );

    server.registerTool(
      'builds_list',
      {
        description: `Lista builds com filtros opcionais.

**Funcionalidades:**
- Listagem de builds com paginação
- Filtros e ordenação
- Informações detalhadas de cada build

**Parâmetros:**
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com a lista de builds.`,
        inputSchema: ListBuildsSchema.shape,
      },
      async (params: z.infer<typeof ListBuildsSchema>) => {
        const validatedParams = ListBuildsSchema.parse(params);
        return this.listBuilds(validatedParams.output);
      }
    );

    server.registerTool(
      'builds_start',
      {
        description: `Inicia um build.

**Funcionalidades:**
- Início de execução de builds
- Controle de execução
- Monitoramento de status

**Parâmetros:**
- \`buildId\`: ID do build
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com o status do build iniciado.`,
        inputSchema: StartBuildSchema.shape,
      },
      async (params: z.infer<typeof StartBuildSchema>) => {
        const validatedParams = StartBuildSchema.parse(params);
        return this.startBuild(validatedParams.buildId, validatedParams.output);
      }
    );

    server.registerTool(
      'builds_stop',
      {
        description: `Para um build em execução.

**Funcionalidades:**
- Parada de builds em execução
- Controle de execução
- Finalização forçada

**Parâmetros:**
- \`buildId\`: ID do build
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com o status do build parado.`,
        inputSchema: StopBuildSchema.shape,
      },
      async (params: z.infer<typeof StopBuildSchema>) => {
        const validatedParams = StopBuildSchema.parse(params);
        return this.stopBuild(validatedParams.buildId, validatedParams.output);
      }
    );

    // Build Plan Management Tools
    server.registerTool(
      'builds_create_plan',
      {
        description: `Cria um novo plano de build.

**Funcionalidades:**
- Criação de planos de build
- Configuração de etapas
- Metadados e informações do plano

**Parâmetros:**
- \`name\`: Nome do plano de build
- \`projectKey\`: Chave do projeto
- \`repositorySlug\`: Slug do repositório
- \`description\`: Descrição do plano (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com os detalhes do plano de build criado.`,
        inputSchema: CreateBuildPlanSchema.shape,
      },
      async (params: z.infer<typeof CreateBuildPlanSchema>) => {
        const validatedParams = CreateBuildPlanSchema.parse(params);
        return this.createBuildPlan(
          validatedParams.name,
          validatedParams.projectKey,
          validatedParams.repositorySlug || '',
          validatedParams.description || undefined,
          validatedParams.output
        );
      }
    );

    server.registerTool(
      'builds_get_plan',
      {
        description: `Obtém detalhes de um plano de build específico.

**Funcionalidades:**
- Informações detalhadas do plano de build
- Configurações e metadados
- Status e permissões

**Parâmetros:**
- \`planKey\`: Chave do plano de build
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com os detalhes do plano de build.`,
        inputSchema: GetBuildPlanSchema.shape,
      },
      async (params: z.infer<typeof GetBuildPlanSchema>) => {
        const validatedParams = GetBuildPlanSchema.parse(params);
        return this.getBuildPlan(validatedParams.planKey, validatedParams.output);
      }
    );

    server.registerTool(
      'builds_update_plan',
      {
        description: `Atualiza um plano de build existente.

**Funcionalidades:**
- Modificação de planos de build existentes
- Atualização de configurações
- Ajuste de etapas

**Parâmetros:**
- \`planKey\`: Chave do plano de build
- \`name\`: Novo nome do plano (opcional)
- \`description\`: Nova descrição do plano (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com os detalhes do plano de build atualizado.`,
        inputSchema: UpdateBuildPlanSchema.shape,
      },
      async (params: z.infer<typeof UpdateBuildPlanSchema>) => {
        const validatedParams = UpdateBuildPlanSchema.parse(params);
        return this.updateBuildPlan(
          validatedParams.planKey,
          validatedParams.name || undefined,
          validatedParams.description || undefined,
          validatedParams.output
        );
      }
    );

    server.registerTool(
      'builds_delete_plan',
      {
        description: `Remove um plano de build.

**Funcionalidades:**
- Remoção de planos de build
- Limpeza de planos obsoletos
- Controle de configurações

**Parâmetros:**
- \`planKey\`: Chave do plano de build
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com a confirmação da remoção.`,
        inputSchema: DeleteBuildPlanSchema.shape,
      },
      async (params: z.infer<typeof DeleteBuildPlanSchema>) => {
        const validatedParams = DeleteBuildPlanSchema.parse(params);
        return this.deleteBuildPlan(validatedParams.planKey, validatedParams.output);
      }
    );

    server.registerTool(
      'builds_list_plans',
      {
        description: `Lista planos de build com filtros opcionais.

**Funcionalidades:**
- Listagem de planos de build com paginação
- Filtros e ordenação
- Informações detalhadas de cada plano

**Parâmetros:**
- \`projectKey\`: Chave do projeto (opcional)
- \`repositorySlug\`: Slug do repositório (opcional)
- \`start\`: Índice inicial para paginação (opcional)
- \`limit\`: Limite de resultados (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com a lista de planos de build.`,
        inputSchema: ListBuildPlansSchema.shape,
      },
      async (params: z.infer<typeof ListBuildPlansSchema>) => {
        const validatedParams = ListBuildPlansSchema.parse(params);
        return this.listBuildPlans(
          validatedParams.projectKey,
          validatedParams.repositorySlug,
          validatedParams.start,
          validatedParams.limit,
          validatedParams.output
        );
      }
    );

    // Deployment Management Tools
    server.registerTool(
      'builds_create_deployment',
      {
        description: `Cria um novo deployment.

**Funcionalidades:**
- Criação de deployments
- Configuração de ambientes
- Metadados e informações do deployment

**Parâmetros:**
- \`name\`: Nome do deployment
- \`environmentId\`: ID do ambiente
- \`buildKey\`: Chave do build
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com os detalhes do deployment criado.`,
        inputSchema: CreateDeploymentSchema.shape,
      },
      async (params: z.infer<typeof CreateDeploymentSchema>) => {
        const validatedParams = CreateDeploymentSchema.parse(params);
        return this.createDeployment(
          validatedParams.name,
          validatedParams.environmentId,
          validatedParams.buildKey,
          validatedParams.output
        );
      }
    );

    server.registerTool(
      'builds_get_deployment',
      {
        description: `Obtém detalhes de um deployment específico.

**Funcionalidades:**
- Informações detalhadas do deployment
- Status e metadados
- Logs e resultados

**Parâmetros:**
- \`deploymentId\`: ID do deployment
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com os detalhes do deployment.`,
        inputSchema: GetDeploymentSchema.shape,
      },
      async (params: z.infer<typeof GetDeploymentSchema>) => {
        const validatedParams = GetDeploymentSchema.parse(params);
        return this.getDeployment(validatedParams.deploymentId, validatedParams.output);
      }
    );

    server.registerTool(
      'builds_update_deployment',
      {
        description: `Atualiza um deployment existente.

**Funcionalidades:**
- Modificação de deployments existentes
- Atualização de status
- Ajuste de configurações

**Parâmetros:**
- \`deploymentId\`: ID do deployment
- \`name\`: Novo nome do deployment (opcional)
- \`description\`: Nova descrição do deployment (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com os detalhes do deployment atualizado.`,
        inputSchema: UpdateDeploymentSchema.shape,
      },
      async (params: z.infer<typeof UpdateDeploymentSchema>) => {
        const validatedParams = UpdateDeploymentSchema.parse(params);
        return this.updateDeployment(
          validatedParams.deploymentId,
          validatedParams.name || undefined,
          validatedParams.description || undefined,
          validatedParams.output
        );
      }
    );

    server.registerTool(
      'builds_delete_deployment',
      {
        description: `Remove um deployment.

**Funcionalidades:**
- Remoção de deployments
- Limpeza de deployments obsoletos
- Controle de histórico

**Parâmetros:**
- \`deploymentId\`: ID do deployment
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com a confirmação da remoção.`,
        inputSchema: DeleteDeploymentSchema.shape,
      },
      async (params: z.infer<typeof DeleteDeploymentSchema>) => {
        const validatedParams = DeleteDeploymentSchema.parse(params);
        return this.deleteDeployment(validatedParams.deploymentId, validatedParams.output);
      }
    );

    server.registerTool(
      'builds_list_deployments',
      {
        description: `Lista deployments com filtros opcionais.

**Funcionalidades:**
- Listagem de deployments com paginação
- Filtros e ordenação
- Informações detalhadas de cada deployment

**Parâmetros:**
- \`environmentId\`: ID do ambiente (opcional)
- \`status\`: Status do deployment (opcional)
- \`start\`: Índice inicial para paginação (opcional)
- \`limit\`: Limite de resultados (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com a lista de deployments.`,
        inputSchema: ListDeploymentsSchema.shape,
      },
      async (params: z.infer<typeof ListDeploymentsSchema>) => {
        const validatedParams = ListDeploymentsSchema.parse(params);
        return this.listDeployments(
          validatedParams.environmentId,
          validatedParams.status,
          validatedParams.start,
          validatedParams.limit,
          validatedParams.output
        );
      }
    );

    server.registerTool(
      'builds_start_deployment',
      {
        description: `Inicia um deployment.

**Funcionalidades:**
- Início de execução de deployments
- Controle de execução
- Monitoramento de status

**Parâmetros:**
- \`deploymentId\`: ID do deployment
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com o status do deployment iniciado.`,
        inputSchema: StartDeploymentSchema.shape,
      },
      async (params: z.infer<typeof StartDeploymentSchema>) => {
        const validatedParams = StartDeploymentSchema.parse(params);
        return this.startDeployment(validatedParams.deploymentId, validatedParams.output);
      }
    );

    server.registerTool(
      'builds_stop_deployment',
      {
        description: `Para um deployment em execução.

**Funcionalidades:**
- Parada de deployments em execução
- Controle de execução
- Finalização forçada

**Parâmetros:**
- \`deploymentId\`: ID do deployment
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com o status do deployment parado.`,
        inputSchema: StopDeploymentSchema.shape,
      },
      async (params: z.infer<typeof StopDeploymentSchema>) => {
        const validatedParams = StopDeploymentSchema.parse(params);
        return this.stopDeployment(validatedParams.deploymentId, validatedParams.output);
      }
    );

    // Environment Management Tools
    server.registerTool(
      'builds_create_environment',
      {
        description: `Cria um novo ambiente.

**Funcionalidades:**
- Criação de ambientes
- Configuração de tipos de ambiente
- Metadados e informações do ambiente

**Parâmetros:**
- \`name\`: Nome do ambiente
- \`description\`: Descrição do ambiente (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com os detalhes do ambiente criado.`,
        inputSchema: CreateEnvironmentSchema.shape,
      },
      async (params: z.infer<typeof CreateEnvironmentSchema>) => {
        const validatedParams = CreateEnvironmentSchema.parse(params);
        return this.createEnvironment(
          validatedParams.name,
          validatedParams.description,
          validatedParams.output
        );
      }
    );

    server.registerTool(
      'builds_get_environment',
      {
        description: `Obtém detalhes de um ambiente específico.

**Funcionalidades:**
- Informações detalhadas do ambiente
- Configurações e metadados
- Status e permissões

**Parâmetros:**
- \`environmentId\`: ID do ambiente
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com os detalhes do ambiente.`,
        inputSchema: GetEnvironmentSchema.shape,
      },
      async (params: z.infer<typeof GetEnvironmentSchema>) => {
        const validatedParams = GetEnvironmentSchema.parse(params);
        return this.getEnvironment(validatedParams.environmentId, validatedParams.output);
      }
    );

    server.registerTool(
      'builds_update_environment',
      {
        description: `Atualiza um ambiente existente.

**Funcionalidades:**
- Modificação de ambientes existentes
- Atualização de configurações
- Ajuste de tipos

**Parâmetros:**
- \`environmentId\`: ID do ambiente
- \`name\`: Novo nome do ambiente (opcional)
- \`description\`: Nova descrição do ambiente (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com os detalhes do ambiente atualizado.`,
        inputSchema: UpdateEnvironmentSchema.shape,
      },
      async (params: z.infer<typeof UpdateEnvironmentSchema>) => {
        const validatedParams = UpdateEnvironmentSchema.parse(params);
        return this.updateEnvironment(
          validatedParams.environmentId,
          validatedParams.name || undefined,
          validatedParams.description || undefined,
          validatedParams.output
        );
      }
    );

    server.registerTool(
      'builds_delete_environment',
      {
        description: `Remove um ambiente.

**Funcionalidades:**
- Remoção de ambientes
- Limpeza de ambientes obsoletos
- Controle de configurações

**Parâmetros:**
- \`environmentId\`: ID do ambiente
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com a confirmação da remoção.`,
        inputSchema: DeleteEnvironmentSchema.shape,
      },
      async (params: z.infer<typeof DeleteEnvironmentSchema>) => {
        const validatedParams = DeleteEnvironmentSchema.parse(params);
        return this.deleteEnvironment(validatedParams.environmentId, validatedParams.output);
      }
    );

    server.registerTool(
      'builds_list_environments',
      {
        description: `Lista ambientes com filtros opcionais.

**Funcionalidades:**
- Listagem de ambientes com paginação
- Filtros e ordenação
- Informações detalhadas de cada ambiente

**Parâmetros:**
- \`start\`: Índice inicial para paginação (opcional)
- \`limit\`: Limite de resultados (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com a lista de ambientes.`,
        inputSchema: ListEnvironmentsSchema.shape,
      },
      async (params: z.infer<typeof ListEnvironmentsSchema>) => {
        const validatedParams = ListEnvironmentsSchema.parse(params);
        return this.listEnvironments(
          validatedParams.start,
          validatedParams.limit,
          validatedParams.output
        );
      }
    );

    registerLogger.info('Successfully registered all data center builds tools');
  }
}
