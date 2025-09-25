/**
 * Pipeline Management Types for Bitbucket MCP Server
 * 
 * This module defines TypeScript interfaces and types for pipeline management
 * functionality, including pipelines, pipeline runs, and pipeline steps.
 * 
 * Key Components:
 * - Pipeline: Main pipeline entity with configuration and metadata
 * - PipelineRun: Individual pipeline execution instance
 * - PipelineStep: Individual step within a pipeline run
 * - PipelineTrigger: Automated trigger configurations
 * - PipelinePermissions: Access control and user permissions
 * 
 * Constitutional Requirements:
 * - Full Bitbucket API compatibility (Data Center and Cloud)
 * - Secure handling of pipeline secrets and variables
 * - Comprehensive error handling and validation
 * - Performance optimization for large logs and artifacts
 */

// ============================================================================
// Core Pipeline Types
// ============================================================================

/**
 * Pipeline Status
 * Represents the current state of a pipeline
 */
export enum PipelineStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISABLED = 'disabled',
  ERROR = 'error'
}

/**
 * Pipeline Run Status
 * Represents the execution status of a pipeline run
 */
export enum PipelineRunStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  SKIPPED = 'skipped'
}

/**
 * Pipeline Step Status
 * Represents the execution status of a pipeline step
 */
export enum PipelineStepStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  SKIPPED = 'skipped'
}

/**
 * Pipeline Step Type
 * Defines the type of pipeline step
 */
export enum PipelineStepType {
  BUILD = 'build',
  TEST = 'test',
  DEPLOY = 'deploy',
  NOTIFICATION = 'notification',
  SCRIPT = 'script',
  CUSTOM = 'custom'
}

/**
 * Pipeline Trigger Type
 * Defines how a pipeline is triggered
 */
export enum PipelineTriggerType {
  PUSH = 'push',
  PULL_REQUEST = 'pull_request',
  MANUAL = 'manual',
  SCHEDULED = 'scheduled',
  WEBHOOK = 'webhook'
}

// ============================================================================
// Pipeline Configuration Types
// ============================================================================

/**
 * Pipeline Trigger Configuration
 * Configuration for automated pipeline triggers
 */
export interface PipelineTrigger {
  /** Trigger type */
  type: PipelineTriggerType;
  
  /** Branch patterns to match (for push/PR triggers) */
  branches?: string[];
  
  /** File patterns to match */
  paths?: string[];
  
  /** Schedule configuration (for scheduled triggers) */
  schedule?: {
    cron: string;
    timezone?: string;
  };
  
  /** Webhook configuration (for webhook triggers) */
  webhook?: {
    url: string;
    secret?: string;
    events: string[];
  };
  
  /** Whether trigger is enabled */
  enabled: boolean;
}

/**
 * Pipeline Environment Configuration
 * Environment settings for pipeline execution
 */
export interface PipelineEnvironment {
  /** Environment name */
  name: string;
  
  /** Environment variables */
  variables: Record<string, string>;
  
  /** Secret variables (encrypted) */
  secrets: Record<string, string>;
  
  /** Docker image for the environment */
  image?: string;
  
  /** Resource limits */
  resources?: {
    cpu?: string;
    memory?: string;
    disk?: string;
  };
  
  /** Environment-specific settings */
  settings: Record<string, any>;
}

/**
 * Pipeline Step Configuration
 * Configuration for individual pipeline steps
 */
export interface PipelineStepConfig {
  /** Step name */
  name: string;
  
  /** Step type */
  type: PipelineStepType;
  
  /** Step description */
  description?: string;
  
  /** Script or command to execute */
  script?: string;
  
  /** Docker image for the step */
  image?: string;
  
  /** Environment variables for the step */
  environment?: Record<string, string>;
  
  /** Dependencies on other steps */
  dependsOn?: string[];
  
  /** Step timeout in seconds */
  timeout?: number;
  
