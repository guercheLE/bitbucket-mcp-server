/**
 * Builds and Deployments Types for Bitbucket Data Center REST API
 * Based on official documentation: https://developer.atlassian.com/server/bitbucket/rest/v906/intro/
 */

import { Link, PagedResponse } from './base.types.js';

// Build Types
export interface Build {
  id: number;
  name: string;
  description?: string;
  state: BuildState;
  duration: number;
  startedDate: number;
  finishedDate?: number;
  buildNumber: string;
  url: string;
  testResults?: TestResults;
  artifacts?: Artifact[];
  variables?: BuildVariable[];
  links: Link[];
}

export type BuildState = 'INPROGRESS' | 'SUCCESSFUL' | 'FAILED' | 'STOPPED' | 'CANCELLED';

export interface TestResults {
  failed: number;
  skipped: number;
  successful: number;
  total: number;
}

export interface Artifact {
  name: string;
  size: number;
  url: string;
  links: Link[];
}

export interface BuildVariable {
  name: string;
  value: string;
  secured: boolean;
}

// Build Request Types
export interface BuildCreateRequest {
  name: string;
  description?: string;
  planKey: string;
  variables?: BuildVariable[];
}

export interface BuildUpdateRequest {
  name?: string;
  description?: string;
  variables?: BuildVariable[];
}

export interface BuildQueryParams {
  start?: number;
  limit?: number;
  state?: BuildState;
  planKey?: string;
}

// Build Response Types
export interface BuildResponse extends Build {}

export interface BuildListResponse extends PagedResponse<Build> {}

// Deployment Types
export interface Deployment {
  id: number;
  name: string;
  description?: string;
  state: DeploymentState;
  environment: DeploymentEnvironment;
  startedDate: number;
  finishedDate?: number;
  deploymentNumber: string;
  url: string;
  build?: Build;
  variables?: DeploymentVariable[];
  links: Link[];
}

export type DeploymentState = 'INPROGRESS' | 'SUCCESSFUL' | 'FAILED' | 'STOPPED' | 'CANCELLED';

export interface DeploymentEnvironment {
  id: number;
  name: string;
  description?: string;
  type: EnvironmentType;
  links: Link[];
}

export type EnvironmentType = 'TEST' | 'STAGING' | 'PRODUCTION';

export interface DeploymentVariable {
  name: string;
  value: string;
  secured: boolean;
}

// Deployment Request Types
export interface DeploymentCreateRequest {
  name: string;
  description?: string;
  environmentId: number;
  buildId: number;
  variables?: DeploymentVariable[];
}

export interface DeploymentUpdateRequest {
  name?: string;
  description?: string;
  variables?: DeploymentVariable[];
}

export interface DeploymentQueryParams {
  start?: number;
  limit?: number;
  state?: DeploymentState;
  environmentId?: number;
  buildId?: number;
}

// Deployment Response Types
export interface DeploymentResponse extends Deployment {}

export interface DeploymentListResponse extends PagedResponse<Deployment> {}

// Build Plan Types
export interface BuildPlan {
  id: number;
  key: string;
  name: string;
  description?: string;
  type: PlanType;
  enabled: boolean;
  projectKey: string;
  repositorySlug?: string;
  branchName?: string;
  triggers: BuildTrigger[];
  variables?: BuildVariable[];
  links: Link[];
}

export type PlanType = 'JAVA' | 'DOTNET' | 'DOCKER' | 'SHELL' | 'POWERSHELL' | 'CUSTOM';

export interface BuildTrigger {
  type: TriggerType;
  enabled: boolean;
  configuration?: Record<string, any>;
}

export type TriggerType = 'MANUAL' | 'PUSH' | 'PULL_REQUEST' | 'SCHEDULED' | 'WEBHOOK';

// Build Plan Request Types
export interface BuildPlanCreateRequest {
  key: string;
  name: string;
  description?: string;
  type: PlanType;
  projectKey: string;
  repositorySlug?: string;
  branchName?: string;
  triggers?: BuildTrigger[];
  variables?: BuildVariable[];
}

export interface BuildPlanUpdateRequest {
  name?: string;
  description?: string;
  enabled?: boolean;
  triggers?: BuildTrigger[];
  variables?: BuildVariable[];
}

export interface BuildPlanQueryParams {
  start?: number;
  limit?: number;
  projectKey?: string;
  repositorySlug?: string;
  enabled?: boolean;
}

// Build Plan Response Types
export interface BuildPlanResponse extends BuildPlan {}

export interface BuildPlanListResponse extends PagedResponse<BuildPlan> {}

// Environment Types
export interface Environment {
  id: number;
  name: string;
  description?: string;
  type: EnvironmentType;
  enabled: boolean;
  projectKey: string;
  variables?: DeploymentVariable[];
  links: Link[];
}

// Environment Request Types
export interface EnvironmentCreateRequest {
  name: string;
  description?: string;
  type: EnvironmentType;
  projectKey: string;
  variables?: DeploymentVariable[];
}

export interface EnvironmentUpdateRequest {
  name?: string;
  description?: string;
  enabled?: boolean;
  variables?: DeploymentVariable[];
}

export interface EnvironmentQueryParams {
  start?: number;
  limit?: number;
  projectKey?: string;
  type?: EnvironmentType;
  enabled?: boolean;
}

// Environment Response Types
export interface EnvironmentResponse extends Environment {}

export interface EnvironmentListResponse extends PagedResponse<Environment> {}

// Build Log Types
export interface BuildLog {
  id: number;
  content: string;
  level: BuildLogLevel;
  timestamp: number;
  buildId: number;
}

export type BuildLogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface BuildLogQueryParams {
  start?: number;
  limit?: number;
  level?: BuildLogLevel;
  fromTimestamp?: number;
  toTimestamp?: number;
}

export interface BuildLogResponse extends BuildLog {}

export interface BuildLogListResponse extends PagedResponse<BuildLog> {}
