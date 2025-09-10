/**
 * Pipeline Types for Bitbucket Cloud REST API
 * Based on: https://developer.atlassian.com/cloud/bitbucket/rest/api-group-pipelines/
 */

import { PaginationParams } from './base.types.js';

// Pipeline Types
export interface Pipeline {
  type: string;
  uuid: string;
  build_number: number;
  creator: PipelineCreator;
  created_on: string;
  completed_on?: string;
  state: PipelineState;
  result?: PipelineResult;
  build_seconds_used: number;
  first_successful_step?: PipelineStep;
  expired: boolean;
  has_variables: boolean;
  repository: PipelineRepository;
  target: PipelineTarget;
  trigger: PipelineTrigger;
  links: PipelineLinks;
}

export interface PipelineCreator {
  type: string;
  uuid: string;
  display_name: string;
  links: {
    self: { href: string };
    html: { href: string };
    avatar: { href: string };
  };
  nickname: string;
  account_id: string;
}

export interface PipelineState {
  name: string;
  type: string;
  stage?: PipelineStage;
}

export interface PipelineStage {
  name: string;
  type: string;
}

export interface PipelineResult {
  name: string;
  type: string;
}

export interface PipelineStep {
  type: string;
  uuid: string;
  name: string;
  state: PipelineState;
  result?: PipelineResult;
  started_on?: string;
  completed_on?: string;
  duration_in_seconds?: number;
  build_seconds_used: number;
  max_time: number;
  runs_on: string[];
  script: PipelineScript;
  image: PipelineImage;
  condition: PipelineCondition;
  artifacts: PipelineArtifact[];
  caches: PipelineCache[];
  links: PipelineLinks;
}

export interface PipelineScript {
  type: string;
  name: string;
  commands: PipelineCommand[];
}

export interface PipelineCommand {
  type: string;
  command: string;
  name?: string;
  condition?: PipelineCondition;
}

export interface PipelineCondition {
  type: string;
  statement: string;
}

export interface PipelineImage {
  name: string;
  username?: string;
  password?: string;
  email?: string;
}

export interface PipelineArtifact {
  type: string;
  name: string;
  path: string;
}

export interface PipelineCache {
  type: string;
  name: string;
  path: string;
}

export interface PipelineRepository {
  type: string;
  name: string;
  full_name: string;
  uuid: string;
  links: {
    self: { href: string };
    html: { href: string };
    avatar: { href: string };
  };
}

export interface PipelineTarget {
  type: string;
  ref_type: string;
  ref_name: string;
  selector: PipelineSelector;
  commit: PipelineCommit;
}

export interface PipelineSelector {
  type: string;
  pattern: string;
}

export interface PipelineCommit {
  type: string;
  hash: string;
  links: {
    self: { href: string };
    html: { href: string };
  };
}

export interface PipelineTrigger {
  type: string;
  name: string;
}

export interface PipelineLinks {
  self: { href: string };
  html: { href: string };
  commits?: { href: string };
  steps?: { href: string };
  logs?: { href: string };
  artifacts?: { href: string };
  cache?: { href: string };
}

export interface PipelineVariable {
  type: string;
  uuid: string;
  key: string;
  value: string;
  secured: boolean;
  created_on: string;
  updated_on: string;
  links: {
    self: { href: string };
  };
}

export interface PipelineSchedule {
  type: string;
  uuid: string;
  enabled: boolean;
  target: PipelineTarget;
  cron_pattern: string;
  created_on: string;
  updated_on: string;
  links: {
    self: { href: string };
    html: { href: string };
  };
}

export interface PipelineConfiguration {
  type: string;
  enabled: boolean;
  repository: PipelineRepository;
  build_number: number;
  created_on: string;
  updated_on: string;
  links: {
    self: { href: string };
    html: { href: string };
  };
}

export interface PipelineCacheInfo {
  type: string;
  uuid: string;
  name: string;
  path: string;
  size: number;
  created_on: string;
  updated_on: string;
  links: {
    self: { href: string };
    content_uri: { href: string };
  };
}

// Request Types
export interface CreatePipelineRequest {
  target: {
    type: string;
    ref_type: string;
    ref_name: string;
    selector: {
      type: string;
      pattern: string;
    };
  };
}

export interface CreatePipelineVariableRequest {
  key: string;
  value: string;
  secured?: boolean;
}

export interface UpdatePipelineVariableRequest {
  key?: string;
  value?: string;
  secured?: boolean;
}

export interface CreatePipelineScheduleRequest {
  enabled: boolean;
  target: {
    type: string;
    ref_type: string;
    ref_name: string;
    selector: {
      type: string;
      pattern: string;
    };
  };
  cron_pattern: string;
}

export interface UpdatePipelineScheduleRequest {
  enabled?: boolean;
  target?: {
    type: string;
    ref_type: string;
    ref_name: string;
    selector: {
      type: string;
      pattern: string;
    };
  };
  cron_pattern?: string;
}

// Parameter Types
export interface ListPipelinesParams extends PaginationParams {
  workspace: string;
  repo_slug: string;
  page?: number;
  pagelen?: number;
  sort?: string;
  q?: string;
}

export interface GetPipelineParams {
  workspace: string;
  repo_slug: string;
  pipeline_uuid: string;
}

export interface ListPipelineStepsParams extends PaginationParams {
  workspace: string;
  repo_slug: string;
  pipeline_uuid: string;
}

export interface GetPipelineStepParams {
  workspace: string;
  repo_slug: string;
  pipeline_uuid: string;
  step_uuid: string;
}

export interface GetPipelineLogParams {
  workspace: string;
  repo_slug: string;
  pipeline_uuid: string;
  step_uuid: string;
  log_uuid?: string;
}

export interface StopPipelineParams {
  workspace: string;
  repo_slug: string;
  pipeline_uuid: string;
}

export interface ListPipelineVariablesParams extends PaginationParams {
  workspace: string;
  repo_slug: string;
  environment_uuid?: string;
}

export interface CreatePipelineVariableParams {
  workspace: string;
  repo_slug: string;
  environment_uuid?: string;
  variable: CreatePipelineVariableRequest;
}

export interface UpdatePipelineVariableParams {
  workspace: string;
  repo_slug: string;
  environment_uuid?: string;
  variable_uuid: string;
  variable: UpdatePipelineVariableRequest;
}

export interface DeletePipelineVariableParams {
  workspace: string;
  repo_slug: string;
  environment_uuid?: string;
  variable_uuid: string;
}

export interface ListPipelineSchedulesParams extends PaginationParams {
  workspace: string;
  repo_slug: string;
}

export interface CreatePipelineScheduleParams {
  workspace: string;
  repo_slug: string;
  schedule: CreatePipelineScheduleRequest;
}

export interface UpdatePipelineScheduleParams {
  workspace: string;
  repo_slug: string;
  schedule_uuid: string;
  schedule: UpdatePipelineScheduleRequest;
}

export interface DeletePipelineScheduleParams {
  workspace: string;
  repo_slug: string;
  schedule_uuid: string;
}

export interface GetPipelineVariableParams {
  workspace: string;
  repo_slug: string;
  environment_uuid?: string;
  variable_uuid: string;
}

export interface GetPipelineScheduleParams {
  workspace: string;
  repo_slug: string;
  schedule_uuid: string;
}

export interface ListPipelineCachesParams extends PaginationParams {
  workspace: string;
  repo_slug: string;
}

export interface DeletePipelineCacheParams {
  workspace: string;
  repo_slug: string;
  cache_uuid: string;
}

export interface GetPipelineCacheContentUriParams {
  workspace: string;
  repo_slug: string;
  cache_uuid: string;
}
