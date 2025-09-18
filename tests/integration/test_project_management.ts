import { ProjectService } from '../../src/services/ProjectService';
import { AuthenticationService } from '../../src/services/AuthenticationService';
import { ServerDetectionService } from '../../src/services/server-detection';

/**
 * Integration test for Project management scenario
 * T020: Integration test Project management scenario in tests/integration/test_project_management.ts
 * 
 * This test MUST fail before implementation (Constitution Article V - TDD)
 * Tests complete project lifecycle management in Data Center
 */

describe('Project Management Integration Tests', () => {
  let projectService: ProjectService;
  let authService: AuthenticationService;
  let serverDetectionService: ServerDetectionService;

  beforeEach(() => {
    projectService = new ProjectService();
    authService = new AuthenticationService();
    serverDetectionService = new ServerDetectionService();
  });

  describe('Project Lifecycle Management', () => {
    it('should complete full project lifecycle: create, read, update, delete', async () => {
      const serverInfo = {
        serverType: 'datacenter' as const,
        version: '7.16.0',
        baseUrl: 'https://bitbucket.example.com',
        isSupported: true
      };

      // Authenticate
      const authResult = await authService.authenticateWithToken({
        serverInfo,
        token: 'test-token',
        tokenType: 'personal'
      });

      // Step 1: List existing projects
      const initialProjects = await projectService.listProjects({
        serverInfo,
        auth: authResult,
        start: 0,
        limit: 25
      });

      expect(initialProjects).toHaveProperty('values');
      expect(Array.isArray(initialProjects.values)).toBe(true);

      // Step 2: Create new project
      const newProject = await projectService.createProject({
        serverInfo,
        auth: authResult,
        key: 'TEST',
        name: 'Test Project',
        description: 'A test project for integration testing',
        isPublic: false
      });

      expect(newProject).toHaveProperty('key', 'TEST');
      expect(newProject).toHaveProperty('name', 'Test Project');
      expect(newProject).toHaveProperty('description', 'A test project for integration testing');
      expect(newProject).toHaveProperty('isPublic', false);
      expect(newProject).toHaveProperty('links');

      // Step 3: Get project details
      const projectDetails = await projectService.getProject({
        serverInfo,
        auth: authResult,
        projectKey: 'TEST'
      });

      expect(projectDetails).toEqual(newProject);

      // Step 4: Update project
      const updatedProject = await projectService.updateProject({
        serverInfo,
        auth: authResult,
        projectKey: 'TEST',
        name: 'Updated Test Project',
        description: 'Updated description',
        isPublic: true
      });

      expect(updatedProject).toHaveProperty('name', 'Updated Test Project');
      expect(updatedProject).toHaveProperty('description', 'Updated description');
      expect(updatedProject).toHaveProperty('isPublic', true);

      // Step 5: Delete project
      await projectService.deleteProject({
        serverInfo,
        auth: authResult,
        projectKey: 'TEST'
      });

      // Step 6: Verify project is deleted
      await expect(projectService.getProject({
        serverInfo,
        auth: authResult,
        projectKey: 'TEST'
      })).rejects.toThrow('Project not found');
    });

    it('should handle project creation with all optional fields', async () => {
      const serverInfo = {
        serverType: 'datacenter' as const,
        version: '7.16.0',
        baseUrl: 'https://bitbucket.example.com',
        isSupported: true
      };

      const authResult = await authService.authenticateWithToken({
        serverInfo,
        token: 'test-token',
        tokenType: 'personal'
      });

      const project = await projectService.createProject({
        serverInfo,
        auth: authResult,
        key: 'FULL',
        name: 'Full Featured Project',
        description: 'Project with all features',
        avatar: 'https://example.com/avatar.png',
        isPublic: true
      });

      expect(project).toHaveProperty('key', 'FULL');
      expect(project).toHaveProperty('name', 'Full Featured Project');
      expect(project).toHaveProperty('description', 'Project with all features');
      expect(project).toHaveProperty('avatar', 'https://example.com/avatar.png');
      expect(project).toHaveProperty('isPublic', true);

      // Cleanup
      await projectService.deleteProject({
        serverInfo,
        auth: authResult,
        projectKey: 'FULL'
      });
    });
  });

  describe('Project Permissions Management', () => {
    it('should manage project permissions: add, list, remove', async () => {
      const serverInfo = {
        serverType: 'datacenter' as const,
        version: '7.16.0',
        baseUrl: 'https://bitbucket.example.com',
        isSupported: true
      };

      const authResult = await authService.authenticateWithToken({
        serverInfo,
        token: 'test-token',
        tokenType: 'personal'
      });

      // Create test project
      const project = await projectService.createProject({
        serverInfo,
        auth: authResult,
        key: 'PERM',
        name: 'Permission Test Project'
      });

      // Step 1: Add user permission
      await projectService.addPermission({
        serverInfo,
        auth: authResult,
        projectKey: 'PERM',
        user: 'test-user',
        permission: 'PROJECT_READ'
      });

      // Step 2: Add group permission
      await projectService.addPermission({
        serverInfo,
        auth: authResult,
        projectKey: 'PERM',
        group: 'developers',
        permission: 'PROJECT_WRITE'
      });

      // Step 3: List permissions
      const permissions = await projectService.getPermissions({
        serverInfo,
        auth: authResult,
        projectKey: 'PERM'
      });

      expect(permissions).toHaveLength(2);
      expect(permissions).toContainEqual(expect.objectContaining({
        user: 'test-user',
        permission: 'PROJECT_READ'
      }));
      expect(permissions).toContainEqual(expect.objectContaining({
        group: 'developers',
        permission: 'PROJECT_WRITE'
      }));

      // Step 4: Remove user permission
      await projectService.removePermission({
        serverInfo,
        auth: authResult,
        projectKey: 'PERM',
        user: 'test-user',
        permission: 'PROJECT_READ'
      });

      // Step 5: Verify permission removed
      const updatedPermissions = await projectService.getPermissions({
        serverInfo,
        auth: authResult,
        projectKey: 'PERM'
      });

      expect(updatedPermissions).toHaveLength(1);
      expect(updatedPermissions).not.toContainEqual(expect.objectContaining({
        user: 'test-user'
      }));

      // Cleanup
      await projectService.deleteProject({
        serverInfo,
        auth: authResult,
        projectKey: 'PERM'
      });
    });
  });

  describe('Project Settings Management', () => {
    it('should manage project settings', async () => {
      const serverInfo = {
        serverType: 'datacenter' as const,
        version: '7.16.0',
        baseUrl: 'https://bitbucket.example.com',
        isSupported: true
      };

      const authResult = await authService.authenticateWithToken({
        serverInfo,
        token: 'test-token',
        tokenType: 'personal'
      });

      // Create test project
      const project = await projectService.createProject({
        serverInfo,
        auth: authResult,
        key: 'SETT',
        name: 'Settings Test Project'
      });

      // Step 1: Get default settings
      const defaultSettings = await projectService.getSettings({
        serverInfo,
        auth: authResult,
        projectKey: 'SETT'
      });

      expect(defaultSettings).toHaveProperty('defaultBranch');
      expect(defaultSettings).toHaveProperty('defaultMergeStrategy');

      // Step 2: Update settings
      const updatedSettings = await projectService.updateSettings({
        serverInfo,
        auth: authResult,
        projectKey: 'SETT',
        settings: {
          defaultBranch: 'main',
          defaultMergeStrategy: 'merge-commit',
          defaultCommitMessage: 'Merge {source} into {target}'
        }
      });

      expect(updatedSettings).toHaveProperty('defaultBranch', 'main');
      expect(updatedSettings).toHaveProperty('defaultMergeStrategy', 'merge-commit');
      expect(updatedSettings).toHaveProperty('defaultCommitMessage', 'Merge {source} into {target}');

      // Cleanup
      await projectService.deleteProject({
        serverInfo,
        auth: authResult,
        projectKey: 'SETT'
      });
    });
  });

  describe('Project Webhooks Management', () => {
    it('should manage project webhooks: create, list, update, delete', async () => {
      const serverInfo = {
        serverType: 'datacenter' as const,
        version: '7.16.0',
        baseUrl: 'https://bitbucket.example.com',
        isSupported: true
      };

      const authResult = await authService.authenticateWithToken({
        serverInfo,
        token: 'test-token',
        tokenType: 'personal'
      });

      // Create test project
      const project = await projectService.createProject({
        serverInfo,
        auth: authResult,
        key: 'HOOK',
        name: 'Webhook Test Project'
      });

      // Step 1: Create webhook
      const webhook = await projectService.createHook({
        serverInfo,
        auth: authResult,
        projectKey: 'HOOK',
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        events: ['repo:push', 'pullrequest:created'],
        active: true
      });

      expect(webhook).toHaveProperty('id');
      expect(webhook).toHaveProperty('url', 'https://example.com/webhook');
      expect(webhook).toHaveProperty('events');
      expect(webhook.events).toContain('repo:push');
      expect(webhook.events).toContain('pullrequest:created');
      expect(webhook).toHaveProperty('active', true);

      // Step 2: List webhooks
      const webhooks = await projectService.getHooks({
        serverInfo,
        auth: authResult,
        projectKey: 'HOOK'
      });

      expect(webhooks).toHaveLength(1);
      expect(webhooks[0]).toEqual(webhook);

      // Step 3: Update webhook
      const updatedWebhook = await projectService.updateHook({
        serverInfo,
        auth: authResult,
        projectKey: 'HOOK',
        hookId: webhook.id,
        name: 'Updated Test Webhook',
        events: ['repo:push'],
        active: false
      });

      expect(updatedWebhook).toHaveProperty('name', 'Updated Test Webhook');
      expect(updatedWebhook).toHaveProperty('events', ['repo:push']);
      expect(updatedWebhook).toHaveProperty('active', false);

      // Step 4: Delete webhook
      await projectService.deleteHook({
        serverInfo,
        auth: authResult,
        projectKey: 'HOOK',
        hookId: webhook.id
      });

      // Step 5: Verify webhook deleted
      const finalWebhooks = await projectService.getHooks({
        serverInfo,
        auth: authResult,
        projectKey: 'HOOK'
      });

      expect(finalWebhooks).toHaveLength(0);

      // Cleanup
      await projectService.deleteProject({
        serverInfo,
        auth: authResult,
        projectKey: 'HOOK'
      });
    });
  });

  describe('Project Avatar Management', () => {
    it('should manage project avatar: upload, get, delete', async () => {
      const serverInfo = {
        serverType: 'datacenter' as const,
        version: '7.16.0',
        baseUrl: 'https://bitbucket.example.com',
        isSupported: true
      };

      const authResult = await authService.authenticateWithToken({
        serverInfo,
        token: 'test-token',
        tokenType: 'personal'
      });

      // Create test project
      const project = await projectService.createProject({
        serverInfo,
        auth: authResult,
        key: 'AVAT',
        name: 'Avatar Test Project'
      });

      // Step 1: Upload avatar
      const avatarData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const uploadedAvatar = await projectService.uploadAvatar({
        serverInfo,
        auth: authResult,
        projectKey: 'AVAT',
        avatarData,
        contentType: 'image/png'
      });

      expect(uploadedAvatar).toHaveProperty('id');
      expect(uploadedAvatar).toHaveProperty('contentType', 'image/png');
      expect(uploadedAvatar).toHaveProperty('size');

      // Step 2: Get avatar
      const avatar = await projectService.getAvatar({
        serverInfo,
        auth: authResult,
        projectKey: 'AVAT'
      });

      expect(avatar).toEqual(uploadedAvatar);

      // Step 3: Delete avatar
      await projectService.deleteAvatar({
        serverInfo,
        auth: authResult,
        projectKey: 'AVAT'
      });

      // Step 4: Verify avatar deleted
      await expect(projectService.getAvatar({
        serverInfo,
        auth: authResult,
        projectKey: 'AVAT'
      })).rejects.toThrow('Avatar not found');

      // Cleanup
      await projectService.deleteProject({
        serverInfo,
        auth: authResult,
        projectKey: 'AVAT'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle duplicate project key error', async () => {
      const serverInfo = {
        serverType: 'datacenter' as const,
        version: '7.16.0',
        baseUrl: 'https://bitbucket.example.com',
        isSupported: true
      };

      const authResult = await authService.authenticateWithToken({
        serverInfo,
        token: 'test-token',
        tokenType: 'personal'
      });

      // Create first project
      await projectService.createProject({
        serverInfo,
        auth: authResult,
        key: 'DUP',
        name: 'First Project'
      });

      // Try to create second project with same key
      await expect(projectService.createProject({
        serverInfo,
        auth: authResult,
        key: 'DUP',
        name: 'Second Project'
      })).rejects.toThrow('Project key already exists');

      // Cleanup
      await projectService.deleteProject({
        serverInfo,
        auth: authResult,
        projectKey: 'DUP'
      });
    });

    it('should handle insufficient permissions error', async () => {
      const serverInfo = {
        serverType: 'datacenter' as const,
        version: '7.16.0',
        baseUrl: 'https://bitbucket.example.com',
        isSupported: true
      };

      const authResult = await authService.authenticateWithToken({
        serverInfo,
        token: 'readonly-token',
        tokenType: 'personal'
      });

      await expect(projectService.createProject({
        serverInfo,
        auth: authResult,
        key: 'NOPERM',
        name: 'No Permission Project'
      })).rejects.toThrow('Insufficient permissions');
    });
  });

  describe('Performance Requirements', () => {
    it('should complete project operations within performance limits', async () => {
      const serverInfo = {
        serverType: 'datacenter' as const,
        version: '7.16.0',
        baseUrl: 'https://bitbucket.example.com',
        isSupported: true
      };

      const authResult = await authService.authenticateWithToken({
        serverInfo,
        token: 'test-token',
        tokenType: 'personal'
      });

      // Test project creation performance
      const startTime = Date.now();
      const project = await projectService.createProject({
        serverInfo,
        auth: authResult,
        key: 'PERF',
        name: 'Performance Test Project'
      });
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(2000); // 2 seconds

      // Test project listing performance
      const listStartTime = Date.now();
      await projectService.listProjects({
        serverInfo,
        auth: authResult,
        start: 0,
        limit: 25
      });
      const listEndTime = Date.now();

      expect(listEndTime - listStartTime).toBeLessThan(2000); // 2 seconds

      // Cleanup
      await projectService.deleteProject({
        serverInfo,
        auth: authResult,
        projectKey: 'PERF'
      });
    });
  });
});
