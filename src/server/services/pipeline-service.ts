/**
 * Pipeline Service
 * 
 * Centralized service for managing Bitbucket pipelines, providing comprehensive
 * pipeline operations including creation, configuration, execution, and monitoring.
 * 
 * Features:
 * - Pipeline lifecycle management
 * - Real-time status monitoring
 * - Configuration management
 * - Permission and access control
 * - Integration with Bitbucket APIs
 * - Error handling and validation
 * - Performance optimization
 */

import { EventEmitter } from 'events';
import {
  Pipeline,
  PipelineRun,
  PipelineStep,
  PipelineStatus,
  PipelineRunStatus,
  PipelineStepStatus,
  CreatePipelineRequest,
  UpdatePipelineRequest,
  RunPipelineRequest,
  ListPipelinesRequest,
  ListPipelineRunsRequest,
  PipelineResponse,
  PipelineListResponse,
  PipelineRunResponse,
  PipelineEvents
} from '../../types/pipeline.js';

/**
 * Pipeline Service Configuration
 */
export interface PipelineServiceConfig {
  /** Bitbucket API base URL */
  apiBaseUrl: string;
  
  /** API authentication token */
  authToken: string;
  
  /** Request timeout in milliseconds */
  timeout: number;
  
  /** Maximum retry attempts */
  maxRetries: number;
  
  /** Retry delay in milliseconds */
  retryDelay: number;
  
  /** Enable caching */
  enableCaching: boolean;
  
  /** Cache TTL in milliseconds */
  cacheTtl: number;
  
  /** Enable real-time monitoring */
  enableMonitoring: boolean;
  
  /** Monitoring interval in milliseconds */
  monitoringInterval: number;
}

/**
 * Pipeline Service
 * 
 * Main service class for pipeline management operations
 */
export class PipelineService extends EventEmitter {
  private config: PipelineServiceConfig;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private monitoringTimers: Map<string, NodeJS.Timeout> = new Map();
  private activeRuns: Map<string, PipelineRun> = new Map();

  constructor(config: PipelineServiceConfig) {
    super();
    this.config = config;
    this.setupEventHandlers();
  }

  // ============================================================================
  // Pipeline Management Operations
  // ============================================================================

