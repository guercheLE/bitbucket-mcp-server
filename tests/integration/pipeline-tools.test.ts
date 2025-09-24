/**
 * Pipeline Tools Integration Tests
 * 
 * Integration tests for pipeline management MCP tools, testing
 * the complete workflow from tool invocation to service execution.
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { executeCreatePipeline } from '../../src/server/tools/create_pipeline.js';
import { executeExecutePipeline } from '../../src/server/tools/execute_pipeline.js';
import { executeMonitorPipeline } from '../../src/server/tools/monitor_pipeline.js';
import { executeManagePipelinePermissions } from '../../src/server/tools/manage_pipeline_permissions.js';

// Mock the PipelineService
vi.mock('../../src/server/services/pipeline-service.js', () => ({
  PipelineService: vi.fn().mockImplementation(() => ({
    createPipeline: vi.fn(),
    updatePipeline: vi.fn(),
    getPipeline: vi.fn(),
    runPipeline: vi.fn(),
    getPipelineRun: vi.fn(),
    listPipelineRuns: vi.fn(),
    stopPipelineRun: vi.fn(),
    getActiveRuns: vi.fn(() => [])
  }))
}));

describe('Pipeline Tools Integration', () => {
  let mockPipelineService: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock environment variables
    process.env.BITBUCKET_API_URL = 'https://api.bitbucket.org/2.0';
    process.env.BITBUCKET_AUTH_TOKEN = 'test-token';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('create_pipeline tool', () => {
    it('should create a pipeline successfully', async () => {
      const mockPipeline = {
        id: 'pipeline-123',
        name: 'Test Pipeline',
        repository: 'workspace/test-repo',
        status: 'active',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        createdBy: {
          name: 'Test User'
        },
        configuration: {
          triggers: ['manual'],
          environment: 'default',
          variables: { NODE_ENV: 'test' },
          steps: [
            {
              name: 'Build',
              type: 'build',
              command: 'npm run build',
              script: 'npm run build',
              timeout: 300
            }
          ],
          notifications: {
            email: [],
            webhook: '',
            slack: ''
          }
        },
        permissions: {
          users: ['admin@example.com'],
          groups: ['developers'],
          public: false
        }
      };

      // Mock the service method
      const { PipelineService } = await import('../../src/server/services/pipeline-service.js');
      mockPipelineService = new PipelineService();
      mockPipelineService.createPipeline.mockResolvedValue({
        success: true,
        data: mockPipeline
      });

      const input = {
        repository: 'workspace/test-repo',
        name: 'Test Pipeline',
        description: 'A test pipeline for integration testing',
        configuration: {
          triggers: ['manual'],
          environment: 'default',
          variables: { NODE_ENV: 'test' },
          steps: [
            {
              name: 'Build',
              type: 'build',
              command: 'npm run build',
              script: 'npm run build',
              timeout: 300
            }
          ],
          notifications: {
            email: ['admin@example.com'],
            webhook: 'https://hooks.slack.com/test',
            slack: '#builds'
          }
        },
        permissions: {
          users: ['admin@example.com'],
          groups: ['developers'],
          public: false
        }
      };

      const result = await executeCreatePipeline(input);

      expect(result.success).toBe(true);
      expect(result.pipeline).toBeDefined();
      expect(result.pipeline?.id).toBe('pipeline-123');
      expect(result.pipeline?.name).toBe('Test Pipeline');
      expect(mockPipelineService.createPipeline).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Pipeline',
          description: 'A test pipeline for integration testing',
          repositoryId: 'workspace/test-repo'
        })
      );
    });

    it('should handle validation errors', async () => {
      const input = {
        repository: '',
        name: '',
        configuration: {
          triggers: ['invalid-trigger'],
          steps: [
            {
              name: '',
              type: 'invalid-type'
            }
          ]
        }
      };

      const result = await executeCreatePipeline(input);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle service errors', async () => {
      const { PipelineService } = await import('../../src/server/services/pipeline-service.js');
      mockPipelineService = new PipelineService();
      mockPipelineService.createPipeline.mockResolvedValue({
        success: false,
        error: {
          message: 'Repository not found'
        }
      });

      const input = {
        repository: 'nonexistent/repo',
        name: 'Test Pipeline',
        configuration: {
          triggers: ['manual'],
          steps: []
        }
      };

      const result = await executeCreatePipeline(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Repository not found');
    });
  });

  describe('execute_pipeline tool', () => {
    it('should start a pipeline successfully', async () => {
      const mockRun = {
        id: 'run-123',
        status: 'running',
        startTime: new Date('2023-01-01T00:00:00Z'),
        steps: [
          {
            name: 'Build',
            type: 'build',
            status: 'running'
          },
          {
            name: 'Test',
            type: 'test',
            status: 'pending'
          }
        ]
      };

      const { PipelineService } = await import('../../src/server/services/pipeline-service.js');
      mockPipelineService = new PipelineService();
      mockPipelineService.runPipeline.mockResolvedValue({
        success: true,
        data: mockRun
      });

      const input = {
        pipeline_id: 'pipeline-123',
        repository: 'workspace/test-repo',
        action: 'start',
        parameters: {
          branch: 'main',
          variables: { NODE_ENV: 'production' },
          environment: 'production',
          timeout: 1800
        }
      };

      const result = await executeExecutePipeline(input);

      expect(result.success).toBe(true);
      expect(result.execution).toBeDefined();
      expect(result.execution?.id).toBe('run-123');
      expect(result.execution?.action).toBe('start');
      expect(result.execution?.status).toBe('running');
      expect(mockPipelineService.runPipeline).toHaveBeenCalledWith(
        expect.objectContaining({
          pipelineId: 'pipeline-123',
          environment: 'production',
          variables: { NODE_ENV: 'production' },
          branch: 'main'
        })
      );
    });

    it('should stop a pipeline successfully', async () => {
      const mockRun = {
        id: 'run-123',
        status: 'cancelled',
        startTime: new Date('2023-01-01T00:00:00Z'),
        steps: []
      };

      const { PipelineService } = await import('../../src/server/services/pipeline-service.js');
      mockPipelineService = new PipelineService();
      mockPipelineService.stopPipelineRun.mockResolvedValue({
        success: true,
        data: mockRun
      });

      const input = {
        pipeline_id: 'pipeline-123',
        repository: 'workspace/test-repo',
        action: 'stop'
      };

      const result = await executeExecutePipeline(input);

      expect(result.success).toBe(true);
      expect(result.execution?.action).toBe('stop');
      expect(result.execution?.status).toBe('cancelled');
      expect(mockPipelineService.stopPipelineRun).toHaveBeenCalledWith('pipeline-123');
    });

    it('should restart a pipeline successfully', async () => {
      const mockRun = {
        id: 'run-124',
        status: 'running',
        startTime: new Date('2023-01-01T00:00:00Z'),
        steps: []
      };

      const { PipelineService } = await import('../../src/server/services/pipeline-service.js');
      mockPipelineService = new PipelineService();
      mockPipelineService.stopPipelineRun.mockResolvedValue({
        success: true,
        data: { id: 'run-123', status: 'cancelled' }
      });
      mockPipelineService.runPipeline.mockResolvedValue({
        success: true,
        data: mockRun
      });

      const input = {
        pipeline_id: 'pipeline-123',
        repository: 'workspace/test-repo',
        action: 'restart',
        parameters: {
          branch: 'main',
          variables: { NODE_ENV: 'test' }
        }
      };

      const result = await executeExecutePipeline(input);

      expect(result.success).toBe(true);
      expect(result.execution?.action).toBe('restart');
      expect(result.execution?.status).toBe('running');
      expect(mockPipelineService.stopPipelineRun).toHaveBeenCalledWith('pipeline-123');
      expect(mockPipelineService.runPipeline).toHaveBeenCalled();
    });

    it('should handle invalid actions', async () => {
      const input = {
        pipeline_id: 'pipeline-123',
        repository: 'workspace/test-repo',
        action: 'invalid-action' as any
      };

      const result = await executeExecutePipeline(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Action must be start, stop, or restart');
    });
  });

  describe('monitor_pipeline tool', () => {
    it('should monitor a specific pipeline run', async () => {
      const mockRun = {
        id: 'run-123',
        status: 'running',
        startTime: new Date('2023-01-01T00:00:00Z'),
        duration: 120000, // 2 minutes
        steps: [
          {
            name: 'Build',
            type: 'build',
            status: 'success'
          },
          {
            name: 'Test',
            type: 'test',
            status: 'running'
          }
        ],
        logs: {
          entries: [
            {
              timestamp: new Date('2023-01-01T00:00:00Z'),
              level: 'info',
              message: 'Pipeline started',
              source: 'system'
            }
          ]
        },
        artifacts: [
          {
            id: 'artifact-123',
            name: 'build-output.zip',
            type: 'archive',
            size: 2048576,
            downloadUrl: 'https://api.bitbucket.org/2.0/artifacts/artifact-123/download'
          }
        ]
      };

      const { PipelineService } = await import('../../src/server/services/pipeline-service.js');
      mockPipelineService = new PipelineService();
      mockPipelineService.getPipelineRun.mockResolvedValue({
        success: true,
        data: mockRun
      });

      const input = {
        pipeline_id: 'pipeline-123',
        repository: 'workspace/test-repo',
        execution_id: 'run-123',
        include_logs: true,
        include_artifacts: true,
        poll_interval: 30
      };

      const result = await executeMonitorPipeline(input);

      expect(result.success).toBe(true);
      expect(result.monitoring).toBeDefined();
      expect(result.monitoring?.execution_id).toBe('run-123');
      expect(result.monitoring?.status).toBe('running');
      expect(result.monitoring?.progress.completed_steps).toBe(1);
      expect(result.monitoring?.progress.total_steps).toBe(2);
      expect(result.monitoring?.progress.percentage).toBe(50);
      expect(result.monitoring?.logs).toBeDefined();
      expect(result.monitoring?.artifacts).toBeDefined();
      expect(mockPipelineService.getPipelineRun).toHaveBeenCalledWith('run-123');
    });

    it('should monitor the latest pipeline run', async () => {
      const mockRun = {
        id: 'run-123',
        status: 'success',
        startTime: new Date('2023-01-01T00:00:00Z'),
        endTime: new Date('2023-01-01T00:05:00Z'),
        duration: 300000, // 5 minutes
        steps: [
          {
            name: 'Build',
            type: 'build',
            status: 'success'
          },
          {
            name: 'Test',
            type: 'test',
            status: 'success'
          }
        ]
      };

      const { PipelineService } = await import('../../src/server/services/pipeline-service.js');
      mockPipelineService = new PipelineService();
      mockPipelineService.listPipelineRuns.mockResolvedValue({
        success: true,
        data: [mockRun]
      });

      const input = {
        pipeline_id: 'pipeline-123',
        repository: 'workspace/test-repo',
        include_logs: false,
        include_artifacts: false,
        poll_interval: 60
      };

      const result = await executeMonitorPipeline(input);

      expect(result.success).toBe(true);
      expect(result.monitoring?.execution_id).toBe('run-123');
      expect(result.monitoring?.status).toBe('success');
      expect(result.monitoring?.progress.percentage).toBe(100);
      expect(mockPipelineService.listPipelineRuns).toHaveBeenCalledWith(
        expect.objectContaining({
          pipelineId: 'pipeline-123',
          pagination: { page: 1, limit: 1 }
        })
      );
    });

    it('should handle no pipeline runs found', async () => {
      const { PipelineService } = await import('../../src/server/services/pipeline-service.js');
      mockPipelineService = new PipelineService();
      mockPipelineService.listPipelineRuns.mockResolvedValue({
        success: true,
        data: []
      });

      const input = {
        pipeline_id: 'pipeline-123',
        repository: 'workspace/test-repo'
      };

      const result = await executeMonitorPipeline(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No pipeline runs found');
    });
  });

  describe('manage_pipeline_permissions tool', () => {
    it('should grant permissions successfully', async () => {
      const mockPipeline = {
        id: 'pipeline-123',
        name: 'Test Pipeline',
        permissions: {
          read: [],
          write: [],
          admin: [],
          readGroups: [],
          writeGroups: [],
          adminGroups: [],
          public: false
        },
        createdAt: new Date('2023-01-01T00:00:00Z'),
        createdBy: {
          name: 'Test User'
        }
      };

      const { PipelineService } = await import('../../src/server/services/pipeline-service.js');
      mockPipelineService = new PipelineService();
      mockPipelineService.getPipeline.mockResolvedValue({
        success: true,
        data: mockPipeline
      });
      mockPipelineService.updatePipeline.mockResolvedValue({
        success: true,
        data: { ...mockPipeline, updatedAt: new Date() }
      });

      const input = {
        pipeline_id: 'pipeline-123',
        repository: 'workspace/test-repo',
        action: 'grant',
        permissions: [
          {
            user: 'developer@example.com',
            role: 'execute',
            scope: 'pipeline'
          },
          {
            group: 'developers',
            role: 'view',
            scope: 'pipeline'
          }
        ],
        options: {
          notify_users: true,
          audit_changes: true
        }
      };

      const result = await executeManagePipelinePermissions(input);

      expect(result.success).toBe(true);
      expect(result.result?.action).toBe('grant');
      expect(result.result?.permissions).toHaveLength(2);
      expect(result.result?.audit_log).toHaveLength(2);
      expect(mockPipelineService.getPipeline).toHaveBeenCalledWith('pipeline-123');
      expect(mockPipelineService.updatePipeline).toHaveBeenCalled();
    });

    it('should revoke permissions successfully', async () => {
      const mockPipeline = {
        id: 'pipeline-123',
        name: 'Test Pipeline',
        permissions: {
          read: ['viewer@example.com'],
          write: ['developer@example.com'],
          admin: ['admin@example.com'],
          readGroups: ['viewers'],
          writeGroups: ['developers'],
          adminGroups: ['admins'],
          public: false
        },
        createdAt: new Date('2023-01-01T00:00:00Z'),
        createdBy: {
          name: 'Test User'
        }
      };

      const { PipelineService } = await import('../../src/server/services/pipeline-service.js');
      mockPipelineService = new PipelineService();
      mockPipelineService.getPipeline.mockResolvedValue({
        success: true,
        data: mockPipeline
      });
      mockPipelineService.updatePipeline.mockResolvedValue({
        success: true,
        data: { ...mockPipeline, updatedAt: new Date() }
      });

      const input = {
        pipeline_id: 'pipeline-123',
        repository: 'workspace/test-repo',
        action: 'revoke',
        permissions: [
          {
            user: 'developer@example.com',
            role: 'execute',
            scope: 'pipeline'
          }
        ],
        options: {
          audit_changes: true
        }
      };

      const result = await executeManagePipelinePermissions(input);

      expect(result.success).toBe(true);
      expect(result.result?.action).toBe('revoke');
      expect(result.result?.audit_log).toHaveLength(1);
      expect(mockPipelineService.updatePipeline).toHaveBeenCalled();
    });

    it('should list permissions successfully', async () => {
      const mockPipeline = {
        id: 'pipeline-123',
        name: 'Test Pipeline',
        permissions: {
          read: ['viewer@example.com'],
          write: ['developer@example.com'],
          admin: ['admin@example.com'],
          readGroups: ['viewers'],
          writeGroups: ['developers'],
          adminGroups: ['admins'],
          public: false
        },
        createdAt: new Date('2023-01-01T00:00:00Z'),
        createdBy: {
          name: 'Test User'
        }
      };

      const { PipelineService } = await import('../../src/server/services/pipeline-service.js');
      mockPipelineService = new PipelineService();
      mockPipelineService.getPipeline.mockResolvedValue({
        success: true,
        data: mockPipeline
      });

      const input = {
        pipeline_id: 'pipeline-123',
        repository: 'workspace/test-repo',
        action: 'list'
      };

      const result = await executeManagePipelinePermissions(input);

      expect(result.success).toBe(true);
      expect(result.result?.action).toBe('list');
      expect(result.result?.permissions).toBeDefined();
      expect(result.result?.permissions?.length).toBeGreaterThan(0);
      expect(result.result?.summary).toBeDefined();
      expect(mockPipelineService.getPipeline).toHaveBeenCalledWith('pipeline-123');
    });

    it('should handle pipeline not found', async () => {
      const { PipelineService } = await import('../../src/server/services/pipeline-service.js');
      mockPipelineService = new PipelineService();
      mockPipelineService.getPipeline.mockResolvedValue({
        success: false,
        error: {
          message: 'Pipeline not found'
        }
      });

      const input = {
        pipeline_id: 'nonexistent-pipeline',
        repository: 'workspace/test-repo',
        action: 'list'
      };

      const result = await executeManagePipelinePermissions(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Pipeline not found');
    });

    it('should validate permission requirements', async () => {
      const input = {
        pipeline_id: 'pipeline-123',
        repository: 'workspace/test-repo',
        action: 'grant',
        permissions: [
          {
            role: 'execute',
            scope: 'pipeline'
            // Missing user or group
          }
        ]
      };

      const result = await executeManagePipelinePermissions(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Either user or group must be specified');
    });
  });

  describe('error handling across tools', () => {
    it('should handle service initialization errors', async () => {
      // Mock environment variables to be undefined
      delete process.env.BITBUCKET_API_URL;
      delete process.env.BITBUCKET_AUTH_TOKEN;

      const input = {
        repository: 'workspace/test-repo',
        name: 'Test Pipeline',
        configuration: {
          triggers: ['manual'],
          steps: []
        }
      };

      const result = await executeCreatePipeline(input);

      // Should still work with default values
      expect(result).toBeDefined();
    });

    it('should handle network timeouts', async () => {
      const { PipelineService } = await import('../../src/server/services/pipeline-service.js');
      mockPipelineService = new PipelineService();
      mockPipelineService.createPipeline.mockRejectedValue(new Error('Request timeout'));

      const input = {
        repository: 'workspace/test-repo',
        name: 'Test Pipeline',
        configuration: {
          triggers: ['manual'],
          steps: []
        }
      };

      const result = await executeCreatePipeline(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Request timeout');
    });
  });
});
