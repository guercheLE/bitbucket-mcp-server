/**
 * Integration Tests: Issue Creation Scenario
 * 
 * Testa o cenário completo de criação de Issues
 * incluindo validação, persistência e resposta
 * 
 * @fileoverview Testes de integração para criação de Issues
 * @version 1.0.0
 * @since 2024-12-19
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { 
  Issue, 
  CreateIssueRequest, 
  IssueType, 
  IssuePriority 
} from '../../src/types/issues';

// ============================================================================
// Mock Data
// ============================================================================

const validCreateRequest: CreateIssueRequest = {
  title: 'Integration Test Issue',
  content: {
    raw: 'This is an integration test issue created via API',
    markup: 'markdown'
  },
  kind: 'bug',
  priority: 'major'
};

const expectedCreatedIssue: Issue = {
  id: 1,
  title: 'Integration Test Issue',
  content: {
    raw: 'This is an integration test issue created via API',
    markup: 'markdown',
    html: '<p>This is an integration test issue created via API</p>',
    type: 'text'
  },
  reporter: {
    uuid: 'user-uuid-123',
    display_name: 'Test User',
    nickname: 'testuser',
    account_id: 'account-123',
    links: {
      self: { href: 'https://api.bitbucket.org/2.0/users/testuser' },
      html: { href: 'https://bitbucket.org/testuser' },
      avatar: { href: 'https://bitbucket.org/account/testuser/avatar/32/' }
    }
  },
  kind: 'bug',
  priority: 'major',
  status: 'new',
  created_on: '2024-12-19T10:00:00.000Z',
  updated_on: '2024-12-19T10:00:00.000Z',
  state: {
    name: 'New',
    type: 'unresolved',
    color: '#ff6b6b'
  },
  links: {
    self: { href: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/issues/1' },
    html: { href: 'https://bitbucket.org/workspace/repo/issues/1' },
    comments: { href: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/issues/1/comments' },
    attachments: { href: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/issues/1/attachments' },
    watch: { href: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/issues/1/watch' },
    vote: { href: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/issues/1/vote' }
  },
  watchers_count: 0,
  voters_count: 0
};

// ============================================================================
// Integration Tests
// ============================================================================

describe('Issue Creation Integration Tests', () => {
  let mockApiCall: jest.MockedFunction<any>;
  let mockLogger: jest.MockedFunction<any>;
  let mockAuthService: jest.MockedFunction<any>;

  // ============================================================================
  // Helper Functions
  // ============================================================================

  /**
   * Mock implementation of issue creation function
   * This would be replaced with actual implementation in real tests
   */
  const createIssue = async (request: CreateIssueRequest): Promise<Issue> => {
    // Mock authentication
    const authResult = await mockAuthService();
    
    // Mock API call
    const response = await mockApiCall(
      `${process.env.BITBUCKET_CLOUD_API_URL}/repositories/${process.env.BITBUCKET_WORKSPACE}/${process.env.BITBUCKET_REPOSITORY}/issues`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authResult.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      }
    );

    // Mock logging
    mockLogger('info', 'Issue created successfully', {
      issueId: response.data.id,
      title: response.data.title,
      kind: response.data.kind,
      priority: response.data.priority
    });

    return response.data;
  };

  beforeEach(() => {
    // Setup mocks
    mockApiCall = jest.fn();
    mockLogger = jest.fn();
    mockAuthService = jest.fn();

    // Setup environment
    process.env.BITBUCKET_CLOUD_API_URL = 'https://api.bitbucket.org/2.0';
    process.env.BITBUCKET_WORKSPACE = 'test-workspace';
    process.env.BITBUCKET_REPOSITORY = 'test-repo';
    process.env.BITBUCKET_OAUTH_TOKEN = 'test-oauth-token';
  });

  afterEach(() => {
    // Cleanup
    delete process.env.BITBUCKET_CLOUD_API_URL;
    delete process.env.BITBUCKET_WORKSPACE;
    delete process.env.BITBUCKET_REPOSITORY;
    delete process.env.BITBUCKET_OAUTH_TOKEN;
    
    jest.clearAllMocks();
  });

  // ============================================================================
  // Successful Issue Creation
  // ============================================================================

  describe('Successful Issue Creation', () => {
    it('should create issue with valid request data', async () => {
      // Mock successful API response
      mockApiCall.mockResolvedValueOnce({
        status: 201,
        data: expectedCreatedIssue
      });

      // Mock authentication
      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      // Execute issue creation
      const result = await createIssue(validCreateRequest);

      // Verify API call was made correctly
      expect(mockApiCall).toHaveBeenCalledWith(
        'https://api.bitbucket.org/2.0/repositories/test-workspace/test-repo/issues',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer valid-token',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(validCreateRequest)
        }
      );

      // Verify result
      expect(result).toEqual(expectedCreatedIssue);
      expect(result.id).toBe(1);
      expect(result.title).toBe('Integration Test Issue');
      expect(result.kind).toBe('bug');
      expect(result.priority).toBe('major');
      expect(result.status).toBe('new');
    });

    it('should create issue with minimal required fields', async () => {
      const minimalRequest: CreateIssueRequest = {
        title: 'Minimal Issue'
      };

      const minimalResponse = {
        ...expectedCreatedIssue,
        title: 'Minimal Issue',
        content: undefined
      };

      mockApiCall.mockResolvedValueOnce({
        status: 201,
        data: minimalResponse
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await createIssue(minimalRequest);

      expect(result.title).toBe('Minimal Issue');
      expect(result.content).toBeUndefined();
    });

    it('should create issue with all optional fields', async () => {
      const completeRequest: CreateIssueRequest = {
        title: 'Complete Issue',
        content: {
          raw: 'Complete issue description',
          markup: 'markdown'
        },
        kind: 'enhancement',
        priority: 'critical',
        assignee: {
          uuid: 'assignee-uuid-123'
        },
        component: {
          name: 'frontend'
        },
        milestone: {
          name: 'v1.0'
        },
        version: {
          name: '1.0.0'
        }
      };

      const completeResponse = {
        ...expectedCreatedIssue,
        ...completeRequest,
        id: 2,
        assignee: {
          uuid: 'assignee-uuid-123',
          display_name: 'Assignee User',
          nickname: 'assignee',
          account_id: 'assignee-account-123',
          links: {
            self: { href: 'https://api.bitbucket.org/2.0/users/assignee' },
            html: { href: 'https://bitbucket.org/assignee' },
            avatar: { href: 'https://bitbucket.org/account/assignee/avatar/32/' }
          }
        },
        component: {
          name: 'frontend',
          description: 'Frontend components'
        },
        milestone: {
          name: 'v1.0',
          description: 'Version 1.0 release',
          due_date: '2024-12-31'
        },
        version: {
          name: '1.0.0',
          description: 'Initial release',
          released: false
        }
      };

      mockApiCall.mockResolvedValueOnce({
        status: 201,
        data: completeResponse
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await createIssue(completeRequest);

      expect(result.assignee).toBeDefined();
      expect(result.component).toBeDefined();
      expect(result.milestone).toBeDefined();
      expect(result.version).toBeDefined();
    });
  });

  // ============================================================================
  // Validation Scenarios
  // ============================================================================

  describe('Validation Scenarios', () => {
    it('should reject issue creation with missing title', async () => {
      const invalidRequest = {
        content: {
          raw: 'Issue without title',
          markup: 'markdown'
        }
      } as CreateIssueRequest;

      mockApiCall.mockRejectedValueOnce({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid request data',
            detail: 'Title is required'
          }
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(createIssue(invalidRequest)).rejects.toMatchObject({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid request data',
            detail: 'Title is required'
          }
        }
      });
    });

    it('should reject issue creation with invalid kind', async () => {
      const invalidRequest = {
        ...validCreateRequest,
        kind: 'invalid-kind' as IssueType
      };

      mockApiCall.mockRejectedValueOnce({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid request data',
            detail: 'Invalid issue kind'
          }
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(createIssue(invalidRequest)).rejects.toMatchObject({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid request data',
            detail: 'Invalid issue kind'
          }
        }
      });
    });

    it('should reject issue creation with invalid priority', async () => {
      const invalidRequest = {
        ...validCreateRequest,
        priority: 'invalid-priority' as IssuePriority
      };

      mockApiCall.mockRejectedValueOnce({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid request data',
            detail: 'Invalid issue priority'
          }
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(createIssue(invalidRequest)).rejects.toMatchObject({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid request data',
            detail: 'Invalid issue priority'
          }
        }
      });
    });

    it('should reject issue creation with empty title', async () => {
      const invalidRequest = {
        ...validCreateRequest,
        title: ''
      };

      mockApiCall.mockRejectedValueOnce({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid request data',
            detail: 'Title cannot be empty'
          }
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(createIssue(invalidRequest)).rejects.toMatchObject({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid request data',
            detail: 'Title cannot be empty'
          }
        }
      });
    });
  });

  // ============================================================================
  // Authentication Scenarios
  // ============================================================================

  describe('Authentication Scenarios', () => {
    it('should handle authentication failure', async () => {
      mockAuthService.mockRejectedValueOnce({
        status: 401,
        data: {
          type: 'error',
          error: {
            message: 'Unauthorized',
            detail: 'Invalid or expired token'
          }
        }
      });

      await expect(createIssue(validCreateRequest)).rejects.toMatchObject({
        status: 401,
        data: {
          type: 'error',
          error: {
            message: 'Unauthorized',
            detail: 'Invalid or expired token'
          }
        }
      });
    });

    it('should handle token refresh on 401 response', async () => {
      // First call fails with 401
      mockApiCall.mockRejectedValueOnce({
        status: 401,
        data: {
          type: 'error',
          error: {
            message: 'Unauthorized',
            detail: 'Token expired'
          }
        }
      });

      // Token refresh succeeds
      mockAuthService.mockResolvedValueOnce({
        access_token: 'refreshed-token',
        token_type: 'Bearer'
      });

      // Second call succeeds
      mockApiCall.mockResolvedValueOnce({
        status: 201,
        data: expectedCreatedIssue
      });

      const result = await createIssue(validCreateRequest);

      expect(mockApiCall).toHaveBeenCalledTimes(2);
      expect(result).toEqual(expectedCreatedIssue);
    });
  });

  // ============================================================================
  // Permission Scenarios
  // ============================================================================

  describe('Permission Scenarios', () => {
    it('should handle insufficient permissions', async () => {
      mockApiCall.mockRejectedValueOnce({
        status: 403,
        data: {
          type: 'error',
          error: {
            message: 'Insufficient permissions',
            detail: 'You do not have permission to create issues in this repository'
          }
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(createIssue(validCreateRequest)).rejects.toMatchObject({
        status: 403,
        data: {
          type: 'error',
          error: {
            message: 'Insufficient permissions',
            detail: 'You do not have permission to create issues in this repository'
          }
        }
      });
    });

    it('should handle repository not found', async () => {
      mockApiCall.mockRejectedValueOnce({
        status: 404,
        data: {
          type: 'error',
          error: {
            message: 'Repository not found',
            detail: 'The requested repository does not exist'
          }
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(createIssue(validCreateRequest)).rejects.toMatchObject({
        status: 404,
        data: {
          type: 'error',
          error: {
            message: 'Repository not found',
            detail: 'The requested repository does not exist'
          }
        }
      });
    });
  });

  // ============================================================================
  // Rate Limiting Scenarios
  // ============================================================================

  describe('Rate Limiting Scenarios', () => {
    it('should handle rate limit exceeded', async () => {
      mockApiCall.mockRejectedValueOnce({
        status: 429,
        data: {
          type: 'error',
          error: {
            message: 'Rate limit exceeded',
            detail: 'Too many requests. Please try again later.',
            data: {
              retry_after: 60
            }
          }
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(createIssue(validCreateRequest)).rejects.toMatchObject({
        status: 429,
        data: {
          type: 'error',
          error: {
            message: 'Rate limit exceeded',
            detail: 'Too many requests. Please try again later.',
            data: {
              retry_after: 60
            }
          }
        }
      });
    });

    it('should retry after rate limit with exponential backoff', async () => {
      // First call fails with rate limit
      mockApiCall.mockRejectedValueOnce({
        status: 429,
        data: {
          type: 'error',
          error: {
            message: 'Rate limit exceeded',
            detail: 'Too many requests. Please try again later.',
            data: {
              retry_after: 1
            }
          }
        }
      });

      // Second call succeeds
      mockApiCall.mockResolvedValueOnce({
        status: 201,
        data: expectedCreatedIssue
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await createIssue(validCreateRequest);

      expect(mockApiCall).toHaveBeenCalledTimes(2);
      expect(result).toEqual(expectedCreatedIssue);
    });
  });

  // ============================================================================
  // Network Error Scenarios
  // ============================================================================

  describe('Network Error Scenarios', () => {
    it('should handle network timeout', async () => {
      mockApiCall.mockRejectedValueOnce({
        code: 'ETIMEDOUT',
        message: 'Request timeout'
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(createIssue(validCreateRequest)).rejects.toMatchObject({
        code: 'ETIMEDOUT',
        message: 'Request timeout'
      });
    });

    it('should handle network connection error', async () => {
      mockApiCall.mockRejectedValueOnce({
        code: 'ECONNREFUSED',
        message: 'Connection refused'
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(createIssue(validCreateRequest)).rejects.toMatchObject({
        code: 'ECONNREFUSED',
        message: 'Connection refused'
      });
    });

    it('should retry on network errors with exponential backoff', async () => {
      // First call fails with network error
      mockApiCall.mockRejectedValueOnce({
        code: 'ECONNRESET',
        message: 'Connection reset by peer'
      });

      // Second call succeeds
      mockApiCall.mockResolvedValueOnce({
        status: 201,
        data: expectedCreatedIssue
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await createIssue(validCreateRequest);

      expect(mockApiCall).toHaveBeenCalledTimes(2);
      expect(result).toEqual(expectedCreatedIssue);
    });
  });

  // ============================================================================
  // Logging and Monitoring
  // ============================================================================

  describe('Logging and Monitoring', () => {
    it('should log successful issue creation', async () => {
      mockApiCall.mockResolvedValueOnce({
        status: 201,
        data: expectedCreatedIssue
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await createIssue(validCreateRequest);

      expect(mockLogger).toHaveBeenCalledWith(
        'info',
        'Issue created successfully',
        expect.objectContaining({
          issueId: expectedCreatedIssue.id,
          title: expectedCreatedIssue.title,
          kind: expectedCreatedIssue.kind,
          priority: expectedCreatedIssue.priority
        })
      );
    });

    it('should log failed issue creation', async () => {
      const error = {
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid request data',
            detail: 'Title is required'
          }
        }
      };

      mockApiCall.mockRejectedValueOnce(error);

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(createIssue({} as CreateIssueRequest)).rejects.toMatchObject(error);

      expect(mockLogger).toHaveBeenCalledWith(
        'error',
        'Failed to create issue',
        expect.objectContaining({
          error: error.data.error.message,
          detail: error.data.error.detail
        })
      );
    });

    it('should log performance metrics', async () => {
      mockApiCall.mockResolvedValueOnce({
        status: 201,
        data: expectedCreatedIssue
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const startTime = Date.now();
      await createIssue(validCreateRequest);
      const endTime = Date.now();

      expect(mockLogger).toHaveBeenCalledWith(
        'info',
        'Issue creation performance',
        expect.objectContaining({
          operation: 'create_issue',
          duration: expect.any(Number),
          success: true
        })
      );
    });
  });
});

});
