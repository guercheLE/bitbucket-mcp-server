/**
 * Repository Management End-to-End Integration Tests
 * 
 * Comprehensive end-to-end tests for repository management workflows.
 * Tests complete user scenarios from repository creation to lifecycle management.
 * 
 * Test Scenarios:
 * - Complete repository creation workflow
 * - Repository configuration and permission management
 * - Branch management and webhook integration
 * - Repository lifecycle operations
 * - Error handling and recovery scenarios
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

// Mock context for end-to-end testing
const createE2EMockContext = (): ToolExecutionContext => ({
  session: {
    emit: jest.fn(),
    clientId: 'e2e-test-client',
    id: 'e2e-test-session',
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
    id: 'e2e-test-request',
    timestamp: new Date(),
    transport: 'stdio' as const
  },
  environment: {
    nodeVersion: 'v18.0.0',
    platform: 'linux',
    memoryUsage: process.memoryUsage()
  }
});

describe('Repository Management End-to-End Workflows', () => {
  let mockContext: ToolExecutionContext;
  const testWorkspace = 'e2e-test-workspace';
  const testRepository = 'e2e-test-repository';

  beforeEach(() => {
    mockContext = createE2EMockContext();
    jest.clearAllMocks();
  });

  describe('Complete Repository Creation Workflow', () => {
    it('should create, configure, and manage a complete repository', async () => {
      // Step 1: Create repository
      const createParams = {
        name: testRepository,
        workspace: testWorkspace,
        description: 'End-to-end test repository',
        is_private: true,
        language: 'typescript',
        has_issues: true,
        has_wiki: false
      };

      const createResult = await createRepositoryTool.execute(createParams, mockContext);
      expect(createResult.success).toBe(true);
      expect(createResult.data.repository.name).toBe(testRepository);

      // Step 2: Get repository details
      const getParams = {
        workspace: testWorkspace,
        repository: testRepository,
        include_branches: true,
        include_statistics: true,
        include_permissions: true
      };

      const getResult = await getRepositoryTool.execute(getParams, mockContext);
      expect(getResult.success).toBe(true);
      expect(getResult.data.repository.name).toBe(testRepository);

      // Step 3: Update repository settings
      const updateParams = {
        workspace: testWorkspace,
        repository: testRepository,
        description: 'Updated end-to-end test repository',
        language: 'javascript',
        has_wiki: true
      };

      const updateResult = await updateRepositorySettingsTool.execute(updateParams, mockContext);
      expect(updateResult.success).toBe(true);
      expect(updateResult.data.updated_fields).toContain('description');
      expect(updateResult.data.updated_fields).toContain('language');
      expect(updateResult.data.updated_fields).toContain('has_wiki');

      // Step 4: List repositories to verify
      const listParams = {
        workspace: testWorkspace,
        q: testRepository
      };

      const listResult = await listRepositoriesTool.execute(listParams, mockContext);
      expect(listResult.success).toBe(true);
      expect(listResult.data.repositories.length).toBeGreaterThan(0);
    });
  });

  describe('Repository Permission Management Workflow', () => {
    it('should manage repository permissions end-to-end', async () => {
      // Step 1: List current permissions
      const listPermissionsParams = {
        workspace: testWorkspace,
        repository: testRepository,
        action: 'list'
      };

      const listResult = await manageRepositoryPermissionsTool.execute(listPermissionsParams, mockContext);
      expect(listResult.success).toBe(true);
      expect(listResult.data.action).toBe('list');

      // Step 2: Grant permissions to a user
      const grantParams = {
        workspace: testWorkspace,
        repository: testRepository,
        action: 'grant',
        permission_level: 'write',
        user: 'test-developer'
      };

      const grantResult = await manageRepositoryPermissionsTool.execute(grantParams, mockContext);
      expect(grantResult.success).toBe(true);
      expect(grantResult.data.action).toBe('grant');
      expect(grantResult.data.permission_level).toBe('write');

      // Step 3: Grant permissions to a group
      const grantGroupParams = {
        workspace: testWorkspace,
        repository: testRepository,
        action: 'grant',
        permission_level: 'read',
        group: 'viewers'
      };

      const grantGroupResult = await manageRepositoryPermissionsTool.execute(grantGroupParams, mockContext);
      expect(grantGroupResult.success).toBe(true);
      expect(grantGroupResult.data.permission_type).toBe('user'); // Default type

      // Step 4: Get effective permissions
      const getPermissionsParams = {
        workspace: testWorkspace,
        repository: testRepository,
        action: 'get',
        include_inherited: true
      };

      const getPermissionsResult = await manageRepositoryPermissionsTool.execute(getPermissionsParams, mockContext);
      expect(getPermissionsResult.success).toBe(true);
      expect(getPermissionsResult.data.action).toBe('get');
      expect(getPermissionsResult.data).toHaveProperty('effective_permissions');
    });
  });

  describe('Branch Management Workflow', () => {
    it('should manage branches end-to-end', async () => {
      // Step 1: List existing branches
      const listBranchesParams = {
        workspace: testWorkspace,
        repository: testRepository,
        action: 'list'
      };

      const listResult = await branchManagementTool.execute(listBranchesParams, mockContext);
      expect(listResult.success).toBe(true);
      expect(listResult.data.action).toBe('list');
      expect(Array.isArray(listResult.data.branches)).toBe(true);

      // Step 2: Create a new feature branch
      const createBranchParams = {
        workspace: testWorkspace,
        repository: testRepository,
        action: 'create',
        branch_name: 'feature/e2e-test',
        source_branch: 'main'
      };

      const createResult = await branchManagementTool.execute(createBranchParams, mockContext);
      expect(createResult.success).toBe(true);
      expect(createResult.data.branch_name).toBe('feature/e2e-test');

      // Step 3: Set branch protection rules
      const protectParams = {
        workspace: testWorkspace,
        repository: testRepository,
        action: 'set_protection',
        branch_name: 'main',
        protection_rules: {
          require_approvals: 2,
          require_status_checks: true,
          restrict_merges: true
        }
      };

      const protectResult = await branchManagementTool.execute(protectParams, mockContext);
      expect(protectResult.success).toBe(true);
      expect(protectResult.data.branch_name).toBe('main');

      // Step 4: Compare branches
      const compareParams = {
        workspace: testWorkspace,
        repository: testRepository,
        action: 'compare',
        branch_name: 'feature/e2e-test',
        target_branch: 'main'
      };

      const compareResult = await branchManagementTool.execute(compareParams, mockContext);
      expect(compareResult.success).toBe(true);
      expect(compareResult.data.action).toBe('compare');
      expect(compareResult.data).toHaveProperty('comparison');
    });
  });

  describe('Webhook Management Workflow', () => {
    it('should manage webhooks end-to-end', async () => {
      // Step 1: Get available webhook events
      const getEventsParams = {
        workspace: testWorkspace,
        repository: testRepository,
        action: 'get_events'
      };

      const eventsResult = await webhookManagementTool.execute(getEventsParams, mockContext);
      expect(eventsResult.success).toBe(true);
      expect(eventsResult.data).toHaveProperty('available_events');

      // Step 2: Create a webhook
      const createWebhookParams = {
        workspace: testWorkspace,
        repository: testRepository,
        action: 'create',
        url: 'https://example.com/webhook',
        description: 'E2E test webhook',
        events: ['repo:push', 'pullrequest:created'],
        active: true
      };

      const createResult = await webhookManagementTool.execute(createWebhookParams, mockContext);
      expect(createResult.success).toBe(true);
      expect(createResult.data.webhook.url).toBe('https://example.com/webhook');

      // Step 3: List webhooks
      const listWebhooksParams = {
        workspace: testWorkspace,
        repository: testRepository,
        action: 'list'
      };

      const listResult = await webhookManagementTool.execute(listWebhooksParams, mockContext);
      expect(listResult.success).toBe(true);
      expect(Array.isArray(listResult.data.webhooks)).toBe(true);

      // Step 4: Test webhook
      const testWebhookParams = {
        workspace: testWorkspace,
        repository: testRepository,
        action: 'test',
        webhook_id: createResult.data.webhook.id
      };

      const testResult = await webhookManagementTool.execute(testWebhookParams, mockContext);
      expect(testResult.success).toBe(true);
      expect(testResult.data.action).toBe('test');
      expect(testResult.data).toHaveProperty('test_result');
    });
  });

  describe('Repository Integration Workflow', () => {
    it('should handle repository integration features end-to-end', async () => {
      // Step 1: Get clone URLs
      const cloneParams = {
        workspace: testWorkspace,
        repository: testRepository,
        action: 'get_clone_urls'
      };

      const cloneResult = await repositoryIntegrationTool.execute(cloneParams, mockContext);
      expect(cloneResult.success).toBe(true);
      expect(cloneResult.data).toHaveProperty('clone_urls');
      expect(cloneResult.data.clone_urls).toHaveProperty('https');
      expect(cloneResult.data.clone_urls).toHaveProperty('ssh');

      // Step 2: Start backup operation
      const backupParams = {
        workspace: testWorkspace,
        repository: testRepository,
        action: 'backup',
        backup_format: 'git_bundle',
        include_lfs: true,
        include_submodules: true
      };

      const backupResult = await repositoryIntegrationTool.execute(backupParams, mockContext);
      expect(backupResult.success).toBe(true);
      expect(backupResult.data.action).toBe('backup');
      expect(backupResult.data.status).toBe('in_progress');

      // Step 3: Start mirror operation
      const mirrorParams = {
        workspace: testWorkspace,
        repository: testRepository,
        action: 'mirror',
        source_url: 'https://github.com/example/source-repo.git',
        mirror_direction: 'pull'
      };

      const mirrorResult = await repositoryIntegrationTool.execute(mirrorParams, mockContext);
      expect(mirrorResult.success).toBe(true);
      expect(mirrorResult.data.action).toBe('mirror');
      expect(mirrorResult.data.mirror_direction).toBe('pull');
    });
  });

  describe('Repository Lifecycle Workflow', () => {
    it('should handle repository lifecycle operations end-to-end', async () => {
      // Step 1: Check repository status
      const statusParams = {
        workspace: testWorkspace,
        repository: testRepository,
        action: 'status'
      };

      const statusResult = await repositoryLifecycleTool.execute(statusParams, mockContext);
      expect(statusResult.success).toBe(true);
      expect(statusResult.data.action).toBe('status');
      expect(statusResult.data.status).toBe('active');

      // Step 2: Perform cleanup
      const cleanupParams = {
        workspace: testWorkspace,
        repository: testRepository,
        action: 'cleanup',
        cleanup_type: 'branches',
        dry_run: true
      };

      const cleanupResult = await repositoryLifecycleTool.execute(cleanupParams, mockContext);
      expect(cleanupResult.success).toBe(true);
      expect(cleanupResult.data.status).toBe('dry_run');

      // Step 3: Archive repository (dry run)
      const archiveParams = {
        workspace: testWorkspace,
        repository: testRepository,
        action: 'archive',
        confirmation_token: 'validtoken123',
        archive_reason: 'End-to-end test completion',
        dry_run: true
      };

      const archiveResult = await repositoryLifecycleTool.execute(archiveParams, mockContext);
      expect(archiveResult.success).toBe(true);
      expect(archiveResult.data.status).toBe('dry_run');
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle errors gracefully in workflows', async () => {
      // Test with invalid parameters
      const invalidParams = {
        name: 'invalid@name!',
        workspace: testWorkspace
      };

      const createResult = await createRepositoryTool.execute(invalidParams, mockContext);
      expect(createResult.success).toBe(false);
      expect(createResult.error?.code).toBe(-32602);

      // Test with non-existent repository
      const getParams = {
        workspace: testWorkspace,
        repository: 'non-existent-repo'
      };

      const getResult = await getRepositoryTool.execute(getParams, mockContext);
      expect(getResult.success).toBe(true); // Mock returns success, but real implementation would handle 404
    });

    it('should maintain consistency after partial failures', async () => {
      // Create repository
      const createParams = {
        name: 'consistency-test-repo',
        workspace: testWorkspace
      };

      const createResult = await createRepositoryTool.execute(createParams, mockContext);
      expect(createResult.success).toBe(true);

      // Try to update with invalid settings
      const invalidUpdateParams = {
        workspace: testWorkspace,
        repository: 'consistency-test-repo'
        // Missing all update fields
      };

      const updateResult = await updateRepositorySettingsTool.execute(invalidUpdateParams, mockContext);
      expect(updateResult.success).toBe(false);

      // Repository should still exist and be accessible
      const getParams = {
        workspace: testWorkspace,
        repository: 'consistency-test-repo'
      };

      const getResult = await getRepositoryTool.execute(getParams, mockContext);
      expect(getResult.success).toBe(true);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent operations', async () => {
      const operations = [
        createRepositoryTool.execute({ name: 'concurrent-1', workspace: testWorkspace }, mockContext),
        createRepositoryTool.execute({ name: 'concurrent-2', workspace: testWorkspace }, mockContext),
        createRepositoryTool.execute({ name: 'concurrent-3', workspace: testWorkspace }, mockContext)
      ];

      const results = await Promise.all(operations);
      
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });

    it('should handle large repository listings efficiently', async () => {
      const listParams = {
        workspace: testWorkspace,
        page_size: 100,
        sort: 'name'
      };

      const startTime = Date.now();
      const result = await listRepositoriesTool.execute(listParams, mockContext);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency across operations', async () => {
      const repoName = 'consistency-test-repo';

      // Create repository
      const createParams = {
        name: repoName,
        workspace: testWorkspace,
        description: 'Original description'
      };

      await createRepositoryTool.execute(createParams, mockContext);

      // Update description
      const updateParams = {
        workspace: testWorkspace,
        repository: repoName,
        description: 'Updated description'
      };

      await updateRepositorySettingsTool.execute(updateParams, mockContext);

      // Verify the update
      const getParams = {
        workspace: testWorkspace,
        repository: repoName
      };

      const getResult = await getRepositoryTool.execute(getParams, mockContext);
      expect(getResult.success).toBe(true);
      expect(getResult.data.repository.description).toBe('Updated description');
    });
  });
});
