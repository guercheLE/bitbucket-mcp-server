/**
 * Pipeline Service Unit Tests
 * 
 * Comprehensive unit tests for the PipelineService class, covering
 * all major functionality including pipeline management, execution,
 * monitoring, and error handling.
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { PipelineService, type PipelineServiceConfig } from '../../src/server/services/pipeline-service.js';
import {
  Pipeline,
  PipelineRun,
  PipelineStatus,
  PipelineRunStatus,
  CreatePipelineRequest,
  UpdatePipelineRequest,
  RunPipelineRequest,
  ListPipelinesRequest,
  ListPipelineRunsRequest
} from '../../src/types/pipeline.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('PipelineService', () => {
  let pipelineService: PipelineService;
  let mockConfig: PipelineServiceConfig;

  beforeEach(() => {
    mockConfig = {
      apiBaseUrl: 'https://api.bitbucket.org/2.0',
      authToken: 'test-token',
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
      enableCaching: true,
      cacheTtl: 300000,
      enableMonitoring: true,
      monitoringInterval: 5000
    };

    pipelineService = new PipelineService(mockConfig);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createPipeline', () => {
    it('should create a pipeline successfully', async () => {
      const mockPipelineData = {
        uuid: 'pipeline-123',
        name: 'Test Pipeline',
        description: 'A test pipeline',
        repository: {
          uuid: 'repo-123',
          name: 'test-repo',
          full_name: 'workspace/test-repo',
          workspace: { slug: 'workspace' }
        },
        configuration: {
          name: 'Test Pipeline',
          steps: [],
          triggers: [],
          environments: [],
          variables: {},
          secrets: {},
          enabled: true,
          tags: []
        },
        status: 'active',
        created_on: '2023-01-01T00:00:00Z',
        updated_on: '2023-01-01T00:00:00Z',
        created_by: {
          uuid: 'user-123',
          display_name: 'Test User',
          email_address: 'test@example.com'
        },
        permissions: {
          read: [],
          write: [],
          admin: [],
          readGroups: [],
          writeGroups: [],
          adminGroups: [],
          public: false
        },
        stats: {
          totalRuns: 0,
          successfulRuns: 0,
          failedRuns: 0,
          cancelledRuns: 0,
          averageDuration: 0,
          successRate: 0
        }
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPipelineData
      });

      const createRequest: CreatePipelineRequest = {
        name: 'Test Pipeline',
        description: 'A test pipeline',
        repositoryId: 'repo-123',
        configuration: {
          name: 'Test Pipeline',
          description: 'A test pipeline',
          steps: [],
          triggers: [],
          environments: [],
          variables: {},
          secrets: {},
          enabled: true,
          tags: []
        }
      };

      const result = await pipelineService.createPipeline(createRequest);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe('pipeline-123');
      expect(result.data?.name).toBe('Test Pipeline');
      expect(result.data?.status).toBe(PipelineStatus.ACTIVE);
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      });

      const createRequest: CreatePipelineRequest = {
        name: 'Test Pipeline',
        repositoryId: 'repo-123',
        configuration: {
          name: 'Test Pipeline',
          steps: [],
          triggers: [],
          environments: [],
          variables: {},
          secrets: {},
          enabled: true,
          tags: []
        }
      };

      const result = await pipelineService.createPipeline(createRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate required fields', async () => {
      const createRequest = {
        name: '',
        repositoryId: 'repo-123',
        configuration: {
          name: 'Test Pipeline',
          steps: [],
          triggers: [],
          environments: [],
          variables: {},
          secrets: {},
          enabled: true,
          tags: []
        }
      } as CreatePipelineRequest;

      const result = await pipelineService.createPipeline(createRequest);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Pipeline name is required');
    });
  });

  describe('updatePipeline', () => {
    it('should update a pipeline successfully', async () => {
      const existingPipeline: Pipeline = {
        id: 'pipeline-123',
        name: 'Test Pipeline',
        description: 'A test pipeline',
        repository: {
          id: 'repo-123',
          name: 'test-repo',
          fullName: 'workspace/test-repo',
          workspace: 'workspace'
        },
        configuration: {
          name: 'Test Pipeline',
          description: 'A test pipeline',
          steps: [],
          triggers: [],
          environments: [],
          variables: {},
          secrets: {},
          enabled: true,
          tags: []
        },
        status: PipelineStatus.ACTIVE,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z'),
        createdBy: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com'
        },
        permissions: {
          read: [],
          write: [],
          admin: [],
          readGroups: [],
          writeGroups: [],
          adminGroups: [],
          public: false
        },
        stats: {
          totalRuns: 0,
          successfulRuns: 0,
          failedRuns: 0,
          cancelledRuns: 0,
          averageDuration: 0,
          successRate: 0
        }
      };

      const updatedData = {
        ...existingPipeline,
        name: 'Updated Pipeline',
        updated_on: '2023-01-02T00:00:00Z'
      };

      // Mock getPipeline call
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => existingPipeline
      });

      // Mock update call
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => updatedData
      });

      const updateRequest: UpdatePipelineRequest = {
        name: 'Updated Pipeline'
      };

      const result = await pipelineService.updatePipeline('pipeline-123', updateRequest);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Updated Pipeline');
    });

    it('should handle pipeline not found error', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const updateRequest: UpdatePipelineRequest = {
        name: 'Updated Pipeline'
      };

      const result = await pipelineService.updatePipeline('nonexistent-pipeline', updateRequest);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Pipeline nonexistent-pipeline not found');
    });
  });

  describe('getPipeline', () => {
    it('should retrieve a pipeline successfully', async () => {
      const mockPipelineData = {
        uuid: 'pipeline-123',
        name: 'Test Pipeline',
        description: 'A test pipeline',
        repository: {
          uuid: 'repo-123',
          name: 'test-repo',
          full_name: 'workspace/test-repo',
          workspace: { slug: 'workspace' }
        },
        configuration: {
          name: 'Test Pipeline',
          steps: [],
          triggers: [],
          environments: [],
          variables: {},
          secrets: {},
          enabled: true,
          tags: []
        },
        status: 'active',
        created_on: '2023-01-01T00:00:00Z',
        updated_on: '2023-01-01T00:00:00Z',
        created_by: {
          uuid: 'user-123',
          display_name: 'Test User',
          email_address: 'test@example.com'
        },
        permissions: {
          read: [],
          write: [],
          admin: [],
          readGroups: [],
          writeGroups: [],
          adminGroups: [],
          public: false
        },
        stats: {
          totalRuns: 0,
          successfulRuns: 0,
          failedRuns: 0,
          cancelledRuns: 0,
          averageDuration: 0,
          successRate: 0
        }
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPipelineData
      });

      const result = await pipelineService.getPipeline('pipeline-123');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe('pipeline-123');
      expect(result.data?.name).toBe('Test Pipeline');
    });

    it('should use cached data when available', async () => {
      const mockPipeline: Pipeline = {
        id: 'pipeline-123',
        name: 'Test Pipeline',
        description: 'A test pipeline',
        repository: {
          id: 'repo-123',
          name: 'test-repo',
          fullName: 'workspace/test-repo',
          workspace: 'workspace'
        },
        configuration: {
          name: 'Test Pipeline',
          description: 'A test pipeline',
          steps: [],
          triggers: [],
          environments: [],
          variables: {},
          secrets: {},
          enabled: true,
          tags: []
        },
        status: PipelineStatus.ACTIVE,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z'),
        createdBy: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com'
        },
        permissions: {
          read: [],
          write: [],
          admin: [],
          readGroups: [],
          writeGroups: [],
          adminGroups: [],
          public: false
        },
        stats: {
          totalRuns: 0,
          successfulRuns: 0,
          failedRuns: 0,
          cancelledRuns: 0,
          averageDuration: 0,
          successRate: 0
        }
      };

      // First call - should fetch from API
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPipeline
      });

      const result1 = await pipelineService.getPipeline('pipeline-123');
      expect(result1.success).toBe(true);

      // Second call - should use cache
      const result2 = await pipelineService.getPipeline('pipeline-123');
      expect(result2.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1); // Only called once due to caching
    });
  });

  describe('listPipelines', () => {
    it('should list pipelines successfully', async () => {
      const mockResponse = {
        values: [
          {
            uuid: 'pipeline-123',
            name: 'Test Pipeline 1',
            description: 'First test pipeline',
            repository: {
              uuid: 'repo-123',
              name: 'test-repo',
              full_name: 'workspace/test-repo',
              workspace: { slug: 'workspace' }
            },
            configuration: {
              name: 'Test Pipeline 1',
              steps: [],
              triggers: [],
              environments: [],
              variables: {},
              secrets: {},
              enabled: true,
              tags: []
            },
            status: 'active',
            created_on: '2023-01-01T00:00:00Z',
            updated_on: '2023-01-01T00:00:00Z',
            created_by: {
              uuid: 'user-123',
              display_name: 'Test User',
              email_address: 'test@example.com'
            },
            permissions: {
              read: [],
              write: [],
              admin: [],
              readGroups: [],
              writeGroups: [],
              adminGroups: [],
              public: false
            },
            stats: {
              totalRuns: 0,
              successfulRuns: 0,
              failedRuns: 0,
              cancelledRuns: 0,
              averageDuration: 0,
              successRate: 0
            }
          }
        ],
        size: 1,
        next: null,
        previous: null
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const listRequest: ListPipelinesRequest = {
        repositoryId: 'repo-123',
        pagination: {
          page: 1,
          limit: 25
        }
      };

      const result = await pipelineService.listPipelines(listRequest);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBe(1);
      expect(result.pagination).toBeDefined();
      expect(result.pagination?.total).toBe(1);
    });
  });

  describe('runPipeline', () => {
    it('should run a pipeline successfully', async () => {
      const mockRunData = {
        uuid: 'run-123',
        pipeline: {
          uuid: 'pipeline-123',
          name: 'Test Pipeline'
        },
        state: {
          name: 'running'
        },
        created_on: '2023-01-01T00:00:00Z',
        completed_on: null,
        duration_in_seconds: null,
        trigger: {
          type: 'manual',
          user: {
            uuid: 'user-123',
            display_name: 'Test User'
          }
        },
        target: {
          ref_name: 'main',
          commit: {
            hash: 'abc123'
          }
        },
        environment: {
          name: 'default'
        },
        variables: {},
        steps: [],
        logs: null,
        artifacts: []
      };

      // Mock getPipeline call
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          uuid: 'pipeline-123',
          name: 'Test Pipeline',
          repository: {
            uuid: 'repo-123',
            name: 'test-repo',
            full_name: 'workspace/test-repo',
            workspace: { slug: 'workspace' }
          },
          configuration: {
            name: 'Test Pipeline',
            steps: [],
            triggers: [],
            environments: [],
            variables: {},
            secrets: {},
            enabled: true,
            tags: []
          },
          status: 'active',
          created_on: '2023-01-01T00:00:00Z',
          updated_on: '2023-01-01T00:00:00Z',
          created_by: {
            uuid: 'user-123',
            display_name: 'Test User',
            email_address: 'test@example.com'
          },
          permissions: {
            read: [],
            write: [],
            admin: [],
            readGroups: [],
            writeGroups: [],
            adminGroups: [],
            public: false
          },
          stats: {
            totalRuns: 0,
            successfulRuns: 0,
            failedRuns: 0,
            cancelledRuns: 0,
            averageDuration: 0,
            successRate: 0
          }
        })
      });

      // Mock runPipeline call
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRunData
      });

      const runRequest: RunPipelineRequest = {
        pipelineId: 'pipeline-123',
        environment: 'default',
        variables: { NODE_ENV: 'test' },
        triggerType: 'manual' as any,
        branch: 'main'
      };

      const result = await pipelineService.runPipeline(runRequest);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe('run-123');
      expect(result.data?.status).toBe(PipelineRunStatus.RUNNING);
    });
  });

  describe('getPipelineRun', () => {
    it('should retrieve a pipeline run successfully', async () => {
      const mockRunData = {
        uuid: 'run-123',
        pipeline: {
          uuid: 'pipeline-123',
          name: 'Test Pipeline'
        },
        state: {
          name: 'success'
        },
        created_on: '2023-01-01T00:00:00Z',
        completed_on: '2023-01-01T00:05:00Z',
        duration_in_seconds: 300,
        trigger: {
          type: 'manual',
          user: {
            uuid: 'user-123',
            display_name: 'Test User'
          }
        },
        target: {
          ref_name: 'main',
          commit: {
            hash: 'abc123'
          }
        },
        environment: {
          name: 'default'
        },
        variables: {},
        steps: [
          {
            uuid: 'step-123',
            name: 'Build',
            type: 'build',
            state: {
              name: 'success'
            },
            started_on: '2023-01-01T00:00:00Z',
            completed_on: '2023-01-01T00:02:00Z',
            duration_in_seconds: 120,
            output: 'Build completed successfully',
            logs: 'Building...',
            exit_code: 0,
            depends_on: [],
            config: {}
          }
        ],
        logs: {
          entries: [
            {
              timestamp: '2023-01-01T00:00:00Z',
              level: 'info',
              message: 'Pipeline started',
              source: 'system'
            }
          ],
          size: 1024,
          compressed: false
        },
        artifacts: [
          {
            uuid: 'artifact-123',
            name: 'build-output.zip',
            type: 'archive',
            size: 2048576,
            links: {
              download: {
                href: 'https://api.bitbucket.org/2.0/artifacts/artifact-123/download'
              }
            },
            created_on: '2023-01-01T00:05:00Z',
            expires_on: null,
            metadata: {}
          }
        ]
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRunData
      });

      const result = await pipelineService.getPipelineRun('run-123');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe('run-123');
      expect(result.data?.status).toBe(PipelineRunStatus.SUCCESS);
      expect(result.data?.steps).toHaveLength(1);
      expect(result.data?.artifacts).toHaveLength(1);
    });
  });

  describe('listPipelineRuns', () => {
    it('should list pipeline runs successfully', async () => {
      const mockResponse = {
        values: [
          {
            uuid: 'run-123',
            pipeline: {
              uuid: 'pipeline-123',
              name: 'Test Pipeline'
            },
            state: {
              name: 'success'
            },
            created_on: '2023-01-01T00:00:00Z',
            completed_on: '2023-01-01T00:05:00Z',
            duration_in_seconds: 300,
            trigger: {
              type: 'manual',
              user: {
                uuid: 'user-123',
                display_name: 'Test User'
              }
            },
            target: {
              ref_name: 'main',
              commit: {
                hash: 'abc123'
              }
            },
            environment: {
              name: 'default'
            },
            variables: {},
            steps: [],
            logs: null,
            artifacts: []
          }
        ],
        size: 1,
        next: null,
        previous: null
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const listRequest: ListPipelineRunsRequest = {
        pipelineId: 'pipeline-123',
        pagination: {
          page: 1,
          limit: 25
        }
      };

      const result = await pipelineService.listPipelineRuns(listRequest);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBe(1);
      expect(result.pagination).toBeDefined();
      expect(result.pagination?.total).toBe(1);
    });
  });

  describe('stopPipelineRun', () => {
    it('should stop a pipeline run successfully', async () => {
      const mockRunData = {
        uuid: 'run-123',
        pipeline: {
          uuid: 'pipeline-123',
          name: 'Test Pipeline'
        },
        state: {
          name: 'cancelled'
        },
        created_on: '2023-01-01T00:00:00Z',
        completed_on: '2023-01-01T00:02:00Z',
        duration_in_seconds: 120,
        trigger: {
          type: 'manual',
          user: {
            uuid: 'user-123',
            display_name: 'Test User'
          }
        },
        target: {
          ref_name: 'main',
          commit: {
            hash: 'abc123'
          }
        },
        environment: {
          name: 'default'
        },
        variables: {},
        steps: [],
        logs: null,
        artifacts: []
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRunData
      });

      const result = await pipelineService.stopPipelineRun('run-123');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe('run-123');
      expect(result.data?.status).toBe(PipelineRunStatus.CANCELLED);
    });
  });

  describe('monitoring', () => {
    it('should track active runs', () => {
      const activeRuns = pipelineService.getActiveRuns();
      expect(Array.isArray(activeRuns)).toBe(true);
    });

    it('should handle monitoring lifecycle', () => {
      // Test that monitoring can be started and stopped
      // This would require more complex setup with actual pipeline runs
      expect(pipelineService.getActiveRuns()).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      (global.fetch as Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await pipelineService.getPipeline('pipeline-123');

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Network error');
    });

    it('should handle timeout errors', async () => {
      (global.fetch as Mock).mockRejectedValueOnce(new Error('Request timeout'));

      const result = await pipelineService.getPipeline('pipeline-123');

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Request timeout');
    });

    it('should retry failed requests', async () => {
      // Mock first two calls to fail, third to succeed
      (global.fetch as Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            uuid: 'pipeline-123',
            name: 'Test Pipeline',
            repository: {
              uuid: 'repo-123',
              name: 'test-repo',
              full_name: 'workspace/test-repo',
              workspace: { slug: 'workspace' }
            },
            configuration: {
              name: 'Test Pipeline',
              steps: [],
              triggers: [],
              environments: [],
              variables: {},
              secrets: {},
              enabled: true,
              tags: []
            },
            status: 'active',
            created_on: '2023-01-01T00:00:00Z',
            updated_on: '2023-01-01T00:00:00Z',
            created_by: {
              uuid: 'user-123',
              display_name: 'Test User',
              email_address: 'test@example.com'
            },
            permissions: {
              read: [],
              write: [],
              admin: [],
              readGroups: [],
              writeGroups: [],
              adminGroups: [],
              public: false
            },
            stats: {
              totalRuns: 0,
              successfulRuns: 0,
              failedRuns: 0,
              cancelledRuns: 0,
              averageDuration: 0,
              successRate: 0
            }
          })
        });

      const result = await pipelineService.getPipeline('pipeline-123');

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(3); // Should retry 3 times
    });
  });

  describe('caching', () => {
    it('should cache pipeline data', async () => {
      const mockPipelineData = {
        uuid: 'pipeline-123',
        name: 'Test Pipeline',
        repository: {
          uuid: 'repo-123',
          name: 'test-repo',
          full_name: 'workspace/test-repo',
          workspace: { slug: 'workspace' }
        },
        configuration: {
          name: 'Test Pipeline',
          steps: [],
          triggers: [],
          environments: [],
          variables: {},
          secrets: {},
          enabled: true,
          tags: []
        },
        status: 'active',
        created_on: '2023-01-01T00:00:00Z',
        updated_on: '2023-01-01T00:00:00Z',
        created_by: {
          uuid: 'user-123',
          display_name: 'Test User',
          email_address: 'test@example.com'
        },
        permissions: {
          read: [],
          write: [],
          admin: [],
          readGroups: [],
          writeGroups: [],
          adminGroups: [],
          public: false
        },
        stats: {
          totalRuns: 0,
          successfulRuns: 0,
          failedRuns: 0,
          cancelledRuns: 0,
          averageDuration: 0,
          successRate: 0
        }
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPipelineData
      });

      // First call
      const result1 = await pipelineService.getPipeline('pipeline-123');
      expect(result1.success).toBe(true);

      // Second call should use cache
      const result2 = await pipelineService.getPipeline('pipeline-123');
      expect(result2.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should respect cache TTL', async () => {
      // Create service with very short cache TTL
      const shortCacheService = new PipelineService({
        ...mockConfig,
        cacheTtl: 100 // 100ms
      });

      const mockPipelineData = {
        uuid: 'pipeline-123',
        name: 'Test Pipeline',
        repository: {
          uuid: 'repo-123',
          name: 'test-repo',
          full_name: 'workspace/test-repo',
          workspace: { slug: 'workspace' }
        },
        configuration: {
          name: 'Test Pipeline',
          steps: [],
          triggers: [],
          environments: [],
          variables: {},
          secrets: {},
          enabled: true,
          tags: []
        },
        status: 'active',
        created_on: '2023-01-01T00:00:00Z',
        updated_on: '2023-01-01T00:00:00Z',
        created_by: {
          uuid: 'user-123',
          display_name: 'Test User',
          email_address: 'test@example.com'
        },
        permissions: {
          read: [],
          write: [],
          admin: [],
          readGroups: [],
          writeGroups: [],
          adminGroups: [],
          public: false
        },
        stats: {
          totalRuns: 0,
          successfulRuns: 0,
          failedRuns: 0,
          cancelledRuns: 0,
          averageDuration: 0,
          successRate: 0
        }
      };

      (global.fetch as Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPipelineData
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPipelineData
        });

      // First call
      await shortCacheService.getPipeline('pipeline-123');

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Second call should fetch from API again
      await shortCacheService.getPipeline('pipeline-123');

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
