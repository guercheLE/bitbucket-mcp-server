/**
 * Workspace Type Definitions
 * 
 * Core type definitions for multi-workspace support in the Bitbucket MCP Server.
 * This module defines all workspace-related data structures, enums, and interfaces
 * used throughout the workspace management system.
 */

import { z } from 'zod';

// ============================================================================
// Core Workspace Types
// ============================================================================

/**
 * Workspace Status Enumeration
 */
export enum WorkspaceStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    ERROR = 'error',
    CONFIGURING = 'configuring',
    CONNECTING = 'connecting',
    DISCONNECTED = 'disconnected',
}

/**
 * Authentication Type Enumeration
 */
export enum AuthenticationType {
    OAUTH = 'oauth',
    APP_PASSWORD = 'app-password',
    TOKEN = 'token',
    BASIC = 'basic',
}

/**
 * Workspace Priority Enumeration
 */
export enum WorkspacePriority {
    PRIMARY = 'primary',
    SECONDARY = 'secondary',
    ARCHIVE = 'archive',
}

// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================

/**
 * Authentication Configuration Schema
 */
export const WorkspaceAuthConfigSchema = z.object({
    type: z.nativeEnum(AuthenticationType),
    credentials: z.record(z.string(), z.unknown()).describe('Encrypted credential data'),
    scopes: z.array(z.string()).default([]),
    refreshToken: z.string().optional(),
    tokenExpiresAt: z.string().datetime().optional(),
    lastRefreshAt: z.string().datetime().optional(),
});

/**
 * Workspace Features Configuration Schema
 */
export const WorkspaceFeaturesSchema = z.object({
    repositories: z.boolean().default(true),
    issues: z.boolean().default(true),
    pullRequests: z.boolean().default(true),
    pipelines: z.boolean().default(true),
    webhooks: z.boolean().default(false),
    analytics: z.boolean().default(true),
    search: z.boolean().default(true),
    crossWorkspaceOperations: z.boolean().default(false),
});

/**
 * Workspace Limits Configuration Schema
 */
export const WorkspaceLimitsSchema = z.object({
    maxRepositories: z.number().int().positive().default(1000),
    maxConcurrentRequests: z.number().int().positive().default(10),
    requestsPerMinute: z.number().int().positive().default(100),
    maxResponseSize: z.number().int().positive().default(50 * 1024 * 1024), // 50MB
    timeoutSeconds: z.number().int().positive().default(30),
});

/**
 * Workspace Metadata Schema
 */
export const WorkspaceMetadataSchema = z.object({
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    lastAccessedAt: z.string().datetime().optional(),
    version: z.string().default('1.0.0'),
    tags: z.array(z.string()).default([]),
    description: z.string().optional(),
    owner: z.string().optional(),
    team: z.string().optional(),
    environment: z.enum(['production', 'staging', 'development', 'testing']).default('production'),
});

/**
 * Health Status Schema
 */
export const WorkspaceHealthStatusSchema = z.object({
    status: z.nativeEnum(WorkspaceStatus),
    lastHealthCheck: z.string().datetime(),
    responseTimeMs: z.number().int().nonnegative().optional(),
    errorCount: z.number().int().nonnegative().default(0),
    lastError: z.string().optional(),
    uptime: z.number().nonnegative().default(0),
    connectivityScore: z.number().min(0).max(100).default(100),
});

/**
 * Main Workspace Configuration Schema
 */
export const WorkspaceConfigSchema = z.object({
    id: z.string().min(1, 'Workspace ID is required'),
    name: z.string().min(1, 'Workspace name is required'),
    slug: z.string().min(1, 'Workspace slug is required').regex(/^[a-z0-9-_]+$/, 'Slug must contain only lowercase letters, numbers, hyphens, and underscores'),
    baseUrl: z.string().url('Base URL must be a valid URL'),
    priority: z.nativeEnum(WorkspacePriority).default(WorkspacePriority.SECONDARY),
    authConfig: WorkspaceAuthConfigSchema,
    features: WorkspaceFeaturesSchema.default({
        repositories: true,
        issues: true,
        pullRequests: true,
        pipelines: true,
        webhooks: false,
        analytics: true,
        search: true,
        crossWorkspaceOperations: false,
    }),
    limits: WorkspaceLimitsSchema.default({
        maxRepositories: 1000,
        maxConcurrentRequests: 10,
        requestsPerMinute: 100,
        maxResponseSize: 50 * 1024 * 1024, // 50MB
        timeoutSeconds: 30,
    }),
    status: z.nativeEnum(WorkspaceStatus).default(WorkspaceStatus.INACTIVE),
    metadata: WorkspaceMetadataSchema,
    healthStatus: WorkspaceHealthStatusSchema.optional(),
});

