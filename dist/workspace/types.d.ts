/**
 * Workspace Type Definitions
 *
 * Core type definitions for multi-workspace support in the Bitbucket MCP Server.
 * This module defines all workspace-related data structures, enums, and interfaces
 * used throughout the workspace management system.
 */
import { z } from 'zod';
/**
 * Workspace Status Enumeration
 */
export declare enum WorkspaceStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    ERROR = "error",
    CONFIGURING = "configuring",
    CONNECTING = "connecting",
    DISCONNECTED = "disconnected"
}
/**
 * Authentication Type Enumeration
 */
export declare enum AuthenticationType {
    OAUTH = "oauth",
    APP_PASSWORD = "app-password",
    TOKEN = "token",
    BASIC = "basic"
}
/**
 * Workspace Priority Enumeration
 */
export declare enum WorkspacePriority {
    PRIMARY = "primary",
    SECONDARY = "secondary",
    ARCHIVE = "archive"
}
/**
 * Authentication Configuration Schema
 */
export declare const WorkspaceAuthConfigSchema: z.ZodObject<{
    type: z.ZodNativeEnum<typeof AuthenticationType>;
    credentials: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    scopes: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    refreshToken: z.ZodOptional<z.ZodString>;
    tokenExpiresAt: z.ZodOptional<z.ZodString>;
    lastRefreshAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    scopes: string[];
    type: AuthenticationType;
    credentials: Record<string, unknown>;
    refreshToken?: string | undefined;
    tokenExpiresAt?: string | undefined;
    lastRefreshAt?: string | undefined;
}, {
    type: AuthenticationType;
    credentials: Record<string, unknown>;
    scopes?: string[] | undefined;
    refreshToken?: string | undefined;
    tokenExpiresAt?: string | undefined;
    lastRefreshAt?: string | undefined;
}>;
/**
 * Workspace Features Configuration Schema
 */
export declare const WorkspaceFeaturesSchema: z.ZodObject<{
    repositories: z.ZodDefault<z.ZodBoolean>;
    issues: z.ZodDefault<z.ZodBoolean>;
    pullRequests: z.ZodDefault<z.ZodBoolean>;
    pipelines: z.ZodDefault<z.ZodBoolean>;
    webhooks: z.ZodDefault<z.ZodBoolean>;
    analytics: z.ZodDefault<z.ZodBoolean>;
    search: z.ZodDefault<z.ZodBoolean>;
    crossWorkspaceOperations: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    repositories: boolean;
    pullRequests: boolean;
    issues: boolean;
    webhooks: boolean;
    search: boolean;
    pipelines: boolean;
    analytics: boolean;
    crossWorkspaceOperations: boolean;
}, {
    repositories?: boolean | undefined;
    pullRequests?: boolean | undefined;
    issues?: boolean | undefined;
    webhooks?: boolean | undefined;
    search?: boolean | undefined;
    pipelines?: boolean | undefined;
    analytics?: boolean | undefined;
    crossWorkspaceOperations?: boolean | undefined;
}>;
/**
 * Workspace Limits Configuration Schema
 */
export declare const WorkspaceLimitsSchema: z.ZodObject<{
    maxRepositories: z.ZodDefault<z.ZodNumber>;
    maxConcurrentRequests: z.ZodDefault<z.ZodNumber>;
    requestsPerMinute: z.ZodDefault<z.ZodNumber>;
    maxResponseSize: z.ZodDefault<z.ZodNumber>;
    timeoutSeconds: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    requestsPerMinute: number;
    maxRepositories: number;
    maxConcurrentRequests: number;
    maxResponseSize: number;
    timeoutSeconds: number;
}, {
    requestsPerMinute?: number | undefined;
    maxRepositories?: number | undefined;
    maxConcurrentRequests?: number | undefined;
    maxResponseSize?: number | undefined;
    timeoutSeconds?: number | undefined;
}>;
/**
 * Workspace Metadata Schema
 */
