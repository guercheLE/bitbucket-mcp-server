/**
 * Other Operations Types for Bitbucket Data Center REST API
 * Based on official documentation: https://developer.atlassian.com/server/bitbucket/rest/v906/intro/
 */

import { Link, PagedResponse, PaginationParams } from './base.types.js';

// System information
export interface SystemInformation {
  version: string;
  buildNumber: string;
  buildDate: string;
  displayName: string;
  edition: string;
  license: {
    type: string;
    valid: boolean;
    expiryDate?: string;
    maxUsers?: number;
    currentUsers?: number;
  };
  database: {
    type: string;
    version: string;
    driver: string;
  };
  jvm: {
    name: string;
    version: string;
    vendor: string;
    memory: {
      total: number;
      free: number;
      max: number;
    };
  };
  operatingSystem: {
    name: string;
    version: string;
    architecture: string;
  };
  links: {
    self: Link[];
  };
}

// Health check
export interface HealthCheck {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  checks: Array<{
    name: string;
    status: 'PASS' | 'FAIL' | 'WARN';
    message?: string;
    duration?: number;
  }>;
  timestamp: string;
  version: string;
  links: {
    self: Link[];
  };
}

// Metrics
export interface Metrics {
  timestamp: string;
  metrics: {
    users: {
      total: number;
      active: number;
      inactive: number;
    };
    repositories: {
      total: number;
      public: number;
      private: number;
    };
    projects: {
      total: number;
      public: number;
      private: number;
    };
    pullRequests: {
      total: number;
      open: number;
      merged: number;
      declined: number;
    };
    commits: {
      total: number;
      last24Hours: number;
      last7Days: number;
      last30Days: number;
    };
    storage: {
      total: number;
      used: number;
      free: number;
    };
    performance: {
      averageResponseTime: number;
      requestsPerSecond: number;
      errorRate: number;
    };
  };
  links: {
    self: Link[];
  };
}

// Configuration
export interface Configuration {
  id: string;
  key: string;
  value: any;
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'PASSWORD';
  description?: string;
  category: string;
  required: boolean;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
  updatedDate: string;
  updatedBy: {
    name: string;
    displayName: string;
    emailAddress: string;
  };
  links: {
    self: Link[];
  };
}

// Configuration request
export interface ConfigurationRequest {
  key: string;
  value: any;
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'PASSWORD';
  description?: string;
  category: string;
  required?: boolean;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
}

// Configuration list response
export interface ConfigurationListResponse extends PagedResponse<Configuration> {}

// Configuration query parameters
export interface ConfigurationQueryParams extends PaginationParams {
  category?: string;
  key?: string;
  type?: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'PASSWORD';
}

// Backup configuration
export interface SystemBackupConfiguration {
  id: number;
  name: string;
  description?: string;
  enabled: boolean;
  schedule: {
    enabled: boolean;
    cronExpression: string;
    timezone: string;
  };
  location: {
    type: 'LOCAL' | 'S3' | 'AZURE' | 'GCS';
    path?: string;
    bucket?: string;
    region?: string;
    credentials?: {
      accessKey?: string;
      secretKey?: string;
      connectionString?: string;
    };
  };
  retention: {
    days: number;
    maxBackups: number;
  };
  compression: boolean;
  encryption: boolean;
  createdDate: string;
  updatedDate: string;
  lastBackupDate?: string;
  nextBackupDate?: string;
  status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  links: {
    self: Link[];
  };
}

// Backup configuration request
export interface SystemBackupConfigurationRequest {
  name: string;
  description?: string;
  enabled?: boolean;
  schedule: {
    enabled: boolean;
    cronExpression: string;
    timezone: string;
  };
  location: {
    type: 'LOCAL' | 'S3' | 'AZURE' | 'GCS';
    path?: string;
    bucket?: string;
    region?: string;
    credentials?: {
      accessKey?: string;
      secretKey?: string;
      connectionString?: string;
    };
  };
  retention: {
    days: number;
    maxBackups: number;
  };
  compression?: boolean;
  encryption?: boolean;
}

// Backup result
export interface BackupResult {
  id: number;
  configurationId: number;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  startTime: string;
  endTime?: string;
  duration?: number;
  size?: number;
  location: string;
  message?: string;
  errors: Array<{
    type: string;
    message: string;
    timestamp: string;
  }>;
  links: {
    self: Link[];
  };
}

// Backup result list response
export interface BackupResultListResponse extends PagedResponse<BackupResult> {}

// Log entry
export interface LogEntry {
  id: number;
  timestamp: string;
  level: 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  logger: string;
  message: string;
  thread: string;
  exception?: {
    type: string;
    message: string;
    stackTrace: string[];
  };
  properties: Record<string, any>;
  links: {
    self: Link[];
  };
}

// Log entry list response
export interface LogEntryListResponse extends PagedResponse<LogEntry> {}

// Log query parameters
export interface LogQueryParams extends PaginationParams {
  level?: 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  logger?: string;
  fromDate?: string;
  toDate?: string;
  message?: string;
}

// Plugin information
export interface PluginInformation {
  key: string;
  name: string;
  version: string;
  description?: string;
  vendor: string;
  enabled: boolean;
  system: boolean;
  userInstalled: boolean;
  installedDate: string;
  updatedDate: string;
  dependencies: Array<{
    key: string;
    name: string;
    version: string;
    optional: boolean;
  }>;
  links: {
    self: Link[];
  };
}

// Plugin information list response
export interface PluginInformationListResponse extends PagedResponse<PluginInformation> {}

// Plugin query parameters
export interface PluginQueryParams extends PaginationParams {
  enabled?: boolean;
  system?: boolean;
  userInstalled?: boolean;
  key?: string;
}