  /**
   * Create a new pipeline
   */
  async createPipeline(request: CreatePipelineRequest): Promise<PipelineResponse> {
    try {
      // Validate request
      this.validateCreateRequest(request);

      // Check repository access
      await this.validateRepositoryAccess(request.repositoryId);

      // Create pipeline configuration
      const pipelineConfig = this.buildPipelineConfiguration(request);

      // Call Bitbucket API
      const pipelineData = await this.callBitbucketAPI('POST', '/pipelines', pipelineConfig);

      // Create pipeline entity
      const pipeline: Pipeline = {
        id: pipelineData.id,
        name: request.name,
        description: request.description,
        repository: {
          id: request.repositoryId,
          name: pipelineData.repository.name,
          fullName: pipelineData.repository.full_name,
          workspace: pipelineData.repository.workspace
        },
        configuration: pipelineConfig,
        status: PipelineStatus.ACTIVE,
        createdAt: new Date(pipelineData.created_on),
        updatedAt: new Date(pipelineData.updated_on),
        createdBy: {
          id: pipelineData.created_by.uuid,
          name: pipelineData.created_by.display_name,
          email: pipelineData.created_by.email_address
        },
        permissions: request.permissions || {
          read: [],
          write: [],
          admin: [],
          readGroups: [],
          writeGroups: [],
          adminGroups: [],
          public: false
        },
        stats: {
          totalRuns: 0,
          successfulRuns: 0,
          failedRuns: 0,
          cancelledRuns: 0,
          averageDuration: 0,
          successRate: 0
        }
      };

      // Cache pipeline data
      this.cachePipeline(pipeline);

      // Emit event
      this.emit('pipeline:created', pipeline);

      return {
        success: true,
        data: pipeline,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0
        }
      };

    } catch (error) {
      return this.handleError('createPipeline', error);
    }
  }

  /**
   * Update an existing pipeline
   */
  async updatePipeline(pipelineId: string, request: UpdatePipelineRequest): Promise<PipelineResponse> {
    try {
      // Get existing pipeline
      const existingPipeline = await this.getPipeline(pipelineId);
      if (!existingPipeline.success || !existingPipeline.data) {
        return {
          success: false,
          error: {
            code: 'PIPELINE_NOT_FOUND',
            message: `Pipeline ${pipelineId} not found`
          }
        };
      }

      // Validate update request
      this.validateUpdateRequest(request);

      // Build update payload
      const updatePayload = this.buildUpdatePayload(request);

      // Call Bitbucket API
      const updatedData = await this.callBitbucketAPI('PUT', `/pipelines/${pipelineId}`, updatePayload);

      // Update pipeline entity
      const updatedPipeline: Pipeline = {
        ...existingPipeline.data,
        ...updatedData,
        updatedAt: new Date()
      };

      // Cache updated pipeline
      this.cachePipeline(updatedPipeline);

      // Emit event
      this.emit('pipeline:updated', updatedPipeline);

      return {
        success: true,
        data: updatedPipeline,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0
        }
      };

    } catch (error) {
      return this.handleError('updatePipeline', error);
    }
  }

  /**
   * Get pipeline by ID
   */
  async getPipeline(pipelineId: string): Promise<PipelineResponse> {
    try {
      // Check cache first
      const cached = this.getCachedPipeline(pipelineId);
      if (cached) {
        return {
          success: true,
          data: cached,
          metadata: {
            timestamp: new Date(),
            requestId: this.generateRequestId(),
            processingTime: 0
          }
        };
      }

      // Call Bitbucket API
      const pipelineData = await this.callBitbucketAPI('GET', `/pipelines/${pipelineId}`);

      // Build pipeline entity
      const pipeline = this.buildPipelineEntity(pipelineData);

      // Cache pipeline
      this.cachePipeline(pipeline);

      return {
        success: true,
        data: pipeline,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0
        }
      };

    } catch (error) {
      return this.handleError('getPipeline', error);
    }
  }

  /**
   * List pipelines
   */
  async listPipelines(request: ListPipelinesRequest): Promise<PipelineListResponse> {
    try {
      // Build query parameters
      const queryParams = this.buildListQueryParams(request);

      // Call Bitbucket API
      const response = await this.callBitbucketAPI('GET', '/pipelines', null, queryParams);

      // Build pipeline entities
      const pipelines = response.values.map((data: any) => this.buildPipelineEntity(data));

      // Cache pipelines
      pipelines.forEach(pipeline => this.cachePipeline(pipeline));

      return {
        success: true,
        data: pipelines,
        pagination: {
          page: request.pagination?.page || 1,
          limit: request.pagination?.limit || 25,
          total: response.size,
          totalPages: Math.ceil(response.size / (request.pagination?.limit || 25)),
          hasNext: !!response.next,
          hasPrevious: !!response.previous
        },
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0
        }
      };

    } catch (error) {
      return this.handleError('listPipelines', error);
    }
  }

  /**
   * Delete pipeline
   */
  async deletePipeline(pipelineId: string): Promise<PipelineResponse> {
    try {
      // Call Bitbucket API
      await this.callBitbucketAPI('DELETE', `/pipelines/${pipelineId}`);

      // Remove from cache
      this.cache.delete(pipelineId);

      // Stop monitoring if active
      this.stopMonitoring(pipelineId);

      // Emit event
      this.emit('pipeline:deleted', pipelineId);

      return {
        success: true,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0
        }
      };

    } catch (error) {
      return this.handleError('deletePipeline', error);
    }
  }

  // ============================================================================
  // Pipeline Execution Operations
  // ============================================================================

  /**
   * Run a pipeline
   */
  async runPipeline(request: RunPipelineRequest): Promise<PipelineRunResponse> {
    try {
      // Validate request
      this.validateRunRequest(request);

      // Get pipeline
      const pipelineResponse = await this.getPipeline(request.pipelineId);
      if (!pipelineResponse.success || !pipelineResponse.data) {
        return {
          success: false,
          error: {
            code: 'PIPELINE_NOT_FOUND',
            message: `Pipeline ${request.pipelineId} not found`
          }
        };
      }

      // Build run payload
      const runPayload = this.buildRunPayload(request);

      // Call Bitbucket API
      const runData = await this.callBitbucketAPI('POST', `/pipelines/${request.pipelineId}/runs`, runPayload);

      // Build pipeline run entity
      const pipelineRun = this.buildPipelineRunEntity(runData, pipelineResponse.data);

      // Track active run
      this.activeRuns.set(pipelineRun.id, pipelineRun);

      // Start monitoring if enabled
      if (this.config.enableMonitoring) {
        this.startMonitoring(pipelineRun.id);
      }

      // Emit event
      this.emit('pipeline:run:started', pipelineRun);

      return {
        success: true,
        data: pipelineRun,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0
        }
      };

    } catch (error) {
      return this.handleError('runPipeline', error);
    }
  }

  /**
   * Get pipeline run by ID
   */
  async getPipelineRun(runId: string): Promise<PipelineRunResponse> {
    try {
      // Call Bitbucket API
      const runData = await this.callBitbucketAPI('GET', `/pipeline-runs/${runId}`);

      // Build pipeline run entity
      const pipelineRun = this.buildPipelineRunEntity(runData);

      return {
        success: true,
        data: pipelineRun,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0
        }
      };

    } catch (error) {
      return this.handleError('getPipelineRun', error);
    }
  }

  /**
   * List pipeline runs
   */
  async listPipelineRuns(request: ListPipelineRunsRequest): Promise<PipelineListResponse> {
    try {
      // Build query parameters
      const queryParams = this.buildRunsQueryParams(request);

      // Call Bitbucket API
      const response = await this.callBitbucketAPI('GET', '/pipeline-runs', null, queryParams);

      // Build pipeline run entities
      const runs = response.values.map((data: any) => this.buildPipelineRunEntity(data));

      return {
        success: true,
        data: runs,
        pagination: {
          page: request.pagination?.page || 1,
          limit: request.pagination?.limit || 25,
          total: response.size,
          totalPages: Math.ceil(response.size / (request.pagination?.limit || 25)),
          hasNext: !!response.next,
          hasPrevious: !!response.previous
        },
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0
        }
      };

    } catch (error) {
      return this.handleError('listPipelineRuns', error);
    }
  }

  /**
   * Stop pipeline run
   */
  async stopPipelineRun(runId: string): Promise<PipelineRunResponse> {
    try {
      // Call Bitbucket API
      const runData = await this.callBitbucketAPI('POST', `/pipeline-runs/${runId}/stop`);

      // Build pipeline run entity
      const pipelineRun = this.buildPipelineRunEntity(runData);

      // Update active runs
      this.activeRuns.set(runId, pipelineRun);

      // Stop monitoring if completed
      if (pipelineRun.status === PipelineRunStatus.CANCELLED || 
          pipelineRun.status === PipelineRunStatus.FAILED || 
          pipelineRun.status === PipelineRunStatus.SUCCESS) {
        this.stopMonitoring(runId);
      }

      return {
        success: true,
        data: pipelineRun,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0
        }
      };

    } catch (error) {
      return this.handleError('stopPipelineRun', error);
    }
  }

  // ============================================================================
  // Monitoring and Status Operations
  // ============================================================================

  /**
   * Start monitoring a pipeline run
   */
  private startMonitoring(runId: string): void {
    if (this.monitoringTimers.has(runId)) {
      return; // Already monitoring
    }

    const timer = setInterval(async () => {
      try {
        const runResponse = await this.getPipelineRun(runId);
        if (runResponse.success && runResponse.data) {
          const run = runResponse.data;
          
          // Update active runs
          this.activeRuns.set(runId, run);

          // Emit status events
          if (run.status === PipelineRunStatus.SUCCESS) {
            this.emit('pipeline:run:completed', run);
            this.stopMonitoring(runId);
          } else if (run.status === PipelineRunStatus.FAILED) {
            this.emit('pipeline:run:failed', run, new Error('Pipeline run failed'));
            this.stopMonitoring(runId);
          } else if (run.status === PipelineRunStatus.CANCELLED) {
            this.emit('pipeline:run:failed', run, new Error('Pipeline run cancelled'));
            this.stopMonitoring(runId);
          }
        }
      } catch (error) {
        console.error(`Error monitoring pipeline run ${runId}:`, error);
        this.stopMonitoring(runId);
      }
    }, this.config.monitoringInterval);

    this.monitoringTimers.set(runId, timer);
  }

  /**
   * Stop monitoring a pipeline run
   */
  private stopMonitoring(runId: string): void {
    const timer = this.monitoringTimers.get(runId);
    if (timer) {
      clearInterval(timer);
      this.monitoringTimers.delete(runId);
    }
    this.activeRuns.delete(runId);
  }

  /**
   * Get active pipeline runs
   */
  getActiveRuns(): PipelineRun[] {
    return Array.from(this.activeRuns.values());
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Call Bitbucket API
   */
  private async callBitbucketAPI(method: string, endpoint: string, data?: any, queryParams?: Record<string, any>): Promise<any> {
    const url = new URL(endpoint, this.config.apiBaseUrl);
    
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${this.config.authToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(this.config.timeout)
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const response = await fetch(url.toString(), options);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.config.maxRetries - 1) {
          await this.delay(this.config.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError || new Error('API call failed after retries');
  }

  /**
   * Validate create pipeline request
   */
  private validateCreateRequest(request: CreatePipelineRequest): void {
    if (!request.name || request.name.trim().length === 0) {
      throw new Error('Pipeline name is required');
    }
    
    if (!request.repositoryId || request.repositoryId.trim().length === 0) {
      throw new Error('Repository ID is required');
    }
    
    if (request.name.length > 100) {
      throw new Error('Pipeline name must be 100 characters or less');
    }
  }

  /**
   * Validate update pipeline request
   */
  private validateUpdateRequest(request: UpdatePipelineRequest): void {
    if (request.name && request.name.trim().length === 0) {
      throw new Error('Pipeline name cannot be empty');
    }
    
    if (request.name && request.name.length > 100) {
      throw new Error('Pipeline name must be 100 characters or less');
    }
  }

  /**
   * Validate run pipeline request
   */
  private validateRunRequest(request: RunPipelineRequest): void {
    if (!request.pipelineId || request.pipelineId.trim().length === 0) {
      throw new Error('Pipeline ID is required');
    }
  }

  /**
   * Validate repository access
   */
  private async validateRepositoryAccess(repositoryId: string): Promise<void> {
    try {
      await this.callBitbucketAPI('GET', `/repositories/${repositoryId}`);
    } catch (error) {
      throw new Error(`Repository ${repositoryId} not found or access denied`);
    }
  }

  /**
   * Build pipeline configuration
   */
  private buildPipelineConfiguration(request: CreatePipelineRequest): any {
    return {
      name: request.name,
      description: request.description,
      repository: {
        uuid: request.repositoryId
      },
      configuration: request.configuration,
      permissions: request.permissions
    };
  }

  /**
   * Build update payload
   */
  private buildUpdatePayload(request: UpdatePipelineRequest): any {
    const payload: any = {};
    
    if (request.name !== undefined) payload.name = request.name;
    if (request.description !== undefined) payload.description = request.description;
    if (request.configuration !== undefined) payload.configuration = request.configuration;
    if (request.permissions !== undefined) payload.permissions = request.permissions;
    if (request.status !== undefined) payload.status = request.status;
    
    return payload;
  }

  /**
   * Build run payload
   */
  private buildRunPayload(request: RunPipelineRequest): any {
    return {
      environment: request.environment,
      variables: request.variables,
      trigger_type: request.triggerType,
      branch: request.branch,
      commit: request.commit
    };
  }

  /**
   * Build pipeline entity
   */
  private buildPipelineEntity(data: any): Pipeline {
    return {
      id: data.uuid,
      name: data.name,
      description: data.description,
      repository: {
        id: data.repository.uuid,
        name: data.repository.name,
        fullName: data.repository.full_name,
        workspace: data.repository.workspace?.slug
      },
      configuration: data.configuration,
      status: data.status as PipelineStatus,
      createdAt: new Date(data.created_on),
      updatedAt: new Date(data.updated_on),
      lastRunAt: data.last_run ? new Date(data.last_run) : undefined,
      createdBy: {
        id: data.created_by.uuid,
        name: data.created_by.display_name,
        email: data.created_by.email_address
      },
      permissions: data.permissions,
      stats: data.stats
    };
  }

  /**
   * Build pipeline run entity
   */
  private buildPipelineRunEntity(data: any, pipeline?: Pipeline): PipelineRun {
    return {
      id: data.uuid,
      pipeline: {
        id: data.pipeline?.uuid || pipeline?.id || '',
        name: data.pipeline?.name || pipeline?.name || ''
      },
      status: data.state?.name as PipelineRunStatus,
      startTime: new Date(data.created_on),
      endTime: data.completed_on ? new Date(data.completed_on) : undefined,
      duration: data.duration_in_seconds ? data.duration_in_seconds * 1000 : undefined,
      trigger: {
        type: data.trigger?.type as any,
        user: data.trigger?.user ? {
          id: data.trigger.user.uuid,
          name: data.trigger.user.display_name
        } : undefined,
        branch: data.target?.ref_name,
        commit: data.target?.commit?.hash,
        pullRequest: data.pullrequest ? {
          id: data.pullrequest.id,
          title: data.pullrequest.title
        } : undefined
      },
      environment: data.environment?.name || 'default',
      variables: data.variables || {},
      steps: data.steps?.map((step: any) => this.buildPipelineStepEntity(step)) || [],
      logs: data.logs,
      artifacts: data.artifacts?.map((artifact: any) => ({
        id: artifact.uuid,
        name: artifact.name,
        type: artifact.type,
        size: artifact.size,
        downloadUrl: artifact.links?.download?.href || '',
        createdAt: new Date(artifact.created_on),
        expiresAt: artifact.expires_on ? new Date(artifact.expires_on) : undefined,
        metadata: artifact.metadata
      })) || [],
      metadata: data.metadata
    };
  }

  /**
   * Build pipeline step entity
   */
  private buildPipelineStepEntity(data: any): PipelineStep {
    return {
      id: data.uuid,
      name: data.name,
      type: data.type as any,
      status: data.state?.name as PipelineStepStatus,
      startTime: new Date(data.started_on),
      endTime: data.completed_on ? new Date(data.completed_on) : undefined,
      duration: data.duration_in_seconds ? data.duration_in_seconds * 1000 : undefined,
      output: data.output,
      logs: data.logs,
      exitCode: data.exit_code,
      dependsOn: data.depends_on || [],
      config: data.config,
      metadata: data.metadata
    };
  }

  /**
   * Build list query parameters
   */
  private buildListQueryParams(request: ListPipelinesRequest): Record<string, any> {
    const params: Record<string, any> = {};
    
    if (request.repositoryId) params.repository = request.repositoryId;
    if (request.status) params.status = request.status;
    if (request.query) params.q = request.query;
    if (request.pagination) {
      params.page = request.pagination.page;
      params.pagelen = request.pagination.limit;
      if (request.pagination.sortBy) params.sort = request.pagination.sortBy;
      if (request.pagination.sortOrder) params.sort_order = request.pagination.sortOrder;
    }
    
    return params;
  }

  /**
   * Build runs query parameters
   */
  private buildRunsQueryParams(request: ListPipelineRunsRequest): Record<string, any> {
    const params: Record<string, any> = {};
    
    if (request.pipelineId) params.pipeline = request.pipelineId;
    if (request.status) params.state = request.status;
    if (request.dateRange) {
      params.created_on = `${request.dateRange.start.toISOString()}..${request.dateRange.end.toISOString()}`;
    }
    if (request.pagination) {
      params.page = request.pagination.page;
      params.pagelen = request.pagination.limit;
      if (request.pagination.sortBy) params.sort = request.pagination.sortBy;
      if (request.pagination.sortOrder) params.sort_order = request.pagination.sortOrder;
    }
    
    return params;
  }

  /**
   * Cache pipeline data
   */
  private cachePipeline(pipeline: Pipeline): void {
    if (this.config.enableCaching) {
      this.cache.set(pipeline.id, {
        data: pipeline,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Get cached pipeline
   */
  private getCachedPipeline(pipelineId: string): Pipeline | null {
    if (!this.config.enableCaching) return null;
    
    const cached = this.cache.get(pipelineId);
    if (!cached) return null;
    
    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.config.cacheTtl) {
      this.cache.delete(pipelineId);
      return null;
    }
    
    return cached.data;
  }

  /**
   * Handle errors
   */
  private handleError(operation: string, error: any): any {
    console.error(`Pipeline service error in ${operation}:`, error);
    
    return {
      success: false,
      error: {
        code: 'PIPELINE_SERVICE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: {
          operation,
          timestamp: new Date().toISOString()
        }
      }
    };
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Handle process termination
    process.on('SIGINT', () => {
      this.cleanup();
    });
    
    process.on('SIGTERM', () => {
      this.cleanup();
    });
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    // Stop all monitoring timers
    this.monitoringTimers.forEach(timer => clearInterval(timer));
    this.monitoringTimers.clear();
    
    // Clear cache
    this.cache.clear();
    
    // Clear active runs
    this.activeRuns.clear();
  }

  /**
   * Generate request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default PipelineService;