  /** Whether step is required for pipeline success */
  required?: boolean;
  
  /** Step-specific configuration */
  config?: Record<string, any>;
}

/**
 * Pipeline Configuration
 * Complete pipeline configuration and settings
 */
export interface PipelineConfiguration {
  /** Pipeline name */
  name: string;
  
  /** Pipeline description */
  description?: string;
  
  /** Pipeline steps */
  steps: PipelineStepConfig[];
  
  /** Pipeline triggers */
  triggers: PipelineTrigger[];
  
  /** Pipeline environments */
  environments: PipelineEnvironment[];
  
  /** Global pipeline variables */
  variables: Record<string, string>;
  
  /** Global pipeline secrets */
  secrets: Record<string, string>;
  
  /** Pipeline timeout in seconds */
  timeout?: number;
  
  /** Whether pipeline is enabled */
  enabled: boolean;
  
  /** Pipeline tags for organization */
  tags?: string[];
  
  /** Pipeline metadata */
  metadata?: Record<string, any>;
}

// ============================================================================
// Pipeline Entity Types
// ============================================================================

/**
 * Pipeline Entity
 * Main pipeline entity with configuration and metadata
 */
export interface Pipeline {
  /** Unique pipeline identifier */
  id: string;
  
  /** Pipeline name */
  name: string;
  
  /** Pipeline description */
  description?: string;
  
  /** Associated repository */
  repository: {
    id: string;
    name: string;
    fullName: string;
    workspace?: string;
  };
  
  /** Pipeline configuration */
  configuration: PipelineConfiguration;
  
  /** Current pipeline status */
  status: PipelineStatus;
  
  /** Pipeline creation timestamp */
  createdAt: Date;
  
  /** Pipeline last update timestamp */
  updatedAt: Date;
  
  /** Pipeline last run timestamp */
  lastRunAt?: Date;
  
  /** Pipeline creator */
  createdBy: {
    id: string;
    name: string;
    email?: string;
  };
  
  /** Pipeline permissions */
  permissions: PipelinePermissions;
  
  /** Pipeline statistics */
  stats: PipelineStats;
  
  /** Pipeline metadata */
  metadata?: Record<string, any>;
}

/**
 * Pipeline Run Entity
 * Individual pipeline execution instance
 */
export interface PipelineRun {
  /** Unique run identifier */
  id: string;
  
  /** Associated pipeline */
  pipeline: {
    id: string;
    name: string;
  };
  
  /** Run status */
  status: PipelineRunStatus;
  
  /** Run start time */
  startTime: Date;
  
  /** Run end time */
  endTime?: Date;
  
  /** Run duration in milliseconds */
  duration?: number;
  
  /** Run trigger information */
  trigger: {
    type: PipelineTriggerType;
    user?: {
      id: string;
      name: string;
    };
    branch?: string;
    commit?: string;
    pullRequest?: {
      id: string;
      title: string;
    };
  };
  
  /** Run environment */
  environment: string;
  
  /** Run variables */
  variables: Record<string, string>;
  
  /** Run steps */
  steps: PipelineStep[];
  
  /** Run logs */
  logs?: PipelineLogs;
  
  /** Run artifacts */
  artifacts?: PipelineArtifact[];
  
  /** Run metadata */
  metadata?: Record<string, any>;
}

/**
 * Pipeline Step Entity
 * Individual step within a pipeline run
 */
export interface PipelineStep {
  /** Unique step identifier */
  id: string;
  
  /** Step name */
  name: string;
  
  /** Step type */
  type: PipelineStepType;
  
  /** Step status */
  status: PipelineStepStatus;
  
  /** Step start time */
  startTime: Date;
  
  /** Step end time */
  endTime?: Date;
  
  /** Step duration in milliseconds */
  duration?: number;
  
  /** Step output */
  output?: string;
  
  /** Step logs */
  logs?: string;
  
  /** Step exit code */
  exitCode?: number;
  
