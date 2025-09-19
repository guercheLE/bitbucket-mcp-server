import { jest } from '@jest/globals';
import axios from 'axios';
import { PullRequestCommentsService } from '../../../src/services/pullrequest-comments-service';
import { ServerInfo } from '../../../src/services/server-detection';
import { 
  Comment, 
  CreateCommentRequest, 
  UpdateCommentRequest
} from '../../../src/types/pullrequest';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PullRequestCommentsService', () => {
  let service: PullRequestCommentsService;
  let mockServerInfo: ServerInfo;
  let mockAuth: any;

  beforeEach(() => {
    service = new PullRequestCommentsService();
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

  describe('createComment', () => {
    it('should create a comment successfully', async () => {
      const mockResponse = {
        data: {
          id: 1,
          text: 'This is a test comment',
          author: {
            user: {
              name: 'testuser',
              emailAddress: 'test@example.com',
              displayName: 'Test User'
            }
          },
          createdDate: 1640995200000,
          updatedDate: 1640995200000,
          comments: []
        },
        status: 201
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const request = {
        serverInfo: mockServerInfo,
        auth: mockAuth,
        projectKey: 'TEST',
        repositorySlug: 'test-repo',
        pullRequestId: 1,
        text: 'This is a test comment'
      };

      const result = await service.createComment(request);

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://bitbucket.example.com/rest/api/1.0/projects/TEST/repos/test-repo/pull-requests/1/comments',
        expect.objectContaining({
          text: 'This is a test comment'
        }),
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json'
          }
        })
      );
    });

    it('should create a threaded comment successfully', async () => {
      const mockResponse = {
        data: {
          id: 2,
          text: 'This is a reply',
          parent: { id: 1 },
          author: {
            user: {
              name: 'testuser',
              displayName: 'Test User'
            }
          }
        },
        status: 201
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const request = {
        serverInfo: mockServerInfo,
        auth: mockAuth,
        projectKey: 'TEST',
        repositorySlug: 'test-repo',
        pullRequestId: 1,
        text: 'This is a reply',
        parentId: 1
      };

      const result = await service.createComment(request);

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://bitbucket.example.com/rest/api/1.0/projects/TEST/repos/test-repo/pull-requests/1/comments',
        expect.objectContaining({
          text: 'This is a reply',
          parent: { id: 1 }
        }),
        expect.any(Object)
      );
    });

    it('should create an inline comment successfully', async () => {
      const mockResponse = {
        data: {
          id: 3,
          text: 'Inline comment',
          anchor: {
            line: 10,
            lineType: 'ADDED',
            fileType: 'TO',
            path: 'src/test.ts'
          }
        },
        status: 201
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const request = {
        serverInfo: mockServerInfo,
        auth: mockAuth,
        projectKey: 'TEST',
        repositorySlug: 'test-repo',
        pullRequestId: 1,
        text: 'Inline comment',
        anchor: {
          line: 10,
          lineType: 'ADDED' as const,
          fileType: 'TO' as const,
          path: 'src/test.ts'
        }
      };

      const result = await service.createComment(request);

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://bitbucket.example.com/rest/api/1.0/projects/TEST/repos/test-repo/pull-requests/1/comments',
        expect.objectContaining({
          text: 'Inline comment',
          anchor: {
            line: 10,
            lineType: 'ADDED',
            fileType: 'TO',
            path: 'src/test.ts'
          }
        }),
        expect.any(Object)
      );
    });

    it('should handle creation errors', async () => {
      const errorResponse = {
        response: {
          status: 400,
          data: { errors: [{ message: 'Invalid comment' }] }
        }
      };

      mockedAxios.post.mockRejectedValueOnce(errorResponse);

      const request = {
        serverInfo: mockServerInfo,
        auth: mockAuth,
        projectKey: 'TEST',
        repositorySlug: 'test-repo',
        pullRequestId: 1,
        text: ''
      };

      await expect(service.createComment(request)).rejects.toThrow();
    });
  });

  describe('getComment', () => {
    it('should get a comment successfully', async () => {
      const mockResponse = {
        data: {
          id: 1,
          text: 'Test comment',
          author: {
            user: {
              name: 'testuser',
              displayName: 'Test User'
            }
          }
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
        commentId: 1
      };

      const result = await service.getComment(request);

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://bitbucket.example.com/rest/api/1.0/projects/TEST/repos/test-repo/pull-requests/1/comments/1',
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer test-token'
          }
        })
      );
    });
  });

  describe('listComments', () => {
    it('should list comments successfully', async () => {
      const mockResponse = {
        data: {
          values: [
            { id: 1, text: 'Comment 1' },
            { id: 2, text: 'Comment 2' }
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

      const result = await service.listComments(request);

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://bitbucket.example.com/rest/api/1.0/projects/TEST/repos/test-repo/pull-requests/1/comments',
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
  });

  describe('updateComment', () => {
    it('should update a comment successfully', async () => {
      const mockResponse = {
        data: {
          id: 1,
          text: 'Updated comment',
          version: 2,
          updatedDate: 1640995300000
        },
        status: 200
      };

      mockedAxios.put.mockResolvedValueOnce(mockResponse);

      const request = {
        serverInfo: mockServerInfo,
        auth: mockAuth,
        projectKey: 'TEST',
        repositorySlug: 'test-repo',
        pullRequestId: 1,
        commentId: 1,
        version: 1,
        text: 'Updated comment'
      };

      const result = await service.updateComment(request);

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.put).toHaveBeenCalledWith(
        'https://bitbucket.example.com/rest/api/1.0/projects/TEST/repos/test-repo/pull-requests/1/comments/1',
        expect.objectContaining({
          text: 'Updated comment',
          version: 1
        }),
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json'
          }
        })
      );
    });

    it('should handle update errors', async () => {
      const errorResponse = {
        response: {
          status: 409,
          data: { errors: [{ message: 'Version conflict' }] }
        }
      };

      mockedAxios.put.mockRejectedValueOnce(errorResponse);

      const request = {
        serverInfo: mockServerInfo,
        auth: mockAuth,
        projectKey: 'TEST',
        repositorySlug: 'test-repo',
        pullRequestId: 1,
        commentId: 1,
        version: 1,
        text: 'Updated comment'
      };

      await expect(service.updateComment(request)).rejects.toThrow();
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment successfully', async () => {
      const mockResponse = {
        status: 204
      };

      mockedAxios.delete.mockResolvedValueOnce(mockResponse);

      const request = {
        serverInfo: mockServerInfo,
        auth: mockAuth,
        projectKey: 'TEST',
        repositorySlug: 'test-repo',
        pullRequestId: 1,
        commentId: 1,
        version: 1
      };

      await service.deleteComment(request);

      expect(mockedAxios.delete).toHaveBeenCalledWith(
        'https://bitbucket.example.com/rest/api/1.0/projects/TEST/repos/test-repo/pull-requests/1/comments/1',
        expect.objectContaining({
          params: {
            version: 1
          },
          headers: {
            'Authorization': 'Bearer test-token'
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
        data: { id: 1, text: 'Test comment' },
        status: 201
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const request = {
        serverInfo: cloudServerInfo,
        auth: mockAuth,
        projectKey: 'TEST',
        repositorySlug: 'test-repo',
        pullRequestId: 1,
        text: 'Test comment'
      };

      await service.createComment(request);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.bitbucket.org/2.0/repositories/TEST/test-repo/pullrequests/1/comments',
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  describe('Error handling', () => {
    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network error');
      mockedAxios.post.mockRejectedValueOnce(networkError);

      const request = {
        serverInfo: mockServerInfo,
        auth: mockAuth,
        projectKey: 'TEST',
        repositorySlug: 'test-repo',
        pullRequestId: 1,
        text: 'Test comment'
      };

      await expect(service.createComment(request)).rejects.toThrow('Network error');
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
        pullRequestId: 1,
        commentId: 1
      };

      await expect(service.getComment(request)).rejects.toThrow();
    });
  });
});
