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
export var WorkspaceStatus;
(function (WorkspaceStatus) {
    WorkspaceStatus["ACTIVE"] = "active";
    WorkspaceStatus["INACTIVE"] = "inactive";
    WorkspaceStatus["ERROR"] = "error";
    WorkspaceStatus["CONFIGURING"] = "configuring";
    WorkspaceStatus["CONNECTING"] = "connecting";
    WorkspaceStatus["DISCONNECTED"] = "disconnected";
})(WorkspaceStatus || (WorkspaceStatus = {}));
/**
 * Authentication Type Enumeration
 */
export var AuthenticationType;
(function (AuthenticationType) {
    AuthenticationType["OAUTH"] = "oauth";
    AuthenticationType["APP_PASSWORD"] = "app-password";
    AuthenticationType["TOKEN"] = "token";
    AuthenticationType["BASIC"] = "basic";
})(AuthenticationType || (AuthenticationType = {}));
/**
 * Workspace Priority Enumeration
 */
export var WorkspacePriority;
(function (WorkspacePriority) {
    WorkspacePriority["PRIMARY"] = "primary";
    WorkspacePriority["SECONDARY"] = "secondary";
    WorkspacePriority["ARCHIVE"] = "archive";
})(WorkspacePriority || (WorkspacePriority = {}));
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
// ============================================================================
// Error Types
// ============================================================================
/**
 * Workspace Error Types
 */
export var WorkspaceErrorType;
(function (WorkspaceErrorType) {
    WorkspaceErrorType["WORKSPACE_NOT_FOUND"] = "workspace_not_found";
    WorkspaceErrorType["WORKSPACE_ALREADY_EXISTS"] = "workspace_already_exists";
    WorkspaceErrorType["INVALID_CONFIGURATION"] = "invalid_configuration";
    WorkspaceErrorType["AUTHENTICATION_FAILED"] = "authentication_failed";
    WorkspaceErrorType["CONNECTION_FAILED"] = "connection_failed";
    WorkspaceErrorType["PERMISSION_DENIED"] = "permission_denied";
    WorkspaceErrorType["WORKSPACE_UNAVAILABLE"] = "workspace_unavailable";
    WorkspaceErrorType["RATE_LIMIT_EXCEEDED"] = "rate_limit_exceeded";
    WorkspaceErrorType["INVALID_WORKSPACE_STATE"] = "invalid_workspace_state";
})(WorkspaceErrorType || (WorkspaceErrorType = {}));
// ============================================================================
// Type Guards
// ============================================================================
/**
 * Type guard to check if an object is a WorkspaceConfig
 */
export function isWorkspaceConfig(obj) {
    try {
        WorkspaceConfigSchema.parse(obj);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Type guard to check if an error is a WorkspaceError
 */
export function isWorkspaceError(error) {
    return (error instanceof Error &&
        'type' in error &&
        Object.values(WorkspaceErrorType).includes(error.type));
}
// ============================================================================
// Constants
// ============================================================================
/**
 * Default workspace configuration values
 */
export const DEFAULT_WORKSPACE_CONFIG = {
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
//# sourceMappingURL=types.js.map