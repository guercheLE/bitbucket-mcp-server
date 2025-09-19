import { jest } from '@jest/globals';
import axios from 'axios';
import { PullRequestAnalysisService } from '../../../src/services/pullrequest-analysis-service';
import { ServerInfo } from '../../../src/services/server-detection';
import { 
  Activity, 
  Diff, 
  Change
} from '../../../src/types/pullrequest';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PullRequestAnalysisService', () => {
  let service: PullRequestAnalysisService;
  let mockServerInfo: ServerInfo;
  let mockAuth: any;

  beforeEach(() => {
    service = new PullRequestAnalysisService();
    mockServerInfo = {
      serverType: 'datacenter',
      baseUrl: 'https://bitbucket.example.com',
      version: '7.16.0',
      isSupported: true,
      fallbackUsed: false,
      cached: false
    };
    mockAuth = {
      access_token: 'test-token',
      token_type: 'Bearer'
    };
    jest.clearAllMocks();
  });

  describe('getActivities', () => {
    it('should get activities successfully', async () => {
      const mockResponse = {
        data: {
          values: [
            {
              id: 1,
              action: 'OPENED',
              createdDate: 1640995200000,
              user: {
                name: 'testuser',
                displayName: 'Test User'
              }
            },
            {
              id: 2,
              action: 'COMMENTED',
              createdDate: 1640995300000,
              user: {
                name: 'reviewer1',
                displayName: 'Reviewer One'
              }
            }
          ],
          size: 2,
          isLastPage: true
        },
        status: 200
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const request = {
        serverInfo: mockServerInfo,
        auth: mockAuth,
        projectKey: 'TEST',
        repositorySlug: 'test-repo',
        pullRequestId: 1,
        start: 0,
        limit: 25
      };

      const result = await service.getActivities(request);

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://bitbucket.example.com/rest/api/1.0/projects/TEST/repos/test-repo/pull-requests/1/activities',
        expect.objectContaining({
          params: {
            start: 0,
            limit: 25
          },
          headers: {
            'Authorization': 'Bearer test-token'
          }
        })
      );
    });

    it('should handle pagination correctly', async () => {
      const mockResponse = {
        data: {
          values: [],
          size: 0,
          isLastPage: true,
          nextPageStart: null
        },
        status: 200
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const request = {
        serverInfo: mockServerInfo,
        auth: mockAuth,
        projectKey: 'TEST',
        repositorySlug: 'test-repo',
        pullRequestId: 1,
        start: 10,
        limit: 10
      };

      const result = await service.getActivities(request);

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://bitbucket.example.com/rest/api/1.0/projects/TEST/repos/test-repo/pull-requests/1/activities',
        expect.objectContaining({
          params: {
            start: 10,
            limit: 10
          }
        })
      );
    });
  });

  describe('getDiff', () => {
    it('should get diff successfully', async () => {
      const mockResponse = {
        data: {
          diffs: [
            {
              source: {
                toString: 'src/test.ts'
              },
              destination: {
                toString: 'src/test.ts'
              },
              hunks: [
                {
                  sourceLine: 1,
                  sourceSpan: 1,
                  destinationLine: 1,
                  destinationSpan: 1,
                  segments: [
                    {
                      type: 'ADDED',
                      lines: [
                        {
                          destination: 1,
                          line: '+console.log("Hello World");',
                          truncated: false
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        status: 200
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const request = {
        serverInfo: mockServerInfo,
        auth: mockAuth,
        projectKey: 'TEST',
        repositorySlug: 'test-repo',
        pullRequestId: 1,
        contextLines: 3
      };

      const result = await service.getDiff(request);

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://bitbucket.example.com/rest/api/1.0/projects/TEST/repos/test-repo/pull-requests/1/diff',
        expect.objectContaining({
          params: {
            contextLines: 3
          },
          headers: {
            'Authorization': 'Bearer test-token'
          }
        })
      );
    });

    it('should get diff with default context lines', async () => {
      const mockResponse = {
        data: { diffs: [] },
        status: 200
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const request = {
        serverInfo: mockServerInfo,
        auth: mockAuth,
        projectKey: 'TEST',
        repositorySlug: 'test-repo',
        pullRequestId: 1
      };

      await service.getDiff(request);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://bitbucket.example.com/rest/api/1.0/projects/TEST/repos/test-repo/pull-requests/1/diff',
        expect.objectContaining({
          params: {
            contextLines: 3
          }
        })
      );
    });
  });

  describe('getChanges', () => {
    it('should get changes successfully', async () => {
      const mockResponse = {
        data: {
          values: [
            {
              contentId: 'abc123',
              fromContentId: 'def456',
              path: {
                components: ['src', 'test.ts'],
                parent: 'src',
                name: 'test.ts',
                extension: 'ts',
                toString: 'src/test.ts'
              },
              type: 'MODIFY',
              nodeType: 'FILE',
              srcExecutable: false,
              executable: false,
              percentUnchanged: 0,
              typeChange: false,
              links: {
                self: [
                  {
                    href: 'https://bitbucket.example.com/rest/api/1.0/projects/TEST/repos/test-repo/pull-requests/1/changes'
                  }
                ]
              }
            }
          ],
          size: 1,
          isLastPage: true
        },
        status: 200
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const request = {
        serverInfo: mockServerInfo,
        auth: mockAuth,
        projectKey: 'TEST',
        repositorySlug: 'test-repo',
        pullRequestId: 1,
        start: 0,
        limit: 25
      };

      const result = await service.getChanges(request);

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://bitbucket.example.com/rest/api/1.0/projects/TEST/repos/test-repo/pull-requests/1/changes',
        expect.objectContaining({
          params: {
            start: 0,
            limit: 25
          },
          headers: {
            'Authorization': 'Bearer test-token'
          }
        })
      );
    });

    it('should handle changes pagination', async () => {
      const mockResponse = {
        data: {
          values: [],
          size: 0,
          isLastPage: true,
          nextPageStart: null
        },
        status: 200
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const request = {
        serverInfo: mockServerInfo,
        auth: mockAuth,
        projectKey: 'TEST',
        repositorySlug: 'test-repo',
        pullRequestId: 1,
        start: 5,
        limit: 10
      };

      const result = await service.getChanges(request);

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://bitbucket.example.com/rest/api/1.0/projects/TEST/repos/test-repo/pull-requests/1/changes',
        expect.objectContaining({
          params: {
            start: 5,
            limit: 10
          }
        })
      );
    });
  });

  describe('Cloud API support', () => {
    it('should use Cloud API endpoints for Cloud servers', async () => {
      const cloudServerInfo = {
        serverType: 'cloud' as const,
        baseUrl: 'https://api.bitbucket.org',
        version: '2.0',
        isSupported: true,
        fallbackUsed: false,
        cached: false
      };

      const mockResponse = {
        data: { values: [] },
        status: 200
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const request = {
        serverInfo: cloudServerInfo,
        auth: mockAuth,
        projectKey: 'TEST',
        repositorySlug: 'test-repo',
        pullRequestId: 1
      };

      await service.getActivities(request);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.bitbucket.org/2.0/repositories/TEST/test-repo/pullrequests/1/activity',
        expect.any(Object)
      );
    });

    it('should use Cloud API for diff endpoint', async () => {
      const cloudServerInfo = {
        serverType: 'cloud' as const,
        baseUrl: 'https://api.bitbucket.org',
        version: '2.0',
        isSupported: true,
        fallbackUsed: false,
        cached: false
      };

      const mockResponse = {
        data: { diffs: [] },
        status: 200
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const request = {
        serverInfo: cloudServerInfo,
        auth: mockAuth,
        projectKey: 'TEST',
        repositorySlug: 'test-repo',
        pullRequestId: 1
      };

      await service.getDiff(request);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.bitbucket.org/2.0/repositories/TEST/test-repo/pullrequests/1/diff',
        expect.any(Object)
      );
    });

    it('should use Cloud API for changes endpoint', async () => {
      const cloudServerInfo = {
        serverType: 'cloud' as const,
        baseUrl: 'https://api.bitbucket.org',
        version: '2.0',
        isSupported: true,
        fallbackUsed: false,
        cached: false
      };

      const mockResponse = {
        data: { values: [] },
        status: 200
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const request = {
        serverInfo: cloudServerInfo,
        auth: mockAuth,
        projectKey: 'TEST',
        repositorySlug: 'test-repo',
        pullRequestId: 1
      };

      await service.getChanges(request);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.bitbucket.org/2.0/repositories/TEST/test-repo/pullrequests/1/diffstat',
        expect.any(Object)
      );
    });
  });

  describe('Error handling', () => {
    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network error');
      mockedAxios.get.mockRejectedValueOnce(networkError);

      const request = {
        serverInfo: mockServerInfo,
        auth: mockAuth,
        projectKey: 'TEST',
        repositorySlug: 'test-repo',
        pullRequestId: 1
      };

      await expect(service.getActivities(request)).rejects.toThrow('Network error');
    });

    it('should handle authentication errors', async () => {
      const authError = {
        response: {
          status: 401,
          data: { errors: [{ message: 'Unauthorized' }] }
        }
      };

      mockedAxios.get.mockRejectedValueOnce(authError);

      const request = {
        serverInfo: mockServerInfo,
        auth: mockAuth,
        projectKey: 'TEST',
        repositorySlug: 'test-repo',
        pullRequestId: 1
      };

      await expect(service.getDiff(request)).rejects.toThrow();
    });

    it('should handle not found errors', async () => {
      const notFoundError = {
        response: {
          status: 404,
          data: { errors: [{ message: 'Pull request not found' }] }
        }
      };

      mockedAxios.get.mockRejectedValueOnce(notFoundError);

      const request = {
        serverInfo: mockServerInfo,
        auth: mockAuth,
        projectKey: 'TEST',
        repositorySlug: 'test-repo',
        pullRequestId: 999
      };

      await expect(service.getChanges(request)).rejects.toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle large responses efficiently', async () => {
      const largeResponse = {
        data: {
          values: Array.from({ length: 1000 }, (_, i) => ({
            id: i,
            action: 'COMMENTED',
            createdDate: 1640995200000 + i * 1000,
            user: {
              name: `user${i}`,
              displayName: `User ${i}`
            }
          })),
          size: 1000,
          isLastPage: false,
          nextPageStart: 1000
        },
        status: 200
      };

      mockedAxios.get.mockResolvedValueOnce(largeResponse);

      const request = {
        serverInfo: mockServerInfo,
        auth: mockAuth,
        projectKey: 'TEST',
        repositorySlug: 'test-repo',
        pullRequestId: 1,
        start: 0,
        limit: 1000
      };

      const startTime = Date.now();
      const result = await service.getActivities(request);
      const endTime = Date.now();

      expect(result).toEqual(largeResponse.data);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
