/**
 * Unit tests for SearchService (base class)
 * Tests the core search functionality and common methods
 */

import { SearchService } from '../../../src/services/search-service.js';
import { Cache } from '../../../src/utils/cache.js';
import { ServerInfo } from '../../../src/services/server-detection.js';
import { SearchQuery, SearchConfiguration } from '../../../src/types/search.js';
import axios, { AxiosInstance } from 'axios';

// Mock implementations
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Concrete implementation for testing abstract class
class TestSearchService extends SearchService {
  constructor(httpClient: AxiosInstance, cache: Cache, config?: Partial<SearchConfiguration>) {
    super(httpClient, cache, 'repository', config);
  }

  protected buildSearchUrl(serverInfo: ServerInfo, query: SearchQuery): string {
    return `${serverInfo.baseUrl}/test/search?q=${encodeURIComponent(query.query)}`;
  }

  protected transformApiResponse(apiResponse: any, query: SearchQuery): any[] {
    return apiResponse.results || [];
  }

  protected getDefaultSortField(): string {
    return 'name';
  }

  protected validateSearchTypeParams(query: SearchQuery): void {
    if (query.query.includes('invalid')) {
      throw new Error('Invalid query parameter');
    }
  }
}

describe('SearchService', () => {
  let httpClient: jest.Mocked<AxiosInstance>;
  let cache: jest.Mocked<Cache>;
  let service: TestSearchService;
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

    service = new TestSearchService(httpClient, cache);

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

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const defaultService = new TestSearchService(httpClient, cache);
      expect(defaultService).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const customConfig = {
        defaultResultsPerPage: 50,
        maxResultsPerPage: 200,
        cacheTimeout: 600,
      };

      const customService = new TestSearchService(httpClient, cache, customConfig);
      expect(customService).toBeDefined();
    });
  });

  describe('Input Validation', () => {
    it('should validate query input', async () => {
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

    it('should validate page parameter', async () => {
      const query: SearchQuery = {
        query: 'test',
        filters: {},
        sortBy: 'name',
        sortOrder: 'asc',
        page: -1,
        limit: 25,
      };

      await expect(service.search(serverInfo, query)).rejects.toThrow('Page number cannot be negative');
    });

    it('should validate limit parameter', async () => {
      const query: SearchQuery = {
        query: 'test',
        filters: {},
        sortBy: 'name',
        sortOrder: 'asc',
        page: 0,
        limit: 0,
      };

      await expect(service.search(serverInfo, query)).rejects.toThrow('Limit must be greater than 0');
    });

    it('should validate maximum limit', async () => {
      const customService = new TestSearchService(httpClient, cache, { maxResultsPerPage: 50 });
      
      const query: SearchQuery = {
        query: 'test',
        filters: {},
        sortBy: 'name',
        sortOrder: 'asc',
        page: 0,
        limit: 100,
      };

      await expect(customService.search(serverInfo, query)).rejects.toThrow('Limit cannot exceed 50');
    });

    it('should call custom validation', async () => {
      const query: SearchQuery = {
        query: 'invalid query',
        filters: {},
        sortBy: 'name',
        sortOrder: 'asc',
        page: 0,
        limit: 25,
      };

      await expect(service.search(serverInfo, query)).rejects.toThrow('Invalid query parameter');
    });
  });

  describe('Search Execution', () => {
    it('should execute successful search', async () => {
      const mockResponse = {
        data: {
          results: [
            { id: '1', name: 'Test Result 1' },
            { id: '2', name: 'Test Result 2' },
          ],
          total: 2,
        },
      };

      httpClient.get.mockResolvedValue(mockResponse);
      cache.get.mockResolvedValue(null);

      const query: SearchQuery = {
        query: 'test',
        filters: {},
        sortBy: 'name',
        sortOrder: 'asc',
        page: 0,
        limit: 25,
      };

      const response = await service.search(serverInfo, query);

      expect(response.results).toHaveLength(2);
      expect(response.pagination.totalResults).toBe(2);
      expect(response.metadata.executionTime).toBeGreaterThan(0);
    });

    it('should handle empty results', async () => {
      const mockResponse = {
        data: {
          results: [],
          total: 0,
        },
      };

      httpClient.get.mockResolvedValue(mockResponse);
      cache.get.mockResolvedValue(null);

      const query: SearchQuery = {
        query: 'nonexistent',
        filters: {},
        sortBy: 'name',
        sortOrder: 'asc',
        page: 0,
        limit: 25,
      };

      const response = await service.search(serverInfo, query);

      expect(response.results).toHaveLength(0);
      expect(response.pagination.totalResults).toBe(0);
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      httpClient.get.mockRejectedValue(error);
      cache.get.mockResolvedValue(null);

      const query: SearchQuery = {
        query: 'test',
        filters: {},
        sortBy: 'name',
        sortOrder: 'asc',
        page: 0,
        limit: 25,
      };

      await expect(service.search(serverInfo, query)).rejects.toThrow('Search failed');
    });
  });

  describe('Caching', () => {
    it('should cache search results', async () => {
      const mockResponse = {
        data: {
          results: [{ id: '1', name: 'Test Result' }],
          total: 1,
        },
      };

      httpClient.get.mockResolvedValue(mockResponse);
      cache.get.mockResolvedValue(null);

      const query: SearchQuery = {
        query: 'test',
        filters: {},
        sortBy: 'name',
        sortOrder: 'asc',
        page: 0,
        limit: 25,
      };

      await service.search(serverInfo, query);

      expect(cache.set).toHaveBeenCalled();
    });

    it('should return cached results', async () => {
      const cachedResults = [{ id: '1', name: 'Cached Result' }];
      cache.get.mockResolvedValue(cachedResults);

      const query: SearchQuery = {
        query: 'test',
        filters: {},
        sortBy: 'name',
        sortOrder: 'asc',
        page: 0,
        limit: 25,
      };

      const response = await service.search(serverInfo, query);

      expect(response.results).toEqual(cachedResults);
      expect(response.metadata.cacheHit).toBe(true);
      expect(httpClient.get).not.toHaveBeenCalled();
    });

    it('should generate consistent cache keys', async () => {
      const mockResponse = {
        data: {
          results: [],
          total: 0,
        },
      };

      httpClient.get.mockResolvedValue(mockResponse);
      cache.get.mockResolvedValue(null);

      const query1: SearchQuery = {
        query: 'test',
        filters: { projectKey: 'TEST' },
        sortBy: 'name',
        sortOrder: 'asc',
        page: 0,
        limit: 25,
      };

      const query2: SearchQuery = {
        query: 'test',
        filters: { projectKey: 'TEST' },
        sortBy: 'name',
        sortOrder: 'asc',
        page: 0,
        limit: 25,
      };

      await service.search(serverInfo, query1);
      await service.search(serverInfo, query2);

      // Should use the same cache key for identical queries
      expect(cache.get).toHaveBeenCalledTimes(2);
      const calls = cache.get.mock.calls;
      expect(calls[0][0]).toBe(calls[1][0]);
    });
  });

  describe('URL Building', () => {
    it('should build search URL correctly', async () => {
      const mockResponse = {
        data: {
          results: [],
          total: 0,
        },
      };

      httpClient.get.mockResolvedValue(mockResponse);
      cache.get.mockResolvedValue(null);

      const query: SearchQuery = {
        query: 'test query',
        filters: {},
        sortBy: 'name',
        sortOrder: 'asc',
        page: 0,
        limit: 25,
      };

      await service.search(serverInfo, query);

      expect(httpClient.get).toHaveBeenCalledWith(
        'https://bitbucket.example.com/test/search?q=test%20query',
        expect.any(Object)
      );
    });
  });

  describe('Response Transformation', () => {
    it('should transform API response correctly', async () => {
      const mockResponse = {
        data: {
          results: [
            { id: '1', name: 'Result 1', score: 0.9 },
            { id: '2', name: 'Result 2', score: 0.8 },
          ],
          total: 2,
        },
      };

      httpClient.get.mockResolvedValue(mockResponse);
      cache.get.mockResolvedValue(null);

      const query: SearchQuery = {
        query: 'test',
        filters: {},
        sortBy: 'name',
        sortOrder: 'asc',
        page: 0,
        limit: 25,
      };

      const response = await service.search(serverInfo, query);

      expect(response.results).toEqual(mockResponse.data.results);
    });

    it('should handle malformed API responses', async () => {
      const mockResponse = {
        data: null,
      };

      httpClient.get.mockResolvedValue(mockResponse);
      cache.get.mockResolvedValue(null);

      const query: SearchQuery = {
        query: 'test',
        filters: {},
        sortBy: 'name',
        sortOrder: 'asc',
        page: 0,
        limit: 25,
      };

      const response = await service.search(serverInfo, query);

      expect(response.results).toEqual([]);
    });
  });

  describe('Pagination', () => {
    it('should handle pagination correctly', async () => {
      const mockResponse = {
        data: {
          results: [
            { id: '3', name: 'Result 3' },
            { id: '4', name: 'Result 4' },
          ],
          total: 10,
        },
      };

      httpClient.get.mockResolvedValue(mockResponse);
      cache.get.mockResolvedValue(null);

      const query: SearchQuery = {
        query: 'test',
        filters: {},
        sortBy: 'name',
        sortOrder: 'asc',
        page: 1,
        limit: 2,
      };

      const response = await service.search(serverInfo, query);

      expect(response.pagination.page).toBe(1);
      expect(response.pagination.limit).toBe(2);
      expect(response.pagination.totalResults).toBe(2);
      expect(response.pagination.hasMore).toBe(true);
    });

    it('should calculate hasMore correctly', async () => {
      const mockResponse = {
        data: {
          results: [
            { id: '9', name: 'Result 9' },
            { id: '10', name: 'Result 10' },
          ],
          total: 10,
        },
      };

      httpClient.get.mockResolvedValue(mockResponse);
      cache.get.mockResolvedValue(null);

      const query: SearchQuery = {
        query: 'test',
        filters: {},
        sortBy: 'name',
        sortOrder: 'asc',
        page: 4,
        limit: 2,
      };

      const response = await service.search(serverInfo, query);

      expect(response.pagination.hasMore).toBe(false);
    });
  });

  describe('Performance Metrics', () => {
    it('should track execution time', async () => {
      const mockResponse = {
        data: {
          results: [],
          total: 0,
        },
      };

      // Add a delay to the mock
      httpClient.get.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockResponse), 10))
      );
      cache.get.mockResolvedValue(null);

      const query: SearchQuery = {
        query: 'test',
        filters: {},
        sortBy: 'name',
        sortOrder: 'asc',
        page: 0,
        limit: 25,
      };

      const response = await service.search(serverInfo, query);

      expect(response.metadata.executionTime).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network error');
      httpClient.get.mockRejectedValue(networkError);
      cache.get.mockResolvedValue(null);

      const query: SearchQuery = {
        query: 'test',
        filters: {},
        sortBy: 'name',
        sortOrder: 'asc',
        page: 0,
        limit: 25,
      };

      await expect(service.search(serverInfo, query)).rejects.toThrow('Search failed');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      httpClient.get.mockRejectedValue(timeoutError);
      cache.get.mockResolvedValue(null);

      const query: SearchQuery = {
        query: 'test',
        filters: {},
        sortBy: 'name',
        sortOrder: 'asc',
        page: 0,
        limit: 25,
      };

      await expect(service.search(serverInfo, query)).rejects.toThrow('Search failed');
    });

    it('should handle cache errors gracefully', async () => {
      const mockResponse = {
        data: {
          results: [{ id: '1', name: 'Test Result' }],
          total: 1,
        },
      };

      httpClient.get.mockResolvedValue(mockResponse);
      cache.get.mockRejectedValue(new Error('Cache error'));

      const query: SearchQuery = {
        query: 'test',
        filters: {},
        sortBy: 'name',
        sortOrder: 'asc',
        page: 0,
        limit: 25,
      };

      // Should still work even if cache fails
      const response = await service.search(serverInfo, query);
      expect(response.results).toHaveLength(1);
    });
  });
});