export declare const WorkspaceMetadataSchema: z.ZodObject<{
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    lastAccessedAt: z.ZodOptional<z.ZodString>;
    version: z.ZodDefault<z.ZodString>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    description: z.ZodOptional<z.ZodString>;
    owner: z.ZodOptional<z.ZodString>;
    team: z.ZodOptional<z.ZodString>;
    environment: z.ZodDefault<z.ZodEnum<["production", "staging", "development", "testing"]>>;
}, "strip", z.ZodTypeAny, {
    version: string;
    createdAt: string;
    tags: string[];
    updatedAt: string;
    environment: "development" | "production" | "staging" | "testing";
    description?: string | undefined;
    lastAccessedAt?: string | undefined;
    owner?: string | undefined;
    team?: string | undefined;
}, {
    createdAt: string;
    updatedAt: string;
    version?: string | undefined;
    description?: string | undefined;
    tags?: string[] | undefined;
    lastAccessedAt?: string | undefined;
    owner?: string | undefined;
    team?: string | undefined;
    environment?: "development" | "production" | "staging" | "testing" | undefined;
}>;
/**
 * Health Status Schema
 */
export declare const WorkspaceHealthStatusSchema: z.ZodObject<{
    status: z.ZodNativeEnum<typeof WorkspaceStatus>;
    lastHealthCheck: z.ZodString;
    responseTimeMs: z.ZodOptional<z.ZodNumber>;
    errorCount: z.ZodDefault<z.ZodNumber>;
    lastError: z.ZodOptional<z.ZodString>;
    uptime: z.ZodDefault<z.ZodNumber>;
    connectivityScore: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    uptime: number;
    status: WorkspaceStatus;
    errorCount: number;
    lastHealthCheck: string;
    connectivityScore: number;
    responseTimeMs?: number | undefined;
    lastError?: string | undefined;
}, {
    status: WorkspaceStatus;
    lastHealthCheck: string;
    uptime?: number | undefined;
    errorCount?: number | undefined;
    responseTimeMs?: number | undefined;
    lastError?: string | undefined;
    connectivityScore?: number | undefined;
}>;
/**
 * Main Workspace Configuration Schema
 */
