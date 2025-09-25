/**
 * Workspace Module Unit Tests
 * 
 * Basic unit tests for workspace types, manager, and utilities.
 */

import { afterEach, beforeEach, describe, expect, test } from '@jest/globals';
import {
    AuthenticationType,
    createDefaultWorkspaceTemplate,
    createWorkspaceManager,
    FileWorkspaceStorage,
    validateWorkspaceConfig,
    WorkspaceConfig,
    WorkspaceConfigSchema,
    WorkspaceContextProvider,
    WorkspaceManager,
    WorkspacePriority,
    WorkspaceStatus,
    WorkspaceUtils,
} from '../../src/workspace/index.js';

describe('Workspace Types', () => {
    test('should validate workspace configuration schema', () => {
        const validConfig: WorkspaceConfig = {
            id: 'test-workspace',
            name: 'Test Workspace',
            slug: 'test-workspace',
            baseUrl: 'https://bitbucket.example.com',
            priority: WorkspacePriority.PRIMARY,
            authConfig: {
                type: AuthenticationType.OAUTH,
                credentials: {},
                scopes: ['read'],
            },
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
            status: WorkspaceStatus.ACTIVE,
            metadata: {
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z',
                version: '1.0.0',
                tags: [],
                environment: 'production',
            },
        };

        expect(() => WorkspaceConfigSchema.parse(validConfig)).not.toThrow();
    });

    test('should reject invalid workspace configuration', () => {
        const invalidConfig = {
            id: '', // Invalid: empty ID
            name: 'Test Workspace',
            slug: 'test workspace', // Invalid: contains spaces
            baseUrl: 'not-a-url', // Invalid: not a URL
        };

        expect(() => WorkspaceConfigSchema.parse(invalidConfig)).toThrow();
    });
});

describe('Workspace Manager', () => {
    let manager: WorkspaceManager;

    beforeEach(async () => {
        manager = new WorkspaceManager({
            maxWorkspaces: 10,
            autoHealthCheck: false,
            persistentStorage: false,
        });
        await manager.initialize();
    });

    afterEach(async () => {
        await manager.shutdown();
    });

    test('should initialize successfully', () => {
        expect(manager.isInitialized).toBe(true);
        expect(manager.workspaceCount).toBe(0);
    });

    test('should register a workspace', async () => {
        const registrationParams = {
            name: 'Test Workspace',
            slug: 'test-workspace',
            baseUrl: 'https://bitbucket.example.com',
            authConfig: {
                type: AuthenticationType.OAUTH,
                credentials: {},
                scopes: ['read'],
            },
        };

        const result = await manager.registerWorkspace(registrationParams);

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data?.name).toBe('Test Workspace');
        expect(manager.workspaceCount).toBe(1);
    });

    test('should prevent duplicate workspace registration', async () => {
        const registrationParams = {
            name: 'Test Workspace',
            slug: 'test-workspace',
            baseUrl: 'https://bitbucket.example.com',
            authConfig: {
                type: AuthenticationType.OAUTH,
                credentials: {},
                scopes: ['read'],
            },
        };

        // Register first workspace
        await manager.registerWorkspace(registrationParams);

        // Try to register duplicate
        const result = await manager.registerWorkspace(registrationParams);

        expect(result.success).toBe(false);
        expect(result.error?.type).toBe('workspace_already_exists');
    });

    test('should update workspace', async () => {
        // First register a workspace
        const registrationParams = {
            name: 'Test Workspace',
            slug: 'test-workspace',
            baseUrl: 'https://bitbucket.example.com',
            authConfig: {
                type: AuthenticationType.OAUTH,
                credentials: {},
                scopes: ['read'],
            },
        };

        const registerResult = await manager.registerWorkspace(registrationParams);
        expect(registerResult.success).toBe(true);

        const workspaceId = registerResult.data!.id;

        // Update the workspace
        const updateResult = await manager.updateWorkspace(workspaceId, {
            name: 'Updated Workspace',
            priority: WorkspacePriority.PRIMARY,
        });

        expect(updateResult.success).toBe(true);
        expect(updateResult.data?.name).toBe('Updated Workspace');
        expect(updateResult.data?.priority).toBe(WorkspacePriority.PRIMARY);
    });

    test('should query workspaces', async () => {
        // Register multiple workspaces
        const workspaces = [
            {
                name: 'Production Workspace',
                slug: 'production',
                baseUrl: 'https://bitbucket.prod.com',
                authConfig: { type: AuthenticationType.OAUTH, credentials: {}, scopes: ['read'] },
            },
            {
                name: 'Development Workspace',
                slug: 'development',
                baseUrl: 'https://bitbucket.dev.com',
                authConfig: { type: AuthenticationType.TOKEN, credentials: {}, scopes: ['read'] },
            },
        ];

        for (const workspace of workspaces) {
            await manager.registerWorkspace(workspace);
        }

        // Query all workspaces
        const allWorkspaces = manager.queryWorkspaces();
        expect(allWorkspaces).toHaveLength(2);

        // Query with limit
        const limitedWorkspaces = manager.queryWorkspaces({ limit: 1 });
        expect(limitedWorkspaces).toHaveLength(1);
    });
});

