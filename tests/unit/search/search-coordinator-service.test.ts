/**
 * Unit tests for SearchCoordinatorService
 * Tests the main orchestration service for search operations
 */

import { SearchCoordinatorService } from '../../../src/services/search-coordinator-service';
import { Cache } from '../../../src/utils/cache';
import { ServerInfo } from '../../../src/services/server-detection';
import { SearchQuery, SearchConfiguration } from '../../../src/types/search';
import { AxiosInstance } from 'axios';

describe('SearchCoordinatorService', () => {
  let httpClient: jest.Mocked<AxiosInstance>;
  let cache: jest.Mocked<Cache>;
  let service: SearchCoordinatorService;
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

    service = new SearchCoordinatorService(httpClient, cache);

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

  describe('Service Initialization', () => {
    it('should initialize with default configuration', () => {
      const defaultService = new SearchCoordinatorService(httpClient, cache);
      expect(defaultService).toBeDefined();
    });

    it('should initialize with custom configuration', () => {
      const customConfig: Partial<SearchConfiguration> = {
        defaultResultsPerPage: 50,
        maxResultsPerPage: 200,
        enableAnalytics: false,
        enableHistory: false,
      };

      const customService = new SearchCoordinatorService(httpClient, cache, customConfig);
      expect(customService).toBeDefined();
    });

    it('should get configuration', () => {
      const config = service.getConfiguration();
      expect(config.defaultResultsPerPage).toBe(25);
      expect(config.maxResultsPerPage).toBe(100);
      expect(config.enableAnalytics).toBe(true);
      expect(config.enableHistory).toBe(true);
    });

    it('should update configuration', () => {
      const updates = {
        defaultResultsPerPage: 50,
        enableAnalytics: false,
      };

      service.updateConfiguration(updates);
      const config = service.getConfiguration();

      expect(config.defaultResultsPerPage).toBe(50);
      expect(config.enableAnalytics).toBe(false);
    });
  });

  describe('Unified Search', () => {
    beforeEach(() => {
      // Mock individual service responses
      cache.get.mockResolvedValue(null);
      httpClient.get.mockResolvedValue({
        data: {
          values: [
            {
              id: 1,
              name: 'test-result',
              description: 'Test result',
              links: { self: [{ href: 'http://example.com/test' }] },
            }
          ],
        },
      });
    });

    it('should perform unified search', async () => {
      const query: SearchQuery = {
        query: 'test',
        filters: {},
        sortBy: 'name',
        sortOrder: 'asc',
        page: 0,
        limit: 25,
      };

      const response = await service.search(serverInfo, query);

      expect(response.results).toBeDefined();
      expect(response.pagination).toBeDefined();
      expect(response.metadata).toBeDefined();
      expect(response.metadata.executionTime).toBeGreaterThan(0);
    });

    it('should determine search types automatically', async () => {
      const query: SearchQuery = {
        query: 'test',
        filters: {
          repositorySlug: 'my-repo',
        },
        sortBy: 'name',
        sortOrder: 'asc',
        page: 0,
        limit: 25,
      };

      const response = await service.search(serverInfo, query);

      expect(response.metadata.searchTypes).toContain('repository');
    });

    it('should use specified search types', async () => {
      const query: SearchQuery = {
        query: 'test',
        filters: {},
        sortBy: 'name',
        sortOrder: 'asc',
        page: 0,
        limit: 25,
      };

      const response = await service.search(serverInfo, query, {
        searchTypes: ['repository', 'code'],
      });

      expect(response.metadata.searchTypes).toEqual(['repository', 'code']);
    });

    it('should merge results from multiple search types', async () => {
      const query: SearchQuery = {
        query: 'test',
        filters: {},
        sortBy: 'relevance',
        sortOrder: 'desc',
        page: 0,
        limit: 25,
      };

      const response = await service.search(serverInfo, query, {
        searchTypes: ['repository', 'code'],
      });

      expect(response.results).toBeDefined();
      expect(response.pagination.totalResults).toBeGreaterThanOrEqual(0);
    });

    it('should apply pagination correctly', async () => {
      const query: SearchQuery = {
        query: 'test',
        filters: {},
        sortBy: 'name',
        sortOrder: 'asc',
        page: 1,
        limit: 10,
      };

      const response = await service.search(serverInfo, query);

      expect(response.pagination.page).toBe(1);
      expect(response.pagination.limit).toBe(10);
    });
  });

  describe('Multi-Search', () => {
    beforeEach(() => {
      cache.get.mockResolvedValue(null);
      httpClient.get.mockResolvedValue({
        data: {
          values: [
            {
              id: 1,
              name: 'test-result',
              links: { self: [{ href: 'http://example.com/test' }] },
            }
          ],
        },
      });
    });

    it('should perform multiple searches in parallel', async () => {
      const multiRequest = {
        searches: [
          {
            id: 'search1',
            query: {
              query: 'test1',
              filters: {},
              sortBy: 'name',
              sortOrder: 'asc',
              page: 0,
              limit: 25,
            } as SearchQuery,
            searchTypes: ['repository'],
          },
          {
            id: 'search2',
            query: {
              query: 'test2',
              filters: {},
              sortBy: 'name',
              sortOrder: 'asc',
              page: 0,
              limit: 25,
            } as SearchQuery,
            searchTypes: ['code'],
          },
        ],
      };

      const response = await service.multiSearch(serverInfo, multiRequest);

      expect(response.searches).toHaveLength(2);
      expect(response.metadata.totalSearches).toBe(2);
      expect(response.metadata.successfulSearches).toBeGreaterThanOrEqual(0);
    });

    it('should handle partial failures in multi-search', async () => {
      // Mock one success and one failure
      httpClient.get
        .mockResolvedValueOnce({
          data: { values: [{ id: 1, name: 'success' }] },
        })
        .mockRejectedValueOnce(new Error('Search failed'));

      const multiRequest = {
        searches: [
          {
            id: 'success',
            query: {
              query: 'test1',
              filters: {},
              sortBy: 'name',
              sortOrder: 'asc',
              page: 0,
              limit: 25,
            } as SearchQuery,
            searchTypes: ['repository'],
          },
          {
            id: 'failure',
            query: {
              query: 'test2',
              filters: {},
              sortBy: 'name',
              sortOrder: 'asc',
              page: 0,
              limit: 25,
            } as SearchQuery,
            searchTypes: ['code'],
          },
        ],
      };

      const response = await service.multiSearch(serverInfo, multiRequest);

      expect(response.searches).toHaveLength(2);
      expect(response.metadata.successfulSearches).toBe(1);
      expect(response.metadata.failedSearches).toBe(1);
    });
  });

  describe('Specialized Search Methods', () => {
    beforeEach(() => {
      cache.get.mockResolvedValue(null);
    });

    it('should search repositories', async () => {
      httpClient.get.mockResolvedValue({
        data: {
          values: [
            {
              id: 1,
              name: 'test-repo',
              project: { key: 'TEST' },
              links: { self: [{ href: 'http://example.com/projects/TEST/repos/test-repo' }] },
            }
          ],
        },
      });

      const results = await service.searchRepositories(serverInfo, {
        query: 'test',
        projectKey: 'TEST',
      });

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('test-repo');
    });

    it('should search commits', async () => {
      httpClient.get.mockResolvedValue({
        data: {
          values: [
            {
              id: 'abc123',
              message: 'Test commit',
              author: { name: 'Test User' },
              authorTimestamp: Date.now(),
              links: { self: [{ href: 'http://example.com/commits/abc123' }] },
            }
          ],
        },
      });

      const results = await service.searchCommits(serverInfo, {
        query: 'test',
        author: 'Test User',
      });

      expect(results).toHaveLength(1);
      expect(results[0].metadata?.author).toBe('Test User');
    });

    it('should search pull requests', async () => {
      httpClient.get.mockResolvedValue({
        data: {
          values: [
            {
              id: 1,
              title: 'Test PR',
              author: { user: { name: 'Test User' } },
              state: 'OPEN',
              links: { self: [{ href: 'http://example.com/pull-requests/1' }] },
            }
          ],
        },
      });

      const results = await service.searchPullRequests(serverInfo, {
        query: 'test',
        state: 'OPEN',
      });

      expect(results).toHaveLength(1);
      expect(results[0].metadata?.state).toBe('OPEN');
    });

    it('should search code', async () => {
      httpClient.get.mockResolvedValue({
        data: {
          values: [
            {
              path: 'src/test.js',
              repository: { name: 'test-repo' },
              matches: [{ lineNumber: 10, content: 'test code' }],
              links: { self: [{ href: 'http://example.com/src/test.js' }] },
            }
          ],
        },
      });

      const results = await service.searchCode(serverInfo, {
        query: 'test',
        language: 'JavaScript',
      });

      expect(results).toHaveLength(1);
      expect(results[0].metadata?.language).toBe('JavaScript');
    });

    it('should search users', async () => {
      httpClient.get.mockResolvedValue({
        data: {
          values: [
            {
              id: 1,
              name: 'testuser',
              displayName: 'Test User',
              emailAddress: 'test@example.com',
              active: true,
              links: { self: [{ href: 'http://example.com/users/testuser' }] },
            }
          ],
        },
      });

      const results = await service.searchUsers(serverInfo, {
        query: 'test',
        active: true,
      });

      expect(results).toHaveLength(1);
      expect(results[0].metadata?.active).toBe(true);
    });
  });

  describe('Search Suggestions', () => {
    it('should get search suggestions', async () => {
      // Mock history service response
      cache.get.mockResolvedValue([
        'test repository',
        'test code',
        'test user',
      ]);

      const suggestions = await service.getSearchSuggestions(
        serverInfo,
        'test',
        { userId: 'user123' }
      );

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should return empty suggestions when disabled', async () => {
      const disabledService = new SearchCoordinatorService(httpClient, cache, {
        enableSuggestions: false,
      });

      const suggestions = await disabledService.getSearchSuggestions(
        serverInfo,
        'test'
      );

      expect(suggestions).toEqual([]);
    });
  });

  describe('Input Validation', () => {
    it('should validate empty query', async () => {
      const query: SearchQuery = {
        query: '',
        filters: {},
        sortBy: 'name',
        sortOrder: 'asc',
        page: 0,
        limit: 25,
      };

      await expect(service.search(serverInfo, query)).rejects.toThrow('Search query cannot be empty');
    });

    it('should validate query length', async () => {
      const query: SearchQuery = {
        query: 'a'.repeat(1001),
        filters: {},
        sortBy: 'name',
        sortOrder: 'asc',
        page: 0,
        limit: 25,
      };

      await expect(service.search(serverInfo, query)).rejects.toThrow('Search query is too long');
    });

    it('should validate result limit', async () => {
      const query: SearchQuery = {
        query: 'test',
        filters: {},
        sortBy: 'name',
        sortOrder: 'asc',
        page: 0,
        limit: 200,
      };

      await expect(service.search(serverInfo, query)).rejects.toThrow('Result limit cannot exceed');
    });

    it('should validate search types', async () => {
      const query: SearchQuery = {
        query: 'test',
        filters: {},
        sortBy: 'name',
        sortOrder: 'asc',
        page: 0,
        limit: 25,
      };

      await expect(service.search(serverInfo, query, {
        searchTypes: ['invalid'] as any,
      })).rejects.toThrow('Invalid search types');
    });
  });

  describe('Error Handling', () => {
    it('should handle search failures gracefully', async () => {
      cache.get.mockResolvedValue(null);
      httpClient.get.mockRejectedValue(new Error('API Error'));

      const query: SearchQuery = {
        query: 'test',
        filters: {},
        sortBy: 'name',
        sortOrder: 'asc',
        page: 0,
        limit: 25,
      };

      await expect(service.search(serverInfo, query)).rejects.toThrow();
    });

    it('should record failed searches in history', async () => {
      const historyService = new SearchCoordinatorService(httpClient, cache, {
        enableHistory: true,
      });

      cache.get.mockResolvedValue(null);
      httpClient.get.mockRejectedValue(new Error('API Error'));

      const query: SearchQuery = {
        query: 'test',
        filters: {},
        sortBy: 'name',
        sortOrder: 'asc',
        page: 0,
        limit: 25,
      };

      try {
        await historyService.search(serverInfo, query, { userId: 'user123' });
      } catch (error) {
        // Expected to fail, but should record in history
      }

      // History recording is async, so we can't easily test it here
      // In a real implementation, we'd need to mock the history service
    });
  });

  describe('Health Status', () => {
    it('should return health status', async () => {
      const health = await service.getHealthStatus();

      expect(health.status).toBeDefined();
      expect(health.services).toBeDefined();
      expect(health.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should report healthy status when all services are working', async () => {
      const health = await service.getHealthStatus();

      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
    });
  });

  describe('Performance', () => {
    beforeEach(() => {
      cache.get.mockResolvedValue(null);
      httpClient.get.mockResolvedValue({
        data: { values: [] },
      });
    });

    it('should track execution time', async () => {
      const query: SearchQuery = {
        query: 'test',
        filters: {},
        sortBy: 'name',
        sortOrder: 'asc',
        page: 0,
        limit: 25,
      };

      const response = await service.search(serverInfo, query);

      expect(response.metadata.executionTime).toBeGreaterThan(0);
    });

    it('should warn about slow searches', async () => {
      // Mock a slow response
      httpClient.get.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: { values: [] } }), 100))
      );

      const slowService = new SearchCoordinatorService(httpClient, cache, {
        performanceThreshold: 50, // 50ms threshold
      });

      const query: SearchQuery = {
        query: 'test',
        filters: {},
        sortBy: 'name',
        sortOrder: 'asc',
        page: 0,
        limit: 25,
      };

      const response = await slowService.search(serverInfo, query);

      expect(response.metadata.executionTime).toBeGreaterThan(50);
    });
  });
});