export declare const WorkspaceConfigSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    slug: z.ZodString;
    baseUrl: z.ZodString;
    priority: z.ZodDefault<z.ZodNativeEnum<typeof WorkspacePriority>>;
    authConfig: z.ZodObject<{
        type: z.ZodNativeEnum<typeof AuthenticationType>;
        credentials: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        scopes: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        refreshToken: z.ZodOptional<z.ZodString>;
        tokenExpiresAt: z.ZodOptional<z.ZodString>;
        lastRefreshAt: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        scopes: string[];
        type: AuthenticationType;
        credentials: Record<string, unknown>;
        refreshToken?: string | undefined;
        tokenExpiresAt?: string | undefined;
        lastRefreshAt?: string | undefined;
    }, {
        type: AuthenticationType;
        credentials: Record<string, unknown>;
        scopes?: string[] | undefined;
        refreshToken?: string | undefined;
        tokenExpiresAt?: string | undefined;
        lastRefreshAt?: string | undefined;
    }>;
    features: z.ZodDefault<z.ZodObject<{
        repositories: z.ZodDefault<z.ZodBoolean>;
        issues: z.ZodDefault<z.ZodBoolean>;
        pullRequests: z.ZodDefault<z.ZodBoolean>;
        pipelines: z.ZodDefault<z.ZodBoolean>;
        webhooks: z.ZodDefault<z.ZodBoolean>;
        analytics: z.ZodDefault<z.ZodBoolean>;
        search: z.ZodDefault<z.ZodBoolean>;
        crossWorkspaceOperations: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        repositories: boolean;
        pullRequests: boolean;
        issues: boolean;
        webhooks: boolean;
        search: boolean;
        pipelines: boolean;
        analytics: boolean;
        crossWorkspaceOperations: boolean;
    }, {
        repositories?: boolean | undefined;
        pullRequests?: boolean | undefined;
        issues?: boolean | undefined;
        webhooks?: boolean | undefined;
        search?: boolean | undefined;
        pipelines?: boolean | undefined;
        analytics?: boolean | undefined;
        crossWorkspaceOperations?: boolean | undefined;
    }>>;
    limits: z.ZodDefault<z.ZodObject<{
        maxRepositories: z.ZodDefault<z.ZodNumber>;
        maxConcurrentRequests: z.ZodDefault<z.ZodNumber>;
        requestsPerMinute: z.ZodDefault<z.ZodNumber>;
        maxResponseSize: z.ZodDefault<z.ZodNumber>;
        timeoutSeconds: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        requestsPerMinute: number;
        maxRepositories: number;
        maxConcurrentRequests: number;
        maxResponseSize: number;
        timeoutSeconds: number;
    }, {
        requestsPerMinute?: number | undefined;
        maxRepositories?: number | undefined;
        maxConcurrentRequests?: number | undefined;
        maxResponseSize?: number | undefined;
        timeoutSeconds?: number | undefined;
    }>>;
    status: z.ZodDefault<z.ZodNativeEnum<typeof WorkspaceStatus>>;
    metadata: z.ZodObject<{
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        lastAccessedAt: z.ZodOptional<z.ZodString>;
        version: z.ZodDefault<z.ZodString>;
        tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        description: z.ZodOptional<z.ZodString>;
        owner: z.ZodOptional<z.ZodString>;
        team: z.ZodOptional<z.ZodString>;
        environment: z.ZodDefault<z.ZodEnum<["production", "staging", "development", "testing"]>>;
    }, "strip", z.ZodTypeAny, {
        version: string;
        createdAt: string;
        tags: string[];
        updatedAt: string;
        environment: "development" | "production" | "staging" | "testing";
        description?: string | undefined;
        lastAccessedAt?: string | undefined;
        owner?: string | undefined;
        team?: string | undefined;
    }, {
        createdAt: string;
        updatedAt: string;
        version?: string | undefined;
        description?: string | undefined;
        tags?: string[] | undefined;
        lastAccessedAt?: string | undefined;
        owner?: string | undefined;
        team?: string | undefined;
        environment?: "development" | "production" | "staging" | "testing" | undefined;
    }>;
    healthStatus: z.ZodOptional<z.ZodObject<{
        status: z.ZodNativeEnum<typeof WorkspaceStatus>;
        lastHealthCheck: z.ZodString;
        responseTimeMs: z.ZodOptional<z.ZodNumber>;
        errorCount: z.ZodDefault<z.ZodNumber>;
        lastError: z.ZodOptional<z.ZodString>;
        uptime: z.ZodDefault<z.ZodNumber>;
        connectivityScore: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        uptime: number;
        status: WorkspaceStatus;
        errorCount: number;
        lastHealthCheck: string;
        connectivityScore: number;
        responseTimeMs?: number | undefined;
        lastError?: string | undefined;
    }, {
        status: WorkspaceStatus;
        lastHealthCheck: string;
        uptime?: number | undefined;
        errorCount?: number | undefined;
        responseTimeMs?: number | undefined;
        lastError?: string | undefined;
        connectivityScore?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    metadata: {
        version: string;
        createdAt: string;
        tags: string[];
        updatedAt: string;
        environment: "development" | "production" | "staging" | "testing";
        description?: string | undefined;
        lastAccessedAt?: string | undefined;
        owner?: string | undefined;
        team?: string | undefined;
    };
    baseUrl: string;
    name: string;
    status: WorkspaceStatus;
    slug: string;
    priority: WorkspacePriority;
    authConfig: {
        scopes: string[];
        type: AuthenticationType;
        credentials: Record<string, unknown>;
        refreshToken?: string | undefined;
        tokenExpiresAt?: string | undefined;
        lastRefreshAt?: string | undefined;
    };
    features: {
        repositories: boolean;
        pullRequests: boolean;
        issues: boolean;
        webhooks: boolean;
        search: boolean;
        pipelines: boolean;
        analytics: boolean;
        crossWorkspaceOperations: boolean;
    };
    limits: {
        requestsPerMinute: number;
        maxRepositories: number;
        maxConcurrentRequests: number;
        maxResponseSize: number;
        timeoutSeconds: number;
    };
    healthStatus?: {
        uptime: number;
        status: WorkspaceStatus;
        errorCount: number;
        lastHealthCheck: string;
        connectivityScore: number;
        responseTimeMs?: number | undefined;
        lastError?: string | undefined;
    } | undefined;
}, {
    id: string;
    metadata: {
        createdAt: string;
        updatedAt: string;
        version?: string | undefined;
        description?: string | undefined;
        tags?: string[] | undefined;
        lastAccessedAt?: string | undefined;
        owner?: string | undefined;
        team?: string | undefined;
        environment?: "development" | "production" | "staging" | "testing" | undefined;
    };
    baseUrl: string;
    name: string;
    slug: string;
    authConfig: {
        type: AuthenticationType;
        credentials: Record<string, unknown>;
        scopes?: string[] | undefined;
        refreshToken?: string | undefined;
        tokenExpiresAt?: string | undefined;
        lastRefreshAt?: string | undefined;
    };
    status?: WorkspaceStatus | undefined;
    priority?: WorkspacePriority | undefined;
    features?: {
        repositories?: boolean | undefined;
        pullRequests?: boolean | undefined;
        issues?: boolean | undefined;
        webhooks?: boolean | undefined;
        search?: boolean | undefined;
        pipelines?: boolean | undefined;
        analytics?: boolean | undefined;
        crossWorkspaceOperations?: boolean | undefined;
    } | undefined;
    limits?: {
        requestsPerMinute?: number | undefined;
        maxRepositories?: number | undefined;
        maxConcurrentRequests?: number | undefined;
        maxResponseSize?: number | undefined;
        timeoutSeconds?: number | undefined;
    } | undefined;
    healthStatus?: {
        status: WorkspaceStatus;
        lastHealthCheck: string;
        uptime?: number | undefined;
        errorCount?: number | undefined;
        responseTimeMs?: number | undefined;
        lastError?: string | undefined;
        connectivityScore?: number | undefined;
    } | undefined;
}>;
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
/**
 * Workspace Registration Parameters
 */
