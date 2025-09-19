/**
 * TypeScript Type Definitions
 * Centralized type definitions for the Bitbucket MCP Server
 */

import { z } from 'zod';

// ============================================================================
// Project Types
// ============================================================================

export interface Project {
  name: string;
  version: string;
  description?: string;
  author: Author;
  license?: string;
  repository?: Repository;
  keywords?: string[];
  engines?: Engines;
}

export interface Author {
  name: string;
  email: string;
  url?: string;
}

export interface Repository {
  type: string;
  url: string;
}

export interface Engines {
  node: string;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface Configuration {
  project: Project;
  dependencies?: Dependencies;
  scripts?: Scripts;
  config?: Config;
}

export interface Dependencies {
  production?: Record<string, string>;
  development?: Record<string, string>;
}

export interface Scripts {
  [key: string]: string;
}

export interface Config {
  typescript?: TypeScriptConfig;
  jest?: JestConfig;
}

export interface TypeScriptConfig {
  strict: boolean;
  target: string;
}

export interface JestConfig {
  coverage: number;
  timeout: number;
}

// ============================================================================
// Dependency Types
// ============================================================================

export interface Dependency {
  name: string;
  version: string;
  type: 'production' | 'development';
  description?: string;
  license?: string;
}

// ============================================================================
// Transport Types
// ============================================================================

export type TransportType = 'stdio' | 'http' | 'sse' | 'streaming';

export interface Transport {
  type: TransportType;
  config: TransportConfig;
}

export interface TransportConfig {
  host?: string;
  port?: number;
  path?: string;
  timeout?: number;
}

// ============================================================================
// Authentication Types
// ============================================================================

export type AuthType = 'oauth2' | 'personal-token' | 'app-password' | 'basic';

export interface AuthConfig {
  type: AuthType;
  credentials: AuthCredentials;
}

export interface AuthCredentials {
  [key: string]: any;
}

// ============================================================================
// Cache Types
// ============================================================================

export interface CacheConfig {
  type: 'memory' | 'redis';
  ttl: number;
  maxSize?: number;
  redis?: RedisConfig;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

// ============================================================================
// Logging Types
// ============================================================================

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface LoggingConfig {
  level: LogLevel;
  format: 'json' | 'text';
  destinations: LogDestination[];
}

export interface LogDestination {
  type: 'console' | 'file';
  config: ConsoleConfig | FileConfig;
}

export interface ConsoleConfig {
  colorize?: boolean;
}

export interface FileConfig {
  filename: string;
  maxSize?: string;
  maxFiles?: number;
}

// ============================================================================
// Testing Types
// ============================================================================

export interface TestingConfig {
  framework: 'jest';
  coverage: CoverageConfig;
  timeout: number;
}

export interface CoverageConfig {
  threshold: number;
  reporters: string[];
  directory: string;
}

// ============================================================================
// Security Types
// ============================================================================

export interface SecurityConfig {
  cors: CorsConfig;
  helmet: HelmetConfig;
  rateLimit: RateLimitConfig;
}

export interface CorsConfig {
  origin: string | string[];
  credentials: boolean;
}

export interface HelmetConfig {
  contentSecurityPolicy: boolean;
  hsts: boolean;
}

export interface RateLimitConfig {
  windowMs: number;
  max: number;
}

// ============================================================================
// Server Configuration Types
// ============================================================================

export interface ServerConfig {
  host: string;
  port: number;
  transport: Transport;
  auth: AuthConfig;
  cache: CacheConfig;
  logging: LoggingConfig;
  security: SecurityConfig;
}

// ============================================================================
// Client Configuration Types
// ============================================================================

export interface ClientConfig {
  serverUrl: string;
  auth: AuthConfig;
  timeout: number;
  retries: number;
}

// ============================================================================
// Performance Types
// ============================================================================

export interface PerformanceConfig {
  metrics: MetricsConfig;
  healthCheck: HealthCheckConfig;
  circuitBreaker: CircuitBreakerConfig;
}

export interface MetricsConfig {
  enabled: boolean;
  interval: number;
}

export interface HealthCheckConfig {
  enabled: boolean;
  interval: number;
  timeout: number;
}

export interface CircuitBreakerConfig {
  enabled: boolean;
  threshold: number;
  timeout: number;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: ResponseMetadata;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ResponseMetadata {
  timestamp: string;
  requestId: string;
  version: string;
}

// ============================================================================
// Project Initialization Schemas
// ============================================================================

export const InitializeProjectRequestSchema = z.object({
  name: z.string()
    .min(1, 'Project name is required')
    .max(214, 'Project name too long')
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Invalid project name format')
    .refine(name => !name.startsWith('.') && !name.startsWith('_'), 'Project name cannot start with dot or underscore'),
  description: z.string().optional(),
  author: z.object({
    name: z.string().min(1, 'Author name is required'),
    email: z.string().email('Invalid email format'),
    url: z.string().url('Invalid URL format').optional(),
  }),
  license: z.string().optional(),
  repository: z.object({
    type: z.string(),
    url: z.string().url('Invalid repository URL'),
  }).optional(),
  keywords: z.array(z.string().min(1, 'Keyword cannot be empty')).optional(),
  engines: z.object({
    node: z.string().regex(/^[>=~^]?\d+\.\d+\.\d+.*$/, 'Invalid semver range'),
  }).optional(),
});

export const ProjectConfigurationSchema = z.object({
  project: z.object({
    name: z.string(),
    version: z.string().regex(/^\d+\.\d+\.\d+/, 'Invalid semver version'),
    description: z.string().optional(),
  }),
  dependencies: z.object({
    production: z.record(z.string().regex(/^[>=~^]?\d+\.\d+\.\d+/, 'Invalid semver range')).optional(),
    development: z.record(z.string().regex(/^[>=~^]?\d+\.\d+\.\d+/, 'Invalid semver range')).optional(),
  }).optional(),
  scripts: z.record(z.string()).optional(),
  config: z.object({
    typescript: z.object({
      strict: z.boolean(),
      target: z.string(),
    }).optional(),
    jest: z.object({
      coverage: z.number().min(0).max(100),
      timeout: z.number().positive(),
    }).optional(),
  }).optional(),
});

export const ProjectInitializationResponseSchema = z.object({
  success: z.boolean(),
  project: z.object({
    name: z.string(),
    path: z.string(),
    created: z.string(),
  }).optional(),
  files: z.array(z.object({
    path: z.string(),
    created: z.boolean(),
  })).optional(),
  message: z.string().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }).optional(),
});

// ============================================================================
// Bitbucket API Types
// ============================================================================

export interface BitbucketRepository {
  id: number;
  name: string;
  slug: string;
  scmId: string;
  state: string;
  statusMessage: string;
  forkable: boolean;
  project: {
    key: string;
    id: number;
    name: string;
    public: boolean;
    type: string;
    links: {
      self: Array<{ href: string }>;
    };
  };
  public: boolean;
  links: {
    clone: Array<{ href: string; name: string }>;
    self: Array<{ href: string }>;
  };
  cloneUrl: string;
  sshCloneUrl: string;
  size: number;
  createdDate: number;
  updatedDate: number;
  owner?: {
    displayName: string;
    emailAddress: string;
    id: number;
    name: string;
    slug: string;
    type: string;
  };
}

export interface BitbucketPullRequest {
  id: number;
  version: number;
  title: string;
  description: string;
  state: 'OPEN' | 'MERGED' | 'DECLINED' | 'SUPERSEDED';
  open: boolean;
  closed: boolean;
  createdDate: number;
  updatedDate: number;
  fromRef: {
    id: string;
    displayId: string;
    latestCommit: string;
    repository: BitbucketRepository;
  };
  toRef: {
    id: string;
    displayId: string;
    latestCommit: string;
    repository: BitbucketRepository;
  };
  locked: boolean;
  author: {
    user: {
      name: string;
      emailAddress: string;
      id: number;
      displayName: string;
      active: boolean;
      slug: string;
      type: string;
    };
    role: string;
    approved: boolean;
    status: string;
  };
  reviewers: Array<{
    user: {
      name: string;
      emailAddress: string;
      id: number;
      displayName: string;
      active: boolean;
      slug: string;
      type: string;
    };
    lastReviewedCommit?: string;
    role: string;
    approved: boolean;
    status: string;
  }>;
  participants: Array<{
    user: {
      name: string;
      emailAddress: string;
      id: number;
      displayName: string;
      active: boolean;
      slug: string;
      type: string;
    };
    role: string;
    approved: boolean;
    status: string;
  }>;
  links: {
    self: Array<{ href: string }>;
  };
}

export interface BitbucketIssue {
  id: number;
  version: number;
  title: string;
  description: string;
  state: 'new' | 'open' | 'resolved' | 'on hold' | 'invalid' | 'duplicate' | 'wontfix' | 'closed';
  type: 'bug' | 'enhancement' | 'proposal' | 'task';
  priority: 'trivial' | 'minor' | 'major' | 'critical' | 'blocker';
  milestone?: string;
  component?: string;
  reporter: {
    name: string;
    emailAddress: string;
    id: number;
    displayName: string;
    active: boolean;
    slug: string;
    type: string;
  };
  assignee?: {
    name: string;
    emailAddress: string;
    id: number;
    displayName: string;
    active: boolean;
    slug: string;
    type: string;
  };
  created: number;
  updated: number;
  votes: number;
  watches: number;
  comments: Array<{
    id: number;
    text: string;
    author: {
      name: string;
      emailAddress: string;
      id: number;
      displayName: string;
      active: boolean;
      slug: string;
      type: string;
    };
    createdDate: number;
    updatedDate: number;
    comments: Array<any>;
    properties: {
      repositoryId: number;
    };
    version: number;
  }>;
  links: {
    self: Array<{ href: string }>;
  };
}

// ============================================================================
// Export Types
// ============================================================================

export type InitializeProjectRequest = z.infer<typeof InitializeProjectRequestSchema>;
export type ProjectConfiguration = z.infer<typeof ProjectConfigurationSchema>;
export type ProjectInitializationResponse = z.infer<typeof ProjectInitializationResponseSchema>;

// Re-export ServerInfo from server-detection service
export type { ServerInfo } from '../services/server-detection';

// Re-export commonly used types (avoiding conflicts)
export type {
  Project as ProjectType,
  Author as AuthorType,
  Repository as RepositoryType,
  Engines as EnginesType,
  Configuration as ConfigurationType,
  Dependencies as DependenciesType,
  Scripts as ScriptsType,
  Config as ConfigType,
  TypeScriptConfig as TypeScriptConfigType,
  JestConfig as JestConfigType,
  Dependency as DependencyType,
  TransportType as TransportTypeType,
  Transport as TransportInterfaceType,
  TransportConfig as TransportConfigType,
  AuthType as AuthTypeType,
  AuthConfig as AuthConfigType,
  AuthCredentials as AuthCredentialsType,
  CacheConfig as CacheConfigType,
  RedisConfig as RedisConfigType,
  LogLevel as LogLevelType,
  LoggingConfig as LoggingConfigType,
  LogDestination as LogDestinationType,
  ConsoleConfig as ConsoleConfigType,
  FileConfig as FileConfigType,
  TestingConfig as TestingConfigType,
  CoverageConfig as CoverageConfigType,
  SecurityConfig as SecurityConfigType,
  CorsConfig as CorsConfigType,
  HelmetConfig as HelmetConfigType,
  RateLimitConfig as RateLimitConfigType,
  ServerConfig as ServerConfigType,
  ClientConfig as ClientConfigType,
  PerformanceConfig as PerformanceConfigType,
  MetricsConfig as MetricsConfigType,
  HealthCheckConfig as HealthCheckConfigType,
  CircuitBreakerConfig as CircuitBreakerConfigType,
  ApiResponse as ApiResponseType,
  ApiError as ApiErrorType,
  ResponseMetadata as ResponseMetadataType,
};