// ============================================================================
// TypeScript Interface Types
// ============================================================================

/**
 * Workspace Authentication Configuration
 */
export interface WorkspaceAuthConfig {
    type: AuthenticationType;
    credentials: Record<string, unknown>;
    scopes: string[];
    refreshToken?: string;
    tokenExpiresAt?: string;
    lastRefreshAt?: string;
}

/**
 * Workspace Features Configuration
 */
export interface WorkspaceFeatures {
    repositories: boolean;
    issues: boolean;
    pullRequests: boolean;
    pipelines: boolean;
    webhooks: boolean;
    analytics: boolean;
    search: boolean;
    crossWorkspaceOperations: boolean;
}

/**
 * Workspace Resource Limits
 */
export interface WorkspaceLimits {
    maxRepositories: number;
    maxConcurrentRequests: number;
    requestsPerMinute: number;
    maxResponseSize: number;
    timeoutSeconds: number;
}

/**
 * Workspace Metadata
 */
export interface WorkspaceMetadata {
    createdAt: string;
    updatedAt: string;
    lastAccessedAt?: string;
    version: string;
    tags: string[];
    description?: string;
    owner?: string;
    team?: string;
    environment: 'production' | 'staging' | 'development' | 'testing';
}

/**
 * Workspace Health Status
 */
export interface WorkspaceHealthStatus {
    status: WorkspaceStatus;
    lastHealthCheck: string;
    responseTimeMs?: number;
    errorCount: number;
    lastError?: string;
    uptime: number;
    connectivityScore: number;
}

/**
 * Complete Workspace Configuration
 */
export interface WorkspaceConfig {
    id: string;
    name: string;
    slug: string;
    baseUrl: string;
    priority: WorkspacePriority;
    authConfig: WorkspaceAuthConfig;
    features: WorkspaceFeatures;
    limits: WorkspaceLimits;
    status: WorkspaceStatus;
    metadata: WorkspaceMetadata;
    healthStatus?: WorkspaceHealthStatus;
}

// ============================================================================
// Workspace Operation Types
// ============================================================================

/**
 * Workspace Registration Parameters
 */
export const WorkspaceRegistrationSchema = z.object({
    name: z.string().min(1),
    slug: z.string().min(1).regex(/^[a-z0-9-_]+$/),
    baseUrl: z.string().url(),
    authConfig: WorkspaceAuthConfigSchema,
    features: WorkspaceFeaturesSchema.optional(),
    limits: WorkspaceLimitsSchema.optional(),
    metadata: z.object({
        description: z.string().optional(),
        owner: z.string().optional(),
        team: z.string().optional(),
        environment: z.enum(['production', 'staging', 'development', 'testing']).default('production'),
        tags: z.array(z.string()).default([]),
    }).optional(),
});

export interface WorkspaceRegistrationParams {
    name: string;
    slug: string;
    baseUrl: string;
    authConfig: WorkspaceAuthConfig;
    features?: Partial<WorkspaceFeatures>;
    limits?: Partial<WorkspaceLimits>;
    metadata?: {
        description?: string;
        owner?: string;
        team?: string;
        environment?: 'production' | 'staging' | 'development' | 'testing';
        tags?: string[];
    };
}

/**
 * Workspace Update Parameters
 */
export const WorkspaceUpdateSchema = z.object({
    name: z.string().min(1).optional(),
    baseUrl: z.string().url().optional(),
    priority: z.nativeEnum(WorkspacePriority).optional(),
    authConfig: WorkspaceAuthConfigSchema.optional(),
    features: WorkspaceFeaturesSchema.optional(),
    limits: WorkspaceLimitsSchema.optional(),
    status: z.nativeEnum(WorkspaceStatus).optional(),
    metadata: WorkspaceMetadataSchema.partial().optional(),
});

export interface WorkspaceUpdateParams {
    name?: string;
    baseUrl?: string;
    priority?: WorkspacePriority;
    authConfig?: WorkspaceAuthConfig;
    features?: Partial<WorkspaceFeatures>;
    limits?: Partial<WorkspaceLimits>;
    status?: WorkspaceStatus;
    metadata?: Partial<WorkspaceMetadata>;
}

/**
 * Workspace Query Parameters
 */