export declare const WorkspaceRegistrationSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
    baseUrl: z.ZodString;
    authConfig: z.ZodObject<{
        type: z.ZodNativeEnum<typeof AuthenticationType>;
        credentials: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        scopes: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        refreshToken: z.ZodOptional<z.ZodString>;
        tokenExpiresAt: z.ZodOptional<z.ZodString>;
        lastRefreshAt: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        scopes: string[];
        type: AuthenticationType;
        credentials: Record<string, unknown>;
        refreshToken?: string | undefined;
        tokenExpiresAt?: string | undefined;
        lastRefreshAt?: string | undefined;
    }, {
        type: AuthenticationType;
        credentials: Record<string, unknown>;
        scopes?: string[] | undefined;
        refreshToken?: string | undefined;
        tokenExpiresAt?: string | undefined;
        lastRefreshAt?: string | undefined;
    }>;
    features: z.ZodOptional<z.ZodObject<{
        repositories: z.ZodDefault<z.ZodBoolean>;
        issues: z.ZodDefault<z.ZodBoolean>;
        pullRequests: z.ZodDefault<z.ZodBoolean>;
        pipelines: z.ZodDefault<z.ZodBoolean>;
        webhooks: z.ZodDefault<z.ZodBoolean>;
        analytics: z.ZodDefault<z.ZodBoolean>;
        search: z.ZodDefault<z.ZodBoolean>;
        crossWorkspaceOperations: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        repositories: boolean;
        pullRequests: boolean;
        issues: boolean;
        webhooks: boolean;
        search: boolean;
        pipelines: boolean;
        analytics: boolean;
        crossWorkspaceOperations: boolean;
    }, {
        repositories?: boolean | undefined;
        pullRequests?: boolean | undefined;
        issues?: boolean | undefined;
        webhooks?: boolean | undefined;
        search?: boolean | undefined;
        pipelines?: boolean | undefined;
        analytics?: boolean | undefined;
        crossWorkspaceOperations?: boolean | undefined;
    }>>;
    limits: z.ZodOptional<z.ZodObject<{
        maxRepositories: z.ZodDefault<z.ZodNumber>;
        maxConcurrentRequests: z.ZodDefault<z.ZodNumber>;
        requestsPerMinute: z.ZodDefault<z.ZodNumber>;
        maxResponseSize: z.ZodDefault<z.ZodNumber>;
        timeoutSeconds: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        requestsPerMinute: number;
        maxRepositories: number;
        maxConcurrentRequests: number;
        maxResponseSize: number;
        timeoutSeconds: number;
    }, {
        requestsPerMinute?: number | undefined;
        maxRepositories?: number | undefined;
        maxConcurrentRequests?: number | undefined;
        maxResponseSize?: number | undefined;
        timeoutSeconds?: number | undefined;
    }>>;
    metadata: z.ZodOptional<z.ZodObject<{
        description: z.ZodOptional<z.ZodString>;
        owner: z.ZodOptional<z.ZodString>;
        team: z.ZodOptional<z.ZodString>;
        environment: z.ZodDefault<z.ZodEnum<["production", "staging", "development", "testing"]>>;
        tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        tags: string[];
        environment: "development" | "production" | "staging" | "testing";
        description?: string | undefined;
        owner?: string | undefined;
        team?: string | undefined;
    }, {
        description?: string | undefined;
        tags?: string[] | undefined;
        owner?: string | undefined;
        team?: string | undefined;
        environment?: "development" | "production" | "staging" | "testing" | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    baseUrl: string;
    name: string;
    slug: string;
    authConfig: {
        scopes: string[];
        type: AuthenticationType;
        credentials: Record<string, unknown>;
        refreshToken?: string | undefined;
        tokenExpiresAt?: string | undefined;
        lastRefreshAt?: string | undefined;
    };
    metadata?: {
        tags: string[];
        environment: "development" | "production" | "staging" | "testing";
        description?: string | undefined;
        owner?: string | undefined;
        team?: string | undefined;
    } | undefined;
    features?: {
        repositories: boolean;
        pullRequests: boolean;
        issues: boolean;
        webhooks: boolean;
        search: boolean;
        pipelines: boolean;
        analytics: boolean;
        crossWorkspaceOperations: boolean;
    } | undefined;
    limits?: {
        requestsPerMinute: number;
        maxRepositories: number;
        maxConcurrentRequests: number;
        maxResponseSize: number;
        timeoutSeconds: number;
    } | undefined;
}, {
    baseUrl: string;
    name: string;
    slug: string;
    authConfig: {
        type: AuthenticationType;
        credentials: Record<string, unknown>;
        scopes?: string[] | undefined;
        refreshToken?: string | undefined;
        tokenExpiresAt?: string | undefined;
        lastRefreshAt?: string | undefined;
    };
    metadata?: {
        description?: string | undefined;
        tags?: string[] | undefined;
        owner?: string | undefined;
        team?: string | undefined;
        environment?: "development" | "production" | "staging" | "testing" | undefined;
    } | undefined;
    features?: {
        repositories?: boolean | undefined;
        pullRequests?: boolean | undefined;
        issues?: boolean | undefined;
        webhooks?: boolean | undefined;
        search?: boolean | undefined;
        pipelines?: boolean | undefined;
        analytics?: boolean | undefined;
        crossWorkspaceOperations?: boolean | undefined;
    } | undefined;
    limits?: {
        requestsPerMinute?: number | undefined;
        maxRepositories?: number | undefined;
        maxConcurrentRequests?: number | undefined;
        maxResponseSize?: number | undefined;
        timeoutSeconds?: number | undefined;
    } | undefined;
}>;
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
export declare const WorkspaceUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    baseUrl: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodNativeEnum<typeof WorkspacePriority>>;
    authConfig: z.ZodOptional<z.ZodObject<{
        type: z.ZodNativeEnum<typeof AuthenticationType>;
        credentials: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        scopes: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        refreshToken: z.ZodOptional<z.ZodString>;
        tokenExpiresAt: z.ZodOptional<z.ZodString>;
        lastRefreshAt: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        scopes: string[];
        type: AuthenticationType;
        credentials: Record<string, unknown>;
        refreshToken?: string | undefined;
        tokenExpiresAt?: string | undefined;
        lastRefreshAt?: string | undefined;
    }, {
        type: AuthenticationType;
        credentials: Record<string, unknown>;
        scopes?: string[] | undefined;
        refreshToken?: string | undefined;
        tokenExpiresAt?: string | undefined;
        lastRefreshAt?: string | undefined;
    }>>;
    features: z.ZodOptional<z.ZodObject<{
        repositories: z.ZodDefault<z.ZodBoolean>;
        issues: z.ZodDefault<z.ZodBoolean>;
        pullRequests: z.ZodDefault<z.ZodBoolean>;
        pipelines: z.ZodDefault<z.ZodBoolean>;
        webhooks: z.ZodDefault<z.ZodBoolean>;
        analytics: z.ZodDefault<z.ZodBoolean>;
        search: z.ZodDefault<z.ZodBoolean>;
        crossWorkspaceOperations: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        repositories: boolean;
        pullRequests: boolean;
        issues: boolean;
        webhooks: boolean;
        search: boolean;
        pipelines: boolean;
        analytics: boolean;
        crossWorkspaceOperations: boolean;
    }, {
        repositories?: boolean | undefined;
        pullRequests?: boolean | undefined;
        issues?: boolean | undefined;
        webhooks?: boolean | undefined;
        search?: boolean | undefined;
        pipelines?: boolean | undefined;
        analytics?: boolean | undefined;
        crossWorkspaceOperations?: boolean | undefined;
    }>>;
    limits: z.ZodOptional<z.ZodObject<{
        maxRepositories: z.ZodDefault<z.ZodNumber>;
        maxConcurrentRequests: z.ZodDefault<z.ZodNumber>;
        requestsPerMinute: z.ZodDefault<z.ZodNumber>;
        maxResponseSize: z.ZodDefault<z.ZodNumber>;
        timeoutSeconds: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        requestsPerMinute: number;
        maxRepositories: number;
        maxConcurrentRequests: number;
        maxResponseSize: number;
        timeoutSeconds: number;
    }, {
        requestsPerMinute?: number | undefined;
        maxRepositories?: number | undefined;
        maxConcurrentRequests?: number | undefined;
        maxResponseSize?: number | undefined;
        timeoutSeconds?: number | undefined;
    }>>;
    status: z.ZodOptional<z.ZodNativeEnum<typeof WorkspaceStatus>>;
    metadata: z.ZodOptional<z.ZodObject<{
        createdAt: z.ZodOptional<z.ZodString>;
        updatedAt: z.ZodOptional<z.ZodString>;
        lastAccessedAt: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        version: z.ZodOptional<z.ZodDefault<z.ZodString>>;
        tags: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
        description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        owner: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        team: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        environment: z.ZodOptional<z.ZodDefault<z.ZodEnum<["production", "staging", "development", "testing"]>>>;
    }, "strip", z.ZodTypeAny, {
        version?: string | undefined;
        description?: string | undefined;
        createdAt?: string | undefined;
        tags?: string[] | undefined;
        updatedAt?: string | undefined;
        lastAccessedAt?: string | undefined;
        owner?: string | undefined;
        team?: string | undefined;
        environment?: "development" | "production" | "staging" | "testing" | undefined;
    }, {
        version?: string | undefined;
        description?: string | undefined;
        createdAt?: string | undefined;
        tags?: string[] | undefined;
        updatedAt?: string | undefined;
        lastAccessedAt?: string | undefined;
        owner?: string | undefined;
        team?: string | undefined;
        environment?: "development" | "production" | "staging" | "testing" | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    metadata?: {
        version?: string | undefined;
        description?: string | undefined;
        createdAt?: string | undefined;
        tags?: string[] | undefined;
        updatedAt?: string | undefined;
        lastAccessedAt?: string | undefined;
        owner?: string | undefined;
        team?: string | undefined;
        environment?: "development" | "production" | "staging" | "testing" | undefined;
    } | undefined;
    baseUrl?: string | undefined;
    name?: string | undefined;
    status?: WorkspaceStatus | undefined;
    priority?: WorkspacePriority | undefined;
    authConfig?: {
        scopes: string[];
        type: AuthenticationType;
        credentials: Record<string, unknown>;
        refreshToken?: string | undefined;
        tokenExpiresAt?: string | undefined;
        lastRefreshAt?: string | undefined;
    } | undefined;
    features?: {
        repositories: boolean;
        pullRequests: boolean;
        issues: boolean;
        webhooks: boolean;
        search: boolean;
        pipelines: boolean;
        analytics: boolean;
        crossWorkspaceOperations: boolean;
    } | undefined;
    limits?: {
        requestsPerMinute: number;
        maxRepositories: number;
        maxConcurrentRequests: number;
        maxResponseSize: number;
        timeoutSeconds: number;
    } | undefined;
}, {
    metadata?: {
        version?: string | undefined;
        description?: string | undefined;
        createdAt?: string | undefined;
        tags?: string[] | undefined;
        updatedAt?: string | undefined;
        lastAccessedAt?: string | undefined;
        owner?: string | undefined;
        team?: string | undefined;
        environment?: "development" | "production" | "staging" | "testing" | undefined;
    } | undefined;
    baseUrl?: string | undefined;
    name?: string | undefined;
    status?: WorkspaceStatus | undefined;
    priority?: WorkspacePriority | undefined;
    authConfig?: {
        type: AuthenticationType;
        credentials: Record<string, unknown>;
        scopes?: string[] | undefined;
        refreshToken?: string | undefined;
        tokenExpiresAt?: string | undefined;
        lastRefreshAt?: string | undefined;
    } | undefined;
    features?: {
        repositories?: boolean | undefined;
        pullRequests?: boolean | undefined;
        issues?: boolean | undefined;
        webhooks?: boolean | undefined;
        search?: boolean | undefined;
        pipelines?: boolean | undefined;
        analytics?: boolean | undefined;
        crossWorkspaceOperations?: boolean | undefined;
    } | undefined;
    limits?: {
        requestsPerMinute?: number | undefined;
        maxRepositories?: number | undefined;
        maxConcurrentRequests?: number | undefined;
        maxResponseSize?: number | undefined;
        timeoutSeconds?: number | undefined;
    } | undefined;
}>;
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
export declare const WorkspaceQuerySchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodNativeEnum<typeof WorkspaceStatus>>;
    priority: z.ZodOptional<z.ZodNativeEnum<typeof WorkspacePriority>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    environment: z.ZodOptional<z.ZodEnum<["production", "staging", "development", "testing"]>>;
    features: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    offset: number;
    status?: WorkspaceStatus | undefined;
    tags?: string[] | undefined;
    environment?: "development" | "production" | "staging" | "testing" | undefined;
    priority?: WorkspacePriority | undefined;
    features?: string[] | undefined;
}, {
    limit?: number | undefined;
    status?: WorkspaceStatus | undefined;
    offset?: number | undefined;
    tags?: string[] | undefined;
    environment?: "development" | "production" | "staging" | "testing" | undefined;
    priority?: WorkspacePriority | undefined;
    features?: string[] | undefined;
}>;
export interface WorkspaceQueryParams {
    status?: WorkspaceStatus;
    priority?: WorkspacePriority;
    tags?: string[];
    environment?: 'production' | 'staging' | 'development' | 'testing';
    features?: string[];
    limit?: number;
    offset?: number;
}
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
/**
 * Workspace Error Types
 */