  /** Step dependencies */
  dependsOn: string[];
  
  /** Step configuration */
  config: PipelineStepConfig;
  
  /** Step metadata */
  metadata?: Record<string, any>;
}

// ============================================================================
// Pipeline Support Types
// ============================================================================

/**
 * Pipeline Permissions
 * Access control and user permissions for pipelines
 */
export interface PipelinePermissions {
  /** Users with read access */
  read: string[];
  
  /** Users with write access */
  write: string[];
  
  /** Users with admin access */
  admin: string[];
  
  /** Groups with read access */
  readGroups: string[];
  
  /** Groups with write access */
  writeGroups: string[];
  
  /** Groups with admin access */
  adminGroups: string[];
  
  /** Whether pipeline is public */
  public: boolean;
}

/**
 * Pipeline Statistics
 * Performance and usage metrics for pipelines
 */
export interface PipelineStats {
  /** Total number of runs */
  totalRuns: number;
  
  /** Successful runs */
  successfulRuns: number;
  
  /** Failed runs */
  failedRuns: number;
  
  /** Cancelled runs */
  cancelledRuns: number;
  
  /** Average run duration in milliseconds */
  averageDuration: number;
  
  /** Success rate (0-1) */
  successRate: number;
  
  /** Last run timestamp */
  lastRunAt?: Date;
  
  /** Last successful run timestamp */
  lastSuccessAt?: Date;
  
  /** Last failed run timestamp */
  lastFailureAt?: Date;
}

/**
 * Pipeline Logs
 * Log information for pipeline runs
 */
export interface PipelineLogs {
  /** Log entries */
  entries: PipelineLogEntry[];
  
  /** Total log size in bytes */
  size: number;
  
  /** Log compression status */
  compressed: boolean;
  
  /** Log retention policy */
  retention?: {
    days: number;
    maxSize: number;
  };
}

/**
 * Pipeline Log Entry
 * Individual log entry within pipeline logs
 */
export interface PipelineLogEntry {
  /** Log timestamp */
  timestamp: Date;
  
  /** Log level */
  level: 'debug' | 'info' | 'warn' | 'error';
  
  /** Log message */
  message: string;
  
  /** Log source (step name, system, etc.) */
  source?: string;
  
  /** Additional log data */
  data?: any;
}

/**
 * Pipeline Artifact
 * Build artifacts generated by pipeline runs
 */
export interface PipelineArtifact {
  /** Artifact identifier */
  id: string;
  
  /** Artifact name */
  name: string;
  
  /** Artifact type */
  type: string;
  
  /** Artifact size in bytes */
  size: number;
  
  /** Artifact download URL */
  downloadUrl: string;
  
  /** Artifact creation timestamp */
  createdAt: Date;
  
  /** Artifact expiration timestamp */
  expiresAt?: Date;
  
  /** Artifact metadata */
  metadata?: Record<string, any>;
}

// ============================================================================
// Pipeline API Types
// ============================================================================

/**
 * Pipeline Creation Request
 * Request payload for creating a new pipeline
 */
export interface CreatePipelineRequest {
  /** Pipeline name */
  name: string;
  
  /** Pipeline description */
  description?: string;
  
  /** Repository identifier */
  repositoryId: string;
  
  /** Pipeline configuration */
  configuration: PipelineConfiguration;
  
  /** Pipeline permissions */
  permissions?: Partial<PipelinePermissions>;
}

/**
 * Pipeline Update Request
 * Request payload for updating an existing pipeline
 */
export interface UpdatePipelineRequest {
  /** Pipeline name */
  name?: string;
  
  /** Pipeline description */
  description?: string;
  
  /** Pipeline configuration */
  configuration?: Partial<PipelineConfiguration>;
  
  /** Pipeline permissions */
  permissions?: Partial<PipelinePermissions>;
  
  /** Pipeline status */
  status?: PipelineStatus;
}

/**
 * Pipeline Run Request
 * Request payload for starting a pipeline run
 */
