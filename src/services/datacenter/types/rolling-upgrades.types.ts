/**
 * Rolling Upgrades Types for Bitbucket Data Center REST API
 * Based on official documentation: https://developer.atlassian.com/server/bitbucket/rest/v906/intro/
 */

import { Link } from './base.types.js';

// Node state enum
export type NodeState = 'STARTING' | 'ACTIVE' | 'DRAINING' | 'TERMINATING' | 'OFFLINE' | 'ERROR';

// Cluster state enum
export type ClusterState =
  | 'STABLE'
  | 'READY_TO_UPGRADE'
  | 'MIXED'
  | 'READY_TO_RUN_UPGRADE_TASKS'
  | 'RUNNING_UPGRADE_TASKS'
  | 'UPGRADE_TASKS_FAILED';

// Node information DTO
export interface NodeInfoDTO {
  id: string;
  name: string;
  ipAddress: string;
  state: NodeState;
  tasksTotal: number;
  activeUserCount: number;
  buildNumber: string;
  version: string;
  local: boolean;
  portNumber: number;
  links: Link[];
}

// Node with build info
export interface NodeWithBuildInfo {
  state: ClusterState;
  buildInfo: NodeInfoDTO;
}

// Cluster information
export interface Cluster {
  upgradeModeEnabled: boolean;
  state: ClusterState;
  originalVersion: string;
  nodes: NodeInfoDTO[];
  links: Link[];
}

// Rolling upgrade status
export interface RollingUpgradeStatus {
  id: string;
  status: 'IDLE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  startTime?: string;
  endTime?: string;
  progress: number;
  currentNode?: string;
  totalNodes: number;
  completedNodes: number;
  failedNodes: number;
  errorMessage?: string;
  configuration: RollingUpgradeConfiguration;
}

// Rolling upgrade request
export interface RollingUpgradeRequest {
  targetVersion: string;
  maintenanceWindow?: {
    startTime: string;
    endTime: string;
  };
  nodeOrder?: string[];
  skipHealthChecks?: boolean;
  forceUpgrade?: boolean;
  rollbackOnFailure?: boolean;
  notificationSettings?: {
    email: string[];
    webhook?: string;
  };
}

// Rolling upgrade response
export interface RollingUpgradeResponse {
  id: string;
  status: string;
  message: string;
  estimatedDuration?: number;
  startTime?: string;
}

// Rolling upgrade configuration
export interface RollingUpgradeConfiguration {
  defaultTargetVersion: string;
  maintenanceWindow: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    timezone: string;
  };
  healthCheckSettings: {
    enabled: boolean;
    timeout: number;
    retryCount: number;
  };
  rollbackSettings: {
    enabled: boolean;
    automaticRollback: boolean;
    rollbackTimeout: number;
  };
  notificationSettings: {
    email: {
      enabled: boolean;
      recipients: string[];
    };
    webhook: {
      enabled: boolean;
      url?: string;
    };
  };
  nodeSettings: {
    maxConcurrentUpgrades: number;
    upgradeOrder: 'SEQUENTIAL' | 'PARALLEL';
  };
}

// Rolling upgrade history
export interface RollingUpgradeHistory {
  id: string;
  status: string;
  startTime: string;
  endTime?: string;
  targetVersion: string;
  progress: number;
  errorMessage?: string;
  configuration: RollingUpgradeConfiguration;
}
