/**
 * Repository Management Tools Unit Tests
 * 
 * Comprehensive unit tests for all repository management MCP tools.
 * Tests cover parameter validation, error handling, and tool execution.
 * 
 * Test Coverage:
 * - create_repository tool
 * - list_repositories tool
 * - get_repository tool
 * - update_repository_settings tool
 * - manage_repository_permissions tool
 * - repository_lifecycle tool
 * - branch_management tool
 * - webhook_management tool
 * - repository_integration tool
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ToolExecutionContext } from '../../src/types/index.js';
import { createRepositoryTool } from '../../src/server/tools/create_repository.js';
import { listRepositoriesTool } from '../../src/server/tools/list_repositories.js';
import { getRepositoryTool } from '../../src/server/tools/get_repository.js';
import { updateRepositorySettingsTool } from '../../src/server/tools/update_repository_settings.js';
import { manageRepositoryPermissionsTool } from '../../src/server/tools/manage_repository_permissions.js';
import { repositoryLifecycleTool } from '../../src/server/tools/repository_lifecycle.js';
import { branchManagementTool } from '../../src/server/tools/branch_management.js';
import { webhookManagementTool } from '../../src/server/tools/webhook_management.js';
import { repositoryIntegrationTool } from '../../src/server/tools/repository_integration.js';

// Mock context for testing
const createMockContext = (): ToolExecutionContext => ({
  session: {
    emit: jest.fn(),
    clientId: 'test-client',
    id: 'test-session',
    isActive: () => true,
    isExpired: () => false,
    updateActivity: jest.fn(),
    getStats: () => ({
      duration: 1000,
      requestsProcessed: 1,
      toolsCalled: 1,
      averageProcessingTime: 100,
      memoryUsage: 1024,
      lastRequest: new Date()
    }),
    recordRequest: jest.fn(),
    recordToolCall: jest.fn(),
    hasTool: () => true,
    addTool: jest.fn(),
    removeTool: jest.fn(),
    disconnect: jest.fn(),
    destroy: jest.fn(),
    connect: jest.fn(),
    transport: {
      type: 'stdio' as const,
      isConnected: true,
      isHealthy: () => true,
      getStats: () => ({}),
      connect: jest.fn(),
      disconnect: jest.fn()
    }
  } as any,
  server: {} as any,
  request: {
    id: 'test-request',
    timestamp: new Date(),
    transport: 'stdio' as const
  },
  environment: {
    nodeVersion: 'v18.0.0',
    platform: 'linux',
    memoryUsage: process.memoryUsage()
  }
});

describe('Repository Management Tools', () => {
  let mockContext: ToolExecutionContext;

  beforeEach(() => {
    mockContext = createMockContext();
    jest.clearAllMocks();
  });

  describe('create_repository tool', () => {
    it('should create repository with valid parameters', async () => {
      const params = {
        name: 'test-repo',
        workspace: 'test-workspace',
        description: 'Test repository',
        is_private: true,
        language: 'typescript'
      };

      const result = await createRepositoryTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('repository');
      expect(result.data.repository.name).toBe('test-repo');
      expect(result.data.repository.full_name).toBe('test-workspace/test-repo');
    });

    it('should reject invalid repository name', async () => {
      const params = {
        name: 'invalid@name!',
        workspace: 'test-workspace'
      };

      const result = await createRepositoryTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32602);
      expect(result.error?.message).toContain('alphanumeric characters');
    });

    it('should require workspace parameter', async () => {
      const params = {
        name: 'test-repo'
      };

      const result = await createRepositoryTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32602);
      expect(result.error?.message).toContain('workspace are required');
    });
  });

  describe('list_repositories tool', () => {
    it('should list repositories with default parameters', async () => {
      const params = {
        workspace: 'test-workspace'
      };

      const result = await listRepositoriesTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('repositories');
      expect(result.data).toHaveProperty('pagination');
      expect(Array.isArray(result.data.repositories)).toBe(true);
    });

    it('should apply filters correctly', async () => {
      const params = {
        workspace: 'test-workspace',
        is_private: true,
        language: 'typescript',
        q: 'test'
      };

      const result = await listRepositoriesTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.filters).toEqual({
        workspace: 'test-workspace',
        search_query: 'test',
        is_private: true,
        language: 'typescript',
        has_issues: undefined,
        has_wiki: undefined
      });
    });

    it('should handle pagination parameters', async () => {
      const params = {
        workspace: 'test-workspace',
        page: 2,
        page_size: 10
      };

      const result = await listRepositoriesTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.pagination.page).toBe(2);
      expect(result.data.pagination.page_size).toBe(10);
    });
  });

  describe('get_repository tool', () => {
    it('should get repository details with all includes', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        include_branches: true,
        include_statistics: true,
        include_permissions: true
      };

      const result = await getRepositoryTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('repository');
      expect(result.data).toHaveProperty('branches');
      expect(result.data).toHaveProperty('statistics');
      expect(result.data).toHaveProperty('permissions');
    });

    it('should get repository details with minimal includes', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        include_branches: false,
        include_statistics: false,
        include_permissions: false
      };

      const result = await getRepositoryTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('repository');
      expect(result.data).not.toHaveProperty('branches');
      expect(result.data).not.toHaveProperty('statistics');
      expect(result.data).not.toHaveProperty('permissions');
    });

    it('should reject invalid repository name', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'invalid@name!'
      };

      const result = await getRepositoryTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32602);
    });
  });

  describe('update_repository_settings tool', () => {
    it('should update repository settings', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        description: 'Updated description',
        is_private: false,
        language: 'python'
      };

      const result = await updateRepositorySettingsTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('updated_fields');
      expect(result.data.updated_fields).toContain('description');
      expect(result.data.updated_fields).toContain('is_private');
      expect(result.data.updated_fields).toContain('language');
    });

    it('should require at least one setting to update', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo'
      };

      const result = await updateRepositorySettingsTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32602);
      expect(result.error?.message).toContain('At least one setting must be provided');
    });
  });

  describe('manage_repository_permissions tool', () => {
    it('should grant permissions', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'grant',
        permission_level: 'write',
        user: 'test-user'
      };

      const result = await manageRepositoryPermissionsTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('grant');
      expect(result.data.permission_level).toBe('write');
      expect(result.data.targets).toContain('test-user');
    });

    it('should list permissions', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'list'
      };

      const result = await manageRepositoryPermissionsTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('list');
      expect(result.data).toHaveProperty('permissions');
      expect(Array.isArray(result.data.permissions)).toBe(true);
    });

    it('should require permission level for grant action', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'grant',
        user: 'test-user'
      };

      const result = await manageRepositoryPermissionsTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32602);
      expect(result.error?.message).toContain('Permission level is required');
    });
  });

  describe('repository_lifecycle tool', () => {
    it('should delete repository with confirmation', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'delete',
        confirmation_token: 'confirm123'
      };

      const result = await repositoryLifecycleTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('delete');
      expect(result.data.status).toBe('deleted');
    });

    it('should archive repository with reason', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'archive',
        confirmation_token: 'confirm123',
        archive_reason: 'Project completed'
      };

      const result = await repositoryLifecycleTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('archive');
      expect(result.data.status).toBe('archived');
      expect(result.data.archive_reason).toBe('Project completed');
    });

    it('should require confirmation token for destructive actions', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'delete'
      };

      const result = await repositoryLifecycleTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32602);
      expect(result.error?.message).toContain('Confirmation token is required');
    });

    it('should perform dry run', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'delete',
        confirmation_token: 'confirm123',
        dry_run: true
      };

      const result = await repositoryLifecycleTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('dry_run');
      expect(result.data.message).toContain('Dry run completed');
    });
  });

  describe('branch_management tool', () => {
    it('should list branches', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'list'
      };

      const result = await branchManagementTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('list');
      expect(result.data).toHaveProperty('branches');
      expect(Array.isArray(result.data.branches)).toBe(true);
    });

    it('should create branch', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'create',
        branch_name: 'feature/new-feature',
        source_branch: 'develop'
      };

      const result = await branchManagementTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('create');
      expect(result.data.branch_name).toBe('feature/new-feature');
      expect(result.data.source_branch).toBe('develop');
    });

    it('should require branch name for create action', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'create'
      };

      const result = await branchManagementTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32602);
      expect(result.error?.message).toContain('Branch name is required');
    });
  });

  describe('webhook_management tool', () => {
    it('should create webhook', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'create',
        url: 'https://example.com/webhook',
        events: ['repo:push', 'pullrequest:created']
      };

      const result = await webhookManagementTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('create');
      expect(result.data.webhook.url).toBe('https://example.com/webhook');
      expect(result.data.webhook.events).toEqual(['repo:push', 'pullrequest:created']);
    });

    it('should list webhooks', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'list'
      };

      const result = await webhookManagementTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('list');
      expect(result.data).toHaveProperty('webhooks');
      expect(Array.isArray(result.data.webhooks)).toBe(true);
    });

    it('should require URL for create action', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'create',
        events: ['repo:push']
      };

      const result = await webhookManagementTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32602);
      expect(result.error?.message).toContain('URL is required');
    });
  });

  describe('repository_integration tool', () => {
    it('should get clone URLs', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'get_clone_urls'
      };

      const result = await repositoryIntegrationTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('get_clone_urls');
      expect(result.data).toHaveProperty('clone_urls');
      expect(result.data.clone_urls).toHaveProperty('https');
      expect(result.data.clone_urls).toHaveProperty('ssh');
    });

    it('should start mirror operation', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'mirror',
        source_url: 'https://github.com/user/repo.git',
        mirror_direction: 'pull'
      };

      const result = await repositoryIntegrationTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('mirror');
      expect(result.data.source_url).toBe('https://github.com/user/repo.git');
      expect(result.data.mirror_direction).toBe('pull');
    });

    it('should require source URL for mirror action', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'mirror',
        mirror_direction: 'pull'
      };

      const result = await repositoryIntegrationTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32602);
      expect(result.error?.message).toContain('Source URL is required');
    });
  });

  describe('Error handling', () => {
    it('should handle tool execution errors gracefully', async () => {
      // Mock a tool execution that throws an error
      const originalExecute = createRepositoryTool.execute;
      createRepositoryTool.execute = jest.fn().mockRejectedValue(new Error('Test error'));

      const params = {
        name: 'test-repo',
        workspace: 'test-workspace'
      };

      const result = await createRepositoryTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32603);
      expect(result.error?.message).toBe('Test error');

      // Restore original function
      createRepositoryTool.execute = originalExecute;
    });
  });

  describe('Tool metadata validation', () => {
    it('should have correct tool names', () => {
      expect(createRepositoryTool.name).toBe('create_repository');
      expect(listRepositoriesTool.name).toBe('list_repositories');
      expect(getRepositoryTool.name).toBe('get_repository');
      expect(updateRepositorySettingsTool.name).toBe('update_repository_settings');
      expect(manageRepositoryPermissionsTool.name).toBe('manage_repository_permissions');
      expect(repositoryLifecycleTool.name).toBe('repository_lifecycle');
      expect(branchManagementTool.name).toBe('branch_management');
      expect(webhookManagementTool.name).toBe('webhook_management');
      expect(repositoryIntegrationTool.name).toBe('repository_integration');
    });

    it('should have correct categories', () => {
      const tools = [
        createRepositoryTool,
        listRepositoriesTool,
        getRepositoryTool,
        updateRepositorySettingsTool,
        manageRepositoryPermissionsTool,
        repositoryLifecycleTool,
        branchManagementTool,
        webhookManagementTool,
        repositoryIntegrationTool
      ];

      tools.forEach(tool => {
        expect(tool.category).toBe('repository_management');
        expect(tool.enabled).toBe(true);
        expect(tool.version).toBe('1.0.0');
      });
    });

    it('should have required parameters', () => {
      expect(createRepositoryTool.parameters.length).toBeGreaterThan(0);
      expect(listRepositoriesTool.parameters.length).toBeGreaterThan(0);
      expect(getRepositoryTool.parameters.length).toBeGreaterThan(0);
      expect(updateRepositorySettingsTool.parameters.length).toBeGreaterThan(0);
      expect(manageRepositoryPermissionsTool.parameters.length).toBeGreaterThan(0);
      expect(repositoryLifecycleTool.parameters.length).toBeGreaterThan(0);
      expect(branchManagementTool.parameters.length).toBeGreaterThan(0);
      expect(webhookManagementTool.parameters.length).toBeGreaterThan(0);
      expect(repositoryIntegrationTool.parameters.length).toBeGreaterThan(0);
    });
  });
});