export declare enum WorkspaceErrorType {
    WORKSPACE_NOT_FOUND = "workspace_not_found",
    WORKSPACE_ALREADY_EXISTS = "workspace_already_exists",
    INVALID_CONFIGURATION = "invalid_configuration",
    AUTHENTICATION_FAILED = "authentication_failed",
    CONNECTION_FAILED = "connection_failed",
    PERMISSION_DENIED = "permission_denied",
    WORKSPACE_UNAVAILABLE = "workspace_unavailable",
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded",
    INVALID_WORKSPACE_STATE = "invalid_workspace_state"
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
/**
 * Type guard to check if an object is a WorkspaceConfig
 */
export declare function isWorkspaceConfig(obj: unknown): obj is WorkspaceConfig;
/**
 * Type guard to check if an error is a WorkspaceError
 */
export declare function isWorkspaceError(error: unknown): error is WorkspaceError;
/**
 * Default workspace configuration values
 */
export declare const DEFAULT_WORKSPACE_CONFIG: Partial<WorkspaceConfig>;
/**
 * Maximum number of workspaces supported
 */
export declare const MAX_WORKSPACES = 50;
/**
 * Default health check interval (milliseconds)
 */
export declare const DEFAULT_HEALTH_CHECK_INTERVAL = 60000;
/**
 * Workspace ID pattern for validation
 */
export declare const WORKSPACE_ID_PATTERN: RegExp;
/**
 * Workspace slug pattern for validation
 */
export declare const WORKSPACE_SLUG_PATTERN: RegExp;
//# sourceMappingURL=types.d.ts.map