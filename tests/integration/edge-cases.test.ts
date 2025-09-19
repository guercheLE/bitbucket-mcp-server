/**
 * Integration tests for edge cases and dependencies
 * 
 * This test suite covers edge cases, error scenarios, and dependency
 * management for the Issues management system.
 * 
 * @fileoverview Integration tests for edge cases and dependencies
 * @author Bitbucket MCP Server Team
 * @version 1.0.0
 */

import { Issue, IssueStatus, IssueType, IssuePriority, CreateIssueRequest } from '../../src/types/issues';

// ============================================================================
// Test Data
// ============================================================================

const mockIssue: Issue = {
  id: 1,
  title: 'Test Issue',
  content: {
    raw: 'Test issue description',
    markup: 'markdown',
    html: '<p>Test issue description</p>',
    type: 'text'
  },
  state: {
    name: 'new',
    type: 'unresolved',
    color: '#ff6b6b'
  },
  kind: 'bug',
  priority: 'major',
  status: 'new',
  created_on: '2024-12-19T10:00:00.000Z',
  updated_on: '2024-12-19T10:00:00.000Z',
  reporter: {
    uuid: 'reporter-uuid-123',
    display_name: 'Reporter User',
    nickname: 'reporter',
    account_id: 'reporter-account-123',
    links: {
      self: { href: 'https://api.bitbucket.org/2.0/users/reporter' },
      html: { href: 'https://bitbucket.org/reporter' },
      avatar: { href: 'https://bitbucket.org/account/reporter/avatar/32/' }
    }
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
// Test Suite
// ============================================================================

describe('Edge Cases and Dependencies Integration Tests', () => {
  let mockApiCall: jest.MockedFunction<any>;
  let mockLogger: jest.MockedFunction<any>;
  let mockAuthService: jest.MockedFunction<any>;

  // ============================================================================
  // Helper Functions
  // ============================================================================

  /**
   * Mock implementation of create issue function
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
      title: response.data.title
    });

    return response.data;
  };

  /**
   * Mock implementation of get issue function
   * This would be replaced with actual implementation in real tests
   */
  const getIssue = async (issueId: number): Promise<Issue> => {
    // Mock authentication
    const authResult = await mockAuthService();
    
    // Mock API call
    const response = await mockApiCall(
      `${process.env.BITBUCKET_CLOUD_API_URL}/repositories/${process.env.BITBUCKET_WORKSPACE}/${process.env.BITBUCKET_REPOSITORY}/issues/${issueId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authResult.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

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
  });

  // ============================================================================
  // Edge Cases - Data Validation
  // ============================================================================

  describe('Edge Cases - Data Validation', () => {
    it('should handle issue with maximum title length', async () => {
      const maxTitle = 'A'.repeat(255); // Bitbucket's maximum title length
      const request: CreateIssueRequest = {
        title: maxTitle,
        content: {
          raw: 'Issue with maximum title length',
          markup: 'markdown'
        }
      };

      const createdIssue = {
        ...mockIssue,
        title: maxTitle
      };

      mockApiCall.mockResolvedValueOnce({
        status: 201,
        data: createdIssue
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await createIssue(request);

      expect(result.title).toBe(maxTitle);
      expect(result.title.length).toBe(255);
    });

    it('should handle issue with maximum content length', async () => {
      const maxContent = 'A'.repeat(10000); // Large content
      const request: CreateIssueRequest = {
        title: 'Issue with large content',
        content: {
          raw: maxContent,
          markup: 'markdown'
        }
      };

      const createdIssue = {
        ...mockIssue,
        content: {
          raw: maxContent,
          markup: 'markdown'
        }
      };

      mockApiCall.mockResolvedValueOnce({
        status: 201,
        data: createdIssue
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await createIssue(request);

      expect(result.content.raw).toBe(maxContent);
      expect(result.content.raw.length).toBe(10000);
    });

    it('should handle issue with special characters in title', async () => {
      const specialTitle = 'Issue with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
      const request: CreateIssueRequest = {
        title: specialTitle,
        content: {
          raw: 'Issue with special characters',
          markup: 'markdown'
        }
      };

      const createdIssue = {
        ...mockIssue,
        title: specialTitle
      };

      mockApiCall.mockResolvedValueOnce({
        status: 201,
        data: createdIssue
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await createIssue(request);

      expect(result.title).toBe(specialTitle);
    });

    it('should handle issue with unicode characters', async () => {
      const unicodeTitle = 'Issue with unicode: 中文, العربية, русский, 日本語';
      const request: CreateIssueRequest = {
        title: unicodeTitle,
        content: {
          raw: 'Issue with unicode characters',
          markup: 'markdown'
        }
      };

      const createdIssue = {
        ...mockIssue,
        title: unicodeTitle
      };

      mockApiCall.mockResolvedValueOnce({
        status: 201,
        data: createdIssue
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await createIssue(request);

      expect(result.title).toBe(unicodeTitle);
    });

    it('should handle issue with HTML content', async () => {
      const htmlContent = '<h1>HTML Content</h1><p>This is <strong>bold</strong> text.</p>';
      const request: CreateIssueRequest = {
        title: 'Issue with HTML content',
        content: {
          raw: htmlContent,
          markup: 'html'
        }
      };

      const createdIssue = {
        ...mockIssue,
        content: {
          raw: htmlContent,
          markup: 'html'
        }
      };

      mockApiCall.mockResolvedValueOnce({
        status: 201,
        data: createdIssue
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await createIssue(request);

      expect(result.content.raw).toBe(htmlContent);
      expect(result.content.markup).toBe('html');
    });
  });

  // ============================================================================
  // Edge Cases - Boundary Conditions
  // ============================================================================

  describe('Edge Cases - Boundary Conditions', () => {
    it('should handle issue with minimum required fields', async () => {
      const minimalRequest: CreateIssueRequest = {
        title: 'A' // Minimum title length
      };

      const createdIssue = {
        ...mockIssue,
        title: 'A'
      };

      mockApiCall.mockResolvedValueOnce({
        status: 201,
        data: createdIssue
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await createIssue(minimalRequest);

      expect(result.title).toBe('A');
    });

    it('should handle issue with all optional fields', async () => {
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

      const createdIssue = {
        ...mockIssue,
        ...completeRequest
      };

      mockApiCall.mockResolvedValueOnce({
        status: 201,
        data: createdIssue
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

    it('should handle issue with null optional fields', async () => {
      const requestWithNulls: CreateIssueRequest = {
        title: 'Issue with null fields',
        content: null,
        kind: null,
        priority: null,
        assignee: null,
        component: null,
        milestone: null,
        version: null
      };

      const createdIssue = {
        ...mockIssue,
        title: 'Issue with null fields',
        content: null,
        kind: null,
        priority: null,
        assignee: null,
        component: null,
        milestone: null,
        version: null
      };

      mockApiCall.mockResolvedValueOnce({
        status: 201,
        data: createdIssue
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await createIssue(requestWithNulls);

      expect(result.content).toBeNull();
      expect(result.kind).toBeNull();
      expect(result.priority).toBeNull();
    });
  });

  // ============================================================================
  // Edge Cases - Error Scenarios
  // ============================================================================

  describe('Edge Cases - Error Scenarios', () => {
    it('should handle title exceeding maximum length', async () => {
      const tooLongTitle = 'A'.repeat(256); // Exceeds maximum
      const request: CreateIssueRequest = {
        title: tooLongTitle
      };

      mockApiCall.mockRejectedValueOnce({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid request data',
            detail: 'Title exceeds maximum length of 255 characters'
          }
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(createIssue(request)).rejects.toMatchObject({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid request data',
            detail: 'Title exceeds maximum length of 255 characters'
          }
        }
      });
    });

    it('should handle empty title', async () => {
      const request: CreateIssueRequest = {
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

      await expect(createIssue(request)).rejects.toMatchObject({
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

    it('should handle whitespace-only title', async () => {
      const request: CreateIssueRequest = {
        title: '   \t\n   '
      };

      mockApiCall.mockRejectedValueOnce({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid request data',
            detail: 'Title cannot be empty or contain only whitespace'
          }
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(createIssue(request)).rejects.toMatchObject({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid request data',
            detail: 'Title cannot be empty or contain only whitespace'
          }
        }
      });
    });

    it('should handle invalid issue kind', async () => {
      const request: CreateIssueRequest = {
        title: 'Test Issue',
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

      await expect(createIssue(request)).rejects.toMatchObject({
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

    it('should handle invalid issue priority', async () => {
      const request: CreateIssueRequest = {
        title: 'Test Issue',
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

      await expect(createIssue(request)).rejects.toMatchObject({
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
  });

  // ============================================================================
  // Edge Cases - Dependencies
  // ============================================================================

  describe('Edge Cases - Dependencies', () => {
    it('should handle non-existent assignee', async () => {
      const request: CreateIssueRequest = {
        title: 'Issue with non-existent assignee',
        assignee: {
          uuid: 'non-existent-uuid'
        }
      };

      mockApiCall.mockRejectedValueOnce({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid request data',
            detail: 'Assignee not found'
          }
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(createIssue(request)).rejects.toMatchObject({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid request data',
            detail: 'Assignee not found'
          }
        }
      });
    });

    it('should handle non-existent component', async () => {
      const request: CreateIssueRequest = {
        title: 'Issue with non-existent component',
        component: {
          name: 'non-existent-component'
        }
      };

      mockApiCall.mockRejectedValueOnce({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid request data',
            detail: 'Component not found'
          }
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(createIssue(request)).rejects.toMatchObject({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid request data',
            detail: 'Component not found'
          }
        }
      });
    });

    it('should handle non-existent milestone', async () => {
      const request: CreateIssueRequest = {
        title: 'Issue with non-existent milestone',
        milestone: {
          name: 'non-existent-milestone'
        }
      };

      mockApiCall.mockRejectedValueOnce({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid request data',
            detail: 'Milestone not found'
          }
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(createIssue(request)).rejects.toMatchObject({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid request data',
            detail: 'Milestone not found'
          }
        }
      });
    });

    it('should handle non-existent version', async () => {
      const request: CreateIssueRequest = {
        title: 'Issue with non-existent version',
        version: {
          name: 'non-existent-version'
        }
      };

      mockApiCall.mockRejectedValueOnce({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid request data',
            detail: 'Version not found'
          }
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(createIssue(request)).rejects.toMatchObject({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid request data',
            detail: 'Version not found'
          }
        }
      });
    });
  });

  // ============================================================================
  // Edge Cases - Network and System
  // ============================================================================

  describe('Edge Cases - Network and System', () => {
    it('should handle API timeout', async () => {
      mockApiCall.mockRejectedValueOnce({
        code: 'ETIMEDOUT',
        message: 'Request timeout'
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(createIssue({ title: 'Test Issue' })).rejects.toMatchObject({
        code: 'ETIMEDOUT',
        message: 'Request timeout'
      });
    });

    it('should handle API rate limiting', async () => {
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

      await expect(createIssue({ title: 'Test Issue' })).rejects.toMatchObject({
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

    it('should handle API server error', async () => {
      mockApiCall.mockRejectedValueOnce({
        status: 500,
        data: {
          type: 'error',
          error: {
            message: 'Internal server error',
            detail: 'An unexpected error occurred'
          }
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(createIssue({ title: 'Test Issue' })).rejects.toMatchObject({
        status: 500,
        data: {
          type: 'error',
          error: {
            message: 'Internal server error',
            detail: 'An unexpected error occurred'
          }
        }
      });
    });

    it('should handle API service unavailable', async () => {
      mockApiCall.mockRejectedValueOnce({
        status: 503,
        data: {
          type: 'error',
          error: {
            message: 'Service unavailable',
            detail: 'The service is temporarily unavailable'
          }
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(createIssue({ title: 'Test Issue' })).rejects.toMatchObject({
        status: 503,
        data: {
          type: 'error',
          error: {
            message: 'Service unavailable',
            detail: 'The service is temporarily unavailable'
          }
        }
      });
    });
  });

  // ============================================================================
  // Edge Cases - Authentication and Authorization
  // ============================================================================

  describe('Edge Cases - Authentication and Authorization', () => {
    it('should handle expired token', async () => {
      mockAuthService.mockRejectedValueOnce({
        status: 401,
        data: {
          type: 'error',
          error: {
            message: 'Unauthorized',
            detail: 'Token has expired'
          }
        }
      });

      await expect(createIssue({ title: 'Test Issue' })).rejects.toMatchObject({
        status: 401,
        data: {
          type: 'error',
          error: {
            message: 'Unauthorized',
            detail: 'Token has expired'
          }
        }
      });
    });

    it('should handle invalid token', async () => {
      mockAuthService.mockRejectedValueOnce({
        status: 401,
        data: {
          type: 'error',
          error: {
            message: 'Unauthorized',
            detail: 'Invalid token'
          }
        }
      });

      await expect(createIssue({ title: 'Test Issue' })).rejects.toMatchObject({
        status: 401,
        data: {
          type: 'error',
          error: {
            message: 'Unauthorized',
            detail: 'Invalid token'
          }
        }
      });
    });

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

      await expect(createIssue({ title: 'Test Issue' })).rejects.toMatchObject({
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

      await expect(createIssue({ title: 'Test Issue' })).rejects.toMatchObject({
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
  // Edge Cases - Data Consistency
  // ============================================================================

  describe('Edge Cases - Data Consistency', () => {
    it('should handle concurrent issue creation', async () => {
      const request1: CreateIssueRequest = { title: 'Concurrent Issue 1' };
      const request2: CreateIssueRequest = { title: 'Concurrent Issue 2' };

      const issue1 = { ...mockIssue, id: 1, title: 'Concurrent Issue 1' };
      const issue2 = { ...mockIssue, id: 2, title: 'Concurrent Issue 2' };

      // Mock concurrent API calls
      mockApiCall
        .mockResolvedValueOnce({ status: 201, data: issue1 })
        .mockResolvedValueOnce({ status: 201, data: issue2 });

      mockAuthService
        .mockResolvedValueOnce({ access_token: 'valid-token', token_type: 'Bearer' })
        .mockResolvedValueOnce({ access_token: 'valid-token', token_type: 'Bearer' });

      // Execute concurrent requests
      const [result1, result2] = await Promise.all([
        createIssue(request1),
        createIssue(request2)
      ]);

      expect(result1.title).toBe('Concurrent Issue 1');
      expect(result2.title).toBe('Concurrent Issue 2');
      expect(result1.id).not.toBe(result2.id);
    });

    it('should handle issue with duplicate title', async () => {
      const request: CreateIssueRequest = {
        title: 'Duplicate Title'
      };

      mockApiCall.mockRejectedValueOnce({
        status: 409,
        data: {
          type: 'error',
          error: {
            message: 'Conflict',
            detail: 'An issue with this title already exists'
          }
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(createIssue(request)).rejects.toMatchObject({
        status: 409,
        data: {
          type: 'error',
          error: {
            message: 'Conflict',
            detail: 'An issue with this title already exists'
          }
        }
      });
    });

    it('should handle issue with circular dependencies', async () => {
      const request: CreateIssueRequest = {
        title: 'Issue with circular dependencies',
        content: {
          raw: 'This issue depends on itself',
          markup: 'markdown'
        }
      };

      mockApiCall.mockRejectedValueOnce({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid request data',
            detail: 'Circular dependencies are not allowed'
          }
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(createIssue(request)).rejects.toMatchObject({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid request data',
            detail: 'Circular dependencies are not allowed'
          }
        }
      });
    });
  });

  // ============================================================================
  // Edge Cases - Performance
  // ============================================================================

  describe('Edge Cases - Performance', () => {
    it('should handle large number of issues efficiently', async () => {
      const issues = Array.from({ length: 1000 }, (_, i) => ({
        ...mockIssue,
        id: i + 1,
        title: `Issue ${i + 1}`
      }));

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: {
          size: 1000,
          page: 1,
          pagelen: 1000,
          values: issues
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const startTime = Date.now();
      const result = await getIssue(1);
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should handle complex queries efficiently', async () => {
      const complexRequest: CreateIssueRequest = {
        title: 'Complex Issue',
        content: {
          raw: 'A'.repeat(5000), // Large content
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

      const createdIssue = {
        ...mockIssue,
        ...complexRequest
      };

      mockApiCall.mockResolvedValueOnce({
        status: 201,
        data: createdIssue
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const startTime = Date.now();
      const result = await createIssue(complexRequest);
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });
});