export interface RunPipelineRequest {
  /** Pipeline identifier */
  pipelineId: string;
  
  /** Run environment */
  environment?: string;
  
  /** Run variables */
  variables?: Record<string, string>;
  
  /** Run trigger type */
  triggerType?: PipelineTriggerType;
  
  /** Branch to run on */
  branch?: string;
  
  /** Commit to run on */
  commit?: string;
}

/**
 * Pipeline List Request
 * Request parameters for listing pipelines
 */
export interface ListPipelinesRequest {
  /** Repository identifier */
  repositoryId?: string;
  
  /** Pipeline status filter */
  status?: PipelineStatus;
  
  /** Search query */
  query?: string;
  
  /** Pagination parameters */
  pagination?: {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

/**
 * Pipeline Run List Request
 * Request parameters for listing pipeline runs
 */
export interface ListPipelineRunsRequest {
  /** Pipeline identifier */
  pipelineId?: string;
  
  /** Run status filter */
  status?: PipelineRunStatus;
  
  /** Date range filter */
  dateRange?: {
    start: Date;
    end: Date;
  };
  
  /** Pagination parameters */
  pagination?: {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

// ============================================================================
// Pipeline Response Types
// ============================================================================

/**
 * Pipeline Response
 * Response format for pipeline operations
 */
export interface PipelineResponse {
  /** Operation success status */
  success: boolean;
  
  /** Pipeline data */
  data?: Pipeline;
  
  /** Error information */
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  
  /** Response metadata */
  metadata?: {
    timestamp: Date;
    requestId: string;
    processingTime: number;
  };
}

/**
 * Pipeline List Response
 * Response format for pipeline list operations
 */
export interface PipelineListResponse {
  /** Operation success status */
  success: boolean;
  
  /** Pipeline list data */
  data?: Pipeline[];
  
  /** Pagination information */
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  
  /** Error information */
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  
  /** Response metadata */
  metadata?: {
    timestamp: Date;
    requestId: string;
    processingTime: number;
  };
}

/**
 * Pipeline Run Response
 * Response format for pipeline run operations
 */
export interface PipelineRunResponse {
  /** Operation success status */
  success: boolean;
  
  /** Pipeline run data */
  data?: PipelineRun;
  
  /** Error information */
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  
  /** Response metadata */
  metadata?: {
    timestamp: Date;
    requestId: string;
    processingTime: number;
  };
}

// ============================================================================
// Pipeline Event Types
// ============================================================================

/**
 * Pipeline Events
 * Events emitted by pipeline operations
 */
export interface PipelineEvents {
  'pipeline:created': (pipeline: Pipeline) => void;
  'pipeline:updated': (pipeline: Pipeline) => void;
  'pipeline:deleted': (pipelineId: string) => void;
  'pipeline:run:started': (run: PipelineRun) => void;
  'pipeline:run:completed': (run: PipelineRun) => void;
  'pipeline:run:failed': (run: PipelineRun, error: Error) => void;
  'pipeline:step:started': (step: PipelineStep) => void;
  'pipeline:step:completed': (step: PipelineStep) => void;
  'pipeline:step:failed': (step: PipelineStep, error: Error) => void;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for Pipeline
 */
export function isPipeline(obj: any): obj is Pipeline {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    obj.repository &&
    obj.configuration &&
    typeof obj.status === 'string' &&
    obj.createdAt instanceof Date
  );
}

/**
 * Type guard for PipelineRun
 */
export function isPipelineRun(obj: any): obj is PipelineRun {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    obj.pipeline &&
    typeof obj.status === 'string' &&
    obj.startTime instanceof Date
  );
}

/**
 * Type guard for PipelineStep
 */
export function isPipelineStep(obj: any): obj is PipelineStep {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.status === 'string' &&
    obj.startTime instanceof Date
  );
}

// ============================================================================
// Export All Types
// ============================================================================

export * from './pipeline';
