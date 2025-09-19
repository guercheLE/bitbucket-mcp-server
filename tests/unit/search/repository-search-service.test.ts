/**
 * Unit tests for RepositorySearchService
 * Tests repository-specific search functionality
 */

import { RepositorySearchService } from '../../../src/services/repository-search-service';
import { Cache } from '../../../src/utils/cache';
import { ServerInfo } from '../../../src/services/server-detection';
import { SearchQuery } from '../../../src/types/search';
import { AxiosInstance } from 'axios';

describe('RepositorySearchService', () => {
  let httpClient: jest.Mocked<AxiosInstance>;
  let cache: jest.Mocked<Cache>;
  let service: RepositorySearchService;
  let serverInfo: ServerInfo;

  beforeEach(() => {
    httpClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    } as any;

    cache = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      has: jest.fn(),
    } as any;

    service = new RepositorySearchService(httpClient, cache);

    serverInfo = {
      serverType: 'datacenter',
      version: '8.0.0',
      baseUrl: 'https://bitbucket.example.com',
      isSupported: true,
      fallbackUsed: false,
      cached: false,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Repository Search', () => {
    it('should search repositories successfully', async () => {
      const mockResponse = {
        data: {
          values: [
            {
              id: 1,
              name: 'test-repo',
              description: 'Test repository',
              links: { self: [{ href: 'https://bitbucket.example.com/projects/TEST/repos/test-repo' }] },
              project: { key: 'TEST' },
              public: false,
              size: 1024,
              forkable: true,
            }
          ],
          size: 1,
          isLastPage: true,
        },
      };

      httpClient.get.mockResolvedValue(mockResponse);
      cache.get.mockResolvedValue(null);

      const results = await service.searchRepositories(serverInfo, {
        query: 'test',
        projectKey: 'TEST',
        sortBy: 'name',
        sortOrder: 'asc',
        limit: 25,
      });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
      expect(results[0].title).toBe('test-repo');
      expect(results[0].metadata?.projectKey).toBe('TEST');
    });

    it('should handle Data Center API format', async () => {
      const mockResponse = {
        data: {
          values: [
            {
              id: 1,
              name: 'datacenter-repo',
              project: { key: 'DC' },
              links: { 
                clone: [{ name: 'http', href: 'http://example.com/repo.git' }],
                self: [{ href: 'http://example.com/projects/DC/repos/datacenter-repo' }]
              },
            }
          ],
        },
      };

      httpClient.get.mockResolvedValue(mockResponse);
      cache.get.mockResolvedValue(null);

      const results = await service.searchRepositories(serverInfo, {
        query: 'datacenter',
      });

      expect(results[0].title).toBe('datacenter-repo');
      expect(results[0].metadata?.projectKey).toBe('DC');
    });

    it('should handle Cloud API format', async () => {
      const cloudServerInfo: ServerInfo = {
        ...serverInfo,
        serverType: 'cloud',
        baseUrl: 'https://api.bitbucket.org',
      };

      const mockResponse = {
        data: {
          values: [
            {
              uuid: '{uuid-123}',
              name: 'cloud-repo',
              full_name: 'workspace/cloud-repo',
              workspace: { slug: 'workspace' },
              links: { 
                html: { href: 'https://bitbucket.org/workspace/cloud-repo' },
                clone: [{ name: 'https', href: 'https://bitbucket.org/workspace/cloud-repo.git' }]
              },
              is_private: true,
              size: 2048,
            }
          ],
        },
      };

      httpClient.get.mockResolvedValue(mockResponse);
      cache.get.mockResolvedValue(null);

      const results = await service.searchRepositories(cloudServerInfo, {
        query: 'cloud',
        workspace: 'workspace',
      });

      expect(results[0].title).toBe('cloud-repo');
      expect(results[0].metadata?.workspace).toBe('workspace');
    });
  });

  describe('Specialized Methods', () => {
    it('should get repositories by project', async () => {
      const mockResponse = {
        data: {
          values: [
            {
              id: 1,
              name: 'project-repo',
              project: { key: 'PROJ' },
              links: { self: [{ href: 'http://example.com/projects/PROJ/repos/project-repo' }] },
            }
          ],
        },
      };

      httpClient.get.mockResolvedValue(mockResponse);
      cache.get.mockResolvedValue(null);

      const results = await service.searchRepositories(serverInfo, {
        query: 'project:PROJ',
        projectKey: 'PROJ',
      });

      expect(results).toHaveLength(1);
      expect(results[0].metadata?.projectKey).toBe('PROJ');
    });

    it('should get public repositories', async () => {
      const mockResponse = {
        data: {
          values: [
            {
              id: 1,
              name: 'public-repo',
              public: true,
              project: { key: 'PUB' },
              links: { self: [{ href: 'http://example.com/projects/PUB/repos/public-repo' }] },
            }
          ],
        },
      };

      httpClient.get.mockResolvedValue(mockResponse);
      cache.get.mockResolvedValue(null);

      const results = await service.searchRepositories(serverInfo, {
        query: 'public:true',
        isPublic: true,
      });

      expect(results).toHaveLength(1);
      expect(results[0].metadata?.isPublic).toBe(true);
    });

    it('should get repositories by language', async () => {
      const mockResponse = {
        data: {
          values: [
            {
              id: 1,
              name: 'js-repo',
              language: 'JavaScript',
              project: { key: 'JS' },
              links: { self: [{ href: 'http://example.com/projects/JS/repos/js-repo' }] },
            }
          ],
        },
      };

      httpClient.get.mockResolvedValue(mockResponse);
      cache.get.mockResolvedValue(null);

      const results = await service.searchRepositoriesByLanguage(serverInfo, 'JavaScript');

      expect(results).toHaveLength(1);
      expect(results[0].metadata?.language).toBe('JavaScript');
    });

    it('should find similar repositories', async () => {
      const mockResponse = {
        data: {
          values: [
            {
              id: 1,
              name: 'similar-repo-1',
              project: { key: 'SIM' },
              links: { self: [{ href: 'http://example.com/projects/SIM/repos/similar-repo-1' }] },
            },
            {
              id: 2,
              name: 'similar-repo-2',
              project: { key: 'SIM' },
              links: { self: [{ href: 'http://example.com/projects/SIM/repos/similar-repo-2' }] },
            }
          ],
        },
      };

      httpClient.get.mockResolvedValue(mockResponse);
      cache.get.mockResolvedValue(null);

      const results = await service.searchRepositories(serverInfo, {
        query: 'similar-repo',
      });

      expect(results).toHaveLength(2);
      expect(results.every((r: any) => r.title.includes('similar'))).toBe(true);
    });
  });

  describe('URL Building', () => {
    it('should build Data Center search URL correctly', async () => {
      const mockResponse = { data: { values: [] } };
      httpClient.get.mockResolvedValue(mockResponse);
      cache.get.mockResolvedValue(null);

      await service.searchRepositories(serverInfo, {
        query: 'test',
        projectKey: 'TEST',
        sortBy: 'name',
        sortOrder: 'asc',
        page: 1,
        limit: 50,
      });

      expect(httpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/rest/api/1.0/search/repositories'),
        expect.any(Object)
      );

      const calledUrl = httpClient.get.mock.calls[0][0] as string;
      expect(calledUrl).toContain('q=test');
      expect(calledUrl).toContain('projectKey=TEST');
      expect(calledUrl).toContain('sort=name');
      expect(calledUrl).toContain('start=50');
      expect(calledUrl).toContain('limit=50');
    });

    it('should build Cloud search URL correctly', async () => {
      const cloudServerInfo: ServerInfo = {
        ...serverInfo,
        serverType: 'cloud',
        baseUrl: 'https://api.bitbucket.org',
      };

      const mockResponse = { data: { values: [] } };
      httpClient.get.mockResolvedValue(mockResponse);
      cache.get.mockResolvedValue(null);

      await service.searchRepositories(cloudServerInfo, {
        query: 'test',
        workspace: 'myworkspace',
        sortBy: 'name',
        sortOrder: 'desc',
        page: 2,
        limit: 10,
      });

      expect(httpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/2.0/repositories'),
        expect.any(Object)
      );

      const calledUrl = httpClient.get.mock.calls[0][0] as string;
      expect(calledUrl).toContain('q=test');
      expect(calledUrl).toContain('workspace=myworkspace');
      expect(calledUrl).toContain('sort=-name');
      expect(calledUrl).toContain('page=3'); // Cloud API is 1-based
      expect(calledUrl).toContain('pagelen=10');
    });
  });

  describe('Response Transformation', () => {
    it('should transform repository data correctly', async () => {
      const mockResponse = {
        data: {
          values: [
            {
              id: 123,
              name: 'my-repo',
              description: 'My test repository',
              project: { key: 'TEST', name: 'Test Project' },
              public: false,
              forkable: true,
              size: 1024000,
              language: 'TypeScript',
              updated_on: '2023-01-01T10:00:00Z',
              links: {
                self: [{ href: 'https://bitbucket.example.com/projects/TEST/repos/my-repo' }],
                clone: [
                  { name: 'https', href: 'https://bitbucket.example.com/scm/TEST/my-repo.git' },
                  { name: 'ssh', href: 'git@bitbucket.example.com:TEST/my-repo.git' }
                ]
              }
            }
          ],
        },
      };

      httpClient.get.mockResolvedValue(mockResponse);
      cache.get.mockResolvedValue(null);

      const results = await service.searchRepositories(serverInfo, {
        query: 'my-repo',
      });

      const result = results[0];
      expect(result.id).toBe('123');
      expect(result.title).toBe('my-repo');
      expect(result.description).toBe('My test repository');
      expect(result.url).toBe('https://bitbucket.example.com/projects/TEST/repos/my-repo');
      expect(result.metadata?.projectKey).toBe('TEST');
      expect(result.metadata?.isPublic).toBe(false);
      expect(result.metadata?.size).toBe(1024000);
      expect(result.metadata?.language).toBe('TypeScript');
    });

    it('should handle missing optional fields', async () => {
      const mockResponse = {
        data: {
          values: [
            {
              id: 456,
              name: 'minimal-repo',
              project: { key: 'MIN' },
            }
          ],
        },
      };

      httpClient.get.mockResolvedValue(mockResponse);
      cache.get.mockResolvedValue(null);

      const results = await service.searchRepositories(serverInfo, {
        query: 'minimal',
      });

      const result = results[0];
      expect(result.id).toBe('456');
      expect(result.title).toBe('minimal-repo');
      expect(result.description).toBeUndefined();
      expect(result.metadata?.projectKey).toBe('MIN');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const error = new Error('Repository not found');
      httpClient.get.mockRejectedValue(error);
      cache.get.mockResolvedValue(null);

      await expect(service.searchRepositories(serverInfo, {
        query: 'nonexistent',
      })).rejects.toThrow();
    });

    it('should handle malformed responses', async () => {
      const mockResponse = {
        data: {
          // Missing values array
          size: 0,
        },
      };

      httpClient.get.mockResolvedValue(mockResponse);
      cache.get.mockResolvedValue(null);

      const results = await service.searchRepositories(serverInfo, {
        query: 'test',
      });

      expect(results).toEqual([]);
    });
  });

  describe('Validation', () => {
    it('should validate repository-specific parameters', async () => {
      await expect(service.searchRepositories(serverInfo, {
        query: 'test',
        sortBy: 'invalidSort' as any,
      })).rejects.toThrow();
    });

    it('should validate project key format', async () => {
      await expect(service.searchRepositories(serverInfo, {
        query: 'test',
        projectKey: 'invalid-project-key!',
      })).rejects.toThrow();
    });

    it('should validate workspace format for Cloud', async () => {
      const cloudServerInfo: ServerInfo = {
        ...serverInfo,
        serverType: 'cloud',
      };

      await expect(service.searchRepositories(cloudServerInfo, {
        query: 'test',
        workspace: 'invalid workspace!',
      })).rejects.toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle large result sets efficiently', async () => {
      const largeResponse = {
        data: {
          values: Array.from({ length: 100 }, (_, i) => ({
            id: i + 1,
            name: `repo-${i + 1}`,
            project: { key: 'LARGE' },
            links: { self: [{ href: `http://example.com/projects/LARGE/repos/repo-${i + 1}` }] },
          })),
        },
      };

      httpClient.get.mockResolvedValue(largeResponse);
      cache.get.mockResolvedValue(null);

      const startTime = Date.now();
      const results = await service.searchRepositories(serverInfo, {
        query: 'repo',
        limit: 100,
      });
      const endTime = Date.now();

      expect(results).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