describe('Workspace Context Provider', () => {
    let manager: WorkspaceManager;
    let contextProvider: WorkspaceContextProvider;

    beforeEach(async () => {
        manager = new WorkspaceManager({
            maxWorkspaces: 10,
            autoHealthCheck: false,
            persistentStorage: false,
        });
        await manager.initialize();

        contextProvider = new WorkspaceContextProvider(manager, {
            allowCrossWorkspace: true,
            trackingEnabled: false,
        });
    });

    afterEach(async () => {
        await manager.shutdown();
    });

    test('should resolve workspace context', async () => {
        // Register a workspace
        const result = await manager.registerWorkspace({
            name: 'Test Workspace',
            slug: 'test-workspace',
            baseUrl: 'https://bitbucket.example.com',
            authConfig: {
                type: AuthenticationType.OAUTH,
                credentials: {},
                scopes: ['read'],
            },
        });

        expect(result.success).toBe(true);
        const workspaceId = result.data!.id;

        // Update workspace to active status
        await manager.updateWorkspace(workspaceId, { status: WorkspaceStatus.ACTIVE });

        // Resolve context
        const contextResult = await contextProvider.resolveContext(workspaceId);

        expect(contextResult.success).toBe(true);
        expect(contextResult.context).toBeDefined();
        expect(contextResult.resolvedWorkspaces).toHaveLength(1);
    });

    test('should handle workspace not found', async () => {
        const contextResult = await contextProvider.resolveContext('non-existent');

        expect(contextResult.success).toBe(false);
        expect(contextResult.error?.type).toBe('workspace_not_found');
    });
});

describe('Workspace Utilities', () => {
    test('should validate workspace IDs', () => {
        expect(WorkspaceUtils.isValidWorkspaceId('valid-id')).toBe(true);
        expect(WorkspaceUtils.isValidWorkspaceId('valid_id')).toBe(true);
        expect(WorkspaceUtils.isValidWorkspaceId('valid123')).toBe(true);
        expect(WorkspaceUtils.isValidWorkspaceId('invalid id')).toBe(false);
        expect(WorkspaceUtils.isValidWorkspaceId('invalid@id')).toBe(false);
        expect(WorkspaceUtils.isValidWorkspaceId('id')).toBe(true); // 2 chars is valid
    });

    test('should validate workspace slugs', () => {
        expect(WorkspaceUtils.isValidWorkspaceSlug('valid-slug')).toBe(true);
        expect(WorkspaceUtils.isValidWorkspaceSlug('valid_slug')).toBe(true);
        expect(WorkspaceUtils.isValidWorkspaceSlug('valid123')).toBe(true);
        expect(WorkspaceUtils.isValidWorkspaceSlug('INVALID')).toBe(false); // uppercase not allowed
        expect(WorkspaceUtils.isValidWorkspaceSlug('invalid slug')).toBe(false); // spaces not allowed
    });

    test('should sanitize slugs', () => {
        expect(WorkspaceUtils.sanitizeSlug('My Workspace!')).toBe('my-workspace');
        expect(WorkspaceUtils.sanitizeSlug('Test@#$%Workspace')).toBe('test-workspace');
        expect(WorkspaceUtils.sanitizeSlug('--multiple--dashes--')).toBe('multiple-dashes');
    });

    test('should generate workspace IDs', () => {
        expect(WorkspaceUtils.generateWorkspaceId('test-slug')).toBe('test-slug');
        expect(WorkspaceUtils.generateWorkspaceId('Invalid Slug!')).toBe('workspace-invalid-slug-');
    });
});

describe('Workspace Factory Functions', () => {
    test('should create workspace manager', () => {
        const { manager, contextProvider, storage } = createWorkspaceManager({
            storageDir: './test-data',
            maxWorkspaces: 5,
        });

        expect(manager).toBeInstanceOf(WorkspaceManager);
        expect(contextProvider).toBeInstanceOf(WorkspaceContextProvider);
        expect(storage).toBeInstanceOf(FileWorkspaceStorage);
    });

    test('should validate workspace configuration', () => {
        const validConfig = {
            id: 'test-workspace',
            name: 'Test Workspace',
            slug: 'test-workspace',
            baseUrl: 'https://bitbucket.example.com',
            priority: WorkspacePriority.PRIMARY,
            authConfig: {
                type: AuthenticationType.OAUTH,
                credentials: {},
                scopes: ['read'],
            },
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
            status: WorkspaceStatus.ACTIVE,
            metadata: {
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z',
                version: '1.0.0',
                tags: [],
                environment: 'production',
            },
        };

        const result = validateWorkspaceConfig(validConfig);
        expect(result.isValid).toBe(true);
        expect(result.config).toBeDefined();
        expect(result.errors).toHaveLength(0);
    });

    test('should create default workspace template', () => {
        const template = createDefaultWorkspaceTemplate({
            name: 'My Workspace',
            slug: 'my-workspace',
            baseUrl: 'https://bitbucket.example.com',
            authType: AuthenticationType.OAUTH,
        });

        expect(template.name).toBe('My Workspace');
        expect(template.slug).toBe('my-workspace');
        expect(template.baseUrl).toBe('https://bitbucket.example.com');
        expect(template.authConfig?.type).toBe(AuthenticationType.OAUTH);
        expect(template.features?.repositories).toBe(true);
        expect(template.status).toBe(WorkspaceStatus.INACTIVE);
    });
});