export const WorkspaceQuerySchema = z.object({
    status: z.nativeEnum(WorkspaceStatus).optional(),
    priority: z.nativeEnum(WorkspacePriority).optional(),
    tags: z.array(z.string()).optional(),
    environment: z.enum(['production', 'staging', 'development', 'testing']).optional(),
    features: z.array(z.string()).optional(),
    limit: z.number().int().positive().max(100).default(20),
    offset: z.number().int().nonnegative().default(0),
});

export interface WorkspaceQueryParams {
    status?: WorkspaceStatus;
    priority?: WorkspacePriority;
    tags?: string[];
    environment?: 'production' | 'staging' | 'development' | 'testing';
    features?: string[];
    limit?: number;
    offset?: number;
}

// ============================================================================
// Workspace Context Types
// ============================================================================

/**
 * Workspace Context for Tool Execution
 */
export interface WorkspaceContext {
    workspaceId: string;
    workspace: WorkspaceConfig;
    authToken?: string;
    connectionId?: string;
    requestId?: string;
    timestamp: string;
}

/**
 * Cross-Workspace Operation Context
 */
export interface CrossWorkspaceContext {
    workspaceIds: string[];
    workspaces: WorkspaceConfig[];
    aggregateResults: boolean;
    requestId: string;
    timestamp: string;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Workspace Error Types
 */
export enum WorkspaceErrorType {
    WORKSPACE_NOT_FOUND = 'workspace_not_found',
    WORKSPACE_ALREADY_EXISTS = 'workspace_already_exists',
    INVALID_CONFIGURATION = 'invalid_configuration',
    AUTHENTICATION_FAILED = 'authentication_failed',
    CONNECTION_FAILED = 'connection_failed',
    PERMISSION_DENIED = 'permission_denied',
    WORKSPACE_UNAVAILABLE = 'workspace_unavailable',
    RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
    INVALID_WORKSPACE_STATE = 'invalid_workspace_state',
}

/**
 * Workspace Error Interface
 */
export interface WorkspaceError extends Error {
    type: WorkspaceErrorType;
    workspaceId?: string;
    code?: string;
    details?: Record<string, unknown>;
}

/**
 * Workspace Operation Result
 */
export interface WorkspaceOperationResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: WorkspaceError;
    workspaceId?: string;
    timestamp: string;
    metadata?: {
        duration?: number;
        requestId?: string;
        [key: string]: unknown;
    };
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Workspace Summary (lightweight version)
 */
export interface WorkspaceSummary {
    id: string;
    name: string;
    slug: string;
    status: WorkspaceStatus;
    priority: WorkspacePriority;
    lastAccessedAt?: string;
    healthScore: number;
}

/**
 * Workspace Statistics
 */
export interface WorkspaceStatistics {
    workspaceId: string;
    repositoryCount: number;
    issueCount: number;
    pullRequestCount: number;
    pipelineCount: number;
    lastActivityAt?: string;
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if an object is a WorkspaceConfig
 */
export function isWorkspaceConfig(obj: unknown): obj is WorkspaceConfig {
    try {
        WorkspaceConfigSchema.parse(obj);
        return true;
    } catch {
        return false;
    }
}

/**
 * Type guard to check if an error is a WorkspaceError
 */
export function isWorkspaceError(error: unknown): error is WorkspaceError {
    return (
        error instanceof Error &&
        'type' in error &&
        Object.values(WorkspaceErrorType).includes((error as WorkspaceError).type)
    );
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default workspace configuration values
 */
export const DEFAULT_WORKSPACE_CONFIG: Partial<WorkspaceConfig> = {
    priority: WorkspacePriority.SECONDARY,
    status: WorkspaceStatus.INACTIVE,
    features: {
        repositories: true,
        issues: true,
        pullRequests: true,
        pipelines: true,
        webhooks: false,
        analytics: true,
        search: true,
        crossWorkspaceOperations: false,
    },
    limits: {
        maxRepositories: 1000,
        maxConcurrentRequests: 10,
        requestsPerMinute: 100,
        maxResponseSize: 50 * 1024 * 1024,
        timeoutSeconds: 30,
    },
};

/**
 * Maximum number of workspaces supported
 */
export const MAX_WORKSPACES = 50;

/**
 * Default health check interval (milliseconds)
 */
export const DEFAULT_HEALTH_CHECK_INTERVAL = 60000; // 1 minute

/**
 * Workspace ID pattern for validation
 */
export const WORKSPACE_ID_PATTERN = /^[a-zA-Z0-9-_]{3,64}$/;

/**
 * Workspace slug pattern for validation  
 */
export const WORKSPACE_SLUG_PATTERN = /^[a-z0-9-_]{3,64}$/;